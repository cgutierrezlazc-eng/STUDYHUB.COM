"""Tests para el bloque contact-tickets-v1.

Cubre:
- Modelo ContactTicket y ContactTicketMessage (schema, campos probatorios)
- Endpoint público POST /contact/tickets
- Routing por motivo
- Honeypot anti-bot (silent accept)
- Rate-limit 5/hora por IP
- Validación de consent_hash vigente
- Retención 5 años (Art. 17(3)(e) GDPR + Art. 2515 CC Chile)
- Endpoints admin protegidos (list, detail, reply, status)

Decisiones Cristian 2026-04-22: 1B 2A 3A 4-5años 5A 6A 7C 8A CORS-A.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.orm import Session


# ─── Fixture: app FastAPI con BD in-memory ────────────────────────────────────


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """Cliente FastAPI con contact_tickets_routes montado y BD de test."""
    from contact_tickets_routes import router as ct_router
    from database import get_db

    app = FastAPI()
    app.include_router(ct_router)
    app.dependency_overrides[get_db] = lambda: db_session

    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def admin_user(test_user_factory):
    """Usuario admin de prueba."""
    return test_user_factory(email="admin@conniku.com", is_admin=True)


@pytest.fixture
def regular_user(test_user_factory):
    """Usuario regular (no admin) de prueba."""
    return test_user_factory(email="user@conniku.com", is_admin=False)


@pytest.fixture
def admin_client(db_session: Session, admin_user) -> TestClient:
    """Cliente FastAPI con JWT de admin en cabecera Authorization."""
    from contact_tickets_routes import router as ct_router
    from database import get_db
    from middleware import get_current_user, require_admin

    app = FastAPI()
    app.include_router(ct_router)
    app.dependency_overrides[get_db] = lambda: db_session
    # Sobreescribir dependencia de auth para retornar admin directamente.
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[require_admin] = lambda: admin_user

    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def nonadmin_client(db_session: Session, regular_user) -> TestClient:
    """Cliente FastAPI con JWT de usuario regular (no admin)."""
    from contact_tickets_routes import router as ct_router
    from database import get_db
    from middleware import get_current_user, require_admin
    from fastapi import HTTPException

    app = FastAPI()
    app.include_router(ct_router)
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_current_user] = lambda: regular_user

    def _raise_403():
        raise HTTPException(status_code=403, detail="Admin access required")

    app.dependency_overrides[require_admin] = _raise_403

    return TestClient(app, raise_server_exceptions=False)


# ─── Payload base válido ──────────────────────────────────────────────────────

VALID_PAYLOAD = {
    "name": "María González",
    "email": "maria@example.com",
    "reason": "comercial",
    "org": "Universidad de Chile",
    "message": "Hola, quiero saber cómo pueden ayudar a nuestra universidad con licencias.",
    "consent_hash": "cc9332741bea7ad4539fd6a8a049946e44521b9ae8ed97833dd112412b8c746e",
    "honeypot_field": "",
}


# ─── Tests modelo / schema ─────────────────────────────────────────────────────


def test_tabla_contact_tickets_existe(db_session: Session) -> None:
    """La tabla contact_tickets se crea al inicializar la BD."""
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("contact_tickets"), "La tabla contact_tickets no fue creada por Base.metadata.create_all"


def test_tabla_contact_ticket_messages_existe(db_session: Session) -> None:
    """La tabla contact_ticket_messages se crea al inicializar la BD."""
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("contact_ticket_messages"), "La tabla contact_ticket_messages no fue creada"


def test_contact_tickets_tiene_campos_probatorios(db_session: Session) -> None:
    """Todos los campos legales exigidos por el plan §D-T1 están en la tabla."""
    inspector = inspect(db_session.get_bind())
    cols = {c["name"] for c in inspector.get_columns("contact_tickets")}
    required = {
        "id",
        "ticket_number",
        "name",
        "email",
        "reason",
        "org",
        "message",
        "status",
        "client_ip",
        "user_agent",
        "consent_version",
        "consent_hash",
        "consent_accepted_at_utc",
        "routed_to_email",
        "routed_label",
        "sla_hours",
        "created_at",
        "updated_at",
        "retained_until_utc",
        "pseudonymized_at_utc",
        "resolution_note",
        "resolved_at_utc",
        "first_response_at_utc",
    }
    missing = required - cols
    assert not missing, f"Campos faltantes en contact_tickets: {missing}"


def test_contact_ticket_messages_campos(db_session: Session) -> None:
    """Tabla contact_ticket_messages tiene los campos de threading."""
    inspector = inspect(db_session.get_bind())
    cols = {c["name"] for c in inspector.get_columns("contact_ticket_messages")}
    required = {"id", "ticket_id", "direction", "author_email", "body", "created_at"}
    missing = required - cols
    assert not missing, f"Campos faltantes en contact_ticket_messages: {missing}"


# ─── Tests ticket_number ──────────────────────────────────────────────────────


def test_ticket_number_format_valido_CNT_YYYY_NNNN(db_session: Session) -> None:
    """El ticket_number tiene el formato CNT-YYYY-NNNNNN."""
    import re

    from database import ContactTicket

    now = datetime.now(UTC).replace(tzinfo=None)
    ticket = ContactTicket(
        ticket_number=f"CNT-{now.year}-000001",
        name="Test",
        email="test@example.com",
        reason="otro",
        message="Mensaje de prueba con más de 20 caracteres para test.",
        consent_version="2.4.2",
        consent_hash="cc9332741bea7ad4539fd6a8a049946e44521b9ae8ed97833dd112412b8c746e",
        consent_accepted_at_utc=now,
        routed_to_email="contacto@conniku.com",
        routed_label="consulta general",
        sla_hours=72,
        retained_until_utc=now + timedelta(days=1825),
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    pattern = re.compile(r"^CNT-\d{4}-\d{6}$")
    assert pattern.match(ticket.ticket_number), (
        f"ticket_number '{ticket.ticket_number}' no coincide con CNT-YYYY-NNNNNN"
    )


def test_ticket_number_es_unico(db_session: Session) -> None:
    """Dos tickets con el mismo ticket_number violan UNIQUE constraint."""
    from sqlalchemy.exc import IntegrityError

    from database import ContactTicket

    now = datetime.now(UTC).replace(tzinfo=None)
    common_number = "CNT-2026-000001"

    t1 = ContactTicket(
        ticket_number=common_number,
        name="A",
        email="a@example.com",
        reason="otro",
        message="Mensaje de prueba suficientemente largo para pasar validación.",
        consent_version="2.4.2",
        consent_hash="abc",
        consent_accepted_at_utc=now,
        routed_to_email="contacto@conniku.com",
        routed_label="general",
        sla_hours=72,
        retained_until_utc=now + timedelta(days=1825),
    )
    t2 = ContactTicket(
        ticket_number=common_number,
        name="B",
        email="b@example.com",
        reason="otro",
        message="Otro mensaje de prueba suficientemente largo para pasar.",
        consent_version="2.4.2",
        consent_hash="abc",
        consent_accepted_at_utc=now,
        routed_to_email="contacto@conniku.com",
        routed_label="general",
        sla_hours=72,
        retained_until_utc=now + timedelta(days=1825),
    )
    db_session.add(t1)
    db_session.commit()
    db_session.add(t2)
    with pytest.raises(IntegrityError):
        db_session.commit()


# ─── Tests endpoint POST /contact/tickets ────────────────────────────────────


def test_post_contact_crea_ticket_con_todos_los_campos(client: TestClient, db_session: Session) -> None:
    """POST válido → 201 + ticket_number en respuesta + fila en BD con campos probatorios."""
    from database import ContactTicket

    with patch("contact_tickets_routes._send_email_async") as mock_email:
        resp = client.post("/contact/tickets", json=VALID_PAYLOAD)

    assert resp.status_code == 201, f"Esperado 201, recibido {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "ticket_number" in body
    assert body["ticket_number"].startswith("CNT-")
    assert "created_at" in body
    assert "estimated_response" in body

    # Verificar fila en BD
    ticket = db_session.query(ContactTicket).filter_by(ticket_number=body["ticket_number"]).first()
    assert ticket is not None
    assert ticket.name == "María González"
    assert ticket.email == "maria@example.com"
    assert ticket.reason == "comercial"
    assert ticket.consent_hash == VALID_PAYLOAD["consent_hash"]
    assert ticket.consent_version is not None
    assert ticket.retained_until_utc is not None

    # Verificar 2 emails: uno al usuario + uno al equipo
    assert mock_email.call_count == 2


def test_post_contact_routing_por_motivo(client: TestClient, db_session: Session) -> None:
    """Cada motivo genera el label y routed_to_email correcto en el ticket."""
    from database import ContactTicket

    # Mapeo canonico: motivo → (label, email_destino)
    # Alias provisionados en Zoho (reference_email_accounts.md).
    motivos_config = {
        "comercial":   ("consulta comercial",        "contacto@conniku.com"),
        "universidad": ("alianza con universidad",   "contacto@conniku.com"),
        "prensa":      ("prensa y medios",           "prensa@conniku.com"),
        "legal":       ("asuntos legales o privacidad", "legal@conniku.com"),
        "seguridad":   ("reporte de seguridad",      "seguridad@conniku.com"),
        "otro":        ("consulta general",          "contacto@conniku.com"),
    }

    for i, (motivo, (label_esperado, email_esperado)) in enumerate(motivos_config.items()):
        payload = {**VALID_PAYLOAD, "reason": motivo, "email": f"{motivo}@example.com"}
        # IPs distintas por motivo para no disparar el rate-limit
        with patch("contact_tickets_routes._send_email_async"):
            resp = client.post(
                "/contact/tickets",
                json=payload,
                headers={"X-Forwarded-For": f"10.0.{i}.1"},
            )

        assert resp.status_code == 201, f"Motivo '{motivo}' retornó {resp.status_code}"
        ticket_number = resp.json()["ticket_number"]
        ticket = db_session.query(ContactTicket).filter_by(ticket_number=ticket_number).first()
        assert ticket is not None
        assert ticket.routed_label == label_esperado, (
            f"Motivo '{motivo}': esperado label '{label_esperado}', recibido '{ticket.routed_label}'"
        )
        assert ticket.routed_to_email == email_esperado, (
            f"Motivo '{motivo}': esperado email '{email_esperado}', recibido '{ticket.routed_to_email}'"
        )


def test_post_contact_honeypot_silent_accept(client: TestClient, db_session: Session) -> None:
    """Honeypot relleno → 201 pero SIN persistir fila ni enviar emails."""
    from database import ContactTicket

    payload = {**VALID_PAYLOAD, "honeypot_field": "soy un bot"}

    with patch("contact_tickets_routes._send_email_async") as mock_email:
        resp = client.post("/contact/tickets", json=payload)

    assert resp.status_code == 201, f"Esperado 201, recibido {resp.status_code}"
    # Sin persistencia
    count = db_session.query(ContactTicket).count()
    assert count == 0, f"Honeypot no debería persistir filas; hay {count}"
    # Sin emails
    mock_email.assert_not_called()


def test_post_contact_rate_limit_5_por_hora(client: TestClient, db_session: Session) -> None:
    """El 6to POST de la misma IP en la misma hora retorna 429."""
    with patch("contact_tickets_routes._send_email_async"):
        for i in range(5):
            payload = {**VALID_PAYLOAD, "email": f"user{i}@example.com"}
            resp = client.post(
                "/contact/tickets",
                json=payload,
                headers={"X-Forwarded-For": "1.2.3.4"},
            )
            assert resp.status_code == 201, f"Request {i + 1} falló: {resp.status_code}"

        # 6ta request: debe rechazar
        resp = client.post(
            "/contact/tickets",
            json={**VALID_PAYLOAD, "email": "user6@example.com"},
            headers={"X-Forwarded-For": "1.2.3.4"},
        )
    assert resp.status_code == 429, f"Esperado 429 en 6ta request, recibido {resp.status_code}"


def test_post_contact_valida_consent_hash_vigente(client: TestClient) -> None:
    """Consent hash obsoleto → 409 Conflict con versión actual."""
    payload = {**VALID_PAYLOAD, "consent_hash": "hash_obsoleto_que_no_existe"}
    with patch("contact_tickets_routes._send_email_async"):
        resp = client.post("/contact/tickets", json=payload)

    assert resp.status_code == 409, f"Esperado 409, recibido {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "current_hash" in body.get("detail", {}) or "detail" in body


def test_post_contact_retained_until_es_5_anios(client: TestClient, db_session: Session) -> None:
    """retained_until_utc = created_at + 1825 días (≈5 años)."""
    from database import ContactTicket

    with patch("contact_tickets_routes._send_email_async"):
        resp = client.post("/contact/tickets", json=VALID_PAYLOAD)

    assert resp.status_code == 201
    ticket_number = resp.json()["ticket_number"]
    ticket = db_session.query(ContactTicket).filter_by(ticket_number=ticket_number).first()

    delta = ticket.retained_until_utc - ticket.created_at
    # Tolerancia ±2 días para cubrir años bisiestos
    assert abs(delta.days - 1825) <= 2, f"retained_until_utc no es ~5 años: delta={delta.days} días"


def test_post_contact_email_invalido_retorna_422(client: TestClient) -> None:
    """Email malformado → 422 Unprocessable Entity."""
    payload = {**VALID_PAYLOAD, "email": "no-es-un-email"}
    resp = client.post("/contact/tickets", json=payload)
    assert resp.status_code == 422


def test_post_contact_mensaje_corto_retorna_422(client: TestClient) -> None:
    """Mensaje con menos de 20 caracteres → 422."""
    payload = {**VALID_PAYLOAD, "message": "muy corto"}
    resp = client.post("/contact/tickets", json=payload)
    assert resp.status_code == 422


def test_post_contact_reason_invalido_retorna_422(client: TestClient) -> None:
    """Motivo fuera del set válido → 422 (Pydantic Literal)."""
    payload = {**VALID_PAYLOAD, "reason": "motivo_inventado"}
    resp = client.post("/contact/tickets", json=payload)
    assert resp.status_code == 422


def test_post_contact_sin_consent_retorna_422(client: TestClient) -> None:
    """Sin consent_hash → 422."""
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "consent_hash"}
    resp = client.post("/contact/tickets", json=payload)
    assert resp.status_code == 422


def test_post_contact_name_muy_corto_retorna_422(client: TestClient) -> None:
    """Nombre de 1 carácter → 422."""
    payload = {**VALID_PAYLOAD, "name": "A"}
    resp = client.post("/contact/tickets", json=payload)
    assert resp.status_code == 422


# ─── Tests admin — auth ───────────────────────────────────────────────────────


def test_admin_get_tickets_requiere_auth(client: TestClient) -> None:
    """GET /admin/contact/tickets sin JWT → 401 o 403."""
    resp = client.get("/admin/contact/tickets")
    assert resp.status_code in (401, 403), f"Esperado 401/403, recibido {resp.status_code}"


def test_admin_get_tickets_nonadmin_retorna_403(nonadmin_client: TestClient) -> None:
    """GET /admin/contact/tickets con usuario no-admin → 403."""
    resp = nonadmin_client.get("/admin/contact/tickets")
    assert resp.status_code == 403, f"Esperado 403, recibido {resp.status_code}"


# ─── Tests admin — funcionalidad ─────────────────────────────────────────────


def test_admin_get_tickets_lista_con_filtros(admin_client: TestClient, client: TestClient, db_session: Session) -> None:
    """Admin puede listar tickets con filtro por status."""
    # Crear un ticket primero
    with patch("contact_tickets_routes._send_email_async"):
        create_resp = client.post("/contact/tickets", json=VALID_PAYLOAD)
    assert create_resp.status_code == 201

    # Listar como admin
    resp = admin_client.get("/admin/contact/tickets")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert body["total"] >= 1

    # Filtro por status=open
    resp_filtered = admin_client.get("/admin/contact/tickets?status=open")
    assert resp_filtered.status_code == 200
    assert resp_filtered.json()["total"] >= 1


def test_admin_get_ticket_detalle(admin_client: TestClient, client: TestClient, db_session: Session) -> None:
    """Admin puede ver detalle de un ticket por ID."""
    with patch("contact_tickets_routes._send_email_async"):
        create_resp = client.post("/contact/tickets", json=VALID_PAYLOAD)
    assert create_resp.status_code == 201
    ticket_number = create_resp.json()["ticket_number"]

    from database import ContactTicket

    ticket = db_session.query(ContactTicket).filter_by(ticket_number=ticket_number).first()
    assert ticket is not None

    resp = admin_client.get(f"/admin/contact/tickets/{ticket.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ticket_number"] == ticket_number
    assert "messages" in body


def test_admin_reply_actualiza_status_y_envia_email(
    admin_client: TestClient, client: TestClient, db_session: Session
) -> None:
    """POST /admin/contact/tickets/{id}/reply crea mensaje outbound, envía email y cambia status."""
    with patch("contact_tickets_routes._send_email_async"):
        create_resp = client.post("/contact/tickets", json=VALID_PAYLOAD)
    assert create_resp.status_code == 201

    from database import ContactTicket, ContactTicketMessage

    ticket = db_session.query(ContactTicket).first()
    assert ticket is not None
    assert ticket.status == "open"

    with patch("contact_tickets_routes._send_email_async") as mock_email:
        resp = admin_client.post(
            f"/admin/contact/tickets/{ticket.id}/reply",
            json={"response_text": "Hola María, gracias por tu consulta. Nos ponemos en contacto pronto."},
        )

    assert resp.status_code == 200, f"Esperado 200, recibido {resp.status_code}: {resp.text}"

    # Refrescar desde BD
    db_session.refresh(ticket)
    assert ticket.status == "replied"
    assert ticket.first_response_at_utc is not None

    # Verificar mensaje outbound creado
    msgs = db_session.query(ContactTicketMessage).filter_by(ticket_id=ticket.id, direction="outbound").all()
    assert len(msgs) == 1

    # Verificar email enviado
    mock_email.assert_called_once()


def test_admin_reply_segunda_respuesta_no_cambia_first_response(
    admin_client: TestClient, client: TestClient, db_session: Session
) -> None:
    """Segunda respuesta no sobreescribe first_response_at_utc."""
    with patch("contact_tickets_routes._send_email_async"):
        client.post("/contact/tickets", json=VALID_PAYLOAD)

    from database import ContactTicket

    ticket = db_session.query(ContactTicket).first()
    assert ticket is not None

    with patch("contact_tickets_routes._send_email_async"):
        admin_client.post(
            f"/admin/contact/tickets/{ticket.id}/reply",
            json={"response_text": "Primera respuesta con suficiente contenido."},
        )

    db_session.refresh(ticket)
    first_response = ticket.first_response_at_utc

    with patch("contact_tickets_routes._send_email_async"):
        admin_client.post(
            f"/admin/contact/tickets/{ticket.id}/reply",
            json={"response_text": "Segunda respuesta con suficiente contenido."},
        )

    db_session.refresh(ticket)
    assert ticket.first_response_at_utc == first_response, (
        "first_response_at_utc no debe cambiar en respuestas posteriores"
    )


def test_admin_patch_status(admin_client: TestClient, client: TestClient, db_session: Session) -> None:
    """PATCH /admin/contact/tickets/{id}/status cambia el estado correctamente."""
    with patch("contact_tickets_routes._send_email_async"):
        client.post("/contact/tickets", json=VALID_PAYLOAD)

    from database import ContactTicket

    ticket = db_session.query(ContactTicket).first()
    assert ticket is not None

    resp = admin_client.patch(
        f"/admin/contact/tickets/{ticket.id}/status",
        json={"status": "in_review"},
    )
    assert resp.status_code == 200

    db_session.refresh(ticket)
    assert ticket.status == "in_review"


def test_admin_patch_status_resolved_setea_resolved_at(
    admin_client: TestClient, client: TestClient, db_session: Session
) -> None:
    """PATCH con status=closed setea resolved_at_utc."""
    with patch("contact_tickets_routes._send_email_async"):
        client.post("/contact/tickets", json=VALID_PAYLOAD)

    from database import ContactTicket

    ticket = db_session.query(ContactTicket).first()
    assert ticket is not None
    assert ticket.resolved_at_utc is None

    resp = admin_client.patch(
        f"/admin/contact/tickets/{ticket.id}/status",
        json={"status": "closed", "resolution_note": "Consulta resuelta satisfactoriamente."},
    )
    assert resp.status_code == 200

    db_session.refresh(ticket)
    assert ticket.status == "closed"
    assert ticket.resolved_at_utc is not None


def test_admin_reply_requiere_admin_role(nonadmin_client: TestClient) -> None:
    """POST /admin/contact/tickets/{id}/reply sin admin → 403."""
    resp = nonadmin_client.post(
        "/admin/contact/tickets/some-id/reply",
        json={"response_text": "texto"},
    )
    assert resp.status_code == 403
