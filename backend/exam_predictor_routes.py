"""Exam predictor for students."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User, QuizHistory
from middleware import get_current_user, require_tier
from gemini_engine import AIEngine

router = APIRouter(prefix="/exam-predictor", tags=["exam-predictor"])
ai_engine = AIEngine()


@router.post("/predict/{project_id}")
def predict_exam(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_tier(user, "pro")

    all_text = ai_engine._get_all_text(project_id)
    if not all_text or len(all_text) < 100:
        raise HTTPException(400, "Sube más documentos para que la predicción sea precisa")

    # Get quiz history for weak areas
    history = db.query(QuizHistory).filter(
        QuizHistory.user_id == user.id, QuizHistory.project_id == project_id
    ).all()

    weak_info = ""
    if history:
        all_scores = {}
        for h in history:
            scores = json.loads(h.topics_scores or "{}")
            for topic, score in scores.items():
                if topic not in all_scores:
                    all_scores[topic] = []
                all_scores[topic].append(score)
        avg_scores = {t: round(sum(s)/len(s), 1) for t, s in all_scores.items()}
        weak = [f"{t} ({s}/10)" for t, s in sorted(avg_scores.items(), key=lambda x: x[1])]
        weak_info = f"\n\nRendimiento del estudiante en quizzes:\n" + "\n".join(weak)

    lang = user.language or "es"
    system = f"""Eres un profesor experto en predicción de exámenes universitarios.
Analiza el material del curso y el rendimiento del estudiante para predecir qué saldrá en el examen.
Responde SOLO con JSON:
{{
  "topics": [
    {{"topic": "nombre", "importance": "alta", "probability": 90, "tips": "Consejo de estudio"}},
    {{"topic": "nombre", "importance": "media", "probability": 60, "tips": "Consejo"}}
  ],
  "lastMinutePlan": [
    {{"day": "Día 1", "focus": "Tema", "tasks": ["tarea1", "tarea2"], "hours": 3}},
    {{"day": "Día 2", "focus": "Tema", "tasks": ["tarea1"], "hours": 2}},
    {{"day": "Día 3", "focus": "Repaso general", "tasks": ["Repasar todo"], "hours": 4}}
  ],
  "practiceQuestions": [
    {{"topic": "tema", "question": "pregunta", "hint": "pista para resolverla"}}
  ],
  "confidence": 0.85,
  "advice": "Consejo motivacional personalizado"
}}
Genera 5-8 temas, plan de 3 días, y 2 preguntas por tema.
Responde en {'español' if lang == 'es' else 'English'}."""

    prompt = f"Material del curso:\n{all_text[:15000]}{weak_info}\n\nPredice qué saldrá en el examen."

    try:
        result_text = ai_engine._call_claude(system, prompt)
        start = result_text.find('{')
        end = result_text.rfind('}') + 1
        result = json.loads(result_text[start:end])
    except Exception:
        result = {"topics": [], "lastMinutePlan": [], "practiceQuestions": [], "confidence": 0, "advice": "Error al generar predicción."}

    return result
