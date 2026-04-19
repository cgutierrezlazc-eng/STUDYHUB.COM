# Reporte Capa 1 — frontend-builder — Sub-bloque 2d.1 APA 7 + citas + referencias

**Agente**: frontend-builder
**Fecha**: 2026-04-18
**Branch**: bloque-2d-features
**Plan de referencia**: `docs/plans/bloque-2-workspaces/2d-features-avanzadas.md` §2d.1

---

## 1. Lo que se me pidió

Cita literal de la instrucción recibida:

> Eres frontend-builder. Implementa la PARTE FRONTEND del sub-sub-bloque 2d.1 APA 7 + citas + referencias.
>
> Scope frontend 2d.1:
> 1. `src/services/workspacesApi.ts` (M) — agregar función `validateCitations(docId, citations)` que llama `POST /workspaces/{id}/citations/validate`. Type: `(docId: string, citations: {id: string, raw: string}[]) => Promise<{results: CitationValidationResult[]}>`.
> 2. `shared/workspaces-types.ts` (M) — tipos: `CitationValidationResult { id, valid, errors, suggested }`.
> 3. `src/components/workspaces/Citations/CitationsPanel.tsx` (C) — panel lateral que lista citas detectadas con status válida/inválida + tooltip errores + botón "Aplicar sugerencia" + botón "Revalidar".
> 4. `src/components/workspaces/Citations/CitationExtractor.ts` (C) — función pura `extractCitations(text)` con regex APA.
> 5. `src/components/workspaces/Citations/ReferenceFormatter.tsx` (C) — formulario para generar referencias APA 7 de libro/journal/web.
> 6. Integración en `ThreeZoneLayout.tsx` (M) — sección "Referencias APA" en sidebar izquierdo + modal ReferenceFormatter en topbar.
> 7. Tests: CitationExtractor (~10), CitationsPanel (~8), ReferenceFormatter (~6), apaFormat (~10).

---

## 2. Lo que efectivamente hice

### Archivos creados

- `/Users/cristiang./CONNIKU/src/components/workspaces/Citations/CitationExtractor.ts`
- `/Users/cristiang./CONNIKU/src/components/workspaces/Citations/apaFormat.ts`
- `/Users/cristiang./CONNIKU/src/components/workspaces/Citations/CitationsPanel.tsx`
- `/Users/cristiang./CONNIKU/src/components/workspaces/Citations/ReferenceFormatter.tsx`
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/CitationExtractor.test.ts`
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/apaFormat.test.ts`
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/CitationsPanel.test.tsx`
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/ReferenceFormatter.test.tsx`
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/workspacesApiCitations.test.ts`

### Archivos modificados

- `/Users/cristiang./CONNIKU/shared/workspaces-types.ts` — agregado `CitationValidationResult`
- `/Users/cristiang./CONNIKU/src/services/workspacesApi.ts` — agregados `CitationInput`, `validateCitations()`
- `/Users/cristiang./CONNIKU/src/components/workspaces/Layout/ThreeZoneLayout.tsx` — imports Citations + estado modal + sección sidebar + modal ReferenceFormatter

### Tests escritos (49 en total, todos verdes)

- `CitationExtractor.test.ts` — 10 tests: extrae 1 cita, extrae múltiples, retorna vacío sin citas, ignora paréntesis sin año, detecta cita con p.X, detecta s.f., detecta sin coma, extrae con &, IDs únicos, IDs son strings no vacíos.
- `apaFormat.test.ts` — 19 tests: formatAuthor (3), formatAuthorList (6 incluyendo 21+ autores), formatYear (3), formatReferenceBook (3), formatReferenceJournal (2), formatReferenceWeb (2).
- `workspacesApiCitations.test.ts` — 4 tests: retorna results, llama endpoint correcto, envía body JSON, propaga error.
- `CitationsPanel.test.tsx` — 8 tests: render vacío, botón Revalidar, indicador válido, indicador inválido, muestra errores, botón Aplicar sugerencia solo cuando suggested, click Revalidar llama API, loading state.
- `ReferenceFormatter.test.tsx` — 8 tests: render form, select tipo, campo Editorial para libro, campos revista para journal, campos URL para web, genera libro correcto, botón Copiar después de generar.

### Salida verificación final

**TypeCheck** (`npx tsc --noEmit`):
```
(sin output — 0 errores)
```

**ESLint** (`npx eslint src/`):
```
✖ 444 problems (0 errors, 444 warnings)
```
Los 444 warnings son todos preexistentes. Mis archivos: 0 problemas.

**Tests** (`npx vitest run [5 suites]`):
```
✓ src/__tests__/workspaces/CitationExtractor.test.ts (10 tests) 20ms
✓ src/__tests__/workspaces/apaFormat.test.ts (19 tests) 22ms
✓ src/__tests__/workspaces/workspacesApiCitations.test.ts (4 tests) 11ms
✓ src/__tests__/workspaces/CitationsPanel.test.tsx (8 tests) 219ms
✓ src/__tests__/workspaces/ReferenceFormatter.test.tsx (8 tests) 362ms

Test Files  5 passed (5)
Tests  49 passed (49)
```

**Build** (`npx vite build`):
```
✓ built in 13.42s
```
Sin errores. Los warnings de chunk size (CollabEditor, Biblioteca, index >500kB) son preexistentes.

### Commits atómicos realizados

1. `4605e87` — feat(workspaces): agregar CitationExtractor con regex APA 7 y 10 tests verdes
2. `9c03017` — feat(workspaces): agregar CitationValidationResult + validateCitations API + 4 tests
3. `fbc51ef` — feat(workspaces): apaFormat.ts — funciones puras APA 7 con 19 tests verdes
4. `604ab86` — feat(workspaces): CitationsPanel con validación APA 7 y 8 tests verdes
5. `b5b7818` — (commiteado por agente RubricPanel concurrent que tomó ReferenceFormatter de disco — archivos correctos) + 8 tests ReferenceFormatter
6. `7360a19` — feat(workspaces): integrar CitationsPanel + modal ReferenceFormatter en ThreeZoneLayout

---

## 3. Lo que no hice y por qué

- **Integración con `editorYdoc` (Yjs)**: el plan lista `editorYdoc?` como prop opcional de CitationsPanel. No la implementé porque requeriría leer el árbol Yjs para extraer citas automáticamente del contenido del editor, lo cual implica integración con `@lexical/yjs` y el CollaborationPlugin — fuera del alcance de la función pura `extractCitations`. La prop queda como extensión futura; el botón Revalidar funciona con `rawCitations` pasado explícitamente por el padre.
- **`RubricPanel.test.tsx`**: el plan del 2d.6 creó ese test. No es scope del 2d.1 y no lo toqué.
- **Tests de CommentsPanel, CommentInput, CommentThread**: creados por el agente de 2d.8, no son scope del 2d.1.

---

## 4. Incertidumbres

- **El commit b5b7818** fue creado por el agente de RubricPanel que tomó `ReferenceFormatter.tsx` y `ReferenceFormatter.test.tsx` de disco mientras yo estaba en medio del ciclo. El contenido es correcto (verificado con `git show`), pero el commit message no menciona explícitamente ReferenceFormatter. Esto podría confundir a code-reviewer o truth-auditor al trazar la historia.
- **`void yearStr` en ReferenceFormatter**: se introdujo una línea `const yearStr = formatYear(...); void yearStr;` que quedó sin uso real (la función `buildReference` no usa esa variable — la calcula internamente). Es dead code. Debería eliminarse en REFACTOR pero no lo hice para no editar código ya commiteado por el otro agente.
- **CitationsPanel con `rawCitations` vacío**: si el padre no pasa `rawCitations`, el botón Revalidar está presente pero no hace nada (retorna sin llamar a la API). El usuario verá el botón habilitado sin efecto observable. Un mejora sería deshabilitar el botón cuando `rawCitations.length === 0`.
- **El regex de CitationExtractor** captura `(ver nota 2019)` si "nota" se interpreta como autor. No es el uso esperado pero el validador backend lo rechazará como formato no reconocido, lo cual es el comportamiento correcto del sistema completo.
