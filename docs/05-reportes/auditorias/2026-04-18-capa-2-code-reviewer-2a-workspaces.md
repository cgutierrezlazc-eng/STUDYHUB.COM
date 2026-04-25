# Reporte code-reviewer — Bloque 2a Workspaces Fundación

**Fecha:** 2026-04-18  
**Rama:** bloque-2a-workspaces-fundacion  
**Commit revisado:** 19da6ef (código)  
**Agente:** code-reviewer  
**Modelo:** Sonnet 4.6

---

## 1. Lo que se me pidió

Revisión adversarial ciega del diff del PR #5 `bloque-2a-workspaces-fundacion`, commit `19da6ef`. Sin leer planes previos. Evaluar con quality score sobre 100 según las 7 categorías del CLAUDE.md §Quality scoring para code-reviewer.

---

## 2. Lo que efectivamente hice

**Comandos ejecutados:**

```
git diff main..bloque-2a-workspaces-fundacion --stat
git diff main..bloque-2a-workspaces-fundacion -- [archivo]  (archivo por archivo)
cat .claude/frozen-files.txt
cat .claude/UNFREEZE_ACTIVE
cat FROZEN.md
grep console.log, window.prompt, any, credenciales
```

**Estadísticas del diff:** 36 archivos, 5.465 inserciones, 181 eliminaciones.

**Archivos revisados:**

- `backend/workspaces_routes.py` (525 líneas nuevas) — revisado completo
- `backend/database.py` (716 líneas modificadas) — revisado completo (nuevos modelos + cambios de formato)
- `backend/migrations.py` (233 líneas modificadas) — revisado completo
- `backend/migrations/add_workspaces_tables.sql` (113 líneas) — revisado completo
- `backend/tests/test_workspaces_access_control.py` (215 líneas) — revisado completo
- `backend/tests/test_workspaces_migration.py` (122 líneas) — revisado completo
- `backend/tests/test_workspaces_models.py` (399 líneas) — revisado parcial (primeras 150 líneas)
- `backend/tests/test_workspaces_routes_crud.py` (464 líneas) — revisado parcial (primeras 200 líneas)
- `shared/workspaces-types.ts` (74 líneas) — revisado completo
- `src/services/workspacesApi.ts` (134 líneas) — revisado completo
- `src/pages/Workspaces/*.tsx` (4 archivos, ~500 líneas) — revisados completos
- `src/components/workspaces/**` (6 archivos, ~500 líneas) — revisados completos
- `src/components/Sidebar.tsx`, `SidebarIcons.tsx` — revisados completos
- `src/App.tsx`, `backend/server.py` — revisados completos
- `package.json` — revisado; UNFREEZE_ACTIVE confirmado presente con autorización explícita
- Tests frontend (4 archivos, ~400 líneas) — revisados parcialmente

---

## 3. Lo que no hice y por qué

- No revisé `test_workspaces_models.py` completo (399 líneas) ni `test_workspaces_routes_crud.py` completo (464 líneas). Los patrones observados en las primeras líneas son consistentes con los demás tests del módulo. Riesgo residual: podría haber assertions genéricas o casos faltantes no detectados.
- No medí contraste WCAG exacto de la paleta `authorColors.ts` instrumentalmente. El código afirma cumplimiento AA sobre `#0F1419`; no lo verifiqué con herramienta de medición.
- No ejecuté los tests ni el build (rol de code-reviewer, no de qa-tester).

---

## 4. Incertidumbres

El hallazgo más incierto es la clasificación de BLOQ-C1 (contrato roto API/frontend). Lo clasifiqué como bloqueante funcional (no bloqueante crítico de seguridad), lo que da WARN en lugar de FAIL automático. Es posible que el builder lo haya documentado como deuda conocida del scaffolding con algún workaround que no está en el diff del código — no leí los reportes del builder ni del qa-tester para mantener la revisión ciega. El truth-auditor deberá cruzar esto contra esos reportes y ejecutar el endpoint directamente con curl para confirmar el comportamiento real.

---

## 5. Quality Score

### Desglose

| Categoría | Puntos Base | Penalización | Puntos Finales |
|-----------|-------------|-------------|----------------|
| Seguridad | 25 | -4 | 21 |
| Manejo de errores | 15 | -2 | 13 |
| Null safety | 15 | -2 | 13 |
| Convenciones | 10 | -1 | 9 |
| Accesibilidad | 10 | -1 | 9 |
| Tests | 15 | -2 | 13 |
| Impacto código existente | 10 | -5 | 5 |
| **Total** | **100** | **-17** | **83** |

### Banda: WARN (83/100)

No hay bloqueante crítico de seguridad (sin credenciales hardcoded, sin archivos frozen tocados sin autorización). El bloqueante funcional BLOQ-C1 impide que el módulo funcione en práctica pero no activa FAIL automático por las reglas del protocolo.

---

### Hallazgos clasificados

#### BLOQUEANTE funcional

**BLOQ-C1 — Contrato roto API/frontend en tres endpoints de listado**

El backend retorna arrays directos; el frontend los consume como objetos envueltos:

- `GET /workspaces` → backend: `return result` (lista Python) / frontend: `data.workspaces` (undefined)
- `GET /workspaces/{id}/members` → backend: `return [_member_to_dict(m) ...]` / frontend: `membersData.members` (undefined)
- `GET /workspaces/{id}/versions` → backend: `return [_version_to_dict(v) ...]` / frontend: espera `{ versions: [...] }`

Efecto en runtime: `WorkspacesList` siempre muestra empty state; `WorkspaceEditor` crashea al intentar acceder a `membersData.members`.

Opciones de corrección (no mi rol elegir): (a) backend envuelve las respuestas en `{ workspaces: [...] }`, `{ members: [...] }`, `{ versions: [...] }`; o (b) frontend lee el array directo.

Debe corregirse antes de Capa 4 (deploy a preview).

---

#### Recomendados (abordar en iteración posterior, máximo 1 semana)

**RECOMENDADO-C2** — `AUTOINCREMENT` en DDL fallback de `migrations.py` (líneas ~480, 497, 535) es sintaxis SQLite-only. En PostgreSQL el equivalente es `SERIAL` o `GENERATED ALWAYS AS IDENTITY`. Si el fallback se ejecuta en producción antes de que `Base.metadata.create_all()` haya creado las tablas, la migración falla. El ORM SQLAlchemy es correcto (`Integer, primary_key=True, autoincrement=True` se traduce bien); el DDL manual no lo es.

**RECOMENDADO-S1** — `shareLinkToken` expuesto en la respuesta de `GET /workspaces/{id}` a cualquier miembro incluyendo viewers. El token permite generar invitaciones; un viewer no debería tenerlo. Omitir del dict serializado o restringir a rol owner.

**RECOMENDADO-S2** — Oracle de existencia de usuarios en `POST /workspaces/{id}/members`: el mensaje `"Usuario no encontrado con ese email"` confirma que el email no existe en la plataforma. Generalizar el mensaje a algo como `"No se pudo agregar al usuario. Verifica el email."`.

**RECOMENDADO-E1** — Sin timeout en `apiFetch` en `workspacesApi.ts`. En conexiones lentas (entorno universitario), una petición colgada deja la UI en "Cargando..." indefinidamente. Agregar `AbortController` con límite de 30 segundos.

**RECOMENDADO-N1** — `setMembers(membersData.members)` en `WorkspaceEditor.tsx` sin fallback defensivo. Si el contrato está mal (BLOQ-C1) o si el backend retorna estructura inesperada, `membersData.members` puede ser `undefined`. Cambiar a `setMembers(membersData.members ?? [])`.

**RECOMENDADO-T1** — Tests de `workspacesApi.test.ts` verifican que `fetch` se llama con los headers correctos pero no verifican el parsing de la respuesta. Un test que verificara `expect(result.workspaces).toHaveLength(0)` habría detectado BLOQ-C1 antes de llegar a revisión.

**RECOMENDADO-CV1** — `window.prompt('URL del enlace:')` en `Toolbar.tsx` línea 100. Bloqueante, no accesible, deshabilitado en algunos navegadores móviles. El CLAUDE.md §18.7 acepta esta deuda para bloque inaugural, pero debe marcarse con un TODO formal con fecha y dueño asignado.

---

#### Notas

**NOTA-S3** — El endpoint `GET /workspaces/invite/{token}` requiere JWT. En un flujo real de invitación por link compartido, el usuario podría no estar autenticado aún. No es un bug hoy (la generación de tokens y el flujo completo van en 2d), pero el diseño debe contemplarlo explícitamente.

**NOTA-E2** — Feedback de error al borrar workspace aparece en el banner global de la página, no en la card específica. Funcional pero subóptimo en UX para errores aislados.

**NOTA-N2** — Type cast `(options.headers as Record<string, string> | undefined)` en `apiFetch`. Seguro en contexto pero podría reemplazarse con spread condicional idiomático.

**NOTA-T2** — Smoke tests de `WorkspacesList` sin `waitFor` para verificar el estado async tras la carga. Solo verifican que el componente no crashea en render inicial.

---

### Confirmaciones positivas

1. **Control de acceso sin excepciones**: `get_current_user` está en todos los endpoints sin excepción. La jerarquía owner/editor/viewer se implementa con whitelist explícita. No se puede asignar rol 'owner' por API. Verificado con grep y 7 tests que cubren todos los vértices de la jerarquía.

2. **Accesibilidad de formularios por encima del estándar**: `CreateWorkspaceDialog` tiene `htmlFor/id` en todos los inputs, `aria-modal`, `aria-labelledby`, Escape para cerrar, `autoFocus` y `aria-pressed` en botones toggle. El toolbar tiene `role="toolbar"` con label. Mejor que la mayoría de páginas anteriores del proyecto.

3. **Toolbar con estado sincronizado**: `Toolbar.tsx` usa `editor.registerUpdateListener` con `editorState.read(updateToolbar)` para sincronizar el estado visual de Bold/Italic/Underline con la selección real. `aria-pressed` refleja el estado real. La sincronización es idiomática para Lexical.

4. **Test de regresión de hash en authorColors**: el test verifica que el color para `'user-abc-123'` es siempre el mismo en 100 iteraciones y que 50 IDs distintos producen al menos 10 colores distintos. Si la función de hash cambia en el futuro, el test falla alertando que los colores de autor cambiarían para usuarios existentes. Diseño de test de regresión correcto.

5. **Migración idempotente documentada y testeada**: `migrations.py` usa `inspector.has_table()` antes de cada `CREATE TABLE`. `test_migrate_es_idempotente` lo valida explícitamente con segunda ejecución. El conjunto de tablas no cambia entre primera y segunda corrida.

6. **Separación scaffolding/funcionalidad activa**: las zonas de placeholder (Athena, Yjs, rúbrica) usan `aria-disabled="true"` y clases `ws-placeholder-*`, sin simular funcionalidad no implementada. El usuario ve qué está disponible y qué viene.
