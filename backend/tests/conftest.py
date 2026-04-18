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

# Forzar que el módulo database use SQLite in-memory para los tests.
# Debe establecerse ANTES de importar database para que la variable de entorno
# sea leída al construir el engine.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
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
    """Factory para crear usuarios de prueba."""
    from database import User  # type: ignore

    created: list[User] = []

    def _create(
        email: str = "test@conniku.com",
        name: str = "Test User",
        date_of_birth: datetime | None = None,
        is_admin: bool = False,
    ) -> User:
        user = User(
            email=email,
            name=name,
            password_hash="$2b$04$test.hash.placeholder",  # bcrypt dummy
            date_of_birth=date_of_birth or datetime(2000, 1, 1, tzinfo=UTC),
            is_admin=is_admin,
            created_at=datetime.now(UTC),
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
    db_session.commit()
