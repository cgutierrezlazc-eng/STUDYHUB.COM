"""
Chilean Payroll Calculation Engine (Liquidacion de Remuneraciones)
=================================================================

Implements all Chilean labor law requirements for payroll processing,
covering the period 2024-2026. This module handles:

- AFP (Administradoras de Fondos de Pensiones) pension contributions
- Health insurance (Fonasa / Isapre) deductions
- AFC (Seguro de Cesantia) unemployment insurance
- SIS (Seguro de Invalidez y Sobrevivencia) employer disability/survivor insurance
- Mutual de Seguridad occupational accident insurance
- Impuesto Unico de Segunda Categoria (progressive income tax)
- Gratificacion Legal (legal profit-sharing bonus)
- Overtime (horas extras) at 50% surcharge
- Non-taxable allowances (colacion, movilizacion)
- Vacation provision and severance (indemnizacion) calculations
- Previred upload data formatting

Legal references:
- Codigo del Trabajo (DFL 1, 2003)
- DL 3500 (AFP system)
- Ley 18.469 (Fonasa)
- Ley 19.728 (Seguro de Cesantia / AFC)
- Ley 16.744 (Accidentes del trabajo - Mutual)
- Art. 42 bis, Ley de Impuesto a la Renta (tax brackets)
- Art. 50, Codigo del Trabajo (gratificacion)

Author: CONNIKU Payroll Module
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional

from constants.labor_chile import (  # noqa: E402
    AFC_EMPLEADOR_INDEFINIDO_PCT,
    AFC_EMPLEADOR_PLAZO_FIJO_PCT,
    AFC_TRABAJADOR_INDEFINIDO_PCT,
    AFP_OBLIGATORIA_PCT,
    AFP_UNO_COMMISSION_PCT,
    FONASA_PCT,
    GRATIFICACION_TOPE_IMM,
    MUTUAL_BASE_PCT,
    SIS_PCT,
    SUELDO_MINIMO_2026,
    TOPE_IMPONIBLE_AFC_UF,
    TOPE_IMPONIBLE_AFP_UF,
    UF_ABRIL_2026,
    UTM_ABRIL_2026,
    get_monthly_hours_at_date,
    get_weekly_hours_at_date,
)
from constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # noqa: E402

# ---------------------------------------------------------------------------
# Aliases de compatibilidad — exponer los mismos nombres que el código
# existente espera, ahora respaldados por labor_chile / tax_chile.
# ---------------------------------------------------------------------------

# UF vigente: derivada de labor_chile (actualizada mensualmente)
UF_VALUE: float = float(UF_ABRIL_2026)

# UTM vigente: derivada de labor_chile
UTM_VALUE: float = float(UTM_ABRIL_2026)

# Sueldo mínimo 2026 — Ley 21.751
SUELDO_MINIMO: int = SUELDO_MINIMO_2026

# Horas base mensuales (legacy alias — usar get_monthly_hours_at_date(fecha) para
# cálculos nuevos; este valor refleja jornada vigente HOY para retrocompatibilidad).
# IMPORTANTE: calculate_overtime() acepta period_date para usar el valor correcto.
MONTHLY_HOURS: float = float(get_monthly_hours_at_date(date.today()))
WEEKLY_HOURS: float = float(get_weekly_hours_at_date(date.today()))


# ---------------------------------------------------------------------------
# AFP definitions
# ---------------------------------------------------------------------------


class AFPName(str, Enum):
    """
    AFP (Administradora de Fondos de Pensiones).

    Every Chilean worker under the capitalisation system must choose one AFP.
    The mandatory pension contribution is always 10% of gross taxable salary;
    each AFP adds its own commission (comision) on top.
    """

    CAPITAL = "Capital"
    CUPRUM = "Cuprum"
    HABITAT = "Habitat"
    MODELO = "Modelo"
    PLANVITAL = "Planvital"
    PROVIDA = "Provida"
    UNO = "Uno"


# Total rate = 10% mandatory savings + AFP commission.
# AFP UNO commission actualizada a 0.0046 (D-E aprobado 2026-04-21, labor_chile.py).
# Comisiones vigentes 2026 según Superintendencia de Pensiones.
_AFP_MANDATORY: float = float(AFP_OBLIGATORIA_PCT)
_AFP_UNO_COMM: float = float(AFP_UNO_COMMISSION_PCT)  # 0.0046, no 0.0069 (legacy)

AFP_RATES: dict[AFPName, dict[str, float]] = {
    AFPName.CAPITAL: {"mandatory": _AFP_MANDATORY, "commission": 0.0144, "total": _AFP_MANDATORY + 0.0144},
    AFPName.CUPRUM: {"mandatory": _AFP_MANDATORY, "commission": 0.0144, "total": _AFP_MANDATORY + 0.0144},
    AFPName.HABITAT: {"mandatory": _AFP_MANDATORY, "commission": 0.0127, "total": _AFP_MANDATORY + 0.0127},
    AFPName.MODELO: {"mandatory": _AFP_MANDATORY, "commission": 0.0058, "total": _AFP_MANDATORY + 0.0058},
    AFPName.PLANVITAL: {"mandatory": _AFP_MANDATORY, "commission": 0.0041, "total": _AFP_MANDATORY + 0.0041},
    AFPName.PROVIDA: {"mandatory": _AFP_MANDATORY, "commission": 0.0145, "total": _AFP_MANDATORY + 0.0145},
    AFPName.UNO: {"mandatory": _AFP_MANDATORY, "commission": _AFP_UNO_COMM, "total": _AFP_MANDATORY + _AFP_UNO_COMM},
}


# ---------------------------------------------------------------------------
# Health system
# ---------------------------------------------------------------------------


class HealthSystem(str, Enum):
    """
    Chilean workers choose between:
    - FONASA: public health fund, fixed 7% deduction.
    - ISAPRE: private health insurer, minimum 7% but the plan may cost more
      (the difference is an additional voluntary deduction expressed in UF).
    """

    FONASA = "Fonasa"
    ISAPRE = "Isapre"


FONASA_RATE: float = float(FONASA_PCT)  # 7% — Ley 18.469, de labor_chile


# ---------------------------------------------------------------------------
# Contract types (affect AFC rates)
# ---------------------------------------------------------------------------


class ContractType(str, Enum):
    """
    AFC (Seguro de Cesantia) rates depend on contract type:
    - INDEFINIDO: open-ended contract. Employee pays 0.6%, employer 2.4%.
    - PLAZO_FIJO: fixed-term or per-task contract. Employee pays 0%, employer 3%.
    """

    INDEFINIDO = "Indefinido"
    PLAZO_FIJO = "Plazo Fijo"


AFC_RATES: dict[ContractType, dict[str, float]] = {
    ContractType.INDEFINIDO: {
        "employee": float(AFC_TRABAJADOR_INDEFINIDO_PCT),
        "employer": float(AFC_EMPLEADOR_INDEFINIDO_PCT),
    },
    ContractType.PLAZO_FIJO: {
        "employee": 0.0,
        "employer": float(AFC_EMPLEADOR_PLAZO_FIJO_PCT),
    },
}


# ---------------------------------------------------------------------------
# Employer-only contributions
# ---------------------------------------------------------------------------

# SIS - Seguro de Invalidez y Sobrevivencia (de labor_chile — 1.54%, no 1.53% legacy).
SIS_RATE: float = float(SIS_PCT)  # 0.0154, de labor_chile.py

# Mutual de Seguridad (de labor_chile — tasa base 0.93%).
MUTUAL_BASE_RATE: float = float(MUTUAL_BASE_PCT)  # 0.0093, de labor_chile.py


# ---------------------------------------------------------------------------
# Topes imponibles (taxable salary caps)
# ---------------------------------------------------------------------------

# Topes desde labor_chile.py (D-B aprobado 2026-04-21: AFC 135.2 UF, no 122.6 legacy).
TOPE_AFP_UF: float = float(TOPE_IMPONIBLE_AFP_UF)  # 81.6 UF — DL 3500
TOPE_SALUD_UF: float = float(TOPE_IMPONIBLE_AFP_UF)  # 81.6 UF — igual que AFP
TOPE_AFC_UF: float = float(TOPE_IMPONIBLE_AFC_UF)  # 135.2 UF — spensiones.cl feb-2026


def tope_afp() -> int:
    """AFP taxable cap in CLP (81.6 UF)."""
    return int(TOPE_AFP_UF * UF_VALUE)


def tope_salud() -> int:
    """Health taxable cap in CLP (81.6 UF)."""
    return int(TOPE_SALUD_UF * UF_VALUE)


def tope_afc() -> int:
    """AFC taxable cap in CLP (122.6 UF)."""
    return int(TOPE_AFC_UF * UF_VALUE)


# ---------------------------------------------------------------------------
# Impuesto Unico de Segunda Categoria (monthly income tax)
# ---------------------------------------------------------------------------

# Tramos de impuesto desde tax_chile.py (fuente SII 2026).
# Alias float para compatibilidad con el motor que usa UTM_VALUE float.
TAX_BRACKETS: list[tuple[float, float, float, float]] = [
    (float(lo), float(hi) if hi is not None else math.inf, float(rate), float(ded))
    for lo, hi, rate, ded in IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM
]


def calculate_income_tax(taxable_income_clp: int) -> int:
    """
    Calculate Impuesto Unico de Segunda Categoria.

    This is the monthly progressive income tax applied to dependent workers
    (trabajadores dependientes). The base is the gross taxable salary minus
    all mandatory social security deductions (AFP, health, AFC employee).

    Args:
        taxable_income_clp: Income subject to tax (renta imponible after
            subtracting previsional deductions), in CLP.

    Returns:
        Tax amount in CLP (rounded down to integer, as is standard).
    """
    if taxable_income_clp <= 0:
        return 0

    income_in_utm = taxable_income_clp / UTM_VALUE

    for _lower, upper, rate, deductible in TAX_BRACKETS:
        if income_in_utm <= upper:
            tax_utm = income_in_utm * rate - deductible
            return max(0, int(tax_utm * UTM_VALUE))

    # Should not reach here, but fallback to top bracket.
    _, _, rate, deductible = TAX_BRACKETS[-1]
    tax_utm = income_in_utm * rate - deductible
    return max(0, int(tax_utm * UTM_VALUE))


# ---------------------------------------------------------------------------
# Gratificacion Legal
# ---------------------------------------------------------------------------


def calculate_gratificacion(sueldo_base: int) -> int:
    """
    Calculate Gratificacion Legal (Art. 50, Codigo del Trabajo).

    Employers with profits must share them with workers. The most common
    method (Art. 50) is 25% of the worker's gross salary, capped at
    4.75 Ingresos Minimos Mensuales per year (i.e., 4.75 * sueldo_minimo / 12
    per month).

    Args:
        sueldo_base: Monthly base salary in CLP.

    Returns:
        Monthly gratificacion amount in CLP.
    """
    monthly_cap = int((float(GRATIFICACION_TOPE_IMM) * SUELDO_MINIMO) / 12)
    calculated = int(sueldo_base * 0.25)
    return min(calculated, monthly_cap)


# ---------------------------------------------------------------------------
# Overtime (horas extras)
# ---------------------------------------------------------------------------


def calculate_overtime(
    sueldo_base: int,
    overtime_hours: float,
    period_date: Optional[date] = None,
) -> int:
    """
    Calculate overtime pay (horas extras).

    Chilean law mandates a 50% surcharge (recargo) on top of the regular
    hourly rate for overtime hours (Art. 32 Código del Trabajo).
    La base mensual cambia según la fecha:
    - Antes de 2026-04-26: 176h (44h × 4, escalón 1 Ley 21.561).
    - Desde 2026-04-26: 168h (42h × 4, escalón 2 Ley 21.561).

    Args:
        sueldo_base: Monthly base salary in CLP.
        overtime_hours: Number of overtime hours worked in the month.
        period_date: Fecha del período de pago. Si None, usa date.today().
            Determina la base mensual de horas según Ley 21.561.

    Returns:
        Overtime pay in CLP.
    """
    if overtime_hours <= 0:
        return 0
    effective_date = period_date if period_date is not None else date.today()
    monthly_base = get_monthly_hours_at_date(effective_date)
    hourly_rate = sueldo_base / monthly_base
    overtime_rate = hourly_rate * 1.5  # 50% surcharge (Art. 32 CT)
    return int(overtime_rate * overtime_hours)


# ---------------------------------------------------------------------------
# Vacation provision
# ---------------------------------------------------------------------------


def calculate_vacation_provision(sueldo_base: int, years_of_service: float = 1.0) -> int:
    """
    Calculate monthly vacation provision.

    Chilean workers are entitled to 15 working days of paid vacation per year
    (feriado anual, Art. 67 Codigo del Trabajo). Workers with 10+ years for
    the same employer or 10+ total years with different employers (with at
    least 3 years at the current one) get 1 additional day per every 3 years
    beyond 10 (feriado progresivo, Art. 68).

    This function returns a monthly accrual/provision for accounting purposes.

    Args:
        sueldo_base: Monthly base salary in CLP.
        years_of_service: Total years of service (used for progressive vacation).

    Returns:
        Monthly vacation provision in CLP.
    """
    base_days = 15
    progressive_extra = 0

    if years_of_service >= 13:
        # Every 3 years beyond 10 grants 1 extra day.
        progressive_extra = int((years_of_service - 10) / 3)

    total_vacation_days = base_days + progressive_extra

    # Daily rate based on 30-day month convention.
    daily_rate = sueldo_base / 30
    annual_vacation_value = daily_rate * total_vacation_days
    monthly_provision = int(annual_vacation_value / 12)
    return monthly_provision


# ---------------------------------------------------------------------------
# Severance (indemnizacion por anos de servicio)
# ---------------------------------------------------------------------------


def calculate_severance(
    last_monthly_salary: int,
    years_of_service: float,
    cap_years: int = 11,
    tope_90_uf: bool = True,
) -> int:
    """
    Calculate severance pay (indemnizacion por anos de servicio).

    Under Art. 163 of the Codigo del Trabajo, when an employer terminates a
    contract for "needs of the company" (necesidades de la empresa), the worker
    is entitled to 1 month's salary per year of service, capped at 11 years.

    The monthly salary used is the last full month's taxable earnings, and it
    is itself capped at 90 UF per month (Art. 172).

    Args:
        last_monthly_salary: Last month's total taxable salary in CLP.
        years_of_service: Completed years of service (fractions are floored).
        cap_years: Maximum years counted (default 11 per law).
        tope_90_uf: Whether to apply the 90 UF monthly salary cap.

    Returns:
        Total severance amount in CLP.
    """
    applicable_years = min(int(years_of_service), cap_years)
    if applicable_years <= 0:
        return 0

    salary_for_calc = last_monthly_salary
    if tope_90_uf:
        tope_90 = int(90 * UF_VALUE)
        salary_for_calc = min(salary_for_calc, tope_90)

    return salary_for_calc * applicable_years


# ---------------------------------------------------------------------------
# Input / Output dataclasses
# ---------------------------------------------------------------------------


@dataclass
class EmployeeData:
    """
    Input data for a single employee's monthly payroll calculation.

    Attributes:
        rut: Chilean national ID (RUT), e.g. "12.345.678-9".
        nombre: Full name.
        sueldo_base: Monthly base salary in CLP. Must be >= SUELDO_MINIMO
            for full-time workers.
        afp: Which AFP the employee is enrolled in.
        health_system: Fonasa or Isapre.
        isapre_plan_uf: If Isapre, the total monthly plan cost in UF.
            The legal 7% is deducted first; any excess is an additional
            voluntary deduction.
        contract_type: Indefinido or Plazo Fijo (affects AFC).
        overtime_hours: Overtime hours worked this month.
        bonos_imponibles: Taxable bonuses (bono de produccion, etc.) in CLP.
        bonos_no_imponibles: Non-taxable bonuses in CLP.
        colacion: Meal allowance (non-taxable) in CLP.
        movilizacion: Transport allowance (non-taxable) in CLP.
        apv_amount: Voluntary pension savings (APV regimen A or B) in CLP.
            Deducted before tax if regimen A.
        apv_regimen: "A" (pre-tax) or "B" (post-tax). Default "A".
        additional_health: Additional voluntary health deduction in CLP
            (e.g., Isapre excess beyond 7%).
        other_deductions: Any other agreed deductions (union dues, loans, etc.).
        years_of_service: For vacation and severance calculations.
        mutual_rate: Override for the Mutual de Seguridad rate if the company
            has a different risk classification. Defaults to base rate.
    """

    rut: str
    nombre: str
    sueldo_base: int
    afp: AFPName = AFPName.HABITAT
    health_system: HealthSystem = HealthSystem.FONASA
    isapre_plan_uf: float = 0.0
    contract_type: ContractType = ContractType.INDEFINIDO
    overtime_hours: float = 0.0
    bonos_imponibles: int = 0
    bonos_no_imponibles: int = 0
    colacion: int = 0
    movilizacion: int = 0
    apv_amount: int = 0
    apv_regimen: str = "A"
    additional_health: int = 0
    other_deductions: int = 0
    years_of_service: float = 1.0
    mutual_rate: Optional[float] = None


@dataclass
class Haberes:
    """Breakdown of all earnings (haberes) for the month."""

    sueldo_base: int = 0
    gratificacion: int = 0
    horas_extras: int = 0
    bonos_imponibles: int = 0
    bonos_no_imponibles: int = 0
    colacion: int = 0
    movilizacion: int = 0

    @property
    def total_imponible(self) -> int:
        """Total taxable earnings (haberes imponibles)."""
        return self.sueldo_base + self.gratificacion + self.horas_extras + self.bonos_imponibles

    @property
    def total_no_imponible(self) -> int:
        """Total non-taxable earnings (haberes no imponibles)."""
        return self.bonos_no_imponibles + self.colacion + self.movilizacion

    @property
    def total_haberes(self) -> int:
        """Grand total of all earnings."""
        return self.total_imponible + self.total_no_imponible


@dataclass
class DescuentosLegales:
    """
    Mandatory legal deductions (descuentos legales).

    These are deducted from the employee's gross taxable salary before
    they receive their net pay.
    """

    afp: int = 0
    afp_name: str = ""
    afp_rate: float = 0.0
    salud: int = 0
    salud_system: str = ""
    afc_employee: int = 0
    impuesto: int = 0

    @property
    def total_previsional(self) -> int:
        """Total social security deductions (AFP + health + AFC)."""
        return self.afp + self.salud + self.afc_employee

    @property
    def total(self) -> int:
        """Total mandatory deductions including tax."""
        return self.total_previsional + self.impuesto


@dataclass
class DescuentosVoluntarios:
    """
    Voluntary deductions agreed upon by the employee.

    APV (Ahorro Previsional Voluntario) under regimen A reduces the tax base.
    """

    apv: int = 0
    additional_health: int = 0
    other: int = 0

    @property
    def total(self) -> int:
        return self.apv + self.additional_health + self.other


@dataclass
class CostosEmpleador:
    """
    Employer-side costs that do not appear on the employee's payslip
    as deductions, but are paid by the company on top of the salary.
    """

    afc_employer: int = 0
    sis: int = 0
    mutual: int = 0

    @property
    def total(self) -> int:
        return self.afc_employer + self.sis + self.mutual


@dataclass
class Liquidacion:
    """
    Complete Liquidacion de Remuneraciones (payslip) for one employee/month.
    """

    rut: str = ""
    nombre: str = ""
    periodo: str = ""  # e.g. "2025-04"
    haberes: Haberes = field(default_factory=Haberes)
    descuentos_legales: DescuentosLegales = field(default_factory=DescuentosLegales)
    descuentos_voluntarios: DescuentosVoluntarios = field(default_factory=DescuentosVoluntarios)
    costos_empleador: CostosEmpleador = field(default_factory=CostosEmpleador)

    # Derived totals stored for convenience.
    total_haberes_imponibles: int = 0
    total_haberes_no_imponibles: int = 0
    total_descuentos: int = 0
    sueldo_liquido: int = 0
    total_costo_empresa: int = 0

    # Provision info (not deducted, for accounting).
    vacation_provision: int = 0


@dataclass
class PreviredLine:
    """
    Data formatted for upload to Previred (Declaracion y Pago de Cotizaciones).

    Previred is the centralised platform where employers declare and pay
    social security contributions each month. This dataclass contains the
    fields needed for one employee line in the Previred file.
    """

    rut: str = ""
    nombre: str = ""
    afp_code: str = ""
    renta_imponible_afp: int = 0
    renta_imponible_salud: int = 0
    renta_imponible_afc: int = 0
    cotizacion_afp: int = 0
    cotizacion_sis: int = 0
    cotizacion_salud: int = 0
    cotizacion_afc_employee: int = 0
    cotizacion_afc_employer: int = 0
    cotizacion_mutual: int = 0
    apv: int = 0
    contract_type: str = ""
    dias_trabajados: int = 30


# ---------------------------------------------------------------------------
# AFP code mapping for Previred
# ---------------------------------------------------------------------------

AFP_PREVIRED_CODES: dict[AFPName, str] = {
    AFPName.CAPITAL: "033",
    AFPName.CUPRUM: "005",
    AFPName.HABITAT: "029",
    AFPName.MODELO: "036",
    AFPName.PLANVITAL: "021",
    AFPName.PROVIDA: "008",
    AFPName.UNO: "037",
}


# ---------------------------------------------------------------------------
# Core calculation: Liquidacion de Remuneraciones
# ---------------------------------------------------------------------------


def calculate_liquidacion(
    employee: EmployeeData,
    periodo: str = "",
) -> Liquidacion:
    """
    Calculate a complete monthly Liquidacion de Remuneraciones.

    This is the main entry point. It takes an EmployeeData object and returns
    a full Liquidacion with every line item needed for the payslip.

    Process:
    1. Compute all haberes (earnings).
    2. Apply topes imponibles (taxable caps) to determine bases for each
       social security contribution.
    3. Calculate mandatory deductions: AFP, health, AFC (employee portion).
    4. Calculate income tax on the remaining taxable income.
    5. Apply voluntary deductions (APV, additional health, other).
    6. Compute employer-side costs (AFC employer, SIS, Mutual).
    7. Derive net pay (sueldo liquido) and total employer cost.

    Args:
        employee: EmployeeData with all relevant payroll inputs.
        periodo: Period string, e.g. "2025-04". Informational only.

    Returns:
        A fully populated Liquidacion dataclass.
    """
    liq = Liquidacion(rut=employee.rut, nombre=employee.nombre, periodo=periodo)

    # ---- 1. Haberes (earnings) ----
    gratificacion = calculate_gratificacion(employee.sueldo_base)
    horas_extras = calculate_overtime(employee.sueldo_base, employee.overtime_hours)

    hab = Haberes(
        sueldo_base=employee.sueldo_base,
        gratificacion=gratificacion,
        horas_extras=horas_extras,
        bonos_imponibles=employee.bonos_imponibles,
        bonos_no_imponibles=employee.bonos_no_imponibles,
        colacion=employee.colacion,
        movilizacion=employee.movilizacion,
    )
    liq.haberes = hab
    liq.total_haberes_imponibles = hab.total_imponible
    liq.total_haberes_no_imponibles = hab.total_no_imponible

    total_imponible = hab.total_imponible

    # ---- 2. Topes imponibles ----
    base_afp = min(total_imponible, tope_afp())
    base_salud = min(total_imponible, tope_salud())
    base_afc = min(total_imponible, tope_afc())

    # ---- 3. Descuentos legales ----
    dl = DescuentosLegales()

    # AFP
    afp_info = AFP_RATES[employee.afp]
    dl.afp = int(base_afp * afp_info["total"])
    dl.afp_name = employee.afp.value
    dl.afp_rate = afp_info["total"]

    # Health (Salud)
    if employee.health_system == HealthSystem.FONASA:
        dl.salud = int(base_salud * FONASA_RATE)
        dl.salud_system = "Fonasa"
    else:
        # Isapre: the mandatory 7% goes toward the plan.
        legal_7_pct = int(base_salud * FONASA_RATE)
        if employee.isapre_plan_uf > 0:
            plan_cost_clp = int(employee.isapre_plan_uf * UF_VALUE)
            # The 7% covers part of the plan; if plan > 7%, the excess is
            # an additional deduction (descuento voluntario).
            if plan_cost_clp > legal_7_pct:
                dl.salud = legal_7_pct
                # The excess will be placed in voluntary deductions below.
                isapre_excess = plan_cost_clp - legal_7_pct
            else:
                # Plan is cheaper than 7%; employee still pays 7%.
                dl.salud = legal_7_pct
                isapre_excess = 0
        else:
            dl.salud = legal_7_pct
            isapre_excess = 0
        dl.salud_system = "Isapre"

    # AFC (employee portion)
    afc_info = AFC_RATES[employee.contract_type]
    dl.afc_employee = int(base_afc * afc_info["employee"])

    # ---- 4. Income tax ----
    # Tax base = gross taxable income minus previsional deductions.
    previsional_total = dl.afp + dl.salud + dl.afc_employee

    # APV regimen A reduces the tax base (pre-tax savings).
    apv_pretax = employee.apv_amount if employee.apv_regimen == "A" else 0
    tax_base = total_imponible - previsional_total - apv_pretax
    tax_base = max(tax_base, 0)

    dl.impuesto = calculate_income_tax(tax_base)

    liq.descuentos_legales = dl

    # ---- 5. Descuentos voluntarios ----
    dv = DescuentosVoluntarios()
    dv.apv = employee.apv_amount

    # Isapre excess (if applicable).
    if employee.health_system == HealthSystem.ISAPRE:
        additional_from_isapre = isapre_excess if employee.isapre_plan_uf > 0 else 0
        dv.additional_health = employee.additional_health + additional_from_isapre
    else:
        dv.additional_health = employee.additional_health

    dv.other = employee.other_deductions
    liq.descuentos_voluntarios = dv

    # ---- 6. Employer costs ----
    ce = CostosEmpleador()
    ce.afc_employer = int(base_afc * afc_info["employer"])
    ce.sis = int(base_afp * SIS_RATE)
    mutual_rate = employee.mutual_rate if employee.mutual_rate is not None else MUTUAL_BASE_RATE
    ce.mutual = int(total_imponible * mutual_rate)
    liq.costos_empleador = ce

    # ---- 7. Totals ----
    liq.total_descuentos = dl.total + dv.total
    liq.sueldo_liquido = hab.total_haberes - liq.total_descuentos

    # Total employer cost = gross salary + non-taxable allowances + employer contributions.
    liq.total_costo_empresa = hab.total_haberes + ce.total

    # ---- Vacation provision (informational) ----
    liq.vacation_provision = calculate_vacation_provision(employee.sueldo_base, employee.years_of_service)

    return liq


# ---------------------------------------------------------------------------
# Previred line
# ---------------------------------------------------------------------------


def calculate_previred_line(
    employee: EmployeeData,
    dias_trabajados: int = 30,
) -> PreviredLine:
    """
    Generate a single Previred declaration line for one employee.

    Previred is the platform through which employers declare and pay all
    social security contributions (AFP, health, AFC, SIS, Mutual, APV, etc.)
    every month. This function returns the data needed for one row.

    Args:
        employee: EmployeeData for the employee.
        dias_trabajados: Days worked in the month (default 30 = full month).

    Returns:
        PreviredLine with all contribution amounts.
    """
    # Reuse the liquidacion calculation for consistency.
    liq = calculate_liquidacion(employee)

    total_imponible = liq.haberes.total_imponible

    line = PreviredLine(
        rut=employee.rut,
        nombre=employee.nombre,
        afp_code=AFP_PREVIRED_CODES.get(employee.afp, ""),
        renta_imponible_afp=min(total_imponible, tope_afp()),
        renta_imponible_salud=min(total_imponible, tope_salud()),
        renta_imponible_afc=min(total_imponible, tope_afc()),
        cotizacion_afp=liq.descuentos_legales.afp,
        cotizacion_sis=liq.costos_empleador.sis,
        cotizacion_salud=liq.descuentos_legales.salud,
        cotizacion_afc_employee=liq.descuentos_legales.afc_employee,
        cotizacion_afc_employer=liq.costos_empleador.afc_employer,
        cotizacion_mutual=liq.costos_empleador.mutual,
        apv=employee.apv_amount,
        contract_type=employee.contract_type.value,
        dias_trabajados=dias_trabajados,
    )
    return line


# ---------------------------------------------------------------------------
# Total employer cost
# ---------------------------------------------------------------------------


def calculate_employer_total_cost(employee: EmployeeData) -> dict[str, int]:
    """
    Calculate the total cost to the employer for one employee in a month.

    This includes all salary components the employee receives plus all
    employer-side contributions (AFC employer, SIS, Mutual).

    Args:
        employee: EmployeeData for the employee.

    Returns:
        Dictionary with a breakdown and the grand total.
    """
    liq = calculate_liquidacion(employee)

    return {
        "total_haberes": liq.haberes.total_haberes,
        "afc_employer": liq.costos_empleador.afc_employer,
        "sis": liq.costos_empleador.sis,
        "mutual": liq.costos_empleador.mutual,
        "total_employer_contributions": liq.costos_empleador.total,
        "total_cost": liq.total_costo_empresa,
        "vacation_provision": liq.vacation_provision,
        "total_cost_with_provision": liq.total_costo_empresa + liq.vacation_provision,
    }


# ---------------------------------------------------------------------------
# Utility: pretty-print a liquidacion
# ---------------------------------------------------------------------------


def format_liquidacion(liq: Liquidacion) -> str:
    """
    Return a human-readable text representation of a Liquidacion de
    Remuneraciones, suitable for printing or logging.
    """
    lines: list[str] = []
    sep = "=" * 60

    lines.append(sep)
    lines.append("  LIQUIDACION DE REMUNERACIONES")
    lines.append(sep)
    lines.append(f"  Trabajador : {liq.nombre}")
    lines.append(f"  RUT        : {liq.rut}")
    lines.append(f"  Periodo    : {liq.periodo}")
    lines.append(sep)

    lines.append("")
    lines.append("  HABERES (Ingresos)")
    lines.append("  " + "-" * 44)
    lines.append(f"    Sueldo Base          : ${liq.haberes.sueldo_base:>12,}")
    lines.append(f"    Gratificacion Legal  : ${liq.haberes.gratificacion:>12,}")
    lines.append(f"    Horas Extras         : ${liq.haberes.horas_extras:>12,}")
    lines.append(f"    Bonos Imponibles     : ${liq.haberes.bonos_imponibles:>12,}")
    lines.append(f"    Bonos No Imponibles  : ${liq.haberes.bonos_no_imponibles:>12,}")
    lines.append(f"    Colacion             : ${liq.haberes.colacion:>12,}")
    lines.append(f"    Movilizacion         : ${liq.haberes.movilizacion:>12,}")
    lines.append("  " + "-" * 44)
    lines.append(f"    Total Imponible      : ${liq.total_haberes_imponibles:>12,}")
    lines.append(f"    Total No Imponible   : ${liq.total_haberes_no_imponibles:>12,}")
    lines.append(f"    TOTAL HABERES        : ${liq.haberes.total_haberes:>12,}")

    lines.append("")
    lines.append("  DESCUENTOS LEGALES")
    lines.append("  " + "-" * 44)
    lines.append(
        f"    AFP ({liq.descuentos_legales.afp_name} "
        f"{liq.descuentos_legales.afp_rate * 100:.2f}%)"
        f"    : ${liq.descuentos_legales.afp:>12,}"
    )
    lines.append(f"    Salud ({liq.descuentos_legales.salud_system})         : ${liq.descuentos_legales.salud:>12,}")
    lines.append(f"    AFC Trabajador       : ${liq.descuentos_legales.afc_employee:>12,}")
    lines.append(f"    Impuesto Unico       : ${liq.descuentos_legales.impuesto:>12,}")
    lines.append("  " + "-" * 44)
    lines.append(f"    TOTAL DESC. LEGALES  : ${liq.descuentos_legales.total:>12,}")

    dv = liq.descuentos_voluntarios
    if dv.total > 0:
        lines.append("")
        lines.append("  DESCUENTOS VOLUNTARIOS")
        lines.append("  " + "-" * 44)
        if dv.apv > 0:
            lines.append(f"    APV                  : ${dv.apv:>12,}")
        if dv.additional_health > 0:
            lines.append(f"    Salud Adicional      : ${dv.additional_health:>12,}")
        if dv.other > 0:
            lines.append(f"    Otros Descuentos     : ${dv.other:>12,}")
        lines.append("  " + "-" * 44)
        lines.append(f"    TOTAL DESC. VOLUNT.  : ${dv.total:>12,}")

    lines.append("")
    lines.append(sep)
    lines.append(f"    TOTAL DESCUENTOS     : ${liq.total_descuentos:>12,}")
    lines.append(f"    SUELDO LIQUIDO       : ${liq.sueldo_liquido:>12,}")
    lines.append(sep)

    lines.append("")
    lines.append("  COSTOS EMPLEADOR (no descontados al trabajador)")
    lines.append("  " + "-" * 44)
    lines.append(f"    AFC Empleador        : ${liq.costos_empleador.afc_employer:>12,}")
    lines.append(f"    SIS                  : ${liq.costos_empleador.sis:>12,}")
    lines.append(f"    Mutual de Seguridad  : ${liq.costos_empleador.mutual:>12,}")
    lines.append("  " + "-" * 44)
    lines.append(f"    Total Empleador      : ${liq.costos_empleador.total:>12,}")
    lines.append(f"    COSTO TOTAL EMPRESA  : ${liq.total_costo_empresa:>12,}")
    lines.append("")
    lines.append(f"    Provision Vacaciones : ${liq.vacation_provision:>12,}")
    lines.append(sep)

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Example / self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Example: a worker earning $1,200,000 CLP/month with AFP Habitat.
    emp = EmployeeData(
        rut="12.345.678-9",
        nombre="Maria Gonzalez Soto",
        sueldo_base=1_200_000,
        afp=AFPName.HABITAT,
        health_system=HealthSystem.FONASA,
        contract_type=ContractType.INDEFINIDO,
        overtime_hours=10,
        bonos_imponibles=100_000,
        colacion=80_000,
        movilizacion=60_000,
        years_of_service=5.0,
    )

    liquidacion = calculate_liquidacion(emp, periodo="2025-04")
    print(format_liquidacion(liquidacion))

    print("\n--- Previred Line ---")
    previred = calculate_previred_line(emp)
    print(f"  RUT: {previred.rut}")
    print(f"  AFP Code: {previred.afp_code}")
    print(f"  Renta Imp. AFP: ${previred.renta_imponible_afp:,}")
    print(f"  Renta Imp. Salud: ${previred.renta_imponible_salud:,}")
    print(f"  Renta Imp. AFC: ${previred.renta_imponible_afc:,}")
    print(f"  Cotiz. AFP: ${previred.cotizacion_afp:,}")
    print(f"  Cotiz. Salud: ${previred.cotizacion_salud:,}")
    print(f"  Cotiz. AFC Emp: ${previred.cotizacion_afc_employee:,}")
    print(f"  Cotiz. AFC Empr: ${previred.cotizacion_afc_employer:,}")
    print(f"  SIS: ${previred.cotizacion_sis:,}")
    print(f"  Mutual: ${previred.cotizacion_mutual:,}")

    print("\n--- Employer Total Cost ---")
    cost = calculate_employer_total_cost(emp)
    for k, v in cost.items():
        print(f"  {k}: ${v:,}")

    print("\n--- Severance (5 years) ---")
    sev = calculate_severance(1_200_000, 5.0)
    print(f"  Indemnizacion: ${sev:,}")

    print("\n--- Severance (15 years, capped at 11) ---")
    sev2 = calculate_severance(1_200_000, 15.0)
    print(f"  Indemnizacion: ${sev2:,}")
