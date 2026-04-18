"""Referral program with fraud detection."""
import json
import random
import string
import hashlib
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, gen_id
from middleware import get_current_user
from security_middleware import get_client_ip, is_disposable_email

router = APIRouter(prefix="/referrals", tags=["referrals"])

# ─── Anti-fraud tracking ────────────────────────────────────
_referral_ips: dict[str, list[str]] = defaultdict(list)  # referrer_id -> [IPs of referred]
_ip_registrations: dict[str, list[str]] = defaultdict(list)  # IP -> [user_ids registered]

FRAUD_SIGNALS = {
    "same_ip": 3.0,           # Same IP as referrer
    "ip_burst": 2.5,          # Multiple registrations from same IP
    "disposable_email": 4.0,  # Disposable email domain
    "no_activity_7d": 2.0,    # No activity after 7 days
    "similar_name": 1.5,      # Similar name to referrer
    "instant_signup": 1.0,    # Signed up within seconds of link creation
    "no_profile_photo": 0.5,  # No avatar uploaded
    "no_verification": 2.0,   # Email not verified
}

FRAUD_THRESHOLD = 5.0  # Score above this = fraudulent
MATURATION_DAYS = 7    # Days before referral reward is granted


def calculate_fraud_score(referrer: User, referred: User, referred_ip: str, db: Session) -> dict:
    """AI-like fraud detection scoring for a referral."""
    score = 0.0
    signals = []

    # 1. Same IP check
    referrer_ips = _referral_ips.get(referrer.id, [])
    if referred_ip in referrer_ips or len(set(referrer_ips)) < len(referrer_ips) * 0.5:
        score += FRAUD_SIGNALS["same_ip"]
        signals.append("Misma IP que otras cuentas referidas")

    # 2. IP burst — many registrations from same IP
    ip_users = _ip_registrations.get(referred_ip, [])
    if len(ip_users) >= 3:
        score += FRAUD_SIGNALS["ip_burst"]
        signals.append(f"IP con {len(ip_users)} registros recientes")

    # 3. Disposable email
    if is_disposable_email(referred.email):
        score += FRAUD_SIGNALS["disposable_email"]
        signals.append("Email desechable detectado")

    # 4. Similar name
    if referrer.first_name and referred.first_name:
        r1 = (referrer.first_name + referrer.last_name).lower().replace(" ", "")
        r2 = (referred.first_name + referred.last_name).lower().replace(" ", "")
        if len(r1) > 3 and len(r2) > 3:
            common = sum(1 for a, b in zip(r1, r2, strict=False) if a == b) / max(len(r1), len(r2))
            if common > 0.7:
                score += FRAUD_SIGNALS["similar_name"]
                signals.append("Nombre similar al referidor")

    # 5. No email verification
    if not referred.email_verified:
        score += FRAUD_SIGNALS["no_verification"]
        signals.append("Email no verificado")

    # 6. No profile photo
    if not referred.avatar:
        score += FRAUD_SIGNALS["no_profile_photo"]
        signals.append("Sin foto de perfil")

    is_fraud = score >= FRAUD_THRESHOLD

    return {
        "score": round(score, 1),
        "threshold": FRAUD_THRESHOLD,
        "isFraud": is_fraud,
        "signals": signals,
        "recommendation": "BLOQUEAR recompensa" if is_fraud else "APROBAR" if score < 2 else "REVISAR manualmente",
    }


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
        "whatsappLink": f"https://wa.me/?text=Únete%20a%20Conniku%20con%20mi%20enlace%20y%20obtén%20días%20Pro%20gratis%3A%20https%3A%2F%2Fconniku.com%2Fregister%3Fref%3D{user.referral_code}",
        "totalReferred": user.referral_count or 0,
    }


@router.post("/validate")
def validate_referral(data: dict, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Validate a referral after maturation period (called by rewards check)."""
    referrer_code = data.get("referral_code")
    if not referrer_code:
        return {"valid": False}

    referrer = db.query(User).filter(User.referral_code == referrer_code).first()
    if not referrer or referrer.id == user.id:
        return {"valid": False}

    ip = get_client_ip(request)
    fraud_check = calculate_fraud_score(referrer, user, ip, db)

    # Track IP
    _referral_ips[referrer.id].append(ip)
    _ip_registrations[ip].append(user.id)

    if fraud_check["isFraud"]:
        return {"valid": False, "reason": "Actividad sospechosa detectada", "fraudScore": fraud_check["score"]}

    # Check maturation — referred user must have 7+ days of real activity
    if user.created_at:
        age_days = (datetime.utcnow() - user.created_at).days
        if age_days < MATURATION_DAYS:
            return {"valid": False, "reason": f"El referido debe tener al menos {MATURATION_DAYS} días de actividad", "daysLeft": MATURATION_DAYS - age_days}

    # Check real activity (at least 5 actions)
    from database import StudySession, WallPost, Message
    activity = 0
    activity += db.query(func.count(StudySession.id)).filter(StudySession.user_id == user.id).scalar() or 0
    activity += db.query(func.count(WallPost.id)).filter(WallPost.author_id == user.id).scalar() or 0
    activity += db.query(func.count(Message.id)).filter(Message.sender_id == user.id).scalar() or 0

    if activity < 5:
        return {"valid": False, "reason": "El referido necesita más actividad en la plataforma", "currentActivity": activity, "required": 5}

    return {"valid": True, "fraudCheck": fraud_check}


@router.get("/leaderboard")
def referral_leaderboard(db: Session = Depends(get_db)):
    top = db.query(User).filter(User.referral_count > 0).order_by(desc(User.referral_count)).limit(10).all()
    return [{"username": u.username, "firstName": u.first_name, "avatar": u.avatar, "count": u.referral_count or 0} for u in top]


# ─── Admin: Fraud Detection Dashboard ──────────────────────

@router.get("/admin/fraud-report")
def admin_fraud_report(admin: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin view of referral fraud indicators."""
    if not admin.is_admin:
        raise HTTPException(403, "Admin requerido")

    # Find suspicious patterns
    # Users with many referrals but referred users have low activity
    top_referrers = db.query(User).filter(User.referral_count > 3).order_by(desc(User.referral_count)).limit(20).all()

    suspicious = []
    for ref in top_referrers:
        referred_users = db.query(User).filter(User.referred_by == ref.id).all()
        inactive_count = sum(1 for u in referred_users if not u.email_verified or (u.xp or 0) < 10)

        if inactive_count > len(referred_users) * 0.5 and len(referred_users) > 2:
            suspicious.append({
                "userId": ref.id,
                "username": ref.username,
                "name": f"{ref.first_name} {ref.last_name}",
                "totalReferred": ref.referral_count or 0,
                "inactiveReferred": inactive_count,
                "fraudProbability": round(inactive_count / max(len(referred_users), 1) * 100),
                "recommendation": "INVESTIGAR" if inactive_count > 3 else "MONITOREAR",
            })

    return {
        "totalReferrals": db.query(func.sum(User.referral_count)).scalar() or 0,
        "suspiciousAccounts": suspicious,
        "blockedIps": 0,  # TODO: implementar sistema de IP blocking para fraud detection
    }
