---
tipo: borrador
documento: "Política de Privacidad"
version_propuesta: "2.4.2"
version_vigente: "2.4.1"
vigencia_propuesta: "2026-04-23 (pendiente OK Cristian + revisión abogado)"
rama_asociada: "bloque-sandbox-integrity-v1"
plan_asociado: "docs/plans/bloque-sandbox-integrity-v1/plan.md"
autor: "legal-docs-keeper (Tori) — Capa 0"
fecha_redaccion: "2026-04-22"
hash_texto_vigente_v2_4_1: "b5b9fed8fd5e4e600c7fa33fbd8dddaec5c627be189b5382e8b7cf81dbcfa288"
hash_texto_propuesto_v2_4_2: "se_calcula_al_finalizar_edicion"
tipo_bump: "MINOR (v2.4.1 → v2.4.2)"
razon_bump: >
  Incorpora dos nuevos tratamientos hoy no enumerados en la Política
  vigente: (a) canal sandbox público que genera filas reales en
  cookie_consents y document_views; (b) tabla support_feedback con
  captura de 👍/👎 + comentario opcional + IP + UA + session_token.
  Es bump MINOR porque clarifica tratamientos ya amparados por bases
  legales existentes (Art. 6(1)(a) consentimiento para cookies;
  Art. 6(1)(f) interés legítimo para document_views y feedback)
  sin imponer nuevas obligaciones al usuario ni ampliar finalidades
  restrictivas. No requiere re-aceptación obligatoria; sí
  notificación informativa.
---

# Borrador Política de Privacidad v2.4.2 — Sandbox + Support feedback

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción. El `legal-docs-keeper` solo propone; Cristian decide y el
abogado externo valida.

---

## 1. Resumen de cambios sobre v2.4.1

| Área | Cambio | Fundamento legal citado |
|---|---|---|
| §2.1 (datos proporcionados por el usuario) | Agregar bullet "Feedback de soporte" | GDPR Art. 6(1)(f) + Ley 19.628 Art. 4° |
| §2.2 (datos automáticos) | Agregar bullet "Registro de lectura de documentos legales (`document_views`)" | GDPR Art. 6(1)(f) + Art. 7(1) demostrabilidad |
| Nueva §2ter "Canal de sandbox de vista previa" | Declara que el sandbox público genera filas reales | GDPR Art. 7(1) + Ley 19.628 Art. 4° |
| Nueva §2quater "Sistema de feedback de ayuda (`support_feedback`)" | Declara captura 👍/👎 + comentario + retención 2 años | GDPR Art. 6(1)(f) + Art. 5(1)(c) + Art. 5(1)(e) |
| §6 (compartición con terceros) | Sin cambios — todos los tratamientos se hacen in-house (Supabase + Render) | N/A |
| §9 (retención) | Agregar dos líneas: `document_views` 5 años, `support_feedback` 2 años con pseudonimización a 12 meses | Art. 2515 CC + GDPR Art. 5(1)(e) |
| §11.1 (historial de versiones) | Agregar fila v2.4.2 | N/A |

---

## 2. Diff literal propuesto

### 2.1. Frontmatter y changelog

**Reemplazar** las líneas 1-11 del frontmatter:

```yaml
---
documento: "Política de Privacidad"
version: "2.4.2"
vigencia_desde: "2026-04-23"
vigencia_hasta: "actual"
hash_texto_canonico: "se_calcula_al_final"
changelog:
  - "v2.4.2 (2026-04-23): agregado canal de sandbox público de vista previa (§2ter) con declaración de registro real en cookie_consents + document_views y origin='sandbox'; agregado sistema de feedback de ayuda (§2quater) con tabla support_feedback, retención 2 años y pseudonimización a 12 meses bajo GDPR Art. 6(1)(f) interés legítimo + Art. 5(1)(c) minimización; enumerado tratamiento document_views (Bloque legal-viewer-v1) en §2.2 y §9."
  - "v2.4.1 (2026-04-22): agregado sistema de tickets de contacto (/contacto) con routing por motivo, retención 5 años, bidireccionalidad noreply@/contacto@."
  - "v2.4.0 (2026-04-20): documento canónico autocontenido post auditoría externa, edits H-01/H-12/§5.3."
---
```

### 2.2. Encabezado H1

**Reemplazar línea 14**:

```markdown
Última actualización: 23 de abril de 2026 · Versión 2.4.2
```

### 2.3. Sección 2.1 — agregar bullet al final

**Insertar** al final del listado §2.1 (después del bullet "Tickets de contacto"):

```markdown
- **Feedback de soporte:** cuando usted interactúa con el widget de ayuda 👍/👎 debajo de una pregunta frecuente del centro de soporte, o completa el comentario opcional asociado a un 👎, recopilamos su valoración (útil / no útil), el identificador estable de la pregunta (`faq_id`), el comentario textual si usted lo escribe, y los metadatos técnicos descritos en la Sección 2quater. El detalle específico de este tratamiento se describe en la Sección 2quater.
```

### 2.4. Sección 2.2 — agregar bullet al final

**Insertar** al final del listado §2.2 (después del bullet "Datos de comunicación"):

```markdown
- **Registro de lectura de documentos legales:** cuando usted abre cualquiera de los documentos legales publicados (Términos, Política de Privacidad, Política de Cookies, Declaración de Mayoría de Edad) desde cualquier canal (producto logueado, landing público, sandbox de vista previa o modal in-app), registramos un evento `document_views` que captura el identificador del documento, el hash SHA-256 de la versión leída, un identificador pseudónimo de visitante (`session_token`, UUID v4 sin PII directa), un indicador booleano de "llegó al final del scroll" y la marca de tiempo UTC. Este registro existe para demostrar la trazabilidad de la lectura en caso de disputa (GDPR Art. 7(1)) y no se cruza con datos de marketing.
```

### 2.5. Nueva Sección 2ter — después de §2bis.8

**Insertar** como nueva sección completa:

```markdown
---

## 2ter. Canal de sandbox de vista previa

Conniku publica, con propósito de iteración de diseño y revisión pública acotada, un entorno de vista previa navegable en la ruta `conniku.com/sandbox/` (y su equivalente en dominios de preview de Vercel). Este entorno reproduce visualmente las pantallas del producto y de los documentos legales, pero **no** es un entorno simulado: las interacciones que el visitante realiza en el banner de cookies y en los modales legales generan **filas reales** en las bases de datos de Conniku, con idéntica validez probatoria que las mismas acciones ejecutadas en el producto logueado.

### 2ter.1. Tratamientos que el sandbox activa

- **Consentimiento de cookies (`cookie_consents`):** al aceptar, rechazar o personalizar el banner en el sandbox, se crea una fila en la tabla `cookie_consents` con el valor `origin = "sandbox"`, el `visitor_uuid` pseudónimo persistido por localStorage, el hash de la versión de la Política de Cookies vigente, la IP pública, el User-Agent truncado a 512 caracteres y el timestamp UTC.
- **Registro de lectura (`document_views`):** al abrir un modal legal en el sandbox, se crea una fila en `document_views` con el `session_token` (mismo valor que `visitor_uuid` por diseño de coherencia), el hash canónico del documento leído y la marca de scroll.

### 2ter.2. Base legal

- **Consentimiento de cookies:** GDPR Art. 6(1)(a) + Directiva 2002/58/CE Art. 5(3) + Ley 19.628 Art. 4°.
- **`document_views`:** GDPR Art. 6(1)(f) — interés legítimo en demostrar la trazabilidad de la lectura de documentos legales (Art. 7(1)), proporcional y no prevaleciente sobre derechos del titular.

### 2ter.3. Retención

- Consentimientos `origin = "sandbox"`: idéntica a los consentimientos de los demás canales, **5 años** desde la fecha de creación, fundada en GDPR Art. 17(3)(e) y Art. 2515 del Código Civil de Chile (ver Política de Cookies §5).
- `document_views` desde sandbox: **5 años** desde la fecha del evento, bajo el mismo fundamento.

### 2ter.4. Vinculación posterior al registro de usuario

Si un visitante del sandbox posteriormente se registra como usuario autenticado de Conniku, el `visitor_uuid` persistido en localStorage permite vincular retrospectivamente el consentimiento anónimo y las lecturas registradas con el `user_id` creado. Esta vinculación se realiza con la sola finalidad de preservar la cadena probatoria del consentimiento (Art. 7(1) GDPR) y de evitar requerir al usuario una segunda aceptación inmediatamente después del registro. El usuario puede oponerse a esta vinculación escribiendo a `privacidad@conniku.com`.

---
```

### 2.6. Nueva Sección 2quater — después de §2ter

**Insertar** como nueva sección completa:

```markdown
## 2quater. Sistema de feedback de ayuda (`support_feedback`)

El centro de soporte de Conniku incluye, debajo de cada pregunta frecuente, un widget que permite al Usuario declarar si la respuesta le resultó útil (👍) o no (👎), y abrir opcionalmente un comentario textual adicional. Este sistema se denomina internamente `support_feedback` y se rige por las reglas siguientes.

### 2quater.1. Datos recolectados por evento

- **Valoración:** booleano `útil = true` o `útil = false`.
- **Identificador de la pregunta:** `faq_id` textual estable (slug), versionado en `docs/support/faq-catalog.md`.
- **Comentario:** opcional, de hasta 2.000 caracteres, únicamente cuando el Usuario lo escribe libremente. El sistema no pre-rellena este campo.
- **Identificador de sesión:** `session_token` (UUID v4, mismo que el `visitor_uuid` del consentimiento de cookies cuando existe) o `user_id` si el Usuario está autenticado.
- **Metadatos técnicos:** dirección IP pública al momento del envío, User-Agent truncado a 512 caracteres (GDPR Art. 5(1)(c) minimización) y marca de tiempo UTC.

### 2quater.2. Base legal

- **GDPR Art. 6(1)(f) — interés legítimo:** mejorar iterativamente el contenido del centro de soporte reduce el volumen de tickets y mejora la calidad del producto. La prueba del balance con derechos del titular (Art. 6(1)(f) segundo párrafo) se documenta en el registro interno de actividades de tratamiento (Art. 30 GDPR). El Usuario puede oponerse en cualquier momento (Art. 21 GDPR) sin afectar al servicio.
- **Ley 19.628 Art. 4°:** aplicable en Chile — el acto de hacer clic en el botón 👍 o 👎 con conocimiento del banner de cookies previamente aceptado constituye manifestación inequívoca de voluntad respecto de la finalidad declarada.
- **GDPR Art. 5(1)(c) minimización:** no se recolectan identificadores de producto, no se crea perfil cruzado con el comportamiento en otras pantallas; solo el `faq_id` y la valoración binaria viajan al backend.

### 2quater.3. Retención y pseudonimización

- **Retención total:** **2 años** (730 días) contados desde la fecha de creación de la fila, almacenada explícitamente en el campo `retained_until_utc`.
- **Pseudonimización a 12 meses:** a los 12 meses de cada fila, los campos `ip_address` y `user_agent` se reemplazan por sus respectivos hashes SHA-256 (o por el valor `NULL` según el procedimiento operativo descrito en `bloque-privacy-jobs-v1`). Subsisten únicamente `faq_id`, `útil`, `comment`, `session_token`, `created_at` y `retained_until_utc`. El campo `pseudonymized_at_utc` se registra al momento de la operación.
- **Eliminación definitiva:** cumplidos los 2 años, la fila se elimina por completo o se agrega de manera irreversible en métricas estadísticas sin identificadores.

**Fundamento del plazo de 2 años:**

- **GDPR Art. 5(1)(e) — limitación del plazo de conservación:** se conservan los datos durante el tiempo estrictamente necesario para las finalidades (análisis y-1 y y-2 del contenido de soporte). Dos años cubren dos ciclos anuales comparables.
- **GDPR Art. 5(1)(c) — minimización:** la pseudonimización a 12 meses asegura que los datos identificables existan solo durante el horizonte útil (detección de abuso y validación de rate-limit). Pasado ese plazo, el valor analítico del dato no requiere identificadores.
- **Artículo 2515 del Código Civil de Chile:** el plazo general de prescripción de acciones personales es de 5 años. Este plazo aplica a la conservación de datos cuya retención pueda ser necesaria para la defensa o el ejercicio de reclamaciones. El feedback anónimo no constituye acto jurídico ni prueba de contratación; por ello el plazo de 5 años del Código Civil **no impone** una retención obligatoria de 5 años sobre este tratamiento, y la elección de 2 años es defendible bajo el principio de proporcionalidad (Ley 19.628 Art. 9°; GDPR Art. 5(1)(c)).
- **Ley 19.628 Art. 6°:** los datos "deben ser eliminados o cancelados cuando su almacenamiento carezca de fundamento legal o cuando hubieren caducado". Pasados 2 años, el fundamento de interés legítimo ya no se sostiene porque los comentarios cubren iteraciones de producto ya completadas.

### 2quater.4. Derechos del Usuario sobre el feedback

- **Acceso:** solicitar copia de todos los registros `support_feedback` asociados a su `session_token` o `user_id` escribiendo a `privacidad@conniku.com` con el identificador.
- **Rectificación:** solicitar modificación del comentario textual si contiene datos inexactos.
- **Supresión:** solicitar eliminación anticipada (antes de cumplirse los 2 años). Conniku eliminará la fila en un plazo máximo de 30 días calendario.
- **Oposición al tratamiento por interés legítimo (Art. 21 GDPR):** el Usuario puede oponerse en cualquier momento; el sistema dejará de considerar sus envíos previos en análisis agregados y los eliminará.

### 2quater.5. Medidas técnicas

- **Rate-limit:** el endpoint `POST /support/feedback` aplica un límite de 60 solicitudes por hora por IP para prevenir abuso, mismo patrón que el canal de tickets (§2bis.5).
- **Sanitización del comentario:** el texto se almacena en crudo, sin renderizar HTML, y se sanitiza antes de mostrarse en el panel interno admin para evitar XSS.
- **No export:** el widget no exporta los comentarios fuera de Conniku; no hay integración con terceros analytics.

---
```

### 2.7. Sección 6 — tabla de compartición con terceros

**Sin cambios**. Todos los datos de `document_views` y `support_feedback` se almacenan en Supabase, que ya está enumerado en §6 con base legal Art. 28 GDPR. Render y Vercel ya están enumerados como infraestructura.

### 2.8. Sección 9 — retención

**Insertar** dos nuevas líneas en el listado de retención:

```markdown
- **Registro de lectura de documentos legales (`document_views`):** 5 años (1.825 días) desde la fecha del evento, fundado en GDPR Art. 17(3)(e) y Art. 2515 del Código Civil de Chile (evidencia probatoria del consentimiento informado). Los campos IP y User-Agent se pseudonimizan a los 12 meses conforme al procedimiento `bloque-privacy-jobs-v1`.
- **Feedback de soporte (`support_feedback`):** 2 años (730 días) desde la fecha del evento. A los 12 meses se pseudonimizan IP y User-Agent. Fundamento: GDPR Art. 5(1)(c) y 5(1)(e); Ley 19.628 Art. 6° y 9°. Art. 2515 CC no aplica por no tratarse de evidencia de acto jurídico.
```

### 2.9. Sección 11.1 — historial de versiones

**Insertar** al final de la tabla:

```markdown
| 2.4.2 | 2026-04-23 | Agregado canal sandbox público (§2ter): consent real + document_views reales con `origin = "sandbox"`, retención 5 años alineada con canales principales. Agregado sistema de feedback de soporte (§2quater): tabla `support_feedback`, base legal Art. 6(1)(f), retención 2 años con pseudonimización a 12 meses, rate-limit 60/h/IP. Enumerado `document_views` como tratamiento automático (§2.2) y en §9 retención. |
```

---

## 3. Verificación §22 — premisas antes de recomendar

| # | Premisa del trigger | Verificación | Resultado |
|---|---|---|---|
| 1 | "Privacy v2.4.1 actual menciona `origin=sandbox` como fuente válida de consent" | Grep sobre `docs/legal/v3.2/privacy.md` por `sandbox` → 0 matches. | **FALSA** → requiere bump. |
| 2 | "Privacy v2.4.1 cubre `document_views` anónimos con Art. 6(1)(f) interés legítimo" | Grep por `document_views`, `view.*legal`, `lectura.*documento` → 0 matches en privacy.md ni en cookies.md. El Art. 6(1)(f) citado en §2bis.2 y §4.2 es específico para rate-limit/honeypot/seguridad/fraude, no para `document_views`. | **FALSA** → requiere bump. |
| 3 | "`support_feedback` no está enumerado en Privacy" | Grep por `support_feedback`, `feedback.*soporte`, `útil.*pregunta` → 0 matches. | **CONFIRMADA** → requiere bump. |
| 4 | "Art. 2515 CC Chile obliga 5 años para toda data personal" | Lectura del Art. 2515: `https://www.bcn.cl/leychile/navegar?idNorma=172986` (URL verificada en el propio Privacy v2.4.1 §2bis.7). El texto del Art. 2515 regula la **prescripción de acciones personales**, no la **retención obligatoria de datos personales**. La obligación de retención proviene de la **defensa ante reclamaciones** (Art. 17(3)(e) GDPR), no del Código Civil per se. Para datos que no constituyen evidencia de acto jurídico (como feedback anónimo), la retención 5 años no es obligatoria. | **FALSA** → 2 años es defendible. |
| 5 | "Ley 19.628 Art. 4° exige consentimiento del titular para `support_feedback`" | Lectura del Art. 4° Ley 19.628: `https://www.bcn.cl/leychile/navegar?idNorma=141599` (URL verificada en Privacy v2.4.1 §2bis.2). El Art. 4° establece base general de consentimiento del titular, pero admite que "no se requerirá autorización para [...] datos que emanan de una fuente accesible al público" y para tratamientos con fundamento legal expreso. La valoración 👍/👎 enviada voluntariamente por el Usuario constituye **manifestación inequívoca de voluntad** sobre la finalidad declarada, equivalente al consentimiento tácito válido bajo Art. 4°. Complementariamente, GDPR Art. 6(1)(f) interés legítimo cubre el tratamiento de metadatos técnicos. | **CUBIERTA** bajo combinación Art. 4° + Art. 6(1)(f). |

**Fuentes legales verificadas (URL + fecha + verificador)**:

| Norma | URL oficial | Fecha verificación | Verificador |
|---|---|---|---|
| GDPR Reglamento UE 2016/679 | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679 | 2026-04-22 | legal-docs-keeper (Tori) |
| Ley 19.628 Chile | https://www.bcn.cl/leychile/navegar?idNorma=141599 | 2026-04-22 | legal-docs-keeper (Tori) |
| Art. 2515 Código Civil Chile | https://www.bcn.cl/leychile/navegar?idNorma=172986 | 2026-04-22 | legal-docs-keeper (Tori) |
| Ley 19.496 Art. 50 | https://www.bcn.cl/leychile/navegar?idNorma=61438 | 2026-04-22 | legal-docs-keeper (Tori) |
| Directiva 2002/58/CE ePrivacy Art. 5(3) | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058 | 2026-04-22 | legal-docs-keeper (Tori) |

**Nota de verificación pendiente**: las URL fueron citadas y reusadas desde Privacy v2.4.1 §2bis (que ya las tiene verificadas por el mismo agente en la Capa 0 del bloque `contact-tickets-v1`). No re-ejecuté la verificación de disponibilidad de cada URL en vivo por limitación de herramientas (sin acceso a `curl` a leychile.cl en este entorno). Se asume vigencia reciente y se marca para re-verificación en la próxima auditoría semanal.

---

## 4. Recomendación final (batch §21)

### 4.1. Decisión sobre bump

**RECOMENDACIÓN: SÍ bumpear Privacy v2.4.1 → v2.4.2 dentro del PR del bloque `sandbox-integrity-v1`.**

Tipo de bump: **MINOR**.

Justificación:

1. La Privacy vigente **no cubre** ni `origin = "sandbox"` en consents ni `document_views` como tratamiento ni `support_feedback` como tabla. Los tres son tratamientos nuevos (o tratamientos preexistentes no enumerados) que requieren declaración conforme a Art. 13-14 GDPR y Art. 4° Ley 19.628.
2. El bump es MINOR (no MAJOR) porque:
   - No introduce nuevas finalidades restrictivas.
   - No cambia las bases legales de tratamientos ya existentes.
   - No requiere re-aceptación obligatoria; solo notificación informativa.
   - Solo clarifica tratamientos amparados por bases legales que ya existen en v2.4.1.
3. Coherencia con la ruta elegida en el bloque `contact-tickets-v1` (v2.4.0 → v2.4.1 en el mismo PR).

### 4.2. Decisión sobre retención `support_feedback`

**RECOMENDACIÓN: 2 años (730 días) con pseudonimización a 12 meses.**

No se override la recomendación D-S6=A a 5 años. Fundamento:

- Art. 2515 Código Civil Chile regula prescripción de acciones personales, **no retención obligatoria de datos personales**. No impone 5 años sobre `support_feedback`.
- GDPR Art. 5(1)(e) limitación temporal → proporcionalidad a la finalidad.
- GDPR Art. 5(1)(c) minimización → pseudonimización a 12 meses.
- Ley 19.628 Art. 6° → eliminación cuando el fundamento caduca.
- Coherencia con patrón `contact_tickets` no aplica para retención (tickets retienen 5 años por evidencia probatoria; feedback no tiene valor probatorio).

### 4.3. Gate obligatorio

El bloque `sandbox-integrity-v1` **no puede pasar a Fase B (builder)** hasta que:

1. Cristian dé OK explícito al borrador v2.4.2 en este archivo.
2. El abogado externo valide el texto (mismo abogado que validó v2.4.0 y v2.4.1). Puede hacerse en paralelo al trabajo del builder, pero el merge del PR del bloque requiere la validación.
3. Se publique el archivo `docs/legal/v3.2/privacy.md` con la versión final (hash nuevo) y se actualice `docs/legal/v3.2/METADATA.yaml` + `backend/constants/legal_versions.py::PRIVACY_POLICY_HASH` + `backend/legal_document_views_routes.py::CANONICAL_HASHES["privacy"]` **en un solo commit atómico** (evita 409 en prod).

### 4.4. Hash propuesto v2.4.2

No calculable en este borrador porque el texto final lo produce Cristian al aprobar. El `hash_texto_propuesto_v2_4_2` se calculará con `shasum -a 256 docs/legal/v3.2/privacy.md` en el commit de publicación.

---

## 5. Lo que NO hice y por qué

- **No escribí código de producto, constantes ni migraciones**: fuera de scope del agente (CLAUDE.md §"Qué NO hace legal-docs-keeper").
- **No publiqué `docs/legal/v3.2/privacy.md` con la versión nueva**: la publicación requiere OK humano de Cristian + abogado externo.
- **No actualicé `backend/constants/legal_versions.py`**: fuera de scope; lo hará el builder en Fase B tras OK del borrador.
- **No verifiqué en vivo el estado HTTP de las URL oficiales citadas**: herramientas del entorno no incluyen curl a leychile.cl en este turno. Se reusan URL ya verificadas en Capa 0 del bloque `contact-tickets-v1` (2026-04-22). Marcar para re-verificación semanal.
- **No generé texto de notificación al usuario para el bump MINOR**: el patrón de notificación (banner informativo 15 días antes de vigencia — §11 Privacy) es responsabilidad del builder de comunicación, no del legal-docs-keeper.

---

## 6. Incertidumbres declaradas

1. **Diseño del feedback en producto React autenticado**: el plan menciona `src/pages/Support.tsx` como "posible destino" para el widget, pero no existe confirmación de que esa página ya haya sido implementada. Si el widget termina siendo solo del sandbox HTML y no del producto autenticado, la Sección 2quater debería aclarar "canal actual: centro de soporte público dentro del sandbox; destinos futuros: centro de soporte del producto autenticado". Pendiente verificación Cristian.
2. **Vinculación `visitor_uuid` ↔ `user_id` al registro**: la §2ter.4 declara que el vínculo se hace para evitar doble aceptación. Requiere que el builder implemente el flujo de "rescate" de consent previo al registro. Si no se implementa (queda diferido a Bloque 7 registro), la §2ter.4 debe redactarse condicionalmente ("cuando dicha funcionalidad se active") o removerse del bump v2.4.2 y diferirse a v2.4.3.
3. **Impacto sobre `user_agreements.text_version_hash` existentes**: el bump MINOR v2.4.1 → v2.4.2 cambia el hash canónico de Privacy. Los consentimientos ya emitidos con hash v2.4.1 siguen siendo válidos (no se invalidan), pero toda llamada futura a `POST /legal/documents/privacy/viewed` debe usar el nuevo hash. Si el builder no actualiza `CANONICAL_HASHES` en el mismo commit que publica el .md, se producirá 409 en todos los modales legales en preview. Este es R-M4 del plan (alta probabilidad). Mitigación: commit atómico obligatorio.
4. **Proporcionalidad de 2 años si el endpoint admin permite leer comentarios individuales a 24 meses**: si alguien del equipo Conniku puede leer un comentario textual en mes 20 (post-pseudonimización a 12m), el texto libre del comentario permanece y puede contener PII accidental (un usuario podría pegar su RUT en el textarea). Recomendación operativa: el builder debe implementar filtro de regex anti-PII (RUT/email) al momento del insert o al momento de la pseudonimización.
5. **No he contrastado la §2quater contra LGPD Art. 7 Brasil ni contra CPRA California**. La Privacy vigente cubre estas jurisdicciones en §13, pero el bump v2.4.2 no agrega derechos específicos de LGPD/CPRA sobre `support_feedback`. Riesgo bajo (base legal equivalente existe en ambos regímenes), pero el abogado externo debe confirmar.

---

## 7. Campos requeridos del lado builder (Fase B)

Cuando Cristian apruebe este borrador, el builder debe:

1. Reescribir `docs/legal/v3.2/privacy.md` aplicando el diff §2.
2. Recalcular hash: `shasum -a 256 docs/legal/v3.2/privacy.md`.
3. Actualizar `docs/legal/v3.2/METADATA.yaml` — agregar entrada `privacy-v2_4_1` con el hash actual `b5b9fed8...` como "superseded" y actualizar la entrada `privacy` con el hash nuevo v2.4.2.
4. Actualizar `backend/constants/legal_versions.py` (o equivalente) → `PRIVACY_POLICY_VERSION = "2.4.2"` + `PRIVACY_POLICY_HASH = "<nuevo-hash>"`.
5. Actualizar `backend/legal_document_views_routes.py::CANONICAL_HASHES["privacy"]` y `CANONICAL_VERSIONS["privacy"]`.
6. Commit atómico único con tipo `legal(privacy):` + aprobación humana antes de merge.

---

**Fin del borrador.** Pendiente OK de Cristian + revisión abogado externo.
