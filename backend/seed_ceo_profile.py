"""
Seed script: Complete CEO profile with real data.
Sets up Cristian Gutierrez Lazcano's profile as the definitive example account.
All courses completed, real CV data, badges, XP, and professional information.

Can be run standalone: python seed_ceo_profile.py
Or via API endpoint: POST /admin/seed-ceo-profile (owner only)
"""
import json
from datetime import datetime, timedelta

from database import SessionLocal, User, Course, CourseLesson, CourseQuiz, UserCourseProgress, gen_id


def seed_ceo_with_db(db, owner):
    """Core logic — receives db session and user object from the API endpoint."""
    from course_routes import _seed_courses, _seed_static_content

    # ─── Personal Info ─────────────────────────────────────
    owner.first_name = "Cristian"
    owner.last_name = "Gutierrez Lazcano"
    owner.username = "cristian.ceo"
    owner.gender = "male"
    owner.language = "es"
    owner.language_skill = "advanced"
    owner.secondary_languages = json.dumps(["en", "pt"])
    owner.platform_language = "es"
    owner.university = "Universidad del Alba"
    owner.career = "Ingenieria Comercial ADVANCE"
    owner.semester = 8
    owner.total_semesters = 10
    owner.phone = ""
    owner.birth_date = ""
    owner.country = "CL"
    owner.country_currency = "CLP"
    owner.academic_status = "estudiante"
    owner.professional_title = "Ingeniero Comercial"
    owner.study_start_date = ""
    owner.is_graduated = False
    owner.is_senior_year = True

    # ─── Bio ───────────────────────────────────────────────
    owner.bio = (
        "Fundador y CEO de Conniku. Estudiante de Ingenieria Comercial ADVANCE "
        "en la Universidad del Alba, Chile. Apasionado por la tecnologia, "
        "la educacion y el emprendimiento. Creo que la educacion universitaria "
        "puede ser mejor, mas humana y mas conectada. Por eso cree Conniku."
    )

    # ─── CV Fields ─────────────────────────────────────────
    owner.cv_headline = "CEO & Fundador de Conniku | Ing. Comercial | Emprendedor EdTech"
    owner.cv_summary = (
        "Emprendedor y lider tecnologico con experiencia en desarrollo de productos digitales "
        "enfocados en educacion superior. Fundador de Conniku, la plataforma integral para "
        "estudiantes universitarios que conecta herramientas de estudio, comunidad y desarrollo "
        "profesional en un solo lugar. Formacion en Ingenieria Comercial con enfasis en "
        "gestion de proyectos, innovacion y liderazgo."
    )
    owner.cv_experience = json.dumps([
        {
            "title": "CEO & Fundador",
            "company": "Conniku SpA",
            "location": "Chile",
            "startDate": "2024-01",
            "endDate": "",
            "current": True,
            "description": "Liderando el desarrollo de la plataforma educativa integral para estudiantes universitarios. Responsable de la vision del producto, desarrollo tecnologico, estrategia de crecimiento y relaciones con stakeholders."
        },
    ])
    owner.cv_skills = json.dumps([
        "Liderazgo", "Gestion de Proyectos", "Emprendimiento",
        "Comunicacion Efectiva", "Trabajo en Equipo",
        "Pensamiento Estrategico", "Marketing Digital",
        "Analisis de Datos", "Desarrollo de Negocios",
        "Planificacion Financiera", "Innovacion",
        "Tecnologia Educativa", "Product Management",
    ])
    owner.cv_certifications = json.dumps([])
    owner.cv_languages = json.dumps([
        {"language": "Espanol", "level": "Nativo"},
        {"language": "Ingles", "level": "Avanzado"},
        {"language": "Portugues", "level": "Intermedio"},
    ])
    owner.cv_portfolio = json.dumps([
        {"title": "Conniku", "url": "https://conniku.com", "description": "Plataforma educativa integral para universitarios"},
    ])
    owner.cv_visibility = "public"

    # ─── Mentoring ─────────────────────────────────────────
    owner.offers_mentoring = True
    owner.mentoring_services = json.dumps(["tutoring", "career_guidance", "project_review"])
    owner.mentoring_subjects = json.dumps(["Emprendimiento", "Gestion de Proyectos", "Liderazgo", "Marketing"])
    owner.mentoring_description = (
        "Puedo ayudarte con temas de emprendimiento, desarrollo de productos, "
        "gestion de proyectos y liderazgo. Mi enfoque es practico y orientado a resultados."
    )
    owner.mentoring_price_type = "free"

    # ─── Gamification ──────────────────────────────────────
    owner.xp = 15000
    owner.level = 25
    owner.streak_days = 120
    owner.last_active_date = datetime.utcnow().strftime("%Y-%m-%d")
    owner.badges = json.dumps([
        "early_adopter", "course_master", "streak_7", "streak_30", "streak_60",
        "streak_90", "first_project", "social_butterfly", "quiz_ace",
        "mentor", "community_leader", "top_contributor", "level_10",
        "level_20", "perfect_quiz", "all_courses", "founder"
    ])

    # ─── Subscription & Admin ──────────────────────────────
    owner.subscription_status = "owner"
    owner.subscription_tier = "max"
    owner.is_admin = True
    owner.role = "owner"
    owner.email_verified = True
    owner.onboarding_completed = True
    owner.theme = "nocturno"
    owner.storage_limit_bytes = 1099511627776  # 1 TB

    # ─── Pomodoro Stats ────────────────────────────────────
    owner.pomodoro_total_sessions = 340
    owner.pomodoro_total_minutes = 8500
    owner.weekly_study_goal_hours = 15.0
    owner.streak_freeze_count = 5

    # ─── Cover Photo ───────────────────────────────────────
    owner.cover_type = "template"
    owner.cover_photo = "gradient-blue-purple"

    db.flush()

    # ─── Seed courses if needed ────────────────────────────
    _seed_courses(db)
    _seed_static_content(db)

    # ─── Complete ALL Courses ──────────────────────────────
    courses = db.query(Course).all()
    if not courses:
        db.commit()
        return {"ok": True, "message": "Perfil actualizado pero no se encontraron cursos.", "courses_completed": 0}

    completed_count = 0
    for i, course in enumerate(courses):
        # Get all lessons for this course
        lessons = db.query(CourseLesson).filter(
            CourseLesson.course_id == course.id
        ).order_by(CourseLesson.order_index).all()

        lesson_ids = [l.id for l in lessons]

        # Check if progress already exists
        progress = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == owner.id,
            UserCourseProgress.course_id == course.id,
        ).first()

        cert_id = gen_id()

        # Spread completions over the last ~3 months
        days_ago = (len(courses) - i) * 3
        completed_date = datetime.utcnow() - timedelta(days=days_ago)

        quiz_score = 95 + (i % 6)  # 95-100

        if progress:
            progress.completed_lessons = json.dumps(lesson_ids)
            progress.quiz_score = quiz_score
            progress.quiz_passed = True
            progress.completed = True
            if not progress.certificate_id:
                progress.certificate_id = cert_id
        else:
            progress = UserCourseProgress(
                id=gen_id(),
                user_id=owner.id,
                course_id=course.id,
                completed_lessons=json.dumps(lesson_ids),
                quiz_score=quiz_score,
                quiz_passed=True,
                completed=True,
                certificate_id=cert_id,
                started_at=completed_date - timedelta(days=2),
            )
            db.add(progress)

        completed_count += 1

    db.commit()

    return {
        "ok": True,
        "message": "Perfil CEO completo",
        "profile": {
            "name": "Cristian Gutierrez Lazcano",
            "username": "cristian.ceo",
            "email": owner.email,
            "university": "Universidad del Alba",
            "career": "Ingenieria Comercial ADVANCE",
            "level": 25,
            "xp": 15000,
            "streak": 120,
            "badges": 17,
            "pomodoro_sessions": 340,
        },
        "courses_completed": completed_count,
        "total_courses": len(courses),
    }


def seed_ceo():
    """Standalone runner — creates its own DB session."""
    db = SessionLocal()
    try:
        owner = db.query(User).filter(
            (User.email == "ceo@conniku.com") | (User.role == "owner")
        ).first()

        if not owner:
            print("No se encontro la cuenta del CEO.")
            return

        print(f"Actualizando perfil de {owner.email} (ID: {owner.id})...")
        result = seed_ceo_with_db(db, owner)

        print(f"\n{'='*50}")
        print(f"PERFIL CEO COMPLETADO")
        print(f"{'='*50}")
        for k, v in result.get("profile", {}).items():
            print(f"  {k}: {v}")
        print(f"  Cursos completados: {result['courses_completed']}/{result['total_courses']}")
        print(f"{'='*50}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_ceo()
