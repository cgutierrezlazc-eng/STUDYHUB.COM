# Plan — Bloque `legal-viewer-v1`

- **Rama sugerida**: `bloque-legal-viewer-v1`
- **Agente planificador**: web-architect (Opus)
- **Fecha de plan**: 2026-04-21
- **Dependencia de secuencia**: se ejecuta DESPUÉS de que `bloque-nomina-chile-v1` cierre Capa 7 (ambos tocan `src/App.tsx`). La planificación sí puede ocurrir en paralelo (este documento).
- **Componente legal**: SÍ — toca documentos v3.2 firmados y registro de evidencia de lectura. Capa 0 legal-docs-keeper OBLIGATORIA antes del builder.

---

## 1. Contexto

### 1.1 Petición literal de Cristian

Feature 1 — modal flotante desde footer:

> "EN LEGAL, EN EL BANNER ABAJO, EN CADA OPCION, SE ABRA UNA VENTANA FLOTANTE CON TODO EL DOCUMENTO LEGAL"

Feature 2 — página `/legal` con sidebar:

> "luego, poner en la lista, crear una ventana, flotante o full con el acerca de..."

Interpretación confirmada: la "ventana full" es una página dedicada `/legal` (o `/legal/<doc>`) que reemplaza al viewer stand-alone cuando el Usuario quiere navegar entre varios documentos legales sin volver a abrir modales separados.

### 1.2 Relación con piezas anteriores

- **Pieza 5 (cookies v1.0.0 ampliado, 2026-04-21)**: el `legal-docs-keeper` redactó `docs/legal/v3.2/cookies.md` v1.0.0 con 12 secciones (inventario cookies, `cc_visitor_uuid` con 4 condiciones, base legal Art. 6(1)(b) para funcionales post-login, retención 5 años, pseudonimización IP+UA a los 12 meses, derechos del titular, contacto, marco legal chileno+UE, historial). Hash canónico: `48b90468822fda6b0470acb30d4707f037f1dd636eac7ebd967ab293c2a3a513`.
- **Pieza 6 (re-aceptación, mergeada)**: `LegalReacceptanceModal.tsx` + `LegalGate.tsx` ya muestran bump de versión y fuerzan re-aceptación. Ese flujo queda intocado.
- **Bloque 7 pendiente (multi-document consent + evidencia lectura)**: el registro de apertura de documentos que este bloque introduce (`document_views`) es el cimiento que Bloque 7 usará para cruzar "el usuario aceptó" contra "el usuario abrió al menos una vez".

### 1.3 Hallazgos al leer código actual (evidencia §22)

Durante la investigación se confirmaron los siguientes hechos:

**1. Divergencia cookies markdown ↔ página renderizada (BUG GDPR Art. 7(1))**

- `docs/legal/v3.2/cookies.md` v1.0.0 tiene 12 secciones numeradas, incluye inventario detallado por tabla, §3 con 4 condiciones de `cc_visitor_uuid`, §4 base legal Art. 6(1)(b), §5 retención 5 años con fundamento Art. 17(3)(e) GDPR + Art. 2515 CC, §6 pseudonimización 12m, §7 derechos, §9 marco legal detallado con 6 fuentes.
- `src/pages/CookiesPolicy.tsx` tiene 6 secciones, NO incluye `cc_visitor_uuid` con sus 4 condiciones, NO incluye §5 retención 5 años, NO incluye §6 pseudonimización, cita "Versión 1.0" pero el contenido corresponde a un borrador previo.
- **Riesgo legal**: el usuario firma (hash `48b90468…`) un texto pero ve en pantalla otro. Cualquier reclamo ante CNIL/AEPD/Consejo para la Transparencia donde se aporte el hash firmado como prueba sería impugnable porque el usuario no pudo leer físicamente lo que aceptó. Este bloque lo resuelve.

**2. Rutas inconsistentes en Login/Register (BUG secundario)**

- `src/pages/Login.tsx:72-75` y `src/pages/Register.tsx:413-416` apuntan a `/terminos`, `/privacidad`, `/cookies`.
- Las rutas reales registradas en `src/App.tsx:901,905,909` son `/terms`, `/privacy`, `/cookies`.
- `/terminos` y `/privacidad` no están registradas → caen a `NotFound`. Esto significa que los links legales en Login/Register están ROTOS desde al menos la última consolidación.
- Este bloque los arregla en el paso de cablear el footer público.

**3. Arquitectura de rutas legales actual**

- `src/App.tsx:463-498` renderiza `TermsOfService` / `PrivacyPolicy` / `CookiesPolicy` / `DeleteAccount` directamente cuando no hay usuario, envueltos en `legalScrollWrapper` (fix Pieza 5 del bloque legal-consolidation-v2, commit `74961e9`).
- `src/App.tsx:900-915` registra las mismas rutas para usuarios logueados dentro del layout principal.
- No existe componente Footer global compartido: cada página tiene sus propios `footerLinks` (Login, Register, UnderConstruction, etc.).
- No existe `age-declaration` como ruta pública ni como página renderizable. Solo vive como texto en `shared/legal_texts.ts` + `shared/legal_texts.py` y como markdown snapshot en `docs/legal/v3.2/age-declaration.md`. Sí se muestra al usuario pero embebido en el formulario de Register, no como documento navegable.

**4. Ausencia de registro de apertura de documentos**

- No existe tabla `document_views` ni similar en backend. El único registro relacionado es `user_agreements` (aceptación de checkbox), que es distinto de "apertura de documento".
- Bloque 7 (pendiente) requerirá esta estructura. Este bloque la introduce.

### 1.4 Por qué el bloque existe

- **Compliance**: alinear lo que el usuario firma (hash del markdown) con lo que ve (render HTML).
- **UX**: hoy el usuario debe navegar a páginas completas distintas para leer cualquier documento legal. El modal desde footer elimina fricción en casos puntuales (cliquear un link desde cualquier página sin perder contexto).
- **Cimiento Bloque 7**: introducir `document_views` abre la puerta a "evidencia de lectura real" (link + apertura registrada + ticket con hash, ver memoria `feedback_legal_reading_evidence.md`).
- **Consolidar fuente de verdad**: hoy los docs viven en 3 lugares (markdown en `docs/legal/v3.2/`, textos embebidos en `src/pages/*.tsx`, texto canónico en `shared/legal_texts.{ts,py}`). Este bloque centraliza el renderizado usando el markdown como única fuente.

---

## 2. Decisiones arquitectónicas con alternativas

### D-L1 — Fuente del contenido renderizado por el viewer

**Pregunta**: ¿cómo llegan los 4 markdowns canónicos al navegador del usuario?

- **A) Parse markdown runtime con `react-markdown`.** Se importa `docs/legal/v3.2/*.md` al frontend y se renderiza dinámicamente. Un único archivo `.md` se lee, se parsea, se renderiza.
  - Pros: una sola fuente de verdad, imposible que diverja byte-a-byte del hash firmado. Cualquier edición del markdown propaga automáticamente al render. Cumple Art. 7(1) GDPR sin esfuerzo manual.
  - Contras: aumenta bundle ~50-70 kB (react-markdown + remark-gfm para tablas). Requiere habilitar import de `.md` como string en Vite (plugin `?raw` nativo o `vite-plugin-markdown`). Si el markdown tiene contenido malformado, la página puede romper.
  - Mitigación contras: el markdown ya está en el repo y se valida en CI con hash → malformed markdown se detecta antes de llegar a producción. Bundle se absorbe en página `/legal` lazy-loaded (no afecta chunk inicial).
- **B) Sync programático build-time.** Script Node (`scripts/sync_legal_markdown.ts`) lee markdowns y genera archivos `.tsx` equivalentes antes de build. Test CI compara hash.
  - Pros: sin runtime overhead, control fino del render, TypeScript puro.
  - Contras: sync puede fallar silenciosamente si se olvida correr el script localmente. Si el script tiene bug, la divergencia se amplifica. Doble fuente: markdown + .tsx generado (ambas coexisten en repo).
- **C) Escribir contenido a mano en cada `.tsx`** con test que compara hash del HTML renderizado contra hash del markdown y falla CI si difiere.
  - Pros: control visual total, debuggable por humanos línea a línea.
  - Contras: trabajo duplicado cada vez que el abogado edita el markdown. Propenso a errores humanos. Muchos edge cases (tabla, enlace externo) requieren markup ad-hoc.

**Recomendación: A (react-markdown runtime).** Argumento principal: el riesgo legal de divergencia byte-a-byte con el hash firmado (Art. 7(1) GDPR) supera al costo de +50 kB en el chunk de la página `/legal`. El chunk legal es lazy, no afecta LCP de la home. Single source of truth gana.

### D-L2 — Arquitectura del modal flotante

**Pregunta**: ¿un modal genérico o 4 modales específicos?

- **A) Componente genérico `LegalDocumentModal`** que recibe prop `documentKey: 'terms' | 'privacy' | 'cookies' | 'age-declaration'` y delega el rendering a `LegalDocumentRenderer` (componente compartido con la página `/legal`).
- **B) 4 componentes específicos** (`TermsModal`, `PrivacyModal`, etc.), uno por documento.

**Recomendación: A.** Argumento: la UI del modal es idéntica para los 4 documentos (overlay, botón X, scroll interno, título). Duplicar código no aporta valor y multiplica los puntos de sincronización. La prop `documentKey` es tipo-estrecha (union de 4 strings) y el compilador TypeScript atrapa typos.

### D-L3 — Ruta `/legal` con sidebar

**Pregunta**: ¿una sola página con estado interno o rutas anidadas reales?

- **A) Sidebar + viewer en la misma página** (`src/pages/LegalViewer.tsx`) con estado local para documento activo. URL siempre es `/legal` y un query param `?doc=terms` identifica cuál está activo.
- **B) Rutas anidadas reales**: `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/age-declaration`, con layout compartido (`src/pages/LegalLayout.tsx`) y React Router `<Outlet />`.

**Recomendación: B.** Argumentos:
- URLs compartibles: un usuario puede pegar `/legal/privacy` en Slack y el receptor abre directamente esa sección.
- SEO-friendly: cada documento es una URL canónica indexable.
- Histórico navegable: el botón "atrás" del navegador funciona naturalmente entre documentos.
- Semánticamente limpio: un documento = una ruta.

### D-L4 — Redirect de rutas existentes

**Pregunta**: ¿qué hacemos con `/terms`, `/privacy`, `/cookies`, `/delete-account`?

- **A) Deprecar las 4 rutas actuales** y redirigir 301 a `/legal/<doc>`.
- **B) Mantener las 4 rutas actuales Y agregar `/legal/*`** como alternativa.

**Recomendación: B inicial, A diferido post-launch.** Argumentos:
- Hay enlaces externos (emails transaccionales de Zoho, contratos del abogado externo, backlinks desde INAPI, documentación SII) que apuntan a `/terms` y `/privacy`. Romper esas URLs ahora es costoso y puede afectar auditorías.
- Convivir 3 meses permite auditar el tráfico real a las URLs viejas y migrar enlaces externos antes de deprecarlas.
- `B` requiere ambos grupos de rutas activos con el MISMO contenido — esto se resuelve trivialmente porque ambos usan `LegalDocumentRenderer` internamente.
- Al cabo de 3 meses se revisa: si el tráfico a `/terms` es <1% del total, se aplica redirect 301.

### D-L5 — Registro de apertura de documentos

**Pregunta**: ¿registrar ya la apertura o esperar a Bloque 7?

- **A) Endpoint backend** `POST /api/legal/documents/:docKey/viewed`. Nueva tabla `document_views` (user_id nullable para anónimos, document_key, document_version, document_hash, opened_at_utc, user_agent truncado a 200 chars, IP hasheada). Sirve para Bloque 7 evidencia de lectura.
- **B) Solo localStorage** por ahora. Migrar a backend cuando Bloque 7 se active.
- **C) No registrar nada en este bloque.** Puro render.

**Recomendación: A.** Argumentos:
- Bloque 7 está pendiente y la estructura probatoria es inevitable. Diferirla duplica trabajo futuro (hoy modificas footer, mañana modificas footer otra vez para cablear backend).
- Art. 6(1)(f) GDPR (interés legítimo) cubre el tratamiento: Conniku tiene interés legítimo en demostrar que se ofreció la lectura. Art. 5(1)(c) minimización: IP se almacena hasheada desde el inicio, user-agent truncado. Pseudonimización automática a 12 meses (misma lógica de cookies §6).
- Rate-limiting server-side por IP-pseudo para prevenir abuse (un usuario no puede inflar su contador abriendo 10.000 veces).

### D-L6 — Footer público

**Pregunta**: ¿existe un componente Footer global o cada página tiene el suyo?

Hallazgo (grep): NO existe `src/components/Footer.tsx` ni similar global. Los `footerLinks` viven dentro de cada página (`Login.tsx`, `Register.tsx`, `UnderConstruction.tsx`, `Landing.tsx` secciones). Cada uno con sus propios links y estilos.

- **A) Crear `src/components/Footer/PublicFooter.tsx`** como componente compartido con los 4 links legales + contacto + copyright. Reemplazar los `footerLinks` inline de las páginas existentes por este componente.
- **B) Solo agregar los 4 links a las páginas existentes** sin componentizar. Menos refactor pero se pierde la única-fuente-de-footer.
- **C) Componentizar solo el `LegalLinksGroup`** (las 4 opciones) y que cada página lo embeba donde le convenga.

**Recomendación: C.** Argumentos:
- A) implica refactor mayor de Login/Register/UnderConstruction que están semi-frozen (son superficie pública) y es scope creep para este bloque.
- B) duplica los 4 links en N páginas. Si mañana se agrega "Política de Reembolso" o "DPA", hay que editar N sitios.
- C) es el punto medio: un componente pequeño (`LegalLinksFooter`) que centraliza qué documentos se muestran, cada página decide si lo embebe y dónde. Cambios futuros en el set de documentos son un solo edit.

### D-L7 — Sincronización `CookiesPolicy.tsx` ↔ markdown v1.0.0

**Pregunta**: ¿cómo resolvemos la divergencia BUG GDPR 7(1) detectada en §1.3 hallazgo 1?

Si D-L1=A (react-markdown), la sincronización se resuelve automáticamente: el render viene del markdown. Pero hay que decidir qué hacemos con los `.tsx` actuales.

- **A) Reescribir `CookiesPolicy.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx`** para que usen `<LegalDocumentRenderer documentKey="cookies" />` y nada más. Los estilos se mueven a `LegalDocumentRenderer.module.css`. Se eliminan las ~380 líneas de JSX inline de cada página.
- **B) Dejar los `.tsx` actuales intocados** y crear `/legal/<doc>` como segundo canal con el render correcto. El BUG sigue activo en `/cookies`, `/privacy`, `/terms` pero se considera diferido.

**Recomendación: A.** Argumentos:
- B) mantiene el BUG legal vivo en las URLs más usadas. Inaceptable si el objetivo del bloque es justamente cerrar esa brecha.
- A) garantiza que `/cookies`, `/privacy`, `/terms` Y `/legal/cookies`, etc. muestren TODO lo mismo (el markdown canónico). Cero divergencia posible.
- Los tests de CI validarán hash del markdown + snapshot del HTML renderizado para prevenir regresiones futuras.

### D-L8 — `age-declaration.md` como documento público navegable

**Pregunta**: hoy `age-declaration` NO existe como ruta (ver hallazgo 3). ¿Se agrega a `/legal/age-declaration` y al modal?

- **A) Sí, agregarlo como 4° documento público** navegable. El usuario puede ver el texto exacto que firma, incluso antes de registrarse.
- **B) No, dejarlo solo embebido en Register.tsx** como está hoy.

**Recomendación: A.** Argumentos:
- Transparencia: el usuario puede revisar a posteriori qué firmó sin entrar a su perfil.
- Cumplimiento: es un documento canónico (tiene hash `ca527535…`), forma parte del corpus firmado.
- El modal del footer lo necesita de todos modos (Cristian lo listó como 4° opción en la petición).

---

## 3. Archivos a tocar

### 3.1 Frontend — componentes y páginas nuevos

- **Nuevo**: `/Users/cristiang./CONNIKU/src/components/Legal/LegalDocumentModal.tsx` — modal flotante. Props: `isOpen`, `onClose`, `documentKey`. Renderiza overlay + `<LegalDocumentRenderer>` + botón X. Cierra con ESC, click fuera, botón X.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/components/Legal/LegalDocumentModal.module.css` — estilos overlay, modal, animación fade-in.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/components/Legal/LegalDocumentRenderer.tsx` — recibe `documentKey`, fetcha markdown via hook, renderiza con `react-markdown` + `remark-gfm` + componentes custom (tablas, links externos `target="_blank"`, links internos con `onNavigate`). Llama al backend para registrar apertura al montarse.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/components/Legal/LegalDocumentRenderer.module.css` — tipografía, tablas, listas (heredado del CookiesPolicy.module.css existente donde aplique).
- **Nuevo**: `/Users/cristiang./CONNIKU/src/components/Legal/LegalLinksFooter.tsx` — fragmento reusable con los 4 links legales. Puede abrir modal (prop `mode="modal"`) o navegar a `/legal/<doc>` (prop `mode="navigate"`).
- **Nuevo**: `/Users/cristiang./CONNIKU/src/pages/LegalLayout.tsx` — layout con sidebar izquierdo listando 4 documentos + `<Outlet />` a la derecha. Sidebar responsive: colapsa a drawer en móvil (<768px).
- **Nuevo**: `/Users/cristiang./CONNIKU/src/pages/LegalLayout.module.css` — grid 2 columnas, responsive.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/pages/LegalDocumentPage.tsx` — página individual dentro del layout (`/legal/:docKey`). Simplemente renderiza `<LegalDocumentRenderer>`.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/legal/documentRegistry.ts` — mapping `docKey → { path, version, sha256, title, slug }`. Fuente única de qué documentos existen.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/hooks/useLegalDocument.ts` — fetch markdown (via `?raw` import estático Vite), cache en memoria por sesión, devuelve `{ content, version, hash, loading, error }`.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/hooks/useLegalDocumentView.ts` — hook que al montarse dispara el POST a `/api/legal/documents/:docKey/viewed` una sola vez por sesión+doc (idempotencia con localStorage flag `conniku_legal_viewed_<doc>_<hash>`).

### 3.2 Frontend — archivos existentes a modificar

- **Modificado**: `/Users/cristiang./CONNIKU/src/pages/TermsOfService.tsx` — simplificar a wrapper que renderiza `<LegalDocumentRenderer documentKey="terms" />`. Se conserva `onNavigate` prop para el botón volver.
- **Modificado**: `/Users/cristiang./CONNIKU/src/pages/PrivacyPolicy.tsx` — idem `documentKey="privacy"`.
- **Modificado**: `/Users/cristiang./CONNIKU/src/pages/CookiesPolicy.tsx` — idem `documentKey="cookies"`. Esto resuelve el BUG GDPR 7(1).
- **Modificado**: `/Users/cristiang./CONNIKU/src/App.tsx` — agregar rutas `/legal` y `/legal/:docKey` (tanto en la sección guest como en la autenticada). Dejar rutas viejas `/terms`, `/privacy`, `/cookies`, `/delete-account` activas (decisión D-L4=B).
- **Modificado**: `/Users/cristiang./CONNIKU/src/pages/Login.tsx` — corregir links `/terminos` → `/terms`, `/privacidad` → `/privacy` (BUG secundario hallazgo 2). Opcional: reemplazar por `<LegalLinksFooter />`.
- **Modificado**: `/Users/cristiang./CONNIKU/src/pages/Register.tsx` — idem Login.
- **Modificado**: `/Users/cristiang./CONNIKU/src/pages/UnderConstruction.tsx` — agregar `<LegalLinksFooter mode="modal">` al pie (requiere `/unfreeze` si está en FROZEN — verificar al iniciar Capa 1).
- **Modificado**: `/Users/cristiang./CONNIKU/vite.config.ts` — habilitar import de `.md` como `?raw` (nativo de Vite, no requiere plugin extra) si no está ya. Verificar en Capa 0.

### 3.3 Backend

- **Nuevo**: `/Users/cristiang./CONNIKU/backend/legal_document_views_routes.py` — endpoint `POST /api/legal/documents/{doc_key}/viewed`. Recibe: `document_version`, `document_hash`. Toma del request: IP (hashea con salt propio Conniku, guarda solo hash), user-agent (trunca a 200 chars), user_id (nullable, del token si existe). Escribe en tabla `document_views`. Rate-limit: máx 60 POST/hora por IP-pseudo.
- **Nuevo**: `/Users/cristiang./CONNIKU/backend/models.py` (modificado) — clase `DocumentView(Base)` con campos definidos.
- **Nuevo**: `/Users/cristiang./CONNIKU/backend/migrations/XX_add_document_views.sql` — Alembic migration. Tabla `document_views (id BIGSERIAL PK, user_id UUID NULL FK users.id ON DELETE SET NULL, document_key TEXT NOT NULL, document_version TEXT NOT NULL, document_hash TEXT NOT NULL, opened_at_utc TIMESTAMPTZ DEFAULT NOW(), ip_hashed TEXT, user_agent TEXT, session_token_hash TEXT NULL, INDEX (user_id, document_key, opened_at_utc), INDEX (document_key, opened_at_utc))`. Constraint: `document_key IN ('terms','privacy','cookies','age-declaration')`.
- **Modificado**: `/Users/cristiang./CONNIKU/backend/app.py` (o donde se registren routers) — incluir `legal_document_views_routes.router`.

### 3.4 Tests

- **Nuevo**: `/Users/cristiang./CONNIKU/src/__tests__/Legal/LegalDocumentModal.test.tsx` — ESC cierra, click overlay cierra, click dentro NO cierra, botón X cierra, focus trap, aria-modal.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/__tests__/Legal/LegalDocumentRenderer.test.tsx` — render correcto de cada docKey, manejo de error cuando markdown falla, call al hook `useLegalDocumentView` al montar.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/__tests__/Legal/LegalLayout.test.tsx` — sidebar lista 4 docs, navegación por click actualiza URL, responsive drawer en <768px.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/__tests__/Legal/documentRegistry.test.ts` — cada docKey apunta a archivo existente, hash en registry coincide con hash en METADATA.yaml, versión idem.
- **Nuevo**: `/Users/cristiang./CONNIKU/src/__tests__/Legal/legal-sync.test.ts` — **test crítico de compliance**: para cada `docKey`, SHA-256 del contenido markdown cargado debe igualar el hash declarado en `docs/legal/v3.2/METADATA.yaml`. Falla CI si difiere.
- **Nuevo**: `/Users/cristiang./CONNIKU/backend/tests/test_legal_document_views.py` — POST válido crea fila, POST con docKey inválido → 400, user anónimo → user_id NULL, rate-limit → 429 después del 61° POST/hora.

---

## 4. Orden de implementación (TDD RED-GREEN-REFACTOR, 14 pasos)

1. **Capa 0 (OBLIGATORIA)**: legal-docs-keeper ejecuta auditoría: valida que el render HTML del markdown cookies/privacy/terms/age coincida semánticamente con el texto canónico. Firma: "approved-for-viewer-v1". Cristian aprueba humanamente ANTES de continuar.
2. **RED backend**: escribir `test_legal_document_views.py` con casos (POST OK, docKey inválido, rate-limit, anónimo). Correr → todos FAIL (no existe endpoint).
3. **GREEN backend**: crear migration `document_views`, modelo `DocumentView`, endpoint `POST /api/legal/documents/{doc_key}/viewed` mínimo que pase los tests.
4. **REFACTOR backend**: extraer hash IP + truncate UA a helpers, rate-limit middleware.
5. **RED frontend registry**: escribir `documentRegistry.test.ts` que valida mapping 4 docs + hash sync. Falla (registry no existe).
6. **GREEN frontend registry**: crear `src/legal/documentRegistry.ts` + habilitar `.md?raw` en `vite.config.ts` si falta.
7. **RED frontend renderer**: escribir `LegalDocumentRenderer.test.tsx` (render correcto, dispara useLegalDocumentView al montar). Falla.
8. **GREEN frontend renderer**: crear `LegalDocumentRenderer`, `useLegalDocument`, `useLegalDocumentView`. Instalar `react-markdown` + `remark-gfm`. Pasa.
9. **RED frontend modal**: escribir `LegalDocumentModal.test.tsx`. Falla.
10. **GREEN frontend modal**: crear `LegalDocumentModal` + estilos. Implementar accesibilidad (focus trap, aria-modal=true, aria-labelledby, ESC handler, click outside, restore focus on close). Pasa.
11. **RED frontend layout**: escribir `LegalLayout.test.tsx`. Falla.
12. **GREEN frontend layout**: crear `LegalLayout` + `LegalDocumentPage`, cablear rutas `/legal/:docKey` en `App.tsx`. Pasa.
13. **RED sync test**: escribir `legal-sync.test.ts` cargando cada markdown, hasheando, comparando con `METADATA.yaml`. Falla.
14. **GREEN sync test**: implementar el test con lectura real de archivos. Pasa.
15. **REFACTOR + simplificación**: reemplazar el contenido inline de `CookiesPolicy.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx` por `<LegalDocumentRenderer>`. Pipeline de tests verde. Fix URLs rotas Login/Register (`/terminos`→`/terms` etc.). Embeber `<LegalLinksFooter mode="modal">` en UnderConstruction.
16. **Pre-flight CI local §23**: `npx tsc --noEmit` + `npx eslint src/` + `npx vitest run` + `npx vite build` + `pytest backend/ -q` + `ruff check backend/` → todos exit 0.
17. **qa-tester**: verifica visualmente modal y `/legal/*` en móvil 320px, tablet 768px, desktop 1280px. Screenshots. Captura de consola sin errores. Verifica que `document_views` recibe POST en cada apertura.
18. **code-reviewer**: audit ciego del diff. Quality score >=85.
19. **truth-auditor**: cruza reportes, verifica hash sync, verifica que usuarios con sesión viva no rompen el flujo de re-aceptación (Pieza 6 intocada). Quality score >=85.
20. **Capa 4 deploy preview + Capa 5 gap-finder + Capa 6 inspección humana Cristian**.
21. **Capa 7**: merge a main, deploy prod, agregar archivos frozen del bloque a `FROZEN.md`, entrada en `BLOCKS.md`.

---

## 5. Criterio de terminado (22 checks binarios verificables)

- [ ] `docs/plans/bloque-legal-viewer-v1/plan.md` existe y Cristian aprobó explícitamente (este documento).
- [ ] Capa 0 legal-docs-keeper firmó "approved-for-viewer-v1" con aprobación humana.
- [ ] Migración `document_views` aplicada en DB de preview.
- [ ] Endpoint `POST /api/legal/documents/cookies/viewed` responde 200 con `curl` directo enviando body válido.
- [ ] Endpoint responde 400 con `doc_key=invalid`.
- [ ] Endpoint responde 429 al superar 60 POST/hora desde misma IP.
- [ ] `src/legal/documentRegistry.ts` exporta 4 entradas (terms, privacy, cookies, age-declaration).
- [ ] Test `legal-sync.test.ts` verifica que SHA-256 del markdown cargado == hash en `METADATA.yaml` para los 4 docs. Pasa en CI.
- [ ] Ruta `/legal` redirige a `/legal/terms` por defecto.
- [ ] Rutas `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/age-declaration` renderizan documento correspondiente.
- [ ] Rutas viejas `/terms`, `/privacy`, `/cookies`, `/delete-account` siguen funcionando (D-L4=B).
- [ ] Modal abre desde footer en UnderConstruction. Cierra con ESC, click fuera, botón X.
- [ ] Modal tiene `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al título, focus trap implementado.
- [ ] `src/pages/CookiesPolicy.tsx` renderiza TODAS las 12 secciones del markdown canónico (incluyendo §3 cc_visitor_uuid, §5 retención 5 años, §6 pseudonimización). Esto cierra el BUG GDPR 7(1).
- [ ] URLs rotas en Login (`/terminos`, `/privacidad`) arregladas a `/terms`, `/privacy`.
- [ ] URLs rotas en Register idem.
- [ ] Responsive móvil 320px: sidebar de `/legal` se colapsa a drawer. Modal footer se adapta a viewport sin scroll horizontal.
- [ ] Responsive tablet 768px: sidebar visible junto a contenido.
- [ ] Responsive desktop 1280px: layout 2 columnas.
- [ ] Contraste WCAG AA 4.5:1 verificado con `axe-core` en los 4 renders.
- [ ] `npx tsc --noEmit` exit 0. `npx eslint src/` exit 0. `npx vitest run` exit 0. `npx vite build` exit 0. `pytest backend/ -q` exit 0. `ruff check backend/` exit 0.
- [ ] code-reviewer quality score >=85. truth-auditor quality score >=85. gap-finder 0 gaps críticos.

---

## 6. Riesgos

### Alto

- **R-A1 — Markdown malformado rompe `/legal`.** Si alguien edita un `.md` con sintaxis GFM inválida, react-markdown puede fallar. Página pública caída.
  - Mitigación: test CI que carga y parsea cada markdown, falla si `react-markdown` lanza. ErrorBoundary específico en `LegalDocumentRenderer` que cae a fallback "documento temporalmente no disponible" con link a contacto.
- **R-A2 — Divergencia markdown ↔ hash firmado (BUG GDPR 7(1)).** Ya detectada hoy en cookies. Si vuelve a pasar por edición descuidada, riesgo legal alto.
  - Mitigación: `legal-sync.test.ts` es gate de CI. Cualquier edición al markdown requiere recalcular hash en `METADATA.yaml`. Si se olvida, CI rojo.
- **R-A3 — `vite.config.ts` falla al habilitar import `.md?raw`.** Si el import no funciona en build de Vercel, la página `/legal` queda con markdowns vacíos y nadie puede leer los documentos.
  - Mitigación: Capa 0 verifica con `npx vite build` local que el import funciona. Preview en Vercel antes de main.

### Medio

- **R-M1 — Bundle size +50-70 kB en chunk legal.** Afecta LCP en móvil 3G.
  - Mitigación: chunk lazy-loaded (ya lo son las páginas legales). Auditar con `npx vite build --mode analyze` antes de Capa 7.
- **R-M2 — Registro backend de apertura sobrecargado.** Un usuario con F5 compulsivo genera 100 POST/min.
  - Mitigación: rate-limit 60/hora por IP-pseudo. Idempotencia client-side con flag localStorage por `<docKey>_<hash>`.
- **R-M3 — Conflicto de merge con `bloque-nomina-chile-v1` en `src/App.tsx`.** Ambos agregan rutas.
  - Mitigación: este bloque espera explícitamente a que nomina-chile cierre Capa 7 (ver §1 dependencia).
- **R-M4 — Componente `LegalLinksFooter` con `mode="modal"` interfiere con páginas que ya tienen su propio footer.** Doble row de links legales.
  - Mitigación: en UnderConstruction solo se embebe si no hay footerLinks propio, o se reemplaza el existente en el mismo commit.

### Bajo

- **R-B1 — UnderConstruction.tsx está frozen** (histórico). Al tocarlo requiere `/unfreeze` explícito.
  - Mitigación: verificar en Capa 1. Si está frozen, preguntar a Cristian antes de `/unfreeze`.
- **R-B2 — Accesibilidad focus trap insuficiente.** Screen readers mal guiados.
  - Mitigación: test unitario con `@testing-library/jest-dom` que verifica orden de tabulación y `aria-*`.
- **R-B3 — Links antiguos `/terms` mantenidos crean SEO duplicado.** Google indexa 2 URLs con mismo contenido.
  - Mitigación: agregar `<link rel="canonical">` en el viejo `/terms` apuntando a `/legal/terms` para canonicalizar SEO sin redirigir 301.

---

## 7. Fuera de scope

Estas cosas NO se hacen en este bloque:

- **Edición de documentos legales desde UI admin.** Solo lectura en este bloque. Edición manual del markdown por Cristian + abogado sigue siendo el canal único.
- **Versioning visual** (mostrar "estás viendo v2, hubo v1"). Diferido — el historial se muestra en la §12 de cada markdown como tabla de texto, sin UI switcher.
- **Traducción a otros idiomas** (inglés, portugués). Diferido — Art. 46 Terms declara español como idioma oficial.
- **Buscador interno dentro de documentos.** Diferido a `legal-viewer-v2` si hay demanda.
- **Impresión optimizada / export a PDF.** Diferido — el usuario puede usar Ctrl+P nativo del navegador.
- **Modo oscuro específico para documentos legales.** Hereda el tema global; sin override.
- **Análisis de readability / Flesch-Kincaid.** Diferido — responsabilidad del abogado externo en revisión off-platform.
- **UI Admin de `document_views`** (CEO viendo quién abrió qué). Diferido a Bloque 7.
- **Evidencia de lectura completa** (scroll-to-bottom detection + unlock checkbox). Diferido a Bloque 7 completo.
- **Multi-document consent flow** (acepta T&C, Privacy y Cookies en un solo gate). Diferido a Bloque 7.

---

## 8. Componente legal

Este bloque ACTIVA el flujo reforzado de §Cumplimiento Legal de CLAUDE.md y §18.7 (componente legal). Se requiere Capa 0 legal-docs-keeper OBLIGATORIA antes del builder, con aprobación humana explícita de Cristian antes de merge.

### 8.1 Normas aplicables con cita específica

- **Art. 7(1) GDPR** (Reglamento UE 2016/679): "Cuando el tratamiento se base en el consentimiento del interesado, el responsable deberá ser capaz de demostrar que aquel consintió el tratamiento de sus datos personales." El bloque asegura que el contenido renderizado coincida byte-a-byte con el hash firmado, garantizando demostrabilidad.
- **Art. 13 GDPR**: obligación de información previa. El bloque garantiza que el usuario PUEDE acceder al texto íntegro en cualquier momento.
- **Art. 5(1)(c) GDPR** (minimización): el registro `document_views` almacena IP hasheada (no cruda) y user-agent truncado a 200 chars.
- **Art. 6(1)(f) GDPR** (interés legítimo): base legal del registro de apertura. Test de ponderación: el interés de Conniku en demostrar que se ofreció la lectura supera al interés de privacidad del usuario dado que (i) IP está hasheada, (ii) UA truncado, (iii) pseudonimización a 12 meses. No se usa para perfilamiento, marketing, analytics ni decisiones automatizadas.
- **Art. 4° Ley 19.628 (Chile)**: información al titular al momento de recolectar. Cumplido por visibilidad pública del texto.
- **Ley 19.496 Art. 3 letra b (Chile)**: derecho a información veraz y oportuna sobre condiciones. Reforzado por sincronización automática markdown↔render.

### 8.2 Validaciones que el legal-docs-keeper debe hacer en Capa 0

1. El markdown renderizado en HTML (post-`react-markdown`) es semánticamente equivalente al markdown fuente (sin pérdida de información legal material).
2. La sanitización de `react-markdown` (remueve `<script>`, handlers) NO altera cláusulas legales sustantivas. Revisión: ningún documento canónico contiene `<script>` ni HTML activo; el markdown es puro texto + tablas + enlaces.
3. El endpoint `POST /api/legal/documents/:docKey/viewed` cumple con base legal declarada (Art. 6(1)(f)) y minimización (Art. 5(1)(c)). IP hasheada, UA truncado, pseudonimización a 12 meses documentada en `cookies.md §6`.
4. El hash SHA-256 en `documentRegistry.ts` coincide con el hash en `docs/legal/v3.2/METADATA.yaml` para los 4 documentos.
5. `age-declaration.md` se sirve con el TEXT HASH canónico (`ca527535…`), no con el FILE HASH (`61dab2ec…`), porque ese es el hash que se almacena en `user_agreements.text_version_hash` y es inmutable por compliance.

### 8.3 Aprobación humana obligatoria

Cristian debe aprobar explícitamente antes de merge a main (§18.7 CLAUDE.md). El truth-auditor no puede cerrar solo este bloque.

---

## 9. Decisiones pendientes batch §21

Responder con formato `1X 2Y 3Z ...` donde cada letra es la alternativa elegida:

1. **D-L1 Fuente del contenido**: A) react-markdown runtime / B) sync build-time / C) escribir a mano + test hash. **Recomendación: A** (single source of truth protege GDPR Art. 7(1)).
2. **D-L2 Arquitectura modal**: A) componente genérico / B) 4 componentes específicos. **Recomendación: A** (no duplicar).
3. **D-L3 Ruta `/legal`**: A) query param `?doc=` / B) rutas anidadas `/legal/:doc`. **Recomendación: B** (compartibles, SEO).
4. **D-L4 Rutas viejas**: A) deprecar con 301 / B) mantener ambas 3 meses. **Recomendación: B** (no romper enlaces externos).
5. **D-L5 Registro de apertura**: A) endpoint backend ya / B) solo localStorage / C) no registrar. **Recomendación: A** (cimiento Bloque 7).
6. **D-L6 Footer global**: A) crear `PublicFooter.tsx` compartido / B) solo editar páginas existentes / C) componentizar solo `LegalLinksFooter`. **Recomendación: C** (menor scope creep).
7. **D-L7 Sync cookies render**: A) reescribir `.tsx` legales a wrapper / B) dejar intocados, nuevo canal `/legal/*`. **Recomendación: A** (cierra BUG GDPR 7(1)).
8. **D-L8 age-declaration como ruta pública**: A) sí, agregarla / B) no, solo embebida en Register. **Recomendación: A** (transparencia + corpus firmado).

**Ejemplo de respuesta válida**: `1A 2A 3B 4B 5A 6C 7A 8A` (= todas las recomendaciones).

---

## 10. Notas operativas

- **Nombre de rama**: `bloque-legal-viewer-v1`.
- **PR**: separado del PR #21 (bloque-legal-consolidation-v2).
- **Dependencia de secuencia**: espera a que `bloque-nomina-chile-v1` cierre Capa 7 antes de iniciar Capa 1 de este bloque. Conflicto potencial en `src/App.tsx` (ambos agregan rutas). La planificación (este documento) SÍ puede ocurrir en paralelo.
- **Verificación pre-Capa 1**: ejecutar `git status` + `git branch --show-current` para confirmar que la rama actual permite edits (no hay otro Claude paralelo tocando los mismos archivos, ver memoria `feedback_paralelismo_claudes.md`).
- **Archivos FROZEN potenciales**: `UnderConstruction.tsx` podría estar frozen (verificar `.claude/frozen-files.txt` al iniciar Capa 1). Si lo está, pedir `/unfreeze` explícito a Cristian antes de tocarlo.
- **Commit style**: commits tipo `legal(viewer): …` porque toca compliance (§Commits CLAUDE.md). Aprobación humana obligatoria antes de merge (§18.7).
- **Prettier pre-commit**: seguir §24 — `npx prettier --write <archivos-tocados>` antes de `git add` para cada `.ts/.tsx/.css/.json`.
- **Pre-flight CI local antes de push**: obligatorio §23. Lista completa de comandos en §5 último check.

---

## Anexo A — Premisas verificadas (§22)

| Premisa | Fuente de verificación | Resultado |
|---|---|---|
| "cookies.md v1.0.0 está ampliado vs CookiesPolicy.tsx" | Read `docs/legal/v3.2/cookies.md` (12 secciones) vs Read `src/pages/CookiesPolicy.tsx` (6 secciones) | CONFIRMADO. Divergencia documentada en §1.3 hallazgo 1. |
| "Login.tsx y Register.tsx tienen links legales rotos" | Grep `href.*terminos\|privacidad` en src/ | CONFIRMADO. `/terminos` y `/privacidad` NO están en `App.tsx:900-915`. §1.3 hallazgo 2. |
| "No existe componente Footer global compartido" | Grep `footer\|Footer` en src/*.tsx, solo aparecen usos locales por página | CONFIRMADO. §1.3 hallazgo 3. |
| "No existe tabla document_views ni endpoint equivalente" | Grep `document_views\|legal_view` en backend/ | CONFIRMADO (no matches). §1.3 hallazgo 4. |
| "age-declaration NO es ruta pública" | Grep `age-declaration\|AgeDeclaration` en src/ → solo aparece en Register.tsx y auth.tsx (como texto, no ruta) | CONFIRMADO. §1.3 hallazgo 3. |
| "docs/legal/v3.2/METADATA.yaml tiene hashes de los 4 documentos" | Read `docs/legal/v3.2/METADATA.yaml` | CONFIRMADO. privacy 7a8ba81d…, terms 9a16122f…, cookies 48b90468…, age-declaration file 61dab2ec… / text ca527535…. |
| "Vite soporta import `.md?raw` nativo" | No verificado en este plan (Capa 0 debe confirmarlo) | PENDIENTE. Si falla, fallback: `vite-plugin-md` o `?raw` con fetch. |

---

## Declaración legal

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
