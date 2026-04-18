"""Tests de migración para las 8 tablas del módulo Workspaces v2.

Valida:
- migrate() crea las 8 tablas nuevas en SQLite in-memory.
- migrate() es idempotente: segunda ejecución sin errores ni cambios.
- migrate() no falla si las tablas ya existen antes de correr.
"""

from __future__ import annotations

import os
import sys

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import StaticPool

# Asegurar sys.path
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

_WORKSPACE_TABLES = [
    "workspace_documents",
    "workspace_members",
    "workspace_versions",
    "workspace_messages",
    "workspace_athena_chats",
    "workspace_athena_suggestions",
    "workspace_comments",
    "athena_usage",
]


@pytest.fixture
def migration_engine(tmp_path):
    """Engine SQLite in-memory con Base.metadata creado y DATABASE_URL unset."""
    os.environ.pop("DATABASE_URL", None)

    from database import Base  # type: ignore

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


def test_migrate_crea_8_tablas_workspace(migration_engine) -> None:
    """migrate() crea todas las tablas workspace si no existen."""
    import migrations  # type: ignore

    # Parcheamos el engine que usa migrations.py
    import database  # type: ignore

    original_engine = database.engine
    database.engine = migration_engine

    try:
        migrations.migrate()
        inspector = inspect(migration_engine)
        for table in _WORKSPACE_TABLES:
            assert inspector.has_table(table), f"migrate() no creó la tabla '{table}'"
    finally:
        database.engine = original_engine


def test_migrate_es_idempotente(migration_engine) -> None:
    """Ejecutar migrate() dos veces no lanza excepción ni duplica tablas."""
    import migrations  # type: ignore
    import database  # type: ignore

    original_engine = database.engine
    database.engine = migration_engine

    try:
        # Primera ejecución
        migrations.migrate()
        inspector = inspect(migration_engine)
        tables_after_first = set(inspector.get_table_names())

        # Segunda ejecución — debe ser silenciosa
        migrations.migrate()
        tables_after_second = set(inspector.get_table_names())

        assert tables_after_first == tables_after_second, "migrate() añadió o eliminó tablas en segunda ejecución"
        for table in _WORKSPACE_TABLES:
            assert table in tables_after_second
    finally:
        database.engine = original_engine


def test_migrate_no_falla_si_tablas_existen(migration_engine) -> None:
    """Pre-crear las tablas manualmente y luego migrate() no lanza error."""
    import migrations  # type: ignore
    import database  # type: ignore

    original_engine = database.engine
    database.engine = migration_engine

    try:
        # Pre-crear solo workspace_documents manualmente
        with migration_engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE IF NOT EXISTS workspace_documents (
                    id VARCHAR(16) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    owner_id VARCHAR(16) NOT NULL
                )
            """)
            )

        # migrate() debe detectar que ya existe y saltar sin error
        migrations.migrate()
        inspector = inspect(migration_engine)
        assert inspector.has_table("workspace_documents")
    finally:
        database.engine = original_engine
