"""Tests de invariante para el bump de versiones v3.2 en legal_versions.py.

Pieza 2a del bloque bloque-legal-v3.2-post-audit.

Valida que:
- Los hashes en backend/constants/legal_versions.py coinciden con los archivos
  reales en docs/02-legal/vigentes/*.md (invariantes 1 y 2 del plan §6).
- Las versiones TOS y PRIVACY fueron bumpeadas a 3.2.0 y 2.4.0 respectivamente.
- Cookies mantiene 1.0.0 (sin cambio de texto).
- El hash del TEXTO canónico de age-declaration (entre separadores ---) es
  ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706 (inmutable).
- El hash del archivo age-declaration.md coincide con lo declarado en
  legal_versions.py si el archivo tiene constante dedicada.

Si algún hash difiere, el mensaje de fallo identifica exactamente cuál diverge
y qué archivo hay que actualizar.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

V3_2_DIR = REPO_ROOT / "docs" / "legal" / "v3.2"

# Hashes calculados por legal-docs-keeper en Pieza 1 y verificados con shasum.
# Son los valores de referencia para esta suite. Si los archivos .md cambian,
# estos valores deben ser actualizados en el mismo commit que los archivos.
EXPECTED_HASHES = {
    "terms.md": "9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce",
    "privacy.md": "a09d799c7f34d7100b9393ad7c55c54931ab7e396d0f03b559a59545638e6962",
    "cookies.md": "80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c",
    "age-declaration.md": "61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b",
}

# Hash del TEXTO canónico de age-declaration (entre separadores ---).
# INMUTABLE: es el que se almacena en user_agreements.text_version_hash.
AGE_DECLARATION_CANONICAL_HASH = "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706"


def _sha256_file(path: Path) -> str:
    """Calcula SHA-256 de un archivo en modo binario."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _extract_canonical_text(age_decl_path: Path) -> str:
    """Extrae el texto canónico de age-declaration.md (entre separadores ---).

    El formato del archivo es:
        ---                          ← sep[0]: apertura frontmatter
        frontmatter YAML
        ---                          ← sep[1]: cierre frontmatter

        ## Título y secciones intro
        ...

        ---                          ← sep[2]: apertura del bloque canónico
        Al marcar esta casilla...    ← TEXTO CANÓNICO (5 puntos del checkbox)
        ---                          ← sep[3]: cierre del bloque canónico

        ## Notas de cumplimiento
        ...

    El texto canónico es la sección entre sep[2] y sep[3], stripped.
    El hash se calcula sobre el string stripped, de modo que coincide con
    AGE_DECLARATION_TEXT_V1 en shared/legal_texts.py (fuente de verdad).
    """
    content = age_decl_path.read_text(encoding="utf-8")
    lines = content.splitlines(keepends=True)

    separator_indices = [i for i, line in enumerate(lines) if line.strip() == "---"]

    # El frontmatter YAML está entre separator_indices[0] y separator_indices[1].
    # Las secciones intro están entre separator_indices[1] y separator_indices[2].
    # El texto canónico del checkbox está entre separator_indices[2] y separator_indices[3].
    if len(separator_indices) < 4:
        pytest.fail(
            f"age-declaration.md no tiene la estructura esperada (mínimo 4 separadores ---). "
            f"Separadores encontrados en líneas: {[i + 1 for i in separator_indices]}"
        )

    start = separator_indices[2] + 1  # línea después de la apertura del bloque canónico
    end = separator_indices[3]  # línea del cierre del bloque canónico

    canonical_lines = lines[start:end]
    # Strip para que el hash coincida con AGE_DECLARATION_TEXT_V1 en shared/legal_texts.py
    return "".join(canonical_lines).strip()


# ---------------------------------------------------------------------------
# Tests de archivos v3.2 en disco
# ---------------------------------------------------------------------------


@pytest.mark.legal
def test_v3_2_directory_exists() -> None:
    """El directorio docs/02-legal/vigentes/ debe existir con los 4 archivos canónicos."""
    assert V3_2_DIR.is_dir(), f"Directorio {V3_2_DIR} no existe"
    for fname in EXPECTED_HASHES:
        assert (V3_2_DIR / fname).is_file(), f"Archivo canónico ausente: {V3_2_DIR / fname}"


@pytest.mark.legal
@pytest.mark.parametrize("fname,expected_hash", list(EXPECTED_HASHES.items()))
def test_v3_2_file_hash_matches_expected(fname: str, expected_hash: str) -> None:
    """El hash SHA-256 de cada archivo v3.2 coincide con el valor declarado en Pieza 1.

    Si este test falla, algún archivo fue modificado después de que legal-docs-keeper
    calculó los hashes. Actualizar METADATA.yaml, legal_versions.py y
    shared/legal_constants.ts en el mismo commit.
    """
    fpath = V3_2_DIR / fname
    if not fpath.is_file():
        pytest.skip(f"{fname} no existe en v3.2/ — skip hasta que Pieza 1 complete")

    actual = _sha256_file(fpath)
    assert actual == expected_hash, (
        f"Hash de {fname} DIVERGE:\n"
        f"  Esperado (Pieza 1):  {expected_hash}\n"
        f"  Real en disco:       {actual}\n"
        f"  Actualizar METADATA.yaml, legal_versions.py y shared/legal_constants.ts."
    )


# ---------------------------------------------------------------------------
# Tests del texto canónico de age-declaration (hash INMUTABLE)
# ---------------------------------------------------------------------------


@pytest.mark.legal
def test_age_declaration_canonical_text_hash_unchanged() -> None:
    """El TEXTO canónico de age-declaration.md (entre separadores ---) es inmutable.

    Este es el hash almacenado en user_agreements.text_version_hash.
    Si cambia, invalida el consentimiento de todos los usuarios existentes.
    """
    age_decl_path = V3_2_DIR / "age-declaration.md"
    if not age_decl_path.is_file():
        pytest.skip("age-declaration.md no existe en v3.2/ — skip")

    canonical_text = _extract_canonical_text(age_decl_path)
    actual_hash = hashlib.sha256(canonical_text.encode("utf-8")).hexdigest()

    assert actual_hash == AGE_DECLARATION_CANONICAL_HASH, (
        "El TEXTO CANÓNICO de age-declaration.md CAMBIÓ (hash diverge).\n"
        f"  Esperado (inmutable): {AGE_DECLARATION_CANONICAL_HASH}\n"
        f"  Real:                 {actual_hash}\n"
        "CRÍTICO: este cambio invalida user_agreements.text_version_hash de "
        "todos los usuarios existentes. Requiere aprobación humana explícita "
        "y bloque de re-aceptación separado."
    )


# ---------------------------------------------------------------------------
# Tests de backend/constants/legal_versions.py
# ---------------------------------------------------------------------------


@pytest.mark.legal
def test_legal_versions_py_tos_version_bumped() -> None:
    """TOS_VERSION debe ser '3.2.0' (bumpeado desde 3.1.0 en v3.2)."""
    from backend.constants.legal_versions import TOS_VERSION

    assert TOS_VERSION == "3.2.0", (
        f"TOS_VERSION debe ser '3.2.0', encontrado '{TOS_VERSION}'. "
        "Aplicar bump en backend/constants/legal_versions.py."
    )


@pytest.mark.legal
def test_legal_versions_py_privacy_version_bumped() -> None:
    """PRIVACY_VERSION debe ser '2.4.2' (bumpeado por bloque sandbox-integrity-v1)."""
    from backend.constants.legal_versions import PRIVACY_VERSION

    assert PRIVACY_VERSION == "2.4.2", (
        f"PRIVACY_VERSION debe ser '2.4.2', encontrado '{PRIVACY_VERSION}'. "
        "Aplicar bump en backend/constants/legal_versions.py."
    )


@pytest.mark.legal
def test_legal_versions_py_cookies_version_unchanged() -> None:
    """COOKIES_VERSION debe permanecer '1.0.0' (sin cambio de texto en v3.2)."""
    from backend.constants.legal_versions import COOKIES_VERSION

    assert COOKIES_VERSION == "1.0.0", f"COOKIES_VERSION no debía cambiar en v3.2, encontrado '{COOKIES_VERSION}'."


@pytest.mark.legal
def test_legal_versions_py_tos_hash_matches_v3_2_file() -> None:
    """TOS_HASH en legal_versions.py debe coincidir con el hash real de docs/02-legal/vigentes/terms.md.

    Invariante 1 del plan §6: sha256(terms.md) == TOS_HASH en legal_versions.py.
    """
    from backend.constants.legal_versions import TOS_HASH

    terms_path = V3_2_DIR / "terms.md"
    if not terms_path.is_file():
        pytest.skip("docs/02-legal/vigentes/terms.md no existe — skip")

    actual = _sha256_file(terms_path)
    assert actual == TOS_HASH, (
        f"TOS_HASH en legal_versions.py DIVERGE del archivo real:\n"
        f"  En disco:     {actual}\n"
        f"  En constante: {TOS_HASH}\n"
        f"  Actualizar TOS_HASH en backend/constants/legal_versions.py."
    )


@pytest.mark.legal
def test_legal_versions_py_privacy_hash_matches_v3_2_file() -> None:
    """PRIVACY_HASH en legal_versions.py debe coincidir con el hash real de docs/02-legal/vigentes/privacy.md.

    Invariante 2 del plan §6: sha256(privacy.md) == PRIVACY_HASH en legal_versions.py.
    """
    from backend.constants.legal_versions import PRIVACY_HASH

    privacy_path = V3_2_DIR / "privacy.md"
    if not privacy_path.is_file():
        pytest.skip("docs/02-legal/vigentes/privacy.md no existe — skip")

    actual = _sha256_file(privacy_path)
    assert actual == PRIVACY_HASH, (
        f"PRIVACY_HASH en legal_versions.py DIVERGE del archivo real:\n"
        f"  En disco:     {actual}\n"
        f"  En constante: {PRIVACY_HASH}\n"
        f"  Actualizar PRIVACY_HASH en backend/constants/legal_versions.py."
    )


@pytest.mark.legal
def test_legal_versions_py_cookies_hash_matches_v3_2_file() -> None:
    """COOKIES_HASH en legal_versions.py debe coincidir con el hash real de docs/02-legal/vigentes/cookies.md.

    Invariante 3 del plan §6: sha256(cookies.md) == sha256(v3.1/cookies.md) (cookies estable).
    """
    from backend.constants.legal_versions import COOKIES_HASH

    cookies_path = V3_2_DIR / "cookies.md"
    if not cookies_path.is_file():
        pytest.skip("docs/02-legal/vigentes/cookies.md no existe — skip")

    actual = _sha256_file(cookies_path)
    assert actual == COOKIES_HASH, (
        f"COOKIES_HASH en legal_versions.py DIVERGE del archivo real:\n"
        f"  En disco:     {actual}\n"
        f"  En constante: {COOKIES_HASH}\n"
        f"  Actualizar COOKIES_HASH en backend/constants/legal_versions.py."
    )


@pytest.mark.legal
def test_legal_versions_py_tos_hash_is_valid_hex64() -> None:
    """TOS_HASH debe ser un string hex de 64 caracteres lowercase."""
    from backend.constants.legal_versions import TOS_HASH

    assert re.fullmatch(r"[0-9a-f]{64}", TOS_HASH), f"TOS_HASH no es hex 64 chars lowercase: {TOS_HASH!r}"


@pytest.mark.legal
def test_legal_versions_py_privacy_hash_is_valid_hex64() -> None:
    """PRIVACY_HASH debe ser un string hex de 64 caracteres lowercase."""
    from backend.constants.legal_versions import PRIVACY_HASH

    assert re.fullmatch(r"[0-9a-f]{64}", PRIVACY_HASH), f"PRIVACY_HASH no es hex 64 chars lowercase: {PRIVACY_HASH!r}"


@pytest.mark.legal
def test_reaccept_documents_list_reflects_v3_2_versions() -> None:
    """REACCEPT_DOCUMENTS debe reflejar las versiones v3.2 (TOS 3.2.0, PRIVACY 2.4.2, COOKIES 1.0.0)."""
    from backend.constants.legal_versions import REACCEPT_DOCUMENTS

    versions = {doc_type: (version, hash_) for doc_type, version, hash_ in REACCEPT_DOCUMENTS}

    assert "tos" in versions, "REACCEPT_DOCUMENTS debe incluir 'tos'"
    assert "privacy" in versions, "REACCEPT_DOCUMENTS debe incluir 'privacy'"
    assert "cookies" in versions, "REACCEPT_DOCUMENTS debe incluir 'cookies'"

    assert versions["tos"][0] == "3.2.0", f"Versión TOS en REACCEPT_DOCUMENTS: '{versions['tos'][0]}', esperada '3.2.0'"
    assert versions["privacy"][0] == "2.4.2", (
        f"Versión PRIVACY en REACCEPT_DOCUMENTS: '{versions['privacy'][0]}', esperada '2.4.2'"
    )
    assert versions["cookies"][0] == "1.0.0", (
        f"Versión COOKIES en REACCEPT_DOCUMENTS: '{versions['cookies'][0]}', esperada '1.0.0'"
    )
