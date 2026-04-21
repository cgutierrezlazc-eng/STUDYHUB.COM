"""Tests del flujo de re-aceptación de documentos legales (Pieza 6).

Bloque: bloque-legal-consolidation-v2.

Cubre:

- ``GET  /auth/reaccept-status``: responde con los 3 documentos
  pendientes cuando el usuario nunca los ha aceptado.
- ``POST /auth/reaccept-legal`` con hash correcto: escribe 3 filas
  append-only en ``user_agreements`` y la lista ``pending`` vuelve a
  estar vacía.
- ``POST /auth/reaccept-legal`` con hash incorrecto: responde 409 y no
  escribe ninguna fila (invariante atómica).
- Una aceptación anterior con versión antigua no cuenta como válida
  frente a la versión canónica publicada hoy.
"""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """Cliente FastAPI con la BD test + user autenticado fijo."""
    from auth_routes import router as auth_router
    from constants.legal_versions import (
        COOKIES_DOCUMENT_TYPE,
        COOKIES_HASH,
        COOKIES_VERSION,
        PRIVACY_DOCUMENT_TYPE,
        PRIVACY_HASH,
        PRIVACY_VERSION,
        TOS_DOCUMENT_TYPE,
        TOS_HASH,
        TOS_VERSION,
    )
    from database import User, get_db

    app = FastAPI()
    app.include_router(auth_router)

    # Usuario fijo para todos los tests.
    user = User(
        email="reaccept@conniku.com",
        username="reaccept_user_1",
        user_number=42001,
        password_hash="$2b$04$test.hash.placeholder",
        first_name="Reaccept",
        last_name="Tester",
        birth_date="2000-01-01",
        is_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Inyectar dependencias.
    app.dependency_overrides[get_db] = lambda: db_session

    def _fake_user() -> User:
        return user

    from middleware import get_current_user

    app.dependency_overrides[get_current_user] = _fake_user

    client = TestClient(app)
    # Marcar constantes en el propio cliente para que el test las use.
    client.canon = {  # type: ignore[attr-defined]
        "tos": (TOS_DOCUMENT_TYPE, TOS_VERSION, TOS_HASH),
        "privacy": (PRIVACY_DOCUMENT_TYPE, PRIVACY_VERSION, PRIVACY_HASH),
        "cookies": (COOKIES_DOCUMENT_TYPE, COOKIES_VERSION, COOKIES_HASH),
    }
    return client


def test_new_user_pending_all_three_documents(client: TestClient) -> None:
    resp = client.get("/auth/reaccept-status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_up_to_date"] is False
    pending_types = {doc["document_type"] for doc in body["pending"]}
    assert pending_types == {"tos", "privacy", "cookies"}


def test_post_reaccept_writes_append_only_rows(
    client: TestClient, db_session: Session
) -> None:
    from database import UserAgreement

    canon = client.canon  # type: ignore[attr-defined]
    payload = {
        "documents": [
            {
                "document_type": canon["tos"][0],
                "text_version": canon["tos"][1],
                "text_version_hash": canon["tos"][2],
            },
            {
                "document_type": canon["privacy"][0],
                "text_version": canon["privacy"][1],
                "text_version_hash": canon["privacy"][2],
            },
            {
                "document_type": canon["cookies"][0],
                "text_version": canon["cookies"][1],
                "text_version_hash": canon["cookies"][2],
            },
        ],
        "user_timezone": "America/Santiago",
    }

    resp = client.post("/auth/reaccept-legal", json=payload)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["is_up_to_date"] is True
    assert body["pending"] == []

    rows = db_session.query(UserAgreement).all()
    assert len(rows) == 3
    type_to_row = {row.document_type: row for row in rows}
    for key in ("tos", "privacy", "cookies"):
        assert key in type_to_row
        row = type_to_row[key]
        assert row.text_version == canon[key][1]
        assert row.text_version_hash == canon[key][2]
        assert row.user_timezone == "America/Santiago"


def test_post_reaccept_rejects_wrong_hash(
    client: TestClient, db_session: Session
) -> None:
    from database import UserAgreement

    canon = client.canon  # type: ignore[attr-defined]
    # Hash deliberadamente incorrecto.
    payload = {
        "documents": [
            {
                "document_type": canon["tos"][0],
                "text_version": canon["tos"][1],
                "text_version_hash": "deadbeef" * 8,
            },
        ],
        "user_timezone": "America/Santiago",
    }

    resp = client.post("/auth/reaccept-legal", json=payload)
    assert resp.status_code == 409
    detail = resp.json()["detail"]
    assert detail["error"] == "hash_or_version_mismatch"
    assert "tos" in detail["invalid_document_types"]

    # Invariante atómica: no se escribió ninguna fila.
    rows = db_session.query(UserAgreement).all()
    assert len(rows) == 0


def test_old_version_row_does_not_satisfy_current_canon(
    client: TestClient, db_session: Session
) -> None:
    """Si el usuario aceptó v2.0 del privacy en el pasado pero hoy la
    versión publicada es v2.3.0, el privacy debe seguir apareciendo como
    pendiente."""
    from database import UserAgreement

    # Sembrar fila con versión vieja manualmente.
    old_row = UserAgreement(
        user_id=client.dependency_overrides_user_id()  # type: ignore[attr-defined]
        if hasattr(client, "dependency_overrides_user_id")
        else "placeholder",
        document_type="privacy",
        text_version="2.0.0",
        text_version_hash="oldhash" + "0" * 58,
    )
    # Recuperar el user real mediante otro camino: el primer usuario del test.
    from database import User

    user = db_session.query(User).first()
    assert user is not None
    old_row.user_id = user.id
    db_session.add(old_row)
    db_session.commit()

    resp = client.get("/auth/reaccept-status")
    assert resp.status_code == 200
    pending_types = {doc["document_type"] for doc in resp.json()["pending"]}
    assert "privacy" in pending_types
