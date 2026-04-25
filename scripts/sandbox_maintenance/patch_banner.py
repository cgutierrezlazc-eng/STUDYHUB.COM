#!/usr/bin/env python3
"""
patch_banner.py — Replica el banner (nav superior) de landing-preview.html
en los 48 archivos HTML del sandbox CONNIKU-LANDING-MASTER-2026.

Transformaciones por archivo:
  1. Google Fonts: agrega Patrick+Hand y Permanent+Marker a la URL
  2. CSS: reemplaza .nav-cta, .nav-cta-link, agrega .nav-cta-label,
          rotaciones letra-a-letra, y #moving-oval
  3. HTML nav: reemplaza contenido del nav-cta-group con CTAs handwritten
  4. SVG óvalo: inserta <svg id="moving-oval"> antes de gate-overlay o </body>
  5. Script JS: inserta IIFE del óvalo antes de </body>
"""

import re
import os
import sys
from typing import TypedDict


class PatchReport(TypedDict):
    file: str
    fonts_patched: bool
    css_patched: bool
    nav_patched: bool
    svg_patched: bool
    js_patched: bool
    changed: bool
    notes: list[str]

SANDBOX = "/Users/cristiang./CONNIKU/public/sandbox"

EXCLUDED = {"landing.html", "devices-preview.html", "landing-preview.html"}

# --------------------------------------------------------------------------
# Bloque 1: Google Fonts — URL completa de referencia
# --------------------------------------------------------------------------
FONTS_URL_FULL = (
    "https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;600;700;800;900"
    "&family=Geist+Mono:wght@400;500;600;700"
    "&family=Patrick+Hand"
    "&family=Permanent+Marker"
    "&display=swap"
)

# --------------------------------------------------------------------------
# Bloque 2: CSS nuevo para el banner handwritten
# --------------------------------------------------------------------------
CSS_BANNER = """
  /* ===== BANNER HANDWRITTEN CTAs ===== */
  .nav-cta{position:relative;padding:12px 26px;background:transparent;color:var(--ink);font-weight:700;font-size:14px;font-family:var(--fd);border-radius:0;z-index:1;display:inline-flex;align-items:center;justify-content:center;text-transform:none;letter-spacing:-.01em;transition:transform .2s var(--ease)}
  .nav-cta-label{position:relative;z-index:2;font-family:'Permanent Marker','Patrick Hand',cursive;color:#0D0F10;font-size:18px;font-weight:400;letter-spacing:.02em;text-transform:uppercase;line-height:1}
  .nav-cta:hover{transform:translateY(-1px)}
  .nav-links .nav-cta-link{background:none;padding:0 8px;color:#1A4DB3;font-family:'Patrick Hand','Caveat',cursive;font-weight:400;font-size:30px;letter-spacing:.01em;line-height:1;display:inline-block;transform:rotate(-2deg);text-transform:uppercase;transition:transform .2s var(--ease)}
  .nav-links .nav-cta-link:hover{transform:rotate(-2deg) translateY(-2px)}
  /* rotaciones por letra — Entrar (6 letras) */
  .nav-cta-link span,.nav-cta-label span{display:inline-block}
  .nav-cta-link span:nth-child(1){transform:rotate(-2deg) translateY(-1px)}
  .nav-cta-link span:nth-child(2){transform:rotate(1deg)}
  .nav-cta-link span:nth-child(3){transform:rotate(-1.5deg) translateY(1px)}
  .nav-cta-link span:nth-child(4){transform:rotate(2deg)}
  .nav-cta-link span:nth-child(5){transform:rotate(-1deg) translateY(-1px)}
  .nav-cta-link span:nth-child(6){transform:rotate(1.5deg)}
  /* Crear cuenta (11 spans) */
  .nav-cta-label span:nth-child(1){transform:rotate(-1.5deg) translateY(-1px)}
  .nav-cta-label span:nth-child(2){transform:rotate(1deg)}
  .nav-cta-label span:nth-child(3){transform:rotate(-2deg) translateY(1px)}
  .nav-cta-label span:nth-child(4){transform:rotate(.5deg)}
  .nav-cta-label span:nth-child(5){transform:rotate(-1deg)}
  .nav-cta-label span:nth-child(6){transform:rotate(1.5deg) translateY(-1px)}
  .nav-cta-label span:nth-child(7){transform:rotate(-.5deg)}
  .nav-cta-label span:nth-child(8){transform:rotate(2deg)}
  .nav-cta-label span:nth-child(9){transform:rotate(-1deg) translateY(1px)}
  .nav-cta-label span:nth-child(10){transform:rotate(1deg)}
  .nav-cta-label span:nth-child(11){transform:rotate(-1.5deg)}
  /* óvalo móvil */
  #moving-oval{position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:60;transition:transform .35s cubic-bezier(.2,.8,.2,1),width .35s cubic-bezier(.2,.8,.2,1),height .35s cubic-bezier(.2,.8,.2,1),opacity .25s ease;overflow:visible;opacity:0}
  #moving-oval.visible{opacity:1}"""

# --------------------------------------------------------------------------
# Bloque 3: HTML del nav-cta-group (CTAs handwritten)
# --------------------------------------------------------------------------
NAV_CTA_GROUP_HTML = (
    '<div class="nav-cta-group">'
    '<a class="nav-cta-link oval-target" href="#">'
    '<span>E</span><span>N</span><span>T</span><span>R</span><span>A</span><span>R</span>'
    '</a>'
    '<a class="nav-cta oval-target oval-active" href="#">'
    '<span class="nav-cta-label">'
    '<span>C</span><span>R</span><span>E</span><span>A</span><span>R</span> '
    '<span>C</span><span>U</span><span>E</span><span>N</span><span>T</span><span>A</span>'
    '</span>'
    '</a>'
    '</div>'
)

# --------------------------------------------------------------------------
# Bloque 4: SVG del óvalo
# --------------------------------------------------------------------------
SVG_OVAL = """<!-- ÓVALO GLOBAL MÓVIL -->
<svg id="moving-oval" viewBox="0 0 240 90" aria-hidden="true">
  <ellipse cx="120" cy="45" rx="105" ry="32" fill="none" stroke="#0D0F10" stroke-width="2.4" opacity="0.85" stroke-linecap="round" transform="rotate(-2.5 120 45)"/>
  <ellipse cx="118" cy="47" rx="102" ry="34" fill="none" stroke="#0D0F10" stroke-width="1.8" opacity="0.7" stroke-linecap="round" transform="rotate(1.5 118 47)"/>
  <ellipse cx="122" cy="43" rx="107" ry="30" fill="none" stroke="#0D0F10" stroke-width="1.5" opacity="0.55" stroke-linecap="round" transform="rotate(-4.5 122 43)"/>
</svg>
"""

# --------------------------------------------------------------------------
# Bloque 5: Script JS del óvalo (var-style para compatibilidad)
# --------------------------------------------------------------------------
JS_OVAL = """<script>
(function(){
  var oval = document.getElementById('moving-oval');
  if (!oval) return;
  var targets = Array.from(document.querySelectorAll('.oval-target'));
  if (!targets.length) return;
  var activeTarget = document.querySelector('.oval-target.oval-active') || targets[0];

  function moveOvalTo(el){
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var width = rect.width * 1.38;
    var height = rect.height * 2.05;
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    oval.style.width = width + 'px';
    oval.style.height = height + 'px';
    oval.style.transform = 'translate(' + (cx - width/2) + 'px,' + (cy - height/2) + 'px)';
    oval.classList.add('visible');
  }

  function setActive(el){
    targets.forEach(function(t){ t.classList.remove('oval-active'); });
    el.classList.add('oval-active');
    activeTarget = el;
  }

  targets.forEach(function(t){
    t.addEventListener('mouseenter', function(){ moveOvalTo(t); });
    t.addEventListener('focus', function(){ moveOvalTo(t); });
    t.addEventListener('click', function(){ setActive(t); });
  });

  var nav = document.querySelector('nav');
  var ctaRow = document.querySelector('.cta-row');
  [nav, ctaRow].forEach(function(zone){
    if (!zone) return;
    zone.addEventListener('mouseleave', function(){ moveOvalTo(activeTarget); });
  });

  function reposition(){ moveOvalTo(activeTarget); }
  window.addEventListener('scroll', reposition, {passive:true});
  window.addEventListener('resize', reposition);
  window.addEventListener('load', reposition);

  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(reposition);
  } else {
    setTimeout(reposition, 300);
  }
  setTimeout(reposition, 50);
})();
</script>
"""


def patch_fonts(html: str) -> tuple[str, bool]:
    """Reemplaza la URL de Google Fonts para incluir Patrick Hand + Permanent Marker."""
    # Busca el link de fonts.googleapis.com existente
    pattern = re.compile(
        r'(href=")(https://fonts\.googleapis\.com/css2\?[^"]+)(")',
        re.IGNORECASE
    )
    match = pattern.search(html)
    if not match:
        return html, False

    current_url = match.group(2)
    # Verifica si ya tiene ambas fuentes
    has_patrick = "Patrick+Hand" in current_url
    has_permanent = "Permanent+Marker" in current_url

    if has_patrick and has_permanent:
        return html, False  # ya OK, no cambiar

    new_html = pattern.sub(f'\\g<1>{FONTS_URL_FULL}\\g<3>', html)
    return new_html, True


def patch_css(html: str) -> str:
    """Reemplaza las reglas CSS de .nav-cta y .nav-cta-link con las del banner handwritten."""
    # Detectamos si ya tiene el CSS del banner handwritten (idempotencia)
    if "Permanent Marker" in html and "oval-target" in html and "#moving-oval" in html:
        # Ya tiene todo; no modificar CSS
        return html

    # Patron para .nav-cta{...} — puede estar en una o varias líneas
    # Capturamos el bloque desde .nav-cta{ hasta el ; de cierre del bloque
    # En estos archivos el CSS es compacto (una línea por regla usualmente)

    # Construimos el CSS de reemplazo que va después de .nav-cta-group
    # Primero eliminamos las reglas viejas de .nav-cta y .nav-cta-link
    # luego inyectamos el bloque nuevo antes de </style>

    # Paso A: eliminar reglas antiguas de .nav-cta (pill oscuro)
    # Patrón: .nav-cta{...}
    html = re.sub(
        r'[ \t]*\.nav-cta\{[^}]*\}\s*\n?',
        '',
        html
    )
    # Paso B: eliminar .nav-cta:hover
    html = re.sub(
        r'[ \t]*\.nav-cta:hover\{[^}]*\}\s*\n?',
        '',
        html
    )
    # Paso C: eliminar .nav-links .nav-cta-link
    html = re.sub(
        r'[ \t]*\.nav-links \.nav-cta-link\{[^}]*\}\s*\n?',
        '',
        html
    )
    # Paso D: eliminar .nav-links .nav-cta-link:hover
    html = re.sub(
        r'[ \t]*\.nav-links \.nav-cta-link:hover\{[^}]*\}\s*\n?',
        '',
        html
    )
    # Paso E: eliminar .nav-cta-label si ya existe (evitar duplicado)
    html = re.sub(
        r'[ \t]*\.nav-cta-label\{[^}]*\}\s*\n?',
        '',
        html
    )

    # Paso F: inyectar nuevo bloque CSS antes de </style>
    html = html.replace('</style>', CSS_BANNER + '\n</style>', 1)

    return html


def patch_nav_html(html: str) -> str:
    """Reemplaza el contenido del nav-cta-group con los CTAs handwritten."""
    # Patron: <div class="nav-cta-group">...</div>
    # Puede tener atributos adicionales (poco probable) o contenido variado
    pattern = re.compile(
        r'<div class="nav-cta-group"[^>]*>.*?</div>',
        re.DOTALL
    )
    match = pattern.search(html)
    if not match:
        # No tiene nav-cta-group: buscamos si hay nav-links para agregar al final
        # Caso edge: no debería ocurrir según inventario, pero lo manejamos
        nav_links_end = html.rfind('</div>', html.find('<div class="nav-links"'))
        if nav_links_end == -1:
            return html  # no podemos hacer nada seguro
        # Insertar antes del cierre del nav-links
        return html[:nav_links_end] + NAV_CTA_GROUP_HTML + '\n    ' + html[nav_links_end:]

    old_group = match.group(0)
    return html.replace(old_group, NAV_CTA_GROUP_HTML, 1)


def patch_oval_svg(html: str) -> str:
    """Inserta el SVG del óvalo antes del gate-overlay o antes de </body>."""
    if 'id="moving-oval"' in html:
        return html  # ya existe

    # Preferir insertar antes del gate-overlay
    gate_marker = '<div id="gate-overlay"'
    if gate_marker in html:
        html = html.replace(gate_marker, SVG_OVAL + '\n' + gate_marker, 1)
        return html

    # Fallback: antes de </body>
    html = html.replace('</body>', SVG_OVAL + '\n</body>', 1)
    return html


def patch_oval_script(html: str) -> str:
    """Inserta el script JS del óvalo antes de </body>, después del gate script."""
    if "moving-oval" in html and "moveOvalTo" in html:
        return html  # ya existe

    # Insertar justo antes de </body>
    html = html.replace('</body>', JS_OVAL + '</body>', 1)
    return html


def patch_file(filepath: str) -> PatchReport:
    """Aplica todas las transformaciones a un archivo. Retorna reporte."""
    with open(filepath, encoding='utf-8') as f:
        original = f.read()

    html = original
    report: PatchReport = {
        'file': os.path.basename(filepath),
        'fonts_patched': False,
        'css_patched': False,
        'nav_patched': False,
        'svg_patched': False,
        'js_patched': False,
        'changed': False,
        'notes': [],
    }

    # 1. Fonts
    html, fonts_changed = patch_fonts(html)
    report['fonts_patched'] = fonts_changed

    # 2. CSS — solo si no tiene el banner handwritten aún
    if 'Permanent Marker' not in html or '#moving-oval' not in html:
        html = patch_css(html)
        report['css_patched'] = True

    # 3. Nav HTML
    if 'oval-target' not in html:
        html = patch_nav_html(html)
        report['nav_patched'] = True
    else:
        # Ya tiene oval-target, verificar si el nav-cta-group tiene la estructura nueva
        if '<span class="nav-cta-label">' not in html:
            html = patch_nav_html(html)
            report['nav_patched'] = True
            report['notes'].append('oval-target existía pero nav-cta-group fue actualizado')

    # 4. SVG óvalo
    if 'id="moving-oval"' not in html:
        html = patch_oval_svg(html)
        report['svg_patched'] = True

    # 5. Script JS óvalo
    if 'moveOvalTo' not in html:
        html = patch_oval_script(html)
        report['js_patched'] = True

    # Escribir si hubo cambios
    if html != original:
        report['changed'] = True
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)

    return report


def main():
    files = sorted([
        f for f in os.listdir(SANDBOX)
        if f.endswith('.html') and f not in EXCLUDED
    ])

    print(f"Archivos a procesar: {len(files)}")
    print("=" * 60)

    results = []
    changed_count = 0
    atypical = []

    for fname in files:
        fpath = os.path.join(SANDBOX, fname)
        rep = patch_file(fpath)
        results.append(rep)
        if rep['changed']:
            changed_count += 1
        if rep['notes']:
            atypical.append(rep)
        status = "OK" if rep['changed'] else "SIN CAMBIOS"
        print(f"  [{status}] {rep['file']}"
              + (f" — NOTAS: {rep['notes']}" if rep['notes'] else ""))

    print("=" * 60)
    print(f"Total modificados: {changed_count}/{len(files)}")

    if atypical:
        print("\nArchivos con estructuras atípicas:")
        for rep in atypical:
            print(f"  {rep['file']}: {rep['notes']}")

    # Resumen de transformaciones
    print("\nResumen de transformaciones:")
    print(f"  Fonts actualizados:    {sum(1 for r in results if r['fonts_patched'])}")
    print(f"  CSS inyectado:         {sum(1 for r in results if r['css_patched'])}")
    print(f"  Nav HTML reemplazado:  {sum(1 for r in results if r['nav_patched'])}")
    print(f"  SVG óvalo insertado:   {sum(1 for r in results if r['svg_patched'])}")
    print(f"  Script JS insertado:   {sum(1 for r in results if r['js_patched'])}")


if __name__ == '__main__':
    main()
