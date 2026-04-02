"""Study events system."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, User, StudyEvent, EventRSVP, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/events", tags=["events"])

def user_brief(u):
    if not u: return None
    return {"id": u.id, "username": u.username, "firstName": u.first_name,
            "lastName": u.last_name, "avatar": u.avatar}

def event_to_dict(e, organizer=None, user_rsvp=None, attendees=None):
    return {
        "id": e.id, "title": e.title, "description": e.description or "",
        "eventType": e.event_type, "location": e.location or "",
        "meetingLink": e.meeting_link or "",
        "startTime": e.start_time.isoformat() if e.start_time else "",
        "endTime": e.end_time.isoformat() if e.end_time else "",
        "maxAttendees": e.max_attendees, "attendeeCount": e.attendee_count or 0,
        "coverImage": e.cover_image,
        "organizer": user_brief(organizer) if organizer else None,
        "userRsvp": user_rsvp,
        "attendees": attendees or [],
        "createdAt": e.created_at.isoformat() if e.created_at else "",
    }

@router.post("")
def create_event(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = data.get("title", "").strip()
    if not title:
        raise HTTPException(400, "Título requerido")
    start = data.get("start_time")
    if not start:
        raise HTTPException(400, "Fecha de inicio requerida")
    event = StudyEvent(
        id=gen_id(), title=title, description=data.get("description", ""),
        organizer_id=user.id, community_id=data.get("community_id"),
        event_type=data.get("event_type", "study_session"),
        location=data.get("location", ""), meeting_link=data.get("meeting_link", ""),
        start_time=datetime.fromisoformat(start),
        end_time=datetime.fromisoformat(data["end_time"]) if data.get("end_time") else None,
        max_attendees=data.get("max_attendees"),
        cover_image=data.get("cover_image"),
    )
    db.add(event)
    # Auto-RSVP organizer
    rsvp = EventRSVP(id=gen_id(), event_id=event.id, user_id=user.id, status="going")
    db.add(rsvp)
    event.attendee_count = 1
    from gamification import award_xp
    award_xp(user, 10, db)
    db.commit()
    return event_to_dict(event, user, "going")

@router.get("")
def list_events(my: bool = False, page: int = 1,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(StudyEvent)
    if my:
        my_event_ids = [r.event_id for r in db.query(EventRSVP.event_id).filter(EventRSVP.user_id == user.id).all()]
        q = q.filter(StudyEvent.id.in_(my_event_ids))
    else:
        q = q.filter(StudyEvent.start_time >= datetime.utcnow())

    events = q.order_by(StudyEvent.start_time).offset((page-1)*20).limit(20).all()
    org_ids = list(set(e.organizer_id for e in events))
    orgs = {u.id: u for u in db.query(User).filter(User.id.in_(org_ids)).all()} if org_ids else {}
    my_rsvps = {r.event_id: r.status for r in db.query(EventRSVP).filter(
        EventRSVP.user_id == user.id, EventRSVP.event_id.in_([e.id for e in events])
    ).all()}
    return [event_to_dict(e, orgs.get(e.organizer_id), my_rsvps.get(e.id)) for e in events]

@router.get("/{event_id}")
def get_event(event_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    e = db.query(StudyEvent).filter(StudyEvent.id == event_id).first()
    if not e:
        raise HTTPException(404, "Evento no encontrado")
    org = db.query(User).filter(User.id == e.organizer_id).first()
    rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id).first()
    attendees_q = db.query(EventRSVP, User).join(User, User.id == EventRSVP.user_id).filter(
        EventRSVP.event_id == event_id, EventRSVP.status == "going"
    ).limit(20).all()
    att = [user_brief(u) for _, u in attendees_q]
    return event_to_dict(e, org, rsvp.status if rsvp else None, att)

@router.post("/{event_id}/rsvp")
def rsvp_event(event_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    e = db.query(StudyEvent).filter(StudyEvent.id == event_id).first()
    if not e:
        raise HTTPException(404, "Evento no encontrado")
    status = data.get("status", "going")
    existing = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id).first()
    old_going = existing and existing.status == "going"
    new_going = status == "going"
    if existing:
        existing.status = status
    else:
        rsvp = EventRSVP(id=gen_id(), event_id=event_id, user_id=user.id, status=status)
        db.add(rsvp)
    # Update count
    if new_going and not old_going:
        e.attendee_count = (e.attendee_count or 0) + 1
        from gamification import award_xp
        award_xp(user, 10, db)
    elif old_going and not new_going:
        e.attendee_count = max(0, (e.attendee_count or 1) - 1)
    db.commit()
    return {"status": status, "attendeeCount": e.attendee_count}

@router.delete("/{event_id}")
def delete_event(event_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    e = db.query(StudyEvent).filter(StudyEvent.id == event_id, StudyEvent.organizer_id == user.id).first()
    if not e:
        raise HTTPException(403, "Sin permiso")
    db.query(EventRSVP).filter(EventRSVP.event_id == event_id).delete(synchronize_session=False)
    db.delete(e)
    db.commit()
    return {"status": "deleted"}
