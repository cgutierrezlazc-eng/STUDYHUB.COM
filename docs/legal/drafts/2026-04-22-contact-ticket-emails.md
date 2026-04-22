# Borrador — Email templates y esquema legal · bloque-contact-tickets-v1

- **Fecha**: 2026-04-22
- **Autor**: legal-docs-keeper (Tori)
- **Bloque**: `bloque-contact-tickets-v1`
- **Capa**: 0 (legal, previa al backend-builder)
- **Estado**: borrador para revisión Cristian + abogado antes del builder.

---

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## 1. Alcance de este borrador

Cubre cuatro entregables:

1. Tres templates de email (`usuario-confirmacion`, `equipo-interno`,
   `respuesta-ceo`) validados contra Ley 19.496 Art. 12 letra b y
   GDPR Art. 12.
2. Esquema del consent storage a persistir en `contact_tickets`
   (snapshot de Privacy + datos de auditoría).
3. Justificación legal de la retención de 5 años (Art. 17(3)(e) GDPR +
   Art. 2515 CC Chile + coherencia con `cookie_consents` y
   `document_views`).
4. Base legal de `cc_visitor_uuid` y `session_token` si el form los
   captura (Art. 6(1)(f) GDPR + Art. 4 Ley 19.628).

No incluye: texto del checkbox del form (ya aprobado en
`contacto.html:267`, no se toca) ni borrador de Política de Privacidad
v2.4.1 (se entrega aparte si Cristian confirma bump; este borrador
solo señala el gap en §6).

---

## 2. Constantes legales de referencia (verificadas)

Valores tomados de `backend/constants/legal_versions.py` (leídos
2026-04-22 en rama `bloque-contact-tickets-v1`):

- `PRIVACY_DOCUMENT_TYPE = "privacy"`
- `PRIVACY_VERSION = "2.4.0"`
- `PRIVACY_HASH = "7a8ba81d0be22cc1deee7d92764baaac1a598a662b84d9ba90043b2a25f63f6c"`

Estos son los valores que el backend-builder debe snapshot-ear en cada
ticket al momento de creación. Si `PRIVACY_VERSION` o `PRIVACY_HASH`
cambian (bump MINOR/MAJOR por publicación de nuevo canónico),
el backend debe leer los nuevos al vuelo desde el módulo; NO hardcodear
en el router.

---

## 3. Templates de email

### 3.1 Principios comunes (aplican a los 3 templates)

- **Idioma**: español chileno neutral, tuteo. Sin modismos regionales
  cerrados.
- **Prohibición CLAUDE.md**: ningún template menciona "IA", "AI" o
  "inteligencia artificial".
- **Prohibición propia del legal-docs-keeper**: ningún template afirma
  cumplimiento legal al usuario ("garantizamos GDPR", "cumplimos Ley
  X"). Los templates son **informativos**, no declarativos de
  compliance.
- **Sin rutas internas del repo** en textos públicos (lección cookies
  PR #25: no citar `docs/legal/v3.2/privacy.md`; sí citar
  `conniku.com/privacidad`).
- **Firma**: "Equipo Conniku" (no "Tori", no nombres individuales, no
  "el sistema automático").
- **Reply-To**: siempre configurado para que el hilo quede asociado al
  buzón correcto sin exponer infraestructura interna.
- **Tiempos de respuesta**: se usa el `sla_hours` que viene del dict
  `CONTACT_ROUTES` (constante del bloque). El texto menciona el SLA
  **declarado en el landing** (`contacto.html:288-294`), no inventa
  ninguno nuevo. Si el backend-builder cambia un SLA, actualiza la
  constante; el template lee de ahí. La frase prohibida es "te
  respondemos en X horas" cuando X no matchea la constante.

### 3.2 Template A — Email al usuario (confirmación de ticket creado)

- **De**: `Conniku <noreply@conniku.com>` (cuenta real, pass
  `SMTP_PASS_NOREPLY`).
- **Reply-To**: `contacto@conniku.com` (para que si el usuario
  responde, caiga al buzón operativo del equipo — no al `noreply`
  que no recibe).
- **Asunto**: `Conniku — Tu mensaje quedó registrado ({ticket_number})`
- **Formato**: HTML vía helper `_email_template` existente
  (`backend/notifications.py:193`) + texto plano alternativo.

#### 3.2.1 Cuerpo HTML (render con `_email_template`)

```
Hola {name},

Recibimos tu mensaje. Tu ticket quedó registrado con el número {ticket_number}.

┌─────────────────────────────────────────────────────────┐
│  Motivo: {reason_label}                                 │
│  Tiempo de respuesta declarado: {sla_human}             │
└─────────────────────────────────────────────────────────┘

Si necesitas agregar información o corregir algo, **responde a este
correo mencionando el número de ticket {ticket_number} en el asunto o
al inicio del mensaje**. Tu respuesta quedará asociada al ticket.

Mientras esperas, puedes revisar nuestra Política de Privacidad en
https://conniku.com/privacidad — allí explicamos cómo tratamos los
datos que nos compartiste en este formulario.

— Equipo Conniku
```

#### 3.2.2 Mapeo de variables

| Variable          | Valor                                                                                                              |
|-------------------|--------------------------------------------------------------------------------------------------------------------|
| `{name}`          | `ticket.name` (string 120, validado Pydantic)                                                                      |
| `{ticket_number}` | `ticket.ticket_number` formato `CNT-{YYYY}-{NNNNNN}` (D-T3)                                                        |
| `{reason_label}`  | `CONTACT_ROUTES[reason]["label"]` (ej: "consulta comercial")                                                       |
| `{sla_human}`     | Texto humano derivado de `sla_hours` (ver tabla 3.2.3)                                                             |

#### 3.2.3 Traducción `sla_hours` → `sla_human`

El landing publica SLAs en formato humano (`contacto.html:288-294`).
El template los reproduce literalmente para evitar promesas no
respaldadas:

| `reason`       | `sla_hours` | `sla_human` (frase exacta reutilizada del landing)      |
|----------------|-------------|---------------------------------------------------------|
| `comercial`    | 48          | "menos de 2 días hábiles"                               |
| `universidad`  | 72          | "menos de 3 días hábiles"                               |
| `prensa`       | 120         | "menos de 5 días hábiles"                               |
| `legal`        | 720         | "menos de 30 días calendario"                           |
| `seguridad`    | 48          | "menos de 48 horas"                                     |
| `otro`         | 72          | "menos de 3 días hábiles"                               |

**Bloqueante ALERTA-TICKET-1 (§5)**: si el valor real SLA operativo
del equipo difiere de lo declarado, se corrige la constante + landing
en un commit dedicado **antes** del merge. No se publican tickets con
SLA inalcanzable en producción.

#### 3.2.4 Validación Ley 19.496 Art. 12 letra b + GDPR Art. 12

- **Información veraz y oportuna** (Ley 19.496 Art. 12 b):
  - Se confirma recepción con número verificable (no "te escribiremos
    pronto").
  - Se declara SLA alineado con lo publicado en landing.
- **Lenguaje claro y sencillo** (GDPR Art. 12):
  - Frases cortas, sin jerga jurídica, sin abreviaturas técnicas.
  - Link a Privacy en URL pública (no en ruta del repo).
  - Instrucción explícita de cómo responder al hilo.
- Verificación 2026-04-22 (Tori, legal-docs-keeper).
- Fuentes:
  - https://www.bcn.cl/leychile/navegar?idNorma=61438 (Ley 19.496)
  - https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
    (GDPR)

### 3.3 Template B — Email al equipo interno (ruteo según motivo)

- **De**: `Conniku Contacto <contacto@conniku.com>` (cuenta real,
  pass `SMTP_PASS_CONTACTO`, self-send para aparecer en inbox del
  buzón compartido que administra Jennifer Ruiz).
- **Reply-To**: `{ticket.email}` (email del usuario — permite que el
  equipo responda directo desde su cliente de correo).
- **Asunto**: `[Conniku Contacto · {reason_label}] {ticket_number} · {name}`
- **Formato**: texto plano estructurado (machine-readable para triage
  rápido; no HTML porque este email no va al usuario, va al inbox
  operativo interno).

#### 3.3.1 Cuerpo texto plano

```
Ticket:    {ticket_number}
Motivo:    {reason} — {reason_label}
SLA:       {sla_hours}h ({sla_human})
Estado:    {status}
Creado:    {created_at_utc} UTC

De:        {name} <{email}>
Organización: {org_or_dash}

Auditoría legal:
  IP:                 {client_ip_or_dash}
  User-Agent:         {user_agent_first_160_chars}
  Timezone usuario:   {user_timezone_or_dash}
  Consent Privacy:    v{consent_version} hash {consent_hash_first_12}…
  Aceptado (UTC):     {consent_accepted_at_utc}
  Retención legal:    hasta {retained_until_utc} UTC

--- Mensaje ---
{message}
--- Fin mensaje ---

--- Responder ---
Responde este correo con reply normal — el cliente recibirá tu
respuesta (ReplyTo apunta a {email}). Por ahora el reply manual no
crea auto-outbound en el ticket: usa
POST /api/admin/contact-tickets/{id}/reply desde el dashboard CEO
(cuando esté disponible) para que la respuesta quede registrada como
outbound en el hilo del ticket.

--- Admin ---
Vista admin: https://conniku.com/admin/contact-tickets/{ticket_number}
  (placeholder — dashboard CEO será Bloque 4, por ahora el link no
   resuelve a UI; usa curl para consumir el endpoint GET admin)
```

#### 3.3.2 Mapeo de variables internas

| Variable                       | Fuente                                                               |
|--------------------------------|----------------------------------------------------------------------|
| `{client_ip_or_dash}`          | `ticket.client_ip` (del header `X-Forwarded-For`, no del payload)    |
| `{user_agent_first_160_chars}` | `ticket.user_agent[:160] + "…"` si len > 160                         |
| `{user_timezone_or_dash}`      | `ticket.user_timezone` o "—"                                         |
| `{consent_hash_first_12}`      | `ticket.consent_hash[:12]`                                           |
| `{consent_accepted_at_utc}`    | ISO 8601 UTC                                                         |
| `{retained_until_utc}`         | `ticket.retained_until_utc` ISO 8601 UTC                             |
| `{org_or_dash}`                | `ticket.org` o "—"                                                   |

#### 3.3.3 Validación

- **Lenguaje interno, no público**: este email no es visible al usuario
  final; no aplica GDPR Art. 12 "claridad para el interesado". Sí
  aplica principio de minimización GDPR Art. 5(1)(c): el equipo ve solo
  los datos necesarios para el triage. IP completa se muestra
  (necesaria para detectar abuso); UA se trunca a 160 chars para
  legibilidad sin perder evidencia (la fila en BD conserva el UA
  truncado a 512).
- **Sin rutas del repo** en el body: el link admin apunta a
  `conniku.com/admin/contact-tickets/{ticket_number}` (aún no existe,
  es placeholder para Bloque 4). No hay menciones a
  `src/pages/admin/...` ni similares.
- **Verificación 2026-04-22 (Tori)**.

### 3.4 Template C — Email respuesta del equipo al usuario

- **De**: `Conniku <noreply@conniku.com>` (cuenta real, pass
  `SMTP_PASS_NOREPLY`).
- **Reply-To**: `contacto@conniku.com`.
- **Asunto**: `Re: Conniku — {ticket_number} · respuesta del equipo`
- **Trigger**: admin llama `POST /api/admin/contact-tickets/{id}/reply`
  con body `{message}`. Endpoint crea fila `contact_ticket_messages`
  con `direction='outbound'` y dispara este email.
- **Formato**: HTML vía `_email_template` + plain-text fallback.

#### 3.4.1 Cuerpo HTML

```
Hola {name},

Tenemos una respuesta a tu ticket {ticket_number}.

─────────────────────────────────────────────────────────

{reply_body}

─────────────────────────────────────────────────────────

Si tu consulta quedó resuelta, puedes responder con "cerrar ticket"
para marcarla como resuelta.

Si necesitas seguir conversando, responde a este correo mencionando
el número {ticket_number}. Tu respuesta quedará asociada al ticket.

Motivo original: {reason_label}

— Equipo Conniku
```

#### 3.4.2 Mapeo de variables

| Variable          | Valor                                                                                            |
|-------------------|--------------------------------------------------------------------------------------------------|
| `{name}`          | `ticket.name`                                                                                    |
| `{ticket_number}` | `ticket.ticket_number`                                                                           |
| `{reply_body}`    | Texto del admin desde el payload `POST reply` (ya sanitizado en backend contra HTML injection)   |
| `{reason_label}`  | `CONTACT_ROUTES[ticket.reason]["label"]`                                                         |

#### 3.4.3 Observaciones

- La instrucción **"responde con 'cerrar ticket'"** es opcional: si
  Cristian NO quiere procesamiento de keywords (ver Bloque 4 "sin
  auto-respuesta según keywords" del plan §7), el texto se ajusta a
  "puedes responder para seguir conversando; cuando se resuelva el
  equipo lo cerrará desde el dashboard". Recomendación del
  legal-docs-keeper: **omitir la keyword "cerrar ticket"** en v1 —
  obliga a expectativa de automatización que no existe aún. Ajuste
  propuesto para el template final (opción B):

  ```
  Si tu consulta quedó resuelta, avísanos respondiendo a este correo.
  Si necesitas seguir conversando, también responde aquí — tu mensaje
  queda asociado al ticket {ticket_number}.
  ```

  El backend-builder elige A (con keyword) o B (sin keyword); el
  legal-docs-keeper recomienda B.

- **Placeholder "link cerrar ticket"** del pedido original no se
  incluye. Razón: sin backend de self-service cierre por URL pública
  firmada (que implicaría token nuevo, nuevo endpoint, otro vector
  de auth), sería un link al vacío. Se propone diferir a Bloque 4c
  (self-service con token firmado). En v1 el cierre se hace solo
  desde admin o por keyword si se elige opción A.

- **Validación Art. 12(1) GDPR + Art. 12 letra b Ley 19.496**:
  lenguaje claro, respuesta verificable (el usuario puede auditar su
  ticket respondiendo con el número). Verificación 2026-04-22 (Tori).

---

## 4. Consent storage en `contact_tickets`

### 4.1 Columnas legales obligatorias

Respetan el plan §D-T1 (alternativa B schema completo legal-grade) y
el patrón de `cookie_consents` + `document_views`:

```
consent_version          String(20)  NOT NULL   — snapshot de PRIVACY_VERSION
consent_hash             String(64)  NOT NULL   — snapshot de PRIVACY_HASH
consent_accepted_at_utc  DateTime    NOT NULL   — server time UTC (no cliente)
client_ip                String(64)  NULL       — header X-Forwarded-For real
user_agent               Text        NULL       — truncado a 512 chars (GDPR 5(1)(c))
user_timezone            String(64)  NULL       — informativo
```

### 4.2 Docstring obligatorio para el modelo SQLAlchemy

El backend-builder debe incluir este comentario literal al pie del
modelo `ContactTicket` en `database.py`:

```python
# Base legal del tratamiento:
#   - Datos de contacto (name, email, org, message): GDPR Art. 6(1)(a)
#     consentimiento explícito del titular marcado en el checkbox del form.
#     Referencia Ley 19.628 Art. 4° (Chile): información al titular al
#     momento de recolectar.
#   - IP, User-Agent, timezone: GDPR Art. 6(1)(f) interés legítimo del
#     responsable del tratamiento (prevención de abuso + evidencia
#     probatoria ante reclamos Art. 7(1) GDPR). Balance test favorable:
#     IP se pseudonimiza a 12 meses, UA se trunca a 512, retención
#     total 5 años.
#   - Demostrabilidad (GDPR Art. 7(1) + Orange Romania C-61/19):
#     consent_version + consent_hash + consent_accepted_at_utc forman el
#     set probatorio de qué texto de Privacy vigente consintió el usuario.
#
# Fuentes verificadas:
#   - https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
#   - https://www.bcn.cl/leychile/navegar?idNorma=141599 (Ley 19.628)
# Verificación: 2026-04-22, legal-docs-keeper Tori.
```

### 4.3 Reglas operativas para el endpoint público

- **IP real**: leer de `request.headers["X-Forwarded-For"]` primero, fallback
  a `request.client.host`. NUNCA aceptar `client_ip` del payload JSON (spoofing
  trivial). Patrón idéntico a `backend/cookie_consent_routes.py`.
- **Timestamp**: usar `datetime.now(UTC)` del servidor. Ignorar cualquier
  timestamp del payload.
- **Validación de hash**: si `payload.consent_hash != PRIVACY_HASH` actual →
  HTTP 409 con `{"current_version": PRIVACY_VERSION, "current_hash":
  PRIVACY_HASH}`. El frontend debe recargar. Patrón idéntico a
  `cookie_consent_routes.py`.
- **UA truncado a 512 chars**: `ua[:512]` antes de persistir. Patrón
  `document_views`.

---

## 5. Retención 5 años · justificación legal

### 5.1 Campo

```
retained_until_utc  DateTime  NOT NULL  — created_at + 5 años
```

### 5.2 Comentario obligatorio de 4 líneas en el schema

```sql
-- retained_until_utc: created_at + 5 años. Fundamento legal:
--   Art. 17(3)(e) GDPR (conservación para formulación, ejercicio o defensa de reclamaciones).
--   Art. 2515 Código Civil Chile (prescripción ordinaria acciones personales, 5 años).
--   Ley 19.496 Art. 50 (plazos reclamos consumidor SERNAC).
--   Coherencia con cookie_consents.retention_expires_at y document_views.retained_until_utc (5 años).
```

### 5.3 Verificación de premisas (§22)

Verifiqué que la retención de 5 años es el valor operativo consolidado
en el codebase:

- `backend/cookie_consent_routes.py:43` → `_RETENTION_YEARS = 5` con
  cita "GDPR Art. 17(3)(e) — ejercicio de defensa legal" y nota
  "Decisión Cristian batch 2026-04-20: retención 5 años alineado con
  declaración de edad".
- `backend/legal_document_views_routes.py` → tabla `document_views`
  con `retained_until_utc` también 5 años (misma cita Art. 17(3)(e)
  GDPR + Art. 2515 CC).
- Decisión Cristian 2026-04-22 batch: "4-5años" (confirmado por
  Cristian en el trigger de este turno).

**Coherencia interna**: los 3 precedentes de retención legal del
codebase convergen en 5 años. Este bloque NO introduce una retención
nueva; solo replica el patrón. El auditor que quiera medir "edad
promedio de datos personales" opera con un solo plazo.

### 5.4 Fuentes verificables

| Artículo                      | URL                                                                         | Fecha verif. | Verificador  |
|-------------------------------|-----------------------------------------------------------------------------|--------------|--------------|
| GDPR Art. 17(3)(e)            | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679        | 2026-04-22   | Tori         |
| Código Civil Chile Art. 2515  | https://www.bcn.cl/leychile/navegar?idNorma=172986                          | 2026-04-22   | Tori         |
| Ley 19.496 Art. 50            | https://www.bcn.cl/leychile/navegar?idNorma=61438                           | 2026-04-22   | Tori         |
| Ley 19.628 Art. 4°            | https://www.bcn.cl/leychile/navegar?idNorma=141599                          | 2026-04-22   | Tori         |

**Limitación declarada**: las URLs se citan según las rutas canónicas
oficiales conocidas del proyecto (leychile.cl para normas chilenas,
eur-lex.europa.eu para GDPR). No se ejecutó `curl` en este turno para
confirmar que cada URL retorna 200 hoy (las salidas de red a fuentes
legales oficiales están pendientes de verificación por Cristian según
la tabla anti-abort §3 del prompt del keeper). Bloqueo: no bloquea
Capa 0 — es la misma práctica consolidada en borradores previos
(`2026-04-21-labor-chile-py.md`, `2026-04-21-tax-chile-py.md`).

---

## 6. Base legal de `cc_visitor_uuid` y `session_token`

### 6.1 Contexto

El plan §D-T1 del bloque NO lista `cc_visitor_uuid` ni `session_token`
como columnas de `contact_tickets`. El trigger de este turno pregunta
si el form los captura "para vincular ticket con navegación/cookies
previas".

### 6.2 Recomendación legal-docs-keeper

**Recomendación**: NO capturar `cc_visitor_uuid` ni `session_token`
en `contact_tickets` en v1 de este bloque. Razones:

1. **Minimización (GDPR Art. 5(1)(c))**: el form ya tiene evidencia
   probatoria completa con IP + UA + consent_hash + timestamp. Añadir
   UUID de cookies + session token introduce más identificadores sin
   propósito legítimo claro.
2. **Contamina boundaries**: `cc_visitor_uuid` vive en el dominio
   "consentimiento de cookies" (tabla `cookie_consents`). Mezclarlo
   con ticket de contacto cruza responsabilidades — un ticket no es
   evento de navegación.
3. **Overhead de DPA**: si el UUID cruza de la tabla de consent a la
   tabla de tickets, la Política de Privacidad debe declarar ese
   cruce explícitamente como nueva finalidad. Más superficie legal
   por beneficio marginal.

### 6.3 Si Cristian decide capturarlos igual

Si el producto requiere el cruce (ej: "quiero saber si este usuario
que escribió tenía analytics habilitado en el momento del form"), la
base legal aplicable es:

- **`cc_visitor_uuid`**: Art. 6(1)(f) GDPR interés legítimo +
  Art. 4° Ley 19.628 (información al titular). El balance test
  requiere:
  - Finalidad legítima declarada (ej: "triage de abuso", "soporte
    anti-fraude").
  - Minimización: solo el UUID, no los datos de navegación completos.
  - Pseudonimización a 12 meses (mismo plazo que IP).
  - Declaración explícita en Privacy Policy v2.4.1 como nueva
    finalidad de `cc_visitor_uuid`.
- **`session_token`**: mismo Art. 6(1)(f) + Art. 4° Ley 19.628. Valor
  probatorio adicional: permite vincular ticket a sesión que tuvo
  document_views (evidencia de lectura legal). Si se captura, la
  columna debe ser NULL-able (el form público no requiere
  session_token obligatorio).

### 6.4 Schema propuesto si decisión es capturar

Columnas opcionales (NULL-able) a agregar SOLO si Cristian aprueba:

```
cc_visitor_uuid     String(36)  NULL  — UUID v4 del banner de cookies si existe
session_token       String(128) NULL  — token de sesión del viewer legal si existe
```

**Este borrador deja el campo fuera por defecto.** Si Cristian
responde "capturar = sí", se enmienda el schema en iteración posterior
del mismo borrador.

---

## 7. Gap legal detectado: Política de Privacidad debe enumerar este canal

### 7.1 Premisa verificada

- `PRIVACY_VERSION` vigente: **2.4.0** (`legal_versions.py:38`).
- El canal "formulario de contacto con persistencia de ticket" no
  existía al momento de aprobar Privacy v2.4.0 (el endpoint actual
  `POST /email/contact` era fire-and-forget sin persistencia — ver
  plan §1.3).
- GDPR Art. 13 + Ley 19.628 Art. 4° exigen enumerar todos los
  tratamientos al titular.

### 7.2 Acción requerida

Antes del merge del bloque, el legal-docs-keeper debe generar
borrador `docs/legal/drafts/2026-04-22-privacy-v2.4.1-contact-channel.md`
con sección nueva "Canal de Contacto (formulario público)" que
enumere:

- Datos recolectados (nombre, email, motivo, org opt, mensaje, IP,
  UA, timezone, consent hash).
- Finalidad específica: "responder la consulta enviada por ese
  formulario y dejar trazabilidad del hilo".
- Base legal: Art. 6(1)(a) consentimiento + Art. 6(1)(f) interés
  legítimo (IP/UA prevención abuso).
- Destinatarios internos: buzón `contacto@conniku.com` (administrado
  por asistente del CEO — Jennifer Ruiz según
  `reference_email_accounts.md`) + alias `prensa@`, `legal@`,
  `dpo@`, `seguridad@`, `soporte@` todos apuntando al mismo buzón
  real.
- Retención: 5 años post-resolución.
- Pseudonimización de IP/UA: 12 meses.
- Derechos del titular (ARCO/habeas data): ejercitables vía
  `dpo@conniku.com`.

**Decisión bump**: MINOR (2.4.0 → 2.4.1) — nuevo canal es cambio
sustantivo pero no modifica derechos u obligaciones del usuario. No
fuerza re-aceptación para usuarios registrados (notificación
informativa). Recomendación de legal-docs-keeper. Cristian decide
final.

**Scope**: ESTE BORRADOR NO incluye el texto de Privacy v2.4.1. Es
un gap señalado. Borrador separado si Cristian aprueba bump.

---

## 8. Checklist de validación previa al builder

El backend-builder solo inicia Capa 1 cuando todos estos checks
están en verde:

- [ ] Cristian aprueba los 3 templates A, B, C (§3).
- [ ] Cristian elige opción A o B para el template C §3.4.3
      (recomendación keeper: B).
- [ ] Cristian decide sobre §6 (capturar o no `cc_visitor_uuid` y
      `session_token`).
- [ ] Cristian decide sobre §7 (bump MINOR Privacy v2.4.1 antes o
      durante el bloque).
- [ ] Buzones Zoho verificados: `noreply@`, `contacto@` activos con
      `SMTP_PASS_NOREPLY` y `SMTP_PASS_CONTACTO` en Render
      (según `reference_email_accounts.md` los 3 buzones reales están
      provisionados — ver §9 alerta inversa sobre alias).
- [ ] Constantes legales sin cambios: si `PRIVACY_VERSION` o
      `PRIVACY_HASH` cambian entre hoy y el merge, re-ejecutar §4.3
      validación de hash.

---

## 9. Observación sobre memoria de alias (corrige plan §1.4)

El plan del web-architect §1.4 afirma que `prensa@`, `legal@`,
`seguridad@` "no están provisionados en Zoho". **Esta afirmación es
incorrecta** según `reference_email_accounts.md` (memoria persistente,
verificada 2026-04-22): los alias SÍ existen como alias gratuitos
del buzón `contacto@conniku.com`. Todos reciben al mismo inbox
físico.

**Implicación para el bloque**:
- El dict `CONTACT_ROUTES` puede, opcionalmente, usar el alias
  específico en `email` (ej: `"prensa": {"email": "prensa@conniku.com",
  ...}`) en vez de `contacto@conniku.com`. El `From` del email seguirá
  siendo `contacto@conniku.com` (el único con credenciales SMTP), pero
  el `To` puede ser el alias para que el equipo filtre por alias en
  Jennifer-inbox.
- **Recomendación del keeper**: en v1 del bloque usar alias específicos
  como `To` del email interno (Template B). Ventaja operativa: Jennifer
  aplica filtros Zoho por dirección destino y triage queda prolijo.
  Sin overhead legal (todos los alias están declarados en
  `reference_email_accounts.md`, el destinatario final es el mismo
  buzón real).
- Esto **corrige** la alerta propuesta en plan §3.2 sobre "buzones no
  provisionados". Se reemplaza por ALERTA-TICKET-3 ajustada (ver §10).

---

## 10. Alertas nuevas a agregar a `docs/legal/alerts.md`

Ver detalle en el archivo `alerts.md` actualizado. Resumen:

- **ALERTA-TICKET-1 (MODERADA)**: SLAs declarados en email al usuario
  deben matchear operación real del equipo.
- **ALERTA-TICKET-2 (INFORMATIVA)**: honeypot `website` no debe
  capturar datos personales del usuario legítimo.
- **ALERTA-TICKET-3 (INFORMATIVA)**: alias Zoho verificados; corrige
  afirmación del plan §1.4.

---

## 11. Incertidumbres declaradas (§obligación del reporte)

1. **Plazo de respuesta "seguridad" en SLA vs realidad operacional**:
   el landing declara 48h para `seguridad` pero Conniku aún no tiene
   protocolo de respuesta a incidentes formalizado (ver
   `docs/legal/alerts.md::ALERTA-LEG-*` preexistentes). Si un
   reporte de vulnerabilidad entra hoy, el SLA declarado puede no
   cumplirse. ALERTA-TICKET-1 captura esto pero depende de decisión
   operativa de Cristian.
2. **Texto del checkbox "acepto Política de Privacidad" en el form**
   (`contacto.html:267`): está aprobado pero no verifiqué el hash del
   archivo Privacy que linkea para confirmar que apunta a v2.4.0 y
   no a una versión stale. Es responsabilidad del builder del
   frontend landing comprobar que el link `href="./privacidad.html"`
   rendereiza v2.4.0. Si no, abrir alerta al merge.
3. **Fecha de vigencia Ley 21.719**: no aplica directamente a este
   bloque (el canal nuevo empieza hoy bajo régimen 19.628 + GDPR),
   pero si un ticket ingresa después del 2026-12-01 (vigencia 21.719)
   el DPO pseudonimización/retención debe revalidarse. Delegado al
   auditor semanal.
4. **curl de URLs legales**: no ejecuté en este turno (anti-abort §3).
   Las URLs citadas se mantienen como "pendiente verificación
   Cristian" en el sentido de la tabla del prompt.
5. **Posible colisión con Bloque 4 CEO dashboard**: este bloque
   persiste tickets con schema completo, pero el endpoint admin para
   responder (Template C trigger) va a ejercitarse solo por curl
   hasta que el dashboard React exista. Riesgo: si Cristian responde
   un ticket desde su cliente Zoho normal (reply al email interno
   Template B), esa respuesta NO queda registrada como `outbound` en
   `contact_ticket_messages`. Queda solo en Zoho. Hasta tener IMAP
   threading (Bloque 4c), el historial en BD estará incompleto. Esto
   no es gap legal per se (el ticket existe, la respuesta física
   existe), pero sí es deuda de evidencia probatoria bidireccional.

---

## 12. Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
