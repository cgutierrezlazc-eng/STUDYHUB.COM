"""
LMS University Integration — Conniku
Soporta: Moodle, Canvas, Blackboard, Brightspace (D2L), Sakai, Teams (manual), Google Classroom (manual)
"""
import base64
import json
import logging
import re
from datetime import datetime
from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import (
    get_db, User, UniversityConnection, LMSCourse, LMSSyncItem, gen_id
)
from middleware import get_current_user

log = logging.getLogger(__name__)
router = APIRouter(prefix="/lms", tags=["lms"])

TIMEOUT = 12  # seconds for outbound HTTP calls


# ──────────────────────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────────────────────

class ConnectRequest(BaseModel):
    platform_type: str          # moodle | canvas | blackboard | brightspace | sakai | teams | classroom | other
    platform_name: str          # display name, e.g. "U. de Chile"
    api_url: str                # base URL of the institution's LMS
    api_token: str = ""         # user-generated token / API key
    extra_field: str = ""       # username, secret key, etc. (platform-specific)
    auth_method: str = "token"  # "token" | "password"
    username: str = ""          # for password-based auth (Moodle)
    password: str = ""          # for password-based auth (never stored)


class ActivateCoursesRequest(BaseModel):
    connection_id: str
    course_ids: list            # list of LMSCourse.id to keep active


class LinkCourseRequest(BaseModel):
    course_id: str              # LMSCourse.id
    conniku_project_id: str     # Conniku project to link


class SyncItemRequest(BaseModel):
    item_id: str
    conniku_project_id: str


# ──────────────────────────────────────────────────────────────
# Platform handlers
# ──────────────────────────────────────────────────────────────

def _clean_url(url: str) -> str:
    return url.rstrip("/")


def _moodle_get_token_from_password(base_url: str, username: str, password: str) -> str:
    """Obtain a Moodle web service token using username/password via /login/token.php."""
    url = f"{base_url}/login/token.php"
    try:
        r = requests.get(url, params={
            "username": username,
            "password": password,
            "service": "moodle_mobile_app",
        }, timeout=TIMEOUT)
        # Verificar que la respuesta tenga contenido JSON antes de parsear
        content_type = r.headers.get("Content-Type", "")
        if not r.content.strip():
            raise ValueError(
                "El servidor del campus virtual no respondió. "
                "Verifica que la URL sea correcta y que el servicio móvil esté habilitado."
            )
        if "text/html" in content_type and "json" not in content_type:
            raise ValueError(
                "El campus virtual devolvió una página HTML en lugar de una respuesta de API. "
                "La URL puede ser incorrecta o el servicio móvil de Moodle no está habilitado. "
                "Prueba con el método Token."
            )
        try:
            data = r.json()
        except Exception:
            raise ValueError(
                "El campus virtual no devolvió una respuesta válida. "
                "Verifica que la URL termine en el dominio del campus (ej: https://campusvirtual.tu-universidad.cl) "
                "y que el servicio web esté habilitado."
            )
        if "token" in data:
            return data["token"]
        error_msg = data.get("error") or data.get("exception") or "Credenciales inválidas"
        raise ValueError(f"Error de autenticación Moodle: {error_msg}")
    except ValueError:
        raise
    except requests.exceptions.ConnectionError:
        raise ValueError("No se pudo conectar al servidor. Verifica que la URL del campus virtual sea correcta.")
    except requests.exceptions.Timeout:
        raise ValueError("El servidor tardó demasiado en responder. Intenta de nuevo.")
    except Exception as e:
        raise ValueError(f"No se pudo conectar a Moodle: {str(e)}")


# ── Moodle ────────────────────────────────────────────────────

def _moodle_call(base_url: str, token: str, function: str, params: dict = {}) -> dict:
    url = f"{base_url}/webservice/rest/server.php"
    p = {"wstoken": token, "wsfunction": function, "moodlewsrestformat": "json"}
    p.update(params)
    r = requests.get(url, params=p, timeout=TIMEOUT, verify=True)
    r.raise_for_status()
    data = r.json()
    if isinstance(data, dict) and data.get("exception"):
        raise ValueError(data.get("message", "Moodle error"))
    return data


def moodle_verify(base_url: str, token: str) -> dict:
    info = _moodle_call(base_url, token, "core_webservice_get_site_info")
    return {"site_name": info.get("sitename", ""), "username": info.get("username", ""), "userid": info.get("userid")}


def moodle_get_courses(base_url: str, token: str, userid: int) -> list:
    courses = _moodle_call(base_url, token, "core_enrol_get_users_courses",
                           {"userid": userid, "returnusercount": 0})
    return courses if isinstance(courses, list) else []


def moodle_get_contents(base_url: str, token: str, course_id: int) -> list:
    try:
        contents = _moodle_call(base_url, token, "core_course_get_contents",
                                {"courseid": course_id})
        return contents if isinstance(contents, list) else []
    except Exception:
        return []


def moodle_download_file(file_url: str, token: str) -> Optional[bytes]:
    """Download a Moodle file appending the token."""
    sep = "&" if "?" in file_url else "?"
    url = f"{file_url}{sep}token={token}"
    try:
        r = requests.get(url, timeout=30, verify=True)
        if r.status_code == 200:
            return r.content
    except Exception:
        pass
    return None


# ── Canvas ────────────────────────────────────────────────────

def canvas_get(base_url: str, token: str, path: str, params: dict = {}) -> any:
    url = f"{base_url}/api/v1{path}"
    headers = {"Authorization": f"Bearer {token}"}
    items = []
    while url:
        r = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list):
            items.extend(data)
        else:
            return data
        # Handle pagination
        link = r.headers.get("Link", "")
        next_url = None
        for part in link.split(","):
            if 'rel="next"' in part:
                m = re.search(r'<([^>]+)>', part)
                if m:
                    next_url = m.group(1)
        url = next_url
        params = {}  # only pass params on first request
    return items


def canvas_verify(base_url: str, token: str) -> dict:
    profile = canvas_get(base_url, token, "/users/self/profile")
    return {"display_name": profile.get("name", ""), "login_id": profile.get("login_id", "")}


def canvas_get_courses(base_url: str, token: str) -> list:
    return canvas_get(base_url, token, "/courses",
                      {"enrollment_state": "active", "include[]": "term"})


def canvas_get_files(base_url: str, token: str, course_id) -> list:
    try:
        return canvas_get(base_url, token, f"/courses/{course_id}/files",
                          {"content_types[]": ["application/pdf",
                                               "application/msword",
                                               "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                               "application/vnd.ms-powerpoint",
                                               "application/vnd.openxmlformats-officedocument.presentationml.presentation"]})
    except Exception:
        return []


def canvas_download_file(url: str, token: str) -> Optional[bytes]:
    try:
        r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
        if r.status_code == 200:
            return r.content
    except Exception:
        pass
    return None


# ── Blackboard ────────────────────────────────────────────────

def blackboard_get(base_url: str, token: str, path: str) -> any:
    url = f"{base_url}/learn/api/public/v3{path}"
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(url, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def blackboard_verify(base_url: str, token: str) -> dict:
    try:
        data = blackboard_get(base_url, token, "/users/me")
        return {"username": data.get("userName", ""), "name": data.get("name", {}).get("given", "")}
    except Exception:
        raise ValueError("No se pudo conectar con Blackboard. Verifica la URL y el token.")


def blackboard_get_courses(base_url: str, token: str) -> list:
    try:
        data = blackboard_get(base_url, token, "/courses?limit=100&fields=id,name,courseId,displayName,term")
        return data.get("results", [])
    except Exception:
        return []


# ── Brightspace (D2L) ─────────────────────────────────────────

def brightspace_get(base_url: str, token: str, path: str) -> any:
    url = f"{base_url}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(url, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def brightspace_verify(base_url: str, token: str) -> dict:
    try:
        data = brightspace_get(base_url, token, "/d2l/api/lp/1.0/users/whoami")
        return {"identifier": data.get("Identifier", ""), "name": data.get("DisplayName", "")}
    except Exception:
        raise ValueError("No se pudo conectar con Brightspace. Verifica la URL y el token.")


def brightspace_get_courses(base_url: str, token: str) -> list:
    try:
        data = brightspace_get(base_url, token, "/d2l/api/lp/1.0/enrollments/myenrollments/?orgUnitTypeId=3")
        return data.get("Items", [])
    except Exception:
        return []


# ── Sakai ─────────────────────────────────────────────────────

def sakai_get(base_url: str, token: str, path: str) -> any:
    url = f"{base_url}/sakai-ws/rest{path}"
    r = requests.get(url, params={"session": token}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def sakai_verify(base_url: str, token: str) -> dict:
    try:
        data = sakai_get(base_url, token, "/user/getCurrentUser")
        return {"eid": data.get("eid", ""), "displayName": data.get("displayName", "")}
    except Exception:
        raise ValueError("No se pudo conectar con Sakai. Verifica la URL y el token de sesión.")


def sakai_get_courses(base_url: str, token: str) -> list:
    try:
        data = sakai_get(base_url, token, "/site/getSites")
        return data if isinstance(data, list) else []
    except Exception:
        return []


# ── Auto-detect platform ──────────────────────────────────────

def _detect_platform(api_url: str, token: str, extra_field: str) -> tuple[str, dict]:
    """
    Try each platform in order. Returns (platform_type, info_dict).
    """
    base = _clean_url(api_url)

    # 1. Try Moodle
    try:
        info = moodle_verify(base, token)
        return "moodle", info
    except Exception:
        pass

    # 2. Try Canvas
    try:
        info = canvas_verify(base, token)
        return "canvas", info
    except Exception:
        pass

    # 3. Try Blackboard
    try:
        info = blackboard_verify(base, token)
        return "blackboard", info
    except Exception:
        pass

    # 4. Try Brightspace
    try:
        info = brightspace_verify(base, token)
        return "brightspace", info
    except Exception:
        pass

    # 5. Try Sakai
    try:
        info = sakai_verify(base, token)
        return "sakai", info
    except Exception:
        pass

    raise ValueError(
        "No se pudo conectar con ninguna plataforma conocida. "
        "Verifica la URL de tu institución y el token generado."
    )


# ──────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────

@router.post("/connect")
def connect_lms(req: ConnectRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Guarda credenciales, detecta plataforma y verifica conexión.
    Si platform_type == 'auto', intenta detectar automáticamente.
    """
    base_url = _clean_url(req.api_url)
    platform_type = req.platform_type
    info = {}

    # Resolver token desde usuario/contraseña si se solicita (Moodle)
    api_token = req.api_token
    if req.auth_method == "password":
        if not req.username or not req.password:
            raise HTTPException(400, "Usuario y contraseña son requeridos para este método de autenticación")
        try:
            api_token = _moodle_get_token_from_password(base_url, req.username, req.password)
        except ValueError as e:
            raise HTTPException(400, str(e))
        if platform_type in ("", "auto", "unknown"):
            platform_type = "moodle"

    # Auto-detect si no se especificó plataforma o si es 'auto'
    if platform_type in ("", "auto", "unknown"):
        try:
            platform_type, info = _detect_platform(base_url, api_token, req.extra_field)
        except ValueError as e:
            raise HTTPException(400, str(e))
    else:
        # Verify manually for specified platform
        try:
            if platform_type == "moodle":
                info = moodle_verify(base_url, api_token)
            elif platform_type == "canvas":
                info = canvas_verify(base_url, api_token)
            elif platform_type == "blackboard":
                info = blackboard_verify(base_url, api_token)
            elif platform_type == "brightspace":
                info = brightspace_verify(base_url, api_token)
            elif platform_type == "sakai":
                info = sakai_verify(base_url, api_token)
            elif platform_type in ("teams", "classroom", "other"):
                # OAuth-based platforms — stored as manual, no verification
                info = {}
            else:
                raise HTTPException(400, f"Plataforma no reconocida: {platform_type}")
        except ValueError as e:
            raise HTTPException(400, str(e))
        except Exception as e:
            raise HTTPException(400, f"Error al conectar: {str(e)}")

    # Encode token for storage (use resolved api_token, never the raw password)
    token_b64 = base64.b64encode(api_token.encode()).decode()
    extra_b64 = base64.b64encode(req.extra_field.encode()).decode() if req.extra_field else ""

    conn = UniversityConnection(
        id=gen_id(),
        user_id=user.id,
        platform_type=platform_type,
        platform_name=req.platform_name or _build_platform_name(platform_type, info),
        api_url=base_url,
        api_token=token_b64,
        extra_field=extra_b64,
        status="connected",
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)

    # Immediately fetch courses after connection
    courses_added, courses_list = _fetch_and_store_courses(conn, db)

    return {
        "id": conn.id,
        "platform_type": platform_type,
        "platform_name": conn.platform_name,
        "status": "connected",
        "info": info,
        "courses_found": courses_added,
        "courses": courses_list,
    }


def _build_platform_name(platform_type: str, info: dict) -> str:
    labels = {
        "moodle": f"Moodle — {info.get('site_name', '')}".strip(" —"),
        "canvas": "Canvas LMS",
        "blackboard": "Blackboard Learn",
        "brightspace": "Brightspace (D2L)",
        "sakai": "Sakai",
        "teams": "Microsoft Teams Educativo",
        "classroom": "Google Classroom",
        "other": "Plataforma Universitaria",
    }
    return labels.get(platform_type, "Plataforma Universitaria")


def _decode_token(conn: UniversityConnection) -> tuple[str, str]:
    """Return (api_token, extra_field) decoded."""
    try:
        token = base64.b64decode(conn.api_token).decode()
    except Exception:
        token = conn.api_token
    try:
        extra = base64.b64decode(conn.extra_field).decode() if conn.extra_field else ""
    except Exception:
        extra = conn.extra_field or ""
    return token, extra


def _fetch_and_store_courses(conn: UniversityConnection, db: Session) -> int:
    """Fetch courses from the platform and store new ones. Returns count added."""
    token, extra = _decode_token(conn)
    base_url = conn.api_url
    raw_courses = []

    try:
        if conn.platform_type == "moodle":
            info = moodle_verify(base_url, token)
            userid = info.get("userid", 0)
            raw_courses = moodle_get_courses(base_url, token, userid)
        elif conn.platform_type == "canvas":
            raw_courses = canvas_get_courses(base_url, token)
        elif conn.platform_type == "blackboard":
            raw_courses = blackboard_get_courses(base_url, token)
        elif conn.platform_type == "brightspace":
            raw_courses = brightspace_get_courses(base_url, token)
        elif conn.platform_type == "sakai":
            raw_courses = sakai_get_courses(base_url, token)
    except Exception as e:
        log.warning(f"[LMS] fetch_courses error ({conn.platform_type}): {e}")
        conn.status = "error"
        conn.error_msg = str(e)
        db.commit()
        return 0

    # Normalize raw courses per platform
    normalized = _normalize_courses(conn.platform_type, raw_courses)

    existing_ids = {
        c.external_id for c in db.query(LMSCourse).filter(
            LMSCourse.connection_id == conn.id
        ).all()
    }

    added = 0
    for c in normalized:
        if str(c["external_id"]) not in existing_ids:
            db.add(LMSCourse(
                id=gen_id(),
                connection_id=conn.id,
                user_id=conn.user_id,
                external_id=str(c["external_id"]),
                name=c.get("name", "")[:500],
                short_name=c.get("short_name", "")[:100],
                semester=c.get("semester", ""),
                year=c.get("year"),
            ))
            added += 1

    conn.last_scan = datetime.utcnow()
    db.commit()
    stored = db.query(LMSCourse).filter(LMSCourse.connection_id == conn.id).all()
    courses_list = [
        {"id": c.id, "name": c.name, "short_name": c.short_name or "", "semester": c.semester or "", "year": c.year}
        for c in stored
    ]
    return added, courses_list


def _normalize_courses(platform_type: str, raw: list) -> list:
    result = []
    for c in raw:
        if platform_type == "moodle":
            result.append({
                "external_id": c.get("id", ""),
                "name": c.get("fullname", ""),
                "short_name": c.get("shortname", ""),
                "semester": "",
                "year": None,
            })
        elif platform_type == "canvas":
            term = c.get("term", {}) or {}
            result.append({
                "external_id": c.get("id", ""),
                "name": c.get("name", ""),
                "short_name": c.get("course_code", ""),
                "semester": term.get("name", ""),
                "year": None,
            })
        elif platform_type == "blackboard":
            result.append({
                "external_id": c.get("id", c.get("courseId", "")),
                "name": c.get("displayName", c.get("name", "")),
                "short_name": c.get("courseId", ""),
                "semester": "",
                "year": None,
            })
        elif platform_type == "brightspace":
            org = c.get("OrgUnit", {}) or {}
            result.append({
                "external_id": org.get("Id", ""),
                "name": org.get("Name", ""),
                "short_name": org.get("Code", ""),
                "semester": "",
                "year": None,
            })
        elif platform_type == "sakai":
            result.append({
                "external_id": c.get("siteId", c.get("id", "")),
                "name": c.get("title", c.get("siteTitle", "")),
                "short_name": c.get("siteId", ""),
                "semester": "",
                "year": None,
            })
    return result


@router.get("/connections")
def get_connections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conns = db.query(UniversityConnection).filter(
        UniversityConnection.user_id == user.id,
        UniversityConnection.status != "disconnected"
    ).all()
    result = []
    for c in conns:
        courses = db.query(LMSCourse).filter(LMSCourse.connection_id == c.id).all()
        pending_count = db.query(LMSSyncItem).filter(
            LMSSyncItem.user_id == user.id,
            LMSSyncItem.status == "pending",
        ).join(LMSCourse, LMSCourse.id == LMSSyncItem.course_id).filter(
            LMSCourse.connection_id == c.id
        ).count()
        result.append({
            "id": c.id,
            "platform_type": c.platform_type,
            "platform_name": c.platform_name,
            "api_url": c.api_url,
            "status": c.status,
            "error_msg": c.error_msg,
            "last_scan": c.last_scan.isoformat() if c.last_scan else None,
            "courses": [{
                "id": cr.id,
                "name": cr.name,
                "short_name": cr.short_name,
                "semester": cr.semester,
                "conniku_project_id": cr.conniku_project_id,
            } for cr in courses],
            "pending_items": pending_count,
        })
    return result


@router.delete("/connections/{conn_id}")
def disconnect_lms(conn_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(UniversityConnection).filter(
        UniversityConnection.id == conn_id,
        UniversityConnection.user_id == user.id
    ).first()
    if not conn:
        raise HTTPException(404, "Conexión no encontrada")
    conn.status = "disconnected"
    db.commit()
    return {"ok": True}


@router.post("/scan")
def scan_for_updates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Escanea todas las conexiones activas del usuario buscando material nuevo.
    Crea LMSSyncItem (status=pending) por cada archivo nuevo detectado.
    """
    conns = db.query(UniversityConnection).filter(
        UniversityConnection.user_id == user.id,
        UniversityConnection.status == "connected"
    ).all()

    if not conns:
        raise HTTPException(400, "No tienes plataformas conectadas")

    total_new = 0
    summary = []

    for conn in conns:
        token, _ = _decode_token(conn)
        courses = db.query(LMSCourse).filter(LMSCourse.connection_id == conn.id).all()
        conn_new = 0

        for course in courses:
            items = _scan_course(conn, course, token, db)
            conn_new += items
            total_new += items

        conn.last_scan = datetime.utcnow()
        summary.append({
            "connection": conn.platform_name,
            "new_items": conn_new,
        })

    db.commit()
    return {"total_new": total_new, "summary": summary}


def _scan_course(conn: UniversityConnection, course: LMSCourse, token: str, db: Session) -> int:
    """Scan a single course for new files. Returns count of new items stored."""
    known_ids = {
        i.external_id for i in db.query(LMSSyncItem).filter(
            LMSSyncItem.course_id == course.id
        ).all()
    }

    new_items = []

    try:
        if conn.platform_type == "moodle":
            new_items = _scan_moodle_course(conn.api_url, token, course, known_ids)
        elif conn.platform_type == "canvas":
            new_items = _scan_canvas_course(conn.api_url, token, course, known_ids)
        elif conn.platform_type in ("blackboard", "brightspace", "sakai", "teams", "classroom", "other"):
            # For platforms without full file API yet, skip silently
            pass
    except Exception as e:
        log.warning(f"[LMS] scan_course error {course.name} ({conn.platform_type}): {e}")

    course.last_checked = datetime.utcnow()

    for item in new_items:
        db.add(LMSSyncItem(
            id=gen_id(),
            course_id=course.id,
            user_id=conn.user_id,
            external_id=item["external_id"],
            item_name=item["name"],
            item_type=item.get("type", "file"),
            item_url=item.get("url", ""),
            mime_type=item.get("mime", "application/octet-stream"),
            file_size=item.get("size", 0),
            status="pending",
        ))

    return len(new_items)


def _scan_moodle_course(base_url: str, token: str, course: LMSCourse, known_ids: set) -> list:
    contents = moodle_get_contents(base_url, token, int(course.external_id))
    new_items = []
    for section in contents:
        for module in section.get("modules", []):
            for f in module.get("contents", []):
                if f.get("type") != "file":
                    continue
                fid = str(f.get("fileurl", ""))
                # Use filename+fileurl hash as external_id
                ext_id = f"{course.external_id}_{f.get('filename', '')}_{f.get('filesize', 0)}"
                if ext_id in known_ids:
                    continue
                mime = f.get("mimetype", "application/octet-stream")
                if not _is_useful_mime(mime):
                    continue
                new_items.append({
                    "external_id": ext_id,
                    "name": f.get("filename", "archivo"),
                    "type": "file",
                    "url": fid,
                    "mime": mime,
                    "size": f.get("filesize", 0),
                })
    return new_items


def _scan_canvas_course(base_url: str, token: str, course: LMSCourse, known_ids: set) -> list:
    files = canvas_get_files(base_url, token, course.external_id)
    new_items = []
    for f in files:
        ext_id = str(f.get("id", ""))
        if ext_id in known_ids:
            continue
        mime = f.get("content-type", "application/octet-stream")
        if not _is_useful_mime(mime):
            continue
        new_items.append({
            "external_id": ext_id,
            "name": f.get("display_name", f.get("filename", "archivo")),
            "type": "file",
            "url": f.get("url", ""),
            "mime": mime,
            "size": f.get("size", 0),
        })
    return new_items


def _is_useful_mime(mime: str) -> bool:
    """Only sync document types, not videos/images."""
    useful = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-excel",
        "text/plain",
        "application/zip",
    ]
    return any(mime.startswith(u) for u in useful)


@router.get("/pending")
def get_pending_items(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(LMSSyncItem).filter(
        LMSSyncItem.user_id == user.id,
        LMSSyncItem.status == "pending"
    ).order_by(LMSSyncItem.detected_at.desc()).all()

    result = []
    for item in items:
        course = db.query(LMSCourse).filter(LMSCourse.id == item.course_id).first()
        result.append({
            "id": item.id,
            "item_name": item.item_name,
            "item_type": item.item_type,
            "mime_type": item.mime_type,
            "file_size": item.file_size,
            "detected_at": item.detected_at.isoformat() if item.detected_at else "",
            "course_id": item.course_id,
            "course_name": course.name if course else "",
            "conniku_project_id": course.conniku_project_id if course else None,
        })
    return result


@router.post("/sync/{item_id}")
def sync_item(item_id: str, req: SyncItemRequest,
              user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Descarga el archivo de la plataforma y devuelve el contenido en base64.
    El frontend luego llama a POST /projects/{id}/documents/import para guardarlo.
    """
    item = db.query(LMSSyncItem).filter(
        LMSSyncItem.id == item_id,
        LMSSyncItem.user_id == user.id
    ).first()
    if not item:
        raise HTTPException(404, "Item no encontrado")

    course = db.query(LMSCourse).filter(LMSCourse.id == item.course_id).first()
    if not course:
        raise HTTPException(404, "Asignatura LMS no encontrada")

    conn = db.query(UniversityConnection).filter(
        UniversityConnection.id == course.connection_id
    ).first()
    if not conn:
        raise HTTPException(404, "Conexión no encontrada")

    # Download the file from platform
    token, _ = _decode_token(conn)
    content_bytes: Optional[bytes] = None

    try:
        if conn.platform_type == "moodle":
            content_bytes = moodle_download_file(item.item_url, token)
        elif conn.platform_type == "canvas":
            content_bytes = canvas_download_file(item.item_url, token)
        # For platforms without download support yet: return URL only
    except Exception as e:
        log.warning(f"[LMS] download error: {e}")

    content_b64 = base64.b64encode(content_bytes).decode() if content_bytes else ""

    # Cache downloaded content in LMSSyncItem
    if content_b64:
        item.file_content_b64 = content_b64

    # Mark as synced and link course to project
    item.status = "synced"
    item.synced_at = datetime.utcnow()
    if not course.conniku_project_id:
        course.conniku_project_id = req.conniku_project_id

    db.commit()

    return {
        "ok": True,
        "item_id": item.id,
        "filename": item.item_name,
        "mime_type": item.mime_type,
        "file_type": _mime_to_doc_type(item.mime_type),
        "content_b64": content_b64,
        "has_content": bool(content_b64),
        "item_url": item.item_url,   # fallback if download not supported
    }


@router.post("/dismiss/{item_id}")
def dismiss_item(item_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(LMSSyncItem).filter(
        LMSSyncItem.id == item_id,
        LMSSyncItem.user_id == user.id
    ).first()
    if not item:
        raise HTTPException(404, "Item no encontrado")
    item.status = "dismissed"
    db.commit()
    return {"ok": True}


@router.post("/link-course")
def link_course(req: LinkCourseRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Link a detected LMS course to a Conniku project."""
    course = db.query(LMSCourse).filter(
        LMSCourse.id == req.course_id,
        LMSCourse.user_id == user.id
    ).first()
    if not course:
        raise HTTPException(404, "Asignatura LMS no encontrada")
    course.conniku_project_id = req.conniku_project_id
    db.commit()
    return {"ok": True}


@router.get("/courses")
def get_lms_courses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    courses = db.query(LMSCourse).filter(LMSCourse.user_id == user.id).all()
    result = []
    for c in courses:
        pending = db.query(LMSSyncItem).filter(
            LMSSyncItem.course_id == c.id,
            LMSSyncItem.status == "pending"
        ).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "short_name": c.short_name,
            "semester": c.semester,
            "conniku_project_id": c.conniku_project_id,
            "pending_items": pending,
        })
    return result


@router.post("/activate-courses")
def activate_courses(
    req: ActivateCoursesRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mantiene solo las asignaturas seleccionadas para una conexión.
    Las no seleccionadas se eliminan; el usuario puede agregarlas luego via re-escaneo.
    """
    conn = db.query(UniversityConnection).filter(
        UniversityConnection.id == req.connection_id,
        UniversityConnection.user_id == user.id,
    ).first()
    if not conn:
        raise HTTPException(404, "Conexión no encontrada")

    all_courses = db.query(LMSCourse).filter(
        LMSCourse.connection_id == req.connection_id
    ).all()

    removed = 0
    for course in all_courses:
        if course.id not in req.course_ids:
            db.query(LMSSyncItem).filter(LMSSyncItem.course_id == course.id).delete()
            db.delete(course)
            removed += 1

    db.commit()
    return {"activated": len(all_courses) - removed, "removed": removed}


# ── Helpers ───────────────────────────────────────────────────

def _mime_to_doc_type(mime: str) -> str:
    if "pdf" in mime:
        return "pdf"
    if "word" in mime or "msword" in mime:
        return "docx"
    if "powerpoint" in mime or "presentation" in mime:
        return "pptx"
    if "excel" in mime or "spreadsheet" in mime:
        return "xlsx"
    if "text" in mime:
        return "txt"
    return "other"
