# Snapshot — Bloque 1 auth+edad CERRADO (Capa 7 completa)

**Fecha**: 2026-04-18 08:00 UTC (≈ 04:00 CLT)
**Autor**: Tori (asistente Conniku)
**Milestone**: cierre formal del primer bloque del protocolo 7 capas

## Bloque cerrado

**bloque-1-auth-edad** — primer bloque inaugural del sistema modular de
Conniku. Cerrado en **1 iteración** (sin correcciones tras inspección
de Cristian en Vercel preview).

## Hash final en main

`9be5079 feat: Bloque 1 auth + edad + user_agreements + saneamiento inicial`

(Squash merge del PR #4, 8 commits consolidados en 1.)

## Qué entró a producción

### Legal / seguridad
- Tabla `user_agreements` con 7 campos probatorios + backfill retroactivo automático para usuarios existentes (`document_type='age_declaration_legacy'`).
- Texto canónico del checkbox declarativo de 5 puntos con hash SHA-256 `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706` (versión 1.0.0).
- Validación edad 18+ en backend email+password y Google OAuth.
- Prompt del asistente Konni sin la excepción "o tener autorización del representante legal".
- Regla producto no-IA: "APIs de Inteligencia Artificial" → "APIs de Asistentes Inteligentes" en panel CEO.
- Webhooks MP y PayPal endurecidos (del PR #2 mergeado 2026-04-17T03:55): fail-closed en producción, anti-replay ±5 min, hmac.compare_digest.

### Frontend
- Register.tsx con checkbox declarativo de 5 puntos antes del TOS.
- Register envía `age_declaration_accepted`, `accepted_text_version_hash` (precargado), `user_timezone` (Intl API).
- `loginWithGoogle` detecta 403 `requires_age_declaration` con alert temporal (modal pendiente).
- Script `scripts/verify-legal-texts-sync.sh` en CI valida que Python y TypeScript mantengan el mismo hash.

### Infra y herramientas
- pytest 8.4.2 + pytest-asyncio + pytest-cov en backend.
- vitest 2.1.9 + @testing-library/react + jsdom en frontend.
- `verify-build.yml` con 2 nuevos steps: Frontend tests vitest y Legal texts sync.
- `backend/constants/__init__.py`, `docs/inspecciones/`, `docs/legal/` scaffolding con README.
- `docs/archive/respaldo-auditoria-rota-candidates.md` catálogo de commits de rama pre-reset.

### Higiene coherencia
- CLAUDE.md §19.1 corregido (comando `/auto` → `Shift+Tab`).
- `.gitignore` con `.claude/worktrees/`, `inventario-reset.txt`, `plan-fase-*.md`.
- Memoria `feedback_identity_check.md` actualizada (Konni → Tori).

## Archivos FROZEN nuevos

Desde este bloque quedan protegidos por `check-frozen.sh`:

- `shared/legal_texts.py` — fuente de verdad del texto canónico y hash. Modificar requiere bump `AGE_DECLARATION_VERSION` + actualizar `.ts` + test CI de sincronía.
- `shared/legal_texts.ts` — espejo frontend con hash hardcoded.
- `scripts/verify-legal-texts-sync.sh` — gate CI que bloquea merge si divergen los hashes.

Total en `FROZEN.md`: 18 entradas (15 previas + 3 del Bloque 1).

## Tests 24/24 verdes en main

- **backend/tests/test_legal_texts_hash.py**: 8
- **backend/tests/test_user_agreement_model.py**: 5
- **backend/tests/test_konni_prompt.py**: 3
- **src/__tests__/legal_texts.test.ts**: 8

## Deploy a producción

- **Vercel** (frontend `conniku.com`): auto-deploy del merge en main ~2 min.
- **Render** (backend `studyhub-api-bpco.onrender.com`): auto-deploy ~3-5 min.
- **Al primer boot del backend**: `migrations.py` crea `user_agreements` y ejecuta backfill retroactivo. Idempotente (NOT EXISTS guard).

## Limpieza post-merge

- Rama `bloque-1-auth-edad-saneamiento` eliminada local y remota.
- Flag `.claude/UNFREEZE_ACTIVE` ya había sido liberado antes del commit final (protección FROZEN restablecida).

## Ramas del repo al cierre

```
Locales:
* main (9be5079)
  respaldo-auditoria-rota (archivada, documentada, pendiente migración selectiva)

Remotas en origin:
  origin/main (9be5079)
```

Todas las ramas obsoletas limpiadas: `claude/hopeful-matsumoto`, `claude/jovial-proskuriakova`, `claude/youthful-hoover-561462`, `develop`, `reset-agents-system`, `rescue/webhook-security-hardening`, y el worktree `youthful-hoover-561462`.

## PRs procesados en esta sesión

| PR | Título | Estado final |
|---|---|---|
| #1 | feat: Enterprise features (pre-reset 2026-04-09) | CERRADO sin merge (rehacer como bloques) |
| #2 | security: endurecer validación de firma en webhooks MP y PayPal | MERGEADO (squash `b8c46f5`) |
| #3 | reset-agents-system (previo a esta sesión) | MERGEADO (2026-04-17) |
| #4 | Bloque 1 auth + edad + user_agreements + saneamiento | MERGEADO (squash `9be5079`) |

## Deuda documentada vigente para bloques futuros

1. **bloque-1-iter-2**: reemplazar el `alert()` de Google OAuth por un `GoogleAgeDeclarationModal` React que capture `date_of_birth` + checkbox de 5 puntos + hash + timezone y reintente `/auth/google`.
2. **Tests de integración end-to-end**: `POST /auth/register` y `POST /auth/google` con TestClient FastAPI (actualmente sólo hay tests unitarios del modelo y helpers).
3. **i18n del texto legal**: cuando se expanda a otros países, requiere traducciones legales validadas por abogado local.
4. **Resumen de deuda anterior (NO de este bloque) que sigue pendiente**: T&C v3.0 unificado, Política de Privacidad v3.0 con Supabase/Firebase/Capacitor/Google, RUT placeholder `77.XXX.XXX-X`, UF/UTM/SIS backend↔frontend, 145 print() → logging, 912 `any` TS, migración Stripe legacy.

## Pendientes para presentar a Cristian cuando pida "pendientes"

- `docs/archive/respaldo-auditoria-rota-candidates.md`: rama pre-reset con commits potencialmente útiles (security Sprint 1, social feed N+1, restrict admin modules, biblioteca adapters).
- Memoria `project_respaldo_auditoria_rota.md`.

## Incertidumbres residuales al cierre

- **Backfill retroactivo en producción**: no tengo confirmación de que corrió exitosamente hasta que Render complete el deploy. Supabase backup diario cubre rollback.
- **Vercel + Render deploy status**: verificables con `gh run list` o consola de cada servicio. Si alguno falla, el bloque está "mergeado en main" pero no "vivo en producción". Cristian o yo podemos verificar en 5-10 min.
- **CI gate de legal-texts-sync**: probado en PR #4, pasó. Si en el futuro alguien edita `.py` o `.ts` sin el otro, el CI falla y bloquea merge.

## Política de cierre aplicada

- Snapshots por hito (acordado 2026-04-18): este es el snapshot del cierre de Capa 7. El anterior (`2026-04-18-0305-snapshot-bloque-1-capa-1.md`) fue el de cierre de Capa 1.
- Auto Mode OFF permanente (CLAUDE.md §19): respetado durante toda la sesión, pedí confirmación explícita antes de merge a main.
