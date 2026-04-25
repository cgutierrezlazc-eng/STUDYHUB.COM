"""Tests específicos para la función get_weekly_hours_at_date y get_monthly_hours_at_date.

Ciclo TDD RED: escrito antes de crear labor_chile.py.
Casos de borde críticos para Ley 21.561 escalón 2 (2026-04-26).
"""

from __future__ import annotations

from datetime import date


def test_weekly_hours_2026_04_25_is_44() -> None:
    """2026-04-25: día ANTES del escalón → 44h (escalón 1 de Ley 21.561)."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 4, 25)) == 44


def test_weekly_hours_2026_04_26_is_42() -> None:
    """2026-04-26: día EXACTO del escalón → 42h (escalón 2 de Ley 21.561)."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 4, 26)) == 42


def test_weekly_hours_2026_05_01_is_42() -> None:
    """2026-05-01: mayo posterior al escalón → 42h."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 5, 1)) == 42


def test_weekly_hours_2024_12_01_is_44() -> None:
    """2024-12-01: fecha anterior al escalón → 44h (escalón 1 ya vigente desde abr 2024)."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2024, 12, 1)) == 44


def test_weekly_hours_2026_04_26_last_day_before_is_44() -> None:
    """Verificación simétrica: 2026-04-25 es el último día de 44h."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 4, 25)) == 44
    # y el siguiente ya es 42
    assert get_weekly_hours_at_date(date(2026, 4, 26)) == 42


def test_monthly_hours_2026_04_25_is_176() -> None:
    """Pre-escalón: 44h × 4 semanas = 176h mensuales."""
    from backend.constants.labor_chile import get_monthly_hours_at_date  # type: ignore[import]

    assert get_monthly_hours_at_date(date(2026, 4, 25)) == 176


def test_monthly_hours_2026_04_26_is_168() -> None:
    """En escalón: 42h × 4 semanas = 168h mensuales."""
    from backend.constants.labor_chile import get_monthly_hours_at_date  # type: ignore[import]

    assert get_monthly_hours_at_date(date(2026, 4, 26)) == 168


def test_monthly_hours_multiplies_correctly_from_weekly() -> None:
    """Horas mensuales deben ser exactamente semanales × 4."""
    from backend.constants.labor_chile import get_monthly_hours_at_date, get_weekly_hours_at_date  # type: ignore[import]

    for test_date in [date(2026, 4, 25), date(2026, 4, 26), date(2026, 5, 1)]:
        expected = get_weekly_hours_at_date(test_date) * 4
        assert get_monthly_hours_at_date(test_date) == expected, (
            f"Para {test_date}: get_monthly_hours={get_monthly_hours_at_date(test_date)}, esperado={expected}"
        )
