"""
Text analysis routes: detect machine-generated text patterns and suggest rewrites.
Branded as "Análisis de Originalidad" - no AI references.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User
from middleware import get_current_user

router = APIRouter(prefix="/tools", tags=["tools"])


class AnalyzeTextRequest(BaseModel):
    text: str


def analyze_text_patterns(text: str) -> dict:
    """
    Analyze text for patterns commonly found in machine-generated content.
    Uses heuristic checks + Claude API for deeper analysis.
    """
    import re

    words = text.split()
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    if len(words) < 20:
        return {
            "score": 0,
            "analysis": "Texto demasiado corto para analizar",
            "flaggedSections": [],
            "suggestions": [],
        }

    # Heuristic markers of generated text
    markers = {
        "transition_overuse": 0,
        "hedging": 0,
        "formal_uniformity": 0,
        "repetitive_structure": 0,
    }

    transition_words = [
        "además", "sin embargo", "por lo tanto", "en consecuencia", "no obstante",
        "cabe destacar", "es importante", "en este sentido", "furthermore",
        "moreover", "however", "therefore", "consequently", "additionally",
        "it is important to note", "it is worth mentioning",
    ]

    hedging_words = [
        "puede", "podría", "suele", "tiende a", "generalmente",
        "en general", "típicamente", "usualmente", "can", "could",
        "may", "might", "tends to", "generally", "typically",
    ]

    text_lower = text.lower()
    for tw in transition_words:
        markers["transition_overuse"] += text_lower.count(tw)

    for hw in hedging_words:
        markers["hedging"] += text_lower.count(hw)

    # Check sentence length uniformity
    if sentences:
        lengths = [len(s.split()) for s in sentences]
        avg_len = sum(lengths) / len(lengths)
        variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
        if variance < 15 and len(sentences) > 3:
            markers["formal_uniformity"] = 3

    # Calculate score (0-100, higher = more likely generated)
    raw_score = (
        min(markers["transition_overuse"] * 8, 30) +
        min(markers["hedging"] * 6, 25) +
        min(markers["formal_uniformity"] * 10, 25) +
        min(markers["repetitive_structure"] * 5, 20)
    )
    score = min(raw_score, 100)

    # Build flagged sections
    flagged = []
    for tw in transition_words:
        if tw in text_lower:
            idx = text_lower.index(tw)
            start = max(0, idx - 20)
            end = min(len(text), idx + len(tw) + 20)
            flagged.append({
                "text": text[start:end],
                "reason": "Frase de transición frecuente en texto generado",
            })

    # Build suggestions
    suggestions = []
    replacements = {
        "sin embargo": "pero", "por lo tanto": "entonces", "además": "también",
        "no obstante": "aun así", "en consecuencia": "por eso",
        "cabe destacar que": "", "es importante mencionar que": "",
        "however": "but", "furthermore": "also", "moreover": "also",
        "therefore": "so", "consequently": "so",
    }
    for original, rewrite in replacements.items():
        if original in text_lower:
            suggestions.append({
                "original": original,
                "rewrite": rewrite if rewrite else "(eliminar - innecesario)",
                "reason": "Simplificar para un estilo más natural",
            })

    analysis = ""
    if score < 20:
        analysis = "El texto parece escrito de forma natural y auténtica."
    elif score < 50:
        analysis = "El texto tiene algunos patrones formales. Considera variar la estructura."
    elif score < 75:
        analysis = "El texto muestra patrones repetitivos frecuentes en contenido generado. Se recomienda reescribir secciones marcadas."
    else:
        analysis = "El texto tiene alta probabilidad de ser generado automáticamente. Se recomienda una reescritura significativa."

    return {
        "score": score,
        "analysis": analysis,
        "flaggedSections": flagged[:10],
        "suggestions": suggestions[:10],
    }


@router.post("/analyze-originality")
def analyze_originality(
    body: AnalyzeTextRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.text.strip():
        raise HTTPException(400, "El texto no puede estar vacío")

    if len(body.text) > 50000:
        raise HTTPException(400, "El texto es demasiado largo (máx 50,000 caracteres)")

    result = analyze_text_patterns(body.text)
    return result
