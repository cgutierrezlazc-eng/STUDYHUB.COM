# Plan: bloque-auth-ceo-only-v1

Fecha: 2026-04-20
Autor: web-architect (Tori)
Rama destino: `bloque-legal-consolidation-v2` (PR #21 abierto en
`cgutierrezlazc-eng/STUDYHUB.COM`)
Estado: pendiente de aprobación humana

## 0. COMPONENTE LEGAL DETECTADO

Este bloque toca:

- `backend/auth_routes.py` (endpoint de registro y login, flujo legal
  del Componente 2/3 de verificación de edad y aceptación de textos).
- Tabla `user_agreements` (evidencia probatoria 5 años, CLAUDE.md
  §Verificación de edad - Componente 3).
- Seed SQL con inserciones en `user_agreements` para la cuenta CEO
  con hashes v3.2.

Por §18.7 "flujo-legal" del CLAUDE.md y trigger de Capa 0 legal del
prompt del web-architect: se invoca `legal-docs-keeper` ANTES del
builder para:

1. Verificar que los hashes del seed SQL coinciden exactamente con los
   de `backend/constants/legal_versions.py`:
   - `tos` v3.2.0 → `9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce`
   - `privacy` v2.4.0 → `7a8ba81d0be22cc1deee7d92764baaac1a598a662b84d9ba90043b2a25f63f6c`
   - `cookies` v1.0.0 → `a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9`
   - `age_declaration` v1.0.0 → `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706`
     (TEXT_HASH, no FILE_HASH)
2. Confirmar si una cuenta con `origin='initial_seed'` y sin
   IP/UA/timezone reales constituye evidencia suficiente (Cristian
   acepta el registro como CEO founder, no como usuario externo, pero
   la política es 5 años de retención igual).
3. Aprobación humana explícita de Cristian antes de merge. Gate
   obligatorio §Cumplimiento legal del producto.

Normas aplicables citadas:

- **Ley 19.496 Art. 12 A y 3 bis inciso 2** (Chile): derecho de retracto
  10 días corridos, aceptación previa de términos. Cubierto con seed
  de `user_agreements.tos`.
- **Ley 19.628 Art. 4** (Chile): consentimiento informado para
  tratamiento de datos personales. Cubierto con seed de
  `user_agreements.privacy`.
- **Decreto Supremo 866/2020 Ley 19.496** + **GDPR Art. 7**
  (aplicación reforzada): consentimiento específico para cookies no
  estrictamente necesarias. Cubierto con seed de
  `user_agreements.cookies`.
- **CLAUDE.md §Verificación de edad - Componente 2/3**: declaración
  jurada de mayoría de edad. Cubierto con seed de
  `user_agreements.age_declaration`.

No se cita Código Penal Art. 210 (falsedad en declaración jurada):
la cuenta CEO es de Cristian, founder, no aplica. La cuenta se crea
con `is_over_18=true` y evidencia débil tipo `initial_seed` siguiendo
la convención del backfill legacy del Bloque 1.

## 1. Contexto

### 1.1 Petición original (literal)

> "Planifica el bloque `bloque-auth-ceo-only-v1` … Cristian aprobó
> previamente la Opción C para un esquema de acceso restringido
> durante desarrollo/preview … Cuenta única de CEO `ceo@conniku.com`
> con password real (bcrypt) + flag `PUBLIC_REGISTRATION_ENABLED=false`
> + pre-fill en Login fuera de prod + seed SQL con agreements v3.2."

### 1.2 Archivos leídos

- `/Users/cristiang./CONNIKU/backend/auth_routes.py` líneas 440-570
  (endpoint `POST /auth/register`)
- `/Users/cristiang./CONNIKU/backend/database.py` líneas 55-140
  (modelo `User`)
- `/Users/cristiang./CONNIKU/backend/constants/legal_versions.py`
  completo (hashes canónicos v3.2)
- `/Users/cristiang./CONNIKU/backend/migrations/add_user_agreements_table.sql`
  (schema tabla `user_agreements`)
- `/Users/cristiang./CONNIKU/src/pages/Login.tsx` completo
- `/Users/cristiang./CONNIKU/backend/tests/` (conftest + tests
  existentes para reaccept flow y user_agreement_model)

### 1.3 Hallazgos relevantes del código existente

- **Roles válidos del modelo User (`database.py:130`)**:
  `user | admin | owner | utp`. No existe `ceo`. El seed debe usar
  `owner` (el más cercano a founder). No usar string inventado — rompe
  validaciones existentes.
- **Campo `is_admin` (`database.py:122`)** es Boolean separado del
  `role`. Para CEO se setea `is_admin=true` + `role='owner'`.
- **Bcrypt rounds configurables por env** (`auth_routes.py:44`):
  `BCRYPT_ROUNDS=12` default. El hash del seed se calcula con este
  valor.
- **Schema `user_agreements`** usa `text_version_hash` (NO
  `document_hash`), `accepted_at_utc` (NO `accepted_at`), `client_ip`
  (NO `ip_address`), `user_timezone` (NO `origin`). La petición de
  Cristian usa nombres simplificados; el seed real debe usar los
  nombres correctos del schema.
- **NO existe campo `is_over_18`** en el modelo User. La petición lo
  menciona pero no existe en la tabla. La edad se infiere de
  `birth_date` (string YYYY-MM-DD). El seed debe usar `birth_date` con
  fecha real de Cristian (pedir) o placeholder "1990-01-01" con nota.
- **`AGE_DECLARATION_TEXT_HASH` vs `AGE_DECLARATION_FILE_HASH`**: son
  distintos. `user_agreements` usa `TEXT_HASH`
  (`ca527535...`) porque es lo que se muestra al usuario, no el archivo.
- **No existe tabla `cookie_consents` en el seed de la petición**: el
  Bloque cookie_consent_banner registra consentimientos granulares en
  OTRA tabla (`cookie_consents`, distinta de `user_agreements`). Para
  CEO, basta seed en `user_agreements` con `document_type='cookies'`.
- **Endpoint `POST /auth/login`** (`auth_routes.py:762`) NO usa flag
  de registro público. Login siempre funciona. Correcto, porque el flag
  solo aplica a registro nuevo. La "allowlist" pedida es implícita: el
  CEO logea con login normal.
- **Rate limit existente** en register: 5 por IP por hora
  (`auth_routes.py:450`). El check de flag debe ejecutarse ANTES del
  rate limit para no gastar cuota del rate limiter en requests
  rechazados por flag.
- **PR #21** está abierto en rama `bloque-legal-consolidation-v2` con
  título "legal: consolidación v3.1 + v3.2 post-audit abogado". Este
  bloque se commiteará en la misma rama.

### 1.4 Lo que NO está en el código (pendientes detectados)

- No existe `backend/constants/auth_flags.py` (se crea en este bloque).
- No existe lógica de `hostname` en `Login.tsx` (se agrega).
- No existe `Register.tsx` que maneje 403 del backend con `reason`
  específico (se revisa si existe flujo y se agrega).

## 2. Decisiones

### 2.1 Dónde vive el flag `PUBLIC_REGISTRATION_ENABLED`

Alternativas:

- **A**: Inline en `auth_routes.py` con `os.environ.get(...)` al
  inicio, igual a como está `LEGAL_GATE_ENFORCE`.
- **B**: Archivo dedicado `backend/constants/auth_flags.py` con todas
  las feature flags de auth.
- **C**: Archivo transversal `backend/constants/feature_flags.py` con
  TODAS las flags del proyecto.

**Elegida: B**. Razones:

- Consistente con `constants/legal_versions.py`, `constants/consumer.py`.
- Permite testear el flag sin parchear `os.environ` con mocks que
  rompen tests paralelos (se parchea `auth_flags.PUBLIC_REGISTRATION_ENABLED`).
- Evita el drift de leer env en tiempo de import vs runtime (lección
  del incidente `LEGAL_GATE_ENFORCE` donde el valor se congela al
  import).
- C es prematuro: no hay suficientes flags para justificar un archivo
  transversal.

Criterio aplicado: consistencia con estructura existente + testabilidad.

### 2.2 Lectura de env var: runtime vs import time

Alternativas:

- **A**: Leer `os.environ.get(...)` al nivel de módulo (import time).
- **B**: Leer `os.environ.get(...)` dentro de una función `is_public_registration_enabled()`.

**Elegida: B**. Razones:

- Tests pueden usar `monkeypatch.setenv()` sin reimportar el módulo.
- Si Cristian cambia el env en Render y reinicia el pod, no hay dudas
  de "se reimportó o no".
- Costo: 1 µs por llamada de un `os.environ.get`, despreciable.

### 2.3 Default del flag cuando no está seteado

Alternativas:

- **A**: Default `true` (permisivo, fail-open). Risk: si alguien olvida
  setearlo, el preview queda abierto.
- **B**: Default `false` (restrictivo, fail-closed).

**Elegida: B**. Razones:

- Política de Conniku es "preview cerrado hasta launch oficial".
- Principio fail-closed en seguridad: ausencia de configuración no debe
  abrir el sistema.
- Para launch, Cristian setea explícitamente
  `PUBLIC_REGISTRATION_ENABLED=true` en Render. Acción intencional.

### 2.4 Detección de "no-producción" en frontend

Alternativas:

- **A**: `import.meta.env.MODE === 'development'`.
- **B**: `window.location.hostname !== 'conniku.com'`.
- **C**: Variable de entorno `VITE_PREVIEW_MODE` inyectada por Vercel.

**Elegida: B**. Razones:

- Petición de Cristian es explícita: "hostname !== 'conniku.com'".
- A no funciona en previews de Vercel (son builds de producción).
- C agrega infraestructura (configurar env en Vercel por cada preview).
- Desventaja de B: si algún día Cristian usa `app.conniku.com` o
  similar para el prod real, hay que ajustar. Se acepta y se documenta
  como limitación explícita.

**Lista de hostnames que NO prefillen** (tratan como prod):

- `conniku.com`
- `www.conniku.com`

Todo lo demás (localhost, *.vercel.app, preview-xxx.vercel.app, IPs)
prefilla `ceo@conniku.com`.

### 2.5 Dónde calcular el bcrypt hash del password CEO

Alternativas:

- **A**: Script Python local `scripts/hash_ceo_password.py` que Cristian
  ejecuta y pega el hash en el SQL.
- **B**: Comando inline `python3 -c "import bcrypt; ..."` sin guardar
  script.
- **C**: Endpoint `POST /auth/admin/hash-password` temporal.

**Elegida: A** con caveat. Razones:

- A es reproducible (Cristian puede re-hashear si decide rotar la pass).
- El script NO contiene el password hardcoded: lo pide vía `input()` o
  argumento CLI.
- El script se commitea (es herramienta, no secreto).
- El hash resultante NO se commitea (queda solo en el SQL que Cristian
  ejecuta en Supabase y no se sube al repo).
- B es menos reproducible y difícil de documentar.
- C agrega superficie de ataque (endpoint público aunque sea protegido).

Caveat: `BCRYPT_ROUNDS` en Render debe coincidir con lo que usó
Cristian al generar el hash. Default 12 en ambos lados. Script lo
documenta.

### 2.6 Mensaje del 403 y estructura del error

Alternativas:

- **A**: HTTPException simple con string.
- **B**: HTTPException con `detail={"reason": "public_registration_disabled", "message": "..."}`.

**Elegida: B**. Razones:

- Frontend puede branchear UI según `reason` sin parsear el string
  (i18n, a11y).
- Convención del resto del backend ya usa detail estructurado en varios
  endpoints.

Mensaje exacto:

```json
{
  "reason": "public_registration_disabled",
  "message": "Conniku está en preview cerrado. El registro público estará habilitado al lanzamiento oficial."
}
```

### 2.7 Posición del check del flag dentro de `register()`

Alternativas:

- **A**: Primera línea de la función, antes de rate limit.
- **B**: Después de rate limit (current behavior si se inserta naturalmente).

**Elegida: A**. Razones:

- Si el flag bloquea, el rate limiter no gasta cuota para IPs legítimas
  que intentarán luego cuando se abra.
- Respuesta más rápida al cliente (menos trabajo server-side).
- Símil con el check de `is_disposable_email` que está arriba.

### 2.8 Qué hacer si `Register.tsx` no existe o no maneja 403

Alternativas:

- **A**: Crear pantalla de error bonita si no existe.
- **B**: Modificar `Register.tsx` si existe para mostrar UI amigable
  ante 403 con `reason=public_registration_disabled`.

**Elegida: B** condicional. Razones:

- `Register.tsx` existe (`src/pages/Register.tsx` confirmado). Leer y
  ajustar `handleSubmit` para reconocer el reason y mostrar estado
  "preview cerrado" sin toast genérico de error.

## 3. Archivos a tocar

### 3.1 Backend

| Archivo | Cambio |
|---|---|
| `backend/constants/auth_flags.py` | NUEVO. Función `is_public_registration_enabled() -> bool` que lee env en runtime con default `false`. Docstring con política y referencia a §19.1 CLAUDE.md. |
| `backend/auth_routes.py` | En `register()`, línea 447, agregar check del flag ANTES del rate limit. Raise `HTTPException(403, detail={...})` con estructura de §2.6. Import de `is_public_registration_enabled`. |
| `backend/tests/test_auth_public_registration_flag.py` | NUEVO. Tests unitarios: flag off → 403; flag on → comportamiento normal; detail con reason correcto. |
| `backend/tests/conftest.py` | Revisar si hay fixture de `monkeypatch` del env para auth; si no, agregar. |

### 3.2 Frontend

| Archivo | Cambio |
|---|---|
| `src/pages/Login.tsx` | En el componente, agregar `useEffect` que detecta `window.location.hostname`. Si NO está en `['conniku.com', 'www.conniku.com']`, hacer `setEmail('ceo@conniku.com')` al montar (solo si email está vacío para no pisar input del usuario). Agregar hint visual: `<p>Dev preview — pega tu password de 1Password</p>` condicional al mismo check. |
| `src/pages/Register.tsx` | En `handleSubmit` o equivalente, si la respuesta backend es 403 con `detail.reason === 'public_registration_disabled'`, renderizar componente de estado cerrado en lugar de toast/error genérico. Mensaje amigable + botón "Ir a login". |
| `src/pages/__tests__/Login.test.tsx` (si existe) | Tests de vitest: hostname `localhost` → email prefilled; hostname `conniku.com` → email vacío. |

### 3.3 Scripts y seed

| Archivo | Cambio |
|---|---|
| `scripts/hash_ceo_password.py` | NUEVO. Script que pide password por `input()` (no argumento CLI para evitar historia de shell), calcula bcrypt con rounds 12, imprime solo el hash a stdout. Comentario inicial: "ESTE SCRIPT NO GUARDA NADA EN DISCO. Pega el hash en Supabase SQL Editor y descarta." |
| `docs/plans/bloque-auth-ceo-only-v1/seed_ceo_template.sql` | NUEVO. Template SQL con placeholders `<<BCRYPT_HASH>>`, `<<BIRTH_DATE>>`. Comentarios que explican qué pegar. NO se ejecuta desde el repo; Cristian lo copia, rellena, ejecuta en Supabase. Este archivo se commitea (no tiene secretos, solo placeholders). |
| `docs/plans/bloque-auth-ceo-only-v1/RUNBOOK_CEO_SEED.md` | NUEVO. Pasos que Cristian ejecuta: (1) setear password en 1Password, (2) correr `python3 scripts/hash_ceo_password.py`, (3) copiar hash, (4) abrir template SQL, (5) reemplazar placeholder, (6) pegar en Supabase SQL Editor, (7) verificar con SELECT, (8) destruir el SQL rellenado. |

### 3.4 Documentación

| Archivo | Cambio |
|---|---|
| `docs/legal/changelog.md` (si existe) o `docs/sessions/2026-04-20-bloque-auth-ceo-only-v1.md` | Entrada: "Cuenta CEO creada con agreements v3.2. Flag `PUBLIC_REGISTRATION_ENABLED=false` aplicado a `POST /auth/register`." |
| `README.md` o `docs/env_vars.md` | Documentar env var nueva: nombre, valores válidos, default, impacto. |

## 4. Orden de implementación

1. **Capa 0 legal** (legal-docs-keeper): re-verificar hashes contra
   `backend/constants/legal_versions.py` y aprobar con Cristian que
   seed con `origin='initial_seed'` es aceptable.
2. **Backend Pieza 1**:
   - TDD RED: escribir `test_auth_public_registration_flag.py` con 3
     casos (flag=false → 403 + reason correcto; flag=true → 400 por
     otra razón; detail structure correcto).
   - Correr tests, verificar fallan.
   - Crear `backend/constants/auth_flags.py`.
   - Modificar `backend/auth_routes.py::register` con check.
   - Correr tests, verificar pasan.
   - Refactor si aplica.
3. **Frontend Pieza 3**:
   - TDD RED: test vitest de Login con hostname mock.
   - Modificar `src/pages/Login.tsx` con useEffect de prefill.
   - Modificar `src/pages/Register.tsx` con manejo de 403 reason.
   - Correr tests + `npx prettier --write` sobre archivos tocados.
4. **Pieza 2 seed SQL**:
   - Crear `scripts/hash_ceo_password.py` (no requiere TDD, es one-off).
   - Crear `docs/plans/bloque-auth-ceo-only-v1/seed_ceo_template.sql`.
   - Crear `RUNBOOK_CEO_SEED.md` con pasos.
   - Cristian ejecuta offline (no en CI, no en repo).
5. **Pieza 4 tests E2E** (qa-tester):
   - Con backend local + flag=false, curl POST /auth/register → 403.
   - Con backend local + flag=true + payload válido → 201.
   - Con frontend preview y hostname fake → email prefilled.
   - Cristian valida en Vercel preview tras deploy.
6. **Pre-flight** (§23):
   - `npx tsc --noEmit`
   - `npx eslint src/`
   - `npx vitest run`
   - `npx vite build`
   - `python3.11 -m pytest backend/ --tb=no -q`
   - `python3.11 -m ruff check backend/`
7. **Commits al PR #21**:
   - Commit 1: `feat(auth): flag PUBLIC_REGISTRATION_ENABLED para cerrar registro en preview`
   - Commit 2: `feat(auth): prefill email CEO en Login fuera de producción`
   - Commit 3: `docs(auth): runbook y template de seed CEO`
   - Push a `bloque-legal-consolidation-v2`.
8. **Cristian ejecuta seed** en Supabase manualmente (offline, fuera
   del repo).
9. **Capa 6 humana**: Cristian hace login en preview con
   `ceo@conniku.com` + password pegada, y verifica que `POST /auth/register`
   rebota con 403 amigable.
10. **Gate legal**: Cristian aprueba explícitamente antes de merge del PR.

## 5. Criterio de terminado

Todos deben marcarse como cumplidos:

- [ ] `backend/constants/auth_flags.py` existe con función
  `is_public_registration_enabled()` y retorna `False` cuando env var
  no está seteada.
- [ ] `POST /auth/register` con `PUBLIC_REGISTRATION_ENABLED=false`
  retorna HTTP 403 con `detail.reason == "public_registration_disabled"`
  (test automatizado verde).
- [ ] `POST /auth/register` con `PUBLIC_REGISTRATION_ENABLED=true` pasa
  el check y procede al flujo normal de validación (test automatizado
  verde).
- [ ] `Login.tsx` con hostname `localhost` o `preview-*.vercel.app`
  prefilla email `ceo@conniku.com` (test vitest o inspección manual).
- [ ] `Login.tsx` con hostname `conniku.com` NO prefilla nada (test o
  inspección manual).
- [ ] `Register.tsx` con respuesta 403 + reason correcto muestra UI
  amigable "preview cerrado" (inspección manual).
- [ ] `git grep -F "7yvKU7xxVjy2QOjw8rtKbyBBBqLMGR84"` retorna vacío en
  toda la historia de la rama.
- [ ] `git grep -iE "password\s*=\s*['\"][A-Za-z0-9]{20,}"` no detecta
  patrones sospechosos en archivos committed.
- [ ] `scripts/hash_ceo_password.py` existe, corre sin error con
  password de prueba, emite hash bcrypt válido.
- [ ] `seed_ceo_template.sql` existe y solo contiene placeholders, no
  hash real.
- [ ] `RUNBOOK_CEO_SEED.md` tiene los 8 pasos documentados.
- [ ] Pre-flight completo verde (todos los comandos §23 con exit 0).
- [ ] Commits pusheados al PR #21 con mensajes descriptivos en español
  imperativo.
- [ ] **legal-docs-keeper** aprobó compatibilidad con hashes v3.2 y
  política de evidencia `initial_seed`.
- [ ] **Cristian aprobó humanamente** el merge (gate legal obligatorio,
  §Cumplimiento legal del producto).
- [ ] Cristian ejecutó el seed SQL en Supabase y confirmó con SELECT
  que la cuenta `ceo@conniku.com` existe con 4 filas en
  `user_agreements` (tos, privacy, cookies, age_declaration).
- [ ] Cristian logeó exitosamente en preview de Vercel con la cuenta
  CEO.
- [ ] Cristian confirmó que un intento de registro en preview rebota
  con UI amigable.

## 6. Riesgos

### 6.1 Alto

- **R-1: Hash bcrypt con rounds distintos entre local y Render.**
  Si Cristian genera el hash en local con `BCRYPT_ROUNDS=10` y Render
  está con `BCRYPT_ROUNDS=12`, el login FUNCIONA igual (bcrypt guarda
  los rounds en el hash), pero si Cristian rota la pass usando el
  mismo script con rounds distintos al env de Render, puede haber
  inconsistencia en hashing de nuevos usuarios (no aplica a verify).
  Mitigación: RUNBOOK_CEO_SEED.md documenta que el script usa rounds
  fijos 12. Render debe tener `BCRYPT_ROUNDS=12` (ya es el default).

- **R-2: Pass de CEO en historia de shell.**
  Si Cristian pasa el password por argumento CLI al script, queda en
  `~/.zsh_history`. Mitigación: el script usa `getpass.getpass()` (no
  `input()`, corrección respecto a §2.5) que no hace echo y no toca
  historial.

- **R-3: Hash bcrypt del CEO se commitea por accidente.**
  Si Cristian edita el template SQL en local y hace `git add .`, podría
  subir el hash. Mitigación: (a) el template vive en
  `docs/plans/bloque-auth-ceo-only-v1/seed_ceo_template.sql` con
  comentario "NO EDITAR ESTE ARCHIVO, USAR COPIA LOCAL";
  (b) añadir `*_filled.sql` a `.gitignore`; (c) pre-commit hook ya
  detecta patrones de bcrypt hash según §Capas mecánicas.

### 6.2 Medio

- **R-4: Flag no seteado en Render en deploy siguiente.**
  Si el env var no se configura en Render dashboard, por §2.3 el
  default es `false` y todos los registros públicos quedan bloqueados,
  lo que es el comportamiento deseado en preview pero pueden olvidarlo
  al lanzamiento oficial. Mitigación: añadir en `docs/env_vars.md` una
  fila "PUBLIC_REGISTRATION_ENABLED — cambiar a `true` en launch
  oficial, NO antes".

- **R-5: Prefill email en Login pisa input del usuario.**
  Si otro usuario staff entra al preview y escribe su propio email,
  un re-render del useEffect podría pisar. Mitigación: setEmail solo si
  `email === ''` (estado inicial), no en updates.

- **R-6: Role `owner` vs rol esperado `ceo`.**
  La petición menciona `role='ceo'` pero el schema no lo soporta. Si
  algún día se agrega `ceo` al enum, el seed quedará con `owner`.
  Mitigación: aceptar `owner` por ahora (mayor privilegio disponible),
  documentar en BLOCKS.md.

### 6.3 Bajo

- **R-7: UI de 403 en Register con i18n no traducida.**
  El mensaje "Conniku está en preview cerrado..." solo existe en
  español. Si Conniku algún día se usa en inglés antes del launch, el
  mensaje queda en español. Mitigación: aceptar; no hay usuarios
  angloparlantes en preview.

- **R-8: Test vitest de hostname requiere mock específico.**
  `window.location.hostname` no es trivialmente mockeable en jsdom.
  Mitigación: usar `Object.defineProperty(window, 'location', ...)` o
  vitest-environment-jsdom con `testEnvironmentOptions`. Si se complica,
  el frontend-builder puede decidir no testear este caso y validar en
  Capa 6 visual.

## 7. Fuera de scope

- **Verificación de identidad del CEO** (documento RUT, selfie,
  biometría). Esto es para un bloque posterior cuando se escalen los
  criterios del §Plan de escalamiento de verificación de edad.
- **Allowlist extendida** (múltiples cuentas staff autorizadas durante
  preview). La petición es cuenta ÚNICA. Si en el futuro se necesita
  staff adicional, es otro bloque.
- **UI de admin para rotar password del CEO**. Por ahora Cristian
  rota manualmente re-ejecutando el script y actualizando Supabase.
- **2FA / MFA para cuenta CEO**. Out of scope. Aunque deseable, no es
  parte de la "Opción C" aprobada.
- **Migración de datos existentes**. No hay usuarios existentes que
  migrar; la cuenta CEO es nueva.
- **Bypass de `is_disposable_email`** para dominios corporativos. No
  aplica, `conniku.com` no es disposable.
- **Modificar endpoints `POST /auth/google`**. El flujo OAuth Google
  para registro queda también bloqueado implícitamente (el handler
  crea users; debe respetar el flag igual). Decisión a confirmar con
  Cristian en sección de decisiones pendientes (ver §9).
- **Mockups visuales de la UI de 403 en Register**. El frontend-builder
  decide el estilo siguiendo el design system existente.

## 8. Componente legal

### 8.1 Normas citadas con artículo específico

- **Ley 19.628 Art. 4** (Chile, Protección de la Vida Privada):
  consentimiento informado para tratamiento de datos personales. La
  cuenta CEO debe tener `user_agreements.privacy` aceptado antes de
  operar.
- **Ley 19.496 Art. 12 A** (Chile, Protección del Consumidor):
  aceptación previa de términos. Seed de `user_agreements.tos`.
- **Decreto Supremo 866/2020 Ley 19.496** + **GDPR Art. 7** (estándar
  superior): consentimiento específico para cookies. Seed de
  `user_agreements.cookies`.
- **CLAUDE.md §Verificación de edad - Componente 2/3**: declaración de
  mayoría de edad. Seed de `user_agreements.age_declaration`.

### 8.2 Constantes a usar (cita literal desde `legal_versions.py`)

- `TOS_VERSION = "3.2.0"` + `TOS_HASH = "9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce"`
- `PRIVACY_VERSION = "2.4.0"` + `PRIVACY_HASH = "7a8ba81d0be22cc1deee7d92764baaac1a598a662b84d9ba90043b2a25f63f6c"`
- `COOKIES_VERSION = "1.0.0"` + `COOKIES_HASH = "a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9"`
- `AGE_DECLARATION_VERSION = "1.0.0"` + `AGE_DECLARATION_TEXT_HASH = "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706"`

**Nota crítica**: la petición original menciona "hashes v3.2" pero
`privacy` es v2.4.0 y `cookies` es v1.0.0 y `age_declaration` es v1.0.0.
Solo `tos` es v3.2.0. El template SQL debe usar las versiones
individuales de cada documento, no v3.2.0 universalmente. El
legal-docs-keeper valida esto en Capa 0.

### 8.3 Documentos a actualizar

- **Ninguno de los documentos de `docs/legal/v3.2/`** cambia. Este
  bloque solo consume sus hashes canónicos para seed.
- **`docs/env_vars.md`** (o equivalente): documentar
  `PUBLIC_REGISTRATION_ENABLED` con política de default y quién la
  flipea.
- **`BLOCKS.md`**: agregar entrada al cerrar bloque.

### 8.4 Gate humano obligatorio

Sin excepción, antes del merge de PR #21 tras este bloque:

1. legal-docs-keeper emite reporte de auditoría.
2. Cristian lee el reporte y responde explícitamente "aprobado".
3. Recién entonces se hace merge.

Esto es regla dura §Cumplimiento legal del producto y §18.7 flujo
legal.

## 9. Decisiones pendientes para Cristian (batch §21)

Al final del bloque, Cristian responde con letras (ej: "1A 2B 3A"):

1. **OAuth Google y el flag**:
   ¿`POST /auth/google` debe respetar el flag `PUBLIC_REGISTRATION_ENABLED`
   para NO crear cuentas nuevas vía Google cuando el flag está off?
   - A) Sí, bloquear también (consistencia)
   - B) No, Google siempre funciona (Cristian podría querer usar su
     cuenta Google staff)
   - C) Bloquear solo si el email resultante no es `ceo@conniku.com`
     (allowlist por email)
   - **Recomendación: A** (consistencia + fail-closed)

2. **Birth date del CEO en seed**:
   ¿Qué fecha usa el seed?
   - A) Fecha real de Cristian (la proporciona offline, no en el repo)
   - B) Placeholder `1990-01-01` con nota "ajustar manualmente"
   - C) `NULL` si el schema lo acepta
   - **Recomendación: A** (datos reales, la fila es del founder)

3. **Username del CEO**:
   ¿Qué username asignar?
   - A) `ceo`
   - B) `cristian`
   - C) `cgutierrezlazc`
   - **Recomendación: A** (corto, claro, calza con rol)

4. **Commit strategy**:
   - A) 3 commits separados (flag backend, prefill frontend, docs seed)
   - B) 1 commit único con todo
   - **Recomendación: A** (cada commit es intención clara, reverts
     más fáciles)

5. **Tests vitest de hostname en Login**:
   - A) Escribir test (TDD estricto)
   - B) Skipear test, validar solo en Capa 6 visual
   - **Recomendación: A** si no complica; B como fallback

## 10. Notas operativas

- Este bloque NO usa `flujo-rapido` aunque sea corto. Tiene componente
  legal, por tanto `flujo-legal` o flujo completo §18.3 con Capa 0
  legal añadida.
- El seed SQL corre UNA VEZ en vida del proyecto. Si se rompe y hay
  que re-correr, Cristian primero debe `DELETE FROM users WHERE email
  = 'ceo@conniku.com'` (CASCADE borra agreements).
- `check-lock.sh` puede no detectar que hay otra sesión paralela
  (memoria §Paralelismo entre Claudes). Antes de empezar el builder,
  verificar `git status` y branch actual.
- PR #21 ya tiene commits de `legal: consolidación v3.1 + v3.2` y el
  snapshot de cierre. Los commits nuevos de este bloque se agregan
  ahí sin rebase.

---

**Ruta del plan**: `/Users/cristiang./CONNIKU/docs/plans/bloque-auth-ceo-only-v1/plan.md`

**Estado**: esperando aprobación de Cristian antes de invocar al
backend-builder y frontend-builder.
