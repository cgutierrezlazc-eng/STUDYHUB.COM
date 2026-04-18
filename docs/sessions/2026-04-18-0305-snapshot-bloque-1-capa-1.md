# Snapshot — Cierre Capa 1 del Bloque 1 (auth + edad + user_agreements)

**Fecha**: 2026-04-18 03:05 CLT
**Autor**: Tori (asistente Conniku)
**Milestone**: fin de Capa 1 del Bloque 1 (camino A ejecutado por Tori directo)

## Milestone cerrado

La Capa 1 (construcción con TDD) del **bloque-1-auth-edad** está completa a nivel código + tests automatizados. Quedan Capas 2 (revisión adversarial), 3 (truth-auditor), 4 (deploy preview), 5 (gap-finder), 6 (inspección humana) y 7 (cierre formal + freeze).

## Qué se construyó

### Backend
- `shared/legal_texts.py` — fuente de verdad del texto canónico del checkbox declarativo (Componente 2 CLAUDE.md). Versión 1.0.0. Hash SHA-256: `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706`.
- `backend/database.py` — modelo `UserAgreement` con los 7 campos probatorios + `document_type` + índice compuesto.
- `backend/migrations/add_user_agreements_table.sql` — migración idempotente + backfill retroactivo para usuarios legacy (`document_type='age_declaration_legacy'`).
- `backend/migrations.py` — extensión que ejecuta el backfill en boot.
- `backend/auth_routes.py`:
  - Helper `_get_client_ip` (respeta X-Forwarded-For).
  - Helper `record_age_declaration` que persiste IP, UA, zona horaria y hash.
  - Nuevos campos `age_declaration_accepted`, `accepted_text_version_hash`, `user_timezone` en `RegisterRequest` y `GoogleAuthRequest`.
  - `POST /auth/register`: valida checkbox + hash canónico, rechaza con 400 si falta/no coincide.
  - `POST /auth/google`: rechaza con 403 + `{requires_age_declaration: true}` si falta data en una cuenta nueva.
- `backend/server.py:1078` — eliminada la frase "(o tener autorizacion del representante legal)" del prompt del chatbot Konni.

### Frontend
- `shared/legal_texts.ts` — espejo del texto + hash hardcoded. `computeHash` usa Web Crypto API.
- `vitest.config.ts` + `src/__tests__/setup.ts` — infraestructura TDD frontend.
- `src/pages/Register.tsx`:
  - Form state extendido con `ageDeclarationAccepted`, `acceptedTextVersionHash` (precargado con hash canónico), `userTimezone` (Intl API).
  - Nuevo checkbox declarativo de 5 puntos visible antes del TOS checkbox existente.
  - `validateStep` exige el checkbox declarativo marcado.
- `src/services/auth.tsx`:
  - `register` envía los 3 campos nuevos.
  - `loginWithGoogle` detecta 403 `requires_age_declaration` con alert temporal (TODO documentado).

### CI
- `.github/workflows/verify-build.yml` — nuevo step `[4/6] Frontend tests - vitest` y `[4/6] Legal texts sync (Python ↔ TypeScript)`.

### Tooling testing
- Backend: pytest 8.4.2 + pytest-asyncio + pytest-cov, SQLite in-memory por test, factory de usuarios.
- Frontend: vitest 2.1.9 + @testing-library/react + @testing-library/jest-dom + jsdom.

## Estado del código

- Rama: `main`
- Último commit: `ad59acb feat(auth): validación de edad 18+ con user_agreements (Bloque 1 parte 2)`
- Commits del bloque:
  - `fa0b090 chore: higiene de coherencia (CLAUDE.md §19, gitignore, accountingData)`
  - `4a4a9c0 feat(auth): infraestructura TDD + modelo UserAgreement (Bloque 1 parte 1)`
  - `ad59acb feat(auth): validación de edad 18+ con user_agreements (Bloque 1 parte 2)`
  - (pendiente) `feat(auth): checkbox declarativo frontend + CI step (Bloque 1 parte 3)`
- Tests: **24/24 verdes** (16 backend + 8 frontend).
- TypeScript: sin errores.
- ESLint: 444 warnings preexistentes (0 errors, ninguno introducido por este bloque).
- Ruff: limpio en archivos tocados.

## Archivos FROZEN nuevos (propuestos)

Cuando la Capa 7 cierre el bloque, se proponen para FROZEN.md:
- `shared/legal_texts.py` (fuente de verdad)
- `shared/legal_texts.ts` (espejo)
- `scripts/verify-legal-texts-sync.sh` (gate CI)

NO proponer FROZEN para `auth_routes.py`, `database.py`, `Register.tsx` ni `server.py` — son archivos que van a evolucionar con bloques posteriores.

## Decisiones tomadas en la sesión

1. **A1** Google OAuth dentro del bloque (gate edad + checkbox post-OAuth).
2. **A2** Instalar pytest+vitest dentro del bloque (requirió `/unfreeze package.json`).
3. **A3** Migración retroactiva con `document_type='age_declaration_legacy'` + hash placeholder.
4. **B4** Archivo compartido `shared/legal_texts.py`/`.ts` + test CI de sincronía.
5. **Camino A** Tori ejecuta Capa 1 directo desde sesión principal (subagentes bloqueados por permisos del harness).
6. **Política de contexto**: snapshots por hito, no por umbral de tokens. Alerta a 500k.

## Próximos pasos

### Para cerrar el bloque (Capas 2-7)

- **Capa 2**: code-reviewer adversarial sobre el diff completo (3 commits desde `fa0b090`).
- **Capa 3**: truth-auditor cruza reportes vs estado real.
- **Capa 4**: merge a rama preview + deploy Vercel preview.
- **Capa 5**: gap-finder sobre el bloque.
- **Capa 6**: Cristian inspecciona en preview. Verificar:
  - Registro email+password con checkbox funciona.
  - Registro menor rechazado con mensaje correcto.
  - Checkbox desmarcado rechazado con mensaje correcto.
  - (Ya sabido incompleto) Google OAuth muestra alert actual, modal pendiente.
- **Capa 7**: merge a main, deploy producción, entrada en BLOCKS.md, FROZEN.md actualizado.

### Deuda documentada para iteraciones futuras

1. **GoogleAgeDeclarationModal** — componente React que se renderiza cuando backend devuelve 403 `requires_age_declaration`. Debe capturar fecha de nacimiento + 5-point checkbox + hash + timezone y reintentar `/auth/google`. Actualmente el usuario ve un `alert()` genérico que le pide usar registro email.
2. **Tests de componente Register** — tests de integración con @testing-library/react del flujo completo (solo hay tests de la capa shared, no del form).
3. **i18n del texto declarativo** — por ahora en español chileno hardcoded. Cuando se expanda a otros países agregar traducciones legales validadas por abogado local.

## Punteros

- Plan original: `docs/plans/bloque-1-auth-edad/plan.md`
- Decisiones aprobadas: `docs/plans/bloque-1-auth-edad/decisiones-aprobadas.md`
- Reportes de auditoría previa: `docs/reports/2026-04-17-2245-*.md`
- Log de higiene: `docs/reports/2026-04-18-higiene-acciones-tori.md`

## Incertidumbres residuales

- **Google OAuth modal** es deuda conocida. Si Cristian inspecciona Google OAuth en preview y decide exigir modal antes de cerrar, Capa 6 regresa a Capa 1 con iteración frontend.
- **Retrocompatibilidad usuarios existentes** aplicada vía backfill, pero si algún abogado decide que la evidencia es débil puede requerir re-aceptación forzada en próximo login (bloque separado, no dentro de este).
- **Tests de integración endpoint** no cubiertos a nivel HTTP. Validé la lógica unitaria (modelo, migración, helper, prompt) pero no `POST /auth/register` end-to-end. En Capa 4/6 con deploy preview se hará curl real.
- **Webhooks MP/PayPal fail-open** sigue pendiente (gap crítico detectado en auditoría, fuera de scope de este bloque).
- **RUT placeholder 77.XXX.XXX-X** sigue en 15 lugares de archivos FROZEN (fuera de scope de este bloque).
