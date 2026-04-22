"""Tests para el endpoint de feedback de soporte — bloque-sandbox-integrity-v1.

Decisiones aplicadas:
- D-S5=A: botones por FAQ con textarea opcional al hacer click en 👎.
- D-S6=A: retención 2 años + pseudonimización a 12 meses (GDPR Art. 5(1)(e)).

Referencia legal:
- GDPR Art. 6(1)(f): interés legítimo para procesar IP/UA con fines de seguridad y
  mejora del servicio.
  URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
- GDPR Art. 5(1)(c): minimización — comment max 2000 chars, UA truncado a 512.
- Ley 19.628 Art. 4° Chile: información al titular al momento de recolectar.
  URL: https://www.bcn.cl/leychile/navegar?idNorma=141599
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.orm import Session


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """Cliente FastAPI con support_feedback_routes montado y BD de test."""
    from database import get_db
    from support_feedback_routes import router as feedback_router

    app = FastAPI()
    app.include_router(feedback_router)

    app.dependency_overrides[get_db] = lambda: db_session

    return TestClient(app)


@pytest.fixture
def admin_client(db_session: Session) -> TestClient:
    """Cliente FastAPI con soporte a autenticación admin mockeada."""
    from database import User, get_db
    from middleware import require_admin
    from support_feedback_routes import router as feedback_router

    # Crear admin en BD
    admin = User(
        email="admin_sf_test@conniku.com",
        username="admin_sf_test",
        user_number=88001,
        password_hash="$2b$04$test.hash.placeholder",
        first_name="Admin",
        last_name="SF",
        birth_date="1990-01-01",
        is_admin=True,
        created_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    app = FastAPI()
    app.include_router(feedback_router)

    app.dependency_overrides[get_db] = lambda: db_session
    # Override require_admin para siempre retornar el admin creado
    app.dependency_overrides[require_admin] = lambda: admin

    return TestClient(app)


# ─── Tests de schema ──────────────────────────────────────────────────────────


def test_tabla_existe(db_session: Session) -> None:
    """La tabla support_feedback se crea al inicializar la BD."""
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("support_feedback"), (
        "La tabla support_feedback no fue creada por Base.metadata.create_all"
    )


def test_campos_probatorios(db_session: Session) -> None:
    """Todos los 11 campos del schema D-S6 están presentes en la tabla."""
    inspector = inspect(db_session.get_bind())
    cols = {c["name"] for c in inspector.get_columns("support_feedback")}
    required = {
        "id",
        "faq_id",
        "useful",
        "comment",
        "session_token",
        "user_id",
        "ip_address",
        "user_agent",
        "created_at",
        "pseudonymized_at_utc",
        "retained_until_utc",
    }
    for field in required:
        assert field in cols, f"Campo {field!r} ausente en support_feedback"


# ─── Tests endpoint POST /support/feedback ────────────────────────────────────


def test_post_feedback_crea_fila(client: TestClient, db_session: Session) -> None:
    """POST válido crea fila en support_feedback y retorna 201 con id y created_at."""
    from database import SupportFeedback

    payload = {
        "faq_id": "pwd-recovery",
        "useful": True,
        "comment": None,
        "session_token": None,
    }
    resp = client.post("/support/feedback", json=payload)
    assert resp.status_code == 201, f"Esperado 201, recibido {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "id" in data
    assert "created_at" in data

    # Verificar fila en BD
    row = db_session.query(SupportFeedback).filter(SupportFeedback.faq_id == "pwd-recovery").first()
    assert row is not None, "No se creó la fila en support_feedback"
    assert row.useful is True


def test_post_feedback_rate_limit_20_por_hora(db_session: Session) -> None:
    """POST desde la misma IP debe retornar 429 al superar 20 solicitudes por hora.

    Este test instancia la app directamente para inyectar IP constante desde
    el mismo request context.
    """
    from database import get_db
    from support_feedback_routes import router as feedback_router

    app = FastAPI()
    app.include_router(feedback_router)
    app.dependency_overrides[get_db] = lambda: db_session

    c = TestClient(app, headers={"X-Forwarded-For": "10.0.0.1"})

    payload = {
        "faq_id": "rate-limit-test",
        "useful": True,
    }

    # 20 primeras deben pasar (límite es 20 por hora)
    for i in range(20):
        resp = c.post("/support/feedback", json={**payload, "faq_id": f"rate-test-{i}"})
        assert resp.status_code == 201, f"Request {i + 1} falló: {resp.status_code} {resp.text}"

    # La 21ª debe retornar 429
    resp = c.post("/support/feedback", json=payload)
    assert resp.status_code == 429, f"Esperado 429 al exceder rate-limit, recibido {resp.status_code}"


def test_post_feedback_comment_opcional(client: TestClient) -> None:
    """POST sin comment retorna 201 (campo opcional)."""
    payload = {
        "faq_id": "login-help",
        "useful": False,
    }
    resp = client.post("/support/feedback", json=payload)
    assert resp.status_code == 201, f"Esperado 201 sin comment, recibido {resp.status_code}: {resp.text}"


def test_post_feedback_comment_muy_largo_422(client: TestClient) -> None:
    """POST con comment de más de 2000 caracteres debe retornar 422."""
    payload = {
        "faq_id": "login-help",
        "useful": False,
        "comment": "x" * 2001,
    }
    resp = client.post("/support/feedback", json=payload)
    assert resp.status_code == 422, f"Esperado 422 con comment demasiado largo, recibido {resp.status_code}"


def test_post_feedback_useful_false_acepta(client: TestClient) -> None:
    """POST con useful=False retorna 201 (feedback negativo es válido)."""
    payload = {
        "faq_id": "payment-faq",
        "useful": False,
        "comment": "No encontré lo que buscaba",
    }
    resp = client.post("/support/feedback", json=payload)
    assert resp.status_code == 201, f"Esperado 201 con useful=False, recibido {resp.status_code}: {resp.text}"


def test_post_feedback_retained_until_2_anios(client: TestClient, db_session: Session) -> None:
    """retained_until_utc debe ser approximately created_at + 2 años (D-S6=A).

    Referencia legal:
    - GDPR Art. 5(1)(e): limitación del plazo de conservación.
    - GDPR Art. 5(1)(c): minimización — no retener más tiempo del necesario.
    """
    from database import SupportFeedback

    before = datetime.now(UTC).replace(tzinfo=None)
    payload = {
        "faq_id": "retention-test",
        "useful": True,
    }
    resp = client.post("/support/feedback", json=payload)
    assert resp.status_code == 201

    row = db_session.query(SupportFeedback).filter(SupportFeedback.faq_id == "retention-test").first()
    assert row is not None

    expected_min = before + timedelta(days=730)  # 2 años mínimo
    expected_max = before + timedelta(days=732)  # tolerancia 2 días por bisiestos

    assert row.retained_until_utc is not None, "retained_until_utc no debe ser NULL"
    assert row.retained_until_utc >= expected_min, (
        f"retained_until_utc {row.retained_until_utc} menor que mínimo esperado {expected_min}"
    )
    assert row.retained_until_utc <= expected_max, (
        f"retained_until_utc {row.retained_until_utc} mayor que máximo esperado {expected_max}"
    )


def test_post_feedback_faq_id_muy_largo_422(client: TestClient) -> None:
    """POST con faq_id de más de 128 caracteres debe retornar 422."""
    payload = {
        "faq_id": "x" * 129,
        "useful": True,
    }
    resp = client.post("/support/feedback", json=payload)
    assert resp.status_code == 422, f"Esperado 422 con faq_id demasiado largo, recibido {resp.status_code}"


# ─── Tests endpoint GET /admin/support/feedback/stats ─────────────────────────


def test_admin_stats_agrupa_por_faq(admin_client: TestClient, db_session: Session) -> None:
    """GET /admin/support/feedback/stats agrupa por faq_id con total, useful_count, useful_ratio."""
    from database import SupportFeedback

    now = datetime.now(UTC).replace(tzinfo=None)
    # 3 útiles + 2 no útiles para el mismo faq_id
    for _i in range(3):
        db_session.add(
            SupportFeedback(
                faq_id="stats-test-faq",
                useful=True,
                created_at=now,
                retained_until_utc=now + timedelta(days=730),
            )
        )
    for _i in range(2):
        db_session.add(
            SupportFeedback(
                faq_id="stats-test-faq",
                useful=False,
                created_at=now,
                retained_until_utc=now + timedelta(days=730),
            )
        )
    db_session.commit()

    resp = admin_client.get("/admin/support/feedback/stats")
    assert resp.status_code == 200, f"Esperado 200, recibido {resp.status_code}: {resp.text}"
    data = resp.json()

    # Encontrar el item del faq_id de prueba
    item = next((x for x in data["items"] if x["faq_id"] == "stats-test-faq"), None)
    assert item is not None, "stats-test-faq no apareció en la respuesta"
    assert item["total"] == 5
    assert item["useful_count"] == 3
    assert abs(item["useful_ratio"] - 0.6) < 0.01


def test_admin_stats_requiere_auth(client: TestClient) -> None:
    """GET /admin/support/feedback/stats sin auth debe retornar 401 o 403."""
    resp = client.get("/admin/support/feedback/stats")
    assert resp.status_code in (401, 403), (
        f"Esperado 401/403 sin auth, recibido {resp.status_code}"
    )


def test_admin_stats_filtros_fechas(admin_client: TestClient, db_session: Session) -> None:
    """GET /admin/support/feedback/stats con filtros date_from / date_to aplica el filtro."""
    from database import SupportFeedback

    old_date = datetime(2024, 1, 1, 0, 0, 0)
    new_date = datetime(2026, 4, 1, 0, 0, 0)

    db_session.add(
        SupportFeedback(
            faq_id="date-filter-faq",
            useful=True,
            created_at=old_date,
            retained_until_utc=old_date + timedelta(days=730),
        )
    )
    db_session.add(
        SupportFeedback(
            faq_id="date-filter-faq",
            useful=False,
            created_at=new_date,
            retained_until_utc=new_date + timedelta(days=730),
        )
    )
    db_session.commit()

    # Filtrar desde 2025-01-01: solo debe incluir el nuevo
    resp = admin_client.get("/admin/support/feedback/stats?date_from=2025-01-01T00:00:00")
    assert resp.status_code == 200

    data = resp.json()
    item = next((x for x in data["items"] if x["faq_id"] == "date-filter-faq"), None)
    assert item is not None, "date-filter-faq no apareció con filtro date_from"
    # Solo 1 fila (la de 2026)
    assert item["total"] == 1
    assert item["useful_count"] == 0


def test_admin_stats_non_admin_403(db_session: Session) -> None:
    """GET /admin/support/feedback/stats con JWT de usuario no-admin debe retornar 403."""
    from database import User, get_db
    from middleware import require_admin
    from support_feedback_routes import router as feedback_router

    # Crear usuario sin permisos admin
    regular_user = User(
        email="regular_sf_test@conniku.com",
        username="regular_sf_test",
        user_number=88002,
        password_hash="$2b$04$test.hash.placeholder",
        first_name="Regular",
        last_name="SF",
        birth_date="1990-01-01",
        is_admin=False,
        created_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db_session.add(regular_user)
    db_session.commit()
    db_session.refresh(regular_user)

    app = FastAPI()
    app.include_router(feedback_router)
    app.dependency_overrides[get_db] = lambda: db_session

    # require_admin lanza 403 cuando el usuario no es admin
    def mock_non_admin():  # type: ignore[return]
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol admin.")

    app.dependency_overrides[require_admin] = mock_non_admin

    c = TestClient(app)
    resp = c.get("/admin/support/feedback/stats")
    assert resp.status_code == 403, f"Esperado 403 para non-admin, recibido {resp.status_code}"
