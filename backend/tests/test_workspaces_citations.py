"""Tests TDD para el endpoint POST /workspaces/{id}/citations/validate.

Sub-bloque 2d.1 — APA 7 + citas + referencias.

Cubre:
- 200 OK con batch de citas válidas
- 200 OK con citas inválidas (el endpoint devuelve 200 con valid=False por item)
- 403 si el usuario no es miembro del workspace
- 400 si citations está vacío
- 200 con batch grande (stress mínimo)
"""

from __future__ import annotations

import os
import sys

import pytest

fastapi = pytest.importorskip("fastapi", reason="fastapi no instalado")
pytest.importorskip("httpx", reason="httpx no instalado")

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, func  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

os.environ.pop("DATABASE_URL", None)
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("OWNER_PASSWORD", "test-owner-password")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("BCRYPT_ROUNDS", "4")


# ─── App de prueba ────────────────────────────────────────────────


@pytest.fixture(scope="module")
def test_app_citations():
    """Crea una FastAPI minimal con workspaces_router montado y BD in-memory."""
    from database import Base, get_db  # type: ignore
    from workspaces_routes import router as ws_router  # type: ignore

    app = FastAPI()

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(ws_router)

    yield app, TestingSessionLocal()


@pytest.fixture
def citations_client(test_app_citations):
    """Retorna (client, h_owner, h_other, doc_id) con workspace creado."""
    from datetime import datetime, timedelta

    from jose import jwt

    app, db = test_app_citations

    from database import User, WorkspaceDocument, WorkspaceMember, gen_id  # type: ignore

    max_num = db.query(func.max(User.user_number)).scalar() or 0

    owner = User(
        id=gen_id(),
        email=f"cite_owner_{gen_id()}@conniku.com",
        username=f"cite_owner_{gen_id()}",
        user_number=max_num + 1,
        first_name="Owner",
        last_name="Cite",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)
    db.flush()  # Hacer visible el user_number del owner al siguiente max query

    max_num = db.query(func.max(User.user_number)).scalar() or 0
    outsider = User(
        id=gen_id(),
        email=f"cite_out_{gen_id()}@conniku.com",
        username=f"cite_out_{gen_id()}",
        user_number=max_num + 1,
        first_name="Out",
        last_name="Sider",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(outsider)
    db.commit()
    db.refresh(owner)
    db.refresh(outsider)

    # Crear workspace con owner como miembro
    doc = WorkspaceDocument(
        id=gen_id(),
        title="Doc Citas Test",
        owner_id=owner.id,
        apa_edition="7",
        options="{}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(doc)
    db.flush()

    owner_member = WorkspaceMember(
        id=gen_id(),
        workspace_id=doc.id,
        user_id=owner.id,
        role="owner",
        invited_at=datetime.utcnow(),
        joined_at=datetime.utcnow(),
    )
    db.add(owner_member)
    db.commit()
    db.refresh(doc)

    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)
    token_owner = jwt.encode({"sub": owner.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    token_out = jwt.encode({"sub": outsider.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")

    h_owner = {"Authorization": f"Bearer {token_owner}"}
    h_out = {"Authorization": f"Bearer {token_out}"}

    with TestClient(app) as client:
        yield client, h_owner, h_out, doc.id


# ─── Tests del endpoint ───────────────────────────────────────────


def test_citations_validate_ok(citations_client) -> None:
    """POST /workspaces/{id}/citations/validate con citas válidas → 200 con results."""
    client, h_owner, _, doc_id = citations_client

    resp = client.post(
        f"/workspaces/{doc_id}/citations/validate",
        json={
            "citations": [
                {"id": "c1", "raw": "(García, 2021)"},
                {"id": "c2", "raw": "(Smith, 2020, p. 45)"},
            ]
        },
        headers=h_owner,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) == 2
    # Cada resultado tiene la estructura esperada
    for item in data["results"]:
        assert "id" in item
        assert "valid" in item
        assert "errors" in item
        assert "suggested" in item
    # Las citas válidas son marcadas como valid=True
    ids_valid = {r["id"] for r in data["results"] if r["valid"]}
    assert "c1" in ids_valid
    assert "c2" in ids_valid


def test_citations_validate_invalidas_devuelve_200_con_errores(citations_client) -> None:
    """Citas con errores retornan 200 con valid=False y lista de errores."""
    client, h_owner, _, doc_id = citations_client

    resp = client.post(
        f"/workspaces/{doc_id}/citations/validate",
        json={
            "citations": [
                {"id": "bad1", "raw": "García 2021"},  # sin paréntesis ni coma
            ]
        },
        headers=h_owner,
    )
    assert resp.status_code == 200
    data = resp.json()
    results = data["results"]
    assert len(results) == 1
    assert results[0]["id"] == "bad1"
    assert results[0]["valid"] is False
    assert len(results[0]["errors"]) > 0


def test_citations_validate_no_miembro_retorna_403(citations_client) -> None:
    """Usuario que no es miembro del workspace recibe 403."""
    client, _, h_out, doc_id = citations_client

    resp = client.post(
        f"/workspaces/{doc_id}/citations/validate",
        json={"citations": [{"id": "c1", "raw": "(García, 2021)"}]},
        headers=h_out,
    )
    assert resp.status_code == 403


def test_citations_validate_lista_vacia_retorna_400(citations_client) -> None:
    """Lista de citations vacía → 400 Bad Request."""
    client, h_owner, _, doc_id = citations_client

    resp = client.post(
        f"/workspaces/{doc_id}/citations/validate",
        json={"citations": []},
        headers=h_owner,
    )
    assert resp.status_code == 400


def test_citations_validate_batch_grande(citations_client) -> None:
    """Batch de 50 citas → 200 con 50 resultados."""
    client, h_owner, _, doc_id = citations_client

    citations = [{"id": f"c{i}", "raw": f"(Autor{i}, 202{i % 5})"} for i in range(50)]
    resp = client.post(
        f"/workspaces/{doc_id}/citations/validate",
        json={"citations": citations},
        headers=h_owner,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 50


def test_citations_validate_workspace_no_existe_retorna_404(citations_client) -> None:
    """Workspace inexistente → 404."""
    client, h_owner, _, _ = citations_client

    resp = client.post(
        "/workspaces/doc-que-no-existe/citations/validate",
        json={"citations": [{"id": "c1", "raw": "(García, 2021)"}]},
        headers=h_owner,
    )
    assert resp.status_code == 404
