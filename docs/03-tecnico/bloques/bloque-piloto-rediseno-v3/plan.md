# Plan · Bloque Piloto · Rediseño Visual v3 (Conniku)

```yaml
PLAN_ID:           bloque-piloto-rediseno-v3
AUTHOR:            web-architect (Tori, Opus 4.7 · razonamiento extendido)
DATE_DRAFTED:      2026-04-19
TARGET_BLOCK:      Bloque piloto · validación del nuevo sistema visual sobre 3 superficies
SCOPE_SURFACES:    1) tokens CSS + tipografías  ·  2) Landing pública  ·  3) Dashboard estudiante  ·  4) Login + Register
STATUS:            BORRADOR · pendiente aprobación de Cristian antes de pasar a builder
PROTOCOL:          7 capas (CLAUDE.md §18) con excepciones nominadas en §10 de este plan
```

---

## 1. Contexto

### 1.1 Petición original (cita)

> "Producir plan ejecutable del **bloque piloto de aplicación del rediseño visual** de Conniku.
> Solo 4 entregables en este bloque:
> 1. Tokens CSS nuevos (paleta + Funnel Display + Geist Mono) sin romper los temas actuales
> 2. Landing pública aplicando el handoff hi-fi con correcciones documentadas
> 3. Dashboard estudiante aplicando paquete principal módulo 03
> 4. Auth/Login/Register aplicando paquete principal módulo 02-auth
>
> Resolver 4 conflictos: stack (React vs Next.js), tuteo vs voseo, "IA" en copy, estadísticas placeholder."

### 1.2 Paquetes de diseño leídos

Ambos viven fuera del repo, en el Desktop de Cristian:

- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-README.md` (296 líneas) · puerta de entrada del paquete
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-STACK.md` (446 líneas) · stack canónico (React 18 + Vite + CSS variables, no Tailwind)
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-RULES-GLOBAL.md` (510 líneas) · prohibiciones ("IA", voseo, datos inventados), evidencia de lectura legal, WCAG AA
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-BRAND-LOGO.md` (428 líneas) · spec inviolable del logo (4 colores, Funnel Display 900, sin rotación)
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-CONNECTIONS-MAP.md` (parcial · CONN.01 + CONN.02 inicial)
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/02-landing-20260419-1650.md` (983 líneas) · módulo 02 cerrado (landing + 6 onboarding + 9 business)
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/03-dashboard-estudiante-20260419-1837.md` (79 líneas) · módulo 03 **NO_ITERATED** · spec placeholder
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/design_handoff_conniku_landing/README.md` (451 líneas) · handoff hi-fi del landing con tokens CSS, motion, secciones detalladas
- `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/design_handoff_conniku_landing/Landing.html` (2768 líneas, no leído completo · referencia visual)

### 1.3 Archivos del codebase real leídos

- `/Users/cristiang./CONNIKU/CLAUDE.md` (memoria del proyecto, §18 protocolo 7 capas, §19 Auto Mode OFF)
- `/Users/cristiang./CONNIKU/.claude/frozen-files.txt` (40 líneas)
- `/Users/cristiang./CONNIKU/FROZEN.md` (39 líneas)
- `/Users/cristiang./CONNIKU/index.html` (99 líneas) · carga sólo Inter desde Google Fonts hoy
- `/Users/cristiang./CONNIKU/src/main.tsx` (87 líneas) · importa global.css + auth.css + mobile-native.css
- `/Users/cristiang./CONNIKU/src/styles/global.css` (5232 líneas · primeras 200 inspeccionadas) · contiene los 8 temas existentes
- `/Users/cristiang./CONNIKU/src/App.tsx` (963 líneas · porciones inspeccionadas) · ruteo lazy y estado authView para Login/Register
- `/Users/cristiang./CONNIKU/src/pages/Landing.tsx` (2880 líneas · primeras 80 inspeccionadas) · NO lazy-loaded; importada eager
- `/Users/cristiang./CONNIKU/src/pages/Login.tsx` (378 líneas · primeras 80 inspeccionadas)
- `/Users/cristiang./CONNIKU/src/pages/Register.tsx` (1893 líneas · primeras 60 inspeccionadas) · ya consume `AGE_DECLARATION_HASH` y `AGE_DECLARATION_TEXT_V1` del Bloque 1 FROZEN
- `/Users/cristiang./CONNIKU/src/pages/Dashboard.tsx` (1284 líneas · primeras 60 inspeccionadas)

### 1.4 Hallazgos críticos del codebase

1. **Dashboard.tsx está FROZEN** (línea 23 de FROZEN.md, motivo "null-safety 2 fixes") y aparece en `.claude/frozen-files.txt`. Tocarlo requiere `/unfreeze` explícito.
2. **Landing.tsx NO está FROZEN** y NO es lazy-loaded (se importa eager en App.tsx línea 24). Esto significa que está en el bundle inicial: cualquier crecimiento impacta el LCP del primer paint.
3. **Login.tsx y Register.tsx NO están FROZEN**. Register sí depende de constantes FROZEN del Bloque 1 (`shared/legal_texts.ts`) que NO se deben tocar.
4. **El proyecto tiene 8 temas, no 6** como afirmaba la petición y CLAUDE.md. Los 8 temas en `src/styles/global.css` son: `sereno` (default `:root`), `nocturno`, `calido`, `profesional`, `oceano`, `conniku`, `pizarra`, `dorado`. Esto cambia el cálculo de "tema nuevo opcional vs reemplazo".
5. **El `index.html` ya carga Google Fonts con `Inter`**. Agregar Funnel Display + Geist Mono via `<link>` es trivial pero impacta el bundle de fuentes.
6. **Login/Register no tienen ruta dedicada** (`/login`, `/register`). Se renderizan vía estado `authView` en App.tsx (líneas 564-583) cuando el usuario no está autenticado. Esto contradice la sección MODULE.02.01 del paquete que asume rutas `/login`, `/register`, `/onboarding/*`.
7. **`shared/legal_texts.ts` está FROZEN**. Cualquier cambio al texto legal del checkbox de edad bumpea el hash y requiere flujo legal completo. El bloque piloto NO debe tocar el texto legal; sólo puede aplicarle estilo visual nuevo sin alterar contenido ni estructura semántica.
8. **El handoff landing tiene voseo rioplatense en al menos 5 puntos**: "necesitás", "Conversá con tu propio material", "Métricas en vivo" (no voseo pero copy a revisar), "y no estás solo" (correcto, no voseo), "De 7 AM a medianoche, con vos" (voseo). Hay que traducir todo a tuteo chileno.
9. **El handoff landing tiene "IA" textualmente en**: "documentos con chat IA", "asesor virtual", token "--cyan: tech, AI". Hay que reemplazar.
10. **Estadísticas inventadas en el handoff landing**: `+70k títulos`, `127 estudiando ahora mismo`, `4.9★ 2.1k reseñas`, `14 universidades sincronizadas`, `34% día 41 de 120`, `2.8M universitarios México`, `19.6M USA`. Ninguna está respaldada hoy. Marcar como `[PENDIENTE · dato real requerido]` o reescribir copy sin número.
11. **El módulo 03 (Dashboard) está marcado `STATUS: NOT_ITERATED`** en su MD. El paquete dice explícitamente que "se iterará con Cristian cuando se arranque el módulo". Aplicar el HTML hoy es aplicar una pieza no validada.

### 1.5 Decisiones previas del proyecto que constriñen este plan

- CLAUDE.md §"Convenciones" prohíbe "IA"/"AI"/"inteligencia artificial" en UI (regla crítica)
- Memoria `feedback_chilean_register.md` exige tuteo chileno (regla inviolable)
- Memoria `feedback_legal_reading_evidence.md` exige evidencia de LECTURA, no solo checkbox
- Memoria `feedback_evidence_rule.md` prohíbe afirmar "funciona" sin output literal
- CLAUDE.md §18 protocolo 7 capas obligatorio para bloques
- CLAUDE.md §19 Auto Mode OFF permanente · modo estricto siempre
- Bloque 1 (auth-edad) y partes del Bloque 2 (Workspaces) ya cerrados y FROZEN

---

## 2. Decisiones de arquitectura

### 2.1 Decisión D-01 · Dónde viven los tokens CSS nuevos

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | Extender `src/styles/global.css` insertando bloques nuevos al final | Un solo archivo, menos cargas HTTP | Archivo de 5232 líneas crece más, mezcla 2 sistemas, riesgo de conflicto de variables |
| B | Crear `src/styles/design-system-v3.css` con prefijo `--v3-*` y namespace `[data-v3="true"]` | Aislamiento total, coexistencia limpia, rollback trivial (quitar 1 línea de import), permite probar superficies una a una | Doble fuente de verdad mientras coexistan, requiere disciplina de no mezclar tokens |
| C | Reemplazar tokens existentes (mismo nombre, distinto valor) | Migración total y limpia | Rompe los 8 temas existentes, requiere migrar 5232 líneas en una sola tarea, fuera del scope piloto |

**Decisión**: **B** · crear `src/styles/design-system-v3.css` y aplicarlo selectivamente a las superficies del piloto.

**Razonamiento**:

- El bloque piloto es validación experimental sobre 3 superficies. Si Cristian no aprueba la dirección visual, debe poder revertirse en minutos sin tocar los 8 temas.
- La coexistencia es temporal: se sostendrá entre el Bloque piloto y el Bloque siguiente que aplique el sistema nuevo a los 31 módulos restantes. La deuda técnica es acotada y consciente.
- El namespace por atributo `[data-v3="true"]` o `[data-surface="landing"]` permite que sólo las páginas marcadas reciban los tokens nuevos, evitando que cualquier otra página accidentalmente los use.
- Permite probar la dirección visual sin comprometer la app autenticada, que sigue corriendo con los 8 temas actuales.

**Implementación concreta del namespace**:

- En `src/styles/design-system-v3.css` declarar tokens dentro de selector `.v3-surface { ... }` (no `:root`)
- Cada componente piloto (LandingV3, LoginV3, RegisterV3) envuelve su árbol con `<div className="v3-surface">`
- Para Dashboard (FROZEN) ver decisión D-06

### 2.2 Decisión D-02 · Cómo cargar Funnel Display + Geist Mono

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | `<link rel="preconnect">` + `<link rel="stylesheet">` en `index.html` | Carga temprana, mejor LCP, igual al patrón actual de Inter | Bloquea render hasta resolver fuentes (mitigado por preconnect) |
| B | `@import url()` dentro de `design-system-v3.css` | Cohesión con tokens nuevos | Bloquea descubrimiento de la fuente hasta parsear CSS, peor LCP |
| C | `@font-face` self-hosted con archivos en `public/fonts/` | Privacidad (sin Google), control total de subset | Requiere bajar y versionar fuentes, no estaba en el alcance |

**Decisión**: **A** · agregar al `index.html` el bloque preconnect + stylesheet de Google Fonts con sólo los pesos necesarios.

**Razonamiento**:

- Idéntico patrón al ya usado para Inter (líneas 87-89 de `index.html`); coherencia interna.
- Mejor LCP porque el navegador descubre las fuentes en el HEAD, no después de parsear CSS.
- Subset acotado: Funnel Display pesos 700, 800, 900 (suficientes para el sistema · el handoff usa 800 en stickers, 900 en hero/h2, 700 en wordmark) · Geist Mono pesos 400, 500, 600.

**Implementación concreta**:

```html
<!-- en <head> de index.html, después del stylesheet de Inter -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@700;800;900&family=Geist+Mono:wght@400;500;600&display=swap" />
```

Ojo: `display=swap` evita FOIT (Flash Of Invisible Text) y muestra fallback hasta que la fuente esté lista. Aceptable para el piloto.

### 2.3 Decisión D-03 · Coexistencia con los 8 temas existentes

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | El sistema nuevo es un 9° tema opcional `[data-theme="v3"]` | Ortogonal a los demás, el usuario lo elige en Configuración | Requiere UI de selección, complica la decisión "qué tema usa el usuario por defecto" |
| B | El sistema nuevo se aplica sólo a las 3 superficies del piloto vía `<div className="v3-surface">`, los 8 temas siguen vigentes en el resto | Cero impacto en la app autenticada existente, scope quirúrgico | Inconsistencia visual al moverse entre Landing v3 y Dashboard si Dashboard NO se rediseña |
| C | El sistema nuevo reemplaza todos los temas en una sola tarea | Visión final cohesiva | Fuera del scope piloto · es exactamente lo que se quiere validar antes |

**Decisión**: **B** · namespace por superficie, los 8 temas siguen intactos.

**Razonamiento**:

- El piloto es por definición experimental. Romper los 8 temas para 3 superficies es desproporcionado.
- La inconsistencia visual entre Landing v3 (público, sin auth) y Dashboard (autenticado, podría seguir con tema antiguo) es aceptable mientras el piloto está corriendo: Cristian decidirá tras la inspección si el sistema v3 reemplaza todo o queda como variante.
- En el bloque siguiente (post-piloto, fuera de scope) se decidirá si los 8 temas se mantienen, se reducen, o se reemplazan.

**Pendiente para Cristian**: confirmar que está dispuesto a aceptar inconsistencia visual durante la fase de inspección (Capa 6).

### 2.4 Decisión D-04 · Motion library

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | Solo CSS keyframes + transitions + IntersectionObserver (lo que ya usa Landing.tsx) | Cero peso adicional al bundle, control total, ya hay infraestructura | El handoff landing tiene reveals + sticker hover + ticker infinito · todo factible pero requiere disciplina |
| B | Agregar Framer Motion (recomendado por handoff) | API declarativa potente, `whileInView` ergonómico | +60 KB gzipped al bundle inicial, dependencia nueva, deuda futura |

**Decisión**: **A** · solo CSS + IntersectionObserver, sin Framer Motion.

**Razonamiento**:

- El bundle inicial debe mantenerse pequeño (objetivo CLAUDE.md y RULES.10 del handoff: <300 KB gzipped).
- Landing.tsx actual ya tiene `useScrollAnimation()` y `IntersectionObserver` (líneas 7-22) · es reutilizable.
- Las animaciones del handoff son simples: fade+translate en reveals, scale/translate en hover, keyframes infinitos en el ticker. Todo CSS puro.
- `prefers-reduced-motion` ya soportado fácilmente con media query.

### 2.5 Decisión D-05 · Splatter dots, sticker rotations y comparison matrix

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | Replicar técnicas exactas del handoff: `box-shadow` múltiple para splatter dots, `transform: rotate(-1.3deg)` por card, table CSS Grid 8 columnas para matrix | Pixel-perfect con la referencia | Más CSS, mayor superficie de testing |
| B | Simplificar: sin splatter (solo color sólido), sin sticker rotation, matrix simplificada | Más rápido de implementar | Pierde la "personalidad" del diseño que justifica el rediseño |

**Decisión**: **A** · replicar exacto, es el motivo del rediseño.

**Razonamiento**:

- El handoff es hi-fi pixel-perfect. Simplificar contradice el propósito del bloque piloto (validar la dirección visual, no una versión diluida).
- Las técnicas son CSS estándar; no introducen riesgo técnico.

### 2.6 Decisión D-06 · Cómo aplicar el rediseño a Dashboard.tsx (FROZEN)

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | Pedir `/unfreeze` de `src/pages/Dashboard.tsx` y editar in-place | Una sola fuente de verdad para Dashboard | Pierde la protección que justifica el FROZEN (null-safety guards 2026-04-14), riesgo de regresión |
| B | Crear `src/pages/DashboardV3.tsx` paralelo, registrar ruta `/dashboard-v3` para inspección, dejar `/dashboard` con la versión actual | Cero riesgo de regresión, comparación A/B trivial en preview, FROZEN intacto | Dos archivos a mantener temporalmente |
| C | Diferir el rediseño de Dashboard del scope del piloto | Cero riesgo | Reduce el bloque piloto a 2 superficies (Landing + Auth), valida menos |

**Decisión**: **B** · crear `DashboardV3.tsx` paralelo, ruta paralela.

**Razonamiento**:

- El FROZEN existe por una razón legítima (null-safety en activityFeed y calendarEvents). Quitarlo para un rediseño visual es arriesgado.
- La ruta paralela `/dashboard-v3` permite a Cristian inspeccionar el rediseño sin que afecte a usuarios reales mientras esté en preview.
- El módulo 03 del paquete está marcado `NOT_ITERATED`: NO hay un diseño cerrado para Dashboard. Lo razonable es construir una propuesta visual basada en el HTML depositado y dejar que Cristian itere antes de promoverlo a `/dashboard`.
- Si tras la Capa 6 Cristian aprueba el rediseño, en el bloque siguiente se hace el cambio quirúrgico: se quita el FROZEN, se reemplaza Dashboard.tsx por DashboardV3.tsx renombrado, se restituye el FROZEN sobre la nueva versión.

**Adicional**: el archivo `DashboardV3.tsx` también usa el namespace `<div className="v3-surface">` para tokens.

### 2.7 Decisión D-07 · Cómo aplicar el rediseño a Login.tsx y Register.tsx

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | Editar Login.tsx y Register.tsx in-place (no están FROZEN) | Una sola fuente, no duplica código de validación | Register tiene 1893 líneas con lógica compleja de validación de RUT, países, monedas, BLOCKED_TERMS. Riesgo alto de regresión visual y funcional. |
| B | Crear `LoginV3.tsx` y `RegisterV3.tsx` paralelos, swap controlado por feature flag o variable de entorno | Cero riesgo, comparación A/B en preview | Doble código mientras coexistan |
| C | Refactor incremental: extraer lógica de Register a hooks/services, dejar component visual liviano y rediseñarlo | Limpia el archivo monstruo de 1893 líneas | Excede el scope del bloque piloto, es otra tarea distinta |

**Decisión**: **B** · paralelos con feature flag `VITE_AUTH_V3=true` (o sin flag y switch directo en App.tsx según preferencia de Cristian).

**Razonamiento**:

- Register.tsx tiene lógica legal crítica (consume `AGE_DECLARATION_HASH` del Bloque 1 FROZEN) y validaciones complejas. Reescribir in-place es alto riesgo.
- Crear paralelos permite mantener funcional la versión actual hasta que la nueva esté validada por Capa 6.
- En el siguiente bloque (post-piloto), si Cristian aprueba, se hace el swap definitivo y se borra la versión vieja.

**Implementación**: en App.tsx, donde hoy renderiza `<Login ... />` y `<Register ... />` (líneas 572-583), se decide cuál basado en `import.meta.env.VITE_AUTH_V3 === 'true'`. El bloque piloto se entrega con el flag en `true` para preview; queda en `false` para producción hasta cierre de Capa 6.

### 2.8 Decisión D-08 · Lazy-load Landing.tsx (oportunidad detectada)

**Hallazgo**: Landing.tsx (2880 líneas) NO es lazy-loaded · está en el bundle inicial. Si LandingV3 también es eager, el problema empeora.

**Alternativas evaluadas**:

| ID | Opción | Ventajas | Desventajas |
|----|--------|----------|-------------|
| A | Mantener LandingV3 eager (igual que Landing actual) | Sin sorpresas en este bloque | El bundle inicial seguirá creciendo |
| B | Lazy-load LandingV3 (`React.lazy`) | Reduce bundle inicial | Suspense fallback visible en primera carga, posible flash |

**Decisión**: **A** para el piloto, **B** documentada como deuda a resolver post-piloto.

**Razonamiento**:

- El piloto valida diseño, no performance. Cambiar la estrategia de carga introduce variable extra.
- Documentar la deuda para que el bloque siguiente (consolidación visual) la atienda con métricas de bundle antes y después.

---

## 3. Archivos a tocar

Ruta absoluta y cambio específico. Ningún archivo FROZEN se toca.

### 3.1 Archivos nuevos a crear

| # | Ruta absoluta | Propósito |
|---|---------------|-----------|
| N1 | `/Users/cristiang./CONNIKU/src/styles/design-system-v3.css` | Tokens CSS nuevos (paleta + tipografías + radii + shadows + motion) bajo selector `.v3-surface` |
| N2 | `/Users/cristiang./CONNIKU/src/components/v3/BrandWordmark.tsx` | Componente del logo wordmark según LOGO.03 (literal) |
| N3 | `/Users/cristiang./CONNIKU/src/components/v3/BrandTile.tsx` | Componente del logo tile (app icon) según LOGO.04 (literal) |
| N4 | `/Users/cristiang./CONNIKU/src/pages/v3/LandingV3.tsx` | Landing rediseñada (secciones del handoff hi-fi) |
| N5 | `/Users/cristiang./CONNIKU/src/pages/v3/LoginV3.tsx` | Login rediseñado según módulo 02-auth (sin nueva ruta, swap interno) |
| N6 | `/Users/cristiang./CONNIKU/src/pages/v3/RegisterV3.tsx` | Register rediseñado, reusa `AGE_DECLARATION_HASH/TEXT_V1` de `shared/legal_texts` |
| N7 | `/Users/cristiang./CONNIKU/src/pages/v3/DashboardV3.tsx` | Dashboard rediseñado, ruta paralela `/dashboard-v3` |
| N8 | `/Users/cristiang./CONNIKU/src/__tests__/v3/LandingV3.smoke.test.tsx` | Smoke test: renderiza sin crash, sin "IA" en DOM, sin voseo en strings |
| N9 | `/Users/cristiang./CONNIKU/src/__tests__/v3/LoginV3.smoke.test.tsx` | Smoke test análogo |
| N10 | `/Users/cristiang./CONNIKU/src/__tests__/v3/RegisterV3.smoke.test.tsx` | Smoke test + validación de que `AGE_DECLARATION_HASH` se sigue propagando |
| N11 | `/Users/cristiang./CONNIKU/src/__tests__/v3/DashboardV3.smoke.test.tsx` | Smoke test |
| N12 | `/Users/cristiang./CONNIKU/src/__tests__/v3/tokensV3.test.ts` | Test que valida que `.v3-surface` declara las CSS variables esperadas (--ink, --paper, --lime, --orange, --pink, --cream, --violet, --cyan) |
| N13 | `/Users/cristiang./CONNIKU/docs/inspecciones/bloque-piloto-rediseno-v3-iter-1.md` | Plantilla vacía donde Cristian anotará observaciones de Capa 6 |
| N14 | `/Users/cristiang./CONNIKU/docs/plans/bloque-piloto-rediseno-v3/copy-translation.md` | Tabla bilateral copy original handoff (voseo + "IA" + estadísticas) → copy traducido (tuteo + alternativas + placeholders). Documenta cada cambio para auditar. |

### 3.2 Archivos existentes a modificar (NO FROZEN)

| # | Ruta absoluta | Cambio específico |
|---|---------------|-------------------|
| M1 | `/Users/cristiang./CONNIKU/index.html` | Agregar `<link>` Google Fonts para `Funnel Display:700,800,900` y `Geist Mono:400,500,600`. Insertar tras línea 89 (donde ya carga Inter). |
| M2 | `/Users/cristiang./CONNIKU/src/main.tsx` | Agregar `import './styles/design-system-v3.css';` después del import de auth.css (línea 10). |
| M3 | `/Users/cristiang./CONNIKU/src/App.tsx` | (a) Cambiar import `Landing` por feature-flag con `LandingV3`. (b) Agregar swap LoginV3/RegisterV3 condicionado por `import.meta.env.VITE_AUTH_V3`. (c) Registrar nueva ruta lazy `/dashboard-v3` para `DashboardV3`. NO tocar la ruta `/dashboard` (FROZEN). |
| M4 | `/Users/cristiang./CONNIKU/.env.example` (si existe; si no, crear) | Documentar `VITE_AUTH_V3=true` para preview. |

### 3.3 Archivos FROZEN a NO tocar (declaración explícita)

- `/Users/cristiang./CONNIKU/src/pages/Dashboard.tsx` (FROZEN · no se edita; se crea DashboardV3.tsx paralelo)
- `/Users/cristiang./CONNIKU/shared/legal_texts.ts` (FROZEN · RegisterV3 lo importa pero no modifica)
- `/Users/cristiang./CONNIKU/shared/legal_texts.py` (FROZEN · backend)
- `/Users/cristiang./CONNIKU/scripts/verify-legal-texts-sync.sh` (FROZEN)
- Resto de archivos FROZEN listados en `.claude/frozen-files.txt` (no relacionados al scope)

**Ningún `/unfreeze` se solicita en este plan.**

### 3.4 Archivos relacionados que NO se tocan pero se leen para contexto

- `/Users/cristiang./CONNIKU/src/components/Sidebar.tsx`, `TopBar.tsx`, `RightPanel.tsx`, `MobileBottomNav.tsx` · NO en scope. DashboardV3 inicialmente se renderiza sin Sidebar/TopBar (página interna que reusa el layout existente del App.tsx para usuario autenticado). Si la inspección Cristian requiere rediseñar Sidebar/TopBar, sale en bloque siguiente.

---

## 4. Orden de implementación

Numeración secuencial. Cada paso tiene un punto de checkpoint donde Cristian puede revisar.

### Paso 1 · Tokens y tipografías (cimiento)
- Crear N1 (`design-system-v3.css`) con todos los tokens del handoff: colores ink/paper/lime/pink/orange/cream/violet/cyan/blue, tipografías display/mono, radii, shadows, motion ease.
- Modificar M1 (`index.html`) para cargar Funnel Display + Geist Mono.
- Modificar M2 (`main.tsx`) para importar el CSS nuevo.
- Crear N12 (`tokensV3.test.ts`) que valida computed style de `.v3-surface` exporta las variables esperadas.
- **Checkpoint 1**: Cristian abre la app local, abre DevTools, confirma que las fuentes nuevas aparecen en Network y que `:root .v3-surface { ... }` está disponible. Sin todavía aplicar visualmente nada.

### Paso 2 · Componentes de marca compartidos
- Crear N2 (`BrandWordmark.tsx`) literal según LOGO.03 (HTML + CSS canónico).
- Crear N3 (`BrandTile.tsx`) literal según LOGO.04.
- Tests inline mínimos (snapshot o assertion de render sin crash).
- **Checkpoint 2**: Cristian valida visualmente los componentes (Storybook-equivalente o página de prueba ad-hoc).

### Paso 3 · Landing v3
- Crear N14 (`copy-translation.md`) con la tabla de traducciones (voseo→tuteo, IA→Athena/asistente, estadísticas→placeholder).
- Crear N4 (`LandingV3.tsx`) implementando todas las secciones del handoff:
  - 0. Top progress bar (sin estadística inventada · placeholder)
  - 1. Nav (con BrandWordmark)
  - 2. Hero (con tagline B "juvenil" como default · counter en `[PENDIENTE · dato real]`)
  - 3. Anti-manifesto rail (chips negativos: NO mencionar competencia por nombre · §RULES.01.4 · usar genéricos)
  - 4. Sticker grid 7 capabilities (copy revisado: "documentos con chat IA" → "documentos con chat inteligente" o "documentos con Athena")
  - 5. Comparison matrix (NOTA crítica: el handoff lista Moodle, Crehana, Udemy, LinkedIn Learning, Notion, WhatsApp por nombre · §RULES.01.4 prohíbe mencionar competencia · marcar como pregunta abierta P-01 abajo)
  - 6. Notification ticker
  - 7. Big stats (todos los números marcados como `[PENDIENTE · dato real requerido]`)
  - 8. Manifesto quote
  - 9. Chat testimonials (personas SOLO del catálogo `00-PEOPLE-AUTHORIZED.md` · §RULES.05; si no leí ese catálogo aún, pregunta abierta P-02)
  - 10. Day in Conniku (tuteo: "De 7 AM a medianoche, contigo" en lugar de "con vos")
  - 11. Multi-country (números marcados pendiente)
  - 12. CTA final
  - 13. Editorial footer
- Modificar M3 (`App.tsx`) para sustituir `Landing` por `LandingV3` cuando `authView === 'landing'`. Mantener Landing.tsx legacy en disco como respaldo.
- Crear N8 (smoke test).
- **Checkpoint 3**: build local + run · Cristian abre `/` sin auth, ve LandingV3.

### Paso 4 · Login v3 y Register v3
- Crear N5 (`LoginV3.tsx`) según módulo 02-auth: 2 paneles (left brand · right form), tab switch Entrar/Crear cuenta, social row Google, divider, fields email/password.
- Crear N6 (`RegisterV3.tsx`) reusando exactamente la lógica de Register.tsx:
  - Importar `AGE_DECLARATION_HASH`, `AGE_DECLARATION_TEXT_V1` de `shared/legal_texts` (FROZEN, no se modifica)
  - Mantener checkbox declarativo con texto literal del Bloque 1
  - Mantener evidencia de lectura (memoria `feedback_legal_reading_evidence.md`)
  - Solo cambia presentación visual; lógica intacta
- Modificar M3 (`App.tsx`) para feature-flag swap de Login/Register.
- Modificar M4 (`.env.example`) para documentar `VITE_AUTH_V3`.
- Crear N9 y N10 (smoke tests + validación que el hash legal se propaga).
- **Checkpoint 4**: build local · Cristian completa flujo Login y Register sin auth real (modo visual).

### Paso 5 · Dashboard v3
- Crear N7 (`DashboardV3.tsx`) basado en HTML del módulo 03 (con caveats: módulo NO_ITERATED · marcar zonas inciertas como `[POR ITERAR CON CRISTIAN]`).
- Modificar M3 (`App.tsx`) para registrar ruta lazy `/dashboard-v3`.
- Crear N11 (smoke test).
- Crear N13 (`docs/inspecciones/bloque-piloto-rediseno-v3-iter-1.md`) plantilla vacía.
- **Checkpoint 5**: Cristian autenticado navega a `/dashboard-v3` y compara con `/dashboard` actual.

### Paso 6 · Pre-flight y verificación final
- Ejecutar `.claude/scripts/pre-flight.sh` (debe pasar 6/6)
- Ejecutar `npm run lint`, `npm run typecheck`, `npm run test` (vitest), `npm run build`
- Verificar que la suite legacy de tests (33 archivos test, 446+ tests verdes) sigue verde
- **Checkpoint 6**: reporte del builder con outputs literales (regla evidencia obligatoria)

### Paso 7 · Commit y PR a rama de preview
- Commit con mensaje Conventional Commits: `feat(frontend): bloque piloto rediseño v3 (tokens + landing + auth + dashboard paralelo)`
- Push a rama `preview-bloque-piloto-rediseno-v3`
- Vercel auto-deploya preview URL
- **Capa 6** del protocolo: Cristian inspecciona en preview URL

---

## 5. Criterio de terminado

Checkboxes verificables. Cada uno tiene una operación concreta para evaluarlo.

### Tokens y fuentes
- [ ] `src/styles/design-system-v3.css` existe y declara al menos las variables: `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--paper`, `--paper-2`, `--paper-3`, `--line`, `--lime`, `--lime-ink`, `--pink`, `--pink-deep`, `--orange`, `--cream`, `--violet`, `--cyan`, `--blue`, `--font-display`, `--font-mono`, `--ease`, `--r-btn`, `--r-card`, `--r-xl`, `--shadow-sm`, `--shadow-md`. (Verificable con `grep -E '^\s*--' src/styles/design-system-v3.css | wc -l` ≥ 25)
- [ ] El `tokensV3.test.ts` pasa (assertion: `getComputedStyle` de un nodo con clase `v3-surface` devuelve los valores esperados para las 8 variables clave)
- [ ] DevTools de Chrome muestra `Funnel Display` y `Geist Mono` cargadas en pestaña Network al abrir `/`
- [ ] El `index.html` contiene la línea `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display...">`

### Landing v3
- [ ] `LandingV3.tsx` renderiza sin errores en consola al abrir `/` sin auth (verificable: `console.error` count = 0 en DevTools tras 5 segundos)
- [ ] `grep -i "IA\|Artificial Intelligence\|inteligencia artificial" src/pages/v3/LandingV3.tsx` retorna 0 matches (excepto comentarios técnicos donde aplique nota de "no exposición al usuario")
- [ ] `grep -E "necesitás|tenés|querés|sabés|estás vos|con vos" src/pages/v3/LandingV3.tsx` retorna 0 matches
- [ ] Todas las estadísticas inventadas del handoff aparecen como `[PENDIENTE · dato real requerido]` o están escondidas detrás de `?stats=demo` query param para evitar regresión visual sin confundir al usuario
- [ ] El smoke test `LandingV3.smoke.test.tsx` pasa (renderiza sin crash, no contiene strings prohibidas)

### Auth v3
- [ ] `LoginV3.tsx` y `RegisterV3.tsx` existen
- [ ] App.tsx swappea correctamente con `VITE_AUTH_V3=true`
- [ ] RegisterV3 importa y usa `AGE_DECLARATION_HASH` y `AGE_DECLARATION_TEXT_V1` de `shared/legal_texts` (verificable: `grep "AGE_DECLARATION" src/pages/v3/RegisterV3.tsx`)
- [ ] El texto legal del checkbox aparece literal (verificable con assertion de testing-library: `screen.getByText(/Al marcar esta casilla, declaro bajo fe de juramento/)`)
- [ ] Smoke tests de LoginV3 y RegisterV3 pasan

### Dashboard v3
- [ ] `DashboardV3.tsx` existe en `src/pages/v3/`
- [ ] Ruta `/dashboard-v3` registrada y lazy-cargada en App.tsx
- [ ] `Dashboard.tsx` original NO modificado (verificable: `git diff main src/pages/Dashboard.tsx` vacío)
- [ ] Smoke test pasa

### Verificación global
- [ ] `npm run typecheck` pasa sin errores nuevos
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] `npm run test` pasa: total tests ≥ tests previos + nuevos del bloque (no regresiones)
- [ ] `npm run build` produce `dist/renderer/` sin errores
- [ ] `.claude/scripts/pre-flight.sh` retorna 6/6
- [ ] `bash scripts/verify-legal-texts-sync.sh` pasa (hash Python ↔ TS sigue sincronizado · ningún cambio rompió la paridad)
- [ ] Ningún archivo FROZEN aparece en `git diff main` (verificable: cruzar `.claude/frozen-files.txt` contra lista de archivos modificados)

### Componente legal (este bloque)
- [ ] El texto legal en RegisterV3 es bit-exacto al de `AGE_DECLARATION_TEXT_V1`
- [ ] Hash SHA-256 sigue siendo el mismo (no hay cambio que requiera bump)
- [ ] La evidencia de lectura del Bloque 1 sigue funcionando: link visible al documento, checkbox que dice "He leído y acepto" (no "Acepto"), backend logging del open event (heredado, no se toca)

---

## 6. Riesgos

Clasificados por probabilidad (P) y severidad (S). Mitigación obligatoria por riesgo.

### R-01 · Romper visualmente alguno de los 8 temas existentes (P: BAJA · S: ALTA)

**Causa potencial**: introducir CSS al `:root` global por error en lugar de scope `.v3-surface`.

**Mitigación**:
- Decisión D-01 elegida específicamente para evitar esto.
- Test `tokensV3.test.ts` verifica que las variables NO existen fuera del namespace `.v3-surface`.
- QA-tester recorre las 8 paletas (sereno, nocturno, calido, profesional, oceano, conniku, pizarra, dorado) en 3 páginas autenticadas distintas (Mi Perfil, Workspaces, Configuración) y captura screenshots para comparar contra baseline.

### R-02 · Bundle inicial crece demasiado por las 2 fuentes nuevas (P: ALTA · S: MEDIA)

**Causa potencial**: Funnel Display 3 pesos + Geist Mono 3 pesos = ~250-400 KB extra de fuentes (descargadas, no en bundle JS).

**Mitigación**:
- Subset acotado a pesos estrictamente usados (700/800/900 display, 400/500/600 mono).
- Documentar en el reporte del builder el peso real medido en Network panel después de carga.
- Si supera 400 KB, evaluar self-hosting con `font-display: swap` y `unicode-range` subset.
- LandingV3 sigue siendo eager (Decisión D-08), no se complica este bloque.

### R-03 · Mencionar competencia por nombre en la matrix de comparación (P: ALTA · S: ALTA)

**Causa potencial**: el handoff landing sección 5 lista textualmente Moodle, Crehana, Udemy, LinkedIn Learning, Notion, WhatsApp como columnas de comparación. CLAUDE.md y RULES.01.4 prohíben esto en copy al usuario.

**Mitigación**:
- **Esta es pregunta abierta P-01 al final del plan**. El builder NO implementa la matrix con nombres reales hasta que Cristian decida.
- Alternativas para ofrecer a Cristian: (a) reescribir como genéricos ("plataforma X, plataforma Y") con risk de que parezca evasivo, (b) usar logos/iconos sin nombre, (c) eliminar la sección, (d) mantener nombres asumiendo riesgo legal y de marca.
- Si Cristian opta por mantener nombres, requiere validación legal (legal-docs-keeper) por difamación competitiva potencial.

### R-04 · Personas inventadas en testimonios y avatares (P: MEDIA · S: ALTA)

**Causa potencial**: el handoff landing sección 9 (Chat Testimonials) y la sección 6 (Notification ticker) muestran avatares con nombres. RULES.05 exige usar SOLO catálogo `00-PEOPLE-AUTHORIZED.md`.

**Mitigación**:
- **Pregunta abierta P-02**: leer `00-PEOPLE-AUTHORIZED.md` (no leído aún en este plan) y/o pedir a Cristian listado de personas autorizadas.
- Mientras tanto, builders usan placeholders genéricos `[PERSONA AUTORIZADA · pendiente]` y no inventan nombres.

### R-05 · Estadísticas hardcoded llegan a producción sin verificación (P: MEDIA · S: ALTA)

**Causa potencial**: copy-paste del handoff sin sustituir.

**Mitigación**:
- Tabla N14 (`copy-translation.md`) documenta cada estadística pendiente.
- Smoke test agrega assertion: `expect(container.textContent).not.toMatch(/\d+k|\d+\.\d+★|\d+M\b/)` (regex defensivo · si pasa, hay número sospechoso aún en la página).
- Cristian aprueba uno por uno los datos reales antes de cierre Capa 6.

### R-06 · Inconsistencia visual entre Landing v3 (público) y Dashboard actual (autenticado) (P: ALTA · S: BAJA)

**Causa potencial**: usuario hace login y "salta" del rediseño nuevo a la app vieja.

**Mitigación**:
- Esto es esperado y aceptado durante el piloto (Decisión D-03).
- DashboardV3 (ruta paralela) ofrece punto de comparación.
- Documentar en `docs/inspecciones/` para que Cristian lo confirme antes de Capa 7.

### R-07 · Componente Sidebar/TopBar de la app autenticada interactúa mal con DashboardV3 (P: MEDIA · S: MEDIA)

**Causa potencial**: el rediseño v3 asume nav propia, pero la app autenticada inyecta Sidebar y TopBar globales.

**Mitigación**:
- DashboardV3 inicial respeta el layout actual (renderiza dentro del `<main className="main-content">` del App.tsx).
- Si el diseño del módulo 03 requiere ocupar full-bleed sin sidebar, queda como pregunta abierta P-03.

### R-08 · Tests existentes se rompen por DOM/aria (P: BAJA · S: MEDIA)

**Causa potencial**: cambios accidentales a estructura semántica de Login/Register que tests esperan (Bloque 1 dejó tests que verifican el flujo legal).

**Mitigación**:
- LoginV3 y RegisterV3 son archivos NUEVOS · los tests del Bloque 1 que apuntan a `Register.tsx` no se ven afectados.
- Smoke tests de v3 son aditivos, no reemplazan los existentes.

### R-09 · Estimación de tiempo (P: ALTA · S: BAJA)

La petición sugiere "1 semana". Mi estimación realista:

- Tokens + fuentes: 0.5 día
- Componentes de marca: 0.5 día
- LandingV3 completa (13 secciones del handoff): 3 días (es trabajo masivo de CSS · 2880 líneas de Landing actual sirven de comparación de orden de magnitud)
- Auth v3 (Login + Register): 1.5 días
- Dashboard v3: 1 día (incierto · módulo no iterado)
- Tests + verificación: 0.5 día
- Iteraciones de Capa 6: imposibles de estimar sin saber cuántas vueltas pide Cristian

**Total**: 7-10 días hábiles para Capas 1-5. Capa 6 abierta. Una semana es OPTIMISTA pero no irreal si Cristian no pide muchas iteraciones en cada checkpoint.

**Mitigación**: aprobar el plan en checkpoints intermedios (después de cada paso del §4) en lugar de esperar al final.

### R-10 · `Dashboard.tsx` se modifica accidentalmente (P: BAJA · S: ALTA)

**Causa potencial**: confusión entre `Dashboard.tsx` (FROZEN) y `DashboardV3.tsx` (nuevo).

**Mitigación**:
- Hook `check-frozen.sh` bloquea ediciones a Dashboard.tsx.
- El builder usa rutas distintas (`src/pages/Dashboard.tsx` vs `src/pages/v3/DashboardV3.tsx`) que reducen confusión.
- Truth-auditor verifica explícitamente `git diff main src/pages/Dashboard.tsx` vacío al cierre.

---

## 7. Fuera de scope

Lo que NO se hace en este bloque, con justificación:

| ID | Fuera de scope | Razón |
|----|----------------|-------|
| OOS-01 | Los 31 módulos restantes del paquete (04 Biblioteca, 05 Workspaces, 06 Perfil Social, 07 Chat, 08 Configuración, 09 Cursos, 10 Tutores, 11 Classroom, 12 Oferta laboral, 13 CV editor, 14 Mi Universidad, 15 Gamification, 16 Study Rooms, 17 Quizzes, 18 Calendar, 19 Workspace Athena, 20 Móvil, 21 Tienda virtual + 9 Business modules + 6 Onboarding pages) | El piloto valida la dirección antes de invertir el rediseño completo. |
| OOS-02 | Mobile / Capacitor / Android / iOS | El handoff es desktop-first; el paquete contempla 5-device pero esa expansión está marcada como tarea separada. |
| OOS-03 | Tema dark del nuevo sistema v3 | El handoff es paper-on-ink (light). Versión dark se diseña en bloque siguiente. |
| OOS-04 | Tests E2E visuales (Playwright, screenshot diff) | El proyecto no tiene esta infraestructura aún; agregarla es bloque propio. |
| OOS-05 | Migración de iconos a Lucide (o mantener custom Icons.tsx) | Por ahora reutilizar `src/components/Icons.tsx` existente o agregar SVGs inline donde el handoff lo requiera. Decisión iconos = bloque siguiente. |
| OOS-06 | Extensión de navegador, Electron desktop | Mismo motivo que mobile. |
| OOS-07 | Onboarding flow completo (verificación universidad + carrera + intereses + comunidades + bienvenida) | Requiere endpoints backend (`/api/v1/verify/*`, `/api/v1/onboarding/*`) que no existen hoy. Es bloque dedicado. |
| OOS-08 | 9 páginas de Business (Personas, Contabilidad, Trabajo, Reclutamiento, Payroll, CRM, Operaciones, Ventas, Inventario) | Son rutas adicionales con copy específico; no forma parte del piloto de superficies clave. |
| OOS-09 | Refactor de los 8 temas existentes (consolidación, eliminación, renombrado) | Decisión estratégica que requiere análisis de uso real. Bloque dedicado post-piloto. |
| OOS-10 | Migración de Landing.tsx legacy a lazy-load | Documentado como deuda en Decisión D-08. |
| OOS-11 | Quitar el FROZEN de Dashboard.tsx y reemplazar por DashboardV3.tsx | Solo si Cristian aprueba en Capa 6. Bloque siguiente. |
| OOS-12 | Renombrar/eliminar tier "max" legacy (memoria `project_tier_max_cleanup.md`) | Bloque dedicado, no relacionado al rediseño visual. |
| OOS-13 | Modificación de cualquier lógica de negocio (autenticación, validación, llamadas API) | El bloque es VISUAL. Lógica se preserva al 100% en LoginV3 y RegisterV3. |

---

## 8. Componente legal

### 8.1 Componentes legales involucrados (no agregados, solo preservados)

El bloque piloto NO agrega lógica legal nueva, pero preserva la del Bloque 1 (auth-edad).

- RegisterV3 importa y muestra `AGE_DECLARATION_TEXT_V1` literal (sin parafrasear) desde `shared/legal_texts` (FROZEN)
- RegisterV3 mantiene checkbox dual-state: deshabilitado hasta que el usuario abra el documento legal · etiqueta "He leído y acepto" (no "Acepto"), evidencia de lectura grabada vía endpoint backend ya existente
- Hash SHA-256 del texto sigue siendo el mismo · `verify-legal-texts-sync.sh` debe seguir pasando
- Visibilidad legal en interfaz (citas adyacentes a datos) NO aplica en este bloque (Landing y Dashboard piloto no muestran datos legales · solo Register lo hace y mantiene la implementación actual)

### 8.2 Verificaciones legales del scope visual

- Copy nuevo NO menciona "IA" / "AI" / "inteligencia artificial" (verificable con grep)
- Copy nuevo usa tuteo chileno (verificable con grep de voseo)
- Copy nuevo NO inventa estadísticas (verificable con regex de números seguidos de `k`, `M`, `★`)
- Copy nuevo NO menciona competencia por nombre en matrix (pendiente decisión P-01)
- Avatares solo de catálogo `00-PEOPLE-AUTHORIZED.md` (pendiente lectura · P-02)
- Cualquier mención a Ley 19.628 o Ley 19.496 que aparezca en el rediseño debe citar artículo específico (no genérico). Si Landing introduce frases como "Cumplimos Ley 19.628", debe ser "Tus datos se procesan bajo Ley 19.628 de Protección de Vida Privada" (formato §RULES.02.5).

### 8.3 Aprobación humana requerida

Por CLAUDE.md §"Flujo reforzado para código con componente legal", cualquier cambio sobre archivos con palabras clave legales (incluye Register.tsx por proximidad al texto AGE_DECLARATION) requiere aprobación humana explícita antes del cierre de Capa 7.

**Para este bloque**: como NO se modifica el texto legal ni la estructura de evidencia de lectura, la aprobación humana se reduce a confirmar que el componente visual nuevo no rompe ninguno de esos flujos. Cristian valida en Capa 6.

---

## 9. Preguntas abiertas para Cristian

Numeradas. Una a la vez. Esperan respuesta antes de pasar a builder.

### P-01 · Cómo tratar la matrix de comparación (sección 5 del handoff landing)

**Contexto**: el handoff lista 7 competidores por nombre (Moodle, Crehana, Udemy, LinkedIn Learning, Notion, WhatsApp) con cruz/check. CLAUDE.md §Convenciones y RULES.01.4 prohíben mencionar competencia por nombre en copy al usuario.

**Alternativas**:

- **A) Genéricos**: reescribir como "plataforma de cursos genérica", "herramienta de notas", "mensajería". Riesgo: parece evasivo y resta fuerza al mensaje.
- **B) Iconos sin nombre**: mostrar logos pero sin nombrar; el usuario los reconoce visualmente. Riesgo: misma exposición legal/marca.
- **C) Eliminar la sección**: simplificar a un mensaje "Una sola app vs muchas apps" sin matrix detallada.
- **D) Mantener nombres**: aceptar el riesgo legal/marca sabiendo que la regla del proyecto se rompe en este caso. Requiere `legal-docs-keeper` antes de Capa 4.

### P-02 · Personas autorizadas para avatares (sección 6 y 9 del handoff)

**Contexto**: handoff usa avatares con nombres en notification ticker y chat testimonials. RULES.05 exige catálogo `00-PEOPLE-AUTHORIZED.md`.

**Alternativas**:

- **A)** Compartirme `00-PEOPLE-AUTHORIZED.md` para que el builder use solo esas personas
- **B)** Usar avatares anónimos/iniciales (sin nombre, sin foto) en el piloto
- **C)** Diferir testimonials a bloque siguiente, reemplazar por otra sección visual

### P-03 · Layout DashboardV3 vs Sidebar/TopBar global

**Contexto**: el módulo 03 está NO_ITERATED. El HTML depositado podría asumir layout full-bleed sin sidebar. App.tsx envuelve todas las rutas autenticadas con Sidebar + TopBar.

**Alternativas**:

- **A)** DashboardV3 respeta el layout actual (Sidebar + TopBar fijos), y el rediseño solo aplica a su área de contenido
- **B)** DashboardV3 toma full-bleed: en App.tsx, la ruta `/dashboard-v3` se renderiza fuera del `<main className="main-content">` (excepción)
- **C)** Diferir Dashboard del piloto, hacer solo Landing + Auth

### P-04 · Feature flag `VITE_AUTH_V3` o swap directo

**Contexto**: para activar LoginV3/RegisterV3 propongo un feature flag.

**Alternativas**:

- **A)** Feature flag en `.env`: limpio, reversible, requiere documentar en Vercel también
- **B)** Swap directo en App.tsx: una constante exportada de un archivo `src/config/v3.ts` con `export const AUTH_V3_ENABLED = true;`. Más simple, mismo efecto.
- **C)** Sin flag: el piloto se publica con v3 directo y se mantiene la versión vieja como respaldo

### P-05 · Estadísticas placeholder vs ocultas

**Contexto**: muchos números del handoff son inventados. Necesitamos política consistente.

**Alternativas**:

- **A)** Mostrarlos como `[PENDIENTE · dato real requerido]` literal en pantalla. Útil para inspección Cristian, ruidoso.
- **B)** Ocultarlos detrás de `?stats=demo` query param: la página se ve completa solo en modo demo. Para visitas reales, las secciones con datos se pliegan o muestran texto sin número.
- **C)** Reemplazar por copy sin número ("muchos títulos", "estudiantes activos", "comunidad creciente"). Menos impactante pero seguro.

### P-06 · Inconsistencia visual aceptable durante el piloto

**Contexto**: si solo se rediseñan Landing + Auth + DashboardV3 paralelo, el resto de la app sigue con los 8 temas viejos. Usuario que entra desde landing v3, hace login, llega a Workspaces (tema antiguo) puede sentir disonancia.

**Pregunta**: ¿es aceptable durante el periodo de inspección (Capa 6) o requiere mitigación adicional (banner "estamos rediseñando")?

### P-07 · Lectura completa del Landing.html del handoff

**Contexto**: el plan se basa en el README.md del handoff (451 líneas). El Landing.html tiene 2768 líneas con detalles que el README no captura completos.

**Pregunta**: ¿el builder puede asumir el README como fuente de verdad y usar el Landing.html solo como referencia visual? ¿O quieres que el plan se reescriba después de leer todo el HTML?

### P-08 · Quién decide entre el módulo 02-landing del paquete principal y el handoff hi-fi

**Contexto**: hay 2 fuentes para el landing: `02-landing-20260419-1650.md` (paquete principal, módulo cerrado) y `design_handoff_conniku_landing/README.md` (handoff hi-fi separado). Tienen estructura distinta de secciones.

**Pregunta**: ¿prevalece el handoff hi-fi para el landing? ¿O el módulo 02 del paquete principal? El plan asume **handoff** porque es hi-fi pixel-perfect; el módulo 02 del paquete podría ser solo para los 16 HTMLs del bundle (auth + verificación + carrera + intereses + comunidades + bienvenida + 9 business), no para el landing en sí.

---

## 10. Referencias y notas finales

- Protocolo a usar: 7 capas (CLAUDE.md §18) con nota: Capa 6 será iterativa hasta que Cristian dé OK final.
- Modelo recomendado para builder: Sonnet (trabajo regular sin complejidad legal especial). Opus solo si surge bug complejo durante implementación.
- Auto Mode: OFF (CLAUDE.md §19), modo estricto en cada paso.
- Plan generado por web-architect Tori, Opus 4.7, sesión 2026-04-19.
- Aprobación humana de este plan: PENDIENTE.

```
NEXT STEP: Cristian revisa el plan, responde P-01 a P-08, aprueba o pide ajustes.
NEXT STEP: tras aprobación, frontend-builder ejecuta Paso 1 del §4 y reporta antes de Paso 2.
```

---

## 11. DECISIONES CERRADAS POR CRISTIAN (2026-04-19)

Las 8 preguntas abiertas resueltas. Plan listo para invocar frontend-builder.

| Pregunta | Decisión | Implicancia para builder |
|---|---|---|
| **P-1** matrix competitiva | **C** Eliminar matrix, sustituir con sección positiva "Lo único que entrega Conniku" | NO incluir tabla con Moodle/Crehana/Udemy/etc. Crear sección con 7 capacidades destacadas con copy de marketing positivo. |
| **P-2** avatares testimonials | **B** Anónimos con iniciales | NO usar fotos reales de `~/Desktop/IMAGENES PARA PUBLICIDAD/` en este piloto. Usar componente avatar circular con iniciales (`AB`, `CD`, etc.) generadas. Diferir personas reales a bloque siguiente. |
| **P-3** Dashboard + Sidebar | **A** Diseño nuevo embebido en Sidebar+TopBar actuales | `/unfreeze Dashboard.tsx` con justificación "rediseño piloto v3". NO tocar Sidebar.tsx ni TopBar.tsx. El nuevo diseño se acomoda al área central disponible. |
| **P-4** activación auth v3 | **B** Constante `AUTH_V3_ENABLED` en `src/config/v3.ts` | Crear archivo nuevo `src/config/v3.ts` con `export const AUTH_V3_ENABLED = true;`. NO usar feature flag de Vercel. |
| **P-5** estadísticas placeholder | **C** Copy sin número | Reemplazar `+70k títulos` → `biblioteca extensa`, `127 estudiando` → `comunidad activa`, `41% retención` → eliminar. NO inventar números. |
| **P-6** inconsistencia visual | **A** Aceptable durante Capa 6 | NO agregar banner de "estamos rediseñando". El usuario ve landing v3 + login v3 + dashboard v3 + workspaces viejo coexistiendo. Cristian inspecciona y decide. |
| **P-7** Landing.html del handoff | **A** README como spec, HTML como referencia | Builder lee `design_handoff_conniku_landing/README.md` (451 líneas) como fuente de verdad. Abre `Landing.html` (2768 líneas) solo para verificar layout/visual cuando hay duda. |
| **P-8** fuente del landing | **A** Handoff hi-fi | Usar `design_handoff_conniku_landing/` como fuente PRINCIPAL del landing. El módulo `02-landing` del paquete principal queda como referencia secundaria si difiere. |

**Próximo paso autorizado**: invocar `frontend-builder` con scope completo, pasos del §4 del plan, y estas decisiones aplicadas.
