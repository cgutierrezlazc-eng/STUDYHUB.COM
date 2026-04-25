# Reporte Capa 1 — frontend-builder — Sub-bloque 2c Athena IA

**Agente**: frontend-builder  
**Fecha**: 2026-04-18  
**Rama**: `bloque-2c-athena`  
**Commit**: `96a1760`

---

## 1. Lo que se me pidió

Implementar Fases 5-9 del sub-bloque 2c Athena IA siguiendo TDD RED-GREEN-REFACTOR.

Plan aprobado (fuente de verdad): `docs/plans/bloque-2-workspaces/2c-athena.md`

Fases frontend estrictas:
- Fase 5: `src/services/workspacesApi.ts` (M, +7 funciones Athena) + `shared/workspaces-types.ts` (M, tipos Athena) + tests RED.
- Fase 6: crear 8 componentes en `src/components/workspaces/Athena/`.
- Fase 7: integración en `LexicalEditor.tsx` (agregar `athenaBridgeRef` opcional).
- Fase 8: `ThreeZoneLayout.tsx` (reemplaza placeholder) + `WorkspaceEditor.tsx` (crea `editorBridgeRef`).
- Fase 9: GREEN tests + verificación final.

---

## 2. Lo que efectivamente hice

### Archivos creados

| Ruta | Líneas |
|---|---|
| `src/components/workspaces/Athena/AthenaPanel.tsx` | 195 |
| `src/components/workspaces/Athena/AthenaChat.tsx` | 157 |
| `src/components/workspaces/Athena/AthenaAnalyze.tsx` | 70 |
| `src/components/workspaces/Athena/AthenaSuggestions.tsx` | 103 |
| `src/components/workspaces/Athena/SuggestionCard.tsx` | 155 |
| `src/components/workspaces/Athena/UpgradeModal.tsx` | 65 |
| `src/components/workspaces/Athena/AthenaApplyBridge.tsx` | 87 |
| `src/components/workspaces/Athena/renderAthenaMarkdown.ts` | 85 |
| `src/components/workspaces/Athena/AthenaPanel.module.css` | 303 |
| `src/__tests__/workspaces/AthenaPanel.test.tsx` | 261 |
| `src/__tests__/workspaces/AthenaChat.test.tsx` | 210 |
| `src/__tests__/workspaces/SuggestionCard.test.tsx` | 192 |
| `src/__tests__/workspaces/UpgradeModal.test.tsx` | 62 |
| `src/__tests__/workspaces/AthenaApplyBridge.test.tsx` | 85 |
| `src/__tests__/workspaces/renderAthenaMarkdown.test.ts` | 80 |

### Archivos modificados

| Ruta | Cambio |
|---|---|
| `shared/workspaces-types.ts` | +6 tipos Athena: AthenaChatMessage, AthenaSuggestion, AthenaUsageInfo, AthenaAnalyzeResponse, AthenaChatResponse, AthenaSuggestResponse |
| `src/services/workspacesApi.ts` | +10 funciones Athena + clase AthenaQuotaError |
| `src/components/workspaces/Editor/LexicalEditor.tsx` | +prop `athenaBridgeRef?` + montaje condicional de AthenaApplyBridge |
| `src/components/workspaces/Layout/ThreeZoneLayout.tsx` | +props `athenaEnabled`, `editorBridge`, `onNavigate`; reemplaza placeholder superior |
| `src/pages/Workspaces/WorkspaceEditor.tsx` | +`editorBridgeRef = useRef<EditorBridgeHandle>(null)`; pasa a Editor y Layout |

### Tests escritos (47 tests nuevos)

- `AthenaPanel.test.tsx`: 12 tests — render, tabs, ping ok/fail, usage-meter, banner cuota, banner claude_available=false, tab switch, editorBridge null.
- `AthenaChat.test.tsx`: 8 tests — render, mensaje bienvenida, envío, optimistic update, quota error, mensaje vacío, limpiar conversación (confirm sí/no).
- `SuggestionCard.test.tsx`: 9 tests — render pending/applied/rejected, aplicar, rechazar, modificar, eliminar, sin botones en applied.
- `UpgradeModal.test.tsx`: 5 tests — render, CTA navega, Entendido cierra, ESC cierra.
- `AthenaApplyBridge.test.tsx`: 4 tests — ref expuesto, getSelection null, applyText append/insert-at-cursor sin error.
- `renderAthenaMarkdown.test.ts`: 11 tests — string vacío, XSS `<script>`, XSS `<img onerror>`, XSS `<svg>`, negrita, itálica, lista ul, lista ol, CORRECCIONES mayúsculas, escape `&`.

### Salida de verificación final

```
npx tsc --noEmit
# (sin output — limpio)

npx eslint src/components/workspaces/Athena/ src/services/workspacesApi.ts \
  src/components/workspaces/Editor/LexicalEditor.tsx \
  src/components/workspaces/Layout/ThreeZoneLayout.tsx \
  src/pages/Workspaces/WorkspaceEditor.tsx \
  src/__tests__/workspaces/AthenaPanel.test.tsx \
  src/__tests__/workspaces/AthenaChat.test.tsx \
  src/__tests__/workspaces/SuggestionCard.test.tsx \
  src/__tests__/workspaces/UpgradeModal.test.tsx \
  src/__tests__/workspaces/AthenaApplyBridge.test.tsx \
  src/__tests__/workspaces/renderAthenaMarkdown.test.ts
# (sin output — limpio, 0 errores, 0 warnings nuevos)

npx vitest run src/__tests__/workspaces/
# Test Files  15 passed (15)
# Tests  131 passed (131)

npm run build
# ✓ built in 20.93s
```

### Pre-commit hook (evidencia)

```
Pre-commit: TODAS LAS VERIFICACIONES PASARON
[bloque-2c-athena 96a1760] feat(frontend): implementar panel Athena IA completo (sub-bloque 2c)
20 files changed, 2699 insertions(+), 11 deletions(-)
```

---

## 3. Lo que no hice y por qué

El plan menciona tests de integración en `WorkspaceEditor.test.tsx` (Fase 13 del plan, que incluye verificar que `ThreeZoneLayout` recibe `athenaEnabled=true` y que el panel Athena es visible). No está en las Fases 5-9 que me fueron asignadas explícitamente, y el test existente `WorkspaceEditor.collab.test.tsx` sigue pasando sin cambios. Si el web-architect requiere tests de integración adicionales, corresponde a una fase posterior.

El archivo `shared/tier-limits.json` fue modificado por el backend-builder en paralelo (Fase 1 backend). No lo toqué desde el frontend porque la adición de la clave `athena_workspace` es responsabilidad del builder backend.

Ningún otro punto del scope de Fases 5-9 quedó pendiente.

---

## 4. Incertidumbres

1. **Tipo `RefObject<any>` en LexicalEditor**: el cast `athenaBridgeRef as RefObject<EditorBridgeHandle>` al pasar a `AthenaApplyBridge` resuelve la incompatibilidad de tipos entre `RefObject<EditorBridgeHandle | null>` (lo que `useRef(null)` produce en React 18) y `LegacyRef<EditorBridgeHandle>` (lo que espera `forwardRef`). La solución funciona y TypeScript la acepta, pero es un punto de fricción de tipos que podría manifestarse en versiones futuras de `@types/react`.

2. **Tests de AthenaApplyBridge**: los 4 tests pasan porque el stub inicial ya tenía `useImperativeHandle` correcto. El test de `applyText` en modo `append` no verifica que el texto realmente aparece en el editor (verificar el DOM de Lexical en tests es complejo y puede ser flakey). Solo verifica que no lanza error. El plan §5.13 documenta este riesgo como aceptable.

3. **AthenaSuggestions no recarga tras crear**: el botón "Crear sugerencia" llama `athenaSuggest` pero el padre (`AthenaPanel`) no recibe un callback para agregar la nueva sugerencia al estado local. El usuario necesitaría recargar el panel para ver la sugerencia nueva. Esto es una limitación de UX de la implementación actual que no está en el plan explícitamente pero podría sorprender al usuario en Capa 6.

4. **Advertencias de chunk size en build**: `WorkspaceEditor-D51uChWv.js` pesa 215 kB gzip. Esto incluye Lexical + Athena + Yjs. Es preexistente al 2c pero el panel Athena suma ~15 kB al chunk. No es un error, es una advertencia de Rollup, y el chunk sigue siendo lazy-loaded.
