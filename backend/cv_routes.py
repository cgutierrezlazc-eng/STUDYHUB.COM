"""
CV/Resume: full LinkedIn-style professional profile system.
Upload PDF/DOCX -> extract text -> Gemini AI parse -> structured CVProfile.
PDF generation with ReportLab. Public profiles for recruiters.
"""
import os
import re
import json
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Float, or_, and_
from sqlalchemy.orm import Session

from database import (
    Base, engine, get_db, User, gen_id, DATA_DIR,
    Friendship, Course, UserCourseProgress,
)
from middleware import get_current_user, get_current_user_optional

router = APIRouter(prefix="/cv", tags=["cv"])

CV_UPLOAD_DIR = DATA_DIR / "uploads" / "cv"
CV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

CV_PDF_DIR = DATA_DIR / "cv_pdfs"
CV_PDF_DIR.mkdir(parents=True, exist_ok=True)


# ─── CVProfile Model ───────────────────────────────────────────

class CVProfile(Base):
    __tablename__ = "cv_profiles"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    is_public = Column(Boolean, default=True)
    visibility = Column(String(20), default="public")  # public, friends, recruiters, private

    # Header
    headline = Column(String(500), default="")
    summary = Column(Text, default="")
    location = Column(String(255), default="")
    phone = Column(String(50), default="")
    website = Column(String(500), default="")
    linkedin_url = Column(String(500), default="")

    # Availability
    open_to_work = Column(Boolean, default=False)
    available_worldwide = Column(Boolean, default=False)

    # Cover
    cover_image_url = Column(Text, default="")

    # Structured JSON fields (stored as JSON text)
    experience = Column(Text, default="[]")       # [{company, title, start_date, end_date, current, location, bullets:[]}]
    education = Column(Text, default="[]")         # [{institution, degree, field, start_date, end_date, gpa, description}]
    certifications = Column(Text, default="[]")    # [{name, issuer, date, credential_id, url}]
    skills = Column(Text, default="[]")            # [{category, items:[{name, proficiency}]}]
    languages = Column(Text, default="[]")         # [{language, proficiency}]
    differentiators = Column(Text, default="[]")   # [{title, description}]

    # Original text from upload
    raw_text = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


# Create table
Base.metadata.create_all(engine)


# ─── Pydantic schemas ──────────────────────────────────────────

class CVUpdateRequest(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    open_to_work: Optional[bool] = None
    available_worldwide: Optional[bool] = None
    cover_image_url: Optional[str] = None
    is_public: Optional[bool] = None
    experience: Optional[list] = None
    education: Optional[list] = None
    certifications: Optional[list] = None
    skills: Optional[list] = None
    languages: Optional[list] = None
    differentiators: Optional[list] = None
    visibility: Optional[str] = None


# ─── Text extraction helpers ───────────────────────────────────

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


# ─── Heuristic parser (fallback) ──────────────────────────────

def parse_cv_sections_heuristic(text: str) -> dict:
    """Parse extracted CV text into structured sections using heuristics."""
    result = {
        "headline": "",
        "summary": "",
        "experience": [],
        "education": [],
        "certifications": [],
        "skills": [],
        "languages": [],
        "differentiators": [],
    }

    if not text:
        return result

    lines = text.split("\n")

    # Extract headline from first non-empty lines
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
        "education": r"(?i)(educaci[oó]n|education|estudios|acad[eé]mi|formaci[oó]n|universidad|university)",
        "certifications": r"(?i)(certificacion|certification|certificado|diploma|cursos?|licencias?|licenses?)",
        "languages": r"(?i)(idiomas|languages|lenguaje)",
    }

    current_section = None
    section_content = {k: [] for k in section_patterns}

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        matched = False
        for section, pattern in section_patterns.items():
            if re.match(pattern, stripped) and len(stripped) < 60:
                current_section = section
                matched = True
                break

        if not matched and current_section:
            section_content[current_section].append(stripped)

    # Build summary
    if section_content["summary"]:
        result["summary"] = "\n".join(section_content["summary"])

    # Build experience as list of entries
    if section_content["experience"]:
        raw_exp = "\n".join(section_content["experience"])
        result["experience"] = [{
            "company": "",
            "title": "",
            "start_date": "",
            "end_date": "",
            "current": False,
            "location": "",
            "bullets": [line for line in section_content["experience"] if line.strip()],
        }]

    # Build education
    if section_content["education"]:
        result["education"] = [{
            "institution": "",
            "degree": "",
            "field": "",
            "start_date": "",
            "end_date": "",
            "gpa": "",
            "description": "\n".join(section_content["education"]),
        }]

    # Build skills
    if section_content["skills"]:
        result["skills"] = [{
            "category": "General",
            "items": [{"name": s.strip().strip("•-"), "proficiency": "intermediate"}
                      for s in section_content["skills"] if s.strip()],
        }]

    # Build certifications
    if section_content["certifications"]:
        result["certifications"] = [{
            "name": line.strip(),
            "issuer": "",
            "date": "",
            "credential_id": "",
            "url": "",
        } for line in section_content["certifications"] if line.strip()]

    # Build languages
    if section_content["languages"]:
        result["languages"] = [
            {"language": line.strip(), "proficiency": ""}
            for line in section_content["languages"] if line.strip()
        ]

    # If nothing detected, put everything in summary
    if not any(result[k] for k in ["experience", "skills", "certifications", "education"]):
        result["summary"] = text[:3000]

    return result


# ─── Gemini AI Parser ─────────────────────────────────────────

def parse_cv_with_gemini(raw_text: str) -> dict:
    """
    Use Gemini API to parse raw CV text into structured JSON.
    Falls back to heuristic parsing if Gemini is unavailable or fails.
    """
    try:
        import google.generativeai as genai

        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            config_file = DATA_DIR / "config.json"
            if config_file.exists():
                try:
                    cfg = json.loads(config_file.read_text())
                    api_key = cfg.get("gemini_api_key", "")
                except Exception:
                    pass

        if not api_key:
            print("[CV] Gemini API key no disponible, usando parser heuristico")
            return parse_cv_sections_heuristic(raw_text)

        genai.configure(api_key=api_key)

        system_prompt = """Eres un experto analizador de CVs/hojas de vida. Tu tarea es extraer informacion estructurada
de texto crudo de un CV y devolverlo como JSON valido.

Responde SOLO con JSON valido con esta estructura exacta:
{
  "headline": "Titulo profesional breve (ej: Ingeniero Civil Industrial | Especialista en IA)",
  "summary": "Resumen profesional de 2-4 oraciones",
  "experience": [
    {
      "company": "Nombre de la empresa",
      "title": "Cargo/titulo",
      "start_date": "YYYY-MM o texto",
      "end_date": "YYYY-MM o 'Presente'",
      "current": false,
      "location": "Ciudad, Pais",
      "bullets": ["Logro o responsabilidad 1", "Logro 2"]
    }
  ],
  "education": [
    {
      "institution": "Universidad o instituto",
      "degree": "Tipo de titulo (Licenciatura, Master, etc)",
      "field": "Campo de estudio",
      "start_date": "YYYY",
      "end_date": "YYYY o 'En curso'",
      "gpa": "Nota si aparece",
      "description": "Descripcion adicional"
    }
  ],
  "certifications": [
    {
      "name": "Nombre del certificado",
      "issuer": "Institucion emisora",
      "date": "Fecha de emision",
      "credential_id": "ID si aparece",
      "url": "URL si aparece"
    }
  ],
  "skills": [
    {
      "category": "Nombre de categoria (ej: Programacion, Idiomas, Herramientas)",
      "items": [
        {"name": "Nombre de la habilidad", "proficiency": "beginner|intermediate|advanced|expert"}
      ]
    }
  ],
  "languages": [
    {"language": "Idioma", "proficiency": "Nativo|Avanzado|Intermedio|Basico"}
  ],
  "differentiators": [
    {"title": "Punto diferenciador", "description": "Descripcion breve"}
  ]
}

Reglas:
- Extrae TODA la informacion posible del texto.
- Si un campo no esta presente en el CV, usa un string vacio o lista vacia.
- Ordena la experiencia de mas reciente a mas antigua.
- Clasifica las habilidades en categorias logicas.
- El headline debe ser conciso y profesional.
- Si el CV esta en espanol, mantelo en espanol. Si esta en ingles, mantelo en ingles.
- Identifica puntos diferenciadores: premios, publicaciones, logros destacados, voluntariado, etc.
"""

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_prompt,
        )

        response = model.generate_content(
            f"Analiza este CV y extrae la informacion estructurada:\n\n{raw_text[:12000]}",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=8192,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )

        parsed = json.loads(response.text)

        # Validate required keys exist
        required_keys = ["headline", "summary", "experience", "education", "skills"]
        for key in required_keys:
            if key not in parsed:
                parsed[key] = "" if key in ("headline", "summary") else []

        # Ensure list fields are lists
        for key in ["experience", "education", "certifications", "skills", "languages", "differentiators"]:
            if key not in parsed or not isinstance(parsed[key], list):
                parsed[key] = []

        return parsed

    except Exception as e:
        print(f"[CV] Gemini parse error: {e}, usando parser heuristico")
        return parse_cv_sections_heuristic(raw_text)


# ─── CV PDF Generator (ReportLab) ─────────────────────────────

def generate_cv_pdf(cv_data: dict, user_data: dict) -> bytes:
    """
    Generate an elegant professional CV PDF using ReportLab.
    Matches the owner's CV structure:
    1. Name  2. Headline  3. Location only (privacy)  4. Summary
    5. Core Competencies (tags)  6. Experience  7. Education
    8. Certifications  9. Differentiators  10. Languages
    11. Completed Conniku Courses
    Returns PDF bytes.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch, mm
        from reportlab.lib.colors import HexColor, Color
        from reportlab.pdfgen import canvas
        import io

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter  # 612 x 792 points

        # ── Color palette ──
        BLUE_PRIMARY = HexColor("#2D62C8")
        BLUE_DARK = HexColor("#1A3A7A")
        BLUE_LIGHT = HexColor("#E8F0FE")
        TEXT_DARK = HexColor("#1A1A2E")
        TEXT_MEDIUM = HexColor("#4A5568")
        TEXT_LIGHT = HexColor("#8E99A4")
        ACCENT = HexColor("#2D62C8")
        DIVIDER = HexColor("#E2E8F0")
        WHITE = HexColor("#FFFFFF")
        BG_SECTION = HexColor("#F7FAFC")

        # ── Helper functions ──
        page_count = [1]

        def draw_footer():
            c.setFont("Helvetica", 7)
            c.setFillColor(TEXT_LIGHT)
            c.drawString(50, 28, f"Perfil profesional generado en conniku.com — {datetime.utcnow().strftime('%d/%m/%Y')}")
            c.drawRightString(width - 50, 28, f"Pagina {page_count[0]}")

        def new_page():
            draw_footer()
            c.showPage()
            page_count[0] += 1
            return height - 60

        def draw_section_title(y_pos, title):
            if y_pos < 100:
                y_pos = new_page()
            c.setStrokeColor(DIVIDER)
            c.setLineWidth(0.5)
            c.line(50, y_pos + 4, width - 50, y_pos + 4)
            y_pos -= 6
            c.setFillColor(ACCENT)
            c.rect(50, y_pos - 12, 3, 14, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(BLUE_DARK)
            c.drawString(58, y_pos - 10, title.upper())
            return y_pos - 30

        def draw_wrapped_text(y_pos, text, x=50, max_width=500, font="Helvetica", size=9, color=TEXT_MEDIUM, leading=13):
            if not text:
                return y_pos
            c.setFont(font, size)
            c.setFillColor(color)
            words = text.split()
            line = ""
            for word in words:
                test_line = f"{line} {word}".strip() if line else word
                if c.stringWidth(test_line, font, size) < max_width:
                    line = test_line
                else:
                    if y_pos < 60:
                        y_pos = new_page()
                    c.drawString(x, y_pos, line)
                    y_pos -= leading
                    line = word
            if line:
                if y_pos < 60:
                    y_pos = new_page()
                c.drawString(x, y_pos, line)
                y_pos -= leading
            return y_pos

        # ── Parse CV data ──
        full_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Profesional"
        headline = cv_data.get("headline", "")
        summary = cv_data.get("summary", "")
        location = cv_data.get("location", "")

        def _parse_json_field(val):
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except Exception:
                    return []
            return val or []

        experience = _parse_json_field(cv_data.get("experience", []))
        education = _parse_json_field(cv_data.get("education", []))
        certifications = _parse_json_field(cv_data.get("certifications", []))
        skills = _parse_json_field(cv_data.get("skills", []))
        languages = _parse_json_field(cv_data.get("languages", []))
        differentiators = _parse_json_field(cv_data.get("differentiators", []))
        completed_courses = cv_data.get("completed_courses", [])

        # ════════════════════════════════════════════════════════════
        #  1. PAGE HEADER — Name (large, bold, centered)
        # ════════════════════════════════════════════════════════════

        # Top blue accent bar
        c.setFillColor(BLUE_PRIMARY)
        c.rect(0, height - 6, width, 6, fill=1, stroke=0)

        # Header background
        c.setFillColor(HexColor("#F0F4FA"))
        c.rect(0, height - 130, width, 124, fill=1, stroke=0)

        # Conniku logo text top-left
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(BLUE_PRIMARY)
        c.drawString(50, height - 24, "conniku")
        c.setFont("Helvetica", 6)
        c.setFillColor(TEXT_LIGHT)
        c.drawString(50, height - 33, "conniku.com")

        # Full name — large, bold, centered
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(TEXT_DARK)
        name_width = c.stringWidth(full_name, "Helvetica-Bold", 24)
        c.drawString((width - name_width) / 2, height - 58, full_name)

        # 2. Headline — subtitle, centered
        y = height - 78
        if headline:
            c.setFont("Helvetica", 10)
            c.setFillColor(BLUE_PRIMARY)
            display_headline = headline[:110] + ("..." if len(headline) > 110 else "")
            hl_width = c.stringWidth(display_headline, "Helvetica", 10)
            if hl_width > (width - 100):
                # two-line headline
                mid = len(display_headline) // 2
                space_idx = display_headline.find(" ", mid)
                if space_idx == -1:
                    space_idx = mid
                line1 = display_headline[:space_idx].strip()
                line2 = display_headline[space_idx:].strip()
                c.drawString((width - c.stringWidth(line1, "Helvetica", 10)) / 2, y, line1)
                y -= 13
                c.drawString((width - c.stringWidth(line2, "Helvetica", 10)) / 2, y, line2)
                y -= 13
            else:
                c.drawString((width - hl_width) / 2, y, display_headline)
                y -= 16

        # 3. Contact info line — location ONLY (privacy: no email, no phone)
        contact_parts = []
        if location:
            contact_parts.append(location)
        website = cv_data.get("website", "")
        linkedin = cv_data.get("linkedin_url", "")
        if website:
            contact_parts.append(website)
        if linkedin:
            contact_parts.append(linkedin)

        if contact_parts:
            c.setFont("Helvetica", 8)
            c.setFillColor(TEXT_MEDIUM)
            contact_line = "  |  ".join(contact_parts)
            cl_width = c.stringWidth(contact_line, "Helvetica", 8)
            c.drawString((width - cl_width) / 2, y, contact_line)
            y -= 12

        # Open to work badge (centered)
        if cv_data.get("open_to_work"):
            y -= 2
            badge_text = "ABIERTO A OPORTUNIDADES"
            badge_width = c.stringWidth(badge_text, "Helvetica-Bold", 7) + 12
            badge_x = (width - badge_width) / 2
            c.setFillColor(HexColor("#DEF7EC"))
            c.roundRect(badge_x, y - 3, badge_width, 14, 4, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 7)
            c.setFillColor(HexColor("#03543F"))
            c.drawString(badge_x + 6, y, badge_text)
            y -= 10

        y = height - 145

        # ════════════════════════════════════════════════════════════
        #  4. PROFESSIONAL SUMMARY
        # ════════════════════════════════════════════════════════════
        if summary:
            y = draw_section_title(y, "Resumen Profesional")
            y = draw_wrapped_text(y, summary, x=50, max_width=510, font="Helvetica", size=9,
                                  color=TEXT_MEDIUM, leading=13)
            y -= 10

        # ════════════════════════════════════════════════════════════
        #  5. CORE COMPETENCIES (tags/pills from skills)
        # ════════════════════════════════════════════════════════════
        if skills and isinstance(skills, list) and len(skills) > 0:
            y = draw_section_title(y, "Competencias Principales")

            for skill_cat in skills:
                if not isinstance(skill_cat, dict):
                    continue
                if y < 60:
                    y = new_page()

                category = skill_cat.get("category", "General")
                items = skill_cat.get("items", [])

                c.setFont("Helvetica-Bold", 9)
                c.setFillColor(TEXT_DARK)
                c.drawString(50, y, category)
                y -= 14

                if isinstance(items, list):
                    x_pos = 50
                    for item in items:
                        if not isinstance(item, dict):
                            continue
                        name = item.get("name", "")
                        if not name:
                            continue
                        prof = item.get("proficiency", "")
                        # Numeric proficiency -> color
                        if isinstance(prof, (int, float)):
                            if prof >= 90:
                                bg = HexColor("#DEF7EC")
                            elif prof >= 80:
                                bg = HexColor("#E8F0FE")
                            elif prof >= 60:
                                bg = HexColor("#F0F4FA")
                            else:
                                bg = HexColor("#FEF3C7")
                        else:
                            prof_colors = {
                                "expert": HexColor("#DEF7EC"),
                                "advanced": HexColor("#E8F0FE"),
                                "intermediate": HexColor("#F0F4FA"),
                                "beginner": HexColor("#FEF3C7"),
                            }
                            bg = prof_colors.get(str(prof), HexColor("#F0F4FA"))

                        tag_text = name
                        tag_width = c.stringWidth(tag_text, "Helvetica", 8) + 14
                        if x_pos + tag_width > width - 50:
                            x_pos = 50
                            y -= 18
                            if y < 60:
                                y = new_page()

                        c.setFillColor(bg)
                        c.roundRect(x_pos, y - 3, tag_width, 15, 3, fill=1, stroke=0)
                        c.setFont("Helvetica", 8)
                        c.setFillColor(TEXT_DARK)
                        c.drawString(x_pos + 7, y, tag_text)
                        x_pos += tag_width + 6

                    y -= 20

        # ════════════════════════════════════════════════════════════
        #  6. PROFESSIONAL EXPERIENCE (reverse chronological)
        # ════════════════════════════════════════════════════════════
        if experience and isinstance(experience, list) and len(experience) > 0:
            y = draw_section_title(y, "Experiencia Profesional")

            for exp in experience:
                if not isinstance(exp, dict):
                    continue
                if y < 80:
                    y = new_page()

                title = exp.get("title", "")
                company = exp.get("company", "")
                start = exp.get("start_date", "")
                end = "Presente" if exp.get("current") or not exp.get("end_date", "") else exp.get("end_date", "")
                loc = exp.get("location", "")
                description = exp.get("description", "")

                # Title + Company
                c.setFont("Helvetica-Bold", 10)
                c.setFillColor(TEXT_DARK)
                c.drawString(50, y, title)

                if company:
                    c.setFont("Helvetica", 9)
                    c.setFillColor(BLUE_PRIMARY)
                    c.drawString(50, y - 14, company)

                # Date + Location on the right
                date_str = f"{start} — {end}" if start else end
                if date_str:
                    c.setFont("Helvetica", 8)
                    c.setFillColor(TEXT_LIGHT)
                    c.drawRightString(width - 50, y, date_str)
                if loc:
                    c.setFont("Helvetica", 8)
                    c.setFillColor(TEXT_LIGHT)
                    c.drawRightString(width - 50, y - 14, loc)

                y -= 30

                # Description paragraph (preferred) or bullet points
                if description and isinstance(description, str):
                    # Split description by ". " to create bullet points
                    desc_bullets = [s.strip() for s in description.split(". ") if s.strip()]
                    for bullet in desc_bullets:
                        if y < 60:
                            y = new_page()
                        c.setFillColor(ACCENT)
                        c.circle(58, y + 3, 2, fill=1, stroke=0)
                        bullet_text = bullet if bullet.endswith(".") else bullet + "."
                        y = draw_wrapped_text(y, bullet_text, x=66, max_width=480, font="Helvetica",
                                              size=8.5, color=TEXT_MEDIUM, leading=12)
                else:
                    bullets = exp.get("bullets", [])
                    if isinstance(bullets, list):
                        for bullet in bullets:
                            if not bullet or not isinstance(bullet, str):
                                continue
                            if y < 60:
                                y = new_page()
                            c.setFillColor(ACCENT)
                            c.circle(58, y + 3, 2, fill=1, stroke=0)
                            y = draw_wrapped_text(y, bullet, x=66, max_width=480, font="Helvetica",
                                                  size=8.5, color=TEXT_MEDIUM, leading=12)

                y -= 8

        # ════════════════════════════════════════════════════════════
        #  7. EDUCATION
        # ════════════════════════════════════════════════════════════
        if education and isinstance(education, list) and len(education) > 0:
            y = draw_section_title(y, "Educacion")

            for edu in education:
                if not isinstance(edu, dict):
                    continue
                if y < 80:
                    y = new_page()

                institution = edu.get("institution", "")
                degree = edu.get("degree", "")
                field = edu.get("field", "")
                start = edu.get("start_year", "") or edu.get("start_date", "")
                end = edu.get("end_year", "") or edu.get("end_date", "")
                gpa = edu.get("gpa", "")
                desc = edu.get("description", "")

                degree_line = degree
                if field:
                    degree_line = f"{degree} — {field}" if degree else field

                c.setFont("Helvetica-Bold", 10)
                c.setFillColor(TEXT_DARK)
                c.drawString(50, y, degree_line or institution)

                if institution and degree_line:
                    c.setFont("Helvetica", 9)
                    c.setFillColor(BLUE_PRIMARY)
                    c.drawString(50, y - 14, institution)

                date_str = f"{start} — {end}" if start and end else (start or end)
                if date_str:
                    c.setFont("Helvetica", 8)
                    c.setFillColor(TEXT_LIGHT)
                    c.drawRightString(width - 50, y, date_str)

                y -= 30

                if gpa:
                    y = draw_wrapped_text(y, f"GPA/Nota: {gpa}", x=50, max_width=510,
                                          font="Helvetica", size=8.5, color=TEXT_MEDIUM)
                if desc:
                    y = draw_wrapped_text(y, desc, x=50, max_width=510,
                                          font="Helvetica", size=8.5, color=TEXT_MEDIUM, leading=12)
                y -= 6

        # ════════════════════════════════════════════════════════════
        #  8. PROFESSIONAL CERTIFICATIONS (grouped list)
        # ════════════════════════════════════════════════════════════
        if certifications and isinstance(certifications, list) and len(certifications) > 0:
            y = draw_section_title(y, "Certificaciones Profesionales")

            # Group by issuer
            by_issuer = {}
            ungrouped = []
            for cert in certifications:
                if not isinstance(cert, dict):
                    continue
                issuer = cert.get("issuer", "").strip()
                if issuer:
                    by_issuer.setdefault(issuer, []).append(cert)
                else:
                    ungrouped.append(cert)

            for issuer, certs in by_issuer.items():
                if y < 60:
                    y = new_page()
                c.setFont("Helvetica-Bold", 9)
                c.setFillColor(TEXT_DARK)
                c.drawString(50, y, issuer)
                y -= 14
                for cert in certs:
                    if y < 60:
                        y = new_page()
                    c.setFillColor(ACCENT)
                    c.circle(58, y + 3, 2, fill=1, stroke=0)
                    c.setFont("Helvetica", 8.5)
                    c.setFillColor(TEXT_MEDIUM)
                    c.drawString(66, y, cert.get("name", ""))
                    y -= 14

            for cert in ungrouped:
                if y < 60:
                    y = new_page()
                c.setFillColor(ACCENT)
                c.circle(58, y + 3, 2, fill=1, stroke=0)
                c.setFont("Helvetica-Bold", 9)
                c.setFillColor(TEXT_DARK)
                c.drawString(66, y, cert.get("name", ""))
                y -= 14

            y -= 4

        # ════════════════════════════════════════════════════════════
        #  9. "LO QUE DIFERENCIA ESTE PERFIL" (bullet points)
        # ════════════════════════════════════════════════════════════
        if differentiators and isinstance(differentiators, list) and len(differentiators) > 0:
            y = draw_section_title(y, "Lo Que Diferencia Este Perfil")

            for diff in differentiators:
                if y < 60:
                    y = new_page()

                # Support both string items and dict items
                if isinstance(diff, str):
                    diff_text = diff
                elif isinstance(diff, dict):
                    diff_text = diff.get("title", "") or diff.get("description", "")
                else:
                    continue

                if not diff_text:
                    continue

                c.setFillColor(ACCENT)
                c.circle(58, y + 3, 2, fill=1, stroke=0)
                y = draw_wrapped_text(y, diff_text, x=66, max_width=480, font="Helvetica",
                                      size=8.5, color=TEXT_MEDIUM, leading=12)
                y -= 2

        # ════════════════════════════════════════════════════════════
        #  10. LANGUAGES
        # ════════════════════════════════════════════════════════════
        if languages and isinstance(languages, list) and len(languages) > 0:
            y = draw_section_title(y, "Idiomas")

            for lang in languages:
                if not isinstance(lang, dict):
                    continue
                if y < 60:
                    y = new_page()

                language = lang.get("language", "") or lang.get("name", "")
                proficiency = lang.get("proficiency", "") or lang.get("level", "")

                c.setFont("Helvetica-Bold", 9)
                c.setFillColor(TEXT_DARK)
                c.drawString(66, y, language)

                if proficiency:
                    c.setFont("Helvetica", 8)
                    c.setFillColor(TEXT_LIGHT)
                    prof_x = 66 + c.stringWidth(language, "Helvetica-Bold", 9) + 10
                    c.drawString(prof_x, y, f"— {proficiency}")

                y -= 16

        # ════════════════════════════════════════════════════════════
        #  11. COMPLETED CONNIKU COURSES (auto-populated)
        # ════════════════════════════════════════════════════════════
        if completed_courses and isinstance(completed_courses, list) and len(completed_courses) > 0:
            y = draw_section_title(y, "Cursos Completados en Conniku")

            for course in completed_courses:
                if not isinstance(course, dict):
                    continue
                if y < 60:
                    y = new_page()

                title = course.get("title", "")
                completed_at = course.get("completed_at", "")
                area = course.get("area", "")

                c.setFillColor(ACCENT)
                c.circle(58, y + 3, 2, fill=1, stroke=0)

                c.setFont("Helvetica-Bold", 9)
                c.setFillColor(TEXT_DARK)
                c.drawString(66, y, title)

                meta_parts = []
                if area:
                    meta_parts.append(area)
                if completed_at:
                    meta_parts.append(completed_at)
                if meta_parts:
                    c.setFont("Helvetica", 8)
                    c.setFillColor(TEXT_LIGHT)
                    c.drawString(66, y - 12, " — ".join(meta_parts))
                    y -= 26
                else:
                    y -= 16

        # ── Final footer ──
        draw_footer()
        c.save()

        return buffer.getvalue()

    except ImportError:
        print("[CV] reportlab no instalado")
        return b""
    except Exception as e:
        print(f"[CV] Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        return b""


# ─── Helper: CVProfile -> dict ─────────────────────────────────

def _cv_profile_to_dict(cv: CVProfile, include_raw: bool = False) -> dict:
    """Convert CVProfile to API response dict."""
    def _safe_json(val):
        if isinstance(val, str):
            try:
                return json.loads(val)
            except Exception:
                return []
        return val or []

    result = {
        "id": cv.id,
        "user_id": cv.user_id,
        "is_public": cv.is_public,
        "visibility": getattr(cv, "visibility", "public") or "public",
        "headline": cv.headline or "",
        "summary": cv.summary or "",
        "location": cv.location or "",
        "phone": cv.phone or "",
        "website": cv.website or "",
        "linkedin_url": cv.linkedin_url or "",
        "open_to_work": cv.open_to_work or False,
        "available_worldwide": cv.available_worldwide or False,
        "cover_image_url": cv.cover_image_url or "",
        "experience": _safe_json(cv.experience),
        "education": _safe_json(cv.education),
        "certifications": _safe_json(cv.certifications),
        "skills": _safe_json(cv.skills),
        "languages": _safe_json(cv.languages),
        "differentiators": _safe_json(cv.differentiators),
        "created_at": cv.created_at.isoformat() if cv.created_at else None,
        "updated_at": cv.updated_at.isoformat() if cv.updated_at else None,
    }
    if include_raw:
        result["raw_text"] = cv.raw_text or ""
    return result


# ─── Helper: get completed courses for a user ───────────────────

def _get_completed_courses(db: Session, user_id: str) -> list:
    """Query course completions from DB and return as list of dicts."""
    try:
        completions = (
            db.query(UserCourseProgress, Course)
            .join(Course, Course.id == UserCourseProgress.course_id)
            .filter(
                UserCourseProgress.user_id == user_id,
                UserCourseProgress.completed == True,
            )
            .order_by(UserCourseProgress.completed_at.desc())
            .all()
        )
        result = []
        for progress, course in completions:
            result.append({
                "title": course.title,
                "completed_at": progress.completed_at.strftime("%Y-%m-%d") if progress.completed_at else "",
                "area": course.category or "",
            })
        return result
    except Exception as e:
        print(f"[CV] Error consultando cursos completados: {e}")
        return []


# ─── Helper: check friendship between two users ────────────────

def _are_friends(db: Session, user_a_id: str, user_b_id: str) -> bool:
    """Check if two users have an accepted friendship."""
    friendship = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(
            and_(Friendship.requester_id == user_a_id, Friendship.addressee_id == user_b_id),
            and_(Friendship.requester_id == user_b_id, Friendship.addressee_id == user_a_id),
        ),
    ).first()
    return friendship is not None


# ═══════════════════════════════════════════════════════════════
#  API ROUTES
# ═══════════════════════════════════════════════════════════════

@router.get("/me")
def get_my_cv(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener el perfil CV del usuario autenticado."""
    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv:
        return {
            "exists": False,
            "profile": None,
            "completed_courses": _get_completed_courses(db, user.id),
        }
    profile = _cv_profile_to_dict(cv, include_raw=True)
    profile["completed_courses"] = _get_completed_courses(db, user.id)
    return {
        "exists": True,
        "profile": profile,
    }


@router.put("/me")
def update_my_cv(
    data: CVUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar el perfil CV manualmente (edicion directa)."""
    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv:
        cv = CVProfile(id=gen_id(), user_id=user.id)
        db.add(cv)

    # Update scalar fields
    scalar_fields = [
        "headline", "summary", "location", "phone", "website",
        "linkedin_url", "cover_image_url",
    ]
    for field in scalar_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(cv, field, val)

    # Update visibility
    if data.visibility is not None:
        if data.visibility in ("public", "friends", "recruiters", "private"):
            cv.visibility = data.visibility
        # Also sync is_public for backwards compatibility
        cv.is_public = data.visibility != "private"

    # Update boolean fields
    bool_fields = ["open_to_work", "available_worldwide", "is_public"]
    for field in bool_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(cv, field, val)

    # Update JSON fields (store as JSON string)
    json_fields = ["experience", "education", "certifications", "skills", "languages", "differentiators"]
    for field in json_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(cv, field, json.dumps(val, ensure_ascii=False))

    cv.updated_at = datetime.utcnow()

    # Also sync headline/summary to legacy User CV fields for backwards compatibility
    if data.headline is not None:
        user.cv_headline = data.headline
    if data.summary is not None:
        user.cv_summary = data.summary

    db.commit()
    db.refresh(cv)

    return {
        "ok": True,
        "message": "Perfil CV actualizado correctamente",
        "profile": _cv_profile_to_dict(cv),
    }


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Subir un CV (PDF o Word), extraer texto y parsear con Gemini AI."""
    if not file.filename:
        raise HTTPException(400, "No se proporciono archivo")

    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(400, "Formato no soportado. Usa PDF o Word (.docx)")

    # Save file
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "Archivo muy grande (maximo 10 MB)")

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
                "experience": [],
                "education": [],
                "certifications": [],
                "skills": [],
                "languages": [],
                "differentiators": [],
            },
        }

    # Parse with Gemini AI (falls back to heuristic)
    draft = parse_cv_with_gemini(raw_text)

    # Save to CVProfile
    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv:
        cv = CVProfile(id=gen_id(), user_id=user.id)
        db.add(cv)

    cv.raw_text = raw_text
    cv.headline = draft.get("headline", "") or cv.headline
    cv.summary = draft.get("summary", "") or cv.summary

    # Store JSON fields
    for field in ["experience", "education", "certifications", "skills", "languages", "differentiators"]:
        val = draft.get(field, [])
        if val:
            setattr(cv, field, json.dumps(val, ensure_ascii=False))

    cv.updated_at = datetime.utcnow()

    # Save file path to user record (legacy)
    user.cv_file_path = str(file_path)

    db.commit()
    db.refresh(cv)

    return {
        "success": True,
        "message": "CV procesado correctamente con IA. Revisa y corrige los campos.",
        "filePath": str(file_path),
        "rawTextLength": len(raw_text),
        "draft": draft,
        "profile": _cv_profile_to_dict(cv),
    }


@router.post("/parse")
def reparse_cv(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-parsear el texto crudo existente del CV con Gemini AI."""
    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv or not cv.raw_text:
        raise HTTPException(400, "No hay texto de CV para procesar. Sube un archivo primero.")

    draft = parse_cv_with_gemini(cv.raw_text)

    # Update fields
    cv.headline = draft.get("headline", "") or cv.headline
    cv.summary = draft.get("summary", "") or cv.summary

    for field in ["experience", "education", "certifications", "skills", "languages", "differentiators"]:
        val = draft.get(field, [])
        if val:
            setattr(cv, field, json.dumps(val, ensure_ascii=False))

    cv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cv)

    return {
        "ok": True,
        "message": "CV re-procesado con IA exitosamente",
        "draft": draft,
        "profile": _cv_profile_to_dict(cv),
    }


@router.get("/download")
def download_my_cv(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generar y descargar el CV del usuario autenticado como PDF."""
    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv:
        raise HTTPException(404, "No tienes un perfil CV creado. Completa tu perfil primero.")

    cv_data = _cv_profile_to_dict(cv)
    cv_data["completed_courses"] = _get_completed_courses(db, user.id)
    user_data = {
        "first_name": user.first_name,
        "last_name": user.last_name,
    }

    pdf_bytes = generate_cv_pdf(cv_data, user_data)
    if not pdf_bytes:
        raise HTTPException(500, "Error al generar el PDF. Intenta de nuevo.")

    filename = f"CV_{user.first_name}_{user.last_name}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# Legacy endpoint for backwards compatibility (must be before /{username} catch-all)
@router.get("/draft")
def get_cv_data_legacy(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Legacy: Get current CV data for the user."""
    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if cv:
        return _cv_profile_to_dict(cv)
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


# ── Seed owner CV ────────────────────────────────────────────────

@router.post("/seed-owner")
def seed_owner_cv(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Poblar el CV del owner con datos reales. Solo el owner puede ejecutar esto."""
    if getattr(user, "role", "") != "owner":
        raise HTTPException(403, "Solo el propietario puede ejecutar esta accion")

    owner_cv_data = {
        "headline": "Entertainment Technical Director | Senior Production Manager | Broadcast & Show Systems Engineer",
        "summary": "Twenty-plus years leading entertainment technology operations across 8 cruise lines and international live production venues. Built, repaired, and managed show systems at every level — from wiring racks to calling shows for thousands. Track record of solving critical system failures under pressure, designing fleet-wide audio and video infrastructure, and leading technical teams in high-stakes maritime environments.",
        "location": "Antofagasta, Chile",
        "available_worldwide": True,
        "open_to_work": True,
        "experience": [
            {"company": "Disney Cruise Line — Disney Wish", "title": "Senior Technician, Walt Disney Theatre", "start_date": "2025-10", "end_date": "", "location": "At Sea", "description": "Lead the daily operation, setup, and maintenance of the Walt Disney Theatre. Primary technical liaison with Stage Management. 100% show delivery rate. Restored main LED wall, rebuilt Clear-Com IP system, repaired Orchestra Lift automation. Writing 9-chapter WDT Handover Manual."},
            {"company": "Seabourn Cruise Line", "title": "Senior Production Manager (Fleet-Level)", "start_date": "2022-03", "end_date": "2025-10", "location": "Fleet", "description": "Ran entertainment operations across the fleet. Led fleet-wide deployment of 30+ Symetrix Radius NX DSP units with Dante networking. Managed TVRO broadcast operations. Programmed QLab with OSC/timecode. Rebuilt GrandMA2 consoles. Installed LED walls (9mx3m) in 6 ships."},
            {"company": "Cunard Cruise Line", "title": "Production Manager", "start_date": "2022-01", "end_date": "2022-09", "location": "At Sea", "description": "Managed production operations across multiple venues. Built HESS risk assessments. 100% compliance rate."},
            {"company": "RWS — TED — Cirque du Soleil at Sea", "title": "Show Operations Director", "start_date": "2021-02", "end_date": "2022-12", "location": "At Sea", "description": "Directed technical and artistic operations for Cirque du Soleil at Sea. Called every show using QLab. Quality control and safety protocols for complex rigging and aerial productions."},
            {"company": "RWS — TED — Cirque du Soleil at Sea", "title": "Technical Director", "start_date": "2019-06", "end_date": "2020-03", "location": "At Sea", "description": "Managed full cross-functional technical operation: audio, lighting, rigging, and stage automation. Contract interrupted by COVID-19 pandemic."},
            {"company": "Carnival Cruise Line", "title": "Entertainment Technical Manager", "start_date": "2016-06", "end_date": "2019-03", "location": "Fleet", "description": "Managed technical teams across 10+ entertainment venues. FOH/MON audio, lighting, video playback, stage automation. System upgrades and technician training programs."},
            {"company": "MSC Cruises", "title": "Entertainment Technical Manager — Senior Level 4", "start_date": "2012-02", "end_date": "2016-03", "location": "Fleet", "description": "Led technical teams during new-build commissioning for 5 vessels: MSC Meraviglia, Seaside, Seashore, Bellissima, Grandiosa. Dry dock installations and system updates across Fantasy and Lirica Class fleets."},
            {"company": "Costa Cruises", "title": "AV Theatre Sound Technician", "start_date": "2010-05", "end_date": "2013-12", "location": "At Sea", "description": "Operated FOH/MON audio systems for theatre productions and live entertainment."},
            {"company": "Ibero Cruises", "title": "Stage Manager / AV Technician", "start_date": "2005-01", "end_date": "2010-12", "location": "At Sea", "description": "Progressed from AV Technician to Stage Manager over 5 years. Full stage operations oversight and technical team coordination."},
            {"company": "Pullmantur Cruises", "title": "Assistant Stage Manager / Sound & Light Technician", "start_date": "2000-01", "end_date": "2005-12", "location": "At Sea", "description": "First shipboard assignment. Sound, lighting, and DJ services. Advanced to Assistant Stage Manager."},
            {"company": "Freelance", "title": "FOH/MON Engineer & Post-Production Specialist", "start_date": "1998-01", "end_date": "", "location": "Worldwide", "description": "FOH/MON Engineer at major festivals: Festival de Vina del Mar, Lollapalooza Chile, Montreux Jazz Festival. 5,000+ hours live mixing on SSL, Euphonix, DiGiCo. Post-production in DaVinci Resolve Studio and Adobe Premiere Pro."},
        ],
        "education": [
            {"institution": "Zurich University of the Arts, Switzerland", "degree": "PhD in Telecommunications Engineering", "field": "Thesis approved, pending defense", "start_year": "", "end_year": ""},
            {"institution": "Arturo Prat University, Chile", "degree": "MBA in Management & Human Resources", "field": "", "start_year": "", "end_year": ""},
            {"institution": "INACAP, Chile", "degree": "Civil Engineering in Sound & Acoustics", "field": "", "start_year": "", "end_year": ""},
            {"institution": "IACC, Chile", "degree": "Industrial Electronic Engineering", "field": "", "start_year": "", "end_year": ""},
            {"institution": "DUOC University, Chile", "degree": "Theatre Sound Technician & Live Show", "field": "", "start_year": "", "end_year": ""},
            {"institution": "Universidad del Alba, Chile", "degree": "Commercial Engineering / Economics", "field": "In Progress", "start_year": "", "end_year": ""},
        ],
        "certifications": [
            {"name": "Fusion Effects, Fairlight Audio, DaVinci Resolve Color", "issuer": "Blackmagic Design", "date": ""},
            {"name": "Netlinx Programmer Level 1 / Video & Control Designer Level 1", "issuer": "AMX Harman", "date": ""},
            {"name": "Polar Live Satellite Tracking", "issuer": "NetSat (On-Site)", "date": ""},
            {"name": "Dante Certification Levels 1-3", "issuer": "Audinate", "date": ""},
            {"name": "Q-SYS Levels 1 & 2", "issuer": "QSC", "date": ""},
            {"name": "Biamp Tesira Forte", "issuer": "Biamp", "date": ""},
            {"name": "Waves SoundGrid 301", "issuer": "Waves", "date": ""},
            {"name": "DiGiCo SD/S Series", "issuer": "DiGiCo", "date": ""},
            {"name": "Yamaha RIVAGE PM", "issuer": "Yamaha", "date": ""},
            {"name": "STCW, Conflict Resolution, Team Leadership", "issuer": "Maritime & Safety", "date": ""},
        ],
        "skills": [
            {"category": "Audio Engineering", "items": [{"name": "FOH/MON Live Mixing", "proficiency": 95}, {"name": "DiGiCo SD/S Series", "proficiency": 90}, {"name": "Dante Networking", "proficiency": 90}, {"name": "Symetrix DSP", "proficiency": 85}, {"name": "Q-SYS", "proficiency": 80}]},
            {"category": "Video & LED", "items": [{"name": "NovaStar LED Systems", "proficiency": 90}, {"name": "DaVinci Resolve Studio", "proficiency": 85}, {"name": "VFX Compositing (Fusion)", "proficiency": 80}]},
            {"category": "Show Control", "items": [{"name": "QLab (OSC/Timecode)", "proficiency": 90}, {"name": "GrandMA2 Lighting", "proficiency": 85}, {"name": "Stage Automation", "proficiency": 85}, {"name": "Clear-Com IP Comms", "proficiency": 80}]},
            {"category": "Management", "items": [{"name": "Fleet Operations", "proficiency": 90}, {"name": "Team Leadership", "proficiency": 90}, {"name": "Safety & Compliance", "proficiency": 85}, {"name": "Technical Documentation", "proficiency": 85}]},
        ],
        "languages": [
            {"name": "Espanol", "level": "Nativo"},
            {"name": "English", "level": "Avanzado"},
            {"name": "Italiano", "level": "Intermedio"},
            {"name": "Portugues", "level": "Basico"},
        ],
        "differentiators": [
            "8 cruise lines across 25 years: Disney, Seabourn, Cunard, Carnival, MSC, Costa, Ibero, and Pullmantur",
            "New-build commissioning: 5+ MSC vessels from shipyard to operational status",
            "Fleet-wide systems architecture: 30+ DSP units with Dante networking across entire fleet",
            "5,000+ hours live mixing at festival level: Vina del Mar, Lollapalooza, Montreux Jazz",
            "100% show delivery rate at Disney Wish",
            "Technical documentation as leadership: 9-chapter WDT Handover Manual",
        ],
    }

    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv:
        cv = CVProfile(id=gen_id(), user_id=user.id)
        db.add(cv)

    cv.headline = owner_cv_data["headline"]
    cv.summary = owner_cv_data["summary"]
    cv.location = owner_cv_data["location"]
    cv.available_worldwide = owner_cv_data["available_worldwide"]
    cv.open_to_work = owner_cv_data["open_to_work"]
    cv.is_public = True
    cv.visibility = "public"

    cv.experience = json.dumps(owner_cv_data["experience"], ensure_ascii=False)
    cv.education = json.dumps(owner_cv_data["education"], ensure_ascii=False)
    cv.certifications = json.dumps(owner_cv_data["certifications"], ensure_ascii=False)
    cv.skills = json.dumps(owner_cv_data["skills"], ensure_ascii=False)
    cv.languages = json.dumps(owner_cv_data["languages"], ensure_ascii=False)
    cv.differentiators = json.dumps(owner_cv_data["differentiators"], ensure_ascii=False)

    cv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(cv)

    return {
        "ok": True,
        "message": "Perfil CV del propietario poblado exitosamente",
        "profile": _cv_profile_to_dict(cv),
    }


# ── Public routes (catch-all /{username} must be LAST) ─────────

@router.get("/{username}")
async def get_public_cv(
    username: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Obtener el perfil CV por username, respetando visibilidad."""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    cv = db.query(CVProfile).filter(CVProfile.user_id == target_user.id).first()
    if not cv:
        raise HTTPException(404, "Este usuario no tiene un perfil CV publico")

    visibility = getattr(cv, "visibility", "public") or "public"
    is_owner = current_user and current_user.id == target_user.id

    if visibility == "private" and not is_owner:
        raise HTTPException(404, "Este perfil CV no esta disponible")

    if visibility == "friends" and not is_owner:
        if not current_user:
            raise HTTPException(403, "Debes iniciar sesion para ver este perfil")
        if not _are_friends(db, current_user.id, target_user.id):
            raise HTTPException(403, "Este perfil solo es visible para amigos")

    if visibility == "recruiters" and not is_owner:
        if not current_user:
            raise HTTPException(403, "Debes iniciar sesion para ver este perfil")
        if getattr(current_user, "role", "") not in ("recruiter", "admin", "owner"):
            raise HTTPException(403, "Este perfil solo es visible para reclutadores")

    profile = _cv_profile_to_dict(cv)
    # Remove sensitive fields for public view
    profile.pop("phone", None)
    profile["completed_courses"] = _get_completed_courses(db, target_user.id)

    return {
        "profile": profile,
        "user": {
            "username": target_user.username,
            "first_name": target_user.first_name,
            "last_name": target_user.last_name,
            "avatar": target_user.avatar,
            "university": target_user.university,
            "career": target_user.career,
        },
    }


@router.get("/{username}/download")
async def download_public_cv(
    username: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Descargar el CV de un usuario como PDF, respetando visibilidad."""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    cv = db.query(CVProfile).filter(CVProfile.user_id == target_user.id).first()
    if not cv:
        raise HTTPException(404, "Este usuario no tiene un perfil CV")

    visibility = getattr(cv, "visibility", "public") or "public"
    is_owner = current_user and current_user.id == target_user.id

    if visibility == "private" and not is_owner:
        raise HTTPException(404, "Este perfil CV no esta disponible")
    if visibility == "friends" and not is_owner:
        if not current_user or not _are_friends(db, current_user.id, target_user.id):
            raise HTTPException(403, "Este perfil solo es visible para amigos")
    if visibility == "recruiters" and not is_owner:
        if not current_user or getattr(current_user, "role", "") not in ("recruiter", "admin", "owner"):
            raise HTTPException(403, "Este perfil solo es visible para reclutadores")

    cv_data = _cv_profile_to_dict(cv)
    cv_data["completed_courses"] = _get_completed_courses(db, target_user.id)
    user_data = {
        "first_name": target_user.first_name,
        "last_name": target_user.last_name,
    }

    pdf_bytes = generate_cv_pdf(cv_data, user_data)
    if not pdf_bytes:
        raise HTTPException(500, "Error al generar el PDF")

    filename = f"CV_{target_user.first_name}_{target_user.last_name}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
