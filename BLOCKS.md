# BLOCKS - Registro histórico de bloques cerrados

> **Definición de bloque:** unidad autocontenida de funcionalidad del proyecto
> que completó las 7 capas del protocolo de cierre definido en CLAUDE.md
> Sección 18. Un bloque cerrado está en producción, verificado por todos los
> agentes, inspeccionado personalmente por Cristian en la web online, y sus
> archivos principales están protegidos en FROZEN.md.

## Principios

- **Un bloque cerrado no se reabre por modificaciones normales.** Sus
  archivos están protegidos en FROZEN.md. Para modificar, se requiere
  /unfreeze con razón justificada.
- **Cada bloque tiene un solo responsable final: Cristian.** Ningún bloque
  se cierra sin su OK explícito después de inspeccionar en la web online.
- **Este archivo se actualiza automáticamente por `/cerrar-bloque`.** No
  editar manualmente. Si necesitas hacer ajustes, usa `/unfreeze` primero
  y después actualiza este archivo a través del comando apropiado.

## Formato de entrada

Cada bloque cerrado tiene una fila con:

| Bloque | Fecha cierre | Iteraciones | Archivos principales | Notas |

Donde:

- **Bloque**: nombre corto en kebab-case (ejemplo: `dashboard-profesor`)
- **Fecha cierre**: YYYY-MM-DD del día que se ejecutó Capa 7
- **Iteraciones**: cuántas veces cicló Capa 6 antes del OK final de Cristian
- **Archivos principales**: lista resumida de archivos del bloque
- **Notas**: información relevante (feature principal, dependencias, etc.)

## Bloques cerrados

| Bloque | Fecha cierre | Iteraciones | Archivos principales | Notas |
|--------|--------------|-------------|----------------------|-------|
| `bloque-2-workspaces-v1` | 2026-04-19 | 1 | **Backend**: `backend/workspaces_routes.py` (1253 líneas, 28 endpoints CRUD + chat + citations + rubric + comments), `backend/workspaces_athena.py` (688 líneas, 8 endpoints Athena + rate-limit + cuotas Free/Pro), `backend/workspaces_export.py` (634 líneas, PDF/DOCX + sanitize_html + inline_remote_images con whitelist SSRF), `backend/workspaces_ws.py` (336 líneas, Yjs WebSocket relay con bounds). **Frontend**: `src/pages/Workspaces/{WorkspacesList,WorkspaceEditor,WorkspaceInvite,WorkspaceSettings}.tsx`, `src/components/workspaces/` (29 componentes: Editor/Lexical, Athena, Chat, Citations, Comments, Export, Rubric, Presence, Share, Layout), `src/services/workspacesApi.ts` (579 líneas con timeout/401 hardening). **Deprecado**: V1 collab (`backend/collab_routes.py`, `backend/collab_ws.py`, `src/pages/GroupDocs*.tsx`) — routers comentados en server.py, routes /group-docs* removidas en App.tsx. **Tests**: 22 backend workspaces + 289 frontend (incluyendo ExportModal, Toolbar, apiFetch hardening). | Bloque 2 v1 publicable = 2a (fundación) + 2b (colaboración Yjs) + 2c (Athena IA) + 2d.1 APA + 2d.3 KaTeX + 2d.6 Rúbrica + 2d.7 Export PDF/DOCX + 2d.8 Comentarios. Diferido a Bloque 2.5 post-launch: 2d.2 Tapa/TOC, 2d.4 Tablas, 2d.5 Imágenes, 2d.9 Mobile UX, 2d.10 DOCX formato completo. PR #10 mergeado (`de59165`). Auditoría completa 68/100 → 85+/100 tras hardening (docs/reports/2026-04-19-auditoria-workspaces-completa.md). Hallazgos resueltos: C-1 V1 expuesto, C-2 FROZEN coverage, A-2 rubric upload MAX_SIZE+MIME, A-8 tests ExportModal+Toolbar, A-10 apiFetch timeout/401. Frozen: workspaces_export.py + workspaces_athena.py + collab_routes.py + collab_ws.py. Pendiente: C-3 publicación legal (Privacy v2 + T&C v2 con Athena). |
| `bloque-2b-workspaces-colaboracion` (sub-bloque) | 2026-04-18 | 0 | `backend/workspaces_ws.py` (nuevo), `backend/workspaces_routes.py` (+chat + contribution + content_yjs), `src/services/yjsProvider.ts`, `src/hooks/{useAutoSave,useCharContributionTracker}.ts`, `src/components/workspaces/Chat/{GroupChat,MessageList}.tsx`, `src/components/workspaces/Presence/MemberContributionBar.tsx`, `src/components/workspaces/Editor/CursorPresence.tsx`, `src/components/workspaces/Editor/LexicalEditor.tsx` (+collaborationConfig), `src/pages/Workspaces/WorkspaceEditor.tsx` (+useAuth + hooks), `shared/workspaces-types.ts` (+WorkspaceMessage), `docs/plans/bloque-2-workspaces/2b-colaboracion.md` | Segundo sub-bloque del Bloque 2 Workspaces. Yjs CRDT + WebSocket relay + chat grupal multiplexado + `y-indexeddb` offline + métricas contribución + author colors + auto-save 2s con cliente elegido + flujo refresh token 4010. PR #6 squash-merge. 162/162 tests (80 backend + 82 frontend). code-reviewer WARN 68/100 → 7 moderados todos fixeados pre-deploy. truth-auditor PASS 95/100. gap-finder 3 CRÍTICOS (docId prefix, userId guest, freeze collab_ws) → todos fixeados. Decisión Cristian 2026-04-18: sin Capa 6 intermedia, inspección al final del módulo completo (ver `memory/feedback_bloque2_construccion_completa.md`). Frozen: `backend/collab_ws.py` (V1 protegido). |
| `bloque-2a-workspaces-fundacion` (sub-bloque) | 2026-04-18 | 1 | `backend/workspaces_routes.py`, `backend/database.py` (8 modelos Workspace*), `backend/migrations.py`, `shared/workspaces-types.ts`, `src/pages/Workspaces/{WorkspacesList,WorkspaceEditor,WorkspaceSettings,WorkspaceInvite}.tsx`, `src/components/workspaces/{Editor,Layout,Share,authorColors}`, `src/services/workspacesApi.ts`, `src/styles/workspaces.css`, `src/App.tsx` + `src/components/Sidebar.tsx` + `MobileBottomNav.tsx`, `docs/plans/bloque-2-workspaces/*`, 9 mockups HTML | Primer sub-bloque del Bloque 2 Workspaces (4 sub-bloques: 2a→2d). Módulo nuevo desde cero, aislado del V1. Motor Lexical + Yjs (Yjs llega en 2b). PR #5. 75+ tests verdes. WARN 83/100 code-reviewer, WARN 82/100 truth-auditor, 7/14 gaps resueltos. Ningún archivo frozen por ahora (evolución esperada 2b-2d). |
| `bloque-1-auth-edad` | 2026-04-18 | 1 | `shared/legal_texts.{py,ts}`, `scripts/verify-legal-texts-sync.sh`, `backend/database.py` (UserAgreement), `backend/migrations/add_user_agreements_table.sql`, `backend/auth_routes.py` (helpers + integración register + google), `backend/server.py:1078` (fix política 18+), `src/pages/Register.tsx` (checkbox 5 puntos), `src/services/auth.tsx` (payload legal + handler OAuth 403), `vite.config.ts`/`vitest.config.ts`/`tsconfig.json` (alias shared), `.github/workflows/verify-build.yml` (steps vitest + legal-sync), `CLAUDE.md` §19.1 fix, `.gitignore`, `src/admin/shared/accountingData.ts:173` | Primer bloque del protocolo 7 capas. Componente legal (CLAUDE.md §Verificación de edad). 24/24 tests verdes (16 backend + 8 frontend). CI gate de sincronía hash Python↔TS. Cerrado en 1 iteración (OK de Cristian sin correcciones). PR #4 mergeado a main con 7 commits. Deuda documentada: `GoogleAgeDeclarationModal` frontend reemplazará el alert temporal en bloque futuro bloque-1-iter-2. |

## Historial de intentos de cierre fallidos

Cuando un intento de cierre falla en alguna capa, también queda registro
para aprendizaje futuro. Los intentos fallidos no bloquean futuros
intentos del mismo bloque.

| Bloque | Fecha intento | Capa que falló | Razón del fallo | Resuelto en |
|--------|---------------|----------------|-----------------|-------------|

_(Ningún intento fallido todavía.)_

## Estadísticas del proyecto

Actualizadas cada vez que se cierra un bloque:

- **Total de bloques cerrados:** 2 completos (bloque-1, bloque-2-workspaces-v1) + 2 sub-bloques históricos (2a + 2b del bloque-2)
- **Promedio de iteraciones por bloque:** 0.67 (bloque-1: 1, bloque-2-v1: 1, 2a: 1, 2b: 0)
- **Tiempo promedio de cierre (desde inicio hasta OK):** <48h (bloque-2-v1 cerrado 2026-04-19, iniciado 2026-04-16)
- **Bloques con componente legal:** 1 (bloque-1). bloque-2-v1 tiene componente legal parcial (Athena requiere C-3 Privacy+T&C v2, diferido a bloque legal dedicado)
- **Últimos 3 bloques cerrados:**
  - `bloque-2-workspaces-v1` (2026-04-19) — Workspaces completo v1 publicable
  - `bloque-2b-workspaces-colaboracion` (2026-04-18) — sub-bloque del bloque-2
  - `bloque-2a-workspaces-fundacion` (2026-04-18) — sub-bloque del bloque-2

## Cómo consultar este archivo

- **Vista rápida:** `cat BLOCKS.md | head -50` para ver la cabecera y
  primeros bloques
- **Vista específica:** `grep "nombre-bloque" BLOCKS.md` para buscar un
  bloque específico
- **Desde Claude Code:** usar `/menu historial-bloques` (si existe esa
  opción en el menú)

## Relación con otros archivos

- **FROZEN.md:** cuando un bloque cierra, sus archivos se agregan aquí
  para protección. Cada entrada en BLOCKS.md tiene varias entradas
  correspondientes en FROZEN.md.
- **docs/inspecciones/*.md:** las iteraciones de Capa 6 quedan
  documentadas en `docs/inspecciones/{bloque}-iter-{N}.md` con lo que
  Cristian encontró y qué se corrigió.
- **registry_issues.md:** si algún bloque resolvió issues del registro,
  queda referencia cruzada aquí.
