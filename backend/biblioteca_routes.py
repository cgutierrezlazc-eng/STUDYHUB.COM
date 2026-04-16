"""
Biblioteca Conniku — Rutas de la biblioteca académica.

Fuentes de documentos:
- user_shared: PDFs/docs que los usuarios comparten desde sus asignaturas (copia independiente)
- open_library: libros embebidos vía archive.org (visualización dentro de Conniku)
- gutenberg: libros de dominio público vía Project Gutenberg (gutendex.com API)

Principio: todo se visualiza DENTRO de Conniku. Si un libro no permite embed, no se incluye.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import shutil
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional  # noqa: UP035 — required for Pydantic on Python 3.9
from urllib.parse import urljoin, urlparse

import httpx
from biblioteca_cache import (
    get_cache_stats,
    get_cached_path,
    get_or_download,
    is_cached,
    read_meta,
    write_to_cache,
)
from biblioteca_engine import get_adapter
from biblioteca_engine import unified_search as engine_search
from database import (
    DATA_DIR,
    LibraryDocument,
    LibraryDocumentRating,
    LibraryDocumentSave,
    ReadingProgress,
    User,
    gen_id,
    get_db,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from middleware import get_current_user, get_current_user_optional, require_owner
from pydantic import BaseModel
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

logger = logging.getLogger("biblioteca")

router = APIRouter(prefix="/biblioteca", tags=["biblioteca"])

LIBRARY_DIR = DATA_DIR / "biblioteca"
LIBRARY_DIR.mkdir(exist_ok=True)

PROJECTS_DIR = DATA_DIR / "projects"

# ─── Cache de búsqueda en memoria (patrón hr_routes.py) ─────
_search_cache: dict = {}  # key → {"data": ..., "ts": float}
_SEARCH_CACHE_TTL = 3600  # 1 hora
_SEARCH_CACHE_MAX = 200   # máximo de entradas, evicta las más antiguas

# Allowed Gutenberg origins (reutilizado en múltiples endpoints)
_GUTENBERG_ORIGINS = (
    "https://www.gutenberg.org", "http://www.gutenberg.org",
    "https://gutenberg.org", "http://gutenberg.org",
)

_GUTENBERG_USER_AGENT = "Conniku/1.0 (educational reader; +https://conniku.com)"

_GUTENBERG_ALLOWED_HOSTS = {"www.gutenberg.org", "gutenberg.org"}


def _is_valid_gutenberg_url(url: str) -> bool:
    """Valida que una URL sea genuinamente de gutenberg.org (no gutenberg.org.evil.com)."""
    try:
        parsed = urlparse(url)
        return (
            parsed.scheme in ("http", "https")
            and parsed.hostname in _GUTENBERG_ALLOWED_HOSTS
        )
    except Exception:
        return False


def _extract_gutenberg_id(url: str) -> str:
    """Extrae ID numérico de una URL de Gutenberg, o hash MD5 como fallback.
    Formatos conocidos:
      /files/12345/12345-h/12345-h.htm
      /ebooks/12345
      /cache/epub/12345/pg12345-images.html
    """
    # /files/ID/ — formato más común
    m = re.search(r'/files/(\d+)/', url)
    if m:
        return m.group(1)
    # /cache/epub/ID/ — formato alternativo HTML
    m = re.search(r'/cache/epub/(\d+)/', url)
    if m:
        return m.group(1)
    # /ebooks/ID — página del libro
    m = re.search(r'/ebooks/(\d+)', url)
    if m:
        return m.group(1)
    # Último recurso: hash estable del URL
    return hashlib.md5(url.encode()).hexdigest()[:16]


def _strip_pg_license(html: str) -> str:
    """Remueve el bloque de licencia/trademark de Project Gutenberg del HTML.
    Requerido por la PG License cuando el HTML se modifica (CSS, URL rewriting)."""
    # PG license blocks siempre contienen "Project Gutenberg License" o "gutenberg.org/license"
    html = re.sub(
        r'<(pre|small|p)[^>]*>.*?Project Gutenberg License.*?</\1>',
        '', html, flags=re.IGNORECASE | re.DOTALL,
    )
    html = re.sub(
        r'<(pre|small|p)[^>]*>.*?gutenberg\.org/license.*?</\1>',
        '', html, flags=re.IGNORECASE | re.DOTALL,
    )
    return html


def _rewrite_gutenberg_html(html: str, base_url: str) -> str:
    """Reescribe URLs relativas a absolutas, remueve PG trademark, e inyecta estilos."""
    # Remover trademark de PG (requerido al modificar el HTML)
    html = _strip_pg_license(html)

    def make_abs(match: re.Match) -> str:
        attr, quote, val = match.group(1), match.group(2), match.group(3)
        if val.startswith(("http://", "https://", "//", "#", "data:", "javascript:")):
            return match.group(0)
        abs_val = urljoin(base_url, val)
        return f'{attr}={quote}{abs_val}{quote}'

    html = re.sub(
        r'(href|src)=(["\'])(?!http|//|#|data:|javascript:)([^"\']+)\2',
        make_abs, html, flags=re.IGNORECASE,
    )

    reading_styles = """
<style>
  body { max-width: 820px; margin: 0 auto; padding: 24px 20px 60px;
         font-family: Georgia, 'Times New Roman', serif; font-size: 17px;
         line-height: 1.75; color: #e8eeff; background: #0d1526; }
  a { color: #60a5fa; }
  h1,h2,h3,h4 { color: #fff; }
  img { max-width: 100%; height: auto; }
  pre, code { font-size: 14px; white-space: pre-wrap; }
</style>
"""
    if "</head>" in html:
        html = html.replace("</head>", reading_styles + "</head>", 1)
    elif "<body" in html:
        html = html.replace("<body", reading_styles + "<body", 1)
    else:
        html = reading_styles + html

    return html


_SOURCE_DISPLAY = {
    "user_shared": "Conniku",
    "gutenberg": "Project Gutenberg",
    "openstax": "OpenStax",
    "scielo": "SciELO Livros",
    "internetarchive": "Internet Archive",
}


def _generate_citation_apa(title: str, author: str, year: int | None, source_type: str) -> str:
    """Genera citación en formato APA 7ma edición."""
    source = _SOURCE_DISPLAY.get(source_type, source_type)
    author_part = author or "Autor desconocido"
    year_part = f"({year})" if year else "(s.f.)"
    title_part = title or "Sin título"
    return f"{author_part}. {year_part}. {title_part}. {source}."


def _generate_citation_mla(title: str, author: str, year: int | None, source_type: str) -> str:
    """Genera citación en formato MLA 9na edición."""
    source = _SOURCE_DISPLAY.get(source_type, source_type)
    author_part = author or "Autor desconocido"
    title_part = title or "Sin título"
    year_part = str(year) if year else "s.f."
    return f'{author_part}. "{title_part}." {source}, {year_part}.'


# ─── Project helpers (mirrored from server.py to avoid circular import) ───

def _get_project_dir(project_id: str) -> Path:
    # Sanitizar para prevenir path traversal (patrón del registro de errores)
    safe_id = re.sub(r'[/\\.\s]', '_', project_id)
    return PROJECTS_DIR / safe_id

def _get_project_docs_dir(project_id: str) -> Path:
    d = _get_project_dir(project_id) / "documents"
    d.mkdir(exist_ok=True)
    return d

def _get_project_meta(project_id: str) -> dict:
    meta_file = _get_project_dir(project_id) / "meta.json"
    if meta_file.exists():
        return json.loads(meta_file.read_text())
    return {}

def _save_project_meta(project_id: str, meta: dict):
    meta_file = _get_project_dir(project_id) / "meta.json"
    meta_file.write_text(json.dumps(meta, indent=2))


# ─── Helpers ───────────────────────────────────────────────────

def _doc_to_dict(doc: LibraryDocument, saved_ids: set | None = None) -> dict:
    rating_avg = round(doc.rating_sum / doc.rating_count, 1) if doc.rating_count else 0
    return {
        "id": doc.id,
        "title": doc.title,
        "author": doc.author or "",
        "description": doc.description or "",
        "category": doc.category or "",
        "cover_url": doc.cover_url or "",
        "language": doc.language or "Español",
        "year": doc.year,
        "pages": doc.pages,
        "source_type": doc.source_type,
        "has_file": bool(doc.file_path),
        "embed_url": doc.embed_url or "",
        "tags": json.loads(doc.tags or "[]"),
        "views": doc.views or 0,
        "rating": rating_avg,
        "rating_count": doc.rating_count or 0,
        "is_saved": (doc.id in saved_ids) if saved_ids is not None else False,
        "shared_by": f"{doc.shared_by.first_name} {doc.shared_by.last_name}".strip() or doc.shared_by.username if doc.shared_by else None,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


def _get_saved_ids(user_id: str, db: Session) -> set:
    rows = db.query(LibraryDocumentSave.document_id).filter_by(user_id=user_id).all()
    return {r[0] for r in rows}


# ─── GET /biblioteca ──────────────────────────────────────────

@router.get("")
def list_biblioteca(
    q: str = Query(default=""),
    category: str = Query(default=""),
    source_type: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
    user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Listar documentos de la biblioteca con búsqueda y filtros. Guest-accessible."""
    q_obj = db.query(LibraryDocument).filter(LibraryDocument.is_active.is_(True))

    if q:
        term = f"%{q.lower()}%"
        q_obj = q_obj.filter(or_(
            func.lower(LibraryDocument.title).like(term),
            func.lower(LibraryDocument.author).like(term),
            func.lower(LibraryDocument.description).like(term),
        ))
    if category:
        q_obj = q_obj.filter(LibraryDocument.category == category)
    if source_type:
        q_obj = q_obj.filter(LibraryDocument.source_type == source_type)

    total = q_obj.count()
    docs = (
        q_obj.order_by(desc(LibraryDocument.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    saved_ids = _get_saved_ids(user.id, db) if user else set()
    return {
        "items": [_doc_to_dict(d, saved_ids) for d in docs],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


# ─── POST /biblioteca/share ───────────────────────────────────

class ShareDocRequest(BaseModel):
    project_id: str
    doc_id: str        # ID del documento dentro del proyecto (meta.json)
    title: str
    description: str = ""
    category: str
    author: str = ""
    year: Optional[int] = None  # noqa: UP045
    tags: List[str] = []  # noqa: UP006
    rights_confirmed: bool = False  # usuario confirma que tiene derechos


@router.post("/share")
def share_document_to_library(
    payload: ShareDocRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Comparte un documento de una asignatura a la biblioteca.
    Hace copia independiente: si el usuario borra el original, la biblioteca no se ve afectada.
    """
    import json as _json

    # Verificar certificación de derechos (requerido por Ley 17.336 Chile)
    if not payload.rights_confirmed:
        raise HTTPException(
            400,
            "Debes confirmar que tienes derechos para compartir este documento.",
        )

    # Leer meta del proyecto
    meta_path = PROJECTS_DIR / payload.project_id / "meta.json"
    if not meta_path.exists():
        raise HTTPException(404, "Proyecto no encontrado")

    meta = _json.loads(meta_path.read_text())
    if meta.get("user_id") != user.id:
        raise HTTPException(403, "Sin acceso al proyecto")

    # Buscar el documento por id
    docs_list = meta.get("documents", [])
    src_doc = next((d for d in docs_list if d.get("id") == payload.doc_id), None)
    if not src_doc:
        raise HTTPException(404, "Documento no encontrado en el proyecto")

    # Copiar archivo a directorio de la biblioteca (copia independiente)
    src_path = Path(src_doc.get("path", ""))
    lib_path = None
    if src_path.exists():
        dest = LIBRARY_DIR / f"{gen_id()}_{src_path.name}"
        shutil.copy2(src_path, dest)
        lib_path = str(dest)

    doc = LibraryDocument(
        id=gen_id(),
        title=payload.title,
        author=payload.author or (f"{user.first_name} {user.last_name}".strip() or user.username or ""),
        description=payload.description,
        category=payload.category,
        language="Español",
        year=payload.year,
        source_type="user_shared",
        file_path=lib_path,
        tags=_json.dumps(payload.tags, ensure_ascii=False),
        shared_by_user_id=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"success": True, "document": _doc_to_dict(doc, {doc.id})}


# ─── GET /biblioteca/public-search ───────────────────────────
# IMPORTANTE: debe estar ANTES de /{doc_id} para evitar que FastAPI
# intercepte la ruta estática con el parámetro dinámico.

def _gutenberg_book_to_dict(b: dict) -> dict:
    """Convierte un resultado de gutendex.com al formato LibDoc."""
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
    category = ""
    sub_lower = " ".join(subjects).lower()
    if any(k in sub_lower for k in ["math", "algebra", "calcul", "geometr"]):
        category = "matematicas"
    elif any(k in sub_lower for k in ["science", "physics", "chemistry", "biology"]):
        category = "ciencias"
    elif any(k in sub_lower for k in ["fiction", "novel", "poetry", "drama"]):
        category = "humanidades"
    elif any(k in sub_lower for k in ["law", "jurisprud"]):
        category = "derecho"
    elif any(k in sub_lower for k in ["medicine", "medical", "health"]):
        category = "medicina"
    elif any(k in sub_lower for k in ["philosophy", "ethics", "history"]):
        category = "humanidades"
    return {
        "id": f"gutenberg-{b['id']}",
        "title": b.get("title", "Sin título"),
        "author": authors or "Autor desconocido",
        "description": "; ".join(subjects[:3]) if subjects else "",
        "category": category,
        "source_type": "gutenberg",
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
        "gutenberg_id": b["id"],
    }


@router.get("/public-search")
async def public_domain_search(
    q: str = Query(default=""),
    lang: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    user: User = Depends(get_current_user_optional),
):
    """Busca libros de dominio público en Project Gutenberg vía gutendex.com.
    Resultados cacheados en memoria por 1 hora."""
    # Cache en memoria (patrón hr_routes.py)
    cache_key = f"{q.strip().lower()}|{lang}|{page}"
    now = time.time()
    if cache_key in _search_cache:
        entry = _search_cache[cache_key]
        if now - entry["ts"] < _SEARCH_CACHE_TTL:
            return entry["data"]

    params: dict = {"page": page}
    if q.strip():
        params["search"] = q.strip()
    if lang:
        params["languages"] = lang
    if not q.strip():
        params["sort"] = "popular"
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get("https://gutendex.com/books/", params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(503, "No se pudo conectar con Project Gutenberg. Intenta de nuevo.") from None
    books = [b for b in data.get("results", []) if any(
        k.startswith("text/html") or k.startswith("text/plain")
        for k in b.get("formats", {})
    )]
    result = {
        "items": [_gutenberg_book_to_dict(b) for b in books],
        "total": data.get("count", 0),
        "page": page,
        "next": data.get("next"),
    }

    # Guardar en cache (con evicción si supera el máximo)
    _search_cache[cache_key] = {"data": result, "ts": now}
    if len(_search_cache) > _SEARCH_CACHE_MAX:
        # Evictar las entradas más antiguas
        oldest = sorted(_search_cache, key=lambda k: _search_cache[k]["ts"])
        for k in oldest[: len(_search_cache) - _SEARCH_CACHE_MAX]:
            _search_cache.pop(k, None)
    return result


# ─── GET /biblioteca/cache-stats ────────────────────────────
# Estadísticas del cache (para panel CEO / admin)
@router.get("/cache-stats")
def cache_stats(user: User = Depends(get_current_user)):
    """Estadísticas del cache de libros: total, espacio usado, por fuente."""
    stats = get_cache_stats()
    stats["search_cache_entries"] = len(_search_cache)
    return stats


# ─── POST /biblioteca/v2/prefetch ────────────────────────────
# Trigger manual de pre-descarga de libros populares (solo owner/admin)
_prefetch_running = False


@router.post("/v2/prefetch")
async def trigger_prefetch(
    user: User = Depends(require_owner),
):
    """Trigger manual de pre-descarga (solo CEO/owner). Ejecuta en background."""
    import asyncio

    global _prefetch_running
    if _prefetch_running:
        return {"status": "already_running", "message": "Ya hay una pre-descarga en curso"}

    async def _run_prefetch() -> None:
        global _prefetch_running
        _prefetch_running = True
        try:
            from biblioteca_prefetch import prefetch_all

            result = await prefetch_all()
            logger.info("Prefetch completado: %s", result)
        except Exception:
            logger.exception("Error en prefetch background task")
        finally:
            _prefetch_running = False

    asyncio.create_task(_run_prefetch())
    return {"status": "started", "message": "Pre-descarga iniciada en background"}


# ─── GET/POST /biblioteca/v2/progress ─────────────────────────
# Progreso de lectura por libro

class ProgressRequest(BaseModel):
    current_page: int  # >= 1
    total_pages: int   # >= 0


@router.get("/v2/progress/{source}/{external_id}")
def get_progress(
    source: str,
    external_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener progreso de lectura de un libro."""
    progress = db.query(ReadingProgress).filter_by(
        user_id=user.id, source=source, external_id=external_id,
    ).first()
    if not progress:
        return {"current_page": 1, "total_pages": 0, "last_read_at": None}
    return {
        "current_page": progress.current_page,
        "total_pages": progress.total_pages,
        "last_read_at": progress.last_read_at.isoformat() if progress.last_read_at else None,
    }


@router.post("/v2/progress/{source}/{external_id}")
def save_progress(
    source: str,
    external_id: str,
    payload: ProgressRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Guardar o actualizar progreso de lectura (upsert)."""
    if payload.current_page < 1 or payload.total_pages < 0:
        raise HTTPException(400, "Valores de página inválidos")
    progress = db.query(ReadingProgress).filter_by(
        user_id=user.id, source=source, external_id=external_id,
    ).first()
    if progress:
        progress.current_page = payload.current_page
        progress.total_pages = payload.total_pages
        progress.last_read_at = datetime.utcnow()
    else:
        progress = ReadingProgress(
            id=gen_id(),
            user_id=user.id,
            source=source,
            external_id=external_id,
            current_page=payload.current_page,
            total_pages=payload.total_pages,
        )
        db.add(progress)
    db.commit()
    return {"success": True}


# ─── GET /biblioteca/v2/search ────────────────────────────────
# Búsqueda unificada en todas las fuentes
@router.get("/v2/search")
async def v2_unified_search(
    q: str = Query(default=""),
    sources: str = Query(default=""),
    lang: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    user: User = Depends(get_current_user_optional),
):
    """Búsqueda unificada en Gutenberg + OpenStax (y futuras fuentes)."""
    source_list = [s.strip() for s in sources.split(",") if s.strip()] or None
    return await engine_search(query=q, sources=source_list, lang=lang, page=page)


# ─── GET /biblioteca/v2/{source}/{external_id}/read ──────────
# Sirve contenido desde cache o descarga bajo demanda
@router.get("/v2/{source}/{external_id}/read")
async def v2_read_content(
    source: str,
    external_id: str,
):
    """Sirve un libro desde cache local. Si no está cacheado, lo descarga primero.
    No requiere auth para que el iframe pueda cargarlo directamente."""
    adapter = get_adapter(source)
    if not adapter:
        raise HTTPException(400, f"Fuente desconocida: {source}")

    # Intentar servir desde cache
    cached = get_cached_path(source, external_id)
    if cached and cached.stat().st_size > 100:
        # Determinar tipo de respuesta por extensión
        if cached.suffix == ".pdf":
            return FileResponse(
                path=str(cached),
                media_type="application/pdf",
                headers={"Content-Disposition": "inline", "X-Frame-Options": "SAMEORIGIN"},
            )
        # HTML (Gutenberg)
        raw_html = cached.read_text(encoding="utf-8", errors="replace")
        # Para Gutenberg, aplicar reescritura de URLs
        if source == "gutenberg":
            meta = read_meta(source, external_id)
            source_url = meta.get("source_url", "")
            if source_url:
                base_url = source_url.rsplit("/", 1)[0] + "/"
                raw_html = _rewrite_gutenberg_html(raw_html, base_url)
        return HTMLResponse(content=raw_html, media_type="text/html; charset=utf-8")

    # Cache miss — descargar y cachear
    try:
        content_bytes, filename, extra_meta = await adapter.download_content(external_id)
    except (httpx.HTTPError, ValueError) as e:
        fallback_url = adapter.get_content_url(external_id)
        if fallback_url:
            from fastapi.responses import RedirectResponse

            return RedirectResponse(url=fallback_url)
        raise HTTPException(503, f"No se pudo descargar: {e}") from None

    # Escribir al cache CON el extra_meta completo (source_url, pdf_url, etc.)
    content_path = write_to_cache(
        source, external_id, content_bytes, filename,
        meta={"source": source, "external_id": external_id, **extra_meta},
    )

    if content_path.suffix == ".pdf":
        return FileResponse(
            path=str(content_path),
            media_type="application/pdf",
            headers={"Content-Disposition": "inline", "X-Frame-Options": "SAMEORIGIN"},
        )
    raw_html = content_path.read_text(encoding="utf-8", errors="replace")
    if source == "gutenberg":
        meta_data = read_meta(source, external_id)
        source_url = meta_data.get("source_url", "")
        if source_url:
            base_url = source_url.rsplit("/", 1)[0] + "/"
            raw_html = _rewrite_gutenberg_html(raw_html, base_url)
    return HTMLResponse(content=raw_html, media_type="text/html; charset=utf-8")


# ─── GET /biblioteca/gutenberg-read ──────────────────────────
# Proxy del HTML de Gutenberg — ahora con cache en disco.
# Primera lectura: descarga y guarda. Siguientes: sirve desde cache.
@router.get("/gutenberg-read")
async def gutenberg_proxy(
    url: str = Query(..., description="URL del archivo HTML en Gutenberg"),
    user: User = Depends(get_current_user),
):
    """
    Sirve un libro de Gutenberg desde cache local (si existe) o lo descarga,
    cachea, y sirve. Reescribe URLs relativas y aplica estilos de lectura.
    """
    # 1. Validar que la URL sea de Gutenberg
    if not _is_valid_gutenberg_url(url):
        raise HTTPException(400, "Solo se permiten URLs de Project Gutenberg")

    # 2. Extraer ID para cache
    external_id = _extract_gutenberg_id(url)

    # 3. Intentar servir desde cache (validar que no esté vacío/corrupto)
    cached = get_cached_path("gutenberg", external_id)
    if cached and cached.stat().st_size > 100:
        raw_html = cached.read_text(encoding="utf-8", errors="replace")
    else:
        # 4. Cache miss — descargar y cachear (siempre como UTF-8)
        async def _download() -> bytes:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={
                    "User-Agent": _GUTENBERG_USER_AGENT,
                })
                resp.raise_for_status()
                # resp.text decodifica correctamente (httpx detecta charset),
                # luego re-encode a UTF-8 para cache consistente
                return resp.text.encode("utf-8")

        try:
            content_path = await get_or_download(
                source="gutenberg",
                external_id=external_id,
                download_fn=_download,
                filename="book.html",
                meta={"source_url": url},
            )
            raw_html = content_path.read_text(encoding="utf-8", errors="replace")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                e.response.status_code,
                f"Gutenberg respondió con error {e.response.status_code}",
            ) from None
        except httpx.RequestError:
            raise HTTPException(503, "No se pudo conectar con Project Gutenberg") from None

    # 5. Reescribir URLs + inyectar estilos (se aplica al servir, no al cachear)
    base_url = url.rsplit("/", 1)[0] + "/"
    html = _rewrite_gutenberg_html(raw_html, base_url)

    return HTMLResponse(content=html, media_type="text/html; charset=utf-8")


# ─── GET /biblioteca/{doc_id}/file ────────────────────────────

@router.get("/{doc_id}/file")
def serve_document_file(
    doc_id: str,
    db: Session = Depends(get_db),
):
    """
    Sirve el PDF para visualización inline en el navegador (no descarga).
    No requiere auth para que el iframe pueda cargarlo directamente.
    """
    doc = db.query(LibraryDocument).filter(
        LibraryDocument.id == doc_id,
        LibraryDocument.is_active.is_(True),
    ).first()
    if not doc or not doc.file_path:
        raise HTTPException(404, "Archivo no encontrado")

    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(404, "Archivo no encontrado en disco")

    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        headers={"Content-Disposition": "inline", "X-Frame-Options": "SAMEORIGIN"},
    )


# ─── GET /biblioteca/{doc_id} ─────────────────────────────────

@router.get("/{doc_id}")
def get_document(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(LibraryDocument).filter(
        LibraryDocument.id == doc_id,
        LibraryDocument.is_active.is_(True),
    ).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    # Incrementar vistas
    doc.views = (doc.views or 0) + 1
    db.commit()

    saved_ids = _get_saved_ids(user.id, db) if user else set()
    return _doc_to_dict(doc, saved_ids)


# ─── POST /biblioteca/{doc_id}/save ───────────────────────────

@router.post("/{doc_id}/save")
def toggle_save(
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Guardar / quitar guardado de un documento."""
    doc = db.query(LibraryDocument).filter_by(id=doc_id, is_active=True).first()
    if not doc:
        raise HTTPException(404, "No encontrado")

    existing = db.query(LibraryDocumentSave).filter_by(
        document_id=doc_id, user_id=user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}
    else:
        db.add(LibraryDocumentSave(id=gen_id(), document_id=doc_id, user_id=user.id))
        db.commit()
        return {"saved": True}


# ─── GET /biblioteca/saved ────────────────────────────────────

@router.get("/user/saved")
def get_saved(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saves = db.query(LibraryDocumentSave).filter_by(user_id=user.id).all()
    ids = [s.document_id for s in saves]
    if not ids:
        return {"items": []}
    docs = db.query(LibraryDocument).filter(
        LibraryDocument.id.in_(ids),
        LibraryDocument.is_active.is_(True),
    ).all()
    saved_set = set(ids)
    return {"items": [_doc_to_dict(d, saved_set) for d in docs]}


# ─── POST /biblioteca/{doc_id}/rate ───────────────────────────

class RateRequest(BaseModel):
    rating: int  # 1-5


@router.post("/{doc_id}/rate")
def rate_document(
    doc_id: str,
    payload: RateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (1 <= payload.rating <= 5):
        raise HTTPException(400, "Rating debe ser entre 1 y 5")

    doc = db.query(LibraryDocument).filter_by(id=doc_id, is_active=True).first()
    if not doc:
        raise HTTPException(404, "No encontrado")

    existing = db.query(LibraryDocumentRating).filter_by(
        document_id=doc_id, user_id=user.id
    ).first()

    if existing:
        doc.rating_sum = (doc.rating_sum or 0) - existing.rating + payload.rating
        existing.rating = payload.rating
    else:
        db.add(LibraryDocumentRating(
            id=gen_id(), document_id=doc_id, user_id=user.id, rating=payload.rating,
        ))
        doc.rating_sum = (doc.rating_sum or 0) + payload.rating
        doc.rating_count = (doc.rating_count or 0) + 1

    db.commit()
    return {"success": True}


# ─── POST /biblioteca/{doc_id}/clone ─────────────────────────
# Clona un documento de la biblioteca al proyecto del usuario

class CloneRequest(BaseModel):
    project_id: str


@router.post("/{doc_id}/clone")
async def clone_to_project(
    doc_id: str,
    payload: CloneRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clona un documento de la biblioteca a un proyecto del usuario.
    - user_shared: copia el archivo PDF/doc al proyecto
    - gutenberg: descarga el HTML, extrae texto plano, guarda como .txt
    El documento queda indexado en el AI engine para chat.
    """
    # 1. Validar proyecto del usuario
    meta = _get_project_meta(payload.project_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(403, "Sin acceso al proyecto")

    # 2. Obtener documento de biblioteca
    doc = db.query(LibraryDocument).filter(
        LibraryDocument.id == doc_id,
        LibraryDocument.is_active.is_(True),
    ).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado en la biblioteca")

    # 2b. Verificar duplicados — no clonar el mismo libro dos veces
    existing_docs = meta.get("documents", [])
    duplicate = next(
        (d for d in existing_docs
         if d.get("source") == "biblioteca" and d.get("library_doc_id") == doc_id),
        None,
    )
    if duplicate:
        return {
            "success": False,
            "duplicate": True,
            "document_name": duplicate.get("name", ""),
            "project_name": meta.get("name", ""),
        }

    docs_dir = _get_project_docs_dir(payload.project_id)
    doc_id_new = uuid.uuid4().hex[:12]
    file_name = ""
    file_path = None
    file_size = 0

    # 3. Según source_type, obtener el archivo
    if doc.source_type == "user_shared" and doc.file_path:
        # Copiar archivo existente
        src = Path(doc.file_path)
        if not src.exists():
            raise HTTPException(404, "Archivo original no encontrado en disco")
        file_name = src.name
        file_path = docs_dir / file_name
        # Evitar colisión de nombres
        if file_path.exists():
            file_name = f"{doc_id_new}_{src.name}"
            file_path = docs_dir / file_name
        shutil.copy2(src, file_path)
        file_size = file_path.stat().st_size

    elif doc.source_type == "gutenberg" and doc.embed_url:
        # Obtener HTML de Gutenberg — desde cache si existe, si no descargar
        if not _is_valid_gutenberg_url(doc.embed_url):
            raise HTTPException(400, "URL de origen no permitida")

        external_id = _extract_gutenberg_id(doc.embed_url)
        cached = get_cached_path("gutenberg", external_id)

        if cached:
            # Cache hit — leer desde disco local
            html = cached.read_text(encoding="utf-8", errors="replace")
        else:
            # Cache miss — descargar y cachear para futuros reads
            try:
                async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                    resp = await client.get(doc.embed_url, headers={
                        "User-Agent": _GUTENBERG_USER_AGENT,
                    })
                    resp.raise_for_status()
                    html = resp.text
                # Cachear como UTF-8 (resp.text ya está decodificado correctamente
                # por httpx; resp.content podría ser Latin-1/Windows-1252 raw)
                write_to_cache(
                    "gutenberg", external_id, html.encode("utf-8"),
                    "book.html", {"source_url": doc.embed_url},
                )
            except httpx.HTTPError:
                raise HTTPException(503, "No se pudo descargar el libro de Gutenberg") from None

        # Extraer texto plano del HTML
        text_content = re.sub(r'<[^>]+>', '', html)
        text_content = re.sub(r'\s+', ' ', text_content).strip()

        # Guardar como .txt en el proyecto
        safe_title = re.sub(r'[^\w\s-]', '', doc.title or "libro")[:80].strip()
        file_name = f"{safe_title}.txt"
        file_path = docs_dir / file_name
        if file_path.exists():
            file_name = f"{doc_id_new}_{file_name}"
            file_path = docs_dir / file_name
        file_path.write_text(text_content, encoding="utf-8")
        file_size = file_path.stat().st_size

    else:
        raise HTTPException(400, "Este documento no se puede clonar (sin archivo ni URL)")

    # 4. Extraer texto e indexar en AI engine
    from ai_engine import AIEngine
    from document_processor import DocumentProcessor

    processor = DocumentProcessor()
    engine = AIEngine()

    text = processor.extract_text(str(file_path))
    engine.add_document(payload.project_id, doc_id_new, file_name, text)

    # 5. Determinar tipo de archivo
    ext = file_path.suffix.lower().lstrip('.')
    type_map = {
        'pdf': 'pdf', 'doc': 'docx', 'docx': 'docx',
        'xls': 'xlsx', 'xlsx': 'xlsx', 'ppt': 'pptx', 'pptx': 'pptx',
        'txt': 'txt', 'csv': 'csv',
        'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image',
    }
    doc_type = type_map.get(ext, 'other')

    # 6. Generar citación APA
    citation_apa = _generate_citation_apa(doc.title, doc.author, doc.year, doc.source_type)

    # 7. Actualizar meta.json del proyecto (con metadata para dedup y citación)
    meta.setdefault("documents", []).append({
        "id": doc_id_new,
        "name": file_name,
        "path": str(file_path),
        "size": file_size,
        "type": doc_type,
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "processed": True,
        "source": "biblioteca",
        "library_doc_id": doc_id,
        "library_author": doc.author or "",
        "library_year": doc.year,
        "library_title": doc.title or "",
        "citation_apa": citation_apa,
    })
    _save_project_meta(payload.project_id, meta)

    # 7. Actualizar storage del usuario
    user.storage_used_bytes = (user.storage_used_bytes or 0) + file_size
    db.commit()

    return {
        "success": True,
        "document": {
            "id": doc_id_new,
            "name": file_name,
            "type": doc_type,
            "size": file_size,
        },
        "project_name": meta.get("name", ""),
        "citation_apa": citation_apa,
    }
