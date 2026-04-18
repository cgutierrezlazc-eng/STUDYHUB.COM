"""Test de coherencia del prompt del asistente Konni (backend/server.py).

CLAUDE.md §Regla operacional establece que Conniku es plataforma exclusiva
para mayores de 18 años sin excepciones. El prompt del chatbot debe
reflejar esta regla y NO ofrecer modalidad alternativa para menores.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

_SERVER_PATH = Path(__file__).resolve().parent.parent / "server.py"


@pytest.fixture(scope="module")
def server_source() -> str:
    return _SERVER_PATH.read_text(encoding="utf-8")


@pytest.mark.legal
def test_prompt_no_menciona_representante_legal(server_source: str) -> None:
    """Ningún string en server.py puede mencionar 'representante legal' en
    contexto de elegibilidad. Esta frase habilita cuentas de menores con
    autorización parental, prohibido por CLAUDE.md."""
    assert "representante legal" not in server_source.lower(), (
        "server.py contiene 'representante legal'. Esta frase habilita cuentas "
        "de menores con autorización parental, prohibido por CLAUDE.md §Regla "
        "operacional: plataforma exclusiva para adultos."
    )


@pytest.mark.legal
def test_prompt_no_menciona_autorizacion_parental(server_source: str) -> None:
    patterns = [
        r"autorizaci[oó]n\s+del\s+representante",
        r"autorizaci[oó]n\s+parental",
        r"autorizaci[oó]n\s+del\s+tutor",
        r"consentimiento\s+parental",
    ]
    lowered = server_source.lower()
    for pat in patterns:
        assert not re.search(pat, lowered), (
            f"server.py contiene variante de autorización parental: {pat!r}. "
            "Prohibido por CLAUDE.md §plataforma exclusiva para adultos."
        )


@pytest.mark.legal
def test_prompt_declara_regla_18_mas(server_source: str) -> None:
    """Para dejar el prompt coherente con la política, debe declarar 18+ explícito."""
    assert "18" in server_source, "Regla de edad mínima debería mencionarse en el prompt"
