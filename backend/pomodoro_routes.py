"""Global Pomodoro timer tracking."""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, User, StudySession, gen_id
from middleware import get_current_user
from gamification import award_xp

router = APIRouter(prefix="/pomodoro", tags=["pomodoro"])


@router.post("/complete")
def complete_session(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    duration = data.get("duration_minutes", 25)
    project_id = data.get("subject_id")

    session = StudySession(
        id=gen_id(), user_id=user.id, project_id=project_id,
        duration_seconds=duration * 60, activity_type="pomodoro",
    )
    db.add(session)

    user.pomodoro_total_sessions = (user.pomodoro_total_sessions or 0) + 1
    user.pomodoro_total_minutes = (user.pomodoro_total_minutes or 0) + duration

    xp = 5
    award_xp(user, xp, db)

    # Update weekly study hours
    user.weekly_study_goal_hours = user.weekly_study_goal_hours or 10.0

    db.commit()
    return {
        "totalSessions": user.pomodoro_total_sessions,
        "totalMinutes": user.pomodoro_total_minutes,
        "xpEarned": xp,
    }


@router.get("/stats")
def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    today_sessions = db.query(func.count(StudySession.id)).filter(
        StudySession.user_id == user.id, StudySession.activity_type == "pomodoro",
        StudySession.created_at >= datetime.combine(today, datetime.min.time())
    ).scalar() or 0

    week_sessions = db.query(func.count(StudySession.id)).filter(
        StudySession.user_id == user.id, StudySession.activity_type == "pomodoro",
        StudySession.created_at >= datetime.combine(week_start, datetime.min.time())
    ).scalar() or 0

    week_minutes = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id,
        StudySession.created_at >= datetime.combine(week_start, datetime.min.time())
    ).scalar() or 0

    return {
        "totalSessions": user.pomodoro_total_sessions or 0,
        "totalMinutes": user.pomodoro_total_minutes or 0,
        "todaySessions": today_sessions,
        "weekSessions": week_sessions,
        "weekStudyHours": round((week_minutes / 60) / 60, 1),
        "weekGoalHours": user.weekly_study_goal_hours or 10.0,
    }
