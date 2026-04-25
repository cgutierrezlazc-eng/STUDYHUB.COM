#!/usr/bin/env python3
"""
Limpia bloques CSS residuales que el script principal no eliminó:
  - .nav-links .nav-cta-link{ ... } con Patrick Hand
  - .nav-links .nav-cta-link:hover{ ... } con rotate
  - Comentarios huérfanos de letras (Entrar / Crear cuenta)
"""

import os
import re
import glob

SANDBOX = "/Users/cristiang./CONNIKU/public/sandbox"
EXCLUDE = {"landing.html", "devices-preview.html"}


def clean(content: str) -> str:
    # Eliminar .nav-links .nav-cta-link{ ... } residual (handwritten version)
    # Solo si contiene Patrick Hand o Caveat (para no eliminar la nueva ya inyectada)
    content = re.sub(
        r'\s*\.nav-links\s+\.nav-cta-link\s*\{[^}]*(?:Patrick\s*Hand|Caveat|#1A4DB3)[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    # .nav-links .nav-cta-link:hover residual con rotate(-2deg)
    content = re.sub(
        r'\s*\.nav-links\s+\.nav-cta-link:hover\s*\{\s*transform\s*:\s*rotate\(-2deg\)[^}]*\}',
        '',
        content,
        flags=re.DOTALL
    )
    # Comentarios huérfanos de letra-por-letra
    content = re.sub(r'\s*/\*\s*Entrar \(\d+ letras\)\s*\*/', '', content)
    content = re.sub(r'\s*/\*\s*Crear cuenta[^*]*\*/', '', content)
    return content


def main():
    pattern = os.path.join(SANDBOX, "*.html")
    all_files = sorted(glob.glob(pattern))
    to_process = [f for f in all_files if os.path.basename(f) not in EXCLUDE]

    changed = 0
    for fp in to_process:
        with open(fp, encoding='utf-8') as f:
            original = f.read()
        result = clean(original)
        if result != original:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(result)
            changed += 1
            print(f"  [PATCH] {os.path.basename(fp)}")

    print(f"\nPatch: {changed} archivos corregidos de {len(to_process)}")


if __name__ == "__main__":
    main()
