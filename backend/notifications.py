"""
Email notification system for Conniku social events.
Supports: friend requests, wall posts, messages, friend request accepted.
Uses a background queue to avoid blocking the main request thread.
"""

import os
import smtplib
import threading
import logging
from queue import Queue
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import Session

from database import get_db, User, Base, gen_id, engine
from middleware import get_current_user

logger = logging.getLogger("studyhub.notifications")

router = APIRouter(prefix="/notifications", tags=["notifications"])

# ---------------------------------------------------------------------------
# SMTP configuration from environment
# ---------------------------------------------------------------------------

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.zoho.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)

# ---------------------------------------------------------------------------
# Database model for notification preferences
# ---------------------------------------------------------------------------


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(String(16), primary_key=True)
    notify_friend_request = Column(Boolean, default=True)
    notify_friend_accepted = Column(Boolean, default=True)
    notify_wall_post = Column(Boolean, default=True)
    notify_message = Column(Boolean, default=True)


# Create table if it doesn't exist
NotificationPreference.__table__.create(bind=engine, checkfirst=True)

# ---------------------------------------------------------------------------
# HTML email templates (Spanish)
# ---------------------------------------------------------------------------

_BASE_STYLE = """
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
  .container { max-width: 520px; margin: 30px auto; background: #ffffff; border-radius: 12px;
               box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #4f8cff, #6c5ce7); padding: 28px 24px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; }
  .body { padding: 28px 24px; color: #333; line-height: 1.6; }
  .body p { margin: 0 0 14px; }
  .highlight { font-weight: 600; color: #4f8cff; }
  .btn { display: inline-block; padding: 12px 28px; background: #4f8cff; color: #fff !important;
         text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; }
  .footer { text-align: center; padding: 16px 24px; font-size: 12px; color: #999; }
</style>
"""


def _wrap(inner_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">{_BASE_STYLE}</head>
<body>
<div class="container">
  <div class="header"><h1>Conniku</h1></div>
  <div class="body">{inner_html}</div>
  <div class="footer">Este correo fue enviado por Conniku. Si no deseas recibir estas notificaciones,
  puedes desactivarlas en tu perfil.</div>
</div>
</body></html>"""


TEMPLATES = {
    "friend_request": {
        "subject": "Nueva solicitud de amistad en Conniku",
        "html": lambda sender_name: _wrap(f"""
            <p>Hola,</p>
            <p><span class="highlight">{sender_name}</span> te ha enviado una solicitud de amistad.</p>
            <p>Ingresa a Conniku para aceptarla o rechazarla.</p>
            <a class="btn" href="#">Ver solicitud</a>
        """),
    },
    "friend_accepted": {
        "subject": "Tu solicitud de amistad fue aceptada",
        "html": lambda accepter_name: _wrap(f"""
            <p>Hola,</p>
            <p><span class="highlight">{accepter_name}</span> ha aceptado tu solicitud de amistad.</p>
            <p>Ya pueden interactuar en Conniku.</p>
            <a class="btn" href="#">Ir a Conniku</a>
        """),
    },
    "wall_post": {
        "subject": "Nueva publicacion en tu muro de Conniku",
        "html": lambda poster_name, preview: _wrap(f"""
            <p>Hola,</p>
            <p><span class="highlight">{poster_name}</span> ha publicado en tu muro:</p>
            <blockquote style="border-left:3px solid #4f8cff; padding-left:12px; color:#555;">
              {preview[:200]}{'...' if len(preview) > 200 else ''}
            </blockquote>
            <a class="btn" href="#">Ver publicacion</a>
        """),
    },
    "new_message": {
        "subject": "Nuevo mensaje en Conniku",
        "html": lambda sender_name, preview: _wrap(f"""
            <p>Hola,</p>
            <p><span class="highlight">{sender_name}</span> te ha enviado un mensaje:</p>
            <blockquote style="border-left:3px solid #4f8cff; padding-left:12px; color:#555;">
              {preview[:200]}{'...' if len(preview) > 200 else ''}
            </blockquote>
            <a class="btn" href="#">Responder</a>
        """),
    },
    "payment_receipt": {
        "subject": "Recibo de pago - Conniku PRO",
        "html": lambda user_name, amount, currency, transaction_id, date_str: _wrap(f"""
            <p>Hola <span class="highlight">{user_name}</span>,</p>
            <p>Gracias por suscribirte a <strong>Conniku PRO</strong>. Aquí tienes tu recibo de pago:</p>
            <div style="background:#f8f9fc; border-radius:8px; padding:20px; margin:16px 0;">
                <table style="width:100%; border-collapse:collapse; font-size:14px;">
                    <tr><td style="padding:8px 0; color:#666;">Concepto</td><td style="padding:8px 0; text-align:right; font-weight:600;">Conniku PRO - Suscripción Mensual</td></tr>
                    <tr><td style="padding:8px 0; color:#666;">Monto</td><td style="padding:8px 0; text-align:right; font-weight:600;">{amount} {currency}</td></tr>
                    <tr><td style="padding:8px 0; color:#666;">Fecha</td><td style="padding:8px 0; text-align:right;">{date_str}</td></tr>
                    <tr><td style="padding:8px 0; color:#666;">ID Transacción</td><td style="padding:8px 0; text-align:right; font-family:monospace; font-size:12px;">{transaction_id}</td></tr>
                    <tr style="border-top:1px solid #e0e0e0;"><td style="padding:12px 0; font-weight:700;">Total</td><td style="padding:12px 0; text-align:right; font-weight:700; font-size:18px; color:#4f8cff;">{amount} {currency}</td></tr>
                </table>
            </div>
            <p style="font-size:13px; color:#666;">Este recibo sirve como comprobante de pago. Si necesitas una factura formal, contáctanos a soporte@conniku.com.</p>
            <p style="font-size:13px; color:#666;">Puedes administrar tu suscripción desde tu perfil en Conniku.</p>
        """),
    },
    "welcome_pro": {
        "subject": "Bienvenido a Conniku PRO",
        "html": lambda user_name: _wrap(f"""
            <p>Hola <span class="highlight">{user_name}</span>,</p>
            <p>Tu suscripción a <strong>Conniku PRO</strong> está activa. Ahora tienes acceso a:</p>
            <ul style="padding-left:20px; line-height:2;">
                <li>Asignaturas ilimitadas</li>
                <li>Chat IA sin límites</li>
                <li>Generación ilimitada de guías, quizzes y flashcards</li>
                <li>Subida de videos y transcripciones</li>
                <li>Soporte prioritario</li>
            </ul>
            <a class="btn" href="#">Ir a Conniku</a>
            <p style="margin-top:16px; font-size:13px; color:#666;">Gracias por apoyar Conniku. Tu suscripción se renovará automáticamente cada mes.</p>
        """),
    },
}

# ---------------------------------------------------------------------------
# Background email queue / worker
# ---------------------------------------------------------------------------

_email_queue: Queue = Queue()
_worker_started = False
_worker_lock = threading.Lock()


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Actually send one email via SMTP. Runs inside the worker thread."""
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("SMTP credentials not configured; skipping email to %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        logger.info("Email sent to %s [%s]", to_email, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def _worker() -> None:
    """Daemon thread that drains the email queue."""
    while True:
        item = _email_queue.get()
        if item is None:
            break
        to_email, subject, html_body = item
        _send_email(to_email, subject, html_body)
        _email_queue.task_done()


def _ensure_worker() -> None:
    global _worker_started
    if _worker_started:
        return
    with _worker_lock:
        if _worker_started:
            return
        t = threading.Thread(target=_worker, daemon=True, name="email-worker")
        t.start()
        _worker_started = True


def enqueue_email(to_email: str, subject: str, html_body: str) -> None:
    """Add an email to the send queue (non-blocking)."""
    _ensure_worker()
    _email_queue.put((to_email, subject, html_body))


# ---------------------------------------------------------------------------
# Helper: check preference then enqueue
# ---------------------------------------------------------------------------


def _get_prefs(db: Session, user_id: str) -> NotificationPreference:
    prefs = db.query(NotificationPreference).filter_by(user_id=user_id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


def notify_friend_request(db: Session, recipient: User, sender: User) -> None:
    """Queue an email for a new friend request if the recipient allows it."""
    prefs = _get_prefs(db, recipient.id)
    if not prefs.notify_friend_request:
        return
    tpl = TEMPLATES["friend_request"]
    sender_name = f"{sender.first_name} {sender.last_name}"
    enqueue_email(recipient.email, tpl["subject"], tpl["html"](sender_name))


def notify_friend_accepted(db: Session, recipient: User, accepter: User) -> None:
    """Queue an email when a friend request is accepted."""
    prefs = _get_prefs(db, recipient.id)
    if not prefs.notify_friend_accepted:
        return
    tpl = TEMPLATES["friend_accepted"]
    accepter_name = f"{accepter.first_name} {accepter.last_name}"
    enqueue_email(recipient.email, tpl["subject"], tpl["html"](accepter_name))


def notify_wall_post(db: Session, recipient: User, poster: User, post_content: str) -> None:
    """Queue an email when someone posts on the recipient's wall."""
    prefs = _get_prefs(db, recipient.id)
    if not prefs.notify_wall_post:
        return
    tpl = TEMPLATES["wall_post"]
    poster_name = f"{poster.first_name} {poster.last_name}"
    enqueue_email(recipient.email, tpl["subject"], tpl["html"](poster_name, post_content))


def notify_payment_receipt(db: Session, user: User, amount: float, currency: str,
                           transaction_id: str, date_str: str) -> None:
    """Send a payment receipt/invoice email after successful payment."""
    tpl = TEMPLATES["payment_receipt"]
    user_name = f"{user.first_name} {user.last_name}"
    enqueue_email(user.email, tpl["subject"],
                  tpl["html"](user_name, f"${amount:.2f}", currency, transaction_id, date_str))


def notify_welcome_pro(db: Session, user: User) -> None:
    """Send a welcome email when a user upgrades to PRO."""
    tpl = TEMPLATES["welcome_pro"]
    user_name = f"{user.first_name} {user.last_name}"
    enqueue_email(user.email, tpl["subject"], tpl["html"](user_name))


def notify_new_message(db: Session, recipient: User, sender: User, message_preview: str) -> None:
    """Queue an email when the recipient gets a new direct message."""
    prefs = _get_prefs(db, recipient.id)
    if not prefs.notify_message:
        return
    tpl = TEMPLATES["new_message"]
    sender_name = f"{sender.first_name} {sender.last_name}"
    enqueue_email(recipient.email, tpl["subject"], tpl["html"](sender_name, message_preview))


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class NotificationPrefsResponse(BaseModel):
    notify_friend_request: bool
    notify_friend_accepted: bool
    notify_wall_post: bool
    notify_message: bool


class NotificationPrefsUpdate(BaseModel):
    notify_friend_request: Optional[bool] = None
    notify_friend_accepted: Optional[bool] = None
    notify_wall_post: Optional[bool] = None
    notify_message: Optional[bool] = None


# ---------------------------------------------------------------------------
# FastAPI endpoints
# ---------------------------------------------------------------------------


@router.get("/preferences", response_model=NotificationPrefsResponse)
def get_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener las preferencias de notificacion del usuario actual."""
    prefs = _get_prefs(db, user.id)
    return NotificationPrefsResponse(
        notify_friend_request=prefs.notify_friend_request,
        notify_friend_accepted=prefs.notify_friend_accepted,
        notify_wall_post=prefs.notify_wall_post,
        notify_message=prefs.notify_message,
    )


@router.put("/preferences", response_model=NotificationPrefsResponse)
def update_preferences(
    body: NotificationPrefsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar preferencias de notificacion."""
    prefs = _get_prefs(db, user.id)
    for field in ("notify_friend_request", "notify_friend_accepted", "notify_wall_post", "notify_message"):
        val = getattr(body, field)
        if val is not None:
            setattr(prefs, field, val)
    db.commit()
    db.refresh(prefs)
    return NotificationPrefsResponse(
        notify_friend_request=prefs.notify_friend_request,
        notify_friend_accepted=prefs.notify_friend_accepted,
        notify_wall_post=prefs.notify_wall_post,
        notify_message=prefs.notify_message,
    )


@router.post("/test")
def send_test_notification(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enviar un correo de prueba al usuario actual."""
    test_html = _wrap("""
        <p>Hola,</p>
        <p>Este es un correo de prueba de <span class="highlight">Conniku</span>.</p>
        <p>Si recibes este mensaje, tus notificaciones por correo estan funcionando correctamente.</p>
    """)
    enqueue_email(user.email, "Prueba de notificaciones - Conniku", test_html)
    return {"status": "queued", "message": "Correo de prueba enviado a la cola."}
