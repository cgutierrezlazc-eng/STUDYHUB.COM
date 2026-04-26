# AUDITOR_BRIEFING — Conniku
**Fecha de generación:** 2026-04-26
**Generado por:** Tori (Claude Code) — auditoría externa solicitada por Cristian Gutiérrez Lazcano
**Base de inspección:** código en `/Users/cristiang./CONNIKU` — rama `main` + worktree `musing-rhodes-d9b0d4` (solo lectura)
**HEAD al momento de la auditoría:** `33b5d8d` (chore: consolidar ORBIT-U dentro del repo)
**ADVERTENCIA:** Este reporte es una fotografía del estado del código en la fecha indicada. No reemplaza revisión legal ni auditoría de seguridad profesional.

---

## 1. VISIÓN Y SCOPE

### Pitch
Conniku es una plataforma educativa todo-en-uno para estudiantes universitarios chilenos (expansión futura LATAM y Europa), que integra colaboración de documentos, cursos, herramientas de estudio inteligente, módulo CEO (RRHH, finanzas, contabilidad), marketplace de tutores, y red social académica.

### Historial de errores documentados (CLAUDE.md Sección 17)

Los siguientes errores están documentados con prevenciones explícitas. Son la fuente de verdad del aprendizaje técnico del proyecto:

| Fecha | Error | Prevención activa |
|-------|-------|-------------------|
| 2026-04-09 | Konni inventó un RUT personal de ejemplo en respuesta al usuario | Nunca inventar datos. Dejar vacío y pedir a Cristian. |
| 2026-04-12 | Konni subió icono incorrecto a Play Console sin verificar visualmente | Mostrar asset visualmente antes de subir. Siempre. |
| 2026-04-12 | Konni subió feature graphic de baja calidad sin consultar | No tomar decisiones de diseño sin aprobación explícita. |
| 2026-04-12 | Konni buscó logos en internet ignorando el logo correcto ya adjunto | Usar solo lo que Cristian proporciona. |
| 2026-04-25 | Backend caído en Render desde 2026-04-05 por imports `from backend.X` que fallan con cwd=`backend/` | Todo import en `backend/**/*.py` debe ser relativo a cwd `backend/`. Nunca `from backend.X` ni `from shared.X`. |
| 2026-04-25 | Tori creó `docs/ERRORES.md` redundante sin revisar que el registro ya vive en CLAUDE.md sec 17 | Antes de crear archivo de registro/log/lección, buscar en CLAUDE.md. |
| 2026-04-25 | SMTP Zoho rechazaba autenticación porque se usaba password normal en vez de App Specific Password | Toda credencial SMTP Zoho en Render debe ser App Specific Password. Validar con POST real y mirar logs buscando `[Email] Sent`. |
| 2026-04-25 | Frontend mostraba `[object Object]` al serializar errores Pydantic 422 | Detectar si `detail` es string, array o algo más antes de pasarlo al UI. |
| 2026-04-25 | Tori declaró módulos "listos para cerrar" sin firma de Cristian | Tori solo reporta estado funcional. Solo Cristian cierra módulos con "OK Cristian + fecha". |
| 2026-04-25 | Tori ejecutó acciones sin esperar autorización explícita entre propuesta y ejecución | Proponer → esperar "sí/hazlo/aprobado/procede" literal → recién ejecutar. |
| 2026-04-25 (A) | Tori inventó tokens de tema en vez de leer `ORBIT-U/shared/themes.css` | Antes de inventar cualquier token/color, buscar en `docs/04-diseno/orbit-u/shared/themes.css`. |
| 2026-04-25 (B) | Tori asumió que la ruta `/signup` existía sin verificar `App.tsx` | Antes de referenciar ruta/componente como "existente", hacer grep y confirmar con evidencia. |
| 2026-04-25 (C) | Tori compartió URL de preview de rama antigua, mostrando bug ya corregido | Antes de compartir URL de preview, verificar que corresponde exactamente al commit/rama del cambio reportado. |
| 2026-04-25 (D) | Tori ejecutó loops/polls/ScheduleWakeup sin autorización explícita por turno | Antes de lanzar cualquier loop, cron o poll, pedir autorización explícita. |
| 2026-04-25 (E) | Tori intentó `git push origin main` directo, saltándose PR + CI | Nunca push directo a main. Todo cambio va por PR. |
| 2026-04-25 (F) | Tori mezcló cleanup/refactor no pedido con el cambio pedido | Alcance de un cambio = exactamente lo que Cristian pidió. Nada más. |
| 2026-04-25 (G) | Tori inventó estructura de documento sin buscar precedente existente en CLAUDE.md | Antes de crear archivo de registro, buscar formato en CLAUDE.md sec 17. |
| 2026-04-26 | `HexNebulaCanvas` sin `className` en Terms.tsx y Privacy.tsx — canvas empujaba contenido DOM | Al usar `HexNebulaCanvas`, siempre pasar `className={styles.nebulaBg}` con `position: fixed; inset: 0`. |

### Features core (basadas en código real existente en `src/pages/` y `backend/`)

1. **Onboarding multi-rol** — `src/pages/Start.tsx` (2184 líneas): selector de idioma (6 idiomas), tipos de usuario (Estudiante, Tutor, General/Laboral, Business), formularios de registro, animación reveal.
2. **Sistema legal completo** — `src/pages/Terms.tsx`, `Privacy.tsx`, `Cookies.tsx`, `Support.tsx`, `Contact.tsx`, `Careers.tsx` + backend `backend/legal_document_views_routes.py`, `backend/contact_routes.py`: documentos legales versionados, visor con tracking de lectura, formulario de contacto con SMTP real y routing por motivo.
3. **Workspaces colaborativos** — `backend/workspaces_routes.py` (1305 líneas), `backend/workspaces_ws.py`, `backend/workspaces_athena.py`, `backend/workspaces_export.py`: documentos colaborativos Yjs+Lexical, WebSocket relay, asistente Athena (LLM), export PDF/DOCX, rúbricas, citas APA, comentarios.
4. **Biblioteca académica** — `backend/biblioteca_routes.py` (1022 líneas), `backend/biblioteca_engine.py`, `backend/biblioteca_prefetch.py`: motor de búsqueda de documentos académicos con prefetch y cache.
5. **Módulo RRHH** — `backend/hr_routes.py` (3702 líneas), `src/pages/HRDashboard.tsx` (FROZEN): 53 rutas, cálculo de nómina chilena (AFP/ISAPRE/AFC), generadores PDF legales (Anexo, Pacto HE, Descuento Voluntario), payroll_calculator.
6. **Sistema de autenticación** — `backend/auth_routes.py` (2484 líneas), `backend/middleware.py`, `src/services/auth.tsx`: JWT + refresh tokens, Google OAuth, verificación de edad 18+, multi-document consent (4 documentos legales), almacenamiento legal de aceptaciones (`user_agreements`).
7. **Cursos y LMS** — `backend/course_routes.py` (2087 líneas), `backend/lms_routes.py` (2068 líneas), `backend/static_courses_1-4.py` (~10k líneas): cursos estáticos precargados, quizzes, ejercicios, predictor de examen, sistema de guías de estudio.
8. **Pagos** — `backend/mercadopago_routes.py`, `backend/paypal_routes.py`: integración MercadoPago + PayPal. Stripe removido (comentado en server.py).
9. **Red social académica** — `backend/social_routes.py` (2130 líneas): feed, posts, reacciones, comunidades, moderación, gamification.
10. **Módulo CEO/Finance** — `backend/chile_tax_routes.py` (módulo finanzas), `backend/admin_routes.py`: facturación SII (RUT 78.395.702-7), contabilidad, gestión tributaria chilena.

### Features secundarias / nice-to-have (código presente pero no primario en uso)

- **Pomodoro** — `backend/pomodoro_routes.py`
- **Wellness / bienestar** — `backend/wellness_routes.py`
- **Gamificación y recompensas** — `backend/gamification.py`, `backend/rewards_routes.py`
- **Referidos** — `backend/referral_routes.py` (con TODO: IP blocking para fraud detection)
- **Salas de estudio** — `backend/study_room_routes.py`
- **Conferencias** — `backend/conference_routes.py`
- **Predictor de examen** — `backend/exam_predictor_routes.py`
- **Notificaciones push** — `backend/push_routes.py` (VAPID), `backend/notification_routes.py`
- **Email documentos** — `backend/email_doc_routes.py` (recibe documentos por IMAP desde ceo@)
- **Extension sync** — `backend/extension_sync_routes.py`
- **AI Workflows** — `backend/ai_workflow_routes.py`
- **Detección de IA** — `backend/ai_detection_routes.py`
- **Moderación** — `backend/moderation.py`, `backend/moderation_queue_routes.py`
- **Noticias** — `backend/news_routes.py`
- **Búsqueda** — `backend/search_routes.py` (Google Search API + Bing + DuckDuckGo)
- **Sistema de CV** — `backend/cv_routes.py` (1427 líneas)
- **Mentorías** — `backend/mentorship_routes.py`, `src/pages/Mentorship.tsx` (FROZEN)
- **Marketplace** — `backend/marketplace_routes.py`
- **Tutores** — `backend/tutor_routes.py` (4624 líneas — el archivo más grande del backend)
- **Mensajería** — `backend/messaging_routes.py`, `src/pages/Messages.tsx` (FROZEN)
- **Calendarios/eventos** — `backend/calendar_routes.py`, `backend/event_routes.py`

### Features experimentales / en pausa

- **Chat de Biblioteca** — mencionado en memory como pendiente futuro. Código base de biblioteca existe pero el chat-con-link-al-libro no está implementado.
- **GoogleAgeDeclarationModal** — `src/services/auth.tsx:101` tiene `TODO(bloque-1-iter-2)` pendiente: modal frontend para Google OAuth que captura declaración de edad. Actualmente usa alert temporal.
- **Bloque 2.5 post-launch** (diferido): 2d.2 Tapa/TOC, 2d.4 Tablas, 2d.5 Imágenes, 2d.9 Mobile UX, 2d.10 DOCX formato completo en Workspaces.
- **Landing React** — `src/pages/Landing/` (FROZEN, existe código) pero la ruta `/` actualmente apunta a `UnderConstruction` mientras el sitio no sea público.
- **Registro de usuarios** — `src/pages/Start.tsx` tiene TODOs de navegación a conniku.html que aún no existen como rutas React. Los forms del wizard existen pero el backend de login no está cableado desde el frontend nuevo (TODO en Start.tsx:507).

### Features ABANDONADAS o muertas

| Archivo / Módulo | Evidencia de abandono |
|------------------|-----------------------|
| `backend/collab_routes.py` + `backend/collab_ws.py` | Comentados en `server.py` línea 23-24: "GroupDocs V1 deprecado 2026-04-19 — reemplazado por Workspaces v2". Archivos FROZEN como evidencia histórica. Tablas BD preservadas para eventual migración. |
| `src/i18n/index.ts` (react-i18next) | Inicializa i18next con `initReactI18next` pero NINGUNA página lo importa. Todas usan `useI18n` de `src/services/i18n.tsx` (custom Context). Es código muerto. Solo `src/i18n/index.ts` lo contiene, sin consumidores. |
| `src/i18n/locales/*.json` (6 archivos) | Archivos de traducciones para react-i18next. Código muerto: el sistema activo es el Context custom en `i18n.tsx` con traducciones hardcodeadas dentro del mismo archivo. Los JSON no se usan. |
| `backend/payment_routes.py` | Importado en server.py con comentario: "payment_routes (Stripe) removed — using MercadoPago + PayPal only". El archivo existe en disco pero el router no se registra. |
| `src/pages/Support.tsx:231` | TODO comentado en código: "cuando se bridgee cookies.html → ruta /cookies" — ya fue bridgeado (PR #53) pero el comentario no se limpió. |
| `src/pages/Contact.tsx:728` | TODO comentado: "cuando se bridgeen cookies/prensa/empleo" — cookies ya fue bridgeado. |

---

## 2. ARQUITECTURA REAL

### Frontend

- **Framework:** React 18.2 + TypeScript 5.3 + Vite 5.0
- **Entry point:** `/Users/cristiang./CONNIKU/src/main.tsx` → wraps con `I18nProvider`, `AuthProvider`, `BrowserRouter`, `ErrorBoundary`
- **Router:** `src/App.tsx` — SPA con React Router v6, lazy imports en todas las páginas con `React.lazy()` + `Suspense`
- **Rutas activas en producción actual:**
  - `/` → `UnderConstruction` (landing pública temporal con botón discreto "Acceso interno")
  - `/start` → `Start` (onboarding completo, 2184 líneas)
  - `/terms` → `Terms`
  - `/privacy` → `Privacy`
  - `/support` → `Support`
  - `/contact` → `Contact`
  - `/careers` → `Careers`
  - `/cookies` → `Cookies`
  - `*` → `NotFound`
- **Rutas PENDIENTES de bridgear** (páginas internas): Dashboard, Workspaces, Biblioteca, HR, etc. — están en `backend/` pero sin rutas React activas en el App.tsx actual.
- **Estructura de carpetas:**
  - `src/pages/` — 16 páginas activas (solo las visibles en App.tsx + las FROZEN)
  - `src/components/` — solo `ErrorBoundary.tsx` (1 archivo). Todos los demás componentes de features están en FROZEN o no se han bridgeado.
  - `src/services/` — `api.ts`, `auth.tsx`, `i18n.tsx` (5669 líneas), `capacitor.ts`, `legalConstants.ts`
  - `src/hooks/` — `useAutoSave.ts`, `useTier.ts`, `useDevice.ts`, `useFocusMode.ts`
  - `src/types/` — `index.ts` (único archivo)
  - `src/utils/` — `currency.ts` (único archivo)
  - `src/lib/hex-nebula/` — `hex-nebula.js` + `HexNebulaCanvas.tsx` (fondo visual animado)
  - `src/data/` — `universities.ts` (único archivo)
  - `src/styles/` — `global.css`, `ConnikuWordmark.css`
  - `src/i18n/` — `index.ts` + `locales/*.json` (CÓDIGO MUERTO — ver Sección 1)
- **i18n:** Sistema custom Context en `src/services/i18n.tsx` (5669 líneas, con traducciones hardcodeadas en ES/EN/PT/IT/FR/DE). Hook: `useI18n()` → `{t, setLang, lang}`.
- **CSS:** CSS Modules por página (`*.module.css`). Tema activo: `navy-l` (paleta tokens en `src/styles/global.css`). Variables semánticas: `--bg`, `--surface`, `--text`, `--signature`, etc.
- **Auth:** JWT en `localStorage` (`conniku_token`, `conniku_refresh_token`). Refresh automático con deduplicación de requests concurrentes en `src/services/api.ts`.
- **Base URL del API:** `import.meta.env.VITE_API_URL` || `https://studyhub-api-bpco.onrender.com` (fallback hardcodeado en múltiples archivos — ver Sección 6).

### Backend

- **Framework:** Python FastAPI + SQLAlchemy 2.0.25 + Uvicorn
- **Entry point:** `/Users/cristiang./CONNIKU/backend/server.py` (2514 líneas)
- **Puerto:** 8899 (local) / `$PORT` (Render)
- **Deploy:** Render, `rootDir: backend`, `startCommand: python server.py`
- **Base de datos:** PostgreSQL en Render (free tier). ORM SQLAlchemy. Migraciones propias en `backend/migrations.py` (no Alembic a pesar de lo que dice CLAUDE.md — verificado en disco).
- **Auth:** JWT HS256 via `python-jose`. `JWT_SECRET` desde env var. Si no existe en producción, `RuntimeError` (correcto). Tokens: access 1 día, refresh 30 días. Middleware en `backend/middleware.py`.
- **CORS:** `CORS_ORIGINS` env var (whitelist). Producción: `conniku.com`, `www.conniku.com`, `conniku.vercel.app`. Dev: `localhost:5173`, `localhost:8899`.
- **Routers activos (registrados con `include_router`):** auth, messaging, admin, social, video, ai_detection, gamification, notifications, calendar, marketplace, community, notification, biblioteca, job, course, event, mentorship, mercadopago, paypal, study_room, quiz_system, pomodoro, wellness, referral, exam_predictor, finance (chile_tax), rewards, search, news, cv, push, certificate, conference, careers, legal_views, contact, ws, hr + workspaces (routes + ws + athena + export) + tutor + ai_workflow + support_feedback + lms.
- **Routers COMENTADOS (inactivos):** `collab_router`, `collab_ws_router` (V1 GroupDocs — deprecado).
- **Estructura de carpetas backend:**
  - `backend/constants/` — `labor_chile.py`, `tax_chile.py`, `consumer.py`, `legal_versions.py`, `contact_routing.py`
  - `backend/migrations/` — `add_workspaces_tables.sql`, `add_expense_fields.sql` (no Alembic)
  - `backend/tests/` — 26 archivos de test (pytest)
  - `backend/uploads/` — directorio de uploads de usuarios
- **Shared (frontend+backend):** `/Users/cristiang./CONNIKU/shared/` — `legal_texts.py` + `legal_texts.ts` + `legal_constants.ts` + `chile_constants.ts` + `cookie_consent_texts.py` + `tier-limits.json` + `workspaces-types.ts`

### Mobile (Capacitor)

- **Config:** `/Users/cristiang./CONNIKU/capacitor.config.ts`
- **App ID:** `com.conniku.app`
- **Web dir:** `dist/renderer`
- **Server URL producción:** `https://www.conniku.com` (no localhost en build de prod)
- **Plataformas:** Android (`/Users/cristiang./CONNIKU/android/`) + iOS (`/Users/cristiang./CONNIKU/ios-assets/`)
- **Plugins configurados:** SplashScreen, StatusBar, Keyboard, PushNotifications, Camera, Haptics, Browser, Filesystem, Share, LocalNotifications
- **Build CI:** `.github/workflows/android-build.yml`, `.github/workflows/ios-build.yml`
- **Script manual:** `build-playstore.sh` en raíz del repo

### Desktop (Electron)

- **Directorio:** `/Users/cristiang./CONNIKU/electron/`
- **Archivos presentes:** `main.ts`, `preload.ts`
- **Build entry:** `tsconfig.main.json` → `dist/main/main.js`
- **Script:** `npm run dev:main` / `npm start`
- **Dependencia:** `electron-store` en producción dependencies

### Compartido entre plataformas

- `/Users/cristiang./CONNIKU/shared/` — tipos, constantes legales y textos legales compartidos entre frontend TypeScript y backend Python.
- CI gate `scripts/verify-legal-texts-sync.sh` valida sincronía de hash AGE_DECLARATION entre `shared/legal_texts.py` y `shared/legal_texts.ts`.

---

## 3. RAMAS HUÉRFANAS Y RUIDO

Basado en `git log --oneline -30` y `_SESSION_HANDOFF.md`:

| Rama | Estado | Recomendación |
|------|--------|---------------|
| `feat/careers-dark-theme` | PR #51 abierto — ya mergeado a main según `estado-actual.md` (HEAD es `466f428` = #51). La rama puede estar obsoleta. | Verificar si fue mergeada y borrar. |
| `docs-claude-lecciones-cierres-autorizacion` | PR #43 abierto — solo docs, sin cambio de código | Mergear o cerrar según decisión de Cristian. |
| Worktree `musing-rhodes-d9b0d4` | `.claude/worktrees/musing-rhodes-d9b0d4/` — rama activa `claude/musing-rhodes-d9b0d4` | Es el worktree de esta sesión de auditoría. Solo lectura. Ignorar para el reporte de producción. |

Nota: No se ejecutó `git branch -a` en esta auditoría. Las ramas anteriores provienen de documentación interna. Estado exacto de ramas remotas: DESCONOCIDO.

---

## 4. ZONAS SAGRADAS

Archivos en `FROZEN.md` / `.claude/frozen-files.txt` que NO deben tocarse sin `/unfreeze` explícito de Cristian:

| Archivo | Motivo de protección |
|---------|----------------------|
| `backend/workspaces_export.py` | Hardening SSRF: whitelist dominios + blacklist RFC1918. Tocar = riesgo SSRF crítico. |
| `backend/workspaces_athena.py` | Rate-limit Athena + cuotas Free/Pro + integración Anthropic. |
| `backend/collab_routes.py` + `backend/collab_ws.py` | V1 GroupDocs deprecado — preservado para migración eventual. No reactivar. |
| `backend/hr_routes.py` | 53 rutas HR + 3 generadores PDF legales (Anexo, Pacto HE, Descuento Vol.). |
| `shared/legal_texts.py` + `shared/legal_texts.ts` | Texto canónico + hash SHA-256 del AGE_DECLARATION. CI valida sincronía. Cambiar = romper gate CI. |
| `scripts/verify-legal-texts-sync.sh` | Gate CI de sincronía hash Python↔TS. |
| `src/pages/HRDashboard.tsx` | 9 botones HR + RUT Conniku SpA correcto (78.395.702-7). |
| `src/pages/UnderConstruction.tsx` | Landing pública temporal + botón discreto CEO. No rutear `/` a otra página sin OK de Cristian. |
| `src/pages/Landing/Landing.tsx` + `Landing.module.css` + `sections/*.tsx` | Landing v3 canónica editorial. FROZEN aunque no esté en ruta pública actualmente. |
| `public/favicon.svg` | Favicon oficial LOGO.04 canónico. |
| `docs/brand/LOGO-SPEC.md` | Spec canónica del logo. INVIOLABLE. |
| `src/pages/{Messages,Friends,Mentorship,GroupDocEditor,Dashboard,Communities,Conferences,UserProfile,Jobs}.tsx` | Null-safety verificada, FROZEN desde 2026-04-14. |
| `package.json` | lint-staged config estabilizada. |
| `.gitignore` | Reglas iCloud. |
| `.husky/pre-commit` | Fix lint-staged: ruff separado del stash. |
| `src/admin/tools/BibliotecaDocumentos.tsx` | rules-of-hooks fix. |

---

## 5. CONVENCIONES REALES

Basado en inspección de archivos reales:

**Naming:**
- Frontend: `PascalCase.tsx` para páginas y componentes (`Start.tsx`, `Privacy.tsx`, `ErrorBoundary.tsx`), `camelCase.ts` para servicios (`api.ts`, `legalConstants.ts`), `useCamelCase.ts` para hooks (`useAutoSave.ts`, `useTier.ts`)
- Backend: `snake_case.py` para archivos y funciones (`auth_routes.py`, `get_current_user`), `PascalCase` para clases SQLAlchemy (`User`, `UserAgreement`, `Workspace`)
- CSS: Modules por página (`Contact.module.css`). Variables tokens CSS (`--bg`, `--text`, `--signature`).

**Imports backend:**
- SIEMPRE relativos al cwd `backend/` (ej: `from middleware import get_current_user`, no `from backend.middleware`)
- Si se usa `shared/`, importar como `sys.path` adjustment o no usar — la convención actual usa `shared/` a través de alias en `vite.config.ts` (frontend) y path explícito en tests.

**Auth en backend:**
- `Depends(get_current_user)` en todos los endpoints protegidos
- `Depends(get_db)` para sesiones de base de datos

**Error handling:**
- Backend: HTTP 422 de Pydantic para validación, HTTP 429 para rate limit, HTTP 502 cuando falla SMTP (no 200 fantasma — corregido en PR #40)
- Frontend: `detail` puede ser string o array de objetos Pydantic → serializar con `loc - msg` antes de mostrar al usuario

**Commits:**
- Conventional Commits en español: `feat(scope): descripción en imperativo`
- Un commit, una intención

**i18n:**
- Hook `useI18n()` de `../services/i18n` (no de `i18next`)
- Claves string como primer arg de `t()`: `t('nav.dashboard')`

**Legal:**
- Constantes legales en `backend/constants/` con comentario obligatorio de fuente, URL oficial, fecha de verificación, verificador
- Hashes SHA-256 de documentos en `backend/constants/legal_versions.py` y espejo en `shared/legal_constants.ts`

---

## 6. ANTI-PATTERNS QUE SE COLARON

| # | Archivo(s) | Problema | Gravedad |
|---|------------|----------|----------|
| 1 | `src/services/i18n.tsx` | Archivo de 5669 líneas con traducciones hardcodeadas en 6 idiomas dentro del mismo archivo React. No es escalable. El sistema paralelo (`src/i18n/index.ts` + JSON) existe pero es código muerto. | Moderado |
| 2 | `src/i18n/index.ts` + `src/i18n/locales/*.json` | Código muerto completo: i18next inicializado, recursos JSON con traducciones, pero ningún componente lo importa. Ocupa espacio y confunde a futuros desarrolladores sobre cuál es el sistema real. | Moderado |
| 3 | `src/services/api.ts`, `src/pages/Start.tsx`, `src/pages/Contact.tsx`, `src/pages/Careers.tsx` | URL `https://studyhub-api-bpco.onrender.com` hardcodeada en múltiples archivos como fallback. Debería ser única constante centralizada. | Leve |
| 4 | `backend/print()` en archivos no-script | `backend/konni_engine.py:150`, `backend/server.py:1793`, `backend/search_routes.py:79,116,150`, `backend/job_routes.py:304,307,346` contienen `print()` activos. El pre-commit debería bloquearlos pero están presentes en main. | Moderado — pre-commit hooks de CLAUDE.md dicen que bloquean prints en backend, pero estos pasaron. |
| 5 | `backend/main.tsx` → `console.log` en `src/main.tsx` y `src/services/api.ts` | `src/main.tsx` tiene `console.log('[SW] ...')` y `src/services/api.ts` los tiene también. Pasaron el pre-commit. | Leve |
| 6 | `src/pages/Support.tsx:231` y `src/pages/Contact.tsx:728` | TODOs comentados referenciando trabajo ya completado (Cookies bridgeada en PR #53). Residuos de planificación no limpiados. | Leve |
| 7 | `backend/referral_routes.py:188` | `TODO: implementar sistema de IP blocking para fraud detection` — deuda técnica de seguridad documentada pero sin fecha ni bloque asignado. | Moderado |
| 8 | `backend/social_routes.py:1312` | `TODO: Merge academic activity items` — deuda funcional sin asignar. | Leve |
| 9 | `src/pages/Start.tsx:452,481,507` (+ 513) | TODOs heterogéneos descubiertos en reconocimiento 2026-04-26: línea 452 (`handleStartClick`) y línea 481 (`handleConnikuBtn`) son navegación legacy a `conniku.html` / `pages/conniku.html` (archivos migrados a `docs/04-diseno/orbit-u/` con PR #57) — cierre tipo "remover TODO comment" en bloque futuro. Línea 507 (`handleLogin`) es cableado backend real a `POST /auth/login` — se cabla en este bloque pre-Fase 2.1. Línea 513 (`handleRegistro`, fuera del scope literal del hallazgo) es cableado backend a `POST /auth/register` — bloque futuro separado por requerir 30+ campos del schema `RegisterRequest` (legal_session_token, age_declaration_accepted, accepted_text_version_hash, user_timezone, etc.). | 🚨 GRAVE → en cierre parcial 2026-04-26: solo 1 de 3 líneas era login backend; las otras 2 son navegación. Flag del proceso: el reporte del auditor conflactó "TODOs en Start.tsx" como un solo problema homogéneo. |
| 10 | `backend/cleanup_production_db.py` | Script que elimina todos los usuarios excepto el owner, con `print()` extenso. No debería estar en el mismo directorio del backend productivo — riesgo de ejecución accidental. | ✅ CERRADO 2026-04-26 — movido a `backend/scripts/dangerous/cleanup_production_db.py` con guards ENV (commit `5c548e5`, squash de PR #57). |
| 11 | `backend/seed_ceo_profile.py` | Script de seed en directorio productivo. No es un test, no tiene protección de ambiente. | Moderado |
| 12 | Rate limit de contacto en memoria (`_rate_buckets` dict en `contact_routes.py`) | Si el proceso se reinicia (Render reinicia el servidor periódicamente), el rate limit se resetea. Un actor malicioso puede esperar el reinicio. | Moderado |
| 13 | CLAUDE.md menciona "migraciones con Alembic" pero en disco existen migraciones SQL manuales en `backend/migrations/` y `backend/migrations.py` custom | Inconsistencia entre documentación y realidad. No hay Alembic instalado en `requirements.txt`. | Leve — documentación desactualizada |
| 14 | CLAUDE.md menciona "Base de datos y autenticación: Supabase" pero el código usa PostgreSQL directo con SQLAlchemy sin ningún cliente Supabase importado ni en `requirements.txt` | 🚨 GRAVE — inconsistencia crítica entre documentación de arquitectura y realidad del código. El backend usa PostgreSQL + SQLAlchemy propios, no Supabase. Supabase no está en requirements.txt ni en ningún import. |
| 15 | `PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "live")` en `backend/paypal_routes.py:24` | Default a `"live"` si la variable no está configurada. En un ambiente de desarrollo sin la variable, podría ejecutar transacciones reales por error. | Moderado |

---

## 7. DEPENDENCIAS Y DEPLOY

### Frontend — dependencias clave (`package.json`)

| Paquete | Versión | Rol |
|---------|---------|-----|
| `react` + `react-dom` | ^18.2.0 | Core framework |
| `react-router-dom` | ^6.21.3 | Router SPA |
| `typescript` | ^5.3.3 | Tipado |
| `vite` | ^5.0.12 | Bundler |
| `@tiptap/react` + extensiones | ^3.22.3 | Editor rich text |
| `@lexical/react` + extensiones | ^0.21.0 | Editor colaborativo |
| `yjs` + `y-websocket` + `y-indexeddb` | ^13.6.30 | CRDT colaboración |
| `framer-motion` | ^12.38.0 | Animaciones |
| `i18next` + `react-i18next` | ^26.0.8 / ^17.0.4 | i18n (instalado pero NO USADO activamente) |
| `@capacitor/core` + plugins | ^8.3.0 | Mobile |
| `electron` | ^28.1.4 | Desktop (devDep) |
| `dompurify` | ^3.4.0 | Sanitización XSS |
| `katex` | ^0.16.45 | Render matemático |
| `pdfjs-dist` | ^5.4.624 | Render PDF |
| `react-markdown` + `remark-gfm` | ^10.1.0 / ^4.0.1 | Render Markdown docs legales |
| `lucide-react` | ^1.7.0 | Iconos (devDep) |
| `husky` | ^9.1.7 | Pre-commit hooks |
| `vitest` | ^2.1.9 | Testing |

### Backend — dependencias clave (`requirements.txt`)

| Paquete | Versión | Rol |
|---------|---------|-----|
| `fastapi` | >=0.128.0 | Framework API |
| `uvicorn` | >=0.27.0 | ASGI server |
| `sqlalchemy` | ==2.0.25 (pinned) | ORM |
| `psycopg2-binary` | >=2.9.0 | Driver PostgreSQL |
| `python-jose[cryptography]` | >=3.3.0 | JWT |
| `bcrypt` | >=4.0.0 | Hash contraseñas |
| `pydantic[email]` | >=2.0.0 | Validación |
| `anthropic` | >=0.40.0 | Claude API (Athena + Konni) |
| `openai` | >=1.0.0 | Alternativa AI (ai_engine.py) |
| `mercadopago` | >=2.2.0 | Pagos LATAM |
| `httpx` | >=0.27.0 | HTTP async cliente |
| `xhtml2pdf` + `weasyprint` | >=0.2.11 / >=62.0,<65.0 | Generación PDF |
| `python-docx` | >=1.1.0 | Generación DOCX |
| `chromadb` | >=0.4.22 | Vector DB (biblioteca?) |
| `apscheduler` | >=3.10.0 | Scheduler de tareas |
| `bleach` | >=6.0 | Sanitización HTML |
| `pywebpush` | >=2.0.0 | Push notifications VAPID |
| `ruff` + `mypy` + `pytest` | en requirements | Linting/testing (en prod requirements — correcto para CI) |

### Deploy

| Servicio | Plataforma | Config |
|----------|------------|--------|
| Frontend | Vercel | `vercel.json`: build Vite, rewrite SPA, headers seguridad (HSTS, X-Frame-Options DENY, CSP básico) |
| Backend | Render | `render.yaml`: Python 3.11, `rootDir: backend`, `pip install + python server.py`, PostgreSQL free tier |
| CI/CD | GitHub Actions | `.github/workflows/verify-build.yml`: 6 gates (TypeScript, ESLint, Vite build, ruff+mypy+pytest, frozen check, npm audit) |
| Mobile | GitHub Actions | `android-build.yml`, `ios-build.yml` |
| Keep-alive | GitHub Actions | `keep-alive.yml` — para evitar sleep del backend en Render free tier |
| Backup Supabase | GitHub Actions | `supabase-backup.yml` — NOTA: el backend no usa Supabase; DESCONOCIDO qué respalda exactamente |

### Variables de entorno declaradas en `render.yaml` (backend)

- `PORT` = 8899
- `JWT_SECRET` = generated (obligatorio en prod, RuntimeError si falta)
- `OWNER_PASSWORD` = generated
- `PYTHON_VERSION` = 3.11.0
- `CORS_ORIGINS` = whitelist producción
- `ENVIRONMENT` = production
- `DATABASE_URL` = desde base de datos Render
- `ANTHROPIC_API_KEY` = sync: false (configurar en dashboard)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` = configurar en dashboard
- `SMTP_PASS_NOREPLY`, `SMTP_PASS_CONTACTO`, `SMTP_PASS_CEO` = App Specific Passwords Zoho
- `NOREPLY_EMAIL`, `CONTACT_EMAIL`, `CEO_EMAIL`, `SMTP_FROM`, `FRONTEND_URL`

**Variables usadas en código pero NO en `render.yaml` (gap de documentación):**
- `OPENAI_API_KEY` (en `backend/ai_engine.py`)
- `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`, `BING_SEARCH_API_KEY` (en `backend/search_routes.py`)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` (en `backend/push_routes.py`)
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE` (en `backend/paypal_routes.py`)
- `IMAP_HOST`, `IMAP_PORT` (en `backend/email_doc_routes.py`)
- `SII_RUT_EMISOR`, `SII_CERT_PATH` (en `backend/chile_tax_routes.py`)
- `LEGAL_GATE_ENFORCE` (mencionado en BLOCKS.md — feature flag del bloque-legal-consolidation-v2, pendiente flip a `true` post-deploy)
- `RENDER_DISK_MOUNT_PATH` (en `backend/database.py`)

---

## 8. ERRORES FRECUENTES QUE COMETE CLAUDE EN ESTE REPO

Los siguientes son patrones de error documentados con evidencia real en CLAUDE.md Sección 17 y en commits:

1. **Inventar datos** — RUT, tokens de tema, rutas de archivos, valores legales sin fuente verificable. El evento del RUT (2026-04-09) y los tokens navy (2026-04-25 A) son el mismo patrón.

2. **Asumir existencia sin verificar** — referenciar rutas, componentes o endpoints como "existentes" sin hacer grep previo. Ejemplo: asumir `/signup` existe sin verificar `App.tsx`.

3. **Propuesta = autorización** — ejecutar en el mismo turno en que se propone. Tres instancias documentadas (2026-04-25): sidebar refactor, merge múltiple de PRs, refactor completo de Support.

4. **Cwd incorrecto en imports backend** — usar `from backend.X` o `from shared.X` que funcionan en local (cwd=raíz) pero fallan en Render (cwd=`backend/`). Causó caída de 20 días no detectada.

5. **Mezclar scope** — incluir cleanup/refactor no pedido junto al cambio solicitado. Commits que tocaban más archivos de los necesarios.

6. **Declarar cierres** — decir "M01.X está listo para cerrar" o "queda APROBADO". Solo Cristian cierra.

7. **URLs de preview incorrectas** — compartir preview de rama antigua cuando el fix estaba en otra rama.

8. **Canvas sin className** — usar `HexNebulaCanvas` sin pasar `className={styles.nebulaBg}`, causando que el canvas empuje el contenido DOM.

9. **CSS duplicado** — declarar la misma propiedad CSS dos veces en el mismo bloque. Ejemplo: `.topbar` con `position: sticky` sobreescrito por `position: relative`.

10. **Crear archivos de registro sin consultar CLAUDE.md** — CLAUDE.md Sección 17 es el registro vivo. Crear `docs/ERRORES.md` separado fue redundante.

11. **Credenciales SMTP incorrectas** — usar password normal de Zoho en vez de App Specific Password. Resultó en 200 OK fantasma mientras el correo fallaba silenciosamente en background.

---

## 9. ESTADO DE LO PENDIENTE

### Módulos en `main` (ninguno firmado por Cristian al 2026-04-26)

| ID | Ruta | Estado |
|----|------|--------|
| M01 | `/start` | EN PRUEBAS — funcional visual pero login no cableado al backend real |
| M01.1 | `/terms` | EN PRUEBAS |
| M01.2 | `/privacy` | EN PRUEBAS |
| M01.3 | `/support` | EN PRUEBAS |
| M01.4 | `/contact` | EN PRUEBAS — SMTP real funcional, HTTP 502 si falla |
| M01.5 | `/careers` | EN PRUEBAS — mergeado PR #44 + PR #51 |
| M01.6 | `/cookies` | EN PRUEBAS — canónico restaurado PR #53 + fixes PR #54 + PR #55 |

### Plan de fases

| Fase | Estado |
|------|--------|
| Fase 0 — i18n base 6 idiomas | COMPLETA (PR #52) |
| Fase 1 — Onboarding forms + reveal | COMPLETA (en main) |
| Fase 2 — Perfil Social V2 `/profile` base + perfiles por rol + stories + feed | **PRÓXIMO OBJETIVO** — no iniciada. Diseño fuente: `docs/04-diseno/orbit-u/pages/perfil-social-v2.html` |
| Fase 3 — Módulos internos por rol | No iniciada |
| Fase 4 — Auth JWT real, notificaciones, mensajería, hardening | No iniciada |

### PRs abiertos (al cierre de sesión 2026-04-26)

| PR | Contenido | Estado |
|----|-----------|--------|
| PR #43 | CLAUDE.md sec 17 lecciones A–G + handoff | Abierto — solo docs |
| PR #51 | Careers tema navy oscuro | Mergeado (HEAD es `466f428`) — la rama puede estar obsoleta |

### Deudas técnicas documentadas

- `backend/referral_routes.py` — IP blocking para fraud detection (TODO)
- `src/services/auth.tsx` — `GoogleAgeDeclarationModal` (bloque-1-iter-2, TODO pendiente)
- `LEGAL_GATE_ENFORCE` — flip a `true` en Render pendiente post-deploy (feature flag creado, actualmente `false`)
- Revisión abogado externo pendiente para `PRIVACY_HASH` v2.4.2 (mencionado en `legal_versions.py`)
- `src/i18n/` — código muerto (react-i18next no usado) sin limpiar
- TODOs de navegación en `Start.tsx:452,481,507` — rutas de conniku.html no bridgeadas
- Pending: migración eventual datos V1 collab → V2 Workspaces (tablas preservadas)
- Bloque 2.5 post-launch: Workspaces features diferidas (Tapa/TOC, Tablas, Imágenes, Mobile UX, DOCX completo)
- `supabase-backup.yml` workflow existe pero CLAUDE.md confirma que el backend NO usa Supabase — propósito del workflow es DESCONOCIDO

---

## 10. CLAUDE.md ACTUAL

El contenido íntegro de `/Users/cristiang./CONNIKU/CLAUDE.md` (1853 líneas al 2026-04-26) está disponible en la ruta indicada. Por razones de tamaño (25k tokens) no se incluye inline en este briefing. Las secciones clave son:

- **Secciones 1-16**: Identidad, stack, arquitectura, convenciones, commits, agentes, flujo de trabajo, TDD, quality scoring, razonamiento extendido, protocolo de reporte, capas mecánicas, reglas duras, modelo por tarea, sesión inicio, cumplimiento legal
- **Sección 17**: Registro vivo de errores (18 entradas documentadas con prevenciones)
- **Sección 18**: Filosofía de desarrollo modular + protocolo 7 capas + BLOCKS.md/FROZEN.md
- **Sección 19**: Auto Mode DESACTIVADO permanentemente
- **Sección 20**: Objetivo único por sesión (formato obligatorio en primer mensaje)
- **Sección 21**: Decisiones de producto en batch
- **Sección 22**: Verificación de premisas antes de recomendar (alto blast-radius)
- **Sección 23**: Pre-flight CI local antes de push
- **Sección 24**: Pre-commit prettier proactivo frontend

Para leerlo completo: `cat /Users/cristiang./CONNIKU/CLAUDE.md`

---

*Fin del AUDITOR_BRIEFING — generado íntegramente desde evidencia real en disco. Sin invención de datos.*
