"""
Video conference routes: Jitsi (built-in) + Zoom/Meet/Teams external links.
Supports recording transcription via Whisper.
"""
import json as json_mod
import threading
import logging
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import (
    get_db, User, VideoConference, ConferenceParticipant,
    CalendarEvent, gen_id, DATA_DIR,
)
from middleware import get_current_user, require_tier, get_tier

logger = logging.getLogger("conniku.conferences")

router = APIRouter(prefix="/conferences", tags=["conferences"])

PROJECTS_DIR = DATA_DIR / "projects"


# ─── Pydantic models ────────────────────────────────────────────

class CreateConferenceRequest(BaseModel):
    title: str
    description: str = ""
    conference_type: str = "jitsi"  # jitsi | zoom | meet | teams | other
    external_url: str = ""
    project_id: Optional[str] = None
    scheduled_at: Optional[str] = None  # ISO datetime string or empty
    duration_minutes: int = 60
    is_recording: bool = False
    max_participants: int = 50
    start_now: bool = False


# ─── Background transcription ───────────────────────────────────

def process_conference_transcription(conference_id: str):
    """Background: transcribe conference recording and save to project docs."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        conf = db.query(VideoConference).filter(VideoConference.id == conference_id).first()
        if not conf or not conf.recording_path:
            return

        conf.transcription_status = "processing"
        db.commit()

        from video_routes import transcribe_video_file
        transcript = transcribe_video_file(conf.recording_path)

        conf.transcription = transcript
        conf.transcription_status = "done" if not transcript.startswith("[Error") else "error"

        # Save to project documents if linked to a project
        if conf.project_id and conf.transcription_status == "done":
            docs_dir = PROJECTS_DIR / conf.project_id / "documents"
            docs_dir.mkdir(parents=True, exist_ok=True)

            txt_filename = f"conferencia_{conf.title}_{conf.id}.txt"
            txt_path = docs_dir / txt_filename
            txt_path.write_text(transcript, encoding="utf-8")

            meta_file = PROJECTS_DIR / conf.project_id / "meta.json"
            if meta_file.exists():
                meta = json_mod.loads(meta_file.read_text())
                doc_entry = {
                    "id": conf.id,
                    "name": txt_filename,
                    "type": "txt",
                    "path": str(txt_path),
                    "size": len(transcript.encode("utf-8")),
                    "uploadedAt": datetime.utcnow().isoformat(),
                    "processed": True,
                    "summary": f"Transcripcion de conferencia: {conf.title}",
                }
                if "documents" not in meta:
                    meta["documents"] = []
                meta["documents"].append(doc_entry)
                meta_file.write_text(json_mod.dumps(meta, indent=2))

            # Index for search
            try:
                from gemini_engine import AIEngine
                ai = AIEngine()
                ai.add_document(conf.project_id, txt_filename, transcript)
            except Exception:
                pass

        db.commit()
    except Exception as e:
        try:
            conf.transcription_status = "error"
            conf.transcription = f"[Error: {str(e)}]"
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ─── Helpers ────────────────────────────────────────────────────

def _conference_to_dict(conf: VideoConference, participant_count: int = 0) -> dict:
    return {
        "id": conf.id,
        "project_id": conf.project_id,
        "creator_id": conf.creator_id,
        "title": conf.title,
        "description": conf.description,
        "conference_type": conf.conference_type,
        "external_url": conf.external_url,
        "jitsi_room": conf.jitsi_room,
        "jitsi_url": f"https://8x8.vc/{conf.jitsi_room}" if conf.jitsi_room else "",
        "scheduled_at": conf.scheduled_at.isoformat() if conf.scheduled_at else None,
        "duration_minutes": conf.duration_minutes,
        "is_recording": conf.is_recording,
        "recording_path": conf.recording_path or "",
        "transcription_status": conf.transcription_status,
        "status": conf.status,
        "max_participants": conf.max_participants,
        "created_at": conf.created_at.isoformat() if conf.created_at else None,
        "ended_at": conf.ended_at.isoformat() if conf.ended_at else None,
        "participant_count": participant_count,
    }


# ─── Endpoints ──────────────────────────────────────────────────

@router.post("/create")
def create_conference(
    req: CreateConferenceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new conference. Pro/Max users only."""
    require_tier(user, "pro")

    if not req.title or not req.title.strip():
        raise HTTPException(400, "El titulo es obligatorio")

    valid_types = ("jitsi", "zoom", "meet", "teams", "other")
    if req.conference_type not in valid_types:
        raise HTTPException(400, f"Tipo invalido. Opciones: {', '.join(valid_types)}")

    # For external links, validate URL is present
    if req.conference_type != "jitsi" and not req.external_url.strip():
        raise HTTPException(400, "Se requiere un enlace para conferencias externas")

    conf_id = gen_id()

    # Generate Jitsi room name (8x8 JaaS format)
    JAAS_APP_ID = "vpaas-magic-cookie-42121e07130c4200bc06173ce83d8db9"
    jitsi_room = ""
    if req.conference_type == "jitsi":
        jitsi_room = f"{JAAS_APP_ID}/conniku-{conf_id}"

    # Parse scheduled datetime
    scheduled = None
    if req.scheduled_at:
        try:
            scheduled = datetime.fromisoformat(req.scheduled_at.replace("Z", "+00:00").replace("+00:00", ""))
        except ValueError:
            raise HTTPException(400, "Formato de fecha invalido")

    status = "live" if req.start_now else "scheduled"

    conf = VideoConference(
        id=conf_id,
        project_id=req.project_id or None,
        creator_id=user.id,
        title=req.title.strip(),
        description=req.description.strip(),
        conference_type=req.conference_type,
        external_url=req.external_url.strip() if req.conference_type != "jitsi" else "",
        jitsi_room=jitsi_room,
        scheduled_at=scheduled or datetime.utcnow(),
        duration_minutes=req.duration_minutes,
        is_recording=req.is_recording,
        status=status,
        max_participants=req.max_participants,
    )
    db.add(conf)

    # Add creator as host participant
    host = ConferenceParticipant(
        id=gen_id(),
        conference_id=conf_id,
        user_id=user.id,
        role="host",
    )
    db.add(host)

    # Auto-create calendar event if scheduled
    if scheduled and req.project_id:
        cal_event = CalendarEvent(
            id=gen_id(),
            user_id=user.id,
            project_id=req.project_id,
            title=f"Conferencia: {req.title.strip()}",
            description=req.description.strip() or f"Conferencia de video - {req.conference_type}",
            event_type="study_session",
            due_date=scheduled,
            color="#7c3aed",
        )
        db.add(cal_event)

    db.commit()

    return {
        "ok": True,
        "conference": _conference_to_dict(conf, participant_count=1),
    }


@router.get("/")
def list_conferences(
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List conferences. Optional filter by status: scheduled, live, ended."""
    query = db.query(VideoConference)

    if status and status in ("scheduled", "live", "ended"):
        query = query.filter(VideoConference.status == status)

    conferences = query.order_by(desc(VideoConference.created_at)).limit(100).all()

    results = []
    for conf in conferences:
        count = db.query(ConferenceParticipant).filter(
            ConferenceParticipant.conference_id == conf.id,
            ConferenceParticipant.left_at.is_(None),
        ).count()
        results.append(_conference_to_dict(conf, participant_count=count))

    return {"conferences": results}


@router.get("/{conference_id}")
def get_conference(
    conference_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = db.query(VideoConference).filter(VideoConference.id == conference_id).first()
    if not conf:
        raise HTTPException(404, "Conferencia no encontrada")

    participants = db.query(ConferenceParticipant).filter(
        ConferenceParticipant.conference_id == conference_id,
    ).all()

    active_count = sum(1 for p in participants if p.left_at is None)

    participant_list = []
    for p in participants:
        u = db.query(User).filter(User.id == p.user_id).first()
        participant_list.append({
            "id": p.id,
            "user_id": p.user_id,
            "username": u.username if u else "?",
            "first_name": u.first_name if u else "",
            "avatar": u.avatar if u else None,
            "role": p.role,
            "joined_at": p.joined_at.isoformat() if p.joined_at else None,
            "left_at": p.left_at.isoformat() if p.left_at else None,
        })

    result = _conference_to_dict(conf, participant_count=active_count)
    result["participants"] = participant_list
    result["is_creator"] = conf.creator_id == user.id

    # Estimated transcription time
    if conf.transcription_status == "processing":
        est_minutes = max(1, conf.duration_minutes // 10)
        result["transcription_estimate"] = f"La transcripcion estara lista en aproximadamente {est_minutes} minuto{'s' if est_minutes != 1 else ''}"

    return result


@router.post("/{conference_id}/join")
def join_conference(
    conference_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = db.query(VideoConference).filter(VideoConference.id == conference_id).first()
    if not conf:
        raise HTTPException(404, "Conferencia no encontrada")

    if conf.status == "ended":
        raise HTTPException(400, "La conferencia ya termino")

    # Check if already joined
    existing = db.query(ConferenceParticipant).filter(
        ConferenceParticipant.conference_id == conference_id,
        ConferenceParticipant.user_id == user.id,
        ConferenceParticipant.left_at.is_(None),
    ).first()

    if existing:
        return {"ok": True, "message": "Ya estas en esta conferencia"}

    # Check max participants
    active_count = db.query(ConferenceParticipant).filter(
        ConferenceParticipant.conference_id == conference_id,
        ConferenceParticipant.left_at.is_(None),
    ).count()

    if active_count >= conf.max_participants:
        raise HTTPException(400, "La conferencia esta llena")

    # If conference is scheduled, set it live when someone joins
    if conf.status == "scheduled":
        conf.status = "live"

    participant = ConferenceParticipant(
        id=gen_id(),
        conference_id=conference_id,
        user_id=user.id,
        role="participant",
    )
    db.add(participant)
    db.commit()

    join_url = ""
    if conf.conference_type == "jitsi" and conf.jitsi_room:
        join_url = f"https://8x8.vc/{conf.jitsi_room}"
    elif conf.external_url:
        join_url = conf.external_url

    return {"ok": True, "join_url": join_url, "conference": _conference_to_dict(conf)}


@router.post("/{conference_id}/leave")
def leave_conference(
    conference_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = db.query(ConferenceParticipant).filter(
        ConferenceParticipant.conference_id == conference_id,
        ConferenceParticipant.user_id == user.id,
        ConferenceParticipant.left_at.is_(None),
    ).first()

    if not participant:
        raise HTTPException(400, "No estas en esta conferencia")

    participant.left_at = datetime.utcnow()
    db.commit()

    return {"ok": True}


@router.post("/{conference_id}/end")
def end_conference(
    conference_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = db.query(VideoConference).filter(VideoConference.id == conference_id).first()
    if not conf:
        raise HTTPException(404, "Conferencia no encontrada")

    if conf.creator_id != user.id:
        raise HTTPException(403, "Solo el creador puede finalizar la conferencia")

    if conf.status == "ended":
        raise HTTPException(400, "La conferencia ya termino")

    conf.status = "ended"
    conf.ended_at = datetime.utcnow()

    # Mark all participants as left
    active_participants = db.query(ConferenceParticipant).filter(
        ConferenceParticipant.conference_id == conference_id,
        ConferenceParticipant.left_at.is_(None),
    ).all()
    for p in active_participants:
        p.left_at = datetime.utcnow()

    db.commit()

    # Trigger transcription if there's a recording
    if conf.is_recording and conf.recording_path:
        thread = threading.Thread(
            target=process_conference_transcription,
            args=(conference_id,),
            daemon=True,
        )
        thread.start()

        est_minutes = max(1, conf.duration_minutes // 10)
        return {
            "ok": True,
            "message": f"Conferencia finalizada. La transcripcion estara lista en aproximadamente {est_minutes} minuto{'s' if est_minutes != 1 else ''}.",
        }

    return {"ok": True, "message": "Conferencia finalizada."}


@router.get("/{conference_id}/transcription")
def get_transcription(
    conference_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = db.query(VideoConference).filter(VideoConference.id == conference_id).first()
    if not conf:
        raise HTTPException(404, "Conferencia no encontrada")

    result = {
        "status": conf.transcription_status,
        "transcription": conf.transcription if conf.transcription_status == "done" else "",
    }

    if conf.transcription_status == "processing":
        est_minutes = max(1, conf.duration_minutes // 10)
        result["estimate"] = f"La transcripcion estara lista en aproximadamente {est_minutes} minuto{'s' if est_minutes != 1 else ''}"

    return result


@router.delete("/{conference_id}")
def delete_conference(
    conference_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conf = db.query(VideoConference).filter(VideoConference.id == conference_id).first()
    if not conf:
        raise HTTPException(404, "Conferencia no encontrada")

    if conf.creator_id != user.id:
        raise HTTPException(403, "Solo el creador puede eliminar la conferencia")

    # Delete participants first
    db.query(ConferenceParticipant).filter(
        ConferenceParticipant.conference_id == conference_id
    ).delete()

    db.delete(conf)
    db.commit()

    return {"ok": True}
