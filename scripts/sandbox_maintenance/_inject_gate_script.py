"""Reemplaza el JS inline del gate en los 55 HTMLs por <script src="./_gate.js">.

Idempotente: detecta si ya tiene el script externo y no duplica.

Uso: python3 _inject_gate_script.py
"""

from __future__ import annotations

import re
from pathlib import Path

SANDBOX = Path("/Users/cristiang./CONNIKU/public/sandbox")

SCRIPT_TAG = '<script src="./_gate.js" defer></script>'

# Pattern del gate inline que queremos remover (detectamos por la función
# checkGate y el listener DOMContentLoaded / keydown). Removemos el bloque
# IIFE o function + listeners relacionados al gate.
# Hay variantes; busco las 2 más comunes.

PATTERN_GATE_INLINE_1 = re.compile(
    r"\s*// Gate\s*\n"
    r"\s*function checkGate\(\)\{[^}]+?\}\s*\n"
    r"\s*document\.getElementById\('gate-pw'\)\.addEventListener\('keydown',\s*function\(e\)\{[^}]+?\}\);\s*\n"
    r"\s*if \(sessionStorage\.getItem\('conniku-gate-ok'\)==='1'\) \{\s*\n"
    r"\s*document\.getElementById\('gate'\)\.style\.display='none';\s*\n"
    r"\s*\}",
    re.DOTALL,
)


def patch(html: str) -> tuple[str, bool, bool]:
    """Retorna (nuevo_html, script_agregado, inline_removido)."""
    new_html = html
    script_added = False
    inline_removed = False

    # 1. Agregar <script src="./_gate.js"> al final del head si no está
    if 'src="./_gate.js"' not in new_html and "</head>" in new_html:
        new_html = new_html.replace("</head>", f"{SCRIPT_TAG}\n</head>", 1)
        script_added = True

    # 2. Remover el JS inline del gate si está presente
    new_html2 = PATTERN_GATE_INLINE_1.sub("", new_html)
    if new_html2 != new_html:
        new_html = new_html2
        inline_removed = True

    return new_html, script_added, inline_removed


def main() -> None:
    files = sorted(SANDBOX.glob("*.html"))
    files = [f for f in files if not f.name.startswith("legal-")]

    stats = {"total": len(files), "script_added": 0, "inline_removed": 0, "no_change": 0}
    for path in files:
        try:
            content = path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"SKIP {path.name}: {e}")
            continue
        new_content, script_added, inline_removed = patch(content)
        if script_added or inline_removed:
            path.write_text(new_content, encoding="utf-8")
            marks = []
            if script_added:
                marks.append("script-external")
                stats["script_added"] += 1
            if inline_removed:
                marks.append("inline-removido")
                stats["inline_removed"] += 1
            print(f"OK {path.name} [{', '.join(marks)}]")
        else:
            stats["no_change"] += 1

    print()
    print(f"Total HTMLs: {stats['total']}")
    print(f"Script externo agregado: {stats['script_added']}")
    print(f"JS inline removido: {stats['inline_removed']}")
    print(f"Sin cambios: {stats['no_change']}")


if __name__ == "__main__":
    main()
