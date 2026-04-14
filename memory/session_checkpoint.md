# Session Checkpoint — 2026-04-13

## Estado del Deploy
- **Branch**: main — último commit `ab7af49`
- **Frontend**: Vercel — building `dpl_FkjeYNbGaExxuS1vij22MZKm5yru`
- **Backend**: Render (studyhub-api-bpco.onrender.com) — auto-deploy con push

## Features completadas esta sesión (Mi Universidad módulo)
1. ✅ Activity links en calendario (click evento → navegar asignatura + abrir sala)
2. ✅ Platform detection buttons Zoom/BBB/Teams/Meet con colores branded
3. ✅ Submission status badges ✓/✗ (Moodle mod_assign + Canvas submissions API)
4. ✅ Chat tab en asignatura (Claude + docs si vinculada / Konni si no)
5. ✅ Quizzes tab en asignatura — sistema completo replicado de ProjectView:
   - Diagnóstico inicial 15 Qs + quizzes programados Q1-Q4 adaptativos
   - Quiz Libre (dificultad + N preguntas + detalle respuestas + historial)
   - Sin conniku_project_id → prompt para vincular
   - Reset al cambiar asignatura (useEffect selectedCourse?.id)
6. ✅ moderation.py migrado Gemini → Claude Vision (ANTHROPIC_API_KEY)
7. ✅ fix(UserProfile) TS error isMaxUser prop eliminado

## AI Distribution en producción
- **Claude Haiku** (`claude-haiku-4-5-20251001`): chat Konni, chat asignatura, moderación imágenes
- **GPT-4o-mini** (vía `gemini_engine.py` — nombre histórico, usa OpenAI): quiz generation, flashcards, summaries, study guides, diagnostics
- **Gemini**: ELIMINADO del proyecto

## DB additions (CalendarEvent model)
- `item_url` VARCHAR(1000) — URL directa actividad LMS
- `lms_course_id` VARCHAR(16) — ID curso Conniku para navegación
- `submission_status` VARCHAR(30) — submitted | draft | nosubmission | unknown

## Pendiente inmediato
- Tab Clases + grabación Zoom (③) — previamente discutido, pendiente de implementar
- iOS deploy — stand-by hasta Apple Developer secrets
- Play Store: 12+ testers → 14 días → producción
