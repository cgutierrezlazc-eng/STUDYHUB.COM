"""
WebSocket relay para colaboración en tiempo real en Workspaces v2.

Endpoint: /workspaces/ws/{doc_id}?token=JWT_ACCESS

Patrón adaptado del V1 collab_ws.py (prohibido modificar).
Diferencias respecto al V1:
- Namespace /workspaces (en lugar de /ws/doc)
- Acceso basado en WorkspaceDocument + WorkspaceMember (en lugar de CollabDocument)
- Mensajes de chat multiplexados: persiste en workspace_messages antes de broadcast.
- Snapshot Yjs pass-through: al conectar, carga content_yjs y lo envía como
  primer mensaje binario (base64 opaco, sin decodificar — decisión §1.2.1 #1).

Protocolo de mensajes multiplexados (text/JSON):
  - {"type": "chat.message", "data": {"content": "..."}}
    → persiste en BD → broadcast a todos incluyendo emisor.
  - {"type": "presence", ...}
    → relay as-is a todos los demás.
  - Bytes: relay binario directo (Yjs sync + awareness, CRDT en cliente).

Close codes:
  - 4001: token missing o inválido.
  - 4003: access denied (no es miembro del workspace).
  - 4004: workspace not found.
  - 4010: token expired (distinto de inválido — cliente debe refrescar).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Dict, Set

from database import (
    SessionLocal,
    User,
    WorkspaceDocument,
    WorkspaceMember,
    WorkspaceMessage,
    gen_id,
    get_db,
)
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import ExpiredSignatureError, JWTError, jwt
from middleware import ALGORITHM as JWT_ALGORITHM
from middleware import SECRET_KEY as JWT_SECRET

logger = logging.getLogger("conniku.workspaces_ws")

router = APIRouter(tags=["workspaces-ws"])

# Límites de validación de payloads WS (asimétricos con REST por diseño de canal)
MAX_CHAT_CONTENT_CHARS = 4000  # paridad con Pydantic REST
MAX_BINARY_RELAY_BYTES = 1_048_576  # 1 MiB — tope para update Yjs / awareness


def _authenticate_token(token: str) -> tuple[str | None, int]:
    """Decode JWT localmente para distinguir expirado (4010) vs inválido (4001).

    Retorna (user_id, close_code). user_id es None si falla.
    close_code es 0 si todo OK, 4010 si expirado, 4001 si inválido u otro error.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None, 4001
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            return None, 4001
        return user_id, 0
    except ExpiredSignatureError:
        return None, 4010
    except JWTError:
        return None, 4001


class WorkspaceRoom:
    """Trackea los clientes WebSocket conectados a un mismo workspace document.

    Equivalente a DocRoom del V1, adaptado para el namespace de Workspaces.
    """

    __slots__ = ("doc_id", "clients", "user_info")

    def __init__(self, doc_id: str) -> None:
        self.doc_id = doc_id
        self.clients: set[WebSocket] = set()
        self.user_info: dict[WebSocket, dict] = {}

    async def broadcast_bytes(self, data: bytes, exclude: WebSocket | None = None) -> None:
        """Relay de datos binarios (updates Yjs) a todos menos el excluido."""
        dead: list[WebSocket] = []
        for ws in self.clients:
            if ws is exclude:
                continue
            try:
                await ws.send_bytes(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove(ws)

    async def broadcast_json(self, data: dict, exclude: WebSocket | None = None) -> None:
        """Relay de mensaje JSON a todos los clientes menos el excluido."""
        dead: list[WebSocket] = []
        for ws in self.clients:
            if ws is exclude:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove(ws)

    def add(self, ws: WebSocket, user_info: dict) -> None:
        self.clients.add(ws)
        self.user_info[ws] = user_info

    def remove(self, ws: WebSocket) -> None:
        self.clients.discard(ws)
        self.user_info.pop(ws, None)

    def get_users(self) -> list[dict]:
        return list(self.user_info.values())

    def is_empty(self) -> bool:
        return len(self.clients) == 0


# Estado global de salas — limpiado en fixtures de tests (riesgo 5.11).
_rooms: dict[str, WorkspaceRoom] = {}


def _get_room(doc_id: str) -> WorkspaceRoom:
    if doc_id not in _rooms:
        _rooms[doc_id] = WorkspaceRoom(doc_id)
    return _rooms[doc_id]


def _cleanup_room(doc_id: str) -> None:
    room = _rooms.get(doc_id)
    if room and room.is_empty():
        del _rooms[doc_id]


@router.websocket("/workspaces/ws/{doc_id}")
async def workspace_websocket(
    websocket: WebSocket,
    doc_id: str,
    token: str = Query(default=None),
) -> None:
    """WebSocket relay para colaboración Yjs + chat grupal en Workspaces.

    Acepta el handshake antes de cualquier close() (requerido por Starlette).
    """
    # Starlette requiere accept() antes de close()
    await websocket.accept()

    # 1. Autenticación — token en query string (decisión D7: patrón V1)
    # Decodificación local para distinguir 4010 (expirado) vs 4001 (inválido).
    if not token:
        await websocket.close(code=4001, reason="Token requerido")
        return

    user_id, err_code = _authenticate_token(token)
    if not user_id:
        await websocket.close(code=err_code, reason="Autenticación fallida")
        return

    # 2. Verificar acceso al workspace document
    db = SessionLocal()
    try:
        doc = db.query(WorkspaceDocument).filter(WorkspaceDocument.id == doc_id).first()
        if not doc:
            await websocket.close(code=4004, reason="Workspace no encontrado")
            return

        # Owner siempre tiene acceso; miembro también
        has_access = doc.owner_id == user_id
        if not has_access:
            member = (
                db.query(WorkspaceMember)
                .filter(
                    WorkspaceMember.workspace_id == doc_id,
                    WorkspaceMember.user_id == user_id,
                )
                .first()
            )
            has_access = member is not None

        if not has_access:
            await websocket.close(code=4003, reason="Acceso denegado")
            return

        user = db.query(User).filter(User.id == user_id).first()
        user_name = f"{user.first_name} {user.last_name}".strip() if user and user.first_name else "Anónimo"
        user_avatar = user.avatar if user else None

        # Snapshot Yjs pass-through (decisión §1.2.1 #1):
        # Si hay contenido Yjs previo, se carga como string base64 opaco.
        snapshot_b64: str | None = doc.content_yjs
    finally:
        db.close()

    room = _get_room(doc_id)
    user_info = {
        "userId": user_id,
        "name": user_name,
        "avatar": user_avatar,
    }
    room.add(websocket, user_info)

    logger.info("[WorkspaceWS] User %s joined doc %s. Connected: %d", user_id, doc_id, len(room.clients))

    # Notificar presencia a todos (incluido el recién llegado)
    await room.broadcast_json({"type": "presence", "users": room.get_users()})

    # Enviar snapshot Yjs si existe (pass-through base64 opaco)
    if snapshot_b64:
        try:
            import base64

            snapshot_bytes = base64.b64decode(snapshot_b64)
            await websocket.send_bytes(snapshot_bytes)
        except Exception as exc:
            logger.warning("[WorkspaceWS] No se pudo enviar snapshot para doc %s: %s", doc_id, exc)

    try:
        while True:
            message = await websocket.receive()

            if message.get("bytes"):
                # Bytes: update Yjs o awareness binario — relay a otros sin persistir
                raw_bytes = message["bytes"]
                if len(raw_bytes) > MAX_BINARY_RELAY_BYTES:
                    logger.warning(
                        "[WorkspaceWS] Binario de %d bytes excede tope (%d) — descartado; user %s doc %s",
                        len(raw_bytes),
                        MAX_BINARY_RELAY_BYTES,
                        user_id,
                        doc_id,
                    )
                    continue
                await room.broadcast_bytes(raw_bytes, exclude=websocket)

            elif message.get("text"):
                # Text JSON: puede ser chat.message, presence u otros
                try:
                    payload = json.loads(message["text"])
                except (json.JSONDecodeError, ValueError):
                    logger.debug("[WorkspaceWS] JSON inválido de user %s: %s", user_id, message["text"][:100])
                    continue

                msg_type = payload.get("type", "")

                if msg_type == "chat.message":
                    # Persistir en BD antes de broadcast (decisión D4)
                    content = (payload.get("data") or {}).get("content", "").strip()
                    if not content:
                        continue
                    if len(content) > MAX_CHAT_CONTENT_CHARS:
                        logger.warning(
                            "[WorkspaceWS] Mensaje de %d chars excede tope (%d) — descartado; user %s doc %s",
                            len(content),
                            MAX_CHAT_CONTENT_CHARS,
                            user_id,
                            doc_id,
                        )
                        continue

                    db = SessionLocal()
                    try:
                        chat_msg = WorkspaceMessage(
                            workspace_id=doc_id,
                            user_id=user_id,
                            content=content,
                            created_at=datetime.utcnow(),
                        )
                        db.add(chat_msg)
                        db.commit()
                        db.refresh(chat_msg)
                        server_id = chat_msg.id
                    except Exception as exc:
                        logger.error("[WorkspaceWS] Error persistiendo chat: %s", exc)
                        db.rollback()
                        continue
                    finally:
                        db.close()

                    # Broadcast a TODOS los clientes (incluyendo emisor para ACK)
                    await room.broadcast_json(
                        {
                            "type": "chat.message",
                            "data": {
                                "serverId": server_id,
                                "workspaceId": doc_id,
                                "userId": user_id,
                                "content": content,
                                "createdAt": datetime.utcnow().isoformat(),
                            },
                        }
                    )

                elif msg_type == "presence":
                    # Relay de estado de presencia a los demás
                    await room.broadcast_json(payload, exclude=websocket)

                else:
                    # Tipo desconocido: relay genérico a los demás
                    await room.broadcast_json(payload, exclude=websocket)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error("[WorkspaceWS] Error inesperado para user %s en doc %s: %s", user_id, doc_id, exc)
    finally:
        room.remove(websocket)
        _cleanup_room(doc_id)

        logger.info(
            "[WorkspaceWS] User %s salió de doc %s. Quedan: %d",
            user_id,
            doc_id,
            len(room.clients) if doc_id in _rooms else 0,
        )

        # Notificar presencia actualizada a los clientes restantes
        if doc_id in _rooms:
            await _rooms[doc_id].broadcast_json(
                {
                    "type": "presence",
                    "users": _rooms[doc_id].get_users(),
                }
            )
