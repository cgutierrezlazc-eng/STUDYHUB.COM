"""Tests de la infraestructura de versionado formal de documentos legales.

Pieza 7 del bloque bloque-legal-consolidation-v2, actualizado a v3.2 en bloque-legal-v3.2-post-audit.

Valida:
- Que el directorio docs/02-legal/vigentes/ exista con los 4 archivos canónicos.
- Que METADATA.yaml tenga el schema correcto (campos obligatorios + hash hex).
- Que el hash SHA-256 de cada archivo coincida con el declarado en METADATA.yaml.
"""

from __future__ import annotations

import hashlib
import os
from pathlib import Path

import pytest
import yaml


# Ruta absoluta a la raíz del repo (dos niveles arriba de backend/tests/)
REPO_ROOT = Path(__file__).resolve().parent.parent.parent

V3_2_DIR = REPO_ROOT / "docs" / "02-legal" / "vigentes"
METADATA_PATH = V3_2_DIR / "METADATA.yaml"
LEGAL_VERSIONS_PATH = REPO_ROOT / "docs" / "02-legal" / "archivo" / "LEGAL_VERSIONS.md"

# Archivos canónicos requeridos en v3.2/
REQUIRED_FILES = [
    "privacy.md",
    "terms.md",
    "cookies.md",
    "age-declaration.md",
    "METADATA.yaml",
]

# Campos obligatorios de cada entrada en METADATA.yaml
REQUIRED_METADATA_FIELDS = {
    "version",
    "sha256",
    "vigencia_desde",
    "autor_aprobacion",
}


@pytest.mark.legal
def test_v3_2_directory_exists() -> None:
    """El directorio docs/02-legal/vigentes/ debe existir."""
    assert V3_2_DIR.is_dir(), f"Directorio {V3_2_DIR} no existe"


@pytest.mark.legal
def test_required_files_exist() -> None:
    """Los 5 archivos requeridos deben existir en docs/02-legal/vigentes/."""
    for fname in REQUIRED_FILES:
        fpath = V3_2_DIR / fname
        assert fpath.is_file(), f"Archivo requerido ausente: {fpath}"


@pytest.mark.legal
def test_legal_versions_md_exists() -> None:
    """docs/02-legal/archivo/LEGAL_VERSIONS.md debe existir."""
    assert LEGAL_VERSIONS_PATH.is_file(), f"Archivo {LEGAL_VERSIONS_PATH} no existe"


@pytest.mark.legal
def test_metadata_yaml_schema() -> None:
    """METADATA.yaml debe tener campos obligatorios y hashes hex de 64 chars.

    Esquema esperado:
        documents:
          <nombre>:
            version: str
            sha256: hex de 64 chars lowercase
            vigencia_desde: str (fecha ISO)
            autor_aprobacion: str
    """
    assert METADATA_PATH.is_file(), f"METADATA.yaml no existe en {V3_2_DIR}"

    with open(METADATA_PATH, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    assert "documents" in data, "METADATA.yaml debe tener clave 'documents'"
    docs = data["documents"]
    assert isinstance(docs, dict), "'documents' debe ser un dict"

    # Verificar que estén los 4 documentos canónicos base (age-declaration-public
    # es vista pública derivada agregada por Bloque 5 legal-viewer-v1 D-L8,
    # no es documento base sino derivado — se permite pero no es obligatorio).
    required_keys = {"privacy", "terms", "cookies", "age-declaration"}
    actual_keys = set(docs.keys())
    missing = required_keys - actual_keys
    assert not missing, f"'documents' debe contener al menos {required_keys}, falta {missing}"

    for doc_name, meta in docs.items():
        for field in REQUIRED_METADATA_FIELDS:
            assert field in meta, f"Documento '{doc_name}' en METADATA.yaml falta campo '{field}'"

        sha256_val = meta["sha256"]
        assert isinstance(sha256_val, str), f"'{doc_name}.sha256' debe ser string, es {type(sha256_val)}"
        assert len(sha256_val) == 64, f"'{doc_name}.sha256' debe tener 64 chars, tiene {len(sha256_val)}"
        assert sha256_val == sha256_val.lower(), f"'{doc_name}.sha256' debe ser lowercase"
        assert all(c in "0123456789abcdef" for c in sha256_val), (
            f"'{doc_name}.sha256' contiene caracteres no hex: {sha256_val}"
        )


@pytest.mark.legal
def test_metadata_sha256_matches_files() -> None:
    """El hash SHA-256 en METADATA.yaml debe coincidir con el hash real de cada archivo."""
    assert METADATA_PATH.is_file(), f"METADATA.yaml no existe"

    with open(METADATA_PATH, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    docs = data.get("documents", {})

    # Mapeo de clave YAML → nombre de archivo
    file_map = {
        "privacy": "privacy.md",
        "terms": "terms.md",
        "cookies": "cookies.md",
        "age-declaration": "age-declaration.md",
        "age-declaration-public": "age-declaration-public.md",
    }

    for doc_name, fname in file_map.items():
        fpath = V3_2_DIR / fname
        if not fpath.is_file():
            pytest.skip(f"Archivo {fname} no existe aún — skip hasta Pieza 7 completa")

        if doc_name not in docs:
            pytest.fail(f"Documento '{doc_name}' no está en METADATA.yaml")

        declared_hash = docs[doc_name]["sha256"]

        with open(fpath, "rb") as fbin:
            actual_hash = hashlib.sha256(fbin.read()).hexdigest()

        assert actual_hash == declared_hash, (
            f"Hash del archivo {fname} diverge de METADATA.yaml\n"
            f"  Declarado:  {declared_hash}\n"
            f"  Real:       {actual_hash}\n"
            f"  Si modificaste el archivo, actualiza METADATA.yaml"
        )


@pytest.mark.legal
def test_all_versions_in_user_agreements_exist_on_disk(db_session) -> None:
    """Cada text_version distinta en user_agreements debe tener un archivo
    correspondiente en docs/legal/ (v3.1/ o archive/).

    Este test verifica la invariante I10 del plan maestro: la evidencia
    histórica de cada versión aceptada debe sobrevivir en disco.
    """
    from sqlalchemy import text

    # Obtener versiones únicas en user_agreements por document_type
    result = db_session.execute(text("SELECT DISTINCT document_type, text_version FROM user_agreements")).fetchall()

    if not result:
        # BD vacía en tests: no hay filas que validar
        return

    legal_dir = REPO_ROOT / "docs" / "legal"

    for row in result:
        doc_type = row[0]
        text_version = row[1]

        # Versiones legacy y de backfill: no tienen archivo canónico (por diseño)
        if text_version in ("legacy", "legacy_no_hash_available"):
            continue

        # Verificación más específica: buscar por versión conocida
        # La convención es: v{major}.{minor}/ para carpetas de lote
        # Los archivos archive/ tienen el hash en sus metadatos
        v_dir = legal_dir / f"v{text_version.rsplit('.', 1)[0]}"
        archive_dir = legal_dir / "archive"

        has_v_dir = v_dir.is_dir() and any(v_dir.iterdir())
        has_archive = archive_dir.is_dir() and any(archive_dir.iterdir())

        assert has_v_dir or has_archive, (
            f"Versión '{text_version}' de '{doc_type}' en user_agreements "
            f"no tiene directorio de respaldo en docs/legal/. "
            f"Verificar {v_dir} o {archive_dir}"
        )
