"""
University news fetching system and admin announcements for Conniku.
News is cached as JSON files on disk. Announcements use WallPost with special milestone_type.
"""
import os
import json
import logging
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, User, DATA_DIR
from middleware import get_current_user

router = APIRouter(prefix="/news", tags=["news"])
logger = logging.getLogger(__name__)

NEWS_DIR = DATA_DIR / "university_news"
NEWS_DIR.mkdir(exist_ok=True)

# University RSS/news sources - map university name to news URL
UNIVERSITY_NEWS_SOURCES = {
    # Chile - major universities with known news pages
    "Universidad de Chile": {"url": "https://www.uchile.cl/noticias", "rss": None},
    "Pontificia Universidad Catolica de Chile": {"url": "https://www.uc.cl/noticias", "rss": None},
    "Universidad de Santiago de Chile": {"url": "https://www.usach.cl/noticias", "rss": None},
    "Universidad de Concepcion": {"url": "https://www.udec.cl/pexterno/", "rss": None},
    "Universidad Tecnica Federico Santa Maria": {"url": "https://www.usm.cl/noticias/", "rss": None},
}


def _cache_filename(university_name: str) -> Path:
    """Generate a safe cache filename for a university."""
    safe = hashlib.md5(university_name.lower().encode()).hexdigest()
    return NEWS_DIR / f"{safe}.json"


def _read_cached_news(university_name: str, max_items: int = 5) -> list[dict]:
    """Read cached news for a university from disk."""
    path = _cache_filename(university_name)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        items = data.get("items", [])
        return items[:max_items]
    except Exception as e:
        logger.warning(f"Failed to read news cache for {university_name}: {e}")
        return []


def _write_cached_news(university_name: str, items: list[dict]):
    """Write news items to cache."""
    path = _cache_filename(university_name)
    data = {
        "university": university_name,
        "fetched_at": datetime.utcnow().isoformat(),
        "items": items,
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ─── University News Endpoints ─────────────────────────────────


@router.get("/university")
def get_university_news(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get cached news for the current user's university. Returns up to 5 items."""
    university = getattr(user, "university", "") or ""
    if not university:
        return {"university": "", "items": [], "message": "No university set on profile"}

    items = _read_cached_news(university, max_items=5)
    source = UNIVERSITY_NEWS_SOURCES.get(university)

    return {
        "university": university,
        "items": items,
        "sourceUrl": source["url"] if source else None,
        "cached": True,
    }


@router.post("/fetch")
def trigger_news_fetch(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only: manually trigger a news fetch for a university.
    Actual RSS/scraping is not yet implemented - this is a placeholder.
    """
    if not user.is_admin:
        raise HTTPException(403, "Solo administradores pueden ejecutar esta acción")

    university = data.get("university", "")
    if not university:
        raise HTTPException(400, "Se requiere el nombre de la universidad")

    return {
        "status": "queued",
        "university": university,
        "message": f"News fetch queued for '{university}'. Actual scraping/RSS not yet implemented.",
    }


# ─── Admin Announcements ───────────────────────────────────────


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

    target = data.get("target", "all")  # all | university:UniversityName | conniku
    content = data.get("content", "")
    image_url = data.get("image_url", "")

    if not content.strip():
        raise HTTPException(400, "El contenido no puede estar vacío")

    # Create announcement as a wall post on admin's wall with special milestone_type
    post = WallPost(
        id=gen_id(),
        wall_owner_id=user.id,
        author_id=user.id,
        content=content,
        image_url=image_url,
        visibility="friends",  # will be filtered by target logic
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

    # Get all announcement posts, newest first
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
        # Filter by target
        if target == "all":
            pass  # show to everyone
        elif target.startswith("university:"):
            uni_name = target.replace("university:", "")
            if (getattr(user, "university", "") or "") != uni_name:
                continue
        elif target == "conniku":
            pass  # show to everyone (platform announcements)
        else:
            continue

        from social_routes import user_brief

        author = db.query(User).filter(User.id == post.author_id).first()
        result.append(
            {
                "id": post.id,
                "author": user_brief(author) if author else None,
                "content": post.content,
                "imageUrl": post.image_url,
                "target": target,
                "createdAt": post.created_at.isoformat() if post.created_at else "",
            }
        )

    return result
