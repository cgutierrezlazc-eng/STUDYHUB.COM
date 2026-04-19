# Reporte Capa 5 — gap-finder — Bloque 2 Workspaces v1

**Agente**: gap-finder (persistido por Tori main loop)
**Fecha**: 2026-04-19
**Branch**: `bloque-2d-features` HEAD `6200a7d`
**Scope**: 2d.1 APA + 2d.3 KaTeX + 2d.6 Rúbrica + 2d.7 Export + 2d.8 Comentarios

---

## Resumen ejecutivo

**4 CRÍTICOS detectados por gap-finder — 3 ya fixeados por Tori main loop, 1 en curso (legal).**

| Severidad | Cantidad | Estado |
|---|---|---|
| CRÍTICO | 4 | 3 fixeados + 1 legal en curso |
| MODERADO | 5 | Para iter-2 |
| RECOMENDADO | 4 | Para iter-2 |
| INFORMATIVO | 3 | — |

---

## CRÍTICOS

### CRÍTICO-1 — Filtro "Mencionados a mí" rota (FIXEADO)

**Antes**: Modelo `WorkspaceComment` sin columna `mentions`. `_comment_to_dict` no retornaba menciones. `create_comment` devolvía `mentions` solo en POST pero nunca persistía. `list_comments` retornaba sin mentions. Filtro frontend `c.mentions?.includes(currentUser.userId) ?? false` siempre false.

**Fix aplicado** (commit `6200a7d`):
- Columna `WorkspaceComment.mentions_json TEXT` agregada
- Migración auto en `_ensure_columns`
- `_comment_to_dict` deserializa + retorna `mentions: list[str]`
- `create_comment` + `patch_comment` serializan mentions en JSON antes persistir
- 2 tests nuevos verdes: `test_mentions_persisten_y_vuelven_en_get`, `test_patch_actualiza_mentions`

### CRÍTICO-2 — apt.txt ausente (FIXEADO)

**Antes**: Render no tiene `libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info`. WeasyPrint retornaría 501 en todas las llamadas.

**Fix aplicado**: Creado `/apt.txt` con las 6 librerías. Render lo lee en el deploy.

### CRÍTICO-3 — C1 sin nota de mitigación (FIXEADO)

**Antes**: `docs/pendientes.md:19-26` entrada C1 activa sin indicar que el 2d.7 cerró el vector SSRF para endpoints V2.

**Fix aplicado**: Entrada C1 actualizada con "MITIGACIÓN PARCIAL 2026-04-19 commit 4955a96" explicando el nuevo flujo V2 seguro + defensa en profundidad + 15 tests seguridad. Indica que C1 persiste solo en V1 mientras xhtml2pdf exista.

### CRÍTICO-4 — legal-docs-keeper 2d.7 + 2d.6 ausentes (EN CURSO)

**Estado**: legal-docs-keeper arrancado para 2d.7 Export (retención contenido exportado, metadatos, transferencia a dispositivo, derechos sobre contenido). 2d.6 Rúbrica queda pendiente — Cristian decide si requiere audit legal adicional (documentos subidos por usuarios con posibles datos de profesores).

---

## MODERADOS (iter-2)

- **MOD-1** `ExportModal.tsx` sin test dedicado (cobertura 0%)
- **MOD-2** CI instala solo `libcairo2-dev pkg-config`, no el stack WeasyPrint completo → tests aceptan 501 como éxito
- **MOD-3** `rubric_parser.py` + `apa_validator.py` sin logging (excepciones silenciosas en producción)
- **MOD-4** Snapshot `docs/sessions/2026-04-19-snapshot-bloque-2d-*.md` ausente (política contexto)
- **MOD-5** APA 7 sin cobertura: autor corporativo (MINEDUC, OCDE, APA) + múltiples obras mismo año (2020a/2020b)

## RECOMENDADOS (iter-2)

- **REC-1** `workspaces_export.py` importa función privada `_check_access` — frágil
- **REC-2** ExportModal no distingue 501 (infra) de 500 (bug) en mensaje UX
- **REC-3** Rúbrica con 0 items parseados no comunica resultado al usuario
- **REC-4** Docstring de `workspaces_routes.py:10` desactualizado

## INFORMATIVOS

- **INF-1** Archivos candidatos a FROZEN al cerrar Capa 7 (workspaces_export, apa_validator, rubric_parser, ExportModal, CitationsPanel, etc.)
- **INF-2** collab_routes.py V1 SSRF confirmado (ya detectado por code-reviewer R1)
- **INF-3** ESLint warnings "imports not used" en ThreeZoneLayout son falso positivo

---

## 4 secciones CLAUDE.md

### 1. Lo que se me pidió
Auditoría estructural gap-finder Capa 5 del Bloque 2 v1. 12 áreas. Umbral: >0 CRÍTICO = BLOQUEADO.

### 2. Lo que efectivamente hice
7 reportes previos leídos. 25+ archivos auditados. Comandos con salida literal: `git log/diff`, `ls apt.txt`, `ls docs/sessions/`, greps sobre logging + TODOs + mentions columns. 4 CRÍTICOS detectados no reportados por code-reviewer ni truth-auditor.

### 3. Lo que no hice y por qué
- No busqué TODO/FIXME en frontend vía Bash (denegado; usé Grep como alternativa)
- No verifiqué Render dashboard (sin acceso; CRÍTICO-2 podría bajar a MODERADO si apt.txt ya estuviera configurado por Cristian)
- No leí completo test_apa_validator.py (337 líneas)
- No ejecuté pytest --cov

### 4. Incertidumbres
- CRÍTICO-1 podría tener migración no aplicada (no encontré evidencia); si existiera, bajaría a MODERADO
- CRÍTICO-2 podría tener paquetes configurados en Render dashboard sin archivo en repo
- Bloqueante mypy del truth-auditor no verifiqué que fuera fixeado después del reporte (de hecho sí — commit `ee74590`)

---

## Veredicto

**BLOQUEADO para deploy final** — al emitir este reporte.

**Tras fixes aplicados por Tori main loop** (commits `6200a7d` + `ee74590`):
- CRÍTICO-1 ✅
- CRÍTICO-2 ✅
- CRÍTICO-3 ✅
- CRÍTICO-4 🟡 en curso (legal-docs-keeper)

Estado actualizado: **1 CRÍTICO en curso (legal)**. Una vez llegue el reporte legal y Cristian apruebe, bloque listo para Capa 6 inspección humana o merge directo según política `feedback_bloque2_construccion_completa.md`.
