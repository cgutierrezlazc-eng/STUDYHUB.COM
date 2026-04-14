"""
AI-powered business workflow routes for CEO dashboard.
Marketing, community, QA, and design automation via Google Gemini (free tier).
"""
import json
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db, User
from middleware import get_current_user
from ai_engine import AIEngine

logger = logging.getLogger("conniku.ai_workflows")

router = APIRouter(prefix="/ai-workflows", tags=["ai-workflows"])

ai_engine = AIEngine()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def require_owner(user: User):
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Solo el CEO puede acceder a los workflows de IA")


def parse_json_response(text: str, fallback: dict) -> dict:
    """Try to extract and parse JSON from Gemini's response."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON block in response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
        # Try array
        start = text.find("[")
        end = text.rfind("]") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
    return fallback


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class MarketingGenerateRequest(BaseModel):
    type: str = Field(..., description="social_post | email_campaign | landing_copy | ad_copy | blog_post")
    topic: str
    tone: str = "profesional"
    audience: str = "universitarios chilenos 18-30"
    language: str = "es"
    extra_instructions: Optional[str] = None


class MarketingCalendarRequest(BaseModel):
    month: int
    year: int
    platforms: List[str] = ["instagram", "linkedin", "tiktok"]
    posts_per_week: int = 3


class ModerationRequest(BaseModel):
    content: str
    context: Optional[str] = None


class EngagementRequest(BaseModel):
    post_content: str
    post_type: str = "discussion"
    community_name: Optional[str] = None


class CodeReviewRequest(BaseModel):
    code: str
    language: str = "typescript"
    context: Optional[str] = None


class TestPlanRequest(BaseModel):
    feature_description: str
    type: str = "functional"


class DesignBriefRequest(BaseModel):
    type: str = Field(..., description="landing_page | social_graphic | email_template | app_screen | logo")
    description: str
    brand_colors: List[str] = ["#2D62C8", "#4f8cff", "#1a2332"]
    style: str = "moderno, limpio, profesional"


# ---------------------------------------------------------------------------
# 1. POST /ai-workflows/marketing/generate
# ---------------------------------------------------------------------------

@router.post("/marketing/generate")
async def marketing_generate(
    req: MarketingGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    type_labels = {
        "social_post": "publicación para redes sociales",
        "email_campaign": "campaña de email marketing",
        "landing_copy": "copy para landing page",
        "ad_copy": "copy publicitario",
        "blog_post": "artículo de blog",
    }
    type_label = type_labels.get(req.type, req.type)

    system_prompt = (
        "Eres un experto en marketing digital para Conniku, una plataforma edtech chilena "
        "para estudiantes universitarios. Conniku ofrece: comunidades de estudio, cursos, "
        "marketplace de apuntes, bolsa de trabajo, mentoría profesional y tutoría con IA. "
        "Público objetivo: estudiantes universitarios chilenos de 18 a 30 años. "
        "Tono de marca: cercano, profesional, motivador. "
        "Debes generar contenido listo para usar, en español chileno cuando sea apropiado. "
        "Responde SOLO en formato JSON válido con las claves: "
        '"content" (el texto generado completo), "type" (tipo de contenido), '
        '"suggestions" (lista de 3 ideas de seguimiento relacionadas).'
    )

    extra = f"\nInstrucciones adicionales: {req.extra_instructions}" if req.extra_instructions else ""

    user_message = (
        f"Genera un/a {type_label} sobre: {req.topic}\n"
        f"Tono: {req.tone}\n"
        f"Audiencia: {req.audience}\n"
        f"Idioma: {req.language}"
        f"{extra}"
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {
            "content": result_text,
            "type": req.type,
            "suggestions": [],
        })
        return {
            "content": parsed.get("content", result_text),
            "type": parsed.get("type", req.type),
            "suggestions": parsed.get("suggestions", []),
        }
    except Exception as e:
        logger.error(f"Error en marketing/generate: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando contenido de marketing: {str(e)}")


# ---------------------------------------------------------------------------
# 2. POST /ai-workflows/marketing/calendar
# ---------------------------------------------------------------------------

@router.post("/marketing/calendar")
async def marketing_calendar(
    req: MarketingCalendarRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    platforms_str = ", ".join(req.platforms)

    system_prompt = (
        "Eres un estratega de contenido para Conniku, plataforma edtech chilena para "
        "estudiantes universitarios. Conniku ofrece comunidades, cursos, marketplace, "
        "bolsa de trabajo, mentoría y tutoría IA. "
        "Debes generar un calendario de contenido mensual completo. "
        "Responde ÚNICAMENTE con un JSON válido con la clave \"calendar\" que contiene una lista "
        "de objetos. Cada objeto debe tener: "
        '"date" (formato YYYY-MM-DD), "platform" (red social), "type" (tipo de post), '
        '"topic" (tema), "caption" (texto completo del post), "hashtags" (lista de hashtags). '
        "No incluyas texto fuera del JSON."
    )

    user_message = (
        f"Genera un calendario de contenido para {req.month}/{req.year}.\n"
        f"Plataformas: {platforms_str}\n"
        f"Posts por semana: {req.posts_per_week}\n"
        "Incluye variedad de formatos: educativo, testimonial, promocional, engagement, trending."
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {"calendar": []})
        # Handle both direct list and wrapped object
        if isinstance(parsed, list):
            calendar = parsed
        else:
            calendar = parsed.get("calendar", [])
        return {"calendar": calendar}
    except Exception as e:
        logger.error(f"Error en marketing/calendar: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando calendario: {str(e)}")


# ---------------------------------------------------------------------------
# 3. POST /ai-workflows/community/moderate
# ---------------------------------------------------------------------------

@router.post("/community/moderate")
async def community_moderate(
    req: ModerationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    context_label = req.context or "contenido de comunidad"

    system_prompt = (
        "Eres un moderador de contenido para Conniku, plataforma educativa universitaria chilena. "
        "Tu trabajo es analizar contenido y determinar si es apropiado para la comunidad. "
        "Debes detectar: spam, contenido inapropiado, contenido fuera de tema, discurso de odio, "
        "acoso, contenido sexual, violencia, información falsa, y publicidad no autorizada. "
        "Sé justo pero firme. El contexto universitario permite debate académico pero no toleramos "
        "faltas de respeto. "
        "Responde ÚNICAMENTE con JSON válido con las claves: "
        '"approved" (bool: true si el contenido es aceptable), '
        '"flags" (lista de problemas detectados, vacía si está aprobado), '
        '"reason" (explicación breve de la decisión), '
        '"suggestion" (sugerencia para mejorar el contenido si fue rechazado, vacío si aprobado).'
    )

    user_message = (
        f"Analiza el siguiente {context_label}:\n\n"
        f"{req.content}"
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {
            "approved": True,
            "flags": [],
            "reason": "No se pudo analizar el contenido",
            "suggestion": "",
        })
        return {
            "approved": parsed.get("approved", True),
            "flags": parsed.get("flags", []),
            "reason": parsed.get("reason", ""),
            "suggestion": parsed.get("suggestion", ""),
        }
    except Exception as e:
        logger.error(f"Error en community/moderate: {e}")
        raise HTTPException(status_code=500, detail=f"Error moderando contenido: {str(e)}")


# ---------------------------------------------------------------------------
# 4. POST /ai-workflows/community/engage
# ---------------------------------------------------------------------------

@router.post("/community/engage")
async def community_engage(
    req: EngagementRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    community_ctx = f" en la comunidad '{req.community_name}'" if req.community_name else ""

    system_prompt = (
        "Eres un community manager experto de Conniku, plataforma edtech universitaria chilena. "
        "Tu rol es fomentar la participación y el engagement en las comunidades de estudio. "
        "Debes generar respuestas que sean útiles, cercanas y motivadoras. "
        "Usa un tono amigable pero profesional, como un compañero de estudios con experiencia. "
        "Responde ÚNICAMENTE con JSON válido con las claves: "
        '"reply" (una respuesta reflexiva y útil al post), '
        '"questions" (lista de 3 preguntas de seguimiento para generar conversación), '
        '"related_topics" (lista de 3 temas relacionados que podrían interesar a la comunidad).'
    )

    user_message = (
        f"Genera contenido de engagement para este {req.post_type}{community_ctx}:\n\n"
        f"{req.post_content}"
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {
            "reply": result_text,
            "questions": [],
            "related_topics": [],
        })
        return {
            "reply": parsed.get("reply", result_text),
            "questions": parsed.get("questions", []),
            "related_topics": parsed.get("related_topics", []),
        }
    except Exception as e:
        logger.error(f"Error en community/engage: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando engagement: {str(e)}")


# ---------------------------------------------------------------------------
# 5. POST /ai-workflows/qa/review
# ---------------------------------------------------------------------------

@router.post("/qa/review")
async def qa_review(
    req: CodeReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    context_info = f"\nContexto adicional: {req.context}" if req.context else ""

    system_prompt = (
        "Eres un ingeniero de software senior especializado en revisión de código. "
        "Debes analizar el código proporcionado buscando: bugs, vulnerabilidades de seguridad, "
        "problemas de rendimiento, malas prácticas, y oportunidades de mejora. "
        "Sé específico y constructivo en tus sugerencias. "
        "Responde ÚNICAMENTE con JSON válido con las claves: "
        '"issues" (lista de objetos con: "severity" (critical/warning/info), '
        '"line" (número de línea o null), "description" (descripción del problema), '
        '"suggestion" (sugerencia de corrección)), '
        '"score" (puntuación de calidad de 0 a 100), '
        '"summary" (resumen general de la revisión en 2-3 oraciones).'
    )

    user_message = (
        f"Revisa el siguiente código en {req.language}:{context_info}\n\n"
        f"```{req.language}\n{req.code}\n```"
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {
            "issues": [],
            "score": 50,
            "summary": result_text,
        })
        return {
            "issues": parsed.get("issues", []),
            "score": parsed.get("score", 50),
            "summary": parsed.get("summary", ""),
        }
    except Exception as e:
        logger.error(f"Error en qa/review: {e}")
        raise HTTPException(status_code=500, detail=f"Error revisando código: {str(e)}")


# ---------------------------------------------------------------------------
# 6. POST /ai-workflows/qa/test-plan
# ---------------------------------------------------------------------------

@router.post("/qa/test-plan")
async def qa_test_plan(
    req: TestPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    system_prompt = (
        "Eres un ingeniero QA senior especializado en planificación de pruebas. "
        "Debes crear planes de prueba exhaustivos y bien estructurados. "
        "Cada caso de prueba debe ser claro, reproducible y con criterios de aceptación definidos. "
        "Responde ÚNICAMENTE con JSON válido con las claves: "
        '"test_cases" (lista de objetos con: "id" (formato TC-001), "name" (nombre descriptivo), '
        '"steps" (lista de pasos), "expected" (resultado esperado), '
        '"priority" (high/medium/low)), '
        '"coverage_notes" (notas sobre la cobertura del plan y áreas que necesitan atención adicional).'
    )

    user_message = (
        f"Genera un plan de pruebas de tipo '{req.type}' para la siguiente funcionalidad:\n\n"
        f"{req.feature_description}"
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {
            "test_cases": [],
            "coverage_notes": result_text,
        })
        return {
            "test_cases": parsed.get("test_cases", []),
            "coverage_notes": parsed.get("coverage_notes", ""),
        }
    except Exception as e:
        logger.error(f"Error en qa/test-plan: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando plan de pruebas: {str(e)}")


# ---------------------------------------------------------------------------
# 7. POST /ai-workflows/design/brief
# ---------------------------------------------------------------------------

@router.post("/design/brief")
async def design_brief(
    req: DesignBriefRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user)

    colors_str = ", ".join(req.brand_colors)

    system_prompt = (
        "Eres un director creativo y diseñador UX/UI senior para Conniku, plataforma edtech "
        "universitaria chilena. Debes crear briefs de diseño detallados y profesionales. "
        "El diseño debe reflejar la marca Conniku: moderna, confiable, juvenil pero profesional. "
        "Responde ÚNICAMENTE con JSON válido con las claves: "
        '"brief" (descripción completa del brief de diseño en formato narrativo), '
        '"specifications" (objeto con: "dimensions" (dimensiones recomendadas), '
        '"colors" (paleta de colores a usar), "typography" (tipografías recomendadas), '
        '"layout" (descripción del layout)), '
        '"copy_suggestions" (lista de 3-5 textos sugeridos para el diseño).'
    )

    user_message = (
        f"Crea un brief de diseño para: {req.type}\n"
        f"Descripción: {req.description}\n"
        f"Colores de marca: {colors_str}\n"
        f"Estilo: {req.style}"
    )

    try:
        result_text = ai_engine._call_gemini_json(system_prompt, user_message)
        parsed = parse_json_response(result_text, {
            "brief": result_text,
            "specifications": {
                "dimensions": "",
                "colors": req.brand_colors,
                "typography": "",
                "layout": "",
            },
            "copy_suggestions": [],
        })
        specs = parsed.get("specifications", {})
        return {
            "brief": parsed.get("brief", result_text),
            "specifications": {
                "dimensions": specs.get("dimensions", ""),
                "colors": specs.get("colors", req.brand_colors),
                "typography": specs.get("typography", ""),
                "layout": specs.get("layout", ""),
            },
            "copy_suggestions": parsed.get("copy_suggestions", []),
        }
    except Exception as e:
        logger.error(f"Error en design/brief: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando brief de diseño: {str(e)}")
