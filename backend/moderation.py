"""
Content moderation: enhanced regex filter + Gemini vision for images.
Conniku platform rules: university community, no adult content, no hate speech,
no attack planning, no extreme politics/religion.
"""
import re
import os
import json
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Text moderation patterns ─────────────────────────────────────────────────

# BLOCKED: immediate reject (no CEO queue needed)
BLOCKED_PATTERNS = [
    # Explicit sexual / adult
    r'\b(porn[oa]?\w*|xxx|sexo\s+explícit\w*|onlyfans|webcam\s+sex|chat\s+sex\w*)\b',
    r'\b(desnud[ao]\s+(mand[aá]|env[ií]|sube|muestr)|fotos?\s+(desnud|íntim|explicit))\b',
    r'\b(consolador|vibrador|masturbaci[oó]n|pajear|correrse\s+en)\b',
    # Hate speech (homophobia, racism, sexism)
    r'\b(maric[oó]n|mari[ck][oó]n|gay\s+de\s+mierda|homosexual\s+de\s+mierda)\b',
    r'\b(faggot|nigger|negr[oa]\s+de\s+(mierda|merd)|sudaca\s+de\s+mierda)\b',
    r'\b(mata\s+(jud[ií]|negr|gay|homosexual)|muerte\s+(a\s+los?\s+(gay|jud[ií]|negr)))\b',
    r'\b(putita|zorra\s+de\s+mierda|perra\s+de\s+mierda)\b',
    # Threats and attack planning
    r'\b(voy\s+a\s+matar(te|los?|las?)|te\s+(voy\s+a\s+)?(matar|violar|golpear))\b',
    r'\b(i\'?ll\s+kill\s+(you|them)|gonna\s+(kill|shoot|hurt)\s+(you|them))\b',
    r'\b(c[oó]mo\s+(hacer|fabricar|construir)\s+una?\s+(bomba|explosivo|arma|pistola))\b',
    r'\b(instrucciones\s+(para|de)\s+(hacer|fabricar)\s+(bomba|arma))\b',
    r'\b(tiroteo\s+(escolar|en\s+(el\s+)?coleg|en\s+(la\s+)?univers))\b',
    r'\b(atentado\s+(terrorista|suicida)|bomba\s+(escuela|universidad|metro))\b',
    r'\b(comprar\s+(droga|cocaína|heroína|pasta\s+base|marihuana\s+aquí))\b',
    # Extreme violence
    r'\b(suicidarse\s+juntos|pacto\s+suicida|instrucciones\s+(para\s+)?suicid)\b',
]

# REVIEW: send to CEO queue (ambiguous content)
REVIEW_PATTERNS = [
    # Mild sexual references
    r'\b(sexo|tener\s+sexo|acostarse\s+con|follar|coger|culear)\b',
    # Mild threats
    r'\b(te\s+voy\s+a\s+partir|te\s+voy\s+a\s+dar|voy\s+a\s+ir\s+a\s+tu\s+casa)\b',
    # Aggressive politics
    r'\b(muerte\s+al\s+(gobierno|presidente|estado)|abajo\s+el\s+(gobierno|estado))\b',
    r'\b(nazi\w*|fascist\w*|comunismo\s+es\s+(lo\s+mejor|la\s+solución))\b',
    # Religious extremism
    r'\b(dios\s+no\s+existe\s+y\s+los\s+creyentes\s+son|mahoma\s+es\s+un|jesús\s+era\s+un\s+farsante)\b',
    r'\b(los\s+(judíos|musulmanes|cristianos)\s+(controlan|son\s+todos|merecen))\b',
    # Drugs (informational block)
    r'\b(cómo\s+(conseguir|comprar)\s+(droga|weed|marihuana|cocaína|pasta))\b',
    r'\b(dealer|trapero\s+de\s+drogas|vend[eo]\s+(weed|porro|pasta\s+base))\b',
]

# WARNING only (flagged but allowed, no CEO queue)
WARNING_PATTERNS = [
    r'\b(tonto|stupid|dumb|lame|suck|sucks|idiota|imbécil)\b',
    r'\b(odio\s+(esta\s+)?(clase|materia|profe)|me\s+tiene\s+harto)\b',
]


def check_content(text: str) -> dict:
    """
    Check text content. Returns:
    {"allowed": bool, "requires_review": bool, "reason": str, "flagged": bool, "flag_reason": str, "category": str}
    """
    if not text or not text.strip():
        return {"allowed": True, "flagged": False, "requires_review": False}

    text_lower = text.lower().strip()

    # Check blocked patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return {
                "allowed": False,
                "requires_review": False,
                "reason": "Contenido no permitido en Conniku. Mantén el respeto y el lenguaje apropiado para una comunidad universitaria.",
                "flagged": True,
                "flag_reason": "blocked_pattern",
                "category": "inappropriate",
            }

    # Check review patterns
    for pattern in REVIEW_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return {
                "allowed": False,
                "requires_review": True,
                "reason": "Este mensaje requiere revisión antes de publicarse.",
                "flagged": True,
                "flag_reason": "review_pattern",
                "category": "review",
            }

    # Check warning patterns (allow but flag)
    for pattern in WARNING_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return {
                "allowed": True,
                "flagged": True,
                "requires_review": False,
                "flag_reason": "warning_pattern",
                "category": "mild",
            }

    return {"allowed": True, "flagged": False, "requires_review": False}


def moderate_image(base64_data: str, mime_type: str = "image/jpeg") -> dict:
    """
    Analyze image for inappropriate content using Gemini vision.
    Returns: {"allowed": bool, "requires_review": bool, "reason": str, "category": str}
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        # No API key: require review for all images (safe fallback)
        return {"allowed": False, "requires_review": True, "reason": "Revisión manual requerida", "category": "unknown"}

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        # Extract base64 data from data URL if needed
        if "," in base64_data:
            header_part, data_part = base64_data.split(",", 1)
            detected_mime = header_part.split(":")[1].split(";")[0] if ":" in header_part else mime_type
        else:
            data_part = base64_data
            detected_mime = mime_type

        model = genai.GenerativeModel("gemini-2.0-flash-lite")

        prompt = """Eres el sistema de moderación de Conniku, una plataforma universitaria chilena.

Analiza esta imagen y clasifícala según estas reglas:

BLOCKED - Rechazar inmediatamente:
- Pornografía o contenido sexual explícito
- Nudez completa o parcial orientada sexualmente
- Símbolos de odio (esvástica, KKK, etc.)
- Imágenes de actos de violencia real o gore
- Armas apuntando a personas con intención de daño

REVIEW - Requiere revisión del CEO:
- Contenido posiblemente inapropiado pero ambiguo
- Propaganda política extrema o imágenes de conflictos
- Contenido que puede ser ofensivo pero no claramente bloqueado
- Capturas de conversaciones con lenguaje cuestionable

SAFE - Apropiado para plataforma universitaria:
- Contenido académico, educativo, social normal
- Fotos de personas vestidas normalmente
- Memes inofensivos, humor universitario
- Apuntes, diagramas, capturas de pantalla normales

Responde SOLO con JSON válido (sin markdown):
{"status": "SAFE", "reason": "", "category": "appropriate"}
o
{"status": "REVIEW", "reason": "descripción breve del problema", "category": "politics|religion|violence|other"}
o
{"status": "BLOCKED", "reason": "descripción breve del problema", "category": "adult|hate|violence"}"""

        response = model.generate_content([
            {"inline_data": {"mime_type": detected_mime, "data": data_part}},
            prompt
        ])

        raw = response.text.strip()
        # Strip markdown if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw

        result = json.loads(raw)
        status = result.get("status", "SAFE").upper()

        if status == "BLOCKED":
            return {
                "allowed": False, "requires_review": False,
                "reason": result.get("reason", "Contenido no permitido"),
                "category": result.get("category", "inappropriate"),
            }
        elif status == "REVIEW":
            return {
                "allowed": False, "requires_review": True,
                "reason": result.get("reason", "Contenido requiere revisión"),
                "category": result.get("category", "review"),
            }
        else:
            return {"allowed": True, "requires_review": False, "reason": "", "category": "appropriate"}

    except json.JSONDecodeError as e:
        logger.warning(f"[moderation] JSON parse error in image moderation: {e}")
        return {"allowed": False, "requires_review": True, "reason": "Error en análisis automático", "category": "error"}
    except Exception as e:
        logger.error(f"[moderation] Image moderation error: {e}")
        # Safe fallback: require review
        return {"allowed": False, "requires_review": True, "reason": "Revisión manual requerida", "category": "error"}
