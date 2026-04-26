# Plan · bloque-contact-tickets-v1

**Fecha**: 2026-04-22
**Autor**: web-architect (Tori)
**Rama prevista**: `bloque-contact-tickets-v1`
**PR destino**: `main`
**Estado**: borrador — pendiente de aprobación de Cristian + batch de decisiones D-T1…D-T8.

---

## 1. Contexto

### 1.1 Pedido literal de Cristian (2026-04-22)

> "un formulario tambien y ue el mensaje valla a contacto conniku para crear y seguir tiket"

### 1.2 Política reforzada para este bloque

Cristian reforzó para toda la sesión: **"una sola vez y bien. nada para despues"**. Esto significa:

- No se difiere ticket numbering a iteración posterior.
- No se difiere retención legal.
- No se difiere rate-limit ni CORS para `file://`.
- No se cierra el bloque con "funciona pero sin responder desde CEO".
- Si algo no puede quedar bien dentro del bloque, se declara fuera de scope explícitamente (§7 de este plan) y se abre issue.

### 1.3 Precedentes del codebase

Existen dos precedentes directos que este bloque reutiliza como patrón:

**Patrón `cookie_consents`** (`backend/cookie_consent_routes.py` + tabla en `database.py:1885`):
- Endpoint público `POST /api/consent/cookies` sin JWT.
- IP real tomada del header `X-Forwarded-For` (no del payload).
- Hash de política validado contra canónico vigente (409 si obsoleto).
- Retención 5 años con campo `retention_expires_at` + pseudonimización a 12 meses.
- Migración idempotente en `backend/migrations/add_cookie_consents_table.sql`.

**Patrón `document_views`** (`backend/legal_document_views_routes.py` + tabla en `database.py:1962`):
- Endpoint con rate-limit declarado (300 POST/hora/IP en docstring) — NOTA: no está implementado con slowapi, es target declarativo.
- UA truncado a 512 chars (GDPR Art. 5(1)(c)).
- `retained_until_utc` por fila, `pseudonymized_at_utc` null hasta job.

**Precedente operativo directo `POST /email/contact`** (`backend/notifications.py:726`):
- **Ya existe un endpoint público** que envía el formulario de contacto vía SMTP Zoho a `contacto@conniku.com`.
- Fire-and-forget: envía email pero **no crea ticket, no persiste en BD, no devuelve número, no permite seguimiento, no es bidireccional**.
- Este bloque lo **supersede** (no lo elimina aún — se deja por compat; se marca deprecated en §4 y se remueve en bloque-contact-tickets-cleanup-v2 post-migración landing→React).

### 1.4 Stack SMTP disponible (verificado)

`backend/notifications.py` ya expone helper `_send_email_async(to, subject, html, reply_to, email_type, from_account)` con tres cuentas Zoho autenticadas independientemente:

- `noreply@conniku.com` (pass `SMTP_PASS_NOREPLY`) — notificaciones automáticas al usuario.
- `contacto@conniku.com` (pass `SMTP_PASS_CONTACTO`) — inbound genérico / soporte.
- `ceo@conniku.com` (pass `SMTP_PASS_CEO`) — broadcasts y reportes.

**Nota actualizada 2026-04-25**: `prensa@conniku.com`, `legal@conniku.com` y `seguridad@conniku.com` **sí están provisionadas** como aliases en Zoho que entregan en `contacto@conniku.com`. El hallazgo crítico original ya no aplica — el delivery funciona. Ver inventario completo de cuentas y aliases en CLAUDE.md (sección Email transaccional).

### 1.5 Form actual en landing (verificado en `contacto.html`)

- Form HTML en `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/contacto.html` líneas 221-280.
- Submit actual (líneas 439-488): construye `mailto:` y abre cliente de correo del usuario.
- **No llega a backend**. El comentario en línea 487 dice que es placeholder para cuando haya backend.
- Campos: `f-name`, `f-email`, `f-reason` (select con 6 motivos), `f-org` (opcional), `f-message` (20-2000 chars), `f-consent` (checkbox obligatorio con link a Privacy).

### 1.6 Acuerdos previos en memoria

- **Tickets bidireccionales (B)**: el CEO puede responder desde admin y la respuesta sale por email al usuario + cambia estado a `replied`.
- **Stack Supabase (A)**: persistencia en tabla de Postgres vía SQLAlchemy, igual que `cookie_consents` / `document_views`.
- **Dashboard CEO con semáforos**: semáforo por SLA declarado en landing (verde/ámbar/rojo según horas desde creación vs SLA del motivo). Diferido a Bloque 4 CEO dashboard (ver §7) — en este bloque solo endpoints REST que el dashboard consumirá luego.

### 1.7 Componente legal activo

Este bloque toca varios vectores legales (ver §8 completa):
- Recolección de datos personales (nombre, email, mensaje, IP, UA) → GDPR + Ley 19.628.
- Consent específico para "responder a esta consulta" → GDPR Art. 6(1)(a) + Art. 7 demostrabilidad.
- Retención post-resolución → GDPR Art. 5(1)(e) + Art. 17(3)(e).
- Potencial tratamiento de "reporte de seguridad" → vector de vulnerabilidades (dato sensible de integridad del sistema).
- Comunicación al usuario sobre ticket → debe enumerarse en Política de Privacidad como finalidad.

**Capa 0 `legal-docs-keeper` OBLIGATORIA antes de Capa 1.**

---

## 2. Decisiones arquitectónicas (8 decisiones · batch §21)

Cada decisión abajo tiene: problema, alternativas con pros/contras, recomendación de Tori, y letra para que Cristian responda en batch (ver §9).

---

### D-T1 · Schema de `contact_tickets` — columnas

**Problema**: qué campos persistir para cubrir creación, routing, bidireccionalidad, evidencia legal y dashboard CEO sin sobre-diseñar.

**Alternativas**:

- **A) Schema mínimo** (id, ticket_number, name, email, reason, org, message, status, created_at, updated_at). Pros: simple. Contras: no cubre consent legal, no permite respuesta bidireccional, no retención computable.
- **B) Schema completo legal-grade** (como A + IP, UA truncado, consent_version, consent_hash, consent_accepted_at_utc, retained_until_utc, pseudonymized_at_utc, last_channel, assignee, resolved_at_utc, resolution_note, tabla separada `contact_ticket_messages` para threading CEO↔usuario). Pros: cubre todo de una vez, no hay "parches después". Contras: más superficie de test.
- **C) Schema medio** (A + IP/UA/consent + campos de estado, pero sin tabla separada de mensajes — respuestas CEO van a un `resolution_note` texto libre, sin historial). Pros: balance. Contras: bidireccional queda pobre (solo 1 respuesta, no hilo).

**Recomendación Tori**: **B**. La política "una sola vez y bien" descarta C porque el dashboard CEO con semáforos sí necesita historial (ver ítems abiertos, SLA acumulado, múltiples idas y vueltas). Y B es exactamente lo que ya existe para `cookie_consents` y `document_views` — mismo paradigma legal.

Columnas propuestas para `contact_tickets`:

```
id                      Integer PK autoincrement
ticket_number           String(16) unique indexed     — "CNT-2026-0001"
name                    String(120)
email                   String(255) indexed
reason                  String(20) indexed             — "comercial"|"universidad"|"prensa"|"legal"|"seguridad"|"otro"
org                     String(120) nullable
message                 Text
status                  String(20) indexed             — "open"|"in_progress"|"replied"|"resolved"|"spam"
assignee_user_id        String(16) nullable FK users.id ondelete SET NULL
client_ip               String(64) nullable
user_agent              Text nullable (truncado 512)
user_timezone           String(64) nullable
consent_version         String(20) not null            — snapshot de PRIVACY_VERSION
consent_hash            String(64) not null            — snapshot de PRIVACY_HASH
consent_accepted_at_utc DateTime not null
routed_to_email         String(120)                    — email destino interno (contacto@/ceo@)
routed_label            String(40)                     — "consulta comercial" etc.
sla_hours               Integer                        — snapshot del SLA del motivo
created_at              DateTime default utcnow indexed
updated_at              DateTime
first_response_at_utc   DateTime nullable              — para métrica SLA
resolved_at_utc         DateTime nullable
retained_until_utc      DateTime not null              — created_at + retención
pseudonymized_at_utc    DateTime nullable              — job 12 meses
resolution_note         Text nullable
```

Tabla auxiliar `contact_ticket_messages`:

```
id                 Integer PK autoincrement
ticket_id          Integer FK contact_tickets.id ondelete CASCADE
direction          String(10)     — "inbound"|"outbound"
author_user_id     String(16) nullable FK users.id     — null si es del usuario anónimo
author_email       String(255)                          — email del autor (espejo)
body               Text
created_at         DateTime default utcnow indexed
email_message_id   String(255) nullable                — Message-ID del SMTP (trazabilidad)
```

El mensaje inicial del usuario se persiste tanto en `contact_tickets.message` (snapshot) como en primera fila `contact_ticket_messages` con `direction='inbound'`. Respuestas del CEO crean filas con `direction='outbound'` y disparan `_send_email_async`.

---

### D-T2 · Routing por motivo — hardcoded Python vs config externo

**Problema**: cómo mapear motivo → email destino interno, considerando que las direcciones `prensa@`, `legal@`, `seguridad@` **no existen** en Zoho todavía.

**Alternativas**:

- **A) Dict hardcoded en `backend/constants/contact_routing.py`**, con fuente de verdad única, usado por backend y espejado en `shared/contact_ticket_types.ts`. Todas las rutas apuntan a `contacto@conniku.com` hoy (único buzón real), con campo `label` diferenciador y `sla_hours` por motivo. Cambiar destinos cuando se provisionen más buzones en Zoho requiere commit con tipo `legal:` si toca consent o `chore(backend)` si solo es routing.
- **B) YAML en `backend/config/contact_routing.yaml`** cargado al startup. Pros: editable sin deploy. Contras: introduce dependencia nueva (PyYAML), desincroniza con frontend, rompe tipado en TS.
- **C) Tabla `contact_routes` en BD** con fila por motivo. Pros: editable desde admin. Contras: sobre-ingeniería para 6 filas, requiere seed, complica test.

**Recomendación Tori**: **A**. Coherente con cómo viven `legal_versions.py` y `COOKIE_CONSENT_CATEGORIES` — constantes Python con espejo en `shared/*.ts`. Editable por commit, auditable por git log. Todos los aliases (`prensa@`, `legal@`, `seguridad@`, etc.) están provisionados en Zoho desde 2026-04-25 y entregan en `contacto@`. Ver inventario en CLAUDE.md.

Shape propuesto:

```python
# backend/constants/contact_routing.py
CONTACT_ROUTES: dict[str, dict] = {
    "comercial":   {"email": "contacto@conniku.com", "label": "consulta comercial",          "sla_hours": 48},
    "universidad": {"email": "contacto@conniku.com", "label": "alianza con universidad",      "sla_hours": 72},
    "prensa":      {"email": "contacto@conniku.com", "label": "prensa y medios",              "sla_hours": 120},
    "legal":       {"email": "contacto@conniku.com", "label": "asuntos legales o privacidad", "sla_hours": 720},  # 30 días calendario
    "seguridad":   {"email": "contacto@conniku.com", "label": "reporte de seguridad",         "sla_hours": 48},
    "otro":        {"email": "contacto@conniku.com", "label": "consulta general",             "sla_hours": 72},
}
# TODO (post-provisión Zoho): cuando existan prensa@, legal@, seguridad@,
# cambiar destinos en commit chore(backend) y aviso en changelog.
```

Nota: los SLA declarados ya aparecen en el HTML de landing (líneas 288-294 de `contacto.html`). Snapshot congelado en BD para métrica; si cambia el SLA futuro, tickets viejos conservan el SLA de su creación.

---

### D-T3 · Número de ticket visible — formato y contador

**Problema**: el usuario debe recibir número legible (ej. "CNT-2026-0001") para futuras comunicaciones. Cómo generarlo sin colisiones bajo concurrencia.

**Alternativas**:

- **A) Secuencia Postgres `contact_ticket_seq` + formateo Python** `f"CNT-{year}-{nextval:04d}"` calculado en app antes del INSERT. Contador **por año calendario UTC** reiniciado al 1 Enero via job (o trigger). Pros: legible, ordenado. Contras: reinicio anual requiere job.
- **B) Contador monolítico `CNT-{nextval:06d}`** (sin año). Pros: simple, no hay reinicio. Contras: menos legible para usuarios, crece indefinidamente.
- **C) UUID corto** `f"CNT-{short_uuid6}"`. Pros: colisión imposible, distribuido. Contras: ilegible para usuarios por teléfono.

**Recomendación Tori**: **A** con matiz — usar secuencia global Postgres sin reinicio anual (contador infinito), pero **formatear con año de creación al emitir**: `CNT-2026-000042`. El número nunca reinicia (evita la clase entera de bugs de job fallando 1 de enero), pero se muestra con prefijo año para legibilidad. Si en 2030 llegamos a 999999 tickets, se amplía formato y punto.

Implementación:
- Secuencia Postgres `contact_ticket_seq START 1 INCREMENT 1` creada en migration.
- En el endpoint `POST`: `nextval = db.execute(text("SELECT nextval('contact_ticket_seq')")).scalar()`.
- `ticket_number = f"CNT-{now_utc.year}-{nextval:06d}"`.
- Campo `UNIQUE` en BD previene corrupción aún si se llamara `nextval` dos veces (imposible pero defensivo).

---

### D-T4 · Retención post-resolución — cuánto y por qué

**Problema**: datos personales tras resolución no deben persistir indefinidamente (GDPR Art. 5(1)(e) minimización temporal). Pero tickets son evidencia legal de comunicaciones comerciales/legales.

**Alternativas**:

- **A) 2 años desde `resolved_at_utc`** (o desde `created_at` si nunca se resuelve). Fundamento: Art. 2515 CC Chile prescripción ordinaria corta para obligaciones no-comerciales (**VERIFICAR**: Cristian pedía citar Art. 2515 CC en §8 pero Art. 2515 habla de **5 años** ordinario; el plazo de 2 años del pedido necesita base legal distinta. Tori NO inventa el fundamento).
- **B) 5 años desde `resolved_at_utc`**. Alineado con `cookie_consents` y `document_views` (ambos 5 años). Pros: coherencia interna, Art. 2515 CC aplica limpio. Contras: más datos retenidos.
- **C) 2 años si status=resolved; 5 años si status=legal/seguridad**. Pros: proporcional al riesgo. Contras: complejidad adicional.

**Recomendación Tori**: **B — 5 años**. Razones:
1. **Verificación de premisa §22**: el pedido de Cristian decía "2 años (GDPR Art. 17(3)(e) + Art. 2515 CC + Ley 19.496)". Art. 2515 CC Chile establece **prescripción ordinaria de 5 años** según `backend/legal_document_views_routes.py:30` y `backend/cookie_consent_routes.py:40-43` donde se cita explícitamente. 2 años no tiene fundamento en Art. 2515 CC. Para fundamentar 2 años habría que citar otra norma (ej. Ley 19.496 Art. 3 bis ejerce el derecho de retracto 10 días, no 2 años; Ley 19.496 no fija plazo de retención de consultas de contacto).
2. Coherencia con los 2 precedentes del proyecto (5 años). Mezclar retenciones fragmenta al legal-docs-keeper.
3. Pseudonimización a 12 meses (`pseudonymized_at_utc`) del IP/UA cubre el principio de minimización proporcional.

**Si Cristian prefiere 2 años**: el plan lo acepta pero requiere que legal-docs-keeper provea el artículo específico que lo fundamente, o se declara "decisión comercial del responsable del tratamiento (Art. 6(1)(f) interés legítimo, balance test favorable a retención menor)". Tori no inventa Art. 2515 → 2 años.

---

### D-T5 · Consent del form — qué y cómo persistir

**Problema**: el checkbox del form es el consentimiento del usuario a procesar sus datos para responder la consulta (GDPR Art. 6(1)(a) + Art. 7). Debe quedar evidencia irrefutable.

**Alternativas**:

- **A) Snapshot de PRIVACY_VERSION + PRIVACY_HASH + timestamp + IP + UA** en columnas del ticket (no tabla separada). Pros: simple, autónomo por ticket. Contras: duplica datos si un mismo usuario envía 10 tickets.
- **B) FK a `user_agreements`**: crear fila en `user_agreements` con `document_type="contact_consent"`. Pros: reusa infra legal existente. Contras: `user_agreements` requiere `user_id` actual (usuarios anónimos no tienen), desvía el propósito original de esa tabla (aceptación TOS/Privacy/Cookies).
- **C) Ambos**: fila en ticket + espejo en tabla `contact_consents` separada. Pros: separable, auditable aisladamente. Contras: sobre-diseño.

**Recomendación Tori**: **A**. El consent aquí es específico de la consulta (Art. 6(1)(a) finalidad específica "responder esta consulta"), no es aceptación general de Privacy como documento legal. Reusa el hash de Privacy solo como **referencia al texto vigente al momento del consent**, pero la semántica del consent es "responder a esta consulta concreta". El formato en el ticket:

```
consent_version          = PRIVACY_VERSION at time of create  (ej. "2.4.0")
consent_hash             = PRIVACY_HASH at time of create     (ej. "7a8ba...")
consent_accepted_at_utc  = server time (trust el reloj del servidor, no el del cliente)
client_ip                = header X-Forwarded-For (no payload)
user_agent               = header User-Agent truncado a 512
user_timezone            = payload opcional (solo informativo)
```

Ventaja legal: ante reclamo, un ticket + snapshot_hash de Privacy vigente en ese momento + IP + timestamp servidor es el set probatorio completo. Patrón idéntico a `cookie_consents`.

---

### D-T6 · Templates de email — usuario y equipo interno

**Problema**: qué texto sale al usuario (confirmación con ticket number) y qué texto sale a `contacto@conniku.com` (notificación interna).

**Alternativas**:

- **A) Templates inline en Python** (funciones `_build_user_email(ticket)` y `_build_team_email(ticket)` en `contact_tickets_routes.py`). Usan el helper `_email_template` existente de `notifications.py:193`. Pros: simple, testeable directo. Contras: templates en Python, no en Jinja.
- **B) Jinja2 templates** en `backend/templates/email/contact_*.html`. Pros: separación lógica. Contras: nueva dep, consistente con nada existente en el repo.
- **C) Email de usuario: inline Python; email de equipo: JSON estructurado** (no HTML, texto plano con todos los campos). Pros: equipo lee rápido en inbox. Contras: dos patrones distintos.

**Recomendación Tori**: **A** — ambos HTML inline con `_email_template`, que ya tiene el branding Conniku aplicado. Subject pattern:

- Al usuario: `"Conniku — Tu ticket {ticket_number} está registrado"` desde `noreply@conniku.com`, Reply-To `contacto@conniku.com`.
- Al equipo: `"[Conniku Contacto · {label}] {ticket_number} · {name}"` desde `contacto@conniku.com` (self-send para que aparezca en el inbox del buzón), Reply-To `{user_email}`.

Cuerpo al usuario (tono neutral, sin "IA"):

```
Hola {name},

Recibimos tu mensaje. Tu ticket quedó registrado con el número {ticket_number}.

Motivo: {reason_label}
Tiempo de respuesta esperado: {sla_human} (días hábiles)

Si necesitas agregar información, respondes a este correo — queda asociado a tu ticket automáticamente.

— Equipo Conniku
```

Cuerpo al equipo (interno, no visible a usuario):

```
Ticket: {ticket_number}
Motivo: {reason} — {label}
SLA declarado: {sla_hours} horas
De: {name} <{email}>
Organización: {org or '—'}
IP: {client_ip or '—'}
UA: {user_agent[:160]}...
Consent Privacy v{consent_version} hash {consent_hash[:12]}… aceptado {consent_accepted_at_utc}

--- Mensaje ---
{message}

--- Responder ---
Responde este email. Por ahora NO se crea auto-outbound desde reply SMTP
(eso es Bloque 4 CEO dashboard con IMAP/webhook). Usar dashboard CEO
endpoint POST /api/admin/contact-tickets/{id}/reply cuando exista.
```

Regla CLAUDE.md: ninguno de los dos templates menciona "IA" ni "inteligencia artificial". Validado en Capa 0.

---

### D-T7 · Rate-limit del endpoint público

**Problema**: `POST /api/contact/tickets` es público (sin JWT). Sin rate-limit, spam + abuso SMTP + costo Zoho + riesgo reputacional.

**Alternativas**:

- **A) Contador en BD por IP con ventana móvil** (cuenta filas con `client_ip=X` y `created_at > now-1h`). Pros: persistente, sobrevive restart. Contras: consulta por cada POST.
- **B) slowapi (`@limiter.limit`)** con backend in-memory. Pros: estándar FastAPI, mínima latencia. Contras: **no existe aún** en el repo (grep confirmó: slowapi mencionado en 4 archivos pero ninguno lo aplica realmente — solo docstrings). Agrega dep.
- **C) Combinación**: A + honeypot field oculto (campo `website` que bots llenan y humanos no) + Cloudflare upstream.

**Recomendación Tori**: **C** con matiz. Específicamente:
1. Límite duro por IP: máximo **5 tickets/hora/IP** y **20 tickets/día/IP** (consulta SQL con índice en `(client_ip, created_at)`). Si excede → 429 con mensaje genérico.
2. Honeypot field `website` (input hidden en form, vacío esperado). Si viene con valor → aceptar 201 silencioso pero **NO persistir ni enviar email** (bot creyendo éxito). `status='spam'` si se persiste para auditoría.
3. Validación de tamaño: name ≤ 120, message ≤ 2000 (ya en form), email RFC 5322 con `pydantic.EmailStr`.
4. Postponer slowapi para bloque futuro (ruido de instalar dep nueva para un solo endpoint).

Cloudflare/edge rate-limit es responsabilidad de ops, no de este bloque.

---

### D-T8 · Admin endpoints — auth y roles

**Problema**: el CEO (y admins) debe listar tickets, verlos, marcar estado, responder. Endpoints admin requieren auth.

**Alternativas**:

- **A) `require_admin` middleware existente** (`backend/middleware.py:121`, check `user.is_admin`). Pros: ya existe, consistente con otros admin endpoints. Contras: "admin" abarca más que CEO — en teoría un admin que no es CEO podría ver tickets sensibles (legal/seguridad).
- **B) Rol nuevo `is_ceo` o `role='ceo'`**. Pros: granularidad. Contras: requiere migración users + seed + toca `seed_ceo_profile.py`.
- **C) `require_admin` + filtro por `reason` visible solo al CEO para 'legal' y 'seguridad'** (los demás admin ven todo menos esos 2 motivos).

**Recomendación Tori**: **A — `require_admin`** para este bloque. Cristian es el único admin hoy y él es el CEO. Si el día que se contrate un admin no-CEO eso se vuelve problemático, se abre Bloque 4b con granularidad por rol. Hoy es over-engineering.

Endpoints admin a exponer:

```
GET    /api/admin/contact-tickets                 — lista paginada con filtros (status, reason, date-range)
GET    /api/admin/contact-tickets/{ticket_number} — detalle + array messages
POST   /api/admin/contact-tickets/{id}/reply      — body {message} → crea outbound message + manda email al usuario + si status='open' pasa a 'replied'; si ya 'replied' queda 'in_progress'; first_response_at_utc se setea solo en la primera respuesta
PATCH  /api/admin/contact-tickets/{id}/status     — body {status, resolution_note?} → cambia status + si 'resolved' setea resolved_at_utc
PATCH  /api/admin/contact-tickets/{id}/assign     — body {user_id} → asigna
```

Todos con `Depends(require_admin)`. Todas las acciones registran `EmailLog` para auditoría (ya existe la tabla).

---

## 3. Archivos a tocar (rutas absolutas)

### 3.1 Nuevos

- `/Users/cristiang./CONNIKU/backend/contact_tickets_routes.py` — router FastAPI con endpoint público y admin.
- `/Users/cristiang./CONNIKU/backend/migrations/add_contact_tickets_table.sql` — DDL idempotente (CREATE TABLE IF NOT EXISTS + secuencia + índices).
- `/Users/cristiang./CONNIKU/backend/constants/contact_routing.py` — `CONTACT_ROUTES` dict + lista permitida de reasons.
- `/Users/cristiang./CONNIKU/backend/tests/test_contact_tickets.py` — pytest: creación pública, routing, consent hash 409, rate-limit, honeypot, admin list/reply/status/assign, retención.
- `/Users/cristiang./CONNIKU/shared/contact_ticket_types.ts` — interfaces `ContactTicket`, `ContactTicketMessage`, `ContactReason` literal union, `CONTACT_ROUTES` (espejado del Python).

### 3.2 Modificados

- `/Users/cristiang./CONNIKU/backend/database.py` — agregar modelos `ContactTicket` y `ContactTicketMessage`. Ubicación: tras `DocumentView` (sección legal, alrededor de línea 2060+).
- `/Users/cristiang./CONNIKU/backend/migrations.py` — invocar `add_contact_tickets_table.sql` en la secuencia de migraciones idempotentes.
- `/Users/cristiang./CONNIKU/backend/server.py` — `from contact_tickets_routes import router as contact_tickets_router` + `app.include_router(contact_tickets_router)`.
- `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/contacto.html`:
  - Reemplazar `REASON_TO_EMAIL` dict por `fetch('${API_BASE}/api/contact/tickets', …)`.
  - Agregar input honeypot `<input type="text" name="website" tabindex="-1" autocomplete="off" style="display:none;">`.
  - `success-box`: mostrar ticket number real recibido de la respuesta JSON.
  - Mantener fallback `mailto:` como plan B si `fetch` falla (UX robusta).
- `/Users/cristiang./CONNIKU/docs/legal/alerts.md` — alerta de buzones no provisionados ya no aplica (todos son aliases válidos en Zoho desde 2026-04-25).
- `/Users/cristiang./CONNIKU/BLOCKS.md` — entrada al cerrar Capa 7.
- `/Users/cristiang./CONNIKU/FROZEN.md` — agregar los nuevos archivos del bloque (excepto landing HTML, que todavía evoluciona).

### 3.3 Fuera del bloque (diferido explícito)

- `src/pages/admin/ContactTicketsAdmin.tsx` — dashboard CEO React con tabla, filtros, semáforos, responder inline. Depende de migración landing→React + expansión del área admin. Diferido a **Bloque 4 CEO dashboard**.
- Inbound email threading automático (cuando el usuario responde al correo de confirmación, se asocie al ticket por Message-ID) — diferido a **Bloque 4c IMAP integration** o usar Zoho webhook cuando esté disponible.
- Provisión de buzones `prensa@`, `legal@`, `seguridad@` en Zoho — acción fuera de código, responsabilidad ops de Cristian.

---

## 4. Orden de implementación (TDD estricto)

Cada paso sigue RED→GREEN→REFACTOR. Los steps 1-4 son backend, 5-6 landing, 7 verificación.

**Paso 1 — Constantes y tipos** (no requiere test; es config):
1.1. Crear `backend/constants/contact_routing.py` con `CONTACT_ROUTES` y `CONTACT_REASONS` (set de keys válidas).
1.2. Crear `shared/contact_ticket_types.ts` con las mismas keys + interfaces TS.
1.3. Verificación: `python3.11 -c "from constants.contact_routing import CONTACT_ROUTES; print(len(CONTACT_ROUTES))"` → 6.

**Paso 2 — Modelo BD + migración**:
2.1. RED: test `test_contact_tickets_table_exists` → falla porque modelo no existe.
2.2. GREEN: definir `ContactTicket` y `ContactTicketMessage` en `database.py`. Crear `migrations/add_contact_tickets_table.sql` con CREATE TABLE IF NOT EXISTS + sequence + indexes + FK. Wire en `migrations.py`.
2.3. GREEN: correr migración en sqlite de test (`pytest` levanta BD fresh). Test pasa.
2.4. REFACTOR: extraer índices a un bloque claro, docstring con fundamento legal.

**Paso 3 — Endpoint público `POST /api/contact/tickets`**:
3.1. RED: `test_post_ticket_creates_row_and_sends_emails` — mock de `_send_email_async`, assert 201 + ticket_number pattern + fila en BD + 2 llamadas mock (user + team).
3.2. GREEN: implementar endpoint con Pydantic schema (name, email EmailStr, reason Literal, org opt, message 20-2000, consent_hash, website honeypot). Validar consent_hash vs PRIVACY_HASH → 409 si mismatch. Generar ticket_number con secuencia. INSERT ticket + INSERT primer message inbound. Llamar `_send_email_async` 2 veces.
3.3. RED: `test_post_ticket_honeypot_silent_accept` — website field filled → 201 sin fila, sin email.
3.4. GREEN: branch early-return en honeypot.
3.5. RED: `test_post_ticket_rate_limit_per_ip_hour` — 6ta request misma IP en 1h → 429.
3.6. GREEN: consulta count por IP/hour antes de INSERT.
3.7. RED: `test_post_ticket_stale_privacy_hash_returns_409` — hash distinto al canónico → 409.
3.8. GREEN: ya validado en 3.2, confirmar.
3.9. RED: `test_post_ticket_invalid_reason_returns_422` — reason fuera de set → 422 (Pydantic Literal).
3.10. GREEN: ya cubierto por tipo.
3.11. REFACTOR: extraer helpers `_build_user_email`, `_build_team_email`, `_assert_not_rate_limited`.

**Paso 4 — Endpoints admin**:
4.1. RED: `test_admin_list_requires_admin` — sin JWT → 401; con user no-admin → 403.
4.2. GREEN: `GET /api/admin/contact-tickets` con `Depends(require_admin)`, paginación offset/limit, filtros query.
4.3. RED: `test_admin_detail_returns_messages_thread`.
4.4. GREEN: `GET /{ticket_number}` con JOIN a messages.
4.5. RED: `test_admin_reply_creates_outbound_and_emails_user` — POST reply → fila outbound + `_send_email_async` llamado con to=user.email + status cambia a 'replied' + first_response_at_utc seteado.
4.6. GREEN: implementar reply.
4.7. RED: `test_admin_patch_status` (open→in_progress→resolved). `test_admin_assign`.
4.8. GREEN: implementar ambos.
4.9. REFACTOR.

**Paso 5 — Wire server.py + smoke manual**:
5.1. `include_router(contact_tickets_router)` en `server.py`.
5.2. Levantar servidor local, `curl -X POST http://localhost:8000/api/contact/tickets` con payload válido → 201 con ticket_number.
5.3. Verificar inbox de `contacto@conniku.com` (requiere SMTP configurado en local o mock).

**Paso 6 — Landing `contacto.html`**:
6.1. Reemplazar bloque JS submit (líneas 439-488) por:
   - `fetch(API_BASE + '/api/contact/tickets', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, email, reason, org, message, consent_hash: PRIVACY_HASH_STATIC, website: honeypot})})`.
   - Si `res.ok`: mostrar success-box con `ticket_number` recibido.
   - Si `res.status === 409`: mostrar error "La política de privacidad cambió, recarga la página".
   - Si `res.status === 429`: mostrar error "Demasiadas solicitudes, intenta en 1 hora".
   - En error de red: fallback al `mailto:` actual (UX robusta).
6.2. Agregar input honeypot hidden.
6.3. `PRIVACY_HASH_STATIC` constante hardcoded en el HTML coincidiendo con `PRIVACY_HASH` actual. Nota: cuando cambie Privacy, hay que recalcular este valor en landing (alerta al legal-docs-keeper lo monitorea).
6.4. **Verificación visual con Cristian antes del merge** (regla CLAUDE.md: subida de assets visibles requiere OK previo).

**Paso 7 — Pre-flight CI local §23**:
```
cd /Users/cristiang./CONNIKU
npx tsc --noEmit
npx eslint src/
npx vitest run
npx vite build
python3.11 -m pytest backend/tests/test_contact_tickets.py -v
python3.11 -m pytest backend/ --tb=no -q
python3.11 -m ruff check backend/
```
Todos exit 0 antes de push.

---

## 5. Criterio de terminado (checks binarios)

- [ ] Tabla `contact_tickets` existe en BD local con todas las columnas del D-T1.
- [ ] Tabla `contact_ticket_messages` existe.
- [ ] Secuencia Postgres `contact_ticket_seq` existe y nextval funciona.
- [ ] Migración idempotente: correrla 2 veces no rompe.
- [ ] `POST /api/contact/tickets` con payload válido → 201 con `{ticket_number, status, sla_hours}`.
- [ ] BD persiste fila con IP real (no la del payload), UA truncado ≤ 512.
- [ ] Usuario recibe email desde `noreply@conniku.com` con ticket number en subject y body.
- [ ] Buzón `contacto@conniku.com` recibe email con datos completos + reply-to al email del usuario.
- [ ] Consent guardado: `consent_version=PRIVACY_VERSION`, `consent_hash=PRIVACY_HASH`, `consent_accepted_at_utc=server now`.
- [ ] Privacy hash obsoleto → 409 con payload `{current_version, current_hash}`.
- [ ] Honeypot filled → 201 pero **sin fila ni email**.
- [ ] Rate-limit 6 requests/hora misma IP → 429.
- [ ] `retained_until_utc = created_at + 5 años` (o valor del D-T4 elegido).
- [ ] `GET /api/admin/contact-tickets` sin JWT → 401; con non-admin → 403; con admin → 200 paginado.
- [ ] `GET /api/admin/contact-tickets/{ticket_number}` devuelve detalle + messages array.
- [ ] `POST /api/admin/contact-tickets/{id}/reply` crea outbound message + email al usuario + `first_response_at_utc` seteado + status pasa a `replied`.
- [ ] `PATCH /api/admin/contact-tickets/{id}/status` con `status='resolved'` setea `resolved_at_utc`.
- [ ] Form `contacto.html` hace POST al backend (no mailto) y muestra ticket number real.
- [ ] Fallback mailto se activa solo si fetch falla (demostrable cortando red).
- [ ] CORS aprueba origin null (file://) y `https://conniku.com` (ver §6 Riesgo alto).
- [ ] `shared/contact_ticket_types.ts` compila con `tsc --noEmit`.
- [ ] Pre-flight CI local §23 verde.
- [ ] `docs/legal/alerts.md` actualizado con buzones no provisionados.
- [ ] legal-docs-keeper aprobó templates de email y texto del form.
- [ ] Cristian dio OK humano explícito antes del merge (Capa 6 inspección web online).
- [ ] FROZEN.md actualizado post-merge (excepto landing HTML).
- [ ] BLOCKS.md actualizado.

---

## 6. Riesgos

### Riesgo alto

- **R1. CORS rechaza `Origin: null` (file://)**. La landing master corre abierta como archivo local en dev (sandbox) y genera `Origin: null`. El CORS actual en `server.py:93` no incluye `null`. Si no se resuelve, el fetch desde sandbox fallará con error de red (y caerá al mailto fallback, que es aceptable pero opaca el testing).
  - **Mitigación**: documentar en el plan que producción será `https://conniku.com` (ya listado). Para dev, opciones:
    - (a) Servir landing via `python3 -m http.server` desde un puerto → Origin `http://localhost:NNNN`, agregar a CORS_ORIGINS.
    - (b) Agregar `null` a CORS_ORIGINS **solo si CORS_ENV=dev** (no producción — peligroso en prod).
    - **Elegida**: (a). Durante QA, servir sandbox en puerto local.
  - **Verificación**: curl OPTIONS preflight desde `Origin: http://localhost:8899` → 200 con `Access-Control-Allow-Origin`.

- **R2. SMTP Zoho rate-limit**. Zoho free/standard limita envíos (típicamente 200-500 emails/día por cuenta según plan). Si un ataque de rate-limit al endpoint logra pasar el honeypot, consume cuota.
  - **Mitigación**: D-T7 rate-limit por IP + honeypot + límite global diario (contador en memoria, si >100 emails/día desde el endpoint → degradar a solo persistir ticket sin email user, alertar CEO). Fuera de scope del bloque (requiere monitoreo externo Zoho), se documenta como alerta en `docs/legal/alerts.md`.

### Riesgo medio

- **R3. Duplicación por doble-click del submit**. Usuario hace click 2 veces → 2 tickets.
  - **Mitigación**: deshabilitar botón al submit (state UI) + **idempotency key** opcional en el payload (`client_request_id` UUID client-generated). Si el backend ve la misma `client_request_id` en los últimos 10 min desde misma IP → devolver el ticket previo sin crear uno nuevo.

- **R4. Email del usuario termina en spam**. SPF/DKIM/DMARC de `conniku.com` en Zoho deben estar configurados.
  - **Mitigación**: verificar con `dig TXT conniku.com` y `dig TXT _dmarc.conniku.com` antes del merge. Registrar estado en `docs/legal/alerts.md`. Si falta DKIM, abrir ticket ops urgente (fuera de scope del código).

- **R5. Bots descubren el endpoint y spamean antes del rate-limit**. 5 tickets/h/IP × 1000 IPs proxy = 5000 emails.
  - **Mitigación**: rate-limit global por endpoint (total tickets/h cross-IP, ej. 100/h) como circuit breaker. Override manual por admin si legítimo.

- **R6. `PRIVACY_HASH` cambia y el HTML estático de landing se queda con hash viejo**. Resultado: todos los POST responden 409 hasta que alguien recompile landing.
  - **Mitigación**: legal-docs-keeper agrega alerta "PRIVACY_HASH cambió: actualizar contacto.html en landing master antes del deploy" cada vez que toca `constants/legal_versions.py`.

### Riesgo bajo

- **R7. Colisión de `ticket_number` bajo concurrencia extrema**. Mitigado por secuencia Postgres + UNIQUE constraint (D-T3).

- **R8. `pseudonymized_at_utc` job no corre**. Mitigado: mismo patrón de `cookie_consents` (el job se programa pero ejecuta aún si el bloque lo olvida — el campo queda NULL y el auditor semanal lo detecta). Incluso sin job, la retención legal del ticket entero está cubierta por `retained_until_utc` + borrado programado.

- **R9. Un admin no-CEO ve tickets sensibles**. D-T8 alternativa A acepta este riesgo explícitamente. Si Cristian prefiere mitigación, elegir D-T8 alternativa C.

---

## 7. Fuera de scope

- **UI admin React** (`src/pages/admin/ContactTicketsAdmin.tsx`, `src/pages/admin/ContactTicketDetail.tsx` con semáforos de SLA). Razón: la migración landing→React es un bloque aparte. Endpoints REST quedan listos para consumir.
- **Integración IMAP/webhook para threading inbound** (cuando usuario responde al confirmación, quede como nuevo `direction='inbound'` en el ticket). Bloque 4c propuesto.
- **Notificación push/SMS** al CEO cuando entra ticket `seguridad` urgente. Bloque futuro de observability.
- **Auto-respuesta según keywords** ("hola" → template de bienvenida, "reembolso" → link a política). Overengineering hoy.
- **Encuesta NPS post-resolución**. Bloque futuro.
- **Exportación CSV** de tickets para contabilidad. Bloque 4 dashboard CEO.
- **Analytics del funnel contacto** (impresiones → submits → resueltos). Bloque futuro.
- **Provisión buzones prensa@/legal@/seguridad@ en Zoho**. Acción ops de Cristian, no de código.
- **Honeypot más sofisticado (reCAPTCHA v3)**. Conflicto con política "sin Google Analytics" implícita de Cookies. Evaluar en bloque separado si el honeypot simple no alcanza.
- **Migrar `POST /email/contact` a deprecated y removerlo**. Se hace en bloque-contact-tickets-cleanup-v2 post-migración landing→React, no ahora.

---

## 8. Componente legal (OBLIGATORIO — CLAUDE.md §Cumplimiento Legal + §18.7)

### 8.1 Trigger legal activo

Este bloque **matchea el trigger de componente legal** definido en CLAUDE.md:
- Menciona: GDPR, privacidad, consentimiento, reembolso (indirecto vía routing legal).
- Toca archivos con patrón legal: `backend/constants/legal_versions.py` (lectura), `shared/` con interfaces legales.
- Recolecta datos personales sin contexto previo de usuario (canal público).

**Capa 0 `legal-docs-keeper` OBLIGATORIA antes de Capa 1 (builder).**

### 8.2 Normas aplicables citadas (§Regla crítica: prohibición de inventar información legal)

#### GDPR (Reglamento UE 2016/679)

- **Art. 6(1)(a)** — consentimiento del interesado para fines específicos (el consent checkbox del form). URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679. Verificación 2026-04-22 (Tori).
- **Art. 7(1)** — demostrabilidad del consentimiento: el responsable debe poder demostrar que el interesado consintió. Soporta la persistencia de `consent_version`, `consent_hash`, `consent_accepted_at_utc`, IP, UA.
- **Art. 6(1)(f)** — interés legítimo del responsable como base legal para IP/UA (evidencia probatoria, prevención de abuso). Balance test: interés legítimo del responsable vs derechos del interesado; ponderación favorable porque IP se pseudonimiza a 12 meses y se retiene solo 5 años.
- **Art. 5(1)(c)** — minimización. Soporta truncar UA a 512 chars y no recolectar campos innecesarios.
- **Art. 5(1)(e)** — limitación del plazo de conservación. Soporta `retained_until_utc` y el job de pseudonimización.
- **Art. 17(3)(e)** — conservación para ejercicio/defensa de reclamaciones legales. Fundamenta la retención post-resolución.
- **Art. 13** — información al interesado al recolectar. Soporta que Privacy Policy enumere este canal de recolección como finalidad.

#### Ley 19.628 (Chile) sobre Protección de la Vida Privada

- **Art. 4°** — información al titular al momento de recolectar datos. URL: https://www.bcn.cl/leychile/navegar?idNorma=141599. Verificación 2026-04-22 (Tori). Soporta que el form muestre link a Política de Privacidad adyacente al checkbox (**ya cumple** en `contacto.html:267`).

#### Código Civil Chile (prescripción)

- **Art. 2515** — prescripción ordinaria 5 años. URL: https://www.bcn.cl/leychile/navegar?idNorma=172986. Verificación 2026-04-22 (Tori). Fundamenta retención de 5 años (D-T4 alternativa B).

#### Ley 19.496 (Chile) Protección del Consumidor

- **Art. 3 bis** — derecho de retracto servicios digitales 10 días. No aplica directamente a tickets de contacto (estos no son contratos), pero el motivo 'legal' puede canalizar reclamos basados en esta ley — el SLA de 30 días calendario del motivo `legal` es coherente con el plazo de respuesta administrativa razonable.

#### Ley 21.719 (Chile) — nueva Ley de Protección de Datos

- **Art. 14** vigente **2026-12-01** (publicada 2024-12-13). URL: https://www.bcn.cl/leychile/navegar?idNorma=1212270. Verificación 2026-04-22 (Tori). Exigirá pseudonimización proactiva — el campo `pseudonymized_at_utc` del schema anticipa este requerimiento.

### 8.3 Constantes legales usadas (no nuevas constantes)

Este bloque **no crea constantes legales nuevas**. Solo **consume**:
- `PRIVACY_VERSION`, `PRIVACY_HASH` desde `backend/constants/legal_versions.py` (snapshot en cada ticket).

### 8.4 Documentos legales a actualizar (borrador a cargo de legal-docs-keeper)

- **Política de Privacidad (v2.4.x o bump MINOR)**: agregar sección "Canal de Contacto" enumerando:
  - Datos recolectados: nombre, email, motivo, organización (opcional), mensaje, IP, UA, timezone.
  - Finalidad: responder la consulta específica.
  - Base legal: Art. 6(1)(a) GDPR + Art. 4 Ley 19.628.
  - Retención: 5 años (D-T4) post-resolución.
  - Pseudonimización de IP/UA a 12 meses.
  - Destinatarios internos: equipo Conniku en `contacto@conniku.com` (y futuros `prensa@`, `legal@`, `seguridad@` cuando se provisionen).
- **Términos y Condiciones (si aplica)**: probable que no requiera cambio (el canal de contacto es informacional, no contractual).
- **Política de Cookies**: no aplica (el form no setea cookies propias más allá de las ya declaradas).

El bump de versión de Privacy dispara el mecanismo de re-aceptación (Pieza 6 del bloque-legal-consolidation-v2 ya mergeado). Cristian decide si es **PATCH** (enumeración más detallada sin cambio sustantivo) o **MINOR** (nuevo canal es cambio sustantivo). Recomendación legal-docs-keeper: **MINOR** → fuerza re-aceptación para usuarios registrados.

### 8.5 Validaciones obligatorias de legal-docs-keeper (Capa 0)

- [ ] Texto del checkbox en `contacto.html:267` **no se modifica** en este bloque (ya aprobado por abogado).
- [ ] Templates de email (D-T6): ninguno menciona "IA" ni "inteligencia artificial" (regla CLAUDE.md).
- [ ] Templates no afirman cumplimiento legal al usuario ("garantizamos GDPR") — solo informativos.
- [ ] Email al usuario tiene link visible a **Política de Privacidad vigente**.
- [ ] Reply-to del email al equipo es el `user.email` (permite responder directo sin exponer estructura interna).
- [ ] Borrador de Privacy v2.4.x disponible en `docs/legal/drafts/` antes de Capa 4.

### 8.6 Aprobación humana obligatoria (§18.7)

- truth-auditor **NO CIERRA** la Capa 3 sin aprobación humana explícita de Cristian de:
  1. Borrador de Privacy Policy actualizado.
  2. Texto de los dos templates de email.
  3. Decisiones D-T1 a D-T8 respondidas en batch.

---

## 9. Decisiones pendientes batch §21 (responder con letras)

Cristian responde en un mensaje con lista de letras, formato `1A 2A 3A 4B 5A 6A 7C 8A` o similar.

| # | Decisión | Recomendación Tori |
|---|---|---|
| **D-T1** | Schema `contact_tickets`: A mínimo / B completo legal-grade con tabla messages separada / C medio sin threading | **B** |
| **D-T2** | Routing motivo→email: A dict Python hardcoded / B YAML externo / C tabla BD | **A** |
| **D-T3** | Ticket number: A secuencia Postgres formateada año+número / B monolítico / C UUID corto | **A** (con matiz: secuencia no reinicia, año solo en formato) |
| **D-T4** | Retención post-resolución: A 2 años (falta fundamento) / B 5 años (Art. 2515 CC) / C 2 años estándar + 5 años legal/seguridad | **B** (coherencia con precedentes + Art. 2515 CC limpio) |
| **D-T5** | Consent persistence: A snapshot en ticket / B FK a user_agreements / C ambos | **A** |
| **D-T6** | Email templates: A inline Python con _email_template / B Jinja2 / C user HTML + team plaintext | **A** |
| **D-T7** | Rate-limit endpoint público: A contador BD / B slowapi / C BD + honeypot + validaciones | **C** (implementación elegida detallada) |
| **D-T8** | Admin auth: A require_admin / B rol is_ceo nuevo / C require_admin + filtro por reason | **A** |

---

## 10. Notas operativas

### 10.1 Rama y PR

- Rama: `bloque-contact-tickets-v1`
- Base: `main` (rama actual `bloque-legal-consolidation-v2` ya mergeada según memoria de sesión 2026-04-20).
- PR title: `feat(backend): sistema de tickets de contacto con persistencia legal y admin bidireccional`.
- Labels: `backend`, `legal`, `requires-human-approval`.
- Reviewers: code-reviewer + truth-auditor + legal-docs-keeper.

### 10.2 Dependencias verificadas (§22 verificación de premisas)

- **`backend/notifications.py::_send_email_async` existe con `from_account` param**: VERIFICADO (grep, línea 61).
- **`backend/middleware.py::require_admin` existe**: VERIFICADO (grep, línea 121).
- **`PRIVACY_VERSION` y `PRIVACY_HASH` existen en `backend/constants/legal_versions.py`**: VERIFICADO (Read, líneas 38-43).
- **`CookieConsent` y `DocumentView` models existen con patrón retención**: VERIFICADO (Read, línea 1885+).
- **slowapi NO está instalado operativamente**: VERIFICADO (grep encontró 4 files pero solo en docstrings declarativos, no `@limiter.limit` aplicado).
- **CORS actual NO incluye `null` origin**: VERIFICADO (`server.py:91-107`, lista no incluye `null`).
- **Buzones `prensa@`, `legal@`, `seguridad@`**: RESUELTO 2026-04-25 — son aliases válidos en Zoho que entregan en `contacto@conniku.com`. Inventario completo en CLAUDE.md.
- **Form HTML actual usa mailto, no fetch**: VERIFICADO (`contacto.html:480` `window.location.href = mailto`).
- **Bloque 5 legal-viewer + Bloque 7 multi-doc-consent mergeados**: VERIFICADO (commits recientes en rama actual confirman).

### 10.3 Precondiciones de entorno

- Variables env backend (ya en Render producción, verificar en local):
  - `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=587`.
  - `SMTP_PASS_NOREPLY`, `SMTP_PASS_CONTACTO` (éste es el crítico para este bloque).
  - `CORS_ORIGINS` extendido con `http://localhost:8899` (puerto donde Cristian sirva el sandbox landing en QA).
- Variable env landing (JS):
  - `API_BASE` — debe apuntar a `https://studyhub-api-bpco.onrender.com` en prod, `http://localhost:8000` en local. Ya existente (ver contexto.html otros bloques que hacen fetch).

### 10.4 Plan de rollout

1. Merge PR a main → Render redeploy automático backend.
2. Migración idempotente corre al startup.
3. Cristian sirve `contacto.html` del landing master en `http://localhost:8899` para QA (Capa 6).
4. Verificar ticket real creado + email recibido en `contacto@conniku.com` + email de confirmación al usuario.
5. Si OK → Cristian actualiza landing master en el master final y pushea al deploy de landing.
6. FROZEN.md post-merge.

### 10.5 Métrica de éxito post-deploy (7 días)

- ≥ 1 ticket real creado por canal público.
- 0 errores 5xx en endpoint `/api/contact/tickets` en logs Render.
- 0 respuestas 429 a IPs legítimas (si hay >0, ajustar umbral de rate-limit).
- Todos los emails de confirmación al usuario entregados (no-bounce) según Zoho dashboard.

---

## Apéndice A — Checklist protocolo 7 capas (§18)

- **Capa 0 (legal, §18.7)**: legal-docs-keeper valida §8 y produce borrador Privacy v2.4.x. Aprobación Cristian.
- **Capa 1**: backend-builder implementa pasos 1-5 con TDD RED-GREEN-REFACTOR. Luego frontend-builder actualiza `contacto.html` (paso 6). qa-tester valida flujo completo end-to-end.
- **Capa 2**: code-reviewer revisa diff ciego, emite quality score.
- **Capa 3**: truth-auditor cruza reportes. **Aprobación humana obligatoria** de Cristian dado componente legal.
- **Capa 4**: merge a preview, Vercel/Render despliegan.
- **Capa 5**: gap-finder audita.
- **Capa 6**: Cristian inspecciona en URL preview real (no localhost, no sandbox) — al menos 3 flujos: (a) ticket válido, (b) ticket con hash privacy obsoleto, (c) admin response desde endpoint con curl.
- **Capa 7**: merge a main, FROZEN, BLOCKS.md, deploy prod.

---

**Fin del plan.** Pendiente: respuestas D-T1 a D-T8 en batch para pasar a Capa 0.
