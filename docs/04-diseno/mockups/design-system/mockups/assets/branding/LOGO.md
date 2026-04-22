# Conniku — Sistema de marca visual · v2.0.0

Este documento es la fuente única de verdad del logo oficial de Conniku.
Define composición, paleta, proporciones, espacio libre, tamaños mínimos,
usos correctos e incorrectos. Aplica a web, móvil (iOS + Android), iPad,
macOS, Windows, Apple Watch, extensión de navegador, tiendas de
aplicaciones, material impreso, redes sociales y cualquier superficie
donde aparezca la identidad visual de Conniku.

**Regla inviolable**: ningún asset de producto puede usar una versión
del logo distinta a las listadas en `assets/branding/svg/` o
`assets/branding/platforms/`. Cualquier variación requiere aprobación
explícita de Cristian y debe añadirse aquí antes de implementarse.

**Versión vigente**: v2.0.0 (2026-04-18) — Tile integrado al wordmark.
Reemplaza v1.0.0 (tile + wordmark separados), deprecada.

---

## 1. Composición

El logo oficial de Conniku v2.0 tiene **dos expresiones** derivadas de
la misma idea geométrica. Ambas son oficiales y ambas deben usarse
según el contexto.

### 1.1 Wordmark integrado (expresión principal)

La palabra "conniku." con la **"u" y el "."** encapsulados dentro de
un tile lima que se integra al flujo tipográfico. El tile lima deja
de ser un símbolo separado y pasa a ser parte del wordmark mismo.

    c · o · n · n · i · k · [ u . ]
                             ↑
                             tile lima con u ink + punto naranja

Composición:

- `connik` en tinta (`#0D0F10`), tipografía Funnel Display 900
- Tile lima (`#D9FF3A`) con esquinas redondeadas envuelve la "u" y
  el "."
- Dentro del tile:
  - "u" en tinta (`#0D0F10`) — **siempre, sin excepción**
  - "." en naranja (`#FF4A1C`) — la chispa característica

Este es el logo que aparece en headers, landings, emails, portadas,
footers, material impreso, material gráfico, documentación, y
cualquier superficie donde quepa horizontal y legible.

### 1.2 App icon (reducción cuadrada)

Cuando el wordmark completo no cabe (favicon 16px, App Store 1024,
tile de sistema operativo, Apple Watch, tienda de apps), la
reducción oficial es el tile con solo la "u" y el "." adentro:

- Canvas cuadrado
- Fill completo lima (`#D9FF3A`)
- Border radius 22% del lado
- Letra "u" centrada en tinta (`#0D0F10`), 84% del alto del canvas
- Punto naranja (`#FF4A1C`) a la derecha de la "u", alineado al
  baseline, 6% del canvas

Este tile es el que se exporta a favicon, app icons, tiles, watch
faces, splash screens.

### 1.3 Interpretación simbólica (no literal)

- La palabra "conniku" es la plataforma: escrita, comunicada,
  presente.
- La "u" final representa al usuario (tú) que llega al final del
  recorrido.
- El punto final es el instante en que algo hace sentido —la
  chispa de atención.
- El tile lima envuelve a ambos: el espacio donde la plataforma
  acompaña al usuario hasta ese instante.

El cambio de v1.0 → v2.0 traslada el símbolo desde "al lado" del
wordmark hacia "dentro" del wordmark. La marca ya no es logo más
palabra; es una sola cosa.

---

## 2. Paleta oficial

| Rol                | Token         | Hex         | Uso                                      |
|--------------------|---------------|-------------|------------------------------------------|
| Tinta              | `--ink`       | `#0D0F10`   | "connik" + "u" + texto sobre fondos claros |
| Lima               | `--lime`      | `#D9FF3A`   | Fondo del tile (u+punto)                 |
| Naranja chispa     | `--spark`     | `#FF4A1C`   | Punto final "." (la chispa)              |
| Paper              | `--paper`     | `#F5F4EF`   | "connik" sobre fondos oscuros            |

Cuatro colores. Nada más. Prohibido introducir variaciones por
filtros CSS, gradientes, brillos, sombras externas o efectos.

**La "u" es siempre tinta (`#0D0F10`), sin excepción.** Aunque el
fondo sea ink, pink, violet, cyan, o cualquier otro color, la "u"
se mantiene tinta sobre el tile lima. Es la regla más estricta del
sistema.

---

## 3. Geometría (wordmark integrado)

Sobre grilla de em (relativo al tamaño de fuente del wordmark):

| Elemento                   | Valor                      |
|----------------------------|----------------------------|
| Tipografía                 | Funnel Display             |
| Peso                       | 900 (Black)                |
| Tracking                   | `letter-spacing: -.055em`  |
| Tile background            | `#D9FF3A`                  |
| Tile padding top / bottom  | `.07em`                    |
| Tile padding left          | `.09em`                    |
| Tile padding right         | `.14em`                    |
| Tile border radius         | `.20em`                    |
| Tile contenido             | "u" + "."                  |

Implementación HTML/CSS canónica:

```html
<span class="wm-integrated">conn<span>i</span>k<span class="u-pack">u<span class="dot">.</span></span></span>
```

```css
.wm-integrated {
  font-family: 'Funnel Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 900;
  color: #0D0F10;
  letter-spacing: -.055em;
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  white-space: nowrap;
}
.wm-integrated .u-pack {
  display: inline-flex;
  align-items: baseline;
  background: #D9FF3A;
  padding: .07em .14em .07em .09em;
  border-radius: .2em;
  color: #0D0F10; /* La u siempre en ink */
}
.wm-integrated .u-pack .dot {
  color: #FF4A1C;
}
```

Este bloque CSS debe replicarse en cada hoja que use el wordmark.
En el frontend final, vivirá como componente React reutilizable
`<ConnikuWordmark />`.

---

## 4. Geometría (app icon)

Sobre grilla de 100×100:

| Elemento                   | Valor                |
|----------------------------|----------------------|
| Canvas                     | 100 × 100            |
| Border radius del tile     | 22 (22%)             |
| Fill del tile              | `#D9FF3A`            |
| Letra "u"                  | Funnel Display 900   |
| "u" tamaño                 | `font-size: 84`      |
| "u" letter-spacing         | `-4`                 |
| "u" posición               | `x=50, y=78`, `text-anchor: middle` |
| "u" color                  | `#0D0F10`            |
| Punto                      | `circle`             |
| Punto centro               | `(85, 76)`           |
| Punto radio                | `6`                  |
| Punto color                | `#FF4A1C`            |

Implementación SVG canónica:

```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Conniku">
  <rect width="100" height="100" rx="22" fill="#D9FF3A"/>
  <text x="50" y="78" text-anchor="middle"
        font-family="Funnel Display, -apple-system, sans-serif"
        font-weight="900" font-size="84" fill="#0D0F10"
        letter-spacing="-4">u</text>
  <circle cx="85" cy="76" r="6" fill="#FF4A1C"/>
</svg>
```

**Nota para producción**: cuando se exporten los SVG a PNG para tiendas
(App Store, Play Store), la fuente Funnel Display debe estar cargada
en el sistema que exporta. Alternativamente, convertir la "u" a
`<path>` (outline) antes de exportar para independencia total de la
fuente. Esta conversión la hace el equipo de frontend al preparar el
build de assets finales.

---

## 5. Espacio libre (clear space)

Alrededor de cualquier expresión del logo siempre hay un margen
vacío mínimo de `x`:

- **Wordmark**: `x = altura de la "u"` (aproximadamente 0.7em del
  font-size del wordmark)
- **App icon**: `x = 24% del lado` del tile

Dentro del espacio libre no puede haber: texto, otros logos,
imágenes decorativas, bordes de contenedores, iconos.

---

## 6. Tamaños mínimos

| Superficie                | Mínimo digital | Mínimo impreso |
|---------------------------|----------------|----------------|
| App icon (tile cuadrado)  | 16 px          | 8 mm           |
| Wordmark integrado        | 96 px ancho    | 24 mm ancho    |
| Favicon (tile)            | 16 px          | n/a            |

Por debajo de estos tamaños, el logo pierde legibilidad y no debe
usarse. Para espacios menores, usar monocromo alto contraste.

---

## 7. Variantes oficiales

Todas en `assets/branding/svg/`:

- `logo-tile.svg` — App icon a color (lime + u ink + punto naranja)
- `logo-tile-white.svg` — App icon sobre fondo claro (mismo que anterior; el fondo externo es decisión del contexto)
- `logo-tile-mono-dark.svg` — Monocromo sobre fondo claro (tile ink, u paper, punto ink)
- `logo-tile-mono-light.svg` — Monocromo sobre fondo oscuro (tile paper, u ink, punto ink)
- `logo-full.svg` — Wordmark integrado a color
- `logo-full-white.svg` — Wordmark integrado con "connik" en paper (dark mode)

Prohibido crear variantes nuevas sin aprobación.

---

## 8. Variantes por plataforma

Todos en `assets/branding/platforms/`. Matemáticamente derivados del
tile master, no interpretaciones artísticas.

### Web

- `web/favicon.svg` — 32×32
- `web/og-image.svg` — 1200×630 (fondo warm paper + splatter + tagline)

### iOS

- `ios/app-icon-1024.svg` — master App Store
- `ios/app-icon-180.svg` — iPhone @3x
- `ios/app-icon-152.svg` — iPad
- `ios/app-icon-120.svg` — iPhone @2x

### iPad

- `ipad/app-icon-167.svg` — iPad Pro
- `ipad/app-icon-152.svg` — iPad estándar

### Android

- `android/adaptive-icon.svg` — 432×432 con safe area 264×264
- `android/playstore-512.svg` — listing 512×512

### macOS

- `macos/app-icon-1024.svg` — squircle Big Sur+

### Apple Watch

- `watch/app-icon-98.svg` — circular

### Windows

- `windows/mstile-150.svg`
- `windows/mstile-310.svg`

### Extensión de navegador

- `extension/chrome-icon-16.svg`
- `extension/chrome-icon-48.svg`
- `extension/chrome-icon-128.svg`

### Splash screens

- `splash/splash-portrait-1284x2778.svg` — iPhone Pro Max
- `splash/splash-portrait-1080x1920.svg` — Android estándar

---

## 9. Usos correctos

- Sobre warm paper (`#F5F4EF`): wordmark integrado en tinta
- Sobre ink (`#0D0F10`): wordmark integrado con "connik" en paper;
  la "u" dentro del tile lima se mantiene en tinta
- Sobre paleta extendida (pink, cyan, cream, violet): wordmark con
  "connik" en tinta o paper según contraste, tile lima y punto
  naranja inmutables
- Sobre fotografía: preferir el app icon sólido con espacio libre
  ampliado al 150% del mínimo

---

## 10. Usos prohibidos

Estos usos están fuera del sistema y no deben aparecer nunca en
producto, marketing ni comunicación oficial:

1. No rotar el logo fuera de 0°
2. No cambiar los colores ni aplicar tintes
3. No aplicar sombras externas, glow, outlines adicionales, bevels
4. No cambiar la "u" a otro color (debe ser siempre `#0D0F10`)
5. No separar el tile lima del "connik" como era en v1.0
6. No deformar el aspect ratio
7. No cambiar el tipo de letra
8. No eliminar el punto final
9. No superponer texto sobre el tile
10. No encerrar el logo en cajas, bordes adicionales o anillos
11. No combinar con otro logo sin divisor claro (mínimo 2x clear
    space entre ambos)
12. No animar distorsionando geometría (micro-movimientos del punto
    naranja están permitidos bajo reglas de motion design)
13. No usar como marca de agua con opacidad menor a 30%
14. No incrustar dentro de ilustraciones como tipografía decorativa

---

## 11. Uso en interfaz de producto

| Contexto                 | Variante              | Tamaño aprox.  |
|--------------------------|-----------------------|----------------|
| Sidebar colapsado        | app icon              | 32 px          |
| Sidebar expandido        | wordmark integrado    | 120 px ancho   |
| Login / Register         | wordmark integrado    | 180 px ancho   |
| Splash screens           | app icon 120 + wordmark 64 | apilados |
| Favicon                  | app icon              | 16-32 px       |
| Footer público           | wordmark integrado    | 140 px ancho   |
| Tiendas de apps          | app icon · spec plataforma | según spec |
| Email transaccional      | wordmark integrado    | 160 px ancho   |

Fuera de estos contextos, el logo no aparece. La identidad se
sostiene por tokens del sistema (tipografía, colores, splatter,
stickers), no por el logo repetido.

---

## 12. Versionado

- **v2.0.0** (2026-04-18): Versión oficial actual. Tile integrado
  al wordmark (u+punto encapsulados). App icon reducido.
- **v1.0.0** (2026-04-18, misma fecha): Versión inicial del
  rediseño, deprecada el mismo día por decisión de Cristian. Tile
  y wordmark separados. Conservada en historia del repo para
  referencia.

Cambios mayores (geometría del tile, colores oficiales, tipografía
del wordmark) requieren aprobación explícita de Cristian y bump a
v3.0.0.

Cambios menores (ajustes de radius, nuevas plataformas añadidas)
requieren aprobación y bump a v2.1.0.

Parches (corrección de error en un SVG específico) van directo a
v2.0.x.

Cada versión conserva archivos en `assets/branding/archive/vX.Y.Z/`
para permitir rollback.

---

## 13. Responsable

Cristian Gutiérrez Lazcano (CEO Conniku SpA) es el único aprobador
de cualquier cambio al sistema de marca. Los agentes técnicos
(frontend-builder, backend-builder, visual-integrity-auditor
futuro) pueden proponer y preparar cambios, pero no pueden
fusionarlos a main sin su aprobación explícita.

---

Última actualización: 2026-04-18 · v2.0.0 · Tile integrado oficial
