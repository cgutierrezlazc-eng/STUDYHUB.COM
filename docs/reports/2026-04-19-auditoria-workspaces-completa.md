# Auditoría completa módulo Workspaces — 2026-04-19

**Agentes**: 4 en paralelo (Explore backend + Explore frontend + general-purpose security + gap-finder)
**Branch**: `hardening-c1-ssrf-v1` HEAD `5f589dd`
**Scope**: Bloque 2 completo (2a + 2b + 2c + 2d.1/3/6/7/8) cerrado como v1

---

## Estructura del módulo

| Dimensión | Conteo |
|---|---|
| Backend archivos | 6 (3697 líneas) |
| Backend endpoints | 50 totales (27 routes + 8 athena + 2 export + 1 WS V2 + 11 collab V1 + 1 collab WS V1) |
| Backend modelos SQLAlchemy | 8 (WorkspaceDocument, Member, Version, Message, AthenaChat, AthenaSuggestion, AthenaUsage, Comment) |
| Backend tests | 13 archivos, 184 funciones `def test_` |
| Frontend páginas | 4 (WorkspacesList, WorkspaceEditor, WorkspaceInvite, WorkspaceSettings) |
| Frontend componentes | 29 archivos .tsx (~5904 líneas con páginas + service) |
| Frontend servicios | 1 (workspacesApi.ts, 579 líneas) |
| Frontend tests | 1 archivo (LexicalEditor.test.tsx) → 28 componentes sin test |
| Migraciones Alembic | 0 (solo SQL manual sin versioning) |

---

## Hallazgos por severidad

### CRÍTICOS (bloquean deploy a producción)

**C-1 — collab_router V1 con endpoints de export sigue registrado en server.py**
Evidencia: `server.py:290-291` incluye `collab_router`. Los endpoints `GET /doc/{id}/export/pdf` y `GET /doc/{id}/export/docx` (collab_routes.py:455-519) están accesibles. Aunque el fix C1 (sanitize_html + inline_remote_images) SÍ se aplicó al `export_pdf` de collab_routes, la existencia paralela V1+V2 duplica superficie de ataque.
Acción: verificar si V1 sigue siendo necesario; si no, comentar include_router. Si sí, confirmar que fix se aplicó a ambos paths.

**C-2 — workspaces_export.py + workspaces_athena.py no están en FROZEN**
Evidencia: `cat .claude/frozen-files.txt` → ninguna línea con estos archivos. Una edición accidental elimina la whitelist SSRF o el rate-limit Athena sin aviso del hook.
Acción: agregar a `.claude/frozen-files.txt`: workspaces_export.py, workspaces_athena.py, collab_routes.py (export_pdf L455-516).

**C-3 — 4 alertas legales abiertas en docs/legal/alerts.md**
- ALERTA-2C-1: Privacy Policy no declara procesamiento con Anthropic
- ALERTA-2C-2: T&C sin mencionar cuota Free 3/día Athena
- ALERTA-2C-3: retención indefinida de chat Athena sin declaración
- ALERTA-2D7-1: SSRF V1 (solapada con C-1)
Borradores existen en docs/legal/drafts/ pero sin publicación.
Acción: Cristian debe aprobar + publicar `2026-04-18-privacy-policy-2c-athena.md` y `2026-04-18-terms-of-service-2c-athena.md`.

**C-4 — SQL injection: NO DETECTADA** (confirmación positiva, mencionada aquí porque es búsqueda crítica que dio clean)

---

### ALTOS (semana corriente, antes de crecer usuarios)

**A-1 — XSS en collab export PDF via title/course_name**
`backend/collab_routes.py:496-498`: f-string interpola sin `html.escape()`. Título tipo `<style>@import url(...)</style>` puede romper contexto xhtml2pdf.
Fix: envolver en `html.escape(doc.title)`, `html.escape(doc.course_name)`. Aplicar también a export_docx (L519).

**A-2 — Rubric upload sin MAX_SIZE ni MIME check**
`backend/workspaces_routes.py:935-995`: `file.file.read()` sin límite + validación por extensión de `filename` (bypasseable). Vector OOM/DoS.
Fix: agregar `MAX_UPLOAD_SIZE` (ej: 10MB), validar `content_type` contra allowlist, leer streaming con cutoff.

**A-3 — collab_ws.py sin bounds (paridad faltante con workspaces_ws)**
`backend/collab_ws.py:158-172`: broadcast sin límite de tamaño. workspaces_ws tiene `MAX_BINARY_RELAY_BYTES=1MiB` y `MAX_CHAT_CONTENT_CHARS=4000` (L54-55). Un cliente autenticado puede amplificar mensajes gigantes.
Fix: replicar bounds. collab_ws.py está FROZEN → requiere /unfreeze.

**A-4 — `create_document(data: dict)` sin Pydantic schema**
`backend/collab_routes.py:88`: acepta dict crudo, accede con `data.get(...)` sin validación de longitudes.
Fix: crear `CreateDocumentSchema` Pydantic con max_length. collab_routes FROZEN.

**A-5 — WebSocket JWT sin verificación de revocación**
`backend/workspaces_ws.py:58-75`: decodifica localmente, solo valida firma/exp. Token revocado en BD sigue aceptándose.
Fix: validar sesión contra BD o lista de revocación. Defer si BD no tiene tabla de sesiones activa.

**A-6 — `workspacesApi.ts:55` cast `res.json() as Promise<T>` sin runtime validation**
JSON malformado causa crash silencioso.
Fix: validar con zod o schema antes de castear, O aceptar riesgo (tests en backend ya cubren contrato).

**A-7 — Sin Alembic; solo SQL manual**
8 modelos Workspace* sin migración versionada. Sin rollback, sin historial.
Fix: `alembic init` + generar migración inicial para modelos existentes.

**A-8 — ExportModal.tsx + Toolbar.tsx sin test (bug ALERTA-2D7-2 activo sin cobertura)**
Fix: crear `ExportModal.test.tsx` + `Toolbar.test.tsx`.

**A-9 — collab_ws.py sin tests directos**
No hay `test_collab_ws.py`. WebSocket V1 en producción sin cobertura.
Fix: crear suite mínima (conexión inválida, mensaje malformado, desconexión).

**A-10 — Timeout + JWT refresh faltantes en apiFetch**
`workspacesApi.ts`: sin timeout, sin manejo 401 → UX rota en latencia alta o token vencido.
Fix: agregar `AbortController` con timeout 10s + interceptor 401 → redirect login.

---

### MEDIOS (planificar próximo mes)

**M-1 — WebSockets sin validación de `Origin` header** — defensa en profundidad barata
**M-2 — Rate-limit Athena en memoria por worker** — efectivo `20*N_workers/min` (documentado como riesgo 5.7)
**M-3 — Sin rate-limit por usuario en REST endpoints** (comments, chat messages) — bot autenticado puede flooder
**M-4 — Enumeración de usuarios via add_member** (404 vs 409 distinguibles)
**M-5 — `AthenaUsage.tokens_*` registrados como 0** — métrica de billing incorrecta
**M-6 — `sanitize_html` + `inline_remote_images` sin test end-to-end** (solo tests de sintaxis)
**M-7 — Cobertura tests frontend 5%** (28/29 componentes sin test)
**M-8 — BLOCKS.md sin entrada del corte v1 Bloque 2**
**M-9 — Reportes capa-2/capa-3/capa-5 individuales de 2d.1/2d.3/2d.6/2d.7/2d.8 faltantes**
**M-10 — `_ALLOWED_REMOTE_IMG_DOMAINS` no incluye dominio Supabase Storage** (imágenes del editor eliminadas silenciosamente al exportar)
**M-11 — `except Exception:` sin logging en workspaces_ws.py:99,112 y workspaces_athena.py:680**
**M-12 — Handling inconsistente export: 500 vs 501 según tipo excepción** (workspaces_export.py:579-583)

---

### BAJOS (backlog general)

**B-1 — Mención "Athena" en UI** (AthenaPanel.tsx:135). Requiere decisión de Cristian si el nombre propio está exento de la regla "no IA/AI"
**B-2 — CSS fallback hardcoded `color: 'var(--error, #f38ba8)'`** (AthenaAnalyze, AthenaSuggestions)
**B-3 — backend/constants/ vacío** (solo `__init__.py`); pendiente C7 de pendientes.md
**B-4 — ExportModal checkboxes fantasma** — ya mitigado parcialmente con label "próximamente" según comentario en código
**B-5 — Math plugin sin validación LaTeX** — riesgo DoS bajo (KaTeX es sandboxed + `throwOnError:false`)
**B-6 — UpgradeModal sin disclaimers legales** (Ley 19.496 Art. 12b)
**B-7 — DOCX export placeholder** (HTML → párrafos planos sin formato) — documentado como v1 publicable, completo en 2d.10
**B-8 — WS descarta binario >1MiB sin notificar cliente** (cliente espera ACK que nunca llega)
**B-9 — Fallback detection Athena frágil** (prefijos hardcoded); si Anthropic cambia mensaje de error, expone crudo

---

## Confirmaciones positivas (10)

1. Autenticación uniforme: 28+11 endpoints con `Depends(get_current_user)`, sin excepciones
2. Autorización consistente: helper `_check_access(doc_id, user, db, required_role=...)` usado en todos los handlers (36 llamadas) con jerarquía viewer<editor<owner
3. SSRF C1 hardening sólido: whitelist dominios + blacklist RFC1918/link-local/loopback/IP-literal + HTTPS-only + no-follow-redirects + timeout 5s + cap 5MB
4. XSS Athena sanitizado: `escapeHtml` aplicado antes de markdown + KaTeX sanitiza con `throwOnError:false`
5. Pydantic schemas con `max_length` estrictos en POST/PATCH de workspaces_routes.py (L184-261)
6. WS workspaces con JWT + códigos de cierre diferenciados (4001/4010/4003/4004) + `_check_access` real
7. CORS restrictivo en server.py:88-99 (lista explícita, sin `*`, configurable por env); docs deshabilitadas en prod
8. Sin SQL injection tras revisar ~40 queries (cero `text()` + f-string, cero `.format()` con input)
9. Sin credenciales hardcoded (grep `sk-`, `Bearer ...`, `API_KEY="..."` → 0 matches)
10. A11y sólida: modales con `role="dialog"` + `aria-modal="true"`, botones con `aria-label` en 25/25 componentes revisados

---

## Plan de acción priorizado

### Bloque A — Antes de cualquier deploy a producción (estimado 1-2 sesiones)

1. **Decidir sobre collab V1**: mantener o deshabilitar (comentar `include_router`)
2. **FROZEN**: agregar workspaces_export.py + workspaces_athena.py + collab_routes.py a .claude/frozen-files.txt
3. **Publicar borradores legales**: Privacy v2.0 + T&C v2.0 con menciones Athena
4. **XSS fix en collab_routes export**: `html.escape` en title/course_name (A-1)
5. **Rubric upload**: MAX_SIZE + MIME check (A-2)

### Bloque B — Semana corriente (estimado 2-3 sesiones)

6. Pydantic schema para `create_document` (A-4, requiere /unfreeze collab_routes)
7. Bounds en collab_ws.py (A-3, requiere /unfreeze)
8. Timeout + JWT refresh en apiFetch (A-10)
9. Tests ExportModal + Toolbar + collab_ws (A-8, A-9)
10. Alembic init + migración inicial (A-7)

### Bloque C — Próximo mes (planificar)

11. Cobertura tests frontend (M-7): 28 tests a escribir
12. WS Origin check (M-1) + rate-limit REST (M-3)
13. Rate-limit Athena a Redis (M-2)
14. Supabase domain en whitelist imágenes (M-10)
15. Billing Athena tokens reales (M-5)
16. JWT revocación BD (A-5) — si aparece feature "logout all devices"

### Bloque D — Backlog

Todos los B-x; documentar decisión sobre "Athena" UI (B-1); completar constants/ (B-3) cuando se aborde C7.

---

## Score consolidado

| Dimensión | Puntaje | Observación |
|---|---|---|
| Seguridad | 78/100 | SSRF C1 fixed, sin SQL injection, sin secrets. Restan XSS collab, rubric upload, bounds collab_ws. |
| Manejo de errores | 70/100 | Handling inconsistente en export + `except Exception:` sin logging. |
| Null safety | 85/100 | Backend sólido. Frontend cast sin runtime validation en apiFetch. |
| Cobertura tests backend | 72/100 | 184 tests / 50 endpoints ≈ 3.7x. Falta collab_ws, edge cases WS V2, sanitize_html end-to-end. |
| Cobertura tests frontend | 10/100 | 1 test / 29 componentes. Crítico. |
| Accesibilidad | 88/100 | Sólida. Falta disclaimers legales en UpgradeModal. |
| Documentación / capa mecánica | 55/100 | 2 archivos críticos sin FROZEN, 4 alertas legales abiertas, BLOCKS.md desactualizado. |
| **Total ponderado** | **68/100 — WARN** | **No bloqueante para v1 publicable SI se resuelven los 5 items del Bloque A.** |

---

## Incertidumbres

1. **collab V1 redundancia**: no verifiqué si V1 y V2 sirven URLs distintas o la misma. Si distintas, solo V1 es vector redundante; si la misma, puede haber conflicto de routing.
2. **"Athena" como nombre**: no sé si Cristian considera violación de la regla "no IA/AI" usar nombre propio de asistente. Requiere decisión humana.
3. **Tests de los 13 componentes sin cobertura**: algunos son presentacionales puros (editorTheme, editorConfig); su "test" sería configuración más que lógica. Puede ser que 8/13 no requieran test real.
4. **Rate-limit efectivo Athena**: mi conteo asume N_workers=2 en Render free tier. No verifiqué si Render usa 1 o más workers actualmente.
5. **SSRF C10 HR**: no está en scope de esta auditoría (módulo Workspaces) pero es crítico pendiente de la auditoría previa. Debe cerrarse aparte.
