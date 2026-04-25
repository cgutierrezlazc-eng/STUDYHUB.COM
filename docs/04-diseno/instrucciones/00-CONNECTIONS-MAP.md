# 00-CONNECTIONS-MAP · Mapa de conexiones entre módulos

```yaml
DOCUMENT_ID:      INDEX.CONNECTIONS_MAP
AUDIENCE:         Claude Code implementing modules
PURPOSE:          Cross-reference of all links, endpoints, and navigation paths
                  between modules of the Conniku product
STATUS:           22 modules registered (01 logo · 02 landing-bundle · 03-21 screens NOT_ITERATED)
DATE_CREATED:     2026-04-19
LAST_UPDATED:     2026-04-19 (batch 20260419-1837)
```

```
MAINTENANCE:
  - This file is updated by the current Tori session when a module closes
  - Every new module adds its connections declared in its .md spec
  - Cristian explicitly declares each connection · Tori does NOT invent
```

---

## CONN.01 · QUÉ ES UNA CONEXIÓN

```
CONNECTION = any point where one module interacts with another or with backend

TYPES:
  - NAV_LINK         internal navigation to another module (e.g. button → /dashboard)
  - API_CALL         HTTP request to backend endpoint
  - WS_CHANNEL       WebSocket channel subscription
  - EVENT            event emitted/listened between modules (if applicable)
  - EXTERNAL_LINK    link to external service (store, social, legal URL)
```

```
RULE:    every button, link, or endpoint call MUST be declared as a connection
RULE:    if the destination is not yet specified by Cristian:
         → mark as PENDING_USER_INSTRUCTION
         → do NOT guess destination
         → do NOT invent endpoint signatures
RULE:    connections are declared in each module's .md file
RULE:    this CONNECTIONS-MAP aggregates them all for cross-reference
```

---

## CONN.02 · MÓDULOS REGISTRADOS

### Módulo 01 · Logo oficial

```yaml
module_id: "00-BRAND-LOGO"
file_design: "Diseno/00-logo-oficial.html"
file_spec:   "Instrucciones/00-BRAND-LOGO.md"
type:        "transversal_asset"
closed_at:   "2026-04-19"
connections:
  - CONNECTION_NAV_BRAND:     PENDING_USER_INSTRUCTION
  - CONNECTION_FOOTER_LOGO:   PENDING_USER_INSTRUCTION
  - CONNECTION_FAVICON:       N/A (static asset · no click target)
  - CONNECTION_APP_STORE_ICON: N/A (static asset · store-managed)
notes:
  - Logo is transversal: consumed by every module via the design system
  - Interactive behavior (click → navigate) depends on context · to be defined
    per consuming module, not per logo
```

### Módulo 02 · Landing bundle (master + 6 onboarding + 9 Business)

```yaml
module_id: "02-LANDING"
type: "screen_module_bundle"
timestamp_batch: "20260419-1650"
closed_at: "2026-04-19"
file_spec: "Instrucciones/02-landing-20260419-1650.md"
files_design:
  master:
    - "Diseno/02-landing-20260419-1650.html"
  onboarding_flow:
    - "Diseno/02-auth-20260419-1650.html"              # paso 1
    - "Diseno/02-verificacion-20260419-1650.html"      # paso 2
    - "Diseno/02-carrera-20260419-1650.html"           # paso 3
    - "Diseno/02-intereses-20260419-1650.html"         # paso 4
    - "Diseno/02-comunidades-20260419-1650.html"       # paso 5
    - "Diseno/02-bienvenida-20260419-1650.html"        # paso 6 (4 hojas verticales)
  business_panel:
    - "Diseno/02-business-personas-20260419-1650.html"
    - "Diseno/02-business-contabilidad-20260419-1650.html"
    - "Diseno/02-business-trabajo-20260419-1650.html"
    - "Diseno/02-business-reclutamiento-20260419-1650.html"
    - "Diseno/02-business-payroll-20260419-1650.html"
    - "Diseno/02-business-crm-20260419-1650.html"
    - "Diseno/02-business-operaciones-20260419-1650.html"
    - "Diseno/02-business-ventas-20260419-1650.html"
    - "Diseno/02-business-inventario-20260419-1650.html"

connections_resolved:
  - landing.crear_cuenta/entrar/hero/pricing → 02-auth (6 CTAs)
  - landing.business_panel_9_cards → 02-business-{slug} (9 NAV_LINK)
  - auth.submit → 02-verificacion
  - auth.google_B_submit → 02-verificacion (post Google OAuth)
  - verificacion.verificar_y_aceptar → 02-carrera
  - carrera.continuar_intereses (JS enable) → 02-intereses (when 3 selects filled)
  - intereses.continuar_comunidades → 02-comunidades (when ≥3 chips)
  - comunidades.btn_next → 02-bienvenida
  - bienvenida sheet-1/2/3 → sheet-2/3/4 (smooth scroll anchors)
  - business-*.back_btn → 02-landing (×9)

connections_pending:
  - bienvenida.btn_primary "Entrar a mi dashboard" → 03-dashboard (PENDING · probable)
  - bienvenida.btn_ghost "Hacer un tour guiado" → PENDING_USER_INSTRUCTION
  - bienvenida.sugg_card CV → 13-cv-editor (PENDING · probable)
  - bienvenida.sugg_card tutor → 10-tutores (PENDING · probable)
  - bienvenida.sugg_card comunidad → PENDING_USER_INSTRUCTION
  - verificacion.skip_link → PENDING_USER_INSTRUCTION
  - carrera.skip_link → PENDING_USER_INSTRUCTION
  - intereses.skip_link → PENDING_USER_INSTRUCTION
  - landing.btn_ver_demo · ci_btn · app_store · google_play · footer_links → PENDING_USER_INSTRUCTION
  - auth.footer_links · store_badges → PENDING_USER_INSTRUCTION

notes:
  - Flujo onboarding 6 pasos navegable end-to-end en Diseno/
  - Google B-flow (paso 1) implementado con toggle JS
  - OTP (paso 2) implementado con timer + paste + auto-focus
  - Bienvenida (paso 6) rediseñada en 4 hojas verticales
  - 5-device expansion PENDING (§RULES.07) · §MODULE.02.11 del spec
  - Ver spec completo en Instrucciones/02-landing-20260419-1650.md
```

### Módulos 03 a 21 · Screens NOT_ITERATED

```yaml
timestamp_batch: "20260419-1837"
status: "NOT_ITERATED · HTML depositado · sin cross-links resueltos · sin personas aplicadas"
note: "cada módulo tiene su propio MD spec en Instrucciones/NN-slug-20260419-1837.md"
note2: "11-classroom excepción · rediseñado + personas aplicadas · marcado PENDING_UPDATE"

modules:
  03-dashboard-estudiante:
    file: "Diseno/03-dashboard-estudiante-20260419-1837.html"
    spec: "Instrucciones/03-dashboard-estudiante-20260419-1837.md"
    role: "Home del estudiante · destino probable del btn-primary de bienvenida"
    route_target: "/dashboard"

  04-biblioteca:
    file: "Diseno/04-biblioteca-20260419-1837.html"
    spec: "Instrucciones/04-biblioteca-20260419-1837.md"
    role: "Catálogo editorial · +70k títulos · chat-biblioteca pendiente"
    route_target: "/biblioteca"

  05-workspaces:
    file: "Diseno/05-workspaces-20260419-1837.html"
    spec: "Instrucciones/05-workspaces-20260419-1837.md"
    role: "Workspaces colaborativos Yjs + Lexical"
    route_target: "/workspace/:id"
    frozen_dependency: "collab_ws.py (V1 legacy · §RULES.12)"

  06-perfil-social:
    file: "Diseno/06-perfil-social-20260419-1837.html"
    spec: "Instrucciones/06-perfil-social-20260419-1837.md"
    role: "Perfil público del estudiante · privacy Ley 19.628"
    route_target: "/perfil/:userId"

  07-chat:
    file: "Diseno/07-chat-20260419-1837.html"
    spec: "Instrucciones/07-chat-20260419-1837.md"
    role: "Chat 1v1 · WS pattern chat_manager"
    route_target: "/chat/:peerId"
    ws_channel: "wss://api/v1/chat/{peer_id}/ws"

  08-configuracion:
    file: "Diseno/08-configuracion-20260419-1837.html"
    spec: "Instrucciones/08-configuracion-20260419-1837.md"
    role: "Settings + historial legal (§RULES.02.2)"
    route_target: "/configuracion"

  09-cursos-diploma:
    file: "Diseno/09-cursos-diploma-20260419-1837.html"
    spec: "Instrucciones/09-cursos-diploma-20260419-1837.md"
    role: "Cursos con diploma Conniku · 6 completados = 30 días Pro"
    route_target: "/cursos"

  10-tutores:
    file: "Diseno/10-tutores-20260419-1837.html"
    spec: "Instrucciones/10-tutores-20260419-1837.md"
    role: "Directorio tutores · pago en custodia · acepta puntos"
    route_target: "/tutores"

  11-classroom:
    file: "Diseno/11-classroom-20260419-1837.html"
    spec: "Instrucciones/11-classroom-20260419-1837.md"
    role: "Clase en vivo 1v1 tutor ↔ estudiante"
    status: "REDESIGNED · marcado PENDING_UPDATE"
    route_target: "/classroom/:classId"
    personas_aplicadas:
      tutor: "PEOPLE.03 Daniela Maturana"
      student: "PEOPLE.06 Pía Cisterna"

  12-oferta-laboral:
    file: "Diseno/12-oferta-laboral-20260419-1837.html"
    spec: "Instrucciones/12-oferta-laboral-20260419-1837.md"
    role: "Bolsa de empleo · aplicación con CV"
    route_target: "/empleo"

  13-cv-editor:
    file: "Diseno/13-cv-editor-20260419-1837.html"
    spec: "Instrucciones/13-cv-editor-20260419-1837.md"
    role: "Editor de CV · export PDF · datos del onboarding"
    route_target: "/cv"

  14-mi-universidad:
    file: "Diseno/14-mi-universidad-20260419-1837.html"
    spec: "Instrucciones/14-mi-universidad-20260419-1837.md"
    role: "Portal U del estudiante · sync SIES/MINEDUC"
    route_target: "/mi-universidad"

  15-gamification:
    file: "Diseno/15-gamification-20260419-1837.html"
    spec: "Instrucciones/15-gamification-20260419-1837.md"
    role: "Puntos · logros · rankings · conexión con cursos y tutores"
    route_target: "/logros"

  16-study-rooms:
    file: "Diseno/16-study-rooms-20260419-1837.html"
    spec: "Instrucciones/16-study-rooms-20260419-1837.md"
    role: "Salas virtuales · video + pizarra + pomodoro"
    route_target: "/salas"

  17-quizzes-flashcards:
    file: "Diseno/17-quizzes-flashcards-20260419-1837.html"
    spec: "Instrucciones/17-quizzes-flashcards-20260419-1837.md"
    role: "Repaso · quizzes + flashcards con spaced repetition"
    route_target: "/repaso"

  18-calendar:
    file: "Diseno/18-calendar-20260419-1837.html"
    spec: "Instrucciones/18-calendar-20260419-1837.md"
    role: "Calendario agregador · clases, entregas, tutorías, comunidades"
    route_target: "/calendario"

  19-workspace-athena:
    file: "Diseno/19-workspace-athena-20260419-1837.html"
    spec: "Instrucciones/19-workspace-athena-20260419-1837.md"
    role: "Variante de workspaces con overlay Athena · experta académica humana (§RULES.01.1)"
    route_target: "/workspace/:id (overlay Athena)"
    frozen_dependency: "konni_engine.py (V1 legacy · §RULES.12) · usar ai_engine.py"

  20-movil-ios-android:
    file: "Diseno/20-movil-ios-android-20260419-1837.html"
    spec: "Instrucciones/20-movil-ios-android-20260419-1837.md"
    role: "Mockups móviles · referencia para expansión 5-device de otros módulos"
    route_target: "N/A (guía)"

  21-tienda-virtual:
    file: "Diseno/21-tienda-virtual-20260419-1837.html"
    spec: "Instrucciones/21-tienda-virtual-20260419-1837.md"
    role: "E-commerce · merchandising, cursos premium, libros, retracto 10d"
    route_target: "/tienda"
```

### Descartados (2026-04-19 · redundantes con módulo 02)

```yaml
- Referencia/25-landing-unificada.html           # variante del landing · redundante con 02-landing
- Referencia/29-flujo-onboarding.html            # onboarding single-file · redundante con 02 pasos 2-6
```

---

## CONN.03 · MAPA CRUZADO (vacío hoy)

```
No hay conexiones inter-módulo registradas aún.
El logo (01) no genera conexiones propias · los módulos futuros que lo usen
declararán sus propias conexiones a partir de él.
```

### Formato futuro de la tabla (cuando haya módulos con conexiones)

Ejemplo hipotético del formato que se usará:

```
| FROM_MODULE | ELEMENT_ID       | CONNECTION_TYPE | TO                              |
|-------------|------------------|-----------------|---------------------------------|
| landing     | btn_register     | NAV_LINK        | /register                       |
| landing     | btn_login        | NAV_LINK        | /login                          |
| register    | form_submit      | API_CALL        | POST /api/v1/auth/register      |
| dashboard   | ws_workspace     | WS_CHANNEL      | wss://api/v1/workspaces/:id     |
| workspace   | btn_export_pdf   | API_CALL        | POST /api/v1/workspaces/:id/pdf |
| footer      | link_terms       | NAV_LINK        | /legal/terms                    |
```

---

## CONN.04 · CONVENCIÓN DE RUTAS (FRONTEND)

Cuando Cristian especifique una ruta frontend, seguir React Router 6 lazy pattern:

```
RULE:    every route is declared in src/App.tsx
RULE:    every page component is lazy imported
RULE:    path format: lowercase · kebab-case · no query params in the declaration

EXAMPLES (hypothetical · waiting for Cristian's spec):
  /                        → Landing
  /register                → Register
  /login                   → Login
  /dashboard               → Dashboard
  /workspace/:id           → Workspace
  /legal/terms             → LegalTerms
  /legal/privacy           → LegalPrivacy
  /payroll                 → HRPayroll
  /onboarding/step-1       → OnboardingStep1
```

```
IMPLEMENTATION pattern in src/App.tsx:

  const Landing = lazy(() => import('./pages/Landing'));
  const Register = lazy(() => import('./pages/Register'));
  // etc.

  <Routes>
    <Route path="/" element={<Suspense fallback={<Skeleton />}><Landing /></Suspense>} />
    <Route path="/register" element={<Suspense fallback={<Skeleton />}><Register /></Suspense>} />
    {/* etc. */}
  </Routes>
```

---

## CONN.05 · CONVENCIÓN DE ENDPOINTS (BACKEND)

Cuando Cristian especifique un endpoint, seguir FastAPI + Pydantic 2 pattern:

```
RULE:    all endpoints versioned under /api/v1/*
RULE:    route files follow <slug>_routes.py naming in backend/
RULE:    Pydantic models use ConfigDict(alias_generator=to_camel) for snake_case ↔ camelCase
RULE:    authenticated endpoints use get_current_user dependency from middleware.py
RULE:    rate-limited endpoints use tier_gate decorator

EXAMPLES (hypothetical · waiting for Cristian's spec):

  POST /api/v1/auth/register
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh
  GET  /api/v1/auth/me

  GET  /api/v1/workspaces
  POST /api/v1/workspaces
  GET  /api/v1/workspaces/{id}
  PATCH /api/v1/workspaces/{id}
  DELETE /api/v1/workspaces/{id}

  POST /api/v1/workspaces/{id}/export/pdf
  POST /api/v1/workspaces/{id}/export/docx

  GET  /api/v1/hr/employees
  POST /api/v1/hr/employees
  GET  /api/v1/hr/payroll/{id}
```

```
IMPLEMENTATION pattern for a new endpoint:

  # backend/mymodule_routes.py
  from fastapi import APIRouter, Depends
  from pydantic import BaseModel, ConfigDict
  from middleware import get_current_user

  router = APIRouter(prefix="/api/v1/mymodule", tags=["mymodule"])

  class MyResponse(BaseModel):
      model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
      some_field: str

  @router.get("/", response_model=MyResponse)
  async def get_something(user = Depends(get_current_user)):
      return MyResponse(some_field="value")
```

---

## CONN.06 · CONVENCIÓN DE WEBSOCKETS

Cuando un módulo use WebSocket, seguir pattern establecido:

```
RULE:    WS route files follow <slug>_ws.py naming
RULE:    authentication: token in query string via websocket_manager.chat_manager.authenticate(ws, token)
RULE:    binary multiplexing for Yjs updates (workspaces)
RULE:    JSON messages for chat and meta events
RULE:    presence with author colors: determinístico from user.id

EXAMPLES (established):

  wss://api/v1/workspaces/{id}/ws?token=...       (workspace collab · Yjs + chat multiplexed)
  wss://api/v1/chat/{peer_id}/ws?token=...        (1v1 chat · from chat_manager)
```

---

## CONN.07 · REGLAS DE CONEXIÓN EXTERNAS

Cuando un módulo linkea fuera del producto (legal, stores, social):

```
ALLOWED external connections:
  - Legal pages (internal but considered external for linking):
      /legal/terms
      /legal/privacy
      /legal/cookies
      /legal/refund
      /legal/acceptable-use
  - App stores:
      App Store (iOS): PENDING_USER_INSTRUCTION (final URL)
      Google Play: PENDING_USER_INSTRUCTION (final URL)
  - Social (if applicable): PENDING_USER_INSTRUCTION
  - Help/Support: PENDING_USER_INSTRUCTION
  - Brand email accounts (mailto):
      mailto:contacto@conniku.com
      mailto:ceo@conniku.com
      mailto:noreply@conniku.com (sending only · not for click-through)
```

```
FORBIDDEN:
  - Competitor platform links
  - Unofficial app stores
  - Tracking pixels from third parties (without explicit approval)
  - Social logins from providers other than Google (Google OAuth is approved)
```

---

## CONN.08 · CÓMO UN MÓDULO DECLARA SUS CONEXIONES

En el archivo `.md` del módulo, incluir sección `CONNECTIONS`:

```markdown
## MODULE.XX · CONNECTIONS

### NAV_LINK
- `btn_hero_register` → `/register`
- `btn_hero_login` → `/login`

### API_CALL
- `form_submit_register` → `POST /api/v1/auth/register`
  request: { email, password, birthDate, ... }
  response: { userId, accessToken, refreshToken }
  errors: { 400, 409, 422 }

### WS_CHANNEL
- (none)

### EXTERNAL_LINK
- `link_footer_terms` → `/legal/terms`
- `link_footer_privacy` → `/legal/privacy`

### PENDING
- `link_app_store` → PENDING_USER_INSTRUCTION (final URL)
- `link_google_play` → PENDING_USER_INSTRUCTION
```

```
RULE:    when a module is closed, Tori updates THIS file (CONNECTIONS-MAP)
         with a summary entry in CONN.02 · pointing to the module's spec
RULE:    detailed connection info lives in each module's spec
RULE:    THIS file is the cross-reference index, not the detailed source
```

---

## CONN.09 · ESTADO DE PENDIENTES

```
PENDING connections (from Module 01 · Logo):
  - CONNECTION_NAV_BRAND           · click on logo in navigation bar → destination?
  - CONNECTION_FOOTER_LOGO         · click on logo in footer → destination?

Likely candidates once Cristian specifies:
  - Default landing route "/"
  - Or homepage depending on auth state
```

```
IF Cristian specifies destinations later
THEN:
  - Update 00-BRAND-LOGO.md LOGO.12 section with actual values
  - Update this file CONN.02 Módulo 01 entry
  - Propagate to every module that consumes the logo
```

---

**END OF CONNECTIONS-MAP.**

`(This file will grow as modules close. Currently only Module 01 registered.)`
