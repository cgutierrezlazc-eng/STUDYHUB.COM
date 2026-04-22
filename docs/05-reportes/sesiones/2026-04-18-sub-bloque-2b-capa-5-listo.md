# Snapshot — Sub-bloque 2b Workspaces Colaboración · Capa 5 completada

**Fecha**: 2026-04-18
**Estado**: Capa 5 gap-finder cerrada. Listo para Capa 4 (deploy preview) → Capa 6 (inspección humana).
**Branch**: `bloque-2b-colaboracion` (16 commits desde `main`)

---

## Capas completadas

| Capa | Agente | Resultado |
|---|---|---|
| 0 | web-architect | Plan `docs/plans/bloque-2-workspaces/2b-colaboracion.md` aprobado |
| 1 | backend-builder | 3 commits, 45/47 pytest (2 preexistentes 2a) |
| 1 | frontend-builder | 6 commits, 77/77 vitest |
| 2 | code-reviewer | WARN 68/100 · 7 moderados, ninguno crítico |
| 3 | truth-auditor | PASS 95/100 · sin mentiras |
| 5 | gap-finder | 3 CRÍTICOS + 1 ALTO, **todos fixeados pre-deploy** |

## Decisiones consolidadas §1.2.1

1. Snapshot Yjs pass-through simple (base64 opaco)
2. Chat grupal: historia completa visible a nuevos miembros
3. `y-indexeddb` SÍ incluido (offline-first)
4. `server.py` 2 líneas OK por sub-bloque

## Qué implementa el 2b

### Backend
- `backend/workspaces_ws.py` — WebSocket relay Yjs + chat multiplexado
- `backend/workspaces_routes.py` — endpoints chat (GET/POST/DELETE), contribution PATCH, `content_yjs` en Patch
- `backend/server.py` — 2 líneas: import + include_router
- 12/12 tests `test_workspaces_ws.py` incluyendo: auth 4001/4003/4004/4010, chat persistencia, binary relay, límites chat 4000 chars y binary 1 MiB

### Frontend
- `src/services/yjsProvider.ts` — wrapper y-websocket + y-indexeddb + refresh token flow
- `src/hooks/useAutoSave.ts` — debounce 2s, cliente elegido lexicográfico, estados saved/saving/unsaved/offline
- `src/hooks/useCharContributionTracker.ts` — flush 30s, ignora borrados, re-acumula en error
- `src/components/workspaces/Chat/{GroupChat,MessageList}.tsx`
- `src/components/workspaces/Presence/MemberContributionBar.tsx`
- `src/components/workspaces/Editor/CursorPresence.tsx`
- `src/components/workspaces/Editor/LexicalEditor.tsx` — prop `collaborationConfig` (CollaborationPlugin de @lexical/yjs)
- `src/pages/Workspaces/WorkspaceEditor.tsx` — integra provider + hooks + awareness online real + manejo error título visible
- 77/77 vitest incluyendo: 17 yjsProvider (con flujo refresh 4010), 9 useAutoSave, 7 useCharContributionTracker, 13 GroupChat, 6 collab editor

### Shared
- `shared/workspaces-types.ts` — `WorkspaceMessage`, `ContributionUpdate`, `PresenceUser`, `content_yjs` en UpdateInput

## Fixes aplicados post-Capa 5

| Severidad | Descripción | Commit |
|---|---|---|
| CRÍTICO-1 | `createWorkspaceProvider(id, ...)` sin prefijo (antes `conniku-ws-${id}` causaba close 4004) | `dc2be40` |
| CRÍTICO-2 | `useAuth()` del AuthContext (antes `localStorage.getItem('conniku_user_id')` → 'guest' siempre) | `dc2be40` |
| CRÍTICO-3 | `backend/collab_ws.py` agregado a `FROZEN.md` + regen | `dc2be40` |
| ALTO-1 | `yjsProvider.ts` deriva WS de `VITE_API_URL` (antes hardcoded) | `dc2be40` |
| MODERADO-1 | Chat textarea `maxLength={4000}` (antes 2000, ahora paridad backend) | (pendiente commit) |
| INFORMATIVO-1 | Flujo refresh 4010 implementado + 5 tests | (pendiente commit) |

## Verificación final pre-deploy

```
npx tsc --noEmit        → 0 errors
npm run lint            → 0 errors, 444 warnings preexistentes
npx vitest run src/__tests__/workspaces/ → 82 tests en 9 files, 82/82 OK
npm run build           → ✓ built in 10-13s
python3.11 -m pytest backend/tests/test_workspaces_*.py → 45 passed, 2 preexistentes del 2a
```

## Frozen nuevo

- `backend/collab_ws.py` — V1 Trabajos Grupales protegido mientras coexista con V2

## Deuda técnica restante (no bloquea preview)

- `server.py` tiene issues preexistentes `ruff format --check` heredados de main (PR `chore(backend)` separado)
- Chunk `CollabEditor` 482 kB borderline 500 kB warning Vite (preexistente)
- Tests adicionales de presencia online (Capa 6 humano)
- Limpieza tier MAX legacy antes del 2c Athena (bloque futuro dedicado, registrado en pendientes)

## Próximos pasos

- **Capa 4**: `gh pr create` → Vercel deploy preview automático
- **Capa 6**: Cristian inspecciona en URL de preview, abre 2 pestañas, prueba colaboración real
- **Capa 7**: merge a main + registro en `BLOCKS.md`
- Después del cierre: arrancar flujo-refactor limpieza MAX legacy antes del 2c Athena
