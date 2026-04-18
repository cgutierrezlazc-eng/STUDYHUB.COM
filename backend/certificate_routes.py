"""Certificate generation, verification, and management."""
import os
import hashlib
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db, User, Certificate, Course, gen_id, DATA_DIR
from middleware import get_current_user

router = APIRouter(prefix="/certificates", tags=["certificates"])

CERT_DIR = DATA_DIR / "certificates"
CERT_DIR.mkdir(parents=True, exist_ok=True)

# Area color mapping for certificate accent line
AREA_COLORS = {
    "communication": "#0891b2",
    "comunicacion": "#0891b2",
    "leadership": "#4f46e5",
    "liderazgo": "#4f46e5",
    "emotional": "#db2777",
    "emocional": "#db2777",
    "thinking": "#0284c7",
    "pensamiento": "#0284c7",
    "productivity": "#16a34a",
    "productividad": "#16a34a",
    "career": "#1e40af",
    "carrera": "#1e40af",
    "ethics": "#78716c",
    "etica": "#78716c",
    "soft_skills": "#9333ea",
    "medicina": "#0d9488",
    "salud": "#059669",
    "ingenieria": "#4f46e5",
    "tecnologia": "#0891b2",
    "derecho": "#78716c",
    "negocios": "#1e40af",
    "finanzas": "#16a34a",
    "arte": "#db2777",
    "diseno": "#ea580c",
    "ciencias": "#0284c7",
    "educacion": "#9333ea",
    "arquitectura": "#52525b",
    "psicologia": "#7c3aed",
    "idiomas": "#2563eb",
    "default": "#2D62C8",
}


def generate_cert_code(user_id: str, course_id: str) -> str:
    """Generate unique certificate verification code."""
    raw = f"{user_id}-{course_id}-{datetime.utcnow().isoformat()}"
    return "CK-" + hashlib.sha256(raw.encode()).hexdigest()[:10].upper()


def generate_certificate_for_user(user: User, course_id: str, course_name: str,
                                   course_area: str, hours: int, grade: float,
                                   db: Session) -> dict:
    """Core certificate generation logic. Called from quiz completion or manually."""
    # Check if certificate already exists
    existing = db.query(Certificate).filter(
        Certificate.user_id == user.id,
        Certificate.course_id == course_id,
    ).first()
    if existing:
        return {
            "id": existing.id,
            "code": existing.certificate_code,
            "alreadyExists": True,
            "pdfPath": existing.pdf_path,
        }

    cert_code = generate_cert_code(user.id, course_id)

    cert = Certificate(
        id=gen_id(),
        user_id=user.id,
        course_id=course_id,
        course_name=course_name,
        course_area=course_area,
        certificate_code=cert_code,
        hours_completed=hours,
        final_grade=grade,
    )

    # Generate PDF
    try:
        accent_color = AREA_COLORS.get(course_area, AREA_COLORS["default"])
        pdf_path = _generate_cert_pdf(cert, user, accent_color)
        cert.pdf_path = str(pdf_path)
    except Exception as e:
        print(f"[Cert] PDF generation error: {e}")

    db.add(cert)

    # Auto-add to user's CV certifications
    try:
        current_certs = user.cv_certifications or ""
        cert_entry = f"{course_name} — Conniku ({datetime.utcnow().strftime('%B %Y')}) — Verificar: conniku.com/cert/{cert_code}"
        if cert_entry not in current_certs:
            user.cv_certifications = (current_certs + "\n" + cert_entry).strip()
    except Exception:
        pass

    db.flush()

    # Send certificate email
    try:
        _send_cert_email(user, cert)
    except Exception as e:
        print(f"[Cert] Email error: {e}")

    return {
        "id": cert.id,
        "code": cert.certificate_code,
        "courseName": cert.course_name,
        "issuedAt": cert.issued_at.isoformat(),
        "pdfPath": cert.pdf_path,
        "verifyUrl": f"https://conniku.com/cert/{cert.certificate_code}",
    }


@router.post("/generate/{course_id}")
def generate_certificate(
    course_id: str,
    data: dict = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a certificate for a completed course."""
    if data is None:
        data = {}
    course_name = data.get("courseName", "Curso")
    course_area = data.get("courseArea", "default")
    hours = data.get("hours", 0)
    grade = data.get("grade", 0)

    result = generate_certificate_for_user(
        user, course_id, course_name, course_area, hours, grade, db
    )
    db.commit()
    return result


@router.get("/verify/{code}")
def verify_certificate(code: str, db: Session = Depends(get_db)):
    """Endpoint publico — cualquier persona puede verificar un certificado por codigo. Sin autenticacion."""
    cert = db.query(Certificate).filter(
        Certificate.certificate_code == code,
        Certificate.is_public == True,
    ).first()

    if not cert:
        raise HTTPException(404, "Certificado no encontrado o no es publico")

    user = db.query(User).filter(User.id == cert.user_id).first()

    return {
        "valid": True,
        "studentName": f"{user.first_name} {user.last_name}" if user else "Estudiante",
        "courseName": cert.course_name,
        "courseArea": cert.course_area,
        "issuedAt": cert.issued_at.isoformat(),
        "hoursCompleted": cert.hours_completed,
        "finalGrade": cert.final_grade,
        "code": cert.certificate_code,
        "institution": "Conniku SpA",
    }


@router.get("/my")
def my_certificates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all certificates for the current user."""
    certs = db.query(Certificate).filter(
        Certificate.user_id == user.id
    ).order_by(Certificate.issued_at.desc()).all()

    return [{
        "id": c.id,
        "courseName": c.course_name,
        "courseArea": c.course_area,
        "code": c.certificate_code,
        "issuedAt": c.issued_at.isoformat(),
        "hours": c.hours_completed,
        "grade": c.final_grade,
        "hasPdf": bool(c.pdf_path),
        "verifyUrl": f"https://conniku.com/cert/{c.certificate_code}",
    } for c in certs]


@router.get("/download/{cert_id}")
def download_certificate(cert_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Download certificate PDF."""
    cert = db.query(Certificate).filter(
        Certificate.id == cert_id,
        Certificate.user_id == user.id,
    ).first()
    if not cert or not cert.pdf_path:
        raise HTTPException(404, "Certificado no encontrado")

    path = Path(cert.pdf_path)
    if not path.exists():
        raise HTTPException(404, "Archivo no disponible")

    return FileResponse(str(path), filename=f"Certificado_{cert.course_name}.pdf", media_type="application/pdf")


def _generate_cert_pdf(cert: Certificate, user: User, accent_color: str) -> Path:
    """Generate certificate PDF using reportlab."""
    try:
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import HexColor

        pdf_path = CERT_DIR / f"{cert.id}.pdf"
        c = canvas.Canvas(str(pdf_path), pagesize=landscape(A4))
        width, height = landscape(A4)

        # Background
        c.setFillColor(HexColor("#FFFFFF"))
        c.rect(0, 0, width, height, fill=1)

        # Accent color line at top
        c.setFillColor(HexColor(accent_color))
        c.rect(0, height - 8, width, 8, fill=1)

        # Border
        c.setStrokeColor(HexColor("#E0E4E7"))
        c.setLineWidth(1)
        c.rect(30, 30, width - 60, height - 60)

        # Inner accent line
        c.setStrokeColor(HexColor(accent_color))
        c.setLineWidth(2)
        c.rect(40, 40, width - 80, height - 80)

        # Title
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(HexColor("#151B1E"))
        c.drawCentredString(width / 2, height - 120, "CERTIFICADO DE COMPLETACION")

        # Subtitle
        c.setFont("Helvetica", 14)
        c.setFillColor(HexColor("#4A5568"))
        c.drawCentredString(width / 2, height - 150, "Conniku — Plataforma de Aprendizaje")

        # Certifies text
        c.setFont("Helvetica", 13)
        c.drawCentredString(width / 2, height - 200, "Se certifica que")

        # Student name
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(HexColor(accent_color))
        student_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or "Estudiante"
        c.drawCentredString(width / 2, height - 240, student_name)

        # Course text
        c.setFont("Helvetica", 13)
        c.setFillColor(HexColor("#4A5568"))
        c.drawCentredString(width / 2, height - 280, "ha completado satisfactoriamente el curso")

        # Course name
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(HexColor("#151B1E"))
        c.drawCentredString(width / 2, height - 315, cert.course_name)

        # Details
        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor("#8E99A4"))
        details = f"Horas: {cert.hours_completed} · Nota: {cert.final_grade:.1f} · Fecha: {cert.issued_at.strftime('%d/%m/%Y')}"
        c.drawCentredString(width / 2, height - 345, details)

        # Verification code
        c.setFont("Helvetica", 10)
        c.setFillColor(HexColor("#8E99A4"))
        c.drawCentredString(width / 2, 80, f"Codigo de verificacion: {cert.certificate_code}")
        c.drawCentredString(width / 2, 65, f"Verificar en: conniku.com/cert/{cert.certificate_code}")

        # Signature line
        c.setStrokeColor(HexColor("#E0E4E7"))
        c.line(width / 2 - 100, 120, width / 2 + 100, 120)
        c.setFont("Helvetica", 10)
        c.setFillColor(HexColor("#4A5568"))
        c.drawCentredString(width / 2, 105, "Cristian — Fundador de Conniku")

        c.save()
        return pdf_path
    except ImportError:
        print("[Cert] reportlab not installed")
        return Path("")


def _send_cert_email(user: User, cert: Certificate):
    """Send certificate notification email."""
    try:
        from notifications import _send_email_async, _email_template
    except ImportError:
        print("[Cert] notifications module not available")
        return

    body = f"""
        <p>Hola <strong>{user.first_name or 'estudiante'}</strong>,</p>
        <p>Completaste el curso <strong>"{cert.course_name}"</strong> y tu certificado ya esta disponible.</p>
        <p>Puedes descargarlo directamente desde tu perfil en Conniku, o verificar su autenticidad con el codigo:</p>
        <p style="font-size: 18px; font-weight: bold; color: #2D62C8;">{cert.certificate_code}</p>
        <p>Este certificado ya se agrego automaticamente a tu CV en Conniku. Cualquier reclutador puede verificar su autenticidad.</p>
        <p>Sigue asi, cada paso cuenta.</p>
        <p>— Cristian<br/>Fundador de Conniku</p>
    """
    html = _email_template("Tu certificado esta listo", body, "Ver Certificado", "https://conniku.com/courses")
    _send_email_async(user.email, f"Tu certificado de {cert.course_name} esta listo — Conniku", html)
