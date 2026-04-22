---
name: Registro de Issues — Base de Conocimiento Anti-Errores
description: PERMANENTE: registro de todos los bugs/issues historicos y nuevos. Consultar ANTES de escribir codigo para prevenir errores repetidos.
type: feedback
originSessionId: a2c4cf6f-3022-4094-a7ee-54684dd27c7f
---
# Registro Completo de Issues — Conniku

> **USO:** Consultar este archivo ANTES de escribir codigo para evitar repetir errores.
> Cada entrada tiene: que paso, causa raiz, y como prevenirlo.
> Fecha de creacion: 2026-04-15. Se actualiza con cada nuevo issue encontrado.

---

## Patron de Errores por Categoria

### TypeScript/React

#### TSR-001: Hooks condicionales (React Rules of Hooks)
- **Que paso:** `BibliotecaDocumentos.tsx` y `HRDashboard.tsx` tenian guards (`if (!x) return`) ANTES de llamadas a `useEffect`, violando las reglas de hooks de React.
- **Causa:** Guard de early return colocado antes de los hooks en vez de despues.
- **Prevencion:** Todo guard/early return DEBE ir DESPUES de todas las llamadas a hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`). Jamas poner un `return` condicional antes de un hook.
- **Contexto:** React, cualquier componente funcional.

#### TSR-002: Null-safety — crash por .map/.flatMap/.length en datos undefined
- **Que paso:** 22+ crashes en produccion porque respuestas de API devolvian `null` o `undefined` donde se esperaba un array, y el codigo llamaba `.map()`, `.flatMap()`, `.length` directamente.
- **Archivos afectados:** Messages.tsx (5), Friends.tsx (9), Mentorship.tsx (3), GroupDocEditor.tsx (3), Dashboard.tsx (2), Communities.tsx (1), Conferences.tsx (1), UserProfile.tsx (3), Jobs.tsx (4), CommunityView.tsx (4).
- **Causa:** Asumir que la API siempre devuelve arrays. No validar la respuesta.
- **Prevencion:** SIEMPRE usar `Array.isArray(data) ? data : []` o `data?.map?.()` antes de iterar. SIEMPRE usar `(data?.length ?? 0)` en vez de `data.length`. Para `.then(setX)` patrones, usar `.then(r => setX(Array.isArray(r) ? r : []))`.
- **Contexto:** React, cualquier componente que consume API.

#### TSR-003: Endpoints fantasma — frontend llama a backend que no existe
- **Que paso:** 5+ endpoints en api.ts llamaban a rutas del backend que nunca fueron implementadas, causando 404 silenciosos o errores no manejados.
- **Endpoints fantasma encontrados:**
  - `GET /support/konni-broadcasts` (SupportChat.tsx)
  - `POST /support/konni-broadcasts/read` (SupportChat.tsx)
  - `POST /messaging/upload-media` (Messages.tsx)
  - `POST /tutors/classes/book` (UserProfile.tsx)
  - `GET /tutors/my-student-payments` (UserProfile.tsx)
  - `clockAttendance`, `getMyAttendance`, `getAllAttendance` (api.ts)
  - `calculateUpgradeProration`, `executeUpgrade` (api.ts — Stripe stubs)
- **Causa:** Frontend implementado sin verificar que el backend existiera. Codigo legacy de features abandonadas.
- **Prevencion:** ANTES de escribir una llamada API en el frontend, hacer GREP en el backend para confirmar que el endpoint existe. ANTES de eliminar un endpoint del backend, verificar que ningun frontend lo llame. Eliminar codigo fantasma cuando se encuentre (filosofia cero parasitos).
- **Contexto:** Full-stack, cualquier llamada API.

#### TSR-004: URLs hardcodeadas en lugar de env vars
- **Que paso:** 3 archivos tenian URLs de produccion directamente en el codigo fuente.
- **Archivos:** CollabEditor.tsx (linea 37), Courses.tsx (linea 2233), Messages.tsx (linea 1585, env var con fallback hardcodeado).
- **Causa:** Desarrollo rapido sin pasar por variables de entorno.
- **Prevencion:** NUNCA hardcodear URLs de produccion en el codigo. Siempre usar `import.meta.env.VITE_*` para URLs. Fallback hardcodeado es aceptable SOLO para desarrollo local, nunca para produccion.
- **Contexto:** Frontend, cualquier archivo con fetch/WebSocket/URL.

#### TSR-005: Ghost UI — elementos interactivos sin backend
- **Que paso:** Multiples toggles en Settings (privacidad, idiomas) se crearon sin backend. Botones visibles que no hacian absolutamente nada. Cristian perdio tiempo descubriendo esto.
- **Causa:** Frontend creado primero, backend "para despues" que nunca se implemento.
- **Prevencion:** Orden obligatorio: DB column -> Backend endpoint -> API mapping -> Frontend UI. NUNCA crear un boton/toggle/form sin verificar los 4 eslabones. Si falta cualquiera, crearlos primero. Reportar "boton fantasma" cuando se encuentre uno existente.
- **Contexto:** Full-stack, cualquier elemento interactivo.

#### TSR-006: Stale chunks despues de deploy
- **Que paso:** Usuarios recibian errores de "chunk not found" al navegar la app despues de un deploy, porque el Service Worker servia bundles viejos.
- **Causa:** Vite genera hashes nuevos en cada build. El SW cacheaba chunks viejos que ya no existian en el servidor.
- **Prevencion:** ErrorBoundary con deteccion de chunk errors y auto-reload. Service Worker con validacion de MIME type en estrategia cacheFirst. Implementado en SW v10.
- **Contexto:** Frontend, PWA, Vite, Service Worker.

#### TSR-007: Memory leaks en WebSocket/EventSource
- **Que paso:** CollabEditor.tsx tenia memory leaks por conexiones WebSocket que no se cerraban al desmontar el componente.
- **Causa:** Falta de cleanup en `useEffect` para conexiones persistentes.
- **Prevencion:** Todo `useEffect` que abra un WebSocket, EventSource, o interval DEBE tener un cleanup function que cierre la conexion. Patron: `useEffect(() => { const ws = new WebSocket(...); return () => ws.close(); }, [])`.
- **Contexto:** React, WebSocket, real-time features.

#### TSR-008: Tipo isMaxUser incorrecto
- **Que paso:** Campo `isMaxUser` tenia tipo incorrecto en TypeScript, causando error de compilacion.
- **Causa:** Mismatch entre el tipo esperado y el tipo real de la API.
- **Prevencion:** Verificar tipos contra la respuesta real de la API, no solo contra lo que se espera.
- **Contexto:** TypeScript, interfaces de API.

#### TSR-009: XSS en componentes que renderizan HTML de usuario
- **Que paso:** Auditoria encontro componentes que renderizaban contenido HTML sin sanitizar.
- **Causa:** Uso de `dangerouslySetInnerHTML` sin DOMPurify u otro sanitizer.
- **Prevencion:** NUNCA usar `dangerouslySetInnerHTML` sin sanitizar primero con DOMPurify. Todo contenido de usuario que se renderice como HTML DEBE pasar por sanitizacion.
- **Contexto:** React, seguridad, UGC.

### Python/FastAPI

#### PY-001: Doble-prefijo en rutas — 404 en produccion
- **Que paso:** `hr_routes.py` tenia `prefix="/hr"` en el router, pero 11 rutas internas tambien incluian `/hr/` en su path. Resultado: URLs reales eran `/hr/hr/attendance/...` en vez de `/hr/attendance/...`, causando 404.
- **Lineas afectadas:** 2865, 2938, 2989, 3014, 3035, 3101, 3115, 3138, 3187, 3224, 3251.
- **Causa:** Error de copy-paste al agregar rutas, sin verificar el prefix del router.
- **Prevencion:** Al agregar una ruta a un router con prefix, verificar que el path NO repita el prefix. Hacer grep para ver el prefix actual: `grep "prefix=" <routes_file>`. Verificar la URL resultante completa.
- **Contexto:** FastAPI, cualquier archivo *_routes.py.

#### PY-002: Ruff — errores descubiertos al commit, no al escribir
- **Que paso:** En Fase 0 de Biblioteca v2, errores de ruff (B904, E712, UP035, I001, UP045) se descubrieron recien al intentar el commit. El pre-commit hook de Husky bloqueo el push y hubo multiples rondas de correccion.
- **Causa:** No correr ruff inmediatamente despues de escribir codigo Python.
- **Prevencion:** Despues de CADA edicion de un archivo .py, correr `python3 -m ruff check <archivo>` inmediatamente. Corregir antes de pasar al siguiente archivo. NUNCA dejar lint para el final.
- **Contexto:** Python, cualquier archivo .py.

#### PY-003: Ruff --unsafe-fixes rompe Pydantic en Python 3.9
- **Que paso:** `ruff --fix` con `--unsafe-fixes` convirtio `Optional[int]` a `int | None` (union syntax). Pydantic en Python 3.9 no puede evaluar esta sintaxis porque `int | None` requiere Python 3.10+.
- **Causa:** Ruff aplica transformaciones modernas que no son compatibles con el runtime.
- **Prevencion:** NUNCA usar `--unsafe-fixes` con ruff. Despues de `ruff --fix`, verificar que no haya convertido `Optional[X]` a `X | None`. Si el backend corre en Python 3.9, mantener `Optional[X]` de `typing`.
- **Contexto:** Python 3.9, Pydantic, FastAPI.

#### PY-004: WebSocket — HTTP 500 por SecurityHeadersMiddleware
- **Que paso:** El middleware de seguridad bloqueaba conexiones WebSocket con error 403 porque intentaba agregar headers HTTP a una conexion WS.
- **Causa:** Middleware no distinguia entre request HTTP y WebSocket upgrade.
- **Prevencion:** Todo middleware HTTP DEBE verificar `scope["type"]` antes de aplicar logica. Si es "websocket", hacer passthrough sin modificar. Pattern: `if scope["type"] == "websocket": await self.app(scope, receive, send); return`.
- **Contexto:** FastAPI, ASGI, WebSocket.

#### PY-005: WebSocket — cerrar sin aceptar primero causa HTTP 500
- **Que paso:** Al cerrar un WebSocket que no habia sido aceptado, el server lanzaba un error 500.
- **Causa:** Llamar `ws.close()` antes de `ws.accept()`.
- **Prevencion:** SIEMPRE llamar `await websocket.accept()` antes de `await websocket.close()`. Si hay que rechazar una conexion WS, aceptar primero, enviar mensaje de error, luego cerrar.
- **Contexto:** FastAPI, WebSocket.

#### PY-006: Columnas faltantes en modelos SQLAlchemy
- **Que paso:** Multiples crashes porque el frontend/backend referenciaba columnas que no existian en la base de datos (ej: campos de Friendship, CalendarEvent).
- **Causa:** Agregar campos al modelo Python sin crear la migracion o sin verificar que la columna existiera.
- **Prevencion:** Al agregar un campo a un modelo SQLAlchemy: 1) agregar la columna, 2) crear/ejecutar migracion, 3) verificar con `_ensure_columns` o equivalente. NUNCA asumir que la columna existe solo porque esta en el modelo Python.
- **Contexto:** Python, SQLAlchemy, PostgreSQL.

#### PY-007: Cold start timeout en Render
- **Que paso:** El backend en Render se dormia, y al reconectar el LMS (Campus Virtual), el primer request recibia timeout porque el server aun estaba arrancando.
- **Causa:** Render free tier duerme el servidor despues de inactividad. El primer request tarda 15-30 segundos.
- **Prevencion:** Implementar pre-wake: enviar un request de health check ANTES del request real. Implementar retry con backoff en el frontend para requests criticos. Pattern implementado en `fix(lms): pre-wake server`.
- **Contexto:** Backend, Render, cold start.

#### PY-008: Orden de rutas — parametro captura ruta estatica
- **Que paso:** La ruta `/{doc_id}` en `biblioteca_routes.py` capturaba requests que debian ir a `/public-search` porque estaba definida ANTES.
- **Causa:** FastAPI evalua rutas en orden. Un parametro path (`{doc_id}`) matchea cualquier string, incluyendo "public-search".
- **Prevencion:** Rutas estaticas SIEMPRE antes de rutas con parametros path. Verificar el orden de todas las rutas del router al agregar una nueva.
- **Contexto:** FastAPI, routing.

#### PY-009: N+1 queries en social feed
- **Que paso:** Los endpoints de social feed ejecutaban una query por cada post para obtener likes/comments, causando O(n) queries.
- **Causa:** Consultas no optimizadas, sin batch loading ni joinedload.
- **Prevencion:** Usar batch queries o `joinedload`/`selectinload` de SQLAlchemy. Nunca iterar una lista y hacer una query por elemento. Si se detecta un loop con queries, refactorizar a batch.
- **Contexto:** Python, SQLAlchemy, performance.

#### PY-010: LMS — respuesta vacia/HTML en vez de JSON
- **Que paso:** La conexion con Moodle/Campus Virtual recibia respuestas HTML (pagina de login) en vez de JSON cuando la sesion expiraba, causando crash en `json.loads()`.
- **Causa:** No validar el content-type de la respuesta antes de parsear como JSON.
- **Prevencion:** SIEMPRE verificar que la respuesta sea JSON antes de parsear: comprobar `Content-Type: application/json` o hacer `try/except json.JSONDecodeError`. Tratar respuesta HTML como "sesion expirada".
- **Contexto:** Python, requests, integracion LMS.

#### PY-011: Path traversal en cache de biblioteca
- **Que paso:** Auditoria multi-agente encontro que el sistema de cache de biblioteca era vulnerable a path traversal — un usuario podia inyectar `../../etc/passwd` en el ID de documento para leer archivos del servidor.
- **Causa:** No sanitizar el input usado como path de archivo.
- **Prevencion:** NUNCA usar input de usuario directamente en paths de archivo. Sanitizar con `os.path.basename()` o validar contra un whitelist. Verificar que el path resultante este dentro del directorio esperado con `os.path.realpath()`.
- **Contexto:** Python, seguridad, file system.

#### PY-012: SSRF potencial en proxy de biblioteca
- **Que paso:** El endpoint de proxy para bibliotecas externas podia ser usado para hacer requests a URLs internas del servidor.
- **Causa:** No validar/restringir las URLs destino del proxy.
- **Prevencion:** Implementar whitelist de dominios permitidos para proxy. Bloquear URLs internas (127.0.0.1, localhost, 10.x.x.x, 192.168.x.x). Validar que la URL destino sea una fuente de biblioteca conocida.
- **Contexto:** Python, seguridad, proxy endpoints.

#### PY-013: Auth faltante en endpoint de iframe
- **Que paso:** Un endpoint que servia contenido en iframe no requeria autenticacion, permitiendo acceso anonimo a contenido restringido.
- **Causa:** Endpoint creado sin `Depends(get_current_user)`.
- **Prevencion:** TODOS los endpoints que sirvan contenido de usuario o de acceso restringido DEBEN tener autenticacion. Revisar cada endpoint nuevo para confirmar que tiene auth si es necesario.
- **Contexto:** FastAPI, seguridad, autenticacion.

### CSS/UI

#### CSS-001: Layout roto en mobile para paginas con tabs
- **Que paso:** La pagina de Configuracion tenia layout desktop que no funcionaba en mobile — tabs de navegacion ilegibles, header card desbordado.
- **Causa:** CSS solo pensado para desktop, sin media queries para mobile.
- **Prevencion:** TODO cambio de UI DEBE verificarse en viewport mobile (375px) Y desktop (1440px). Usar media queries. Preferir flexbox/grid responsive. Verificar con Preview en ambos tamanos.
- **Contexto:** CSS, responsive, mobile-first.

#### CSS-002: Scroll cortado por nav bar inferior en mobile
- **Que paso:** El contenido en la parte inferior de la pagina quedaba oculto detras de la barra de navegacion inferior en mobile.
- **Causa:** No agregar padding-bottom suficiente para compensar la altura de la nav bar.
- **Prevencion:** En paginas con scroll, agregar `padding-bottom` igual o mayor a la altura de la nav bar inferior (tipicamente 60-80px). Verificar scroll hasta el final en mobile.
- **Contexto:** CSS, mobile, PWA.

#### CSS-003: Foto de perfil centrada vs alineada
- **Que paso:** La foto de perfil estaba centrada en todos los tamanos de pantalla cuando debia estar alineada a la izquierda.
- **Causa:** CSS generico con `text-align: center` que afectaba la foto.
- **Prevencion:** Verificar visualmente cada cambio de layout con Preview. No asumir que un cambio de CSS no afecta otros elementos del mismo contenedor.
- **Contexto:** CSS, layout.

#### CSS-004: Proxy para resolver X-Frame-Options en iframes
- **Que paso:** Biblioteca Virtual mostraba pantalla negra al intentar mostrar contenido de Project Gutenberg en un iframe, porque el servidor enviaba `X-Frame-Options: DENY`.
- **Causa:** Intentar embeder contenido externo sin considerar las politicas de seguridad del servidor remoto.
- **Prevencion:** Si se necesita mostrar contenido externo en iframe, verificar PRIMERO si el servidor permite embedding (`X-Frame-Options`, `Content-Security-Policy frame-ancestors`). Si no permite, implementar proxy server-side que sirva el contenido sin esas headers.
- **Contexto:** Frontend, iframes, seguridad HTTP.

### Chrome Extension

#### EXT-001: Permisos minimos (Chrome Web Store policy)
- **Que paso:** Auditoria legal encontro que la extension solicitaba mas permisos de los necesarios para su funcionalidad.
- **Causa:** Permisos agregados "por si acaso" en vez de ser el minimo necesario.
- **Prevencion:** Solo solicitar los permisos ESTRICTAMENTE necesarios en manifest.json. Cada permiso debe tener una justificacion documentada. Chrome Web Store rechaza extensiones con permisos excesivos.
- **Contexto:** Chrome Extension, manifest.json.

#### EXT-002: Privacy policy obligatoria para Chrome Web Store
- **Que paso:** La extension no tenia privacy policy accesible, requisito obligatorio para publicar en Chrome Web Store.
- **Causa:** Documentacion legal no fue creada junto con la extension.
- **Prevencion:** Antes de publicar cualquier extension, tener: privacy policy, terms of service, consent flow. Documentos deben ser accesibles desde la UI de la extension Y desde el listing del Chrome Web Store.
- **Contexto:** Chrome Extension, legal, Chrome Web Store.

### Security

#### SEC-001: Rate limiting ausente en endpoints criticos
- **Que paso:** Auditoria encontro que no habia rate limiting en endpoints de autenticacion, chat, y API costosa (Claude/Athena).
- **Causa:** No implementado desde el inicio.
- **Prevencion:** Implementar rate limiting en: 1) login/register, 2) endpoints que consumen API de terceros (Claude, email), 3) endpoints de upload, 4) WebSocket connections. Usar middleware como `slowapi` o Redis-based rate limiter.
- **Contexto:** FastAPI, seguridad, backend.

#### SEC-002: WebSocket sin autenticacion
- **Que paso:** Conexiones WebSocket no validaban JWT, permitiendo que cualquier persona se conectara.
- **Causa:** Auth implementada solo en endpoints HTTP, no en WebSocket.
- **Prevencion:** Validar JWT en el handshake del WebSocket ANTES de `accept()`. Pasar token via query param o header. Si JWT es invalido, rechazar la conexion.
- **Contexto:** FastAPI, WebSocket, seguridad.

#### SEC-003: Validacion de file uploads ausente
- **Que paso:** Endpoints de upload no validaban tipo de archivo, tamano, ni contenido.
- **Causa:** Upload implementado sin verificaciones de seguridad.
- **Prevencion:** Validar: 1) extension del archivo, 2) MIME type real (no solo la extension), 3) tamano maximo, 4) contenido (virus scan si posible). Rechazar archivos ejecutables, scripts, y tipos no esperados.
- **Contexto:** FastAPI, seguridad, file uploads.

#### SEC-004: Session loss en cold start del backend
- **Que paso:** Cuando el backend de Render se dormia y despertaba, los usuarios perdian su sesion y eran deslogueados.
- **Causa:** Sesiones almacenadas en memoria del proceso, no en storage persistente.
- **Prevencion:** JWT tokens son stateless, pero si hay estado de sesion en memoria, debe persistirse en Redis o DB. Implementar token refresh transparente en el frontend.
- **Contexto:** Backend, Render, autenticacion.

### Legal/Compliance

#### LEG-001: Contenido CC-BY-NC-SA cacheado en plataforma comercial
- **Que paso:** Conniku (plataforma comercial) cacheaba y redistribuia contenido con licencia CC-BY-NC-SA, que prohibe uso comercial.
- **Causa:** No verificar la licencia de cada fuente antes de cachear.
- **Prevencion:** Contenido CC-BY-NC-SA NUNCA se cachea/redistribuye desde plataforma comercial. Redirigir al sitio original. Solo CC-BY, CC0, y Public Domain son cacheables.
- **Contexto:** Biblioteca, licencias, legal.

#### LEG-002: Atribucion CC insuficiente
- **Que paso:** Contenido CC-BY se mostraba sin la atribucion completa requerida por la licencia.
- **Causa:** Implementar la UI sin los campos de atribucion.
- **Prevencion:** Todo contenido CC-BY requiere: autor, copyright holder, link a licencia deed, link a fuente original. Estos 4 campos deben ser visibles en TODA interfaz donde se muestre el contenido.
- **Contexto:** Biblioteca, licencias, legal.

#### LEG-003: Trademark de Project Gutenberg en HTML modificado
- **Que paso:** Al modificar el HTML de Project Gutenberg (CSS, URL rewriting), se mantenia el trademark de PG, lo cual viola sus terminos.
- **Causa:** No leer los terminos de uso de PG antes de modificar su contenido.
- **Prevencion:** Si se modifica contenido de Project Gutenberg (HTML, CSS), DEBE removerse el trademark del header/footer. Alternativamente, mostrar el contenido sin modificaciones.
- **Contexto:** Biblioteca, Project Gutenberg, legal.

#### LEG-004: GDPR/Ley 19.628 — datos sin consentimiento explicito
- **Que paso:** Datos personales de estudiantes (notas, cursos, archivos) se recolectaban sin consentimiento explicito documentado.
- **Causa:** No implementar consent flow desde el inicio.
- **Prevencion:** Implementar consent flow antes de recolectar datos personales. Documentar que datos se recolectan y por que. Ofrecer derecho a eliminacion. Cumplir Ley 19.628 (Chile) y GDPR (usuarios europeos).
- **Contexto:** Extension, datos personales, legal.

#### LEG-005: Datos inventados en respuestas
- **Que paso (2026-04-09):** Se invento un RUT personal de ejemplo en una respuesta a Cristian.
- **Causa:** Generar datos ficticios en vez de pedir los datos reales.
- **Prevencion:** NUNCA inventar datos personales (RUTs, nombres, direcciones, telefonos). Si un dato es desconocido, dejarlo vacio y pedir el dato real.
- **Contexto:** Todos los modulos, especialmente RRHH y legal.

#### LEG-006: FERPA compliance para estudiantes US
- **Que paso:** La extension maneja education records que estan protegidos por FERPA para estudiantes de universidades estadounidenses.
- **Causa:** No considerar la regulacion americana en el scope del producto.
- **Prevencion:** Education records requieren consentimiento del estudiante. No compartir datos academicos con terceros sin autorizacion. Documentar compliance FERPA si se tiene usuarios US.
- **Contexto:** Extension, datos academicos, legal internacional.

### Database/SQLAlchemy

#### DB-001: Columnas faltantes despues de agregar campos al modelo
- **Que paso:** Campos `cover_position_y` (User), campos de Friendship, y campos de CalendarEvent no existian en la base de datos aunque el modelo Python los tenia.
- **Causa:** Agregar campos al modelo sin crear la migracion.
- **Prevencion:** Usar `_ensure_columns` o Alembic para crear la columna. Despues de agregar un campo al modelo, verificar que la columna exista en la DB antes de hacer queries que la usen.
- **Contexto:** SQLAlchemy, PostgreSQL, migraciones.

#### DB-002: Schema mismatch en calculatePayroll
- **Que paso:** El schema del request de `calculatePayroll` no coincidia entre frontend y backend, causando errores al calcular nomina.
- **Causa:** Frontend y backend evolucionaron independientemente sin sincronizar los schemas.
- **Prevencion:** Cuando se modifica un schema de API (request o response), actualizar AMBOS lados (frontend y backend) en el mismo commit. Documentar el schema esperado.
- **Contexto:** Full-stack, API schemas.

### Build/Deploy

#### BD-001: 14 deploys bloqueados por peer dependency conflict
- **Que paso (2026-04-12 a 2026-04-14):** `@tiptap/extension-collaboration-cursor@^2.26.2` (v2) conflictaba con `@tiptap/core@3.22.3` (v3). Vercel usa `npm install` estricto, generando `ERESOLVE` y build fallido.
- **Impacto:** 14 commits sin deploy, incluyendo un fix de seguridad critico.
- **Causa:** Instalar paquete de una version major diferente al ecosistema sin verificar peer deps.
- **Prevencion:** ANTES de `npm install <pkg>`: 1) `npm info <pkg>@<version> peerDependencies`, 2) verificar que todos los paquetes de la misma familia esten en el mismo major. Familias criticas: `@tiptap/*` (v3.22.x), `@capacitor/*` (v8.x), `react`+`react-dom` (misma version).
- **Contexto:** npm, Vercel, Vite.

#### BD-002: Crash silencioso post-upgrade — "build pasa" no es "funciona"
- **Que paso (2026-04-14 a 2026-04-15):** Se "arreglo" el conflicto subiendo `collaboration-cursor` a v3.0.0 y se dijo "no breaking changes (same API)" — FALSO. El paquete usa `y-prosemirror` internamente, pero `@tiptap/extension-collaboration@3.22.3` usa `@tiptap/y-tiptap`. Build pasaba, pero el editor crasheaba en runtime: `Cannot read properties of undefined (reading 'doc')`.
- **Impacto:** Trabajos Grupales completamente roto por dias sin que nadie lo detectara.
- **Causa:** Tratar "build exitoso" como "funciona". `vite build` verifica imports y tipos, NO verifica comportamiento runtime.
- **Prevencion:** Despues de CADA cambio de dependencia: 1) build local, 2) ABRIR LA FEATURE EN EL NAVEGADOR, 3) verificar consola del browser, 4) usar la feature. NUNCA decir "no breaking changes" sin probar en runtime.
- **Contexto:** npm, Vite, cualquier upgrade de dependencia.

#### BD-003: Vercel NO usa --legacy-peer-deps
- **Que paso:** Se asumio que Vercel resolveria conflictos de peer deps como se hacia localmente con `--legacy-peer-deps`.
- **Causa:** Diferencia entre entorno local (con `.npmrc` legacy) y entorno de CI/CD (estricto).
- **Prevencion:** Si se necesita `--legacy-peer-deps`, agregar `.npmrc` con `legacy-peer-deps=true` al repo. Mejor solucion: resolver los conflictos de peer deps correctamente.
- **Contexto:** Vercel, npm, deploy.

#### BD-004: Revert fallido por migracion AI engine
- **Que paso:** Se migro `gemini_engine` de OpenAI a Anthropic Claude Haiku, pero hubo que revertir inmediatamente.
- **Causa:** La migracion se hizo sin suficiente testing del nuevo provider.
- **Prevencion:** Cambios de provider de API (OpenAI -> Anthropic) requieren: 1) probar con los mismos inputs, 2) comparar outputs, 3) verificar rate limits y errores, 4) tener rollback plan antes de pushear.
- **Contexto:** Backend, API de terceros.

#### BD-005: lint-staged ejecutando ruff incorrectamente
- **Que paso:** `lint-staged` en `package.json` incluia `backend/**/*.py` y lo pasaba por el pipeline de git stash, causando conflictos y archivos corruptos.
- **Causa:** lint-staged esta disenado para archivos JS/TS, no para Python. El stash/unstash de lint-staged corrompia archivos Python.
- **Prevencion:** Python linting (ruff) DEBE correr independiente, NO a traves de lint-staged. Usar un pre-commit hook separado para Python. Removido de lint-staged, ahora ruff corre como script independiente en el pre-commit hook.
- **Contexto:** Husky, lint-staged, ruff, pre-commit hooks.

#### BD-006: Email SMTP vars faltantes en Render
- **Que paso:** Emails no se enviaban porque las variables SMTP (host, port, user, password) no estaban configuradas en Render.
- **Causa:** Variables de entorno existian solo localmente, no en produccion.
- **Prevencion:** Al implementar cualquier feature que use env vars nuevas, agregarlas INMEDIATAMENTE al dashboard de Render/Vercel. Listar TODAS las env vars necesarias en render.yaml.
- **Contexto:** Backend, Render, email, env vars.

#### BD-007: Android build roto por config invalido
- **Que paso:** Un archivo `config 2.xml` (con espacio en el nombre) rompia el build de Gradle para Android.
- **Causa:** Archivo duplicado con nombre invalido que no fue limpiado.
- **Prevencion:** No incluir archivos con espacios en el nombre en el proyecto Android. Verificar que no haya archivos duplicados o corruptos despues de operaciones de merge/copy.
- **Contexto:** Capacitor, Android, Gradle.

#### BD-008: Assets subidos sin verificacion visual
- **Que paso (2026-04-12):** Se subio un icono incorrecto y un feature graphic de baja calidad a Play Console sin verificar visualmente.
- **Causa:** Subir assets sin mostrarlos al usuario primero.
- **Prevencion:** SIEMPRE leer y mostrar al usuario cualquier asset (imagen, icono, screenshot) ANTES de subirlo a cualquier plataforma. NO tomar decisiones de diseno sin aprobacion explicita de Cristian.
- **Contexto:** Android, Play Console, assets.

#### BD-009: Buscar alternativas cuando el usuario ya proporciono el correcto
- **Que paso (2026-04-12):** Se buscaron logos antiguos del proyecto cuando Cristian ya habia adjuntado el logo correcto.
- **Causa:** No confiar en lo que el usuario proporciona y buscar "mejores" opciones.
- **Prevencion:** USAR SOLO lo que el usuario proporciona. No buscar alternativas a menos que el usuario lo pida explicitamente.
- **Contexto:** Todos los modulos, assets, diseno.

---

## Issues de Auditorias Multi-Agente (abril 2026)

### Hallazgos CRITICAL de Auditoria Fase 0-1 Biblioteca

| # | Issue | Tipo | Estado |
|---|-------|------|--------|
| 1 | Path traversal en cache de documentos | Security | Reportado |
| 2 | Auth faltante en endpoint iframe | Security | Reportado |
| 3 | SSRF potencial en proxy de biblioteca | Security | Reportado |
| 4 | Botones 404 — endpoints fantasma | Frontend | Parcial (5 eliminados) |
| 5 | Contenido CC-BY-NC-SA cacheado en plataforma comercial | Legal | Reportado |
| 6 | Atribucion CC-BY insuficiente | Legal | Reportado |
| 7 | GDPR/Ley 19.628 sin consent flow | Legal | Reportado |
| 8 | Encoding mismatch en respuestas proxy | Backend | Reportado |
| 9 | Null-safety crashes en 8+ componentes | Frontend | 22 corregidos, 8 pendientes |
| 10 | XSS en renderizado HTML de usuario | Security | Reportado |
| 11 | Rate limiting ausente | Security | Reportado |
| 12 | WebSocket sin auth | Security | Reportado |
| 13 | File upload sin validacion | Security | Reportado |
| 14 | Doble-prefijo en 11 rutas HR | Backend | Corregido |

### Hallazgos HIGH de Auditorias

| # | Issue | Tipo | Estado |
|---|-------|------|--------|
| 1 | 22 null-safety crashes en componentes React | Frontend | Corregidos |
| 2 | 8 null-safety crashes pendientes (Jobs.tsx, CommunityView.tsx) | Frontend | Pendiente |
| 3 | URLs hardcodeadas en 3 archivos | Frontend | Reportado |
| 4 | Stubs de Stripe (codigo muerto) | Cleanup | Eliminados |
| 5 | Hooks condicionales en 2 componentes | Frontend | Corregidos |
| 6 | lint-staged corrompiendo archivos Python | Build | Corregido |
| 7 | Memory leak WebSocket en CollabEditor | Frontend | Corregido |
| 8 | N+1 queries en social feed | Backend | Corregido |
| 9 | Cold start timeout en LMS | Backend | Corregido |
| 10 | Orden de rutas captura parametrica | Backend | Corregido |
| 11 | Respuesta HTML en vez de JSON en LMS | Backend | Corregido |
| 12 | Schema mismatch calculatePayroll | Full-stack | Reportado |
| 13 | Profile.tsx posible archivo huerfano | Cleanup | Eliminado |
| 14 | Session loss en cold start | Security | Corregido |
| 15 | Exam timer bug | Frontend | Corregido |
| 16 | CollabEditor memory leak fix | Frontend | Corregido |
| 17 | CalendarEvent columnas faltantes | DB | Corregido |
| 18 | Friendship columnas faltantes | DB | Corregido |

---

## Bugs Criticos Pendientes (al 15-abril-2026)

1. **Null-safety:** Jobs.tsx (4 crashes), CommunityView.tsx (4 crashes)
2. **Endpoints fantasma en api.ts:** clockAttendance, getMyAttendance, getAllAttendance, calculatePayroll schema mismatch
3. **URLs hardcodeadas:** CollabEditor.tsx, Courses.tsx, Messages.tsx
4. **Seguridad backend:** rate limiting, WS auth, webhook signatures, file upload validation
5. **Legal:** privacy policy, TOS, consent flow para extension Chrome
6. **UserProfile.tsx:** llamadas a getMyTutoringPayments/bookTutoringSession (endpoints inexistentes)

---

## Registro Historico Cronologico

| Fecha | Issue | Resolucion | Prevencion |
|-------|-------|------------|------------|
| 2026-04-09 | Invento RUT personal de ejemplo | Reportado a Cristian | Nunca inventar datos personales |
| 2026-04-12 | Icono incorrecto subido a Play Console | Resubido el correcto | Verificar visualmente todo asset antes de subir |
| 2026-04-12 | Feature graphic baja calidad sin preguntar | Rehecho | No tomar decisiones de diseno sin aprobacion |
| 2026-04-12 | Buscar logos cuando usuario adjunto el correcto | Usar el adjunto | SOLO usar lo que el usuario proporciona |
| 2026-04-12 a 2026-04-14 | 14 deploys bloqueados por collaboration-cursor v2 vs Tiptap v3 | Remover collaboration-cursor | Verificar peer deps antes de install |
| 2026-04-14 | Crash silencioso Trabajos Grupales por collaboration-cursor v3 | Remover extension completa | Build != funciona, probar en browser |
| 2026-04-14 | lint-staged corrompiendo archivos Python de biblioteca | Separar ruff del pipeline lint-staged | Python linting independiente de lint-staged |
| 2026-04-14 | 22 null-safety crashes en 8 componentes | Corregidos con Array.isArray guards | Siempre validar respuestas de API |
| 2026-04-14 | Doble-prefijo en 11 rutas HR (404) | Corregido prefix en paths | Verificar prefix del router al agregar rutas |
| 2026-04-14 | 5 endpoints fantasma eliminados de api.ts | Eliminados | Verificar existencia backend antes de crear llamada frontend |
| 2026-04-14 | Hooks condicionales en 2 componentes | Guards movidos despues de hooks | Early returns DESPUES de hooks |
| 2026-04-14 | Stubs de Stripe eliminados | Eliminados de api.ts y server.py | Filosofia cero parasitos |
| 2026-04-15 | Ruff errores descubiertos al commit | Politica: ruff inmediato post-edicion | Correr ruff despues de cada archivo .py |
| 2026-04-15 | Ruff --unsafe-fixes rompe Pydantic 3.9 | Revertido | No usar --unsafe-fixes en Python 3.9 |
| 2026-04-15 | Auditoria multi-agente: 40+ bugs en Biblioteca | Correccion en progreso | Lanzar 3 agentes auditoria antes de push |
| 2026-04-15 | SecurityHeadersMiddleware bloqueaba WebSocket | Fix: passthrough para WS | Middleware debe verificar scope type |
| 2026-04-15 | WebSocket close sin accept = HTTP 500 | Fix: accept antes de close | Siempre accept() antes de close() |
| 2026-04-15 | 7 bugs criticos en un commit: Friendship cols, CalendarEvent, XSS, WS leak, CollabEditor leak, exam timer | Corregidos | Auditoria pre-push obligatoria |
| 2026-04-15 | N+1 queries en social feed | Batch queries implementadas | Nunca query-per-item en loops |

---

## Errores Fase 0 — Biblioteca Cache Engine (2026-04-15)

| Lenguaje | Tipo | Sev | Error | Prevencion |
|----------|------|-----|-------|------------|
| PY | Logica | HIGH | `resp.content` (bytes raw) vs `resp.text` (str decodificado) — encoding mismatch al cachear | Siempre cachear `resp.text.encode("utf-8")`, no `resp.content` raw |
| PY | Performance | HIGH | `_search_cache` dict crecia sin limite — OOM potencial | Todo cache en memoria DEBE tener max_size + eviccion |
| PY | Logica | HIGH | `_extract_gutenberg_id` no capturaba URLs `/cache/epub/` | Al parsear URLs, listar TODOS los formatos conocidos |
| TS | UX | HIGH | Boton "Reintentar" no recargaba el iframe (key no cambiaba) | Cambiar `key` del componente requiere cambiar un valor en el key (retry counter) |
| PY | Logica | MEDIUM | `get_cached_path` podia retornar archivos `.tmp` | Excluir archivos temporales en lookups de cache |
| PY | Logica | MEDIUM | HTML vacio/corrupto servido desde cache sin validacion | Verificar `st_size > threshold` antes de servir archivos cacheados |
| TS | UX | MEDIUM | Fallback URL invalido para docs no-Gutenberg | Validar URL de fallback por `source_type` antes de mostrar |
| TS | Logica | MEDIUM | `display: iframeLoaded ? 'block' : 'block'` — siempre visible | Revisar ternarios que retornan el mismo valor en ambas ramas |
| PY | Compat | MEDIUM | `asyncio.Lock | None` syntax no funciona en Python 3.9 | Usar `Optional[]` o `from __future__ import annotations` (con cuidado) |
| PY | Compat | MEDIUM | `from __future__ import annotations` + ruff autofix rompe Pydantic en Py3.9 | NUNCA usar `--unsafe-fixes` de ruff. Tipos Pydantic deben ser evaluables en runtime |

## Errores Fase 1 — Adapter Pattern + OpenStax (2026-04-15)

| Lenguaje | Tipo | Sev | Error | Prevencion |
|----------|------|-----|-------|------------|
| PY | Seguridad | CRITICAL | `v2_read_content` requeria auth — iframe 401 | Endpoints que sirven a iframes NO deben tener auth |
| PY | Logica | CRITICAL | `source_url` no se guardaba en meta del cache — HTML rewriting roto | Verificar que TODA metadata necesaria se guarde en cache |
| TS | UX | CRITICAL | Clone/Save botones visibles para OpenStax pero backend rechaza | Si backend no soporta una operacion para un source_type, frontend NO debe mostrar el boton |
| TS | UX | CRITICAL | Filtro idioma aparecia en tab Academicos sin funcionar | Cada control de UI debe estar condicionado al tab donde tiene efecto |
| PY | Seguridad | HIGH | Path traversal via `external_id` en cache (`../../etc/passwd`) | SIEMPRE sanitizar componentes de path que vienen de user input |
| PY | Seguridad | HIGH | SSRF via `url.startswith("https://www.gutenberg.org")` matchea `gutenberg.org.evil.com` | Validar URLs parseando hostname exacto, no con `startswith` |
| PY | Logica | HIGH | `User.full_name` no existe en modelo User — AttributeError | SIEMPRE verificar que atributos/metodos existen en el modelo. GREP primero |
| PY | Performance | HIGH | `httpx.AsyncClient` creado nuevo por cada request (sin connection pooling) | Usar cliente compartido a nivel de modulo con `get_http_client()` |
| PY | Logica | HIGH | `_extra_meta` evaluado eagerly en kwargs antes de que download_fn lo popule | No pasar dicts que dependen de side-effects de closures como kwargs |
| TS | Logica | HIGH | `reading.is_saved` stale al hacer toggleSave en reader | Toda funcion que actualiza estado debe actualizar TODOS los estados que contienen ese dato |
| TS | Logica | HIGH | Import no usado (`X` de Icons) | Verificar imports no usados antes de commit |
| TS | UX | HIGH | Save button en reader toolbar falla silenciosamente (404) para Gutenberg/OpenStax | No mostrar controles interactivos para operaciones sin backend support |
| PY | Legal | HIGH | OpenStax CC-BY-NC-SA servido desde plataforma comercial | Detectar licencia NC y NO redistribuir — redirigir a fuente original |
| PY | Legal | HIGH | Atribucion CC insuficiente (falta copyright holder, link a licencia) | Incluir: autor, copyright holder, license deed URL, link a fuente |
| PY | Legal | MEDIUM | PG trademark en HTML modificado (viola PG License) | Si modificas HTML de PG, DEBES remover el trademark block |
| PY | Legal | MEDIUM | Upload sin certificacion de derechos (Ley 17.336) | Requerir confirmacion explicita de derechos antes de permitir uploads |
| PY | Logica | MEDIUM | Dedup por titulo solo — pierde libros diferentes con mismo nombre | Dedup por (titulo + source_type) |
| PY | Logica | MEDIUM | `write_to_cache` escritura no atomica — archivos corruptos si crash | Escribir a .tmp, luego rename (atomico en POSIX) |
| PY | Logica | MEDIUM | `_map_category` first-match por orden — "science" matchea antes que "computer science" | Ordenar mapeos del mas especifico al mas generico |
| PY | Seguridad | MEDIUM | Path traversal via `project_id` en share/clone endpoints | Sanitizar o validar que el path resuelto esta dentro del directorio esperado |
| PY | Logica | MEDIUM | `download_content` type annotation 2-tuple vs 3-tuple (ABC vs implementation) | ABC y todas las implementaciones deben tener la MISMA firma |
| TS | UX | MEDIUM | `@keyframes spin` no definido globalmente — spinner estatico | Verificar que las animaciones CSS referenciadas estan definidas |
| TS | UX | MEDIUM | Star button no-funcional visible en cards de Gutenberg/OpenStax | No renderizar controles interactivos sin funcionalidad |

---

## Meta-Patrones (Patrones de Errores Recurrentes)

### 1. "Build pasa = funciona" (FALSO)
- Aparece en: BD-002, feedback_proactive_analysis, feedback_endtoend_verification
- Realidad: `vite build` verifica tipos e imports. NO verifica runtime, inicializacion de librerias, ni funcionalidad.
- Regla: SIEMPRE probar en browser despues de build.

### 2. "Crear UI sin backend" (Ghost UI)
- Aparece en: TSR-005, feedback_no_ghost_ui, quality_advisory_protocol
- Realidad: Un boton sin backend es PEOR que ningun boton.
- Regla: DB -> Backend -> API -> Frontend. En ese orden, siempre.

### 3. "Asumir sin verificar"
- Aparece en: TSR-003, LEG-005, feedback_accuracy, feedback_honest_diagnosis
- Realidad: Asunciones causan cascadas de errores.
- Regla: GREP antes de afirmar. Leer antes de editar. Preguntar antes de ejecutar.

### 4. "Arreglar rapido sin entender la raiz"
- Aparece en: BD-002, PY-010, feedback_honest_diagnosis
- Realidad: Un fix superficial crea un bug mas profundo.
- Regla: Investigar el flujo COMPLETO antes de proponer un fix. Frontend -> API -> Backend -> DB.

### 5. "Avanzar sin corregir"
- Aparece en: agent_prevention, BD-001
- Realidad: Errores acumulados causan cascadas (14 deploys bloqueados).
- Regla: Cero tolerancia. Error encontrado = construccion detenida hasta corregir.

### 6. "Lo que no verifico, no existe"
- Aparece en: PY-011, PY-012, TSR-003, feedback_accuracy
- Realidad: Atributos, metodos, endpoints, archivos pueden no existir aunque se asuma que si.
- Regla: GREP primero. Nunca asumir existencia.

### 7. "Ternarios ciegos"
- Aparece en: Fase 0 Biblioteca (`display: iframeLoaded ? 'block' : 'block'`)
- Realidad: Ternarios que retornan el mismo valor en ambas ramas son bugs silenciosos.
- Regla: Verificar que los 3 valores de cada ternario JSX son distintos y correctos.

### 8. "iframe no es fetch"
- Aparece en: Fase 1 Biblioteca (v2_read_content 401), CSS-004
- Realidad: Los iframes NO envian Authorization headers. Endpoints para iframe DEBEN ser publicos.
- Regla: Todo endpoint que sirve a un iframe NO debe tener `Depends(get_current_user)`.

### 9. "startswith no es hostname validation"
- Aparece en: Fase 1 Biblioteca (SSRF)
- Realidad: `url.startswith("https://example.com")` matchea `example.com.evil.com`.
- Regla: Parsear URL con `urllib.parse.urlparse()` y validar hostname exacto.

### 10. "Cache metadata debe ser completa"
- Aparece en: Fase 1 Biblioteca (source_url perdido)
- Realidad: Todo dato necesario al SERVIR del cache debe guardarse al ESCRIBIR al cache.
- Regla: No depender de datos en memoria. El cache debe ser autocontenido.

### 11. "Escrituras atomicas en cache/archivos"
- Aparece en: Fase 1 Biblioteca (write_to_cache)
- Realidad: Si el proceso crashea durante una escritura, el archivo queda corrupto.
- Regla: Escribir a `.tmp`, luego `os.rename()` (atomico en POSIX).

### 12. "Connection pooling obligatorio"
- Aparece en: Fase 1 Biblioteca (httpx.AsyncClient por request)
- Realidad: Crear un cliente HTTP por request desperdicia conexiones TCP y memoria.
- Regla: Usar cliente compartido a nivel de modulo. Patron: `get_http_client()`.

### 13. "Pydantic + from __future__ + Python 3.9 = explosion"
- Aparece en: PY-003, Fase 0 Biblioteca
- Realidad: `from __future__ import annotations` convierte type hints en strings. Pydantic v2 en Python 3.9 no puede evaluar `int | None` como string.
- Regla: Usar `Optional[int]` en modelos Pydantic cuando el runtime es Python 3.9.

### 14. "Frontend y backend deben estar sincronizados"
- Aparece en: TSR-003, TSR-005, DB-002, Fase 1 Biblioteca
- Realidad: Si el backend no soporta una operacion para un source_type, el frontend NO debe mostrar el control.
- Regla: Verificar sincronizacion de schemas, source_types, y operaciones disponibles entre frontend y backend.

### 15. "Cambiar tipo optional a required rompe callers existentes"
- Aparece en: Fase 4 Biblioteca (rights_confirmed: boolean rompió ProjectView.tsx)
- Realidad: Al agregar un campo requerido a un tipo en api.ts, TODOS los callers existentes deben ser actualizados.
- Regla: Usar `?` (optional) si el campo no es siempre necesario. Verificar TODOS los callers antes de cambiar un tipo.

### 16. "NUNCA omitir auditoría triple antes de push"
- Aparece en: Fase 4 Biblioteca (push sin auditoría → bug HIGH en producción)
- Realidad: ruff + tsc detectan sintaxis. Los agentes detectan lógica, seguridad, legal, flujos rotos.
- Regla: La auditoría triple (Python + TS/React + Legal) NO es reemplazable por checks de lint. Es obligatoria.

### 17. "Licencias CC requieren atribución específica"
- Aparece en: Fase 1 Biblioteca (auditoría legal)
- Realidad: CC-BY requiere autor + copyright holder + license deed URL + link a fuente. CC-BY-NC-SA: todo lo anterior + NO redistribuir desde plataforma comercial.
- Regla: Detectar is_nc en contenido externo. NC → no cachear, redirigir a fuente original.

### 18. "PG trademark debe removerse al modificar HTML"
- Aparece en: Fase 1 Biblioteca (auditoría legal)
- Realidad: Project Gutenberg License exige remover trademark si se modifica el HTML (CSS, URL rewriting).
- Regla: _strip_pg_license() en todo HTML de Gutenberg que se modifique.
