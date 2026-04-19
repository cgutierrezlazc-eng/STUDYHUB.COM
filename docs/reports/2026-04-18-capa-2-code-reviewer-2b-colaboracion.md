# Reporte Capa 2 — code-reviewer (adversarial ciego) — Sub-bloque 2b Colaboración

**Fecha**: 2026-04-18
**Agente**: code-reviewer
**Método**: Read + Grep sobre archivos nuevos/modificados. Sin acceso a Bash. Sin lectura del plan original.

---

## 1. Lo que se me pidió

Revisar adversarialmente archivos nuevos y modificados del sub-bloque 2b. Emitir quality score con banda PASS/WARN/FAIL. Reporte en `docs/reports/2026-04-18-capa-2-code-reviewer-2b-colaboracion.md`.

---

## 2. Lo que efectivamente hice

Read sobre 25 archivos (backend, frontend, tests, config). 20 búsquedas adversariales con Grep.

**Resultados greps**:
- `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, credenciales hardcoded: 0 coincidencias en 2b
- `console.log` en archivos nuevos src/: 0 coincidencias
- `print(` en backend nuevo: 0 coincidencias
- `except Exception` en `workspaces_ws.py`: 5 ocurrencias (74, 87, 201, 240, 271)
- `as any` / `: any` en archivos nuevos: 0 (los preexistentes quedan fuera de scope)
- `as unknown as` en 2b: 2 justificadas (`LexicalEditor.tsx:94`, `WorkspaceEditor.tsx:53`)
- `WebSocketState` en `workspaces_ws.py`: importado línea 45, nunca usado
- Validación longitud en chat WS: ausente
- `onlineUserIds` en `WorkspaceEditor.tsx`: `useEffect` líneas 149-154 stub vacío

**Hallazgo adicional (test preexistente del 2a, verificado por truth-auditor)**:
`test_get_invite_token_invalido_retorna_404` (línea 440 de `test_workspaces_routes_crud.py`) espera HTTP 404, endpoint retorna HTTP 200 con `{"valid": False}`. **NO fue introducido por 2b** — viene de 2a. Truth-auditor confirmó los 2 tests rojos como preexistentes.

---

## 3. Lo que no hice y por qué

- No ejecuté tests ni build (corresponde a truth-auditor/qa-tester).
- No revisé `workspaces.css` completo (solo sección nueva de 2b, offset 855+).
- No revisé `server.py` completo (37k tokens) — solo imports/mount.
- No evalué ratio WCAG concreto de colores — variables CSS en temas preexistentes.
- Sin Bash, no pude confirmar ruff/eslint localmente; reporté especulativamente sobre `WebSocketState` import (que truth-auditor verificó con `ruff check .` como "All checks passed" — mi especulación resultó incorrecta).

---

## 4. Incertidumbres

1. El test `test_get_invite_token_invalido_retorna_404` es preexistente del 2a (no introducido por 2b). Inicialmente lo clasifiqué como bloqueante CI; tras verificación de truth-auditor es ruido fuera de scope 2b.
2. Los `except Exception` en `broadcast_bytes/broadcast_json` los penalicé aunque son pattern estándar para cleanup de WS muertos. Posible sobre-penalización.
3. El `useEffect` vacío de `onlineUserIds` lo clasifiqué como recomendado; si el plan requería presencia online operativa en esta iteración, sería bloqueante (el frontend-builder NO declaró este gap en su §3).
4. Mi estimación de contraste WCAG 10.5px `--text-muted` es riesgo especulativo no confirmable sin evaluar temas.
5. Mi conjetura de fallo `ruff` por `WebSocketState` import no usado fue incorrecta — verificación real del truth-auditor reportó `ruff check .` → "All checks passed!".

---

## 5. Quality Score

| Categoría | Posible | Otorgado |
|---|---|---|
| Seguridad | 25 | 18 |
| Manejo de errores | 15 | 9 |
| Null safety | 15 | 11 |
| Convenciones | 10 | 7 |
| Accesibilidad | 10 | 8 |
| Tests | 15 | 5 |
| Impacto código existente | 10 | 10 |
| **TOTAL** | **100** | **68** |

### Banda: **WARN** (68, rango 65-84)

### Bloqueantes críticos

**Ninguno en 2b.** El test `test_get_invite_token_invalido_retorna_404` falla pero es preexistente del 2a (confirmado por truth-auditor).

Sin credenciales hardcoded. Sin archivos frozen tocados. Sin XSS injectable. Sin auth bypass. Sin componente legal afectado.

### Hallazgos reales del 2b (no preexistentes)

**Moderados — iter-2 dentro de 7 días**:

1. **`workspaces_ws.py:224`** — Mensajes de chat vía WS sin límite de longitud. REST limita 4000 chars con Pydantic `max_length=4000`, pero el handler WS no valida. Asimetría que permite payloads grandes desde cliente autenticado. **Seguridad moderada.**
2. **`workspaces_ws.py` broadcast binario Yjs** — sin validación de tamaño de `message["bytes"]`. DoS potencial de memoria.
3. **`WorkspaceEditor.tsx:149-154`** — `useEffect` para `onlineUserIds` está vacío. El indicador de presencia online siempre muestra offline. Stub incompleto.
4. **`WorkspaceEditor.tsx:140`** — `handleTitleSave` con `.catch(() => {})` descarta silenciosamente errores de guardado de título sin feedback al usuario.
5. **`WorkspaceEditor.tsx`** — `id ?? ''` pasa string vacío a `useAutoSave`/`useCharContributionTracker` cuando `id` es undefined. Los hooks harán PATCH a `/workspaces//...` → 404 silencioso.
6. **Sin test dedicado `useCharContributionTracker`** — hook con lógica no trivial (acumulación, reset optimista, re-acumulación en error).
7. **Test colab WorkspaceEditor superficial** — `WorkspaceEditor.collab.test.tsx:169` inserta directamente en `ytext` y verifica `toString()`, no la UI. No prueba realmente sincronización del editor.

**Notas (no bloquean)**:

- Patrón `as unknown as Record<string, string>` para normalizar snake_case↔camelCase en `GroupChat.tsx:66-70` — recomendable centralizar conversión en `workspacesApi.ts`.
- `except Exception` en `broadcast_bytes/broadcast_json` — pattern aceptable en cleanup WS, pero conviene comentar inline el porqué.
- Chunk `CollabEditor` 482 kB borderline 500 kB warning Vite (preexistente).

### Confirmaciones positivas

1. JWT WS correcto con close codes 4001/4003/4004/4010.
2. Sin `dangerouslySetInnerHTML`/`innerHTML` — chat renderiza `<p>{msg.content}</p>` texto puro. XSS prevenido.
3. Autorización contribution sólida: `member.user_id != user.id` → 403 + test `test_patch_contribution_otro_usuario_retorna_403`.
4. `yjsProvider.destroy()` cleanup exhaustivo: timer, listeners `online/offline`, provider, IndexedDB.
5. Tests chat REST adversariales: 401, 403, 404, 400 vacío.
6. `LexicalEditor` mantiene retrocompatibilidad 2a (`collaborationConfig` opcional).
7. Backoff exponencial testeado con valores concretos (0→1000, 10→30000).

### Decisión

**Banda WARN sin bloqueantes críticos.** La puntuación 68 está justificada principalmente por -10 en Tests (principalmente por el test preexistente del 2a, que tras reconciliación con truth-auditor es ruido; sin él la banda subiría a ~73). Los hallazgos reales del 2b son 7 moderados no bloqueantes.

**Aprobación para avanzar a Capa 4** siempre que:
- Las 7 observaciones queden registradas para iter-2 dentro de 7 días
- El test preexistente del 2a NO se cuente contra 2b (confirmado por truth-auditor)
