# Plan detallado — Sub-bloque 2b Colaboración real-time + Chat grupal

**Proyecto**: Conniku — Bloque 2 Workspaces
**Autor**: Tori (web-architect) — redactado 2026-04-18
**Referencia**: `docs/plans/bloque-2-workspaces/plan-maestro.md` §5 y
`docs/plans/bloque-2-workspaces/2a-fundacion.md` (cerrado)
**Componente legal**: no directo. 2b transporta texto libre del chat
grupal entre miembros autenticados del workspace. No hay datos de
menores, ni datos tributarios, ni PCI. Mantener fuera del flujo legal
reforzado.
**Protocolo**: 7 capas estándar. Tori ejecuta 0-5, Cristian valida 6-7.

---

## 1. Contexto

### 1.1 De dónde venimos (2a cerrado)

2a dejó en main:

- 8 modelos BD (incluye `WorkspaceMessage` **ya creada** en
  `backend/database.py:1928-1942`, con el docstring "Tabla creada en
  bloque 2a. Endpoints de chat implementados en bloque 2b."). No hay
  migración pendiente.
- `backend/workspaces_routes.py` con 14 endpoints REST (CRUD, miembros,
  versiones, invite). **No incluye endpoints de chat ni WebSocket.**
- Editor Lexical puro, sin Yjs: `LexicalEditor.tsx` monta
  `RichTextPlugin + HistoryPlugin + ListPlugin + LinkPlugin +
  OnChangePlugin + AutoFocusPlugin`. El `OnChangePlugin` actualmente
  solo marca `saveStatus='unsaved'` en `WorkspaceEditor.tsx:45-48`.
- `ThreeZoneLayout.tsx` con 3 zonas: izquierda (TOC/Colaboradores/
  Rúbrica placeholders), central (editor), derecha (2 placeholders
  "Borrador privado" + "Chat del grupo" con `aria-disabled="true"`,
  líneas 93-115).
- `authorColors.ts` con paleta determinística de 20 colores + función
  `getAuthorColor(userId)` ya testeada en 2a. **Se reutiliza tal cual,
  no se duplica.**
- `workspacesApi.ts` con 14 funciones HTTP (sin chat, sin WS).
- Saving UI en `WorkspaceEditor.tsx:130-134`: tres estados `saved /
  saving / unsaved` ya renderizados en topbar. Falta el timer de 2s
  y el disparo real.
- V1 `backend/collab_ws.py` intacto (referencia, NO se toca): relay
  binario Yjs + awareness JSON + auth por `?token=JWT` query. Patrón
  que 2b replica adaptado al namespace `/workspaces`.

### 1.2 Hallazgos clave del código existente

1. **`@lexical/yjs` NO está en `package.json`.** Las deps `yjs
   ^13.6.30`, `y-websocket ^3.0.0` y `y-prosemirror ^1.3.7` sí, pero
   el binding oficial para Lexical (`@lexical/yjs`) falta. Se requiere
   agregar `@lexical/yjs@^0.21.0` (misma versión que el resto del
   ecosistema Lexical ya instalado). **Bloqueador**: `package.json`
   sigue FROZEN desde 2026-04-14 → se requiere `/unfreeze package.json`
   explícito de Cristian antes de la Capa 1 frontend. Sin eso, el
   frontend no arranca.
2. El V1 `backend/collab_ws.py` usa `WebSocketState`, `receive()` con
   rama `"bytes"` vs `"text"`, relay binario para sync, JSON para
   presence. Patrón validado en producción. 2b lo replica adaptado a
   Workspaces, **archivo nuevo** `backend/workspaces_ws.py`, el V1 no
   se toca.
3. `backend/websocket_manager.py` expone `chat_manager.authenticate
   (ws, token)` que decodifica JWT y valida `type=access`. Es el
   helper canónico — `workspaces_ws.py` debe usarlo igual que el V1.
4. Los tests de `routes_crud` del 2a usan
   `pytest.importorskip("fastapi")` + `pytest.importorskip("httpx")`
   para saltar en local sin deps. Patrón que replicamos en
   `test_workspaces_ws.py` con `pytest.importorskip("websockets")`.
5. `WorkspaceMember.chars_contributed` ya existe como columna Integer
   default 0 en 2a. No requiere migración.
6. `WorkspaceDocument.content_yjs` es `Text nullable=True`. Los
   snapshots Yjs en base64 caben. No cambia schema.

### 1.2.1 Decisiones consolidadas con Cristian (2026-04-18)

Respondidas por Cristian tras revisar este plan. Son la fuente de
verdad para Capa 1; cualquier conflicto con el resto del documento se
resuelve a favor de esta subsección.

| # | Pregunta | Elegida | Implicación |
|---|---|---|---|
| 1 | Snapshot Yjs al conectar al WS | **Pass-through simple** (base64 opaco, sin parseo server-side con `ypy`) | `workspaces_ws.py` carga `content_yjs` como string base64 y lo envía al cliente como primer mensaje binario sin decodificar. ~50 LOC. |
| 2 | Política chat grupal ante nuevos miembros | **Historia completa visible** | `GET /workspaces/{id}/chat/messages` retorna todo el historial sin filtrar por `joined_at`. No se añade campo de corte. |
| 3 | Persistencia offline | **CON `y-indexeddb`** (offline-first real) | Se añade la dep `y-indexeddb` al `package.json` junto con `@lexical/yjs`. El wrapper `yjsProvider.ts` instancia `IndexeddbPersistence(docId, ydoc)` en paralelo al `WebsocketProvider`. Ver §3.4 y §5.3 actualizados. |
| 4 | Regla "1 línea en `server.py`" | **2 líneas por sub-bloque OK** (import + include_router) | Se mantiene la práctica del 2a. No se fuerza consolidación en router agregador. |

### 1.3 Archivos leídos para planificar (evidencia)

- `docs/plans/bloque-2-workspaces/plan-maestro.md` (477 líneas)
- `docs/plans/bloque-2-workspaces/2a-fundacion.md` (855 líneas)
- `docs/sessions/2026-04-18-sub-bloque-2a-cerrado.md` (150 líneas)
- `backend/workspaces_routes.py` (649 líneas completas)
- `backend/collab_ws.py` (190 líneas, referencia V1 — prohibido tocar)
- `backend/database.py` líneas 1920-1995 (modelos 2a)
- `backend/tests/test_workspaces_routes_crud.py` primeras 50 líneas
- `src/components/workspaces/Editor/LexicalEditor.tsx`
- `src/components/workspaces/Editor/editorConfig.ts`
- `src/components/workspaces/Layout/ThreeZoneLayout.tsx`
- `src/components/workspaces/authorColors.ts`
- `src/services/workspacesApi.ts`
- `src/services/websocket.ts` (primeras 40 líneas — patrón de reconnect
  del servicio de chat general, referencia para `yjsProvider`)
- `src/pages/Workspaces/WorkspaceEditor.tsx` (154 líneas)
- `FROZEN.md` y `.claude/frozen-files.txt` — confirma que
  `package.json` está congelado.
- `package.json` líneas 55-105 — confirma presencia de `yjs`,
  `y-websocket`, ausencia de `@lexical/yjs`.

---

## 2. Decisiones de diseño del 2b

### 2.1 Decisión D1 — Endpoint URL del WebSocket

**Opciones consideradas**:
- **A**: `/workspaces/ws/{doc_id}` — namespace consistente con el
  router REST (`/workspaces`), permite agrupar docs/filtros de CORS
  por prefijo.
- **B**: `/ws/workspaces/{doc_id}` — simétrico al V1 `/ws/doc/{doc_id}`,
  agrupa todos los websockets bajo `/ws`.
- **C**: `/workspaces/{doc_id}/ws` — dentro del recurso, muy REST.

**Criterios**: consistencia con el módulo, facilidad de routing,
separación del V1, legibilidad en logs.

**Decisión elegida**: **Opción A — `/workspaces/ws/{doc_id}`**.

**Razonamiento**: coincide con el request explícito de Cristian en el
scope. Mantiene todo lo del módulo bajo `/workspaces/*` (consistente
con el router REST del 2a). Separa netamente del V1 (`/ws/doc/{doc_id}`)
— cero colisión. La Opción C mezcla recurso REST con canal WS en la
misma URL, lo cual puede confundir en docs OpenAPI. La B fragmenta el
namespace del módulo.

**Contrato**: `ws://.../workspaces/ws/{doc_id}?token=JWT_ACCESS`.

### 2.2 Decisión D2 — Provider Yjs en el frontend

**Opciones**:
- **A**: `y-websocket` directo (ya en deps) — instanciar
  `WebsocketProvider` con `url`, `room=doc_id`, `ydoc`, `params:
  {token}` desde cada componente que lo use.
- **B**: Wrapper propio `services/yjsProvider.ts` que encapsula el
  `WebsocketProvider` con configuración de reconnect, auth, awareness
  + state user (name, color, avatar), y expone una interfaz
  `createWorkspaceProvider(docId): {provider, ydoc, awareness,
  destroy}`.

**Criterios**:
- Reutilización: el provider se usa desde `LexicalEditor` (doc),
  `GroupChat` (awareness/presence compartido), futuros módulos.
- Single point of auth: manejo de token expirado/refresh en un solo
  lugar.
- Testabilidad: mockear un wrapper es más simple que mockear
  `y-websocket` cada vez.
- Tamaño del diff: B agrega ~80 líneas pero evita duplicar setup.

**Decisión elegida**: **Opción B — wrapper propio `yjsProvider.ts`**.

**Razonamiento**: el 2c (Athena) y el 2d (comentarios inline) van a
reusar la misma conexión WS. Centralizar ahora evita refactor forzado
después. El wrapper añade:
1. Inyección del JWT desde localStorage.
2. Reconnect con backoff (que `y-websocket` no trae por default en
   v3 — trae reconnect básico, no exponencial).
3. Awareness con `{userId, name, avatar, color}` derivado de
   `getAuthorColor` (reutilizado de 2a, no duplicado).
4. Un único `destroy()` que limpia provider + ydoc + awareness.
5. Auto-reauth al expirar token (detecta close code 4001, pide refresh,
   reconnecta).

**Archivo**: `src/services/yjsProvider.ts`. Exports: `createWorkspace
Provider(docId, userMeta)` → `{provider, ydoc, awareness, destroy,
onStatusChange}`.

### 2.3 Decisión D3 — Indicador de auto-save: dónde y cuándo

**Dónde**: ya vive en `WorkspaceEditor.tsx:130-134` (topbar centro).
Se mantiene esa ubicación, solo se conecta a lógica real.

**Cuándo (estados)**:
- `saving`: mientras hay cambios Yjs en vuelo hacia el servidor
  **y** el PATCH de snapshot está ejecutándose. Se muestra
  spinner inline + texto "Guardando…".
- `saved`: cuando todos los cambios han sido ACK por el WS relay
  **y** el último snapshot 2s debounced se persistió vía PATCH.
- `unsaved`: cuando `awareness.localState` tiene dirty flag o el
  provider reporta `status === 'disconnected'`. Se muestra con color
  ámbar.

**Debounce del snapshot**: 2s desde el último update Yjs. Cada update
resetea el timer. Si no llegan updates, no hay PATCH (optimización).

**Qué se persiste en `updateWorkspace`**: el snapshot `Y.encodeState
AsUpdate(ydoc)` serializado a base64 se guarda en
`WorkspaceDocument.content_yjs` vía el endpoint existente `PATCH
/workspaces/{id}` con campo nuevo `content_yjs`. **Ese campo ya existe
en el modelo, pero el Pydantic `PatchWorkspaceRequest` del 2a no lo
acepta** (ver `workspaces_routes.py:183-189`). Hay que agregar
`content_yjs: Optional[str] = None` y el handler (líneas 395-430).

**Clientes concurrentes**: solo uno (cualquiera) dispara el PATCH.
Para evitar race, se elige determinísticamente: el cliente cuyo
`userId` ordenado lexicográficamente es el menor entre los awareness
states. Si está solo, es él. Esto se calcula en el hook `useAutoSave`.

**Razonamiento de 2s**: alineado con plan maestro §5 sub-bloque 2b
("Auto-save cada 2 segundos"). Intervalo probado en Google Docs y
Notion. No demasiado frecuente (evita flicker), no tan largo que
pierda trabajo si el browser se cae.

### 2.4 Decisión D4 — Broadcast de chat: ¿mismo WS o endpoint separado?

**Opciones**:
- **A**: mismo endpoint `/workspaces/ws/{doc_id}` relaya **binario Yjs
  + JSON awareness + JSON chat**. Un solo canal por doc.
- **B**: endpoint separado `/workspaces/chat/ws/{doc_id}` solo para
  chat. Doble conexión por tab.

**Criterios**: complejidad de conexión, consumo de recursos (sockets
por usuario), latencia, separación de fallas (si el WS de editor cae,
¿el chat sigue?).

**Decisión elegida**: **Opción A — mismo canal, multiplexado por tipo
de mensaje**.

**Razonamiento**:
1. Ya tenemos presence/awareness en ese canal; sumar chat es
   incremental.
2. El V1 `collab_ws.py:167-172` ya multiplexa binario (Yjs) + text
   JSON (awareness/custom). Patrón validado.
3. Duplicar el socket por usuario baja escalabilidad del relay
   (cada tab abierto = 2 WS en lugar de 1).
4. La falla del WS editor implica falla de todo el módulo visible al
   usuario; aislar el chat no aporta robustez significativa en este
   producto. Si el usuario pierde el WS, ambos se recuperan al
   reconectar.

**Protocolo de mensajes multiplexados** (text JSON, envuelto):
- Yjs binary updates: `send_bytes` directo, relay a otros clientes.
  No van con wrapper JSON (eficiencia).
- Awareness Yjs: lo maneja `y-websocket` internamente como binario.
- Chat message: `{"type": "chat.message", "data": {...}}` → relay a
  **todos** los clientes incluyendo el emisor (confirmación) tras
  persistir en BD.
- Chat message persisted ACK: `{"type": "chat.ack", "data":
  {"client_msg_id": "...", "server_msg_id": "..."}}` opcional para
  distinguir mensaje optimista vs confirmado.
- Presence: `{"type": "presence", "users": [...]}` (patrón V1).

**Persistencia**: cuando el backend recibe un mensaje de chat, **antes
de broadcast** lo persiste en `workspace_messages` con `gen_id()`,
`user_id`, `workspace_id`, `content`, `created_at`. Luego broadcast
incluye `server_msg_id` para que el frontend pueda reemplazar el
optimista.

### 2.5 Decisión D5 — Presence de usuarios en topbar y sidebar

Awareness de Yjs expone el estado compartido de cada cliente. Cada
cliente publica:

```json
{
  "userId": "u_xxx",
  "name": "Cristian G.",
  "avatar": "https://.../a.jpg",
  "color": "#A855F7",
  "cursor": { "anchor": ..., "focus": ... }
}
```

**Topbar**: avatares apilados de hasta 5 usuarios. Si son >5, mostrar
"+N" como chip. Color de borde = `getAuthorColor(userId)`. Tooltip con
nombre al hover.

**Sidebar izquierdo (`ThreeZoneLayout.tsx` → panel Colaboradores**,
líneas 62-78 del 2a): **se reemplaza** la lista estática actual por
una lista dinámica que combina:
- Miembros totales del workspace (del REST `listMembers` — ya existe
  en el 2a).
- Quién de ellos está online ahora (awareness). Indicador verde al
  lado del nombre.
- `chars_contributed` por miembro (barra de progreso horizontal al
  total). Esto es la **feature contribution metrics**.

**Archivo**: `MemberContributionBar.tsx` en
`src/components/workspaces/Presence/`. Se consume desde el panel
Colaboradores del `ThreeZoneLayout`.

**Decisión elegida** para presence: **awareness de Yjs como fuente de
verdad en tiempo real + sidebar dinámico**.

**Razonamiento**: evita un segundo canal para presence. Yjs ya calcula
quién está conectado al nivel de librería.

### 2.6 Decisión D6 — Cómo se actualiza `chars_contributed`

**Opciones**:
- **A**: backend detecta updates Yjs, parsea el diff, suma caracteres
  al usuario correspondiente.
- **B**: cliente calcula su delta local (caracteres tipeados por él) y
  envía PATCH periódico cada 30s al endpoint nuevo `PATCH
  /workspaces/{id}/members/{member_id}/contribution` con el delta
  acumulado.
- **C**: cliente calcula delta y lo incluye en el mismo multiplexado
  de chat/awareness como `{"type": "contribution.delta", "delta": N}`;
  el backend recibe por WS y escribe en BD.

**Criterios**: precisión, tráfico, complejidad de parsing Yjs en
backend (no trivial), confiabilidad ante caídas del cliente.

**Decisión elegida**: **Opción B — PATCH periódico cada 30s desde
cliente**.

**Razonamiento**:
1. Parsear Yjs updates en backend requiere instanciar `Y.Doc` con
   `ypy` (Python bindings) — añade complejidad grande y dependencia
   nueva. Lo descartamos para el 2b.
2. Opción C mete más tipos de mensajes en el mismo canal WS, lo cual
   acopla el protocolo y dificulta testing del relay.
3. Opción B es un REST simple, testeable con TestClient, persistente
   incluso si el WS cae. La frecuencia 30s es suficiente para ver una
   barra moverse de forma perceptible sin saturar el servidor.
4. Riesgo: si el cliente se cae antes del siguiente PATCH, se pierden
   hasta 30s de contribución contabilizada. Aceptable para este
   indicador (no es dato financiero ni legal).

**Contrato**:
```
PATCH /workspaces/{doc_id}/members/{member_id}/contribution
Body: {"delta_chars": 123}  # enteros no negativos
Response: {"id": "...", "chars_contributed": 456}
```

Solo el usuario dueño del `member_id` puede incrementar su propio
contador (validación `user.id == member.user_id`, sino 403).

**Cálculo del delta en cliente**: hook `useCharContributionTracker`
escucha `OnChangePlugin` del editor, compara length del texto actual
vs anterior, acumula positivos locales (ignora negativos = borrado
de otros). Flush cada 30s si `delta > 0`.

### 2.7 Decisión D7 — Autenticación del WebSocket

**Opciones**:
- **A**: `?token=JWT` en query string (patrón V1 `collab_ws.py:96`).
- **B**: header `Authorization: Bearer xxx` (navegadores no permiten
  agregar headers al handshake WS estándar).
- **C**: first-message protocol: abrir WS anónimo, primer mensaje es
  el token, si no valida se cierra.

**Criterios**: compatibilidad navegador, simplicidad, consistencia V1.

**Decisión elegida**: **Opción A — `?token=JWT_ACCESS` en query**.

**Razonamiento**:
1. Los navegadores no soportan headers custom en `new WebSocket(url)`.
   La opción B requiere polyfill server-side ruidoso.
2. La opción C duplica lógica y abre un corto periodo anónimo.
3. La opción A es idéntica al V1, ya probada en prod, y el
   `chat_manager.authenticate(ws, token)` ya maneja valid/invalid/expired.

**Close codes**:
- `4001` token missing o inválido
- `4003` access denied (no es miembro del doc)
- `4004` doc not found
- `4010` token expired (distinto de inválido → el cliente sabe que debe
  refrescar)

**Riesgo de token en URL**: los tokens pueden aparecer en logs de
proxies y access logs. Mitigación: el access token tiene vida corta
(patrón existente del proyecto). Además, los logs de producción (Render
/ Vercel) ya filtran query strings sensibles según práctica actual. Se
documenta como aceptable consistente con V1.

### 2.8 Decisión D8 — Reconnection policy

`y-websocket@3` trae reconnect básico con backoff. Se configura desde
el wrapper:

- Intento inicial inmediato al `connect()`.
- Si falla: delay = `min(1000 * 2^n, 30000)` ms (exponencial con tope
  30s).
- Máx intentos: **ilimitado** mientras el componente esté montado.
- Al recibir close code `4010` (token expirado): llamar al refresh
  token endpoint existente (`auth_routes.py` ya tiene `/auth/refresh`),
  obtener nuevo access token, reconectar con token nuevo.
- Al recibir close code `4001/4003/4004`: detener reconnect, emitir
  evento `fatal` al componente que muestra error y botón "Volver a
  Workspaces".
- Al `window.online` evento: si el provider está en backoff, forzar
  reconnect inmediato.

**Estado en UI**: el saving indicator tiene un 4° estado virtual
"offline" cuando el provider está `status==='disconnected'`. Muestra
texto "Sin conexión" ámbar, reanuda a "Guardado" al reconectar y
sincronizar pending updates.

### 2.9 Decisión D9 — Tests de WebSocket: ¿jsdom o CI con websockets reales?

**Contexto**: vitest + jsdom no trae servidor WS real. Los tests de
`yjsProvider.test.ts` con `new WebSocket('ws://localhost')` fallan.

**Opciones**:
- **A**: mock de `WebSocket` global en vitest con implementación
  controlada (como `mock-socket` o uno casero).
- **B**: skip en local con `it.skipIf(!process.env.CI)`, ejecutar en
  CI con `websockets` (lib Python) montando un servidor mínimo.
- **C**: tests unitarios del wrapper mockean `y-websocket`
  `WebsocketProvider` entero; los tests de integración (editor + WS)
  solo corren en CI con server real.

**Criterios**: velocidad de feedback local, cobertura real, precedente
del 2a.

**Decisión elegida**: **Opción C — combinación de A (unit) + CI
integración**.

Plan concreto:
1. Unit tests frontend (`yjsProvider.test.ts`): mock del módulo
   `y-websocket` con `vi.mock`. Verifica que el wrapper invoca el
   provider con los params correctos, que maneja status changes,
   que `destroy()` llama cleanup, que el backoff se calcula bien, que
   el token se pasa en query. **No hay servidor WS real.**
2. Backend WS tests (`test_workspaces_ws.py`): usan `fastapi.testclient
   .TestClient` que soporta `websocket_connect(url)` nativamente. Esto
   **sí es servidor real** in-process. Patrón documentado en FastAPI
   docs. Skip con `pytest.importorskip("websockets")` por paridad con
   el resto de tests.
3. Integration test `WorkspaceEditor.collab.test.tsx`: mockea el
   wrapper `yjsProvider` entero con un mock que simula 2 clientes
   locales compartiendo una `Y.Doc` en memoria. No usa WS real.
   Verifica que el editor renderiza texto tipeado por el "otro
   cliente" simulado. Esto cubre el gap identificado en 2a Capa 5.

**Razonamiento**: replica el patrón existente del 2a
(`importorskip("fastapi")` para routes_crud en local, completo en CI),
evita flakiness de servers efímeros, permite feedback rápido en dev.

---

## 3. Archivos a tocar

Legend: **C** = crear, **M** = modificar, **-** = prohibido.

### 3.1 Backend

| Acción | Ruta | Qué se hace |
|---|---|---|
| **C** | `backend/workspaces_ws.py` | Archivo nuevo. WebSocket endpoint `/workspaces/ws/{doc_id}`. Patrón adaptado del V1 `collab_ws.py`: `DocRoom`, `_rooms`, auth con `chat_manager.authenticate`, access check contra `WorkspaceDocument + WorkspaceMember`, relay binario Yjs, multiplexado JSON para chat (persiste en BD antes de broadcast) y presence. Uso de `WorkspaceMessage` model del 2a. Cierre con close codes 4001/4003/4004/4010. |
| **M** | `backend/workspaces_routes.py` | Se agregan 4 endpoints + 1 modificación: (a) `GET /workspaces/{doc_id}/chat/messages?limit=50&before=...` paginado desc, (b) `POST /workspaces/{doc_id}/chat/messages` (opcional: también se puede enviar vía WS. Útil para clientes sin WS. Devuelve `WorkspaceMessage` dict), (c) `DELETE /workspaces/{doc_id}/chat/messages/{msg_id}` (owner del mensaje o owner del workspace), (d) `PATCH /workspaces/{doc_id}/members/{member_id}/contribution` (validación `user.id == member.user_id`, incrementa `chars_contributed`), (e) **modificación**: agregar `content_yjs: Optional[str] = None` a `PatchWorkspaceRequest` + handler. |
| **M** | `backend/server.py` | Una única línea nueva + un import. Tras `app.include_router(collab_ws_router)` (línea 278 actual) agregar `app.include_router(workspaces_ws_router)`. Import: `from workspaces_ws import router as workspaces_ws_router`. Total: 2 líneas. **Mismo contrato que el 2a** — esta regla ya fue validada por Cristian al cerrar 2a. |
| **C** | `backend/tests/test_workspaces_ws.py` | Tests de integración con `TestClient.websocket_connect`: (a) conectar con token válido → presence broadcast, (b) conectar sin token → close 4001, (c) conectar con token de usuario no-miembro → close 4003, (d) conectar a doc inexistente → close 4004, (e) enviar chat message → persiste en BD + broadcast a otros, (f) enviar update binario Yjs → relay a otros sin persistir, (g) desconectar → presence actualizado en los demás. ~10 tests con `pytest.importorskip("websockets")`. |
| **C** | `backend/tests/test_workspaces_chat.py` | Tests REST del chat: (a) GET vacío retorna `[]`, (b) POST crea mensaje y aparece en GET, (c) paginación `before`, (d) límite 50 respetado, (e) DELETE por owner del mensaje ok, (f) DELETE por otro miembro no-owner 403, (g) DELETE por owner del workspace ok, (h) no-miembro rechazado, (i) mensaje vacío 400. ~10 tests. |
| **M** | `backend/tests/test_workspaces_routes_crud.py` | Se agregan 3 tests para `PATCH /workspaces/{id}/members/{mid}/contribution`: (a) propio miembro incrementa ok, (b) otro usuario 403, (c) delta negativo rechazado 400. Y 2 tests para PATCH del doc con `content_yjs`: (a) viewer 403, (b) editor ok y se refleja en GET. |

### 3.2 Frontend

| Acción | Ruta | Qué se hace |
|---|---|---|
| **C** | `src/services/yjsProvider.ts` | Wrapper sobre `y-websocket` + `y-indexeddb`. Exports: `createWorkspaceProvider(docId, userMeta)` → `{provider, ydoc, awareness, indexeddbPersistence, status$, destroy, forceReconnect}`. Maneja: JWT en query, awareness init con `{userId, name, avatar, color}`, backoff exponencial, detección close codes 4001/4003/4004/4010, auto-refresh token al 4010, observer de `window.online`. **IndexedDB**: instancia `new IndexeddbPersistence(docId, ydoc)` en paralelo al provider WS. `destroy()` limpia ambos. Espera el evento `synced` de IndexedDB antes de emitir `ready` al consumidor (para que el editor monte ya con el estado local cargado, incluso sin red). |
| **M** | `src/services/workspacesApi.ts` | Se agregan funciones: `listChatMessages(docId, {limit, before})`, `sendChatMessage(docId, content)`, `deleteChatMessage(docId, msgId)`, `updateContributionMetric(docId, memberId, deltaChars)`, y en el modelo `UpdateWorkspaceInput` (del types file) permitir `content_yjs`. |
| **M** | `src/components/workspaces/Editor/LexicalEditor.tsx` | Agregar prop opcional `collaborationConfig?: {ydoc, provider, awareness, userMeta}`. Si está presente: remover `HistoryPlugin` (Yjs maneja su propia historia via UndoManager) y reemplazar por `CollaborationPlugin` de `@lexical/react/LexicalCollaborationPlugin`. El `CollaborationPlugin` requiere pasar `providerFactory: (id, yjsDocMap) => provider` y el userMeta para cursores. El `RichTextPlugin`, `ListPlugin`, `LinkPlugin` se conservan. Si `collaborationConfig` es undefined, el editor funciona como en 2a (no breaking change). |
| **M** | `src/components/workspaces/Editor/editorConfig.ts` | No requiere cambios en nodos. Comentar que cuando se usa con Yjs, `namespace` debe ser único por doc (Yjs lo usa como clave del mapa). Ajustar para usar `namespace = "conniku-ws-{docId}"`. |
| **C** | `src/components/workspaces/Editor/CursorPresence.tsx` | Plugin React de Lexical que renderiza cursores "Figma-style" (barra vertical color + nombre flotante) para cada awareness remoto. Se integra con `@lexical/yjs` que expone awareness; este plugin lo consume y dibuja overlay DOM. Color viene de awareness, no se recalcula. |
| **C** | `src/components/workspaces/Chat/GroupChat.tsx` | Componente del chat grupal. Props: `docId, members, ydocAwareness`. Mantiene lista de mensajes (fetch inicial + suscripción al provider para nuevos). Input con Enter para enviar (Shift+Enter = newline). Optimistic update: inserta localmente al enviar con `status: 'sending'`, reemplaza con ACK del server. |
| **C** | `src/components/workspaces/Chat/MessageList.tsx` | Lista virtualizada simple (scroll invertido). Renderiza cada mensaje con avatar + nombre + timestamp + contenido. Agrupa mensajes consecutivos del mismo autor en <2min. |
| **C** | `src/components/workspaces/Presence/MemberContributionBar.tsx` | Barra horizontal mostrando % contribución de cada miembro sobre el total. Ordenado descendente. Cada segmento con color del autor + nombre + número absoluto. Si `total === 0`, renderiza placeholder "Aún sin contribuciones". |
| **M** | `src/components/workspaces/Layout/ThreeZoneLayout.tsx` | Reemplazar el panel "Colaboradores" (líneas 62-78) por componente `MemberContributionBar` + lista online/offline. Reemplazar la zona derecha inferior (placeholder chat líneas 105-114) por montaje de `GroupChat` (que se renderiza si la prop `chatEnabled` es true). El panel "Borrador privado" (superior) se mantiene placeholder (sigue siendo 2c). |
| **M** | `src/pages/Workspaces/WorkspaceEditor.tsx` | Integra todo: (a) llama `createWorkspaceProvider(docId, userMeta)` en `useEffect`, (b) pasa el bundle `collaborationConfig` al `LexicalEditor`, (c) agrega hook `useAutoSave(ydoc, updateWorkspace, 2000)` con lógica de debounce + "mejor cliente" para el PATCH, (d) conecta el indicador `saveStatus` a los eventos del hook en lugar del marker manual actual, (e) limpia con `destroy()` en cleanup, (f) pasa `ydocAwareness` y `chatEnabled=true` a `ThreeZoneLayout`. |
| **C** | `src/hooks/useAutoSave.ts` | Hook que escucha `ydoc.on('update')`, debounces 2s, determina si este cliente es el "elegido" para persistir, llama `updateWorkspace` con snapshot base64. Emite status `'saved' | 'saving' | 'unsaved' | 'offline'`. |
| **C** | `src/hooks/useCharContributionTracker.ts` | Hook que, dado un `ydoc` y un `memberId`, acumula caracteres añadidos localmente y cada 30s llama `updateContributionMetric`. Reset al flush. |
| **C** | `src/__tests__/workspaces/yjsProvider.test.ts` | Unit tests del wrapper con `vi.mock('y-websocket')`. Cubre: init, token injection, status changes, cleanup, close-code handling, backoff math. |
| **C** | `src/__tests__/workspaces/GroupChat.test.tsx` | Tests del componente chat: render lista, enviar mensaje optimista, recibir mensaje remoto, eliminar mensaje propio, deshabilitar input si offline. |
| **C** | `src/__tests__/workspaces/WorkspaceEditor.collab.test.tsx` | Test de integración: dos `LexicalEditor` instances compartiendo una `Y.Doc` en memoria (sin WS real). Verifica que tipear en uno aparece en el otro, que cursores remotos se renderizan con color correcto, que `useAutoSave` dispara PATCH mockeado 2s después. Resuelve gap documentado en 2a Capa 5 (MODERADO-5). |
| **C** | `src/__tests__/workspaces/useAutoSave.test.ts` | Tests del hook: debounce 2s, flushea snapshot, cliente-elegido determinista, transiciona estados. |

### 3.3 Shared

| Acción | Ruta | Qué se hace |
|---|---|---|
| **M** | `shared/workspaces-types.ts` | Agregar: `WorkspaceMessage` (`{id, workspaceId, userId, user?, content, createdAt, status?: 'sending' \| 'sent' \| 'failed'}`), `ContributionUpdate` (`{memberId, charsContributed}`), `PresenceUser` (`{userId, name, avatar?, color}`). Ajustar `UpdateWorkspaceInput` para aceptar `content_yjs?: string`. |

### 3.4 package.json — REQUIERE UNFREEZE PREVIO

**Bloqueador** antes de la Capa 1: `package.json` sigue FROZEN
(confirmado `.claude/frozen-files.txt:21`). Se requiere `/unfreeze
package.json` explícito de Cristian.

**Dependencias a añadir** (2):
```json
"@lexical/yjs": "^0.21.0",
"y-indexeddb": "^9.0.12"
```

`yjs` y `y-websocket` **ya están**. Falta el binding Lexical y el
persistence provider de IndexedDB (decisión §1.2.1 #3).

**Estrategia si no hay unfreeze**: backend puede avanzar completo (WS +
endpoints chat + tests). Frontend Yjs se queda bloqueado. La Capa 5
cierra "bloqueada por unfreeze pendiente" y Cristian resuelve en Capa
6 entrada.

### 3.5 Archivos prohibidos (NO se tocan)

- `backend/collab_ws.py`, `backend/collab_routes.py`,
  `src/pages/GroupDocs.tsx`, `src/pages/GroupDocEditor.tsx`,
  `src/components/CollabEditor.tsx` (V1 intacto).
- MiUniversidad, Profile, UserProfile, Dashboard, Friends,
  Communities, Messages, Mentorship, Conferences, Jobs, StudyPaths,
  StudyRooms.
- `src/admin/**`, HRDashboard, CEO, Admin.
- `backend/auth_routes.py`, `backend/hr_routes.py`,
  `backend/ai_engine.py`, `backend/konni_engine.py`,
  `backend/websocket_manager.py` (se usa como dependencia, no se
  modifica — solo se importa `chat_manager.authenticate`).
- `CLAUDE.md`.
- Todo lo listado en `.claude/frozen-files.txt` (incluye
  `shared/legal_texts.py`, `shared/legal_texts.ts`, etc.).
- `src/services/websocket.ts` — es del chat general, no se toca. El
  wrapper Yjs es archivo separado.
- `src/components/workspaces/authorColors.ts` — se **reutiliza**, NO
  se duplica (hay gente creando `AuthorColors.ts` PascalCase, evitar).

### 3.6 Nota sobre naming

El archivo existente es `authorColors.ts` (camelCase, 2a cerrado). La
tarea mencionaba "`AuthorColors.ts` ya existe" — hay discrepancia de
case. Convención de 2a: servicios en camelCase. **Se mantiene
`authorColors.ts` camelCase**. No se crea un archivo PascalCase
espejo.

---

## 4. Plan TDD

Orden estricto RED → GREEN → REFACTOR por fase. Builders backend y
frontend pueden correr en paralelo en Fases 1-4 y 5-8 respectivamente;
la Fase 9 (integración) sincroniza al final.

### 4.1 Fase 1 — Backend chat REST (backend-builder)

**RED-1**: `test_workspaces_chat.py`. ~10 tests. Ejecutar → todos
fallan (endpoints no existen).

**GREEN-1**: agregar 3 endpoints al `workspaces_routes.py`
(`GET/POST/DELETE /chat/messages`). Tests pasan.

**REFACTOR-1**: extraer `_message_to_dict` helper si hay duplicación
con patrones existentes (`_member_to_dict`).

### 4.2 Fase 2 — Backend contribution REST (backend-builder)

**RED-2**: 3 tests añadidos a `test_workspaces_routes_crud.py` para
`PATCH /members/{mid}/contribution`. 2 tests para PATCH doc
`content_yjs`. Ejecutar → fallan.

**GREEN-2**: agregar endpoint contribution + ampliar
`PatchWorkspaceRequest` con `content_yjs`. Tests pasan.

**REFACTOR-2**: ninguno previsto.

### 4.3 Fase 3 — Backend WebSocket (backend-builder)

**RED-3**: `test_workspaces_ws.py` con ~10 tests. Usa
`TestClient.websocket_connect`. Ejecutar → falla (archivo no existe).

**GREEN-3**: crear `backend/workspaces_ws.py`. Patrón adaptado del V1:
- `class WorkspaceRoom` (equivalente a `DocRoom`)
- `_rooms: dict[str, WorkspaceRoom]`
- Auth con `chat_manager.authenticate`
- Access check con `WorkspaceDocument.owner_id == user_id OR
  WorkspaceMember exists`
- `while True: receive()` → bytes → relay binario (Yjs updates)
- Text JSON → `type == "chat.message"` → persistir en BD + broadcast
  con `server_msg_id`. `type == "presence"` → broadcast as-is.
- Modificar `server.py` con 2 líneas (import + include_router).
Tests pasan.

**REFACTOR-3**: si hay duplicación con `collab_ws.py`, NO extraer a
shared (el V1 es archivo prohibido). Mantener código autónomo.

### 4.4 Fase 4 — Backend verificación (backend-builder)

```
cd backend && ruff check workspaces_routes.py workspaces_ws.py &&
ruff format --check workspaces_routes.py workspaces_ws.py &&
pytest tests/test_workspaces_*.py -v
```

Salida adjunta al reporte (regla evidencia obligatoria).

### 4.5 Fase 5 — Frontend provider Yjs (frontend-builder)

**PREREQ**: `/unfreeze package.json` activo. `npm install @lexical/yjs`
ejecutado sin errores.

**RED-5**: `yjsProvider.test.ts` con `vi.mock('y-websocket')`.
Ejecutar → falla (archivo no existe).

**GREEN-5**: crear `src/services/yjsProvider.ts`. Tests pasan.

**REFACTOR-5**: ninguno previsto.

### 4.6 Fase 6 — Frontend chat components (frontend-builder)

**RED-6**: `GroupChat.test.tsx` + `MessageList.test.tsx`. Fallan.

**GREEN-6**: crear `GroupChat.tsx`, `MessageList.tsx`,
`MemberContributionBar.tsx`. Extender `workspacesApi.ts` con funciones
chat + contribution. Tests pasan.

**REFACTOR-6**: consolidar estilos CSS en `workspaces.css` (el archivo
ya existe del 2a, se amplía).

### 4.7 Fase 7 — Frontend editor + Yjs (frontend-builder)

**RED-7**: `WorkspaceEditor.collab.test.tsx` con dos editores
compartiendo `Y.Doc` en memoria. Falla.

**GREEN-7**: modificar `LexicalEditor.tsx` con prop
`collaborationConfig`. Crear `CursorPresence.tsx` plugin. Tests pasan.

**REFACTOR-7**: extraer theme de cursores si aparece duplicación con
`editorTheme.ts`.

### 4.8 Fase 8 — Frontend hooks auto-save + contribution (frontend-builder)

**RED-8**: `useAutoSave.test.ts` + tests del
`useCharContributionTracker`. Fallan.

**GREEN-8**: crear ambos hooks. Tests pasan.

**REFACTOR-8**: extraer lógica de "cliente elegido" a util si el hook
la necesita reutilizar.

### 4.9 Fase 9 — Integración WorkspaceEditor (frontend-builder)

**RED-9**: Actualizar tests de `WorkspaceEditor.test.tsx` para mockear
`createWorkspaceProvider` y verificar: (a) se invoca al montar, (b) se
destruye al desmontar, (c) el saveStatus viene del hook, (d)
`ThreeZoneLayout` recibe `chatEnabled=true` y `ydocAwareness`.

**GREEN-9**: modificar `WorkspaceEditor.tsx`. Modificar
`ThreeZoneLayout.tsx` (reemplazar placeholders de chat + colaboradores).
Tests pasan.

**REFACTOR-9**: verificar que la página no supera 300 líneas;
extraer sub-componentes si hace falta.

### 4.10 Verificación final frontend

```
npm run lint && npm run typecheck &&
npm test -- workspaces && npm run build
```

Salida adjunta al reporte.

---

## 5. Riesgos

### 5.1 ALTO — package.json FROZEN bloquea `@lexical/yjs`

**Probabilidad**: cierta si Cristian no autoriza antes de Capa 1.
**Impacto**: frontend completo detenido (Fases 5-9). Backend avanza,
pero el sub-bloque queda sin entregar.
**Mitigación**: primer punto del reporte inicial del web-architect a
Cristian debe ser: "para iniciar Capa 1 necesito `/unfreeze
package.json`". Si no hay respuesta al iniciar Capa 1, backend
arranca solo y se documenta el bloqueo en `docs/sessions/` como en
el 2a. Plan-B: si Cristian rechaza unfreeze, investigar si se puede
usar `y-websocket` + Lexical sin el binding oficial
(`@lexical/yjs`) — existen implementaciones comunitarias pero no
están probadas. Descartado a priori, se prefiere esperar el unfreeze.

### 5.2 ALTO — Yjs conflict resolution diverge entre clientes

**Probabilidad**: media. Si dos clientes escriben simultáneamente y el
backend no respeta orden de updates, pueden ver estados distintos.
**Impacto**: pérdida de texto, confusión UX grave.
**Mitigación**:
- Backend es **puro relay** (Yjs gana en cliente, CRDT). No intenta
  persistir updates uno por uno.
- Persistencia es snapshot final vía `Y.encodeStateAsUpdate(ydoc)` en
  base64. Cualquier cliente puede reconstruir el doc completo desde ese
  snapshot al cargar.
- Al conectar, el cliente primero emite `sync step 1` (intercambio de
  state vector) contra el snapshot del server (cargado en `content_yjs`
  al abrir). Esto es estándar de Yjs.
- Tests `WorkspaceEditor.collab.test.tsx` validan 2 clientes editando
  simultáneamente sin divergencia. Si falla, se bloquea el merge.

### 5.3 ALTO — WebSocket disconnect deja doc "sucio" sin guardar

**Probabilidad**: alta (redes reales fallan).
**Impacto**: usuario cree que guardó pero no, pierde trabajo al cerrar
tab.
**Mitigación**:
- UI muestra explícitamente estado "Sin conexión" cuando el provider
  está disconnected. Cambio visual claro (color ámbar).
- `useAutoSave` NO marca `saved` si el provider está desconectado,
  incluso si hubo PATCH local exitoso (porque los updates de los
  demás no se recibieron).
- IndexedDB local via `y-indexeddb` **incluido en 2b** (decisión
  consolidada §1.2.1 #3). El wrapper instancia
  `IndexeddbPersistence(docId, ydoc)` al crear el provider, lo que
  garantiza que los cambios se persisten localmente incluso sin WS.
  Al reconectar, Yjs sincroniza el diff automáticamente. Cierra el
  gap de "el usuario cree que guardó pero perdió WiFi".
- Beforeunload listener: si `saveStatus !== 'saved'`, mostrar confirm
  dialog al cerrar pestaña (redundante con IndexedDB pero útil para
  advertir al usuario que su cambio aún no salió al server).

### 5.4 MEDIO — Auth handshake falla por token expirado en WS

**Probabilidad**: media (tokens cortos y sesiones largas).
**Impacto**: editor se desconecta sin aviso claro, usuario tipea sin
guardar.
**Mitigación**:
- Close code dedicado `4010` para expirado vs `4001` inválido.
- Wrapper detecta 4010 → llama `auth.refresh()` existente → reconnect
  con nuevo token. Usuario no ve nada raro si el refresh funciona.
- Si refresh falla: `fatal` event → UI muestra modal "Tu sesión
  expiró, vuelve a iniciar sesión".
- Test `yjsProvider.test.ts` cubre el flujo 4010 → refresh → reconnect.

### 5.5 MEDIO — Tests WS en jsdom imposibles

**Probabilidad**: cierta. vitest + jsdom no hosteará server WS.
**Impacto**: no se pueden testear integraciones reales en local.
**Mitigación**: usar split de D9:
- Unit con mock de `y-websocket` (local rápido).
- Integration en memoria con `Y.Doc` compartido (local, sin WS).
- Backend WS tests con `TestClient.websocket_connect` (in-process,
  real). Este cubre el servidor. Si el cliente y el servidor cumplen
  el mismo contrato (binario Yjs + JSON chat), la integración está
  garantizada por construcción.
- Documentar en `docs/reports/.../capa-5-gap-finder-2b-*.md` que no
  hay test end-to-end real cliente-servidor. Se propone para Capa 6
  (Cristian prueba manualmente con 2 pestañas en preview).

### 5.6 MEDIO — Concurrent edits + auto-save race

**Probabilidad**: media cuando hay >1 cliente.
**Impacto**: dos clientes disparan PATCH simultáneo, uno sobreescribe
al otro.
**Mitigación**:
- Elección determinística del "cliente guardador": menor `userId`
  entre awareness states actuales. Se recalcula con cada cambio de
  awareness. Si el actual guardador se desconecta, el siguiente
  toma el rol automáticamente.
- Si dos clientes entran y pelean el rol, el primero que persista
  gana la última versión (CRDT garantiza que todos convergen al
  mismo state post-sync).
- Snapshot incluye state vector completo; sobrescribir NO pierde
  cambios porque el snapshot es unión de todos los updates.
- Aun así: si hay duda, los `WorkspaceVersion` permiten restore.
  Los builders crean una versión automática cada hora (se evalúa en
  2d; fuera de scope 2b).

### 5.7 MEDIO — Namespace del editor Lexical colisiona con Yjs mapa

**Probabilidad**: baja pero real si `namespace` se queda en
`"conniku-workspace"` constante.
**Impacto**: dos docs abiertos en tabs distintos interfieren.
**Mitigación**: `namespace = "conniku-ws-${docId}"` dinámico.
Documentado en D2. Test cubre que dos instancias con distinto
`docId` no comparten estado.

### 5.8 MEDIO — `chars_contributed` infla indefinidamente

**Probabilidad**: cierta con uso normal.
**Impacto**: métrica pierde sentido si no hay reset.
**Mitigación**: por plan maestro, `chars_contributed` es **acumulado
total** del miembro en ese workspace. No se resetea. Para ver
"contribución relativa", la UI calcula `% = mi_chars / total_chars` de
los miembros presentes. Documentado en `MemberContributionBar.tsx`.
Si en el futuro se quiere "contribución del último día", se agrega
otro campo en 2d (fuera de scope).

### 5.9 MEDIO — Chat persistente expone datos privados a nuevos miembros

**Probabilidad**: media (owner agrega miembro nuevo).
**Impacto**: el nuevo lee historia completa del chat, incluso
mensajes previos a su incorporación. Puede ser sorpresa UX o tema
de privacidad.
**Mitigación**:
- Decisión de producto en 2b: el chat grupal es **visible a todos los
  miembros, incluyendo historia previa**. Consistente con Google
  Docs comments.
- Documentar en el borrador de política de privacidad cuando el
  legal-docs-keeper audite. **No es componente legal hard en 2b**
  pero se flaggea.
- No se implementa retención/borrado del chat (cascade ON DELETE ya
  cubre borrado del workspace completo).

### 5.10 BAJO — `y-websocket@3` breaking changes vs v1

**Probabilidad**: baja (ya está en deps, instalable).
**Impacto**: API distinta a docs viejos.
**Mitigación**: usar los docs oficiales de v3
(https://github.com/yjs/y-websocket). Si en Fase 5 el wrapper no
funciona, pausa y reportar a Cristian con alternativas (downgrade a
v1 no se recomienda, es deuda).

### 5.11 BAJO — `_rooms` global state leak entre tests backend

**Probabilidad**: baja si cada test cierra sus WS.
**Impacto**: tests flakey.
**Mitigación**: `test_workspaces_ws.py` fixture `autouse` que limpia
`_rooms = {}` tras cada test. Patrón estándar.

---

## 6. Criterio de terminado (checklist binaria)

### 6.1 Backend

- [ ] `backend/workspaces_ws.py` creado con endpoint
      `/workspaces/ws/{doc_id}` funcional.
- [ ] `backend/workspaces_routes.py` extendido con endpoints de chat
      (GET/POST/DELETE `/chat/messages`) y contribution (PATCH
      `/members/{mid}/contribution`). `PatchWorkspaceRequest` acepta
      `content_yjs`.
- [ ] `backend/server.py` con 2 líneas nuevas (import +
      include_router) para el WS.
- [ ] `pytest backend/tests/test_workspaces_ws.py` pasa 100%
      (~10 tests) en CI.
- [ ] `pytest backend/tests/test_workspaces_chat.py` pasa 100%
      (~10 tests).
- [ ] `pytest backend/tests/test_workspaces_routes_crud.py` sigue
      pasando 100% + 5 tests nuevos agregados.
- [ ] `ruff check` limpio sobre los archivos del sub-bloque.
- [ ] `ruff format --check` limpio.

### 6.2 Frontend

- [ ] `@lexical/yjs@^0.21.0` y `y-indexeddb@^9.0.12` en
      `package.json` instalados.
- [ ] `src/services/yjsProvider.ts` creado y testeado (unit con mock).
- [ ] `src/services/workspacesApi.ts` con 4 funciones nuevas
      (chat x3 + contribution).
- [ ] `src/components/workspaces/Editor/LexicalEditor.tsx` acepta
      prop `collaborationConfig` y monta `CollaborationPlugin`.
- [ ] `src/components/workspaces/Editor/CursorPresence.tsx` creado
      y renderiza cursores remotos con color del autor.
- [ ] `src/components/workspaces/Chat/GroupChat.tsx` +
      `MessageList.tsx` creados y montados en la zona inferior
      derecha.
- [ ] `src/components/workspaces/Presence/MemberContributionBar.tsx`
      creado y montado en el panel "Colaboradores".
- [ ] `src/components/workspaces/Layout/ThreeZoneLayout.tsx`
      reemplazó placeholders de chat y colaboradores por los
      componentes reales.
- [ ] `src/hooks/useAutoSave.ts` + `useCharContributionTracker.ts`
      creados.
- [ ] `src/pages/Workspaces/WorkspaceEditor.tsx` integra todo.
- [ ] `npm run lint` limpio.
- [ ] `npm run typecheck` limpio.
- [ ] `npm test -- workspaces` pasa 100%.
- [ ] `npm run build` sin errores.

### 6.3 Verificación funcional manual (gap-finder Capa 5)

Con servidor local + 2 pestañas:

- [ ] Tipear en una pestaña → texto aparece en la otra <500ms.
- [ ] Bold, listas, links se replican entre pestañas.
- [ ] Cursor del otro usuario visible con barra de color + nombre.
- [ ] Topbar muestra avatares de los usuarios conectados.
- [ ] Indicador de saving transiciona: tipeo → "Guardando…" → 2s →
      "Guardado".
- [ ] Enviar mensaje en chat: aparece optimista, cambia a
      confirmado al recibir ACK, y se ve en la otra pestaña.
- [ ] Eliminar mensaje propio: desaparece en ambas pestañas.
- [ ] Desconectar red (chrome devtools offline) → indicador "Sin
      conexión". Reconectar → recupera estado, indicador "Guardado".
- [ ] Recargar pestaña → contenido + mensajes + colaboradores se
      restauran sin pérdida.
- [ ] Escribir offline (devtools Network → Offline) → texto persiste
      localmente vía `y-indexeddb`. Recargar pestaña aún offline →
      texto sigue ahí. Reconectar → sincroniza al server.
- [ ] Barra de contribución se actualiza tras 30s de tipeo
      continuado.
- [ ] Usuario no-miembro intentando `/workspaces/ws/{doc_id}` →
      rechazado con close code 4003.

### 6.4 Verificación de protocolo

- [ ] Branch `bloque-2b-colaboracion` creada desde `main`
      actualizado post-2a.
- [ ] Commits atómicos por fase (mínimo 9: uno por fase TDD).
- [ ] PR abierto contra `main` con link a este plan.
- [ ] Reportes de los 8 agentes en `docs/reports/2026-04-18-*-2b-
      colaboracion.md`.
- [ ] Quality scores Capa 2 y Capa 3 ≥ 85 (PASS).
- [ ] Gap-finder 0 críticos.
- [ ] Snapshot cierre en `docs/sessions/2026-04-18-XX-snapshot-
      bloque-2b.md`.

---

## 7. Fuera de scope

Explícitamente NO se implementa en 2b. Todo esto queda para 2c y 2d.

### 2c (Athena IA)
- Panel Athena lateral derecho (la zona "Borrador privado" sigue
  placeholder en 2b).
- Staging local con flujo Apply/Modify/Reject.
- Prompt literal Athena + `POST /workspaces/{id}/athena`.
- Rate limit por plan + tabla `athena_usage`.
- Modal upgrade al agotar cupo.
- Historial chat privado con Athena.

### 2d (features avanzadas)
- APA validation en tiempo real.
- Sistema extensible IEEE/Chicago/MLA.
- TOC automático (plugin TOCPlugin).
- Tapa personalizable + plantillas.
- Matemáticas (KaTeX + MathLive + SymPy + gráficos).
- Rúbrica upload + parser + checklist.
- Export PDF/DOCX con SSRF fix.
- Comentarios inline con threads.
- Menciones @usuario.
- Compartir URL con invitación completa (generación de tokens con
  expiración, roles por invitación).
- Plantillas de documento.
- Modo enfoque + modo presentación.
- Atajos de teclado completos + overlay `?`.
- STT/TTS.
- Arrastrar archivos al doc.
- Voice notes embebidas.
- Imprimir / Duplicar / Star / Búsqueda global.

### Fuera del Bloque 2 completo
- Integración con Biblioteca.
- Collaborative whiteboard.
- Task lists sincronizadas con calendario.
- Migración de datos V1.
- Borrado definitivo V1.

---

## 8. Componente legal

**¿2b tiene componente legal?** No de forma directa. Análisis:

- El chat grupal transporta texto libre entre miembros autenticados
  del workspace. No hay datos especiales (salud, menores, tributarios).
- La persistencia del chat en `workspace_messages` entra en el mismo
  régimen Ley 19.628 + GDPR que ya cubre la plataforma a nivel general
  — no agrega nuevos puntos críticos.
- Los mensajes se borran en cascada al borrar el workspace
  (ON DELETE CASCADE). No hay retención especial.
- Awareness transmite nombre + avatar + color, datos que el usuario ya
  publicó al registrarse. Ninguna novedad.
- No se procesan pagos, ni se muestra dato legal nuevo.

**Normas citadas en 2b**: ninguna directamente.

**Documentos legales a actualizar**:
- Política de Privacidad: podría mencionar que el chat grupal se
  comparte entre miembros del workspace, incluida historia previa a
  la incorporación de nuevos miembros (ver riesgo 5.9). **Acción
  sugerida al legal-docs-keeper**: audit pasivo al cerrar 2b, sin
  bloquear el merge.

**Flujo reforzado**: NO aplica. Se usa flujo 7 capas estándar.

**Nota**: si al implementar surge un ángulo legal no previsto (por
ejemplo, si el chat expone metadatos del sistema operativo del
usuario), se pausa y consulta.

---

## 9. Reporte obligatorio (plantilla para web-architect)

### 9.1 Lo que se me pidió

Cita literal de la instrucción de Cristian:

> "Produce el plan detallado del sub-bloque 2b Colaboración real-time
> del Bloque 2 Workspaces de Conniku. [...] Markdown en
> /Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/2b-
> colaboracion.md. Estructura estándar (igual que 2a-fundacion.md)
> [...] No escribas código. Lenguaje español chileno. Tests
> obligatorios en el plan. Cuando termines, avisa qué incertidumbres
> críticas pueden requerir OK explícito de Cristian antes de que los
> builders empiecen."

### 9.2 Lo que efectivamente hice

- Leí plan maestro completo (477 líneas).
- Leí plan 2a completo (855 líneas).
- Leí snapshot 2a cerrado (150 líneas).
- Leí `backend/workspaces_routes.py` completo (649 líneas).
- Leí `backend/collab_ws.py` completo (190 líneas) — referencia V1.
- Leí `backend/database.py` líneas 1920-1995 (confirmar
  `WorkspaceMessage` ya creada en 2a).
- Leí `backend/websocket_manager.py` primeras 60 líneas (patrón
  `chat_manager.authenticate`).
- Leí `backend/tests/test_workspaces_routes_crud.py` primeras 50
  líneas (patrón de skip).
- Leí `src/components/workspaces/Editor/LexicalEditor.tsx`,
  `editorConfig.ts`, `authorColors.ts`.
- Leí `src/components/workspaces/Layout/ThreeZoneLayout.tsx`.
- Leí `src/services/workspacesApi.ts`, `src/services/websocket.ts`
  primeras 40 líneas.
- Leí `src/pages/Workspaces/WorkspaceEditor.tsx` completo (154 líneas).
- Verifiqué `package.json` líneas 55-105: `yjs`, `y-websocket`,
  `y-prosemirror` están; `@lexical/yjs` **NO está**.
- Verifiqué FROZEN.md y `.claude/frozen-files.txt`: `package.json`
  sigue congelado.
- Listé `backend/tests/` + `src/__tests__/workspaces/` +
  `src/components/workspaces/__tests__/` para conocer layout actual
  de tests.
- Verifiqué `backend/server.py` líneas 24 y 277 (patrón
  `include_router` del V1 collab_ws).
- Produje este documento en
  `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/
  2b-colaboracion.md`.

### 9.3 Lo que no hice y por qué

- **No escribí código**: es rol de `backend-builder` y
  `frontend-builder` en Capa 1.
- **No ejecuté `npm install`**: el `/unfreeze package.json` sigue
  pendiente. Se delega a la Capa 1.
- **No elegí entre `y-websocket@3` API nueva vs alternativas**: sigo
  `y-websocket` ya en deps. Si el frontend-builder encuentra
  incompatibilidad concreta con `@lexical/yjs@0.21`, pausa y
  consulta.
- **No expandí el plan a 2c o 2d**: scope estricto 2b.
- **No planifiqué la lógica de `y-indexeddb`** para persistencia
  offline: se consideró y descartó por scope. Queda como deuda.
- **No investigué si el `y-protocols` package (sync / awareness) hace
  falta explícito**: `y-websocket` lo trae como dep transitiva. Si
  falta, el frontend-builder agrega en Fase 5.

### 9.4 Incertidumbres

- **Incertidumbre alta — `@lexical/yjs` API específica**: no verifiqué
  la firma exacta de `CollaborationPlugin` en la versión 0.21.0. La
  firma cambió entre 0.19 y 0.20. El frontend-builder debe consultar
  docs oficiales antes de Fase 7 y reportar si hay divergencia.
- **Incertidumbre alta — persistencia del snapshot `content_yjs`**: el
  plan asume que `Y.encodeStateAsUpdate(ydoc)` base64 cabe en
  `Column(Text)`. Para docs largos (>1MB), esto puede reventar el
  límite de la DB. En Postgres `Text` es ilimitado; en SQLite también.
  Pero el endpoint HTTP tiene un límite implícito de body (~10MB en
  FastAPI default). Si Cristian quiere soportar docs muy grandes,
  hace falta una estrategia de snapshot incremental. **Aceptable para
  2b**; se documenta para 2d.
- **Incertidumbre media — sincronización inicial con snapshot
  cargado**: al abrir un doc existente con snapshot Yjs guardado, el
  `CollaborationPlugin` espera que el server responda al `sync step
  1`. El backend `workspaces_ws.py` debe cargar `content_yjs` del doc
  y enviarlo al cliente apenas conecta. Este detalle crítico se
  documenta pero debe validarlo el backend-builder con lectura del
  código `y-websocket` server-side.
- **Incertidumbre media — `@lexical/yjs` requiere `UndoManager`
  distinto a `HistoryPlugin`**: removí `HistoryPlugin` cuando hay
  colab pero no verifiqué que el plugin de Yjs traiga su propio
  UndoManager conectado. Si no trae, Ctrl+Z deja de funcionar. El
  frontend-builder debe probar y, si falta, agregar `yUndoManager`
  manual.
- **Incertidumbre baja — convención naming `useAutoSave.ts` vs
  `useAutoSave.tsx`**: los hooks React en el proyecto usan `.ts` si
  no retornan JSX. Debo asumir que estos son `.ts`. Si el proyecto
  tiene patrón distinto, el builder ajusta.
- **Incertidumbre baja — close code `4010` no-estándar**: los close
  codes 4000-4999 son para uso de aplicación (RFC 6455). Elegir 4010
  es arbitrario pero consistente. Si conflicta con algún cliente
  WebSocket raro, se puede cambiar sin impacto funcional. Documentado.

---

**Estado del plan**: listo para revisión y aprobación de Cristian.

**Próxima acción**: Cristian ejecuta `/unfreeze package.json` y
autoriza iniciar Capa 1. Sin el unfreeze, el sub-bloque queda
parcialmente bloqueado (backend avanza, frontend pausa).
