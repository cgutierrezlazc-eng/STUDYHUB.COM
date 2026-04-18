"""Study Rooms — virtual study sessions with Pomodoro timer."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, User, StudyRoom, StudyRoomParticipant, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/study-rooms", tags=["study-rooms"])

def user_brief(u):
    if not u: return None
    return {"id": u.id, "username": u.username, "firstName": u.first_name,
            "lastName": u.last_name, "avatar": u.avatar}

@router.post("")
def create_room(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Nombre requerido")

    room_id = gen_id()
    # Generate a Jitsi-compatible room name
    jitsi_room = f"conniku-{room_id}"
    meeting_url = data.get("meeting_url") or f"https://meet.jit.si/{jitsi_room}"

    room = StudyRoom(
        id=room_id, name=name, description=data.get("description", ""),
        host_id=user.id, room_type=data.get("room_type", "pomodoro"),
        max_participants=data.get("max_participants", 10),
        pomodoro_work_min=data.get("pomodoro_work_min", 25),
        pomodoro_break_min=data.get("pomodoro_break_min", 5),
        subject=data.get("subject", ""),
        meeting_url=meeting_url, current_participants=1,
    )
    db.add(room)

    participant = StudyRoomParticipant(id=gen_id(), room_id=room.id, user_id=user.id)
    db.add(participant)

    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()

    return {
        "id": room.id, "name": room.name, "description": room.description,
        "roomType": room.room_type, "meetingUrl": room.meeting_url,
        "maxParticipants": room.max_participants, "currentParticipants": 1,
        "pomodoroWorkMin": room.pomodoro_work_min, "pomodoroBreakMin": room.pomodoro_break_min,
        "subject": room.subject, "host": user_brief(user),
    }

@router.get("")
def list_rooms(db: Session = Depends(get_db)):
    rooms = db.query(StudyRoom).filter(StudyRoom.is_active == True).order_by(desc(StudyRoom.created_at)).limit(30).all()
    hosts = {u.id: u for u in db.query(User).filter(User.id.in_([r.host_id for r in rooms])).all()} if rooms else {}
    return [{
        "id": r.id, "name": r.name, "description": r.description or "",
        "roomType": r.room_type, "meetingUrl": r.meeting_url,
        "maxParticipants": r.max_participants, "currentParticipants": r.current_participants or 0,
        "pomodoroWorkMin": r.pomodoro_work_min, "pomodoroBreakMin": r.pomodoro_break_min,
        "subject": r.subject or "", "host": user_brief(hosts.get(r.host_id)),
        "createdAt": r.created_at.isoformat() if r.created_at else "",
    } for r in rooms]

@router.post("/{room_id}/join")
def join_room(room_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(StudyRoom).filter(StudyRoom.id == room_id, StudyRoom.is_active == True).first()
    if not room:
        raise HTTPException(404, "Sala no encontrada")
    if (room.current_participants or 0) >= room.max_participants:
        raise HTTPException(400, "Sala llena")
    existing = db.query(StudyRoomParticipant).filter(
        StudyRoomParticipant.room_id == room_id, StudyRoomParticipant.user_id == user.id
    ).first()
    if not existing:
        p = StudyRoomParticipant(id=gen_id(), room_id=room_id, user_id=user.id)
        db.add(p)
        room.current_participants = (room.current_participants or 0) + 1
    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()
    return {"meetingUrl": room.meeting_url, "currentParticipants": room.current_participants}

@router.post("/{room_id}/leave")
def leave_room(room_id: str, data: dict = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(StudyRoom).filter(StudyRoom.id == room_id).first()
    p = db.query(StudyRoomParticipant).filter(
        StudyRoomParticipant.room_id == room_id, StudyRoomParticipant.user_id == user.id
    ).first()
    if p:
        p.left_at = datetime.utcnow()
        study_min = data.get("study_minutes", 0)
        if study_min > 0:
            p.study_minutes = study_min
            from database import StudySession
            session = StudySession(id=gen_id(), user_id=user.id, duration_seconds=study_min * 60, activity_type="study_room")
            db.add(session)
    if room:
        room.current_participants = max(0, (room.current_participants or 1) - 1)
        if room.current_participants == 0:
            room.is_active = False
    db.commit()
    return {"status": "left"}

@router.delete("/{room_id}")
def close_room(room_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(StudyRoom).filter(StudyRoom.id == room_id, StudyRoom.host_id == user.id).first()
    if not room:
        raise HTTPException(403, "Sin permiso")
    room.is_active = False
    db.commit()
    return {"status": "closed"}
