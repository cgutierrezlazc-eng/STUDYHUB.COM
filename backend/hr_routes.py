"""
HR Management API routes for Conniku (Chilean company).
Handles employees, documents, payroll, operational expenses, and reports.
All monetary values are in CLP unless otherwise noted.
"""
import hashlib
import os
import time
import httpx
from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Session, relationship
from sqlalchemy import desc, func

from database import Base, engine, get_db, User, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/hr", tags=["hr"])


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

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("EmployeeDocument", back_populates="employee", cascade="all, delete-orphan")
    payroll_records = relationship("PayrollRecord", back_populates="employee", cascade="all, delete-orphan")


class EmployeeDocument(Base):
    __tablename__ = "hr_employee_documents"

    id = Column(String(16), primary_key=True, default=gen_id)
    employee_id = Column(String(16), ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(30), default="otro")  # contrato/anexo/job_description/liquidacion/certificado/finiquito/otro
    name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    signature_hash = Column(String(128), nullable=True)
    uploaded_by = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    category = Column(String(30), default="otro")  # suscripcion/arriendo/servicios/equipamiento/marketing/legal/contabilidad/otro
    description = Column(Text, nullable=False)
    amount_clp = Column(Float, nullable=False)
    amount_usd = Column(Float, nullable=True)
    exchange_rate = Column(Float, nullable=True)

    provider_name = Column(String(255), default="")
    provider_rut = Column(String(12), nullable=True)
    document_number = Column(String(50), default="")
    document_type = Column(String(30), default="factura")  # factura/boleta/boleta_honorarios/recibo
    tax_deductible = Column(Boolean, default=True)
    iva_amount = Column(Float, nullable=True)

    period_month = Column(Integer, nullable=False)
    period_year = Column(Integer, nullable=False)

    recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String(20), nullable=True)  # monthly/yearly/quarterly

    file_path = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_expense_period", "period_year", "period_month"),
    )


# Create tables
Base.metadata.create_all(engine)


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
        import urllib.request
        import json
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


class PayrollCalculateRequest(BaseModel):
    period_month: int = Field(ge=1, le=12)
    period_year: int = Field(ge=2020, le=2100)
    overrides: Optional[dict] = None  # employee_id -> {overtime_hours, bonuses, voluntary_deductions, other_deductions}


class ExpenseCreate(BaseModel):
    category: str = "otro"
    description: str
    amount_clp: float
    amount_usd: Optional[float] = None
    exchange_rate: Optional[float] = None
    provider_name: str = ""
    provider_rut: Optional[str] = None
    document_number: str = ""
    document_type: str = "factura"
    tax_deductible: bool = True
    iva_amount: Optional[float] = None
    period_month: int
    period_year: int
    recurring: bool = False
    recurring_frequency: Optional[str] = None
    file_path: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    amount_clp: Optional[float] = None
    amount_usd: Optional[float] = None
    exchange_rate: Optional[float] = None
    provider_name: Optional[str] = None
    provider_rut: Optional[str] = None
    document_number: Optional[str] = None
    document_type: Optional[str] = None
    tax_deductible: Optional[bool] = None
    iva_amount: Optional[float] = None
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
        "description": exp.description,
        "amount_clp": exp.amount_clp,
        "amount_usd": exp.amount_usd,
        "exchange_rate": exp.exchange_rate,
        "provider_name": exp.provider_name,
        "provider_rut": exp.provider_rut,
        "document_number": exp.document_number,
        "document_type": exp.document_type,
        "tax_deductible": exp.tax_deductible,
        "iva_amount": exp.iva_amount,
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


@router.get("/indicators")
async def get_chile_indicators(user: User = Depends(get_current_user)):
    """
    Returns current Chilean economic indicators (UF, UTM, USD, IMM, etc.)
    Auto-updated from mindicador.cl API. Cached for 1 hour.
    Used by payroll calculator, contract generator, and HR dashboard.
    """
    _require_hr_access(user)
    return await _fetch_indicators()


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
        raise HTTPException(400, f"Jornada debe ser full_time o part_time")
    if data.afp not in VALID_AFP:
        raise HTTPException(400, f"AFP debe ser una de: {', '.join(VALID_AFP)}")
    if data.health_system not in VALID_HEALTH:
        raise HTTPException(400, f"Sistema de salud debe ser fonasa o isapre")
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
#  EMPLOYEE DOCUMENTS
# ═══════════════════════════════════════════════════════════════════

VALID_DOC_TYPES = {"contrato", "anexo", "job_description", "liquidacion", "certificado", "finiquito", "otro"}

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
        raise HTTPException(500, f"Error al generar PDF: {exc}")

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

    total_net = sum(pr.net_salary for pr in records)
    total_employer = sum(pr.total_employer_cost for pr in records)

    return {
        "period": f"{year}-{month:02d}",
        "employee_count": len(records),
        "total_net_salary": round(total_net),
        "total_employer_cost": round(total_employer),
        "records": [_payroll_to_dict(pr) for pr in records],
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
        raise HTTPException(404, f"No hay registros de nomina para {month}/{year}")

    # Enrich with employee names
    employee_ids = [r.employee_id for r in records]
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    emp_map = {e.id: e for e in employees}

    enriched = []
    for pr in records:
        d = _payroll_to_dict(pr)
        emp = emp_map.get(pr.employee_id)
        d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "Desconocido"
        d["employee_rut"] = emp.rut if emp else ""
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

VALID_EXPENSE_CATEGORIES = {
    "suscripcion", "arriendo", "servicios", "equipamiento",
    "marketing", "legal", "contabilidad", "otro",
}
VALID_DOC_TYPES_EXPENSE = {"factura", "boleta", "boleta_honorarios", "recibo"}


@router.post("/expenses")
def create_expense(
    data: ExpenseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_hr_access(user)

    if data.category not in VALID_EXPENSE_CATEGORIES:
        raise HTTPException(400, f"Categoria debe ser una de: {', '.join(VALID_EXPENSE_CATEGORIES)}")
    if data.document_type not in VALID_DOC_TYPES_EXPENSE:
        raise HTTPException(400, f"Tipo de documento debe ser uno de: {', '.join(VALID_DOC_TYPES_EXPENSE)}")

    expense = OperationalExpense(
        id=gen_id(),
        category=data.category,
        description=data.description,
        amount_clp=data.amount_clp,
        amount_usd=data.amount_usd,
        exchange_rate=data.exchange_rate,
        provider_name=data.provider_name,
        provider_rut=data.provider_rut,
        document_number=data.document_number,
        document_type=data.document_type,
        tax_deductible=data.tax_deductible,
        iva_amount=data.iva_amount,
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

    if "category" in updates and updates["category"] not in VALID_EXPENSE_CATEGORIES:
        raise HTTPException(400, f"Categoria debe ser una de: {', '.join(VALID_EXPENSE_CATEGORIES)}")
    if "document_type" in updates and updates["document_type"] not in VALID_DOC_TYPES_EXPENSE:
        raise HTTPException(400, f"Tipo de documento debe ser uno de: {', '.join(VALID_DOC_TYPES_EXPENSE)}")

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
            (Employee.end_date == None) | (Employee.end_date >= f"{year}-01-01")
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
