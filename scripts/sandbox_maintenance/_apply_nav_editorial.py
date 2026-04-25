#!/usr/bin/env python3
"""
Aplica los 3 cambios editoriales de nav a los 49 archivos HTML del sandbox.
Excluye landing.html y devices-preview.html.

Cambio 1: CSS pill moderno para nav-cta, nav-cta-link, nav-links a, btn-plataforma
Cambio 2: Eliminar óvalo móvil (CSS + HTML SVG + JS script)
Cambio 3: Dot lime en hover sobre nav-links a y btn-plataforma
"""

import os
import re
import glob

SANDBOX = "/Users/cristiang./CONNIKU/public/sandbox"
EXCLUDE = {"landing.html", "devices-preview.html"}

# ---------------------------------------------------------------------------
# CSS que se inyecta (bloque único al final del <style>, antes de </style>)
# ---------------------------------------------------------------------------
CSS_PILL = """\

  /* ===== EDITORIAL PILL NAV — reemplaza handwritten CTAs ===== */
  .nav-links a{
    font-family:var(--fd);
    font-weight:500;
    font-size:13px;
    letter-spacing:.06em;
    text-transform:uppercase;
    color:var(--ink);
    line-height:1;
    display:inline-block;
    text-decoration:none;
    padding:8px 4px;
    transition:color .15s ease;
  }
  .nav-links a:hover{color:var(--ink-3)}

  /* nav-business override — no tocar su propio estilo profesional */
  .nav-links a.nav-business{
    font-family:var(--fd);
    font-weight:700;
    font-size:12px;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:#0F1E3A;
    padding:6px 14px;
    border:1.2px solid rgba(15,30,58,.35);
    border-radius:4px;
    background:rgba(15,30,58,.04);
    transform:none;
    transition:background .2s ease, border-color .2s ease, color .2s ease, transform .15s ease;
  }
  .nav-links a.nav-business:hover{
    background:rgba(15,30,58,.1);
    border-color:rgba(15,30,58,.6);
    color:#0F1E3A;
    transform:translateY(-1px);
  }

  .nav-links .nav-cta{
    position:relative;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding:10px 22px;
    background:var(--ink);
    color:var(--paper);
    font-family:var(--fd);
    font-weight:700;
    font-size:13px;
    letter-spacing:.08em;
    text-transform:uppercase;
    line-height:1;
    border:2px solid var(--ink);
    border-radius:999px;
    text-decoration:none;
    transition:transform .2s var(--ease), box-shadow .2s var(--ease);
    transform:rotate(0.5deg);
  }
  .nav-links .nav-cta:hover{
    transform:rotate(0.5deg) translateY(-2px);
    box-shadow:4px 4px 0 var(--lime);
  }

  .nav-links .nav-cta-link{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding:10px 22px;
    background:transparent;
    color:var(--ink);
    font-family:var(--fd);
    font-weight:700;
    font-size:13px;
    letter-spacing:.08em;
    text-transform:uppercase;
    line-height:1;
    border:2px solid var(--ink);
    border-radius:999px;
    text-decoration:none;
    transition:transform .2s var(--ease), background .2s ease, color .2s ease, box-shadow .2s var(--ease);
    transform:rotate(-0.5deg);
  }
  .nav-links .nav-cta-link:hover{
    background:var(--ink);
    color:var(--paper);
    transform:rotate(-0.5deg) translateY(-2px);
    box-shadow:4px 4px 0 var(--ink);
  }

  /* Dot verde lateral derecho */
  .nav-links a,
  .btn-plataforma{
    position:relative;
  }
  .nav-links a::after,
  .btn-plataforma::after{
    content:"";
    position:absolute;
    top:50%;
    right:-10px;
    transform:translateY(-50%) scale(0);
    width:7px;
    height:7px;
    background:var(--lime);
    border:1.2px solid var(--ink);
    border-radius:50%;
    transition:transform .2s var(--ease);
    pointer-events:none;
  }
  .nav-links a:hover::after,
  .nav-links a:focus::after,
  .nav-links a.active::after,
  .btn-plataforma:hover::after,
  .btn-plataforma:focus::after{
    transform:translateY(-50%) scale(1);
  }
"""

# CSS de btn-plataforma — solo para landing-preview.html
CSS_BTN_PLATAFORMA = """\

  /* ===== BTN PLATAFORMA pill lime ===== */
  .btn-plataforma{
    position:relative;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding:14px 28px;
    background:var(--lime);
    color:var(--ink);
    font-family:var(--fd);
    font-weight:700;
    font-size:14px;
    letter-spacing:.08em;
    text-transform:uppercase;
    line-height:1;
    border:2px solid var(--ink);
    border-radius:999px;
    text-decoration:none;
    box-shadow:4px 4px 0 var(--ink);
    transition:transform .2s var(--ease), box-shadow .2s var(--ease);
    transform:rotate(-0.8deg);
  }
  .btn-plataforma:hover{
    transform:rotate(-0.8deg) translate(-2px,-2px);
    box-shadow:6px 6px 0 var(--ink);
  }
"""

# ---------------------------------------------------------------------------
# Patrones CSS a eliminar (regex para bloques completos de reglas)
# ---------------------------------------------------------------------------
# Eliminamos los bloques de reglas handwritten y el óvalo del CSS

CSS_PATTERNS_TO_REMOVE = [
    # .nav-cta{ ... } bloque original (antes de la nueva inyección)
    # Usamos regex que capture desde .nav-cta{ hasta el } de cierre
    # Nota: el nuevo CSS se inyecta con mayor especificidad (.nav-links .nav-cta)
    # así que el bloque viejo .nav-cta{ } queda anulado, pero lo eliminamos igual
    r'\.nav-cta\s*\{[^}]*\}',
    r'\.nav-cta-label\s*\{[^}]*\}',
    r'\.nav-cta-label::before\s*\{[^}]*\}',
    r'\.cc-underline\s*\{[^}]*\}',
    # nav-cta-link bloque original
    r'\.nav-links\s+\.nav-cta-link\s*\{[^}]*\}',
    r'\.nav-links\s+\.nav-cta-link:hover\s*\{[^}]*\}',
    # .nav-cta:hover original
    r'\.nav-cta:hover\s*\{[^}]*\}',
    # nav-links a original (handwritten)
    r'\.nav-links\s+a\s*\{[^}]*font-family\s*:\s*[\'"]?(?:Kalam|Patrick\s*Hand)[^}]*\}',
    r'\.nav-links\s+a:hover\s*\{[^}]*transform\s*:[^}]*\}',
    # letter-by-letter spans
    r'\.nav-cta-link\s+span,\s*\n\s*\.nav-cta-label\s+span(?:,\s*\n\s*\.btn-plataforma-label\s+span)?\s*\{[^}]*\}',
    r'\.nav-cta-link\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
    r'\.nav-cta-label\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
    r'\.btn-plataforma-label\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
    r'\.nav-links\s*>\s*a\s*>\s*span\s*\{[^}]*\}',
    r'\.nav-links\s+a:nth-of-type\(\d+\)\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
    # btn-plataforma-label
    r'\.btn-plataforma-label\s*\{[^}]*\}',
    # btn-plataforma original block (sin el display:inline-flex que viene de la nueva)
    r'\.btn-plataforma\s*\{[^}]*font-family\s*:[^}]*\}',
    r'\.btn-plataforma:hover\s*\{[^}]*transform\s*:[^}]*\}',
    # moving-oval CSS
    r'#moving-oval\s*\{[^}]*\}',
    r'#moving-oval\.visible\s*\{[^}]*\}',
    r'#moving-oval\s+ellipse\s*\{[^}]*\}',
    # Comentario handwritten CTAs
    r'/\*\s*=====\s*HANDWRITTEN CTAs[^*]*\*/',
    r'/\*\s*Entrar \(\d+ letras\)\s*\*/',
    r'/\*\s*Crear cuenta[^*]*\*/',
    r'/\*\s*Plataforma[^*]*\*/',
    r'/\*\s*=====\s*ÓVALO GLOBAL[^*]*\*/',
    r'/\*\s*Ajuste \d[^*]*\*/',
    r'/\*\s*===== BTN PLATAFORMA[^*]*\*/',
]

# ---------------------------------------------------------------------------
# HTML del nav-links a reemplazar
# ---------------------------------------------------------------------------
# Patrón: el bloque completo <div class="nav-links">...</div>
NAV_LINKS_OLD_PATTERN = re.compile(
    r'<div class="nav-links">\s*'
    r'<a href="([^"]+)" class="oval-target">[^<]*(?:<span>[^<]*</span>)+[^<]*</a>\s*'
    r'<span class="nav-link-divider"[^>]*></span>\s*'
    r'<a href="([^"]+)" class="oval-target">[^<]*(?:<span>[^<]*</span>)+[^<]*</a>\s*'
    r'<span class="nav-link-divider"[^>]*></span>\s*'
    r'<a href="([^"]+)" class="oval-target">[^<]*(?:<span>[^<]*</span>)+[^<]*</a>\s*'
    r'<span class="nav-link-divider"[^>]*></span>\s*'
    r'<a href="([^"]+)" class="nav-business oval-target">[^<]*(?:<span>[^<]*</span>)+[^<]*</a>\s*'
    r'<a href="([^"]*)" class="nav-cta-link oval-target">[^<]*(?:<span>[^<]*</span>)+[^<]*</a>\s*'
    r'<a href="([^"]*)" class="nav-cta oval-target oval-active">\s*'
    r'<span class="nav-cta-label">\s*(?:<svg[^>]*>.*?</svg>\s*)?(?:<span>[^<]*</span>\s*)+[^<]*\s*</span>\s*'
    r'</a>\s*'
    r'</div>',
    re.DOTALL
)

NAV_LINKS_NEW_TEMPLATE = """\
<div class="nav-links">
  <a href="{href1}">Producto</a>
  <span class="nav-link-divider" aria-hidden="true"></span>
  <a href="{href2}">Cómo funciona</a>
  <span class="nav-link-divider" aria-hidden="true"></span>
  <a href="{href3}">Planes</a>
  <span class="nav-link-divider" aria-hidden="true"></span>
  <a href="{href4}" class="nav-business">BUSINESS</a>
  <a href="{href5}" class="nav-cta-link">Entrar</a>
  <a href="{href6}" class="nav-cta">Crear cuenta</a>
</div>"""

# HTML del btn-plataforma (solo en landing-preview.html)
BTN_PLATAFORMA_OLD = re.compile(
    r'<a class="btn-ghost btn-plataforma oval-target" href="([^"]+)">\s*'
    r'<span class="btn-plataforma-label">(?:<span>[^<]*</span>)+</span>\s*'
    r'</a>',
    re.DOTALL
)
BTN_PLATAFORMA_NEW = '<a class="btn-plataforma" href="{href}">Plataforma</a>'

# SVG moving-oval HTML
MOVING_OVAL_SVG = re.compile(
    r'\n?<svg id="moving-oval"[^>]*>.*?</svg>\n?',
    re.DOTALL
)

# Script JS del óvalo (el segundo <script> IIFE que menciona moving-oval)
MOVING_OVAL_JS = re.compile(
    r'\n?<script>\s*\(function\(\)\{[^<]*moving-oval[^<]*(?:<[^/][^<]*)*</script>\n?',
    re.DOTALL
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def remove_old_css_blocks(content: str) -> str:
    """Elimina bloques CSS handwritten y óvalo usando regex."""
    # Primero el bloque comentado de handwritten CTAs completo (multi-línea)
    content = re.sub(
        r'/\*\s*=====\s*HANDWRITTEN CTAs[^/]*?\*/\s*'
        r'(?:.*?(?:\.nav-cta-link\s+span|\.nav-cta-label\s+span|\.btn-plataforma-label\s+span)'
        r'[^}]*\}[\s\S]*?(?=\n\s*/\*|\n\s*#|\n\s*\.\w|\n\s*</style>))',
        '',
        content,
        flags=re.DOTALL
    )

    # Bloque especial del óvalo
    content = re.sub(
        r'\s*/\*\s*=====\s*ÓVALO GLOBAL[^*]*\*/\s*'
        r'#moving-oval\s*\{[^}]*\}\s*'
        r'#moving-oval\.visible\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )

    # nav-cta original (sin nav-links prefix — el original no lo tiene)
    content = re.sub(
        r'\s*/\*\s*Ajuste 1[^*]*\*/\s*'
        r'\.nav-cta\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'\s*/\*\s*Ajuste 2[^*]*\*/\s*'
        r'\.cc-underline\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'\s*/\*\s*Ajuste 2[^*]*"Entrar"[^*]*\*/\s*'
        r'\.nav-links\s+\.nav-cta-link\s*\{[^}]*\}\s*'
        r'\.nav-links\s+\.nav-cta-link:hover\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )

    # nav-cta-label original
    content = re.sub(
        r'\.nav-cta-label\s*\{[^}]*\}\s*',
        '',
        content,
        flags=re.DOTALL
    )
    # nav-cta:hover original (versión sin nav-links prefix)
    content = re.sub(
        r'\.nav-cta:hover\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    # nav-links a handwritten
    content = re.sub(
        r'\.nav-links\s+a\s*\{\s*\n\s*font-family\s*:\s*[\'"]?(?:\'Kalam\',|Kalam,|\'Patrick\s*Hand\'|Patrick\s*Hand)[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'\.nav-links\s+a:hover\s*\{\s*transform\s*:[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )

    # Eliminar todos los span nth-child letter-by-letter
    content = re.sub(
        r'(?:\.nav-cta-link\s+span,\s*\n\s*\.nav-cta-label\s+span(?:,\s*\n\s*\.btn-plataforma-label\s+span)?\s*\{[^}]*\}\s*)',
        '',
        content,
        flags=re.DOTALL
    )
    # span nth-child individuales
    content = re.sub(
        r'\s*\.nav-cta-link\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
        '',
        content
    )
    content = re.sub(
        r'\s*\.nav-cta-label\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
        '',
        content
    )
    content = re.sub(
        r'\s*\.btn-plataforma-label\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
        '',
        content
    )
    # nav-links > a > span
    content = re.sub(
        r'\s*\.nav-links\s*>\s*a\s*>\s*span\s*\{[^}]*\}',
        '',
        content
    )
    # nth-of-type rotations
    content = re.sub(
        r'\s*\.nav-links\s+a:nth-of-type\(\d+\)\s+span:nth-child\(\d+\)\s*\{[^}]*\}',
        '',
        content
    )
    # Eliminar comentarios huérfanos de nth-of-type
    content = re.sub(
        r'\s*/\*\s*Producto \(\d+ letras\)[^*]*\*/',
        '',
        content
    )
    content = re.sub(
        r'\s*/\*\s*Cómo funciona[^*]*\*/',
        '',
        content
    )
    content = re.sub(
        r'\s*/\*\s*Planes[^*]*\*/',
        '',
        content
    )
    content = re.sub(
        r'\s*/\*\s*Business[^*]*\*/',
        '',
        content
    )

    # btn-plataforma-label CSS
    content = re.sub(
        r'\s*\.btn-plataforma-label\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )

    # btn-plataforma original blocks (identificar por comentario)
    content = re.sub(
        r'\s*/\*\s*===== BTN PLATAFORMA[^*]*\*/\s*'
        r'\.btn-plataforma\s*\{[^}]*\}\s*'
        r'\.btn-plataforma:hover\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    # btn-plataforma sin comentario (el que queda en non-landing pages)
    content = re.sub(
        r'\s*\.btn-plataforma\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'\s*\.btn-plataforma:hover\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )

    # nav-business span (queda redundante si reinyectamos todo)
    content = re.sub(
        r'\s*\.nav-links\s+a\.nav-business\s+span\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    # nav-business bloque antiguo (lo reinyectamos en el nuevo CSS)
    content = re.sub(
        r'\s*\.nav-links\s+a\.nav-business\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'\s*\.nav-links\s+a\.nav-business:hover\s*\{[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )

    return content


def inject_new_css(content: str, is_landing_preview: bool) -> str:
    """Inyecta el nuevo CSS antes de </style>."""
    css_to_inject = CSS_PILL
    if is_landing_preview:
        css_to_inject += CSS_BTN_PLATAFORMA

    # Insertar antes del último </style> del <head>
    idx = content.rfind('</style>')
    if idx == -1:
        print("  WARN: no se encontró </style>")
        return content
    return content[:idx] + css_to_inject + content[idx:]


def replace_nav_links_html(content: str) -> str:
    """Reemplaza el bloque nav-links HTML con versión simple."""
    match = NAV_LINKS_OLD_PATTERN.search(content)
    if not match:
        # Fallback: regex más permisivo
        match2 = re.search(
            r'<div class="nav-links">([\s\S]*?)</div>(?=\s*\n\s*</nav>)',
            content
        )
        if not match2:
            return content  # no se encontró

        inner = match2.group(1)
        # Extraer hrefs
        hrefs = re.findall(r'href="([^"]*)"', inner)
        if len(hrefs) < 6:
            # Completar con # si faltan
            while len(hrefs) < 6:
                hrefs.append('#')

        new_html = NAV_LINKS_NEW_TEMPLATE.format(
            href1=hrefs[0],
            href2=hrefs[1],
            href3=hrefs[2],
            href4=hrefs[3],
            href5=hrefs[4],
            href6=hrefs[5],
        )
        return content[:match2.start()] + new_html + content[match2.end():]

    hrefs = list(match.groups())
    while len(hrefs) < 6:
        hrefs.append('#')

    new_html = NAV_LINKS_NEW_TEMPLATE.format(
        href1=hrefs[0],
        href2=hrefs[1],
        href3=hrefs[2],
        href4=hrefs[3],
        href5=hrefs[4],
        href6=hrefs[5],
    )
    return content[:match.start()] + new_html + content[match.end():]


def remove_moving_oval_svg(content: str) -> str:
    """Elimina el <svg id="moving-oval"> del HTML."""
    return MOVING_OVAL_SVG.sub('\n', content)


def remove_moving_oval_js(content: str) -> str:
    """Elimina el <script> IIFE del óvalo."""
    # Buscar el script que contiene 'moving-oval'
    # Puede haber múltiples <script> — solo eliminar el que tiene moving-oval
    result = re.sub(
        r'\n?<script>\s*\(function\(\)\{[\s\S]*?moving-oval[\s\S]*?\}\)\(\);\s*</script>',
        '',
        content,
        flags=re.DOTALL
    )
    return result


def remove_oval_classes_from_html(content: str) -> str:
    """Elimina clase oval-target y oval-active de atributos class."""
    content = re.sub(r'\s*oval-target', '', content)
    content = re.sub(r'\s*oval-active', '', content)
    return content


def process_file(filepath: str) -> dict:
    filename = os.path.basename(filepath)
    is_landing_preview = (filename == 'landing-preview.html')

    with open(filepath, encoding='utf-8') as f:
        original = f.read()

    content = original

    # 1. Limpiar CSS viejo
    content = remove_old_css_blocks(content)

    # 2. Inyectar CSS nuevo
    content = inject_new_css(content, is_landing_preview)

    # 3. Reemplazar HTML nav-links
    content = replace_nav_links_html(content)

    # 4. btn-plataforma HTML (solo landing-preview)
    if is_landing_preview:
        btn_match = BTN_PLATAFORMA_OLD.search(content)
        if btn_match:
            href = btn_match.group(1)
            content = content[:btn_match.start()] + BTN_PLATAFORMA_NEW.format(href=href) + content[btn_match.end():]

    # 5. Eliminar SVG moving-oval del HTML
    content = remove_moving_oval_svg(content)

    # 6. Eliminar JS del óvalo
    content = remove_moving_oval_js(content)

    # 7. Eliminar clases oval-target / oval-active residuales
    content = remove_oval_classes_from_html(content)

    changed = content != original

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return {"file": filename, "changed": changed}


def main():
    pattern = os.path.join(SANDBOX, "*.html")
    all_files = sorted(glob.glob(pattern))
    to_process = [f for f in all_files if os.path.basename(f) not in EXCLUDE]

    print(f"Archivos a procesar: {len(to_process)}")
    print(f"Excluidos: {EXCLUDE}")
    print()

    results = []
    for fp in to_process:
        r = process_file(fp)
        status = "OK" if r["changed"] else "SIN CAMBIO"
        print(f"  [{status}] {r['file']}")
        results.append(r)

    changed = sum(1 for r in results if r["changed"])
    unchanged = len(results) - changed
    print(f"\nResumen: {changed} modificados, {unchanged} sin cambio de {len(results)} total")


if __name__ == "__main__":
    main()
