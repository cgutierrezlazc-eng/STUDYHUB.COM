# Reporte Capa 3 — truth-auditor — C1 SSRF V1 Hardening

**Agente**: truth-auditor (persistido por Tori main loop)
**Fecha**: 2026-04-19
**Branch**: `hardening-c1-ssrf-v1` HEAD `cced994`
**Base**: main post-merge Bloque 2 v1 (`192f1b6`)

---

## Resumen ejecutivo

**Score: 89/100 — PASS**. Tarea aprobada con 1 observación crítica para Capa 4.

**BLOQUEANTE CI detectado** (mismo que code-reviewer): los 2 tests de spy `test_endpoint_invoca_sanitize_html` + `test_endpoint_invoca_inline_remote_images` fallarán en CI con `AttributeError` porque `collab_routes.py:468` tiene el import LOCAL a la función, no a nivel de módulo. `patch("collab_routes.sanitize_html")` no tiene atributo para parchear.

**Verificación empírica**:
```
python3.11 -c "import collab_routes; print(hasattr(collab_routes, 'sanitize_html'))"
→ False
```

---

## Verificaciones (output literal)

```
git log main..hardening-c1-ssrf-v1       → cced994 (1 commit único)
git diff --stat main...                  → 1 file, 481 inserts
git diff -- collab_routes.py              → vacío (no tocado)
git diff -- workspaces_export.py          → vacío (no tocado)
git diff -- requirements.txt              → vacío (no tocado)
git diff -- hr_routes.py                  → vacío (FROZEN intacto)

pytest tests/test_collab_export_security  → 16 passed, 4 skipped in 2.93s
pytest --tb=no -q (suite)                 → 230 passed, 4 skipped
ruff check tests/...                      → All checks passed!
ruff format --check                       → 1 file already formatted
grep -c "def test_" tests/...             → 20

.github/workflows/verify-build.yml líneas 56-64 → instala libcairo2-dev +
  pip install requirements.txt (incluye xhtml2pdf) → los 4 tests skipif
  SÍ correrán en CI
```

---

## Quality score

| Categoría | Pts | Otorgado | Razón |
|---|---|---|---|
| Archivos afirmados vs reales | 15 | 15 | 1 archivo nuevo confirmado, 481 inserts |
| Comandos re-ejecutados | 20 | 17 | -3: no pude instalar xhtml2pdf local (deps nativas) |
| Endpoints funcionando | 15 | 10 | -5: razonamiento extendido detectó 2 spies rotos en CI |
| Frozen intactos | 10 | 10 | hr_routes, collab_ws, otros frozen intactos |
| Issues actualizados | 10 | 10 | Builder NO tocó pendientes/BLOCKS/FROZEN por instrucción |
| Commits coherentes | 10 | 10 | cced994 scope correcto, mensaje detallado, atómico |
| Env vars | 10 | 10 | Sin vars nuevas |
| Criterio §7 del plan | 10 | 7 | -3: plan pedía "6 tests", builder entregó 20 (más cobertura pero desalineado). Spies rotos no cumplen "sin regresión en CI" |
| **TOTAL** | **100** | **89** | **PASS** |

---

## Hallazgo del razonamiento extendido

**El builder declaró incertidumbre correctamente pero su análisis técnico subyacente era incorrecto**. Asumió que el import estaba a nivel de módulo; verificación empírica confirma que es local a la función `export_pdf`.

Esto NO es mentira — es análisis técnico incompleto declarado como incertidumbre. Pero el impacto operativo es real: **CI rojo al push hasta arreglar**.

---

## Observaciones pre-Capa 4

1. **Ajustar 2 tests de spy antes del push**. Opciones:
   - Mover import a nivel de módulo en `collab_routes.py` (toca archivo que quedará FROZEN)
   - Cambiar `patch("collab_routes.sanitize_html")` → `patch("workspaces_export.sanitize_html")` + re-inyección
   - Eliminar los 2 tests de spy (quedan 18 tests cubriendo sanitización + HTTP funcional)

2. **Desalineamiento plan vs ejecución**: plan §7 pedía "6 tests", builder entregó 20. Reconciliar docs.

3. **ruff format deuda preexistente** (fuera scope): 66 archivos backend con desformato — bloque futuro de hardening.

---

## 4 secciones CLAUDE.md

### 1. Lo que se me pidió
Cruzar reportes vs realidad + razonamiento extendido sobre spies + scoring.

### 2. Lo que efectivamente hice
10+ comandos ejecutados con output literal. 6 reportes/archivos leídos. Verificación empírica de AttributeError en patch. Análisis correcto vs incorrecto del builder (I1).

### 3. Lo que no hice y por qué
- No ejecuté tests HTTP con xhtml2pdf (sin deps nativas local)
- No revisé código producción línea por línea (solo diff vacío confirmado)
- No toqué pendientes/BLOCKS/FROZEN (no es mi scope)

### 4. Incertidumbres
- `patch(wraps=...)` podría tener comportamiento distinto al patch sin wraps (confianza alta pero no 100%)
- 2 tests funcionales no-spy podrían fallar en CI por problemas ortogonales del fixture
- No verifiqué línea por línea que el fix en `192f1b6` está completo

### 5. Quality score
**89/100 — PASS con 1 observación crítica CI pre-Capa 4.**
