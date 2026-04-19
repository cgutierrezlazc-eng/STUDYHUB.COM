# Reporte Capa 5 — gap-finder — Sub-bloque 2c Athena IA

**Fecha**: 2026-04-18
**Branch**: `bloque-2c-athena`

**Veredicto**: **BLOQUEADO para Capa 4** — 3 CRÍTICOS + 2 bloqueantes code-reviewer.

---

## Gaps por severidad

| # | Severidad | Título |
|---|---|---|
| 1 | CRÍTICO | `ANTHROPIC_API_KEY` NO declarada en `.env.example` |
| 2 | CRÍTICO | legal-docs-keeper ausente (Anthropic subprocesador + T&C Athena) |
| 3 | CRÍTICO | Snapshot sesión 2c ausente |
| 4 | MODERADO | Sin test `AthenaAnalyze` ni `AthenaSuggestions` |
| 5 | MODERADO | Cupo tier_gate se consume en 403 no-membresía |
| 6 | MODERADO | Test PATCH `status=modified` ausente |
| 7 | MODERADO | Sugerencias no recargan tras crear (UX rota) |
| 8 | RECOMENDADO | Logging insuficiente workspaces_athena.py |
| 9 | RECOMENDADO | Sin timeout en frontend/backend llamadas Claude |
| 10 | RECOMENDADO | Sin validación longitud `AthenaRequest` |
| 11 | RECOMENDADO | PATCH sugerencia sin guardia estado previo |
| 12 | INFORMATIVO | Decisión frozen workspaces_athena.py no documentada |
| 13 | INFORMATIVO | `GEMINI_API_KEY` fantasma en .env.example |

## Detalles CRÍTICOS

### GAP-1 — `ANTHROPIC_API_KEY` sin declarar
`.env.example` declara `GEMINI_API_KEY` legacy (0 uso en código) pero NO `ANTHROPIC_API_KEY` que se usa en 6 archivos. Sin ella en producción, `GET /athena/ping` retorna `claude_available: false` y panel Athena muestra error a todos.
**Fix**: Reemplazar GEMINI → ANTHROPIC en `.env.example`.

### GAP-2 — legal-docs-keeper ausente
- `PrivacyPolicy.tsx:384` menciona Anthropic como "resúmenes, asistente de estudio" — NO menciona workspaces colaborativos, chat privado Athena, ni sugerencias académicas.
- `TermsOfService.tsx` sin cláusula "Funcionalidades Athena".
- Sin borradores en `docs/legal/drafts/`.
Plan §8 exige legal-docs-keeper + OK humano antes de Capa 4.
**Fix**: Ejecutar legal-docs-keeper con scope 2c.

### GAP-3 — Sin snapshot de sesión
`docs/sessions/` no tiene snapshot del 2c. Política contexto exige snapshot en cierre de hito.
**Fix**: Crear `docs/sessions/2026-04-18-HHMM-snapshot-sub-bloque-2c-capa-5.md`.

## Detalles MODERADOS

- **GAP-4**: `AthenaAnalyze.tsx` (90 líneas, 4 ramas) + `AthenaSuggestions.tsx` (121 líneas, handleCreate quota+error) sin test unitario dedicado.
- **GAP-5**: `tier_gate` corre en Depends ANTES de `_check_access`. Usuario Free con cupo restante + doc ajeno → consume cupo + recibe 403. Vector UX difícil pero API público.
- **GAP-6**: 28 tests cubren `applied` y `rejected` pero no `modified` (líneas 526-527 de handler). `new_content=None` con status=modified no tiene test.
- **GAP-7**: `athenaSuggest` exitoso no refresca lista. Usuario no ve sugerencia creada sin reabrir panel.

## Detalles RECOMENDADOS

- **GAP-8**: `grep -c "logger\." workspaces_athena.py` = 1. 686 líneas con 8 endpoints sin log estructurado.
- **GAP-9**: Sin `AbortController` frontend ni `timeout=25` backend. Un WiFi caído en analyze cuelga el worker.
- **GAP-10**: `AthenaRequest.data: dict[str, Any]` sin max_length — body 10MB procesado.
- **GAP-11**: PATCH `status=applied` sobre suggestion ya applied actualiza `resolved_at` sin error.

## Secciones CLAUDE.md

### 1. Lo que se me pidió
Auditoría estructural gap-finder del 2c.

### 2. Lo que efectivamente hice
15+ comandos Bash con output literal documentado. Auditoría de 12 áreas (capa mecánica, tests, env, docs, observabilidad, UX edges, legal, idempotencia).

### 3. Lo que no hice y por qué
- No verifiqué CI remoto (sin PR aún).
- No escribí el reporte directamente (Bash denegado; main loop lo persistió).
- No audité backups Supabase (fuera scope dirigido a 2c).

### 4. Incertidumbres
GAP-5 podría rebajarse a RECOMENDADO si truth-auditor confirma que la UI hace imposible el vector de enumeración de doc_ids ajenos.
