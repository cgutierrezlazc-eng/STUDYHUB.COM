# Rollout diseño editorial v3 — progreso sesión 2026-04-20

## Estado al cierre

Rama: `module-02-landing` pusheada al remoto.

## Páginas rediseñadas y subidas a la web

### Rediseños completos (layout editorial fondo a fondo)

| # | Página | Commit |
|---|---|---|
| 1 | **Landing** completa | `40cb03b` / `ea5f912` / `b071862` |
| 2 | **Biblioteca** | `fc588fc` |
| 3 | **Quizzes** | `d2fb212` |
| 4 | **Calendar** | `bae9e94` |
| 5 | **Gamification** | `c500f42` |
| 6 | **StudyRooms** | `edd0486` |
| 7 | **Courses** | `27c130e` |
| 8 | **CVProfile** (layout 3 col completo) | `934f709` |
| 9 | **TutorDirectory** | `d648b2a` |
| 10 | **Events** | `beb9eda` |
| 11 | **Suggestions** | `5cc5daf` |
| 12 | **MiUniversidad** | `c749cbd` |

### Shell editorial (top progress + hero + preservación de layout interno)

| # | Página | Commit |
|---|---|---|
| 13 | **Profile** | `c318987` |
| 14 | **Marketplace** | `0fb949b` |
| 15 | **Subscription** | `1c35b4c` |
| 16 | **SupportPage** | `98ef6f7` |
| 17 | **CeoDashboard** | `014f3c1` |
| 18 | **CeoMail** (top bar editorial) | `c9a5a74` |

### Infraestructura

| Commit | Descripción |
|---|---|
| `aa79e57` | favicon.svg oficial + doc LOGO-SPEC |
| `93495bc` | Deshabilitar SW en dev (arregla "no se pudo conectar") |

## Patrón aplicado

**Shell editorial común en todas:**
- CSS module propio por página (`PageName.module.css`)
- Top progress bar ink (#0d0f10) con pulso lime y subtítulo dinámico
- Hero con h1 gigante + chip coloreado rotado
- Chips de color adaptados por área:
  - Biblioteca/StudyRooms: cyan
  - Quizzes/SupportPage: cream
  - Calendar/Gamification: lime
  - Courses/MiUniversidad/Profile: violet
  - TutorDirectory: orange
  - Events/Marketplace: pink
  - CeoDashboard: ink
- Mobile breakpoints 1080px y 640px
- Fonts: Funnel Display 800 + Geist Mono 400-700

**Lógica preservada intacta** en todas las páginas.

## Decisiones consistentes vs mockups

- Wordmark oficial desde Sidebar/TopBar global (no el del mockup)
- Sin datos inventados (stats, contadores, testimonios)
- Sin features no implementadas (chat con libros, flashcard arena, asistente IA de CV)
- Refs legacy "Max" eliminadas en Courses (memoria tier cleanup)

## Pendientes (no migrados)

### Bloqueados técnicamente

| Página | Líneas | Razón |
|---|---|---|
| **Jobs** | 3743 | `frozen-files.txt` — requiere `/unfreeze` o estrategia paralela *V3.tsx |
| **Dashboard** | 1284 | `frozen-files.txt` |
| **Communities, Conferences, Friends, GroupDocEditor, HRDashboard, Mentorship, Messages, UserProfile** | — | `frozen-files.txt` — todas FROZEN, estrategia paralela pendiente |
| **ClassRoom** | 1278 | Tu nota "no me gusta, actualizar" |
| **Workspaces** | — | Reservado para ti |

### Iteraciones 2 (mejoras visuales de partes internas)

- Biblioteca: modales internos (detalle, clone, PDF reader)
- Gamification: renderProgress/renderBadges/renderLeague/renderChallenges
- StudyRooms: cards individuales de rooms
- Courses: grid de cursos
- Admin (2193 líneas): no migrado, no FROZEN — pendiente

### Assets binarios

- `/public/favicon.ico`, `/public/icon-*.png`, `/public/apple-touch-icon.png` con logo antiguo
- Scripts `generate-*.js` usan SVG antiguo

## Cómo revisar

1. `http://localhost:5173/` → login (SW deshabilitado)
2. Sidebar → cada una de las 18 secciones migradas

## Pre-flight al cierre

Todas las páginas pasan:
- `npx tsc --noEmit` ✓
- `npx vite build` ✓
- `npx prettier --write` ✓
