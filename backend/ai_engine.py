"""
AI Engine: handles RAG with ChromaDB + Claude API for chat, study guides, quizzes, flashcards.
"""
import os
import json
from typing import Optional

import chromadb
from anthropic import Anthropic
from pathlib import Path

DATA_DIR = Path.home() / ".studyhub"

# Use API key from environment or config
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Try loading from config file if not in env
CONFIG_FILE = DATA_DIR / "config.json"
if not API_KEY and CONFIG_FILE.exists():
    try:
        config = json.loads(CONFIG_FILE.read_text())
        API_KEY = config.get("anthropic_api_key", "")
    except:
        pass


class AIEngine:
    def __init__(self):
        chroma_path = str(DATA_DIR / "chromadb")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.client = Anthropic(api_key=API_KEY) if API_KEY else None

    def init_project(self, project_id: str):
        try:
            self.chroma_client.get_or_create_collection(name=f"project_{project_id}")
        except Exception:
            pass

    def delete_project(self, project_id: str):
        try:
            self.chroma_client.delete_collection(name=f"project_{project_id}")
        except Exception:
            pass

    def add_document(self, project_id: str, doc_id: str, filename: str, text: str):
        collection = self.chroma_client.get_or_create_collection(name=f"project_{project_id}")

        # Split text into chunks for better retrieval
        chunks = self._chunk_text(text, chunk_size=1000, overlap=200)

        for i, chunk in enumerate(chunks):
            collection.add(
                documents=[chunk],
                metadatas=[{"filename": filename, "chunk_index": i}],
                ids=[f"{doc_id}_chunk_{i}"],
            )

    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        return chunks

    def _get_context(self, project_id: str, query: str, n_results: int = 5) -> str:
        try:
            collection = self.chroma_client.get_collection(name=f"project_{project_id}")
            results = collection.query(query_texts=[query], n_results=n_results)

            if results and results['documents']:
                context_parts = []
                for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
                    context_parts.append(f"[Fuente: {meta['filename']}]\n{doc}")
                return "\n\n---\n\n".join(context_parts)
        except Exception:
            pass
        return ""

    def _get_all_text(self, project_id: str) -> str:
        try:
            collection = self.chroma_client.get_collection(name=f"project_{project_id}")
            results = collection.get()
            if results and results['documents']:
                return "\n\n".join(results['documents'][:50])  # Limit to avoid token overflow
        except Exception:
            pass
        return ""

    def _call_claude(self, system: str, user_message: str, model: str = "claude-sonnet-4-20250514") -> str:
        if not self.client:
            return "⚠️ API key no configurada. Configura tu ANTHROPIC_API_KEY en ~/.studyhub/config.json"

        response = self.client.messages.create(
            model=model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text

    def chat(self, project_id: str, message: str, language: str = "es", gender: str = "unspecified", language_skill: str = "intermediate") -> str:
        context = self._get_context(project_id, message)

        lang_instructions = {
            "es": "Responde en español",
            "en": "Respond in English",
            "pt": "Responda em português",
            "fr": "Réponds en français",
        }
        lang_inst = lang_instructions.get(language, "Responde en español")

        gender_tone = ""
        if gender == "male":
            gender_tone = "Trátalo de forma cercana y motivadora, usando lenguaje masculino cuando corresponda."
        elif gender == "female":
            gender_tone = "Trátala de forma cercana y motivadora, usando lenguaje femenino cuando corresponda."
        else:
            gender_tone = "Usa un trato cercano y motivador con lenguaje neutro."

        # Humanizer: adapt communication style based on language skill level
        skill_style = ""
        if language_skill == "beginner":
            skill_style = """ESTILO DE COMUNICACIÓN - PRINCIPIANTE:
- Usa vocabulario simple y cotidiano, evita jerga técnica innecesaria.
- Oraciones cortas y directas. Máximo 2-3 ideas por párrafo.
- Incluye analogías y comparaciones con la vida real para cada concepto.
- Después de explicar algo, da un ejemplo práctico inmediatamente.
- Usa emojis ocasionalmente para hacer la explicación más amigable (📌, 💡, ✅).
- Si hay un concepto difícil, desglósalo en pasos numerados muy simples.
- Pregunta al final si el concepto quedó claro.
- Tono: como un amigo paciente que explica con calma."""
        elif language_skill == "advanced":
            skill_style = """ESTILO DE COMUNICACIÓN - AVANZADO:
- Usa terminología técnica y académica precisa.
- Explicaciones concisas y directas, sin rodeos.
- Incluye referencias a conceptos relacionados y conexiones interdisciplinarias.
- Puedes asumir conocimiento previo sólido de los fundamentos.
- Enfócate en los matices, excepciones y casos especiales.
- Sugiere lecturas complementarias o temas avanzados relacionados.
- Usa notación formal cuando sea apropiado.
- Tono: como un colega académico que discute el tema a profundidad."""
        else:  # intermediate (default)
            skill_style = """ESTILO DE COMUNICACIÓN - INTERMEDIO:
- Balance entre terminología técnica y explicaciones claras.
- Explica conceptos nuevos pero no los más básicos.
- Incluye ejemplos prácticos cuando un concepto lo requiera.
- Estructura clara con puntos clave resaltados.
- Puedes usar algunas referencias teóricas sin desglosar cada una.
- Tono: como un tutor universitario accesible y profesional."""

        system = f"""Eres un tutor de estudio inteligente llamado StudyHub.
Tu rol es ayudar al estudiante a entender el material de su asignatura.
{lang_inst}, de forma clara, didáctica y con ejemplos cuando sea posible.
{gender_tone}

{skill_style}

Si el material incluye fórmulas matemáticas, usa notación LaTeX entre $ para inline y $$ para bloques.
Si no tienes información suficiente en el contexto, dilo honestamente.
Siempre cita de qué documento sacas la información."""

        user_prompt = f"""Contexto de los documentos del curso:
{context}

Pregunta del estudiante: {message}"""

        return self._call_claude(system, user_prompt)

    def generate_study_guide(self, project_id: str) -> str:
        all_text = self._get_all_text(project_id)

        if not all_text:
            return "<p>No hay documentos procesados en este proyecto.</p>"

        system = """Eres un experto creador de material de estudio. Genera guías de estudio
completas, bien estructuradas y fáciles de entender en español.
Usa HTML para el formato (h2, h3, p, ul, li, strong, em, blockquote, code).
Para fórmulas matemáticas, usa notación LaTeX envuelta en <span class="katex-inline">...</span> para inline.
Incluye:
1. Resumen general del tema
2. Conceptos clave con definiciones claras
3. Fórmulas importantes (si aplica)
4. Ejemplos prácticos
5. Puntos clave para recordar
6. Preguntas de autoevaluación al final"""

        user_prompt = f"""Genera una guía de estudio completa basada en este material:

{all_text[:15000]}

Genera la guía en HTML bien formateado."""

        return self._call_claude(system, user_prompt)

    def generate_quiz(self, project_id: str, num_questions: int = 10) -> dict:
        all_text = self._get_all_text(project_id)

        system = """Genera un quiz de estudio basado en el material proporcionado.
Responde SOLO con JSON válido con esta estructura:
{
  "questions": [
    {
      "question": "texto de la pregunta",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correctAnswer": 0,
      "explanation": "explicación de por qué es correcta"
    }
  ]
}"""

        user_prompt = f"""Material del curso:
{all_text[:12000]}

Genera {num_questions} preguntas de opción múltiple en español."""

        result = self._call_claude(system, user_prompt, model="claude-haiku-4-5-20251001")
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            start = result.find('{')
            end = result.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(result[start:end])
            return {"questions": [], "error": "Could not parse quiz"}

    def generate_flashcards(self, project_id: str) -> list[dict]:
        all_text = self._get_all_text(project_id)

        system = """Genera flashcards de estudio basadas en el material.
Responde SOLO con JSON válido: una lista de objetos con "front" (pregunta/concepto) y "back" (respuesta/definición).
Ejemplo: [{"front": "¿Qué es X?", "back": "X es..."}]
Genera entre 15-20 flashcards en español."""

        user_prompt = f"""Material:
{all_text[:12000]}"""

        result = self._call_claude(system, user_prompt, model="claude-haiku-4-5-20251001")
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            start = result.find('[')
            end = result.rfind(']') + 1
            if start >= 0 and end > start:
                return json.loads(result[start:end])
            return []
