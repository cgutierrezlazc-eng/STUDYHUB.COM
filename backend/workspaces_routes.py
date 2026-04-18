"""
Workspaces v2 — Redacción Colaborativa de Documentos Académicos.

Endpoints REST del módulo Workspaces. Prefijo /workspaces.
En sub-bloque 2a: CRUD de workspaces, miembros y versiones.
No incluye: Yjs WS (2b), Athena (2c), export/rúbrica/math/share (2d).

Patrón: sigue el estilo de collab_routes.py con _check_access helper.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from database import (
    User,
    WorkspaceDocument,
    WorkspaceMember,
    WorkspaceVersion,
    gen_id,
    get_db,
)
from fastapi import APIRouter, Depends, HTTPException
from middleware import get_current_user
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

logger = logging.getLogger("conniku.workspaces")

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


# ─── Helpers internos ─────────────────────────────────────────────


def _user_brief(u: Optional[User]) -> Optional[dict]:
    """Devuelve representación mínima de un usuario para respuestas JSON."""
    if not u:
        return None
    return {
        "id": u.id,
        "username": u.username,
        "firstName": u.first_name,
        "lastName": u.last_name,
        "avatar": u.avatar,
    }


def _check_access(
    doc_id: str,
    user: User,
    db: Session,
    required_role: str = "viewer",
) -> tuple:
    """Verifica que el usuario tenga acceso al workspace.

    Devuelve (doc, member_record | None).
    Lanza HTTPException 404 si no existe, 403 si no tiene el rol requerido.

    Jerarquía de roles: viewer (0) < editor (1) < owner (2).
    - required_role='viewer': cualquier miembro puede acceder (lectura).
    - required_role='editor': editors y owner pueden modificar contenido.
    - required_role='owner': solo el owner (eliminar, gestionar roles).
    """
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Workspace no encontrado")

    # Owner siempre tiene acceso total
    if doc.owner_id == user.id:
        return doc, None

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == doc_id,
            WorkspaceMember.user_id == user.id,
        )
        .first()
    )

    if not member:
        raise HTTPException(403, "No tienes acceso a este workspace")

    role_hierarchy = {"viewer": 0, "editor": 1, "owner": 2}
    if role_hierarchy.get(member.role, 0) < role_hierarchy.get(required_role, 0):
        raise HTTPException(403, "No tienes permisos suficientes")

    return doc, member


def _workspace_to_dict(
    doc: WorkspaceDocument,
    members: Optional[list] = None,
    expose_share_token: bool = False,
) -> dict:
    """Serializa WorkspaceDocument a dict JSON.

    El share_link_token solo se expone cuando `expose_share_token=True`
    (solo owners). Viewers/editors no lo ven para evitar que compartan
    enlaces públicos sin autorización del owner.
    """
    result = {
        "id": doc.id,
        "title": doc.title,
        "ownerId": doc.owner_id,
        "courseName": doc.course_name,
        "apaEdition": doc.apa_edition,
        "options": doc.options,
        "isCompleted": doc.is_completed,
        "contentYjs": doc.content_yjs,
        "createdAt": doc.created_at.isoformat() if doc.created_at else "",
        "updatedAt": doc.updated_at.isoformat() if doc.updated_at else "",
        "members": members or [],
    }
    if expose_share_token:
        result["shareLinkToken"] = doc.share_link_token
    return result


def _member_to_dict(m: WorkspaceMember) -> dict:
    """Serializa WorkspaceMember a dict JSON."""
    user = m.user if hasattr(m, "user") and m.user else None
    return {
        "id": m.id,
        "workspaceId": m.workspace_id,
        "userId": m.user_id,
        "user": _user_brief(user),
        "role": m.role,
        "charsContributed": m.chars_contributed,
        "invitedAt": m.invited_at.isoformat() if m.invited_at else "",
        "joinedAt": m.joined_at.isoformat() if m.joined_at else "",
    }


def _version_to_dict(v: WorkspaceVersion) -> dict:
    """Serializa WorkspaceVersion a dict JSON."""
    return {
        "id": v.id,
        "workspaceId": v.workspace_id,
        "contentYjs": v.content_yjs,
        "createdBy": v.created_by,
        "createdAt": v.created_at.isoformat() if v.created_at else "",
        "label": v.label,
    }


# ─── Pydantic schemas ─────────────────────────────────────────────
#
# Config:
# - populate_by_name=True permite enviar los campos en snake_case (course_name)
#   o camelCase (courseName). El frontend envía snake_case; backend los mapea.
# - alias_generator convierte automáticamente snake_case ↔ camelCase.

from pydantic import ConfigDict  # noqa: E402


def _to_camel(snake: str) -> str:
    parts = snake.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class _WorkspaceBaseRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
    )


class CreateWorkspaceRequest(_WorkspaceBaseRequest):
    title: str = Field(..., min_length=1, max_length=255)
    course_name: Optional[str] = Field(None, max_length=255)
    professor: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    apa_edition: str = Field("7", max_length=10)
    template_id: Optional[str] = None
    options: Optional[str] = None  # JSON string
    initial_rubric_raw: Optional[str] = None


class PatchWorkspaceRequest(_WorkspaceBaseRequest):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    course_name: Optional[str] = Field(None, max_length=255)
    apa_edition: Optional[str] = Field(None, max_length=10)
    options: Optional[str] = None
    cover_data: Optional[str] = None
    is_completed: Optional[bool] = None


class AddMemberRequest(BaseModel):
    email: str = Field(..., min_length=1)
    role: str = Field("editor")


class PatchMemberRequest(BaseModel):
    role: str


class CreateVersionRequest(_WorkspaceBaseRequest):
    content_yjs: str
    label: Optional[str] = Field(None, max_length=100)


# ─── CRUD de workspaces ───────────────────────────────────────────


@router.post("", status_code=201)
def create_workspace(
    data: CreateWorkspaceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Crea un nuevo workspace. El creador se convierte en owner automáticamente."""
    title = data.title.strip()
    if not title:
        raise HTTPException(400, "El título es requerido")

    doc = WorkspaceDocument(
        title=title,
        owner_id=user.id,
        course_name=data.course_name,
        apa_edition=data.apa_edition or "7",
        options=data.options or "{}",
        rubric_raw=data.initial_rubric_raw,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(doc)
    db.flush()  # Obtener id antes de crear el miembro

    # El owner se agrega como miembro con rol 'owner'
    owner_member = WorkspaceMember(
        workspace_id=doc.id,
        user_id=user.id,
        role="owner",
        invited_at=datetime.utcnow(),
        joined_at=datetime.utcnow(),
    )
    db.add(owner_member)
    db.commit()
    db.refresh(doc)

    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == doc.id).all()
    return _workspace_to_dict(
        doc,
        [_member_to_dict(m) for m in members],
        expose_share_token=True,  # el creador es owner, puede ver el token
    )


@router.get("")
def list_workspaces(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Lista todos los workspaces donde el usuario es owner o miembro.

    Response: ``{"workspaces": [...]}`` envuelto para permitir metadata
    futura (paginación, total, etc.) sin breaking change.
    """
    owned_ids = [r[0] for r in db.query(WorkspaceDocument.id).filter(WorkspaceDocument.owner_id == user.id).all()]
    member_ids = [r[0] for r in db.query(WorkspaceMember.workspace_id).filter(WorkspaceMember.user_id == user.id).all()]

    all_ids = list(set(owned_ids + member_ids))
    if not all_ids:
        return {"workspaces": []}

    docs = (
        db.query(WorkspaceDocument)
        .filter(WorkspaceDocument.id.in_(all_ids))
        .order_by(WorkspaceDocument.updated_at.desc())
        .all()
    )

    result = []
    for doc in docs:
        members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == doc.id).all()
        is_owner = doc.owner_id == user.id
        d = _workspace_to_dict(
            doc,
            [_member_to_dict(m) for m in members],
            expose_share_token=is_owner,
        )
        d.pop("contentYjs", None)  # No enviar contenido Yjs en lista
        result.append(d)

    return {"workspaces": result}


@router.get("/invite/{token}")
def get_invite(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Valida un token de invitación y devuelve metadata del workspace.

    Endpoint scaffold en 2a. La generación de tokens con expiración y
    roles configurables se implementa en 2d.

    Response alineado con ``InviteTokenInfo`` del frontend.
    """
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.share_link_token == token).first()
    if not doc:
        return {
            "valid": False,
            "workspace_id": None,
            "workspace_title": None,
            "owner_name": None,
            "proposed_role": None,
        }

    owner = db.query(User).filter(User.id == doc.owner_id).first()
    owner_name = owner.username if owner else "Desconocido"
    if owner and hasattr(owner, "first_name") and owner.first_name:
        owner_name = f"{owner.first_name} {owner.last_name or ''}".strip()

    return {
        "valid": True,
        "workspace_id": doc.id,
        "workspace_title": doc.title,
        "course_name": doc.course_name,
        "owner_name": owner_name,
        "proposed_role": "editor",  # Default scaffold 2a; rol configurable en 2d
        "token": token,
    }


@router.post("/invite/{token}/accept")
def accept_invite(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Acepta una invitación y agrega al usuario como miembro del workspace.

    Scaffold 2a: usa el ``share_link_token`` del workspace y agrega al usuario
    autenticado con rol "editor" (default). La verificación de expiración,
    roles específicos por invitación y flujo de una-sola-vez queda para 2d.
    """
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.share_link_token == token).first()
    if not doc:
        raise HTTPException(404, "Invitación inválida o expirada")

    # Evitar duplicar miembros
    existing = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == doc.id,
            WorkspaceMember.user_id == user.id,
        )
        .first()
    )
    if existing:
        return {"ok": True, "workspace_id": doc.id, "role": existing.role, "already_member": True}

    # Crear como editor por defecto (scaffold)
    new_member = WorkspaceMember(
        id=gen_id(),
        workspace_id=doc.id,
        user_id=user.id,
        role="editor",
        invited_at=datetime.utcnow(),
        joined_at=datetime.utcnow(),
    )
    db.add(new_member)
    db.commit()
    return {"ok": True, "workspace_id": doc.id, "role": "editor", "already_member": False}


@router.get("/{doc_id}")
def get_workspace(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Obtiene un workspace por ID. Requiere ser owner o miembro.

    El ``shareLinkToken`` solo se expone si el solicitante es owner,
    para evitar que editors/viewers compartan el enlace público sin
    autorización del owner.
    """
    doc, _ = _check_access(doc_id, user, db)
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == doc.id).all()
    is_owner = doc.owner_id == user.id
    return _workspace_to_dict(
        doc,
        [_member_to_dict(m) for m in members],
        expose_share_token=is_owner,
    )


@router.patch("/{doc_id}")
def patch_workspace(
    doc_id: str,
    data: PatchWorkspaceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Actualiza campos del workspace. Requiere rol editor o owner."""
    doc, _ = _check_access(doc_id, user, db, required_role="editor")

    if data.title is not None:
        stripped = data.title.strip()
        if stripped:
            doc.title = stripped
    if data.course_name is not None:
        doc.course_name = data.course_name
    if data.apa_edition is not None:
        doc.apa_edition = data.apa_edition
    if data.options is not None:
        doc.options = data.options
    if data.cover_data is not None:
        doc.cover_data = data.cover_data
    if data.is_completed is not None:
        doc.is_completed = data.is_completed

    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == doc.id).all()
    is_owner = doc.owner_id == user.id
    return _workspace_to_dict(
        doc,
        [_member_to_dict(m) for m in members],
        expose_share_token=is_owner,
    )


@router.delete("/{doc_id}")
def delete_workspace(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Elimina un workspace. Solo el owner puede hacerlo."""
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Workspace no encontrado")
    if doc.owner_id != user.id:
        raise HTTPException(403, "Solo el creador puede eliminar el workspace")

    db.delete(doc)
    db.commit()
    return {"ok": True}


# ─── Miembros ─────────────────────────────────────────────────────


@router.get("/{doc_id}/members")
def list_members(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Lista los miembros del workspace.

    Response: ``{"members": [...]}`` envuelto para permitir metadata
    futura (roles count, invitaciones pendientes) sin breaking change.
    """
    _check_access(doc_id, user, db)
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == doc_id).all()
    return {"members": [_member_to_dict(m) for m in members]}


@router.post("/{doc_id}/members", status_code=201)
def add_member(
    doc_id: str,
    data: AddMemberRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Agrega un miembro al workspace por email. Solo owner puede agregar."""
    _check_access(doc_id, user, db, required_role="owner")

    target = db.query(User).filter(User.email == data.email).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado con ese email")

    existing = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == doc_id,
            WorkspaceMember.user_id == target.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(409, "El usuario ya es miembro de este workspace")

    role = data.role if data.role in ("editor", "viewer") else "editor"

    member = WorkspaceMember(
        workspace_id=doc_id,
        user_id=target.id,
        role=role,
        invited_at=datetime.utcnow(),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return _member_to_dict(member)


@router.patch("/{doc_id}/members/{member_id}")
def patch_member(
    doc_id: str,
    member_id: str,
    data: PatchMemberRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Cambia el rol de un miembro. Solo el owner puede hacerlo."""
    _check_access(doc_id, user, db, required_role="owner")

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.id == member_id,
            WorkspaceMember.workspace_id == doc_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(404, "Miembro no encontrado")

    new_role = data.role if data.role in ("editor", "viewer") else "editor"
    member.role = new_role
    db.commit()
    db.refresh(member)
    return _member_to_dict(member)


@router.delete("/{doc_id}/members/{member_id}")
def remove_member(
    doc_id: str,
    member_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Remueve un miembro del workspace. Solo el owner puede remover a otros."""
    doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Workspace no encontrado")
    if doc.owner_id != user.id:
        raise HTTPException(403, "Solo el owner puede remover miembros")

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.id == member_id,
            WorkspaceMember.workspace_id == doc_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(404, "Miembro no encontrado")

    # No se puede remover al owner
    if member.user_id == doc.owner_id:
        raise HTTPException(400, "No se puede remover al owner del workspace")

    db.delete(member)
    db.commit()
    return {"ok": True}


# ─── Versiones ────────────────────────────────────────────────────


@router.get("/{doc_id}/versions")
def list_versions(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Lista las versiones del workspace. Máximo 50 más recientes.

    Response: ``{"versions": [...]}`` envuelto para permitir metadata
    futura (total, cursor de paginación) sin breaking change.
    """
    _check_access(doc_id, user, db)
    versions = (
        db.query(WorkspaceVersion)
        .filter(WorkspaceVersion.workspace_id == doc_id)
        .order_by(WorkspaceVersion.created_at.desc())
        .limit(50)
        .all()
    )
    return {"versions": [_version_to_dict(v) for v in versions]}


@router.post("/{doc_id}/versions", status_code=201)
def create_version(
    doc_id: str,
    data: CreateVersionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Crea un snapshot manual del workspace. Requiere rol editor o owner."""
    doc, _ = _check_access(doc_id, user, db, required_role="editor")

    version = WorkspaceVersion(
        workspace_id=doc_id,
        content_yjs=data.content_yjs,
        created_by=user.id,
        label=data.label,
        created_at=datetime.utcnow(),
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return _version_to_dict(version)


@router.post("/{doc_id}/versions/{version_id}/restore")
def restore_version(
    doc_id: str,
    version_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Restaura el workspace a una versión anterior. Requiere rol editor o owner."""
    doc, _ = _check_access(doc_id, user, db, required_role="editor")

    version = (
        db.query(WorkspaceVersion)
        .filter(
            WorkspaceVersion.id == version_id,
            WorkspaceVersion.workspace_id == doc_id,
        )
        .first()
    )
    if not version:
        raise HTTPException(404, "Versión no encontrada")

    # Restaurar contenido al snapshot de la versión
    doc.content_yjs = version.content_yjs
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == doc.id).all()
    return _workspace_to_dict(doc, [_member_to_dict(m) for m in members])
