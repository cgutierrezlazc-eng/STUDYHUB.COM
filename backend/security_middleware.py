"""Comprehensive security middleware for Conniku.
Covers: rate limiting, IP blocking, security headers, input sanitization,
disposable email detection, device fingerprinting, brute force protection.
"""
import hashlib
import os
import re
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# ─── Rate Limiting ──────────────────────────────────────────

_request_counts: dict[str, list[float]] = defaultdict(list)
_login_attempts: dict[str, list[float]] = defaultdict(list)
_register_attempts: dict[str, list[float]] = defaultdict(list)
_blocked_ips: dict[str, float] = {}  # IP -> block_until timestamp
_last_cleanup: float = 0.0
_CLEANUP_INTERVAL = 300  # 5 minutos entre limpiezas


def _cleanup_rate_limits() -> None:
    """Purga entradas expiradas de los dicts de rate limiting cada 5 minutos."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < _CLEANUP_INTERVAL:
        return
    _last_cleanup = now

    # Limpiar request counts (entradas más viejas de 60s)
    for ip in list(_request_counts.keys()):
        _request_counts[ip] = [t for t in _request_counts[ip] if now - t < 60]
        if not _request_counts[ip]:
            del _request_counts[ip]

    # Limpiar login attempts (más viejas de 15 min)
    for ip in list(_login_attempts.keys()):
        _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < 900]
        if not _login_attempts[ip]:
            del _login_attempts[ip]

    # Limpiar register attempts (más viejas de 1hr)
    for ip in list(_register_attempts.keys()):
        _register_attempts[ip] = [t for t in _register_attempts[ip] if now - t < 3600]
        if not _register_attempts[ip]:
            del _register_attempts[ip]

    # Limpiar IPs bloqueadas expiradas
    for ip in list(_blocked_ips.keys()):
        if _blocked_ips[ip] < now:
            del _blocked_ips[ip]

# Limits
RATE_LIMIT_GENERAL = 120       # requests per minute per IP
RATE_LIMIT_AUTH = 10            # auth attempts per 15 min per IP
RATE_LIMIT_REGISTER = 3        # registrations per hour per IP
BLOCK_DURATION = 900            # 15 minutes block after abuse
SUSPICIOUS_IPS_THRESHOLD = 5   # accounts from same IP triggers alert


def get_client_ip(request: Request) -> str:
    """Get real client IP, handling proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"


def check_rate_limit(ip: str, path: str) -> Optional[str]:
    """Check various rate limits. Returns error message or None."""
    now = time.time()

    # Check if IP is blocked
    if ip in _blocked_ips:
        if now < _blocked_ips[ip]:
            return "Demasiadas solicitudes. Intenta de nuevo en unos minutos."
        else:
            del _blocked_ips[ip]

    # General rate limit
    _request_counts[ip] = [t for t in _request_counts[ip] if t > now - 60]
    _request_counts[ip].append(now)
    if len(_request_counts[ip]) > RATE_LIMIT_GENERAL:
        _blocked_ips[ip] = now + BLOCK_DURATION
        return "Límite de solicitudes excedido."

    # Auth rate limit
    if "/auth/login" in path:
        _login_attempts[ip] = [t for t in _login_attempts[ip] if t > now - 900]
        _login_attempts[ip].append(now)
        if len(_login_attempts[ip]) > RATE_LIMIT_AUTH:
            _blocked_ips[ip] = now + BLOCK_DURATION
            return "Demasiados intentos de login. Espera 15 minutos."

    # Register rate limit
    if "/auth/register" in path:
        _register_attempts[ip] = [t for t in _register_attempts[ip] if t > now - 3600]
        _register_attempts[ip].append(now)
        if len(_register_attempts[ip]) > RATE_LIMIT_REGISTER:
            _blocked_ips[ip] = now + BLOCK_DURATION
            return "Demasiados registros desde esta dirección. Espera 1 hora."

    return None


# ─── Disposable Email Detection ─────────────────────────────

DISPOSABLE_DOMAINS = {
    "guerrillamail.com", "guerrillamail.info", "tempmail.com", "throwaway.email",
    "mailinator.com", "yopmail.com", "maildrop.cc", "dispostable.com",
    "trashmail.com", "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "mailnesia.com", "tempail.com", "tempr.email", "temp-mail.org",
    "mohmal.com", "getnada.com", "emailondeck.com", "33mail.com",
    "mytemp.email", "harakirimail.com", "mailcatch.com", "mintemail.com",
    "tmail.ws", "tmpmail.net", "tmpmail.org", "burnermail.io",
    "10minutemail.com", "guerrillamail.de", "crazymailing.com",
    "mailnator.com", "trashmail.me", "wegwerfmail.de", "spamgourmet.com",
}


def is_disposable_email(email: str) -> bool:
    """Check if email uses a known disposable domain."""
    domain = email.split("@")[-1].lower() if "@" in email else ""
    return domain in DISPOSABLE_DOMAINS


# ─── Input Sanitization ─────────────────────────────────────

def sanitize_html(text: str) -> str:
    """Remove potentially dangerous HTML/script tags."""
    if not text:
        return text
    # Remove script tags and event handlers
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    return text


def validate_password_strength(password: str) -> Optional[str]:
    """Validate password meets security requirements."""
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres"
    if not re.search(r'[A-Z]', password):
        return "La contraseña debe incluir al menos una mayúscula"
    if not re.search(r'[a-z]', password):
        return "La contraseña debe incluir al menos una minúscula"
    if not re.search(r'[0-9]', password):
        return "La contraseña debe incluir al menos un número"
    return None


# ─── Device Fingerprint ─────────────────────────────────────

def generate_device_fingerprint(request: Request) -> str:
    """Generate a simple device fingerprint from request headers."""
    parts = [
        request.headers.get("user-agent", ""),
        request.headers.get("accept-language", ""),
        request.headers.get("accept-encoding", ""),
        get_client_ip(request),
    ]
    raw = "|".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


# ─── Security Headers Middleware ─────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def __call__(self, scope, receive, send):
        # BaseHTTPMiddleware NO soporta WebSocket — pasar directo a la app
        if scope["type"] == "websocket":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    async def dispatch(self, request: Request, call_next):
        # Cleanup periódico de rate limit dicts (cada 5 min)
        _cleanup_rate_limits()

        # Rate limiting
        ip = get_client_ip(request)
        error = check_rate_limit(ip, request.url.path)
        if error:
            return JSONResponse({"detail": error}, status_code=429)

        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https: wss:;"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"

        # Remove server header
        if "server" in response.headers:
            del response.headers["server"]

        return response
