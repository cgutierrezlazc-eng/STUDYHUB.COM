# 00-STACK · Stack técnico del proyecto Conniku

```yaml
DOCUMENT_ID:      INDEX.STACK
AUDIENCE:         Claude Code implementing modules
PURPOSE:          Single source of truth for technology stack · target the real project
DATE_CREATED:     2026-04-19
SOURCE:           Provided by Cristian · 2026-04-19
```

---

## STACK.01 · FRONTEND

### Lenguaje + Bundler

| key            | value                                                  |
|----------------|--------------------------------------------------------|
| `language`     | TypeScript 5                                           |
| `runtime_ui`   | React 18                                               |
| `bundler`      | Vite 5                                                 |
| `routing`      | React Router 6 · SPA with lazy-loaded pages            |

### UI y estilos

| key                | value                                                       |
|--------------------|-------------------------------------------------------------|
| `styling_approach` | CSS variables semánticas puras · NO Tailwind · NO styled-components · NO CSS-in-JS |
| `css_tokens`       | `--bg-primary`, `--accent`, `--text-primary`, `--border-subtle` (existentes) · extender con `--ink`, `--lime`, `--orange`, `--paper` del sistema nuevo |
| `themes`           | 6 temas existentes (light/dark + variantes)                |
| `icons`            | Lucide React (SVG) para icons reutilizables                |
| `icons_custom`     | SVG inline cuando el icono es específico del diseño nuevo  |

### Tipografías

| tipo          | fuente                | uso                                                  |
|---------------|----------------------|------------------------------------------------------|
| Body legacy   | Inter                | body actual del proyecto                             |
| Serif editor  | Fraunces             | editor Lexical (Workspaces)                          |
| Mono legacy   | JetBrains Mono       | code y metadata legacy                               |
| **Display**   | **Funnel Display**   | **sistema nuevo · headers, botones, wordmark, hero** |
| **Mono new**  | **Geist Mono**       | **sistema nuevo · kickers, tokens, metadata técnica**|

```
RULE:    las tipografías nuevas (Funnel Display + Geist Mono) son del sistema de diseño nuevo
RULE:    no están aplicadas al proyecto real aún · este handoff las introduce progresivamente
RULE:    cargar via Google Fonts vía <link> en index.html del proyecto
```

### Editor y colaboración (Bloque 2 Workspaces · específico)

| key                  | value                                                          |
|----------------------|----------------------------------------------------------------|
| `editor_engine`      | Lexical 0.21 (Meta/Facebook)                                   |
| `editor_react`       | `@lexical/react` · LexicalComposer, RichTextPlugin, HistoryPlugin, ListPlugin, LinkPlugin, OnChangePlugin, AutoFocusPlugin, LexicalErrorBoundary, CollaborationPlugin |
| `crdt`               | Yjs 13.6                                                       |
| `crdt_lexical_bind`  | `@lexical/yjs`                                                 |
| `transport`          | y-websocket 3                                                  |
| `offline_persistence`| y-indexeddb 9                                                  |
| `math_render`        | KaTeX 0.16 (inline + block)                                    |
| `legacy_editor`      | `@tiptap/extension-collaboration` + y-prosemirror (heredado V1, coexiste) |

### Servicios cliente

| key                    | value                                                       |
|------------------------|-------------------------------------------------------------|
| `http_client`          | Fetch API nativo · wrappers en `src/services/api.ts`, `workspacesApi.ts`, `auth.tsx` |
| `jwt_storage`          | localStorage · access + refresh tokens                      |
| `offline_storage`      | IndexedDB vía y-indexeddb (solo workspaces colab)           |
| `pwa`                  | Service Worker registered                                   |
| `push_notifications`   | Firebase Cloud Messaging                                    |

### Estado

| key              | value                                                  |
|------------------|--------------------------------------------------------|
| `state_strategy` | React Context + hooks locales (useState, useReducer)   |
| `no_libs`        | NO Redux, NO Zustand, NO MobX                          |
| `auth_state`     | `AuthContext` en `src/services/auth.tsx`               |
| `i18n`           | Context custom en `src/services/i18n.tsx` · es/en/pt   |

---

## STACK.02 · BACKEND

### Lenguaje + Framework

| key            | value                                                   |
|----------------|---------------------------------------------------------|
| `language`     | Python 3.11                                             |
| `framework`    | FastAPI + Uvicorn (ASGI)                                |
| `orm`          | SQLAlchemy 2.x · patrón clásico `declarative_base()` (sin `mapped_column()` por deuda técnica) |
| `validation`   | Pydantic 2 · `ConfigDict(alias_generator=to_camel)` para snake_case ↔ camelCase automático |

### Patrón de rutas

```
backend/
  ├── auth_routes.py            (registro, login, Google OAuth, refresh, update profile)
  ├── hr_routes.py              (FROZEN · 53 endpoints · 3 PDFs legales)
  ├── course_routes.py          (cursos, quizzes)
  ├── collab_routes.py          (V1 legacy · en retiro)
  ├── collab_ws.py              (FROZEN · WebSocket V1)
  ├── workspaces_routes.py      (V2 REST · 27+ endpoints)
  ├── workspaces_ws.py          (V2 WebSocket · Yjs relay + chat multiplexado)
  ├── workspaces_athena.py      (8 endpoints Athena IA)
  ├── workspaces_export.py      (PDF/DOCX export)
  ├── mercadopago_routes.py
  ├── paypal_routes.py
  ├── payment_routes.py         (Stripe legacy · comentado)
  ├── ads_routes.py
  ├── tutor_contract.py
  ├── payroll_calculator.py
  └── user_routes.py
```

### Middleware + seguridad

| key              | value                                                         |
|------------------|---------------------------------------------------------------|
| `jwt_lib`        | python-jose · HS256                                           |
| `jwt_middleware` | `middleware.py` · `get_current_user`, `decode_token`          |
| `rate_limit`     | `tier_gate.py` · tabla `UserFeatureUsage` · reset 6:00 AM Chile |
| `ws_auth`        | `websocket_manager.py` · `chat_manager.authenticate(ws, token)` (token en query string) |

### Integraciones IA (FROZEN)

| key              | value                                                     |
|------------------|-----------------------------------------------------------|
| `llm_sdk`        | anthropic (SDK oficial)                                   |
| `fallback_sdk`   | openai (embeddings fallback)                              |
| `wrapper`        | `konni_engine.py` · `call_konni(system, messages)` · MAX_TOKENS=1024 |
| `model`          | `claude-haiku-4-5-20251001`                               |
| `status`         | FROZEN · no modificar el wrapper                          |

### Export documentos

| key              | value                                                       |
|------------------|-------------------------------------------------------------|
| `pdf`            | WeasyPrint 62 · requiere `libcairo2` + `libpango` vía `apt.txt` en Render |
| `docx`           | python-docx 1.1 · generación DOCX + parsing rúbricas         |
| `pdf_text`       | pdfplumber 0.11 · extracción texto de PDFs                   |
| `html_sanitize`  | bleach 6 · defensa SSRF antes de export                      |
| `pdf_legacy`     | xhtml2pdf (V1 collab)                                        |

### Utilidades backend

| key           | value                                                   |
|---------------|---------------------------------------------------------|
| `id_generator`| `shortuuid` · IDs de 16 chars vía `gen_id()`            |
| `password_hash`| `passlib[bcrypt]`                                      |
| `http_async`  | `httpx`                                                 |
| `mime_detect` | `filetype`                                              |
| `symbolic_math`| `sympy` (no instalado aún · previsto)                 |

### Email transaccional

| key                | value                                    |
|--------------------|------------------------------------------|
| `smtp_server`      | `smtp.zoho.com` puerto 587               |
| `account_noreply`  | `noreply@conniku.com`                    |
| `account_contact`  | `contacto@conniku.com`                   |
| `account_ceo`      | `ceo@conniku.com`                        |

---

## STACK.03 · BASE DE DATOS

| key                | value                                                   |
|--------------------|---------------------------------------------------------|
| `production_db`    | Supabase (PostgreSQL managed)                           |
| `local_dev_db`     | SQLite (`~/.conniku/conniku.db`)                        |
| `vector_search`    | pgvector (Supabase) · embeddings biblioteca             |
| `migrations`       | **NO Alembic** · helper `_ensure_columns()` en `database.py` · patrón `inspector.has_table + engine.begin()` · migraciones Python inline idempotentes |
| `id_pattern`       | Custom 16-char vía `shortuuid.gen_id()` · NOT UUID v4   |

### Modelos ORM principales (~50+ clases)

```
Auth:              User, UserAgreement, SocialAccount
Educación:         Subject, Quiz, StudyGuide, FlashcardDeck, Note
Workspaces (2a):   WorkspaceDocument, WorkspaceMember, WorkspaceVersion,
                   WorkspaceMessage, WorkspaceAthenaChat,
                   WorkspaceAthenaSuggestion, WorkspaceComment, AthenaUsage
HR chileno:        Employee, Payroll, Contract, DJ1887, AttendanceRecord, Liquidation
Pagos:             Subscription, Payment, MercadoPagoWebhookLog, PaypalWebhookLog
Comunidad:         Community, Post, Comment, Friend, Message, Mentor, MentorReview
Usage tracking:    UserFeatureUsage
```

---

## STACK.04 · PAGOS

| provider        | status                                                   |
|-----------------|----------------------------------------------------------|
| MercadoPago     | ✅ activo · suscripciones + checkout (LATAM)             |
| PayPal          | ✅ activo · suscripciones internacionales                |
| Stripe          | 🟡 legacy comentado · deuda A3 (eliminar)                |

```
RULE:    RUT chileno obligatorio pre-checkout (PR #7 feat-rut-suscripcion)
RULE:    Webhooks firmados (fix C8 mergeado PR #2)
```

---

## STACK.05 · REAL-TIME Y COLABORACIÓN

| key                | value                                                    |
|--------------------|----------------------------------------------------------|
| `ws_engine`        | WebSocket nativo (FastAPI + Starlette) · sin librería externa |
| `crdt_protocol`    | Yjs binary (CRDT updates + awareness)                    |
| `chat_1v1`         | `websocket_manager.chat_manager` · privado               |
| `chat_group`       | `workspaces_ws.py` · multiplexado binario/JSON           |
| `presence`         | Cursores + author colors determinísticos por `user.id`   |

---

## STACK.06 · AUTENTICACIÓN

| key                | value                                                    |
|--------------------|----------------------------------------------------------|
| `jwt_algo`         | HS256 (jose/python-jose)                                 |
| `access_ttl`       | 1 día (reducido desde 7 por seguridad)                   |
| `refresh_ttl`      | 30 días                                                  |
| `oauth`            | Google OAuth 2.0 vía `google.accounts.id` (Identity Services) |
| `email_verify`     | código 6 dígitos por SMTP                                |
| `legal_evidence`   | Checkbox declarativo 5 puntos + hash SHA-256 del texto legal (Bloque 1 FROZEN) |

---

## STACK.07 · BUILD / DEPLOY

### Frontend

| key           | value                                                 |
|---------------|-------------------------------------------------------|
| `hosting`     | Vercel · dominio `conniku.com`                         |
| `build_cmd`   | `vite build`                                           |
| `output_dir`  | `dist/renderer/`                                       |
| `deploy`      | automático desde GitHub por PR (preview URLs)         |

### Backend

| key           | value                                                 |
|---------------|-------------------------------------------------------|
| `hosting`     | Render.com · dominio legacy `studyhub-api-bpco.onrender.com` |
| `config_file` | `render.yaml` · build + start command                  |
| `native_deps` | `apt.txt` · libcairo2, libpango, etc.                  |
| `env_vars`    | Panel Render · `JWT_SECRET`, `ANTHROPIC_API_KEY`, etc. |

### Mobile / Desktop / Extension (configurados, no activos)

| key           | value                                                 |
|---------------|-------------------------------------------------------|
| `mobile`      | Capacitor · Android + iOS                             |
| `android_ci`  | workflow `android-build.yml`                          |
| `ios_ci`      | workflow `ios-build.yml` (standby · esperando Apple Developer secrets) |
| `desktop`     | Electron                                              |
| `extension`   | Browser extension · manifest propio                   |

---

## STACK.08 · CI / CD

### GitHub Actions workflows activos

| workflow                  | purpose                                                  |
|---------------------------|----------------------------------------------------------|
| `verify-build.yml`        | Gate obligatorio sobre main · lint + typecheck + ruff + mypy (permisivo) + pytest + vitest + vite build + verify-legal-texts-sync.sh + check-frozen.sh + npm audit |
| `android-build.yml`       | Compilación Android                                      |
| `ios-build.yml`           | Compilación iOS (standby)                                |
| `keep-alive.yml`          | Ping a Render para evitar cold starts                    |
| `supabase-backup.yml`     | `pg_dump` periódico                                      |

### Pre-commit hooks

| tool            | scope                                                    |
|-----------------|----------------------------------------------------------|
| Husky + lint-staged | Pre-commit orchestration                             |
| ESLint 9        | Frontend lint                                            |
| Prettier        | Formatting                                               |
| Ruff            | Backend lint + format                                    |
| `.claude/scripts/check-frozen.sh`  | Protege archivos frozen              |
| `.claude/scripts/check-lock.sh`    | Protege sesiones concurrentes        |
| `.claude/scripts/post-edit-verify.sh` | Verifica post-edit                |
| `.claude/scripts/regen-frozen-list.sh` | Regenera lista frozen            |
| `.claude/scripts/session-cleanup.sh`   | Cleanup post-sesión              |

---

## STACK.09 · TESTING

### Backend

```python
framework:         pytest
async:             pytest-asyncio
http_client_test:  fastapi.testclient.TestClient (HTTP + WebSocket in-process)
import_guards:     pytest.importorskip("fastapi"), importorskip("httpx"), importorskip("websockets")
db_isolation:      SQLite in-memory por test module (create_engine + StaticPool)
current_state:     446+ tests verdes ✅
```

### Frontend

```typescript
framework:         Vitest 2
dom_env:           jsdom
react_testing:     @testing-library/react + @testing-library/user-event
mocking:           vi.mock + vi.hoisted
```

---

## STACK.10 · INFRAESTRUCTURA DE AGENTES

```yaml
platform: Claude Code CLI (oficial Anthropic)
main_loop: Opus 4.7 con 1M context
specialized_agents:
  - backend-builder       (Sonnet)
  - frontend-builder      (Sonnet)
  - code-reviewer         (Sonnet)
  - truth-auditor         (Sonnet, extended reasoning)
  - gap-finder            (Sonnet)
  - web-architect         (Sonnet, extended reasoning)
  - qa-tester             (Sonnet)
  - legal-docs-keeper     (Sonnet)

mechanical_scripts: .claude/scripts/ (5 bloqueantes)
hooks_config:       .claude/settings.json · SessionStart, SessionEnd, PreToolUse, PostToolUse
permissions:        .claude/settings.local.json (Bash expandido)
frozen_protection:  .claude/frozen-files.txt + FROZEN.md
persistent_memory:  ~/.claude/projects/-Users-cristiang--CONNIKU/memory/

mcp_servers_available:
  - Gmail
  - Google Drive
  - Supabase
  - Vercel
  - Webflow
```

---

## STACK.11 · OBSERVABILIDAD

| key                   | value                                                   |
|-----------------------|---------------------------------------------------------|
| `logging`             | Python `logging` stdlib · loggers `conniku.workspaces_ws`, `conniku.workspaces_export`, `conniku.auth`, etc. |
| `render_logs`         | Panel web (para backend)                                |
| `vercel_logs`         | Panel web (para frontend)                               |
| `apm`                 | ❌ NO Sentry, NO DataDog · deuda A4                     |
| `print_debt`          | 145 `print()` pendientes migrar a logger (deuda A4)     |

---

## STACK.12 · HERRAMIENTAS DE DESARROLLO

```bash
gh                 (GitHub CLI v2.90 · Homebrew · autenticado cgutierrezlazc-eng)
git worktree       (disponible)
node               (20.18.1)
npm                (10.8.2)
python             (3.11.15 Homebrew)
ruff               (0.15.10 · via ~/Library/Python/3.9/bin)
mypy               (permisivo en CI)
prettier           (via npx)
pandoc             (ad-hoc · no instalado por defecto)
```

---

## STACK.13 · LEGALES Y CUMPLIMIENTO

| key                | value                                                    |
|--------------------|----------------------------------------------------------|
| `legal_texts_py`   | `shared/legal_texts.py`                                  |
| `legal_texts_ts`   | `shared/legal_texts.ts`                                  |
| `sync_mechanism`   | Hash SHA-256 · CI valida paridad Python ↔ TypeScript     |
| `constants_scaffold`| `backend/constants/` · labor, tax, consumer, data_protection (mayormente vacío · deuda A2) |
| `agreement_table`  | `user_agreements` · IP + user-agent + timestamp + hash texto |
| `legal_pages`      | `src/pages/*` · Privacy, Terms, Cookies, Refund, Acceptable Use (versiones desincronizadas · deuda C9) |

---

## STACK.14 · MAPA RESUMEN

| Capa      | Tecnología principal              | Versión                   | Salud                              |
|-----------|-----------------------------------|---------------------------|------------------------------------|
| Frontend  | React + Vite + Lexical            | 18, 5, 0.21               | ✅ activo                          |
| Backend   | Python + FastAPI + SQLAlchemy     | 3.11, 2.x                 | ✅ activo                          |
| BD        | Supabase (Postgres) + SQLite local | —                        | ✅ activo                          |
| IA        | Anthropic Claude Haiku 4.5        | claude-haiku-4-5-20251001 | ✅ activo                          |
| Colab     | Yjs + WebSocket                   | 13.6, 3                   | ✅ activo                          |
| Pagos     | MercadoPago + PayPal              | —                         | ✅ activo                          |
| Email     | Zoho Mail SMTP                    | —                         | ✅ activo                          |
| Mobile    | Capacitor                         | —                         | 🟡 configurado, no desplegado      |
| Desktop   | Electron                          | —                         | 🟡 configurado                     |
| Export    | WeasyPrint + python-docx          | 62, 1.1                   | 🟡 backend OK, falta `apt.txt`    |
| Auth      | JWT + Google OAuth                | HS256                     | ✅ activo                          |
| Hosting   | Vercel + Render                   | —                         | ✅ activo                          |
| CI        | GitHub Actions                    | —                         | ✅ activo                          |
| Tests     | pytest + vitest                   | —                         | ✅ 446+ verdes                     |

---

## STACK.15 · CÓMO AFECTA ESTE STACK A LAS INSTRUCCIONES DE MÓDULO

```
IF writing a module .md file
THEN include:
  - Absolute path of the TSX file to create (e.g. src/pages/Landing.tsx)
  - Full React + TypeScript component (interface Props + function component)
  - CSS tokens as :root custom properties (not hardcoded hex)
  - Exact imports (lucide-react, react-router-dom, etc.)
  - Existing services to wire (useAuth from src/services/auth.tsx, api from src/services/api.ts)
  - Route to register in src/App.tsx (lazy with React Router 6)
  - naming conventions: PascalCase components, camelCase hooks, kebab-case CSS classes
```

```
IF a module touches backend
THEN include:
  - Route file path (backend/<slug>_routes.py)
  - Pydantic models with ConfigDict(alias_generator=to_camel)
  - SQLAlchemy models (with declarative_base(), not mapped_column)
  - Endpoint signatures exactly
  - Integration with existing middleware (get_current_user, tier_gate)
  - If new DB columns: instructions for _ensure_columns() in database.py (NOT Alembic)
```

```
IF a module uses WebSocket
THEN include:
  - Authentication via websocket_manager.chat_manager.authenticate(ws, token)
  - Token in query string (not header)
  - Binary vs JSON multiplexing if applicable
  - Presence with author colors determinísticos
```

---

**END OF STACK. Next: read 00-RULES-GLOBAL.md**
