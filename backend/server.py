import os
import json
import uuid
import shutil
import logging
import traceback
from pathlib import Path
from typing import Optional

from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Body
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import init_db, get_db, User, gen_id
from middleware import get_current_user
from document_processor import DocumentProcessor
from gemini_engine import AIEngine
from auth_routes import router as auth_router
from messaging_routes import router as messaging_router
from admin_routes import router as admin_router
from social_routes import router as social_router
from video_routes import router as video_router
from ai_detection_routes import router as ai_detection_router
from gamification import router as gamification_router
from notifications import router as notifications_router
from calendar_routes import router as calendar_router
from marketplace_routes import router as marketplace_router
from community_routes import router as community_router
from notification_routes import router as notification_router
from job_routes import router as job_router
from course_routes import router as course_router
from event_routes import router as event_router
from mentorship_routes import router as mentorship_router
from payment_routes import router as payment_router
from mercadopago_routes import router as mp_router
from paypal_routes import router as paypal_router
from study_room_routes import router as study_room_router
from quiz_system_routes import router as quiz_system_router
from pomodoro_routes import router as pomodoro_router
from wellness_routes import router as wellness_router
from referral_routes import router as referral_router
from exam_predictor_routes import router as exam_predictor_router
from chile_tax_routes import router as finance_router
from rewards_routes import router as rewards_router
from search_routes import router as search_router
from news_routes import router as news_router
from cv_routes import router as cv_router
from push_routes import router as push_router
from certificate_routes import router as certificate_router
from conference_routes import router as conference_router
from ws_routes import router as ws_router
from hr_routes import router as hr_router
from tutor_routes import router as tutor_router
from ai_workflow_routes import router as ai_workflow_router
from migrations import migrate
from prompts import (
    AUDIO_TO_NOTES_PROMPT,
    EXAM_NIGHT_PROMPT,
    MATH_SCAN_PROMPT,
    STUDY_PLAN_PROMPT,
    TRANSLATE_PROMPT,
)

app = FastAPI(title="Conniku Backend", version="2.0.0")

# CORS: restrict to known origins in production
_cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8899,https://conniku.com,https://www.conniku.com,https://studyhub-com.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from security_middleware import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware)

# Disable docs in production
if os.environ.get("ENVIRONMENT") == "production":
    app.docs_url = None
    app.redoc_url = None

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("conniku")


# Global exception handler: ensures 500 errors return JSON with CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# Run migrations on startup
migrate()

# Include routers
app.include_router(auth_router)
app.include_router(messaging_router)
app.include_router(admin_router)
app.include_router(social_router)
app.include_router(video_router)
app.include_router(ai_detection_router)
app.include_router(gamification_router)
app.include_router(notifications_router)
app.include_router(calendar_router)
app.include_router(marketplace_router)
app.include_router(community_router)
app.include_router(notification_router)
app.include_router(job_router)
app.include_router(course_router)
app.include_router(event_router)
app.include_router(mentorship_router)
app.include_router(payment_router)
app.include_router(mp_router)
app.include_router(paypal_router)
app.include_router(study_room_router)
app.include_router(quiz_system_router)
app.include_router(pomodoro_router)
app.include_router(wellness_router)
app.include_router(referral_router)
app.include_router(exam_predictor_router)
app.include_router(finance_router)
app.include_router(rewards_router)
app.include_router(search_router)
app.include_router(news_router)
app.include_router(cv_router)
app.include_router(push_router)
app.include_router(certificate_router)
app.include_router(conference_router)
app.include_router(ws_router)
app.include_router(hr_router)
app.include_router(tutor_router)
app.include_router(ai_workflow_router)


@app.post("/admin/seed-ceo-profile")
def seed_ceo_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Seed the CEO profile with complete data and all courses completed. Owner only."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner puede ejecutar este seed")
    from seed_ceo_profile import seed_ceo_with_db
    result = seed_ceo_with_db(db, user)
    return result


# Storage paths
DATA_DIR = Path.home() / ".conniku"
PROJECTS_DIR = DATA_DIR / "projects"
DATA_DIR.mkdir(exist_ok=True)
PROJECTS_DIR.mkdir(exist_ok=True)

COVERS_DIR = DATA_DIR / "uploads" / "covers"
COVERS_DIR.mkdir(parents=True, exist_ok=True)

doc_processor = DocumentProcessor()
ai_engine = AIEngine()


@app.get("/uploads/covers/{filename}")
async def serve_cover_photo(filename: str):
    """Serve uploaded cover photo files."""
    file_path = COVERS_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "Imagen no encontrada")
    return FileResponse(str(file_path))

# ─── Chat rate limiting (tier-aware) ───────────────────────────
# In-memory tracker: { user_id: [datetime, datetime, ...] }
_chat_timestamps: dict[str, list[datetime]] = {}


def check_chat_limit(user: User):
    """Raise 429 if user exceeds their tier's AI message limit."""
    from middleware import get_tier, get_tier_limits
    tier = get_tier(user)
    limits = get_tier_limits(user)

    # Max tier and owner/admin bypass limits
    if tier == "max":
        return

    window_hours = limits.get("ai_window_hours", 6)
    max_messages = limits.get("ai_messages_per_window", 20)

    now = datetime.utcnow()
    cutoff = now - timedelta(hours=window_hours)

    timestamps = _chat_timestamps.get(user.id, [])
    # Prune old entries
    timestamps = [t for t in timestamps if t > cutoff]
    _chat_timestamps[user.id] = timestamps

    if len(timestamps) >= max_messages:
        tier_names = {"free": "Pro ($5/mes)", "pro": "Max ($13/mes)"}
        upgrade_to = tier_names.get(tier, "tu plan")
        raise HTTPException(
            429,
            f"Límite de {max_messages} mensajes cada {window_hours} horas alcanzado. "
            f"Actualiza a {upgrade_to} para más mensajes."
        )


# --- Models ---

class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""
    color: str = "#4f8cff"

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    language: str = "es"
    gender: str = "unspecified"
    language_skill: str = "intermediate"
    socratic: bool = False

class PathUploadRequest(BaseModel):
    path: str

class MathRequest(BaseModel):
    expression: str
    step_by_step: bool = True

class ScanSolveRequest(BaseModel):
    image_base64: str  # Base64 encoded image
    language: str = "es"

class QuizRequest(BaseModel):
    num_questions: int = 10
    difficulty: str = "medium"  # easy, medium, hard
    weak_topics: list[str] = []

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "es"
    source_language: str = ""  # auto-detect if empty

ALLOWED_DOC_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.rtf'}


# --- Project storage helpers ---

def get_project_dir(project_id: str) -> Path:
    d = PROJECTS_DIR / project_id
    d.mkdir(exist_ok=True)
    return d

def get_project_docs_dir(project_id: str) -> Path:
    d = get_project_dir(project_id) / "documents"
    d.mkdir(exist_ok=True)
    return d

def get_project_meta(project_id: str) -> dict:
    meta_file = get_project_dir(project_id) / "meta.json"
    if meta_file.exists():
        return json.loads(meta_file.read_text())
    return {}

def save_project_meta(project_id: str, meta: dict):
    meta_file = get_project_dir(project_id) / "meta.json"
    meta_file.write_text(json.dumps(meta, indent=2))


# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/test-email")
def test_email():
    """Temporary endpoint to test SMTP configuration."""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    try:
        smtp_host = os.environ.get("SMTP_HOST", "smtp.zoho.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_user = os.environ.get("NOREPLY_EMAIL", "noreply@conniku.com")
        smtp_pass = os.environ.get("SMTP_PASS", "")
        smtp_from = smtp_user
        if not smtp_pass:
            return {"status": "error", "message": "SMTP_PASS not set"}
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Conniku <{smtp_from}>"
        msg["To"] = "ceo@conniku.com"
        msg["Subject"] = "Test SMTP - Conniku funciona"
        msg.attach(MIMEText("<h2>Email funciona</h2><p>SMTP configurado correctamente en Render.</p>", "html", "utf-8"))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, "ceo@conniku.com", msg.as_string())
        return {"status": "ok", "message": "Email sent to ceo@conniku.com", "smtp_user": smtp_user}
    except Exception as e:
        return {"status": "error", "message": str(e), "smtp_user": os.environ.get("SMTP_USER", "")}


@app.get("/projects")
def list_projects(user: User = Depends(get_current_user)):
    projects = []
    for d in PROJECTS_DIR.iterdir():
        if d.is_dir():
            meta = get_project_meta(d.name)
            if meta and meta.get("user_id") == user.id:
                projects.append(meta)
    return projects


@app.post("/projects")
def create_project(req: CreateProjectRequest, user: User = Depends(get_current_user)):
    project_id = uuid.uuid4().hex[:12]
    meta = {
        "id": project_id,
        "name": req.name,
        "description": req.description,
        "color": req.color,
        "documents": [],
        "user_id": user.id,
    }
    save_project_meta(project_id, meta)
    ai_engine.init_project(project_id)
    return meta


@app.delete("/projects/{project_id}")
def delete_project(project_id: str, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    project_dir = PROJECTS_DIR / project_id
    if project_dir.exists():
        shutil.rmtree(project_dir)
    ai_engine.delete_project(project_id)
    return {"status": "deleted"}


@app.put("/projects/{project_id}")
def update_project(project_id: str, req: UpdateProjectRequest, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    if req.name is not None:
        meta["name"] = req.name
    if req.description is not None:
        meta["description"] = req.description
    if req.color is not None:
        meta["color"] = req.color
    save_project_meta(project_id, meta)
    return meta


@app.post("/projects/{project_id}/documents")
async def upload_document(project_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")

    # Validate file type
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(400, f"Tipo de archivo no permitido. Formatos aceptados: {', '.join(ALLOWED_DOC_EXTENSIONS)}")

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check storage limit
    current_used = user.storage_used_bytes or 0
    storage_limit = user.storage_limit_bytes or 524288000  # 500 MB default
    if current_used + file_size > storage_limit:
        used_mb = round(current_used / 1048576, 1)
        limit_mb = round(storage_limit / 1048576, 1)
        raise HTTPException(
            413,
            f"Almacenamiento lleno ({used_mb}/{limit_mb} MB). "
            "Actualiza a PRO para obtener 5 GB de almacenamiento."
        )

    docs_dir = get_project_docs_dir(project_id)
    file_path = docs_dir / file.filename

    with open(file_path, "wb") as f:
        f.write(content)

    # Update storage usage
    user.storage_used_bytes = current_used + file_size
    db.commit()

    text = doc_processor.extract_text(str(file_path))
    doc_id = uuid.uuid4().hex[:12]
    ai_engine.add_document(project_id, doc_id, file.filename, text)

    meta.setdefault("documents", []).append({
        "id": doc_id,
        "name": file.filename,
        "path": str(file_path),
        "size": file_size,
        "processed": True,
    })
    save_project_meta(project_id, meta)

    return {"id": doc_id, "name": file.filename, "processed": True, "text_length": len(text)}


@app.post("/projects/{project_id}/documents/path")
def upload_from_path(project_id: str, req: PathUploadRequest, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")

    source = Path(req.path).resolve()
    # Security: only allow files from the user's own project directories
    allowed_bases = [PROJECTS_DIR.resolve()]
    if not any(str(source).startswith(str(base)) for base in allowed_bases):
        raise HTTPException(400, "Ruta de archivo no permitida")
    if not source.exists():
        raise HTTPException(404, "File not found")
    if not source.is_file():
        raise HTTPException(400, "La ruta no es un archivo válido")

    docs_dir = get_project_docs_dir(project_id)
    dest = docs_dir / source.name
    shutil.copy2(source, dest)

    text = doc_processor.extract_text(str(dest))
    doc_id = uuid.uuid4().hex[:12]
    ai_engine.add_document(project_id, doc_id, source.name, text)

    meta.setdefault("documents", []).append({
        "id": doc_id,
        "name": source.name,
        "path": str(dest),
        "processed": True,
    })
    save_project_meta(project_id, meta)

    return {"id": doc_id, "name": source.name, "processed": True}


@app.post("/projects/{project_id}/chat")
def chat(project_id: str, req: ChatRequest, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")

    # Enforce chat limit for free/trial users
    check_chat_limit(user)

    response = ai_engine.chat(
        project_id, req.message, req.language, req.gender, req.language_skill,
        socratic=req.socratic
    )

    # Record timestamp after successful response
    _chat_timestamps.setdefault(user.id, []).append(datetime.utcnow())

    return {"response": response}


# ─── Support Chatbot (no project context) ─────────────────────
class SupportChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/support/chat")
def support_chat(req: SupportChatRequest, user: User = Depends(get_current_user)):
    """AI support chatbot for Conniku platform questions."""
    check_chat_limit(user)

    system = """Eres el asistente de soporte de Conniku, una plataforma educativa universitaria chilena.
Tu nombre es Konni. Eres amable, conciso y hablas en español chileno informal pero profesional.

Tus funciones:
- Responder preguntas sobre como usar la plataforma (feed, comunidades, mensajes, salas de estudio, cursos, marketplace, calendario, etc.)
- Ayudar con problemas tecnicos basicos (login, subir archivos, configuracion de perfil)
- Explicar los planes de suscripcion (Free, Pro, Max)
- Guiar en el uso del chat IA para estudiar
- Responder sobre la empresa Conniku SpA

Reglas:
- Si no sabes la respuesta, di que derivaras al equipo de soporte (contacto@conniku.com)
- No inventes funciones que no existen
- Respuestas cortas (max 3-4 oraciones)
- Usa emojis con moderacion
- Si preguntan algo fuera de la plataforma, redirige amablemente

Funciones principales de Conniku:
- Feed social para compartir contenido academico
- Chat IA para estudiar con documentos subidos
- Salas de estudio en grupo
- Marketplace de apuntes
- Comunidades por carrera/universidad
- Calendario academico
- Sistema de mensajes directos
- Cursos y tutores
- Conferencias en vivo
- Bolsa de trabajo
- Perfil profesional (CV)
- Biblioteca digital"""

    # Build conversation for Claude
    messages = []
    for msg in req.history[-10:]:  # Last 10 messages for context
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": req.message})

    try:
        response = ai_engine._call_claude(system, req.message, model="claude-haiku-4-5-20251001")
    except Exception:
        response = "Lo siento, estoy teniendo problemas para responder. Puedes escribir a contacto@conniku.com para soporte directo."

    _chat_timestamps.setdefault(user.id, []).append(datetime.utcnow())
    return {"response": response}


class StudyBuddyRequest(BaseModel):
    message: str
    context: str = ""  # page context: subject name, topic, etc.
    history: list = []

@app.post("/ai/study-buddy")
def study_buddy_chat(req: StudyBuddyRequest, user: User = Depends(get_current_user)):
    """AI Study Buddy — contextual study help using Gemini (free)."""
    check_chat_limit(user)

    context_info = f"\nContexto actual del estudiante: {req.context}" if req.context else ""

    system = f"""Eres el Study Buddy de Conniku, un companero de estudio inteligente.
Tu rol es ayudar al estudiante con cualquier tema academico de forma clara y didactica.
Responde en espanol, de forma amigable y cercana.
{context_info}

Reglas:
- Respuestas concisas pero completas (max 200 palabras)
- Usa ejemplos practicos cuando sea posible
- Si hay formulas, usa notacion clara
- Motiva al estudiante, se positivo
- Si no sabes algo, dilo honestamente
- Nunca digas "como modelo de lenguaje" — eres un companero de estudio
- Si preguntan algo no academico, redirige amablemente al estudio"""

    # Build conversation context from history
    history_text = ""
    for msg in (req.history or [])[-6:]:
        role = "Estudiante" if msg.get("role") == "user" else "Study Buddy"
        history_text += f"\n{role}: {msg.get('content', '')}"

    full_message = f"{history_text}\nEstudiante: {req.message}" if history_text else req.message

    try:
        response = ai_engine._call_gemini(system, full_message)
    except Exception:
        response = "Lo siento, no pude procesar tu pregunta. Intenta de nuevo."

    _chat_timestamps.setdefault(user.id, []).append(datetime.utcnow())
    return {"response": response}


@app.post("/ai/auto-tag")
def auto_tag_content(req: dict = Body(...), user: User = Depends(get_current_user)):
    """Auto-suggest tags for a post using Gemini (free)."""
    text = req.get("text", "")
    if not text or len(text) < 10:
        return {"tags": []}

    system = """Analiza el siguiente texto academico y sugiere 3-5 tags relevantes.
Responde SOLO con un JSON array de strings, sin explicacion.
Los tags deben ser en espanol, cortos (1-2 palabras), y relevantes para estudiantes universitarios.
Ejemplo: ["Calculo", "Integrales", "Matematicas"]"""

    try:
        result = ai_engine._call_gemini_json(system, text)
        import json as json_mod
        # Try to parse the response
        if isinstance(result, str):
            result = result.strip()
            if result.startswith("["):
                tags = json_mod.loads(result)
            else:
                # Try to extract JSON array from response
                import re
                match = re.search(r'\[.*?\]', result, re.DOTALL)
                if match:
                    tags = json_mod.loads(match.group())
                else:
                    tags = []
        else:
            tags = []
        return {"tags": tags[:5]}
    except Exception:
        return {"tags": []}


@app.get("/ai/daily-summary")
def daily_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a personalized daily study summary using Gemini (free)."""
    from database import WallPost, CalendarEvent, StudySession
    from sqlalchemy import func

    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)

    # Gather user data for summary
    try:
        # Recent study sessions
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user.id,
            func.date(StudySession.created_at) >= week_ago
        ).all()
        total_study_secs = sum(s.duration_seconds or 0 for s in sessions)
        today_secs = sum(s.duration_seconds or 0 for s in sessions if s.created_at and s.created_at.date() == today)

        # Upcoming events
        events = db.query(CalendarEvent).filter(
            CalendarEvent.user_id == user.id,
            CalendarEvent.date >= str(today)
        ).order_by(CalendarEvent.date).limit(3).all()
        event_list = [{"title": e.title, "date": str(e.date)} for e in events]

        # Recent posts count
        post_count = db.query(func.count(WallPost.id)).filter(
            WallPost.author_id == user.id,
            func.date(WallPost.created_at) >= week_ago
        ).scalar() or 0
    except Exception:
        total_study_secs = 0
        today_secs = 0
        event_list = []
        post_count = 0

    context = f"""Datos del estudiante {user.first_name}:
- Tiempo de estudio esta semana: {total_study_secs // 3600}h {(total_study_secs % 3600) // 60}m
- Tiempo de estudio hoy: {today_secs // 3600}h {(today_secs % 3600) // 60}m
- Posts publicados esta semana: {post_count}
- Proximos eventos: {event_list if event_list else 'ninguno programado'}
- Dia: {today.strftime('%A %d de %B')}"""

    system = """Genera un resumen diario personalizado y motivador para un estudiante universitario.
Responde en espanol, maximo 3-4 oraciones.
Se positivo, concreto y breve. Incluye un tip de estudio si es relevante.
Responde SOLO con JSON: {"summary": "...", "tip": "...", "mood": "positive|neutral|alert"}
- mood "positive" si va bien, "neutral" si regular, "alert" si hay entregas pronto o poco estudio"""

    try:
        result = ai_engine._call_gemini_json(system, context)
        import json as json_mod, re
        if isinstance(result, str):
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                data = json_mod.loads(match.group())
                return data
        return {"summary": f"Hola {user.first_name}! Revisa tu calendario y organiza tu dia.", "tip": "Estudia en bloques de 25 minutos con descansos.", "mood": "neutral"}
    except Exception:
        return {"summary": f"Hola {user.first_name}! Que tengas un gran dia de estudio.", "tip": "Repasa tus apuntes antes de dormir para mejor retencion.", "mood": "neutral"}


class CVCoachRequest(BaseModel):
    cv_text: str
    target_role: str = ""

@app.post("/ai/cv-coach")
def cv_coach(req: CVCoachRequest, user: User = Depends(get_current_user)):
    """AI CV Coach — review and improve a CV/resume using Gemini (free)."""
    if len(req.cv_text) < 20:
        raise HTTPException(400, "El CV debe tener al menos 20 caracteres")

    role_context = f"\nEl estudiante busca un puesto de: {req.target_role}" if req.target_role else ""

    system = f"""Eres un coach profesional de CVs especializado en estudiantes universitarios chilenos.
Analiza el CV proporcionado y da feedback constructivo.{role_context}

Responde en espanol con JSON:
{{
  "score": 0-100,
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "improvements": ["mejora 1", "mejora 2", "mejora 3"],
  "rewrite_suggestion": "parrafo de perfil profesional reescrito y mejorado",
  "missing_sections": ["seccion que falta 1"],
  "tip": "un consejo clave"
}}

Se especifico, practico y motivador. No inventes informacion que no esta en el CV."""

    try:
        result = ai_engine._call_gemini_json(system, f"CV del estudiante:\n{req.cv_text}")
        import json as json_mod, re
        if isinstance(result, str):
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                return json_mod.loads(match.group())
        return {"score": 50, "strengths": [], "improvements": ["No pude analizar el CV"], "rewrite_suggestion": "", "missing_sections": [], "tip": "Intenta de nuevo con mas detalle"}
    except Exception:
        return {"score": 50, "strengths": [], "improvements": ["Error al analizar"], "rewrite_suggestion": "", "missing_sections": [], "tip": "Intenta de nuevo"}


@app.post("/projects/{project_id}/guide")
def generate_guide(project_id: str, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    guide = ai_engine.generate_study_guide(project_id, user.language or "es")
    return {"guide": guide}


@app.post("/projects/{project_id}/quiz")
def generate_quiz(project_id: str, req: QuizRequest = QuizRequest(), user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    quiz = ai_engine.generate_quiz(project_id, req.num_questions, user.language or "es", req.difficulty, req.weak_topics or None)
    return quiz


@app.post("/projects/{project_id}/flashcards")
def generate_flashcards(project_id: str, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    flashcards = ai_engine.generate_flashcards(project_id, user.language or "es")
    return {"flashcards": flashcards}


@app.post("/projects/{project_id}/upload-to-study")
def upload_to_study(project_id: str, user: User = Depends(get_current_user)):
    """Generate guide + quiz + flashcards in one call."""
    from middleware import require_tier
    require_tier(user, "pro")

    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    if not meta.get("documents"):
        raise HTTPException(400, "Sube documentos primero")

    guide = ai_engine.generate_study_guide(project_id, user.language or "es")
    quiz = ai_engine.generate_quiz(project_id, 10, user.language or "es")
    flashcards = ai_engine.generate_flashcards(project_id)

    return {
        "guide": guide,
        "quiz": quiz,
        "flashcards": flashcards,
    }


@app.post("/projects/{project_id}/audio-to-notes")
async def audio_to_notes(project_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Record or upload class audio → transcribe → generate notes + flashcards."""
    from middleware import require_tier
    require_tier(user, "max")  # Only MAX can record + transcribe classes

    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso")

    # Save audio file
    docs_dir = get_project_docs_dir(project_id)
    filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename or 'recording.webm'}"
    file_path = docs_dir / filename
    content = await file.read()
    file_path.write_bytes(content)

    # Transcribe using AI (send audio description for processing)
    # For actual transcription, we use the document processor which handles text extraction
    # Here we generate notes from the transcription

    import base64
    audio_b64 = base64.b64encode(content).decode()

    lang = user.language or "es"

    lang_name = 'español' if lang == 'es' else 'inglés' if lang == 'en' else lang
    system = AUDIO_TO_NOTES_PROMPT.format(lang=lang_name)

    try:
        # Process audio - add to document processor for context
        doc_processor.process_file(str(file_path), project_id)

        # Get the transcribed text
        all_text = ai_engine._get_all_text(project_id)

        user_prompt = f"Contenido de la clase grabada:\n{all_text[:15000]}\n\nGenera notas estructuradas, resumen y flashcards."
        result_text = ai_engine._call_claude(system, user_prompt)

        start_idx = result_text.find('{')
        end_idx = result_text.rfind('}') + 1
        if start_idx >= 0 and end_idx > start_idx:
            result = json.loads(result_text[start_idx:end_idx])
        else:
            result = json.loads(result_text)

        # Save full transcription as project document
        try:
            notes_content = result.get("notes", "")
            if notes_content:
                notes_filename = f"notas_clase_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
                notes_path = docs_dir / notes_filename
                notes_path.write_text(notes_content, encoding="utf-8")

                # Add to project meta
                meta = get_project_meta(project_id)
                doc_entry = {
                    "id": gen_id(),
                    "name": notes_filename,
                    "type": "txt",
                    "path": str(notes_path),
                    "size": len(notes_content.encode("utf-8")),
                    "uploadedAt": datetime.now().isoformat(),
                    "processed": True,
                    "summary": "Transcripción completa de clase grabada",
                }
                if "documents" not in meta:
                    meta["documents"] = []
                meta["documents"].append(doc_entry)
                save_project_meta(project_id, meta)

                # Index in AI engine
                ai_engine.add_document(project_id, notes_filename, notes_content)
        except Exception as e:
            print(f"[Warning] Could not save notes as document: {e}")

        return {
            "notes": result.get("notes", ""),
            "summary": result.get("summary", ""),
            "flashcards": result.get("flashcards", []),
            "topics": result.get("topics", []),
            "audioFile": filename,
            "success": True,
        }
    except Exception as e:
        return {
            "notes": "", "summary": f"Error procesando audio: {str(e)}",
            "flashcards": [], "topics": [], "audioFile": filename, "success": False,
        }


@app.get("/projects/{project_id}/documents/{doc_name}/download")
def download_document(project_id: str, doc_name: str, user: User = Depends(get_current_user)):
    """Download a document — Pro and MAX only. Free can only view."""
    from middleware import get_tier_limits
    limits = get_tier_limits(user)
    if not limits.get("can_download_docs"):
        raise HTTPException(403, "Descarga de documentos requiere Plan Pro ($5/mes) o superior.")

    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso")

    file_path = get_project_docs_dir(project_id) / doc_name
    if not file_path.exists():
        raise HTTPException(404, "Documento no encontrado")

    return FileResponse(str(file_path), filename=doc_name)


@app.post("/projects/{project_id}/attendance")
def log_attendance(project_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log class attendance for a subject."""
    from database import ClassAttendance
    from middleware import require_tier
    require_tier(user, "max")

    att = ClassAttendance(
        id=gen_id(), user_id=user.id, project_id=project_id,
        class_title=data.get("title", "Clase"),
        duration_minutes=data.get("duration_minutes", 0),
        recorded=data.get("recorded", False),
        transcribed=data.get("transcribed", False),
    )
    db.add(att)
    db.commit()
    return {"id": att.id, "status": "logged"}


@app.get("/projects/{project_id}/attendance")
def get_attendance(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get attendance history for a subject."""
    from database import ClassAttendance
    records = db.query(ClassAttendance).filter(
        ClassAttendance.user_id == user.id, ClassAttendance.project_id == project_id
    ).order_by(desc(ClassAttendance.attended_at)).all()

    total = len(records)
    recorded = sum(1 for r in records if r.recorded)
    transcribed = sum(1 for r in records if r.transcribed)

    return {
        "totalClasses": total,
        "recordedClasses": recorded,
        "transcribedClasses": transcribed,
        "attendanceRate": f"{round(total / max(total, 1) * 100)}%",
        "records": [{
            "id": r.id, "title": r.class_title or "Clase",
            "date": r.attended_at.isoformat() if r.attended_at else "",
            "duration": r.duration_minutes, "recorded": r.recorded, "transcribed": r.transcribed,
        } for r in records],
    }


@app.post("/projects/{project_id}/exam-night-mode")
def generate_exam_night_plan(project_id: str, data: dict, user: User = Depends(get_current_user)):
    """MAX only — Generate emergency study plan for the night before an exam."""
    from middleware import require_tier
    require_tier(user, "max")

    hours_available = data.get("hours", 6)
    lang = user.language or "es"

    all_text = ai_engine._get_all_text(project_id)
    if not all_text:
        raise HTTPException(400, "Sube documentos primero")

    lang_name = 'español' if lang == 'es' else 'English'
    system = EXAM_NIGHT_PROMPT.format(hours_available=hours_available, lang=lang_name)

    prompt = f"Material del curso:\n{all_text[:15000]}\n\nGenera plan de emergencia para {hours_available} horas."

    try:
        result_text = ai_engine._call_claude(system, prompt, model="claude-haiku-4-5-20251001")
        import json as json_mod
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        result = json_mod.loads(result_text[start:end])
    except Exception:
        result = {"plan": [], "criticalTopics": [], "quickTips": ["Revisa tus notas", "Haz ejercicios clave", "Duerme al menos 4 horas"], "motivationalMessage": "¡Tú puedes! Confía en lo que ya sabes."}

    return result


@app.post("/math/solve")
def solve_math(req: MathRequest, user: User = Depends(get_current_user)):
    from math_engine import MathEngine
    engine = MathEngine()
    result = engine.solve(req.expression, req.step_by_step)
    return result


@app.post("/math/scan")
def scan_and_solve(req: ScanSolveRequest, user: User = Depends(get_current_user)):
    """Scan an image of a math problem and solve it step by step."""
    from middleware import get_tier_limits
    # Check daily scan limit (tier-based)
    # For now, just log — full rate tracking would need a counter

    import base64

    lang_name = 'español' if req.language == 'es' else 'inglés' if req.language == 'en' else req.language
    system = MATH_SCAN_PROMPT.format(lang=lang_name)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

        # Detect image type from base64 header
        media_type = "image/jpeg"
        if req.image_base64.startswith("data:"):
            parts = req.image_base64.split(",", 1)
            if "png" in parts[0]: media_type = "image/png"
            elif "webp" in parts[0]: media_type = "image/webp"
            image_data = parts[1] if len(parts) > 1 else req.image_base64
        else:
            image_data = req.image_base64

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_data}},
                    {"type": "text", "text": "Resuelve este problema paso a paso."}
                ]
            }],
            system=system,
        )
        result = response.content[0].text
        return {"solution": result, "success": True}
    except Exception as e:
        return {"solution": f"Error al procesar la imagen: {str(e)}", "success": False}


class ExportDocxRequest(BaseModel):
    content: str
    title: str = "Conniku Document"

class ExportPdfRequest(BaseModel):
    content: str
    title: str = "Conniku Document"
    messages: list = []  # For chat export

class SummaryRequest(BaseModel):
    detail_level: str = "comprehensive"  # brief, standard, comprehensive
    export_format: str = ""  # "", "docx", "pdf"


@app.post("/projects/{project_id}/chat/export-docx")
def export_chat_docx(project_id: str, req: ExportDocxRequest, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    # DOCX export: Pro (1500 words) + Max (unlimited), Free blocked
    from middleware import get_tier, get_tier_limits
    tier = get_tier(user)
    if tier == "free":
        raise HTTPException(403, "Exportar a Word requiere Plan Pro ($5/mes) o superior. Los usuarios Free pueden visualizar pero no descargar.")

    # Pro: limit to 1500 words
    if tier == "pro":
        word_count = len(req.content.split())
        if word_count > 1500:
            raise HTTPException(403, f"Tu plan Pro permite exportar hasta 1,500 palabras ({word_count} detectadas). Actualiza a MAX para exportar sin límite.")
    try:
        from docx_generator import markdown_to_docx
        file_path = markdown_to_docx(req.content, req.title)
        return FileResponse(
            file_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"{req.title}.docx",
        )
    except Exception as e:
        raise HTTPException(500, f"Error generando documento: {str(e)}")


# ─── Summary generation & export ─────────────────────────────
@app.post("/projects/{project_id}/summary")
def generate_summary(project_id: str, req: SummaryRequest = SummaryRequest(),
                     user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    check_chat_limit(user)

    summary = ai_engine.generate_summary(project_id, user.language or "es", req.detail_level)

    # If export requested, generate the file directly
    if req.export_format == "docx":
        from docx_generator import summary_to_docx
        file_path = summary_to_docx(summary, summary.get("title", "Resumen de Estudio"))
        return FileResponse(
            file_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"{summary.get('title', 'Resumen')}.docx",
        )
    elif req.export_format == "pdf":
        from docx_generator import summary_to_pdf
        file_path = summary_to_pdf(summary, summary.get("title", "Resumen de Estudio"))
        return FileResponse(file_path, media_type="application/pdf",
                            filename=f"{summary.get('title', 'Resumen')}.pdf")

    _chat_timestamps.setdefault(user.id, []).append(datetime.utcnow())
    return summary


@app.post("/projects/{project_id}/summary/export-docx")
def export_summary_docx(project_id: str, data: dict,
                        user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    from middleware import get_tier
    tier = get_tier(user)
    if tier == "free":
        raise HTTPException(403, "Exportar requiere Plan Pro o superior.")
    from docx_generator import summary_to_docx
    title = data.get("title", "Resumen de Estudio")
    file_path = summary_to_docx(data, title)
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"{title}.docx",
    )


@app.post("/projects/{project_id}/summary/export-pdf")
def export_summary_pdf(project_id: str, data: dict,
                       user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    from middleware import get_tier
    tier = get_tier(user)
    if tier == "free":
        raise HTTPException(403, "Exportar requiere Plan Pro o superior.")
    from docx_generator import summary_to_pdf
    title = data.get("title", "Resumen de Estudio")
    file_path = summary_to_pdf(data, title)
    return FileResponse(file_path, media_type="application/pdf",
                        filename=f"{title}.pdf")


# ─── Chat PDF export ─────────────────────────────────────────
@app.post("/projects/{project_id}/chat/export-pdf")
def export_chat_pdf(project_id: str, req: ExportPdfRequest,
                    user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    from middleware import get_tier
    tier = get_tier(user)
    if tier == "free":
        raise HTTPException(403, "Exportar a PDF requiere Plan Pro o superior.")
    from docx_generator import chat_to_pdf
    file_path = chat_to_pdf(req.messages, req.title)
    return FileResponse(file_path, media_type="application/pdf",
                        filename=f"{req.title}.pdf")


# ─── Concept map ─────────────────────────────────────────────
@app.post("/projects/{project_id}/concept-map")
def generate_concept_map(project_id: str, user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    check_chat_limit(user)
    result = ai_engine.generate_concept_map(project_id, user.language or "es")
    _chat_timestamps.setdefault(user.id, []).append(datetime.utcnow())
    return result


# ─── Visual explanation ──────────────────────────────────────
class VisualExplainRequest(BaseModel):
    topic: str

@app.post("/projects/{project_id}/explain-visual")
def explain_with_visuals(project_id: str, req: VisualExplainRequest,
                         user: User = Depends(get_current_user)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    check_chat_limit(user)
    result = ai_engine.explain_with_visuals(project_id, req.topic, user.language or "es")
    _chat_timestamps.setdefault(user.id, []).append(datetime.utcnow())
    return result


@app.post("/projects/{project_id}/study-plan")
def generate_study_plan(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Analyze quiz/flashcard performance and generate personalized study plan."""
    from database import StudyPlan, gen_id
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso")

    # Gather performance data
    from database import StudySession
    from sqlalchemy import func

    sessions = db.query(StudySession).filter(
        StudySession.user_id == user.id, StudySession.project_id == project_id
    ).all()

    total_time = sum(s.duration_seconds or 0 for s in sessions)

    # Generate plan with AI
    lang = user.language or "es"
    lang_name = 'español' if lang == 'es' else 'inglés' if lang == 'en' else lang
    system = STUDY_PLAN_PROMPT.format(lang=lang_name)

    all_text = ai_engine._get_all_text(project_id)
    user_prompt = f"""Material del curso:\n{all_text[:8000]}\n\nTiempo total estudiado: {total_time // 60} minutos.\nGenera un plan de estudio de 7 días para este material."""

    try:
        result_text = ai_engine._call_claude(system, user_prompt, model="claude-haiku-4-5-20251001")
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        if start >= 0 and end > start:
            result = json.loads(result_text[start:end])
        else:
            result = json.loads(result_text)
    except Exception:
        result = {"weakTopics": [], "strongTopics": [], "overallScore": 50,
                  "recommendations": "No se pudo analizar. Sube más documentos.", "dailyPlan": []}

    # Save plan
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == user.id, StudyPlan.project_id == project_id
    ).first()
    if not plan:
        plan = StudyPlan(id=gen_id(), user_id=user.id, project_id=project_id)
        db.add(plan)

    import json as json_mod
    plan.weak_topics = json_mod.dumps(result.get("weakTopics", []))
    plan.strong_topics = json_mod.dumps(result.get("strongTopics", []))
    plan.recommendations = result.get("recommendations", "")
    plan.daily_goals = json_mod.dumps(result.get("dailyPlan", []))
    plan.overall_score = result.get("overallScore", 50)
    plan.updated_at = datetime.utcnow()
    db.commit()

    return result


@app.get("/projects/{project_id}/study-plan")
def get_study_plan(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import StudyPlan
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == user.id, StudyPlan.project_id == project_id
    ).first()
    if not plan:
        return None
    import json as json_mod
    return {
        "weakTopics": json_mod.loads(plan.weak_topics or "[]"),
        "strongTopics": json_mod.loads(plan.strong_topics or "[]"),
        "overallScore": plan.overall_score or 0,
        "recommendations": plan.recommendations or "",
        "dailyPlan": json_mod.loads(plan.daily_goals or "[]"),
        "updatedAt": plan.updated_at.isoformat() if plan.updated_at else "",
    }


@app.post("/translate")
def translate_text(req: TranslateRequest, user: User = Depends(get_current_user)):
    """Translate text using AI."""
    source_hint = f" from {req.source_language}" if req.source_language else ""

    LANG_NAMES = {
        "es": "Spanish", "en": "English", "pt": "Portuguese", "fr": "French",
        "de": "German", "it": "Italian", "zh": "Chinese", "ja": "Japanese",
        "ko": "Korean", "ar": "Arabic", "ru": "Russian", "hi": "Hindi",
        "tr": "Turkish", "nl": "Dutch", "pl": "Polish", "sv": "Swedish",
        "da": "Danish", "no": "Norwegian", "fi": "Finnish", "el": "Greek",
        "he": "Hebrew", "th": "Thai", "vi": "Vietnamese", "id": "Indonesian",
        "ms": "Malay", "tl": "Filipino", "uk": "Ukrainian", "cs": "Czech",
        "ro": "Romanian", "hu": "Hungarian", "ca": "Catalan", "hr": "Croatian",
        "bg": "Bulgarian", "sk": "Slovak", "sl": "Slovenian", "lt": "Lithuanian",
        "lv": "Latvian", "et": "Estonian", "sw": "Swahili", "bn": "Bengali",
    }
    target_name = LANG_NAMES.get(req.target_language, req.target_language)

    system = TRANSLATE_PROMPT.format(source_hint=source_hint, target_name=target_name)

    result = ai_engine._call_claude(system, req.text, model="claude-haiku-4-5-20251001")
    return {"translated": result.strip(), "targetLanguage": req.target_language}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8899))
    uvicorn.run(app, host="0.0.0.0", port=port)
