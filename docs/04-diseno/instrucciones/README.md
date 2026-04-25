# Handoff: Conniku Landing Page

## Overview

This handoff package contains a **high-fidelity landing page design for Conniku** — "the operating system of the university student." Conniku is an all-in-one platform for Latin American university students (18–45, focus 20–30) that integrates **7 unique capabilities in a single product**: university sync, documents with AI chat, academic writing assistance, a 70k+ library, verified tutors with protected payments, a job board with assisted CV, and internal courses + Conniku Diploma.

The landing is bilingual-ready (Spanish by default, EN/PT coming) and sized for a marketing conversion flow: hero → proof (anti-manifesto) → capability stickers → competitive matrix → live notification feed → stats → manifesto quote → testimonials → day-in-the-life → multi-country reach → CTA → editorial footer.

---

## About the Design Files

The files in this bundle are **design references created in HTML** — a self-contained prototype demonstrating the intended look, feel, motion, interactions, and copy. **They are not production code to copy directly.** The task is to **recreate this HTML design in the target codebase's existing environment** (React, Next.js, Vue, SvelteKit, etc.) using its established component libraries, routing, styling system, and build tooling. If no environment exists yet, choose the most appropriate modern stack (recommended: **Next.js 14 + Tailwind CSS + Framer Motion**) and implement there.

Treat the HTML as the source of truth for **visual intent** (layout, color, typography, spacing, motion), and the copy as the source of truth for **content**. Semantics, componentization, data flow, accessibility, and performance are the developer's job to handle idiomatically.

---

## Fidelity

**High-fidelity (hi-fi).** Pixel-perfect mockups with final colors, typography, spacing, motion, and copy. Recreate UI pixel-perfectly using the codebase's existing libraries and patterns. All design tokens below are final and locked.

---

## Brand Direction

**Voice:** Bold, editorial, slightly irreverent. Spanish (rioplatense/neutral LATAM), confident, never corporate. No "revolutionary," no "empower," no buzzwords.

**Visual DNA:**
- **Editorial magazine meets student notebook** — big type, splatter dots, sticker rotations, marker-style highlights
- **Funnel Display** for all headlines (extra-bold, tight tracking, -.045em to -.055em)
- **Geist Mono** for labels, metadata, timestamps, captions
- **Warm paper** (#F5F4EF) as the base — not white, not gray
- **Ink-on-paper contrast** with strategic color pops (lime, pink, cream, cyan, violet, orange)
- **Splatter dots** — a signature motif: irregular colored circles radiating from type accents (see `.hero h1 .pink::before` / `::after` for the pattern using `box-shadow` with multiple colored offsets)
- **Sticker rotations** — `-1.3deg` to `+1.2deg` on cards for hand-placed feel
- **2px solid ink borders** on cards/stickers, 24px radius, hard `8px 8px 0 var(--ink)` shadows on hover

---

## Design Tokens

### Colors

```css
/* Ink scale (text, borders, primary UI) */
--ink:        #0D0F10;   /* primary text, borders */
--ink-2:      #2B2E30;   /* body on paper */
--ink-3:      #696C6F;   /* muted labels */
--ink-4:      #A0A3A7;   /* disabled */

/* Paper scale (backgrounds) */
--paper:      #F5F4EF;   /* page bg — warm off-white */
--paper-2:    #EBE9E1;   /* subtle elevation */
--paper-3:    #DBD9CF;   /* deeper panels */
--line:       #D2CFC3;   /* dividers */
--line-soft:  #E2DFD4;   /* subtle dividers */
--card:       #FFFFFF;   /* pure white cards */

/* Accent — primary action & highlight */
--lime:       #D9FF3A;   /* primary highlight / CTA accent */
--lime-ink:   #181F08;   /* text on lime */

/* Accent — emotional */
--pink:       #FF4D3A;   /* energy, urgency (NOT magenta — warm coral-red) */
--pink-deep:  #D9341F;
--orange:     #FF4A1C;   /* live indicators, pulse dots */
--cream:      #FFE9B8;   /* soft highlight */

/* Accent — secondary */
--violet:     #6B4EFF;   /* community, social */
--cyan:       #00C2FF;   /* tech, AI */
--blue:       #2D62C8;
--blue-2:     #1E4BB0;
--electric:   #2F55F0;

/* Selection */
::selection { background: var(--lime); color: var(--lime-ink); }
```

### Typography

```css
/* Families */
--font-display: 'Funnel Display', -apple-system, system-ui, sans-serif;
--font-mono:    'Geist Mono', ui-monospace, monospace;

/* Headline scales (clamp for fluid) */
h1-hero:    clamp(72px, 11vw, 176px);  weight 900, line-height .86, letter-spacing -.045em
h2-section: clamp(56px, 7.5vw, 112px); weight 900, line-height .9,  letter-spacing -.045em
h2-compare: clamp(44px, 5.5vw, 84px);  weight 800, line-height .92, letter-spacing -.045em
h2-manifesto: clamp(56px, 9vw, 136px); weight 900, line-height .92, letter-spacing -.055em

/* Body & meta */
lead-body: 20px / 1.35, weight 500, color ink-2
body:      16px / 1.5,  weight 400
mono-label: 12px, letter-spacing .14em, text-transform uppercase, color ink-3
mono-caption: 10-11px, letter-spacing .1em, uppercase
```

Load from Google Fonts:
```
https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap
```

### Spacing scale

```
Section padding vertical:  80–140px (120px default)
Container max-width:       1320px
Container padding:         0 32px (desktop) / 0 18px (mobile)
Card padding:              28–32px
Button padding-x:          22–32px
Gap between cards:         16–24px
Gap between sections:      handled via section padding
```

### Radii

```
--r-btn:   999px           /* pills */
--r-card:  24px            /* cards, stickers */
--r-sm:    8–12px          /* inline highlights */
--r-xl:    32px            /* full-bleed dark sections */
```

### Shadows

```
--shadow-sm: 0 2px 6px rgba(13,15,16,.04), 0 1px 2px rgba(13,15,16,.03);
--shadow-md: 0 8px 24px rgba(13,15,16,.08), 0 2px 6px rgba(13,15,16,.04);
sticker-hover: 8px 8px 0 var(--ink);  /* hard offset, no blur */
```

### Motion

```
--ease: cubic-bezier(.2,.8,.2,1);
Default duration: 180–240ms for hovers, 400–600ms for reveals
Ticker: 40s linear infinite (anti-manifesto rail)
Notification rotation: 2800ms interval
Pulse ping: 1.6s var(--ease) infinite
```

---

## Page Structure (top to bottom)

Each section below documents layout, components, copy, and behavior.

### 0. Top Progress Bar (fixed, above nav)

- **Background:** `--ink` (dark) | **Text:** white
- **Height:** ~36px | Full-width
- **Left:** lime pulse dot + `Semestre 2026-1` (mono, 11px, uppercase, letter-spacing .08em)
- **Center:** thin progress bar (100px wide, 4px tall, rounded) with gradient fill `linear-gradient(90deg, var(--lime), var(--pink))` at 34% width
- **Right:** `34% · día 41 de 120` (mono, tabular-nums)
- **Behavior:** Static on scroll. On mobile, compresses (progress bar max 100px).

### 1. Nav (sticky, below progress)

- **Centered pill nav** max-width 1240px, `--card` bg, `border: 1px solid var(--line)`, 999px radius, 10px 28px padding
- **Logo** — square 28px lime tile (`--lime`) with the Conniku mark SVG inside (see `logo.svg`), followed by wordmark "conniku" in Funnel Display 700
- **Nav links (desktop only):** `Producto · Precios · U · Blog` (15px, weight 600)
- **Search slot** (mono, 13px) with `⌘K` hint
- **CTA button pair:**
  - Ghost: "Entrar" (weight 600)
  - Primary: "Crear cuenta" in ink with lime arrow-ring (28px circle, lime bg, arrow icon)
- **Mobile:** Collapses to logo + primary CTA only

### 2. Hero

- **Vertical padding:** 80px top, 120px bottom
- **Background blobs (absolute, -z-1, blur(80px), opacity .42):**
  - Blob 1: lime, 420×420, top-right
  - Blob 2: pink, 500×500, bottom-left
  - Blob 3: violet, 300×300, middle-right, opacity .3
- **Status chip (top):** white pill with orange pulse dot → `estudiando ahora mismo <count>127</count>` (count is lime pill, mono, tabular-nums, increments live via JS — simulate with interval, +1 every ~8s randomly)
- **H1 — 3 LINES, HUGE:**
  - **Default (Variant B — "juvenil"):**
    ```
    Tu U entera.
    En una
    sola app.
    ```
  - Treatments: `outline` = text stroke 2.5px ink, transparent fill | `lime` = lime bg pill | `pink` = pink text with splatter dots via `::before`/`::after` box-shadow | `cream` = cream bg pill
- **Tagline variants (expose as a toggle or A/B):**
  - A "oficial": `El sistema operativo / de tu carrera / universitaria.`
  - B "juvenil" (DEFAULT): `Tu U entera. / En una / sola app.`
  - C "emocional": `Concéntrate. / No estás / solo.`
- **Description (20px, ink-2, max-width 440px):** `Sync con tu U, documentos con IA, tutores verificados, biblioteca de +70k títulos, empleo y diploma propio. Todo en un lugar.` — `+70k títulos` and `Todo en un lugar.` wrapped in `<strong>` with lime background highlight
- **CTA pair:**
  - Primary: "Entrar gratis" (ink pill, white text, lime arrow-ring)
  - Ghost: "Ver demo" (optional)
- **Mockup placeholder** to the right on desktop (1 column on mobile) — developer discretion; the HTML uses the space for splatter decoration

### 3. Anti-Manifesto Strip (horizontal scroll)

- **Label:** `lo que conniku NO es` (mono, 12px, uppercase, with 32×2px ink rule before)
- **Rail:** Infinite horizontal scroll, 40s linear loop, gap 20px
- **Chips alternate:**
  - **Negative (ink-3 text, paper bg, 2px ink border, pink line-through 5px):**
    - "Facebook con clases"
    - "Moodle modernizado"
    - "Notion con menos libertad"
    - "WhatsApp académico"
    - "LinkedIn light"
    - "Udemy en español"
    - "grupos de Discord"
  - **Positive (lime bg, lime-ink text, rotate -1.2deg, ink checkmark circle at top-right):**
    - "UN SOLO LUGAR"
    - "HECHO PARA TI"
    - "CON TU U DE VERDAD"
- **Chip size:** font clamp(38px, 5.5vw, 78px), weight 800, padding 14px 28px, radius 18px
- **Behavior:** Pure CSS `@keyframes antiroll { from translateX(0) to translateX(-50%) }` — rail content is duplicated once for seamless loop. Optional: pause on hover.

### 4. Sticker Grid — 7 Capabilities

- **Label:** `01 · lo que hace conniku`
- **H2:** `Todo lo que necesitás en tu U, <span class="lime-bg">en un solo lugar</span>.`
- **Grid:** 12-column CSS grid, gap 16px
- **7 cards, irregular spans** (first card larger, rest balanced), each with:
  - 2px solid ink border, 24px radius, 28px padding
  - Sticker badge (ink pill top-right with number "01"–"07", mono, 11px, uppercase)
  - Rotation: -1.3° to +1.2° per sticker (`--rot` CSS var)
  - Hover: lift -3px + 8px 8px 0 ink hard shadow
  - Title (Funnel Display 800, clamp 28-38px, letter-spacing -.03em)
  - Short description (14-16px, 1.4 line-height)
  - Decorative viz (small UI fragment — chat bubbles, day grid, job card, etc.)
- **The 7 capabilities (exact copy & colors — in order):**
  1. **Sync universitario** — lime sticker (`stk-lime`). "Enlace directo con tu U. Calendario, asignaturas y material actualizados automáticamente."
  2. **Documentos con chat IA** — pink (`stk-pink`). "Conversá con tu propio material. Resúmenes y quizzes que nunca se repiten."
  3. **Escritura académica asistida** — cream (`stk-cream`). "Asesor virtual para informes y trabajos. Métricas de colaboración en vivo."
  4. **Biblioteca +70k** — ink (`stk-ink`). "Académicos y generales. Chat interactivo con cada libro."
  5. **Tutorías verificadas** — violet (`stk-violet`). "Tutores titulados. Conniku intermedia el pago. Garantía antifraude."
  6. **Bolsa laboral + CV** — orange (`stk-orange`). "CV editable potenciado. Ofertas filtradas por tu carrera."
  7. **Cursos + Diploma Conniku** — white (`stk-white`). "Formación interna que suma al perfil profesional."

### 5. Comparison Matrix

- **Label:** `02 · por qué conniku`
- **H2:** `Siete capacidades. <span class="accent">Una sola app.</span><br>El resto tiene una o dos.` — `.accent` = ink bg, white text, rotated -.8deg, 12px radius
- **Table:** 2px solid ink border, 24px radius, overflow hidden, `--card` bg
  - **Columns (8):** Capability (1.6fr) | Conniku (1fr, lime bg, 2px ink border-left) | Moodle | Crehana | Udemy | LinkedIn Learning | Notion | WhatsApp (each 1fr)
  - **Header row:** paper-2 bg, 72px min-height, 2px ink border-bottom. Conniku header is **lime bg, Funnel Display 900, 16px, "CONNIKU"**. Other headers are mono, 10.5px uppercase, ink-3.
  - **Body rows (7):** 64px min-height, 1px line border-bottom, feature cell left-aligned in Funnel Display 700 15px, tick cells centered with 28×28px circles:
    - `.tick.yes` — lime bg, lime-ink, ✓ (size 14px, sans-serif, weight 800)
    - `.tick.no` — paper-2 bg, ink-4, —
    - `.tick.part` — cream bg, ink, ~
  - **Conniku column throughout:** `rgba(217,255,58,.2)` bg, 2px ink border-left
- **Scores (exact):**
  | Capability | Conniku | Moodle | Crehana | Udemy | LinkedIn Learning | Notion | WhatsApp |
  |---|---|---|---|---|---|---|---|
  | Sync con tu universidad | ✓ | ~ | — | — | — | — | — |
  | Documentos con chat IA propio | ✓ | — | — | — | — | ~ | — |
  | Escritura académica asistida | ✓ | — | — | — | — | ~ | — |
  | Biblioteca +70k con chat | ✓ | — | — | — | — | — | — |
  | Tutores verificados + pagos | ✓ | — | — | — | — | — | — |
  | Bolsa laboral + CV asistido | ✓ | — | — | — | ~ | — | — |
  | Cursos + Diploma | ✓ | — | ✓ | ✓ | ✓ | — | — |
- **Totals row:** `--ink` bg, white text, 56px min-height. Feature cell: "Score" (mono, uppercase). Conniku cell: **"7/7" (lime bg, lime-ink, Funnel Display 900, 22px)**. Others: "0", "1", "1", "1", "0", "0".

### 6. Notification Ticker

- **2-column layout:** Copy left (label `03 · lo que pasa`, H2 "En tu uni, siempre pasa algo.", subtitle) | Notification stack right
- **Stack:** Absolute-positioned cards, rotating every 2800ms. `.highlight` class lifts the featured card and applies lime ring.
- **Each card:** White bg, icon chip (colored square 40px with emoji or SVG), title 14px weight 700, timestamp mono 11px ink-3, body 13px. Examples already in source — keep them.

### 7. Big Stats

- **4-column grid (2 on tablet, 1 on mobile).** Each stat: huge Funnel Display 900 number (clamp 72-120px, tabular-nums), small mono label above, description below.
- **Stats (exact):**
  - `14 universidades sincronizadas` (highlighted — lime bg on ink)
  - `+70k títulos en biblioteca`
  - `4.9★ 2.1k reseñas`
  - `$0 estafas (pagos protegidos)`

### 8. Manifesto Quote

- **Full-bleed, centered, 140px vertical padding**
- **Decorative blobs:** cyan top-left, pink bottom-right, both opacity .25, blurred
- **Label:** `— la emoción que queremos para ti —`
- **H2 (clamp 56-136px, line-height .92, letter-spacing -.055em):**
  ```
  Concentración
  con pertenencia.
  ```
  - "Concentración" = lime bg pill, rotate -1.2°, 14px radius
  - "pertenencia" = pink bg, white text, rotate +1.2°, with splatter dots (lime/cyan/cream/ink) via `::before`
- **Subtitle:** `Puedes enfocarte. Y no estás solo.` (mono, 13px, uppercase, ink-3)

### 9. Chat Testimonials

- **Grid of 3 message-style cards** (1 column mobile). Each resembles a phone chat bubble.
- **Structure:** Avatar + name + U affiliation, timestamp, testimonial as chat bubbles (inbound + outbound alternating), reaction emoji chip.
- **Content already in source — preserve.**

### 10. Day in Conniku (Timeline)

- **Label:** `06 · tu día`
- **H2:** `De 7 AM a medianoche, con vos.`
- **Horizontal strip of day slots** (6–8 slots), each shows a time (mono, 11px) + event (weight 700, 14px) + a colored square indicator (lime for "on now", pink for "busy", paper-2 for "rest").

### 11. Multi-Country / World

- **Full-bleed dark section:** `--ink` bg, white text, 32px radius (inset 16px from sides), 120px padding
- **Label:** `07 · alcance` (lime text)
- **H2:** `Multi-U, multi-país, <span class="lime">multi-idioma</span>. Desde el día uno.`
- **3 country cards (1.2fr / 1fr / 1fr grid — first larger):**
  - **Chile 🇨🇱** (LIVE — lime bg, lime-ink) — "EN VIVO · 2026", "MERCADO PILOTO · SANTIAGO", big number "14", sub "universidades sincronizadas"
  - **México 🇲🇽** — "PRÓXIMO · Q3 2026", "EXPANSIÓN LATAM", "2.8M", "universitarios activos"
  - **USA 🇺🇸** — "PLAN · 2027", "MERCADO HISPANO", "19.6M", "universitarios · crecimiento global"
- **Language chips (pills at bottom):** `ES · Español` (lime, active), `EN · English`, `PT · Português`, `+ más idiomas en 2027` (opacity .4)

### 12. CTA

- Full-width section, ink-on-paper, repeated primary CTA "Crear cuenta gratis" with the arrow-ring, plus secondary "Ver planes"

### 13. Footer — Editorial Tracklist

- **Treats footer like a vinyl tracklist / magazine colophon.**
- Numbered rows (`01`, `02`, …) with section name + hover link, mono labels, thin dividers.
- Legal row at bottom: copyright, terms, privacy, credits.

---

## Interactions & Behavior

### Global

- **Scroll:** Normal. No scroll-jacking. Consider `scroll-behavior: smooth` for anchor links.
- **Reveals:** On-scroll fade-in for section headings (`opacity 0 → 1` + `translateY 20px → 0`, 400ms `var(--ease)`). Use `IntersectionObserver` or Framer Motion's `whileInView`.
- **Hover:** Stickers lift -3px and cast an 8×8 hard ink shadow. Buttons lift -1px and darken ink→ink-2.
- **Focus:** 2px lime outline, 2px offset, on all interactive elements.

### Per-section

- **Hero counter:** `document.getElementById('counter')` increments by +1 every 6–10 seconds (randomized) to simulate live student count.
- **Anti-manifesto rail:** CSS-only keyframe scroll, 40s linear infinite. Content duplicated once. `animation-play-state: paused` on hover (optional).
- **Notification stack:** Every 2800ms, rotate `.highlight` class through the cards cyclically.
- **Tweaks panel (optional, dev-only):** Toggle to cycle hero tagline variants A/B/C. Keep behind a feature flag.

### States

- **CTA button:** default → hover (bg ink-2, translateY -1px) → active (translateY 0, subtle press)
- **Nav links:** default ink-2 → hover ink + subtle underline via `text-decoration-thickness` animation
- **Tick cells:** no interaction, purely visual

---

## Responsive

Breakpoints used:
- `max-width: 1080px` (tablet): reduces grid columns, collapses 2-col heads to 1-col, matrix font 11px
- `max-width: 680px` (mobile): hides nav links/search/login, compresses top-progress, stickers become full-width (col span 12), 2-col day timeline, single-col big stats, footer tracks drop the rightmost column

Everything must work down to 375px wide.

---

## Accessibility

- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<h1>`/`<h2>`, `<footer>`. One H1 per page (hero).
- **Color contrast:** All text passes WCAG AA on its background. Ink on paper = 16:1. Lime-ink on lime = 13:1. White on pink = ~3.5:1 (use pink only for 18px+ weight 700+).
- **Motion:** Respect `prefers-reduced-motion: reduce` — disable the anti-manifesto rail, notification rotation, and pulse ping.
- **Alt text:** All decorative SVGs `aria-hidden="true"`; logos have proper alt ("Conniku").
- **Keyboard:** All CTAs and nav links reachable and visibly focused.

---

## State Management

Landing is **mostly static/marketing**. Minimal client state:
- `liveCount` (number, increments on interval)
- `highlightedNotif` (index, rotates on interval)
- `heroTaglineVariant` (string, A/B/C — for marketing experiments via feature flag or URL param `?v=b`)

No auth or backend data fetching on this page. "Entrar gratis" / "Crear cuenta" CTAs should navigate to `/signup`.

---

## Assets

- **`logo.svg`** — Conniku wordmark + mark (dark/ink version). Use on paper backgrounds.
- **`logo-white.svg`** — white version for dark sections (footer, world section).
- **Fonts:** Funnel Display + Geist Mono from Google Fonts (URL above).
- **No photography required.** All imagery is typographic + SVG decoration (splatter dots via box-shadow, blobs via filter blur).
- **Country flags:** Native emoji (🇨🇱 🇲🇽 🇺🇸) — consider swapping to Twemoji for cross-platform consistency.
- **Icons:** Inline SVG, 24×24 viewBox, stroke-width 2–3, stroke-linecap round. No icon library required, but Lucide or Phosphor are acceptable drop-ins.

---

## Files

- `Landing.html` — the full hi-fi design, single file, ~2700 lines. Reference this for exact markup, copy, and CSS values.
- `logo.svg` / `logo-white.svg` — brand marks.

---

## Recommended Implementation Stack

If starting from scratch:

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS with the color tokens above mapped to `theme.extend.colors` in `tailwind.config.js`
- **Motion:** Framer Motion for reveals + hover lifts; pure CSS `@keyframes` for the infinite rail
- **Fonts:** `next/font/google` with `Funnel_Display` and `Geist_Mono`
- **Components:** Split into `<HeroSection />`, `<AntiManifestoRail />`, `<CapabilityStickers />`, `<ComparisonMatrix />`, `<NotificationTicker />`, `<BigStats />`, `<ManifestoQuote />`, `<ChatTestimonials />`, `<DayTimeline />`, `<WorldReach />`, `<FinalCTA />`, `<EditorialFooter />` — each a server component unless it needs client interactivity.
- **Deployment:** Vercel.

### Tailwind tokens quick-start

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0D0F10', 2: '#2B2E30', 3: '#696C6F', 4: '#A0A3A7' },
        paper: { DEFAULT: '#F5F4EF', 2: '#EBE9E1', 3: '#DBD9CF' },
        line: { DEFAULT: '#D2CFC3', soft: '#E2DFD4' },
        lime: { DEFAULT: '#D9FF3A', ink: '#181F08' },
        pink: { DEFAULT: '#FF4D3A', deep: '#D9341F' },
        orange: '#FF4A1C',
        cream: '#FFE9B8',
        violet: '#6B4EFF',
        cyan: '#00C2FF',
      },
      fontFamily: {
        display: ['Funnel Display', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '24px', xl: '32px' },
    },
  },
};
```

---

## Open Questions / Developer Notes

- **Internationalization:** Spanish is default. Structure copy in a `content/{es,en,pt}.ts` file from day one — all strings (including the 7 stickers and matrix rows) should be swappable.
- **Analytics:** Hero CTA click, matrix interaction (if added), scroll depth, and signup conversion are the core events. Add `data-analytics-id` attributes to all CTAs.
- **Performance:** No images above the fold. Should hit 95+ Lighthouse on mobile. Defer the notification ticker and anti-manifesto animation until idle if needed.
- **SEO:** Title: `Conniku — Tu U entera. En una sola app.` / OG image: generate one showing the hero H1 on the paper background.
- **Tagline A/B:** Variant B is the default. Variants A and C should be exposed via URL query (`?hero=a`, `?hero=c`) for marketing to test, not as a live picker in production.

---

*Handoff prepared April 2026. Questions → reach out to the design lead.*
