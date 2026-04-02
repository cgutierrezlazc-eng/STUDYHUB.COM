"""Marketplace for sharing study documents between students."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, SharedDocument, DocumentRating, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


class ShareRequest(BaseModel):
    title: str
    description: str = ""
    course_name: str = ""
    file_path: str  # Base64 or URL


@router.get("/documents")
def list_shared(
    search: str = "",
    university: str = "",
    career: str = "",
    page: int = 1,
    db: Session = Depends(get_db)
):
    """List shared documents with optional filters."""
    q = db.query(SharedDocument).order_by(desc(SharedDocument.created_at))
    if search:
        q = q.filter(SharedDocument.title.ilike(f"%{search}%") | SharedDocument.course_name.ilike(f"%{search}%"))
    if university:
        q = q.filter(SharedDocument.university.ilike(f"%{university}%"))
    if career:
        q = q.filter(SharedDocument.career.ilike(f"%{career}%"))

    total = q.count()
    docs = q.offset((page - 1) * 20).limit(20).all()

    return {
        "total": total,
        "page": page,
        "documents": [{
            "id": d.id,
            "title": d.title,
            "description": d.description or "",
            "fileType": d.file_type,
            "university": d.university or "",
            "career": d.career or "",
            "courseName": d.course_name or "",
            "downloads": d.downloads or 0,
            "rating": round(d.rating_sum / d.rating_count, 1) if d.rating_count else 0,
            "ratingCount": d.rating_count or 0,
            "author": {
                "id": d.author.id,
                "username": d.author.username,
                "firstName": d.author.first_name,
                "lastName": d.author.last_name,
                "avatar": d.author.avatar,
            } if d.author else None,
            "createdAt": d.created_at.isoformat() if d.created_at else "",
        } for d in docs],
    }


@router.post("/documents")
def share_document(
    req: ShareRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a document to the marketplace."""
    doc = SharedDocument(
        id=gen_id(),
        user_id=user.id,
        title=req.title,
        description=req.description,
        file_path=req.file_path,
        university=user.university or "",
        career=user.career or "",
        course_name=req.course_name,
    )
    db.add(doc)

    # Award XP for sharing
    from gamification import award_xp, XP_REWARDS
    award_xp(user, XP_REWARDS["document_shared"], db)

    db.commit()
    return {"id": doc.id, "title": doc.title, "status": "shared"}


@router.post("/documents/{doc_id}/rate")
def rate_document(
    doc_id: str,
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a shared document (1-5)."""
    rating_val = data.get("rating", 5)
    if not 1 <= rating_val <= 5:
        raise HTTPException(400, "Rating debe ser entre 1 y 5")

    doc = db.query(SharedDocument).filter(SharedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")

    existing = db.query(DocumentRating).filter(
        DocumentRating.document_id == doc_id,
        DocumentRating.user_id == user.id
    ).first()

    if existing:
        doc.rating_sum = (doc.rating_sum or 0) - existing.rating + rating_val
        existing.rating = rating_val
    else:
        doc.rating_sum = (doc.rating_sum or 0) + rating_val
        doc.rating_count = (doc.rating_count or 0) + 1
        rating = DocumentRating(id=gen_id(), document_id=doc_id, user_id=user.id, rating=rating_val)
        db.add(rating)

    db.commit()
    avg = round(doc.rating_sum / doc.rating_count, 1) if doc.rating_count else 0
    return {"rating": avg, "count": doc.rating_count}


@router.post("/documents/{doc_id}/download")
def download_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Track document download."""
    doc = db.query(SharedDocument).filter(SharedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    doc.downloads = (doc.downloads or 0) + 1
    db.commit()
    return {"filePath": doc.file_path, "downloads": doc.downloads}
