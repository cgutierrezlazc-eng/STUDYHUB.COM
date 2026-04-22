# Plan — Bloque `hardening-c1-ssrf-v1`

**Autor**: web-architect (Tori)
**Fecha**: 2026-04-19
**Tamaño estimado**: pequeño (entre medio día y 1 día de trabajo)
**Tipo de bloque**: hardening de seguridad técnica
**Componente legal**: NO aplica directamente (ver §10)

---

## 1. Contexto

### 1.1 De dónde viene C1

La auditoría Konni Main del 2026-04-16 (top 34 CRITICAL, item #24) detectó
que `backend/collab_routes.py:455-503` — el endpoint
`GET /collab/{doc_id}/export/pdf` de Trabajos Grupales V1 — pasa el HTML
crudo del documento directamente a `xhtml2pdf.pisa.CreatePDF`. Esa
librería hace fetch de URLs contenidas en tags `<img>` sin whitelist ni
validación de esquema, lo que habilita:

- SSRF al endpoint de metadata de AWS
  `http://169.254.169.254/latest/meta-data/` → filtración de credenciales
  IAM del servidor Render
- SSRF a `file:///etc/passwd` y otros paths locales
- SSRF a IPs RFC1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) y
  link-local
- SSRF via esquemas no-HTTP (`gopher://`, `ftp://`)
- XSS via `<script>`, event handlers (`onerror`, `onclick`), `<iframe>`,
  `javascript:` en href
- Dependiendo del entorno de `xhtml2pdf`, potencial RCE si la librería
  procesa contenido controlado por atacante en ciertas rutas de código

### 1.2 Qué se hizo en commit `192f1b6` (Bloque 2 v1, merged a main)

El commit `192f1b6` (feat(ws): Bloque 2 Workspaces v1 publicable) incluyó
el fix real de C1 en V1 como parte del alcance del Bloque 2. El endpoint
`collab_routes.py::export_pdf` ahora:

1. Importa `sanitize_html` e `inline_remote_images` desde el módulo V2
   `backend/workspaces_export.py`
2. Aplica `sanitize_html(raw_html)` antes de nada — bleach con whitelist
   restrictiva elimina `<script>`, event handlers, `<iframe>`,
   `javascript:` en href
3. Aplica `inline_remote_images(sanitized)` — pre-descarga imágenes
   desde dominios whitelisted (`*.conniku.com`, `cdn.conniku.com`,
   `api.conniku.com`), convierte a `data:image/*;base64`, elimina del
   HTML cualquier `<img>` cuya URL esté fuera de whitelist o apunte a
   IPs RFC1918 / link-local / protocolos no-HTTPS
4. Solo después pasa el HTML ya saneado a `pisa.CreatePDF`

Código actual confirmado por lectura directa en
`backend/collab_routes.py:455-516` (líneas 460-471 tienen el comentario
del fix y los llamados). La defensa en profundidad ya existe y está en
producción desde el merge del Bloque 2 v1.

### 1.3 Qué falta para cerrar C1 formalmente

El fix está aplicado pero el cierre formal de la deuda todavía no se
ha ejecutado. Quedan cuatro piezas pendientes:

1. **Tests de seguridad dedicados al endpoint V1.** Los 15 tests de
   `backend/tests/test_workspaces_export_security.py` cubren las
   funciones `sanitize_html` e `inline_remote_images` en abstracto, pero
   no prueban que el endpoint HTTP `GET /collab/{doc_id}/export/pdf`
   invoca correctamente esas funciones. Sin esos tests, una regresión
   futura (alguien que edite `export_pdf` y olvide aplicar las
   sanitizaciones) pasaría silenciosamente.

2. **Decisión sobre `xhtml2pdf` en `requirements.txt`.** Ver §2.D2.

3. **Documentación de cierre.** Actualizar `docs/pendientes.md` C1 de
   "MITIGACIÓN PARCIAL" a "CERRADO" con fecha + commit + evidencia.
   Agregar entrada en `BLOCKS.md`. Evaluar agregar
   `backend/collab_routes.py::export_pdf` a `FROZEN.md`.

4. **Verificación de no-regresión funcional V1.** Confirmar que después
   del fix, el endpoint sigue generando PDFs válidos para documentos
   legítimos (sin imágenes externas, con imágenes `data:`, con imágenes
   de dominio Conniku whitelisted).

### 1.4 Archivos relevantes leídos

- `/Users/cristiang./CONNIKU/backend/collab_routes.py` líneas 455-516
  (endpoint `export_pdf` V1 parchado)
- `/Users/cristiang./CONNIKU/backend/workspaces_export.py` líneas 1-80
  (docstring + imports que revelan origen del fix)
- `/Users/cristiang./CONNIKU/backend/tests/test_workspaces_export_security.py`
  (15 tests de referencia a replicar)
- `/Users/cristiang./CONNIKU/backend/requirements.txt` línea 29
  (`xhtml2pdf>=0.2.11`)
- `/Users/cristiang./CONNIKU/docs/pendientes.md` C1 (líneas 17-32)
- `/Users/cristiang./CONNIKU/BLOCKS.md` (formato de registro)
- `/Users/cristiang./CONNIKU/FROZEN.md` (formato de registro)
- Commit `192f1b6` en git log (fix de C1 V1 incluido en mensaje)

### 1.5 Hallazgo crítico del análisis

**`xhtml2pdf` NO es removible de `requirements.txt`.** Grep en el
backend muestra que también lo usan:

- `backend/hr_routes.py:1667, 2265, 2320` — generación de contratos
  laborales, anexos, pactos de horas extras, descuentos voluntarios,
  finiquitos, libro de remuneraciones, DJ1887 (documentos legales
  laborales chilenos)

Retirar `xhtml2pdf` romperia el módulo HR completo, que está
`FROZEN.md`-protegido (`backend/hr_routes.py`, confirmado 2026-04-16) y
es crítico legal (documentos firmados ante SII, DT, AFP). Esto elimina
la Opción B del enunciado original. Ver §2.D2 para la decisión ajustada.

---

## 2. Decisiones de diseño

### D1. Alcance de tests de seguridad del endpoint V1

**Alternativas consideradas**:

- **A1**. Replicar los 15 tests completos de
  `test_workspaces_export_security.py` adaptados al endpoint V1
- **A2**. Hacer solo tests de integración HTTP que prueben que el
  endpoint invoca `sanitize_html` + `inline_remote_images` (mock de
  ambas funciones, verificar que se llaman con los argumentos
  esperados)
- **A3**. Hibrido: un test de integración HTTP "happy path" + 5-6 tests
  unitarios de vectores de ataque representativos (AWS metadata, file,
  RFC1918, script, onerror)

**Criterios aplicados**:

- Redundancia útil vs sobre-ingeniería: los 15 tests de V2 ya cubren
  las funciones subyacentes. Lo que falta probar es el **cableado**
  (que el endpoint V1 realmente invoca las funciones) y la **no
  regresión** del camino feliz V1 (que el PDF sigue generándose bien
  para contenido legítimo)
- Velocidad de ejecución: los 15 tests V2 tardan ~2-3s; replicarlos a
  nivel HTTP agrega overhead de fixtures FastAPI TestClient
- Valor marginal: los tests V2 ya garantizan que
  `sanitize_html`/`inline_remote_images` funcionan. Duplicarlos a nivel
  HTTP no detecta nada que los V2 no detecten

**Decisión**: **A3 hibrido**. Archivo nuevo
`backend/tests/test_collab_export_security.py` con:

- 1 test de integración HTTP `test_export_pdf_happy_path`: mock del
  documento, PDF generado correctamente, status 200,
  `Content-Type: application/pdf`
- 5 tests unitarios que verifican el cableado vía mock spies sobre las
  dos funciones de sanitización:
  1. `test_endpoint_invoca_sanitize_html` — spy confirma que se llama
  2. `test_endpoint_invoca_inline_remote_images` — spy confirma que se
     llama con el output de `sanitize_html`
  3. `test_aws_metadata_eliminada_end_to_end` — request con imagen a
     `169.254.169.254` en el `doc.content`, PDF generado NO contiene
     esa URL, NO hay request HTTP a esa URL
  4. `test_script_tag_no_aparece_en_pdf` — documento con `<script>`,
     PDF generado no lo contiene
  5. `test_imagen_conniku_whitelisted_preservada` — imagen de
     `cdn.conniku.com` se preserva como data: URI en el PDF

Total: 6 tests. Cobertura suficiente para detectar regresiones del
cableado sin duplicar la batería V2.

**Razonamiento**: cada test nuevo debe responder a una pregunta
distinta. Los 15 tests V2 responden "¿funcionan `sanitize_html` e
`inline_remote_images`?". Los 6 tests V1 responden "¿el endpoint V1 las
invoca correctamente en el orden correcto?". Dos preguntas distintas,
dos conjuntos de tests sin redundancia tonta.

### D2. Futuro de `xhtml2pdf` y del endpoint V1

**Alternativas consideradas**:

- **Opción A (original)**: mantener `xhtml2pdf` + mantener endpoint V1
  parchado. Status quo.
- **Opción B (original)**: retirar `xhtml2pdf` de `requirements.txt`.
  **Imposible** — ver §1.5: rompe HR completo (FROZEN).
- **Opción C (original)**: mantener `xhtml2pdf` pero forzar el endpoint
  V1 a devolver `410 Gone` para obligar a migrar a V2.

**Criterios aplicados**:

- Existencia de usuarios reales usando V1: V2 Workspaces es un módulo
  nuevo (Bloque 2 v1 publicable recién merged). V1 `collab_routes.py`
  sigue siendo el camino canónico para documentos existentes de
  Trabajos Grupales y tiene datos históricos de usuarios.
- Riesgo de regresión al forzar 410: romperíamos exports de documentos
  V1 ya creados antes de que exista camino de migración automática
  V1→V2.
- Riesgo residual de la Opción A: el fix está aplicado pero un builder
  futuro podría editar `export_pdf` y olvidar aplicar las
  sanitizaciones. Esto se mitiga agregando `backend/collab_routes.py` a
  `FROZEN.md` y con los tests de D1.

**Decisión**: **Opción A + mitigaciones**. Mantener `xhtml2pdf` en
`requirements.txt` (además es requerido por HR). Mantener el endpoint
V1 funcional y parchado. Agregar mitigaciones que reducen el riesgo
residual a niveles aceptables:

- `backend/collab_routes.py` a `FROZEN.md` (ver D3)
- Tests de cableado de D1
- Opción C queda documentada como **escalamiento futuro** si en algún
  momento V1 queda sin usuarios: en ese caso, deprecar el endpoint V1
  con `410 Gone` y eventualmente eliminar el código (bloque separado,
  no este).

**Pregunta abierta Q2**: Cristian confirma mantener Opción A? O quiere
programar ya la deprecación via 410 (Opción C) con fecha fija?

**Razonamiento**: tres factores empujan hacia A: (1) `xhtml2pdf` es
irremovible por HR, (2) V1 tiene datos reales de usuarios, (3) el fix
ya está aplicado y testeado (con los tests nuevos de D1). La Opción C
es técnicamente válida pero requiere decisión de producto sobre
deprecación de V1, que está fuera del scope de este bloque de
hardening.

### D3. `backend/collab_routes.py` a `FROZEN.md`

**Alternativas consideradas**:

- **A1**. Freezar el archivo completo
- **A2**. Freezar solo la función `export_pdf` (línea 455-516)
- **A3**. No freezar nada — confiar en los tests

**Criterios aplicados**:

- Granularidad soportada por `FROZEN.md`: el formato actual acepta
  columna "Seccion" que puede decir "completo" o un rango específico.
  Precedente en la tabla: `backend/hr_routes.py` sección "completo",
  `src/admin/tools/BibliotecaDocumentos.tsx` sección "hooks order".
- Otros endpoints de `collab_routes.py` (chat, comentarios, acceso,
  etc.) podrían necesitar edits futuros sin tener relación con SSRF.
  Freezar completo bloquearía mantenimiento normal.
- Riesgo concreto: lo único sensible a proteger es que `export_pdf`
  siga invocando `sanitize_html` + `inline_remote_images` antes de
  `pisa.CreatePDF`. No el resto del archivo.

**Decisión**: **A2**. Agregar entrada en `FROZEN.md`:

```
| `backend/collab_routes.py` | export_pdf (L455-516) | 2026-04-19 |
hardening-c1-ssrf-v1: endpoint parchado contra SSRF. Editar requiere
preservar sanitize_html + inline_remote_images antes de pisa.CreatePDF
```

**Razonamiento**: freeze quirúrgico protege lo crítico sin paralizar
mantenimiento del resto del archivo. Alineado con granularidad ya
demostrada en FROZEN.md.

### D4. Dónde vive la actualización de `docs/pendientes.md`

**Alternativas consideradas**:

- **A1**. Tachar C1 con `~~strikethrough~~` y mantenerlo en la sección
  CRÍTICO para preservar trazabilidad
- **A2**. Mover C1 a una sección nueva "Resueltos" al final del archivo
- **A3**. Cambiar el texto "MITIGACIÓN PARCIAL" a "CERRADO ✓" inline
  con fecha + commit, mantenerlo en CRÍTICO

**Criterios aplicados**:

- Precedente existente: C8 "Webhooks MP/PayPal fail-open (resuelto)"
  sigue el patrón A3 — se mantiene en CRÍTICO con anotación "✅
  MERGEADO (PR #2, commit b8c46f5) 2026-04-18" y nota "Conservar como
  referencia"
- Trazabilidad: mantener en CRÍTICO con marca ✅ permite ver de un
  vistazo qué era crítico y qué ya se cerró, sin buscar en secciones
  separadas

**Decisión**: **A3** siguiendo precedente de C8. Cambiar título a
"C1. SSRF/RCE en collab_routes (Trabajos Grupales V1) (RESUELTO)" con
anotación de estado "✅ CERRADO (bloque hardening-c1-ssrf-v1, commit
{hash del commit que cierre el bloque}) 2026-04-19".

---

## 3. Archivos a tocar

### 3.1 Archivos nuevos

| Ruta | Contenido |
|------|-----------|
| `backend/tests/test_collab_export_security.py` | 6 tests descritos en D1 |

### 3.2 Archivos a modificar

| Ruta | Cambio |
|------|--------|
| `docs/pendientes.md` | C1: "MITIGACIÓN PARCIAL" → "✅ CERRADO" + fecha + commit. Título sumar "(RESUELTO)" |
| `BLOCKS.md` | Agregar fila `hardening-c1-ssrf-v1` con fecha cierre + archivos + notas |
| `FROZEN.md` | Agregar entrada `backend/collab_routes.py` sección `export_pdf (L455-516)` |

### 3.3 Archivos NO tocados (explícitamente fuera de scope)

- `backend/collab_routes.py` — el fix ya está aplicado en commit
  `192f1b6`. No se re-edita.
- `backend/workspaces_export.py` — FROZEN implícito por Bloque 2
  cerrado. No se toca.
- `backend/collab_ws.py` — FROZEN explícito (línea 35 de FROZEN.md).
- `backend/requirements.txt` — se mantiene `xhtml2pdf` por decisión D2.
- `backend/tests/test_workspaces_export_security.py` — no se duplican
  sus tests.
- Modelos DB — no se tocan.
- Otros endpoints de `collab_routes.py` — no se tocan.

---

## 4. Plan TDD

Este bloque NO implementa código de producción nuevo; el fix real ya
existe. El TDD aquí se limita a los tests de cableado (D1).

### Ciclo único: tests de cableado V1

**RED** (estimado 40-60 min):

1. Builder escribe los 6 tests en
   `backend/tests/test_collab_export_security.py`
2. Ejecuta `pytest backend/tests/test_collab_export_security.py -v`
3. Resultado esperado: **los 6 tests PASAN inmediatamente**, porque el
   fix ya está aplicado en `192f1b6`.

**Advertencia crítica del protocolo TDD**: si los tests pasan en la
primera ejecución sin código nuevo, normalmente esto se interpreta
como "el test es insuficiente o el comportamiento ya existe". En este
caso específico **ambas cosas son ciertas por diseño**: el
comportamiento ya existe (ese es el punto, C1 ya está mitigado) y el
test está escrito precisamente para **verificar regresión futura**. No
es un caso de TDD puro porque no estamos implementando código nuevo;
estamos agregando una red de seguridad para código existente.

El builder debe declarar esto explícitamente en su reporte para no
violar la sección "RED" del protocolo TDD de CLAUDE.md. Esta es una
excepción documentada al TDD puro equivalente a las excepciones
listadas en CLAUDE.md ("cambios de configuración", "correcciones
tipográficas"): aquí es "agregar tests de regresión sobre código ya
deployado".

**GREEN**: no aplica — no hay código nuevo que escribir.

**REFACTOR** (opcional, 10-20 min): si algún test quedó redundante o
excesivamente acoplado a detalles de implementación, el builder puede
consolidar. Sin refactor de código de producción.

### Validación de no-regresión

Además del pytest del archivo nuevo, correr toda la suite para
confirmar que no rompimos nada:

- `pytest backend/tests/ -v` — debe pasar igual que antes
- `ruff check backend/`
- `ruff format --check backend/`

---

## 5. Orden de implementación

1. **Builder (backend-builder)**: crea
   `backend/tests/test_collab_export_security.py` con los 6 tests de
   D1. Ejecuta `pytest` sobre el archivo → debe pasar en primera
   ejecución. Reporta con sección "excepción TDD" documentada (§4).
2. **Builder**: ejecuta suite completa + ruff check + ruff format.
   Todo verde.
3. **Documentación (builder o web-architect)**: actualiza
   `docs/pendientes.md` C1 (cambio de status), `BLOCKS.md` (fila
   nueva), `FROZEN.md` (entrada nueva).
4. **qa-tester**: ejecuta manualmente el endpoint V1 contra servidor
   local. Envía request `GET /collab/{doc_id}/export/pdf` con un
   documento de prueba cuyo `content` tenga:
   - caso 1: texto plano sin imágenes → PDF generado OK
   - caso 2: `<img src="data:image/png;base64,...">` → imagen aparece
     en PDF
   - caso 3: `<img src="http://169.254.169.254/latest/meta-data/">` →
     imagen desaparece del PDF, no hay request a 169.254.x.x
   - caso 4: `<img src="https://cdn.conniku.com/test.png">` → imagen
     se inlineó como base64 en el PDF
5. **code-reviewer**: audita diff (tests nuevos + docs). Quality score.
6. **truth-auditor**: re-ejecuta pytest, verifica estado de
   `pendientes.md`/`BLOCKS.md`/`FROZEN.md`, confirma que el endpoint
   V1 responde 200 con PDF válido. Quality score.
7. **gap-finder**: ejecución si aplica (bloque chico — evaluable).
8. **Cristian**: OK final. Merge a main.

No hay Capa 6 (inspección web online) porque este bloque no tiene UI.
La inspección funcional la cubre qa-tester en paso 4.

---

## 6. Riesgos

### 6.1 Riesgo alto

Ninguno identificado.

### 6.2 Riesgo medio

**R-M1. Regresión funcional del endpoint V1 por cambio sutil**
(probabilidad: baja-media; impacto: alto)

El fix de `192f1b6` cambia cómo se procesa el HTML antes de
`pisa.CreatePDF`. Hay riesgo residual (pero bajo) de que documentos
V1 legítimos que antes generaban PDFs ahora fallen, por ejemplo si:
- `sanitize_html` elimina un tag que xhtml2pdf sí soportaba y que
  estaba en documentos antiguos
- `inline_remote_images` falla descargando una imagen Conniku
  whitelisted por timeout y elimina la imagen

**Mitigación**: paso 4 de §5 prueba con documentos reales. Si alguno
falla, se documenta en §7 preguntas abiertas y Cristian decide ajuste.

**R-M2. Tests de cableado quedan demasiado acoplados al import path**
(probabilidad: media; impacto: bajo)

Los tests con mock spies sobre `sanitize_html` y `inline_remote_images`
requieren conocer el path exacto del import (`workspaces_export` o
`backend.workspaces_export` dependiendo del contexto). Si el path
cambia, los tests fallan.

**Mitigación**: usar el mismo path que usa el endpoint real
(`from workspaces_export import ...` line 468 del código parchado).
Si cambia, cambia en los dos lados.

### 6.3 Riesgo bajo

**R-B1. Falsa sensación de cierre si los 6 tests no cubren vector
real**.

**Mitigación**: el test 3 (`test_aws_metadata_eliminada_end_to_end`)
cubre el vector más crítico (AWS metadata). Los otros vectores ya
están cubiertos por los 15 tests V2 sobre `sanitize_html` e
`inline_remote_images`.

**R-B2. `xhtml2pdf` sigue en `requirements.txt` → superficie de
ataque conservada para HR**.

**Mitigación**: fuera de scope de este bloque. HR tiene su propio
generador PDF con input controlado por el backend (templates internos,
no HTML de usuario). Es un riesgo distinto que se atiende en bloque
propio si aparece.

---

## 7. Criterio de terminado

Todos los checkboxes siguientes son verificables por comando u
observación directa. No se acepta "debería funcionar".

- [ ] `backend/tests/test_collab_export_security.py` existe
- [ ] `pytest backend/tests/test_collab_export_security.py -v` sale
      con 6 passed, 0 failed
- [ ] `pytest backend/tests/ -v` sale verde (ninguna regresión en las
      demás suites)
- [ ] `ruff check backend/` sin errores
- [ ] `ruff format --check backend/` sin diffs
- [ ] `docs/pendientes.md` C1 muestra "✅ CERRADO" con fecha y commit
- [ ] `BLOCKS.md` tiene fila `hardening-c1-ssrf-v1` con todos los
      campos llenos
- [ ] `FROZEN.md` tiene entrada
      `backend/collab_routes.py | export_pdf (L455-516) | 2026-04-19`
- [ ] qa-tester ejecutó los 4 casos del paso 4 §5 y reportó resultado
      de cada uno con output real (no "asumo que funciona")
- [ ] code-reviewer emitió quality score PASS (85+)
- [ ] truth-auditor emitió quality score PASS (85+)
- [ ] Cristian dio OK explícito

---

## 8. Fuera de scope

- **C2-C9 de `docs/pendientes.md`**: este bloque cierra únicamente C1.
  Los demás críticos tienen sus propios bloques sugeridos.
- **Migración de usuarios V1 → V2 Workspaces**: no se automatiza en
  este bloque. V1 sigue funcionando para documentos legacy.
- **Deprecación de endpoint V1 via 410 Gone** (Opción C del enunciado
  original): descartada por D2. Si a futuro se decide, será bloque
  propio con plan separado.
- **Remoción de `xhtml2pdf` de requirements.txt**: imposible por
  dependencia de HR (§1.5). Fuera de scope.
- **Auditoría de `backend/hr_routes.py` frente a SSRF con xhtml2pdf**:
  HR usa templates internos controlados, no HTML de usuario final. Si
  surgiera preocupación, es bloque propio.
- **Refactor de `export_pdf` V1 para extraer lógica**: no se toca.
- **Cambios en `workspaces_export.py`**: cerrado en Bloque 2, no se
  toca.

---

## 9. Preguntas abiertas a Cristian

Estas preguntas requieren tu decisión explícita antes de que el
builder comience. Van numeradas para que puedas responder 1 de N.

**Q1 de 3**. ¿Apruebas el scope del bloque de tests (6 tests de
cableado V1, sin replicar los 15 de V2)?

- (a) Sí, 6 tests de cableado
- (b) No, quiero los 15 tests V2 replicados a nivel HTTP del endpoint
      V1 (más cobertura, más lentitud CI)
- (c) Otro — especificar

**Q2 de 3**. ¿Futuro del endpoint V1 `export_pdf`?

- (a) Mantener funcional parchado indefinidamente (Opción A elegida
      en D2)
- (b) Programar deprecación con `410 Gone` y fecha fija (Opción C) —
      esto requiere bloque propio después de este, no aquí
- (c) Otro — especificar

**Q3 de 3**. ¿Agregas `backend/collab_routes.py` a `FROZEN.md` sección
`export_pdf (L455-516)` como propone D3?

- (a) Sí, freeze quirúrgico de la función
- (b) No, confío en los tests
- (c) Sí pero freeze del archivo completo

---

## 10. Componente legal

**NO aplica como flujo reforzado.**

C1 es hardening de seguridad técnica. No modifica:

- Textos legales visibles al usuario
- Constantes legales (AFP, retracto, UF, UTM, etc.)
- Documentos de `docs/legal/`
- Campos de recolección de datos personales
- Flujos de cobro, reembolso o cancelación
- Políticas de retención o privacidad

Sí tiene **relación indirecta** con GDPR Art. 32 ("seguridad del
procesamiento") y con Ley 19.628 Art. 11 (deber de cuidado). El fix ya
aplicado en `192f1b6` satisface esos requisitos técnicos. Este bloque
solo formaliza el cierre con tests + docs; no requiere revisión de
abogado ni borradores de `legal-docs-keeper`.

**No invocar flujo-legal.** No requiere aprobación humana adicional
más allá del OK de Cristian en el cierre normal del bloque.

---

## 11. Reporte obligatorio (4 secciones CLAUDE.md)

Esta sección la completa el web-architect en su mensaje de cierre, no
vive en el plan. El plan en sí se cierra con las secciones §1-§10. El
reporte va en el mensaje de chat al presentar el plan a Cristian.

### Lo que se me pidió

(cita literal del briefing de Cristian se incluye en el mensaje de
cierre del web-architect)

### Lo que efectivamente hice

- Leí `backend/collab_routes.py:440-560` (endpoint parchado)
- Leí `backend/workspaces_export.py:1-80` (origen de fix)
- Leí `backend/tests/test_workspaces_export_security.py` completo
- Leí `docs/pendientes.md` completo
- Leí `BLOCKS.md` y `FROZEN.md` completos
- Grep de `xhtml2pdf` en backend → descubrí uso en `hr_routes.py`
- Verifiqué commit `192f1b6` en git log
- Creé `docs/plans/hardening-c1-ssrf/plan.md`

### Lo que no hice y por qué

- No escribí los tests nuevos — es responsabilidad del backend-builder
  en Capa 1
- No modifiqué `docs/pendientes.md`/`BLOCKS.md`/`FROZEN.md` — es
  ejecución de bloque, requiere OK del plan primero
- No ejecuté pytest — web-architect no ejecuta código de producto
- No resolví Q1/Q2/Q3 — requieren decisión de Cristian

### Incertidumbres

Declaración explícita de al menos un punto del plan que podría estar
mal aunque no tenga evidencia concreta:

- **Incertidumbre 1**: el test 3
  (`test_aws_metadata_eliminada_end_to_end`) asume que
  `inline_remote_images` elimina del HTML el `<img>` cuya URL apunta a
  169.254.x.x. Leí el docstring de `workspaces_export.py` que dice
  "elimina silenciosamente", pero no leí la implementación completa de
  `inline_remote_images`. Si en realidad la función **mantiene el
  tag** pero lo deja con `src=""` o con un placeholder, el test
  necesita aserciones distintas. Recomiendo que el backend-builder lea
  la implementación antes de escribir el test.

- **Incertidumbre 2**: asumo que el endpoint V1 `export_pdf` NO
  requiere Content-Type `application/json` ni body (es GET). Si hay
  middleware/dependency que requiera otra config, el test de happy path
  puede fallar con 400/422 y no con 200. Revisar en la implementación
  del test.

- **Incertidumbre 3**: `FROZEN.md` tiene varias secciones con filas
  separadas por líneas en blanco. No es claro si la columna "Seccion"
  acepta rangos de líneas como `export_pdf (L455-516)` o prefiere una
  abstracción semántica como `export_pdf completo`. Si el formato es
  estricto, Cristian puede ajustar el texto.
