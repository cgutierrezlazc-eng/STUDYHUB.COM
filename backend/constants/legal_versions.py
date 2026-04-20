"""Versiones canónicas de los documentos legales publicados por Conniku.

Cada documento publicado en ``docs/legal/v3.1/`` tiene tres coordenadas:
- ``document_type``: identificador estable usado en la tabla
  ``user_agreements`` (no cambia entre versiones).
- ``version``: número semántico del documento (MAJOR.MINOR.PATCH). Un
  cambio MAJOR o MINOR fuerza re-aceptación del usuario conforme al
  mecanismo de la Pieza 6 del bloque ``bloque-legal-consolidation-v2``.
- ``hash``: hash SHA-256 del archivo Markdown canónico registrado en
  ``docs/legal/v3.1/METADATA.yaml``. Se almacena en
  ``user_agreements.text_version_hash`` al aceptar como prueba
  irrefutable de qué texto exacto fue aceptado.

Archivo espejado en ``shared/legal_constants.ts`` para uso del frontend.

Cambios a estos valores requieren commit dedicado con tipo ``legal:`` y
aprobación humana explícita antes de merge (CLAUDE.md §18.7). El hash de
cada documento se recalcula con::

    sha256sum docs/legal/v3.1/<archivo>.md

y se actualiza tanto aquí como en ``docs/legal/v3.1/METADATA.yaml``.
"""

from __future__ import annotations


# --- Términos y Condiciones -------------------------------------------------
TOS_DOCUMENT_TYPE: str = "tos"
TOS_VERSION: str = "3.1.0"
# SHA-256 de docs/legal/v3.1/terms.md (Art. 3 bis letra b Ley 19.496 + 18+).
TOS_HASH: str = "e3780c975df95ef48b07147940b406e6b3fa8d374aa466d2dd86a3dd8a85a98f"


# --- Política de Privacidad -------------------------------------------------
PRIVACY_DOCUMENT_TYPE: str = "privacy"
PRIVACY_VERSION: str = "2.3.0"
# SHA-256 de docs/legal/v3.1/privacy.md (encargados Supabase, FCM,
# Capacitor, Google OAuth, Anthropic, MercadoPago, PayPal, Zoho,
# Vercel, Render).
PRIVACY_HASH: str = "0f7e0a3dc287da20bbbeede903622e005782cb4d927c4d01ebe35d22c3fd591f"


# --- Política de Cookies ----------------------------------------------------
COOKIES_DOCUMENT_TYPE: str = "cookies"
COOKIES_VERSION: str = "1.0.0"
# SHA-256 de docs/legal/v3.1/cookies.md (stub inicial; se recalcula cuando
# el markdown se sincronice byte a byte con el render de
# src/pages/CookiesPolicy.tsx — seguimiento en docs/legal/alerts.md).
COOKIES_HASH: str = "a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9"


# --- Registro consolidado ---------------------------------------------------
REACCEPT_DOCUMENTS: list[tuple[str, str, str]] = [
    (TOS_DOCUMENT_TYPE, TOS_VERSION, TOS_HASH),
    (PRIVACY_DOCUMENT_TYPE, PRIVACY_VERSION, PRIVACY_HASH),
    (COOKIES_DOCUMENT_TYPE, COOKIES_VERSION, COOKIES_HASH),
]
"""Lista canónica de los documentos sujetos al gate de re-aceptación.

Un usuario se considera "al día" cuando en la tabla ``user_agreements``
existe al menos una fila por cada entrada de esta lista con ``text_version``
igual al valor publicado y ``text_version_hash`` igual al hash publicado.
"""
