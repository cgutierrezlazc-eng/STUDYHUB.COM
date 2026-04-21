"""Endpoints de consentimiento de cookies.

Bloque: bloque-cookie-consent-banner-v1 — Pieza 1.

Endpoints:
- POST /api/consent/cookies      — registra consentimiento del visitante.
- GET  /api/consent/cookies/policy-version — versión y hash canónico vigente.
- GET  /api/consent/cookies/{visitor_uuid} — lee el consentimiento activo.

Referencia legal:
- GDPR Art. 7(1): demostrabilidad del consentimiento (Orange Romania C-61/19).
- GDPR Art. 7(3): retiro del consentimiento tan fácil como otorgarlo.
- Directiva 2002/58/CE Art. 5(3) ePrivacy: consentimiento previo para no
  esenciales.
- Ley 19.628 Art. 4° Chile: información al titular al momento de recolectar.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated

from constants.legal_versions import (
    COOKIE_CONSENT_CATEGORIES,
    COOKIE_CONSENT_POLICY_HASH,
    COOKIE_CONSENT_POLICY_VERSION,
)
from database import CookieConsent, get_db
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

logger = logging.getLogger("conniku.cookie_consent")

router = APIRouter(prefix="/api/consent", tags=["consent"])

# Tiempo de retención para registros de evidencia legal: 5 años.
# Fundamento: GDPR Art. 17(3)(e) — ejercicio de defensa legal.
# Decisión Cristian batch 2026-04-20: retención 5 años alineado con
# declaración de edad.
_RETENTION_YEARS = 5

# Retención en días (5 × 365 + 1 bisiesto aprox.).
_RETENTION_DAYS = 5 * 365


# ─── Schemas Pydantic ─────────────────────────────────────────────────────────


class CookieConsentCreate(BaseModel):
    """Payload para registrar consentimiento de cookies.

    Validación según GDPR Art. 4(11): libre, específico, informado, inequívoco.
    """

    visitor_uuid: str = Field(..., min_length=36, max_length=36, description="UUID v4 del visitante anónimo.")
    categories_accepted: list[str] = Field(
        ...,
        min_length=1,
        description="Categorías aceptadas. 'necessary' siempre requerida.",
    )
    policy_version: str = Field(..., min_length=1, max_length=20)
    policy_hash: str = Field(..., min_length=64, max_length=64)
    origin: str = Field(
        default="banner_initial",
        description="Origen del consentimiento: banner_initial, settings_update, dnt_auto, iframe_auto.",
    )
    user_timezone: str | None = Field(default=None, max_length=64)
    user_agent_hint: str | None = Field(default=None, description="User-Agent desde el cliente (informativo).")

    @field_validator("categories_accepted")
    @classmethod
    def validate_categories(cls, v: list[str]) -> list[str]:
        """Valida que todas las categorías sean del set permitido y que
        'necessary' esté siempre incluida."""
        valid = set(COOKIE_CONSENT_CATEGORIES)
        for cat in v:
            if cat not in valid:
                raise ValueError(f"Categoría inválida: {cat!r}. Válidas: {sorted(valid)}")
        if "necessary" not in v:
            raise ValueError("La categoría 'necessary' debe estar siempre incluida.")
        return v

    @field_validator("origin")
    @classmethod
    def validate_origin(cls, v: str) -> str:
        valid_origins = {"banner_initial", "settings_update", "dnt_auto", "iframe_auto"}
        if v not in valid_origins:
            raise ValueError(f"Origen inválido: {v!r}. Válidos: {sorted(valid_origins)}")
        return v


class CookieConsentResponse(BaseModel):
    """Respuesta serializada de un registro de consentimiento."""

    id: int
    visitor_uuid: str
    user_id: str | None
    accepted_at_utc: datetime
    policy_version: str
    policy_hash: str
    categories_accepted: list[str]
    origin: str
    retention_expires_at: datetime
    is_current_policy: bool
    is_expired: bool

    model_config = {"from_attributes": True}


class PolicyVersionResponse(BaseModel):
    """Respuesta del endpoint de versión de política vigente."""

    version: str
    hash: str


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _consent_to_response(consent: CookieConsent) -> CookieConsentResponse:
    """Convierte un ORM CookieConsent a CookieConsentResponse."""
    now = datetime.now(UTC).replace(tzinfo=None)
    is_current = consent.policy_hash == COOKIE_CONSENT_POLICY_HASH
    is_expired = consent.retention_expires_at < now

    categories: list[str] = []
    try:
        categories = json.loads(consent.categories_accepted)
    except (json.JSONDecodeError, TypeError):
        categories = []

    return CookieConsentResponse(
        id=consent.id,
        visitor_uuid=consent.visitor_uuid,
        user_id=consent.user_id,
        accepted_at_utc=consent.accepted_at_utc,
        policy_version=consent.policy_version,
        policy_hash=consent.policy_hash,
        categories_accepted=categories,
        origin=consent.origin,
        retention_expires_at=consent.retention_expires_at,
        is_current_policy=is_current,
        is_expired=is_expired,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/cookies", status_code=201, response_model=CookieConsentResponse)
def post_cookie_consent(
    payload: CookieConsentCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> CookieConsentResponse:
    """Registra consentimiento de cookies del visitante.

    I-08: si el policy_hash del payload no coincide con el hash canónico
    vigente, responde 409 Conflict con el hash actual para que el frontend
    re-muestre el banner actualizado.

    La IP real se obtiene del header del request, no del payload, para
    garantizar autenticidad del registro probatorio.
    """
    # I-08: validar que el hash del payload corresponde a la política vigente.
    if payload.policy_hash != COOKIE_CONSENT_POLICY_HASH:
        logger.warning(
            "POST /api/consent/cookies rechazado: policy_hash obsoleto visitor_uuid=%s recibido=%s vigente=%s",
            payload.visitor_uuid,
            payload.policy_hash[:8],
            COOKIE_CONSENT_POLICY_HASH[:8],
        )
        raise HTTPException(
            status_code=409,
            detail={
                "message": "La versión de la política de cookies ha cambiado. Muestra el banner actualizado.",
                "current_version": COOKIE_CONSENT_POLICY_VERSION,
                "current_hash": COOKIE_CONSENT_POLICY_HASH,
            },
        )

    # IP real desde el header (no desde el payload).
    client_ip: str | None = None
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()[:64]
    elif request.client:
        client_ip = request.client.host[:64]

    # User-Agent definitivo desde el header del request.
    real_ua: str | None = request.headers.get("User-Agent")

    now = datetime.now(UTC).replace(tzinfo=None)
    retention_expires = now + timedelta(days=_RETENTION_DAYS)

    consent = CookieConsent(
        visitor_uuid=payload.visitor_uuid,
        accepted_at_utc=now,
        user_timezone=payload.user_timezone,
        client_ip=client_ip,
        user_agent=real_ua,
        policy_version=payload.policy_version,
        policy_hash=payload.policy_hash,
        categories_accepted=json.dumps(payload.categories_accepted),
        origin=payload.origin,
        retention_expires_at=retention_expires,
    )

    db.add(consent)
    db.commit()
    db.refresh(consent)

    logger.info(
        "Consentimiento de cookies registrado: id=%s visitor_uuid=%s categories=%s origin=%s",
        consent.id,
        consent.visitor_uuid,
        payload.categories_accepted,
        payload.origin,
    )

    return _consent_to_response(consent)


@router.get("/cookies/policy-version", response_model=PolicyVersionResponse)
def get_policy_version() -> PolicyVersionResponse:
    """Retorna la versión y hash canónico de la política de cookies vigente.

    I-18: el frontend puede consultar este endpoint para verificar si el
    consentimiento almacenado localmente sigue siendo válido.
    """
    return PolicyVersionResponse(
        version=COOKIE_CONSENT_POLICY_VERSION,
        hash=COOKIE_CONSENT_POLICY_HASH,
    )


@router.get("/cookies/{visitor_uuid}", response_model=CookieConsentResponse)
def get_cookie_consent(
    visitor_uuid: str,
    db: Annotated[Session, Depends(get_db)],
) -> CookieConsentResponse:
    """Retorna el consentimiento activo más reciente del visitor_uuid.

    Responde 404 si no existe registro previo para ese UUID.

    El frontend usa is_current_policy e is_expired para decidir si debe
    mostrar el banner de nuevo.
    """
    consent = (
        db.query(CookieConsent)
        .filter(
            CookieConsent.visitor_uuid == visitor_uuid,
            CookieConsent.revoked_at_utc.is_(None),
        )
        .order_by(CookieConsent.accepted_at_utc.desc())
        .first()
    )

    if consent is None:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró consentimiento para visitor_uuid={visitor_uuid!r}",
        )

    return _consent_to_response(consent)
