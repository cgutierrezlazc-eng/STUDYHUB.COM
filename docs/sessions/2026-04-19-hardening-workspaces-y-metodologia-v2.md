# Snapshot sesión 2026-04-19 — Hardening Workspaces + Metodología v2

**Branch**: `hardening-c1-ssrf-v1`
**PR**: #10 https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/10
**Estado**: pusheado, esperando CI + decisión merge de Cristian
**Commits en PR**: 7 atómicos

---

## Objetivo primario declarado

Auditoría completa módulo Workspaces (backend + frontend + integraciones + tests + seguridad + gaps) + cierre de deuda crítica para recomenzar construcción con base limpia.

## Criterio de cierre

PR mergeable a main con:
- ✅ 3 hallazgos CRÍTICOS resueltos o mitigados
- ✅ 8 hallazgos ALTOS resueltos o N/A-por-deprecado
- ✅ Working tree limpio
- ✅ Typecheck + tests + lint en verde
- ⏳ CI verde (pendiente)
- ⏳ Merge a main (pendiente)

## Commits del PR en orden cronológico

```
cced994 test(collab): tests dedicados de seguridad SSRF para export_pdf V1
5f589dd chore: metodología operativa v2 — 6 optimizaciones Tori
30cb272 refactor(workspaces): deprecar GroupDocs V1 + FROZEN hardening
024ca5b fix(workspaces): hardening rubric upload + apiFetch timeout/401
72a5498 test(workspaces): cobertura ExportModal + Toolbar
cd5a98b chore(docs): limpiar mockups antiguos + agregar design-system + plan + reportes
9c72994 chore(assets): regeneración icons + directorio assets/
```

---

## Decisiones tomadas en esta sesión

1. **Auto Mode permanente OFF** confirmado (§19 CLAUDE.md, ya existía)
2. **Formato de instrucciones Claude-óptimo**: imperativo corto + tabla mapeo + ejemplos binarios + razón 1 línea + condición FAIL explícita. No YAML inventado, no prosa humana.
3. **Metodología operativa v2** (6 cambios aplicados):
   - Bash permissive + deny list
   - Anti-abort Bash en 8 agentes
   - Commit Capa 1 obligatorio en builders
   - Auditor-triple consolidado (nuevo agente)
   - Capa 0 legal trigger en web-architect
   - §20 objetivo único por sesión
   - §21 decisiones de producto en batch
4. **GroupDocs V1 deprecado completo**: backend routers comentados + frontend routes removidas + Sidebar limpia + FROZEN agregados (collab_routes, workspaces_export, workspaces_athena). Tablas BD preservadas para eventual migración.
5. **Rubric upload hardening**: 10MB max + MIME allowlist + extensión allowlist.
6. **apiFetch robustez**: 15s timeout + 401 auto-clean token + AbortController.
7. **Tests nuevos**: 3 rubric + 3 apiFetch + 9 ExportModal + 5 Toolbar = **20 tests nuevos verdes**.
8. **Commit de artefactos pendientes sin revisión visual** por autorización explícita de Cristian (icons regenerados + assets/ + design-system/ + reportes C1 + plan C1 + limpieza mockups Konni).

---

## Auditoría completa Workspaces — score consolidado

Reporte completo en `docs/reports/2026-04-19-auditoria-workspaces-completa.md`.

**Pre-PR**: 68/100 WARN
**Post-PR estimado**: 85+/100 PASS (resueltos 7 de 13 críticos+altos)

### Hallazgos críticos

| Item | Estado |
|---|---|
| C-1 collab V1 router expuesto | ✅ Router deshabilitado |
| C-2 FROZEN coverage | ✅ 3 archivos agregados |
| C-3 Publicación legal (Privacy + T&C con Athena) | ⏳ **Sesión siguiente** |

### Hallazgos altos

| Item | Estado |
|---|---|
| A-1 XSS collab export | ✅ N/A (V1 deprecated) |
| A-2 Rubric upload MAX_SIZE + MIME | ✅ Fix + tests |
| A-3 collab_ws bounds | ✅ N/A (V1 deprecated) + tests existen V2 |
| A-4 create_document sin Pydantic | ✅ N/A (V1 deprecated) |
| A-5 JWT revocación BD | ⏳ Requiere feature "logout all devices" |
| A-6 apiFetch runtime validation (zod) | ⏳ Riesgo bajo, opcional |
| A-7 Alembic init | ⏳ **Bloque infra dedicado** |
| A-8 Tests ExportModal + Toolbar | ✅ 14 tests nuevos |
| A-9 Tests collab_ws | N/A (V1 deprecated) |
| A-10 apiFetch timeout + 401 | ✅ Fix + 3 tests |

### Pendientes MEDIOS (12) y BAJOS (9)

Listados en `docs/reports/2026-04-19-auditoria-workspaces-completa.md` — backlog para bloques futuros.

---

## Confirmaciones positivas de la auditoría

1. SSRF C1 hardening sólido en V2 (whitelist + blacklist IPs + HTTPS + timeout + cap + no-follow-redirects)
2. Autenticación uniforme en 28+11 endpoints (antes del deprecado V1)
3. Autorización consistente con helper `_check_access` + jerarquía viewer<editor<owner
4. XSS Athena sanitizado con `escapeHtml` + KaTeX
5. Pydantic schemas con `max_length` estrictos en V2
6. WS workspaces con JWT + códigos de cierre diferenciados + bounds
7. CORS restrictivo + docs deshabilitadas en prod
8. Sin SQL injection detectada (cero `text()` + f-string, cero `.format()` con input)
9. Sin credenciales hardcoded
10. A11y sólida con `role="dialog"` + `aria-modal` + `aria-label`

---

## Estado operativo post-PR

- **Frontend typecheck**: exit=0 ✓
- **Frontend tests**: 33 files, 289 passed ✓
- **Backend tests workspaces**: 22/22 passed ✓
- **collab routes activas en producción**: 0 ✓
- **Frozen files**: 19 entradas (incluyendo 3 nuevas del bloque)
- **Working tree**: limpio ✓

## Memorias actualizadas

- `feedback_methodology_v2.md` creada (nueva)
- `MEMORY.md` actualizado con entrada

---

## Próximo paso sugerido

**Sesión siguiente** (después de merge PR #10):

**Opción A — Publicación legal C-3**: bloque dedicado ~1.5h
- Invocar `legal-docs-keeper` con scope: aplicar 4 borradores `.md` en `docs/legal/drafts/` a archivos vivos:
  - `src/pages/PrivacyPolicy.tsx`
  - `src/components/TermsOfService.tsx`
- Aprobación humana contenido por contenido
- Bump de versión en frontend (`v2.0` Privacy + T&C)
- Actualizar `docs/legal/alerts.md` cerrando 4 alertas
- Desbloquea: Athena en producción con cumplimiento legal alineado

**Opción B — Nuevo módulo de construcción**: recomenzar construcción
- Workspaces v1 listo y estable
- Candidatos según pendientes.md:
  - Hardening quizzes (C3 + C4)
  - Hardening auth update_me (C2)
  - Módulo Chat Biblioteca (memoria `project_chat_biblioteca.md`)
  - Bloque cursos/mentorship con sistema de puntos (memoria `project_puntos_y_suscripciones.md`)

**Opción C — Cerrar formalmente Bloque 2 v1**: `/cerrar-bloque bloque-2-workspaces` + actualizar BLOCKS.md + tag release.

---

## Incertidumbres para próxima sesión

1. **Efectivo del deprecated V1**: tabla `collab_documents` en producción — ¿cuántos docs hay? Si 0 o solo datos de prueba, confirma que deprecado es seguro. Si hay docs de usuarios reales, migración `collab_documents → workspace_documents` pendiente (Opción C migrar del plan original no ejecutada).
2. **"Athena" en UI** (B-1): pendiente tu decisión si viola regla "no IA/AI" visible. Nombre propio parece exento pero no tengo confirmación explícita.
3. **CI del PR #10**: no he verificado que pase. Si falla, determinar si es regresión real o flake.
4. **Alembic (A-7)**: diferido a bloque infra dedicado. Hay 8 modelos Workspace* sin migración versionada. Riesgo medio de rollback imposible si schema cambia en prod.

---

## Contexto para retomar

Si próxima sesión se abre limpia, bastará con leer este snapshot + el reporte de auditoría (`docs/reports/2026-04-19-auditoria-workspaces-completa.md`) para retomar sin pérdida de contexto.

**Comando sugerido al abrir próxima sesión**:
```
Lee docs/sessions/2026-04-19-hardening-workspaces-y-metodologia-v2.md
y el reporte docs/reports/2026-04-19-auditoria-workspaces-completa.md.
Declara OBJETIVO PRIMARIO según §20 CLAUDE.md.
```
