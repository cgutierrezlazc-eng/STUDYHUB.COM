"""Courses platform for integral professional development."""
import json
import random
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import (get_db, User, Course, CourseLesson, CourseQuiz,
                      UserCourseProgress, UserExerciseHistory, StudentCV, gen_id)
from middleware import get_current_user

router = APIRouter(prefix="/courses", tags=["courses"])

# ─── Course Catalog ─────────────────────────────────────────

COURSE_CATALOG = [
    # Communication
    {"title": "Comunicación Efectiva", "description": "Aprende a expresar ideas con claridad, escuchar activamente y adaptar tu mensaje a cualquier audiencia.", "category": "communication", "emoji": "🗣️", "difficulty": "beginner", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Storytelling y Presentaciones", "description": "Domina el arte de contar historias que inspiren y presentaciones que cautiven.", "category": "communication", "emoji": "🎤", "difficulty": "intermediate", "estimated_minutes": 35, "lesson_count": 5},
    {"title": "Redacción Profesional", "description": "Escribe correos, informes y propuestas que comuniquen con precisión y profesionalismo.", "category": "communication", "emoji": "✍️", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Comunicación Intercultural", "description": "Navega diferencias culturales y comunícate efectivamente en entornos diversos y globales.", "category": "communication", "emoji": "🌍", "difficulty": "intermediate", "estimated_minutes": 30, "lesson_count": 5},

    # Leadership
    {"title": "Fundamentos de Liderazgo", "description": "Descubre tu estilo de liderazgo y aprende a inspirar equipos hacia objetivos comunes.", "category": "leadership", "emoji": "👑", "difficulty": "beginner", "estimated_minutes": 35, "lesson_count": 6},
    {"title": "Liderazgo Empático", "description": "Lidera desde la comprensión. Conecta con tu equipo a nivel humano para resultados extraordinarios.", "category": "leadership", "emoji": "💛", "difficulty": "intermediate", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Gestión de Equipos", "description": "Herramientas prácticas para coordinar, motivar y sacar lo mejor de cada miembro de tu equipo.", "category": "leadership", "emoji": "🤝", "difficulty": "intermediate", "estimated_minutes": 35, "lesson_count": 6},
    {"title": "Mentoría: Guiar y Ser Guiado", "description": "Aprende a ser un buen mentor y a aprovechar al máximo tener uno.", "category": "leadership", "emoji": "🧭", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},

    # Emotional Intelligence
    {"title": "Inteligencia Emocional", "description": "Conoce, entiende y gestiona tus emociones. La base de todas las habilidades interpersonales.", "category": "emotional", "emoji": "🧠", "difficulty": "beginner", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Manejo del Estrés y Resiliencia", "description": "Estrategias probadas para manejar la presión académica y profesional sin quebrarte.", "category": "emotional", "emoji": "🛡️", "difficulty": "beginner", "estimated_minutes": 30, "lesson_count": 5, "is_featured": True},
    {"title": "Autoestima y Confianza", "description": "Construye una base sólida de autoestima que te sostenga en los momentos difíciles.", "category": "emotional", "emoji": "💪", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Manejo de la Frustración", "description": "Transforma la frustración en combustible. Técnicas para no rendirte cuando las cosas se ponen difíciles.", "category": "emotional", "emoji": "🔥", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Empatía Aplicada", "description": "Desarrolla la capacidad de entender genuinamente a los demás y actuar desde esa comprensión.", "category": "emotional", "emoji": "❤️", "difficulty": "intermediate", "estimated_minutes": 25, "lesson_count": 5},

    # Thinking
    {"title": "Pensamiento Crítico", "description": "Analiza información, detecta sesgos y toma decisiones fundamentadas, no impulsivas.", "category": "thinking", "emoji": "🔍", "difficulty": "intermediate", "estimated_minutes": 35, "lesson_count": 6},
    {"title": "Toma de Decisiones", "description": "Frameworks y técnicas para decidir con claridad incluso bajo presión e incertidumbre.", "category": "thinking", "emoji": "⚖️", "difficulty": "intermediate", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Creatividad e Innovación", "description": "Desbloquea tu creatividad. Técnicas de pensamiento lateral y resolución creativa de problemas.", "category": "thinking", "emoji": "💡", "difficulty": "beginner", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Resolución de Problemas", "description": "Metodologías para descomponer problemas complejos y encontrar soluciones efectivas.", "category": "thinking", "emoji": "🧩", "difficulty": "intermediate", "estimated_minutes": 30, "lesson_count": 5},

    # Productivity
    {"title": "Gestión del Tiempo", "description": "Organiza tu día, prioriza lo importante y deja de sentir que el tiempo no te alcanza.", "category": "productivity", "emoji": "⏰", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5, "is_featured": True},
    {"title": "Productividad Personal", "description": "Sistemas probados (GTD, Pomodoro, Eisenhower) para hacer más con menos esfuerzo.", "category": "productivity", "emoji": "🚀", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Establecimiento de Metas", "description": "Define metas claras con OKRs personales y crea planes de acción que realmente cumplas.", "category": "productivity", "emoji": "🎯", "difficulty": "beginner", "estimated_minutes": 20, "lesson_count": 4},

    # Ethics & Social
    {"title": "Ética Profesional", "description": "Dilemas éticos reales del mundo profesional. Desarrolla tu brújula moral para decisiones difíciles.", "category": "ethics", "emoji": "⚖️", "difficulty": "intermediate", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Responsabilidad Social", "description": "Tu rol como profesional en la sociedad. Sostenibilidad, impacto social y ciudadanía activa.", "category": "ethics", "emoji": "🌱", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},

    # Career & Interpersonal
    {"title": "Marca Personal", "description": "Construye una presencia profesional auténtica que refleje quién eres y a dónde vas.", "category": "career", "emoji": "⭐", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Networking Profesional", "description": "Construye relaciones profesionales genuinas. No se trata de coleccionar contactos, sino de crear valor mutuo.", "category": "career", "emoji": "🔗", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Negociación y Manejo de Conflictos", "description": "Técnicas de negociación ganar-ganar y resolución constructiva de conflictos.", "category": "career", "emoji": "🤝", "difficulty": "intermediate", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Administración Financiera Personal", "description": "Presupuesto, ahorro, inversión y deudas. Lo que la universidad no te enseña sobre dinero.", "category": "career", "emoji": "💰", "difficulty": "beginner", "estimated_minutes": 35, "lesson_count": 6, "is_featured": True},
    {"title": "Adaptabilidad al Cambio", "description": "En un mundo que cambia cada vez más rápido, la adaptabilidad es tu superpoder.", "category": "career", "emoji": "🦎", "difficulty": "beginner", "estimated_minutes": 25, "lesson_count": 5},
    {"title": "Aprender a Aprender", "description": "Metacognición, técnicas de estudio avanzadas y cómo adquirir cualquier habilidad más rápido.", "category": "career", "emoji": "📖", "difficulty": "beginner", "estimated_minutes": 30, "lesson_count": 5},
    {"title": "Elocuencia y Oratoria", "description": "Habla con poder y claridad. Desde reuniones pequeñas hasta auditorios llenos.", "category": "communication", "emoji": "🎙️", "difficulty": "intermediate", "estimated_minutes": 35, "lesson_count": 6},
    {"title": "El Mundo Actual: Perspectiva Histórica", "description": "Entiende el presente comparándolo con el pasado. Patrones, lecciones y contexto para ciudadanos informados.", "category": "ethics", "emoji": "🌐", "difficulty": "intermediate", "estimated_minutes": 35, "lesson_count": 6},
]

CATEGORIES = {
    "communication": "Comunicación",
    "leadership": "Liderazgo",
    "emotional": "Inteligencia Emocional",
    "thinking": "Pensamiento y Decisiones",
    "productivity": "Productividad",
    "ethics": "Ética y Sociedad",
    "career": "Carrera y Desarrollo",
}


def _seed_courses(db: Session):
    """Seed course catalog if empty."""
    existing = db.query(Course).count()
    if existing > 0:
        return
    for i, c in enumerate(COURSE_CATALOG):
        course = Course(
            id=gen_id(), title=c["title"], description=c["description"],
            category=c["category"], emoji=c.get("emoji", "📚"),
            difficulty=c.get("difficulty", "beginner"),
            estimated_minutes=c.get("estimated_minutes", 30),
            lesson_count=c.get("lesson_count", 5),
            is_featured=c.get("is_featured", False),
            order_index=i,
        )
        db.add(course)
    db.commit()


# ─── Endpoints ──────────────────────────────────────────────

@router.get("")
def list_courses(category: str = "", page: int = 1,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _seed_courses(db)
    _seed_static_content(db)
    q = db.query(Course)
    if category:
        q = q.filter(Course.category == category)
    courses = q.order_by(Course.order_index).all()

    # Get user progress
    progress = {p.course_id: p for p in db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user.id
    ).all()}

    return {
        "categories": CATEGORIES,
        "courses": [{
            "id": c.id, "title": c.title, "description": c.description,
            "category": c.category, "emoji": c.emoji,
            "difficulty": c.difficulty, "estimatedMinutes": c.estimated_minutes,
            "lessonCount": c.lesson_count, "isFeatured": c.is_featured,
            "progress": {
                "started": c.id in progress,
                "completed": progress[c.id].completed if c.id in progress else False,
                "completedLessons": len(json.loads(progress[c.id].completed_lessons or "[]")) if c.id in progress else 0,
                "quizPassed": progress[c.id].quiz_passed if c.id in progress else False,
                "certificateId": progress[c.id].certificate_id if c.id in progress else None,
            },
        } for c in courses],
    }


@router.get("/{course_id}")
def get_course(course_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    lessons = db.query(CourseLesson).filter(
        CourseLesson.course_id == course_id
    ).order_by(CourseLesson.order_index).all()

    quiz = db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).first()

    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user.id, UserCourseProgress.course_id == course_id
    ).first()

    completed_ids = json.loads(progress.completed_lessons or "[]") if progress else []

    return {
        "id": course.id, "title": course.title, "description": course.description,
        "category": course.category, "emoji": course.emoji,
        "difficulty": course.difficulty, "estimatedMinutes": course.estimated_minutes,
        "lessons": [{
            "id": l.id, "title": l.title, "content": l.content,
            "orderIndex": l.order_index, "estimatedMinutes": l.estimated_minutes,
            "completed": l.id in completed_ids,
        } for l in lessons],
        "quiz": {
            "id": quiz.id,
            "questions": json.loads(quiz.questions or "[]"),
        } if quiz else None,
        "progress": {
            "started": progress is not None,
            "completed": progress.completed if progress else False,
            "completedLessons": completed_ids,
            "quizScore": progress.quiz_score if progress else None,
            "quizPassed": progress.quiz_passed if progress else False,
            "certificateId": progress.certificate_id if progress else None,
        },
        "needsGeneration": len(lessons) == 0,
    }


# ─── Admin: Manual Course Management (no AI needed) ───────

class ManualLessonInput(BaseModel):
    title: str
    content: str  # HTML content
    estimatedMinutes: int = 5

class ManualQuizQuestion(BaseModel):
    question: str
    options: list[str]
    correctAnswer: int
    explanation: str = ""

class ManualCourseInput(BaseModel):
    title: str
    description: str
    category: str = "career"
    emoji: str = "📚"
    difficulty: str = "beginner"
    estimatedMinutes: int = 30
    isFeatured: bool = False
    lessons: list[ManualLessonInput]
    quiz: list[ManualQuizQuestion] = []

@router.post("/admin/create")
def admin_create_course(data: ManualCourseInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a course with manual content (no AI). Admin only."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores pueden crear cursos")

    course = Course(
        id=gen_id(), title=data.title, description=data.description,
        category=data.category, emoji=data.emoji, difficulty=data.difficulty,
        estimated_minutes=data.estimatedMinutes, lesson_count=len(data.lessons),
        is_featured=data.isFeatured, order_index=99,
    )
    db.add(course)
    db.flush()

    for i, lesson in enumerate(data.lessons):
        db.add(CourseLesson(
            id=gen_id(), course_id=course.id,
            title=lesson.title, content=lesson.content,
            order_index=i, estimated_minutes=lesson.estimatedMinutes,
        ))

    if data.quiz:
        db.add(CourseQuiz(
            id=gen_id(), course_id=course.id,
            questions=json.dumps([q.dict() for q in data.quiz]),
        ))

    db.commit()
    return {"status": "created", "courseId": course.id, "lessonCount": len(data.lessons), "quizQuestions": len(data.quiz)}


class UpdateCourseInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    emoji: Optional[str] = None
    difficulty: Optional[str] = None
    estimatedMinutes: Optional[int] = None
    isFeatured: Optional[bool] = None
    lessons: Optional[list[ManualLessonInput]] = None
    quiz: Optional[list[ManualQuizQuestion]] = None

@router.put("/admin/{course_id}")
def admin_update_course(course_id: str, data: UpdateCourseInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a course with manual content. Admin only."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores pueden editar cursos")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    if data.title: course.title = data.title
    if data.description: course.description = data.description
    if data.category: course.category = data.category
    if data.emoji: course.emoji = data.emoji
    if data.difficulty: course.difficulty = data.difficulty
    if data.estimatedMinutes: course.estimated_minutes = data.estimatedMinutes
    if data.isFeatured is not None: course.is_featured = data.isFeatured

    if data.lessons is not None:
        # Replace all lessons
        db.query(CourseLesson).filter(CourseLesson.course_id == course_id).delete()
        for i, lesson in enumerate(data.lessons):
            db.add(CourseLesson(
                id=gen_id(), course_id=course_id,
                title=lesson.title, content=lesson.content,
                order_index=i, estimated_minutes=lesson.estimatedMinutes,
            ))
        course.lesson_count = len(data.lessons)

    if data.quiz is not None:
        db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).delete()
        if data.quiz:
            db.add(CourseQuiz(
                id=gen_id(), course_id=course_id,
                questions=json.dumps([q.dict() for q in data.quiz]),
            ))

    db.commit()
    return {"status": "updated", "courseId": course_id}


@router.delete("/admin/{course_id}")
def admin_delete_course(course_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a course. Admin only."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores pueden eliminar cursos")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    db.query(CourseLesson).filter(CourseLesson.course_id == course_id).delete()
    db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).delete()
    db.query(UserCourseProgress).filter(UserCourseProgress.course_id == course_id).delete()
    db.delete(course)
    db.commit()
    return {"status": "deleted"}


# ─── Seed Static Content for Catalog Courses ──────────────

# Import all static course content from batch files
from static_courses_1 import COURSES_BATCH_1
from static_courses_2 import COURSES_BATCH_2
from static_courses_3 import COURSES_BATCH_3
from static_courses_4 import COURSES_BATCH_4

STATIC_COURSE_CONTENT = {
    "Gestión del Tiempo": {
        "lessons": [
            {"title": "El mito de la gestión del tiempo", "content": """<h3>No gestionas el tiempo — gestionas tu atención</h3>
<p>Todos tenemos exactamente 24 horas al día. No puedes "crear" más tiempo. Lo que sí puedes hacer es decidir <strong>cómo usas tu atención</strong> durante esas horas.</p>
<p>La mayoría de las personas piensan que su problema es falta de tiempo, pero en realidad es falta de <em>priorización</em>. ¿Cuántas horas al día pasas revisando redes sociales, respondiendo mensajes no urgentes, o procrastinando?</p>
<h4>El ejercicio de las 168 horas</h4>
<p>Una semana tiene 168 horas. Haz este ejercicio:</p>
<ul>
<li><strong>Sueño:</strong> 7h × 7 = 49 horas</li>
<li><strong>Clases/trabajo:</strong> ~40 horas</li>
<li><strong>Comidas/higiene:</strong> ~14 horas</li>
<li><strong>Transporte:</strong> ~7 horas</li>
<li><strong>Total comprometido:</strong> ~110 horas</li>
<li><strong>Horas disponibles:</strong> 58 horas a la semana</li>
</ul>
<p>¡Tienes <strong>58 horas libres</strong> cada semana! El problema no es la cantidad — es cómo las inviertes.</p>
<blockquote>"No es que tengamos poco tiempo, sino que perdemos mucho." — Séneca</blockquote>
<h4>Principio fundamental</h4>
<p>La gestión del tiempo real comienza con una pregunta honesta: <strong>¿Mis acciones de hoy me acercan a donde quiero estar mañana?</strong></p>""", "estimatedMinutes": 5},
            {"title": "La Matriz de Eisenhower", "content": """<h3>Urgente vs. Importante: La diferencia que lo cambia todo</h3>
<p>Dwight Eisenhower, presidente de EE.UU. y general de 5 estrellas, decía: <em>"Lo que es importante rara vez es urgente, y lo que es urgente rara vez es importante."</em></p>
<p>La Matriz de Eisenhower divide tus tareas en 4 cuadrantes:</p>
<h4>Cuadrante 1: Urgente + Importante (HACER AHORA)</h4>
<ul><li>Crisis reales, entregas con deadline hoy, emergencias</li>
<li>Ejemplo: Examen mañana que no has estudiado</li></ul>
<h4>Cuadrante 2: No Urgente + Importante (PLANIFICAR)</h4>
<ul><li>Proyectos a largo plazo, relaciones, salud, aprendizaje</li>
<li>Ejemplo: Estudiar un poco cada día para el examen de la próxima semana</li>
<li><strong>Este es el cuadrante más importante.</strong> Vivir aquí reduce las crisis del Cuadrante 1.</li></ul>
<h4>Cuadrante 3: Urgente + No Importante (DELEGAR)</h4>
<ul><li>Interrupciones, mensajes no esenciales, reuniones innecesarias</li>
<li>Ejemplo: Un compañero te pide ayuda con algo que puede googlear</li></ul>
<h4>Cuadrante 4: No Urgente + No Importante (ELIMINAR)</h4>
<ul><li>Scrollear redes sin propósito, series por aburrimiento</li>
<li>Ejemplo: 2 horas en TikTok cuando tienes un proyecto pendiente</li></ul>
<h4>Ejercicio práctico</h4>
<p>Esta noche, escribe tus 10 tareas pendientes. Clasifícalas en los 4 cuadrantes. ¿Cuántas están en el cuadrante correcto?</p>""", "estimatedMinutes": 6},
            {"title": "La técnica Pomodoro y time-blocking", "content": """<h3>Trabaja CON tu cerebro, no contra él</h3>
<p>Tu cerebro no está diseñado para concentrarse durante horas sin parar. La ciencia muestra que la atención sostenida tiene un límite natural de <strong>25-50 minutos</strong>.</p>
<h4>La Técnica Pomodoro</h4>
<ol>
<li><strong>Elige una tarea</strong> específica</li>
<li><strong>Pon un timer de 25 minutos</strong> (un "pomodoro")</li>
<li><strong>Trabaja sin interrupciones</strong> — nada de celular, redes, chat</li>
<li><strong>Descansa 5 minutos</strong> cuando suene el timer</li>
<li><strong>Cada 4 pomodoros,</strong> descansa 15-30 minutos</li>
</ol>
<p>¿Por qué funciona? Porque convierte el trabajo en algo <em>medible</em> y <em>finito</em>. No estás "estudiando toda la tarde" — estás haciendo 4 pomodoros.</p>
<h4>Time-blocking: el paso siguiente</h4>
<p>Time-blocking es reservar bloques específicos en tu calendario para tareas específicas:</p>
<ul>
<li>8:00 - 10:00 → Estudio de cálculo (4 pomodoros)</li>
<li>10:30 - 12:00 → Proyecto de programación (3 pomodoros)</li>
<li>14:00 - 15:00 → Responder emails y mensajes</li>
</ul>
<p><strong>Regla de oro:</strong> Si no está en tu calendario, no existe. Lo que no programas, no sucede.</p>
<blockquote>Tip: Usa la app de Salas de Estudio de Conniku para hacer Pomodoros con compañeros. La accountability social multiplica tu productividad.</blockquote>""", "estimatedMinutes": 6},
            {"title": "Cómo vencer la procrastinación", "content": """<h3>La procrastinación no es pereza — es una respuesta emocional</h3>
<p>Investigaciones recientes muestran que procrastinar <strong>no es un problema de gestión del tiempo</strong>. Es un problema de <strong>gestión emocional</strong>. Postergamos tareas que nos causan ansiedad, aburrimiento o miedo al fracaso.</p>
<h4>La regla de los 2 minutos</h4>
<p>Si una tarea toma menos de 2 minutos, <strong>hazla ahora</strong>. No la agregues a una lista, no la postergues. Simplemente hazla. Responder ese email, lavar ese plato, enviar ese mensaje — 2 minutos.</p>
<h4>La regla de los 5 minutos</h4>
<p>Para tareas grandes que te intimidan: comprométete a trabajar <strong>solo 5 minutos</strong>. Pon un timer. Cuando suene, puedes parar sin culpa.</p>
<p>¿El secreto? El 80% de las veces, una vez que empiezas, sigues. El inicio es la parte más difícil.</p>
<h4>Reduce la fricción</h4>
<ul>
<li><strong>Antes:</strong> "Tengo que estudiar" (vago, intimidante)</li>
<li><strong>Después:</strong> "Voy a leer la página 42 del libro de biología" (específico, alcanzable)</li>
</ul>
<p>Haz que empezar sea <em>ridículamente fácil</em>:</p>
<ul>
<li>Deja el libro abierto en tu escritorio</li>
<li>Abre el documento antes de ir a dormir</li>
<li>Prepara tu espacio de estudio la noche anterior</li>
</ul>
<h4>El sistema anti-procrastinación</h4>
<ol>
<li>Identifica la emoción: ¿Qué sientes al pensar en esta tarea?</li>
<li>Hazla específica: ¿Cuál es el siguiente paso concreto?</li>
<li>Aplica la regla de 5 minutos</li>
<li>Recompénsate después</li>
</ol>""", "estimatedMinutes": 6},
            {"title": "Tu sistema personal de productividad", "content": """<h3>Construye un sistema que funcione para TI</h3>
<p>No existe un sistema de productividad perfecto universal. Lo que funciona para un CEO no necesariamente funciona para un estudiante universitario. Pero hay principios que puedes adaptar.</p>
<h4>El sistema mínimo viable</h4>
<p>Tu sistema de productividad necesita solo 3 componentes:</p>
<ol>
<li><strong>Una bandeja de entrada:</strong> Un lugar donde capturas TODO lo que llega (ideas, tareas, recordatorios). Puede ser una app, un cuaderno, las notas del celular.</li>
<li><strong>Un calendario:</strong> Donde pones las cosas con fecha y hora fija. Lo que va aquí es sagrado — son compromisos contigo mismo.</li>
<li><strong>Una lista de prioridades diaria:</strong> Cada noche, escribe las 3 cosas más importantes para mañana. Solo 3.</li>
</ol>
<h4>La regla del MIT (Most Important Task)</h4>
<p>Cada día tiene UN MIT — la tarea que, si la completas, hace que el día valga la pena aunque no hagas nada más.</p>
<ul>
<li>Haz tu MIT <strong>temprano en el día</strong>, antes de que las urgencias te absorban</li>
<li>Protege ese tiempo como si fuera una cita con el doctor</li>
</ul>
<h4>Revisión semanal (15 minutos cada domingo)</h4>
<ul>
<li>¿Qué funcionó esta semana?</li>
<li>¿Qué no funcionó?</li>
<li>¿Cuáles son mis 3 prioridades para la próxima semana?</li>
</ul>
<h4>Herramientas recomendadas</h4>
<p>Usa lo que ya tienes. Un sistema simple que uses es infinitamente mejor que un sistema perfecto que abandones en 3 días.</p>
<blockquote>Recuerda: La productividad no se trata de hacer más cosas. Se trata de hacer las cosas <strong>correctas</strong>.</blockquote>""", "estimatedMinutes": 5},
        ],
        "quiz": [
            {"question": "¿Cuál es el cuadrante más importante de la Matriz de Eisenhower?", "options": ["Urgente + Importante", "No Urgente + Importante", "Urgente + No Importante", "No Urgente + No Importante"], "correctAnswer": 1, "explanation": "El cuadrante 2 (No Urgente + Importante) es el más importante porque previene crisis futuras."},
            {"question": "¿Cuánto dura un 'pomodoro' estándar?", "options": ["15 minutos", "25 minutos", "45 minutos", "60 minutos"], "correctAnswer": 1, "explanation": "Un pomodoro dura 25 minutos de trabajo enfocado, seguido de 5 minutos de descanso."},
            {"question": "Según la lección, ¿qué es realmente la procrastinación?", "options": ["Un problema de pereza", "Un problema de gestión del tiempo", "Un problema de gestión emocional", "Un problema de inteligencia"], "correctAnswer": 2, "explanation": "La procrastinación es una respuesta emocional, no un problema de pereza o tiempo."},
            {"question": "¿Qué dice la regla de los 2 minutos?", "options": ["Estudia 2 minutos al día", "Si una tarea toma menos de 2 minutos, hazla ahora", "Descansa 2 minutos entre tareas", "Planifica solo 2 minutos por la mañana"], "correctAnswer": 1, "explanation": "La regla dice que las tareas de menos de 2 minutos se deben hacer inmediatamente."},
            {"question": "¿Cuántas prioridades diarias recomienda el sistema mínimo viable?", "options": ["1", "3", "5", "10"], "correctAnswer": 1, "explanation": "Se recomienda elegir solo 3 prioridades diarias para mantener el enfoque."},
            {"question": "¿Cuántas horas libres tienes aproximadamente por semana según el ejercicio de las 168 horas?", "options": ["20 horas", "35 horas", "58 horas", "80 horas"], "correctAnswer": 2, "explanation": "Restando sueño, clases, comidas y transporte, quedan aproximadamente 58 horas libres semanales."},
            {"question": "¿Qué tipo de tareas pertenecen al Cuadrante 4 de Eisenhower?", "options": ["Crisis y emergencias", "Proyectos a largo plazo", "Interrupciones no esenciales", "Actividades sin urgencia ni importancia"], "correctAnswer": 3, "explanation": "El Cuadrante 4 incluye actividades ni urgentes ni importantes, como scrollear redes sin propósito."},
            {"question": "¿Cada cuántos pomodoros se recomienda tomar un descanso largo?", "options": ["Cada 2", "Cada 3", "Cada 4", "Cada 6"], "correctAnswer": 2, "explanation": "Cada 4 pomodoros se toma un descanso largo de 15-30 minutos."},
            {"question": "¿Qué es el 'time-blocking'?", "options": ["Bloquear distracciones en el celular", "Reservar bloques de tiempo en el calendario para tareas específicas", "Trabajar sin parar durante un bloque de 4 horas", "Eliminar todas las reuniones del calendario"], "correctAnswer": 1, "explanation": "Time-blocking consiste en reservar bloques específicos en tu calendario para tareas específicas."},
            {"question": "¿Qué porcentaje de las veces continúas trabajando después de aplicar la regla de los 5 minutos?", "options": ["50%", "60%", "80%", "95%"], "correctAnswer": 2, "explanation": "El 80% de las veces, una vez que empiezas, sigues trabajando. El inicio es lo más difícil."},
            {"question": "¿Cuál es el MIT (Most Important Task)?", "options": ["La tarea más fácil del día", "La tarea que más tiempo toma", "La tarea que si la completas, hace que el día valga la pena", "La primera tarea de tu lista"], "correctAnswer": 2, "explanation": "El MIT es la tarea más importante que, si la completas, hace que el día haya valido la pena."},
            {"question": "¿Cuándo se recomienda hacer la revisión semanal?", "options": ["Lunes por la mañana", "Miércoles al mediodía", "Viernes por la tarde", "Domingo (15 minutos)"], "correctAnswer": 3, "explanation": "Se recomienda dedicar 15 minutos cada domingo a revisar qué funcionó, qué no, y planificar la semana."},
            {"question": "Según la lección, ¿cuál es la regla de oro del time-blocking?", "options": ["Nunca cambies tu calendario", "Si no está en tu calendario, no existe", "Bloquea solo las mañanas", "Solo agenda reuniones importantes"], "correctAnswer": 1, "explanation": "La regla de oro es: si no está en tu calendario, no existe. Lo que no programas, no sucede."},
            {"question": "¿Cuál es el primer paso del sistema anti-procrastinación?", "options": ["Poner un timer", "Hacer la tarea inmediatamente", "Identificar la emoción que sientes", "Buscar motivación externa"], "correctAnswer": 2, "explanation": "El primer paso es identificar la emoción que sientes al pensar en la tarea."},
            {"question": "¿Cuántos componentes tiene el sistema mínimo viable de productividad?", "options": ["2", "3", "4", "5"], "correctAnswer": 1, "explanation": "El sistema mínimo viable tiene 3 componentes: bandeja de entrada, calendario y lista de prioridades diaria."},
        ],
    },
}

# Merge all batch content into the main dictionary
STATIC_COURSE_CONTENT.update(COURSES_BATCH_1)
STATIC_COURSE_CONTENT.update(COURSES_BATCH_2)
STATIC_COURSE_CONTENT.update(COURSES_BATCH_3)
STATIC_COURSE_CONTENT.update(COURSES_BATCH_4)


def _seed_static_content(db: Session):
    """Seed static lesson content for catalog courses that don't have lessons yet."""
    for course_title, content in STATIC_COURSE_CONTENT.items():
        course = db.query(Course).filter(Course.title == course_title).first()
        if not course:
            continue
        existing_lessons = db.query(CourseLesson).filter(CourseLesson.course_id == course.id).count()
        if existing_lessons > 0:
            continue

        for i, lesson in enumerate(content["lessons"]):
            db.add(CourseLesson(
                id=gen_id(), course_id=course.id,
                title=lesson["title"], content=lesson["content"],
                order_index=i, estimated_minutes=lesson.get("estimatedMinutes", 5),
            ))

        if content.get("quiz"):
            db.add(CourseQuiz(
                id=gen_id(), course_id=course.id,
                questions=json.dumps(content["quiz"]),
            ))

    db.commit()


@router.post("/{course_id}/generate")
def generate_course_content(course_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate course lessons and quiz using AI. Falls back to static content if AI fails."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    existing_lessons = db.query(CourseLesson).filter(CourseLesson.course_id == course_id).count()
    if existing_lessons > 0:
        return {"status": "already_generated"}

    # Check if we have static content for this course
    if course.title in STATIC_COURSE_CONTENT:
        content = STATIC_COURSE_CONTENT[course.title]
        for i, lesson in enumerate(content["lessons"]):
            db.add(CourseLesson(
                id=gen_id(), course_id=course_id,
                title=lesson["title"], content=lesson["content"],
                order_index=i, estimated_minutes=lesson.get("estimatedMinutes", 5),
            ))
        if content.get("quiz"):
            db.add(CourseQuiz(
                id=gen_id(), course_id=course_id,
                questions=json.dumps(content["quiz"]),
            ))
        db.commit()
        return {"status": "generated", "source": "static", "lessonCount": len(content["lessons"])}

    # Try AI generation
    try:
        from ai_engine import AIEngine
        ai = AIEngine()
    except Exception:
        raise HTTPException(503, "El contenido de este curso aún no está disponible. Estamos trabajando en agregarlo.")

    lang = user.language or "es"

    system = f"""Eres un experto en desarrollo personal y profesional. Genera contenido educativo de alta calidad.
Responde SOLO con JSON válido. El contenido debe ser:
- Práctico y aplicable inmediatamente
- Con ejemplos reales y situaciones cotidianas
- Motivador pero honesto, sin clichés vacíos
- Escrito en tono cercano, como un mentor experimentado
- En {'español' if lang == 'es' else 'inglés' if lang == 'en' else lang}"""

    prompt = f"""Genera {course.lesson_count} lecciones para el curso "{course.title}".
Descripción: {course.description}

Formato JSON:
{{
  "lessons": [
    {{
      "title": "Título de la lección",
      "content": "<h3>Título</h3><p>Contenido HTML bien formateado con párrafos, listas, ejemplos prácticos, tips y reflexiones. Cada lección debe ser completa y valiosa por sí sola. Usa <strong>, <em>, <ul>, <li>, <blockquote> para dar formato. Mínimo 400 palabras por lección.</p>",
      "estimatedMinutes": 5
    }}
  ],
  "quiz": [
    {{
      "question": "Pregunta sobre el contenido",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": 0,
      "explanation": "Por qué esta es la respuesta correcta"
    }}
  ]
}}

Genera exactamente {course.lesson_count} lecciones y {min(course.lesson_count, 5)} preguntas de quiz."""

    try:
        result_text = ai._call_gemini(system, prompt)
        # Parse JSON
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        if start >= 0 and end > start:
            result = json.loads(result_text[start:end])
        else:
            result = json.loads(result_text)

        # Create lessons
        for i, lesson_data in enumerate(result.get("lessons", [])):
            lesson = CourseLesson(
                id=gen_id(), course_id=course_id,
                title=lesson_data["title"],
                content=lesson_data.get("content", ""),
                order_index=i,
                estimated_minutes=lesson_data.get("estimatedMinutes", 5),
            )
            db.add(lesson)

        # Create quiz
        quiz_questions = result.get("quiz", [])
        if quiz_questions:
            quiz = CourseQuiz(
                id=gen_id(), course_id=course_id,
                questions=json.dumps(quiz_questions),
            )
            db.add(quiz)

        db.commit()
        return {"status": "generated", "lessonCount": len(result.get("lessons", [])), "quizQuestions": len(quiz_questions)}
    except Exception as e:
        print(f"AI generation error for course {course_id}: {e}")
        raise HTTPException(503, "El contenido de este curso aún no está disponible. Estamos trabajando en agregarlo pronto.")


@router.post("/{course_id}/lessons/{lesson_id}/complete")
def complete_lesson(course_id: str, lesson_id: str,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user.id, UserCourseProgress.course_id == course_id
    ).first()
    if not progress:
        progress = UserCourseProgress(id=gen_id(), user_id=user.id, course_id=course_id)
        db.add(progress)

    completed = json.loads(progress.completed_lessons or "[]")
    if lesson_id not in completed:
        completed.append(lesson_id)
        progress.completed_lessons = json.dumps(completed)

    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()
    return {"completedLessons": completed}


@router.get("/{course_id}/quiz/questions")
def get_quiz_questions(course_id: str,
                       user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Return a freshly shuffled subset of quiz questions for this attempt.
    Strips correctAnswer so it is never exposed to the client.
    Each question carries a `qid` (pool index) used for server-side grading.
    """
    quiz = db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado para este curso")

    pool = json.loads(quiz.questions or "[]")
    if not pool:
        raise HTTPException(404, "Este curso aún no tiene preguntas de examen")

    # Tag each question with its stable pool index before shuffling
    indexed = [{"qid": i, **q} for i, q in enumerate(pool)]

    # Shuffle and pick up to 10 questions (or all if fewer)
    n = min(10, len(indexed))
    selected = random.sample(indexed, n)

    # Strip correctAnswer — never send answers to the client
    safe = [{k: v for k, v in q.items() if k != "correctAnswer"} for q in selected]

    return {"questions": safe, "total": n}


@router.post("/{course_id}/quiz/submit")
def submit_quiz(course_id: str, data: dict,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Accepts {qid: selectedOption} — qid is the pool index from /quiz/questions
    answers = data.get("answers", {})

    quiz = db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")

    pool = json.loads(quiz.questions or "[]")

    correct = 0
    total = len(answers)
    for qid_str, selected in answers.items():
        try:
            qid = int(qid_str)
            if 0 <= qid < len(pool) and selected == pool[qid].get("correctAnswer"):
                correct += 1
        except (ValueError, TypeError):
            pass

    score = round((correct / max(total, 1)) * 100) if total > 0 else 0
    passed = score >= 80

    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user.id, UserCourseProgress.course_id == course_id
    ).first()
    if not progress:
        progress = UserCourseProgress(id=gen_id(), user_id=user.id, course_id=course_id)
        db.add(progress)

    progress.quiz_score = score
    progress.quiz_passed = passed

    rewards_granted = []
    course_reward_progress = None

    if passed:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        progress.certificate_id = gen_id()

        from gamification import award_xp
        award_xp(user, 30, db)

        # Auto-generate certificate with PDF, email, and CV entry
        try:
            from certificate_routes import generate_certificate_for_user
            course_obj = db.query(Course).filter(Course.id == course_id).first()
            if course_obj:
                estimated_hours = max(1, (course_obj.estimated_minutes or 30) // 60) or 1
                generate_certificate_for_user(
                    user, course_id, course_obj.title,
                    course_obj.category or "default",
                    estimated_hours, float(score), db
                )
        except Exception as e:
            print(f"[Cert] Auto-generation on quiz pass error: {e}")

        # Auto-milestone post on wall
        try:
            from social_routes import create_milestone_post
            course_obj = course_obj if 'course_obj' in dir() else db.query(Course).filter(Course.id == course_id).first()
            course_title = course_obj.title if course_obj else "un curso"
            create_milestone_post(
                db, str(user.id), "course_completed",
                f"¡Completé el curso \"{course_title}\" con {score:.0f}% de nota! 🎓",
                visibility="public"
            )
        except Exception as e:
            print(f"[Milestone] Course post error: {e}")

        # Course-completion rewards use a 12-month rolling window
        from rewards_routes import (grant_reward, REWARD_RULES,
                                    get_course_reward_window, COURSE_REWARD_CYCLE_DAYS)

        courses_in_window, days_left, _ = get_course_reward_window(user.id, db)

        # 3 courses in window → 1 month PRO
        if courses_in_window >= 3:
            if grant_reward(user, "courses_3", "pro", 30, db, cooldown_days=COURSE_REWARD_CYCLE_DAYS):
                rule = next((r for r in REWARD_RULES if r["id"] == "courses_3"), {})
                rewards_granted.append({
                    "id": "courses_3", "title": rule.get("title", ""),
                    "description": rule.get("description", ""), "tier": "pro", "days": 30,
                })

        # 6 courses in window → 1 month MAX
        if courses_in_window >= 6:
            if grant_reward(user, "courses_6", "max", 30, db, cooldown_days=COURSE_REWARD_CYCLE_DAYS):
                rule = next((r for r in REWARD_RULES if r["id"] == "courses_6"), {})
                rewards_granted.append({
                    "id": "courses_6", "title": rule.get("title", ""),
                    "description": rule.get("description", ""), "tier": "max", "days": 30,
                })

        # Perfect quiz reward
        if score == 100:
            if grant_reward(user, "perfect_quiz", "pro", 30, db):
                rule = next((r for r in REWARD_RULES if r["id"] == "perfect_quiz"), {})
                rewards_granted.append({
                    "id": "perfect_quiz", "title": rule.get("title", ""),
                    "description": rule.get("description", ""), "tier": "pro", "days": 30,
                })

        # Build progress message for the user
        # Tell them how many more courses they need and how much time is left
        if courses_in_window < 3:
            remaining = 3 - courses_in_window
            course_reward_progress = {
                "coursesInWindow": courses_in_window,
                "daysLeft": days_left,
                "nextTarget": 3,
                "coursesNeeded": remaining,
                "nextTier": "PRO",
                "message": f"¡Te {'falta' if remaining == 1 else 'faltan'} {remaining} curso{'s' if remaining != 1 else ''} más para ganar 1 mes PRO gratis! Tienes {days_left} días restantes.",
            }
        elif courses_in_window < 6:
            remaining = 6 - courses_in_window
            course_reward_progress = {
                "coursesInWindow": courses_in_window,
                "daysLeft": days_left,
                "nextTarget": 6,
                "coursesNeeded": remaining,
                "nextTier": "MAX",
                "message": f"¡Ya ganaste tu mes PRO! Te {'falta' if remaining == 1 else 'faltan'} {remaining} curso{'s' if remaining != 1 else ''} más para ganar 1 mes MAX gratis. Tienes {days_left} días restantes.",
            }
        else:
            course_reward_progress = {
                "coursesInWindow": courses_in_window,
                "daysLeft": days_left,
                "nextTarget": None,
                "coursesNeeded": 0,
                "nextTier": None,
                "message": "¡Felicidades! Has completado todos los hitos de cursos en este ciclo. 🎉",
            }

    db.commit()

    course = db.query(Course).filter(Course.id == course_id).first()
    return {
        "score": score, "passed": passed, "correct": correct, "total": len(pool),
        "certificateId": progress.certificate_id if passed else None,
        "courseTitle": course.title if course else "",
        "rewardsGranted": rewards_granted,
        "courseRewardProgress": course_reward_progress,
    }


# ─── Dynamic Exercises (never repeat) ─────────────────────

def _hash_question(text: str) -> str:
    """SHA256 hash of question text for deduplication."""
    import hashlib
    return hashlib.sha256(text.strip().lower().encode()).hexdigest()


class ExerciseRequest(BaseModel):
    count: int = 5


@router.post("/{course_id}/exercises")
def get_exercises(course_id: str, data: ExerciseRequest = ExerciseRequest(),
                  user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get exercises that NEVER repeat for this user. Generates new ones if all have been seen."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    # Check user has completed at least 1 lesson
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user.id, UserCourseProgress.course_id == course_id
    ).first()
    completed_lessons = json.loads(progress.completed_lessons or "[]") if progress else []
    if len(completed_lessons) == 0:
        raise HTTPException(400, "Debes completar al menos una leccion antes de practicar ejercicios.")

    # Get all existing quiz questions for this course
    quiz = db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).first()
    all_questions = json.loads(quiz.questions or "[]") if quiz else []

    # Get hashes of questions this user has already answered
    seen_hashes = {row.question_hash for row in db.query(UserExerciseHistory.question_hash).filter(
        UserExerciseHistory.user_id == user.id,
        UserExerciseHistory.course_id == course_id,
    ).all()}

    # Filter unseen questions
    unseen = [q for q in all_questions if _hash_question(q["question"]) not in seen_hashes]

    count = min(data.count, 10)  # Cap at 10

    if len(unseen) >= count:
        # Enough unseen static questions - return random selection
        import random
        selected = random.sample(unseen, count)
        # Compute exercise stats
        total_answered = db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user.id,
            UserExerciseHistory.course_id == course_id,
        ).count()
        total_correct = db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user.id,
            UserExerciseHistory.course_id == course_id,
            UserExerciseHistory.was_correct == True,
        ).count()
        return {
            "questions": selected,
            "source": "static",
            "stats": {
                "totalAnswered": total_answered,
                "totalCorrect": total_correct,
                "accuracy": round((total_correct / max(total_answered, 1)) * 100),
            },
        }

    # Not enough unseen questions - generate new ones
    # Gather lesson content for context
    lessons = db.query(CourseLesson).filter(
        CourseLesson.course_id == course_id
    ).order_by(CourseLesson.order_index).all()

    lesson_summaries = "\n".join([
        f"Leccion {i+1}: {l.title}\n{l.content[:600]}" for i, l in enumerate(lessons)
    ])

    # Build list of already-seen question texts to avoid
    seen_questions_text = "\n".join([
        f"- {q['question']}" for q in all_questions if _hash_question(q["question"]) in seen_hashes
    ][:50])  # Limit to avoid token overflow

    need = count - len(unseen)

    try:
        from ai_engine import AIEngine
        ai = AIEngine()
    except Exception:
        # If AI not available, return whatever unseen we have
        import random
        selected = unseen if unseen else random.sample(all_questions, min(count, len(all_questions)))
        total_answered = db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user.id,
            UserExerciseHistory.course_id == course_id,
        ).count()
        total_correct = db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user.id,
            UserExerciseHistory.course_id == course_id,
            UserExerciseHistory.was_correct == True,
        ).count()
        return {
            "questions": selected,
            "source": "fallback",
            "stats": {
                "totalAnswered": total_answered,
                "totalCorrect": total_correct,
                "accuracy": round((total_correct / max(total_answered, 1)) * 100),
            },
        }

    lang = user.language or "es"
    system = f"""Eres un experto en desarrollo personal y profesional. Genera preguntas de practica de alta calidad.
Responde SOLO con JSON valido. Las preguntas deben ser:
- Basadas en el contenido de las lecciones
- Diferentes a las preguntas ya existentes
- Practicas y que evaluen comprension, no solo memoria
- En {'espanol' if lang == 'es' else 'ingles' if lang == 'en' else lang}"""

    prompt = f"""Genera exactamente {need} preguntas de practica NUEVAS para el curso "{course.title}".
Descripcion: {course.description}

Contenido de las lecciones:
{lesson_summaries}

IMPORTANTE: Las siguientes preguntas YA EXISTEN. NO las repitas ni hagas preguntas similares:
{seen_questions_text}

Formato JSON (responde SOLO con el JSON):
{{
  "questions": [
    {{
      "question": "Pregunta sobre el contenido",
      "options": ["Opcion A", "Opcion B", "Opcion C", "Opcion D"],
      "correctAnswer": 0,
      "explanation": "Por que esta es la respuesta correcta"
    }}
  ]
}}"""

    try:
        result_text = ai._call_gemini(system, prompt)
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        if start >= 0 and end > start:
            result = json.loads(result_text[start:end])
        else:
            result = json.loads(result_text)

        new_questions = result.get("questions", [])

        # Append new questions to the course quiz (persist them)
        if new_questions and quiz:
            all_questions.extend(new_questions)
            quiz.questions = json.dumps(all_questions)
            db.commit()
        elif new_questions and not quiz:
            quiz = CourseQuiz(
                id=gen_id(), course_id=course_id,
                questions=json.dumps(new_questions),
            )
            db.add(quiz)
            db.commit()

        # Combine unseen static + newly generated
        import random
        selected = unseen + new_questions
        if len(selected) > count:
            selected = random.sample(selected, count)

    except Exception as e:
        print(f"Exercise generation error for course {course_id}: {e}")
        import random
        selected = unseen if unseen else random.sample(all_questions, min(count, len(all_questions)))

    total_answered = db.query(UserExerciseHistory).filter(
        UserExerciseHistory.user_id == user.id,
        UserExerciseHistory.course_id == course_id,
    ).count()
    total_correct = db.query(UserExerciseHistory).filter(
        UserExerciseHistory.user_id == user.id,
        UserExerciseHistory.course_id == course_id,
        UserExerciseHistory.was_correct == True,
    ).count()

    return {
        "questions": selected,
        "source": "generated",
        "stats": {
            "totalAnswered": total_answered,
            "totalCorrect": total_correct,
            "accuracy": round((total_correct / max(total_answered, 1)) * 100),
        },
    }


class ExerciseSubmitRequest(BaseModel):
    answers: dict  # {questionIndex: selectedOption}
    questions: list  # The questions array that was served


@router.post("/{course_id}/exercises/submit")
def submit_exercises(course_id: str, data: ExerciseSubmitRequest,
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit exercise answers. Records each question in history so it never repeats."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    questions = data.questions
    answers = data.answers
    correct = 0
    results = []

    for i, q in enumerate(questions):
        user_answer = answers.get(str(i))
        is_correct = user_answer == q.get("correctAnswer")
        if is_correct:
            correct += 1

        # Record in exercise history
        q_hash = _hash_question(q["question"])
        existing = db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user.id,
            UserExerciseHistory.course_id == course_id,
            UserExerciseHistory.question_hash == q_hash,
        ).first()
        if not existing:
            db.add(UserExerciseHistory(
                id=gen_id(),
                user_id=user.id,
                course_id=course_id,
                question_hash=q_hash,
                was_correct=is_correct,
            ))

        results.append({
            "question": q["question"],
            "userAnswer": user_answer,
            "correctAnswer": q.get("correctAnswer"),
            "isCorrect": is_correct,
            "explanation": q.get("explanation", ""),
        })

    # Award 10 XP for completing an exercise set
    from gamification import award_xp
    award_xp(user, 10, db)
    db.commit()

    score = round((correct / max(len(questions), 1)) * 100)

    # Updated stats
    total_answered = db.query(UserExerciseHistory).filter(
        UserExerciseHistory.user_id == user.id,
        UserExerciseHistory.course_id == course_id,
    ).count()
    total_correct_all = db.query(UserExerciseHistory).filter(
        UserExerciseHistory.user_id == user.id,
        UserExerciseHistory.course_id == course_id,
        UserExerciseHistory.was_correct == True,
    ).count()

    return {
        "score": score,
        "correct": correct,
        "total": len(questions),
        "results": results,
        "xpAwarded": 10,
        "stats": {
            "totalAnswered": total_answered,
            "totalCorrect": total_correct_all,
            "accuracy": round((total_correct_all / max(total_answered, 1)) * 100),
        },
    }


@router.get("/certificates/my")
def my_certificates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    completed = db.query(UserCourseProgress, Course).join(
        Course, Course.id == UserCourseProgress.course_id
    ).filter(
        UserCourseProgress.user_id == user.id,
        UserCourseProgress.completed == True
    ).all()

    # Enrich with Certificate table data (verification code, PDF)
    from database import Certificate
    cert_map = {}
    cert_ids = [p.certificate_id for p, c in completed if p.certificate_id]
    if cert_ids:
        certs = db.query(Certificate).filter(Certificate.user_id == user.id).all()
        for cert in certs:
            cert_map[cert.id] = cert
            cert_map[cert.course_id] = cert  # also index by course_id

    result = []
    for p, c in completed:
        # Try to find matching Certificate record
        cert_record = cert_map.get(p.certificate_id) or cert_map.get(c.id)
        result.append({
            "certificateId": p.certificate_id,
            "courseId": c.id,
            "courseTitle": c.title, "courseEmoji": c.emoji,
            "courseCategory": c.category,
            "courseDifficulty": c.difficulty,
            "estimatedMinutes": c.estimated_minutes,
            "lessonCount": c.lesson_count,
            "score": p.quiz_score, "completedAt": p.completed_at.isoformat() if p.completed_at else "",
            "startedAt": p.started_at.isoformat() if p.started_at else "",
            "userName": f"{user.first_name} {user.last_name}",
            # Verified certificate data
            "certCode": cert_record.certificate_code if cert_record else None,
            "certId": cert_record.id if cert_record else None,
            "hasPdf": bool(cert_record and cert_record.pdf_path) if cert_record else False,
            "verifyUrl": f"https://conniku.com/cert/{cert_record.certificate_code}" if cert_record else None,
            "hours": cert_record.hours_completed if cert_record else c.estimated_minutes // 60 if c.estimated_minutes else 0,
            "grade": cert_record.final_grade if cert_record else p.quiz_score,
        })
    return result


@router.get("/certificates/{user_id}")
def user_certificates(user_id: str, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")

    completed = db.query(UserCourseProgress, Course).join(
        Course, Course.id == UserCourseProgress.course_id
    ).filter(
        UserCourseProgress.user_id == user_id,
        UserCourseProgress.completed == True
    ).all()

    return [{
        "certificateId": p.certificate_id,
        "courseId": c.id,
        "courseTitle": c.title, "courseEmoji": c.emoji,
        "courseCategory": c.category,
        "courseDifficulty": c.difficulty,
        "estimatedMinutes": c.estimated_minutes,
        "lessonCount": c.lesson_count,
        "score": p.quiz_score, "completedAt": p.completed_at.isoformat() if p.completed_at else "",
        "startedAt": p.started_at.isoformat() if p.started_at else "",
        "userName": f"{u.first_name} {u.last_name}",
    } for p, c in completed]


# ─── CEO: Course Certification Management ──────────────────

class AdminCertifyRequest(BaseModel):
    user_id: str
    course_ids: list[str]
    score_override: int = 100  # default 100%

@router.get("/admin/progress-overview")
def admin_progress_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all users' course progress for CEO dashboard."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores")

    # Get all courses
    courses = db.query(Course).order_by(Course.title).all()

    # Get all progress records with user info
    progress_records = db.query(UserCourseProgress, User, Course).join(
        User, User.id == UserCourseProgress.user_id
    ).join(
        Course, Course.id == UserCourseProgress.course_id
    ).order_by(desc(UserCourseProgress.started_at)).all()

    # Build user progress map
    users_map: dict = {}
    for p, u, c in progress_records:
        if u.id not in users_map:
            users_map[u.id] = {
                "userId": u.id,
                "name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "avatar": u.avatar or "",
                "courses": [],
                "completedCount": 0,
                "totalStarted": 0,
            }
        completed_lessons = json.loads(p.completed_lessons or "[]")
        course_lessons = db.query(CourseLesson).filter(CourseLesson.course_id == c.id).count()
        lesson_progress = round((len(completed_lessons) / max(course_lessons, 1)) * 100)

        course_data = {
            "courseId": c.id,
            "courseTitle": c.title,
            "courseEmoji": c.emoji or "📚",
            "category": c.category,
            "lessonProgress": lesson_progress,
            "lessonsCompleted": len(completed_lessons),
            "totalLessons": course_lessons,
            "quizPassed": p.quiz_passed or False,
            "quizScore": p.quiz_score,
            "completed": p.completed or False,
            "certificateId": p.certificate_id,
            "completedAt": p.completed_at.isoformat() if p.completed_at else None,
        }
        users_map[u.id]["courses"].append(course_data)
        users_map[u.id]["totalStarted"] += 1
        if p.completed:
            users_map[u.id]["completedCount"] += 1

    # Summary stats
    total_users_with_progress = len(users_map)
    total_certificates = sum(1 for p, _, _ in progress_records if p.completed)
    total_in_progress = sum(1 for p, _, _ in progress_records if not p.completed)

    return {
        "summary": {
            "totalUsersWithProgress": total_users_with_progress,
            "totalCertificatesIssued": total_certificates,
            "totalInProgress": total_in_progress,
            "totalCourses": len(courses),
        },
        "users": list(users_map.values()),
        "courses": [{"id": c.id, "title": c.title, "emoji": c.emoji or "📚", "category": c.category} for c in courses],
    }


@router.post("/admin/certify")
def admin_certify_users(req: AdminCertifyRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """CEO can manually certify a user for specific courses."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores")

    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    certified = []
    for course_id in req.course_ids:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            continue

        # Get or create progress
        progress = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == req.user_id,
            UserCourseProgress.course_id == course_id
        ).first()

        if not progress:
            progress = UserCourseProgress(
                id=gen_id(),
                user_id=req.user_id,
                course_id=course_id,
                completed_lessons="[]",
            )
            db.add(progress)

        # Mark all lessons as completed
        lessons = db.query(CourseLesson).filter(CourseLesson.course_id == course_id).all()
        progress.completed_lessons = json.dumps([l.id for l in lessons])

        # Mark quiz as passed and course as completed
        progress.quiz_passed = True
        progress.quiz_score = req.score_override
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        progress.certificate_id = progress.certificate_id or gen_id()

        # Award XP
        from gamification import award_xp
        award_xp(target_user, 30, db)

        certified.append({
            "courseId": course_id,
            "courseTitle": course.title,
            "certificateId": progress.certificate_id,
            "score": req.score_override,
        })

    db.commit()

    return {
        "success": True,
        "userId": req.user_id,
        "userName": f"{target_user.first_name} {target_user.last_name}",
        "certified": certified,
        "message": f"{len(certified)} curso(s) certificado(s) exitosamente",
    }


@router.post("/admin/revoke-certificate")
def admin_revoke_certificate(user_id: str, course_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """CEO can revoke a certificate."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores")

    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user_id,
        UserCourseProgress.course_id == course_id
    ).first()

    if not progress:
        raise HTTPException(404, "Progreso no encontrado")

    progress.completed = False
    progress.quiz_passed = False
    progress.quiz_score = None
    progress.certificate_id = None
    progress.completed_at = None
    db.commit()

    return {"success": True, "message": "Certificado revocado"}


# ─── Student CV ─────────────────────────────────────────────

@router.get("/cv")
def get_my_cv(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = db.query(StudentCV).filter(StudentCV.user_id == user.id).first()
    if not cv:
        return {"headline": "", "aboutMe": "", "skills": [], "tools": [], "languagesSpoken": [],
                "experience": [], "projectsPortfolio": [], "volunteering": [],
                "interests": [], "testimonials": [], "visibility": "public"}
    return {
        "headline": cv.headline or "", "aboutMe": cv.about_me or "",
        "skills": json.loads(cv.skills or "[]"), "tools": json.loads(cv.tools or "[]"),
        "languagesSpoken": json.loads(cv.languages_spoken or "[]"),
        "experience": json.loads(cv.experience or "[]"),
        "projectsPortfolio": json.loads(cv.projects_portfolio or "[]"),
        "volunteering": json.loads(cv.volunteering or "[]"),
        "interests": json.loads(cv.interests or "[]"),
        "testimonials": json.loads(cv.testimonials or "[]"),
        "visibility": cv.visibility or "public",
    }


@router.put("/cv")
def update_cv(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = db.query(StudentCV).filter(StudentCV.user_id == user.id).first()
    if not cv:
        cv = StudentCV(id=gen_id(), user_id=user.id)
        db.add(cv)

    if "headline" in data: cv.headline = data["headline"]
    if "aboutMe" in data: cv.about_me = data["aboutMe"]
    if "skills" in data: cv.skills = json.dumps(data["skills"])
    if "tools" in data: cv.tools = json.dumps(data["tools"])
    if "languagesSpoken" in data: cv.languages_spoken = json.dumps(data["languagesSpoken"])
    if "experience" in data: cv.experience = json.dumps(data["experience"])
    if "projectsPortfolio" in data: cv.projects_portfolio = json.dumps(data["projectsPortfolio"])
    if "volunteering" in data: cv.volunteering = json.dumps(data["volunteering"])
    if "interests" in data: cv.interests = json.dumps(data["interests"])
    if "testimonials" in data: cv.testimonials = json.dumps(data["testimonials"])
    if "visibility" in data: cv.visibility = data["visibility"]
    cv.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "updated"}


@router.get("/cv/{user_id}")
def get_user_cv(user_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = db.query(StudentCV).filter(StudentCV.user_id == user_id).first()
    if not cv:
        return None

    # Check visibility
    if cv.visibility == "private" and user_id != user.id:
        return None
    if cv.visibility == "friends":
        from database import Friendship
        is_friend = db.query(Friendship).filter(
            ((Friendship.requester_id == user.id) & (Friendship.addressee_id == user_id)) |
            ((Friendship.requester_id == user_id) & (Friendship.addressee_id == user.id)),
            Friendship.status == "accepted"
        ).first()
        if not is_friend and user_id != user.id:
            return {"restricted": True, "visibility": "friends"}
    if cv.visibility == "recruiters_only":
        from database import RecruiterProfile
        is_recruiter = db.query(RecruiterProfile).filter(
            RecruiterProfile.user_id == user.id
        ).first()
        if not is_recruiter and user_id != user.id:
            return {"restricted": True, "visibility": "recruiters_only"}

    return {
        "headline": cv.headline or "", "aboutMe": cv.about_me or "",
        "skills": json.loads(cv.skills or "[]"), "tools": json.loads(cv.tools or "[]"),
        "languagesSpoken": json.loads(cv.languages_spoken or "[]"),
        "experience": json.loads(cv.experience or "[]"),
        "projectsPortfolio": json.loads(cv.projects_portfolio or "[]"),
        "volunteering": json.loads(cv.volunteering or "[]"),
        "interests": json.loads(cv.interests or "[]"),
        "visibility": cv.visibility or "public",
    }


@router.get("/cv-public/all")
def list_public_cvs(
    search: str = "",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all public CVs for the job board."""
    query = db.query(StudentCV).filter(StudentCV.visibility == "public")
    cvs = query.all()

    results = []
    for cv in cvs:
        if not cv.headline and not cv.about_me:
            continue  # Skip empty CVs

        u = db.query(User).filter(User.id == cv.user_id).first()
        if not u:
            continue

        # Search filter
        if search:
            search_lower = search.lower()
            match = (
                search_lower in (cv.headline or "").lower()
                or search_lower in (cv.about_me or "").lower()
                or search_lower in (u.first_name or "").lower()
                or search_lower in (u.last_name or "").lower()
                or search_lower in (u.career or "").lower()
                or search_lower in (u.university or "").lower()
                or any(search_lower in s.lower() for s in json.loads(cv.skills or "[]"))
            )
            if not match:
                continue

        results.append({
            "userId": u.id,
            "firstName": u.first_name,
            "lastName": u.last_name,
            "username": u.username,
            "avatar": u.avatar,
            "university": u.university or "",
            "career": u.career or "",
            "headline": cv.headline or "",
            "aboutMe": cv.about_me or "",
            "skills": json.loads(cv.skills or "[]"),
            "tools": json.loads(cv.tools or "[]"),
            "experience": json.loads(cv.experience or "[]"),
            "updatedAt": cv.updated_at.isoformat() if cv.updated_at else "",
        })

    return {"cvs": results, "total": len(results)}
