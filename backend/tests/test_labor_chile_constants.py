"""Tests de invariantes para backend/constants/labor_chile.py.

Ciclo TDD RED: este archivo se escribe ANTES de crear labor_chile.py.
Debe fallar en su totalidad al correrlo la primera vez.

Cada test verifica:
1. El valor numérico exacto de la constante.
2. Que la constante tiene el bloque de 4 líneas de cita legal.
3. Comportamiento de las funciones de fecha de corte.
"""

from __future__ import annotations

import ast
import inspect
import re
from datetime import date
from decimal import Decimal
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers de introspección para verificar las citas 4-líneas
# ---------------------------------------------------------------------------


def _get_labor_chile_source() -> str:
    """Retorna el código fuente de labor_chile.py como string."""
    module_path = Path(__file__).parent.parent / "constants" / "labor_chile.py"
    return module_path.read_text(encoding="utf-8")


def _constant_has_four_line_citation(source: str, constant_name: str) -> bool:
    """
    Verifica que la constante tiene bloque de 4 líneas inmediatamente antes:
    - línea 1: cita del artículo/ley
    - línea 2: URL oficial
    - línea 3: fecha de verificación
    - línea 4: verificador
    """
    # Busca bloques de comentario antes de la asignación de la constante
    pattern = rf"#[^\n]+\n#[^\n]+\n#[^\n]+\n#[^\n]+\n{re.escape(constant_name)}\s*[:=]"
    return bool(re.search(pattern, source))


# ---------------------------------------------------------------------------
# Valores numéricos de constantes — RED tests
# ---------------------------------------------------------------------------


def test_uf_abril_2026_value() -> None:
    """UF vigente abril 2026 debe ser $39.841,72 según SII."""
    from backend.constants.labor_chile import UF_ABRIL_2026  # type: ignore[import]

    assert Decimal("39841.72") == UF_ABRIL_2026


def test_utm_abril_2026_value() -> None:
    """UTM abril 2026 debe ser $69.889 según SII."""
    from backend.constants.labor_chile import UTM_ABRIL_2026  # type: ignore[import]

    assert Decimal("69889") == UTM_ABRIL_2026


def test_sueldo_minimo_2026_value() -> None:
    """Sueldo mínimo 2026 debe ser $539.000 según Ley 21.751."""
    from backend.constants.labor_chile import SUELDO_MINIMO_2026  # type: ignore[import]

    assert SUELDO_MINIMO_2026 == 539_000


def test_afp_obligatoria_pct_value() -> None:
    """Cotización AFP obligatoria 10% según DL 3500 Art. 17."""
    from backend.constants.labor_chile import AFP_OBLIGATORIA_PCT  # type: ignore[import]

    assert Decimal("0.10") == AFP_OBLIGATORIA_PCT


def test_afp_uno_commission_pct_value() -> None:
    """AFP UNO comisión 0.46% (default novatos desde 2023-10-01)."""
    from backend.constants.labor_chile import AFP_UNO_COMMISSION_PCT  # type: ignore[import]

    assert Decimal("0.0046") == AFP_UNO_COMMISSION_PCT


def test_afc_trabajador_indefinido_pct_value() -> None:
    """AFC trabajador contrato indefinido 0.6% según Ley 19.728."""
    from backend.constants.labor_chile import AFC_TRABAJADOR_INDEFINIDO_PCT  # type: ignore[import]

    assert Decimal("0.006") == AFC_TRABAJADOR_INDEFINIDO_PCT


def test_afc_empleador_indefinido_pct_value() -> None:
    """AFC empleador contrato indefinido 2.4% según Ley 19.728."""
    from backend.constants.labor_chile import AFC_EMPLEADOR_INDEFINIDO_PCT  # type: ignore[import]

    assert Decimal("0.024") == AFC_EMPLEADOR_INDEFINIDO_PCT


def test_afc_empleador_plazo_fijo_pct_value() -> None:
    """AFC empleador contrato plazo fijo 3.0% según Ley 19.728."""
    from backend.constants.labor_chile import AFC_EMPLEADOR_PLAZO_FIJO_PCT  # type: ignore[import]

    assert Decimal("0.03") == AFC_EMPLEADOR_PLAZO_FIJO_PCT


def test_sis_pct_value() -> None:
    """SIS 1.54% según Superintendencia Pensiones enero 2026."""
    from backend.constants.labor_chile import SIS_PCT  # type: ignore[import]

    assert Decimal("0.0154") == SIS_PCT


def test_tope_imponible_afp_uf_value() -> None:
    """Tope imponible AFP 81.6 UF según DL 3500."""
    from backend.constants.labor_chile import TOPE_IMPONIBLE_AFP_UF  # type: ignore[import]

    assert Decimal("81.6") == TOPE_IMPONIBLE_AFP_UF


def test_tope_imponible_afc_uf_value() -> None:
    """Tope imponible AFC 135.2 UF desde febrero 2026 (spensiones.cl D-B aprobado)."""
    from backend.constants.labor_chile import TOPE_IMPONIBLE_AFC_UF  # type: ignore[import]

    assert Decimal("135.2") == TOPE_IMPONIBLE_AFC_UF


def test_weekly_hours_pre_value() -> None:
    """Jornada pre-2026-04-26: 44h (Ley 21.561 escalón 1, vigente desde abril 2024)."""
    from backend.constants.labor_chile import WEEKLY_HOURS_PRE_42H  # type: ignore[import]

    assert WEEKLY_HOURS_PRE_42H == 44


def test_weekly_hours_post_value() -> None:
    """Jornada desde 2026-04-26: 42h (Ley 21.561 escalón 2)."""
    from backend.constants.labor_chile import WEEKLY_HOURS_POST_42H  # type: ignore[import]

    assert WEEKLY_HOURS_POST_42H == 42


def test_fecha_escalon_42h_value() -> None:
    """Fecha exacta del escalón 42h: 2026-04-26."""
    from backend.constants.labor_chile import FECHA_ESCALON_42H  # type: ignore[import]

    assert date(2026, 4, 26) == FECHA_ESCALON_42H


def test_gratificacion_tope_imm_value() -> None:
    """Tope gratificación legal 4.75 IMM según Art. 50 CT."""
    from backend.constants.labor_chile import GRATIFICACION_TOPE_IMM  # type: ignore[import]

    assert Decimal("4.75") == GRATIFICACION_TOPE_IMM


# ---------------------------------------------------------------------------
# Función get_weekly_hours_at_date — casos de borde críticos
# ---------------------------------------------------------------------------


def test_get_weekly_hours_before_escalon_42h() -> None:
    """Día anterior al escalón 42h debe retornar 44."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 4, 25)) == 44


def test_get_weekly_hours_on_escalon_42h() -> None:
    """Día exacto del escalón 42h (2026-04-26) debe retornar 42."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 4, 26)) == 42


def test_get_weekly_hours_after_escalon_42h() -> None:
    """Día posterior al escalón 42h (2026-05-01) debe retornar 42."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2026, 5, 1)) == 42


def test_get_weekly_hours_much_before_escalon_42h() -> None:
    """Fecha anterior al escalón (2024-12-01) debe retornar 44."""
    from backend.constants.labor_chile import get_weekly_hours_at_date  # type: ignore[import]

    assert get_weekly_hours_at_date(date(2024, 12, 1)) == 44


# ---------------------------------------------------------------------------
# Función get_monthly_hours_at_date
# ---------------------------------------------------------------------------


def test_get_monthly_hours_before_escalon_42h() -> None:
    """Mes completo anterior al escalón: 44 * 4 = 176 horas."""
    from backend.constants.labor_chile import get_monthly_hours_at_date  # type: ignore[import]

    assert get_monthly_hours_at_date(date(2026, 4, 25)) == 176


def test_get_monthly_hours_on_escalon_42h() -> None:
    """Desde el día del escalón en adelante: 42 * 4 = 168 horas."""
    from backend.constants.labor_chile import get_monthly_hours_at_date  # type: ignore[import]

    assert get_monthly_hours_at_date(date(2026, 4, 26)) == 168


def test_get_monthly_hours_after_escalon_42h() -> None:
    """Mayo 2026 en adelante: 168 horas."""
    from backend.constants.labor_chile import get_monthly_hours_at_date  # type: ignore[import]

    assert get_monthly_hours_at_date(date(2026, 5, 1)) == 168


# ---------------------------------------------------------------------------
# Verificación de estructura: bloque 4-líneas de cita legal
# ---------------------------------------------------------------------------


def test_each_numeric_constant_has_citation_block() -> None:
    """
    Cada constante numérica en labor_chile.py debe tener bloque 4-líneas
    de comentario antes de su asignación.
    Patrón: 4 líneas de comentario consecutivas seguidas de NOMBRE_CONSTANTE =
    """
    source = _get_labor_chile_source()
    constants_to_check = [
        "UF_ABRIL_2026",
        "UTM_ABRIL_2026",
        "SUELDO_MINIMO_2026",
        "AFP_OBLIGATORIA_PCT",
        "AFP_UNO_COMMISSION_PCT",
        "AFC_TRABAJADOR_INDEFINIDO_PCT",
        "AFC_EMPLEADOR_INDEFINIDO_PCT",
        "AFC_EMPLEADOR_PLAZO_FIJO_PCT",
        "SIS_PCT",
        "TOPE_IMPONIBLE_AFP_UF",
        "TOPE_IMPONIBLE_AFC_UF",
        "WEEKLY_HOURS_PRE_42H",
        "WEEKLY_HOURS_POST_42H",
        "GRATIFICACION_TOPE_IMM",
    ]
    missing_citations: list[str] = []
    for const in constants_to_check:
        if not _constant_has_four_line_citation(source, const):
            missing_citations.append(const)

    assert not missing_citations, f"Constantes sin bloque 4-líneas de cita legal: {missing_citations}"


def test_citation_blocks_contain_url() -> None:
    """Cada bloque de cita debe contener una URL (https://)."""
    source = _get_labor_chile_source()
    # Busca líneas de comentario que deberían tener URL
    comment_blocks = re.findall(r"((?:#[^\n]+\n){4})", source)
    blocks_without_url: list[str] = []
    for block in comment_blocks:
        if "https://" not in block:
            # Solo flagear bloques que estén antes de una constante de nombre en mayúsculas
            # (patrones de constantes legales, no bloques descriptivos)
            if re.search(
                r"[A-Z_]{5,}\s*[:=]", source[source.find(block) + len(block) : source.find(block) + len(block) + 100]
            ):
                blocks_without_url.append(block.strip())

    assert not blocks_without_url, f"Bloques de cita sin URL oficial: {blocks_without_url}"
