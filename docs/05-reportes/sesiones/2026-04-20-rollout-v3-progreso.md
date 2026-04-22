# Rollout diseño editorial v3 — progreso sesión 2026-04-20

## Estado al cierre

**Rama `module-02-landing`** pusheada al remoto con 33 páginas rediseñadas.

**`main` en producción (conniku.com)**:
- Fix CORS mergeado (`cce7fe4`) — previews Vercel aceptados
- UnderConstruction mergeado (`0cd73b3`) — conniku.com muestra "Estamos subiendo el nuevo Conniku"

## Páginas rediseñadas (33)

### Rediseños completos (layout fondo a fondo)

| # | Página | Commit |
|---|---|---|
| 1 | Landing | `40cb03b` / `ea5f912` / `b071862` |
| 2 | Biblioteca | `fc588fc` |
| 3 | Quizzes | `d2fb212` |
| 4 | Calendar | `bae9e94` |
| 5 | Gamification | `c500f42` |
| 6 | StudyRooms | `edd0486` |
| 7 | Courses | `27c130e` |
| 8 | CVProfile (layout 3 col) | `934f709` |
| 9 | TutorDirectory | `d648b2a` |
| 10 | Events | `beb9eda` |
| 11 | Suggestions | `5cc5daf` |
| 12 | MiUniversidad | `c749cbd` |
| 13 | Login (layout 2 col FINAL HTML) | `a642b8f` |
| 14 | Register (layout 2 col FINAL HTML) | `f9da939` |
| 15 | NotFound | `6ce9077` |

### Shell editorial (top progress + hero + preservación layout interno)

| # | Página | Commit |
|---|---|---|
| 16 | Profile | `c318987` |
| 17 | Marketplace | `0fb949b` |
| 18 | Subscription | `1c35b4c` |
| 19 | SupportPage | `98ef6f7` |
| 20 | CeoDashboard | `014f3c1` |
| 21 | CeoMail | `c9a5a74` |
| 22 | Admin | `e934bb8` |
| 23 | Feed | `d381611` |
| 24 | Search | `3c55772` |
| 25 | AIWorkflows | `71a016a` |
| 26 | StudyPaths | `0c187cb` |
| 27 | DeleteAccount | `f999082` |
| 28 | TermsOfService | `0d7004a` |
| 29 | PrivacyPolicy | `900487d` |
| 30 | CertVerify | `1ce8993` |
| 31 | PublicTutorPage | `0c1e046` |
| 32 | MyTutorDashboard | `2910e0a` |
| 33 | CommunityView | `605e308` |

### Producción

- **UnderConstruction** (`0cd73b3` en main) — conniku.com lo muestra ahora

### Infraestructura

| Commit | Descripción |
|---|---|
| `aa79e57` | favicon.svg oficial + doc LOGO-SPEC |
| `93495bc` | SW deshabilitado en dev |
| `cce7fe4` | CORS regex `*.vercel.app` (mergeado a main) |

## Pendientes

### Bloqueados (FROZEN)
Jobs, Dashboard, Communities, Conferences, Friends, GroupDocEditor, HRDashboard, Mentorship, Messages, UserProfile

### No tocados
- ClassRoom (tu nota "no me gusta, actualizar")
- Workspaces (reservado para ti)
- InfoPages (múltiples sub-exports — AboutPage, EnterprisePage, SafetyPage, etc. — requiere sesión dedicada)
- LandingProposals (página admin/demo interna, no expuesta)

### Assets binarios
PNG favicon/app icons con logo antiguo — scripts `generate-*.js` usan SVG viejo. Bloque separado.

## URLs

- **PR rollout**: https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/16
- **PR #17 CORS**: mergeado (`cce7fe4`)
- **PR #18 UnderConstruction**: mergeado (`0cd73b3`)
- **Preview Vercel**: `https://studyhub-com-git-module-02-e67d39-cgutierrezlazc-9346s-projects.vercel.app`

## Usuario de prueba

- Email: `testing-cristian-1776705924@conniku.com`
- Password: `TestCristian2026!`

## Cuando quieras restaurar landing completa

Mergear `module-02-landing` a main → conniku.com pasa de UnderConstruction a la landing rediseñada completa con acceso a las 33 páginas editoriales.

## Pre-flight al cierre

- `npx tsc --noEmit` ✓
- `npx vite build` ✓
- `npx prettier --write` ✓
