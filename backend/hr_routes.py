"""
HR Management API routes for Conniku (Chilean company).
Handles employees, documents, payroll, operational expenses, and reports.
All monetary values are in CLP unless otherwise noted.
"""
import contextlib
import hashlib
import io
import json
import logging
import os
import time

import httpx

logger = logging.getLogger(__name__)
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import List, Optional

from database import Base, User, engine, gen_id, get_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from middleware import get_current_user
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text, desc, func
from sqlalchemy.orm import Session, relationship

router = APIRouter(prefix="/hr", tags=["hr"])


# ─── Auto-migration: add new columns if missing ─────────────────
def _run_migrations():
    """Add new columns to existing tables without breaking data."""
    from sqlalchemy import text
    try:
        from database import engine as _eng
        with _eng.connect() as conn:
            stmts = [
                "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS employee_number VARCHAR(20) UNIQUE",
                "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS corporate_email VARCHAR(255)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_signed BOOLEAN DEFAULT FALSE",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_signed_at TIMESTAMP",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_signer_id VARCHAR(16)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_signer_name VARCHAR(200)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_signer_position VARCHAR(200)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_signer_username VARCHAR(100)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_employee_number VARCHAR(20)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_ip_address VARCHAR(45)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_document_hash VARCHAR(64)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS fes_verification_code VARCHAR(32)",
                "ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE",
            ]
            for stmt in stmts:
                with contextlib.suppress(Exception):
                    conn.execute(text(stmt))
            conn.commit()
    except Exception:
        pass  # SQLite or connection error — harmless

_run_migrations()


# ─── Helper: require owner or admin ─────────────────────────────

def _require_hr_access(user: User):
    """Only owner or admin can access HR routes."""
    role = getattr(user, "role", "user") or "user"
    if role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Acceso restringido a owner/admin")


# ═══════════════════════════════════════════════════════════════════
#  DATABASE MODELS
# ═══════════════════════════════════════════════════════════════════

class Employee(Base):
    __tablename__ = "hr_employees"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=True)

    # Identity
    rut = Column(String(12), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), default="")
    address = Column(Text, default="")
    birth_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    nationality = Column(String(50), default="Chilena")
    marital_status = Column(String(20), default="soltero")  # soltero/casado/divorciado/viudo

    # Emergency contact
    emergency_contact_name = Column(String(200), default="")
    emergency_contact_phone = Column(String(50), default="")

    # Employment
    position = Column(String(200), nullable=False)
    department = Column(String(100), default="general")
    hire_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=True)
    contract_type = Column(String(20), default="indefinido")  # indefinido/plazo_fijo/honorarios/por_obra
    work_schedule = Column(String(20), default="full_time")  # full_time/part_time
    weekly_hours = Column(Integer, default=45)

    # Compensation
    gross_salary = Column(Float, nullable=False)  # CLP
    colacion = Column(Float, default=0)  # CLP
    movilizacion = Column(Float, default=0)  # CLP

    # Previsional
    afp = Column(String(20), default="habitat")  # capital/cuprum/habitat/modelo/planvital/provida/uno
    health_system = Column(String(10), default="fonasa")  # fonasa/isapre
    isapre_name = Column(String(100), nullable=True)
    isapre_uf = Column(Float, nullable=True)  # UF amount for isapre plan
    afc_active = Column(Boolean, default=True)

    # Bank
    bank_name = Column(String(100), default="")
    bank_account_type = Column(String(30), default="")  # cuenta_corriente/cuenta_vista/cuenta_rut
    bank_account_number = Column(String(50), default="")

    # Status
    status = Column(String(20), default="active")  # active/inactive/terminated/on_leave
    profile_picture_url = Column(Text, nullable=True)
    is_art22_exempt = Column(Boolean, default=False)  # Art. 22 CT: sin control de jornada

    # Platform credentials (auto-generated on provision)
    employee_number = Column(String(20), unique=True, nullable=True)   # CON-2026-001
    corporate_email = Column(String(255), nullable=True)               # c.gutierrez.l@conniku.com

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("EmployeeDocument", back_populates="employee", cascade="all, delete-orphan")
    payroll_records = relationship("PayrollRecord", back_populates="employee", cascade="all, delete-orphan")


class EmployeeDocument(Base):
    __tablename__ = "hr_employee_documents"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(30), default="otro")  # contrato/anexo/job_description/liquidacion/certificado/finiquito/ci/afp/isapre/antecedentes/academico/bancario/riohs/etica/equipos/otro
    name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    signature_hash = Column(String(128), nullable=True)
    uploaded_by = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # FES — Firma Electrónica Simple (Ley 19.799)
    fes_signed = Column(Boolean, default=False)
    fes_signed_at = Column(DateTime, nullable=True)
    fes_signer_id = Column(String(16), nullable=True)       # user.id who FES-signed
    fes_signer_name = Column(String(200), nullable=True)    # full name at time of signing
    fes_signer_position = Column(String(200), nullable=True)
    fes_signer_username = Column(String(100), nullable=True)
    fes_employee_number = Column(String(20), nullable=True)
    fes_ip_address = Column(String(45), nullable=True)
    fes_document_hash = Column(String(64), nullable=True)   # SHA-256 of file content
    fes_verification_code = Column(String(32), nullable=True)  # short code for verification URL
    locked = Column(Boolean, default=False)  # document cannot be modified after FES signing

    employee = relationship("Employee", back_populates="documents")


class PayrollRecord(Base):
    __tablename__ = "hr_payroll_records"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    period_month = Column(Integer, nullable=False)
    period_year = Column(Integer, nullable=False)

    # Haberes
    gross_salary = Column(Float, default=0)
    gratificacion = Column(Float, default=0)
    overtime_hours = Column(Float, default=0)
    overtime_amount = Column(Float, default=0)
    bonuses = Column(Float, default=0)
    colacion = Column(Float, default=0)
    movilizacion = Column(Float, default=0)
    total_haberes_imponibles = Column(Float, default=0)
    total_haberes_no_imponibles = Column(Float, default=0)

    # Descuentos legales (employee)
    afp_employee = Column(Float, default=0)
    health_employee = Column(Float, default=0)
    afc_employee = Column(Float, default=0)
    tax_amount = Column(Float, default=0)

    # Otros descuentos
    voluntary_deductions = Column(Float, default=0)
    other_deductions = Column(Float, default=0)

    total_deductions = Column(Float, default=0)
    net_salary = Column(Float, default=0)

    # Employer costs
    afp_employer = Column(Float, default=0)  # SIS
    afc_employer = Column(Float, default=0)
    mutual_employer = Column(Float, default=0)
    total_employer_cost = Column(Float, default=0)

    status = Column(String(20), default="draft")  # draft/approved/paid
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="payroll_records")

    __table_args__ = (
        Index("ix_payroll_period", "period_year", "period_month"),
    )


class OperationalExpense(Base):
    __tablename__ = "hr_operational_expenses"

    id = Column(String(16), primary_key=True, default=gen_id)
    # Core accounting fields
    category = Column(String(50), default="otro")
    subcategory = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    amount_clp = Column(Float, nullable=False)
    amount_usd = Column(Float, nullable=True)
    exchange_rate = Column(Float, nullable=True)
    currency = Column(String(5), default="CLP")
    amount_original = Column(Float, nullable=True)

    # Document & provider
    provider_name = Column(String(255), default="")
    provider_rut = Column(String(20), nullable=True)
    document_number = Column(String(50), default="")
    document_type = Column(String(30), default="recibo")  # factura/boleta/boleta_honorarios/recibo
    tax_deductible = Column(Boolean, default=True)
    iva_amount = Column(Float, nullable=True)
    iva_recuperable = Column(Boolean, default=False)
    retencion = Column(Float, default=0)
    deductible_percent = Column(Integer, default=100)

    # Transaction metadata
    date = Column(String(10), nullable=True)          # YYYY-MM-DD
    tx_type = Column(String(20), default="egreso")     # egreso/ingreso/costo/inversion
    payment_method = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
    attachment_name = Column(String(255), nullable=True)

    period_month = Column(Integer, nullable=False)
    period_year = Column(Integer, nullable=False)

    recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String(20), nullable=True)

    file_path = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_expense_period", "period_year", "period_month"),
    )


class EmployeeFesSignature(Base):
    __tablename__ = "hr_fes_signatures"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False)
    signer_email = Column(String(255), nullable=False)
    signer_name = Column(String(255), nullable=False)
    signer_rut = Column(String(20), nullable=False)
    timestamp = Column(String(50), nullable=False)
    ip_address = Column(String(50), nullable=False)
    document_hash = Column(String(128), nullable=False)
    verification_code = Column(String(50), nullable=False)
    status = Column(String(20), default="pending")  # pending/signed
    created_at = Column(DateTime, default=datetime.utcnow)


class EmployeeERCRecord(Base):
    __tablename__ = "hr_erc_records"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    record_type = Column(String(50), nullable=False, index=True)  # discipline, coaching, conversations, acknowledgements, reviews, chat
    data_payload = Column(Text, nullable=False)  # JSON payload
    created_at = Column(DateTime, default=datetime.utcnow)


class LegalObligationStatus(Base):
    __tablename__ = "hr_legal_obligations"

    id = Column(String(50), primary_key=True)  # e.g., 'reglamento_interno'
    status = Column(String(20), default="pendiente")
    notes = Column(Text, default="")
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AttendanceRecord(Base):
    __tablename__ = "hr_attendance_records"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False)          # YYYY-MM-DD
    entry_time = Column(String(5), nullable=True)       # HH:MM
    exit_time = Column(String(5), nullable=True)        # HH:MM
    total_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    status = Column(String(20), default="presente")     # presente/ausente/permiso/licencia/vacaciones/feriado
    is_late = Column(Boolean, default=False)
    late_minutes = Column(Integer, default=0)
    notes = Column(Text, default="")
    recorded_by = Column(String(20), default="employee")  # employee/admin
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_attendance_employee_date", "employee_id", "date"),
    )


class LeaveRequest(Base):
    __tablename__ = "hr_leave_requests"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(String(30), nullable=False)     # vacaciones/permiso_legal/paternidad/licencia_medica/permiso_sin_goce/dia_administrativo
    start_date = Column(String(10), nullable=False)     # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)       # YYYY-MM-DD
    days = Column(Integer, nullable=False)
    status = Column(String(20), default="pendiente")    # pendiente/aprobada/rechazada
    reason = Column(Text, default="")
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(String(10), nullable=True)
    reject_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_leave_employee_status", "employee_id", "status"),
    )


class EmployeeWarning(Base):
    __tablename__ = "hr_employee_warnings"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    warning_type = Column(String(20), nullable=False)   # coaching/w1_verbal/w2_written/termination
    incident_type = Column(String(20), nullable=False)  # missed_clockin/tardiness
    incident_count = Column(Integer, nullable=False)
    period_days = Column(Integer, nullable=False)       # 30 or 60
    notes = Column(Text, default="")
    issued_at = Column(DateTime, default=datetime.utcnow)


# Create tables (tolerant of pre-existing tables/constraints)
try:
    Base.metadata.create_all(engine)
except Exception as _e:
    for _t in Base.metadata.sorted_tables:
        with contextlib.suppress(Exception):
            _t.create(engine, checkfirst=True)


# ═══════════════════════════════════════════════════════════════════
#  CHILEAN PAYROLL CALCULATION ENGINE
# ═══════════════════════════════════════════════════════════════════

# AFP contribution rates (employee %) as of 2025-2026
AFP_RATES = {
    "capital":   {"employee": 0.1144, "sis": 0.0141},
    "cuprum":    {"employee": 0.1144, "sis": 0.0141},
    "habitat":   {"employee": 0.1127, "sis": 0.0141},
    "modelo":    {"employee": 0.1058, "sis": 0.0141},
    "planvital": {"employee": 0.1116, "sis": 0.0141},
    "provida":   {"employee": 0.1145, "sis": 0.0141},
    "uno":       {"employee": 0.1069, "sis": 0.0141},
}

# AFC (Seguro de Cesantia) rates
AFC_RATES = {
    "indefinido":  {"employee": 0.006, "employer": 0.024},
    "plazo_fijo":  {"employee": 0.0,   "employer": 0.03},
    "por_obra":    {"employee": 0.0,   "employer": 0.03},
    "honorarios":  {"employee": 0.0,   "employer": 0.0},
}

# Mutual (accident insurance) - standard rate
MUTUAL_RATE = 0.0093  # 0.93% base + additional risk

# Fonasa rate
FONASA_RATE = 0.07

# UF value fallback (updated periodically)
UF_VALUE_CLP = 38500.0  # Approximate, should be fetched dynamically

# Monthly tax brackets 2026 (approximate, in monthly UTM units)
# tax_base = imponible - afp - salud - afc
# Brackets: 0-13.5 UTM exempt, then progressive
UTM_VALUE_CLP = 67000.0  # Approximate monthly UTM

INCOME_TAX_BRACKETS = [
    (13.5,   0.0,   0.0),
    (30.0,   0.04,  13.5),
    (50.0,   0.08,  30.0),
    (70.0,   0.135, 50.0),
    (90.0,   0.23,  70.0),
    (120.0,  0.304, 90.0),
    (310.0,  0.35,  120.0),
    (float("inf"), 0.40, 310.0),
]

# Tope imponible (max taxable base) ~ 81.6 UF
TOPE_IMPONIBLE_UF = 81.6
# Tope AFC ~ 126.6 UF (higher than AFP tope)
TOPE_AFC_UF = 126.6

# Gratificacion legal: 25% of gross, capped at 4.75 monthly minimum wages
MINIMUM_WAGE_CLP = 500000.0  # Sueldo minimo approximate 2026
GRATIFICACION_CAP = 4.75 * MINIMUM_WAGE_CLP / 12


def _get_uf_value() -> float:
    """Try to fetch current UF, fallback to hardcoded."""
    try:
        import json
        import urllib.request
        req = urllib.request.Request("https://mindicador.cl/api/uf", headers={"User-Agent": "Conniku/2.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            return float(data["serie"][0]["valor"])
    except Exception:
        return UF_VALUE_CLP


def _calculate_tax(taxable_monthly: float) -> float:
    """Calculate Chilean second-category income tax (Impuesto Unico de Segunda Categoria)."""
    utm = UTM_VALUE_CLP
    taxable_in_utm = taxable_monthly / utm

    tax = 0.0
    for upper_utm, rate, lower_utm in INCOME_TAX_BRACKETS:
        if taxable_in_utm <= lower_utm:
            continue
        bracket_amount = min(taxable_in_utm, upper_utm) - lower_utm
        tax += bracket_amount * rate
        if taxable_in_utm <= upper_utm:
            break

    return round(tax * utm)


def calculate_payroll_for_employee(
    emp: Employee,
    overtime_hours: float = 0,
    bonuses: float = 0,
    voluntary_deductions: float = 0,
    other_deductions: float = 0,
) -> dict:
    """
    Full Chilean payroll calculation for one employee.
    Returns a dict with all payroll line items.
    """
    uf = _get_uf_value()
    tope_imponible = TOPE_IMPONIBLE_UF * uf
    tope_afc = TOPE_AFC_UF * uf

    gross = emp.gross_salary

    # --- Gratificacion (Art. 50 Codigo del Trabajo) ---
    grat = min(gross * 0.25, GRATIFICACION_CAP)

    # --- Overtime (horas extra: 50% surcharge) ---
    hourly_rate = gross / (emp.weekly_hours * 4.33) if emp.weekly_hours else 0
    overtime_amount = round(overtime_hours * hourly_rate * 1.5)

    # --- Haberes ---
    total_imponible = min(gross + grat + overtime_amount + bonuses, tope_imponible)
    total_no_imponible = emp.colacion + emp.movilizacion

    # --- AFP (employee) ---
    afp_name = (emp.afp or "habitat").lower()
    afp_rates = AFP_RATES.get(afp_name, AFP_RATES["habitat"])
    afp_employee = round(total_imponible * afp_rates["employee"])

    # --- Health ---
    if emp.health_system == "fonasa":
        health_employee = round(total_imponible * FONASA_RATE)
    else:
        # Isapre: pay agreed UF amount, minimum 7%
        isapre_clp = (emp.isapre_uf or 0) * uf
        fonasa_min = round(total_imponible * FONASA_RATE)
        health_employee = max(round(isapre_clp), fonasa_min)

    # --- AFC (employee) ---
    contract = (emp.contract_type or "indefinido").lower()
    afc_rates = AFC_RATES.get(contract, AFC_RATES["indefinido"])
    afc_base = min(total_imponible, tope_afc) if emp.afc_active else 0
    afc_employee = round(afc_base * afc_rates["employee"])

    # --- Tax ---
    taxable_base = total_imponible - afp_employee - health_employee - afc_employee
    tax_amount = _calculate_tax(max(taxable_base, 0))

    # --- Total deductions ---
    total_deductions = afp_employee + health_employee + afc_employee + tax_amount + voluntary_deductions + other_deductions

    # --- Net salary ---
    total_haberes = total_imponible + total_no_imponible
    net_salary = round(total_haberes - total_deductions)

    # --- Employer costs ---
    afp_employer_sis = round(total_imponible * afp_rates["sis"])
    afc_employer = round(afc_base * afc_rates["employer"])
    mutual_employer = round(total_imponible * MUTUAL_RATE)
    total_employer_cost = round(total_haberes + afp_employer_sis + afc_employer + mutual_employer)

    return {
        "gross_salary": gross,
        "gratificacion": grat,
        "overtime_hours": overtime_hours,
        "overtime_amount": overtime_amount,
        "bonuses": bonuses,
        "colacion": emp.colacion,
        "movilizacion": emp.movilizacion,
        "total_haberes_imponibles": total_imponible,
        "total_haberes_no_imponibles": total_no_imponible,
        "afp_employee": afp_employee,
        "health_employee": health_employee,
        "afc_employee": afc_employee,
        "tax_amount": tax_amount,
        "voluntary_deductions": voluntary_deductions,
        "other_deductions": other_deductions,
        "total_deductions": round(total_deductions),
        "net_salary": net_salary,
        "afp_employer": afp_employer_sis,
        "afc_employer": afc_employer,
        "mutual_employer": mutual_employer,
        "total_employer_cost": total_employer_cost,
    }


# ═══════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class EmployeeCreate(BaseModel):
    rut: str
    first_name: str
    last_name: str
    email: str
    phone: str = ""
    address: str = ""
    birth_date: Optional[str] = None
    nationality: str = "Chilena"
    marital_status: str = "soltero"
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    position: str
    department: str = "general"
    hire_date: str
    end_date: Optional[str] = None
    contract_type: str = "indefinido"
    work_schedule: str = "full_time"
    weekly_hours: int = 45
    gross_salary: float
    colacion: float = 0
    movilizacion: float = 0
    afp: str = "habitat"
    health_system: str = "fonasa"
    isapre_name: Optional[str] = None
    isapre_uf: Optional[float] = None
    afc_active: bool = True
    bank_name: str = ""
    bank_account_type: str = ""
    bank_account_number: str = ""
    user_id: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_art22_exempt: bool = False


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[str] = None
    nationality: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    end_date: Optional[str] = None
    contract_type: Optional[str] = None
    work_schedule: Optional[str] = None
    weekly_hours: Optional[int] = None
    gross_salary: Optional[float] = None
    colacion: Optional[float] = None
    movilizacion: Optional[float] = None
    afp: Optional[str] = None
    health_system: Optional[str] = None
    isapre_name: Optional[str] = None
    isapre_uf: Optional[float] = None
    afc_active: Optional[bool] = None
    bank_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_account_number: Optional[str] = None
    status: Optional[str] = None
    user_id: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_art22_exempt: Optional[bool] = None


class PayrollCalculateRequest(BaseModel):
    period_month: int = Field(ge=1, le=12)
    period_year: int = Field(ge=2020, le=2100)
    overrides: Optional[dict] = None  # employee_id -> {overtime_hours, bonuses, voluntary_deductions, other_deductions}


class ErcRecordCreate(BaseModel):
    record_type: str
    data_payload: str

class FesSignatureCreate(BaseModel):
    document_type: str
    signer_email: str
    signer_name: str
    signer_rut: str
    timestamp: str
    ip_address: str
    document_hash: str
    verification_code: str
    status: str = "pending"

class LegalObligationSaveItem(BaseModel):
    id: str
    status: str
    notes: Optional[str] = ""
    completed_at: Optional[str] = None

class LegalObligationSave(BaseModel):
    statuses: list[LegalObligationSaveItem]


class ExpenseCreate(BaseModel):
    category: str = "otro"
    subcategory: Optional[str] = None
    description: str
    amount_clp: float
    amount_usd: Optional[float] = None
    exchange_rate: Optional[float] = None
    currency: str = "CLP"
    amount_original: Optional[float] = None
    provider_name: str = ""
    provider_rut: Optional[str] = None
    document_number: str = ""
    document_type: str = "recibo"
    tax_deductible: bool = True
    iva_amount: Optional[float] = None
    iva_recuperable: bool = False
    retencion: float = 0
    deductible_percent: int = 100
    date: Optional[str] = None
    tx_type: str = "egreso"
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    attachment_name: Optional[str] = None
    period_month: int
    period_year: int
    recurring: bool = False
    recurring_frequency: Optional[str] = None
    file_path: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    amount_clp: Optional[float] = None
    amount_usd: Optional[float] = None
    exchange_rate: Optional[float] = None
    currency: Optional[str] = None
    amount_original: Optional[float] = None
    provider_name: Optional[str] = None
    provider_rut: Optional[str] = None
    document_number: Optional[str] = None
    document_type: Optional[str] = None
    tax_deductible: Optional[bool] = None
    iva_amount: Optional[float] = None
    iva_recuperable: Optional[bool] = None
    retencion: Optional[float] = None
    deductible_percent: Optional[int] = None
    date: Optional[str] = None
    tx_type: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    attachment_name: Optional[str] = None
    period_month: Optional[int] = None
    period_year: Optional[int] = None
    recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None
    file_path: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
#  SERIALIZERS
# ═══════════════════════════════════════════════════════════════════

def _employee_to_dict(emp: Employee) -> dict:
    return {
        "id": emp.id,
        "user_id": emp.user_id,
        "rut": emp.rut,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "full_name": f"{emp.first_name} {emp.last_name}",
        "email": emp.email,
        "phone": emp.phone,
        "address": emp.address,
        "birth_date": emp.birth_date,
        "nationality": emp.nationality,
        "marital_status": emp.marital_status,
        "emergency_contact_name": emp.emergency_contact_name,
        "emergency_contact_phone": emp.emergency_contact_phone,
        "position": emp.position,
        "department": emp.department,
        "hire_date": emp.hire_date,
        "end_date": emp.end_date,
        "contract_type": emp.contract_type,
        "work_schedule": emp.work_schedule,
        "weekly_hours": emp.weekly_hours,
        "gross_salary": emp.gross_salary,
        "colacion": emp.colacion,
        "movilizacion": emp.movilizacion,
        "afp": emp.afp,
        "health_system": emp.health_system,
        "isapre_name": emp.isapre_name,
        "isapre_uf": emp.isapre_uf,
        "afc_active": emp.afc_active,
        "bank_name": emp.bank_name,
        "bank_account_type": emp.bank_account_type,
        "bank_account_number": emp.bank_account_number,
        "status": emp.status,
        "profile_picture_url": emp.profile_picture_url,
        "is_art22_exempt": emp.is_art22_exempt,
        "employee_number": getattr(emp, 'employee_number', None),
        "corporate_email": getattr(emp, 'corporate_email', None),
        "created_at": emp.created_at.isoformat() if emp.created_at else None,
        "updated_at": emp.updated_at.isoformat() if emp.updated_at else None,
    }


def _document_to_dict(doc: EmployeeDocument) -> dict:
    return {
        "id": doc.id,
        "employee_id": doc.employee_id,
        "document_type": doc.document_type,
        "name": doc.name,
        "file_path": doc.file_path,
        "signed": doc.signed,
        "signed_at": doc.signed_at.isoformat() if doc.signed_at else None,
        "signature_hash": doc.signature_hash,
        "uploaded_by": doc.uploaded_by,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        # FES fields
        "fes_signed": getattr(doc, 'fes_signed', False),
        "fes_signed_at": doc.fes_signed_at.isoformat() if getattr(doc, 'fes_signed_at', None) else None,
        "fes_signer_name": getattr(doc, 'fes_signer_name', None),
        "fes_signer_username": getattr(doc, 'fes_signer_username', None),
        "fes_signer_position": getattr(doc, 'fes_signer_position', None),
        "fes_employee_number": getattr(doc, 'fes_employee_number', None),
        "fes_verification_code": getattr(doc, 'fes_verification_code', None),
        "fes_document_hash": getattr(doc, 'fes_document_hash', None),
        "locked": getattr(doc, 'locked', False),
    }


def _payroll_to_dict(pr: PayrollRecord) -> dict:
    return {
        "id": pr.id,
        "employee_id": pr.employee_id,
        "period_month": pr.period_month,
        "period_year": pr.period_year,
        "gross_salary": pr.gross_salary,
        "gratificacion": pr.gratificacion,
        "overtime_hours": pr.overtime_hours,
        "overtime_amount": pr.overtime_amount,
        "bonuses": pr.bonuses,
        "colacion": pr.colacion,
        "movilizacion": pr.movilizacion,
        "total_haberes_imponibles": pr.total_haberes_imponibles,
        "total_haberes_no_imponibles": pr.total_haberes_no_imponibles,
        "afp_employee": pr.afp_employee,
        "health_employee": pr.health_employee,
        "afc_employee": pr.afc_employee,
        "tax_amount": pr.tax_amount,
        "voluntary_deductions": pr.voluntary_deductions,
        "other_deductions": pr.other_deductions,
        "total_deductions": pr.total_deductions,
        "net_salary": pr.net_salary,
        "afp_employer": pr.afp_employer,
        "afc_employer": pr.afc_employer,
        "mutual_employer": pr.mutual_employer,
        "total_employer_cost": pr.total_employer_cost,
        "status": pr.status,
        "paid_at": pr.paid_at.isoformat() if pr.paid_at else None,
        "created_at": pr.created_at.isoformat() if pr.created_at else None,
    }


def _expense_to_dict(exp: OperationalExpense) -> dict:
    return {
        "id": exp.id,
        "category": exp.category,
        "subcategory": exp.subcategory,
        "description": exp.description,
        "amount_clp": exp.amount_clp,
        "amount_usd": exp.amount_usd,
        "exchange_rate": exp.exchange_rate,
        "currency": exp.currency or "CLP",
        "amount_original": exp.amount_original,
        "provider_name": exp.provider_name,
        "provider_rut": exp.provider_rut,
        "document_number": exp.document_number,
        "document_type": exp.document_type,
        "tax_deductible": exp.tax_deductible,
        "iva_amount": exp.iva_amount,
        "iva_recuperable": exp.iva_recuperable or False,
        "retencion": exp.retencion or 0,
        "deductible_percent": exp.deductible_percent if exp.deductible_percent is not None else 100,
        "date": exp.date,
        "tx_type": exp.tx_type or "egreso",
        "payment_method": exp.payment_method,
        "notes": exp.notes,
        "attachment_name": exp.attachment_name,
        "period_month": exp.period_month,
        "period_year": exp.period_year,
        "recurring": exp.recurring,
        "recurring_frequency": exp.recurring_frequency,
        "file_path": exp.file_path,
        "created_at": exp.created_at.isoformat() if exp.created_at else None,
        "updated_at": exp.updated_at.isoformat() if exp.updated_at else None,
    }


# ═══════════════════════════════════════════════════════════════════
#  EMPLOYEE CRUD
# ═══════════════════════════════════════════════════════════════════

VALID_MARITAL = {"soltero", "casado", "divorciado", "viudo"}
VALID_CONTRACT = {"indefinido", "plazo_fijo", "honorarios", "por_obra"}
VALID_SCHEDULE = {"full_time", "part_time"}
VALID_AFP = {"capital", "cuprum", "habitat", "modelo", "planvital", "provida", "uno"}
VALID_HEALTH = {"fonasa", "isapre"}
VALID_STATUS = {"active", "inactive", "terminated", "on_leave"}


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


# ═════════════════════════════════════════════════════════════════
# INDICADORES ECONOMICOS CHILENOS — Auto-actualización
# Fuente: mindicador.cl (API oficial gratuita del gobierno de Chile)
# ═════════════════════════════════════════════════════════════════
_indicators_cache = {"data": None, "timestamp": 0}
_CACHE_TTL = 3600  # Cache por 1 hora (3600 segundos)
_daily_update_log = {
    "last_daily_run": None,     # ISO datetime of last scheduled 8am run
    "last_daily_run_date": None, # Date string YYYY-MM-DD
    "imm_prev": None,           # IMM value before last update
    "imm_changed": False,       # True if IMM changed in the last daily run
}

MINDICADOR_URL = "https://mindicador.cl/api"

# Historial de IMM (Ingreso Mínimo Mensual) — se actualiza por ley
IMM_HISTORY = [
    {"from": "2024-07-01", "amount": 500000, "law": "Ley 21.578"},
    {"from": "2024-01-01", "amount": 460000, "law": "Ley 21.578"},
    {"from": "2023-09-01", "amount": 440000, "law": "Ley 21.526"},
    {"from": "2023-05-01", "amount": 410000, "law": "Ley 21.526"},
    {"from": "2022-08-01", "amount": 400000, "law": "Ley 21.456"},
]

def _get_current_imm() -> int:
    """Returns the current IMM based on today's date."""
    today = date.today().isoformat()
    for entry in IMM_HISTORY:
        if today >= entry["from"]:
            return entry["amount"]
    return IMM_HISTORY[-1]["amount"]


async def _fetch_indicators():
    """Fetch economic indicators from mindicador.cl with caching."""
    now = time.time()
    if _indicators_cache["data"] and (now - _indicators_cache["timestamp"]) < _CACHE_TTL:
        return _indicators_cache["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(MINDICADOR_URL)
            resp.raise_for_status()
            raw = resp.json()

        # Extract the indicators we need
        data = {
            "uf": {
                "value": raw.get("uf", {}).get("valor", 0),
                "date": raw.get("uf", {}).get("fecha", ""),
                "name": "Unidad de Fomento",
            },
            "utm": {
                "value": raw.get("utm", {}).get("valor", 0),
                "date": raw.get("utm", {}).get("fecha", ""),
                "name": "Unidad Tributaria Mensual",
            },
            "uta": {
                "value": raw.get("utm", {}).get("valor", 0) * 12,
                "name": "Unidad Tributaria Anual (UTM x 12)",
            },
            "dolar": {
                "value": raw.get("dolar", {}).get("valor", 0),
                "date": raw.get("dolar", {}).get("fecha", ""),
                "name": "Dolar Observado",
            },
            "euro": {
                "value": raw.get("euro", {}).get("valor", 0),
                "date": raw.get("euro", {}).get("fecha", ""),
                "name": "Euro",
            },
            "ipc": {
                "value": raw.get("ipc", {}).get("valor", 0),
                "date": raw.get("ipc", {}).get("fecha", ""),
                "name": "IPC (Indice de Precios al Consumidor)",
            },
            "imm": {
                "value": _get_current_imm(),
                "name": "Ingreso Minimo Mensual",
                "source": "Ley vigente",
            },
            # Calculated values for payroll
            "topes": {
                "afp_uf": 81.6,
                "afc_uf": 122.6,
                "salud_uf": 81.6,
                "afp_clp": round(raw.get("uf", {}).get("valor", 0) * 81.6),
                "afc_clp": round(raw.get("uf", {}).get("valor", 0) * 122.6),
                "salud_clp": round(raw.get("uf", {}).get("valor", 0) * 81.6),
            },
            "gratificacion": {
                "tope_mensual": round(_get_current_imm() * 4.75 / 12),
                "tope_anual": round(_get_current_imm() * 4.75),
                "rate": 0.25,
            },
            "afp_rates": {
                "capital": 11.44, "cuprum": 11.44, "habitat": 11.27,
                "modelo": 10.58, "planvital": 10.41, "provida": 11.45, "uno": 10.69,
            },
            "afc_rates": {
                "employee_indefinido": 0.6,
                "employer_indefinido": 2.4,
                "employer_plazo_fijo": 3.0,
            },
            "sis_rate": 1.41,
            "mutual_base_rate": 0.93,
            "source": "mindicador.cl",
            "fetched_at": datetime.utcnow().isoformat(),
            "cache_ttl_seconds": _CACHE_TTL,
        }

        _indicators_cache["data"] = data
        _indicators_cache["timestamp"] = now
        return data

    except Exception as e:
        logger.warning(f"mindicador.cl fetch failed: {e}")
        # If fetch fails, return cached data or defaults
        if _indicators_cache["data"]:
            return _indicators_cache["data"]
        # Fallback defaults
        return {
            "uf": {"value": 38700, "name": "UF (valor por defecto)", "date": ""},
            "utm": {"value": 67294, "name": "UTM (valor por defecto)", "date": ""},
            "dolar": {"value": 950, "name": "Dolar (valor por defecto)", "date": ""},
            "imm": {"value": _get_current_imm(), "name": "Ingreso Minimo Mensual"},
            "topes": {"afp_uf": 81.6, "afc_uf": 122.6, "salud_uf": 81.6, "afp_clp": 3158520, "afc_clp": 4749420, "salud_clp": 3158520},
            "gratificacion": {"tope_mensual": round(_get_current_imm() * 4.75 / 12), "tope_anual": round(_get_current_imm() * 4.75), "rate": 0.25},
            "error": str(e),
            "source": "fallback",
            "fetched_at": datetime.utcnow().isoformat(),
        }


async def daily_refresh_indicators():
    """Called by APScheduler every day at 08:00 Chile time."""
    global _daily_update_log
    try:
        prev_imm = (_indicators_cache.get("data") or {}).get("imm", {}).get("value")
        _indicators_cache["timestamp"] = 0  # force cache bypass
        data = await _fetch_indicators()
        new_imm = data.get("imm", {}).get("value")
        today = date.today().isoformat()
        _daily_update_log["last_daily_run"] = datetime.utcnow().isoformat()
        _daily_update_log["last_daily_run_date"] = today
        _daily_update_log["imm_prev"] = prev_imm
        _daily_update_log["imm_changed"] = (prev_imm is not None and prev_imm != new_imm)
        logger.info(f"Daily HR indicators refresh: IMM={new_imm}, changed={_daily_update_log['imm_changed']}")
    except Exception as e:
        logger.error(f"Daily indicators refresh failed: {e}")


@router.get("/indicators")
async def get_chile_indicators(user: User = Depends(get_current_user)):
    """
    Returns current Chilean economic indicators (UF, UTM, USD, IMM, etc.)
    Auto-updated from mindicador.cl API. Cached for 1 hour.
    Used by payroll calculator, contract generator, and HR dashboard.
    """
    _require_hr_access(user)
    data = await _fetch_indicators()
    today = date.today().isoformat()
    return {
        **data,
        "daily_update": {
            "last_run": _daily_update_log["last_daily_run"],
            "updated_today": _daily_update_log["last_daily_run_date"] == today,
            "imm_changed": _daily_update_log["imm_changed"],
            "imm_prev": _daily_update_log["imm_prev"],
        }
    }


@router.get("/indicators/public")
async def get_chile_indicators_public():
    """Public endpoint for basic indicators (no auth required)."""
    data = await _fetch_indicators()
    return {
        "uf": data.get("uf"),
        "utm": data.get("utm"),
        "dolar": data.get("dolar"),
        "imm": data.get("imm"),
    }


@router.post("/employees")
def create_employee(
    data: EmployeeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    if not _validate_rut(data.rut):
        raise HTTPException(400, "RUT invalido")
    if data.marital_status not in VALID_MARITAL:
        raise HTTPException(400, f"Estado civil debe ser uno de: {', '.join(VALID_MARITAL)}")
    if data.contract_type not in VALID_CONTRACT:
        raise HTTPException(400, f"Tipo de contrato debe ser uno de: {', '.join(VALID_CONTRACT)}")
    if data.work_schedule not in VALID_SCHEDULE:
        raise HTTPException(400, "Jornada debe ser full_time o part_time")
    if data.afp not in VALID_AFP:
        raise HTTPException(400, f"AFP debe ser una de: {', '.join(VALID_AFP)}")
    if data.health_system not in VALID_HEALTH:
        raise HTTPException(400, "Sistema de salud debe ser fonasa o isapre")
    if data.health_system == "isapre" and not data.isapre_name:
        raise HTTPException(400, "Debe indicar nombre de Isapre")

    existing = db.query(Employee).filter(Employee.rut == data.rut).first()
    if existing:
        raise HTTPException(409, "Ya existe un empleado con este RUT")

    emp = Employee(
        id=gen_id(),
        user_id=data.user_id,
        rut=data.rut,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
        birth_date=data.birth_date,
        nationality=data.nationality,
        marital_status=data.marital_status,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        position=data.position,
        department=data.department,
        hire_date=data.hire_date,
        end_date=data.end_date,
        contract_type=data.contract_type,
        work_schedule=data.work_schedule,
        weekly_hours=data.weekly_hours,
        gross_salary=data.gross_salary,
        colacion=data.colacion,
        movilizacion=data.movilizacion,
        afp=data.afp,
        health_system=data.health_system,
        isapre_name=data.isapre_name,
        isapre_uf=data.isapre_uf,
        afc_active=data.afc_active,
        bank_name=data.bank_name,
        bank_account_type=data.bank_account_type,
        bank_account_number=data.bank_account_number,
        status="active",
        profile_picture_url=data.profile_picture_url,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return {"employee": _employee_to_dict(emp)}


@router.get("/employees")
def list_employees(
    status: Optional[str] = None,
    department: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    query = db.query(Employee)
    if status:
        query = query.filter(Employee.status == status)
    if department:
        query = query.filter(Employee.department.ilike(f"%{department}%"))

    total = query.count()
    employees = query.order_by(Employee.last_name).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "employees": [_employee_to_dict(e) for e in employees],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/employees/{employee_id}")
def get_employee(
    employee_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    return {"employee": _employee_to_dict(emp)}


@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    updates = data.dict(exclude_unset=True)

    if "marital_status" in updates and updates["marital_status"] not in VALID_MARITAL:
        raise HTTPException(400, f"Estado civil debe ser uno de: {', '.join(VALID_MARITAL)}")
    if "contract_type" in updates and updates["contract_type"] not in VALID_CONTRACT:
        raise HTTPException(400, f"Tipo de contrato debe ser uno de: {', '.join(VALID_CONTRACT)}")
    if "work_schedule" in updates and updates["work_schedule"] not in VALID_SCHEDULE:
        raise HTTPException(400, "Jornada debe ser full_time o part_time")
    if "afp" in updates and updates["afp"] not in VALID_AFP:
        raise HTTPException(400, f"AFP debe ser una de: {', '.join(VALID_AFP)}")
    if "health_system" in updates and updates["health_system"] not in VALID_HEALTH:
        raise HTTPException(400, "Sistema de salud debe ser fonasa o isapre")
    if "status" in updates and updates["status"] not in VALID_STATUS:
        raise HTTPException(400, f"Estado debe ser uno de: {', '.join(VALID_STATUS)}")

    for key, value in updates.items():
        setattr(emp, key, value)
    emp.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(emp)
    return {"employee": _employee_to_dict(emp)}


@router.post("/employees/{employee_id}/avatar")
async def upload_employee_avatar(
    employee_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    import os
    import uuid

    from database import DATA_DIR
    covers_dir = DATA_DIR / "uploads" / "covers"
    covers_dir.mkdir(parents=True, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Formato de imagen no permitido. Usa JPG o PNG.")

    filename = f"avatar_{employee_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = covers_dir / filename

    with open(file_path, "wb") as f:
        f.write(await file.read())

    url = f"/uploads/covers/{filename}"
    emp.profile_picture_url = url
    emp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(emp)

    return {"employee": _employee_to_dict(emp)}


@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    emp.status = "terminated"
    emp.end_date = date.today().isoformat()
    emp.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Empleado desvinculado", "employee_id": employee_id}


# ═══════════════════════════════════════════════════════════════════
#  EMPLOYEE ERC RECORDS
# ═══════════════════════════════════════════════════════════════════

@router.get("/erc/all")
def get_all_erc(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    records = db.query(EmployeeERCRecord).all()

    result = {"coaching": [], "discipline": [], "conversations": [], "acknowledgements": [], "performance": []}
    for rec in records:
        if rec.record_type in result:
            payload = json.loads(rec.data_payload)
            payload["id"] = rec.id
            result[rec.record_type].append(payload)

    return {"records": result}

@router.get("/employees/{employee_id}/erc")
def get_employee_erc(
    employee_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    records = db.query(EmployeeERCRecord).filter(EmployeeERCRecord.employee_id == employee_id).all()

    result = {"coaching": [], "discipline": [], "conversations": [], "acknowledgements": [], "performance": []}
    for rec in records:
        if rec.record_type in result:
            payload = json.loads(rec.data_payload)
            payload["id"] = rec.id
            result[rec.record_type].append(payload)

    return {"records": result}

@router.post("/employees/{employee_id}/erc")
def create_employee_erc(
    employee_id: str,
    data: ErcRecordCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    try:
        json.loads(data.data_payload)
    except Exception:
        raise HTTPException(400, "Invalid JSON payload") from None

    new_record = EmployeeERCRecord(
        employee_id=employee_id,
        record_type=data.record_type,
        data_payload=data.data_payload
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    ret_payload = json.loads(new_record.data_payload)
    ret_payload["id"] = new_record.id

    return {"message": "ERC Record saved", "record": ret_payload}

@router.delete("/employees/{employee_id}/erc/{record_id}")
def delete_employee_erc(
    employee_id: str,
    record_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    rec = db.query(EmployeeERCRecord).filter(
        EmployeeERCRecord.employee_id == employee_id,
        EmployeeERCRecord.id == record_id
    ).first()
    if not rec:
        raise HTTPException(404, "Record not found")

    db.delete(rec)
    db.commit()
    return {"message": "Record deleted"}


# ═══════════════════════════════════════════════════════════════════
#  EMPLOYEE FES SIGNATURES
# ═══════════════════════════════════════════════════════════════════

@router.get("/fes/all")
def get_all_fes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    signatures = db.query(EmployeeFesSignature).all()

    result = []
    for sig in signatures:
        result.append({
            "id": sig.id,
            "employeeId": sig.employee_id,  # Include employee_id for easy grouping in frontend
            "document_type": sig.document_type,
            "signer_email": sig.signer_email,
            "signer_name": sig.signer_name,
            "signer_rut": sig.signer_rut,
            "timestamp": sig.timestamp,
            "ip_address": sig.ip_address,
            "document_hash": sig.document_hash,
            "verification_code": sig.verification_code,
            "status": sig.status,
            "created_at": sig.created_at.isoformat() if sig.created_at else None
        })
    return {"signatures": result}

@router.get("/employees/{employee_id}/fes")
def get_employee_fes(
    employee_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    signatures = db.query(EmployeeFesSignature).filter(EmployeeFesSignature.employee_id == employee_id).all()

    result = []
    for sig in signatures:
        result.append({
            "id": sig.id,
            "document_type": sig.document_type,
            "signer_email": sig.signer_email,
            "signer_name": sig.signer_name,
            "signer_rut": sig.signer_rut,
            "timestamp": sig.timestamp,
            "ip_address": sig.ip_address,
            "document_hash": sig.document_hash,
            "verification_code": sig.verification_code,
            "status": sig.status,
            "created_at": sig.created_at.isoformat() if sig.created_at else None
        })
    return {"signatures": result}

@router.post("/employees/{employee_id}/fes")
def create_employee_fes(
    employee_id: str,
    data: FesSignatureCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    new_sig = EmployeeFesSignature(
        employee_id=employee_id,
        document_type=data.document_type,
        signer_email=data.signer_email,
        signer_name=data.signer_name,
        signer_rut=data.signer_rut,
        timestamp=data.timestamp,
        ip_address=data.ip_address,
        document_hash=data.document_hash,
        verification_code=data.verification_code,
        status=data.status
    )
    db.add(new_sig)
    db.commit()
    db.refresh(new_sig)

    return {"message": "FES Signature saved", "id": new_sig.id}


# ═══════════════════════════════════════════════════════════════════
#  LEGAL OBLIGATIONS STATUS
# ═══════════════════════════════════════════════════════════════════

@router.get("/legal-obligations")
def get_legal_obligations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)
    statuses = db.query(LegalObligationStatus).all()
    result = {}
    for st in statuses:
        result[st.id] = {
            "status": st.status,
            "notes": st.notes,
            "completed_at": st.completed_at.isoformat() if st.completed_at else None
        }
    return {"statuses": result}

@router.post("/legal-obligations")
def save_legal_obligations(
    data: LegalObligationSave,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    for item in data.statuses:
        status_rec = db.query(LegalObligationStatus).filter(LegalObligationStatus.id == item.id).first()
        comp_date = None
        if item.completed_at:
            with contextlib.suppress(Exception):
                comp_date = datetime.fromisoformat(item.completed_at.replace("Z", "+00:00"))

        if status_rec:
            status_rec.status = item.status
            status_rec.notes = item.notes
            status_rec.completed_at = comp_date
            status_rec.updated_at = datetime.utcnow()
        else:
            new_rec = LegalObligationStatus(
                id=item.id,
                status=item.status,
                notes=item.notes or "",
                completed_at=comp_date
            )
            db.add(new_rec)

    db.commit()
    return {"message": "Legal obligations updated"}


# ═══════════════════════════════════════════════════════════════════
#  EMPLOYEE DOCUMENTS
# ═══════════════════════════════════════════════════════════════════

VALID_DOC_TYPES = {
    "contrato", "anexo", "job_description", "liquidacion", "certificado", "finiquito",
    "ci", "pasaporte", "afp", "isapre", "fonasa", "antecedentes", "academico", "titulo",
    "residencia", "foto_carnet", "finiquito_anterior", "situacion_militar",
    "cargas_familiares", "cuenta_bancaria", "examen_preocupacional", "riohs",
    "etica", "equipos", "adicional", "otro",
}

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "hr_documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/employees/{employee_id}/documents")
async def upload_document(
    employee_id: str,
    file: UploadFile = File(...),
    document_type: str = Form("otro"),
    name: str = Form(""),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    if document_type not in VALID_DOC_TYPES:
        raise HTTPException(400, f"Tipo de documento debe ser uno de: {', '.join(VALID_DOC_TYPES)}")

    doc_name = name or file.filename or "documento"
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{employee_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    doc = EmployeeDocument(
        id=gen_id(),
        employee_id=employee_id,
        document_type=document_type,
        name=doc_name,
        file_path=file_path,
        signed=False,
        uploaded_by=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"document": _document_to_dict(doc)}


@router.get("/employees/{employee_id}/documents")
def list_employee_documents(
    employee_id: str,
    document_type: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    query = db.query(EmployeeDocument).filter(EmployeeDocument.employee_id == employee_id)
    if document_type:
        query = query.filter(EmployeeDocument.document_type == document_type)

    docs = query.order_by(desc(EmployeeDocument.created_at)).all()
    return {"documents": [_document_to_dict(d) for d in docs]}


@router.post("/documents/{document_id}/sign")
def sign_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if doc.signed:
        raise HTTPException(400, "Documento ya fue firmado")

    # Generate signature hash from document content + signer + timestamp
    now = datetime.utcnow()
    sig_payload = f"{doc.id}:{doc.file_path}:{user.id}:{now.isoformat()}"
    signature_hash = hashlib.sha256(sig_payload.encode()).hexdigest()

    doc.signed = True
    doc.signed_at = now
    doc.signature_hash = signature_hash
    db.commit()
    db.refresh(doc)

    return {
        "document": _document_to_dict(doc),
        "message": "Documento firmado exitosamente",
    }


class ContractGenerateRequest(BaseModel):
    html: str
    worker_name: str = "trabajador"


@router.post("/employees/{employee_id}/contract/generate")
async def generate_contract_pdf(
    employee_id: str,
    body: ContractGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Convierte el HTML del contrato a PDF con xhtml2pdf,
    lo guarda en la carpeta del trabajador y crea un registro
    firmado en EmployeeDocument (type='contrato').
    """
    import io
    import re

    _require_hr_access(user)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    html_content = body.html

    # ── Preprocesar HTML para xhtml2pdf (no soporta flexbox) ───────
    # Reemplazar la sección de firmas (flex) por una tabla HTML simple
    flex_pattern = re.compile(
        r'<div class="signatures">(.*?)</div>\s*</div>',
        re.DOTALL,
    )
    def _replace_signatures(m: re.Match) -> str:
        inner = m.group(1)
        # Extraer los dos sig-block
        blocks = re.findall(r'<div class="sig-block">(.*?)</div>', inner, re.DOTALL)
        cells = "".join(
            f'<td style="width:50%;vertical-align:bottom;text-align:center;padding:0 20px;">{b}</td>'
            for b in blocks
        )
        return (
            '<table style="width:100%;margin-top:50px;border-collapse:collapse;">'
            f"<tr>{cells}</tr></table>"
        )
    html_content = flex_pattern.sub(_replace_signatures, html_content)
    # Eliminar reglas flex del CSS embebido para evitar warnings
    html_content = re.sub(r'display:\s*flex;?', 'display:block;', html_content)
    html_content = re.sub(r'justify-content:[^;]+;', '', html_content)
    html_content = re.sub(r'gap:\s*[^;]+;', '', html_content)

    # ── Generar PDF con xhtml2pdf ───────────────────────────────────
    try:
        from xhtml2pdf import pisa  # lazy import — no rompe si no instalado aún
        pdf_buffer = io.BytesIO()
        status = pisa.CreatePDF(io.StringIO(html_content), dest=pdf_buffer)
        if status.err:
            raise ValueError(f"xhtml2pdf error: {status.err}")
        pdf_bytes = pdf_buffer.getvalue()
    except Exception as exc:
        raise HTTPException(500, f"Error al generar PDF: {exc}") from exc

    # ── Guardar archivo en disco ────────────────────────────────────
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_name = re.sub(r"[^a-zA-Z0-9_\- ]", "", body.worker_name).replace(" ", "_")
    filename = f"contrato_{safe_name}_{timestamp}.pdf"
    file_path = os.path.join(UPLOAD_DIR, f"{employee_id}_{filename}")
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    # ── Crear registro de documento firmado ────────────────────────
    now = datetime.utcnow()
    sig_hash = hashlib.sha256(
        f"{employee_id}:{file_path}:{user.id}:{now.isoformat()}".encode()
    ).hexdigest()
    doc = EmployeeDocument(
        id=gen_id(),
        employee_id=employee_id,
        document_type="contrato",
        name=f"Contrato Individual de Trabajo — {body.worker_name}",
        file_path=file_path,
        signed=True,
        signed_at=now,
        signature_hash=sig_hash,
        uploaded_by=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "document": _document_to_dict(doc),
        "message": "Contrato generado y guardado en la carpeta del trabajador",
        "filename": filename,
    }


# ── Provision employee platform account ────────────────────────────
@router.post("/employees/{employee_id}/provision-account")
def provision_employee_account(
    employee_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crea una cuenta de plataforma (conniku.com) para el empleado.
    Genera: employee_number, username, password temporal, corporate_email.
    La contraseña en texto plano se retorna UNA SOLA VEZ.
    """
    import re as _re
    import unicodedata

    import bcrypt

    _require_hr_access(user)
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    if emp.user_id:
        raise HTTPException(400, "Este empleado ya tiene cuenta de plataforma")

    # ── Normalizar tildes/ñ ─────────────────────────────────────────
    def _norm(s: str) -> str:
        return ''.join(
            c for c in unicodedata.normalize('NFD', s)
            if unicodedata.category(c) != 'Mn'
        ).lower()

    first_raw = (emp.first_name or "X").strip()
    last_raw  = (emp.last_name or "User").strip()
    first_norm = _norm(first_raw)
    last_norm  = _norm(last_raw)

    first_parts = first_norm.split()   # ['cristian', 'andres']
    last_parts  = last_norm.split()    # ['gutierrez', 'lazcano']
    f1 = first_parts[0][0] if first_parts else 'x'     # 'c'
    l1 = last_parts[0] if last_parts else 'user'        # 'gutierrez'
    l2 = last_parts[1] if len(last_parts) > 1 else ''   # 'lazcano'

    # ── Employee number (CON-YYYY-NNN) ──────────────────────────────
    year = datetime.utcnow().year
    count = db.query(Employee).filter(Employee.employee_number.isnot(None)).count()
    seq = count + 1
    emp_num = f"CON-{year}-{seq:03d}"
    # Ensure unique
    while db.query(Employee).filter(Employee.employee_number == emp_num).first():
        seq += 1
        emp_num = f"CON-{year}-{seq:03d}"

    # ── Username: f1 + l1 + seq ─────────────────────────────────────
    username = f"{f1}{l1}{seq:03d}"   # cgutierrez001
    username = _re.sub(r'[^a-z0-9]', '', username)
    # Ensure unique
    base = username
    suffix = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base[:-3]}{suffix:03d}"
        suffix += 1

    # ── Password: f1 + l1 + l2 ─────────────────────────────────────
    password_plain = f"{f1}{l1}{l2}" if l2 else f"{f1}{l1}123"
    password_plain = _re.sub(r'[^a-z0-9]', '', password_plain)  # cgutierrezlazcano

    # ── Corporate email: C.Gutierrez.L@conniku.com (lowercase) ─────
    F1 = first_raw[0].upper()                 # C
    L1 = l1.capitalize()                      # Gutierrez
    L2_init = (l2[0].upper() + '.') if l2 else ''  # L.
    corp_email = f"{F1}.{L1}.{L2_init}conniku.com".lower()
    # e.g.: c.gutierrez.l.conniku.com  → add @ before conniku
    corp_email = f"{F1}.{L1}.{L2_init}@conniku.com".lower()

    # Ensure email unique
    base_email = corp_email
    email_suffix = 1
    while db.query(User).filter(User.email == corp_email).first():
        corp_email = base_email.replace('@', f'{email_suffix}@')
        email_suffix += 1

    # ── Hash password ───────────────────────────────────────────────
    pwd_hash = bcrypt.hashpw(password_plain.encode(), bcrypt.gensalt(rounds=12)).decode()

    # ── Create User account ─────────────────────────────────────────
    new_platform_user = User(
        id=gen_id(),
        email=corp_email,
        password_hash=pwd_hash,
        username=username,
        first_name=emp.first_name,
        last_name=emp.last_name,
        role='employee',
        email_verified=True,
    )
    db.add(new_platform_user)

    # ── Update Employee ─────────────────────────────────────────────
    emp.employee_number = emp_num
    emp.corporate_email = corp_email
    emp.user_id = new_platform_user.id
    db.commit()
    db.refresh(emp)

    return {
        "employee_number": emp_num,
        "username": username,
        "password": password_plain,   # retornado UNA SOLA VEZ
        "corporate_email": corp_email,
        "user_id": new_platform_user.id,
        "message": "Cuenta de plataforma creada exitosamente",
    }


# ── FES — Firma Electrónica Simple (Ley 19.799) ────────────────────
@router.post("/documents/{document_id}/fes-sign")
def fes_sign_document(
    document_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Firma un documento con FES.
    El firmante DEBE ser el empleado propietario del documento (o CEO/admin).
    Tras la firma el documento queda BLOQUEADO e inmutable.
    """
    import secrets

    doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if doc.locked:
        raise HTTPException(400, "Documento ya firmado y bloqueado — no puede volver a firmarse")

    # Verificar que el firmante es el empleado dueño o un admin/owner
    emp = db.query(Employee).filter(Employee.id == doc.employee_id).first()
    is_hr = getattr(user, 'role', 'user') in ('owner', 'admin')
    is_owner = emp and emp.user_id == user.id
    if not (is_hr or is_owner):
        raise HTTPException(403, "Solo el trabajador o un administrador puede firmar este documento")

    # ── Generar hash del contenido del archivo ──────────────────────
    file_hash = "N/A"
    try:
        with open(doc.file_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
    except Exception:
        pass

    # ── Generar código de verificación único ───────────────────────
    verification_code = secrets.token_hex(12).upper()   # 24 chars, e.g. A3F8C1D27E9B4501BCDF0012

    # ── IP del firmante ─────────────────────────────────────────────
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() or \
         str(request.client.host) if request.client else "unknown"

    now = datetime.utcnow()

    # ── Datos del firmante ──────────────────────────────────────────
    signer_name = f"{user.first_name} {user.last_name}".strip() if hasattr(user, 'first_name') else user.username
    signer_position = emp.position if emp else "N/A"
    signer_username = user.username or user.email
    signer_emp_num = (emp.employee_number or "N/A") if emp else "N/A"

    # ── Payload de firma ────────────────────────────────────────────
    sig_payload = (
        f"FES:CON:{doc.id}:{file_hash}:{user.id}:{signer_username}:"
        f"{signer_emp_num}:{now.isoformat()}:{ip}"
    )
    sig_hash = hashlib.sha256(sig_payload.encode()).hexdigest()

    # ── Actualizar documento ────────────────────────────────────────
    doc.fes_signed = True
    doc.fes_signed_at = now
    doc.fes_signer_id = user.id
    doc.fes_signer_name = signer_name
    doc.fes_signer_position = signer_position
    doc.fes_signer_username = signer_username
    doc.fes_employee_number = signer_emp_num
    doc.fes_ip_address = ip
    doc.fes_document_hash = file_hash
    doc.fes_verification_code = verification_code
    doc.signed = True
    doc.signed_at = now
    doc.signature_hash = sig_hash
    doc.locked = True
    db.commit()
    db.refresh(doc)

    return {
        "document": _document_to_dict(doc),
        "fes": {
            "verification_code": verification_code,
            "verify_url": f"https://conniku.com/verify/{verification_code}",
            "signed_at": now.isoformat(),
            "signer_name": signer_name,
            "signer_username": signer_username,
            "employee_number": signer_emp_num,
            "document_hash": file_hash,
            "ip_address": ip,
        },
        "message": "Documento firmado con FES y bloqueado exitosamente (Ley 19.799)",
    }


# ── Verificación pública FES ────────────────────────────────────────
@router.get("/documents/verify/{verification_code}")
def verify_fes_document(
    verification_code: str,
    db: Session = Depends(get_db),
):
    """Endpoint público para verificar autenticidad de un documento FES."""
    doc = db.query(EmployeeDocument).filter(
        EmployeeDocument.fes_verification_code == verification_code
    ).first()
    if not doc:
        raise HTTPException(404, "Código de verificación no encontrado")
    emp = db.query(Employee).filter(Employee.id == doc.employee_id).first()
    return {
        "valid": True,
        "document_name": doc.name,
        "document_type": doc.document_type,
        "employer": "Conniku SpA — RUT 78.395.702-7",
        "worker_name": f"{emp.first_name} {emp.last_name}" if emp else "N/A",
        "worker_rut": emp.rut if emp else "N/A",
        "employee_number": doc.fes_employee_number,
        "signer_name": doc.fes_signer_name,
        "signer_username": doc.fes_signer_username,
        "signer_position": doc.fes_signer_position,
        "signed_at": doc.fes_signed_at.isoformat() if doc.fes_signed_at else None,
        "ip_address": doc.fes_ip_address,
        "document_hash": doc.fes_document_hash,
        "verification_code": verification_code,
        "legal_basis": "Ley 19.799 — Firma Electrónica Simple",
    }


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    if not os.path.exists(doc.file_path):
        raise HTTPException(404, "Archivo no encontrado en servidor")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=doc.file_path,
        filename=doc.name,
        media_type="application/octet-stream",
    )


# ═══════════════════════════════════════════════════════════════════
#  PAYROLL
# ═══════════════════════════════════════════════════════════════════

@router.post("/payroll/calculate")
def calculate_payroll(
    data: PayrollCalculateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    month = data.period_month
    year = data.period_year
    overrides = data.overrides or {}

    # Check for existing payroll in this period that is already approved/paid
    existing = db.query(PayrollRecord).filter(
        PayrollRecord.period_month == month,
        PayrollRecord.period_year == year,
        PayrollRecord.status.in_(["approved", "paid"]),
    ).first()
    if existing:
        raise HTTPException(400, f"Ya existe nomina aprobada/pagada para {month}/{year}. No se puede recalcular.")

    # Delete any existing drafts for this period (recalculate)
    db.query(PayrollRecord).filter(
        PayrollRecord.period_month == month,
        PayrollRecord.period_year == year,
        PayrollRecord.status == "draft",
    ).delete()
    db.flush()

    active_employees = db.query(Employee).filter(
        Employee.status.in_(["active", "on_leave"]),
        Employee.contract_type != "honorarios",
    ).all()

    if not active_employees:
        raise HTTPException(404, "No hay empleados activos para calcular nomina")

    records = []
    for emp in active_employees:
        emp_overrides = overrides.get(emp.id, {})
        calc = calculate_payroll_for_employee(
            emp,
            overtime_hours=emp_overrides.get("overtime_hours", 0),
            bonuses=emp_overrides.get("bonuses", 0),
            voluntary_deductions=emp_overrides.get("voluntary_deductions", 0),
            other_deductions=emp_overrides.get("other_deductions", 0),
        )

        pr = PayrollRecord(
            id=gen_id(),
            employee_id=emp.id,
            period_month=month,
            period_year=year,
            gross_salary=calc["gross_salary"],
            gratificacion=calc["gratificacion"],
            overtime_hours=calc["overtime_hours"],
            overtime_amount=calc["overtime_amount"],
            bonuses=calc["bonuses"],
            colacion=calc["colacion"],
            movilizacion=calc["movilizacion"],
            total_haberes_imponibles=calc["total_haberes_imponibles"],
            total_haberes_no_imponibles=calc["total_haberes_no_imponibles"],
            afp_employee=calc["afp_employee"],
            health_employee=calc["health_employee"],
            afc_employee=calc["afc_employee"],
            tax_amount=calc["tax_amount"],
            voluntary_deductions=calc["voluntary_deductions"],
            other_deductions=calc["other_deductions"],
            total_deductions=calc["total_deductions"],
            net_salary=calc["net_salary"],
            afp_employer=calc["afp_employer"],
            afc_employer=calc["afc_employer"],
            mutual_employer=calc["mutual_employer"],
            total_employer_cost=calc["total_employer_cost"],
            status="draft",
        )
        db.add(pr)
        records.append(pr)

    db.commit()
    for pr in records:
        db.refresh(pr)

    # Enrich with employee details (same as get_payroll)
    emp_map = {e.id: e for e in active_employees}
    enriched = []
    for pr in records:
        d = _payroll_to_dict(pr)
        emp = emp_map.get(pr.employee_id)
        d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "Desconocido"
        d["employee_rut"] = emp.rut if emp else ""
        d["employee_position"] = emp.position if emp else ""
        d["employee_afp"] = emp.afp if emp else ""
        d["employee_health_system"] = emp.health_system if emp else ""
        enriched.append(d)

    total_net = sum(pr.net_salary for pr in records)
    total_employer = sum(pr.total_employer_cost for pr in records)

    return {
        "period": f"{year}-{month:02d}",
        "employee_count": len(records),
        "total_net_salary": round(total_net),
        "total_employer_cost": round(total_employer),
        "records": enriched,
    }


@router.get("/payroll/{year}/{month}")
def get_payroll(
    year: int,
    month: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    records = (
        db.query(PayrollRecord)
        .filter(PayrollRecord.period_year == year, PayrollRecord.period_month == month)
        .all()
    )
    if not records:
        return {"period": f"{year}-{month:02d}", "employee_count": 0,
                "total_net_salary": 0, "total_employer_cost": 0, "records": []}

    # Enrich with employee names and details
    employee_ids = [r.employee_id for r in records]
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    emp_map = {e.id: e for e in employees}

    enriched = []
    for pr in records:
        d = _payroll_to_dict(pr)
        emp = emp_map.get(pr.employee_id)
        d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "Desconocido"
        d["employee_rut"] = emp.rut if emp else ""
        d["employee_position"] = emp.position if emp else ""
        d["employee_afp"] = emp.afp if emp else ""
        d["employee_health_system"] = emp.health_system if emp else ""
        enriched.append(d)

    total_net = sum(r.net_salary for r in records)
    total_employer = sum(r.total_employer_cost for r in records)

    return {
        "period": f"{year}-{month:02d}",
        "employee_count": len(records),
        "total_net_salary": round(total_net),
        "total_employer_cost": round(total_employer),
        "records": enriched,
    }


@router.put("/payroll/{record_id}/approve")
def approve_payroll(
    record_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    pr = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not pr:
        raise HTTPException(404, "Registro de nomina no encontrado")
    if pr.status != "draft":
        raise HTTPException(400, f"Solo se pueden aprobar registros en estado draft (actual: {pr.status})")

    pr.status = "approved"
    db.commit()
    db.refresh(pr)
    return {"payroll": _payroll_to_dict(pr), "message": "Nomina aprobada"}


@router.put("/payroll/{record_id}/mark-paid")
def mark_payroll_paid(
    record_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    pr = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not pr:
        raise HTTPException(404, "Registro de nomina no encontrado")
    if pr.status != "approved":
        raise HTTPException(400, f"Solo se pueden marcar como pagados registros aprobados (actual: {pr.status})")

    pr.status = "paid"
    pr.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(pr)
    return {"payroll": _payroll_to_dict(pr), "message": "Nomina marcada como pagada"}


@router.get("/payroll/{year}/{month}/export-pdf")
def export_payroll_pdf(
    year: int,
    month: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genera PDF de liquidaciones de nómina del mes (Art. 54 Código del Trabajo)."""
    _require_hr_access(user)

    records = (
        db.query(PayrollRecord)
        .filter(PayrollRecord.period_year == year, PayrollRecord.period_month == month)
        .all()
    )
    if not records:
        raise HTTPException(404, "No hay nómina calculada para este período")

    # Obtener datos de empleados
    emp_ids = [r.employee_id for r in records]
    employees = db.query(Employee).filter(Employee.id.in_(emp_ids)).all()
    emp_map = {e.id: e for e in employees}

    months_es = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]

    def fmt(n: float) -> str:
        return f"${int(n):,}".replace(",", ".")

    # Generar HTML de la liquidación
    html_parts = []
    for rec in records:
        emp = emp_map.get(rec.employee_id)
        if not emp:
            continue
        d = _payroll_to_dict(rec)
        html_parts.append(f"""
        <div style="page-break-after:always; font-family:Arial,sans-serif; font-size:12px; padding:20px;">
            <h2 style="text-align:center; margin-bottom:5px;">LIQUIDACIÓN DE REMUNERACIONES</h2>
            <p style="text-align:center; color:#666; margin-top:0;">{months_es[month]} {year}</p>
            <hr/>
            <table style="width:100%; margin-bottom:15px;">
                <tr><td><strong>Empleador:</strong> Conniku SpA</td><td><strong>RUT Empresa:</strong> 78.395.702-7</td></tr>
                <tr><td><strong>Trabajador:</strong> {emp.first_name} {emp.last_name}</td><td><strong>RUT:</strong> {emp.rut}</td></tr>
                <tr><td><strong>Cargo:</strong> {emp.position}</td><td><strong>Fecha ingreso:</strong> {emp.start_date}</td></tr>
            </table>
            <h3 style="background:#2D62C8; color:#fff; padding:5px 10px; font-size:13px;">HABERES</h3>
            <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Sueldo Base</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">{fmt(d.get('gross_salary',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Gratificación Legal</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">{fmt(d.get('gratificacion',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Horas Extra ({d.get('overtime_hours',0)} hrs)</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">{fmt(d.get('overtime_amount',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Bonos</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">{fmt(d.get('bonuses',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Colación</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">{fmt(d.get('colacion',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Movilización</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">{fmt(d.get('movilizacion',0))}</td></tr>
                <tr style="font-weight:bold; background:#f0f0f0;">
                    <td style="padding:6px;">Total Haberes</td>
                    <td style="padding:6px; text-align:right;">{fmt(d.get('total_haberes_imponibles',0) + d.get('total_haberes_no_imponibles',0))}</td></tr>
            </table>
            <h3 style="background:#DC2626; color:#fff; padding:5px 10px; font-size:13px; margin-top:15px;">DESCUENTOS</h3>
            <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">AFP {emp.afp} ({emp.afp_rate or 11.44}%)</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right; color:#DC2626;">-{fmt(d.get('afp_employee',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Salud {emp.health_system} ({emp.health_rate or 7}%)</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right; color:#DC2626;">-{fmt(d.get('health_employee',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Seguro Cesantía AFC</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right; color:#DC2626;">-{fmt(d.get('afc_employee',0))}</td></tr>
                <tr><td style="padding:4px; border-bottom:1px solid #eee;">Impuesto Único 2da Cat.</td>
                    <td style="padding:4px; border-bottom:1px solid #eee; text-align:right; color:#DC2626;">-{fmt(d.get('tax_amount',0))}</td></tr>
                <tr style="font-weight:bold; background:#fef2f2;">
                    <td style="padding:6px;">Total Descuentos</td>
                    <td style="padding:6px; text-align:right; color:#DC2626;">-{fmt(d.get('total_deductions',0))}</td></tr>
            </table>
            <div style="margin-top:20px; padding:12px; background:#f0fdf4; border:2px solid #10B981; text-align:center;">
                <span style="font-size:18px; font-weight:bold; color:#059669;">LÍQUIDO A PAGAR: {fmt(d.get('net_salary',0))}</span>
            </div>
            <p style="margin-top:20px; font-size:10px; color:#999; text-align:center;">
                Documento generado por Conniku — Art. 54 Código del Trabajo
            </p>
        </div>
        """)

    full_html = f"<html><body>{''.join(html_parts)}</body></html>"

    try:
        from xhtml2pdf import pisa

        pdf_buffer = io.BytesIO()
        status = pisa.CreatePDF(io.StringIO(full_html), dest=pdf_buffer)
        if status.err:
            raise ValueError(f"xhtml2pdf error: {status.err}")
    except Exception as exc:
        raise HTTPException(500, f"Error al generar PDF: {exc}") from None

    from fastapi.responses import StreamingResponse

    pdf_buffer.seek(0)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=liquidacion_{year}_{month:02d}.pdf"},
    )


# ─── Generadores de documentos legales chilenos ────────────────


class AnexoContractRequest(BaseModel):
    employee_id: str
    clause_modified: str  # "Tercera sobre Remuneraciones"
    previous_text: str    # texto anterior de la cláusula
    new_text: str         # nuevo texto/condición
    effective_date: str   # fecha de vigencia "2026-05-01"
    reason: str = ""      # motivo del cambio


class PactoHorasExtraRequest(BaseModel):
    employee_id: str
    reason: str           # necesidad temporal que justifica
    max_hours_daily: int = 2  # max 2 por ley
    work_days: str = "Lunes a Viernes"
    start_date: str
    end_date: str         # max 3 meses desde start_date
    compensation_type: str = "pago"  # "pago" o "feriado"


class DescuentoVoluntarioRequest(BaseModel):
    employee_id: str
    concept: str          # concepto/destino del descuento
    amount: int = 0       # monto fijo CLP (0 si es porcentaje)
    percentage: float = 0  # % de remuneración bruta (0 si es monto fijo)
    beneficiary: str      # institución/acreedor
    start_date: str
    end_date: str = ""    # vacío = indefinido
    periodicity: str = "mensual"


def _generate_legal_pdf(html_content: str, filename: str):
    """Helper: genera PDF desde HTML con xhtml2pdf y retorna StreamingResponse."""
    try:
        from xhtml2pdf import pisa

        pdf_buffer = io.BytesIO()
        status = pisa.CreatePDF(io.StringIO(html_content), dest=pdf_buffer)
        if status.err:
            raise ValueError(f"xhtml2pdf error: {status.err}")
    except Exception as exc:
        raise HTTPException(500, f"Error al generar PDF: {exc}") from None

    from fastapi.responses import StreamingResponse

    pdf_buffer.seek(0)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/documents/generate/anexo")
def generate_anexo_contrato(
    body: AnexoContractRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genera Anexo de Contrato de Trabajo (Art. 11 Código del Trabajo)."""
    _require_hr_access(user)
    emp = db.query(Employee).filter(Employee.id == body.employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    today = datetime.utcnow().strftime("%d de %B de %Y")
    html = f"""
    <html><body style="font-family:Arial,sans-serif; font-size:12px; padding:30px; max-width:700px; margin:0 auto;">
    <h2 style="text-align:center;">ANEXO DE CONTRATO DE TRABAJO</h2>
    <p style="text-align:center; color:#666;">(Art. 11 Código del Trabajo)</p>
    <hr/>
    <p>En Santiago, a {today}, entre:</p>
    <p><strong>EMPLEADOR:</strong> Conniku SpA, RUT 78.395.702-7, representada legalmente.</p>
    <p><strong>TRABAJADOR:</strong> {emp.first_name} {emp.last_name}, RUT {emp.rut}, cargo {emp.position}.</p>
    <p>Las partes acuerdan modificar el contrato de trabajo vigente suscrito con fecha {emp.start_date}, en los siguientes términos:</p>
    <h3>CLÁUSULA MODIFICADA</h3>
    <p><strong>Cláusula:</strong> {body.clause_modified}</p>
    <p><strong>Texto anterior:</strong> {body.previous_text}</p>
    <p><strong>Nuevo texto:</strong> {body.new_text}</p>
    <p><strong>Vigencia:</strong> A partir del {body.effective_date}</p>
    {"<p><strong>Motivo:</strong> " + body.reason + "</p>" if body.reason else ""}
    <p style="margin-top:20px;">En todo lo demás, el contrato de trabajo se mantiene en los mismos términos y condiciones pactados originalmente.</p>
    <p>Se firma el presente anexo en dos ejemplares, quedando uno en poder de cada parte.</p>
    <div style="display:flex; justify-content:space-between; margin-top:60px;">
        <div style="text-align:center; width:45%;"><hr/><p><strong>EMPLEADOR</strong></p><p>Conniku SpA</p></div>
        <div style="text-align:center; width:45%;"><hr/><p><strong>TRABAJADOR</strong></p><p>{emp.first_name} {emp.last_name}</p><p>RUT {emp.rut}</p></div>
    </div>
    <p style="margin-top:40px; font-size:10px; color:#999; text-align:center;">Documento generado por Conniku — Art. 11 Código del Trabajo</p>
    </body></html>
    """
    safe_name = f"{emp.first_name}_{emp.last_name}".replace(" ", "_")
    return _generate_legal_pdf(html, f"anexo_contrato_{safe_name}.pdf")


@router.post("/documents/generate/pacto-horas-extra")
def generate_pacto_horas_extra(
    body: PactoHorasExtraRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genera Pacto de Horas Extraordinarias (Art. 32 Código del Trabajo)."""
    _require_hr_access(user)
    emp = db.query(Employee).filter(Employee.id == body.employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    if body.max_hours_daily > 2:
        raise HTTPException(400, "Máximo legal: 2 horas extraordinarias diarias (Art. 32 CT)")

    today = datetime.utcnow().strftime("%d de %B de %Y")
    compensation = "un recargo del 50% sobre el valor de la hora ordinaria" if body.compensation_type == "pago" else "días adicionales de feriado (1,5 días por cada hora extraordinaria)"

    html = f"""
    <html><body style="font-family:Arial,sans-serif; font-size:12px; padding:30px; max-width:700px; margin:0 auto;">
    <h2 style="text-align:center;">PACTO DE HORAS EXTRAORDINARIAS</h2>
    <p style="text-align:center; color:#666;">(Art. 32 Código del Trabajo)</p>
    <hr/>
    <p>En Santiago, a {today}, entre:</p>
    <p><strong>EMPLEADOR:</strong> Conniku SpA, RUT 78.395.702-7.</p>
    <p><strong>TRABAJADOR:</strong> {emp.first_name} {emp.last_name}, RUT {emp.rut}, cargo {emp.position}.</p>
    <h3>ACUERDAN:</h3>
    <p><strong>PRIMERO:</strong> Que por necesidades temporales de la empresa, específicamente: {body.reason}, se requiere que el trabajador preste servicios en jornada extraordinaria.</p>
    <p><strong>SEGUNDO:</strong> El trabajador se compromete a trabajar un máximo de {body.max_hours_daily} hora(s) extraordinaria(s) diaria(s), los días {body.work_days}.</p>
    <p><strong>TERCERO:</strong> El presente pacto tendrá vigencia desde el {body.start_date} hasta el {body.end_date}.</p>
    <p><strong>CUARTO:</strong> Las horas extraordinarias serán compensadas con {compensation}, conforme al Art. 32 del Código del Trabajo.</p>
    <p><strong>QUINTO:</strong> El presente pacto se celebra de manera voluntaria por ambas partes y podrá ser revocado por cualquiera de ellas con aviso previo.</p>
    <div style="display:flex; justify-content:space-between; margin-top:60px;">
        <div style="text-align:center; width:45%;"><hr/><p><strong>EMPLEADOR</strong></p><p>Conniku SpA</p></div>
        <div style="text-align:center; width:45%;"><hr/><p><strong>TRABAJADOR</strong></p><p>{emp.first_name} {emp.last_name}</p><p>RUT {emp.rut}</p></div>
    </div>
    <p style="margin-top:40px; font-size:10px; color:#999; text-align:center;">Documento generado por Conniku — Art. 32 Código del Trabajo</p>
    </body></html>
    """
    safe_name = f"{emp.first_name}_{emp.last_name}".replace(" ", "_")
    return _generate_legal_pdf(html, f"pacto_horas_extra_{safe_name}.pdf")


@router.post("/documents/generate/descuento-voluntario")
def generate_descuento_voluntario(
    body: DescuentoVoluntarioRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genera Autorización de Descuento Voluntario (Art. 58 Código del Trabajo)."""
    _require_hr_access(user)
    emp = db.query(Employee).filter(Employee.id == body.employee_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    if body.percentage > 15:
        raise HTTPException(400, "Máximo legal: 15% de remuneración bruta por descuento individual (Art. 58 CT)")

    today = datetime.utcnow().strftime("%d de %B de %Y")
    amount_desc = f"${body.amount:,} CLP mensuales".replace(",", ".") if body.amount else f"{body.percentage}% de la remuneración bruta total"
    end_desc = f"hasta el {body.end_date}" if body.end_date else "de forma indefinida, hasta revocación por escrito del trabajador"

    html = f"""
    <html><body style="font-family:Arial,sans-serif; font-size:12px; padding:30px; max-width:700px; margin:0 auto;">
    <h2 style="text-align:center;">AUTORIZACIÓN DE DESCUENTO VOLUNTARIO</h2>
    <p style="text-align:center; color:#666;">(Art. 58 Código del Trabajo)</p>
    <hr/>
    <p>En Santiago, a {today}, el trabajador:</p>
    <p><strong>{emp.first_name} {emp.last_name}</strong>, RUT {emp.rut}, cargo {emp.position}, de la empresa Conniku SpA, RUT 78.395.702-7,</p>
    <p>DECLARA y AUTORIZA lo siguiente:</p>
    <h3>PRIMERO: VOLUNTARIEDAD</h3>
    <p>Que de manera libre y voluntaria, sin presión alguna del empleador, autoriza el descuento descrito a continuación.</p>
    <h3>SEGUNDO: CONCEPTO</h3>
    <p>El descuento corresponde a: <strong>{body.concept}</strong></p>
    <h3>TERCERO: MONTO</h3>
    <p>El monto del descuento será de <strong>{amount_desc}</strong>.</p>
    <h3>CUARTO: BENEFICIARIO</h3>
    <p>El descuento será depositado/pagado a: <strong>{body.beneficiary}</strong></p>
    <h3>QUINTO: VIGENCIA</h3>
    <p>Este descuento se aplicará con periodicidad {body.periodicity}, comenzando el {body.start_date}, {end_desc}.</p>
    <h3>SEXTO: LÍMITE LEGAL</h3>
    <p>El trabajador declara conocer que, conforme al Art. 58 del Código del Trabajo, los descuentos voluntarios no pueden exceder el 15% de la remuneración bruta total por concepto individual, ni el 45% en su totalidad (sumando descuentos legales y voluntarios).</p>
    <h3>SÉPTIMO: REVOCACIÓN</h3>
    <p>El trabajador podrá revocar esta autorización en cualquier momento mediante comunicación escrita al empleador.</p>
    <div style="display:flex; justify-content:space-between; margin-top:60px;">
        <div style="text-align:center; width:45%;"><hr/><p><strong>TRABAJADOR</strong></p><p>{emp.first_name} {emp.last_name}</p><p>RUT {emp.rut}</p></div>
        <div style="text-align:center; width:45%;"><hr/><p><strong>EMPLEADOR</strong></p><p>Conniku SpA</p></div>
    </div>
    <p style="margin-top:40px; font-size:10px; color:#999; text-align:center;">Documento generado por Conniku — Art. 58 Código del Trabajo</p>
    </body></html>
    """
    safe_name = f"{emp.first_name}_{emp.last_name}".replace(" ", "_")
    return _generate_legal_pdf(html, f"descuento_voluntario_{safe_name}.pdf")


@router.get("/payroll/previred/{year}/{month}")
def get_previred_data(
    year: int,
    month: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Consolidation data for Previred filing.
    Returns per-employee breakdown of AFP, Health, AFC contributions.
    """
    _require_hr_access(user)

    records = (
        db.query(PayrollRecord)
        .filter(PayrollRecord.period_year == year, PayrollRecord.period_month == month)
        .all()
    )
    if not records:
        raise HTTPException(404, f"No hay registros de nomina para {month}/{year}")

    employee_ids = [r.employee_id for r in records]
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    emp_map = {e.id: e for e in employees}

    previred_lines = []
    totals = {
        "afp_employee": 0, "afp_employer": 0,
        "health_employee": 0,
        "afc_employee": 0, "afc_employer": 0,
        "mutual": 0, "tax": 0,
    }

    for pr in records:
        emp = emp_map.get(pr.employee_id)
        if not emp:
            continue

        line = {
            "rut": emp.rut,
            "nombre": f"{emp.first_name} {emp.last_name}",
            "afp": emp.afp,
            "health_system": emp.health_system,
            "isapre_name": emp.isapre_name,
            "contract_type": emp.contract_type,
            "total_imponible": pr.total_haberes_imponibles,
            "afp_employee": pr.afp_employee,
            "afp_employer_sis": pr.afp_employer,
            "health_employee": pr.health_employee,
            "afc_employee": pr.afc_employee,
            "afc_employer": pr.afc_employer,
            "mutual_employer": pr.mutual_employer,
            "tax_amount": pr.tax_amount,
        }
        previred_lines.append(line)

        totals["afp_employee"] += pr.afp_employee
        totals["afp_employer"] += pr.afp_employer
        totals["health_employee"] += pr.health_employee
        totals["afc_employee"] += pr.afc_employee
        totals["afc_employer"] += pr.afc_employer
        totals["mutual"] += pr.mutual_employer
        totals["tax"] += pr.tax_amount

    # Round totals
    for k in totals:
        totals[k] = round(totals[k])

    return {
        "period": f"{year}-{month:02d}",
        "employee_count": len(previred_lines),
        "lines": previred_lines,
        "totals": totals,
    }


# ═══════════════════════════════════════════════════════════════════
#  OPERATIONAL EXPENSES
# ═══════════════════════════════════════════════════════════════════

VALID_DOC_TYPES_EXPENSE = {"factura", "boleta", "boleta_honorarios", "recibo"}


@router.post("/expenses")
def create_expense(
    data: ExpenseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    if data.document_type not in VALID_DOC_TYPES_EXPENSE:
        data.document_type = "recibo"  # fallback instead of 400

    expense = OperationalExpense(
        id=gen_id(),
        category=data.category,
        subcategory=data.subcategory,
        description=data.description,
        amount_clp=data.amount_clp,
        amount_usd=data.amount_usd,
        exchange_rate=data.exchange_rate,
        currency=data.currency,
        amount_original=data.amount_original,
        provider_name=data.provider_name,
        provider_rut=data.provider_rut,
        document_number=data.document_number,
        document_type=data.document_type,
        tax_deductible=data.tax_deductible,
        iva_amount=data.iva_amount,
        iva_recuperable=data.iva_recuperable,
        retencion=data.retencion,
        deductible_percent=data.deductible_percent,
        date=data.date,
        tx_type=data.tx_type,
        payment_method=data.payment_method,
        notes=data.notes,
        attachment_name=data.attachment_name,
        period_month=data.period_month,
        period_year=data.period_year,
        recurring=data.recurring,
        recurring_frequency=data.recurring_frequency,
        file_path=data.file_path,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"expense": _expense_to_dict(expense)}


@router.get("/expenses")
def list_expenses(
    period_month: Optional[int] = None,
    period_year: Optional[int] = None,
    category: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    query = db.query(OperationalExpense)
    if period_month:
        query = query.filter(OperationalExpense.period_month == period_month)
    if period_year:
        query = query.filter(OperationalExpense.period_year == period_year)
    if category:
        query = query.filter(OperationalExpense.category == category)

    total = query.count()
    expenses = query.order_by(desc(OperationalExpense.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "expenses": [_expense_to_dict(e) for e in expenses],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    expense = db.query(OperationalExpense).filter(OperationalExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Gasto no encontrado")

    updates = data.dict(exclude_unset=True)

    # Silently map unknown doc types to 'recibo' instead of rejecting
    if "document_type" in updates and updates["document_type"] not in VALID_DOC_TYPES_EXPENSE:
        updates["document_type"] = "recibo"

    for key, value in updates.items():
        setattr(expense, key, value)
    expense.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(expense)
    return {"expense": _expense_to_dict(expense)}


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    expense = db.query(OperationalExpense).filter(OperationalExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Gasto no encontrado")

    db.delete(expense)
    db.commit()
    return {"message": "Gasto eliminado", "expense_id": expense_id}


@router.get("/expenses/summary/{year}")
def annual_expense_summary(
    year: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Annual expense summary for F129 tax form."""
    _require_hr_access(user)

    expenses = db.query(OperationalExpense).filter(OperationalExpense.period_year == year).all()

    by_category = {}
    by_month = {m: 0.0 for m in range(1, 13)}
    total_clp = 0.0
    total_iva = 0.0
    total_deductible = 0.0

    for exp in expenses:
        cat = exp.category
        if cat not in by_category:
            by_category[cat] = {"total": 0.0, "deductible": 0.0, "iva": 0.0, "count": 0}
        by_category[cat]["total"] += exp.amount_clp
        by_category[cat]["count"] += 1
        if exp.tax_deductible:
            by_category[cat]["deductible"] += exp.amount_clp
            total_deductible += exp.amount_clp
        if exp.iva_amount:
            by_category[cat]["iva"] += exp.iva_amount
            total_iva += exp.iva_amount

        by_month[exp.period_month] += exp.amount_clp
        total_clp += exp.amount_clp

    # Round all values
    for cat in by_category:
        by_category[cat]["total"] = round(by_category[cat]["total"])
        by_category[cat]["deductible"] = round(by_category[cat]["deductible"])
        by_category[cat]["iva"] = round(by_category[cat]["iva"])
    for m in by_month:
        by_month[m] = round(by_month[m])

    return {
        "year": year,
        "total_expenses_clp": round(total_clp),
        "total_deductible_clp": round(total_deductible),
        "total_iva_clp": round(total_iva),
        "expense_count": len(expenses),
        "by_category": by_category,
        "by_month": by_month,
    }


@router.get("/expenses/monthly/{year}/{month}")
def monthly_expense_breakdown(
    year: int,
    month: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    expenses = (
        db.query(OperationalExpense)
        .filter(OperationalExpense.period_year == year, OperationalExpense.period_month == month)
        .order_by(desc(OperationalExpense.created_at))
        .all()
    )

    by_category = {}
    total_clp = 0.0
    total_iva = 0.0

    for exp in expenses:
        cat = exp.category
        if cat not in by_category:
            by_category[cat] = {"total": 0.0, "iva": 0.0, "count": 0, "items": []}
        by_category[cat]["total"] += exp.amount_clp
        by_category[cat]["count"] += 1
        by_category[cat]["items"].append(_expense_to_dict(exp))
        if exp.iva_amount:
            by_category[cat]["iva"] += exp.iva_amount
            total_iva += exp.iva_amount
        total_clp += exp.amount_clp

    for cat in by_category:
        by_category[cat]["total"] = round(by_category[cat]["total"])
        by_category[cat]["iva"] = round(by_category[cat]["iva"])

    return {
        "period": f"{year}-{month:02d}",
        "total_clp": round(total_clp),
        "total_iva": round(total_iva),
        "expense_count": len(expenses),
        "by_category": by_category,
    }


# ═══════════════════════════════════════════════════════════════════
#  REPORTS
# ═══════════════════════════════════════════════════════════════════

@router.get("/reports/cost-summary/{year}/{month}")
def cost_summary(
    year: int,
    month: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Total company labor cost for a given month."""
    _require_hr_access(user)

    payroll_records = (
        db.query(PayrollRecord)
        .filter(PayrollRecord.period_year == year, PayrollRecord.period_month == month)
        .all()
    )

    expenses = (
        db.query(OperationalExpense)
        .filter(OperationalExpense.period_year == year, OperationalExpense.period_month == month)
        .all()
    )

    # Payroll totals
    total_gross = sum(r.gross_salary for r in payroll_records)
    total_gratificacion = sum(r.gratificacion for r in payroll_records)
    total_bonuses = sum(r.bonuses for r in payroll_records)
    total_overtime = sum(r.overtime_amount for r in payroll_records)
    total_colacion = sum(r.colacion for r in payroll_records)
    total_movilizacion = sum(r.movilizacion for r in payroll_records)
    total_net = sum(r.net_salary for r in payroll_records)
    total_afp_employee = sum(r.afp_employee for r in payroll_records)
    total_health_employee = sum(r.health_employee for r in payroll_records)
    total_afc_employee = sum(r.afc_employee for r in payroll_records)
    total_tax = sum(r.tax_amount for r in payroll_records)
    total_afp_employer = sum(r.afp_employer for r in payroll_records)
    total_afc_employer = sum(r.afc_employer for r in payroll_records)
    total_mutual = sum(r.mutual_employer for r in payroll_records)
    total_employer_cost = sum(r.total_employer_cost for r in payroll_records)

    # Expense totals
    total_expenses = sum(e.amount_clp for e in expenses)

    # Grand total company cost
    total_company_cost = total_employer_cost + total_expenses

    return {
        "period": f"{year}-{month:02d}",
        "employee_count": len(payroll_records),
        "payroll": {
            "total_gross": round(total_gross),
            "total_gratificacion": round(total_gratificacion),
            "total_bonuses": round(total_bonuses),
            "total_overtime": round(total_overtime),
            "total_colacion": round(total_colacion),
            "total_movilizacion": round(total_movilizacion),
            "total_net_salary": round(total_net),
            "deductions": {
                "afp_employee": round(total_afp_employee),
                "health_employee": round(total_health_employee),
                "afc_employee": round(total_afc_employee),
                "tax": round(total_tax),
            },
            "employer_contributions": {
                "afp_sis": round(total_afp_employer),
                "afc_employer": round(total_afc_employer),
                "mutual": round(total_mutual),
            },
            "total_employer_cost": round(total_employer_cost),
        },
        "operational_expenses": {
            "total": round(total_expenses),
            "count": len(expenses),
        },
        "total_company_cost": round(total_company_cost),
    }


@router.get("/reports/tax-summary/{year}")
def tax_summary(
    year: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Annual tax summary for DJ/F22 filing."""
    _require_hr_access(user)

    # Payroll by month
    payroll_records = (
        db.query(PayrollRecord)
        .filter(PayrollRecord.period_year == year)
        .all()
    )

    # Expenses
    expenses = (
        db.query(OperationalExpense)
        .filter(OperationalExpense.period_year == year)
        .all()
    )

    # Active employees for the year
    employee_count = (
        db.query(Employee)
        .filter(Employee.status.in_(["active", "on_leave", "terminated"]))
        .filter(Employee.hire_date <= f"{year}-12-31")
        .filter(
            (Employee.end_date is None) | (Employee.end_date >= f"{year}-01-01")
        )
        .count()
    )

    # Monthly breakdown
    monthly = {}
    for m in range(1, 13):
        monthly[m] = {
            "total_imponible": 0, "total_net": 0, "total_employer_cost": 0,
            "afp_employee": 0, "afp_employer": 0,
            "health": 0, "afc_employee": 0, "afc_employer": 0,
            "mutual": 0, "tax": 0,
        }

    for pr in payroll_records:
        m = pr.period_month
        if m not in monthly:
            continue
        monthly[m]["total_imponible"] += pr.total_haberes_imponibles
        monthly[m]["total_net"] += pr.net_salary
        monthly[m]["total_employer_cost"] += pr.total_employer_cost
        monthly[m]["afp_employee"] += pr.afp_employee
        monthly[m]["afp_employer"] += pr.afp_employer
        monthly[m]["health"] += pr.health_employee
        monthly[m]["afc_employee"] += pr.afc_employee
        monthly[m]["afc_employer"] += pr.afc_employer
        monthly[m]["mutual"] += pr.mutual_employer
        monthly[m]["tax"] += pr.tax_amount

    # Round monthly values
    for m in monthly:
        for k in monthly[m]:
            monthly[m][k] = round(monthly[m][k])

    # Annual totals
    annual_imponible = sum(monthly[m]["total_imponible"] for m in monthly)
    annual_net = sum(monthly[m]["total_net"] for m in monthly)
    annual_employer_cost = sum(monthly[m]["total_employer_cost"] for m in monthly)
    annual_afp = sum(monthly[m]["afp_employee"] + monthly[m]["afp_employer"] for m in monthly)
    annual_health = sum(monthly[m]["health"] for m in monthly)
    annual_afc = sum(monthly[m]["afc_employee"] + monthly[m]["afc_employer"] for m in monthly)
    annual_mutual = sum(monthly[m]["mutual"] for m in monthly)
    annual_tax = sum(monthly[m]["tax"] for m in monthly)

    # Expenses
    total_expenses = sum(e.amount_clp for e in expenses)
    deductible_expenses = sum(e.amount_clp for e in expenses if e.tax_deductible)
    total_iva_credito = sum((e.iva_amount or 0) for e in expenses)

    return {
        "year": year,
        "employee_count": employee_count,
        "payroll_summary": {
            "annual_imponible": round(annual_imponible),
            "annual_net_salary": round(annual_net),
            "annual_employer_cost": round(annual_employer_cost),
            "annual_afp_total": round(annual_afp),
            "annual_health_total": round(annual_health),
            "annual_afc_total": round(annual_afc),
            "annual_mutual_total": round(annual_mutual),
            "annual_income_tax_withheld": round(annual_tax),
        },
        "expense_summary": {
            "total_expenses": round(total_expenses),
            "deductible_expenses": round(deductible_expenses),
            "iva_credito_fiscal": round(total_iva_credito),
        },
        "total_company_cost": round(annual_employer_cost + total_expenses),
        "monthly_breakdown": monthly,
    }


# ═══════════════════════════════════════════════════════════════════
#  ATTENDANCE & WARNING SYSTEM
#  Art. 22, 30-34 Código del Trabajo — Control de Jornada
# ═══════════════════════════════════════════════════════════════════

WORK_START_TIME = "09:00"       # HH:MM — hora de inicio de jornada
LATE_THRESHOLD_MIN = 10         # minutos de tolerancia antes de marcar como tarde

WARNING_PROGRESSION = ["coaching", "w1_verbal", "w2_written", "termination"]
WARNING_LABELS = {
    "coaching":    "Coaching",
    "w1_verbal":   "Warning Verbal (W1)",
    "w2_written":  "Warning Escrito (W2)",
    "termination": "Aviso de Terminación",
}

# ─── Helpers internos ───────────────────────────────────────────────

def _minutes_from_hhmm(t: str) -> int:
    """Convierte 'HH:MM' a minutos desde medianoche."""
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def _is_late(entry_time: str) -> tuple[bool, int]:
    """Retorna (es_tarde, minutos_de_atraso) dado el entry_time HH:MM."""
    threshold = _minutes_from_hhmm(WORK_START_TIME) + LATE_THRESHOLD_MIN
    entry_min = _minutes_from_hhmm(entry_time)
    late_min = max(0, entry_min - _minutes_from_hhmm(WORK_START_TIME))
    return entry_min > threshold, late_min


def _next_warning_level(employee_id: str, db: Session) -> str:
    count = db.query(EmployeeWarning).filter(
        EmployeeWarning.employee_id == employee_id
    ).count()
    if count >= len(WARNING_PROGRESSION):
        return "termination"
    return WARNING_PROGRESSION[count]


def _count_incidents(employee_id: str, incident_type: str, days: int, db: Session) -> int:
    since = datetime.utcnow() - timedelta(days=days)
    if incident_type == "missed_clockin":
        return db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.status == "ausente",
            AttendanceRecord.created_at >= since,
        ).count()
    elif incident_type == "tardiness":
        return db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.is_late,
            AttendanceRecord.created_at >= since,
        ).count()
    return 0


def _check_and_issue_warning(employee_id: str, incident_type: str, db: Session):
    """Revisa umbrales y emite amonestación automática si corresponde."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return
    # Art. 22 exento → no aplica amonestación por tardanza
    if getattr(emp, "is_art22_exempt", False) and incident_type == "tardiness":
        return

    count_30 = _count_incidents(employee_id, incident_type, 30, db)
    count_60 = _count_incidents(employee_id, incident_type, 60, db)

    triggered = False
    period_days = 30
    incident_count = count_30

    if count_30 >= 6:
        triggered = True
        period_days = 30
        incident_count = count_30
    elif count_60 >= 12:
        triggered = True
        period_days = 60
        incident_count = count_60

    if not triggered:
        return

    # Evitar duplicar la misma amonestación para el mismo conteo
    last = db.query(EmployeeWarning).filter(
        EmployeeWarning.employee_id == employee_id,
        EmployeeWarning.incident_type == incident_type,
    ).order_by(EmployeeWarning.issued_at.desc()).first()

    if last and last.incident_count == incident_count and last.period_days == period_days:
        return

    warning_type = _next_warning_level(employee_id, db)
    warning = EmployeeWarning(
        employee_id=employee_id,
        warning_type=warning_type,
        incident_type=incident_type,
        incident_count=incident_count,
        period_days=period_days,
    )
    db.add(warning)
    db.commit()
    _send_warning_emails(emp, warning_type, incident_type, incident_count, period_days)


def _send_warning_emails(emp, warning_type: str, incident_type: str, count: int, period: int):
    try:
        from notifications import CEO_EMAIL, _email_template, _send_email_async
    except Exception:
        return

    incident_label = (
        "ausencias sin registrar asistencia" if incident_type == "missed_clockin"
        else "llegadas tarde"
    )
    warning_label = WARNING_LABELS.get(warning_type, warning_type)

    if warning_type == "coaching":
        subject_emp = "RRHH Conniku — Coaching: Registro de Asistencia"
        body_emp = f"""<p>Estimado/a <strong>{emp.first_name} {emp.last_name}</strong>,</p>
<p>Este es un mensaje de <strong>Coaching</strong> de parte de RRHH Conniku.</p>
<p>Hemos registrado <strong>{count} {incident_label}</strong> en los últimos <strong>{period} días</strong>,
lo que supera el límite permitido según tu contrato de trabajo.</p>
<p>El registro de asistencia (Clock In / Clock Out) es <strong>obligatorio</strong>.
El incumplimiento reiterado puede derivar en medidas disciplinarias:</p>
<ul>
  <li>✅ <strong>Coaching</strong> — etapa actual</li>
  <li>⚠️ Warning Verbal (W1)</li>
  <li>🔴 Warning Escrito (W2)</li>
  <li>❌ Terminación de Contrato</li>
</ul>
<p>Si tienes dificultades con el sistema, comunícalo a RRHH de inmediato.</p>
<p>Atentamente,<br>Equipo RRHH — Conniku</p>"""

    elif warning_type == "w1_verbal":
        subject_emp = "RRHH Conniku — Warning Verbal (W1): Registro de Asistencia"
        body_emp = f"""<p>Estimado/a <strong>{emp.first_name} {emp.last_name}</strong>,</p>
<p>Esta comunicación corresponde a un <strong>Warning Verbal (W1)</strong>.</p>
<p>A pesar del Coaching previo, se han registrado <strong>{count} {incident_label}</strong>
en los últimos <strong>{period} días</strong>.</p>
<p>De continuar este comportamiento, recibirás un <strong>Warning Escrito (W2)</strong> y,
de persistir, se evaluará la <strong>terminación de tu contrato</strong>.</p>
<p>Atentamente,<br>Equipo RRHH — Conniku</p>"""

    elif warning_type == "w2_written":
        subject_emp = "RRHH Conniku — Warning Escrito (W2): Registro de Asistencia"
        body_emp = f"""<p>Estimado/a <strong>{emp.first_name} {emp.last_name}</strong>,</p>
<p>Esta es una <strong>amonestación formal escrita (W2)</strong>, registrada en tu carpeta de personal.</p>
<p>Se han registrado <strong>{count} {incident_label}</strong> en los últimos <strong>{period} días</strong>,
pese a los avisos previos (Coaching y Warning Verbal).</p>
<p>⚠️ <strong>AVISO FINAL:</strong> De continuar con este comportamiento, la empresa procederá a la
<strong>terminación de tu contrato</strong> conforme al Art. 160 N°7 del Código del Trabajo
(incumplimiento grave de las obligaciones laborales).</p>
<p>Atentamente,<br>Equipo RRHH — Conniku</p>"""

    else:  # termination
        subject_emp = "RRHH Conniku — Aviso Formal por Incumplimiento Reiterado"
        body_emp = f"""<p>Estimado/a <strong>{emp.first_name} {emp.last_name}</strong>,</p>
<p>Pese a los avisos previos (Coaching, W1, W2), se han registrado
<strong>{count} {incident_label}</strong> en los últimos <strong>{period} días</strong>.</p>
<p>🔴 La empresa está evaluando la <strong>terminación de contrato</strong> conforme al
Art. 160 N°7 del Código del Trabajo. Se le contactará formalmente para el proceso correspondiente.</p>
<p>Atentamente,<br>Equipo RRHH — Conniku</p>"""

    subject_ceo = f"[RRHH] {warning_label} — {emp.first_name} {emp.last_name} ({emp.rut})"
    body_ceo = f"""<p>Cristian,</p>
<p>Se emitió automáticamente un <strong>{warning_label}</strong>:</p>
<ul>
  <li><strong>Trabajador:</strong> {emp.first_name} {emp.last_name} — {emp.rut}</li>
  <li><strong>Cargo:</strong> {emp.position}</li>
  <li><strong>Motivo:</strong> {count} {incident_label} en {period} días</li>
  <li><strong>Nivel:</strong> {warning_label}</li>
</ul>
<p>Puedes revisar el historial en el panel RRHH → pestaña Asistencia.</p>"""

    emp_html = _email_template(f"RRHH — {warning_label}", body_emp)
    ceo_html = _email_template(subject_ceo, body_ceo, sender="ceo")
    _send_email_async(emp.email, subject_emp, emp_html, from_account="noreply")
    _send_email_async(CEO_EMAIL, subject_ceo, ceo_html, from_account="ceo")


# ─── Pydantic schemas ────────────────────────────────────────────────

class AttendanceAdminCreate(BaseModel):
    employee_id: str
    date: str                               # YYYY-MM-DD
    entry_time: Optional[str] = None        # HH:MM
    exit_time: Optional[str] = None         # HH:MM
    status: str = "presente"
    notes: str = ""


class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    days: int
    reason: str = ""


class LeaveReviewBody(BaseModel):
    reject_reason: Optional[str] = None


# ─── Attendance endpoints ────────────────────────────────────────────

@router.post("/attendance/checkin")
def attendance_checkin(
    employee_id: Optional[str] = None,
    notes: str = "",
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Clock In — puede ejecutarlo el empleado (sin employee_id) o el admin (con employee_id)."""
    today = date.today().isoformat()

    if employee_id:
        # Admin registra por otro empleado
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        recorded_by = "admin"
    else:
        # Empleado registra su propio Clock In
        emp = db.query(Employee).filter(Employee.user_id == user.id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="No tienes un perfil de empleado vinculado")
        employee_id = emp.id
        recorded_by = "employee"

    # Verificar si ya hay un registro de hoy
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee_id,
        AttendanceRecord.date == today,
    ).first()

    if existing and existing.entry_time:
        raise HTTPException(status_code=400, detail=f"Ya registraste entrada hoy a las {existing.entry_time}")

    now_time = datetime.now().strftime("%H:%M")
    late, late_min = _is_late(now_time)

    if existing:
        existing.entry_time = now_time
        existing.status = "presente"
        existing.is_late = late
        existing.late_minutes = late_min
        existing.recorded_by = recorded_by
        existing.notes = notes
        record = existing
    else:
        record = AttendanceRecord(
            employee_id=employee_id,
            date=today,
            entry_time=now_time,
            status="presente",
            is_late=late,
            late_minutes=late_min,
            recorded_by=recorded_by,
            notes=notes,
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    # Revisar amonestación por tardanza
    if late:
        _check_and_issue_warning(employee_id, "tardiness", db)

    return {
        "ok": True,
        "entry_time": now_time,
        "is_late": late,
        "late_minutes": late_min,
        "employee_name": f"{emp.first_name} {emp.last_name}",
    }


@router.post("/attendance/checkout")
def attendance_checkout(
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Clock Out — empleado o admin."""
    today = date.today().isoformat()

    if employee_id:
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
    else:
        emp = db.query(Employee).filter(Employee.user_id == user.id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="No tienes un perfil de empleado vinculado")
        employee_id = emp.id

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee_id,
        AttendanceRecord.date == today,
    ).first()

    if not record or not record.entry_time:
        raise HTTPException(status_code=400, detail="No hay Clock In registrado para hoy")
    if record.exit_time:
        raise HTTPException(status_code=400, detail=f"Ya registraste salida hoy a las {record.exit_time}")

    now_time = datetime.now().strftime("%H:%M")
    entry_min = _minutes_from_hhmm(record.entry_time)
    exit_min = _minutes_from_hhmm(now_time)
    total_hours = round(max(0, exit_min - entry_min) / 60, 2)

    # Horas extra: sobre 9h (8h trabajo + 1h colación, Art. 34 CT)
    overtime = round(max(0, total_hours - 9), 2)

    record.exit_time = now_time
    record.total_hours = total_hours
    record.overtime_hours = overtime
    db.commit()

    return {
        "ok": True,
        "exit_time": now_time,
        "total_hours": total_hours,
        "overtime_hours": overtime,
        "employee_name": f"{emp.first_name} {emp.last_name}",
    }


@router.get("/attendance/today")
def get_today_attendance(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Estado de asistencia de hoy para el empleado logueado."""
    today = date.today().isoformat()
    emp = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not emp:
        return {"has_employee": False}

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == today,
    ).first()

    return {
        "has_employee": True,
        "employee_id": emp.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "is_art22_exempt": emp.is_art22_exempt,
        "record": _attendance_to_dict(record) if record else None,
    }


@router.get("/attendance/monthly/{year}/{month}")
def get_monthly_attendance(
    year: int,
    month: int,
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Obtiene registros de asistencia de un mes. Admin: todos los empleados o uno específico."""
    month_str = f"{year}-{str(month).zfill(2)}"

    query = db.query(AttendanceRecord).filter(
        AttendanceRecord.date.startswith(month_str)
    )
    if employee_id:
        query = query.filter(AttendanceRecord.employee_id == employee_id)

    records = query.order_by(AttendanceRecord.date, AttendanceRecord.employee_id).all()
    return [_attendance_to_dict(r) for r in records]


@router.post("/attendance/record")
def admin_record_attendance(
    data: AttendanceAdminCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Admin crea o actualiza manualmente un registro de asistencia."""
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == data.employee_id,
        AttendanceRecord.date == data.date,
    ).first()

    late = False
    late_min = 0
    total_hours = 0.0
    overtime = 0.0

    if data.entry_time:
        late, late_min = _is_late(data.entry_time)
    if data.entry_time and data.exit_time:
        entry_m = _minutes_from_hhmm(data.entry_time)
        exit_m = _minutes_from_hhmm(data.exit_time)
        total_hours = round(max(0, exit_m - entry_m) / 60, 2)
        overtime = round(max(0, total_hours - 9), 2)

    if existing:
        existing.entry_time = data.entry_time
        existing.exit_time = data.exit_time
        existing.status = data.status
        existing.is_late = late
        existing.late_minutes = late_min
        existing.total_hours = total_hours
        existing.overtime_hours = overtime
        existing.recorded_by = "admin"
        existing.notes = data.notes
        record = existing
    else:
        record = AttendanceRecord(
            employee_id=data.employee_id,
            date=data.date,
            entry_time=data.entry_time,
            exit_time=data.exit_time,
            status=data.status,
            is_late=late,
            late_minutes=late_min,
            total_hours=total_hours,
            overtime_hours=overtime,
            recorded_by="admin",
            notes=data.notes,
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    # Si el admin marca como ausente, revisar amonestación
    if data.status == "ausente":
        _check_and_issue_warning(data.employee_id, "missed_clockin", db)

    return _attendance_to_dict(record)


@router.get("/warnings/{employee_id}")
def get_employee_warnings(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    warnings = db.query(EmployeeWarning).filter(
        EmployeeWarning.employee_id == employee_id
    ).order_by(EmployeeWarning.issued_at.desc()).all()
    return [_warning_to_dict(w) for w in warnings]


# ─── Leave endpoints ──────────────────────────────────────────────────

@router.get("/leave/requests")
def get_all_leave_requests(
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(LeaveRequest)
    if status:
        query = query.filter(LeaveRequest.status == status)
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    requests = query.order_by(LeaveRequest.created_at.desc()).all()

    result = []
    for r in requests:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        d = _leave_to_dict(r)
        d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "—"
        result.append(d)
    return result


@router.get("/leave/balance/{employee_id}")
def get_leave_balance(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Calcular días con derecho (Art. 67 CT)
    try:
        hire = date.fromisoformat(emp.hire_date)
        years_service = (date.today() - hire).days / 365.25
    except Exception:
        years_service = 0

    eligible = years_service >= 1
    base_days = 15  # Art. 67: 15 días hábiles base
    # Art. 68: días progresivos — 1 día adicional por cada 3 años de servicio sobre 10 años
    progressive = max(0, int((years_service - 10) / 3)) if years_service > 10 else 0
    entitled = base_days + progressive if eligible else 0

    # Días usados este año (solicitudes aprobadas tipo vacaciones)
    current_year = date.today().year
    used_result = db.query(func.sum(LeaveRequest.days)).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.leave_type == "vacaciones",
        LeaveRequest.status == "aprobada",
        LeaveRequest.start_date >= f"{current_year}-01-01",
        LeaveRequest.start_date <= f"{current_year}-12-31",
    ).scalar() or 0

    available = max(0, entitled - int(used_result))
    # Art. 69: acumulación máx. 2 períodos
    max_accumulation = entitled * 2

    return {
        "employee_id": employee_id,
        "eligible": eligible,
        "years_service": round(years_service, 1),
        "entitled_days": entitled,
        "used_days": int(used_result),
        "available_days": available,
        "max_accumulation": max_accumulation,
        "progressive_days": progressive,
    }


@router.post("/leave/request")
def create_leave_request(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Verificar que no haya solicitud pendiente superpuesta
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == data.employee_id,
        LeaveRequest.status == "pendiente",
        LeaveRequest.start_date <= data.end_date,
        LeaveRequest.end_date >= data.start_date,
    ).first()
    if overlap:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud pendiente en ese período")

    req = LeaveRequest(
        employee_id=data.employee_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        days=data.days,
        reason=data.reason,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    d = _leave_to_dict(req)
    d["employee_name"] = f"{emp.first_name} {emp.last_name}"
    return d


@router.put("/leave/requests/{request_id}/approve")
def approve_leave_request(
    request_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.status != "pendiente":
        raise HTTPException(status_code=400, detail=f"La solicitud ya está {req.status}")

    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()

    req.status = "aprobada"
    req.reviewed_by = f"{user.first_name} {user.last_name}"
    req.reviewed_at = date.today().isoformat()
    db.commit()

    # Email al empleado
    _send_leave_email(emp, req, approved=True)

    d = _leave_to_dict(req)
    d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "—"
    return d


@router.put("/leave/requests/{request_id}/reject")
def reject_leave_request(
    request_id: str,
    body: LeaveReviewBody,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.status != "pendiente":
        raise HTTPException(status_code=400, detail=f"La solicitud ya está {req.status}")

    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()

    req.status = "rechazada"
    req.reviewed_by = f"{user.first_name} {user.last_name}"
    req.reviewed_at = date.today().isoformat()
    req.reject_reason = body.reject_reason or ""
    db.commit()

    _send_leave_email(emp, req, approved=False)

    d = _leave_to_dict(req)
    d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "—"
    return d


def _send_leave_email(emp, req: LeaveRequest, approved: bool):
    try:
        from notifications import _email_template, _send_email_async
    except Exception:
        return

    leave_labels = {
        "vacaciones": "Vacaciones Anuales",
        "permiso_legal": "Permiso Legal (5 días)",
        "paternidad": "Permiso Paternidad",
        "licencia_medica": "Licencia Médica",
        "permiso_sin_goce": "Permiso sin Goce de Sueldo",
        "dia_administrativo": "Día Administrativo",
    }
    leave_label = leave_labels.get(req.leave_type, req.leave_type)

    if approved:
        subject = f"Conniku RRHH — Solicitud de {leave_label} Aprobada"
        body = f"""<p>Estimado/a <strong>{emp.first_name} {emp.last_name}</strong>,</p>
<p>Tu solicitud de <strong>{leave_label}</strong> ha sido <span style="color:#16a34a"><strong>aprobada</strong></span>.</p>
<ul>
  <li><strong>Período:</strong> {req.start_date} al {req.end_date}</li>
  <li><strong>Días:</strong> {req.days}</li>
</ul>
<p>Atentamente,<br>Equipo RRHH — Conniku</p>"""
    else:
        subject = f"Conniku RRHH — Solicitud de {leave_label} Rechazada"
        reason_text = f"<p><strong>Motivo:</strong> {req.reject_reason}</p>" if req.reject_reason else ""
        body = f"""<p>Estimado/a <strong>{emp.first_name} {emp.last_name}</strong>,</p>
<p>Tu solicitud de <strong>{leave_label}</strong> ha sido <span style="color:#dc2626"><strong>rechazada</strong></span>.</p>
<ul>
  <li><strong>Período solicitado:</strong> {req.start_date} al {req.end_date}</li>
</ul>
{reason_text}
<p>Si tienes dudas, comunícate con RRHH.</p>
<p>Atentamente,<br>Equipo RRHH — Conniku</p>"""

    html = _email_template(f"RRHH — {leave_label}", body)
    _send_email_async(emp.email, subject, html, from_account="noreply")


# ─── Serializers ─────────────────────────────────────────────────────

def _attendance_to_dict(r: AttendanceRecord) -> dict:
    return {
        "id": r.id,
        "employee_id": r.employee_id,
        "date": r.date,
        "entry_time": r.entry_time,
        "exit_time": r.exit_time,
        "total_hours": r.total_hours,
        "overtime_hours": r.overtime_hours,
        "status": r.status,
        "is_late": r.is_late,
        "late_minutes": r.late_minutes,
        "notes": r.notes,
        "recorded_by": r.recorded_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _leave_to_dict(r: LeaveRequest) -> dict:
    return {
        "id": r.id,
        "employee_id": r.employee_id,
        "leave_type": r.leave_type,
        "start_date": r.start_date,
        "end_date": r.end_date,
        "days": r.days,
        "status": r.status,
        "reason": r.reason,
        "reviewed_by": r.reviewed_by,
        "reviewed_at": r.reviewed_at,
        "reject_reason": r.reject_reason,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _warning_to_dict(w: EmployeeWarning) -> dict:
    return {
        "id": w.id,
        "employee_id": w.employee_id,
        "warning_type": w.warning_type,
        "warning_label": WARNING_LABELS.get(w.warning_type, w.warning_type),
        "incident_type": w.incident_type,
        "incident_count": w.incident_count,
        "period_days": w.period_days,
        "notes": w.notes,
        "issued_at": w.issued_at.isoformat() if w.issued_at else None,
    }
