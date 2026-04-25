"""Test de sanidad para .env.example.

Verifica que .env.example contenga al menos las variables críticas
necesarias para deploy, pagos, SMTP, OAuth, Push, y feature flags.

No aplica TDD de lógica de negocio — es sanity check de configuración.
Referencia: GAP-C3 del reporte gap-finder 2026-04-21.
"""

from __future__ import annotations

from pathlib import Path

import pytest

# Ruta al .env.example en la raíz del repo
REPO_ROOT = Path(__file__).parent.parent.parent
ENV_EXAMPLE_PATH = REPO_ROOT / ".env.example"

# Variables críticas que DEBEN estar en .env.example
# Agrupadas por categoría para mensajes de error claros
CRITICAL_VARS: dict[str, list[str]] = {
    "Deploy": [
        "DATABASE_URL",
        "JWT_SECRET",
        "ADMIN_EMAIL",
        "SETUP_KEY",
        "ENVIRONMENT",
        "RENDER",
        "CORS_ORIGINS",
        "FRONTEND_URL",
        "BACKEND_URL",
        "OWNER_PASSWORD",
        "BCRYPT_ROUNDS",
    ],
    "Pagos MercadoPago": [
        "MP_ACCESS_TOKEN",
        "MP_PUBLIC_KEY",
        "MP_WEBHOOK_SECRET",
    ],
    "Pagos PayPal": [
        "PAYPAL_CLIENT_ID",
        "PAYPAL_CLIENT_SECRET",
        "PAYPAL_WEBHOOK_ID",
        "PAYPAL_MODE",
    ],
    "Pagos Stripe": [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_MONTHLY",
        "STRIPE_PRICE_YEARLY",
    ],
    "SMTP Zoho": [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_PASS_NOREPLY",
        "SMTP_PASS_CONTACTO",
        "SMTP_PASS_CEO",
        "NOREPLY_EMAIL",
        "CONTACT_EMAIL",
        "CEO_EMAIL",
    ],
    "OAuth Google": [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
    ],
    "Push VAPID": [
        "VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
        "VAPID_EMAIL",
    ],
    "IA y procesamiento": [
        "ANTHROPIC_API_KEY",
    ],
    "IMAP": [
        "IMAP_HOST",
        "IMAP_PORT",
    ],
    "Feature Flags": [
        "LEGAL_GATE_ENFORCE",
        "PUBLIC_REGISTRATION_ENABLED",
    ],
}

# Variables DEPRECATED — deben estar pero marcadas como tal
DEPRECATED_VARS: list[str] = [
    "STRIPE_PRICE_MAX_MONTHLY",
]


def _parse_env_example_keys() -> set[str]:
    """Extrae las claves definidas en .env.example.

    Parsea cada línea que no sea comentario ni vacía y extrae el nombre
    de la variable (parte antes del '='). Soporta líneas de comentario
    (#), líneas vacías, y líneas con '=' con o sin valor.

    Returns:
        Conjunto de nombres de variables encontrados.
    """
    keys: set[str] = set()
    if not ENV_EXAMPLE_PATH.exists():
        return keys

    for line in ENV_EXAMPLE_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key = line.split("=", 1)[0].strip()
            if key:
                keys.add(key)
    return keys


@pytest.fixture(scope="module")
def env_example_keys() -> set[str]:
    """Fixture con el conjunto de claves del .env.example."""
    return _parse_env_example_keys()


def test_env_example_exists() -> None:
    """El archivo .env.example debe existir en la raíz del repo."""
    assert ENV_EXAMPLE_PATH.exists(), (
        f".env.example no encontrado en {ENV_EXAMPLE_PATH}. "
        "Es obligatorio para onboarding de nuevos colaboradores y CI."
    )


@pytest.mark.parametrize("category,vars_list", CRITICAL_VARS.items())
def test_env_example_critical_vars(
    env_example_keys: set[str],
    category: str,
    vars_list: list[str],
) -> None:
    """Cada categoría de variables críticas debe estar en .env.example."""
    missing = [v for v in vars_list if v not in env_example_keys]
    assert not missing, (
        f"Variables de categoría '{category}' ausentes en .env.example: {missing}. Agregar con comentario explicativo."
    )


def test_env_example_deprecated_vars_present(
    env_example_keys: set[str],
) -> None:
    """Variables deprecated deben estar documentadas (con marcador DEPRECATED)."""
    env_text = ENV_EXAMPLE_PATH.read_text(encoding="utf-8")
    for var in DEPRECATED_VARS:
        assert var in env_text, (
            f"Variable deprecated '{var}' no encontrada en .env.example. "
            "Debe estar con marcador # [DEPRECATED] para avisar a quien configure."
        )


def test_env_example_deprecated_vars_have_marker(
    env_example_keys: set[str],
) -> None:
    """Variables deprecated deben tener el marcador [DEPRECATED] en su línea o comentario adyacente."""
    env_text = ENV_EXAMPLE_PATH.read_text(encoding="utf-8")
    for var in DEPRECATED_VARS:
        # Buscar la línea del var y su contexto (líneas cercanas)
        lines = env_text.splitlines()
        for i, line in enumerate(lines):
            if var in line:
                # Verificar que en la misma línea o en las 2 líneas previas
                # existe algún marcador de deprecated
                context = "\n".join(lines[max(0, i - 2) : i + 2]).upper()
                assert "DEPRECATED" in context or "DEPRECAT" in context, (
                    f"Variable '{var}' no tiene marcador DEPRECATED en su contexto. "
                    "Agregar '# [DEPRECATED]' en el comentario adyacente."
                )
                break


def test_env_example_has_sections() -> None:
    """El .env.example debe tener secciones con encabezados ## para legibilidad."""
    env_text = ENV_EXAMPLE_PATH.read_text(encoding="utf-8")
    section_headers = [line for line in env_text.splitlines() if line.startswith("##")]
    assert len(section_headers) >= 5, (
        f"Se esperan al menos 5 secciones (##) en .env.example, encontradas {len(section_headers)}: {section_headers}"
    )
