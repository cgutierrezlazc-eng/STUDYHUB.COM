"""Tests de seguridad para POST /courses/{course_id}/exercises/submit.

Vulnerabilidad C3: el servidor confiaba en el campo `correctAnswer`
enviado por el cliente, permitiendo trampa garantizada con score=100.

Fix (Opción B del plan): el handler ignora `correctAnswer` del cliente
y re-valida contra `CourseQuiz.questions` persistido en BD, indexando
por hash SHA256 de la pregunta.

Plan: docs/plans/hardening-quizzes-c3/plan.md
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta

import pytest

# Skip módulo si fastapi o httpx no están disponibles
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


# ─── Fixture central: app + BD in-memory ───────────────────────────


@pytest.fixture(scope="module")
def app_and_db():
    """App FastAPI mínima con course_routes montado y BD SQLite in-memory."""
    from database import Base, get_db  # type: ignore
    from course_routes import router as course_router  # type: ignore

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
def client_with_course(app_and_db):
    """Retorna (client, headers, course_id, db) con usuario, curso y quiz listos."""
    from database import Course, CourseQuiz, User, UserCourseProgress, gen_id  # type: ignore
    from sqlalchemy import func

    app, SessionLocal = app_and_db
    db = SessionLocal()

    # Crear usuario de prueba
    max_num = db.query(func.max(User.user_number)).scalar() or 0
    user = User(
        id=gen_id(),
        email=f"c3test_{gen_id()}@conniku.com",
        username=f"c3user_{gen_id()}",
        user_number=max_num + 1,
        first_name="C3",
        last_name="Tester",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-01-01",
        created_at=datetime.utcnow(),
    )
    db.add(user)

    # Crear curso
    course = Course(
        id=gen_id(),
        title="Curso Test C3",
        description="Para tests de seguridad",
    )
    db.add(course)

    # Crear CourseQuiz con 3 preguntas reales
    quiz_questions = json.dumps(
        [
            {"question": "P1", "correctAnswer": "A", "explanation": "Explicacion 1", "options": ["A", "B", "C"]},
            {"question": "P2", "correctAnswer": "B", "explanation": "Explicacion 2", "options": ["A", "B", "C"]},
            {"question": "P3", "correctAnswer": "C", "explanation": "Explicacion 3", "options": ["A", "B", "C"]},
        ]
    )
    quiz = CourseQuiz(
        id=gen_id(),
        course_id=course.id,
        questions=quiz_questions,
    )
    db.add(quiz)

    # Crear UserCourseProgress con al menos 1 lección completada
    # (requisito de get_exercises, pero submit_exercises también lo podría revisar)
    progress = UserCourseProgress(
        id=gen_id(),
        user_id=user.id,
        course_id=course.id,
        completed_lessons=json.dumps(["lesson-001"]),
    )
    db.add(progress)
    db.commit()
    db.refresh(user)
    db.refresh(course)

    # Crear JWT válido
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
        yield client, headers, course.id, user.id, db

    db.close()


# ─── Test 1: atacante envía correctAnswer manipulado ───────────────


def test_atacante_con_correct_answer_manipulado_obtiene_score_real(
    client_with_course,
) -> None:
    """TRAMPA: cliente envía correctAnswer="TRAMPA" pero responde "TRAMPA".

    Con el código vulnerado, score=100 porque servidor confía en cliente.
    Con el fix (Opción B), el servidor consulta BD donde correctAnswer="A",
    y "TRAMPA" != "A", por lo que score=0.

    ESTADO ESPERADO EN RED: FALLA (score=100 en lugar de 0).
    ESTADO ESPERADO EN GREEN: PASA (score=0).
    """
    client, headers, course_id, user_id, db = client_with_course

    payload = {
        "questions": [
            {"question": "P1", "correctAnswer": "TRAMPA", "explanation": ""},
        ],
        "answers": {"0": "TRAMPA"},
    }

    resp = client.post(
        f"/courses/{course_id}/exercises/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    # El score debe ser 0: "TRAMPA" no es la respuesta correcta real
    assert data["score"] == 0, (
        f"VULNERABILIDAD C3 ACTIVA: server confió en correctAnswer del cliente. score={data['score']}, expected=0"
    )
    assert data["correct"] == 0
    assert data["results"][0]["isCorrect"] is False
    # El servidor debe devolver la correctAnswer REAL (de BD), no la del cliente
    assert data["results"][0]["correctAnswer"] == "A", (
        f"Servidor debería devolver correctAnswer real='A', got={data['results'][0]['correctAnswer']!r}"
    )


# ─── Test 2: servidor ignora correctAnswer del cliente aunque sea erróneo ──


def test_servidor_ignora_correct_answer_del_cliente(
    client_with_course,
) -> None:
    """El cliente envía correctAnswer="B" (incorrecto), pero el usuario responde "A" (correcto).

    Con el código vulnerado, score=0 porque servidor compara "A" con "B".
    Con el fix, el servidor consulta BD donde correctAnswer="A", y score=100.

    Nota: en el código ACTUAL (pre-fix), este test también podría FALLAR
    porque el servidor haría user_answer("A") == q.get("correctAnswer")("B") = False.
    Así que el código actual da score=0, y el test espera 100. → RED correcto.
    """
    client, headers, course_id, user_id, db = client_with_course

    payload = {
        "questions": [
            # Cliente envía correctAnswer="B" (mentira), pero la real en BD es "A"
            {"question": "P1", "correctAnswer": "B", "explanation": ""},
        ],
        "answers": {"0": "A"},  # Usuario respondió "A" — la respuesta REAL correcta
    }

    resp = client.post(
        f"/courses/{course_id}/exercises/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    # El score debe ser 100: "A" es la respuesta correcta real en BD
    assert data["score"] == 100, f"Con fix Opción B, server debe validar contra BD. score={data['score']}, expected=100"
    assert data["correct"] == 1
    assert data["results"][0]["isCorrect"] is True


# ─── Test 3: pregunta inventada marca como inválida ────────────────


def test_pregunta_no_existe_en_bd_marca_invalida(
    client_with_course,
) -> None:
    """Cliente envía una pregunta que NO existe en CourseQuiz.questions de BD.

    El servidor debe:
    - Marcar is_correct=False (no cuenta)
    - Devolver correctAnswer=None
    - No insertar en UserExerciseHistory (pregunta ilegítima)
    - Score=0
    """
    client, headers, course_id, user_id, db = client_with_course

    payload = {
        "questions": [
            {
                "question": "PREGUNTA_INVENTADA_QUE_NO_EXISTE_EN_BD",
                "correctAnswer": "X",
                "explanation": "",
            },
        ],
        "answers": {"0": "X"},
    }

    resp = client.post(
        f"/courses/{course_id}/exercises/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["score"] == 0
    assert data["results"][0]["isCorrect"] is False
    # correctAnswer debe ser None (no existe en BD)
    assert data["results"][0]["correctAnswer"] is None, (
        f"Para pregunta inexistente, correctAnswer debe ser None, got={data['results'][0]['correctAnswer']!r}"
    )

    # Verificar que NO se insertó en UserExerciseHistory
    import hashlib
    from database import UserExerciseHistory  # type: ignore

    q_hash = hashlib.sha256("PREGUNTA_INVENTADA_QUE_NO_EXISTE_EN_BD".strip().lower().encode()).hexdigest()
    history_row = (
        db.query(UserExerciseHistory)
        .filter(
            UserExerciseHistory.user_id == user_id,
            UserExerciseHistory.course_id == course_id,
            UserExerciseHistory.question_hash == q_hash,
        )
        .first()
    )
    assert history_row is None, "Pregunta inventada NO debe registrarse en UserExerciseHistory"


# ─── Test 4: flujo legítimo completo ──────────────────────────────


def test_flujo_legitimo_score_correcto(
    client_with_course,
) -> None:
    """Flujo normal: usuario responde con las preguntas reales tal como las recibió.

    El cliente envía correctAnswer real (como lo devuelve get_exercises),
    y el usuario responde correctamente 2/3.

    NOTA (I2 del plan): este test puede PASAR en RED si el código actual
    ya funciona bien para el flujo legítimo. Es test de regresión, no de bug.
    Si pasa en RED, se documenta — no es error del test.

    THEN:
    - score = 67 (2/3 redondeado)
    - correct = 2
    - total = 3
    - xpAwarded = 10
    - 3 filas en UserExerciseHistory (was_correct: True, True, False)
    """
    client, headers, course_id, user_id, db = client_with_course

    payload = {
        # El cliente envía las preguntas exactamente como las recibió de get_exercises
        # (correctAnswer correcto, tal como está en BD)
        "questions": [
            {"question": "P1", "correctAnswer": "A", "explanation": "Explicacion 1"},
            {"question": "P2", "correctAnswer": "B", "explanation": "Explicacion 2"},
            {"question": "P3", "correctAnswer": "C", "explanation": "Explicacion 3"},
        ],
        "answers": {
            "0": "A",  # correcto
            "1": "B",  # correcto
            "2": "WRONG",  # incorrecto
        },
    }

    resp = client.post(
        f"/courses/{course_id}/exercises/submit",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["score"] == 67, f"score={data['score']}, expected=67"
    assert data["correct"] == 2
    assert data["total"] == 3
    assert data["xpAwarded"] == 10

    # Verificar 3 filas en UserExerciseHistory
    from database import UserExerciseHistory  # type: ignore

    history = (
        db.query(UserExerciseHistory)
        .filter(
            UserExerciseHistory.user_id == user_id,
            UserExerciseHistory.course_id == course_id,
        )
        .all()
    )
    # Nota: tests anteriores pudieron insertar filas para P1. Filtramos.
    import hashlib

    hashes_flujo = {hashlib.sha256(q.strip().lower().encode()).hexdigest() for q in ["P1", "P2", "P3"]}
    rows_flujo = [r for r in history if r.question_hash in hashes_flujo]
    assert len(rows_flujo) == 3, (
        f"Deben existir 3 filas en UserExerciseHistory para P1/P2/P3, encontradas={len(rows_flujo)}"
    )

    correctness = {r.question_hash: r.was_correct for r in rows_flujo}
    hash_p1 = hashlib.sha256(b"p1").hexdigest()
    hash_p2 = hashlib.sha256(b"p2").hexdigest()
    hash_p3 = hashlib.sha256(b"p3").hexdigest()

    assert correctness[hash_p1] is True, "P1 debe ser was_correct=True"
    assert correctness[hash_p2] is True, "P2 debe ser was_correct=True"
    assert correctness[hash_p3] is False, "P3 debe ser was_correct=False"
