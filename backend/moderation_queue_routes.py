"""
CEO moderation queue: review and approve/reject flagged content.
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, ModerationQueueItem, Message, User, gen_id
from middleware import get_current_user
from websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ceo/moderation", tags=["moderation"])


def _require_ceo(user: User):
    if user.role not in ("owner", "admin", "ceo"):
        raise HTTPException(403, "Solo el CEO puede acceder a esta sección")


@router.get("/queue")
async def get_moderation_queue(
    status: Optional[str] = "pending",
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get moderation queue items."""
    _require_ceo(user)
    query = db.query(ModerationQueueItem)
    if status and status != "all":
        query = query.filter(ModerationQueueItem.status == status)
    items = query.order_by(ModerationQueueItem.created_at.desc()).limit(limit).all()

    result = []
    for item in items:
        sender = db.query(User).filter(User.id == item.sender_id).first() if item.sender_id else None
        result.append({
            "id": item.id,
            "contentType": item.content_type,
            "originalContent": item.original_content,
            "senderId": item.sender_id,
            "senderName": f"{sender.first_name} {sender.last_name}" if sender else "Usuario",
            "senderUsername": sender.username if sender else "",
            "contextId": item.context_id,
            "category": item.category,
            "autoReason": item.auto_reason,
            "status": item.status,
            "ceoNote": item.ceo_note,
            "messageId": item.message_id,
            "createdAt": item.created_at.isoformat() if item.created_at else "",
            "reviewedAt": item.reviewed_at.isoformat() if item.reviewed_at else None,
        })
    return result


@router.get("/stats")
def get_moderation_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get counts by status."""
    _require_ceo(user)
    pending = db.query(ModerationQueueItem).filter(ModerationQueueItem.status == "pending").count()
    approved = db.query(ModerationQueueItem).filter(ModerationQueueItem.status == "approved").count()
    rejected = db.query(ModerationQueueItem).filter(ModerationQueueItem.status == "rejected").count()
    return {"pending": pending, "approved": approved, "rejected": rejected, "total": pending + approved + rejected}


@router.post("/{item_id}/approve")
async def approve_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve a flagged item — publishes the message."""
    _require_ceo(user)
    item = db.query(ModerationQueueItem).filter(ModerationQueueItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item no encontrado")

    item.status = "approved"
    item.reviewed_at = datetime.utcnow()

    # Update linked message to approved
    if item.message_id:
        msg = db.query(Message).filter(Message.id == item.message_id).first()
        if msg:
            msg.moderation_status = "approved"
            db.commit()

            # Broadcast approved message to conversation via WebSocket
            try:
                from messaging_routes import message_to_dict
                msg_data = message_to_dict(msg, db)
                msg_data["moderationStatus"] = "approved"
                await manager.broadcast_to_conversation(item.context_id, {
                    "type": "new_message",
                    "conversation_id": item.context_id,
                    "message": msg_data,
                    "_approved": True,
                })
                # Notify sender
                await manager.send_to_user(msg.sender_id, {
                    "type": "message_approved",
                    "message_id": msg.id,
                    "conversation_id": item.context_id,
                })
            except Exception as e:
                logger.error(f"[moderation] Broadcast after approval failed: {e}")
    else:
        db.commit()

    return {"success": True, "status": "approved"}


@router.post("/{item_id}/reject")
async def reject_item(
    item_id: str,
    note: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a flagged item — removes the message."""
    _require_ceo(user)
    item = db.query(ModerationQueueItem).filter(ModerationQueueItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item no encontrado")

    item.status = "rejected"
    item.reviewed_at = datetime.utcnow()
    item.ceo_note = note

    # Update linked message to rejected
    if item.message_id:
        msg = db.query(Message).filter(Message.id == item.message_id).first()
        if msg:
            msg.moderation_status = "rejected"
            db.commit()

            # Notify sender of rejection
            try:
                await manager.send_to_user(msg.sender_id, {
                    "type": "message_rejected",
                    "message_id": msg.id,
                    "conversation_id": item.context_id,
                    "reason": note or "Contenido no apropiado para Conniku",
                })
            except Exception as e:
                logger.error(f"[moderation] Reject notification failed: {e}")
    else:
        db.commit()

    return {"success": True, "status": "rejected"}
