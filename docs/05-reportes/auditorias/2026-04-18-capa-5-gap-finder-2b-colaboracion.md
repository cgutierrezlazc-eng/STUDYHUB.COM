# Reporte Capa 5 — gap-finder — Sub-bloque 2b Colaboración real-time

**Agente**: gap-finder
**Fecha**: 2026-04-18
**Rama auditada**: `bloque-2b-colaboracion`
**Commits**: 13 (`667d136` → `7148f83`)

---

## Resumen ejecutivo

**RECOMENDACIÓN: BLOQUEADO para Capa 4** — 3 gaps CRÍTICOS.

| Severidad | Cant | Arreglo estimado |
|---|---|---|
| CRÍTICO | 3 | 45-60 min |
| ALTO | 1 | 10 min |
| MODERADO | 2 | 15 min |
| INFORMATIVO | 1 | 30 min (iter-2) |

---

## Gaps CRÍTICOS (bloquean deploy)

### CRÍTICO-1 — docId con prefijo rompe WebSocket en producción

**Archivo**: `src/pages/Workspaces/WorkspaceEditor.tsx:75`

```ts
const handle = createWorkspaceProvider(`conniku-ws-${id}`, currentUser);
```

El primer parámetro es el `docId`. `buildWsUrl` construye `wss://.../workspaces/ws/conniku-ws-abc123`. El backend (`workspaces_ws.py:175`) busca `WorkspaceDocument.id == "conniku-ws-abc123"` en BD. `gen_id()` produce IDs de 16 chars **sin prefijo**. El backend cierra con `4004`. **La colaboración Yjs es inoperante en producción.**

Tests del provider usan IDs sin prefijo (`'doc-xyz'`). Tests colab nunca instancian `WorkspaceEditor`. Bug no capturado por ningún test.

**Fix**: `createWorkspaceProvider(id, currentUser)` + mantener `namespace={`conniku-ws-${id}`}` solo en `LexicalEditor`.

### CRÍTICO-2 — userId siempre 'guest' en producción

**Archivos**: `src/pages/Workspaces/WorkspaceEditor.tsx:30-38` + `src/services/auth.tsx`

`WorkspaceEditor.getCurrentUser()` lee `conniku_user_id`, `conniku_user_name`, `conniku_user_avatar` de localStorage con fallback `'guest'`. **Ningún módulo escribe esas claves** (`auth.tsx:60-61` solo persiste tokens).

Consecuencias en producción:
- `currentUser.userId === 'guest'` siempre
- Awareness: todos los cursores dicen 'guest'
- `getCurrentMemberId(members, 'guest')` → `null` → contribution tracker deshabilitado permanentemente
- `isChosenClient('guest', ...)` con múltiples usuarios → comportamiento indefinido

No fue reportado por code-reviewer ni truth-auditor (ambos solo revisaron el código, no el flujo de datos).

**Fix**: que `auth.tsx` persista el perfil al login/refresh, o que `WorkspaceEditor` llame a `GET /auth/me` al montar.

### CRÍTICO-3 — `collab_ws.py` sin protección mecánica

**Archivos**: `FROZEN.md` + `.claude/frozen-files.txt`

El plan 2b §1.2.1 declara: *"V1 `backend/collab_ws.py` intacto (referencia, NO se toca)"*. Truth-auditor verificó que está byte-a-byte idéntico a main. Pero **no hay protección mecánica**. Los builders de 2c/2d pueden modificarlo sin que `check-frozen.sh` bloquee.

**Fix**: agregar `backend/collab_ws.py` a `FROZEN.md` + `regen-frozen-list.sh`.

---

## Gaps ALTO / MODERADO / INFORMATIVO

### ALTO-1 — URL WS hardcodeada

`src/services/yjsProvider.ts:92` — `'wss://studyhub-api-bpco.onrender.com'` hardcoded. El resto del codebase usa `import.meta.env.VITE_API_URL`. Fix: derivar de env var con conversión `https://` → `wss://`.

### MODERADO-1 — Asimetría maxLength chat

`GroupChat.tsx:207` textarea `maxLength={2000}` vs backend `MAX_CHAT_CONTENT_CHARS=4000`. Cliente más restrictivo (no es vulnerabilidad), pero inconsistente.

### MODERADO-2 — Docs sesión + pendientes

No hay snapshot `docs/sessions/` del 2b. Los pendientes iter-2 (7 del code-reviewer, 6 del truth-auditor) no están consolidados en `docs/pendientes.md`.

### INFORMATIVO-1 — Test 4010→refresh→reconnect faltante

`src/__tests__/workspaces/yjsProvider.test.ts` sin cobertura del flujo plan §5.4. iter-2.

---

## Secciones CLAUDE.md §Protocolo

### 1. Lo que se me pidió

Análisis estructural del sub-bloque 2b buscando gaps no reportados. Bloquear Capa 4 si hay >0 CRÍTICOS.

### 2. Lo que efectivamente hice

10 áreas inspeccionadas con Read + Grep + Bash. Comandos y salidas documentados en secciones 2.1-2.11 del análisis. Hallazgos con archivo:línea.

### 3. Lo que no hice y por qué

1. No ejecuté `--coverage` (no instalado).
2. No levanté server real para verificar 4004 (inspección de código suficiente).
3. No probé IndexedDB en Capacitor iOS (requiere dispositivo real — Capa 6).
4. No verifiqué Render config (fuera de scope local).
5. No leí todos los 80+ `.tsx` de `src/` buscando escritura de `conniku_user_*` — grep extenso sí realizado.

### 4. Incertidumbres

1. Bug docId: inspección de código sin ejecución real. Algún middleware podría aplicar strip (no hallé evidencia).
2. Gap `conniku_user_id`: grep sobre todo `src/` no halló escritura, pero no leí los 80+ archivos. Probabilidad falso positivo baja.
3. ALTO-1 podría ser CRÍTICO si cambian dominio. Mantengo ALTO porque hoy el hardcoded = `VITE_API_URL` default.
4. CRÍTICO-3 podría argumentarse innecesario si se recuerda la restricción. Mantengo CRÍTICO: el objetivo del sistema es reemplazar memoria por mecánica.
