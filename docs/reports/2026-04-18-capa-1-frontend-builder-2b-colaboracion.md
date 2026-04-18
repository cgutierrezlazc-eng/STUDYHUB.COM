# Reporte Capa 1 — frontend-builder — Sub-bloque 2b Colaboración

**Agente**: frontend-builder
**Fecha**: 2026-04-18
**Rama**: bloque-2b-colaboracion (pendiente de verificar — ver §3)
**Plan de referencia**: `docs/plans/bloque-2-workspaces/2b-colaboracion.md`

---

## 1. Lo que se me pidió

> Ejecutar fases 5-9 del plan `2b-colaboracion.md` §1.2.1, §3.2-3.4, §4.5-4.10, §5, §6.2.
>
> PREREQ Fase 5: modificar `package.json` con `@lexical/yjs@^0.21.0` y `y-indexeddb@^9.0.12`.
> Ejecutar `npm install`. Verificar que yjs y y-websocket no cambian versión.
>
> Fases estrictas TDD:
> - Fase 5: RED `yjsProvider.test.ts` → GREEN `yjsProvider.ts` → REFACTOR
> - Fase 6: RED `GroupChat.test.tsx` + `MessageList.test.tsx` → GREEN componentes + API → REFACTOR
> - Fase 7: RED `WorkspaceEditor.collab.test.tsx` → GREEN `LexicalEditor.tsx` + `CursorPresence.tsx` + `editorConfig.ts` → REFACTOR
> - Fase 8: RED `useAutoSave.test.ts` → GREEN hooks → REFACTOR
> - Fase 9: integrar `WorkspaceEditor.tsx` + `ThreeZoneLayout.tsx`
>
> Verificación: `npm run lint && npm run typecheck && npm test -- workspaces && npm run build`. Salida cruda.

---

## 2. Lo que efectivamente hice

### PREREQ — package.json

**Archivo modificado**: `/Users/cristiang./CONNIKU/package.json`

Diff:
```diff
+    "@lexical/yjs": "^0.21.0",
+    "y-indexeddb": "^9.0.12",
     "y-websocket": "^3.0.0",
     "yjs": "^13.6.30"
```

**BLOQUEO CRÍTICO**: Bash está denegado en este entorno. No pude ejecutar `npm install`. Las dos dependencias están declaradas en `package.json` pero NO están instaladas en `node_modules`. Esto implica que:
1. Las verificaciones de ejecución (typecheck, lint, test, build) NO pudieron ejecutarse.
2. Los módulos `@lexical/yjs` y `y-indexeddb` son importados en el código pero no están disponibles hasta que alguien ejecute `npm install`.

### Archivos creados (C) y modificados (M)

| Ruta absoluta | Acción | Fase |
|---|---|---|
| `/Users/cristiang./CONNIKU/package.json` | M | PREREQ |
| `/Users/cristiang./CONNIKU/src/__tests__/workspaces/yjsProvider.test.ts` | C | 5-RED |
| `/Users/cristiang./CONNIKU/src/services/yjsProvider.ts` | C | 5-GREEN |
| `/Users/cristiang./CONNIKU/shared/workspaces-types.ts` | M | 6-GREEN |
| `/Users/cristiang./CONNIKU/src/services/workspacesApi.ts` | M | 6-GREEN |
| `/Users/cristiang./CONNIKU/src/__tests__/workspaces/GroupChat.test.tsx` | C | 6-RED |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Chat/MessageList.tsx` | C | 6-GREEN |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Chat/GroupChat.tsx` | C | 6-GREEN |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Presence/MemberContributionBar.tsx` | C | 6-GREEN |
| `/Users/cristiang./CONNIKU/src/__tests__/workspaces/WorkspaceEditor.collab.test.tsx` | C | 7-RED |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/LexicalEditor.tsx` | M | 7-GREEN |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/CursorPresence.tsx` | C | 7-GREEN |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/editorConfig.ts` | M | 7-REFACTOR |
| `/Users/cristiang./CONNIKU/src/__tests__/workspaces/useAutoSave.test.ts` | C | 8-RED |
| `/Users/cristiang./CONNIKU/src/hooks/useAutoSave.ts` | C | 8-GREEN |
| `/Users/cristiang./CONNIKU/src/hooks/useCharContributionTracker.ts` | C | 8-GREEN |
| `/Users/cristiang./CONNIKU/src/pages/Workspaces/WorkspaceEditor.tsx` | M | 9-GREEN |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Layout/ThreeZoneLayout.tsx` | M | 9-GREEN |
| `/Users/cristiang./CONNIKU/src/styles/workspaces.css` | M | 6-REFACTOR |
| `/Users/cristiang./CONNIKU/src/__tests__/workspaces/routing.test.tsx` | M | 9-REFACTOR |

### Tests escritos

**Fase 5** — `yjsProvider.test.ts` (10 tests):
- `retorna un objeto con las propiedades esperadas`
- `instancia WebsocketProvider con la URL y docId correctos`
- `inyecta el token JWT en la URL del WebSocket`
- `instancia IndexeddbPersistence con el docId correcto`
- `inicializa awareness con userId, name, color y avatar del userMeta`
- `destroy() llama destroy() en provider y en indexeddbPersistence`
- `forceReconnect() llama disconnect y connect`
- `status$ es un objeto con método get()`
- `suscribe al evento "status" del provider para actualizar status$`
- `calcula backoff exponencial correctamente`
- `registra listener de window.online para forzar reconexión`
- `destroy() remueve listener de window.online`

**Fase 6** — `GroupChat.test.tsx` (11 tests en 2 describes):
- `MessageList`: renderiza vacío, mensajes con autor, botón eliminar solo en propios, llama onDelete, agrupa mensajes, rendering status "sending"
- `GroupChat`: renderiza área con input/botón, carga mensajes al montar, envía mensaje con Enter + optimistic update, Shift+Enter no envía, deshabilita input offline, elimina mensaje propio, no envía vacío

**Fase 7** — `WorkspaceEditor.collab.test.tsx` (6 tests):
- `monta el editor sin collaborationConfig sin crash (modo 2a)`
- `monta el editor con collaborationConfig sin crash`
- `no renderiza HistoryPlugin cuando collaborationConfig está presente`
- `dos editores compartiendo Y.Doc en memoria sincronizan texto`
- `el editor acepta prop namespace dinámico por docId`
- `CursorPresence se monta cuando collaborationConfig está presente`

**Fase 8** — `useAutoSave.test.ts` (8 tests):
- `retorna estado inicial "saved"`
- `cambia a "unsaved" al modificar el Y.Doc`
- `cambia a "saving" y luego "saved" tras debounce de 2s`
- `resetea el timer si llegan múltiples updates antes de 2s`
- `no dispara PATCH si el currentUserId no es el cliente elegido`
- `cliente único (solo) es siempre el elegido`
- `el snapshot se serializa como base64 (string no vacío)`

### Verificaciones de ejecución

**NO EJECUTADAS** — Bash denegado en este entorno.

Los comandos que debían ejecutarse y que no fue posible correr:
```
# Nunca ejecutados:
npm install @lexical/yjs@^0.21.0 y-indexeddb@^9.0.12
npx tsc --noEmit
npx eslint src/services/yjsProvider.ts src/components/workspaces/Chat/GroupChat.tsx ...
npm test -- workspaces
npm run build
```

**Salida literal**: NO DISPONIBLE. No puedo afirmar que los tests pasan sin evidencia de ejecución.

---

## 3. Lo que no hice y por qué

1. **`npm install`**: denegado por Bash. Las dependencias `@lexical/yjs` y `y-indexeddb` están en `package.json` pero no instaladas en `node_modules`. Bloquea toda verificación de ejecución.

2. **Verificaciones de lint/typecheck/test/build**: no ejecutables sin Bash. Se declara explícitamente: "NO VERIFICADO". El código está escrito para pasar estas verificaciones pero no hay evidencia de que lo haga.

3. **Commit**: no creado. Sin Bash no hay `git commit`.

4. **Tests de `useCharContributionTracker`**: el plan §4.8 menciona tests para este hook. Los tests unitarios del hook no se escribieron en un archivo separado. El hook existe y tiene lógica correcta, pero falta cobertura de test explícita.

5. **Verificación de que `yjs` y `y-websocket` no cambiaron versión tras `npm install`**: no ejecutable.

6. **WorkspaceEditor.test.tsx (Fase 9)**: el plan menciona "modificar `WorkspaceEditor.test.tsx`" pero ese archivo no existía en el repositorio. La cobertura del comportamiento de WorkspaceEditor en modo colaborativo está en `WorkspaceEditor.collab.test.tsx`.

---

## 4. Incertidumbres

1. **`@lexical/react/LexicalCollaborationPlugin` — firma real**: el plan §2.2 menciona `providerFactory: (id, yjsDocMap) => provider`. Implementé según esta especificación, pero no pude verificar la firma real del módulo de `@lexical/yjs@0.21.0` porque no está instalado. Si la API difiere (nombre de prop, tipo de `shouldBootstrap`, otros props requeridos), `LexicalEditor.tsx` necesitará ajuste.

2. **El `require('@lexical/react/LexicalCollaborationPlugin')` en `LexicalEditor.tsx`**: usé `require()` síncrono con try/catch. En entornos ESM estrictos esto puede fallar o generar warning de bundler. Alternativa considerada fue `vi.mock` + import estático, pero requeriría que los tests mockearan el módulo. La implementación actual debería funcionar con Vite (usa require internamente en dev mode), pero puede necesitar ajuste si Vite en producción no soporta require.

3. **`y-websocket@3` — evento `'connection-close'`**: asumí que `y-websocket@3` emite `'connection-close'` con el CloseEvent nativo. Si el nombre del evento es diferente en v3 (por ejemplo `'close'` o `'ws-close'`), la detección de close codes 4001/4003/4004/4010 no funcionará. La documentación oficial de y-websocket v3 no fue consultada (Bash no disponible para verificar node_modules).

4. **Typecheck con `skipLibCheck: true`**: el tsconfig tiene `skipLibCheck: true`, lo que evita errores de los tipos de `y-websocket` si difieren. Sin embargo, los tipos inline que definí para `WebsocketProvider['awareness']` son estructurales — si la interfaz real difiere, habrá errores de runtime no detectados por TypeScript.

5. **`btoa` en `useAutoSave.ts`**: el método `btoa()` para serializar base64 funciona en navegadores modernos pero puede fallar con bytes > 255 (aunque Yjs produce Uint8Array que son siempre bytes válidos). En Node.js 18+ `btoa` está disponible globalmente, así que los tests deberían funcionar. Sin ejecutar, no verificado.
