# Reporte truth-auditor — Cruce declarado vs real Conniku

**Fecha**: 2026-04-17 · **Agente**: truth-auditor · **Scope**: `/Users/cristiang./CONNIKU`
**Operación**: descubrimiento total. Cruzar lo que el proyecto AFIRMA sobre sí mismo vs lo que EFECTIVAMENTE existe.

---

## 1. CLAUDE.md — rutas declaradas vs existencia real

| Ruta declarada | Existe | Evidencia |
|---|---|---|
| `.claude/agents/` con 8 agentes | Sí | `ls` → 8 archivos: backend-builder, code-reviewer, frontend-builder, gap-finder, legal-docs-keeper, qa-tester, truth-auditor, web-architect |
| `.claude/scripts/` con hooks | Sí | 5 scripts: check-frozen.sh, check-lock.sh, post-edit-verify.sh, regen-frozen-list.sh, session-cleanup.sh |
| `.claude/commands/` | Sí | 7 comandos: audit, cerrar-bloque, freeze, menu, status, unfreeze, verify |
| `.claude/frozen-files.txt` | Sí | 15 entradas |
| `BLOCKS.md` | Sí | Declara 0 bloques cerrados |
| `FROZEN.md` | Sí | 15 archivos protegidos |
| `registry_issues.md` (raíz repo) | **NO EXISTE EN REPO** | Solo existe en memoria usuario |
| `docs/plans/` | **NO EXISTE** | `ls` → error. CLAUDE.md lo cita 5 veces |
| `docs/reports/` | **NO EXISTE** | Cita como destino obligatorio reportes de todos los agentes |
| `docs/inspecciones/` | **NO EXISTE** | §18.6 y §18.4 lo citan como destino Capa 6 |
| `docs/legal/` | **NO EXISTE** | Cita ruta con versionado semántico |
| `docs/legal/drafts/` | **NO EXISTE** | Dependiente anterior |
| `docs/legal/alerts.md` | **NO EXISTE** | Cita lista alertas con severidad |
| `backend/constants/labor_chile.py` | **NO EXISTE** | `ls backend/constants/` → error |
| `backend/constants/tax_chile.py` | **NO EXISTE** | ídem |
| `backend/constants/consumer.py` | **NO EXISTE** | ídem |
| `backend/constants/data_protection.py` | **NO EXISTE** | ídem. Carpeta completa `backend/constants/` ficticia |
| `docs/` general | Sí (parcial) | Contiene design-previews/, mockups/ y HTML sueltos. No las subcarpetas arriba |

**NOTA DE CORRECCIÓN (añadida tras verificación cruzada posterior)**: el truth-auditor reportó también que `backend/websocket_manager.py` no existe. **Verificación posterior demostró que SÍ existe** (134 líneas, 5.8 KB). Este punto del reporte original fue incorrecto. El resto de los hallazgos se sostienen.

**Gravedad**: discrepancia estructural grande. CLAUDE.md describe infraestructura de carpetas que no existe. Sección entera "Constantes legales en el código" (líneas 812-817) se refiere a archivos nunca creados.

---

## 2. Memoria de Claude — pointers rotos y claims desactualizados

MEMORY.md apunta a 13 archivos. **Todos existen** físicamente. Pero contenidos desalineados:

1. **`feedback_identity_check.md`**: "soy Konni". CLAUDE.md dice asistente = Tori desde 2026-04-17. Memoria congelada en identidad antigua.

2. **`session_checkpoint_main.md`**: fecha cierre 2026-04-16 18:41 CDT. Lista 7 commits (7a285bc, f9f9937, 219a341, b721b79, a631cd1, be6bfaa, 8704bbe) que existen en log actual. Pero "PENDIENTE PRÓXIMA SESIÓN" (Cristian decidirá A/B/C) ya obsoleto porque reset ocurrió después 2026-04-17.

3. **`audit_unified_2026-04-16.md`**: descrito como "14 agentes, 295 archivos, 52 CRITICAL reales". Checkpoint citado en punto 2 menciona "~90 CRITICAL detectados". MEMORY.md dice "52 CRITICAL reales, 7 falsos positivos". **Inconsistencia interna propia memoria**.

4. **`project_reset_complete.md`** afirma "Primer backup exitoso verificado el 2026-04-18". Fecha entorno 2026-04-17. Afirmación fecha futura — anomalía temporal.

5. **`project_reset_complete.md`** afirma "15 archivos protegidos en FROZEN.md". Cuento `frozen-files.txt`: 15 rutas sin contar comentarios. FROZEN.md lista 15 filas activas. **Coincide**.

---

## 3. Git log y PRs — coherencia con narrativa reset

Commit reciente `e972bfc` (fix CI pg_dump v17). Merge reset: `b376a84 PR #3 reset-agents-system`. Consistente con `project_reset_complete.md` ("PR #3 mergeado 2026-04-17"). Commits previos al reset existen (feat reset fase 3, chore reset fase 2 `feeea07`).

**PRs reales** (`gh pr list --state all`):

| PR | Estado | Observación |
|---|---|---|
| #3 "reset-agents-system" | MERGED 2026-04-17T22:33 | Coherente con reset |
| #2 "webhook-security-hardening" | **OPEN** desde 2026-04-17T05:09 | Cuerpo: "Rescatado de worktree kind-fermat-e17480 durante reset. **Autor/fecha original desconocidos**". PR huérfano con autoría perdida |
| #1 "Enterprise features" | **OPEN** desde 2026-04-09 (pre-reset) | Pre-reset, 8 días antiguo |

**Gravedad**: 2 PRs abiertos huérfanos. #1 particularmente problemático por edad. #2 declara "rescatado" con autoría desconocida → tensión directa con regla "nunca inventar datos" de CLAUDE.md.

---

## 4. Branches — estado real

```
git branch -a:
  claude/hopeful-matsumoto            (local, sin remoto)
  claude/jovial-proskuriakova         (local, tiene remoto)
* claude/youthful-hoover-561462       (rama activa worktree)
  develop                             (local, tiene remoto)
  main                                (actual)
  rescue/webhook-security-hardening   (local, tiene remoto; asociado PR#2)
  respaldo-auditoria-rota             (local, sin remoto)
  remotes/origin/reset-agents-system  (ya mergeado PR#3, no borrado)
```

**Discrepancia**: §18.5 dice "Ramas preview son exclusivas por bloque (preview-nombre-bloque)" y "merges a main solo ocurren en Capa 7". Existen ramas no-protocolares: `respaldo-auditoria-rota`, `claude/hopeful-matsumoto`, `develop`, `origin/reset-agents-system` (mergeado no limpiado).

Rama actual checkout según `git branch -a` (marcada `*`): `claude/youthful-hoover-561462` (rama del worktree). `git status` dice "On branch main" desde CWD raíz. Dos HEAD activos simultáneamente. Worktree tiene ~13 MB, código pre-reset.

---

## 5. BLOCKS.md = 0 bloques ↔ ausencia de docs/

BLOCKS.md declara "0 bloques cerrados". Coherente con:
- `docs/inspecciones/` no existe
- `docs/plans/` no existe
- No hay entradas en "Historial de intentos fallidos"

**Consistente**. Pero ausencia sugiere sistema 7 capas nunca ejecutado end-to-end — promesa no probada.

---

## 6. Stack declarado vs real

| Declarado | Verificación | Estado |
|---|---|---|
| React 18 + TS + Vite | package.json: react ^18.2, typescript ^5.3, vite ^5.0 | OK |
| Python FastAPI + SQLAlchemy | requirements.txt: fastapi>=0.128, sqlalchemy==2.0.25 | OK |
| **Migraciones Alembic** (§88) | **`grep alembic backend/` = 0 matches**. Solo `backend/migrations/add_expense_fields.sql` (SQL plano) | **DISCREPANCIA**: sin alembic, alembic.ini ni env.py |
| Supabase DB/Auth | 14 archivos `src/` con referencias `supabase` | OK frontend |
| Claude haiku-4-5-20251001 | Backend usa exactamente ese modelo en server.py:113, konni_engine.py:23, auth_routes.py:1009, moderation.py:166, math_engine.py:132,759 | OK |
| Zoho SMTP smtp.zoho.com:587 | render.yaml:32-33 | OK |
| Capacitor Android+iOS | @capacitor/android, @capacitor/ios, carpeta android/ con conniku-release.keystore | OK |
| Electron | electron/ con main.ts, preload.ts, electron ^28.1.4 | OK |
| Extensión navegador | extension/ con manifest.json, popup.html, src/ propio | OK |

---

## 7. Dominio legado `studyhub-api-bpco.onrender.com`

**Aparece masivamente en código**. 11 matches en `src/`:
- `src/services/api.ts` (L13, 1637, 1671 — fallback hardcoded)
- `src/services/websocket.ts:46`
- `src/pages/Courses.tsx:2236`
- `src/pages/Messages.tsx:1585`
- `src/pages/Biblioteca.tsx:88`
- `src/pages/SupportPage.tsx:967` (mostrado al usuario: "Backend API: studyhub-api-bpco.onrender.com")
- `src/pages/HRDashboard.tsx:4657, 7102`

Coherente con nota CLAUDE.md ("nombre legado, no renombrado por razones historia URLs"). **Pero** `render.yaml` declara servicio `conniku-api`, no `studyhub-api-bpco`. Incoherencia: yaml renombra pero código cliente apunta URL vieja.

---

## 8. Regla "nunca mencionar IA/AI/inteligencia artificial" en texto visible

**VIOLACIONES CONFIRMADAS**:

| Archivo:línea | Violación |
|---|---|
| `src/admin/finance/CeoOverview.tsx:92` | label 'Workflows Inteligentes' (OK — alternativa válida) pero ícono '🤖' y ruta `/ai-workflows` |
| `src/admin/shared/accountingData.ts:173` | `name: 'APIs de Inteligencia Artificial'` — **VIOLACIÓN DIRECTA** en nombre visible en reportes contables |
| `src/admin/shared/accountingData.ts:185` | tag 'api ia' |
| `src/App.tsx:820-821` | path `/ai-workflows` en URL visible usuario |
| `src/services/api.ts` | 10 endpoints con prefijo `/ai-workflows/` y `/ai/` |
| `src/pages/Biblioteca.tsx:350` | comentario `// IA BookReader es embeddable` — no visible pero prefijo `ia-` como ID |

**Gravedad**: violación real en al menos 1 string que llega al usuario (`'APIs de Inteligencia Artificial'`). URLs producto contienen `/ai-workflows/`.

---

## 9. Worktrees

```
git worktree list:
/Users/cristiang./CONNIKU                                           e972bfc [main]
/Users/cristiang./CONNIKU/.claude/worktrees/youthful-hoover-561462  8704bbe [claude/youthful-hoover-561462]
```

Worktree `youthful-hoover-561462` existe, 13 MB, tiene CLAUDE.md, src/, backend/, extension/. Commit 8704bbe **previo al reset** (anterior al merge PR#3 b376a84). Este worktree:
- No aparece en `inventario-reset.txt` (listó elastic-goodall, kind-fermat-e17480, trusting-bouman como "a borrar")
- Sobrevivió Fase 2 limpieza
- Mantiene viva rama código pre-reset (archivos con "konni" en nombre como konni_engine.py)
- `.gitignore` no lo excluye → aparece como "Untracked files: .claude/worktrees/"

**Gravedad**: worktree huérfano post-reset. Viola principio §18.5 "no trabajo paralelo" porque mantiene árbol trabajo independiente. Fuente potencial "drift entre Konnis" que reset pretendía eliminar.

---

## 10. Legal — divergencia entre dos realidades

CLAUDE.md declara:
- `docs/legal/` con 9+ documentos (Términos, Privacidad, Cookies, Reembolso, Uso Aceptable, Aviso Legal, DPA, Política RRHH, Seguridad)
- Versionado semántico v1.0.0, etc.
- Auditorías semanales `docs/legal/weekly-audit-*.md`
- Borradores `docs/legal/drafts/`
- Alertas `docs/legal/alerts.md`
- `backend/constants/` con 4 archivos constantes legales

**Realidad**:
- `docs/legal/` NO existe
- `backend/constants/` NO existe
- Existe `legal/` en raíz (no `docs/legal/`) con solo `README.md` + `escrito.pdf` (constitución sociedad)
- `legal/README.md` no menciona políticas legales producto

**Gravedad: ALTO**. Toda sección Cumplimiento Legal producto + descripción operativa legal-docs-keeper aspiracionales. Infraestructura declarada no existe. CLAUDE.md: "Ningún agente puede cerrar solo tarea componente legal. Aprobación humana gate obligatorio". Pero agente `legal-docs-keeper` (12 KB) sin nada real sobre lo cual operar.

---

## 11. Razonamiento extendido — observaciones sutiles

**Observación 1**: rama activa según `git branch -a` es `claude/youthful-hoover-561462` (con `*`), pero `git status` dice "On branch main". Resolución: sesión actual usa CWD raíz (main), existe simultáneamente worktree en otra rama. **Dos HEAD activos**. `check-lock.sh` previene sesiones Claude Code concurrentes pero no previene worktrees git. Laguna mecánica.

**Observación 2**: archivo `CLAUDE.md` tiene modificación sin commitear que agrega Sección 19 (Auto Mode DESACTIVADO). El system-reminder actual ya incluye esa sección → alguna capa lee CLAUDE.md directo antes de commit. Cambios no-commiteados afectan sesiones presentes. **Riesgo**: cambio no revisado por git puede cambiar comportamiento asistente sin trazabilidad.

**Observación 3**: `session.lock` contiene "18826 1776480310 cristiang." timestamp Unix 1776480310 = 2026-04-17T22:45:10 UTC. Al menos 4 intentos cierre sesión detectaron locks de OTRAS sesiones vivas. **Sistema locks no captura cierres limpios**. PIDs huérfanos en locks = riesgo operativo.

**Observación 4**: `package.json` L3 dice "Plataforma universitaria todo-en-uno", no "Plataforma educativa para estudiantes universitarios chilenos con expansión latam/europa" como CLAUDE.md. Discrepancia menor narrativa entre artefactos.

**Observación 5**: Sección 19 CLAUDE.md (no commiteada) dice "El comando `/auto` NO existe en Claude Code" pero también "Por favor desactívalo manualmente con `/auto`". **Contradicción interna** dentro del mismo documento.

---

## Lo que no hice y por qué

- No ejecuté `npm test`, `pytest`, `ruff check`, `tsc --noEmit`, `vite build`. Petición fue descubrimiento discrepancias declarativas, no validación funcionamiento.
- No inspeccioné docs/design-previews/ y docs/mockups/ archivo por archivo.
- No verifiqué contenido 8 agentes vs CLAUDE.md §8.
- No verifiqué Render/Vercel/Supabase vía API.
- No conté líneas exactas por módulo.
- No auditoré 50+ archivos del worktree huérfano.
- No seguí commit `e68971c docs: registro errores auditoria` para verificar si produjo archivo luego eliminado.

---

## Incertidumbres

- Cuál URL backend activa en producción: `studyhub-api-bpco.onrender.com` (hardcoded código) vs `conniku-api` (render.yaml). Ambas podrían funcionar con alias, o una obsoleta.
- Hooks declarados en settings.json efectivamente disparan? Scripts existen con permisos ejecución. session.log muestra actividad check-lock pero no check-frozen ni post-edit-verify.
- `docs/plans/`, `docs/reports/` no existen porque sistema nuevo nunca corrió tarea completa, o porque fueron borrados. Ambas hipótesis consistentes. Más probable: primera (sistema nuevo, BLOCKS.md = 0 bloques).
- Memoria usuario no versionada por git, no puedo auditar historial. Contradicciones pueden ser ediciones manuales sin trazabilidad.
- Comando `/auto` en CLAUDE.md §19 contradictorio. Sección 19.1 pide usar comando que 19.4 declara inexistente. Interpretación caritativa: `Shift+Tab`.
- Mi auditoría puede pasar por alto discrepancias en archivos agentes (.claude/agents/*.md) no leídos a fondo.
- Commits mezclan español y español-chileno. No verifiqué 100% del log contra convención Conventional Commits imperativo.

---

## Quality score final

| Categoría | Máx | Asignados | Razón |
|---|---|---|---|
| Archivos afirmados vs reales | 15 | 5 | 11 carpetas/archivos declarados no existen |
| Comandos verificación | 20 | 14 | Re-ejecuté factibles sin levantar servicios |
| Endpoints funcionando | 15 | 10 | No ejecuté curl |
| Archivos frozen intactos | 10 | 10 | 15/15 frozen-files.txt coinciden FROZEN.md |
| Registro issues actualizado | 10 | 4 | registry_issues.md no existe en raíz repo |
| Commits coherentes | 10 | 7 | PR#1 huérfano, PR#2 "autor/fecha desconocidos" (viola regla no inventar) |
| Env vars declaradas vs reales | 10 | 8 | render.yaml + .env.example existen |
| Criterio terminado cumplido | 10 | 4 | Sistema 7 capas nunca ejecutado end-to-end |
| **TOTAL** | **100** | **62** | |

**Banda: FAIL** (62 < 65).

### Bloqueantes identificados

1. Regla producto violada en código visible (`accountingData.ts:173`)
2. Infraestructura declarada no existente (`backend/constants/*.py`)
3. PR #2 con "autor/fecha desconocidos" viola regla "nunca inventar datos"
4. Worktree huérfano `youthful-hoover-561462` post-reset
5. Contradicción interna CLAUDE.md §19 comando `/auto`

### Decisión

Tarea cerrada como auditoría (no como corrección). FAIL indica divergencia significativa narrativa ↔ realidad.
