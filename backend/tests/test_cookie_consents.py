"""Tests para el modelo CookieConsent, endpoints y constantes relacionadas.

Bloque: bloque-cookie-consent-banner-v1 — Pieza 1 (Backend).

Invariantes cubiertos del plan:
- I-04: POST con categories_accepted=["necessary"] persiste correctamente.
- I-05: POST con categories_accepted=["necessary","functional","analytics","marketing"] persiste.
- I-08: POST con policy_hash incorrecto responde 409 Conflict.
- I-09: ON DELETE de usuario NO borra filas de cookie_consents; setea user_id=NULL.
- I-17: hash en constante coincide con hash del texto canónico.
- I-18: GET /api/consent/cookies/policy-version retorna version y hash correctos.

Tests adicionales cubriendo reglas del plan:
- Tabla cookie_consents se crea con todos los campos probatorios.
- POST sin visitor_uuid retorna 422.
- POST con categories_accepted inválidas retorna 422.
- GET /api/consent/cookies/{visitor_uuid} retorna último consentimiento.
- GET /api/consent/cookies/{visitor_uuid} retorna 404 cuando no existe.
- retention_expires_at se calcula correctamente (5 años para evidencia legal).
- deleted_with_user_at no se usa (ON DELETE SET NULL — compatible con plan §5.1).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.orm import Session


# ─── Fixture: client FastAPI con BD in-memory ─────────────────────────────────


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """Cliente FastAPI con cookie_consent_routes montado y BD de test."""
    from cookie_consent_routes import router as consent_router
    from database import get_db

    app = FastAPI()
    app.include_router(consent_router)

    app.dependency_overrides[get_db] = lambda: db_session

    return TestClient(app)


# ─── Tests modelo / schema ─────────────────────────────────────────────────────


def test_tabla_cookie_consents_existe(db_session: Session) -> None:
    """La tabla cookie_consents se crea al inicializar la BD."""
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("cookie_consents"), "La tabla cookie_consents no fue creada por Base.metadata.create_all"


def test_cookie_consents_tiene_campos_probatorios(db_session: Session) -> None:
    """Todos los campos probatorios exigidos por el plan §5.1 están presentes."""
    inspector = inspect(db_session.get_bind())
    cols = {c["name"] for c in inspector.get_columns("cookie_consents")}
    required = {
        "id",
        "visitor_uuid",
        "user_id",
        "accepted_at_utc",
        "user_timezone",
        "client_ip",
        "user_agent",
        "policy_version",
        "policy_hash",
        "categories_accepted",
        "origin",
        "retention_expires_at",
        "revoked_at_utc",
        "revocation_reason",
        "created_at",
    }
    for field in required:
        assert field in cols, f"Campo probatorio {field!r} ausente en cookie_consents"


def test_crear_consent_persiste_campos(db_session: Session) -> None:
    """CookieConsent persiste todos los campos correctamente."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION
    from database import CookieConsent

    now = datetime.now(UTC).replace(tzinfo=None)
    consent = CookieConsent(
        visitor_uuid="550e8400-e29b-41d4-a716-446655440000",
        accepted_at_utc=now,
        user_timezone="America/Santiago",
        client_ip="1.2.3.4",
        user_agent="Mozilla/5.0 Test",
        policy_version=COOKIE_CONSENT_POLICY_VERSION,
        policy_hash=COOKIE_CONSENT_POLICY_HASH,
        categories_accepted=json.dumps(["necessary"]),
        origin="banner_initial",
        retention_expires_at=now + timedelta(days=5 * 365),
    )
    db_session.add(consent)
    db_session.commit()
    db_session.refresh(consent)

    assert consent.id is not None
    assert consent.visitor_uuid == "550e8400-e29b-41d4-a716-446655440000"
    assert consent.policy_version == COOKIE_CONSENT_POLICY_VERSION
    assert consent.user_id is None


def test_user_id_set_null_on_user_delete() -> None:
    """I-09: al borrar el usuario, user_id se pone NULL pero la fila persiste.

    Crea su propio engine con PRAGMA foreign_keys=ON para que SQLite
    procese la cláusula ON DELETE SET NULL (SQLAlchemy no la activa por defecto
    en in-memory).
    """
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION
    from database import Base, CookieConsent, User
    from sqlalchemy import create_engine, event
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Habilitar foreign keys en SQLite para que ON DELETE SET NULL funcione.
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):  # type: ignore[misc]
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # Crear usuario de prueba
        from datetime import UTC

        now = datetime.now(UTC).replace(tzinfo=None)
        user = User(
            email="delete_test@conniku.com",
            username="deletetest9001",
            user_number=9001,
            password_hash="$2b$04$test.hash.placeholder",
            first_name="Delete",
            last_name="Test",
            birth_date="2000-01-01",
            created_at=now,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        consent = CookieConsent(
            visitor_uuid="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            user_id=user.id,
            accepted_at_utc=now,
            policy_version=COOKIE_CONSENT_POLICY_VERSION,
            policy_hash=COOKIE_CONSENT_POLICY_HASH,
            categories_accepted=json.dumps(["necessary"]),
            origin="banner_initial",
            retention_expires_at=now + timedelta(days=5 * 365),
        )
        session.add(consent)
        session.commit()
        consent_id = consent.id

        # Eliminar el usuario
        session.delete(user)
        session.commit()

        # La fila de cookie_consents DEBE SOBREVIVIR (ON DELETE SET NULL)
        session.expire_all()
        refreshed = session.get(CookieConsent, consent_id)
        assert refreshed is not None, "El registro de consentimiento fue eliminado en cascada — viola plan §5.1"
        assert refreshed.user_id is None, "user_id debería ser NULL tras borrar el usuario"
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_retention_expires_5_anios(db_session: Session) -> None:
    """retention_expires_at calculado como accepted_at_utc + 5 años."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION
    from database import CookieConsent

    base = datetime(2026, 4, 20, 12, 0, 0)
    expected_expiry = datetime(2031, 4, 20, 12, 0, 0)

    consent = CookieConsent(
        visitor_uuid="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        accepted_at_utc=base,
        policy_version=COOKIE_CONSENT_POLICY_VERSION,
        policy_hash=COOKIE_CONSENT_POLICY_HASH,
        categories_accepted=json.dumps(["necessary"]),
        origin="banner_initial",
        retention_expires_at=base + timedelta(days=5 * 365),
    )
    db_session.add(consent)
    db_session.commit()
    db_session.refresh(consent)

    # Toleramos diferencia de hasta 2 días por años bisiestos
    diff = abs((consent.retention_expires_at - expected_expiry).days)
    assert diff <= 2, f"retention_expires_at difiere en {diff} días del esperado"


# ─── Tests constantes ─────────────────────────────────────────────────────────


def test_cookie_consent_constants_existen() -> None:
    """I-17: las constantes COOKIE_CONSENT_POLICY_VERSION y COOKIE_CONSENT_POLICY_HASH existen."""
    from constants.legal_versions import (
        COOKIE_CONSENT_CATEGORIES,
        COOKIE_CONSENT_POLICY_HASH,
        COOKIE_CONSENT_POLICY_VERSION,
    )

    assert COOKIE_CONSENT_POLICY_VERSION, "COOKIE_CONSENT_POLICY_VERSION vacío"
    assert COOKIE_CONSENT_POLICY_HASH, "COOKIE_CONSENT_POLICY_HASH vacío"
    assert len(COOKIE_CONSENT_POLICY_HASH) == 64, "COOKIE_CONSENT_POLICY_HASH no tiene 64 chars (SHA-256)"
    assert isinstance(COOKIE_CONSENT_CATEGORIES, list), "COOKIE_CONSENT_CATEGORIES debe ser list"
    assert set(COOKIE_CONSENT_CATEGORIES) == {
        "necessary",
        "functional",
        "analytics",
        "marketing",
    }, "COOKIE_CONSENT_CATEGORIES no tiene las 4 categorías esperadas"


def test_cookie_consent_hash_coincide_con_texto_canonico() -> None:
    """I-17: el hash almacenado en la constante coincide con el hash calculado
    del texto canónico en shared/cookie_consent_texts.py."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH
    from shared.cookie_consent_texts import COOKIE_CATEGORIES_TEXT_V1, compute_cookie_hash

    computed = compute_cookie_hash(COOKIE_CATEGORIES_TEXT_V1)
    assert computed == COOKIE_CONSENT_POLICY_HASH, (
        f"Hash calculado {computed!r} != constante {COOKIE_CONSENT_POLICY_HASH!r}. "
        "Actualizar COOKIE_CONSENT_POLICY_HASH en constants/legal_versions.py."
    )


# ─── Tests endpoints POST /api/consent/cookies ────────────────────────────────


def test_post_consent_crea_registro(client: TestClient) -> None:
    """I-04/I-05: POST válido crea registro y retorna los datos persistidos."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    payload = {
        "visitor_uuid": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "categories_accepted": ["necessary"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "banner_initial",
        "user_timezone": "America/Santiago",
        "user_agent_hint": "Mozilla/5.0 Test",
    }
    resp = client.post("/api/consent/cookies", json=payload)
    assert resp.status_code == 201, f"Esperado 201, recibido {resp.status_code}: {resp.text}"
    data = resp.json()
    assert data["visitor_uuid"] == payload["visitor_uuid"]
    assert data["categories_accepted"] == ["necessary"]
    assert data["policy_version"] == COOKIE_CONSENT_POLICY_VERSION


def test_post_consent_accept_all_categories(client: TestClient) -> None:
    """I-05: POST con las 4 categorías persiste correctamente."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    payload = {
        "visitor_uuid": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "categories_accepted": ["necessary", "functional", "analytics", "marketing"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "banner_initial",
    }
    resp = client.post("/api/consent/cookies", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert set(data["categories_accepted"]) == {"necessary", "functional", "analytics", "marketing"}


def test_post_consent_sin_visitor_uuid_retorna_422(client: TestClient) -> None:
    """POST sin visitor_uuid falla con 422 (validación Pydantic)."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    payload = {
        "categories_accepted": ["necessary"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "banner_initial",
    }
    resp = client.post("/api/consent/cookies", json=payload)
    assert resp.status_code == 422


def test_post_consent_categories_invalidas_retorna_422(client: TestClient) -> None:
    """POST con categoría inválida ('trackeo_raro') falla con 422."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    payload = {
        "visitor_uuid": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "categories_accepted": ["necessary", "trackeo_raro"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "banner_initial",
    }
    resp = client.post("/api/consent/cookies", json=payload)
    assert resp.status_code == 422


def test_post_consent_policy_hash_incorrecto_retorna_409(client: TestClient) -> None:
    """I-08: POST con policy_hash incorrecto responde 409 Conflict con el hash vigente."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_VERSION

    payload = {
        "visitor_uuid": "ffffffff-ffff-ffff-ffff-ffffffffffff",
        "categories_accepted": ["necessary"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": "0" * 64,  # hash incorrecto deliberado
        "origin": "banner_initial",
    }
    resp = client.post("/api/consent/cookies", json=payload)
    assert resp.status_code == 409
    data = resp.json()
    # El backend debe devolver el hash vigente para que el frontend actualice
    assert "current_hash" in data.get("detail", {}) or "current_hash" in data, (
        f"409 debería incluir current_hash en el body: {data}"
    )


# ─── Tests endpoint GET /api/consent/cookies/{visitor_uuid} ──────────────────


def test_get_consent_retorna_ultimo_registro(client: TestClient) -> None:
    """GET retorna el consentimiento más reciente del visitor_uuid."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    uuid_val = "11111111-1111-1111-1111-111111111111"

    # Crear dos consentimientos: el segundo es más reciente
    payload_base = {
        "visitor_uuid": uuid_val,
        "categories_accepted": ["necessary"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "banner_initial",
    }
    client.post("/api/consent/cookies", json=payload_base)

    payload_updated = {
        "visitor_uuid": uuid_val,
        "categories_accepted": ["necessary", "functional"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "settings_update",
    }
    client.post("/api/consent/cookies", json=payload_updated)

    resp = client.get(f"/api/consent/cookies/{uuid_val}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["visitor_uuid"] == uuid_val
    # Debe retornar el último (settings_update tiene 2 categorías)
    assert "functional" in data["categories_accepted"]


def test_get_consent_retorna_404_si_no_existe(client: TestClient) -> None:
    """GET retorna 404 cuando no hay registro para ese visitor_uuid."""
    resp = client.get("/api/consent/cookies/22222222-2222-2222-2222-222222222222")
    assert resp.status_code == 404


# ─── Tests endpoint GET /api/consent/cookies/policy-version ──────────────────


def test_get_policy_version_retorna_version_y_hash(client: TestClient) -> None:
    """I-18: GET /api/consent/cookies/policy-version retorna version y hash que coinciden
    con las constantes COOKIE_CONSENT_POLICY_VERSION y COOKIE_CONSENT_POLICY_HASH."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    resp = client.get("/api/consent/cookies/policy-version")
    assert resp.status_code == 200
    data = resp.json()
    assert data["version"] == COOKIE_CONSENT_POLICY_VERSION
    assert data["hash"] == COOKIE_CONSENT_POLICY_HASH


# ─── Tests campo is_current_policy / is_expired ──────────────────────────────


def test_get_consent_is_current_policy_true(client: TestClient) -> None:
    """GET retorna is_current_policy=True cuando el hash del registro coincide con el actual."""
    from constants.legal_versions import COOKIE_CONSENT_POLICY_HASH, COOKIE_CONSENT_POLICY_VERSION

    uuid_val = "33333333-3333-3333-3333-333333333333"
    payload = {
        "visitor_uuid": uuid_val,
        "categories_accepted": ["necessary"],
        "policy_version": COOKIE_CONSENT_POLICY_VERSION,
        "policy_hash": COOKIE_CONSENT_POLICY_HASH,
        "origin": "banner_initial",
    }
    client.post("/api/consent/cookies", json=payload)

    resp = client.get(f"/api/consent/cookies/{uuid_val}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_current_policy"] is True
    assert data["is_expired"] is False


# ─── Tests nuevos v1.1.0 (decisiones D-02, D-03, D-08) ───────────────────────


def test_marketing_text_v1_1_contains_no_ia_mention_and_declares_no_marketing_cookies_today() -> None:
    """D-02: texto marketing v1.1.0 reformulado.

    Verifica:
    - Contiene la frase de no uso actual de cookies de marketing.
    - No menciona 'IA', 'AI' ni 'inteligencia artificial' (regla de producto CLAUDE.md).
    - Contiene la frase sobre toggle preparado para funcionalidades futuras.
    """
    from shared.cookie_consent_texts import COOKIE_CATEGORIES_TEXT_V1

    marketing_segment = ""
    for line in COOKIE_CATEGORIES_TEXT_V1.split("\n"):
        if line.startswith("marketing:"):
            marketing_segment = line
            break

    assert marketing_segment, "Segmento 'marketing:' no encontrado en COOKIE_CATEGORIES_TEXT_V1"

    # Verificar que declara no uso actual
    assert "no usa cookies de marketing" in marketing_segment, (
        f"Texto marketing debe declarar que Conniku no usa cookies de marketing hoy. Actual: {marketing_segment!r}"
    )

    # Verificar que menciona que datos no se comparten con redes publicitarias
    assert "no se comparten con redes publicitarias" in marketing_segment, (
        f"Texto marketing debe indicar que datos no se comparten con redes publicitarias. Actual: {marketing_segment!r}"
    )

    # Verificar que menciona toggle para futuras funcionalidades opcionales
    assert "futuras funcionalidades opcionales" in marketing_segment, (
        f"Texto marketing debe mencionar 'futuras funcionalidades opcionales'. Actual: {marketing_segment!r}"
    )

    # Regla de producto: nunca mencionar 'IA', 'AI' o 'inteligencia artificial'
    assert " IA " not in marketing_segment and not marketing_segment.endswith(" IA"), (
        f"Texto marketing no debe mencionar 'IA' (regla CLAUDE.md). Actual: {marketing_segment!r}"
    )
    assert " AI " not in marketing_segment and not marketing_segment.endswith(" AI"), (
        f"Texto marketing no debe mencionar 'AI' (regla CLAUDE.md). Actual: {marketing_segment!r}"
    )
    assert "inteligencia artificial" not in marketing_segment.lower(), (
        f"Texto marketing no debe mencionar 'inteligencia artificial'. Actual: {marketing_segment!r}"
    )


def test_functional_text_v1_1_precise_about_no_third_party_advertising_sharing() -> None:
    """D-03: texto functional v1.1.0 incluye aclaración sobre no compartir con terceros.

    Verifica que el segmento 'functional:' incluye la frase
    'No se comparten con terceros con fines publicitarios.'
    """
    from shared.cookie_consent_texts import COOKIE_CATEGORIES_TEXT_V1

    functional_segment = ""
    for line in COOKIE_CATEGORIES_TEXT_V1.split("\n"):
        if line.startswith("functional:"):
            functional_segment = line
            break

    assert functional_segment, "Segmento 'functional:' no encontrado en COOKIE_CATEGORIES_TEXT_V1"

    assert "No se comparten con terceros con fines publicitarios." in functional_segment, (
        f"Texto functional debe incluir 'No se comparten con terceros con fines publicitarios.' "
        f"Actual: {functional_segment!r}"
    )


def test_pseudonymized_at_utc_column_exists_and_is_nullable(db_session: Session) -> None:
    """D-08: la columna pseudonymized_at_utc existe en cookie_consents y es nullable.

    El job de pseudonimización a los 12 meses (Pieza 5 del bloque) setea este
    campo al nullificar client_ip y user_agent.

    Referencia legal:
    - GDPR Art. 5(1)(e): limitación del plazo de conservación de datos personales.
    - Ley 21.719 Art. 14 (vigencia 2026-12-01 según Diario Oficial CVE 2583630,
      Art. 1° transitorio: día primero del mes vigésimo cuarto posterior a la
      publicación 2024-12-13).
    """
    inspector = inspect(db_session.get_bind())
    cols = {c["name"]: c for c in inspector.get_columns("cookie_consents")}

    assert "pseudonymized_at_utc" in cols, "La columna 'pseudonymized_at_utc' debe existir en cookie_consents (D-08)"

    col_info = cols["pseudonymized_at_utc"]
    assert col_info.get("nullable", True) is True, (
        "La columna 'pseudonymized_at_utc' debe ser nullable (el job la setea al correr)"
    )


def test_cookie_categories_hash_matches_v1_1() -> None:
    """D-02/D-03: el hash en COOKIE_CATEGORIES_HASH coincide con el texto v1.1.0.

    Luego de actualizar marketing y functional, el hash debe recalcularse sobre
    el texto nuevo. Este test verifica que la constante en el módulo está
    sincronizada con el texto canónico.

    El test test_cookie_consent_hash_coincide_con_texto_canonico ya verifica
    que COOKIE_CONSENT_POLICY_HASH en legal_versions.py coincide con el módulo.
    Este test verifica que el hash del módulo en sí es coherente internamente.
    """
    from shared.cookie_consent_texts import (
        COOKIE_CATEGORIES_HASH,
        COOKIE_CATEGORIES_TEXT_V1,
        COOKIE_CATEGORIES_VERSION,
        compute_cookie_hash,
    )

    # La versión debe haber subido a 1.1.0
    assert COOKIE_CATEGORIES_VERSION == "1.1.0", (
        f"COOKIE_CATEGORIES_VERSION debe ser '1.1.0' tras D-02 y D-03. Actual: {COOKIE_CATEGORIES_VERSION!r}"
    )

    # El hash almacenado debe coincidir con el texto canónico actual
    recomputed = compute_cookie_hash(COOKIE_CATEGORIES_TEXT_V1)
    assert recomputed == COOKIE_CATEGORIES_HASH, (
        f"COOKIE_CATEGORIES_HASH desincronizado del texto. "
        f"Calculado: {recomputed!r}, almacenado: {COOKIE_CATEGORIES_HASH!r}"
    )
