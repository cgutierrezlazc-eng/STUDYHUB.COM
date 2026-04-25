# Capa 5 · Gap-finder — Sub-bloque 2a Workspaces Fundación

**Fecha**: 2026-04-18 · **Rama**: `bloque-2a-workspaces-fundacion` · **Commit auditado**: `19da6ef` · **PR**: #5

## 1. Lo que se me pidió

Auditoría estructural del sub-bloque 2a Workspaces Fundación cubriendo 10 categorías: completitud estructural, tests no cubiertos, variables de entorno, dependencias, documentación, integración, regresiones potenciales, aislamiento, archivos FROZEN, CI gate.

## 2. Resumen ejecutivo

| Severidad | Cantidad | Estado tras fixes |
|---|---|---|
| Crítico | 4 | **4/4 resueltos** por Tori antes de commit de fixes |
| Moderado | 5 | **3/5 resueltos**, 2 documentados como deuda para 2d |
| Informativo | 5 | Documentados en tracker, atacar en próximas iteraciones |

## 3. Gaps críticos (todos resueltos)

### CRÍTICO-1 — Desajuste forma respuesta API/frontend
**Detectado**: backend retornaba arrays directos, frontend esperaba objetos envueltos (`data.workspaces`, `membersData.members`, `{versions: [...]}`).

**Efecto original**: WorkspacesList siempre mostraba empty state; WorkspaceEditor crashaba al cargar members.

**Fix aplicado** (Tori post-revisión): backend ahora devuelve `{"workspaces": [...]}`, `{"members": [...]}`, `{"versions": [...]}`. Tests backend ajustados (lines 170, 189, 301, 394 de `test_workspaces_routes_crud.py`).

### CRÍTICO-2 — Campos `course_name` / `apa_edition` ignorados
**Detectado**: frontend envía snake_case, Pydantic `CreateWorkspaceRequest` declaraba camelCase sin alias. Resultado: campos nunca persistidos.

**Fix aplicado**: nueva clase base `_WorkspaceBaseRequest` con `ConfigDict(alias_generator=_to_camel, populate_by_name=True)`. Todos los request schemas heredan. Campos renombrados a snake_case coherente con frontend. Referencias `data.courseName` → `data.course_name` en los handlers.

### CRÍTICO-3 — Endpoint `acceptInvite` inexistente
**Detectado**: frontend llamaba `POST /workspaces/invite/{token}/accept`, backend no tenía la ruta.

**Fix aplicado**: nuevo endpoint `POST /invite/{token}/accept` en `workspaces_routes.py`. Scaffold 2a: usa `share_link_token`, agrega usuario autenticado como `editor` con check de duplicado. Flujo de expiración y roles configurables queda para 2d.

### CRÍTICO-4 — Forma `InviteTokenInfo` incompatible
**Detectado**: backend devolvía `{id, title, courseName, owner, token}`, frontend esperaba `{workspace_id, workspace_title, owner_name, proposed_role, valid}`.

**Fix aplicado**: backend `GET /invite/{token}` ahora devuelve objeto alineado con `InviteTokenInfo`: `{valid, workspace_id, workspace_title, course_name, owner_name, proposed_role, token}`. Tipos TypeScript ajustados para permitir null (invitación inválida).

## 4. Gaps moderados

### MODERADO-1 — Clases CSS `ws-*` no definidas
**Detectado**: componentes usaban decenas de clases `.ws-list-page`, `.ws-toolbar`, `.ws-three-zone`, etc. sin archivo CSS correspondiente. Solo `.ws-status` preexistía.

**Fix aplicado**: creado `src/styles/workspaces.css` con ~540 líneas cubriendo todas las clases del módulo. Identidad híbrida respeta variables `--bg-primary`, `--accent`, etc. de los 6 temas Conniku + tipografía premium propia (Fraunces + Inter + JetBrains Mono). Importado desde `global.css`. Responsive desktop-first con breakpoint mobile ≤900px.

### MODERADO-2 — `window.prompt()` en Toolbar.tsx
**Detectado**: línea 100 usa `window.prompt()` para URL de link, incompatible con extensiones Manifest V3.

**Estado**: **deuda documentada** para 2d (cuando se expande la toolbar). TODO agregado en commit. No bloqueante para 2a.

### MODERADO-3 — MobileBottomNav apunta a `/group-docs` V1
**Detectado**: línea 131 mantenía `{ icon: 'book', label: 'Trabajos Grupales', path: '/group-docs' }`.

**Fix aplicado**: cambiado a `{ icon: 'book', label: 'Workspaces', path: '/workspaces' }`. Usuarios móviles ahora llegan al V2.

### MODERADO-4 — `createVersion` field mismatch
**Detectado**: frontend enviaba `content`, backend Pydantic esperaba `content_yjs`. Resultado: 422 en cada save manual de versión.

**Fix aplicado**: `workspacesApi.createVersion(id, contentYjs, label)` envía `{content_yjs: contentYjs, label}`.

### MODERADO-5 — `WorkspaceEditor.tsx` sin test dedicado
**Estado**: **deuda menor para 2b** cuando se agregue lógica Yjs al editor. Coverage actual cubre routing + componentes child.

## 5. Gaps informativos

### INFORMATIVO-1 — Flag `.claude/UNFREEZE_ACTIVE` persiste
Flag sigue activo desde apertura de 2a. Se limpiará al cierre de sesión según política `session-cleanup.sh`. Cristian puede eliminarlo manualmente al despertar.

### INFORMATIVO-2 — Naming plan vs código (menor)
Plan dice `WorkspaceInviteAccept.tsx`, código es `WorkspaceInvite.tsx`. Discrepancia de nombres sin impacto funcional.

### INFORMATIVO-3 — `workspacesApi.test.ts` cobertura 50%
7 de 14 funciones sin test dedicado: `listMembers`, `updateMember`, `removeMember`, `createVersion`, `restoreVersion`, `validateInviteToken`, `acceptInvite`. Deuda para ampliar en 2b (~40 líneas).

### INFORMATIVO-4 — `authorColors.test.ts` no valida WCAG AA algorítmicamente
Afirmación WCAG AA en docstring sin test automatizado. Deuda para 2d cuando colaboración visible sea prioritaria.

### INFORMATIVO-5 — 2 endpoints extra no planificados
`PATCH /members/{id}` y `POST /versions/{id}/restore` agregados sin actualizar plan. Plan 2a §3.1 a actualizar con estos 2 endpoints + justificación.

## 6. Lo que no hice y por qué

- No ejecuté tests ni build. Corresponde al truth-auditor (Capa 3 ya ejecutada).
- No revisé `test_workspaces_models.py` completo (solo primeras 60 líneas).
- No auditué archivos prohibidos más allá de confirmar que no están en `git diff main...HEAD`.

## 7. Incertidumbres

Inicialmente el gap moderado-1 (CSS) era el más incierto: pensé que podía existir importación dinámica no detectada. Verifiqué con grep completo y confirmé que era gap real (resuelto).

Los 29 tests backend que quedan skipped (routes_crud + access_control) correrán en CI. Si alguno revela un bug no capturado por los tests locales, aparecerá como rojo en el workflow.

## 8. Decisión

**Capa 5 PASS con observaciones** tras los fixes aplicados. De 14 gaps totales, 7 resueltos en 2a, 7 documentados como deuda para iteraciones futuras. Ninguno bloquea avance a Capa 6.

Los fixes aplicados por Tori se consolidan en commit adicional atómico antes de que Cristian inspeccione el preview Vercel.
