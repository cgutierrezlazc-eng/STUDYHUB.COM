# Snapshot — Sub-bloque 2a Workspaces Fundación CERRADO

**Fecha**: 2026-04-18
**Milestone**: cierre Capa 7 del sub-bloque 2a (primer sub-bloque del Bloque 2)
**PR**: #5
**Commits en el PR**: `19da6ef` (inicial), `6f2bd47` (fixes Capas 2/3/5), `27b432d` (fix jose.jwt CI)

## Milestone cerrado

**bloque-2a-workspaces-fundacion** — primer sub-bloque del Bloque 2 Workspaces. Construido durante jornada nocturna autorizada por Cristian (2026-04-17 al 2026-04-18). Aprobado por Cristian en Capa 6 (inspección local + preview Vercel).

## Qué entró a producción

### Backend (nuevo módulo aislado del V1)

- **8 modelos ORM** en `backend/database.py`:
  WorkspaceDocument, WorkspaceMember, WorkspaceVersion, WorkspaceMessage,
  WorkspaceAthenaChat, WorkspaceAthenaSuggestion, WorkspaceComment, AthenaUsage
- **Migración Python inline** en `backend/migrations.py` con patrón
  `inspector.has_table` + `engine.begin()` — crea las 8 tablas en boot
  idempotentemente
- **`backend/workspaces_routes.py`** nuevo archivo con 14 endpoints REST:
  CRUD workspaces, miembros, versiones, accept/validate invite
- **Pydantic** con `alias_generator` para snake_case ↔ camelCase
- **Helper `_check_access`** con jerarquía viewer/editor/owner
- **`server.py`**: 2 líneas exactas (import + include_router)

### Frontend

- **9 dependencias Lexical** agregadas (lexical, @lexical/react, list,
  link, rich-text, history, selection, utils, markdown)
- **`src/pages/Workspaces/`**: WorkspacesList, WorkspaceEditor,
  WorkspaceSettings, WorkspaceInvite
- **`src/components/workspaces/`**: Editor con Toolbar, Layout 3 zonas,
  authorColors determinístico, Share/CreateWorkspaceDialog, WorkspaceCard
- **`src/services/workspacesApi.ts`**: cliente HTTP con 14 funciones
- **`src/styles/workspaces.css`**: 540 líneas, identidad híbrida
  (temas Conniku + tipografía premium Fraunces/Inter/JetBrains Mono) +
  responsive mobile
- **`src/App.tsx`**: 4 rutas nuevas, V1 `/group-docs` comentado
- **`src/components/Sidebar.tsx`**: link Workspaces con icono filePen
- **`src/components/MobileBottomNav.tsx`**: actualizado de `/group-docs`
  a `/workspaces`

### Tests

- **Backend**: 23 verdes local (20 modelos + 3 migración) + 29 en CI
  (22 routes_crud + 7 access_control con fastapi)
- **Frontend**: 52 verdes (7 archivos de tests)

### Docs

- `docs/plans/bloque-2-workspaces/plan-maestro.md` (477 líneas)
- `docs/plans/bloque-2-workspaces/2a-fundacion.md`
- `docs/plans/bloque-2-workspaces/mockups/` (9 HTML: index + 8 pantallas)
- `docs/reports/2026-04-18-capa-2-code-reviewer-2a-workspaces.md`
- `docs/reports/2026-04-18-capa-3-truth-auditor-2a-workspaces.md`
- `docs/reports/2026-04-18-capa-5-gap-finder-2a-workspaces.md`
- `scripts/dev-workspaces-local.sh` (setup local aislado para testing)

## Calidad medida

| Capa | Agente | Score | Banda |
|---|---|---|---|
| Capa 2 | code-reviewer (adversarial ciego) | 83/100 | WARN |
| Capa 3 | truth-auditor (cruce declarado vs real) | 82/100 | WARN |
| Capa 5 | gap-finder (auditoría estructural) | 4 críticos + 5 moderados (7/14 resueltos) | — |

**Bandas WARN sin bloqueantes críticos**. Fixes de los 4 críticos y 3 moderados aplicados antes del merge en commit `6f2bd47`.

## Lo que hace V2 funcionalmente en 2a

1. Listar workspaces del usuario (owner + miembro)
2. Crear workspace con título, materia, edición APA 7/6
3. Abrir workspace → layout 3 zonas
4. Editor Lexical básico (bold/italic/underline/headings/listas/link)
5. Auto-save implícito (del endpoint PATCH)
6. Sidebar con 3 placeholders (TOC/Colaboradores/Rúbrica) listos para 2b
7. Panel derecho placeholder "Borrador privado disponible en v2c"
8. Chat FAB placeholder "disponible en v2b"
9. Page Settings placeholder "disponible en v2d"
10. Page Invite con validación token + accept scaffold

## Lo que NO hace aún (scope futuros sub-bloques)

- **Yjs real-time**: edición colaborativa keystroke-a-keystroke (2b)
- **Chat del grupo** persistido con WebSocket (2b)
- **Author colors** aplicados a cursores de otros usuarios (2b)
- **Contribution metrics** con barra de progreso (2b)
- **Athena AI** panel con staging privado y flujo Apply/Modify/Reject (2c)
- **Rate limiting** + tabla `athena_usage` accounting + modal upgrade (2c)
- **APA validation** tiempo real (2d)
- **Rúbrica upload + parsing + checklist** automática (2d)
- **Tapa editable** con plantillas institucional/estándar (2d)
- **Export PDF/DOCX** con SSRF fix (2d)
- **Matemáticas**: KaTeX + MathLive + SymPy + gráficos (2d)
- **Comentarios inline, plantillas, link público, menciones, tasks
  sincronizadas, emojis, STT/TTS, modo focus, modo presentación,
  arrastrar archivos, voice notes, imprimir, duplicar, star,
  búsqueda global** (2d)

## Archivos frozen propuestos en este cierre

**Ninguno por ahora.** Los archivos del 2a seguirán evolucionando con
2b/2c/2d (agregarán Yjs bindings, Athena panels, APA validation, etc.).
Cuando cierre el Bloque 2 completo (tras 2d en Capa 7 final) se
evaluará qué freezar selectivamente.

Excepción candidata a futuro freeze en bloque completo:
- `shared/workspaces-types.ts` (contratos BD)
- `src/components/workspaces/authorColors.ts` (determinismo probado con test)
- `docs/plans/bloque-2-workspaces/mockups/` (referencia visual final)

## Estadísticas

- **Sub-bloques del Bloque 2 cerrados**: 1 de 4 (2a ✓, 2b-2c-2d pendientes)
- **Iteraciones Capa 6**: 1 (Cristian aprobó sin correcciones tras inspección local + preview)
- **Commits en el sub-bloque**: 3 (inicial + fixes + jose.jwt)
- **Archivos creados**: ~40 (backend + frontend + tests + docs)
- **Líneas netas agregadas**: ~6.500
- **Tests totales 2a**: 75+ (23 backend local + 29 backend CI + 52 frontend)

## Deuda técnica documentada para iteraciones futuras

Ver `docs/reports/2026-04-18-capa-5-gap-finder-2a-workspaces.md` secciones
MODERADO-2 (window.prompt), MODERADO-5 (test WorkspaceEditor),
RECOMENDADO-S2, RECOMENDADO-E1, RECOMENDADO-N1, INFORMATIVO-3,
INFORMATIVO-4.

## Próximo paso

**Bloque 2b Colaboración real-time + Chat grupal**. Abordará:
- Yjs CRDT + `@lexical/yjs` binding
- WebSocket relay backend para sincronización
- Cursores con author colors visibles
- Contribution metrics con barra sidebar
- Chat del grupo con persistencia + WebSocket
- Auto-save con indicador visual

Se crea nueva rama `bloque-2b-workspaces-colab` desde `main` actualizado
con el merge de 2a. Protocolo 7 capas completo igual que 2a.

## Pendientes fuera del Bloque 2

(Consultar `docs/pendientes.md` para backlog completo)
- GoogleAgeDeclarationModal (bloque-1-iter-2)
- RUT placeholder 77.XXX.XXX-X en archivos FROZEN de HR
- T&C + Privacy v3.0 unificados
- Chat en Biblioteca (módulo aparte)
- Constantes legales `backend/constants/`
