"""Fixtures compartidas para los tests del backend Conniku.

Configura una BD SQLite in-memory por test para evitar ensuciar la BD real.
"""

from __future__ import annotations

import os
import sys
from collections.abc import Generator
from datetime import UTC, datetime

# Asegurar que tanto el root del backend como el repo root estén en sys.path
# para que `from database` y `from shared.legal_texts` funcionen.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REPO_ROOT = os.path.dirname(_BACKEND_DIR)
for _path in (_BACKEND_DIR, _REPO_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)

# NO forzar DATABASE_URL: database.py tiene una rama que aplica parámetros
# específicos de Postgres (pool_size, max_overflow) cuando DATABASE_URL está
# set, y eso revienta con SQLite. Dejamos DATABASE_URL unset para que use
# la rama SQLite local, y los fixtures crean su propio engine in-memory.
os.environ.pop("DATABASE_URL", None)
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("OWNER_PASSWORD", "test-owner-password")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("BCRYPT_ROUNDS", "4")  # 4 rounds acelera tests vs producción (12)

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Sesión de BD SQLite in-memory, aislada por test."""
    # Import tardío para que DATABASE_URL ya esté fijada.
    from database import Base  # type: ignore

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def test_user_factory(db_session: Session):
    """Factory para crear usuarios de prueba.

    Usa campos mínimos requeridos por el modelo User actual: email, username,
    user_number, first_name, last_name. Los demás campos toman defaults de la
    definición del modelo.
    """
    from database import User  # type: ignore

    created: list[User] = []
    counter = {"n": 1000}  # base para user_number único

    def _create(
        email: str = "test@conniku.com",
        first_name: str = "Test",
        last_name: str = "User",
        birth_date: str = "2000-01-01",
        is_admin: bool = False,
    ) -> User:
        counter["n"] += 1
        username_slug = email.split("@")[0].replace(".", "").replace("+", "")[:40]
        user = User(
            email=email,
            username=username_slug + str(counter["n"]),
            user_number=counter["n"],
            password_hash="$2b$04$test.hash.placeholder",  # bcrypt dummy
            first_name=first_name,
            last_name=last_name,
            birth_date=birth_date,
            is_admin=is_admin,
            created_at=datetime.now(UTC).replace(tzinfo=None),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        created.append(user)
        return user

    yield _create

    # Cleanup (opcional, el rollback del fixture db_session ya lo hace)
    for user in created:
        if user in db_session:
            db_session.delete(user)
    try:
        db_session.commit()
    except Exception:
        db_session.rollback()
