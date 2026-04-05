"""
Gamification system: XP, levels, smart streaks, leagues, badges, study time tracking.
"""
import json
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db, User, WallPost, Friendship, Message, StudySession, LeagueMembership, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/gamification", tags=["gamification"])

# ─── Badge definitions ──────────────────────────────────────────

BADGE_INFO = {
    "first_post": {"emoji": "\ud83d\udcdd", "name": "Primera Publicaci\u00f3n", "description": "Publicaste en un muro por primera vez"},
    "social_butterfly": {"emoji": "\ud83e\udd8b", "name": "Mariposa Social", "description": "Tienes 5 o m\u00e1s amigos"},
    "studious": {"emoji": "\ud83d\udcda", "name": "Estudioso", "description": "Enviaste 5+ mensajes en chats de estudio"},
    "quiz_master": {"emoji": "\ud83e\udde0", "name": "Maestro del Quiz", "description": "Completaste 10 quizzes"},
    "chatterbox": {"emoji": "\ud83d\udcac", "name": "Parlanchin", "description": "Enviaste 50+ mensajes"},
    "streak_3": {"emoji": "\ud83d\udd25", "name": "En Racha", "description": "3 d\u00edas consecutivos de estudio"},
    "streak_7": {"emoji": "\u26a1", "name": "Semana Perfecta", "description": "7 d\u00edas consecutivos de estudio"},
    "streak_30": {"emoji": "\ud83c\udfc6", "name": "Mes Imparable", "description": "30 d\u00edas consecutivos de estudio"},
    "streak_100": {"emoji": "\ud83d\udc8e", "name": "Centenario", "description": "100 d\u00edas consecutivos de estudio"},
    "time_1h": {"emoji": "\u23f0", "name": "Primera Hora", "description": "Acumulaste 1 hora de estudio"},
    "time_10h": {"emoji": "\ud83d\udcd6", "name": "Dedicado", "description": "Acumulaste 10 horas de estudio"},
    "time_50h": {"emoji": "\ud83c\udf93", "name": "Erudito", "description": "Acumulaste 50 horas de estudio"},
    "helper": {"emoji": "\ud83e\udd1d", "name": "Buen Compa\u00f1ero", "description": "Compartiste 5+ documentos"},
    "league_gold": {"emoji": "\ud83e\udd47", "name": "Liga de Oro", "description": "Alcanzaste la Liga de Oro"},
    "league_diamond": {"emoji": "\ud83d\udca0", "name": "Liga Diamante", "description": "Alcanzaste la Liga Diamante"},
}

LEAGUE_TIERS = ["bronce", "plata", "oro", "diamante"]
LEAGUE_NAMES = {"bronce": "Bronce", "plata": "Plata", "oro": "Oro", "diamante": "Diamante"}
LEAGUE_EMOJIS = {"bronce": "\ud83e\udd49", "plata": "\ud83e\udd48", "oro": "\ud83e\udd47", "diamante": "\ud83d\udc8e"}

def _create_auto_milestone(db: Session, user_id: str, milestone_type: str, content: str):
    """Create an automatic milestone wall post for the user."""
    try:
        post = WallPost(
            id=gen_id(),
            wall_owner_id=user_id,
            author_id=user_id,
            content=content,
            visibility="friends",
            is_milestone=True,
            milestone_type=milestone_type,
        )
        db.add(post)
    except Exception as e:
        import logging
        logging.getLogger("conniku.gamification").warning(f"Failed to create milestone: {e}")


XP_REWARDS = {
    "chat_message": 5,
    "quiz_complete": 25,
    "guide_generated": 15,
    "flashcard_session": 10,
    "document_upload": 10,
    "document_shared": 20,
    "wall_post": 5,
    "friend_added": 10,
    "streak_maintained": 15,
    "study_session_30min": 20,
}


def award_xp(user: User, amount: int, db: Session) :
    """Add XP, update level, and track weekly league XP.
    Returns milestone dict if user leveled up, else None."""
    old_level = user.level or 1
    user.xp = (user.xp or 0) + amount
    user.level = (user.xp // 100) + 1
    new_level = user.level

    # Update weekly league XP
    today = date.today()
    week_start = (today - timedelta(days=today.weekday())).isoformat()
    membership = db.query(LeagueMembership).filter(
        LeagueMembership.user_id == user.id,
        LeagueMembership.week_start == week_start
    ).first()
    if membership:
        membership.weekly_xp = (membership.weekly_xp or 0) + amount
    else:
        membership = LeagueMembership(
            id=gen_id(), user_id=user.id,
            league_tier="bronce", weekly_xp=amount,
            week_start=week_start
        )
        db.add(membership)

    # Detect level up → auto milestone post
    if new_level > old_level:
        _create_auto_milestone(db, user.id, "level_up",
            f"Ha alcanzado el nivel {new_level}. ¡Sigue así!")
        return {"type": "level_up", "level": new_level}
    return None


def check_streak(user: User, db: Session) :
    """Smart streak: check activity, apply freeze if needed.
    Returns milestone dict if streak milestone reached."""
    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()

    if user.last_active_date == today_str:
        return None  # Already checked today

    old_streak = user.streak_days or 0

    if user.last_active_date == yesterday_str:
        # Consecutive day - increment streak
        user.streak_days = (user.streak_days or 0) + 1
        award_xp(user, XP_REWARDS["streak_maintained"], db)
    elif user.last_active_date:
        # Missed a day - try to use streak freeze
        days_gap = (date.today() - date.fromisoformat(user.last_active_date)).days
        if days_gap <= 2 and (user.streak_freeze_count or 0) > 0:
            user.streak_freeze_count = (user.streak_freeze_count or 0) - 1
            user.streak_days = (user.streak_days or 0) + 1
        else:
            user.streak_days = 1
    else:
        user.streak_days = 1

    user.last_active_date = today_str
    new_streak = user.streak_days

    # Detect streak milestones
    streak_milestones = [3, 7, 14, 30, 50, 100, 365]
    for ms in streak_milestones:
        if old_streak < ms <= new_streak:
            _create_auto_milestone(db, user.id, "streak",
                f"¡{new_streak} días consecutivos de estudio! Racha imparable.")
            return {"type": "streak", "days": new_streak}
    return None


def check_badges(user: User, db: Session) -> list[str]:
    """Check and award earned badges based on activity."""
    current = json.loads(user.badges or "[]")
    earned = set(current)

    # Post badges
    post_count = db.query(func.count(WallPost.id)).filter(WallPost.author_id == user.id).scalar() or 0
    if post_count >= 1:
        earned.add("first_post")

    # Social badges
    friend_count = db.query(func.count(Friendship.id)).filter(
        ((Friendship.requester_id == user.id) | (Friendship.addressee_id == user.id)),
        Friendship.status == "accepted"
    ).scalar() or 0
    if friend_count >= 5:
        earned.add("social_butterfly")

    # Message badges
    msg_count = db.query(func.count(Message.id)).filter(Message.sender_id == user.id).scalar() or 0
    if msg_count >= 5:
        earned.add("studious")
    if msg_count >= 50:
        earned.add("chatterbox")

    # Streak badges
    streak = user.streak_days or 0
    if streak >= 3: earned.add("streak_3")
    if streak >= 7: earned.add("streak_7")
    if streak >= 30: earned.add("streak_30")
    if streak >= 100: earned.add("streak_100")

    # Study time badges
    total_seconds = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id
    ).scalar() or 0
    total_hours = total_seconds / 3600
    if total_hours >= 1: earned.add("time_1h")
    if total_hours >= 10: earned.add("time_10h")
    if total_hours >= 50: earned.add("time_50h")

    # Shared documents badges
    from database import SharedDocument
    shared_count = db.query(func.count(SharedDocument.id)).filter(
        SharedDocument.user_id == user.id
    ).scalar() or 0
    if shared_count >= 5: earned.add("helper")

    # League badges
    best_league = db.query(LeagueMembership.league_tier).filter(
        LeagueMembership.user_id == user.id
    ).order_by(desc(LeagueMembership.created_at)).first()
    if best_league:
        tier = best_league[0]
        if tier in ("oro", "diamante"): earned.add("league_gold")
        if tier == "diamante": earned.add("league_diamond")

    new_badges = list(earned)
    newly_earned = [b for b in new_badges if b not in current]
    if set(new_badges) != set(current):
        user.badges = json.dumps(new_badges)

    # Auto-create milestone posts for newly earned badges
    for badge_id in newly_earned:
        info = BADGE_INFO.get(badge_id, {})
        if info:
            _create_auto_milestone(db, user.id, "badge",
                f"Ha obtenido la insignia {info.get('emoji', '')} {info.get('name', badge_id)}: {info.get('description', '')}")

    return new_badges, newly_earned


# ─── Study Session Tracking ────────────────────────────────────

@router.post("/study-session")
def log_study_session(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a study session (duration in seconds)."""
    duration = data.get("duration_seconds", 0)
    project_id = data.get("project_id")
    activity_type = data.get("activity_type", "study")

    if duration < 10:  # Ignore sessions shorter than 10 seconds
        return {"status": "ignored"}

    session = StudySession(
        id=gen_id(), user_id=user.id,
        project_id=project_id,
        duration_seconds=duration,
        activity_type=activity_type
    )
    db.add(session)

    # Award XP for 30+ min sessions
    if duration >= 1800:
        award_xp(user, XP_REWARDS["study_session_30min"], db)

    check_streak(user, db)
    db.commit()
    return {"status": "logged", "duration": duration}


@router.get("/study-time")
def get_study_time(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get study time stats."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    total = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id
    ).scalar() or 0

    this_week = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id,
        StudySession.created_at >= datetime.combine(week_start, datetime.min.time())
    ).scalar() or 0

    this_month = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id,
        StudySession.created_at >= datetime.combine(month_start, datetime.min.time())
    ).scalar() or 0

    today_total = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id,
        StudySession.created_at >= datetime.combine(today, datetime.min.time())
    ).scalar() or 0

    # Sessions by project
    by_project = db.query(
        StudySession.project_id,
        func.sum(StudySession.duration_seconds)
    ).filter(
        StudySession.user_id == user.id
    ).group_by(StudySession.project_id).all()

    return {
        "totalSeconds": total,
        "weekSeconds": this_week,
        "monthSeconds": this_month,
        "todaySeconds": today_total,
        "byProject": {pid: secs for pid, secs in by_project if pid},
    }


# ─── League System ─────────────────────────────────────────────

@router.get("/league")
def get_league(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current week's league standings."""
    today = date.today()
    week_start = (today - timedelta(days=today.weekday())).isoformat()

    # Get or create user's membership
    membership = db.query(LeagueMembership).filter(
        LeagueMembership.user_id == user.id,
        LeagueMembership.week_start == week_start
    ).first()

    if not membership:
        # Determine tier from last week
        last_week = (today - timedelta(days=today.weekday() + 7)).isoformat()
        prev = db.query(LeagueMembership).filter(
            LeagueMembership.user_id == user.id,
            LeagueMembership.week_start == last_week
        ).first()
        tier = prev.league_tier if prev else "bronce"
        membership = LeagueMembership(
            id=gen_id(), user_id=user.id,
            league_tier=tier, weekly_xp=0, week_start=week_start
        )
        db.add(membership)
        db.commit()

    # Get all members in same tier this week
    standings = db.query(
        LeagueMembership, User
    ).join(User, User.id == LeagueMembership.user_id).filter(
        LeagueMembership.week_start == week_start,
        LeagueMembership.league_tier == membership.league_tier
    ).order_by(desc(LeagueMembership.weekly_xp)).limit(30).all()

    leaderboard = []
    user_rank = 0
    for i, (m, u) in enumerate(standings):
        if u.id == user.id:
            user_rank = i + 1
        leaderboard.append({
            "rank": i + 1,
            "userId": u.id,
            "username": u.username,
            "firstName": u.first_name,
            "lastName": u.last_name,
            "avatar": u.avatar,
            "weeklyXp": m.weekly_xp or 0,
        })

    days_left = 6 - today.weekday()  # Days until Sunday

    return {
        "tier": membership.league_tier,
        "tierName": LEAGUE_NAMES.get(membership.league_tier, "Bronce"),
        "tierEmoji": LEAGUE_EMOJIS.get(membership.league_tier, "\ud83e\udd49"),
        "weeklyXp": membership.weekly_xp or 0,
        "userRank": user_rank,
        "daysLeft": max(days_left, 0),
        "leaderboard": leaderboard,
        "promotionZone": 3,  # Top 3 get promoted
        "relegationZone": 3,  # Bottom 3 get relegated
    }


# ─── Stats Endpoint (enhanced) ─────────────────────────────────

@router.get("/stats")
def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    streak_milestone = check_streak(user, db)
    badges_list, newly_earned = check_badges(user, db)
    db.commit()

    # Study time
    total_seconds = db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.user_id == user.id
    ).scalar() or 0

    all_badges = []
    for bid, info in BADGE_INFO.items():
        all_badges.append({
            "id": bid,
            "emoji": info["emoji"],
            "name": info["name"],
            "description": info["description"],
            "earned": bid in badges_list,
        })

    # Leaderboard
    top = db.query(User).order_by(desc(User.xp)).limit(10).all()
    leaderboard = [{
        "userId": u.id, "username": u.username,
        "firstName": u.first_name, "lastName": u.last_name,
        "avatar": u.avatar, "xp": u.xp or 0, "level": u.level or 1,
    } for u in top]

    # Collect pending milestones for frontend popup
    milestones = []
    if streak_milestone:
        milestones.append(streak_milestone)
    if newly_earned:
        for bid in newly_earned:
            info = BADGE_INFO.get(bid, {})
            milestones.append({
                "type": "badge",
                "badgeId": bid,
                "name": info.get("name", bid),
                "emoji": info.get("emoji", ""),
                "description": info.get("description", ""),
            })

    return {
        "xp": user.xp or 0,
        "level": user.level or 1,
        "streakDays": user.streak_days or 0,
        "streakFreezes": user.streak_freeze_count or 0,
        "badges": all_badges,
        "nextLevelXp": ((user.level or 1) * 100),
        "totalStudySeconds": total_seconds,
        "leaderboard": leaderboard,
        "milestones": milestones,
    }


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    top = db.query(User).order_by(desc(User.xp)).limit(20).all()
    return [{
        "userId": u.id, "username": u.username,
        "firstName": u.first_name, "lastName": u.last_name,
        "avatar": u.avatar, "xp": u.xp or 0, "level": u.level or 1,
    } for u in top]
