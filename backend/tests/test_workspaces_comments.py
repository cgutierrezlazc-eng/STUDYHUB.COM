"""Tests del endpoint comentarios inline (2d.8).

Cubre POST/GET/PATCH/DELETE/resolve + menciones @username.
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


@pytest.fixture(scope="module")
def app_comments():
    from database import Base, get_db  # type: ignore
    from workspaces_routes import router as ws_router  # type: ignore

    app = FastAPI()
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TSL = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TSL()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(ws_router)
    yield app, TSL()


@pytest.fixture
def comments_client(app_comments):
    """Retorna (client, h_owner, h_member, h_outsider, doc_id, owner, member, outsider)."""
    from datetime import datetime, timedelta

    from jose import jwt

    app, db = app_comments
    from database import User, WorkspaceDocument, WorkspaceMember, gen_id  # type: ignore

    max_num = db.query(func.max(User.user_number)).scalar() or 0
    owner = User(
        id=gen_id(),
        email=f"cm_o_{gen_id()}@conniku.com",
        username=f"owneruser_{gen_id()[:6]}",
        user_number=max_num + 1,
        first_name="Own",
        last_name="Er",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)
    db.flush()

    max_num = db.query(func.max(User.user_number)).scalar() or 0
    member = User(
        id=gen_id(),
        email=f"cm_m_{gen_id()}@conniku.com",
        username=f"memberuser_{gen_id()[:6]}",
        user_number=max_num + 1,
        first_name="Mem",
        last_name="Ber",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(member)
    db.flush()

    max_num = db.query(func.max(User.user_number)).scalar() or 0
    outsider = User(
        id=gen_id(),
        email=f"cm_out_{gen_id()}@conniku.com",
        username=f"outsideruser_{gen_id()[:6]}",
        user_number=max_num + 1,
        first_name="Out",
        last_name="Sider",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(outsider)
    db.flush()
    db.commit()
    db.refresh(owner)
    db.refresh(member)
    db.refresh(outsider)

    doc = WorkspaceDocument(
        id=gen_id(),
        title="Doc Comments",
        owner_id=owner.id,
        apa_edition="7",
        options="{}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(doc)
    db.flush()
    db.add(
        WorkspaceMember(
            id=gen_id(),
            workspace_id=doc.id,
            user_id=owner.id,
            role="owner",
            invited_at=datetime.utcnow(),
            joined_at=datetime.utcnow(),
        )
    )
    db.add(
        WorkspaceMember(
            id=gen_id(),
            workspace_id=doc.id,
            user_id=member.id,
            role="editor",
            invited_at=datetime.utcnow(),
            joined_at=datetime.utcnow(),
        )
    )
    db.commit()
    db.refresh(doc)

    secret = os.environ["JWT_SECRET"]
    exp = lambda: {"exp": __import__("datetime").datetime.utcnow() + timedelta(hours=1)}  # noqa: E731
    t_o = jwt.encode({"sub": owner.id, **exp(), "type": "access"}, secret, algorithm="HS256")
    t_m = jwt.encode({"sub": member.id, **exp(), "type": "access"}, secret, algorithm="HS256")
    t_out = jwt.encode(
        {"sub": outsider.id, **exp(), "type": "access"},
        secret,
        algorithm="HS256",
    )

    with TestClient(app) as client:
        yield (
            client,
            {"Authorization": f"Bearer {t_o}"},
            {"Authorization": f"Bearer {t_m}"},
            {"Authorization": f"Bearer {t_out}"},
            doc.id,
            owner,
            member,
            outsider,
        )


# ─── Tests ────────────────────────────────────────────────────────


def test_post_comment_ok(comments_client):
    client, h_o, *_, doc_id, _, _, _ = comments_client
    r = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "Esto es un comentario", "anchor_id": "node-123:0"},
        headers=h_o,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["content"] == "Esto es un comentario"
    assert body["anchor_id"] == "node-123:0"
    assert body["parent_id"] is None
    assert body["resolved"] is False


def test_post_reply_con_parent_id(comments_client):
    client, h_o, *_, doc_id, _, _, _ = comments_client
    parent = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "Parent", "anchor_id": "a1"},
        headers=h_o,
    ).json()
    r = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "Reply", "anchor_id": "a1", "parent_id": parent["id"]},
        headers=h_o,
    )
    assert r.status_code == 201
    assert r.json()["parent_id"] == parent["id"]


def test_post_mention_miembro_valido(comments_client):
    client, h_o, *_, doc_id, _, member, _ = comments_client
    r = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": f"Hola @{member.username}, revisa esto", "anchor_id": "a-mention"},
        headers=h_o,
    )
    assert r.status_code == 201
    body = r.json()
    assert member.id in body["mentions"]


def test_post_mention_no_miembro_400(comments_client):
    client, h_o, *_, doc_id, _, _, _ = comments_client
    r = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "@fantasma revisa", "anchor_id": "a-ghost"},
        headers=h_o,
    )
    assert r.status_code == 400


def test_get_lista_con_filter_anchor(comments_client):
    client, h_o, *_, doc_id, _, _, _ = comments_client
    client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "filtrado", "anchor_id": "specific-anchor"},
        headers=h_o,
    )
    r = client.get(
        f"/workspaces/{doc_id}/comments?anchor_id=specific-anchor",
        headers=h_o,
    )
    assert r.status_code == 200
    body = r.json()
    ids_unicos_por_anchor = [c for c in body["comments"] if c["anchor_id"] == "specific-anchor"]
    assert len(ids_unicos_por_anchor) >= 1


def test_get_lista_sin_filter(comments_client):
    client, h_o, *_, doc_id, _, _, _ = comments_client
    r = client.get(f"/workspaces/{doc_id}/comments", headers=h_o)
    assert r.status_code == 200
    assert "comments" in r.json()


def test_patch_solo_autor_ok(comments_client):
    client, h_o, h_m, *_, doc_id, _, _, _ = comments_client
    post = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "Original", "anchor_id": "ed1"},
        headers=h_o,
    )
    cid = post.json()["id"]
    r = client.patch(
        f"/workspaces/{doc_id}/comments/{cid}",
        json={"content": "Editado"},
        headers=h_o,
    )
    assert r.status_code == 200
    assert r.json()["content"] == "Editado"


def test_patch_otro_usuario_403(comments_client):
    client, h_o, h_m, *_, doc_id, _, _, _ = comments_client
    post = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "De owner", "anchor_id": "ed2"},
        headers=h_o,
    )
    cid = post.json()["id"]
    r = client.patch(
        f"/workspaces/{doc_id}/comments/{cid}",
        json={"content": "Intento editar"},
        headers=h_m,
    )
    assert r.status_code == 403


def test_delete_autor_ok(comments_client):
    client, h_o, h_m, *_, doc_id, _, _, _ = comments_client
    post = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "Del autor", "anchor_id": "del1"},
        headers=h_m,
    )
    cid = post.json()["id"]
    r = client.delete(f"/workspaces/{doc_id}/comments/{cid}", headers=h_m)
    assert r.status_code == 200


def test_delete_owner_puede_borrar_otro(comments_client):
    client, h_o, h_m, *_, doc_id, _, _, _ = comments_client
    post = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "De member", "anchor_id": "del2"},
        headers=h_m,
    )
    cid = post.json()["id"]
    r = client.delete(f"/workspaces/{doc_id}/comments/{cid}", headers=h_o)
    assert r.status_code == 200


def test_resolve_owner_ok(comments_client):
    client, h_o, *_, doc_id, _, _, _ = comments_client
    post = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "Para resolver", "anchor_id": "rsv1"},
        headers=h_o,
    )
    cid = post.json()["id"]
    r = client.post(
        f"/workspaces/{doc_id}/comments/{cid}/resolve",
        json={"resolved": True},
        headers=h_o,
    )
    assert r.status_code == 200
    assert r.json()["resolved"] is True


def test_resolve_no_miembro_403(comments_client):
    client, h_o, h_m, h_out, doc_id, _, _, _ = comments_client
    post = client.post(
        f"/workspaces/{doc_id}/comments",
        json={"content": "No puede resolver", "anchor_id": "rsv2"},
        headers=h_o,
    )
    cid = post.json()["id"]
    r = client.post(
        f"/workspaces/{doc_id}/comments/{cid}/resolve",
        json={"resolved": True},
        headers=h_out,
    )
    assert r.status_code == 403
