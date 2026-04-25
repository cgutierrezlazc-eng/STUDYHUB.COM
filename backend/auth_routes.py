"""
Auth routes: registration, login, profile, email verification, username management.
"""
import hashlib
import html
import logging
import os
import random
import re
import string
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional

import bcrypt
from database import (
    DATA_DIR,
    CookieConsent,
    DocumentView,
    TutoringRequest,
    User,
    UserAgreement,
    UserSession,
    gen_id,
    get_db,
)
from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Request, UploadFile
from middleware import create_access_token, create_refresh_token, decode_token, get_current_user
from pydantic import BaseModel, EmailStr
from shared.legal_texts import AGE_DECLARATION_HASH, AGE_DECLARATION_VERSION
from constants.legal_versions import (
    CANONICAL_DOC_HASHES,
    CANONICAL_DOC_VERSIONS,
    COOKIE_CONSENT_POLICY_HASH,
    COOKIE_CONSENT_POLICY_VERSION,
    DOC_KEY_TO_AGREEMENT_HASH,
    DOC_KEY_TO_DOCUMENT_TYPE,
    REACCEPT_DOCUMENTS,
)
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

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


# ─── Legal agreements (CLAUDE.md §Verificación de edad - Componente 3) ─

def _get_client_ip(request: Request | None) -> str | None:
    """Extrae IP del request respetando X-Forwarded-For (proxies tipo Render).

    Toma la primera IP de la lista (la del cliente real), no la del último proxy.
    """
    if not request:
        return None
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return None


def record_age_declaration(
    db: Session,
    user_id: str,
    request: Request | None,
    user_timezone: str | None,
    document_type: str = "age_declaration",
    text_version: str = AGE_DECLARATION_VERSION,
    text_version_hash: str = AGE_DECLARATION_HASH,
) -> UserAgreement:
    """Registra aceptación del checkbox declarativo de edad.

    Crea una fila en user_agreements con los 7 campos probatorios exigidos
    por CLAUDE.md §Componente 3 (timestamp UTC, zona horaria, IP, user-agent,
    hash del texto aceptado, user_id, versión).

    Debe llamarse DENTRO de la misma transacción que crea al User. El
    commit lo ejecuta el caller.
    """
    agreement = UserAgreement(
        user_id=user_id,
        document_type=document_type,
        text_version=text_version,
        text_version_hash=text_version_hash,
        accepted_at_utc=datetime.utcnow(),
        user_timezone=user_timezone,
        client_ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent", "") if request else None,
    )
    db.add(agreement)
    return agreement


# ─── Validación de evidencia de lectura y registro de consentimiento multi-doc ─
# Bloque multi-document-consent-v1 — Decisiones D-M2/D-M5/D-M6 aprobadas 2026-04-21.
#
# Referencia legal:
# - GDPR Art. 7(1): el responsable debe demostrar que el interesado consintió.
#   URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
# - Ley 19.628 Art. 4° (Chile): consentimiento expreso del titular.
#   URL: https://www.bcn.cl/leychile/navegar?idNorma=141599

REQUIRED_DOC_KEYS: list[str] = ["terms", "privacy", "cookies", "age-declaration"]


def validate_legal_reading_evidence(
    db: Session,
    legal_session_token: str,
) -> dict[str, DocumentView]:
    """Valida que el session_token tenga evidencia de lectura de los 4 documentos.

    Verifica:
    1. Que existan 4 filas en document_views con scrolled_to_end=True, una por
       cada doc_key requerido (terms, privacy, cookies, age-declaration).
    2. Que los doc_hash de cada fila coincidan con los hashes canónicos vigentes
       (protección contra cache stale o versión desactualizada).
    3. Que el session_token no esté ya vinculado a un usuario (previene reuso).

    Retorna: dict[doc_key → DocumentView] con el último registro válido por doc.
    Lanza HTTPException 422 si faltan documentos o hashes incorrectos.
    Lanza HTTPException 409 si session_token ya está vinculado a usuario.
    """
    # Verificar idempotencia: si las views ya tienen user_id, el token fue usado
    existing_linked = (
        db.query(DocumentView)
        .filter(
            DocumentView.session_token == legal_session_token,
            DocumentView.user_id.isnot(None),
        )
        .first()
    )
    if existing_linked is not None:
        raise HTTPException(
            409,
            "Este token de sesión de consentimiento ya fue utilizado en un registro previo.",
        )

    # Recuperar todas las vistas con scrolled_to_end=True para este token
    views = (
        db.query(DocumentView)
        .filter(
            DocumentView.session_token == legal_session_token,
            DocumentView.scrolled_to_end.is_(True),
        )
        .all()
    )

    # Agrupar por doc_key — tomar la más reciente (mayor viewed_at_utc)
    latest_by_key: dict[str, DocumentView] = {}
    for view in views:
        existing = latest_by_key.get(view.doc_key)
        if existing is None or view.viewed_at_utc > existing.viewed_at_utc:
            latest_by_key[view.doc_key] = view

    # Validar que los 4 docs requeridos estén presentes
    missing_docs = [key for key in REQUIRED_DOC_KEYS if key not in latest_by_key]
    if missing_docs:
        missing_display = ", ".join(missing_docs)
        raise HTTPException(
            422,
            f"Debes leer los 4 documentos legales antes de registrarte: {missing_display}",
        )

    # Validar que los hashes coincidan con los vigentes (R-A2 del plan)
    hash_mismatches: list[str] = []
    for doc_key in REQUIRED_DOC_KEYS:
        view = latest_by_key[doc_key]
        expected_hash = CANONICAL_DOC_HASHES.get(doc_key, "")
        if view.doc_hash != expected_hash:
            hash_mismatches.append(doc_key)

    if hash_mismatches:
        raise HTTPException(
            422,
            "La versión de los documentos ha cambiado. Recarga la página e intenta de nuevo. "
            f"Documentos con hash desactualizado: {', '.join(hash_mismatches)}",
        )

    return latest_by_key


def record_multi_document_consent(
    db: Session,
    user_id: str,
    legal_session_token: str,
    request: Request | None,
    user_timezone: str | None,
    latest_by_key: dict[str, "DocumentView"],
) -> None:
    """Registra el consentimiento multi-documento de forma atómica.

    Dentro de la misma transacción que crea al usuario:
    1. Crea 4 filas en user_agreements (terms, privacy, cookies, age_declaration).
    2. Transfiere document_views del session_token al user_id.
    3. Crea 1 fila en cookie_consents con categories_accepted=['necessary'].

    Debe llamarse DENTRO de la transacción (antes del db.commit() del caller).
    """
    import json as _json

    now_utc = datetime.utcnow()
    client_ip = _get_client_ip(request)
    user_agent_str = request.headers.get("user-agent", "") if request else None

    # 1. Crear 4 filas user_agreements
    for doc_key in REQUIRED_DOC_KEYS:
        doc_type = DOC_KEY_TO_DOCUMENT_TYPE[doc_key]
        version, hash_val = DOC_KEY_TO_AGREEMENT_HASH[doc_key]
        agreement = UserAgreement(
            user_id=user_id,
            document_type=doc_type,
            text_version=version,
            text_version_hash=hash_val,
            accepted_at_utc=now_utc,
            user_timezone=user_timezone,
            client_ip=client_ip,
            user_agent=user_agent_str,
        )
        db.add(agreement)

    # 2. Transferir document_views: user_id = new_user.id
    db.query(DocumentView).filter(
        DocumentView.session_token == legal_session_token
    ).update({"user_id": user_id}, synchronize_session="fetch")

    # 3. Crear cookie_consent mínimo con ['necessary']
    # Referencia: GDPR Art. 5(3) ePrivacy — solo necesarias por defecto.
    retention_expires = now_utc + timedelta(days=365)  # 1 año de retención del banner
    cookie_consent = CookieConsent(
        visitor_uuid=legal_session_token,  # reutilizamos como visitor_uuid para trazar
        user_id=user_id,
        accepted_at_utc=now_utc,
        user_timezone=user_timezone,
        client_ip=client_ip,
        user_agent=user_agent_str,
        policy_version=COOKIE_CONSENT_POLICY_VERSION,
        policy_hash=COOKIE_CONSENT_POLICY_HASH,
        categories_accepted=_json.dumps(["necessary"]),
        origin="register",
        retention_expires_at=retention_expires,
        revoked_at_utc=None,
        revocation_reason=None,
    )
    db.add(cookie_consent)


# ─── Username content moderation ───────────────────────────────
BLOCKED_USERNAME_TERMS = {
    'admin', 'root', 'conniku', 'soporte', 'support', 'moderador', 'moderator',
    'staff', 'sistema', 'system', 'oficial', 'official',
    # Offensive / hate
    'nigger', 'nigga', 'nazi', 'faggot', 'puta', 'puto', 'mierda', 'pendejo',
    'culero', 'marica', 'hijodeputa', 'bastardo', 'cabron', 'chingado', 'idiota',
    'imbecil', 'estupido', 'retardo', 'fuck', 'shit', 'bitch', 'asshole', 'cunt',
    'whore', 'slut', 'rape', 'porno', 'sexo', 'sex', 'xxx', 'hate', 'terror',
    'pedofilo', 'pedophile',
}

def is_username_allowed(username: str) -> bool:
    """Returns False if username contains any blocked term."""
    normalized = re.sub(r'[_.\-]', '', username.lower())
    return not any(term in normalized for term in BLOCKED_USERNAME_TERMS)


# ─── Auto-generate username ─────────────────────────────────────

def _normalize_name_part(s: str) -> str:
    """Strip accents and special chars, title-case for username segments."""
    import unicodedata
    nfkd = unicodedata.normalize('NFD', s)
    ascii_str = ''.join(c for c in nfkd if unicodedata.category(c) != 'Mn')
    ascii_str = ascii_str.replace('ñ', 'n').replace('Ñ', 'N')
    # Keep only alphanumeric
    clean = ''.join(c for c in ascii_str if c.isalnum())
    return clean.capitalize() if clean else ''


def generate_username(first_name: str, db: Session,
                      last_name: str = '', institution_code: str = '') -> str:
    first_part = _normalize_name_part(first_name)
    last_part = _normalize_name_part(last_name)

    if institution_code:
        # Format: CODE_FirstName_LastName (with numeric suffix on conflict)
        prefix = institution_code.upper()[:3] + '_'
        base_suffix = (first_part or 'Usuario') + ('_' + last_part if last_part else '')
        candidate = prefix + base_suffix
        if not db.query(User).filter(User.username == candidate).first():
            return candidate
        # Try numeric suffixes
        for n in range(2, 200):
            candidate = f"{prefix}{base_suffix}_{n}"
            if not db.query(User).filter(User.username == candidate).first():
                return candidate
        return prefix + base_suffix + '_' + str(random.randint(1000, 9999))
    else:
        # Legacy fallback: lowercase first_name + 4 random digits
        base = (first_part or 'user').lower()[:15]
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
    username: str | None = None
    tos_accepted: bool = False
    # Componente 2 de CLAUDE.md §Verificación de edad: checkbox declarativo de 5 puntos.
    age_declaration_accepted: bool = False
    # Hash SHA-256 hex del texto exacto que vio el usuario; debe coincidir con
    # shared.legal_texts.AGE_DECLARATION_HASH o se rechaza (detecta tampering/cache stale).
    accepted_text_version_hash: str = ""
    # Zona horaria del cliente en el momento del registro (Intl.DateTimeFormat().resolvedOptions().timeZone).
    user_timezone: str | None = None
    referral_code: str | None = None
    academic_status: str = "estudiante"
    graduation_status_year: int | None = None
    title_year: int | None = None
    offers_mentoring: bool = False
    mentoring_services: list = []
    mentoring_subjects: list = []
    mentoring_description: str = ""
    mentoring_price_type: str = "free"
    mentoring_price_per_hour: float | None = None
    professional_title: str = ""
    study_start_date: str = ""
    # UUID4 generado por el frontend al iniciar el flujo de consentimiento.
    # Identifica la sesión anónima cuyas document_views se transfieren al usuario
    # al completar el registro (D-M2 = A, D-M5 = A).
    # Referencia: GDPR Art. 7(1) — el responsable debe demostrar el consentimiento.
    # URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
    legal_session_token: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    language: str | None = None
    language_skill: str | None = None
    secondary_languages: list | None = None
    platform_language: str | None = None
    university: str | None = None
    career: str | None = None
    semester: int | None = None
    phone: str | None = None
    birth_date: str | None = None
    bio: str | None = None
    avatar: str | None = None
    theme: str | None = None
    academic_status: str | None = None
    graduation_status_year: int | None = None
    title_year: int | None = None
    offers_mentoring: bool | None = None
    mentoring_services: list | None = None
    mentoring_subjects: list | None = None
    mentoring_description: str | None = None
    mentoring_price_type: str | None = None
    mentoring_price_per_hour: float | None = None
    professional_title: str | None = None
    study_start_date: str | None = None
    cover_photo: str | None = None
    cover_type: str | None = None
    email_notif_enabled: bool | None = None
    email_notif_friend_posts: bool | None = None
    email_notif_friend_requests: bool | None = None
    email_notif_direct_messages: bool | None = None


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
        "coverPositionY": getattr(user, 'cover_position_y', 50) or 50,
        "studyStartDate": getattr(user, 'study_start_date', '') or "",
        "studyDays": _calc_study_days(getattr(user, 'study_start_date', '') or ""),
        "executiveShowcase": _json.loads(getattr(user, 'executive_showcase', None) or "[]"),
        "emailNotifEnabled": getattr(user, 'email_notif_enabled', True) if getattr(user, 'email_notif_enabled', None) is not None else True,
        "emailNotifFriendPosts": getattr(user, 'email_notif_friend_posts', True) if getattr(user, 'email_notif_friend_posts', None) is not None else True,
        "emailNotifFriendRequests": getattr(user, 'email_notif_friend_requests', True) if getattr(user, 'email_notif_friend_requests', None) is not None else True,
        "emailNotifDirectMessages": getattr(user, 'email_notif_direct_messages', True) if getattr(user, 'email_notif_direct_messages', None) is not None else True,
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
                raise HTTPException(
                    403,
                    "Conniku es una plataforma exclusiva para personas mayores de 18 años. "
                    "No podemos procesar tu registro.",
                )
        except ValueError as exc:
            raise HTTPException(400, "Formato de fecha de nacimiento inválido (usar YYYY-MM-DD)") from exc
    else:
        raise HTTPException(400, "Fecha de nacimiento es obligatoria")

    # Declaración de edad (checkbox de 5 puntos, CLAUDE.md §Componente 2).
    # Dos validaciones independientes:
    #   1. Checkbox marcado (age_declaration_accepted = True)
    #   2. Hash del texto recibido coincide con el canónico (detecta tampering o cache stale)
    if not req.age_declaration_accepted:
        raise HTTPException(
            400,
            "Debes aceptar la declaración de edad para continuar con el registro.",
        )
    if req.accepted_text_version_hash != AGE_DECLARATION_HASH:
        raise HTTPException(
            400,
            "La versión del texto aceptado no coincide. Recarga la página e intenta de nuevo.",
        )

    # TOS debe aceptarse (mantenido por compatibilidad con Subscription/UI legada;
    # la fuente de verdad probatoria es la tabla user_agreements, no este boolean).
    if not req.tos_accepted:
        raise HTTPException(400, "Debes aceptar los términos de servicio")

    # Validar evidencia de lectura de los 4 documentos legales (D-M6 = A).
    # Lanza 422 si faltan documentos, hashes incorrectos, o 409 si ya fue usado.
    # Referencia: GDPR Art. 7(1) — el responsable debe demostrar el consentimiento.
    legal_views = validate_legal_reading_evidence(db, req.legal_session_token)

    import json as _json

    # Generate or validate username
    if req.username:
        username = req.username.strip()
        if len(username) < 5 or len(username) > 30:
            raise HTTPException(400, "El nombre de usuario debe tener entre 5 y 30 caracteres")
        if not re.match(r'^[a-zA-Z0-9._]+$', username):
            raise HTTPException(400, "El nombre de usuario solo puede contener letras, números, puntos y guiones bajos")
        if not is_username_allowed(username):
            raise HTTPException(400, "Este nombre de usuario no está permitido. Elige otro.")
        if db.query(User).filter(User.username == username).first():
            raise HTTPException(400, "Este nombre de usuario ya está en uso")
    else:
        username = generate_username(req.first_name, db, req.last_name)

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
    db.flush()  # asegura user.id disponible sin soltar la transacción

    # Registrar consentimiento multi-documento como evidencia probatoria atómica.
    # Crea 4 user_agreements + transfiere document_views + crea cookie_consent mínimo.
    # Referencia: GDPR Art. 7(1) — demostrabilidad del consentimiento.
    # Bloque multi-document-consent-v1, D-M5 = A.
    try:
        record_multi_document_consent(
            db=db,
            user_id=user.id,
            legal_session_token=req.legal_session_token,
            request=request,
            user_timezone=req.user_timezone,
            latest_by_key=legal_views,
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Error al registrar evidencia legal del consentimiento. "
                   "El registro se revirtió; por favor intenta de nuevo."
        ) from exc

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
                from database import Conversation, ConversationParticipant, Friendship, Message
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
        db.rollback()

    # Send verification email
    try:
        from notifications import _email_template, _send_email_async
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
        from database import Conversation, ConversationParticipant, Message
        from database import gen_id as _gen_id
        # Create a system conversation for welcome
        conv = Conversation(
            id=_gen_id(),
            type="direct",
            name="Bienvenida Conniku",
            description="Mensaje de bienvenida",
            created_by=user.id,
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
            sender_id=user.id,  # Changed from None to user.id to prevent IntegrityError
            content=welcome_content,
            message_type="system",
        )
        db.add(msg)
        db.commit()
    except Exception as e:
        logger.warning(f"Welcome message failed: {e}")
        db.rollback()

    token = create_access_token(user.id)
    refresh_tok = create_refresh_token(user.id)
    try:
        _register_session(db, user.id, token, request)
    except Exception as e:
        logger.warning(f"Session tracking failed on register: {e}")
    return {
        "token": token,
        "refresh_token": refresh_tok,
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
    refresh_tok = create_refresh_token(user.id)
    try:
        _register_session(db, user.id, token, request)
    except Exception as e:
        logger.warning(f"Session tracking failed on login: {e}")
    return {"token": token, "refresh_token": refresh_tok, "user": user_to_dict(user)}


class GoogleAuthRequest(BaseModel):
    credential: str  # Google JWT token
    # Campos opcionales para registro nuevo (CLAUDE.md §Componente 2).
    # Solo requeridos cuando Google OAuth crea una cuenta nueva; usuarios
    # existentes hacen login sin volver a pedirlos.
    date_of_birth: str | None = None  # ISO YYYY-MM-DD
    age_declaration_accepted: bool = False
    accepted_text_version_hash: str = ""
    user_timezone: str | None = None


@router.post("/google")
def google_auth(req: GoogleAuthRequest, request: Request = None, db: Session = Depends(get_db)):
    """Authenticate with Google credential. Creates account if needed."""
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

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
        # Nueva cuenta Google: exigir los mismos componentes de CLAUDE.md
        # §Verificación de edad que el registro email+password. Si el cliente
        # no los envía, devolvemos 403 con `requires_age_declaration` para que
        # el frontend muestre el modal post-OAuth y reintente.
        if (
            not req.age_declaration_accepted
            or not req.date_of_birth
            or req.accepted_text_version_hash != AGE_DECLARATION_HASH
        ):
            raise HTTPException(
                status_code=403,
                detail={
                    "requires_age_declaration": True,
                    "message": (
                        "Para crear una cuenta con Google debes confirmar tu fecha de "
                        "nacimiento y aceptar la declaración de edad."
                    ),
                },
            )

        # Validar edad 18+ con fecha enviada por el cliente.
        try:
            birth = date.fromisoformat(req.date_of_birth)
            today = date.today()
            age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except ValueError as exc:
            raise HTTPException(400, "Formato de fecha de nacimiento inválido (usar YYYY-MM-DD)") from exc
        if age < 18:
            raise HTTPException(
                403,
                "Conniku es una plataforma exclusiva para personas mayores de 18 años. "
                "No podemos procesar tu registro.",
            )

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
            birth_date=req.date_of_birth,
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
        db.flush()

        # Registrar aceptación del checkbox declarativo (evidencia probatoria).
        record_age_declaration(
            db=db,
            user_id=user.id,
            request=request,
            user_timezone=req.user_timezone,
        )

        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    refresh_tok = create_refresh_token(user.id)
    try:
        _register_session(db, user.id, token, request)
    except Exception as e:
        logger.warning(f"Session tracking failed on google auth: {e}")
    return {"token": token, "refresh_token": refresh_tok, "user": user_to_dict(user)}


@router.post("/refresh")
def refresh_token(data: dict = Body(...)):
    """Intercambia un refresh token válido por un nuevo access token."""
    refresh_tok = data.get("refresh_token", "")
    if not refresh_tok:
        raise HTTPException(status_code=401, detail="Refresh token requerido")
    user_id = decode_token(refresh_tok, token_type="refresh")
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    new_access_token = create_access_token(user_id)
    return {"access_token": new_access_token, "token_type": "bearer"}


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
            # Sanitize text fields to prevent stored XSS
            if isinstance(value, str):
                import html as _html
                value = _html.escape(value)
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


# ─── Bio automática ───────────────────────────────────────────────────────────

def _generate_bio_text(user: User, db) -> str:
    """Call Claude to generate a professional bio from user profile, CV data, and completed courses."""
    import json as _json
    import os

    import anthropic as _anthropic
    from database import Course, UserCourseProgress, WallPost

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return ""

    # Gather context
    academic_status_labels = {"estudiante": "Estudiante", "egresado": "Egresado", "titulado": "Titulado"}
    status_label = academic_status_labels.get(getattr(user, "academic_status", "estudiante"), "Estudiante")

    cv_headline       = getattr(user, "cv_headline", "") or ""
    cv_summary        = getattr(user, "cv_summary", "") or ""
    cv_skills_raw     = getattr(user, "cv_skills", "") or ""
    cv_experience_raw = getattr(user, "cv_experience", "") or ""

    # Completed courses (with titles and categories)
    try:
        completed_progress = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == user.id,
            UserCourseProgress.completed == True
        ).limit(10).all()
        if completed_progress:
            course_ids = [p.course_id for p in completed_progress]
            courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
            course_map = {c.id: c for c in courses}
            completed_courses_text = "\n".join(
                f"- {course_map[p.course_id].title} ({course_map[p.course_id].category.replace('_', ' ')})"
                for p in completed_progress if p.course_id in course_map
            )
        else:
            completed_courses_text = "Ninguno completado aún"
    except Exception:
        completed_courses_text = "No disponible"

    # Recent milestones from wall posts
    try:
        milestone_posts = db.query(WallPost).filter(
            WallPost.author_id == user.id,
            WallPost.is_milestone == True
        ).order_by(WallPost.created_at.desc()).limit(3).all()
        milestones_text = "\n".join(f"- {p.content}" for p in milestone_posts) if milestone_posts else "Ninguno aún"
    except Exception:
        milestones_text = "Ninguno aún"

    prompt = f"""Eres un redactor profesional de perfiles. Escribe una bio de 2 a 4 oraciones en español para esta persona.

REGLAS:
- Solo párrafo corrido, sin puntos, sin listas, sin títulos ni comillas
- Natural y convincente — como una presentación de LinkedIn de alto nivel
- No menciones números ni porcentajes de cursos
- Analiza CÓMO los cursos completados COMPLEMENTAN su carrera y experiencia profesional
- Si los cursos son de liderazgo y la persona es ingeniero, menciona capacidad de liderar proyectos
- Si los cursos son de habilidades blandas y la persona trabaja en atención al cliente, menciona eso
- Proyecta potencial si es estudiante. Destaca expertise si ya se tituló.
- Menciona sus herramientas/habilidades técnicas específicas si están disponibles

PERFIL:
- Universidad: {getattr(user, 'university', '') or 'No especificada'}
- Carrera: {getattr(user, 'career', '') or 'No especificada'}
- Estado: {status_label}
- Título profesional: {getattr(user, 'professional_title', '') or 'No aplica'}

CV:
- Titular: {cv_headline or 'No disponible'}
- Resumen: {cv_summary[:400] if cv_summary else 'No disponible'}
- Habilidades: {cv_skills_raw[:300] if cv_skills_raw else 'No disponible'}
- Experiencia: {cv_experience_raw[:400] if cv_experience_raw else 'No disponible'}

CURSOS COMPLETADOS EN CONNIKU:
{completed_courses_text}

LOGROS RECIENTES:
{milestones_text}

BIO PROFESIONAL:"""

    try:
        client = _anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        return resp.content[0].text.strip()
    except Exception as e:
        logging.warning(f"[Bio] Generation error: {e}")
        return ""


@router.post("/me/bio/generate")
def generate_bio(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a professional bio from user profile + CV data. Does not save automatically."""
    bio = _generate_bio_text(user, db)
    if not bio:
        raise HTTPException(503, "No se pudo generar la bio en este momento. Intenta más tarde.")
    return {"bio": bio}


@router.post("/me/bio/auto")
def toggle_bio_auto(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable/disable auto-update of bio on milestones."""
    enabled = bool(body.get("enabled", False))
    user.bio_auto = enabled
    db.commit()
    return {"bioAuto": enabled}


@router.post("/profile/cover")
async def update_cover_photo(
    file: UploadFile = File(None),
    template_id: str = Form(None),
    position_y: int = Form(50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user cover photo: upload a custom image (stored as base64) or select a template."""
    import base64 as _b64
    if file:
        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        content_type = file.content_type or "image/jpeg"
        if content_type not in allowed_types:
            raise HTTPException(400, "Formato de imagen no soportado. Usa JPG, PNG, WebP o GIF.")
        # Read and check size (max 3MB — base64 will be ~4MB in DB)
        content = await file.read()
        if len(content) > 3 * 1024 * 1024:
            raise HTTPException(400, "La imagen no puede superar 3MB.")
        # Encode as base64 data URI — stored directly in DB (no filesystem needed)
        b64_data = _b64.b64encode(content).decode("utf-8")
        user.cover_photo = f"data:{content_type};base64,{b64_data}"
        user.cover_type = "custom"
    elif template_id:
        user.cover_photo = template_id
        user.cover_type = "template"
    else:
        raise HTTPException(400, "Debes enviar una imagen o seleccionar una plantilla.")

    user.cover_position_y = max(0, min(100, position_y))
    db.commit()
    return {
        "coverPhoto": user.cover_photo,
        "coverType": user.cover_type,
        "coverPositionY": getattr(user, 'cover_position_y', 50),
    }


@router.put("/me/username")
def change_username(req: UsernameRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    username = req.username.strip()
    if len(username) < 5 or len(username) > 30:
        raise HTTPException(400, "El nombre de usuario debe tener entre 5 y 30 caracteres")
    if not re.match(r'^[a-zA-Z0-9._]+$', username):
        raise HTTPException(400, "Solo letras, números, puntos y guiones bajos")
    if not is_username_allowed(username):
        raise HTTPException(400, "Este nombre de usuario no está permitido. Elige otro.")

    existing = db.query(User).filter(User.username == username, User.id != user.id).first()
    if existing:
        raise HTTPException(400, "Este nombre de usuario ya está en uso")

    user.username = username
    db.commit()
    return {"username": user.username}


@router.get("/check-username")
def check_username(q: str, db: Session = Depends(get_db)):
    username = q.strip()
    if not username or len(username) < 3:
        return {"available": False}
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
        from notifications import _email_template, _send_email_async
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
    expected_key = os.environ.get("SETUP_KEY", "")
    if not expected_key:
        raise HTTPException(503, "Setup endpoint not configured. Set SETUP_KEY env var.")
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
    subject: str | None = None,
    price_type: str | None = None,
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
        from notifications import _email_template, _send_email_async
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
        _send_email_async("contacto@conniku.com", f"[{type_label}] {req.subject} — {user.first_name}", html, reply_to=user.email, from_account="contacto")
    except Exception:
        pass
    return {"sent": True}

@router.post("/me/closure-feedback")
def account_closure_feedback(req: AccountClosureFeedback, user: User = Depends(get_current_user)):
    """Send account closure feedback to CEO email."""
    try:
        from notifications import _email_template, _send_email_async
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
        AcademicMilestone,
        BlockedUser,
        CalendarEvent,
        Certificate,
        ClassAttendance,
        CommunityMember,
        CommunityPost,
        CommunityPostComment,
        CommunityPostLike,
        ConferenceParticipant,
        Conversation,
        ConversationFolder,
        ConversationFolderItem,
        ConversationParticipant,
        CrossPost,
        DocumentRating,
        EventRSVP,
        FlashcardReview,
        FriendList,
        FriendListMember,
        Friendship,
        InAppNotification,
        JobApplication,
        JobListing,
        LeagueMembership,
        MentorProfile,
        MentorshipRelation,
        Message,
        ModerationLog,
        MoodCheckIn,
        PaymentLog,
        Poll,
        PollOption,
        PollVote,
        PostBookmark,
        PostComment,
        PostLike,
        PostReaction,
        PostShare,
        PushSubscription,
        QuizHistory,
        RecruiterProfile,
        ScheduledQuiz,
        SharedDocument,
        SkillEndorsement,
        SocialMediaAccount,
        StudentCV,
        StudyEvent,
        StudyPlan,
        StudyRoom,
        StudyRoomParticipant,
        StudySession,
        TutoringListing,
        TutoringListingRequest,
        TutoringRequest,
        UserCareerStatus,
        UserCourseProgress,
        UserDownload,
        UserExerciseHistory,
        UserReport,
        UserSession,
        UserSkill,
        VideoConference,
        VideoDocument,
        WallPost,
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


# ─── Executive Showcase (MAX plan) ─────────────────────────────────────────────

@router.get("/me/executive-showcase")
def get_executive_showcase(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the current user's executive showcase items."""
    import json as _json
    return {"items": _json.loads(getattr(user, 'executive_showcase', None) or "[]")}


@router.put("/me/executive-showcase")
def update_executive_showcase(
    items: list = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace the user's executive showcase items (MAX plan only)."""
    import json as _json
    tier = getattr(user, 'subscription_tier', 'free') or 'free'
    if tier != 'max' and getattr(user, 'role', 'user') not in ('owner', 'admin'):
        raise HTTPException(403, "El Showcase Ejecutivo requiere plan MAX")
    if len(items) > 50:
        raise HTTPException(400, "Máximo 50 items en el showcase")
    # Validate structure
    for item in items:
        if not isinstance(item, dict) or not item.get('title'):
            raise HTTPException(400, "Cada item debe tener al menos un título")
    user.executive_showcase = _json.dumps(items)
    db.commit()
    return {"ok": True, "items": items}


@router.get("/users/{user_id}/executive-showcase")
def get_user_executive_showcase(
    user_id: str,
    db: Session = Depends(get_db),
):
    """Public endpoint: get another user's executive showcase (MAX users only)."""
    import json as _json
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")
    tier = getattr(target, 'subscription_tier', 'free') or 'free'
    if tier != 'max' and getattr(target, 'role', 'user') not in ('owner', 'admin'):
        return {"items": []}  # Non-MAX users have no showcase
    return {"items": _json.loads(getattr(target, 'executive_showcase', None) or "[]")}


# ─── Migrate existing usernames to institution prefix format ───────────────
# Maps known university names (substrings) → 3-letter prefix
_UNI_PREFIX_MAP = {
    'universidad de chile': 'UCH', 'pontificia universidad católica de chile': 'PUC',
    'pontificia universidad catolica de chile': 'PUC',
    'universidad de concepción': 'UDE', 'universidad de concepcion': 'UDE',
    'universidad de santiago': 'USA', 'universidad técnica federico santa maría': 'USM',
    'universidad tecnica federico santa maria': 'USM',
    'pontificia universidad católica de valparaíso': 'PUV',
    'pontificia universidad catolica de valparaiso': 'PUV',
    'universidad austral': 'UAC', 'universidad de valparaíso': 'UVA',
    'universidad de valparaiso': 'UVA', 'universidad del bío-bío': 'UBB',
    'universidad del bio-bio': 'UBB', 'universidad de atacama': 'UDA',
    'universidad de la serena': 'ULS', 'universidad de magallanes': 'UMA',
    'universidad de tarapacá': 'UTA', 'universidad de tarapaca': 'UTA',
    'universidad arturo prat': 'UAP', 'universidad de antofagasta': 'UAN',
    'universidad de la frontera': 'UFR', 'universidad de los lagos': 'ULA',
    'universidad de playa ancha': 'UPA', 'universidad metropolitana': 'UME',
    'universidad tecnológica metropolitana': 'UTM',
    'universidad tecnologica metropolitana': 'UTM',
    'universidad mayor': 'UMA', 'universidad de desarrollo': 'UDD',
    'universidad diego portales': 'UDP', 'universidad finis terrae': 'UFT',
    'universidad adolfo ibáñez': 'UAI', 'universidad adolfo ibanez': 'UAI',
    'universidad del pacífico': 'UPC', 'universidad del pacifico': 'UPC',
    'universidad san sebastián': 'USS', 'universidad san sebastian': 'USS',
    'universidad de los andes': 'ULA', 'universidad bernardo ohiggins': 'UBO',
    'universidad central': 'UCE', 'universidad autónoma': 'UAU',
    'universidad autonoma': 'UAU', 'universidad católica del norte': 'UCN',
    'universidad catolica del norte': 'UCN',
    'universidad católica de temuco': 'UCT', 'universidad catolica de temuco': 'UCT',
    'universidad católica del maule': 'UCM', 'universidad catolica del maule': 'UCM',
    'universidad católica de la santísima concepción': 'UCS',
    'duoc': 'DUO', 'inacap': 'INA', 'aiep': 'AIE', 'cft': 'CFT',
}

def _derive_prefix(university_name: str) -> str:
    """Best-effort: derive 3-letter prefix from a university name."""
    name_lower = university_name.lower().strip()
    for key, code in _UNI_PREFIX_MAP.items():
        if key in name_lower:
            return code
    # Fallback: initials of significant words
    SKIP = {'de', 'del', 'la', 'los', 'las', 'el', 'y', 'e', 'en', 'of', 'the'}
    words = [w for w in name_lower.split() if w not in SKIP and len(w) > 1]
    initials = ''.join(w[0] for w in words[:6]).upper()
    return initials[:3].ljust(3, 'X') if initials else 'CON'


@router.post("/admin/migrate-username-prefixes")
def migrate_username_prefixes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin-only: prepend institution 3-letter prefix to existing usernames.
    Skips: accounts with role='owner', already-prefixed usernames (CODE_ pattern).
    """
    if not (current_user.is_admin or current_user.role in ('owner', 'admin')):
        raise HTTPException(403, "Solo administradores")

    admin_email = get_admin_email()
    users = db.query(User).all()
    updated, skipped, failed = [], [], []

    for u in users:
        # Never touch owner / admin / cristian.ceo
        if u.role == 'owner' or (admin_email and u.email.lower() == admin_email.lower()):
            skipped.append(u.username)
            continue

        # Skip if username already matches CODE_ pattern (3 uppercase + underscore)
        if re.match(r'^[A-Z]{3}_', u.username or ''):
            skipped.append(u.username)
            continue

        if not u.university:
            failed.append({'username': u.username, 'reason': 'sin institución registrada'})
            continue

        prefix = _derive_prefix(u.university) + '_'
        candidate = prefix + (u.username or 'usuario')

        # Ensure uniqueness
        suffix_n = 2
        while db.query(User).filter(User.username == candidate, User.id != u.id).first():
            candidate = prefix + (u.username or 'usuario') + '_' + str(suffix_n)
            suffix_n += 1
            if suffix_n > 999:
                failed.append({'username': u.username, 'reason': 'no se pudo resolver conflicto'})
                break

        old = u.username
        u.username = candidate
        updated.append({'old': old, 'new': candidate})

    db.commit()
    return {
        "updated": len(updated),
        "skipped": len(skipped),
        "failed": len(failed),
        "details": {"updated": updated, "skipped": skipped, "failed": failed}
    }


# ────────────────────────────────────────────────────────────────────────
# Pieza 6 — Re-aceptación de documentos legales (bloque-legal-consolidation-v2)
# ────────────────────────────────────────────────────────────────────────
#
# Cuando Conniku publica una versión nueva de los Términos y Condiciones,
# de la Política de Privacidad o de la Política de Cookies, los usuarios
# existentes NO quedan automáticamente vinculados por la versión nueva.
# Deben re-aceptarla de forma explícita, con la misma evidencia probatoria
# que se exige en el alta: timestamp UTC, hash del texto, IP, user-agent,
# zona horaria, document_type, version.
#
# Mecanismo:
#   1. El frontend llama a ``GET /auth/reaccept-status`` después del login.
#      Responde con la lista de documentos pendientes (ya sea porque el
#      usuario nunca los aceptó o porque aceptó una versión anterior).
#   2. Si la lista está vacía, el usuario continúa normalmente.
#   3. Si no está vacía, el frontend monta LegalReacceptanceModal. El
#      usuario debe abrir cada documento y marcar el checkbox final.
#   4. Al confirmar, el frontend llama a ``POST /auth/reaccept-legal`` con
#      la lista ``[{document_type, text_version, text_version_hash}]``.
#      El backend valida que las ternas coincidan con las publicadas e
#      inserta una fila nueva por documento en ``user_agreements``.
#
# Feature flag ``LEGAL_GATE_ENFORCE``: si está en "false" (default), los
# endpoints funcionan pero el middleware de enforce no bloquea el acceso
# a otras rutas. Esto permite desplegar el código en producción sin
# riesgo de lockout mientras se monitorea. Se activa manualmente una vez
# confirmado el correcto funcionamiento.

LEGAL_GATE_ENFORCE: bool = os.environ.get("LEGAL_GATE_ENFORCE", "false").lower() in ("1", "true", "yes")


def record_document_acceptance(
    db: Session,
    user_id: str,
    request: Request | None,
    user_timezone: str | None,
    document_type: str,
    text_version: str,
    text_version_hash: str,
) -> UserAgreement:
    """Registra la aceptación append-only de un documento legal.

    No elimina filas anteriores: cada nueva aceptación produce una nueva
    fila. Así queda historia completa de qué versiones aceptó el usuario
    a lo largo del tiempo, útil para auditoría y disputas.
    """
    agreement = UserAgreement(
        user_id=user_id,
        document_type=document_type,
        text_version=text_version,
        text_version_hash=text_version_hash,
        accepted_at_utc=datetime.utcnow(),
        user_timezone=user_timezone,
        client_ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent", "") if request else None,
    )
    db.add(agreement)
    return agreement


def _pending_reaccept_for_user(db: Session, user_id: str) -> list[dict]:
    """Devuelve la lista de documentos que este usuario debe re-aceptar.

    Un documento está pendiente cuando NO existe ninguna fila en
    ``user_agreements`` para ese ``document_type`` con el par
    ``(text_version, text_version_hash)`` canónico publicado hoy.
    """
    pending: list[dict] = []
    for document_type, version, hash_value in REACCEPT_DOCUMENTS:
        row = (
            db.query(UserAgreement)
            .filter(
                UserAgreement.user_id == user_id,
                UserAgreement.document_type == document_type,
                UserAgreement.text_version == version,
                UserAgreement.text_version_hash == hash_value,
            )
            .first()
        )
        if row is None:
            pending.append(
                {
                    "document_type": document_type,
                    "version": version,
                    "hash": hash_value,
                }
            )
    return pending


@router.get("/reaccept-status")
def reaccept_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Devuelve qué documentos legales vigentes el usuario aún no ha aceptado.

    Siempre responde 200, incluso cuando hay documentos pendientes: el
    status se infiere de la longitud de ``pending``. El frontend toma la
    decisión de montar el modal o continuar.
    """
    pending = _pending_reaccept_for_user(db, user.id)
    return {
        "user_id": user.id,
        "pending": pending,
        "is_up_to_date": len(pending) == 0,
        "enforce_enabled": LEGAL_GATE_ENFORCE,
    }


class ReacceptDocumentPayload(BaseModel):
    document_type: str
    text_version: str
    text_version_hash: str


class ReacceptLegalRequest(BaseModel):
    documents: list[ReacceptDocumentPayload]
    user_timezone: str | None = None


@router.post("/reaccept-legal")
def reaccept_legal(
    req: ReacceptLegalRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra la re-aceptación por parte del usuario de uno o más documentos.

    Valida que cada (document_type, version, hash) enviado por el cliente
    coincida con alguna de las entradas canónicas publicadas en
    ``REACCEPT_DOCUMENTS``. Si alguna terna no coincide, la operación
    completa se rechaza y no se escribe ninguna fila. Esto previene que
    un cliente con bundle obsoleto o alterado registre un hash incorrecto.
    """
    if not req.documents:
        raise HTTPException(status_code=400, detail="Se requiere al menos un documento")

    canon = {(dt, ver, h): True for (dt, ver, h) in REACCEPT_DOCUMENTS}
    invalid: list[str] = []
    for doc in req.documents:
        key = (doc.document_type, doc.text_version, doc.text_version_hash)
        if key not in canon:
            invalid.append(doc.document_type)
    if invalid:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "hash_or_version_mismatch",
                "invalid_document_types": invalid,
                "hint": "Recarga la página para obtener la versión publicada vigente",
            },
        )

    # Append-only: una fila nueva por cada document_type enviado.
    written: list[dict] = []
    for doc in req.documents:
        record_document_acceptance(
            db=db,
            user_id=user.id,
            request=request,
            user_timezone=req.user_timezone,
            document_type=doc.document_type,
            text_version=doc.text_version,
            text_version_hash=doc.text_version_hash,
        )
        written.append({"document_type": doc.document_type, "version": doc.text_version})

    db.commit()

    pending = _pending_reaccept_for_user(db, user.id)
    return {
        "accepted": written,
        "pending": pending,
        "is_up_to_date": len(pending) == 0,
    }
