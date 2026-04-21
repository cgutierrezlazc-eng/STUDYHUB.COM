"""Tests de invariantes para backend/constants/tax_chile.py.

Ciclo TDD RED: este archivo se escribe ANTES de crear tax_chile.py.
Debe fallar en su totalidad al correrlo la primera vez.
"""

from __future__ import annotations

import re
from decimal import Decimal
from pathlib import Path


# ---------------------------------------------------------------------------
# Helper de introspección
# ---------------------------------------------------------------------------


def _get_tax_chile_source() -> str:
    module_path = Path(__file__).parent.parent / "constants" / "tax_chile.py"
    return module_path.read_text(encoding="utf-8")


def _constant_has_four_line_citation(source: str, constant_name: str) -> bool:
    pattern = rf"#[^\n]+\n#[^\n]+\n#[^\n]+\n#[^\n]+\n{re.escape(constant_name)}\s*[:=]"
    return bool(re.search(pattern, source))


# ---------------------------------------------------------------------------
# Constantes básicas
# ---------------------------------------------------------------------------


def test_iva_pct_value() -> None:
    """IVA 19% según DL 825."""
    from backend.constants.tax_chile import IVA_PCT  # type: ignore[import]

    assert Decimal("0.19") == IVA_PCT


def test_retencion_honorarios_2026_value() -> None:
    """Retención boleta honorarios 15.25% desde 2026-01-01 según Ley 21.133."""
    from backend.constants.tax_chile import RETENCION_HONORARIOS_2026_PCT  # type: ignore[import]

    assert Decimal("0.1525") == RETENCION_HONORARIOS_2026_PCT


def test_ppm_propyme_14d3_value() -> None:
    """PPM ProPyme régimen 14D3 transparente 0.25% según SII."""
    from backend.constants.tax_chile import PPM_PROPYME_14D3_PCT  # type: ignore[import]

    assert Decimal("0.0025") == PPM_PROPYME_14D3_PCT


# ---------------------------------------------------------------------------
# Tabla de tramos impuesto 2ª categoría 2026
# ---------------------------------------------------------------------------


def test_tax_brackets_2026_has_8_tramos() -> None:
    """La tabla de impuesto 2ª cat 2026 debe tener 8 tramos."""
    from backend.constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # type: ignore[import]

    assert len(IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM) == 8


def test_tax_brackets_2026_first_tramo_exento() -> None:
    """Primer tramo 0-13.5 UTM exento (tasa 0)."""
    from backend.constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # type: ignore[import]

    lower, upper, rate, _ = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[0]
    assert Decimal("0") == lower
    assert Decimal("13.5") == upper
    assert Decimal("0") == rate


def test_tax_brackets_2026_last_tramo_starts_at_310_utm() -> None:
    """Último tramo inicia en 310 UTM con tasa 40%."""
    from backend.constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # type: ignore[import]

    lower, upper, rate, _ = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[-1]
    assert Decimal("310") == lower
    assert upper is None  # último tramo: sin límite superior
    assert Decimal("0.40") == rate


def test_tax_brackets_2026_second_tramo() -> None:
    """Segundo tramo 13.5-30 UTM con tasa 4%."""
    from backend.constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # type: ignore[import]

    lower, upper, rate, _ = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[1]
    assert Decimal("13.5") == lower
    assert Decimal("30") == upper
    assert Decimal("0.04") == rate


def test_tax_brackets_2026_tramo_values_are_decimal() -> None:
    """Todos los valores numéricos en la tabla deben ser Decimal."""
    from backend.constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # type: ignore[import]

    for i, tramo in enumerate(IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM):
        lower, upper, rate, deduction = tramo
        assert isinstance(lower, Decimal), f"tramo {i}: lower no es Decimal"
        if upper is not None:
            assert isinstance(upper, Decimal), f"tramo {i}: upper no es Decimal"
        assert isinstance(rate, Decimal), f"tramo {i}: rate no es Decimal"
        assert isinstance(deduction, Decimal), f"tramo {i}: deduction no es Decimal"


def test_tax_brackets_2026_tramos_son_continuos() -> None:
    """Cada tramo comienza donde termina el anterior (continuidad)."""
    from backend.constants.tax_chile import IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM  # type: ignore[import]

    for i in range(len(IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM) - 1):
        _, upper_current, _, _ = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[i]
        lower_next, _, _, _ = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[i + 1]
        assert upper_current == lower_next, (
            f"Discontinuidad entre tramo {i} y {i + 1}: upper={upper_current} != lower_next={lower_next}"
        )


# ---------------------------------------------------------------------------
# Verificación de citas 4-líneas
# ---------------------------------------------------------------------------


def test_each_numeric_constant_has_citation_block() -> None:
    """Cada constante numérica en tax_chile.py debe tener bloque 4-líneas."""
    source = _get_tax_chile_source()
    constants_to_check = [
        "IVA_PCT",
        "RETENCION_HONORARIOS_2026_PCT",
        "PPM_PROPYME_14D3_PCT",
    ]
    missing: list[str] = []
    for const in constants_to_check:
        if not _constant_has_four_line_citation(source, const):
            missing.append(const)
    assert not missing, f"Constantes sin cita 4-líneas: {missing}"


def test_citation_blocks_contain_url() -> None:
    """Cada bloque de cita en tax_chile.py debe tener URL https://."""
    source = _get_tax_chile_source()
    comment_blocks = re.findall(r"((?:#[^\n]+\n){4})", source)
    blocks_without_url: list[str] = []
    for block in comment_blocks:
        if "https://" not in block:
            pos = source.find(block) + len(block)
            if re.search(r"[A-Z_]{5,}\s*[:=]", source[pos : pos + 100]):
                blocks_without_url.append(block.strip())
    assert not blocks_without_url, f"Bloques sin URL: {blocks_without_url}"
