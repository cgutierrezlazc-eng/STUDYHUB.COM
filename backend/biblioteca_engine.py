"""
Biblioteca Engine — Motor unificado de búsqueda con patrón Adapter.

Cada fuente (Gutenberg, OpenStax, SciELO, etc.) implementa SourceAdapter.
UnifiedSearchEngine busca en paralelo y merge resultados.
"""
from __future__ import annotations

import asyncio
import contextlib
import html as html_lib
import re
import time
from abc import ABC, abstractmethod

import httpx

# ─── Constantes ──────────────────────────────────────────────

_CONNIKU_USER_AGENT = "Conniku/1.0 (educational reader; +https://conniku.com)"

# Cliente HTTP compartido — reutiliza conexiones TCP/TLS entre requests
_http_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    """Retorna el cliente HTTP compartido (lazy init, reutiliza conexiones)."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            headers={"User-Agent": _CONNIKU_USER_AGENT},
        )
    return _http_client

# Mapeo de subjects a categorías Conniku
_CATEGORY_MAP = {
    # Más específicos primero (evitar que "science" matchee antes que "computer science")
    "computer science": "programacion",
    "social sciences": "humanidades",
    "natural sciences": "ciencias",
    # OpenStax subjects
    "mathematics": "matematicas",
    "math": "matematicas",
    "algebra": "matematicas",
    "calcul": "matematicas",
    "geometr": "matematicas",
    "physics": "ciencias",
    "chemistry": "ciencias",
    "biology": "ciencias",
    "science": "ciencias",
    "humanities": "humanidades",
    "history": "humanidades",
    "philosophy": "humanidades",
    "ethics": "humanidades",
    "fiction": "humanidades",
    "novel": "humanidades",
    "poetry": "humanidades",
    "drama": "humanidades",
    "business": "negocios",
    "economics": "negocios",
    "finance": "negocios",
    "engineering": "ingenieria",
    "technology": "programacion",
    "medicine": "medicina",
    "medical": "medicina",
    "health": "medicina",
    "nursing": "medicina",
    "law": "derecho",
    "jurisprud": "derecho",
    "psychology": "psicologia",
    "art": "arte",
    "languages": "idiomas",
}


def _map_category(subjects: list[str]) -> str:
    """Mapea una lista de subjects/keywords a una categoría Conniku."""
    combined = " ".join(subjects).lower()
    for keyword, category in _CATEGORY_MAP.items():
        if keyword in combined:
            return category
    return ""


def _strip_html(text: str) -> str:
    """Remueve tags HTML de un string."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", "", text)
    return html_lib.unescape(clean).strip()


# ─── Base Adapter ────────────────────────────────────────────


class SourceAdapter(ABC):
    """Clase base para adaptadores de fuentes de libros."""

    name: str = ""
    display_name: str = ""

    @abstractmethod
    async def search(self, query: str, lang: str = "", page: int = 1) -> dict:
        """Busca en la fuente. Retorna {"items": [...], "total": int, "page": int}."""

    @abstractmethod
    async def download_content(self, external_id: str) -> tuple[bytes, str, dict]:
        """Descarga contenido. Retorna (bytes, filename, extra_meta)."""

    @abstractmethod
    def get_content_url(self, external_id: str) -> str | None:
        """Retorna URL original del contenido (para fallback)."""


# ─── Gutenberg Adapter ──────────────────────────────────────


class GutenbergAdapter(SourceAdapter):
    """Adapter para Project Gutenberg via gutendex.com API."""

    name = "gutenberg"
    display_name = "Project Gutenberg"

    async def search(self, query: str = "", lang: str = "", page: int = 1) -> dict:
        params: dict = {"page": page}
        if query.strip():
            params["search"] = query.strip()
        if lang:
            params["languages"] = lang
        if not query.strip():
            params["sort"] = "popular"

        client = get_http_client()
        resp = await client.get("https://gutendex.com/books/", params=params)
        resp.raise_for_status()
        data = resp.json()

        books = [
            b
            for b in data.get("results", [])
            if any(
                k.startswith("text/html") or k.startswith("text/plain")
                for k in b.get("formats", {})
            )
        ]
        return {
            "items": [self._normalize(b) for b in books],
            "total": data.get("count", 0),
            "page": page,
        }

    def _normalize(self, b: dict) -> dict:
        formats = b.get("formats", {})
        read_url = (
            formats.get("text/html")
            or formats.get("text/html; charset=utf-8")
            or formats.get("text/html; charset=us-ascii")
            or formats.get("text/plain; charset=utf-8")
            or ""
        )
        cover_url = formats.get("image/jpeg") or ""
        authors = ", ".join(a.get("name", "") for a in b.get("authors", []))
        subjects = b.get("subjects", [])
        category = _map_category(subjects)

        return {
            "id": f"gutenberg-{b['id']}",
            "title": b.get("title", "Sin título"),
            "author": authors or "Autor desconocido",
            "description": "; ".join(subjects[:3]) if subjects else "",
            "category": category,
            "source_type": "gutenberg",
            "source_display": self.display_name,
            "has_file": False,
            "embed_url": read_url,
            "cover_url": cover_url,
            "language": ", ".join(b.get("languages", [])),
            "is_saved": False,
            "views": b.get("download_count", 0),
            "rating": 0,
            "rating_count": 0,
            "tags": subjects[:5],
            "year": None,
            "pages": None,
            "license": "Public Domain",
            "read_url": read_url,
            "pdf_url": None,
            "gutenberg_id": b["id"],
        }

    async def download_content(self, external_id: str) -> tuple[bytes, str, dict]:
        # Buscar URL del libro en gutendex
        client = get_http_client()
        resp = await client.get(f"https://gutendex.com/books/{external_id}/")
        resp.raise_for_status()
        data = resp.json()

        formats = data.get("formats", {})
        html_url = (
            formats.get("text/html")
            or formats.get("text/html; charset=utf-8")
            or formats.get("text/html; charset=us-ascii")
            or ""
        )
        if not html_url:
            msg = f"No se encontró HTML para Gutenberg book {external_id}"
            raise ValueError(msg)

        resp = await client.get(html_url)
        resp.raise_for_status()
        return resp.text.encode("utf-8"), "book.html", {"source_url": html_url}

    def get_content_url(self, external_id: str) -> str | None:
        return f"https://www.gutenberg.org/ebooks/{external_id}"


# ─── OpenStax Adapter ───────────────────────────────────────

# Cache del catálogo completo en memoria (127 libros, cambia raramente)
_openstax_catalog: dict = {"items": [], "ts": 0}
_OPENSTAX_CATALOG_TTL = 86400  # 24 horas

_OPENSTAX_API_URL = (
    "https://openstax.org/apps/cms/api/v2/pages/"
    "?type=books.Book"
    "&fields=title,authors,cover_url,book_subjects,book_categories,"
    "high_resolution_pdf_url,low_resolution_pdf_url,"
    "publish_date,book_state,license_name,license_version,"
    "description,cnx_id,webview_rex_link"
    "&limit=250"
    "&order=title"
)


class OpenStaxAdapter(SourceAdapter):
    """Adapter para OpenStax — textbooks universitarios gratuitos."""

    name = "openstax"
    display_name = "OpenStax"

    async def _get_catalog(self) -> list[dict]:
        """Retorna catálogo completo, cacheado en memoria 24hr."""
        now = time.time()
        if _openstax_catalog["items"] and (now - _openstax_catalog["ts"]) < _OPENSTAX_CATALOG_TTL:
            return _openstax_catalog["items"]

        client = get_http_client()
        resp = await client.get(_OPENSTAX_API_URL)
        resp.raise_for_status()
        data = resp.json()

        items = [
            self._normalize(item)
            for item in data.get("items", [])
            if item.get("book_state") == "live"
        ]

        _openstax_catalog["items"] = items
        _openstax_catalog["ts"] = now
        return items

    async def search(self, query: str = "", lang: str = "", page: int = 1) -> dict:
        catalog = await self._get_catalog()

        # Filtrar por query (match en título, autor, categoría, descripción)
        if query.strip():
            q_lower = query.strip().lower()
            catalog = [
                item
                for item in catalog
                if q_lower in item["title"].lower()
                or q_lower in item["author"].lower()
                or q_lower in item["category"].lower()
                or q_lower in item["description"].lower()
                or any(q_lower in tag.lower() for tag in item.get("tags", []))
            ]

        # Filtrar por idioma (OpenStax es mayormente inglés)
        if lang:
            catalog = [
                item for item in catalog if lang in item.get("language", "en")
            ]

        # Paginación simple
        per_page = 24
        start = (page - 1) * per_page
        end = start + per_page
        return {
            "items": catalog[start:end],
            "total": len(catalog),
            "page": page,
        }

    def _normalize(self, item: dict) -> dict:
        page_id = item.get("id", 0)
        meta = item.get("meta", {})

        # Autores: extraer senior authors
        authors_raw = item.get("authors", [])
        author_names = []
        for a in authors_raw:
            val = a.get("value", {})
            if val.get("senior_author"):
                author_names.append(val.get("name", ""))
        if not author_names:
            # Si no hay senior authors, tomar los primeros 3
            author_names = [
                a.get("value", {}).get("name", "")
                for a in authors_raw[:3]
            ]
        author_str = ", ".join(n for n in author_names if n) or "OpenStax"

        # Subjects → categoría
        subjects = item.get("book_subjects", [])
        subject_names = [s.get("subject_name", "") for s in subjects]
        category = _map_category(subject_names)

        # Categorías finas para tags
        categories = item.get("book_categories", [])
        tags = [c.get("subject_category", "") for c in categories if c.get("subject_category")]
        if not tags:
            tags = subject_names[:3]

        # Año de publicación
        publish_date = item.get("publish_date", "")
        year = None
        if publish_date and len(publish_date) >= 4:
            with contextlib.suppress(ValueError):
                year = int(publish_date[:4])

        # Descripción limpia
        description = _strip_html(item.get("description", ""))
        if len(description) > 300:
            description = description[:297] + "..."

        # License
        license_name = item.get("license_name", "")
        license_version = item.get("license_version", "")
        license_str = f"{license_name} {license_version}".strip()
        if not license_str:
            license_str = "CC-BY 4.0"

        # Detectar si es NonCommercial — no se puede cachear/servir en plataforma comercial
        is_nc = "noncommercial" in license_name.lower() or "-nc" in license_str.lower()

        pdf_url = item.get("high_resolution_pdf_url") or item.get("low_resolution_pdf_url") or ""
        read_url = item.get("webview_rex_link", "")

        # Para libros NC: no ofrecer PDF (usar webview de OpenStax directo)
        if is_nc:
            pdf_url = ""

        return {
            "id": f"openstax-{page_id}",
            "title": item.get("title", "Sin título"),
            "author": author_str,
            "description": description,
            "category": category,
            "source_type": "openstax",
            "source_display": self.display_name,
            "has_file": False,
            "embed_url": pdf_url,
            "cover_url": item.get("cover_url", ""),
            "language": meta.get("locale", "en"),
            "is_saved": False,
            "views": 0,
            "rating": 0,
            "rating_count": 0,
            "tags": tags[:5],
            "year": year,
            "pages": None,
            "license": license_str,
            "license_url": item.get("license_url", ""),
            "is_nc": is_nc,
            "copyright_holder": "Rice University",
            "read_url": read_url,
            "pdf_url": pdf_url,
            "openstax_id": page_id,
            "openstax_slug": meta.get("slug", ""),
        }

    async def download_content(self, external_id: str) -> tuple[bytes, str, dict]:
        """Descarga el PDF de un textbook de OpenStax."""
        # Obtener URL del PDF desde el catálogo o API
        catalog = await self._get_catalog()
        book = next(
            (item for item in catalog if str(item.get("openstax_id")) == str(external_id)),
            None,
        )

        if not book or not book.get("pdf_url"):
            # Fallback: buscar en la API directamente
            client = get_http_client()
            resp = await client.get(
                f"https://openstax.org/apps/cms/api/v2/pages/{external_id}/"
                "?fields=high_resolution_pdf_url,low_resolution_pdf_url",
            )
            resp.raise_for_status()
            data = resp.json()
            pdf_url = data.get("high_resolution_pdf_url") or data.get("low_resolution_pdf_url")
            if not pdf_url:
                msg = f"No se encontró PDF para OpenStax book {external_id}"
                raise ValueError(msg)
        else:
            pdf_url = book["pdf_url"]

        # Descargar PDF — usar cliente con timeout extendido para archivos grandes
        async with httpx.AsyncClient(
            timeout=120.0, follow_redirects=True,
            headers={"User-Agent": _CONNIKU_USER_AGENT},
        ) as dl_client:
            resp = await dl_client.get(pdf_url)
            resp.raise_for_status()
            return resp.content, "book.pdf", {"pdf_url": pdf_url}

    def get_content_url(self, external_id: str) -> str | None:
        # Intentar obtener slug del catálogo en memoria
        for item in _openstax_catalog.get("items", []):
            if str(item.get("openstax_id")) == str(external_id):
                slug = item.get("openstax_slug", "")
                if slug:
                    return f"https://openstax.org/details/books/{slug}"
        return "https://openstax.org/subjects"


# ─── Unified Search Engine ───────────────────────────────────

# Instancias globales de los adapters
_gutenberg_adapter = GutenbergAdapter()
_openstax_adapter = OpenStaxAdapter()

_ALL_ADAPTERS: dict[str, SourceAdapter] = {
    "gutenberg": _gutenberg_adapter,
    "openstax": _openstax_adapter,
}


def get_adapter(name: str) -> SourceAdapter | None:
    """Retorna un adapter por nombre."""
    return _ALL_ADAPTERS.get(name)


async def unified_search(
    query: str = "",
    sources: list[str] | None = None,
    lang: str = "",
    page: int = 1,
) -> dict:
    """
    Busca en paralelo en todas las fuentes (o las filtradas por sources).
    Si un adapter falla, retorna resultados parciales.
    """
    adapters_to_search = _ALL_ADAPTERS
    if sources:
        adapters_to_search = {
            name: adapter
            for name, adapter in _ALL_ADAPTERS.items()
            if name in sources
        }

    if not adapters_to_search:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "sources_available": list(_ALL_ADAPTERS.keys()),
            "sources_searched": [],
        }

    # Buscar en paralelo
    async def _safe_search(adapter: SourceAdapter) -> dict:
        try:
            return await adapter.search(query, lang, page)
        except Exception:
            return {"items": [], "total": 0, "page": page}

    tasks = [_safe_search(adapter) for adapter in adapters_to_search.values()]
    results = await asyncio.gather(*tasks)

    # Merge resultados
    all_items: list[dict] = []
    total = 0
    for result in results:
        all_items.extend(result.get("items", []))
        total += result.get("total", 0)

    # Deduplicar por (título + fuente) — permite mismo título de diferentes fuentes
    seen_keys: set[str] = set()
    deduped: list[dict] = []
    for item in all_items:
        title = item.get("title", "").strip().lower()
        source = item.get("source_type", "")
        key = f"{title}|{source}"
        if title and key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(item)

    return {
        "items": deduped,
        "total": total,
        "page": page,
        "sources_available": list(_ALL_ADAPTERS.keys()),
        "sources_searched": list(adapters_to_search.keys()),
    }
