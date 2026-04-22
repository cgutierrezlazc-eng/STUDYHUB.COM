# LANDING.SPEC · Conniku · Master 2026

```yaml
DOCUMENT_ID:    LANDING.SPEC
SCOPE:          Conniku public landing · master reference
VARIANT:        Ink Halftone + Grain · editorial paper base
CONSUMER:       Claude Code / dev implementing the landing
DATE:           2026-04-20
APPROVER:       Cristian Gutiérrez Lazcano
ENCODING:       Markdown · format Claude Code strict
LOCATION_HTML:  /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/landing.html
LOCATION_MD:    /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/landing.md
STATE:          BASE_FROZEN · no structural changes · deltas documented separately
```

---

## L.01 · SCOPE.DEFINITION

```
PURPOSE:       single-file public landing for Conniku · marketing + advertising use
TARGET:        Chilean university students (primary) + universities (secondary)
MUST_RENDER:   desktop, tablet, phone · self-contained HTML
FORBIDDEN:     external CSS files · external JS files · frameworks
ALLOWED:       Google Fonts via <link rel="stylesheet"> (sole external dependency)
```

---

## L.02 · PATHS

| asset            | path                                                                 |
|------------------|----------------------------------------------------------------------|
| HTML canónico    | `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/landing.html` |
| MD spec          | `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/landing.md`   |
| Brand logo spec  | `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-BRAND-LOGO.md` |
| People catalog   | `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-PEOPLE-AUTHORIZED.md` |

```
RULE:    landing.html in this folder is the single source of truth
RULE:    modifications require approval from Cristian Gutiérrez Lazcano
RULE:    new variants live as siblings · never overwrite landing.html
```

---

## L.03 · FONTS

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap" />
```

| role              | CSS var       | value                                                           |
|-------------------|---------------|-----------------------------------------------------------------|
| display primary   | `--fd`        | `'Funnel Display', -apple-system, sans-serif`                   |
| mono secondary    | `--fm`        | `'Geist Mono', ui-monospace, monospace`                         |

```
FORBIDDEN:    substituting Funnel Display · breaks brand (LOGO.08)
WEIGHTS_USED: 400 (body lead soft), 500 (b highlighted), 600-700 (nav links), 900 (all headings + logo)
```

---

## L.04 · PALETTE.TOKENS

```css
:root {
  --ink:    #0D0F10;
  --ink-2:  #2B2E30;
  --ink-3:  #696C6F;
  --paper:  #F5F4EF;
  --paper-2:#EBE9E1;
  --lime:   #D9FF3A;
  --orange: #FF4A1C;
  --pink:   #FF4D3A;
  --cream:  #FFE9B8;
  --violet: #6B4EFF;
  --cyan:   #00C2FF;
  --fd:'Funnel Display',-apple-system,sans-serif;
  --fm:'Geist Mono',ui-monospace,monospace;
  --ease:cubic-bezier(.2,.8,.2,1);
}
```

```
BODY_BG:    #E8E5DB    ← custom darker-paper (between --paper and --paper-2)
RULE:       BODY_BG hardcoded in body · do not replace with var(--paper-2)
```

---

## L.05 · LAYOUT.STRUCTURE

Order of elements inside `<body>`:

```
1. <svg> SVG filter defs · id="bl-rough" · declared for future ink-blob use
2. <div class="halftone"> · 4 dot layers · position:fixed · z-index:0
3. body::before · grain texture · position:fixed · z-index:1
4. <nav> · sticky · z-index:50
5. <div class="shell"> · max-width 1280px
   ├── <section class="hero">   · 2-col grid · copy + poster stickers
   └── <section class="product"> · header + 4×2 card grid
6. <footer> · ink background · z-index:5
```

```
STACKING_CONTEXT:
  halftone:   z-index 0   (visual background)
  grain:      z-index 1   (paper texture overlay)
  content:    z-index auto (default)
  shell:      z-index 5
  footer:     z-index 5
  nav:        z-index 50  (always on top)
```

---

## L.06 · BACKGROUND.HALFTONE

4 radial halftone dot layers · one per quadrant · no overlap.

### Container

```css
.halftone { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden }
.dots     { position:absolute; mix-blend-mode:multiply }
```

### Layer table

| id   | corner       | color         | size        | offset (top/bottom, left/right) | dot spacing | mask origin   | mask radius | opacity |
|------|--------------|---------------|-------------|---------------------------------|-------------|---------------|-------------|---------|
| `d1` | sup-izq      | `--lime`      | 620×620 px  | top:-140, left:-140             | 16 px       | 40% 40%       | 42%         | 0.9     |
| `d2` | inf-der      | `--orange`    | 640×640 px  | bottom:-160, right:-160         | 14 px       | 60% 60%       | 42%         | 0.7     |
| `d3` | sup-der      | `--violet`    | 480×480 px  | top:-100, right:-100            | 12 px       | 60% 40%       | 40%         | 0.55    |
| `d4` | inf-izq      | `--cream`     | 520×520 px  | bottom:-120, left:-120          | 20 px       | 40% 60%       | 42%         | 0.95    |

### Canonical CSS (copiar literal)

```css
.d1 { top:-140px; left:-140px; width:620px; height:620px;
  background:radial-gradient(circle,var(--lime) 8%,transparent 10%);
  background-size:16px 16px;
  -webkit-mask:radial-gradient(circle at 40% 40%,#000 0%,transparent 42%);
          mask:radial-gradient(circle at 40% 40%,#000 0%,transparent 42%);
  opacity:.9 }

.d2 { bottom:-160px; right:-160px; width:640px; height:640px;
  background:radial-gradient(circle,var(--orange) 12%,transparent 14%);
  background-size:14px 14px;
  -webkit-mask:radial-gradient(circle at 60% 60%,#000 0%,transparent 42%);
          mask:radial-gradient(circle at 60% 60%,#000 0%,transparent 42%);
  opacity:.7 }

.d3 { top:-100px; right:-100px; width:480px; height:480px;
  background:radial-gradient(circle,var(--violet) 16%,transparent 18%);
  background-size:12px 12px;
  -webkit-mask:radial-gradient(circle at 60% 40%,#000 0%,transparent 40%);
          mask:radial-gradient(circle at 60% 40%,#000 0%,transparent 40%);
  opacity:.55 }

.d4 { bottom:-120px; left:-120px; width:520px; height:520px;
  background:radial-gradient(circle,var(--cream) 20%,transparent 22%);
  background-size:20px 20px;
  -webkit-mask:radial-gradient(circle at 40% 60%,#000 0%,transparent 42%);
          mask:radial-gradient(circle at 40% 60%,#000 0%,transparent 42%);
  opacity:.95 }
```

### Canonical HTML

```html
<div class="halftone">
  <div class="dots d1"></div>
  <div class="dots d2"></div>
  <div class="dots d3"></div>
  <div class="dots d4"></div>
</div>
```

```
RULE:   4 layers exactly · no d5 · no ink-blobs · no splatter
RULE:   each layer contained in its quadrant · mask_radius ≤ 42%
RULE:   mix-blend-mode:multiply · do not change
RULE:   no additional halftone colors · use palette tokens only
```

---

## L.07 · GRAIN.TEXTURE

Subtle paper grain via `body::before`.

```css
body::before {
  content:""; position:fixed; inset:0; pointer-events:none;
  opacity:.07; mix-blend-mode:multiply; z-index:1;
  background-image:radial-gradient(circle at 1px 1px,var(--ink) 1px,transparent 0);
  background-size:3px 3px;
}
```

```
RULE:   opacity 0.07 max · higher values read as pattern not grain
RULE:   z-index 1 · above halftone (0) · below content
```

---

## L.08 · NAV

### Layout

```css
nav {
  display:flex; align-items:center; justify-content:space-between;
  padding:22px 40px;
  border-bottom:1.5px solid var(--ink);
  position:sticky; top:0;
  background:rgba(245,244,239,.88);
  backdrop-filter:blur(12px);
  z-index:50;
}
```

### Sections

| section      | element                             | notes                                    |
|--------------|-------------------------------------|------------------------------------------|
| brand        | `<a class="brand">` + wordmark      | size 26px · links to `/` (PENDING)       |
| nav-links    | 4 anchors + `<a class="nav-cta">`   | mono labels · CTA pill ink               |

### Nav links

```css
.nav-links { display:flex; gap:28px; align-items:center }
.nav-links a {
  font-family:var(--fm); font-size:11px; letter-spacing:.1em;
  text-transform:uppercase;
}
.nav-cta {
  padding:10px 18px; background:var(--ink); color:var(--paper);
  border-radius:999px; font-weight:700; font-size:13px; font-family:var(--fd);
}
```

### HTML

```html
<nav>
  <a class="brand" href="#">
    conn<span>i</span>k<!-- u-tile SVG · see L.14 -->
  </a>
  <div class="nav-links">
    <a href="#">Producto</a>
    <a href="#">Cómo funciona</a>
    <a href="#">Planes</a>
    <a href="#">Business</a>
    <a class="nav-cta" href="#">Crear cuenta</a>
  </div>
</nav>
```

---

## L.09 · HERO

### Container

```css
.hero {
  padding:80px 40px 60px;
  display:grid; grid-template-columns:1.4fr 1fr; gap:60px;
  align-items:end;
  border-bottom:1.5px solid var(--ink);
}
```

### Elements

| element           | class         | spec                                                    |
|-------------------|---------------|---------------------------------------------------------|
| kicker            | `.kicker`     | mono 11px · uppercase · ink-3 · pre-line 30×1.5 ink     |
| headline          | `h1`          | Funnel Display 900 · clamp(60px, 9vw, 140px) · lh .88   |
| paragraph         | `.lead`       | 19px · ink-2 · max-width 520px · bold=marker-lime       |
| buttons           | `.cta-row`    | primary (ink+lime arrow) + ghost (outlined)             |
| poster right      | `.poster`     | height 420px · 4 rotated stickers                       |

### Kicker

```css
.kicker {
  font-family:var(--fm); font-size:11px; letter-spacing:.2em;
  text-transform:uppercase; color:var(--ink-3);
  display:inline-flex; align-items:center; gap:10px;
  margin-bottom:30px;
}
.kicker::before {
  content:""; width:30px; height:1.5px; background:var(--ink);
}
```

### H1

```css
h1 {
  font-family:var(--fd); font-weight:900;
  font-size:clamp(60px, 9vw, 140px);
  line-height:.88; letter-spacing:-.055em;
  margin-bottom:32px;
}
h1 .mark {
  background:linear-gradient(180deg,transparent 55%,var(--lime) 55%,var(--lime) 92%,transparent 92%);
  padding:0 6px; display:inline-block; transform:rotate(-1deg);
}
h1 .stamp {
  background:var(--pink); color:#fff;
  padding:0 14px; display:inline-block;
  transform:rotate(-1.5deg);
  box-shadow:5px 5px 0 var(--ink);
}
h1 .out {
  color:transparent;
  -webkit-text-stroke:2.5px var(--ink);
}
h1 .dot { color:var(--orange) }
```

### Lead paragraph

```css
.lead {
  font-size:19px; line-height:1.45; color:var(--ink-2);
  max-width:520px; margin-bottom:30px;
}
.lead b {
  background:linear-gradient(180deg,transparent 55%,var(--lime) 55%,var(--lime) 95%,transparent 95%);
  padding:1px 4px; font-weight:700;
}
```

### CTAs

```css
.cta-row { display:flex; gap:14px; align-items:center }
.btn-primary {
  padding:16px 26px; background:var(--ink); color:var(--paper);
  border-radius:999px; font-weight:700; font-size:15px;
  display:inline-flex; align-items:center; gap:12px;
}
.btn-primary .arr {
  width:28px; height:28px; border-radius:50%;
  background:var(--lime); color:var(--ink);
  display:grid; place-items:center;
  font-weight:900; font-size:13px;
}
.btn-ghost {
  padding:16px 22px; border:1.5px solid var(--ink);
  border-radius:999px; font-weight:600; font-size:14px;
  background:rgba(245,244,239,.7); backdrop-filter:blur(6px);
}
```

### HTML

```html
<section class="hero">
  <div>
    <span class="kicker">Conniku · Edición 2026 · Chile</span>
    <h1>
      Tu <span class="mark">Universidad</span><br>
      entera<span class="dot">.</span><br>
      <span class="out">En una sola</span> <span class="stamp">app</span>.
    </h1>
    <p class="lead">
      Calendario, documentos con conversación, tutores verificados,
      biblioteca +70k, empleo asistido y diploma.
      <b>Todo en un lugar.</b>
    </p>
    <div class="cta-row">
      <a class="btn-primary" href="#">Entrar gratis <span class="arr">→</span></a>
      <a class="btn-ghost" href="#">Ver demo</a>
    </div>
  </div>
  <div class="poster">
    <!-- 4 stickers · ver L.10 -->
  </div>
</section>
```

---

## L.10 · POSTER.STICKERS

Right column of hero. 4 absolute-positioned rotated stickers.

### Base

```css
.poster { position:relative; height:420px }
.sticker {
  position:absolute; border:2px solid var(--ink);
  padding:20px; border-radius:18px;
  box-shadow:8px 8px 0 var(--ink);
}
.sticker .lbl {
  font-family:var(--fm); font-size:10px; letter-spacing:.1em;
  text-transform:uppercase; opacity:.7; margin-bottom:8px;
}
.sticker h3 {
  font-family:var(--fd); font-weight:900; font-size:22px;
  letter-spacing:-.03em; line-height:1.05;
}
.sticker p { font-size:12px; line-height:1.4; margin-top:8px; opacity:.85 }
```

### Sticker table

| id   | top / left / right / bottom | width  | background  | text color | rotate   |
|------|-----------------------------|--------|-------------|------------|----------|
| `s1` | top:0; left:0               | 200px  | `--lime`    | `--ink`    | -4deg    |
| `s2` | top:40px; right:20px        | 220px  | `--cream`   | `--ink`    | +3deg    |
| `s3` | bottom:40px; left:40px      | 240px  | `--pink`    | `#fff`     | -2deg    |
| `s4` | bottom:0; right:0           | 180px  | `--ink`     | `--paper`  | +2.5deg  |

### HTML

```html
<div class="poster">
  <div class="sticker s1">
    <div class="lbl">01 · Agenda</div>
    <h3>Calendario sincronizado</h3>
    <p>Clases, entregas, pruebas.</p>
  </div>
  <div class="sticker s2">
    <div class="lbl">02 · IA</div>
    <h3>Athena escribe contigo</h3>
    <p>Citas, fuentes, coherencia.</p>
  </div>
  <div class="sticker s3">
    <div class="lbl">03 · Humanos</div>
    <h3>Tutores verificados</h3>
    <p>Pago protegido.</p>
  </div>
  <div class="sticker s4">
    <div class="lbl">04 · Futuro</div>
    <h3>CV + Empleo</h3>
    <p>Ofertas por carrera.</p>
  </div>
</div>
```

---

## L.11 · PRODUCT.SECTION

### Container

```css
.product { padding:90px 40px }
.p-head {
  display:grid; grid-template-columns:1fr 1fr; gap:60px;
  margin-bottom:50px; align-items:end;
}
h2 {
  font-family:var(--fd); font-weight:900;
  font-size:clamp(44px, 6vw, 72px);
  letter-spacing:-.05em; line-height:.94;
}
h2 .mark {
  background:linear-gradient(180deg,transparent 55%,var(--lime) 55%,var(--lime) 92%,transparent 92%);
  padding:0 6px; display:inline-block; transform:rotate(-1deg);
}
.p-lead {
  font-size:16px; line-height:1.5; color:var(--ink-2); max-width:460px;
}
```

### Cards grid

```css
.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px }
.card {
  border:2px solid var(--ink);
  border-radius:18px 26px 18px 26px;
  padding:20px;
  box-shadow:7px 7px 0 var(--ink);
  min-height:180px;
  display:flex; flex-direction:column;
}
.card .num {
  font-family:var(--fm); font-size:10px; letter-spacing:.14em;
  opacity:.6; margin-bottom:14px;
}
.card h3 {
  font-family:var(--fd); font-weight:900; font-size:18px;
  letter-spacing:-.02em; line-height:1.1; margin-bottom:8px;
}
.card p { font-size:12px; line-height:1.4; opacity:.85 }
```

### Card per-index style

| nth  | rotation | background                  | text color  |
|------|----------|-----------------------------|-------------|
| 1    | -1deg    | `--lime`                    | `--ink`     |
| 2    | +0.6deg  | `--pink`                    | `#fff`      |
| 3    | -0.4deg  | `--cream`                   | `--ink`     |
| 4    | +0.8deg  | `--ink`                     | `--paper`   |
| 5    | -0.6deg  | `--violet`                  | `#fff`      |
| 6    | +0.9deg  | `--cyan`                    | `--ink`     |
| 7    | -0.5deg  | `#fff`                      | `--ink`     |
| 8    | +0.4deg  | `rgba(245,244,239,.8)`      | `--ink`     |

Card 8 uses `border-style:dashed`.

### Card copy

| card | num                  | h3                           | p                                        |
|------|----------------------|------------------------------|------------------------------------------|
| 1    | `01 / CALENDARIO`    | Calendario sincronizado      | Tu semestre al día.                      |
| 2    | `02 / DOCS`          | Documentos con conversación  | Chatea con tu material.                  |
| 3    | `03 / IA`            | Escritura asistida           | Athena revisa informes.                  |
| 4    | `04 / BIBLIO`        | Biblioteca +70k              | Académicos y generales.                  |
| 5    | `05 / TUTORES`       | Tutorías verificadas         | Titulados. Pago protegido.               |
| 6    | `06 / EMPLEO`        | CV + empleo                  | Ofertas con match.                       |
| 7    | `07 / DIPLOMA`       | Cursos + Diploma             | Certificación verificable.               |
| 8    | `+ / PRÓXIMO`        | Comunidades por carrera      | Quizzes colaborativos.                   |

### HTML

```html
<section class="product">
  <div class="p-head">
    <div>
      <span class="kicker">Lo que hace Conniku</span>
      <h2>Todo lo que <span class="mark">necesitas</span>, en un solo lugar.</h2>
    </div>
    <p class="p-lead">Siete capacidades conversando entre sí. Un ecosistema que aprende tu carrera.</p>
  </div>
  <div class="grid">
    <!-- 8 cards · ver tabla -->
  </div>
</section>
```

---

## L.12 · FOOTER

```css
footer {
  padding:50px 40px 30px;
  background:var(--ink); color:var(--paper);
  position:relative; z-index:5;
}
.f-grid {
  display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px;
  margin-bottom:30px;
}
.f-grid h4 {
  font-family:var(--fm); font-size:11px; letter-spacing:.14em;
  text-transform:uppercase; color:rgba(245,244,239,.5);
  margin-bottom:14px;
}
.f-grid a {
  display:block; font-size:13px; margin-bottom:6px;
  color:rgba(245,244,239,.8);
}
.f-bottom {
  border-top:1px solid rgba(245,244,239,.1);
  padding-top:16px; display:flex; justify-content:space-between;
  font-family:var(--fm); font-size:10px; color:rgba(245,244,239,.4);
  letter-spacing:.1em; text-transform:uppercase;
}
```

### Columns

| col  | span  | content                                                  |
|------|-------|----------------------------------------------------------|
| 1    | 2fr   | brand wordmark (42px) + tagline 300px max                |
| 2    | 1fr   | h4 "Producto" + 3 links                                  |
| 3    | 1fr   | h4 "Empresa" + 3 links                                   |
| 4    | 1fr   | h4 "Legal" + 2 links                                     |

### HTML

```html
<footer>
  <div class="shell" style="padding:0">
    <div class="f-grid">
      <div>
        <a class="brand" href="#" style="color:var(--paper);font-size:42px">
          conn<span>i</span>k<!-- u-tile SVG · see L.14 -->
        </a>
        <p style="margin-top:14px;font-size:13px;opacity:.7;max-width:300px">
          Tu universidad entera. En una sola app. Hecho en Chile.
        </p>
      </div>
      <div>
        <h4>Producto</h4>
        <a href="#">Biblioteca</a>
        <a href="#">Workspaces</a>
        <a href="#">Tutores</a>
      </div>
      <div>
        <h4>Empresa</h4>
        <a href="#">Sobre</a>
        <a href="#">Blog</a>
        <a href="#">Prensa</a>
      </div>
      <div>
        <h4>Legal</h4>
        <a href="#">Términos</a>
        <a href="#">Privacidad</a>
      </div>
    </div>
    <div class="f-bottom">
      <span>© 2026 Conniku · Santiago, Chile</span>
      <span>01F · Ink Halftone + grain</span>
    </div>
  </div>
</footer>
```

---

## L.13 · RESPONSIVE

```css
@media (max-width:900px) {
  .hero, .p-head, .f-grid { grid-template-columns:1fr }
  .grid                   { grid-template-columns:repeat(2,1fr) }
  .poster                 { display:none }
}
```

```
BREAKPOINT:    900px single point · mobile-first not required for base
NO_BREAKPOINT: tablet · iPad · because shell max 1280 handles it
NOTE:          poster stickers hidden below 900 · hero becomes single-column copy
```

---

## L.14 · BRAND.WORDMARK

Wordmark = `connik` + u-tile SVG (inline, app-icon geometry canónica).

### Rule · inviolable

```
INVIOLABLE:    "connik" + u-tile are adjacent · never separated
INVIOLABLE:    u-tile margin-left ≤ .04em · stays attached to "k"
INVIOLABLE:    u inside tile = visual cap-height of surrounding "connik"
INVIOLABLE:    tile aspect-ratio 1:1 · perfectly square
INVIOLABLE:    wordmark respects LOGO.08 rules · see 00-BRAND-LOGO.md
```

### CSS

```css
.brand {
  font-family:var(--fd); font-weight:900;
  font-size:26px;                      /* nav default · overridden inline for footer (42px) */
  letter-spacing:-.055em;
  display:inline-flex; align-items:baseline;
  color:var(--ink); line-height:1;
}
.brand .u-tile {
  width:1.18em; height:1.18em;         /* u inside = cap-height of "connik" */
  margin-left:.02em;                   /* tight · attached to "k" */
  flex-shrink:0;
  display:inline-block;
  transform:translateY(.32em);         /* baseline alignment with surrounding text */
}
```

### HTML canónico

```html
<a class="brand" href="#">conn<span>i</span>k<svg class="u-tile" viewBox="0 0 100 100" aria-hidden="true">
  <rect width="100" height="100" rx="22" fill="#D9FF3A"/>
  <text x="50" y="71" text-anchor="middle"
        font-family="Funnel Display, -apple-system, sans-serif"
        font-weight="900" font-size="84" fill="#0D0F10" letter-spacing="-4">u</text>
  <circle cx="77" cy="68" r="6" fill="#FF4A1C"/>
</svg></a>
```

### Sizes in this landing

| surface      | font-size | u-tile rendered size |
|--------------|-----------|----------------------|
| nav          | 26px      | ~30.7px square       |
| footer       | 42px      | ~49.6px square       |

```
RULE:    any additional usage requires new entry in this table
RULE:    minimum rendered wordmark font-size: 18px (below → use app_icon alone)
```

---

## L.15 · BRAND.APP_ICON

Geometría canónica (LOGO.04).

```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Conniku">
  <rect width="100" height="100" rx="22" fill="#D9FF3A"/>
  <text x="50" y="71" text-anchor="middle"
        font-family="Funnel Display, -apple-system, sans-serif"
        font-weight="900" font-size="84" fill="#0D0F10"
        letter-spacing="-4">u</text>
  <circle cx="77" cy="68" r="6" fill="#FF4A1C"/>
</svg>
```

| element       | value          | notes                                    |
|---------------|----------------|------------------------------------------|
| viewBox       | `0 0 100 100`  | square canvas                            |
| rect rx       | 22             | 22% border-radius                        |
| rect fill     | `#D9FF3A`      | lime (LOGO.02)                           |
| text content  | `u`            | single lowercase                         |
| text x,y      | 50, 71         | horizontally centered · optically vert   |
| text fill     | `#0D0F10`      | ink (LOGO.02 · INVIOLABLE)               |
| text size     | 84             | fits tile with negative letter-spacing   |
| text spacing  | -4             | compresses u to fit                      |
| dot cx,cy     | 77, 68         | relative to u right side                 |
| dot r         | 6              | small accent                             |
| dot fill      | `#FF4A1C`      | orange (LOGO.02 · INVIOLABLE)            |

```
RULE:    this SVG is embedded verbatim inside .u-tile in every wordmark instance
RULE:    when used standalone (app icon alone), wrap in container sized as needed
```

---

## L.16 · CONNECTIONS

All href attributes currently `#` · PENDING_USER_INSTRUCTION.

| context           | element                      | target       | status   |
|-------------------|------------------------------|--------------|----------|
| nav brand         | `a.brand`                    | (home?)      | PENDING  |
| nav link 1        | `a > "Producto"`             | (anchor?)    | PENDING  |
| nav link 2        | `a > "Cómo funciona"`        | (anchor?)    | PENDING  |
| nav link 3        | `a > "Planes"`               | (anchor?)    | PENDING  |
| nav link 4        | `a > "Business"`             | (page?)      | PENDING  |
| nav CTA           | `a.nav-cta > "Crear cuenta"` | /auth        | PENDING  |
| hero CTA primary  | `a.btn-primary`              | /auth        | PENDING  |
| hero CTA ghost    | `a.btn-ghost > "Ver demo"`   | (video?)     | PENDING  |
| footer brand      | `a.brand`                    | (home?)      | PENDING  |
| footer Producto   | Biblioteca / Workspaces / Tutores | routes  | PENDING  |
| footer Empresa    | Sobre / Blog / Prensa        | routes       | PENDING  |
| footer Legal      | Términos / Privacidad        | routes       | PENDING  |

```
RULE:   DO NOT invent destinations
RULE:   Cristian specifies each connection before implementation
RULE:   each confirmed connection updates this table AND the HTML href
```

---

## L.17 · COPY.TEXT

### Canonical strings

| location              | text                                                                                               |
|-----------------------|----------------------------------------------------------------------------------------------------|
| `<title>`             | `Conniku · 01F · Ink Halftone + Grain`                                                             |
| hero kicker           | `Conniku · Edición 2026 · Chile`                                                                   |
| hero H1               | `Tu Universidad entera. En una sola app.`                                                          |
| hero lead             | `Calendario, documentos con conversación, tutores verificados, biblioteca +70k, empleo asistido y diploma. Todo en un lugar.` |
| hero CTA primary      | `Entrar gratis →`                                                                                  |
| hero CTA ghost        | `Ver demo`                                                                                         |
| product kicker        | `Lo que hace Conniku`                                                                              |
| product H2            | `Todo lo que necesitas, en un solo lugar.`                                                         |
| product lead          | `Siete capacidades conversando entre sí. Un ecosistema que aprende tu carrera.`                    |
| footer tagline        | `Tu universidad entera. En una sola app. Hecho en Chile.`                                          |
| footer bottom left    | `© 2026 Conniku · Santiago, Chile`                                                                 |
| footer bottom right   | `01F · Ink Halftone + grain`                                                                       |

### Word-level highlights in headings

```
h1 .mark       = "Universidad"                   (lime marker · rotate -1deg)
h1 .dot        = "."     (after "entera")        (orange)
h1 .out        = "En una sola"                   (ink outline)
h1 .stamp      = "app"                           (pink stamp · shadow · rotate -1.5deg)
h2 .mark       = "necesitas"                     (lime marker)
```

---

## L.18 · VALIDATION.CHECKLIST

Before accepting any replica as identical to base:

- [ ] HTML is self-contained · zero external CSS / JS files
- [ ] Google Fonts URL matches L.03 exactly
- [ ] `--ink` `--paper` `--lime` `--orange` exact hex values
- [ ] Body background `#E8E5DB` (not `--paper` nor `--paper-2`)
- [ ] 4 halftone layers · no 5th · no ink-blob elements
- [ ] Each halftone mask_radius ≤ 42%
- [ ] Grain texture opacity 0.07 exact
- [ ] Nav height 22px padding top/bottom · sticky · blur 12px
- [ ] Brand wordmark uses u-tile SVG at 1.18em · translateY .32em
- [ ] u-tile `rx=22 · text x=50 y=71 size=84 · circle cx=77 cy=68 r=6`
- [ ] Hero H1 uses clamp(60px,9vw,140px)
- [ ] Hero has 4 stickers with exact rotations (-4°, +3°, -2°, +2.5°)
- [ ] Product has 8 cards with exact rotations and colors (L.11 table)
- [ ] Card 8 uses border-style:dashed
- [ ] Footer grid 2fr 1fr 1fr 1fr · ink background
- [ ] Responsive breakpoint 900px only · hides poster
- [ ] All href `#` except explicitly confirmed connections
- [ ] Logo wordmark never separated · margin-left ≤ .04em
- [ ] u color inside tile = `#0D0F10` · dot color = `#FF4A1C` (LOGO.08)

```
IF any_checkbox_unchecked THEN replica_not_identical · do not merge
```

---

## L.19 · DELTAS.LOG

All modifications to the base HTML must be logged here as dated entries.

```yaml
deltas: []   # empty · base is frozen
```

```
FORMAT_ENTRY:
  - date: YYYY-MM-DD
    author: Cristian Gutiérrez Lazcano
    change: <description>
    affected_sections: [ L.XX, L.YY ]
    approved: true
```

---

## L.20 · STACK.TARGET

```
STACK:                 PENDING_USER_CONFIRMATION
FRAMEWORK_TARGET:      standalone HTML for now · framework migration deferred
MIGRATION_NOTES:       when moving to React/Vite, extract .brand + .u-tile as
                       <BrandWordmark /> component · preserve canonical sizes
```

---

## L.21 · END

End of spec. File is complete. No further sections.

```
IF implementer_finds_ambiguity THEN open issue · DO_NOT_improvise
IF implementer_finds_missing_info THEN mark as PENDING_USER_INSTRUCTION · ask Cristian
```
