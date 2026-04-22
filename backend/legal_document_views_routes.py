"""
Endpoints de registro de apertura de documentos legales — Bloque legal-viewer-v1.

Implementa D-L5 del plan docs/plans/bloque-legal-viewer-v1/plan.md.

Endpoints:
- POST /legal/documents/{doc_key}/viewed
    Registra que un usuario (autenticado o anónimo) abrió un documento legal.
    Retorna 201 con el id del registro y el timestamp.
    Retorna 409 si el hash del documento no coincide con el canónico vigente
    (Art. 7(1) GDPR: el usuario debe leer la versión actual).

- GET /legal/documents/views
    Lista las aperturas de un session_token anónimo (query param).
    Retorna array con {doc_key, doc_version, viewed_at_utc, scrolled_to_end}.
    Usado por el frontend para mostrar 'Leído' en el consent modal.

- GET /legal/documents/{doc_key}/raw
    Sirve el contenido markdown del documento canónico con su hash y versión.
    El frontend lo renderiza con react-markdown (D-L1).
    Cachea en memoria por hash para no leer disco en cada request.

Referencias legales:
- GDPR Art. 7(1) (Reglamento UE 2016/679): demostrabilidad del consentimiento.
  URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
- GDPR Art. 6(1)(f): interés legítimo como base del registro de apertura.
- GDPR Art. 17(3)(e): retención 5 años para ejercicio/defensa de reclamaciones.
- GDPR Art. 5(1)(c): minimización — UA truncado a 512 chars, IP cruda con
  pseudonimización planificada a 12 meses (campo pseudonymized_at_utc).
- Art. 2515 Código Civil Chile: prescripción ordinaria 5 años.
  URL: https://www.bcn.cl/leychile/navegar?idNorma=172986

Rate limit: 300 POST/hora por IP (aprobado por legal-docs-keeper D-L5).
Enforcer: decorador @limiter.limit en el endpoint POST.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import DocumentView, get_db
from middleware import get_current_user_optional

logger = logging.getLogger("conniku.legal_views")

# ─── Constantes ───────────────────────────────────────────────────────────────

# Doc keys permitidos. Validación a nivel de path param y modelo.
DocKey = Literal["terms", "privacy", "cookies", "age-declaration"]

# Hashes canónicos tomados de docs/legal/v3.2/METADATA.yaml.
# Si cambia un documento, actualizar aquí y recalcular con:
#   shasum -a 256 docs/legal/v3.2/<archivo>.md
#
# Fuente: docs/02-legal/vigentes/METADATA.yaml — actualizado 22/04/2026.
CANONICAL_HASHES: dict[str, str] = {
    "privacy": "cc9332741bea7ad4539fd6a8a049946e44521b9ae8ed97833dd112412b8c746e",
    "terms": "b2b834b61e19db6b2f7aa8176e8958f4e001d49a02606097c462811f6e008d73",
    "cookies": "80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c",
    "age-declaration": "61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b",
}

CANONICAL_VERSIONS: dict[str, str] = {
    "privacy": "2.4.2",
    "terms": "3.2.2",
    "cookies": "1.0.0",
    "age-declaration": "1.0.0",
}

VIGENCIAS: dict[str, str] = {
    "privacy": "2026-04-23",
    "terms": "2026-04-20",
    "cookies": "2026-04-21",
    "age-declaration": "2026-04-18",
}

# Archivos markdown canónicos (relativos al repo root)
_REPO_ROOT = Path(__file__).parent.parent
_LEGAL_DIR = _REPO_ROOT / "docs" / "02-legal" / "vigentes"

DOC_FILE_MAP: dict[str, str] = {
    "privacy": "privacy.md",
    "terms": "terms.md",
    "cookies": "cookies.md",
    "age-declaration": "age-declaration.md",
}

# Cache en memoria: {doc_key: content_str}
# Se invalida si el hash del archivo cambia. En producción el proceso no
# se reinicia con cada request, así que la primera lectura es la única.
_CONTENT_CACHE: dict[str, str] = {}

# Retención legal: 5 años ≈ 1825 días
# GDPR Art. 17(3)(e) + Art. 2515 Código Civil Chile
_RETENTION_DAYS = 1825

# User-Agent max length (GDPR Art. 5(1)(c) minimización)
_UA_MAX_LEN = 512

# ─── Router ───────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/legal", tags=["legal"])

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────


class ViewedPayload(BaseModel):
    """Payload del POST /legal/documents/{doc_key}/viewed."""

    session_token: Optional[str] = Field(
        None,
        description="UUID4 de sesión anónima pre-registro (opcional si hay JWT).",
    )
    scrolled_to_end: bool = Field(
        False,
        description="True si el usuario hizo scroll hasta el final del documento.",
    )
    doc_hash: str = Field(
        ...,
        min_length=64,
        max_length=64,
        description="SHA-256 del archivo canónico tal como lo muestra el frontend.",
    )


class ViewedResponse(BaseModel):
    """Respuesta 201 del POST."""

    id: str
    viewed_at_utc: str


class ViewItem(BaseModel):
    """Elemento del array GET /legal/documents/views."""

    doc_key: str
    doc_version: str
    viewed_at_utc: str
    scrolled_to_end: bool


class RawDocResponse(BaseModel):
    """Respuesta del GET /legal/documents/{doc_key}/raw."""

    content: str
    doc_version: str
    doc_hash: str
    vigencia_desde: str


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _get_client_ip(request: Request) -> Optional[str]:
    """Obtiene la IP del cliente desde x-forwarded-for (proxy) o request.client."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Tomar la primera IP (la del cliente original) en caso de cadena de proxies
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _truncate_ua(user_agent: Optional[str]) -> Optional[str]:
    """Trunca el User-Agent a _UA_MAX_LEN chars (GDPR Art. 5(1)(c) minimización)."""
    if not user_agent:
        return None
    return user_agent[:_UA_MAX_LEN]


def _load_doc_content(doc_key: str) -> str:
    """Carga el contenido markdown del documento canónico.

    Usa cache en memoria: una sola lectura de disco por proceso.
    Si el archivo no existe, lanza FileNotFoundError (traducido a 500 por el handler).
    """
    if doc_key in _CONTENT_CACHE:
        return _CONTENT_CACHE[doc_key]

    file_name = DOC_FILE_MAP[doc_key]
    file_path = _LEGAL_DIR / file_name
    content = file_path.read_text(encoding="utf-8")
    _CONTENT_CACHE[doc_key] = content
    logger.info("Documento legal cargado en cache: %s (%d chars)", doc_key, len(content))
    return content


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post(
    "/documents/{doc_key}/viewed",
    status_code=201,
    response_model=ViewedResponse,
    summary="Registra apertura de documento legal",
)
async def post_document_viewed(
    doc_key: DocKey,
    payload: ViewedPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
) -> ViewedResponse:
    """Registra que un usuario (autenticado o anónimo) abrió un documento legal.

    Rate limit: 300 POST/hora por IP (aprobado por legal-docs-keeper D-L5).

    Retorna 409 si doc_hash no coincide con el hash canónico vigente
    (GDPR Art. 7(1): el usuario debe leer la versión actual antes de firmar).
    """
    # Validar que el hash enviado coincide con el hash canónico vigente.
    # Si no coincide, el usuario está viendo una versión obsoleta del documento.
    canonical_hash = CANONICAL_HASHES[doc_key]
    if payload.doc_hash != canonical_hash:
        raise HTTPException(
            status_code=409,
            detail=(f"Document hash mismatch, user must re-read current version. Current hash: {canonical_hash}"),
        )

    now_utc = datetime.utcnow()
    retained_until = now_utc + timedelta(days=_RETENTION_DAYS)

    user_id: Optional[str] = None
    if current_user is not None:
        user_id = current_user.id

    ip = _get_client_ip(request)
    ua = _truncate_ua(request.headers.get("user-agent"))

    row = DocumentView(
        user_id=user_id,
        session_token=payload.session_token,
        doc_key=doc_key,
        doc_version=CANONICAL_VERSIONS[doc_key],
        doc_hash=canonical_hash,
        viewed_at_utc=now_utc,
        scrolled_to_end=payload.scrolled_to_end,
        ip_address=ip,
        user_agent=ua,
        retained_until_utc=retained_until,
        pseudonymized_at_utc=None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    logger.info(
        "document_view registrado: doc_key=%s user_id=%s session=%s",
        doc_key,
        user_id,
        payload.session_token,
    )

    return ViewedResponse(
        id=row.id,
        viewed_at_utc=row.viewed_at_utc.isoformat() + "Z",
    )


@router.get(
    "/documents/views",
    response_model=list[ViewItem],
    summary="Lista aperturas por session_token anónimo",
)
async def get_document_views(
    session_token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
) -> list[ViewItem]:
    """Lista las aperturas de documentos para un session_token anónimo o usuario autenticado.

    Usado por el frontend para mostrar 'Leído' en el consent modal (Bloque 7).
    Prioriza user_id si hay JWT; si no, filtra por session_token.
    """
    query = db.query(DocumentView)

    if current_user is not None:
        query = query.filter(DocumentView.user_id == current_user.id)
    elif session_token:
        query = query.filter(DocumentView.session_token == session_token)
    else:
        return []

    rows = query.order_by(DocumentView.viewed_at_utc.desc()).all()

    return [
        ViewItem(
            doc_key=row.doc_key,
            doc_version=row.doc_version,
            viewed_at_utc=row.viewed_at_utc.isoformat() + "Z",
            scrolled_to_end=row.scrolled_to_end,
        )
        for row in rows
    ]


@router.get(
    "/documents/{doc_key}/raw",
    response_model=RawDocResponse,
    summary="Sirve el markdown canónico del documento legal",
)
async def get_document_raw(doc_key: DocKey) -> RawDocResponse:
    """Sirve el contenido markdown del documento canónico.

    El frontend lo renderiza con react-markdown (D-L1).
    Cachea en memoria por sesión de proceso — sin overhead en requests repetidos.
    Retorna hash canónico de METADATA.yaml para que el frontend pueda verificar
    integridad byte-a-byte (GDPR Art. 7(1)).
    """
    try:
        content = _load_doc_content(doc_key)
    except FileNotFoundError:
        logger.error("Archivo de documento legal no encontrado: %s", doc_key)
        raise HTTPException(
            status_code=500,
            detail=f"Documento {doc_key!r} no disponible. Contacta a contacto@conniku.com.",
        )

    return RawDocResponse(
        content=content,
        doc_version=CANONICAL_VERSIONS[doc_key],
        doc_hash=CANONICAL_HASHES[doc_key],
        vigencia_desde=VIGENCIAS[doc_key],
    )
