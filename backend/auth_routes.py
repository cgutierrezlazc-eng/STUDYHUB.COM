"""
Auth routes: registration, login, profile, email verification, username management.
"""
import hashlib
import random
import string
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, User, gen_id, DATA_DIR
from middleware import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# ─── Password hashing (simple sha256 + salt for MVP) ────────────

def hash_password(password: str) -> str:
    salt = ''.join(random.choices(string.ascii_letters, k=8))
    hashed = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored: str) -> bool:
    # Support bcrypt hashes (used by owner account)
    if stored.startswith("$2b$") or stored.startswith("$2a$"):
        import bcrypt
        return bcrypt.checkpw(password.encode(), stored.encode())
    if ':' not in stored:
        return False
    salt, hashed = stored.split(':', 1)
    return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == hashed


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


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    language: Optional[str] = None
    language_skill: Optional[str] = None
    university: Optional[str] = None
    career: Optional[str] = None
    semester: Optional[int] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    theme: Optional[str] = None


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

def user_to_dict(user: User) -> dict:
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
        "trialStartedAt": user.trial_started_at.isoformat() if user.trial_started_at else None,
        "subscriptionExpiresAt": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "createdAt": user.created_at.isoformat() if user.created_at else "",
        "lastLogin": user.last_login.isoformat() if user.last_login else "",
    }


# ─── Routes ─────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
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

    # Check if admin
    admin_email = get_admin_email()
    is_admin = admin_email and req.email.lower() == admin_email

    user = User(
        id=gen_id(),
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        username=username,
        user_number=get_next_user_number(db),
        first_name=req.first_name,
        last_name=req.last_name,
        avatar=req.avatar or None,
        gender=req.gender or "unspecified",
        language=req.language or "es",
        language_skill="intermediate",
        university=req.university or "",
        career=req.career or "",
        semester=req.semester or 1,
        phone=req.phone or "",
        birth_date=req.birth_date or "",
        bio=req.bio or "",
        provider="email",
        email_verified=False,
        verification_code=verification_code,
        is_banned=False,
        ban_reason=None,
        is_admin=is_admin,
        role="user",
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

    # Send verification email
    try:
        from notifications import enqueue_email, _wrap
        verify_html = _wrap(f"""
            <p>Hola <span class="highlight">{req.first_name}</span>,</p>
            <p>Bienvenido a Conniku. Tu código de verificación es:</p>
            <div style="text-align:center; margin:20px 0;">
                <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:#4f8cff;
                             background:#f0f4ff; padding:12px 24px; border-radius:8px; display:inline-block;">
                    {verification_code}
                </span>
            </div>
            <p>Ingresa este código en la aplicación para verificar tu correo electrónico.</p>
            <p style="color:#999; font-size:13px;">Este código expira en 30 minutos. Si no solicitaste esta cuenta, ignora este mensaje.</p>
        """)
        enqueue_email(user.email, "Verifica tu cuenta de Conniku", verify_html)
    except Exception:
        pass  # Don't block registration if email fails

    token = create_access_token(user.id)
    return {
        "token": token,
        "user": user_to_dict(user),
        "verificationCode": verification_code,  # MVP: return code directly for testing
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(401, "No existe una cuenta con este correo")

    if not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Contraseña incorrecta")

    if user.is_banned:
        raise HTTPException(403, f"Cuenta suspendida: {user.ban_reason or 'Violación de políticas'}")

    if not user.email_verified:
        # For MVP, auto-verify on login
        user.email_verified = True

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(user.id)
    return {"token": token, "user": user_to_dict(user)}


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return user_to_dict(user)


@router.put("/me")
def update_me(req: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    updates = req.dict(exclude_none=True)
    for key, value in updates.items():
        # Convert camelCase to snake_case for db fields
        db_key = key
        if hasattr(user, db_key):
            setattr(user, db_key, value)
    db.commit()
    db.refresh(user)
    return user_to_dict(user)


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

    if len(req.new_password) < 6:
        raise HTTPException(400, "La nueva contraseña debe tener al menos 6 caracteres")

    user.password_hash = hash_password(req.new_password)
    db.commit()

    return {"status": "ok"}


# ─── Password Recovery ─────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Don't reveal if email exists
        return {"sent": True, "code": None}

    code = ''.join(random.choices(string.digits, k=6))
    from datetime import timedelta
    user.reset_code = code
    user.reset_code_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    # MVP: return code directly for testing (in production, send via email)
    return {"sent": True, "code": code}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(400, "No se encontró la cuenta")

    if not user.reset_code or user.reset_code != req.code:
        raise HTTPException(400, "Código incorrecto")

    if user.reset_code_expires and user.reset_code_expires < datetime.utcnow():
        raise HTTPException(400, "El código ha expirado")

    if len(req.new_password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")

    user.password_hash = hash_password(req.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()

    return {"success": True}
