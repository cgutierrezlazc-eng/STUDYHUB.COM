"""Parser de rúbricas académicas para el sub-sub-bloque 2d.6 Workspaces.

Convierte texto plano con bullets/listas/puntajes en items estructurados
para el checklist del editor. Heurística pura sin dependencias externas
(el LLM Athena es fallback opcional del frontend, no llamado aquí).

Formatos reconocidos:
- Bullets: `-`, `*`, `•`
- Listas numeradas: `1.`, `2.`, etc.
- Listas alfabéticas: `a)`, `b)`, `A)`, `B)`
- Puntajes: `(N pts)`, `(N puntos)`, `- N pts` al final de línea
"""

from __future__ import annotations

import re
import uuid

# Regex de items por línea — detecta bullet/numerado/alfabético al inicio.
_BULLET_LINE = re.compile(
    r"^\s*"
    r"(?:[-*•]|\d+\.|[a-zA-Z]\))"  # bullet o lista
    r"\s+"
    r"(.+?)"  # contenido
    r"\s*$"
)

# Puntaje: (N pts), (N puntos), o ` - N pts` al final
_POINTS_PAREN = re.compile(
    r"\(\s*(\d+)\s*(?:pts?|puntos?)\s*\)",
    re.IGNORECASE,
)
_POINTS_DASH = re.compile(
    r"[-–—]\s*(\d+)\s*(?:pts?|puntos?)\s*$",
    re.IGNORECASE,
)


def _extract_points(line: str) -> tuple[int, str]:
    """Retorna (points, line_sin_puntaje)."""
    match_paren = _POINTS_PAREN.search(line)
    if match_paren:
        pts = int(match_paren.group(1))
        cleaned = _POINTS_PAREN.sub("", line).strip()
        return pts, cleaned

    match_dash = _POINTS_DASH.search(line)
    if match_dash:
        pts = int(match_dash.group(1))
        cleaned = _POINTS_DASH.sub("", line).strip()
        return pts, cleaned

    return 0, line.strip()


def parse_rubric(text: str) -> tuple[list[dict], list[str]]:
    """Parsea texto de rúbrica a lista de items + warnings.

    Retorna: (items, warnings)
      items: list de dict {id, title, points, description}
      warnings: list de strings con mensajes informativos
    """
    warnings: list[str] = []
    items: list[dict] = []

    if not text or len(text.strip()) < 10:
        warnings.append(
            "No se pudo parsear automáticamente. Edite la rúbrica manualmente "
            "o pegue un formato con bullets (ej: '- Criterio (10 pts)')."
        )
        return items, warnings

    lines = text.splitlines()

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        match = _BULLET_LINE.match(line)
        if not match:
            continue

        content = match.group(1).strip()
        if not content:
            continue

        points, title_clean = _extract_points(content)

        items.append(
            {
                "id": uuid.uuid4().hex[:12],
                "title": title_clean,
                "points": points,
                "description": "",
            }
        )

    if not items:
        warnings.append(
            "No se pudo parsear automáticamente. Edite la rúbrica manualmente "
            "o pegue un formato con bullets/listas (ej: '- Criterio (10 pts)')."
        )

    return items, warnings
