"""Versiones canónicas de los documentos legales publicados por Conniku.

Cada documento publicado en ``docs/legal/v3.2/`` tiene tres coordenadas:
- ``document_type``: identificador estable usado en la tabla
  ``user_agreements`` (no cambia entre versiones).
- ``version``: número semántico del documento (MAJOR.MINOR.PATCH). Un
  cambio MAJOR o MINOR fuerza re-aceptación del usuario conforme al
  mecanismo de la Pieza 6 del bloque ``bloque-legal-consolidation-v2``.
- ``hash``: hash SHA-256 del archivo Markdown canónico registrado en
  ``docs/legal/v3.2/METADATA.yaml``. Se almacena en
  ``user_agreements.text_version_hash`` al aceptar como prueba
  irrefutable de qué texto exacto fue aceptado.

Archivo espejado en ``shared/legal_constants.ts`` para uso del frontend.

Cambios a estos valores requieren commit dedicado con tipo ``legal:`` y
aprobación humana explícita antes de merge (CLAUDE.md §18.7). El hash de
cada documento se recalcula con::

    sha256sum docs/legal/v3.2/<archivo>.md

y se actualiza tanto aquí como en ``docs/legal/v3.2/METADATA.yaml``.
"""

from __future__ import annotations


# --- Términos y Condiciones -------------------------------------------------
TOS_DOCUMENT_TYPE: str = "tos"
TOS_VERSION: str = "3.2.0"
# SHA-256 de docs/legal/v3.2/terms.md (Art. 3 bis letra b Ley 19.496 + 18+).
# Aprobado por abogado externo en auditoría 2026-04-20.
TOS_HASH: str = "9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce"


# --- Política de Privacidad -------------------------------------------------
PRIVACY_DOCUMENT_TYPE: str = "privacy"
PRIVACY_VERSION: str = "2.4.0"
# SHA-256 de docs/legal/v3.2/privacy.md (encargados Supabase, FCM,
# Capacitor, Google OAuth, Anthropic, MercadoPago, PayPal, Zoho,
# Vercel, Render).
# Aprobado por abogado externo en auditoría 2026-04-20.
PRIVACY_HASH: str = "7a8ba81d0be22cc1deee7d92764baaac1a598a662b84d9ba90043b2a25f63f6c"


# --- Política de Cookies ----------------------------------------------------
COOKIES_DOCUMENT_TYPE: str = "cookies"
COOKIES_VERSION: str = "1.0.0"
# SHA-256 de docs/legal/v3.1/cookies.md (stub inicial; se recalcula cuando
# el markdown se sincronice byte a byte con el render de
# src/pages/CookiesPolicy.tsx — seguimiento en docs/legal/alerts.md).
COOKIES_HASH: str = "a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9"


# --- Declaración de Edad (checkbox declarativo) ----------------------------
AGE_DECLARATION_DOCUMENT_TYPE: str = "age_declaration"
AGE_DECLARATION_VERSION: str = "1.0.0"
# SHA-256 del TEXTO CANÓNICO de age-declaration (AGE_DECLARATION_TEXT_V1 en
# shared/legal_texts.py). INMUTABLE: es el hash almacenado en
# user_agreements.text_version_hash por cada usuario que aceptó el checkbox.
# Si este valor cambia, invalida los registros de aceptación existentes.
# Fuente: shared/legal_texts.py::AGE_DECLARATION_TEXT_V1.
AGE_DECLARATION_TEXT_HASH: str = "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706"
# SHA-256 del archivo docs/legal/v3.2/age-declaration.md (snapshot completo).
# Este hash sí puede cambiar cuando se actualizan las notas de cumplimiento
# sin modificar el texto canónico del checkbox.
AGE_DECLARATION_FILE_HASH: str = "61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b"


# --- Consentimiento de cookies (bloque-cookie-consent-banner-v1) -----------
# Constantes para la tabla cookie_consents. Son DISTINTAS de COOKIES_HASH
# (que es el hash del archivo markdown de la política de cookies).
# COOKIE_CONSENT_POLICY_HASH es el hash del texto canónico de las categorías
# del banner (shared/cookie_consent_texts.py::COOKIE_CATEGORIES_TEXT_V1).
#
# Referencia legal:
# - GDPR Art. 7(1): demostrabilidad del consentimiento.
# - Orange Romania C-61/19 (TJUE 2020-11-11): carga de la prueba al
#   encargado del tratamiento.
# - Ley 19.628 Art. 4°: información al titular al momento de recolectar.
#
# El hash se recalcula con:
#   python3.11 -c "from shared.cookie_consent_texts import COOKIE_CATEGORIES_HASH; print(COOKIE_CATEGORIES_HASH)"
#
# Fecha de verificación: 2026-04-20.
# Verificador: backend-builder (Tori).
COOKIE_CONSENT_POLICY_VERSION: str = "1.1.0"
# SHA-256 de shared/cookie_consent_texts.py::COOKIE_CATEGORIES_TEXT_V1.
# Versión 1.1.0 — D-02: marketing reformulado + D-03: functional agrega aclaración
# sobre no compartir con terceros con fines publicitarios.
# Aprobado por Cristian en Capa 0 bloque-cookie-consent-banner-v1 (2026-04-21).
# Valor calculado: python3.11 -c "from shared.cookie_consent_texts import COOKIE_CATEGORIES_HASH; print(COOKIE_CATEGORIES_HASH)"
COOKIE_CONSENT_POLICY_HASH: str = "26e5a20e5f9692a953ca9a840d4639868d7358e5edc4401a2eac4341c6819f14"

# Categorías válidas de consentimiento de cookies.
# Estas 4 categorías son las únicas aceptadas en el campo categories_accepted.
# Fuente: GDPR Art. 5(3) ePrivacy + EDPB 05/2020 §3.
COOKIE_CONSENT_CATEGORIES: list[str] = [
    "necessary",
    "functional",
    "analytics",
    "marketing",
]


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
