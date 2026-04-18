"""Tests de control de acceso para workspaces_routes.py.

Valida la lógica de _check_access y la jerarquía owner/editor/viewer
usando la función directamente (sin HTTP).
Requiere fastapi instalado. Se ejecuta completo en CI.
"""

from __future__ import annotations

import os
import sys
from datetime import UTC, datetime

import pytest
from sqlalchemy.orm import Session

# Skip todo el módulo si fastapi no está disponible
pytest.importorskip("fastapi", reason="fastapi no instalado — tests de acceso se ejecutan en CI")

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)


# ─── Tests de _check_access ──────────────────────────────────────


def test_check_access_owner_tiene_acceso_total(db_session: Session, test_user_factory) -> None:
    """El owner siempre tiene acceso sin importar el required_role."""
    from database import WorkspaceDocument  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    owner = test_user_factory(email="access_owner@conniku.com")
    doc = WorkspaceDocument(
        title="Doc del owner",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    # Owner puede acceder con cualquier required_role
    for role in ("viewer", "editor", "owner"):
        result_doc, result_member = _check_access(doc.id, owner, db_session, required_role=role)
        assert result_doc.id == doc.id
        assert result_member is None  # Owner no tiene registro de member


def test_check_access_workspace_inexistente_lanza_404(db_session: Session, test_user_factory) -> None:
    from fastapi import HTTPException  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    user = test_user_factory(email="access_404@conniku.com")

    with pytest.raises(HTTPException) as exc_info:
        _check_access("noexistedocid", user, db_session)
    assert exc_info.value.status_code == 404


def test_check_access_usuario_sin_membresia_lanza_403(db_session: Session, test_user_factory) -> None:
    """Un usuario sin membresía recibe 403."""
    from fastapi import HTTPException  # type: ignore
    from database import WorkspaceDocument  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    owner = test_user_factory(email="access_owner2@conniku.com")
    stranger = test_user_factory(email="access_stranger@conniku.com")

    doc = WorkspaceDocument(
        title="Doc privado",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    with pytest.raises(HTTPException) as exc_info:
        _check_access(doc.id, stranger, db_session)
    assert exc_info.value.status_code == 403


def test_check_access_viewer_puede_leer(db_session: Session, test_user_factory) -> None:
    """Un viewer puede acceder con required_role='viewer'."""
    from database import WorkspaceDocument, WorkspaceMember  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    owner = test_user_factory(email="access_owner3@conniku.com")
    viewer_user = test_user_factory(email="access_viewer@conniku.com")

    doc = WorkspaceDocument(
        title="Doc con viewer",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    member = WorkspaceMember(
        workspace_id=doc.id,
        user_id=viewer_user.id,
        role="viewer",
        invited_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(member)
    db_session.commit()

    # viewer puede leer
    result_doc, result_member = _check_access(doc.id, viewer_user, db_session, required_role="viewer")
    assert result_doc.id == doc.id
    assert result_member is not None
    assert result_member.role == "viewer"


def test_check_access_viewer_no_puede_editar(db_session: Session, test_user_factory) -> None:
    """Un viewer recibe 403 al requerir rol editor."""
    from fastapi import HTTPException  # type: ignore
    from database import WorkspaceDocument, WorkspaceMember  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    owner = test_user_factory(email="access_owner4@conniku.com")
    viewer_user = test_user_factory(email="access_viewer2@conniku.com")

    doc = WorkspaceDocument(
        title="Doc read-only para viewer",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    member = WorkspaceMember(
        workspace_id=doc.id,
        user_id=viewer_user.id,
        role="viewer",
        invited_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(member)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        _check_access(doc.id, viewer_user, db_session, required_role="editor")
    assert exc_info.value.status_code == 403


def test_check_access_editor_puede_editar(db_session: Session, test_user_factory) -> None:
    """Un editor puede acceder con required_role='editor'."""
    from database import WorkspaceDocument, WorkspaceMember  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    owner = test_user_factory(email="access_owner5@conniku.com")
    editor_user = test_user_factory(email="access_editor@conniku.com")

    doc = WorkspaceDocument(
        title="Doc editable",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    member = WorkspaceMember(
        workspace_id=doc.id,
        user_id=editor_user.id,
        role="editor",
        invited_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(member)
    db_session.commit()

    result_doc, result_member = _check_access(doc.id, editor_user, db_session, required_role="editor")
    assert result_doc.id == doc.id
    assert result_member.role == "editor"


def test_check_access_editor_no_puede_ser_owner(db_session: Session, test_user_factory) -> None:
    """Un editor no puede acceder con required_role='owner'."""
    from fastapi import HTTPException  # type: ignore
    from database import WorkspaceDocument, WorkspaceMember  # type: ignore
    from workspaces_routes import _check_access  # type: ignore

    owner = test_user_factory(email="access_owner6@conniku.com")
    editor_user = test_user_factory(email="access_editor2@conniku.com")

    doc = WorkspaceDocument(
        title="Doc solo-owner",
        owner_id=owner.id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    member = WorkspaceMember(
        workspace_id=doc.id,
        user_id=editor_user.id,
        role="editor",
        invited_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(member)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        _check_access(doc.id, editor_user, db_session, required_role="owner")
    assert exc_info.value.status_code == 403
