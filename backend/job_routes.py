"""Job board / Bolsa de empleo for students and graduates."""
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from database import (get_db, User, JobListing, JobApplication, UserCareerStatus,
                      AcademicMilestone, WallPost, StudentCV, KonniBroadcast, gen_id)
from middleware import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


def user_brief(u):
    if not u: return None
    return {"id": u.id, "username": u.username, "firstName": u.first_name,
            "lastName": u.last_name, "avatar": u.avatar, "university": u.university,
            "career": u.career, "isGraduated": u.is_graduated}


# ─── Career Status ──────────────────────────────────────────

class CareerStatusRequest(BaseModel):
    status: str = "studying"
    is_open_to_opportunities: bool = False
    resume_url: Optional[str] = None
    headline: str = ""
    preferred_job_types: list[str] = []
    preferred_locations: list[str] = []


@router.get("/career-status")
def get_career_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cs = db.query(UserCareerStatus).filter(UserCareerStatus.user_id == user.id).first()
    if not cs:
        return {"status": "studying", "isOpenToOpportunities": False, "resumeUrl": None,
                "headline": "", "preferredJobTypes": [], "preferredLocations": []}
    return {
        "status": cs.status, "isOpenToOpportunities": cs.is_open_to_opportunities,
        "resumeUrl": cs.resume_url, "headline": cs.headline,
        "preferredJobTypes": json.loads(cs.preferred_job_types or "[]"),
        "preferredLocations": json.loads(cs.preferred_locations or "[]"),
    }


@router.put("/career-status")
def update_career_status(req: CareerStatusRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cs = db.query(UserCareerStatus).filter(UserCareerStatus.user_id == user.id).first()
    if not cs:
        cs = UserCareerStatus(id=gen_id(), user_id=user.id)
        db.add(cs)

    old_status = cs.status
    cs.status = req.status
    cs.is_open_to_opportunities = req.is_open_to_opportunities
    cs.resume_url = req.resume_url
    cs.headline = req.headline
    cs.preferred_job_types = json.dumps(req.preferred_job_types)
    cs.preferred_locations = json.dumps(req.preferred_locations)
    cs.updated_at = datetime.utcnow()

    # Handle graduation
    if req.status in ("graduated", "licensed") and not user.is_graduated:
        user.is_graduated = True
        user.graduation_year = datetime.utcnow().year

    # Create milestone if status changed
    if old_status != req.status:
        MILESTONE_TITLES = {
            "preparing_thesis": "Preparando tesis",
            "graduated": "Se graduo! 🎓",
            "licensed": "Se titulo! 🏆",
        }
        if req.status in MILESTONE_TITLES:
            milestone = AcademicMilestone(
                id=gen_id(), user_id=user.id, milestone_type=req.status,
                title=MILESTONE_TITLES[req.status],
                description=f"{user.first_name} {user.last_name} — {user.career} en {user.university}",
            )
            db.add(milestone)

    db.commit()
    return {"status": cs.status, "isOpenToOpportunities": cs.is_open_to_opportunities}


# ─── Academic Milestones ────────────────────────────────────

@router.post("/milestones")
def create_milestone(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create an academic milestone, optionally auto-post to wall."""
    milestone_type = data.get("milestone_type", "custom")
    title = data.get("title", "")
    description = data.get("description", "")
    auto_post = data.get("auto_post", False)

    if not title:
        raise HTTPException(400, "Titulo requerido")

    milestone = AcademicMilestone(
        id=gen_id(), user_id=user.id, milestone_type=milestone_type,
        title=title, description=description,
    )
    db.add(milestone)

    wall_post_id = None
    if auto_post:
        EMOJIS = {
            "new_subject": "📚", "new_semester": "📅", "new_year": "🎉",
            "preparing_thesis": "📝", "graduated": "🎓", "licensed": "🏆",
        }
        emoji = EMOJIS.get(milestone_type, "🌟")
        post_content = f"{emoji} {title}\n\n{description}" if description else f"{emoji} {title}"

        wall_post = WallPost(
            id=gen_id(), author_id=user.id, wall_owner_id=user.id,
            content=post_content,
        )
        db.add(wall_post)
        milestone.auto_posted = True
        milestone.wall_post_id = wall_post.id
        wall_post_id = wall_post.id

    from gamification import award_xp
    award_xp(user, 10, db)
    db.commit()

    return {"id": milestone.id, "title": milestone.title, "autoPosted": milestone.auto_posted,
            "wallPostId": wall_post_id}


@router.get("/milestones")
def get_milestones(user_id: str = "", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_id = user_id or user.id
    milestones = db.query(AcademicMilestone).filter(
        AcademicMilestone.user_id == target_id
    ).order_by(desc(AcademicMilestone.created_at)).all()
    return [{
        "id": m.id, "type": m.milestone_type, "title": m.title,
        "description": m.description or "", "autoPosted": m.auto_posted,
        "createdAt": m.created_at.isoformat() if m.created_at else "",
    } for m in milestones]


# ─── Job Listings ───────────────────────────────────────────

class JobListingRequest(BaseModel):
    company_name: str
    company_logo: Optional[str] = None
    job_title: str
    job_type: str = "full_time"
    location: str = ""
    is_remote: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "USD"
    description: str
    requirements: str = ""
    benefits: str = ""
    career_field: str = ""
    experience_level: str = "entry"
    education_level: str = "any"
    application_deadline: Optional[str] = None
    contact_email: str = ""
    external_url: str = ""
    konni_broadcast: bool = False


def job_to_dict(j, poster=None, applied=False):
    return {
        "id": j.id, "companyName": j.company_name, "companyLogo": j.company_logo,
        "jobTitle": j.job_title, "jobType": j.job_type, "location": j.location,
        "isRemote": j.is_remote,
        "salaryMin": j.salary_min, "salaryMax": j.salary_max, "salaryCurrency": j.salary_currency,
        "description": j.description, "requirements": j.requirements or "",
        "benefits": j.benefits or "", "careerField": j.career_field or "",
        "experienceLevel": j.experience_level, "educationLevel": j.education_level,
        "applicationDeadline": j.application_deadline.isoformat() if j.application_deadline else None,
        "contactEmail": j.contact_email or "", "externalUrl": j.external_url or "",
        "isActive": j.is_active, "viewCount": j.view_count or 0,
        "applicationCount": j.application_count or 0,
        "postedBy": user_brief(poster) if poster else None,
        "applied": applied,
        "createdAt": j.created_at.isoformat() if j.created_at else "",
    }


@router.post("/listings")
def create_job_listing(req: JobListingRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    deadline = None
    if req.application_deadline:
        try:
            deadline = datetime.fromisoformat(req.application_deadline)
        except ValueError:
            pass

    job = JobListing(
        id=gen_id(), posted_by=user.id, company_name=req.company_name,
        company_logo=req.company_logo, job_title=req.job_title, job_type=req.job_type,
        location=req.location, is_remote=req.is_remote,
        salary_min=req.salary_min, salary_max=req.salary_max, salary_currency=req.salary_currency,
        description=req.description, requirements=req.requirements, benefits=req.benefits,
        career_field=req.career_field, experience_level=req.experience_level,
        education_level=req.education_level, application_deadline=deadline,
        contact_email=req.contact_email, external_url=req.external_url,
        konni_broadcast=req.konni_broadcast,
    )
    db.add(job)
    db.commit()

    # If broadcast requested, create a KonniBroadcast record for every active user
    if req.konni_broadcast:
        user_ids = [u.id for u in db.query(User.id).filter(User.is_banned == False).all()]
        db.bulk_insert_mappings(KonniBroadcast, [
            {"id": gen_id(), "user_id": uid, "job_id": job.id}
            for uid in user_ids
        ])
        db.commit()

    return job_to_dict(job, user)


@router.get("/listings")
def list_jobs(search: str = "", job_type: str = "", career_field: str = "",
              is_remote: bool = False, page: int = 1, since: str = "",
              user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(JobListing).filter(JobListing.is_active == True)
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            q = q.filter(JobListing.created_at > since_dt)
        except ValueError:
            pass
    if search:
        q = q.filter(or_(
            JobListing.job_title.ilike(f"%{search}%"),
            JobListing.company_name.ilike(f"%{search}%"),
            JobListing.description.ilike(f"%{search}%"),
        ))
    if job_type:
        q = q.filter(JobListing.job_type == job_type)
    if career_field:
        q = q.filter(JobListing.career_field.ilike(f"%{career_field}%"))
    if is_remote:
        q = q.filter(JobListing.is_remote == True)

    total = q.count()
    jobs = q.order_by(desc(JobListing.created_at)).offset((page - 1) * 20).limit(20).all()

    poster_ids = list(set(j.posted_by for j in jobs))
    posters = {u.id: u for u in db.query(User).filter(User.id.in_(poster_ids)).all()} if poster_ids else {}

    my_apps = set(a.job_id for a in db.query(JobApplication.job_id).filter(
        JobApplication.applicant_id == user.id,
        JobApplication.job_id.in_([j.id for j in jobs])
    ).all())

    return {
        "total": total,
        "jobs": [job_to_dict(j, posters.get(j.posted_by), j.id in my_apps) for j in jobs],
    }


@router.get("/listings/{job_id}")
def get_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(JobListing.id == job_id).first()
    if not job:
        raise HTTPException(404, "Oferta no encontrada")
    job.view_count = (job.view_count or 0) + 1
    db.commit()
    poster = db.query(User).filter(User.id == job.posted_by).first()
    applied = db.query(JobApplication).filter(
        JobApplication.job_id == job_id, JobApplication.applicant_id == user.id
    ).first() is not None
    return job_to_dict(job, poster, applied)


@router.put("/listings/{job_id}")
def update_job(job_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(JobListing.id == job_id, JobListing.posted_by == user.id).first()
    if not job:
        raise HTTPException(403, "No tienes permiso")
    for field in ["company_name", "job_title", "job_type", "location", "is_remote",
                   "salary_min", "salary_max", "description", "requirements", "benefits",
                   "career_field", "experience_level", "education_level", "contact_email",
                   "external_url", "is_active"]:
        if field in data:
            setattr(job, field, data[field])
    job.updated_at = datetime.utcnow()
    db.commit()
    return job_to_dict(job)


@router.delete("/listings/{job_id}")
def delete_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(JobListing.id == job_id, JobListing.posted_by == user.id).first()
    if not job:
        raise HTTPException(403, "No tienes permiso")
    db.query(JobApplication).filter(JobApplication.job_id == job_id).delete(synchronize_session=False)
    db.delete(job)
    db.commit()
    return {"status": "deleted"}


# ─── Job Applications ───────────────────────────────────────

@router.post("/listings/{job_id}/apply")
def apply_to_job(job_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(JobListing.id == job_id, JobListing.is_active == True).first()
    if not job:
        raise HTTPException(404, "Oferta no encontrada o cerrada")

    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id, JobApplication.applicant_id == user.id
    ).first()
    if existing:
        raise HTTPException(400, "Ya aplicaste a esta oferta")

    app = JobApplication(
        id=gen_id(), job_id=job_id, applicant_id=user.id,
        resume_url=data.get("resume_url"), cover_letter=data.get("cover_letter", ""),
    )
    db.add(app)
    job.application_count = (job.application_count or 0) + 1

    # Notify the job poster
    from notification_routes import create_notification
    create_notification(db, job.posted_by, "job_application",
        f"{user.first_name} {user.last_name} aplico a {job.job_title}",
        body=f"{user.career} — {user.university}",
        link=f"/jobs/{job.id}/applications", actor_id=user.id, reference_id=app.id)

    db.commit()
    return {"status": "applied", "applicationId": app.id}


@router.get("/listings/{job_id}/applications")
def get_applications(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(JobListing.id == job_id, JobListing.posted_by == user.id).first()
    if not job:
        raise HTTPException(403, "No tienes permiso")

    apps = db.query(JobApplication, User).join(
        User, User.id == JobApplication.applicant_id
    ).filter(JobApplication.job_id == job_id).order_by(desc(JobApplication.created_at)).all()

    return [{
        "id": a.id, "status": a.status, "resumeUrl": a.resume_url,
        "coverLetter": a.cover_letter or "", "notes": a.notes or "",
        "applicant": user_brief(u),
        "createdAt": a.created_at.isoformat() if a.created_at else "",
    } for a, u in apps]


@router.put("/applications/{app_id}/status")
def update_application_status(app_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Aplicacion no encontrada")
    job = db.query(JobListing).filter(JobListing.id == app.job_id, JobListing.posted_by == user.id).first()
    if not job:
        raise HTTPException(403, "No tienes permiso")

    new_status = data.get("status", "reviewed")
    app.status = new_status
    app.notes = data.get("notes", app.notes)
    app.updated_at = datetime.utcnow()

    STATUS_MESSAGES = {
        "reviewed": "Tu aplicacion fue revisada",
        "interview": "Te invitaron a una entrevista!",
        "accepted": "Felicidades! Tu aplicacion fue aceptada",
        "rejected": "Tu aplicacion no fue seleccionada",
    }
    from notification_routes import create_notification
    create_notification(db, app.applicant_id, "job_update",
        STATUS_MESSAGES.get(new_status, "Actualizacion de tu aplicacion"),
        body=f"{job.job_title} en {job.company_name}",
        link=f"/jobs", actor_id=user.id, reference_id=app.id)

    db.commit()
    return {"status": app.status}


# ─── Open to Opportunities (candidates browsing) ───────────

@router.get("/candidates")
def browse_candidates(search: str = "", career: str = "", page: int = 1,
                      user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Browse candidates who are open to opportunities."""
    q = db.query(UserCareerStatus, User).join(
        User, User.id == UserCareerStatus.user_id
    ).filter(UserCareerStatus.is_open_to_opportunities == True)

    if search:
        q = q.filter(or_(
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
            UserCareerStatus.headline.ilike(f"%{search}%"),
        ))
    if career:
        q = q.filter(User.career.ilike(f"%{career}%"))

    total = q.count()
    results = q.order_by(desc(UserCareerStatus.updated_at)).offset((page - 1) * 20).limit(20).all()

    return {
        "total": total,
        "candidates": [{
            "user": user_brief(u),
            "status": cs.status, "headline": cs.headline or "",
            "resumeUrl": cs.resume_url,
            "preferredJobTypes": json.loads(cs.preferred_job_types or "[]"),
        } for cs, u in results],
    }


@router.get("/my-listings")
def my_listings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(JobListing).filter(JobListing.posted_by == user.id).order_by(desc(JobListing.created_at)).all()
    return [job_to_dict(j) for j in jobs]


@router.get("/my-applications")
def my_applications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(JobApplication, JobListing).join(
        JobListing, JobListing.id == JobApplication.job_id
    ).filter(JobApplication.applicant_id == user.id).order_by(desc(JobApplication.created_at)).all()
    return [{
        "id": a.id, "status": a.status,
        "job": {"id": j.id, "jobTitle": j.job_title, "companyName": j.company_name,
                "companyLogo": j.company_logo, "location": j.location},
        "createdAt": a.created_at.isoformat() if a.created_at else "",
    } for a, j in apps]


# ─── Recruiter Registration ─────────────────────────────────

@router.post("/recruiter/register")
def register_recruiter(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Register as a recruiter with company information."""
    from database import RecruiterProfile

    existing = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user.id).first()
    if existing:
        raise HTTPException(400, "Ya estás registrado como reclutador")

    required = ["company_name", "corporate_email", "recruiter_title"]
    for field in required:
        if not data.get(field):
            raise HTTPException(400, f"Campo requerido: {field}")

    profile = RecruiterProfile(
        id=gen_id(), user_id=user.id,
        company_name=data["company_name"],
        company_logo=data.get("company_logo"),
        company_website=data.get("company_website", ""),
        company_size=data.get("company_size", ""),
        industry=data.get("industry", ""),
        tax_id=data.get("tax_id", ""),
        corporate_email=data["corporate_email"],
        recruiter_title=data["recruiter_title"],
        phone=data.get("phone", ""),
        country=data.get("country", ""),
        city=data.get("city", ""),
        company_description=data.get("company_description", ""),
        linkedin_url=data.get("linkedin_url", ""),
        verification_document=data.get("verification_document"),
    )
    db.add(profile)
    db.commit()
    return {
        "id": profile.id, "companyName": profile.company_name,
        "verificationStatus": profile.verification_status,
        "message": "Registro enviado. Tu perfil será verificado por nuestro equipo.",
    }


@router.get("/recruiter/profile")
def get_recruiter_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import RecruiterProfile
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user.id).first()
    if not profile:
        return None
    return {
        "id": profile.id, "companyName": profile.company_name,
        "companyLogo": profile.company_logo, "companyWebsite": profile.company_website,
        "companySize": profile.company_size, "industry": profile.industry,
        "taxId": profile.tax_id, "corporateEmail": profile.corporate_email,
        "recruiterTitle": profile.recruiter_title, "phone": profile.phone,
        "country": profile.country, "city": profile.city,
        "companyDescription": profile.company_description,
        "linkedinUrl": profile.linkedin_url,
        "verificationStatus": profile.verification_status,
        "isActive": profile.is_active,
    }


@router.put("/recruiter/profile")
def update_recruiter_profile(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import RecruiterProfile
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "No estás registrado como reclutador")
    for field in ["company_name", "company_logo", "company_website", "company_size",
                   "industry", "tax_id", "corporate_email", "recruiter_title",
                   "phone", "country", "city", "company_description", "linkedin_url"]:
        if field in data:
            setattr(profile, field, data[field])
    db.commit()
    return {"status": "updated"}


@router.get("/recruiter/search-candidates")
def search_candidates_as_recruiter(search: str = "", career: str = "",
                                    university: str = "", page: int = 1,
                                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Recruiter-only: search candidates with visible CVs."""
    from database import RecruiterProfile, StudentCV
    recruiter = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == user.id,
        RecruiterProfile.verification_status == "verified"
    ).first()

    # Allow non-verified recruiters but with limited results
    q = db.query(UserCareerStatus, User).join(
        User, User.id == UserCareerStatus.user_id
    ).filter(UserCareerStatus.is_open_to_opportunities == True)

    if search:
        q = q.filter(or_(User.first_name.ilike(f"%{search}%"), User.last_name.ilike(f"%{search}%"),
                          UserCareerStatus.headline.ilike(f"%{search}%")))
    if career:
        q = q.filter(User.career.ilike(f"%{career}%"))
    if university:
        q = q.filter(User.university.ilike(f"%{university}%"))

    total = q.count()
    results = q.order_by(desc(UserCareerStatus.updated_at)).offset((page - 1) * 20).limit(20).all()

    candidates = []
    for cs, u in results:
        # Check CV visibility
        cv = db.query(StudentCV).filter(StudentCV.user_id == u.id).first()
        cv_available = False
        cv_data = None
        if cv:
            if cv.visibility == "public":
                cv_available = True
            elif cv.visibility == "recruiters_only" and recruiter:
                cv_available = True

        if cv and cv_available:
            cv_data = {
                "headline": cv.headline, "aboutMe": cv.about_me,
                "skills": json.loads(cv.skills or "[]"),
                "experience": json.loads(cv.experience or "[]"),
            }

        candidates.append({
            "user": user_brief(u),
            "status": cs.status, "headline": cs.headline or "",
            "resumeUrl": cs.resume_url if cv_available else None,
            "cv": cv_data,
            "isRecruiterVerified": recruiter is not None and recruiter.verification_status == "verified",
        })

    return {"total": total, "candidates": candidates}


# ─── Tutoring System ───────────────────────────────────────

@router.post("/tutoring/listings")
def create_tutoring_listing(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a tutoring listing (available to senior students and graduates)."""
    from database import TutoringListing

    # Check eligibility
    if not (user.is_senior_year or user.is_graduated):
        raise HTTPException(403, "Las tutorías están disponibles para estudiantes de último año y graduados")

    subject = data.get("subject", "").strip()
    if not subject:
        raise HTTPException(400, "La materia es obligatoria")

    listing = TutoringListing(
        id=gen_id(), tutor_id=user.id, subject=subject,
        category=data.get("category", ""),
        level=data.get("level", "university"),
        modality=data.get("modality", "online"),
        price_per_hour=data.get("price_per_hour"),
        currency=data.get("currency", "USD"),
        is_free=data.get("is_free", False),
        free_trial=data.get("free_trial", False),
        session_duration=data.get("session_duration", 60),
        language=data.get("language", user.language or "es"),
        description=data.get("description", ""),
        experience_years=data.get("experience_years", 0),
        availability=json.dumps(data.get("availability", [])),
        location=data.get("location", ""),
        tags=json.dumps(data.get("tags", [])),
        max_students=data.get("max_students", 1),
    )
    db.add(listing)

    from gamification import award_xp
    award_xp(user, 10, db)
    db.commit()

    return {
        "id": listing.id, "subject": listing.subject,
        "status": "active", "message": "Tutoría publicada exitosamente",
    }


@router.get("/tutoring/listings")
def list_tutoring(subject: str = "", category: str = "", modality: str = "",
                  is_free: bool = False, page: int = 1,
                  db: Session = Depends(get_db)):
    from database import TutoringListing
    q = db.query(TutoringListing, User).join(
        User, User.id == TutoringListing.tutor_id
    ).filter(TutoringListing.is_active == True)

    if subject:
        q = q.filter(TutoringListing.subject.ilike(f"%{subject}%"))
    if category:
        q = q.filter(TutoringListing.category == category)
    if modality:
        q = q.filter(TutoringListing.modality == modality)
    if is_free:
        q = q.filter(TutoringListing.is_free == True)

    total = q.count()
    results = q.order_by(desc(TutoringListing.created_at)).offset((page - 1) * 20).limit(20).all()

    return {
        "total": total,
        "listings": [{
            "id": t.id, "subject": t.subject, "category": t.category,
            "level": t.level, "modality": t.modality,
            "pricePerHour": t.price_per_hour, "currency": t.currency,
            "isFree": t.is_free, "freeTrial": t.free_trial,
            "sessionDuration": t.session_duration, "language": t.language,
            "description": t.description or "", "experienceYears": t.experience_years,
            "availability": json.loads(t.availability or "[]"),
            "location": t.location or "", "tags": json.loads(t.tags or "[]"),
            "maxStudents": t.max_students,
            "rating": round(t.rating_sum / t.rating_count, 1) if t.rating_count else 0,
            "ratingCount": t.rating_count or 0,
            "totalSessions": t.total_sessions or 0,
            "tutor": {
                **user_brief(u),
                "isGraduated": u.is_graduated, "isSeniorYear": u.is_senior_year,
                "career": u.career, "university": u.university,
                "semester": u.semester,
            },
        } for t, u in results],
    }


@router.get("/tutoring/listings/{listing_id}")
def get_tutoring_listing(listing_id: str, db: Session = Depends(get_db)):
    from database import TutoringListing
    t = db.query(TutoringListing).filter(TutoringListing.id == listing_id).first()
    if not t:
        raise HTTPException(404, "Tutoría no encontrada")
    tutor = db.query(User).filter(User.id == t.tutor_id).first()
    return {
        "id": t.id, "subject": t.subject, "category": t.category,
        "level": t.level, "modality": t.modality,
        "pricePerHour": t.price_per_hour, "currency": t.currency,
        "isFree": t.is_free, "freeTrial": t.free_trial,
        "sessionDuration": t.session_duration, "language": t.language,
        "description": t.description or "", "experienceYears": t.experience_years,
        "availability": json.loads(t.availability or "[]"),
        "location": t.location or "", "tags": json.loads(t.tags or "[]"),
        "maxStudents": t.max_students,
        "rating": round(t.rating_sum / t.rating_count, 1) if t.rating_count else 0,
        "ratingCount": t.rating_count or 0,
        "totalSessions": t.total_sessions or 0,
        "tutor": user_brief(tutor),
    }


@router.put("/tutoring/listings/{listing_id}")
def update_tutoring_listing(listing_id: str, data: dict,
                            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import TutoringListing
    listing = db.query(TutoringListing).filter(
        TutoringListing.id == listing_id, TutoringListing.tutor_id == user.id
    ).first()
    if not listing:
        raise HTTPException(403, "No tienes permiso")
    for field in ["subject", "category", "level", "modality", "price_per_hour",
                   "currency", "is_free", "free_trial", "session_duration", "language",
                   "description", "experience_years", "location", "max_students", "is_active"]:
        if field in data:
            setattr(listing, field, data[field])
    if "availability" in data:
        listing.availability = json.dumps(data["availability"])
    if "tags" in data:
        listing.tags = json.dumps(data["tags"])
    listing.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "updated"}


@router.delete("/tutoring/listings/{listing_id}")
def delete_tutoring_listing(listing_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import TutoringListing
    listing = db.query(TutoringListing).filter(
        TutoringListing.id == listing_id, TutoringListing.tutor_id == user.id
    ).first()
    if not listing:
        raise HTTPException(403, "No tienes permiso")
    from database import TutoringListingRequest
    db.query(TutoringListingRequest).filter(TutoringListingRequest.listing_id == listing_id).delete(synchronize_session=False)
    db.delete(listing)
    db.commit()
    return {"status": "deleted"}


@router.post("/tutoring/listings/{listing_id}/request")
def request_tutoring(listing_id: str, data: dict,
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import TutoringListing, TutoringListingRequest as TR
    listing = db.query(TutoringListing).filter(TutoringListing.id == listing_id).first()
    if not listing:
        raise HTTPException(404, "Tutoría no encontrada")
    if listing.tutor_id == user.id:
        raise HTTPException(400, "No puedes solicitar tu propia tutoría")

    existing = db.query(TR).filter(TR.listing_id == listing_id, TR.student_id == user.id).first()
    if existing:
        raise HTTPException(400, "Ya solicitaste esta tutoría")

    req = TR(
        id=gen_id(), listing_id=listing_id, student_id=user.id,
        tutor_id=listing.tutor_id, message=data.get("message", ""),
    )
    if data.get("scheduled_at"):
        try:
            req.scheduled_at = datetime.fromisoformat(data["scheduled_at"])
        except ValueError:
            pass
    db.add(req)

    from notification_routes import create_notification
    create_notification(db, listing.tutor_id, "tutoring_request",
        f"{user.first_name} quiere tomar tu tutoría de {listing.subject}",
        body=data.get("message", "")[:100],
        link="/jobs", actor_id=user.id, reference_id=req.id)

    db.commit()
    return {"status": "requested", "id": req.id}


@router.get("/tutoring/my-listings")
def my_tutoring_listings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import TutoringListing
    listings = db.query(TutoringListing).filter(TutoringListing.tutor_id == user.id).order_by(desc(TutoringListing.created_at)).all()
    return [{
        "id": t.id, "subject": t.subject, "category": t.category,
        "modality": t.modality, "pricePerHour": t.price_per_hour,
        "isFree": t.is_free, "isActive": t.is_active,
        "totalSessions": t.total_sessions or 0,
        "rating": round(t.rating_sum / t.rating_count, 1) if t.rating_count else 0,
    } for t in listings]


@router.get("/tutoring/requests")
def get_tutoring_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get tutoring requests for tutor or student."""
    from database import TutoringListingRequest as TR, TutoringListing

    # As tutor
    as_tutor = db.query(TR, User, TutoringListing).join(
        User, User.id == TR.student_id
    ).join(TutoringListing, TutoringListing.id == TR.listing_id).filter(
        TR.tutor_id == user.id
    ).order_by(desc(TR.created_at)).all()

    # As student
    as_student = db.query(TR, User, TutoringListing).join(
        User, User.id == TR.tutor_id
    ).join(TutoringListing, TutoringListing.id == TR.listing_id).filter(
        TR.student_id == user.id
    ).order_by(desc(TR.created_at)).all()

    return {
        "asTutor": [{
            "id": r.id, "status": r.status, "message": r.message or "",
            "scheduledAt": r.scheduled_at.isoformat() if r.scheduled_at else None,
            "student": user_brief(u), "subject": l.subject,
            "createdAt": r.created_at.isoformat() if r.created_at else "",
        } for r, u, l in as_tutor],
        "asStudent": [{
            "id": r.id, "status": r.status, "message": r.message or "",
            "scheduledAt": r.scheduled_at.isoformat() if r.scheduled_at else None,
            "tutor": user_brief(u), "subject": l.subject,
            "createdAt": r.created_at.isoformat() if r.created_at else "",
        } for r, u, l in as_student],
    }


@router.put("/tutoring/requests/{request_id}/status")
def update_tutoring_request_status(request_id: str, data: dict,
                                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import TutoringListingRequest as TR, TutoringListing
    req = db.query(TR).filter(TR.id == request_id).first()
    if not req:
        raise HTTPException(404, "Solicitud no encontrada")
    if req.tutor_id != user.id and req.student_id != user.id:
        raise HTTPException(403, "Sin permiso")

    new_status = data.get("status", "accepted")
    req.status = new_status

    if new_status == "completed":
        listing = db.query(TutoringListing).filter(TutoringListing.id == req.listing_id).first()
        if listing:
            listing.total_sessions = (listing.total_sessions or 0) + 1

        # Rate if provided
        rating = data.get("rating")
        if rating and 1 <= rating <= 5:
            req.rating = rating
            req.review = data.get("review", "")
            if listing:
                listing.rating_sum = (listing.rating_sum or 0) + rating
                listing.rating_count = (listing.rating_count or 0) + 1

        from gamification import award_xp
        tutor = db.query(User).filter(User.id == req.tutor_id).first()
        student = db.query(User).filter(User.id == req.student_id).first()
        if tutor:
            award_xp(tutor, 20, db)
        if student:
            award_xp(student, 10, db)

    status_messages = {
        "accepted": "Tu solicitud de tutoría fue aceptada",
        "rejected": "Tu solicitud de tutoría fue rechazada",
        "completed": "La sesión de tutoría fue completada",
    }
    target_id = req.student_id if req.tutor_id == user.id else req.tutor_id
    from notification_routes import create_notification
    create_notification(db, target_id, "tutoring_update",
        status_messages.get(new_status, "Actualización de tutoría"),
        actor_id=user.id, reference_id=req.id)

    db.commit()
    return {"status": new_status}
