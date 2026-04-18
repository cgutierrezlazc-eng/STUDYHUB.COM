"""
Workspaces Athena IA — Endpoints de la asistente académica Athena.

Sub-bloque 2c del módulo Workspaces. Prefijo /workspaces.
Implementa 8 endpoints:
  - POST /workspaces/{doc_id}/athena (consume Claude, con tier_gate)
  - GET  /workspaces/{doc_id}/athena/chats
  - GET  /workspaces/{doc_id}/athena/suggestions
  - PATCH /workspaces/{doc_id}/athena/suggestions/{sug_id}
  - DELETE /workspaces/{doc_id}/athena/suggestions/{sug_id}
  - DELETE /workspaces/{doc_id}/athena/chats
  - GET /workspaces/{doc_id}/athena/usage
  - GET /workspaces/{doc_id}/athena/ping

Decisiones de diseño: ver docs/plans/bloque-2-workspaces/2c-athena.md §2.
"""

from __future__ import annotations

import logging
import os
from collections import defaultdict
from datetime import UTC, datetime, timedelta, timezone
from typing import Any, Optional

from database import (
    AthenaUsage,
    User,
    WorkspaceAthenaChat,
    WorkspaceAthenaSuggestion,
    WorkspaceDocument,
    WorkspaceMember,
    get_db,
)
from fastapi import APIRouter, Depends, HTTPException
from konni_engine import call_konni  # Solo importar, NUNCA modificar konni_engine.py
from middleware import get_current_user
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from tier_gate import (
    CHILE_OFFSET,
    RESET_HOUR,
    _UPGRADE_MESSAGES,
    get_effective_tier,
    get_plan_config,
    get_user_usage,
    get_window_key,
    tier_gate,
)

logger = logging.getLogger("conniku.athena")

router = APIRouter(tags=["workspaces-athena"])

# ─── Constante ATHENA_SYSTEM — Prompt literal del commit d0c0e49 ──────────────
# Extraído del diff del commit d0c0e49 sobre backend/collab_routes.py.
# Se preserva literal, sin modificar acentos ni puntuación.
# Ver docs/plans/bloque-2-workspaces/2c-athena.md §1.2

ATHENA_SYSTEM = """Eres Athena, una experta academica senior que trabaja junto a
estudiantes universitarios latinoamericanos.

REGLAS ABSOLUTAS:
- NUNCA te identifies como IA, inteligencia artificial, asistente
  virtual, chatbot, o modelo de lenguaje.
- Eres Athena, una experta academica humana con decadas de experiencia.
- Hablas en espanol chileno natural, profesional pero cercano.
- Si te preguntan que eres, dices: "Soy Athena, tu compañera de
  redaccion y experta academica."

TU ROL:
- Lees lo que los estudiantes escriben en su documento grupal.
- Corriges gramatica y ortografia en tiempo real, explicando POR QUE
  es un error.
- Si detectas un tema (ej: "combate naval de iquique"), proporcionas
  informacion completa y precisa.
- Complementas ideas: si escriben algo superficial, sugieres como
  profundizar.
- Mejoras la redaccion: propones frases mas claras, academicas, mejor
  estructuradas.
- Si el texto tiene problemas de coherencia o estructura, lo señalas
  con tacto.

FORMATO DE RESPUESTA:
Para analisis del documento, responde en SECCIONES claras:
1. CORRECCIONES — errores de gramatica/ortografia encontrados
2. CONTENIDO — investigacion y datos relevantes al tema del documento
3. SUGERENCIAS — como mejorar la redaccion, profundizar, o
   reestructurar

Para chat directo, responde de forma natural y directa como lo haria
una experta humana.

IMPORTANTE:
- Se concreta y util, no genérica.
- Cita datos reales, fechas, nombres cuando complementes informacion.
- Si no sabes algo con certeza, di "tendria que verificar esto, pero
  por lo que recuerdo..."
- Adapta tu nivel al contexto universitario del documento."""

# ─── Fallbacks canónicos de call_konni (D10) ─────────────────────────────────
# Si call_konni retorna alguno de estos prefijos, la respuesta no es válida.
# El endpoint emite 503 en lugar de devolver el error al usuario como respuesta.

_KONNI_FALLBACK_PREFIXES = (
    "Lo siento, Konni no está disponible",
    "Estoy recibiendo muchas consultas ahora mismo",
    "Konni no puede responder en este momento",
    "Lo siento, tuve un problema al responder",
    "Lo siento, el asistente no está disponible",
)

# ─── Rate limit técnico 20/min en memoria (D14) ───────────────────────────────
# Patrón de auth_routes.py:_rate_limits — contador en memoria por proceso.
# En multi-worker (Render) cada worker tiene su ventana independiente.
# Documentado como riesgo 5.7: efectivo 20*N_workers/min, aceptable para anti-loop.

_minute_limits: dict[str, list[datetime]] = defaultdict(list)

_RATE_LIMIT_PER_MIN = 20


def _check_athena_minute_limit(user_id: str) -> None:
    """Verifica rate limit técnico de 20 req/min.

    Limpia entradas antiguas en cada llamada (previene memory leak §5.12).
    Lanza HTTPException 429 si el usuario supera el límite.
    """
    now = datetime.now(tz=UTC)
    cutoff = now - timedelta(seconds=60)

    # Cleanup: solo mantener requests del último minuto
    _minute_limits[user_id] = [ts for ts in _minute_limits[user_id] if ts > cutoff]

    if len(_minute_limits[user_id]) >= _RATE_LIMIT_PER_MIN:
        raise HTTPException(429, "Demasiadas solicitudes, espera un momento")

    _minute_limits[user_id].append(now)


# ─── Helpers de acceso ────────────────────────────────────────────────────────


def _check_access(doc_id: str, user: User, db: Session) -> WorkspaceDocument:
    """Verifica que el usuario sea miembro del workspace (cualquier rol).

    Retorna el documento. Lanza 404 si no existe, 403 si no es miembro.
    """
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Workspace no encontrado")

    # El owner siempre tiene acceso (campo owner_id en WorkspaceDocument)
    if doc.owner_id == user.id:
        return doc

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == doc_id,
            WorkspaceMember.user_id == user.id,
        )
        .first()
    )
    if not member:
        raise HTTPException(403, "No tienes acceso a este workspace")

    return doc


def _is_fallback_response(text: str) -> bool:
    """Detecta si call_konni devolvió un string de error/fallback (D10)."""
    return any(text.startswith(prefix) for prefix in _KONNI_FALLBACK_PREFIXES)


# ─── Serialización ────────────────────────────────────────────────────────────


def _chat_to_dict(chat: WorkspaceAthenaChat) -> dict:
    """Serializa WorkspaceAthenaChat a dict JSON (camelCase)."""
    return {
        "id": chat.id,
        "role": chat.role,
        "content": chat.content,
        "createdAt": chat.created_at.isoformat() if chat.created_at else "",
    }


def _suggestion_to_dict(sug: WorkspaceAthenaSuggestion) -> dict:
    """Serializa WorkspaceAthenaSuggestion a dict JSON (camelCase)."""
    return {
        "id": sug.id,
        "stagingContent": sug.staging_content,
        "suggestionContent": sug.suggestion_content,
        "status": sug.status,
        "createdAt": sug.created_at.isoformat() if sug.created_at else "",
        "resolvedAt": sug.resolved_at.isoformat() if sug.resolved_at else None,
    }


# ─── Builders de mensajes para call_konni ────────────────────────────────────


def _strip_html(text: str) -> str:
    """Elimina tags HTML básicos de un string (para limpiar content_yjs si viene con markup)."""
    import re

    return re.sub(r"<[^>]+>", "", text or "").strip()


def _build_analyze_messages(doc: WorkspaceDocument) -> list[dict[str, str]]:
    """Construye el mensaje de análisis del documento para Claude."""
    content = _strip_html(doc.content_yjs or "")[:3000]  # Truncar a 3000 chars (D10)
    titulo = doc.title or "Sin título"
    materia = doc.course_name or "Sin asignatura"

    prompt = (
        f"Por favor analiza el siguiente documento académico:\n\n"
        f"TITULO: {titulo}\n"
        f"MATERIA: {materia}\n"
        f"CONTENIDO DEL DOCUMENTO:\n{content or '[Documento vacío]'}\n\n"
        f"Proporciona un análisis completo en las 3 secciones del formato."
    )
    return [{"role": "user", "content": prompt}]


def _build_chat_messages(
    doc: WorkspaceDocument,
    message: str,
    history: list[dict[str, str]],
) -> list[dict[str, str]]:
    """Construye el historial de chat para Claude incluyendo contexto del doc."""
    content = _strip_html(doc.content_yjs or "")[:1500]  # Contexto reducido para chat
    titulo = doc.title or "Sin título"

    # Mensaje de contexto del documento como primer turno del usuario
    context_msg = f"[Contexto del documento: TITULO: {titulo} | CONTENIDO (extracto): {content or '[vacío]'}]"

    messages: list[dict[str, str]] = []

    # Incluir historial previo (últimos 10 turnos según D9 y V1)
    for h in history[-10:]:
        role = h.get("role", "user")
        # Athena en BD → assistant para Claude
        if role == "athena":
            role = "assistant"
        messages.append({"role": role, "content": h.get("content", "")})

    # Si el historial no tiene el contexto del doc, lo inyectamos como primer msg
    if not messages:
        messages.append({"role": "user", "content": context_msg})
        messages.append({"role": "assistant", "content": "Entendido, estoy lista para ayudarte con tu documento."})

    # Agregar el mensaje actual del usuario
    messages.append({"role": "user", "content": message})

    return messages


def _build_suggest_messages(
    doc: WorkspaceDocument,
    staging_text: str,
) -> list[dict[str, str]]:
    """Construye el mensaje para generar una sugerencia sobre un texto."""
    titulo = doc.title or "Sin título"
    materia = doc.course_name or "Sin asignatura"

    prompt = (
        f"El estudiante quiere mejorar el siguiente fragmento de su documento:\n\n"
        f"TITULO DEL DOCUMENTO: {titulo}\n"
        f"MATERIA: {materia}\n\n"
        f"TEXTO ORIGINAL:\n{staging_text[:2000]}\n\n"
        f"Por favor proporciona una versión mejorada de este texto: "
        f"correcciones gramaticales, mejor redacción académica, y mayor profundidad. "
        f"Entrega solo el texto mejorado, sin explicaciones adicionales."
    )
    return [{"role": "user", "content": prompt}]


def _register_usage(
    db: Session,
    user_id: str,
    workspace_id: str,
    action: str,
) -> None:
    """Registra una llamada exitosa en AthenaUsage (D4).

    tokens_input y tokens_output son 0 en 2c (riesgo 5.9 documentado).
    call_konni no expone usage — extender en 2d si se necesita.
    """
    usage = AthenaUsage(
        user_id=user_id,
        workspace_id=workspace_id,
        action=action,
        tokens_input=0,
        tokens_output=0,
        created_at=datetime.utcnow(),
    )
    db.add(usage)
    db.commit()


# ─── Modelos Pydantic de entrada ──────────────────────────────────────────────


class AthenaRequest(BaseModel):
    """Body para POST /workspaces/{doc_id}/athena."""

    action: str = Field(..., description="analyze | chat | suggest")
    data: dict[str, Any] = Field(default_factory=dict)


class PatchSuggestionRequest(BaseModel):
    """Body para PATCH /workspaces/{doc_id}/athena/suggestions/{id}."""

    status: str = Field(..., description="applied | modified | rejected")
    new_content: Optional[str] = Field(None, description="Solo para status=modified")


# ─── Dependency de tier gate para athena_workspace ──────────────────────────
# Función a nivel de módulo para poder hacer override en tests (D13).
# tier_gate("athena_workspace") evalúa en módulo-load time y devuelve un
# Depends; lo capturamos en una variable para que dependency_overrides funcione.

_athena_tier_gate_dep = tier_gate("athena_workspace")


# ─── Endpoint principal: POST /workspaces/{doc_id}/athena ────────────────────


@router.post("/workspaces/{doc_id}/athena")
def post_athena(
    doc_id: str,
    body: AthenaRequest,
    user: User = _athena_tier_gate_dep,
    db: Session = Depends(get_db),
) -> dict:
    """Endpoint principal de Athena IA.

    Acepta actions: analyze, chat, suggest.
    Aplica rate limit técnico 20/min ANTES del tier_gate (ya aplicado vía Depends).
    Registra AthenaUsage solo si la llamada a Claude es exitosa.
    Para chat: persiste WorkspaceAthenaChat (2 filas: user + athena).
    Para suggest: persiste WorkspaceAthenaSuggestion (status=pending).
    """
    # Rate limit técnico 20/min (D14) — ocurre DESPUÉS del tier_gate
    # (el tier_gate ya validó el cupo diario; el rate técnico es anti-loop)
    _check_athena_minute_limit(str(user.id))

    doc = _check_access(doc_id, user, db)

    action = body.action
    data = body.data

    # Validar action
    if action not in ("analyze", "chat", "suggest"):
        raise HTTPException(400, f"Acción desconocida: '{action}'. Usa analyze, chat o suggest")

    # Validar datos requeridos por action
    if action == "chat":
        message = data.get("message", "").strip()
        if not message:
            raise HTTPException(400, "El campo 'message' es requerido para action=chat")

    if action == "suggest":
        staging_text = data.get("staging_text", "").strip()
        if not staging_text:
            raise HTTPException(400, "El campo 'staging_text' es requerido para action=suggest")

    # Construir mensajes según la acción
    if action == "analyze":
        messages = _build_analyze_messages(doc)
    elif action == "chat":
        history = data.get("history", [])
        messages = _build_chat_messages(doc, message, history)  # type: ignore[arg-type]
    else:  # suggest
        messages = _build_suggest_messages(doc, staging_text)  # type: ignore[arg-type]

    # Llamar a Claude vía call_konni (D1 — NO crear cliente propio)
    response_text = call_konni(ATHENA_SYSTEM, messages)

    # Detectar fallback de Claude (D10)
    if _is_fallback_response(response_text):
        logger.warning(
            "Athena: call_konni returned fallback response for user=%s action=%s",
            user.id,
            action,
        )
        raise HTTPException(
            503,
            "Athena no está disponible en este momento. Escribe a contacto@conniku.com",
        )

    # Persistir según la acción (D4)
    result: dict[str, Any] = {"response": response_text, "action": action}

    if action == "chat":
        # Insertar 2 filas: user + athena
        db.add(
            WorkspaceAthenaChat(
                workspace_id=doc_id,
                user_id=str(user.id),
                role="user",
                content=message,  # type: ignore[arg-type]
                created_at=datetime.utcnow(),
            )
        )
        db.add(
            WorkspaceAthenaChat(
                workspace_id=doc_id,
                user_id=str(user.id),
                role="athena",
                content=response_text,
                created_at=datetime.utcnow(),
            )
        )
        db.commit()

    elif action == "suggest":
        sug = WorkspaceAthenaSuggestion(
            workspace_id=doc_id,
            user_id=str(user.id),
            staging_content=staging_text,  # type: ignore[arg-type]
            suggestion_content=response_text,
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(sug)
        db.commit()
        db.refresh(sug)
        result["suggestion_id"] = sug.id

    # Registrar AthenaUsage solo si exitoso (D4)
    _register_usage(db, str(user.id), doc_id, action)

    return result


# ─── GET /workspaces/{doc_id}/athena/chats ───────────────────────────────────


@router.get("/workspaces/{doc_id}/athena/chats")
def get_athena_chats(
    doc_id: str,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Historial privado de chat del usuario con Athena en este documento."""
    _check_access(doc_id, user, db)

    chats = (
        db.query(WorkspaceAthenaChat)
        .filter(
            WorkspaceAthenaChat.workspace_id == doc_id,
            WorkspaceAthenaChat.user_id == str(user.id),
        )
        .order_by(WorkspaceAthenaChat.id.asc())
        .limit(limit)
        .all()
    )

    return {"chats": [_chat_to_dict(c) for c in chats]}


# ─── GET /workspaces/{doc_id}/athena/suggestions ─────────────────────────────


@router.get("/workspaces/{doc_id}/athena/suggestions")
def get_athena_suggestions(
    doc_id: str,
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Lista las sugerencias de Athena del usuario en este documento."""
    _check_access(doc_id, user, db)

    query = db.query(WorkspaceAthenaSuggestion).filter(
        WorkspaceAthenaSuggestion.workspace_id == doc_id,
        WorkspaceAthenaSuggestion.user_id == str(user.id),
    )

    if status:
        query = query.filter(WorkspaceAthenaSuggestion.status == status)

    suggestions = query.order_by(WorkspaceAthenaSuggestion.id.desc()).all()

    return {"suggestions": [_suggestion_to_dict(s) for s in suggestions]}


# ─── PATCH /workspaces/{doc_id}/athena/suggestions/{sug_id} ──────────────────


@router.patch("/workspaces/{doc_id}/athena/suggestions/{sug_id}")
def patch_athena_suggestion(
    doc_id: str,
    sug_id: int,
    body: PatchSuggestionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Cambia el estado de una sugerencia: applied, modified o rejected."""
    _check_access(doc_id, user, db)

    valid_statuses = ("applied", "modified", "rejected")
    if body.status not in valid_statuses:
        raise HTTPException(400, f"Estado inválido. Usa: {', '.join(valid_statuses)}")

    sug = (
        db.query(WorkspaceAthenaSuggestion)
        .filter(
            WorkspaceAthenaSuggestion.id == sug_id,
            WorkspaceAthenaSuggestion.workspace_id == doc_id,
            WorkspaceAthenaSuggestion.user_id == str(user.id),
        )
        .first()
    )

    if not sug:
        raise HTTPException(404, "Sugerencia no encontrada")

    sug.status = body.status
    sug.resolved_at = datetime.utcnow()

    if body.status == "modified" and body.new_content:
        sug.suggestion_content = body.new_content

    db.commit()
    db.refresh(sug)

    return _suggestion_to_dict(sug)


# ─── DELETE /workspaces/{doc_id}/athena/suggestions/{sug_id} ─────────────────


@router.delete("/workspaces/{doc_id}/athena/suggestions/{sug_id}")
def delete_athena_suggestion(
    doc_id: str,
    sug_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Borra una sugerencia del historial del usuario."""
    _check_access(doc_id, user, db)

    sug = (
        db.query(WorkspaceAthenaSuggestion)
        .filter(
            WorkspaceAthenaSuggestion.id == sug_id,
            WorkspaceAthenaSuggestion.workspace_id == doc_id,
            WorkspaceAthenaSuggestion.user_id == str(user.id),
        )
        .first()
    )

    if not sug:
        raise HTTPException(404, "Sugerencia no encontrada")

    db.delete(sug)
    db.commit()

    return {"deleted": True, "id": sug_id}


# ─── DELETE /workspaces/{doc_id}/athena/chats ────────────────────────────────


@router.delete("/workspaces/{doc_id}/athena/chats")
def delete_athena_chats(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Borra todo el historial de chat del usuario con Athena en este documento."""
    _check_access(doc_id, user, db)

    deleted = (
        db.query(WorkspaceAthenaChat)
        .filter(
            WorkspaceAthenaChat.workspace_id == doc_id,
            WorkspaceAthenaChat.user_id == str(user.id),
        )
        .delete()
    )
    db.commit()

    return {"deleted": True, "count": deleted}


# ─── GET /workspaces/{doc_id}/athena/usage ───────────────────────────────────


@router.get("/workspaces/{doc_id}/athena/usage")
def get_athena_usage(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Retorna cuota actual de Athena del usuario: used, limit, remaining, resets_at."""
    _check_access(doc_id, user, db)

    tier = get_effective_tier(user)
    plan = get_plan_config(tier)
    ai_config = plan.get("ai", {})
    feature_config = ai_config.get("athena_workspace", {"limit": 0, "window": "daily"})

    limit = feature_config.get("limit", 0)
    window = feature_config.get("window", "daily")
    window_key = get_window_key(window)

    usage_data = get_user_usage(db, str(user.id), "athena_workspace", window)
    used = usage_data.get("used", 0)

    # Calcular remaining
    if limit == -1:
        remaining = -1  # Ilimitado
    elif limit == 0:
        remaining = 0
    else:
        remaining = max(0, limit - used)

    # Calcular resets_at (próximo reset a las 6:00 AM Chile)
    chile_now = datetime.now(tz=UTC) + CHILE_OFFSET
    if chile_now.hour >= RESET_HOUR:
        next_reset = chile_now.replace(hour=RESET_HOUR, minute=0, second=0, microsecond=0) + timedelta(days=1)
    else:
        next_reset = chile_now.replace(hour=RESET_HOUR, minute=0, second=0, microsecond=0)
    # Convertir de vuelta a UTC
    next_reset_utc = next_reset - CHILE_OFFSET

    return {
        "plan": tier,
        "used": used,
        "limit": limit,
        "remaining": remaining,
        "window_key": window_key,
        "resets_at": next_reset_utc.isoformat(),
    }


# ─── GET /workspaces/{doc_id}/athena/ping ────────────────────────────────────


@router.get("/workspaces/{doc_id}/athena/ping")
def get_athena_ping(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Ping de estado de Athena.

    Verifica:
    1. Que el usuario tenga acceso al documento.
    2. Que ANTHROPIC_API_KEY esté configurada.

    Retorna {status: 'ok', claude_available: bool}.
    Si el usuario no tiene acceso al doc → 403.
    """
    _check_access(doc_id, user, db)

    # Verificar disponibilidad de la API key (mismo lookup que konni_engine)
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        # Intentar desde config.json (mismo fallback de konni_engine)
        try:
            import json
            from pathlib import Path

            from database import DATA_DIR  # type: ignore[attr-defined]

            config_file = DATA_DIR / "config.json"
            if config_file.exists():
                config = json.loads(config_file.read_text())
                api_key = config.get("anthropic_api_key", "")
        except Exception:
            pass

    claude_available = bool(api_key)

    return {
        "status": "ok",
        "claude_available": claude_available,
    }
