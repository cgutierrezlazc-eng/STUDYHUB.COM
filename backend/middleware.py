"""
Auth middleware: JWT token handling and user dependency injection.
"""
import os
import json
import secrets
import logging
from datetime import datetime, timedelta
from pathlib import Path

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from database import get_db, User, DATA_DIR

logger = logging.getLogger("conniku.auth")

# JWT config — prefer env var, then config file, then generate ephemeral key
CONFIG_FILE = DATA_DIR / "config.json"
SECRET_KEY = os.environ.get("JWT_SECRET", "")

if not SECRET_KEY and CONFIG_FILE.exists():
    try:
        config = json.loads(CONFIG_FILE.read_text())
        SECRET_KEY = config.get("jwt_secret", "")
    except Exception:
        pass

if not SECRET_KEY:
    env = os.environ.get("ENVIRONMENT", os.environ.get("RENDER", ""))
    if env:
        raise RuntimeError(
            "JWT_SECRET is required in production. "
            "Set the JWT_SECRET environment variable before starting the server."
        )
    SECRET_KEY = secrets.token_hex(32)
    logger.warning(
        "JWT_SECRET not configured. Using ephemeral key for development. "
        "All tokens will be invalidated on restart."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
REFRESH_TOKEN_EXPIRE_DAYS = 30

security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str, token_type: str = "access") -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.is_banned:
        raise HTTPException(status_code=403, detail=f"Account banned: {user.ban_reason or 'Policy violation'}")

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        user_id = decode_token(credentials.credentials)
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except:
        pass
    return None


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_owner(user: User = Depends(get_current_user)) -> User:
    if getattr(user, 'role', None) != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return user


# ─── Tier System ────────────────────────────────────────────

TIER_LIMITS = {
    "free": {
        "max_subjects": 2,
        "ai_messages_per_window": 20,
        "ai_window_hours": 6,
        "quizzes_per_week": 2,
        "guides_per_week": 1,
        "storage_bytes": 314572800,  # 300 MB
        "can_export_docx": False,
        "can_download_docs": False,
        "can_view_docs": True,
        "can_detect_ai": False,
        "can_use_videos": False,
        "can_record_class": False,
        "can_transcribe": False,
        "can_create_events": False,
        "can_post_jobs": False,
        "can_predict_exam": False,
        "can_use_socratic": False,
        "can_use_flashcards_fsrs": False,
        "can_exam_mode": False,
        "scan_per_day": 3,
        "xp_multiplier": 1.0,
    },
    "pro": {
        "max_subjects": 8,
        "ai_messages_per_window": 200,
        "ai_window_hours": 24,
        "quizzes_per_week": 105,
        "guides_per_week": 70,
        "storage_bytes": 1073741824,  # 1 GB
        "can_export_docx": False,  # View only, MAX to download
        "can_download_docs": True,
        "can_view_docs": True,
        "can_detect_ai": True,
        "can_use_videos": True,
        "can_record_class": False,  # MAX only
        "can_transcribe": False,  # MAX only
        "can_create_events": True,
        "can_post_jobs": False,
        "can_predict_exam": True,
        "can_use_socratic": True,
        "can_use_flashcards_fsrs": True,
        "can_exam_mode": False,
        "scan_per_day": 20,
        "xp_multiplier": 1.2,
    },
    "max": {
        "max_subjects": 99999,
        "ai_messages_per_window": 99999,
        "ai_window_hours": 24,
        "quizzes_per_week": 99999,
        "guides_per_week": 99999,
        "storage_bytes": 3221225472,  # 3 GB
        "can_export_docx": True,
        "can_download_docs": True,
        "can_view_docs": True,
        "can_detect_ai": True,
        "can_use_videos": True,
        "can_record_class": True,
        "can_transcribe": True,
        "can_create_events": True,
        "can_post_jobs": True,
        "can_predict_exam": True,
        "can_use_socratic": True,
        "can_use_flashcards_fsrs": True,
        "can_exam_mode": True,
        "scan_per_day": 99999,
        "xp_multiplier": 1.5,
    },
}


def get_tier(user):
    tier = getattr(user, 'subscription_tier', 'free') or 'free'
    status = getattr(user, 'subscription_status', 'trial') or 'trial'
    role = getattr(user, 'role', 'user') or 'user'
    # Owner and admin always get max tier
    if role in ("owner", "admin") or status == "owner":
        return "max"
    if tier == "max" and status == "active":
        return "max"
    if tier == "pro" and status in ("active", "trial"):
        return "pro"
    return "free"


def get_tier_limits(user):
    return TIER_LIMITS[get_tier(user)]


def require_tier(user, minimum_tier):
    tier_order = {"free": 0, "pro": 1, "max": 2}
    if tier_order.get(get_tier(user), 0) < tier_order.get(minimum_tier, 0):
        names = {"pro": "Plan Pro ($5/mes)", "max": "Plan Max ($13/mes)"}
        raise HTTPException(403, f"Esta función requiere {names.get(minimum_tier, minimum_tier)}. Actualiza tu plan.")


def check_tier_limit(user, limit_key, current_count):
    limits = get_tier_limits(user)
    limit = limits.get(limit_key, 0)
    if limit >= 99999:
        return True, limit, 99999
    return current_count < limit, limit, max(0, limit - current_count)
