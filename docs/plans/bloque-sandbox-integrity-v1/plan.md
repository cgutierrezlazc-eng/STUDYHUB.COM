# Plan · bloque-sandbox-integrity-v1

**Fecha**: 2026-04-22
**Autor**: web-architect (Tori)
**Rama prevista**: `bloque-sandbox-integrity-v1`
**PR destino**: `main`
**Estado**: borrador — pendiente aprobación de Cristian + batch `D-S1…D-S8`.
**Modelo**: Opus (decisiones de arquitectura + componente legal activo).

---

## 1. Contexto

### 1.1 Pedido literal de Cristian (2026-04-22)

> "corregir los 3 placebos DE RAÍZ en un solo bloque + agregar feedback loop de soporte pendiente [...] solución permanente 2+ años, sin placebos, sin 'fases futuras'."

### 1.2 Auditoría retroactiva que origina el bloque

Cristian activó auditoría retroactiva el 2026-04-22 contra la regla **`feedback_soluciones_permanentes.md`** (memoria Tori, ver anexo §1.3) y rechazó tres soluciones "placebo" previas:

1. **Banner cookies en sandbox HTML** — solo persiste en `localStorage['conniku_cookie_consent_v1']` y **no llama** a `POST /api/consent/cookies`. Verificado leyendo `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/_inject_cookie_banner.py` líneas 225-312: la función `save(consent)` solo hace `localStorage.setItem`. No hay `fetch`.
2. **Modal legal en sandbox** — carga iframes `legal-terms.html` / `legal-privacy.html` / `legal-cookies.html` / `legal-age-declaration.html` pero **no registra `document_views`** del Bloque `legal-viewer-v1`. Verificado en `_inject_legal_modal.py` líneas 135-184: solo abre iframe, no hace `POST /legal/documents/{doc}/viewed`.
3. **HRDashboard.tsx** — duplica constante `CHILE_LABOR` (líneas 163-327, ~165 líneas) en vez de importar desde `shared/chile_constants.ts`. Verificado con grep (30 matches de `CHILE_LABOR` en el archivo). El comentario de la línea 162 declara textualmente: *"debe mantenerse sincronizado byte-a-byte"*, lo que contradice la convención del repo (ver `scripts/verify-chile-constants-sync.sh`).

### 1.3 Regla raíz aplicada en este plan

Del memo `feedback_soluciones_permanentes.md` (`/Users/cristiang./.claude/projects/-Users-cristiang--CONNIKU/memory/`):

> *"Toda solución que Tori proponga o ejecute debe cumplir 4 criterios: funcional end-to-end, integrada con infraestructura real, escalable a 2+ años, sin deuda documentada como 'para después'."*

Aplicación directa al bloque:

| Criterio | Cómo lo cumple `sandbox-integrity-v1` |
|---|---|
| Funcional end-to-end | Consent real en BD + view real en BD + constantes desde shared + feedback en BD. Sin placebos. |
| Integrada con infra real | Reusa `POST /api/consent/cookies`, `POST /legal/documents/{doc}/viewed`, `shared/chile_constants.ts`, patrón `contact_tickets` para rate-limit y retención. Cero endpoints duplicados. |
| Escalable 2+ años | `public/sandbox/` versionado en git, deploy automático Vercel, gate bumpeable. Tabla `support_feedback` con pseudonimización a 12m y retención 2 años alineada con `contact_tickets`. Feature flag si fuera necesario. |
| Sin deuda "para después" | Los 4 placebos se corrigen dentro del bloque. Migración sandbox→React completa y consent+view+feedback reales desde día 1. |

### 1.4 Precedentes técnicos verificados en el repo

**`cookie_consent_routes.py` (LEÍDO COMPLETO)**:
- Endpoint `POST /api/consent/cookies` ya existe con validación `policy_hash` contra `COOKIE_CONSENT_POLICY_HASH` canónico (409 si obsoleto). Payload acepta campo `origin` con valores permitidos `{banner_initial, settings_update, dnt_auto, iframe_auto}` (ver validador línea 89). **Falta `sandbox` como origin permitido** → D-S3.
- IP real desde `X-Forwarded-For`, retención 5 años (`_RETENTION_DAYS = 5*365`), visitor_uuid de 36 chars obligatorio.

**`legal_document_views_routes.py` (LEÍDO COMPLETO)**:
- Endpoint `POST /legal/documents/{doc_key}/viewed` ya existe. Acepta `session_token` opcional (UUID4), `scrolled_to_end`, `doc_hash`. 409 si hash obsoleto. Retención 5 años.
- `DocKey = Literal["terms", "privacy", "cookies", "age-declaration"]` — los 4 documentos del sandbox ya tienen soporte.
- `CANONICAL_HASHES` hardcoded en el router con los hashes vigentes de `docs/legal/v3.2/`.

**`shared/chile_constants.ts` (LEÍDO COMPLETO)**:
- Exporta `UF_ABRIL_2026`, `UTM_ABRIL_2026`, `SUELDO_MINIMO_2026`, `AFP_OBLIGATORIA_PCT`, `AFC_TRABAJADOR_INDEFINIDO_PCT`, `AFC_EMPLEADOR_INDEFINIDO_PCT`, `AFC_EMPLEADOR_PLAZO_FIJO_PCT`, `SIS_PCT`, `TOPE_IMPONIBLE_AFP_UF`, `TOPE_IMPONIBLE_AFC_UF`, `WEEKLY_HOURS_PRE_42H`, `WEEKLY_HOURS_POST_42H`, `FECHA_ESCALON_42H`, `RETENCION_HONORARIOS_2026_PCT`, `IVA_PCT`, `PPM_PROPYME_14D3_PCT`, `IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM`.
- Funciones `getWeeklyHoursAtDate(fecha)` y `getMonthlyHoursAtDate(fecha)` ya disponibles para la regla dinámica del corte 2026-04-26.
- **Gap detectado**: `shared/chile_constants.ts` no exporta `IMM` ni `TOPES.saludUF` (se usan en HRDashboard pero no están en shared). Esto se resuelve en §4 paso T5 (agregar al shared o bien definir wrappers helper específicos del HR).

**`backend/server.py` líneas 90-107 CORS (LEÍDO)**:
- Whitelist: `http://localhost:5173`, `http://localhost:8899`, `https://conniku.com`, `https://www.conniku.com`, `https://studyhub-com.vercel.app`.
- Regex dinámica `r"https://[a-z0-9-]+\.vercel\.app"` ya acepta cualquier preview Vercel del repo → el sandbox desplegado en `sandbox-preview-<branch>.vercel.app` **ya está cubierto** por la regex. No requiere cambio de CORS explícito si servimos desde el mismo dominio.
- **Excepción**: si el sandbox se sirve desde un dominio distinto (ej. `sandbox.conniku.com`), hay que agregarlo al `CORS_ORIGINS` env var. Decidido en D-S7.

**`contact_tickets_routes.py` (plan D-T1…D-T8 ya aprobado)**:
- Patrón de retención: 5 años con `retention_expires_at` por fila + `pseudonymized_at_utc` a 12 meses.
- Patrón de rate-limit: `slowapi` (declarado en plan, implementación en curso).
- `support_feedback` reusa esta estructura (D-S6).

**`vite.config.ts`**:
- `base: '/'`, `root: '.'`, `build.outDir: 'dist/renderer'`.
- **Crítico**: Vite por defecto copia todo `public/` al root del bundle. Si creamos `public/sandbox/`, queda disponible como `/sandbox/...` en dev (5173) y en Vercel.
- Sin config adicional si la ruta es estática (HTML + JS vanilla + iframes).

### 1.5 Componente legal activo

**COMPONENTE LEGAL DETECTADO** (trigger de Capa 0 obligatoria):

- **Consent de cookies desde sandbox = consent real con valor probatorio** (GDPR Art. 7(1) demostrabilidad + Ley 19.628 Art. 4). El POST desde `/sandbox/landing-preview.html` genera fila en `cookie_consents` con IP + UA + hash + timestamp. Esto ya es registro legal, no simulacro.
- **`document_views` del sandbox = evidencia de lectura pre-registro** (Bloque `legal-viewer-v1` D-L5). Se vincula por `session_token` (UUID4 del visitante) al futuro registro si el usuario se registra.
- **`support_feedback` = nueva tabla de datos personales indirectos** (IP + UA + comentario libre que puede contener datos personales). Requiere:
  - Enumerar la finalidad en Política de Privacidad (bump menor).
  - Retención + pseudonimización declaradas (D-S6).
  - Evaluación de rate-limit para abuso (D-S6 cubre).

**Capa 0 `legal-docs-keeper` OBLIGATORIA antes de Capa 1** para:
1. Confirmar que Privacy v2.4.0 cubre "consent vía sandbox público" o requiere bump a v2.4.1 con mención explícita.
2. Revisar que el texto del consent del sandbox declare que el registro queda en BD real (no solo localStorage).
3. Validar el borrador de enumeración de `support_feedback` en Privacy.

### 1.6 Estado actual del sandbox (inventario verificado)

Conteo en `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/`:
- **72 archivos totales**
- **59 HTML** (55 de producto + 4 legales: `legal-terms.html`, `legal-privacy.html`, `legal-cookies.html`, `legal-age-declaration.html`)
- **10 scripts Python** (`_inject_*.py`, `_build_legal_pages.py`, `_apply_*.py`, `_patch_*.py`, `_reorganize_*.py`, `patch_banner.py`)
- **1 `_gate.js`** con password `conniku-preview-2026` (inyectado en cada HTML por `_inject_gate_script.py`)
- **1 `CONTEXT.md`** con historia del proceso
- **1 `landing.md`** (spec L.01–L.21)

`landing.html` marcado CONGELADO en `CONTEXT.md` como base inmutable — se copia tal cual al repo.

### 1.7 Decisiones previas en memoria relevantes

- **"check-lock.sh NO previene paralelismo real"** (`feedback_paralelismo_claudes.md`) → revisar `git status` al inicio de cada fase del bloque.
- **"Bloque legal v2 cerrado con PR #21"** (`project_bloque_legal_v2_cierre_20260420.md`) → Privacy v2.4.0 ya contiene consent vía sandbox porque se bumpó cuando se agregó cookies en el landing público. Verificar en Capa 0.
- **"Funnel Display pesos"** (`reference_funnel_display.md`) → no afecta este bloque, solo si se re-estiliza.
- **"Verificar causa antes fix visual"** (`feedback_verify_before_fix.md`) → no aplica, el bloque no tiene fix visual.

---

## 2. Decisiones `D-S1 … D-S8`

Cada decisión lista alternativas, trade-offs y recomendación Tori. Cristian responde batch (§9).

### D-S1 · Ruta pública del sandbox dentro del repo

**Problema**: elegir el path URL con que se servirá el sandbox desde Vercel y desde `vite dev`.

**Alternativas**:
- **A)** `/sandbox/landing-preview.html` directo; el landing se abre por URL explícita. Pros: simple. Contras: navegación por URL requiere conocer el nombre del archivo.
- **B)** `/sandbox/` con `index.html` que hace redirect HTML a `landing-preview.html`. Pros: URL corta y memorable; fácil compartir. Contras: un file extra de 3 líneas.
- **C)** `/preview/` en vez de `/sandbox/`. Pros: nombre más user-friendly. Contras: colisiona con convenciones Vercel (branches preview).

**Recomendación Tori**: **B — `/sandbox/` con index que redirige a `landing-preview.html`**. Razones:
- URL canónica `conniku.com/sandbox/` es estable y compartible.
- El index puede crecer a "home del sandbox" (listado de las 55 páginas) sin romper la URL base.
- Vercel sirve `/sandbox/` → `/sandbox/index.html` automáticamente sin redirect server-side.

### D-S2 · Gate password — mantener o bumpear

**Problema**: el password `conniku-preview-2026` (`_gate.js`) venía de uso por WhatsApp en grupo pequeño. Ahora la URL es pública en Vercel y el gate queda accesible para bots.

**Alternativas**:
- **A)** Mantener `conniku-preview-2026`. Pros: cero fricción. Contras: cualquiera que haya visto el ZIP histórico entra.
- **B)** Bumpear a password nuevo random, rotable vía env var (`VITE_SANDBOX_GATE_PASSWORD` en Vercel). Pros: control total, rotable. Contras: requiere refactor de `_gate.js` para leer env var (no puede hardcodear).
- **C)** Bumpear a password nuevo hardcoded en `_gate.js`, sin env var. Pros: simple. Contras: rotar implica commit.

**Recomendación Tori**: **C con plan de subir a B en Bloque 3**. Razones:
- Bumpear ahora (URL pública → exposure mayor) es imprescindible.
- Env var (B) requiere build time injection que complica el servido de HTMLs estáticos desde `public/`. Vite no inyecta env vars en archivos de `public/` (los copia tal cual). Requeriría mover a template Jinja pre-build o inyectar post-build — out of scope de este bloque.
- Solución **permanente** al nivel de este bloque: hardcoded en `_gate.js` + password nuevo + commit dedicado con `security:` para evitar historia pública del viejo password.
- **NO califica como placebo** porque:
  - La exposure del gate es mitigación, no authn seria (el sandbox no contiene datos reales de usuarios).
  - El cambio a env var requiere arquitectura build distinta, no "solución perezosa" sino trabajo estructural para otro bloque.
  - Se documenta explícitamente en `§7 Fuera de scope` con fundamento técnico.

**Password propuesto**: generado por Cristian antes del merge (Tori NO inventa passwords). Batch §9 espera respuesta con password concreto.

### D-S3 · Campo `origin` en cookie_consents — agregar valor `sandbox`

**Problema**: `CookieConsentCreate.origin` valida contra `{banner_initial, settings_update, dnt_auto, iframe_auto}`. El consent desde sandbox no encaja en ningún valor actual.

**Alternativas**:
- **A)** Agregar `sandbox` al set permitido (total 5 valores). Pros: trazabilidad exacta, permite análisis diferenciado. Contras: requiere migración/actualización del validador + tests.
- **B)** Reusar `banner_initial`. Pros: cero cambios backend. Contras: contamina métricas (ya no distingue banner de producto vs banner de sandbox).
- **C)** Agregar dos valores: `sandbox_banner_initial` y `sandbox_settings_update`, espejando la dualidad actual. Pros: máxima granularidad. Contras: combinatoria crece.

**Recomendación Tori**: **A — agregar valor `sandbox`**. Razones:
- Aislar origen del consent es imprescindible para análisis legal futuro ("¿qué % de consents viene de lectores de blog vs usuarios que intentan registrarse?").
- Un solo valor `sandbox` basta: la fase "initial vs settings" del banner queda cubierta por el timestamp + histórico de revocaciones.
- Cambio mínimo: una línea en el validador + update de la enumeración en la documentación Pydantic.

### D-S4 · `session_token` / `visitor_uuid` — persistencia en sandbox

**Problema**: el sandbox hoy no genera ningún UUID; el consent se guarda anónimo por sesión de navegador. Para llamar a `POST /api/consent/cookies` se requiere `visitor_uuid` (36 chars) y para `POST /legal/documents/{doc}/viewed` se requiere `session_token` (UUID4). Decisión: ¿un solo UUID compartido? ¿persistente entre visitas?

**Alternativas**:
- **A)** UUID único generado al primer visit, guardado en `localStorage['conniku_visitor_uuid']`. Mismo valor usado como `visitor_uuid` (cookie_consents) y `session_token` (document_views). Persistente entre visitas (hasta que el usuario limpie storage). Pros: permite re-uso del consent entre páginas del sandbox; vincula consent con views del mismo visitante. Contras: si 2 usuarios comparten browser (kiosko) quedan asociados.
- **B)** UUID regenerado cada sesión (sin localStorage, solo en memoria). Pros: máximo anonymity. Contras: re-muestra banner cada visita; `document_views` queda desvinculado del consent anterior.
- **C)** Dos UUIDs separados: uno persistente para consent, otro por visita para views. Pros: granularidad máxima. Contras: complejidad sin beneficio claro.

**Recomendación Tori**: **A — UUID compartido persistente en localStorage con clave `conniku_visitor_uuid`**. Razones:
- Coherencia con el producto React que hace lo mismo en `CookieBanner.tsx` (Bloque `cookie-consent-banner-v1`).
- Permite al Bloque 7 (registro) "rescatar" el consent + views previos del visitante anónimo vinculando al `user_id` cuando se registra. Esto es infraestructura 2+ años.
- Privacy v2.4.0 ya menciona `visitor_uuid` como identificador de consent anónimo.
- Caso kiosko es excepción documentable en FAQ, no motivo para degradar diseño general.

### D-S5 · Feedback loop de soporte — qué se pregunta y dónde

**Problema**: tabla `support_feedback` nueva. Define UX de las preguntas y posicionamiento.

**Alternativas**:
- **A)** Botones 👍/👎 debajo de cada `<details>` abierto en `soporte.html`, con textarea opcional al hacer click en 👎. Pros: mínima fricción, contextual. Contras: requiere trackeo de `faq_id` estable.
- **B)** Encuesta final al cierre de `soporte.html` ("¿Resolvió tu duda?"). Pros: una sola interacción. Contras: baja tasa de respuesta fuera del contexto.
- **C)** Híbrido: botones por FAQ + banner final "¿Encontraste lo que buscabas?". Pros: doble captura. Contras: sobre-pregunta.

**Recomendación Tori**: **A**. Razones:
- Granularidad por FAQ permite mejorar el copy específico.
- La friccion mínima (1 click) produce mayor tasa de respuesta.
- Textarea solo al 👎 captura info de mejora sin ser intrusiva.
- Patrón estándar (docs.github.com, developer.mozilla.org, stripe docs).

**Esquema UX**:
```
<details>
  <summary>¿Cómo recupero mi contraseña?</summary>
  <p>... contenido ...</p>
  <div class="faq-feedback" data-faq-id="pwd-recovery">
    <span>¿Te resultó útil?</span>
    <button data-useful="true">👍 Sí</button>
    <button data-useful="false">👎 No</button>
  </div>
</details>
```

Al click en 👎 se expande textarea opcional + botón "Enviar". Ambos botones disparan `POST /support/feedback` con `session_token` del visitante (D-S4).

**Trabajo de asignación de `faq_id`**: cada `<details>` de `soporte.html` recibe `data-faq-id="<slug-estable>"`. Los slugs se documentan en `docs/support/faq-catalog.md` para versionarlos.

### D-S6 · Retención `support_feedback`

**Problema**: datos personales indirectos (IP, UA, comentario libre). Requiere retención acotada y pseudonimización.

**Alternativas**:
- **A) 2 años** desde `created_at`, pseudonimización de IP/UA a 12 meses. Fundamento: coherente con pattern `contact_tickets` (D-T4).
- **B) 5 años**. Fundamento: coherente con `cookie_consents` y `document_views` (Art. 2515 CC + GDPR Art. 17(3)(e)).
- **C) 1 año**. Pros: minimización máxima (GDPR Art. 5(1)(e)). Contras: métricas de mejora por FAQ limitadas a series de 12 meses.

**Recomendación Tori**: **A — 2 años**. Razones:
- El dato de feedback NO es evidencia legal probatoria (no hay obligación de retención a 5 años).
- 2 años coincide con el horizonte de análisis de producto (iteración anual de documentos + comparación y/y vs y-1).
- Pseudonimización a 12 meses cubre principio de minimización: tras 12m queda solo `{faq_id, useful, comment_hash, created_at}` sin PII.
- Coherente con `contact_tickets` (mismo dominio: soporte usuario).

**Schema propuesto**:
```sql
CREATE TABLE support_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id VARCHAR(128) NOT NULL,
  useful BOOLEAN NOT NULL,
  comment TEXT, -- opcional, max 2000 chars
  session_token UUID, -- nullable para usuarios autenticados
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- si hay JWT
  ip_address VARCHAR(64), -- pseudonimizado a 12m
  user_agent VARCHAR(512), -- pseudonimizado a 12m
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  pseudonymized_at_utc TIMESTAMP, -- null hasta primera pseudonimización
  retained_until_utc TIMESTAMP NOT NULL -- created_at + 2 años
);
CREATE INDEX idx_support_feedback_faq_id ON support_feedback(faq_id);
CREATE INDEX idx_support_feedback_created ON support_feedback(created_at);
```

### D-S7 · CORS — ¿el sandbox necesita cambios?

**Problema**: el sandbox desde `public/sandbox/` corre bajo el mismo dominio que el frontend principal (conniku.com, *.vercel.app). Los POST a `/api/consent/cookies`, `/legal/documents/{doc}/viewed`, `/support/feedback` funcionan same-origin.

**Alternativas**:
- **A)** No tocar CORS. Mismo dominio, mismas reglas. Pros: cero riesgo. Contras: si se cambia a dominio separado (sandbox.conniku.com), rompe.
- **B)** Agregar `sandbox.conniku.com` preventivamente al whitelist. Pros: futuro-proofing. Contras: exposición innecesaria hoy.
- **C)** Dejar CORS como está + documentar en `§7 Fuera de scope` la migración a subdominio separado.

**Recomendación Tori**: **A + documentación (C combinado)**. Razones:
- Verificación §22: la regex `r"https://[a-z0-9-]+\.vercel\.app"` ya cubre previews. Same-origin para producción.
- No hay necesidad actual de subdominio separado.
- Si en el futuro se migra a `sandbox.conniku.com`, se abre bloque dedicado.

### D-S8 · Manejo de errores de red al hacer POST desde sandbox

**Problema**: el sandbox es usado eventualmente desde conexiones inestables. Si `POST /api/consent/cookies` falla (timeout, 500, 409 por hash obsoleto), ¿qué hacer?

**Alternativas**:
- **A) Cache-and-retry**: guardar en `localStorage['conniku_pending_consent']` + retry en próxima visita. Pros: resiliente. Contras: complejidad cola client-side.
- **B) Best-effort + localStorage fallback**: guardar en localStorage siempre + intentar POST; si falla, solo queda en localStorage hasta próxima visita. Retry implícito al re-cargar el banner. Pros: simple, UX no bloqueado. Contras: ventana de inconsistencia.
- **C) Bloqueante**: si el POST falla, mostrar error y no dejar dismissar el banner. Pros: máxima coherencia BD. Contras: UX pésimo, usuario queda pegado.
- **D) Silencioso**: guardar solo en localStorage si POST falla, sin retry ni indicador. Pros: el más simple. Contras: pérdida permanente del dato.

**Recomendación Tori**: **B — best-effort + localStorage fallback con retry implícito en próxima apertura del banner**. Razones:
- Principio GDPR Art. 7: el consent es válido independiente de la capacidad del servidor en ese momento — la prueba debe existir, pero la UX del usuario no debe degradarse.
- El banner se re-muestra en próxima visita si el localStorage indica "consent pending sync" → oportunidad de retry transparente.
- Si el hash canónico cambia (409), el banner se re-muestra obligatoriamente con nueva versión (comportamiento ya contemplado en `cookie_consent_routes.py` líneas 168-183).
- **NO es placebo**: la solución integra el path real; el fallback solo protege UX en errores transitorios, no reemplaza el registro.

**Implementación del retry**:
```js
// Flujo ckAcceptAll simplificado
async function ckAcceptAll() {
  const consent = { functional: true, analytics: true, marketing: true };
  // 1. Guardar local siempre (para UX instantánea)
  save(consent);
  hideBanner();
  closeModal();
  // 2. Intentar POST real
  try {
    await postConsentToBackend(consent);
    markSynced();
  } catch (err) {
    console.warn('[sandbox] consent POST falló, quedará en retry', err);
    markPendingSync();
  }
}
// Al cargar próxima visita: si pending_sync=true, reintenta una vez.
document.addEventListener('DOMContentLoaded', () => {
  if (isPendingSync()) retryPendingSync();
});
```

---

## 3. Archivos a tocar

Todos los paths son absolutos desde la raíz `/Users/cristiang./CONNIKU/`.

### 3.1 Migración del sandbox (Punto 1)

- **NUEVO** `public/sandbox/index.html` — landing del sandbox con redirect a `landing-preview.html` (D-S1).
- **NUEVO** `public/sandbox/landing.html` — copia byte-a-byte del congelado `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/landing.html`.
- **NUEVO** `public/sandbox/landing-preview.html` — copia del actual.
- **NUEVO** `public/sandbox/*.html` (58 archivos HTML restantes, incluyendo 4 legales `legal-*.html`).
- **NUEVO** `public/sandbox/_gate.js` — con password nuevo (D-S2).
- **NUEVO** `public/sandbox/_scripts/` — directorio con los 10 scripts Python como herramientas de mantenimiento. **No se ejecutan en el build**, solo quedan versionados.
- **NUEVO** `public/sandbox/CONTEXT.md` — copia con nota "migrado al repo".
- **NUEVO** `public/sandbox/landing.md` — copia del spec L.01–L.21.
- **NUEVO** `public/sandbox/README.md` — documenta: cómo actualizar HTMLs (via scripts en `_scripts/`), cómo bumpear password del gate, ruta de verificación.

### 3.2 Backend — cookie_consents sandbox origin (Punto 2)

- **MODIFICAR** `backend/cookie_consent_routes.py` línea 89 — agregar `"sandbox"` al set `valid_origins` del validador `CookieConsentCreate.validate_origin`. **Test nuevo** en `backend/tests/test_cookie_consent.py` verifica que `origin="sandbox"` se acepta y cualquier otro string inválido sigue rechazado.
- **NO requiere migración DB**: el campo `origin` ya es `VARCHAR` libre a nivel schema (la validación está solo en Pydantic).

### 3.3 Backend — soporte.html feedback endpoint (Punto 5)

- **NUEVO** `backend/support_feedback_routes.py` — router con:
  - `POST /support/feedback` — rate-limit 60 req/hora/IP (mismo patrón `contact_tickets`).
  - `GET /admin/support/feedback/stats` — autenticado con JWT admin, agrupa por `faq_id` con `count_useful / count_total`, `comments_recent` (últimos 10).
  - Retención, pseudonimización, IP/UA desde header.
- **NUEVO** `backend/migrations/add_support_feedback_table.sql` — `CREATE TABLE support_feedback` idempotente (`IF NOT EXISTS`) con schema de D-S6.
- **MODIFICAR** `backend/database.py` — agregar modelo SQLAlchemy `SupportFeedback` alineado al schema.
- **MODIFICAR** `backend/server.py` — `from support_feedback_routes import router as support_feedback_router; app.include_router(support_feedback_router)` (alrededor de la línea 338-340 donde se incluye `legal_document_views_router`).
- **NUEVO** `backend/tests/test_support_feedback.py` — cobertura: POST happy path, rate-limit, pseudonimización, admin stats.

### 3.4 Frontend — HRDashboard refactor (Punto 4)

- **MODIFICAR** `src/pages/HRDashboard.tsx` líneas 163-327 — eliminar la constante local `CHILE_LABOR` y reemplazar por:
  - `import { UF_ABRIL_2026, UTM_ABRIL_2026, SUELDO_MINIMO_2026, AFP_OBLIGATORIA_PCT, AFC_TRABAJADOR_INDEFINIDO_PCT, AFC_EMPLEADOR_INDEFINIDO_PCT, AFC_EMPLEADOR_PLAZO_FIJO_PCT, SIS_PCT, TOPE_IMPONIBLE_AFP_UF, TOPE_IMPONIBLE_AFC_UF, RETENCION_HONORARIOS_2026_PCT, IVA_PCT, PPM_PROPYME_14D3_PCT, IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM, getWeeklyHoursAtDate, getMonthlyHoursAtDate } from 'shared/chile_constants';`
  - Crear helper local `getCurrentChileLaborBundle(fecha: Date)` en `src/utils/chile_labor_helpers.ts` que componga los structs derivados (`IMM.partialRate`, `TOPES.afpCLP` derivado, `GRATIFICACION.topeMensual` derivado, etc.) desde las primitivas compartidas.
- **NUEVO** `src/utils/chile_labor_helpers.ts` — helpers UI-side que combinan las constantes primitivas con la fecha actual para producir el struct rico que HRDashboard consume. **No duplica datos**, solo computa.
- **MODIFICAR** `shared/chile_constants.ts` — agregar constantes faltantes que HRDashboard necesita y que no están aún: `SUELDO_MINIMO_REDUCIDO_2026` (402.238), `SUELDO_MINIMO_NO_REMUNERACIONAL_2026` (319.756), `GRATIFICACION_LEGAL_PCT` (0.25), `GRATIFICACION_TOPE_IMM` (4.75), `HORAS_EXTRA_RECARGO_PCT` (0.5), `MUTUAL_BASE_PCT` (0.0093), `APV_MAX_UF_ANUAL` (600), `PENSION_ALIMENTOS_MIN_PCT` (0.40), etc. **Cada constante nueva requiere cita 4-líneas y aprobación Capa 0 `legal-docs-keeper`** (ver §8).
- **NUEVO** `src/pages/__tests__/HRDashboard.chile_labor.test.tsx` — test que monta HRDashboard y valida que muestra UF/UTM/IMM desde `shared/chile_constants` exact match (no de la constante local, que no existe más).

### 3.5 Frontend — Consent + Views reales en sandbox (Puntos 2-3)

- **MODIFICAR** `public/sandbox/_scripts/_inject_cookie_banner.py` — refactor del JS inyectado:
  - Agregar función `postConsentToBackend(consent)` que hace `fetch('/api/consent/cookies', { method: 'POST', ... })` con `visitor_uuid` (D-S4), `origin: 'sandbox'` (D-S3), `policy_version`, `policy_hash`, `categories_accepted`.
  - Mantener `localStorage` como fallback (D-S8).
  - Re-inyectar en los 55+ HTMLs (correr script una vez tras refactor).
- **MODIFICAR** `public/sandbox/_scripts/_inject_legal_modal.py` — refactor del JS inyectado:
  - Al `openLegalModal(docKey)`: `fetch('/legal/documents/' + docKey + '/viewed', { method: 'POST', body: JSON.stringify({ session_token, doc_hash, scrolled_to_end: false }) })`.
  - Listener en el iframe: al `scroll` del iframe body > 90%, nuevo POST con `scrolled_to_end: true`.
  - `doc_hash` hardcoded desde `CANONICAL_HASHES` del backend (inyectar al script Python que los vuelca al JS).
  - Re-inyectar en los 55+ HTMLs.
- **NUEVO** `public/sandbox/_scripts/_inject_visitor_uuid.py` — nuevo script que inyecta en cada HTML un snippet `<script>window.connikuVisitorUuid = (function(){...uuid get or create...})();</script>` justo al `<head>`. Provee `window.connikuVisitorUuid` global para que los otros scripts lo consuman.

### 3.6 Frontend — Feedback loop en soporte (Punto 5)

- **MODIFICAR** `public/sandbox/soporte.html` — agregar `data-faq-id="<slug>"` a cada `<details>` y `<div class="faq-feedback">...</div>` debajo de cada `<summary>` cerrado. Script vanilla para POST al endpoint.
- **NUEVO** `public/sandbox/_scripts/_inject_faq_feedback.py` — script idempotente que agrega los IDs y el widget a cada `<details>` presente en `soporte.html` (solo ese HTML).
- **NUEVO** `docs/support/faq-catalog.md` — catálogo versionado de `faq_id`s estables.
- **MODIFICAR en producto React** `src/pages/Support.tsx` (si existe) — agregar mismo widget `<FaqFeedback faqId=...>` que llama a `POST /support/feedback`. Si no existe el archivo, declarado en `§7 Fuera de scope` → se abre Bloque dedicado cuando se implemente Support en React.

### 3.7 Documentación legal (Capa 0)

- **MODIFICAR** `docs/legal/v2.4/privacy-policy.md` → **bumpear a v2.4.1** con:
  - Mención explícita de que el sandbox público registra consent real en BD (no solo preview).
  - Enumeración de tabla `support_feedback` con finalidad ("mejora iterativa de contenidos de soporte") y retención (2 años).
  - Mención de `session_token` compartido entre consent y views para vincular a futuro registro.
- **MODIFICAR** `docs/legal/v2.4/METADATA.yaml` — actualizar hash de privacy.
- **MODIFICAR** `backend/constants/legal_versions.py` — bump `PRIVACY_POLICY_VERSION` y `PRIVACY_POLICY_HASH`.
- **MODIFICAR** `backend/legal_document_views_routes.py` `CANONICAL_HASHES["privacy"]` y `CANONICAL_VERSIONS["privacy"]`.
- **NUEVO** `docs/legal/drafts/privacy-v2.4.1-draft.md` — generado por `legal-docs-keeper` en Capa 0, para revisión humana antes de merge.

### 3.8 Tests de integración sandbox

- **NUEVO** `backend/tests/test_sandbox_integration.py` — verifica:
  - `POST /api/consent/cookies` con `origin="sandbox"` + `visitor_uuid` produce 201.
  - `POST /legal/documents/privacy/viewed` con `session_token` produce 201.
  - `POST /support/feedback` con `faq_id` produce 201.
  - Rate-limits funcionan.
- **NUEVO** `e2e/sandbox.spec.ts` (Playwright, si está en el stack) — verifica que al aceptar el banner en `/sandbox/landing-preview.html` se hace el POST y la fila aparece en BD.

### 3.9 FROZEN.md

- **MODIFICAR** `FROZEN.md` al cierre del bloque — agregar:
  - `public/sandbox/landing.html` (base CONGELADA heredada)
  - `public/sandbox/_gate.js` (una vez que el password nuevo quede establecido)
  - `shared/chile_constants.ts` (ya está frozen, verificar)
  - NO agregar los 58 HTMLs restantes (evolucionan con scripts).

### 3.10 BLOCKS.md

- **MODIFICAR** `BLOCKS.md` al cierre — registrar bloque con ID, fecha, capas ejecutadas, quality score final, iteraciones Capa 6.

---

## 4. Orden de implementación (TDD)

El flujo es RED-GREEN-REFACTOR estricto (§CLAUDE.md "TDD obligatorio"). Cada paso numerado es una unidad funcional (~6-10 min).

### Fase A · Capa 0 legal (PRE-BUILDER)

**A0**. `legal-docs-keeper` audita la Privacy v2.4.0 vs los cambios del bloque. Produce borrador `privacy-v2.4.1-draft.md`. Cristian aprueba humanamente antes de pasar a A1. **Gate obligatorio.**

### Fase B · Backend (backend-builder)

**B1 RED**. Escribir `test_cookie_consent.py::test_origin_sandbox_accepted` — espera que un POST con `origin="sandbox"` retorne 201. Corre → falla (validador rechaza).

**B2 GREEN**. Agregar `"sandbox"` al set `valid_origins` en `cookie_consent_routes.py` línea 89. Corre test → pasa.

**B3 RED**. Escribir `test_support_feedback.py::test_post_feedback_creates_row` — espera que POST con payload válido cree fila en `support_feedback`. Falla (tabla no existe).

**B4 GREEN**. Escribir migración `add_support_feedback_table.sql` + modelo `SupportFeedback` en `database.py` + router esqueleto `support_feedback_routes.py` + incluir en `server.py`. Correr migración local. Test → pasa.

**B5 RED**. Escribir `test_support_feedback.py::test_rate_limit_60_per_hour` — espera 429 al llamar 61 veces en una hora desde la misma IP. Falla (rate-limit no implementado).

**B6 GREEN**. Implementar rate-limit con `slowapi` siguiendo patrón `contact_tickets`. Test → pasa.

**B7 RED**. Escribir `test_support_feedback.py::test_admin_stats_grouped_by_faq_id` — espera que GET admin retorne `{"faq_id": ..., "useful_count": ..., "total_count": ..., "usefulness_rate": ...}`. Falla (endpoint admin no existe).

**B8 GREEN**. Implementar endpoint `/admin/support/feedback/stats` con JWT admin + aggregation SQL. Test → pasa.

**B9 REFACTOR**. Extraer helpers comunes entre `cookie_consent_routes`, `legal_document_views_routes` y `support_feedback_routes` (IP real, UA truncado, retención) a `backend/lib/privacy_helpers.py`. Todos los tests siguen verdes.

**B10 VERIFICACIÓN**. Correr suite completa: `python3.11 -m pytest backend/ --tb=no -q`, `python3.11 -m ruff check backend/`, `python3.11 -m ruff format backend/ --check`, `python3.11 -m mypy backend/` (si aplica). Todo verde.

### Fase C · Frontend refactor HRDashboard (frontend-builder)

**C1 RED**. Escribir `HRDashboard.chile_labor.test.tsx::muestra UF desde shared` — monta HRDashboard, verifica que el valor de UF en el DOM coincide con `UF_ABRIL_2026` importado de `shared/chile_constants`. Falla (valor viene de constante local).

**C2 GREEN**. Modificar `shared/chile_constants.ts` agregando constantes faltantes. Importar en HRDashboard. Reemplazar refs `CHILE_LABOR.UF.value` → `UF_ABRIL_2026`. Crear helpers en `src/utils/chile_labor_helpers.ts`. Test → pasa.

**C3 RED**. Escribir test `muestra jornada 42h después de 2026-04-26`. Mock `new Date('2026-05-01')`. Verificar que la jornada mostrada es 42. Falla (lógica hardcoded).

**C4 GREEN**. Usar `getWeeklyHoursAtDate(currentDate)` en el lugar correspondiente. Test → pasa.

**C5 REFACTOR**. Eliminar bloque `CHILE_LABOR = {...}` completo (líneas 163-327). Verificar que `grep CHILE_LABOR src/pages/HRDashboard.tsx` retorna 0 matches. Correr `npx eslint src/pages/HRDashboard.tsx`, `npx tsc --noEmit`, test → pasa.

### Fase D · Sandbox migración + integración (frontend-builder + ops)

**D1**. Copiar todos los archivos de `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/` a `public/sandbox/` (rsync exacto). Verificar conteo: 72 archivos.

**D2 RED**. Escribir `e2e/sandbox.spec.ts::banner_cookies_genera_fila_en_bd` — Playwright navega a `/sandbox/landing-preview.html`, acepta banner, verifica fila en BD vía endpoint de auditoría. Falla (aún usa localStorage solamente).

**D3 GREEN**. Refactor `_inject_cookie_banner.py` + `_inject_visitor_uuid.py` + re-inyectar en los 55+ HTMLs. Test → pasa.

**D4 RED**. Escribir `e2e/sandbox.spec.ts::modal_legal_registra_view` — Playwright abre modal de privacy, verifica que el backend recibió el POST. Falla.

**D5 GREEN**. Refactor `_inject_legal_modal.py` + re-inyectar. Test → pasa.

**D6 RED**. Escribir `e2e/sandbox.spec.ts::feedback_faq_genera_fila` — click 👎 en soporte.html, verificar fila en BD. Falla (widget no inyectado).

**D7 GREEN**. Escribir `_inject_faq_feedback.py` + aplicar a `soporte.html`. Crear `docs/support/faq-catalog.md`. Test → pasa.

**D8**. Bumpear password `_gate.js` al valor provisto por Cristian en batch §9. Commit `security(sandbox): rotar gate password tras exposición URL pública`.

**D9 REFACTOR**. Consolidar los 3 scripts de inyección (`_inject_cookie_banner`, `_inject_legal_modal`, `_inject_faq_feedback`) con helpers comunes en `_scripts/_lib.py` (marker utils, idempotencia, dry-run flag).

### Fase E · Verificación integral (qa-tester)

**E1**. Levantar backend local + `npx vite dev` local. Navegar a `http://localhost:5173/sandbox/` → redirige a `landing-preview.html`.

**E2**. Aceptar banner. Verificar con `curl http://localhost:8000/api/consent/cookies/<visitor_uuid>` que retorna consent con `origin="sandbox"`.

**E3**. Abrir modal privacy. Verificar con `curl http://localhost:8000/legal/documents/views?session_token=<uuid>` que hay view registrado.

**E4**. Navegar a `soporte.html`, click 👎 en FAQ, verificar fila en `support_feedback`.

**E5**. Probar en móvil (DevTools responsive): banner + modal + feedback se ven correctamente.

**E6**. Probar con red desconectada: POST falla, localStorage guarda, re-conectar → retry funciona (D-S8).

**E7**. Correr pre-flight §23 completo antes de push: tsc, eslint, vitest, vite build, pytest, ruff check. Todo verde.

### Fase F · Revisiones (code-reviewer + truth-auditor + gap-finder)

**F1**. `code-reviewer` audita diff ciego (Capa 2).
**F2**. `truth-auditor` cruza reportes (Capa 3).
**F3**. Deploy preview Vercel (Capa 4).
**F4**. `gap-finder` audita estructural (Capa 5).

### Fase G · Inspección humana (Cristian, Capa 6)

**G1**. Cristian abre URL preview, prueba los 4 flujos end-to-end como usuario real.
**G2**. Si hay mejoras → retrocede a fase apropiada + iter-2.
**G3**. OK final → Capa 7 (merge + FROZEN + BLOCKS).

---

## 5. Criterio de terminado (checks binarios)

Al cerrar el bloque, los siguientes 26 checks deben estar en verde:

### Migración sandbox
- [ ] `public/sandbox/` contiene 72 archivos (verificable con `find public/sandbox -type f | wc -l`).
- [ ] `public/sandbox/index.html` redirige a `landing-preview.html`.
- [ ] `public/sandbox/_gate.js` tiene password nuevo (distinto del viejo hardcoded).
- [ ] URL preview Vercel `https://studyhub-com-git-bloque-sandbox-integrity-v1-<team>.vercel.app/sandbox/` carga correctamente.

### Consent real
- [ ] `backend/cookie_consent_routes.py` valida `origin="sandbox"` como permitido.
- [ ] Al aceptar banner en sandbox, se crea fila en `cookie_consents` con `origin="sandbox"` + `visitor_uuid` válido + IP real + UA real.
- [ ] localStorage guarda también (fallback D-S8).
- [ ] Si el POST falla (simulación red down), localStorage persiste y retry en próxima carga funciona.
- [ ] `test_cookie_consent.py::test_origin_sandbox_accepted` pasa.

### Views legales reales
- [ ] Al abrir modal legal en sandbox, se hace `POST /legal/documents/{doc}/viewed` con `session_token` = `visitor_uuid`.
- [ ] Al scroll 90% del iframe, se hace segundo POST con `scrolled_to_end=true`.
- [ ] Fila aparece en tabla `document_views` con doc_hash canónico vigente.

### HRDashboard refactor
- [ ] `grep "const CHILE_LABOR" src/pages/HRDashboard.tsx` retorna 0 matches.
- [ ] `grep "CHILE_LABOR\." src/pages/HRDashboard.tsx` retorna 0 matches.
- [ ] `HRDashboard.tsx` importa constantes desde `'shared/chile_constants'`.
- [ ] Test `HRDashboard.chile_labor.test.tsx` pasa y verifica UF/UTM/IMM desde shared.
- [ ] Test de jornada 42h post-2026-04-26 pasa.
- [ ] `shared/chile_constants.ts` exporta todas las constantes nuevas requeridas (verificadas por Capa 0 `legal-docs-keeper`).
- [ ] `scripts/verify-chile-constants-sync.sh` pasa.

### Support feedback loop
- [ ] Tabla `support_feedback` creada vía migración idempotente.
- [ ] `POST /support/feedback` con payload válido retorna 201 + fila en BD con IP + UA truncado a 512.
- [ ] Rate-limit 60/hora/IP aplicado (test `test_rate_limit_60_per_hour` pasa).
- [ ] `GET /admin/support/feedback/stats` con JWT admin retorna stats agrupadas por `faq_id`.
- [ ] `soporte.html` tiene widget 👍/👎 en cada `<details>` con `data-faq-id` único.
- [ ] `docs/support/faq-catalog.md` lista todos los `faq_id`s versionados.

### Legal
- [ ] Privacy bumpeada a v2.4.1 con menciones de sandbox + support_feedback.
- [ ] `backend/constants/legal_versions.py` actualizado.
- [ ] `CANONICAL_HASHES["privacy"]` actualizado en `legal_document_views_routes.py`.
- [ ] Capa 0 `legal-docs-keeper` aprobado humanamente por Cristian.

### Pre-flight §23
- [ ] `npx tsc --noEmit` → exit 0.
- [ ] `npx eslint src/` → exit 0.
- [ ] `npx vitest run` → exit 0.
- [ ] `npx vite build` → exit 0.
- [ ] `python3.11 -m pytest backend/ --tb=no -q` → exit 0.
- [ ] `python3.11 -m ruff check backend/` → exit 0.

### Capa 7 (cierre)
- [ ] PR mergeado a main.
- [ ] BLOCKS.md actualizado.
- [ ] FROZEN.md incluye `public/sandbox/landing.html` + `public/sandbox/_gate.js` + `shared/chile_constants.ts` (ya).
- [ ] Rama `bloque-sandbox-integrity-v1` eliminada post-merge.

---

## 6. Riesgos

### Alto

**R-A1 · Exposición accidental del gate password en commits**
- **Probabilidad**: media si Tori no trata el password como secreto.
- **Mitigación**: el password solo se escribe una vez en el commit final; los commits intermedios usan placeholder `GATE_PASSWORD_PLACEHOLDER`. Cristian provee el password en batch §9 vía mensaje privado, Tori lo consume al momento del commit final, sin logs.

**R-A2 · Privacy bump no aprobado en Capa 0 bloquea merge**
- **Probabilidad**: media.
- **Mitigación**: Capa 0 es PRE-builder. Sin aprobación, no inicia Fase B. Detectado tempranamente.

**R-A3 · Tests `e2e/sandbox.spec.ts` requieren Playwright no instalado en CI**
- **Probabilidad**: media (no se verificó si Playwright está en `package.json`).
- **Mitigación**: verificar en Fase A; si no existe, alternativa es tests de integración backend + manual test humano en Capa 6 (patrón actual del proyecto). NO se instala Playwright como dep nueva sin aprobar en bloque separado.

### Medio

**R-M1 · Constantes nuevas en `shared/chile_constants.ts` requieren verificación legal 4-líneas**
- **Probabilidad**: alta (lista ~15 constantes nuevas).
- **Mitigación**: todas citan artículo + URL oficial + fecha verificación + verificador (Capa 0 batch, §21 pattern). Si Tori no encuentra fuente para alguna, se declara "NO VERIFICADO" y se remueve del bloque (scope reduced).

**R-M2 · Scripts Python en `public/sandbox/_scripts/` pueden ejecutarse accidentalmente por CI**
- **Probabilidad**: baja (no están en test runner).
- **Mitigación**: `_scripts/` con guión inicial que alguno de los linters (ruff) podría querer analizar. Agregar `# ruff: noqa` o `_scripts/.ruffignore` si detecta falsos positivos. Verificar en Fase A pre-flight.

**R-M3 · Browser cache de visitor_uuid entre sandbox y producto React**
- **Probabilidad**: media.
- **Mitigación**: ambos usan la misma clave `conniku_visitor_uuid`. Si un mismo navegador visita sandbox y luego producto, el UUID se comparte — esto es deseable para el flujo de "visitante anónimo que se registra" (Bloque 7). Ningún riesgo real, solo documentarlo.

**R-M4 · 409 por doc_hash obsoleto al bumpear Privacy v2.4.1 sin coordinación**
- **Probabilidad**: alta si el bump se hace separado del sandbox.
- **Mitigación**: bump + update `CANONICAL_HASHES` + re-inyección de scripts (que usan el hash) se hacen en un solo commit atómico. Pre-flight verifica sincronización.

### Bajo

**R-B1 · Fluctuación del `user_agent_hint` entre Pydantic y realidad del header**
- **Probabilidad**: baja, ya manejado en `cookie_consent_routes.py` línea 193 (UA definitivo del header).
- **Mitigación**: ya cubierto, verificar en test.

**R-B2 · Rate-limit `slowapi` no implementado aún en `contact_tickets` y se rompe el patrón heredado**
- **Probabilidad**: media si `contact_tickets-v1` no mergea antes.
- **Mitigación**: coordinar con `bloque-contact-tickets-v1` — si aún no mergeó, `support_feedback` implementa rate-limit standalone (copy-paste del patrón del plan); si mergeó, reusa helper `backend/lib/rate_limit.py`.

**R-B3 · Deploy Vercel sirve `public/sandbox/` con MIME correcto pero scripts Python aparecen servidos**
- **Probabilidad**: baja (Vercel sirve Python como `application/octet-stream` por defecto, no los ejecuta).
- **Mitigación**: scripts en `_scripts/` quedan accesibles por URL pero no ejecutables. Opcional: agregar `public/sandbox/_scripts/.vercelignore` o mover a `scripts/sandbox_maintenance/` fuera de `public/`. Preferible esta última opción, pero out of scope si complica.

---

## 7. Fuera de scope

Items NO cubiertos en este bloque, con fundamento explícito de por qué:

1. **Env var para password del gate** (ver D-S2): requiere arquitectura build distinta. Se difiere a bloque `sandbox-gate-env-var-v2` cuando se migre el sandbox a React o cuando se decida reestructurar el build.
2. **Subdominio separado `sandbox.conniku.com`**: no hay necesidad actual (D-S7). Abre bloque dedicado si se requiere.
3. **Migración completa sandbox → React SPA**: el sandbox sigue siendo HTML vanilla para permitir iteración rápida de diseño sin el overhead del build React. Bloque futuro `sandbox-to-react-v1` cuando el diseño del landing esté estable y probado.
4. **Widget `<FaqFeedback>` en producto React (`src/pages/Support.tsx`)**: si el archivo no existe aún, se abre bloque `support-react-v1` cuando se implemente la sección Support del producto. Si existe, este bloque lo toca; si no, queda declarado aquí.
5. **Dashboard admin de analítica de `support_feedback`** (UI): el bloque entrega el endpoint `/admin/support/feedback/stats` consumible; la UI admin del dashboard se hace en `bloque-admin-analytics-v1` cuando exista.
6. **Pseudonimización automática a 12 meses**: se deja `pseudonymized_at_utc` como campo nullable, pero el job cron que lo ejecuta es `bloque-privacy-jobs-v1` (mismo job también pseudonimiza `cookie_consents`, `document_views`, `contact_tickets`). Por ahora los datos quedan sin pseudonimizar hasta que el bloque de jobs corra — esto es aceptable según `cookie_consent_routes.py:29` que ya opera con esta deuda común.
7. **Catálogo completo de `faq_id` para soporte**: se crean solo los `faq_id`s correspondientes a las preguntas presentes en `soporte.html` hoy. Si se agregan FAQs después, el catálogo crece en bloques futuros.
8. **IMPRESIÓN PDF de documentos legales desde sandbox**: actualmente solo se lee en iframe. Impresión PDF está en `bloque-legal-pdf-export-v1`.
9. **Integración con Analytics externo (Plausible, Umami)**: sandbox no envía eventos a ningún analytics. El `support_feedback` es el único telemetría agregada en este bloque.

---

## 8. Componente legal

**Cita de normas aplicables**:

- **GDPR Art. 7(1)** (Reglamento UE 2016/679): "Cuando el tratamiento se base en el consentimiento del interesado, el responsable deberá ser capaz de demostrar que aquel consintió el tratamiento de sus datos personales." URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679. **Aplica**: el consent del banner sandbox debe quedar en BD (no solo localStorage) para ser demostrable.
- **GDPR Art. 7(3)**: "El interesado tendrá derecho a retirar su consentimiento en cualquier momento. [...] Será tan fácil retirar el consentimiento como darlo." **Aplica**: botón "Retirar todo" del modal sandbox debe llegar al backend para que el retiro sea efectivo a nivel de evidencia.
- **GDPR Art. 5(1)(c)** — minimización: UA truncado a 512 chars (ya implementado). **Aplica al support_feedback** también.
- **GDPR Art. 5(1)(e)** — limitación temporal: retención 2 años support_feedback + pseudonimización 12m (D-S6).
- **GDPR Art. 17(3)(e)**: excepción a derecho de supresión para ejercicio/defensa de reclamaciones. **Aplica**: retención legal del consent (5 años) y de views (5 años).
- **Ley 19.628 Art. 4°** Chile (Protección de la Vida Privada): información al titular al momento de la recolección. URL: https://www.bcn.cl/leychile/navegar?idNorma=141599. **Aplica**: el banner debe informar finalidad (ya cubierto).
- **Art. 2515 Código Civil Chile**: prescripción ordinaria 5 años. URL: https://www.bcn.cl/leychile/navegar?idNorma=172986. **Fundamento de retención** de consents/views (5 años).
- **Directiva 2002/58/CE Art. 5(3) ePrivacy**: consentimiento previo para cookies no esenciales. **Aplica**: el banner del sandbox también implementa esto.
- **Ley 21.719** Chile (vigente desde 2026-12-01 según Diario Oficial CVE 2583630): derecho de retiro del consentimiento. Mencionado en el footer del modal sandbox actual. **Aplica**: texto ya presente, solo asegurar que el retiro llega al backend.

**Constantes legales a citar (Capa 0 obligatoria)**:

Las constantes nuevas a agregar en `shared/chile_constants.ts` (§3.4) requieren cita 4-líneas cada una:
- `SUELDO_MINIMO_REDUCIDO_2026`: Art. 44 inciso 2 CT (menores de 18 / mayores de 65). Fuente: bcn.cl. Verificado: <fecha>. Verificador: Cristian batch §21.
- `GRATIFICACION_LEGAL_PCT` / `GRATIFICACION_TOPE_IMM`: Art. 50 CT. Fuente: bcn.cl. Verificado: <fecha>. Verificador: Cristian.
- `HORAS_EXTRA_RECARGO_PCT`: Art. 32 CT (50% recargo). Fuente: bcn.cl. Verificador: Cristian.
- `MUTUAL_BASE_PCT`: Ley 16.744 Art. 22 (tasa base 0.93%). Fuente: suseso.cl. Verificador: Cristian.
- `APV_MAX_UF_ANUAL`: Art. 20L DL 3500 (tope 600 UF anuales régimen B). Fuente: bcn.cl. Verificador: Cristian.
- `PENSION_ALIMENTOS_MIN_PCT`: Art. 8 Ley 14.908 (40% IMM por 1 hijo). Fuente: bcn.cl. Verificador: Cristian.

**Todas las citas deben verificarse por Cristian en batch §21 extendido. Tori NO inventa valores.**

**Documentos legales a actualizar**:

- Privacy Policy v2.4.0 → v2.4.1:
  - §3 "Finalidades del tratamiento" — agregar inciso sobre consent vía sandbox público.
  - §4 "Categorías de datos tratados" — agregar `support_feedback` con campos.
  - §6 "Plazos de conservación" — agregar retención 2 años support_feedback.
  - §12 "Contacto DPO" — sin cambios.

**Capa 0 `legal-docs-keeper` OBLIGATORIA** antes de Fase B. Cristian aprueba humanamente el borrador `docs/legal/drafts/privacy-v2.4.1-draft.md` antes de comenzar. **Sin esa aprobación, el bloque no avanza.**

**Riesgo legal alto si sale sin revisión humana explícita**: el consent que recolecta el sandbox es jurídicamente vinculante. Un texto mal sincronizado con la política vigente genera consent viciado (Art. 7(2) GDPR) y exposición legal.

---

## 9. Decisiones pendientes batch §21

Cristian responde con formato `1A 2B 3C 4A 5A 6A 7A 8B 9<password>` (8 decisiones + password gate).

| # | Decisión | A | B | C | Reco Tori |
|---|---|---|---|---|---|
| D-S1 | Ruta pública sandbox | `/sandbox/landing-preview.html` directo | `/sandbox/` con index redirect | `/preview/` | **B** |
| D-S2 | Gate password | Mantener viejo | Bumpear con env var | Bumpear hardcoded (diferir env var) | **C** |
| D-S3 | Campo `origin=sandbox` en cookie_consents | Agregar `sandbox` al set | Reusar `banner_initial` | Dos valores `sandbox_*` | **A** |
| D-S4 | `visitor_uuid` / `session_token` | Compartido + localStorage persistente | Regenerar cada sesión | Dos UUIDs separados | **A** |
| D-S5 | Feedback UX posición | Botones por FAQ + textarea opt | Encuesta final | Híbrido (ambos) | **A** |
| D-S6 | Retención support_feedback | 2 años (alineado contact_tickets) | 5 años (alineado cookies/views) | 1 año | **A** |
| D-S7 | CORS | No tocar + doc en §7 | Agregar `sandbox.conniku.com` preventivo | — | **A** |
| D-S8 | Errores POST desde sandbox | Cache-and-retry con cola | Best-effort + localStorage fallback | Bloqueante | **B** |
| D-S9 | **Password gate nuevo** | (Cristian provee) | — | — | Tori no genera |

**Dependencias entre decisiones**: D-S4 afecta a D-S3 (el `origin=sandbox` requiere `visitor_uuid` persistente). D-S6 afecta a §7 (pseudonimización fuera de scope).

---

## 10. Notas operativas

- **Rama**: `bloque-sandbox-integrity-v1` desde `main` actual (commit `3ad731a docs(session): snapshot de cierre bloque-legal-consolidation-v2 2026-04-20` según git status).
- **PR único** con todas las capas. No dividir en sub-PRs — la integridad end-to-end es parte del criterio "solución permanente" de la regla raíz.
- **Pre-flight §23 obligatorio** antes de cada push: `npx tsc --noEmit && npx eslint src/ && npx vitest run && npx vite build && python3.11 -m pytest backend/ --tb=no -q && python3.11 -m ruff check backend/`.
- **Prettier proactivo §24**: antes de cada `git add`, correr `npx prettier --write <archivos frontend tocados>`.
- **Commits Conventional**: tipo `feat(sandbox)` o `legal(privacy)` según corresponda. Mensaje raíz del PR: `feat(sandbox): integridad de consent + views + feedback + refactor HR CHILE_LABOR`.
- **Dependencia `contact_tickets-v1`**: si aún no mergeó al iniciar este bloque, coordinar para evitar colisión en `backend/lib/` (helpers comunes). Preferencia: `contact_tickets-v1` mergea primero para que `support_feedback` reuse helpers. Si no es posible, `support_feedback` duplica temporalmente y se consolida en bloque `privacy-helpers-refactor-v1` post-merge.
- **Auto Mode**: OFF (política §19). Tori opera estricto.
- **Objetivo único §20**: no se acumulan tareas externas en esta sesión; cualquier descubierta queda en `docs/decisiones-pendientes.md`.
- **Regla raíz**: si durante ejecución se detecta que alguna pieza "no puede quedar bien dentro del bloque", se DETIENE y se reformula — no se acepta placebo.

---

**Fin del plan.** Esperando aprobación batch Cristian para `D-S1…D-S9` antes de invocar `legal-docs-keeper` en Capa 0.
