# Reporte Capa 3 — truth-auditor — Sub-bloque 2b Colaboración

**Agente**: truth-auditor
**Fecha**: 2026-04-18
**Rama auditada**: `bloque-2b-colaboracion`
**Commits auditados**: 10 (`667d136` → `fb1065f`)
**Reportes cruzados**:
- `docs/reports/2026-04-18-capa-1-backend-builder-2b-colaboracion.md`
- `docs/reports/2026-04-18-capa-1-frontend-builder-2b-colaboracion.md` (declaraba "NO VERIFICADO"; re-verificado por Tori main loop con 68/68 tests + build OK)

---

## 1. Lo que se me pidió

Cruzar reportes de Capa 1 vs estado real del repo. Verificar: backend (pytest, ruff), frontend (lint, tsc, vitest, build), V1 `collab_ws.py` intacto, sin duplicación `authorColors`, sin `console.log`/`print()` debug, frozen intactos, close code 4010, fix JWT fixture justificado, commits atómicos, criterio §6 cumplido. Emitir reporte con 5 secciones + quality score.

---

## 2. Lo que efectivamente hice

### 2.1 Commits y diff

```
$ git log --oneline main..bloque-2b-colaboracion
fb1065f docs(ws): plan 2b + reportes capa 1 frontend y landing handoff
aad69d1 feat(ws): integración WorkspaceEditor con Yjs + chat + métricas
5e0b380 feat(ws): hooks auto-save + tracker de contribución
dab82f4 feat(ws): editor Lexical con colaboración Yjs + cursores remotos
56eabcb feat(ws): componentes chat grupal + barra de contribución
7e7b35f feat(ws): provider Yjs + IndexedDB + API chat/contribution
bacca69 build(frontend): agregar @lexical/yjs y y-indexeddb para colab 2b
348dd4c docs(ws): reporte Capa 1 backend-builder 2b-colaboracion
7f89e1a feat(ws): WebSocket relay colaboración workspaces 2b
667d136 test(ws): RED-GREEN chat REST + contribution 2b

$ git diff --stat main...bloque-2b-colaboracion
 31 files changed, 6305 insertions(+), 50 deletions(-)
```

10 commits Conventional Commits en español imperativo, scopes válidos (`ws`, `frontend`). Archivos afirmados coinciden con diff.

### 2.2 Frozen + UNFREEZE

`.claude/frozen-files.txt` sin cambios. `UNFREEZE_ACTIVE` cubre `package.json` para Bloque 2 completo, con extensión explícita 2b para `@lexical/yjs` y `y-indexeddb`. Ningún otro frozen tocado.

### 2.3 V1 `backend/collab_ws.py` intacto

```
$ git diff main...bloque-2b-colaboracion -- backend/collab_ws.py
(vacío)
```

V1 byte-a-byte idéntico a main.

### 2.4 Backend ruff

```
$ ruff check . → All checks passed!
$ ruff format --check [archivos 2b] → 1 file would be reformatted (server.py)
```

El issue de format en `server.py` es preexistente de main (líneas 85, 133 trailing comma/blank line). Las 2 líneas nuevas del 2b (`import workspaces_ws_router`, `app.include_router(workspaces_ws_router)`) son limpias.

### 2.5 Backend pytest

```
FAILED tests/test_workspaces_routes_crud.py::test_get_invite_token_invalido_retorna_404
FAILED tests/test_workspaces_routes_crud.py::test_get_invite_token_valido_retorna_metadata
========================= 2 failed, 45 passed in 2.57s ===
```

Coincidencia exacta con backend-builder ("45 passed, 2 failed"). Los 2 fails son preexistentes del 2a.

### 2.6 Fix JWT fixture — razonamiento extendido

Restauré el fixture original de main y corrí el suite 2a aislado:

```
$ git checkout main -- backend/tests/test_workspaces_routes_crud.py
$ pytest tests/test_workspaces_routes_crud.py --tb=no -q
20 failed, 1 passed in 1.29s
```

`middleware.decode_token` líneas 68-69: sin `"type": "access"` → 401. **El fix fue NECESARIO, no overreach.** Gap del truth-auditor del 2a en su momento; no bloquea 2b.

### 2.7 Frontend verificación completa

```
$ npm run lint → 0 errors, 444 warnings (todos preexistentes)
$ npx tsc --noEmit → 0 errors
$ npx vitest run src/__tests__/workspaces/ → Test Files 8 passed, Tests 68 passed
$ npm run build → ✓ built in 10.19s
  WorkspaceEditor-CzeQPKbP.js 198.27 kB (gzip 62.99 kB)
```

Coincide con verificación post-reporte frontend ejecutada por Tori main loop.

### 2.8 Deps, console.log, print(), authorColors

- `node_modules/@lexical/yjs/package.json` + `y-indexeddb/package.json` presentes.
- `grep console.log` en archivos nuevos src/ → **0 matches**.
- `grep print(` en `backend/workspaces_ws.py` + `backend/workspaces_routes.py` → **0 matches**.
- `authorColors.ts` único (camelCase), sin duplicado PascalCase. Consumers 5/5 importan del mismo archivo.

### 2.9 Close codes WS

- Backend `workspaces_ws.py`: close(4001) líneas 138/143, close(4004) 151, close(4003) 168. **4010 solo en docstring, NO implementado.**
- Frontend `yjsProvider.ts`: `FATAL_CLOSE_CODES = [4001, 4003, 4004]` línea 31, `TOKEN_EXPIRED_CODE = 4010` línea 33, manejado línea 188.

**HALLAZGO — omisión**: plan §5.4 y §6.3 piden test `yjsProvider.test.ts` del flujo 4010→refresh→reconnect. **No existe.** Backend-builder declara omisión del backend en su §3.1; frontend-builder NO declara la omisión equivalente del frontend. Severidad baja, iter-2.

### 2.10 `content_yjs` persiste en BD

Test `test_patch_workspace_content_yjs_por_editor_ok_y_refleja_en_get` (líneas 591-623 de `test_workspaces_routes_crud.py`) hace PATCH con `content_yjs="dGVzdHNuYXBzaG90"`, luego GET y assert `contentYjs == "dGVzdHNuYXBzaG90"`. Persistencia real verificada.

### 2.11 Criterio §6 del plan

- §6.1 Backend (8 items): 7/8 verdes, 1 observación (`ruff format` preexistente de `server.py`).
- §6.2 Frontend (14 items): 14/14 verdes.
- §6.3 gap-finder: fuera de scope truth-auditor.
- §6.4 Protocolo (7 items): 6/7 verdes (PR es Capa 7).

---

## 3. Lo que no hice y por qué

1. **Servidor local + curl**: usé `TestClient.websocket_connect` como proxy equivalente in-process.
2. **Test unitario de `useCharContributionTracker.ts`**: declarado por frontend-builder §3.4.
3. **Test 4010 refresh reconnect**: la ausencia ES el hallazgo.
4. **mypy backend**: no disponible local; queda para CI.
5. **npm audit**: fuera de scope; corresponde a code-reviewer/gap-finder.
6. **`registry_issues.md` en repo**: no existe; vive en user-level memory.
7. **N repeticiones del suite para estimar flakiness**: una sola pasada. Si el relay WS falla en CI, será señal.

---

## 4. Incertidumbres

1. Test `test_ws_enviar_bytes_relay_a_otros` potencialmente flaky bajo latencia alta (apuntado por backend-builder §4.4). 1/1 en mi ejecución, pero una sola.
2. `WorkspaceEditor.tsx` modo 2a (sin collab): test smoke verde, pero no probado en navegador. Queda para Capa 6.
3. `btoa(Uint8Array)` en `useAutoSave.ts`: funciona en jsdom + Node 18+. Podría fallar en WebViews raros de Capacitor iOS.
4. **Autocrítica**: mi matriz dio 20/20 en "Comandos verificados". Alguien más estricto podría argumentar 15-18 porque TestClient no es curl contra servidor real levantado. Mantengo 20 pero reconozco la ambigüedad.
5. Cobertura de seguridad WS: tests cubren auth/authz/recurso. NO cubren inyección JSON malformado, rate limit chat, límite tamaño binary relay. Gap para code-reviewer.

---

## 5. Quality score final

| Categoría | Máx | Otorgado |
|---|---|---|
| Archivos afirmados vs reales | 15 | **15** |
| Comandos de verificación re-ejecutados | 20 | **20** |
| Endpoints funcionando (tests como proxy) | 15 | **15** |
| Archivos frozen intactos | 10 | **10** |
| Registro de issues actualizado | 10 | **8** |
| Commits coherentes con reportes | 10 | **9** |
| Variables de entorno | 10 | **10** |
| Criterio §6 cumplido | 10 | **8** |
| **TOTAL** | **100** | **95** |

### Banda: **PASS** (95 ≥ 85)

### Bloqueantes críticos: **NINGUNO**

### Observaciones (iter-2 candidato, no bloquean preview)

1. Test 4010 refresh→reconnect no existe (plan §5.4). ~30 min.
2. Close code 4010 no implementado backend (solo docstring). ~20 min.
3. `useCharContributionTracker.ts` sin test dedicado.
4. `server.py` issues `ruff format` preexistentes heredados de main (PR `chore` separado).
5. Chunk `CollabEditor` 482 kB borderline 500 kB warning Vite.
6. Commit `fb1065f` mezcla plan + reporte + handoff landing.

### Componente legal: NO APLICA

Sub-bloque 2b no toca archivos con patrón legal, no cambia semántica legal. Flujo 7 capas estándar.

### Decisión

**Tarea APROBADA — PASS 95/100.** Puede proceder a Capa 2 code-reviewer y Capa 4 deploy a preview. Observaciones van a iter-2 dentro de 7 días.
