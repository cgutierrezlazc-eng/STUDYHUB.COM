"""
WebSocket manager for real-time messaging in Conniku.
Handles connection management, room subscriptions, and message broadcasting.
"""
import json
import logging
from typing import Dict, Set, Optional
from datetime import datetime

from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

SECRET_KEY = None  # Set from server.py on startup


def _get_secret():
    global SECRET_KEY
    if not SECRET_KEY:
        import os
        SECRET_KEY = os.environ.get("JWT_SECRET", "")
        if not SECRET_KEY:
            raise RuntimeError(
                "JWT_SECRET is required. "
                "Set the JWT_SECRET environment variable before starting the server."
            )
    return SECRET_KEY


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""

    def __init__(self):
        # user_id -> set of WebSocket connections (supports multiple tabs/devices)
        self.active_connections: dict[str, set[WebSocket]] = {}
        # conversation_id -> set of user_ids currently subscribed
        self.conversation_subscribers: dict[str, set[str]] = {}
        # websocket -> user_id reverse lookup
        self.ws_to_user: dict[WebSocket, str] = {}

    async def authenticate(self, websocket: WebSocket, token: str) -> Optional[str]:
        """Validate JWT token and return user_id."""
        try:
            payload = jwt.decode(token, _get_secret(), algorithms=["HS256"])
            # Solo aceptar access tokens (no refresh tokens de 30 días)
            if payload.get("type") != "access":
                logger.warning("[WS] Rejected non-access token type")
                return None
            user_id = payload.get("sub") or payload.get("user_id")
            if not user_id:
                return None
            return user_id
        except JWTError as e:
            logger.warning(f"[WS] JWT auth failed: {e}")
            return None

    async def connect(self, websocket: WebSocket, user_id: str):
        """Register a new WebSocket connection for a user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.ws_to_user[websocket] = user_id
        logger.info(f"[WS] User {user_id} connected. Total connections: {self._total_connections()}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        user_id = self.ws_to_user.pop(websocket, None)
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # Clean up conversation subscriptions
                for conv_id in list(self.conversation_subscribers.keys()):
                    self.conversation_subscribers[conv_id].discard(user_id)
                    if not self.conversation_subscribers[conv_id]:
                        del self.conversation_subscribers[conv_id]
        logger.info(f"[WS] User {user_id} disconnected. Total connections: {self._total_connections()}")

    def subscribe_conversation(self, user_id: str, conversation_id: str):
        """Subscribe a user to receive real-time updates for a conversation."""
        if conversation_id not in self.conversation_subscribers:
            self.conversation_subscribers[conversation_id] = set()
        self.conversation_subscribers[conversation_id].add(user_id)

    def unsubscribe_conversation(self, user_id: str, conversation_id: str):
        """Unsubscribe a user from a conversation's real-time updates."""
        if conversation_id in self.conversation_subscribers:
            self.conversation_subscribers[conversation_id].discard(user_id)

    async def send_to_user(self, user_id: str, data: dict):
        """Send a message to all connections of a specific user."""
        connections = self.active_connections.get(user_id, set())
        dead = []
        for ws in connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_to_conversation(self, conversation_id: str, data: dict, exclude_user: str = None):
        """Broadcast a message to all users subscribed to a conversation."""
        subscribers = self.conversation_subscribers.get(conversation_id, set())
        for user_id in subscribers:
            if exclude_user and user_id == exclude_user:
                continue
            await self.send_to_user(user_id, data)

    async def notify_conversation_participants(self, conversation_id: str, participant_ids: list, data: dict, exclude_user: str = None):
        """Notify all online participants of a conversation, even if not currently subscribed."""
        for user_id in participant_ids:
            if exclude_user and user_id == exclude_user:
                continue
            if user_id in self.active_connections:
                await self.send_to_user(user_id, data)

    def is_user_online(self, user_id: str) -> bool:
        """Check if a user has any active WebSocket connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_users(self) -> list:
        """Return list of all currently connected user IDs."""
        return list(self.active_connections.keys())

    def _total_connections(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())


# Global singleton
manager = ConnectionManager()
