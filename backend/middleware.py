"""
Auth middleware: JWT token handling and user dependency injection.
"""
import os
import json
from datetime import datetime, timedelta
from pathlib import Path

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from database import get_db, User, DATA_DIR

# JWT config — prefer env var for production, fallback to config file
CONFIG_FILE = DATA_DIR / "config.json"
SECRET_KEY = os.environ.get("JWT_SECRET", "conniku-secret-key-change-in-production")

if not os.environ.get("JWT_SECRET") and CONFIG_FILE.exists():
    try:
        config = json.loads(CONFIG_FILE.read_text())
        SECRET_KEY = config.get("jwt_secret", SECRET_KEY)
    except:
        pass

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
