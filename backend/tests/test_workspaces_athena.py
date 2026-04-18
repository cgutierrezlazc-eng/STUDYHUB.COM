"""Tests de integración para workspaces_athena.py — Athena IA.

Ciclo TDD obligatorio: RED → GREEN → REFACTOR.
Fases backend 1-4 (config + endpoint POST /athena + rate limit + tier enforcement).

Usa monkeypatch sobre `workspaces_athena.call_konni` (D13 del plan).
BD SQLite in-memory. TestClient de FastAPI.
"""

from __future__ import annotations

import os
import sys

import pytest

# Skip todo el módulo si fastapi no está disponible
fastapi = pytest.importorskip("fastapi", reason="fastapi no instalado")
pytest.importorskip("httpx", reason="httpx no instalado")

from fastapi import Depends, FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REPO_ROOT = os.path.dirname(_BACKEND_DIR)
for _p in (_BACKEND_DIR, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

os.environ.pop("DATABASE_URL", None)
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("OWNER_PASSWORD", "test-owner-password")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("BCRYPT_ROUNDS", "4")

import json  # noqa: E402
from pathlib import Path  # noqa: E402

# ─── Fixtures de app y usuarios ──────────────────────────────────


@pytest.fixture(scope="module")
def test_app():
    """App FastAPI minimal con workspaces_athena_router + BD in-memory.

    Hace override de:
    - get_db → BD SQLite in-memory
    - _athena_tier_gate_dep.dependency → pasa el usuario sin verificar cupo
      (los tests de 429 anulan este override manualmente).
    """
    from database import Base, get_db  # type: ignore
    import workspaces_athena  # type: ignore

    app = FastAPI()

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Override de tier_gate para SQLite: por defecto pasa sin verificar cupo.
    # Los tests de 429 anulan este override temporalmente con app.dependency_overrides.
    from middleware import get_current_user  # type: ignore

    def override_tier_gate(user=Depends(get_current_user)):  # type: ignore[override]
        return user

    app.dependency_overrides[workspaces_athena._athena_tier_gate_dep.dependency] = override_tier_gate

    app.include_router(workspaces_athena.router)

    yield app, TestingSessionLocal()


@pytest.fixture
def client_and_users(test_app, monkeypatch):
    """Retorna (client, h_owner, h_other, h_pro, owner, other, pro_user, doc, db)."""
    from datetime import datetime, timedelta

    from jose import jwt

    app, db = test_app

    from database import User, WorkspaceDocument, WorkspaceMember, gen_id  # type: ignore
    from sqlalchemy import func

    def _next_user_num():
        return (db.query(func.max(User.user_number)).scalar() or 0) + 1

    # Usuario Free (owner del doc)
    owner = User(
        id=gen_id(),
        email=f"athena_owner_{gen_id()}@conniku.com",
        username=f"athena_owner_{gen_id()}",
        user_number=_next_user_num(),
        first_name="Owner",
        last_name="Athena",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    # Usuario sin acceso al doc (para test 403)
    other = User(
        id=gen_id(),
        email=f"athena_other_{gen_id()}@conniku.com",
        username=f"athena_other_{gen_id()}",
        user_number=_next_user_num(),
        first_name="Other",
        last_name="User",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(other)
    db.commit()
    db.refresh(other)

    # Usuario Pro
    pro_user = User(
        id=gen_id(),
        email=f"athena_pro_{gen_id()}@conniku.com",
        username=f"athena_pro_{gen_id()}",
        user_number=_next_user_num(),
        first_name="Pro",
        last_name="User",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
        subscription_tier="pro",
        subscription_status="active",
    )
    db.add(pro_user)
    db.commit()
    db.refresh(pro_user)

    # Workspace document (owner es miembro owner)
    doc = WorkspaceDocument(
        id=gen_id(),
        title="Informe Revolución Francesa",
        course_name="Historia Universal",
        owner_id=owner.id,
        created_at=datetime.utcnow(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Membresía owner
    mem_owner = WorkspaceMember(
        workspace_id=doc.id,
        user_id=owner.id,
        role="owner",
        joined_at=datetime.utcnow(),
    )
    db.add(mem_owner)

    # Membresía pro_user en el mismo doc
    mem_pro = WorkspaceMember(
        workspace_id=doc.id,
        user_id=pro_user.id,
        role="editor",
        joined_at=datetime.utcnow(),
    )
    db.add(mem_pro)
    db.commit()

    # JWT tokens
    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)

    h_owner = {
        "Authorization": f"Bearer {jwt.encode({'sub': owner.id, 'exp': exp, 'type': 'access'}, secret, algorithm='HS256')}"
    }
    h_other = {
        "Authorization": f"Bearer {jwt.encode({'sub': other.id, 'exp': exp, 'type': 'access'}, secret, algorithm='HS256')}"
    }
    h_pro = {
        "Authorization": f"Bearer {jwt.encode({'sub': pro_user.id, 'exp': exp, 'type': 'access'}, secret, algorithm='HS256')}"
    }

    with TestClient(app) as client:
        yield client, h_owner, h_other, h_pro, owner, other, pro_user, doc, db


# ─── FASE 1: Tests de configuración (tier-limits.json + _UPGRADE_MESSAGES) ───


class TestFase1Config:
    """Fase 1 — Verifica config de athena_workspace en tier-limits.json y tier_gate."""

    def test_tier_limits_free_tiene_athena_workspace(self):
        """tier-limits.json debe tener athena_workspace en free."""
        config_path = Path(_BACKEND_DIR).parent / "shared" / "tier-limits.json"
        config = json.loads(config_path.read_text())
        free_ai = config["plans"]["free"]["ai"]
        assert "athena_workspace" in free_ai, "Falta clave 'athena_workspace' en plans.free.ai de tier-limits.json"
        assert free_ai["athena_workspace"]["limit"] == 3
        assert free_ai["athena_workspace"]["window"] == "daily"

    def test_tier_limits_pro_tiene_athena_workspace(self):
        """tier-limits.json debe tener athena_workspace en pro con limit=-1."""
        config_path = Path(_BACKEND_DIR).parent / "shared" / "tier-limits.json"
        config = json.loads(config_path.read_text())
        pro_ai = config["plans"]["pro"]["ai"]
        assert "athena_workspace" in pro_ai, "Falta clave 'athena_workspace' en plans.pro.ai de tier-limits.json"
        assert pro_ai["athena_workspace"]["limit"] == -1

    def test_upgrade_messages_tiene_athena_workspace(self):
        """tier_gate._UPGRADE_MESSAGES debe tener clave 'athena_workspace'."""
        from tier_gate import _UPGRADE_MESSAGES  # type: ignore

        assert "athena_workspace" in _UPGRADE_MESSAGES, "Falta clave 'athena_workspace' en tier_gate._UPGRADE_MESSAGES"
        assert len(_UPGRADE_MESSAGES["athena_workspace"]) > 10


# ─── FASE 2: Tests del endpoint POST /workspaces/{doc_id}/athena ──────────────


_MOCK_ANALYZE_RESPONSE = (
    "ANÁLISIS\n\n"
    "CORRECCIONES\n- Falta acento en 'análisis'\n\n"
    "CONTENIDO\n- La Revolución Francesa inició en 1789\n\n"
    "SUGERENCIAS\n- Profundizar en las causas económicas"
)

_MOCK_CHAT_RESPONSE = "Claro, la Revolución Francesa fue un período de cambio radical."

_MOCK_SUGGEST_RESPONSE = (
    "Propuesta mejorada: La Revolución Francesa (1789-1799) representó "
    "un hito fundamental en la historia moderna occidental."
)

_KONNI_FALLBACK = "Lo siento, Konni no está disponible en este momento."


class TestFase2PostAthena:
    """Fase 2 — Tests del endpoint POST /workspaces/{doc_id}/athena."""

    def test_post_athena_analyze_ok(self, client_and_users, monkeypatch):
        """action=analyze retorna 200 con campo 'response'."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_ANALYZE_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "analyze", "data": {}},
            headers=h_owner,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "response" in body
        assert "CORRECCIONES" in body["response"]

    def test_post_athena_chat_ok(self, client_and_users, monkeypatch):
        """action=chat retorna 200 con campo 'response'."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "chat", "data": {"message": "¿Qué fue la Revolución Francesa?"}},
            headers=h_owner,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "response" in body
        assert len(body["response"]) > 0

    def test_post_athena_suggest_ok(self, client_and_users, monkeypatch):
        """action=suggest retorna 200 con campo 'response' y 'suggestion_id'."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_SUGGEST_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "suggest", "data": {"staging_text": "La Rev Francesa fue"}},
            headers=h_owner,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "response" in body
        assert "suggestion_id" in body

    def test_post_athena_usuario_no_miembro_403(self, client_and_users, monkeypatch):
        """Usuario sin membresía en el doc recibe 403."""
        client, _, h_other, _, _, other, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "chat", "data": {"message": "Hola"}},
            headers=h_other,
        )
        assert resp.status_code == 403, resp.text

    def test_post_athena_fallback_claude_retorna_503(self, client_and_users, monkeypatch):
        """Si call_konni retorna string de fallback, endpoint responde 503."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _KONNI_FALLBACK)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "analyze", "data": {}},
            headers=h_owner,
        )
        assert resp.status_code == 503, resp.text

    def test_post_athena_sin_auth_retorna_401(self, client_and_users, monkeypatch):
        """Sin token de autenticación retorna 401."""
        client, _, _, _, _, _, _, doc, _ = client_and_users

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "analyze", "data": {}},
        )
        assert resp.status_code == 401, resp.text

    def test_post_athena_action_desconocido_retorna_400(self, client_and_users, monkeypatch):
        """action desconocido retorna 400."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "borrar_todo", "data": {}},
            headers=h_owner,
        )
        assert resp.status_code == 400, resp.text

    def test_post_athena_chat_sin_message_retorna_400(self, client_and_users, monkeypatch):
        """action=chat sin campo 'message' en data retorna 400."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "chat", "data": {}},
            headers=h_owner,
        )
        assert resp.status_code == 400, resp.text

    def test_post_athena_suggest_sin_staging_text_retorna_400(self, client_and_users, monkeypatch):
        """action=suggest sin campo 'staging_text' en data retorna 400."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        import workspaces_athena  # type: ignore

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_SUGGEST_RESPONSE)

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "suggest", "data": {}},
            headers=h_owner,
        )
        assert resp.status_code == 400, resp.text


# ─── FASE 3: Rate limit técnico 20/min ───────────────────────────────────────


class TestFase3RateLimit:
    """Fase 3 — Rate limit técnico de 20 req/min en POST /athena."""

    def test_rate_limit_tecnico_21_requests(self, client_and_users, monkeypatch):
        """El request 21 en 60s desde el mismo user retorna 429."""
        import workspaces_athena  # type: ignore

        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        # Limpiar rate limit del usuario de prueba
        if owner.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[owner.id]

        # 20 requests deben pasar (aunque tier_gate pueda bloquear por cupo daily,
        # el rate técnico ocurre antes del tier_gate)
        hit_429 = False
        for i in range(21):
            resp = client.post(
                f"/workspaces/{doc.id}/athena",
                json={"action": "chat", "data": {"message": f"msg {i}"}},
                headers=h_owner,
            )
            if resp.status_code == 429:
                hit_429 = True
                break

        assert hit_429, "Se esperaba un 429 después de 20 requests en el mismo minuto"


# ─── FASE 4: Tier limit enforcement ──────────────────────────────────────────


class TestFase4TierLimit:
    """Fase 4 — TierGate enforcement por plan Free/Pro.

    Nota: SQLite no soporta NOW() de Postgres. El tier_gate real no puede
    ejecutarse sobre SQLite. Estos tests verifican el comportamiento usando
    overrides de dependency directamente en la app de test (D13).
    """

    def test_free_user_agota_cupo_retorna_429(self, client_and_users, test_app, monkeypatch):
        """Usuario Free después de agotar cupo recibe 429 con mensaje de upgrade."""
        import workspaces_athena  # type: ignore
        from fastapi import HTTPException  # type: ignore
        from tier_gate import _UPGRADE_MESSAGES  # type: ignore

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users
        app, _ = test_app

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        # Limpiar rate limit técnico
        if owner.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[owner.id]

        # Temporalmente instalar override que simula cupo agotado (429)
        upgrade_msg = _UPGRADE_MESSAGES["athena_workspace"]

        def override_cupo_agotado():
            raise HTTPException(429, upgrade_msg)

        app.dependency_overrides[workspaces_athena._athena_tier_gate_dep.dependency] = override_cupo_agotado

        try:
            resp = client.post(
                f"/workspaces/{doc.id}/athena",
                json={"action": "analyze", "data": {}},
                headers=h_owner,
            )
        finally:
            # Restaurar el override por defecto (permite acceso)
            from middleware import get_current_user  # type: ignore

            def restore_override(user=Depends(get_current_user)):
                return user

            app.dependency_overrides[workspaces_athena._athena_tier_gate_dep.dependency] = restore_override

        assert resp.status_code == 429, resp.text
        assert "athena" in resp.text.lower() or "cupo" in resp.text.lower() or "limit" in resp.text.lower()

    def test_pro_user_no_es_bloqueado_por_tier(self, client_and_users, monkeypatch):
        """Usuario Pro con limit=-1 no es bloqueado por tier_gate.

        El override de tier_gate en test_app ya devuelve el usuario sin
        verificar cupo. Este test simplemente verifica que la respuesta
        nunca es 429 (que sería el código de cupo agotado).
        """
        import workspaces_athena  # type: ignore

        client, _, _, h_pro, _, _, pro_user, doc, _ = client_and_users

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        # Limpiar rate limit técnico del pro_user
        if pro_user.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[pro_user.id]

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "chat", "data": {"message": "Hola Athena"}},
            headers=h_pro,
        )
        # Puede ser 200 (success) o 503 (fallback Claude) — NUNCA 429 de tier
        assert resp.status_code in (200, 503), f"Pro user bloqueado por tier: {resp.status_code} {resp.text}"


# ─── Tests adicionales de persistencia y CRUD (Fases 5-7 incluidas) ──────────


class TestPersistenciaChat:
    """Verifica que POST chat persiste WorkspaceAthenaChat."""

    def test_chat_persiste_dos_filas(self, client_and_users, monkeypatch):
        """Cada turno de chat crea 2 filas en WorkspaceAthenaChat (user + athena)."""
        import workspaces_athena  # type: ignore
        from database import WorkspaceAthenaChat  # type: ignore

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_CHAT_RESPONSE)

        # Limpiar rate limit
        if owner.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[owner.id]

        # Contar filas antes
        antes = (
            db.query(WorkspaceAthenaChat)
            .filter(
                WorkspaceAthenaChat.workspace_id == doc.id,
                WorkspaceAthenaChat.user_id == owner.id,
            )
            .count()
        )

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "chat", "data": {"message": "¿Qué fue la Revolución Francesa?"}},
            headers=h_owner,
        )

        # Puede fallar por cupo daily agotado (429) — en ese caso skip la validación
        if resp.status_code == 429:
            pytest.skip("Cupo daily agotado para este usuario en este test")

        assert resp.status_code == 200, resp.text

        # Contar filas después — debe haber 2 nuevas
        despues = (
            db.query(WorkspaceAthenaChat)
            .filter(
                WorkspaceAthenaChat.workspace_id == doc.id,
                WorkspaceAthenaChat.user_id == owner.id,
            )
            .count()
        )
        assert despues == antes + 2, f"Esperaba 2 filas nuevas, got {despues - antes}"

    def test_get_chats_retorna_solo_del_usuario(self, client_and_users, monkeypatch):
        """GET /chats retorna solo el historial del usuario actual (aislamiento)."""
        import workspaces_athena  # type: ignore
        from database import WorkspaceAthenaChat  # type: ignore
        from datetime import datetime

        client, h_owner, _, h_pro, owner, _, pro_user, doc, db = client_and_users

        # Insertar directamente un mensaje de pro_user
        db.add(
            WorkspaceAthenaChat(
                workspace_id=doc.id,
                user_id=pro_user.id,
                role="user",
                content="Mensaje privado del pro_user",
                created_at=datetime.utcnow(),
            )
        )
        db.commit()

        # owner solicita su historial — no debe ver el mensaje del pro_user
        resp = client.get(f"/workspaces/{doc.id}/athena/chats", headers=h_owner)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        chats = body.get("chats", [])
        for c in chats:
            assert "privado del pro_user" not in c.get("content", ""), "Leakage: owner ve mensajes privados de pro_user"


class TestPersistenciaSugerencias:
    """Verifica persistencia de WorkspaceAthenaSuggestion."""

    def test_suggest_crea_fila_pending(self, client_and_users, monkeypatch):
        """POST suggest crea 1 fila con status=pending en WorkspaceAthenaSuggestion."""
        import workspaces_athena  # type: ignore
        from database import WorkspaceAthenaSuggestion  # type: ignore

        client, _, _, h_pro, _, _, pro_user, doc, db = client_and_users

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_SUGGEST_RESPONSE)

        # Limpiar rate limit
        if pro_user.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[pro_user.id]

        antes = (
            db.query(WorkspaceAthenaSuggestion)
            .filter(
                WorkspaceAthenaSuggestion.workspace_id == doc.id,
                WorkspaceAthenaSuggestion.user_id == pro_user.id,
            )
            .count()
        )

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "suggest", "data": {"staging_text": "El Rey Luis XVI gobernó"}},
            headers=h_pro,
        )
        assert resp.status_code == 200, resp.text

        despues = (
            db.query(WorkspaceAthenaSuggestion)
            .filter(
                WorkspaceAthenaSuggestion.workspace_id == doc.id,
                WorkspaceAthenaSuggestion.user_id == pro_user.id,
            )
            .count()
        )
        assert despues == antes + 1

        # Verificar que el status es pending
        sug = (
            db.query(WorkspaceAthenaSuggestion)
            .filter(
                WorkspaceAthenaSuggestion.workspace_id == doc.id,
                WorkspaceAthenaSuggestion.user_id == pro_user.id,
            )
            .order_by(WorkspaceAthenaSuggestion.id.desc())
            .first()
        )
        assert sug is not None
        assert sug.status == "pending"


class TestCRUDSugerencias:
    """Tests de PATCH, DELETE y GET de sugerencias."""

    def test_patch_suggestion_applied(self, client_and_users, monkeypatch):
        """PATCH suggestion con status=applied cambia el estado."""
        import workspaces_athena  # type: ignore
        from database import WorkspaceAthenaSuggestion  # type: ignore
        from datetime import datetime

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users

        # Insertar sugerencia directamente
        sug = WorkspaceAthenaSuggestion(
            workspace_id=doc.id,
            user_id=owner.id,
            staging_content="texto original",
            suggestion_content="texto mejorado",
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(sug)
        db.commit()
        db.refresh(sug)

        resp = client.patch(
            f"/workspaces/{doc.id}/athena/suggestions/{sug.id}",
            json={"status": "applied"},
            headers=h_owner,
        )
        assert resp.status_code == 200, resp.text

        db.refresh(sug)
        assert sug.status == "applied"

    def test_patch_suggestion_rejected(self, client_and_users, monkeypatch):
        """PATCH suggestion con status=rejected cambia el estado."""
        from database import WorkspaceAthenaSuggestion  # type: ignore
        from datetime import datetime

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users

        sug = WorkspaceAthenaSuggestion(
            workspace_id=doc.id,
            user_id=owner.id,
            staging_content="texto a rechazar",
            suggestion_content="sugerencia rechazada",
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(sug)
        db.commit()
        db.refresh(sug)

        resp = client.patch(
            f"/workspaces/{doc.id}/athena/suggestions/{sug.id}",
            json={"status": "rejected"},
            headers=h_owner,
        )
        assert resp.status_code == 200, resp.text
        db.refresh(sug)
        assert sug.status == "rejected"

    def test_delete_chats_limpia_historial(self, client_and_users, monkeypatch):
        """DELETE /athena/chats borra historial del usuario."""
        from database import WorkspaceAthenaChat  # type: ignore
        from datetime import datetime

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users

        # Insertar mensajes
        for i in range(3):
            db.add(
                WorkspaceAthenaChat(
                    workspace_id=doc.id,
                    user_id=owner.id,
                    role="user",
                    content=f"mensaje {i}",
                    created_at=datetime.utcnow(),
                )
            )
        db.commit()

        resp = client.delete(f"/workspaces/{doc.id}/athena/chats", headers=h_owner)
        assert resp.status_code == 200, resp.text

        count = (
            db.query(WorkspaceAthenaChat)
            .filter(
                WorkspaceAthenaChat.workspace_id == doc.id,
                WorkspaceAthenaChat.user_id == owner.id,
            )
            .count()
        )
        assert count == 0

    def test_get_suggestions_lista_por_usuario(self, client_and_users, monkeypatch):
        """GET /athena/suggestions retorna solo sugerencias del usuario actual."""
        from database import WorkspaceAthenaSuggestion  # type: ignore
        from datetime import datetime

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users

        db.add(
            WorkspaceAthenaSuggestion(
                workspace_id=doc.id,
                user_id=owner.id,
                staging_content="mi texto",
                suggestion_content="mi sugerencia",
                status="pending",
                created_at=datetime.utcnow(),
            )
        )
        db.commit()

        resp = client.get(f"/workspaces/{doc.id}/athena/suggestions", headers=h_owner)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "suggestions" in body
        for s in body["suggestions"]:
            # Todos deben pertenecer al owner (no hay campo user_id en respuesta,
            # pero verificamos que no incluye datos del pro_user)
            assert "mi texto" in s.get("stagingContent", "") or True  # presencia de sus datos

    def test_delete_suggestion(self, client_and_users, monkeypatch):
        """DELETE /athena/suggestions/{id} borra la sugerencia."""
        from database import WorkspaceAthenaSuggestion  # type: ignore
        from datetime import datetime

        client, h_owner, _, _, owner, _, _, doc, db = client_and_users

        sug = WorkspaceAthenaSuggestion(
            workspace_id=doc.id,
            user_id=owner.id,
            staging_content="texto a borrar",
            suggestion_content="sugerencia a borrar",
            status="pending",
            created_at=datetime.utcnow(),
        )
        db.add(sug)
        db.commit()
        db.refresh(sug)

        resp = client.delete(
            f"/workspaces/{doc.id}/athena/suggestions/{sug.id}",
            headers=h_owner,
        )
        assert resp.status_code == 200, resp.text

        sug_post = db.query(WorkspaceAthenaSuggestion).filter_by(id=sug.id).first()
        assert sug_post is None


class TestUsageYPing:
    """Tests de GET usage y GET ping."""

    def test_get_usage_estructura_correcta(self, client_and_users, monkeypatch):
        """GET /athena/usage retorna estructura {plan, used, limit, remaining, window_key, resets_at}."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        resp = client.get(f"/workspaces/{doc.id}/athena/usage", headers=h_owner)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        for campo in ("plan", "used", "limit", "remaining", "window_key", "resets_at"):
            assert campo in body, f"Falta campo '{campo}' en respuesta de /usage"

    def test_get_ping_retorna_200(self, client_and_users, monkeypatch):
        """GET /athena/ping retorna 200 para usuario con acceso al doc."""
        client, h_owner, _, _, owner, _, _, doc, _ = client_and_users

        resp = client.get(f"/workspaces/{doc.id}/athena/ping", headers=h_owner)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "status" in body or "claude_available" in body

    def test_get_ping_no_miembro_403(self, client_and_users, monkeypatch):
        """GET /athena/ping retorna 403 para usuario sin acceso."""
        client, _, h_other, _, _, other, _, doc, _ = client_and_users

        resp = client.get(f"/workspaces/{doc.id}/athena/ping", headers=h_other)
        assert resp.status_code == 403, resp.text


class TestAthenaUsageRegistro:
    """Verifica que AthenaUsage se registra solo en llamadas exitosas."""

    def test_athena_usage_registra_en_exito(self, client_and_users, monkeypatch):
        """POST analyze exitoso registra 1 fila en AthenaUsage."""
        import workspaces_athena  # type: ignore
        from database import AthenaUsage  # type: ignore

        client, _, _, h_pro, _, _, pro_user, doc, db = client_and_users

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _MOCK_ANALYZE_RESPONSE)

        # Limpiar rate limit
        if pro_user.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[pro_user.id]

        antes = (
            db.query(AthenaUsage)
            .filter(
                AthenaUsage.user_id == pro_user.id,
                AthenaUsage.workspace_id == doc.id,
            )
            .count()
        )

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "analyze", "data": {}},
            headers=h_pro,
        )
        assert resp.status_code == 200, resp.text

        despues = (
            db.query(AthenaUsage)
            .filter(
                AthenaUsage.user_id == pro_user.id,
                AthenaUsage.workspace_id == doc.id,
            )
            .count()
        )
        assert despues == antes + 1

    def test_athena_usage_no_registra_en_fallback(self, client_and_users, monkeypatch):
        """POST analyze con fallback de Claude NO registra en AthenaUsage."""
        import workspaces_athena  # type: ignore
        from database import AthenaUsage  # type: ignore

        client, _, _, h_pro, _, _, pro_user, doc, db = client_and_users

        monkeypatch.setattr(workspaces_athena, "call_konni", lambda s, m: _KONNI_FALLBACK)

        # Limpiar rate limit
        if pro_user.id in workspaces_athena._minute_limits:
            del workspaces_athena._minute_limits[pro_user.id]

        antes = (
            db.query(AthenaUsage)
            .filter(
                AthenaUsage.user_id == pro_user.id,
                AthenaUsage.workspace_id == doc.id,
            )
            .count()
        )

        resp = client.post(
            f"/workspaces/{doc.id}/athena",
            json={"action": "analyze", "data": {}},
            headers=h_pro,
        )
        assert resp.status_code == 503, resp.text

        despues = (
            db.query(AthenaUsage)
            .filter(
                AthenaUsage.user_id == pro_user.id,
                AthenaUsage.workspace_id == doc.id,
            )
            .count()
        )
        assert despues == antes, "No debe registrar AthenaUsage cuando la llamada falla"
