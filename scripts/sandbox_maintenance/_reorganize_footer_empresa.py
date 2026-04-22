"""Reorganiza el footer: consolida 'Trabaja con nosotros' dentro del popover
'Empresa' (estándar mundial) y elimina el link directo suelto.

Cambios por archivo (idempotente):

1. Popover 'Empresa' ampliado de 2 → 3 items en este orden:
   - Acerca de
   - Trabaja con nosotros  (nuevo, estaba suelto)
   - Prensa

2. Elimina del footer el link directo 'Trabaja con nosotros' + divisor previo.

Resultado: footer con 4 bloques (Legal · Empresa · Soporte · Contacto) en lugar
de 5 dispersos.

Uso: python3 _reorganize_footer_empresa.py
"""

from __future__ import annotations

from pathlib import Path

SANDBOX = Path("/Users/cristiang./CONNIKU/public/sandbox")

# Popover Empresa actual con 2 items
OLD_EMPRESA_LIST = (
    '<li><a href="#">Acerca de</a></li>\n'
    '            <li><a href="#">Prensa</a></li>'
)

# Nuevo: 3 items en orden Acerca → Trabajo → Prensa
NEW_EMPRESA_LIST = (
    '<li><a href="./acerca.html">Acerca de</a></li>\n'
    '            <li><a href="./trabaja-con-nosotros.html">Trabaja con nosotros</a></li>\n'
    '            <li><a href="./prensa.html">Prensa</a></li>'
)

# Link directo suelto en footer + divisor previo (3 variantes detectables)
# Variante principal: divider + anchor
OLD_DIRECT_LINK_VARIANTS = [
    '<span class="footer-divider" aria-hidden="true"></span>\n      <a class="footer-direct-link" href="#">Trabaja con nosotros</a>',
    '<span class="footer-divider" aria-hidden="true"></span>\n      <a href="#" class="footer-direct-link">Trabaja con nosotros</a>',
    '<span class="footer-divider" aria-hidden="true"></span>\n    <a class="footer-direct-link" href="#">Trabaja con nosotros</a>',
]


def patch(html: str) -> tuple[str, list[str]]:
    new_html = html
    changes = []

    # 1. Popover Empresa — ampliar con Trabajo
    if OLD_EMPRESA_LIST in new_html:
        new_html = new_html.replace(OLD_EMPRESA_LIST, NEW_EMPRESA_LIST, 1)
        changes.append("empresa-ampliado")

    # 2. Quitar link directo suelto (si aún está)
    for variant in OLD_DIRECT_LINK_VARIANTS:
        if variant in new_html:
            new_html = new_html.replace(variant, "", 1)
            changes.append("direct-link-removido")
            break

    return new_html, changes


def main() -> None:
    files = sorted(SANDBOX.glob("*.html"))
    files = [f for f in files if not f.name.startswith("legal-")]

    stats = {"total": len(files), "touched": 0, "no_change": 0}
    for path in files:
        try:
            content = path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"SKIP read error {path.name}: {e}")
            continue
        new_content, changes = patch(content)
        if changes:
            path.write_text(new_content, encoding="utf-8")
            stats["touched"] += 1
            print(f"OK {path.name} [{', '.join(changes)}]")
        else:
            stats["no_change"] += 1

    print()
    print(f"Total HTMLs: {stats['total']}")
    print(f"Reorganizados: {stats['touched']}")
    print(f"Sin cambios: {stats['no_change']}")


if __name__ == "__main__":
    main()
