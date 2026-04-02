"""Referral program for user growth."""
import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/referrals", tags=["referrals"])


def generate_referral_code(username: str) -> str:
    prefix = (username or "conn")[:4].upper()
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}{suffix}"


@router.get("/my-code")
def get_my_code(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.referral_code:
        user.referral_code = generate_referral_code(user.username)
        db.commit()

    return {
        "code": user.referral_code,
        "referralLink": f"https://conniku.com/register?ref={user.referral_code}",
        "totalReferred": user.referral_count or 0,
    }


@router.get("/leaderboard")
def referral_leaderboard(db: Session = Depends(get_db)):
    top = db.query(User).filter(User.referral_count > 0).order_by(
        desc(User.referral_count)
    ).limit(10).all()
    return [{
        "username": u.username, "firstName": u.first_name,
        "avatar": u.avatar, "count": u.referral_count or 0,
    } for u in top]
