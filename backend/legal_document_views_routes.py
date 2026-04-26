"""
Endpoints de registro de vistas de documentos legales.

- POST /legal/documents/{doc_key}/viewed
    Registra que un visitante (anónimo o autenticado) abrió y reconoció
    un documento legal. Crea una fila en document_views con el hash
    canónico vigente, session_token y scrolled_to_end.

- GET /legal/documents/views
    Devuelve las vistas con scrolled_to_end=True para un session_token.
    Usado por el frontend para mostrar qué docs ya fueron aceptados.

Referencias legales:
- GDPR Art. 7(1): el responsable debe demostrar el consentimiento.
- GDPR Art. 17(3)(e) + Art. 2515 CC Chile: retención 5 años.
- GDPR Art. 5(1)(c): minimización — UA truncado a 512 chars.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from constants.legal_versions import CANONICAL_DOC_HASHES, CANONICAL_DOC_VERSIONS
from database import DocumentView, gen_id, get_db

logger = logging.getLogger("conniku.legal_views")

router = APIRouter(prefix="/legal", tags=["legal"])

VALID_DOC_KEYS = {"terms", "privacy", "cookies", "age-declaration"}
_RETENTION_DAYS = 1825  # GDPR Art. 17(3)(e) + Art. 2515 CC Chile
_UA_MAX_LEN = 512


class ViewedPayload(BaseModel):
    session_token: str
    scrolled_to_end: bool = True


@router.post("/documents/{doc_key}/viewed", status_code=201)
def record_document_view(
    doc_key: str,
    payload: ViewedPayload,
    request: Request,
    db: Session = Depends(get_db),
):
    if doc_key not in VALID_DOC_KEYS:
        raise HTTPException(400, f"doc_key inválido: {doc_key}")

    doc_hash = CANONICAL_DOC_HASHES.get(doc_key, "")
    doc_version = CANONICAL_DOC_VERSIONS.get(doc_key, "")

    client_ip = request.client.host if request.client else None
    ua = (request.headers.get("user-agent") or "")[:_UA_MAX_LEN]

    view = DocumentView(
        id=gen_id(),
        session_token=payload.session_token,
        doc_key=doc_key,
        doc_version=doc_version,
        doc_hash=doc_hash,
        viewed_at_utc=datetime.utcnow(),
        scrolled_to_end=payload.scrolled_to_end,
        ip_address=client_ip,
        user_agent=ua,
        retained_until_utc=datetime.utcnow() + timedelta(days=_RETENTION_DAYS),
    )
    db.add(view)
    db.commit()
    db.refresh(view)

    logger.info(
        "[legal_views] doc=%s session=%s scrolled=%s ip=%s",
        doc_key,
        payload.session_token[:8] + "…",
        payload.scrolled_to_end,
        client_ip,
    )

    return {
        "id": view.id,
        "doc_key": doc_key,
        "doc_version": doc_version,
        "viewed_at_utc": view.viewed_at_utc.isoformat(),
    }


@router.get("/documents/views")
def get_views_for_session(session_token: str, db: Session = Depends(get_db)):
    views = (
        db.query(DocumentView)
        .filter(
            DocumentView.session_token == session_token,
            DocumentView.scrolled_to_end.is_(True),
        )
        .all()
    )
    return [
        {
            "doc_key": v.doc_key,
            "doc_version": v.doc_version,
            "viewed_at_utc": v.viewed_at_utc.isoformat(),
        }
        for v in views
    ]
