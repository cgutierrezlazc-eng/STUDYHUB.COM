"""Mood check-in and wellness tracking."""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, MoodCheckIn, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/wellness", tags=["wellness"])


@router.post("/mood")
def check_in_mood(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mood = data.get("mood", 3)
    energy = data.get("energy", 3)
    note = data.get("note", "")

    if not 1 <= mood <= 5 or not 1 <= energy <= 5:
        raise HTTPException(400, "Mood y energía deben ser entre 1 y 5")

    today = date.today()
    existing = db.query(MoodCheckIn).filter(
        MoodCheckIn.user_id == user.id,
        func.date(MoodCheckIn.created_at) == today
    ).first()
    if existing:
        existing.mood = mood
        existing.energy = energy
        existing.note = note[:200] if note else None
    else:
        checkin = MoodCheckIn(
            id=gen_id(), user_id=user.id, mood=mood,
            energy=energy, note=note[:200] if note else None,
        )
        db.add(checkin)

    from gamification import award_xp
    if not existing:
        award_xp(user, 2, db)
    db.commit()
    return {"mood": mood, "energy": energy, "recorded": True}


@router.get("/mood/history")
def mood_history(days: int = 30, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    checkins = db.query(MoodCheckIn).filter(
        MoodCheckIn.user_id == user.id, MoodCheckIn.created_at >= since
    ).order_by(MoodCheckIn.created_at).all()
    return [{
        "date": c.created_at.strftime("%Y-%m-%d") if c.created_at else "",
        "mood": c.mood, "energy": c.energy, "note": c.note or "",
    } for c in checkins]


@router.get("/mood/stats")
def mood_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    week = now - timedelta(days=7)
    month = now - timedelta(days=30)

    avg7 = db.query(func.avg(MoodCheckIn.mood)).filter(
        MoodCheckIn.user_id == user.id, MoodCheckIn.created_at >= week).scalar()
    avg30 = db.query(func.avg(MoodCheckIn.mood)).filter(
        MoodCheckIn.user_id == user.id, MoodCheckIn.created_at >= month).scalar()
    energy7 = db.query(func.avg(MoodCheckIn.energy)).filter(
        MoodCheckIn.user_id == user.id, MoodCheckIn.created_at >= week).scalar()
    total = db.query(func.count(MoodCheckIn.id)).filter(MoodCheckIn.user_id == user.id).scalar()

    today_done = db.query(MoodCheckIn).filter(
        MoodCheckIn.user_id == user.id,
        func.date(MoodCheckIn.created_at) == date.today()
    ).first() is not None

    return {
        "averageMood7d": round(avg7, 1) if avg7 else None,
        "averageMood30d": round(avg30, 1) if avg30 else None,
        "averageEnergy7d": round(energy7, 1) if energy7 else None,
        "totalCheckins": total or 0,
        "todayDone": today_done,
    }
