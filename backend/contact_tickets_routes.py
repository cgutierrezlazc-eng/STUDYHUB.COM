"""Endpoints del sistema de tickets de contacto — bloque-contact-tickets-v1.

Exposición pública:
  POST /contact/tickets       — crea ticket, envia 2 emails, rate-limit 5/h/IP,
                                honeypot anti-bot (silent accept).

Exposición admin (require_admin):
  GET  /admin/contact/tickets           — lista paginada con filtros
  GET  /admin/contact/tickets/{id}      — detalle + mensajes del hilo
  POST /admin/contact/tickets/{id}/reply  — responde, cambia status, envía email
  PATCH /admin/contact/tickets/{id}/status — cambio manual de estado

Decisiones Cristian 2026-04-22: 1B 2A 3A 4-5años 5A 6A 7C 8A CORS-A.

Referencia legal:
- GDPR Art. 6(1)(a), 7(1), 17(3)(e), 5(1)(c), 5(1)(e)
  URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
- Ley 19.628 (Chile) Art. 4° — información al titular al momento de recolectar.
  URL: https://www.bcn.cl/leychile/navegar?idNorma=141599
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
- Art. 2515 Código Civil Chile — prescripción ordinaria 5 años.
  URL: https://www.bcn.cl/leychile/navegar?idNorma=172986
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import Literal, Optional

from database import ContactTicket, ContactTicketMessage, User, gen_id, get_db
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware import require_admin
from notifications import _email_template, _send_email_async
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger("conniku.contact_tickets")

router = APIRouter()

# ─── Constantes ───────────────────────────────────────────────────────────────

# Importadas aquí para evitar circular imports.
# Si constants/ no está en el path, se resuelve via sys.path del conftest.
from constants.contact_routing import CONTACT_ROUTES

# Hash canónico de Privacy Policy vigente (PRIVACY_HASH de legal_versions.py).
# Validado en cada POST para garantizar que el usuario vio el texto actual.
# Referencia: GDPR Art. 7(1) — demostrabilidad del consentimiento.
from constants.legal_versions import PRIVACY_HASH, PRIVACY_VERSION

# Límite de tickets por IP por hora (decisión D-T7 C del plan).
RATE_LIMIT_PER_HOUR = 5

# Frontend URL para links en emails
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://conniku.com")


# ─── Contador atómico de tickets (SQLite-compatible) ─────────────────────────

_ticket_counter: int = 0


def _next_ticket_number(db: Session) -> str:
    """Genera el próximo ticket_number de forma atómica.

    En Postgres se usaría SELECT nextval('contact_ticket_seq').
    Para compatibilidad con SQLite en tests, usamos un MAX+1 sobre la propia tabla.
    En producción Postgres el MAX+1 tiene riesgo de race condition mínimo dado
    el volumen esperado; si se necesita garantía absoluta usar la secuencia del
    SQL de migración.

    Formato: CNT-{año}-{seq:06d}
    Decisión D-T3-A: contador global sin reinicio anual; año solo en formato.
    """
    try:
        # Intentar usar secuencia Postgres (producción)
        from sqlalchemy import text

        result = db.execute(text("SELECT nextval('contact_ticket_seq')")).scalar()
        seq = int(result)
    except Exception:
        # Fallback para SQLite en tests: contar filas existentes + 1.
        # Suficiente para tests (no hay concurrencia real en SQLite in-memory).
        count = db.query(func.count(ContactTicket.id)).scalar() or 0
        seq = count + 1

    year = datetime.utcnow().year
    return f"CNT-{year}-{seq:06d}"


# ─── Pydantic schemas ─────────────────────────────────────────────────────────


class ContactTicketCreate(BaseModel):
    """Payload de creación de ticket de contacto (endpoint público).

    El campo honeypot_field es un input oculto en el formulario HTML.
    Bots lo llenan; humanos lo dejan vacío. Si viene con valor,
    se retorna 201 silencioso sin persistir ni enviar emails.
    """

    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    reason: Literal["comercial", "universidad", "prensa", "legal", "seguridad", "otro"]
    org: Optional[str] = Field(default=None, max_length=120)
    message: str = Field(..., min_length=20, max_length=2000)
    consent_hash: str = Field(..., min_length=1)
    honeypot_field: str = Field(default="")
    user_timezone: Optional[str] = Field(default=None, max_length=64)


class ContactTicketResponse(BaseModel):
    """Respuesta al crear un ticket."""

    ticket_number: str
    created_at: str
    estimated_response: str


class AdminReplyCreate(BaseModel):
    """Payload para responder a un ticket desde el panel admin."""

    response_text: str = Field(..., min_length=10, max_length=5000)


class AdminStatusUpdate(BaseModel):
    """Payload para cambiar el estado de un ticket."""

    status: Literal["open", "in_review", "replied", "closed"]
    resolution_note: Optional[str] = Field(default=None, max_length=2000)


# ─── Helpers de email ─────────────────────────────────────────────────────────


def _build_user_email(ticket: ContactTicket) -> tuple[str, str]:
    """Construye el email de confirmación para el usuario.

    Retorna (subject, html_body).
    Nota: ningún texto menciona 'IA' ni 'inteligencia artificial' (regla CLAUDE.md).
    """
    route = CONTACT_ROUTES.get(ticket.reason, {})
    sla_hours = ticket.sla_hours
    if sla_hours <= 48:
        sla_human = "2 días hábiles"
    elif sla_hours <= 72:
        sla_human = "3 días hábiles"
    elif sla_hours <= 120:
        sla_human = "5 días hábiles"
    else:
        sla_human = "30 días calendario"

    subject = f"Conniku — Tu ticket {ticket.ticket_number} está registrado"
    body = f"""
<p>Hola {ticket.name},</p>

<p>Recibimos tu mensaje. Tu ticket quedó registrado con el número <strong>{ticket.ticket_number}</strong>.</p>

<table style="border-collapse:collapse;margin:16px 0">
  <tr>
    <td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Motivo:</td>
    <td style="padding:4px 0;font-size:13px">{route.get("label", ticket.reason)}</td>
  </tr>
  <tr>
    <td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Tiempo de respuesta esperado:</td>
    <td style="padding:4px 0;font-size:13px">{sla_human}</td>
  </tr>
</table>

<p style="font-size:13px;color:#555">Si necesitas agregar información, responde a este correo — quedará asociado a tu ticket automáticamente.</p>

<p style="font-size:12px;color:#888;margin-top:24px">
  Tus datos serán tratados conforme a nuestra
  <a href="{FRONTEND_URL}/privacy" style="color:#888">Política de Privacidad</a>
  (GDPR Art. 6(1)(a) + Ley 19.628 Art. 4°).
</p>
"""
    html = _email_template(
        title=f"Ticket {ticket.ticket_number} registrado",
        body=body,
        cta_text="",
        cta_url="",
        sender="noreply",
    )
    return subject, html


def _build_team_email(ticket: ContactTicket) -> tuple[str, str]:
    """Construye el email de notificación interna para el equipo Conniku.

    Retorna (subject, html_body).
    """
    route = CONTACT_ROUTES.get(ticket.reason, {})
    subject = f"[Conniku Contacto · {route.get('label', ticket.reason)}] {ticket.ticket_number} · {ticket.name}"

    ua_preview = (ticket.user_agent or "—")[:160]
    consent_hash_preview = ticket.consent_hash[:12] + "…" if ticket.consent_hash else "—"
    org_str = ticket.org or "—"

    body = f"""
<p><strong>Ticket:</strong> {ticket.ticket_number}<br>
<strong>Motivo:</strong> {ticket.reason} — {route.get("label", "")}  |  SLA declarado: {ticket.sla_hours} h<br>
<strong>De:</strong> {ticket.name} &lt;{ticket.email}&gt;<br>
<strong>Organización:</strong> {org_str}<br>
<strong>IP:</strong> {ticket.client_ip or "—"}<br>
<strong>UA:</strong> {ua_preview}{"..." if len(ticket.user_agent or "") > 160 else ""}<br>
<strong>Consent Privacy</strong> v{ticket.consent_version} hash {consent_hash_preview} aceptado {ticket.consent_accepted_at_utc.strftime("%Y-%m-%d %H:%M:%S")} UTC
</p>

<hr style="margin:16px 0">
<p><strong>Mensaje:</strong></p>
<blockquote style="margin:8px 16px;padding:8px;border-left:3px solid #ddd;color:#333">
{ticket.message}
</blockquote>

<hr style="margin:16px 0">
<p style="font-size:12px;color:#888">
Para responder, usa el endpoint admin:<br>
POST /admin/contact/tickets/{ticket.id}/reply<br>
<br>
Por ahora NO se crea auto-outbound desde reply SMTP (Bloque 4 CEO dashboard con IMAP/webhook).
</p>
"""
    html = _email_template(
        title=f"Nuevo ticket: {ticket.ticket_number}",
        body=body,
        cta_text="",
        cta_url="",
        sender="contacto",
    )
    return subject, html


# ─── Helpers de rate-limit ────────────────────────────────────────────────────


def _get_client_ip(request: Request) -> str:
    """Extrae la IP real del cliente desde X-Forwarded-For o client host."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _assert_not_rate_limited(client_ip: str, db: Session) -> None:
    """Lanza 429 si la IP superó el límite de 5 tickets en la última hora.

    Consulta la tabla contact_tickets con índice (client_ip, created_at).
    Decisión D-T7 C del plan: contador en BD por IP/hora.
    """
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    count = (
        db.query(func.count(ContactTicket.id))
        .filter(
            ContactTicket.client_ip == client_ip,
            ContactTicket.created_at >= one_hour_ago,
        )
        .scalar()
        or 0
    )
    if count >= RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Demasiadas solicitudes. Puedes enviar hasta 5 mensajes por hora. Intenta más tarde.",
        )


# ─── Endpoint público: POST /contact/tickets ──────────────────────────────────


@router.post("/contact/tickets", status_code=201)
def create_contact_ticket(
    payload: ContactTicketCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> ContactTicketResponse:
    """Crea un ticket de contacto público.

    Flujo:
    1. Honeypot check: si honeypot_field tiene valor, retorna 201 silencioso sin persistir.
    2. Validar consent_hash contra PRIVACY_HASH vigente → 409 si obsoleto.
    3. Rate-limit 5/hora por IP → 429 si excede.
    4. Crear ticket + mensaje inbound en BD.
    5. Enviar 2 emails: confirmación al usuario + notificación al equipo.
    6. Retornar ticket_number + created_at + estimated_response.

    Referencia legal:
    - GDPR Art. 6(1)(a): consentimiento específico para finalidad "responder consulta".
    - GDPR Art. 7(1): demostrabilidad (consent_version, consent_hash, IP, UA, timestamp).
    - GDPR Art. 5(1)(e): retained_until_utc = created_at + 1825 días.
    - Art. 2515 CC Chile: prescripción ordinaria 5 años.
    """
    # 1. Honeypot: bot detectado → 201 silencioso
    if payload.honeypot_field:
        logger.info("Honeypot detectado, ignorando request silenciosamente.")
        return ContactTicketResponse(
            ticket_number="CNT-0000-000000",
            created_at=datetime.utcnow().isoformat(),
            estimated_response="2 días hábiles",
        )

    # 2. Validar consent_hash vigente
    if payload.consent_hash != PRIVACY_HASH:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "La versión de la Política de Privacidad que aceptaste ya no está vigente. "
                "Recarga la página para ver la versión actual.",
                "current_version": PRIVACY_VERSION,
                "current_hash": PRIVACY_HASH,
            },
        )

    # 3. Rate-limit por IP
    client_ip = _get_client_ip(request)
    _assert_not_rate_limited(client_ip, db)

    # 4. Obtener routing para este motivo
    route = CONTACT_ROUTES[payload.reason]

    # 5. Generar ticket_number y crear ticket
    now = datetime.utcnow()
    ticket_number = _next_ticket_number(db)

    # UA truncado a 512 chars (GDPR Art. 5(1)(c) minimización)
    raw_ua = request.headers.get("User-Agent", "") or ""
    ua_truncated = raw_ua[:512] if raw_ua else None

    ticket = ContactTicket(
        id=gen_id(),
        ticket_number=ticket_number,
        name=payload.name,
        email=payload.email,
        reason=payload.reason,
        org=payload.org,
        message=payload.message,
        status="open",
        routed_to_email=str(route["email"]),
        routed_label=str(route["label"]),
        sla_hours=int(route["sla_hours"]),
        consent_version=PRIVACY_VERSION,
        consent_hash=payload.consent_hash,
        consent_accepted_at_utc=now,
        client_ip=client_ip,
        user_agent=ua_truncated,
        user_timezone=payload.user_timezone,
        # retained_until_utc = created_at + 1825 días (≈5 años)
        # GDPR Art. 17(3)(e) + Art. 2515 CC Chile (prescripción ordinaria 5 años)
        retained_until_utc=now + timedelta(days=1825),
        created_at=now,
        updated_at=now,
    )
    db.add(ticket)

    # Mensaje inbound inicial (snapshot del mensaje original)
    inbound_msg = ContactTicketMessage(
        id=gen_id(),
        ticket_id=ticket.id,
        direction="inbound",
        author_user_id=None,
        author_email=payload.email,
        body=payload.message,
        created_at=now,
    )
    db.add(inbound_msg)
    db.commit()
    db.refresh(ticket)

    # 6. Enviar emails en background
    user_subject, user_html = _build_user_email(ticket)
    _send_email_async(
        to_email=payload.email,
        subject=user_subject,
        html_body=user_html,
        reply_to="contacto@conniku.com",
        email_type="contact_ticket_confirm",
        from_account="noreply",
    )

    team_subject, team_html = _build_team_email(ticket)
    _send_email_async(
        to_email=str(route["email"]),
        subject=team_subject,
        html_body=team_html,
        reply_to=payload.email,
        email_type="contact_ticket_notify",
        from_account="contacto",
    )

    # Calcular estimated_response legible
    sla_h = int(route["sla_hours"])
    if sla_h <= 48:
        estimated = "2 días hábiles"
    elif sla_h <= 72:
        estimated = "3 días hábiles"
    elif sla_h <= 120:
        estimated = "5 días hábiles"
    else:
        estimated = "30 días calendario"

    logger.info(f"Ticket creado: {ticket_number} motivo={payload.reason} ip={client_ip}")
    return ContactTicketResponse(
        ticket_number=ticket.ticket_number,
        created_at=ticket.created_at.isoformat(),
        estimated_response=estimated,
    )


# ─── Endpoints admin ──────────────────────────────────────────────────────────


@router.get("/admin/contact/tickets")
def admin_list_tickets(
    status: Optional[str] = None,
    reason: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Lista paginada de tickets con filtros opcionales.

    Requiere rol admin (require_admin middleware — decisión D-T8 A).
    """
    query = db.query(ContactTicket)

    if status:
        query = query.filter(ContactTicket.status == status)
    if reason:
        query = query.filter(ContactTicket.reason == reason)
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(ContactTicket.created_at >= dt_from)
        except ValueError:
            raise HTTPException(status_code=422, detail="date_from inválido (formato ISO 8601)")
    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(ContactTicket.created_at <= dt_to)
        except ValueError:
            raise HTTPException(status_code=422, detail="date_to inválido (formato ISO 8601)")

    total = query.count()
    items = query.order_by(ContactTicket.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [_ticket_to_dict(t) for t in items],
    }


@router.get("/admin/contact/tickets/{ticket_id}")
def admin_get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Detalle de un ticket con el hilo de mensajes."""
    ticket = db.query(ContactTicket).filter(ContactTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    result = _ticket_to_dict(ticket)
    result["messages"] = [_message_to_dict(m) for m in ticket.ticket_messages]
    return result


@router.post("/admin/contact/tickets/{ticket_id}/reply")
def admin_reply_ticket(
    ticket_id: str,
    payload: AdminReplyCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    """Responde a un ticket: crea mensaje outbound, envía email al usuario y actualiza status.

    - Si el ticket está 'open': cambia a 'replied' y setea first_response_at_utc.
    - Si ya estaba 'replied' o 'in_review': cambia a 'in_review' (seguimiento).
    - first_response_at_utc solo se setea en la primera respuesta.
    """
    ticket = db.query(ContactTicket).filter(ContactTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    now = datetime.utcnow()

    # Determinar nuevo status
    if ticket.status in ("open", "in_review"):
        new_status = "replied"
    else:
        new_status = "in_review"

    # Primer respuesta: setear first_response_at_utc solo si aún no está seteado
    if ticket.first_response_at_utc is None:
        ticket.first_response_at_utc = now

    ticket.status = new_status
    ticket.updated_at = now

    # Crear mensaje outbound
    admin_email = getattr(admin, "email", "admin@conniku.com")
    outbound_msg = ContactTicketMessage(
        id=gen_id(),
        ticket_id=ticket.id,
        direction="outbound",
        author_user_id=admin.id,
        author_email=admin_email,
        body=payload.response_text,
        created_at=now,
    )
    db.add(outbound_msg)
    db.commit()
    db.refresh(ticket)

    # Enviar email al usuario con la respuesta
    subject = f"Conniku — Respuesta a tu ticket {ticket.ticket_number}"
    body = f"""
<p>Hola {ticket.name},</p>

<p>El equipo de Conniku ha respondido a tu ticket <strong>{ticket.ticket_number}</strong>.</p>

<blockquote style="margin:12px 16px;padding:12px;border-left:3px solid #D9FF3A;background:#f9f9f9">
{payload.response_text}
</blockquote>

<p style="font-size:13px;color:#555">
Si tienes más preguntas, responde a este correo y lo agregaremos a tu ticket.
</p>
"""
    html = _email_template(
        title=f"Respuesta a tu ticket {ticket.ticket_number}",
        body=body,
        cta_text="",
        cta_url="",
        sender="contacto",
    )
    _send_email_async(
        to_email=ticket.email,
        subject=subject,
        html_body=html,
        reply_to="contacto@conniku.com",
        email_type="contact_ticket_reply",
        from_account="contacto",
    )

    logger.info(f"Admin reply en ticket {ticket.ticket_number} por {admin_email}")
    return {"ticket_number": ticket.ticket_number, "status": ticket.status}


@router.patch("/admin/contact/tickets/{ticket_id}/status")
def admin_update_status(
    ticket_id: str,
    payload: AdminStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Cambia el estado de un ticket manualmente.

    Si el nuevo status es 'closed', setea resolved_at_utc si aún no está seteado.
    """
    ticket = db.query(ContactTicket).filter(ContactTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    now = datetime.utcnow()
    ticket.status = payload.status
    ticket.updated_at = now

    if payload.status == "closed" and ticket.resolved_at_utc is None:
        ticket.resolved_at_utc = now

    if payload.resolution_note is not None:
        ticket.resolution_note = payload.resolution_note

    db.commit()
    db.refresh(ticket)

    logger.info(f"Status ticket {ticket.ticket_number} cambiado a {payload.status}")
    return {"ticket_number": ticket.ticket_number, "status": ticket.status}


# ─── Helpers de serialización ─────────────────────────────────────────────────


def _ticket_to_dict(ticket: ContactTicket) -> dict:
    """Serializa un ContactTicket a dict para respuesta JSON."""
    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "name": ticket.name,
        "email": ticket.email,
        "reason": ticket.reason,
        "org": ticket.org,
        "status": ticket.status,
        "routed_to_email": ticket.routed_to_email,
        "routed_label": ticket.routed_label,
        "sla_hours": ticket.sla_hours,
        "client_ip": ticket.client_ip,
        "consent_version": ticket.consent_version,
        "first_response_at_utc": ticket.first_response_at_utc.isoformat() if ticket.first_response_at_utc else None,
        "resolved_at_utc": ticket.resolved_at_utc.isoformat() if ticket.resolved_at_utc else None,
        "resolution_note": ticket.resolution_note,
        "retained_until_utc": ticket.retained_until_utc.isoformat() if ticket.retained_until_utc else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
    }


def _message_to_dict(msg: ContactTicketMessage) -> dict:
    """Serializa un ContactTicketMessage a dict para respuesta JSON."""
    return {
        "id": msg.id,
        "direction": msg.direction,
        "author_email": msg.author_email,
        "body": msg.body,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
