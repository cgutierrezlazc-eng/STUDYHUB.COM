"""
Collaborative Documents — Trabajos Grupales.

Real-time collaborative document editing for group assignments.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from database import (
    get_db, User, gen_id,
    CollabDocument, CollabDocumentMember, CollabDocumentVersion,
    CollabDocumentMessage,
)
from middleware import get_current_user

router = APIRouter(prefix="/collab", tags=["collab"])


def _user_brief(u):
    if not u:
        return None
    return {
        "id": u.id, "username": u.username, "firstName": u.first_name,
        "lastName": u.last_name, "avatar": u.avatar,
    }


def _doc_to_dict(doc: CollabDocument, members: list | None = None) -> dict:
    return {
        "id": doc.id,
        "title": doc.title,
        "description": doc.description,
        "content": doc.content,
        "ownerId": doc.owner_id,
        "owner": _user_brief(doc.owner),
        "status": doc.status,
        "university": doc.university,
        "career": doc.career,
        "courseName": doc.course_name,
        "color": doc.color,
        "icon": doc.icon,
        "members": members or [],
        "createdAt": doc.created_at.isoformat() if doc.created_at else "",
        "updatedAt": doc.updated_at.isoformat() if doc.updated_at else "",
    }


def _member_to_dict(m: CollabDocumentMember) -> dict:
    return {
        "id": m.id,
        "userId": m.user_id,
        "user": _user_brief(m.user),
        "role": m.role,
        "joinedAt": m.joined_at.isoformat() if m.joined_at else "",
    }


def _check_access(doc_id: str, user: User, db: Session, min_role: str = "viewer"):
    """Check user has access to doc. Returns (doc, member_record)."""
    doc = db.query(CollabDocument).filter(CollabDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    # Owner always has full access
    if doc.owner_id == user.id:
        return doc, None

    member = db.query(CollabDocumentMember).filter(
        CollabDocumentMember.document_id == doc_id,
        CollabDocumentMember.user_id == user.id,
    ).first()

    if not member:
        raise HTTPException(403, "No tienes acceso a este documento")

    role_hierarchy = {"viewer": 0, "editor": 1, "owner": 2}
    if role_hierarchy.get(member.role, 0) < role_hierarchy.get(min_role, 0):
        raise HTTPException(403, "No tienes permisos suficientes")

    return doc, member


# ─── CRUD ────────────────────────────────────────────────────────

@router.post("")
def create_document(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = data.get("title", "").strip()
    if not title:
        raise HTTPException(400, "Titulo requerido")

    doc = CollabDocument(
        id=gen_id(),
        title=title,
        description=data.get("description", ""),
        owner_id=user.id,
        university=data.get("university", user.university or ""),
        career=data.get("career", user.career or ""),
        course_name=data.get("courseName", ""),
        color=data.get("color", "#2D62C8"),
        icon=data.get("icon", "file-text"),
    )
    db.add(doc)

    # Owner is automatically a member with 'owner' role
    owner_member = CollabDocumentMember(
        id=gen_id(), document_id=doc.id, user_id=user.id, role="owner",
    )
    db.add(owner_member)

    # Add initial members if provided
    member_ids = data.get("memberIds", [])
    for uid in member_ids:
        if uid == user.id:
            continue
        target = db.query(User).filter(User.id == uid).first()
        if target:
            m = CollabDocumentMember(
                id=gen_id(), document_id=doc.id, user_id=uid, role="editor",
            )
            db.add(m)

    db.commit()
    db.refresh(doc)

    members = db.query(CollabDocumentMember).filter(CollabDocumentMember.document_id == doc.id).all()
    return _doc_to_dict(doc, [_member_to_dict(m) for m in members])


@router.get("")
def list_documents(
    status: str = Query("active"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Documents where user is owner OR member
    owned_ids = db.query(CollabDocument.id).filter(
        CollabDocument.owner_id == user.id, CollabDocument.status == status
    ).all()
    member_ids = db.query(CollabDocumentMember.document_id).filter(
        CollabDocumentMember.user_id == user.id
    ).all()

    all_ids = list(set([r[0] for r in owned_ids] + [r[0] for r in member_ids]))
    if not all_ids:
        return []

    docs = db.query(CollabDocument).filter(
        CollabDocument.id.in_(all_ids), CollabDocument.status == status
    ).order_by(desc(CollabDocument.updated_at)).all()

    result = []
    for doc in docs:
        members = db.query(CollabDocumentMember).filter(
            CollabDocumentMember.document_id == doc.id
        ).all()
        d = _doc_to_dict(doc, [_member_to_dict(m) for m in members])
        d.pop("content", None)  # Don't send content in list view
        result.append(d)

    return result


@router.get("/{doc_id}")
def get_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, _ = _check_access(doc_id, user, db)
    members = db.query(CollabDocumentMember).filter(
        CollabDocumentMember.document_id == doc.id
    ).all()
    return _doc_to_dict(doc, [_member_to_dict(m) for m in members])


@router.put("/{doc_id}")
def update_document(doc_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, _ = _check_access(doc_id, user, db, min_role="editor")

    if "title" in data:
        doc.title = data["title"].strip() or doc.title
    if "description" in data:
        doc.description = data["description"]
    if "content" in data:
        doc.content = data["content"]
    if "color" in data:
        doc.color = data["color"]
    if "icon" in data:
        doc.icon = data["icon"]
    if "courseName" in data:
        doc.course_name = data["courseName"]
    if "status" in data and doc.owner_id == user.id:
        doc.status = data["status"]

    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    members = db.query(CollabDocumentMember).filter(
        CollabDocumentMember.document_id == doc.id
    ).all()
    return _doc_to_dict(doc, [_member_to_dict(m) for m in members])


@router.delete("/{doc_id}")
def delete_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(CollabDocument).filter(CollabDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if doc.owner_id != user.id:
        raise HTTPException(403, "Solo el creador puede eliminar el documento")

    db.delete(doc)
    db.commit()
    return {"ok": True}


# ─── Members ─────────────────────────────────────────────────────

@router.post("/{doc_id}/members")
def add_member(doc_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, _ = _check_access(doc_id, user, db, min_role="editor")

    user_id = data.get("userId", "").strip()
    if not user_id:
        raise HTTPException(400, "userId requerido")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    existing = db.query(CollabDocumentMember).filter(
        CollabDocumentMember.document_id == doc_id,
        CollabDocumentMember.user_id == user_id,
    ).first()
    if existing:
        raise HTTPException(400, "El usuario ya es miembro")

    role = data.get("role", "editor")
    if role not in ("editor", "viewer"):
        role = "editor"

    m = CollabDocumentMember(
        id=gen_id(), document_id=doc_id, user_id=user_id, role=role,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _member_to_dict(m)


@router.delete("/{doc_id}/members/{member_user_id}")
def remove_member(doc_id: str, member_user_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(CollabDocument).filter(CollabDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    # Only owner can remove others; members can remove themselves
    if user.id != doc.owner_id and user.id != member_user_id:
        raise HTTPException(403, "No tienes permisos para eliminar miembros")

    if member_user_id == doc.owner_id:
        raise HTTPException(400, "No puedes eliminar al creador del documento")

    member = db.query(CollabDocumentMember).filter(
        CollabDocumentMember.document_id == doc_id,
        CollabDocumentMember.user_id == member_user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Miembro no encontrado")

    db.delete(member)
    db.commit()
    return {"ok": True}


@router.put("/{doc_id}/members/{member_user_id}/role")
def update_member_role(doc_id: str, member_user_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(CollabDocument).filter(CollabDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if doc.owner_id != user.id:
        raise HTTPException(403, "Solo el creador puede cambiar roles")

    member = db.query(CollabDocumentMember).filter(
        CollabDocumentMember.document_id == doc_id,
        CollabDocumentMember.user_id == member_user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Miembro no encontrado")

    role = data.get("role", "editor")
    if role not in ("editor", "viewer"):
        role = "editor"

    member.role = role
    db.commit()
    return _member_to_dict(member)


# ─── Versions ────────────────────────────────────────────────────

@router.get("/{doc_id}/versions")
def list_versions(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_access(doc_id, user, db)
    versions = db.query(CollabDocumentVersion).filter(
        CollabDocumentVersion.document_id == doc_id
    ).order_by(desc(CollabDocumentVersion.version_number)).limit(50).all()

    return [{
        "id": v.id,
        "versionNumber": v.version_number,
        "createdBy": _user_brief(v.author),
        "createdAt": v.created_at.isoformat() if v.created_at else "",
    } for v in versions]


@router.post("/{doc_id}/versions")
def save_version(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, _ = _check_access(doc_id, user, db, min_role="editor")

    last = db.query(CollabDocumentVersion).filter(
        CollabDocumentVersion.document_id == doc_id
    ).order_by(desc(CollabDocumentVersion.version_number)).first()

    version_number = (last.version_number + 1) if last else 1

    v = CollabDocumentVersion(
        id=gen_id(),
        document_id=doc_id,
        content=doc.content or "",
        version_number=version_number,
        created_by=user.id,
    )
    db.add(v)
    db.commit()

    return {
        "id": v.id,
        "versionNumber": v.version_number,
        "createdBy": _user_brief(user),
        "createdAt": v.created_at.isoformat() if v.created_at else "",
    }


@router.get("/{doc_id}/versions/{version_id}")
def get_version(doc_id: str, version_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_access(doc_id, user, db)
    v = db.query(CollabDocumentVersion).filter(
        CollabDocumentVersion.id == version_id,
        CollabDocumentVersion.document_id == doc_id,
    ).first()
    if not v:
        raise HTTPException(404, "Version no encontrada")

    return {
        "id": v.id,
        "versionNumber": v.version_number,
        "content": v.content,
        "createdBy": _user_brief(v.author),
        "createdAt": v.created_at.isoformat() if v.created_at else "",
    }


# ─── User search (for adding members) ────────────────────────────

@router.get("/users/search")
def search_users(
    q: str = Query("", min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search users by name/username/email for adding to documents."""
    query = q.strip()
    if len(query) < 2:
        return []

    results = db.query(User).filter(
        User.id != user.id,
        or_(
            User.username.ilike(f"%{query}%"),
            User.first_name.ilike(f"%{query}%"),
            User.last_name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%"),
        )
    ).limit(10).all()

    return [_user_brief(u) for u in results]


# ─── Document Chat ───────────────────────────────────────────────

@router.get("/{doc_id}/chat")
def get_chat_messages(
    doc_id: str,
    before: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_access(doc_id, user, db)
    q = db.query(CollabDocumentMessage).filter(CollabDocumentMessage.document_id == doc_id)
    if before:
        q = q.filter(CollabDocumentMessage.created_at < before)
    messages = q.order_by(desc(CollabDocumentMessage.created_at)).limit(50).all()
    messages.reverse()

    return [{
        "id": m.id,
        "userId": m.user_id,
        "user": _user_brief(m.user),
        "content": m.content,
        "createdAt": m.created_at.isoformat() if m.created_at else "",
    } for m in messages]


@router.post("/{doc_id}/chat")
async def send_chat_message(
    doc_id: str,
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_access(doc_id, user, db)
    content = data.get("content", "").strip()
    if not content:
        raise HTTPException(400, "Mensaje vacio")

    msg = CollabDocumentMessage(
        id=gen_id(), document_id=doc_id, user_id=user.id, content=content,
    )
    db.add(msg)
    db.commit()

    msg_data = {
        "id": msg.id,
        "userId": msg.user_id,
        "user": _user_brief(user),
        "content": msg.content,
        "createdAt": msg.created_at.isoformat() if msg.created_at else "",
    }

    # Broadcast via document WebSocket room
    try:
        from collab_ws import _rooms
        room = _rooms.get(doc_id)
        if room:
            import asyncio
            await room.broadcast_json({"type": "chat_message", "message": msg_data})
    except Exception:
        pass  # WS broadcast is best-effort

    return msg_data
