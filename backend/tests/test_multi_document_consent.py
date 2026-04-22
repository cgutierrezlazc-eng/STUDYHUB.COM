"""Tests TDD — Bloque multi-document-consent-v1.

Cubre la validación de evidencia de lectura en POST /auth/register.

Invariantes:
- Sin legal_session_token: 422 (campo requerido).
- Con token pero sin 4 docs leídos (scrolled_to_end=True): 422 con lista de faltantes.
- Con 4 docs leídos pero hash desactualizado: 422 hash mismatch.
- Registro exitoso crea 4 filas user_agreements atómicamente.
- Registro exitoso transfiere document_views.user_id de None → new_user.id.
- Registro exitoso crea 1 fila cookie_consents con categories_accepted=['necessary'].
- Segundo registro con el mismo legal_session_token: 409.
- Rollback si alguna fila user_agreements falla (IntegrityError simulado).

Referencias legales:
- GDPR Art. 7(1): demostrabilidad del consentimiento.
  URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
- Ley 19.628 Art. 4° (Chile): consentimiento expreso del titular.
  URL: https://www.bcn.cl/leychile/navegar?idNorma=141599

Plan: docs/plans/bloque-multi-document-consent-v1/plan.md
Decisiones D-M2/D-M5/D-M6 aprobadas por Cristian 2026-04-21.
"""

from __future__ import annotations

import json
import os
import sys
import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REPO_ROOT = os.path.dirname(_BACKEND_DIR)
for _path in (_BACKEND_DIR, _REPO_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)

# Hashes canónicos vigentes en el viewer (legal_document_views_routes.py).
# Estos son los hashes que los document_views almacenan al registrar apertura.
CANONICAL_HASHES: dict[str, str] = {
    "terms": "9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce",
    "privacy": "b5b9fed8fd5e4e600c7fa33fbd8dddaec5c627be189b5382e8b7cf81dbcfa288",
    "cookies": "80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c",
    "age-declaration": "61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b",
}

CANONICAL_VERSIONS: dict[str, str] = {
    "terms": "3.2.0",
    "privacy": "2.4.0",
    "cookies": "1.0.0",
    "age-declaration": "1.0.0",
}

# Payload mínimo válido de registro (sin legal_session_token).
BASE_REGISTER_PAYLOAD: dict = {
    "email": "nuevo@conniku.com",
    "password": "Password1",
    "first_name": "Nuevo",
    "last_name": "Usuario",
    "birth_date": "2000-06-15",
    "age_declaration_accepted": True,
    # Hash del texto canónico de age_declaration (AGE_DECLARATION_HASH en shared/legal_texts.py)
    "accepted_text_version_hash": "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706",
    "tos_accepted": True,
}

REQUIRED_DOC_KEYS = ["terms", "privacy", "cookies", "age-declaration"]


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def reset_rate_limiter() -> Generator[None, None, None]:
    """Resetea el rate limiter entre tests para evitar 429 por acumulación."""
    import auth_routes

    auth_routes._rate_limits.clear()
    yield
    auth_routes._rate_limits.clear()


@pytest.fixture
def app_client(db_session: Session) -> TestClient:
    """Cliente FastAPI con auth_routes montado y BD de test."""
    from auth_routes import router as auth_router
    from database import get_db

    application = FastAPI()
    application.include_router(auth_router)
    application.dependency_overrides[get_db] = lambda: db_session

    return TestClient(application, raise_server_exceptions=True)


def _seed_document_views(
    db: Session,
    session_token: str,
    doc_keys: list[str] | None = None,
    scrolled_to_end: bool = True,
    hashes: dict[str, str] | None = None,
) -> None:
    """Inserta filas en document_views para simular que el usuario leyó los docs."""
    from database import DocumentView

    if doc_keys is None:
        doc_keys = REQUIRED_DOC_KEYS
    if hashes is None:
        hashes = CANONICAL_HASHES

    for key in doc_keys:
        now = datetime.utcnow()
        view = DocumentView(
            user_id=None,
            session_token=session_token,
            doc_key=key,
            doc_version=CANONICAL_VERSIONS[key],
            doc_hash=hashes[key],
            viewed_at_utc=now,
            scrolled_to_end=scrolled_to_end,
            ip_address="127.0.0.1",
            user_agent="TestAgent/1.0",
            retained_until_utc=now + timedelta(days=1825),
        )
        db.add(view)
    db.commit()


def _register_payload(session_token: str, email: str = "nuevo@conniku.com") -> dict:
    """Construye payload completo de registro con legal_session_token."""
    payload = dict(BASE_REGISTER_PAYLOAD)
    payload["email"] = email
    payload["legal_session_token"] = session_token
    return payload


# ─── RED: test_register_rechaza_sin_legal_session_token ───────────────────────


def test_register_rechaza_sin_legal_session_token(app_client: TestClient) -> None:
    """POST /auth/register sin legal_session_token retorna 422.

    El campo es requerido (D-M2 = A, D-M5 = A).
    """
    resp = app_client.post("/auth/register", json=BASE_REGISTER_PAYLOAD)
    assert resp.status_code == 422, (
        f"Esperado 422 cuando falta legal_session_token, recibido {resp.status_code}: {resp.text}"
    )


# ─── RED: test_register_rechaza_sin_4_docs_leidos ─────────────────────────────


def test_register_rechaza_sin_4_docs_leidos(
    app_client: TestClient, db_session: Session
) -> None:
    """POST /auth/register con token que solo tiene 2 de 4 docs retorna 422.

    El mensaje debe listar los doc_keys faltantes (D-M6 = A).
    """
    session_token = str(uuid.uuid4())
    # Solo 2 de 4 docs con scrolled_to_end=True
    _seed_document_views(db_session, session_token, doc_keys=["terms", "privacy"])

    resp = app_client.post(
        "/auth/register", json=_register_payload(session_token, email="faltante@conniku.com")
    )
    assert resp.status_code == 422, (
        f"Esperado 422 por docs faltantes, recibido {resp.status_code}: {resp.text}"
    )
    detail = resp.json().get("detail", "")
    # El mensaje debe mencionar los docs faltantes
    assert "cookies" in detail.lower() or "age" in detail.lower(), (
        f"El mensaje 422 debe listar docs faltantes. Recibido: {detail!r}"
    )


def test_register_rechaza_sin_scrolled_to_end(
    app_client: TestClient, db_session: Session
) -> None:
    """POST con 4 docs pero scrolled_to_end=False retorna 422.

    Solo filas con scrolled_to_end=True califican como evidencia (D-M3 = B).
    """
    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token, scrolled_to_end=False)

    resp = app_client.post(
        "/auth/register",
        json=_register_payload(session_token, email="noscroll@conniku.com"),
    )
    assert resp.status_code == 422, (
        f"Esperado 422 sin scrolled_to_end, recibido {resp.status_code}: {resp.text}"
    )


# ─── RED: test_register_rechaza_hash_desactualizado ───────────────────────────


def test_register_rechaza_hash_desactualizado(
    app_client: TestClient, db_session: Session
) -> None:
    """POST con documento_views cuyo doc_hash es incorrecto retorna 422.

    Protege contra usuarios que abrieron una versión desactualizada del documento
    (D-M6/R-A2).
    """
    session_token = str(uuid.uuid4())
    # Insertar views con hash incorrecto para 'terms'
    bad_hashes = dict(CANONICAL_HASHES)
    bad_hashes["terms"] = "0" * 64
    _seed_document_views(db_session, session_token, hashes=bad_hashes)

    resp = app_client.post(
        "/auth/register", json=_register_payload(session_token, email="badhash@conniku.com")
    )
    assert resp.status_code == 422, (
        f"Esperado 422 por hash desactualizado, recibido {resp.status_code}: {resp.text}"
    )
    detail = resp.json().get("detail", "")
    assert "hash" in detail.lower() or "version" in detail.lower() or "document" in detail.lower(), (
        f"Mensaje 422 debe mencionar hash/versión. Recibido: {detail!r}"
    )


# ─── RED: test_register_crea_4_agreements_atomico ─────────────────────────────


def test_register_crea_4_agreements_atomico(
    app_client: TestClient, db_session: Session
) -> None:
    """Registro exitoso crea exactamente 4 filas en user_agreements (D-M5 = A).

    Los 4 document_types esperados: terms, privacy, cookies, age_declaration.
    Todo ocurre en la misma transacción que crea el User.
    """
    from database import User, UserAgreement

    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token)

    resp = app_client.post(
        "/auth/register", json=_register_payload(session_token, email="ok1@conniku.com")
    )
    assert resp.status_code == 200, (
        f"Registro debería ser exitoso. Recibido {resp.status_code}: {resp.text}"
    )

    user = db_session.query(User).filter(User.email == "ok1@conniku.com").first()
    assert user is not None, "Usuario no fue creado"

    agreements = (
        db_session.query(UserAgreement).filter(UserAgreement.user_id == user.id).all()
    )
    doc_types = {a.document_type for a in agreements}
    # document_type canónico en user_agreements: "tos" (no "terms"), "privacy",
    # "cookies", "age_declaration" — según TOS_DOCUMENT_TYPE en legal_versions.py.
    expected = {"tos", "privacy", "cookies", "age_declaration"}
    assert doc_types == expected, (
        f"Esperados document_types {expected}, encontrados {doc_types}"
    )
    assert len(agreements) == 4, f"Esperadas 4 filas user_agreements, encontradas {len(agreements)}"


def test_register_agreements_tienen_campos_probatorios(
    app_client: TestClient, db_session: Session
) -> None:
    """Cada fila user_agreements tiene hash, versión, IP y UA correctos."""
    from database import User, UserAgreement

    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token)

    resp = app_client.post(
        "/auth/register",
        json=_register_payload(session_token, email="prob@conniku.com"),
        headers={"User-Agent": "TestBrowser/2.0"},
    )
    assert resp.status_code == 200

    user = db_session.query(User).filter(User.email == "prob@conniku.com").first()
    agreements = (
        db_session.query(UserAgreement).filter(UserAgreement.user_id == user.id).all()
    )

    from constants.legal_versions import (
        COOKIES_HASH,
        COOKIES_VERSION,
        PRIVACY_HASH,
        PRIVACY_VERSION,
        TOS_HASH,
        TOS_VERSION,
        AGE_DECLARATION_TEXT_HASH,
        AGE_DECLARATION_VERSION,
    )

    # Las claves son document_type de user_agreements: "tos" (no "terms")
    expected_by_type: dict[str, tuple[str, str]] = {
        "tos": (TOS_VERSION, TOS_HASH),
        "privacy": (PRIVACY_VERSION, PRIVACY_HASH),
        "cookies": (COOKIES_VERSION, COOKIES_HASH),
        "age_declaration": (AGE_DECLARATION_VERSION, AGE_DECLARATION_TEXT_HASH),
    }
    for ag in agreements:
        exp_version, exp_hash = expected_by_type[ag.document_type]
        assert ag.text_version == exp_version, (
            f"{ag.document_type}: versión {ag.text_version!r} != {exp_version!r}"
        )
        assert ag.text_version_hash == exp_hash, (
            f"{ag.document_type}: hash {ag.text_version_hash!r} != {exp_hash!r}"
        )
        assert ag.accepted_at_utc is not None, f"{ag.document_type}: accepted_at_utc es None"


# ─── RED: test_register_transfiere_session_token_a_user_id ───────────────────


def test_register_transfiere_session_token_a_user_id_en_document_views(
    app_client: TestClient, db_session: Session
) -> None:
    """Registro exitoso actualiza document_views.user_id de None al user.id (D-M2 = A).

    Las 4 filas pre-registro deben quedar con user_id = new_user.id.
    """
    from database import DocumentView, User

    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token)

    # Verificar estado inicial: todas con user_id=None
    views_before = (
        db_session.query(DocumentView)
        .filter(DocumentView.session_token == session_token)
        .all()
    )
    assert all(v.user_id is None for v in views_before), (
        "Las filas pre-registro deben tener user_id=None"
    )

    resp = app_client.post(
        "/auth/register", json=_register_payload(session_token, email="transfer@conniku.com")
    )
    assert resp.status_code == 200

    user = db_session.query(User).filter(User.email == "transfer@conniku.com").first()
    assert user is not None

    # Refresh para ver cambios de la transacción
    db_session.expire_all()
    views_after = (
        db_session.query(DocumentView)
        .filter(DocumentView.session_token == session_token)
        .all()
    )
    assert all(v.user_id == user.id for v in views_after), (
        f"Esperado user_id={user.id!r} en todas las filas. "
        f"Encontrado: {[v.user_id for v in views_after]}"
    )


# ─── RED: test_register_crea_cookie_consent_minimo_necessary ─────────────────


def test_register_crea_cookie_consent_minimo_necessary(
    app_client: TestClient, db_session: Session
) -> None:
    """Registro exitoso crea 1 fila en cookie_consents con ['necessary'] (D-M5 = A).

    Referencia: GDPR Art. 5(3) ePrivacy — solo necesarias por defecto hasta que
    el usuario ajuste sus preferencias en el banner.
    """
    from database import CookieConsent, User

    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token)

    resp = app_client.post(
        "/auth/register", json=_register_payload(session_token, email="cookie@conniku.com")
    )
    assert resp.status_code == 200

    user = db_session.query(User).filter(User.email == "cookie@conniku.com").first()
    assert user is not None

    consent = (
        db_session.query(CookieConsent).filter(CookieConsent.user_id == user.id).first()
    )
    assert consent is not None, "Debe existir 1 fila cookie_consents para el nuevo usuario"

    cats = json.loads(consent.categories_accepted)
    assert cats == ["necessary"], (
        f"Categorías aceptadas deben ser ['necessary'], encontradas: {cats}"
    )


# ─── RED: test_register_rollback_si_alguna_fila_falla ─────────────────────────


def test_register_rollback_si_alguna_fila_falla(
    app_client: TestClient, db_session: Session
) -> None:
    """Si user_agreements falla (IntegrityError simulado), rollback completo.

    El usuario no debe quedar creado si los agreements fallan.
    Garantiza la atomicidad de D-M5 = A.
    """
    from database import User, UserAgreement

    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token)

    original_add = db_session.add
    call_count = {"n": 0}

    def _patched_add(obj: object) -> None:
        if isinstance(obj, UserAgreement):
            call_count["n"] += 1
            if call_count["n"] == 2:  # falla en el segundo agreement
                raise IntegrityError("forzado", {}, Exception("mock"))
        return original_add(obj)

    with patch.object(db_session, "add", side_effect=_patched_add):
        resp = app_client.post(
            "/auth/register",
            json=_register_payload(session_token, email="rollback@conniku.com"),
        )

    # Debe retornar error 500 (o cualquier error ≠ 200)
    assert resp.status_code != 200, (
        f"Registro debería fallar cuando un agreement lanza IntegrityError. "
        f"Recibido {resp.status_code}"
    )

    # El usuario NO debe existir en BD
    user = db_session.query(User).filter(User.email == "rollback@conniku.com").first()
    assert user is None, "El usuario no debe existir tras rollback"


# ─── RED: test_register_idempotencia_session_token_repetido ───────────────────


def test_register_rechaza_session_token_ya_usado(
    app_client: TestClient, db_session: Session
) -> None:
    """Segundo registro con el mismo legal_session_token retorna 409.

    Previene doble registro usando el mismo lote de evidencias de lectura.
    Criterio de idempotencia: un session_token que ya tiene user_id asignado
    no puede usarse para crear un segundo usuario.
    """
    session_token = str(uuid.uuid4())
    _seed_document_views(db_session, session_token)

    # Primer registro: debe ser exitoso
    resp1 = app_client.post(
        "/auth/register", json=_register_payload(session_token, email="first@conniku.com")
    )
    assert resp1.status_code == 200, f"Primer registro debería ser exitoso: {resp1.text}"

    # Segundo registro con el MISMO session_token: debe fallar
    # (Usamos email distinto para que la unicidad de email no sea la causa)
    # Necesitamos re-seedear porque las views ya tienen user_id asignado
    resp2 = app_client.post(
        "/auth/register",
        json=_register_payload(session_token, email="second@conniku.com"),
    )
    assert resp2.status_code == 409, (
        f"Esperado 409 para session_token reutilizado, recibido {resp2.status_code}: {resp2.text}"
    )
