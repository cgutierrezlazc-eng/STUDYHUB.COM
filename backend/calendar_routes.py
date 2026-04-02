"""Calendar and task management for students."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, User, CalendarEvent, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


class EventRequest(BaseModel):
    title: str
    description: str = ""
    event_type: str = "task"  # task | exam | deadline | study_session
    due_date: str  # ISO datetime string
    project_id: Optional[str] = None
    color: str = "#4f8cff"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None
    color: Optional[str] = None


@router.get("/events")
def list_events(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(CalendarEvent).filter(
        CalendarEvent.user_id == user.id
    ).order_by(CalendarEvent.due_date).all()
    return [{
        "id": e.id,
        "title": e.title,
        "description": e.description or "",
        "eventType": e.event_type,
        "dueDate": e.due_date.isoformat() if e.due_date else "",
        "projectId": e.project_id,
        "completed": e.completed,
        "color": e.color or "#4f8cff",
    } for e in events]


@router.post("/events")
def create_event(req: EventRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = CalendarEvent(
        id=gen_id(),
        user_id=user.id,
        project_id=req.project_id,
        title=req.title,
        description=req.description,
        event_type=req.event_type,
        due_date=datetime.fromisoformat(req.due_date),
        color=req.color,
    )
    db.add(event)
    db.commit()
    return {
        "id": event.id, "title": event.title, "description": event.description,
        "eventType": event.event_type, "dueDate": event.due_date.isoformat(),
        "projectId": event.project_id, "completed": event.completed, "color": event.color,
    }


@router.put("/events/{event_id}")
def update_event(event_id: str, req: EventUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user.id).first()
    if not event:
        raise HTTPException(404, "Evento no encontrado")
    if req.title is not None: event.title = req.title
    if req.description is not None: event.description = req.description
    if req.due_date is not None: event.due_date = datetime.fromisoformat(req.due_date)
    if req.completed is not None: event.completed = req.completed
    if req.color is not None: event.color = req.color
    db.commit()
    return {
        "id": event.id, "title": event.title, "description": event.description,
        "eventType": event.event_type, "dueDate": event.due_date.isoformat(),
        "projectId": event.project_id, "completed": event.completed, "color": event.color,
    }


@router.delete("/events/{event_id}")
def delete_event(event_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user.id).first()
    if not event:
        raise HTTPException(404, "Evento no encontrado")
    db.delete(event)
    db.commit()
    return {"status": "deleted"}
