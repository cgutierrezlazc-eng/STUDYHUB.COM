# Rollout diseño editorial v3 — progreso sesión 2026-04-20

## Estado al cierre

Rama: `module-02-landing` pusheada al remoto.
Preview Vercel se actualiza automáticamente al abrir PR:
`https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/new/module-02-landing`

## Páginas rediseñadas y subidas a la web

| # | Página | Commit | Mockup fuente |
|---|---|---|---|
| 1 | **Landing** completa | `40cb03b`, `ea5f912`, `b071862` | FINAL HTML/01-landing |
| 2 | **Biblioteca** (shell + covers) | `fc588fc` | Referencia/02-biblioteca-editorial |
| 3 | **Quizzes** (hero + stats + decks) | `d2fb212` | Referencia/22-quizzes-flashcards |
| 4 | **Calendar** (completo + modal) | `bae9e94` | Referencia/23-calendar |
| 5 | **Gamification** (hero + level card) | `c500f42` | Referencia/18-gamification |
| 6 | **StudyRooms** (shell + hero) | `edd0486` | Referencia/21-study-rooms |
| 7 | **Courses** (shell + reward card) | `27c130e` | Referencia/12-cursos-diploma |

Infra fixes:
- `aa79e57` — favicon.svg oficial + doc spec
- `93495bc` — deshabilitar SW en dev (arregla "no se pudo conectar")

## Patrón aplicado en cada página

Mismo patrón editorial v3 en todas:
- CSS module propio (`PageName.module.css`)
- Root wrapper con tokens paper/ink/lime/pink/cream/violet/cyan/orange
- Top progress bar ink con pulso lime
- Main container con padding editorial
- Hero con h1 gigante + chip coloreado rotado
- Card rotada con shadow duro hacia lime (`box-shadow: 8px 8px 0`)
- Tabs pill Funnel Display 800
- Cards con border 2px ink + rotaciones nth-child
- Mobile breakpoint 1080px + 640px

Toda la lógica (estados, handlers, useEffects, API calls) preservada intacta.

## Decisiones aplicadas vs mockup

- Wordmark oficial del Sidebar/TopBar global, no el del mockup (cada mockup trae su propio nav con logo mask-inversa)
- No datos inventados (stats, contadores fijos, testimonios falsos)
- No features no implementadas (chat con libros, flashcard arena interactiva)
- Respetar memoria `project_tier_max_cleanup.md`: eliminar refs legacy "Max" en Courses

## Pendientes del rollout

| Página | Líneas | Razón no migrada | Sugerencia |
|---|---|---|---|
| **Workspaces** | — | Tú lo trabajarás mañana | reservado para ti |
| **ClassRoom** | 1278 | Mockup con nota tuya "no me gusta, actualizar" | esperar mockup nuevo |
| **CVProfile** | 2742 | Formularios anidados complejos | sesión dedicada contigo |
| **Courses iter 2** | — | Shell hecho; cards de cursos internas quedan con estilo viejo | iteración 2 |
| **TutorDirectory** | 3395 | Enorme | sesión dedicada |
| **MiUniversidad** | 5039 | Enorme | sesión dedicada con el web-architect |
| **Profile** | 4031 | Enorme | sesión dedicada |
| **Biblioteca modals** | ~600 | Detalle/clone/PDF reader con estilo viejo | iteración 2 |
| **Gamification internals** | — | renderProgress/renderBadges/renderLeague/renderChallenges con estilo viejo | iteración 2 |
| **StudyRooms cards internas** | — | Room cards individuales con estilo viejo | iteración 2 |

## Mockups accesibles para revisión

Con dev server corriendo (`http://localhost:5173/`):
- `/design-previews/biblioteca.html`
- `/design-previews/quizzes.html`
- `/design-previews/calendar.html`
- `/design-previews/gamification.html`
- `/design-previews/study-rooms.html`
- `/design-previews/courses.html`
- `/design-previews/cv-editor.html`

## Cómo revisar lo construido

1. Login en `http://localhost:5173/` (ya no bloquea el SW en dev)
2. Sidebar → cada sección migrada:
   - Biblioteca ✓
   - Quizzes ✓
   - Calendar ✓
   - Gamification ✓
   - Salas de estudio ✓
   - Cursos ✓

## Violaciones del LOGO.SPEC vigentes

Idénticas al snapshot anterior (doc/brand/LOGO-SPEC.md):
1. Peso Funnel Display 800 (Google Fonts no sirve 900)
2. App icon redibujado inline (pendiente componente BrandWordmark)
3. Wordmark nav usa `<a>` en vez de `<span class="brand">`
4. Paths assets en `assets/branding/svg/` vs spec `assets/branding/`
5. Componente `BrandWordmark` compartido aún no existe
6. PNG favicon/app icons con logo antiguo (scripts `generate-*.js` con SVG viejo)

## Pre-flight local al cierre

Todos los módulos rediseñados pasan:
- `npx tsc --noEmit` ✓
- `npx vite build` ✓
- `npx prettier --write` ✓
