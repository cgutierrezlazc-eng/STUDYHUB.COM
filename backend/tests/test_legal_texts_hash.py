"""Tests del módulo shared.legal_texts (fuente de verdad del texto canónico).

Valida que:
- El hash guardado en AGE_DECLARATION_HASH coincide con SHA-256 del texto.
- La versión sigue formato semver.
- El texto empieza con la frase canónica "Al marcar esta casilla...".
- Todo cambio accidental de espacios o tildes dispara divergencia visible.

Estos tests corren en Python. La sincronía con shared/legal_texts.ts se
valida por separado con scripts/verify-legal-texts-sync.sh en CI.
"""

from __future__ import annotations

import hashlib
import re

import pytest

from shared.legal_texts import (
    AGE_DECLARATION_HASH,
    AGE_DECLARATION_TEXT_V1,
    AGE_DECLARATION_VERSION,
    compute_hash,
)


@pytest.mark.legal
def test_hash_coincide_con_constante() -> None:
    """El hash guardado en la constante debe recomputarse igual al texto."""
    recomputado = hashlib.sha256(AGE_DECLARATION_TEXT_V1.encode("utf-8")).hexdigest()
    assert recomputado == AGE_DECLARATION_HASH, (
        "El hash canónico AGE_DECLARATION_HASH no coincide con el SHA-256 del texto actual. "
        "Alguien editó el texto sin actualizar la constante, o viceversa."
    )


@pytest.mark.legal
def test_hash_es_64_caracteres_hex_lowercase() -> None:
    assert re.fullmatch(r"[0-9a-f]{64}", AGE_DECLARATION_HASH), (
        f"AGE_DECLARATION_HASH no es hex 64 chars lowercase: {AGE_DECLARATION_HASH!r}"
    )


@pytest.mark.legal
def test_version_semver_valido() -> None:
    assert re.fullmatch(r"\d+\.\d+\.\d+", AGE_DECLARATION_VERSION), (
        f"AGE_DECLARATION_VERSION no sigue semver: {AGE_DECLARATION_VERSION!r}"
    )


@pytest.mark.legal
def test_texto_empieza_con_frase_canonica() -> None:
    assert AGE_DECLARATION_TEXT_V1.startswith("Al marcar esta casilla, declaro bajo fe de juramento que:"), (
        "El texto canónico cambió su apertura. Requiere aprobación humana y bump de versión."
    )


@pytest.mark.legal
def test_texto_incluye_los_cinco_puntos_obligatorios() -> None:
    """Los 5 puntos de CLAUDE.md §Componente 2 deben estar todos presentes."""
    assert "1. Soy mayor de 18 años" in AGE_DECLARATION_TEXT_V1
    assert "2. Los datos proporcionados" in AGE_DECLARATION_TEXT_V1
    assert "3. Entiendo que declarar información falsa" in AGE_DECLARATION_TEXT_V1
    assert "4. Eximo a Conniku SpA" in AGE_DECLARATION_TEXT_V1
    assert "5. Acepto los Términos y Condiciones" in AGE_DECLARATION_TEXT_V1


@pytest.mark.legal
def test_compute_hash_consistente() -> None:
    """compute_hash debe retornar lowercase hex de 64 chars siempre."""
    result = compute_hash("any text")
    assert len(result) == 64
    assert result == result.lower()


@pytest.mark.legal
def test_compute_hash_cambia_con_texto_modificado() -> None:
    """Cualquier cambio al texto (un espacio extra) cambia el hash."""
    original = compute_hash(AGE_DECLARATION_TEXT_V1)
    con_espacio = compute_hash(AGE_DECLARATION_TEXT_V1 + " ")
    assert original != con_espacio


@pytest.mark.legal
def test_texto_no_menciona_representante_legal() -> None:
    """Regla operacional CLAUDE.md: plataforma exclusiva para adultos sin excepciones."""
    assert "representante legal" not in AGE_DECLARATION_TEXT_V1.lower()
    assert "autorización del" not in AGE_DECLARATION_TEXT_V1.lower()
