#!/usr/bin/env python3
"""
Aplicar 3 cambios a 49 archivos HTML del sandbox de la landing.
Excluye: landing.html, devices-preview.html
"""

import os
import glob

SANDBOX = "/Users/cristiang./CONNIKU/public/sandbox"
EXCLUDE = {"landing.html", "devices-preview.html"}

# ─── CAMBIO 1: alineación izquierda ───────────────────────────────────────────

# .shell: margin:0 auto → margin:0 auto 0 40px
SHELL_OLD = ".shell{max-width:1280px;margin:0 auto;padding:0 40px;position:relative;z-index:5}"
SHELL_NEW = ".shell{max-width:1280px;margin:0 auto 0 40px;padding:0 40px;position:relative;z-index:5}"

# .footer-row multiline version (landing-preview.html style):
FOOTER_ROW_ML_OLD = """.footer-row{
  max-width:1280px;
  margin:0 auto;
  display:flex;
  align-items:center;
  gap:18px;
}"""
FOOTER_ROW_ML_NEW = """.footer-row{
  max-width:1280px;
  margin:0 auto 0 40px;
  display:flex;
  align-items:center;
  gap:18px;
}"""

# plataforma.html specific:
MODULOS_HEADER_OLD = "  .modulos-header{max-width:760px;margin:0 auto 48px}"
MODULOS_HEADER_NEW = "  .modulos-header{max-width:760px;margin:0 auto 0 0}"
MODULOS_GRID_OLD   = "  .modulos-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;max-width:1280px;margin:0 auto}"
MODULOS_GRID_NEW   = "  .modulos-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;max-width:1280px;margin:0 auto 0 0}"

# ─── CAMBIO 2 + 3: nav-links (CSS + HTML) ────────────────────────────────────

# 2a. CSS .nav-links a: text-transform:uppercase → none
NAV_LINKS_A_CSS_OLD = """.nav-links a{
  font-family:'Kalam','Patrick Hand',cursive;
  font-weight:400;
  font-size:16px;
  letter-spacing:.02em;
  text-transform:uppercase;
  color:#0D0F10;
  line-height:1;
  display:inline-block;
  text-decoration:none;
  transition:transform .2s var(--ease), color .15s ease;
}"""
NAV_LINKS_A_CSS_NEW = """.nav-links a{
  font-family:'Kalam','Patrick Hand',cursive;
  font-weight:400;
  font-size:16px;
  letter-spacing:.02em;
  text-transform:none;
  color:#0D0F10;
  line-height:1;
  display:inline-block;
  text-decoration:none;
  transition:transform .2s var(--ease), color .15s ease;
}"""

# 2d. .nav-links gap: 28px → 16px
NAV_LINKS_GAP_OLD = "  .nav-links{display:flex;gap:28px;align-items:center}"
NAV_LINKS_GAP_NEW = "  .nav-links{display:flex;gap:16px;align-items:center}"

# 2c. Agregar .nav-link-divider CSS (insertar después de la regla .nav-divider existente)
NAV_DIVIDER_CSS_BLOCK = """.nav-divider{
  display:inline-block;
  width:1px;
  height:28px;
  background:var(--ink);
  opacity:.25;
  margin:0 16px 0 24px;
  align-self:center;
}"""
NAV_LINK_DIVIDER_CSS = """
.nav-link-divider{
  display:inline-block;
  width:1px;
  height:18px;
  background:var(--ink);
  opacity:.22;
  flex-shrink:0;
}"""

# 3a. CSS para .nav-business (insertar después de .nav-link-divider)
NAV_BUSINESS_CSS = """
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
.nav-links a.nav-business span{
  transform:none !important;
  display:inline-block;
}"""

# 2b + 3b. HTML del nav-links — OLD pattern (UPPERCASE, sin dividers, sin nav-business class)
NAV_LINKS_HTML_OLD = """<div class="nav-links">
    <a href="./producto.html" class="oval-target"><span>P</span><span>R</span><span>O</span><span>D</span><span>U</span><span>C</span><span>T</span><span>O</span></a>
    <a href="./como-funciona.html" class="oval-target"><span>C</span><span>Ó</span><span>M</span><span>O</span> <span>F</span><span>U</span><span>N</span><span>C</span><span>I</span><span>O</span><span>N</span><span>A</span></a>
    <a href="./planes.html" class="oval-target"><span>P</span><span>L</span><span>A</span><span>N</span><span>E</span><span>S</span></a>
    <a href="./business.html" class="oval-target"><span>B</span><span>U</span><span>S</span><span>I</span><span>N</span><span>E</span><span>S</span><span>S</span></a>
    <a href="#" class="nav-cta-link oval-target"><span>E</span><span>N</span><span>T</span><span>R</span><span>A</span><span>R</span></a>
    <a href="#" class="nav-cta oval-target oval-active">
      <span class="nav-cta-label">
        <svg class="cc-underline" viewBox="0 0 130 14" aria-hidden="true" focusable="false">
          <path d="M2,9 Q18,5 36,8 Q54,11 72,7 Q90,4 108,8 Q118,10 128,8" fill="none" stroke="#32E875" stroke-width="6" stroke-linecap="round" opacity=".88"/>
          <path d="M4,10 Q22,7 42,9 Q62,11 82,8 Q100,5 120,9" fill="none" stroke="#32E875" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>
        </svg>
        <span>C</span><span>R</span><span>E</span><span>A</span><span>R</span> <span>C</span><span>U</span><span>E</span><span>N</span><span>T</span><span>A</span>
      </span>
    </a>
  </div>"""

NAV_LINKS_HTML_NEW = """<div class="nav-links">
    <a href="./producto.html" class="oval-target"><span>P</span><span>r</span><span>o</span><span>d</span><span>u</span><span>c</span><span>t</span><span>o</span></a>
    <span class="nav-link-divider" aria-hidden="true"></span>
    <a href="./como-funciona.html" class="oval-target"><span>C</span><span>ó</span><span>m</span><span>o</span> <span>f</span><span>u</span><span>n</span><span>c</span><span>i</span><span>o</span><span>n</span><span>a</span></a>
    <span class="nav-link-divider" aria-hidden="true"></span>
    <a href="./planes.html" class="oval-target"><span>P</span><span>l</span><span>a</span><span>n</span><span>e</span><span>s</span></a>
    <span class="nav-link-divider" aria-hidden="true"></span>
    <a href="./business.html" class="nav-business oval-target"><span>B</span><span>U</span><span>S</span><span>I</span><span>N</span><span>E</span><span>S</span><span>S</span></a>
    <a href="#" class="nav-cta-link oval-target"><span>E</span><span>N</span><span>T</span><span>R</span><span>A</span><span>R</span></a>
    <a href="#" class="nav-cta oval-target oval-active">
      <span class="nav-cta-label">
        <svg class="cc-underline" viewBox="0 0 130 14" aria-hidden="true" focusable="false">
          <path d="M2,9 Q18,5 36,8 Q54,11 72,7 Q90,4 108,8 Q118,10 128,8" fill="none" stroke="#32E875" stroke-width="6" stroke-linecap="round" opacity=".88"/>
          <path d="M4,10 Q22,7 42,9 Q62,11 82,8 Q100,5 120,9" fill="none" stroke="#32E875" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>
        </svg>
        <span>C</span><span>R</span><span>E</span><span>A</span><span>R</span> <span>C</span><span>U</span><span>E</span><span>N</span><span>T</span><span>A</span>
      </span>
    </a>
  </div>"""


def apply_to_file(path: str) -> dict:
    filename = os.path.basename(path)
    with open(path, encoding="utf-8") as f:
        original = f.read()

    content = original
    changes = []

    # ─── CAMBIO 1 ────────────────────────────────────────────────────────────
    if SHELL_OLD in content:
        content = content.replace(SHELL_OLD, SHELL_NEW)
        changes.append("shell margin")

    if FOOTER_ROW_ML_OLD in content:
        content = content.replace(FOOTER_ROW_ML_OLD, FOOTER_ROW_ML_NEW)
        changes.append("footer-row margin")

    # plataforma.html specifics
    if MODULOS_HEADER_OLD in content:
        content = content.replace(MODULOS_HEADER_OLD, MODULOS_HEADER_NEW)
        changes.append("modulos-header margin")
    if MODULOS_GRID_OLD in content:
        content = content.replace(MODULOS_GRID_OLD, MODULOS_GRID_NEW)
        changes.append("modulos-grid margin")

    # ─── CAMBIO 2a: text-transform none ─────────────────────────────────────
    if NAV_LINKS_A_CSS_OLD in content:
        content = content.replace(NAV_LINKS_A_CSS_OLD, NAV_LINKS_A_CSS_NEW)
        changes.append("nav-links a text-transform")

    # ─── CAMBIO 2d: gap 28px → 16px ─────────────────────────────────────────
    if NAV_LINKS_GAP_OLD in content:
        content = content.replace(NAV_LINKS_GAP_OLD, NAV_LINKS_GAP_NEW)
        changes.append("nav-links gap")

    # ─── CAMBIO 2c + 3a: insertar nav-link-divider y nav-business CSS ────────
    if NAV_DIVIDER_CSS_BLOCK in content and ".nav-link-divider" not in content:
        content = content.replace(
            NAV_DIVIDER_CSS_BLOCK,
            NAV_DIVIDER_CSS_BLOCK + NAV_LINK_DIVIDER_CSS + NAV_BUSINESS_CSS
        )
        changes.append("nav-link-divider + nav-business CSS")

    # ─── CAMBIO 2b + 3b: HTML del nav-links ─────────────────────────────────
    if NAV_LINKS_HTML_OLD in content:
        content = content.replace(NAV_LINKS_HTML_OLD, NAV_LINKS_HTML_NEW)
        changes.append("nav-links HTML")

    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"file": filename, "changed": True, "changes": changes}
    else:
        return {"file": filename, "changed": False, "changes": []}


def main():
    html_files = sorted(glob.glob(os.path.join(SANDBOX, "*.html")))
    target_files = [f for f in html_files if os.path.basename(f) not in EXCLUDE]

    print(f"Archivos objetivo: {len(target_files)}")

    changed = []
    unchanged = []

    for path in target_files:
        result = apply_to_file(path)
        if result["changed"]:
            changed.append(result)
        else:
            unchanged.append(result["file"])

    print(f"\n✓ Modificados: {len(changed)}")
    for r in changed:
        print(f"  {r['file']}: {', '.join(r['changes'])}")

    if unchanged:
        print(f"\n⚠ Sin cambios ({len(unchanged)}):")
        for f in unchanged:
            print(f"  {f}")

    # Verificaciones finales
    print("\n─── Verificaciones ───")
    files_with_40px = 0
    files_with_divider = 0
    files_with_nav_business = 0

    for path in target_files:
        with open(path, encoding="utf-8") as f:
            c = f.read()
        if "margin:0 auto 0 40px" in c:
            files_with_40px += 1
        if "nav-link-divider" in c:
            files_with_divider += 1
        if "nav-business" in c:
            files_with_nav_business += 1

    print(f"Archivos con margin:0 auto 0 40px (.shell): {files_with_40px}")
    print(f"Archivos con nav-link-divider: {files_with_divider}")
    print(f"Archivos con nav-business: {files_with_nav_business}")


if __name__ == "__main__":
    main()
