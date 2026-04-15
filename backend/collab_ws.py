"""
WebSocket relay for Yjs collaborative document editing.

Yjs uses a binary protocol (sync + awareness). The server acts as a
relay: it forwards binary messages between all clients connected to the
same document. CRDT conflict resolution happens client-side in Yjs.

Endpoint: /ws/doc/{doc_id}?token=JWT_TOKEN
"""
import logging
from typing import Dict, Set

from database import CollabDocument, CollabDocumentMember, SessionLocal, get_db
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from websocket_manager import manager as chat_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["collab-ws"])


class DocRoom:
    """Tracks connected WebSocket clients for a single document."""
    __slots__ = ("doc_id", "clients", "user_info")

    def __init__(self, doc_id: str):
        self.doc_id = doc_id
        self.clients: set[WebSocket] = set()
        self.user_info: dict[WebSocket, dict] = {}  # ws -> {user_id, name, color}

    async def broadcast(self, data: bytes, exclude: WebSocket = None):
        dead = []
        for ws in self.clients:
            if ws is exclude:
                continue
            try:
                await ws.send_bytes(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove(ws)

    async def broadcast_json(self, data: dict, exclude: WebSocket = None):
        dead = []
        for ws in self.clients:
            if ws is exclude:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove(ws)

    def add(self, ws: WebSocket, user_info: dict):
        self.clients.add(ws)
        self.user_info[ws] = user_info

    def remove(self, ws: WebSocket):
        self.clients.discard(ws)
        self.user_info.pop(ws, None)

    def get_users(self) -> list:
        return list(self.user_info.values())

    def is_empty(self) -> bool:
        return len(self.clients) == 0


# Global document rooms
_rooms: dict[str, DocRoom] = {}

CURSOR_COLORS = [
    "#E53E3E", "#38A169", "#D69E2E", "#805AD5",
    "#DD6B20", "#319795", "#E53E84", "#2D62C8",
]


def _get_room(doc_id: str) -> DocRoom:
    if doc_id not in _rooms:
        _rooms[doc_id] = DocRoom(doc_id)
    return _rooms[doc_id]


def _cleanup_room(doc_id: str):
    room = _rooms.get(doc_id)
    if room and room.is_empty():
        del _rooms[doc_id]


@router.websocket("/ws/doc/{doc_id}")
async def doc_websocket(
    websocket: WebSocket,
    doc_id: str,
    token: str = Query(default=None),
):
    """Yjs collaboration WebSocket — binary relay + presence awareness."""

    # Starlette requiere accept() antes de close() — aceptar primero
    await websocket.accept()

    # 1. Authenticate
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    user_id = await chat_manager.authenticate(websocket, token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # 2. Check document access
    db = SessionLocal()
    try:
        doc = db.query(CollabDocument).filter(CollabDocument.id == doc_id).first()
        if not doc:
            await websocket.close(code=4004, reason="Document not found")
            return

        has_access = doc.owner_id == user_id
        if not has_access:
            member = db.query(CollabDocumentMember).filter(
                CollabDocumentMember.document_id == doc_id,
                CollabDocumentMember.user_id == user_id,
            ).first()
            has_access = member is not None

        if not has_access:
            await websocket.close(code=4003, reason="Access denied")
            return

        from database import User
        user = db.query(User).filter(User.id == user_id).first()
        user_name = f"{user.first_name} {user.last_name}" if user else "Anonimo"
        user_avatar = user.avatar if user else None
    finally:
        db.close()

    room = _get_room(doc_id)
    color_index = len(room.clients) % len(CURSOR_COLORS)
    user_info = {
        "userId": user_id,
        "name": user_name,
        "avatar": user_avatar,
        "color": CURSOR_COLORS[color_index],
    }
    room.add(websocket, user_info)

    logger.info(f"[DocWS] User {user_id} joined doc {doc_id}. Users: {len(room.clients)}")

    # Notify all clients of updated presence
    await room.broadcast_json({
        "type": "presence",
        "users": room.get_users(),
    })

    try:
        while True:
            # Yjs sends binary messages (sync protocol)
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                # Binary: Yjs sync/update — relay to all other clients
                await room.broadcast(message["bytes"], exclude=websocket)

            elif "text" in message and message["text"]:
                # Text: could be awareness or custom messages — relay as-is
                await room.broadcast_json(
                    {"type": "relay", "data": message["text"]},
                    exclude=websocket,
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[DocWS] Error for user {user_id} in doc {doc_id}: {e}")
    finally:
        room.remove(websocket)
        _cleanup_room(doc_id)

        logger.info(f"[DocWS] User {user_id} left doc {doc_id}. Users: {len(room.clients) if doc_id in _rooms else 0}")

        # Notify remaining clients
        if doc_id in _rooms:
            await _rooms[doc_id].broadcast_json({
                "type": "presence",
                "users": _rooms[doc_id].get_users(),
            })
