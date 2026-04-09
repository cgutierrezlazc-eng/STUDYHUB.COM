"""Quiz system: diagnostic tests, scheduled quizzes, 1-10 scoring, alerts."""
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import (get_db, User, QuizHistory, ScheduledQuiz, CalendarEvent,
                      gen_id)
from middleware import get_current_user
from gemini_engine import AIEngine

router = APIRouter(prefix="/quiz-system", tags=["quiz-system"])
ai_engine = AIEngine()


def _score_to_10(percentage: int) -> float:
    """Convert percentage to 1-10 scale."""
    return round(max(1, min(10, percentage / 10)), 1)


# ─── Diagnostic Test ───────────────────────────────────────

@router.post("/diagnostic/{project_id}")
def generate_diagnostic(project_id: str, data: dict,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate diagnostic test for a subject based on its name (no docs needed)."""
    subject_name = data.get("subject_name", "")
    duration_weeks = data.get("duration_weeks", 16)
    start_date = data.get("start_date", datetime.utcnow().isoformat())

    if not subject_name:
        raise HTTPException(400, "Nombre de la asignatura requerido")

    lang = user.language or "es"

    system = f"""Eres un profesor universitario experto. Genera una prueba diagnóstica para evaluar el nivel inicial del estudiante.
Responde SOLO con JSON válido:
{{
  "topics": ["tema1", "tema2", "tema3", "tema4", "tema5"],
  "questions": [
    {{
      "question": "texto de la pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "topic": "tema al que pertenece",
      "difficulty": "basic"
    }}
  ]
}}
Genera exactamente 15 preguntas que cubran los temas fundamentales de la materia.
Mezcla dificultades: 5 básicas, 5 intermedias, 5 avanzadas.
Responde en {'español' if lang == 'es' else 'English' if lang == 'en' else lang}."""

    prompt = f"Genera una prueba diagnóstica para la materia universitaria: {subject_name}. Duración del curso: {duration_weeks} semanas."

    try:
        result_text = ai_engine._call_gemini(system, prompt)
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        result = json.loads(result_text[start:end]) if start >= 0 else {"topics": [], "questions": []}
    except Exception:
        result = {"topics": [], "questions": []}

    # Schedule 4 quizzes across the course duration
    try:
        start_dt = datetime.fromisoformat(start_date)
    except ValueError:
        start_dt = datetime.utcnow()

    quiz_weeks = [
        int(duration_weeks * 0.25),
        int(duration_weeks * 0.50),
        int(duration_weeks * 0.75),
        int(duration_weeks * 0.95),
    ]

    scheduled = []
    for i, week in enumerate(quiz_weeks):
        quiz_date = start_dt + timedelta(weeks=week)
        sq = ScheduledQuiz(
            id=gen_id(), user_id=user.id, project_id=project_id,
            quiz_number=i + 1, scheduled_date=quiz_date,
        )
        db.add(sq)

        # Create calendar event
        cal = CalendarEvent(
            id=gen_id(), user_id=user.id, project_id=project_id,
            title=f"Quiz {i + 1} — {subject_name}",
            description=f"Quiz programado automático #{i + 1} de {subject_name}",
            event_type="exam", due_date=quiz_date, color="#2563EB",
        )
        db.add(cal)
        sq.calendar_event_id = cal.id

        scheduled.append({
            "quizNumber": i + 1, "scheduledDate": quiz_date.isoformat(),
            "week": week, "status": "pending",
        })

    db.commit()

    return {
        "topics": result.get("topics", []),
        "questions": result.get("questions", []),
        "scheduledQuizzes": scheduled,
        "durationWeeks": duration_weeks,
    }


@router.post("/diagnostic/{project_id}/submit")
def submit_diagnostic(project_id: str, data: dict,
                      user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit diagnostic test results."""
    answers = data.get("answers", {})
    questions = data.get("questions", [])

    correct = 0
    topics_scores = {}
    topic_counts = {}

    for i, q in enumerate(questions):
        topic = q.get("topic", "general")
        if topic not in topics_scores:
            topics_scores[topic] = 0
            topic_counts[topic] = 0
        topic_counts[topic] += 1
        if str(i) in answers and answers[str(i)] == q.get("correctAnswer"):
            correct += 1
            topics_scores[topic] += 1

    # Convert to 1-10 scale per topic
    for topic in topics_scores:
        if topic_counts[topic] > 0:
            topics_scores[topic] = round((topics_scores[topic] / topic_counts[topic]) * 10, 1)

    percentage = round((correct / max(len(questions), 1)) * 100)
    score_10 = _score_to_10(percentage)

    history = QuizHistory(
        id=gen_id(), user_id=user.id, project_id=project_id,
        quiz_type="diagnostic", quiz_number=0,
        score_1_to_10=score_10, score_percentage=percentage,
        topics_scores=json.dumps(topics_scores),
        questions_count=len(questions), correct_count=correct,
    )
    db.add(history)

    from gamification import award_xp
    award_xp(user, 15, db)
    db.commit()

    weak = [t for t, s in topics_scores.items() if s < 5]
    strong = [t for t, s in topics_scores.items() if s >= 7]

    return {
        "score": score_10, "percentage": percentage,
        "correct": correct, "total": len(questions),
        "topicsScores": topics_scores,
        "weakTopics": weak, "strongTopics": strong,
        "historyId": history.id,
    }


# ─── Scheduled Quizzes ─────────────────────────────────────

@router.get("/scheduled/{project_id}")
def get_scheduled_quizzes(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quizzes = db.query(ScheduledQuiz).filter(
        ScheduledQuiz.user_id == user.id, ScheduledQuiz.project_id == project_id
    ).order_by(ScheduledQuiz.quiz_number).all()

    now = datetime.utcnow()
    result = []
    for sq in quizzes:
        status = sq.status
        if status == "pending" and sq.scheduled_date <= now:
            status = "available"
            sq.status = "available"
        result.append({
            "id": sq.id, "quizNumber": sq.quiz_number,
            "scheduledDate": sq.scheduled_date.isoformat() if sq.scheduled_date else "",
            "status": status, "notified": sq.notified,
        })
    db.commit()
    return result


@router.post("/scheduled/{quiz_id}/generate")
def generate_scheduled_quiz(quiz_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a scheduled quiz, focusing on weak topics from previous quizzes."""
    sq = db.query(ScheduledQuiz).filter(
        ScheduledQuiz.id == quiz_id, ScheduledQuiz.user_id == user.id
    ).first()
    if not sq:
        raise HTTPException(404, "Quiz no encontrado")
    if sq.status == "completed":
        raise HTTPException(400, "Este quiz ya fue completado")

    # Get weak topics from previous quizzes
    prev = db.query(QuizHistory).filter(
        QuizHistory.user_id == user.id, QuizHistory.project_id == sq.project_id
    ).order_by(desc(QuizHistory.created_at)).first()

    weak_topics = []
    if prev and prev.topics_scores:
        scores = json.loads(prev.topics_scores)
        weak_topics = [t for t, s in scores.items() if s < 6]

    # Generate adaptive quiz
    all_text = ai_engine._get_all_text(sq.project_id)
    lang = user.language or "es"

    weak_instruction = ""
    if weak_topics:
        weak_instruction = f"\nENFÓCATE en estos temas donde el estudiante tiene debilidades: {', '.join(weak_topics)}"

    system = f"""Genera un quiz de evaluación. Este es el Quiz #{sq.quiz_number} del curso.{weak_instruction}
Responde SOLO con JSON:
{{
  "questions": [
    {{"question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "topic": "tema", "explanation": "..."}}
  ]
}}
Genera 10 preguntas. Responde en {'español' if lang == 'es' else 'English'}."""

    prompt = f"Material del curso:\n{all_text[:12000]}\n\nGenera el Quiz #{sq.quiz_number}."

    try:
        result_text = ai_engine._call_gemini(system, prompt)
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        result = json.loads(result_text[start:end])
    except Exception:
        result = {"questions": []}

    return {"quizNumber": sq.quiz_number, "questions": result.get("questions", []), "quizId": sq.id}


@router.post("/scheduled/{quiz_id}/submit")
def submit_scheduled_quiz(quiz_id: str, data: dict,
                          user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit a scheduled quiz with 1-10 scoring."""
    sq = db.query(ScheduledQuiz).filter(
        ScheduledQuiz.id == quiz_id, ScheduledQuiz.user_id == user.id
    ).first()
    if not sq:
        raise HTTPException(404, "Quiz no encontrado")

    answers = data.get("answers", {})
    questions = data.get("questions", [])

    correct = 0
    topics_scores = {}
    topic_counts = {}
    for i, q in enumerate(questions):
        topic = q.get("topic", "general")
        if topic not in topics_scores:
            topics_scores[topic] = 0
            topic_counts[topic] = 0
        topic_counts[topic] += 1
        if str(i) in answers and answers[str(i)] == q.get("correctAnswer"):
            correct += 1
            topics_scores[topic] += 1

    for topic in topics_scores:
        if topic_counts[topic] > 0:
            topics_scores[topic] = round((topics_scores[topic] / topic_counts[topic]) * 10, 1)

    percentage = round((correct / max(len(questions), 1)) * 100)
    score_10 = _score_to_10(percentage)

    history = QuizHistory(
        id=gen_id(), user_id=user.id, project_id=sq.project_id,
        quiz_type="scheduled", quiz_number=sq.quiz_number,
        score_1_to_10=score_10, score_percentage=percentage,
        topics_scores=json.dumps(topics_scores),
        questions_count=len(questions), correct_count=correct,
    )
    db.add(history)

    sq.status = "completed"
    sq.quiz_history_id = history.id

    from gamification import award_xp
    award_xp(user, 25, db)
    db.commit()

    return {
        "score": score_10, "percentage": percentage,
        "correct": correct, "total": len(questions),
        "topicsScores": topics_scores, "quizNumber": sq.quiz_number,
    }


# ─── Subject Average ───────────────────────────────────────

@router.get("/average/{project_id}")
def get_subject_average(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the student's average score for a subject across all quizzes."""
    quizzes = db.query(QuizHistory).filter(
        QuizHistory.user_id == user.id, QuizHistory.project_id == project_id
    ).order_by(QuizHistory.created_at).all()

    if not quizzes:
        return {"average": 0, "quizCount": 0, "history": [], "topicsAverage": {}}

    total_score = sum(q.score_1_to_10 for q in quizzes)
    avg = round(total_score / len(quizzes), 1)

    # Aggregate topic scores
    all_topics: dict = {}
    topic_counts: dict = {}
    for q in quizzes:
        scores = json.loads(q.topics_scores or "{}")
        for topic, score in scores.items():
            all_topics[topic] = all_topics.get(topic, 0) + score
            topic_counts[topic] = topic_counts.get(topic, 0) + 1

    topics_avg = {t: round(all_topics[t] / topic_counts[t], 1) for t in all_topics}

    return {
        "average": avg,
        "quizCount": len(quizzes),
        "history": [{
            "id": q.id, "type": q.quiz_type, "quizNumber": q.quiz_number,
            "score": q.score_1_to_10, "percentage": q.score_percentage,
            "correct": q.correct_count, "total": q.questions_count,
            "date": q.created_at.isoformat() if q.created_at else "",
        } for q in quizzes],
        "topicsAverage": topics_avg,
    }


# ─── Quiz Alerts (check pending quizzes) ───────────────────

@router.post("/check-alerts")
def check_quiz_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check for upcoming/overdue quizzes and send notifications."""
    now = datetime.utcnow()
    two_days = now + timedelta(days=2)
    three_days_ago = now - timedelta(days=3)

    # Quizzes due in 2 days (pre-notification)
    upcoming = db.query(ScheduledQuiz).filter(
        ScheduledQuiz.user_id == user.id,
        ScheduledQuiz.status == "pending",
        ScheduledQuiz.scheduled_date <= two_days,
        ScheduledQuiz.scheduled_date > now,
        ScheduledQuiz.notified == False,
    ).all()

    for sq in upcoming:
        from notification_routes import create_notification
        create_notification(db, user.id, "quiz_reminder",
            f"📝 En 2 días tienes el Quiz {sq.quiz_number}",
            body="Prepárate repasando tus notas y flashcards",
            link=f"/project/{sq.project_id}")
        sq.notified = True

    # Quizzes now available
    available = db.query(ScheduledQuiz).filter(
        ScheduledQuiz.user_id == user.id,
        ScheduledQuiz.status == "pending",
        ScheduledQuiz.scheduled_date <= now,
    ).all()

    for sq in available:
        sq.status = "available"
        if not sq.notified_reminder:
            from notification_routes import create_notification
            create_notification(db, user.id, "quiz_available",
                f"🧠 ¡Tu Quiz {sq.quiz_number} está listo!",
                body="Complétalo para ver tu progreso",
                link=f"/project/{sq.project_id}")
            sq.notified_reminder = True

    # Overdue reminders (available but not completed after 3 days)
    overdue = db.query(ScheduledQuiz).filter(
        ScheduledQuiz.user_id == user.id,
        ScheduledQuiz.status == "available",
        ScheduledQuiz.scheduled_date <= three_days_ago,
    ).all()

    for sq in overdue:
        sq.status = "overdue"
        from notification_routes import create_notification
        create_notification(db, user.id, "quiz_overdue",
            f"⏰ Aún no completaste tu Quiz {sq.quiz_number}",
            body="No dejes pasar más tiempo, complétalo hoy",
            link=f"/project/{sq.project_id}")

    db.commit()

    alerts_sent = len(upcoming) + len(available) + len(overdue)
    return {"alertsSent": alerts_sent}
