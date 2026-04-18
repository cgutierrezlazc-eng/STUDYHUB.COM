"""Textos legales canónicos del proyecto Conniku (fuente de verdad).

Este módulo es la FUENTE DE VERDAD del texto legal que el usuario acepta al
registrarse. Su hash SHA-256 se almacena en la tabla user_agreements junto con
IP, user-agent y zona horaria para fines probatorios (CLAUDE.md Sección de
Cumplimiento Legal).

Existe un archivo espejo en shared/legal_texts.ts con el mismo texto literal
y el mismo hash. El script scripts/verify-legal-texts-sync.sh valida que
ambos archivos mantienen el hash sincronizado en cada CI.

IMPORTANTE:
- Cualquier cambio al texto genera una nueva versión (bump semver en
  AGE_DECLARATION_VERSION) y obliga a actualizar el archivo .ts.
- No editar espacios ni saltos de línea sin intención: el hash es sensible
  a cualquier diferencia. La normalización es: newlines \\n, sin BOM, sin
  trailing whitespace.
"""

from __future__ import annotations

import hashlib

__all__ = [
    "AGE_DECLARATION_TEXT_V1",
    "AGE_DECLARATION_VERSION",
    "AGE_DECLARATION_HASH",
    "compute_hash",
]

# Texto canónico del checkbox declarativo de edad (Componente 2 de
# CLAUDE.md §Verificación de edad). Versión oficial, sin parafrasear.
AGE_DECLARATION_TEXT_V1 = (
    "Al marcar esta casilla, declaro bajo fe de juramento que:\n"
    "\n"
    "1. Soy mayor de 18 años a la fecha de este registro.\n"
    "2. Los datos proporcionados, incluyendo mi fecha de nacimiento, son verdaderos y pueden ser verificados por Conniku en cualquier momento.\n"
    "3. Entiendo que declarar información falsa constituye causal inmediata de terminación de mi cuenta, pérdida total de membresía, eliminación de todos mis datos, y podrá acarrear responsabilidad civil y penal según la legislación vigente.\n"
    "4. Eximo a Conniku SpA de toda responsabilidad derivada de información falsa que yo haya proporcionado.\n"
    "5. Acepto los Términos y Condiciones del servicio y la Política de Privacidad, que he leído y comprendido."
)

AGE_DECLARATION_VERSION = "1.0.0"


def compute_hash(text: str) -> str:
    """Calcula el hash SHA-256 de un texto en hex lowercase.

    El texto se procesa tal cual (sin trim, sin normalización adicional).
    La normalización de newlines a \\n es responsabilidad de quien define
    el texto canónico arriba.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


AGE_DECLARATION_HASH = compute_hash(AGE_DECLARATION_TEXT_V1)
