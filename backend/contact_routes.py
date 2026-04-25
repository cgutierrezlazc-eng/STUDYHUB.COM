"""
contact_routes.py — endpoint público para el formulario de contacto.

Recibe el motivo de consulta + datos del usuario y envía un correo
electrónico al destinatario correspondiente según el motivo.

Cuentas SMTP disponibles (ver notifications.py):
    - "noreply"   → noreply@conniku.com
    - "contacto"  → contacto@conniku.com
    - "ceo"       → ceo@conniku.com

Como el contenido es siempre un mensaje del usuario, autenticamos
con la cuenta `contacto` (que coincide con el From cuando el
destino es contacto@conniku.com) y `noreply` para el resto. El
destinatario real (soporte@, privacidad@, legal@, etc.) se pone
como "To" del correo, y el reply-to apunta al correo del usuario.

Rate limit: 5 envíos por IP por hora.
"""
import logging
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, constr

from notifications import _send_email_async

logger = logging.getLogger(__name__)
router = APIRouter()

# Mapping motivo → (email destino, cuenta SMTP a usar como remitente).
# "Centro de soporte" no aparece aquí porque en el frontend redirige
# a /support sin enviar correo.
MOTIVO_TO_EMAIL: dict[str, tuple[str, str]] = {
    "Soporte técnico": ("soporte@conniku.com", "noreply"),
    "Contacto general": ("contacto@conniku.com", "contacto"),
    "Privacidad": ("privacidad@conniku.com", "noreply"),
    "Legal": ("legal@conniku.com", "noreply"),
    "Seguridad y Ley Karin": ("seguridad@conniku.com", "noreply"),
    "Prensa y medios": ("prensa@conniku.com", "noreply"),
}

# Rate limit en memoria por IP.
_rate_buckets: dict[str, list[datetime]] = defaultdict(list)
RATE_LIMIT = 5
RATE_WINDOW = timedelta(hours=1)


def _check_rate(ip: str) -> None:
    now = datetime.utcnow()
    bucket = _rate_buckets[ip]
    bucket[:] = [t for t in bucket if now - t < RATE_WINDOW]
    if len(bucket) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Demasiados mensajes desde esta IP. Intenta nuevamente en una hora.",
        )
    bucket.append(now)


class ContactRequest(BaseModel):
    motivo: str
    nombre: constr(strip_whitespace=True, min_length=2, max_length=100)  # type: ignore[valid-type]
    email: EmailStr
    asunto: constr(strip_whitespace=True, min_length=3, max_length=200)  # type: ignore[valid-type]
    mensaje: constr(strip_whitespace=True, min_length=10, max_length=5000)  # type: ignore[valid-type]


def _build_html_body(req: ContactRequest, ip: str) -> str:
    """Plantilla HTML simple para el correo recibido."""
    # Escape mínimo defensivo (evita inyección HTML básica).
    import html as _html

    nombre = _html.escape(req.nombre)
    email = _html.escape(req.email)
    motivo = _html.escape(req.motivo)
    asunto = _html.escape(req.asunto)
    mensaje = _html.escape(req.mensaje).replace("\n", "<br>")
    ip_safe = _html.escape(ip)

    return f"""
    <div style="font-family: Inter, Arial, sans-serif; color:#1a1a1a; max-width:640px;">
      <h2 style="color:#00c27a; margin:0 0 12px;">Nuevo mensaje de contacto</h2>
      <p style="margin:0 0 6px;"><strong>Motivo:</strong> {motivo}</p>
      <p style="margin:0 0 6px;"><strong>De:</strong> {nombre} &lt;{email}&gt;</p>
      <p style="margin:0 0 6px;"><strong>Asunto:</strong> {asunto}</p>
      <hr style="border:none; border-top:1px solid #e5e5e5; margin:14px 0;">
      <div style="white-space:normal; font-size:14px; line-height:1.6;">
        {mensaje}
      </div>
      <hr style="border:none; border-top:1px solid #e5e5e5; margin:14px 0;">
      <p style="font-size:11px; color:#888; margin:0;">IP origen: {ip_safe}</p>
    </div>
    """


@router.post("/contact")
async def post_contact(req: ContactRequest, request: Request) -> dict:
    if req.motivo not in MOTIVO_TO_EMAIL:
        raise HTTPException(status_code=400, detail="Motivo inválido")

    ip = request.client.host if request.client else "unknown"
    _check_rate(ip)

    to_addr, smtp_account = MOTIVO_TO_EMAIL[req.motivo]
    subject = f"[Conniku · {req.motivo}] {req.asunto}"
    html_body = _build_html_body(req, ip)

    # _send_email_async lanza el envío en thread; no bloquea la respuesta.
    _send_email_async(
        to_email=to_addr,
        subject=subject,
        html_body=html_body,
        reply_to=req.email,
        email_type="contact_form",
        from_account=smtp_account,
    )

    logger.info(
        "[Contact] motivo=%s to=%s from_user=%s ip=%s",
        req.motivo, to_addr, req.email, ip,
    )
    return {"ok": True}
