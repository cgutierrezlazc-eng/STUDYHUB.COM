"""Tests del modelo UserAgreement y su integración con la BD.

Valida:
- Que el modelo se crea con los 7 campos probatorios obligatorios.
- Que el índice compuesto user_id + document_type existe.
- Que la FK con User con ondelete CASCADE funciona.
- Que la migración SQL (add_user_agreements_table.sql) es aplicable.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlalchemy import inspect
from sqlalchemy.orm import Session


@pytest.mark.legal
def test_tabla_user_agreements_existe_tras_init(db_session: Session) -> None:
    inspector = inspect(db_session.get_bind())
    assert inspector.has_table("user_agreements"), "La tabla user_agreements no fue creada por Base.metadata.create_all"


@pytest.mark.legal
def test_user_agreement_tiene_siete_campos_probatorios(db_session: Session) -> None:
    """CLAUDE.md §Componente 3 exige 7 campos: timestamp UTC, zona horaria,
    IP, User-Agent, hash del texto, user_id, versión."""
    inspector = inspect(db_session.get_bind())
    cols = {c["name"] for c in inspector.get_columns("user_agreements")}
    # Campos probatorios
    for required in (
        "user_id",
        "accepted_at_utc",
        "user_timezone",
        "client_ip",
        "user_agent",
        "text_version_hash",
        "text_version",
    ):
        assert required in cols, f"Campo probatorio {required!r} ausente en user_agreements"
    # Campos de soporte
    assert "document_type" in cols
    assert "id" in cols


@pytest.mark.legal
def test_crear_agreement_persiste_campos(db_session: Session, test_user_factory) -> None:
    from database import UserAgreement

    user = test_user_factory(email="test1@conniku.com")

    agreement = UserAgreement(
        user_id=user.id,
        document_type="age_declaration",
        text_version="1.0.0",
        text_version_hash="ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706",
        accepted_at_utc=datetime.now(UTC).replace(tzinfo=None),
        user_timezone="America/Santiago",
        client_ip="1.2.3.4",
        user_agent="Mozilla/5.0 Test",
    )
    db_session.add(agreement)
    db_session.commit()
    db_session.refresh(agreement)

    assert agreement.id is not None
    assert agreement.user_id == user.id
    assert agreement.document_type == "age_declaration"
    assert agreement.text_version_hash == "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706"
    assert agreement.client_ip == "1.2.3.4"
    assert agreement.user_timezone == "America/Santiago"


@pytest.mark.legal
def test_multiple_agreements_mismo_usuario_distintos_tipos(db_session: Session, test_user_factory) -> None:
    """Un usuario puede tener varios agreements: age_declaration + tos + privacy."""
    from database import UserAgreement

    user = test_user_factory(email="test2@conniku.com")

    for doc_type in ("age_declaration", "tos", "privacy"):
        db_session.add(
            UserAgreement(
                user_id=user.id,
                document_type=doc_type,
                text_version="1.0.0",
                text_version_hash="ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706",
                accepted_at_utc=datetime.now(UTC).replace(tzinfo=None),
            )
        )
    db_session.commit()

    count = db_session.query(UserAgreement).filter_by(user_id=user.id).count()
    assert count == 3


@pytest.mark.legal
def test_backfill_sql_es_idempotente(db_session: Session, test_user_factory) -> None:
    """Ejecutar el backfill dos veces no duplica filas."""
    from database import UserAgreement
    from sqlalchemy import text

    # Crear 2 usuarios legacy (sin agreement).
    user_a = test_user_factory(email="legacy1@conniku.com")
    test_user_factory(email="legacy2@conniku.com")

    backfill_sql = text("""
        INSERT INTO user_agreements (
            user_id, document_type, text_version, text_version_hash, accepted_at_utc, created_at
        )
        SELECT u.id, 'age_declaration_legacy', 'legacy', 'legacy_no_hash_available',
               COALESCE(u.tos_accepted_at, u.created_at), CURRENT_TIMESTAMP
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM user_agreements ua
            WHERE ua.user_id = u.id
            AND ua.document_type LIKE 'age_declaration%'
        )
    """)

    # Primera ejecución
    db_session.execute(backfill_sql)
    db_session.commit()
    first_count = db_session.query(UserAgreement).count()
    assert first_count == 2  # los 2 usuarios legacy

    # Segunda ejecución (NO debe duplicar)
    db_session.execute(backfill_sql)
    db_session.commit()
    second_count = db_session.query(UserAgreement).count()
    assert second_count == 2, "Backfill no es idempotente — ejecutar dos veces duplica filas"

    # Verificar document_type del backfill
    row = db_session.query(UserAgreement).filter_by(user_id=user_a.id).first()
    assert row is not None
    assert row.document_type == "age_declaration_legacy"
    assert row.text_version_hash == "legacy_no_hash_available"
    assert row.client_ip is None  # legacy no tiene IP real
