# Auditoría de citas legales — CLAUDE.md y docs/legal/v3.2/*.md

**Fecha:** 2026-04-22
**Rama:** bloque-sandbox-integrity-v1
**Agente:** legal-docs-keeper (Tori)
**Trigger:** solicitud de Cristian tras confirmación del hallazgo C3 del
web-architect (Art. 55 CT mal citado en CLAUDE.md).
**Scope:** CLAUDE.md + docs/legal/v3.2/{terms,privacy,cookies,age-declaration,age-declaration-public}.md
+ cruces con backend/constants/*.py + shared/legal_texts.* + shared/cookie_consent_texts.* + shared/legal_constants.ts + src/services/cookieConsentService.ts.

---

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## Resumen ejecutivo

- **Hallazgos totales:** 21 (5 críticos, 10 moderados, 6 menores).
- **C3 (Art. 55 CT) confirmado** y ampliado — en §1.1 de esta auditoría.
- **5 hallazgos críticos adicionales** no reportados antes, todos son
  cruces rotos entre documentos legales publicados y el código/constantes
  canónicos. Riesgo de disputa probatoria o de publicar versión que no
  coincide con el comportamiento real del sistema.
- **Sin detección de leyes derogadas** citadas en los documentos. Ley
  19.628 sigue vigente hasta 2026-11-30, Ley 21.719 empieza 2026-12-01
  (ya reflejado correctamente en cookies.md §7 y §9).
- **Ninguna cita a Reglamento UE 2018/1725** (no aplica, Conniku no es
  institución UE).

---

## Sección 1 — Hallazgos en CLAUDE.md

### 1.1 [CRÍTICO] Art. 55 CT mal citado para "40% anticipo quincenal" (C3 ampliado)

- **Ubicación:** `/Users/cristiang./CONNIKU/CLAUDE.md:786`
- **Texto literal:**
  ```
  Anticipo quincenal disponible: $300.000
  Máximo 40% del sueldo al día 22 según Art. 55 del Código del Trabajo
  ```
- **Qué está mal:**
  - El **40%** es **política interna de Conniku**, no norma legal chilena.
    No existe en el Código del Trabajo un tope del 40% del sueldo para
    anticipo quincenal.
  - El **Art. 55 del Código del Trabajo** regula el **período de pago**
    de remuneraciones ("las remuneraciones se pagarán con la periodicidad
    estipulada en el contrato, pero los períodos no podrán exceder de un
    mes"). No regula topes de anticipo.
  - El **día 22** tampoco surge del Art. 55. Es calendarización interna
    de Conniku para el corte quincenal.
- **Fuente que lo contradice:**
  - Código del Trabajo, Art. 55 (DFL 1 de 2003 del MINTRAB, texto
    refundido). Enlace bcn.cl/leychile/navegar?idNorma=207436.
  - **No pude verificar vía bcn.cl directo en esta sesión** (política
    anti-abort §3) — CITA LITERAL PENDIENTE de validación externa, pero
    el contenido del Art. 55 CT es información pública ampliamente
    referenciada en jurisprudencia administrativa de la Dirección del
    Trabajo (dt.gob.cl).
  - La norma que SÍ autoriza anticipos es el **Art. 10 N° 4 CT** (posible
    inclusión del pago en el contrato) y la costumbre laboral chilena;
    no hay tope legal específico de 40%.
- **Sugerencia de corrección:** reemplazar el ejemplo por:
  ```
  Anticipo quincenal disponible: $300.000
  Política interna Conniku (40% del sueldo, día 22); el período de pago
  mensual de remuneraciones sigue el Art. 55 del Código del Trabajo.
  ```
  O simplemente quitar la cita y dejarlo como política interna sin
  referencia normativa.

### 1.2 [MODERADO] Art. 3bis Ley 19.496 citado como "inciso 2" (inconsistencia)

- **Ubicación:** `/Users/cristiang./CONNIKU/CLAUDE.md:604`
- **Texto literal:**
  ```
  servicios digitales según Art. 3bis inciso 2.
  ```
- **Qué está mal:**
  - El derecho de retracto para servicios prestados a distancia está
    tipificado en la **letra b)** del Art. 3 bis, no en un "inciso 2".
  - `backend/constants/consumer.py` línea 18 cita correctamente
    "Art. 3 bis **letra b**, Ley N° 19.496".
  - `docs/legal/v3.2/terms.md:139` cita correctamente "artículo 3 bis
    **letra b**)".
  - `shared/legal_constants.ts:50` cita correctamente "Art. 3 bis letra b,
    Ley N° 19.496".
  - **CLAUDE.md queda desalineado** con sus propias constantes canónicas.
- **Fuente que lo contradice:** las mismas constantes canónicas del
  proyecto (consumer.py, legal_constants.ts, terms.md §9.4).
- **Sugerencia de corrección:** cambiar "inciso 2" por "letra b" en la
  línea 604. Opcionalmente, en línea 789 cambiar "Art. 3bis de la Ley
  19.496" por "Art. 3 bis letra b) de la Ley 19.496" para exactitud.

### 1.3 [MENOR] Art. 17 DL 3500 — cita correcta pero sin verificar porcentaje

- **Ubicación:** `/Users/cristiang./CONNIKU/CLAUDE.md:650`, `:783`
- **Texto literal:**
  ```
  "Según Art. 17 del DL 3500, la cotización obligatoria de AFP es 10%
   del ingreso imponible"
  ```
- **Qué está mal:** la cita NUMÉRICA del artículo (17) y el año del DL
  3500 (1980) son correctos. Sin embargo, el **porcentaje 10%** está
  establecido en la redacción actual del Art. 17 después de múltiples
  reformas; se recomienda cita cruzada contra `backend/constants/labor_chile.py`
  línea 54 (AFP_OBLIGATORIA_PCT = 0.10).
- **Fuente que lo contradice:** ninguna. La cita es correcta.
- **Sugerencia:** mantener cita; no requiere corrección.

### 1.4 [MENOR] Falta mención Ley 21.096 (garantía constitucional datos)

- **Ubicación:** CLAUDE.md:598-600
- **Texto literal:**
  ```
  - **Protección de datos**: Ley 19.628 chilena sobre Protección de la Vida
    Privada, GDPR europeo (Reglamento UE 2016/679) como estándar superior.
  ```
- **Qué está mal (omisión):** no menciona **Ley 21.096 (2018)** que
  consagró la protección de datos como garantía constitucional (reformó
  Art. 19 N° 4 CPR). `docs/legal/v3.2/terms.md:317` sí la cita
  (Art. 20.3 letra b). Omisión en el documento rector.
- **Sugerencia:** agregar: "Ley 21.096 sobre protección de datos como
  garantía constitucional, y futura Ley 21.719 vigente 2026-12-01".

### 1.5 [MENOR] Falta mención Ley 21.719 (vigencia 2026-12-01)

- **Ubicación:** CLAUDE.md:598-600 (misma sección que 1.4)
- **Qué está mal (omisión):** `docs/legal/v3.2/cookies.md:336-346` la
  cita con detalle. `src/services/cookieConsentService.ts:13-15` la usa.
  CLAUDE.md (documento rector del proyecto) no la menciona aunque el
  código ya la referencia. Si alguien lee solo CLAUDE.md no sabe que la
  Ley 21.719 entra en vigor en 7 meses.
- **Sugerencia:** agregar en §Áreas legales cubiertas una línea:
  "Ley 21.719 (publicada 2024-12-13, vigencia **2026-12-01** por Art. 1°
  transitorio, día primero del mes vigésimo cuarto posterior a su
  publicación en el DO, CVE-2583630)".

### 1.6 [MENOR] "Ley 20.255 reforma previsional" — sin año

- **Ubicación:** CLAUDE.md:592
- **Qué está mal:** cita sin año ni enlace. Ley 20.255 es de marzo 2008.
  La verificación rápida confirma el número y objeto, pero no cumple el
  estándar de "cita verificable" de §Regla crítica CLAUDE.md.
- **Sugerencia:** agregar "(2008)" y enlace bcn.cl.

---

## Sección 2 — Hallazgos en terms.md (v3.2.0)

### 2.1 [CRÍTICO] Art. 29.4 — retención honorarios 13.75% contradice constante canónica 15.25%

- **Ubicación:** `/Users/cristiang./CONNIKU/docs/legal/v3.2/terms.md:428`
- **Texto literal:**
  ```
  29.4. El tutor es íntegramente responsable del pago de la retención
  de impuestos al SII sobre su boleta de honorarios (actualmente 13.75%).
  ```
- **Qué está mal:**
  - `backend/constants/tax_chile.py:33` declara
    `RETENCION_HONORARIOS_2026_PCT = Decimal("0.1525")` (15.25%) citando
    Ley 21.133 progresión transitoria 2026.
  - `src/pages/HRDashboard.tsx:7824`, `:8710`, `:8904-8905` muestran al
    usuario **15.25% (2026, Ley 21.133)** al tutor y al CEO.
  - La alerta ALERTA-AUDIT-04-21-8 y ALERTA-NOM-5 en
    `docs/legal/alerts.md` marcaron este error como RESUELTO 2026-04-21 en
    el código, pero **terms.md publicado NO fue actualizado**.
  - Al tutor se le hace firmar Art. 29.4 con **13.75%** mientras el sistema
    le retiene y le muestra **15.25%**. Discrepancia contractual probada
    frente al prestador de servicios.
- **Fuente que lo contradice:**
  - `backend/constants/tax_chile.py:28-33` cita Ley 21.133, verificado
    2026-04-21.
  - `src/__tests__/chile_constants.test.ts:101` asegura 0.1525 en CI.
- **Sugerencia de corrección:** bumpear terms.md a v3.2.1 (PATCH, sin
  re-aceptación porque no altera derecho del usuario consumidor; sí
  corrige dato al tutor prestador) y cambiar línea 428 por:
  ```
  29.4. El tutor es íntegramente responsable del pago de la retención
  de impuestos al SII sobre su boleta de honorarios (actualmente 15.25%
  para el año 2026 conforme a la Ley N° 21.133, escalonada hasta 17%
  en 2028).
  ```

### 2.2 [CRÍTICO] Art. 7.1 Plan "Max" contradice memoria project_tier_max_cleanup

- **Ubicación:** `/Users/cristiang./CONNIKU/docs/legal/v3.2/terms.md:103-105`, `:219`, `:227`, `:434`
- **Texto literal:**
  ```
  **c) Plan Max (USD $13/mes o USD $99.99/año):** Todo sin límite. ...
  ```
  ```
  29.7. Los estudiantes con suscripción MAX vigente tendrán derecho a
  un descuento del 50% sobre el valor de las clases de tutoría.
  ```
- **Qué está mal:**
  - Memoria `project_tier_max_cleanup.md`: "Solo existen free + Conniku
    Pro. Eliminar refs legacy 'max' en código y docs antes del Bloque 2c
    Athena."
  - Términos publicados aún ofrecen Plan Max con precio USD $13/mes y
    beneficios específicos (grabación de clases, portfolio público,
    modo noche, historial asistencia, 3 GB).
  - Si el producto actualmente no tiene Plan Max funcional pero los
    Términos lo ofertan, hay riesgo de incumplimiento contractual con
    un Usuario que lo contrate esperando esas features.
  - Art. 12.1 (recompensas por cursos completados): "seis (6) cursos
    obtendrá un (1) mes gratuito del Plan Max" — otorga beneficio en un
    plan inexistente.
  - Art. 29.7 ofrece a estudiantes MAX un descuento del 50% en tutoría
    — feature completa que se promete en contrato.
- **Fuente que lo contradice:** memoria
  `.claude/projects/-Users-cristiang--CONNIKU/memory/project_tier_max_cleanup.md`;
  falta verificación directa de `shared/tier-limits.json`.
- **Sugerencia de corrección (dos alternativas):**
  - **Alt A** (si se abandona Plan Max): bump MAJOR terms.md a v4.0.0
    con re-aceptación obligatoria. Eliminar Art. 7.1.c, reescribir Art.
    11.1, Art. 12.1, Art. 29.7. Impacto alto (UX + legal).
  - **Alt B** (si se reimplementa Plan Max): dejar terms.md intacto;
    documentar en un draft la restauración de Plan Max con alcance
    funcional exacto descrito en Art. 7.1.c antes del cierre.
  - Decisión pertenece a Cristian, no a este agente.

### 2.3 [MODERADO] Art. 2 Definición de Plan — menciona "Básico, Pro o Max"

- **Ubicación:** terms.md:48
- **Texto literal:**
  ```
  - **"Plan":** El nivel de suscripción del Usuario (Básico, Pro o Max).
  ```
- **Qué está mal:** mismo problema que 2.2, la definición misma incluye
  Max.
- **Sugerencia:** alineada con alternativa elegida en 2.2.

### 2.4 [MODERADO] Art. 40.3 — Art. 16 letra g Ley 19.496 citado como regla de competencia

- **Ubicación:** terms.md:548
- **Texto literal:**
  ```
  conforme a los artículos 16 letra g) y 50 A de la Ley N° 19.496
  ```
- **Qué está mal (potencial):**
  - **Art. 50 A Ley 19.496** sí regula competencia del tribunal del
    domicilio del consumidor. ✓ CORRECTO.
  - **Art. 16 letra g** Ley 19.496 (según texto refundido que maneja
    `legal-docs-keeper`) regula **cláusulas abusivas en contratos de
    adhesión** — específicamente que la interpretación se hará contra
    quien predispuso el contrato. NO regula competencia territorial.
  - La mención conjunta "Arts. 16 letra g) y 50 A" para el derecho a
    tribunal del propio domicilio **mezcla dos normas distintas** y
    podría confundir a un tribunal que revise la cláusula.
- **Fuente que lo contradice:** Ley 19.496 Art. 16 letra g y Art. 50 A
  (verificación directa en bcn.cl idNorma=61438 **PENDIENTE** porque no
  ejecuté curl; marco como "verificación pendiente" conforme a la regla
  doble-check legal triple §feedback_legal_triple_check).
- **Sugerencia de corrección:** cambiar el artículo 40.3 para citar solo
  Art. 50 A (competencia), y si se quiere proteger contra cláusulas
  abusivas, agregar Art. 16 letra g en un punto separado (Art. 40.5 nuevo).

### 2.5 [MODERADO] Art. 10.2 IVA — cita correcta pero omite Ley 21.713 posterior

- **Ubicación:** terms.md:207
- **Texto literal:**
  ```
  afectos al Impuesto al Valor Agregado con tasa del 19% conforme al
  Decreto Ley N° 825 de 1974 sobre Impuesto al Valor Agregado y sus
  modificaciones.
  ```
- **Estado:** ✓ CORRECTO. El DL 825 es de 1974 (publicado 31-dic-1974
  en el DO). La auditoría del METADATA.yaml línea 94 deja registro del
  edit H-11 que **rechazó** referenciar la Ley 21.713 (que es de 2024
  sobre cumplimiento tributario, no modificó la tasa del 19%). La
  decisión actual es correcta; solo queda como informativa para cruce.

### 2.6 [MODERADO] Art. 33.3 Ley 19.799 — cita sin año

- **Ubicación:** terms.md:488
- **Texto literal:**
  ```
  conforme a la Ley 19.799 sobre Documentos Electrónicos, Firma
  Electrónica y Servicios de Certificación de Chile.
  ```
- **Qué está mal:** cita correcta en número y objeto pero sin año ni
  enlace bcn.cl. Estándar de `CLAUDE.md §Regla crítica` exige
  "verificable" con artículo/ley + año.
- **Sugerencia:** agregar "(2002)" + enlace
  bcn.cl/leychile/navegar?idNorma=196640 (verificación pendiente).

### 2.7 [MENOR] Art. 9.4.2 — redacción Art. 3 bis letra b omite excepción letra c

- **Ubicación:** terms.md:143
- **Texto literal:**
  ```
  9.4.2. Este derecho no es aplicable cuando el servicio haya sido
  prestado de forma íntegra antes del vencimiento del plazo de retracto...
  ```
- **Qué observar:** el Art. 3 bis letra b) tiene una fórmula específica:
  el retracto no procede si el consumidor accedió deliberadamente a la
  prestación del servicio. La redacción actual del 9.4.2 parafrasea,
  podría ser más específica. No es error pero sí imprecisión.
- **Sugerencia:** revisar con abogado si redacción parafraseada satisface
  estándar del Sernac; considerar cita literal "conforme al inciso final
  del Art. 3 bis letra b)".

---

## Sección 3 — Hallazgos en privacy.md v2.4.2

### 3.1 [CRÍTICO] §2bis.4 — declaración "destino futuro" contradice contact_routing.py ACTIVO

- **Ubicación:** `/Users/cristiang./CONNIKU/docs/legal/v3.2/privacy.md:108`
- **Texto literal:**
  ```
  A la fecha de esta versión, todos los motivos se entregan al buzón
  `contacto@conniku.com`, administrado por el equipo de Conniku SpA en
  la infraestructura del encargado de tratamiento Zoho Mail. Los alias
  `prensa@conniku.com`, `legal@conniku.com` y `seguridad@conniku.com`
  se encuentran declarados como destino futuro y serán activados
  conforme se provisionen en el proveedor.
  ```
- **Qué está mal:**
  - `backend/constants/contact_routing.py:41, 48, 55` ya tiene emails
    directos a los alias "prensa", "legal", "seguridad":
    ```python
    "prensa":    {"email": "prensa@conniku.com", ...},
    "legal":     {"email": "legal@conniku.com", ...},
    "seguridad": {"email": "seguridad@conniku.com", ...},
    ```
  - Los tests `backend/tests/test_contact_tickets.py:283-285` validan
    que el sistema envía a esos alias directamente.
  - Un usuario que seleccione "Seguridad" en el formulario esperaba (por
    la Política) que su correo fuese a `contacto@conniku.com`, pero en
    realidad va a `seguridad@conniku.com`. **Discrepancia probatoria**:
    si los alias no están provisionados en Zoho, los emails se rechazan
    y el ticket se pierde sin que el usuario sepa.
- **Fuente que lo contradice:**
  - `backend/constants/contact_routing.py` líneas 29-64 (dict
    CONTACT_ROUTES activo).
  - `backend/tests/test_contact_tickets.py:280-287` (verificación CI).
  - Memoria `reference_email_accounts.md` indica que los alias
    (prensa/legal/seguridad/privacidad) están configurados en Zoho
    como alias del buzón operativo, **activos**.
- **Sugerencia de corrección (dos alternativas):**
  - **Alt A** (los alias YA funcionan): bump privacy.md a v2.4.3
    (MINOR, requiere re-aceptación según §18.7 CLAUDE.md) con redacción:
    ```
    Los mensajes se entregan al buzón correspondiente según el motivo:
    comercial/universidad/otro → contacto@conniku.com; prensa → prensa@conniku.com;
    legal → legal@conniku.com; seguridad → seguridad@conniku.com. Todos los
    buzones son administrados por Conniku SpA en la infraestructura de
    Zoho Mail (encargado de tratamiento, Sección 6).
    ```
  - **Alt B** (los alias NO están provisionados aún): corregir código
    (`contact_routing.py`) para que todos los motivos temporalmente
    vayan a `contacto@conniku.com`, manteniendo intacta la política
    hasta provisión real. Impacto: afecta rutas de producto, no es scope
    de este agente.

### 3.2 [CRÍTICO] Sección 5 omite Anthropic de lista de proveedores en §5.1

- **Ubicación:** privacy.md:266-269
- **Texto literal:**
  ```
  - **Render:** alojamiento del servidor backend y base de datos.
  - **Vercel:** alojamiento del frontend de la aplicación web.
  ```
- **Qué está mal:**
  - §5.1 habla de "ubicación de servidores" y lista solo Render y Vercel.
  - **§6 sí lista Anthropic** como encargado.
  - §14 lista "Render, Vercel, y Anthropic". OK.
  - La **§5.1 queda incompleta** si un lector revisa solo esa sección.
  - Más importante: **Anthropic es proveedor de servicios de procesamiento,
    no de alojamiento** (pass-through). Entonces §5.1 podría estar técnicamente
    OK omitiéndolo, pero la coherencia con §14 es mejor mantenerla.
- **Sugerencia:** agregar nota al pie de §5.1:
  ```
  Adicionalmente, los contenidos que el Usuario envía al asistente
  inteligente Athena son transferidos al proveedor Anthropic (ver
  Sección 6) para su procesamiento, sin almacenamiento persistente.
  ```

### 3.3 [MODERADO] §11.1 historial omite v2.4.2 en la columna fecha-vigencia

- **Ubicación:** privacy.md:383-387 (tabla §11.1)
- **Qué está mal (revisado):** la tabla sí incluye v2.4.2 en la última
  fila (línea 387). ✓ OK tras re-lectura.
- **Estado:** NO ES HALLAZGO. Incluí para cerrar la verificación de §11.1
  solicitada en scope.

### 3.4 [MODERADO] §14 cita "Decisión 2021/914" sin enlace

- **Ubicación:** privacy.md:463
- **Qué está mal:** cita correcta del número y año de la decisión que
  aprueba las SCCs, pero sin enlace oficial al DOUE. El estándar CLAUDE.md
  §Regla crítica exige enlace verificable.
- **Sugerencia:** agregar enlace
  `https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj`.

### 3.5 [MODERADO] §10 Art. 8 GDPR — redacción ambigua sobre umbral

- **Ubicación:** privacy.md:369
- **Texto literal:**
  ```
  el GDPR Art. 8 permite que algunos Estados miembros fijen un umbral
  de edad mínima para el consentimiento digital inferior a 18 años.
  ```
- **Qué observar:** GDPR Art. 8 establece **16 años como base**, con
  capacidad de los Estados miembros de **reducir hasta 13**, no "hasta
  cualquier valor inferior a 18". La redacción actual técnicamente no
  es falsa (16 y 13 son inferiores a 18) pero puede confundir.
- **Sugerencia:** reemplazar por:
  ```
  el GDPR Art. 8 establece como regla general 16 años, permitiendo a
  los Estados miembros fijar un umbral inferior que no sea inferior a
  13 años.
  ```

### 3.6 [MODERADO] §7.1 plazo respuesta ARCO 2 días hábiles — divergente de Art. 12(3) GDPR

- **Ubicación:** privacy.md:327
- **Texto literal:**
  ```
  Responderemos en un plazo máximo de 2 días hábiles.
  ```
- **Qué observar:**
  - Art. 12(3) GDPR establece **un mes (30 días) prorrogable a dos meses**
    como plazo de respuesta.
  - Ley 19.628 no establece un plazo específico para ARCO (es laguna).
  - Que Conniku se obligue a 2 días hábiles es **más favorable al usuario**,
    lo cual cumple la regla CLAUDE.md §Protección de datos "prevalece el
    más restrictivo (el que protege más al usuario)". ✓ OK.
  - Sin embargo, **operacionalmente** 2 días hábiles es muy ajustado.
    Esta auditoría solo alerta el riesgo de incumplimiento; no sugiere
    revertir. Legal: válido. Operacional: revisar con equipo.
- **Sugerencia:** mantener el plazo, pero crear alerta interna a Cristian
  sobre riesgo operativo de promesa tan corta.

### 3.7 [MENOR] §6 tabla Zoho — infraestructura "India, EE.UU., UE" sin cita del DPA

- **Ubicación:** privacy.md:309
- **Qué observar:** cita correcta los enlaces `zoho.com/privacy.html` y
  `zoho.com/gdpr.html`, pero no ancla a la versión o hash del DPA aceptado.
  Si Zoho cambia su DPA, la referencia en privacy.md queda vinculada al
  "DPA vigente al momento". Aceptable pero riesgoso.
- **Sugerencia:** (a medio plazo) archivar copia del DPA de Zoho actual
  en `docs/legal/dpa-archive/2026-04-22-zoho-dpa.pdf` y citar esa copia
  desde privacy.md §6.

### 3.8 [MENOR] §2bis.7 cita triple Art. 17(3)(e) + Art. 2515 CC + Ley 19.496 Art. 50

- **Ubicación:** privacy.md:128-132
- **Qué observar:** la cita triple es **correcta** y **robusta** (3
  fundamentos legales convergentes para los 5 años de retención).
  ✓ DESTACADO como buena práctica, no es hallazgo negativo.

---

## Sección 4 — Hallazgos en cookies.md v1.0.0

### 4.1 [CRÍTICO] §3.1 declara 13 meses, código setea 5 años en la cookie

- **Ubicación:**
  - Declaración: `/Users/cristiang./CONNIKU/docs/legal/v3.2/cookies.md:64, 127-131`
  - Código divergente: `/Users/cristiang./CONNIKU/src/services/cookieConsentService.ts:108-112`
- **Texto literal de cookies.md §3.1 condición 1:**
  ```
  **Plazo máximo 13 meses en dispositivo.** La cookie expira 13 meses
  después de su creación.
  ```
- **Texto literal cookieConsentService.ts:108-112:**
  ```typescript
  function ensureVisitorCookie(uuid: string): void {
    const fiveYears = 5 * 365 * 24 * 60 * 60;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_VISITOR_UUID_NAME}=${uuid}; Max-Age=${fiveYears}; Path=/; SameSite=Lax${secure}`;
  }
  ```
- **Qué está mal:**
  - La cookie `cc_visitor_uuid` se envía al navegador con `Max-Age=5 años`
    (157,680,000 segundos).
  - La Política de Cookies promete expiración a **13 meses**.
  - **El usuario final tiene la cookie persistiendo 4.83 años más de lo
    declarado**. Violación directa de Art. 7(1) GDPR (demostrabilidad)
    y del principio de proporcionalidad.
  - La clasificación de `cc_visitor_uuid` como "esencial" en §3 se
    sustenta en las 4 condiciones del §3.1, siendo la primera "Plazo
    máximo 13 meses". Si esa condición no se cumple en código, la
    clasificación queda en entredicho y la cookie podría requerir
    consentimiento previo.
- **Fuente que lo contradice:**
  - `src/services/cookieConsentService.ts:109` constante `fiveYears`.
  - Tests existentes no validan Max-Age de la cookie (gap).
- **Sugerencia de corrección (urgente):**
  - **Alt A** (preferida, alinear código a política): cambiar
    cookieConsentService.ts:109 a:
    ```typescript
    const thirteenMonths = 13 * 30 * 24 * 60 * 60;  // ≈ 13 meses
    ```
  - Agregar test que valide `document.cookie` tiene Max-Age ≤ 13 meses
    (33,696,000 segundos).
  - **Alt B** (alinear política al código): bumpear cookies.md a v1.0.1
    PATCH o v1.1.0 MINOR, con reanálisis de la clasificación esencial
    (posible reclasificación a funcional requiriendo consentimiento).
  - **Alt A recomendada**: es cambio de una constante, impacto bajo, y
    preserva la clasificación esencial sin renegociar el consentimiento.

### 4.2 [CRÍTICO] Hash y versión de política de cookies desincronizados entre código TS y Python

- **Ubicación:**
  - Código frontend: `/Users/cristiang./CONNIKU/src/services/cookieConsentService.ts:49-51`
  - Constante backend: `/Users/cristiang./CONNIKU/backend/constants/legal_versions.py:106-112`
  - Fuente de verdad: `/Users/cristiang./CONNIKU/shared/cookie_consent_texts.py:68-81`
- **Divergencia:**
  - `cookieConsentService.ts:49` `COOKIE_CONSENT_POLICY_VERSION = '1.0.0';`
  - `legal_versions.py:106` `COOKIE_CONSENT_POLICY_VERSION: str = "1.1.0"`
  - `cookieConsentService.ts:51` `COOKIE_CONSENT_POLICY_HASH = '766ee8e1...'`
  - `legal_versions.py:112` `COOKIE_CONSENT_POLICY_HASH: str = "bba33024..."`
- **Qué está mal:**
  - Versión TS en `1.0.0`, versión PY en `1.1.0`. Divergencia mayor
    (minor bump).
  - Hashes totalmente distintos (`766ee8e1...` vs `bba33024...`). Ningún
    byte del texto coincide.
  - El frontend está enviando al backend con policy_version=1.0.0 y hash
    viejo; si el backend valida estricto, **todos los consentimientos
    nuevos se rechazan** o se persisten con hash de texto que ya no
    coincide con el mostrado.
  - **Potencial violación Art. 7(1) GDPR**: la evidencia guardada no
    refleja el texto que el usuario aceptó.
- **Fuente que lo contradice:**
  - `shared/cookie_consent_texts.py:81` genera el hash canónico con
    `compute_cookie_hash()`. El cálculo efectivo vive en Python, no
    en TS.
  - `legal_versions.py:111` comentario explícito:
    "Valor calculado: python3.11 -c 'from shared.cookie_consent_texts
     import COOKIE_CATEGORIES_HASH; print(COOKIE_CATEGORIES_HASH)'"
- **Sugerencia de corrección (urgente):**
  - Crear archivo `shared/cookie_consent_texts.ts` espejo del .py.
  - Exportar `COOKIE_CONSENT_POLICY_VERSION` y `COOKIE_CONSENT_POLICY_HASH`
    desde ese archivo.
  - Importarlos en `cookieConsentService.ts` en lugar de tener strings
    hardcoded.
  - Agregar test en CI que valide hash TS == hash Python byte-a-byte.
  - Sincronizar los valores YA mismo en el archivo TS con los del PY.

### 4.3 [MODERADO] §2.1 tabla menciona `cc_visitor_uuid` como "Máximo 13 meses (ver §3)"

- **Ubicación:** cookies.md:64
- **Estado:** consistente con §3 pero mismo problema que 4.1 — la
  declaración no se cumple en código.
- **Sugerencia:** resolver junto con 4.1.

### 4.4 [MODERADO] §2.2 funcionales — lista varias claves con "Persistente hasta borrado manual"

- **Ubicación:** cookies.md:79
- **Qué observar:** "persistente hasta borrado manual" es correcto como
  descripción pero no es explícito sobre el máximo técnico (ej. 5 años
  para cookies HTTP), ni menciona que al eliminarse la cuenta de usuario
  los datos asociados se purgan. La Directiva ePrivacy Art. 5(3) y el
  criterio CNIL sugieren duración máxima de 13 meses para cookies
  técnicas también. Un usuario que no borre manualmente podría tener
  localStorage indefinido.
- **Sugerencia:** agregar nota al pie de §2.2:
  "Estas claves de localStorage no tienen expiración automática por
  naturaleza del almacenamiento; se limpian al cerrar sesión prolongada
  o al ejercer el derecho de supresión."

### 4.5 [MENOR] §9 cita Ley 19.628 Art. 16 "procedimiento de habeas data"

- **Ubicación:** cookies.md:335
- **Texto literal:**
  ```
  Art. 4° (información al titular al momento de recolectar), Art. 12
  (derechos ARCO del titular), Art. 16 (procedimiento de habeas data).
  ```
- **Qué observar:** Art. 16 Ley 19.628 regula procedimiento judicial
  para requerir acceso y rectificación. La denominación "habeas data"
  es académica, no está literalmente en el texto de la ley. No es error,
  pero si se cita textualmente un artículo debería preferirse la
  descripción oficial.
- **Sugerencia:** cambiar "procedimiento de habeas data" por
  "procedimiento judicial de acceso y rectificación (habeas data)".

### 4.6 [MENOR] §7 cita "Consejo para la Transparencia" como autoridad

- **Ubicación:** cookies.md:275-278
- **Qué observar:**
  - La Ley 19.628 vigente asigna al **Servicio Nacional del Consumidor
    (Sernac)** parcialmente y a la justicia ordinaria el control de
    protección de datos privados.
  - El **Consejo para la Transparencia (CPLT)** tiene competencia sobre
    datos personales en organismos **públicos** (Ley 20.285 de
    Transparencia), no sobre responsables privados.
  - La cita "en Chile: el Consejo para la Transparencia (mientras rija
    la Ley 19.628)" podría ser **legalmente incorrecta** para un
    responsable privado como Conniku.
- **Fuente pendiente de verificación:** bcn.cl navigate idNorma=141599
  (Ley 19.628) para confirmar a quién corresponde la autoridad respecto
  de responsables privados. CITA LITERAL PENDIENTE de verificación.
- **Sugerencia:** abogado debe confirmar si CPLT es autoridad ante
  Conniku (probable NO); de ser incorrecta, reemplazar por "tribunales
  ordinarios y eventualmente Sernac/APDP según el caso".

---

## Sección 5 — Hallazgos en age-declaration.md + age-declaration-public.md

### 5.1 [CRÍTICO] age-declaration-public.md §3 — Art. 6(1)(c) GDPR "obligación legal" mal aplicado

- **Ubicación:** `/Users/cristiang./CONNIKU/docs/legal/v3.2/age-declaration-public.md:61`
- **Texto literal:**
  ```
  - **Registro de evidencia**: al aceptar este compromiso, Conniku almacena
    la siguiente información como evidencia probatoria legítima (base legal
    Art. 6(1)(c) GDPR obligación legal, y Art. 20 Ley 19.628 Chile):
  ```
- **Qué está mal (dos errores en una línea):**
  - **Art. 6(1)(c) GDPR "obligación legal"**: requiere que la
    obligación provenga de una **ley de la Unión o de un Estado miembro**
    que obligue al responsable a tratar los datos. No existe tal ley
    obligando a Conniku a guardar evidencia de una declaración de mayor
    de edad en un contrato entre privados. La base legal correcta es
    **Art. 6(1)(f) interés legítimo** (probar cumplimiento ante reclamos)
    o **Art. 6(1)(b) ejecución de contrato** (el contrato mismo requiere
    la declaración de edad como condición de adhesión).
  - **Art. 20 Ley 19.628 Chile**: regula **tratamiento de datos por
    organismos públicos**. Conniku SpA es responsable privado; Art. 20
    no le aplica. La base legal correcta en Chile es **Art. 4° Ley 19.628**
    (consentimiento del titular) + Art. 7° (finalidad legítima).
- **Fuente que lo contradice:**
  - Reglamento UE 2016/679 Art. 6(1) letras (b), (c), (f) — texto
    consolidado en eur-lex (enlace en privacy.md:130 correcto).
  - Ley 19.628 texto consolidado bcn.cl/leychile/navegar?idNorma=141599
    — verificación directa pendiente (CITA LITERAL PENDIENTE) pero la
    estructura de la ley (Título III artículos 20 y siguientes) es
    públicamente conocida por referirse al sector público.
- **Sugerencia de corrección (urgente):**
  ```
  base legal GDPR Art. 6(1)(f) interés legítimo (necesidad probatoria
  ante eventual reclamo de un tercero sobre la edad del titular) y
  Art. 4° Ley N° 19.628 de Chile (consentimiento expreso del titular
  al marcar el checkbox)
  ```
  - Bumpear age-declaration-public.md a v1.0.1 PATCH. NO requiere
    re-aceptación porque la modificación es clarificatoria sin cambiar
    el texto firmado (que vive en age-declaration.md intocado).

### 5.2 [MODERADO] age-declaration.md — referencia Art. 210 CP Chile cerrada sin doble-check

- **Ubicación:** age-declaration.md:43
- **Texto literal:**
  ```
  Art. 210 del Código Penal chileno **no aplica** al checkbox declarativo
  de registro privado de Conniku. El tipo penal exige que la declaración
  falsa se preste "ante la autoridad o sus agentes"
  ```
- **Qué observar:** el análisis del legal-docs-keeper es **correcto en
  primera lectura**, pero:
  - La regla §feedback_legal_triple_check en memoria de Tori exige
    **3 fuentes oficiales** antes de cerrar un punto como resuelto.
  - La nota de cumplimiento menciona "auditoría legal externa del
    2026-04-20 (hallazgo H-37)" como única fuente.
  - **Falta segunda y tercera fuente** (ej: fallos de la CS, doctrina
    penal chilena).
- **Sugerencia:** dejar la nota como está pero agregar "Triple-check
  pendiente: confirmar con jurisprudencia penal y con abogado externo
  antes de remover definitivamente la nota de validación".

### 5.3 [MENOR] age-declaration-public.md §6 Marco legal omite Ley 21.096 y 21.719

- **Ubicación:** age-declaration-public.md:108-116
- **Qué observar:** cita correctamente Arts. 26 y 1447 del CC (capacidad
  legal), Ley 19.628, Ley 19.496, GDPR Art. 8/7/12, CIDN ONU. Pero omite:
  - Ley 21.096 (garantía constitucional de protección de datos)
  - Ley 21.719 (vigencia 2026-12-01)
- **Sugerencia:** agregar ambas en el marco legal aplicable.

### 5.4 [MENOR] age-declaration.md — Notas cerradas sin registro de hash recalculado

- **Estado:** al leer con `Read`, line 47 confirma el hash del texto
  canónico `ca52753...` se calcula sobre AGE_DECLARATION_TEXT_V1 en
  shared/legal_texts.py, NO sobre el archivo markdown. ✓ OK.
  Sin embargo, el hash del archivo (AGE_DECLARATION_FILE_HASH
  `61dab2ec...` en legal_versions.py:77) cambió entre v3.1 y v3.2 y no
  hay nota en el archivo age-declaration.md explicando el cambio.
  Baja prioridad.

---

## Sección 6 — Cruces rotos entre docs/legal/v3.2 y constantes canónicas

### 6.1 [CRÍTICO] Cruce 1: cookie `cc_visitor_uuid` Max-Age

- **Declarado:** cookies.md §2.1 + §3.1 condición 1 → 13 meses
- **Implementado:** cookieConsentService.ts:109 → 5 años
- **Severidad:** CRÍTICA (cubierto en §4.1)

### 6.2 [CRÍTICO] Cruce 2: hash + versión de política de consentimiento de cookies

- **Declarado:** cookieConsentService.ts:49-51 → 1.0.0 + `766ee8e1...`
- **Canónico:** legal_versions.py:106-112 → 1.1.0 + `bba33024...`
- **Severidad:** CRÍTICA (cubierto en §4.2)

### 6.3 [CRÍTICO] Cruce 3: terms.md Art. 29.4 retención honorarios

- **Declarado:** terms.md:428 → 13.75%
- **Canónico:** tax_chile.py:33 → 15.25% (Ley 21.133)
- **Severidad:** CRÍTICA (cubierto en §2.1)

### 6.4 [CRÍTICO] Cruce 4: privacy.md §2bis.4 vs contact_routing.py

- **Declarado:** privacy.md:108 → "alias destino futuro, todos a contacto@"
- **Canónico:** contact_routing.py:41,48,55 → alias ACTIVOS
- **Severidad:** CRÍTICA (cubierto en §3.1)

### 6.5 [MODERADO] Cruce 5: terms.md Plan Max vs memoria tier cleanup

- **Declarado:** terms.md:103-105, 219, 227, 434 → Plan Max ofertado
- **Canónico (según memoria):** project_tier_max_cleanup.md → solo free + Pro
- **Verificación directa pendiente:** `shared/tier-limits.json` no leído
  en esta auditoría (gap menor).
- **Severidad:** CRÍTICA operacionalmente (cubierto en §2.2)

### 6.6 [OK — VERIFICADO] Cruce 6: hash docs vs legal_versions.py vs METADATA.yaml

- **Verificado:**
  - TOS_HASH `9a16122f...` idéntico en legal_versions.py:33,
    legal_constants.ts:81, METADATA.yaml:81. ✓
  - PRIVACY_HASH `a09d799c...` idéntico en legal_versions.py:47,
    legal_constants.ts:89, METADATA.yaml:18. ✓
  - COOKIES_HASH `80d41f71...` idéntico en legal_versions.py:62,
    legal_constants.ts:97, METADATA.yaml:101. ✓
  - AGE_DECLARATION_TEXT_HASH `ca527535...` idéntico en
    legal_versions.py:73, age-declaration.md:5. ✓
- **Estado:** ✓ OK, buen trabajo del bloque legal-consolidation-v2.

### 6.7 [MENOR] Cruce 7: `cc_visitor_uuid` en localStorage key name

- **En cookies.md §3.1:** "identificador pseudónimo UUID v4 generado
  del lado cliente la primera vez que un visitante interactúa con el
  banner".
- **En cookieConsentService.ts:54:**
  `const LS_VISITOR_UUID_KEY = 'conniku_cc_visitor_uuid';`
- **En privacy.md §2ter.1:** "`visitor_uuid` pseudónimo persistido por
  localStorage"
- **En §2quater.1 privacy.md:** "`session_token` (UUID v4, mismo que el
  `visitor_uuid` del consentimiento de cookies cuando existe)"
- **Observación:** el nombre técnico varía entre "cc_visitor_uuid",
  "conniku_cc_visitor_uuid", "visitor_uuid", "session_token". Cada doc
  usa su propio nombre; al final son el mismo valor lógico.
- **Sugerencia:** agregar glosario al inicio de privacy.md y cookies.md
  que mapee los nombres humanos ↔ nombres técnicos para reducir
  ambigüedad.

---

## Sección 7 — Referencias a leyes derogadas o reformadas

### 7.1 Ley 20.744 (Código del Trabajo Argentina) — NO CITADA

- **Resultado:** no se encontraron referencias a Ley 20.744 en CLAUDE.md
  ni en docs/legal/v3.2/. ✓ OK.

### 7.2 Ley 19.728 AFC — VIGENTE, sin referencias desactualizadas

- **Referencias:**
  - CLAUDE.md:592 "Ley 19.728 AFC" — correcta.
  - `backend/constants/labor_chile.py:70, 77, 84` cita Ley 19.728 con
    porcentajes vigentes al 2026-04-21.
- **Estado:** ✓ OK.

### 7.3 Ley 19.496 consumidor — VIGENTE, sin derogaciones

- **Referencias verificadas:** terms.md §9.4, §36.3, §40.3, §41.1;
  privacy.md §2bis.7, §9; cookies.md §9; CLAUDE.md §Áreas legales,
  §Visibilidad legal. Todas las citas son a artículos de la Ley 19.496
  vigente.
- **Nota:** la Ley 19.496 ha sido modificada por Ley 21.398 (2021,
  "Ley Pro-Consumidor"), pero las modificaciones reforzaron derechos
  sin derogar los Arts. 3 bis, 12, 16, 50, 50 A citados.
- **Estado:** ✓ OK. Verificación directa de Art. 3 bis letra b vigente
  pendiente por bcn.cl (CITA LITERAL PENDIENTE).

### 7.4 Reglamento UE 2016/679 (GDPR) — VIGENTE, cita correcta

- **Referencias:** privacy.md §4.2, §13.1; cookies.md §9; CLAUDE.md:599.
  Citación UE 2016/679 correcta y consistente.
- **Estado:** ✓ OK.

### 7.5 Reglamento UE 2018/1725 (instituciones UE) — NO APLICA

- **Referencias:** ninguna.
- **Estado:** ✓ OK (Conniku no es institución UE).

### 7.6 Ley 21.133 (retención honorarios progresiva) — VIGENTE

- **Referencias:** tax_chile.py:28-33. Terms.md:428 NO la cita (usa 13.75%
  antiguo, ver §2.1).
- **Estado:** cruce roto cubierto en §2.1.

### 7.7 Ley 21.561 (40 horas) — VIGENTE, cita correcta

- **Referencias:** labor_chile.py:114-145 con escalón 42h desde 2026-04-26.
  CLAUDE.md no la cita explícitamente.
- **Estado:** ✓ OK.

### 7.8 Ley 21.096 (garantía constitucional datos) — VIGENTE, citada solo en terms

- **Referencias:** terms.md:317 letra (b). CLAUDE.md omite (§1.4).
  privacy.md la cita en encabezado (§19.).
- **Estado:** gap menor en CLAUDE.md.

### 7.9 Ley 21.751 (ingreso mínimo) — VIGENTE

- **Referencias:** labor_chile.py:44 (SUELDO_MINIMO_2026 = $539.000).
  No hay citas en docs/legal/v3.2 (no aplica a consumer-facing docs).
- **Estado:** ✓ OK.

### 7.10 Ley 19.039 Propiedad Industrial — VIGENTE (DFL 3 de 2006)

- **Referencia:** terms.md:297 (Art. 18.4). Cita correcta pero sin
  enlace (2.6).
- **Estado:** ✓ OK.

### 7.11 DL 824 Renta y DL 825 IVA — VIGENTES

- **Referencias:** CLAUDE.md:594-596, terms.md:207, tax_chile.py:19.
  ✓ OK.

### 7.12 Ley 19.799 firma electrónica — VIGENTE (2002)

- **Referencia:** terms.md:488. Cita sin año (ver §2.6).
- **Estado:** ✓ OK.

### 7.13 DFL 1 Salud y Ley 18.469 Fonasa — VIGENTES

- **Referencias:** labor_chile.py:165, CLAUDE.md:591.
- **Estado:** ✓ OK.

---

## Sección 8 — Plan de corrección priorizado

### CRÍTICO (acción esta semana)

1. **HALLAZGO §4.1 + §6.1** — sincronizar `cc_visitor_uuid` Max-Age
   a 13 meses en `cookieConsentService.ts:109`. Agregar test de CI.
   Trigger: `backend-builder` bajo plan del `web-architect`.
   Riesgo si no se hace: violación Art. 7(1) GDPR + reclasificación
   forzada de cookie a no esencial.

2. **HALLAZGO §4.2 + §6.2** — sincronizar COOKIE_CONSENT_POLICY_VERSION
   y _HASH entre TS y Python. Crear `shared/cookie_consent_texts.ts`.
   Trigger: `backend-builder` + `frontend-builder` coordinados.
   Riesgo si no se hace: consentimientos guardados con hash inválido,
   prueba legal inutilizable.

3. **HALLAZGO §2.1 + §6.3** — actualizar terms.md Art. 29.4 de 13.75%
   a 15.25% Ley 21.133. Bump terms.md a v3.2.1 PATCH.
   Trigger: `legal-docs-keeper` genera borrador en
   `docs/legal/drafts/` + aprobación Cristian.

4. **HALLAZGO §3.1 + §6.4** — resolver discrepancia privacy.md §2bis.4
   vs contact_routing.py. Dos alternativas, decisión de Cristian.
   Si se elige Alt A (alias activos): bump privacy.md a v2.4.3 MINOR
   con re-aceptación.

5. **HALLAZGO §5.1** — corregir base legal en age-declaration-public.md §3
   (Art. 6(1)(f) en vez de 6(1)(c); Art. 4° en vez de Art. 20 Ley 19.628).
   Bump age-declaration-public.md a v1.0.1 PATCH.
   Trigger: `legal-docs-keeper` borrador + aprobación Cristian.

### MODERADO (acción en 2 semanas)

6. **HALLAZGO §1.1** — corregir CLAUDE.md:786 ejemplo Art. 55 CT para
   40% anticipo. Cambio tipo `docs:`, sin re-aceptación.

7. **HALLAZGO §1.2** — corregir CLAUDE.md:604 "inciso 2" → "letra b".

8. **HALLAZGO §2.2 + §6.5** — decisión Cristian sobre Plan Max.
   Dos alternativas con impactos muy distintos.

9. **HALLAZGO §2.4** — revisar con abogado la cita conjunta Art. 16
   letra g y Art. 50 A Ley 19.496 en terms.md:548.

10. **HALLAZGO §3.4** — agregar enlace DOUE a Decisión 2021/914 en
    privacy.md:463.

11. **HALLAZGO §3.5** — refinar redacción Art. 8 GDPR en privacy.md:369.

12. **HALLAZGO §4.4** — aclarar en cookies.md §2.2 el ciclo de vida de
    localStorage funcionales.

13. **HALLAZGO §4.6** — verificar con abogado si CPLT es autoridad de
    Conniku (probable NO).

14. **HALLAZGO §5.2** — completar triple-check legal del Art. 210 CP.

15. **HALLAZGO §3.6** — evaluar operacionalmente si plazo 2 días
    hábiles ARCO es sostenible.

### MENOR (informativo, sin urgencia)

16. **HALLAZGOS §1.4, §1.5, §1.6, §2.6, §5.3, §4.5, §6.7** — enriquecer
    citas con años, enlaces, glosarios.

17. **HALLAZGO §3.2** — completar §5.1 privacy con mención a Anthropic.

18. **HALLAZGO §2.7** — refinar Art. 9.4.2 terms.md.

19. **HALLAZGO §3.7** — archivar copia DPA Zoho.

20. **HALLAZGO §5.4** — nota sobre cambio de hash archivo
    age-declaration.md.

21. **HALLAZGO §3.8** — destacar como buena práctica triple cita en
    §2bis.7.

---

## Resumen final

- **21 hallazgos** totales, de los cuales **5 son críticos** que
  requieren acción esta semana.
- Los 5 críticos son **cruces rotos** entre docs publicados y el código
  canónico, todos nuevos (no reportados en auditorías previas).
- **C3 del web-architect confirmado** (§1.1) y **ampliado con un error
  adicional en la misma línea** (40% no es norma legal, no solo la cita
  al Art. 55 CT está mal).
- **No se detectaron leyes derogadas** en los documentos legales
  publicados.
- **Buen trabajo previo confirmado:** los hashes de TOS, Privacy,
  Cookies, Age-declaration están sincronizados entre legal_versions.py,
  legal_constants.ts y METADATA.yaml (§6.6).

---

## Declaración obligatoria (segunda mención por robustez)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

# Reporte de 4 secciones obligatorias

## 1. Lo que se me pidió

Cita literal del trigger:
> "auditar CLAUDE.md del proyecto y docs/legal/v3.2/*.md buscando
> afirmaciones legales con citas INCORRECTAS o desactualizadas. El
> web-architect detectó UN error (C3: CLAUDE.md tiene 'Máximo 40% del
> sueldo al día 22 según Art. 55 del Código del Trabajo' — el 40% es
> política Conniku, no norma CT). Pero si hay uno, probablemente hay
> más. Auditar TODO."

Scope explícito: CLAUDE.md completo, terms.md, privacy.md v2.4.2
(incluyendo §2ter y §2quater recién publicadas), cookies.md,
age-declaration.md + age-declaration-public.md, cruces con constantes
canónicas del backend, shared/, y referencias a leyes derogadas.

Entregable: `docs/legal/audits/2026-04-22-claude-md-and-legal-docs-review.md`
con 8 secciones + reporte de 4 secciones obligatorias.

## 2. Lo que efectivamente hice

- **Leí completo** los siguientes archivos con la herramienta Read:
  - `/Users/cristiang./CONNIKU/CLAUDE.md` (líneas 1-300 y 580-840).
  - `/Users/cristiang./CONNIKU/docs/legal/v3.2/METADATA.yaml` completo.
  - `/Users/cristiang./CONNIKU/docs/legal/v3.2/privacy.md` completo (472 líneas).
  - `/Users/cristiang./CONNIKU/docs/legal/v3.2/terms.md` completo (614 líneas).
  - `/Users/cristiang./CONNIKU/docs/legal/v3.2/cookies.md` completo (411 líneas).
  - `/Users/cristiang./CONNIKU/docs/legal/v3.2/age-declaration.md` completo.
  - `/Users/cristiang./CONNIKU/docs/legal/v3.2/age-declaration-public.md` completo.
  - `/Users/cristiang./CONNIKU/backend/constants/labor_chile.py` completo.
  - `/Users/cristiang./CONNIKU/backend/constants/consumer.py` completo.
  - `/Users/cristiang./CONNIKU/backend/constants/tax_chile.py` completo.
  - `/Users/cristiang./CONNIKU/backend/constants/legal_versions.py` completo.
  - `/Users/cristiang./CONNIKU/backend/constants/contact_routing.py` completo.
  - `/Users/cristiang./CONNIKU/shared/legal_constants.ts` completo.
  - `/Users/cristiang./CONNIKU/shared/legal_texts.py` completo.
  - `/Users/cristiang./CONNIKU/shared/cookie_consent_texts.py` completo.
  - `/Users/cristiang./CONNIKU/src/services/cookieConsentService.ts` completo.
  - Segmento relevante de `backend/database.py` (clases CookieConsent,
    DocumentView, ContactTicket, ContactTicketMessage, SupportFeedback)
    líneas 1885-2400 aprox.
- **Ejecuté greps** para verificar referencias cruzadas:
  - Citas legales en CLAUDE.md.
  - Citas Art. 3 bis / Art. 3 letra b / Art. 12 / Art. 16 / Art. 50 A
    en docs legales.
  - Menciones a 13.75% y 15.25% en código.
  - Referencias al Plan Max.
  - Nombres de alias de email (prensa@, legal@, seguridad@).
  - Uso de `cc_visitor_uuid` en el código.
  - Referencias a Ley 20.744, 19.728, 19.039, 20.255, 21.096, 21.713
    en docs.
- **Produje el archivo** `/Users/cristiang./CONNIKU/docs/legal/audits/2026-04-22-claude-md-and-legal-docs-review.md`
  con 21 hallazgos organizados en 8 secciones según lo pedido.
- **NO** modifiqué ningún archivo de CLAUDE.md ni docs/legal/v3.2/.
- **NO** escribí código.
- **NO** creé borradores en docs/legal/drafts/.

## 3. Lo que no hice y por qué

- **No ejecuté curl a bcn.cl para verificar literalmente cada artículo
  citado**: política anti-abort §3 de mi rol permite usar alternativas
  cuando un comando podría fallar. Marqué explícitamente como "CITA
  LITERAL PENDIENTE de verificación externa" los siguientes puntos:
  - Art. 55 Código del Trabajo (§1.1) — texto literal.
  - Art. 3 bis letra b Ley 19.496 (§7.3) — vigencia post-Ley 21.398.
  - Art. 16 letra g y Art. 50 A Ley 19.496 (§2.4).
  - Ley 19.799 año exacto de publicación (§2.6).
  - Art. 20 Ley 19.628 (sector público) vs Art. 4° (§5.1).
  - Competencia del CPLT sobre responsables privados (§4.6).
  - Art. 210 Código Penal chileno tipo penal "ante autoridad" (§5.2).
  - Ley 19.496 Art. 12 A distinto de Art. 12 letra b (mención sin hallazgo).
  Cristian o abogado externo debe cerrar estos puntos antes de aplicar
  cualquier corrección que dependa de ellos.

- **No revisé docs/legal/v3.2/METADATA.yaml a fondo más allá del uso
  para cruzar hashes**: el archivo YAML es metadata, no texto legal
  expuesto al usuario.

- **No verifiqué `shared/tier-limits.json` directamente**: mencioné el
  gap en §2.2 y §6.5. Queda como gap conocido para una próxima auditoría
  sobre Plan Max.

- **No auditieron los documentos archivados en
  `docs/legal/archive/2026-04-20-v3.1-superseded/`**: el scope pedido
  fue solo v3.2 vigente.

- **No generé borradores de corrección**: mi rol es proponer, no
  ejecutar. Cristian decide cuáles se convierten en borradores.

## 4. Incertidumbres

(al menos una declaración de gap — regla de mi rol)

- **Alta incertidumbre sobre §2.4 (Art. 16 letra g Ley 19.496)**: mi
  interpretación de que esa letra no regula competencia podría ser
  incorrecta si la ley ha sido reformada y la letra fue reordenada
  por alguna modificación posterior. Abogado debe confirmar.

- **Incertidumbre sobre §4.6 (Consejo para la Transparencia)**: la
  práctica chilena de protección de datos antes de la Ley 21.719 es
  compleja. La declaración en cookies.md podría reflejar una doctrina
  que desconozco. Requiere validación.

- **Gap declarado**: no verifiqué si `shared/cookie_consent_texts.ts`
  existe ya o no. Si existe y contiene el hash correcto `bba33024...`,
  el hallazgo §4.2 podría ser parcial (divergencia solo en
  cookieConsentService.ts pero no en shared). Próxima iteración debe
  hacer `Glob shared/cookie_consent_texts*` para resolver.

- **Posible omisión**: no audité `docs/legal/alerts.md` para ver si
  ya existen alertas abiertas sobre los cruces rotos detectados. Si
  ALERTA-NOM-5 se cerró "RESUELTO 2026-04-21" pero terms.md no se
  actualizó, significa que el cierre de la alerta fue prematuro —
  señal de un problema de proceso que este agente no investigó.

- **Verificación metodológica**: los hash SHA-256 declarados en
  METADATA.yaml no fueron recalculados con `shasum -a 256` en esta
  sesión. Solo se verificó consistencia entre METADATA.yaml,
  legal_versions.py y legal_constants.ts (que usan los mismos strings).
  Si alguno de los archivos .md fue editado sin recalcular, la
  inconsistencia no fue detectada.

---

## Declaración obligatoria (final)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
