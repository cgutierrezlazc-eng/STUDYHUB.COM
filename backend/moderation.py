"""
Content moderation: word filter + pattern detection.
"""
import re
from typing import Optional

# Blocklist of inappropriate content patterns
BLOCKED_PATTERNS = [
    # Profanity / hate speech patterns (Spanish + English)
    r'\b(idiota|estúpido|imbécil|pendejo|puta|mierda|cabrón|maric[oó]n|negr[oa]\b.*\bde mierda)\b',
    r'\b(fuck\s*you|shit\s*head|asshole|bitch|faggot|retard|nigger)\b',
    # Threats
    r'\b(te\s+voy\s+a\s+matar|voy\s+a\s+matarte|i\'?ll\s+kill\s+you)\b',
    # Harassment patterns
    r'\b(acoso|harass|bully|intimidar)\b.*\b(sexual|escuela|school)\b',
]

# Warning patterns (flag but allow)
WARNING_PATTERNS = [
    r'\b(tonto|stupid|dumb|lame|suck|sucks)\b',
]


def check_content(text: str) -> dict:
    """
    Check if content is allowed.
    Returns: {"allowed": bool, "reason": str, "flagged": bool, "flag_reason": str}
    """
    if not text or not text.strip():
        return {"allowed": True, "flagged": False}

    text_lower = text.lower().strip()

    # Check blocked patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return {
                "allowed": False,
                "reason": "Contenido inapropiado detectado. Mantén un lenguaje respetuoso.",
                "flagged": True,
                "flag_reason": "blocked_pattern",
            }

    # Check warning patterns
    for pattern in WARNING_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return {
                "allowed": True,
                "flagged": True,
                "flag_reason": "warning_pattern",
            }

    return {"allowed": True, "flagged": False}
