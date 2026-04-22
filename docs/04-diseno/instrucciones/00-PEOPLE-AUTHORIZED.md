# 00-PEOPLE-AUTHORIZED · Catálogo de personas autorizadas para avatares

```yaml
DOCUMENT_ID:      INDEX.PEOPLE_AUTHORIZED
AUDIENCE:         Claude Code implementing modules with avatars, names, or testimonials
PURPOSE:          Sole source of identities usable in mockups and UI
PRECEDENCE:       If a module mockup shows a face or name, it MUST be from this list
DATE_CREATED:     2026-04-19
```

---

## PEOPLE.01 · REGLA DURA

```
FORBIDDEN:
  - Invented names (e.g. "María Pérez", "Juan González", "Estudiante 1")
  - Stock photos from any source
  - AI-generated faces
  - Random avatar generators
  - Placeholder names like "Usuario Demo"

REQUIRED:
  - Any face, name, or identity shown in UI MUST be from this catalog
  - Real name used as authorized (field `nombre_autorizado`)
  - Real photo used as provided (field `foto`)
  - Fictional profile attributes (university, career) are mockup content
    ONLY · never biographical claims about the real person
```

---

## PEOPLE.02 · SEPARACIÓN DATO REAL vs. PERFIL FICTICIO

```
EVERY entry has two layers:

LAYER 1 · REAL DATA (authorized)
  - nombre_completo        (real name, authorized by the person)
  - foto                   (real photo, authorized by the person)

LAYER 2 · FICTIONAL PROFILE (assigned for mockup context ONLY)
  - universidad_ficticia   (university name used in mockup context)
  - carrera_ficticia       (career used in mockup context)
  - año_academico_ficticio (year used in mockup context)

RULE:    Layer 1 is biographical fact · must be respected
RULE:    Layer 2 is mockup content · does NOT assert anything about the real person
RULE:    NEVER present Layer 2 as biographical truth to the user
```

---

## PEOPLE.03 · CATÁLOGO (7 personas · 2026-04-19)

### 01 · Jennifer Ruiz Babin

```yaml
id: 01
nombre_real: Jennifer Ruiz Babin
nombre_autorizado_display: Jennifer Ruiz Babin
foto_path: assets/people/jennifer-ruiz-babin.png
foto_status: DEPOSITED (2026-04-19)

perfil_ficticio:
  universidad: Universidad San Sebastián (USS)
  carrera: Ingeniería en Gestión Logística
  año_academico: PENDING_USER_INSTRUCTION
```

### 02 · Victoria Navarro Pacheco

```yaml
id: 02
nombre_real: Victoria Navarro Pacheco
nombre_autorizado_display: Victoria Navarro Pacheco
foto_path: assets/people/victoria-navarro-pacheco.jpg
foto_status: DEPOSITED (2026-04-19)

perfil_ficticio:
  universidad: Universidad del Alba
  carrera: Ingeniería Comercial
  año_academico: PENDING_USER_INSTRUCTION
```

### 03 · Daniela Maturana

```yaml
id: 03
nombre_real: Daniela Maturana
nombre_autorizado_display: Daniela Maturana
foto_path: assets/people/daniela-maturana.jpg
foto_status: DEPOSITED (2026-04-19)

perfil_ficticio:
  universidad: Universidad del Alba
  carrera: Ingeniería Comercial
  año_academico: PENDING_USER_INSTRUCTION
```

### 04 · Felipe Gatica

```yaml
id: 04
nombre_real: Felipe Gatica
nombre_autorizado_display: Felipe Gatica
foto_path: assets/people/felipe-gatica.png
foto_status: DEPOSITED (2026-04-19)
foto_notes: original foto is black & white · treat as stylistic choice

perfil_ficticio:
  universidad: Universidad del Alba
  carrera: Ingeniería Comercial
  año_academico: PENDING_USER_INSTRUCTION
```

### 05 · Cristian Gutiérrez

```yaml
id: 05
nombre_real: Cristian Gutiérrez
nombre_autorizado_display: Cristian Gutiérrez
foto_path: assets/people/cristian-gutierrez.jpg
foto_status: DEPOSITED (2026-04-19)

perfil_ficticio:
  universidad: Universidad del Alba
  carrera: Ingeniería Comercial
  año_academico: PENDING_USER_INSTRUCTION

# CRITICAL NOTE:
# In the mockup catalog, Cristian is represented AS a fictional student
# (Universidad del Alba · Ingeniería Comercial).
# His REAL role (CEO of Conniku SpA, project founder, sole approver) is
# NOT the context for avatar use in mockups.
# DO NOT display "CEO" next to his avatar in a mockup.
# His real role lives in project documentation (CLAUDE.md) · not here.
```

### 06 · Pia Cisterna

```yaml
id: 06
nombre_real: Pia Cisterna
nombre_autorizado_display: Pia Cisterna
foto_path: assets/people/pia-cisternas.jpg
foto_status: DEPOSITED (2026-04-19)

perfil_ficticio:
  universidad: Universidad del Alba
  carrera: Ingeniería Comercial
  año_academico: PENDING_USER_INSTRUCTION
```

### 07 · Barbara Escalona

```yaml
id: 07
nombre_real: Barbara Escalona
nombre_autorizado_display: Barbara Escalona
foto_path: assets/people/barbara-escalona.jpg
foto_status: DEPOSITED (2026-04-19)
foto_notes: use individual photo · NOT the group photo from earlier version

perfil_ficticio:
  universidad: Universidad del Alba
  carrera: Ingeniería Comercial
  año_academico: PENDING_USER_INSTRUCTION
```

---

## PEOPLE.04 · DISTRIBUCIÓN DE PERFILES FICTICIOS

```
Perfil: Universidad del Alba · Ingeniería Comercial
  → 6 personas: Victoria, Daniela, Felipe, Cristian, Pía, Barbara

Perfil: Universidad San Sebastián (USS) · Ingeniería en Gestión Logística
  → 1 persona: Jennifer
```

```
RULE:    when a mockup needs multiple students from the same university/career,
         pick from the group of 6 (Ing. Comercial · U del Alba)
RULE:    when a mockup needs a logistics profile, use Jennifer
RULE:    do NOT assign a person a different university/career than listed above
```

---

## PEOPLE.05 · MANEJO DE FOTOS

### Estado actual

```
Todas las fotos: PENDING_DEPOSIT_BY_CRISTIAN
```

Cristian depositará las 7 fotos manualmente en el proyecto cuando estén
listas. Hasta entonces:

### Placeholder transitorio (en mockups de Diseno/)

Mientras una foto esté pendiente de depósito, usar SVG placeholder inline:

```html
<!-- Placeholder autocontenido · sin dependencia externa -->
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Jennifer Ruiz Babin">
  <rect width="64" height="64" rx="32" fill="#D9FF3A"/>
  <text x="32" y="40" text-anchor="middle" font-family="Funnel Display, sans-serif"
        font-weight="900" font-size="22" fill="#0D0F10">JR</text>
</svg>
```

```
PLACEHOLDER RULES:
  - Circular shape (rx = width/2)
  - Background: color asignado por persona (ver tabla abajo)
  - Initials: 2 letras · mayúscula · Funnel Display 900 · color ink (#0D0F10)
  - Font size: ~40% of width
  - aria-label: nombre real completo (accessibility)
```

### Colores asignados para placeholder (consistente entre mockups)

| person_id | initials | placeholder_bg       | text_color     |
|-----------|----------|----------------------|----------------|
| 01 · Jennifer Ruiz Babin | JR | `#D9FF3A` (lime)      | `#0D0F10` (ink) |
| 02 · Victoria Navarro    | VN | `#FFE9B8` (cream)     | `#0D0F10`       |
| 03 · Daniela Maturana    | DM | `#FF4D3A` (pink)      | `#F5F4EF` (paper) |
| 04 · Felipe Gatica       | FG | `#00C2FF` (cyan)      | `#0D0F10`       |
| 05 · Cristian Gutiérrez  | CG | `#6B4EFF` (violet)    | `#F5F4EF`       |
| 06 · Pia Cisterna        | PC | `#C9B581` (sand)      | `#0D0F10`       |
| 07 · Barbara Escalona    | BE | `#FF7A6F` (coral)     | `#0D0F10`       |

### Cuando las fotos estén disponibles (futuro)

```
METHOD 1 · Base64 embedded (preferred for HTML autocontenido):
  <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..." alt="Jennifer Ruiz Babin" />

METHOD 2 · Referenced path (for the real project, not Diseno/):
  <img src="/assets/people/jennifer-ruiz-babin.jpg" alt="Jennifer Ruiz Babin" />

RULE in Diseno/ HTML:          base64 embedded · maintains autocontenido
RULE in React project:         reference path as imported asset
```

---

## PEOPLE.06 · USO EN COMPONENTES REACT (para el proyecto real)

### Componente Avatar propuesto

```typescript
// src/design-system/Avatar.tsx
interface AvatarProps {
  personId: '01' | '02' | '03' | '04' | '05' | '06' | '07';
  size?: number; // px · default 40
  className?: string;
}

// Renderiza foto real si está disponible · fallback a SVG placeholder
export function Avatar({ personId, size = 40, className }: AvatarProps) {
  const person = PEOPLE[personId];
  // ... render logic
}
```

### Registro de personas en código

```typescript
// src/design-system/people.ts
export const PEOPLE = {
  '01': {
    displayName: 'Jennifer Ruiz Babin',
    photoPath: '/assets/people/jennifer-ruiz-babin.jpg',
    initials: 'JR',
    placeholderBg: '#D9FF3A',
    placeholderText: '#0D0F10',
  },
  '02': {
    displayName: 'Victoria Navarro Pacheco',
    photoPath: '/assets/people/victoria-navarro-pacheco.jpg',
    initials: 'VN',
    placeholderBg: '#FFE9B8',
    placeholderText: '#0D0F10',
  },
  // ... resto
} as const;
```

```
RULE:    PEOPLE constant is the single source of truth in code
RULE:    Avatar component always reads from PEOPLE constant · no hardcoded names
RULE:    IF a photo is missing at runtime · render placeholder SVG with same visual system
```

---

## PEOPLE.07 · AGREGAR PERSONAS NUEVAS

```
IF Cristian authorizes a new person
THEN:
  1. Cristian provides: nombre real, foto, perfil ficticio (uni + carrera)
  2. Assign next available id (08, 09, ...)
  3. Assign next available color from Conniku palette for placeholder
  4. Update 00-PEOPLE-AUTHORIZED.md with full entry
  5. Update src/design-system/people.ts (if project code already exists)
  6. Deposit photo at assets/people/<slug>.jpg (kebab-case, sin acentos)

SLUG FORMAT:  nombre-apellidos-sin-acentos-ni-ñ (lowercase kebab-case)
  Example: "Pía Ramírez Gómez" → "pia-ramirez-gomez"
```

---

## PEOPLE.08 · CASOS PROHIBIDOS

```
FORBIDDEN implementations:

1. Rendering a name from this catalog with fabricated university/career:
   ❌ <Avatar personId="03" /> con texto "Daniela Maturana · Medicina · UC"
   ✅ <Avatar personId="03" /> con texto "Daniela Maturana · Ing. Comercial · U del Alba"

2. Rendering Cristian with "CEO" label in a mockup:
   ❌ <Avatar personId="05" /> con label "Cristian Gutiérrez · CEO Conniku SpA"
   ✅ <Avatar personId="05" /> con label "Cristian Gutiérrez · Ing. Comercial · U del Alba"

3. Using a stock photo or generated avatar:
   ❌ <img src="https://i.pravatar.cc/150" />
   ❌ <img src="stock-student.jpg" />
   ✅ <Avatar personId="01" /> (from authorized catalog)

4. Inventing a name for a filler avatar:
   ❌ <Avatar name="Estudiante 1" />
   ❌ <div>María González · comentó hace 2h</div>
   ✅ <Avatar personId="02" /> + <div>Victoria Navarro · comentó hace 2h</div>

5. Using a person outside authorized contexts:
   ❌ <Avatar personId="06" /> with label "CEO Conniku" (forbidden attribution)
   ❌ <Avatar personId="01" /> with label "Coach de productividad" (not in catalog)
```

---

## PEOPLE.09 · QUÉ HACER SI SE NECESITA UNA PERSONA QUE NO ESTÁ EN EL CATÁLOGO

```
IF a mockup requires an avatar for a context where no catalog person fits
  (e.g. a tutor profile, a moderator, a specific role not yet authorized)

THEN:
  1. Stop implementation of that element
  2. Request new person authorization from Cristian via:
     CONNECTION_REQUEST: new_authorized_person
     CONTEXT: <module name and role needed>
  3. Wait for Cristian to:
     - Provide real name + photo of authorized person
     - Confirm fictional profile for the role
  4. Resume implementation only after catalog is updated
```

---

**END OF PEOPLE-AUTHORIZED. Next: read 00-CONNECTIONS-MAP.md**
