# CONTEXT · CONNIKU-LANDING-MASTER-2026

```yaml
LAST_UPDATE:  2026-04-20
STATUS:       BASE_FROZEN · awaiting next instructions
OWNER:        Cristian Gutiérrez Lazcano (cgutierrezlazc@gmail.com)
LOCATION:     /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/
```

---

## 1 · Archivos en esta carpeta

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `landing.html` | Landing base · Ink Halftone + Grain | **CONGELADO** · no modificar |
| `landing.md` | Spec Claude Code estricto · 21 secciones L.01–L.21 | Completo |
| `devices-preview.html` | Vista multi-dispositivo embebida vía srcdoc | Completo |
| `CONTEXT.md` | Este archivo · punto de retorno | Vivo |

---

## 2 · Origen

Este landing nace de un proceso iterativo en `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/PROPUESTAS-LANDING/`:

1. **6 propuestas visuales iniciales** (Editorial Sticker, Brutalist Terminal, Risograph, Neo-futurista, Campus Collage, Swiss Grid)
2. El usuario eligió **Editorial Sticker (01)** como base y pidió 6 variantes con fondos de tinta
3. De las 6 variantes de tinta (blots, wash, splatter, pool, brush, halftone), eligió **01F Halftone**
4. Iteraciones sobre 01F:
   - Eliminadas manchas y salpicaduras (quedó solo el halftone de puntos)
   - Fondo oscurecido a `#E8E5DB`
   - Halftone separado en 4 cuadrantes sin superposición
   - Eliminada línea ink que se sobreponía al footer negro
   - Logo oficial: u-pack reemplazado por SVG app-icon (tile cuadrado 1.18em, u interna matching cap-height, translateY .32em para baseline)
5. Congelado como base. Copiado a esta carpeta como `landing.html`
6. Agregados breakpoints responsive (1080 / 900 / 640px)
7. Creada `devices-preview.html` con 5 device frames (web / iPad / tablet / iPhone / Android) usando srcdoc embebido

---

## 3 · Decisiones cerradas

```yaml
brand:
  wordmark_structure: "connik + u-tile"
  u_tile_implementation: "inline SVG app-icon geometry (LOGO.04)"
  u_tile_size: "1.18em × 1.18em"
  u_tile_margin_left: ".02em"
  u_tile_translateY: ".32em"
  rule: "connik + u-tile never separated · margin ≤ .04em"

visual:
  aesthetic: "editorial + sticker rotations + halftone dots background"
  background: "#E8E5DB (darker paper)"
  highlight_style: "marker underline lime (campus collage style) + rotation -1deg"
  ink_dot_orange: "only inside official logo · never elsewhere (decidido el 2026-04-20 · parcialmente aplicado · h1 .dot sigue naranja en 'entera.')"

halftone:
  layers: 4  # d1 lime SL · d2 orange IR · d3 violet SR · d4 cream IL
  rule: "no d5 · no ink-blobs · no splatter · masks ≤ 42% · mix-blend-mode:multiply"

fonts:
  primary: "Funnel Display (weights 400/600/700/800/900)"
  mono: "Geist Mono (weights 400/500/600/700)"
  google_fonts_url: "css2?family=Funnel+Display:wght@400;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap"

responsive:
  breakpoints: [1080, 900, 640]
  desktop_h1: "clamp(60px, 9vw, 140px)"
  tablet_h1: "clamp(52px, 8vw, 96px) → clamp(44px, 9vw, 76px)"
  phone_h1: "clamp(38px, 11vw, 58px)"
```

---

## 4 · Feedback del usuario (preferencias aprendidas)

- **Estética deseada**: editorial, no infantil · evita estética "AI slop"
- **Logo oficial**: inviolable · u siempre ink, dot siempre orange, tile siempre lime · tile debe verse cuadrado (como app icon), no alargado
- **Flujo de trabajo**: una acción, una revisión · detenerse cuando dice "detente"
- **Comunicación**: directa, sin narración excesiva · español chileno
- **Iteraciones**: checkpoint antes de cambios grandes · revertir con `cp` si no gusta
- **Uso de la app**: web = estudios principales (universidad), app = uso social/chat
- **Mención de Conniku**: propuesto "En un solo lugar. En Conniku." pero NO aplicado en la landing actual (el H1 actual sigue "En una sola app.")

---

## 5 · Copy actual en landing.html (congelado)

| Elemento | Texto |
|----------|-------|
| kicker hero | `Conniku · Edición 2026 · Chile` |
| H1 | `Tu Universidad entera. En una sola app.` |
| lead | `Calendario, documentos con conversación, tutores verificados, biblioteca +70k, empleo asistido y diploma. Todo en un lugar.` |
| CTA primary | `Entrar gratis →` |
| CTA ghost | `Ver demo` |
| kicker producto | `Lo que hace Conniku` |
| H2 | `Todo lo que necesitas, en un solo lugar.` |
| footer tagline | `Tu universidad entera. En una sola app. Hecho en Chile.` |

---

## 6 · Enlaces pendientes

TODOS los `href="#"` son PENDING_USER_INSTRUCTION. Tabla completa en `landing.md` §L.16.

Próximo paso esperado del usuario: especificar destinos de cada enlace (nav, CTAs, footer links).

---

## 7 · Para retomar la sesión

Si abres esta carpeta en una nueva sesión con Claude:

1. Leer `CONTEXT.md` (este archivo) completo
2. Leer `landing.md` para spec completo
3. Abrir `landing.html` para ver el estado actual
4. Abrir `devices-preview.html` para ver cómo se adapta
5. **NO modificar landing.html sin autorización explícita** · está congelada
6. Preguntar al usuario qué sigue antes de actuar

Deltas (cambios a la base) se registran en `landing.md` §L.19.

---

## 8 · Próximas tareas esperadas (por definir con el usuario)

- [ ] Definir destinos de todos los enlaces (nav, hero CTAs, footer)
- [ ] ¿Aplicar cambio de copy "En un solo lugar. En Conniku." (decisión postpuesta)?
- [ ] ¿Variantes por dispositivo específicas (5-device expansion)?
- [ ] ¿Integración con otros módulos del ecosistema Conniku (auth, dashboard, etc.)?
- [ ] ¿Stack de implementación final (React + Vite por defecto del proyecto)?

---

**Fin del contexto. Releer al iniciar cada sesión nueva.**
