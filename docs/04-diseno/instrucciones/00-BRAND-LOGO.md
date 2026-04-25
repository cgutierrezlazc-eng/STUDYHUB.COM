# LOGO.SPEC · Conniku

```yaml
DOCUMENT_ID:    LOGO.SPEC
SCOPE:          Conniku brand mark · official and only
CONSUMER:       Claude Code implementing the product UI and exporting assets
DATE:           2026-04-19
APPROVER:       Cristian Gutiérrez Lazcano
ENCODING:       Markdown · format Claude Code strict
LOCATION_HTML:  /Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Diseno/logo-final.html
LOCATION_MD:    /Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/logo-final.md
```

---

## LOGO.01 · ASSETS.REQUIRED

Lista de assets SVG que deben existir en producción. Se generan a partir
de la geometría canónica declarada en `LOGO.04`.

| asset_id                     | path                                             | purpose                                   |
|------------------------------|--------------------------------------------------|-------------------------------------------|
| `logo-tile.svg`              | `assets/branding/logo-tile.svg`                  | App icon · color · primary                |
| `logo-tile-mono-dark.svg`    | `assets/branding/logo-tile-mono-dark.svg`        | App icon · monochrome on light bg         |
| `logo-tile-mono-light.svg`   | `assets/branding/logo-tile-mono-light.svg`       | App icon · monochrome on dark bg          |
| `logo-full.svg`              | `assets/branding/logo-full.svg`                  | Wordmark integrated · color · on paper    |
| `logo-full-white.svg`        | `assets/branding/logo-full-white.svg`            | Wordmark integrated · color · on ink      |

```
IF production_asset_needed THEN use_exactly_one_of_above
IF no_match_in_list THEN request_approval_from_cristian · DO_NOT_improvise
```

---

## LOGO.02 · PALETTE.TOKENS

Cuatro colores. Ningún otro color está permitido en el logo.

| token        | hex        | role                                                    | exclusive_to_logo |
|--------------|------------|---------------------------------------------------------|-------------------|
| `--ink`      | `#0D0F10`  | `connik` text · `u` inside u-pack · text on light bg    | no                |
| `--lime`     | `#D9FF3A`  | u-pack tile fill                                        | YES               |
| `--orange`   | `#FF4A1C`  | final dot `.`                                           | YES               |
| `--paper`    | `#F5F4EF`  | `connik` text on dark bg · base background              | no                |

```
CONSTRAINT:      palette_size == 4
FORBIDDEN:       gradients · filters · tints · external shadows · glows · bevels
INVIOLABLE:      u_color == #0D0F10 · always · on any background · no exception
INVIOLABLE:      dot_color == #FF4A1C · always · no exception
INVIOLABLE:      u-pack_background == #D9FF3A · always · no exception
```

---

## LOGO.03 · WORDMARK.SPEC

Wordmark integrado: expresión principal del logo. Se usa en headers,
landings, emails, portadas, footers, documentación, cualquier superficie
horizontal y legible.

### Estructura

```
connik + [u-pack : u + dot]
         └── tile lime envuelve u + punto final
```

### Tabla de propiedades

| property                      | value                                                     |
|-------------------------------|-----------------------------------------------------------|
| `font_family`                 | `Funnel Display, -apple-system, sans-serif`               |
| `font_weight`                 | `900`                                                     |
| `letter_spacing`              | `-0.055em`                                                |
| `line_height`                 | `1`                                                       |
| `white_space`                 | `nowrap`                                                  |
| `connik_color_on_paper`       | `#0D0F10`                                                 |
| `connik_color_on_ink`         | `#F5F4EF`                                                 |
| `u-pack_background`           | `#D9FF3A`                                                 |
| `u-pack_u_color`              | `#0D0F10`    ← INVIOLABLE                                 |
| `u-pack_dot_color`            | `#FF4A1C`    ← INVIOLABLE                                 |
| `u-pack_padding`              | `.07em .14em .07em .09em`    (top right bottom left)      |
| `u-pack_border_radius`        | `0.2em`                                                   |
| `u-pack_margin_left`          | `0.02em`                                                  |

### HTML canónico (copiar literal)

```html
<span class="brand">conn<span>i</span>k<span class="u-pack">u<span class="dot">.</span></span></span>
```

### CSS canónico (copiar literal)

```css
.brand {
  display: inline-flex;
  align-items: baseline;
  font-family: 'Funnel Display', -apple-system, sans-serif;
  font-weight: 900;
  letter-spacing: -.055em;
  line-height: 1;
  color: #0D0F10;                    /* connik on light bg */
  text-decoration: none;
  white-space: nowrap;
}
.brand .u-pack {
  display: inline-flex;
  align-items: baseline;
  background: #D9FF3A;
  color: #0D0F10;                    /* u always ink · INVIOLABLE */
  padding: .07em .14em .07em .09em;
  border-radius: .2em;
  margin-left: .02em;
}
.brand .u-pack .dot { color: #FF4A1C; }
.brand.on-dark { color: #F5F4EF; }   /* connik on dark bg only */
```

### Variante React (signatura propuesta)

```typescript
interface BrandWordmarkProps {
  onDark?: boolean;        // default false · use on dark backgrounds
  size?: number;           // font-size in px · default inherited
  className?: string;
}

<BrandWordmark />                     // default · on paper
<BrandWordmark onDark size={48} />    // on ink · 48px
```

```
RULE:            margin_left on u-pack in em · scales with font-size
RULE:            padding on u-pack in em · scales with font-size
RULE:            tile lime and u color NEVER change with onDark prop
RULE:            only the color of "connik" text switches between ink and paper
```

---

## LOGO.04 · APP_ICON.SPEC

Reducción oficial cuando el wordmark completo no cabe. Se usa para
favicon, app icons de tiendas, tiles de sistema operativo, Apple Watch,
splash screens.

### Grilla 100 × 100

| property                      | value                                                     |
|-------------------------------|-----------------------------------------------------------|
| `canvas_viewbox`              | `0 0 100 100`                                             |
| `tile_rect_width`             | `100`                                                     |
| `tile_rect_height`            | `100`                                                     |
| `tile_border_radius`          | `22`    (= 22% of side)                                   |
| `tile_fill`                   | `#D9FF3A`                                                 |
| `letter_u_element`            | `<text>`                                                  |
| `letter_u_x`                  | `50`    ← centered horizontally                           |
| `letter_u_y`                  | `71`    ← optical center vertically                       |
| `letter_u_text_anchor`        | `middle`                                                  |
| `letter_u_font_family`        | `Funnel Display, -apple-system, sans-serif`               |
| `letter_u_font_weight`        | `900`                                                     |
| `letter_u_font_size`          | `84`                                                      |
| `letter_u_letter_spacing`     | `-4`                                                      |
| `letter_u_fill`               | `#0D0F10`    ← INVIOLABLE                                 |
| `dot_element`                 | `<circle>`                                                |
| `dot_cx`                      | `77`    ← positioned relative to u · not to canvas edge   |
| `dot_cy`                      | `68`                                                      |
| `dot_r`                       | `6`                                                       |
| `dot_fill`                    | `#FF4A1C`    ← INVIOLABLE                                 |

### SVG canónico (copiar literal)

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

```
NOTE:            the "u" is optically centered in the canvas · xy = (50, 71)
NOTE:            the dot is positioned relative to the right side of the u · NOT to canvas edge
NOTE:            resulting composition balances with u as main element and dot as accent
NOTE:            negative letter-spacing (-4) compacts the u to fit tightly inside tile
```

### Export to PNG

```
IF font "Funnel Display" is installed on exporting machine THEN export directly
IF font absent THEN convert <text> to <path> before export
TOOLS:  Inkscape "Object to Path" · Fontello · any equivalent outliner
```

---

## LOGO.05 · IMPLEMENTATION.VARIANTS

Las 5 variantes oficiales. Cada una tiene un SVG exacto en
`assets/branding/`.

### 5.1 · `logo-tile.svg` (color, primary)

Ver SVG canónico en `LOGO.04`.

### 5.2 · `logo-tile-mono-dark.svg` (mono sobre fondo claro)

```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Conniku">
  <rect width="100" height="100" rx="22" fill="#0D0F10"/>
  <text x="50" y="71" text-anchor="middle"
        font-family="Funnel Display, -apple-system, sans-serif"
        font-weight="900" font-size="84" fill="#F5F4EF"
        letter-spacing="-4">u</text>
  <circle cx="77" cy="68" r="6" fill="#F5F4EF"/>
</svg>
```

### 5.3 · `logo-tile-mono-light.svg` (mono sobre fondo oscuro)

```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Conniku">
  <rect width="100" height="100" rx="22" fill="#F5F4EF"/>
  <text x="50" y="71" text-anchor="middle"
        font-family="Funnel Display, -apple-system, sans-serif"
        font-weight="900" font-size="84" fill="#0D0F10"
        letter-spacing="-4">u</text>
  <circle cx="77" cy="68" r="6" fill="#0D0F10"/>
</svg>
```

### 5.4 · `logo-full.svg` (wordmark color sobre paper)

Implementación como SVG con `<text>` + `<rect>` + `<text>` + `<circle>` respetando
la geometría en `em` equivalente. Preferible implementar como componente React
`<BrandWordmark />` usando HTML+CSS (ver `LOGO.03`).

### 5.5 · `logo-full-white.svg` (wordmark color sobre ink)

Idem 5.4 pero con `connik` en `#F5F4EF`. Tile lime, u ink, dot orange permanecen.

---

## LOGO.06 · CONSTRAINTS.SIZE

| context                    | min_digital  | min_print  | recommended                          |
|----------------------------|--------------|------------|--------------------------------------|
| `app_icon`                 | `16px`       | `8mm`      | `32px–240px` depending on surface    |
| `wordmark_integrated`      | `96px` width | `24mm`     | `120px–180px` for nav · `64px–160px` for email |
| `favicon`                  | `16px`       | N/A        | `32px` for retina                    |

```
RULE:    IF rendered_size < min_digital THEN use app_icon instead of wordmark
RULE:    IF app_icon_rendered_size < 16px THEN do not render logo · use text only
```

---

## LOGO.07 · CONSTRAINTS.CLEAR_SPACE

Espacio libre mínimo alrededor del logo. Dentro de este margen no puede
haber nada.

| target                  | clear_space_value          | measurement_ref                 |
|-------------------------|----------------------------|---------------------------------|
| `wordmark_integrated`   | `x = height_of_u`          | `~0.7em` of font-size            |
| `app_icon`              | `x = 24% of tile_side`     | outside the `rx` border          |

```
FORBIDDEN_IN_CLEAR_SPACE:    text · other logos · decorative images · container borders · icons
```

---

## LOGO.08 · RULES.INVIOLABLE

Reglas que nunca se rompen. Cualquier violación invalida el asset.

- [!] `u_color == #0D0F10` · always · no exception · on any background
- [!] `dot_color == #FF4A1C` · always · no exception
- [!] `u-pack_background == #D9FF3A` · always · no exception
- [!] `palette_size == 4` · no additional colors
- [!] `u-pack` contains `u + dot` · never separated
- [!] `wordmark_rotation == 0deg` · no rotation allowed
- [!] `font_family == Funnel Display 900` · no substitution
- [!] final `.` is present · never omitted
- [!] `aspect_ratio` preserved · no stretch · no skew
- [!] logo modification requires approval from Cristian Gutiérrez Lazcano

---

## LOGO.09 · FORBIDDEN.LIST

Acciones prohibidas sobre cualquier variante del logo.

- ✗ apply `filter: blur / drop-shadow / hue-rotate / invert / sepia`
- ✗ apply `transform: rotate(!=0) / skew / scaleY` independent of `scaleX`
- ✗ apply `outline` or `border` around the tile
- ✗ apply `glow` or `bevel`
- ✗ substitute `font-family`
- ✗ change `u fill` from `#0D0F10`
- ✗ change `dot fill` from `#FF4A1C`
- ✗ change `tile fill` from `#D9FF3A`
- ✗ use wordmark with `opacity < 30%`
- ✗ overlay text on top of `u-pack`
- ✗ wrap logo inside additional `box / pill / ring`
- ✗ place logo within `2x clear_space` of another logo without divider
- ✗ animate with geometry distortion (squash / stretch / morph)
- ✗ use logo as decorative typography inside illustrations
- ✗ emit low-resolution raster below `min_digital`

---

## LOGO.10 · CONTEXT.USAGE

Matriz de contextos donde aparece el logo en el producto.

| surface                  | variant                                        | size_px_approx              |
|--------------------------|------------------------------------------------|------------------------------|
| `browser_favicon`        | app_icon                                       | 16 / 32                      |
| `sidebar_collapsed`      | app_icon                                       | 32                           |
| `sidebar_expanded`       | wordmark_integrated                            | 120                          |
| `auth_pages`             | wordmark_integrated                            | 180                          |
| `onboarding_nav`         | wordmark_integrated                            | 24 font-size · ~60 width     |
| `splash_screen`          | app_icon_120 + wordmark_64                     | stacked vertically           |
| `public_footer`          | wordmark_integrated                            | 140                          |
| `app_store_ios`          | app_icon · 1024×1024 master                    | per store spec               |
| `app_store_android`      | app_icon · adaptive_icon 432 + safe_area 264   | per store spec               |
| `transactional_email`    | wordmark_integrated                            | 160                          |
| `og_image`               | wordmark_integrated + tagline                  | 1200×630                     |

```
OUT_OF_SCOPE:    logo does not appear outside surfaces listed above
NOTE:            identity in remaining UI comes from design tokens · not logo repetition
```

---

## LOGO.11 · VALIDATION.CHECKLIST

Criterios binarios (pass/fail). Toda pieza que use el logo debe pasar
todos antes del merge.

- [ ] All logo assets come from `assets/branding/` · not redrawn inline
- [ ] `u` fill is exactly `#0D0F10` in every usage
- [ ] `dot` fill is exactly `#FF4A1C` in every usage
- [ ] `tile` fill is exactly `#D9FF3A` in every usage
- [ ] No `filter`, `transform: rotate`, or `outline` applied to logo elements
- [ ] Logo respects clear space requirement (LOGO.07)
- [ ] Logo size is above minimum for its context (LOGO.06)
- [ ] Font `Funnel Display` is loaded or text is outlined to path
- [ ] On dark backgrounds: only `connik` color changes to paper · tile stays lime
- [ ] On light backgrounds: `connik` is ink · tile stays lime
- [ ] Wordmark HTML structure matches `LOGO.03` canonical exactly
- [ ] App icon SVG structure matches `LOGO.04` canonical exactly
- [ ] Context of use matches one of the surfaces in `LOGO.10`
- [ ] No new variant created without Cristian's approval

```
IF any_checkbox_unchecked THEN merge_blocked
```

---

## LOGO.12 · CONNECTIONS

Enlaces y rutas que invoca el logo (si aplica).

```
CONNECTION_NAV_BRAND:             PENDING_USER_INSTRUCTION
CONNECTION_FOOTER_LOGO:           PENDING_USER_INSTRUCTION
CONNECTION_FAVICON:               N/A (static asset, no click)
CONNECTION_APP_STORE_ICON:        N/A (static asset, handled by store)
```

```
RULE:    IF logo is a link in a specific UI surface THEN Cristian must specify destination
RULE:    DO NOT invent destinations · mark as PENDING until confirmed
```

---

## LOGO.13 · STACK.TARGET

Stack técnico del producto donde se implementa este logo.

```
STACK:    PENDING_USER_CONFIRMATION
```

```
RULE:    once Cristian confirms stack, update LOGO.03 and LOGO.04 with framework-specific implementations
RULE:    until confirmed, CSS/HTML canonical is framework-agnostic
```

---

## LOGO.14 · RESPONSIVE.SPEC

Comportamiento del logo en distintos dispositivos.

```
RESPONSIVE:    PENDING_USER_CONFIRMATION
```

```
NOTE:    logo geometry does not change with viewport
NOTE:    size tier (which variant to use) may change per breakpoint
EXPECTED: future spec defines desktop / tablet / phone_landscape / phone_portrait rules
```

---

## LOGO.15 · END

End of spec. File is complete. No further sections.

```
IF implementer_finds_ambiguity THEN open issue · DO_NOT_improvise
IF implementer_finds_missing_info THEN mark as PENDING_USER_INSTRUCTION · ask Cristian
```
