# Log de acciones de higiene — Tori

**Fecha**: 2026-04-18
**Ejecutor**: Tori (asistente técnico Conniku, sesión principal Claude Code)
**Autorizado por**: Cristian Gutiérrez Lazcano
**Razón de documentar**: trazabilidad ante auditorías futuras. Cristian pidió guardar info de mis acciones "para documentación en caso de ser necesaria".

---

## Contexto

Auditoría exhaustiva del 2026-04-17 detectó 28 gaps estructurales + deuda legal. Se categorizaron 6 tareas de higiene. Cristian autorizó ejecutar las 4 seguras (tareas 1, 4, 5, 6) + preservación de reportes (tarea 7). Las tareas 2 y 3 (worktree huérfano + limpieza ramas) quedan aplazadas hasta análisis caso por caso.

---

## Acciones ejecutadas

### ACCIÓN 1: Fix contradicción interna CLAUDE.md §19.1

**Archivo**: `/Users/cristiang./CONNIKU/CLAUDE.md`
**Líneas modificadas**: 1234-1238

**Antes**:
```
Por favor desactívalo manualmente con `/auto` o desde el menú de Claude Code para que quede limpio.
```

**Después**:
```
Por favor desactívalo manualmente presionando `Shift+Tab` en el CLI hasta volver a modo `default` (el modo actual se muestra en el status bar), para que quede limpio.
```

**Justificación**: §19.1 pedía usar el comando `/auto` pero §19.4 (del mismo documento) declara literalmente "El comando `/auto` NO existe en Claude Code" e indica que la forma correcta es `Shift+Tab`. Contradicción interna corregida alineando §19.1 con §19.4.

**Lectura previa**: sí, leí líneas 1229-1289 de CLAUDE.md antes de editar.
**Verificación post**: `grep "Shift+Tab\|/auto"` confirma que `/auto` queda solo en §19.4 como texto informativo (declarándolo inexistente).

---

### ACCIÓN 2: Gitignorear `.claude/worktrees/` e `inventario-reset.txt`

**Archivo**: `/Users/cristiang./CONNIKU/.gitignore`
**Líneas agregadas**: 55, 59-60

**Agregado bajo sección "# Claude - ignorar runtime pero trackear código fuente del sistema"**:
```
.claude/worktrees/
```

**Agregado en nueva sección "# Metadata interna de procesos de reset (no va a repo público)"**:
```
inventario-reset.txt
plan-fase-*.md
```

**Justificación**:
- `.claude/worktrees/` detectado por gap-finder ([MEDIO-04]) como no gitignoreado. Contiene copias completas del repo con su propio node_modules (hasta 693 MB según inventario-reset.txt). `git add .` accidental podría incluirlos.
- `inventario-reset.txt` es metadata interna del proceso de reset 2026-04-17, detectado por gap-finder ([MEDIO-06]). Contiene 93 líneas de estado interno que no va a repo público.
- `plan-fase-*.md` incluido por simetría: `plan-fase-2.md` ya existe en raíz con el mismo carácter de metadata interna.

**Lectura previa**: sí, leí .gitignore completo (88 líneas).
**Verificación post**: `grep "worktrees\|inventario-reset" .gitignore` confirma ambas entradas presentes.

**Nota**: este cambio NO borra archivos. Solo previene tracking futuro. Los archivos existentes siguen en disco intactos.

---

### ACCIÓN 3: Actualizar identidad en `feedback_identity_check.md` (memoria de usuario)

**Archivo**: `/Users/cristiang./.claude/projects/-Users-cristiang--CONNIKU/memory/feedback_identity_check.md`

**Cambios**:
1. Frontmatter `description` — `"soy Konni !"` → `"soy Tori !"`
2. Body — `**check check Cristian, soy Konni !**` → `**check check Cristian, soy Tori !**`
3. `**Why:**` — actualizado para explicar transición Konni→Tori y referenciar reset 2026-04-17
4. `**How to apply:**` — actualizado el nombre del asistente
5. **Agregado** nuevo campo `**Historia:**` preservando explícitamente que antes del 2026-04-17 la respuesta era "soy Konni !" y apuntando a `.reset-archive/` y CLAUDE.md Registro histórico de errores.

**Justificación**: la memoria contradecía directamente CLAUDE.md (que establece el asistente = Tori desde 2026-04-17). No es pérdida histórica: preservo la referencia a Konni y al archivo del reset. Detectado como discrepancia por truth-auditor y gap-finder ([ALTO-08]).

**Lectura previa**: sí, leí archivo completo (14 líneas).
**Verificación post**: `grep "Konni\|Tori"` confirma que ambos nombres aparecen — Tori como respuesta activa, Konni como referencia histórica.

**Preservación de historia**:
- `.reset-archive/` sigue íntegro
- CLAUDE.md §Registro histórico de errores (lín 965-982) sigue documentando los 4 incidentes de Konni (2026-04-09 RUT inventado, 2026-04-12 iconos Play Console x3)
- El archivo actualizado referencia ambas fuentes

---

### ACCIÓN 4: Reemplazo string visible al usuario en `accountingData.ts`

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/shared/accountingData.ts`
**Línea modificada**: 173

**Antes**:
```ts
name: 'APIs de Inteligencia Artificial',
```

**Después**:
```ts
name: 'APIs de Asistentes Inteligentes',
```

**Justificación**: CLAUDE.md §Convenciones del proyecto establece como "regla crítica de producto: nunca mencionar las palabras 'IA', 'AI' ni 'inteligencia artificial' en texto visible al usuario final". Las alternativas válidas incluyen "asistente inteligente", "herramientas inteligentes". Este string aparece en el panel CEO (categoría de gasto contable) y está clasificado como violación de regla por truth-auditor y legal-docs-keeper.

**Contexto técnico**: el array al que pertenece tiene `key: 'api_ia'`, `codigoSII: '5.1.02'`, `keywords: ['anthropic', 'claude', 'openai', 'gemini', 'google ai']`. NO modifiqué la `key` (es identificador interno, no visible al usuario) ni las keywords (son para matching de búsqueda, no UI). Solo el `name` que se muestra como categoría en la UI.

**Lectura previa**: sí, leí líneas 160-185 (contexto del objeto completo).
**Verificación post**:
- `grep "Asistentes Inteligentes"` confirma cambio aplicado.
- `npx eslint src/admin/shared/accountingData.ts` → sin errores.

**Alcance intencionalmente acotado**: NO toqué otros usos de "IA" o "AI" detectados por la auditoría (ver reporte truth-auditor §8: `src/App.tsx:820-821` ruta `/ai-workflows`, `src/services/api.ts` 10 endpoints con prefijo `/ai-`, `src/admin/finance/CeoOverview.tsx:92` ícono '🤖'). Esos requieren bloque separado por cambiar rutas del SPA o íconos (mayor impacto).

---

## Archivos tocados (inventario completo)

1. `/Users/cristiang./CONNIKU/CLAUDE.md` — edición línea 1234-1238
2. `/Users/cristiang./CONNIKU/.gitignore` — agregadas 3 líneas (55, 59-60) + comentario de sección
3. `/Users/cristiang./.claude/projects/-Users-cristiang--CONNIKU/memory/feedback_identity_check.md` — rewrite completo preservando historia
4. `/Users/cristiang./CONNIKU/src/admin/shared/accountingData.ts` — edición línea 173

Total: 4 archivos modificados, 0 creados, 0 eliminados.

---

## Verificación global

- ✓ Ningún archivo FROZEN tocado
- ✓ Todas las ediciones son aditivas o puntuales (no refactor masivo)
- ✓ Cada cambio tiene razón específica documentada de la auditoría
- ✓ Lint de accountingData.ts sin errores
- ✓ grep post-edición confirma cada cambio
- ✓ Preservación histórica en memoria (Konni queda como referencia, no borrada)

---

## Lo que NO hice y por qué

- **NO eliminé el worktree `youthful-hoover-561462`**. Requiere análisis `git status` dentro del worktree primero para verificar que no tiene cambios no commiteados que se perderían. Tarea aplazada.
- **NO eliminé ramas locales** (`claude/hopeful-matsumoto`, `claude/jovial-proskuriakova`, `develop`, `respaldo-auditoria-rota`, `origin/reset-agents-system`). Requiere `git log main..<rama>` caso por caso para verificar commits únicos. Tarea aplazada.
- **NO hice commit de estos cambios**. Esperando autorización explícita de Cristian (los commits afectan historia del repo, decisión de Cristian).
- **NO toqué otros strings "IA/AI"** fuera de accountingData.ts. Requieren bloque separado por tocar rutas del SPA o íconos.
- **NO toqué `backend/constants/`** ni creé la estructura exigida por CLAUDE.md. Es bloque futuro separado (tarea del web-architect + builder).

---

## Preguntas pendientes para Cristian

1. **¿Autorizas commit de estos 4 cambios?** Propuesta de mensaje:
   ```
   chore: higiene de coherencia (CLAUDE.md §19, gitignore, memoria, accountingData)

   - CLAUDE.md §19.1: corregir contradicción interna sobre comando /auto inexistente, sustituir por Shift+Tab (coherente con §19.4)
   - .gitignore: agregar .claude/worktrees/, inventario-reset.txt y plan-fase-*.md para prevenir tracking accidental
   - memoria/feedback_identity_check.md: actualizar identidad Konni→Tori tras reset 2026-04-17, preservar referencia histórica
   - src/admin/shared/accountingData.ts:173: reemplazar 'APIs de Inteligencia Artificial' por 'APIs de Asistentes Inteligentes' (regla crítica de producto no mencionar IA/AI al usuario)
   ```
   Como toca CLAUDE.md + código + memoria + config, el scope es multi-área. ¿Un commit, o dividir en 3 commits separados (CLAUDE.md, código+config, memoria)?

2. **¿Procedo con las tareas 2 y 3 después de presentarte el análisis de worktree y ramas?** O prefieres posponerlas a más adelante.

---

## Incertidumbres

- El cambio en CLAUDE.md §19.1 no está commiteado aún. El archivo en disco es la fuente de verdad para la sesión actual (Tori ya opera leyendo este archivo). Si la sesión se reinicia antes del commit, el cambio persiste en disco pero no en git.
- La memoria de usuario no es versionada por git. El cambio en `feedback_identity_check.md` es inmediato y no tiene trazabilidad git. Este log es la única trazabilidad.
- `plan-fase-*.md` agregado al gitignore con wildcard. Solo existe `plan-fase-2.md` actualmente. Si en el futuro alguien crea `plan-fase-3.md` con intención de commitear, el wildcard lo ignorará sin advertir.
