# Checkpoint — Módulo 02 Landing + contexto para retomar (2026-04-20)

## Estado al cierre de sesión nocturna

Rama: `module-02-landing` (pusheada al remoto, PR sin abrir aún).

4 commits nuevos de esta sesión:

| Commit    | Descripción                                                          |
|-----------|----------------------------------------------------------------------|
| `40cb03b` | cablear enlaces internos + corregir geometría SVG de `assets/branding/svg/*` al spec LOGO.04. Incluye trabajo visual previo del fondo editorial (partículas, tipografía gigante, gradient radial). |
| `ea5f912` | cargar Funnel Display + Geist Mono en `index.html` según spec `Diseno/00-logo-oficial.html`. |
| `b071862` | bajar `font-weight: 900` → `800` (31 ocurrencias) en `Landing.module.css`, `HeroSection.tsx`, `BusinessPanel.tsx`. |

URL para abrir PR: `https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/new/module-02-landing`.

## Decisiones aplicadas (batch 2026-04-20)

| ID | Tema                          | Decisión                                                       |
|----|-------------------------------|----------------------------------------------------------------|
| 1  | Logo SVG assets               | **1C** — corregir los 3 SVG del app icon a geometría spec y eliminar `logo-tile-white.svg`. PNG de `/public/` **NO** regenerados (quedan con logo antiguo). |
| 2  | Brand logo del nav            | **2B** — click vuelve a tab "inicio" (SPA, no navegación externa). |
| 3  | Botón "Ver demo" del hero     | **3A** — cambia a tab "producto".                              |
| 4  | Botón "Explorar" ProductSection | **4C** — queda como `#` hasta tener destino real.              |
| 5  | App Store / Google Play URLs  | **5C** — quedan como `#` hasta publicación real.               |
| 6  | Business panel (9 items)      | **6B** — quedan como `#` hasta que exista bloque Conniku Business. |
| 7  | Peso tipográfico Funnel       | **B** — bajar `900` → `800` en landing.                        |

## Pivote de objetivo autorizado por Cristian (noche 2026-04-20)

**PIVOT OBJETIVO SESIÓN**: de "completar landing módulo 02" a "avanzar rollout de diseño v3 a otras páginas según `docs/plans/rollout-design-v3-completo/plan.md`" · razón: Cristian autorizó seguir trabajando en noche con contexto amplio.

**Acción concreta tomada**: actualizar snapshot y documentación. NO se inició migración nueva en ausencia de supervisión visual (regla `feedback_trabajo_definitivo.md`).

## Visualmente pendiente del logo (a resolver mañana con Cristian inspeccionando)

Cristian reportó 2026-04-20 01:xx: "el app icon del hero se ve bien, el mismo icono que aparece en el banner superior (u-pack del wordmark) se ve mal".

**Diagnóstico técnico**: los dos son representaciones distintas del mismo logo por diseño del spec:

- App icon del hero = `<svg viewBox="0 0 100 100">` con `<circle cx="77" cy="68" r="6">` → **círculo perfecto geométrico**.
- Wordmark del nav = HTML+CSS con `<span class="dot">.</span>` → **carácter tipográfico punto**.

Spec LOGO.03 literalmente define el wordmark así; no son idénticos por construcción.

**Opciones que propuse a Cristian**:
- A) Reemplazar span `uPack` del nav por SVG inline con geometría escalada del app icon → idéntico visual pero viola LOGO.11 "no redibujar inline".
- B) Usar pseudo-elemento CSS para simular círculo solo en el punto → menos invasivo, arregla el `.` pero la `u` y el tile siguen siendo CSS.

Cristian dijo "deja el logo por ahora" al ir a dormir. Decisión A/B queda pendiente para mañana.

## Roadmap ordenado para retomar

### 1. Validar landing actual en preview Vercel (15 min)

- Abrir PR `module-02-landing` en GitHub: `https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/new/module-02-landing`
- Vercel genera preview automático al abrir el PR.
- Cristian inspecciona en preview (no en localhost) la landing completa.
- Si OK → merge a main + cerrar bloque piloto o dejar como sub-entregable.
- Si mejoras → retroceder a Capa 1 iteración 2.

### 2. Decidir sobre el logo del wordmark (decisión A/B de arriba)

### 3. Fase A del plan rollout-design-v3-completo

El plan `docs/plans/rollout-design-v3-completo/plan.md` (creado 2026-04-19) pide como prerequisito "bloque piloto en producción". Primero cerrar piloto, después iniciar rollout.

### 4. Fase B del rollout (primera página)

Prioridad 1 según plan: **Biblioteca.tsx** (módulo 04).

- Mockup fuente: `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Referencia/02-biblioteca-editorial.html`
- Archivo actual: `src/pages/Biblioteca.tsx` (NO está en FROZEN)
- Estrategia: edición in-place manteniendo lógica/handlers intactos
- Consideración: hay ticket separado de Cristian en memoria `project_chat_biblioteca.md` — chat en Biblioteca que devuelva link al libro. Evaluar si se incorpora en este rediseño o se difiere.

### 5. Regenerar assets PNG/favicon del logo oficial (bloque separado)

- `/public/favicon.ico`, `/public/icon-*.png`, `/public/apple-touch-icon.png` siguen con logo antiguo (degradado azul + silueta de persona).
- Causa: `scripts/generate-app-icons.js` y `scripts/generate-icons.js` usan SVG antiguo.
- Acción: reescribir ambos scripts para usar SVG canónico de `LOGO.04` + instalar `sharp` + ejecutar + commit binario nuevo.
- También regenera iconos Android e iOS.

## Violaciones del LOGO.SPEC vigentes (analisis completo)

Con el código actual en rama `module-02-landing` hay 6 desviaciones del spec:

1. **Peso 800 vs 900 INVIOLABLE** (LOGO.03/04/08) — decidido B por límite de Google Fonts. Mitigable self-hosting Funnel Display 900 OFL 1.1.
2. **App icon dibujado inline en HeroSection.tsx** (LOGO.11) — debería importar `assets/branding/svg/logo-tile.svg`.
3. **Wordmark usa `<a>` en vez de `<span class="brand">`** (LOGO.03) — funcionalmente correcto por CSS modules pero no literal.
4. **Paths de assets no coinciden con spec** (LOGO.01) — spec dice `assets/branding/logo-tile.svg`, repo tiene `assets/branding/svg/logo-tile.svg`.
5. **No existe componente `BrandWordmark` compartido** (LOGO.03 variante React propuesta) — spec propone `<BrandWordmark onDark size={...} />`; no se creó en `design-system/`.
6. **PNG del favicon y app icons con logo antiguo** (LOGO.10) — pendiente punto 5 del roadmap.

Copia del spec en repo: `docs/brand/LOGO-SPEC.md`.

## Memorias creadas/actualizadas esta sesión

- `reference_funnel_display.md` — Google Fonts sirve Funnel Display solo 400-800, no 900.
- `feedback_verify_before_fix.md` — verificar recursos externos antes de hipotetizar código en bugs visuales.

## Estado del pre-flight local al cierre

- `npx tsc --noEmit` ✓
- `npx eslint src/` ✓
- `npx vitest run` ✓ (302/302 tests)
- `npx vite build` ✓
- `ruff check backend/` ✓

## Dev server en background al cierre

`npm run dev` levantado con ID `buu77spn1` (puerto 5173 del renderer Vite). Si mañana al retomar el shell sigue vivo, el proceso debería estar corriendo. Si no, levantar con `npm run dev` desde `/Users/cristiang./CONNIKU/`.

URL correcta: **`http://localhost:5173/`** (NO 5174 — confusión de esta sesión por ~30 min).
