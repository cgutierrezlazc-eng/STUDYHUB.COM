"""Email notification system for Conniku.
All emails consolidated through ceo@conniku.com (single account).
Future: expand to separate noreply@, contacto@, ceo@ when more accounts are purchased.
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

# Email config — 3 accounts:
#   noreply@conniku.com  → all automated notifications
#   contacto@conniku.com → contact forms, support, suggestions
#   ceo@conniku.com      → CEO reports, payment alerts, financial metrics
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.zoho.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_PASS = os.environ.get("SMTP_PASS", "")
# Per-account config
NOREPLY_EMAIL = os.environ.get("NOREPLY_EMAIL", "noreply@conniku.com")
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "contacto@conniku.com")
CEO_EMAIL = os.environ.get("CEO_EMAIL", "ceo@conniku.com")
# Defaults (backward compat)
SMTP_USER = os.environ.get("SMTP_USER", NOREPLY_EMAIL)
SMTP_FROM = os.environ.get("SMTP_FROM", NOREPLY_EMAIL)
REPLY_TO = os.environ.get("SMTP_REPLY_TO", CONTACT_EMAIL)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://conniku.com")


def _send_email_async(to_email: str, subject: str, html_body: str, reply_to: str = None, email_type: str = "notification", from_account: str = None):
    """Send email in background thread and log it.
    from_account: 'noreply' (default), 'contacto', or 'ceo'
    """
    # Determine which account to send from
    if from_account == "ceo":
        send_from = CEO_EMAIL
        send_user = CEO_EMAIL
        sender_name = "Conniku CEO"
    elif from_account == "contacto":
        send_from = CONTACT_EMAIL
        send_user = CONTACT_EMAIL
        sender_name = "Conniku Soporte"
    else:
        send_from = NOREPLY_EMAIL
        send_user = NOREPLY_EMAIL
        sender_name = "Conniku"

    def _send():
        status = "sent"
        error_msg = None
        if not SMTP_PASS:
            print(f"[Email] SMTP not configured. Would send to {to_email}: {subject}")
            status = "failed"
            error_msg = "SMTP not configured"
        else:
            try:
                msg = MIMEMultipart("alternative")
                msg["From"] = f"{sender_name} <{send_from}>"
                msg["To"] = to_email
                msg["Subject"] = subject
                msg["Reply-To"] = reply_to or (CONTACT_EMAIL if from_account != "ceo" else CEO_EMAIL)
                msg.attach(MIMEText(html_body, "html", "utf-8"))

                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls()
                    server.login(send_user, SMTP_PASS)
                    server.sendmail(send_from, to_email, msg.as_string())
                print(f"[Email] Sent from {send_from} to {to_email}: {subject}")
            except Exception as e:
                print(f"[Email Error] {e}")
                status = "failed"
                error_msg = str(e)

        # Log email in database
        try:
            from database import SessionLocal, EmailLog, gen_id
            db = SessionLocal()
            log = EmailLog(
                id=gen_id(), from_email=send_from, to_email=to_email,
                subject=subject, body_html=html_body, email_type=email_type,
                status=status, error_message=error_msg, reply_to=reply_to or CONTACT_EMAIL,
            )
            db.add(log)
            db.commit()
            db.close()
        except Exception as log_err:
            print(f"[Email Log Error] {log_err}")

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
        <span style="font-size:22px;font-weight:700;color:#1D2939">conni<span style="color:#2D62C8">ku</span></span>
    </div>
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #E5E7EB">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1D2939">{title}</h2>
        <div style="font-size:14px;line-height:1.7;color:#475467">{body}</div>
        {cta_html}
    </div>
    <!-- Professional Signature -->
    <div style="margin-top:28px;padding:20px 24px;background:#fff;border-radius:10px;border:1px solid #E5E7EB">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
            <tr>
                <td style="width:48px;vertical-align:top;padding-right:16px">
                    <div style="width:44px;height:44px;border-radius:10px;background:#2D62C8;display:flex;align-items:center;justify-content:center">
                        <span style="color:#fff;font-weight:700;font-size:16px;line-height:44px;text-align:center;display:block;width:44px">CK</span>
                    </div>
                </td>
                <td style="vertical-align:top">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#1D2939">Equipo Conniku</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6B7280">Plataforma de Desarrollo Universitario</p>
                    <div style="margin-top:8px;border-top:1px solid #E5E7EB;padding-top:8px">
                        <p style="margin:0;font-size:11px;color:#98A2B3">
                            <a href="https://conniku.com" style="color:#2D62C8;text-decoration:none;font-weight:600">conniku.com</a>
                            &nbsp;&middot;&nbsp;
                            <a href="mailto:{CEO_EMAIL}" style="color:#2D62C8;text-decoration:none">{CEO_EMAIL}</a>
                        </p>
                        <p style="margin:4px 0 0;font-size:10px;color:#D1D5DB;letter-spacing:0.3px">
                            Cursos &middot; Comunidad &middot; Bolsa de Trabajo &middot; Tutorias
                        </p>
                    </div>
                </td>
            </tr>
        </table>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:10px;color:#D1D5DB">
        <p style="margin:0">&copy; {datetime.utcnow().year} Conniku. Todos los derechos reservados.</p>
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
    _send_email_async(user.email, "¡Bienvenido/a a Conniku! 🎉", html, email_type="welcome")


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
    _send_email_async(user.email, f"Conniku — {title}", html, email_type="subscription")


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
    _send_email_async(CEO_EMAIL, f"Conniku — Reporte Semanal {report_data.get('period', '')}", html, reply_to=CEO_EMAIL, email_type="ceo_report", from_account="ceo")


# ─── CEO Email Management ─────────────────────────────────────

class ComposeEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str  # Plain text, will be wrapped in template
    cta_text: str = ""
    cta_url: str = ""
    from_account: str = "ceo"  # "ceo" or "contacto"


@router.get("/ceo/inbox")
def ceo_email_inbox(
    page: int = 1, limit: int = 50, email_type: str = "", account: str = "",
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Get email log for CEO — all sent/received emails."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner puede ver el inbox")

    from database import EmailLog
    q = db.query(EmailLog).order_by(EmailLog.sent_at.desc())

    if email_type:
        q = q.filter(EmailLog.email_type == email_type)

    # Filter by account (from_email contains the account address)
    if account == "ceo":
        q = q.filter(EmailLog.from_email.ilike(f"%ceo@%"))
    elif account == "contacto":
        q = q.filter(EmailLog.from_email.ilike(f"%contacto@%"))

    total = q.count()
    emails = q.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "emails": [{
            "id": e.id,
            "from": e.from_email,
            "to": e.to_email,
            "subject": e.subject,
            "type": e.email_type,
            "status": e.status,
            "error": e.error_message,
            "sentAt": e.sent_at.isoformat() if e.sent_at else "",
            "replyTo": e.reply_to,
            "hasBody": bool(e.body_html),
        } for e in emails]
    }


@router.get("/ceo/email/{email_id}")
def ceo_email_detail(
    email_id: str,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Get full email detail including body."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner")

    from database import EmailLog
    e = db.query(EmailLog).filter(EmailLog.id == email_id).first()
    if not e:
        raise HTTPException(404, "Email no encontrado")

    return {
        "id": e.id,
        "from": e.from_email,
        "to": e.to_email,
        "subject": e.subject,
        "bodyHtml": e.body_html,
        "type": e.email_type,
        "status": e.status,
        "error": e.error_message,
        "sentAt": e.sent_at.isoformat() if e.sent_at else "",
        "replyTo": e.reply_to,
    }


@router.delete("/ceo/email/{email_id}")
def ceo_delete_email(
    email_id: str,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Delete an email log entry."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner")

    from database import EmailLog
    e = db.query(EmailLog).filter(EmailLog.id == email_id).first()
    if not e:
        raise HTTPException(404, "Email no encontrado")

    db.delete(e)
    db.commit()
    return {"status": "deleted", "id": email_id}


@router.delete("/ceo/emails/bulk")
def ceo_delete_emails_bulk(
    data: dict,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Delete multiple email log entries."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner")

    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(400, "No se proporcionaron IDs")

    from database import EmailLog
    deleted = db.query(EmailLog).filter(EmailLog.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"status": "deleted", "count": deleted}


@router.post("/ceo/send")
def ceo_send_email(
    data: ComposeEmailRequest,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """CEO sends a manual email to any address."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner puede enviar emails")

    if not data.to_email or not data.subject:
        raise HTTPException(400, "Destinatario y asunto son obligatorios")

    account = data.from_account if data.from_account in ("ceo", "contacto") else "ceo"
    reply_to = CONTACT_EMAIL if account == "contacto" else CEO_EMAIL

    body_html = data.body.replace("\n", "<br>")
    full_body = f"<p>{body_html}</p>"
    html = _email_template(data.subject, full_body, data.cta_text, data.cta_url)
    _send_email_async(data.to_email, data.subject, html, reply_to=reply_to, email_type="manual", from_account=account)

    return {"status": "queued", "message": f"Email enviado a {data.to_email} desde {account}@conniku.com"}


@router.get("/ceo/stats")
def ceo_email_stats(
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Email statistics for CEO dashboard."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner")

    from database import EmailLog
    from sqlalchemy import func

    total = db.query(func.count(EmailLog.id)).scalar() or 0
    sent = db.query(func.count(EmailLog.id)).filter(EmailLog.status == "sent").scalar() or 0
    failed = db.query(func.count(EmailLog.id)).filter(EmailLog.status == "failed").scalar() or 0

    # By type
    type_counts = db.query(
        EmailLog.email_type, func.count(EmailLog.id)
    ).group_by(EmailLog.email_type).all()

    # Last 7 days
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    this_week = db.query(func.count(EmailLog.id)).filter(
        EmailLog.sent_at >= week_ago
    ).scalar() or 0

    return {
        "total": total,
        "sent": sent,
        "failed": failed,
        "thisWeek": this_week,
        "byType": {t: c for t, c in type_counts},
    }


@router.post("/ceo/broadcast")
def ceo_broadcast_email(
    data: dict,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Send email to all users or filtered group."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner")

    subject = data.get("subject", "")
    body = data.get("body", "")
    filter_type = data.get("filter", "all")  # all, active, premium
    cta_text = data.get("ctaText", "")
    cta_url = data.get("ctaUrl", "")

    if not subject or not body:
        raise HTTPException(400, "Asunto y cuerpo son obligatorios")

    q = db.query(User).filter(User.email_verified == True, User.email != None)

    if filter_type == "premium":
        q = q.filter(User.subscription_tier.in_(["starter", "pro", "max"]))
    elif filter_type == "active":
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        q = q.filter(User.last_active_date >= week_ago.strftime("%Y-%m-%d"))

    users = q.all()
    count = 0

    body_html = body.replace("\n", "<br>")
    for u in users:
        if u.email:
            full_body = f"<p>Hola {u.first_name},</p><p>{body_html}</p>"
            html = _email_template(subject, full_body, cta_text, cta_url)
            _send_email_async(u.email, subject, html, reply_to=CEO_EMAIL, email_type="broadcast", from_account="ceo")
            count += 1

    return {"status": "sent", "recipients": count, "filter": filter_type}


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

    body = f"""
    <p><strong>De:</strong> {data.name} ({data.email})</p>
    <p><strong>Asunto:</strong> {data.subject}</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0">
    <p>{data.message.replace(chr(10), '<br>')}</p>
    """
    html = _email_template(f"Nuevo mensaje: {data.subject}", body)
    _send_email_async(CONTACT_EMAIL, f"[Conniku Contacto] {data.subject} — {data.name}", html, reply_to=data.email, email_type="contact", from_account="contacto")

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
    _send_email_async(CONTACT_EMAIL, f"[Conniku] {subject} — @{user.username}", html, reply_to=user.email, email_type="contact", from_account="contacto")

    return {"status": "sent", "message": "Mensaje enviado al equipo de Conniku."}


# ─── Social Email Notifications ───────────────────────────────

def notify_friend_request(db, target_user: User, from_user: User):
    """Email when someone sends you a friend request."""
    if not target_user or not target_user.email:
        return
    body = f"""
    <p>Hola {target_user.first_name},</p>
    <p><strong>{from_user.first_name} {from_user.last_name}</strong> (@{from_user.username}) te envio una solicitud de amistad en Conniku.</p>
    <p style="color:#6B7280;font-size:13px">{from_user.career or ''}{(' · ' + from_user.university) if from_user.university else ''}</p>
    <p>Revisa tu lista de solicitudes para aceptarla o rechazarla.</p>
    """
    html = _email_template("Nueva solicitud de amistad", body, "Ver Solicitudes", f"{FRONTEND_URL}/friends")
    _send_email_async(target_user.email, f"{from_user.first_name} quiere ser tu amigo/a — Conniku", html, email_type="friend_request")


def notify_friend_accepted(db, requester: User, accepter: User):
    """Email when someone accepts your friend request."""
    if not requester or not requester.email:
        return
    body = f"""
    <p>Hola {requester.first_name},</p>
    <p><strong>{accepter.first_name} {accepter.last_name}</strong> acepto tu solicitud de amistad.</p>
    <p>Ya pueden ver sus perfiles, escribirse en el muro y chatear directamente.</p>
    """
    html = _email_template("Solicitud de amistad aceptada", body, f"Ver perfil de {accepter.first_name}", f"{FRONTEND_URL}/user/{accepter.id}")
    _send_email_async(requester.email, f"{accepter.first_name} acepto tu solicitud — Conniku", html, email_type="friend_accepted")


def notify_wall_post(db, wall_owner: User, author: User, content_preview: str):
    """Email when someone posts on your wall."""
    if not wall_owner or not wall_owner.email:
        return
    if wall_owner.id == author.id:
        return
    preview = (content_preview[:120] + "...") if len(content_preview) > 120 else content_preview
    body = f"""
    <p>Hola {wall_owner.first_name},</p>
    <p><strong>{author.first_name} {author.last_name}</strong> publico en tu muro:</p>
    <div style="background:#F9FAFB;border-left:3px solid #2563EB;padding:12px 16px;border-radius:6px;margin:12px 0;font-style:italic;color:#374151">
        {preview}
    </div>
    """
    html = _email_template("Nueva publicacion en tu muro", body, "Ver Publicacion", f"{FRONTEND_URL}/user/{wall_owner.id}")
    _send_email_async(wall_owner.email, f"{author.first_name} publico en tu muro — Conniku", html, email_type="wall_post")


def notify_new_message(db, recipient: User, sender: User, message_preview: str):
    """Email when you receive a new direct message."""
    if not recipient or not recipient.email:
        return
    preview = (message_preview[:120] + "...") if len(message_preview) > 120 else message_preview
    body = f"""
    <p>Hola {recipient.first_name},</p>
    <p>Tienes un nuevo mensaje de <strong>{sender.first_name} {sender.last_name}</strong>:</p>
    <div style="background:#F9FAFB;border-left:3px solid #2563EB;padding:12px 16px;border-radius:6px;margin:12px 0;font-style:italic;color:#374151">
        {preview}
    </div>
    """
    html = _email_template("Nuevo mensaje", body, "Ir al Chat", f"{FRONTEND_URL}/messages")
    _send_email_async(recipient.email, f"Mensaje de {sender.first_name} — Conniku", html, email_type="message")


def notify_mention(db, mentioned_user: User, author: User, content_preview: str):
    """Email when someone mentions you in a post."""
    if not mentioned_user or not mentioned_user.email:
        return
    preview = (content_preview[:120] + "...") if len(content_preview) > 120 else content_preview
    body = f"""
    <p>Hola {mentioned_user.first_name},</p>
    <p><strong>{author.first_name} {author.last_name}</strong> te menciono en una publicacion:</p>
    <div style="background:#F9FAFB;border-left:3px solid #2563EB;padding:12px 16px;border-radius:6px;margin:12px 0;font-style:italic;color:#374151">
        {preview}
    </div>
    """
    html = _email_template("Te mencionaron en Conniku", body, "Ver Publicacion", f"{FRONTEND_URL}/")
    _send_email_async(mentioned_user.email, f"{author.first_name} te menciono — Conniku", html, email_type="mention")


def notify_comment(db, post_author: User, commenter: User, comment_preview: str):
    """Email when someone comments on your post."""
    if not post_author or not post_author.email:
        return
    if post_author.id == commenter.id:
        return
    preview = (comment_preview[:120] + "...") if len(comment_preview) > 120 else comment_preview
    body = f"""
    <p>Hola {post_author.first_name},</p>
    <p><strong>{commenter.first_name} {commenter.last_name}</strong> comento en tu publicacion:</p>
    <div style="background:#F9FAFB;border-left:3px solid #2563EB;padding:12px 16px;border-radius:6px;margin:12px 0;font-style:italic;color:#374151">
        {preview}
    </div>
    """
    html = _email_template("Nuevo comentario", body, "Ver Comentario", f"{FRONTEND_URL}/")
    _send_email_async(post_author.email, f"{commenter.first_name} comento tu publicacion — Conniku", html, email_type="comment")


def notify_mentoring_request(db, mentor: User, mentee: User, subject: str):
    """Email when someone requests mentoring from you."""
    if not mentor or not mentor.email:
        return
    body = f"""
    <p>Hola {mentor.first_name},</p>
    <p><strong>{mentee.first_name} {mentee.last_name}</strong> te envio una solicitud de tutoria.</p>
    <p><strong>Tema:</strong> {subject}</p>
    <p style="color:#6B7280;font-size:13px">{mentee.career or ''}{(' · ' + mentee.university) if mentee.university else ''}</p>
    <p>Revisa la solicitud y decide si aceptarla.</p>
    """
    html = _email_template("Nueva solicitud de tutoria", body, "Ver Solicitudes", f"{FRONTEND_URL}/mentoring")
    _send_email_async(mentor.email, f"Solicitud de tutoria de {mentee.first_name} — Conniku", html, email_type="mentoring")


def notify_mentoring_accepted(db, mentee: User, mentor: User):
    """Email when a mentor accepts your request."""
    if not mentee or not mentee.email:
        return
    body = f"""
    <p>Hola {mentee.first_name},</p>
    <p><strong>{mentor.first_name} {mentor.last_name}</strong> acepto tu solicitud de tutoria.</p>
    <p>Ya pueden coordinar a traves del chat de Conniku.</p>
    """
    html = _email_template("Tutoria aceptada", body, f"Chatear con {mentor.first_name}", f"{FRONTEND_URL}/messages")
    _send_email_async(mentee.email, f"{mentor.first_name} acepto tu tutoria — Conniku", html, email_type="mentoring")


def notify_course_completed(user: User, course_name: str, score: int):
    """Email when a user completes a course (separate from certificate email)."""
    if not user or not user.email:
        return
    body = f"""
    <p>Hola {user.first_name},</p>
    <p>Completaste el curso <strong>{course_name}</strong> con una nota de <strong>{score}%</strong>.</p>
    <p>Tu certificado ya esta disponible en tu perfil. Cualquier reclutador puede verificarlo.</p>
    <p>Sigue asi — cada curso suma a tu perfil profesional.</p>
    """
    html = _email_template("Curso completado", body, "Ver mis Certificados", f"{FRONTEND_URL}/courses")
    _send_email_async(user.email, f"Completaste {course_name} — Conniku", html, email_type="course_completed")


def notify_streak_milestone(user: User, days: int):
    """Email when user hits a streak milestone (7, 30, 60, 90 days)."""
    if not user or not user.email:
        return
    emojis = {7: "🔥", 30: "⚡", 60: "💪", 90: "🏆", 120: "👑", 365: "🌟"}
    emoji = emojis.get(days, "🔥")
    body = f"""
    <p>Hola {user.first_name},</p>
    <p>{emoji} <strong>{days} dias consecutivos</strong> estudiando en Conniku.</p>
    <p>Eso es constancia real. Tu racha demuestra compromiso con tu desarrollo profesional.</p>
    <p>Sigue conectandote cada dia para mantenerla.</p>
    """
    html = _email_template(f"Racha de {days} dias", body, "Seguir Estudiando", FRONTEND_URL)
    _send_email_async(user.email, f"{emoji} {days} dias de racha — Conniku", html, email_type="streak")


def notify_level_up(user: User, new_level: int):
    """Email when user reaches a new level."""
    if not user or not user.email:
        return
    body = f"""
    <p>Hola {user.first_name},</p>
    <p>Subiste al <strong>Nivel {new_level}</strong> en Conniku.</p>
    <p>Tu dedicacion se nota. Sigue completando cursos, participando en la comunidad y estudiando para seguir avanzando.</p>
    """
    html = _email_template(f"Nivel {new_level} alcanzado", body, "Ver mi Perfil", f"{FRONTEND_URL}/profile")
    _send_email_async(user.email, f"Subiste al Nivel {new_level} — Conniku", html, email_type="level_up")


def notify_payment_failed(user: User):
    """Email when payment fails."""
    if not user or not user.email:
        return
    body = f"""
    <p>Hola {user.first_name},</p>
    <p>No pudimos procesar tu ultimo pago. Tu suscripcion podria verse afectada si no se resuelve pronto.</p>
    <p><strong>Tienes 3 dias</strong> para actualizar tu metodo de pago y mantener tu plan activo.</p>
    <p>Si necesitas ayuda, escribenos a <a href="mailto:{CEO_EMAIL}" style="color:#2563EB">{CEO_EMAIL}</a>.</p>
    """
    html = _email_template("Pago no procesado", body, "Actualizar Pago", f"{FRONTEND_URL}/subscription")
    _send_email_async(user.email, "Problema con tu pago — Conniku", html, email_type="payment")


def notify_inactivity(user: User, days_inactive: int):
    """Email after prolonged inactivity (7+ days)."""
    if not user or not user.email:
        return
    body = f"""
    <p>Hola {user.first_name},</p>
    <p>Hace <strong>{days_inactive} dias</strong> que no te conectas a Conniku.</p>
    <p>Tus companeros siguen activos, hay nuevos cursos disponibles y tu perfil profesional te espera.</p>
    <p>No pierdas tu progreso — un pequeno paso diario marca la diferencia.</p>
    """
    html = _email_template("Te extrañamos", body, "Volver a Conniku", FRONTEND_URL)
    _send_email_async(user.email, f"Hace {days_inactive} dias que no te vemos — Conniku", html, email_type="inactivity")
