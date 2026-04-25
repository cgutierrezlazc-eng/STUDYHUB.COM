"""Endpoints de feedback de soporte por FAQ — bloque-sandbox-integrity-v1.

Decisiones aplicadas:
- D-S5=A: botones por FAQ con textarea opcional al hacer click en 👎.
- D-S6=A: retención 2 años + pseudonimización a 12 meses.
- Rate-limit 20/hora/IP (patrón contact_tickets adaptado al volumen de soporte).

Endpoints:
  POST /support/feedback              — público, rate-limit 20/h/IP.
  GET  /admin/support/feedback/stats  — admin, agrupa por faq_id.

Referencia legal:
- GDPR Art. 6(1)(f): interés legítimo para procesar IP/UA con fines de
  seguridad y mejora iterativa del servicio.
  URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
- GDPR Art. 5(1)(c): minimización — comment max 2000 chars, UA truncado a 512.
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
- GDPR Art. 5(1)(e): limitación temporal — retención 2 años desde created_at.
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
- Ley 19.628 Art. 4° Chile: información al titular al momento de recolectar.
  URL: https://www.bcn.cl/leychile/navegar?idNorma=141599
  Fecha de verificación: 2026-04-22. Verificador: backend-builder (Tori).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from database import SupportFeedback, User, gen_id, get_db
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware import require_admin
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger("conniku.support_feedback")

router = APIRouter()

# Retención 2 años (D-S6=A).
# GDPR Art. 5(1)(e): limitación del plazo de conservación.
_RETENTION_DAYS = 730

# Rate-limit: máximo 20 solicitudes por IP en la última hora.
# Protege contra scraping masivo y abuso del endpoint público.
# Decisión D-S6=A del plan (adaptado de contact_tickets RATE_LIMIT_PER_HOUR=5,
# escalado a 20 porque el feedback es una interacción más frecuente y ligera).
_RATE_LIMIT_PER_HOUR = 20


# ─── Schemas Pydantic ─────────────────────────────────────────────────────────


class SupportFeedbackCreate(BaseModel):
    """Payload para registrar feedback de utilidad de una pregunta frecuente.

    Validación GDPR Art. 5(1)(c): comment acotado a 2000 chars,
    faq_id acotado a 128 chars.
    """

    faq_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Slug estable de la FAQ (ej. 'pwd-recovery'). Documentado en docs/support/faq-catalog.md.",
    )
    useful: bool = Field(..., description="True si la respuesta fue útil, False si no lo fue.")
    comment: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Comentario libre opcional (max 2000 chars). GDPR Art. 5(1)(c) minimización.",
    )
    session_token: Optional[str] = Field(
        default=None,
        max_length=36,
        description="UUID del visitante desde localStorage['conniku_visitor_uuid'] (D-S4=A).",
    )


class SupportFeedbackResponse(BaseModel):
    """Respuesta al crear un feedback."""

    id: str
    created_at: str


class FaqStatsItem(BaseModel):
    """Estadísticas agregadas por faq_id."""

    faq_id: str
    total: int
    useful_count: int
    useful_ratio: float
    recent_comments: list[str]


class FaqStatsResponse(BaseModel):
    """Respuesta paginada del endpoint de estadísticas admin."""

    total_faqs: int
    offset: int
    limit: int
    items: list[FaqStatsItem]


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _get_client_ip(request: Request) -> str:
    """Extrae la IP real del cliente desde X-Forwarded-For o client host.

    Patrón idéntico a contact_tickets_routes._get_client_ip.
    """
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _assert_not_rate_limited(client_ip: str, db: Session) -> None:
    """Lanza 429 si la IP superó 20 feedbacks en la última hora.

    Consulta la tabla support_feedback con índice (ip_address, created_at).
    Patrón idéntico a contact_tickets._assert_not_rate_limited pero con
    limite 20 (en vez de 5) porque feedback es interacción más frecuente.
    """
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    count = (
        db.query(func.count(SupportFeedback.id))
        .filter(
            SupportFeedback.ip_address == client_ip,
            SupportFeedback.created_at >= one_hour_ago,
        )
        .scalar()
        or 0
    )
    if count >= _RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Demasiadas solicitudes. Puedes enviar hasta 20 feedbacks por hora. Intenta más tarde.",
        )


# ─── Endpoint público: POST /support/feedback ─────────────────────────────────


@router.post("/support/feedback", status_code=201, response_model=SupportFeedbackResponse)
def post_support_feedback(
    payload: SupportFeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> SupportFeedbackResponse:
    """Registra feedback de utilidad para una pregunta frecuente del soporte.

    Flujo:
    1. Rate-limit 20/hora/IP → 429 si excede.
    2. Captura IP real + UA desde headers del request (no del payload).
    3. Calcula retained_until_utc = now + 730 días (2 años, D-S6=A).
    4. Persiste fila en support_feedback.
    5. Retorna 201 con id + created_at.

    Referencia legal:
    - GDPR Art. 6(1)(f): interés legítimo para IP/UA (seguridad + mejora).
    - GDPR Art. 5(1)(c): UA truncado a 512 chars (minimización).
    - GDPR Art. 5(1)(e): retained_until_utc = now + 730 días.
    """
    # 1. Rate-limit por IP
    client_ip = _get_client_ip(request)
    _assert_not_rate_limited(client_ip, db)

    # 2. Capturar UA real del header (no del payload)
    raw_ua = request.headers.get("User-Agent", "") or ""
    # GDPR Art. 5(1)(c): minimización — truncar UA a 512 chars
    ua_truncated: Optional[str] = raw_ua[:512] if raw_ua else None

    # IP real (ya extraída por _get_client_ip, truncamos a 64 chars)
    ip_stored = client_ip[:64] if client_ip else None

    now = datetime.utcnow()
    retained_until = now + timedelta(days=_RETENTION_DAYS)

    row = SupportFeedback(
        id=gen_id(),
        faq_id=payload.faq_id,
        useful=payload.useful,
        comment=payload.comment,
        session_token=payload.session_token,
        ip_address=ip_stored,
        user_agent=ua_truncated,
        created_at=now,
        retained_until_utc=retained_until,
    )

    db.add(row)
    db.commit()
    db.refresh(row)

    logger.info(
        "support_feedback creado: id=%s faq_id=%s useful=%s ip=%s",
        row.id,
        row.faq_id,
        row.useful,
        ip_stored,
    )

    return SupportFeedbackResponse(
        id=str(row.id),
        created_at=row.created_at.isoformat(),
    )


# ─── Endpoint admin: GET /admin/support/feedback/stats ────────────────────────


@router.get("/admin/support/feedback/stats", response_model=FaqStatsResponse)
def admin_support_feedback_stats(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> FaqStatsResponse:
    """Estadísticas de feedback agrupadas por faq_id.

    Retorna para cada FAQ: total de respuestas, cuántas fueron útiles,
    ratio de utilidad, y los últimos 10 comentarios no vacíos.

    Parámetros opcionales:
    - date_from: ISO 8601, filtra registros desde esta fecha.
    - date_to:   ISO 8601, filtra registros hasta esta fecha.
    - limit:     número de FAQs a retornar (default 50).
    - offset:    desplazamiento para paginación (default 0).

    Requiere JWT admin (require_admin).
    """
    # Construir query base
    query = db.query(SupportFeedback)

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(SupportFeedback.created_at >= dt_from)
        except ValueError:
            raise HTTPException(status_code=422, detail="date_from inválido (formato ISO 8601)")

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(SupportFeedback.created_at <= dt_to)
        except ValueError:
            raise HTTPException(status_code=422, detail="date_to inválido (formato ISO 8601)")

    # Agrupar por faq_id para calcular estadísticas agregadas
    # Obtenemos todos los registros filtrados y agrupamos en Python
    # (volumen esperado bajo; si escala, migrar a GROUP BY SQL)
    all_rows = query.order_by(SupportFeedback.created_at.desc()).all()

    # Agregar por faq_id
    aggregated: dict[str, dict] = {}
    for row in all_rows:
        if row.faq_id not in aggregated:
            aggregated[row.faq_id] = {
                "total": 0,
                "useful_count": 0,
                "comments": [],
            }
        agg = aggregated[row.faq_id]
        agg["total"] += 1
        if row.useful:
            agg["useful_count"] += 1
        if row.comment:
            agg["comments"].append(row.comment)

    # Construir items, ordenados por total desc
    items_all: list[FaqStatsItem] = []
    for faq_id, agg in sorted(aggregated.items(), key=lambda x: x[1]["total"], reverse=True):
        total = agg["total"]
        useful_count = agg["useful_count"]
        ratio = useful_count / total if total > 0 else 0.0
        # Últimos 10 comentarios (el query ya está ordenado desc por created_at)
        recent_comments = agg["comments"][:10]
        items_all.append(
            FaqStatsItem(
                faq_id=faq_id,
                total=total,
                useful_count=useful_count,
                useful_ratio=round(ratio, 4),
                recent_comments=recent_comments,
            )
        )

    total_faqs = len(items_all)
    items_page = items_all[offset : offset + limit]

    return FaqStatsResponse(
        total_faqs=total_faqs,
        offset=offset,
        limit=limit,
        items=items_page,
    )
