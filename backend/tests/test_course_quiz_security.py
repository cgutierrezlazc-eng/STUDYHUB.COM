"""Tests de seguridad para POST /courses/{course_id}/quiz/submit.

Vulnerabilidad C8 (descubierta 2026-04-19 al auditar /quiz/submit
como derivado de C3 fix): el servidor calcula `total = len(answers)`
del cliente, permitiendo manipulación del denominador.

Atacante envía solo 1 respuesta correcta de un quiz de N preguntas:
- correct = 1
- total = 1 (lo que envió el cliente)
- score = 100% → passed (>= 80%) → certificado generado

Fix: `total = len(pool)` (usar el tamaño real del pool de BD).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta

import pytest

fastapi = pytest.importorskip("fastapi", reason="fastapi no instalado")
pytest.importorskip("httpx", reason="httpx no instalado")

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

os.environ.pop("DATABASE_URL", None)
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("OWNER_PASSWORD", "test-owner-password")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("BCRYPT_ROUNDS", "4")


@pytest.fixture(scope="module")
def app_and_db():
    from course_routes import router as course_router  # type: ignore
    from database import Base, get_db  # type: ignore

    app = FastAPI()
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(course_router)

    yield app, SessionLocal

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def client_with_quiz(app_and_db):
    """Curso con quiz de 3 preguntas (correctAnswer A, B, C respectivamente)."""
    from sqlalchemy import func

    from database import Course, CourseQuiz, User, gen_id  # type: ignore

    app, SessionLocal = app_and_db
    db = SessionLocal()

    max_num = db.query(func.max(User.user_number)).scalar() or 0
    user = User(
        id=gen_id(),
        email=f"c8test_{gen_id()}@conniku.com",
        username=f"c8user_{gen_id()}",
        user_number=max_num + 1,
        first_name="C8",
        last_name="Tester",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-01-01",
        created_at=datetime.utcnow(),
    )
    db.add(user)

    course = Course(id=gen_id(), title="Curso Test C8", description="Para tests C8")
    db.add(course)

    quiz_questions = json.dumps(
        [
            {"question": "P1", "correctAnswer": "A", "options": ["A", "B", "C"]},
            {"question": "P2", "correctAnswer": "B", "options": ["A", "B", "C"]},
            {"question": "P3", "correctAnswer": "C", "options": ["A", "B", "C"]},
        ]
    )
    quiz = CourseQuiz(id=gen_id(), course_id=course.id, questions=quiz_questions)
    db.add(quiz)
    db.commit()
    db.refresh(user)
    db.refresh(course)

    from jose import jwt  # type: ignore

    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)
    token = jwt.encode(
        {"sub": user.id, "exp": exp, "type": "access"},
        secret,
        algorithm="HS256",
    )
    headers = {"Authorization": f"Bearer {token}"}

    with TestClient(app) as client:
        yield client, headers, course.id, user.id

    db.close()


def test_atacante_envia_subset_correcto_obtiene_score_inflado(client_with_quiz) -> None:
    """C8: atacante envía solo 1 respuesta correcta de quiz de 3.

    Con código vulnerable: total=1, correct=1, score=100, passed=True.
    Con fix: total=len(pool)=3, correct=1, score=33, passed=False.
    """
    client, headers, course_id, _user_id = client_with_quiz

    payload = {"answers": {"0": "A"}}  # solo 1 de 3, la correcta

    resp = client.post(
        f"/courses/{course_id}/quiz/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["score"] == 33, (
        f"VULNERABILIDAD C8 ACTIVA: total se manipuló por subset cliente. "
        f"score={data['score']}, expected=33 (1/3)"
    )
    assert data["passed"] is False
    assert data["correct"] == 1
    assert data["total"] == 3, (
        f"total debe ser len(pool)=3, got {data.get('total')}"
    )


def test_atacante_envia_solo_correcta_no_obtiene_certificado(client_with_quiz) -> None:
    """C8 cara visible: con vulnerabilidad activa, atacante obtiene certificado."""
    client, headers, course_id, _user_id = client_with_quiz

    payload = {"answers": {"1": "B"}}  # solo P2 correcta

    resp = client.post(
        f"/courses/{course_id}/quiz/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["passed"] is False, (
        f"VULNERABILIDAD C8: atacante con 1/3 obtuvo passed=True → certificado emitido. "
        f"score={data['score']}"
    )
    assert data.get("certificateId") in (None, ""), (
        f"No debe emitirse certificate cuando passed=False. got={data.get('certificateId')!r}"
    )


def test_flujo_legitimo_3_de_3_correcto_obtiene_passed(client_with_quiz) -> None:
    """Regresión: usuario legítimo responde todas correcto → score=100, passed."""
    client, headers, course_id, _user_id = client_with_quiz

    payload = {"answers": {"0": "A", "1": "B", "2": "C"}}

    resp = client.post(
        f"/courses/{course_id}/quiz/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["score"] == 100
    assert data["passed"] is True
    assert data["correct"] == 3
    assert data["total"] == 3


def test_flujo_2_de_3_correcto_no_pasa(client_with_quiz) -> None:
    """Usuario responde 2/3 → score=66, no pasa el 80% mínimo."""
    client, headers, course_id, _user_id = client_with_quiz

    payload = {"answers": {"0": "A", "1": "B", "2": "WRONG"}}

    resp = client.post(
        f"/courses/{course_id}/quiz/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["score"] == 67, f"2/3 = 66.67 redondea a 67, got {data['score']}"
    assert data["passed"] is False
    assert data["correct"] == 2
    assert data["total"] == 3
