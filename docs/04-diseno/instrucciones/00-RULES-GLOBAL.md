# 00-RULES-GLOBAL · Reglas transversales del proyecto

```yaml
DOCUMENT_ID:      INDEX.RULES_GLOBAL
AUDIENCE:         Claude Code implementing any module
PURPOSE:          Non-negotiable rules that apply to every module
PRECEDENCE:       This file wins over module-specific specs if they conflict
DATE_CREATED:     2026-04-19
```

```
IF any of these rules is violated in implementation
THEN merge is blocked · no exception
```

---

## RULES.01 · COPY Y LENGUAJE

### 1.1 Prohibición absoluta de "IA" / "AI" / "inteligencia artificial"

```
FORBIDDEN in any user-facing text (copy, labels, tooltips, messages, errors, emails, push notifications):
  - "IA"
  - "AI"
  - "inteligencia artificial"
  - "Artificial Intelligence"
```

```
ALLOWED alternatives:
  - "asistente inteligente"
  - "herramientas inteligentes"
  - "estudio inteligente"
  - "automáticamente"
  - "Athena"  (proper name of the academic assistant)
```

```
RULE:    Athena is presented to the user as "experta académica humana"
RULE:    NEVER refer to Athena as AI, chatbot, assistant powered by AI, or similar
RULE:    internal code comments and variable names CAN use "ai_" prefix (backend/ai_engine.py)
         but NEVER expose those labels to the user
```

### 1.2 Tuteo chileno obligatorio

```
REQUIRED in all user-facing copy:
  - "tú" · NOT "vos"
  - "tienes" · NOT "tenés"
  - "quieres" · NOT "querés"
  - "estás" · NOT "estás vos"
  - register: Chilean Spanish · informal but respectful · NO slang closed to Chile
```

```
FORBIDDEN:
  - Argentine voseo (vos, tenés, querés, sabés, estás vos)
  - Spain register (vale, guay, tío)
  - Mexican closed slang (chido, órale) unless scope is Mexico explicitly
```

### 1.3 Prohibido inventar datos

```
FORBIDDEN:
  - hardcoded statistics ("+70k users", "4.9★ rating", "2184 estudiantes")
    unless Cristian provided the exact number and source
  - specific universities listed as "featured" without authorization
  - any price, percentage, date, RUT, or legal figure without verifiable source
```

```
IF a statistic, number, or figure is needed for design purposes
THEN use placeholder text like "[PENDIENTE · dato real requerido]"
     OR leave the section empty with a comment explaining what needs to be filled
```

### 1.4 Prohibido mencionar competencia por nombre

```
FORBIDDEN in user-facing copy:
  - Names of competitor platforms (Moodle, Udemy, Crehana, Canvas, etc.)
  - Direct comparisons "vs X platform"
  - Badmouthing other services
```

```
ALLOWED:
  - Generic problem description ("apps dispersas", "7 contraseñas", "apuntes perdidos")
  - Conniku's value proposition without explicit comparisons
```

---

## RULES.02 · CUMPLIMIENTO LEGAL (CHILE · BASE)

### 2.1 Plataforma exclusiva para adultos 18+

```
REQUIRED at registration:
  - Field: fecha de nacimiento (date input, required)
  - Validation: backend calculates exact age on current date
  - If age < 18: registration rejected with message:
    "Conniku es una plataforma exclusiva para personas mayores de 18 años.
     No podemos procesar tu registro."
  - Field: checkbox with sworn declaration (texto oficial below)
  - Checkbox unchecked by default · form won't submit until checked
```

```
OFFICIAL TEXT OF SWORN DECLARATION (literal · do NOT paraphrase):
"""
Al marcar esta casilla, declaro bajo fe de juramento que:

1. Soy mayor de 18 años a la fecha de este registro.
2. Los datos proporcionados, incluyendo mi fecha de nacimiento, son verdaderos
   y pueden ser verificados por Conniku en cualquier momento.
3. Entiendo que declarar información falsa constituye causal inmediata de
   terminación de mi cuenta, pérdida total de membresía, eliminación de todos
   mis datos, y podrá acarrear responsabilidad civil y penal según la
   legislación vigente.
4. Eximo a Conniku SpA de toda responsabilidad derivada de información falsa
   que yo haya proporcionado.
5. Acepto los Términos y Condiciones del servicio y la Política de Privacidad,
   que he leído y comprendido.
"""
```

```
STORAGE (backend):
  table user_agreements:
    - user_id
    - document_type          (e.g. "age_declaration")
    - document_hash          (SHA-256 of canonical legal text)
    - accepted_at            (timestamp UTC)
    - user_timezone
    - ip_address
    - user_agent             (full browser UA)
  retention: 5 years minimum (legal evidence)
  survives user account deletion
```

### 2.2 Evidencia de lectura legal (NO solo checkbox)

```
REQUIRED for ANY legal document acceptance (T&C, Privacy, Cookies, Age, Refund, DPA):

  1. Visible link to full document next to checkbox
  2. Backend logs each open event:
     - timestamp UTC
     - document version (SHA-256 hash of canonical text)
     - time spent in document (scroll depth OR reading time before close)
     - IP + User-Agent
  3. Checkbox dual state:
     - initial: DISABLED with label "Debes abrir y leer los términos antes de aceptar"
     - enabled: ONLY after backend confirms open event
  4. Checkbox label:
     - NOT "Acepto los Términos"
     - YES "He leído y acepto los Términos"   (word "leído" is legal-critical)
  5. Acceptance ticket:
     - permanent record in user_agreements table
     - includes: user_id, document_type, version_hash, reading_log_id, accepted_at,
       ip, user_agent, timezone
     - survives account deletion for 5 years
  6. User access to their own tickets:
     - /my-profile/legal shows history
     - downloadable PDF of each document as accepted
```

```
COMPONENT to implement in design system:
  <LegalAcceptance
    document={'terms' | 'privacy' | 'age_declaration' | 'refund' | 'dpa' | ...}
    version={string}  // SHA-256 hash
    onAccept={(ticket: AcceptanceTicket) => void}
  />
```

### 2.3 Datos personales · Ley 19.628

```
REQUIRED where personal data is handled:
  - Visible citation near the data collection form
  - Example: "Tus datos se procesan bajo la Ley 19.628 de Protección de Vida Privada"
  - Link to Privacy Policy
  - Explicit consent checkbox (separate from T&C)
```

### 2.4 Consumidor · Ley 19.496

```
REQUIRED on pages involving transactions:
  - Derecho de retracto 10 días (Art. 3bis inc. 2 Ley 19.496) for digital services
  - Visible citation near the refund/cancel CTAs
  - Example: "Puedes ejercer tu derecho de retracto en 10 días corridos según
    Art. 3bis de la Ley 19.496"
```

### 2.5 Citas legales visibles (formato)

```
FORMAT:
  <data_display>
    Retención AFP: 10% del sueldo imponible
    <cite>Según Art. 17 del DL 3500 de 1980</cite>
  </data_display>

STYLE RULES:
  - citation lives adjacent to data · NEVER behind hover or click
  - typography: one tier smaller than main data (if data is 14px, cite is 12px)
  - color: secondary but WCAG AA contrast (min 4.5:1)
  - never placed in tooltips or modals only
  - mobile: keep visible even if typography shrinks
```

---

## RULES.03 · MARCA (LOGO INVIOLABLE)

Ver `00-BRAND-LOGO.md` para spec completa. Resumen de reglas inviolables:

```
INVIOLABLE:
  - u color            == #0D0F10  (ink) · always · no exception
  - dot color          == #FF4A1C  (orange) · always · no exception
  - u-pack background  == #D9FF3A  (lime) · always · no exception
  - palette size       == 4 colors · no additional colors for logo
  - u-pack contains u + dot · never separated
  - wordmark rotation  == 0 degrees · no rotation allowed
  - font_family        == Funnel Display 900 · no substitution
  - final "."          is always present · never omitted
  - aspect_ratio       preserved · no stretch · no skew
```

---

## RULES.04 · HTML AUTOCONTENIDO (en Diseno/)

Ver `00-README.md` sección READ.08. Resumen:

```
REQUIRED for every HTML in Diseno/:
  - All CSS inline in <style> blocks
  - All JavaScript inline in <script> blocks
  - All SVG inline (including logo)
  - Images: base64 embedded OR SVG placeholder (see 00-PEOPLE-AUTHORIZED.md)

ALLOWED external dependency (ONLY ONE):
  - Google Fonts via <link rel="stylesheet">

FORBIDDEN:
  - External CSS files
  - External JS files
  - Image files via relative paths
  - Dependency on folders outside the HTML's location
```

---

## RULES.05 · PERSONAS Y AVATARES

```
FORBIDDEN:
  - Invented names (e.g. "María Pérez", "Juan González", "Estudiante 1")
  - Stock photos not authorized
  - Generic placeholder identities
```

```
REQUIRED:
  - Only persons listed in 00-PEOPLE-AUTHORIZED.md
  - Strict separation between real data (name + photo) and fictional profile
    (university + career + year assigned in mockup context)
  - Fictional attributes are mockup content, NOT biographical claims
```

---

## RULES.06 · CONVENCIONES DE CÓDIGO

### Frontend

```
components:            PascalCase.tsx
hooks:                 useCamelCase.ts
services:              camelCase.ts
types:                 camelCase.types.ts  OR  camelCase.d.ts
css_classes:           kebab-case
css_variables:         --kebab-case  (e.g. --ink, --paper, --bg-primary)
```

### Backend

```
files:                 snake_case.py
classes:               PascalCase
functions:             snake_case
constants:             UPPER_SNAKE_CASE
db_columns:            snake_case
db_tables:             snake_case plural (users, subjects, workspace_documents)
```

### Commits (Conventional Commits)

```
format: <type>(<scope>): <imperative description in Spanish>

types:
  feat       new user-facing feature
  fix        bug fix
  refactor   code reorg without behavior change
  perf       performance improvement
  test       tests only
  docs       documentation only
  style      formatting, no logic change
  build      build system changes
  ci         CI/CD changes
  chore      maintenance
  security   vulnerability patch (generates audit log)
  legal      legal compliance change (requires human approval)

scopes in Conniku:
  hr, payments, auth, mobile, desktop, extension, backend, frontend, db, ws
```

---

## RULES.07 · RESPONSIVIDAD (5 DISPOSITIVOS)

```
REQUIRED per module of screen type:
  5 HTML files in Diseno/ · one per device target:
    - web      (desktop browsers ≥ 1280px)
    - android  (Android phone · 360-480px common)
    - iphone   (iPhone · 375-430px common · notch + home indicator safe areas)
    - tablet   (Android tablet · 768-1024px)
    - ipad     (iPad · 768-1024px · iOS conventions)

  Each HTML is optimized specifically for its device · NOT a responsive
  media-query version. Each has its own layout logic, touch targets,
  typography scale, and native platform conventions.
```

```
DEVICE-SPECIFIC CONVENTIONS:

iOS (iphone + ipad):
  - respect safe-area-inset-top (notch)
  - respect safe-area-inset-bottom (home indicator)
  - no hover states (touch-only)
  - tap targets minimum 44x44px
  - iOS typography scale (SF Pro-like)

Android (android + tablet):
  - material back button considered in layout
  - ripple effects on touch (material convention)
  - tap targets minimum 48x48dp
  - no hover states (touch-only)

Desktop (web):
  - keyboard navigation supported
  - hover states active
  - click targets can be smaller (32px+)
  - mouse-first interactions
```

```
TRANSVERSAL ASSETS (like the logo) do NOT follow the 5-device rule.
They live as a single file in Diseno/ without device suffix.
```

---

## RULES.08 · ACCESIBILIDAD (WCAG AA)

```
REQUIRED in every module:
  - Color contrast text vs background ≥ 4.5:1 (normal text)
  - Color contrast text vs background ≥ 3:1 (large text ≥ 18px or ≥ 14px bold)
  - Color contrast UI components ≥ 3:1
  - All interactive elements keyboard-reachable
  - All interactive elements have visible focus state
  - All <img> have alt text (or alt="" for decorative)
  - All <button> and <a> have accessible name (text or aria-label)
  - All forms have <label for> associated
  - Respect prefers-reduced-motion:
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.01ms !important; ... }
      }
  - Minimum tap targets 44x44px on touch devices
```

---

## RULES.09 · SEGURIDAD

```
REQUIRED:
  - JWT tokens in localStorage (already established pattern)
  - No credentials in frontend code
  - No API keys in frontend code
  - CSRF protection on state-changing endpoints
  - Rate limiting via tier_gate.py on expensive endpoints
  - Input sanitization (bleach for HTML, Pydantic for JSON)
  - SSRF defense on any endpoint that fetches URLs (bleach + allowlist)
  - Webhook signature validation (MercadoPago, PayPal)
  - Never log full JWT tokens
  - Never log password fields
  - PII encrypted at rest (via Supabase encryption)
```

---

## RULES.10 · PERFORMANCE (OBJETIVOS)

```
TARGETS (not hard requirements but aspirational):
  - Lighthouse Performance    ≥ 85 desktop
  - Lighthouse Performance    ≥ 70 mobile
  - Lighthouse Accessibility  ≥ 95
  - Lighthouse Best Practices ≥ 90
  - Lighthouse SEO            ≥ 90
  - LCP (Largest Contentful Paint)  < 2.5s
  - FID (First Input Delay)         < 100ms
  - CLS (Cumulative Layout Shift)   < 0.1
  - Bundle initial  < 300 KB gzipped
```

---

## RULES.11 · TESTING OBLIGATORIO

```
REQUIRED per module implementation:
  - Unit tests for pure logic (vitest for frontend, pytest for backend)
  - Component tests for React components (@testing-library/react)
  - Integration tests for endpoints (fastapi.testclient)
  - Coverage target ≥ 70% for new code

PATTERN per module:
  - Frontend:  src/pages/MyModule.tsx + src/pages/__tests__/MyModule.test.tsx
  - Backend:   backend/mymodule_routes.py + backend/tests/test_mymodule_routes.py
```

---

## RULES.12 · ARCHIVOS FROZEN

```
BEFORE editing any file, check .claude/frozen-files.txt

FROZEN files currently include (non-exhaustive · check the file):
  - hr_routes.py + HR-related endpoints (53 endpoints legal-heavy)
  - collab_ws.py (V1 WebSocket · protected during V2)
  - konni_engine.py (IA wrapper)
  - Bloque 1 legal files (age_declaration hash, user_agreements table)
  - tier_gate.py null-safety guards

IF a module requires editing a frozen file
THEN:
  1. Request unfreeze from Cristian with explicit reason
  2. Wait for approval
  3. Edit only under /unfreeze mode
  4. Return to frozen state after edit
```

---

## RULES.13 · NO INICIATIVA PROPIA (para el implementador)

```
IF during implementation you find:
  - Ambiguity in the spec        → mark PENDING_USER_INSTRUCTION · ask Cristian
  - Missing connection target    → mark PENDING · do NOT invent
  - Missing data                 → leave placeholder · do NOT fabricate
  - Opportunity for "improvement" not in spec → propose · do NOT implement
  - Conflict between rules       → stop · report to Cristian
```

```
Cero iniciativa = implementar exactamente lo especificado · nada más, nada menos
```

---

## RULES.14 · PRECEDENCIA DE REGLAS

```
IF any conflict occurs between:
  1. 00-RULES-GLOBAL.md (this file)
  2. 00-BRAND-LOGO.md
  3. Module-specific MD (NN-*)

THEN priority order:
  00-RULES-GLOBAL > 00-BRAND-LOGO > Module spec
```

```
Example:
  - Module spec says "rotate logo -3° for editorial effect"
  - RULES-GLOBAL says "logo rotation == 0 · INVIOLABLE"
  → RULES-GLOBAL wins · do NOT rotate logo
```

---

**END OF RULES-GLOBAL. Next: read 00-BRAND-LOGO.md**
