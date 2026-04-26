# Instrucciones de implementación · Conniku Wordmark

Estas instrucciones son **obligatorias**. No interpretes, no extiendas. El logo es lo que está en estos archivos. Si algo no aparece especificado aquí, no lo agregues.

---

## 1. Estructura HTML del wordmark

Esta es la **única** estructura válida. No la modifiques:

```html
<span class="brand">
  conn<span>i</span><span class="k-letter">k</span><span class="u-pack">
    <span class="u-letter">u</span>
    <span class="dot"></span>
  </span>
</span>
```

Para fondos oscuros:
```html
<span class="brand on-dark"> ... </span>
```

### Notas sobre la estructura

- Las letras `c`, `o`, `n`, `n` van como **texto plano** dentro del `.brand`.
- La `i` está envuelta en un `<span>` **estructural**, sin clase. **Visualmente es idéntica** al resto de las letras. No le apliques italic, no le bajes la opacidad, no le cambies nada.
- La `k` va envuelta en `<span class="k-letter">`. Esto le permite quedar **delante** del cuadrado verde con un stroke negro mínimo de 0.5px.
- La `u` va dentro de `<span class="u-pack">` junto al `<span class="dot">` (que es un círculo, **no contiene texto**).
- El `<span class="u-pack">` no tiene fondo verde por sí mismo. El cuadrado verde se pinta con `::before`.

---

## 2. CSS

Usá `ConnikuWordmark.css` tal cual. **No combines** estas reglas con otros estilos globales que puedan pisar `letter-spacing`, `font-weight`, `line-height` o `position`.

### Tokens fundamentales (no negociables)

```css
.brand {
  font-family: 'Funnel Display', -apple-system, sans-serif;
  font-weight: 900;
  letter-spacing: -0.055em;
  line-height: 1;
}
```

### Mecánica del cuadrado verde

- El cuadrado se dibuja como `::before` del `.u-pack`.
- `.u-pack` tiene `isolation: isolate` para crear su propio stacking context.
- El `::before` tiene `z-index: -1`, lo que lo deja **detrás** de la `u-letter` (y de la `k-letter` que tiene `z-index: 2`).
- El cuadrado se centra sobre la `u` con `left: 50%; top: 59%; transform: translate(-50%, -50%) rotate(-8deg)`.

### Stroke de la k

```css
.brand .k-letter {
  position: relative;
  z-index: 2;
  -webkit-text-stroke: 0.5px #0D0F10;
  text-stroke: 0.5px #0D0F10;
  paint-order: stroke fill;
}
```

El `0.5px` es **al tamaño base del texto**. Si el wordmark es muy chico (≤16px), el stroke puede no renderizar — está bien, sigue siendo legible. **No subas el valor** sin pedir.

---

## 3. Importar Funnel Display

Debe cargarse desde Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@900&display=swap">
```

O en CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Funnel+Display:wght@900&display=swap');
```

Si la fuente no carga, **no uses fallback**. El logo no es legible sin Funnel Display 900. Mostrá un placeholder o asegurate de cargarla en build time.

---

## 4. App Icon (LOGO.04)

Tres variantes en SVG en este paquete:

- `app-icon.svg` → primario, fondo verde
- `app-icon-mono-dark.svg` → fondo negro (para fondos claros)
- `app-icon-mono-light.svg` → fondo paper (para fondos oscuros)

### Especificaciones del App Icon

| Elemento     | Valor                                 |
|--------------|---------------------------------------|
| viewBox      | `-10 -10 120 120`                     |
| Tile rect    | `width="100" height="100" rx="22"`    |
| Tile rotación| `transform="rotate(-8 50 50)"`        |
| u text       | `x=50 y=71`, `font-size=84`, `letter-spacing=-4` |
| dot circle   | `cx=77 cy=68 r=6`                     |

El viewBox `-10 -10 120 120` está intencionalmente extendido: el tile rotado a -8° sobresale ~7px en cada esquina. **No reduzcas el viewBox** o se cortarán las esquinas.

La `u` y el `dot` **NO rotan**: solo el tile (rect) está rotado -8°.

Para iOS/macOS app icons, exportar a PNG en estos tamaños mínimos:
- 1024×1024 (App Store)
- 180×180 (iOS app icon)
- 60×60, 120×120 (iOS variants)
- 512×512, 256×256 (macOS)

---

## 5. Tamaños recomendados del wordmark

| Contexto             | font-size         |
|----------------------|-------------------|
| Onboarding nav       | 18px              |
| Header              | 32px              |
| Sidebar / panel      | 48px              |
| Auth / hero          | 72px              |
| Landing oversize     | 96–144px          |

Tamaño mínimo legible: **16px**. Por debajo, usar el App Icon.

---

## 6. Lo que NO se hace

- ❌ No volver al cuadrado recto (sin la rotación −8°).
- ❌ No inclinar las letras (`connik` siempre van rectas).
- ❌ No rotar el wordmark completo.
- ❌ No cambiar la paleta. El verde es **#D9FF3A**, el dot es **#FF4A1C**, el ink es **#0D0F10**, el paper es **#F5F4EF**.
- ❌ No usar mayúsculas. El wordmark es siempre minúsculas.
- ❌ No estirar / deformar (`scaleX`, `scaleY`, etc.).
- ❌ No agregar sombras, gradientes, efectos al wordmark.
- ❌ No cambiar la `i` por una versión italic, gris o reducida en opacidad.
- ❌ No reemplazar Funnel Display por otra familia "similar" (Inter, Geist, Satoshi, etc.).

---

## 7. Componente React

Usá `ConnikuWordmark.tsx` (o `.jsx`). Props disponibles:

```tsx
<ConnikuWordmark />                          // sobre fondo claro
<ConnikuWordmark onDark />                   // sobre fondo oscuro
<ConnikuWordmark onDark size={48} />         // tamaño explícito
<ConnikuWordmark className="custom" />       // className extra
```

El componente importa `ConnikuWordmark.css` automáticamente. Si tu setup no soporta CSS imports en JS, importá el CSS por separado en tu entry global.

---

## 8. Accesibilidad

El wordmark debe llevar `aria-label="Conniku"` cuando se use como logo principal (en headers, footers, splash). Cuando es decorativo y la palabra ya está en otra parte de la página, podés ponerle `aria-hidden="true"`.

Esto está incluido en el componente React.

---

## 9. Preview

Abrí `ConnikuWordmark.html` en un navegador para ver el wordmark renderizado en varios tamaños y sobre varios fondos. Usalo como referencia visual de cómo debe verse en producción.
