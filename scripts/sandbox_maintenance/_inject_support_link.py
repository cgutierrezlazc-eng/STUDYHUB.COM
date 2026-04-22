"""Conecta los 3 links del popover "Soporte" en el footer a modal flotante con
iframe que carga soporte.html (mismo mecanismo que modal legal). También amplía
el dict LEGAL_DOCS del modal JS para incluir 'support'.

Cambios por archivo (idempotente):
1. Amplía dict LEGAL_DOCS del JS con 'support' → soporte.html
2. Actualiza el popover "Soporte" del footer:
   - 'Ayuda' → onclick openLegalModal('support', 'faq')
   - 'Estado del servicio' → onclick openLegalModal('support', 'status')
   - 'Reportar un problema' → mailto:soporte@conniku.com
3. Agrega soporte para parámetro opcional `tab` en openLegalModal (fragment
   #tab-<key> al iframe src). soporte.html lee el hash y activa el tab.

Uso: python3 _inject_support_link.py
"""

from __future__ import annotations

from pathlib import Path

SANDBOX = Path("/Users/cristiang./CONNIKU/public/sandbox")

# Ampliación dict
OLD_DOCS_MAP = (
    "'age-declaration': { file: 'legal-age-declaration.html', title: 'Declaración de Edad' }"
)
NEW_DOCS_MAP = (
    "'age-declaration': { file: 'legal-age-declaration.html', title: 'Declaración de Edad' },\n"
    "      'support': { file: 'soporte.html', title: 'Soporte · Conniku' }"
)

# Ampliación función openLegalModal para aceptar segundo parámetro tab
OLD_OPEN_SIG = "window.openLegalModal = function (docKey) {"
NEW_OPEN_SIG = "window.openLegalModal = function (docKey, tabKey) {"

OLD_IFRAME_SRC = "document.getElementById('legalModalIframe').src = doc.file;"
NEW_IFRAME_SRC = (
    "document.getElementById('legalModalIframe').src = tabKey ? (doc.file + '#tab-' + tabKey) : doc.file;"
)

# Popover "Soporte": 3 links muertos → conectados a modal
OLD_SUPPORT_LINKS = (
    '<li><a href="#">Ayuda</a></li>\n'
    '            <li><a href="#">Estado del servicio</a></li>\n'
    '            <li><a href="#">Reportar un problema</a></li>'
)

NEW_SUPPORT_LINKS = (
    '<li><a href="#" onclick="openLegalModal(\'support\', \'faq\'); return false">Ayuda</a></li>\n'
    '            <li><a href="mailto:soporte@conniku.com?subject=Reporte%20de%20problema">Reportar un problema</a></li>'
)

# Reemplazo también la variante que ya tiene los 3 links actualizados (del
# run anterior) para quitar "Estado del servicio".
OLD_SUPPORT_LINKS_WITH_STATUS = (
    '<li><a href="#" onclick="openLegalModal(\'support\', \'faq\'); return false">Ayuda</a></li>\n'
    '            <li><a href="#" onclick="openLegalModal(\'support\', \'status\'); return false">Estado del servicio</a></li>\n'
    '            <li><a href="mailto:soporte@conniku.com?subject=Reporte%20de%20problema">Reportar un problema</a></li>'
)


def patch(html: str) -> tuple[str, list[str]]:
    """Retorna (nuevo_html, lista de cambios aplicados)."""
    new_html = html
    changes = []

    # 1. Dict LEGAL_DOCS — agregar 'support'
    if "'support':" not in new_html and OLD_DOCS_MAP in new_html:
        new_html = new_html.replace(OLD_DOCS_MAP, NEW_DOCS_MAP, 1)
        changes.append("docs-map")

    # 2. Función openLegalModal — aceptar 2 parámetros
    if OLD_OPEN_SIG in new_html and NEW_OPEN_SIG not in new_html:
        new_html = new_html.replace(OLD_OPEN_SIG, NEW_OPEN_SIG, 1)
        changes.append("fn-signature")

    # 3. iframe.src — aplicar fragment si hay tabKey
    if OLD_IFRAME_SRC in new_html and NEW_IFRAME_SRC not in new_html:
        new_html = new_html.replace(OLD_IFRAME_SRC, NEW_IFRAME_SRC, 1)
        changes.append("iframe-src")

    # 4. Popover Soporte — conectar 3 links al modal
    if OLD_SUPPORT_LINKS in new_html:
        new_html = new_html.replace(OLD_SUPPORT_LINKS, NEW_SUPPORT_LINKS, 1)
        changes.append("support-popover")

    # 5. Quitar Estado del servicio (va al dashboard CEO, no a soporte público)
    if OLD_SUPPORT_LINKS_WITH_STATUS in new_html:
        new_html = new_html.replace(OLD_SUPPORT_LINKS_WITH_STATUS, NEW_SUPPORT_LINKS, 1)
        changes.append("status-removed")

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
    print(f"Actualizados: {stats['touched']}")
    print(f"Sin cambios: {stats['no_change']}")


if __name__ == "__main__":
    main()
