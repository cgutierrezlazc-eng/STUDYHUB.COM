"""
careers_routes.py — endpoint público para el módulo de talento (M01.5).

Recibe el perfil de un candidato y envía un correo a talento@conniku.com
(alias Zoho → entrega en contacto@conniku.com).

Sigue el mismo patrón que contact_routes.py:
  - Validación Pydantic con límites de tamaño
  - Rate limit en memoria por IP (3 envíos/hora, más restrictivo que
    contact porque no es soporte urgente)
  - Envío sincrónico con _send_email_sync
  - HTTP 502 si SMTP falla (no 200 fantasma)

SMTP: remitente noreply@conniku.com → destino talento@conniku.com
"""
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, constr

from notifications import _send_email_sync

logger = logging.getLogger(__name__)
router = APIRouter()

TIPO_LABELS: dict[str, str] = {
    "laboral": "Perfil Laboral",
    "conniku": "Perfil Conniku",
}

_rate_buckets: dict[str, list[datetime]] = defaultdict(list)
RATE_LIMIT = 3
RATE_WINDOW = timedelta(hours=1)


def _check_rate(ip: str) -> None:
    now = datetime.utcnow()
    bucket = _rate_buckets[ip]
    bucket[:] = [t for t in bucket if now - t < RATE_WINDOW]
    if len(bucket) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Demasiados envíos desde esta IP. Intenta nuevamente en una hora.",
        )
    bucket.append(now)


class CareersRequest(BaseModel):
    tipo: str  # "laboral" | "conniku"
    nombre: constr(strip_whitespace=True, min_length=2, max_length=100)  # type: ignore[valid-type]
    email: EmailStr
    area: constr(strip_whitespace=True, min_length=2, max_length=100)  # type: ignore[valid-type]
    por_que: constr(strip_whitespace=True, min_length=10, max_length=2000)  # type: ignore[valid-type]
    linkedin: Optional[constr(strip_whitespace=True, max_length=300)] = None  # type: ignore[valid-type]


def _build_html(req: CareersRequest, ip: str) -> str:
    import html as _html

    nombre = _html.escape(req.nombre)
    email = _html.escape(req.email)
    tipo_label = _html.escape(TIPO_LABELS.get(req.tipo, req.tipo))
    area = _html.escape(req.area)
    por_que = _html.escape(req.por_que).replace("\n", "<br>")
    linkedin_row = ""
    if req.linkedin:
        linkedin_safe = _html.escape(req.linkedin)
        linkedin_row = f'<p style="margin:0 0 6px;"><strong>LinkedIn / perfil:</strong> {linkedin_safe}</p>'
    ip_safe = _html.escape(ip)

    return f"""
    <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:640px;">
      <h2 style="color:#0A2878;margin:0 0 12px;">Nuevo perfil de candidato · {tipo_label}</h2>
      <p style="margin:0 0 6px;"><strong>Tipo:</strong> {tipo_label}</p>
      <p style="margin:0 0 6px;"><strong>De:</strong> {nombre} &lt;{email}&gt;</p>
      <p style="margin:0 0 6px;"><strong>Área de interés:</strong> {area}</p>
      {linkedin_row}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:14px 0;">
      <strong>¿Por qué Conniku?</strong>
      <div style="margin-top:8px;font-size:14px;line-height:1.6;">{por_que}</div>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:14px 0;">
      <p style="font-size:11px;color:#888;margin:0;">IP origen: {ip_safe}</p>
    </div>
    """


@router.post("/careers/profile")
async def post_careers_profile(req: CareersRequest, request: Request) -> dict:
    if req.tipo not in TIPO_LABELS:
        raise HTTPException(status_code=400, detail="Tipo de perfil inválido")

    ip = request.client.host if request.client else "unknown"
    _check_rate(ip)

    tipo_label = TIPO_LABELS[req.tipo]
    subject = f"[Conniku · Talento · {tipo_label}] {req.nombre} — {req.area}"
    html_body = _build_html(req, ip)

    success, error_msg = _send_email_sync(
        to_email="talento@conniku.com",
        subject=subject,
        html_body=html_body,
        reply_to=req.email,
        email_type="careers_profile",
        from_account="noreply",
    )

    if not success:
        logger.error(
            "[Careers] FAIL tipo=%s from_user=%s ip=%s error=%s",
            req.tipo, req.email, ip, error_msg,
        )
        raise HTTPException(
            status_code=502,
            detail="No pudimos registrar tu perfil en este momento. Por favor intenta nuevamente o escríbenos a talento@conniku.com.",
        )

    logger.info("[Careers] OK tipo=%s from_user=%s ip=%s", req.tipo, req.email, ip)
    return {"ok": True}
