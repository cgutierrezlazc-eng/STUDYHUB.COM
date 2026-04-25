# 00-README · Puerta de entrada del paquete

```yaml
DOCUMENT_ID:      INDEX.README
AUDIENCE:         Claude Code implementing the Conniku product UI
PURPOSE:          First file to read when receiving this package
PACKAGE_OWNER:    Cristian Gutiérrez Lazcano
PACKAGE_ROOT:     /Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Instrucciones/
PAIRED_ASSETS:    /Users/cristiang./Desktop/CONNIKU UPDATE DISENO/Diseno/
DATE_CREATED:     2026-04-19
```

---

## READ.01 · QUÉ ES ESTE PAQUETE

Set de instrucciones técnicas para implementar módulos visuales del
producto Conniku en el proyecto real. Cada módulo tiene:

- Un archivo `.md` en `Instrucciones/` (este directorio) con especificación
  técnica en formato Claude Code estricto
- Uno o varios archivos `.html` en `../Diseno/` con la implementación
  visual de referencia (autocontenidos, abribles en cualquier navegador)

El objetivo es que otro Claude Code pueda leer esta carpeta y replicar
cada módulo en el proyecto real sin ambigüedad, sin pérdida de contexto,
sin decisiones discrecionales.

---

## READ.02 · ORDEN DE LECTURA OBLIGATORIO

Leer estos archivos en este orden **antes** de tocar cualquier módulo:

```
1.  00-README.md              (este archivo · mapa general)
2.  00-STACK.md               (stack técnico del proyecto · tecnologías y versiones)
3.  00-RULES-GLOBAL.md        (reglas transversales · prohibiciones, cumplimiento legal, convenciones)
4.  00-BRAND-LOGO.md          (spec del logo oficial · regla inviolable de marca)
5.  00-PEOPLE-AUTHORIZED.md   (personas autorizadas para avatares · NO inventar identidades)
6.  00-CONNECTIONS-MAP.md     (mapa de conexiones entre módulos · paths, endpoints, links)
7.  NN-[modulo]-*.md          (los módulos numerados · uno por feature/pantalla)
```

```
IF any 00-* file is missing THEN stop · report to Cristian · do not implement
IF ambiguity is found in any section THEN mark as PENDING_USER_INSTRUCTION · do not guess
```

---

## READ.03 · ESTRUCTURA DEL PAQUETE

```
CONNIKU UPDATE DISENO/
├── Diseno/                              (visual reference · HTML files autocontained)
│   ├── 00-logo-oficial.html             (transversal asset · used by all modules)
│   └── NN-[modulo]-YYYYMMDD-HHMM-[device].html
│
├── Instrucciones/                       (THIS directory · Claude Code specs)
│   ├── 00-README.md                     (you are here)
│   ├── 00-STACK.md
│   ├── 00-RULES-GLOBAL.md
│   ├── 00-BRAND-LOGO.md
│   ├── 00-PEOPLE-AUTHORIZED.md
│   ├── 00-CONNECTIONS-MAP.md
│   └── NN-[modulo]-YYYYMMDD-HHMM.md
│
├── Referencia/                          (owned by Cristian · DO NOT READ without explicit instruction)
└── LEER/                                (owned by Tori · internal context · IGNORE)
```

```
RULE:    files prefixed 00-* are transversal · global scope · apply to every module
RULE:    files prefixed NN-* (01, 02, 03...) are module-specific · numbered by closure order
RULE:    Diseno/ is visual reference · NOT the source of implementation truth
RULE:    Instrucciones/ is the source of implementation truth · always
RULE:    do NOT read Referencia/ or LEER/ unless Cristian indicates otherwise
```

---

## READ.04 · CÓMO SE COMPONE UN MÓDULO

Un módulo es una unidad de entrega completa. Puede ser:

### Tipo A · Módulo de 1 HTML (sin enlaces internos)

Ejemplo: logo oficial (documento de spec, no linkea a otras pantallas).

```
Diseno/        → 00-logo-oficial.html                (1 archivo)
Instrucciones/ → 00-BRAND-LOGO.md                    (1 archivo)
```

### Tipo B · Módulo de varios HTML (con enlaces internos)

Ejemplo hipotético: onboarding con múltiples pasos navegables.

```
Diseno/        → 02-onboarding-YYYYMMDD-HHMM-web.html       (HTML madre)
                 02-onboarding-YYYYMMDD-HHMM-android.html
                 02-onboarding-YYYYMMDD-HHMM-iphone.html
                 02-onboarding-YYYYMMDD-HHMM-tablet.html
                 02-onboarding-YYYYMMDD-HHMM-ipad.html
                 [HTMLs hijos nombrados según convención definida caso por caso]
Instrucciones/ → 02-onboarding-YYYYMMDD-HHMM.md              (1 md cubre el módulo completo)
```

```
RULE:    a module is closed when ALL its HTML files are ready
RULE:    one module = one .md file in Instrucciones/ covering all its HTMLs
RULE:    every module of "product screen" type has 5 device variants in Diseno/
RULE:    transversal assets (like the logo) do not follow the 5-device rule
```

### Variantes por dispositivo (para módulos de pantalla)

Cada módulo de pantalla de producto tiene 5 archivos HTML en `Diseno/`, uno
por dispositivo. No usar media queries para simular responsive: cada archivo
está optimizado específicamente para su dispositivo, con sus propias
convenciones nativas (safe areas iOS, back button Android, etc.).

| Sufijo      | Target                                      |
|-------------|---------------------------------------------|
| `-web`      | Desktop · navegadores modernos              |
| `-android`  | Android phone · Material, back button       |
| `-iphone`   | iPhone · notch, home indicator, safe areas  |
| `-tablet`   | Android tablet                              |
| `-ipad`     | iPad · split view consideraciones           |

---

## READ.05 · CONVENCIONES DE NOMBRES

### En `Diseno/`

```
Transversal asset:    00-[nombre].html                         (sin fecha, sin device)
Module screen:        NN-[slug]-YYYYMMDD-HHMM-[device].html
```

Ejemplos:
```
00-logo-oficial.html
02-landing-20260419-1745-web.html
02-landing-20260419-1745-android.html
```

### En `Instrucciones/`

```
Transversal doc:      00-[NAME].md                            (convención libre del mantenedor)
Module spec:          NN-[slug]-YYYYMMDD-HHMM.md              (mismo slug y fecha que su HTML)
```

Ejemplos:
```
00-README.md
00-STACK.md
00-BRAND-LOGO.md
02-landing-20260419-1745.md
```

### Formato de fecha/hora

```
YYYYMMDD-HHMM    (ISO 8601 compacto)
Example:  20260419-1745   = 19 April 2026, 17:45
Sortable alphabetically · unambiguous across locales · 24h
```

---

## READ.06 · REGLA DE UPDATES A MÓDULOS CERRADOS

```
IF a closed module needs to be updated
THEN:
  1. Delete old HTML and MD files
  2. Create new files with new YYYYMMDD-HHMM timestamp
  3. Only ONE version exists in Diseno/ and Instrucciones/ at any time
  4. Historical changelog lives in LEER/CONTEXT.md (Tori's internal log · not for you to read)
```

No creamos carpetas `_archive`, `_deprecated`, `_drafts`. Los módulos
cerrados viven en una sola versión oficial.

---

## READ.07 · REGLA DE CONEXIONES

```
CONNECTION = a link, navigation, endpoint, or integration point between elements
```

```
IF a module has buttons, links, or endpoints
THEN:
  - Each connection is declared in the module's .md file
  - Format:  CONNECTION_[ID]: destination_path_or_endpoint
  - If the destination is not yet specified by Cristian:
      mark as PENDING_USER_INSTRUCTION
  - DO NOT invent destinations
  - DO NOT guess endpoints based on context
```

El archivo `00-CONNECTIONS-MAP.md` consolida el mapa cruzado entre todos
los módulos. Consultarlo cuando un módulo dependa de otro.

---

## READ.08 · HTML AUTOCONTENIDO

Cada HTML de `Diseno/` es autosuficiente:

```
ALLOWED externally:
  - Google Fonts via <link rel="stylesheet" href="https://fonts.googleapis.com/...">

INLINE (inside the HTML file):
  - All CSS in <style> blocks
  - All JavaScript in <script> blocks
  - All SVG (including logo) inline
  - Images: use base64 embedded OR SVG placeholder (see 00-PEOPLE-AUTHORIZED.md)

NOT ALLOWED:
  - External CSS files
  - External JS files
  - External image files via relative paths
  - Any dependency on folders outside the HTML's location
```

Razón: cada HTML debe poder abrirse, moverse, enviarse por email o subirse
a un servicio sin romperse.

---

## READ.09 · RELACIÓN CON STACK TÉCNICO

El stack del proyecto real está documentado en `00-STACK.md`. El MD de cada
módulo incluye:

- **Path absoluto** del archivo TSX a crear en el proyecto
- **Componente React + TypeScript** completo con interface de props
- **Tokens CSS** a declarar en variables CSS custom properties
- **Imports exactos** (`from 'lucide-react'`, `from 'react-router-dom'`, etc.)
- **Services existentes** a conectar (`useAuth()`, `api.get()`, etc.)
- **Rutas** a registrar en `src/App.tsx` (React Router 6 lazy-loaded)

El HTML de `Diseno/` es la **referencia visual** · no es el código a copiar
literalmente. El código a copiar vive en el MD.

---

## READ.10 · CUMPLIMIENTO LEGAL

Ver `00-RULES-GLOBAL.md` · sección legal. Resumen:

- Prohibido mencionar "IA", "AI", "inteligencia artificial" en copy visible
- Tuteo chileno obligatorio (tú, no vos)
- 18+ obligatorio con declaración jurada · texto literal en cada MD de módulo con ese requisito
- Ley 19.628 (protección de datos) y Ley 19.496 (consumidor) citadas donde apliquen
- Evidencia de lectura legal registrada (no solo checkbox · ver regla en 00-RULES-GLOBAL)

---

## READ.11 · QUÉ HACER SI HAY DUDA

```
IF any detail is ambiguous                     THEN mark as PENDING_USER_INSTRUCTION
IF any required file is missing                THEN stop implementation · report to Cristian
IF any connection destination is not specified THEN leave as PENDING · do NOT invent
IF any rule in 00-RULES-GLOBAL contradicts a module spec  THEN 00-RULES-GLOBAL wins
IF the logo spec (00-BRAND-LOGO) contradicts a module spec THEN 00-BRAND-LOGO wins
IF any face/name/identity in a mockup is not in 00-PEOPLE-AUTHORIZED  THEN stop · do NOT invent
```

---

## READ.12 · APROBADOR ÚNICO

```
Cristian Gutiérrez Lazcano
Role:  Project founder · sole authority on all design and legal decisions
Contact: per internal project channels (not documented here)
```

Cualquier decisión estructural, cualquier cambio a reglas, cualquier nueva
persona en el catálogo de avatares, cualquier cambio al logo oficial
requiere aprobación explícita suya.

---

**END OF README. Next: read 00-STACK.md**
