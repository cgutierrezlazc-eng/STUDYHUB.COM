# ruff: noqa: UP045
"""
TierGate — Sistema centralizado de control de acceso por tier.
Archivo independiente. No modifica ningun archivo existente.

Usa shared/tier-limits.json como fuente de verdad.
Tabla user_feature_usage para contadores atomicos.
FastAPI Depends para enforcement en endpoints.
"""

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from database import Base, engine, get_db
from fastapi import Depends, HTTPException
from middleware import get_current_user
from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# MODELO — Tabla de contadores de uso por feature
# ═══════════════════════════════════════════════════════════════


class UserFeatureUsage(Base):
    __tablename__ = "user_feature_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(16), nullable=False)
    feature = Column(String(50), nullable=False)
    window_key = Column(String(20), nullable=False)
    count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "feature", "window_key", name="uq_usage_user_feature_window"),
        Index("ix_usage_user_feature_window", "user_id", "feature", "window_key"),
    )


# Crear tabla si no existe (con manejo de error para cold starts)
try:
    UserFeatureUsage.__table__.create(engine, checkfirst=True)
except Exception as _e:
    logger.warning("Could not create user_feature_usage table: %s", _e)

# ═══════════════════════════════════════════════════════════════
# CONFIGURACION — Carga desde shared/tier-limits.json
# ═══════════════════════════════════════════════════════════════

_CONFIG_PATH = Path(__file__).parent.parent / "shared" / "tier-limits.json"
_CONFIG: dict = {}


def _load_config() -> dict:
    global _CONFIG
    if not _CONFIG:
        try:
            _CONFIG = json.loads(_CONFIG_PATH.read_text())
        except Exception as e:
            logger.error("CRITICAL: Failed to load tier-limits.json: %s", e)
            # FAIL-CLOSED: si no hay config, bloquear todo excepto lo minimo
            _CONFIG = {
                "plans": {
                    "free": {
                        "ai": {feature: {"limit": 0, "window": "daily"} for feature in [
                            "chat_messages", "guide", "quiz", "flashcards", "summary",
                            "concept_map", "study_plan", "exam_predictor", "math_scan",
                            "video_youtube", "cv_coach", "search_ai", "konni_coach",
                            "support_chat",
                        ]},
                        "features": {},
                        "limits": {"max_subjects": 1, "storage_bytes": 0},
                    },
                    "pro": {
                        "ai": {feature: {"limit": 0, "window": "daily"} for feature in [
                            "chat_messages", "guide", "quiz", "flashcards", "summary",
                            "concept_map", "study_plan", "exam_predictor", "math_scan",
                            "video_youtube", "cv_coach", "search_ai", "konni_coach",
                            "support_chat",
                        ]},
                        "features": {},
                        "limits": {"max_subjects": 1, "storage_bytes": 0},
                    },
                },
            }
    return _CONFIG


def get_plan_config(tier: str) -> dict:
    """Retorna la configuracion completa de un plan."""
    config = _load_config()
    if tier == "owner":
        tier = "pro"
    return config.get("plans", {}).get(tier, config.get("plans", {}).get("free", {}))


# ═══════════════════════════════════════════════════════════════
# WINDOW KEY — Calcula el periodo de tiempo para contadores
# Reset a las 6:00 AM hora Chile
# ═══════════════════════════════════════════════════════════════

CHILE_OFFSET = timedelta(hours=-3)  # UTC-3 (invierno Chile)
RESET_HOUR = 6  # 6:00 AM Chile


def _get_chile_now() -> datetime:
    """Hora actual en Chile (UTC-3)."""
    return datetime.now(tz=timezone.utc) + CHILE_OFFSET  # noqa: UP017 — UTC alias no existe en Python 3.9


def get_window_key(window_type: str) -> str:
    """Genera la clave de ventana temporal para contadores."""
    chile_now = _get_chile_now()

    # Si es antes de las 6 AM Chile, pertenece al periodo anterior
    if chile_now.hour < RESET_HOUR:
        chile_now -= timedelta(days=1)

    if window_type == "daily":
        return chile_now.strftime("%Y-%m-%d")
    if window_type == "weekly":
        return chile_now.strftime("%G-W%V")
    if window_type == "monthly":
        return chile_now.strftime("%Y-%m")
    if window_type == "total":
        return "TOTAL"
    return chile_now.strftime("%Y-%m-%d")


# ═══════════════════════════════════════════════════════════════
# COUNTER — Incremento atomico (race-condition safe)
# ═══════════════════════════════════════════════════════════════


def check_and_increment(
    db: Session,
    user_id: str,
    feature: str,
    limit: int,
    window_key: str,
) -> tuple[bool, int]:
    """
    Verifica e incrementa el contador atomicamente.
    Retorna (permitido, restantes).
    Si limit == -1, siempre permite (ilimitado).
    """
    if limit == -1:
        return True, -1

    if limit == 0:
        return False, 0

    try:
        row = db.execute(
            text("""
                INSERT INTO user_feature_usage (user_id, feature, window_key, count, created_at, updated_at)
                VALUES (:uid, :feat, :wk, 1, NOW(), NOW())
                ON CONFLICT (user_id, feature, window_key)
                DO UPDATE SET count = user_feature_usage.count + 1, updated_at = NOW()
                WHERE user_feature_usage.count < :lim
                RETURNING count
            """),
            {"uid": user_id, "feat": feature, "wk": window_key, "lim": limit},
        ).fetchone()

        if row is None:
            db.rollback()
            return False, 0

        db.commit()
        return True, limit - row[0]

    except Exception as e:
        db.rollback()
        logger.error("TierGate counter error for %s/%s: %s", user_id, feature, e)
        # FAIL-CLOSED: si hay error de DB, bloquear (no permitir gratis)
        raise HTTPException(503, "Servicio temporalmente no disponible") from e


# ═══════════════════════════════════════════════════════════════
# GET TIER — Determina el tier efectivo del usuario
# ═══════════════════════════════════════════════════════════════


def get_effective_tier(user) -> str:
    """Determina el tier efectivo del usuario."""
    status = getattr(user, "subscription_status", "")
    tier = getattr(user, "subscription_tier", "free")

    if status == "owner":
        return "pro"
    if tier == "pro" and status in ("active", "trial"):
        return "pro"
    return "free"


# ═══════════════════════════════════════════════════════════════
# TIER_GATE — FastAPI Depends para enforcement en endpoints
# ═══════════════════════════════════════════════════════════════

# Mensajes de upgrade por feature
_UPGRADE_MESSAGES = {
    "chat_messages": "Has alcanzado el limite de mensajes de hoy",
    "guide": "Has alcanzado el limite de guias esta semana",
    "quiz": "Has alcanzado el limite de quizzes esta semana",
    "flashcards": "Has alcanzado el limite de flashcards esta semana",
    "summary": "Has alcanzado el limite de resumenes esta semana",
    "concept_map": "Mapas conceptuales disponibles con Conniku PRO",
    "study_plan": "Planes de estudio disponibles con Conniku PRO",
    "exam_predictor": "Predictor de examenes disponible con Conniku PRO",
    "math_scan": "Has alcanzado el limite de escaneos hoy",
    "video_youtube": "Transcripcion de videos disponible con Conniku PRO",
    "video_upload": "Subir videos disponible con Conniku PRO",
    "audio_to_notes": "Audio a notas disponible con Conniku PRO",
    "exam_night": "Modo noche de examen disponible con Conniku PRO",
    "explain_visual": "Explicaciones visuales disponibles con Conniku PRO",
    "cv_coach": "Has alcanzado el limite de analisis de CV",
    "search_ai": "Resumen de busqueda disponible con Conniku PRO",
    "biblioteca_clone": "Clonar a asignatura disponible con Conniku PRO",
    "konni_coach": "Konni Coach ilimitado con Conniku PRO",
    "support_chat": "Has alcanzado el limite de mensajes de soporte hoy",
}


def tier_gate(feature: str):
    """
    FastAPI Dependency que verifica limites de tier.
    Uso: user = tier_gate("quiz") en el endpoint.
    """
    from database import User

    def _dependency(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        tier = get_effective_tier(user)
        plan = get_plan_config(tier)
        ai_config = plan.get("ai", {})
        features_config = plan.get("features", {})

        # Verificar si es una feature booleana (on/off)
        if feature in features_config:
            if not features_config[feature]:
                raise HTTPException(
                    403,
                    _UPGRADE_MESSAGES.get(feature, "Funcion disponible con Conniku PRO"),
                )
            return user

        # Verificar si es una feature con contador (rate limit)
        feature_config = ai_config.get(feature)
        if feature_config is None:
            # Feature no configurada — permitir (no gatear lo desconocido)
            return user

        # Features booleanas dentro de ai (como daily_summary, auto_tag)
        if isinstance(feature_config, bool):
            if not feature_config:
                raise HTTPException(403, _UPGRADE_MESSAGES.get(feature, "No disponible"))
            return user

        limit = feature_config.get("limit", 0)
        window = feature_config.get("window", "daily")

        # Ilimitado
        if limit == -1:
            return user

        # Sin acceso
        if limit == 0:
            raise HTTPException(
                403,
                _UPGRADE_MESSAGES.get(feature, "Funcion disponible con Conniku PRO"),
            )

        # Verificar y incrementar contador
        window_key = get_window_key(window)
        allowed, remaining = check_and_increment(
            db, str(user.id), feature, limit, window_key,
        )

        if not allowed:
            raise HTTPException(
                429,
                _UPGRADE_MESSAGES.get(feature, "Limite alcanzado. Actualiza a Conniku PRO."),
            )

        return user

    return Depends(_dependency)


# ═══════════════════════════════════════════════════════════════
# GET USAGE — Para que el frontend muestre contadores
# ═══════════════════════════════════════════════════════════════


def get_user_usage(db: Session, user_id: str, feature: str, window: str) -> dict:
    """Retorna el uso actual de una feature para un usuario."""
    window_key = get_window_key(window)
    try:
        row = db.execute(
            text("""
                SELECT count FROM user_feature_usage
                WHERE user_id = :uid AND feature = :feat AND window_key = :wk
            """),
            {"uid": user_id, "feat": feature, "wk": window_key},
        ).fetchone()
    except Exception:
        row = None

    return {
        "feature": feature,
        "used": row[0] if row else 0,
        "window_key": window_key,
    }
