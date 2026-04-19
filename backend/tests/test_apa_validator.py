"""Tests TDD para apa_validator.py — módulo de validación y formateo APA 7.

Cubre:
- format_author: autor único, múltiples autores, 21+ autores
- format_year: año válido, sin paréntesis, None
- format_reference_book: formato completo, sin ciudad (APA 7 eliminó ciudad)
- format_reference_journal: con DOI, sin DOI, DOI mal formado
- format_reference_web: con fecha de publicación (sin "Recuperado de"),
  sin fecha (con "Recuperado de")
- validate_citation: cita en texto válida, errores comunes detectados

Fuentes APA 7:
- American Psychological Association. (2020). Publication manual of the
  American Psychological Association (7th ed.). https://doi.org/10.1037/0000165-000
- https://apastyle.apa.org/style-grammar-guidelines/references/
"""

from __future__ import annotations

import sys
import os

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest


# ─── format_author ────────────────────────────────────────────────


def test_format_author_unico() -> None:
    """Autor único → Apellido, N.I."""
    from apa_validator import format_author

    result = format_author("García", "Carlos")
    assert result == "García, C."


def test_format_author_segundo_nombre() -> None:
    """Nombre compuesto: solo primera inicial de cada nombre."""
    from apa_validator import format_author

    result = format_author("Smith", "John Michael")
    assert result == "Smith, J. M."


def test_format_author_dos_autores_lista() -> None:
    """Lista de dos autores se une con &."""
    from apa_validator import format_author_list

    result = format_author_list([("García", "Carlos"), ("López", "María")])
    assert result == "García, C., & López, M."


def test_format_author_tres_autores_lista() -> None:
    """Tres autores: coma entre todos, & antes del último."""
    from apa_validator import format_author_list

    result = format_author_list([("García", "Carlos"), ("López", "María"), ("Pérez", "Juan")])
    assert result == "García, C., López, M., & Pérez, J."


def test_format_author_veinte_autores() -> None:
    """20 autores: todos listados (límite APA 7 antes del elipsis)."""
    from apa_validator import format_author_list

    autores = [("Autor" + str(i), "A") for i in range(1, 21)]
    result = format_author_list(autores)
    # Debe contener a los 20 autores y terminar en el último
    assert "Autor20, A." in result
    assert "..." not in result
    assert result.endswith("Autor20, A.")


def test_format_author_veintiun_autores() -> None:
    """21 autores → primeros 19 + ... + último (APA 7 p. 286)."""
    from apa_validator import format_author_list

    autores = [("Autor" + str(i), "A") for i in range(1, 22)]
    result = format_author_list(autores)
    assert "Autor19, A." in result
    assert ". . ." in result or "…" in result
    assert "Autor21, A." in result
    assert "Autor20, A." not in result  # el 20 se omite con elipsis


# ─── format_year ──────────────────────────────────────────────────


def test_format_year_entero() -> None:
    """Año entero → envuelto en paréntesis."""
    from apa_validator import format_year

    assert format_year(2023) == "(2023)"


def test_format_year_string() -> None:
    """Año como string → envuelto en paréntesis."""
    from apa_validator import format_year

    assert format_year("2023") == "(2023)"


def test_format_year_sin_datos() -> None:
    """Sin año → (s.f.) = sin fecha, convención APA en español."""
    from apa_validator import format_year

    assert format_year(None) == "(s.f.)"


def test_format_year_string_vacio() -> None:
    """String vacío → (s.f.)."""
    from apa_validator import format_year

    assert format_year("") == "(s.f.)"


# ─── format_reference_book ────────────────────────────────────────


def test_format_reference_book_completo() -> None:
    """Referencia libro completa. APA 7 elimina ciudad (no va más).

    Formato: Apellido, N. (año). Título en cursiva. Editorial.
    En texto plano simulamos cursiva con el título tal cual (sin markdown).
    """
    from apa_validator import format_reference_book

    result = format_reference_book(
        author="García, C.",
        year="2021",
        title="Metodología de la investigación",
        publisher="McGraw-Hill",
    )
    assert result == "García, C. (2021). Metodología de la investigación. McGraw-Hill."


def test_format_reference_book_con_edicion() -> None:
    """Libro con edición → (N.ª ed.) antes del punto de editorial."""
    from apa_validator import format_reference_book

    result = format_reference_book(
        author="Hernández, R.",
        year="2014",
        title="Metodología de la investigación",
        publisher="McGraw-Hill",
        edition="6",
    )
    assert "(6.ª ed.)" in result
    assert result.endswith("McGraw-Hill.")


def test_format_reference_book_sin_year() -> None:
    """Sin año → (s.f.) en la referencia."""
    from apa_validator import format_reference_book

    result = format_reference_book(
        author="López, J.",
        year=None,
        title="Sin fecha",
        publisher="Editorial Test",
    )
    assert "(s.f.)" in result


def test_format_reference_book_city_ignorada() -> None:
    """APA 7 eliminó la ciudad. Si se pasa city, se ignora silenciosamente."""
    from apa_validator import format_reference_book

    result = format_reference_book(
        author="García, C.",
        year="2021",
        title="Título",
        publisher="Editorial",
        city="Santiago",  # debe ignorarse en APA 7
    )
    assert "Santiago" not in result


# ─── format_reference_journal ─────────────────────────────────────


def test_format_reference_journal_con_doi() -> None:
    """Artículo de revista con DOI.

    Formato APA 7: Apellido, N. (año). Título del artículo. Revista, volumen(número), páginas. https://doi.org/xxx
    """
    from apa_validator import format_reference_journal

    result = format_reference_journal(
        author="Smith, J.",
        year="2020",
        title="Advances in machine learning",
        journal="Journal of AI Research",
        volume="15",
        issue="3",
        pages="45-67",
        doi="10.1234/jair.2020.001",
    )
    assert "Smith, J." in result
    assert "(2020)" in result
    assert "Advances in machine learning" in result
    assert "Journal of AI Research" in result
    assert "15(3)" in result
    assert "45-67" in result
    assert "https://doi.org/10.1234/jair.2020.001" in result


def test_format_reference_journal_sin_doi() -> None:
    """Artículo sin DOI → sin URL al final."""
    from apa_validator import format_reference_journal

    result = format_reference_journal(
        author="García, C.",
        year="2019",
        title="Educación en Chile",
        journal="Revista de Educación",
        volume="22",
        issue="1",
        pages="10-25",
        doi=None,
    )
    assert "https://doi.org" not in result
    assert result.endswith("10-25.")


def test_format_reference_journal_sin_issue() -> None:
    """Volumen sin número de issue → solo volumen sin paréntesis de issue."""
    from apa_validator import format_reference_journal

    result = format_reference_journal(
        author="Test, A.",
        year="2021",
        title="Artículo",
        journal="Revista",
        volume="10",
        issue=None,
        pages="1-5",
        doi=None,
    )
    # El volumen aparece sin paréntesis de número
    assert "10," in result or "10." in result
    assert "(None)" not in result
    assert "10()" not in result


# ─── format_reference_web ─────────────────────────────────────────


def test_format_reference_web_con_fecha_publicacion() -> None:
    """Web con fecha de publicación → sin "Recuperado de" (APA 7).

    Formato: Apellido, N. (año, Mes día). Título. Nombre del sitio. URL
    """
    from apa_validator import format_reference_web

    result = format_reference_web(
        author="Pérez, M.",
        year="2023",
        title="Aprendizaje activo en universidades",
        site="Conniku Blog",
        url="https://conniku.com/blog/aprendizaje-activo",
        retrieved=None,  # tiene fecha de publicación, no cambia
    )
    assert "Pérez, M." in result
    assert "(2023)" in result
    assert "Aprendizaje activo en universidades" in result
    assert "Conniku Blog" in result
    assert "https://conniku.com/blog/aprendizaje-activo" in result
    assert "Recuperado de" not in result


def test_format_reference_web_sin_fecha_con_recuperado() -> None:
    """Web sin fecha de publicación (contenido que cambia) → "Recuperado de" + fecha."""
    from apa_validator import format_reference_web

    result = format_reference_web(
        author="Organización Test",
        year=None,
        title="Estadísticas en tiempo real",
        site="Portal de Datos",
        url="https://portal.cl/estadisticas",
        retrieved="15 de abril de 2026",
    )
    assert "(s.f.)" in result
    assert "Recuperado de" in result
    assert "15 de abril de 2026" in result


# ─── validate_citation ────────────────────────────────────────────


def test_validate_citation_valida() -> None:
    """Cita en texto válida → valid=True, sin errores."""
    from apa_validator import validate_citation

    result = validate_citation("(García, 2021)")
    assert result["valid"] is True
    assert result["errors"] == []


def test_validate_citation_valida_con_pagina() -> None:
    """Cita con página válida → valid=True."""
    from apa_validator import validate_citation

    result = validate_citation("(García, 2021, p. 45)")
    assert result["valid"] is True


def test_validate_citation_sin_parentesis() -> None:
    """Cita sin paréntesis → error detectado."""
    from apa_validator import validate_citation

    result = validate_citation("García, 2021")
    assert result["valid"] is False
    assert any("paréntesis" in e.lower() for e in result["errors"])


def test_validate_citation_anno_sin_coma() -> None:
    """Año sin coma separadora del autor → error detectado."""
    from apa_validator import validate_citation

    result = validate_citation("(García 2021)")
    assert result["valid"] is False
    assert any("coma" in e.lower() for e in result["errors"])


def test_validate_citation_suggested_presente() -> None:
    """El campo suggested siempre está presente, aunque sea string vacío."""
    from apa_validator import validate_citation

    result = validate_citation("García 2021")
    assert "suggested" in result
    assert isinstance(result["suggested"], str)
