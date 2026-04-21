"""Textos canónicos del banner de consentimiento de cookies (fuente de verdad).

Este módulo contiene el texto canónico de las categorías del banner de cookies
de Conniku, cuyo SHA-256 se almacena en la tabla ``cookie_consents`` como
``policy_hash`` para fines probatorios (GDPR Art. 7(1) — demostrabilidad del
consentimiento; Orange Romania C-61/19 TJUE 2020-11-11).

Existe (o existirá) un archivo espejo en ``shared/cookie_consent_texts.ts``
para uso del frontend. Pieza 4 del bloque sincroniza ambos archivos y valida
que el hash sea byte-a-byte idéntico.

IMPORTANTE:
- Cualquier cambio al texto genera una nueva versión (bump semver en
  COOKIE_CATEGORIES_VERSION) y obliga a actualizar el espejo .ts y a
  recalcular COOKIE_CONSENT_POLICY_HASH en
  ``backend/constants/legal_versions.py``.
- No editar espacios ni saltos de línea sin intención: el hash es sensible
  a cualquier diferencia. La normalización es: newlines \\n, sin BOM, sin
  trailing whitespace.
- Los cambios a este archivo requieren commit tipo ``legal:`` con aprobación
  humana explícita (CLAUDE.md §Constantes legales en el código).
"""

from __future__ import annotations

import hashlib

__all__ = [
    "COOKIE_CATEGORIES_TEXT_V1",
    "COOKIE_CATEGORIES_VERSION",
    "COOKIE_CATEGORIES_HASH",
    "compute_cookie_hash",
]

# Texto canónico de las categorías del banner de cookies (plan §9.2).
# Versión 1.0.0 — borrador pendiente aprobación legal (Capa 0 bloque).
# Fuente de verdad: docs/plans/bloque-cookie-consent-banner-v1/plan.md §9.2.
#
# Este texto es la cadena cuyos bytes se hashean para generar la prueba de
# consentimiento. El frontend muestra el texto de forma más visual (HTML/CSS),
# pero el hash se calcula sobre esta cadena canónica normalizada.
#
# Referencia legal:
# - GDPR Art. 7(1): demostrabilidad del consentimiento (carga de la prueba).
# - GDPR Art. 4(11): consentimiento libre, específico, informado, inequívoco.
# - Planet49 C-673/17 (TJUE 2019-10-01): toggles no esenciales OFF por defecto.
# - Orange Romania C-61/19 (TJUE 2020-11-11): registro con evidencia de qué
#   texto exacto fue aceptado.
COOKIE_CATEGORIES_TEXT_V1 = (
    "necessary: Estrictamente necesarias. Siempre activas. Permiten iniciar sesión, "
    "mantener tu sesión abierta y que Conniku funcione offline. Sin ellas, el servicio "
    "no puede prestarse. Base legal: ejecución del contrato (Art. 6(1)(b) RGPD).\n"
    "functional: Funcionales. Recuerdan tu idioma, tema visual, tour de bienvenida y "
    "progreso académico local entre visitas. No se comparten con terceros con fines publicitarios.\n"
    "analytics: Analíticas. Nos permiten entender cómo se usa Conniku de forma anónima "
    "y agregada, para mejorar la plataforma. Hoy no tenemos integraciones externas activas; "
    "este toggle queda preparado para cuando las activemos.\n"
    "marketing: Marketing. Nos permiten medir el resultado de campañas y enviarte "
    "comunicaciones comerciales según tus intereses. Hoy Conniku no usa cookies de marketing "
    "y tus datos personales no se comparten con redes publicitarias. "
    "Este toggle queda preparado para futuras funcionalidades opcionales."
)

# v1.1.0 — D-02: marketing reformulado (cita no uso actual + no comparte con redes publicitarias
#                + toggle para futuras funcionalidades opcionales).
#          D-03: functional agrega 'No se comparten con terceros con fines publicitarios.'
#          Cambio aprobado por Cristian en Capa 0 bloque-cookie-consent-banner-v1.
COOKIE_CATEGORIES_VERSION = "1.1.0"


def compute_cookie_hash(text: str) -> str:
    """Calcula el hash SHA-256 de un texto canónico en hex lowercase.

    El texto se procesa tal cual (sin trim, sin normalización adicional).
    La normalización de newlines a \\n es responsabilidad de quien define
    el texto canónico arriba.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


COOKIE_CATEGORIES_HASH = compute_cookie_hash(COOKIE_CATEGORIES_TEXT_V1)
