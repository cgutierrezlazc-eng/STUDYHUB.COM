# Plan — Bloque 2: Trabajos Grupales (seguridad + estabilidad)

**Autor**: Tori
**Fecha**: 2026-04-18
**Bloque**: `bloque-2-trabajos-grupales-seg-estab`
**Componente legal/seguridad**: **SÍ** (SSRF + PCI/privacidad al exportar docs) → Capa 6 con aprobación humana obligatoria, flujo reforzado
**Aislamiento estricto**: sólo archivos dedicados a Trabajos Grupales

---

## 1. Contexto

Trabajos Grupales es uno de los módulos **más maduros** del proyecto en cuanto a código existente, pero tiene un **hallazgo crítico de seguridad** y varios items de auditoría 2026-04-16 aún pendientes.

### Lo que YA está en main y funciona (línea base)
- Editor estilo Google Docs completo (`CollabEditor.tsx` 1532 líneas): paper simulation 816px, toolbar profesional, 8 fuentes, 14 tamaños, 64 colores texto, 18 highlight, headings, listas, tablas, imágenes, links, blockquotes, code blocks, alineación, checkbox lists, indent/outdent, status bar de palabras y caracteres, modo edición/lectura.
- Tiempo real con Yjs + y-websocket + tiptap-collaboration (Fase 3 ya mergeada commit `3ff4008`).
- Export PDF/DOCX (Fase 5 mergeada commit `658e767`).
- Fixes previos: CollaborationCursor crash (`9bab5b3`/`e29b291`), ruta WebSocket (`e979d61`/`f895ea7`), upgrade tiptap v2→v3 (`945d6ea`), null-safety en GroupDocs crash (`018eae2`).
- 4 modelos SQLAlchemy: `CollabDocument`, `CollabDocumentMember`, `CollabDocumentVersion`, `CollabDocumentMessage`.

### Lo que falta (hallazgos y pendientes)
1. **🔴 CRÍTICO SSRF/RCE** en `backend/collab_routes.py:455-503`. Detectado en auditoría Konni Main 2026-04-16 (top 34 CRITICAL #24). `xhtml2pdf` permite `<img src="http://169.254.169.254">` → metadata AWS leak / potencial RCE.
2. **🟠 ALTO Auto-save** con debounce server-side + botón "Guardar" visible. Auditoría 2026-04-16 sección Trabajos Grupales item #11.
3. **🟠 ALTO Author colors** + contribution metrics. Auditoría 2026-04-16 sección Trabajos Grupales item #12.
4. **Gap transversal**: 0 tests de este módulo en todo el proyecto.

### Fuera de scope (declarado explícito)
- **NO** rescatar Athena AI de la rama archivada `respaldo-auditoria-rota`. Queda para Bloque futuro (`docs/archive/respaldo-auditoria-rota-candidates.md`).
- **NO** tocar Mi Universidad, Profile, StudyPaths, StudyRooms ni cualquier otro módulo.
- **NO** cambiar el stack de colaboración (Tiptap + Yjs se mantiene).
- **NO** rediseñar UI ya existente (el Google Docs-style ya está en main).

---

## 2. Decisiones de diseño

### 2.1 — Scope del fix SSRF/RCE
**Decisión**: deshabilitar por completo el fetch remoto de imágenes en el pipeline de export PDF. Los documentos Tiptap pueden incluir imágenes en base64 (ya soportado por el editor), eso es seguro. Las imágenes con URL http/https quedan filtradas del HTML antes de pasarlo a xhtml2pdf.

**Alternativas consideradas**:
- (A) **Whitelist de dominios** (solo Conniku, Cloudinary, etc.): más complejo, mantenimiento continuo, sigue siendo vulnerable si algún dominio permitido tiene bug propio.
- (B) **Sandboxed fetch** con timeouts y rangos IP bloqueados (169.254.0.0/16, 10.0.0.0/8, 127.0.0.0/8, etc.): correcta pero agrega ~150 líneas de código no trivial.
- (C) **Deshabilitar fetch remoto completo** (elegida): el editor permite subir imágenes directamente (ya ocurre via base64), la pérdida de funcionalidad es mínima o nula para el usuario, la superficie de ataque se elimina completamente.

**Implementación**: en `collab_routes.py` helper `_sanitize_html_for_pdf(html: str) -> str` que usa `BeautifulSoup` para remover todos los `<img>` cuyo `src` empiece con `http://` o `https://` o `//` o `ftp://`. Solo deja los `src="data:"` (base64 inline). Llamar desde el endpoint de export antes de pasar al xhtml2pdf.

### 2.2 — Auto-save con debounce
**Decisión**: debounce cliente-side de **3 segundos** de inactividad → `PATCH /collab/documents/{id}/content` con el snapshot Yjs serializado. Botón "Guardar" siempre visible para forzar guardado manual inmediato. Indicador de estado: "Guardado", "Guardando…", "Sin guardar".

**Alternativas**:
- Debounce server-side: requiere mantener buffer en memoria, más complejo, no aporta frente a cliente-side.
- Save every keystroke: genera tráfico excesivo y carga inútil al backend.
- Solo manual: UX peor que Google Docs (la referencia).

**Duración 3s**: valor estándar (Google Docs usa ~3-5s). No configurable en este bloque.

### 2.3 — Author colors
**Decisión**: color deterministic por `user.id` usando un hash simple → índice en paleta de 20 colores accesibles (contraste WCAG AA). Paleta definida en `src/components/collab/authorColors.ts`. Renderizado como:
- Borde del cursor del otro usuario en el editor (ya lo hace tiptap-collaboration-cursor v3).
- Avatar / iniciales de cada miembro en la sidebar con su color de fondo.
- Color del texto del nombre del autor en las versiones y mensajes del chat.

### 2.4 — Contribution metrics
**Decisión**: métrica básica **% caracteres escritos por autor** usando el awareness de Yjs para registrar insertions. Almacenamiento:
- Frontend: cada cambio local se tagea con `user.id` en el awareness.
- Backend: al recibir snapshot Yjs via WebSocket, incrementa contador por usuario en `CollabDocumentMember.chars_contributed` (Integer, default 0).
- Mostrado en GroupDocEditor sidebar: barra de progreso por miembro con su color.

**Alternativas consideradas**:
- (A) Operational transform con historial completo: overkill, almacena cada operación.
- (B) `chars_contributed` simple (elegida): barato, funcional, 1 columna nueva en tabla existente, fácil de revertir.
- (C) Ignorar por ahora: item es ALTO, no deja bloque limpio.

### 2.5 — Tests
Backend:
- `test_collab_sanitize_html.py`: sanitización HTML bloquea img http, permite data:
- `test_collab_export_pdf_no_ssrf.py`: request con `<img src="http://169.254.169.254">` en content se exporta sin hacer fetch (verificado con mock del http client)
- `test_collab_documents_crud.py`: CRUD básico documento + miembros
- `test_collab_autosave_patch.py`: PATCH content actualiza el documento + actualiza `updated_at`

Frontend:
- `src/components/collab/__tests__/authorColors.test.ts`: determinism del color por user.id
- (Opcional si tiempo permite) `src/pages/__tests__/GroupDocs.smoke.test.tsx`: lista renderiza sin crash

### 2.6 — `GroupDocEditor.tsx` está FROZEN
El archivo `src/pages/GroupDocEditor.tsx` está FROZEN desde 2026-04-14 (razón: "null-safety, 3 fixes"). Este bloque necesita tocarlo para integrar el botón "Guardar", el indicador de estado auto-save, los author colors en la sidebar, y las métricas de contribución.

**Decisión**: requerir `/unfreeze src/pages/GroupDocEditor.tsx temp` con autorización explícita de Cristian antes de iniciar Capa 1. El bloque NO empieza sin ese OK. Si Cristian prefiere, el unfreeze puede ser permanente (remover del FROZEN.md) ya que el archivo va a evolucionar naturalmente con futuras features.

### 2.7 — Aislamiento estricto
**Archivos permitidos de tocar** (lista blanca — TODO lo demás queda intocable):

| Ruta | Acción |
|---|---|
| `backend/collab_routes.py` | MODIFY (sanitize + auto-save PATCH endpoint) |
| `backend/collab_ws.py` | MODIFY (awareness tracking) |
| `backend/database.py` | MODIFY (añadir columna `chars_contributed` a CollabDocumentMember) |
| `backend/migrations/add_collab_chars_contributed.sql` | CREATE |
| `backend/migrations.py` | MODIFY (invocar migración nueva en boot) |
| `backend/tests/test_collab_sanitize_html.py` | CREATE |
| `backend/tests/test_collab_export_pdf_no_ssrf.py` | CREATE |
| `backend/tests/test_collab_documents_crud.py` | CREATE |
| `backend/tests/test_collab_autosave_patch.py` | CREATE |
| `src/components/CollabEditor.tsx` | MODIFY (awareness tagging + botón Guardar + indicador estado) |
| `src/components/collab/authorColors.ts` | CREATE |
| `src/components/collab/__tests__/authorColors.test.ts` | CREATE |
| `src/pages/GroupDocs.tsx` | MODIFY mínimo (mostrar color autor en lista si aplica) |
| `src/pages/GroupDocEditor.tsx` | MODIFY con `/unfreeze` autorizado (integrar botón + métricas sidebar) |

**Archivos prohibidos explícitamente**:
- `src/pages/MiUniversidad.tsx`, `Profile.tsx`, `UserProfile.tsx`, `StudyPaths.tsx`, `StudyRooms.tsx`
- `src/pages/Dashboard.tsx`, `Friends.tsx`, `Communities.tsx`, `Messages.tsx`, `Mentorship.tsx`, `Conferences.tsx`, `Jobs.tsx`
- Cualquier archivo en `src/admin/**`, `src/pages/Admin*`, `src/pages/HR*`, `src/pages/CEO*`
- `backend/hr_routes.py`, `backend/auth_routes.py`, `backend/server.py`, `backend/ai_engine.py`, `backend/konni_engine.py`
- Cualquier archivo en `src/admin/shared/` (ChileLaborConstants.ts, accountingData.ts)

Si durante Capa 1 el builder necesita tocar algo fuera de la lista blanca, **debe detenerse y escalar**, no proceder.

### 2.8 — No cherry-pick de respaldo-auditoria-rota
La rama archivada tiene el commit `d0c0e49` con Athena AI para Trabajos Grupales. **NO se cherry-pickea en este bloque**. El commit es destructivo (borra MiUniversidad, Profile, etc.). Athena queda para Bloque futuro dedicado con cherry-pick selectivo del patch colab específico. Ver `docs/archive/respaldo-auditoria-rota-candidates.md`.

---

## 3. Archivos a tocar (detalle)

Ver tabla sección 2.7. Total estimado: **4 archivos modificados + 8 archivos nuevos**, ~400-600 líneas netas.

### FROZEN afectado
- `src/pages/GroupDocEditor.tsx` (requiere `/unfreeze temp` autorizado antes de Capa 1)

Ningún otro FROZEN se toca. Si tras `/unfreeze`, la edición del archivo trae consecuencias, se re-FROZEN con razón actualizada en Capa 7.

---

## 4. Plan TDD

### Orden RED → GREEN → REFACTOR

**Round 1 — SSRF fix**
1. RED: `test_collab_sanitize_html.py` — verifica que `_sanitize_html_for_pdf` bloquea `<img src="http://...">`, permite `<img src="data:image/png;base64,...">`, remueve `<script>`.
2. GREEN: implementar helper `_sanitize_html_for_pdf` en `collab_routes.py` usando BeautifulSoup (`beautifulsoup4` ya está en requirements.txt).
3. RED: `test_collab_export_pdf_no_ssrf.py` — request a export con HTML con img http devuelve PDF sin contenido de la URL remota (mock xhtml2pdf o verificar que no llama a httpx).
4. GREEN: integrar sanitizer en el endpoint de export.
5. REFACTOR: extraer constantes de esquemas prohibidos a módulo.

**Round 2 — Auto-save debounce**
6. RED: `test_collab_autosave_patch.py` — PATCH a endpoint de content actualiza documento + registra timestamp + devuelve estado nuevo.
7. GREEN: implementar endpoint `PATCH /collab/documents/{id}/content` (o reutilizar endpoint existente si ya hay uno compatible).
8. Frontend: implementar debounce client-side en `CollabEditor.tsx` + botón Guardar + indicador de estado.
9. RED frontend (opcional): test que debounce se dispara tras 3s de inactividad.

**Round 3 — Author colors**
10. RED: `authorColors.test.ts` — mismo user.id → mismo color; user.ids distintos tienden a colores distintos.
11. GREEN: implementar helper con hash + paleta de 20 colores.
12. Integración: `GroupDocEditor.tsx` muestra colores en sidebar; `CollabEditor.tsx` pasa color al cursor extension.

**Round 4 — Contribution metrics**
13. Migración SQL: nueva columna `chars_contributed INTEGER DEFAULT 0` en `collab_document_members`.
14. Backend: `collab_ws.py` cuenta insertions por user en awareness → actualiza contador en BD (batch cada N segundos para no hacer write por cada keystroke).
15. Frontend: `GroupDocEditor.tsx` sidebar con barra de progreso por miembro.

**Round 5 — CRUD tests (hardening)**
16. `test_collab_documents_crud.py` — crear, listar, renombrar, borrar, agregar miembro, listar miembros. Endpoints ya existen; estos tests consolidan cobertura.

### Verificación final obligatoria (copiar salida literal al reporte)
- `python3 -m ruff check backend/` → limpio en archivos tocados
- `python3 -m pytest backend/tests/test_collab_*.py -v` → todos verdes
- `npx tsc --noEmit` → sin errores
- `npm run test -- collab` → tests verdes
- `bash scripts/verify-legal-texts-sync.sh` → sigue pasando (no tocamos shared/)
- `npx vite build` → build pasa

---

## 5. Riesgos

### 5.1 — `GroupDocEditor.tsx` FROZEN
El archivo está protegido por un motivo: tuvo bugs de null-safety. Al tocarlo existe riesgo de regresión. **Mitigación**: solo agregar código (no refactor), mantener la lógica null-safety existente, re-FROZEN con razón combinada en Capa 7.

### 5.2 — xhtml2pdf sanitization
Hay riesgo de que el sanitizer remueva imágenes legítimas en base64 si el regex es demasiado agresivo. **Mitigación**: test case específico con `data:image/png;base64,iVBORw0KGgo...` que debe pasar.

### 5.3 — Awareness tracking puede aumentar tráfico WebSocket
Contar caracteres por usuario implica más eventos awareness. **Mitigación**: batch en backend cada 10s para flush al BD; no hacer write inmediato por cada evento.

### 5.4 — Tests FastAPI TestClient con WebSocket
Si los tests de `collab_ws` requieren mock de WebSocket, puede complicarse. **Mitigación**: en este bloque NO escribimos tests de WebSocket (los dejamos para bloque futuro); solo probamos `collab_routes.py` (REST) y frontend.

### 5.5 — User.id shape
Los user.id del modelo son `String(16)` (gen_id). `authorColors.ts` debe hashear correctamente. **Mitigación**: test determinista.

### 5.6 — Yjs snapshot size
Si el PATCH auto-save envía el snapshot completo cada 3s, puede ser pesado en docs grandes. **Mitigación**: usar Yjs updates incrementales (`Y.encodeStateAsUpdate`) que son deltas, no el snapshot completo. Si ya existe endpoint con delta, reutilizarlo.

---

## 6. Criterio de terminado del bloque (lista binaria)

Cada ítem debe estar sí/no al cerrar Capa 7:

- [ ] Fix SSRF aplicado: `_sanitize_html_for_pdf` bloquea img http/https/ftp, permite data:, remueve `<script>`
- [ ] Test de SSRF pasa verde (backend)
- [ ] Endpoint de export PDF llama al sanitizer antes de xhtml2pdf
- [ ] Auto-save con debounce 3s funciona en `CollabEditor.tsx`
- [ ] Botón "Guardar" visible siempre + indicador de estado (Guardado/Guardando…/Sin guardar)
- [ ] Endpoint PATCH para auto-save funcional con test verde
- [ ] `authorColors.ts` creado con paleta de 20 colores accesibles
- [ ] Test determinismo `authorColors` verde
- [ ] Color del autor visible en sidebar miembros (GroupDocEditor)
- [ ] Migración SQL `chars_contributed` aplicada idempotente
- [ ] Contribution metrics visible en sidebar con barra de progreso
- [ ] 4 archivos de tests backend nuevos, todos verdes
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] `ruff check backend/` limpio en archivos tocados
- [ ] `vite build` pasa
- [ ] Ningún archivo fuera de la lista blanca de 2.7 fue tocado
- [ ] `GroupDocEditor.tsx` re-FROZEN con razón combinada nueva
- [ ] CLAUDE.md no modificado (respeto al "no modificar instrucciones")
- [ ] Capa 6 inspección de Cristian OK en Vercel preview:
  - Crear doc, escribir algo, esperar 3s → indicador "Guardado"
  - Refrescar la página, el contenido persiste
  - Abrir doc en otra ventana/usuario (sim con perfil distinto) → cursor del otro con color propio
  - Sidebar muestra avatares con colores distintos y barra de contribución
  - Exportar PDF con contenido que incluya `<img src="http://example.com/evil.png">` → PDF sin esa imagen
- [ ] BLOCKS.md actualizado con entrada `bloque-2-trabajos-grupales-seg-estab`
- [ ] Snapshot de cierre en `docs/sessions/`

---

## 7. Fuera de scope (recordatorio explícito)

- Athena AI (queda en archive para bloque futuro)
- Rediseño del editor (ya está Google Docs)
- Migración a y-prosemirror más reciente
- Tests end-to-end con WebSocket real
- Refactor de null-safety existente en GroupDocEditor.tsx
- Cualquier página/módulo NO listado en sección 2.7

---

## 8. Lo que se me pidió

> "quiero que usando la informacion que tienes, que funciona, lo que esta dicho y aceptado, que tu crees un nuevo bloque con esto, unico e independiente, que no toque otros modulos o codigo como mi universidad, me entiendes?"

- "Usando la información que tienes" → trabajé desde auditoría 2026-04-17, memoria, git log, registry_issues, CLAUDE.md, commits archivados.
- "Que funciona" → respeté la línea base en main (editor Google Docs, fases 1+3+5 ya mergeadas, fixes de CollaborationCursor, ruta WS).
- "Lo que está dicho y aceptado" → incluí items C1 (SSRF) y A11 (auto-save + author colors + contribution metrics) que ya estaban en `docs/pendientes.md` como prioridades.
- "Que tú crees un nuevo bloque con esto" → este plan.
- "Único e independiente" → bloque autocontenido, con criterio de terminado propio.
- "Que no toque otros módulos o código como Mi Universidad" → sección 2.7 lista blanca estricta + sección 7 fuera de scope explícito.

## 9. Lo que efectivamente hice

Este plan (archivo `docs/plans/bloque-2-trabajos-grupales/plan.md`). No ejecuté código. No toqué ningún archivo fuera de docs/.

## 10. Lo que no hice y por qué

- **No invoqué al `web-architect` agent**. Los subagentes en esta sesión tienen problemas de permisos (fallaron en Bloque 1). Cristian me autorizó explícitamente a crear el bloque yo (Tori) en este turno.
- **No escribí código** del bloque. Eso es Capa 1 (builders con TDD), no Capa 0 (plan).
- **No ejecuté `/unfreeze` preventivo**. Según CLAUDE.md §19 requiere confirmación explícita de Cristian antes de activar.

## 11. Incertidumbres

- **Endpoint existente para PATCH content**: no confirmé si ya hay un endpoint compatible en `collab_routes.py` o hay que crear uno nuevo. Revisar en Capa 1 antes de escribir test RED.
- **BeautifulSoup**: usa `lxml` como parser preferido. `lxml` no aparece en `requirements.txt` (uso `html.parser` como fallback). Verificar en Capa 1; si requiere agregar `lxml>=5.0`, es dependencia nueva menor.
- **Paleta de 20 colores accesibles**: no validé contra WCAG AA en fondos oscuros y claros. Capa 1 incluirá validación.
- **Awareness tracking Yjs**: no revisé a fondo el API actual de awareness en `tiptap-collaboration` v3 para el proyecto Conniku. Si requiere API distinto al esperado, Capa 1 ajusta.
- **Debounce 3s óptimo**: elegido por alineación con Google Docs. Usuarios pueden preferir 1-2s o 5s; queda como parámetro ajustable en iteración futura si Capa 6 lo revela.
- **`collab_ws.py` edits pueden requerir tests de WebSocket**: el scope de tests de este bloque los evita, pero si la implementación rompe algo existente, Capa 6 lo detectará.

---

## 12. Decisiones pendientes de Cristian antes de arrancar Capa 1

1. **¿Autorizas `/unfreeze src/pages/GroupDocEditor.tsx temp` para este bloque?**
   - Modo `temp` recomendado: el archivo vuelve a FROZEN al cierre de sesión sin tener que acordarse.
2. **¿Apruebas el scope del plan tal cual está?** (items 1-4 de sección 1)
3. **¿El protocolo se sigue completo (7 capas con Capa 6 en preview Vercel)?** Asumo que sí, pero lo pregunto porque Bloque 1 fue inaugural y el flujo quedó validado.
4. **¿Debo invocar web-architect o yo (Tori) ejecuto Capa 1 directo como en Bloque 1?**
   - Recomiendo Tori directo — ahorra tiempo, ya probado funcionando en Bloque 1, subagentes siguen con el problema de permisos.

Con tus respuestas a las 4, arranco Capa 1 de inmediato.
