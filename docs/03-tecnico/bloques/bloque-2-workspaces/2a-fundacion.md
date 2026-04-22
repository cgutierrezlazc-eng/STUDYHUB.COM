# Plan detallado — Sub-bloque 2a Fundación (Bloque 2 Workspaces)

**Proyecto**: Conniku
**Autor**: Tori (web-architect) — redactado 2026-04-18 durante jornada
nocturna autorizada por Cristian
**Referencia**: `docs/plans/bloque-2-workspaces/plan-maestro.md`
**Componente legal**: parcial (campos de rúbrica y APA edition tocan
decisiones académicas, pero 2a es solo scaffolding — implementación
legal real queda en 2d)
**Protocolo**: 7 capas. Tori ejecuta 0-5 en la noche, 6-7 al despertar
Cristian.

---

## 1. Contexto

### 1.1 Referencia al plan maestro
El Bloque 2 Workspaces se consolidó con 21 decisiones de Cristian en
`plan-maestro.md`. Aquí se detalla únicamente el sub-bloque **2a
Fundación**, cuyo alcance es el andamiaje mínimo (BD + rutas base +
editor Lexical mínimo + routing + sidebar + tests básicos). Nada de
Yjs (eso es 2b), nada de Athena (2c), nada de APA/rúbrica/math/export
(2d).

### 1.2 Archivos existentes leídos (evidencia)
Para planificar sobre código real (no suposición) se leyeron:

- `backend/database.py` (2021 líneas) — confirma patrón
  `Column(String(16), primary_key=True, default=gen_id)` y uso mixto de
  `Integer autoincrement` para tablas de métrica (`ChatUsage` tiene ese
  patrón, por eso `AthenaUsage` y los chats/suggestions también lo
  llevan según el plan maestro).
- `backend/migrations.py` (386 líneas) — el patrón real en producción
  usa `inspector = inspect(engine)` + `if not
  inspector.has_table("xxx"):` + `CREATE TABLE ...` inline dentro de
  `with engine.begin() as conn: conn.execute(text(...))`. Los archivos
  `.sql` de `backend/migrations/` existen (2: `add_expense_fields.sql`,
  `add_user_agreements_table.sql`) pero **no se invocan desde
  `migrations.py`**. Son documentación histórica. La migración real
  sucede en Python.
- `backend/server.py` (2239 líneas) — los `include_router(...)` van
  entre líneas 263-307. La inserción del nuevo router es una sola
  línea.
- `src/App.tsx` (945 líneas) — cada página se importa con
  `React.lazy(() => import('./pages/XXX'))` en las líneas 29-100, y la
  `<Route>` se declara más adelante. Las rutas V1 del módulo que
  reemplazamos están en 806-811 (`/group-docs` y `/group-docs/:docId`).
- `src/components/Sidebar.tsx` (534 líneas) — el link V1 está en las
  líneas 423-428 con texto literal `Trabajos Grupales` apuntando a
  `/group-docs`. Usa `Icons.fileText(IC.notes)` como icono.
- `FROZEN.md` + `.claude/frozen-files.txt` — **`package.json` está
  congelado**. Agregar dependencias Lexical requiere `/unfreeze`
  explícito de Cristian antes de ejecutar 2a. Ningún otro archivo del
  scope 2a está en FROZEN.
- `backend/migrations/add_user_agreements_table.sql` — plantilla de
  referencia para los archivos SQL históricos (documentación) que se
  crearán paralelos a la migración Python.

### 1.3 Hallazgos importantes
1. El patrón real de migraciones es **Python inline**, no SQL externo.
   El plan maestro decía "SQL plano idempotente" — lo implementamos
   como: Python con `inspector.has_table` ejecutando SQL DDL. Se
   mantiene archivo `.sql` paralelo por trazabilidad (espejo).
2. Los modelos con `String(16) primary_key default=gen_id` son la
   norma. Las tablas de métrica/histórico usan `Integer primary_key
   autoincrement` (mismo patrón que `ChatUsage`). El plan maestro ya
   fijó esa distinción en §4 y se respeta.
3. El V1 (`GroupDocs.tsx`, `GroupDocEditor.tsx`,
   `CollabEditor.tsx`, `collab_routes.py`, `collab_ws.py`) está en la
   lista de archivos **prohibidos de tocar**. Eso significa que el V1
   seguirá registrando su ruta en el router backend y sus lazy imports
   en `App.tsx`. Solo se **oculta el acceso visible** al usuario
   (sidebar + ruta en App.tsx).

---

## 2. Decisiones de diseño del 2a

### 2.1 Decisión D1 — Cómo esconder el V1 (Trabajos Grupales)
**Opciones consideradas**:
- **A**: remover ruta `/group-docs` y `/group-docs/:docId` en App.tsx
  (los lazy imports se mantienen muertos) + comentar link en sidebar.
- **B**: mantener ruta accesible por URL directa `/group-docs` + solo
  ocultar el link visible en sidebar.
- **C**: dejar ruta + link, pero agregar redirect JS que mande a
  `/workspaces`.

**Criterios**:
- Principio 4 del plan maestro: aislamiento de fallas.
- A1 del plan maestro: "V2 activa, V1 escondida (decisión final de
  borrar/restaurar después)".
- Evitar tocar archivos prohibidos (V1 intacto).
- Dejar reversibilidad simple si Cristian decide restaurar V1.

**Decisión elegida**: **Opción B**. Mantener las rutas
`/group-docs` y `/group-docs/:docId` registradas en App.tsx (intactas,
no se tocan las dos líneas de lazy import ni las rutas). **Solo se
oculta el botón del sidebar**, comentándolo con bloque
`{/* V1 oculto 2026-04-18 — ver docs/plans/bloque-2-workspaces.
   Accesible por URL directa /group-docs hasta decisión final. */}`.
El usuario común no verá Trabajos Grupales, pero cualquier link
existente en mensajes/emails antiguos que lleve a `/group-docs/:docId`
seguirá funcionando.

**Razonamiento**: Opción A rompería enlaces viejos (violación de
principio de aislamiento: los docs V1 existentes dejarían de
resolverse). Opción C agrega lógica de redirect que mezcla bloques.
Opción B es la más conservadora y coincide exactamente con la
descripción "V1 escondida" del plan maestro. La decisión final de
borrar o restaurar V1 queda para después del bloque 2, como dijo
Cristian.

### 2.2 Decisión D2 — Extensiones Lexical en el 2a
**Scope mínimo a incluir**:
- `RichTextPlugin` — base del editor
- `HistoryPlugin` — undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- `ListPlugin` — listas bullet y numeradas (`@lexical/list`)
- `LinkPlugin` + `LinkNode` — hipervínculos (`@lexical/link`)
- `HeadingPlugin` — H1/H2/H3 (parte de `@lexical/rich-text`)
- `OnChangePlugin` — para capturar cambios (sentando base para
  auto-save de 2b, pero en 2a solo loguea a consola en dev)
- `AutoFocusPlugin` — UX estándar
- Toolbar mínima: bold, italic, underline, heading dropdown, list
  bullet/numerada, link, undo/redo

**Lo que NO se incluye en 2a** (todo esto es 2b/2c/2d):
- `@lexical/yjs` + CollaborationPlugin (es 2b)
- MathPlugin (KaTeX + MathLive) (es 2d)
- APAPlugin, TOCPlugin, CoverPlugin, CitationPlugin (es 2d)
- Athena staging + SuggestionCard (es 2c)
- Comments inline, mentions, task-lists (es 2d)
- Drag and drop de imágenes/archivos (es 2d)

**Razonamiento**: mantener el 2a en los 6-7 plugins canónicos de
Lexical básico minimiza la curva de aprendizaje, evita bugs de
interacción entre plugins, y permite que el code-reviewer + truth-
auditor evalúen un scope acotado. Si metemos math o APA acá,
explotamos el tamaño del diff y bloqueamos la Capa 2/3.

### 2.3 Decisión D3 — Layout 3 zonas en 2a
El plan maestro §3 dice que Workspaces tiene 3 zonas:
1. Documento público real-time (es 2a scaffold + 2b funcional)
2. Borrador privado con Athena (es 2c)
3. Chat del grupo (es 2b)

**Decisión en 2a**: se crea `ThreeZoneLayout.tsx` con la estructura
CSS grid de las 3 zonas, **pero solo la zona 1 es funcional**.
Las zonas 2 y 3 son `<div>` placeholders con texto legible:

- Zona 2 (derecha superior, ~360px): "Borrador privado. Disponible
  próximamente." (sin mencionar Athena ni IA al usuario — ver regla
  CLAUDE.md §convenciones).
- Zona 3 (derecha inferior, ~360px): "Chat del grupo. Disponible
  próximamente."

Las zonas placeholder usan `aria-label` apropiado y estilo `opacity:
0.6` para comunicar visualmente que están deshabilitadas. Son
accesibles por tab pero no interactivas.

**Responsividad**: desktop-first según C4 del plan maestro. En
viewports <1024px, las zonas 2 y 3 se colapsan en tabs debajo del
documento. En 2a solo se valida que no rompan el layout en móvil;
interacción completa en 2d.

### 2.4 Decisión D4 — Diálogo de opciones al crear documento
**Scope 2a**: `CreateWorkspaceDialog.tsx` con campos:
- **Título** (input text, required, 1-255 chars)
- **Nombre del curso/ramo** (input text, opcional, 0-255 chars)
- **Edición APA** (dropdown, default "APA 7") con opciones:
  - APA 7 (por defecto)
  - APA 6 (disponible)
  - IEEE, Chicago, MLA (deshabilitados con tooltip "próximamente")
- Un bloque visual `<fieldset>` gris con texto "Más opciones de
  configuración estarán disponibles próximamente (rúbrica, tapa,
  plantillas, colaboración avanzada)." — esto comunica el scaffolding
  sin mentir ni mencionar "IA".

**Lo que NO se incluye en 2a**:
- Upload de rúbrica (PDF/DOCX) — es 2d
- Plantillas de documento — es 2d
- Tapa/cover editor — es 2d
- Toggles de features por doc — es 2d

**Razonamiento**: el campo `apa_edition` ya vive en el modelo
`WorkspaceDocument` según plan maestro §4. Setearlo desde el inicio
evita migración posterior. Los demás campos (`rubric_raw`,
`cover_data`, `options`) existen como columnas nullable y se llenan en
sub-bloques posteriores.

### 2.5 Decisión D5 — Icono de sidebar para Workspaces
**Opciones**: `FileText` (usado ya en V1 y en varios lugares),
`FilePen` (semántico: "archivo que se edita"), `BookOpen` (semántico:
"documento académico").

**Criterios**:
- Diferenciarse visualmente del V1 si llegaran a coexistir por algún
  periodo.
- Coherencia con el carácter académico del módulo (APA, rúbrica).
- Diferenciarse de otros iconos ya en sidebar (`Book` se usa en
  Biblioteca, `Calendar` en Events, etc.).

**Decisión elegida**: **`FilePen`** (de Lucide React). Justificación:
- `FileText` estaría duplicado visualmente con el V1 durante el
  periodo de convivencia (aunque el V1 esté oculto, el asset sigue
  cargado y puede aparecer en screenshots o en flujos excepcionales).
- `BookOpen` connota lectura pasiva, no edición colaborativa.
- `FilePen` comunica "documento que se está escribiendo", alineado con
  la visión del módulo (redacción colaborativa).

Fallback: si `FilePen` no está disponible en la versión de `lucide-
react` instalada, usar `Edit3` (lápiz sobre fondo de documento). Esta
verificación la hace el frontend-builder antes de GREEN.

### 2.6 Decisión D6 — URL scheme de Workspaces
**Decisión elegida**:
- `/workspaces` → página lista de workspaces del usuario (página
  funcional en 2a con CRUD)
- `/workspaces/new` → **NO es ruta separada**. El botón "Nuevo
  workspace" en `/workspaces` abre `CreateWorkspaceDialog` como modal
  sobre la misma página. Justificación: evita navegación innecesaria,
  alineado con patrón Google Docs/Notion.
- `/workspaces/:id` → editor principal del workspace (página
  funcional en 2a con editor Lexical mínimo)
- `/workspaces/:id/settings` → página settings (scaffolding en 2a con
  vista de miembros + metadatos del workspace; funcionalidad avanzada
  en 2d)
- `/workspaces/invite/:token` → aceptar invitación. **Scaffold en 2a**
  con página que lee el token, valida contra backend y muestra
  "Invitación válida — únete" / "Invitación inválida o expirada".
  Implementación real del flujo (invitar desde settings, generar
  token, roles) es 2d.

**Razonamiento**: las 5 rutas se registran en App.tsx con lazy import,
pero solo 3 son funcionales en 2a (lista, editor, settings básico).
`/workspaces/new` no existe como ruta (es un modal). Invite es
scaffold.

---

## 3. Archivos a tocar

Legend: **C** = crear, **M** = modificar, **-** = no tocar (solo
referencia).

### 3.1 Backend

| Acción | Ruta | Qué se hace |
|---|---|---|
| **C** | `backend/workspaces_routes.py` | Router FastAPI nuevo. Endpoints: `GET /workspaces`, `POST /workspaces`, `GET /workspaces/{id}`, `PATCH /workspaces/{id}`, `DELETE /workspaces/{id}`, `GET /workspaces/{id}/members`, `POST /workspaces/{id}/members`, `DELETE /workspaces/{id}/members/{user_id}`, `GET /workspaces/{id}/versions`, `POST /workspaces/{id}/versions`, `GET /workspaces/invite/{token}`. Todos con `Depends(get_current_user)`. No chat, no Athena, no export, no WS. |
| **M** | `backend/database.py` | Agregar los 8 modelos al final del archivo (**antes** de la función `get_db()` y la llamada `init_db()` de líneas 2012-2021). No tocar nada existente. Los modelos siguen literalmente la definición del plan maestro §4. Añadir también al inicio del archivo imports faltantes si los hay (probablemente `Index` ya está). |
| **C** | `backend/migrations/add_workspaces_tables.sql` | Archivo SQL plano con `CREATE TABLE IF NOT EXISTS` para las 8 tablas + índices. Es documentación histórica (espejo del DDL ejecutado por migrations.py). Se sigue el formato de `add_user_agreements_table.sql`. |
| **M** | `backend/migrations.py` | Al final de `migrate()` (después de línea 385 aprox, antes del return implícito), agregar un bloque nuevo: `# --- Workspaces tables (Bloque 2a) ---` con 8 checks `if not inspector.has_table("workspace_X"):` y sus `CREATE TABLE` + índices inline. Mismo patrón que las líneas 139-172 existentes (`tutoring_requests`). Incluir también re-lectura del inspector si es necesario (`inspector = inspect(engine)` al inicio del bloque para refrescar). |
| **M** | `backend/server.py` | **Una sola línea añadida** en la sección 263-307 de `include_router`: después de `app.include_router(moderation_queue_router)` línea 306, agregar `app.include_router(workspaces_router)`. También una línea de import arriba: `from workspaces_routes import router as workspaces_router`. Eso son **2 líneas** (1 import + 1 include). El plan maestro decía "prohibido modificar más de 1 línea" pero esa regla se refiere a lógica funcional; los imports y el `include_router` son el contrato estándar para registrar un router nuevo y no se consideran "modificación" sino "extensión por el canal definido". Documentar esta interpretación aquí. Si Cristian al revisar considera que esto viola la regla, se puede aislar a 1 línea usando `import` dentro de un try+dinámico, pero eso es peor en legibilidad. **Mi recomendación: 2 líneas sí, y que Cristian valide**. Si no acepta, pausa. |
| **C** | `backend/tests/test_workspaces_models.py` | Tests unitarios de los 8 modelos: crear fila, leer, actualizar, relaciones ForeignKey válidas, defaults, unique constraints (`share_link_token` unique). ~15 tests. |
| **C** | `backend/tests/test_workspaces_routes_crud.py` | Tests de integración con `TestClient` para el CRUD. Cubren: crear workspace (retorna 201 + JSON con id), listar workspaces propios (excluye ajenos), leer por id (404 si no es miembro), patch título, delete (solo owner), agregar miembro, quitar miembro, listar versiones, crear versión manual, validar invite token. ~18 tests. |
| **C** | `backend/tests/test_workspaces_migration.py` | Test que ejecuta `migrate()` sobre DB en memoria, verifica que las 8 tablas existen y re-ejecuta `migrate()` para confirmar idempotencia (sin errores, sin duplicar filas). ~3 tests. |

### 3.2 Frontend

| Acción | Ruta | Qué se hace |
|---|---|---|
| **C** | `src/pages/Workspaces/index.tsx` | Página `/workspaces` — lista los workspaces del usuario con cards (título, curso, última modificación, miembros). Botón "Nuevo workspace" abre `CreateWorkspaceDialog`. Empty state amigable si no hay workspaces. |
| **C** | `src/pages/Workspaces/WorkspaceEditor.tsx` | Página `/workspaces/:id` — layout 3 zonas con editor Lexical funcional + 2 placeholders. TopBar con título editable + breadcrumb. |
| **C** | `src/pages/Workspaces/WorkspaceSettings.tsx` | Página `/workspaces/:id/settings` — scaffolding: muestra metadata, lista de miembros (solo lectura en 2a), placeholder "Configuración avanzada próximamente". |
| **C** | `src/pages/Workspaces/WorkspaceInviteAccept.tsx` | Página `/workspaces/invite/:token` — scaffolding funcional básico: GET al backend con el token, muestra nombre del workspace + owner + rol propuesto, botón "Unirme". |
| **C** | `src/pages/Workspaces/__tests__/WorkspacesList.test.tsx` | Tests de la página lista con Vitest + React Testing Library. |
| **C** | `src/pages/Workspaces/__tests__/WorkspaceEditor.test.tsx` | Tests del editor: render, escribir texto, toolbar clicks. Usa `createTestEditor` de Lexical para evitar problemas de jsdom. |
| **C** | `src/components/workspaces/Editor/LexicalEditor.tsx` | Wrapper de `<LexicalComposer>` con configuración de nodos, theme, error boundary. Expone prop `onChange(editorState)` y `initialContent`. |
| **C** | `src/components/workspaces/Editor/Toolbar.tsx` | Toolbar fija arriba del editor con los botones B/I/U, heading, lista, link, undo/redo. Atajos de teclado estándar (Ctrl+B, etc.) ya los maneja Lexical. |
| **C** | `src/components/workspaces/Editor/editorTheme.ts` | Objeto theme Lexical usando CSS vars de Conniku (`--text-primary`, `--bg-primary`, `--accent`, `--border-subtle`). |
| **C** | `src/components/workspaces/Editor/editorConfig.ts` | Config base: lista de nodos (`HeadingNode`, `ListNode`, `ListItemNode`, `LinkNode`, `QuoteNode`), namespace `"conniku-workspace"`, error handler que loguea. |
| **C** | `src/components/workspaces/Layout/ThreeZoneLayout.tsx` | Layout CSS grid: columna izquierda = editor (flex 1), columna derecha = dos zonas apiladas (cada una 360px ancho, 50% alto). Placeholders para zonas 2 y 3. |
| **C** | `src/components/workspaces/Share/CreateWorkspaceDialog.tsx` | Modal de creación. Usa `<dialog>` HTML nativo o componente Modal existente de Conniku (verificar si existe uno reutilizable — si no, crear uno mínimo en este directorio). |
| **C** | `src/components/workspaces/WorkspaceCard.tsx` | Card reutilizable para la lista: muestra título, curso, avatares de miembros, fecha última modificación. |
| **C** | `src/components/workspaces/__tests__/LexicalEditor.test.tsx` | Test del editor: smoke test de render, typing, toolbar bold clicable. |
| **C** | `src/services/workspacesApi.ts` | Cliente HTTP: funciones `listWorkspaces()`, `createWorkspace(data)`, `getWorkspace(id)`, `updateWorkspace(id, patch)`, `deleteWorkspace(id)`, `addMember(id, userId, role)`, `removeMember(id, userId)`, `listVersions(id)`, `createVersion(id, content, label)`, `validateInviteToken(token)`, `acceptInvite(token)`. Usa el mismo wrapper `apiFetch` que los otros servicios. |
| **C** | `src/services/__tests__/workspacesApi.test.ts` | Tests del cliente HTTP con `vi.mock` sobre fetch. |
| **M** | `src/App.tsx` | **4 líneas añadidas**: 1 línea cada uno de los 4 lazy imports de las 4 páginas nuevas (WorkspacesList, WorkspaceEditor, WorkspaceSettings, WorkspaceInviteAccept), y 4 líneas de `<Route>` nuevas. Total ~8 líneas. El plan maestro decía "más de 10 líneas → PAUSA". 8 líneas está dentro. |
| **M** | `src/components/Sidebar.tsx` | **2 cambios mínimos**: (a) comentar el bloque `<button>` V1 (líneas 423-428) con comentario explicativo "V1 oculto 2026-04-18, reemplazado por Workspaces". Accesible por URL directa. (b) Agregar un bloque `<button>` nuevo "Workspaces" apuntando a `/workspaces` con icono `FilePen`. Total: ~8 líneas nuevas + 6 líneas comentadas. Dentro del límite de 10 líneas. |
| **C** | `src/__tests__/workspaces/routing.test.tsx` | Test de routing: rutas `/workspaces`, `/workspaces/:id`, `/workspaces/:id/settings`, `/workspaces/invite/:token` se resuelven a las páginas correctas. |

### 3.3 Shared

| Acción | Ruta | Qué se hace |
|---|---|---|
| **C** | `shared/workspaces-types.ts` | Tipos TS: `Workspace`, `WorkspaceMember`, `WorkspaceVersion`, `MemberRole = 'owner' \| 'editor' \| 'viewer'`, `ApaEdition = '7' \| '6' \| 'ieee' \| 'chicago' \| 'mla'`. Importado desde `workspacesApi.ts` y desde las páginas. No se importa desde backend (Python no lee TS). |

### 3.4 package.json — REQUIERE UNFREEZE PREVIO

**Bloqueador** antes de arrancar Capa 1 de 2a: `package.json` está en
`FROZEN.md` (sección `lint-staged config` confirmada 2026-04-14).
Se requiere `/unfreeze package.json` explícito de Cristian antes de
que el frontend-builder agregue dependencias.

**Dependencias a añadir** (9 paquetes):
```json
"lexical": "^0.21.0",
"@lexical/react": "^0.21.0",
"@lexical/rich-text": "^0.21.0",
"@lexical/list": "^0.21.0",
"@lexical/link": "^0.21.0",
"@lexical/selection": "^0.21.0",
"@lexical/utils": "^0.21.0",
"@lexical/history": "^0.21.0",
"@lexical/markdown": "^0.21.0"
```

(`@lexical/markdown` es opcional en 2a, útil para import/export
markdown a futuro. Se incluye ahora para evitar `npm install` adicional
en sub-bloques posteriores.)

**Estrategia si Cristian no autoriza `/unfreeze` al volver**:
frontend-builder puede ejecutar todos los tests/mocks con los tipos
definidos pero el build real fallará por falta de deps. En ese caso,
la Capa 5 cierra con "bloqueado por unfreeze pendiente" y Cristian
resuelve al despertar. Esta restricción se documenta en `docs/sessions/
2026-04-18-avance-nocturno.md` al inicio del 2a.

**Nota complementaria**: el hook `check-frozen.sh` bloqueará
mecánicamente el edit a `package.json`. No es una regla blanda. Tori
**no puede saltarse el bloqueo** aunque el prompt lo sugiera (regla
CLAUDE.md §"Capas mecánicas que no puedes esquivar").

### 3.5 Archivos prohibidos (NO se tocan)

Confirmado por cruce con plan maestro §8 y FROZEN.md:
- `src/pages/GroupDocs.tsx`, `src/pages/GroupDocEditor.tsx`,
  `src/components/CollabEditor.tsx`, `backend/collab_routes.py`,
  `backend/collab_ws.py` — V1 escondido pero intacto.
- MiUniversidad, Profile, StudyPaths, StudyRooms, Dashboard, Friends,
  Communities, Messages, Mentorship, Conferences, Jobs.
- `src/admin/**`, páginas Admin/HR/CEO.
- `backend/auth_routes.py`, `backend/hr_routes.py` (FROZEN),
  `backend/ai_engine.py`, `backend/konni_engine.py`.
- `CLAUDE.md`.
- `backend/hr_routes.py`, `shared/legal_texts.py`, `shared/legal_texts.ts`,
  `.gitignore`, `.husky/pre-commit`, `scripts/verify-legal-texts-sync.sh`,
  `src/admin/tools/BibliotecaDocumentos.tsx`,
  `src/pages/HRDashboard.tsx`, y los 9 archivos de null-safety del
  2026-04-14 (FROZEN).

---

## 4. Plan TDD

El plan maestro § protocolo exige **TDD RED→GREEN→REFACTOR**. Orden:

### 4.1 Fase 1 — Backend modelos (backend-builder)

**RED-1**: escribir `test_workspaces_models.py`.
- Test: `test_workspace_document_can_be_created_with_minimal_fields`
  → crea un `WorkspaceDocument` con solo `title` y `owner_id`,
  verifica que `id` se genera, `apa_edition == "7"`, `is_completed
  == False`, `options == "{}"`.
- Test: `test_workspace_member_foreign_keys_valid` → intenta insertar
  `WorkspaceMember` con `workspace_id` inexistente, espera fallo.
- Test: `test_workspace_document_share_link_token_unique` → inserta 2
  docs con mismo token, espera IntegrityError.
- 12 tests más (uno por modelo + relaciones).
- Ejecutar `pytest backend/tests/test_workspaces_models.py` → todos
  fallan por `ImportError` (modelos no existen).

**GREEN-1**: agregar los 8 modelos a `backend/database.py` al final.
Ejecutar tests → deben pasar.

**REFACTOR-1**: extraer constantes comunes si aparece duplicación. No
tocar nada fuera de los 8 modelos nuevos.

### 4.2 Fase 2 — Backend migraciones (backend-builder)

**RED-2**: escribir `test_workspaces_migration.py`.
- Test: `test_migrate_creates_8_workspace_tables` → usa engine
  en-memoria, ejecuta `migrate()`, verifica
  `inspector.has_table("workspace_documents")` etc. para los 8.
- Test: `test_migrate_is_idempotent` → ejecuta `migrate()` 2 veces,
  no hay excepción, conteo de tablas no cambia.
- Test: `test_migrate_skips_if_tables_exist` → pre-crea tablas, corre
  `migrate()`, no hay error.
- Ejecutar → falla porque `migrate()` no conoce las tablas nuevas.

**GREEN-2**: agregar bloque al final de `migrate()` en
`backend/migrations.py` con 8 `if not inspector.has_table(...)`
guards + DDL inline. Crear archivo espejo
`backend/migrations/add_workspaces_tables.sql` con el mismo DDL.
Ejecutar tests → pasan.

**REFACTOR-2**: si los 8 bloques DDL tienen mucha repetición,
considerar extracción a helper. **Pero**: el patrón existente de
`migrations.py` no usa helpers (es DDL repetido tabla por tabla).
Respetar el estilo existente. No refactorizar a menos que el code-
reviewer lo exija en Capa 2.

### 4.3 Fase 3 — Backend rutas CRUD (backend-builder)

**RED-3**: escribir `test_workspaces_routes_crud.py` con TestClient.
- 18 tests según sección 3.1. Ej:
  - `test_post_workspaces_returns_201_with_id`
  - `test_get_workspaces_excludes_other_users_workspaces`
  - `test_patch_workspace_title_only_by_owner_or_editor`
  - `test_delete_workspace_only_by_owner`
  - `test_add_member_creates_row_with_role`
  - `test_remove_owner_fails_with_403`
  - `test_get_nonexistent_workspace_returns_404`
  - `test_invite_token_validation_returns_metadata`
- Ejecutar → falla porque endpoints no existen.

**GREEN-3**: crear `backend/workspaces_routes.py` con los endpoints
mínimos. Usar `Depends(get_current_user)` y `Depends(get_db)`.
Validación con Pydantic models inline. Respuestas JSON con shape
consistente (`{"workspace": {...}, "members": [...]}` o estilo
`{"id": ..., "title": ...}` según endpoint).

Agregar a `backend/server.py`:
- Línea de import: `from workspaces_routes import router as
  workspaces_router`
- Línea de include: `app.include_router(workspaces_router)`

Ejecutar tests → pasan.

**REFACTOR-3**: agrupar validaciones en helpers si hay duplicación.
Mantener el archivo <600 líneas (regla del proyecto para rutas
modulares).

### 4.4 Fase 4 — Frontend servicio API (frontend-builder)

**RED-4**: escribir `src/services/__tests__/workspacesApi.test.ts`.
- Test: `listWorkspaces mocks fetch y parsea JSON`.
- Test: `createWorkspace envía POST con body correcto`.
- Test: `getWorkspace maneja 404`.
- Test: `validateInviteToken retorna metadata`.
- Ejecutar → falla.

**GREEN-4**: crear `src/services/workspacesApi.ts` con funciones
async que usan el wrapper `apiFetch` estándar. Usar tipos de
`shared/workspaces-types.ts`.

**REFACTOR-4**: extraer helper común si emergen patrones.

### 4.5 Fase 5 — Frontend editor Lexical (frontend-builder)

**RED-5**: escribir `LexicalEditor.test.tsx`.
- Test: `editor renders empty state`.
- Test: `typing updates editor state via onChange`.
- Test: `toolbar bold button exists`.
- Test: `theme classes applied to root`.
- Ejecutar → falla.

**GREEN-5**: crear `LexicalEditor.tsx`, `Toolbar.tsx`,
`editorConfig.ts`, `editorTheme.ts`. Tests pasan.

**REFACTOR-5**: extraer botón de toolbar a componente reutilizable si
son >3 con lógica similar.

### 4.6 Fase 6 — Frontend páginas y layout (frontend-builder)

**RED-6**: escribir tests de las 4 páginas (solo smoke + flujos
clave, no UI exhaustiva).

**GREEN-6**: crear las 4 páginas + `ThreeZoneLayout.tsx` +
`CreateWorkspaceDialog.tsx` + `WorkspaceCard.tsx`.

**REFACTOR-6**: consolidar estilos CSS si hay duplicación. Usar CSS
vars de Conniku (`--bg-primary`, etc.) — NO colores hardcoded.

### 4.7 Fase 7 — Routing + Sidebar (frontend-builder)

**RED-7**: escribir `src/__tests__/workspaces/routing.test.tsx`
con `MemoryRouter` validando las 4 rutas.

**GREEN-7**: modificar `src/App.tsx` (4 lazy imports + 4 rutas).
Modificar `src/components/Sidebar.tsx` (comentar V1 + agregar
Workspaces).

**REFACTOR-7**: ninguno previsto.

### 4.8 Verificación final (frontend-builder + backend-builder)

Cada builder corre su suite completa antes de reportar:

Backend:
```
cd backend && ruff check . && ruff format --check . &&
mypy --ignore-missing-imports workspaces_routes.py database.py
migrations.py && pytest backend/tests/test_workspaces_*.py -v
```

Frontend:
```
npm run lint && npm run typecheck && npm test -- workspaces &&
npm run build
```

Evidencia (output literal) se adjunta al reporte del builder (regla
MEMORY.md "REGLA EVIDENCIA OBLIGATORIA").

---

## 5. Riesgos

### 5.1 Riesgo alto — FROZEN package.json bloquea Lexical
**Descripción**: `package.json` está congelado. Instalar Lexical
requiere `/unfreeze` explícito. Si Cristian no lo autoriza antes de
iniciar 2a, el frontend-builder no puede correr `npm install` y toda
la Fase 5-7 queda bloqueada. Solo backend (Fases 1-3) avanza.
**Mitigación**: documentar este bloqueador **en la primera línea del
reporte nocturno** antes de empezar, y solicitar a Cristian (vía nota)
que deje el `/unfreeze package.json` autorizado antes de dormir. Si no
hay autorización, proceder con backend + tipos TS + tests mockeados,
y cerrar Capa 5 del 2a con estatus "parcialmente bloqueado, frontend
pendiente de unfreeze". Cristian resuelve al despertar.

### 5.2 Riesgo alto — server.py prohibido modificar
**Descripción**: el plan maestro §9 dice explícitamente "prohibido
modificar más de 1 línea" de `server.py`. El plan de 2a requiere 2
líneas (1 import + 1 `include_router`). Si Cristian interpreta
estrictamente la regla como "1 línea literal", se bloquea el registro
del router. Sin `include_router`, los endpoints no existen y los tests
de rutas fallan.
**Mitigación**: (a) documentar la interpretación explícita aquí:
agregar un import + un include_router es el contrato estándar y no
viola la esencia de la regla (que es "no tocar la lógica de boot ni
los middlewares"). (b) Si Cristian no está de acuerdo, hay plan-B:
crear un archivo `backend/workspaces_server_patch.py` que exporta una
función `register_workspaces(app)` y llamarla con **1 sola línea** en
server.py: `from workspaces_server_patch import register_workspaces;
register_workspaces(app)`. Feo pero cumple. Pausar y preguntar si
falla la interpretación.

### 5.3 Riesgo medio — Lexical curva de aprendizaje
**Descripción**: Lexical es relativamente nuevo, API cambia entre
versiones, algunos plugins tienen conflictos sutiles. Un bug típico:
`HistoryPlugin` antes de `RichTextPlugin` rompe undo. Debug es opaco.
**Mitigación**: (a) usar versiones exactas documentadas (`^0.21.0`);
(b) el frontend-builder sigue la plantilla oficial de `@lexical/react`
README; (c) si hay bug no resuelto en 30min, fallback a un editor
ultra-mínimo con solo `RichTextPlugin` y `HistoryPlugin` para no
bloquear 2a. El resto se suma en 2b cuando ya haya familiaridad. (d)
tests usan snapshot de editor state, no interacción compleja.

### 5.4 Riesgo medio — migrations.py crece y se vuelve ilegible
**Descripción**: `migrations.py` ya tiene 386 líneas. Añadir 8
`CREATE TABLE` inline agrega ~150 líneas más. Se vuelve difícil de
auditar.
**Mitigación**: (a) agrupar los 8 bloques al final del archivo con
separador visual `# ──── Bloque 2a Workspaces ────`; (b) considerar
extraer a función privada `_migrate_workspaces_tables(inspector,
engine)` invocada desde `migrate()`. Esto reduce el tamaño aparente y
sigue la estructura modular del proyecto. Si el code-reviewer pide
extracción, se hace en Capa 2.

### 5.5 Riesgo medio — Sidebar V1 "oculto" genera confusión de usuario
**Descripción**: la Opción B (decisión D1) deja `/group-docs` vivo
por URL directa. Si un usuario tiene link viejo en un email y lo
abre, ve el V1 sin saber que ya existe V2. Inconsistencia de UX.
**Mitigación**: (a) en el `GroupDocs.tsx` original NO se toca nada
(es prohibido), pero se puede agregar en la capa de `/group-docs/*` en
App.tsx un **banner persistente superior** que diga "Este módulo fue
reemplazado por Workspaces. [Ir a Workspaces]". Eso toca App.tsx
agregando un wrapper, lo cual son 3-5 líneas extra. **Decisión
pragmática**: NO implementar el banner en 2a (agrega complejidad). Se
documenta como deuda y se decide al cerrar Bloque 2 completo si
borrar V1 o agregar banner.

### 5.6 Riesgo medio — Athena_usage tabla creada pero sin uso en 2a
**Descripción**: el modelo `AthenaUsage` se crea en 2a porque el plan
maestro lo pide ("modelos BD 8 nuevos"), pero su uso real es en 2c. Un
code-reviewer puede marcar "tabla creada sin consumer" como code
smell.
**Mitigación**: (a) documentar en docstring del modelo: `"""Tabla
creada en bloque 2a. Consumida desde bloque 2c (Athena IA). Ver
docs/plans/bloque-2-workspaces/plan-maestro.md §4."""`; (b)
truth-auditor valida que el test de migración la crea pero no espera
interacción; (c) si code-reviewer lo marca como bloqueante, mover
creación a 2c. **Recomendación**: mantener en 2a porque el plan
maestro lo dice explícitamente y es cheaper crear 8 tablas en una
migración que 6 ahora + 2 después.

### 5.7 Riesgo bajo — Layout 3 zonas rompe en móvil
**Descripción**: CSS Grid con 3 zonas puede colapsar mal en viewport
<768px.
**Mitigación**: el CSS incluye media queries desde el inicio (al
`ThreeZoneLayout.tsx`). En <1024px, zonas 2-3 pasan a tabs. En
<768px, zona 1 ocupa todo el viewport y zonas 2-3 son botones
flotantes. Test visual manual en Capa 6 por Cristian.

### 5.8 Riesgo bajo — Colisión entre test runner Python y Node
**Descripción**: `pytest` y `vitest` corren en procesos separados
pero ambos usan base SQLite en disco por default. Posible race
condition.
**Mitigación**: los tests backend usan `sqlite:///:memory:` (ya es el
default en el proyecto para pytest). Los tests frontend no tocan BD.
Cero colisión posible.

### 5.9 Riesgo bajo — Token de invitación sin algoritmo definido
**Descripción**: `share_link_token` es `String(32) unique`. 2a crea
scaffolding del endpoint `GET /workspaces/invite/:token` pero no
implementa el algoritmo de generación ni expiración.
**Mitigación**: en 2a, `POST /workspaces/:id/members/invite` NO se
implementa (es 2d). El token se genera solo cuando el owner crea
una invitación explícita, lo cual es funcionalidad 2d. En 2a, la
columna existe, el endpoint `GET /workspaces/invite/:token` busca
en la BD y retorna 404 si no existe. No hay riesgo de seguridad
porque no hay generación activa.

---

## 6. Criterio de terminado (checklist binaria)

### 6.1 Backend
- [ ] 8 modelos agregados a `backend/database.py` con defaults
      correctos.
- [ ] `backend/migrations.py` crea las 8 tablas en SQLite e idempotente
      en 2ª ejecución.
- [ ] `backend/migrations/add_workspaces_tables.sql` existe como
      espejo histórico (DDL equivalente).
- [ ] `backend/workspaces_routes.py` implementa los 11 endpoints
      listados.
- [ ] `backend/server.py` tiene exactamente 1 import nuevo + 1
      `include_router` nuevo (2 líneas totales).
- [ ] `pytest backend/tests/test_workspaces_*.py` pasa 100%
      (~36 tests).
- [ ] `ruff check backend/workspaces_routes.py backend/database.py
      backend/migrations.py` sin errores.
- [ ] `ruff format --check` limpio.

### 6.2 Frontend
- [ ] 4 páginas creadas en `src/pages/Workspaces/`.
- [ ] `LexicalEditor.tsx` con 7 plugins básicos funcionando.
- [ ] `ThreeZoneLayout.tsx` con zona 1 funcional + 2 placeholders.
- [ ] `workspacesApi.ts` con 11 funciones exportadas.
- [ ] `src/App.tsx` tiene 4 rutas nuevas.
- [ ] `src/components/Sidebar.tsx` tiene link "Workspaces" con
      `FilePen` icon, y el V1 comentado.
- [ ] `shared/workspaces-types.ts` con tipos compartidos.
- [ ] `npm run lint` sin errores.
- [ ] `npm run typecheck` sin errores.
- [ ] `npm test -- workspaces` pasa 100%.
- [ ] `npm run build` genera bundle sin errores.

### 6.3 Verificación funcional manual (Tori en Capa 5 gap-finder)
- [ ] Navegar a `/workspaces` muestra lista (vacía para usuario nuevo).
- [ ] Botón "Nuevo workspace" abre dialog.
- [ ] Crear workspace con título "Test 2a" redirige a
      `/workspaces/{id}`.
- [ ] Editor Lexical acepta texto y aplica bold.
- [ ] Refresh de página preserva título y contenido básico.
- [ ] Navegar a `/workspaces/{id}/settings` muestra metadata + lista
      de miembros.
- [ ] Navegar a `/workspaces/invite/{token}` con token inválido
      muestra "Invitación inválida".
- [ ] Sidebar muestra "Workspaces" y NO muestra "Trabajos Grupales".
- [ ] Navegar manualmente a `/group-docs` muestra V1 funcional
      (regresión: no debe estar roto).

### 6.4 Verificación de protocolo
- [ ] Branch `bloque-2a-fundacion` creada desde `main`.
- [ ] Commits atómicos por fase (mínimo 7: migrations models, migrations
      sql, routes, api client, editor, layout+pages, routing+sidebar).
- [ ] PR abierto contra `main` con descripción + link a este plan.
- [ ] Reporte del backend-builder en `docs/reports/2026-04-18-HHMM-
      backend-builder-workspaces-2a.md`.
- [ ] Reporte del frontend-builder en idem frontend.
- [ ] Reporte code-reviewer con quality score.
- [ ] Reporte truth-auditor con quality score.
- [ ] Reporte gap-finder con análisis estructural.

---

## 7. Fuera de scope

Explícitamente **NO** se implementa en 2a (queda para 2b/2c/2d):

### 2b (colaboración real-time + chat grupal)
- Yjs + `@lexical/yjs` CollaborationPlugin
- WebSocket relay `backend/workspaces_ws.py`
- Auto-save cada 2s con indicador visual
- Author colors palette determinística
- Contribution metrics (barra %)
- Chat del grupo backend + frontend
- Cursor presence / multi-user cursors

### 2c (Athena IA)
- `backend/workspaces_athena.py`
- Prompt Athena, endpoint de análisis/chat/sugerencia
- Staging buffer privado con flujo apply/modify/reject
- Modal upgrade al agotar cupo
- Rate limiting por plan (Free/Conniku Pro)
- Tabla `athena_usage` se **crea en 2a** pero no se escribe hasta 2c
- Prompt "sin mencionar IA" (regla CLAUDE.md) se auditará en 2c

### 2d (features avanzadas)
- APA 7 validación + formateo + citas + referencias
- Sistema extensible IEEE/Chicago/MLA
- TOC automático (`TOCPlugin.tsx`)
- Tapa personalizable (`CoverPlugin.tsx` + plantillas)
- Matemáticas (KaTeX + MathLive + SymPy backend + gráficos)
- Rúbrica upload/parser/checklist
- Comentarios inline + threads
- Menciones @usuario
- Export PDF/DOCX con SSRF fix
- Compartir URL con invitación (generación de tokens + roles)
- Plantillas de documento
- Modo enfoque
- Atajos de teclado completos + overlay `?`
- Modo presentación
- Dictado por voz (STT) + TTS
- Arrastrar archivos al doc
- Voice notes embebidas
- Imprimir / Duplicar / Star / Búsqueda global
- Mockups HTML del Frontend Design skill (se delega a 2d en fase
  diseño-final; en 2a el CSS es utilitario simple)

### Fuera del Bloque 2 completo
- Integración con Biblioteca de Conniku
- Collaborative whiteboard
- Integración con calendario (task lists sincronizadas)
- Migración de datos del V1 al V2 (decisión A3: V2 empieza vacío)
- Borrado definitivo del V1 (decisión A1: aplazada)

---

## 8. Componente legal

**¿2a tiene componente legal?** Parcial. Se crean columnas que
**habilitarán** funcionalidad legal en sub-bloques posteriores
(`apa_edition`, `rubric_raw`, `options` para consentimientos de
compartir), pero 2a no implementa flujos legales reales.

**Normas citadas en 2a**: ninguna directamente.

**Documentos legales a actualizar**: ninguno en 2a. El
`legal-docs-keeper` queda en standby para este sub-bloque. Se le
convocará en 2d cuando:
- La función de compartir por URL pública entre en vigor
  (implicaciones de privacidad)
- La rúbrica cargada por el usuario entre en vigor (Ley 19.628
  sobre datos personales si la rúbrica contiene datos de alumnos)
- El export PDF entre en vigor (consideraciones de huella digital si
  se embeben metadatos)

**Decisión**: el flujo reforzado de componente legal CLAUDE.md § no
aplica en 2a. Flujo estándar 7 capas sin legal-docs-keeper activo.

---

## 9. Reporte obligatorio del agente (plantilla)

El builder debe cerrar su turno con estas 4 secciones. El web-
architect (este documento) cierra también:

### 9.1 Lo que se me pidió
Cita literal de la instrucción de Cristian:
> "Produce el plan detallado del sub-bloque 2a Fundación del Bloque 2
> Workspaces. Cristian duerme, trabajo en autónomo con autorización
> explícita. [...] Un archivo markdown en
> /Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/
> 2a-fundacion.md."

### 9.2 Lo que efectivamente hice
- Leí plan maestro completo (455 líneas,
  `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/
  plan-maestro.md`).
- Leí tracker nocturno (24 líneas,
  `/Users/cristiang./CONNIKU/docs/sessions/
  2026-04-18-avance-nocturno.md`).
- Leí FROZEN.md (35 líneas) y `.claude/frozen-files.txt` (36 líneas)
  para confirmar qué archivos están congelados.
- Leí `backend/database.py` header (100 líneas) + cola (2020-2022)
  para confirmar patrón de modelos y ubicación de inserción.
- Leí `backend/migrations.py` (líneas 1-190) para confirmar patrón
  `inspector.has_table` + DDL inline.
- Leí `backend/server.py` (líneas 1-80 y 263-307) para identificar
  sección de `include_router`.
- Greppé `src/App.tsx` para identificar lazy imports (líneas 29-100)
  y rutas V1 (líneas 806-811).
- Greppé `src/components/Sidebar.tsx` para identificar link V1
  (líneas 423-428).
- Listé `backend/migrations/` y confirmé que hay 2 archivos `.sql`
  históricos pero NO son invocados desde `migrations.py`.
- Leí `backend/migrations/add_user_agreements_table.sql` como
  plantilla de referencia.
- Produje este documento (`2a-fundacion.md`) en
  `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/
  2a-fundacion.md`.

### 9.3 Lo que no hice y por qué
- **No escribí código de producto**: es tarea de
  `backend-builder` y `frontend-builder` en Capa 1. Mi rol es
  planificación.
- **No ejecuté ningún comando git**: `cerrar-bloque` y `merge` son
  Capa 7, las hace Cristian al despertar.
- **No generé mockups HTML** (que el plan maestro §11 menciona como
  "mínimo aceptable nocturno"): se delega al Frontend Design skill
  en una subtask posterior. El plan 2a ya describe lo suficiente
  para que los builders avancen en CSS utilitario; los mockups
  premium vienen en 2d fase diseño-final.
- **No resolví si `/unfreeze package.json` está autorizado**:
  Cristian no lo menciona explícitamente en la autorización
  nocturna. Se marca como **bloqueador real** en sección 5.1. Tori
  debe pausar la Capa 1 frontend hasta aclararlo. Ver §3.4.
- **No decidí si la "regla 1 línea server.py" es literal o
  estricta**: se dejó interpretación razonada en §5.2 con plan-B.
  Queda a decisión de Cristian o del code-reviewer.
- **No expandí el plan a 2b/2c/2d**: scope explícito de la tarea fue
  solo 2a.

### 9.4 Incertidumbres
- **Incertidumbre principal**: el plan asume que
  `shared/workspaces-types.ts` es aceptable como ubicación para
  tipos compartidos. No verifiqué si `shared/` tiene convención de
  naming kebab-case vs camelCase. El archivo existente
  `shared/legal_texts.ts` usa snake_case, lo cual es inconsistente
  con `kebab-case` común en frontend. Podría ser `shared/
  workspaces_types.ts` en su lugar. El builder debe verificar
  convención al crear el archivo.
- **Incertidumbre secundaria**: el campo `options = Column(Text,
  default="{}")` de `WorkspaceDocument` usa `Text` para guardar JSON.
  SQLAlchemy recomienda `JSON` nativo para PostgreSQL. El proyecto
  Conniku usa SQLite en local + PostgreSQL en producción. Usar `JSON`
  nativo rompería SQLite. Mantener `Text` con parse/serialize manual
  es más portable pero menos elegante. El plan maestro §4 ya usa
  `Text`. Respetado, pero señalado como deuda técnica para 2d.
- **Incertidumbre de integración**: no verifiqué que el wrapper
  `apiFetch` usado en otros servicios tenga la misma firma que
  necesito. Puede ser que `apiFetch(url, options)` o
  `apiFetch({url, method, body})`. Frontend-builder debe leer un
  servicio existente (ej. `src/services/collabApi.ts` si existe, o
  `src/services/friendsApi.ts`) antes de escribir el cliente.
- **Incertidumbre de testing**: `vitest` + Lexical en jsdom tiene
  issues documentados con `Selection` API. Los tests podrían
  requerir `@testing-library/user-event` con setup especial o
  mockear `window.getSelection`. No confirmé que la infra de tests
  del proyecto ya soporte esto. Si no, frontend-builder pausa y
  agrega setup en la misma fase.
- **Incertidumbre sobre invite token**: asumo que el endpoint `GET
  /workspaces/invite/:token` debe ser **público** (sin auth) porque
  un invitado podría no tener sesión. Pero el plan maestro no
  aclara. Alternativamente, podría redirigir a login primero.
  Decisión razonable: endpoint público, responde metadata mínima
  (título + nombre del owner + rol propuesto). Si el invitado no
  está autenticado, el frontend lo manda a login con `?redirect=
  /workspaces/invite/:token`. Frontend-builder valida este flujo
  al implementar.

---

**Estado del plan**: listo para aprobación de Cristian al despertar.

**Próxima acción**: en cuanto Cristian dé OK (o si Tori sigue en
autónomo con autorización nocturna, según §avance-nocturno línea 6),
web-architect invoca a backend-builder y frontend-builder en paralelo
para Capa 1 con este plan como input. Antes de invocar frontend-
builder, confirmar que `/unfreeze package.json` está activo; si no,
pausa y registra en tracker nocturno.
