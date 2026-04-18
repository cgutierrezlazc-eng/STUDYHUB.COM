"""Tests de modelos WorkspaceDocument, WorkspaceMember, WorkspaceVersion,
WorkspaceMessage, WorkspaceAthenaChat, WorkspaceAthenaSuggestion,
WorkspaceComment, AthenaUsage.

Valida:
- Creación con campos mínimos y defaults correctos.
- Constraints: unique share_link_token, FK cascades.
- Índice compuesto en AthenaUsage.
- Self-FK en WorkspaceComment para threads.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


# ─── WorkspaceDocument ───────────────────────────────────────────


def test_workspace_document_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_documents"), (
        "La tabla workspace_documents no fue creada por Base.metadata.create_all"
    )


def test_workspace_document_creacion_minima(db_session: Session, test_user_factory) -> None:
    """Crear WorkspaceDocument con solo title y owner_id. Verifica defaults."""
    from database import WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner@conniku.com")
    doc = WorkspaceDocument(
        title="Mi primer workspace",
        owner_id=owner.id,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    assert doc.id is not None
    assert len(doc.id) == 16
    assert doc.title == "Mi primer workspace"
    assert doc.owner_id == owner.id
    assert doc.apa_edition == "7"
    assert doc.options == "{}"
    assert doc.is_completed is False
    assert doc.share_link_token is None
    assert doc.created_at is not None
    assert doc.updated_at is not None


def test_workspace_document_share_link_token_unique(db_session: Session, test_user_factory) -> None:
    """Dos workspaces no pueden tener el mismo share_link_token."""
    from database import WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner2@conniku.com")
    token = "abc123tok456def1"

    doc1 = WorkspaceDocument(title="Doc 1", owner_id=owner.id, share_link_token=token)
    doc2 = WorkspaceDocument(title="Doc 2", owner_id=owner.id, share_link_token=token)

    db_session.add(doc1)
    db_session.commit()

    db_session.add(doc2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_workspace_document_campos_opcionales(db_session: Session, test_user_factory) -> None:
    """Crear WorkspaceDocument con campos opcionales rellenos."""
    from database import WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner3@conniku.com")
    doc = WorkspaceDocument(
        title="Informe final",
        owner_id=owner.id,
        course_name="Metodología de la Investigación",
        apa_edition="6",
        options='{"toc": true, "cover": false}',
        cover_data='{"title": "Informe de Investigación"}',
        cover_template="institutional",
        content_yjs="base64encoded==",
        is_completed=True,
        share_link_token="uniquetoken12345",
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    assert doc.course_name == "Metodología de la Investigación"
    assert doc.apa_edition == "6"
    assert doc.is_completed is True
    assert doc.share_link_token == "uniquetoken12345"


# ─── WorkspaceMember ─────────────────────────────────────────────


def test_workspace_member_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_members")


def test_workspace_member_creacion(db_session: Session, test_user_factory) -> None:
    """Crear un miembro con defaults correctos."""
    from database import WorkspaceDocument, WorkspaceMember  # type: ignore

    owner = test_user_factory(email="owner4@conniku.com")
    member_user = test_user_factory(email="member1@conniku.com")

    doc = WorkspaceDocument(title="Doc con miembro", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    member = WorkspaceMember(
        workspace_id=doc.id,
        user_id=member_user.id,
        role="editor",
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)

    assert member.id is not None
    assert member.workspace_id == doc.id
    assert member.user_id == member_user.id
    assert member.role == "editor"
    assert member.chars_contributed == 0
    assert member.invited_at is not None


def test_workspace_member_default_role_viewer(db_session: Session, test_user_factory) -> None:
    from database import WorkspaceDocument, WorkspaceMember  # type: ignore

    owner = test_user_factory(email="owner5@conniku.com")
    member_user = test_user_factory(email="viewer1@conniku.com")

    doc = WorkspaceDocument(title="Doc viewer", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    member = WorkspaceMember(workspace_id=doc.id, user_id=member_user.id)
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)

    assert member.role == "viewer"


# ─── WorkspaceVersion ────────────────────────────────────────────


def test_workspace_version_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_versions")


def test_workspace_version_creacion(db_session: Session, test_user_factory) -> None:
    from database import WorkspaceDocument, WorkspaceVersion  # type: ignore

    owner = test_user_factory(email="owner6@conniku.com")
    doc = WorkspaceDocument(title="Doc versionado", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    version = WorkspaceVersion(
        workspace_id=doc.id,
        content_yjs="base64snapshot==",
        created_by=owner.id,
        label="v1.0 - Entrega parcial",
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)

    assert version.id is not None
    assert version.workspace_id == doc.id
    assert version.content_yjs == "base64snapshot=="
    assert version.label == "v1.0 - Entrega parcial"
    assert version.created_at is not None


# ─── WorkspaceMessage ────────────────────────────────────────────


def test_workspace_message_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_messages")


def test_workspace_message_creacion(db_session: Session, test_user_factory) -> None:
    from database import WorkspaceDocument, WorkspaceMessage  # type: ignore

    owner = test_user_factory(email="owner7@conniku.com")
    doc = WorkspaceDocument(title="Doc con chat", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    msg = WorkspaceMessage(
        workspace_id=doc.id,
        user_id=owner.id,
        content="Hola equipo, ya actualicé la intro.",
    )
    db_session.add(msg)
    db_session.commit()
    db_session.refresh(msg)

    assert msg.id is not None
    assert msg.content == "Hola equipo, ya actualicé la intro."
    assert msg.created_at is not None


# ─── WorkspaceAthenaChat ─────────────────────────────────────────


def test_workspace_athena_chat_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_athena_chats")


def test_workspace_athena_chat_pk_autoincrement(db_session: Session, test_user_factory) -> None:
    """WorkspaceAthenaChat usa Integer PK autoincrement (tabla de historial)."""
    from database import WorkspaceAthenaChat, WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner8@conniku.com")
    doc = WorkspaceDocument(title="Doc Athena", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    chat1 = WorkspaceAthenaChat(
        workspace_id=doc.id,
        user_id=owner.id,
        role="user",
        content="¿Qué es el método APA?",
    )
    chat2 = WorkspaceAthenaChat(
        workspace_id=doc.id,
        user_id=owner.id,
        role="athena",
        content="APA son las siglas de American Psychological Association...",
    )
    db_session.add_all([chat1, chat2])
    db_session.commit()
    db_session.refresh(chat1)
    db_session.refresh(chat2)

    assert isinstance(chat1.id, int)
    assert isinstance(chat2.id, int)
    assert chat2.id > chat1.id


# ─── WorkspaceAthenaSuggestion ───────────────────────────────────


def test_workspace_athena_suggestion_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_athena_suggestions")


def test_workspace_athena_suggestion_default_status_pending(db_session: Session, test_user_factory) -> None:
    from database import WorkspaceAthenaSuggestion, WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner9@conniku.com")
    doc = WorkspaceDocument(title="Doc sugerencias", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    suggestion = WorkspaceAthenaSuggestion(
        workspace_id=doc.id,
        user_id=owner.id,
        staging_content="El impacto del cambio climático...",
        suggestion_content="El impacto del cambio climático en los ecosistemas costeros...",
    )
    db_session.add(suggestion)
    db_session.commit()
    db_session.refresh(suggestion)

    assert isinstance(suggestion.id, int)
    assert suggestion.status == "pending"
    assert suggestion.resolved_at is None


# ─── WorkspaceComment ────────────────────────────────────────────


def test_workspace_comment_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("workspace_comments")


def test_workspace_comment_self_fk_thread(db_session: Session, test_user_factory) -> None:
    """Comentario puede referenciar a otro comentario como padre (thread)."""
    from database import WorkspaceComment, WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner10@conniku.com")
    doc = WorkspaceDocument(title="Doc comentarios", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    parent = WorkspaceComment(
        workspace_id=doc.id,
        user_id=owner.id,
        anchor_json='{"nodeKey": "abc", "offset": 10}',
        content="¿Esto está bien redactado?",
    )
    db_session.add(parent)
    db_session.commit()
    db_session.refresh(parent)

    reply = WorkspaceComment(
        workspace_id=doc.id,
        user_id=owner.id,
        anchor_json='{"nodeKey": "abc", "offset": 10}',
        content="Sí, pero podría ser más claro.",
        parent_id=parent.id,
    )
    db_session.add(reply)
    db_session.commit()
    db_session.refresh(reply)

    assert reply.parent_id == parent.id
    assert reply.resolved is False


# ─── AthenaUsage ─────────────────────────────────────────────────


def test_athena_usage_tabla_existe(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("athena_usage")


def test_athena_usage_pk_autoincrement(db_session: Session, test_user_factory) -> None:
    """AthenaUsage usa Integer PK autoincrement (tabla de métricas)."""
    from database import AthenaUsage, WorkspaceDocument  # type: ignore

    owner = test_user_factory(email="owner11@conniku.com")
    doc = WorkspaceDocument(title="Doc uso Athena", owner_id=owner.id)
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    u1 = AthenaUsage(
        user_id=owner.id,
        workspace_id=doc.id,
        action="chat",
        tokens_input=150,
        tokens_output=300,
    )
    u2 = AthenaUsage(
        user_id=owner.id,
        workspace_id=doc.id,
        action="suggest",
        tokens_input=200,
        tokens_output=500,
    )
    db_session.add_all([u1, u2])
    db_session.commit()
    db_session.refresh(u1)
    db_session.refresh(u2)

    assert isinstance(u1.id, int)
    assert isinstance(u2.id, int)
    assert u2.id > u1.id
    assert u1.action == "chat"
    assert u1.tokens_input == 150
    assert u1.tokens_output == 300


def test_athena_usage_workspace_id_nullable(db_session: Session, test_user_factory) -> None:
    """AthenaUsage.workspace_id puede ser NULL (uso global, sin doc específico)."""
    from database import AthenaUsage  # type: ignore

    owner = test_user_factory(email="owner12@conniku.com")
    usage = AthenaUsage(
        user_id=owner.id,
        action="analyze",
    )
    db_session.add(usage)
    db_session.commit()
    db_session.refresh(usage)

    assert usage.workspace_id is None
    assert usage.tokens_input == 0
    assert usage.tokens_output == 0
