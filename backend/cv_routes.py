"""CV/Resume upload and text extraction routes."""
import os
import re
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db, User, gen_id, DATA_DIR
from middleware import get_current_user

router = APIRouter(prefix="/cv", tags=["cv"])

CV_UPLOAD_DIR = DATA_DIR / "uploads" / "cv"
CV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except ImportError:
        # Fallback: try pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text.strip()
        except ImportError:
            return ""
    except Exception as e:
        print(f"[CV] PDF extraction error: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from Word document."""
    try:
        import docx
        doc = docx.Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except ImportError:
        return ""
    except Exception as e:
        print(f"[CV] DOCX extraction error: {e}")
        return ""


def parse_cv_sections(text: str) -> dict:
    """Parse extracted CV text into structured sections using heuristics."""
    result = {
        "headline": "",
        "summary": "",
        "experience": "",
        "skills": "",
        "certifications": "",
        "languages": "",
        "portfolio": "",
    }

    if not text:
        return result

    lines = text.split("\n")

    # Try to extract name/headline from first non-empty lines
    for line in lines[:5]:
        line = line.strip()
        if line and len(line) < 100:
            result["headline"] = line
            break

    # Section detection patterns (Spanish + English)
    section_patterns = {
        "summary": r"(?i)(resumen|perfil|sobre m[ií]|about|summary|profile|objetivo|objective)",
        "experience": r"(?i)(experiencia|experience|trabajo|work|employment|empleo|historial laboral|trayectoria)",
        "skills": r"(?i)(habilidades|skills|competencias|conocimientos|aptitudes|tecnolog[ií]as|herramientas|tools)",
        "certifications": r"(?i)(certificacion|certification|certificado|diploma|cursos?|formaci[oó]n|education|educaci[oó]n|estudios|acad[eé]mi)",
        "languages": r"(?i)(idiomas|languages|lenguaje)",
        "portfolio": r"(?i)(portfolio|portafolio|proyectos|projects|enlaces|links|sitio web|website|github|linkedin)",
    }

    current_section = None
    section_content = {k: [] for k in section_patterns}

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if this line is a section header
        matched = False
        for section, pattern in section_patterns.items():
            if re.match(pattern, stripped) and len(stripped) < 60:
                current_section = section
                matched = True
                break

        if not matched and current_section:
            section_content[current_section].append(stripped)

    for section, content_lines in section_content.items():
        if content_lines:
            result[section] = "\n".join(content_lines)

    # If no sections detected, put everything in summary
    if not any(result[k] for k in ["experience", "skills", "certifications"]):
        result["summary"] = text[:2000]

    return result


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a CV (PDF or Word) and extract text to auto-fill profile fields."""
    if not file.filename:
        raise HTTPException(400, "No se proporcionó archivo")

    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(400, "Formato no soportado. Usa PDF o Word (.docx)")

    # Save file
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "Archivo muy grande (máximo 10 MB)")

    file_id = gen_id()
    file_path = CV_UPLOAD_DIR / f"{user.id}_{file_id}{ext}"
    file_path.write_bytes(content)

    # Extract text
    if ext == ".pdf":
        raw_text = extract_text_from_pdf(str(file_path))
    elif ext in [".doc", ".docx"]:
        raw_text = extract_text_from_docx(str(file_path))
    else:
        raw_text = ""

    if not raw_text:
        return {
            "success": False,
            "message": "No se pudo extraer texto del archivo. Completa los campos manualmente.",
            "filePath": str(file_path),
            "draft": {
                "headline": "",
                "summary": "",
                "experience": "",
                "skills": "",
                "certifications": "",
                "languages": "",
                "portfolio": "",
            }
        }

    # Parse into sections
    draft = parse_cv_sections(raw_text)

    # Save file path to user record
    user.cv_file_path = str(file_path)
    db.commit()

    return {
        "success": True,
        "message": "CV procesado correctamente. Revisa y corrige los campos.",
        "filePath": str(file_path),
        "rawTextLength": len(raw_text),
        "draft": draft,
    }


@router.get("/draft")
def get_cv_data(user: User = Depends(get_current_user)):
    """Get current CV data for the user."""
    return {
        "headline": getattr(user, "cv_headline", "") or "",
        "summary": getattr(user, "cv_summary", "") or "",
        "experience": getattr(user, "cv_experience", "") or "",
        "skills": getattr(user, "cv_skills", "") or "",
        "certifications": getattr(user, "cv_certifications", "") or "",
        "languages": getattr(user, "cv_languages", "") or "",
        "portfolio": getattr(user, "cv_portfolio", "") or "",
        "visibility": getattr(user, "cv_visibility", "private") or "private",
        "filePath": getattr(user, "cv_file_path", "") or "",
    }
