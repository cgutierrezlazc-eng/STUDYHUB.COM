# Análisis de viabilidad — Design Handoff Landing Conniku

**Fecha:** 2026-04-18
**Agente:** web-architect (Tori)
**Tipo:** Análisis técnico, sin aplicación
**Ubicación del handoff:** `/tmp/conniku-design-system/design_handoff_conniku_landing/`

---

## 1. Qué es el handoff

### 1.1 Descripción objetiva

Paquete de diseño de alta fidelidad (hi-fi) para una nueva landing page
de Conniku, entregado como prototipo HTML autocontenido más README
extenso, dos logos SVG, y 10 capturas PNG que documentan la página de
arriba hacia abajo.

El README es explícito: los archivos **no son código de producción para
copiar**. Son la "fuente de verdad del intento visual" (layout, color,
tipografía, espaciado, movimiento) y la "fuente de verdad del
contenido" (copy). El desarrollador debe recrearlo idiomáticamente en
el stack existente.

### 1.2 Estructura (13 secciones de arriba hacia abajo)

0. Barra de progreso superior (fija): `SEMESTRE 2026-1` + barra
   gradiente lime-pink `34% · día 41 de 120`
1. Nav tipo pill oscura, logo lime cuadrado, links `Producto · Precios
   · U · Blog`, búsqueda con atajo `⌘K`, CTA lime
2. Hero gigante: titular H1 `clamp(72px, 11vw, 176px)` en tres líneas
   con tratamientos mixtos (outline, fondo lime pill, fondo cream
   pill, splatter dots multicolor sobre la palabra pink)
3. Anti-manifiesto: ticker horizontal infinito con chips negativos
   (tachados) y positivos (lime) rotando
4. Sticker grid de 7 capacidades con bordes 2px ink, rotaciones
   -1.3° a +1.2°, sombras duras `8px 8px 0 ink` en hover
5. Matriz comparativa 8 columnas contra Moodle, Crehana, Udemy,
   LinkedIn Learning, Notion, WhatsApp. Score final 7/7 vs 0-1
6. Ticker de notificaciones (tarjetas rotando cada 2800ms)
7. Big stats a 4 columnas con una destacada lime-sobre-ink
8. Manifesto quote full-bleed: "Concentración / con pertenencia"
   con splatter dots
9. Testimonials estilo chat de mensajería
10. Timeline "Tu día" (7 AM a medianoche)
11. Multi-país dark full-bleed: Chile en vivo, México Q3 2026, USA 2027
12. CTA final repetido
13. Footer estilo tracklist de vinilo

### 1.3 Stack CSS / tecnológico que usa

- **CSS plano con variables custom** (`:root { --ink: ... }`), no
  Tailwind ni CSS-in-JS. El README recomienda Tailwind y Next.js 14
  como destino ideal, pero reconoce que se puede adaptar a cualquier
  stack.
- **Fuentes externas de Google Fonts:** Funnel Display (400-900) y
  Geist Mono (400-700). Ambas son necesarias para el carácter
  editorial. No están en el proyecto hoy.
- **Motion:** CSS keyframes puros para el ticker de anti-manifiesto
  (40s linear infinite); JS mínimo para contador hero, rotación de
  notificaciones, y ping de pulso. Sugieren Framer Motion (ya
  instalado) para reveals on-scroll.
- **Iconografía:** SVG inline 24×24, stroke 2-3, linecap round. Sin
  librería obligatoria; Lucide o Phosphor aceptados como drop-in
  (Lucide React ya está instalado).

### 1.4 Tipografía del handoff

| Uso | Fuente | Escala |
|---|---|---|
| Headlines | Funnel Display (extra-bold, tracking -.045 a -.055em) | `clamp(44px, 5.5vw, 84px)` a `clamp(72px, 11vw, 176px)` |
| Body lead | Funnel Display 500 | 20px / 1.35 |
| Body | Funnel Display 400 | 16px / 1.5 |
| Labels / meta | Geist Mono | 10-12px uppercase tracking .1-.14em |

Es una identidad **display-driven**: la tipografía es la estrella, no
un acompañante del layout.

### 1.5 Paleta cruda

- **Tintas:** `#0D0F10` (ink) / `#2B2E30` / `#696C6F` / `#A0A3A7`
- **Papel:** `#F5F4EF` (fondo base — warm paper, no blanco puro) /
  `#EBE9E1` / `#DBD9CF`
- **Lime:** `#D9FF3A` (acento primario, CTAs, destacados)
- **Pink:** `#FF4D3A` (coral-rojo, no magenta — energía, urgencia)
- **Cream:** `#FFE9B8` (highlights suaves)
- **Violeta, cyan, blue, electric, orange** como acentos secundarios

Son colores **fijos por marca**, no depende de tema. El handoff
entrega un único "modo": paper claro con tintas oscuras.

### 1.6 Microinteracciones declaradas

- Hero counter incrementa +1 cada 6-10s (simulación live count)
- Ticker anti-manifiesto: 40s linear infinite, pausa opcional on-hover
- Notificaciones rotan cada 2800ms
- Stickers: lift -3px + sombra dura `8px 8px 0 ink` en hover
- Pulse dots cada 1.6s con `cubic-bezier(.2,.8,.2,1)`
- On-scroll: fade + translateY 20→0 en 400ms (IntersectionObserver o
  Framer Motion `whileInView`)

---

## 2. Comparación con el proyecto actual

### 2.1 Landing actual en `main`

- `src/pages/Landing.tsx`: **2880 líneas**, React con estilos inline
  usando variables CSS del tema activo (`var(--accent)`,
  `var(--bg-primary)`, `var(--text-primary)`, etc.).
- Composición actual: nav, hero con dos columnas (copy + laptop
  mockup animado), sección de features con cards clicables que
  abren modales con mockups internos (ProfileMockup, ChatMockup,
  DocAIMockup, FeedMockup, JobMockup, etc.), bloque "Estudia /
  Conecta / Crece", CTA final.
- Respeta los 6 temas existentes (Sereno, Nocturno, Calido, Bosque,
  Oceano, Conniku, Pizarra, Dorado — en realidad ocho variantes en
  `global.css`). La estética actual es **clean-SaaS**: cards con
  `border-radius: 8-12px`, sombras suaves, colores neutros que
  cambian según tema, tipografía Inter.
- Usa `useI18n()` (es/en/pt) con claves como `landing.heroTitle1`,
  `landing.heroHighlight`, lo que implica que el copy vive en
  archivos de traducción, no hardcoded.
- LogoMark azul Conniku `#2D62C8` cuadrado con círculo abierto al
  centro (consistente con la marca actual).

### 2.2 Workspaces v2 (identidad híbrida reciente)

El módulo construido en los últimos bloques define identidad híbrida
documentada en el header de `src/styles/workspaces.css`:

- **Respeta los 6 temas existentes** vía variables CSS
- **Agrega tipografía premium propia del editor:** Fraunces (serif
  display), Inter (body), JetBrains Mono (meta)
- **Namespaced con prefijo `ws-`** para evitar colisiones

Esta decisión "C1" fue explícita de Cristian: no romper los temas,
sumar carácter sobre la base compartida.

### 2.3 Diferencias visuales clave

| Eje | Landing actual | Handoff propuesto |
|---|---|---|
| Fondo base | `var(--bg-primary)` (cambia por tema — blanco, negro, oceano, etc.) | `#F5F4EF` fijo (warm paper) |
| Tipografía display | Inter 800 / Outfit 700 (logo) | Funnel Display 900 |
| Tipografía mono | JetBrains Mono | Geist Mono |
| Serif editorial | Fraunces (solo Workspaces) | Ninguna — todo sans display |
| Escala H1 | 32-54px | 72-176px (triple el tamaño) |
| Letter-spacing | -0.04em | -0.045 a -0.055em |
| Acento primario | `#2D62C8` azul Conniku | `#D9FF3A` lime + `#FF4D3A` pink |
| Radio tarjetas | 8-14px | 24px |
| Sombras | Suaves, blur-based | Duras, offset 8×8 sin blur |
| Rotaciones decorativas | Ninguna | -1.3° a +1.2° en stickers |
| Temas | 8 variantes | 1 fijo (paper + ink) |
| Motion | Scroll fade + count-up | Ticker 40s infinite + rotaciones + splatter dots |
| Carácter | SaaS universitario limpio | Revista editorial + cuaderno estudiantil |

### 2.4 Qué aprovecha y qué cambia

**Aprovecha:**
- Framer Motion (ya instalado) para reveals
- Lucide React (ya instalado) para iconos
- IntersectionObserver ya implementado (`useScrollAnimation`)
- i18n ya montado (para exponer copy bilingüe)
- Estructura React + Vite existente

**Cambia de raíz:**
- Paleta entera de la landing (abandona los 6 temas en esa ruta
  específica)
- Todas las tipografías (Inter → Funnel Display; JetBrains → Geist)
- Escala visual (headlines 3× más grandes)
- Lenguaje visual (SaaS → editorial magazine)
- Composición del hero (dos columnas con mockup → una columna con
  tipografía gigante)
- Lógica del logo: del cuadrado azul al cuadrado lime

---

## 3. Viabilidad técnica

### 3.1 Veredicto: **MEDIA**

Técnicamente es recreable, pero tiene fricciones importantes con
decisiones ya tomadas del proyecto. No es un drop-in.

### 3.2 Dependencias nuevas requeridas

- **Funnel Display** y **Geist Mono** de Google Fonts. Dos familias
  completas cada una con 5-6 pesos. Impacto en bundle de fuentes:
  aproximadamente 150-300 KB adicionales si se cargan los pesos
  declarados (400-900 Funnel, 400-700 Geist). Mitigable con
  `font-display: swap` y subsetting a latin.
- Twemoji (opcional, sugerido) para banderas cross-platform.
- No requiere Tailwind (el README lo sugiere pero no lo exige);
  nuestras variables CSS actuales alcanzan para portar tokens.

### 3.3 Fricción con los 6 temas (CRÍTICA)

La landing del handoff **usa una paleta fija paper/ink** sin variantes
de tema. Incompatible con el patrón actual donde la landing responde
a `[data-theme="nocturno"]`, `[data-theme="conniku"]`, etc.

**Tres opciones de resolución:**

- **A.** Tratar la landing como excepción (igual que `auth.css` podría
  serlo): paleta fija, tipografía fija, ignora el tema activo.
  Justificable porque la landing es marketing y no requiere coherencia
  con el dashboard interno.
- **B.** Remapear los tokens del handoff a `var(--accent)`,
  `var(--bg-primary)`, etc. Resultado: el carácter editorial se
  pierde en temas oscuros (el lime pierde impacto, splatter dots
  colisionan con fondos negros).
- **C.** Solo recuperar el tema "default" (Sereno) cuando el usuario
  no está autenticado, y permitir tema propio solo post-login.

Opción A es la más honesta con la intención del diseñador. Opción B
diluye el diseño al punto de no valer la pena. Opción C es la más
limpia pero requiere cambios en routing/theme-provider.

### 3.4 Fricción con identidad Workspaces v2

El handoff **no usa Fraunces** (serif editorial); usa Funnel Display
extra-bold para todo el display. Esto **choca con la decisión C1** de
Workspaces v2 donde el serif es el ancla de carácter.

Resolverlo exige decisión explícita:
- ¿La landing vive en otra identidad que la app autenticada? (viable,
  es práctica común: landing editorial + app productiva)
- ¿O se fuerza la landing a usar Fraunces headlines para coherencia,
  sacrificando el look del handoff? (pierde mucho del handoff)

No hay respuesta técnica; es una decisión de marca que Cristian debe
tomar.

### 3.5 Responsive y mobile (PWA, Capacitor)

El README declara breakpoints a 1080px y 680px, y exige funcionar a
375px. Stickers colapsan a col-span 12, timeline a 2 cols, nav
simplifica a logo + CTA.

Técnicamente viable. Observaciones:
- El H1 `clamp(72px, 11vw, 176px)` a 375px resulta en 72px, lo cual
  ocupa 6-8 ch por línea y puede romper en palabras largas
  ("universitarios"). Requiere testing real en device.
- La app está empaquetada con Capacitor para móvil; normalmente la
  landing no se distribuye en la app nativa (se va al dashboard
  directo post-login). Si la landing sí se empaqueta, el ticker de
  40s infinite consume batería continua en background; aceptable si
  respeta `prefers-reduced-motion`.

### 3.6 Accesibilidad WCAG AA

El README declara haber auditado contraste:
- Ink sobre paper = 16:1 (excelente)
- Lime-ink sobre lime = 13:1 (excelente)
- **Blanco sobre pink = ~3.5:1** — limítrofe. El README mismo admite
  que solo se use en texto 18px+ weight 700+. Requiere auditoría al
  implementar cada instancia de texto blanco sobre pink.

Respeta `prefers-reduced-motion` (desactiva ticker, rotación,
pulse). Focus states declarados (outline lime 2px, offset 2px).

Observación: el titular H1 con splatter dots via `::before/::after`
box-shadow es **puramente decorativo**, pero si el lector de pantalla
lee la palabra "pink" (etiqueta semántica), puede generar ruido.
Mitigable con `aria-hidden` apropiado.

### 3.7 Conflicto crítico con regla de producto — "no mencionar IA"

**Hallazgo importante.** El handoff usa texto visible al usuario con
las palabras "IA" de forma recurrente. Ejemplos literales que detecté
en screenshots y en el README:

- Capacidad 02: "Documentos con chat **IA**"
- Stats section (screenshot 07): "títulos con chat **IA**"
- Descripción del hero: "Sync con tu U, documentos con **IA**,
  tutores verificados..."
- Footer card del sticker grid: "Construido con **IA** en 5 min"
- Matrix row: "Documentos con chat **IA** propio"

Esto **viola la regla crítica** documentada en CLAUDE.md:

> nunca mencionar las palabras "IA", "AI" ni "inteligencia artificial"
> en texto visible al usuario final. Las alternativas válidas son
> "asistente inteligente", "herramientas inteligentes",
> "automáticamente", "estudio inteligente".

Si se adopta este handoff, **todo el copy debe pasar por una capa de
reescritura** antes de entrar al código. No es un find-replace
trivial: "chat IA" → "chat inteligente" cambia el ritmo del titular.
Esta reescritura debe pasar por legal-docs-keeper + revisión humana
porque el copy es parte del contrato implícito con el usuario y del
marketing.

---

## 4. Lo que se puede aplicar directo (con mínimos cambios)

- **Tokens de color** como variables CSS en `:root` (excluidos del
  sistema de temas, scoped a `.landing-paper` o similar).
- **Fuentes** vía `@fontsource` o Google Fonts link.
- **Estructura de secciones** como componentes React separados (el
  README ya los lista: `<HeroSection />`, `<AntiManifestoRail />`,
  etc.).
- **Keyframes CSS** del ticker (`@keyframes antiroll`) y del pulse
  ping.
- **Matriz comparativa** con datos fijos (las 7 capacidades vs 6
  competidores) — es contenido tabular sin lógica de negocio.
- **Timeline "Tu día"** — decorativo, sin estado.
- **Footer tracklist** — decorativo.

---

## 5. Lo que requiere adaptación

- **Hero counter** `estudiando ahora mismo 127`: el proyecto ya tiene
  `useOnlineCount()` conectado al backend. Debería usarse ese en vez
  del incremento random simulado del handoff. Requiere decisión
  sobre comportamiento cuando `online.total === 0` (landing actual
  oculta el chip en ese caso; el handoff no contempla estado vacío).
- **Copy bilingüe**: el handoff trae copy hardcoded en español. Debe
  portarse a claves `t('landing.v2.*')` en i18n antes de implementar.
  Idealmente se crea un nuevo namespace `landing.v2` para no romper
  la landing vieja si se decide cohabitar.
- **CTAs de navegación**: "Entrar gratis" → `onRegister()`,
  "Entrar" → `onLogin()`. Mapeo mecánico pero requiere preservar
  las props `onLogin` / `onRegister` existentes.
- **LogoMark**: el handoff usa logo cuadrado lime con SVG. El logo
  oficial de Conniku es azul `#2D62C8`. El SVG en el handoff
  (`logo.svg`) **podría no ser el logo oficial**; hay que
  verificar con Cristian antes de adoptar. Recordar incidente
  2026-04-12 (usar solo assets que Cristian proporcione).
- **Notification feed**: puede consumir eventos reales del backend
  (posts de comunidad, nuevos matches de tutor) o quedarse como
  demo estática. Decisión de producto.
- **Matriz comparativa**: la fila "Documentos con chat IA propio"
  debe reescribirse como "Chat con tus documentos" o similar
  (regla "no IA").

---

## 6. Lo que NO conviene aplicar

- **Copy literal con "IA"**: conflicto con regla de producto. Todo el
  texto visible debe reescribirse. Bloqueante de adopción.
- **Paleta imponiéndose sobre temas globales**: si se intenta meter
  el lime como nuevo `--accent` del tema default, rompe todo el
  dashboard, los workspaces, los auth screens. La paleta del
  handoff debe quedarse **encapsulada en la landing**, no filtrarse.
- **Splatter dots con múltiples `box-shadow` offsets**: son
  decorativos pero agregan complejidad CSS de mantener. Evaluar si
  el valor visual justifica el mantenimiento. Posiblemente aceptable
  solo en el hero y la manifesto quote, no en todas las secciones.
- **Scroll-jacking / animaciones pesadas** en móvil low-end: el
  ticker de 40s infinite en background puede afectar FPS en devices
  antiguos. Respetar `prefers-reduced-motion` obligatorio, y
  considerar `will-change: transform` solo donde importa.
- **Logo del handoff sin verificación con Cristian**.
- **Funnel Display para TODO el sitio**: el handoff propone usarla
  para h1+h2+body+lead, lo que significa reemplazar Inter como
  display global. No se recomienda. Mantener Inter en la app
  autenticada; Funnel Display solo en la landing.

---

## 7. Propuesta de orden de integración

Cuatro alternativas con trade-offs:

### Alternativa A — Bloque dedicado post Workspaces v2

Cerrar primero Workspaces v2 y sus iteraciones pendientes. Después,
abrir bloque nuevo `landing-v2-editorial` con su propio plan:

1. Capa 1: web-architect define plan con sub-decisiones (¿mantener
   landing actual en `/old`? ¿feature-flag? ¿coexistir con i18n?)
2. Capa 1: legal-docs-keeper audita copy y propone reescritura
   sin "IA"
3. Capa 1: frontend-builder implementa con TDD (tests de render,
   de responsive, de accesibilidad)
4. Capas 2-7 del protocolo estándar

**Pros:** flujo limpio, no interfiere con trabajo en curso.
**Contras:** Cristian puede querer landing nueva antes que más
Workspaces; depende de prioridad comercial.

### Alternativa B — Sub-bloque dentro de Workspaces v2

No recomendado. Workspaces v2 y landing son dominios distintos; el
protocolo 18.2 principio 1 dice "un bloque a la vez" y un bloque
debe ser autocontenido. Mezclarlos rompe esa regla.

### Alternativa C — Iteración futura sin fecha

Registrar el handoff como insumo disponible pero sin commit de
calendario. Útil si Cristian prioriza otras cosas (backend, legal,
features de producto) antes que rediseño de landing.

**Pros:** no bloquea roadmap.
**Contras:** el handoff puede quedar obsoleto si la marca evoluciona
o si el diseñador deja el proyecto.

### Alternativa D — Descartar y quedarse con landing actual

Viable. La landing actual **funciona, pasa tests, está en producción,
es bilingüe, respeta temas, respeta la regla "no IA"**. El handoff
aporta carácter editorial pero **rompe varias decisiones de marca ya
tomadas** (temas, Fraunces, "no IA", logo azul).

**Pros:** cero riesgo, cero trabajo.
**Contras:** se pierde una propuesta visual fuerte que podría
diferenciar a Conniku del look genérico SaaS.

---

## 8. Recomendación final

**Alternativa A con salvedades, y solo después de tres decisiones de
Cristian en frío.**

Razones a favor de A:
- El handoff es de calidad profesional, con tokens declarados,
  accesibilidad auditada, responsive declarado, microinteracciones
  pensadas. No es un wireframe — es un intento serio.
- El proyecto necesita diferenciación visual para la fase de captura
  de usuarios en Chile (mercado piloto). La landing editorial es
  memorable; la actual es funcional pero genérica.
- El carácter "editorial magazine + student notebook" encaja con el
  público 20-30 años universitario latinoamericano: menos SaaS
  corporativo, más revista de estudiante.

Razones para no avanzar todavía:
- **Conflicto con regla "no IA" es bloqueante**. Hasta que haya copy
  reescrito y aprobado, el handoff no entra.
- **Conflicto con identidad Fraunces de Workspaces v2** requiere
  decisión explícita: ¿landing vive en otra tipografía que la app
  autenticada? Esa decisión es de marca, no técnica.
- **Logo lime vs azul** requiere confirmación del asset correcto.
- Si Cristian todavía está iterando Workspaces v2, abrir landing en
  paralelo viola el principio "un bloque a la vez" (check-lock.sh).

**Tres preguntas que Cristian debe responder antes de abrir el
bloque:**

1. ¿La landing puede vivir en identidad tipográfica distinta a la
   app autenticada (Funnel Display vs Fraunces/Inter), o debe haber
   coherencia total? (Voto técnico: identidad distinta es válida y
   común; Apple, Stripe, Linear lo hacen)
2. ¿Se acepta que la landing sea **excepción a los 6 temas** y viva
   en paper-ink fijo? (Voto técnico: sí, la landing no es dashboard)
3. ¿El logo lime cuadrado del handoff es oficial, o el logo oficial
   sigue siendo el azul `#2D62C8`? (Requiere que Cristian responda)

Si las tres decisiones son favorables, **Alternativa A**. Si alguna
es negativa, caer a **Alternativa D** (descartar) o **C** (archivar
para iteración futura). No recomiendo forzar adaptaciones a medias
que debiliten el handoff.

---

## 9. Secciones obligatorias del protocolo de reporte

### 9.1 Lo que se me pidió

Cita literal del pedido de Cristian:

> "Cristian me pidió evaluar la viabilidad de aplicar al proyecto un
> **design handoff de la Landing page de Conniku** que extrajimos del
> ZIP que nos compartió. [...] **SOLO ANÁLISIS, NO APLICAR NADA**.
> Cristian quiere tu recomendación técnica de viabilidad antes de
> decidir si integrarlo."

Entregable esperado: markdown en
`/Users/cristiang./CONNIKU/docs/reports/2026-04-18-analisis-design-handoff-landing.md`
con 9 secciones prescritas.

### 9.2 Lo que efectivamente hice

Archivos leídos (todos con Read tool, rutas absolutas):

- `/tmp/conniku-design-system/design_handoff_conniku_landing/README.md`
  (453 líneas, completo)
- `/tmp/conniku-design-system/design_handoff_conniku_landing/Landing.html`
  (2768 líneas totales; leí líneas 1-200 y 200-320 para muestrear
  tokens y patrones; no leí las 2768 completas)
- `/tmp/conniku-design-system/design_handoff_conniku_landing/screenshots/01-landing.png`
- `/tmp/conniku-design-system/design_handoff_conniku_landing/screenshots/03-landing.png`
- `/tmp/conniku-design-system/design_handoff_conniku_landing/screenshots/05-landing.png`
- `/tmp/conniku-design-system/design_handoff_conniku_landing/screenshots/07-landing.png`
- `/tmp/conniku-design-system/design_handoff_conniku_landing/screenshots/10-landing.png`
- `/Users/cristiang./CONNIKU/src/pages/Landing.tsx` (parciales:
  1-150, 150-350, 1290-1410; archivo total 2880 líneas)
- `/Users/cristiang./CONNIKU/src/styles/global.css` (1-200, de 5232
  totales)
- `/Users/cristiang./CONNIKU/src/styles/workspaces.css` (1-120 y
  grep de `font-family`)
- `/Users/cristiang./CONNIKU/package.json` (primeras 80 líneas para
  confirmar stack y deps)

Comandos ejecutados:

- `ls -la` del handoff directory
- `wc -l` sobre Landing.html, Landing.tsx, global.css
- `ls` de `/src/pages/`, `/src/styles/`, `/src/components/workspaces/`
- `grep` de `"section\|/\* ═"` sobre Landing.tsx para extraer
  estructura de secciones
- `grep -n "font-family\|Fraunces\|Inter\|JetBrains\|Funnel\|Geist"`
  sobre workspaces.css
- `ls -d /Users/cristiang./CONNIKU/docs/reports/` para confirmar
  destino

Archivo producido (único cambio en disco):

- `/Users/cristiang./CONNIKU/docs/reports/2026-04-18-analisis-design-handoff-landing.md`
  (este documento)

Archivos NO modificados (garantizado por tool Write solo en la ruta
declarada):

- Nada en `/tmp/conniku-design-system/`
- Nada en `/Users/cristiang./CONNIKU/src/`
- Nada en `/Users/cristiang./CONNIKU/docs/legal/`
- Nada en `/Users/cristiang./CONNIKU/docs/plans/`

### 9.3 Lo que no hice y por qué

- **No leí el HTML completo** (2768 líneas). Leí el primer 12% que
  cubre las dos secciones más complejas (progress bar, nav, hero) y
  crucé con el README que documenta todas las demás secciones de
  manera exhaustiva. Si el resto del HTML contiene patrones CSS
  distintos a los documentados, mi análisis puede subestimarlos.
- **No leí el Landing.tsx completo** (2880 líneas). Leí hero y
  estructura general; no revisé uno por uno los 6-8 mockups de
  modales internos (ProfileMockup, ChatMockup, etc.), ni el bloque
  "Estudia/Conecta/Crece", ni el CTA final actual. Esto puede
  hacerme subestimar el trabajo de "qué se conserva vs qué se
  descarta" de la landing actual.
- **No miré los 10 screenshots**, solo 5 (01, 03, 05, 07, 10). Los
  screenshots 02, 04, 06, 08, 09 pueden contener detalles visuales
  que no capturé.
- **No verifiqué si el logo lime del handoff es oficial**. Eso
  requiere intercambio con Cristian.
- **No conté exactamente cuántas apariciones de "IA"** hay en todo
  el copy del handoff — solo las que vi directamente en screenshots
  y README. Puede haber más.
- **No planifiqué el bloque** (eso requiere decisión de Cristian y
  es trabajo separado; este reporte es análisis, no plan).
- **No ejecuté razonamiento extendido explícito** (pensamiento
  profundo declarado) porque la decisión final depende de
  preferencias de marca de Cristian, no de un trade-off técnico
  que yo pueda resolver solo.

### 9.4 Incertidumbres

Declaraciones de lo que podría estar mal en este reporte:

- **Puedo estar subestimando el esfuerzo real** de portar las
  microinteracciones (ticker, notification rotation, splatter
  dots). Sin haber leído las ~2400 líneas restantes de Landing.html,
  no puedo dar una estimación de horas defendible. La cifra que
  tengo mentalmente de "viabilidad media" podría ser optimista.
- **Puedo estar sobre-estimando el conflicto con identidad Fraunces
  de Workspaces v2**. Es posible que Cristian siempre haya
  imaginado la landing con identidad separada de la app, y yo esté
  construyendo un conflicto que no existe en su cabeza.
- **La banda "media" de viabilidad** es subjetiva. Otro agente podría
  argumentar razonablemente "baja" (por el conflicto IA + temas +
  logo + tipografía) o "alta" (por la calidad del handoff y la
  disponibilidad de stack compatible). Elegí "media" como punto
  medio defendible.
- **No validé que Funnel Display y Geist Mono estén disponibles
  gratis en Google Fonts**. El README afirma que sí, pero no abrí
  la URL para confirmar. Si alguna no estuviera disponible, cambia
  el análisis de dependencias.
- **El landing actual puede estar menos pulido de lo que asumí**.
  Describí la landing actual por las ~150 primeras líneas y una
  sección del hero; es posible que tenga bugs, código legacy, o
  deuda técnica que justifique un reemplazo más agresivo de lo que
  recomendé.
- **El conflicto con "no IA"** es real, pero puede no ser
  bloqueante si Cristian decide que reescribir el copy vale la
  pena. Mi lectura de "bloqueante hasta reescritura" asume que
  esa reescritura es no-trivial; podría no serlo.
