# Checkpoint — Sesión nocturna 2026-04-20

## Estado al cierre

Rama: `module-02-landing` pusheada al remoto.

6 commits nuevos en esta sesión (del más antiguo al más reciente):

| Commit    | Descripción                                                                   |
|-----------|-------------------------------------------------------------------------------|
| `40cb03b` | cablear enlaces internos de landing + corregir SVG de `assets/branding/svg/*` al spec LOGO.04. Incluye trabajo visual previo del fondo editorial (partículas, tipografía gigante, gradient radial). |
| `ea5f912` | cargar Funnel Display + Geist Mono en `index.html` según spec.                |
| `b071862` | bajar `font-weight: 900` → `800` (31 ocurrencias) en landing por límite de Google Fonts. |
| `aa79e57` | favicon.svg oficial + docs/brand/LOGO-SPEC.md + snapshot sesión.              |
| `fc588fc` | **Rediseño editorial v3 de Biblioteca** (shell: hero, tabs, grid, categorías). |

URL para abrir PR: `https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/new/module-02-landing`.

## Lo que hice

### 1. Landing módulo 02 — cableado de enlaces + fixes visuales

Decisiones batch aprobadas 2026-04-20:

| ID | Tema                          | Decisión                                                       |
|----|-------------------------------|----------------------------------------------------------------|
| 1  | Logo SVG assets               | **1C** — corregir geometría + eliminar `logo-tile-white.svg`    |
| 2  | Brand logo del nav            | **2B** — click vuelve a tab "inicio"                           |
| 3  | Botón "Ver demo"              | **3A** — cambia a tab "producto"                               |
| 4  | "Explorar" ProductSection     | **4C** — `#` hasta tener destino                               |
| 5  | App Store / Google Play       | **5C** — `#` hasta publicación                                 |
| 6  | Business panel (9 items)      | **6B** — `#` hasta bloque Business                             |
| 7  | Peso tipográfico Funnel       | **B** — `900` → `800` (Google Fonts no tiene 900)              |

Descubrimiento crítico: Funnel Display en Google Fonts solo sirve pesos 400-800, **no 900** (memoria `reference_funnel_display.md`).

### 2. Favicon oficial

- Creado `public/favicon.svg` con geometría canónica LOGO.04.
- `index.html` agregado `<link rel="icon" type="image/svg+xml">` con prioridad sobre los PNG antiguos.
- Nota: la `u` del favicon cae al fallback del sistema porque los SVG como favicon no heredan fuentes del DOM. Para cumplir spec 100% convertir text → path con Funnel Display 800 instalada (Inkscape → Object to Path).

### 3. Biblioteca — rediseño editorial v3 completo del shell

Migración in-place. Nuevo archivo `src/pages/Biblioteca.module.css` (~600 líneas) + reescritura del return JSX + rediseño de `BookCard` y `BookRow`.

**Rediseñado**:
- Top progress bar con pulso lime y subtítulo dinámico por tab
- Hero editorial con h1 gigante "Biblioteca, uno tuyo" + card de búsqueda rotada 0.8deg con shadow duro
- Source tabs como pills editorial (Comunidad / Académicos / Dominio público)
- Filter chips mono-tipografía
- Books grid con covers coloreados (8 colores en ciclo determinístico por id del doc), rotaciones nth-child, shadow duro al hover
- BookRow con thumb circular, borders negros gruesos
- Paginator con pill buttons
- Categorías rail tipográfico grande como discovery al final

**NO rediseñado (iteración 2)**:
- Modal de detalle del libro (líneas 794-1073, ~280 líneas)
- Modal clone-to-workspace con citations APA/MLA/Chicago (1074-1215, ~140 líneas)
- PDF reader overlay con tracking de progreso (1216-1399, ~180 líneas)

Toda la lógica intacta: 3 tabs (comunidad/academicos/publica), paginación independiente, save/unsave, clone modal, PDF reader con tracking de progreso.

**Decisiones de adaptación vs mockup** (documentadas en el header del CSS):
- NO top nav con logo del mockup (Sidebar/TopBar global ya lo pone)
- NO stats inventados "+70k libros" ni "18h esta semana" (regla §RULES.01.3)
- NO sección "chat con libros" (feature no implementada, ticket futuro)

**Mockup de referencia** copiado a `public/design-previews/biblioteca.html` accesible en `http://localhost:5173/design-previews/biblioteca.html`.

Pre-flight local pasado: `tsc` ✓, `eslint` 0 errors (1 warning preexistente no mío), `vitest` 302/302 ✓, `vite build` ✓.

## Lo que no hice y por qué

### CVProfile (2742 líneas)

Salté. Tiene modo edit/view con muchos formularios anidados (experience, education, certifications, languages, skills, preview format). Rediseñarlo sin romper la estructura requiere sesión dedicada con supervisión visual. Mockup copiado a `public/design-previews/cv-editor.html` para que puedas revisarlo mañana.

### Courses (2643 líneas)

Salté por el mismo motivo que CVProfile. Tamaño grande, lógica compleja de enrollment/progress.

### Quizzes (629), Calendar (751)

Son viables en tamaño. No las hice porque:
- Ya pasamos las 4 AM
- Biblioteca entera quedó en un solo commit revisable
- Agregar 2 migraciones más de 700 líneas cada una sin supervisión aumenta el riesgo de bugs sutiles que no puedo detectar sin ver el browser
- Tu propia regla "hazlo bien, revisa 2 veces" prima sobre "hazlas todas"

### TutorDirectory (3395), MiUniversidad (5039), Gamification (1053), StudyRooms (1169), ClassRoom (1278)

Todas requieren sesión dedicada con el web-architect planificando antes.

## Roadmap para retomar

### 1. Validar lo hecho (primera cosa al despertar)

- Abrir PR `module-02-landing` → generar preview Vercel.
- Inspeccionar:
  - Landing con logo actualizado (peso 800)
  - Favicon en pestaña browser debería mostrar tile lima
  - Biblioteca con hero editorial, covers coloreados, tabs pill
- Reportar qué está bien y qué corregir.

### 2. Workspaces (prioridad tuya para mañana)

Dijiste: "mañana quiero trabajar solo en workspaces luego de revisar".

### 3. Rollout continuo (post-workspaces)

Orden sugerido priorizando las manejables:
1. Quizzes (629 líneas) — 45 min
2. Calendar (751 líneas) — 1h
3. Gamification (1053)
4. StudyRooms (1169)
5. ClassRoom (1278)
6. CVProfile (2742) — sesión dedicada
7. Courses (2643) — sesión dedicada
8. TutorDirectory (3395) — sesión dedicada
9. MiUniversidad (5039) — sesión dedicada, quizás romper en sub-páginas

### 4. Iteración 2 de Biblioteca

Rediseñar los 3 modals pendientes (detalle, clone, PDF reader) para consistencia visual completa con el shell editorial.

### 5. Regenerar PNG/favicon completos

`/public/favicon.ico`, `/public/icon-*.png`, `/public/apple-touch-icon.png` siguen con logo antiguo (degradado azul). Scripts `scripts/generate-*.js` usan SVG antiguo. Acción: reescribir scripts + instalar `sharp` + regenerar. Bloque separado.

### 6. Logo wordmark del nav — decisión A/B pendiente

Sobre que el uPack del nav se vea idéntico al app icon del hero:
- A) Reemplazar span uPack por SVG inline del app icon (viola LOGO.11)
- B) Pseudo-elemento CSS para simular círculo solo en el punto

Respondiste "deja el logo por ahora", queda en pausa.

## Violaciones del LOGO.SPEC vigentes

6 desviaciones conocidas del spec, documentadas en `docs/brand/LOGO-SPEC.md`:

1. Peso 800 vs 900 INVIOLABLE — limite Google Fonts, self-hosting pendiente
2. App icon dibujado inline en HeroSection.tsx (LOGO.11 pide asset externo)
3. Wordmark usa `<a>` en vez de `<span class="brand">` (CSS modules)
4. Paths de assets: `assets/branding/svg/` vs spec `assets/branding/`
5. Falta componente `BrandWordmark` compartido
6. PNG favicon/app icons con logo antiguo

## Memorias de esta sesión

- `reference_funnel_display.md` — Google Fonts solo sirve 400-800 de Funnel Display
- `feedback_verify_before_fix.md` — verificar recursos externos antes de hipotetizar en bugs visuales

## Pre-flight final al cierre

- `npx tsc --noEmit` ✓
- `npx eslint src/pages/Biblioteca.tsx` → 0 errors, 1 warning preexistente (`user` sin usar, no lo toqué)
- `npx vitest run` → 302/302 tests ✓
- `npx vite build` ✓ (Biblioteca chunk: 480 KB gzip: 141 KB)

## Dev server

El `npm run dev` de la sesión (ID `buu77spn1`) puede seguir vivo. URL correcta: **`http://localhost:5173/`** (no 5174).
