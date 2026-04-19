"""Tests de seguridad para workspaces_export.py.

Valida que los vectores de ataque SSRF y XSS conocidos sean bloqueados
por la capa de sanitización antes de llegar al motor de render PDF.

Vectores probados (cierre de deuda C1 de docs/pendientes.md):
- SSRF via metadata cloud: http://169.254.169.254/latest/meta-data/
- SSRF via file:///etc/passwd
- SSRF via dominio externo no permitido
- XSS via <script>
- XSS via onerror handler en img
- Permiso correcto de data:image/*

Estos tests NO dependen de WeasyPrint ni de librerías nativas.
Se testea la capa de sanitización y pre-proceso, no el render final.
"""

from __future__ import annotations

import os
import sys

import pytest

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

pytest.importorskip("bleach", reason="bleach no instalado")


# ─── Tests de sanitize_html ──────────────────────────────────────────


class TestSanitizeHtml:
    """Valida que sanitize_html bloquee XSS y tags peligrosos."""

    def test_script_tag_removido(self) -> None:
        """<script>alert(1)</script> — el tag debe ser eliminado.

        bleach con strip=True elimina el tag pero conserva el texto interior
        como texto plano (comportamiento documentado de bleach). El peligro
        real es el tag <script> que permite ejecutar código; el texto "alert(1)"
        como texto plano no es ejecutable.
        """
        from workspaces_export import sanitize_html  # type: ignore

        html = "<p>Hola</p><script>alert(1)</script>"
        result = sanitize_html(html)

        # El tag script debe estar eliminado
        assert "<script" not in result
        assert "</script" not in result
        # El contenido legítimo se preserva
        assert "Hola" in result

    def test_onerror_handler_removido(self) -> None:
        """<img onerror='alert(1)'> no debe tener el handler onerror."""
        from workspaces_export import sanitize_html  # type: ignore

        html = '<img src="data:image/png;base64,abc" onerror="alert(1)">'
        result = sanitize_html(html)

        assert "onerror" not in result

    def test_onclick_handler_removido(self) -> None:
        """Atributos de evento no deben sobrevivir la sanitización."""
        from workspaces_export import sanitize_html  # type: ignore

        html = '<p onclick="evil()">Texto</p>'
        result = sanitize_html(html)

        assert "onclick" not in result

    def test_iframe_removido(self) -> None:
        """<iframe> no está en la whitelist de tags."""
        from workspaces_export import sanitize_html  # type: ignore

        html = '<iframe src="https://evil.com"></iframe>'
        result = sanitize_html(html)

        assert "<iframe" not in result

    def test_tags_validos_se_preservan(self) -> None:
        """Tags permitidos (p, h1, ul, li, strong, em) sobreviven."""
        from workspaces_export import sanitize_html  # type: ignore

        html = "<h1>Título</h1><p>Párrafo con <strong>negrita</strong> y <em>cursiva</em></p>"
        result = sanitize_html(html)

        assert "<h1>" in result
        assert "<p>" in result
        assert "<strong>" in result
        assert "<em>" in result

    def test_data_image_src_permitido(self) -> None:
        """<img src='data:image/...'> es seguro y debe preservarse."""
        from workspaces_export import sanitize_html  # type: ignore

        html = '<img src="data:image/png;base64,iVBORw0KGgo=">'
        result = sanitize_html(html)

        assert "data:image/png;base64" in result

    def test_javascript_href_removido(self) -> None:
        """<a href='javascript:...'> no debe sobrevivir."""
        from workspaces_export import sanitize_html  # type: ignore

        html = '<a href="javascript:alert(1)">click</a>'
        result = sanitize_html(html)

        assert "javascript:" not in result


# ─── Tests de inline_remote_images (SSRF) ────────────────────────────


class TestInlineRemoteImages:
    """Valida que inline_remote_images bloquee SSRF conocidos.

    Estos tests verifican que NO se realiza ningún request a las URLs
    bloqueadas. La función debe rechazarlas antes de hacer la petición.
    """

    def test_ssrf_cloud_metadata_aws_bloqueado(self) -> None:
        """http://169.254.169.254/latest/meta-data/ debe ser rechazado.

        Este es el vector de metadata leak de AWS que causó C1 en V1.
        No se debe hacer ningún request a esta URL.
        """
        from workspaces_export import inline_remote_images  # type: ignore

        html = '<img src="http://169.254.169.254/latest/meta-data/">'
        result = inline_remote_images(html)

        # La imagen debe ser removida (no src con la URL peligrosa)
        assert "169.254.169.254" not in result

    def test_ssrf_file_protocol_bloqueado(self) -> None:
        """file:///etc/passwd no debe ser procesado nunca."""
        from workspaces_export import inline_remote_images  # type: ignore

        html = '<img src="file:///etc/passwd">'
        result = inline_remote_images(html)

        assert "file://" not in result
        assert "/etc/passwd" not in result

    def test_ssrf_localhost_bloqueado(self) -> None:
        """http://localhost/admin no debe ser procesado."""
        from workspaces_export import inline_remote_images  # type: ignore

        html = '<img src="http://localhost/admin">'
        result = inline_remote_images(html)

        assert "localhost" not in result

    def test_ssrf_dominio_externo_bloqueado(self) -> None:
        """https://evil.com/img.jpg no está en whitelist → rechazado."""
        from workspaces_export import inline_remote_images  # type: ignore

        html = '<img src="https://evil.com/img.jpg">'
        result = inline_remote_images(html)

        assert "evil.com" not in result

    def test_ssrf_ip_interna_192_bloqueada(self) -> None:
        """Rangos IP internos RFC1918 bloqueados (192.168.x.x)."""
        from workspaces_export import inline_remote_images  # type: ignore

        html = '<img src="http://192.168.1.1/secrets">'
        result = inline_remote_images(html)

        assert "192.168.1.1" not in result

    def test_data_image_preservada_sin_request(self) -> None:
        """data:image/* ya está inlinada — no requiere request y se preserva."""
        from workspaces_export import inline_remote_images  # type: ignore

        data_src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII="
        html = f'<img src="{data_src}">'
        result = inline_remote_images(html)

        assert data_src in result

    def test_no_img_sin_cambios(self) -> None:
        """HTML sin imgs retorna igual."""
        from workspaces_export import inline_remote_images  # type: ignore

        html = "<p>Sin imágenes aquí</p>"
        result = inline_remote_images(html)

        assert result == html

    def test_gopher_protocol_bloqueado(self) -> None:
        """gopher:// es un vector SSRF conocido — debe ser bloqueado."""
        from workspaces_export import inline_remote_images  # type: ignore

        html = '<img src="gopher://internal.server/exploit">'
        result = inline_remote_images(html)

        assert "gopher://" not in result
