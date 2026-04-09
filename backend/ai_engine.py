"""
AI Engine: handles RAG with ChromaDB + Claude API for chat, study guides, quizzes, flashcards.
"""
import os
import json
from typing import Optional

import chromadb
from anthropic import Anthropic
from pathlib import Path

DATA_DIR = Path.home() / ".conniku"

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
            return "⚠️ API key no configurada. Configura tu ANTHROPIC_API_KEY en ~/.conniku/config.json"

        response = self.client.messages.create(
            model=model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text

    def _call_claude_chat(self, system: str, messages: list, model: str = "claude-haiku-4-5-20251001") -> str:
        """Call Claude with full conversation history."""
        if not self.client:
            return "⚠️ API key no configurada. Configura tu ANTHROPIC_API_KEY en ~/.conniku/config.json"

        response = self.client.messages.create(
            model=model,
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        return response.content[0].text

    def chat(self, project_id: str, message: str, language: str = "es", gender: str = "unspecified", language_skill: str = "intermediate", socratic: bool = False) -> str:
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

        system = f"""Eres un tutor de estudio inteligente llamado Conniku.
Tu rol es ayudar al estudiante a entender el material de su asignatura.
{lang_inst}, de forma clara, didáctica y con ejemplos cuando sea posible.
{gender_tone}

{skill_style}

Si el material incluye fórmulas matemáticas, usa notación LaTeX entre $ para inline y $$ para bloques.
Si no tienes información suficiente en el contexto, dilo honestamente.
Siempre cita de qué documento sacas la información."""

        if socratic:
            system += """

MODO SOCRÁTICO ACTIVADO:
- NUNCA des la respuesta directamente
- Haz preguntas que guíen al estudiante a descubrir la respuesta
- Usa el método socrático: pregunta → reflexión → descubrimiento
- Si el estudiante está cerca de la respuesta, anímalo
- Si está perdido, da una pista sutil, no la respuesta
- Empieza con "¿Qué crees que...?" o "¿Has considerado...?"
- Máximo 2-3 preguntas guía por respuesta"""

        # Humanized communication style
        system += """

ESTILO DE COMUNICACION HUMANIZADO:
- Comunicate como un tutor amigable y cercano, no como una maquina
- Usa expresiones naturales y calidas ("Excelente pregunta!", "Vamos a ver esto juntos")
- Adapta tu tono al del estudiante: si es informal, se informal; si es formal, se profesional
- Incluye palabras de aliento cuando el tema es dificil
- Si el estudiante parece frustrado, se empatico primero, luego explica
- Nunca uses lenguaje robotico como "Como modelo de lenguaje..." o "Procesando tu solicitud..."
- Eres Conniku, un companero de estudio inteligente, no un asistente generico"""

        user_prompt = f"""Contexto de los documentos del curso:
{context}

Pregunta del estudiante: {message}"""

        return self._call_claude(system, user_prompt)

    def generate_study_guide(self, project_id: str, language: str = "es") -> str:
        all_text = self._get_all_text(project_id)

        if not all_text:
            return "<p>No hay documentos procesados en este proyecto.</p>"

        system = """Eres un experto creador de material de estudio. Genera guías de estudio
completas, bien estructuradas y fáciles de entender.
Usa HTML para el formato (h2, h3, p, ul, li, strong, em, blockquote, code).
Para fórmulas matemáticas, usa notación LaTeX envuelta en <span class="katex-inline">...</span> para inline.
Incluye:
1. Resumen general del tema
2. Conceptos clave con definiciones claras
3. Fórmulas importantes (si aplica)
4. Ejemplos prácticos
5. Puntos clave para recordar
6. Preguntas de autoevaluación al final"""

        lang_instruction = {
            "es": "Genera la guía en español.",
            "en": "Generate the guide in English.",
            "pt": "Gere o guia em português.",
            "fr": "Générez le guide en français.",
            "de": "Erstellen Sie den Leitfaden auf Deutsch.",
            "it": "Genera la guida in italiano.",
            "zh": "用中文生成学习指南。",
            "ja": "日本語で学習ガイドを生成してください。",
            "ko": "한국어로 학습 가이드를 생성하세요.",
        }.get(language, f"Generate the guide in {language}.")

        user_prompt = f"""Genera una guía de estudio completa basada en este material:

{all_text[:15000]}

Genera la guía en HTML bien formateado. {lang_instruction}"""

        return self._call_claude(system, user_prompt)

    def generate_quiz(self, project_id: str, num_questions: int = 10, language: str = "es", difficulty: str = "medium", weak_topics: list[str] = None) -> dict:
        all_text = self._get_all_text(project_id)

        difficulty_instruction = {
            "easy": "Genera preguntas FÁCILES de comprensión básica y definiciones.",
            "medium": "Genera preguntas de dificultad MEDIA que requieran comprensión y aplicación.",
            "hard": "Genera preguntas DIFÍCILES de análisis, síntesis y pensamiento crítico.",
        }.get(difficulty, "Genera preguntas de dificultad media.")

        weak_instruction = ""
        if weak_topics:
            weak_instruction = f"\n\nENFÓCATE ESPECIALMENTE en estos temas donde el estudiante tiene debilidades: {', '.join(weak_topics)}"

        system = f"""Genera un quiz de estudio basado en el material proporcionado.
{difficulty_instruction}{weak_instruction}
Responde SOLO con JSON válido con esta estructura:
{{
  "questions": [
    {{
      "question": "texto de la pregunta",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correctAnswer": 0,
      "explanation": "explicación de por qué es correcta",
      "topic": "tema específico de esta pregunta",
      "difficulty": "{difficulty}"
    }}
  ]
}}"""

        quiz_lang = {
            "es": f"Genera {num_questions} preguntas de opción múltiple en español.",
            "en": f"Generate {num_questions} multiple choice questions in English.",
            "pt": f"Gere {num_questions} perguntas de múltipla escolha em português.",
            "fr": f"Générez {num_questions} questions à choix multiples en français.",
            "de": f"Erstellen Sie {num_questions} Multiple-Choice-Fragen auf Deutsch.",
            "it": f"Genera {num_questions} domande a scelta multipla in italiano.",
            "zh": f"用中文生成{num_questions}道选择题。",
            "ja": f"日本語で{num_questions}問の多肢選択問題を生成してください。",
            "ko": f"한국어로 {num_questions}개의 객관식 문제를 생성하세요.",
        }.get(language, f"Generate {num_questions} multiple choice questions in {language}.")

        user_prompt = f"""Material del curso:
{all_text[:12000]}

{quiz_lang}"""

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

    def generate_flashcards(self, project_id: str, language: str = "es") -> list[dict]:
        all_text = self._get_all_text(project_id)

        lang_name = {"es": "español", "en": "English", "pt": "português", "fr": "français"}.get(language, "español")

        system = f"""Genera flashcards de estudio basadas en el material.
Responde SOLO con JSON válido: una lista de objetos con "front" (pregunta/concepto) y "back" (respuesta/definición).
Ejemplo: [{{"front": "¿Qué es X?", "back": "X es..."}}]
Genera entre 15-20 flashcards en {lang_name}."""

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
