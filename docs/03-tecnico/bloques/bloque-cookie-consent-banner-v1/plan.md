# Plan — bloque-cookie-consent-banner-v1

- **Autor:** web-architect (Tori)
- **Fecha:** 2026-04-20
- **Rama de trabajo propuesta:** `bloque-cookie-consent-banner-v1`
- **Tipo de bloque:** feature con componente legal fuerte (CLAUDE.md §Flujo reforzado para código con componente legal).
- **Flujo aplicable:** `flujo-legal` — las 7 capas del protocolo modular más Capa 0 obligatoria con `legal-docs-keeper` y aprobación humana explícita antes de Capa 4 (deploy a preview).
- **Opción de producto elegida:** B — Banner GDPR completo (Aceptar todas / Rechazar todas / Personalizar) con gating real de scripts no esenciales y con upgrade path documentado a C (CCPA + Ley 21.719) para noviembre 2026.

> **Aviso legal:** este plan no constituye asesoría legal profesional. Las normas citadas son fuentes verificables, pero su interpretación y aplicación al producto requiere validación de abogado externo antes de publicar la experiencia en producción. La regla crítica §Prohibición de inventar información legal del CLAUDE.md aplica: cualquier valor numérico (plazos, días de retención, porcentajes) que este plan proponga sin cita verificable queda marcado como "requiere verificación Cristian".

---

## 1. Contexto y trigger

### 1.1 Qué se pide

Cristian necesita un banner de consentimiento de cookies para el dominio público `www.conniku.com` (UnderConstruction + landing) y para la aplicación autenticada, que:

- Cumpla el estándar GDPR (mercado futuro UE) como piso legal, dado que es el régimen más estricto.
- Cubra simultáneamente Chile (Ley 19.628 vigente, Ley 21.719 que entra en vigencia 2026-12-01), ePrivacy UE, LSSICE España, LGPD Brasil, CCPA California.
- No dependa de librerías externas comerciales (Cookiebot, OneTrust): implementación propia, bajo control del proyecto.
- Prepare el upgrade a opción C (CCPA "Do Not Sell" + Ley 21.719) antes de noviembre 2026.

### 1.2 Archivos ya presentes que condicionan la arquitectura

He leído y referencio:

- `src/pages/CookiesPolicy.tsx` — política de cookies ya renderizada en `/cookies` con inventario real de claves `localStorage` de primera parte (líneas 183-253). Este componente permanece como ancla; el banner lo linkea pero NO lo duplica.
- `docs/legal/v3.2/cookies.md` — stub vacío. El contenido canónico vive ya en el TSX. Pieza 6 del plan sincroniza el markdown con el render TSX para que `COOKIES_HASH` en `legal_versions.py` pueda recalcularse sobre un markdown fiel.
- `backend/constants/legal_versions.py` — ya declara `COOKIES_DOCUMENT_TYPE`, `COOKIES_VERSION="1.0.0"`, `COOKIES_HASH`. Este plan agrega constantes nuevas para consentimiento de cookies (distinto de aceptación de la política de cookies).
- `backend/database.py` líneas 1848-1864 — tabla `user_agreements` ya existe. El consentimiento de cookies por COOKIE CATEGORY NO cabe en ese schema (ese schema es para aceptación de texto legal monolítico; el consentimiento granular de cookies necesita array de categorías, `visitor_uuid` para usuarios anónimos, y campos de retención diferenciados). Plan crea tabla nueva `cookie_consents`.
- `src/services/auth.tsx` líneas 18-19 — token y refresh-token viven ya en `localStorage` bajo claves `conniku_token` y `conniku_refresh_token`. Estas son estrictamente necesarias (auth). No requieren consentimiento.
- `src/services/i18n.tsx` líneas 4063-4070 — `conniku_language` se setea en `localStorage` sin gate. Categoría funcional.
- `src/App.tsx` líneas 240, 256, 977 — `conniku_welcomed`, `conniku_theme` se setean en `localStorage` sin gate. Funcionales.
- `src/components/AppAvailableBanner.tsx` líneas 14, 28 — `conniku_apps_banner_v3`. Funcional.
- `src/components/PWAInstallPrompt.tsx` línea 79 — `pwa-install-dismissed`. Funcional.
- `src/services/api.ts` líneas 2127-2152 — `initPushNotifications()` setea suscripción push vía Service Worker. El Service Worker vive en `public/sw.js` y cachea app shell. La cache PWA es estrictamente necesaria (offline core). La suscripción push requiere permiso separado del navegador; el gate de consentimiento de cookies NO aplica directamente a `Notification.requestPermission`, pero sí al endpoint que almacena la suscripción si lo clasificamos como "funcional opcional". Decisión documentada en §3.
- `src/App.tsx` línea 250 — `initPushNotifications()` se ejecuta en un `useEffect`. El plan propone condicionar este effect al consentimiento "functional" activo.
- `src/admin/hr/*`, `src/admin/finance/*` — gran cantidad de claves `localStorage` de dominio administrativo (RRHH, finanzas). Todas son post-login de staff, no de visitante anónimo, y son funcionales al servicio contratado (ejecución de contrato, Art. 6(1)(b) RGPD). No requieren gate de consentimiento; sí requieren estar documentadas en la política.
- `public/sw.js` líneas 198-204 — handler `push`. El Service Worker es parte de la experiencia PWA. Su instalación NO requiere consentimiento de cookies bajo Art. 5(3) ePrivacy porque es "estrictamente necesario para la prestación del servicio solicitado por el suscriptor" (la PWA offline es servicio core).

### 1.3 Qué hoy NO existe en el producto y por eso el plan lo crea

- No hay analytics externos (Google Analytics, Plausible, PostHog, Mixpanel, Hotjar). Verificación: `grep -r "gtag|google-analytics|plausible|posthog|mixpanel|segment|hotjar" src/` retorna únicamente strings informativos en `accountingData.ts`, `AdSlot.tsx`, `InfoPages.tsx` (mencionados como ejemplos en contenido estático, NO como integraciones activas). Esto es relevante: hoy no hay scripts no esenciales que gatear. El banner existe por cumplimiento proactivo (GDPR exige consentimiento antes de setear cookies no esenciales aunque no haya trackers), y para habilitar integraciones futuras (Athena, analytics de producto, FCM opcional) sin refactorizar después.
- No hay tabla `cookie_consents` en `database.py`. Tampoco migración SQL.
- No hay módulo `src/services/cookieConsentService.ts` ni `src/services/analytics.ts`. Se crearán.
- No hay detección de geolocalización para aplicar banner diferenciado por región. La opción B se implementa uniforme (banner para todos), y la opción C (noviembre 2026) introduce geolocalización.

### 1.4 Componente legal detectado (Capa 0 obligatoria)

Trigger activo por CLAUDE.md §Flujo reforzado para código con componente legal: la tarea menciona GDPR, Ley 19.628, consentimiento, privacidad, cookies. `legal-docs-keeper` debe:

1. Antes de que el builder arranque Pieza 1, emitir borrador de los textos del banner y del modal (Sección 9 de este plan) para revisión humana de Cristian.
2. Emitir nota de si el esquema de retención propuesto en Sección 4 satisface GDPR Art. 7(1) (demostrabilidad del consentimiento) y Ley 19.628 Art. 4°.
3. Emitir lista de documentos legales a actualizar: Política de Privacidad (debe mencionar la tabla `cookie_consents` como nuevo encargado interno de datos), Política de Cookies (mencionar el mecanismo de gestión de preferencias), T&C (referencia cruzada opcional).
4. Cristian aprueba humanamente los textos antes de que el frontend-builder los pegue en el componente. Sin OK explícito, Pieza 2 se bloquea.

---

## 2. Matriz de jurisdicciones

Fuentes citadas cuando Tori tiene evidencia verificable. Cuando un dato específico (número de días, porcentaje, multa exacta) no está verificado ante la fuente oficial en esta sesión, se marca `[requiere verificación]` y se diferirá al `legal-docs-keeper` + abogado.

### 2.1 Chile — vigente hoy

- **Ley 19.628 sobre Protección de la Vida Privada** (1999, vigente, con reformas parciales).
  - Art. 4° — información al titular al momento de recolectar datos personales.
  - Régimen actual de consentimiento es laxo comparado con GDPR. El banner propuesto CUMPLE el mínimo chileno con márgenes amplios.
  - Fuente: https://www.bcn.cl/leychile/navegar?idNorma=141599

### 2.2 Chile — inminente (vigencia 2026-12-01)

- **Ley 21.719** (promulgada 2024-11-28, publicada 2024-12-13, vigencia diferida a 2 años tras publicación, es decir **2026-12-13** no 2026-12-01).
  - Nota: Cristian indica 2026-12-01. La fecha exacta de entrada en vigencia **[requiere verificación en bcn.cl]** — el plan se construye con margen de seguridad apuntando a tener el banner opción B en producción antes de noviembre 2026 y el upgrade a C antes de diciembre 2026.
  - La Ley 21.719 introduce principios GDPR-like en Chile: consentimiento libre, informado, específico, inequívoco, revocable. El banner opción B ya cumple esto; la opción C afinará la granularidad por finalidad.
  - Fuente por verificar: https://www.bcn.cl/leychile/navegar?idNorma=1212270

### 2.3 Unión Europea / EEE

- **Reglamento UE 2016/679 (GDPR)**.
  - Art. 4(11) — definición de consentimiento: "toda manifestación de voluntad libre, específica, informada e inequívoca".
  - Art. 6(1)(a) — base legal consentimiento.
  - Art. 7 — condiciones del consentimiento: (1) demostrabilidad, (2) claridad, (3) derecho a retirar el consentimiento tan fácil como se otorgó, (4) no condicionar prestación del servicio a consentimiento no necesario.
  - Art. 13 — información al usuario al recolectar.
  - Art. 17 — derecho de supresión. Ojo: Conniku conserva el registro de consentimiento como evidencia legal; esto es lícito bajo Art. 17(3)(e) (ejercicio de defensa legal) pero requiere justificación documentada.
  - Fuente: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- **Directiva 2002/58/CE (ePrivacy)** — Art. 5(3): consentimiento previo antes de almacenar o acceder a información en el equipo terminal del usuario, salvo cuando la finalidad sea "estrictamente necesaria" para prestar el servicio solicitado.
  - Fuente: https://eur-lex.europa.eu/eli/dir/2002/58/oj
- **Jurisprudencia vinculante**:
  - **Planet49 C-673/17** (TJUE, 2019-10-01) — una casilla premarcada NO constituye consentimiento válido. El banner propuesto tiene todos los toggles de categorías no esenciales OFF por defecto.
  - **Orange Romania C-61/19** (TJUE, 2020-11-11) — el encargado del tratamiento debe poder demostrar consentimiento (carga de la prueba). Justifica el registro backend con IP, UA, timestamp, hash de texto.
  - Fuente Planet49: https://curia.europa.eu/juris/liste.jsf?num=C-673/17
- **Directrices EDPB 05/2020** sobre consentimiento — actualizadas 2020-05-04. Establecen que "Aceptar" y "Rechazar" deben tener la misma prominencia visual (color, tamaño, posición).
  - Fuente: https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en

### 2.4 España

- **Ley 34/2002 LSSICE** — Art. 22.2 modificado por Real Decreto-ley 13/2012: consentimiento expreso para instalar cookies no esenciales.
- **Guía de la AEPD sobre uso de cookies** (versión actualizada en 2023 tras criterios EDPB).
  - Exige que "Rechazar" sea igual de accesible que "Aceptar" desde la primera capa del banner. El plan lo cumple con los 3 botones visibles en la primera capa.
  - Fuente: https://www.aepd.es/guias/guia-cookies.pdf

### 2.5 Brasil

- **Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018)** — Art. 7 base legal consentimiento; Art. 8 requisitos; Art. 18 derechos del titular.
  - El banner opción B cumple. No requiere ajustes específicos para LGPD más allá de tener los textos disponibles en portugués si se abre mercado Brasil (fuera de scope del bloque).

### 2.6 California

- **CCPA / CPRA** — California Consumer Privacy Act + California Privacy Rights Act.
  - Exige botón "Do Not Sell or Share My Personal Information" para residentes de California.
  - Conniku HOY no vende ni comparte datos con terceros con fines publicitarios. El banner opción B NO necesita botón "Do Not Sell" hoy, pero la opción C lo agregará condicionalmente por geolocalización.
  - Fuente: https://oag.ca.gov/privacy/ccpa

### 2.7 Resumen operativo

| Jurisdicción | Consentimiento exigido hoy | Qué cambia en opción C |
| --- | --- | --- |
| Chile (19.628) | Información al titular | Sin cambio estructural |
| Chile (21.719, 2026-12) | Consentimiento GDPR-like | Ya cubierto por opción B |
| UE (GDPR + ePrivacy) | Opt-in granular previo | Ya cubierto por opción B |
| España (LSSICE) | Opt-in granular previo | Ya cubierto por opción B |
| Brasil (LGPD) | Opt-in granular previo | Ya cubierto por opción B |
| California (CCPA) | Do Not Sell visible | Nuevo botón en opción C |

---

## 3. Taxonomía de cookies y almacenamiento de Conniku

Inventario canónico. Categorización estricta conforme a EDPB 05/2020 y AEPD 2023. Claves verificadas en código vía Grep.

### 3.1 Estrictamente necesarias (Strictly Necessary) — NO requieren consentimiento

Base legal: Art. 6(1)(b) RGPD — ejecución de contrato — y exención Art. 5(3) ePrivacy — estrictamente necesarias para prestar el servicio solicitado.

| Clave / recurso | Ubicación en código | Finalidad | Proveedor |
| --- | --- | --- | --- |
| `conniku_token` | `src/services/auth.tsx:18` | Sesión autenticada | Conniku (first-party) |
| `conniku_refresh_token` | `src/services/auth.tsx:19` | Refresh de sesión | Conniku (first-party) |
| `conniku_server_url` | `src/services/api.ts:4` | Endpoint del backend elegido | Conniku (first-party) |
| Service Worker cache (`conniku-v8`, `conniku-static-v8`, `conniku-api-v8`, `conniku-images-v8`) | `public/sw.js:5-9` | Funcionamiento offline core de PWA | Conniku (first-party) |
| Cookie de primera parte `cc_visitor_uuid` (nueva, propuesta por este plan) | A crear en Pieza 2 | Identificador anónimo para vincular consentimiento servidor-side cuando `localStorage` se limpia | Conniku (first-party) |
| Cookie de primera parte `cc_consent_v1` (nueva, propuesta) | A crear en Pieza 2 | Estado actual del consentimiento, cacheado en cookie HTTP para que scripts server-rendered lo consulten | Conniku (first-party) |

### 3.2 Funcionales — requieren consentimiento "funcional" (default OFF)

Aunque varias se sienten "siempre necesarias", la jurisprudencia europea las clasifica como funcionales porque el servicio puede prestarse sin ellas (con degradación de experiencia). La opción B pone estas detrás del toggle "Funcionales" del modal. Si el usuario rechaza funcionales, la app usa defaults de sesión.

| Clave | Ubicación en código | Finalidad | Impacto si se rechaza |
| --- | --- | --- | --- |
| `conniku_language` | `src/services/i18n.tsx:4063` | Idioma preferido | Reset a detección navegador cada sesión |
| `conniku_theme` | `src/App.tsx:256` | Tema visual claro/oscuro | Reset a default cada sesión |
| `conniku_welcomed` | `src/App.tsx:240` | Evita repetir tour de bienvenida | Tour reaparece cada visita |
| `conniku_apps_banner_v3` | `src/components/AppAvailableBanner.tsx:14` | Oculta banner apps móviles | Banner reaparece |
| `pwa-install-dismissed` | `src/components/PWAInstallPrompt.tsx:79` | Oculta prompt PWA | Prompt reaparece |
| `ob_visited`, `conniku_ob_*` | `src/App.tsx`, `PersonasHub.tsx:2731` | Onboarding HR | Onboarding reinicia |
| `conniku_feed_sort`, `conniku_course_progress_*`, `conniku_course_quiz_*`, `conniku_quiz_history` | `Quizzes.tsx:24`, `Courses.tsx`, `Feed.tsx`, `StudyPaths.tsx:59` | Progreso académico local | Progreso no persiste entre sesiones |
| `conniku_enrollment_id`, `conniku_paypal_order_id` | `TutorDirectory.tsx:458,479,480` | Estado de enrolamiento/pago pendiente | Puede obligar a reiniciar checkout |
| `conniku_ceo_signature` | `CeoMail.tsx:127,338` | Firma de correo CEO | Firma debe re-cargarse |
| `conniku_rubric_checked_*` | `RubricPanel.tsx` | Rúbricas marcadas | Estado local se pierde |
| `conniku_suggestions` | `Suggestions.tsx:24` | Sugerencias locales | Se pierden |
| `conniku_analytics_cache` | `AnalyticsTab.tsx:18` | Cache UI admin finance | Se re-fetch |
| `conniku_transactions` | `accountingData.ts:904` | Transacciones locales admin | Post-login staff; funcional al contrato |
| `conniku_employee_permissions` | `seedEmployees.ts:45` | Permisos staff | Post-login staff; funcional al contrato |
| `conniku_erc_v1`, `conniku_desv_*` | `PersonasHub.tsx`, `FiniquitosTab.tsx:531` | Estados admin HR | Post-login staff; funcional al contrato |
| `conniku_doc_vault`, `conniku_onboarding_processes`, `conniku_offboarding_processes`, `conniku_onoff_templates` | `DocumentosTab.tsx:210`, `OnboardingTab.tsx:122-124` | Admin HR docs | Post-login staff; funcional al contrato |
| `conniku_eval_cycles`, `conniku_evaluations`, `conniku_goals` | `DesempenoTab.tsx:91-93` | Desempeño HR | Post-login staff |
| `conniku_capacitacion_v2` | `CapacitacionTab.tsx:48` | Capacitación HR | Post-login staff |
| `conniku_reclutamiento_vacantes`, `conniku_reclutamiento_candidatos` | `ReclutamientoTab.tsx:115-116` | Reclutamiento HR | Post-login staff |
| `conniku_path_*` | `StudyPaths.tsx:505` | Rutas de estudio por proyecto | Progreso se pierde |

**Decisión arquitectónica clave:** las claves de dominio admin (`conniku_erc_v1`, `conniku_eval_cycles`, etc.) que solo existen tras login de staff se consideran **funcionales pero bajo base legal de ejecución de contrato** (Art. 6(1)(b) RGPD), NO consentimiento (Art. 6(1)(a)). El banner NO las gatea: si el usuario logueado rechaza "funcionales", la app sigue escribiendo estas claves porque son necesarias para el servicio contratado. La decisión se justifica en el texto legal de la política de cookies ("base legal: ejecución de contrato") y se documenta en el log de decisiones del bloque.

Lo que SÍ gatea el banner entre las funcionales:

- Las de visitante anónimo / pre-login: `conniku_welcomed`, `conniku_apps_banner_v3`, `pwa-install-dismissed`, `conniku_theme`, `conniku_language`.

Lo que NO gatea el banner:

- Las de usuario logueado vinculadas al servicio contratado.

### 3.3 Analíticas — requieren consentimiento "analytics" (default OFF)

**Hoy no existen integraciones activas.** Verificado con Grep: ni GA, ni Plausible, ni PostHog, ni Mixpanel, ni Hotjar. El plan provisiona el gate para integraciones futuras (Sección 7).

| Clave propuesta futura | Proveedor candidato | Estado actual |
| --- | --- | --- |
| `_ga`, `_ga_*` | Google Analytics 4 | NO instalado |
| `plausible_ignore` | Plausible | NO instalado |
| `ph_*` | PostHog | NO instalado |
| Evento server-side anónimo de producto | Conniku backend (propio, sin third-party) | A evaluar en bloque analytics-v1 (fuera de scope) |

Propuesta alternativa (§5.3 razonamiento extendido): antes de consentir, enviar eventos agregados SIN PII al backend propio (solo nombre del evento y timestamp bucketizado por hora). Esto se categoriza como "analítica de funcionamiento interno, base legal interés legítimo Art. 6(1)(f)", siempre que no haya identificador que permita rastrear a un individuo. El banner NO gatea esos eventos, pero la política de privacidad los menciona.

### 3.4 Marketing — requieren consentimiento "marketing" (default OFF)

**Hoy no existen integraciones activas.** Conniku declara en la política actual de cookies (línea 256-261 de `CookiesPolicy.tsx`): "Conniku no utiliza cookies de terceros con fines publicitarios". El gate se deja provisionado y vacío.

| Clave propuesta futura | Proveedor | Estado actual |
| --- | --- | --- |
| Firebase Cloud Messaging registration token | FCM | No se almacena en cookies; vive en `PushManager` nativo. Permiso separado. |
| Meta Pixel, TikTok Pixel | Meta, TikTok | NO instalado. Fuera de scope del bloque. |

**Nota sobre Anthropic / Athena:** el chatbot Athena usa la API de Anthropic server-side desde el backend. NO hay SDK de Anthropic en el frontend. No setea cookies. No requiere gate. Verificado con Grep en `src/`.

**Nota sobre FCM:** la suscripción push usa el endpoint nativo `PushManager.subscribe` y `Notification.requestPermission`. El gate del navegador es separado del gate de cookies. No obstante, el plan clasifica "recibir notificaciones push" como categoría funcional opcional: `initPushNotifications()` en `App.tsx:250` se condiciona a `cookieConsent.functional === true`.

### 3.5 Decisión sobre cookie bandera `cc_visitor_uuid`

Categoría: estrictamente necesaria (justificación: cumplimiento legal — permite demostrar consentimiento incluso tras limpieza de `localStorage`, en línea con GDPR Art. 7(1)). Esta clasificación requiere validación del `legal-docs-keeper` en Capa 0; algunos reguladores consideran que las cookies de "compliance tooling" pueden ser esenciales, otros no. Si el veredicto es que NO es esencial, la cookie se mueve a funcional y se renombra a `cc_visitor_uuid_optional`.

---

## 4. Componentes técnicos — inventario exhaustivo

### 4.1 Frontend (React + TypeScript)

Todos los componentes nuevos, sin modificar componentes existentes salvo los puntos de integración mínimos.

| Archivo nuevo | Responsabilidad | Depende de |
| --- | --- | --- |
| `src/components/CookieConsent/CookieConsentProvider.tsx` | React Context global. Expone `consent`, `setConsent`, `openSettings`. Monta el banner si no hay consentimiento. | `cookieConsentService` |
| `src/components/CookieConsent/CookieBanner.tsx` | Primera capa: overlay bloqueante con 3 botones + enlace a `/cookies`. Presentación sin lógica. | `CookieConsentProvider` |
| `src/components/CookieConsent/CookieSettings.tsx` | Modal de personalización con 4 toggles (Necesarias desactivable=false, Funcionales, Analíticas, Marketing). | `CookieToggle`, `useCookieConsent` |
| `src/components/CookieConsent/CookieToggle.tsx` | Toggle accesible individual (WAI-ARIA `switch`). Reutilizable. | — |
| `src/components/CookieConsent/CookieSettingsFooterLink.tsx` | Ícono/enlace persistente en footer o esquina inferior derecha que reabre el modal. | `useCookieConsent` |
| `src/components/CookieConsent/CookieBanner.module.css` | Tokens `--bg-primary`, `--accent`, `--text-primary`, `--border-subtle`. | — |
| `src/hooks/useCookieConsent.ts` | Hook que consume el contexto, expone `{ consent, accept, reject, customize, openSettings, hasConsent }`. | `CookieConsentProvider` |
| `src/services/cookieConsentService.ts` | Lee/escribe `localStorage` (`conniku_cookie_consent_v1`), cookie HTTP `cc_consent_v1`, sincroniza con backend, verifica `policy_hash` contra el servidor. | `api.ts` |
| `src/services/analytics.ts` | **Nuevo.** Expone `loadAnalyticsIfConsented()`, `logServerSideEvent()`. Placeholder listo para cuando se integre analytics real. | `cookieConsentService` |

### 4.2 Frontend — puntos de integración en código existente

Modificaciones mínimas. No refactor.

- `src/App.tsx` — envolver el `<Routes>` con `<CookieConsentProvider>`; condicionar `useEffect` de `initPushNotifications()` a `consent.functional === true`.
- `src/main.tsx` — no requiere cambios.
- `src/services/i18n.tsx:4070` — antes de `localStorage.setItem('conniku_language', newLang)` agregar guard: si el usuario es ANÓNIMO (no logueado) y `consent.functional === false`, no persiste la clave; usa estado de React solamente.
- `src/App.tsx:260, 977` — mismo guard para `conniku_theme` y `conniku_welcomed` cuando usuario es anónimo.
- `src/components/AppAvailableBanner.tsx:28`, `src/components/PWAInstallPrompt.tsx:79` — mismo guard.

**Decisión:** las claves post-login (admin, HR, finance) NO se gatean. Ejecución de contrato.

### 4.3 Backend (Python + FastAPI + SQLAlchemy)

| Archivo nuevo o modificado | Responsabilidad |
| --- | --- |
| `backend/cookie_consent_routes.py` (nuevo) | Endpoints `POST /api/consent/cookies`, `GET /api/consent/cookies/{visitor_uuid}`, `GET /api/consent/cookies/policy-version`. |
| `backend/database.py` (modificado) | Agregar modelo `CookieConsent` después de `UserAgreement` (línea 1865). Ver §5. |
| `backend/migrations/add_cookie_consents_table.sql` (nuevo) | Migración idempotente SQL. |
| `backend/migrations.py` (modificado) | Registrar nueva migración en la lista de migraciones auto-ejecutadas al arranque. |
| `backend/constants/legal_versions.py` (modificado) | Agregar `COOKIE_CONSENT_POLICY_VERSION = "1.0.0"` y `COOKIE_CONSENT_POLICY_HASH` (hash del texto canónico de las categorías del banner, distinto de `COOKIES_HASH` que es el hash de la política markdown). |
| `backend/server.py` (modificado) | Registrar el router de `cookie_consent_routes` en la app principal. |

### 4.4 Base de datos — tabla `cookie_consents`

Schema en §5.

Nota: en producción Conniku usa SQLite (ver `backend/migrations/add_user_agreements_table.sql` con `INTEGER PRIMARY KEY AUTOINCREMENT`). La migración nueva mantiene el mismo estilo: SQL plano idempotente compatible con SQLite, con adaptación a PostgreSQL mediante `CREATE TABLE IF NOT EXISTS` estándar.

### 4.5 Shared — espejado TS/PY

`shared/cookie_consent_constants.ts` (nuevo) espejea:

- Versiones: `COOKIE_CONSENT_POLICY_VERSION`.
- Hash: `COOKIE_CONSENT_POLICY_HASH`.
- Tipos: `type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing'`.
- Textos canónicos: `COOKIE_BANNER_TEXT_V1`, `COOKIE_CATEGORIES_TEXT_V1` (fuente de verdad del hash).

Pieza 4 define el cálculo determinístico del hash a partir de estos textos.

---

## 5. Estructura de datos del consentimiento

### 5.1 Schema de la tabla `cookie_consents`

```sql
CREATE TABLE IF NOT EXISTS cookie_consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_uuid VARCHAR(36) NOT NULL,
    user_id VARCHAR(16) NULL,
    accepted_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_timezone VARCHAR(64) NULL,
    client_ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    policy_version VARCHAR(20) NOT NULL,
    policy_hash VARCHAR(64) NOT NULL,
    categories_accepted TEXT NOT NULL,  -- JSON array, ej: ["necessary","functional"]
    origin VARCHAR(40) NOT NULL,         -- "banner_initial"|"settings_change"|"dnt_auto"|"iframe_auto"
    retention_expires_at TIMESTAMP NOT NULL,
    revoked_at_utc TIMESTAMP NULL,
    revocation_reason VARCHAR(80) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_cookie_consents_visitor_uuid ON cookie_consents(visitor_uuid);
CREATE INDEX IF NOT EXISTS ix_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS ix_cookie_consents_policy_hash ON cookie_consents(policy_hash);
CREATE INDEX IF NOT EXISTS ix_cookie_consents_visitor_accepted ON cookie_consents(visitor_uuid, accepted_at_utc DESC);
```

**Nota crítica sobre `ON DELETE`:** a diferencia de `user_agreements` (que usa `ON DELETE CASCADE`), la tabla `cookie_consents` usa `ON DELETE SET NULL`. Motivación: cuando un usuario elimina su cuenta, el registro de consentimiento SOBREVIVE sin `user_id` pero con `visitor_uuid`, `ip`, `ua`, `policy_hash`, como prueba legal ante una eventual reclamación. Esto contradice literalmente el patrón del resto del schema y requiere validación del `legal-docs-keeper` en Capa 0: ¿hasta qué punto retener consentimiento tras borrado del usuario es compatible con Art. 17 GDPR? Propuesta: retener solo los campos estrictamente probatorios (UUID, hash, timestamp) durante 5 años bajo base Art. 17(3)(e), y NULL-ificar IP y UA tras 12 meses (pseudonimización).

### 5.2 Retención por categoría

- `retention_expires_at`:
  - Para consentimientos de analytics y marketing: `accepted_at_utc + 12 meses`. A los 12 meses, el frontend detecta registro expirado y fuerza re-preguntar. Alineado con recomendación EDPB 05/2020 §110 sobre re-consentimiento periódico.
  - Para consentimientos de solo necesarias + funcionales: `accepted_at_utc + 24 meses`.
  - Si el registro es `dnt_auto` o `iframe_auto`: `accepted_at_utc + 12 meses` para re-evaluar.
- Retención como evidencia legal: 5 años tras `revoked_at_utc` o `retention_expires_at`, lo que ocurra primero. Campo `revoked_at_utc` se setea cuando el usuario cambia categorías (el registro viejo NO se borra, se marca como revocado y se crea uno nuevo). Esto preserva trazabilidad histórica completa.

### 5.3 Visitor UUID

- Generado client-side con `crypto.randomUUID()` en la primera carga si no existe.
- Guardado en `localStorage` (clave `conniku_cc_visitor_uuid`) **y** en cookie HTTP `cc_visitor_uuid` (SameSite=Lax, Secure en prod, Path=/, HttpOnly=false para que JS pueda leerla, expiración 5 años). Estar en ambos minimiza la fricción cuando `localStorage` se limpia pero la cookie sobrevive, y viceversa.
- Al vincularse un usuario (login), `cookieConsentService` envía request a `POST /api/consent/cookies` con el `visitor_uuid` actual y el `user_id` recién obtenido. El backend actualiza todos los registros con ese `visitor_uuid` añadiendo el `user_id`. Esto permite migrar consentimiento anónimo a consentimiento identificado sin pedirlo de nuevo.

### 5.4 Payload del endpoint `POST /api/consent/cookies`

```json
{
  "visitor_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "categories_accepted": ["necessary", "functional"],
  "policy_version": "1.0.0",
  "policy_hash": "a1b2c3…",
  "origin": "banner_initial",
  "user_timezone": "America/Santiago",
  "user_agent_hint": "…"
}
```

El backend valida que `policy_hash` corresponda a la versión actual publicada. Si no, responde 409 Conflict con el hash vigente; el frontend debe re-mostrar el banner.

IP y `user_agent` definitivo los registra el backend desde `request.headers`, no desde el payload.

### 5.5 Payload del endpoint `GET /api/consent/cookies/{visitor_uuid}`

```json
{
  "visitor_uuid": "…",
  "categories_accepted": ["necessary", "functional"],
  "policy_version": "1.0.0",
  "policy_hash": "a1b2c3…",
  "accepted_at_utc": "2026-05-01T12:34:56Z",
  "retention_expires_at": "2028-05-01T12:34:56Z",
  "is_current_policy": true,
  "is_expired": false
}
```

Si `is_current_policy === false` o `is_expired === true`, el frontend debe abrir el banner de nuevo.

---

## 6. Flujo UX completo

### 6.1 Primera visita de visitante anónimo (Chile, sin DNT, no iframe)

1. Carga inicial: `CookieConsentProvider` arranca.
2. `cookieConsentService.initialize()`:
   - Genera `visitor_uuid` si no existe; lo persiste en `localStorage` y cookie.
   - Intenta `GET /api/consent/cookies/{visitor_uuid}`. Si responde 404 o `is_expired === true`, NO hay consentimiento vigente.
3. Se renderiza `<CookieBanner>` como overlay bloqueante (z-index alto, fondo dimmed).
4. Los 3 botones son visualmente equivalentes (mismo tamaño, mismo peso tipográfico, mismo contraste). Orden horizontal: [Personalizar] [Rechazar todas] [Aceptar todas]. En móvil: stacked vertical en el mismo orden.
5. Enlace visible "Ver Política de Cookies" → navega a `/cookies`.
6. Si usuario hace clic en "Aceptar todas":
   - `categories_accepted = ["necessary","functional","analytics","marketing"]`.
   - POST al backend.
   - Escribe `localStorage` (`conniku_cookie_consent_v1`) y cookie (`cc_consent_v1`).
   - Cierra banner.
7. Si hace clic en "Rechazar todas":
   - `categories_accepted = ["necessary"]`.
   - POST al backend.
   - Persistencia idem.
   - Cierra banner.
   - Scripts analytics y marketing NO se cargan en ésta ni en ninguna sesión futura mientras no cambie.
8. Si hace clic en "Personalizar":
   - Se abre `<CookieSettings>` (reemplaza al banner o se monta encima).
   - 4 toggles: Necesarias (ON, disabled), Funcionales (OFF por defecto), Analíticas (OFF por defecto), Marketing (OFF por defecto).
   - Texto por cada categoría describiendo finalidad y lista de claves principales.
   - Botón "Guardar preferencias" → POST con array de categorías activadas.
   - Botón "Rechazar todas" y "Aceptar todas" también presentes dentro del modal.

### 6.2 Visitas posteriores (mismo `visitor_uuid`)

1. `CookieConsentProvider` arranca.
2. Lee `localStorage.conniku_cookie_consent_v1`.
3. Verifica:
   - ¿Existe?
   - ¿`policy_hash` coincide con `COOKIE_CONSENT_POLICY_HASH` local?
   - ¿`retention_expires_at` > ahora?
4. Si todo OK: NO muestra banner. Aplica `consent` actual. Hace GET en background para confirmar contra servidor (detección de revocación desde otro dispositivo).
5. Si alguna verificación falla: muestra banner nuevo.

### 6.3 Cambio de política (bump de `COOKIE_CONSENT_POLICY_HASH`)

1. Backend publica nueva versión, por ejemplo `1.1.0` con nuevo hash.
2. Frontend carga la app. Lee consentimiento local con `policy_hash = "viejo"`.
3. Compara con `COOKIE_CONSENT_POLICY_HASH` nuevo. No coincide.
4. Muestra banner con texto breve: "Hemos actualizado nuestras cookies. Revisa tus preferencias." + detalle del cambio.
5. Usuario reingresa preferencias. Backend registra nueva fila con `policy_version="1.1.0"`; la fila vieja queda con `revoked_at_utc = now()` y `revocation_reason = "policy_update"`.

### 6.4 Footer: cambiar preferencias en cualquier momento

1. En `UnderConstruction.tsx` y en el Sidebar/TopBar de la app autenticada, `<CookieSettingsFooterLink>` renderiza un enlace discreto "Cookies" o un ícono de engranaje.
2. Click → abre `<CookieSettings>` pre-rellenado con `consent` actual.
3. Usuario modifica toggles. Click "Guardar":
   - POST al backend (nueva fila, `origin="settings_change"`).
   - Si el usuario quitó una categoría previamente aceptada, los scripts ya cargados en la sesión actual NO se pueden "desinstalar" dinámicamente. El modal informa: "Los cambios se aplicarán completamente tras recargar la página. ¿Deseas recargar ahora? [Recargar] [Más tarde]".
   - Si el usuario elige recargar, `window.location.reload()`. Si elige más tarde, el estado queda persistido y la próxima carga respeta la nueva preferencia.

### 6.5 Retirar todo el consentimiento (derecho GDPR Art. 7(3))

1. En `<CookieSettings>`, botón "Retirar todo el consentimiento" con énfasis visual similar a los otros botones.
2. Click → `categories_accepted = ["necessary"]`, POST, recargar recomendado.

### 6.6 Usuario logueado

1. Al hacer login, `auth.tsx` llama a `cookieConsentService.linkUserToVisitor(userId, visitorUuid)`.
2. Backend hace UPDATE en filas con ese `visitor_uuid` para setear `user_id`.
3. Si el usuario ya tenía consentimiento vinculado a otro `visitor_uuid` (otro dispositivo), el frontend muestra el más reciente y deja los históricos intactos.

### 6.7 Eliminación de cuenta

1. Endpoint actual de delete account NO debe borrar filas de `cookie_consents` (evita cascade).
2. En su lugar, al confirmar eliminación, backend hace `UPDATE cookie_consents SET user_id = NULL, client_ip = NULL, user_agent = NULL WHERE user_id = :uid`.
3. Permanecen: `visitor_uuid`, timestamps, `policy_hash`, `categories_accepted`. Suficiente como prueba legal.

---

## 7. Gating de scripts

### 7.1 Principio

Scripts no esenciales no se cargan hasta que `consent.{category} === true`.

### 7.2 Implementación propuesta

En `src/services/analytics.ts`:

```typescript
// Esqueleto (NO es código a copiar, solo estructura conceptual)
export async function loadAnalyticsIfConsented() {
  const consent = cookieConsentService.getCurrentConsent();
  if (!consent.analytics) return;
  // Inyecta <script async src="..."> en <head> solo si consent.analytics === true
  await loadExternalScript(GA_SCRIPT_URL);
}
```

Llamada desde `CookieConsentProvider` en `useEffect` cada vez que `consent.analytics` cambia a `true`. Si cambia de `true` a `false` en la sesión, no se desinstala: se avisa al usuario que recargue.

### 7.3 Reglas para cada categoría

| Script | Categoría | Gate implementado por | Frecuencia de evaluación |
| --- | --- | --- | --- |
| PWA Service Worker (`/sw.js`) | Necesaria | Sin gate, siempre carga | N/A |
| Auth token refresh | Necesaria | Sin gate | N/A |
| `initPushNotifications()` | Funcional | `consent.functional === true` | Al login y al cambio de consent |
| `conniku_theme`, `conniku_language` persistencia | Funcional | `cookieConsentService.shouldPersist('functional')` | En cada setter |
| Analytics tracker (futuro) | Analytics | `loadAnalyticsIfConsented()` | Al consent y al cambio |
| Meta Pixel, TikTok Pixel (futuro) | Marketing | `loadMarketingScriptsIfConsented()` | Al consent y al cambio |

### 7.4 Anti-pattern a evitar

NO cargar los scripts con `<script>` estático en `index.html` y luego intentar "desactivarlos" vía consent. Eso viola Planet49: el script ya se cargó y ya seteó cookies.

La regla es: **el `<script>` NO debe existir en el DOM hasta que el consent diga `true`.**

---

## 8. Estados especiales

### 8.1 Usuario en iframe

Detección: `window.self !== window.top`.

Comportamiento: aplicar automáticamente "solo necesarias" sin mostrar banner (evita double-consent y cumple con práctica de no pedir consentimiento en contextos incrustados donde el usuario no esperaba una experiencia Conniku completa). Registro con `origin="iframe_auto"`.

### 8.2 Do Not Track (DNT)

Detección: `navigator.doNotTrack === "1"` o equivalente multi-navegador (`window.doNotTrack`, `navigator.msDoNotTrack`).

Comportamiento: aplicar automáticamente "solo necesarias + funcionales", NO mostrar banner en primera visita. Registro con `origin="dnt_auto"`. En el footer sigue disponible el link de cookies para que el usuario habilite analíticas/marketing manualmente si lo desea.

Nota: no todos los navegadores envían DNT. No es sustituto del banner; es una optimización UX para usuarios que expresaron preferencia global.

### 8.3 GPC (Global Privacy Control)

Detección: `navigator.globalPrivacyControl === true`.

Comportamiento: equivalente a DNT. CCPA 2020+ considera GPC como señal legalmente vinculante para "Do Not Sell". La opción C lo tratará como rechazo automático de marketing incluso post-banner.

### 8.4 Usuario con adblock extremo

Si el banner mismo es bloqueado (poco probable, es código propio sin clases estándar de adtech), la app funciona sin él, pero ninguna categoría no esencial se activa (fail-closed). Esto es correcto bajo GDPR: la ausencia de consentimiento explícito = no consentimiento.

### 8.5 Navegador con cookies bloqueadas

Si `localStorage` lanza excepción al setear, se intenta cookie HTTP como fallback. Si cookie también falla, la experiencia degrada a "modo efímero": cada sesión pide consentimiento, nada se persiste. Banner sigue apareciendo cada sesión. No es violación legal; es limitación técnica que el usuario impuso.

### 8.6 App nativa (Capacitor, iOS/Android)

Capacitor expone `localStorage` igualmente. La detección `isNative()` ya existe en `src/services/capacitor.ts`. En nativo, la política ePrivacy técnicamente no aplica a cookies porque no hay navegador tercero; sin embargo, GDPR sí aplica al tratamiento. El banner se muestra igual en primera carga. Justificación: política uniforme reduce complejidad y exceso de compliance nunca perjudica.

---

## 9. Textos legales propuestos (copy v1.0 — borrador para `legal-docs-keeper`)

Los textos siguientes son **borradores**. `legal-docs-keeper` los revisa en Capa 0 y Cristian aprueba humanamente antes de que `frontend-builder` los pegue en el código.

### 9.1 Banner (primera capa)

**Título:** "Usamos cookies para que Conniku funcione bien"

**Cuerpo:** "Necesitamos tu permiso para algunas de ellas. Las cookies estrictamente necesarias mantienen tu sesión activa; las demás nos ayudan a recordar tus preferencias y a mejorar la plataforma. Puedes aceptar todas, rechazar las no esenciales, o personalizar qué permites."

**Botones (orden igual prominencia):**

1. [ Personalizar ]
2. [ Rechazar todas ]
3. [ Aceptar todas ]

**Enlace discreto debajo de los botones:** "Más detalles en nuestra [Política de Cookies](/cookies)."

### 9.2 Modal de personalización

**Título:** "Configurar cookies"

**Cabecera:** "Elige qué cookies permites. Puedes cambiar estas preferencias cuando quieras desde el pie de la página."

**Tarjetas por categoría:**

1. **Estrictamente necesarias** — Siempre activas. Permiten iniciar sesión, mantener tu sesión abierta y que Conniku funcione offline. Sin ellas, el servicio no puede prestarse. Base legal: ejecución del contrato (Art. 6(1)(b) RGPD).
   - Toggle ON, `disabled`.
2. **Funcionales** — Recuerdan tu idioma, tema visual, tour de bienvenida y progreso académico local entre visitas. No te identifican ni comparten datos con terceros.
   - Toggle OFF por defecto.
3. **Analíticas** — Nos permiten entender cómo se usa Conniku de forma anónima y agregada, para mejorar la plataforma. Hoy no tenemos integraciones externas activas; este toggle queda preparado para cuando las activemos.
   - Toggle OFF por defecto.
4. **Marketing** — Permitirían medir campañas y mostrarte contenido relevante. Hoy Conniku no usa cookies de marketing. Este toggle queda preparado para futuras funcionalidades.
   - Toggle OFF por defecto.

**Pie:**

- [ Rechazar todas ] — botón secundario
- [ Guardar preferencias ] — botón primario
- [ Aceptar todas ] — botón secundario equivalente en prominencia al rechazar
- Al costado: "Retirar todo el consentimiento" (link text) — GDPR Art. 7(3).

### 9.3 Aviso de cambio de política

"Actualizamos nuestra Política de Cookies el [fecha]. Revisa tus preferencias para continuar." + mismos 3 botones del banner inicial.

### 9.4 Mensaje de recarga recomendada

"Para aplicar completamente los cambios debemos recargar la página. [Recargar ahora] [Más tarde]."

### 9.5 Mensaje para iframe / DNT

No se muestra banner; si se solicita por consulta admin, mensaje en `/cookies`: "Detectamos tu señal de privacidad global y aplicamos solo cookies necesarias. Puedes cambiarlo desde este enlace."

---

## 10. Invariantes verificables (base de los tests)

Cada invariante debe tener al menos un test automatizado (unit, integration, o E2E según corresponda). Los tests los escribe el builder siguiendo TDD RED-GREEN-REFACTOR.

1. **I-01** En primera visita anónima (sin `localStorage` previo, sin cookie previa), el banner aparece antes de que se ejecute cualquier carga de script de las categorías no esenciales. Test: render de App + assert `document.querySelector('[data-testid="cookie-banner"]')` existe; assert `window.__loaded_analytics === undefined`.
2. **I-02** Los tres botones del banner (Aceptar todas, Rechazar todas, Personalizar) tienen el mismo tamaño visual, mismo peso tipográfico, mismo contraste WCAG AA mínimo 4.5:1. Test: snapshot visual + assert computed styles coinciden.
3. **I-03** Los toggles del modal de categorías no esenciales están OFF por defecto (Planet49). Test: render `<CookieSettings>` con consent vacío; assert `input[role=switch]` no-necesarios `aria-checked === false`.
4. **I-04** Al hacer clic en "Rechazar todas", `categories_accepted === ["necessary"]` tanto en `localStorage` como en el backend. Test: unit `cookieConsentService.reject()` + spy sobre fetch.
5. **I-05** Al hacer clic en "Aceptar todas", `categories_accepted === ["necessary","functional","analytics","marketing"]`. Test simétrico.
6. **I-06** `policy_hash` se verifica al leer consentimiento almacenado; si no coincide con `COOKIE_CONSENT_POLICY_HASH`, `hasConsent === false` y el banner reaparece. Test: set localStorage con hash viejo; render App; assert banner presente.
7. **I-07** Retirar consentimiento es igual de fácil que otorgarlo: el botón "Retirar todo" está en el mismo modal que los toggles, a un clic de distancia desde el link del footer. Test: E2E cypress-like — desde footer, click link, click retirar, assert fetch con `categories_accepted === ["necessary"]`.
8. **I-08** El backend RECHAZA POST con `policy_hash` distinto al actual (responde 409). Test: backend pytest.
9. **I-09** `ON DELETE` de usuario NO borra fila de `cookie_consents`; setea `user_id = NULL` y NULL-ifica IP+UA tras 12 meses (test del job de pseudonimización — Pieza 5).
10. **I-10** Scripts marcados `data-consent="analytics"` NO aparecen en el DOM si `consent.analytics === false`. Test: E2E + `document.querySelectorAll('script[data-consent]').length === 0`.
11. **I-11** `initPushNotifications()` no ejecuta `PushManager.subscribe` si `consent.functional === false`. Test: unit + spy.
12. **I-12** En iframe detectado (`window.self !== window.top`), banner no aparece y consent queda con `origin="iframe_auto"`. Test: unit con mock.
13. **I-13** Con DNT activo, banner no aparece y consent queda con `origin="dnt_auto"`, `categories_accepted = ["necessary","functional"]`. Test: unit con mock.
14. **I-14** El footer link "Cookies" abre `<CookieSettings>` desde cualquier página (autenticada o no). Test: E2E router-agnóstico.
15. **I-15** El `visitor_uuid` es estable entre recargas y persiste a limpieza de `localStorage` si la cookie sobrevive (y viceversa). Test: integration.
16. **I-16** Un consent vencido (`retention_expires_at < now()`) dispara banner nuevo al siguiente page load. Test: unit con mock de tiempo.
17. **I-17** El texto de la política canónica (banner + categorías) hasheado con SHA-256 coincide byte a byte con `COOKIE_CONSENT_POLICY_HASH` constante. Test: python unit + JS unit que computen el hash de la cadena canónica y comparen.
18. **I-18** El endpoint `GET /api/consent/cookies/policy-version` devuelve `{version, hash}` y coincide con las constantes locales. Test: backend pytest.
19. **I-19** El `CookieConsentProvider` NO rompe renders si backend está caído. Fallback: consent local, si no hay local, muestra banner y registra offline para reintento. Test: unit con mock de fetch erroring.
20. **I-20** Accesibilidad: banner tiene `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, se enfoca al montar, trap de foco activo, `Escape` NO cierra sin decisión (banner bloqueante). Test: axe-core + react-testing-library.

---

## 11. Piezas ejecutables

Cada pieza es commit atómico independiente. Cada pieza pasa por TDD RED-GREEN-REFACTOR. Cada pieza arranca con tests que fallan, el builder escribe código mínimo para que pasen, y refactoriza al final.

### Pieza 0 — Capa 0 legal (legal-docs-keeper + aprobación humana)

- Duración estimada: 0.5 día.
- Actores: `legal-docs-keeper` + Cristian.
- Entregables:
  - `docs/legal/drafts/cookie-banner-texts-v1.md` — borrador de textos del banner y modal.
  - `docs/legal/drafts/privacy-update-cookie-consent.md` — borrador de párrafo nuevo para Política de Privacidad mencionando la tabla `cookie_consents`.
  - Revisión de §3 y §5 de este plan — categorización de cookies y retención.
  - Aprobación humana explícita de Cristian en mensaje con cita directa: "Apruebo los textos v1 del banner y el esquema de retención propuesto para cookie_consents".
- Criterio de avance: sin aprobación humana, el builder NO arranca Pieza 1.

### Pieza 1 — Backend (modelo + migración + endpoints + tests)

- Duración estimada: 1 día.
- Actor: `backend-builder`.
- Archivos nuevos:
  - `backend/cookie_consent_routes.py`
  - `backend/migrations/add_cookie_consents_table.sql`
  - `backend/tests/test_cookie_consent_model.py`
  - `backend/tests/test_cookie_consent_routes.py`
- Archivos modificados:
  - `backend/database.py` — agregar modelo `CookieConsent` después de línea 1865.
  - `backend/migrations.py` — registrar nueva migración.
  - `backend/constants/legal_versions.py` — agregar `COOKIE_CONSENT_POLICY_VERSION`, `COOKIE_CONSENT_POLICY_HASH`.
  - `backend/server.py` — `include_router(cookie_consent_router)`.
  - `shared/legal_texts.py` — `COOKIE_BANNER_TEXT_V1`, `COOKIE_CATEGORIES_TEXT_V1`.
- Tests RED: I-04, I-05, I-08, I-09, I-17, I-18.
- Criterio verde: `pytest backend/tests/test_cookie_consent_*.py` pasa; `ruff check backend/` limpio; migración aplicada en base local sin errores.

### Pieza 2 — Frontend componentes + context + hook + service

- Duración estimada: 1.5 días.
- Actor: `frontend-builder`.
- Archivos nuevos:
  - `src/components/CookieConsent/CookieConsentProvider.tsx`
  - `src/components/CookieConsent/CookieBanner.tsx`
  - `src/components/CookieConsent/CookieSettings.tsx`
  - `src/components/CookieConsent/CookieToggle.tsx`
  - `src/components/CookieConsent/CookieSettingsFooterLink.tsx`
  - `src/components/CookieConsent/CookieBanner.module.css`
  - `src/hooks/useCookieConsent.ts`
  - `src/services/cookieConsentService.ts`
  - `shared/cookie_consent_constants.ts`
  - `src/__tests__/CookieConsent/*.test.tsx`
- Tests RED: I-01, I-02, I-03, I-06, I-19, I-20.
- Criterio verde: `vitest run` pasa; `eslint src/components/CookieConsent/ src/services/cookieConsentService.ts src/hooks/useCookieConsent.ts` limpio; `tsc --noEmit` limpio.

### Pieza 3 — Integración en App + gating de scripts

- Duración estimada: 0.5 día.
- Actor: `frontend-builder`.
- Archivos modificados:
  - `src/App.tsx` — envolver `<Routes>` con `<CookieConsentProvider>`; condicionar `initPushNotifications()`.
  - `src/services/i18n.tsx` — guard de `conniku_language` en anónimo.
  - `src/App.tsx` — guards de `conniku_theme`, `conniku_welcomed`.
  - `src/components/AppAvailableBanner.tsx` — guard.
  - `src/components/PWAInstallPrompt.tsx` — guard.
  - `src/services/analytics.ts` (nuevo) — placeholder con `loadAnalyticsIfConsented()`.
  - `src/pages/UnderConstruction.tsx` — agregar `<CookieSettingsFooterLink />` al footer.
- Tests RED: I-10, I-11, I-12, I-13.
- Criterio verde: `vitest run` + `vite build` sin errores; visual check manual de que banner aparece en `/` anónimo.

### Pieza 4 — Constantes y hashes canónicos

- Duración estimada: 0.25 día.
- Actor: `backend-builder` o `frontend-builder` según aplique.
- Archivos modificados:
  - `backend/constants/legal_versions.py` — hashes finales recalculados.
  - `shared/legal_texts.py`, `shared/legal_texts.ts` — textos canónicos.
  - `docs/legal/v3.2/METADATA.yaml` — registrar hash del markdown actualizado.
- Tests RED: I-17, I-18.
- Criterio verde: hash Python === hash TS === hash publicado.

### Pieza 5 — Tests E2E + job de pseudonimización

- Duración estimada: 0.75 día.
- Actor: `qa-tester` + `backend-builder`.
- Archivos nuevos:
  - `e2e/cookie-consent-banner.spec.ts` (o equivalente con herramienta vigente: Playwright/Cypress).
  - `backend/jobs/pseudonymize_cookie_consents.py` — script batch que NULL-ifica IP+UA en registros > 12 meses. Ejecución programada (cron en Render) o manual.
  - `backend/tests/test_pseudonymize_job.py`.
- Tests cubiertos: I-01 a I-20 end-to-end; el job pasa test determinístico con fixture.
- Criterio verde: E2E suite pasa en CI.

### Pieza 6 — Sincronización `docs/legal/v3.2/cookies.md` + bump version

- Duración estimada: 0.5 día.
- Actor: `legal-docs-keeper` + Cristian.
- Archivos modificados:
  - `docs/legal/v3.2/cookies.md` — contenido real espejado del TSX renderizado, mencionando el mecanismo de consentimiento nuevo.
  - `docs/legal/v3.2/METADATA.yaml` — `COOKIES_HASH` recalculado.
  - `backend/constants/legal_versions.py` — bump `COOKIES_VERSION` a `1.1.0` (minor: menciona banner; no es MAJOR porque no cambia el régimen de cookies existentes, solo documenta el mecanismo UX de consentimiento).
  - `docs/legal/v3.2/privacy.md` — agregar mención a la tabla `cookie_consents` como encargado interno de datos.
- Criterio verde: tests `test_legal_versions_v3_2_invariants.py` pasan con los nuevos hashes; aprobación humana registrada.

### Pieza 7 — Plan de upgrade a opción C (documentación)

- Duración estimada: 0.25 día.
- Actor: `web-architect`.
- Archivos nuevos:
  - `docs/plans/bloque-cookie-consent-banner-v2-ccpa-ley21719/plan-preliminar.md` — esqueleto del bloque futuro.
- Criterio verde: el esqueleto existe y lista los 4 trabajos pendientes (geoIP, botón Do Not Sell, retención extendida, auditoría de vencimientos). Ver §14.

---

## 12. Criterio de cierre (Capa 7)

Checklist binario, verificable con comandos concretos. Para declarar el bloque cerrado, TODOS los ítems deben estar marcados.

- [ ] **C-01** Banner visible al cargar `/` en ventana privada sin cookies previas. Verificable: DevTools → Application → clear storage → reload → `document.querySelector('[data-testid="cookie-banner"]')` retorna elemento.
- [ ] **C-02** "Aceptar todas" escribe `localStorage.conniku_cookie_consent_v1` con las 4 categorías y hace POST exitoso a `/api/consent/cookies`. Verificable: DevTools Network.
- [ ] **C-03** "Rechazar todas" escribe localStorage con solo `["necessary"]`. Verificable idem.
- [ ] **C-04** Con consent `analytics=false`, no aparece ningún `<script data-consent="analytics">` en DOM. Verificable: `document.querySelectorAll('script[data-consent="analytics"]').length === 0`.
- [ ] **C-05** Modal granular abre desde "Personalizar" y desde footer link "Cookies".
- [ ] **C-06** `CookieSettingsFooterLink` visible en footer de `UnderConstruction` y en `TopBar`/sidebar post-login.
- [ ] **C-07** Tabla `cookie_consents` creada en producción; verificable vía SQL `SELECT COUNT(*) FROM cookie_consents;` retorna ≥0.
- [ ] **C-08** Job de pseudonimización registrado en cron de Render (o script manual listo). Documentado en `docs/ops/cookie_consent_jobs.md`.
- [ ] **C-09** Pre-flight verde local:
  - `npx tsc --noEmit` exit 0
  - `npx eslint src/` exit 0
  - `npx vitest run` exit 0
  - `npx vite build` exit 0
  - `python3.11 -m pytest backend/ --tb=no -q` exit 0
  - `python3.11 -m ruff check backend/` exit 0
- [ ] **C-10** CI verde en GitHub PR.
- [ ] **C-11** Capa 0 legal cerrada: Cristian aprobó humanamente los textos y el esquema de retención. Evidencia en `docs/reports/YYYY-MM-DD-HHMM-legal-docs-keeper-cookie-consent-v1.md`.
- [ ] **C-12** `code-reviewer` quality score PASS (≥85).
- [ ] **C-13** `truth-auditor` quality score PASS (≥85), sin bloqueantes críticos.
- [ ] **C-14** `gap-finder` sin hallazgos críticos.
- [ ] **C-15** Capa 6 aprobada humanamente por Cristian en URL de preview Vercel.
- [ ] **C-16** `legal-docs-keeper` generó borrador de Política de Privacidad y Política de Cookies actualizadas; Cristian aprobó humanamente.
- [ ] **C-17** `BLOCKS.md` incluye entrada del bloque y `FROZEN.md` incluye los archivos nuevos canónicos (`cookieConsentService.ts`, `CookieConsentProvider.tsx`, `CookieBanner.tsx`, `cookie_consent_routes.py`, etc.).
- [ ] **C-18** Plan de upgrade a opción C documentado en `docs/plans/bloque-cookie-consent-banner-v2-ccpa-ley21719/plan-preliminar.md`.

---

## 13. Riesgos y mitigaciones

### Alto

- **R-A-01 — Desfase semántico entre política publicada y comportamiento real.** Si `CookiesPolicy.tsx` describe claves o proveedores que el banner no refleja, cualquier auditor externo detecta incoherencia. Mitigación: Pieza 6 sincroniza markdown + render TSX + constantes. `legal-docs-keeper` ejecuta auditoría de coherencia como parte del cierre.
- **R-A-02 — Clasificación incorrecta de cookie "necesaria" que en realidad requiere consentimiento.** Ejemplo: el `cc_visitor_uuid` propuesto como esencial podría no serlo según criterio EDPB. Mitigación: Capa 0 `legal-docs-keeper` revisa §3.5; si veredicto es "no esencial", se mueve a funcional y se documenta.
- **R-A-03 — Consent post-delete retenido más de lo permitido.** Retener IP de usuario eliminado podría violar Art. 17 GDPR si la base legal Art. 17(3)(e) no está bien justificada. Mitigación: pseudonimización a los 12 meses (job Pieza 5); documentación de base legal en política de privacidad; plazo máximo absoluto 5 años.

### Medio

- **R-M-01 — `localStorage` lleno o deshabilitado impide persistencia.** Mitigación: fallback a cookie, y si cookie también falla, "modo efímero" con mensaje informativo.
- **R-M-02 — Usuario cambia preferencias y espera efecto inmediato, pero scripts ya cargados persisten hasta recargar.** Mitigación: mensaje explícito "Para aplicar completamente debes recargar" con botón [Recargar ahora].
- **R-M-03 — `visitor_uuid` colisiona entre sesiones de usuarios distintos que comparten dispositivo.** Baja probabilidad (UUID v4) pero real. Mitigación: al login, se vincula usuario; el historial del UUID previo queda como evidencia de otro consumidor del dispositivo, sin impacto funcional.
- **R-M-04 — Banner no aparece en iframe pero el consent heredado no existe.** Mitigación: iframe aplica "solo necesarias" automáticamente, registro con `origin="iframe_auto"`.
- **R-M-05 — Adblock agresivo bloquea el POST al backend y el banner no se puede cerrar.** Mitigación: frontend siempre persiste localmente primero, POST en background con retry y cola offline. Banner se cierra al persistir local.
- **R-M-06 — Tests E2E quebrados intermitentemente por timing del provider.** Mitigación: usar testids estables, `waitFor` explícito.

### Bajo

- **R-B-01 — i18n faltante: los textos propuestos están en español chileno. Si un visitante inglés aterriza, ve español.** Mitigación: aceptable en v1 (público actual chileno). Bloque futuro i18n cookies incluye traducciones.
- **R-B-02 — Typografía o color del banner chocan con tema oscuro/claro.** Mitigación: tokens CSS semánticos `--bg-primary`, `--accent`.
- **R-B-03 — Footer link colisiona visualmente con otros links.** Mitigación: usar ícono estándar de privacidad o etiqueta "Cookies".

---

## 14. Upgrade path a opción C (CCPA + Ley 21.719, target noviembre 2026)

El plan del bloque futuro `bloque-cookie-consent-banner-v2-ccpa-ley21719` incluye los siguientes trabajos. Se documenta aquí para que opción B no tome decisiones que bloqueen opción C.

### 14.1 GeoIP detection

- Integración con MaxMind GeoLite2 (open source, descarga periódica del mmdb) en el backend.
- Endpoint `GET /api/geo/region` responde `{country, region}` en base a `request.client.host`.
- Frontend consulta al montar; si `country === "US" && region === "CA"`, aplica variante CCPA del banner.
- Si `country in ("CL","ES","DE",…)`, aplica variante GDPR/19.628.

**Decisión que afecta opción B:** la arquitectura de `CookieConsentProvider` debe aceptar un prop `region` opcional que modifique textos y botones. En opción B ese prop se llenará con `undefined` (banner uniforme); en opción C se llenará desde el GET `/api/geo/region`.

### 14.2 Botón "Do Not Sell or Share My Personal Information"

- Solo para región CA.
- Footer persistente independiente del modal de cookies.
- Link a formulario `/do-not-sell` separado.
- Registro en tabla `dns_optouts` nueva (o reutilizar `cookie_consents` con `origin="ccpa_dns"`).

### 14.3 Retención extendida a 5 años como evidencia

- Ya previsto en opción B para el post-revoked. Opción C formaliza política de retención diferenciada con texto en `/privacy` y en una nueva sección de `/cookies`.

### 14.4 Auditoría de consentimientos vencidos

- Cron job mensual en Render que identifica consentimientos con `retention_expires_at < now()` y los marca; frontend los detecta al siguiente login y re-pregunta.
- Ya previsto parcialmente en Pieza 5 (pseudonimización). Opción C añade la re-solicitud proactiva y un panel admin en `/admin/legal/cookie-consents` para inspeccionar.

### 14.5 Multi-idioma

- Traducciones al inglés (UE), portugués (LGPD Brasil), y ajustes regionales.
- Sistema i18n existente en `src/services/i18n.tsx` ya cubre el frontend; textos del banner se mueven a claves i18n en opción C.

### 14.6 Ajustes por Ley 21.719

- Revisar artículos específicos (estado vigente al momento de la implementación).
- Añadir campos o categorías si la ley introduce nuevas finalidades.

---

## Componente legal (sección obligatoria CLAUDE.md §18.7)

**Componente legal detectado: SÍ.**

Normas citadas (fuente verificable en §2):

- Reglamento UE 2016/679 (GDPR) Art. 4(11), 6(1)(a), 6(1)(b), 6(1)(f), 7, 13, 17, 17(3)(e).
- Directiva 2002/58/CE (ePrivacy) Art. 5(3).
- Ley 34/2002 (LSSICE) Art. 22.2.
- Ley 19.628 Art. 4°.
- Ley 21.719 (vigencia diferida, fecha exacta **requiere verificación en bcn.cl**).
- LGPD Lei 13.709/2018 Art. 7, 8, 18.
- CCPA/CPRA (California).
- Jurisprudencia: Planet49 C-673/17, Orange Romania C-61/19.
- EDPB Guidelines 05/2020 sobre consentimiento.
- AEPD Guía de cookies 2023.

Constantes nuevas en código:

- `COOKIE_CONSENT_POLICY_VERSION` (`"1.0.0"`), `COOKIE_CONSENT_POLICY_HASH` en `backend/constants/legal_versions.py` y espejo TS.
- `COOKIES_VERSION` bump a `"1.1.0"` en Pieza 6.

Documentos a actualizar (Pieza 6 + `legal-docs-keeper`):

- `docs/legal/v3.2/cookies.md` (contenido real, no stub).
- `docs/legal/v3.2/privacy.md` (mención de `cookie_consents` como encargado interno + mecanismo de consentimiento).
- `docs/legal/v3.2/METADATA.yaml` (hashes recalculados).

Aprobación humana explícita de Cristian requerida:

- Textos v1 del banner y modal (Capa 0).
- Clasificación de `cc_visitor_uuid` como esencial vs funcional (Capa 0).
- Esquema de retención de `cookie_consents` (Capa 0).
- Bump de versión de `COOKIES_HASH` en Pieza 6.
- OK final en Capa 6 tras inspección en preview.

---

## Fuera de scope de este bloque

Para evitar scope creep, estos temas NO se resuelven aquí:

- Integración de analytics real (Google Analytics, Plausible, PostHog, producto propio). El placeholder queda, la integración va en bloque analytics-v1.
- Integración de marketing pixels. Fuera de scope.
- GeoIP detection. Opción C.
- Multi-idioma del banner. Opción C.
- Panel admin para auditar consentimientos. Opción C.
- Tests de carga del endpoint `/api/consent/cookies`. Bloque performance-v1 futuro.
- Migración de visitantes históricos sin consentimiento (backfill). No hay histórico: los visitantes viejos simplemente verán el banner la próxima vez. Documentado en política.
- Reemplazo de `user_agreements` por un schema unificado con `cookie_consents`. Schemas separados por diseño.
- Ajustes a CLAUDE.md o a la sección 22 del mismo documento. Separado.

---

## Apéndice A — Razonamiento extendido

### A.1 ¿Qué scripts del producto actual ya setean cookies no esenciales?

**Respuesta:** hoy, ninguno que sea analytics o marketing. Todos los usos de `localStorage` detectados en Grep son:

- Autenticación (esencial).
- Preferencias de UI (funcionales).
- Datos administrativos post-login (funcional por ejecución de contrato).
- Service Worker cache (esencial).

Hay UNA categoría borde que vale resaltar: `conniku_theme`, `conniku_language`, `conniku_welcomed`, `conniku_apps_banner_v3`, `pwa-install-dismissed`. Estos son funcionales de visitante ANÓNIMO. Hoy se setean sin gate. Post-bloque, solo se setean si `consent.functional === true`. Para un visitante anónimo que rechaza funcionales, el tema vuelve al default del sistema y el tour reaparece cada visita. Es aceptable: el usuario eligió esa experiencia al rechazar.

No hay ningún tracker que haya estado operando sin gate. Verificado.

### A.2 Estrategia para analytics anónimos server-side sin PII

**Propuesta:** el backend de Conniku puede registrar eventos agregados de uso sin necesidad de cookies y sin identificadores personales:

- Request arriva a `/api/...` con `user_id` (si logueado) u `anon`.
- Middleware `analytics_middleware` registra en tabla agregada `usage_events`: `{endpoint, timestamp_bucket_hour, user_bucket_hash}`, donde `user_bucket_hash = SHA256(ip + ua + salt_mensual)[:8]`. Ese hash rota mensualmente, nadie puede correlacionar entre meses, y el bucketing por hora impide rastrear sesiones individuales.
- Base legal: interés legítimo Art. 6(1)(f) GDPR — medir carga del servicio para operarlo. Política de privacidad lo declara.
- NO requiere banner porque no hay cookie ni identificador persistente del usuario. Es analítica de infraestructura, no de usuario.
- Ventaja: Conniku obtiene métricas de uso real incluso si el usuario rechazó "analytics". Desventaja: granularidad baja (nunca podrá saber "usuario X clicó botón Y en sesión Z"), lo cual es por diseño.

Este trabajo vive en otro bloque futuro (`bloque-analytics-server-side-v1`), no en este. Pero se documenta aquí para que el diseño del banner no bloquee su coexistencia.

### A.3 Usuario que visita web pública y después usa la app: herencia de consentimiento

**Escenario:** visitante anónimo acepta/rechaza cookies en `conniku.com/`. Luego se registra. Luego usa la app autenticada.

**Propuesta de herencia:**

1. Banner aplica al dominio `conniku.com` y a cualquier subdominio de primera parte. La cookie `cc_visitor_uuid` se setea con `Domain=.conniku.com, Path=/`.
2. Al registrarse, `Register.tsx` recibe el `visitor_uuid` actual desde `cookieConsentService` y lo envía junto con los datos de registro a `POST /api/auth/register`.
3. Backend recibe el UUID y hace UPDATE: `UPDATE cookie_consents SET user_id = :new_user_id WHERE visitor_uuid = :uuid`.
4. La próxima visita autenticada encuentra consent vinculado por `user_id`. No se vuelve a mostrar banner.
5. Si el usuario accede desde otro dispositivo (nuevo `visitor_uuid`), el backend consulta por `user_id` y encuentra el consent. Frontend lo hereda al localStorage del dispositivo nuevo.

Ventaja: una sola decisión de cookie por usuario, no una por dispositivo. Desventaja: si un usuario quiere preferencias distintas por dispositivo, tiene que cambiarlas por dispositivo. Aceptable — el caso común es que un usuario quiere la misma postura en todos sus dispositivos.

**Caso borde:** dispositivo compartido — dos usuarios distintos desde el mismo navegador. Cada uno tendrá su propio `user_id` y al login se descarga SU consent, sobrescribiendo el del otro en el localStorage local. La tabla retiene ambos históricos por `user_id`. Aceptable.

---

FIN DEL PLAN.
