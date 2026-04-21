"""Tests de las constantes legales de consumidor (Ley 19.496 Chile).

Pieza 4 del bloque bloque-legal-consolidation-v2.

Valida:
- Que RETRACT_DAYS_VALUE y RETRACT_DAYS_TYPE existen con los valores correctos.
- Que el módulo consumer.py contiene la URL oficial bcn.cl y la referencia Art. 3 bis.
- Que no existen strings hardcoded "10 días hábiles" (retracto) en backend/ y src/
  fuera de los archivos autorizados.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CONSUMER_PY = REPO_ROOT / "backend" / "constants" / "consumer.py"


@pytest.mark.legal
def test_retract_days_value_and_type_exist() -> None:
    """RETRACT_DAYS_VALUE debe ser 10 y RETRACT_DAYS_TYPE debe ser 'corridos'.

    Decisión batch 2026-04-20 resolución 1A:
    10 días corridos según Art. 3bis Ley 19.496 Chile.
    """
    from constants.consumer import RETRACT_DAYS_TYPE, RETRACT_DAYS_VALUE

    assert RETRACT_DAYS_VALUE == 10, f"RETRACT_DAYS_VALUE debe ser 10, es {RETRACT_DAYS_VALUE}"
    assert RETRACT_DAYS_TYPE == "corridos", f"RETRACT_DAYS_TYPE debe ser 'corridos', es '{RETRACT_DAYS_TYPE}'"


@pytest.mark.legal
def test_retract_fuente_y_url_en_docstring() -> None:
    """El módulo consumer.py debe contener la URL oficial bcn.cl y la referencia
    al Art. 3 bis Ley 19.496.

    Según CLAUDE.md §Constantes legales: todo valor con base legal debe tener
    cita del artículo + URL oficial verificable.
    """
    assert CONSUMER_PY.is_file(), f"Archivo {CONSUMER_PY} no existe"

    content = CONSUMER_PY.read_text(encoding="utf-8")

    assert "bcn.cl" in content, "consumer.py debe contener la URL oficial bcn.cl como referencia"
    assert "19.496" in content, "consumer.py debe citar Ley 19.496"
    assert "3 bis" in content or "3bis" in content, "consumer.py debe citar Art. 3 bis de Ley 19.496"


@pytest.mark.legal
def test_no_retracto_habiles_hardcoded() -> None:
    """No debe existir la frase '10 días hábiles' asociada al retracto en
    backend/*.py o src/**/*.tsx fuera de los archivos autorizados.

    La detección contextual: reporta violación solo si '10 días hábiles'
    aparece en una ventana de +/-3 líneas donde también aparece alguna de
    las palabras clave de retracto ('retracto', 'retractar', 'retractarse',
    'Art. 3 bis', 'Art. 3bis', 'Ley 19.496').

    Esto preserva usos legítimos de '10 días hábiles' no relacionados con
    retracto (plazos de pago, apelaciones de moderación, finiquitos
    laborales, etc.) que sí deben mantenerse.

    Canon: 10 días corridos según Art. 3 bis letra b, Ley 19.496 Chile.
    Decisión batch 2026-04-20 resolución 1A.
    """
    pattern_retracto = "10 días hábiles"
    retracto_keywords = (
        "retracto",
        "retractar",
        "retractarse",
        "art. 3 bis",
        "art. 3bis",
        "art 3 bis",
        "ley 19.496",
    )
    window = 3

    backend_dir = REPO_ROOT / "backend"
    src_dir = REPO_ROOT / "src"

    violations: list[str] = []

    def scan(fpath: Path) -> None:
        rel = fpath.relative_to(REPO_ROOT)
        if "tests/" in str(rel) or "consumer.py" in str(rel):
            return
        content = fpath.read_text(encoding="utf-8", errors="ignore")
        if pattern_retracto not in content:
            return
        lines = content.splitlines()
        for i, line in enumerate(lines):
            if pattern_retracto not in line:
                continue
            lo = max(0, i - window)
            hi = min(len(lines), i + window + 1)
            ctx = " ".join(lines[lo:hi]).lower()
            if any(kw in ctx for kw in retracto_keywords):
                violations.append(f"{rel}:{i + 1}: {line.strip()}")

    for fpath in backend_dir.rglob("*.py"):
        scan(fpath)
    for fpath in src_dir.rglob("*.tsx"):
        scan(fpath)

    assert not violations, (
        f"Se encontraron {len(violations)} instancias de '{pattern_retracto}' "
        f"asociadas a retracto. Usar '10 días corridos' conforme a "
        f"backend/constants/consumer.py (RETRACT_DAYS_VALUE/RETRACT_DAYS_TYPE).\n" + "\n".join(violations)
    )
