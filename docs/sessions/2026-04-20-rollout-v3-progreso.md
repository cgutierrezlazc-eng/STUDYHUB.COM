# Rollout diseño editorial v3 — progreso sesión 2026-04-20

## Estado al cierre

Rama: `module-02-landing` pusheada al remoto.

URL PR: `https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/new/module-02-landing`

## Páginas rediseñadas y subidas a la web

| # | Página | Commit | Alcance | Mockup |
|---|---|---|---|---|
| 1 | **Landing** completa | `40cb03b`, `ea5f912`, `b071862` | Enlaces + fonts + peso 800 | FINAL HTML/01-landing |
| 2 | **Biblioteca** | `fc588fc` | Shell + covers coloreados + BookCard/Row editorial | Referencia/02-biblioteca |
| 3 | **Quizzes** | `d2fb212` | Hero + stats card rotada + tabs pill + stats tab | Referencia/22-quizzes |
| 4 | **Calendar** | `bae9e94` | Shell completo + modal editorial + grid días | Referencia/23-calendar |
| 5 | **Gamification** | `c500f42` | Hero + level card rotada con datos reales | Referencia/18-gamification |
| 6 | **StudyRooms** | `edd0486` | Shell + hero + empty state editorial | Referencia/21-study-rooms |
| 7 | **Courses** | `27c130e` | Shell + reward card + tabs | Referencia/12-cursos |
| 8 | **CVProfile** | `934f709` | **Rediseño completo 3 col** (sidebar + cv-paper + aside) | Referencia/16-cv-editor |
| 9 | **TutorDirectory** | `d648b2a` | Shell + info card pago intermediado | Referencia/13-tutores |
| 10 | **Events** | `beb9eda` | Shell + hero pink + tabs pill | (adaptado, sin mockup dedicado) |
| 11 | **Suggestions** | `5cc5daf` | Shell + hero cyan | (adaptado) |

Infra:
| Commit | Descripción |
|---|---|
| `aa79e57` | favicon.svg oficial + doc LOGO-SPEC |
| `93495bc` | Deshabilitar SW en dev (arregla "no se pudo conectar") |
| `bb310f1`, `db11d16`, (actual) | Snapshots de progreso |

## Patrón aplicado

- **CSS module propio** por página (`PageName.module.css`)
- **Root wrapper** editorial: `background: paper`, font `Funnel Display`, `margin: 0 -20px`
- **Top progress bar** ink con pulso lime y subtítulo dinámico
- **Hero editorial** con h1 gigante + chip coloreado rotado
- **Card rotada** con shadow duro hacia lime (`box-shadow: 8px 8px 0`)
- **Tabs pill** Funnel Display 800
- **Mobile breakpoints** 1080px y 640px

Toda la lógica preservada (estados, handlers, useEffects, API calls).

## Decisiones consistentes vs mockup

- Wordmark oficial desde Sidebar/TopBar global, no el del mockup (mask invertida)
- Sin datos inventados (stats, contadores, testimonios)
- Sin features no implementadas (chat con libros, flashcard arena interactiva)
- Refs legacy "Max" eliminadas en Courses (memoria tier cleanup)

## Pendientes (no migrados en esta sesión)

### Bloqueados por complejidad JSX

| Página | Líneas | Razón |
|---|---|---|
| **MiUniversidad** | 5039 | Tiene múltiples `return` internos (render functions) que rompieron al envolver con `<main>`. Intento de envolver revertido. Requiere refactor a subcomponentes antes del rediseño. |
| **Profile** | 4031 | Mismo patrón: múltiples returns internos. Riesgo alto sin refactor previo. |
| **Jobs** | 3743 | Flujo complejo de ofertas laborales. Requiere sesión dedicada. |
| **ClassRoom** | 1278 | Mockup con nota tuya "no me gusta, actualizar". Esperar nuevo mockup. |

### Reservados

| Página | Razón |
|---|---|
| **Workspaces** | Me indicaste que la trabajas tú mañana |

### Iteraciones 2 (mejoras visuales de partes internas)

- Biblioteca: modal detalle, modal clone-to-workspace, PDF reader overlay (~600 líneas, funcionales, estilo viejo)
- Gamification: renderProgress, renderBadges, renderLeague, renderChallenges internos
- StudyRooms: cards individuales de rooms
- Courses: grid de cursos, enrollment flow internals

### Assets binarios

- `/public/favicon.ico`, `/public/icon-*.png`, `/public/apple-touch-icon.png` siguen con logo antiguo (degradado azul)
- Causa: `scripts/generate-app-icons.js` y `scripts/generate-icons.js` usan SVG antiguo
- Acción pendiente: reescribir scripts + instalar sharp + regenerar + commit

## Cómo revisar lo construido

1. Login en `http://localhost:5173/` (SW deshabilitado en dev → ya no bloquea)
2. Navega en el sidebar a cada sección migrada:
   - Biblioteca ✓
   - Quizzes ✓
   - Calendar ✓
   - Gamification ✓
   - Salas de estudio ✓
   - Cursos ✓
   - Mi CV ✓ (con layout 3 col completo)
   - Tutores ✓
   - Eventos ✓
   - Sugerencias ✓

Si algún módulo aparece con el diseño viejo, hard-reload Cmd+Shift+R.

## Mockups de referencia en repo

Accesibles en `localhost:5173/design-previews/`:
- biblioteca.html, quizzes.html, calendar.html, gamification.html
- study-rooms.html, courses.html, cv-editor.html, tutores.html

## Violaciones del LOGO.SPEC vigentes

Documentadas en `docs/brand/LOGO-SPEC.md`:
1. Peso Funnel Display 800 (Google Fonts no sirve 900)
2. App icon redibujado inline en HeroSection
3. Wordmark nav usa `<a>` en vez de `<span class="brand">`
4. Paths `assets/branding/svg/` vs spec `assets/branding/`
5. Componente `BrandWordmark` compartido aún no existe
6. PNG favicon/app icons con logo antiguo

## Pre-flight local al cierre

Todas las páginas rediseñadas pasan:
- `npx tsc --noEmit` ✓
- `npx vite build` ✓
- `npx prettier --write` ✓
