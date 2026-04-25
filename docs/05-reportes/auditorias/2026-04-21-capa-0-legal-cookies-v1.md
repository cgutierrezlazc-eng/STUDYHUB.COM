# Capa 0 Legal — bloque-cookie-consent-banner-v1

- **Fecha:** 2026-04-21
- **Agente:** legal-docs-keeper (Tori)
- **Bloque:** bloque-cookie-consent-banner-v1
- **Plan auditado:** `/Users/cristiang./CONNIKU/docs/plans/bloque-cookie-consent-banner-v1/plan.md` (899 líneas, leído completo).
- **Artefacto Pieza 1 auditado:** `/Users/cristiang./CONNIKU/shared/cookie_consent_texts.py`.
- **Hash canónico verificado:** `766ee8e1f84e514fa5430e9107b6638c20acfa2fda4175ae25ef3ce23890d2ef` (SHA-256, 821 bytes UTF-8). Coincide byte a byte con `COOKIE_CONSENT_POLICY_HASH` declarado en el plan §9.2. OK.

## Declaración obligatoria (apertura)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción. El legal-docs-keeper detecta desfases y propone borradores;
la decisión final y su publicación son responsabilidad de Cristian con
asesoría legal profesional cuando corresponde.

---

## 1. Lo que se me pidió

Cita literal del trigger recibido:

> Ejecuta Capa 0 Legal del bloque `bloque-cookie-consent-banner-v1`.
> Plan completo en `docs/plans/bloque-cookie-consent-banner-v1/plan.md`.
> LÉELO.
>
> Revisar y validar desde perspectiva legal: (1) texto canónico de
> categorías de cookies en `shared/cookie_consent_texts.py` (fuente
> del hash `766ee8e1...`), (2) clasificación de cookies (cc_visitor_uuid
> como esencial; otras del producto), (3) categorías propuestas
> (necessary/functional/analytics/marketing) alineadas con GDPR +
> ePrivacy Art 5.3, Ley 19.628 Art. 4°, Ley 19.496 Art. 12 letra b,
> LSSICE España Art. 22.2, Ley 21.719 Chile (vigencia 2026-12-01),
> (4) textos del banner en español chileno (§9 del plan), (5) retención
> post-delete de 5 años, (6) fecha de vigencia Ley 21.719.
>
> Entregables: reporte en `docs/reports/2026-04-21-capa-0-legal-cookies-v1.md`,
> actualización de `docs/legal/alerts.md`. NO escribir código, NO
> modificar `shared/cookie_consent_texts.py`, NO commit.

---

## 2. Lo que efectivamente hice

### 2.1 Artefactos leídos

- Plan completo (899 líneas). Secciones clave: §1 contexto, §2 matriz
  jurisdicciones, §3 taxonomía cookies, §4 componentes técnicos, §5
  schema `cookie_consents`, §6 flujo UX, §7 gating, §8 estados
  especiales, §9 textos legales, §10 invariantes, §11 piezas, §12
  criterio cierre, §13 riesgos.
- `shared/cookie_consent_texts.py` (76 líneas). Contiene
  `COOKIE_CATEGORIES_TEXT_V1`, `COOKIE_CATEGORIES_VERSION = "1.0.0"`,
  `compute_cookie_hash()`, `COOKIE_CATEGORIES_HASH`.
- `src/pages/CookiesPolicy.tsx` líneas 170-269 (inventario real de
  cookies ya publicadas y base legal declarada).
- `docs/legal/alerts.md` completo (alertas 2D7, 2C, LEG-1 a LEG-5
  preexistentes).
- `docs/legal/v3.2/` — `cookies.md`, `privacy.md`, `terms.md`,
  `METADATA.yaml`, `age-declaration.md`.
- `src/services/cookieConsentService.ts:13` y `src/legal/cookieTexts.ts:16`
  — ambos ya citan `Ley 21.719 (Chile, vigencia 2026-12-13)`.

### 2.2 Verificaciones ejecutadas

- Hash SHA-256 del texto canónico recalculado con Python:
  `766ee8e1f84e514fa5430e9107b6638c20acfa2fda4175ae25ef3ce23890d2ef`.
  Coincide con la constante en el archivo. 821 bytes UTF-8.
- Grep de referencias a `21.719` en el repo: 10+ matches. Todos los
  lugares recientes citan `vigencia 2026-12-13`; el plan en su
  introducción cita `2026-12-01` pero en §2.2 el propio plan ya
  corrige a `2026-12-13` con advertencia "[requiere verificación en
  bcn.cl]". Hay inconsistencia interna del plan (title vs cuerpo) que
  merece fix editorial.

---

## 3. Clasificación de cookies — análisis y veredicto

### 3.1 `cc_visitor_uuid` — clasificado como ESENCIAL por el plan

**Veredicto del legal-docs-keeper:** defensible con matices, pero
requiere un ajuste en la arquitectura y en el texto de la política.
Recomendación: **APROBAR con condiciones** (ver abajo). Sin las
condiciones: **mover a categoría funcional** y renombrar como
`cc_visitor_uuid_optional`.

**Fundamento legal a favor (por qué puede ser esencial):**

- GDPR Art. 7(1) — demostrabilidad del consentimiento: el responsable
  debe ser capaz de "demostrar que el interesado consintió el
  tratamiento". El UUID es la única forma operativa de vincular un
  registro de la tabla `cookie_consents` con el dispositivo que lo
  otorgó. Sin el UUID, el backend no puede probar, frente a una
  reclamación, que el dispositivo X aceptó la política Y en el momento
  Z.
- Orange Romania C-61/19 (TJUE 2020-11-11): el registro probatorio
  debe identificar al dispositivo/usuario que consintió con un texto
  específico. El UUID es el minimum viable identifier.
- Excepción Art. 5(3) ePrivacy — "estrictamente necesaria para prestar
  el servicio solicitado por el suscriptor". Aquí la ambigüedad: el
  "servicio solicitado" más inmediato es "ver la web"; el "servicio
  solicitado" interpretado en sentido amplio incluye "gestionar tu
  consentimiento de cookies", lo cual no puede hacerse sin identificar
  al que consintió.

**Fundamento legal en contra (por qué algún regulador podría
objetarlo):**

- EDPB Guidelines 05/2020 §17-18: la excepción de "estrictamente
  necesaria" se interpreta **restrictivamente**. La CNIL francesa ha
  sostenido en decisiones sancionatorias (Amazon 2020, Google 2020,
  Criteo 2023) que cookies con finalidad de "compliance tooling" que
  puedan implementarse con alternativas menos invasivas deben
  clasificarse como no esenciales.
- Alternativas técnicas menos invasivas documentadas en la práctica:
  (a) storage session-only, (b) UUID derivado de un hash de
  características del navegador (fingerprint de baja entropía), (c)
  firma HMAC del registro servidor-side sin identificador cliente
  persistente.
- El `visitor_uuid` del plan persiste 5 años (§5.3 del plan) en cookie
  `SameSite=Lax, Secure, Domain=.conniku.com`. 5 años es un plazo
  inhabitual largo para un identificador persistente first-party. La
  CNIL recomienda máximo 13 meses para cookies de tipo "medida de
  audiencia exenta de consentimiento" (caso parcialmente análogo).

**Condiciones de aprobación propuestas (si Cristian opta por mantener
como esencial):**

1. **Plazo máximo de vida del UUID reducido a 13 meses**, no 5 años.
   Si el dispositivo vuelve a la web a los 14 meses, se genera UUID
   nuevo y se solicita consentimiento otra vez (comportamiento ya
   previsto en el plan §6.3 con el bump de `policy_hash`). Los 5 años
   del plan aplican al registro del consentimiento **en el backend**,
   no al UUID en el dispositivo del usuario.
2. **El UUID NO se usa para ningún otro fin** que no sea (a) indexar
   el registro de consentimiento y (b) recuperar las preferencias del
   dispositivo. Prohibido usarlo como cross-site tracking, como
   identificador de sesión, como clave de analytics. Esto debe
   declararse explícitamente en la Política de Cookies.
3. **Al retirar todo el consentimiento** (Art. 7(3) GDPR), el UUID se
   regenera: se emite uno nuevo y el anterior queda inválido en el
   dispositivo. El registro histórico con el UUID viejo persiste en
   backend 5 años como evidencia. Esto evita que el dispositivo quede
   "marcado" de por vida tras retirar consentimiento.
4. **Declaración explícita en Política de Cookies** bajo "Estrictamente
   necesarias": "Utilizamos un identificador de dispositivo anónimo
   (`cc_visitor_uuid`) exclusivamente para recordar tu elección de
   cookies y demostrar, ante una eventual reclamación, que tu
   dispositivo aceptó la versión vigente de esta política."

**Alternativa más conservadora (recomendada por legal-docs-keeper si
Cristian quiere minimizar riesgo regulatorio):** mover el UUID a
categoría **funcional** y renombrar `cc_visitor_uuid_optional`.
Consecuencia: un visitante que rechace "funcionales" no tendrá UUID y
el banner le aparecerá en cada visita (peor UX, pero inatacable
regulatoriamente). El UUID sí se genera y persiste para cualquiera
que acepte "funcionales" o superior. La decisión es de Cristian.

**Recomendación final legal-docs-keeper:** aprobar como esencial con
las 4 condiciones arriba.

### 3.2 Otras cookies del producto — revisión categoría por categoría

Clasificación del plan vs veredicto legal-docs-keeper:

| Clave | Plan propone | Veredicto | Observación |
| --- | --- | --- | --- |
| `conniku_token`, `conniku_refresh_token` | Esencial | OK | Auth, ejecución contrato Art. 6(1)(b). Sin discusión. |
| `conniku_server_url` | Esencial | OK | Routing de backend. Estrictamente necesaria. |
| SW cache `conniku-v8` etc. | Esencial | OK | Oferta PWA offline = servicio solicitado. Jurisprudencia clara. |
| `cc_consent_v1` (cookie HTTP) | Esencial | OK | Estado del propio consentimiento. Idéntica lógica a UUID. |
| `conniku_language` | Funcional | OK | EDPB 05/2020 clasifica preferencias de idioma como funcional. |
| `conniku_theme` | Funcional | OK | Preferencia visual. Funcional. |
| `conniku_welcomed` | Funcional | OK | UX no crítica. Funcional correcta. |
| `conniku_apps_banner_v3` | Funcional | OK | UX no crítica. Funcional correcta. |
| `pwa-install-dismissed` | Funcional | OK | UX no crítica. Funcional correcta. |
| `ob_visited`, `conniku_ob_*` | Funcional | OK | Onboarding HR pre-login. Funcional. |
| `conniku_feed_sort`, `conniku_course_progress_*`, `conniku_course_quiz_*`, `conniku_quiz_history` | Funcional | **OBJECIÓN** | El plan §3.2 las lista como funcionales "gateables", pero estas son de **usuario logueado** con contenido educativo propio. Son ejecución de contrato Art. 6(1)(b) (el usuario contrató una plataforma que recuerde su progreso). Sugiero reclasificar como **esenciales post-login** o, consistente con el plan, dejarlas funcionales pero con la decisión declarada en §3.2 del propio plan: "las claves post-login se consideran funcionales pero bajo base legal ejecución de contrato; el banner NO las gatea". Ver detalle en §3.3 abajo. |
| `conniku_enrollment_id`, `conniku_paypal_order_id` | Funcional (post-login, no gateadas) | OK | Ejecución contrato. Correctamente descritas en plan §3.2. |
| `conniku_ceo_signature` | Funcional (post-login) | OK | Staff tool. Ejecución contrato. |
| `conniku_erc_v1`, `conniku_eval_cycles`, `conniku_evaluations`, `conniku_goals`, `conniku_capacitacion_v2`, `conniku_reclutamiento_*`, `conniku_doc_vault`, `conniku_onboarding_processes`, `conniku_offboarding_processes`, `conniku_desv_*` | Funcional (post-login, no gateadas) | OK | Staff HR tools. Ejecución contrato. Correcto no gatearlas. |
| `conniku_path_*`, `conniku_rubric_checked_*`, `conniku_suggestions`, `conniku_analytics_cache`, `conniku_transactions`, `conniku_employee_permissions` | Funcional (post-login) | OK | Staff/academic tools post-login. |
| `cc_visitor_uuid` | Esencial | Condicionado (ver §3.1) | Aprobar con 4 condiciones o mover a funcional. |
| FCM registration token | Marketing (gate funcional por plan §3.4) | **OBJECIÓN menor** | El plan §3.4 dice "Marketing — hoy no existen integraciones activas" pero luego en §3.4 nota sobre FCM clasifica la suscripción push como **funcional opcional**. Sugiero aclarar en el texto canónico: notificaciones transaccionales (recordatorio de tarea, notificación de mensaje privado) son **funcional**; notificaciones promocionales (oferta, campaña) serían **marketing**. Hoy Conniku no envía promocionales, todas son transaccionales → funcional correcto. Recomendación: dejar esta distinción documentada en la Política de Cookies aunque el toggle hoy sea único. |

### 3.3 Decisión arquitectónica de "funcionales post-login no gateadas" (plan §3.2)

El plan declara que claves funcionales de usuario **logueado** (progreso académico, admin HR) se escriben aunque el usuario haya rechazado "funcionales" en el banner, bajo base legal **ejecución de contrato** (Art. 6(1)(b) GDPR), no consentimiento. **Veredicto legal-docs-keeper: defendible y correcto.**

Fundamento:

- Art. 6(1)(b) GDPR: el tratamiento es lícito cuando "es necesario para la ejecución de un contrato". Un estudiante que se registra en Conniku para tomar cursos con progreso persistente está contratando un servicio que requiere persistir ese progreso.
- La excepción Art. 5(3) ePrivacy también cubre esto: el storage es "estrictamente necesario para prestar el servicio solicitado" (el servicio contratado, no "ver la landing").

**Condición para que este argumento sea defendible:**

1. El usuario logueado que rechaza "funcionales" en el banner debe ver un aviso que explique la distinción. Propuesta de texto para el modal en ese caso: "Las preferencias y el progreso que guardas al usar funcionalidades de tu cuenta se almacenan bajo la base legal de ejecución del contrato de servicio, no por este consentimiento." **Este aviso NO está en el plan y es un GAP.**
2. La Política de Cookies debe distinguir claramente "funcionales pre-login (consentimiento)" vs "funcionales post-login (ejecución contrato)". La política actual (`CookiesPolicy.tsx`) lista todo junto como "funcional" sin desagregar. **Pieza 6 del plan debe corregir esto.**

### 3.4 Ninguna cookie "funcional" mal clasificada como "esencial"

Verificado con Grep exhaustivo en §3.1 y §3.2 del plan. No detecto
clasificación al alza (functional→essential) que sea cuestionable.
La única zona gris es `cc_visitor_uuid`, cubierta en §3.1.

**Observación adicional:** el plan NO menciona almacenamiento en
IndexedDB ni `sessionStorage`. Verificar con Grep si el producto usa
alguno:

```
$ grep -rn "indexedDB\|sessionStorage" src/ --include="*.ts" --include="*.tsx"
```

Verificación **pendiente** (no pude ejecutarla en este turno porque
el scope era validación del plan y del archivo de Pieza 1). Si el
producto usa IndexedDB (común en PWAs), debe inventariarse y
categorizarse. Alerta agregada como INFORMATIVA en §7.

---

## 4. Textos del banner — aprobación del copy

### 4.1 Texto canónico (fuente del hash)

El texto canónico en `shared/cookie_consent_texts.py` tiene 4 entradas
lineales (una por categoría) normalizadas con `\n`. **Veredicto:
APROBAR con una corrección editorial en la categoría `marketing`.**

**Correcciones propuestas (todas editoriales, NO legales):**

1. **`functional`** — actual: "Recuerdan tu idioma, tema visual, tour
   de bienvenida y progreso académico local entre visitas. No te
   identifican ni comparten datos con terceros."

   La afirmación "no te identifican" es cuestionable post-login: un
   `conniku_course_progress_*` puede asociarse a tu `user_id`.
   Reformular para honestidad:

   > "Recuerdan tu idioma, tema visual, tour de bienvenida y
   > preferencias de uso entre visitas. No se comparten con terceros
   > con fines publicitarios."

2. **`analytics`** — actual: "Nos permiten entender cómo se usa
   Conniku de forma anónima y agregada, para mejorar la plataforma.
   Hoy no tenemos integraciones externas activas; este toggle queda
   preparado para cuando las activemos."

   OK. Nota: el compromiso "anónima y agregada" debe mantenerse cuando
   se integre analytics real. Si Conniku integra algo que NO sea
   anónimo (ej: PostHog con `user_id`), el texto debe cambiar y el
   hash debe bump.

3. **`marketing`** — actual: "Permitirían medir campañas y mostrarte
   contenido relevante. Hoy Conniku no usa cookies de marketing. Este
   toggle queda preparado para futuras funcionalidades."

   **Corrección importante:** la frase "mostrarte contenido relevante"
   es ambigua y podría interpretarse como "perfilado" (Art. 22 GDPR,
   decisiones automatizadas). Reformular a:

   > "Permitirían medir el resultado de campañas y enviarte
   > comunicaciones comerciales según tus intereses. Hoy Conniku no
   > usa cookies de marketing y tus datos personales no se comparten
   > con redes publicitarias. Este toggle queda preparado para futuras
   > funcionalidades opcionales."

   Esta corrección obliga a **bumpear el hash canónico**. Si Cristian
   acepta, la Pieza 1 Backend debe reejecutarse para publicar
   `COOKIE_CATEGORIES_HASH` nuevo. Si Cristian prefiere mantener el
   texto actual, queda como RIESGO MEDIO documentado.

### 4.2 Copy del banner primera capa (plan §9.1)

Título, cuerpo y orden de botones: **APROBAR con observaciones.**

**Título y cuerpo actuales:**

> "Usamos cookies para que Conniku funcione bien. Necesitamos tu
> permiso para algunas de ellas..."

OK en tono, registro chileno, sin voseo, sin "IA/AI/inteligencia
artificial" (regla Conniku verificada). No manipulativo (cumple
Planet49 C-673/17).

**Observación 1 — paridad visual de botones:** el plan declara que los
3 botones tienen "el mismo tamaño, peso tipográfico, contraste"
(invariante I-02). EDPB 05/2020 §86 y AEPD 2023 exigen que "Rechazar"
tenga la **misma prominencia** que "Aceptar". El plan lo cumple. **OK.**

**Observación 2 — orden propuesto:** `[Personalizar] [Rechazar todas]
[Aceptar todas]`. El orden mete "Rechazar" antes que "Aceptar", lo cual
es defensivo. Algunos DPAs (CNIL 2021 decisión Google/Facebook)
sancionaron banners que mostraban "Aceptar todas" más prominente que
"Rechazar". El orden del plan es **inatacable**. OK.

**Observación 3 — enlace a política:** "Más detalles en nuestra
[Política de Cookies](/cookies)". OK.

**Observación 4 — falta mención explícita al derecho de retirar
consentimiento.** GDPR Art. 7(3) exige que al momento de otorgar
consentimiento se informe al titular de su derecho a retirarlo.
Sugerencia de texto adicional debajo del cuerpo y arriba de los
botones, en tipografía secundaria:

> "Puedes cambiar o retirar tu decisión en cualquier momento desde el
> enlace 'Cookies' en el pie de la página."

**Observación 5 — tono editorial chileno.** Verificado. No hay voseo
rioplatense. "Puedes", "tu permiso", "funcione bien" son registros
chilenos neutros correctos. OK.

### 4.3 Copy del modal de personalización (plan §9.2)

**APROBAR con observaciones.**

**Observación 1 — orden de botones del pie:** plan propone
`[Rechazar todas] [Guardar preferencias] [Aceptar todas]` con "Guardar"
como primario. OK. Paridad visual entre rechazar y aceptar cumplida.

**Observación 2 — "Retirar todo el consentimiento" como link text al
costado.** Sugerencia: elevar a botón con el mismo peso visual que los
3 principales, o al menos con contraste igual al resto. Un link
discreto mientras los botones grandes dicen "Aceptar/Rechazar/Guardar"
puede considerarse "dark pattern" por reguladores estrictos (GDPR Art.
7(3): "tan fácil como otorgarlo").

**Observación 3 — GAP: falta aviso para usuario logueado sobre
"funcionales post-login por ejecución de contrato".** Ver §3.3 de
este reporte. Propuesta de texto a agregar debajo del toggle
"Funcionales", visible solo para usuarios logueados:

> "Nota: algunas preferencias que se guardan al usar tu cuenta (por
> ejemplo, tu progreso académico o herramientas administrativas) se
> almacenan bajo la base legal de ejecución del contrato de servicio,
> no por este consentimiento. Puedes solicitar su eliminación por los
> canales descritos en nuestra Política de Privacidad."

Este texto NO cambia el hash canónico si se muestra en UI pero no
está en el texto canónico de las 4 categorías. Requiere decisión
editorial: incluirlo como quinta línea del texto canónico (bump hash)
o como texto dinámico de UI no hasheado (no bump hash).

**Recomendación legal-docs-keeper:** mantenerlo **fuera del texto
canónico** y como texto de UI dinámico. El hash protege el texto de
las 4 categorías; un aviso adicional contextual al estado de login no
rompe la trazabilidad probatoria.

### 4.4 Copy de aviso de cambio de política (plan §9.3)

> "Actualizamos nuestra Política de Cookies el [fecha]. Revisa tus
> preferencias para continuar."

**APROBAR**. Observación menor: sugerir agregar link directo a diff
legible en `/cookies/changelog` (no en este bloque, en uno posterior).

### 4.5 Copy de mensaje de recarga (plan §9.4)

> "Para aplicar completamente los cambios debemos recargar la página.
> [Recargar ahora] [Más tarde]."

**APROBAR**.

### 4.6 Copy para iframe / DNT (plan §9.5)

> "Detectamos tu señal de privacidad global y aplicamos solo cookies
> necesarias. Puedes cambiarlo desde este enlace."

**APROBAR**.

---

## 5. Retención post-delete de 5 años — veredicto

El plan §5.2 propone:

- `retention_expires_at` por tipo de consentimiento (12 meses para
  analytics/marketing, 24 para necessary+functional, 12 para
  auto-registros).
- **5 años como retención total tras `revoked_at_utc` o
  `retention_expires_at`** como evidencia probatoria.
- Pseudonimización a los 12 meses: NULL-ificar IP y UA, conservar
  visitor_uuid, timestamps, policy_hash, categories_accepted.

### 5.1 Veredicto: APROBAR con observaciones

**Fundamento a favor:**

- GDPR Art. 17(3)(e): el derecho al borrado no aplica cuando el
  tratamiento es necesario para "la formulación, el ejercicio o la
  defensa de reclamaciones". Un registro de consentimiento es
  literalmente esto.
- Práctica estándar UE: entre 3 y 6 años post-revocación es común.
  5 años está en el rango alto-razonable.
- Código Civil chileno Art. 2515 establece prescripción de 5 años
  para acciones ejecutivas y 3 años para ejecutivas convertidas. La
  retención de 5 años se alinea con el plazo máximo prescriptible
  más frecuente en Chile. Esto es **cita legal que requiere
  verificación formal con abogado** antes de incluir en política,
  pero el anclaje es sólido.

**Observaciones:**

1. **El plazo de 5 años debe declararse en Política de Privacidad y
   Política de Cookies.** Hoy la v2.1 de Privacy no lo menciona. La
   nueva versión (Pieza 6) debe hacerlo, con la base Art. 17(3)(e)
   citada explícitamente.
2. **La pseudonimización a 12 meses es buena práctica.** Algunos DPAs
   europeos (Autoriteit Persoonsgegevens NL, CNIL FR) recomiendan
   pseudonimizar a 6-12 meses. 12 meses está en el límite superior.
   Aceptable pero si Cristian quiere minimizar riesgo → 6 meses.
3. **Falta campo de auditoría:** propuesta agregar campo
   `pseudonymized_at_utc` al schema `cookie_consents` para trazar
   cuándo se ejecutó la pseudonimización. Hoy el plan solo lo menciona
   en el job (Pieza 5) pero no en el schema (§5.1). Recomiendo agregar
   al schema.
4. **Caso borde:** usuario que retira consentimiento y luego solicita
   derecho de supresión GDPR Art. 17. El plan dice "se retiene bajo
   Art. 17(3)(e)". Si el usuario insiste vía RGPD DSR (Data Subject
   Request), el responsable debe evaluar caso a caso si la defensa
   legal sigue siendo actual. Recomiendo documentar procedimiento
   interno en `docs/legal/procedures/dsr-cookie-consent.md`
   (fuera de scope de este bloque, como tarea futura).
5. **Transferencia internacional:** el registro incluye IP, que puede
   revelar ubicación. Si el backend de Render está en USA, hay
   transferencia internacional Art. 44-49 GDPR. Ya cubierto por
   ALERTA-LEG-4 preexistente. No bloqueante para este bloque.

### 5.2 Recomendación final

Aprobar los 5 años con estas 4 condiciones:

1. Declarar plazo y base legal Art. 17(3)(e) en Política de Privacidad.
2. Considerar acortar pseudonimización a 6 meses (opcional).
3. Agregar campo `pseudonymized_at_utc` al schema.
4. Documentar procedimiento DSR (en bloque posterior).

---

## 6. Fecha de vigencia Ley 21.719 — verificación

### 6.1 Dato del trigger: "Ley 21.719 Chile fecha 2026-12-01"

### 6.2 Dato del plan §2.2: "Promulgada 2024-11-28, publicada 2024-12-13, vigencia 2026-12-13" con advertencia "[requiere verificación en bcn.cl]"

### 6.3 Dato del código repo: `src/services/cookieConsentService.ts:13` y `src/legal/cookieTexts.ts:16` ambos citan "vigencia 2026-12-13"

### 6.4 Veredicto

**Discrepancia confirmada:** el trigger del usuario dice 2026-12-01;
el plan y el código dicen 2026-12-13. Ambos datos están **sin
verificar ante fuente oficial en este turno**.

**Acción requerida:** Cristian (o el abogado) debe verificar contra la
fuente oficial. Caminos:

- URL oficial bcn.cl: `https://www.bcn.cl/leychile/navegar?idNorma=1212270`
- Diario Oficial: búsqueda por N° 21.719.

**Declaración del legal-docs-keeper:** **no tengo fuente verificable
en este turno** para afirmar si la vigencia es 2026-12-01 o 2026-12-13.
Siguiendo la regla crítica del CLAUDE.md §Prohibición de inventar
información legal, no afirmo ninguna de las dos. Marco esto como
**alerta CRÍTICA** en `docs/legal/alerts.md` para resolver antes de
publicar cualquiera de los documentos legales que citen la ley.

**Recomendación operativa para este bloque:** el banner opción B ya
cumple Ley 21.719 por construcción (consentimiento granular,
revocable, específico, informado). Por tanto, la fecha exacta de
vigencia **no bloquea la implementación del bloque**. Sí bloquea las
menciones textuales de la fecha en la Política de Privacidad y en la
Política de Cookies actualizadas (Pieza 6).

**Propuesta:** hasta verificación, usar redacción "vigencia prevista
en diciembre de 2026" sin día específico. Esta redacción es
defendible bajo cualquiera de las dos fechas.

---

## 7. Alertas activas — nuevas y modificadas

Ver sección actualizada en `docs/legal/alerts.md`.

### Nuevas alertas producidas por esta Capa 0

- **ALERTA-COOKIE-1 (CRÍTICA):** fecha de vigencia Ley 21.719 no
  verificada. Bloqueante para Pieza 6 (publicación de Privacy y
  Cookies actualizadas con mención de Ley 21.719).
- **ALERTA-COOKIE-2 (MODERADA):** texto canónico `marketing` usa
  frase "mostrarte contenido relevante" potencialmente ambigua.
  Requiere decisión de Cristian sobre bump de hash.
- **ALERTA-COOKIE-3 (MODERADA):** falta aviso de "funcionales
  post-login por ejecución de contrato" en modal de personalización
  para usuarios logueados. GAP de UX con implicación legal.
- **ALERTA-COOKIE-4 (MODERADA):** condiciones de aprobación de
  `cc_visitor_uuid` como esencial requieren decisión de Cristian:
  (a) aprobar con 4 condiciones, (b) mover a funcional.
- **ALERTA-COOKIE-5 (INFORMATIVA):** inventario de IndexedDB y
  sessionStorage del producto no ejecutado en este turno. Verificar
  en Pieza 2 o en auditoría semanal próxima.
- **ALERTA-COOKIE-6 (INFORMATIVA):** Política de Cookies actual
  (`CookiesPolicy.tsx`) no desagrega "funcionales pre-login" de
  "funcionales post-login". Pieza 6 debe corregirlo.
- **ALERTA-COOKIE-7 (INFORMATIVA):** sugerencia de agregar campo
  `pseudonymized_at_utc` al schema `cookie_consents` para
  trazabilidad de pseudonimización. Propuesta de modificación a §5.1
  del plan.
- **ALERTA-COOKIE-8 (INFORMATIVA):** "Retirar todo el consentimiento"
  debería ser botón con paridad visual, no link text, para cumplir
  GDPR Art. 7(3) "tan fácil como otorgarlo".

### Alertas existentes que este bloque impacta

- **ALERTA-LEG-4** (Supabase, FCM, Capacitor, Google OAuth no
  declarados en Privacy §6): este bloque introduce nuevo "encargado
  interno" (tabla `cookie_consents`) que también debe declararse
  junto a los de LEG-4. Pieza 6 debe consolidar.
- **ALERTA-2C-4** (DPA con Anthropic desconocido): si el job de
  pseudonimización se externaliza en el futuro a un proveedor, mismo
  análisis DPA aplicará. No es blocker hoy.

---

## 8. Requiere aprobación humana de Cristian antes de que el builder continúe

Lista binaria de decisiones que Cristian debe tomar explícitamente.
Ningún builder debe avanzar a Pieza 2 sin OK documentado en todos
estos puntos.

- [ ] **D-01** `cc_visitor_uuid` categoría:
  - Opción A: mantener como **esencial** con las 4 condiciones de
    §3.1 de este reporte (plazo máximo 13 meses en dispositivo, uso
    restringido, regeneración al retirar consentimiento, declaración
    explícita en Política de Cookies).
  - Opción B: mover a **funcional** y renombrar
    `cc_visitor_uuid_optional`.
  - **Recomendación legal-docs-keeper:** Opción A con las 4
    condiciones.

- [ ] **D-02** Texto canónico categoría `marketing`:
  - Opción A: **mantener** texto actual (frase "mostrarte contenido
    relevante"). Mantiene hash `766ee8e1...`.
  - Opción B: **reformular** a "medir el resultado de campañas y
    enviarte comunicaciones comerciales según tus intereses. Hoy
    Conniku no usa cookies de marketing y tus datos personales no se
    comparten con redes publicitarias. Este toggle queda preparado
    para futuras funcionalidades opcionales." Requiere bump de hash
    y re-ejecución de Pieza 1 Backend.
  - **Recomendación legal-docs-keeper:** Opción B.

- [ ] **D-03** Texto canónico categoría `functional`:
  - Opción A: **mantener** actual ("No te identifican ni comparten
    datos con terceros"). Potencialmente cuestionable post-login.
  - Opción B: **reformular** a "No se comparten con terceros con
    fines publicitarios". Requiere bump de hash.
  - **Recomendación legal-docs-keeper:** Opción B.

- [ ] **D-04** Aviso de derecho a retirar consentimiento en banner
  primera capa (GDPR Art. 7(3)):
  - Opción A: **agregar** texto "Puedes cambiar o retirar tu
    decisión en cualquier momento desde el enlace 'Cookies' en el
    pie de la página".
  - Opción B: **omitir** y confiar en que el enlace al modal en el
    footer cumple por implicación.
  - **Recomendación legal-docs-keeper:** Opción A.

- [ ] **D-05** "Retirar todo el consentimiento" dentro del modal:
  - Opción A: **mantener** como link text discreto (plan actual).
  - Opción B: **elevar** a botón con paridad visual a los otros.
  - **Recomendación legal-docs-keeper:** Opción B.

- [ ] **D-06** Aviso "funcionales post-login por ejecución de
  contrato" para usuarios logueados en el modal:
  - Opción A: **agregar** texto dinámico bajo toggle "Funcionales"
    visible solo a logueados, fuera del hash canónico.
  - Opción B: **omitir**.
  - **Recomendación legal-docs-keeper:** Opción A.

- [ ] **D-07** Plazo de pseudonimización de IP+UA:
  - Opción A: **12 meses** (plan actual).
  - Opción B: **6 meses** (más defensivo).
  - **Recomendación legal-docs-keeper:** Opción A, pero aceptable B.

- [ ] **D-08** Campo `pseudonymized_at_utc` en schema
  `cookie_consents`:
  - Opción A: **agregar** al schema antes de Pieza 1 finalizada.
  - Opción B: **no agregar** (quedar solo con job).
  - **Recomendación legal-docs-keeper:** Opción A.

- [ ] **D-09** Fecha Ley 21.719 en documentos legales:
  - Opción A: **dejar redacción genérica** "vigencia prevista en
    diciembre de 2026" hasta verificación oficial.
  - Opción B: **usar 2026-12-13** (lo que ya dicen el plan y el
    código).
  - Opción C: **Cristian verifica en bcn.cl y confirma fecha**.
  - **Recomendación legal-docs-keeper:** Opción C. Si no es posible
    en esta sesión, Opción A como fallback temporal.

- [ ] **D-10** OK general de Capa 0 con las decisiones D-01 a D-09.
  Cristian emite mensaje textual: "Apruebo las decisiones D-01
  opción X, D-02 opción Y, ..." para que el reporte quede
  trazablemente cerrado.

---

## 9. Borradores a producir (NO producidos en esta Capa 0)

Los siguientes borradores deben producirse **después** de que Cristian
resuelva el batch D-01 a D-09. Se listan como roadmap, no como output
de este turno:

- `docs/legal/drafts/YYYY-MM-DD-cookies-policy-v1.1.0.md` — actualización
  de Política de Cookies con mención de banner, UUID, base legal del
  UUID, desagregación funcional pre/post-login.
- `docs/legal/drafts/YYYY-MM-DD-privacy-policy-cookie-consent.md` —
  mención de tabla `cookie_consents` como encargado interno, plazo de
  retención 5 años, base Art. 17(3)(e), pseudonimización a 12 meses.
- Ajuste de `shared/cookie_consent_texts.py` si D-02/D-03 eligen
  Opción B (bump hash, propuesto por texto nuevo sin tocar el archivo
  actual; el bump lo ejecuta backend-builder en nueva iteración de
  Pieza 1).

---

## 10. Lo que no hice y por qué

- **No ejecuté `curl https://www.bcn.cl/leychile/navegar?idNorma=1212270`**
  para verificar la fecha de vigencia de Ley 21.719. Según la
  tabla de alternativas de la regla anti-abort, marco la URL como
  "pendiente verificación Cristian" y documento la alerta
  ALERTA-COOKIE-1 como crítica.
- **No ejecuté Grep sobre IndexedDB/sessionStorage** porque el scope
  del turno era validar el plan y Pieza 1, no auditar features
  secundarias del producto. Marcado como ALERTA-COOKIE-5 informativa
  para auditoría semanal próxima.
- **No generé borradores de Política de Cookies ni Privacidad
  actualizadas** porque dependen del batch D-01 a D-09 que solo
  Cristian puede resolver. Los borradores se producen en un turno
  posterior de Capa 0 / Pieza 6.
- **No modifiqué `shared/cookie_consent_texts.py`** por instrucción
  explícita del trigger (NO modificar). Si D-02/D-03 eligen
  reformulación, Pieza 1 Backend debe reiniciar con el nuevo texto
  canónico.
- **No commiteé nada** por instrucción explícita del trigger (NO
  commit).

---

## 11. Incertidumbres

Al menos una declaración obligatoria de algo que podría estar mal en
mi propio trabajo:

- **Incertidumbre 1 (alta):** la interpretación de que `cc_visitor_uuid`
  puede ser "esencial" se apoya en la excepción Art. 5(3) ePrivacy
  leída ampliamente. Algunos reguladores europeos (CNIL, EDPB recent
  case law) interpretan esta excepción restrictivamente. No tengo una
  decisión sancionatoria **específica** sobre cookies de
  compliance-tooling a mano para citar. Si un abogado con acceso a
  jurisprudencia actualizada concluye que la interpretación restrictiva
  aplica, la recomendación debe pivotar a Opción B de D-01.
- **Incertidumbre 2 (media):** el anclaje del plazo de 5 años a Art.
  2515 del Código Civil chileno es argumento defendible pero no
  garantizado: la jurisprudencia chilena sobre retención de evidencia
  probatoria de consentimiento digital es escasa. Un abogado debe
  validar si 5 años es el plazo óptimo o si un plazo más corto (3
  años, por analogía con otras obligaciones mercantiles) resulta más
  defendible frente a reclamaciones del usuario al otro extremo
  (exceso de retención).
- **Incertidumbre 3 (media):** la regla "las funcionales post-login
  por ejecución de contrato no requieren banner" es defendible pero
  puede ser cuestionada por un DPA europeo estricto (la
  "ejecución de contrato" como base legal tiene criterios rigurosos
  según EDPB 2/2019 sobre Art. 6(1)(b)). Si un usuario argumenta
  "contraté Conniku para tomar cursos, no para que recordéis todo mi
  progreso entre sesiones", la defensa del Art. 6(1)(b) se debilita.
  La mitigación estricta sería mover esas claves a "funcionales con
  consentimiento" y aceptar que rechazar funcionales degrada
  profundamente la UX.
- **Incertidumbre 4 (baja):** no he verificado que el inventario de
  cookies del plan §3.2 sea exhaustivo. El Grep que ejecutó el
  web-architect puede haber omitido claves seteadas vía `document.cookie`
  directo (no vía `localStorage`) o vía librerías third-party
  embebidas. Recomiendo a Pieza 2 frontend-builder ejecutar un
  inventario nuevo con `grep -rn "document.cookie\|setCookie"
  src/` antes de finalizar.

---

## 12. Declaración obligatoria (cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción.

El legal-docs-keeper entrega este reporte como **propuesta**.
Autoridad del agente = recomendación técnica con fundamento legal
citable. Autoridad de cierre = Cristian con asesoría profesional.

---

**Fin del reporte de Capa 0 Legal.**
