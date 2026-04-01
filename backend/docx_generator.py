"""
Generate .docx Word documents from chat content.
Converts markdown-like text to formatted Word documents.
"""
import re
import tempfile
from pathlib import Path

try:
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


def markdown_to_docx(content: str, title: str = "Conniku Document") -> str:
    """Convert markdown-like text to a .docx file. Returns file path."""
    if not HAS_DOCX:
        raise RuntimeError("python-docx not installed")

    doc = Document()

    # Title
    title_p = doc.add_heading(title, level=0)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Add subtitle
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run("Generado con Conniku")
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(128, 128, 128)

    doc.add_paragraph("")  # spacer

    lines = content.split("\n")
    in_code_block = False
    code_lines = []

    for line in lines:
        stripped = line.strip()

        # Code blocks
        if stripped.startswith("```"):
            if in_code_block:
                code_text = "\n".join(code_lines)
                p = doc.add_paragraph()
                run = p.add_run(code_text)
                run.font.name = "Courier New"
                run.font.size = Pt(9)
                p.style = "No Spacing"
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Headings
        if stripped.startswith("### "):
            doc.add_heading(stripped[4:], level=3)
        elif stripped.startswith("## "):
            doc.add_heading(stripped[3:], level=2)
        elif stripped.startswith("# "):
            doc.add_heading(stripped[2:], level=1)
        # Bullet points
        elif stripped.startswith("- ") or stripped.startswith("* "):
            doc.add_paragraph(stripped[2:], style="List Bullet")
        # Numbered lists
        elif re.match(r"^\d+\.\s", stripped):
            text = re.sub(r"^\d+\.\s", "", stripped)
            doc.add_paragraph(text, style="List Number")
        # Empty lines
        elif not stripped:
            doc.add_paragraph("")
        # Regular text with bold/italic
        else:
            p = doc.add_paragraph()
            _add_formatted_runs(p, stripped)

    # Save to temp file
    tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False, dir=str(Path.home() / ".conniku"))
    doc.save(tmp.name)
    return tmp.name


def _add_formatted_runs(paragraph, text: str):
    """Parse bold (**text**) and italic (*text*) markdown into Word runs."""
    parts = re.split(r"(\*\*.*?\*\*|\*.*?\*)", text)
    for part in parts:
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith("*") and part.endswith("*"):
            run = paragraph.add_run(part[1:-1])
            run.italic = True
        else:
            paragraph.add_run(part)
