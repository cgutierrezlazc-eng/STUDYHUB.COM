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

Wordmark integrado: expresión principal del logo.

### HTML canónico

```html
<span class="brand">conn<span>i</span>k<span class="u-pack">u<span class="dot">.</span></span></span>
```

### CSS canónico

```css
.brand {
  display: inline-flex;
  align-items: baseline;
  font-family: 'Funnel Display', -apple-system, sans-serif;
  font-weight: 900;
  letter-spacing: -.055em;
  line-height: 1;
  color: #0D0F10;
  text-decoration: none;
  white-space: nowrap;
}
.brand .u-pack {
  display: inline-flex;
  align-items: baseline;
  background: #D9FF3A;
  color: #0D0F10;
  padding: .07em .14em .07em .09em;
  border-radius: .2em;
  margin-left: .02em;
}
.brand .u-pack .dot { color: #FF4A1C; }
.brand.on-dark { color: #F5F4EF; }
```

### Variante React propuesta

```typescript
interface BrandWordmarkProps {
  onDark?: boolean;
  size?: number;
  className?: string;
}

<BrandWordmark />
<BrandWordmark onDark size={48} />
```

---

## LOGO.04 · APP_ICON.SPEC

SVG canónico (literal):

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

---

## LOGO.08 · RULES.INVIOLABLE

- [!] `u_color == #0D0F10`
- [!] `dot_color == #FF4A1C`
- [!] `u-pack_background == #D9FF3A`
- [!] `palette_size == 4`
- [!] `u-pack` contiene `u + dot`
- [!] `wordmark_rotation == 0deg`
- [!] `font_family == Funnel Display 900`
- [!] final `.` presente
- [!] aspect_ratio preservado
- [!] modificación requiere aprobación de Cristian

---

## LOGO.11 · VALIDATION.CHECKLIST

- [ ] Assets vienen de `assets/branding/` · no redibujados inline
- [ ] `u` fill = `#0D0F10`
- [ ] `dot` fill = `#FF4A1C`
- [ ] `tile` fill = `#D9FF3A`
- [ ] Sin `filter`, `transform: rotate`, `outline`
- [ ] Clear space LOGO.07 respetado
- [ ] Tamaño sobre mínimo LOGO.06
- [ ] Funnel Display cargada o texto convertido a path
- [ ] En fondo oscuro solo cambia color de `connik` a paper
- [ ] En fondo claro `connik` en ink
- [ ] Estructura HTML wordmark = LOGO.03 literal
- [ ] Estructura SVG app icon = LOGO.04 literal
- [ ] Contexto de uso en LOGO.10
- [ ] Sin variantes nuevas sin aprobación

---

**Copia local del spec para referencia del código.**

**Fuente de verdad**: `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/00-BRAND-LOGO.md`
