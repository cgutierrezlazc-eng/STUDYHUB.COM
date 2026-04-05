"""Automatic reward system — premium time for achievements."""
import json
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import (get_db, User, QuizHistory, UserCourseProgress, MentorshipRelation,
                      CommunityPostComment, gen_id)
from middleware import get_current_user

router = APIRouter(prefix="/rewards", tags=["rewards"])


COURSE_REWARD_CYCLE_DAYS = 365  # 12-month window for course rewards


def get_course_reward_window(user_id: str, db: Session):
    """Get the current 12-month course reward window.
    Returns (courses_in_window, days_remaining, window_start).
    The window starts from the first course completed that falls within the
    current active 12-month period.
    """
    now = datetime.utcnow()
    window_start = now - timedelta(days=COURSE_REWARD_CYCLE_DAYS)

    # Get all completed courses within the last 12 months, ordered by date
    completions = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user_id,
        UserCourseProgress.completed == True,
        UserCourseProgress.completed_at != None,
        UserCourseProgress.completed_at >= window_start,
    ).order_by(UserCourseProgress.completed_at.asc()).all()

    if not completions:
        return 0, COURSE_REWARD_CYCLE_DAYS, now

    # Window starts from first completion in period
    first_completion = completions[0].completed_at
    window_end = first_completion + timedelta(days=COURSE_REWARD_CYCLE_DAYS)
    days_remaining = max(0, (window_end - now).days)

    return len(completions), days_remaining, first_completion


REWARD_RULES = [
    {"id": "birthday", "title": "🎂 Feliz Cumpleaños", "description": "1 mes MAX gratis por tu cumpleaños", "tier": "max", "days": 30},
    {"id": "perfect_quiz", "title": "🏆 Quiz Perfecto", "description": "1 mes PRO gratis por obtener 10/10", "tier": "pro", "days": 30},
    {"id": "streak_30", "title": "🔥 Racha 30 Días", "description": "1 semana PRO por 30 días consecutivos", "tier": "pro", "days": 7},
    {"id": "streak_100", "title": "🔥 Racha Centenaria", "description": "1 mes MAX por 100 días consecutivos", "tier": "max", "days": 30},
    {"id": "courses_3", "title": "📚 3 Cursos Completados", "description": "1 mes PRO gratis por completar 3 cursos", "tier": "pro", "days": 30},
    {"id": "courses_6", "title": "🎓 6 Cursos Completados", "description": "1 mes MAX gratis por completar 6 cursos", "tier": "max", "days": 30},
    {"id": "graduated", "title": "🎓 Graduado", "description": "2 meses MAX por graduarte", "tier": "max", "days": 60},
    {"id": "mentor_10", "title": "🧭 Super Mentor", "description": "1 mes MAX por completar 10 mentorías", "tier": "max", "days": 30},
    {"id": "league_top3_x4", "title": "⭐ Campeón de Liga", "description": "1 mes PRO por ser top 3 en liga 4 veces", "tier": "pro", "days": 30},
    {"id": "referrals_10", "title": "👥 Embajador", "description": "1 mes MAX por referir 10 amigos", "tier": "max", "days": 30},
    {"id": "quizzes_100", "title": "📝 Centenario de Quizzes", "description": "1 mes PRO por completar 100 quizzes", "tier": "pro", "days": 30},
    {"id": "community_helper", "title": "💬 Espíritu Colaborativo", "description": "1 mes PRO por 50+ respuestas en comunidades", "tier": "pro", "days": 30},
]


def grant_reward(user: User, reward_id: str, tier: str, days: int, db: Session, cooldown_days: int = 0) -> bool:
    """Grant premium time as reward. Returns True if newly granted.
    cooldown_days: custom cooldown to prevent re-grant (default = reward days).
    """
    cooldown = cooldown_days if cooldown_days > 0 else days
    # Check if already granted within cooldown period (prevent duplicates)
    granted = json.loads(user.mood_data or "[]") if user.mood_data else []
    for g in granted:
        if isinstance(g, dict) and g.get("reward") == reward_id:
            granted_date = g.get("date", "")
            if granted_date:
                try:
                    gd = datetime.fromisoformat(granted_date)
                    if (datetime.utcnow() - gd).days < cooldown:
                        return False  # Already granted in this cycle
                except ValueError:
                    pass

    # Apply the reward
    tier_order = {"free": 0, "pro": 1, "max": 2}
    current_tier = getattr(user, 'subscription_tier', 'free') or 'free'

    if tier_order.get(tier, 0) > tier_order.get(current_tier, 0):
        user.subscription_tier = tier
        user.subscription_status = "active"

    # Extend or set expiration
    now = datetime.utcnow()
    if user.subscription_expires_at and user.subscription_expires_at > now:
        user.subscription_expires_at = user.subscription_expires_at + timedelta(days=days)
    else:
        user.subscription_expires_at = now + timedelta(days=days)

    # Update storage
    storage_map = {"free": 314572800, "pro": 1073741824, "max": 3221225472}
    user.storage_limit_bytes = storage_map.get(tier, 314572800)

    # Log the reward
    granted = json.loads(user.mood_data or "[]") if user.mood_data else []
    granted.append({"reward": reward_id, "tier": tier, "days": days, "date": now.isoformat()})
    user.mood_data = json.dumps(granted)

    # Notify
    from notification_routes import create_notification
    reward_info = next((r for r in REWARD_RULES if r["id"] == reward_id), {})
    create_notification(db, user.id, "reward",
        f"🎁 {reward_info.get('title', 'Recompensa')}",
        body=reward_info.get("description", f"{days} días de {tier.upper()} gratis"),
        link="/subscription")

    return True


@router.post("/check")
def check_rewards(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check all reward conditions for the current user and grant applicable ones."""
    rewards_granted = []

    # 1. Birthday check
    if user.birth_date:
        try:
            bd = user.birth_date  # Format: "YYYY-MM-DD"
            today = date.today()
            bd_parts = bd.split("-")
            if len(bd_parts) == 3 and int(bd_parts[1]) == today.month and int(bd_parts[2]) == today.day:
                if grant_reward(user, "birthday", "max", 30, db):
                    rewards_granted.append("birthday")
        except (ValueError, IndexError):
            pass

    # 2. Perfect quiz (10/10)
    perfect = db.query(QuizHistory).filter(
        QuizHistory.user_id == user.id, QuizHistory.score_1_to_10 >= 9.5
    ).first()
    if perfect:
        if grant_reward(user, "perfect_quiz", "pro", 30, db):
            rewards_granted.append("perfect_quiz")

    # 3. Streak 30 days
    if (user.streak_days or 0) >= 30:
        if grant_reward(user, "streak_30", "pro", 7, db):
            rewards_granted.append("streak_30")

    # 4. Streak 100 days
    if (user.streak_days or 0) >= 100:
        if grant_reward(user, "streak_100", "max", 30, db):
            rewards_granted.append("streak_100")

    # 5. Course rewards (12-month window)
    courses_in_window, _days_left, _ws = get_course_reward_window(user.id, db)
    if courses_in_window >= 3:
        if grant_reward(user, "courses_3", "pro", 30, db, cooldown_days=COURSE_REWARD_CYCLE_DAYS):
            rewards_granted.append("courses_3")

    # 5b. 6 courses in window → MAX
    if courses_in_window >= 6:
        if grant_reward(user, "courses_6", "max", 30, db, cooldown_days=COURSE_REWARD_CYCLE_DAYS):
            rewards_granted.append("courses_6")

    # 6. Graduated
    if user.is_graduated:
        if grant_reward(user, "graduated", "max", 60, db):
            rewards_granted.append("graduated")

    # 7. 10 mentorships completed (as mentor)
    mentor_count = db.query(func.count(MentorshipRelation.id)).filter(
        MentorshipRelation.mentor_id == user.id, MentorshipRelation.status == "completed"
    ).scalar() or 0
    if mentor_count >= 10:
        if grant_reward(user, "mentor_10", "max", 30, db):
            rewards_granted.append("mentor_10")

    # 8. Referrals 10
    if (user.referral_count or 0) >= 10:
        if grant_reward(user, "referrals_10", "max", 30, db):
            rewards_granted.append("referrals_10")

    # 9. 100 quizzes completed
    quiz_count = db.query(func.count(QuizHistory.id)).filter(
        QuizHistory.user_id == user.id
    ).scalar() or 0
    if quiz_count >= 100:
        if grant_reward(user, "quizzes_100", "pro", 30, db):
            rewards_granted.append("quizzes_100")

    # 10. Community helper (50+ comments)
    comment_count = db.query(func.count(CommunityPostComment.id)).filter(
        CommunityPostComment.author_id == user.id
    ).scalar() or 0
    if comment_count >= 50:
        if grant_reward(user, "community_helper", "pro", 30, db):
            rewards_granted.append("community_helper")

    db.commit()

    return {
        "rewardsGranted": rewards_granted,
        "totalGranted": len(rewards_granted),
        "currentTier": user.subscription_tier,
        "expiresAt": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
    }


@router.get("/available")
def get_available_rewards(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all possible rewards with current progress."""
    quiz_count = db.query(func.count(QuizHistory.id)).filter(QuizHistory.user_id == user.id).scalar() or 0
    mentor_count = db.query(func.count(MentorshipRelation.id)).filter(
        MentorshipRelation.mentor_id == user.id, MentorshipRelation.status == "completed").scalar() or 0
    comment_count = db.query(func.count(CommunityPostComment.id)).filter(
        CommunityPostComment.author_id == user.id).scalar() or 0
    perfect_quiz = db.query(QuizHistory).filter(
        QuizHistory.user_id == user.id, QuizHistory.score_1_to_10 >= 9.5).first()

    # Course rewards use 12-month window
    courses_in_window, course_days_left, _ = get_course_reward_window(user.id, db)

    # Check granted
    granted_ids = set()
    if user.mood_data:
        for g in json.loads(user.mood_data or "[]"):
            if isinstance(g, dict):
                granted_ids.add(g.get("reward"))

    progress = {
        "birthday": {"current": "Cumpleaños" if user.birth_date else "Sin fecha", "target": "Tu cumpleaños", "met": False},
        "perfect_quiz": {"current": "Mejor: " + str(db.query(func.max(QuizHistory.score_1_to_10)).filter(QuizHistory.user_id == user.id).scalar() or 0) + "/10", "target": "10/10", "met": perfect_quiz is not None},
        "streak_30": {"current": f"{user.streak_days or 0} días", "target": "30 días", "met": (user.streak_days or 0) >= 30},
        "streak_100": {"current": f"{user.streak_days or 0} días", "target": "100 días", "met": (user.streak_days or 0) >= 100},
        "courses_3": {"current": f"{courses_in_window}/3 cursos ({course_days_left} días restantes)", "target": "3 cursos en 12 meses", "met": courses_in_window >= 3},
        "courses_6": {"current": f"{courses_in_window}/6 cursos ({course_days_left} días restantes)", "target": "6 cursos en 12 meses", "met": courses_in_window >= 6},
        "graduated": {"current": "Graduado" if user.is_graduated else "Estudiando", "target": "Graduarse", "met": user.is_graduated},
        "mentor_10": {"current": f"{mentor_count} mentorías", "target": "10 mentorías", "met": mentor_count >= 10},
        "referrals_10": {"current": f"{user.referral_count or 0} referidos", "target": "10 referidos", "met": (user.referral_count or 0) >= 10},
        "quizzes_100": {"current": f"{quiz_count} quizzes", "target": "100 quizzes", "met": quiz_count >= 100},
        "community_helper": {"current": f"{comment_count} respuestas", "target": "50 respuestas", "met": comment_count >= 50},
    }

    return [{
        **rule,
        "granted": rule["id"] in granted_ids,
        "progress": progress.get(rule["id"], {}),
    } for rule in REWARD_RULES]
