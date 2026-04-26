# Conniku · Logo Oficial · Handoff

Paquete de entrega del logo oficial de Conniku para integración en código.

## Contenido

```
handoff/
├── README.md                  ← este archivo
├── INSTRUCCIONES.md           ← guía de implementación obligatoria
├── ConnikuWordmark.html       ← preview standalone del wordmark
├── ConnikuWordmark.css        ← CSS drop-in del wordmark
├── ConnikuWordmark.tsx        ← componente React/TypeScript
├── ConnikuWordmark.jsx        ← componente React (JS plano)
├── app-icon.svg               ← App Icon · color (paleta primaria)
├── app-icon-mono-dark.svg     ← App Icon · monocromo oscuro
└── app-icon-mono-light.svg    ← App Icon · monocromo claro
```

## Resumen visual

El logo es un wordmark compuesto por la palabra **conniku** (7 letras minúsculas) en Funnel Display 900, con un cuadrado verde lima inclinado −8° colocado **detrás** de la `k` y la `u`. Dentro del cuadrado verde, sobre la cola derecha de la `u`, hay un punto naranja (dot).

Estructura:

- **conni** (5 letras) — color del texto, sin tratamiento especial
- **k** — pintada delante del cuadrado verde, con stroke negro de 0.5px (al tamaño base 1em del texto) para separarla visualmente del verde
- **cuadrado verde** — fondo, inclinado −8°, abraza la k+u
- **u** — pintada delante del cuadrado verde, color #0D0F10
- **dot** — círculo naranja al final de la cola derecha de la u

## Paleta inviolable

| Token              | HEX       | Uso                              |
|--------------------|-----------|----------------------------------|
| `--ink`            | `#0D0F10` | Texto sobre fondos claros        |
| `--paper`          | `#F5F4EF` | Texto sobre fondos oscuros       |
| `--logo-tile`      | `#D9FF3A` | Cuadrado verde · INVIOLABLE      |
| `--logo-u`         | `#0D0F10` | Color de la u dentro del tile    |
| `--logo-dot`       | `#FF4A1C` | Dot naranja · INVIOLABLE         |

## Tipografía inviolable

- **Familia**: Funnel Display
- **Peso**: 900
- **Letter-spacing**: −0.055em
- **Line-height**: 1
- Todas las letras (incluida la `i`) usan el mismo estilo. No hay italic, ni opacidad reducida, ni variaciones.

Lee **INSTRUCCIONES.md** antes de implementar.
