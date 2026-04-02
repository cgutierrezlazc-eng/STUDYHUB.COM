"""Email notification system for Conniku.
Uses 3 emails: noreply@ (sends), contacto@ (receives user messages), ceo@ (admin).
All notification emails include reply-to: contacto@conniku.com
"""
import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/email", tags=["email"])

# Email config
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.zoho.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "noreply@conniku.com")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "noreply@conniku.com")
REPLY_TO = os.environ.get("SMTP_REPLY_TO", "contacto@conniku.com")
CEO_EMAIL = os.environ.get("CEO_EMAIL", "ceo@conniku.com")
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "contacto@conniku.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://conniku.com")


def _send_email_async(to_email: str, subject: str, html_body: str, reply_to: str = None):
    """Send email in background thread."""
    def _send():
        if not SMTP_PASS:
            print(f"[Email] SMTP not configured. Would send to {to_email}: {subject}")
            return
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"Conniku <{SMTP_FROM}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg["Reply-To"] = reply_to or REPLY_TO
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_FROM, to_email, msg.as_string())
            print(f"[Email] Sent to {to_email}: {subject}")
        except Exception as e:
            print(f"[Email Error] {e}")

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()


def _email_template(title: str, body: str, cta_text: str = "", cta_url: str = "") -> str:
    """Generate branded HTML email template."""
    cta_html = ""
    if cta_text and cta_url:
        cta_html = f'''<div style="text-align:center;margin:24px 0">
            <a href="{cta_url}" style="background:#2563EB;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">{cta_text}</a>
        </div>'''

    return f'''<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:Inter,-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:22px;font-weight:700;color:#1D2939">Conniku</span>
    </div>
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #E5E7EB">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1D2939">{title}</h2>
        <div style="font-size:14px;line-height:1.7;color:#475467">{body}</div>
        {cta_html}
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#98A2B3">
        <p>Este correo fue enviado por Conniku. No respondas a este mensaje.</p>
        <p>Para contactarnos: <a href="mailto:{CONTACT_EMAIL}" style="color:#2563EB">{CONTACT_EMAIL}</a></p>
        <p><a href="{FRONTEND_URL}" style="color:#2563EB">conniku.com</a></p>
    </div>
</div></body></html>'''


# ─── Notification Triggers (call from any route) ────────────

def send_notification_email(user: User, event_type: str, title: str, body: str, cta_text: str = "", cta_url: str = ""):
    """Send a notification email to a user based on event type."""
    if not user or not user.email:
        return

    # Don't email for minor events
    SKIP_EMAIL = {"like", "endorsement", "share"}
    if event_type in SKIP_EMAIL:
        return

    html = _email_template(title, body, cta_text, cta_url or f"{FRONTEND_URL}/")
    _send_email_async(user.email, f"Conniku — {title}", html)


def send_welcome_email(user: User):
    """Welcome email on registration."""
    body = f"""
    <p>¡Hola {user.first_name}! 👋</p>
    <p>Bienvenido/a a <strong>Conniku</strong>, tu comunidad de estudio universitario.</p>
    <p>Ya puedes:</p>
    <ul>
        <li>📚 Crear asignaturas y subir documentos</li>
        <li>💬 Chatear sobre tus materiales de estudio</li>
        <li>📝 Generar guías, quizzes y flashcards</li>
        <li>👥 Conectar con otros estudiantes</li>
    </ul>
    <p>¡Tu primer paso: crea tu primera asignatura!</p>
    """
    html = _email_template("¡Bienvenido/a a Conniku!", body, "Comenzar a Estudiar", FRONTEND_URL)
    _send_email_async(user.email, "¡Bienvenido/a a Conniku! 🎉", html)


def send_subscription_email(user: User, plan: str, action: str):
    """Email for subscription events."""
    actions = {
        "activated": ("¡Tu plan fue activado!", f"Tu plan <strong>{plan}</strong> está activo. Disfruta de todas las funciones."),
        "renewed": ("Plan renovado", f"Tu plan <strong>{plan}</strong> fue renovado exitosamente."),
        "failed": ("⚠️ Pago fallido", "No pudimos procesar tu pago. Tienes 3 días para actualizar tu método de pago."),
        "expired": ("Plan expirado", "Tu suscripción expiró y tu cuenta volvió al plan Básico."),
        "upgraded": ("🎉 ¡Upgrade exitoso!", f"Tu plan fue actualizado a <strong>{plan}</strong>."),
    }
    title, body = actions.get(action, ("Actualización de suscripción", f"Tu suscripción cambió a {plan}."))
    html = _email_template(title, f"<p>Hola {user.first_name},</p><p>{body}</p>", "Ver mi Suscripción", f"{FRONTEND_URL}/subscription")
    _send_email_async(user.email, f"Conniku — {title}", html)


def send_ceo_weekly_report(report_data: dict):
    """Send weekly report to CEO email."""
    rev = report_data.get("revenue", {})
    users = report_data.get("users", {})
    eng = report_data.get("engagement", {})

    body = f"""
    <p><strong>Período:</strong> {report_data.get('period', '')}</p>
    <h3>💰 Ingresos</h3>
    <p>Bruto: ${rev.get('grossUsd', 0)} USD | Ganancia neta: ${rev.get('gananciaNetaClp', 0):,} CLP</p>
    <p>Tendencia: {rev.get('trend', '➡️')} {rev.get('growthPercent', 0)}% vs semana anterior</p>
    <h3>👥 Usuarios</h3>
    <p>Total: {users.get('total', 0)} | Nuevos: {users.get('newThisWeek', 0)} | Activos: {users.get('activeThisWeek', 0)}</p>
    <h3>📊 Engagement</h3>
    <p>Posts: {eng.get('wallPosts', 0)} | Mensajes: {eng.get('messages', 0)} | Estudio: {eng.get('studyHours', 0)}h</p>
    """
    html = _email_template("Reporte Semanal CEO", body, "Ver Dashboard", f"{FRONTEND_URL}/admin")
    _send_email_async(CEO_EMAIL, f"Conniku — Reporte Semanal {report_data.get('period', '')}", html, reply_to=CEO_EMAIL)


# ─── Contact Form ───────────────────────────────────────────

class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str = "Consulta General"
    message: str


@router.post("/contact")
def send_contact_message(data: ContactMessage):
    """Public contact form — sends to contacto@ and CEO."""
    if not data.name or not data.email or not data.message:
        raise HTTPException(400, "Todos los campos son obligatorios")
    if len(data.message) > 2000:
        raise HTTPException(400, "Mensaje muy largo (máximo 2000 caracteres)")

    # Send to contact email (which forwards to CEO)
    body = f"""
    <p><strong>De:</strong> {data.name} ({data.email})</p>
    <p><strong>Asunto:</strong> {data.subject}</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0">
    <p>{data.message.replace(chr(10), '<br>')}</p>
    """
    html = _email_template(f"Nuevo mensaje: {data.subject}", body)
    _send_email_async(CONTACT_EMAIL, f"[Conniku Contacto] {data.subject} — {data.name}", html, reply_to=data.email)

    # Also send to CEO directly
    _send_email_async(CEO_EMAIL, f"[Conniku Contacto] {data.subject} — {data.name}", html, reply_to=data.email)

    return {"status": "sent", "message": "Mensaje enviado. Te responderemos a la brevedad."}


@router.post("/contact/from-profile")
def send_contact_from_profile(data: dict, user: User = Depends(get_current_user)):
    """Contact form from user profile — includes user context."""
    message = data.get("message", "").strip()
    subject = data.get("subject", "Comentario de Usuario")
    if not message:
        raise HTTPException(400, "Mensaje requerido")

    body = f"""
    <p><strong>De:</strong> {user.first_name} {user.last_name} (@{user.username})</p>
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Universidad:</strong> {user.university or 'N/A'} | <strong>Carrera:</strong> {user.career or 'N/A'}</p>
    <p><strong>Plan:</strong> {user.subscription_tier or 'free'}</p>
    <p><strong>Asunto:</strong> {subject}</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0">
    <p>{message.replace(chr(10), '<br>')}</p>
    """
    html = _email_template(f"Mensaje de @{user.username}: {subject}", body)
    _send_email_async(CONTACT_EMAIL, f"[Conniku] {subject} — @{user.username}", html, reply_to=user.email)
    _send_email_async(CEO_EMAIL, f"[Conniku] {subject} — @{user.username}", html, reply_to=user.email)

    return {"status": "sent", "message": "Mensaje enviado al equipo de Conniku."}
