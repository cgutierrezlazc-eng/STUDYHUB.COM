"""Tests de funcionalidad para los endpoints de export en workspaces_routes.py.

Valida:
- POST /workspaces/{id}/export/pdf → bytes PDF o 501 si WeasyPrint no disponible
- POST /workspaces/{id}/export/docx → bytes DOCX válidos (PK ZIP signature)
- Control de acceso: 403 para no-miembros y viewers en pdf/docx
- Validación de payload: 400/422 en body inválido

Usa FastAPI TestClient + SQLite in-memory (igual que test_workspaces_routes_crud.py).
"""

from __future__ import annotations

import os
import sys
from datetime import UTC, datetime

import pytest

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

pytest.importorskip("fastapi", reason="fastapi no instalado")

# ─── Fixtures de cliente HTTP ─────────────────────────────────────────


@pytest.fixture
def test_app(db_session):
    """TestClient configurado con override de get_db y get_current_user."""
    import jose.jwt as jwt  # type: ignore
    from fastapi.testclient import TestClient  # type: ignore

    from database import User, WorkspaceDocument, WorkspaceMember, get_db  # type: ignore

    # Importamos la app desde server.py o creamos una mini-app con solo el router
    from fastapi import FastAPI

    from workspaces_routes import router as ws_router  # type: ignore

    try:
        from workspaces_export import router as export_router  # type: ignore

        app = FastAPI()
        app.include_router(ws_router)
        app.include_router(export_router)
    except ImportError:
        # Si workspaces_export aún no existe, se crea la app sin export router
        app = FastAPI()
        app.include_router(ws_router)

    # Override de get_db para usar la sesión de test
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    return app, db_session


@pytest.fixture
def client_owner(test_app, test_user_factory):
    """Cliente autenticado como owner de un workspace."""
    from fastapi.testclient import TestClient

    from database import WorkspaceDocument, gen_id  # type: ignore
    from middleware import get_current_user  # type: ignore

    app, db = test_app
    owner = test_user_factory(email="export_owner@conniku.com")

    doc = WorkspaceDocument(
        id=gen_id(),
        title="Doc para export",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    def override_current_user():
        return owner

    app.dependency_overrides[get_current_user] = override_current_user

    client = TestClient(app, raise_server_exceptions=False)
    return client, doc, owner


@pytest.fixture
def client_viewer(test_app, test_user_factory):
    """Cliente autenticado como viewer (no puede exportar)."""
    from fastapi.testclient import TestClient

    from database import WorkspaceDocument, WorkspaceMember, gen_id  # type: ignore
    from middleware import get_current_user  # type: ignore

    app, db = test_app

    owner = test_user_factory(email="export_viewer_owner@conniku.com")
    viewer = test_user_factory(email="export_viewer@conniku.com")

    doc = WorkspaceDocument(
        id=gen_id(),
        title="Doc para viewer export",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    member = WorkspaceMember(
        id=gen_id(),
        workspace_id=doc.id,
        user_id=viewer.id,
        role="viewer",
        invited_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(member)
    db.commit()

    def override_current_user():
        return viewer

    app.dependency_overrides[get_current_user] = override_current_user

    client = TestClient(app, raise_server_exceptions=False)
    return client, doc, viewer


@pytest.fixture
def client_no_member(test_app, test_user_factory):
    """Cliente autenticado como usuario que no es miembro."""
    from fastapi.testclient import TestClient

    from database import WorkspaceDocument, gen_id  # type: ignore
    from middleware import get_current_user  # type: ignore

    app, db = test_app

    owner = test_user_factory(email="export_nomember_owner@conniku.com")
    stranger = test_user_factory(email="export_stranger@conniku.com")

    doc = WorkspaceDocument(
        id=gen_id(),
        title="Doc de otro usuario",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    def override_current_user():
        return stranger

    app.dependency_overrides[get_current_user] = override_current_user

    client = TestClient(app, raise_server_exceptions=False)
    return client, doc, stranger


# ─── Tests de POST /export/pdf ───────────────────────────────────────


class TestExportPdf:
    """Tests funcionales del endpoint POST /workspaces/{id}/export/pdf."""

    def test_export_pdf_owner_ok_o_501(self, client_owner) -> None:
        """Owner puede exportar: retorna PDF (empieza con %PDF) o 501 si WeasyPrint no disponible.

        El 501 es el stub documentado cuando los deps nativos no están.
        Ambos son respuestas válidas (no 500 interno sin control).
        """
        client, doc, _owner = client_owner
        resp = client.post(
            f"/workspaces/{doc.id}/export/pdf",
            json={"html": "<p>Contenido académico</p>", "include_cover": False, "include_rubric": False},
        )
        # Acepta 200 (PDF real) o 501 (stub sin deps nativas)
        assert resp.status_code in (200, 501), f"Esperaba 200 o 501, obtuvo {resp.status_code}: {resp.text}"

        if resp.status_code == 200:
            # Debe ser un PDF válido
            assert resp.headers["content-type"] == "application/pdf"
            assert resp.content[:4] == b"%PDF"
            # Verificar Content-Disposition
            cd = resp.headers.get("content-disposition", "")
            assert "attachment" in cd
            assert f"workspace-{doc.id}" in cd

    def test_export_pdf_no_miembro_403(self, client_no_member) -> None:
        """Usuario no miembro recibe 403."""
        client, doc, _stranger = client_no_member
        resp = client.post(
            f"/workspaces/{doc.id}/export/pdf",
            json={"html": "<p>Texto</p>", "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 403

    def test_export_pdf_viewer_403(self, client_viewer) -> None:
        """Viewer no puede exportar — solo editor o superior."""
        client, doc, _viewer = client_viewer
        resp = client.post(
            f"/workspaces/{doc.id}/export/pdf",
            json={"html": "<p>Texto</p>", "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 403

    def test_export_pdf_workspace_inexistente_404(self, client_owner) -> None:
        """Workspace que no existe retorna 404."""
        client, _doc, _owner = client_owner
        resp = client.post(
            "/workspaces/noexiste123/export/pdf",
            json={"html": "<p>Texto</p>", "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 404


# ─── Tests de POST /export/docx ──────────────────────────────────────


class TestExportDocx:
    """Tests funcionales del endpoint POST /workspaces/{id}/export/docx."""

    def test_export_docx_owner_ok(self, client_owner) -> None:
        """Owner puede exportar DOCX: retorna ZIP con firma PK."""
        client, doc, _owner = client_owner
        blocks = [
            {"type": "h1", "text": "Título principal"},
            {"type": "p", "text": "Párrafo introductorio."},
            {"type": "list", "items": ["Item uno", "Item dos"]},
        ]
        resp = client.post(
            f"/workspaces/{doc.id}/export/docx",
            json={"blocks": blocks, "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 200

        expected_ct = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        assert resp.headers["content-type"] == expected_ct

        # DOCX es un ZIP — firma PK (0x50, 0x4B)
        assert resp.content[:2] == b"PK", f"Firma ZIP esperada 'PK', obtuvo: {resp.content[:4]!r}"

        # Content-Disposition
        cd = resp.headers.get("content-disposition", "")
        assert "attachment" in cd
        assert f"workspace-{doc.id}" in cd

    def test_export_docx_no_miembro_403(self, client_no_member) -> None:
        """Usuario no miembro recibe 403."""
        client, doc, _stranger = client_no_member
        resp = client.post(
            f"/workspaces/{doc.id}/export/docx",
            json={"blocks": [], "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 403

    def test_export_docx_viewer_403(self, client_viewer) -> None:
        """Viewer no puede exportar — solo editor o superior."""
        client, doc, _viewer = client_viewer
        resp = client.post(
            f"/workspaces/{doc.id}/export/docx",
            json={"blocks": [], "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 403

    def test_export_docx_body_invalido_422(self, client_owner) -> None:
        """Body sin campo 'blocks' retorna 422 (validación Pydantic)."""
        client, doc, _owner = client_owner
        resp = client.post(
            f"/workspaces/{doc.id}/export/docx",
            json={"include_cover": False},  # Falta 'blocks'
        )
        assert resp.status_code == 422

    def test_export_docx_bloques_vacios(self, client_owner) -> None:
        """Lista de bloques vacía produce un DOCX mínimo válido."""
        client, doc, _owner = client_owner
        resp = client.post(
            f"/workspaces/{doc.id}/export/docx",
            json={"blocks": [], "include_cover": False, "include_rubric": False},
        )
        assert resp.status_code == 200
        assert resp.content[:2] == b"PK"
