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

from database import Base, engine, get_db, User, gen_id, DATA_DIR, SessionLocal
from middleware import get_current_user
from push_routes import send_push_to_user
from gemini_engine import AIEngine as _AIEngine

_ai_engine = _AIEngine()

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
    """Only owner, admin, or utp can access admin tutor routes."""
    role = getattr(user, "role", "user") or "user"
    if role not in ("owner", "admin", "utp"):
        raise HTTPException(status_code=403, detail="Acceso restringido a owner/admin/utp")


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


# ─── CEO Email Alert ─────────────────────────────────────────────
# Uses centralized email system from notifications.py


def send_ceo_alert(subject: str, body: str):
    """Send an HTML email alert to the CEO using centralized email system.
    Silently skips if SMTP is not configured."""
    try:
        from notifications import _send_email_async, _email_template, CEO_EMAIL
        html = _email_template(f"Alerta CEO: {subject}", body)
        _send_email_async(CEO_EMAIL, f"[Conniku CEO] {subject}", html, email_type="ceo_alert", from_account="ceo")
        logger.info(f"CEO alert queued: {subject}")
    except Exception:
        logger.warning(f"CEO alert failed: {subject}", exc_info=True)


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

    # Class type: "individual" (single session) or "program" (multi-session sequential)
    class_mode = Column(String(20), default="individual")  # individual / program
    program_total_sessions = Column(Integer, default=1)  # number of sessions in a program
    program_session_number = Column(Integer, default=1)  # which session this is (1-based)
    program_id = Column(String(16), nullable=True, index=True)  # groups sessions of same program
    program_title = Column(String(255), nullable=True)  # overarching program name
    program_description = Column(Text, nullable=True)  # program overview

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

    # Payment rejection tracking (max 3 attempts)
    payment_attempts = Column(Integer, default=0)
    payment_rejected_at = Column(DateTime, nullable=True)
    payment_auto_cancelled = Column(Boolean, default=False)

    confirmed_by_student = Column(Boolean, default=False)
    confirmed_by_tutor = Column(Boolean, default=False)
    auto_confirmed_at = Column(DateTime, nullable=True)  # 48h auto-confirm

    # Student rates tutor
    rating = Column(Integer, nullable=True)  # 1-5
    rating_comment = Column(Text, nullable=True)
    rated_at = Column(DateTime, nullable=True)

    # Tutor rates student
    tutor_rating_of_student = Column(Integer, nullable=True)  # 1-5
    tutor_review_of_student = Column(Text, nullable=True)
    tutor_rated_at = Column(DateTime, nullable=True)

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

    # Discount fields (MAX user 50% discount)
    discount_type = Column(String(30), default="")  # "" / "max_subscriber"
    discount_amount = Column(Float, default=0)  # discount in CLP

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


class TutorExam(Base):
    __tablename__ = "tutor_exams"

    id = Column(String(16), primary_key=True, default=gen_id)
    class_id = Column(String(16), ForeignKey("tutor_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    questions = Column(Text, default="[]")  # JSON list of question objects

    time_limit_minutes = Column(Integer, default=60)
    passing_score = Column(Float, default=60)  # percentage
    is_enabled = Column(Boolean, default=False)
    enabled_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("class_id", name="uq_exam_per_class"),
    )


class TutorExamSubmission(Base):
    __tablename__ = "tutor_exam_submissions"

    id = Column(String(16), primary_key=True, default=gen_id)
    exam_id = Column(String(16), ForeignKey("tutor_exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)

    answers = Column(Text, default="{}")  # JSON dict of question_id -> answer
    score = Column(Float, default=0)  # percentage
    passed = Column(Boolean, default=False)

    started_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    time_spent_seconds = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", name="uq_exam_submission_student"),
    )


class TutorAvailability(Base):
    __tablename__ = "tutor_availability"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    day_of_week = Column(Integer, nullable=False)  # 0-6, Monday=0
    start_time = Column(String(5), nullable=False)  # "HH:MM"
    end_time = Column(String(5), nullable=False)  # "HH:MM"
    is_recurring = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class TutorBlockedDate(Base):
    __tablename__ = "tutor_blocked_dates"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class TutorClassMessage(Base):
    """Text-only chat messages for a specific class (coordination between tutor and students)."""
    __tablename__ = "tutor_class_messages"

    id = Column(String(16), primary_key=True, default=gen_id)
    class_id = Column(String(16), ForeignKey("tutor_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TutorCustomCategory(Base):
    """Custom tutor categories created by users when they pick a category not in the predefined list."""
    __tablename__ = "tutor_custom_categories"
    __table_args__ = (UniqueConstraint("name", name="uq_tutor_custom_category_name"),)

    id = Column(String(16), primary_key=True, default=gen_id)
    name = Column(String(255), nullable=False, unique=True)
    created_by = Column(String(16), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# Predefined tutor class categories
TUTOR_CATEGORIES = [
    "Matematicas", "Fisica", "Quimica", "Biologia", "Ciencias",
    "Lenguaje", "Ingles", "Frances", "Aleman", "Portugues", "Idiomas",
    "Historia", "Filosofia", "Ciencias Sociales",
    "Programacion", "Diseno", "Marketing Digital", "Tecnologia",
    "Musica", "Arte", "Fotografia",
    "Contabilidad", "Economia", "Finanzas", "Administracion",
    "Derecho", "Psicologia", "Medicina", "Enfermeria", "Salud",
    "PSU / PAES", "Preparacion de Examenes",
    "Tesis y Trabajos", "Metodologia de Investigacion",
    "Deportes y Fitness", "Cocina y Gastronomia",
    "Otro",
]


# Create tables (tolerant of pre-existing tables/constraints)
try:
    Base.metadata.create_all(engine)
except Exception as _e:
    for _t in Base.metadata.sorted_tables:
        try:
            _t.create(engine, checkfirst=True)
        except Exception:
            pass


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
    # Program fields (optional — set class_mode="program" for multi-session)
    class_mode: str = "individual"  # "individual" or "program"
    program_title: Optional[str] = None
    program_description: Optional[str] = None
    program_total_sessions: int = 1
    program_session_number: int = 1
    program_id: Optional[str] = None  # auto-generated for first session, reused for others


class ProgramCreateRequest(BaseModel):
    """Create a full program (multiple sequential sessions at once)."""
    program_title: str
    program_description: str = ""
    category: str = ""
    materials_description: str = ""
    max_students: int = Field(default=1, ge=1, le=5)
    price_per_student: Optional[float] = None
    sessions: List[dict]  # [{"title": "Sesion 1: Intro", "description": "...", "scheduled_at": "...", "duration_minutes": 60, "zoom_link": ""}]


class ClassRateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class BoletaUploadRequest(BaseModel):
    boleta_number: str
    boleta_amount: float


class PaymentProcessRequest(BaseModel):
    payment_reference: str = ""
    payment_method: str = "transferencia"


class EnrollRequest(BaseModel):
    apply_max_discount: bool = False


class ExamCreateRequest(BaseModel):
    title: str
    description: str = ""
    questions: list  # list of question dicts
    time_limit_minutes: int = 60
    passing_score: float = 60


class ExamSubmitRequest(BaseModel):
    answers: dict  # {question_id: answer}
    started_at: Optional[str] = None  # ISO datetime
    time_spent_seconds: int = 0


class AvailabilitySlot(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    is_recurring: bool = True


class SetAvailabilityRequest(BaseModel):
    slots: List[AvailabilitySlot]


class BlockedDateRequest(BaseModel):
    start_date: str  # ISO datetime
    end_date: str  # ISO datetime
    reason: Optional[str] = None


class ClassMessageRequest(BaseModel):
    message: str


class OwnerTutorApplyRequest(BaseModel):
    professional_title: str = "Fundador Conniku"
    institution: str = ""
    bio: str = ""
    specialties: List[str] = []


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
        "verified": t.verified_at is not None,
        "username": user.username if user else None,
        "user_id": user.id if user else None,
    }


def _document_to_dict(doc: TutorDocument) -> dict:
    return {
        "id": doc.id,
        "tutor_id": doc.tutor_id,
        "document_type": doc.document_type,
        "name": doc.name,
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
        "class_mode": c.class_mode or "individual",
        "program_total_sessions": c.program_total_sessions or 1,
        "program_session_number": c.program_session_number or 1,
        "program_id": c.program_id,
        "program_title": c.program_title,
        "program_description": c.program_description,
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
        "payment_attempts": e.payment_attempts or 0,
        "payment_auto_cancelled": e.payment_auto_cancelled or False,
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
        "discount_type": p.discount_type or "",
        "discount_amount": p.discount_amount or 0,
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

    send_ceo_alert(
        f"Nuevo tutor postulante: {user.first_name} {user.last_name} ({user.email})",
        f"<p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>"
        f"<p><strong>Email:</strong> {user.email}</p>"
        f"<p><strong>Titulo:</strong> {data.professional_title}</p>"
        f"<p><strong>Institucion:</strong> {data.institution}</p>"
        f"<p><strong>Tarifa individual:</strong> ${int(data.individual_rate):,} CLP/hora</p>"
        f"<p><strong>Numero tutor:</strong> {tutor_role_number}</p>",
    )

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

    # Eager load users and document counts to avoid N+1 queries
    app_user_ids = [p.user_id for p in profiles]
    app_users = db.query(User).filter(User.id.in_(app_user_ids)).all()
    app_user_map = {u.id: u for u in app_users}

    app_profile_ids = [p.id for p in profiles]
    from sqlalchemy import func as _func
    doc_counts_rows = (
        db.query(TutorDocument.tutor_id, _func.count(TutorDocument.id))
        .filter(TutorDocument.tutor_id.in_(app_profile_ids))
        .group_by(TutorDocument.tutor_id)
        .all()
    )
    doc_count_map = {row[0]: row[1] for row in doc_counts_rows}

    results = []
    for p in profiles:
        u = app_user_map.get(p.user_id)
        d = _tutor_to_dict(p, include_bank=True)
        d["user_name"] = f"{u.first_name} {u.last_name}" if u else "Desconocido"
        d["user_email"] = u.email if u else ""
        d["documents_count"] = doc_count_map.get(p.id, 0)
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

    # Save custom category if not in predefined list
    if data.category and data.category.strip() and data.category.strip() not in TUTOR_CATEGORIES:
        cat_name = data.category.strip()
        existing_cat = db.query(TutorCustomCategory).filter(TutorCustomCategory.name == cat_name).first()
        if not existing_cat:
            db.add(TutorCustomCategory(name=cat_name, created_by=user.id))
            db.commit()

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

    # Handle program fields
    program_id = data.program_id
    if data.class_mode == "program" and not program_id:
        program_id = gen_id()

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
        class_mode=data.class_mode,
        program_id=program_id,
        program_title=data.program_title,
        program_description=data.program_description,
        program_total_sessions=data.program_total_sessions,
        program_session_number=data.program_session_number,
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)

    # Send CEO alert for new class
    try:
        tutor_user = db.query(User).filter(User.id == profile.user_id).first()
        send_ceo_alert(
            f"Nueva clase creada: {cls.title}",
            f"Tutor: {tutor_user.first_name} {tutor_user.last_name if tutor_user else 'N/A'}\n"
            f"Categoria: {cls.category or 'Sin categoria'}\n"
            f"Modo: {cls.class_mode}\n"
            f"Precio: ${cls.price_per_student:,.0f} CLP\n"
            f"Fecha: {cls.scheduled_at.strftime('%d/%m/%Y %H:%M')}",
        )
    except Exception:
        pass

    return {"ok": True, "class": _class_to_dict(cls, include_zoom=True)}


@router.post("/programs")
def create_program(
    data: ProgramCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a full program (multi-session) in one request. Each session becomes a TutorClass."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")
    if profile.status != "approved":
        raise HTTPException(status_code=403, detail="Tu perfil de tutor debe estar aprobado")

    # Save custom category if not in predefined list
    if data.category and data.category.strip() and data.category.strip() not in TUTOR_CATEGORIES:
        cat_name = data.category.strip()
        existing_cat = db.query(TutorCustomCategory).filter(TutorCustomCategory.name == cat_name).first()
        if not existing_cat:
            db.add(TutorCustomCategory(name=cat_name, created_by=user.id))
            db.commit()

    if not data.sessions or len(data.sessions) < 2:
        raise HTTPException(status_code=400, detail="Un programa debe tener al menos 2 sesiones")
    if len(data.sessions) > 30:
        raise HTTPException(status_code=400, detail="Maximo 30 sesiones por programa")

    program_id = gen_id()
    total_sessions = len(data.sessions)
    created_classes = []

    for idx, session in enumerate(data.sessions, 1):
        try:
            sched = datetime.fromisoformat(session.get("scheduled_at", "").replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail=f"Sesion {idx}: formato de fecha invalido")

        if sched <= datetime.utcnow():
            raise HTTPException(status_code=400, detail=f"Sesion {idx}: debe ser en el futuro")

        dur = session.get("duration_minutes", 60)
        if dur < 15 or dur > 480:
            raise HTTPException(status_code=400, detail=f"Sesion {idx}: duracion entre 15-480 minutos")

        if data.price_per_student is not None and data.price_per_student > 0:
            price = data.price_per_student
        else:
            price = _get_rate_for_group_size(profile, data.max_students) * (dur / 60)

        cls = TutorClass(
            tutor_id=profile.id,
            title=session.get("title", f"Sesion {idx}: {data.program_title}"),
            description=session.get("description", ""),
            category=data.category,
            materials_description=data.materials_description,
            zoom_link=session.get("zoom_link", ""),
            scheduled_at=sched,
            duration_minutes=dur,
            max_students=data.max_students,
            current_students=0,
            price_per_student=round(price),
            group_size_applied=data.max_students,
            status="published",
            class_mode="program",
            program_id=program_id,
            program_title=data.program_title,
            program_description=data.program_description,
            program_total_sessions=total_sessions,
            program_session_number=idx,
        )
        db.add(cls)
        created_classes.append(cls)

    db.commit()
    for c in created_classes:
        db.refresh(c)

    # CEO alert
    try:
        tutor_user = db.query(User).filter(User.id == profile.user_id).first()
        send_ceo_alert(
            f"Nuevo programa creado: {data.program_title} ({total_sessions} sesiones)",
            f"Tutor: {tutor_user.first_name} {tutor_user.last_name if tutor_user else 'N/A'}\n"
            f"Categoria: {data.category or 'Sin categoria'}\n"
            f"Sesiones: {total_sessions}\n"
            f"Precio por sesion: ${created_classes[0].price_per_student:,.0f} CLP",
        )
    except Exception:
        pass

    return {
        "ok": True,
        "program_id": program_id,
        "total_sessions": total_sessions,
        "classes": [_class_to_dict(c, include_zoom=True) for c in created_classes],
    }


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """Return predefined + custom tutor class categories."""
    custom = db.query(TutorCustomCategory).order_by(TutorCustomCategory.name).all()
    custom_names = [c.name for c in custom if c.name not in TUTOR_CATEGORIES]
    return {"categories": TUTOR_CATEGORIES + custom_names}


# ─── Class Chat (text-only coordination) ────────────────────────────

@router.get("/classes/{class_id}/messages")
def get_class_messages(
    class_id: str,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat messages for a class. Any authenticated user can view messages."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    # Identify if current user is the tutor (for is_tutor flag in messages)
    profile = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    is_tutor = profile and profile.user_id == user.id

    total = db.query(TutorClassMessage).filter(TutorClassMessage.class_id == class_id).count()
    messages = db.query(TutorClassMessage).filter(
        TutorClassMessage.class_id == class_id
    ).order_by(desc(TutorClassMessage.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for m in reversed(messages):
        sender = db.query(User).filter(User.id == m.sender_id).first()
        result.append({
            "id": m.id,
            "class_id": m.class_id,
            "sender_id": m.sender_id,
            "sender_name": f"{sender.first_name} {(sender.last_name or '')[0]}." if sender and sender.last_name else (sender.first_name if sender else "Usuario"),
            "sender_avatar": sender.avatar if sender else None,
            "is_tutor": bool(is_tutor) if m.sender_id == user.id else bool(profile and profile.user_id == m.sender_id),
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })

    return {"messages": result, "total": total, "page": page}


@router.post("/classes/{class_id}/messages")
def send_class_message(
    class_id: str,
    data: ClassMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a text message in the class chat. Any authenticated user can send messages."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacio")
    if len(data.message) > 2000:
        raise HTTPException(status_code=400, detail="Mensaje demasiado largo (max 2000 caracteres)")

    # Identify if current user is the tutor (for is_tutor flag and push notifications)
    profile = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    is_tutor = profile and profile.user_id == user.id

    msg = TutorClassMessage(
        class_id=class_id,
        sender_id=user.id,
        message=data.message.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Notify other participants via push
    try:
        if is_tutor:
            # Tutor sent message → notify all enrolled students
            enrollments = db.query(TutorClassEnrollment).filter(
                TutorClassEnrollment.class_id == class_id,
                TutorClassEnrollment.payment_auto_cancelled == False,
            ).all()
            for e in enrollments:
                send_push_to_user(e.student_id, f"Mensaje del tutor - {cls.title}",
                                  data.message[:100], f"/tutores?class={class_id}", db)
        else:
            # Student sent message → notify tutor
            if profile:
                send_push_to_user(profile.user_id, f"Mensaje en {cls.title}",
                                  f"{user.first_name}: {data.message[:80]}", f"/tutores?class={class_id}", db)
    except Exception:
        pass

    return {
        "ok": True,
        "message": {
            "id": msg.id,
            "class_id": msg.class_id,
            "sender_id": msg.sender_id,
            "sender_name": f"{user.first_name} {(user.last_name or '')[0]}." if user.last_name else user.first_name,
            "sender_avatar": user.avatar if user else None,
            "is_tutor": bool(is_tutor),
            "message": msg.message,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        },
    }


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

    # Eager load tutor profiles and users to avoid N+1 queries
    tutor_ids = [c.tutor_id for c in classes]
    profiles = db.query(TutorProfile).filter(TutorProfile.id.in_(tutor_ids)).all()
    profile_map = {p.id: p for p in profiles}

    user_ids = [p.user_id for p in profiles]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {u.id: u for u in users}

    results = []
    for c in classes:
        d = _class_to_dict(c)
        tutor = profile_map.get(c.tutor_id)
        if tutor:
            tutor_user = user_map.get(tutor.user_id)
            d["tutor_name"] = f"{tutor_user.first_name} {tutor_user.last_name[0]}." if tutor_user and tutor_user.last_name else "Tutor"
            d["tutor_user_id"] = tutor.user_id
            d["tutor_role_number"] = tutor.tutor_role_number
            d["tutor_rating"] = tutor.rating_average
            d["tutor_avatar"] = tutor_user.avatar if tutor_user else None
        results.append(d)

    # Get active categories (categories that have at least one published class)
    active_cats = db.query(TutorClass.category).filter(
        TutorClass.status == "published",
        TutorClass.scheduled_at > datetime.utcnow(),
        TutorClass.category != "",
        TutorClass.category.isnot(None),
    ).distinct().all()
    active_categories = sorted(set(c[0] for c in active_cats if c[0]))

    return {
        "classes": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "active_categories": active_categories,
    }


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
    data: EnrollRequest = EnrollRequest(),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Student enrolls in a class. Creates enrollment and payment records.
    MAX subscribers can apply 50% discount by passing apply_max_discount=true."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).with_for_update().first()
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

    # Calculate commission with possible MAX discount
    original_gross = cls.price_per_student
    discount_type = ""
    discount_amount = 0.0

    if data.apply_max_discount:
        user_tier = getattr(user, "subscription_tier", "free") or "free"
        if user_tier != "max":
            raise HTTPException(status_code=400, detail="Solo usuarios MAX pueden aplicar el descuento del 50%")
        discount_amount = round(original_gross * 0.5)
        discount_type = "max_subscriber"

    gross = original_gross - discount_amount
    commission = round(gross * CONNIKU_COMMISSION_RATE)
    tutor_amount = gross - commission

    # Create payment record
    payment = TutorPayment(
        tutor_id=tutor.id,
        enrollment_id=None,  # will be set after enrollment created
        gross_amount=original_gross,
        conniku_commission=commission,
        tutor_amount=tutor_amount,
        discount_type=discount_type,
        discount_amount=discount_amount,
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

    tutor_user = db.query(User).filter(User.id == tutor.user_id).first()
    tutor_name = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
    send_ceo_alert(
        f"Clase agendada: {user.first_name} {user.last_name} con {tutor_name} - {cls.title} el {cls.scheduled_at.strftime('%d/%m/%Y %H:%M')}",
        f"<p><strong>Estudiante:</strong> {user.first_name} {user.last_name} ({user.email})</p>"
        f"<p><strong>Tutor:</strong> {tutor_name}</p>"
        f"<p><strong>Clase:</strong> {cls.title}</p>"
        f"<p><strong>Fecha:</strong> {cls.scheduled_at.strftime('%d/%m/%Y %H:%M')}</p>"
        f"<p><strong>Precio:</strong> ${int(cls.price_per_student):,} CLP</p>"
        f"<p><strong>Alumnos inscritos:</strong> {cls.current_students}/{cls.max_students}</p>",
    )

    return {
        "ok": True,
        "message": "Inscripcion exitosa",
        "enrollment": _enrollment_to_dict(enrollment),
        "payment": _payment_to_dict(payment),
    }


MAX_PAYMENT_ATTEMPTS = 3


@router.put("/classes/{class_id}/payment-retry")
def retry_enrollment_payment(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reintentar pago de una inscripcion. Maximo 3 intentos antes de cancelacion automatica."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="No estas inscrito en esta clase")

    if enrollment.payment_auto_cancelled:
        raise HTTPException(
            status_code=400,
            detail="Esta inscripcion fue cancelada automaticamente por exceder el limite de intentos de pago (3). Debes inscribirte nuevamente.",
        )

    if enrollment.payment_status == "paid":
        raise HTTPException(status_code=400, detail="El pago de esta inscripcion ya fue confirmado")

    if enrollment.payment_status == "refunded":
        raise HTTPException(status_code=400, detail="Esta inscripcion fue reembolsada y no se puede reintentar")

    # Increment payment attempt counter
    current_attempts = (enrollment.payment_attempts or 0) + 1
    enrollment.payment_attempts = current_attempts

    if current_attempts >= MAX_PAYMENT_ATTEMPTS:
        # Auto-cancel the enrollment
        enrollment.payment_auto_cancelled = True
        enrollment.payment_status = "cancelled"
        enrollment.payment_rejected_at = datetime.utcnow()

        # Decrease student count
        if cls.current_students > 0:
            cls.current_students -= 1

        # Mark associated payment as rejected
        if enrollment.payment_id:
            payment = db.query(TutorPayment).filter(TutorPayment.id == enrollment.payment_id).first()
            if payment:
                payment.payment_status = "rejected"

        db.commit()

        # Notify CEO
        try:
            send_ceo_alert(
                f"Inscripcion cancelada por rechazos de pago: {user.first_name} {user.last_name} — {cls.title}",
                f"<p><strong>Estudiante:</strong> {user.first_name} {user.last_name} ({user.email})</p>"
                f"<p><strong>Clase:</strong> {cls.title}</p>"
                f"<p><strong>Intentos de pago:</strong> {current_attempts}/{MAX_PAYMENT_ATTEMPTS}</p>"
                f"<p><strong>Motivo:</strong> Limite de intentos de pago alcanzado. Inscripcion cancelada automaticamente.</p>",
            )
        except Exception:
            pass

        # Notify tutor about auto-cancellation
        try:
            tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
            if tutor_profile:
                send_push_to_user(
                    tutor_profile.user_id,
                    "Clase cancelada por rechazos de pago",
                    f"Clase cancelada por 3 rechazos de pago — {cls.title}",
                    url=f"/tutor/classes/{cls.id}",
                    db=db,
                )
        except Exception:
            pass

        return {
            "ok": False,
            "message": f"Se alcanzo el limite de {MAX_PAYMENT_ATTEMPTS} intentos de pago. La inscripcion fue cancelada automaticamente.",
            "enrollment": _enrollment_to_dict(enrollment),
            "auto_cancelled": True,
            "attempts": current_attempts,
        }

    # Payment retry: mark as pending again for re-processing
    enrollment.payment_status = "pending"
    enrollment.payment_rejected_at = datetime.utcnow()

    db.commit()
    db.refresh(enrollment)

    # Notify tutor about payment rejection (non-final)
    try:
        tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
        if tutor_profile:
            send_push_to_user(
                tutor_profile.user_id,
                "Pago rechazado",
                f"Pago rechazado para clase {cls.title} — Intento {current_attempts}/{MAX_PAYMENT_ATTEMPTS}",
                url=f"/tutor/classes/{cls.id}",
                db=db,
            )
    except Exception:
        pass

    remaining = MAX_PAYMENT_ATTEMPTS - current_attempts
    return {
        "ok": True,
        "message": f"Reintento de pago registrado. Te quedan {remaining} intento(s) antes de la cancelacion automatica.",
        "enrollment": _enrollment_to_dict(enrollment),
        "auto_cancelled": False,
        "attempts": current_attempts,
        "remaining_attempts": remaining,
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

    tutor_user = db.query(User).filter(User.id == tutor.user_id).first()
    tutor_name = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
    student_names = []
    for e in enrollments:
        s = db.query(User).filter(User.id == e.student_id).first()
        if s:
            student_names.append(f"{s.first_name} {s.last_name}")
    send_ceo_alert(
        f"Clase completada: {tutor_name} - {cls.title}",
        f"<p><strong>Tutor:</strong> {tutor_name}</p>"
        f"<p><strong>Clase:</strong> {cls.title}</p>"
        f"<p><strong>Estudiantes ({student_count}):</strong> {', '.join(student_names) or 'N/A'}</p>"
        f"<p><strong>Fecha programada:</strong> {cls.scheduled_at.strftime('%d/%m/%Y %H:%M')}</p>",
    )

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

    tutor_user = db.query(User).filter(User.id == tutor.user_id).first() if tutor else None
    tutor_name = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
    send_ceo_alert(
        f"Nueva evaluacion: {tutor_name} recibio {data.rating}/5 de {user.first_name} {user.last_name}",
        f"<p><strong>Tutor:</strong> {tutor_name}</p>"
        f"<p><strong>Estudiante:</strong> {user.first_name} {user.last_name}</p>"
        f"<p><strong>Clase:</strong> {cls.title}</p>"
        f"<p><strong>Calificacion:</strong> {data.rating}/5</p>"
        f"<p><strong>Comentario:</strong> {data.comment or 'Sin comentario'}</p>",
    )

    return {"ok": True, "message": "Calificacion registrada"}


class TutorRatesStudentRequest(BaseModel):
    rating: int  # 1-5
    comment: str = ""


@router.post("/classes/{class_id}/rate-student")
def rate_student(
    class_id: str,
    data: TutorRatesStudentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor rates a student after a completed class. One rating per student per class."""
    if not (1 <= data.rating <= 5):
        raise HTTPException(status_code=400, detail="Calificacion debe ser entre 1 y 5")

    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    if cls.status != "completed":
        raise HTTPException(status_code=400, detail="Solo puedes calificar clases completadas")

    # Verify caller is the tutor of this class
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.user_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el tutor puede calificar a los estudiantes")

    # Get all enrollments for this class to rate (for simplicity, rate all paid students)
    enrollments = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.payment_status == "paid",
    ).all()

    if not enrollments:
        raise HTTPException(status_code=400, detail="No hay estudiantes pagados en esta clase")

    updated = 0
    for enrollment in enrollments:
        if enrollment.tutor_rating_of_student is not None:
            continue  # Already rated this student for this class
        enrollment.tutor_rating_of_student = data.rating
        enrollment.tutor_review_of_student = data.comment
        enrollment.tutor_rated_at = datetime.utcnow()

        # Update student's cumulative rating
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if student:
            student.student_rating_sum = (getattr(student, 'student_rating_sum', 0) or 0) + data.rating
            student.student_rating_count = (getattr(student, 'student_rating_count', 0) or 0) + 1
        updated += 1

    db.commit()
    return {"ok": True, "rated": updated}


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

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    tutor_user = db.query(User).filter(User.id == tutor.user_id).first() if tutor else None
    tutor_name = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
    send_ceo_alert(
        f"Reporte de no-show: {tutor_name} - {cls.title}",
        f"<p><strong>Tutor reportado:</strong> {tutor_name}</p>"
        f"<p><strong>Clase:</strong> {cls.title}</p>"
        f"<p><strong>Estudiante que reporta:</strong> {user.first_name} {user.last_name} ({user.email})</p>"
        f"<p><strong>Fecha clase:</strong> {cls.scheduled_at.strftime('%d/%m/%Y %H:%M')}</p>"
        f"<p><strong>Estado:</strong> Reembolso 100% en proceso</p>",
    )

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

    tutor = db.query(TutorProfile).filter(TutorProfile.id == payment.tutor_id).first()
    tutor_user = db.query(User).filter(User.id == tutor.user_id).first() if tutor else None
    tutor_name = f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else "Desconocido"
    send_ceo_alert(
        f"Pago procesado: ${int(payment.tutor_amount):,} CLP para {tutor_name}",
        f"<p><strong>Tutor:</strong> {tutor_name}</p>"
        f"<p><strong>Monto bruto:</strong> ${int(payment.gross_amount):,} CLP</p>"
        f"<p><strong>Comision Conniku:</strong> ${int(payment.conniku_commission):,} CLP</p>"
        f"<p><strong>Monto tutor:</strong> ${int(payment.tutor_amount):,} CLP</p>"
        f"<p><strong>Estado:</strong> En proceso</p>",
    )

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


@router.get("/by-username/{username}")
def get_tutor_public_by_username(
    username: str,
    db: Session = Depends(get_db),
):
    """Get a tutor's public profile by their username (for shareable URLs)."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    profile = db.query(TutorProfile).filter(
        TutorProfile.user_id == user.id,
        TutorProfile.status == "approved",
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado o pendiente de aprobación")

    result = _tutor_public_dict(profile, user)

    # Include full name for public page
    result["username"] = user.username
    result["full_name"] = f"{user.first_name} {user.last_name}"
    result["user_id"] = user.id
    result["verified"] = profile.verified_at is not None

    # Recent reviews
    recent_reviews = (
        db.query(TutorClassEnrollment, TutorClass, User)
        .join(TutorClass, TutorClassEnrollment.class_id == TutorClass.id)
        .join(User, TutorClassEnrollment.student_id == User.id)
        .filter(
            TutorClass.tutor_id == profile.id,
            TutorClassEnrollment.rating.isnot(None),
        )
        .order_by(desc(TutorClassEnrollment.rated_at))
        .limit(10)
        .all()
    )
    result["reviews"] = [{
        "rating": e.rating,
        "comment": e.rating_comment,
        "date": e.rated_at.isoformat() if e.rated_at else None,
        "class_title": c.title,
        "student_initials": ((s.first_name[0] if s.first_name else "") + (s.last_name[0] if s.last_name else "")).upper(),
    } for e, c, s in recent_reviews]
    result["reviews_count"] = len(result["reviews"])

    # Upcoming classes
    upcoming = db.query(TutorClass).filter(
        TutorClass.tutor_id == profile.id,
        TutorClass.status == "published",
        TutorClass.scheduled_at > datetime.utcnow(),
    ).order_by(TutorClass.scheduled_at).limit(6).all()
    result["upcoming_classes"] = [_class_to_dict(c) for c in upcoming]

    return result


@router.get("/ranking")
def get_tutor_ranking(
    limit: int = 20,
    category: str = "",
    db: Session = Depends(get_db),
):
    """Public tutor ranking by rating and total classes."""
    query = db.query(TutorProfile, User).join(
        User, TutorProfile.user_id == User.id
    ).filter(
        TutorProfile.status == "approved",
        TutorProfile.total_classes > 0,
    )

    tutors = query.order_by(
        desc(TutorProfile.rating_average),
        desc(TutorProfile.total_classes),
    ).limit(limit).all()

    result = []
    for rank, (profile, user) in enumerate(tutors, start=1):
        d = _tutor_public_dict(profile, user)
        d["rank"] = rank
        d["username"] = user.username
        d["user_id"] = user.id
        d["verified"] = profile.verified_at is not None
        result.append(d)

    return {"ranking": result, "total": len(result)}


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


# ═══════════════════════════════════════════════════════════════════
#  EXAM SYSTEM
# ═══════════════════════════════════════════════════════════════════

@router.post("/classes/{class_id}/exam")
def create_exam(
    class_id: str,
    data: ExamCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor creates an exam for a class. Only the tutor who owns the class can create it."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.user_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el tutor de la clase puede crear un examen")

    # Check if exam already exists for this class
    existing = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un examen para esta clase")

    if not data.questions or len(data.questions) == 0:
        raise HTTPException(status_code=400, detail="El examen debe tener al menos una pregunta")

    # Validate question format
    for i, q in enumerate(data.questions):
        if not isinstance(q, dict):
            raise HTTPException(status_code=400, detail=f"Pregunta {i+1} tiene formato invalido")
        if "id" not in q or "type" not in q or "question" not in q:
            raise HTTPException(status_code=400, detail=f"Pregunta {i+1} debe tener 'id', 'type' y 'question'")
        if q["type"] not in ("multiple_choice", "short_answer"):
            raise HTTPException(status_code=400, detail=f"Pregunta {i+1}: tipo invalido. Opciones: multiple_choice, short_answer")
        if q["type"] == "multiple_choice" and ("options" not in q or "correct" not in q):
            raise HTTPException(status_code=400, detail=f"Pregunta {i+1} de opcion multiple debe tener 'options' y 'correct'")
        if q["type"] == "short_answer" and "correct_keywords" not in q:
            raise HTTPException(status_code=400, detail=f"Pregunta {i+1} de respuesta corta debe tener 'correct_keywords'")

    if data.time_limit_minutes < 1 or data.time_limit_minutes > 480:
        raise HTTPException(status_code=400, detail="Limite de tiempo debe ser entre 1 y 480 minutos")

    if data.passing_score < 0 or data.passing_score > 100:
        raise HTTPException(status_code=400, detail="Puntaje de aprobacion debe ser entre 0 y 100")

    exam = TutorExam(
        class_id=class_id,
        tutor_id=tutor.id,
        title=data.title,
        description=data.description,
        questions=json.dumps(data.questions),
        time_limit_minutes=data.time_limit_minutes,
        passing_score=data.passing_score,
        is_enabled=False,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    return {
        "ok": True,
        "message": "Examen creado exitosamente",
        "exam": {
            "id": exam.id,
            "class_id": exam.class_id,
            "title": exam.title,
            "description": exam.description,
            "questions": json.loads(exam.questions),
            "time_limit_minutes": exam.time_limit_minutes,
            "passing_score": exam.passing_score,
            "is_enabled": exam.is_enabled,
            "enabled_at": None,
            "created_at": exam.created_at.isoformat() if exam.created_at else None,
        },
    }


@router.put("/classes/{class_id}/exam/enable")
def enable_exam(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor enables the exam for a class."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.user_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el tutor de la clase puede habilitar el examen")

    exam = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="No existe un examen para esta clase")

    if exam.is_enabled:
        return {"ok": True, "message": "El examen ya esta habilitado"}

    exam.is_enabled = True
    exam.enabled_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "message": "Examen habilitado exitosamente"}


@router.get("/classes/{class_id}/exam")
def get_exam(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get exam for a class. Tutor sees full exam with answers; student sees questions without answers."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    exam = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="No existe un examen para esta clase")

    # Check if user is the tutor
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    is_tutor = tutor and tutor.user_id == user.id

    questions = json.loads(exam.questions) if exam.questions else []

    if not is_tutor:
        # Student view: remove answers
        if not exam.is_enabled:
            raise HTTPException(status_code=403, detail="El examen aun no esta habilitado")
        # Check student is enrolled
        enrollment = db.query(TutorClassEnrollment).filter(
            TutorClassEnrollment.class_id == class_id,
            TutorClassEnrollment.student_id == user.id,
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Debes estar inscrito en la clase para ver el examen")

        sanitized_questions = []
        for q in questions:
            sq = {
                "id": q.get("id"),
                "type": q.get("type"),
                "question": q.get("question"),
                "points": q.get("points", 10),
            }
            if q.get("type") == "multiple_choice":
                sq["options"] = q.get("options", [])
            sanitized_questions.append(sq)
        questions = sanitized_questions

    return {
        "id": exam.id,
        "class_id": exam.class_id,
        "title": exam.title,
        "description": exam.description,
        "questions": questions,
        "time_limit_minutes": exam.time_limit_minutes,
        "passing_score": exam.passing_score,
        "is_enabled": exam.is_enabled,
        "enabled_at": exam.enabled_at.isoformat() if exam.enabled_at else None,
        "created_at": exam.created_at.isoformat() if exam.created_at else None,
    }


def _auto_grade_exam(questions: list, answers: dict) -> tuple:
    """Auto-grade exam. Returns (score_percentage, details)."""
    total_points = 0
    earned_points = 0
    details = []

    for q in questions:
        q_id = q.get("id")
        q_type = q.get("type")
        points = q.get("points", 10)
        total_points += points
        student_answer = answers.get(q_id, "")

        correct = False
        if q_type == "multiple_choice":
            correct_answer = q.get("correct", "")
            correct = str(student_answer).strip().upper() == str(correct_answer).strip().upper()
        elif q_type == "short_answer":
            keywords = q.get("correct_keywords", [])
            answer_lower = str(student_answer).strip().lower()
            if keywords:
                matched = sum(1 for kw in keywords if kw.lower() in answer_lower)
                # Partial credit: proportional to matched keywords
                ratio = matched / len(keywords)
                earned_points += round(points * ratio)
                details.append({"question_id": q_id, "correct": ratio >= 0.5, "earned": round(points * ratio), "max": points})
                continue

        if correct:
            earned_points += points
        details.append({"question_id": q_id, "correct": correct, "earned": points if correct else 0, "max": points})

    score = round((earned_points / total_points) * 100, 2) if total_points > 0 else 0
    return score, details


@router.post("/classes/{class_id}/exam/submit")
def submit_exam(
    class_id: str,
    data: ExamSubmitRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Student submits exam answers. Auto-grades and returns score."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    exam = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="No existe un examen para esta clase")

    if not exam.is_enabled:
        raise HTTPException(status_code=403, detail="El examen aun no esta habilitado")

    # Check student is enrolled
    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Debes estar inscrito en la clase para rendir el examen")

    # Check if already submitted
    existing = db.query(TutorExamSubmission).filter(
        TutorExamSubmission.exam_id == exam.id,
        TutorExamSubmission.student_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya rendiste este examen")

    # Auto-grade
    questions = json.loads(exam.questions) if exam.questions else []
    score, grading_details = _auto_grade_exam(questions, data.answers)
    passed = score >= exam.passing_score

    # Parse started_at
    started_at = None
    if data.started_at:
        try:
            started_at = datetime.fromisoformat(data.started_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pass

    submission = TutorExamSubmission(
        exam_id=exam.id,
        student_id=user.id,
        answers=json.dumps(data.answers),
        score=score,
        passed=passed,
        started_at=started_at,
        submitted_at=datetime.utcnow(),
        time_spent_seconds=data.time_spent_seconds,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return {
        "ok": True,
        "message": "Examen enviado exitosamente",
        "result": {
            "id": submission.id,
            "score": submission.score,
            "passed": submission.passed,
            "passing_score": exam.passing_score,
            "time_spent_seconds": submission.time_spent_seconds,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "grading_details": grading_details,
        },
    }


@router.get("/classes/{class_id}/exam/results")
def get_exam_results(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get exam results. Tutor sees all students; student sees own result."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    exam = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="No existe un examen para esta clase")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    is_tutor = tutor and tutor.user_id == user.id

    if is_tutor:
        # Tutor sees all submissions
        submissions = db.query(TutorExamSubmission).filter(
            TutorExamSubmission.exam_id == exam.id,
        ).all()

        results = []
        for s in submissions:
            student = db.query(User).filter(User.id == s.student_id).first()
            results.append({
                "id": s.id,
                "student_id": s.student_id,
                "student_name": f"{student.first_name} {student.last_name}" if student else "Desconocido",
                "score": s.score,
                "passed": s.passed,
                "time_spent_seconds": s.time_spent_seconds,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
                "answers": json.loads(s.answers) if s.answers else {},
            })

        # Summary stats
        scores = [s.score for s in submissions]
        return {
            "exam_title": exam.title,
            "total_submissions": len(submissions),
            "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
            "pass_rate": round(sum(1 for s in submissions if s.passed) / len(submissions) * 100, 2) if submissions else 0,
            "results": results,
        }
    else:
        # Student sees own result
        submission = db.query(TutorExamSubmission).filter(
            TutorExamSubmission.exam_id == exam.id,
            TutorExamSubmission.student_id == user.id,
        ).first()
        if not submission:
            raise HTTPException(status_code=404, detail="Aun no has rendido este examen")

        return {
            "exam_title": exam.title,
            "result": {
                "id": submission.id,
                "score": submission.score,
                "passed": submission.passed,
                "passing_score": exam.passing_score,
                "time_spent_seconds": submission.time_spent_seconds,
                "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            },
        }


# ═══════════════════════════════════════════════════════════════════
#  TUTOR AVAILABILITY / CALENDAR
# ═══════════════════════════════════════════════════════════════════

@router.get("/my-availability")
def get_my_availability(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get tutor's availability schedule and blocked dates."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    slots = db.query(TutorAvailability).filter(
        TutorAvailability.tutor_id == profile.id,
    ).order_by(TutorAvailability.day_of_week, TutorAvailability.start_time).all()

    blocked = db.query(TutorBlockedDate).filter(
        TutorBlockedDate.tutor_id == profile.id,
    ).order_by(TutorBlockedDate.start_date).all()

    day_names = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

    return {
        "availability": [
            {
                "id": s.id,
                "day_of_week": s.day_of_week,
                "day_name": day_names[s.day_of_week] if 0 <= s.day_of_week <= 6 else "",
                "start_time": s.start_time,
                "end_time": s.end_time,
                "is_recurring": s.is_recurring,
            }
            for s in slots
        ],
        "blocked_dates": [
            {
                "id": b.id,
                "start_date": b.start_date.isoformat() if b.start_date else None,
                "end_date": b.end_date.isoformat() if b.end_date else None,
                "reason": b.reason,
            }
            for b in blocked
        ],
    }


@router.put("/my-availability")
def set_my_availability(
    data: SetAvailabilityRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set recurring availability (replaces all existing slots)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    # Validate time format
    import re
    time_pattern = re.compile(r"^\d{2}:\d{2}$")
    for slot in data.slots:
        if not time_pattern.match(slot.start_time) or not time_pattern.match(slot.end_time):
            raise HTTPException(status_code=400, detail="Formato de hora invalido. Usa HH:MM (ej: 09:00)")
        if slot.start_time >= slot.end_time:
            raise HTTPException(status_code=400, detail=f"La hora de inicio debe ser anterior a la hora de fin ({slot.start_time} >= {slot.end_time})")

    # Delete existing availability
    db.query(TutorAvailability).filter(TutorAvailability.tutor_id == profile.id).delete()

    # Create new slots
    new_slots = []
    for slot in data.slots:
        avail = TutorAvailability(
            tutor_id=profile.id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
            end_time=slot.end_time,
            is_recurring=slot.is_recurring,
        )
        db.add(avail)
        new_slots.append(avail)

    db.commit()

    return {"ok": True, "message": f"Disponibilidad actualizada con {len(new_slots)} bloques horarios"}


@router.post("/my-blocked-dates")
def add_blocked_date(
    data: BlockedDateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a blocked date range (tutor not available)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    try:
        start_date = datetime.fromisoformat(data.start_date.replace("Z", "+00:00"))
        end_date = datetime.fromisoformat(data.end_date.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Formato de fecha invalido. Usa ISO 8601")

    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="La fecha de fin debe ser posterior a la fecha de inicio")

    blocked = TutorBlockedDate(
        tutor_id=profile.id,
        start_date=start_date,
        end_date=end_date,
        reason=data.reason,
    )
    db.add(blocked)
    db.commit()
    db.refresh(blocked)

    return {
        "ok": True,
        "message": "Fecha bloqueada agregada",
        "blocked_date": {
            "id": blocked.id,
            "start_date": blocked.start_date.isoformat(),
            "end_date": blocked.end_date.isoformat(),
            "reason": blocked.reason,
        },
    }


@router.delete("/my-blocked-dates/{blocked_id}")
def remove_blocked_date(
    blocked_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a blocked date."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No tienes un perfil de tutor")

    blocked = db.query(TutorBlockedDate).filter(
        TutorBlockedDate.id == blocked_id,
        TutorBlockedDate.tutor_id == profile.id,
    ).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="Fecha bloqueada no encontrada")

    db.delete(blocked)
    db.commit()

    return {"ok": True, "message": "Fecha bloqueada eliminada"}


@router.get("/{tutor_id}/availability")
def get_tutor_availability_public(
    tutor_id: str,
    db: Session = Depends(get_db),
):
    """Public: get a tutor's availability for booking."""
    profile = db.query(TutorProfile).filter(
        TutorProfile.id == tutor_id,
        TutorProfile.status == "approved",
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor no encontrado")

    slots = db.query(TutorAvailability).filter(
        TutorAvailability.tutor_id == profile.id,
    ).order_by(TutorAvailability.day_of_week, TutorAvailability.start_time).all()

    blocked = db.query(TutorBlockedDate).filter(
        TutorBlockedDate.tutor_id == profile.id,
        TutorBlockedDate.end_date >= datetime.utcnow(),
    ).order_by(TutorBlockedDate.start_date).all()

    day_names = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

    return {
        "tutor_id": tutor_id,
        "availability": [
            {
                "day_of_week": s.day_of_week,
                "day_name": day_names[s.day_of_week] if 0 <= s.day_of_week <= 6 else "",
                "start_time": s.start_time,
                "end_time": s.end_time,
                "is_recurring": s.is_recurring,
            }
            for s in slots
        ],
        "blocked_dates": [
            {
                "start_date": b.start_date.isoformat() if b.start_date else None,
                "end_date": b.end_date.isoformat() if b.end_date else None,
                "reason": b.reason or "No disponible",
            }
            for b in blocked
        ],
    }


# ═══════════════════════════════════════════════════════════════════
#  STUDENT: MY ENROLLED CLASSES
# ═══════════════════════════════════════════════════════════════════

@router.get("/my-enrolled-classes")
def get_my_enrolled_classes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all classes the current user is enrolled in as a student."""
    enrollments = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.student_id == user.id,
    ).order_by(desc(TutorClassEnrollment.created_at)).all()

    results = []
    for e in enrollments:
        cls = db.query(TutorClass).filter(TutorClass.id == e.class_id).first()
        if not cls:
            continue

        tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
        tutor_user = db.query(User).filter(User.id == tutor.user_id).first() if tutor else None

        # Check exam availability
        exam = db.query(TutorExam).filter(TutorExam.class_id == cls.id, TutorExam.is_enabled == True).first()
        exam_submitted = False
        if exam:
            sub = db.query(TutorExamSubmission).filter(
                TutorExamSubmission.exam_id == exam.id,
                TutorExamSubmission.student_id == user.id,
            ).first()
            exam_submitted = sub is not None

        # Payment info
        payment = db.query(TutorPayment).filter(TutorPayment.id == e.payment_id).first() if e.payment_id else None

        results.append({
            "enrollment_id": e.id,
            "class": _class_to_dict(cls),
            "tutor": {
                "id": tutor.id if tutor else None,
                "name": f"{tutor_user.first_name} {tutor_user.last_name[0]}." if tutor_user and tutor_user.last_name else "Tutor",
                "tutor_role_number": tutor.tutor_role_number if tutor else "",
                "rating_average": tutor.rating_average if tutor else 0,
            },
            "enrollment_status": e.payment_status,
            "confirmed_by_student": e.confirmed_by_student,
            "confirmed_by_tutor": e.confirmed_by_tutor,
            "rating": e.rating,
            "exam_available": exam is not None,
            "exam_submitted": exam_submitted,
            "payment": {
                "gross_amount": payment.gross_amount if payment else 0,
                "discount_type": payment.discount_type if payment else "",
                "discount_amount": payment.discount_amount if payment else 0,
                "payment_status": payment.payment_status if payment else "",
            } if payment else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })

    return {"enrolled_classes": results, "total": len(results)}


@router.get("/my-own-classes")
def get_my_own_classes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all classes created by the current tutor, with enrolled students."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        return {"classes": [], "total": 0}

    classes = db.query(TutorClass).filter(
        TutorClass.tutor_id == profile.id,
    ).order_by(desc(TutorClass.scheduled_at)).all()

    results = []
    for cls in classes:
        enrollments = db.query(TutorClassEnrollment).filter(
            TutorClassEnrollment.class_id == cls.id,
        ).all()
        students = []
        for e in enrollments:
            student = db.query(User).filter(User.id == e.student_id).first()
            students.append({
                "enrollment_id": e.id,
                "student_id": e.student_id,
                "student_name": f"{student.first_name} {student.last_name}" if student else "Estudiante",
                "student_avatar": getattr(student, "avatar", None),
                "payment_status": e.payment_status,
                "tutor_rating_of_student": e.tutor_rating_of_student,
                "tutor_review_of_student": e.tutor_review_of_student,
            })
        results.append({
            "id": cls.id,
            "title": cls.title,
            "status": cls.status,
            "scheduled_at": cls.scheduled_at.isoformat() if cls.scheduled_at else None,
            "category": cls.category,
            "enrollments": students,
            "total_enrolled": len(students),
        })

    return {"classes": results, "total": len(results)}


# ═══════════════════════════════════════════════════════════════════
#  TUTOR RATING ENFORCEMENT (6-MONTH RULE)
# ═══════════════════════════════════════════════════════════════════

def check_tutor_rating_enforcement(db: Session) -> dict:
    """
    Queries all approved tutors. For those with 6+ months since verified_at
    and rating_average <= 2.0 (out of 5, equiv. to 4.0 out of 10),
    auto-suspends them with reason.
    Returns summary of actions taken.
    """
    cutoff = datetime.utcnow() - timedelta(days=180)  # ~6 months

    tutors = db.query(TutorProfile).filter(
        TutorProfile.status == "approved",
        TutorProfile.verified_at.isnot(None),
        TutorProfile.verified_at <= cutoff,
        TutorProfile.rating_average <= 2.0,  # 2.0 out of 5 = 4.0 out of 10
        TutorProfile.rating_average > 0,  # only tutors with ratings
    ).all()

    suspended = []
    for tutor in tutors:
        tutor.status = "suspended"
        tutor.rejection_reason = "Calificacion insuficiente en periodo de 6 meses"
        tutor.updated_at = datetime.utcnow()

        # Cancel future published classes
        future_classes = db.query(TutorClass).filter(
            TutorClass.tutor_id == tutor.id,
            TutorClass.status == "published",
            TutorClass.scheduled_at > datetime.utcnow(),
        ).all()
        for cls in future_classes:
            cls.status = "cancelled"

        suspended.append({
            "tutor_id": tutor.id,
            "tutor_role_number": tutor.tutor_role_number,
            "rating_average": tutor.rating_average,
            "verified_at": tutor.verified_at.isoformat() if tutor.verified_at else None,
            "cancelled_classes": len(future_classes),
        })

    if suspended:
        db.commit()
        logger.info(f"Rating enforcement: suspended {len(suspended)} tutors")

    return {
        "total_checked": db.query(TutorProfile).filter(TutorProfile.status == "approved").count(),
        "suspended_count": len(suspended),
        "suspended": suspended,
    }


@router.post("/admin/enforce-ratings")
def admin_enforce_ratings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin triggers rating enforcement check (6-month rule)."""
    _require_admin_access(user)

    result = check_tutor_rating_enforcement(db)

    return {
        "ok": True,
        "message": f"Revision completada. {result['suspended_count']} tutor(es) suspendido(s) por calificacion insuficiente.",
        **result,
    }


# ═══════════════════════════════════════════════════════════════════
#  OWNER AS FREE TUTOR
# ═══════════════════════════════════════════════════════════════════

@router.post("/apply-as-owner")
def apply_as_owner_tutor(
    data: OwnerTutorApplyRequest = OwnerTutorApplyRequest(),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner registers as a free tutor (rate=0). Auto-approved."""
    role = getattr(user, "role", "user") or "user"
    if role != "owner":
        raise HTTPException(status_code=403, detail="Solo el owner puede registrarse como tutor gratuito")

    # Check if already has a tutor profile
    existing = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if existing:
        if existing.status == "approved":
            return {"ok": True, "message": "Ya tienes un perfil de tutor aprobado", "tutor": _tutor_to_dict(existing, include_bank=True)}
        # Reactivate if rejected/suspended
        existing.status = "approved"
        existing.individual_rate = 0
        existing.group_2_rate = 0
        existing.group_3_rate = 0
        existing.group_4_rate = 0
        existing.group_5_rate = 0
        existing.verified_at = datetime.utcnow()
        existing.verified_by = user.id
        existing.rejection_reason = None
        existing.updated_at = datetime.utcnow()
        if data.professional_title:
            existing.professional_title = data.professional_title
        if data.bio:
            existing.bio = data.bio
        if data.specialties:
            existing.specialties = json.dumps(data.specialties)
        db.commit()
        db.refresh(existing)
        return {"ok": True, "message": "Perfil de tutor reactivado como gratuito", "tutor": _tutor_to_dict(existing, include_bank=True)}

    tutor_role_number = _generate_tutor_role_number(db)

    profile = TutorProfile(
        user_id=user.id,
        tutor_role_number=tutor_role_number,
        status="approved",  # auto-approved for owner
        professional_title=data.professional_title,
        institution=data.institution,
        bio=data.bio,
        specialties=json.dumps(data.specialties),
        individual_rate=0,
        group_2_rate=0,
        group_3_rate=0,
        group_4_rate=0,
        group_5_rate=0,
        payment_frequency="per_class",
        verified_at=datetime.utcnow(),
        verified_by=user.id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "ok": True,
        "message": "Perfil de tutor gratuito creado y aprobado automaticamente",
        "tutor": _tutor_to_dict(profile, include_bank=True),
    }


# ═══════════════════════════════════════════════════════════════════
# TUTOR SUBJECTS (ASIGNATURAS)
# Each subject must be approved by CEO/UTP before it can be used in a class.
# ═══════════════════════════════════════════════════════════════════

class TutorSubject(Base):
    __tablename__ = "tutor_subjects"

    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    category = Column(String(100), default="")          # e.g. "Matemáticas", "Ingeniería"
    level = Column(String(50), default="")              # e.g. "Básico", "Intermedio", "Avanzado"
    description = Column(Text, default="")
    learning_objectives = Column(Text, default="")      # What the student will learn
    prerequisites = Column(Text, default="")            # What the student should know first
    duration_hours = Column(Float, default=1.0)         # Typical session length
    max_students = Column(Integer, default=5)           # Max students per session

    # Materials (JSON list of {name, url_or_path, type})
    materials_json = Column(Text, default="[]")

    # Approval workflow
    status = Column(String(20), default="draft")        # draft/pending_approval/approved/rejected
    rejection_reason = Column(Text, nullable=True)
    approved_by = Column(String(16), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Stats
    total_classes = Column(Integer, default=0)
    total_students = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    tutor = relationship("TutorProfile", back_populates="subjects")


# Register reverse relationship on TutorProfile
TutorProfile.subjects = relationship("TutorSubject", back_populates="tutor", cascade="all, delete-orphan")

# Create the table if it doesn't exist
TutorSubject.__table__.create(bind=engine, checkfirst=True)


class TutorSubjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str = ""
    level: str = ""
    description: str = ""
    learning_objectives: str = ""
    prerequisites: str = ""
    duration_hours: float = 1.0
    max_students: int = 5
    materials: list = []

class TutorSubjectUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    learning_objectives: Optional[str] = None
    prerequisites: Optional[str] = None
    duration_hours: Optional[float] = None
    max_students: Optional[int] = None
    materials: Optional[list] = None


def _subject_to_dict(s: TutorSubject) -> dict:
    return {
        "id": s.id,
        "tutor_id": s.tutor_id,
        "name": s.name,
        "category": s.category,
        "level": s.level,
        "description": s.description,
        "learning_objectives": s.learning_objectives,
        "prerequisites": s.prerequisites,
        "duration_hours": s.duration_hours,
        "max_students": s.max_students,
        "materials": json.loads(s.materials_json) if s.materials_json else [],
        "status": s.status,
        "rejection_reason": s.rejection_reason,
        "approved_by": s.approved_by,
        "approved_at": s.approved_at.isoformat() if s.approved_at else None,
        "total_classes": s.total_classes,
        "total_students": s.total_students,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


# ─── Tutor CRUD ──────────────────────────────────────────────────

@router.post("/subjects")
def create_subject(
    data: TutorSubjectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor creates a new subject (saved as draft)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "No tienes un perfil de tutor")
    if profile.status != "approved":
        raise HTTPException(403, "Solo tutores aprobados pueden crear asignaturas")

    subject = TutorSubject(
        tutor_id=profile.id,
        name=data.name,
        category=data.category,
        level=data.level,
        description=data.description,
        learning_objectives=data.learning_objectives,
        prerequisites=data.prerequisites,
        duration_hours=data.duration_hours,
        max_students=max(1, min(data.max_students, 5)),
        materials_json=json.dumps(data.materials),
        status="draft",
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"ok": True, "subject": _subject_to_dict(subject)}


@router.get("/my-subjects")
def get_my_subjects(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor lists all their subjects."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "No tienes un perfil de tutor")

    subjects = db.query(TutorSubject).filter(
        TutorSubject.tutor_id == profile.id
    ).order_by(desc(TutorSubject.created_at)).all()

    return {"subjects": [_subject_to_dict(s) for s in subjects], "total": len(subjects)}


@router.put("/subjects/{subject_id}")
def update_subject(
    subject_id: str,
    data: TutorSubjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor updates a subject (only allowed if draft or rejected)."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "No tienes un perfil de tutor")

    subject = db.query(TutorSubject).filter(
        TutorSubject.id == subject_id, TutorSubject.tutor_id == profile.id
    ).first()
    if not subject:
        raise HTTPException(404, "Asignatura no encontrada")
    if subject.status not in ("draft", "rejected"):
        raise HTTPException(400, f"No puedes editar una asignatura en estado '{subject.status}'")

    if data.name is not None: subject.name = data.name
    if data.category is not None: subject.category = data.category
    if data.level is not None: subject.level = data.level
    if data.description is not None: subject.description = data.description
    if data.learning_objectives is not None: subject.learning_objectives = data.learning_objectives
    if data.prerequisites is not None: subject.prerequisites = data.prerequisites
    if data.duration_hours is not None: subject.duration_hours = data.duration_hours
    if data.max_students is not None: subject.max_students = max(1, min(data.max_students, 5))
    if data.materials is not None: subject.materials_json = json.dumps(data.materials)
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)
    return {"ok": True, "subject": _subject_to_dict(subject)}


@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor deletes a draft or rejected subject."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "No tienes un perfil de tutor")

    subject = db.query(TutorSubject).filter(
        TutorSubject.id == subject_id, TutorSubject.tutor_id == profile.id
    ).first()
    if not subject:
        raise HTTPException(404, "Asignatura no encontrada")
    if subject.status not in ("draft", "rejected"):
        raise HTTPException(400, "Solo puedes eliminar asignaturas en borrador o rechazadas")

    db.delete(subject)
    db.commit()
    return {"ok": True}


@router.post("/subjects/{subject_id}/submit")
def submit_subject_for_approval(
    subject_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor submits a subject for CEO/UTP approval."""
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "No tienes un perfil de tutor")

    subject = db.query(TutorSubject).filter(
        TutorSubject.id == subject_id, TutorSubject.tutor_id == profile.id
    ).first()
    if not subject:
        raise HTTPException(404, "Asignatura no encontrada")
    if subject.status not in ("draft", "rejected"):
        raise HTTPException(400, f"Esta asignatura ya está en estado '{subject.status}'")
    if not subject.description.strip():
        raise HTTPException(400, "La asignatura debe tener una descripción antes de enviarse a revisión")

    subject.status = "pending_approval"
    subject.rejection_reason = None
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)

    # Alert CEO
    tutor_name = f"{user.first_name} {user.last_name}".strip()
    send_ceo_alert(
        f"Nueva asignatura para revisión: {subject.name}",
        f"El tutor {tutor_name} ({profile.tutor_role_number}) envió la asignatura '{subject.name}' para aprobación.",
    )

    return {"ok": True, "subject": _subject_to_dict(subject)}


# ─── Admin endpoints ──────────────────────────────────────────────

@router.get("/admin/subjects")
def list_subjects_admin(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """CEO/UTP/Admin: list all subjects with optional filters."""
    _require_admin_access(user)

    query = db.query(TutorSubject)
    if status_filter:
        query = query.filter(TutorSubject.status == status_filter)
    else:
        query = query.filter(TutorSubject.status == "pending_approval")  # default: show pending

    if search:
        query = query.filter(
            or_(
                TutorSubject.name.ilike(f"%{search}%"),
                TutorSubject.category.ilike(f"%{search}%"),
                TutorSubject.description.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    subjects = query.order_by(TutorSubject.created_at).offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for s in subjects:
        d = _subject_to_dict(s)
        tutor = db.query(TutorProfile).filter(TutorProfile.id == s.tutor_id).first()
        if tutor:
            u = db.query(User).filter(User.id == tutor.user_id).first()
            d["tutor_name"] = f"{u.first_name} {u.last_name}" if u else "Desconocido"
            d["tutor_role_number"] = tutor.tutor_role_number
        results.append(d)

    return {"subjects": results, "total": total, "page": page, "per_page": per_page}


@router.put("/admin/subjects/{subject_id}/approve")
def approve_subject(
    subject_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """CEO/UTP/Admin: approve a subject."""
    _require_admin_access(user)

    subject = db.query(TutorSubject).filter(TutorSubject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, "Asignatura no encontrada")
    if subject.status != "pending_approval":
        raise HTTPException(400, f"No se puede aprobar una asignatura en estado '{subject.status}'")

    subject.status = "approved"
    subject.approved_by = user.id
    subject.approved_at = datetime.utcnow()
    subject.rejection_reason = None
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)

    # Notify the tutor via push
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == subject.tutor_id).first()
    if tutor_profile:
        try:
            send_push_to_user(tutor_profile.user_id, "✅ Asignatura aprobada", f"Tu asignatura '{subject.name}' fue aprobada. Ya puedes usarla en tus clases.", db)
        except Exception:
            pass

    return {"ok": True, "subject": _subject_to_dict(subject)}


@router.put("/admin/subjects/{subject_id}/reject")
def reject_subject(
    subject_id: str,
    reason: str = Query(..., min_length=5),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """CEO/UTP/Admin: reject a subject with a reason."""
    _require_admin_access(user)

    subject = db.query(TutorSubject).filter(TutorSubject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, "Asignatura no encontrada")
    if subject.status != "pending_approval":
        raise HTTPException(400, f"No se puede rechazar una asignatura en estado '{subject.status}'")

    subject.status = "rejected"
    subject.rejection_reason = reason
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)

    # Notify the tutor
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == subject.tutor_id).first()
    if tutor_profile:
        try:
            send_push_to_user(tutor_profile.user_id, "❌ Asignatura rechazada", f"Tu asignatura '{subject.name}' fue rechazada. Motivo: {reason[:100]}", db)
        except Exception:
            pass

    return {"ok": True, "subject": _subject_to_dict(subject)}


# ═══════════════════════════════════════════════════════════════════
# CLASS OBJECTIONS (FASE 3)
# Student can "Terminar Clase" or "Objetar Clase/Tutoría".
# Objections trigger immediate alerts to tutor + CEO.
# Resolution SLA: 7 business days.
# ═══════════════════════════════════════════════════════════════════

class ClassObjection(Base):
    __tablename__ = "class_objections"

    id = Column(String(16), primary_key=True, default=gen_id)
    class_id = Column(String(16), ForeignKey("tutor_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(16), ForeignKey("users.id"), nullable=False)

    reason = Column(Text, nullable=False)               # 30–500 words
    status = Column(String(20), default="pending")      # pending | resolved | dismissed
    resolution = Column(Text, nullable=True)
    resolved_by = Column(String(16), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Payment hold flag: True while objection is pending
    payment_held = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_objection_per_student"),
    )


ClassObjection.__table__.create(bind=engine, checkfirst=True)


class ClassObjectionCreate(BaseModel):
    reason: str
    terms_accepted: bool


def _word_count(text: str) -> int:
    return len(text.split())


# ── Tutor starts the live session (clock in) ──────────────────────
@router.put("/classes/{class_id}/start")
def start_class_session(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor marks the class as started (in_progress). Unlocks Jitsi room for students."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.user_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el tutor puede iniciar la clase")

    if cls.status not in ("published", "confirmed"):
        raise HTTPException(status_code=400, detail=f"No se puede iniciar una clase en estado '{cls.status}'")

    cls.status = "in_progress"
    db.commit()
    db.refresh(cls)

    return {"ok": True, "message": "Clase iniciada.", "class": _class_to_dict(cls)}


# ── Student confirms class ended ("Terminar Clase") ───────────────
@router.put("/classes/{class_id}/student-confirm")
def student_confirm_class(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Student presses 'Terminar Clase'. Marks enrollment as confirmed by student.
    If tutor has also confirmed, class moves to 'completed'.
    """
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="No estás inscrito en esta clase")

    if enrollment.confirmed_by_student:
        raise HTTPException(status_code=400, detail="Ya confirmaste que la clase terminó")

    enrollment.confirmed_by_student = True
    db.commit()

    both_confirmed = bool(enrollment.confirmed_by_tutor)

    # If tutor also confirmed → complete the class + trigger payment release
    if both_confirmed:
        cls.status = "completed"
        db.commit()

        # ── Payment release: move payment to "processing" ──
        if enrollment.payment_id:
            payment = db.query(TutorPayment).filter(TutorPayment.id == enrollment.payment_id).first()
            if payment and payment.payment_status == "pending_boleta":
                payment.payment_status = "processing"
                db.commit()

        # ── Alert CEO + tutor of completion + payment ready ──
        tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
        tutor_user = db.query(User).filter(User.id == tutor.user_id).first() if tutor else None
        tutor_name = (tutor_user.first_name + " " + tutor_user.last_name) if tutor_user else "Tutor"
        send_ceo_alert(
            f"✅ Clase completada — pago listo: {cls.title}",
            f"<p><strong>Clase:</strong> {cls.title}</p>"
            f"<p><strong>Tutor:</strong> {tutor_name}</p>"
            f"<p><strong>Estudiante:</strong> {user.first_name} {user.last_name}</p>"
            f"<p><strong>Estado:</strong> Ambas partes confirmaron. El pago puede liberarse al tutor una vez suba su boleta de honorarios.</p>",
        )
        if tutor_user:
            try:
                send_push_to_user(
                    tutor_user.id,
                    "✅ Clase confirmada",
                    f"El estudiante confirmó la clase '{cls.title}'. Sube tu boleta para recibir el pago.",
                    db,
                )
            except Exception:
                pass

    return {
        "ok": True,
        "message": "Confirmaste que la clase terminó. Podrás calificarla en breve.",
        "both_confirmed": both_confirmed,
    }


# ── Student objects to a class ("Objetar Clase/Tutoría") ──────────
@router.post("/classes/{class_id}/object")
def object_to_class(
    class_id: str,
    data: ClassObjectionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Student submits a formal objection. Sends immediate alerts to tutor + CEO.
    Resolution SLA: 7 business days.
    """
    if not data.terms_accepted:
        raise HTTPException(status_code=400, detail="Debes aceptar los términos y condiciones para enviar una objeción")

    word_count = _word_count(data.reason.strip())
    if word_count < 30:
        raise HTTPException(status_code=400, detail=f"Tu explicación debe tener al menos 30 palabras (tienes {word_count})")
    if word_count > 500:
        raise HTTPException(status_code=400, detail=f"Tu explicación no puede superar las 500 palabras (tienes {word_count})")

    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="No estás inscrito en esta clase")

    existing = db.query(ClassObjection).filter(
        ClassObjection.class_id == class_id,
        ClassObjection.student_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya enviaste una objeción para esta clase")

    obj = ClassObjection(
        class_id=class_id,
        student_id=user.id,
        reason=data.reason.strip(),
        status="pending",
        payment_held=True,
    )
    db.add(obj)

    # Mark class as disputed
    cls.status = "disputed"
    db.commit()
    db.refresh(obj)

    # Immediate push alert to tutor
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    tutor_user = db.query(User).filter(User.id == tutor.user_id).first() if tutor else None
    if tutor_user:
        try:
            send_push_to_user(
                tutor_user.id,
                "⚠️ Objeción recibida",
                f"El estudiante {user.first_name} {user.last_name} objetó la clase '{cls.title}'. Revisa tu panel.",
                db,
            )
        except Exception:
            pass

    # Immediate alert to CEO
    student_reason_preview = data.reason[:300] + ("..." if len(data.reason) > 300 else "")
    send_ceo_alert(
        f"🚨 Objeción de clase: {user.first_name} {user.last_name} — {cls.title}",
        f"""<p><strong>Estudiante:</strong> {user.first_name} {user.last_name} ({user.email})</p>
<p><strong>Clase:</strong> {cls.title} (ID: {class_id})</p>
<p><strong>Tutor:</strong> {(tutor_user.first_name + ' ' + tutor_user.last_name) if tutor_user else 'Desconocido'}</p>
<p><strong>Motivo (extracto):</strong><br>{student_reason_preview}</p>
<p><strong>Palabras:</strong> {word_count}</p>
<p><strong>SLA de resolución:</strong> 7 días hábiles desde {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC</p>
<p><strong>Estado de pago:</strong> RETENIDO hasta resolución</p>""",
    )

    return {
        "ok": True,
        "objection_id": obj.id,
        "message": "Tu objeción ha sido registrada y enviada al equipo de Conniku. En un máximo de 7 días hábiles recibirás una resolución.",
    }


# ── Get Jitsi room info for a class ───────────────────────────────
@router.get("/classes/{class_id}/jitsi-room")
def get_jitsi_room(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the Jitsi room name for an active class session."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    is_tutor = tutor and tutor.user_id == user.id
    is_student = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first() is not None

    if not is_tutor and not is_student:
        role = getattr(user, "role", "user") or "user"
        if role not in ("owner", "admin", "utp"):
            raise HTTPException(status_code=403, detail="No tienes acceso a esta sala")

    if cls.status not in ("in_progress", "confirmed", "published"):
        raise HTTPException(status_code=400, detail=f"La clase no está activa (estado: {cls.status})")

    room_name = f"conniku-{class_id}"
    return {
        "ok": True,
        "room_name": room_name,
        "jitsi_url": f"https://meet.jit.si/{room_name}",
        "class_status": cls.status,
        "is_tutor": is_tutor,
        "class_title": cls.title,
    }


# ═══════════════════════════════════════════════════════════════════
# FASE 4: POST-CLASS EXAM — 3-ATTEMPT SYSTEM
# Students get 3 attempts max. Warning shown on attempt 3.
# After 3 failed attempts: no refund guarantee.
# ═══════════════════════════════════════════════════════════════════

class TutorExamAttempt(Base):
    __tablename__ = "tutor_exam_attempts"

    id = Column(String(16), primary_key=True, default=gen_id)
    exam_id = Column(String(16), ForeignKey("tutor_exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)

    attempt_number = Column(Integer, nullable=False)         # 1, 2, 3
    answers = Column(Text, default="{}")                     # JSON
    score = Column(Float, default=0)                         # percentage 0-100
    passed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", "attempt_number", name="uq_exam_attempt_per_student"),
    )


TutorExamAttempt.__table__.create(bind=engine, checkfirst=True)


MAX_EXAM_ATTEMPTS = 3


class ExamAttemptRequest(BaseModel):
    answers: dict
    started_at: Optional[str] = None
    time_spent_seconds: int = 0


@router.post("/classes/{class_id}/exam/attempt")
def submit_exam_attempt(
    class_id: str,
    data: ExamAttemptRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Student submits a post-class exam attempt. Max 3 attempts.
    Warning is returned on attempt 3 (last attempt).
    After 3 failed attempts: no refund guarantee (student is informed).
    """
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    exam = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="No existe un examen para esta clase")

    if not exam.is_enabled:
        raise HTTPException(status_code=403, detail="El examen aún no está habilitado")

    enrollment = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Debes estar inscrito para rendir el examen")

    # Count existing attempts
    existing_attempts = db.query(TutorExamAttempt).filter(
        TutorExamAttempt.exam_id == exam.id,
        TutorExamAttempt.student_id == user.id,
    ).count()

    if existing_attempts >= MAX_EXAM_ATTEMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Has agotado los {MAX_EXAM_ATTEMPTS} intentos permitidos para este examen. La garantía de reembolso no aplica después del tercer intento fallido.",
        )

    attempt_number = existing_attempts + 1
    is_last_attempt = attempt_number == MAX_EXAM_ATTEMPTS

    # Auto-grade
    questions = json.loads(exam.questions) if exam.questions else []
    score, grading_details = _auto_grade_exam(questions, data.answers)
    passed = score >= exam.passing_score

    attempt = TutorExamAttempt(
        exam_id=exam.id,
        student_id=user.id,
        attempt_number=attempt_number,
        answers=json.dumps(data.answers),
        score=score,
        passed=passed,
        time_spent_seconds=data.time_spent_seconds,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    warning = None
    if is_last_attempt and not passed:
        warning = "Has usado tu último intento y no aprobaste. La garantía de reembolso ya no aplica para esta clase."

    return {
        "ok": True,
        "attempt_number": attempt_number,
        "attempts_used": attempt_number,
        "attempts_remaining": MAX_EXAM_ATTEMPTS - attempt_number,
        "is_last_attempt": is_last_attempt,
        "result": {
            "id": attempt.id,
            "score": score,
            "passed": passed,
            "passing_score": exam.passing_score,
            "time_spent_seconds": data.time_spent_seconds,
            "grading_details": grading_details,
        },
        "warning": warning,
        "message": "¡Aprobaste el examen! 🎉" if passed else f"No aprobaste. Puntaje: {score:.1f}% (mínimo: {exam.passing_score}%).",
    }


@router.get("/classes/{class_id}/exam/attempts")
def get_exam_attempts(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get this student's attempts for the class exam."""
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    exam = db.query(TutorExam).filter(TutorExam.class_id == class_id).first()
    if not exam:
        return {"ok": True, "exam": None, "attempts": [], "attempts_used": 0, "can_attempt": False}

    attempts = db.query(TutorExamAttempt).filter(
        TutorExamAttempt.exam_id == exam.id,
        TutorExamAttempt.student_id == user.id,
    ).order_by(TutorExamAttempt.attempt_number).all()

    attempts_used = len(attempts)
    best_score = max((a.score for a in attempts), default=0)
    any_passed = any(a.passed for a in attempts)

    return {
        "ok": True,
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "questions": json.loads(exam.questions) if exam.is_enabled else [],
            "time_limit_minutes": exam.time_limit_minutes,
            "passing_score": exam.passing_score,
            "is_enabled": exam.is_enabled,
        },
        "attempts": [
            {
                "attempt_number": a.attempt_number,
                "score": a.score,
                "passed": a.passed,
                "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
                "time_spent_seconds": a.time_spent_seconds,
            }
            for a in attempts
        ],
        "attempts_used": attempts_used,
        "attempts_remaining": max(0, MAX_EXAM_ATTEMPTS - attempts_used),
        "can_attempt": attempts_used < MAX_EXAM_ATTEMPTS and not any_passed and exam.is_enabled,
        "best_score": best_score,
        "passed": any_passed,
        "max_attempts": MAX_EXAM_ATTEMPTS,
    }


# ═══════════════════════════════════════════════════════════════════
# FASE 4: AI CLASS SUMMARY (Post-class document for student)
# Generates a structured summary from class chat messages using AI.
# ═══════════════════════════════════════════════════════════════════

@router.post("/classes/{class_id}/generate-summary")
def generate_class_summary(
    class_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates an AI-powered class summary from chat messages.
    Available to enrolled students and the tutor after class ends.
    """
    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    is_tutor = tutor and tutor.user_id == user.id
    is_student = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
    ).first() is not None

    if not is_tutor and not is_student:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    if cls.status not in ("completed", "in_progress"):
        raise HTTPException(status_code=400, detail="Solo disponible para clases en curso o completadas")

    # Fetch chat messages
    messages_q = db.query(TutorClassMessage).filter(
        TutorClassMessage.class_id == class_id,
    ).order_by(TutorClassMessage.created_at).all()

    if not messages_q:
        return {
            "ok": True,
            "summary": "No hay mensajes de chat para generar un resumen de esta clase.",
        }

    # Build chat transcript
    lines = []
    for m in messages_q:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        name = f"{sender.first_name} {sender.last_name}" if sender else "Usuario"
        lines.append(f"{name}: {m.message}")

    transcript = "\n".join(lines)

    subject = cls.title or cls.subject or "clase"

    system_prompt = """Eres un asistente académico experto. Tu tarea es generar un resumen estructurado y útil de una clase universitaria a partir del chat de la sesión.
El resumen debe ser en español, claro y profesional. Incluye: temas tratados, conceptos clave, fórmulas o definiciones relevantes mencionadas, y puntos de acción o recomendaciones de estudio."""

    user_prompt = f"""Genera un resumen estructurado de la siguiente clase: "{subject}"

CHAT DE LA SESIÓN:
{transcript[:6000]}

Por favor estructura el resumen así:
## Resumen de Clase: {subject}
### Temas Tratados
### Conceptos Clave
### Fórmulas o Definiciones
### Recomendaciones de Estudio
"""

    try:
        summary = _ai_engine._call_gemini_chat(
            system_prompt,
            [{"role": "user", "content": user_prompt}],
        )
    except Exception as e:
        logger.warning(f"AI summary failed for class {class_id}: {e}")
        summary = f"## Resumen de Clase: {subject}\n\nNo se pudo generar el resumen automático. Mensajes de chat registrados: {len(messages_q)}."

    return {
        "ok": True,
        "summary": summary,
        "messages_count": len(messages_q),
        "class_title": subject,
    }
