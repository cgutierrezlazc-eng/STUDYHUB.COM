"""Tests del módulo rubric_parser.

Cubre parse_rubric() con ~12 casos: estructuras con headers + bullets +
puntajes, texto sin estructura (retorna [] + warning), líneas vacías,
formatos de puntaje variados, texto muy corto.

TDD: estos tests se escriben ANTES del módulo rubric_parser.py.
"""

from __future__ import annotations

import sys
import os

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest


# ─── Importación tardía para RED claro ────────────────────────────


def get_parser():
    """Importa parse_rubric desde rubric_parser."""
    from rubric_parser import parse_rubric  # type: ignore
    return parse_rubric


# ─── Tests de parsing estructurado ────────────────────────────────


def test_parse_returns_list_type():
    """parse_rubric siempre retorna (list, list[str])."""
    parse_rubric = get_parser()
    items, warnings = parse_rubric("")
    assert isinstance(items, list)
    assert isinstance(warnings, list)


def test_parse_empty_text_returns_empty_with_warning():
    """Texto vacío → [] y warning sobre parsing manual."""
    parse_rubric = get_parser()
    items, warnings = parse_rubric("")
    assert items == []
    assert len(warnings) >= 1
    assert "manualmente" in warnings[0].lower() or "parsear" in warnings[0].lower()


def test_parse_very_short_text_returns_empty():
    """Texto muy corto (< 10 chars) → []."""
    parse_rubric = get_parser()
    items, warnings = parse_rubric("Hola")
    assert items == []
    assert len(warnings) >= 1


def test_parse_bullets_dash_basic():
    """Lista con bullets '-' genera items, uno por bullet."""
    parse_rubric = get_parser()
    text = """Criterios de evaluación:
- Introducción clara
- Desarrollo coherente
- Conclusiones adecuadas
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 3
    # Cada item tiene los campos esperados
    for item in items:
        assert "id" in item
        assert "title" in item
        assert "points" in item
        assert "description" in item


def test_parse_bullets_asterisk():
    """Lista con bullets '*' genera items."""
    parse_rubric = get_parser()
    text = """Sección 1:
* Ortografía correcta
* Formato adecuado
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 2


def test_parse_numbered_list():
    """Lista numerada '1.' '2.' genera items."""
    parse_rubric = get_parser()
    text = """Rúbrica:
1. Presentación del tema
2. Argumentación
3. Conclusiones
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 3


def test_parse_letter_list():
    """Lista con letras 'a)' 'b)' genera items."""
    parse_rubric = get_parser()
    text = """Criterios:
a) Comprensión del tema
b) Uso de fuentes
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 2


def test_parse_points_parenthesis_format():
    """Formato '(X pts)' extrae puntaje numérico."""
    parse_rubric = get_parser()
    text = """Rúbrica de ensayo:
- Introducción (20 pts)
- Desarrollo (50 pts)
- Conclusión (30 pts)
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 3
    # Verificar que al menos uno tiene puntaje extraído
    total = sum(item["points"] for item in items)
    assert total > 0


def test_parse_points_puntos_format():
    """Formato '(X puntos)' extrae puntaje."""
    parse_rubric = get_parser()
    text = """Evaluación:
- Claridad (10 puntos)
- Profundidad (15 puntos)
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 2
    assert items[0]["points"] == 10
    assert items[1]["points"] == 15


def test_parse_points_dash_format():
    """Formato '- X pts' al final del texto extrae puntaje."""
    parse_rubric = get_parser()
    text = """Criterios:
- Redacción - 25 pts
- Coherencia - 30 pts
"""
    items, warnings = parse_rubric(text)
    assert len(items) == 2
    total_pts = sum(item["points"] for item in items)
    assert total_pts > 0


def test_parse_no_structure_returns_empty_with_warning():
    """Texto sin estructura detectada → [] con warning."""
    parse_rubric = get_parser()
    text = "Este es un texto libre sin criterios ni bullets ni listas numeradas."
    items, warnings = parse_rubric(text)
    assert items == []
    assert len(warnings) >= 1
    assert "manualmente" in warnings[0].lower() or "parsear" in warnings[0].lower()


def test_parse_with_empty_lines_ignored():
    """Líneas vacías entre bullets no generan items extra."""
    parse_rubric = get_parser()
    text = """Criterios:

- Item uno

- Item dos

- Item tres

"""
    items, warnings = parse_rubric(text)
    assert len(items) == 3


def test_parse_ids_are_unique():
    """Cada RubricItem tiene id único."""
    parse_rubric = get_parser()
    text = """Rúbrica:
- Criterio A (10 pts)
- Criterio B (20 pts)
- Criterio C (30 pts)
"""
    items, _ = parse_rubric(text)
    ids = [item["id"] for item in items]
    assert len(ids) == len(set(ids))


def test_parse_header_uppercase_detected():
    """Header en mayúsculas termina en ':' o '.' es detectado como sección."""
    parse_rubric = get_parser()
    text = """CRITERIOS DE EVALUACIÓN:
- Estructura lógica
- Ortografía

REFERENCIAS:
- Formato APA correcto
"""
    items, _ = parse_rubric(text)
    # Debe haber al menos los 3 bullets
    assert len(items) >= 3


def test_parse_mixed_pts_formats():
    """Mezcla de formatos de puntaje en la misma rúbrica."""
    parse_rubric = get_parser()
    text = """Rúbrica mixta:
- Introducción (15 pts)
- Marco teórico (20 puntos)
- Metodología - 25 pts
- Resultados sin puntaje
"""
    items, _ = parse_rubric(text)
    assert len(items) == 4
    # Los tres primeros tienen puntaje
    assert items[0]["points"] == 15
    assert items[1]["points"] == 20
    # El cuarto tiene puntaje 0 (no detectado)
    assert items[3]["points"] == 0
