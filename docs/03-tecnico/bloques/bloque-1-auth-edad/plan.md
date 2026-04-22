# Plan — Bloque 1: auth + verificación de edad 18+

**Bloque:** `bloque-1-auth-edad`
**Fecha de plan:** 2026-04-17
**Autor:** web-architect (Tori)
**Estado:** borrador para aprobación de Cristian
**Componente legal:** SÍ (flujo reforzado CLAUDE.md §Cumplimiento Legal)

---

## 1. Contexto

### 1.1 Problema que resuelve

La plataforma Conniku declara en CLAUDE.md ser exclusiva para mayores de
18 años y establece una política estricta de verificación de edad en dos
componentes simultáneos más una tabla `user_agreements` con evidencia
legal de 7 campos. Hoy el código cumple parcialmente esa política:

- Validación de edad backend existe, pero con mensaje no alineado al
  texto oficial
- Validación de edad frontend existe, pero con cálculo duplicado al
  backend y copy impreciso
- Checkbox actual es un "I accept TOS" genérico de 1 línea, lejos del
  texto oficial de 5 puntos exigido por CLAUDE.md §verificación de edad
  componente 2
- Tabla `user_agreements` **no existe** en base de datos
- No hay hash del texto legal, ni captura de IP / User-Agent / timezone
  del usuario
- El prompt del chatbot Konni en `backend/server.py:1078` promete
  explícitamente una alternativa para menores con autorización del
  representante legal, violando la política de CLAUDE.md §Regla
  operacional plataforma exclusiva para adultos
- Google OAuth crea usuarios sin verificar edad ni mostrar checkbox
  declarativo (ver Riesgos §5.7)

Este es el Bloque 1 inaugural del sistema modular (BLOCKS.md está
vacío). Cerrarlo deja el flujo de registro legalmente robusto y
establece el patrón que los bloques posteriores seguirán.

### 1.2 Archivos leídos en planificación

- `/Users/cristiang./CONNIKU/CLAUDE.md` (completo, foco en
  §Cumplimiento Legal, §18 Desarrollo modular, §19 Auto Mode OFF)
- `/Users/cristiang./CONNIKU/FROZEN.md`
- `/Users/cristiang./CONNIKU/.claude/frozen-files.txt`
- `/Users/cristiang./CONNIKU/BLOCKS.md` (confirmado: ningún bloque
  cerrado aún)
- `/Users/cristiang./CONNIKU/backend/server.py` líneas 1060-1095
  (prompt Konni con excepción prohibida)
- `/Users/cristiang./CONNIKU/backend/auth_routes.py` líneas 219-247
  (RegisterRequest), 388-507 (flujo register), 740-795 (Google OAuth)
- `/Users/cristiang./CONNIKU/backend/database.py` líneas 1-60, User
  model, línea 129 (tos_accepted_at existente)
- `/Users/cristiang./CONNIKU/backend/migrations.py` completo (patrón
  de migraciones idempotentes con SQL plano)
- `/Users/cristiang./CONNIKU/backend/requirements.txt`
- `/Users/cristiang./CONNIKU/src/pages/Register.tsx` líneas 72-295,
  640-670, 1745-1840
- `/Users/cristiang./CONNIKU/src/services/auth.tsx` líneas 100-150
- `/Users/cristiang./CONNIKU/src/services/i18n.tsx` claves
  `tos.iAccept`, `err.under18`, `err.acceptTOS`, `err.enterBirthDate`
- `/Users/cristiang./CONNIKU/package.json` (frameworks disponibles)

### 1.3 Hallazgos clave del código existente

1. `backend/auth_routes.py:416` calcula edad correctamente usando
   `(today.month, today.day) < (birth.month, birth.day)`. Esa lógica
   ya considera día+mes y sólo necesita alinear el mensaje.
2. `backend/auth_routes.py:418` devuelve
   `"Debes tener al menos 18 años para registrarte"`. CLAUDE.md exige:
   `"Conniku es una plataforma exclusiva para personas mayores de 18 años. No podemos procesar tu registro."`
3. `src/pages/Register.tsx:230` usa `calculateAge()` cliente, que
   también considera día+mes (líneas 180-186). Alineación OK.
4. `src/pages/Register.tsx:652-660` computa `max` del input de fecha
   como `hoy.getFullYear() - 18, mes, día`. Esto bloquea fechas
   futuras pero **permite** una fecha que produce edad 17 años 11 meses
   30 días (borde), porque `.toISOString()` recorta a día sin validar
   si al cierre del año cumplirá 18. La validación backend lo atrapa
   igual, pero el UX muestra selector con fechas de menor de edad
   seleccionables. Este es bug menor que se corrige dentro del scope.
5. `src/pages/Register.tsx:1755-1772` el checkbox actual sólo renderiza
   `t('tos.iAccept')` + link a TOS. No contiene los 5 puntos exigidos.
6. `backend/migrations.py` usa patrón idempotente con `CREATE TABLE IF
   NOT EXISTS` y SQL plano. Compatible SQLite local + PostgreSQL
   Render. Alembic **no está** instalado (requirements.txt:1-40 no lo
   incluye). Esto determina la decisión de ubicación de migración.
7. `backend/database.py` declara SQLAlchemy `declarative_base()` y la
   app usa un modelo `User` con `tos_accepted_at`. Agregar un nuevo
   modelo `UserAgreement` sigue el patrón del codebase.
8. `backend/auth_routes.py:748-795` (Google OAuth `/auth/google`) crea
   usuarios **sin** validación de edad ni checkbox declarativo.
   CLAUDE.md §Flujo de verificación de edad aplica "al momento del
   registro", sin excepción por proveedor. Resolución: ver §5.7.
9. `backend/server.py:1088` menciona "inteligencia artificial" en
   prompt del chatbot, violando regla crítica CLAUDE.md §Convenciones.
   **Fuera de scope** pero registrado como deuda para bloque de
   higiene de copy.
10. No hay framework de tests instalado (ni pytest, ni vitest, ni
    jest). CLAUDE.md exige TDD obligatorio. Ver decisión §2.7.

---

## 2. Decisiones de diseño

Cada decisión lista alternativas consideradas, criterio aplicado, y
recomendación. Las marcadas **[REQUIERE OK]** necesitan confirmación
explícita de Cristian antes de que el builder inicie.

### 2.1 Ubicación de la migración de `user_agreements`

**Alternativas:**

A. SQL plano nuevo en `backend/migrations/user_agreements.sql`,
   invocado desde `migrations.py`.
B. Bloque SQL directo agregado dentro de `backend/migrations.py`
   (patrón `if not inspector.has_table("user_agreements"): CREATE
   TABLE ...`).
C. Instalar Alembic y convertir todo el esquema a Alembic.

**Criterio:** consistencia con patrón vigente del codebase,
compatibilidad SQLite+PostgreSQL, idempotencia, coste de cambio.

**Decisión:** **B**. Es el patrón que ya usa `migrations.py` para
`tutoring_requests`, `friend_lists`, `moderation_queue`,
`blog_threads`, etc. La opción C introduce refactor fuera de scope
(CLAUDE.md §Stack declara Alembic pero en la realidad no hay
nada instalado; migrar a Alembic es bloque separado). La opción A
fragmenta el patrón sin ganancia.

### 2.2 Ubicación del texto legal canónico y su hash

**Alternativas:**

A. Constante Python en `backend/constants/legal_texts.py` (nuevo
   archivo), con versión v1.0.0 y su hash SHA-256 precalculado.
B. Constante en `backend/legal_texts.py` (raíz de backend/).
C. Tabla en base de datos con versiones y texto almacenado, el hash
   se calcula al escribir.

**Criterio:** CLAUDE.md §Constantes legales en el código exige
`backend/constants/` para constantes legales. La estructura ya está
sugerida (`labor_chile.py`, `tax_chile.py`, `consumer.py`,
`data_protection.py`). El texto de declaración jurada es una
constante legal.

**Decisión:** **A**. Crear `backend/constants/__init__.py` (vacío) y
`backend/constants/legal_texts.py` con:

- `AGE_DECLARATION_V1_TEXT: str` — copia literal del texto de
  CLAUDE.md §711-723
- `AGE_DECLARATION_V1_HASH: str` — SHA-256 del texto **normalizado**
  (ver §2.3 para la regla de normalización)
- `AGE_DECLARATION_VERSION: str = "1.0.0"`
- Comentario con fuente (CLAUDE.md §verificación de edad componente 2),
  fecha de verificación, verificador

El frontend recibe el mismo texto vía archivo compartido
`shared/legal_texts.ts` (ver §2.4) para garantizar que el hash
calculado en backend coincide con el texto mostrado.

### 2.3 Regla de normalización del texto para el hash

**Problema:** si el frontend inserta un espacio extra o un salto de
línea distinto, el hash calculado por el backend cambia y los registros
se corrompen silenciosamente.

**Alternativas:**

A. Almacenar el texto y hashearlo byte a byte tal cual (frágil).
B. Normalizar antes de hashear: Unicode NFC, colapsar espacios
   consecutivos, trim líneas, unir con `\n` estándar, remover
   trailing whitespace por línea.
C. Solo hashear los N puntos semánticos (lista separada), ignorando
   presentación.

**Decisión:** **B**. Función `_normalize_legal_text(text: str) -> str`
en `backend/constants/legal_texts.py` documenta explícitamente:

1. Convertir a Unicode NFC
2. Reemplazar `\r\n` y `\r` por `\n`
3. Para cada línea: `line.rstrip()` (remueve trailing whitespace)
4. Colapsar runs de 2+ espacios internos a un solo espacio
5. Remover líneas vacías al inicio y al final (sin tocar las internas)
6. `join('\n')`

El hash publicado vive en la constante. Si alguien edita el texto y el
hash no coincide, un test RED lo atrapa.

### 2.4 ¿Cómo comparte el frontend el mismo texto?

**Alternativas:**

A. Duplicar el texto literal en TypeScript y confiar que coincide.
B. Archivo compartido `shared/legal_texts.ts` con el mismo texto y
   un test que lo compara contra el backend (ejecutado en CI).
C. Endpoint `GET /api/legal/texts/age_declaration` que devuelve el
   texto y el hash; el frontend lo solicita en runtime.

**Criterio:** simplicidad, verificabilidad, evitar drift.

**Decisión:** **B**. Hay un directorio `shared/` ya en el repo (ver
`ls` raíz). Se crea `shared/legal_texts.ts` con el texto literal y la
versión. Un test backend (`test_legal_text_sync`) lee el archivo TS,
extrae la cadena, aplica la misma normalización, y verifica que el
hash coincide con la constante Python. Si diverge, falla el CI.

**[REQUIERE OK]** Esto añade una dependencia cruzada que un lint
ingenuo no ve. Cristian decide si le parece aceptable o si prefiere
C (endpoint dinámico).

### 2.5 Retrocompatibilidad para usuarios existentes

**Contexto:** hoy hay usuarios reales en producción con
`tos_accepted_at` poblado pero sin fila en `user_agreements` (tabla
aún no existe).

**Alternativas:**

A. Migración retroactiva: crear una fila por cada usuario existente
   con `document_type='legacy_migration'`, `accepted_at_utc =
   user.tos_accepted_at or user.created_at`, `client_ip='unknown'`,
   `user_agent='legacy_migration'`, `user_timezone='unknown'`,
   `text_version_hash=HASH_LEGACY` (constante dedicada para legacy).
B. Solo aplicar a usuarios nuevos desde esta fecha. Los existentes
   quedan sin fila hasta que re-acepten (forzar re-aceptación en el
   próximo login).
C. Igual que A pero con flag booleano `is_legacy_migration = TRUE`.

**Criterio:** CLAUDE.md §flujo detección posterior exige evidencia
legal por usuario. Sin fila, no hay evidencia. Además, forzar
re-aceptación rompe UX y puede disparar quejas.

**Decisión:** **A + flag** (combinación A y C). Migración retroactiva
con `document_type='age_declaration_legacy'`, marcando claramente que
es reconstrucción a partir de `tos_accepted_at`. El hash apunta a una
constante `AGE_DECLARATION_LEGACY_HASH = 'legacy_no_hash_available'`
(cadena literal) para dejar explícito que no se capturó el texto
original. Un admin puede filtrar por hash para identificar a estos
usuarios.

**[REQUIERE OK]** El borde legal: ¿es suficiente evidencia una
declaración reconstruida a posteriori? El legal-docs-keeper debe
revisar esta decisión antes del merge; lo agrego a Riesgos §5.1.

### 2.6 Campo `document_type` en `user_agreements`

**Alternativas:**

A. Solo almacenar la declaración de edad (un solo tipo). Sin columna
   `document_type`.
B. Columna `document_type` con valores `age_declaration`, `tos`,
   `privacy_policy`, `cookies`, `legacy_*`, etc. para que la tabla
   sirva como registro unificado de todas las aceptaciones legales
   del usuario.

**Criterio:** CLAUDE.md menciona que el legal-docs-keeper mantiene
múltiples documentos (TOS, Privacy, Cookies, Refund, Acceptable Use,
Aviso Legal, DPA). Cuando se desplieguen versiones numeradas de esos
documentos, cada re-aceptación debe registrarse. Una sola tabla es
más simple que N tablas.

**Decisión:** **B**. Columna `document_type VARCHAR(40) NOT NULL` con
índice compuesto `(user_id, document_type)`. En el Bloque 1 solo se
escribe `age_declaration`; los otros tipos quedan disponibles para
bloques futuros.

### 2.7 Framework de testing para TDD

**Problema:** CLAUDE.md §TDD obligatorio para builders exige ciclo
RED-GREEN-REFACTOR. No hay pytest, vitest, ni jest instalado.

**Alternativas:**

A. Instalar pytest + pytest-asyncio + httpx testclient para backend,
   y vitest + @testing-library/react para frontend, como parte de
   este bloque.
B. Bloque 1 instala solo los mínimos (pytest para backend). Frontend
   queda sin test framework pero con verificación manual documentada;
   se abre Bloque 2 separado "setup frontend testing".
C. Bloque separado previo "setup-testing" antes de iniciar Bloque 1.

**Criterio:** CLAUDE.md §18.7 permite excepciones de TDD para
configuración (`*.config.*`, `package.json`) pero no para cambios de
lógica como los de este bloque.

**Decisión:** **A**. Instalar en este bloque:

- Backend: `pytest>=8.0.0`, `pytest-asyncio>=0.23.0` (añadir a
  `backend/requirements.txt`). `httpx` ya existe. Configurar
  `backend/pytest.ini` con `pythonpath = .` y `testpaths = tests`.
  Crear `backend/tests/__init__.py` y `backend/tests/conftest.py`
  con fixtures de DB en memoria SQLite.
- Frontend: `vitest@^1`, `@testing-library/react@^14`,
  `@testing-library/jest-dom@^6`, `jsdom@^24`. Configurar
  `vitest.config.ts`. Agregar script `"test": "vitest"` y
  `"test:run": "vitest run"` en package.json.

**[REQUIERE OK]** Tocar `package.json` y `backend/requirements.txt`
en el mismo bloque que añade lógica expande el scope. El beneficio es
que habilita TDD para todos los bloques futuros. El costo es que si
la instalación falla, el bloque se bloquea. Cristian decide si
prefiere Bloque 0 de setup (opción C) o que vaya junto.

**Nota FROZEN:** `package.json` está en FROZEN.md (línea 17 de
FROZEN.md). Esta decisión requiere `/unfreeze package.json` explícito
antes de que el builder inicie.

### 2.8 Captura de zona horaria del cliente

**Alternativas:**

A. El frontend envía `client_timezone` en el payload del registro
   usando `Intl.DateTimeFormat().resolvedOptions().timeZone`
   (ej: `"America/Santiago"`).
B. El backend infiere zona horaria desde IP (GeoIP), menos preciso
   y requiere dependencia extra.
C. No capturar zona horaria (dejar campo nullable).

**Decisión:** **A**. Standard web, sin dependencia extra, valor
preciso. El backend valida que el string recibido existe como zona
IANA (librería `pytz` ya está en requirements.txt línea 32) antes de
persistir. Si falla, guarda el string tal cual con flag implícito
`unknown_timezone` mediante prefijo `invalid:<raw>` — mejor capturar
algo que nada.

### 2.9 Captura de IP con proxies (Render + Vercel)

**Problema:** CLAUDE.md §user_agreements campo `client_ip`. Render
coloca la IP real del cliente en el header `X-Forwarded-For` (primer
valor del CSV); `request.client.host` muestra la IP del load balancer
interno.

**Alternativas:**

A. Leer `X-Forwarded-For`, tomar primer valor, stripping whitespace.
   Fallback a `request.client.host`.
B. Usar `X-Real-IP` de nginx (no aplica porque Render usa XFF).
C. Confiar en `request.client.host` tal cual (incorrecto en prod).

**Decisión:** **A**, con helper `_extract_client_ip(request)` en
`auth_routes.py` (o mejor en `security_middleware.py`). El helper:

1. Lee `X-Forwarded-For` header
2. Si existe: split por coma, toma primer elemento, strip, valida que
   sea una IP v4 o v6 parseable (usar `ipaddress.ip_address()` de
   stdlib para validar)
3. Si no válido o ausente: fallback a `request.client.host`
4. Si también ausente: retorna `"unknown"`

**Atención de seguridad:** `X-Forwarded-For` es spoofable si el
request pasa por un proxy no confiable. En prod Render, el header es
inyectado por Render mismo, de confianza. En local dev no hay proxy,
por lo que el fallback a `request.client.host` cubre el caso. No
aplicamos validación adicional en este bloque; se deja anotado como
hardening futuro en Riesgos §5.3.

### 2.10 i18n del texto legal declarativo

**Alternativas:**

A. Hardcoded en español chileno, sin entrar a `i18n.tsx`. Cuando se
   expanda a otros países se agregará un archivo legal por país con
   texto validado por abogado local.
B. Meter el texto en `i18n.tsx` con traducciones a inglés, portugués,
   francés.

**Criterio:** el texto es una declaración jurada bajo legislación
chilena. Traducir automáticamente es peligroso: cada traducción crea
un documento legal nuevo que debe ser validado por abogado del país
destino. CLAUDE.md prohíbe inventar información legal; una traducción
automática no validada es inventar efecto legal.

**Decisión:** **A**. Hardcoded en español chileno en
`shared/legal_texts.ts`. El idioma de la interfaz general sigue
cambiando por `i18n.tsx` (labels del formulario, botones, mensajes
de error), pero el texto de la declaración jurada queda en español
siempre. Arriba del checkbox se agrega una leyenda (sí traducida):
`"La siguiente declaración jurada se rige por legislación chilena y
debe ser aceptada en su idioma original."` para dejar claro por qué
no cambia de idioma.

### 2.11 Flujo para usuarios que se registran con Google OAuth

**Problema:** `backend/auth_routes.py:748+` crea usuarios Google sin
verificar edad ni mostrar checkbox. Hoy cualquier menor con cuenta
Google puede entrar.

**Alternativas:**

A. Resolver dentro de este bloque: al detectar primer login Google,
   si el usuario no tiene fila `user_agreements` de
   `document_type='age_declaration'`, bloquear login y redirigir a
   `/complete-registration` con modal que pide fecha de nacimiento y
   checkbox. Hasta que complete, no tiene acceso.
B. Dejarlo fuera de scope y abrir Bloque 1.5 dedicado a OAuth.
C. Desactivar Google OAuth temporalmente hasta que se resuelva.

**Criterio:** si se deja sin resolver, el bloque cierra con una
puerta trasera conocida, violando la política 18+. Si se mete todo
adentro, el bloque se duplica en tamaño y riesgo.

**Decisión recomendada:** **A**, pero acotada: implementar solo el
bloqueo en backend (Google OAuth retorna 403 si falta la fila de
`user_agreements` tipo `age_declaration`, con código de error
específico `AGE_DECLARATION_REQUIRED`) y en frontend un modal simple
que captura fecha de nacimiento + checkbox y llama a un nuevo
endpoint `POST /auth/complete-age-declaration`. Sin rediseño de la
pantalla de post-registro Google ni onboarding nuevo.

**[REQUIERE OK]** Cristian decide A o B. Si B, el bloque 1 cierra con
el riesgo documentado en §5.7 y se abre registry_issue inmediato.

### 2.12 Versionado del texto y migración de hash en el futuro

**Decisión:** hoy v1.0.0. Cuando cambie una palabra del texto (incluso
una coma) se crea `AGE_DECLARATION_V1_1_TEXT` y
`AGE_DECLARATION_V1_1_HASH`. La constante "actual" es una referencia:
`AGE_DECLARATION_CURRENT = (VERSION_V1_1, HASH_V1_1, TEXT_V1_1)`.
Usuarios que aceptaron v1.0.0 mantienen su fila; al intentar aceptar
una acción que requiera versión más nueva, se les muestra diff y se
les pide re-aceptar. El bloque 1 no implementa re-aceptación; solo
deja el espacio preparado.

---

## 3. Archivos a tocar

Clasificación: CREATE (nuevo), MODIFY (existente), FROZEN (bloqueado,
requiere /unfreeze).

### 3.1 Backend

| Acción | Archivo (ruta absoluta) | Cambio |
|---|---|---|
| CREATE | `/Users/cristiang./CONNIKU/backend/constants/__init__.py` | Archivo vacío para paquete Python |
| CREATE | `/Users/cristiang./CONNIKU/backend/constants/legal_texts.py` | `AGE_DECLARATION_V1_TEXT`, `AGE_DECLARATION_V1_HASH`, `AGE_DECLARATION_VERSION`, `AGE_DECLARATION_LEGACY_HASH`, función `_normalize_legal_text`. Bloque de comentarios con fuente CLAUDE.md §verificación de edad, fecha verificación 2026-04-17, verificador: Cristian Gutiérrez |
| CREATE | `/Users/cristiang./CONNIKU/backend/legal_routes.py` | Router FastAPI con un helper interno `record_age_declaration(db, user_id, request, document_type)` que se importa desde `auth_routes.py`. Incluye también endpoint `POST /auth/complete-age-declaration` para el caso Google OAuth (§2.11) |
| MODIFY | `/Users/cristiang./CONNIKU/backend/database.py` | Agregar modelo `class UserAgreement(Base)` con los 8 campos (id, user_id, document_type, accepted_at_utc, user_timezone, client_ip, user_agent, text_version_hash) e índices (user_id), (user_id, document_type) |
| MODIFY | `/Users/cristiang./CONNIKU/backend/migrations.py` | Agregar bloque `if not inspector.has_table("user_agreements"): CREATE TABLE ...` al estilo de tutoring_requests. Agregar también migración retroactiva: por cada usuario con `tos_accepted_at IS NOT NULL` que no tenga fila legacy, insertar fila `document_type='age_declaration_legacy'` |
| MODIFY | `/Users/cristiang./CONNIKU/backend/auth_routes.py` | (a) añadir campo `client_timezone: str = ""` a `RegisterRequest`. (b) alinear mensaje de edad en línea 418 al texto oficial de CLAUDE.md. (c) tras `db.refresh(user)` y antes del referral code, llamar `record_age_declaration(db, user.id, request, 'age_declaration')`. (d) en `/auth/google`, bloquear si falta la declaración y retornar código específico. (e) helper `_extract_client_ip`. |
| MODIFY | `/Users/cristiang./CONNIKU/backend/server.py` | Línea 1078: reemplazar el texto actual por `"ELEGIBILIDAD: Debes ser mayor de 18 años. Conniku es una plataforma exclusiva para personas mayores de 18 años, sin excepciones. Una sola cuenta por persona."`. Eliminar la frase `"(o tener autorización del representante legal)"` |
| MODIFY | `/Users/cristiang./CONNIKU/backend/requirements.txt` | Añadir `pytest>=8.0.0`, `pytest-asyncio>=0.23.0` |
| CREATE | `/Users/cristiang./CONNIKU/backend/pytest.ini` | Config mínima (pythonpath=., testpaths=tests, asyncio_mode=auto) |
| CREATE | `/Users/cristiang./CONNIKU/backend/tests/__init__.py` | Vacío |
| CREATE | `/Users/cristiang./CONNIKU/backend/tests/conftest.py` | Fixture `db_session` con SQLite in-memory, fixture `client` con `TestClient` de FastAPI |
| CREATE | `/Users/cristiang./CONNIKU/backend/tests/test_register_age.py` | Tests RED (ver §4.1) |
| CREATE | `/Users/cristiang./CONNIKU/backend/tests/test_user_agreements.py` | Tests RED (ver §4.1) |
| CREATE | `/Users/cristiang./CONNIKU/backend/tests/test_legal_texts.py` | Tests RED de hash, normalización, sync con shared/legal_texts.ts (ver §4.1) |
| CREATE | `/Users/cristiang./CONNIKU/backend/tests/test_konni_prompt.py` | Test RED que asserta que `KONNI_SYSTEM_PROMPT` o equivalente en server.py no contiene "representante legal" ni "autorización del representante" |

### 3.2 Frontend

| Acción | Archivo (ruta absoluta) | Cambio |
|---|---|---|
| CREATE | `/Users/cristiang./CONNIKU/shared/legal_texts.ts` | `export const AGE_DECLARATION_V1_TEXT: string`, `export const AGE_DECLARATION_VERSION = '1.0.0'` |
| MODIFY | `/Users/cristiang./CONNIKU/src/pages/Register.tsx` | Paso 3: reemplazar checkbox simple por bloque con los 5 puntos renderizados del texto canónico + leyenda idioma. Validación que no permite submit sin checkbox marcado **y** sin el texto visible (scroll o displayed). Incluir `client_timezone` en payload |
| MODIFY | `/Users/cristiang./CONNIKU/src/services/auth.tsx` | Añadir `client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone` en el payload del registro |
| MODIFY | `/Users/cristiang./CONNIKU/src/services/i18n.tsx` | Actualizar `err.under18` en las 4 idiomas al texto CLAUDE.md: "Conniku es una plataforma exclusiva para personas mayores de 18 años. No podemos procesar tu registro." Agregar claves `age.declarationLegend`, `age.lockedLanguageNotice`, `err.mustScrollDeclaration` |
| CREATE | `/Users/cristiang./CONNIKU/src/pages/GoogleAgeDeclarationModal.tsx` | Modal para caso Google OAuth §2.11 |
| MODIFY | `/Users/cristiang./CONNIKU/package.json` **[FROZEN]** | Agregar devDependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom. Agregar scripts `test`, `test:run`. **Requiere /unfreeze** |
| CREATE | `/Users/cristiang./CONNIKU/vitest.config.ts` | Config mínima con jsdom y setup file |
| CREATE | `/Users/cristiang./CONNIKU/src/__tests__/setup.ts` | import '@testing-library/jest-dom' |
| CREATE | `/Users/cristiang./CONNIKU/src/__tests__/Register.age.test.tsx` | Tests RED (ver §4.2) |
| CREATE | `/Users/cristiang./CONNIKU/src/__tests__/legal_texts_sync.test.ts` | Test que lee `shared/legal_texts.ts` y asserta versión 1.0.0 y no-vacío |

### 3.3 Archivos FROZEN afectados

- `package.json` (FROZEN.md línea 17) — **requiere /unfreeze explícito
  de Cristian antes del builder**. Razón: necesitamos añadir
  devDependencies de testing y scripts nuevos. El cambio es aditivo,
  no modifica lo que ya está protegido (lint-staged config).

No hay otros archivos FROZEN tocados.

### 3.4 Archivos NO tocados (explícito)

- `backend/hr_routes.py` (FROZEN)
- Cualquier `src/pages/*.tsx` listado en FROZEN.md
- `legal/` directorio raíz (no es parte de este bloque; es responsabilidad
  de legal-docs-keeper en bloque posterior)

---

## 4. Plan TDD

Orden estricto RED → GREEN → REFACTOR. Cada test RED debe fallar con
el mensaje correcto antes de escribir código de producción.

### 4.1 Tests RED backend (en orden de escritura)

1. **`test_legal_texts.py::test_age_declaration_text_matches_claude_md`**
   — carga `AGE_DECLARATION_V1_TEXT` y asserta que contiene las 5
   frases clave: `"Soy mayor de 18 años"`, `"son verdaderos"`,
   `"causal inmediata"`, `"Eximo a Conniku SpA"`,
   `"Acepto los Términos y Condiciones"`. Falla RED porque la
   constante no existe.

2. **`test_legal_texts.py::test_age_declaration_hash_matches_text`**
   — asserta que
   `hashlib.sha256(_normalize_legal_text(AGE_DECLARATION_V1_TEXT).encode('utf-8')).hexdigest() == AGE_DECLARATION_V1_HASH`.
   El builder calcula el hash real durante GREEN y lo pega como
   constante.

3. **`test_legal_texts.py::test_normalize_legal_text_collapses_whitespace`**
   — verifica que `_normalize_legal_text("a\r\nb  c\n\n")` == `"a\nb c"`
   (o el resultado esperado según regla §2.3). Casos borde: CRLF,
   espacios dobles, BOM Unicode, NBSP.

4. **`test_legal_texts.py::test_frontend_text_matches_backend`** —
   lee `/Users/cristiang./CONNIKU/shared/legal_texts.ts` como archivo
   de texto, extrae la cadena (regex o simple slicing entre comillas
   de template literal), aplica `_normalize_legal_text`, asserta que
   el hash coincide con `AGE_DECLARATION_V1_HASH`.

5. **`test_user_agreements.py::test_table_has_all_required_columns`**
   — usa `inspect(engine).get_columns("user_agreements")` y asserta
   que están todas: id, user_id, document_type, accepted_at_utc,
   user_timezone, client_ip, user_agent, text_version_hash. Falla
   RED porque la tabla no existe.

6. **`test_register_age.py::test_register_minor_returns_403_with_exact_message`**
   — POST a `/auth/register` con `birth_date` de hace 17 años 364
   días. Asserta status 403 y body contiene exactamente:
   `"Conniku es una plataforma exclusiva para personas mayores de 18 años. No podemos procesar tu registro."`

7. **`test_register_age.py::test_register_minor_age_calc_considers_month_and_day`**
   — caso borde: usuario cumple 18 **mañana**. POST debe retornar
   403. Usuario cumplió 18 **hoy**: POST debe retornar 200 (asume
   el resto del payload OK).

8. **`test_register_age.py::test_register_without_checkbox_returns_400`**
   — POST con `tos_accepted: false`. Asserta 400 y mensaje alineado.

9. **`test_register_age.py::test_register_adult_creates_user_agreement_row`**
   — POST válido. Asserta que se creó una fila en `user_agreements`
   con `user_id == user.id`, `document_type == 'age_declaration'`,
   `text_version_hash == AGE_DECLARATION_V1_HASH`, `accepted_at_utc`
   es reciente (< 5s), `user_timezone` == lo enviado,
   `client_ip != 'unknown'` (en TestClient la IP es `testclient`),
   `user_agent` contiene algo.

10. **`test_register_age.py::test_register_ip_respects_x_forwarded_for`**
    — POST con header `X-Forwarded-For: "203.0.113.5, 10.0.0.1"`.
    Asserta que la fila guardada tiene `client_ip == "203.0.113.5"`.

11. **`test_register_age.py::test_register_ip_rejects_spoof_if_invalid`**
    — POST con `X-Forwarded-For: "not-an-ip"`. Asserta que el backend
    cae al fallback `request.client.host`.

12. **`test_register_age.py::test_register_invalid_timezone_stores_invalid_prefix`**
    — POST con `client_timezone: "Fake/Zone"`. Asserta que la fila
    tiene `user_timezone` prefijado con `"invalid:"` o similar,
    según §2.8.

13. **`test_konni_prompt.py::test_prompt_does_not_mention_representante_legal`**
    — importa `KONNI_SYSTEM_PROMPT` (o similar) de `server.py` y
    asserta que el string no contiene `"representante legal"`,
    `"autorización del representante"`, ni `"tener autorización"`.

14. **`test_register_age.py::test_google_oauth_blocks_when_missing_declaration`**
    — POST a `/auth/google` con usuario nuevo. Asserta que crea al
    usuario pero retorna status que indique `AGE_DECLARATION_REQUIRED`
    (ej. 200 con flag `requires_age_declaration: true`, o 403 con
    código específico; el builder decide cuál expone mejor al
    frontend).

15. **`test_register_age.py::test_complete_age_declaration_endpoint`**
    — flujo: crear user Google sin fila, llamar
    `POST /auth/complete-age-declaration` con birth_date y checkbox.
    Asserta que se crea la fila y que el login siguiente no bloquea.

16. **`test_user_agreements.py::test_legacy_migration_creates_rows_for_existing_users`**
    — inserta 2 usuarios con `tos_accepted_at` poblado, corre
    `migrate()`, asserta que quedaron 2 filas en `user_agreements`
    con `document_type='age_declaration_legacy'` y
    `text_version_hash == AGE_DECLARATION_LEGACY_HASH`.

17. **`test_user_agreements.py::test_legacy_migration_is_idempotent`**
    — correr `migrate()` dos veces. Asserta que no duplica filas.

### 4.2 Tests RED frontend

1. **`Register.age.test.tsx::renders_five_point_declaration_text`**
   — renderiza el paso 3 del formulario, asserta que los 5 puntos
   clave están visibles en el DOM.

2. **`Register.age.test.tsx::submit_button_disabled_without_checkbox`**
   — asserta que el botón "Crear cuenta" está disabled cuando el
   checkbox no está marcado.

3. **`Register.age.test.tsx::calculate_age_considers_month_and_day`**
   — setea birth_date para que el usuario cumpla 18 mañana. Asserta
   que el componente muestra el mensaje de error `err.under18`.
   Caso borde inverso: cumple 18 hoy, no muestra error.

4. **`Register.age.test.tsx::payload_includes_client_timezone`** —
   spy sobre `api.register`, llena el formulario, submit. Asserta que
   el payload enviado incluye `client_timezone` con un string no
   vacío.

5. **`Register.age.test.tsx::error_message_matches_claude_md_exact_text`**
   — asserta que el texto mostrado al detectar menor coincide
   literalmente con "Conniku es una plataforma exclusiva para
   personas mayores de 18 años. No podemos procesar tu registro."

6. **`legal_texts_sync.test.ts::age_declaration_contains_five_semantic_blocks`**
   — verifica que el string exportado contiene las 5 frases clave.

### 4.3 Orden de implementación GREEN

Agrupado por dependencia:

1. **Setup infra testing** (habilita todo lo demás):
   a. Agregar deps a `backend/requirements.txt`, instalar con `pip`.
   b. Crear `backend/pytest.ini`, `backend/tests/__init__.py`,
      `backend/tests/conftest.py`.
   c. `/unfreeze package.json`.
   d. Agregar devDeps vitest al `package.json`, `npm install`.
   e. Crear `vitest.config.ts`, `src/__tests__/setup.ts`.
   f. Verificar que `npm run test:run` y `pytest -q` ambos corren y
      reportan "no tests collected" (sin errores de config).

2. **Constantes y texto compartido**:
   a. Crear `backend/constants/__init__.py` y
      `backend/constants/legal_texts.py` con la función de
      normalización.
   b. Crear `shared/legal_texts.ts` con el texto literal.
   c. Calcular hash real y colocarlo en la constante.
   d. Escribir tests 4.1.1–4.1.4 y 4.2.6 → deben pasar.

3. **Modelo y migración**:
   a. Añadir `UserAgreement` en `database.py`.
   b. Añadir bloque de migración en `migrations.py` (tabla nueva +
      migración retroactiva idempotente).
   c. Escribir tests 4.1.5, 4.1.16, 4.1.17 → deben pasar.

4. **Helper de registro de declaración**:
   a. Crear `backend/legal_routes.py` con
      `record_age_declaration(db, user_id, request, document_type)`.
   b. Usar el helper desde `auth_routes.py` en el flujo de
      `/auth/register`, después de `db.refresh(user)`.
   c. Alinear mensaje de edad (línea 418).
   d. Añadir campo `client_timezone` a `RegisterRequest`.
   e. Añadir helper `_extract_client_ip`.
   f. Escribir tests 4.1.6–4.1.12 → deben pasar.

5. **Prompt Konni**:
   a. Editar `backend/server.py:1078` eliminando la excepción de
      representante legal.
   b. Escribir test 4.1.13 → debe pasar.

6. **Google OAuth**:
   a. En `/auth/google` de `auth_routes.py`, después de crear o
      loguear al usuario, chequear existencia de fila
      `age_declaration` en `user_agreements`. Si falta, retornar
      respuesta con flag `requires_age_declaration: true`.
   b. Crear endpoint `POST /auth/complete-age-declaration` en
      `legal_routes.py` que acepta birth_date + tos_accepted +
      client_timezone, valida edad, registra declaración.
   c. Escribir tests 4.1.14, 4.1.15 → deben pasar.

7. **Frontend**:
   a. Modificar `Register.tsx` paso 3 con el bloque declarativo.
   b. Modificar `auth.tsx` para enviar `client_timezone`.
   c. Actualizar `i18n.tsx` con las claves nuevas y
      `err.under18` alineado.
   d. Crear `GoogleAgeDeclarationModal.tsx` y cablearlo al login
      Google que responde `requires_age_declaration: true`.
   e. Escribir tests 4.2.1–4.2.5 → deben pasar.

### 4.4 Puntos de REFACTOR previsibles

- El helper `_extract_client_ip` puede terminar en
  `security_middleware.py` si `auth_routes.py` no es el único lugar
  que lo usa. Mover solo si hay 2+ call-sites.
- La validación de timezone con `pytz` podría caber en un helper
  compartido si otros endpoints la necesitan.
- El texto con los 5 puntos y el checkbox pueden extraerse a un
  componente `<AgeDeclarationBlock />` si Register.tsx queda muy
  largo.
- Unificar el payload de `/auth/register` y
  `/auth/complete-age-declaration` si comparten lógica de
  registro de declaración.

---

## 5. Riesgos

Clasificados alto / medio / bajo con mitigación.

### 5.1 [ALTO] Migración retroactiva con evidencia reconstruida

**Qué puede salir mal:** los usuarios legacy quedan con fila
`age_declaration_legacy` basada en el `tos_accepted_at` de su
registro, sin el texto original que aceptaron (porque ese texto no
era los 5 puntos sino `t('tos.iAccept')`). En disputa legal, esa fila
tiene valor probatorio débil.

**Mitigación:** legal-docs-keeper debe revisar esta decisión antes
del merge. Alternativa extrema: forzar re-aceptación al siguiente
login. Decisión final la toma Cristian; yo recomiendo la migración
retroactiva con flag explícito porque el downside de forzar
re-aceptación (quejas de usuarios) supera al upside probatorio en
esta fase del producto.

### 5.2 [ALTO] Google OAuth queda con puerta trasera si se descarta §2.11

**Qué puede salir mal:** si Cristian opta por posponer la parte
Google (alternativa B de §2.11), el bloque cierra con un camino real
para que un menor cree cuenta vía Google OAuth sin declaración.

**Mitigación:** si se aplaza, se registra issue crítico en
`registry_issues.md` con SLA de 7 días y se documenta el riesgo en
BLOCKS.md al cerrar el bloque. El siguiente bloque 1.5 debe ser
OAuth.

### 5.3 [MEDIO] `X-Forwarded-For` es spoofable desde clientes

**Qué puede salir mal:** un cliente malicioso envía
`X-Forwarded-For: 1.2.3.4` desde local; si Render lo re-emite,
registramos IP falsa. En evidencia legal, la IP puede no coincidir
con la real.

**Mitigación:** confirmar con Render que su ingress **sobrescribe**
`X-Forwarded-For` en lugar de appendear. Si solo appendea, tomamos
el **último** valor en vez del primero. Test de integración post-
deploy: hacer request a /auth/register desde una IP conocida y
verificar qué quedó en la fila. Este hardening se puede hacer en
Capa 6 (inspección) sin bloquear el cierre del bloque.

### 5.4 [MEDIO] Hash cambia por whitespace o encoding

**Qué puede salir mal:** un editor que reinserte CRLF, o un archivo
guardado en Windows-1252, rompe el match del hash y todos los
registros nuevos quedan inválidos silenciosamente.

**Mitigación:** (a) normalización estricta NFC + colapso de
whitespace (§2.3). (b) test de sync backend/frontend (§4.1.4) corre
en CI. (c) ambos archivos declaran encoding UTF-8 en primera línea
del archivo. (d) pre-commit hook verifica el hash si detecta cambio
en `legal_texts.py` o `legal_texts.ts` (futuro; no incluido en este
bloque).

### 5.5 [MEDIO] CLAUDE.md cambia sin disparar re-aceptación

**Qué puede salir mal:** se edita el texto del checkbox en CLAUDE.md
y alguien actualiza la constante a v1.1.0 sin pedir re-aceptación.
Usuarios que aceptaron v1.0.0 quedan con hash que ya no está vigente,
pero siguen usando la plataforma como si hubieran aceptado la nueva
versión.

**Mitigación:** política explícita documentada en el comentario de
la constante: *"Actualizar `AGE_DECLARATION_CURRENT` requiere plan de
re-aceptación en un bloque separado. No incrementar la versión
silenciosamente."*. Este bloque no implementa re-aceptación; deja la
semilla (columna `document_type`, versionado) preparada.

### 5.6 [MEDIO] Tests de frontend añaden peso significativo a `package.json`

**Qué puede salir mal:** agregar vitest + testing-library + jsdom
puede traer deps transitive y expandir node_modules. Si Vercel build
se ralentiza, afecta workflow de deploy.

**Mitigación:** (a) confirmar que todo va en `devDependencies` (no
va al bundle). (b) medir tiempo de build antes y después en CI. (c)
si el delta supera 30s, considerar usar `@vitest/browser` o
`happy-dom` en lugar de jsdom, más ligero.

### 5.7 [ALTO] Falta de test framework hasta ahora significa que NINGUNA prueba existente valida

**Qué puede salir mal:** el bloque 1 asume que el código actual
funciona como lo describe, pero no hay tests pre-existentes que
garanticen regresión cero al modificar `auth_routes.py`.

**Mitigación:** (a) qa-tester valida manualmente endpoint register
antes de que el builder lo toque (snapshot del comportamiento). (b)
los tests nuevos que se escriben cubren también los caminos
existentes que se modifican (no solo la novedad).

### 5.8 [BAJO] Pytest ve a la app real (no a una instancia aislada)

**Qué puede salir mal:** si los tests no usan una DB aislada en
memoria, contaminan `$HOME/.conniku/conniku.db` local.

**Mitigación:** `conftest.py` crea `sqlite:///:memory:` y hace
`Base.metadata.create_all()` por sesión de test. Monkey-patch del
`engine` si hace falta. El builder lo documenta en el reporte.

### 5.9 [BAJO] Textos i18n para 4 idiomas quedan desincronizados

**Qué puede salir mal:** se actualiza `err.under18` en español pero
se olvida en portugués / francés.

**Mitigación:** test unitario que verifica que la clave existe y no
es `undefined` en los 4 idiomas (ya hay tests posibles con vitest).

### 5.10 [BAJO] Código sin i18n en el checkbox puede romper Google Translate

**Qué puede salir mal:** un usuario con Google Translate en
portugués ve el texto legal traducido por el browser, acepta la
traducción, pero el backend registra el hash del original español.

**Mitigación:** agregar atributo `translate="no"` al bloque del
texto declarativo (HTML5). Browsers modernos lo respetan.

---

## 6. Criterio de terminado (checklist binaria)

Cada ítem es sí/no verificable con un comando o una inspección
concreta. El bloque no cierra hasta que todos estén en sí.

### 6.1 Backend

- [ ] `backend/constants/legal_texts.py` existe y exporta
      `AGE_DECLARATION_V1_TEXT`, `AGE_DECLARATION_V1_HASH`,
      `AGE_DECLARATION_VERSION`, `AGE_DECLARATION_LEGACY_HASH`.
- [ ] `hashlib.sha256(_normalize_legal_text(AGE_DECLARATION_V1_TEXT).encode('utf-8')).hexdigest() == AGE_DECLARATION_V1_HASH` (verificado por test 4.1.2).
- [ ] Tabla `user_agreements` existe en la DB local después de
      correr `python backend/migrations.py`, con columnas exactas:
      id, user_id, document_type, accepted_at_utc, user_timezone,
      client_ip, user_agent, text_version_hash.
- [ ] Índices creados: `(user_id)` y `(user_id, document_type)`.
- [ ] POST /auth/register con adulto + checkbox=true + birth_date
      válido retorna 200 y crea fila en `user_agreements` con los 7
      campos poblados (verificable vía SQL `SELECT * FROM
      user_agreements` después del request).
- [ ] POST /auth/register con menor retorna 403 con mensaje exacto
      de CLAUDE.md.
- [ ] POST /auth/register con `tos_accepted: false` retorna 400.
- [ ] POST /auth/register con header `X-Forwarded-For` registra la
      IP correcta en `client_ip`.
- [ ] POST /auth/register con `client_timezone: "America/Santiago"`
      persiste exactamente ese string.
- [ ] `backend/server.py` no contiene ya las cadenas: "representante
      legal", "autorización del representante".
- [ ] POST /auth/google para usuario nuevo sin declaración retorna
      flag `requires_age_declaration: true`.
- [ ] POST /auth/complete-age-declaration crea fila tipo
      `age_declaration` para usuarios Google.
- [ ] Migración retroactiva crea 1 fila `age_declaration_legacy` por
      cada usuario existente con `tos_accepted_at IS NOT NULL` en la
      primera corrida, y 0 filas nuevas en corridas subsiguientes.
- [ ] `pytest -q backend/tests/` pasa 100%, 0 fallas.
- [ ] `python3 -m ruff check backend/` pasa sin errores.

### 6.2 Frontend

- [ ] `shared/legal_texts.ts` existe y exporta el texto canónico.
- [ ] El formulario de registro muestra los 5 puntos del texto
      legal visibles (no en tooltip ni modal cerrado).
- [ ] El checkbox está desmarcado por defecto (verificable abriendo
      la página en dev y viendo el DOM).
- [ ] El botón "Crear cuenta" está `disabled` cuando el checkbox no
      está marcado.
- [ ] El input `<input type="date">` tiene `max` calculado como la
      fecha de hace exactamente 18 años (verificado vía DOM
      inspector).
- [ ] El payload enviado a `/auth/register` incluye
      `client_timezone` (verificable con devtools Network).
- [ ] El mensaje de error para menor coincide literalmente con el
      texto de CLAUDE.md.
- [ ] El modal Google de completar declaración aparece cuando el
      backend retorna `requires_age_declaration: true`.
- [ ] `npm run test:run` pasa 100%.
- [ ] `npm run typecheck && npm run lint` pasa sin errores.
- [ ] `npm run build` completa sin warnings nuevos.

### 6.3 Seguridad y FROZEN

- [ ] Ningún archivo FROZEN.md fue modificado excepto `package.json`,
      y hubo `/unfreeze package.json` explícito de Cristian
      (timestamp en log).
- [ ] Post-cierre: `package.json` se vuelve a freeze con
      `/freeze package.json`.
- [ ] Hooks de Claude Code (check-frozen, check-lock,
      post-edit-verify) no reportaron bloqueos.
- [ ] No hay credenciales hardcoded (verificado por pre-commit).

### 6.4 Documentación y legal

- [ ] Comentario en `legal_texts.py` indica fuente (CLAUDE.md
      §verificación de edad componente 2), fecha de verificación,
      verificador.
- [ ] legal-docs-keeper generó reporte en
      `docs/legal/weekly-audit-YYYY-MM-DD.md` señalando que:
      (a) TOS v3.0 no incluye el flujo 18+ reforzado (bloque futuro),
      (b) Política de Privacidad no documenta la tabla
      `user_agreements` (bloque futuro).
- [ ] Aprobación humana explícita de Cristian en la Capa 6 después
      de inspección en URL de preview (requerido por componente
      legal).

---

## 7. Fuera de scope (OUT)

Lo siguiente NO entra en este bloque. Está listado explícitamente
para que code-reviewer no lo marque como falta.

1. **Redacción de Términos y Condiciones v3.0** unificados con el
   checkbox de 5 puntos. Responsabilidad del legal-docs-keeper en
   bloque posterior.
2. **Política de Privacidad v3.0** que documente la tabla
   `user_agreements`, sus fines legítimos, plazo de retención (5
   años), exención de eliminación por derecho al olvido. Bloque
   posterior.
3. **Política de Cookies** y banner de consentimiento GDPR. Bloque
   separado.
4. **Mecanismo de detección posterior de menor + eliminación 72h +
   directorio `incidents/legal/`** (CLAUDE.md §Política de
   detección posterior y consecuencias). Bloque separado.
5. **Conflicto del plazo de retracto "corridos vs hábiles"** en
   Ley 19.496. Bloque de monetización / reembolsos.
6. **Reemplazar "APIs de Inteligencia Artificial" en
   `src/data/accountingData.ts`** y el
   `"CONTENIDO IA: Las respuestas generadas por inteligencia
   artificial..."` en `backend/server.py:1088`. Bloque de higiene
   de copy.
7. **Refactor de Alembic**: migrar de `migrations.py` custom a
   Alembic propiamente dicho. Bloque de infra.
8. **Tocar HRDashboard, hr_routes, o cualquier página con
   null-safety protegida** (FROZEN.md).
9. **Rediseñar el flujo onboarding Google** completo. Este bloque
   solo añade el gate de declaración; el resto del onboarding sigue
   como está.
10. **Verificación de identidad real (RUT, documento)**. Según
    CLAUDE.md §Plan de escalamiento, la declaración es suficiente
    hasta que se alcancen 10.000 usuarios activos u otros criterios.
11. **Migración de usuarios Google existentes** que ya iniciaron
    sesión alguna vez sin declaración. El bloque aplica la
    regla solo a partir del próximo login. Para usuarios Google ya
    registrados, la migración retroactiva §2.5 les crea fila legacy.

---

## 8. Componente legal

Este bloque es **legal** (CLAUDE.md §Flujo reforzado para código con
componente legal). Aplican reglas extra:

- Normas citadas: CLAUDE.md §Regla operacional plataforma exclusiva
  para adultos, §Flujo de verificación de edad, §Política de
  detección posterior y consecuencias, §Constantes legales en el
  código. No se citan artículos externos específicos en este bloque
  porque el texto declarativo mismo no lo requiere (mantiene la
  redacción genérica "legislación vigente" según nota explícita de
  CLAUDE.md §verificación de edad).
- **Aplicación literal de la regla "nunca inventar información
  legal":** el punto 3 del checkbox menciona "responsabilidad civil
  y penal según la legislación vigente". CLAUDE.md indica que el
  artículo específico (probablemente Art. 210 Código Penal chileno
  sobre falsedad en declaración jurada) debe ser validado por
  abogado antes de incluirse como cita específica. Este bloque
  mantiene la redacción genérica.
- Constantes legales: `AGE_DECLARATION_V1_TEXT`,
  `AGE_DECLARATION_V1_HASH`, `AGE_DECLARATION_LEGACY_HASH` viven en
  `backend/constants/legal_texts.py` con el formato obligatorio
  (cita de fuente, URL, fecha, verificador).
- Commits afectados deben usar tipo `legal:` (ej:
  `legal(auth): registrar aceptación declaración jurada 18+ con hash SHA-256`).
- **Gate obligatorio:** aprobación humana explícita de Cristian en
  Capa 6 antes de cerrar. Ningún agente puede cerrar solo.
- legal-docs-keeper corre en paralelo a los builders desde Capa 1 y
  emite reporte antes de Capa 4.

---

## Reporte obligatorio de cierre de turno

### Lo que se me pidió

> "Planifica el **Bloque 1 inaugural** del proyecto Conniku bajo el
> protocolo de 7 capas de CLAUDE.md §18. Repositorio:
> /Users/cristiang./CONNIKU. No escribes código de producto en esta
> ejecución, solo el plan."
>
> Título del bloque: `bloque-1-auth-edad`. Scope detallado incluye:
> corregir `backend/server.py:1078`, validar edad en
> `auth_routes.py:412-422`, validar edad en `Register.tsx`, reemplazar
> checkbox actual por 5 puntos oficiales, crear tabla
> `user_agreements`, migración SQL, endpoint de registro de
> aceptación, integración en `/auth/register`, plan TDD explícito,
> criterios de terminado.
>
> Fuera de scope: redactar TOS v3.0, política de privacidad v3.0,
> detección posterior de menor, conflicto retracto, higiene "IA" en
> accountingData, tocar FROZEN sin autorización.
>
> Entregable: `docs/plans/bloque-1-auth-edad/plan.md`.

### Lo que efectivamente hice

- Leí CLAUDE.md completo (foco en §Cumplimiento Legal, §18 Desarrollo
  modular, §19 Auto Mode OFF), FROZEN.md, `.claude/frozen-files.txt`,
  BLOCKS.md.
- Leí archivos relevantes del codebase:
  `backend/server.py` (líneas 1060-1095),
  `backend/auth_routes.py` (líneas 219-290, 380-510, 740-795),
  `backend/database.py` (líneas 1-60),
  `backend/migrations.py` (completo),
  `backend/requirements.txt`,
  `src/pages/Register.tsx` (líneas 72-310, 640-670, 1745-1840),
  `src/services/auth.tsx` (líneas 100-150),
  `src/services/i18n.tsx` (claves legales relevantes),
  `package.json`.
- Confirmé: NO hay framework de test instalado (ni pytest ni vitest).
- Confirmé: `package.json` está en FROZEN.md (bloqueado por hook).
- Confirmé: el flujo Google OAuth crea usuarios sin verificar edad.
- Confirmé: el prompt de Konni en server.py:1078 menciona
  "autorización del representante legal".
- Confirmé: BLOCKS.md está vacío (este es efectivamente el bloque
  inaugural).
- Creé la carpeta `docs/plans/bloque-1-auth-edad/` (no existía).
- Escribí el plan `docs/plans/bloque-1-auth-edad/plan.md` con las 8
  secciones estructurales solicitadas + reporte obligatorio.

### Lo que no hice y por qué

- **No escribí código de producto.** Instrucción explícita del
  usuario.
- **No calculé el hash SHA-256 del texto** porque la regla de
  normalización es una decisión que el builder debe ejecutar al
  implementar. Definí la regla en §2.3 y el test que la verifica en
  §4.1.2; el valor exacto se determina en GREEN.
- **No resolví definitivamente la decisión §2.4 (shared/legal_texts.ts
  vs endpoint dinámico)**, la §2.7 (incluir setup de test frameworks
  o abrir Bloque 0 separado), ni la §2.11 (resolver Google OAuth o
  aplazar). Están marcadas **[REQUIERE OK]** y esperan a Cristian.
- **No consulté al legal-docs-keeper** sobre la decisión §2.5
  (migración retroactiva reconstruida). Queda registrado en Riesgo
  §5.1; debe hacerse en Capa 1 junto al builder.
- **No revisé si el hook `check-frozen.sh` efectivamente bloquea
  `package.json`**. Asumo que sí por estar en `.claude/frozen-files.txt`,
  pero no ejecuté un intento.
- **No instalé vitest ni pytest localmente** para verificar que los
  comandos propuestos (`npm run test:run`, `pytest -q`) funcionan.
  Eso es responsabilidad del builder.

### Incertidumbres

1. **La regla de normalización de §2.3 puede dejar pasar diferencias
   que el hash no capture.** Ejemplo: la diferencia entre comillas
   rectas `"` y tipográficas `"` `"`. CLAUDE.md usa comillas rectas
   en el texto oficial, pero un editor de markdown puede sustituir
   automáticamente al pegar. No añadí una regla explícita de
   reemplazo de comillas tipográficas; si aparece esta falla, el
   builder debe ampliar la normalización y actualizar el hash.

2. **El flujo `/auth/complete-age-declaration` (§2.11) crea un
   endpoint nuevo sin que el frontend actual tenga pantalla para
   él.** El modal `GoogleAgeDeclarationModal` es una propuesta
   mínima; puede que la UX resultante sea fea (el usuario Google
   esperaba loguearse y aparece un modal). Si Cristian rechaza la
   UX en Capa 6, el bloque puede entrar a varias iteraciones.

3. **La decisión §2.5 sobre migración retroactiva con evidencia
   reconstruida puede no resistir escrutinio legal.** Lo documenté
   como Riesgo alto §5.1, pero no tengo certeza sobre qué
   jurisdicción lo invalidaría.

4. **El orden de los tests RED puede ser demasiado optimista.**
   Algunos tests requieren infraestructura previa (p.ej. test 4.1.5
   necesita la tabla creada, test 4.1.4 necesita `shared/legal_texts.ts`
   ya presente). El builder puede necesitar ajustar el orden.

5. **No verifiqué empíricamente que Render reescribe
   `X-Forwarded-For`** y cómo exactamente. Si lo solo appendea, la
   estrategia de §2.9 (tomar el primer valor) es incorrecta en prod.
   Esto se valida en Capa 6 con un request real desde IP conocida.

6. **La expansión del scope a Google OAuth (§2.11) puede hacer este
   bloque demasiado grande para cerrar en una sola iteración de
   7 capas.** Si Cristian prefiere dividir, reemplaza §2.11-A por B
   y se abre Bloque 1.5.
