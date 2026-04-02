"""Courses platform for integral professional development."""
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import (get_db, User, Course, CourseLesson, CourseQuiz,
                      UserCourseProgress, StudentCV, gen_id)
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


@router.post("/{course_id}/generate")
def generate_course_content(course_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate course lessons and quiz using AI."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Curso no encontrado")

    existing_lessons = db.query(CourseLesson).filter(CourseLesson.course_id == course_id).count()
    if existing_lessons > 0:
        return {"status": "already_generated"}

    # Generate lessons with AI
    from ai_engine import AIEngine
    ai = AIEngine()

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
        result_text = ai._call_claude(system, prompt, model="claude-sonnet-4-20250514")
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
        raise HTTPException(500, f"Error generando contenido: {str(e)}")


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


@router.post("/{course_id}/quiz/submit")
def submit_quiz(course_id: str, data: dict,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    answers = data.get("answers", {})  # {questionIndex: selectedOption}

    quiz = db.query(CourseQuiz).filter(CourseQuiz.course_id == course_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")

    questions = json.loads(quiz.questions or "[]")
    correct = 0
    for i, q in enumerate(questions):
        if str(i) in answers and answers[str(i)] == q.get("correctAnswer"):
            correct += 1

    score = round((correct / max(len(questions), 1)) * 100)
    passed = score >= 70

    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user.id, UserCourseProgress.course_id == course_id
    ).first()
    if not progress:
        progress = UserCourseProgress(id=gen_id(), user_id=user.id, course_id=course_id)
        db.add(progress)

    progress.quiz_score = score
    progress.quiz_passed = passed

    if passed:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        progress.certificate_id = gen_id()

        from gamification import award_xp
        award_xp(user, 30, db)

    db.commit()

    course = db.query(Course).filter(Course.id == course_id).first()
    return {
        "score": score, "passed": passed, "correct": correct, "total": len(questions),
        "certificateId": progress.certificate_id if passed else None,
        "courseTitle": course.title if course else "",
    }


@router.get("/certificates/my")
def my_certificates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    completed = db.query(UserCourseProgress, Course).join(
        Course, Course.id == UserCourseProgress.course_id
    ).filter(
        UserCourseProgress.user_id == user.id,
        UserCourseProgress.completed == True
    ).all()

    return [{
        "certificateId": p.certificate_id,
        "courseTitle": c.title, "courseEmoji": c.emoji,
        "courseCategory": c.category,
        "score": p.quiz_score, "completedAt": p.completed_at.isoformat() if p.completed_at else "",
        "userName": f"{user.first_name} {user.last_name}",
    } for p, c in completed]


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
        "courseTitle": c.title, "courseEmoji": c.emoji,
        "courseCategory": c.category,
        "score": p.quiz_score, "completedAt": p.completed_at.isoformat() if p.completed_at else "",
        "userName": f"{u.first_name} {u.last_name}",
    } for p, c in completed]


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
