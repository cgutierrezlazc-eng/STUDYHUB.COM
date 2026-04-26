# FROZEN — Codigo Protegido

> **Regla:** Todo archivo/funcion en esta lista fue confirmado como funcional por Cristian.
> Para modificarlo se requiere autorizacion EXPLICITA de Cristian.
> Claude DEBE revisar este archivo ANTES de cada edicion.

## Como funciona
- Cristian confirma que algo funciona → se agrega aqui con `/freeze`
- Cristian autoriza modificar algo congelado → se remueve con `/unfreeze`
- Si Claude intenta editar un archivo congelado sin autorizacion → el hook lo BLOQUEA

## Archivos Congelados

| Archivo | Seccion | Confirmado | Nota |
|---------|---------|------------|------|
| `.husky/pre-commit` | completo | 2026-04-14 | Fix lint-staged: ruff separado del stash |
| `package.json` | lint-staged config | 2026-04-14 | Removido backend/**/*.py de lint-staged |

| `src/pages/Messages.tsx` | null-safety | 2026-04-14 | 5 Array.isArray guards |
| `src/pages/Friends.tsx` | null-safety | 2026-04-14 | 4 Array.isArray + 5 optional chaining |
| `src/pages/Mentorship.tsx` | null-safety | 2026-04-14 | 3 fixes (setMentors, subjects.map) |
| `src/pages/GroupDocEditor.tsx` | null-safety | 2026-04-14 | 3 fixes (setVersions, setChatMessages, doc.color) |
| `src/pages/Dashboard.tsx` | null-safety | 2026-04-14 | 2 fixes (activityFeed, calendarEvents) |
| `src/pages/Communities.tsx` | null-safety | 2026-04-14 | 1 fix (setTrending) |
| `src/pages/Conferences.tsx` | null-safety | 2026-04-14 | 1 fix (setProjects) |
| `src/pages/UserProfile.tsx` | null-safety | 2026-04-14 | 3 fixes (setFriendsList, setActivityFeed, setComments) |
| `src/pages/Jobs.tsx` | null-safety | 2026-04-14 | Null-safety en cv.competencies (3 fixes) |
| `.gitignore` | iCloud rules | 2026-04-14 | Regla para ignorar duplicados iCloud |
| `src/admin/tools/BibliotecaDocumentos.tsx` | hooks order | 2026-04-16 | Guard movido después de hooks (rules-of-hooks fix) |
| `src/pages/HRDashboard.tsx` | completo | 2026-04-22 | 9 botones HR + rules-of-hooks fix. RUT corregido 2026-04-22 (78.395.702-7). |
| `backend/hr_routes.py` | completo | 2026-04-16 | 53 rutas, 3 generadores PDF legales (Anexo, Pacto HE, Descuento Vol.) |
| `shared/legal_texts.py` | completo | 2026-04-18 | bloque-1-auth-edad: fuente de verdad del texto canónico + hash SHA-256. Editar requiere bump AGE_DECLARATION_VERSION y actualizar espejo .ts (test CI valida sincronía) |
| `shared/legal_texts.ts` | completo | 2026-04-18 | bloque-1-auth-edad: espejo TypeScript del texto canónico. Hash hardcoded debe coincidir con shared/legal_texts.py |
| `scripts/verify-legal-texts-sync.sh` | completo | 2026-04-18 | bloque-1-auth-edad: gate CI que valida sincronía hash Python↔TS. Si divergen, bloquea merge |
| `backend/workspaces_export.py` | completo | 2026-04-19 | hardening-c1-ssrf: whitelist dominios + blacklist RFC1918/link-local/loopback + HTTPS-only + timeout 5s + cap 5MB. Editar = riesgo SSRF. |
| `backend/workspaces_athena.py` | completo | 2026-04-19 | bloque-2c: rate-limit Athena + cuotas Free/Pro + integración Anthropic. Editar sin auditoría = riesgo de regresión en cupo LLM. |
| `src/pages/Landing/Landing.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1: landing v3 canónica editorial. |
| `src/pages/Landing/Landing.module.css` | completo | 2026-04-20 | bloque-rollout-v3-ola-1: estilos v3 de landing. |
| `src/pages/Landing/sections/HeroSection.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1 |
| `src/pages/Landing/sections/ProductSection.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1 |
| `src/pages/Landing/sections/HowSection.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1 |
| `src/pages/Landing/sections/PricingSection.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1 |
| `src/pages/Landing/sections/AppSection.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1 |
| `src/pages/Landing/sections/BusinessPanel.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1 |
| `public/favicon.svg` | completo | 2026-04-20 | bloque-rollout-v3-ola-1: favicon oficial LOGO.04 |
| `docs/brand/LOGO-SPEC.md` | completo | 2026-04-20 | bloque-rollout-v3-ola-1: spec canónica del logo |
| `src/pages/UnderConstruction.tsx` | completo | 2026-04-20 | bloque-rollout-v3-ola-1: landing pública temporal + acceso discreto CEO |
| `src/components/LanguageSwitcher.tsx` | completo | 2026-04-26 | language-switcher-start: trigger pill + popup grid 2×3 con ARIA + keyboard nav + focus management. Acepta props `ariaLabel?` y `title?` para no acoplar al hook useI18n. |
| `src/components/LanguageSwitcher.module.css` | completo | 2026-04-26 | language-switcher-start: z-index 300 (margen sobre máximo del scope Start.module.css = 200), animación fade+scale 120ms, media query mobile 480px. |
| `src/components/LanguageSwitcher.test.tsx` | completo | 2026-04-26 | language-switcher-start: 6 tests vitest jsdom (TDD RED→GREEN). Cubre selección, open/close, ESC, click fuera. Focus/keyboard nav verificados manualmente en Capa 6 (no en jsdom por D10). |
