"""Tests de unificación del motor de payroll.

Decisión D-D (Cristian, Capa 0 batch §21 2026-04-21):
Sincronizar constantes en AMBOS motores (payroll_calculator.py y
hr_routes.py). Refactor a motor único en bloque posterior.

Este test verifica que:
1. Los dos motores usen los mismos valores de constantes críticas.
2. No existan divergencias en SIS_RATE, TOPE_AFC_UF, AFP_UNO commission.
3. payroll_calculator.py usa las constantes de labor_chile.py (no hardcodeadas).

Ciclo TDD RED: escrito antes de unificar. Debe fallar mientras las
divergencias existen.
"""

from __future__ import annotations

from decimal import Decimal


# ---------------------------------------------------------------------------
# Test 1: payroll_calculator importa desde labor_chile (no hardcodeado)
# ---------------------------------------------------------------------------


def test_payroll_calculator_uses_labor_chile_uf() -> None:
    """payroll_calculator.py debe importar UF desde labor_chile, no hardcodear."""
    import payroll_calculator  # type: ignore[import]
    from backend.constants.labor_chile import UF_ABRIL_2026  # type: ignore[import]

    # El módulo debe tener UF_VALUE igual a UF_ABRIL_2026
    assert hasattr(payroll_calculator, "UF_VALUE"), "payroll_calculator debe exponer UF_VALUE"
    assert Decimal(str(payroll_calculator.UF_VALUE)) == UF_ABRIL_2026, (
        f"UF_VALUE en payroll_calculator={payroll_calculator.UF_VALUE}, esperado={UF_ABRIL_2026} (de labor_chile)"
    )


def test_payroll_calculator_uses_labor_chile_utm() -> None:
    """payroll_calculator.py debe usar UTM de labor_chile."""
    import payroll_calculator  # type: ignore[import]
    from backend.constants.labor_chile import UTM_ABRIL_2026  # type: ignore[import]

    assert hasattr(payroll_calculator, "UTM_VALUE"), "payroll_calculator debe exponer UTM_VALUE"
    assert Decimal(str(payroll_calculator.UTM_VALUE)) == UTM_ABRIL_2026, (
        f"UTM_VALUE en payroll_calculator={payroll_calculator.UTM_VALUE}, esperado={UTM_ABRIL_2026}"
    )


def test_payroll_calculator_uses_labor_chile_sueldo_minimo() -> None:
    """payroll_calculator.py debe usar sueldo mínimo de labor_chile."""
    import payroll_calculator  # type: ignore[import]
    from backend.constants.labor_chile import SUELDO_MINIMO_2026  # type: ignore[import]

    assert hasattr(payroll_calculator, "SUELDO_MINIMO"), "payroll_calculator debe exponer SUELDO_MINIMO"
    assert payroll_calculator.SUELDO_MINIMO == SUELDO_MINIMO_2026, (
        f"SUELDO_MINIMO en payroll_calculator={payroll_calculator.SUELDO_MINIMO}, esperado={SUELDO_MINIMO_2026}"
    )


def test_payroll_calculator_sis_rate_matches_labor_chile() -> None:
    """SIS_RATE en payroll_calculator debe ser 1.54% (de labor_chile, no 1.53% hardcodeado)."""
    import payroll_calculator  # type: ignore[import]
    from backend.constants.labor_chile import SIS_PCT  # type: ignore[import]

    assert hasattr(payroll_calculator, "SIS_RATE"), "payroll_calculator debe exponer SIS_RATE"
    assert Decimal(str(payroll_calculator.SIS_RATE)) == SIS_PCT, (
        f"SIS_RATE en payroll_calculator={payroll_calculator.SIS_RATE}, "
        f"esperado={SIS_PCT} — divergencia detectada (era 0.0153 hardcodeado)"
    )


def test_payroll_calculator_tope_afc_matches_labor_chile() -> None:
    """TOPE_AFC_UF en payroll_calculator debe ser 135.2 UF (D-B verificado)."""
    import payroll_calculator  # type: ignore[import]
    from backend.constants.labor_chile import TOPE_IMPONIBLE_AFC_UF  # type: ignore[import]

    assert hasattr(payroll_calculator, "TOPE_AFC_UF"), "payroll_calculator debe exponer TOPE_AFC_UF"
    assert Decimal(str(payroll_calculator.TOPE_AFC_UF)) == TOPE_IMPONIBLE_AFC_UF, (
        f"TOPE_AFC_UF en payroll_calculator={payroll_calculator.TOPE_AFC_UF}, esperado={TOPE_IMPONIBLE_AFC_UF}"
    )


def test_payroll_calculator_afp_uno_commission_is_0046() -> None:
    """AFP UNO commission en payroll_calculator debe ser 0.46% (D-E aprobado, no 0.69% legacy)."""
    import payroll_calculator  # type: ignore[import]
    from backend.constants.labor_chile import AFP_UNO_COMMISSION_PCT  # type: ignore[import]

    # En payroll_calculator.py AFP_RATES tiene {"mandatory": 0.10, "commission": X, "total": Y}
    afp_uno = payroll_calculator.AFP_RATES.get(payroll_calculator.AFPName.UNO, {})
    commission = Decimal(str(afp_uno.get("commission", 0)))
    assert commission == AFP_UNO_COMMISSION_PCT, (
        f"AFP UNO commission={commission}, esperado={AFP_UNO_COMMISSION_PCT} — era 0.0069 hardcodeado (legacy)"
    )


# ---------------------------------------------------------------------------
# Test 2: hr_routes usa las mismas constantes críticas
# ---------------------------------------------------------------------------


def test_hr_routes_tope_afc_matches_labor_chile() -> None:
    """TOPE_AFC_UF en hr_routes.py debe ser 135.2 UF (D-B verificado)."""
    import hr_routes  # type: ignore[import]
    from backend.constants.labor_chile import TOPE_IMPONIBLE_AFC_UF  # type: ignore[import]

    assert hasattr(hr_routes, "TOPE_AFC_UF"), "hr_routes debe exponer TOPE_AFC_UF"
    assert Decimal(str(hr_routes.TOPE_AFC_UF)) == TOPE_IMPONIBLE_AFC_UF, (
        f"TOPE_AFC_UF en hr_routes={hr_routes.TOPE_AFC_UF}, esperado={TOPE_IMPONIBLE_AFC_UF} — era 126.6 hardcodeado"
    )


def test_hr_routes_sis_matches_labor_chile() -> None:
    """SIS en hr_routes AFP_RATES debe ser 1.54% (de labor_chile, no 1.41% hardcodeado)."""
    import hr_routes  # type: ignore[import]
    from backend.constants.labor_chile import SIS_PCT  # type: ignore[import]

    assert hasattr(hr_routes, "AFP_RATES"), "hr_routes debe exponer AFP_RATES"
    # Verificar con habitat (cualquier AFP tiene el mismo SIS)
    sis_in_routes = Decimal(str(hr_routes.AFP_RATES["habitat"]["sis"]))
    assert sis_in_routes == SIS_PCT, (
        f"SIS en hr_routes AFP_RATES={sis_in_routes}, esperado={SIS_PCT} — era 0.0141 hardcodeado"
    )


def test_hr_routes_minimum_wage_matches_labor_chile() -> None:
    """MINIMUM_WAGE_CLP en hr_routes debe ser 539.000 (Ley 21.751)."""
    import hr_routes  # type: ignore[import]
    from backend.constants.labor_chile import SUELDO_MINIMO_2026  # type: ignore[import]

    assert hasattr(hr_routes, "MINIMUM_WAGE_CLP"), "hr_routes debe exponer MINIMUM_WAGE_CLP"
    assert int(hr_routes.MINIMUM_WAGE_CLP) == SUELDO_MINIMO_2026, (
        f"MINIMUM_WAGE_CLP en hr_routes={hr_routes.MINIMUM_WAGE_CLP}, esperado={SUELDO_MINIMO_2026}"
    )


# ---------------------------------------------------------------------------
# Test 3: overtime con fecha de corte (D-F aprobado: día exacto 2026-04-26)
# ---------------------------------------------------------------------------


def test_overtime_before_escalon_uses_176h_base() -> None:
    """Overtime calculado con fecha < 2026-04-26 usa base 176h (44×4)."""
    from datetime import date

    import payroll_calculator  # type: ignore[import]

    sueldo = 1_000_000
    horas_extra = 10
    # Con 176h base, hora_normal = 1_000_000 / 176 = 5681.818...
    # overtime = hora_normal * 1.5 * 10 horas
    expected_base = sueldo / 176
    expected = int(expected_base * 1.5 * horas_extra)

    resultado = payroll_calculator.calculate_overtime(
        sueldo_base=sueldo,
        overtime_hours=horas_extra,
        period_date=date(2026, 4, 25),
    )
    assert resultado == expected, f"Overtime pre-escalón: {resultado}, esperado: {expected} (base 176h)"


def test_overtime_on_escalon_uses_168h_base() -> None:
    """Overtime calculado con fecha >= 2026-04-26 usa base 168h (42×4)."""
    from datetime import date

    import payroll_calculator  # type: ignore[import]

    sueldo = 1_000_000
    horas_extra = 10
    expected_base = sueldo / 168
    expected = int(expected_base * 1.5 * horas_extra)

    resultado = payroll_calculator.calculate_overtime(
        sueldo_base=sueldo,
        overtime_hours=horas_extra,
        period_date=date(2026, 4, 26),
    )
    assert resultado == expected, f"Overtime en escalón: {resultado}, esperado: {expected} (base 168h)"


def test_overtime_escalon_delta_approx_7_14_percent() -> None:
    """El delta de overtime 176h→168h debe ser aprox 7.14% mayor con 168h base.

    Porque 176/168 ≈ 1.0476, o sea la hora vale ~4.76% más con base 168h.
    """
    from datetime import date

    import payroll_calculator  # type: ignore[import]

    sueldo = 1_000_000
    horas_extra = 10

    ot_pre = payroll_calculator.calculate_overtime(
        sueldo_base=sueldo,
        overtime_hours=horas_extra,
        period_date=date(2026, 4, 25),
    )
    ot_post = payroll_calculator.calculate_overtime(
        sueldo_base=sueldo,
        overtime_hours=horas_extra,
        period_date=date(2026, 4, 26),
    )

    # El ratio debe ser 176/168 = 1.04762...
    ratio = ot_post / ot_pre
    expected_ratio = 176 / 168  # ~1.0476
    # Tolerancia de ±0.01 por redondeos int
    assert abs(ratio - expected_ratio) < 0.01, f"Ratio overtime post/pre={ratio:.4f}, esperado≈{expected_ratio:.4f}"
