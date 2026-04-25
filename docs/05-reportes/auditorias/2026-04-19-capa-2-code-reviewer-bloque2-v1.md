# Reporte Capa 2 — code-reviewer — Bloque 2 Workspaces v1

**Fecha**: 2026-04-19
**Branch**: `bloque-2d-features`
**Método**: Read + Grep (persistido por Tori main loop tras completar el agente)

---

## Resumen ejecutivo

**Score: 77/100 — WARN. 0 bloqueantes críticos. 5 recomendados reales.**

| Categoría | Máx | Otorgado |
|---|---|---|
| Seguridad | 25 | 19 |
| Manejo errores | 15 | 11 |
| Null safety | 15 | 13 |
| Convenciones | 10 | 9 |
| Accesibilidad | 10 | 6 |
| Tests | 15 | 11 |
| Impacto código existente | 10 | 8 |
| **TOTAL** | **100** | **77** |

---

## Bloqueantes críticos

**NINGUNO.** Sin credenciales hardcoded, archivos frozen tocados, ni vulnerabilidades críticas sin mitigación en el código nuevo.

---

## Recomendados (iter-2)

### R1 — xhtml2pdf V1 legacy sigue activo con SSRF
`backend/collab_routes.py:455-503` usa `xhtml2pdf` sin sanitización de imágenes. Backend-builder 2d.7 declaró C1 cerrada pero solo para el nuevo router. `xhtml2pdf` sigue en `requirements.txt`. Si `collab_routes.py` está registrado en `server.py`, vector SSRF persiste para endpoints V1 `/collab/*/export`. **Fix**: eliminar `xhtml2pdf` + documentar que V1 export está desactivado o reemplazarlo por el nuevo módulo.

### R2 — 5 catch vacíos en CommentsPanel
`src/components/workspaces/Comments/CommentsPanel.tsx` líneas 109, 133, 153, 166, 177 — handlers `handleCreateComment`, `handleSubmitReply`, `handleSubmitEdit`, `handleDelete`, `handleResolve` tienen `.catch(() => {})` que silencian errores de escritura. Usuario queda con estado local inconsistente sin feedback. **Fix**: toast/banner de error por operación fallida + revertir estado optimista.

### R3 — Upload rúbrica sin validación MIME real
`backend/workspaces_routes.py::_extract_text_from_upload()` detecta tipo solo por extensión del filename. Archivo renombrado `.pdf` con contenido malicioso llega a `pdfplumber`. `filetype>=1.2.0` ya está en `requirements.txt`. **Fix**: usar `filetype.guess()` sobre los primeros bytes antes de parsear.

### R4 — RubricUploadModal sin focus trap ni Escape
`src/components/workspaces/Rubric/RubricUploadModal.tsx` no tiene `useEffect` con keydown listener (para Escape) ni focus al primer elemento al montar. ExportModal sí los tiene. **Fix**: copiar patrón de ExportModal.

### R5 — CitationsPanel muestra id técnico en lugar del texto
`src/components/workspaces/Citations/CitationsPanel.tsx:94` — `<span className="ws-citations-raw">{result.id}</span>` muestra `"citation-0"`, `"citation-1"` etc. en lugar del `raw` de la cita. El backend recibe `raw` pero NO lo devuelve en `CitationValidationResult`. **Fix**:
- Opción A: backend devuelve `raw` en la respuesta + añadir al tipo TS.
- Opción B: frontend mantiene mapa `{id → raw}` localmente al enviar.

---

## Notas (baja prioridad)

- **S2** bleach en modo legado (review en upgrade 7.x)
- **S4** sin límite tamaño upload rúbrica
- **NS3** citations endpoint sin `max_items` (batch puede ser arbitrario grande)
- **C2** `__import__("datetime")` antipattern en test_workspaces_comments.py:153
- **T2** `handleApplySuggestion` en CitationsPanel no propaga al editor Lexical (solo estado local)
- **T3** assertion débil en test de sugerencia

---

## Confirmaciones positivas

1. **SSRF en workspaces_export.py bien resuelto**: whitelist dominios + blacklist IPs RFC1918 + HTTPS obligatorio + `follow_redirects=False` + timeout 5s + limit 5MB + bleach. 15 tests de seguridad cubren 169.254.x, file://, gopher://, IPs internas, dominios externos.
2. **Auth verificada en todos los endpoints nuevos** con `_check_access` y rol apropiado.
3. **Tests del backend robustos** (24 APA, 15 rubric, 12 comments, 15 export-security, 9 export-func, 6 citations, 8 rubric-endpoint).
4. **KaTeX con `dangerouslySetInnerHTML` justificado** — KaTeX sanitiza internamente, input es LaTeX (no HTML arbitrario), `throwOnError: false` evita crasheos.
5. **Metadatos PDF/DOCX limpiados** — `core_properties.author=""`, `last_modified_by=""` explícito.

---

## 4 secciones CLAUDE.md

### 1. Lo que se me pidió
Revisión adversarial ciega del diff 2d en branch `bloque-2d-features`. SSRF + XSS + auth + tests + accesibilidad. Score con banda.

### 2. Lo que efectivamente hice
Read completo de 25 archivos (backend py + frontend tsx + tests + requirements + frozen-files). 14 greps adversariales. Identificación de 5 recomendados + 6 notas. Cruzé `requirements.txt` con `collab_routes.py` para detectar xhtml2pdf residual.

### 3. Lo que no hice y por qué
- Tests frontend `src/__tests__/workspaces/` no leídos (sin Bash para enumerar; asumo cobertura según reportes builders)
- `LexicalEditor.tsx`, `Toolbar.tsx`, `MathPlugin.tsx`, `MathToolbarButton.tsx`, `apaFormat.ts`, `ReferenceFormatter.tsx` no leídos por límite tiempo.
- Contenido de `test_workspaces_export_security.py` línea 203+ truncado.

### 4. Incertidumbres
- R2 catch vacíos: clasifiqué recomendado. Podría ser bloqueante si Cristian considera crítico que el usuario vea error al fallar comentarios.
- xhtml2pdf/collab_routes.py: si `collab_router` NO está registrado en `server.py`, R1 baja a nota. No verifiqué (sin Bash).

### 5. Quality score
**77/100 — WARN**. Detalle por categoría arriba. Sin bloqueantes. 5 recomendados a fixear antes del cierre Capa 7.
