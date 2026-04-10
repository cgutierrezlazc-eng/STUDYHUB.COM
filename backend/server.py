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
from database import init_db, get_db, User, gen_id, DATA_DIR, ChatUsage
from middleware import get_current_user
from document_processor import DocumentProcessor
from gemini_engine import AIEngine
import anthropic as anthropic_lib
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

# ─── Claude client (Konni) ────────────────────────────────────────
_ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
_claude_client = anthropic_lib.Anthropic(api_key=_ANTHROPIC_KEY) if _ANTHROPIC_KEY else None
CLAUDE_MODEL = "claude-haiku-4-5-20251001"

def _call_claude_chat(system: str, messages: list) -> str:
    """Call Claude API for Konni chat. Returns plain text response."""
    if not _claude_client:
        return "Lo siento, el asistente no está disponible en este momento."
    try:
        resp = _claude_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system,
            messages=messages,
        )
        return resp.content[0].text
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        return f"Lo siento, tuve un problema al responder. Puedes escribir a contacto@conniku.com para soporte. (Error: {str(e)[:80]})"


# Global exception handler: ensures 500 errors return JSON with CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
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
# Stripe removed — using MercadoPago (CLP) and PayPal (USD) only
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


# Storage paths (DATA_DIR imported from database.py — uses persistent disk on Render)
PROJECTS_DIR = DATA_DIR / "projects"
PROJECTS_DIR.mkdir(exist_ok=True)

COVERS_DIR = DATA_DIR / "uploads" / "covers"
COVERS_DIR.mkdir(parents=True, exist_ok=True)

doc_processor = DocumentProcessor()
ai_engine = AIEngine()  # Gemini — all AI features (chat, quizzes, guides, support)


@app.get("/uploads/covers/{filename}")
async def serve_cover_photo(filename: str):
    """Serve uploaded cover photo files."""
    file_path = COVERS_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "Imagen no encontrada")
    return FileResponse(str(file_path))

# ─── Chat rate limiting (persistent, DB-backed) ─────────────────

def check_chat_limit(user: User, db: Session = None):
    """Persistent rate limiting via DB. Falls back to no-limit if DB unavailable."""
    # Obtener límite según plan del usuario
    plan = getattr(user, 'subscription_tier', 'free') or 'free'
    limits = {'free': 20, 'pro': 100, 'max': 500}
    limit = limits.get(plan, 20)

    if db is None:
        return  # Si no hay DB disponible, permitir

    today = datetime.utcnow().strftime('%Y-%m-%d')

    try:
        usage = db.query(ChatUsage).filter(
            ChatUsage.user_id == str(user.id),
            ChatUsage.date == today
        ).first()

        if usage is None:
            usage = ChatUsage(user_id=str(user.id), date=today, count=0)
            db.add(usage)
            db.flush()

        if usage.count >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Límite diario de mensajes alcanzado ({limit}). Actualiza tu plan para más."
            )

        usage.count += 1
        db.commit()
    except HTTPException:
        raise
    except Exception:
        pass  # Si hay error de DB, no bloquear al usuario


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
    from pathlib import Path as _Path
    safe_name = _Path(file.filename).name  # extrae solo el basename, elimina path traversal
    file_path = docs_dir / safe_name

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
def chat(project_id: str, req: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")

    # Enforce chat limit for free/trial users
    check_chat_limit(user, db)

    response = ai_engine.chat(
        project_id, req.message, req.language, req.gender, req.language_skill,
        socratic=req.socratic
    )

    return {"response": response}


# ─── Support Chatbot — USER version (Gemini, personalized) ────
class SupportChatRequest(BaseModel):
    message: str
    history: list = []

def _build_user_context(user: User, db: Session) -> str:
    """Build personalized context string from user data for Konni."""
    from database import CalendarEvent, Friendship, WallPost
    parts = []

    # Profile
    parts.append(f"PERFIL: {user.first_name} {user.last_name} (@{user.username})")
    parts.append(f"Universidad: {user.university or 'No especificada'} | Carrera: {user.career or 'No especificada'} | Semestre: {user.semester}")
    parts.append(f"Plan: {user.subscription_tier or 'free'} | Nivel: {user.level} | XP: {user.xp} | Racha: {user.streak_days} dias")
    if user.bio:
        parts.append(f"Bio: {user.bio[:200]}")

    # Upcoming calendar events (next 14 days)
    try:
        upcoming = db.query(CalendarEvent).filter(
            CalendarEvent.user_id == user.id,
            CalendarEvent.due_date >= datetime.utcnow(),
            CalendarEvent.due_date <= datetime.utcnow() + timedelta(days=14),
            CalendarEvent.completed == False
        ).order_by(CalendarEvent.due_date).limit(10).all()
        if upcoming:
            parts.append("\nPROXIMOS EVENTOS (14 dias):")
            for ev in upcoming:
                date_str = ev.due_date.strftime("%d/%m %H:%M") if ev.due_date else "?"
                parts.append(f"  - [{ev.event_type}] {ev.title} — {date_str}")
    except Exception:
        pass

    # Projects (study subjects)
    try:
        user_projects = []
        for d in PROJECTS_DIR.iterdir():
            if d.is_dir():
                meta = get_project_meta(d.name)
                if meta and meta.get("user_id") == user.id:
                    doc_count = len(meta.get("documents", []))
                    user_projects.append(f"  - {meta.get('name', '?')} ({doc_count} docs)")
        if user_projects:
            parts.append(f"\nPROYECTOS DE ESTUDIO ({len(user_projects)}):")
            parts.extend(user_projects[:10])
    except Exception:
        pass

    # Friends (names only)
    try:
        friends_q = db.query(Friendship).filter(
            ((Friendship.user_id == user.id) | (Friendship.friend_id == user.id)),
            Friendship.status == "accepted"
        ).limit(15).all()
        if friends_q:
            friend_ids = []
            for f in friends_q:
                fid = f.friend_id if f.user_id == user.id else f.user_id
                friend_ids.append(fid)
            friends = db.query(User).filter(User.id.in_(friend_ids)).all()
            if friends:
                names = [f"{fr.first_name} (@{fr.username})" for fr in friends[:10]]
                parts.append(f"\nAMIGOS ({len(friends)}): {', '.join(names)}")

                # Recent public posts from friends
                recent_posts = db.query(WallPost).filter(
                    WallPost.author_id.in_(friend_ids),
                    WallPost.visibility == "public",
                    WallPost.created_at >= datetime.utcnow() - timedelta(days=3)
                ).order_by(desc(WallPost.created_at)).limit(5).all()
                if recent_posts:
                    parts.append("\nPOSTS RECIENTES DE AMIGOS (publicos, 3 dias):")
                    for p in recent_posts:
                        author = next((fr for fr in friends if fr.id == p.author_id), None)
                        name = f"@{author.username}" if author else "?"
                        parts.append(f"  - {name}: {p.content[:120]}...")
    except Exception:
        pass

    # Gamification badges
    try:
        badges = json.loads(user.badges or "[]")
        if badges:
            parts.append(f"\nINSIGNIAS: {', '.join(badges[:10])}")
    except Exception:
        pass

    # Pomodoro stats
    if user.pomodoro_total_sessions:
        parts.append(f"\nPOMODORO: {user.pomodoro_total_sessions} sesiones, {user.pomodoro_total_minutes} min totales")

    return "\n".join(parts)


KONNI_USER_SYSTEM = """Eres Konni, el asistente personal de Conniku (conniku.com).
Conniku es una plataforma educativa para universitarios, fundada en 2026 por Conniku SpA (Santiago, Chile).

TONO Y LENGUAJE — REGLA ABSOLUTA:
- Hablas en espanol estandar, profesional y claro. Nunca uses chilenismos, modismos, jerga coloquial ni expresiones informales (prohibido: "bacán", "po", "hartas", "cacha", "igual", "al tiro", "wena", ni similares).
- Tu tono es ameno, confiable y cercano, pero siempre profesional. Piensa en un asesor experto que se comunica con claridad y calidez, sin exceso de confianza ni familiaridad.
- No uses hiperboles ni entusiasmo exagerado ("increible!", "genial!", "super bien!"). Sé directo y genuino.
- Puedes usar el tuteo (tu/te) de forma natural, sin sonar ni distante ni excesivamente informal.
- Maximo 1 emoji por respuesta, solo si aporta claridad. Nunca como relleno.

IMPORTANTE: Tienes acceso a la informacion personal del estudiante (perfil, calendario, proyectos, amigos, progreso). Usa esa info para dar respuestas PERSONALIZADAS. Por ejemplo:
- Si preguntan "que tengo esta semana?" mira sus eventos del calendario
- Si preguntan "como voy?" revisa su racha, XP, nivel
- Si preguntan "en que estoy estudiando?" mira sus proyectos
- Si preguntan por un amigo, revisa la info de amigos
- Recuerdale proactivamente si tiene pruebas o deadlines proximos

=== FUNCIONES DE CONNIKU ===

1. ESTUDIO ASISTIDO: sube documentos (PDF/Word/PPT) a un proyecto, consulta sobre tu materia, genera guias de estudio, quizzes (facil/medio/dificil), flashcards 3D, planes de estudio, resumenes (exporta a Word/PDF), mapas conceptuales, resolucion matematica (escanea fotos), Study Buddy (consultas rapidas), Modo Socratico (guia con preguntas), detector originalidad, audio a apuntes, videos YouTube transcritos.

2. RUTAS DE ESTUDIO: flujo guiado 5 fases: Documentos > Guia > Flashcards > Quiz > Plan. Modo Maraton para repasar todo de corrido. Timeline vertical de progreso.

3. SALAS DE ESTUDIO: estudio grupal en tiempo real, Timer Pomodoro compartido (25/5 min), chat grupal, estadisticas guardadas.

4. CURSOS: lecciones + ejercicios (nunca se repiten) + quiz final = certificado descargable. Se agrega al CV automaticamente.

5. QUIZZES Y FLASHCARDS: genera desde documentos, 3 dificultades, deteccion de temas debiles, historial con graficos de mejora. Flashcards con volteo 3D.

6. FEED SOCIAL: publica contenido academico, encuestas, logros. Reacciones: me gusta, me encanta, util, brillante, chistoso, pensativo. Ordenamiento: Para ti (personalizado), Recientes, Populares. Hashtags y tendencias por carrera.

7. COMUNIDADES: por materia/carrera/universidad/hobbies. Roles: miembro, moderador, admin.

8. MENSAJES: directos + grupales + solicitudes de mensaje (privacidad). Aceptar solicitud NO crea amistad. Carpetas organizables.

9. AMIGOS: solicitudes, sugerencias por U/carrera, bloqueo, reporte.

10. CALENDARIO: eventos tipo Tarea/Examen/Deadline/Sesion. Vista Mes (cuadricula) y Lista. Clic en dia = creacion rapida.

11. MARKETPLACE: comparte/descarga apuntes, valoracion 1-5 estrellas, busqueda por U/carrera.

12. BIBLIOTECA: libros academicos gratuitos categorizados.

13. BOLSA DE TRABAJO: busca ofertas, Quick Apply con CV, indicador compatibilidad (Alta/Media/Baja), seguimiento. Reclutadores: publica y busca candidatos.

14. PERFIL Y CV: perfil publico (foto, portada, U, carrera, insignias, nivel). CV profesional (experiencia, educacion, habilidades con endorsements, certificados automaticos, idiomas). Visibilidad: publico/reclutadores/privado. Descarga PDF.

15. TUTORIAS: directorio tutores, reserva + pago, chat con tutor, resenas. MENTORIAS: busca mentores, solicitudes.

16. CONFERENCIAS: Jitsi/Zoom/Meet/Teams con transcripcion automatica.

17. EVENTOS: estudio, repaso, tutorias, sociales. RSVP + links de reunion.

18. GAMIFICACION: XP por sesiones (+10), quizzes (+15), posts (+5), desafios (+20). 15+ insignias. Liga semanal. Desafios diarios.

19. BIENESTAR: registro de animo diario, historial y estadisticas.

20. BUSQUEDA: web + resumen asistido, descarga a proyecto, gestion almacenamiento.

=== PLANES: Free (limitado) | Pro (ampliado) | Max (ilimitado). Pagos: Mercado Pago, PayPal, tarjeta. ===

=== SOPORTE TECNICO ===
Login: verifica email/contrasena, "Olvide mi contrasena", Google Sign-In.
Archivos: PDF, Word, PPT. Si falla, convierte a PDF.
Asistente no responde: verifica que subiste documentos, reformula la pregunta.
Email verificacion: revisa spam, espera, reenviar codigo.
Foto perfil: Perfil > engranaje > Perfil > clic en foto.
Notificaciones: Perfil > Configuracion > Notificaciones.
Eliminar cuenta: Configuracion > Seguridad > Eliminar (irreversible).
PWA movil: Chrome > menu 3 puntos > Agregar a pantalla de inicio.

=== REGLAS DE KONNI ===
- NUNCA inventes funciones que no existan en la plataforma
- NUNCA reveles informacion administrativa (HR, payroll, finanzas, empleados)
- NUNCA uses chilenismos, jerga coloquial ni lenguaje informal (ver regla de tono arriba)
- Maximo 1 emoji por respuesta. Nunca uses emojis como relleno o entusiasmo vacio
- Si preguntan algo fuera del alcance de la plataforma, redirige con claridad y sin rodeos
- Si no tienes la informacion: "No cuento con esa informacion. Puedes escribir a contacto@conniku.com"
- Da instrucciones paso a paso cuando pregunten como hacer algo
- Si el usuario tiene examenes o deadlines proximos, mencionalo de forma puntual, no dramatica
- Manual completo: conniku.com/manual-conniku.html

=== TERMINOS Y CONDICIONES (resumen para usuarios) ===
Puedes responder preguntas sobre los terminos de Conniku con esta informacion:

ELEGIBILIDAD: Debes ser mayor de 18 anos (o tener autorizacion del representante legal). Una sola cuenta por persona.

QUE ES CONNIKU: Empresa de tecnologia (Conniku SpA, Santiago, Chile). NO es institucion educativa acreditada por el Ministerio de Educacion. Los certificados emitidos son constancias de finalizacion interna, NO titulos academicos ni certificaciones oficiales.

SUSCRIPCIONES: Se renuevan automaticamente. Para cancelar: Configuracion > Suscripcion > Cancelar. Los precios pueden cambiar con 30 dias de aviso previo. No hay reembolso por periodos ya iniciados.

PRIVACIDAD: Los datos personales se tratan conforme a la Ley 19.628 (Chile). No se venden a terceros. Puedes solicitar eliminacion en Configuracion > Seguridad > Eliminar cuenta (irreversible).

TUTORES: Son prestadores independientes, no empleados de Conniku. Conniku facilita la plataforma pero no garantiza la calidad del servicio de cada tutor.

CONTENIDO IA: Las respuestas generadas por inteligencia artificial pueden contener errores. No reemplaza consejo profesional (medico, legal, financiero).

PROPIEDAD INTELECTUAL: La marca Conniku esta en proceso de registro ante INAPI (Chile). El contenido de la plataforma es propiedad de Conniku SpA.

DISPUTAS: Se rigen por la ley chilena. Tribunales competentes de Santiago.

Para dudas sobre terminos: contacto@conniku.com"""


@app.post("/support/chat")
def support_chat(req: SupportChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Konni USER — personalized assistant powered by Claude."""
    check_chat_limit(user, db)

    # Build personalized context
    user_context = _build_user_context(user, db)
    today = datetime.utcnow().strftime("%A %d de %B %Y, %H:%M UTC")

    system = f"""{KONNI_USER_SYSTEM}

=== DATOS DEL ESTUDIANTE (hoy es {today}) ===
{user_context}"""

    # Build conversation with full history
    messages = []
    for msg in req.history[-12:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": req.message})

    response = _call_claude_chat(system, messages)
    return {"response": response}


# ─── Support Chatbot — ADMIN version (Claude, full admin knowledge) ────

KONNI_ADMIN_SYSTEM = """Eres Konni Admin, el asistente ejecutivo de Conniku para el panel de administracion.
Hablas en espanol profesional, directo y preciso. Nunca uses chilenismos, modismos ni lenguaje coloquial. Solo el CEO/owner tiene acceso a ti.

=== SOBRE CONNIKU ===
Conniku SpA — RUT 78.395.702-7 — Fundada 2026 — Giro 631200 (desarrollo software) — Micro Empresa — Afecto IVA — Regimen ProPyme 14D3
Web: conniku.com | CEO: ceo@conniku.com | Soporte: contacto@conniku.com | Notificaciones: noreply@conniku.com

=== MODULOS ADMIN DISPONIBLES ===

RRHH & PERSONAL:
- Directorio de empleados (datos personales, contratos, posiciones)
- Gestion de contratos: plazo fijo 30d > 60d > indefinido (o salto directo por CEO)
- Asistencia y horarios (jornada Art. 22, horas extra)
- Vacaciones y permisos (15 dias habiles/ano, progresivos Art. 68)
- Onboarding: checklist 15 items (Art. 9, 153, 177 CT, Ley 16.744)
- Offboarding: checklist 10 items
- Documentos del trabajador: boveda digital, 6 categorias (Identidad, Previsional, Laboral, Legal, Formacion, Salud)
- Evaluacion de desempeno: 90/180/360 grados, KPIs ponderados, metas
- Reclutamiento: pipeline Kanban 8 etapas, base de candidatos
- Capacitacion: planes formativos, franquicia SENCE (Ley 19.518), ODI (Art. 21 DS 40)
- Control de acceso por modulo/empleado

PAYROLL & LEGAL:
- Liquidaciones de sueldo (cierre dia 22, pago ultimo dia habil)
- Dias 23-31 se arrastran al mes siguiente
- Anticipo quincenal: solo por solicitud, desde 2do mes, max 40% sueldo al cierre 22
- Retenciones: AFP, Salud (Fonasa/Isapre), AFC (seguro cesantia), Impuesto Unico 2da Categoria, Pension Alimentos, APV
- Previred (planilla previsional)
- Finiquitos (Art. 159-171 CT)
- Historial de pagos
- Libro electronico de remuneraciones
- DJ1887 (declaracion jurada anual)
- Impuestos F129
- Inspeccion del trabajo

FINANZAS:
- Dashboard ejecutivo (KPIs, reporte semanal)
- Gastos operacionales (control, proveedores, categorias)
- Panel financiero (ingresos, suscripciones, metricas)
- Contabilidad (plan de cuentas, asientos)
- Facturacion/DTE (factura electronica via SII)
- Presupuestos (por centro de costo, analisis varianza)
- Analytics (usuarios, engagement, growth)

LEGAL & COMPLIANCE:
- Estado de cumplimiento legal
- Deteccion anti-fraude
- Ley 19.628 (proteccion datos personales)

HERRAMIENTAS:
- Email CEO (ceo@conniku.com) — envio manual, inbox, broadcast
- Email Soporte (contacto@conniku.com)
- Certificados laborales
- AI Workflows (marketing, QA, diseno, moderacion)
- Tutores externos (directorio, aprobacion, pagos)
- Push Notifications (broadcast)
- Guia del owner

=== INDICADORES CHILENOS (desde mindicador.cl, cache 1hr) ===
UF, UTM, USD, Ingreso Minimo Mensual (IMM)

=== REGLAS ===
- Responde con precision legal cuando pregunten sobre leyes laborales chilenas
- Si no estas seguro de un valor legal (tasa AFP, tramo impuesto), di que verifiquen en el SII o AFC
- Da instrucciones claras sobre como navegar el panel admin
- Si preguntan de usuarios/plataforma, tienes todo el conocimiento del manual de usuario tambien
- Respuestas profesionales, sin emojis excesivos
- Si necesitan algo fuera de tus capacidades, sugiere contactar al contador o abogado"""


@app.post("/support/admin-chat")
def support_admin_chat(req: SupportChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Konni ADMIN — executive assistant powered by Claude (owner only)."""
    if user.role != "owner":
        raise HTTPException(403, "Solo el owner tiene acceso a Konni Admin")

    check_chat_limit(user, db)

    today = datetime.utcnow().strftime("%A %d de %B %Y, %H:%M UTC")
    system = f"""{KONNI_ADMIN_SYSTEM}

Hoy es: {today}
Usuario: {user.first_name} {user.last_name} (CEO)"""

    messages = []
    for msg in req.history[-12:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": req.message})

    response = _call_claude_chat(system, messages)
    return {"response": response}


class StudyBuddyRequest(BaseModel):
    message: str
    context: str = ""  # page context: subject name, topic, etc.
    history: list = []

# ─── T&C knowledge block (shared between Konni and StudyBuddy) ──────────────
KONNI_TYC = """=== TERMINOS Y CONDICIONES DE CONNIKU (resumen) ===
Puedes responder preguntas sobre los terminos de Conniku con esta informacion:

IDENTIDAD: Conniku SpA, sociedad chilena con domicilio en Santiago. Sitio: conniku.com.

QUE ES CONNIKU: Plataforma digital de estudio para universitarios. NO es institucion educativa acreditada por el Ministerio de Educacion. Los certificados emitidos son constancias de finalizacion interna, NO titulos academicos ni certificaciones oficiales.

REGISTRO: El usuario debe ser mayor de 16 anos. Debe proporcionar datos veraces. Una sola cuenta por persona. El usuario es responsable de la confidencialidad de sus credenciales.

SUSCRIPCIONES Y PAGOS:
- Free (Gratuito): funcionalidades basicas.
- Pro: $4.990 CLP/mes. Funcionalidades avanzadas y generacion de contenido asistida.
- Max: $9.990 CLP/mes. Todo Pro + asistente ilimitado + soporte prioritario.
- Los precios incluyen IVA cuando corresponda. Pago mensual recurrente.
- El usuario puede cancelar en cualquier momento; mantiene acceso hasta fin del periodo pagado.
- Los precios pueden cambiar con al menos 30 dias de aviso previo.

PROPIEDAD INTELECTUAL:
- Todo el contenido de la plataforma es propiedad de Conniku SpA (Ley 17.336, Chile).
- El contenido generado por IA es herramienta de apoyo; Conniku no garantiza su exactitud.
- El usuario conserva la propiedad de sus documentos; otorga licencia limitada a Conniku solo para prestar el servicio.
- Marca Conniku en proceso de registro ante INAPI.

USO ACEPTABLE — PROHIBIDO:
- Plagio academico o deshonestidad academica.
- Contenido ilegal, ofensivo, difamatorio u obsceno.
- Spam o publicidad no autorizada.
- Acceso no autorizado a cuentas o datos de otros usuarios.
- Uso de bots o scrapers.
- Suplantacion de identidad.
- El incumplimiento puede resultar en suspension o cancelacion sin reembolso.

PRIVACIDAD: Los datos personales se tratan conforme a la Ley 19.628 (Chile). No se venden a terceros. Puedes eliminar tu cuenta en Configuracion > Seguridad > Eliminar cuenta (accion irreversible).

TUTORES: Son prestadores de servicios independientes, no empleados de Conniku. Conniku facilita la plataforma pero no garantiza la calidad de cada tutor.

CONTENIDO IA: Las respuestas de la IA pueden contener errores. No reemplazan consejo profesional (medico, legal, financiero).

LIMITACION DE RESPONSABILIDAD: Conniku presta el servicio "tal como esta". No garantiza disponibilidad continua ni ausencia de errores. No se hace responsable por resultados academicos ni por danos indirectos.

SUSPENSION Y TERMINACION: Conniku puede suspender cuentas que incumplan los terminos sin previo aviso y sin reembolso. El usuario puede eliminar su cuenta desde la configuracion.

DISPUTAS: Ley chilena. Tribunales ordinarios de Santiago de Chile.

Para consultas sobre terminos: contacto@conniku.com"""

@app.post("/ai/study-buddy")
def study_buddy_chat(req: StudyBuddyRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """AI Study Buddy — contextual study help using Gemini (free)."""
    check_chat_limit(user, db)

    context_info = f"\nContexto actual del estudiante: {req.context}" if req.context else ""

    system = f"""Eres Konni, el Study Buddy de Conniku, un companero de estudio inteligente.
Tu rol es ayudar al estudiante con cualquier tema academico de forma clara y didactica.
Responde en espanol, de forma amigable y cercana. Nunca uses chilenismos ni jerga coloquial.
{context_info}

Reglas academicas:
- Respuestas concisas pero completas (max 200 palabras)
- Usa ejemplos practicos cuando sea posible
- Si hay formulas, usa notacion clara
- Motiva al estudiante, se positivo
- Si no sabes algo, dilo honestamente
- Nunca digas "como modelo de lenguaje", "como IA" ni "como inteligencia artificial" — eres un asistente de Conniku
- Si preguntan algo no academico pero relacionado con la plataforma (planes, terminos, privacidad), responde con la informacion disponible
- Si preguntan algo completamente fuera del alcance, redirige amablemente al estudio o a contacto@conniku.com

{KONNI_TYC}"""

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
    from pathlib import Path as _Path
    safe_audio_name = _Path(file.filename or 'recording.webm').name  # extrae solo el basename, elimina path traversal
    filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{safe_audio_name}"
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
        result_text = ai_engine._call_gemini(system, user_prompt)

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
        result_text = ai_engine._call_gemini(system, prompt)
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
        import google.generativeai as genai_vision

        # Detect image type from base64 header
        mime_type = "image/jpeg"
        if req.image_base64.startswith("data:"):
            parts = req.image_base64.split(",", 1)
            if "png" in parts[0]: mime_type = "image/png"
            elif "webp" in parts[0]: mime_type = "image/webp"
            image_data = parts[1] if len(parts) > 1 else req.image_base64
        else:
            image_data = req.image_base64

        model = genai_vision.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system,
        )
        response = model.generate_content(
            [
                {"mime_type": mime_type, "data": base64.b64decode(image_data)},
                "Resuelve este problema paso a paso.",
            ],
            generation_config=genai_vision.types.GenerationConfig(max_output_tokens=4096, temperature=0.3),
        )
        result = response.text
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
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    check_chat_limit(user, db)

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
def generate_concept_map(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    check_chat_limit(user, db)
    result = ai_engine.generate_concept_map(project_id, user.language or "es")
    return result


# ─── Visual explanation ──────────────────────────────────────
class VisualExplainRequest(BaseModel):
    topic: str

@app.post("/projects/{project_id}/explain-visual")
def explain_with_visuals(project_id: str, req: VisualExplainRequest,
                         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meta = get_project_meta(project_id)
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    check_chat_limit(user, db)
    result = ai_engine.explain_with_visuals(project_id, req.topic, user.language or "es")
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
        result_text = ai_engine._call_gemini(system, user_prompt)
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

    result = ai_engine._call_gemini(system, req.text)
    return {"translated": result.strip(), "targetLanguage": req.target_language}


# ─────────────────────────────────────────────────────────────
#  EMPLOYEE ATTENDANCE / MARCAJE
# ─────────────────────────────────────────────────────────────

@app.post("/hr/attendance/clock")
def clock_attendance(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Record clock-in or clock-out for the authenticated employee."""
    from database import EmployeeAttendance
    action = data.get("action")  # 'in' | 'out'
    if action not in ("in", "out"):
        raise HTTPException(400, "action must be 'in' or 'out'")

    # Chile TZ offset (UTC-3 / UTC-4 in DST — use UTC-3 as standard)
    from datetime import timezone, timedelta
    chile_tz = timezone(timedelta(hours=-3))
    now_chile = datetime.now(chile_tz)
    date_str = now_chile.strftime("%Y-%m-%d")

    record = EmployeeAttendance(
        id=gen_id(),
        user_id=user.id,
        action=action,
        timestamp=datetime.utcnow(),
        date=date_str,
        note=data.get("note"),
    )
    db.add(record)
    db.commit()
    return {
        "status": "ok",
        "action": action,
        "timestamp": record.timestamp.isoformat(),
        "date": date_str,
    }


@app.get("/hr/attendance/mine")
def get_my_attendance(limit: int = 60, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the last N attendance records for the authenticated user."""
    from database import EmployeeAttendance
    records = (
        db.query(EmployeeAttendance)
        .filter(EmployeeAttendance.user_id == user.id)
        .order_by(EmployeeAttendance.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {"records": [
        {
            "id": r.id,
            "action": r.action,
            "timestamp": r.timestamp.isoformat(),
            "date": r.date,
            "note": r.note,
        }
        for r in records
    ]}


@app.get("/hr/attendance/all")
def get_all_attendance(date: str = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin only — return attendance records for all employees."""
    from database import EmployeeAttendance
    if not getattr(user, "is_admin", False) and user.role != "owner":
        raise HTTPException(403, "Admin only")
    q = db.query(EmployeeAttendance, User).join(User, EmployeeAttendance.user_id == User.id)
    if date:
        q = q.filter(EmployeeAttendance.date == date)
    rows = q.order_by(EmployeeAttendance.timestamp.desc()).limit(500).all()
    return {"records": [
        {
            "id": r.id,
            "action": r.action,
            "timestamp": r.timestamp.isoformat(),
            "date": r.date,
            "note": r.note,
            "userId": u.id,
            "userName": f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email,
            "userEmail": u.email,
        }
        for r, u in rows
    ]}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8899))
    uvicorn.run(app, host="0.0.0.0", port=port)
