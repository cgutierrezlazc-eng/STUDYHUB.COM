"""
email_doc_routes.py — Mail → Contabilidad
Polls ceo@conniku.com via IMAP every 30 min, parses attachments (PDF/images),
extracts key accounting data, and queues documents for CEO manual review.

REGLA CRÍTICA: Este sistema NUNCA crea asientos contables automáticamente.
Solo presenta documentos para revisión manual. Toda acción contable
requiere aprobación explícita del CEO desde la interfaz de administración.

Env vars:
  CEO_EMAIL      (default: ceo@conniku.com)
  SMTP_PASS_CEO  — contraseña para ceo@conniku.com (misma para IMAP/SMTP en Zoho)
  IMAP_HOST      (default: imap.zoho.com)
  IMAP_PORT      (default: 993)
"""
import base64
import email as _email_lib
import email.header
import email.utils
import imaplib
import io
import json
import logging
import os
import re
import ssl
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import Column, String, Text, Boolean, DateTime, Float, Index, desc
from sqlalchemy.orm import Session

from database import Base, engine, get_db, gen_id
from middleware import get_current_user, require_admin

logger = logging.getLogger("conniku.email_docs")

router = APIRouter(prefix="/email-docs", tags=["email-docs"])

# ─── Config ──────────────────────────────────────────────────────
IMAP_HOST = os.environ.get("IMAP_HOST", "imap.zoho.com")
IMAP_PORT = int(os.environ.get("IMAP_PORT", "993"))
CEO_EMAIL = os.environ.get("CEO_EMAIL", "ceo@conniku.com")
IMAP_PASS = os.environ.get("SMTP_PASS_CEO", os.environ.get("SMTP_PASS", ""))

# MIME types accepted as accounting documents
ACCEPTED_MIME = {
    "application/pdf",
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

# ─── SQLAlchemy model ─────────────────────────────────────────────

class EmailDocument(Base):
    __tablename__ = "email_documents"

    id               = Column(String(16), primary_key=True, default=gen_id)

    # Email metadata
    email_uid        = Column(String(100), nullable=True, index=True)   # IMAP UID — deduplication
    email_subject    = Column(String(500),  default="")
    email_from       = Column(String(500),  default="")
    email_date       = Column(DateTime,     nullable=True)

    # Attachment info
    filename         = Column(String(500),  default="")
    mime_type        = Column(String(100),  default="application/pdf")
    file_content_b64 = Column(Text,         nullable=True)              # base64 encoded file

    # Extracted accounting data (heuristic parsing — for reference only)
    extracted_amount     = Column(Float,      nullable=True)
    extracted_currency   = Column(String(10), default="CLP")
    extracted_date       = Column(String(50), default="")
    extracted_vendor     = Column(String(500), default="")
    extracted_doc_type   = Column(String(50), default="")      # factura|boleta|boleta_honorarios|nota_credito|recibo|invoice|otro
    extracted_doc_number = Column(String(100), default="")
    extracted_text       = Column(Text,       default="")      # first 2 000 chars of extracted text

    # Review workflow — NEVER auto-create entries
    status       = Column(String(20), default="pending")       # pending|reviewed|dismissed|entry_created
    admin_notes  = Column(Text,       default="")
    reviewed_by  = Column(String(16), nullable=True)
    reviewed_at  = Column(DateTime,   nullable=True)

    created_at   = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_emaildoc_status", "status"),
    )


# Create table if missing
try:
    Base.metadata.create_all(engine)
except Exception:
    try:
        EmailDocument.__table__.create(engine, checkfirst=True)
    except Exception:
        pass


# ─── PDF / text extraction ────────────────────────────────────────

def _extract_pdf_text(content: bytes) -> str:
    """Extract plain text from PDF using pdfplumber (max 5 pages, 3 000 chars)."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            parts = []
            for page in pdf.pages[:5]:
                t = page.extract_text()
                if t:
                    parts.append(t)
            return "\n".join(parts)[:3000]
    except Exception as e:
        logger.debug(f"[EmailDoc] PDF extract: {e}")
        return ""


def _parse_accounting_data(text: str, sender: str, subject: str) -> dict:
    """
    Heuristic extraction of accounting metadata from document text.
    Returns a dict with keys: amount, currency, date, vendor, doc_type, doc_number.
    All values are hints for the CEO — human verification is required.
    """
    result = dict(amount=None, currency="CLP", date="", vendor="", doc_type="", doc_number="")
    tl = text.lower()

    # ── Amount ──
    for pat, cur in [
        (r'(?:TOTAL|Total|Neto|NETO|Monto|MONTO|IMPORTE)\s*:?\s*\$?\s*([\d\.,]+)', "CLP"),
        (r'\$\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?)', "CLP"),
        (r'(?:CLP)\s*[\$]?\s*([\d\.,]+)', "CLP"),
        (r'(?:USD|US\$)\s*\$?\s*([\d,]+\.?\d*)', "USD"),
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            raw = m.group(1).replace(".", "").replace(",", ".")
            try:
                result["amount"] = float(raw)
                result["currency"] = cur
                break
            except ValueError:
                pass

    # ── Date (DD/MM/YYYY or YYYY-MM-DD or DD-MM-YYYY) ──
    for pat in [r'\d{2}/\d{2}/\d{4}', r'\d{4}-\d{2}-\d{2}', r'\d{2}-\d{2}-\d{4}']:
        m = re.search(pat, text)
        if m:
            result["date"] = m.group(0)
            break

    # ── Document type (keyword matching) ──
    doc_map = [
        ("factura_exenta",    ["factura exenta", "dte tipo 34", "tipo 34"]),
        ("factura",           ["factura electrónica", "factura electronica", "dte tipo 33", "tipo 33", "factura de venta"]),
        ("boleta_honorarios", ["boleta de honorarios", "honorarios"]),
        ("boleta",            ["boleta electrónica", "boleta electronica", "dte tipo 39", "tipo 39", "boleta de venta"]),
        ("nota_credito",      ["nota de crédito", "nota de credito", "dte tipo 61"]),
        ("nota_debito",       ["nota de débito", "nota de debito", "dte tipo 56"]),
        ("invoice",           ["invoice", "receipt"]),
        ("recibo",            ["recibo", "comprobante de pago", "voucher"]),
    ]
    for dtype, keywords in doc_map:
        if any(k in tl for k in keywords):
            result["doc_type"] = dtype
            break

    # ── Document number ──
    num_m = re.search(r'(?:N[°º]|No\.?|Folio|Número|Número de documento)\s*:?\s*(\d+)', text, re.IGNORECASE)
    if num_m:
        result["doc_number"] = num_m.group(1)

    # ── Vendor ──
    vendor_m = re.search(
        r'(?:Emisor|Razón Social|Razon Social|Proveedor|Empresa|Nombre Empresa)\s*:?\s*([^\n]{4,80})',
        text, re.IGNORECASE
    )
    if vendor_m:
        result["vendor"] = vendor_m.group(1).strip()
    else:
        # Fall back to sender "Name <email>"
        name_part = sender.split("<")[0].strip().strip('"')
        result["vendor"] = name_part or sender[:100]

    return result


# ─── IMAP polling ─────────────────────────────────────────────────

def _connect_imap() -> imaplib.IMAP4_SSL:
    ctx = ssl.create_default_context()
    mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=ctx)
    mail.login(CEO_EMAIL, IMAP_PASS)
    return mail


def poll_email_inbox(db: Session = None) -> dict:
    """
    Poll ceo@conniku.com IMAP INBOX for unread emails with attachments.
    Downloads documents, parses metadata, saves EmailDocument records for manual review.
    Marks processed emails as Seen to prevent re-processing.

    NUNCA crea asientos contables — solo guarda documentos para revisión.
    """
    if not IMAP_PASS:
        logger.warning("[EmailDoc] IMAP_PASS not configured — poll skipped")
        return {"processed": 0, "skipped": 0, "errors": 0, "detail": "IMAP_PASS not set"}

    own_db = db is None
    if own_db:
        from database import SessionLocal
        db = SessionLocal()

    stats = {"processed": 0, "skipped": 0, "errors": 0}

    try:
        mail = _connect_imap()
        mail.select("INBOX")

        # Fetch UIDs of unseen messages
        _, data = mail.uid("search", None, "UNSEEN")
        uids = data[0].split() if data[0] else []
        logger.info(f"[EmailDoc] {len(uids)} unread message(s) in INBOX")

        for uid_bytes in uids:
            uid_str = uid_bytes.decode()

            # Skip if we already processed this UID
            if db.query(EmailDocument).filter(EmailDocument.email_uid == uid_str).first():
                stats["skipped"] += 1
                mail.uid("store", uid_bytes, "+FLAGS", "\\Seen")
                continue

            try:
                _, msg_data = mail.uid("fetch", uid_bytes, "(RFC822)")
                raw_bytes = msg_data[0][1]
                msg = _email_lib.message_from_bytes(raw_bytes)

                # ── Parse headers ──
                subj_raw  = _email_lib.header.decode_header(msg.get("Subject", ""))[0]
                subject   = (subj_raw[0].decode(subj_raw[1] or "utf-8") if isinstance(subj_raw[0], bytes) else str(subj_raw[0]))[:500]
                sender    = msg.get("From", "")[:500]
                date_str  = msg.get("Date", "")
                email_dt  = None
                try:
                    email_dt = _email_lib.utils.parsedate_to_datetime(date_str)
                except Exception:
                    pass

                first_attachment = True  # only first attachment per email gets the IMAP UID
                found_any = False

                for part in msg.walk():
                    ctype       = part.get_content_type()
                    disposition = str(part.get("Content-Disposition", ""))

                    # Accept if it's a known accounting MIME type or has attachment disposition
                    is_attachment = "attachment" in disposition or "inline" in disposition
                    if ctype not in ACCEPTED_MIME and not is_attachment:
                        continue
                    if ctype not in ACCEPTED_MIME:
                        continue

                    fname   = part.get_filename() or f"documento.{ctype.split('/')[-1]}"
                    payload = part.get_payload(decode=True)
                    if not payload or len(payload) > 15 * 1024 * 1024:
                        continue

                    # Extract text
                    extracted = ""
                    if ctype == "application/pdf":
                        extracted = _extract_pdf_text(payload)

                    parsed = _parse_accounting_data(extracted, sender, subject)

                    doc = EmailDocument(
                        email_uid        = uid_str if first_attachment else None,
                        email_subject    = subject,
                        email_from       = sender,
                        email_date       = email_dt,
                        filename         = fname[:500],
                        mime_type        = ctype,
                        file_content_b64 = base64.b64encode(payload).decode(),
                        extracted_amount     = parsed["amount"],
                        extracted_currency   = parsed["currency"],
                        extracted_date       = parsed["date"],
                        extracted_vendor     = parsed["vendor"][:500],
                        extracted_doc_type   = parsed["doc_type"],
                        extracted_doc_number = parsed["doc_number"],
                        extracted_text       = extracted[:2000],
                        status           = "pending",
                    )
                    db.add(doc)
                    first_attachment = False
                    found_any = True
                    stats["processed"] += 1

                if not found_any:
                    stats["skipped"] += 1

                # Mark as Seen regardless (avoid endless re-fetch of emails without docs)
                mail.uid("store", uid_bytes, "+FLAGS", "\\Seen")

            except Exception as e:
                logger.error(f"[EmailDoc] Error processing UID {uid_str}: {e}")
                stats["errors"] += 1

        db.commit()
        mail.logout()
        logger.info(f"[EmailDoc] Poll done — {stats}")

    except Exception as e:
        logger.error(f"[EmailDoc] IMAP connection error: {e}")
        stats["errors"] += 1
        stats["detail"] = str(e)
        if own_db:
            try:
                db.rollback()
            except Exception:
                pass
    finally:
        if own_db:
            db.close()

    return stats


# ─── Serializer ───────────────────────────────────────────────────

def _doc_to_dict(d: EmailDocument, include_file: bool = False) -> dict:
    out = {
        "id":                   d.id,
        "email_uid":            d.email_uid,
        "email_subject":        d.email_subject,
        "email_from":           d.email_from,
        "email_date":           d.email_date.isoformat() if d.email_date else None,
        "filename":             d.filename,
        "mime_type":            d.mime_type,
        "has_file":             bool(d.file_content_b64),
        "extracted_amount":     d.extracted_amount,
        "extracted_currency":   d.extracted_currency,
        "extracted_date":       d.extracted_date,
        "extracted_vendor":     d.extracted_vendor,
        "extracted_doc_type":   d.extracted_doc_type,
        "extracted_doc_number": d.extracted_doc_number,
        "extracted_text":       d.extracted_text,
        "status":               d.status,
        "admin_notes":          d.admin_notes,
        "reviewed_at":          d.reviewed_at.isoformat() if d.reviewed_at else None,
        "created_at":           d.created_at.isoformat() if d.created_at else None,
    }
    if include_file:
        out["file_content_b64"] = d.file_content_b64
        out["mime_type"]        = d.mime_type
    return out


# ─── API routes ───────────────────────────────────────────────────

@router.get("/")
def list_email_docs(
    status: Optional[str] = None,
    limit: int = 50,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List documents received by email, newest first. Filter by status."""
    q = db.query(EmailDocument)
    if status:
        q = q.filter(EmailDocument.status == status)
    else:
        # Default: only pending + reviewed (skip dismissed by default)
        q = q.filter(EmailDocument.status.in_(["pending", "reviewed"]))
    docs = q.order_by(desc(EmailDocument.created_at)).limit(limit).all()
    return {
        "docs": [_doc_to_dict(d) for d in docs],
        "total": q.count(),
    }


@router.get("/stats")
def email_docs_stats(admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Quick count per status for the admin badge."""
    pending   = db.query(EmailDocument).filter(EmailDocument.status == "pending").count()
    reviewed  = db.query(EmailDocument).filter(EmailDocument.status == "reviewed").count()
    dismissed = db.query(EmailDocument).filter(EmailDocument.status == "dismissed").count()
    created   = db.query(EmailDocument).filter(EmailDocument.status == "entry_created").count()
    return {"pending": pending, "reviewed": reviewed, "dismissed": dismissed, "entry_created": created}


@router.get("/{doc_id}/download")
def download_email_doc(
    doc_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return base64 content + MIME so the frontend can trigger a download."""
    doc = db.query(EmailDocument).filter(EmailDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if not doc.file_content_b64:
        raise HTTPException(404, "Archivo no disponible")
    return {
        "filename":         doc.filename,
        "mime_type":        doc.mime_type,
        "file_content_b64": doc.file_content_b64,
    }


class ReviewUpdate(BaseModel):
    status: str        # reviewed | dismissed | entry_created
    admin_notes: str = ""


@router.put("/{doc_id}/review")
def review_email_doc(
    doc_id: str,
    body: ReviewUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Mark document as reviewed, dismissed, or entry_created."""
    doc = db.query(EmailDocument).filter(EmailDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    valid_statuses = {"reviewed", "dismissed", "entry_created", "pending"}
    if body.status not in valid_statuses:
        raise HTTPException(400, f"Estado inválido. Opciones: {', '.join(valid_statuses)}")

    doc.status      = body.status
    doc.admin_notes = body.admin_notes or doc.admin_notes
    doc.reviewed_at = datetime.utcnow()
    doc.reviewed_by = admin.id
    db.commit()
    db.refresh(doc)
    return {"ok": True, "doc": _doc_to_dict(doc)}


@router.post("/poll")
async def manual_poll(admin=Depends(require_admin), db: Session = Depends(get_db)):
    """
    Trigger an immediate IMAP poll (CEO can press this without waiting 30 min).
    NOTA: solo descarga documentos para revisión — nunca crea asientos automáticamente.
    """
    result = poll_email_inbox(db)
    return {"ok": True, "result": result}
