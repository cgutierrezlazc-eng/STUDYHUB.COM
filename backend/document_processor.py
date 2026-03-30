"""
Document processor: extracts text from PDF, DOCX, XLSX, PPTX, TXT, CSV files.
"""
from pathlib import Path


class DocumentProcessor:
    def extract_text(self, file_path: str) -> str:
        path = Path(file_path)
        ext = path.suffix.lower()

        extractors = {
            '.pdf': self._extract_pdf,
            '.doc': self._extract_docx,
            '.docx': self._extract_docx,
            '.xls': self._extract_xlsx,
            '.xlsx': self._extract_xlsx,
            '.ppt': self._extract_pptx,
            '.pptx': self._extract_pptx,
            '.txt': self._extract_txt,
            '.csv': self._extract_txt,
            '.md': self._extract_txt,
        }

        extractor = extractors.get(ext, self._extract_txt)
        try:
            return extractor(file_path)
        except Exception as e:
            return f"[Error extracting text from {path.name}: {e}]"

    def _extract_pdf(self, path: str) -> str:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

                # Also extract tables
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            text_parts.append(" | ".join(str(cell or "") for cell in row))
        return "\n\n".join(text_parts)

    def _extract_docx(self, path: str) -> str:
        from docx import Document
        doc = Document(path)
        parts = []
        for para in doc.paragraphs:
            if para.text.strip():
                parts.append(para.text)

        # Extract tables
        for table in doc.tables:
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                if any(cells):
                    parts.append(" | ".join(cells))
        return "\n\n".join(parts)

    def _extract_xlsx(self, path: str) -> str:
        from openpyxl import load_workbook
        wb = load_workbook(path, data_only=True)
        parts = []
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            parts.append(f"=== Hoja: {sheet_name} ===")
            for row in ws.iter_rows(values_only=True):
                cells = [str(cell) if cell is not None else "" for cell in row]
                if any(cells):
                    parts.append(" | ".join(cells))
        return "\n".join(parts)

    def _extract_pptx(self, path: str) -> str:
        from pptx import Presentation
        prs = Presentation(path)
        parts = []
        for i, slide in enumerate(prs.slides, 1):
            parts.append(f"--- Diapositiva {i} ---")
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for para in shape.text_frame.paragraphs:
                        if para.text.strip():
                            parts.append(para.text)
                if shape.has_table:
                    for row in shape.table.rows:
                        cells = [cell.text.strip() for cell in row.cells]
                        parts.append(" | ".join(cells))
        return "\n\n".join(parts)

    def _extract_txt(self, path: str) -> str:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            return f.read()
