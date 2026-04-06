"""
Tutor / External Service Provider Management for Conniku.
Tutors are EXTERNAL contractors (boleta de honorarios), NOT employees.
Students pay Conniku -> Conniku takes 10% commission -> pays tutor 90% gross.
Tutor is responsible for their own SII tax retention (13.75%).
All monetary values are in CLP unless otherwise noted.
"""
import json
import os
import random
import string
import logging
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, Float,
    ForeignKey, Index, UniqueConstraint, desc, func, and_, or_,
)
from sqlalchemy.orm import Session, relationship

from database import Base, engine, get_db, User, gen_id, DATA_DIR
from middleware import get_current_user

logger = logging.getLogger("conniku.tutors")

router = APIRouter(prefix="/tutors", tags=["tutors"])

# Commission rate: Conniku keeps 10%, tutor receives 90%
CONNIKU_COMMISSION_RATE = 0.10
TUTOR_RATE = 0.90

# Auto-confirm window: 48 hours after class scheduled end time
AUTO_CONFIRM_HOURS = 48

# Upload directory
TUTOR_UPLOADS_DIR = DATA_DIR / "tutor_uploads"
TUTOR_UPLOADS_DIR.mkdir(exist_ok=True)


# ─── Helpers ──────────────────────────────────────────────────

def _require_admin_access(user: User):
    """Only owner or admin can access admin tutor routes."""
    role = getattr(user, "role", "user") or "user"
    if role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Acceso restringido a owner/admin")


def _generate_tutor_role_number(db: Session) -> str:
    """Generate a unique tutor role number: CK-T-XXXXX (5 uppercase alphanumeric)."""
    for _ in range(100):
        suffix = "".join(random.SystemRandom().choices(string.ascii_uppercase + string.digits, k=5))
        number = f"CK-T-{suffix}"
        existing = db.query(TutorProfile).filter(TutorProfile.tutor_role_number == number).first()
        if not existing:
            return number
    raise HTTPException(status_code=500, detail="No se pudo generar un numero de tutor unico")


def _generate_payslip_folio(db: Session) -> str:
    """Generate unique payslip folio: TPS-YYYYMMDD-XXXXX."""
    now = datetime.utcnow()
    prefix = f"TPS-{now.strftime('%Y%m%d')}"
    for _ in range(100):
        suffix = "".join(random.SystemRandom().choices(string.digits, k=5))
        folio = f"{prefix}-{suffix}"
        existing = db.query(TutorPayslip).filter(TutorPayslip.folio == folio).first()
        if not existing:
            return folio
    raise HTTPException(status_code=500, detail="No se pudo generar un folio unico")


def _validate_rut(rut: str) -> bool:
    """Basic Chilean RUT validation (format and check digit)."""
    clean = rut.replace(".", "").replace("-", "").upper()
    if len(clean) < 2:
        return False
    body, dv = clean[:-1], clean[-1]
    if not body.isdigit():
        return False
    total = 0
    factor = 2
    for ch in reversed(body):
        total += int(ch) * factor
        factor = factor + 1 if factor < 7 else 2
    remainder = 11 - (total % 11)
    expected = "0" if remainder == 11 else "K" if remainder == 10 else str(remainder)
    return dv == expected


# ═══════════════════════════════════════════════════════════════════
#  DATABASE MODELS
# ═══════════════════════════════════════════════════════════════════

class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    tutor_role_number = Column(String(12), unique=True, nullable=False, index=True)  # CK-T-XXXXX

    # Status
    status = Column(String(20), default="pending_review")  # pending_review/approved/rejected/suspended/appealing

    # Academic / professional
    professional_title = Column(String(255), default="")
    institution = Column(String(255), default="")
    graduation_year = Column(Integer, nullable=True)
    career = Column(String(255), default="")
    experience_years = Column(Integer, default=0)
    bio = Column(Text, default="")
    specialties = Column(Text, default="[]")  # JSON array of specialty strings

    # Rates (CLP per hour)
    individual_rate = Column(Float, default=0)
    group_2_rate = Column(Float, default=0)
    group_3_rate = Column(Float, default=0)
    group_4_rate = Column(Float, default=0)
    group_5_rate = Column(Float, default=0)

    # Payment preferences
    payment_frequency = Column(String(20), default="per_class")  # per_class/biweekly/monthly

    # Bank info
    bank_name = Column(String(100), default="")
    bank_account_type = Column(String(30), default="")  # cuenta_corriente/cuenta_vista/cuenta_rut
    bank_account_number = Column(String(50), default="")
    rut = Column(String(12), default="")

    # Stats
    rating_average = Column(Float, default=0.0)
    total_classes = Column(Integer, default=0)
    total_students = Column(Integer, default=0)

    # Contract
    contract_signed = Column(Boolean, default=False)
    contract_signed_at = Column(DateTime, nullable=True)

    # Rejection / appeal
    rejection_reason = Column(Text, nullable=True)
    appeal_text = Column(Text, nullable=True)
    appeal_at = Column(DateTime, nullable=True)

    # Verification
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(16), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("TutorDocument", back_populates="tutor", cascade="all, delete-orphan")
    classes = relationship("TutorClass", back_populates="tutor", cascade="all, delete-orphan")
    payments = relationship("TutorPayment", back_populates="tutor", cascade="all, delete-orphan")
    payslips = relationship("TutorPayslip", back_populates="tutor", cascade="all, delete-orphan")


class TutorDocument(Base):
    __tablename__ = "tutor_documents"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(30), default="otro")  # cedula/titulo/certificado_alumno/antecedentes/cv/boleta_honorarios/otro
    name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    tutor = relationship("TutorProfile", back_populates="documents")


class TutorClass(Base):
    __tablename__ = "tutor_classes"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), default="")
    materials_description = Column(Text, default="")

    zoom_link = Column(String(500), default="")
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)

    max_students = Column(Integer, default=1)  # 1-5
    current_students = Column(Integer, default=0)

    price_per_student = Column(Float, nullable=False)  # CLP
    group_size_applied = Column(Integer, default=1)  # which rate tier was used

    # published/confirmed/in_progress/completed/cancelled/disputed
    status = Column(String(20), default="published")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tutor = relationship("TutorProfile", back_populates="classes")
    enrollments = relationship("TutorClassEnrollment", back_populates="tutor_class", cascade="all, delete-orphan")


class TutorClassEnrollment(Base):
    __tablename__ = "tutor_class_enrollments"

    id = Column(String(16), primary_key=True, default=gen_id)
    class_id = Column(String(16), ForeignKey("tutor_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)

    payment_id = Column(String(16), ForeignKey("tutor_payments.id"), nullable=True)
    payment_status = Column(String(20), default="pending")  # pending/paid/refunded

    confirmed_by_student = Column(Boolean, default=False)
    confirmed_by_tutor = Column(Boolean, default=False)
    auto_confirmed_at = Column(DateTime, nullable=True)  # 48h auto-confirm

    # Rating
    rating = Column(Integer, nullable=True)  # 1-5
    rating_comment = Column(Text, nullable=True)
    rated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tutor_class = relationship("TutorClass", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_enrollment_class_student"),
    )


class TutorPayment(Base):
    __tablename__ = "tutor_payments"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    enrollment_id = Column(String(16), nullable=True)

    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)

    # Amounts
    gross_amount = Column(Float, default=0)  # what student paid
    conniku_commission = Column(Float, default=0)  # 10%
    tutor_amount = Column(Float, default=0)  # 90%

    # Boleta de honorarios
    boleta_uploaded = Column(Boolean, default=False)
    boleta_document_id = Column(String(16), ForeignKey("tutor_documents.id"), nullable=True)
    boleta_number = Column(String(50), default="")
    boleta_amount = Column(Float, default=0)

    # pending_boleta/boleta_received/processing/paid/rejected
    payment_status = Column(String(20), default="pending_boleta")

    paid_at = Column(DateTime, nullable=True)
    payment_reference = Column(String(255), default="")
    payment_method = Column(String(50), default="")  # transferencia/otro

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tutor = relationship("TutorProfile", back_populates="payments")

    __table_args__ = (
        Index("ix_tutor_payment_status", "payment_status"),
    )


class TutorPayslip(Base):
    __tablename__ = "tutor_payslips"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    folio = Column(String(30), unique=True, nullable=False, index=True)

    total_classes = Column(Integer, default=0)
    total_students = Column(Integer, default=0)
    gross_total = Column(Float, default=0)
    commission_total = Column(Float, default=0)
    net_total = Column(Float, default=0)

    payment_frequency_applied = Column(String(20), default="monthly")
    status = Column(String(20), default="generated")  # generated/sent/acknowledged

    # JSON detail: list of {class_id, title, date, student_initials, gross, commission, net}
    detail_json = Column(Text, default="[]")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tutor = relationship("TutorProfile", back_populates="payslips")

    __table_args__ = (
        Index("ix_tutor_payslip_period", "period_start", "period_end"),
    )


# Create tables
Base.metadata.create_all(engine)


# ═══════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class TutorApplyRequest(BaseModel):
    professional_title: str = ""
    institution: str = ""
    graduation_year: Optional[int] = None
    career: str = ""
    experience_years: int = 0
    bio: str = ""
    specialties: List[str] = []
    individual_rate: float = 0
    group_2_rate: float = 0
    group_3_rate: float = 0
    group_4_rate: float = 0
    group_5_rate: float = 0
    payment_frequency: str = "per_class"
    bank_name: str = ""
    bank_account_type: str = ""
    bank_account_number: str = ""
    rut: str = ""


class TutorProfileUpdate(BaseModel):
    professional_title: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None
    career: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    specialties: Optional[List[str]] = None
    individual_rate: Optional[float] = None
    group_2_rate: Optional[float] = None
    group_3_rate: Optional[float] = None
    group_4_rate: Optional[float] = None
    group_5_rate: Optional[float] = None
    payment_frequency: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_account_number: Optional[str] = None
    rut: Optional[str] = None


class ClassCreateRequest(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    materials_description: str = ""
    zoom_link: str = ""
    scheduled_at: str  # ISO datetime string
    duration_minutes: int = 60
    max_students: int = Field(default=1, ge=1, le=5)
    price_per_student: Optional[float] = None  # if None, auto-calculate from rates


class ClassRateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class BoletaUploadRequest(BaseModel):
    boleta_number: str
    boleta_amount: float


class PaymentProcessRequest(BaseModel):
    payment_reference: str = ""
    payment_method: str = "transferencia"


VALID_TUTOR_STATUS = {"pending_review", "approved", "rejected", "suspended", "appealing"}
VALID_PAYMENT_FREQUENCY = {"per_class", "biweekly", "monthly"}
VALID_DOCUMENT_TYPE = {"cedula", "titulo", "certificado_alumno", "antecedentes", "cv", "boleta_honorarios", "otro"}
VALID_CLASS_STATUS = {"published", "confirmed", "in_progress", "completed", "cancelled", "disputed"}
VALID_BANK_ACCOUNT_TYPE = {"cuenta_corriente", "cuenta_vista", "cuenta_rut", ""}


# ═══════════════════════════════════════════════════════════════════
#  SERIALIZERS
# ═══════════════════════════════════════════════════════════════════

def _tutor_to_dict(t: TutorProfile, include_bank: bool = False) -> dict:
    data = {
        "id": t.id,
        "user_id": t.user_id,
        "tutor_role_number": t.tutor_role_number,
        "status": t.status,
        "professional_title": t.professional_title,
        "institution": t.institution,
        "graduation_year": t.graduation_year,
        "career": t.career,
        "experience_years": t.experience_years,
        "bio": t.bio,
        "specialties": json.loads(t.specialties) if t.specialties else [],
        "individual_rate": t.individual_rate,
        "group_2_rate": t.group_2_rate,
        "group_3_rate": t.group_3_rate,
        "group_4_rate": t.group_4_rate,
        "group_5_rate": t.group_5_rate,
        "payment_frequency": t.payment_frequency,
        "rating_average": t.rating_average,
        "total_classes": t.total_classes,
        "total_students": t.total_students,
        "contract_signed": t.contract_signed,
        "contract_signed_at": t.contract_signed_at.isoformat() if t.contract_signed_at else None,
        "rejection_reason": t.rejection_reason,
        "appeal_text": t.appeal_text,
        "appeal_at": t.appeal_at.isoformat() if t.appeal_at else None,
        "verified_at": t.verified_at.isoformat() if t.verified_at else None,
        "verified_by": t.verified_by,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }
    if include_bank:
        data.update({
            "bank_name": t.bank_name,
            "bank_account_type": t.bank_account_type,
            "bank_account_number": t.bank_account_number,
            "rut": t.rut,
        })
    return data


def _tutor_public_dict(t: TutorProfile, user: User) -> dict:
    """Public-facing tutor info (no bank details, no internal status)."""
    return {
        "id": t.id,
        "tutor_role_number": t.tutor_role_number,
        "first_name": user.first_name if user else "",
        "last_name_initial": (user.last_name[0] + ".") if user and user.last_name else "",
        "avatar": user.avatar if user else None,
        "professional_title": t.professional_title,
        "institution": t.institution,
        "career": t.career,
        "experience_years": t.experience_years,
        "bio": t.bio,
        "specialties": json.loads(t.specialties) if t.specialties else [],
        "individual_rate": t.individual_rate,
        "group_2_rate": t.group_2_rate,
        "group_3_rate": t.group_3_rate,
        "group_4_rate": t.group_4_rate,
        "group_5_rate": t.group_5_rate,
        "rating_average": t.rating_average,
        "total_classes": t.total_classes,
        "total_students": t.total_students,
    }


def _document_to_dict(doc: TutorDocument) -> dict:
    return {
        "id": doc.id,
        "tutor_id": doc.tutor_id,
        "document_type": doc.document_type,
        "name": doc.name,
        "file_path": doc.file_path,
        "verified": doc.verified,
        "verified_at": doc.verified_at.isoformat() if doc.verified_at else None,
        "notes": doc.notes,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


def _class_to_dict(c: TutorClass, include_zoom: bool = False) -> dict:
    data = {
        "id": c.id,
        "tutor_id": c.tutor_id,
        "title": c.title,
        "description": c.description,
        "category": c.category,
        "materials_description": c.materials_description,
        "scheduled_at": c.scheduled_at.isoformat() if c.scheduled_at else None,
        "duration_minutes": c.duration_minutes,
        "max_students": c.max_students,
        "current_students": c.current_students,
        "price_per_student": c.price_per_student,
        "group_size_applied": c.group_size_applied,
        "status": c.status,
        "spots_available": max(0, c.max_students - c.current_students),
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }
    if include_zoom:
        data["zoom_link"] = c.zoom_link
    return data


def _enrollment_to_dict(e: TutorClassEnrollment) -> dict:
    return {
        "id": e.id,
        "class_id": e.class_id,
        "student_id": e.student_id,
        "payment_id": e.payment_id,
        "payment_status": e.payment_status,
        "confirmed_by_student": e.confirmed_by_student,
        "confirmed_by_tutor": e.confirmed_by_tutor,
        "auto_confirmed_at": e.auto_confirmed_at.isoformat() if e.auto_confirmed_at else None,
        "rating": e.rating,
        "rating_comment": e.rating_comment,
        "rated_at": e.rated_at.isoformat() if e.rated_at else None,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


def _payment_to_dict(p: TutorPayment) -> dict:
    return {
        "id": p.id,
        "tutor_id": p.tutor_id,
        "enrollment_id": p.enrollment_id,
        "period_start": p.period_start.isoformat() if p.period_start else None,
        "period_end": p.period_end.isoformat() if p.period_end else None,
        "gross_amount": p.gross_amount,
        "conniku_commission": p.conniku_commission,
        "tutor_amount": p.tutor_amount,
        "boleta_uploaded": p.boleta_uploaded,
        "boleta_document_id": p.boleta_document_id,
        "boleta_number": p.boleta_number,
        "boleta_amount": p.boleta_amount,
        "payment_status": p.payment_status,
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        "payment_reference": p.payment_reference,
        "payment_method": p.payment_method,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _payslip_to_dict(ps: TutorPayslip, include_detail: bool = False) -> dict:
    data = {
        "id": ps.id,
        "tutor_id": ps.tutor_id,
        "period_start": ps.period_start.isoformat() if ps.period_start else None,
        "period_end": ps.period_end.isoformat() if ps.period_end else None,
        "folio": ps.folio,
        "total_classes": ps.total_classes,
        "total_students": ps.total_students,
        "gross_total": ps.gross_total,
        "commission_total": ps.commission_total,
        "net_total": ps.net_total,
        "payment_frequency_applied": ps.payment_frequency_applied,
        "status": ps.status,
        "created_at": ps.created_at.isoformat() if ps.created_at else None,
    }
    if include_detail:
        data["detail"] = json.loads(ps.detail_json) if ps.detail_json else []
    return data


# ═══════════════════════════════════════════════════════════════════
#  TUTOR REGISTRATION & PROFILE
# ═══════════════════════════════════════════════════════════════════

@router.post("/apply")
def apply_as_tutor(
    data: TutorApplyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply to become a tutor. Creates a TutorProfile in pending_review status."""
    # Check if user already has a tutor profile
    existing = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if existing:
        if existing.status == "rejected":
            # Allow re-application by updating to appealing
            existing.status = "appealing"
            existing.appeal_text = data.bio or "Re-aplicacion"
            existing.appeal_at = datetime.utcnow()
            # Update fields
            for field in (
                "professional_title", "institution", "graduation_year", "career",
                "experience_years", "bio", "individual_rate", "group_2_rate",
                "group_3_rate", "group_4_rate", "group_5_rate", "payment_frequency",
                "bank_name", "bank_account_type", "bank_account_number", "rut",
            ):
                val = getattr(data, field, None)
                if val is not None:
                    setattr(existing, field, val)
            if data.specialties:
                existing.specialties = json.dumps(data.specialties)
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return {"ok": True, "message": "Apelacion enviada", "tutor": _tutor_to_dict(existing, include_bank=True)}
        raise HTTPException(status_code=400, detail="Ya tienes un perfil de tutor registrado")

    # Validate RUT if provided
    if data.rut and not _validate_rut(data.rut):
        raise HTTPException(status_code=400, detail="RUT invalido")

    # Validate payment frequency
    if data.payment_frequency not in VALID_PAYMENT_FREQUENCY:
        raise HTTPException(status_code=400, detail=f"Frecuencia de pago invalida. Opciones: {', '.join(VALID_PAYMENT_FREQUENCY)}")

    # Validate rates (at least individual rate required)
    if data.individual_rate <= 0:
        raise HTTPException(status_code=400, detail="Tarifa individual debe ser mayor a 0")

    tutor_role_number = _generate_tutor_role_number(db)

    profile = TutorProfile(
        user_id=user.id,
        tutor_role_number=tutor_role_number,
        status="pending_review",
        professional_title=data.professional_title,
        institution=data.institution,
        graduation_year=data.graduation_year,
        career=data.career,
        experience_years=data.experience_years,
        bio=data.bio,
        specialties=json.dumps(data.specialties),
        individual_rate=data.individual_rate,
        group_2_rate=data.group_2_rate or data.individual_rate,
        group_3_rate=data.group_3_rate or data.individual_rate,
        group_4_rate=data.group_4_rate or data.individual_rate,
        group_5_rate=data.group_5_rate or data.individual_rate,
        payment_frequency=data.payment_frequency,
        bank_name=data.bank_name,
        bank_account_type=data.bank_account_type,
        bank_account_number=data.bank_account_number,
        rut=data.rut,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {"ok": True, "message": "Solicitud enviada. Te notificaremos cuando sea revisada.", "tutor": _tutor_to_dict(profile, include_bank=True)}


@router.get("/my-profile")
def get_my_tutor_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's tutor profile."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")
    return _tutor_to_dict(profile, include_bank=True)


@router.put("/my-profile")
def update_my_tutor_profile(
    data: TutorProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update own tutor profile (rates, bank info, bio, etc.)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    if profile.status == "suspended":
        raise HTTPException(status_code=403, detail="Tu cuenta de tutor esta suspendida")

    if data.rut is not None and data.rut and not _validate_rut(data.rut):
        raise HTTPException(status_code=400, detail="RUT invalido")

    if data.payment_frequency is not None and data.payment_frequency not in VALID_PAYMENT_FREQUENCY:
        raise HTTPException(status_code=400, detail=f"Frecuencia de pago invalida")

    updatable_fields = [
        "professional_title", "institution", "graduation_year", "career",
        "experience_years", "bio", "individual_rate", "group_2_rate",
        "group_3_rate", "group_4_rate", "group_5_rate", "payment_frequency",
        "bank_name", "bank_account_type", "bank_account_number", "rut",
    ]
    for field in updatable_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(profile, field, val)

    if data.specialties is not None:
        profile.specialties = json.dumps(data.specialties)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return {"ok": True, "tutor": _tutor_to_dict(profile, include_bank=True)}


@router.post("/my-profile/documents")
async def upload_tutor_document(
    document_type: str = Form(default="otro"),
    name: str = Form(default=""),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document (cedula, titulo, boleta de honorarios, etc.)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    if document_type not in VALID_DOCUMENT_TYPE:
        raise HTTPException(status_code=400, detail=f"Tipo de documento invalido. Opciones: {', '.join(VALID_DOCUMENT_TYPE)}")

    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo excede el limite de 10MB")

    # Save file
    doc_id = gen_id()
    ext = os.path.splitext(file.filename or "file")[1] or ".pdf"
    safe_name = f"{profile.id}_{doc_id}{ext}"
    file_dir = TUTOR_UPLOADS_DIR / profile.id
    file_dir.mkdir(exist_ok=True)
    file_path = file_dir / safe_name

    with open(file_path, "wb") as f:
        f.write(contents)

    doc = TutorDocument(
        id=doc_id,
        tutor_id=profile.id,
        document_type=document_type,
        name=name or file.filename or "Documento",
        file_path=str(file_path),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {"ok": True, "document": _document_to_dict(doc)}


@router.get("/my-profile/documents")
def list_my_documents(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all documents for the current tutor."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    docs = db.query(TutorDocument).filter(TutorDocument.tutor_id == profile.id).order_by(desc(TutorDocument.created_at)).all()
    return {"documents": [_document_to_dict(d) for d in docs]}


# ═══════════════════════════════════════════════════════════════════
#  ADMIN / OWNER TUTOR MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

@router.get("/admin/applications")
def list_tutor_applications(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all pending (or filtered) tutor applications."""
    _require_admin_access(user)

    query = db.query(TutorProfile)
    if status_filter:
        query = query.filter(TutorProfile.status == status_filter)
    else:
        query = query.filter(TutorProfile.status.in_(["pending_review", "appealing"]))

    profiles = query.order_by(TutorProfile.created_at).all()

    results = []
    for p in profiles:
        u = db.query(User).filter(User.id == p.user_id).first()
        d = _tutor_to_dict(p, include_bank=True)
        d["user_name"] = f"{u.first_name} {u.last_name}" if u else "Desconocido"
        d["user_email"] = u.email if u else ""
        d["documents_count"] = db.query(TutorDocument).filter(TutorDocument.tutor_id == p.id).count()
        results.append(d)

    return {"applications": results, "total": len(results)}


@router.get("/admin/all")
def list_all_tutors(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all tutors with optional filters."""
    _require_admin_access(user)

    query = db.query(TutorProfile)
    if status_filter:
        query = query.filter(TutorProfile.status == status_filter)

    if search:
        # Search by tutor_role_number, professional_title, or user name
        query = query.filter(
            or_(
                TutorProfile.tutor_role_number.ilike(f"%{search}%"),
                TutorProfile.professional_title.ilike(f"%{search}%"),
                TutorProfile.career.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    profiles = query.order_by(desc(TutorProfile.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for p in profiles:
        u = db.query(User).filter(User.id == p.user_id).first()
        d = _tutor_to_dict(p, include_bank=True)
        d["user_name"] = f"{u.first_name} {u.last_name}" if u else "Desconocido"
        d["user_email"] = u.email if u else ""
        results.append(d)

    return {"tutors": results, "total": total, "page": page, "per_page": per_page}


@router.put("/admin/{tutor_id}/approve")
def approve_tutor(
    tutor_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve a tutor application."""
    _require_admin_access(user)

    profile = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    if profile.status not in ("pending_review", "appealing"):
        raise HTTPException(status_code=400, detail=f"No se puede aprobar un tutor en estado '{profile.status}'")

    profile.status = "approved"
    profile.verified_at = datetime.utcnow()
    profile.verified_by = user.id
    profile.rejection_reason = None
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return {"ok": True, "message": "Tutor aprobado exitosamente", "tutor": _tutor_to_dict(profile)}


@router.put("/admin/{tutor_id}/reject")
def reject_tutor(
    tutor_id: str,
    reason: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a tutor application with a reason."""
    _require_admin_access(user)

    profile = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    if profile.status not in ("pending_review", "appealing"):
        raise HTTPException(status_code=400, detail=f"No se puede rechazar un tutor en estado '{profile.status}'")

    profile.status = "rejected"
    profile.rejection_reason = reason
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return {"ok": True, "message": "Tutor rechazado", "tutor": _tutor_to_dict(profile)}


@router.put("/admin/{tutor_id}/suspend")
def suspend_tutor(
    tutor_id: str,
    reason: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Suspend an approved tutor."""
    _require_admin_access(user)

    profile = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    if profile.status != "approved":
        raise HTTPException(status_code=400, detail="Solo se puede suspender un tutor aprobado")

    profile.status = "suspended"
    profile.rejection_reason = reason
    profile.updated_at = datetime.utcnow()

    # Cancel all future published classes
    future_classes = db.query(TutorClass).filter(
        TutorClass.tutor_id == tutor_id,
        TutorClass.status == "published",
        TutorClass.scheduled_at > datetime.utcnow(),
    ).all()

    refunded_enrollments = 0
    for cls in future_classes:
        cls.status = "cancelled"
        # Refund all enrolled students
        enrollments = db.query(TutorClassEnrollment).filter(
            TutorClassEnrollment.class_id == cls.id,
            TutorClassEnrollment.payment_status == "paid",
        ).all()
        for enrollment in enrollments:
            enrollment.payment_status = "refunded"
            if enrollment.payment_id:
                payment = db.query(TutorPayment).filter(TutorPayment.id == enrollment.payment_id).first()
                if payment:
                    payment.payment_status = "rejected"
            refunded_enrollments += 1

    db.commit()
    db.refresh(profile)

    return {
        "ok": True,
        "message": f"Tutor suspendido. {len(future_classes)} clases canceladas, {refunded_enrollments} inscripciones reembolsadas.",
        "tutor": _tutor_to_dict(profile),
    }


@router.get("/admin/{tutor_id}")
def get_tutor_detail_admin(
    tutor_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full tutor detail for admin/HR view."""
    _require_admin_access(user)

    profile = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    tutor_user = db.query(User).filter(User.id == profile.user_id).first()

    docs = db.query(TutorDocument).filter(TutorDocument.tutor_id == profile.id).order_by(desc(TutorDocument.created_at)).all()

    classes = db.query(TutorClass).filter(TutorClass.tutor_id == profile.id).order_by(desc(TutorClass.scheduled_at)).limit(50).all()

    payments = db.query(TutorPayment).filter(TutorPayment.tutor_id == profile.id).order_by(desc(TutorPayment.created_at)).limit(50).all()

    payslips = db.query(TutorPayslip).filter(TutorPayslip.tutor_id == profile.id).order_by(desc(TutorPayslip.created_at)).limit(20).all()

    result = _tutor_to_dict(profile, include_bank=True)
    result["user_name"] = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
    result["user_email"] = tutor_user.email if tutor_user else ""
    result["user_phone"] = tutor_user.phone if tutor_user else ""
    result["documents"] = [_document_to_dict(d) for d in docs]
    result["classes"] = [_class_to_dict(c, include_zoom=True) for c in classes]
    result["payments"] = [_payment_to_dict(p) for p in payments]
    result["payslips"] = [_payslip_to_dict(ps) for ps in payslips]

    return result


# ═══════════════════════════════════════════════════════════════════
#  CLASSES
# ═══════════════════════════════════════════════════════════════════

def _get_rate_for_group_size(profile: TutorProfile, size: int) -> float:
    """Get the tutor's rate per student for a given group size."""
    rate_map = {
        1: profile.individual_rate,
        2: profile.group_2_rate,
        3: profile.group_3_rate,
        4: profile.group_4_rate,
        5: profile.group_5_rate,
    }
    return rate_map.get(size, profile.individual_rate) or profile.individual_rate


@router.post("/classes")
def create_class(
    data: ClassCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new class listing. Only approved tutors can create classes."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")
    if profile.status != "approved":
        raise HTTPException(status_code=403, detail="Tu perfil de tutor debe estar aprobado para crear clases")

    # Parse scheduled_at
    try:
        scheduled_at = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Formato de fecha invalido. Usa ISO 8601 (ej: 2026-04-10T15:00:00)")

    if scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="La clase debe ser programada en el futuro")

    if data.duration_minutes < 15 or data.duration_minutes > 480:
        raise HTTPException(status_code=400, detail="Duracion debe ser entre 15 y 480 minutos")

    # Calculate price per student based on max_students and tutor rates
    if data.price_per_student is not None and data.price_per_student > 0:
        price_per_student = data.price_per_student
    else:
        price_per_student = _get_rate_for_group_size(profile, data.max_students) * (data.duration_minutes / 60)

    cls = TutorClass(
        tutor_id=profile.id,
        title=data.title,
        description=data.description,
        category=data.category,
        materials_description=data.materials_description,
        zoom_link=data.zoom_link,
        scheduled_at=scheduled_at,
        duration_minutes=data.duration_minutes,
        max_students=data.max_students,
        current_students=0,
        price_per_student=round(price_per_student),
        group_size_applied=data.max_students,
        status="published",
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)

    return {"ok": True, "class": _class_to_dict(cls, include_zoom=True)}


@router.get("/classes")
def list_available_classes(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    tutor_id: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List available classes (public, for students). Shows only published future classes."""
    query = db.query(TutorClass).filter(
        TutorClass.status == "published",
        TutorClass.scheduled_at > datetime.utcnow(),
    )

    if category:
        query = query.filter(TutorClass.category.ilike(f"%{category}%"))

    if search:
        query = query.filter(
            or_(
                TutorClass.title.ilike(f"%{search}%"),
                TutorClass.description.ilike(f"%{search}%"),
            )
        )

    if tutor_id:
        query = query.filter(TutorClass.tutor_id == tutor_id)

    # Only show classes from approved tutors
    query = query.join(TutorProfile).filter(TutorProfile.status == "approved")

    total = query.count()
    classes = query.order_by(TutorClass.scheduled_at).offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for c in classes:
        d = _class_to_dict(c)
        tutor = db.query(TutorProfile).filter(TutorProfile.id == c.tutor_id).first()
        if tutor:
            tutor_user = db.query(User).filter(User.id == tutor.user_id).first()
            d["tutor_name"] = f"{tutor_user.first_name} {tutor_user.last_name[0]}." if tutor_user and tutor_user.last_name else "Tutor"
            d["tutor_role_number"] = tutor.tutor_role_number
            d["tutor_rating"] = tutor.rating_average
        results.append(d)

    return {"classes": results, "total": total, "page": page, "per_page": per_page}


@router.get("/classes/{class_id}")
def get_class_detail(
    class_id: str,
    db: Session = Depends(get_db),
):
    """Get class detail (public)."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    result = _class_to_dict(cls)
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if tutor:
        tutor_user = db.query(User).filter(User.id == tutor.user_id).first()
        result["tutor"] = _tutor_public_dict(tutor, tutor_user)

    # Include enrollments info (without student details for privacy)
    enrollments = db.query(TutorClassEnrollment).filter(TutorClassEnrollment.class_id == class_id).all()
    ratings = [e.rating for e in enrollments if e.rating is not None]
    result["enrollments_count"] = len(enrollments)
    result["average_rating"] = round(sum(ratings) / len(ratings), 2) if ratings else None
    result["ratings_count"] = len(ratings)

    return result


@router.post("/classes/{class_id}/enroll")
def enroll_in_class(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Student enrolls in a class. Creates enrollment and payment records."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    if cls.status != "published":
        raise HTTPException(status_code=400, detail="Esta clase no esta disponible para inscripcion")

    if cls.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Esta clase ya paso su fecha programada")

    if cls.current_students >= cls.max_students:
        raise HTTPException(status_code=400, detail="No hay cupos disponibles")

    # Check tutor is approved
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.status != "approved":
        raise HTTPException(status_code=400, detail="El tutor de esta clase no esta disponible")

    # Cannot enroll in own class
    if tutor.user_id == user.id:
        raise HTTPException(status_code=400, detail="No puedes inscribirte en tu propia clase")

    # Check duplicate enrollment
    existing = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya estas inscrito en esta clase")

    # Calculate commission
    gross = cls.price_per_student
    commission = round(gross * CONNIKU_COMMISSION_RATE)
    tutor_amount = gross - commission

    # Create payment record
    payment = TutorPayment(
        tutor_id=tutor.id,
        enrollment_id=None,  # will be set after enrollment created
        gross_amount=gross,
        conniku_commission=commission,
        tutor_amount=tutor_amount,
        payment_status="pending_boleta",
    )
    db.add(payment)
    db.flush()  # get payment.id

    # Create enrollment
    enrollment = TutorClassEnrollment(
        class_id=class_id,
        student_id=user.id,
        payment_id=payment.id,
        payment_status="paid",  # assume payment confirmed at enrollment time
    )
    db.add(enrollment)
    db.flush()

    # Update payment with enrollment id
    payment.enrollment_id = enrollment.id

    # Update class student count
    cls.current_students += 1

    # If class is now full, keep as published (tutor confirms when class happens)

    db.commit()
    db.refresh(enrollment)

    return {
        "ok": True,
        "message": "Inscripcion exitosa",
        "enrollment": _enrollment_to_dict(enrollment),
        "payment": _payment_to_dict(payment),
    }


@router.put("/classes/{class_id}/confirm")
def confirm_class_completed(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor confirms the class was completed."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.user_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el tutor puede confirmar la clase")

    if cls.status not in ("published", "confirmed", "in_progress"):
        raise HTTPException(status_code=400, detail=f"No se puede confirmar una clase en estado '{cls.status}'")

    cls.status = "completed"

    # Mark all enrollments as confirmed by tutor
    enrollments = db.query(TutorClassEnrollment).filter(TutorClassEnrollment.class_id == class_id).all()
    for e in enrollments:
        e.confirmed_by_tutor = True

    # Update tutor stats: each student = 1 class for stats
    student_count = len(enrollments)
    tutor.total_classes += student_count
    tutor.total_students += student_count
    tutor.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(cls)

    return {"ok": True, "message": f"Clase confirmada como completada. {student_count} estudiante(s) registrados.", "class": _class_to_dict(cls)}


@router.post("/classes/{class_id}/rate")
def rate_class(
    class_id: str,
    data: ClassRateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Student rates a completed class. One rating per student per class."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    if cls.status != "completed":
        raise HTTPException(status_code=400, detail="Solo puedes calificar clases completadas")

    # Check enrollment
    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Solo estudiantes inscritos pueden calificar")

    # Check if class is confirmed (by tutor or auto-confirmed)
    if not enrollment.confirmed_by_tutor and not enrollment.auto_confirmed_at:
        # Check auto-confirm window (48h after scheduled end)
        class_end = cls.scheduled_at + timedelta(minutes=cls.duration_minutes)
        if datetime.utcnow() > class_end + timedelta(hours=AUTO_CONFIRM_HOURS):
            enrollment.auto_confirmed_at = datetime.utcnow()
            enrollment.confirmed_by_student = True
        else:
            raise HTTPException(status_code=400, detail="La clase aun no ha sido confirmada como completada")

    if enrollment.rating is not None:
        raise HTTPException(status_code=400, detail="Ya calificaste esta clase")

    enrollment.rating = data.rating
    enrollment.rating_comment = data.comment
    enrollment.rated_at = datetime.utcnow()
    enrollment.confirmed_by_student = True

    # Recalculate tutor average rating
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if tutor:
        all_ratings = (
            db.query(TutorClassEnrollment.rating)
            .join(TutorClass, TutorClassEnrollment.class_id == TutorClass.id)
            .filter(
                TutorClass.tutor_id == tutor.id,
                TutorClassEnrollment.rating.isnot(None),
            )
            .all()
        )
        # Include the new rating
        ratings_list = [r[0] for r in all_ratings if r[0] is not None]
        if not ratings_list:
            ratings_list = [data.rating]
        tutor.rating_average = round(sum(ratings_list) / len(ratings_list), 2)
        tutor.updated_at = datetime.utcnow()

    db.commit()

    return {"ok": True, "message": "Calificacion registrada"}


# ═══════════════════════════════════════════════════════════════════
#  TUTOR NO-SHOW: GUARANTEE REFUND
# ═══════════════════════════════════════════════════════════════════

@router.post("/classes/{class_id}/report-noshow")
def report_tutor_noshow(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Student reports tutor no-show. Triggers 100% refund process (5-7 business days)."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="No estas inscrito en esta clase")

    # Class must be past its scheduled time to report no-show
    class_end = cls.scheduled_at + timedelta(minutes=cls.duration_minutes)
    if datetime.utcnow() < cls.scheduled_at:
        raise HTTPException(status_code=400, detail="La clase aun no ha comenzado")

    if cls.status == "completed":
        raise HTTPException(status_code=400, detail="La clase ya fue marcada como completada")

    if enrollment.payment_status == "refunded":
        raise HTTPException(status_code=400, detail="Ya se proceso un reembolso para esta inscripcion")

    # Mark class as disputed
    cls.status = "disputed"

    # Process refund
    enrollment.payment_status = "refunded"

    if enrollment.payment_id:
        payment = db.query(TutorPayment).filter(TutorPayment.id == enrollment.payment_id).first()
        if payment:
            payment.payment_status = "rejected"

    # Update class student count
    cls.current_students = max(0, cls.current_students - 1)

    db.commit()

    return {
        "ok": True,
        "message": "Reporte de inasistencia registrado. Se procedera con el reembolso del 100% en 5-7 dias habiles.",
    }


# ═══════════════════════════════════════════════════════════════════
#  PAYMENTS & PAYROLL
# ═══════════════════════════════════════════════════════════════════

@router.get("/my-payments")
def get_my_payments(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor views their payment history."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    query = db.query(TutorPayment).filter(TutorPayment.tutor_id == profile.id)
    if status_filter:
        query = query.filter(TutorPayment.payment_status == status_filter)

    total = query.count()
    payments = query.order_by(desc(TutorPayment.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    # Summary stats
    total_earned = db.query(func.sum(TutorPayment.tutor_amount)).filter(
        TutorPayment.tutor_id == profile.id,
        TutorPayment.payment_status == "paid",
    ).scalar() or 0

    pending_amount = db.query(func.sum(TutorPayment.tutor_amount)).filter(
        TutorPayment.tutor_id == profile.id,
        TutorPayment.payment_status.in_(["pending_boleta", "boleta_received", "processing"]),
    ).scalar() or 0

    return {
        "payments": [_payment_to_dict(p) for p in payments],
        "total": total,
        "page": page,
        "per_page": per_page,
        "summary": {
            "total_earned": total_earned,
            "pending_amount": pending_amount,
        },
    }


@router.get("/my-payslips")
def get_my_payslips(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor views their payslips."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    payslips = db.query(TutorPayslip).filter(
        TutorPayslip.tutor_id == profile.id,
    ).order_by(desc(TutorPayslip.created_at)).all()

    return {"payslips": [_payslip_to_dict(ps, include_detail=True) for ps in payslips]}


@router.post("/my-payments/{payment_id}/upload-boleta")
async def upload_boleta(
    payment_id: str,
    boleta_number: str = Form(...),
    boleta_amount: float = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor uploads their boleta de honorarios for a specific payment."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    payment = db.query(TutorPayment).filter(
        TutorPayment.id == payment_id,
        TutorPayment.tutor_id == profile.id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if payment.payment_status not in ("pending_boleta", "rejected"):
        raise HTTPException(status_code=400, detail=f"No se puede subir boleta para un pago en estado '{payment.payment_status}'")

    # Validate boleta amount matches tutor_amount (allow small tolerance for rounding)
    if abs(boleta_amount - payment.tutor_amount) > 100:
        raise HTTPException(
            status_code=400,
            detail=f"El monto de la boleta (${boleta_amount:,.0f}) no coincide con el monto a pagar (${payment.tutor_amount:,.0f}). Diferencia maxima permitida: $100",
        )

    # Save file
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo excede el limite de 10MB")

    doc_id = gen_id()
    ext = os.path.splitext(file.filename or "boleta")[1] or ".pdf"
    safe_name = f"boleta_{payment.id}_{doc_id}{ext}"
    file_dir = TUTOR_UPLOADS_DIR / profile.id
    file_dir.mkdir(exist_ok=True)
    file_path = file_dir / safe_name

    with open(file_path, "wb") as f:
        f.write(contents)

    # Create document record
    doc = TutorDocument(
        id=doc_id,
        tutor_id=profile.id,
        document_type="boleta_honorarios",
        name=f"Boleta N {boleta_number}",
        file_path=str(file_path),
    )
    db.add(doc)
    db.flush()

    # Update payment
    payment.boleta_uploaded = True
    payment.boleta_document_id = doc.id
    payment.boleta_number = boleta_number
    payment.boleta_amount = boleta_amount
    payment.payment_status = "boleta_received"

    db.commit()
    db.refresh(payment)

    return {
        "ok": True,
        "message": "Boleta subida exitosamente. El pago sera procesado en 7 dias habiles.",
        "payment": _payment_to_dict(payment),
    }


# ═══════════════════════════════════════════════════════════════════
#  ADMIN PAYMENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

@router.get("/admin/payments")
def admin_list_payments(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    tutor_id: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: list all tutor payments with filters."""
    _require_admin_access(user)

    query = db.query(TutorPayment)
    if status_filter:
        query = query.filter(TutorPayment.payment_status == status_filter)
    if tutor_id:
        query = query.filter(TutorPayment.tutor_id == tutor_id)

    total = query.count()
    payments = query.order_by(desc(TutorPayment.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for p in payments:
        d = _payment_to_dict(p)
        tutor = db.query(TutorProfile).filter(TutorProfile.id == p.tutor_id).first()
        if tutor:
            tutor_user = db.query(User).filter(User.id == tutor.user_id).first()
            d["tutor_name"] = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
            d["tutor_role_number"] = tutor.tutor_role_number
            d["tutor_rut"] = tutor.rut
            d["tutor_bank"] = f"{tutor.bank_name} - {tutor.bank_account_type} - {tutor.bank_account_number}"
        results.append(d)

    # Totals
    total_pending = db.query(func.sum(TutorPayment.tutor_amount)).filter(
        TutorPayment.payment_status.in_(["pending_boleta", "boleta_received", "processing"]),
    ).scalar() or 0
    total_paid = db.query(func.sum(TutorPayment.tutor_amount)).filter(
        TutorPayment.payment_status == "paid",
    ).scalar() or 0
    total_commission = db.query(func.sum(TutorPayment.conniku_commission)).filter(
        TutorPayment.payment_status == "paid",
    ).scalar() or 0

    return {
        "payments": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "summary": {
            "total_pending_payout": total_pending,
            "total_paid_out": total_paid,
            "total_commission_earned": total_commission,
        },
    }


@router.put("/admin/payments/{payment_id}/process")
def admin_process_payment(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: mark payment as processing (after boleta received, 7 business days)."""
    _require_admin_access(user)

    payment = db.query(TutorPayment).filter(TutorPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if payment.payment_status != "boleta_received":
        raise HTTPException(status_code=400, detail=f"Solo se puede procesar pagos con boleta recibida (estado actual: {payment.payment_status})")

    payment.payment_status = "processing"
    db.commit()
    db.refresh(payment)

    return {"ok": True, "message": "Pago marcado como en proceso", "payment": _payment_to_dict(payment)}


@router.put("/admin/payments/{payment_id}/paid")
def admin_mark_payment_paid(
    payment_id: str,
    data: PaymentProcessRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: mark payment as paid (transfer completed)."""
    _require_admin_access(user)

    payment = db.query(TutorPayment).filter(TutorPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if payment.payment_status not in ("processing", "boleta_received"):
        raise HTTPException(status_code=400, detail=f"No se puede marcar como pagado desde estado '{payment.payment_status}'")

    payment.payment_status = "paid"
    payment.paid_at = datetime.utcnow()
    payment.payment_reference = data.payment_reference
    payment.payment_method = data.payment_method
    db.commit()
    db.refresh(payment)

    return {"ok": True, "message": "Pago marcado como completado", "payment": _payment_to_dict(payment)}


@router.get("/admin/payslips/generate/{year}/{month}")
def generate_payslips_for_period(
    year: int,
    month: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate payslips for all tutors for a given month.
    A payslip is a detailed breakdown showing each class, student initials, date, amount, commission, net.
    """
    _require_admin_access(user)

    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Mes invalido")
    if year < 2020 or year > 2100:
        raise HTTPException(status_code=400, detail="Ano invalido")

    # Period bounds
    period_start = datetime(year, month, 1)
    if month == 12:
        period_end = datetime(year + 1, 1, 1)
    else:
        period_end = datetime(year, month + 1, 1)

    # Find all completed classes in this period
    completed_classes = db.query(TutorClass).filter(
        TutorClass.status == "completed",
        TutorClass.scheduled_at >= period_start,
        TutorClass.scheduled_at < period_end,
    ).all()

    # Group by tutor
    tutor_data = {}  # tutor_id -> list of class detail entries
    for cls in completed_classes:
        if cls.tutor_id not in tutor_data:
            tutor_data[cls.tutor_id] = []

        enrollments = db.query(TutorClassEnrollment).filter(
            TutorClassEnrollment.class_id == cls.id,
            TutorClassEnrollment.payment_status == "paid",
        ).all()

        for e in enrollments:
            student = db.query(User).filter(User.id == e.student_id).first()
            # Privacy: only initials
            student_initials = ""
            if student:
                student_initials = (student.first_name[0] if student.first_name else "") + (student.last_name[0] if student.last_name else "")
                student_initials = student_initials.upper()

            gross = cls.price_per_student
            commission = round(gross * CONNIKU_COMMISSION_RATE)
            net = gross - commission

            tutor_data[cls.tutor_id].append({
                "class_id": cls.id,
                "title": cls.title,
                "date": cls.scheduled_at.isoformat() if cls.scheduled_at else "",
                "student_initials": student_initials,
                "gross": gross,
                "commission": commission,
                "net": net,
            })

    # Generate payslips
    generated = []
    for tutor_id, entries in tutor_data.items():
        # Check if payslip already exists for this tutor/period
        existing = db.query(TutorPayslip).filter(
            TutorPayslip.tutor_id == tutor_id,
            TutorPayslip.period_start == period_start,
            TutorPayslip.period_end == period_end,
        ).first()
        if existing:
            # Update existing payslip
            existing.total_classes = len(entries)
            existing.total_students = len(entries)
            existing.gross_total = sum(e["gross"] for e in entries)
            existing.commission_total = sum(e["commission"] for e in entries)
            existing.net_total = sum(e["net"] for e in entries)
            existing.detail_json = json.dumps(entries)
            existing.status = "generated"
            generated.append(_payslip_to_dict(existing, include_detail=True))
            continue

        tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
        folio = _generate_payslip_folio(db)

        payslip = TutorPayslip(
            tutor_id=tutor_id,
            period_start=period_start,
            period_end=period_end,
            folio=folio,
            total_classes=len(entries),
            total_students=len(entries),
            gross_total=sum(e["gross"] for e in entries),
            commission_total=sum(e["commission"] for e in entries),
            net_total=sum(e["net"] for e in entries),
            payment_frequency_applied=tutor.payment_frequency if tutor else "monthly",
            status="generated",
            detail_json=json.dumps(entries),
        )
        db.add(payslip)
        db.flush()
        generated.append(_payslip_to_dict(payslip, include_detail=True))

    db.commit()

    return {
        "ok": True,
        "message": f"Se generaron {len(generated)} liquidaciones para {year}-{month:02d}",
        "period": f"{year}-{month:02d}",
        "payslips": generated,
    }


# ═══════════════════════════════════════════════════════════════════
#  AUTO-CONFIRM BACKGROUND CHECK
# ═══════════════════════════════════════════════════════════════════

def run_auto_confirm(db: Session):
    """
    Check for classes that ended more than 48h ago and auto-confirm enrollments
    where the student hasn't confirmed yet. Should be called periodically.
    """
    cutoff = datetime.utcnow() - timedelta(hours=AUTO_CONFIRM_HOURS)

    # Find classes that ended before the cutoff and are still in published/confirmed/in_progress
    classes = db.query(TutorClass).filter(
        TutorClass.status.in_(["published", "confirmed", "in_progress"]),
    ).all()

    auto_confirmed_count = 0
    for cls in classes:
        class_end = cls.scheduled_at + timedelta(minutes=cls.duration_minutes)
        if class_end > cutoff:
            continue  # Not yet past 48h window

        # Auto-complete the class
        cls.status = "completed"

        enrollments = db.query(TutorClassEnrollment).filter(
            TutorClassEnrollment.class_id == cls.id,
            TutorClassEnrollment.confirmed_by_student == False,
            TutorClassEnrollment.auto_confirmed_at.is_(None),
        ).all()

        for e in enrollments:
            e.auto_confirmed_at = datetime.utcnow()
            e.confirmed_by_student = True
            e.confirmed_by_tutor = True
            auto_confirmed_count += 1

        # Update tutor stats
        tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
        if tutor:
            student_count = db.query(TutorClassEnrollment).filter(TutorClassEnrollment.class_id == cls.id).count()
            tutor.total_classes += student_count
            tutor.total_students += student_count
            tutor.updated_at = datetime.utcnow()

    if auto_confirmed_count > 0:
        db.commit()
        logger.info(f"Auto-confirmed {auto_confirmed_count} enrollments")

    return auto_confirmed_count


# ═══════════════════════════════════════════════════════════════════
#  PUBLIC DIRECTORY
# ═══════════════════════════════════════════════════════════════════

@router.get("/directory")
def tutor_directory(
    specialty: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    min_rating: Optional[float] = Query(default=None, ge=0, le=5),
    sort_by: Optional[str] = Query(default="rating"),  # rating / experience / classes
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public tutor directory. Shows only approved tutors."""
    query = db.query(TutorProfile).filter(TutorProfile.status == "approved")

    if specialty:
        query = query.filter(TutorProfile.specialties.ilike(f"%{specialty}%"))

    if search:
        query = query.filter(
            or_(
                TutorProfile.professional_title.ilike(f"%{search}%"),
                TutorProfile.career.ilike(f"%{search}%"),
                TutorProfile.bio.ilike(f"%{search}%"),
                TutorProfile.specialties.ilike(f"%{search}%"),
            )
        )

    if min_rating is not None:
        query = query.filter(TutorProfile.rating_average >= min_rating)

    # Sort
    if sort_by == "experience":
        query = query.order_by(desc(TutorProfile.experience_years))
    elif sort_by == "classes":
        query = query.order_by(desc(TutorProfile.total_classes))
    else:
        query = query.order_by(desc(TutorProfile.rating_average))

    total = query.count()
    profiles = query.offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for p in profiles:
        u = db.query(User).filter(User.id == p.user_id).first()
        results.append(_tutor_public_dict(p, u))

    return {"tutors": results, "total": total, "page": page, "per_page": per_page}


@router.get("/{tutor_id}/public")
def get_tutor_public_profile(
    tutor_id: str,
    db: Session = Depends(get_db),
):
    """Get a tutor's public profile."""
    profile = db.query(TutorProfile).filter(
        TutorProfile.id == tutor_id,
        TutorProfile.status == "approved",
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    u = db.query(User).filter(User.id == profile.user_id).first()
    result = _tutor_public_dict(profile, u)

    # Include recent reviews (with privacy: student initials only)
    recent_reviews = (
        db.query(TutorClassEnrollment, TutorClass, User)
        .join(TutorClass, TutorClassEnrollment.class_id == TutorClass.id)
        .join(User, TutorClassEnrollment.student_id == User.id)
        .filter(
            TutorClass.tutor_id == tutor_id,
            TutorClassEnrollment.rating.isnot(None),
        )
        .order_by(desc(TutorClassEnrollment.rated_at))
        .limit(10)
        .all()
    )

    reviews = []
    for enrollment, cls, student in recent_reviews:
        student_initials = (student.first_name[0] if student.first_name else "") + (student.last_name[0] if student.last_name else "")
        reviews.append({
            "rating": enrollment.rating,
            "comment": enrollment.rating_comment,
            "date": enrollment.rated_at.isoformat() if enrollment.rated_at else None,
            "class_title": cls.title,
            "student_initials": student_initials.upper(),
        })

    result["reviews"] = reviews
    result["reviews_count"] = (
        db.query(TutorClassEnrollment)
        .join(TutorClass, TutorClassEnrollment.class_id == TutorClass.id)
        .filter(
            TutorClass.tutor_id == tutor_id,
            TutorClassEnrollment.rating.isnot(None),
        )
        .count()
    )

    # Upcoming classes
    upcoming = db.query(TutorClass).filter(
        TutorClass.tutor_id == tutor_id,
        TutorClass.status == "published",
        TutorClass.scheduled_at > datetime.utcnow(),
    ).order_by(TutorClass.scheduled_at).limit(5).all()

    result["upcoming_classes"] = [_class_to_dict(c) for c in upcoming]

    return result


# ═══════════════════════════════════════════════════════════════════
#  CONTRACT — Contrato de Prestacion de Servicios
# ═══════════════════════════════════════════════════════════════════

@router.get("/my-contract")
def get_my_contract(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and return the Contrato de Prestacion de Servicios PDF for the current tutor."""
    from fastapi.responses import Response
    from tutor_contract import generate_tutor_contract

    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    tutor_data = {
        "tutor_id": profile.id,
        "tutor_name": f"{user.first_name or ''} {user.last_name or ''}".strip() or "Sin nombre",
        "tutor_rut": profile.rut or "__.___.__-_",
        "tutor_professional_title": profile.professional_title or "Profesional independiente",
        "tutor_address": "Santiago, Chile",
        "tutor_email": user.email,
        "tutor_role_number": profile.tutor_role_number or "",
    }

    try:
        pdf_bytes = generate_tutor_contract(tutor_data)
    except Exception as e:
        logger.error(f"Error generating tutor contract PDF: {e}")
        raise HTTPException(status_code=500, detail="Error al generar el contrato")

    filename = f"Contrato_Conniku_{profile.tutor_role_number or profile.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.post("/my-contract/sign")
def sign_my_contract(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark the tutor's contract as digitally signed (Ley 19.799)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    if profile.contract_signed:
        return {
            "message": "El contrato ya fue firmado anteriormente",
            "contract_signed": True,
            "contract_signed_at": profile.contract_signed_at.isoformat() if profile.contract_signed_at else None,
        }

    profile.contract_signed = True
    profile.contract_signed_at = datetime.utcnow()
    db.commit()

    logger.info(f"Tutor {profile.tutor_role_number} ({user.email}) signed contract at {profile.contract_signed_at}")

    return {
        "message": "Contrato firmado exitosamente conforme a Ley 19.799",
        "contract_signed": True,
        "contract_signed_at": profile.contract_signed_at.isoformat(),
    }
