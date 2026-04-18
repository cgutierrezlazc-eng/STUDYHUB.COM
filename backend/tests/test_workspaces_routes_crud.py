"""Tests de integración para workspaces_routes.py.

Cubre CRUD de workspaces, miembros y versiones con TestClient de FastAPI.
Requiere fastapi y httpx instalados. Se ejecuta completo en CI.
"""

from __future__ import annotations

import os
import sys

import pytest

# Skip todo el módulo si fastapi no está disponible (entorno local sin deps HTTP)
fastapi = pytest.importorskip("fastapi", reason="fastapi no instalado — tests de rutas se ejecutan en CI")
pytest.importorskip("httpx", reason="httpx no instalado — tests de rutas se ejecutan en CI")

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
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


# ─── App de prueba mínima ─────────────────────────────────────────


@pytest.fixture(scope="module")
def test_app():
    """Crea una FastAPI minimal con workspaces_router montado y BD in-memory."""
    from database import Base, get_db  # type: ignore
    from workspaces_routes import router as ws_router  # type: ignore

    app = FastAPI()

    # Crear engine in-memory compartido por toda la sesión de tests
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
def client_and_user(test_app):
    """Retorna (client, owner_headers, owner_user) con usuario autenticado."""
    from datetime import datetime, timedelta

    # Usar jose.jwt (consistente con backend/middleware.py — python-jose ya está en requirements.txt).
    from jose import jwt

    app, db = test_app

    from database import User, gen_id  # type: ignore
    from sqlalchemy import func

    # Crear usuario owner
    max_num = db.query(func.max(User.user_number)).scalar() or 0
    owner = User(
        id=gen_id(),
        email=f"owner_{gen_id()}@conniku.com",
        username=f"owner_{gen_id()}",
        user_number=max_num + 1,
        first_name="Owner",
        last_name="Test",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    # Crear segundo usuario para tests de acceso
    max_num = db.query(func.max(User.user_number)).scalar() or 0
    other = User(
        id=gen_id(),
        email=f"other_{gen_id()}@conniku.com",
        username=f"other_{gen_id()}",
        user_number=max_num + 1,
        first_name="Other",
        last_name="User",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(other)
    db.commit()
    db.refresh(other)

    # Crear JWT de prueba — "type": "access" requerido por middleware.decode_token.
    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)
    token_owner = jwt.encode({"sub": owner.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    token_other = jwt.encode({"sub": other.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")

    headers_owner = {"Authorization": f"Bearer {token_owner}"}
    headers_other = {"Authorization": f"Bearer {token_other}"}

    with TestClient(app) as client:
        yield client, headers_owner, headers_other, owner, other, db


# ─── CRUD básico ─────────────────────────────────────────────────


def test_post_workspaces_retorna_201(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user
    resp = client.post(
        "/workspaces",
        json={"title": "Informe de Investigación"},
        headers=h_owner,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["title"] == "Informe de Investigación"
    assert data["apaEdition"] == "7"


def test_post_workspaces_sin_title_retorna_400(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user
    resp = client.post("/workspaces", json={"title": "  "}, headers=h_owner)
    assert resp.status_code == 400


def test_post_workspaces_sin_auth_retorna_401(client_and_user) -> None:
    client, _, _, _, _, _ = client_and_user
    resp = client.post("/workspaces", json={"title": "Test"})
    assert resp.status_code == 401


def test_get_workspaces_lista_propios(client_and_user) -> None:
    client, h_owner, h_other, owner, _, _ = client_and_user

    # Crear workspace del owner
    resp_create = client.post(
        "/workspaces",
        json={"title": f"Doc de owner {owner.id}"},
        headers=h_owner,
    )
    assert resp_create.status_code == 201

    # owner lista y ve el suyo
    resp = client.get("/workspaces", headers=h_owner)
    assert resp.status_code == 200
    ids = [w["id"] for w in resp.json()["workspaces"]]
    assert resp_create.json()["id"] in ids


def test_get_workspaces_excluye_ajenos(client_and_user) -> None:
    """other no ve los workspaces del owner si no es miembro."""
    client, h_owner, h_other, _, _, _ = client_and_user

    # Crear workspace del owner
    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc privado del owner"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    # other lista y NO debe ver ese workspace
    resp = client.get("/workspaces", headers=h_other)
    assert resp.status_code == 200
    ids = [w["id"] for w in resp.json()["workspaces"]]
    assert doc_id not in ids


def test_get_workspace_por_id(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc por id", "courseName": "Álgebra Lineal"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    resp = client.get(f"/workspaces/{doc_id}", headers=h_owner)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Doc por id"
    assert resp.json()["courseName"] == "Álgebra Lineal"


def test_get_workspace_inexistente_retorna_404(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user
    resp = client.get("/workspaces/noexistedocid", headers=h_owner)
    assert resp.status_code == 404


def test_get_workspace_ajeno_retorna_403(client_and_user) -> None:
    client, h_owner, h_other, _, _, _ = client_and_user

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc privado"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    resp = client.get(f"/workspaces/{doc_id}", headers=h_other)
    assert resp.status_code == 403


def test_patch_workspace_actualiza_titulo(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Título original"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp = client.patch(
        f"/workspaces/{doc_id}",
        json={"title": "Título actualizado"},
        headers=h_owner,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Título actualizado"


def test_patch_workspace_por_viewer_retorna_403(client_and_user) -> None:
    """Un viewer no puede hacer PATCH al workspace."""
    client, h_owner, h_other, _, other, db = client_and_user
    from database import WorkspaceMember, WorkspaceDocument, gen_id  # type: ignore

    # Crear workspace
    resp_create = client.post("/workspaces", json={"title": "Doc con viewer"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    # Agregar other como viewer directamente en BD
    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=other.id,
        role="viewer",
    )
    db.add(member)
    db.commit()

    resp = client.patch(
        f"/workspaces/{doc_id}",
        json={"title": "No debería poder"},
        headers=h_other,
    )
    assert resp.status_code == 403


def test_delete_workspace_solo_owner(client_and_user) -> None:
    client, h_owner, h_other, _, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc a eliminar"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    # other no puede eliminar
    resp_fail = client.delete(f"/workspaces/{doc_id}", headers=h_other)
    assert resp_fail.status_code in (403, 404)  # 403 porque no es miembro ni owner

    # owner sí puede
    resp_ok = client.delete(f"/workspaces/{doc_id}", headers=h_owner)
    assert resp_ok.status_code == 200

    # Verificar que ya no existe
    resp_check = client.get(f"/workspaces/{doc_id}", headers=h_owner)
    assert resp_check.status_code == 404


# ─── Miembros ─────────────────────────────────────────────────────


def test_get_members_retorna_lista(client_and_user) -> None:
    client, h_owner, _, owner, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc con miembros"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp = client.get(f"/workspaces/{doc_id}/members", headers=h_owner)
    assert resp.status_code == 200
    # Owner debe aparecer como miembro con rol 'owner'
    roles = [m["role"] for m in resp.json()["members"]]
    assert "owner" in roles


def test_post_member_agrega_por_email(client_and_user) -> None:
    client, h_owner, _, _, other, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc para agregar miembro"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp = client.post(
        f"/workspaces/{doc_id}/members",
        json={"email": other.email, "role": "editor"},
        headers=h_owner,
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "editor"


def test_post_member_email_inexistente_retorna_404(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc test email"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp = client.post(
        f"/workspaces/{doc_id}/members",
        json={"email": "noexiste@conniku.com", "role": "editor"},
        headers=h_owner,
    )
    assert resp.status_code == 404


def test_patch_member_cambia_rol(client_and_user) -> None:
    client, h_owner, _, _, other, db = client_and_user
    from database import WorkspaceMember, gen_id  # type: ignore

    resp_create = client.post("/workspaces", json={"title": "Doc cambio rol"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    # Agregar miembro como viewer
    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=other.id,
        role="viewer",
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    resp = client.patch(
        f"/workspaces/{doc_id}/members/{member.id}",
        json={"role": "editor"},
        headers=h_owner,
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "editor"


def test_delete_member_remueve_de_workspace(client_and_user) -> None:
    client, h_owner, _, _, other, db = client_and_user
    from database import WorkspaceMember  # type: ignore

    resp_create = client.post("/workspaces", json={"title": "Doc remover miembro"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=other.id,
        role="editor",
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    resp = client.delete(
        f"/workspaces/{doc_id}/members/{member.id}",
        headers=h_owner,
    )
    assert resp.status_code == 200


# ─── Versiones ────────────────────────────────────────────────────


def test_get_versions_retorna_lista_vacia(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc versiones"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp = client.get(f"/workspaces/{doc_id}/versions", headers=h_owner)
    assert resp.status_code == 200
    data = resp.json()
    assert "versions" in data
    assert isinstance(data["versions"], list)


def test_post_version_crea_snapshot(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc con versión"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp = client.post(
        f"/workspaces/{doc_id}/versions",
        json={"content_yjs": "base64snapshot==", "label": "v1.0"},
        headers=h_owner,
    )
    assert resp.status_code == 201
    assert resp.json()["label"] == "v1.0"


def test_post_version_restore(client_and_user) -> None:
    client, h_owner, _, _, _, _ = client_and_user

    resp_create = client.post("/workspaces", json={"title": "Doc restore"}, headers=h_owner)
    doc_id = resp_create.json()["id"]

    resp_ver = client.post(
        f"/workspaces/{doc_id}/versions",
        json={"content_yjs": "snapshotA==", "label": "snap A"},
        headers=h_owner,
    )
    ver_id = resp_ver.json()["id"]

    resp = client.post(
        f"/workspaces/{doc_id}/versions/{ver_id}/restore",
        headers=h_owner,
    )
    assert resp.status_code == 200
    # El contenido del doc debe ser ahora el snapshot restaurado
    assert resp.json()["contentYjs"] == "snapshotA=="


# ─── Invite token ─────────────────────────────────────────────────


def test_get_invite_token_invalido_retorna_valid_false(client_and_user) -> None:
    """Token inexistente: HTTP 200 con valid=false (no 404, para no filtrar
    existencia de tokens a un atacante)."""
    client, h_owner, _, _, _, _ = client_and_user
    resp = client.get("/workspaces/invite/tokeninvalidoXXXXX", headers=h_owner)
    assert resp.status_code == 200
    body = resp.json()
    assert body["valid"] is False
    assert body["workspace_id"] is None
    assert body["workspace_title"] is None


def test_get_invite_token_valido_retorna_metadata(client_and_user) -> None:
    """Token válido en BD: HTTP 200 con valid=true + metadata alineada con
    el tipo InviteTokenInfo del frontend (llaves workspace_id, workspace_title,
    owner_name, proposed_role)."""
    client, h_owner, _, _, _, db = client_and_user
    from database import WorkspaceDocument  # type: ignore

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc compartido"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    # Asignar token al doc directamente en BD
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.id == doc_id).first()
    doc.share_link_token = "testtoken12345678"
    db.commit()

    resp = client.get("/workspaces/invite/testtoken12345678", headers=h_owner)
    assert resp.status_code == 200
    body = resp.json()
    assert body["valid"] is True
    assert body["workspace_id"] == doc_id
    assert body["workspace_title"] == "Doc compartido"
    assert body["proposed_role"] == "editor"


# ─── Contribution metric (sub-bloque 2b) ─────────────────────────


def test_patch_contribution_propio_miembro_ok(client_and_user) -> None:
    """El propio miembro puede incrementar su contador de caracteres."""
    client, h_owner, h_other, owner, other, db = client_and_user
    from database import WorkspaceMember  # type: ignore

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc contribution test"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    # El owner ya es miembro con rol 'owner'. Obtenemos su member_id.
    members_resp = client.get(f"/workspaces/{doc_id}/members", headers=h_owner)
    owner_member = next(m for m in members_resp.json()["members"] if m["role"] == "owner")
    member_id = owner_member["id"]

    resp = client.patch(
        f"/workspaces/{doc_id}/members/{member_id}/contribution",
        json={"delta_chars": 150},
        headers=h_owner,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == member_id
    assert data["charsContributed"] >= 150


def test_patch_contribution_otro_usuario_retorna_403(client_and_user) -> None:
    """Otro usuario no puede incrementar el contador de un miembro ajeno."""
    client, h_owner, h_other, owner, other, db = client_and_user
    from database import WorkspaceMember  # type: ignore

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc contribution 403 test"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    # Agregar other como editor
    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=other.id,
        role="editor",
        invited_at=__import__("datetime").datetime.utcnow(),
        joined_at=__import__("datetime").datetime.utcnow(),
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    # owner intenta incrementar el contador del miembro 'other' → 403
    resp = client.patch(
        f"/workspaces/{doc_id}/members/{member.id}/contribution",
        json={"delta_chars": 50},
        headers=h_owner,
    )
    assert resp.status_code == 403


def test_patch_contribution_delta_negativo_retorna_422(client_and_user) -> None:
    """Delta negativo es rechazado con 422 (validación Pydantic ge=0)."""
    client, h_owner, _, owner, _, db = client_and_user

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc contribution neg test"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    members_resp = client.get(f"/workspaces/{doc_id}/members", headers=h_owner)
    owner_member = next(m for m in members_resp.json()["members"] if m["role"] == "owner")
    member_id = owner_member["id"]

    resp = client.patch(
        f"/workspaces/{doc_id}/members/{member_id}/contribution",
        json={"delta_chars": -10},
        headers=h_owner,
    )
    # Pydantic ge=0 retorna 422 Unprocessable Entity
    assert resp.status_code == 422


# ─── content_yjs en PATCH workspace (sub-bloque 2b) ──────────────


def test_patch_workspace_content_yjs_por_viewer_retorna_403(client_and_user) -> None:
    """Un viewer no puede actualizar content_yjs."""
    client, h_owner, h_other, _, other, db = client_and_user
    from database import WorkspaceMember  # type: ignore

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc yjs viewer test"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=other.id,
        role="viewer",
        invited_at=__import__("datetime").datetime.utcnow(),
        joined_at=__import__("datetime").datetime.utcnow(),
    )
    db.add(member)
    db.commit()

    resp = client.patch(
        f"/workspaces/{doc_id}",
        json={"content_yjs": "base64yjssnapshot=="},
        headers=h_other,
    )
    assert resp.status_code == 403


def test_patch_workspace_content_yjs_por_editor_ok_y_refleja_en_get(client_and_user) -> None:
    """Un editor puede actualizar content_yjs y el GET lo refleja."""
    client, h_owner, h_other, owner, other, db = client_and_user
    from database import WorkspaceMember  # type: ignore

    resp_create = client.post(
        "/workspaces",
        json={"title": "Doc yjs editor test"},
        headers=h_owner,
    )
    doc_id = resp_create.json()["id"]

    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=other.id,
        role="editor",
        invited_at=__import__("datetime").datetime.utcnow(),
        joined_at=__import__("datetime").datetime.utcnow(),
    )
    db.add(member)
    db.commit()

    resp_patch = client.patch(
        f"/workspaces/{doc_id}",
        json={"content_yjs": "dGVzdHNuYXBzaG90"},
        headers=h_other,
    )
    assert resp_patch.status_code == 200

    # GET debe reflejar el nuevo snapshot
    resp_get = client.get(f"/workspaces/{doc_id}", headers=h_owner)
    assert resp_get.status_code == 200
    assert resp_get.json()["contentYjs"] == "dGVzdHNuYXBzaG90"
