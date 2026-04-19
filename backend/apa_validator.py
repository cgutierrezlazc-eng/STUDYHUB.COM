"""Validador y formateador APA 7 para el sub-bloque 2d.1 Workspaces.

Funciones puras de formato y validación de citas/referencias según APA 7
(Publication Manual of the American Psychological Association, 7ª ed., 2020).

Reglas canónicas (https://apastyle.apa.org/style-grammar-guidelines/references):
- Autores: `Apellido, I. N.` (iniciales con punto por nombre compuesto)
- 1-20 autores: listar todos, unir con `, ` y `& ` antes del último
- 21+ autores: primeros 19, `...`, último (sin ampersand)
- Año: `(YYYY)` o `(s.f.)` si no hay año
- Libro: `Autor. (año). Título. Editorial.` (APA 7 ELIMINÓ la ciudad)
- Edición: `(N.ª ed.)` (ordinal español) después del título
- Journal: `Autor. (año). Título artículo. Revista, volumen(issue), páginas. doi`
- Web: con fecha pub → sin "Recuperado de"; sin fecha → con "Recuperado de"
"""

from __future__ import annotations

import re
from typing import Optional

# ─── Formato de autores ──────────────────────────────────────────────


def _initials(first_name: str) -> str:
    """Extrae iniciales con punto de un nombre (puede ser compuesto).

    "Carlos" → "C."
    "John Michael" → "J. M."
    """
    if not first_name:
        return ""
    parts = [p for p in first_name.strip().split() if p]
    return " ".join(f"{p[0].upper()}." for p in parts)


def format_author(last: str, first: str) -> str:
    """Formatea un autor único como 'Apellido, I.' siguiendo APA 7."""
    last = (last or "").strip()
    initials = _initials(first or "")
    if initials:
        return f"{last}, {initials}"
    return last


def format_author_list(authors: list[tuple[str, str]]) -> str:
    """Formatea una lista de autores según APA 7.

    - 1 autor: "Apellido, I."
    - 2-20 autores: todos, unidos con ", " y "& " antes del último
    - 21+ autores: primeros 19, "...", último (sin "&")
    """
    if not authors:
        return ""

    formatted = [format_author(last, first) for last, first in authors]
    n = len(formatted)

    if n == 1:
        return formatted[0]

    if n <= 20:
        # Todos los autores: separador coma, & antes del último
        return ", ".join(formatted[:-1]) + f", & {formatted[-1]}"

    # 21+ autores: primeros 19 + elipsis + último
    first_19 = ", ".join(formatted[:19])
    return f"{first_19}, . . . {formatted[-1]}"


# ─── Formato de año ──────────────────────────────────────────────────


def format_year(year: Optional[object]) -> str:
    """Envuelve el año en paréntesis. Sin año → '(s.f.)' (sin fecha, ES)."""
    if year is None:
        return "(s.f.)"
    s = str(year).strip()
    if not s:
        return "(s.f.)"
    return f"({s})"


# ─── Formato de referencias ──────────────────────────────────────────


def _ordinal_edition_es(edition: str) -> str:
    """Convierte '6' → '6.ª ed.' (español APA 7)."""
    return f"{edition}.ª ed."


def format_reference_book(
    author: str,
    year: Optional[object],
    title: str,
    publisher: str,
    edition: Optional[str] = None,
    city: Optional[str] = None,  # IGNORADA — APA 7 eliminó ciudad
) -> str:
    """Formatea una referencia de libro APA 7.

    Formato: `Autor. (año). Título (edición). Editorial.`

    APA 7 eliminó la ciudad editorial; si se pasa `city`, se ignora.
    """
    year_str = format_year(year)
    title_clean = (title or "").strip()
    publisher_clean = (publisher or "").strip()

    if edition and str(edition).strip():
        title_with_ed = f"{title_clean} ({_ordinal_edition_es(str(edition).strip())})"
    else:
        title_with_ed = title_clean

    return f"{author} {year_str}. {title_with_ed}. {publisher_clean}."


def format_reference_journal(
    author: str,
    year: Optional[object],
    title: str,
    journal: str,
    volume: Optional[object],
    issue: Optional[object],
    pages: Optional[str],
    doi: Optional[str],
) -> str:
    """Formatea una referencia de artículo de revista APA 7.

    Formato: `Autor. (año). Título artículo. Revista, volumen(issue), páginas. doi`

    Sin issue: solo volumen sin paréntesis.
    Sin DOI: omitir URL final.
    """
    year_str = format_year(year)
    title_clean = (title or "").strip()
    journal_clean = (journal or "").strip()

    # Volumen con o sin issue
    vol_str = str(volume).strip() if volume is not None else ""
    if issue is not None and str(issue).strip():
        volume_part = f"{vol_str}({str(issue).strip()})"
    else:
        volume_part = vol_str

    # Páginas
    pages_part = f", {pages.strip()}" if pages and pages.strip() else ""

    # DOI opcional
    doi_part = ""
    if doi and doi.strip():
        doi_clean = doi.strip()
        if not doi_clean.startswith("http"):
            doi_clean = f"https://doi.org/{doi_clean}"
        doi_part = f" {doi_clean}"

    return f"{author} {year_str}. {title_clean}. {journal_clean}, {volume_part}{pages_part}.{doi_part}"


def format_reference_web(
    author: str,
    year: Optional[object],
    title: str,
    site: str,
    url: str,
    retrieved: Optional[str] = None,
) -> str:
    """Formatea una referencia web APA 7.

    - Con fecha de publicación (year): sin "Recuperado de"
    - Sin fecha (year None): con "Recuperado de [fecha]"

    Formato: `Autor. (año). Título. Sitio. URL`
             `Autor. (s.f.). Título. Sitio. Recuperado de [fecha], [url]`
    """
    year_str = format_year(year)
    title_clean = (title or "").strip()
    site_clean = (site or "").strip()
    url_clean = (url or "").strip()

    base = f"{author} {year_str}. {title_clean}. {site_clean}."

    if year is None or (isinstance(year, str) and not year.strip()):
        # Sin fecha de publicación → "Recuperado de [fecha], [url]"
        if retrieved and retrieved.strip():
            return f"{base} Recuperado de {retrieved.strip()}, {url_clean}"
        return f"{base} Recuperado de {url_clean}"

    # Con fecha de publicación → sin "Recuperado de"
    return f"{base} {url_clean}"


# ─── Validación de citas en texto ────────────────────────────────────


# Cita válida: (Apellido, año) o (Apellido, año, p. X) o (Apellido, año, pp. X-Y)
_RE_CITATION_VALID = re.compile(
    r"^\(\s*[A-ZÁÉÍÓÚÑa-záéíóúñ][\wÁÉÍÓÚÑáéíóúñ\s\-\.&]*,\s*"
    r"(?:\d{4}|s\.f\.)"
    r"(?:\s*,\s*(?:p|pp)\.\s*\d+(?:-\d+)?)?"
    r"\s*\)$"
)

# Cita con paréntesis pero sin coma entre autor y año
_RE_MISSING_COMMA = re.compile(
    r"^\(\s*[A-ZÁÉÍÓÚÑa-záéíóúñ][\wÁÉÍÓÚÑáéíóúñ\s\-\.&]*\s+(?:\d{4}|s\.f\.)"
)


def validate_citation(text: str) -> dict:
    """Valida una cita APA 7 en texto.

    Retorna dict con:
        - valid: bool
        - errors: list[str] (vacío si valid=True)
        - suggested: str (corrección propuesta o '')
    """
    raw = (text or "").strip()
    errors: list[str] = []
    suggested = ""

    if not raw:
        return {
            "valid": False,
            "errors": ["La cita está vacía."],
            "suggested": "",
        }

    # Detectar paréntesis faltantes
    has_open = raw.startswith("(")
    has_close = raw.endswith(")")

    if not has_open or not has_close:
        errors.append(
            "Falta paréntesis: las citas en texto APA 7 van envueltas entre paréntesis, "
            "por ejemplo (Apellido, año)."
        )
        # Intentar sugerir envolviendo en paréntesis
        body = raw.strip("()")
        # Intentar agregar coma entre autor y año si falta
        body_with_comma = re.sub(
            r"^([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s\-\.]*)\s+(\d{4}|s\.f\.)",
            r"\1, \2",
            body.strip(),
        )
        suggested = f"({body_with_comma})"
    elif _RE_MISSING_COMMA.match(raw):
        errors.append(
            "Falta coma entre el apellido del autor y el año. Formato correcto: (Apellido, año)."
        )
        suggested = re.sub(
            r"^\(\s*([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s\-\.]*)\s+(\d{4}|s\.f\.)",
            r"(\1, \2",
            raw,
        )
    elif _RE_CITATION_VALID.match(raw):
        return {"valid": True, "errors": [], "suggested": ""}
    else:
        errors.append(
            "Formato no reconocido. Esperado: (Apellido, año) o (Apellido, año, p. X)."
        )

    return {
        "valid": False,
        "errors": errors,
        "suggested": suggested,
    }
