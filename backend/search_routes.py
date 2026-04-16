"""Academic search engine with AI summaries and safe content filtering."""
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

from ai_engine import AIEngine
from database import User, UserDownload, gen_id, get_db
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from middleware import get_current_user, get_tier, get_tier_limits, require_tier
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/search", tags=["search"])
ai_engine = AIEngine()

GOOGLE_API_KEY = os.environ.get("GOOGLE_SEARCH_API_KEY", "")
GOOGLE_CX = os.environ.get("GOOGLE_SEARCH_CX", "")  # Custom Search Engine ID
BING_API_KEY = os.environ.get("BING_SEARCH_API_KEY", "")

DOWNLOADS_DIR = Path.home() / ".conniku" / "downloads"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Blocked content keywords (violence, adult, non-academic)
BLOCKED_KEYWORDS = {
    "pornografía", "xxx", "porn", "sex", "gore", "murder", "killing",
    "weapons", "armas", "drogas", "drugs", "casino", "gambling", "apuestas",
    "narco", "terrorismo", "terrorism", "torture", "tortura", "suicide",
    "suicidio", "hack", "cracking", "piracy", "piratería",
}

ACADEMIC_BOOST = [
    "university", "academic", "research", "study", "education", "thesis",
    "journal", "paper", "universidad", "académico", "investigación", "estudio",
    "educación", "tesis", "artículo", "PDF", "tutorial", "curso", "lecture",
]


def _is_safe_query(query: str) -> bool:
    """Check if query is safe for academic search."""
    q_lower = query.lower()
    return not any(kw in q_lower for kw in BLOCKED_KEYWORDS)


def _search_google(query: str, page: int = 1) -> list[dict]:
    """Search using Google Custom Search API with SafeSearch."""
    if not GOOGLE_API_KEY or not GOOGLE_CX:
        return []
    try:
        start = (page - 1) * 10 + 1
        params = urllib.parse.urlencode({
            "key": GOOGLE_API_KEY,
            "cx": GOOGLE_CX,
            "q": query,
            "safe": "active",  # SafeSearch ON
            "start": start,
            "num": 10,
        })
        url = f"https://www.googleapis.com/customsearch/v1?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": "Conniku/2.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        results = []
        for item in data.get("items", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "displayUrl": item.get("displayLink", ""),
                "thumbnail": item.get("pagemap", {}).get("cse_thumbnail", [{}])[0].get("src") if item.get("pagemap", {}).get("cse_thumbnail") else None,
                "fileFormat": item.get("fileFormat", ""),
            })
        return results
    except Exception as e:
        print(f"[Search] Google error: {e}")
        return []


def _search_bing(query: str, page: int = 1) -> list[dict]:
    """Fallback: Search using Bing Web Search API."""
    if not BING_API_KEY:
        return []
    try:
        offset = (page - 1) * 10
        params = urllib.parse.urlencode({
            "q": query,
            "count": 10,
            "offset": offset,
            "safeSearch": "Strict",
            "mkt": "es-CL",
        })
        url = f"https://api.bing.microsoft.com/v7.0/search?{params}"
        req = urllib.request.Request(url, headers={
            "Ocp-Apim-Subscription-Key": BING_API_KEY,
            "User-Agent": "Conniku/2.0",
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        results = []
        for item in data.get("webPages", {}).get("value", []):
            results.append({
                "title": item.get("name", ""),
                "url": item.get("url", ""),
                "snippet": item.get("snippet", ""),
                "displayUrl": item.get("displayUrl", ""),
                "thumbnail": None,
                "fileFormat": "",
            })
        return results
    except Exception as e:
        print(f"[Search] Bing error: {e}")
        return []


def _search_duckduckgo(query: str, page: int = 1) -> list[dict]:
    """Free fallback search using DuckDuckGo HTML (no API key needed)."""
    import re
    try:
        url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; ConnikusBot/1.0)"}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        results = []
        # Parse DuckDuckGo HTML results
        blocks = re.findall(
            r'<a rel="nofollow" class="result__a" href="(.*?)">(.*?)</a>.*?<a class="result__snippet".*?>(.*?)</a>',
            html, re.DOTALL,
        )
        for href, title, snippet in blocks[:10]:
            # Clean HTML tags
            title = re.sub(r'<.*?>', '', title).strip()
            snippet = re.sub(r'<.*?>', '', snippet).strip()
            if href.startswith('//duckduckgo.com/l/?uddg='):
                href = urllib.parse.unquote(href.split('uddg=')[1].split('&')[0])
            results.append({
                "title": title,
                "snippet": snippet,
                "url": href,
                "displayUrl": href[:60] + "..." if len(href) > 60 else href,
            })
        return results
    except Exception as e:
        print(f"[DuckDuckGo Search Error] {e}")
        return []


# ─── Search Endpoints ───────────────────────────────────────

@router.get("/web")
def search_web(q: str, page: int = 1, user: User = Depends(get_current_user)):
    """Search the web with academic filtering and SafeSearch."""
    if not q or len(q) < 2:
        raise HTTPException(400, "Búsqueda muy corta")
    if not _is_safe_query(q):
        raise HTTPException(400, "Búsqueda no permitida. Conniku solo permite contenido académico.")

    # Add academic context to query
    academic_query = f"{q} (academic OR university OR education OR research)"

    # Try Google first, fallback to Bing, then DuckDuckGo (free)
    results = _search_google(academic_query, page)
    if not results:
        results = _search_bing(academic_query, page)
    if not results:
        results = _search_duckduckgo(q, page)

    # If nothing worked at all, show config message
    if not results and not GOOGLE_API_KEY and not BING_API_KEY:
        return {
            "query": q,
            "results": [],
            "message": "APIs de búsqueda no configuradas. Configura GOOGLE_SEARCH_API_KEY o BING_SEARCH_API_KEY.",
            "aiSummary": None,
        }

    return {
        "query": q,
        "results": results,
        "totalResults": len(results),
        "page": page,
        "aiSummary": None,  # AI summary generated separately
    }


@router.post("/ai-summary")
def ai_search_summary(data: dict, user: User = Depends(get_current_user)):
    """Generate AI summary of search results (Pro/Max only)."""
    require_tier(user, "pro")

    query = data.get("query", "")
    results = data.get("results", [])
    lang = user.language or "es"

    if not results:
        raise HTTPException(400, "No hay resultados para resumir")

    snippets = "\n".join([f"- {r.get('title', '')}: {r.get('snippet', '')}" for r in results[:5]])

    system = f"""Eres un asistente de investigación académica. El estudiante buscó: "{query}".
Basándote en estos resultados, genera un resumen útil para el estudiante.
Incluye: puntos clave, fuentes más relevantes, y sugerencias de búsqueda adicionales.
Responde en {'español' if lang == 'es' else 'English' if lang == 'en' else lang}.
Sé conciso pero completo. Máximo 200 palabras."""

    try:
        summary = ai_engine._call_gemini(system, f"Resultados encontrados:\n{snippets}")
        return {"summary": summary.strip()}
    except Exception:
        return {"summary": "No se pudo generar el resumen."}


# ─── Downloads Management ───────────────────────────────────

@router.post("/download-to-conniku")
def download_to_conniku(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Download a file from URL and save to user's Conniku storage."""
    require_tier(user, "pro")

    url = data.get("url", "").strip()
    filename = data.get("filename", "").strip()

    if not url:
        raise HTTPException(400, "URL requerida")

    # SSRF protection: block private IPs and non-HTTP schemes
    import ipaddress as _ip
    import socket as _socket
    from urllib.parse import urlparse as _urlparse

    try:
        parsed = _urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise HTTPException(400, "Solo se permiten URLs HTTP/HTTPS")
        hostname = parsed.hostname or ""
        resolved = _socket.getaddrinfo(hostname, None, _socket.AF_UNSPEC, _socket.SOCK_STREAM)
        for _, _, _, _, addr in resolved:
            ip = _ip.ip_address(addr[0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                raise HTTPException(400, "URLs a redes internas no permitidas")
    except (_socket.gaierror, ValueError):
        raise HTTPException(400, "URL inválida") from None

    # Check storage quota
    limits = get_tier_limits(user)
    current_usage = user.storage_used_bytes or 0
    max_storage = limits.get("storage_bytes", 314572800)

    if current_usage >= max_storage:
        raise HTTPException(403, f"Almacenamiento lleno ({current_usage // (1024*1024)} MB / {max_storage // (1024*1024)} MB). Elimina archivos o actualiza tu plan.")

    # Download file
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Conniku/2.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
            content_type = resp.headers.get("Content-Type", "")

            # Max 50MB per file
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(400, "Archivo muy grande (máximo 50 MB)")

            # Check storage again with file size
            if current_usage + len(content) > max_storage:
                raise HTTPException(403, "No hay espacio suficiente en tu almacenamiento.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"No se pudo descargar: {str(e)}")

    # Save to user's download folder
    user_dir = DOWNLOADS_DIR / user.id
    user_dir.mkdir(parents=True, exist_ok=True)

    if not filename:
        filename = url.split("/")[-1].split("?")[0] or f"descarga_{gen_id()[:8]}"

    # Sanitize filename
    filename = "".join(c for c in filename if c.isalnum() or c in ".-_ ").strip()
    if not filename:
        filename = f"descarga_{gen_id()[:8]}"

    file_path = user_dir / filename
    file_path.write_bytes(content)

    # Record in database
    download = UserDownload(
        id=gen_id(), user_id=user.id, filename=filename,
        file_path=str(file_path), file_size=len(content),
        source_url=url, mime_type=content_type,
    )
    db.add(download)

    # Update storage usage
    user.storage_used_bytes = (user.storage_used_bytes or 0) + len(content)
    db.commit()

    return {
        "id": download.id,
        "filename": filename,
        "size": len(content),
        "sizeFormatted": f"{len(content) / 1024:.1f} KB" if len(content) < 1024*1024 else f"{len(content) / (1024*1024):.1f} MB",
        "storageUsed": user.storage_used_bytes,
        "storageLimit": max_storage,
        "storagePercent": round((user.storage_used_bytes / max_storage) * 100, 1),
    }


@router.get("/downloads")
def list_downloads(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List user's downloaded files."""
    downloads = db.query(UserDownload).filter(
        UserDownload.user_id == user.id
    ).order_by(desc(UserDownload.created_at)).all()

    limits = get_tier_limits(user)
    max_storage = limits.get("storage_bytes", 314572800)

    return {
        "downloads": [{
            "id": d.id, "filename": d.filename,
            "size": d.file_size,
            "sizeFormatted": f"{d.file_size / 1024:.1f} KB" if d.file_size < 1024*1024 else f"{d.file_size / (1024*1024):.1f} MB",
            "sourceUrl": d.source_url or "",
            "mimeType": d.mime_type or "",
            "createdAt": d.created_at.isoformat() if d.created_at else "",
        } for d in downloads],
        "storageUsed": user.storage_used_bytes or 0,
        "storageLimit": max_storage,
        "storagePercent": round(((user.storage_used_bytes or 0) / max_storage) * 100, 1),
    }


@router.get("/downloads/{download_id}/file")
def get_download_file(download_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Download a saved file."""
    dl = db.query(UserDownload).filter(
        UserDownload.id == download_id, UserDownload.user_id == user.id
    ).first()
    if not dl:
        raise HTTPException(404, "Archivo no encontrado")

    file_path = Path(dl.file_path)
    if not file_path.exists():
        raise HTTPException(404, "Archivo no disponible")

    return FileResponse(str(file_path), filename=dl.filename, media_type=dl.mime_type or "application/octet-stream")


@router.delete("/downloads/{download_id}")
def delete_download(download_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a downloaded file and free storage."""
    dl = db.query(UserDownload).filter(
        UserDownload.id == download_id, UserDownload.user_id == user.id
    ).first()
    if not dl:
        raise HTTPException(404, "Archivo no encontrado")

    # Delete file
    try:
        Path(dl.file_path).unlink(missing_ok=True)
    except Exception:
        pass

    # Free storage
    user.storage_used_bytes = max(0, (user.storage_used_bytes or 0) - (dl.file_size or 0))
    db.delete(dl)
    db.commit()

    return {"status": "deleted", "freedBytes": dl.file_size, "storageUsed": user.storage_used_bytes}
