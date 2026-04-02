"""
Messaging routes: conversations, messages, folders, user search.
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func

from database import (
    get_db, User, Conversation, ConversationParticipant,
    Message, ConversationFolder, ConversationFolderItem, gen_id
)
from middleware import get_current_user
from moderation import check_content
try:
    from notifications import notify_new_message
except ImportError:
    notify_new_message = None

router = APIRouter(prefix="/messaging", tags=["messaging"])


# ─── Models ──────────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    type: str  # direct | group_study
    name: Optional[str] = None
    description: Optional[str] = None
    participant_ids: List[str] = []


class SendMessageRequest(BaseModel):
    content: str
    message_type: str = "text"  # text | document
    document_name: Optional[str] = None
    document_path: Optional[str] = None


class EditMessageRequest(BaseModel):
    content: str


class CreateFolderRequest(BaseModel):
    name: str


class MoveFolderRequest(BaseModel):
    conversation_id: str


# ─── Helpers ─────────────────────────────────────────────────────

def user_brief(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "avatar": user.avatar or "",
        "userNumber": user.user_number,
    }


def message_to_dict(msg: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    return {
        "id": msg.id,
        "conversationId": msg.conversation_id,
        "sender": user_brief(sender) if sender else None,
        "content": msg.content if not msg.is_deleted else "[Mensaje eliminado]",
        "messageType": msg.message_type,
        "documentName": msg.document_name,
        "documentPath": msg.document_path,
        "isDeleted": msg.is_deleted,
        "isFlagged": msg.is_flagged,
        "createdAt": msg.created_at.isoformat() if msg.created_at else "",
        "editedAt": msg.edited_at.isoformat() if msg.edited_at else None,
    }


def conversation_to_dict(conv: Conversation, user_id: str, db: Session) -> dict:
    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv.id
    ).all()

    part_users = []
    for p in participants:
        u = db.query(User).filter(User.id == p.user_id).first()
        if u:
            part_users.append({**user_brief(u), "role": p.role})

    # Get last message
    last_msg = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.is_deleted == False
    ).order_by(desc(Message.created_at)).first()

    # Unread count
    my_part = next((p for p in participants if p.user_id == user_id), None)
    unread = 0
    if my_part and my_part.last_read_at:
        unread = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.created_at > my_part.last_read_at,
            Message.sender_id != user_id,
            Message.is_deleted == False
        ).count()
    elif my_part:
        unread = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != user_id,
            Message.is_deleted == False
        ).count()

    # For direct chats, get the other user's name
    display_name = conv.name
    if conv.type == "direct" and not display_name:
        other = next((p for p in part_users if p["id"] != user_id), None)
        if other:
            display_name = f"{other['firstName']} {other['lastName']}"

    return {
        "id": conv.id,
        "type": conv.type,
        "name": display_name or "Chat",
        "description": conv.description or "",
        "avatar": conv.avatar or "",
        "participants": part_users,
        "lastMessage": message_to_dict(last_msg, db) if last_msg else None,
        "unreadCount": unread,
        "createdAt": conv.created_at.isoformat() if conv.created_at else "",
        "updatedAt": conv.updated_at.isoformat() if conv.updated_at else "",
    }


# ─── User Search ─────────────────────────────────────────────────

@router.get("/users/search")
def search_users(q: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(q) < 2:
        return []

    results = db.query(User).filter(
        User.id != user.id,
        User.is_banned == False,
        or_(
            User.username.ilike(f"%{q}%"),
            User.first_name.ilike(f"%{q}%"),
            User.last_name.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%"),
        )
    ).limit(20).all()

    return [user_brief(u) for u in results]


# ─── Conversations ───────────────────────────────────────────────

@router.get("/conversations")
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    my_convs = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == user.id
    ).all()

    conv_ids = [p.conversation_id for p in my_convs]
    conversations = db.query(Conversation).filter(
        Conversation.id.in_(conv_ids)
    ).order_by(desc(Conversation.updated_at)).all()

    return [conversation_to_dict(c, user.id, db) for c in conversations]


@router.post("/conversations")
def create_conversation(req: CreateConversationRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.type not in ("direct", "group_study"):
        raise HTTPException(400, "Tipo de conversación inválido")

    # For direct chats, check if one already exists with this user pair
    if req.type == "direct" and len(req.participant_ids) == 1:
        other_id = req.participant_ids[0]
        existing = db.query(Conversation).join(ConversationParticipant).filter(
            Conversation.type == "direct",
            ConversationParticipant.user_id == user.id
        ).all()

        for conv in existing:
            parts = [p.user_id for p in conv.participants]
            if other_id in parts and user.id in parts and len(parts) == 2:
                return conversation_to_dict(conv, user.id, db)

    conv = Conversation(
        id=gen_id(),
        type=req.type,
        name=req.name,
        description=req.description,
        created_by=user.id,
    )
    db.add(conv)

    # Add creator as admin
    db.add(ConversationParticipant(
        id=gen_id(),
        conversation_id=conv.id,
        user_id=user.id,
        role="admin",
    ))

    # Add other participants
    for pid in req.participant_ids:
        if pid != user.id:
            target = db.query(User).filter(User.id == pid).first()
            if target and not target.is_banned:
                db.add(ConversationParticipant(
                    id=gen_id(),
                    conversation_id=conv.id,
                    user_id=pid,
                    role="member",
                ))

    db.commit()
    db.refresh(conv)
    return conversation_to_dict(conv, user.id, db)


@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user.id,
    ).first()
    if not part:
        raise HTTPException(403, "No tienes acceso a esta conversación")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Conversación no encontrada")

    return conversation_to_dict(conv, user.id, db)


# ─── Messages ────────────────────────────────────────────────────

@router.get("/conversations/{conv_id}/messages")
def get_messages(
    conv_id: str,
    before: Optional[str] = None,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check access
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user.id,
    ).first()
    if not part:
        raise HTTPException(403, "No tienes acceso a esta conversación")

    query = db.query(Message).filter(Message.conversation_id == conv_id)

    if before:
        ref_msg = db.query(Message).filter(Message.id == before).first()
        if ref_msg:
            query = query.filter(Message.created_at < ref_msg.created_at)

    messages = query.order_by(desc(Message.created_at)).limit(limit).all()
    messages.reverse()  # Oldest first

    # Update last_read
    part.last_read_at = datetime.utcnow()
    db.commit()

    return [message_to_dict(m, db) for m in messages]


@router.post("/conversations/{conv_id}/messages")
def send_message(
    conv_id: str,
    req: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check access
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user.id,
    ).first()
    if not part:
        raise HTTPException(403, "No tienes acceso a esta conversación")

    # Content moderation
    moderation = check_content(req.content)
    if not moderation["allowed"]:
        raise HTTPException(400, f"Contenido no permitido: {moderation['reason']}")

    # Track storage for document/photo/audio attachments (base64 data URLs)
    if req.document_path and req.document_path.startswith("data:"):
        attachment_size = len(req.document_path.encode('utf-8'))
        current_used = getattr(user, 'storage_used_bytes', 0) or 0
        storage_limit = getattr(user, 'storage_limit_bytes', 524288000) or 524288000
        if current_used + attachment_size > storage_limit:
            used_mb = round(current_used / 1048576, 1)
            limit_mb = round(storage_limit / 1048576, 1)
            raise HTTPException(
                413,
                f"Almacenamiento lleno ({used_mb}/{limit_mb} MB). "
                "Actualiza a PRO para obtener más espacio."
            )
        user.storage_used_bytes = current_used + attachment_size

    msg = Message(
        id=gen_id(),
        conversation_id=conv_id,
        sender_id=user.id,
        content=req.content,
        message_type=req.message_type,
        document_name=req.document_name,
        document_path=req.document_path,
        is_flagged=moderation.get("flagged", False),
        flag_reason=moderation.get("flag_reason"),
    )
    db.add(msg)

    # Update conversation timestamp
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if conv:
        conv.updated_at = datetime.utcnow()

    # Update sender's last_read
    part.last_read_at = datetime.utcnow()

    db.commit()
    db.refresh(msg)

    # Notify other participants via email
    if notify_new_message and conv:
        other_parts = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id != user.id,
        ).all()
        for op in other_parts:
            recipient = db.query(User).filter(User.id == op.user_id).first()
            if recipient:
                notify_new_message(db, recipient, user, req.content[:100])

    return message_to_dict(msg, db)


@router.put("/conversations/{conv_id}/messages/{msg_id}")
def edit_message(
    conv_id: str,
    msg_id: str,
    req: EditMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).filter(
        Message.id == msg_id,
        Message.conversation_id == conv_id,
        Message.sender_id == user.id,
    ).first()
    if not msg:
        raise HTTPException(404, "Mensaje no encontrado")

    moderation = check_content(req.content)
    if not moderation["allowed"]:
        raise HTTPException(400, f"Contenido no permitido: {moderation['reason']}")

    msg.content = req.content
    msg.edited_at = datetime.utcnow()
    db.commit()
    return message_to_dict(msg, db)


@router.delete("/conversations/{conv_id}/messages/{msg_id}")
def delete_message(
    conv_id: str,
    msg_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).filter(
        Message.id == msg_id,
        Message.conversation_id == conv_id,
    ).first()
    if not msg:
        raise HTTPException(404, "Mensaje no encontrado")

    # Allow sender or conversation admin to delete
    if msg.sender_id != user.id:
        part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id == user.id,
            ConversationParticipant.role == "admin",
        ).first()
        if not part:
            raise HTTPException(403, "No tienes permiso para eliminar este mensaje")

    msg.is_deleted = True
    db.commit()
    return {"deleted": True}


# ─── Participants ────────────────────────────────────────────────

@router.post("/conversations/{conv_id}/participants")
def add_participant(
    conv_id: str,
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Must be admin of conversation
    my_part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user.id,
        ConversationParticipant.role == "admin",
    ).first()
    if not my_part:
        raise HTTPException(403, "Solo administradores pueden agregar participantes")

    # Check conversation is group
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if conv and conv.type == "direct":
        raise HTTPException(400, "No se pueden agregar participantes a chats directos")

    # Check not already in
    existing = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user_id,
    ).first()
    if existing:
        raise HTTPException(400, "El usuario ya es participante")

    target = db.query(User).filter(User.id == user_id).first()
    if not target or target.is_banned:
        raise HTTPException(404, "Usuario no encontrado")

    db.add(ConversationParticipant(
        id=gen_id(),
        conversation_id=conv_id,
        user_id=user_id,
        role="member",
    ))

    # System message
    db.add(Message(
        id=gen_id(),
        conversation_id=conv_id,
        sender_id=user.id,
        content=f"{target.first_name} {target.last_name} se unió al grupo",
        message_type="system",
    ))

    db.commit()
    return {"added": True}


@router.delete("/conversations/{conv_id}/participants/{target_id}")
def remove_participant(
    conv_id: str,
    target_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Self-leave or admin removal
    if target_id != user.id:
        my_part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id == user.id,
            ConversationParticipant.role == "admin",
        ).first()
        if not my_part:
            raise HTTPException(403, "No tienes permiso")

    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == target_id,
    ).first()
    if part:
        db.delete(part)
        db.commit()
    return {"removed": True}


# ─── Folders ─────────────────────────────────────────────────────

@router.get("/folders")
def list_folders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folders = db.query(ConversationFolder).filter(
        ConversationFolder.user_id == user.id
    ).all()

    result = []
    for f in folders:
        items = db.query(ConversationFolderItem).filter(
            ConversationFolderItem.folder_id == f.id
        ).all()
        result.append({
            "id": f.id,
            "name": f.name,
            "conversationIds": [item.conversation_id for item in items],
        })
    return result


@router.post("/folders")
def create_folder(req: CreateFolderRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = ConversationFolder(
        id=gen_id(),
        user_id=user.id,
        name=req.name,
    )
    db.add(folder)
    db.commit()
    return {"id": folder.id, "name": folder.name, "conversationIds": []}


@router.put("/folders/{folder_id}")
def rename_folder(folder_id: str, req: CreateFolderRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(ConversationFolder).filter(
        ConversationFolder.id == folder_id,
        ConversationFolder.user_id == user.id,
    ).first()
    if not folder:
        raise HTTPException(404, "Carpeta no encontrada")
    folder.name = req.name
    db.commit()
    return {"id": folder.id, "name": folder.name}


@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(ConversationFolder).filter(
        ConversationFolder.id == folder_id,
        ConversationFolder.user_id == user.id,
    ).first()
    if folder:
        db.delete(folder)
        db.commit()
    return {"deleted": True}


@router.post("/folders/{folder_id}/conversations")
def add_to_folder(folder_id: str, req: MoveFolderRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(ConversationFolder).filter(
        ConversationFolder.id == folder_id,
        ConversationFolder.user_id == user.id,
    ).first()
    if not folder:
        raise HTTPException(404, "Carpeta no encontrada")

    existing = db.query(ConversationFolderItem).filter(
        ConversationFolderItem.folder_id == folder_id,
        ConversationFolderItem.conversation_id == req.conversation_id,
    ).first()
    if not existing:
        db.add(ConversationFolderItem(
            id=gen_id(),
            folder_id=folder_id,
            conversation_id=req.conversation_id,
        ))
        db.commit()
    return {"added": True}
