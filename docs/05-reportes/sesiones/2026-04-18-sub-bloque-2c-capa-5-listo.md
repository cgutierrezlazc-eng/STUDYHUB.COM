# Snapshot — Sub-bloque 2c Workspaces Athena · Capa 5 completada

**Fecha**: 2026-04-18
**Estado**: Capas 1-5 cerradas con fixes post-revisión. Pendiente legal-docs-keeper antes de Capa 4.
**Branch**: `bloque-2c-athena` (commits a incrementar tras este snapshot)

---

## Capas completadas

| Capa | Agente | Resultado |
|---|---|---|
| 0 | web-architect | Plan `2c-athena.md` aprobado (1484 líneas, 14 decisiones) |
| 1 | backend-builder | 28/28 tests + 8 endpoints + rate-limit |
| 1 | frontend-builder | 131/131 tests + 9 componentes + bridge Lexical |
| 2 | code-reviewer | WARN 86/100 → 2 BLOQUEANTES funcionales **fixeados post-revisión** |
| 3 | truth-auditor | PASS 89/100 — 6 observaciones menores |
| 5 | gap-finder | 3 CRÍTICOS + 4 MODERADOS + 4 RECOMENDADOS — **CRÍTICOS fixeados post-revisión** |

## Qué implementa el 2c

### Backend
- `backend/workspaces_athena.py` — 686 líneas, 8 endpoints (POST /athena con action={analyze|chat|suggest}, GET/DELETE chats, GET/PATCH/DELETE suggestions, GET usage, GET ping)
- `backend/tier_gate.py` +1 entrada `_UPGRADE_MESSAGES`
- `shared/tier-limits.json` +2 entries `athena_workspace` (free 3/daily, pro -1)
- `backend/server.py` +2 líneas import + include_router
- 28 tests con monkeypatch sobre `call_konni`
- Prompt Athena literal recuperado del commit `d0c0e49`
- Rate-limit técnico 20/min in-memory (limitación multi-worker documentada)
- `call_konni` importado sin modificar `konni_engine.py`

### Frontend
- `AthenaPanel.tsx` + tabs Análisis/Chat/Sugerencias + usage-meter + rate-banner
- `AthenaChat.tsx` optimistic update + quota handling + limpiar conversación
- `AthenaAnalyze.tsx` loading skeleton + renderAthenaMarkdown
- `AthenaSuggestions.tsx` con **guard de selección** (post-fix BLOQUEANTE-2)
- `SuggestionCard.tsx` diff apply/modify/reject/delete
- `UpgradeModal.tsx` overlay con backdrop + ESC + focus inicial
- `AthenaApplyBridge.tsx` plugin Lexical invisible con `useLexicalComposerContext + useImperativeHandle`
- `renderAthenaMarkdown.ts` escape HTML + regex casero (XSS mitigado)
- `AthenaPanel.module.css` estilos
- 47 tests frontend

### Shared
- `shared/workspaces-types.ts` +6 tipos Athena (AthenaChatMessage, AthenaSuggestion, AthenaUsageInfo, etc.)

## Fixes aplicados post-revisión

| Severidad | Descripción | Fuente |
|---|---|---|
| BLOQ-1 code-reviewer | Backend `{"response": ...}` → `{"result": ...}` para coincidir con tipos TS | commit pendiente |
| BLOQ-2 code-reviewer | `athenaSuggest` valida selección frontend antes de llamar | commit pendiente |
| CRÍTICO-1 gap-finder | `.env.example` `GEMINI_API_KEY` → `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` | commit pendiente |
| CRÍTICO-3 gap-finder | Este snapshot creado | actual |
| Refactor MAX | `STRIPE_PRICE_MAX_*` eliminado de `.env.example` | commit pendiente |

## Pendientes pre-Capa 4

**BLOQUEANTE-LEGAL** — CRÍTICO-2 gap-finder:
- Ejecutar `legal-docs-keeper` con scope 2c
- Actualizar `PrivacyPolicy.tsx:384` — ampliar rol de Anthropic (procesamiento texto de documentos colaborativos, chat privado, sugerencias)
- Agregar cláusula "Funcionalidades Athena" en `TermsOfService.tsx` (+ modal)
- OK humano explícito de Cristian antes de Capa 7 merge

**MODERADOS diferidos al 2d o iter-2**:
- Test `AthenaAnalyze.tsx` y `AthenaSuggestions.tsx` dedicados
- Tier gate orden: `_check_access` antes de `tier_gate` (vector enumeración)
- Test PATCH `status=modified`
- `onSuggestionCreated` callback para recargar lista

**RECOMENDADOS diferidos al 2d**:
- Logging estructurado en workspaces_athena.py
- Timeout frontend (AbortController 30s) + backend (timeout=25 en Anthropic SDK)
- Validación longitud `AthenaRequest.data`
- PATCH sugerencia con guardia `status==pending`

## Verificación final post-fixes

```
pytest backend/tests/test_workspaces_athena.py  → 28/28 verdes
pytest backend/tests/test_workspaces_*.py       → 108/108 verdes
npx vitest run src/__tests__/workspaces/        → 131/131 verdes
npx tsc --noEmit                                → 0 errors
npm run lint                                    → 0 errors, 444 warnings preexistentes
npm run build                                   → ✓ built in ~10-40s
```

## Decisión

**Capa 5 completada con todos los CRÍTICOS fixeados.** Siguiente paso: legal-docs-keeper (gate obligatorio componente legal) antes de arrancar Capa 4 deploy preview.

Al cerrar el Bloque 2 completo (post-2d), evaluar agregar `backend/workspaces_athena.py` a FROZEN.md.
