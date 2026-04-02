"""In-app notification system."""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, InAppNotification, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/notifications/in-app", tags=["notifications"])


def user_brief(u):
    if not u: return None
    return {"id": u.id, "username": u.username, "firstName": u.first_name, "lastName": u.last_name, "avatar": u.avatar}


def create_notification(db: Session, user_id: str, type: str, title: str, body: str = "", link: str = "", actor_id: str = None, reference_id: str = None):
    """Helper to create a notification from any route."""
    if actor_id == user_id:
        return  # Don't notify yourself
    notif = InAppNotification(
        id=gen_id(), user_id=user_id, type=type, title=title,
        body=body, link=link, actor_id=actor_id, reference_id=reference_id
    )
    db.add(notif)


@router.get("")
def get_notifications(page: int = 1, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(InAppNotification).filter(InAppNotification.user_id == user.id)
    total = q.count()
    notifs = q.order_by(desc(InAppNotification.created_at)).offset((page - 1) * 20).limit(20).all()

    # Fetch actors
    actor_ids = [n.actor_id for n in notifs if n.actor_id]
    actors = {}
    if actor_ids:
        from database import User as U
        for u in db.query(U).filter(U.id.in_(actor_ids)).all():
            actors[u.id] = user_brief(u)

    return {
        "total": total,
        "notifications": [{
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body or "",
            "link": n.link or "",
            "actor": actors.get(n.actor_id),
            "referenceId": n.reference_id,
            "isRead": n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else "",
        } for n in notifs],
    }


@router.get("/unread-count")
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(func.count(InAppNotification.id)).filter(
        InAppNotification.user_id == user.id,
        InAppNotification.is_read == False
    ).scalar() or 0
    return {"count": count}


@router.post("/{notif_id}/read")
def mark_read(notif_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(InAppNotification).filter(
        InAppNotification.id == notif_id, InAppNotification.user_id == user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}


@router.post("/read-all")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(InAppNotification).filter(
        InAppNotification.user_id == user.id, InAppNotification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"status": "ok"}


@router.delete("/{notif_id}")
def delete_notification(notif_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(InAppNotification).filter(
        InAppNotification.id == notif_id, InAppNotification.user_id == user.id
    ).delete(synchronize_session=False)
    db.commit()
    return {"status": "deleted"}
