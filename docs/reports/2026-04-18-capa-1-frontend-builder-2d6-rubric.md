# Reporte Capa 1 — frontend-builder — Sub-sub-bloque 2d.6 Rúbrica

**Agente**: frontend-builder  
**Fecha**: 2026-04-18  
**Branch**: bloque-2d-features  
**Plan de referencia**: `docs/plans/bloque-2-workspaces/2d-features-avanzadas.md` §2d.6

---

## 1. Lo que se me pidió

Cita literal de la instrucción:

> Implementa la PARTE FRONTEND del sub-sub-bloque **2d.6 Rúbrica upload + checklist**.
>
> **Scope frontend 2d.6**:
> 1. `src/services/workspacesApi.ts` (M) — agregar 3 funciones: `uploadRubricText`, `uploadRubricFile`, `getRubric`. Tipos de response: `{ items: RubricItem[], warnings: string[] }`.
> 2. `shared/workspaces-types.ts` (M) — tipos `RubricItem` y `RubricData`.
> 3. `src/components/workspaces/Rubric/RubricPanel.tsx` (C) — panel en sidebar izquierda del ThreeZoneLayout.
> 4. `src/components/workspaces/Rubric/RubricUploadModal.tsx` (C) — modal con drop-zone, textarea alternativa, botón "Parsear" y "Guardar".
> 5. `src/components/workspaces/Layout/ThreeZoneLayout.tsx` (M) — reemplazar placeholder Rúbrica por `<RubricPanel docId={docId} />`.
> 6. Tests: `RubricPanel.test.tsx` (~8 tests), `RubricUploadModal.test.tsx` (~6 tests).

---

## 2. Lo que efectivamente hice

### Archivos creados

- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/workspacesApiRubric.test.ts` — 10 tests para las 3 funciones API
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/RubricPanel.test.tsx` — 8 tests del panel
- `/Users/cristiang./CONNIKU/src/__tests__/workspaces/RubricUploadModal.test.tsx` — 6 tests del modal
- `/Users/cristiang./CONNIKU/src/components/workspaces/Rubric/RubricPanel.tsx` — componente panel
- `/Users/cristiang./CONNIKU/src/components/workspaces/Rubric/RubricUploadModal.tsx` — componente modal

### Archivos modificados

- `/Users/cristiang./CONNIKU/shared/workspaces-types.ts` — tipos `RubricItem` y `RubricData` agregados
- `/Users/cristiang./CONNIKU/src/services/workspacesApi.ts` — 3 funciones nuevas + import `RubricData` y `WorkspaceComment` consolidados al bloque de imports inicial (eliminando imports duplicados del medio del archivo)
- `/Users/cristiang./CONNIKU/src/components/workspaces/Layout/ThreeZoneLayout.tsx` — import `RubricPanel` + reemplazo del placeholder

### Tests escritos (nombres específicos)

**workspacesApiRubric.test.ts** (10 tests):
- `uploadRubricText > llama POST /workspaces/{docId}/rubric/text con body { text }`
- `uploadRubricText > retorna { items, warnings } del servidor`
- `uploadRubricText > propaga error cuando la respuesta no es ok`
- `uploadRubricFile > llama POST /workspaces/{docId}/rubric/upload`
- `uploadRubricFile > envía FormData con el archivo`
- `uploadRubricFile > retorna { items, warnings } del servidor`
- `uploadRubricFile > propaga error cuando la respuesta no es ok`
- `getRubric > llama GET /workspaces/{docId}/rubric`
- `getRubric > retorna { raw, items, warnings }`
- `getRubric > propaga error cuando la respuesta no es ok`

**RubricPanel.test.tsx** (8 tests):
- `muestra estado vacío con botón "Subir rúbrica" y textarea cuando no hay rúbrica`
- `muestra lista de ítems con checkboxes cuando hay rúbrica`
- `check de un ítem actualiza el estado y persiste en localStorage`
- `uncheck de un ítem actualiza el estado y actualiza localStorage`
- `abre el modal al hacer click en "Subir rúbrica"`
- `muestra botón "Editar rúbrica" cuando hay ítems cargados`
- `muestra warning banner cuando hay warnings en la respuesta`
- `muestra mensaje de error cuando falla la carga de rúbrica (distinto de 404)`

**RubricUploadModal.test.tsx** (6 tests):
- `renderiza con botón "Parsear", textarea y botón "Cancelar"`
- `pegar texto y parsear ok muestra los ítems parseados`
- `upload archivo y parsear ok llama uploadRubricFile`
- `warning banner visible tras parseo con warnings`
- `cerrar modal al hacer click en "Cancelar" llama onClose`
- `error de API al parsear muestra mensaje de error`

### Salida de verificaciones

**`npx tsc --noEmit`**:
```
(sin output) → exit code 0
TYPECHECK: OK
```

**`npx eslint src/services/workspacesApi.ts src/components/workspaces/Rubric/ src/components/workspaces/Layout/ThreeZoneLayout.tsx`**:
```
(sin output) → exit code 0
LINT: OK
```

**`npx vitest run src/__tests__/workspaces/workspacesApiRubric.test.ts src/__tests__/workspaces/RubricPanel.test.tsx src/__tests__/workspaces/RubricUploadModal.test.tsx`**:
```
✓ src/__tests__/workspaces/workspacesApiRubric.test.ts (10 tests) 26ms
✓ src/__tests__/workspaces/RubricPanel.test.tsx (8 tests) 578ms
✓ src/__tests__/workspaces/RubricUploadModal.test.tsx (6 tests) 668ms

Test Files  3 passed (3)
Tests  24 passed (24)
```

**Suite completa `npx vitest run`**:
```
Test Files  31 passed (31)
Tests  272 passed (272)
```

**`npx vite build`**:
```
✓ built in 22.96s
(chunk size warnings son preexistentes, no nuevos)
```

### Commits atómicos

```
6f2b1a6  feat(workspaces): agregar tipos RubricItem y RubricData en shared/workspaces-types
0324f14  feat(workspaces): agregar uploadRubricText, uploadRubricFile, getRubric con 10 tests
bb2138b  feat(workspaces): agregar RubricPanel y RubricUploadModal con 14 tests
b5b7818  feat(workspaces): integrar RubricPanel en ThreeZoneLayout reemplazando placeholder
```

---

## 3. Lo que no hice y por qué

- **No agregué CSS específico de RubricPanel/RubricUploadModal**: el plan no especificó estilos propios, los componentes usan clases BEM (`rubric-panel__*`, `rubric-modal__*`) preparadas para recibir CSS en iteraciones posteriores. El layout funciona con el CSS heredado del workspace.
- **No sincronizé el estado de checkboxes de forma colaborativa**: decisión explícita del plan — `localStorage` local, sin sincronización Yjs. El plan declara: "Si Cristian lo quiere colaborativo será iter-2."
- **No escribí test unitario de ThreeZoneLayout para el nuevo slot de Rúbrica**: el plan no lo listó como test requerido, y el comportamiento queda cubierto indirectamente por los tests de RubricPanel que verifican el componente en aislamiento.

Ningún punto del plan quedó pendiente más allá de las exclusiones explícitas arriba.

---

## 4. Incertidumbres

- **Orden de trabajo invertido por restricción del hook**: el hook `post-edit-verify.sh` bloqueó escribir el test antes del componente (el typecheck fallaba porque el módulo no existía). Creé los componentes antes que los tests para satisfacer al hook, lo que invirtió el ciclo TDD. Los tests verifican el comportamiento correcto, pero no pasaron por la fase RED pura. Es posible que haya comportamientos del componente que no cubrí porque diseñé el test _después_ de ver la implementación.

- **Prettier en el branch**: el formatter reformateó ThreeZoneLayout tras mi primer commit, revirtiendo cambios. El workflow de stash para verificar errores preexistentes también causó una reversión temporal. Existe la posibilidad de que algún cambio sutil del formatter haya afectado el JSX del ThreeZoneLayout de forma que no capturé visualmente.

- **Errores de TypeScript en CommentThread.tsx (sub-bloque 2d.8)**: el typecheck final pasa limpio, pero hubo una ventana durante la sesión donde `CommentThread.tsx` mostraba errores TS (`currentUser` inexistente). Esos errores desaparecieron sin que yo los tocara — sugiere que el stash/unstash del formatter restableció un estado. No tengo certeza absoluta de que esos archivos estén tipados correctamente en el estado actual del branch.
