# Reporte Capa 1 — backend-builder — Sub-bloque 2c Athena IA

**Agente**: backend-builder (completado; reporte escrito por Tori main loop tras verificación literal)
**Branch**: `bloque-2c-athena`
**Commits**:
- `18aeae2` feat(athena): agregar clave athena_workspace a tier-limits.json y _UPGRADE_MESSAGES
- `a0484e1` feat(athena): implementar backend Athena IA — 8 endpoints con TDD (Fases 2-7)

---

## 1. Lo que se me pidió

Implementar Fases 1-4 del plan `docs/plans/bloque-2-workspaces/2c-athena.md`:
- Config `shared/tier-limits.json` (athena_workspace free 3/daily, pro -1)
- `backend/tier_gate.py` +1 entrada `_UPGRADE_MESSAGES`
- `backend/server.py` +2 líneas `include_router`
- `backend/workspaces_athena.py` nuevo: 8 endpoints con TDD
- `backend/tests/test_workspaces_athena.py` nuevo: ~20 tests con `monkeypatch` sobre `call_konni`
- Verificación `ruff check`, `ruff format --check`, `pytest`

---

## 2. Lo que efectivamente hice

**Archivos creados/modificados (rutas absolutas)**:
- `/Users/cristiang./CONNIKU/shared/tier-limits.json` — agregadas claves `athena_workspace` en `ai` de free (limit 3 daily) y pro (limit -1 daily)
- `/Users/cristiang./CONNIKU/backend/tier_gate.py` — +1 entrada en `_UPGRADE_MESSAGES` con copy "Has alcanzado tu cupo diario de Athena. Mejora a Conniku Pro para interacciones ilimitadas."
- `/Users/cristiang./CONNIKU/backend/server.py` — 2 líneas (import + include_router del workspaces_athena_router)
- `/Users/cristiang./CONNIKU/backend/workspaces_athena.py` — **nuevo archivo, 685 líneas**. Contiene prompt Athena literal del commit `d0c0e49`, 8 endpoints (POST /workspaces/{id}/athena con action={analyze|chat|suggest}, GET chats, DELETE chats, PATCH suggestion, DELETE suggestion, GET usage, GET ping), `tier_gate("athena_workspace")` Depends, persistencia `WorkspaceAthenaChat`/`Suggestion`/`AthenaUsage`, fallback detection con strings canónicos de `konni_engine.py`, rate-limit técnico 20/min in-memory por user_id.
- `/Users/cristiang./CONNIKU/backend/tests/test_workspaces_athena.py` — **nuevo, 908 líneas**. 28 tests con `monkeypatch` sobre `call_konni`.

**Verificación ejecutada (output literal)**:

```
$ cd backend && python3.11 -m pytest tests/test_workspaces_athena.py --tb=no -q
............................                                             [100%]
28 passed in 3.31s

$ ruff check backend/workspaces_athena.py backend/tier_gate.py backend/server.py
All checks passed!

$ ruff format --check backend/workspaces_athena.py
1 file already formatted
```

**28/28 tests verdes. Ruff check limpio. Ruff format OK.**

**Cobertura de los 28 tests** (por lectura del archivo):
- POST analyze ok + sin selección 400
- POST chat ok + message vacío 400 + history recortado a últimos 10
- POST suggest ok + sin selección 400
- Usuario no-miembro 403
- Free sin cupo 429 con `_UPGRADE_MESSAGES`
- Pro ilimitado
- Rate limit técnico 21 req/min → 429
- Fallback de Claude detectado → 503 (no pasa el string al usuario)
- `AthenaUsage` solo se registra cuando call exitoso
- Persiste `WorkspaceAthenaChat` con role user + athena
- Persiste `WorkspaceAthenaSuggestion` con status=pending
- GET chats retorna solo del usuario actual (aislamiento privado)
- PATCH suggestion status=applied
- PATCH suggestion status=rejected con motivo
- DELETE chats limpia historial
- GET usage retorna `{plan, used, limit, remaining, window_key, resets_at}`
- GET ping ok
- Auth fallida 401

**Decisiones adicionales tomadas sin preguntar a Cristian** (por política 2b→2c→2d sin Capa 6 intermedia):
- Free limit = `3/daily` (decidido por Tori main loop, en línea con `chat_messages: 10/daily` y `guide: 1/weekly`)
- MAX_TOKENS=1024 de `konni_engine.py` aceptado como tope. NO modificar `konni_engine.py` bajo ningún pretexto.

---

## 3. Lo que no hice y por qué

1. **No escribí este reporte durante la ejecución del agente**. El agente backend-builder reportó "bloqueo Bash" al final aunque efectivamente había completado el trabajo (commits presentes, 28/28 tests passing). Tori main loop verificó el estado real post-agente y escribió este reporte con output literal.
2. **No toqué `backend/konni_engine.py`**. Importé `call_konni` y `CONNECTION_ERROR_MESSAGE` / `RATE_LIMIT_ERROR_MESSAGE` sin modificar su código fuente. Plan maestro §8 lo prohibe.
3. **No toqué `backend/database.py`**. Los 3 modelos (`WorkspaceAthenaChat`, `WorkspaceAthenaSuggestion`, `AthenaUsage`) ya existen del 2a, solo se consumen.
4. **No agregué `mypy` a verificación** — no está instalado local. CI lo correrá.
5. **No hice smoke test con servidor real curl** — se cubre con `TestClient.post` en los 28 tests (servidor real in-process).

---

## 4. Incertidumbres

1. El rate-limit técnico 20/min está implementado con `_minute_limits: dict[str, list[float]]` in-memory. En multi-worker (gunicorn con N workers) cada worker tiene su propia ventana → un usuario podría hacer ~N*20/min. Documentado en plan §D14 como "permisivo en multi-worker, aceptable por no ser defensa crítica (tier_gate hace la real)".
2. `tier_gate.check_and_increment` gasta cupo **antes** de llamar a Claude. Si Claude falla después, el cupo se gastó injustamente. Aceptado por paridad con Konni existente; evaluar en Capa 6 si genera fricción real.
3. No verifiqué en un navegador real si el endpoint `POST /workspaces/{id}/athena` con el prompt literal devuelve contenido coherente de Claude — los tests usan `monkeypatch` que mockea `call_konni`. Verificación real queda para la inspección final del módulo (Capa 6 del Bloque 2 completo).
4. El detector de fallback compara contra strings canónicos de `konni_engine.py`. Si el `call_konni` cambia su copy de fallback en un refactor futuro, este detector queda desincronizado. Documentado en código como comentario.
