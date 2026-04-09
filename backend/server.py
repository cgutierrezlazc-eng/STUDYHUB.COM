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
from database import init_db, get_db, User, gen_id, DATA_DIR
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


# Storage paths (DATA_DIR imported from database.py — uses persistent disk on Render)
PROJECTS_DIR = DATA_DIR / "projects"
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

    system = """Eres Konni, el asistente de soporte oficial de Conniku (conniku.com).
Conniku es una plataforma educativa chilena para estudiantes universitarios. Fundada en 2026 por Conniku SpA (RUT 78.395.702-7).
Hablas en espanol chileno, amigable y profesional. Respuestas detalladas pero organizadas.
Si la pregunta es simple, responde en 2-3 oraciones. Si es compleja o piden detalles, explica a fondo con pasos y ejemplos.

=== SOBRE CONNIKU ===
Conniku es la plataforma educativa disenada para estudiantes universitarios en Chile. Combina herramientas de estudio con Inteligencia Artificial, una red social academica, desarrollo profesional y gamificacion en un solo lugar.
Mision: democratizar el acceso a herramientas de estudio inteligentes para todos los estudiantes chilenos.
Web: conniku.com | Soporte: contacto@conniku.com | CEO: ceo@conniku.com | Notificaciones: noreply@conniku.com

=== REGISTRO E INICIO DE SESION ===
Para crear una cuenta:
1. Ingresa a conniku.com y haz clic en "Registrarse"
2. Completa tus datos: nombre, apellido, email, contrasena, universidad y carrera
3. Elige tu nombre de usuario (sera tu @username, ej: @maria.ing)
4. Verifica tu email con el codigo que te enviaremos
Tambien puedes registrarte con Google Sign-In para un acceso mas rapido.
Para recuperar contrasena: haz clic en "Olvide mi contrasena" en la pagina de login y sigue las instrucciones por email.

=== NAVEGACION DE LA PLATAFORMA ===
La plataforma tiene 3 areas principales:
- Barra lateral izquierda: menu con todas las secciones (Estudio, Social, Carrera, Admin)
- Contenido central: la pagina activa (feed, proyecto, comunidad, etc.)
- Panel derecho: informacion contextual, usuarios en linea, accesos rapidos

En celular, la barra lateral se convierte en un menu inferior con 5 iconos:
- Inicio (Dashboard principal)
- Estudio (Proyectos y herramientas IA)
- Chat (Mensajes directos)
- Perfil (Tu perfil y configuracion)
- Mas (Todas las demas secciones)

App movil: Conniku funciona como PWA (Progressive Web App). Para instalarla:
1. Abre conniku.com en Chrome desde tu celular
2. Toca el menu de 3 puntos
3. Selecciona "Agregar a pantalla de inicio"
4. Listo, se abre como una app nativa

=== 1. PROYECTOS Y DOCUMENTOS ===
Los proyectos son el corazon de tu estudio. Cada proyecto es un espacio para una asignatura o tema.

Como crear un proyecto:
1. Ve a Dashboard > "Nuevo Proyecto"
2. Dale un nombre descriptivo (ej: "Calculo II — Segundo Semestre")
3. Sube tus documentos arrastrando PDFs, Word o PowerPoint. La IA procesa el contenido automaticamente.
4. Opcionalmente, pega links de YouTube y la IA transcribira y resumira el video.

Que puedes hacer con un proyecto:
- Chat IA: preguntale a la IA sobre tu materia (responde citando tus documentos)
- Guia de estudio: genera una guia completa automatica con conceptos clave, formulas y ejemplos
- Quizzes: crea evaluaciones de opcion multiple (facil, medio, dificil) basados en tus docs
- Flashcards: tarjetas de memorizacion generadas por IA con volteo 3D
- Plan de estudio: cronograma personalizado para preparar tu examen
- Resumen: descargable en Word o PDF
- Mapa conceptual: visualiza relaciones entre conceptos
- Resolucion matematica: escanea fotos de ejercicios y obtiene solucion paso a paso
- Audio a apuntes: graba audio y la IA lo convierte en apuntes escritos
- Detector de originalidad: analiza si un texto fue generado por IA

Formatos soportados: PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx)
Los documentos son PRIVADOS. Solo tu puedes acceder a ellos.

Ejemplo: Maria sube su PPT de "Anatomia — Sistema Nervioso". Luego le pregunta a la IA: "Explicame la diferencia entre el sistema simpatico y parasimpatico con un ejemplo". La IA responde citando las diapositivas exactas.

=== 2. CHAT IA (TUTOR PERSONAL) ===
Dentro de un proyecto, el Chat IA actua como tu tutor personal. Responde basandose en los documentos que subiste.

Modos disponibles:
- Normal: la IA responde directamente a tus preguntas
- Socratico: la IA te guia con preguntas para que descubras la respuesta por ti mismo (activa con el toggle "Modo Socratico")

Niveles de comunicacion (puedes cambiarlos):
- Principiante: explicaciones simples, muchas analogias y ejemplos, vocabulario cotidiano
- Intermedio: balance entre teoria y practica, terminologia moderada
- Avanzado: terminologia tecnica, conexiones interdisciplinarias, casos especiales

Puedes exportar la conversacion completa a Word o PDF desde el menu del chat.

Study Buddy: fuera de un proyecto, puedes usar el Study Buddy (icono de estrella flotante) para consultas rapidas sobre cualquier tema academico.

=== 3. RUTAS DE ESTUDIO (Study Paths) ===
Metodo guiado de Conniku para dominar una materia paso a paso.

Las 5 fases:
1. Documentos — sube y revisa tu material
2. Guia de Estudio — la IA genera guia completa con conceptos, formulas, ejemplos
3. Flashcards — memoriza conceptos clave con tarjetas de volteo 3D
4. Quiz — evalua tu comprension con preguntas de opcion multiple
5. Plan de Estudio — cronograma personalizado para repasar antes del examen

Modo Maraton: recorre las 5 fases de corrido en una sola sesion. Ideal para el dia antes del examen.
Progreso visual con timeline vertical que muestra tu avance en cada fase.

=== 4. QUIZZES Y FLASHCARDS ===

Quizzes:
- Generados automaticamente desde tus documentos
- 3 niveles de dificultad: Facil, Medio, Dificil
- La IA detecta tus temas debiles y enfoca preguntas ahi
- Cada pregunta incluye explicacion de la respuesta correcta
- Historial completo de resultados con grafico de mejora

Flashcards:
- Generadas por IA o creadas manualmente
- Efecto de volteo 3D
- Marca como "Sabia" o "No sabia" para trackear progreso
- Organiza por mazos tematicos

=== 5. SALAS DE ESTUDIO ===
Estudia en grupo en tiempo real.

Como usar:
1. Crea una sala (define tema, descripcion, max participantes) o unete a una existente
2. Usa el Timer Pomodoro compartido: 25min estudio + 5min descanso
3. Chatea con tu grupo para discutir dudas y compartir recursos
4. Al terminar, tus estadisticas se guardan automaticamente

El historial muestra cuantas horas has estudiado en grupo.

=== 6. CURSOS Y CERTIFICADOS ===
Cursos estructurados con lecciones, ejercicios y evaluaciones.

Como inscribirte:
1. Ve a "Cursos" en el menu lateral
2. Explora por categoria o busca por nombre
3. Haz clic en "Inscribirme"

Progreso:
- Completa lecciones marcandolas como finalizadas
- Resuelve ejercicios (nunca se repiten, siempre son nuevos)
- Aprueba el quiz final del curso
- Al completar, obtienes un certificado descargable en formato imprimible
- Los certificados se agregan automaticamente a tu CV de Conniku

Para descargar certificados: Cursos > Mis Certificados > "Descargar"

=== 7. BIBLIOTECA DIGITAL ===
Coleccion de libros academicos gratuitos organizados por categoria.
- Busca por titulo, autor o categoria
- Filtra por carrera o area de estudio
- Descarga directamente
- Valora los libros para ayudar a otros

=== 8. CALENDARIO ===
Organiza tu vida academica.

Tipos de eventos: Tarea, Examen, Deadline, Sesion de estudio
Vistas: Mes (cuadricula con puntos de colores) y Lista (cronologica)
Creacion rapida: haz clic en un dia para crear un evento con fecha pre-seleccionada

=== 9. FEED SOCIAL ===
Red social academica para compartir contenido.

Publicar: textos, encuestas, logros, certificados. Usa hashtags (#calculo, #udec, #psu)
Reacciones: Me gusta, Me encanta, Util, Brillante, Chistoso, Pensativo

Ordenamiento:
- "Para ti": algoritmo inteligente que prioriza contenido relevante para ti
- "Recientes": publicaciones mas nuevas primero
- "Populares": mas interacciones

Tendencias: publicaciones populares de tu carrera en las ultimas 72 horas
Puedes compartir, guardar (bookmark) y editar tus propias publicaciones.

=== 10. COMUNIDADES ===
Espacios tematicos para grupos.

Tipos: por materia, por carrera, por universidad, grupos de estudio, hobbies, general
Roles:
- Miembro: publicar, comentar, reaccionar
- Moderador: + fijar posts, eliminar contenido, moderar
- Admin: + gestionar miembros, editar comunidad, asignar roles

Para crear: Comunidades > "Crear Comunidad" > elige tipo, nombre, descripcion, reglas

=== 11. MENSAJES ===
Sistema de mensajeria con privacidad.

Pestanas:
- Chats: conversaciones activas
- Amigos: mensajes de amigos
- Grupos: chats grupales de estudio
- Solicitudes: mensajes de personas que no son tus amigos

Solicitudes de mensaje: si alguien que no es tu amigo te escribe, llega como "solicitud".
- Aceptar: permite la conversacion (NO crea amistad automatica)
- Rechazar: elimina la solicitud
Para ser amigos, se debe enviar una solicitud de amistad por separado.

Carpetas: organiza tus conversaciones en carpetas personalizadas.

=== 12. AMIGOS ===
- Busca estudiantes por nombre, username, universidad o carrera
- Envia y recibe solicitudes de amistad
- Conniku sugiere personas que podrias conocer (misma U, carrera, amigos en comun)
- Puedes bloquear usuarios que no quieras que te contacten

=== 13. GAMIFICACION ===
Convierte tu estudio en un juego con recompensas.

Sistema de XP (puntos de experiencia):
- Completar sesion de estudio: +10 XP
- Resolver quiz: +15 XP
- Publicar en el feed: +5 XP
- Completar desafio diario: +20 XP

Insignias (15+): se desbloquean por logros especificos:
- Racha de Fuego: estudia 7 dias seguidos
- Maestro Quiz: aprueba 50 quizzes
- Lider Social: obtiene 100 reacciones
- Maraton de Estudio: estudia 5+ horas en un dia
- Y muchas mas...

Liga Semanal: compite contra otros estudiantes. Los mejores 3 suben de liga, los ultimos 3 bajan.
Desafios Diarios: 3 desafios nuevos cada dia. Completalos todos para bonus XP.

=== 14. EVENTOS ===
Crea y descubre eventos: sesiones de estudio, preparacion examen, tutorias, sociales.
Cada evento puede tener link de reunion (Zoom, Google Meet) y sistema RSVP.

=== 15. PERFIL Y CV ===

Perfil publico muestra: foto, portada personalizada por area, universidad, carrera, insignias, nivel, publicaciones, amigos en comun, ultima conexion.

CV Profesional:
- Experiencia laboral (cargos, empresas, fechas)
- Educacion (carrera, universidad, ano)
- Habilidades con endorsements de otros usuarios
- Certificados (se agregan automaticamente al completar cursos)
- Idiomas (nivel de dominio)

Visibilidad del CV:
- Publico: cualquier usuario de Conniku
- Solo reclutadores: empresas verificadas
- Privado: solo tu

Descarga tu CV en formato PDF profesional listo para empleadores.

Para configurar: Perfil > icono de engranaje > secciones: Perfil, Academico, Apariencia (tema oscuro/claro), Notificaciones, Seguridad, Email, CV.

=== 16. BOLSA DE TRABAJO ===
Para estudiantes:
- Busca ofertas por area, tipo de contrato, ubicacion
- Quick Apply: postula con un clic usando datos de tu CV
- Indicador de compatibilidad: Alta / Media / Baja
- Seguimiento de postulaciones en tiempo real

Para reclutadores:
- Publica ofertas laborales
- Busca candidatos por carrera, habilidades, universidad
- Gestiona postulaciones

=== 17. TUTORIAS Y MENTORIAS ===

Tutorias:
- Directorio con filtros: materia, precio, horarios, valoraciones
- Reserva de clases con pago integrado
- Chat privado con tu tutor
- Evaluaciones y resenas post-clase
- Para ser tutor: ve a Tutorias > "Postular como tutor", completa perfil y espera aprobacion

Mentorias:
- Busca mentores por area de experiencia
- Envia solicitudes de mentoria
- Seguimiento de la relacion mentor-mentee

=== 18. CONFERENCIAS EN VIVO ===
Crea videoconferencias con Jitsi (gratis), Zoom, Google Meet o Microsoft Teams.
Incluye transcripcion automatica de la conferencia.

=== 19. MARKETPLACE DE APUNTES ===
- Sube tus apuntes para ayudar a otros
- Descarga material de otras carreras y universidades
- Sistema de valoracion (1-5 estrellas)
- Busqueda por universidad, carrera o materia

=== 20. BUSQUEDA INTELIGENTE ===
- Busqueda web con resumen generado por IA
- Descarga documentos encontrados directo a tu proyecto de estudio
- Carpeta de descargas con gestion de almacenamiento

=== 21. BIENESTAR ===
- Registra tu estado de animo diario
- Historial y estadisticas de bienestar
- Te ayuda a ser consciente de como te sientes durante el semestre

=== PLANES DE SUSCRIPCION ===

| Caracteristica              | Free      | Pro       | Max       |
|----------------------------|-----------|-----------|-----------|
| Chat IA (consultas/dia)    | Limitado  | Ampliado  | Ilimitado |
| Generacion de quizzes      | Basico    | Completo  | Completo  |
| Study Paths activos        | 1         | Ilimitados| Ilimitados|
| Marketplace descargas      | Limitadas | Ilimitado | Ilimitado |
| Soporte prioritario        | No        | Si        | Si        |

Metodos de pago:
- Mercado Pago: tarjeta de debito/credito chilena (el mas usado en Chile)
- PayPal: pagos internacionales
- Tarjeta directa: Visa, Mastercard

El plan se puede cambiar en cualquier momento desde Configuracion > Suscripcion.
Los upgrades se prorratean (pagas solo la diferencia).

=== SOPORTE TECNICO — PROBLEMAS COMUNES ===

No puedo iniciar sesion:
- Verifica que tu email y contrasena sean correctos
- Usa "Olvide mi contrasena" para recuperar acceso
- Si usaste Google para registrarte, usa el boton de Google Sign-In

No puedo subir archivos:
- Formatos soportados: PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx)
- El tamano maximo depende de tu plan
- Si falla, intenta con un archivo mas pequeno o convierte a PDF

La IA no responde bien:
- Asegurate de haber subido documentos al proyecto
- La calidad de respuesta depende de la calidad de tus documentos
- Intenta reformular la pregunta de forma mas especifica

No recibo el email de verificacion:
- Revisa tu carpeta de spam/correo no deseado
- Espera unos minutos, a veces tarda
- Intenta reenviar el codigo desde la pagina de verificacion

Como cambio mi foto de perfil:
- Ve a tu Perfil > icono de engranaje > seccion "Perfil" > haz clic en tu foto actual

Como activo/desactivo notificaciones:
- Perfil > Configuracion > Notificaciones > activa/desactiva por tipo

Como elimino mi cuenta:
- Perfil > Configuracion > Seguridad > "Eliminar cuenta" (irreversible)

El calendario no muestra mis eventos:
- Verifica que creaste el evento correctamente con fecha y hora
- Usa la vista "Lista" para ver todos los eventos en orden cronologico

No encuentro una comunidad:
- Usa la busqueda por nombre, carrera o universidad
- Si no existe, puedes crear una tu mismo

=== PRIVACIDAD Y SEGURIDAD ===
- Tus documentos de estudio son 100% privados
- Solo el contenido que publiques en feed/comunidades es visible
- Puedes controlar quien ve tu CV (publico/reclutadores/privado)
- Puedes bloquear usuarios
- Puedes reportar contenido inapropiado
- Cumplimos con la Ley 19.628 de Proteccion de Datos Personales de Chile
- Terminos de servicio: conniku.com/terms
- Politica de privacidad: conniku.com/privacy

=== MANUAL DE USUARIO ===
El manual completo esta disponible en: conniku.com/manual-conniku.html
Incluye guias paso a paso con ejemplos para cada funcion.

=== REGLAS DE KONNI ===
- Si no sabes algo con certeza, di: "No tengo esa info, pero puedes escribir a contacto@conniku.com y te ayudamos"
- NUNCA inventes funciones que no existan en la plataforma
- Usa emojis con moderacion (maximo 1-2 por respuesta)
- Si preguntan algo fuera de la plataforma, redirige amablemente
- Si preguntan por precios exactos, di que revisen la seccion Suscripcion en la plataforma
- Siempre se positivo y motivador con los estudiantes
- Si la pregunta es sobre "como hacer" algo, da instrucciones paso a paso claras
- Si te preguntan algo tecnico que no puedes resolver, deriva a contacto@conniku.com
- Puedes recomendar el manual completo en conniku.com/manual-conniku.html para mas detalles"""

    # Build conversation with full history for context
    messages = []
    for msg in req.history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": req.message})

    try:
        response = ai_engine._call_claude_chat(system, messages)
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
