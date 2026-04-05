"""Web Push notification routes."""
import os
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db, User, PushSubscription, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/push", tags=["push"])

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL = os.environ.get("VAPID_EMAIL", "mailto:soporte@conniku.com")


class SubscriptionData(BaseModel):
    endpoint: str
    keys: dict  # {p256dh: ..., auth: ...}
    device_name: Optional[str] = ""


@router.get("/vapid-key")
def get_vapid_key():
    """Return the public VAPID key for the frontend to subscribe."""
    return {"publicKey": VAPID_PUBLIC_KEY}


@router.post("/subscribe")
def subscribe(
    data: SubscriptionData,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a push subscription for the user."""
    # Check if this endpoint already exists
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == user.id,
        PushSubscription.endpoint == data.endpoint,
    ).first()

    if existing:
        existing.p256dh = data.keys.get("p256dh", "")
        existing.auth = data.keys.get("auth", "")
        existing.device_name = data.device_name or existing.device_name
        existing.updated_at = datetime.utcnow()
    else:
        sub = PushSubscription(
            id=gen_id(),
            user_id=user.id,
            endpoint=data.endpoint,
            p256dh=data.keys.get("p256dh", ""),
            auth=data.keys.get("auth", ""),
            device_name=data.device_name or "Dispositivo",
        )
        db.add(sub)

    db.commit()
    return {"status": "subscribed"}


@router.delete("/unsubscribe")
def unsubscribe(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a push subscription."""
    endpoint = data.get("endpoint", "")
    sub = db.query(PushSubscription).filter(
        PushSubscription.user_id == user.id,
        PushSubscription.endpoint == endpoint,
    ).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"status": "unsubscribed"}


def send_push_to_user(user_id: str, title: str, body: str, url: str = "/", db: Session = None):
    """Send push notification to all subscriptions of a user."""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        return  # Push not configured

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        print("[Push] pywebpush not installed")
        return

    from database import SessionLocal
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        subs = db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id
        ).all()

        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "icon": "/icon-192.png",
            "badge": "/icon-72.png",
            "timestamp": datetime.utcnow().isoformat(),
        })

        for sub in subs:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                    },
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_EMAIL},
                )
            except Exception as e:
                # Remove invalid subscriptions
                if "410" in str(e) or "404" in str(e):
                    db.delete(sub)
                    db.commit()
                print(f"[Push] Error sending to {sub.device_name}: {e}")
    finally:
        if close_db:
            db.close()
