# Assets de Publicidad — Conniku

Carpeta donde viven las imágenes que se usan en los mockups para material
publicitario. Los mockups HTML referencian las rutas de esta carpeta vía
`<img src="assets/...">` con fallback CSS por si la imagen no existe aún.

---

## Estructura

```
assets/
├── branding/          # LOGO OFICIAL y variantes por plataforma
│   ├── LOGO.md        # Guidelines de marca (fuente única de verdad)
│   ├── svg/           # Masters: logo-tile + variantes monocromas + full
│   └── platforms/     # Derivados por plataforma (web, ios, ipad, android,
│                      #   macos, windows, watch, extension, splash)
├── students/          # fotos de perfil de los 7 estudiantes protagonistas
├── covers/            # portadas de workspaces / documentos / proyectos
├── books/             # portadas de libros de biblioteca
├── tutores/           # fotos de perfil de tutores
├── universidades/     # logos y wordmarks de universidades chilenas
├── products/          # screenshots reales del producto para comparativa
└── advertising/       # composiciones finales para redes sociales y campañas
```

## Regla inviolable del logo

Ningún mockup, componente, pieza publicitaria ni archivo de producto puede
usar una versión del logo distinta a las listadas en `branding/svg/` y
`branding/platforms/`. La especificación completa vive en
`branding/LOGO.md`. Cualquier variación requiere aprobación explícita de
Cristian antes de implementarse.

**El logo oficial vigente es v2.0.0** (congelado el 2026-04-18), con dos
expresiones:

1. **Wordmark integrado**: "conn" + "i" + "k" + tile lima que encapsula la
   "u" (en tinta `#0D0F10`) y el punto final (en naranja `#FF4A1C`). El
   tile ya no vive al inicio de la palabra, vive dentro.
2. **App icon (reducción cuadrada)**: tile lima `#D9FF3A` con "u" grande
   centrada en tinta + punto naranja a la derecha. Se usa donde el
   wordmark no cabe (favicon, App Store, Play Store, tiles SO, watch).

**La "u" es siempre `#0D0F10`, sin excepción.** Aunque el fondo sea ink,
pink, violet, cyan o cualquier otro color, la "u" se mantiene tinta sobre
el tile lima. Es la regla más estricta del sistema de marca.

El logo v1.0 (tile + wordmark separados) quedó deprecado el mismo día de
su oficialización por decisión de Cristian. No debe usarse en piezas
nuevas.

---

## Especificaciones técnicas por tipo

### `students/` — fotos de perfil

**Los 7 estudiantes del universo Conniku**. Mismos en todos los mockups para
consistencia narrativa.

| Archivo esperado | Estudiante | Carrera · U |
|---|---|---|
| `felipe-gatica.jpg` | Felipe Gatica | Ing. Civil Industrial · UDP |
| `victoria-navarro.jpg` | Victoria Navarro | Psicología · UC |
| `daniela-herrera.jpg` | Daniela Herrera | Marketing · UDP |
| `luis-perez.jpg` | Luis Pérez | Derecho · UChile |
| `pia-ramirez.jpg` | Pía Ramírez | Medicina · UChile |
| `barbara-soto.jpg` | Bárbara Soto | Ing. Comercial · UAH |
| `cristian-gutierrez.jpg` | Cristian Gutiérrez | Ing. Civil Industrial · UChile |

**Specs**:
- Formato: JPG o WebP optimizado
- Dimensión mínima: 512 × 512 px (cuadrado)
- Recomendado: 1024 × 1024 px
- Ratio: 1:1 (cuadradas)
- Recorte: desde hombros, rostro centrado
- Fondo: neutro que contraste con paleta editorial (mejor: blanco, crema, warm paper)
- Iluminación: natural, suave
- Expresión: relajada, cercana (no corporativa tipo LinkedIn)

**Fallback mientras no haya foto**: los mockups muestran iniciales (`FG`, `VN`,
`DH`, etc.) sobre gradiente editorial con colores de la paleta asignados por
persona. Se ve bien sin foto real.

### `covers/` — portadas de documentos / proyectos

**Specs**:
- Formato: JPG o WebP
- Dimensión: 1600 × 800 px (ratio 2:1)
- Estilo editorial con splatter dots y elementos geométricos
- Puede ser ilustración, fotografía intervenida o composición tipográfica

**Ejemplos esperados**:
- `food-service-chile.jpg` — portada del workspace de Marketing III
- `termodinamica-informe.jpg` — portada del workspace de Ingeniería
- `tesis-memoria.jpg`
- `semillero-emprendimiento.jpg`

### `books/` — portadas de libros biblioteca

**Specs**:
- Formato: JPG o WebP
- Dimensión: 400 × 600 px (ratio 2:3, formato libro)
- Muestran tapa del libro real o composición tipográfica

**Ejemplos esperados** (los que aparecen en mockup 02 Biblioteca):
- `cengel-termodinamica.jpg`
- `apostol-calculo-vol2.jpg`
- `hibbeler-mecanica-materiales.jpg`
- `strang-algebra-lineal.jpg`

### `tutores/` — fotos de tutores verificados

**Los tutores del universo Conniku** aparecen en mockups de Tutores,
ClassRoom y Mentorship.

**Specs**:
- Formato: JPG o WebP
- Dimensión mínima: 512 × 512 px
- Ratio: 1:1
- Estilo: más formal que estudiantes (profesionales)

**Cast de tutores del universo**:
- Margarita Soto (tutora matemáticas · Universidad de Chile)
- Eduardo Rojas (tutor derecho · UC)
- Andrea Vega (tutora psicología · UDP)
- Rodrigo Flores (tutor ingeniería · USACH)

### `universidades/` — logos y wordmarks

**Specs**:
- Formato: SVG (preferido) o PNG transparente
- Tamaño SVG: vector puro
- Tamaño PNG: 512 × 512 px mínimo
- Versiones: color + monocromo ink

**Universidades del universo Conniku** (primeras 14):
- `uchile.svg`
- `uc.svg` (Pontificia Católica)
- `udp.svg` (Diego Portales)
- `usach.svg` (Santiago)
- `uah.svg` (Alberto Hurtado)
- `uandes.svg` (Andes)
- `adolfoibanez.svg`
- `unab.svg` (Andrés Bello)
- `duoc.svg`
- `finisterrae.svg`
- `mayor.svg`
- `diego-portales.svg`
- `uchile-norte.svg`
- `austral.svg`

### `products/` — screenshots reales del producto

Capturas de pantalla del producto Conniku real en acción para material
comparativo, testimoniales o sección "así se ve Conniku".

### `advertising/` — composiciones finales

Composiciones hechas específicamente para campañas:
- Posts cuadrados Instagram (1080 × 1080)
- Stories verticales (1080 × 1920)
- LinkedIn banners
- YouTube thumbnails
- Carruseles
- Material impreso

---

## Cómo se usan en los mockups

Los mockups HTML referencian las rutas así:

```html
<img src="assets/students/felipe-gatica.jpg" alt="Felipe Gatica" />
```

Con fallback CSS que muestra iniciales con gradiente si la imagen no existe:

```css
.part.av-felipe {
  background: linear-gradient(135deg, var(--lime), var(--cream));
  color: var(--lime-ink);
}
.part.av-felipe img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
```

Cuando Cristian entregue las fotos reales, las coloca en `assets/students/` y
los mockups las recogen automáticamente. Mientras tanto, los mockups se ven
coherentes con los gradientes por persona.

---

## Licencias y derechos

- Las fotos de los 7 estudiantes deben tener **consentimiento escrito** para
  uso publicitario firmado por cada persona.
- Las fotos de tutores idem.
- Los logos de universidades deben usarse respetando los guidelines de marca
  de cada institución (algunos requieren permiso explícito).
- Las portadas de libros académicos pueden requerir permiso del editorial
  original (Cengage, McGraw-Hill, etc.); alternativa segura: composición
  tipográfica con el título sin copiar la tapa real.

---

## Convención de naming

- `kebab-case` para todos los archivos
- Formato al final: `.jpg`, `.webp`, `.svg`, `.png`
- Sin espacios ni caracteres especiales
- Nombres descriptivos y predecibles para que cualquier persona del equipo
  encuentre la imagen sin lista previa

---

*Este README lo actualiza Tori conforme aparecen nuevos mockups que requieren
assets adicionales.*
