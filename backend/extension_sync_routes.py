# ruff: noqa: UP045
"""
Extension Sync Routes — Endpoint independiente para recibir datos de la extension Conniku.
NO modifica ningun archivo existente. Se registra en server.py con una sola linea.

Recibe datos pre-extraidos por la extension del navegador (cursos, archivos, calendario, notas)
y los almacena en las tablas existentes (lms_courses, lms_sync_items, calendar_events)
mas la nueva tabla lms_grades.
"""

import logging
from datetime import datetime
from typing import Literal, Optional

from database import Base, CalendarEvent, User, gen_id, get_db
from fastapi import APIRouter, Depends, HTTPException
from middleware import get_current_user
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lms/extension", tags=["extension-sync"])


# ═══════════════════════════════════════════════════════════════
# MODELO LmsGrade — Tabla para calificaciones del LMS
# Definido ANTES de los endpoints para que SQLAlchemy lo registre
# al importar este modulo. ForeignKey + String(16) consistente.
# ═══════════════════════════════════════════════════════════════


class LmsGrade(Base):
    __tablename__ = "lms_grades"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(16), ForeignKey("lms_courses.id"), nullable=False, index=True)
    item_name = Column(String(500), nullable=False)
    grade = Column(Float, nullable=True)
    grade_max = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    time_modified = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Modelos de request (Pydantic) ─────────────────────────────

VALID_PLATFORMS = Literal["moodle", "canvas", "blackboard", "brightspace", "sakai", "teams", "classroom", "other"]
VALID_EVENT_TYPES = Literal["task", "deadline", "exam", "class", "forum"]


class ExtCourse(BaseModel):
    external_id: str = Field(max_length=100)
    name: str = Field(max_length=500)
    short_name: Optional[str] = Field(None, max_length=100)
    start_date: Optional[int] = None
    end_date: Optional[int] = None
    is_current: bool = True
    file_count: int = 0
    platform: str = Field(max_length=30)


class ExtFile(BaseModel):
    external_id: str = Field(max_length=200)
    course_external_id: str = Field(max_length=100)
    name: str = Field(max_length=500)
    url: str = Field(max_length=2000)
    mime_type: Optional[str] = Field(None, max_length=100)
    file_size: Optional[int] = None
    topic_name: Optional[str] = Field(None, max_length=500)
    topic_order: Optional[int] = None
    item_type: str = Field(default="file", max_length=30)
    time_modified: Optional[int] = None


class ExtEvent(BaseModel):
    external_id: str = Field(max_length=100)
    title: str = Field(max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    course_external_id: Optional[str] = Field(None, max_length=100)
    course_name: Optional[str] = Field(None, max_length=500)
    start_time: int
    end_time: Optional[int] = None
    event_type: str = Field(default="task", max_length=30)
    url: Optional[str] = Field(None, max_length=2000)
    submission_status: Optional[str] = Field(None, max_length=30)


class ExtGrade(BaseModel):
    external_id: str = Field(max_length=200)
    course_external_id: str = Field(max_length=100)
    item_name: str = Field(max_length=500)
    grade: Optional[float] = None
    grade_max: Optional[float] = None
    percentage: Optional[float] = None
    weight: Optional[float] = None
    feedback: Optional[str] = Field(None, max_length=5000)
    time_modified: Optional[int] = None


class SyncPayload(BaseModel):
    platform: str = Field(max_length=30)
    base_url: str = Field(max_length=500)
    site_name: str = Field(max_length=200)
    timestamp: int
    courses: list[ExtCourse] = Field(default=[], max_length=200)
    files: list[ExtFile] = Field(default=[], max_length=2000)
    events: list[ExtEvent] = Field(default=[], max_length=500)
    grades: list[ExtGrade] = Field(default=[], max_length=1000)


# ── Colores por tipo de evento ────────────────────────────────

EVENT_COLORS = {
    "deadline": "#f59e0b",
    "exam": "#ef4444",
    "class": "#3b82f6",
    "forum": "#10b981",
    "task": "#4f8cff",
}


# ── Endpoint principal ────────────────────────────────────────


@router.post("/sync")
def extension_sync(
    payload: SyncPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Recibe datos pre-extraidos de la extension del navegador.
    Crea/actualiza cursos, archivos, eventos y notas en las tablas de Conniku.
    """
    from database import LMSCourse, LMSSyncItem, UniversityConnection

    logger.info(
        "[EXT-SYNC] user=%s platform=%s courses=%d files=%d events=%d grades=%d",
        user.id, payload.platform, len(payload.courses), len(payload.files),
        len(payload.events), len(payload.grades),
    )

    try:
        # ── 1. Crear o actualizar la conexion universitaria ────
        conn = (
            db.query(UniversityConnection)
            .filter(
                UniversityConnection.user_id == user.id,
                UniversityConnection.api_url == payload.base_url,
            )
            .first()
        )

        if not conn:
            conn = UniversityConnection(
                id=gen_id(),
                user_id=user.id,
                platform_type=payload.platform,
                platform_name=payload.site_name,
                api_url=payload.base_url,
                api_token="BROWSER_SESSION",
                status="connected",
                last_scan=datetime.utcnow(),
            )
            db.add(conn)
            db.flush()

        conn.status = "connected"
        conn.last_scan = datetime.utcnow()

        # ── 2. Pre-fetch existentes para evitar N+1 ───────────
        existing_courses = {
            c.name: c
            for c in db.query(LMSCourse).filter(
                LMSCourse.user_id == user.id,
                LMSCourse.connection_id == conn.id,
            ).all()
        }

        # ── 3. Crear o actualizar cursos ──────────────────────
        course_id_map: dict[str, str] = {}
        courses_created = 0
        courses_updated = 0

        for ext_course in payload.courses:
            existing = existing_courses.get(ext_course.name)

            if existing:
                course_id_map[ext_course.external_id] = existing.id
                existing.startdate = ext_course.start_date
                existing.enddate = ext_course.end_date
                existing.is_active = True
                courses_updated += 1
            else:
                course_id = gen_id()
                course_id_map[ext_course.external_id] = course_id
                new_course = LMSCourse(
                    id=course_id,
                    user_id=user.id,
                    connection_id=conn.id,
                    name=ext_course.name,
                    display_name=ext_course.name,
                    short_name=ext_course.short_name,
                    startdate=ext_course.start_date,
                    enddate=ext_course.end_date,
                    is_active=True,
                )
                db.add(new_course)
                courses_created += 1

        db.flush()

        # ── 4. Pre-fetch archivos existentes ──────────────────
        existing_file_urls = set()
        if payload.files:
            course_ids_internal = list(course_id_map.values())
            if course_ids_internal:
                rows = (
                    db.query(LMSSyncItem.item_url)
                    .filter(
                        LMSSyncItem.user_id == user.id,
                        LMSSyncItem.course_id.in_(course_ids_internal),
                    )
                    .all()
                )
                existing_file_urls = {r[0] for r in rows}

        # ── 5. Crear archivos nuevos (solo los que no existen) ─
        files_created = 0

        for ext_file in payload.files:
            internal_course_id = course_id_map.get(ext_file.course_external_id)
            if not internal_course_id:
                continue

            if ext_file.url in existing_file_urls:
                continue

            item = LMSSyncItem(
                id=gen_id(),
                user_id=user.id,
                course_id=internal_course_id,
                item_name=ext_file.name,
                item_url=ext_file.url,
                item_type=ext_file.item_type,
                file_size=ext_file.file_size,
                mime_type=ext_file.mime_type,
                topic_name=ext_file.topic_name,
                topic_order=ext_file.topic_order,
                status="pending",
            )
            db.add(item)
            existing_file_urls.add(ext_file.url)
            files_created += 1

        # ── 6. Pre-fetch eventos existentes ───────────────────
        existing_event_ids = set()
        if payload.events:
            rows = (
                db.query(CalendarEvent.lms_event_id)
                .filter(
                    CalendarEvent.user_id == user.id,
                    CalendarEvent.lms_event_id.isnot(None),
                )
                .all()
            )
            existing_event_ids = {r[0] for r in rows}

        # ── 7. Sincronizar eventos de calendario ──────────────
        events_created = 0
        events_updated = 0

        for ext_event in payload.events:
            ts = ext_event.start_time
            if ts <= 0 or ts > 4102444800:  # antes de epoch o despues de 2100
                continue

            event_data = {
                "title": ext_event.title,
                "description": ext_event.description or "",
                "due_date": datetime.utcfromtimestamp(ts),
                "event_type": ext_event.event_type,
                "color": EVENT_COLORS.get(ext_event.event_type, "#4f8cff"),
                "source": "lms",
                "lms_event_id": ext_event.external_id,
                "lms_course_name": ext_event.course_name,
                "item_url": ext_event.url,
                "submission_status": ext_event.submission_status,
            }

            if ext_event.external_id in existing_event_ids:
                existing = (
                    db.query(CalendarEvent)
                    .filter(
                        CalendarEvent.user_id == user.id,
                        CalendarEvent.lms_event_id == ext_event.external_id,
                    )
                    .first()
                )
                if existing:
                    existing.title = ext_event.title
                    existing.description = ext_event.description or ""
                    existing.due_date = datetime.utcfromtimestamp(ts)
                    existing.event_type = ext_event.event_type
                    existing.color = EVENT_COLORS.get(ext_event.event_type, "#4f8cff")
                    existing.lms_course_name = ext_event.course_name
                    existing.item_url = ext_event.url
                    existing.submission_status = ext_event.submission_status
                    events_updated += 1
            else:
                event = CalendarEvent(
                    id=gen_id(),
                    user_id=user.id,
                    **event_data,
                )
                db.add(event)
                events_created += 1

        # ── 8. Pre-fetch notas existentes ─────────────────────
        existing_grades: dict[str, LmsGrade] = {}
        if payload.grades:
            course_ids_internal = list(course_id_map.values())
            if course_ids_internal:
                rows = (
                    db.query(LmsGrade)
                    .filter(
                        LmsGrade.user_id == user.id,
                        LmsGrade.course_id.in_(course_ids_internal),
                    )
                    .all()
                )
                existing_grades = {f"{g.course_id}:{g.item_name}": g for g in rows}

        # ── 9. Sincronizar calificaciones ─────────────────────
        grades_created = 0
        grades_updated = 0

        for ext_grade in payload.grades:
            internal_course_id = course_id_map.get(ext_grade.course_external_id)
            if not internal_course_id:
                continue

            grade_key = f"{internal_course_id}:{ext_grade.item_name}"
            existing = existing_grades.get(grade_key)

            if existing:
                if ext_grade.grade is not None:
                    existing.grade = ext_grade.grade
                if ext_grade.grade_max is not None:
                    existing.grade_max = ext_grade.grade_max
                if ext_grade.percentage is not None:
                    existing.percentage = ext_grade.percentage
                if ext_grade.weight is not None:
                    existing.weight = ext_grade.weight
                if ext_grade.feedback is not None:
                    existing.feedback = ext_grade.feedback
                if ext_grade.time_modified is not None:
                    existing.time_modified = ext_grade.time_modified
                grades_updated += 1
            else:
                grade = LmsGrade(
                    id=gen_id(),
                    user_id=user.id,
                    course_id=internal_course_id,
                    item_name=ext_grade.item_name,
                    grade=ext_grade.grade,
                    grade_max=ext_grade.grade_max,
                    percentage=ext_grade.percentage,
                    weight=ext_grade.weight,
                    feedback=ext_grade.feedback,
                    time_modified=ext_grade.time_modified,
                )
                db.add(grade)
                grades_created += 1

        db.commit()

        return {
            "ok": True,
            "summary": {
                "courses_created": courses_created,
                "courses_updated": courses_updated,
                "files_created": files_created,
                "events_created": events_created,
                "events_updated": events_updated,
                "grades_created": grades_created,
                "grades_updated": grades_updated,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("[EXT-SYNC] Error during sync: %s", e)
        raise HTTPException(500, "Error interno durante la sincronizacion") from e


# ── Endpoint para obtener calificaciones ──────────────────────


@router.get("/grades/{course_id}")
def get_course_grades(
    course_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna las calificaciones de un curso que pertenece al usuario."""
    # Validar que el curso pertenece al usuario
    from database import LMSCourse

    course = db.query(LMSCourse).filter(
        LMSCourse.id == course_id,
        LMSCourse.user_id == user.id,
    ).first()
    if not course:
        raise HTTPException(404, "Asignatura no encontrada")

    grades = (
        db.query(LmsGrade)
        .filter(
            LmsGrade.user_id == user.id,
            LmsGrade.course_id == course_id,
        )
        .order_by(LmsGrade.time_modified.desc())
        .all()
    )

    return {
        "grades": [
            {
                "id": g.id,
                "item_name": g.item_name,
                "grade": g.grade,
                "grade_max": g.grade_max,
                "percentage": g.percentage,
                "weight": g.weight,
                "feedback": g.feedback,
                "time_modified": g.time_modified,
            }
            for g in grades
        ],
    }
