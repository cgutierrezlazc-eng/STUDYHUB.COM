"""
WebSocket endpoint and real-time event handlers for Conniku messaging.
"""
import json
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from database import get_db, ConversationParticipant, Message, Conversation, User, gen_id
from websocket_manager import manager
from moderation import check_content

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


# ─── Public endpoint: live online count (no auth required) ───
@router.get("/ws/online-count")
def get_online_count(db: Session = Depends(get_db)):
    """Return live count of connected students and tutors."""
    online_ids = manager.get_online_users()
    total = len(online_ids)

    tutors = 0
    if online_ids:
        tutors = db.query(User).filter(
            User.id.in_(online_ids),
            User.offers_mentoring == True,
        ).count()

    return {
        "total": total,
        "students": total - tutors,
        "tutors": tutors,
    }


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(default=None),
):
    """
    Main WebSocket endpoint.
    Connect with: ws://host/ws?token=JWT_TOKEN

    Client messages (JSON):
    - { "type": "subscribe", "conversation_id": "..." }
    - { "type": "unsubscribe", "conversation_id": "..." }
    - { "type": "message", "conversation_id": "...", "content": "...", "message_type": "text" }
    - { "type": "typing", "conversation_id": "..." }
    - { "type": "stop_typing", "conversation_id": "..." }
    - { "type": "read", "conversation_id": "...", "message_id": "..." }
    - { "type": "ping" }

    Server messages (JSON):
    - { "type": "new_message", "conversation_id": "...", "message": {...} }
    - { "type": "typing", "conversation_id": "...", "user_id": "...", "username": "..." }
    - { "type": "stop_typing", "conversation_id": "...", "user_id": "..." }
    - { "type": "message_read", "conversation_id": "...", "message_id": "...", "user_id": "..." }
    - { "type": "user_online", "user_id": "..." }
    - { "type": "user_offline", "user_id": "..." }
    - { "type": "conversation_update", "conversation_id": "...", ... }
    - { "type": "error", "message": "..." }
    - { "type": "pong" }
    """
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    # Authenticate
    user_id = await manager.authenticate(websocket, token)
    if not user_id:
        await websocket.close(code=4003, reason="Invalid token")
        return

    # Connect
    await manager.connect(websocket, user_id)

    # Notify friends/contacts that user is online
    try:
        db = next(get_db())
        user = db.query(User).filter(User.id == user_id).first()
        username = user.username if user else "unknown"

        # Auto-subscribe to all user's conversations
        participations = db.query(ConversationParticipant).filter(
            ConversationParticipant.user_id == user_id
        ).all()
        conv_ids = [p.conversation_id for p in participations]
        for cid in conv_ids:
            manager.subscribe_conversation(user_id, cid)

        # Get all conversation partners to notify them
        partner_ids = set()
        for cid in conv_ids:
            parts = db.query(ConversationParticipant).filter(
                ConversationParticipant.conversation_id == cid,
                ConversationParticipant.user_id != user_id
            ).all()
            for p in parts:
                partner_ids.add(p.user_id)

        # Broadcast online status
        for pid in partner_ids:
            await manager.send_to_user(pid, {
                "type": "user_online",
                "user_id": user_id,
                "username": username
            })

        db.close()
    except Exception as e:
        logger.error(f"[WS] Error during connection setup: {e}")

    # Main message loop
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = data.get("type", "")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "subscribe":
                conv_id = data.get("conversation_id")
                if conv_id:
                    manager.subscribe_conversation(user_id, conv_id)

            elif msg_type == "unsubscribe":
                conv_id = data.get("conversation_id")
                if conv_id:
                    manager.unsubscribe_conversation(user_id, conv_id)

            elif msg_type == "message":
                await _handle_message(websocket, user_id, data)

            elif msg_type == "typing":
                conv_id = data.get("conversation_id")
                if conv_id:
                    db = next(get_db())
                    u = db.query(User).filter(User.id == user_id).first()
                    uname = u.username if u else "unknown"
                    db.close()
                    await manager.broadcast_to_conversation(conv_id, {
                        "type": "typing",
                        "conversation_id": conv_id,
                        "user_id": user_id,
                        "username": uname
                    }, exclude_user=user_id)

            elif msg_type == "stop_typing":
                conv_id = data.get("conversation_id")
                if conv_id:
                    await manager.broadcast_to_conversation(conv_id, {
                        "type": "stop_typing",
                        "conversation_id": conv_id,
                        "user_id": user_id
                    }, exclude_user=user_id)

            elif msg_type == "read":
                conv_id = data.get("conversation_id")
                message_id = data.get("message_id")
                if conv_id and message_id:
                    await manager.broadcast_to_conversation(conv_id, {
                        "type": "message_read",
                        "conversation_id": conv_id,
                        "message_id": message_id,
                        "user_id": user_id
                    }, exclude_user=user_id)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[WS] Error in message loop for user {user_id}: {e}")
    finally:
        manager.disconnect(websocket)
        # Notify offline
        try:
            db = next(get_db())
            participations = db.query(ConversationParticipant).filter(
                ConversationParticipant.user_id == user_id
            ).all()
            partner_ids = set()
            for p in participations:
                parts = db.query(ConversationParticipant).filter(
                    ConversationParticipant.conversation_id == p.conversation_id,
                    ConversationParticipant.user_id != user_id
                ).all()
                for pp in parts:
                    partner_ids.add(pp.user_id)

            if not manager.is_user_online(user_id):
                for pid in partner_ids:
                    await manager.send_to_user(pid, {
                        "type": "user_offline",
                        "user_id": user_id
                    })
            db.close()
        except Exception:
            pass


async def _handle_message(websocket: WebSocket, user_id: str, data: dict):
    """Process and broadcast a new chat message."""
    conv_id = data.get("conversation_id")
    content = data.get("content", "").strip()
    message_type = data.get("message_type", "text")
    reply_to_id = data.get("reply_to_id")

    if not conv_id or not content:
        await websocket.send_json({"type": "error", "message": "Missing conversation_id or content"})
        return

    db = next(get_db())
    try:
        # Verify user is participant
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id == user_id
        ).first()
        if not participant:
            await websocket.send_json({"type": "error", "message": "Not a participant"})
            return

        # Content moderation
        flagged = False
        try:
            moderation = check_content(content)
            if not moderation.get("allowed", True):
                await websocket.send_json({"type": "error", "message": moderation.get("reason", "Contenido no permitido.")})
                return
            flagged = moderation.get("flagged", False)
        except Exception:
            pass

        # Look up reply_to message if provided
        reply_to_content = None
        reply_to_sender_name = None
        if reply_to_id:
            ref_msg = db.query(Message).filter(Message.id == reply_to_id).first()
            if ref_msg:
                reply_to_content = ref_msg.content[:200] if not ref_msg.is_deleted else "[Mensaje eliminado]"
                ref_sender = db.query(User).filter(User.id == ref_msg.sender_id).first()
                reply_to_sender_name = ref_sender.first_name if ref_sender else "Usuario"

        # Create message in DB
        msg = Message(
            id=gen_id(),
            conversation_id=conv_id,
            sender_id=user_id,
            content=content,
            message_type=message_type,
            is_flagged=flagged,
            created_at=datetime.utcnow(),
            reply_to_id=reply_to_id if reply_to_id else None,
            reply_to_content=reply_to_content,
            reply_to_sender_name=reply_to_sender_name,
        )
        db.add(msg)

        # Update conversation last activity
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if conv:
            conv.updated_at = datetime.utcnow()

        db.commit()

        # Get sender info
        sender = db.query(User).filter(User.id == user_id).first()

        # Build message payload
        message_data = {
            "id": msg.id,
            "conversationId": conv_id,
            "senderId": user_id,
            "senderUsername": sender.username if sender else "unknown",
            "senderFirstName": sender.first_name if sender else "",
            "senderLastName": sender.last_name if sender else "",
            "senderAvatar": sender.avatar or "" if sender else "",
            "content": content,
            "messageType": message_type,
            "isFlagged": flagged,
            "createdAt": msg.created_at.isoformat(),
            "isEdited": False,
            "replyToId": reply_to_id,
            "replyToContent": reply_to_content,
            "replyToSenderName": reply_to_sender_name,
        }

        # Send confirmation to sender
        await websocket.send_json({
            "type": "message_sent",
            "conversation_id": conv_id,
            "message": message_data
        })

        # Broadcast to all subscribers (including sender's other tabs)
        await manager.broadcast_to_conversation(conv_id, {
            "type": "new_message",
            "conversation_id": conv_id,
            "message": message_data
        }, exclude_user=user_id)

        # Also notify participants who are online but not subscribed to this conversation
        all_participants = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id
        ).all()
        participant_ids = [p.user_id for p in all_participants]

        conv_name = conv.name if conv else ""
        await manager.notify_conversation_participants(conv_id, participant_ids, {
            "type": "conversation_update",
            "conversation_id": conv_id,
            "conversation_name": conv_name,
            "last_message": content[:100],
            "last_message_at": msg.created_at.isoformat(),
            "sender_username": sender.username if sender else "unknown"
        }, exclude_user=user_id)

    except Exception as e:
        logger.error(f"[WS] Error handling message: {e}")
        await websocket.send_json({"type": "error", "message": "Failed to send message"})
    finally:
        db.close()


# Helper function to broadcast from REST endpoints (e.g., when sending via HTTP API)
async def broadcast_message_from_rest(conversation_id: str, message_data: dict, sender_id: str):
    """Called from messaging_routes to broadcast messages sent via REST API."""
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "new_message",
        "conversation_id": conversation_id,
        "message": message_data
    })
