"""Mentorship matching system."""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, User, MentorProfile, MentorshipRelation, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/mentorship", tags=["mentorship"])

def user_brief(u):
    if not u: return None
    return {"id": u.id, "username": u.username, "firstName": u.first_name,
            "lastName": u.last_name, "avatar": u.avatar, "career": u.career,
            "university": u.university, "isGraduated": u.is_graduated}

@router.post("/become-mentor")
def become_mentor(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
    if existing:
        # Update
        existing.subjects = json.dumps(data.get("subjects", []))
        existing.availability = data.get("availability", "")
        existing.bio = data.get("bio", "")
        existing.max_mentees = data.get("max_mentees", 3)
        existing.is_active = True
        db.commit()
        return {"status": "updated"}

    profile = MentorProfile(
        id=gen_id(), user_id=user.id,
        subjects=json.dumps(data.get("subjects", [])),
        availability=data.get("availability", ""),
        bio=data.get("bio", ""),
        max_mentees=data.get("max_mentees", 3),
    )
    db.add(profile)
    from gamification import award_xp
    award_xp(user, 15, db)
    db.commit()
    return {"status": "created"}

@router.get("/mentors")
def list_mentors(subject: str = "", university: str = "", page: int = 1,
                 db: Session = Depends(get_db)):
    q = db.query(MentorProfile, User).join(
        User, User.id == MentorProfile.user_id
    ).filter(MentorProfile.is_active == True)
    if subject:
        q = q.filter(MentorProfile.subjects.ilike(f"%{subject}%"))
    if university:
        q = q.filter(User.university.ilike(f"%{university}%"))

    results = q.order_by(desc(MentorProfile.rating_count)).offset((page-1)*20).limit(20).all()
    return [{
        "id": m.id, "subjects": json.loads(m.subjects or "[]"),
        "availability": m.availability or "", "bio": m.bio or "",
        "maxMentees": m.max_mentees, "currentMentees": m.current_mentees or 0,
        "rating": round(m.rating_sum / m.rating_count, 1) if m.rating_count else 0,
        "ratingCount": m.rating_count or 0,
        "mentor": user_brief(u),
    } for m, u in results]

@router.post("/request")
def request_mentorship(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mentor_id = data.get("mentor_id")
    subject = data.get("subject", "")
    message = data.get("message", "")

    if not mentor_id:
        raise HTTPException(400, "mentor_id requerido")
    if mentor_id == user.id:
        raise HTTPException(400, "No puedes ser tu propio mentor")

    profile = db.query(MentorProfile).filter(MentorProfile.user_id == mentor_id).first()
    if not profile or not profile.is_active:
        raise HTTPException(404, "Mentor no disponible")
    if (profile.current_mentees or 0) >= profile.max_mentees:
        raise HTTPException(400, "El mentor tiene cupo lleno")

    relation = MentorshipRelation(
        id=gen_id(), mentor_id=mentor_id, mentee_id=user.id,
        subject=subject, message=message,
    )
    db.add(relation)

    from notification_routes import create_notification
    create_notification(db, mentor_id, "mentorship_request",
        f"{user.first_name} quiere que seas su mentor en {subject}" if subject else f"{user.first_name} quiere que seas su mentor",
        body=message[:100], link="/mentorship", actor_id=user.id, reference_id=relation.id)
    db.commit()
    return {"status": "requested", "id": relation.id}

@router.post("/{relation_id}/accept")
def accept_mentorship(relation_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rel = db.query(MentorshipRelation).filter(
        MentorshipRelation.id == relation_id, MentorshipRelation.mentor_id == user.id
    ).first()
    if not rel:
        raise HTTPException(404, "Solicitud no encontrada")
    rel.status = "active"
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
    if profile:
        profile.current_mentees = (profile.current_mentees or 0) + 1

    from notification_routes import create_notification
    create_notification(db, rel.mentee_id, "mentorship_accepted",
        f"{user.first_name} aceptó ser tu mentor", link="/mentorship", actor_id=user.id)
    db.commit()
    return {"status": "active"}

@router.post("/{relation_id}/complete")
def complete_mentorship(relation_id: str, data: dict,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rel = db.query(MentorshipRelation).filter(MentorshipRelation.id == relation_id).first()
    if not rel or (rel.mentor_id != user.id and rel.mentee_id != user.id):
        raise HTTPException(403, "Sin permiso")
    rel.status = "completed"
    rel.ended_at = datetime.utcnow()

    rating = data.get("rating")
    if rating and rel.mentee_id == user.id:
        rel.mentee_rating = rating
        rel.mentee_review = data.get("review", "")
        profile = db.query(MentorProfile).filter(MentorProfile.user_id == rel.mentor_id).first()
        if profile:
            profile.rating_sum = (profile.rating_sum or 0) + rating
            profile.rating_count = (profile.rating_count or 0) + 1
            profile.current_mentees = max(0, (profile.current_mentees or 1) - 1)

    from gamification import award_xp
    mentor = db.query(User).filter(User.id == rel.mentor_id).first()
    mentee = db.query(User).filter(User.id == rel.mentee_id).first()
    if mentor: award_xp(mentor, 50, db)
    if mentee: award_xp(mentee, 30, db)
    db.commit()
    return {"status": "completed"}

@router.get("/my-mentors")
def my_mentors(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rels = db.query(MentorshipRelation, User).join(
        User, User.id == MentorshipRelation.mentor_id
    ).filter(MentorshipRelation.mentee_id == user.id).order_by(desc(MentorshipRelation.started_at)).all()
    return [{"id": r.id, "status": r.status, "subject": r.subject or "",
             "mentor": user_brief(u), "startedAt": r.started_at.isoformat() if r.started_at else ""} for r, u in rels]

@router.get("/my-mentees")
def my_mentees(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rels = db.query(MentorshipRelation, User).join(
        User, User.id == MentorshipRelation.mentee_id
    ).filter(MentorshipRelation.mentor_id == user.id).order_by(desc(MentorshipRelation.started_at)).all()
    return [{"id": r.id, "status": r.status, "subject": r.subject or "", "message": r.message or "",
             "mentee": user_brief(u), "startedAt": r.started_at.isoformat() if r.started_at else ""} for r, u in rels]

@router.get("/profile")
def get_mentor_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
    if not profile:
        return None
    return {
        "subjects": json.loads(profile.subjects or "[]"), "availability": profile.availability,
        "bio": profile.bio, "maxMentees": profile.max_mentees,
        "currentMentees": profile.current_mentees or 0, "isActive": profile.is_active,
        "rating": round(profile.rating_sum / profile.rating_count, 1) if profile.rating_count else 0,
    }
