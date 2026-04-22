# Reporte Capa 2 — code-reviewer (adversarial ciego) — Sub-bloque 2c Athena

**Fecha**: 2026-04-18
**Agente**: code-reviewer (sin Write tool; reporte persistido por Tori main loop)
**Branch**: `bloque-2c-athena` (3 commits: `18aeae2`, `a0484e1`, `96a1760`)
**Método**: Read + Grep sobre 25 archivos + 20 greps adversariales

---

## Resumen ejecutivo

**Score: 86/100 — Banda WARN por 2 BLOQUEANTES que rompen integración producción.**

| Categoría | Obtenido |
|---|---|
| Seguridad (25) | 25 — XSS mitigado, sin credenciales, auth en todos endpoints, tier gate correcto |
| Manejo errores (15) | 13 — `except Exception: pass` silenciando errores en ping |
| Null safety (15) | 12 — `res.result` undefined (BLOQUEANTE-1) |
| Convenciones (10) | 8 — `datetime.utcnow()` deprecado, typo `athenFetch` |
| Accesibilidad (10) | 8 — `aria-valuemin` ausente, focus trap incompleto |
| Tests (15) | 10 — BLOQUEANTES no detectados por tests |
| Impacto código existente (10) | 10 — frozen intactos, konni_engine NO tocado |
| **TOTAL** | **86/100 WARN** |

---

## Bloqueantes

### BLOQUEANTE-1 — Backend `response` vs frontend `result` (contrato roto)

**Impacto**: Athena NO muestra respuesta en producción. Los mocks frontend usan `{ result }` coincidiendo con tipos TS pero backend real retorna `{ response }` → `res.result === undefined`.

- `backend/workspaces_athena.py:395` → `result = {"response": response_text, "action": action}`
- `shared/workspaces-types.ts:155-167` → `interface AthenaAnalyzeResponse { result: string }`
- `src/components/workspaces/Athena/AthenaAnalyze.tsx:34` → lee `res.result`
- `src/components/workspaces/Athena/AthenaChat.tsx:81` → lee `res.result`

**Fix mínimo**: normalizar a `result` en backend (más barato que tocar N lugares frontend + tipos).

### BLOQUEANTE-2 — `athenaSuggest` envía `staging_text: ''` sin selección

**Impacto**: feature sugerencias inutilizable por defecto (sin selección activa, estado inicial).

- `src/components/workspaces/Athena/AthenaSuggestions.tsx:42` → `athenaSuggest(docId, selection ?? '', selection ?? undefined)` → envía string vacío
- Backend línea 361 rechaza con 400: `if not staging_text: raise HTTPException(400, ...)`
- UI muestra error genérico "No se pudo crear la sugerencia" sin instruir al usuario

**Fix mínimo**: validar selección antes de llamar + mensaje guía al usuario.

---

## Recomendados (iter-2, no bloquean)

1. **Tipo `AthenaSuggestion.id`**: declarar `number`, no `string`. Backend usa autoincrement Integer.
2. **`datetime.utcnow()` deprecado** — 5 líneas en workspaces_athena.py (297, 405, 414, 426, 524). Reemplazar por `datetime.now(tz=UTC)` (el módulo ya importa `UTC`).
3. **`except Exception: pass`** línea 677 → log debug.
4. **Validar `status` contra enum** en `get_athena_suggestions`.
5. **Límite longitud `message`** en chat (paridad con `MAX_CHAT_CONTENT_CHARS` del 2b).

## Notas

- Focus trap incompleto en `UpgradeModal`
- `aria-valuemin="0"` ausente en progressbar AthenaPanel:229
- Rate limit multi-worker documentado (aceptable, tier_gate es la defensa real)
- Typo `athenFetch` → `athenaFetch` (función privada, no afecta API)

## Confirmaciones positivas

1. XSS mitigado en `renderAthenaMarkdown` (escape HTML antes de regex)
2. 8 endpoints con `_check_access` obligatorio
3. Tier gate `athena_workspace` configurado end-to-end
4. `konni_engine.py` NO modificado (import read-only)
5. Archivos frozen intactos
6. Sin `console.log`/`print`/`eval`/credenciales
7. `AthenaApplyBridge` usa `useLexicalComposerContext + useImperativeHandle` correctamente

---

## Secciones CLAUDE.md

### 1. Lo que se me pidió
Revisión adversarial ciega del sub-bloque 2c. Score + banda.

### 2. Lo que efectivamente hice
Read sobre 25 archivos (~4000 líneas). 20 greps adversariales. Detección cruzada backend↔frontend que reveló 2 bloqueantes.

### 3. Lo que no hice y por qué
- No ejecuté tests (es del truth-auditor)
- No calculé contraste WCAG (variables CSS en tema global fuera del diff)
- No revisé `konni_engine.py` (solo confirmé que no fue modificado)
- No pude escribir el reporte directamente por falta de Write tool

### 4. Incertidumbres
- BLOQUEANTE-1: probabilidad <5% de que haya middleware intermedio que renombre `response→result`. Truth-auditor puede confirmar con curl real.
- BLOQUEANTE-2: posible que el plan dijera "sin selección usa doc completo" pero la implementación rechaza. Diseño e implementación inconsistentes independientemente.

### 5. Quality Score
Ver tabla ejecutiva al inicio. **WARN 86/100 con 2 bloqueantes funcionales que deben corregirse antes del cierre.**
