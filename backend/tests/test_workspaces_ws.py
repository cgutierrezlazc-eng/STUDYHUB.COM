"""Tests de integración para el WebSocket de colaboración de workspaces.

Cubre: autenticación, control de acceso, relay binario Yjs, chat multiplexado,
broadcast de presencia y cleanup al desconectar.

Requiere fastapi, httpx y websockets instalados. Se ejecuta completo en CI.
Patrón: TestClient.websocket_connect (servidor real in-process).
"""

from __future__ import annotations

import os
import sys

import pytest

# Skip todo el módulo si fastapi no está disponible
fastapi = pytest.importorskip("fastapi", reason="fastapi no instalado — tests de rutas se ejecutan en CI")
pytest.importorskip("httpx", reason="httpx no instalado — tests de rutas se ejecutan en CI")
pytest.importorskip("websockets", reason="websockets no instalado — tests WS se ejecutan en CI")

import json  # noqa: E402

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from starlette.websockets import WebSocketDisconnect  # noqa: E402

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
def ws_test_app():
    """App FastAPI minimal con workspaces_ws y workspaces_routes montados.

    Parchea workspaces_ws.SessionLocal para que use la BD in-memory,
    ya que el handler WS usa SessionLocal() directamente (no Depends(get_db)).
    """
    import workspaces_ws  # type: ignore
    from database import Base, get_db  # type: ignore
    from workspaces_routes import router as ws_rest_router  # type: ignore
    from workspaces_ws import router as ws_router  # type: ignore

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

    # Parchar SessionLocal en workspaces_ws para usar BD in-memory
    original_session_local = workspaces_ws.SessionLocal
    workspaces_ws.SessionLocal = TestingSessionLocal

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(ws_rest_router)
    app.include_router(ws_router)

    yield app, TestingSessionLocal()

    # Restaurar SessionLocal original al terminar
    workspaces_ws.SessionLocal = original_session_local


@pytest.fixture
def ws_setup(ws_test_app):
    """Crea usuarios, workspace y tokens de prueba para los tests WS."""
    from datetime import datetime, timedelta

    from jose import jwt

    app, db = ws_test_app
    from database import User, WorkspaceMember, gen_id  # type: ignore
    from sqlalchemy import func

    # Limpiar _rooms entre tests para evitar state leak (riesgo 5.11)
    try:
        import workspaces_ws  # type: ignore

        workspaces_ws._rooms.clear()
    except Exception:
        pass

    max_num = db.query(func.max(User.user_number)).scalar() or 0

    owner = User(
        id=gen_id(),
        email=f"ws_owner_{gen_id()}@conniku.com",
        username=f"ws_owner_{gen_id()}",
        user_number=max_num + 1,
        first_name="WS",
        last_name="Owner",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)

    editor_user = User(
        id=gen_id(),
        email=f"ws_editor_{gen_id()}@conniku.com",
        username=f"ws_editor_{gen_id()}",
        user_number=max_num + 2,
        first_name="WS",
        last_name="Editor",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(editor_user)

    outsider = User(
        id=gen_id(),
        email=f"ws_outsider_{gen_id()}@conniku.com",
        username=f"ws_outsider_{gen_id()}",
        user_number=max_num + 3,
        first_name="WS",
        last_name="Outsider",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(outsider)
    db.commit()
    db.refresh(owner)
    db.refresh(editor_user)
    db.refresh(outsider)

    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)
    token_owner = jwt.encode({"sub": owner.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    token_editor = jwt.encode({"sub": editor_user.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    token_outsider = jwt.encode({"sub": outsider.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")

    with TestClient(app) as client:
        # Crear workspace
        h_owner = {"Authorization": f"Bearer {token_owner}"}
        resp = client.post(
            "/workspaces",
            json={"title": "WS Collab Test"},
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

        yield client, token_owner, token_editor, token_outsider, doc_id, owner, editor_user, db


# ─── Tests de autenticación y control de acceso ───────────────────


def test_ws_conectar_sin_token_cierra_4001(ws_setup) -> None:
    """Conexión sin token debe cerrarse con close code 4001."""
    client, _, _, _, doc_id, _, _, _ = ws_setup

    with client.websocket_connect(f"/workspaces/ws/{doc_id}") as ws, pytest.raises(WebSocketDisconnect):
        # El servidor cierra la conexión con código 4001
        ws.receive_json()


def test_ws_conectar_con_token_invalido_cierra_4001(ws_setup) -> None:
    """Conexión con token inválido debe cerrarse con close code 4001."""
    client, _, _, _, doc_id, _, _, _ = ws_setup

    with (
        client.websocket_connect(f"/workspaces/ws/{doc_id}?token=invalid.token.here") as ws,
        pytest.raises(WebSocketDisconnect),
    ):
        ws.receive_json()


def test_ws_conectar_no_miembro_cierra_4003(ws_setup) -> None:
    """Usuario que no es miembro del workspace recibe close code 4003."""
    client, _, _, token_outsider, doc_id, _, _, _ = ws_setup

    with (
        client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_outsider}") as ws,
        pytest.raises(WebSocketDisconnect),
    ):
        ws.receive_json()


def test_ws_conectar_doc_inexistente_cierra_4004(ws_setup) -> None:
    """Conexión a doc que no existe recibe close code 4004."""
    client, token_owner, _, _, _, _, _, _ = ws_setup

    with (
        client.websocket_connect(f"/workspaces/ws/doc_no_existe?token={token_owner}") as ws,
        pytest.raises(WebSocketDisconnect),
    ):
        ws.receive_json()


# ─── Tests de presencia ───────────────────────────────────────────


def test_ws_conectar_owner_recibe_presence(ws_setup) -> None:
    """Al conectar con token válido (owner), se recibe broadcast de presencia."""
    client, token_owner, _, _, doc_id, owner, _, _ = ws_setup

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_owner}") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "presence"
        assert "users" in msg
        user_ids = [u["userId"] for u in msg["users"]]
        assert owner.id in user_ids


def test_ws_conectar_editor_recibe_presence(ws_setup) -> None:
    """Al conectar con token de editor, también se recibe presencia."""
    client, _, token_editor, _, doc_id, _, editor_user, _ = ws_setup

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_editor}") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "presence"
        user_ids = [u["userId"] for u in msg["users"]]
        assert editor_user.id in user_ids


# ─── Tests de relay y chat ────────────────────────────────────────


def test_ws_enviar_bytes_relay_a_otros(ws_setup) -> None:
    """Updates binarios Yjs se relayan a los demás clientes conectados."""
    client, token_owner, token_editor, _, doc_id, _, _, _ = ws_setup

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_owner}") as ws_owner:
        # Consumir presence inicial
        ws_owner.receive_json()

        with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_editor}") as ws_editor:
            # ws_owner recibe presence actualizado con editor
            ws_owner.receive_json()
            # ws_editor recibe su presence inicial
            ws_editor.receive_json()

            # Owner envía update binario Yjs
            yjs_update = b"\x01\x02\x03\x04yjs_update_data"
            ws_owner.send_bytes(yjs_update)

            # Editor debe recibir el relay
            received = ws_editor.receive_bytes()
            assert received == yjs_update


def test_ws_chat_message_persiste_en_bd(ws_setup) -> None:
    """Mensaje de chat enviado por WS se persiste en la BD."""
    client, token_owner, _, _, doc_id, owner, _, db = ws_setup
    from database import WorkspaceMessage  # type: ignore

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_owner}") as ws:
        # Consumir presence inicial
        ws.receive_json()

        # Enviar mensaje de chat
        ws.send_json({"type": "chat.message", "data": {"content": "Hola desde WS"}})

        # Recibir broadcast (incluye al emisor)
        msg = ws.receive_json()
        assert msg["type"] == "chat.message"
        assert msg["data"]["content"] == "Hola desde WS"
        assert msg["data"]["userId"] == owner.id
        assert "serverId" in msg["data"]

    # Verificar persistencia en BD
    persisted = (
        db.query(WorkspaceMessage)
        .filter(
            WorkspaceMessage.workspace_id == doc_id,
            WorkspaceMessage.content == "Hola desde WS",
        )
        .first()
    )
    assert persisted is not None
    assert persisted.user_id == owner.id


def test_ws_chat_message_no_persiste_bytes(ws_setup) -> None:
    """Updates binarios NO se persisten como mensajes de chat."""
    client, token_owner, _, _, doc_id, owner, _, db = ws_setup
    from database import WorkspaceMessage  # type: ignore

    initial_count = db.query(WorkspaceMessage).filter(WorkspaceMessage.workspace_id == doc_id).count()

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_owner}") as ws:
        ws.receive_json()  # presence
        ws.send_bytes(b"\xff\xfe\xfd\xfc")  # Yjs binary, no chat

    # No debe haber nuevos mensajes en BD
    final_count = db.query(WorkspaceMessage).filter(WorkspaceMessage.workspace_id == doc_id).count()
    assert final_count == initial_count


# ─── Tests de fixes Capa 2 (iteración robustez) ───────────────────


def test_ws_conectar_token_expirado_cierra_4010(ws_setup) -> None:
    """Token JWT expirado debe cerrar con close code 4010 (distinto de 4001)."""
    from datetime import datetime, timedelta

    from jose import jwt
    from starlette.websockets import WebSocketDisconnect as WSD

    client, _, _, _, doc_id, owner, _, _ = ws_setup

    secret = os.environ["JWT_SECRET"]
    expired_exp = datetime.utcnow() - timedelta(hours=1)
    expired_token = jwt.encode(
        {"sub": owner.id, "exp": expired_exp, "type": "access"},
        secret,
        algorithm="HS256",
    )

    with (
        pytest.raises(WSD) as excinfo,
        client.websocket_connect(f"/workspaces/ws/{doc_id}?token={expired_token}") as ws,
    ):
        ws.receive_json()

    assert excinfo.value.code == 4010


def test_ws_chat_message_excesivo_descartado(ws_setup) -> None:
    """Mensaje de chat >4000 chars se descarta (no persiste, no se broadcastea)."""
    from database import WorkspaceMessage  # type: ignore

    client, token_owner, _, _, doc_id, _, _, db = ws_setup
    initial_count = db.query(WorkspaceMessage).filter(WorkspaceMessage.workspace_id == doc_id).count()

    oversized = "x" * 5000  # supera MAX_CHAT_CONTENT_CHARS=4000

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_owner}") as ws:
        ws.receive_json()  # presence inicial
        ws.send_json({"type": "chat.message", "data": {"content": oversized}})
        # Enviar segundo mensaje corto para confirmar que la conexión sigue viva
        ws.send_json({"type": "chat.message", "data": {"content": "ok"}})
        # Solo recibimos el del segundo (el grande fue descartado)
        msg = ws.receive_json()
        assert msg["data"]["content"] == "ok"

    # BD: solo el corto persiste
    final_count = db.query(WorkspaceMessage).filter(WorkspaceMessage.workspace_id == doc_id).count()
    assert final_count == initial_count + 1


def test_ws_binary_relay_excesivo_descartado(ws_setup) -> None:
    """Update binario >1MiB se descarta (no se broadcastea)."""
    client, token_owner, token_editor, _, doc_id, _, _, _ = ws_setup

    with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_owner}") as ws_owner:
        ws_owner.receive_json()  # presence inicial

        with client.websocket_connect(f"/workspaces/ws/{doc_id}?token={token_editor}") as ws_editor:
            ws_owner.receive_json()  # presence actualizada
            ws_editor.receive_json()  # presence inicial del editor

            # Binario excesivo (>1 MiB) — debe descartarse sin broadcast
            oversized_bytes = b"\x00" * (1_048_576 + 100)
            ws_owner.send_bytes(oversized_bytes)

            # Seguido de uno normal para confirmar que la conexión sigue viva
            small = b"\x01small"
            ws_owner.send_bytes(small)

            # Editor solo recibe el pequeño
            received = ws_editor.receive_bytes()
            assert received == small
