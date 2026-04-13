"""
Biblioteca Conniku — Rutas de la biblioteca académica.

Fuentes de documentos:
- user_shared: PDFs/docs que los usuarios comparten desde sus asignaturas (copia independiente)
- open_library: libros embebidos vía archive.org (visualización dentro de Conniku)
- gutenberg: libros de dominio público vía Project Gutenberg (gutendex.com API)

Principio: todo se visualiza DENTRO de Conniku. Si un libro no permite embed, no se incluye.
"""
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from database import (
    DATA_DIR, LibraryDocument, LibraryDocumentRating, LibraryDocumentSave,
    User, gen_id, get_db,
)
from middleware import get_current_user

router = APIRouter(prefix="/biblioteca", tags=["biblioteca"])

LIBRARY_DIR = DATA_DIR / "biblioteca"
LIBRARY_DIR.mkdir(exist_ok=True)

PROJECTS_DIR = DATA_DIR / "projects"


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
        "shared_by": doc.shared_by.full_name or doc.shared_by.username if doc.shared_by else None,
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
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Listar documentos de la biblioteca con búsqueda y filtros."""
    q_obj = db.query(LibraryDocument).filter(LibraryDocument.is_active == True)

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

    saved_ids = _get_saved_ids(user.id, db)
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
    year: Optional[int] = None
    tags: List[str] = []


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
        author=payload.author or (user.full_name or user.username or ""),
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
        LibraryDocument.is_active == True,
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
        LibraryDocument.is_active == True,
    ).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    # Incrementar vistas
    doc.views = (doc.views or 0) + 1
    db.commit()

    saved_ids = _get_saved_ids(user.id, db)
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
        LibraryDocument.is_active == True,
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


# ─── GET /biblioteca/public-search ────────────────────────────

def _gutenberg_book_to_dict(b: dict) -> dict:
    """Convierte un resultado de gutendex.com al formato LibDoc."""
    formats = b.get("formats", {})
    # Prefiere HTML para lectura inline; fallback a texto plano
    read_url = (
        formats.get("text/html")
        or formats.get("text/html; charset=utf-8")
        or formats.get("text/html; charset=us-ascii")
        or formats.get("text/plain; charset=utf-8")
        or ""
    )
    cover_url = formats.get("image/jpeg") or ""
    authors = ", ".join(a.get("name", "") for a in b.get("authors", []))
    # Inferir categoría desde subjects
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
    elif any(k in sub_lower for k in ["philosophy", "ethics"]):
        category = "humanidades"
    elif any(k in sub_lower for k in ["history"]):
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
    user: User = Depends(get_current_user),
):
    """
    Busca libros de dominio público en Project Gutenberg vía gutendex.com.
    No almacena datos, es una búsqueda en tiempo real.
    """
    params: dict = {"page": page}
    if q.strip():
        params["search"] = q.strip()
    if lang:
        params["languages"] = lang
    # Ordenar por popularidad (descargas) cuando no hay query
    if not q.strip():
        params["sort"] = "popular"

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get("https://gutendex.com/books/", params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(503, "No se pudo conectar con Project Gutenberg. Intenta de nuevo.")

    books = data.get("results", [])
    # Filtrar libros sin URL de lectura (no sirven para visualización)
    books = [b for b in books if any(
        k.startswith("text/html") or k.startswith("text/plain")
        for k in b.get("formats", {})
    )]

    return {
        "items": [_gutenberg_book_to_dict(b) for b in books],
        "total": data.get("count", 0),
        "page": page,
        "next": data.get("next"),
    }
