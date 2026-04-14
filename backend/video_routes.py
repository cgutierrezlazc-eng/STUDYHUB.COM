"""
Video/YouTube integration routes.
Supports YouTube URL transcription and video file upload with transcription.
"""
import re
import os
import tempfile
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, VideoDocument, gen_id, DATA_DIR
from middleware import get_current_user

router = APIRouter(tags=["video"])

UPLOAD_DIR = DATA_DIR / "uploads" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class YouTubeRequest(BaseModel):
    url: str
    title: Optional[str] = None


def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def fetch_youtube_transcript(video_id: str) -> str:
    """Fetch transcript from YouTube using youtube-transcript-api."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['es', 'en', 'pt', 'fr'])
        return " ".join([entry['text'] for entry in transcript_list])
    except Exception as e:
        return f"[Error al obtener transcripción: {str(e)}]"


def transcribe_video_file(file_path: str) -> str:
    """Transcribe a local video/audio file using whisper."""
    try:
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(file_path)
        return result["text"]
    except ImportError:
        return "[Whisper no instalado. Instala con: pip install openai-whisper]"
    except Exception as e:
        return f"[Error en transcripción: {str(e)}]"


def process_video_transcription(video_doc_id: str, file_path: Optional[str] = None, youtube_id: Optional[str] = None):
    """Background task to process video transcription."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        video = db.query(VideoDocument).filter(VideoDocument.id == video_doc_id).first()
        if not video:
            return

        video.status = "processing"
        db.commit()

        if youtube_id:
            transcript = fetch_youtube_transcript(youtube_id)
        elif file_path:
            transcript = transcribe_video_file(file_path)
        else:
            transcript = "[Sin fuente de video]"

        video.transcription = transcript
        video.status = "done" if not transcript.startswith("[Error") else "error"

        # Save transcription as project document
        try:
            import json as json_mod
            from pathlib import Path

            PROJECTS_DIR = Path.home() / ".conniku" / "projects"
            meta_file = PROJECTS_DIR / video.project_id / "meta.json"
            docs_dir = PROJECTS_DIR / video.project_id / "documents"
            docs_dir.mkdir(parents=True, exist_ok=True)

            # Save transcription as .txt file
            txt_filename = f"transcripcion_{video.title or 'clase'}_{video.id}.txt"
            txt_path = docs_dir / txt_filename
            txt_path.write_text(transcript, encoding="utf-8")

            # Add to project meta.json documents array
            if meta_file.exists():
                meta = json_mod.loads(meta_file.read_text())
                doc_entry = {
                    "id": video.id,
                    "name": txt_filename,
                    "type": "txt",
                    "path": str(txt_path),
                    "size": len(transcript.encode("utf-8")),
                    "uploadedAt": datetime.utcnow().isoformat(),
                    "processed": True,
                    "summary": f"Transcripción de: {video.title or 'clase grabada'}",
                }
                if "documents" not in meta:
                    meta["documents"] = []
                meta["documents"].append(doc_entry)
                meta_file.write_text(json_mod.dumps(meta, indent=2))

            # Also index in AI engine for chat
            from ai_engine import AIEngine
            ai = AIEngine()
            ai.add_document(video.project_id, txt_filename, transcript)
        except Exception as e:
            print(f"[Warning] Could not save transcription as document: {e}")

        db.commit()
    except Exception as e:
        video.status = "error"
        video.transcription = f"[Error: {str(e)}]"
        db.commit()
    finally:
        db.close()


def _verify_project_access(project_id: str, user: User, db: Session):
    """Verify the user owns the project or has a video already linked to it."""
    import json
    from pathlib import Path
    meta_file = Path.home() / ".conniku" / "projects" / project_id / "meta.json"
    if meta_file.exists():
        meta = json.loads(meta_file.read_text())
        if meta.get("user_id") != user.id:
            raise HTTPException(403, "No tienes acceso a este proyecto")
    else:
        # If no meta file, check if user has any video in this project
        existing = db.query(VideoDocument).filter(
            VideoDocument.project_id == project_id,
            VideoDocument.user_id == user.id,
        ).first()
        if not existing:
            raise HTTPException(403, "No tienes acceso a este proyecto")


@router.post("/projects/{project_id}/video/youtube")
def add_youtube_video(
    project_id: str,
    body: YouTubeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_project_access(project_id, user, db)

    video_id = extract_youtube_id(body.url)
    if not video_id:
        raise HTTPException(400, "URL de YouTube no válida")

    title = body.title or f"YouTube: {video_id}"

    video_doc = VideoDocument(
        project_id=project_id,
        user_id=user.id,
        source_type="youtube",
        source_url=body.url,
        title=title,
        status="pending",
    )
    db.add(video_doc)
    db.commit()
    db.refresh(video_doc)

    background_tasks.add_task(process_video_transcription, video_doc.id, youtube_id=video_id)

    return {
        "id": video_doc.id,
        "title": video_doc.title,
        "sourceType": "youtube",
        "sourceUrl": video_doc.source_url,
        "status": video_doc.status,
        "createdAt": video_doc.created_at.isoformat(),
    }


@router.post("/projects/{project_id}/video/upload")
async def upload_video(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_project_access(project_id, user, db)

    from middleware import require_tier
    require_tier(user, "pro")  # Pro can upload videos, MAX can transcribe

    if not file.filename:
        raise HTTPException(400, "No se proporcionó archivo")

    # Save file
    ext = Path(file.filename).suffix.lower()
    if ext not in ['.mp4', '.mp3', '.wav', '.m4a', '.webm', '.ogg', '.avi', '.mkv']:
        raise HTTPException(400, "Formato de archivo no soportado")

    file_id = gen_id()
    file_path = UPLOAD_DIR / f"{file_id}{ext}"

    content = await file.read()
    if len(content) > 500 * 1024 * 1024:  # 500MB limit
        raise HTTPException(400, "El archivo es demasiado grande (máx 500MB)")

    with open(file_path, "wb") as f:
        f.write(content)

    video_doc = VideoDocument(
        project_id=project_id,
        user_id=user.id,
        source_type="file",
        source_url=str(file_path),
        title=file.filename,
        status="pending",
    )
    db.add(video_doc)
    db.commit()
    db.refresh(video_doc)

    background_tasks.add_task(process_video_transcription, video_doc.id, file_path=str(file_path))

    return {
        "id": video_doc.id,
        "title": video_doc.title,
        "sourceType": "file",
        "status": video_doc.status,
        "createdAt": video_doc.created_at.isoformat(),
    }


@router.get("/projects/{project_id}/videos")
def get_videos(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    videos = db.query(VideoDocument).filter(
        VideoDocument.project_id == project_id,
        VideoDocument.user_id == user.id,
    ).order_by(VideoDocument.created_at.desc()).all()

    return [{
        "id": v.id,
        "title": v.title,
        "sourceType": v.source_type,
        "sourceUrl": v.source_url if v.source_type == "youtube" else None,
        "status": v.status,
        "hasTranscription": bool(v.transcription and not v.transcription.startswith("[")),
        "createdAt": v.created_at.isoformat(),
    } for v in videos]


@router.get("/projects/{project_id}/video/{video_id}/transcription")
def get_transcription(
    project_id: str,
    video_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(VideoDocument).filter(
        VideoDocument.id == video_id,
        VideoDocument.project_id == project_id,
        VideoDocument.user_id == user.id,
    ).first()

    if not video:
        raise HTTPException(404, "Video no encontrado")

    return {
        "id": video.id,
        "title": video.title,
        "transcription": video.transcription or "",
        "status": video.status,
    }
