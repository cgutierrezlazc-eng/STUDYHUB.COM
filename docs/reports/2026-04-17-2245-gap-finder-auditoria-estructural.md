# Reporte gap-finder — Auditoría estructural exhaustiva Conniku

**Fecha**: 2026-04-17 · **Agente**: gap-finder · **Scope**: `/Users/cristiang./CONNIKU`
**Operación**: descubrimiento total. Exhaustividad absoluta: reportar cada gap incluso menores.

---

## Metodología

13 capas auditadas: capa mecánica (hooks, scripts, lock, worktrees), cobertura tests, variables entorno, backups, frozen-files, documentación, reset-archive, dependencias, tipos TS, legal, CI/CD, código muerto, branches/PRs.

Comandos: Glob, Grep, Read, Bash (python3, jq, ls sobre rutas absolutas). Verificaciones contra: settings.json, scripts en `.claude/scripts/`, frozen-files.txt, FROZEN.md, .env.example, requirements.txt, package.json, render.yaml, workflows, CLAUDE.md, BLOCKS.md, MEMORY.md, payroll_calculator.py, ChileLaborConstants.ts, git refs.

---

## CRÍTICOS (5 gaps)

### [CRÍTICO-01] Cero tests en todo el proyecto
- **Ubicación**: `backend/` (73 archivos, ~1.5MB) y `src/` (~110 archivos TS/TSX)
- **Evidencia**: `find src -name "*.test.*"` → 0 resultados. `find backend -name "test_*.py"` → 0 resultados. No existe `backend/tests/`, no existe `src/__tests__/`. No script `test` en `package.json`. No vitest ni jest en devDependencies. No pytest.ini. CI `verify-build.yml` paso [4/6] dice literal "No test files found, skipping".
- **Importa porque**: CLAUDE.md declara TDD obligatorio. Hay cálculos nómina con impacto legal (AFP, SIS, impuesto segunda categoría, liquidaciones) sin ningún test. Regresión en `payroll_calculator.py` paga mal a trabajadores sin detección. Además `hr_routes.py` (143KB, 3674 líneas, FROZEN) tiene generadores de documentos legales (finiquito, anexo, pacto HE) sin test.

### [CRÍTICO-02] CLAUDE.md declara Supabase pero código usa Render PostgreSQL
- **Ubicación**: `CLAUDE.md` línea ~63, `backend/database.py` líneas 26-40, `render.yaml`
- **Evidencia**: `grep -r "supabase" backend/` → 0 resultados. `database.py` usa `DATABASE_URL` desde Render `conniku-db`. Workflow `supabase-backup.yml` requiere secret `SUPABASE_DB_URL` no configurado en código ni render.yaml.
- **Importa porque**: si backup apunta a DB Supabase inexistente, corre cada noche 3 AM y falla silenciosamente en step "Verify secrets". BD real podría no tener backup alguno. Documentación confunde.

### [CRÍTICO-03] 22 variables de entorno usadas en código NO documentadas en `.env.example`
- **Ubicación**: `.env.example` vs código backend
- **Evidencia** (grep de `os.environ.get`):
  - `ANTHROPIC_API_KEY` — konni_engine, math_engine, moderation, auth_routes, server
  - `OPENAI_API_KEY` — ai_engine, document_processor, cv_routes
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — push_routes
  - `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` — mercadopago_routes
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` — paypal_routes
  - `DATABASE_URL` — database
  - `IMAP_HOST`, `IMAP_PORT` — email_doc_routes
  - `SMTP_PASS_CEO`, `SMTP_PASS_NOREPLY`, `SMTP_PASS_CONTACTO` — notifications
  - `SMTP_USER`, `SMTP_FROM`, `SMTP_REPLY_TO` — notifications
  - `SETUP_KEY` — auth_routes (creación cuenta owner)
  - `GOOGLE_CLIENT_ID` — auth_routes (backend, distinto de VITE_*)
  - `STRIPE_PRICE_MAX_YEARLY` — payment_routes
  - `PORT` — server
- **Importa porque**: un desarrollador nuevo siguiendo `.env.example` deja backend con pagos y IA rotos. `render.yaml` tampoco las lista todas. MP/PayPal/Stripe críticas para revenue.

### [CRÍTICO-04] Discrepancia tasa SIS entre backend y frontend
- **Ubicación**: `backend/payroll_calculator.py:137` vs `src/admin/shared/ChileLaborConstants.ts:54`
- **Evidencia**:
  - Backend: `SIS_RATE: float = 0.0153` (1.53%)
  - Frontend: `SIS: { rate: 0.0141 }` (1.41%)
  - Diferencia 0.12 p.p.
- **Importa porque**: cotización SIS del empleador calculada distinta entre backend y frontend. Dependiendo qué módulo use qué cálculo, el costo mostrado al empleador no coincide con lo que backend liquida. Subdeclaración o sobredeclaración ante Superintendencia de Pensiones.

### [CRÍTICO-05] Discrepancia UF y UTM backend ↔ frontend
- **Ubicación**: `backend/payroll_calculator.py:47-50` vs `src/admin/shared/ChileLaborConstants.ts:22-23`
- **Evidencia**:
  - Backend: UF_VALUE=38.000, UTM_VALUE=66.000
  - Frontend: UF=38.700, UTM=67.294
  - Diferencia UF: $700. Diferencia UTM: $1.294.
- **Importa porque**: topes imponibles (AFP 81.6 UF, AFC 122.6 UF), gratificaciones, tramos impuesto segunda categoría usan estos valores. Tope AFP backend: $3.100.800. Tope AFP frontend: $3.157.920. Diferencia $57.120/trabajador/mes. Afectados: trabajadores mayor remuneración — donde el error es más costoso.

---

## ALTOS (8 gaps)

### [ALTO-01] Backup BD nunca verificado operacional
- Workflow `supabase-backup.yml` existe (creado 2026-04-17 22:13). Secrets requeridos: `SUPABASE_DB_URL`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `NOTIFY_EMAIL`. Sin evidencia en repo de que estén configurados. Repo creado reciente (reset 2026-04-17). Si backup nunca corrió, BD producción sin respaldo. Plan DB Render `free` — Render elimina DBs gratuitas inactivas.

### [ALTO-02] Lock sesión stale activo
- `/Users/cristiang./CONNIKU/.claude/session.lock` contiene PID 18826 que NO está corriendo (`ps aux | grep 18826` → vacío). Timestamp 642s anterior a verificación.
- `check-lock.sh` tiene auto-sanación para PIDs muertos pero lock persiste. `sessions.log` muestra múltiples entradas "lock encontrado con PID diferente, no se toca" → hook no se ejecuta correctamente en todos los casos.

### [ALTO-03] Worktree `youthful-hoover-561462` colgado
- `/Users/cristiang./CONNIKU/.claude/worktrees/youthful-hoover-561462/` con 42 subdirectorios (copia completa repo). Rama `claude/youthful-hoover-561462` local y remota (8704bbeb5a7d). `.claude/worktrees/` NO está en `.gitignore`.

### [ALTO-04] 145 `print()` en 20 archivos backend
- Más afectados: paypal_routes.py (22), database.py (12), payroll_calculator.py (19), mercadopago_routes.py (22). Ruff configurado sin regla para `print()`. Produce volcado a logs Render en paypal/mercadopago puede incluir datos transacciones — riesgo PCI-DSS.

### [ALTO-05] Placeholder RUT `77.XXX.XXX-X` en 15 lugares de documentos legales FROZEN
- 12 apariciones en `src/pages/HRDashboard.tsx`, 2 en `LibroRemuneracionesTab.tsx`, 1 en `DJ1887Tab.tsx`. RUT real Conniku SpA: `78.395.702-7` (MEMORY.md).
- HRDashboard.tsx FROZEN desde 2026-04-16. Documentos generados (finiquito, contrato, certificado antigüedad, libro remuneraciones, DJ 1887) contienen RUT equivocado → inválidos ante SII, Inspección Trabajo, AFP.

### [ALTO-06] `docs/plans/`, `docs/reports/`, `docs/legal/`, `docs/inspecciones/` NO existen
- `ls docs/` muestra solo HTML mockup. Los 4 subdirectorios requeridos por CLAUDE.md §6, §8, §18.3-18.8 ausentes. Sin `docs/plans/` web-architect sin dónde escribir. Sin `docs/reports/` agentes no cumplen protocolo reporte obligatorio. Sin `docs/legal/` legal-docs-keeper sin sustrato. Sin `docs/inspecciones/` Capa 6 sin documentar iteraciones. Sistema agentes cojea.

### [ALTO-07] `registry_issues.md` no existe en raíz del repo
- `ls /Users/cristiang./CONNIKU/registry_issues.md` → FILE NOT FOUND. Existe en memory (80+ issues). CLAUDE.md §18.6 lo referencia como archivo en raíz repo. BLOCKS.md línea 80 también. truth-auditor.md línea 160 ejecuta `cat registry_issues.md` esperando encontrarlo.

### [ALTO-08] Identidad "Konni" persiste en `feedback_identity_check.md`
- `/Users/cristiang./.claude/projects/-Users-cristiang--CONNIKU/memory/feedback_identity_check.md` dice responder "check check Cristian, soy Konni !". CLAUDE.md establece asistente = Tori desde 2026-04-17.

---

## MEDIOS (9 gaps)

### [MEDIO-01] `payroll_calculator.py` sin formato cita legal CLAUDE.md
- Grep `https?://|fecha.*verif|Verificado` → 0 resultados. CLAUDE.md exige 4 elementos por constante: artículo, URL fuente oficial, fecha verificación, nombre verificador. Solo cita artículo en docstring módulo (genérico, no per-constante).

### [MEDIO-02] `ChileLaborConstants.ts` similar falta citas per-constante
- Comentario L2: `// Fuente: Ministerio del Trabajo, SII, Superintendencia de Pensiones` (genérico). Solo 2 citas específicas (IMM Art. 44 CT). Resto (SIS, AFC, MUTUAL, tramos impuesto) sin cita individual.

### [MEDIO-03] 912 usos de `any` en 84 archivos TypeScript
- UserProfile.tsx (59), Profile.tsx (65), Jobs.tsx (33), HRDashboard.tsx (34), CeoDashboard.tsx (27). HRDashboard.tsx FROZEN — datos nómina y docs legales sin tipos estrictos.

### [MEDIO-04] `.claude/worktrees/` no en `.gitignore`
- Búsqueda directa → MISSING. `.claude/session.lock` sí está (L53). Worktree de 42 subdirs puede incluirse en commit accidental con `git add .`.

### [MEDIO-05] README.md desactualizado en 3 puntos
1. Dice "SQLite via SQLAlchemy" — producción usa PostgreSQL, SQLite solo dev local
2. Dice "Anthropic Claude para audio, notes, flashcards" — quizzes/flashcards/guides usan OpenAI GPT-4o-mini (ai_engine.py)
3. Sección Stack no menciona Electron, Capacitor, extensión navegador

### [MEDIO-06] `inventario-reset.txt` en raíz sin gitignore
- 93 líneas metadata proceso reset interno. No debería estar en repo público.

### [MEDIO-07] 4+ ramas locales sin limpiar
- develop (0336eb6), respaldo-auditoria-rota (e68971c), claude/hopeful-matsumoto (693f98d), claude/jovial-proskuriakova. Distintas de main. `rescue/webhook-security-hardening` sugiere trabajo seguridad que quizás no llegó a main.

### [MEDIO-08] `render.yaml` plan DB `free`
- Render elimina DBs gratuitas inactivas. Keep-alive.yml mantiene web service pero no DB. Si expira, pérdida total data producción. Backup Supabase (ya con problemas) no cubre BD Render si son instancias distintas.

### [MEDIO-09] `static_courses_*.py` = 654KB datos hardcodeados
- static_courses_1.py (217KB), _2.py (125KB), _3.py (112KB), _4.py (200KB). Anti-patrón: no modificable sin redeploy, sin tests integridad, probable causa build lento CI. Deberían vivir en BD.

---

## BAJOS (6 gaps)

### [BAJO-01] `console.log` en `src/services/api.ts:2134` y `src/main.tsx:{45,51,71}`
- lint-staged con `--no-warn-ignored` → Husky no bloquea. Regla no-console posiblemente como warning.

### [BAJO-02] TODOs activos backend
- `backend/social_routes.py:1312` "Merge academic activity items..."
- `backend/referral_routes.py:188` "implementar sistema de IP blocking para fraud detection" (seguridad pendiente)

### [BAJO-03] `cleanup_production_db.py` + `seed_ceo_profile.py` en repo sin gitignore
- `.gitignore` tiene `seed_*.py` pero en raíz, no `backend/seed_*.py`. cleanup hace `DELETE FROM` masivo con `print()` que expone ceo@conniku.com. Si se ejecuta accidentalmente en producción, borra todos los datos excepto owner.

### [BAJO-04] `ai_workflow_routes.py` docstring dice "Google Gemini" pero código usa OpenAI
- docstring L4: "via Google Gemini (free tier)". `ai_engine.py` usa `OpenAI(api_key=_OPENAI_KEY)`. Métodos `_call_gemini` nomenclatura engañosa — llaman a GPT-4o-mini. Confusión sobre costos API.

### [BAJO-05] `.reset-archive/` sin fecha eliminación programada
- README dice "al final de Fase 5, esta carpeta completa se elimina". Sin definición de "Fase 5". Contiene capturas, .old, scripts obsoletos, CLAUDE.md.old, CLAUDE.md.pre-seccion18. Riesgo de cargar archivo antiguo por error.

### [BAJO-06] `debugger.md` y `code-reviewer.md` en worktree root y `.reset-archive/root-orphans/`
- Sistema nuevo tiene `code-reviewer` en `.claude/agents/code-reviewer.md` con frontmatter Claude Code. Archivos en root-orphans pueden ser versiones antiguas incompatibles.

---

## RESUMEN CUANTITATIVO

| Severidad | Cantidad |
|---|---|
| Críticos | 5 |
| Altos | 8 |
| Medios | 9 |
| Bajos | 6 |
| **TOTAL** | **28 gaps** |

---

## Incertidumbres

- Severidad real de gap Supabase vs Render. Si secret `SUPABASE_DB_URL` no está configurado, backup falla silenciosamente todas las noches → crítico potencial.
- No verifiqué runs reales de GitHub Actions (`gh run list` denegado).
- No verifiqué Desktop del usuario para backups locales (permisos denegados sandbox).
- No ejecuté `npm audit` ni `pip-audit` directamente (Bash bloqueado).
- `konni_tools.py` inaccesible (permisos 600).
