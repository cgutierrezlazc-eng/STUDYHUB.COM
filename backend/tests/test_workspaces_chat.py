"""Tests de integración para endpoints de chat grupal de workspaces.

Cubre GET /workspaces/{id}/chat/messages, POST, DELETE.
Requiere fastapi y httpx instalados. Se ejecuta completo en CI.
"""

from __future__ import annotations

import os
import sys

import pytest

# Skip todo el módulo si fastapi no está disponible
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
def chat_setup(test_app):
    """Retorna (client, h_owner, h_other, h_editor, doc_id, owner, other, editor, db)."""
    from datetime import datetime, timedelta

    from jose import jwt

    app, db = test_app
    from database import User, WorkspaceMember, gen_id  # type: ignore
    from sqlalchemy import func

    # Crear usuario owner
    max_num = db.query(func.max(User.user_number)).scalar() or 0
    owner = User(
        id=gen_id(),
        email=f"chat_owner_{gen_id()}@conniku.com",
        username=f"chat_owner_{gen_id()}",
        user_number=max_num + 1,
        first_name="Owner",
        last_name="Chat",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)

    # Crear usuario editor (miembro del workspace)
    max_num = db.query(func.max(User.user_number)).scalar() or 0 + 1
    editor_user = User(
        id=gen_id(),
        email=f"chat_editor_{gen_id()}@conniku.com",
        username=f"chat_editor_{gen_id()}",
        user_number=max_num + 2,
        first_name="Editor",
        last_name="Chat",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(editor_user)

    # Crear usuario sin acceso
    max_num = db.query(func.max(User.user_number)).scalar() or 0 + 2
    other = User(
        id=gen_id(),
        email=f"chat_other_{gen_id()}@conniku.com",
        username=f"chat_other_{gen_id()}",
        user_number=max_num + 3,
        first_name="Other",
        last_name="Chat",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(other)
    db.commit()
    db.refresh(owner)
    db.refresh(editor_user)
    db.refresh(other)

    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)
    # "type": "access" es requerido por middleware.decode_token para validar el JWT.
    token_owner = jwt.encode({"sub": owner.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    token_editor = jwt.encode({"sub": editor_user.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    token_other = jwt.encode({"sub": other.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")

    h_owner = {"Authorization": f"Bearer {token_owner}"}
    h_editor = {"Authorization": f"Bearer {token_editor}"}
    h_other = {"Authorization": f"Bearer {token_other}"}

    with TestClient(app) as client:
        # Crear workspace como owner
        resp = client.post(
            "/workspaces",
            json={"title": "Workspace chat test"},
            headers=h_owner,
        )
        assert resp.status_code == 201
        doc_id = resp.json()["id"]

        # Agregar editor como miembro
        member = WorkspaceMember(
            workspace_id=doc_id,
            user_id=editor_user.id,
            role="editor",
            invited_at=datetime.utcnow(),
            joined_at=datetime.utcnow(),
        )
        db.add(member)
        db.commit()
        db.refresh(member)

        yield client, h_owner, h_other, h_editor, doc_id, owner, other, editor_user, db


# ─── GET /workspaces/{doc_id}/chat/messages ───────────────────────


def test_get_chat_messages_vacio_retorna_lista(chat_setup) -> None:
    """GET retorna lista vacía cuando no hay mensajes."""
    client, h_owner, _, _, doc_id, _, _, _, _ = chat_setup
    resp = client.get(f"/workspaces/{doc_id}/chat/messages", headers=h_owner)
    assert resp.status_code == 200
    data = resp.json()
    assert "messages" in data
    assert isinstance(data["messages"], list)


def test_get_chat_messages_sin_acceso_retorna_403(chat_setup) -> None:
    """Usuario sin acceso al workspace recibe 403."""
    client, _, h_other, _, doc_id, _, _, _, _ = chat_setup
    resp = client.get(f"/workspaces/{doc_id}/chat/messages", headers=h_other)
    assert resp.status_code == 403


def test_get_chat_messages_sin_auth_retorna_401(chat_setup) -> None:
    """Sin token de autenticación retorna 401."""
    client, _, _, _, doc_id, _, _, _, _ = chat_setup
    resp = client.get(f"/workspaces/{doc_id}/chat/messages")
    assert resp.status_code == 401


# ─── POST /workspaces/{doc_id}/chat/messages ──────────────────────


def test_post_chat_message_crea_y_aparece_en_get(chat_setup) -> None:
    """POST crea mensaje y aparece en GET posterior."""
    client, h_owner, _, _, doc_id, owner, _, _, _ = chat_setup

    resp_post = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Hola equipo"},
        headers=h_owner,
    )
    assert resp_post.status_code == 201
    msg = resp_post.json()
    assert msg["content"] == "Hola equipo"
    assert msg["userId"] == owner.id
    assert "id" in msg
    assert "createdAt" in msg

    # Verificar que aparece en GET
    resp_get = client.get(f"/workspaces/{doc_id}/chat/messages", headers=h_owner)
    assert resp_get.status_code == 200
    contents = [m["content"] for m in resp_get.json()["messages"]]
    assert "Hola equipo" in contents


def test_post_chat_message_por_editor_ok(chat_setup) -> None:
    """Un editor también puede enviar mensajes."""
    client, _, _, h_editor, doc_id, _, _, editor_user, _ = chat_setup

    resp = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Mensaje del editor"},
        headers=h_editor,
    )
    assert resp.status_code == 201
    assert resp.json()["userId"] == editor_user.id


def test_post_chat_message_vacio_retorna_400(chat_setup) -> None:
    """Mensaje con contenido vacío retorna 400."""
    client, h_owner, _, _, doc_id, _, _, _, _ = chat_setup

    resp = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": ""},
        headers=h_owner,
    )
    assert resp.status_code == 400


def test_post_chat_message_sin_acceso_retorna_403(chat_setup) -> None:
    """No miembro recibe 403 al intentar enviar mensaje."""
    client, _, h_other, _, doc_id, _, _, _, _ = chat_setup

    resp = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Intento de acceso no autorizado"},
        headers=h_other,
    )
    assert resp.status_code == 403


# ─── DELETE /workspaces/{doc_id}/chat/messages/{msg_id} ──────────


def test_delete_chat_message_por_owner_del_mensaje_ok(chat_setup) -> None:
    """El autor del mensaje puede eliminarlo."""
    client, h_owner, _, _, doc_id, _, _, _, _ = chat_setup

    resp_post = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Mensaje a eliminar"},
        headers=h_owner,
    )
    assert resp_post.status_code == 201
    msg_id = resp_post.json()["id"]

    resp_del = client.delete(
        f"/workspaces/{doc_id}/chat/messages/{msg_id}",
        headers=h_owner,
    )
    assert resp_del.status_code == 200
    assert resp_del.json().get("ok") is True


def test_delete_chat_message_por_workspace_owner_ok(chat_setup) -> None:
    """El owner del workspace puede eliminar cualquier mensaje."""
    client, h_owner, _, h_editor, doc_id, _, _, editor_user, _ = chat_setup

    # Editor envía mensaje
    resp_post = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Mensaje del editor para borrar por owner"},
        headers=h_editor,
    )
    assert resp_post.status_code == 201
    msg_id = resp_post.json()["id"]

    # Owner del workspace borra el mensaje del editor
    resp_del = client.delete(
        f"/workspaces/{doc_id}/chat/messages/{msg_id}",
        headers=h_owner,
    )
    assert resp_del.status_code == 200


def test_delete_chat_message_por_otro_miembro_retorna_403(chat_setup) -> None:
    """Otro miembro que no es autor ni owner del workspace recibe 403."""
    client, h_owner, _, h_editor, doc_id, owner, _, _, _ = chat_setup

    # Owner envía mensaje
    resp_post = client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Mensaje del owner que editor no puede borrar"},
        headers=h_owner,
    )
    assert resp_post.status_code == 201
    msg_id = resp_post.json()["id"]

    # Editor intenta borrar el mensaje del owner → 403
    resp_del = client.delete(
        f"/workspaces/{doc_id}/chat/messages/{msg_id}",
        headers=h_editor,
    )
    assert resp_del.status_code == 403


def test_delete_chat_message_inexistente_retorna_404(chat_setup) -> None:
    """Mensaje que no existe retorna 404."""
    client, h_owner, _, _, doc_id, _, _, _, _ = chat_setup

    resp_del = client.delete(
        f"/workspaces/{doc_id}/chat/messages/msg_no_existe",
        headers=h_owner,
    )
    assert resp_del.status_code == 404


def test_get_chat_messages_historia_completa_visible(chat_setup) -> None:
    """Historia completa visible para todos los miembros (decisión §1.2.1 #2)."""
    client, h_owner, _, h_editor, doc_id, _, _, _, _ = chat_setup

    # Owner envía mensaje
    client.post(
        f"/workspaces/{doc_id}/chat/messages",
        json={"content": "Historia completa visible"},
        headers=h_owner,
    )

    # Editor también ve ese mensaje (historia completa)
    resp = client.get(f"/workspaces/{doc_id}/chat/messages", headers=h_editor)
    assert resp.status_code == 200
    contents = [m["content"] for m in resp.json()["messages"]]
    assert "Historia completa visible" in contents
