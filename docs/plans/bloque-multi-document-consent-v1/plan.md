# Plan — Bloque multi-document-consent-v1

**Autor:** web-architect (Tori)
**Fecha:** 2026-04-21
**Rama destino:** `bloque-multi-document-consent-v1`
**Componente legal:** sí — Capa 0 legal-docs-keeper obligatoria
**Depende de:** Bloque 5 `legal-viewer-v1` mergeado a main

---

## 1. Contexto

### 1.1 Pedidos literales de Cristian

Tres instrucciones textuales (sin parafrasear) dadas por Cristian en la
cola del Bloque 7:

1. **Checkbox unificado**:

   > "Y QUE NO SEA, ACEPTAR TERMINOS Y CONDICIONES, SI NO QUE SEA UN
   > TEXTO QUE INDIQUE QUE ACEPTAN TODO"

   Traducción operativa: reemplazar los 2 checkboxes separados hoy
   vigentes en `Register.tsx` (`ageDeclarationAccepted` + `tosAccepted`)
   por **un único checkbox** precedido por un párrafo que declare la
   aceptación de todos los documentos legales a la vez.

2. **Evidencia de LECTURA antes del checkbox**:

   > "Aceptación legal requiere evidencia de LECTURA, no solo checkbox.
   > Link + apertura registrada + ticket con hash versión + 5 años
   > retención."

   Fuente: memoria `feedback_legal_reading_evidence.md` (2026-04-19).
   Traducción operativa: el checkbox final queda *disabled* hasta que
   los 4 documentos (Terms, Privacy, Cookies, Age Declaration) estén
   registrados como abiertos por el usuario. La apertura se registra
   en backend con `user_id=null` (pre-registro) más
   `session_token` anónimo que liga las aperturas al futuro usuario.

3. **Reemplaza checkbox actual**:

   > El repo ya tiene un checkbox de "acepto términos" en `Register.tsx`.
   > El Bloque 7 lo reemplaza por el flujo nuevo de evidencia.

   Verificado en código (`src/pages/Register.tsx:1798-1817`): existe
   `auth-tos-check` con `tosAccepted`. Y existe también bloque de
   `age-declaration-block` (líneas 1758-1796) separado con checkbox
   propio. Ambos se consolidan en un solo checkbox unificado.

### 1.2 Archivos relevantes leídos

Rutas absolutas verificadas con Read durante planificación:

- `/Users/cristiang./CONNIKU/src/pages/Register.tsx` (1886 líneas,
  paso 3 = checkboxes en líneas 1758-1817)
- `/Users/cristiang./CONNIKU/src/pages/Login.tsx` (195 líneas, contiene
  los links `/terminos`, `/privacidad`, `/cookies` en footer —
  **BUG-02 registrado**: esas URLs renderizan 404 si no hay rutas
  públicas SPA; se verifica fuera de scope de este bloque)
- `/Users/cristiang./CONNIKU/shared/legal_texts.ts` (58 líneas —
  fuente de `AGE_DECLARATION_TEXT_V1`, `AGE_DECLARATION_HASH`,
  `AGE_DECLARATION_VERSION = "1.0.0"`)
- `/Users/cristiang./CONNIKU/shared/legal_texts.py` (existe — espejo
  backend; no se leyó completo por límite de tokens pero se confirma
  import en `backend/auth_routes.py:20`)
- `/Users/cristiang./CONNIKU/backend/auth_routes.py` líneas 81-110
  (`record_age_declaration` ya escribe 1 fila en `user_agreements` con
  los 7 campos probatorios) y líneas 445-595 (endpoint `/register`)
- `/Users/cristiang./CONNIKU/backend/database.py` líneas 1835-1864
  (modelo `UserAgreement`, campos `document_type`, `text_version`,
  `text_version_hash`, `accepted_at_utc`, `user_timezone`, `client_ip`,
  `user_agent`; document_type acepta `'age_declaration' | 'tos' | ...`
  según comentario líneas 1838-1842)

### 1.3 Hallazgos importantes del estado real

Durante §22 verificación de premisas detecté divergencias con el
briefing de la tarea:

- **Bloque 5 legal-viewer-v1 NO existe aún**: no hay
  `docs/plans/bloque-legal-viewer-v1/plan.md`, ni tabla
  `document_views`, ni endpoint `POST /legal/documents/:docKey/viewed`
  en backend. Este bloque es DEPENDIENTE de un bloque que todavía no
  se ha planificado ni implementado.
- **Tabla `cookie_consents` NO existe**: no hay router
  `cookie_consent_routes.py` con código fuente — solo residuo `.pyc` en
  `__pycache__` de alguna rama no mergeada. El PR #21 de legal
  consolidation v2 quedó abierto sin mergear (ver memoria
  `project_bloque_legal_v2_cierre_20260420.md`).
- **Constante `REACCEPT_DOCUMENTS` NO existe** en
  `backend/constants/legal_versions.py` (el archivo fuente no existe;
  solo hay `.pyc` residual). Bloque 7 debe crearlo o esperar a que
  PR #21 lo aporte.
- **Documentos Terms, Privacy, Cookies** no viven como `.md` canónicos
  en `docs/legal/v3.2/` (ese directorio no existe). Sí hay borradores
  en `docs/legal/drafts/` y archivos antiguos. Bloque 7 asume que
  Bloque 5 los consolida en una ubicación estable con `docKey`
  estable y hash de versión.
- **Actualmente Register.tsx SOLO tiene 2 checkboxes**: age declaration
  y TOS. Privacy, Cookies no son checkboxes hoy. El bloque no
  "reemplaza 4 checkboxes separados por 1", sino que **consolida los 2
  actuales + agrega evidencia de lectura de 4 documentos**.

### 1.4 Dependencias declaradas

**BLOQUEANTE**: este bloque NO puede ejecutarse (Capa 1 TDD) hasta que
Bloque 5 `legal-viewer-v1` esté mergeado a `main` y provea:

- Endpoint `POST /legal/documents/:docKey/viewed` con schema
  documentado (cuerpo, respuesta, rate limit, auth opcional para
  pre-registro)
- Tabla `document_views` con índices sobre `user_id + doc_key` y sobre
  `session_token + doc_key` (para flujo pre-registro)
- `docKey` canónicos definidos: `terms`, `privacy`, `cookies`,
  `age_declaration`
- Hash de versión (`text_version_hash`) disponible en endpoint de
  lectura de cada documento
- Modal/viewer frontend reutilizable que cierre con evento "leído"
  (scroll final o botón explícito)

**Deseable mergeado previo (no bloqueante)**: PR #21 de legal
consolidation v2 (cookies `cookie_consents` + `REACCEPT_DOCUMENTS`).
Si no está mergeado al iniciar Bloque 7, el plan incluye fallback de
crear `REACCEPT_DOCUMENTS` localmente en este bloque con nota de
conflicto de merge anticipado.

---

## 2. Decisiones arquitectónicas con alternativas

### D-M1 — Ubicación del componente

**Pregunta:** ¿dónde vive el nuevo componente de consentimiento
multi-documento?

**Alternativas:**
- A) Crear `src/components/Register/MultiDocumentConsent.tsx` +
  `src/hooks/useReadingEvidence.ts`. `Register.tsx` lo importa y lo
  renderiza en `step === 3`.
- B) Inline dentro de `Register.tsx` (sin extraer).
- C) Component compartido `src/components/LegalConsent/` reutilizable
  también por re-aceptación legacy (D-M7).

**Criterios:** reutilización, testabilidad unitaria, coherencia con
convención de carpetas (`src/components/<Feature>/<Component>.tsx`).

**Decisión recomendada:** **C** — `src/components/LegalConsent/` con
subcomponentes `MultiDocumentConsent.tsx` +
`useReadingEvidence.ts` hook. Permite reuso futuro en LegalGate (§
18.7 flujo re-aceptación legacy) sin duplicar lógica. Register.tsx
lo importa como bloque único.

**Razón:** A) mezcla preocupación "registro" con "consentimiento
genérico"; B) impide tests unitarios aislados; C) aísla la pieza como
una capa de dominio (consentimiento) que puede consumirse desde
`Register`, desde `LegalGate` (re-aceptación), y futura configuración
de privacidad en Profile.

---

### D-M2 — Registro de apertura pre-registro

**Pregunta:** ¿cómo se registra la apertura de un documento ANTES de
que el usuario exista (pre-registro)?

**Alternativas:**
- A) Llamada al endpoint Bloque 5 `POST /legal/documents/:docKey/viewed`
  con `user_id=null` y cuerpo que incluya `session_token` anónimo
  (UUID v4 generado frontend al montar el componente).
- B) Solo `localStorage` con `{docKey, opened_at, hash}`; al submit
  se envía todo en batch al backend junto con el registro del user.
- C) Ambas: A para auditoría inmediata + B como respaldo si backend
  cae o latencia.

**Criterios:** integridad de evidencia (no-repudio), resistencia a
manipulación cliente, latencia UX, costo backend por registros
huérfanos (sessions que nunca se convierten a user).

**Decisión recomendada:** **A con session_token**. Genera UUID v4 al
montar, envía a cada apertura `POST /legal/documents/:docKey/viewed`
con `{session_token, doc_key, text_version_hash, user_agent, ip via
proxy}`. Al completar `/register`, el endpoint recibe el
`session_token` y el backend hace UPDATE de las 4 filas para setear
`user_id`. Registros huérfanos se purgan a los 30 días vía job
periódico (fuera de scope).

**Razón:** B tiene problema de no-repudio (usuario puede fabricar
timestamps en localStorage). A es la forma probatoria estándar (UE
GDPR Art. 7(1) exige "demostrar" consentimiento). C duplica
complejidad sin beneficio real.

**Nota de coordinación con Bloque 5:** web-architect debe asegurar que
Bloque 5 soporte este flujo pre-registro. Si Bloque 5 no lo incluye,
se bloquea Bloque 7 hasta coordinar.

---

### D-M3 — Criterio de "leído"

**Pregunta:** ¿qué evento marca un documento como "leído" y habilita
el checkbox final?

**Alternativas:**
- A) Solo abrir el modal cuenta como "leído" (mínimo evidencia).
- B) Scroll hasta `#end` anchor o 90% de altura del modal.
- C) Botón explícito "Confirmo haber leído" dentro del modal.
- D) Timer mínimo (ej: 15 segundos) + scroll 90%.

**Criterios:** evidencia legal vs dark pattern, fricción usuario,
defensibilidad en juicio.

**Decisión recomendada:** **B (scroll 90%) con fallback C si el
documento cabe sin scroll**. Evidencia mínima aceptable para GDPR
Art. 7 "libre, específico, informado, inequívoco": abrir y al menos
haber visto el final del texto. Si documento es corto (cabe sin
scroll), botón explícito "He leído" al cierre.

**Razón:** A es falsificable (basta clickear sin leer). D es dark
pattern (usuarios se irritan con timers forzados y pueden ser
impugnados por "consentimiento no libre"). C solo es fricción extra
si ya vieron el texto. B es el estándar de industria (Apple, Google,
Meta usan scroll-to-end para T&C largos).

**Requerimiento a Bloque 5:** el modal del viewer debe emitir evento
`onReadComplete` cuando el criterio B se cumpla, o evento `onClose`
con flag `readComplete=true/false`.

---

### D-M4 — Texto canónico del párrafo único

**Pregunta:** ¿cuál es el texto exacto del párrafo unificado que
precede al checkbox?

**Borrador provisional (REQUIERE Capa 0 legal-docs-keeper + aprobación
humana Cristian antes de hardcodear):**

> "Al continuar, confirmo bajo fe de juramento que soy mayor de 18
> años y declaro haber leído y aceptado los Términos y Condiciones,
> la Política de Privacidad, y la Política de Cookies. Entiendo que
> mi aceptación queda registrada como evidencia conforme al
> Reglamento (UE) 2016/679 Art. 7(1) y la Ley 19.628 Art. 4°."

**Citas legales a verificar en Capa 0:**
- Reglamento (UE) 2016/679 Art. 7(1): "[...] the controller shall be
  able to demonstrate that the data subject has consented [...]".
  Fuente: https://eur-lex.europa.eu/eli/reg/2016/679/oj Art. 7.
- Ley 19.628 (Chile) Art. 4°: sobre tratamiento de datos personales
  con consentimiento expreso. Fuente: https://www.bcn.cl/leychile/navegar?idNorma=141599
  Art. 4°.
- Código Penal chileno Art. 210 (declaración jurada falsa) —
  **pendiente verificación abogado** según nota CLAUDE.md §Componente 2.

**Decisión recomendada:** el texto final queda FIJO tras Capa 0 +
aprobación humana. Se almacena en `shared/legal_texts.ts` +
`shared/legal_texts.py` como `MULTI_DOCUMENT_CONSENT_TEXT_V1` con
hash SHA-256 recalculado por `scripts/verify-legal-texts-sync.sh`
(script ya existente en repo según convención).

**Versión inicial:** `MULTI_DOCUMENT_CONSENT_VERSION = "1.0.0"`.

**Razón:** Cristian decidió en su pedido literal "un texto que indique
que aceptan todo". El texto debe ser probatorio suficiente para los
4 documentos + edad + registro.

---

### D-M5 — Transacción atómica de registro

**Pregunta:** ¿el submit del registro se hace en una sola llamada
atómica o en dos fases (crear user → confirmar legal)?

**Alternativas:**
- A) Una sola llamada `POST /auth/register` que:
   1. Crea User
   2. Escribe 4 filas en `user_agreements` (`terms`, `privacy`,
      `cookies`, `age_declaration`)
   3. Escribe 1 fila en `cookie_consents` (si la tabla existe tras
      PR #21)
   4. Transfiere las 4 filas de `document_views` del `session_token`
      anónimo al `user_id` recién creado.
  Todo en misma transacción DB.
- B) Dos fases: `POST /auth/register` crea user, luego
  `POST /auth/register/complete-legal` escribe los agreements.
- C) Tres fases separadas (user, agreements, cookies).

**Criterios:** atomicidad probatoria (un user sin sus agreements es
evidencia inválida), UX (número de llamadas), manejo de errores.

**Decisión recomendada:** **A — una sola llamada atómica**.

**Razón:** B deja ventana donde user existe sin agreements
(catastrófico legalmente si hay crash entre fases). C amplifica el
problema. El endpoint `/auth/register` ya hace esto parcialmente
(líneas 586-593 de auth_routes.py: `record_age_declaration` +
`db.commit()` en misma transacción). Extender a 4 documents +
cookie_consent + transfer de document_views es directo.

---

### D-M6 — Bloqueo UX del checkbox

**Pregunta:** ¿cómo se indica visualmente al usuario que no puede
marcar el checkbox hasta leer los 4 documentos?

**Alternativas:**
- A) `disabled` + `aria-disabled="true"` + tooltip "Lee los 4
  documentos para continuar".
- B) Checkbox activo pero submit rechaza con mensaje de error.
- C) Barra de progreso "2/4 leídos" sobre el checkbox + disabled.
- D) Animación sutil (shake) del link no-leído al click en checkbox.

**Criterios:** accesibilidad WCAG AA, claridad, no frustrante.

**Decisión recomendada:** **A + C combinados**. Checkbox `disabled`
hasta 4/4 + barra de progreso textual visible "Documentos leídos:
X de 4" debajo de los links + `aria-describedby` apuntando a la
barra para screen readers.

**Razón:** A sola es fría. B es dark pattern (falso affordance). D es
poco accesible (WCAG 2.3 Motion). A+C da feedback continuo y es
WCAG-compliant.

---

### D-M7 — Usuarios legacy sin evidencia

**Pregunta:** ¿qué hacer con usuarios ya registrados antes del Bloque
7 que NO tienen evidencia de lectura de los 4 documentos?

**Alternativas:**
- A) Al próximo login, forzar flujo de re-aceptación idéntico al
  Bloque 7 pero desde un modal LegalGate bloqueante.
- B) No-op: legacy users quedan sin evidencia de lectura; solo los
  nuevos tienen evidencia.
- C) Email masivo con link para re-aceptar voluntario + deadline
  de 30 días tras el cual se fuerza A.

**Criterios:** cobertura probatoria GDPR, fricción a users existentes,
esfuerzo de implementación.

**Decisión recomendada:** **A (re-aceptación al login)** — FUERA DE
SCOPE de este bloque. Se documenta como bloque separado
`legal-reaccept-legacy-v1` que reutiliza el componente
`MultiDocumentConsent` (D-M1) dentro de un LegalGate.

**Razón:** A es la única opción que cierra el gap legal. C añade
tiempo de exposición. B deja agujero. Pero A merece su propio bloque
porque:
- Require migración para identificar legacy users (fecha de
  registro < fecha merge Bloque 7)
- Require lógica LegalGate diferente de registro inicial
- Require email informativo previo
- Cristian debe decidir deadline de cumplimiento

**Plan de continuidad:** agregar al registro de issues
`registry_issues.md` como "bloque pendiente: legal-reaccept-legacy-v1".

---

### D-M8 — Idioma del párrafo único

**Pregunta:** ¿el texto unificado se entrega solo en español o
multi-idioma?

**Alternativas:**
- A) Solo español (Conniku Chile — mercado actual).
- B) Español + inglés (soporte mínimo internacional).
- C) i18n completo con 10 idiomas como el resto de UI.

**Criterios:** alcance actual, esfuerzo Capa 0 (cada idioma requiere
validación legal por jurisdicción), hash por idioma.

**Decisión recomendada:** **A — solo español** por ahora.
Preparación estructural para i18n futuro: el texto vive en
`shared/legal_texts.ts` como `{es: "..."}` dict (no string pelado) y
el hash se calcula por idioma aceptado. Inglés se agrega cuando
Conniku expanda a otro país.

**Razón:** Cada idioma es un documento legal distinto con hash
distinto y debe pasar Capa 0 individual. Abrir a 10 idiomas ahora
multiplica el trabajo legal por 10 sin beneficio inmediato. El
registro está al 100% CL hoy.

---

## 3. Archivos a tocar

Formato: **ruta absoluta** — **tipo** — **justificación**.

### Nuevos

- `/Users/cristiang./CONNIKU/src/components/LegalConsent/MultiDocumentConsent.tsx` —
  NUEVO — componente principal con párrafo, 4 links, barra progreso,
  checkbox. Decision D-M1.
- `/Users/cristiang./CONNIKU/src/components/LegalConsent/DocumentLink.tsx` —
  NUEVO — link individual con estado "✓ Leído" + timestamp. Subcomponente.
- `/Users/cristiang./CONNIKU/src/hooks/useReadingEvidence.ts` — NUEVO —
  hook que maneja session_token, registro de aperturas, estado
  `readDocs: Set<docKey>`, integración con endpoint Bloque 5.
- `/Users/cristiang./CONNIKU/src/__tests__/components/LegalConsent/MultiDocumentConsent.test.tsx` —
  NUEVO — tests RTL: checkbox disabled hasta 4/4, accesibilidad,
  mock endpoint.
- `/Users/cristiang./CONNIKU/src/__tests__/hooks/useReadingEvidence.test.ts` —
  NUEVO — tests unitarios hook: gen session_token, batch de aperturas,
  manejo errores.
- `/Users/cristiang./CONNIKU/backend/tests/test_multi_document_consent.py` —
  NUEVO — tests backend: 4 filas en user_agreements al registro exitoso,
  transfer session_token → user_id, cookie_consents si aplica, failure
  si no hay 4 document_views previos para session_token.
- `/Users/cristiang./CONNIKU/backend/tests/test_register_multi_consent_integration.py` —
  NUEVO — test e2e ficticio que simula: `POST /legal/documents/:docKey/viewed`
  x 4 → `POST /auth/register` → assert estado DB final.
- `/Users/cristiang./CONNIKU/shared/legal_texts.ts` — NUEVO CONTENIDO
  (modificado, no nuevo archivo) — agregar
  `MULTI_DOCUMENT_CONSENT_TEXT_V1`, `MULTI_DOCUMENT_CONSENT_HASH`,
  `MULTI_DOCUMENT_CONSENT_VERSION`. D-M4, D-M8.
- `/Users/cristiang./CONNIKU/shared/legal_texts.py` — MODIFICADO —
  espejo del .ts (sync obligatorio vía
  `scripts/verify-legal-texts-sync.sh`).
- `/Users/cristiang./CONNIKU/backend/constants/legal_versions.py` —
  NUEVO SI NO EXISTE TRAS PR #21 — agrega `REACCEPT_DOCUMENTS`
  incluyendo `age_declaration`, `terms`, `privacy`, `cookies`,
  `multi_document_consent`. Si PR #21 lo aporta primero, solo se
  extiende.

### Modificados

- `/Users/cristiang./CONNIKU/src/pages/Register.tsx` — MODIFICADO —
  eliminar bloques `age-declaration-block` (líneas 1758-1796) y
  `auth-tos-check` (líneas 1798-1817). Reemplazar por import de
  `<MultiDocumentConsent>` en step 3. Adaptar `validateStep` step 3:
  eliminar validaciones de `form.ageDeclarationAccepted` y
  `form.tosAccepted`, agregar validación de
  `form.multiDocumentConsentAccepted`. Pasar `session_token` al
  `handleSubmit`.
- `/Users/cristiang./CONNIKU/backend/auth_routes.py` — MODIFICADO —
  endpoint `/register`:
  - Añadir campo `session_token` al schema `RegisterRequest` (requerido)
  - Reemplazar validación única `record_age_declaration` por lógica:
    1) verificar 4 `document_views` del `session_token`, uno por
       cada `doc_key` oficial
    2) escribir 4 filas `user_agreements` con `document_type` y
       `text_version_hash` correctos por doc
    3) escribir 1 fila `cookie_consents` si tabla existe
    4) UPDATE `document_views` SET user_id = <new user> WHERE
       session_token = :st
  - Si falta algún `document_views`: `400 "Debes leer los 4
    documentos antes de registrarte"`
  - Si hash de algún doc difere del hash canónico actual: `400
    "La versión de los documentos ha cambiado. Recarga e intenta de
    nuevo"` (D-M2 + D-M3)
- `/Users/cristiang./CONNIKU/backend/database.py` — MODIFICADO
  (condicional) — si no existe `cookie_consents` (PR #21 no mergeado),
  plan incluye crear modelo mínimo en esta tarea. Si existe, NO tocar.
- `/Users/cristiang./CONNIKU/backend/migrations.py` — MODIFICADO
  condicional — migración para `cookie_consents` si no existe.

### No tocados (decisión explícita)

- `/Users/cristiang./CONNIKU/src/pages/Login.tsx` — NO TOCAR. BUG-02
  (links `/terminos`, `/privacidad`, `/cookies` pueden renderizar 404)
  se resuelve en Bloque 5 legal-viewer (que crea rutas SPA). Este
  bloque consume el viewer, no arregla el routing.
- Archivos en `docs/legal/` — NO TOCAR desde este bloque. Los
  documentos canónicos los aporta Bloque 5. Si Capa 0
  legal-docs-keeper detecta gap, se escala a bloque dedicado.

---

## 4. Orden de implementación (TDD)

Prerequisito: **Bloque 5 `legal-viewer-v1` mergeado a main**.
**STOP si no lo está**.

**Capa 0 (ANTES de Capa 1):**
0. legal-docs-keeper valida texto D-M4 + cita de artículos + flujo
   pre-registro contra GDPR Art. 7 y Ley 19.628 Art. 4°. Cristian
   aprueba explícitamente en un mensaje.

**Capa 1 TDD:**
1. **RED frontend hook**: escribir `useReadingEvidence.test.ts` —
   test que hook inicializa con session_token UUID v4 y 0 docs
   leídos. Ejecutar, debe fallar (hook no existe).
2. **GREEN frontend hook**: crear `useReadingEvidence.ts` con gen
   UUID + estado readDocs. Test pasa.
3. **RED frontend componente**: escribir
   `MultiDocumentConsent.test.tsx` — test: checkbox disabled sin
   docs leídos, checkbox enabled con 4/4, párrafo visible, 4 links
   presentes con aria-labels correctos. Ejecutar, debe fallar.
4. **GREEN frontend componente**: crear `MultiDocumentConsent.tsx`
   + `DocumentLink.tsx`. Tests pasan.
5. **REFACTOR frontend**: extraer lógica de "marcar como leído" a
   useReadingEvidence. Tests verdes.
6. **RED backend schema**: escribir `test_multi_document_consent.py` —
   test: `POST /auth/register` sin `session_token` retorna 400.
   Ejecutar, debe fallar (campo no existe).
7. **GREEN backend schema**: extender `RegisterRequest` con
   `session_token: str`. Test pasa.
8. **RED backend lógica**: test siguiente: `POST /auth/register` con
   `session_token` válido pero sin 4 `document_views` previos retorna
   400 con mensaje específico. Ejecutar, debe fallar.
9. **GREEN backend lógica**: implementar validación en
   `auth_routes.py /register` líneas post-495.
10. **RED backend integración**: test: flujo completo `POST /legal/documents/*/viewed`
    x4 → `POST /auth/register` → asserts en DB (4 filas
    user_agreements + 1 cookie_consents + document_views.user_id
    actualizado). Ejecutar, debe fallar en transferencia.
11. **GREEN backend integración**: implementar
    `UPDATE document_views SET user_id = :new WHERE session_token = :st`
    dentro de la transacción de register. Tests pasan.
12. **REFACTOR integración**: extraer helper
    `record_multi_document_consent(db, user_id, session_token, request)`
    análogo a `record_age_declaration`.
13. **RED textos compartidos**: test: hash calculado de
    `MULTI_DOCUMENT_CONSENT_TEXT_V1` en .ts coincide con el hex
    hardcodeado. Ejecutar, debe fallar (constante no existe).
14. **GREEN textos compartidos**: agregar constantes + hash en
    `shared/legal_texts.ts` y `.py`. Ejecutar
    `scripts/verify-legal-texts-sync.sh`. Debe pasar.
15. **Integración frontend**: modificar `Register.tsx` step 3 para
    usar `<MultiDocumentConsent>`. Actualizar `validateStep`,
    `handleSubmit`, shape de `form`.
16. **Pre-flight §23**: `npx tsc --noEmit && npx eslint src/ && npx
    vitest run && npx vite build && pytest backend/ && ruff check
    backend/`. Todos exit 0.
17. **Commit Capa 1** con firma Co-Authored-By Tori. Push a rama
    `bloque-multi-document-consent-v1`.

**Capa 2-6:** flujo estándar §18.3.

---

## 5. Criterio de terminado (binario)

Checks verificables:

- [ ] Bloque 5 `legal-viewer-v1` está mergeado a main (premisa §22)
- [ ] `src/components/LegalConsent/MultiDocumentConsent.tsx` existe
- [ ] `src/hooks/useReadingEvidence.ts` existe
- [ ] `shared/legal_texts.ts` exporta
  `MULTI_DOCUMENT_CONSENT_TEXT_V1`, `_HASH`, `_VERSION`
- [ ] `shared/legal_texts.py` espeja literal el .ts
  (`scripts/verify-legal-texts-sync.sh` pasa)
- [ ] Texto D-M4 aprobado por legal-docs-keeper + Cristian (evidencia
  en `docs/legal/drafts/YYYY-MM-DD-multi-document-consent.md`)
- [ ] `Register.tsx` step 3 ya no contiene `age-declaration-block` ni
  `auth-tos-check` legacy (grep debe dar 0 matches)
- [ ] Checkbox de registro está `disabled` hasta que 4 docs estén
  leídos (test RTL explícito)
- [ ] Checkbox tiene `aria-describedby` apuntando a barra de progreso
  "X de 4 documentos leídos" (WCAG AA)
- [ ] Barra de progreso actualiza en tiempo real al cerrar cada modal
- [ ] `POST /auth/register` sin `session_token` retorna 400 (test
  backend)
- [ ] `POST /auth/register` con `session_token` sin 4 `document_views`
  retorna 400 (test backend)
- [ ] `POST /auth/register` exitoso crea 4 filas en `user_agreements`
  (`terms`, `privacy`, `cookies`, `age_declaration`) con
  `text_version_hash` correcto por cada doc (test backend con query DB)
- [ ] `POST /auth/register` exitoso actualiza `document_views.user_id`
  de null → new user.id para las 4 filas del session_token (test DB)
- [ ] `POST /auth/register` exitoso escribe 1 fila en `cookie_consents`
  con `accepted_at_utc`, IP, UA, `text_version_hash` (si tabla existe)
- [ ] Endpoint `POST /legal/documents/:docKey/viewed` tiene rate limit
  documentado: 20 hits/IP/hora (validar con Bloque 5)
- [ ] Test e2e `backend/tests/test_register_multi_consent_integration.py`
  simula flujo completo y pasa
- [ ] Todos los textos de UI están en español chileno (sin voseo)
- [ ] §22 premisas verificadas en Capa 2 review
- [ ] §23 pre-flight completo exit 0 local ANTES de push
- [ ] Capa 3 truth-auditor confirma 4 filas en DB por registro de
  prueba real en Capa 4 preview
- [ ] Cristian da OK humano explícito en Capa 6 sobre URL preview
- [ ] Migración de cookie_consents (si se creó en este bloque) tiene
  downgrade funcional

---

## 6. Riesgos

### Alto

- **R-A1 Bloque 5 no existe / mergea incompleto**: si `POST /legal/documents/:docKey/viewed`
  no soporta `session_token` pre-registro (user_id nullable),
  Bloque 7 falla en Capa 1 RED. **Mitigación:** web-architect de
  Bloque 5 debe coordinar con este plan ANTES de cerrar Bloque 5.
  Enviar notificación en el plan de Bloque 5 citando D-M2 de este.
- **R-A2 Hash del documento cambia entre apertura y submit**: si
  Bloque 5 permite updates de documentos sin invalidar lectures
  previas, la evidencia se corrompe. **Mitigación:** backend valida
  que `text_version_hash` de las 4 `document_views` coincida con el
  hash canónico ACTUAL al momento de `/register`. Si difere, 400 con
  mensaje "los documentos se actualizaron, recarga" y cliente borra
  el cache de lecturas.
- **R-A3 PR #21 no mergeado → `cookie_consents` no existe**: plan
  debe manejar ambos escenarios (con tabla / sin tabla). **Mitigación:**
  código backend gates en `hasattr(database, 'CookieConsent')` o
  feature flag `COOKIE_CONSENTS_ENABLED`. Si falso, solo escribe
  user_agreements sin cookie_consents, con nota de migración
  posterior.

### Medio

- **R-M1 Conexiones lentas / racing**: usuario abre doc 4, cierra
  antes que el POST /viewed haga roundtrip, clickea submit. Backend
  ve solo 3 views → 400. **Mitigación:** optimistic UI en hook +
  retry x3 con backoff exponencial; si falla el 3er retry, mostrar
  banner "no pudimos registrar tu lectura, reintenta" y tracking en
  frontend error service.
- **R-M2 Dark pattern percibido**: forzar lectura irrita usuarios;
  algunos lo perciben como hostil. **Mitigación:** texto de links
  claro ("Leer Términos (2 min)"), UX con barra de progreso
  motivadora, documentos cortos (Bloque 5 debe mantenerlos legibles).
- **R-M3 Bot-abuse del endpoint pre-registro**: sin auth, atacante
  podría generar millones de `session_token` con 4 views cada uno.
  **Mitigación:** rate limit 20 POST/IP/hora + TTL de 24h en
  document_views huérfanos (sin user_id) + captcha en Register si se
  detecta ráfaga.
- **R-M4 Divergencia hash frontend/backend**:
  `scripts/verify-legal-texts-sync.sh` es CI-only; si se modifica
  solo .ts en commit sin actualizar .py, pre-push no lo detecta.
  **Mitigación:** añadir el script a `pre-commit` de husky además del
  CI gate.

### Bajo

- **R-B1 i18n futuro**: la estructura del texto es string pelado;
  cuando se internacionalice hay que versionar por idioma.
  **Mitigación:** D-M8 preparación estructural.
- **R-B2 Accessibility edge cases**: lector de pantalla que no
  anuncia "checkbox disabled" con razón. **Mitigación:** WCAG 4.1.2
  Name, Role, Value — usar `aria-describedby` + live region para la
  barra de progreso.

---

## 7. Fuera de scope

- **FS-1** Traducción a otros idiomas (i18n completo). Cuando aplique
  se abre bloque `legal-consent-i18n-v1`.
- **FS-2** Flujo re-aceptación para usuarios legacy. Bloque separado
  `legal-reaccept-legacy-v1` reutilizando `MultiDocumentConsent` +
  LegalGate.
- **FS-3** Evidencia de lectura granular por sección del documento
  (solo tracking de documento completo en este bloque).
- **FS-4** Arreglo de links rotos `/terminos`, `/privacidad`,
  `/cookies` en `Login.tsx` footer. Lo resuelve Bloque 5 al crear
  rutas SPA para viewer. BUG-02 queda en `registry_issues.md`.
- **FS-5** Email de notificación de cambios en documentos legales
  (suscripción a actualizaciones). Fuera de este bloque.
- **FS-6** Export de evidencia para un usuario (GDPR Art. 15 data
  portability). Fuera de este bloque.
- **FS-7** Purga automática de document_views huérfanos (>30 días
  sin user_id). Job periódico en bloque separado `data-retention-v1`.
- **FS-8** Versionado histórico de textos: si texto v1 se vuelve v2,
  usuarios aceptantes de v1 no son forzados automáticamente a v2.
  Eso lo decide LegalGate de re-aceptación (bloque aparte).

---

## 8. Componente legal (Capa 0 OBLIGATORIA)

### 8.1 Activación

Componente legal **detectado** según §Cumplimiento Legal CLAUDE.md:
- Archivos tocados matchean patrones: `src/pages/Register*`,
  `src/pages/Terms*` (vía viewer), `src/pages/Privacy*`,
  `backend/auth_routes.py` (procesa consentimiento).
- Palabras clave: "consentimiento", "retracto" (potencial),
  "términos", "privacidad", "cookies", "menor de edad".

### 8.2 Citas legales específicas (verificables)

- **Reglamento (UE) 2016/679 (GDPR) Art. 7(1)**:
  > "Where processing is based on consent, the controller shall be
  > able to demonstrate that the data subject has consented to
  > processing of his or her personal data."

  URL: https://eur-lex.europa.eu/eli/reg/2016/679/oj
  Versión: consolidada 4 de mayo de 2016
  Verificado por: web-architect (Tori), 2026-04-21
  Acción en código: requerir evidencia probatoria (4 filas + 1 cookie
  consent + 4 document_views) por cada registro.

- **Reglamento (UE) 2016/679 Art. 7(2)**: consentimiento debe ser
  "distinguishable from the other matters, in an intelligible and
  easily accessible form, using clear and plain language". Soporta
  D-M4 (párrafo claro, no jerga).

- **Ley N° 19.628 (Chile) Art. 4°**: "El tratamiento de los datos
  personales sólo puede efectuarse cuando esta ley u otras
  disposiciones legales lo autoricen o el titular consienta
  expresamente en ello."

  URL: https://www.bcn.cl/leychile/navegar?idNorma=141599
  Artículo: Art. 4°
  Verificado por: web-architect (Tori), 2026-04-21

- **Código Penal chileno Art. 210** (declaración jurada falsa):
  **PENDIENTE VERIFICACIÓN ABOGADO** según nota ya existente en
  CLAUDE.md §Componente 2. Mientras tanto, usar texto genérico
  "legislación vigente". NO hardcodear la cita específica hasta
  aprobación.

- **Ley 19.496 (Chile) Art. 3bis, inciso 2°**: derecho de retracto
  de 10 días para servicios digitales. Se menciona en política de
  retracto pero NO se toca en este bloque (FS-5).

### 8.3 Constantes a crear/usar

- `MULTI_DOCUMENT_CONSENT_TEXT_V1` en `shared/legal_texts.ts`/`.py`
  (D-M4).
- `MULTI_DOCUMENT_CONSENT_HASH` — SHA-256 hex lowercase, calculado
  al Capa 0.
- `MULTI_DOCUMENT_CONSENT_VERSION = "1.0.0"`.
- `REACCEPT_DOCUMENTS` en `backend/constants/legal_versions.py`
  incluyendo entry para `multi_document_consent` (si el archivo no
  existe, se crea en este bloque con comentarios de fuente).

### 8.4 Documentos legales a actualizar (Capa 0 legal-docs-keeper)

- **Términos y Condiciones**: cláusula sobre mecanismo de
  consentimiento debe mencionar "el usuario declara expresamente
  haber leído los documentos antes de aceptarlos".
- **Política de Privacidad**: mencionar que se registran aperturas
  de documentos legales como dato de cumplimiento (base legal:
  obligación legal GDPR Art. 6(1)(c)).
- **Política de Cookies**: si se toca `cookie_consents` desde este
  flujo, mencionar que el consentimiento inicial en el registro se
  contabiliza.
- **Política interna de retención de datos**: confirmar 5 años para
  evidencia probatoria (alineado con §Componente 3 CLAUDE.md).

### 8.5 Criterio de cierre legal

- [ ] legal-docs-keeper generó borrador de cada documento actualizado
  en `docs/legal/drafts/YYYY-MM-DD-multi-consent-*.md`
- [ ] Cristian aprobó humanamente cada texto
- [ ] §18.7 flujo legal: aprobación humana explícita **obligatoria**
  ANTES de merge a main

### 8.6 Disclaimer obligatorio

> "Este análisis no constituye asesoría legal profesional y requiere
> validación de abogado antes de su aplicación al producto en
> producción."

---

## 9. Decisiones pendientes (batch §21)

Cristian responde con letra por cada decisión. Formato esperado:
`D-M1: C · D-M2: A · D-M3: B · D-M4: aprobado/ajustar · D-M5: A ·
D-M6: A+C · D-M7: A diferido · D-M8: A`.

| ID | Pregunta | Alternativas | Recomendación |
|---|---|---|---|
| D-M1 | Ubicación componente | A inline Register / B Register folder / C LegalConsent folder | **C** |
| D-M2 | Registro apertura pre-registro | A endpoint con session_token / B localStorage batch / C ambas | **A** |
| D-M3 | Criterio "leído" | A solo abrir / B scroll 90% / C botón explícito / D timer | **B con fallback C** |
| D-M4 | Texto unificado | borrador §2 | **Aprobar o ajustar** (vía Capa 0) |
| D-M5 | Submit registro | A atómico / B dos fases / C tres fases | **A** |
| D-M6 | UX bloqueo checkbox | A disabled+tooltip / B activo+error submit / C disabled+barra / D animación | **A + C** |
| D-M7 | Usuarios legacy | A forzar re-accept / B no-op / C email voluntario | **A diferido a bloque separado** |
| D-M8 | Idioma | A solo ES / B ES+EN / C i18n completo | **A** |

**Impacto si no respondes:** el bloque no pasa Capa 0, no se inicia
Capa 1. Tori opera con recomendaciones por defecto si no hay bloqueo
crítico, pero D-M4 SÍ es bloqueante (el texto final lo decide
Cristian + Capa 0).

---

## 10. Notas operativas

- **Rama**: `bloque-multi-document-consent-v1`
- **PR**: separado, abrir solo después de Bloque 5 mergeado
- **Orden global de ejecución**:
  `nomina-chile-v1` → `legal-viewer-v1` (Bloque 5) →
  `multi-document-consent-v1` (este) → opcional `legal-reaccept-legacy-v1`.
- **Paralelismo**: §18.5 prohibido. Check-lock.sh debe estar activo.
  Si se detecta worktree paralelo (ver memoria
  `feedback_paralelismo_claudes.md`), consultar a Cristian antes de
  iniciar.
- **Auto Mode**: OFF (§19). Tori pide confirmación en cada paso de
  TDD builder y en cada afirmación probatoria legal.
- **Pre-flight §23 obligatorio** antes de cada push con PR.
- **Commit convencional**: `legal(auth): consolidar consentimiento
  multi-documento con evidencia de lectura`.
- **Capa 0 se invoca con**: `/legal-audit multi-document-consent-v1`
  o por solicitud directa del legal-docs-keeper.
- **Texto definitivo D-M4**: cuando legal-docs-keeper genere el
  documento final, Cristian firma aprobación dejando comentario
  explícito en el PR o en `docs/legal/drafts/` con su nombre y fecha.
- **Checklist previo a iniciar builders**:
  - [ ] Bloque 5 mergeado
  - [ ] D-M1..D-M8 respondidos por Cristian
  - [ ] Capa 0 completada con aprobación humana
  - [ ] Frozen-files revisado: `Register.tsx` y `auth_routes.py` NO
    están en FROZEN.md al iniciar, o se ejecuta `/unfreeze` explícito.

---

**FIN DEL PLAN.**
