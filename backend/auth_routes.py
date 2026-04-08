"""
Auth routes: registration, login, profile, email verification, username management.
"""
import os
import re
import random
import string
import hashlib
import html
import logging
from datetime import datetime, date, timedelta
from typing import Optional
from collections import defaultdict

import bcrypt

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database import get_db, User, UserSession, gen_id, DATA_DIR, TutoringRequest
from middleware import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

# ─── Rate limiting for sensitive endpoints ─────────────────────
_rate_limits: dict[str, list[datetime]] = defaultdict(list)

def _check_rate_limit(key: str, max_attempts: int, window_minutes: int):
    """Raise 429 if key exceeds max_attempts within window."""
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=window_minutes)
    attempts = [t for t in _rate_limits[key] if t > cutoff]
    _rate_limits[key] = attempts
    if len(attempts) >= max_attempts:
        raise HTTPException(429, "Demasiados intentos. Intenta de nuevo más tarde.")
    _rate_limits[key].append(now)


# ─── Password hashing (bcrypt) ──────────────────────────────────

BCRYPT_ROUNDS = int(os.environ.get("BCRYPT_ROUNDS", "12"))


def hash_password(password: str) -> str:
    """Hash password using bcrypt with configurable rounds."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode()


def verify_password(password: str, stored: str) -> bool:
    """Verify password against stored hash. Supports bcrypt and legacy SHA-256."""
    import hashlib
    # bcrypt hashes
    if stored.startswith("$2b$") or stored.startswith("$2a$"):
        return bcrypt.checkpw(password.encode(), stored.encode())
    # Legacy SHA-256 hashes — verify and schedule migration on next login
    if ':' in stored:
        salt, hashed = stored.split(':', 1)
        return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == hashed
    return False


# ─── Auto-generate username ─────────────────────────────────────

def generate_username(first_name: str, db: Session) -> str:
    base = first_name.lower().strip().replace(' ', '')[:15]
    if not base:
        base = "user"
    for _ in range(50):
        suffix = ''.join(random.choices(string.digits, k=4))
        candidate = f"{base}{suffix}"
        if not db.query(User).filter(User.username == candidate).first():
            return candidate
    return f"{base}{random.randint(10000, 99999)}"


def get_next_user_number(db: Session) -> int:
    max_num = db.query(func.max(User.user_number)).scalar()
    return (max_num or 0) + 1


# ─── Admin email from config ────────────────────────────────────

def get_admin_email() -> str:
    import json
    config_file = DATA_DIR / "config.json"
    if config_file.exists():
        try:
            config = json.loads(config_file.read_text())
            return config.get("admin_email", "").lower()
        except:
            pass
    return ""


# ─── Device Session Tracking ───────────────────────────────────

def _parse_device_info(user_agent: str) -> tuple[str, str]:
    """Parse User-Agent header to extract device name and type."""
    ua = (user_agent or "").lower()
    device_type = "web"
    device_name = "Navegador desconocido"

    # Detect device type
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        device_type = "mobile"
    elif "tablet" in ua or "ipad" in ua:
        device_type = "tablet"
    elif "electron" in ua or "desktop" in ua:
        device_type = "desktop"

    # Detect browser/OS
    if "chrome" in ua and "edg" not in ua and "opr" not in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "edg" in ua:
        browser = "Edge"
    elif "opr" in ua or "opera" in ua:
        browser = "Opera"
    else:
        browser = "Navegador"

    if "windows" in ua:
        device_name = f"{browser} en Windows"
    elif "macintosh" in ua or "mac os" in ua:
        device_name = f"{browser} en Mac"
    elif "iphone" in ua:
        device_name = f"{browser} en iPhone"
    elif "ipad" in ua:
        device_name = f"{browser} en iPad"
    elif "android" in ua:
        device_name = f"{browser} en Android"
    elif "linux" in ua:
        device_name = f"{browser} en Linux"
    else:
        device_name = browser

    return device_name, device_type


def _register_session(db: Session, user_id: str, token: str, request: Request = None):
    """Register a new device session after login/register."""
    import hashlib as _hl
    user_agent = ""
    ip_address = ""
    if request:
        user_agent = request.headers.get("user-agent", "")
        ip_address = request.client.host if request.client else ""

    device_name, device_type = _parse_device_info(user_agent)
    token_hash = _hl.sha256(token.encode()).hexdigest()

    session = UserSession(
        id=gen_id(),
        user_id=user_id,
        device_name=device_name,
        device_type=device_type,
        ip_address=ip_address,
        token_hash=token_hash,
        last_active=datetime.utcnow(),
        is_active=True,
    )
    db.add(session)
    db.commit()
    return session


# ─── Request/Response Models ────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    gender: str = "unspecified"
    language: str = "es"
    university: str = ""
    career: str = ""
    semester: int = 1
    phone: str = ""
    birth_date: str = ""
    bio: str = ""
    avatar: str = ""
    username: Optional[str] = None
    tos_accepted: bool = False
    referral_code: Optional[str] = None
    academic_status: str = "estudiante"
    graduation_status_year: Optional[int] = None
    title_year: Optional[int] = None
    offers_mentoring: bool = False
    mentoring_services: list = []
    mentoring_subjects: list = []
    mentoring_description: str = ""
    mentoring_price_type: str = "free"
    mentoring_price_per_hour: Optional[float] = None
    professional_title: str = ""
    study_start_date: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    language: Optional[str] = None
    language_skill: Optional[str] = None
    secondary_languages: Optional[list] = None
    platform_language: Optional[str] = None
    university: Optional[str] = None
    career: Optional[str] = None
    semester: Optional[int] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    theme: Optional[str] = None
    academic_status: Optional[str] = None
    graduation_status_year: Optional[int] = None
    title_year: Optional[int] = None
    offers_mentoring: Optional[bool] = None
    mentoring_services: Optional[list] = None
    mentoring_subjects: Optional[list] = None
    mentoring_description: Optional[str] = None
    mentoring_price_type: Optional[str] = None
    mentoring_price_per_hour: Optional[float] = None
    professional_title: Optional[str] = None
    study_start_date: Optional[str] = None
    cover_photo: Optional[str] = None
    cover_type: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


class UsernameRequest(BaseModel):
    username: str


class VerifyEmailRequest(BaseModel):
    code: str


# ─── Helper: serialize user ─────────────────────────────────────

def _calc_study_days(study_start_date: str) -> int:
    """Calculate number of days since the user started studying."""
    if not study_start_date:
        return 0
    try:
        start = date.fromisoformat(study_start_date)
        return max(0, (date.today() - start).days)
    except (ValueError, TypeError):
        return 0


def user_to_dict(user: User) -> dict:
    import json as _json
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "userNumber": user.user_number,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "avatar": user.avatar or "",
        "gender": user.gender,
        "language": user.language,
        "languageSkill": user.language_skill,
        "secondaryLanguages": _json.loads(getattr(user, 'secondary_languages', None) or "[]"),
        "platformLanguage": getattr(user, 'platform_language', None) or user.language or "es",
        "university": user.university,
        "career": user.career,
        "semester": user.semester,
        "phone": user.phone or "",
        "birthDate": user.birth_date or "",
        "bio": user.bio or "",
        "provider": user.provider,
        "emailVerified": user.email_verified,
        "isBanned": user.is_banned,
        "isAdmin": user.is_admin,
        "role": getattr(user, 'role', 'user') or "user",
        "tosAcceptedAt": user.tos_accepted_at.isoformat() if user.tos_accepted_at else None,
        "onboardingCompleted": user.onboarding_completed,
        "theme": user.theme or "nocturno",
        "subscriptionStatus": user.subscription_status or "trial",
        "subscriptionTier": getattr(user, 'subscription_tier', 'free') or "free",
        "trialStartedAt": user.trial_started_at.isoformat() if user.trial_started_at else None,
        "subscriptionExpiresAt": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "storageUsedBytes": getattr(user, 'storage_used_bytes', 0) or 0,
        "storageLimitBytes": getattr(user, 'storage_limit_bytes', 524288000) or 524288000,
        "referralCode": getattr(user, 'referral_code', None),
        "referralCount": getattr(user, 'referral_count', 0) or 0,
        "pomodoroTotalSessions": getattr(user, 'pomodoro_total_sessions', 0) or 0,
        "pomodoroTotalMinutes": getattr(user, 'pomodoro_total_minutes', 0) or 0,
        "weeklyStudyGoalHours": getattr(user, 'weekly_study_goal_hours', 10.0) or 10.0,
        "academicStatus": getattr(user, 'academic_status', 'estudiante') or "estudiante",
        "graduationStatusYear": getattr(user, 'graduation_status_year', None),
        "titleYear": getattr(user, 'title_year', None),
        "offersMentoring": getattr(user, 'offers_mentoring', False) or False,
        "mentoringServices": _json.loads(getattr(user, 'mentoring_services', None) or "[]"),
        "mentoringSubjects": _json.loads(getattr(user, 'mentoring_subjects', None) or "[]"),
        "mentoringDescription": getattr(user, 'mentoring_description', '') or "",
        "mentoringPriceType": getattr(user, 'mentoring_price_type', 'free') or "free",
        "mentoringPricePerHour": getattr(user, 'mentoring_price_per_hour', None),
        "mentoringCurrency": getattr(user, 'mentoring_currency', 'USD') or "USD",
        "professionalTitle": getattr(user, 'professional_title', '') or "",
        "coverPhoto": getattr(user, 'cover_photo', '') or "",
        "coverType": getattr(user, 'cover_type', 'template') or "template",
        "studyStartDate": getattr(user, 'study_start_date', '') or "",
        "studyDays": _calc_study_days(getattr(user, 'study_start_date', '') or ""),
        "createdAt": user.created_at.isoformat() if user.created_at else "",
        "lastLogin": user.last_login.isoformat() if user.last_login else "",
    }


# ─── Routes ─────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest, request: Request = None, db: Session = Depends(get_db)):
    # Rate limit: 5 registrations per IP per hour
    client_ip = request.client.host if request and request.client else "unknown"
    _check_rate_limit(f"register:{client_ip}", max_attempts=5, window_minutes=60)

    # Password strength: min 8 chars, at least 1 uppercase, 1 number
    if len(req.password) < 8:
        raise HTTPException(400, "La contraseña debe tener al menos 8 caracteres")
    if not re.search(r'[A-Z]', req.password):
        raise HTTPException(400, "La contraseña debe incluir al menos una mayúscula")
    if not re.search(r'[0-9]', req.password):
        raise HTTPException(400, "La contraseña debe incluir al menos un número")

    # Block disposable emails
    from security_middleware import is_disposable_email
    if is_disposable_email(req.email):
        raise HTTPException(400, "No se permiten correos temporales. Usa tu correo universitario o personal.")

    # Validate email unique
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(400, "Ya existe una cuenta con este correo")

    # Age check: must be 18+
    if req.birth_date:
        try:
            birth = date.fromisoformat(req.birth_date)
            today = date.today()
            age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
            if age < 18:
                raise HTTPException(403, "Debes tener al menos 18 años para registrarte")
        except ValueError:
            pass  # Invalid date format, skip check
    else:
        raise HTTPException(400, "Fecha de nacimiento es obligatoria")

    # TOS must be accepted
    if not req.tos_accepted:
        raise HTTPException(400, "Debes aceptar los términos de servicio")

    import json as _json

    # Generate or validate username
    if req.username:
        username = req.username.lower().strip()
        if len(username) < 3 or len(username) > 30:
            raise HTTPException(400, "El nombre de usuario debe tener entre 3 y 30 caracteres")
        if db.query(User).filter(User.username == username).first():
            raise HTTPException(400, "Este nombre de usuario ya está en uso")
    else:
        username = generate_username(req.first_name, db)

    # Generate verification code
    verification_code = ''.join(random.choices(string.digits, k=6))

    # Check if admin — ensure boolean, not empty string
    admin_email = get_admin_email()
    is_admin = bool(admin_email and req.email.lower() == admin_email)

    user = User(
        id=gen_id(),
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        username=username,
        user_number=get_next_user_number(db),
        first_name=html.escape(req.first_name),
        last_name=html.escape(req.last_name),
        avatar=req.avatar or None,
        gender=req.gender or "unspecified",
        language=req.language or "es",
        language_skill="intermediate",
        university=html.escape(req.university or ""),
        career=html.escape(req.career or ""),
        semester=req.semester or 1,
        phone=req.phone or "",
        birth_date=req.birth_date or "",
        bio=html.escape(req.bio or ""),
        provider="email",
        email_verified=False,
        verification_code=verification_code,
        is_banned=False,
        ban_reason=None,
        is_admin=is_admin,
        role="user",
        academic_status=req.academic_status if req.academic_status in ("estudiante", "egresado", "titulado") else "estudiante",
        graduation_status_year=req.graduation_status_year,
        title_year=req.title_year if req.academic_status == "titulado" else None,
        offers_mentoring=req.offers_mentoring if req.academic_status in ("egresado", "titulado") else False,
        mentoring_services=_json.dumps(req.mentoring_services) if req.mentoring_services else "[]",
        mentoring_subjects=_json.dumps(req.mentoring_subjects) if req.mentoring_subjects else "[]",
        mentoring_description=html.escape(req.mentoring_description or ""),
        mentoring_price_type=req.mentoring_price_type if req.mentoring_price_type in ("free", "paid") else "free",
        mentoring_price_per_hour=req.mentoring_price_per_hour if req.mentoring_price_type == "paid" else None,
        professional_title=html.escape(req.professional_title or ""),
        study_start_date=req.study_start_date or "",
        tos_accepted_at=datetime.utcnow() if req.tos_accepted else None,
        onboarding_completed=False,
        theme="nocturno",
        xp=0,
        level=1,
        streak_days=0,
        last_active_date=None,
        badges="[]",
        subscription_status="trial",
        trial_started_at=datetime.utcnow(),
        subscription_expires_at=None,
        stripe_customer_id=None,
        paypal_subscription_id=None,
        reset_code=None,
        reset_code_expires=None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Process referral code if provided
    if req.referral_code:
        referrer = db.query(User).filter(User.referral_code == req.referral_code).first()
        if referrer and referrer.id != user.id:
            referrer.referral_count = (referrer.referral_count or 0) + 1
            user.referred_by = referrer.id
            # Give referrer 7 bonus days of Pro
            if not referrer.subscription_expires_at or referrer.subscription_expires_at < datetime.utcnow():
                referrer.subscription_expires_at = datetime.utcnow() + timedelta(days=7)
            else:
                referrer.subscription_expires_at = referrer.subscription_expires_at + timedelta(days=7)
            if referrer.subscription_tier == "free":
                referrer.subscription_status = "active"
                referrer.subscription_tier = "pro"
            # Give new user 3 bonus days of Pro
            user.subscription_status = "active"
            user.subscription_tier = "pro"
            user.subscription_expires_at = datetime.utcnow() + timedelta(days=3)
            db.commit()
            # Notify referrer
            try:
                from notification_routes import create_notification
                create_notification(db, referrer.id, "referral",
                    f"¡{user.first_name} se unió con tu enlace! +7 días Pro 🎉",
                    link="/subscription", actor_id=user.id)
                db.commit()
            except Exception:
                pass

    # ─── Auto-friend CEO ──────────────────────────────────────
    try:
        ceo_email = get_admin_email()
        if ceo_email:
            ceo_user = db.query(User).filter(User.email == ceo_email).first()
            if ceo_user and ceo_user.id != user.id:
                from database import Friendship, Conversation, ConversationParticipant, Message
                # Create bidirectional friendship
                existing = db.query(Friendship).filter(
                    ((Friendship.requester_id == user.id) & (Friendship.addressee_id == ceo_user.id)) |
                    ((Friendship.requester_id == ceo_user.id) & (Friendship.addressee_id == user.id))
                ).first()
                if not existing:
                    f1 = Friendship(id=gen_id(), requester_id=ceo_user.id, addressee_id=user.id, status="accepted")
                    db.add(f1)

                    # Create conversation and send welcome message
                    conv = Conversation(
                        id=gen_id(),
                        type="direct",
                        created_by=ceo_user.id,
                    )
                    db.add(conv)
                    db.flush()

                    # Add both participants
                    db.add(ConversationParticipant(id=gen_id(), conversation_id=conv.id, user_id=ceo_user.id))
                    db.add(ConversationParticipant(id=gen_id(), conversation_id=conv.id, user_id=user.id))

                    # Send welcome message
                    gendered_greeting = "a" if getattr(user, 'gender', None) == 'female' else "o"
                    welcome_msg = Message(
                        id=gen_id(),
                        conversation_id=conv.id,
                        sender_id=ceo_user.id,
                        content=(
                            f"¡Hola {user.first_name}! 👋\n\n"
                            f"Soy Cristian, el fundador de Conniku. Antes que nada, bienvenid{gendered_greeting} a esta comunidad que construimos juntos.\n\n"
                            f"Te cuento un poco: soy estudiante igual que tú, y creé Conniku porque sentía que nos faltaban herramientas que realmente nos entendieran. "
                            f"Esto no es solo una plataforma — es un proyecto que nace de las mismas necesidades que tienes tú.\n\n"
                            f"Me agregué como tu amigo porque quiero que sepas que estoy aquí. Si tienes ideas, sugerencias, problemas o simplemente quieres conversar "
                            f"sobre cómo mejorar tu experiencia, escríbeme directamente. Leo todos los mensajes personalmente.\n\n"
                            f"¡Éxito en todo lo que viene! 🚀\n\n"
                            f"— Cristian\n"
                            f"Fundador, alma de Conniku y estudiante como tú"
                        ),
                    )
                    db.add(welcome_msg)
                    db.commit()
    except Exception as e:
        print(f"[Auto-friend CEO] Error: {e}")
        # Non-critical, don't fail registration

    # Send verification email
    try:
        from notifications import _send_email_async, _email_template
        verify_body = f"""
            <p>Hola <strong>{req.first_name}</strong>,</p>
            <p>Bienvenido a Conniku. Tu código de verificación es:</p>
            <div style="text-align:center; margin:20px 0;">
                <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:#2563EB;
                             background:#EFF6FF; padding:12px 24px; border-radius:8px; display:inline-block;">
                    {verification_code}
                </span>
            </div>
            <p>Ingresa este código en la aplicación para verificar tu correo electrónico.</p>
            <p style="color:#98A2B3; font-size:13px;">Este código expira en 30 minutos. Si no solicitaste esta cuenta, ignora este mensaje.</p>
        """
        verify_html = _email_template("Verifica tu cuenta", verify_body)
        _send_email_async(user.email, "Verifica tu cuenta de Conniku", verify_html)
    except Exception:
        pass  # Don't block registration if email fails

    # Send welcome chat message with prizes info
    try:
        from database import Conversation, ConversationParticipant, Message, gen_id as _gen_id
        # Create a system conversation for welcome
        conv = Conversation(
            id=_gen_id(),
            type="direct",
            name="Bienvenida Conniku",
            description="Mensaje de bienvenida",
        )
        db.add(conv)
        db.flush()

        # Add user as participant
        db.add(ConversationParticipant(id=_gen_id(), conversation_id=conv.id, user_id=user.id))

        # Welcome message
        welcome_content = """\u00a1Bienvenido/a a Conniku! \U0001f389

Estamos felices de tenerte aqu\u00ed. Conniku es tu plataforma para estudiar, conectar y crecer profesionalmente.

\U0001f3c6 **Programa de Premios:**
\u2022 Completa **3 cursos** \u2192 Acceso Pro gratis por 1 mes
\u2022 Completa **6 cursos** \u2192 Acceso Max gratis por 1 mes
\u2022 Mant\u00e9n una racha de **30 d\u00edas** \u2192 Badge exclusivo + 500 XP
\u2022 Invita amigos con tu c\u00f3digo de referido \u2192 7 d\u00edas Pro por cada amigo

\U0001f4da **\u00bfPor d\u00f3nde empezar?**
1. Completa tu perfil con foto y bio
2. Explora los cursos disponibles
3. Conecta con compa\u00f1eros de tu universidad
4. Sube tus documentos de estudio

\u00a1Mucho \u00e9xito en tu camino! \U0001f4aa"""

        msg = Message(
            id=_gen_id(),
            conversation_id=conv.id,
            sender_id=None,  # System message
            content=welcome_content,
            message_type="system",
        )
        db.add(msg)
        db.commit()
    except Exception as e:
        logger.warning(f"Welcome message failed: {e}")
        pass

    token = create_access_token(user.id)
    try:
        _register_session(db, user.id, token, request)
    except Exception as e:
        logger.warning(f"Session tracking failed on register: {e}")
    return {
        "token": token,
        "user": user_to_dict(user),
    }


@router.post("/login")
def login(req: LoginRequest, request: Request = None, db: Session = Depends(get_db)):
    # Rate limit: 10 login attempts per email per 15 min
    email_key = hashlib.md5(req.email.lower().encode()).hexdigest()
    _check_rate_limit(f"login:{email_key}", max_attempts=10, window_minutes=15)

    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos")

    if user.is_banned:
        raise HTTPException(403, f"Cuenta suspendida: {user.ban_reason or 'Violación de políticas'}")

    # Migrate legacy SHA-256 hashes to bcrypt on successful login
    if user.password_hash and not user.password_hash.startswith("$2b$") and not user.password_hash.startswith("$2a$"):
        user.password_hash = hash_password(req.password)

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(user.id)
    try:
        _register_session(db, user.id, token, request)
    except Exception as e:
        logger.warning(f"Session tracking failed on login: {e}")
    return {"token": token, "user": user_to_dict(user)}


class GoogleAuthRequest(BaseModel):
    credential: str  # Google JWT token


@router.post("/google")
def google_auth(req: GoogleAuthRequest, request: Request = None, db: Session = Depends(get_db)):
    """Authenticate with Google credential. Creates account if needed."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests

    # Rate limit
    client_ip = request.client.host if request and request.client else "unknown"
    _check_rate_limit(f"google:{client_ip}", max_attempts=10, window_minutes=15)

    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

    # Verify Google JWT signature against Google's public keys
    try:
        payload = id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID or None,  # None skips audience check if not configured
        )
    except ValueError:
        raise HTTPException(400, "Token de Google inválido o expirado")

    google_email = payload.get("email", "").lower()
    if not google_email:
        raise HTTPException(400, "Token de Google no contiene email")

    first_name = payload.get("given_name", "Usuario")
    last_name = payload.get("family_name", "")
    avatar = payload.get("picture", "")

    # Check if user exists
    user = db.query(User).filter(User.email == google_email).first()

    if user:
        # Existing user — just log in
        if user.is_banned:
            raise HTTPException(403, f"Cuenta suspendida: {user.ban_reason or 'Violación de políticas'}")
        user.last_login = datetime.utcnow()
        if avatar and not user.avatar:
            user.avatar = avatar
        db.commit()
    else:
        # New user — create account
        username = generate_username(first_name, db)
        user = User(
            id=gen_id(),
            email=google_email,
            password_hash=None,  # Google users don't have a password
            username=username,
            user_number=get_next_user_number(db),
            first_name=html.escape(first_name),
            last_name=html.escape(last_name),
            avatar=avatar,
            gender="unspecified",
            language="es",
            language_skill="intermediate",
            university="",
            career="",
            semester=1,
            phone="",
            birth_date="",
            bio="",
            provider="google",
            email_verified=True,  # Google already verified the email
            verification_code=None,
            is_banned=False,
            is_admin=False,
            role="user",
            tos_accepted_at=datetime.utcnow(),
            onboarding_completed=False,
            theme="nocturno",
            xp=0,
            level=1,
            streak_days=0,
            badges="[]",
            subscription_status="trial",
            trial_started_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    try:
        _register_session(db, user.id, token, request)
    except Exception as e:
        logger.warning(f"Session tracking failed on google auth: {e}")
    return {"token": token, "user": user_to_dict(user)}


@router.get("/sessions")
def get_sessions(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all active sessions for the current user (multi-device tracking)."""
    import hashlib as _hl
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).order_by(UserSession.last_active.desc()).all()

    # Detect current session by token hash
    current_token_hash = ""
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        current_token_hash = _hl.sha256(auth_header[7:].encode()).hexdigest()

    return {
        "sessions": [{
            "id": s.id,
            "deviceName": s.device_name,
            "deviceType": s.device_type,
            "ipAddress": s.ip_address,
            "lastActive": s.last_active.isoformat() if s.last_active else "",
            "createdAt": s.created_at.isoformat() if s.created_at else "",
            "current": s.token_hash == current_token_hash if current_token_hash else False,
        } for s in sessions],
        "totalDevices": len(sessions),
    }


@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke/deactivate a specific device session."""
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Sesión no encontrada")
    session.is_active = False
    db.commit()
    return {"ok": True, "message": "Sesión cerrada correctamente"}


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return user_to_dict(user)


@router.put("/me")
def update_me(req: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import json as _json
    from social_routes import create_milestone_post

    # Save old values for milestone detection
    old_university = getattr(user, "university", "") or ""
    old_academic_status = getattr(user, "academic_status", "") or ""
    old_offers_mentoring = getattr(user, "offers_mentoring", False) or False

    updates = req.dict(exclude_none=True)
    json_list_fields = {"secondary_languages", "mentoring_services", "mentoring_subjects"}
    for key, value in updates.items():
        # Handle JSON list fields specially: store as JSON string
        if key in json_list_fields:
            if isinstance(value, list):
                if key == "secondary_languages" and len(value) > 4:
                    continue
                setattr(user, key, _json.dumps(value))
            continue
        # Validate academic_status
        if key == "academic_status" and value not in ("estudiante", "egresado", "titulado"):
            continue
        # Convert camelCase to snake_case for db fields
        db_key = key
        if hasattr(user, db_key):
            setattr(user, db_key, value)

    # Detect milestone-worthy changes
    milestones = []
    new_university = getattr(user, "university", "") or ""
    new_academic_status = getattr(user, "academic_status", "") or ""
    new_offers_mentoring = getattr(user, "offers_mentoring", False) or False

    if new_university and new_university != old_university:
        create_milestone_post(db, user.id, "university_change",
            f"Ahora estudia en {new_university}")
        milestones.append({"type": "university_change", "university": new_university})

    if new_academic_status and new_academic_status != old_academic_status:
        status_labels = {"estudiante": "Estudiante", "egresado": "Egresado/a", "titulado": "Titulado/a"}
        label = status_labels.get(new_academic_status, new_academic_status)
        create_milestone_post(db, user.id, "academic_status",
            f"Ha actualizado su estado académico a {label}")
        milestones.append({"type": "academic_status", "status": new_academic_status})

    if new_offers_mentoring and not old_offers_mentoring:
        create_milestone_post(db, user.id, "tutoring_started",
            "Ha comenzado a ofrecer servicios de tutoría")
        milestones.append({"type": "tutoring_started"})

    db.commit()
    db.refresh(user)
    result = user_to_dict(user)
    if milestones:
        result["milestones"] = milestones
    return result


@router.post("/profile/cover")
async def update_cover_photo(
    file: UploadFile = File(None),
    template_id: str = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user cover photo: either upload a custom image or select a template."""
    import pathlib
    if file:
        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if file.content_type not in allowed_types:
            raise HTTPException(400, "Formato de imagen no soportado. Usa JPG, PNG, WebP o GIF.")
        # Read and check size (max 5MB)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(400, "La imagen no puede superar 5MB.")
        # Save file
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
        covers_dir = pathlib.Path.home() / ".conniku" / "uploads" / "covers"
        covers_dir.mkdir(parents=True, exist_ok=True)
        file_path = covers_dir / f"{user.id}.{ext}"
        # Remove old cover files for this user
        for old_file in covers_dir.glob(f"{user.id}.*"):
            old_file.unlink(missing_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)
        user.cover_photo = f"/uploads/covers/{user.id}.{ext}"
        user.cover_type = "custom"
    elif template_id:
        user.cover_photo = template_id
        user.cover_type = "template"
    else:
        raise HTTPException(400, "Debes enviar una imagen o seleccionar una plantilla.")

    db.commit()
    return {
        "coverPhoto": user.cover_photo,
        "coverType": user.cover_type,
    }


@router.put("/me/username")
def change_username(req: UsernameRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    username = req.username.lower().strip()
    if len(username) < 3 or len(username) > 30:
        raise HTTPException(400, "El nombre de usuario debe tener entre 3 y 30 caracteres")
    if not username.replace('_', '').replace('.', '').isalnum():
        raise HTTPException(400, "Solo letras, números, puntos y guiones bajos")

    existing = db.query(User).filter(User.username == username, User.id != user.id).first()
    if existing:
        raise HTTPException(400, "Este nombre de usuario ya está en uso")

    user.username = username
    db.commit()
    return {"username": user.username}


@router.get("/check-username")
def check_username(q: str, db: Session = Depends(get_db)):
    username = q.lower().strip()
    exists = db.query(User).filter(User.username == username).first() is not None
    return {"available": not exists}


@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.email_verified:
        return {"verified": True}

    if user.verification_code and req.code == user.verification_code:
        user.email_verified = True
        user.verification_code = None
        db.commit()
        return {"verified": True}

    raise HTTPException(400, "Código de verificación incorrecto")


@router.post("/complete-onboarding")
def complete_onboarding(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.onboarding_completed = True
    db.commit()
    return {"completed": True}


# ─── Change Password ──────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/change-password")
def change_password(req: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.password_hash:
        raise HTTPException(400, "Esta cuenta usa inicio de sesión con Google")

    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(400, "Contraseña actual incorrecta")

    if len(req.new_password) < 8:
        raise HTTPException(400, "La nueva contraseña debe tener al menos 8 caracteres")
    if not re.search(r'[A-Z]', req.new_password):
        raise HTTPException(400, "La contraseña debe incluir al menos una mayúscula")
    if not re.search(r'[0-9]', req.new_password):
        raise HTTPException(400, "La contraseña debe incluir al menos un número")

    user.password_hash = hash_password(req.new_password)
    db.commit()

    return {"status": "ok"}


# ─── Password Recovery ─────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request = None, db: Session = Depends(get_db)):
    # Rate limit: 3 reset requests per email per hour
    email_key = hashlib.md5(req.email.lower().encode()).hexdigest()
    _check_rate_limit(f"reset:{email_key}", max_attempts=3, window_minutes=60)

    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Don't reveal if email exists
        return {"sent": True}

    code = ''.join(random.choices(string.digits, k=6))
    from datetime import timedelta
    user.reset_code = code
    user.reset_code_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    # Send reset code via email
    try:
        from notifications import _send_email_async, _email_template
        reset_body = f"""
            <p>Hola <strong>{user.first_name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Tu código es:</p>
            <div style="text-align:center; margin:20px 0;">
                <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:#2563EB;
                             background:#EFF6FF; padding:12px 24px; border-radius:8px; display:inline-block;">
                    {code}
                </span>
            </div>
            <p style="color:#98A2B3; font-size:13px;">Este código expira en 15 minutos. Si no solicitaste esto, ignora este mensaje.</p>
        """
        reset_html = _email_template("Restablecer contraseña", reset_body)
        _send_email_async(user.email, "Restablecer contraseña - Conniku", reset_html)
    except Exception:
        pass

    return {"sent": True}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request = None, db: Session = Depends(get_db)):
    # Rate limit: 5 reset attempts per email per 15 min
    email_key = hashlib.md5(req.email.lower().encode()).hexdigest()
    _check_rate_limit(f"reset_verify:{email_key}", max_attempts=5, window_minutes=15)

    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(400, "Código incorrecto o cuenta no encontrada")

    if not user.reset_code or user.reset_code != req.code:
        raise HTTPException(400, "Código incorrecto")

    if user.reset_code_expires and user.reset_code_expires < datetime.utcnow():
        raise HTTPException(400, "El código ha expirado")

    if len(req.new_password) < 8:
        raise HTTPException(400, "La contraseña debe tener al menos 8 caracteres")
    if not re.search(r'[A-Z]', req.new_password):
        raise HTTPException(400, "La contraseña debe incluir al menos una mayúscula")
    if not re.search(r'[0-9]', req.new_password):
        raise HTTPException(400, "La contraseña debe incluir al menos un número")

    user.password_hash = hash_password(req.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()

    return {"success": True}


# ─── Owner Setup (one-time, secured by setup key) ─────────────
class OwnerSetupRequest(BaseModel):
    setup_key: str
    password: str

@router.post("/setup-owner")
def setup_owner(req: OwnerSetupRequest, db: Session = Depends(get_db)):
    """Set/reset the owner account password using a setup key."""
    expected_key = os.environ.get("SETUP_KEY", "conniku-setup-2026")
    if req.setup_key != expected_key:
        raise HTTPException(403, "Invalid setup key")

    user = db.query(User).filter(User.email == "ceo@conniku.com").first()
    if not user:
        raise HTTPException(404, "Owner account not found")

    user.password_hash = hash_password(req.password)
    user.is_admin = True
    user.role = "owner"
    user.email_verified = True
    db.commit()
    return {"success": True, "message": "Owner password updated"}


# ─── Pydantic models for tutoring ────────────────────────────

class TutoringRequestCreate(BaseModel):
    tutor_id: str
    subject: str
    message: str = ""

class TutoringRequestRespond(BaseModel):
    action: str  # "accepted" or "rejected"


# ─── Tutoring request endpoints ──────────────────────────────

@router.post("/tutoring-request")
def send_tutoring_request(
    req: TutoringRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Student sends a tutoring request to a tutor."""
    if user.id == req.tutor_id:
        raise HTTPException(400, "You cannot send a tutoring request to yourself")

    tutor = db.query(User).filter(User.id == req.tutor_id).first()
    if not tutor:
        raise HTTPException(404, "Tutor not found")
    if not tutor.offers_mentoring:
        raise HTTPException(400, "This user does not offer mentoring")

    # Check for duplicate pending request
    existing = (
        db.query(TutoringRequest)
        .filter(
            TutoringRequest.student_id == user.id,
            TutoringRequest.tutor_id == req.tutor_id,
            TutoringRequest.subject == req.subject,
            TutoringRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(409, "You already have a pending request for this subject with this tutor")

    tr = TutoringRequest(
        id=gen_id(),
        student_id=user.id,
        tutor_id=req.tutor_id,
        subject=req.subject,
        message=req.message,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(tr)
    db.commit()
    db.refresh(tr)

    return {
        "id": tr.id,
        "student_id": tr.student_id,
        "tutor_id": tr.tutor_id,
        "subject": tr.subject,
        "message": tr.message,
        "status": tr.status,
        "created_at": tr.created_at.isoformat() if tr.created_at else None,
        "responded_at": None,
    }


@router.get("/tutoring-requests")
def list_tutoring_requests(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all tutoring requests where the current user is student or tutor."""
    requests = (
        db.query(TutoringRequest)
        .filter(
            or_(
                TutoringRequest.student_id == user.id,
                TutoringRequest.tutor_id == user.id,
            )
        )
        .order_by(TutoringRequest.created_at.desc())
        .all()
    )

    # Gather all user IDs we need to look up
    other_ids = set()
    for r in requests:
        other_ids.add(r.student_id)
        other_ids.add(r.tutor_id)

    users_map = {}
    if other_ids:
        found_users = db.query(User).filter(User.id.in_(other_ids)).all()
        for u in found_users:
            users_map[u.id] = {
                "id": u.id,
                "username": u.username,
                "name": f"{u.first_name} {u.last_name}".strip(),
                "avatar": u.avatar,
            }

    result = []
    for r in requests:
        result.append({
            "id": r.id,
            "student_id": r.student_id,
            "tutor_id": r.tutor_id,
            "subject": r.subject,
            "message": r.message,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "responded_at": r.responded_at.isoformat() if r.responded_at else None,
            "student": users_map.get(r.student_id),
            "tutor": users_map.get(r.tutor_id),
        })

    return result


@router.post("/tutoring-request/{request_id}/respond")
def respond_tutoring_request(
    request_id: str,
    req: TutoringRequestRespond,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tutor accepts or rejects a tutoring request."""
    if req.action not in ("accepted", "rejected"):
        raise HTTPException(400, "Action must be 'accepted' or 'rejected'")

    tr = db.query(TutoringRequest).filter(TutoringRequest.id == request_id).first()
    if not tr:
        raise HTTPException(404, "Tutoring request not found")
    if tr.tutor_id != user.id:
        raise HTTPException(403, "Only the tutor can respond to this request")
    if tr.status != "pending":
        raise HTTPException(400, f"Request is already {tr.status}")

    tr.status = req.action
    tr.responded_at = datetime.utcnow()
    db.commit()
    db.refresh(tr)

    return {
        "id": tr.id,
        "student_id": tr.student_id,
        "tutor_id": tr.tutor_id,
        "subject": tr.subject,
        "message": tr.message,
        "status": tr.status,
        "created_at": tr.created_at.isoformat() if tr.created_at else None,
        "responded_at": tr.responded_at.isoformat() if tr.responded_at else None,
    }


@router.get("/tutors")
def list_tutors(
    subject: Optional[str] = None,
    price_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List users who offer mentoring, with optional filters."""
    import json as _json

    query = db.query(User).filter(User.offers_mentoring == True, User.is_banned == False)

    if price_type:
        if price_type not in ("free", "paid"):
            raise HTTPException(400, "price_type must be 'free' or 'paid'")
        query = query.filter(User.mentoring_price_type == price_type)

    tutors = query.all()

    result = []
    for t in tutors:
        subjects = _json.loads(t.mentoring_subjects or "[]")
        if subject and subject.lower() not in [s.lower() for s in subjects]:
            continue
        result.append({
            "id": t.id,
            "username": t.username,
            "name": f"{t.first_name} {t.last_name}".strip(),
            "avatar": t.avatar,
            "university": t.university,
            "career": t.career,
            "academic_status": t.academic_status,
            "professional_title": t.professional_title,
            "mentoring_subjects": subjects,
            "mentoring_services": _json.loads(t.mentoring_services or "[]"),
            "mentoring_description": t.mentoring_description,
            "mentoring_price_type": t.mentoring_price_type,
            "mentoring_price_per_hour": t.mentoring_price_per_hour,
            "mentoring_currency": t.mentoring_currency,
        })

    return result


class AccountClosureFeedback(BaseModel):
    reason: str
    feedback: str = ""


class SuggestionRequest(BaseModel):
    type: str  # feature, bug, improvement, other
    subject: str
    message: str

@router.post("/me/suggestion")
def submit_suggestion(req: SuggestionRequest, user: User = Depends(get_current_user)):
    """Send user suggestion/feedback to contacto@conniku.com."""
    type_labels = {"feature": "Nueva Funcionalidad", "bug": "Reporte de Error", "improvement": "Mejora", "other": "Otro"}
    type_label = type_labels.get(req.type, req.type)
    try:
        from notifications import _send_email_async, _email_template
        body = f"""
            <p><strong>Nueva sugerencia de usuario</strong></p>
            <table style="width:100%;font-size:13px;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#6B7280;width:120px">Usuario:</td><td style="padding:6px 0"><strong>{user.first_name} {user.last_name}</strong> (@{user.username})</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Email:</td><td style="padding:6px 0">{user.email}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Tipo:</td><td style="padding:6px 0;font-weight:600">{type_label}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Asunto:</td><td style="padding:6px 0;font-weight:600">{req.subject}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280;vertical-align:top">Mensaje:</td><td style="padding:6px 0">{req.message}</td></tr>
            </table>
        """
        html = _email_template(f"Sugerencia: {req.subject}", body)
        _send_email_async("contacto@conniku.com", f"[{type_label}] {req.subject} — {user.first_name}", html, reply_to=user.email, from_account="ceo")
    except Exception:
        pass
    return {"sent": True}

@router.post("/me/closure-feedback")
def account_closure_feedback(req: AccountClosureFeedback, user: User = Depends(get_current_user)):
    """Send account closure feedback to CEO email."""
    try:
        from notifications import _send_email_async, _email_template
        body = f"""
            <p><strong>Usuario solicita cerrar cuenta</strong></p>
            <table style="width:100%;font-size:13px;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#6B7280;width:120px">Nombre:</td><td style="padding:6px 0"><strong>{user.first_name} {user.last_name}</strong></td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Email:</td><td style="padding:6px 0">{user.email}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Username:</td><td style="padding:6px 0">@{user.username}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Razón:</td><td style="padding:6px 0;color:#ef4444;font-weight:600">{req.reason}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280;vertical-align:top">Feedback:</td><td style="padding:6px 0">{req.feedback or 'Sin comentarios adicionales'}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Miembro desde:</td><td style="padding:6px 0">{user.created_at.strftime('%d/%m/%Y') if user.created_at else 'N/A'}</td></tr>
            </table>
        """
        html = _email_template("Solicitud de cierre de cuenta", body)
        _send_email_async("ceo@conniku.com", f"Cierre de cuenta — {user.first_name} {user.last_name}", html, from_account="ceo")
    except Exception:
        pass
    return {"sent": True}


@router.delete("/me")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete user account and all associated data."""
    user_id = user.id

    from database import (
        ConversationParticipant, Message, Conversation,
        WallPost, PostComment, PostLike, PostReaction, PostShare, PostBookmark,
        Friendship, BlockedUser, UserReport,
        ConversationFolder, ConversationFolderItem,
        FriendList, FriendListMember,
        ModerationLog, VideoDocument, PaymentLog,
        StudySession, SharedDocument, DocumentRating,
        CalendarEvent, LeagueMembership, InAppNotification,
        CommunityMember, CommunityPost, CommunityPostLike, CommunityPostComment,
        Poll, PollOption, PollVote,
        AcademicMilestone,
        JobListing, JobApplication, UserCareerStatus, StudentCV,
        UserCourseProgress, UserExerciseHistory, Certificate,
        SocialMediaAccount, CrossPost, RecruiterProfile,
        TutoringListing, TutoringListingRequest, TutoringRequest,
        StudyEvent, EventRSVP,
        UserSkill, SkillEndorsement,
        MentorProfile, MentorshipRelation,
        StudyPlan, StudyRoom, StudyRoomParticipant,
        QuizHistory, ScheduledQuiz, FlashcardReview,
        MoodCheckIn, ClassAttendance, UserDownload,
        UserSession, PushSubscription,
        VideoConference, ConferenceParticipant,
    )

    # ── Push subscriptions & sessions ──
    try:
        db.query(PushSubscription).filter(PushSubscription.user_id == user_id).delete(synchronize_session=False)
        db.query(UserSession).filter(UserSession.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Video conferences ──
    try:
        conf_ids = [c.id for c in db.query(VideoConference).filter(VideoConference.creator_id == user_id).all()]
        db.query(ConferenceParticipant).filter(ConferenceParticipant.user_id == user_id).delete(synchronize_session=False)
        if conf_ids:
            db.query(ConferenceParticipant).filter(ConferenceParticipant.conference_id.in_(conf_ids)).delete(synchronize_session=False)
            db.query(VideoConference).filter(VideoConference.id.in_(conf_ids)).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Study rooms ──
    try:
        db.query(StudyRoomParticipant).filter(StudyRoomParticipant.user_id == user_id).delete(synchronize_session=False)
        room_ids = [r.id for r in db.query(StudyRoom).filter(StudyRoom.host_id == user_id).all()]
        if room_ids:
            db.query(StudyRoomParticipant).filter(StudyRoomParticipant.room_id.in_(room_ids)).delete(synchronize_session=False)
            db.query(StudyRoom).filter(StudyRoom.id.in_(room_ids)).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Quizzes, flashcards, mood, attendance, downloads ──
    try:
        db.query(QuizHistory).filter(QuizHistory.user_id == user_id).delete(synchronize_session=False)
        db.query(ScheduledQuiz).filter(ScheduledQuiz.user_id == user_id).delete(synchronize_session=False)
        db.query(FlashcardReview).filter(FlashcardReview.user_id == user_id).delete(synchronize_session=False)
        db.query(MoodCheckIn).filter(MoodCheckIn.user_id == user_id).delete(synchronize_session=False)
        db.query(ClassAttendance).filter(ClassAttendance.user_id == user_id).delete(synchronize_session=False)
        db.query(UserDownload).filter(UserDownload.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Study plans ──
    try:
        db.query(StudyPlan).filter(StudyPlan.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Mentorship ──
    try:
        db.query(MentorshipRelation).filter(
            (MentorshipRelation.mentor_id == user_id) | (MentorshipRelation.mentee_id == user_id)
        ).delete(synchronize_session=False)
        db.query(MentorProfile).filter(MentorProfile.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Skills & endorsements ──
    try:
        skill_ids = [s.id for s in db.query(UserSkill).filter(UserSkill.user_id == user_id).all()]
        if skill_ids:
            db.query(SkillEndorsement).filter(SkillEndorsement.skill_id.in_(skill_ids)).delete(synchronize_session=False)
        db.query(SkillEndorsement).filter(SkillEndorsement.endorser_id == user_id).delete(synchronize_session=False)
        db.query(UserSkill).filter(UserSkill.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Study events & RSVPs ──
    try:
        db.query(EventRSVP).filter(EventRSVP.user_id == user_id).delete(synchronize_session=False)
        event_ids = [e.id for e in db.query(StudyEvent).filter(StudyEvent.organizer_id == user_id).all()]
        if event_ids:
            db.query(EventRSVP).filter(EventRSVP.event_id.in_(event_ids)).delete(synchronize_session=False)
            db.query(StudyEvent).filter(StudyEvent.id.in_(event_ids)).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Tutoring listings & requests ──
    try:
        listing_ids = [t.id for t in db.query(TutoringListing).filter(TutoringListing.tutor_id == user_id).all()]
        if listing_ids:
            db.query(TutoringListingRequest).filter(TutoringListingRequest.listing_id.in_(listing_ids)).delete(synchronize_session=False)
            db.query(TutoringListing).filter(TutoringListing.id.in_(listing_ids)).delete(synchronize_session=False)
        db.query(TutoringListingRequest).filter(
            (TutoringListingRequest.student_id == user_id) | (TutoringListingRequest.tutor_id == user_id)
        ).delete(synchronize_session=False)
        db.query(TutoringRequest).filter(
            (TutoringRequest.student_id == user_id) | (TutoringRequest.tutor_id == user_id)
        ).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Courses, certificates, exercise history ──
    try:
        db.query(UserExerciseHistory).filter(UserExerciseHistory.user_id == user_id).delete(synchronize_session=False)
        db.query(UserCourseProgress).filter(UserCourseProgress.user_id == user_id).delete(synchronize_session=False)
        db.query(Certificate).filter(Certificate.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Job board ──
    try:
        job_ids = [j.id for j in db.query(JobListing).filter(JobListing.posted_by == user_id).all()]
        if job_ids:
            db.query(JobApplication).filter(JobApplication.job_id.in_(job_ids)).delete(synchronize_session=False)
            db.query(JobListing).filter(JobListing.id.in_(job_ids)).delete(synchronize_session=False)
        db.query(JobApplication).filter(JobApplication.applicant_id == user_id).delete(synchronize_session=False)
        db.query(UserCareerStatus).filter(UserCareerStatus.user_id == user_id).delete(synchronize_session=False)
        db.query(StudentCV).filter(StudentCV.user_id == user_id).delete(synchronize_session=False)
        db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Academic milestones ──
    try:
        db.query(AcademicMilestone).filter(AcademicMilestone.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Community content (children first) ──
    try:
        community_post_ids = [p.id for p in db.query(CommunityPost).filter(CommunityPost.author_id == user_id).all()]
        if community_post_ids:
            db.query(CommunityPostComment).filter(CommunityPostComment.post_id.in_(community_post_ids)).delete(synchronize_session=False)
            db.query(CommunityPostLike).filter(CommunityPostLike.post_id.in_(community_post_ids)).delete(synchronize_session=False)
            db.query(CommunityPost).filter(CommunityPost.id.in_(community_post_ids)).delete(synchronize_session=False)
        db.query(CommunityPostComment).filter(CommunityPostComment.author_id == user_id).delete(synchronize_session=False)
        db.query(CommunityPostLike).filter(CommunityPostLike.user_id == user_id).delete(synchronize_session=False)
        db.query(CommunityMember).filter(CommunityMember.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Polls ──
    try:
        poll_ids = [p.id for p in db.query(Poll).filter(Poll.author_id == user_id).all()]
        if poll_ids:
            db.query(PollVote).filter(PollVote.poll_id.in_(poll_ids)).delete(synchronize_session=False)
            db.query(PollOption).filter(PollOption.poll_id.in_(poll_ids)).delete(synchronize_session=False)
            db.query(Poll).filter(Poll.id.in_(poll_ids)).delete(synchronize_session=False)
        db.query(PollVote).filter(PollVote.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Notifications ──
    try:
        db.query(InAppNotification).filter(InAppNotification.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Calendar events ──
    try:
        db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── League memberships ──
    try:
        db.query(LeagueMembership).filter(LeagueMembership.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Shared documents & ratings ──
    try:
        doc_ids = [d.id for d in db.query(SharedDocument).filter(SharedDocument.user_id == user_id).all()]
        if doc_ids:
            db.query(DocumentRating).filter(DocumentRating.document_id.in_(doc_ids)).delete(synchronize_session=False)
            db.query(SharedDocument).filter(SharedDocument.id.in_(doc_ids)).delete(synchronize_session=False)
        db.query(DocumentRating).filter(DocumentRating.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Video documents ──
    try:
        db.query(VideoDocument).filter(VideoDocument.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Study sessions ──
    try:
        db.query(StudySession).filter(StudySession.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Social media & cross-posting ──
    try:
        db.query(CrossPost).filter(CrossPost.user_id == user_id).delete(synchronize_session=False)
        db.query(SocialMediaAccount).filter(SocialMediaAccount.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Payment logs ──
    try:
        db.query(PaymentLog).filter(PaymentLog.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Moderation logs ──
    try:
        db.query(ModerationLog).filter(
            (ModerationLog.user_id == user_id) | (ModerationLog.admin_id == user_id)
        ).delete(synchronize_session=False)
    except Exception:
        pass

    # ── Messages & conversations (original) ──
    db.query(Message).filter(Message.sender_id == user_id).delete(synchronize_session=False)
    db.query(ConversationParticipant).filter(ConversationParticipant.user_id == user_id).delete(synchronize_session=False)

    # ── Wall posts & interactions ──
    db.query(PostBookmark).filter(PostBookmark.user_id == user_id).delete(synchronize_session=False)
    db.query(PostShare).filter(PostShare.user_id == user_id).delete(synchronize_session=False)
    db.query(PostReaction).filter(PostReaction.user_id == user_id).delete(synchronize_session=False)
    db.query(PostComment).filter(PostComment.author_id == user_id).delete(synchronize_session=False)
    db.query(PostLike).filter(PostLike.user_id == user_id).delete(synchronize_session=False)
    db.query(WallPost).filter(WallPost.author_id == user_id).delete(synchronize_session=False)
    db.query(WallPost).filter(WallPost.wall_owner_id == user_id).delete(synchronize_session=False)

    # ── Friendships, friend lists, blocks, reports ──
    try:
        list_ids = [fl.id for fl in db.query(FriendList).filter(FriendList.user_id == user_id).all()]
        if list_ids:
            db.query(FriendListMember).filter(FriendListMember.list_id.in_(list_ids)).delete(synchronize_session=False)
        db.query(FriendListMember).filter(FriendListMember.friend_id == user_id).delete(synchronize_session=False)
        db.query(FriendList).filter(FriendList.user_id == user_id).delete(synchronize_session=False)
    except Exception:
        pass

    db.query(Friendship).filter((Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id)).delete(synchronize_session=False)
    db.query(BlockedUser).filter((BlockedUser.blocker_id == user_id) | (BlockedUser.blocked_id == user_id)).delete(synchronize_session=False)
    db.query(UserReport).filter((UserReport.reporter_id == user_id) | (UserReport.reported_id == user_id)).delete(synchronize_session=False)

    # ── Conversation folders ──
    folder_ids = [f.id for f in db.query(ConversationFolder).filter(ConversationFolder.user_id == user_id).all()]
    if folder_ids:
        db.query(ConversationFolderItem).filter(ConversationFolderItem.folder_id.in_(folder_ids)).delete(synchronize_session=False)
    db.query(ConversationFolder).filter(ConversationFolder.user_id == user_id).delete(synchronize_session=False)

    # ── Finally, delete the user record ──
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)

    db.commit()

    return {"status": "deleted", "message": "Tu cuenta ha sido eliminada permanentemente."}
