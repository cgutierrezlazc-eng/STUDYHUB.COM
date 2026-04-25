"""Genera los 4 HTMLs standalone de documentos legales para el sandbox.

Convierte los markdown canónicos del repo (docs/legal/v3.2/) a páginas HTML
standalone con estética editorial-halftone (Funnel Display + paper/ink),
cargables vía iframe desde el modal "Legal" del footer.

Documentos:
- legal-terms.html         ← docs/legal/v3.2/terms.md
- legal-privacy.html       ← docs/legal/v3.2/privacy.md
- legal-cookies.html       ← docs/legal/v3.2/cookies.md
- legal-age-declaration.html ← docs/legal/v3.2/age-declaration-public.md

Uso: python3 _build_legal_pages.py
"""

from __future__ import annotations

import re
from pathlib import Path

import markdown  # type: ignore[import-untyped]

REPO_LEGAL = Path("/Users/cristiang./CONNIKU/docs/legal/v3.2")
SANDBOX = Path("/Users/cristiang./CONNIKU/public/sandbox")

DOCS = [
    ("terms.md", "legal-terms.html", "Términos y Condiciones"),
    ("privacy.md", "legal-privacy.html", "Política de Privacidad"),
    ("cookies.md", "legal-cookies.html", "Política de Cookies"),
    ("age-declaration-public.md", "legal-age-declaration.html", "Declaración de Edad"),
]


def strip_frontmatter(md: str) -> str:
    """Quita el bloque YAML frontmatter (--- ... ---) del principio del markdown."""
    pattern = r"^---\n.*?\n---\n"
    return re.sub(pattern, "", md, count=1, flags=re.DOTALL)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es-CL">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title} · Conniku</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" />
<style>
  :root {{
    --ink: #0D0F10; --ink-2: #2B2E30; --ink-3: #696C6F;
    --paper: #F5F4EF; --paper-2: #EBE9E1;
    --lime: #D9FF3A; --orange: #FF4A1C;
    --fd: 'Funnel Display', -apple-system, sans-serif;
    --fm: 'Geist Mono', ui-monospace, monospace;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ height: 100%; }}
  body {{
    background: var(--paper);
    color: var(--ink);
    font-family: var(--fd);
    line-height: 1.6;
    padding: 48px 32px;
    max-width: 860px;
    margin: 0 auto;
  }}
  h1 {{
    font-family: var(--fd);
    font-weight: 800;
    font-size: clamp(28px, 4vw, 42px);
    letter-spacing: -0.02em;
    margin-bottom: 8px;
    color: var(--ink);
  }}
  h2 {{
    font-family: var(--fd);
    font-weight: 700;
    font-size: clamp(20px, 2.5vw, 26px);
    letter-spacing: -0.01em;
    margin-top: 32px;
    margin-bottom: 12px;
    color: var(--ink);
    padding-bottom: 6px;
    border-bottom: 1.5px solid var(--ink);
  }}
  h3 {{
    font-family: var(--fd);
    font-weight: 700;
    font-size: clamp(16px, 2vw, 20px);
    margin-top: 22px;
    margin-bottom: 10px;
    color: var(--ink-2);
  }}
  h4 {{
    font-family: var(--fd);
    font-weight: 700;
    font-size: 15px;
    margin-top: 16px;
    margin-bottom: 8px;
    color: var(--ink-2);
  }}
  p {{
    margin: 10px 0;
    font-size: 15px;
    color: var(--ink-2);
  }}
  ul, ol {{
    margin: 10px 0 10px 24px;
    font-size: 15px;
    color: var(--ink-2);
  }}
  li {{ margin: 4px 0; }}
  strong, b {{ color: var(--ink); font-weight: 700; }}
  em, i {{ font-style: italic; color: var(--ink-2); }}
  a {{ color: var(--ink); text-decoration: underline; font-weight: 600; }}
  a:hover {{ color: var(--orange); }}
  code {{
    font-family: var(--fm);
    background: var(--paper-2);
    padding: 2px 6px;
    font-size: 0.9em;
    border: 1px solid var(--ink-3);
    color: var(--ink);
  }}
  pre {{
    font-family: var(--fm);
    background: var(--paper-2);
    padding: 14px;
    font-size: 13px;
    border: 1px solid var(--ink);
    overflow-x: auto;
    margin: 12px 0;
  }}
  pre code {{ background: none; padding: 0; border: none; }}
  blockquote {{
    border-left: 3px solid var(--orange);
    padding: 8px 16px;
    margin: 14px 0;
    background: var(--paper-2);
    color: var(--ink-2);
    font-style: italic;
  }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    font-size: 14px;
  }}
  th, td {{
    border: 1.5px solid var(--ink);
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background: var(--paper-2);
    font-weight: 700;
  }}
  hr {{
    border: none;
    border-top: 1.5px solid var(--ink);
    margin: 32px 0;
  }}
  .legal-meta {{
    font-family: var(--fm);
    font-size: 12px;
    color: var(--ink-3);
    margin-bottom: 24px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }}
  @media (max-width: 640px) {{
    body {{ padding: 32px 20px; }}
  }}
</style>
</head>
<body>
<div class="legal-meta">Conniku · Documento legal canónico · {title}</div>
{content}
</body>
</html>
"""


def main() -> None:
    md = markdown.Markdown(extensions=["extra", "tables", "fenced_code", "sane_lists"])
    for src_name, dest_name, title in DOCS:
        src = REPO_LEGAL / src_name
        if not src.exists():
            print(f"SKIP {src_name} (no existe)")
            continue
        raw = src.read_text(encoding="utf-8")
        body_md = strip_frontmatter(raw)
        md.reset()
        body_html = md.convert(body_md)
        html = HTML_TEMPLATE.format(title=title, content=body_html)
        dest = SANDBOX / dest_name
        dest.write_text(html, encoding="utf-8")
        lines = len(html.splitlines())
        print(f"OK {dest_name} ({lines} líneas, fuente: {src_name})")


if __name__ == "__main__":
    main()
