"""
AI Engine: handles RAG with ChromaDB + OpenAI GPT-4o Mini for chat, study guides, quizzes, flashcards,
summaries, document analysis, concept maps, and visual explanations.
"""
import os
import json
from typing import Optional
from pathlib import Path

import chromadb
from openai import OpenAI

from database import DATA_DIR

# OpenAI client — used for all AI generation (GPT-4o Mini)
_OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
gpt_client = OpenAI(api_key=_OPENAI_KEY) if _OPENAI_KEY else None
GPT_MODEL = "gpt-4o-mini"

# Language instruction mappings shared across methods
LANG_INSTRUCTIONS = {
    "es": "Responde en español",
    "en": "Respond in English",
    "pt": "Responda em português",
    "fr": "Réponds en français",
    "de": "Antworte auf Deutsch",
    "it": "Rispondi in italiano",
    "zh": "请用中文回答",
    "ja": "日本語で回答してください",
    "ko": "한국어로 답변해 주세요",
}

LANG_NAMES = {
    "es": "español",
    "en": "English",
    "pt": "português",
    "fr": "français",
    "de": "Deutsch",
    "it": "italiano",
    "zh": "中文",
    "ja": "日本語",
    "ko": "한국어",
}


class AIEngine:
    def __init__(self):
        chroma_path = str(DATA_DIR / "chromadb")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)

        # Primary model for chat and rich generation
        self.api_available = bool(_OPENAI_KEY)

    # ------------------------------------------------------------------ #
    #  ChromaDB / RAG helpers (identical to original)
    # ------------------------------------------------------------------ #

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

    def remove_document(self, project_id: str, doc_id: str):
        """Remove all ChromaDB chunks for a document (prefix-matched by doc_id)."""
        try:
            collection = self.chroma_client.get_collection(name=f"project_{project_id}")
            # Chunks are stored with IDs like "{doc_id}_chunk_0", "{doc_id}_chunk_1", etc.
            existing = collection.get()
            ids_to_delete = [cid for cid in (existing.get("ids") or []) if cid.startswith(f"{doc_id}_")]
            if ids_to_delete:
                collection.delete(ids=ids_to_delete)
        except Exception:
            pass

    def add_document(self, project_id: str, doc_id: str, filename: str, text: str):
        collection = self.chroma_client.get_or_create_collection(name=f"project_{project_id}")

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
                for doc, meta in zip(results['documents'][0], results['metadatas'][0], strict=True):
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

    # ------------------------------------------------------------------ #
    #  OpenAI GPT-4o Mini API helpers
    # ------------------------------------------------------------------ #

    def _call_gemini(self, system: str, user_message: str, model: str = None) -> str:
        """Text generation via GPT-4o Mini (replaces Gemini)."""
        if not gpt_client:
            return "⚠️ OPENAI_API_KEY no configurada en el servidor."
        try:
            resp = gpt_client.chat.completions.create(
                model=GPT_MODEL,
                max_tokens=4096,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_message},
                ],
            )
            return resp.choices[0].message.content
        except Exception as e:
            return f"⚠️ Error al comunicarse con el asistente: {str(e)}"

    def _call_gemini_chat(self, system: str, messages: list, model: str = None) -> str:
        """Chat with history via GPT-4o Mini (replaces Gemini)."""
        if not gpt_client:
            return "Lo siento, el asistente no está disponible en este momento."
        try:
            oai_messages = [{"role": "system", "content": system}] + [
                {"role": m["role"], "content": m["content"]} for m in messages
                if m.get("role") in ("user", "assistant") and m.get("content")
            ]
            resp = gpt_client.chat.completions.create(
                model=GPT_MODEL,
                max_tokens=2048,
                messages=oai_messages,
            )
            return resp.choices[0].message.content
        except Exception as e:
            return f"Lo siento, tuve un problema al responder. (Error: {str(e)[:80]})"

    def _call_gemini_json(self, system: str, user_message: str, model: str = None) -> str:
        """JSON generation via GPT-4o Mini (replaces Gemini)."""
        if not gpt_client:
            return "{}"
        try:
            resp = gpt_client.chat.completions.create(
                model=GPT_MODEL,
                max_tokens=8192,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system + "\nResponde ÚNICAMENTE con JSON válido, sin texto adicional."},
                    {"role": "user", "content": user_message},
                ],
            )
            return resp.choices[0].message.content
        except Exception as e:
            return f"{{\"error\": \"{str(e)[:80]}\"}}"

    # ------------------------------------------------------------------ #
    #  Shared prompt helpers
    # ------------------------------------------------------------------ #

    def _get_lang_instruction(self, language: str) -> str:
        return LANG_INSTRUCTIONS.get(language, f"Respond in {language}.")

    def _get_lang_name(self, language: str) -> str:
        return LANG_NAMES.get(language, language)

    def _build_skill_style(self, language_skill: str) -> str:
        if language_skill == "beginner":
            return """ESTILO DE COMUNICACIÓN - PRINCIPIANTE:
- Usa vocabulario simple y cotidiano, evita jerga técnica innecesaria.
- Oraciones cortas y directas. Máximo 2-3 ideas por párrafo.
- Incluye analogías y comparaciones con la vida real para cada concepto.
- Después de explicar algo, da un ejemplo práctico inmediatamente.
- Usa emojis ocasionalmente para hacer la explicación más amigable (📌, 💡, ✅).
- Si hay un concepto difícil, desglósalo en pasos numerados muy simples.
- Pregunta al final si el concepto quedó claro.
- Tono: como un amigo paciente que explica con calma."""
        elif language_skill == "advanced":
            return """ESTILO DE COMUNICACIÓN - AVANZADO:
- Usa terminología técnica y académica precisa.
- Explicaciones concisas y directas, sin rodeos.
- Incluye referencias a conceptos relacionados y conexiones interdisciplinarias.
- Puedes asumir conocimiento previo sólido de los fundamentos.
- Enfócate en los matices, excepciones y casos especiales.
- Sugiere lecturas complementarias o temas avanzados relacionados.
- Usa notación formal cuando sea apropiado.
- Tono: como un colega académico que discute el tema a profundidad."""
        else:  # intermediate (default)
            return """ESTILO DE COMUNICACIÓN - INTERMEDIO:
- Balance entre terminología técnica y explicaciones claras.
- Explica conceptos nuevos pero no los más básicos.
- Incluye ejemplos prácticos cuando un concepto lo requiera.
- Estructura clara con puntos clave resaltados.
- Puedes usar algunas referencias teóricas sin desglosar cada una.
- Tono: como un tutor universitario accesible y profesional."""

    # ------------------------------------------------------------------ #
    #  Chat
    # ------------------------------------------------------------------ #

    def chat(self, project_id: str, message: str, language: str = "es",
             gender: str = "unspecified", language_skill: str = "intermediate",
             socratic: bool = False) -> str:
        context = self._get_context(project_id, message)
        lang_inst = self._get_lang_instruction(language)

        gender_tone = ""
        if gender == "male":
            gender_tone = "Trátalo de forma cercana y motivadora, usando lenguaje masculino cuando corresponda."
        elif gender == "female":
            gender_tone = "Trátala de forma cercana y motivadora, usando lenguaje femenino cuando corresponda."
        else:
            gender_tone = "Usa un trato cercano y motivador con lenguaje neutro."

        skill_style = self._build_skill_style(language_skill)

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

        system += """

FORMATO — OBLIGATORIO:
- NUNCA uses markdown: sin **, sin ##, sin *, sin _subrayado_, sin listas con guión al inicio
- Escribe en párrafos naturales como lo haría un profesor en una conversación
- Si necesitas enumerar puntos, usa números seguidos de punto (1. 2. 3.) integrados en el texto
- Para fórmulas usa LaTeX entre $ (inline) o $$ (bloque), nunca código de programación para matemáticas
- Las respuestas deben verse limpias y legibles directamente, sin símbolos decorativos

TONO HUMANIZADO — OBLIGATORIO:
PROHIBIDO usar estas frases de IA:
- "¡Claro que sí!", "¡Por supuesto!", "¡Absolutamente!", "Claro", "Entendido"
- "¡Excelente pregunta!", "¡Buena pregunta!", "Qué buena pregunta"
- "¡Perfecto!", "¡Genial!", "¡Increíble!", "¡Fantástico!"
- "Es un placer ayudarte", "Con gusto te ayudo", "Estoy aquí para ayudarte"
- "Voy a explicarte...", "Te explicaré...", "Procedo a..."
- "Como modelo de lenguaje...", "Como IA...", "Como asistente..."
- No repitas la pregunta del estudiante antes de responder

CÓMO SONAR HUMANO:
- Responde directo al punto, sin introducciones vacías
- Usa expresiones naturales cuando corresponda: "Mira...", "El tema es...", "Básicamente...", "Ahí está la clave..."
- Si el tema es difícil: "Este concepto es complicado, vamos por partes" — sin drama, sin exceso
- Si no encuentras la info en los documentos: "En los documentos no aparece eso, pero..." — directo
- Adapta el nivel: si el estudiante es técnico, sé preciso; si es informal, sé natural
- Eres Conniku, un compañero de estudio — no una herramienta

NIVEL DE DETALLE — MATEMÁTICAS Y EJERCICIOS:
- Si el estudiante pide que le ENSEÑES o EXPLIQUES cómo resolver algo: da el procedimiento completo paso a paso, con cada operación justificada, hasta llegar al resultado final.
- Si el estudiante pide SOLO el resultado (ej: "dame el resultado", "¿cuánto da?", "¿es X la respuesta?", "solo dime si está bien"): da únicamente el resultado de forma directa y concisa, sin procedimiento. No expliques si no te lo piden.
- Si el estudiante quiere VERIFICAR su respuesta: confirma si es correcto o incorrecto en una línea. Si está incorrecto, da solo una pista breve, NO el procedimiento completo a menos que lo pida explícitamente.
- Respeta siempre lo que el estudiante necesita: algunos aprenden haciendo, otros solo necesitan confirmar. Ambos son válidos."""

        user_prompt = f"""Contexto de los documentos del curso:
{context}

Pregunta del estudiante: {message}"""

        return self._call_gemini(system, user_prompt)

    def build_chat_prompt(self, project_id: str, message: str, language: str = "es",
                          gender: str = "unspecified", language_skill: str = "intermediate",
                          socratic: bool = False) -> tuple:
        """Return (system, user_prompt) without calling any AI API.
        Used by server.py to route the chat to a different AI provider."""
        context = self._get_context(project_id, message)
        lang_inst = self._get_lang_instruction(language)

        if gender == "male":
            gender_tone = "Trátalo de forma cercana y motivadora, usando lenguaje masculino cuando corresponda."
        elif gender == "female":
            gender_tone = "Trátala de forma cercana y motivadora, usando lenguaje femenino cuando corresponda."
        else:
            gender_tone = "Usa un trato cercano y motivador con lenguaje neutro."

        skill_style = self._build_skill_style(language_skill)

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

        system += """

FORMATO — OBLIGATORIO:
- NUNCA uses markdown: sin **, sin ##, sin *, sin _subrayado_, sin listas con guión al inicio
- Escribe en párrafos naturales como lo haría un profesor en una conversación
- Si necesitas enumerar puntos, usa números seguidos de punto (1. 2. 3.) integrados en el texto
- Para fórmulas usa LaTeX entre $ (inline) o $$ (bloque), nunca código de programación para matemáticas
- Las respuestas deben verse limpias y legibles directamente, sin símbolos decorativos

TONO HUMANIZADO — OBLIGATORIO:
PROHIBIDO usar estas frases de IA:
- "¡Claro que sí!", "¡Por supuesto!", "¡Absolutamente!", "Claro", "Entendido"
- "¡Excelente pregunta!", "¡Buena pregunta!", "Qué buena pregunta"
- "¡Perfecto!", "¡Genial!", "¡Increíble!", "¡Fantástico!"
- "Es un placer ayudarte", "Con gusto te ayudo", "Estoy aquí para ayudarte"
- "Voy a explicarte...", "Te explicaré...", "Procedo a..."
- "Como modelo de lenguaje...", "Como IA...", "Como asistente..."
- No repitas la pregunta del estudiante antes de responder

CÓMO SONAR HUMANO:
- Responde directo al punto, sin introducciones vacías
- Usa expresiones naturales cuando corresponda: "Mira...", "El tema es...", "Básicamente...", "Ahí está la clave..."
- Si el tema es difícil: "Este concepto es complicado, vamos por partes" — sin drama, sin exceso
- Si no encuentras la info en los documentos: "En los documentos no aparece eso, pero..." — directo
- Adapta el nivel: si el estudiante es técnico, sé preciso; si es informal, sé natural
- Eres Conniku, un compañero de estudio — no una herramienta

NIVEL DE DETALLE — MATEMÁTICAS Y EJERCICIOS:
- Si el estudiante pide que le ENSEÑES o EXPLIQUES cómo resolver algo: da el procedimiento completo paso a paso, con cada operación justificada, hasta llegar al resultado final.
- Si el estudiante pide SOLO el resultado (ej: "dame el resultado", "¿cuánto da?", "¿es X la respuesta?", "solo dime si está bien"): da únicamente el resultado de forma directa y concisa, sin procedimiento. No expliques si no te lo piden.
- Si el estudiante quiere VERIFICAR su respuesta: confirma si es correcto o incorrecto en una línea. Si está incorrecto, da solo una pista breve, NO el procedimiento completo a menos que lo pida explícitamente.
- Respeta siempre lo que el estudiante necesita: algunos aprenden haciendo, otros solo necesitan confirmar. Ambos son válidos."""

        user_prompt = f"""Contexto de los documentos del curso:
{context}

Pregunta del estudiante: {message}"""

        return system, user_prompt

    # ------------------------------------------------------------------ #
    #  Study Guide
    # ------------------------------------------------------------------ #

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

        return self._call_gemini(system, user_prompt)

    # ------------------------------------------------------------------ #
    #  Quiz
    # ------------------------------------------------------------------ #

    def generate_quiz(self, project_id: str, num_questions: int = 10,
                      language: str = "es", difficulty: str = "medium",
                      weak_topics: list[str] = None) -> dict:
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

        result = self._call_gemini_json(system, user_prompt)
        try:
            return json.loads(result)
        except (json.JSONDecodeError, TypeError):
            # Try to extract JSON from response
            try:
                start = result.find('{')
                end = result.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(result[start:end])
            except Exception:
                pass
            return {"questions": [], "error": "Could not parse quiz"}

    # ------------------------------------------------------------------ #
    #  Flashcards
    # ------------------------------------------------------------------ #

    def generate_flashcards(self, project_id: str, language: str = "es") -> list[dict]:
        all_text = self._get_all_text(project_id)

        lang_name = self._get_lang_name(language)

        system = f"""Genera flashcards de estudio basadas en el material.
Responde SOLO con JSON válido: una lista de objetos con "front" (pregunta/concepto) y "back" (respuesta/definición).
Ejemplo: [{{"front": "¿Qué es X?", "back": "X es..."}}]
Genera entre 15-20 flashcards en {lang_name}."""

        user_prompt = f"""Material:
{all_text[:12000]}"""

        result = self._call_gemini_json(system, user_prompt)
        try:
            parsed = json.loads(result)
            # Handle both list and dict-wrapped list
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict) and "flashcards" in parsed:
                return parsed["flashcards"]
            return parsed
        except (json.JSONDecodeError, TypeError):
            try:
                start = result.find('[')
                end = result.rfind(']') + 1
                if start >= 0 and end > start:
                    return json.loads(result[start:end])
            except Exception:
                pass
            return []

    # ------------------------------------------------------------------ #
    #  NEW: Generate Summary
    # ------------------------------------------------------------------ #

    def generate_summary(self, project_id: str, language: str = "es",
                         detail_level: str = "comprehensive") -> dict:
        """Generate a rich structured summary with sections, key points, diagrams, and visual aids.

        Args:
            project_id: The project to summarize.
            language: Output language code.
            detail_level: 'brief', 'standard', or 'comprehensive'.

        Returns:
            dict with title, sections, keyTerms, formulas, studyTips, htmlContent.
        """
        all_text = self._get_all_text(project_id)

        if not all_text:
            return {
                "title": "Sin documentos",
                "sections": [],
                "keyTerms": [],
                "formulas": [],
                "studyTips": [],
                "htmlContent": "<p>No hay documentos procesados en este proyecto.</p>",
            }

        lang_inst = self._get_lang_instruction(language)

        detail_instructions = {
            "brief": "Genera un resumen BREVE con los puntos más importantes solamente. Máximo 3-4 secciones cortas.",
            "standard": "Genera un resumen ESTÁNDAR con las ideas principales y algunos detalles. Entre 4-6 secciones.",
            "comprehensive": "Genera un resumen COMPLETO y detallado cubriendo todos los temas del material. Entre 6-10 secciones con análisis profundo.",
        }
        detail_inst = detail_instructions.get(detail_level, detail_instructions["comprehensive"])

        system = f"""Eres un experto creador de material educativo llamado Conniku.
{lang_inst}.
{detail_inst}

Genera un resumen estructurado del material proporcionado.
Responde SOLO con JSON válido con esta estructura exacta:
{{
  "title": "Título del resumen",
  "sections": [
    {{
      "heading": "Título de la sección",
      "content": "Contenido en HTML (usa <p>, <ul>, <li>, <strong>, <em>, <code>)",
      "keyPoints": ["punto clave 1", "punto clave 2"],
      "suggestedDiagram": {{
        "type": "flowchart|mindmap|table|timeline|comparison",
        "description": "Descripción del diagrama sugerido",
        "data": {{}}
      }}
    }}
  ],
  "keyTerms": [
    {{"term": "término", "definition": "definición clara"}}
  ],
  "formulas": [
    {{"name": "nombre", "latex": "fórmula en LaTeX", "explanation": "explicación"}}
  ],
  "studyTips": ["consejo de estudio 1", "consejo 2"],
  "htmlContent": "Resumen completo en HTML bien formateado con h2, h3, p, ul, li, strong, em. Incluye fórmulas LaTeX en <span class='katex-inline'>...</span>"
}}

Para el campo suggestedDiagram.data, usa estructuras apropiadas:
- flowchart: {{"steps": ["paso1", "paso2"]}}
- mindmap: {{"center": "tema", "branches": ["subtema1", "subtema2"]}}
- table: {{"headers": ["col1", "col2"], "rows": [["val1", "val2"]]}}
- timeline: {{"events": [{{"date": "...", "event": "..."}}]}}
- comparison: {{"items": ["A", "B"], "criteria": [{{"name": "...", "A": "...", "B": "..."}}]}}

Si el material contiene fórmulas matemáticas, inclúyelas en el campo "formulas".
Asegúrate de que el HTML en htmlContent sea completo y pueda renderizarse directamente."""

        user_prompt = f"""Material del curso para resumir:

{all_text[:15000]}"""

        result = self._call_gemini_json(system, user_prompt)
        try:
            return json.loads(result)
        except (json.JSONDecodeError, TypeError):
            try:
                start = result.find('{')
                end = result.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(result[start:end])
            except Exception:
                pass
            return {
                "title": "Error al generar resumen",
                "sections": [],
                "keyTerms": [],
                "formulas": [],
                "studyTips": [],
                "htmlContent": f"<p>No se pudo generar el resumen estructurado. Respuesta raw:</p><pre>{result[:2000] if result else 'Sin respuesta'}</pre>",
            }

    # ------------------------------------------------------------------ #
    #  NEW: Analyze Document
    # ------------------------------------------------------------------ #

    def analyze_document(self, project_id: str, doc_id: str, question: str,
                         language: str = "es") -> str:
        """Deep analysis of a specific document answering a user question.

        Args:
            project_id: The project containing the document.
            doc_id: The document ID to analyze.
            question: The question to answer about this document.
            language: Output language code.

        Returns:
            str with the analysis in HTML/Markdown format.
        """
        lang_inst = self._get_lang_instruction(language)

        # Retrieve all chunks belonging to this specific document
        doc_text = ""
        try:
            collection = self.chroma_client.get_collection(name=f"project_{project_id}")
            results = collection.get(where={"filename": {"$ne": ""}})  # get all

            # Filter chunks that belong to the requested doc_id
            if results and results['documents']:
                doc_chunks = []
                for doc_content, doc_meta, doc_cid in zip(
                    results['documents'], results['metadatas'], results['ids'],
                    strict=True,
                ):
                    if doc_cid.startswith(f"{doc_id}_chunk_"):
                        doc_chunks.append((doc_meta.get('chunk_index', 0), doc_content, doc_meta.get('filename', '')))

                doc_chunks.sort(key=lambda x: x[0])
                if doc_chunks:
                    doc_text = "\n".join([chunk[1] for chunk in doc_chunks])
        except Exception:
            pass

        if not doc_text:
            # Fallback: use RAG context from the question
            doc_text = self._get_context(project_id, question, n_results=10)

        if not doc_text:
            return "<p>No se encontró el documento solicitado en el proyecto.</p>"

        system = f"""Eres un analista educativo experto llamado Conniku.
{lang_inst}.
Tu tarea es analizar en profundidad un documento académico y responder la pregunta del estudiante.

Proporciona un análisis detallado que incluya:
1. Respuesta directa a la pregunta
2. Evidencia del documento que respalda tu respuesta
3. Contexto adicional relevante
4. Conexiones con otros conceptos del material
5. Implicaciones o aplicaciones prácticas

Usa formato HTML para estructurar tu respuesta (h3, p, ul, li, strong, em, blockquote).
Para fórmulas matemáticas, usa LaTeX entre $ para inline y $$ para bloques.
Cita las partes específicas del documento cuando sea posible.
Ayuda al estudiante a APRENDER, no solo a obtener la respuesta."""

        user_prompt = f"""Documento a analizar:

{doc_text[:15000]}

Pregunta del estudiante: {question}"""

        return self._call_gemini(system, user_prompt)

    # ------------------------------------------------------------------ #
    #  NEW: Generate Concept Map
    # ------------------------------------------------------------------ #

    def generate_concept_map(self, project_id: str, language: str = "es") -> dict:
        """Generate a concept/mind map structure from documents.

        Args:
            project_id: The project to map.
            language: Output language code.

        Returns:
            dict with 'nodes' and 'edges' for graph rendering.
        """
        all_text = self._get_all_text(project_id)

        if not all_text:
            return {"nodes": [], "edges": []}

        lang_inst = self._get_lang_instruction(language)

        system = f"""Eres un experto en organización del conocimiento y mapas conceptuales llamado Conniku.
{lang_inst}.

Analiza el material educativo proporcionado y genera un mapa conceptual estructurado.
Responde SOLO con JSON válido con esta estructura exacta:
{{
  "nodes": [
    {{
      "id": "node_1",
      "label": "Concepto principal",
      "type": "main",
      "color": "#4A90D9"
    }},
    {{
      "id": "node_2",
      "label": "Subconcepto",
      "type": "sub",
      "color": "#7BB3E0"
    }},
    {{
      "id": "node_3",
      "label": "Detalle",
      "type": "detail",
      "color": "#A8D0F0"
    }}
  ],
  "edges": [
    {{
      "from": "node_1",
      "to": "node_2",
      "label": "incluye"
    }}
  ]
}}

Reglas:
- Identifica entre 8-20 conceptos clave del material.
- Usa type "main" para los 2-4 temas principales (color: #4A90D9).
- Usa type "sub" para subtemas importantes (color: #7BB3E0).
- Usa type "detail" para detalles o ejemplos específicos (color: #A8D0F0).
- Las relaciones (edges) deben tener etiquetas descriptivas como "incluye", "causa", "ejemplo de", "se relaciona con", "depende de", etc.
- Cada nodo debe tener un ID único (node_1, node_2, ...).
- Los labels deben ser concisos (máximo 4-5 palabras).
- Asegúrate de que el grafo sea conexo (todos los nodos alcanzables)."""

        user_prompt = f"""Material educativo para mapear:

{all_text[:15000]}"""

        result = self._call_gemini_json(system, user_prompt)
        try:
            parsed = json.loads(result)
            # Validate structure
            if "nodes" in parsed and "edges" in parsed:
                return parsed
            return {"nodes": [], "edges": [], "error": "Estructura inválida"}
        except (json.JSONDecodeError, TypeError):
            try:
                start = result.find('{')
                end = result.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(result[start:end])
            except Exception:
                pass
            return {"nodes": [], "edges": [], "error": "Could not parse concept map"}

    # ------------------------------------------------------------------ #
    #  NEW: Explain with Visuals
    # ------------------------------------------------------------------ #

    def explain_with_visuals(self, project_id: str, topic: str,
                             language: str = "es") -> dict:
        """Explain a topic with suggested visual aids, diagrams, and charts.

        Args:
            project_id: The project for context.
            topic: The specific topic to explain.
            language: Output language code.

        Returns:
            dict with explanation, visual suggestions, and structured content.
        """
        context = self._get_context(project_id, topic, n_results=8)
        lang_inst = self._get_lang_instruction(language)

        system = f"""Eres un experto educativo visual llamado Conniku, especializado en explicar conceptos
usando ayudas visuales y diagramas.
{lang_inst}.

Explica el tema solicitado usando el contexto del material del curso.
Responde SOLO con JSON válido con esta estructura exacta:
{{
  "topic": "Nombre del tema",
  "explanation": "Explicación completa en HTML (h3, p, ul, li, strong, em, blockquote). Usa LaTeX entre $ para fórmulas.",
  "visuals": [
    {{
      "type": "diagram|chart|table|infographic|flowchart|timeline|comparison",
      "title": "Título del visual",
      "description": "Descripción detallada de lo que debe mostrar",
      "data": {{}},
      "purpose": "Por qué este visual ayuda a entender el concepto"
    }}
  ],
  "analogies": [
    {{
      "concept": "El concepto abstracto",
      "analogy": "La analogía visual o cotidiana",
      "explanation": "Cómo se conectan"
    }}
  ],
  "keyTakeaways": ["punto clave 1", "punto clave 2"],
  "relatedTopics": ["tema relacionado 1", "tema relacionado 2"]
}}

Para visuals.data, usa estructuras apropiadas según el tipo:
- diagram: {{"elements": ["elemento1", "elemento2"], "connections": [{{"from": "...", "to": "...", "label": "..."}}]}}
- chart: {{"type": "bar|line|pie", "labels": ["..."], "values": [...], "series_name": "..."}}
- table: {{"headers": ["col1", "col2"], "rows": [["val1", "val2"]]}}
- flowchart: {{"steps": [{{"id": "1", "text": "...", "next": ["2"]}}]}}
- timeline: {{"events": [{{"order": 1, "title": "...", "description": "..."}}]}}
- comparison: {{"items": ["A", "B"], "criteria": [{{"name": "...", "A": "...", "B": "..."}}]}}
- infographic: {{"sections": [{{"title": "...", "icon": "emoji", "stat": "...", "description": "..."}}]}}

Incluye al menos 2-3 visuales diferentes.
Incluye al menos 1-2 analogías del mundo real.
Ayuda al estudiante a APRENDER y visualizar, no solo a memorizar."""

        user_prompt = f"""Contexto del material del curso:
{context}

Tema a explicar con visuales: {topic}"""

        result = self._call_gemini_json(system, user_prompt)
        try:
            parsed = json.loads(result)
            if "topic" in parsed and "explanation" in parsed:
                return parsed
            return {"topic": topic, "explanation": "<p>No se pudo generar la explicación.</p>",
                    "visuals": [], "analogies": [], "keyTakeaways": [], "relatedTopics": []}
        except (json.JSONDecodeError, TypeError):
            try:
                start = result.find('{')
                end = result.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(result[start:end])
            except Exception:
                pass
            return {
                "topic": topic,
                "explanation": f"<p>Error al generar explicación visual.</p><pre>{result[:1000] if result else 'Sin respuesta'}</pre>",
                "visuals": [],
                "analogies": [],
                "keyTakeaways": [],
                "relatedTopics": [],
            }
