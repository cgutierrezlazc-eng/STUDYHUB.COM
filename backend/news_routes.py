"""
University news fetching system and admin announcements for Conniku.
- Fetches RSS feeds and scrapes university news pages every 3 hours
- Only fetches for universities with active registered users
- Caches results as JSON on disk
- Admin can create announcements targeted to all, specific university, or platform
"""
import os
import re
import json
import logging
import hashlib
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, DATA_DIR, engine
from middleware import get_current_user

router = APIRouter(prefix="/news", tags=["news"])
logger = logging.getLogger("conniku.news")

NEWS_DIR = DATA_DIR / "university_news"
NEWS_DIR.mkdir(exist_ok=True)

# How often to fetch news (seconds) - 3 hours
FETCH_INTERVAL = 3 * 60 * 60
# Max news items to cache per university
MAX_ITEMS_PER_UNI = 10
# Max items to return to user
MAX_ITEMS_RESPONSE = 5
# HTTP request timeout
HTTP_TIMEOUT = 15

# ─── Known RSS feeds for common universities ──────────────────
# Maps university name (as stored in user.university) to RSS/news URLs
# Format: { "University Name": { "rss": "url_or_none", "news": "html_news_page_url" } }
UNIVERSITY_SOURCES = {
    # Chile - CRUCH
    "Universidad de Chile": {"rss": "https://www.uchile.cl/rss", "news": "https://www.uchile.cl/noticias"},
    "Pontificia Universidad Catolica de Chile": {"rss": None, "news": "https://www.uc.cl/noticias"},
    "Universidad de Concepcion": {"rss": None, "news": "https://noticias.udec.cl"},
    "Universidad de Santiago de Chile": {"rss": None, "news": "https://www.usach.cl/news"},
    "Pontificia Universidad Catolica de Valparaiso": {"rss": None, "news": "https://www.pucv.cl/pucv/noticias"},
    "Universidad Tecnica Federico Santa Maria": {"rss": None, "news": "https://www.usm.cl/noticias"},
    "Universidad Austral de Chile": {"rss": None, "news": "https://noticias.uach.cl"},
    "Universidad Catolica del Norte": {"rss": None, "news": "https://www.noticias.ucn.cl"},
    "Universidad de Valparaiso": {"rss": None, "news": "https://www.uv.cl/pdn/"},
    "Universidad de Antofagasta": {"rss": None, "news": "https://www.uantof.cl/noticias"},
    "Universidad de La Serena": {"rss": None, "news": "https://www.userena.cl/noticias"},
    "Universidad del Bio-Bio": {"rss": None, "news": "https://noticias.ubiobio.cl"},
    "Universidad de La Frontera": {"rss": None, "news": "https://www.ufro.cl/index.php/noticias"},
    "Universidad de Los Lagos": {"rss": None, "news": "https://www.ulagos.cl/noticias"},
    "Universidad de Magallanes": {"rss": None, "news": "https://www.umag.cl/vcm/"},
    "Universidad de Talca": {"rss": None, "news": "https://www.utalca.cl/noticias"},
    "Universidad de Atacama": {"rss": None, "news": "https://www.uda.cl/index.php/noticias"},
    "Universidad de Tarapaca": {"rss": None, "news": "https://www.uta.cl/web/noticias"},
    "Universidad Arturo Prat": {"rss": None, "news": "https://www.unap.cl/prontus_unap/site/edic/base/port/noticias.html"},
    "Universidad de Playa Ancha": {"rss": None, "news": "https://www.upla.cl/noticias"},
    "Universidad Metropolitana de Ciencias de la Educacion": {"rss": None, "news": "https://www.umce.cl/index.php/noticias"},
    "Universidad Tecnologica Metropolitana": {"rss": None, "news": "https://www.utem.cl/noticias"},
    "Universidad Catolica del Maule": {"rss": None, "news": "https://www.ucm.cl/noticias"},
    "Universidad Catolica de la Santisima Concepcion": {"rss": None, "news": "https://www.ucsc.cl/noticias"},
    "Universidad Catolica de Temuco": {"rss": None, "news": "https://www.uct.cl/noticias"},
    "Universidad de O'Higgins": {"rss": None, "news": "https://www.uoh.cl/noticias/"},
    "Universidad de Aysen": {"rss": None, "news": "https://www.uaysen.cl/noticias"},
    # Chile - Privadas
    "Universidad San Sebastian": {"rss": None, "news": "https://www.uss.cl/noticias"},
    "Universidad del Desarrollo": {"rss": None, "news": "https://www.udd.cl/noticias"},
    "Universidad Diego Portales": {"rss": None, "news": "https://www.udp.cl/noticias"},
    "Universidad Adolfo Ibanez": {"rss": None, "news": "https://noticias.uai.cl"},
    "Universidad Andres Bello": {"rss": None, "news": "https://noticias.unab.cl"},
    "Universidad Mayor": {"rss": None, "news": "https://www.umayor.cl/um/noticias"},
    "Universidad de los Andes": {"rss": None, "news": "https://www.uandes.cl/noticias"},
    "Universidad Finis Terrae": {"rss": None, "news": "https://www.uft.cl/noticias"},
    "Universidad Alberto Hurtado": {"rss": None, "news": "https://www.uahurtado.cl/noticias"},
    "Universidad Central de Chile": {"rss": None, "news": "https://www.ucentral.cl/noticias"},
    "Universidad Autonoma de Chile": {"rss": None, "news": "https://www.uautonoma.cl/noticias"},
    "Universidad Santo Tomas": {"rss": None, "news": "https://www.ust.cl/noticias"},
    "Universidad Bernardo O'Higgins": {"rss": None, "news": "https://www.ubo.cl/noticias"},
    "Universidad de Las Americas": {"rss": None, "news": "https://www.udla.cl/noticias"},
    "Universidad Vina del Mar": {"rss": None, "news": "https://www.uvm.cl/noticias"},
    "UNIACC": {"rss": None, "news": "https://www.uniacc.cl/noticias"},
    # Chile - IPs / CFTs
    "INACAP": {"rss": None, "news": "https://www.inacap.cl/tportalvp/inacap/noticias"},
    "DUOC UC": {"rss": None, "news": "https://www.duoc.cl/noticias"},
    "AIEP": {"rss": None, "news": "https://www.aiep.cl/noticias"},
    # Mexico
    "Universidad Nacional Autonoma de Mexico": {"rss": "https://www.unam.mx/rss", "news": "https://www.unam.mx/noticias"},
    "Tecnologico de Monterrey": {"rss": None, "news": "https://conecta.tec.mx"},
    "Instituto Politecnico Nacional": {"rss": None, "news": "https://www.ipn.mx/CCS/"},
    # Colombia
    "Universidad Nacional de Colombia": {"rss": None, "news": "https://agenciadenoticias.unal.edu.co"},
    # Argentina
    "Universidad de Buenos Aires": {"rss": None, "news": "https://www.uba.ar/noticia/"},
    # Brazil
    "Universidade de Sao Paulo": {"rss": None, "news": "https://jornal.usp.br"},
    # USA
    "Massachusetts Institute of Technology": {"rss": "https://news.mit.edu/rss/feed", "news": "https://news.mit.edu"},
    "Stanford University": {"rss": "https://news.stanford.edu/feed/", "news": "https://news.stanford.edu"},
    "Harvard University": {"rss": None, "news": "https://news.harvard.edu"},
}


# ─── Cache Helpers ────────────────────────────────────────────

def _cache_path(university_name: str) -> Path:
    safe = hashlib.md5(university_name.lower().strip().encode()).hexdigest()
    return NEWS_DIR / f"{safe}.json"


def _read_cache(university_name: str) -> dict:
    path = _cache_path(university_name)
    if not path.exists():
        return {"university": university_name, "fetched_at": None, "items": []}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"university": university_name, "fetched_at": None, "items": []}


def _write_cache(university_name: str, items: list[dict]):
    path = _cache_path(university_name)
    data = {
        "university": university_name,
        "fetched_at": datetime.utcnow().isoformat(),
        "items": items[:MAX_ITEMS_PER_UNI],
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _is_cache_fresh(university_name: str) -> bool:
    """Check if cache is less than FETCH_INTERVAL old."""
    cache = _read_cache(university_name)
    fetched = cache.get("fetched_at")
    if not fetched:
        return False
    try:
        fetched_dt = datetime.fromisoformat(fetched)
        return (datetime.utcnow() - fetched_dt).total_seconds() < FETCH_INTERVAL
    except Exception:
        return False


# ─── News Fetching Logic ─────────────────────────────────────

def _fetch_rss(url: str, university_name: str) -> list[dict]:
    """Fetch and parse an RSS feed. Returns list of news items."""
    try:
        import feedparser
        import httpx

        resp = httpx.get(url, timeout=HTTP_TIMEOUT, follow_redirects=True, headers={
            "User-Agent": "Conniku-NewsBot/1.0 (+https://conniku.com)"
        })
        if resp.status_code != 200:
            logger.warning(f"RSS fetch failed for {university_name}: HTTP {resp.status_code}")
            return []

        feed = feedparser.parse(resp.text)
        items = []
        for entry in feed.entries[:MAX_ITEMS_PER_UNI]:
            # Clean HTML from summary
            summary = entry.get("summary", "") or entry.get("description", "") or ""
            summary = re.sub(r"<[^>]+>", "", summary).strip()
            if len(summary) > 300:
                summary = summary[:297] + "..."

            published = ""
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    published = datetime(*entry.published_parsed[:6]).isoformat()
                except Exception:
                    pass
            elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                try:
                    published = datetime(*entry.updated_parsed[:6]).isoformat()
                except Exception:
                    pass

            items.append({
                "title": (entry.get("title") or "Sin título").strip(),
                "url": entry.get("link", ""),
                "summary": summary,
                "published": published,
                "source": university_name,
                "imageUrl": _extract_image_from_entry(entry),
            })
        return items
    except Exception as e:
        logger.warning(f"RSS parse error for {university_name}: {e}")
        return []


def _extract_image_from_entry(entry) -> str:
    """Try to extract an image URL from an RSS entry."""
    # Check media:thumbnail
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        return entry.media_thumbnail[0].get("url", "")
    # Check media:content
    if hasattr(entry, "media_content") and entry.media_content:
        for m in entry.media_content:
            if "image" in m.get("type", ""):
                return m.get("url", "")
    # Check enclosures
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if "image" in enc.get("type", ""):
                return enc.get("href", enc.get("url", ""))
    # Try to extract from summary HTML
    summary = entry.get("summary", "") or ""
    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary)
    if img_match:
        return img_match.group(1)
    return ""


def _scrape_news_page(url: str, university_name: str) -> list[dict]:
    """Scrape a university news HTML page for article links and titles."""
    try:
        import httpx
        from bs4 import BeautifulSoup

        resp = httpx.get(url, timeout=HTTP_TIMEOUT, follow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (compatible; Conniku-NewsBot/1.0; +https://conniku.com)"
        })
        if resp.status_code != 200:
            logger.warning(f"Scrape failed for {university_name}: HTTP {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        items = []

        # Strategy 1: Look for article/news card patterns
        # Common patterns: <article>, <div class="*news*">, <div class="*noticia*">
        articles = soup.find_all("article")
        if not articles:
            articles = soup.find_all("div", class_=re.compile(r"(news|noticia|post|entry|item|card)", re.I))
        if not articles:
            articles = soup.find_all("li", class_=re.compile(r"(news|noticia|post|entry|item)", re.I))

        for article in articles[:MAX_ITEMS_PER_UNI]:
            # Find title - look for heading or strong link
            title_el = article.find(["h1", "h2", "h3", "h4", "h5"])
            if not title_el:
                title_el = article.find("a")
            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            if not title or len(title) < 5:
                continue

            # Find link
            link_el = title_el if title_el.name == "a" else title_el.find("a")
            if not link_el:
                link_el = article.find("a")
            href = link_el.get("href", "") if link_el else ""
            if href and not href.startswith("http"):
                # Make absolute
                from urllib.parse import urljoin
                href = urljoin(url, href)

            # Find summary/excerpt
            summary = ""
            p_el = article.find("p")
            if p_el:
                summary = p_el.get_text(strip=True)
                if len(summary) > 300:
                    summary = summary[:297] + "..."

            # Find image
            img_url = ""
            img_el = article.find("img")
            if img_el:
                img_url = img_el.get("src", "") or img_el.get("data-src", "")
                if img_url and not img_url.startswith("http"):
                    from urllib.parse import urljoin
                    img_url = urljoin(url, img_url)

            # Find date
            published = ""
            time_el = article.find("time")
            if time_el:
                published = time_el.get("datetime", "") or time_el.get_text(strip=True)
            else:
                date_el = article.find(class_=re.compile(r"(date|fecha|time)", re.I))
                if date_el:
                    published = date_el.get_text(strip=True)

            items.append({
                "title": title,
                "url": href,
                "summary": summary,
                "published": published,
                "source": university_name,
                "imageUrl": img_url,
            })

        # Strategy 2: If no articles found, fallback to finding news links
        if not items:
            for a_tag in soup.find_all("a", href=True):
                href = a_tag.get("href", "")
                text = a_tag.get_text(strip=True)
                # Look for links that seem like news articles
                if (
                    text and len(text) > 15
                    and any(kw in href.lower() for kw in ["noticia", "news", "articulo", "article", "blog", "post"])
                ):
                    if not href.startswith("http"):
                        from urllib.parse import urljoin
                        href = urljoin(url, href)
                    items.append({
                        "title": text,
                        "url": href,
                        "summary": "",
                        "published": "",
                        "source": university_name,
                        "imageUrl": "",
                    })
                    if len(items) >= MAX_ITEMS_PER_UNI:
                        break

        return items
    except Exception as e:
        logger.warning(f"Scrape error for {university_name}: {e}")
        return []


def _fetch_university_news(university_name: str) -> list[dict]:
    """Fetch news for a university. Tries RSS first, then HTML scraping."""
    source = UNIVERSITY_SOURCES.get(university_name)
    if not source:
        logger.debug(f"No source configured for: {university_name}")
        return []

    items = []

    # Try RSS first
    rss_url = source.get("rss")
    if rss_url:
        items = _fetch_rss(rss_url, university_name)
        if items:
            logger.info(f"Got {len(items)} news items via RSS for {university_name}")
            return items

    # Fallback to HTML scraping
    news_url = source.get("news")
    if news_url:
        items = _scrape_news_page(news_url, university_name)
        if items:
            logger.info(f"Got {len(items)} news items via scraping for {university_name}")
            return items

    logger.info(f"No news found for {university_name}")
    return []


# ─── Background Scheduler ────────────────────────────────────

def _get_active_universities() -> list[str]:
    """Get list of university names that have at least one registered user."""
    from sqlalchemy.orm import Session as SASession
    with SASession(engine) as db:
        results = (
            db.query(User.university)
            .filter(User.university.isnot(None), User.university != "")
            .distinct()
            .all()
        )
        return [r[0] for r in results if r[0]]


def _fetch_all_active_universities():
    """Fetch news for all universities with active users. Runs in background."""
    try:
        universities = _get_active_universities()
        logger.info(f"News fetch cycle: {len(universities)} active universities")

        fetched = 0
        for uni in universities:
            if _is_cache_fresh(uni):
                continue  # Skip if recently fetched
            try:
                items = _fetch_university_news(uni)
                if items:
                    _write_cache(uni, items)
                    fetched += 1
                else:
                    # Write empty cache so we don't retry immediately
                    _write_cache(uni, [])
            except Exception as e:
                logger.warning(f"Failed to fetch news for {uni}: {e}")
            # Small delay between requests to be polite
            time.sleep(2)

        logger.info(f"News fetch cycle complete: fetched {fetched}/{len(universities)} universities")
    except Exception as e:
        logger.error(f"News fetch cycle error: {e}")


def _news_scheduler_loop():
    """Background thread that fetches news every FETCH_INTERVAL seconds."""
    # Wait 60 seconds after startup before first fetch
    time.sleep(60)
    logger.info("News scheduler started (interval: 3 hours)")

    while True:
        try:
            _fetch_all_active_universities()
        except Exception as e:
            logger.error(f"News scheduler error: {e}")
        time.sleep(FETCH_INTERVAL)


# Start background scheduler thread on module load
_scheduler_thread = threading.Thread(
    target=_news_scheduler_loop,
    daemon=True,
    name="conniku-news-scheduler",
)
_scheduler_thread.start()


# ─── API Endpoints ────────────────────────────────────────────

@router.get("/university")
def get_university_news(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get cached news for the current user's university."""
    university = getattr(user, "university", "") or ""
    if not university:
        return {"university": "", "items": [], "message": "No university set"}

    cache = _read_cache(university)
    items = cache.get("items", [])[:MAX_ITEMS_RESPONSE]
    fetched_at = cache.get("fetched_at")

    source = UNIVERSITY_SOURCES.get(university)
    return {
        "university": university,
        "items": items,
        "fetchedAt": fetched_at,
        "sourceUrl": source.get("news") if source else None,
        "hasSource": university in UNIVERSITY_SOURCES,
    }


@router.post("/fetch")
def trigger_news_fetch(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only: manually trigger a news fetch for a university."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores")

    university = data.get("university", "").strip()
    if not university:
        raise HTTPException(400, "Se requiere el nombre de la universidad")

    # Fetch immediately (in this request, synchronous)
    items = _fetch_university_news(university)
    if items:
        _write_cache(university, items)

    return {
        "status": "completed",
        "university": university,
        "itemsFetched": len(items),
        "items": items[:5],
    }


@router.get("/status")
def get_news_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only: check news system status."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores")

    # Count cached files
    cache_files = list(NEWS_DIR.glob("*.json"))
    active_unis = _get_active_universities()
    configured_unis = [u for u in active_unis if u in UNIVERSITY_SOURCES]

    return {
        "schedulerRunning": _scheduler_thread.is_alive(),
        "fetchInterval": f"{FETCH_INTERVAL // 3600}h",
        "cachedUniversities": len(cache_files),
        "activeUniversities": len(active_unis),
        "configuredSources": len(configured_unis),
        "totalSourcesKnown": len(UNIVERSITY_SOURCES),
        "unconfiguredActive": [u for u in active_unis if u not in UNIVERSITY_SOURCES],
    }


# ─── Admin Announcements ─────────────────────────────────────

@router.post("/announcements")
def create_announcement(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin creates an announcement. Target: 'all', 'university:NAME', 'conniku'."""
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores")

    from database import WallPost, gen_id

    target = data.get("target", "all")
    content = data.get("content", "")
    image_url = data.get("image_url", "")

    if not content.strip():
        raise HTTPException(400, "El contenido no puede estar vacío")

    post = WallPost(
        id=gen_id(),
        wall_owner_id=user.id,
        author_id=user.id,
        content=content,
        image_url=image_url,
        visibility="friends",
        is_milestone=True,
        milestone_type=f"announcement:{target}",
    )
    db.add(post)
    db.commit()
    logger.info(f"Announcement created by {user.id}: target={target}, id={post.id}")
    return {"id": post.id, "status": "created", "target": target}


@router.get("/announcements")
def get_announcements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get announcements relevant to the current user."""
    from database import WallPost

    announcements = (
        db.query(WallPost)
        .filter(
            WallPost.is_milestone == True,
            WallPost.milestone_type.like("announcement:%"),
        )
        .order_by(desc(WallPost.created_at))
        .limit(10)
        .all()
    )

    result = []
    for post in announcements:
        target = (post.milestone_type or "").replace("announcement:", "")
        if target == "all" or target == "conniku":
            pass
        elif target.startswith("university:"):
            uni_name = target.replace("university:", "")
            if (getattr(user, "university", "") or "") != uni_name:
                continue
        else:
            continue

        from social_routes import user_brief
        author = db.query(User).filter(User.id == post.author_id).first()
        result.append({
            "id": post.id,
            "author": user_brief(author) if author else None,
            "content": post.content,
            "imageUrl": post.image_url,
            "target": target,
            "createdAt": post.created_at.isoformat() if post.created_at else "",
        })

    return result
