# Plan de división — Sub-bloque 2d Features Avanzadas

**Proyecto**: Conniku — Bloque 2 Workspaces
**Autor**: Tori (web-architect) — redactado 2026-04-18
**Referencia**: `docs/plans/bloque-2-workspaces/plan-maestro.md` §5 sub-bloque 2d y §3 features 35-65.
**Precedentes**:
- 2a Fundación cerrado Capa 7 (modelos + CRUD + editor Lexical base).
- 2b Colaboración cerrado Capa 7 (Yjs + WS + chat grupal + métricas + autosave + offline IndexedDB).
- 2c Athena cerrado Capa 5 en branch `bloque-2c-athena`, pendiente de merge tras validación legal humana.
- Branch actual: `bloque-2d-features` (post-2b, pre-2c). Se asume que antes de tocar código 2d, la rama de trabajo se rebasea contra el main que ya incluirá 2c.

**Componente legal**: sí, transversal al sub-bloque. Dos focos:
1. **Export PDF/DOCX** toca la deuda C1 de `docs/pendientes.md` (SSRF/RCE en V1). El export nuevo del 2d **debe nacer sin esa vulnerabilidad**; es requisito de seguridad, no opcional.
2. **Link público compartido**, **Comentarios inline**, **Menciones**, **STT/TTS**, **Voice notes**, **Arrastrar archivos** procesan datos personales (IP, voz, posibles archivos con datos sensibles) que el legal-docs-keeper debe evaluar para Política de Privacidad antes de deploy.

**Estado de este documento**: plan de **división** únicamente. Cada sub-sub-bloque derivado tendrá su propio plan detallado (documento independiente) cuando se lance.

---

## §1 Contexto

### 1.1 Tamaño real del 2d

Del plan maestro §5 inciso 2d se contabilizan ~40 features distintas agrupadas bajo el título "features avanzadas + APA + rúbrica + math + diseño final + tests e2e". Esto es más voluminoso que 2a + 2b + 2c juntos. Si se ejecutara como un solo sub-bloque monolítico pasaría lo siguiente:

- Un único `/cerrar-bloque` con 2-3 semanas de trabajo encima, imposible de auditar.
- Un único PR con centenares de archivos nuevos, imposible de revisar.
- Alta probabilidad de conflictos internos entre plugins Lexical (custom nodes colisionando).
- Cristian no tendría Capa 6 (inspección) granular: una mejora en Modo Presentación forzaría re-verificar toda la rúbrica, todo APA, todo export.
- El criterio "1-2 días máx por bloque" del CLAUDE.md §18 quedaría violado.

**Conclusión**: 2d se subdivide en sub-sub-bloques. Cada uno es un **bloque real** a efectos del protocolo de 7 capas; el prefijo `2d.X` es solo traza de que pertenecen al mismo módulo.

### 1.2 Inventario de lo que ya existe (y qué se reutiliza)

Archivos leídos para este plan:
- `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/plan-maestro.md`
- `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/2c-athena.md` (primeras ~80 líneas, lo suficiente para contexto)
- `/Users/cristiang./CONNIKU/docs/pendientes.md` (sección crítica C1)
- `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/editorConfig.ts`
- `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/LexicalEditor.tsx` (imports y head)
- `/Users/cristiang./CONNIKU/package.json` (deps Lexical/Yjs/Katex)
- `/Users/cristiang./CONNIKU/FROZEN.md` y `/Users/cristiang./CONNIKU/.claude/frozen-files.txt`
- Estructura de directorios: `src/pages/Workspaces/`, `src/components/workspaces/`, `backend/workspaces_*.py`

Hallazgos clave:

- `katex@0.16.45` **ya está en package.json** (línea 97). No requiere unfreeze para Katex.
- `@lexical/*@0.21.0`, `yjs@13.6.30`, `@lexical/yjs@0.21.0`, `y-websocket@3.0.0` ya instalados.
- Faltan y requerirán unfreeze de `package.json`: `mathlive`, `@matejmazur/react-katex` (o equivalente), `@lexical/table`, `@lexical/code`, `@lexical/mark` (para anotar comentarios inline), `jspdf`+`html2canvas` o `pdfmake`, `docx`, y posiblemente `@lexical/markdown` ya presente.
- `editorConfig.ts` declara explícitamente `// Bloque 2a Fundación. Sin Math, APA, TOC (son 2c/2d).` → el 2d es el que agrega los nodos custom.
- `LexicalEditor.tsx` hoy tiene 142 líneas; la lista de plugins es corta (Rich, List, Link, History, AutoFocus, Collab, Cursor). Toda la expansión 2d pasará por agregar plugins aquí o mejor por **composición lateral** para no volverlo un monstruo.
- `backend/workspaces_routes.py` ya tiene 839 líneas con 18 endpoints. Se debe separar cada nueva familia (export, rubric, share-link, math) en archivo propio declarado en plan maestro §4, no inflar el routes principal.
- FROZEN bloquea `backend/collab_ws.py` y `backend/hr_routes.py` entre otros. No hay conflicto con scope 2d.
- `package.json` está FROZEN en sección "lint-staged config". `/unfreeze` es obligatorio para cualquier sub-sub-bloque que agregue dependencias npm.

### 1.3 Restricciones heredadas

- **Aislamiento**: archivos del V1 de Trabajos Grupales siguen prohibidos (`collab_routes.py`, `collab_ws.py`, `GroupDocEditor.tsx`, `CollabEditor.tsx`). El export del 2d **no puede vivir en collab_routes**; va en `backend/workspaces_export.py` nuevo, resolviendo SSRF desde cero.
- **Athena del 2c usa `doc.rubric_raw`** (campo ya existente del 2a). El sub-sub-bloque de Rúbrica **debe escribir en ese mismo campo** para que Athena consuma la rúbrica sin cambios en el prompt.
- **Yjs gobierna el contenido**: cualquier nodo custom de Lexical (MathNode, CitationNode, CommentMarkNode, etc.) debe ser **serializable** por `@lexical/yjs`. Nodos que guarden referencias a objetos DOM o a React refs romperán la sincronización. Esto es una restricción dura que cada sub-sub-bloque debe validar en su plan detallado.
- **Auto-save del 2b** persiste `content_yjs` cada 2s. Cualquier nodo nuevo que no esté registrado en `editorConfig.ts` al momento de deserializar romperá documentos existentes. Consecuencia: las migraciones de schema del editor (agregar nodo nuevo) deben ser **retrocompatibles** (nodo ausente → ignorar silenciosamente, no crash).

### 1.4 Deuda que este sub-bloque resuelve

- **C1 de `docs/pendientes.md`** (SSRF/RCE en V1 export) se **cierra** cuando el sub-sub-bloque de Export entre a main. El V1 collab_routes sigue vulnerable hasta que se borre completo, pero el flujo en uso (V2) queda seguro. Hay que dejar en pendientes.md una nota: "C1 mitigado en el camino feliz cuando V2 reemplaza V1; pendiente borrar V1 o sanitizar V1 si sigue expuesto".

---

## §2 División propuesta

Diez sub-sub-bloques. El orden de la tabla es el orden sugerido de ejecución (ver §4 para razonamiento).

| # | Sub-sub-bloque | Alcance principal | Deps entre 2d | Tiempo estimado | Requiere unfreeze | Requiere decisión legal previa |
|---|---|---|---|---|---|---|
| 2d.1 | **APA 7 + citas + referencias** | Validación en tiempo real (márgenes 2.54 cm, interlineado 2.0, Times New Roman 12 pt, sangría 1.27 cm), CitationNode, ReferenceNode, sangría francesa, arquitectura extensible (strategy pattern) para IEEE/Chicago/MLA (scaffolding sin implementar). Validación usa reglas CSS + checks sobre árbol Lexical. | ninguna | 1.5 días | `package.json` (deps: ninguna nueva estrictamente; si se usa `citation-js` o similar, unfreeze) | no (APA es estándar internacional, no ley específica) |
| 2d.2 | **TOC automático + Tapa + Plantillas de documento** | `TOCPlugin` que lee H1/H2/H3 y genera índice clicable. `CoverNode` editable con plantillas (institucional, estándar, ensayo, paper corto). Plantillas pre-pobladas en tabla nueva `workspace_templates` o JSON estático en frontend. | 2d.1 (usa formato APA para tapa y encabezados) | 1.5 días | `package.json` (ninguna externa probable) | no |
| 2d.3 | **Matemáticas — KaTeX render** | `MathNode` (inline y block), plugin que parsea `$...$` y `$$...$$`, render con katex ya instalado. Sin editor visual todavía. | 2d.1 (conveniente pero no bloqueante; el APA de ecuaciones está en el manual oficial pero se puede diferir) | 1 día | `@matejmazur/react-katex` o reutilizar katex directo sin wrapper React (decisión K1 abajo) | no |
| 2d.4 | **Matemáticas — MathLive visual + paleta símbolos + fórmulas químicas** | Editor visual MathLive con UI menús (fracciones, raíces, integrales, matrices). Paleta de símbolos. Auto-subíndices químicos (`H_2O`). | 2d.3 (comparte `MathNode`) | 1 día | `mathlive` (nueva dep) | no |
| 2d.5 | **Matemáticas — SymPy backend + verificación + gráficos** | `backend/workspaces_math.py` con endpoint `POST /workspaces/math/compute` (simplify, solve, integrate, diff). Renderizado de gráficos matplotlib server-side o Plotly client-side. Athena puede pedir verificación (integración opcional, no en prompt 2c). | 2d.4 (visual → envía LaTeX al backend) | 1.5 días | backend requirements.txt (sympy, matplotlib) — decisión M1 abajo | sí parcial (SymPy ejecuta código en backend; riesgo de code injection si no se sandboxea. Decisión M2 abajo) |
| 2d.6 | **Rúbrica — upload + parser + checklist** | `RubricUploader` (PDF/DOCX/texto pegado/formulario). `backend/workspaces_rubric.py` con parser. Checklist lateral `RubricChecklist`. Escribe en `doc.rubric_raw` (Athena 2c lo consume). Evaluación automática de criterios cumplidos/pendientes. Alerta al "Declarar doc terminado". | ninguna estructural (paralelo a 2d.1-2d.5) | 2 días | backend requirements.txt (`python-docx` quizá ya está; `pdfplumber` o `pypdf` para PDF) | sí (datos personales en rúbricas que suben usuarios: declarar en Política de Privacidad que se almacenan. Legal-docs-keeper borrador previo) |
| 2d.7 | **Export PDF/DOCX con SSRF fix (cierre C1)** | `backend/workspaces_export.py` nuevo, desde cero y seguro. Export PDF via stack decidido en E1. Export DOCX via `python-docx`. Sanitización HTML con whitelist de URLs (solo `data:` y dominios Conniku). Tests de regresión para vectores SSRF conocidos (`http://169.254.169.254`, `file://`, `gopher://`). **Imprimir** (botón frontend que invoca `window.print()` con stylesheet print) queda aquí por afinidad. | 2d.1 (usa formato APA), 2d.2 (TOC y tapa), 2d.3-2d.5 (si hay matemáticas en el doc, export debe renderizarlas) | 2 días | backend requirements.txt (stack export decidido en E1) | **sí obligatorio** — el sub-sub-bloque cierra C1 de pendientes.md. Flujo reforzado CLAUDE.md §Cumplimiento Legal. Aprobación humana explícita requerida antes de merge, no sólo quality score |
| 2d.8 | **Comentarios inline + Menciones** | `WorkspaceComment` ya existe como modelo BD en 2a (líneas 274-285 del plan maestro). Falta frontend: `CommentMarkNode`, sidebar de threads, UI hover para crear comentario sobre selección, resolución. Menciones @usuario con autocomplete sobre `workspace_members`. Notificación al mencionado (reuso notificaciones Conniku si existen, fallback a badge en UI). | 2b (requiere texto estable, o sea Yjs + CollaborationPlugin), 2c (menciones pueden referenciar Athena como `@athena` opcionalmente, pero no crítico) | 2 días | `@lexical/mark` para anclar comentarios sobre rango | sí parcial (menciones notifican al mencionado → política de comunicaciones; legal-docs-keeper valida cláusula) |
| 2d.9 | **Link público compartido + Invitación** | `share_link_token` ya existe en modelo `WorkspaceDocument`. Endpoint `POST /workspaces/{id}/share-link` genera token (UUID o JWT; decisión L1). Endpoint `GET /ws/share/{token}` resuelve → rol configurable por owner. Rate-limit y expiración configurable. UI `ShareLinkGenerator`. | ninguna estructural | 1 día | ninguna dep nueva | **sí obligatorio** — link público expone doc fuera de autenticación. GDPR Art. 6 base legal del procesamiento + Ley 19.628. Legal-docs-keeper debe validar flujo antes de deploy |
| 2d.10 | **UX envoltura — Modo enfoque + Modo presentación + Atajos + STT/TTS + Drag-drop + Voice notes + Duplicar/Star/Búsqueda global/Arrastrar archivos** | Sub-sub-bloque "bolsa" de features de UX que no tocan core del editor ni backend significativo. Modo enfoque (oculta UI), Modo presentación (fullscreen + scroll controlado), overlay `?` con atajos, Web Speech API (STT input por voz, TTS lectura), drag-drop archivos al doc (imagen → `ImageNode`, PDF → enlace embed), voice notes (graba blob audio, sube a almacenamiento, `VoiceNoteNode`), duplicar workspace, star/favoritos (columna `is_starred` en `workspace_members`), búsqueda global (endpoint `GET /workspaces/search?q=` que busca en title + content_yjs + miembros). | 2d.1-2d.9 (todos, porque agrega sobre el doc ya funcional) | 2.5 días | `package.json` (posibles: `react-hotkeys-hook` si no se hace manual; nada más nuevo) y `requirements.txt` (storage de audio si se decide en backend; alternativa es Supabase Storage que ya tenemos) | sí (STT envía voz a Web Speech API del navegador → Google/Apple según vendor; debe declararse en Política de Privacidad. Voice notes almacenan audio del usuario → retención, cifrado en reposo, derecho ARCO. Legal-docs-keeper obligatorio) |

Totales: **10 sub-sub-bloques**, estimación agregada **16 días** de trabajo lineal efectivo. Con paralelismo (frontend y backend avanzando a la vez) y asumiendo Capas 6/7 rápidas de Cristian, se puede comprimir a ~10-12 días calendario.

---

## §3 Dependencias entre sub-sub-bloques

Grafo de dependencias (→ significa "depende de"):

```
2d.1 (APA) ────────────┐
                       ├──→ 2d.2 (TOC + Tapa + Plantillas) ──┐
                       │                                     │
                       ├──→ 2d.3 (KaTeX) ──→ 2d.4 (MathLive) ─→ 2d.5 (SymPy) ─┐
                       │                                     │                │
                       └─────────────────────────────────────┴────────────────┴──→ 2d.7 (Export PDF/DOCX + Imprimir)
                                                                                        ▲
2d.6 (Rúbrica) ────── paralelo ─────────────────────────────────────────────────────────┤
                                                                                        │
2d.8 (Comentarios + Menciones) ── paralelo ─────────────────────────────────────────────┤
                                                                                        │
2d.9 (Link público) ── paralelo ────────────────────────────────────────────────────────┤
                                                                                        │
                                                                                        ▼
                                                                                 2d.10 (UX envoltura)
```

Lectura:
- **2d.1 es raíz**: APA toca formato base del doc. Todo lo visual lo hereda.
- **2d.2 depende sólo de 2d.1**: TOC y Tapa necesitan saber el formato APA para layouts correctos.
- **Cadena matemática 2d.3 → 2d.4 → 2d.5**: estricta. MathLive emite LaTeX que consume MathNode de 2d.3; SymPy valida lo que produce MathLive.
- **2d.6 Rúbrica, 2d.8 Comentarios, 2d.9 Link público**: pueden ejecutarse en paralelo entre sí y en paralelo a la cadena matemática. Sólo tocan capas que ya existen desde 2a-2b.
- **2d.7 Export** requiere que todos los nodos que va a exportar existan. Por eso es el penúltimo: consume el estado final del editor.
- **2d.10 UX envoltura** es el último porque agrega encima. Sus features no introducen nodos nuevos al árbol del doc; son wrappers visuales o endpoints periféricos.

---

## §4 Orden sugerido de ejecución

**Racional**: priorizar valor funcional temprano + riesgo decreciente + cierre de deuda crítica (C1) en el tercer tercio para dar tiempo a validación humana.

**Fase I — Valor académico core (días 1-4)**

1. **2d.1 APA 7 + citas + referencias** — día 1-1.5. Es lo que le da a Workspaces su identidad diferenciadora ("Google Docs pero académico chileno"). Abre el camino para todo lo demás.
2. **2d.2 TOC + Tapa + Plantillas** — día 2.5-4. Complemento natural de 2d.1. Al cerrar este, un estudiante ya puede producir un documento académico con tapa + índice + formato APA — versión mínima vendible.

**Fase II — Colaboración avanzada en paralelo a matemáticas (días 4-9)**

Ejecución paralela:
- Thread A: 2d.3 → 2d.4 → 2d.5 (matemáticas, 3.5 días encadenados)
- Thread B: 2d.6 Rúbrica (2 días) → 2d.8 Comentarios + Menciones (2 días)
- Thread C: 2d.9 Link público (1 día) — puede ir al final de B o en paralelo si hay builder libre

**Racional del paralelismo**: CLAUDE.md §18.5 prohíbe trabajar **bloques** paralelos, pero los sub-sub-bloques son piezas del mismo bloque 2d. Si Cristian declara explícitamente que el paralelismo aplica al nivel sub-sub, se puede acelerar. **Pregunta abierta P1 a Cristian abajo**.

Si no se autoriza paralelismo interno, orden serial: 2d.3 → 2d.4 → 2d.5 → 2d.6 → 2d.8 → 2d.9. Aproximadamente 9.5 días.

**Fase III — Export con cierre C1 (días 9-11)**

3. **2d.7 Export PDF/DOCX + Imprimir** — 2 días. Cierra C1 (SSRF/RCE). Requiere flujo reforzado: legal-docs-keeper + aprobación humana explícita de Cristian antes de merge. Se hace **después** de todo el contenido para que el export deba soportar la totalidad de nodos custom que existen.

**Fase IV — UX final (días 11-13)**

4. **2d.10 UX envoltura** — 2.5 días. Modo enfoque, presentación, atajos, STT/TTS, drag-drop, voice notes, duplicar, star, búsqueda. Cada una de estas es pequeña pero la suma es 2.5 días y fácilmente puede crecer si aparece scope creep. Si llega el momento y el cansancio de sub-bloques es alto, se puede **fragmentar 2d.10 en 2d.10a (enfoque+presentación+atajos) y 2d.10b (STT+TTS+voice+drag+duplicar+star+búsqueda)**. Decisión queda diferida al momento de ejecución, no forzada ahora.

**Fase V — Cierre 2d completo**

Al cerrar 2d.10, Tori ejecuta `/cerrar-bloque bloque-2-workspaces` consolidado: actualiza BLOCKS.md, extiende FROZEN.md con los archivos del bloque completo, escribe snapshot final, marca C1 como mitigado en pendientes.md.

---

## §5 Riesgos compartidos

Los sub-sub-bloques heredan una serie de riesgos transversales. Se documentan aquí una vez en lugar de repetirlos en cada plan detallado.

### R1 — ALTO: colisión de custom nodes Lexical con Yjs

**Probabilidad**: media (35%). **Impacto**: alto.
El 2d agrega al menos 8 nodos custom: `CitationNode`, `ReferenceNode`, `CoverNode`, `TOCNode`, `MathNode`, `CommentMarkNode`, `MentionNode`, `ImageNode`/`VoiceNoteNode`. Si cualquiera no es correctamente serializable por `@lexical/yjs`, la colaboración rompe **silenciosamente** (un usuario ve el nodo, otro no).

**Mitigación**: cada plan detallado de sub-sub-bloque que agrega nodo custom debe incluir test de colaboración multi-cliente (simular dos providers Yjs, uno inserta el nodo, el otro lo recibe, el estado serializado base64 es idéntico). Este test ya existe como patrón en los tests del 2b.

### R2 — MEDIO: deuda acumulada de migraciones retrocompatibles

**Probabilidad**: media (40%). **Impacto**: medio.
Cada sub-sub-bloque que agrega nodo custom cambia `editorConfig.ts`. Docs creados antes y guardados en Yjs contendrán el árbol sin el nodo nuevo. La deserialización debe tolerar ausencia. Si no se cuida, documentos viejos crashean al abrirse.

**Mitigación**: cada plan detallado agrega al criterio de terminado un check: "documento creado antes del cambio de schema abre sin error". Regression test dedicado.

### R3 — ALTO: vulnerabilidad SSRF en 2d.7 replicando C1

**Probabilidad**: alta si no se planifica explícitamente (70%). **Impacto**: crítico.
El V1 cayó por usar `xhtml2pdf` permitiendo `<img src="http://...">`. Cualquier stack de export que renderice HTML con imágenes remotas sin sanitizar repite el error. Esto incluye `jspdf+html2canvas`, `puppeteer`, `weasyprint`.

**Mitigación**: 2d.7 empieza con tests de ataque (vectores `http://169.254.169.254`, `file:///etc/passwd`, `gopher://`, `ftp://`, `http://localhost`). Si el stack elegido falla cualquier test, se cambia de stack o se sandboxea. No se avanza hasta tener 0 vectores exitosos. Whitelist de dominios es preferida sobre blacklist.

### R4 — MEDIO: explosión de dependencias npm y tamaño de bundle

**Probabilidad**: alta (60%). **Impacto**: medio-bajo (degrada UX pero no rompe).
KaTeX + MathLive + `@lexical/*` + librerías export + hotkeys + speech polyfills suman varios MB al bundle. El chunk de Workspaces puede pasar de aceptable a lento de cargar.

**Mitigación**: cada sub-sub-bloque carga lazy lo que pueda. MathLive sólo se importa cuando el usuario abre el editor de ecuaciones. KaTeX CSS global (inevitable). Export libraries: dynamic import al click del botón, no en carga inicial. Verificar bundle size después de 2d.10 con `vite build --analyze`.

### R5 — MEDIO: rate-limit Anthropic al combinar Athena + SymPy + rúbrica

**Probabilidad**: baja-media (25%). **Impacto**: medio.
El 2c ya rate-limita 20 req/min por usuario para Athena. Si el 2d.5 agrega verificación matemática que llama a Athena y el 2d.6 agrega evaluación de rúbrica que también llama a Athena, el usuario puede toparse con rate limit sin entender por qué.

**Mitigación**: SymPy verifica localmente (no llama Athena). La evaluación de rúbrica en 2d.6 se hace con parser determinista (no Athena) como fallback; si el usuario pide análisis profundo, ahí sí llama Athena y cuenta. Documentar en UI qué acciones consumen cupo.

### R6 — ALTO: link público compartido y exposición de datos personales de miembros

**Probabilidad**: media (30%). **Impacto**: alto (GDPR, Ley 19.628).
Si el link público muestra nombres y avatares de miembros sin consentimiento, es exposición de datos personales sin base legal. Si muestra contenido del doc, es consentido implícitamente por el owner pero debe ser revocable.

**Mitigación**: 2d.9 define niveles `link_public_view_only`, `link_public_with_identities` (requiere toggle explícito del owner y confirmación). Endpoint de revocación inmediata. Auditoría legal-docs-keeper obligatoria.

### R7 — BAJO: STT/TTS + Web Speech API no funciona en todos los navegadores

**Probabilidad**: alta (80%) en navegadores no-Chromium. **Impacto**: bajo (feature degradada, no rompe core).
Web Speech API es inconsistente: Chrome/Edge la tienen, Firefox parcial, Safari parcial. Fallback necesario.

**Mitigación**: 2d.10 detecta `window.SpeechRecognition || window.webkitSpeechRecognition`; si no existe, oculta botón con tooltip "tu navegador no soporta dictado por voz". No crashea.

### R8 — MEDIO: scope creep en 2d.10 "UX envoltura"

**Probabilidad**: alta (65%). **Impacto**: medio (retrasa cierre).
La "bolsa" concentra 10+ features pequeñas. Cada una invita a "solo 30 min más" de pulido. Es el patrón de proyecto que se estira indefinidamente.

**Mitigación**: 2d.10 entra con lista cerrada + criterio de terminado binario por feature. Cualquier mejora cosmética identificada en Capa 6 se documenta como iteración posterior, no se hace inline.

---

## §6 Preguntas abiertas — Cristian debe decidir antes de lanzar builders

Decisiones que no tiene sentido tomar en vacío sin input de Cristian. Cada una se presenta con alternativas y recomendación de Tori.

**K1 — React wrapper de KaTeX**

- **Opción A**: `@matejmazur/react-katex` (paquete más popular, mantenido, 3 KB extra sobre katex core)
- **Opción B**: invocar katex directamente vía `renderToString(latex)` dentro del `MathNode.decorate()`, sin wrapper React

Recomendación Tori: **B**. Menos superficie de ataque, menos upgrades a vigilar, katex ya está instalado y su API es estable. El nodo Lexical no necesita sincronizar estado React con la representación renderizada; es sólo HTML estático por expression.

**K2 — MathLive integration con Lexical**

- **Opción A**: `mathlive` oficial (MIT, mantenido). Emite LaTeX que encaja con KaTeX.
- **Opción B**: construir editor visual propio con symbol palette más simple.

Recomendación Tori: **A** salvo que Cristian quiera evitar añadir 300 KB de dep. MathLive es el estándar de facto.

**E1 — Stack Export PDF**

Alternativas principales:
- **a) Puppeteer/Chromium headless server-side**: fidelidad máxima, renderiza exactamente lo que el navegador muestra. **Contra**: 300+ MB en Render, arranque lento, superficie SSRF alta si permite URLs externas en el render.
- **b) WeasyPrint (Python)**: HTML+CSS a PDF, muy fiel a CSS Print spec, sin JS. **Contra**: dependencia nativa (cairo, pango); se despliega en Render con buildpack específico.
- **c) jsPDF + html2canvas (client-side)**: todo en navegador del usuario. **Contra**: fidelidad mediocre en layouts complejos, matemáticas pueden verse mal, límite memoria en móvil.
- **d) ReportLab (Python, genera PDF programáticamente, no desde HTML)**: máximo control, seguro. **Contra**: hay que reimplementar todo el render desde el árbol Lexical; no convierte HTML.
- **e) pdfmake (JS, programático similar a ReportLab pero client)**: similar a (d) en esfuerzo.

Recomendación Tori: **b) WeasyPrint** o **a) Puppeteer**. WeasyPrint si el bundle backend tolera la dep nativa (verificar Render); Puppeteer si prefiere fidelidad máxima aceptando el peso. Evitar (c) por fragilidad, evitar (d)/(e) por costo de reimplementar. **Pregunta directa**: ¿Cristian prefiere fidelidad visual (Puppeteer) o simplicidad y menor superficie de ataque (WeasyPrint)?

**E2 — SSRF fix strategy en 2d.7**

- **Opción A**: Sanitizar HTML con `bleach` (Python) + whitelist de esquemas (`data:`, `https://conniku.com/*`, `https://*.supabase.co/*`). Bloquea todo lo demás.
- **Opción B**: Pre-procesar el árbol Lexical antes de renderizar, reemplazando cada URL imagen por su versión base64 ya descargada a través del backend (con timeout y límite tamaño). Evita que el motor de render haga requests externos.

Recomendación Tori: **B para imágenes + A como defensa en profundidad**. B es más seguro (el motor de render nunca toca la red); A atrapa casos no previstos (estilos con `url(...)`, imports CSS). Combinar ambos.

**M1 — SymPy en Render**

- **Opción A**: Instalar `sympy` en requirements.txt. Peso ~20 MB.
- **Opción B**: servicio externo aparte (microservicio Python separado sólo para cálculo).

Recomendación Tori: **A**. Sympy es puro Python, sin dep nativa, arranque rápido. Separar servicio es overengineering.

**M2 — Sandboxing de SymPy (code injection)**

SymPy parsea expresiones matemáticas del usuario. `sympify(user_input)` con `evaluate=True` **permite code injection** (Python arbitrario vía métodos de objetos Sympy). Caso conocido.

- **Opción A**: usar `parse_expr` con `transformations` estrictas y `global_dict={}`, `local_dict={}`, rechazar cualquier `__dunder__`.
- **Opción B**: regex de validación antes de sympify (solo letras, números, operadores conocidos).
- **Opción C**: subproceso Python con `resource.setrlimit` + timeout, aislado.

Recomendación Tori: **A + B como filtro previo**. C es pesado, se reserva si A+B no bastan.

**P1 — Parser de rúbrica**

- **Opción A**: regex + heurísticas (buscar numeración, bullets, tablas). Determinista, predecible, falla con rúbricas mal estructuradas.
- **Opción B**: llamar Athena (Haiku) con prompt "extrae criterios como JSON". Robusto, costo por request. El 2c ya tiene infra para llamar Haiku.
- **Opción C**: estructura fija — el usuario llena formulario con N criterios. Sin parser, siempre funciona, menos UX.

Recomendación Tori: **B con A como fallback + C siempre disponible**. Athena es el diferenciador del producto; usarlo para la extracción inicial es valor percibido. Si el usuario desmarca "analizar con Athena", cae a A. Siempre dejar C accesible por "Llenar manualmente".

**S1 — STT/TTS provider**

- **Opción A**: Web Speech API nativa del navegador (gratis, sin credenciales, inconsistente).
- **Opción B**: servicio cloud (Google Cloud Speech, Azure Speech, OpenAI Whisper API). Costo por minuto, consistente, datos salen a terceros.

Recomendación Tori: **A**. Sin costo operacional. Inconsistencia se documenta en UI. Si a futuro se vuelve crítico, B como upgrade. Evita dependencia operacional y costo variable.

**L1 — Token del link público**

- **Opción A**: JWT firmado con secret backend, contiene `doc_id` + `expires_at` + `role`. Verificación sin BD.
- **Opción B**: UUID random guardado en `workspace_documents.share_link_token` (ya existe el campo). Verificación requiere lookup BD, pero permite revocación inmediata al nullear el campo.

Recomendación Tori: **B**. Ya existe el campo en el modelo (plan maestro §4 línea "share_link_token = Column(String(32), unique=True, nullable=True)"). Revocación trivial. JWT complica la expiración (requiere re-firmar) y no permite revocación antes de expiración natural.

**C1 — Modelo BD comentarios threads**

- **Opción A**: Usar el modelo `WorkspaceComment` ya existente del 2a (tiene `parent_id` para threads, `anchor_json` para posición).
- **Opción B**: Anotaciones sobre Yjs awareness.
- **Opción C**: Ambos — BD para persistencia, Yjs awareness para highlighting real-time.

Recomendación Tori: **A simple + render desde BD**. Yjs awareness añade complejidad (colisión con cursores de presencia del 2b). Los comentarios no requieren real-time CRDT; un polling o refresh al abrir el sidebar alcanza. Si a futuro se nota latencia, C.

**P1-paralelismo — ¿Autorizas ejecución paralela de sub-sub-bloques del mismo bloque 2d?**

CLAUDE.md §18.5 prohíbe trabajar dos bloques paralelos. Si los sub-sub-bloques de 2d se consideran sub-unidades del mismo bloque, el principio no se viola (check-lock.sh bloquea sesiones paralelas, lo cual es lo que realmente importa). Si se considera que cada sub-sub-bloque cuenta como bloque independiente, paralelismo está prohibido.

Interpretación Tori: **el check-lock es la norma dura; mientras Tori corra en una sesión única y sirva a builders en serie, no hay colisión**. Pero esto merece confirmación explícita. Alternativa conservadora: serial puro, mayor duración calendario.

---

## §7 Deps nuevas a instalar (requiere `/unfreeze package.json` y/o `requirements.txt`)

### Frontend (`package.json`)

| Paquete | Versión aprox | Sub-sub-bloque que la necesita | Razón |
|---|---|---|---|
| `@matejmazur/react-katex` | ^3.0.0 | 2d.3 (si K1=A) | Wrapper React para KaTeX — opcional, depende de decisión K1 |
| `mathlive` | ^0.100.0 | 2d.4 | Editor visual de ecuaciones |
| `@lexical/table` | ^0.21.0 | 2d.1 o 2d.2 | Tablas embebidas APA |
| `@lexical/code` | ^0.21.0 | 2d.10 opcional | Bloques de código para notas técnicas |
| `@lexical/mark` | ^0.21.0 | 2d.8 | Ancla de comentarios inline sobre rango de texto |
| `jspdf` + `html2canvas` | variable | 2d.7 | Sólo si E1 = opción (c) |
| `docx` | ^8.0.0 | 2d.7 | Export DOCX lado cliente (alternativa a python-docx backend) |
| `react-hotkeys-hook` | ^4.5.0 | 2d.10 | Atajos de teclado — opcional, se puede hacer manual |

### Backend (`backend/requirements.txt`)

| Paquete | Versión | Sub-sub-bloque | Razón |
|---|---|---|---|
| `sympy` | ^1.12 | 2d.5 | Cálculo simbólico |
| `matplotlib` | ^3.8 | 2d.5 opcional | Gráficos server-side |
| `weasyprint` | ^61.0 | 2d.7 si E1=B | Export PDF |
| `bleach` | ^6.1 | 2d.7 | Sanitización HTML |
| `pdfplumber` o `pypdf` | variable | 2d.6 | Extracción de texto de rúbricas PDF |
| `python-docx` | ^1.1 | 2d.6 + 2d.7 | Lectura DOCX (rúbrica) + export DOCX |
| `Pillow` | ^10 | 2d.7 | Validación y procesamiento imágenes para export (probable ya presente) |

### Unfreeze operativos

- `package.json` está FROZEN. Cada sub-sub-bloque que añada deps npm requiere `/unfreeze package.json` autorizado **solo para el commit que agrega la dep** y luego re-freeze inmediato.
- `backend/requirements.txt` no parece estar en FROZEN.md — verificar en el commit del primer sub-sub-bloque backend. Si aparece, aplicar mismo patrón.

---

## §8 Criterio de terminado del bloque 2d completo

Binario (todos deben cumplirse):

- [ ] 10 sub-sub-bloques cerrados con `/cerrar-bloque` (Capa 7) individualmente o bajo la consolidación final.
- [ ] Deuda C1 de `docs/pendientes.md` marcada como mitigada (V2 no expone SSRF, V1 se nota como "a borrar").
- [ ] Export PDF pasa batería de tests SSRF (5+ vectores de ataque documentados, todos fallidos).
- [ ] Export DOCX produce archivo válido abrible en Word, LibreOffice, Google Docs.
- [ ] Documento con tapa + TOC + APA + matemáticas + comentarios + menciones se exporta a PDF sin pérdida visible.
- [ ] Rúbrica pegada como texto genera checklist accionable.
- [ ] Link público con token abre doc en read-only sin login; revocación funciona; expiración funciona.
- [ ] Comentarios inline persisten, se resuelven, thread responde.
- [ ] Menciones notifican al usuario mencionado (badge o email, según decisión en 2d.8).
- [ ] Modo enfoque y presentación funcionan sin crashes, incluyendo en mobile.
- [ ] STT/TTS funcionan en Chrome/Edge; fallback silencioso en Firefox/Safari.
- [ ] Duplicar, star, búsqueda global funcionan con test e2e.
- [ ] Bundle frontend de Workspaces no supera 2x el tamaño actual post-2c.
- [ ] Legal-docs-keeper emite reporte sobre 2d.6, 2d.7, 2d.9, 2d.10 con borradores de Política de Privacidad actualizada.
- [ ] Cristian aprueba explícitamente merges de 2d.7 y 2d.9 (componente legal obligatorio).
- [ ] CI verde en main.
- [ ] BLOCKS.md registra cierre del Bloque 2 completo.
- [ ] FROZEN.md extiende protección a todos los archivos nuevos del 2d.

---

## §9 Fuera de scope 2d

Explícitamente NO se hace en el 2d ni se planifica aquí:

- **IEEE/Chicago/MLA implementación completa**. Sólo scaffolding extensible en 2d.1. Implementación real es post-lanzamiento cuando haya demanda.
- **Collaborative whiteboard al lado del doc** (feature 28 del plan maestro). Se declara fuera de scope 2d — es un bloque aparte a futuro. El plan maestro lo lista pero se consideró demasiado tangente al core.
- **Task lists sincronizadas con calendario Conniku** (feature 18). Requiere integración con módulo Calendario que no es 2d. Se difiere a un "bloque de integraciones cross-módulo".
- **Emojis / reacciones inline** (feature 19). Difiere a Bloque 3 o a iteración menor del 2d.10 si sobra tiempo.
- **Permisos granulares por sección del doc** (feature 34). Requiere modelo de permisos complejo y decisión de producto. Difiere.
- **Integración Biblioteca para citas automáticas** (feature 26). Athena-5 del plan maestro ya lo declaró "sin integración". 2d.1 permite insertar citas manualmente, eso es suficiente.
- **Borrar V1 Trabajos Grupales** (archivos `collab_*`). Tarea separada a ejecutar después de que Cristian valide que V2 es suficiente. Plan aparte.
- **Merge de 2c a main**. Es prerequisito, no scope del 2d. Debe completarse antes de que 2d toque main.
- **Migrar docs V1 a V2**. Decidido en plan maestro A3 que V2 empieza vacío.

---

## §10 Componente legal — resumen de implicaciones

**Sub-sub-bloques con componente legal duro** (requieren flujo reforzado CLAUDE.md §Cumplimiento Legal y aprobación humana):

- **2d.7 Export PDF/DOCX** — cierre de C1 SSRF. Vulnerabilidad crítica pre-existente.
- **2d.9 Link público compartido** — exposición de datos fuera de autenticación, Ley 19.628, GDPR Art. 6.

**Sub-sub-bloques con componente legal blando** (legal-docs-keeper emite borrador, no bloqueante para merge pero sí para deploy a prod):

- **2d.6 Rúbrica** — almacenamiento de documentos subidos por el usuario (pueden contener datos personales de profesores, emails institucionales).
- **2d.8 Menciones** — notificaciones → política de comunicaciones de la app.
- **2d.10 STT/TTS + Voice notes** — procesamiento de voz del usuario, potencialmente biometría según interpretación legal. Almacenamiento de audio.

**Sub-sub-bloques sin componente legal adicional** (más allá de lo ya cubierto por el 2a-2c):

- 2d.1, 2d.2, 2d.3, 2d.4, 2d.5, **aunque 2d.5 toca seguridad de código por SymPy sandboxing** (M2 arriba). Seguridad ≠ legal estricto, pero requiere tratamiento cuidadoso.

**Fuentes legales a citar durante la implementación**:

- Ley 19.628 (Chile) — Protección de la Vida Privada, para manejo de datos personales en rúbricas, comentarios, voice notes, link público.
- Reglamento UE 2016/679 GDPR — Art. 6 base legal de tratamiento, Art. 13 deber de información, Art. 17 derecho al olvido (aplicable a voice notes, comentarios).
- Ley 19.496 (Chile) — Protección del Consumidor, aplicable si alguna feature toca flujos de pago (en 2d no aplica directamente).
- Principio de minimización de datos — recolectar sólo lo necesario. Voice notes y rúbricas deben tener política de retención clara.

**Tori declaración explícita**: este plan **NO afirma cumplimiento legal**. Sólo enumera las normas aplicables. La validación jurídica de cada implementación es responsabilidad del legal-docs-keeper y de revisión humana con abogado antes de deploy.

---

## §11 Estimación agregada

**Ejecución serial pura** (sin paralelismo interno, conservador):
- 2d.1: 1.5 días
- 2d.2: 1.5 días
- 2d.3: 1 día
- 2d.4: 1 día
- 2d.5: 1.5 días
- 2d.6: 2 días
- 2d.7: 2 días (+ tiempo legal-docs-keeper + aprobación Cristian)
- 2d.8: 2 días
- 2d.9: 1 día (+ tiempo legal-docs-keeper + aprobación Cristian)
- 2d.10: 2.5 días

**Total trabajo**: 16 días.
**Overhead de las 7 capas** (Capas 2-5 por cada sub-sub-bloque, ~2h cada uno × 10): ~2.5 días.
**Overhead Capas 6-7 Cristian**: depende de disponibilidad, estimable 1-2 días agregados.

**Estimación total sub-bloque 2d completo**: **19-22 días calendario** si serial, **13-16 días** si paralelismo interno autorizado (P1).

Comparación: 2a + 2b + 2c juntos tomaron aproximadamente 1 día calendario nocturno + iteraciones (métrica real del proyecto). El 2d completo es al menos **10x** el trabajo de cualquiera de esos. Esto **es esperable** porque los tres primeros hicieron fundaciones mínimas y el 2d es "todas las features".

**Recomendación Tori**: no ejecutar 2d completo en una sesión. Cristian debería priorizar **2d.1 + 2d.2 + 2d.7** como "versión mínima publicable" (~5 días) y diferir el resto a ventanas sucesivas. Esto permite lanzar Workspaces a usuarios reales con APA + TOC + Export en pocos días y aprender antes de construir matemáticas, comentarios, link público, etc.

---

## §12 Primer sub-sub-bloque a lanzar: recomendación

**2d.1 APA 7 + citas + referencias** es el mejor candidato para arrancar porque:

1. No requiere decisiones abiertas de Cristian (salvo confirmar si `@lexical/table` se instala ya).
2. No tiene componente legal obligatorio.
3. Es la base funcional que todos los demás sub-sub-bloques heredan.
4. Entrega valor visible inmediato (el editor "se ve APA").
5. Riesgo bajo-medio (R1 colisión Yjs, mitigable con tests).

**Lo que Tori requiere antes de lanzar web-architect en plan detallado de 2d.1**:
- Confirmación de Cristian: "procede con 2d.1 como primer sub-sub-bloque del 2d".
- Respuesta a K1 (wrapper KaTeX) — no bloquea 2d.1 pero sí 2d.3; mejor resolver temprano.
- `/unfreeze package.json` preventivo si se va a agregar `@lexical/table`.

---

## §13 Reporte — 4 secciones obligatorias CLAUDE.md

### 1. Lo que se me pidió

Cita literal (traducida a formato estructurado del mensaje original):
> "Produce el plan detallado del sub-bloque 2d Features Avanzadas del Bloque 2 Workspaces. Este scope es demasiado para un sub-bloque único. Propón división en sub-sub-bloques agrupando por stack técnico común, independencia de despliegue, riesgo/complejidad progresiva, valor funcional agrupado. Cada sub-sub-bloque debe caber en 1-2 días, criterio binario, documentar deps, priorizar los más valiosos. Entrega plan en `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/2d-features-avanzadas.md` con secciones Contexto, División, Dependencias, Orden, Riesgos, Preguntas, Reporte. Identifica decisiones clave abiertas. Lista deps npm nuevas. Estimación agregada. NO escribir código."

### 2. Lo que efectivamente hice

- **Archivo creado**: `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/2d-features-avanzadas.md` (este documento). Sin código de producto.
- **Archivos leídos** para fundamentar el plan:
  - `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/plan-maestro.md` (completo, 455 líneas)
  - `/Users/cristiang./CONNIKU/docs/plans/bloque-2-workspaces/2c-athena.md` (primeras 80 líneas)
  - `/Users/cristiang./CONNIKU/docs/pendientes.md` (sección CRÍTICO incluyendo C1)
  - `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/editorConfig.ts` (completo)
  - `/Users/cristiang./CONNIKU/src/components/workspaces/Editor/LexicalEditor.tsx` (imports y head, 40 líneas)
  - `/Users/cristiang./CONNIKU/FROZEN.md` (primeras 60 líneas)
  - `/Users/cristiang./CONNIKU/.claude/frozen-files.txt`
- **Comandos de exploración**:
  - `ls` de `docs/plans/bloque-2-workspaces/`, `docs/plans/bloque-2-workspaces/mockups/`
  - `ls` de `src/components/workspaces/`, `src/components/workspaces/Editor/`, `src/pages/Workspaces/`, `backend/workspaces_*.py`
  - `wc -l` en editor files y `workspaces_routes.py`
  - `Grep` de dependencias Lexical/Yjs/KaTeX en `package.json`
  - `Grep` de imports en `LexicalEditor.tsx`
- **Decisiones documentadas**: 10 sub-sub-bloques (2d.1 a 2d.10), grafo de dependencias, orden de ejecución en 4 fases, 8 riesgos transversales, 10 preguntas abiertas con recomendaciones, lista de deps frontend/backend, criterio de terminado binario (16 checks), componente legal por sub-sub-bloque.

### 3. Lo que no hice y por qué

- **No escribí planes detallados individuales** para cada uno de los 10 sub-sub-bloques. El mensaje pidió "plan de división" con tabla por sub-sub-bloque, no planes detallados separados. Cada sub-sub-bloque tendrá su propio plan cuando se lance (web-architect ronda 2).
- **No ejecuté `/unfreeze`** de `package.json`. Esa acción es de builder, no de architect.
- **No commiteé** el plan. El mensaje pide plan, no commit; el loop principal decidirá si commitear antes o después de discusión con Cristian.
- **No tomé decisiones K1, E1, E2, M1, M2, P1, S1, L1, C1, P1-paralelismo** por Cristian. Están listadas en §6 con recomendaciones Tori, pero la firma es de él.
- **No validé qué está actualmente en `backend/requirements.txt`**. La lista de deps nuevas se construye por probabilidad, sin leer el archivo. Si al ejecutar 2d.5 o 2d.6 resulta que alguna dep ya está, se ajusta en el plan detallado correspondiente.
- **No verifiqué qué decisiones legales quedaron pendientes de 2c**. El mensaje indica que 2c está pendiente de merge tras "legal"; mi plan asume que esa validación se completa antes de que 2d toque main. Si no es así, 2d.6/2d.7/2d.9/2d.10 quedan bloqueados por esa dependencia externa al plan.

### 4. Incertidumbres

- **El conteo "~65 features desagregadas"** del mensaje original y "~51 consolidadas" del plan maestro no coincide exactamente con la lista que armé. Agrupé "atajos de teclado + overlay ?", "duplicar + star + búsqueda global" y otras en sub-sub-bloques más gruesos. Puede haber features del plan maestro que omití sin darme cuenta — por ejemplo, **Task lists** (feature 18) aparece declarada fuera de scope en §9 pero no sé si Cristian confirma esa exclusión.
- **Las estimaciones de tiempo por sub-sub-bloque (1-2 días)** son gruesas. 2d.1 APA puede explotar si la validación en tiempo real requiere reescribir el theme Lexical; 2d.7 Export puede reventar si Render no soporta WeasyPrint. La incertidumbre real por sub-sub-bloque es de **+/-50%**, no la cifra puntual.
- **Paralelismo interno P1** es interpretación mía de CLAUDE.md §18.5. Puede que Cristian lo lea de forma más estricta y fuerce serial puro. Si es así, la estimación sube a 19-22 días y el plan de Fase II debe reformularse en orden lineal.
- **Orden 2d.1 primero** asume que Cristian está de acuerdo con priorizar "sensación APA académica" sobre otras features. Si prioriza "export para distribuir docs" más, 2d.7 podría ir antes (aunque no tiene contenido para exportar todavía, rompería la lógica de dependencias).
- **Decisión E1 Export PDF (Puppeteer vs WeasyPrint)** no la puedo tomar sin conocer las limitaciones actuales de la cuenta Render de Conniku (build time, disk, memory). Si Render libre/básico no soporta Chromium headless, WeasyPrint gana por default.
- **No consulté legal-docs-keeper** antes de escribir §10. La clasificación de "legal duro" vs "legal blando" por sub-sub-bloque es juicio Tori, no dictamen del agente legal. Puede que el legal-docs-keeper declare como duro algún sub-sub-bloque que marqué como blando (ej: menciones por ser notificación personal).
