# Plan — bloque-nomina-chile-v1

**Autor:** Tori (web-architect)
**Fecha:** 2026-04-21
**Rama sugerida:** `bloque-nomina-chile-v1`
**Estado:** DRAFT — pendiente aprobación Cristian + cierre Bloque 1
cookies (PR #21 merge)

---

## 1. Contexto

### 1.1 Cita de la petición

> Planificar bloque `nomina-chile-v1`. El 2026-04-26 (lunes, en 5 días)
> entra en vigor el segundo escalón de la Ley 21.561 (44h → 42h/semana
> en Chile). El backend actual de Conniku calcula overtime con base
> 180h mensuales (45h × 4). Si al 2026-04-26 no se actualiza, cada hora
> extra queda subremunerada en ~7.14% → riesgo Art. 32 + Art. 63bis
> Código del Trabajo + multa DT. El bloque debe cerrarse antes de esa
> fecha.

### 1.2 Urgencia legal

- **Fecha límite:** 2026-04-26 (lunes) entra en vigor segundo escalón
  Ley 21.561.
- **Fuente:** Comunicado oficial Ministerio del Trabajo, 2026-04-21.
  URL: https://www.mintrab.gob.cl/ley-40-horas-conoce-las-principales-medidas-que-comienzan-a-regir-el-26-de-abril/
- **Cambio legal:** jornada máxima ordinaria pasa de 44h a 42h
  semanales. Tercer escalón (40h) entra 2028-04-26.
- **Riesgo directo:** todo trabajador chileno con horas extras entre
  2026-04-26 y la fecha del fix cobraría hora extra calculada sobre
  180h mensuales cuando debería ser 168h (42 × 4). Subremuneración
  aproximada del 7.14% por cada hora extra.
- **Normas aplicables:**
  - Art. 32 Código del Trabajo — horas extraordinarias, recargo 50%.
  - Art. 63 bis Código del Trabajo — reajuste y reliquidación cuando
    corresponda. Fuente: https://www.bcn.cl/leychile/navegar?idNorma=207436
  - Ley 21.561 Art. 1° escalón 2. Fuente:
    https://www.bcn.cl/leychile/navegar?idNorma=1194020
  - Multa Dirección del Trabajo Art. 506 CT (de 1 a 60 UTM por
    trabajador afectado según tamaño empresa).

### 1.3 Dependencia de bloque previo (§18.5 — un bloque a la vez)

Este bloque **no inicia** hasta que Cristian cierre
`bloque-legal-consolidation-v2` (PR #21 merge + Capa 7 completa).
Razón: la política del proyecto impide dos bloques activos en paralelo
y Capa 7 de Bloque 1 agrega sus archivos a FROZEN.md; necesitamos que
ese FROZEN esté sellado antes de tocar constantes legales nuevas.

Si para la fecha 2026-04-23 (viernes) Bloque 1 no ha cerrado, se
escala a Cristian con dos opciones:
- A) acelerar cierre Bloque 1 antes de Pascua.
- B) declarar `bloque-nomina-chile-v1` como HOTFIX legal bajo §18.7
  excepción y ejecutar `flujo-hotfix` en paralelo con validación
  retroactiva posterior.

### 1.4 Impacto en Conniku SpA como empleador

Conniku SpA (RUT 78.395.702-7, fecha inicio actividades 2026-04-08) es
**micro empresa** con un único representante legal (Cristian Gutiérrez
Lazcano, RUT 14.112.896-5). A la fecha **no existe evidencia de
empleados dependientes** con contrato vigente. Verificación pendiente
con Cristian en decisiones batch §9.

Si no hay empleados, el riesgo es 100% sobre **usuarios finales que
usen el módulo HR de Conniku para gestionar su propia nómina** (uso
del producto por clientes, no cálculo interno). En ambos casos el fix
es obligatorio porque el módulo está expuesto en `src/admin/hr/*` y
`src/pages/HRDashboard.tsx`.

### 1.5 Hallazgos del cross-check del código (2026-04-21)

Archivos leídos:
- `backend/payroll_calculator.py` (922 líneas).
- `backend/hr_routes.py` (3674 líneas; payroll lógica en 370-540).
- `backend/constants/consumer.py` (patrón a replicar).
- `backend/constants/legal_versions.py` (patrón 4-líneas con cita).
- `backend/tests/test_legal_versions_v3_2_invariants.py` (patrón de
  tests con cita legal).
- `src/admin/shared/ChileLaborConstants.ts` (152 líneas).
- `src/admin/shared/accountingData.ts` (1119 líneas; PPM línea 989).
- `shared/legal_constants.ts` (108 líneas; patrón espejo py↔ts).
- `backend/constants/` y `backend/tests/` (confirmado: no existe
  `test_payroll_calculator.py` ni `test_hr_routes.py` que cubran
  cálculos de nómina).

**Hallazgo crítico — DUPLICACIÓN DE MOTOR DE PAYROLL:**

Existen **DOS motores de payroll** en el backend, cada uno con sus
propias constantes:

1. `backend/payroll_calculator.py` (módulo "limpio", librería):
   - `UF_VALUE = 38_000.0`
   - `UTM_VALUE = 66_000.0`
   - `SUELDO_MINIMO = 500_000`
   - `MONTHLY_HOURS = 180.0`, `WEEKLY_HOURS = 45.0`
   - `TOPE_AFC_UF = 122.6`
   - `SIS_RATE = 0.0153`
   - AFP Provida commission 1.45%, AFP Uno commission 0.69%
   - Tax brackets: último tramo `(310.0, inf, 0.40, 38.82)`

2. `backend/hr_routes.py` (router FastAPI, en uso en producción):
   - `UF_VALUE_CLP = 38500.0`
   - `UTM_VALUE_CLP = 67000.0`
   - `MINIMUM_WAGE_CLP = 500000.0`
   - `TOPE_AFC_UF = 126.6` **(diverge de payroll_calculator 122.6)**
   - `FONASA_RATE = 0.07`
   - `AFP_RATES[*]["sis"] = 0.0141` **(diverge de SIS_RATE 0.0153)**
   - AFP Planvital employee 0.1116 **(diverge de 0.1041 en
     payroll_calculator)**
   - Cálculo hourly_rate usa `weekly_hours * 4.33` en vez de
     MONTHLY_HOURS; esto es otra fórmula (semanas promedio mes) que
     produce ~194.85h (45*4.33) hoy → tambien debe actualizarse.
   - Brackets de impuesto ya tienen tramo ~310 UTM correcto en
     backend, pero el frontend tiene tramo ~150 UTM desfasado.

**Confirma el riesgo:** el frontend
`src/admin/shared/ChileLaborConstants.ts` tiene tramo último
`{ from: 150, to: Infinity, rate: 0.4, deduction: 30.82 }` mientras el
backend correcto (según SII 2026) es ~310 UTM. **Desfase de impuesto
en frontend.**

**Hallazgo — TOPE AFC inconsistente:** el dato del cross-check legal
dice 122.6 UF, `payroll_calculator.py` dice 122.6, `hr_routes.py` dice
126.6, `ChileLaborConstants.ts` dice 122.6. Verificar con
spensiones.cl cuál es vigente antes de unificar. Pendiente §9.

### 1.6 Retención honorarios 15.25% vs 13.75%

Encontré 5 ubicaciones en frontend con retención hardcoded `0.1375`:
- `src/admin/tools/OwnerGuideTab.tsx:118`
- `src/admin/tools/TutoresExternosTab.tsx:597, 760`
- `src/admin/finance/GastosTab.tsx:754, 1157`
- `src/admin/shared/accountingData.ts:69` (comentario)
- `src/components/TermsOfService.tsx:1087`
- `src/pages/HRDashboard.tsx:7804, 8689, 8883`

Según cross-check legal 2026-04-21, la retención vigente 2026-01-01 es
**15.25%** (progresión Ley 21.133 transitoria). Fuente:
https://www.sii.cl/noticias/2025/261225noti01smn.htm — pendiente
confirmación link oficial del SII con valor **exacto** para 2026.

---

## 2. Decisiones arquitectónicas

### D-N1 — Estructura de constantes legales chilenas

**Pregunta:** ¿Cómo estructurar `labor_chile.py` y `tax_chile.py`?

- **Alternativa A:** un archivo por dominio
  (`backend/constants/labor_chile.py` para jornada, AFP, AFC, SIS,
  salud, gratificación, indemnizaciones, topes;
  `backend/constants/tax_chile.py` para IVA, impuesto 2ª categoría,
  retención honorarios, UTA). Cada constante con bloque 4-líneas
  (cita, URL, fecha, verificador) siguiendo el patrón de
  `consumer.py` y `legal_versions.py`.
- **Alternativa B:** variables de entorno con default hardcoded en
  `.env.example` + `os.getenv` en código. Permite hot-update en
  Render sin deploy.
- **Alternativa C:** un único archivo `backend/constants/chile.py`
  con todo junto.

**Recomendación: A.** Razón: coincide con patrón existente
(`consumer.py`, `legal_versions.py`), permite tests por dominio, el
legal-docs-keeper ya sabe auditar ese layout. Alternativa B tiene
riesgo alto de no-evidencia (no hay cita legal en .env) y de olvidar
variables en Render. Alternativa C mezcla laboral con tributario que
son auditados por abogados distintos.

### D-N2 — Sincronización backend ↔ frontend

**Pregunta:** ¿cómo mantiene frontend los mismos valores que backend?

- **Alternativa A:** frontend consume desde endpoint
  `/constants/chile` (single source of truth, backend dinámico).
- **Alternativa B:** espejo `shared/chile_labor.ts` byte-a-byte del
  `.py` + test CI que compara valores clave entre ambos.
- **Alternativa C:** frontend hardcoded con test de diff que alerta
  (solo CI-lint).

**Recomendación: B.** Razón: el patrón `shared/legal_constants.ts` ya
está operativo (ver script `scripts/verify-legal-constants-sync.sh`
referido en el comentario de `shared/legal_constants.ts:13-18`). A
sería más limpio pero requiere endpoint nuevo, cache, fallback
offline, tests de integración — bloque aparte. C deja el riesgo de
que el frontend quede desfasado en commits parciales. B es reversible
y alineado con lo existente.

### D-N3 — Overtime base con fecha de corte

**Pregunta:** ¿cómo manejar el cambio 180h → 168h sin romper cálculos
previos al 2026-04-26?

- **Alternativa A:** función `get_monthly_hours(date)` que devuelve
  180 antes del 2026-04-26 y 168 desde esa fecha. Permite reliquidar
  períodos anteriores correctamente.
- **Alternativa B:** constante hardcoded `MONTHLY_HOURS = 168`
  actualizada directamente. Pierde historia si alguien consulta
  liquidación antigua.
- **Alternativa C:** la constante se actualiza pero se guarda
  `monthly_hours_at_calculation` en cada registro payroll (histórico
  en DB).

**Recomendación: A + C combinadas.** Implementar función con fecha de
corte Y persistir el valor efectivo al momento del cálculo. A sola
cubre cálculos nuevos; C sola no ayuda a recalcular retroactivamente.
La combinación es la que defiende legalmente cualquier liquidación
disputada (Art. 63 bis CT permite reliquidar).

Constante: `LEY_21561_ESCALON_2_VIGENCIA = date(2026, 4, 26)`. Fuente
Mintrab.

Además agregar constante `LEY_21561_ESCALON_3_VIGENCIA = date(2028, 4,
26)` para el cambio 42h → 40h, con función que ya lo contempla
(return 160 a partir de esa fecha). Esto blinda los siguientes 2
años.

### D-N4 — AFP Uno como default para novatos

**Pregunta:** ¿agregar constante `AFP_DEFAULT_NEW_WORKERS = UNO`?

- **Alternativa A:** agregar constante con cita DS Superintendencia
  de Pensiones.
- **Alternativa B:** no agregar, dejar default HABITAT como está en
  `EmployeeData.afp: AFPName = AFPName.HABITAT`.

**Recomendación: A.** Razón: desde 2023-10-01 el DS 77 de la
Superintendencia de Pensiones establece que los nuevos afiliados (los
que entran al sistema por primera vez) ingresan a la AFP con menor
comisión por licitación, que desde ese período es AFP UNO.
[VERIFICAR] citación exacta del DS con bcn.cl/leychile antes de
commit. Fuente preliminar:
https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html
— pendiente confirmación DS exacto §9.

Cambiar el default de `HABITAT` a `UNO` es **breaking change** para
cualquier código que dependa del default actual; dejar como
constante separada y no cambiar el `EmployeeData.afp` default en este
bloque (ver §7 Fuera de scope).

### D-N5 — Tabla impuesto 2ª categoría: código vs DB

**Pregunta:** ¿tramos progresivos hardcoded o en tabla DB editable?

- **Alternativa A:** hardcoded en `tax_chile.py` con constante
  `TAX_BRACKETS_VIGENCIA = date(2026, 1, 1)` y comentario con link a
  circular SII del mes. Se actualiza con commit dedicado cada vez que
  SII publica reajuste.
- **Alternativa B:** tabla en DB (`chile_tax_brackets`) con campos
  vigencia_desde/vigencia_hasta, editable desde UI admin.

**Recomendación: A.** Razón: los tramos cambian ~1-2 veces por año
(no 5 como dije primero, corrijo: reajuste anual según IPC + ajustes
legislativos esporádicos). Ponerlo en DB agrega complejidad
(migración, validaciones, UI) sin beneficio claro para un cambio tan
infrecuente. El commit dedicado con tipo `legal:` es más auditable
que un registro en DB. Cita SII:
https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm

### D-N6 — Unificación de motores de payroll duplicados

**Pregunta:** ¿qué hacer con la duplicación entre
`payroll_calculator.py` y el cálculo en `hr_routes.py:458-540`?

- **Alternativa A:** refactor en este bloque: `hr_routes.py` importa
  y delega a `payroll_calculator.calculate_liquidacion`. Elimina la
  duplicación de constantes y divergencias.
- **Alternativa B:** refactor en bloque separado posterior
  (`bloque-nomina-unificacion-v1`). Este bloque solo sincroniza las
  constantes duplicadas a los mismos valores correctos en AMBOS
  lugares.

**Recomendación: B.** Razón principal: el bloque actual tiene
deadline duro 2026-04-26 (5 días). Refactorizar el motor dual agrega
riesgo de regresión en endpoints que hoy usan `hr_routes.py`
(PreviredTab, LibroRemuneracionesTab, etc.). Aplicar **principio de
cambio mínimo con alto riesgo**: sincronizar valores en AMBOS
archivos, escribir tests que fijen ambos al mismo resultado,
refactorizar la duplicación en un bloque posterior con más tiempo.
Anotar la deuda en `registry_issues.md` con ID `payroll-dual-engine`.

### D-N7 — Retención honorarios: constante única, múltiples consumidores

**Pregunta:** ¿cómo gestionar la actualización 13.75% → 15.25% en 5+
ubicaciones frontend?

- **Alternativa A:** constante `HONORARIOS_RETENTION_RATE_2026` en
  `tax_chile.py` (backend) y espejo en
  `shared/chile_tax.ts` (nueva). Cada uso en frontend se reescribe
  para importar la constante en vez de hardcodear `0.1375`.
- **Alternativa B:** tabla progresiva histórica
  `HONORARIOS_RETENTION_HISTORY: dict[int, float]` con mapeo año →
  rate. Útil cuando se paga boleta de años anteriores (reconsiderar
  retención según año del servicio, no año del pago).

**Recomendación: A para el deadline, B como sub-tarea dentro del
bloque si hay tiempo.** La regla legal (Ley 21.133 Art.
Transitorio) dice que la retención aplicable es la del año del pago,
no del servicio, en régimen general. [VERIFICAR] con SII antes de
decidir definitivo. Fuente:
https://www.sii.cl/noticias/2025/261225noti01smn.htm

### D-N8 — Validación "no inventar" para valores UF/UTM mensuales

**Pregunta:** ¿UF y UTM se actualizan mensualmente — los hardcodeamos
o los consumimos desde API?

- **Alternativa A:** hardcoded con fecha de vigencia
  `UF_VIGENCIA = date(2026, 4, 1)`. Actualización por commit mensual
  dedicado `legal(tax): actualizar UF/UTM abril 2026`. El
  legal-docs-keeper lo detecta en auditoría semanal.
- **Alternativa B:** consumo en runtime desde
  `https://mindicador.cl/api` (endpoint ya usado en
  `chile_tax_routes.py:78`). Fallback a última conocida.
- **Alternativa C:** híbrido: hardcoded como fallback + endpoint
  backend `/api/constants/uf` que actualiza cache diario.

**Recomendación: A para este bloque, B/C posterior.** Razón: el ruido
de una API caída durante cálculo de liquidaciones es inaceptable
(liquidación tiene que ser determinista y reproducible). El hardcoded
con vigencia explícita es auditable, testeable y no falla por red. El
costo marginal de un commit mensual es bajo (15 min,
legal-docs-keeper detecta automáticamente). Para este bloque
hardcoded los valores abril 2026 verificados hoy. Documentar en el
plan que el commit mensual queda como tarea recurrente del
legal-docs-keeper.

### D-N9 — `ChileLaborConstants.ts` frontend: migrar o mantener

**Pregunta:** el archivo actual tiene lógica (getters `afpCLP`,
`afcCLP`, `saludCLP`, `partialRate`, `topeMensual`, función
`validateSalary`, función `calculateTax`). Si movemos valores al
espejo nuevo `shared/chile_labor.ts`, ¿qué hacemos con los getters?

- **Alternativa A:** `shared/chile_labor.ts` tiene SOLO valores
  (espejo puro del `.py`). `ChileLaborConstants.ts` se mantiene como
  wrapper con getters pero importa todos los valores desde
  `shared/chile_labor.ts`. Diff mínimo, archivo sigue funcionando
  para los ~30 consumidores actuales.
- **Alternativa B:** eliminar `ChileLaborConstants.ts`, migrar todo a
  `shared/chile_labor.ts` con namespaces. Requiere tocar ~30
  archivos que lo importan.

**Recomendación: A.** Cambio mínimo, deadline crítico.

---

## 3. Archivos a tocar

### 3.1 Nuevos

| Ruta absoluta | Justificación |
|---|---|
| `/Users/cristiang./CONNIKU/backend/constants/labor_chile.py` | Constantes laborales chilenas con cita 4-líneas. Centraliza jornada, AFP, AFC, SIS, salud, gratificación, indemnización, topes UF, feriado. |
| `/Users/cristiang./CONNIKU/backend/constants/tax_chile.py` | Constantes tributarias: IVA, impuesto 2ª cat brackets, retención honorarios (con vigencia año), UTA. |
| `/Users/cristiang./CONNIKU/shared/chile_labor.ts` | Espejo byte-por-byte de `labor_chile.py` para consumo frontend. Patrón análogo a `shared/legal_constants.ts`. |
| `/Users/cristiang./CONNIKU/shared/chile_tax.ts` | Espejo byte-por-byte de `tax_chile.py`. |
| `/Users/cristiang./CONNIKU/backend/tests/test_labor_constants_chile.py` | Tests de invariante: cada constante tiene valor esperado, vigencia correcta, función `monthly_hours_at(date)` devuelve 180 antes de 2026-04-26 y 168 desde esa fecha, etc. |
| `/Users/cristiang./CONNIKU/backend/tests/test_tax_constants_chile.py` | Tests de invariante: tramos vigentes 2026, rate retención honorarios por año, IVA 19%. |
| `/Users/cristiang./CONNIKU/backend/tests/test_payroll_calculator_42h.py` | Test end-to-end del motor `payroll_calculator.py`: misma entrada, base 180h da X, base 168h da Y, delta coincide con ~7.14%. |
| `/Users/cristiang./CONNIKU/backend/tests/test_hr_routes_payroll_parity.py` | Test de paridad: `calculate_payroll_for_employee` en `hr_routes.py` vs `calculate_liquidacion` en `payroll_calculator.py` producen el mismo `total_imponible`, `afp`, `salud`, `afc`, `impuesto`, `net_salary` para inputs idénticos (D-N6 B: sincronizar hasta refactor). |
| `/Users/cristiang./CONNIKU/scripts/verify-chile-constants-sync.sh` | Script CI que compara valores clave entre `.py` y `.ts`. Patrón análogo a `verify-legal-constants-sync.sh` existente. |

### 3.2 Modificados

| Ruta absoluta | Cambio |
|---|---|
| `/Users/cristiang./CONNIKU/backend/payroll_calculator.py` | Reemplazar constantes locales (UF_VALUE, UTM_VALUE, SUELDO_MINIMO, MONTHLY_HOURS, WEEKLY_HOURS, AFP_RATES, AFC_RATES, FONASA_RATE, SIS_RATE, MUTUAL_BASE_RATE, TOPE_*_UF, TAX_BRACKETS) por imports desde `backend.constants.labor_chile` y `backend.constants.tax_chile`. Reemplazar `MONTHLY_HOURS` estático por `get_monthly_hours(period_date)`. Actualizar `calculate_overtime` para aceptar `period_date`. |
| `/Users/cristiang./CONNIKU/backend/hr_routes.py` | Reemplazar constantes locales (líneas 375-425) por imports desde `backend.constants.labor_chile` y `tax_chile`. Ajustar `calculate_payroll_for_employee` para usar `get_monthly_hours(period_date)` en lugar de `emp.weekly_hours * 4.33`. Resolver TOPE_AFC_UF (126.6 vs 122.6) con valor oficial verificado. |
| `/Users/cristiang./CONNIKU/src/admin/shared/ChileLaborConstants.ts` | Reemplazar valores hardcoded (IMM 500k, UF 38700, UTM 67294, SIS 0.0141, tramo 150 UTM) por imports desde `shared/chile_labor.ts` y `shared/chile_tax.ts`. Mantener getters y funciones. |
| `/Users/cristiang./CONNIKU/src/admin/tools/OwnerGuideTab.tsx` (línea 118) | Reemplazar `"13.75% (2025)"` por import de `HONORARIOS_RETENTION_RATE` + `HONORARIOS_RETENTION_YEAR` desde `shared/chile_tax.ts`. |
| `/Users/cristiang./CONNIKU/src/admin/tools/TutoresExternosTab.tsx` (líneas 597, 760) | Idem. |
| `/Users/cristiang./CONNIKU/src/admin/finance/GastosTab.tsx` (líneas 754, 1157) | Reemplazar `0.1375` literal por `HONORARIOS_RETENTION_RATE`. |
| `/Users/cristiang./CONNIKU/src/components/TermsOfService.tsx` (línea 1087) | Reemplazar literal por variable + cita legal visible según §CLAUDE.md "Visibilidad legal en la interfaz". |
| `/Users/cristiang./CONNIKU/src/pages/HRDashboard.tsx` (líneas 7804, 8689, 8883) | Idem. |
| `/Users/cristiang./CONNIKU/src/admin/shared/accountingData.ts` (línea 69 comentario + líneas 989, 1047 PPM) | Actualizar comentario a `15.25%`. [VERIFICAR] PPM ProPyme 0.25% con SII 2026; si cambió, actualizar constante. |
| `/Users/cristiang./CONNIKU/backend/constants/__init__.py` | Agregar exports de nuevos módulos si existe patrón. |
| `/Users/cristiang./CONNIKU/docs/legal/v3.2/labor-constants.md` (opcional, decisión legal-docs-keeper) | Documento con tabla resumen de constantes, fechas de vigencia, enlaces oficiales, para auditoría humana de Cristian. |
| `/Users/cristiang./CONNIKU/registry_issues.md` | Registrar issue `payroll-dual-engine` con patrón, origen del bloque, plan de refactor posterior. |
| `/Users/cristiang./CONNIKU/BLOCKS.md` | Al cerrar Capa 7: agregar entrada bloque. |
| `/Users/cristiang./CONNIKU/FROZEN.md` | Al cerrar Capa 7: agregar `backend/constants/labor_chile.py`, `tax_chile.py`, `shared/chile_labor.ts`, `shared/chile_tax.ts`. |

### 3.3 NO tocar

- `backend/constants/consumer.py` — otro dominio (retracto).
- `backend/constants/legal_versions.py` — documentos legales, no
  valores laborales/tributarios.
- Migraciones Alembic de DB — este bloque no altera schema.
- Cualquier archivo de autenticación, routing, UI layout.

---

## 4. Orden de implementación

Se sigue TDD RED-GREEN-REFACTOR salvo donde se declare excepción
(constantes puras). Cada paso termina con validación antes del
siguiente.

### Paso 0 — Capa 0 Legal (pre-builder, OBLIGATORIA)

1. Invocar legal-docs-keeper sobre todas las constantes del cross-check.
2. legal-docs-keeper genera borrador `docs/legal/drafts/nomina-chile-v1-review.md` con:
   - Tabla de cada constante + cita + URL + valor propuesto + fecha de vigencia
   - Flags a humana para constantes donde hay duda (TOPE_AFC 122.6 vs 126.6, retención honorarios 15.25% vigencia exacta, AFP UNO default DS exacto).
3. Cristian revisa el borrador **antes** de que builder inicie.
4. Aprobación explícita de Cristian registrada en `docs/reports/2026-04-XX-legal-docs-keeper-nomina-chile-v1.md`.
5. **Gate §18.7:** si Cristian no aprueba, bloque no avanza.

### Paso 1 — RED: tests de `labor_chile.py`

Crear `backend/tests/test_labor_constants_chile.py` con:
- `test_weekly_hours_before_2026_04_26_is_45()` — función
  `get_weekly_hours(date(2026, 4, 25))` → 45.
- `test_weekly_hours_on_2026_04_26_is_42()` — → 42.
- `test_weekly_hours_before_2028_04_26_is_42()` — → 42.
- `test_weekly_hours_on_2028_04_26_is_40()` — → 40.
- `test_monthly_hours_matches_4_weeks()` — 180 → 168 → 160.
- `test_uf_value_april_2026()` — UF_VALUE == 39841.72.
- `test_utm_value_april_2026()` — UTM_VALUE == 69889.
- `test_suelodo_minimo_2026()` — SUELDO_MINIMO == 539_000.
- `test_sis_rate_2026_04()` — SIS_RATE == 0.0154.
- `test_afp_uno_commission_2023_10_onwards()` — commission == 0.0046.
- `test_tope_afc_uf()` — TOPE_AFC_UF == 122.6 (según resolución §9).
- `test_each_constant_has_four_line_citation()` — parsea el archivo y
  verifica que cada `*_VALUE` tiene docstring con cita + URL + fecha
  + verificador (patrón del test en `test_legal_versions_v3_2_invariants.py`).

Ejecutar: `python3.11 -m pytest backend/tests/test_labor_constants_chile.py -v` → **debe fallar todo** (archivo no existe). Si no falla por esa razón, detener.

### Paso 2 — GREEN: crear `labor_chile.py`

Implementar el mínimo para que los tests del Paso 1 pasen:
- Constantes con bloque 4-líneas.
- Función `get_weekly_hours(period_date: date) -> int`.
- Función `get_monthly_hours(period_date: date) -> int`.
- Fechas de corte Ley 21.561.

Ejecutar: `python3.11 -m pytest backend/tests/test_labor_constants_chile.py -v` → **verde**. Si no, ajustar.

### Paso 3 — RED: tests de `tax_chile.py`

Crear `backend/tests/test_tax_constants_chile.py` con:
- `test_iva_rate_19_percent()`.
- `test_tax_bracket_last_is_310_utm()` — último tramo inicia en 310 UTM.
- `test_honorarios_retention_rate_2026()` — `get_retention_rate(2026)` == 0.1525.
- `test_honorarios_retention_rate_2025()` — == 0.1375.
- `test_ppm_propyme_rate()` — PPM_PROPYME_RATE == 0.0025 (pendiente verificar).
- `test_each_constant_has_four_line_citation()`.

Ejecutar → debe fallar.

### Paso 4 — GREEN: crear `tax_chile.py`

Implementar mínimo. Ejecutar → verde.

### Paso 5 — RED: tests de sync py↔ts

Crear `backend/tests/test_chile_constants_ts_mirror.py`:
- Parsea `shared/chile_labor.ts` y `shared/chile_tax.ts`.
- Compara valores numéricos clave con `labor_chile.py` y `tax_chile.py`.
- Falla si divergen.

Ejecutar → debe fallar (archivos TS no existen).

### Paso 6 — GREEN: crear espejos TS

Crear `shared/chile_labor.ts` y `shared/chile_tax.ts` con los mismos
valores. Comentario al inicio: "espejo de
`backend/constants/labor_chile.py`. Si cambia, ejecutar
`scripts/verify-chile-constants-sync.sh`". Crear el script.

Ejecutar test sync → verde.

### Paso 7 — RED: test de cambio de overtime por fecha

Crear `backend/tests/test_payroll_calculator_42h.py`:
- `test_overtime_before_2026_04_26_uses_180h_base()` — misma entrada,
  `period_date = date(2026, 4, 25)`, overtime_hours=10 → valor X.
- `test_overtime_on_2026_04_26_uses_168h_base()` — mismos inputs pero
  `period_date = date(2026, 4, 26)` → valor Y.
- `assert abs(Y - X * 180/168) < 1` (tolerancia de redondeo).

Ejecutar → debe fallar (función actual no acepta period_date).

### Paso 8 — GREEN: actualizar `payroll_calculator.py`

Refactor:
- Reemplazar constantes locales por imports desde
  `backend.constants.labor_chile` y `tax_chile`.
- Modificar `calculate_overtime(sueldo_base, overtime_hours, period_date=None)` → usa `get_monthly_hours(period_date or date.today())`.
- Modificar `calculate_liquidacion(employee, periodo)` para parsear
  `periodo` como fecha (si "2026-04" → `date(2026, 4, 15)` por ej) y
  pasar al overtime.

Ejecutar: `python3.11 -m pytest backend/tests/test_payroll_calculator_42h.py backend/tests/test_labor_constants_chile.py -v` → verde.

### Paso 9 — RED: test paridad hr_routes.py vs payroll_calculator.py

Crear `backend/tests/test_hr_routes_payroll_parity.py`:
- Para el mismo empleado (gross=1_200_000, AFP HABITAT, Fonasa,
  indefinido, overtime 10h, period 2026-04-26) los dos motores
  devuelven mismos totales (con tolerancia ±1 CLP por redondeos).

Ejecutar → debe fallar (divergencias actuales).

### Paso 10 — GREEN: sincronizar `hr_routes.py`

- Reemplazar constantes locales en `hr_routes.py:375-425` por imports.
- Ajustar `calculate_payroll_for_employee`:
  - `hourly_rate = gross / get_monthly_hours(period_date)` (reemplaza
    `emp.weekly_hours * 4.33`).
  - Aceptar `period_date` como argumento con default
    `date.today().replace(day=1)` (primer día del mes corriente).
- Resolver `TOPE_AFC_UF` al valor oficial verificado.

Ejecutar paridad → verde.

### Paso 11 — RED + GREEN: frontend

1. Actualizar `src/admin/shared/ChileLaborConstants.ts` para importar
   valores desde `shared/chile_labor.ts` y `shared/chile_tax.ts`.
2. Escribir test Vitest
   `src/admin/shared/ChileLaborConstants.test.ts`:
   - `validateSalary(500000, 45)` devuelve invalid si IMM es 539k.
   - `calculateTax(30_000_000)` cae en el último tramo de 310 UTM (no
     150).
3. Ejecutar `npx vitest run src/admin/shared` → verde.
4. Reemplazar hardcodes en los 7 archivos frontend listados en §3.2.
5. Ejecutar `npx vitest run` completo → verde.
6. Ejecutar `npx tsc --noEmit` → verde.

### Paso 12 — REFACTOR

- Revisar DRY: si alguna constante aparece en 2 sitios, extraer.
- Ejecutar lint/format: `npx prettier --write src/` (§24),
  `ruff format backend/constants/ backend/tests/`.

### Paso 13 — Pre-flight local (§23)

Desde la raíz, ejecutar en orden (§23.1):

```
npx tsc --noEmit
npx eslint src/
npx vitest run
npx vite build
python3.11 -m pytest backend/ --tb=no -q
python3.11 -m ruff check backend/
```

Todos exit 0. Si alguno falla → fix + repetir.

### Paso 14 — Capas 2-5

Capa 2 — code-reviewer audita diff ciego.
Capa 3 — truth-auditor re-ejecuta comandos.
Capa 4 — push a `bloque-nomina-chile-v1`, abrir PR, preview Vercel.
Capa 5 — gap-finder.

### Paso 15 — Capa 6 inspección humana

Cristian inspecciona en preview:
- Mensualización de un empleado con overtime en período 2026-04.
- Cambio a período 2026-05 → overtime sube ~7.14%.
- Retención honorarios en GastosTab muestra 15.25% con cita.
- Legal visible (cita junto a constante) en todas las UIs afectadas.

Iteraciones hasta OK final.

### Paso 16 — Capa 7 cierre

- Merge a main.
- Deploy prod (auto Vercel + Render).
- BLOCKS.md entrada.
- FROZEN.md nuevos archivos.
- Snapshot sesión en `docs/sessions/`.
- `registry_issues.md` id `payroll-dual-engine` actualizado con
  estado "abierto, pendiente bloque-nomina-unificacion-v1".

---

## 5. Criterio de terminado

Condiciones binarias verificables. Todas deben estar en verde antes
de cerrar Capa 7:

- [ ] `backend/constants/labor_chile.py` existe y cada constante tiene bloque de 4 líneas (cita de ley + URL oficial + fecha + verificador).
- [ ] `backend/constants/tax_chile.py` existe y cumple mismo estándar.
- [ ] `shared/chile_labor.ts` existe con los mismos valores numéricos.
- [ ] `shared/chile_tax.ts` existe con los mismos valores numéricos.
- [ ] `get_weekly_hours(date(2026, 4, 25))` retorna 45.
- [ ] `get_weekly_hours(date(2026, 4, 26))` retorna 42.
- [ ] `get_monthly_hours(date(2026, 4, 26))` retorna 168.
- [ ] `python3.11 -m pytest backend/tests/test_labor_constants_chile.py` exit 0.
- [ ] `python3.11 -m pytest backend/tests/test_tax_constants_chile.py` exit 0.
- [ ] `python3.11 -m pytest backend/tests/test_payroll_calculator_42h.py` exit 0.
- [ ] `python3.11 -m pytest backend/tests/test_hr_routes_payroll_parity.py` exit 0.
- [ ] `python3.11 -m pytest backend/tests/test_chile_constants_ts_mirror.py` exit 0.
- [ ] `python3.11 -m pytest backend/` completo exit 0.
- [ ] `npx vitest run` exit 0.
- [ ] `npx tsc --noEmit` exit 0.
- [ ] `npx eslint src/` exit 0.
- [ ] `npx vite build` exit 0.
- [ ] `python3.11 -m ruff check backend/` exit 0.
- [ ] `scripts/verify-chile-constants-sync.sh` exit 0.
- [ ] Ningún archivo frontend tiene literales `0.1375`, `0.1141`, `38700`, `67294`, `500000`, `45.*hours`, `180` con contexto laboral.
- [ ] `ChileLaborConstants.ts` no contiene magic numbers; todo deriva de imports.
- [ ] UF mostrada en UI muestra cita "Art. X / URL Y" adyacente (§CLAUDE.md "Visibilidad legal").
- [ ] Retención honorarios en cada UI afectada muestra año de vigencia y cita.
- [ ] Capa 0 legal-docs-keeper completada y reporte en `docs/reports/`.
- [ ] Aprobación humana explícita de Cristian antes de merge (§18.7) registrada en docs/reports.
- [ ] `registry_issues.md` contiene id `payroll-dual-engine`.
- [ ] BLOCKS.md tiene entrada con tipo `legal-critical`.
- [ ] FROZEN.md incluye los 4 archivos nuevos.
- [ ] PR #XX mergeado antes de 2026-04-26 00:00 CLT.

---

## 6. Riesgos

### Alto

- **R-1 — Deadline duro 2026-04-26:** si el bloque no cierra antes,
  cada liquidación de overtime desde esa fecha queda subremunerada.
  Mitigación: priorizar ruta crítica (jornada 42h), dejar D-N7
  retención honorarios como sub-task secundaria si aprieta.
  Escalamiento: si el 2026-04-23 no está listo, escalar a Cristian
  con opción `flujo-hotfix`.
- **R-2 — Empleados reales de Conniku SpA afectados:** si Cristian
  ya tiene trabajadores dependientes, un bug en el cálculo durante
  el despliegue genera responsabilidad laboral directa.
  Mitigación: verificar con Cristian §9 D-A (¿hay empleados?). Si sí,
  prever plan de reliquidación Art. 63 bis CT para período
  eventualmente afectado.
- **R-3 — Error en la función `get_monthly_hours(date)` genera bug
  silencioso:** devolver 180 cuando debería 168 o viceversa no
  levanta excepción pero produce cálculo legalmente incorrecto.
  Mitigación: test específico con asserts exactos para cada fecha de
  corte + test de property-based (fechas aleatorias antes/después)
  con hypothesis si hay tiempo.

### Medio

- **R-4 — SIS varía mensualmente por AFP:** el valor 1.54% vigente
  abril 2026 puede cambiar en mayo. Mitigación: constante con
  `SIS_RATE_VIGENCIA = date(2026, 4, 1)`; legal-docs-keeper audita
  mensualmente y alerta.
- **R-5 — Tramos de impuesto se reajustan por UTM anualmente:**
  Mitigación: constante con `TAX_BRACKETS_VIGENCIA`, procedimiento
  documentado en `labor_chile.py` header: "cada enero verificar
  circular SII y bumpar UTM_VALUE + eventualmente TAX_BRACKETS".
- **R-6 — Divergencia actual TOPE_AFC 122.6 vs 126.6:** ya hay bug
  latente antes de este bloque. Mitigación: verificar con
  spensiones.cl valor vigente 2026 y documentarlo en commit.
- **R-7 — Frontend desplegado en Vercel antes de backend en Render:**
  si frontend actualiza retención a 15.25% pero backend aún calcula
  13.75%, se muestra valor inconsistente al usuario.
  Mitigación: deploy backend PRIMERO; coordinar con preview URL para
  verificar sync antes de prod.

### Bajo

- **R-8 — `hr_routes.py` tiene otras dependencias no identificadas
  en este cross-check:** Mitigación: pre-flight local completo (§23).
- **R-9 — Pre-commit Prettier hook puede abortar commits frontend:**
  Mitigación: seguir §24 — ejecutar `npx prettier --write` antes de
  `git add`.
- **R-10 — Tests skipif en local pero correrán en CI (§23.3):**
  Mitigación: declarar explícitamente si hay; fijarse en reportes
  previos de la rama.

---

## 7. Fuera de scope

Cosas que NO se hacen en este bloque y por qué:

- **Refactor del motor dual (`hr_routes.py` vs
  `payroll_calculator.py`)** — deferido a `bloque-nomina-unificacion-v1`.
  Razón: deadline crítico, alto riesgo de regresión.
- **Bonos especiales, asignación familiar, cargas** — requiere
  bloque separado con análisis del cálculo de cargas familiares según
  tramos de ingreso.
- **Liquidación completa automática PDF firmada electrónicamente** —
  bloque separado `bloque-liquidacion-pdf-firmada`.
- **Integración DT (rehabilitación previsional, Libro Electrónico de
  Remuneraciones, F29, F50)** — bloque separado.
- **Feature flag de jornada progresiva por trabajador (algunos
  contratos pueden mantener 45h por acuerdo según Art. 22 CT)** —
  complejidad superior; este bloque implementa la regla general (42h
  para contrato estándar).
- **Cambio del default `EmployeeData.afp = HABITAT` a UNO** —
  breaking change; se agrega constante pero no se cambia default.
- **Migración de UF/UTM a API en tiempo real** — deferido; D-N8 A
  para este bloque.
- **PPM ProPyme valor real 2026** si difiere de 0.25% — verificar
  pero no cambiar si requiere refactor amplio.
- **Pensión de alimentos** (constante ya existe en
  `ChileLaborConstants.ts`) — no tocar en este bloque.
- **`chile_tax_routes.py`** — es el multi-currency, no payroll
  propiamente. No tocar.

---

## 8. Componente legal

### 8.1 Activación de Capa 0 (OBLIGATORIA)

Este bloque **es legal puro por diseño** (§CLAUDE.md "Cumplimiento
legal del producto"). Triggers matcheados:

- Tarea menciona AFP, ISAPRE, impuesto, IVA, retracto (no),
  reembolso (no), **nómina sí, despido → indemnización sí**.
- Archivos matcheados:
  - `backend/hr_*`
  - `backend/constants/labor_*` (nuevos)
  - `backend/constants/tax_*` (nuevos)
  - `src/admin/hr/*` (indirecto vía ChileLaborConstants)
  - `src/pages/HRDashboard.tsx`

**Capa 0 legal-docs-keeper ANTES del builder** es obligatoria. Ver
Paso 0 del orden de implementación (§4).

### 8.2 Normas aplicables citadas

| Norma | Dato que fija | URL verificable |
|---|---|---|
| Ley 21.561 Art. 1° escalón 2 | Jornada 42h desde 2026-04-26 | https://www.bcn.cl/leychile/navegar?idNorma=1194020 |
| Ley 21.561 Art. 1° escalón 3 | Jornada 40h desde 2028-04-26 | idem |
| Art. 32 Código del Trabajo | Recargo 50% horas extras | https://www.bcn.cl/leychile/navegar?idNorma=207436 |
| Art. 63 bis Código del Trabajo | Reliquidación por error de cálculo | idem |
| Art. 506 Código del Trabajo | Multa DT | idem |
| Ley 21.751 | SMI $539.000 desde 2026-01-01 | https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual/ |
| Art. 50 Código del Trabajo | Gratificación legal 25% tope 4.75 SMI | https://www.bcn.cl/leychile/navegar?idNorma=207436 |
| DL 3500 Art. 17 | AFP 10% obligatoria | https://www.bcn.cl/leychile/navegar?idNorma=7147 |
| Ley 19.728 | AFC porcentajes | https://www.bcn.cl/leychile/navegar?idNorma=185700 |
| DL 824 Art. 42 bis y 43 | Impuesto 2ª categoría progresivo | https://www.bcn.cl/leychile/navegar?idNorma=6368 |
| Ley 21.133 Art. Transitorio | Retención honorarios progresiva hasta 17% en 2028 | https://www.bcn.cl/leychile/navegar?idNorma=1128094 |
| Circular SII 2026 brackets | Tabla impuesto 2ª cat vigencia 2026 | https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm |

### 8.3 Documentos legales a actualizar

legal-docs-keeper evalúa si requieren bump MINOR:
- `docs/legal/v3.2/terms.md` — si menciona horas de trabajo o
  jornada (buscar en body).
- `docs/legal/v3.2/privacy.md` — no aplica (no toca datos).

Si algún documento requiere bump, se gestiona en commit `legal:`
separado dentro del mismo PR con su propio hash en
`legal_versions.py`.

### 8.4 Aprobación humana explícita (§18.7)

Gate obligatorio antes de merge. Cristian debe:

1. Leer el borrador del legal-docs-keeper.
2. Validar cada constante contra la fuente oficial listada.
3. Aprobar explícitamente por escrito en el PR (no solo "LGTM";
   referencia cada decisión §9 con letra aceptada).
4. Solo entonces truth-auditor puede cerrar el bloque.

---

## 9. Decisiones pendientes batch (§21)

Preguntas para Cristian, respuesta con letras. Orden del 1 al 6.

**D-A:** ¿Conniku SpA tiene empleados dependientes vigentes al
2026-04-21 (evidencia: contrato firmado, RUT listado en PreviredTab)?
- A) Sí, hay trabajadores — activar plan de reliquidación Art. 63 bis
  si se detecta error previo.
- B) No, actualmente no hay empleados — el módulo solo sirve a
  clientes del producto, riesgo propio es cero.
- **Recomendación: B** (según evidencia actual no veo contratos en
  tabla Employees, pero no verifiqué DB). Impacto si es A: agregar
  sub-tarea de auditoría de liquidaciones previas.

**D-B:** Tope AFC — valor oficial vigente 2026:
- A) 122.6 UF (valor en `payroll_calculator.py` y
  `ChileLaborConstants.ts`).
- B) 126.6 UF (valor en `hr_routes.py`).
- C) Otro, verificar con spensiones.cl.
- **Recomendación: C** primero: [VERIFICAR] antes de hardcodear.
  Fuente oficial
  https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9911.html

**D-C:** Retención honorarios — rate vigente 2026:
- A) 15.25% (según Ley 21.133 Art. Transitorio secuencia progresiva
  2019→2028).
- B) 13.75% (valor actual del código, etiquetado "2025").
- C) Otro, confirmar con circular SII 2026 específica.
- **Recomendación: A**, con [VERIFICAR] link específico del SII 2026.
  Mientras, dejar el valor en constante con comentario
  `[PENDIENTE CONFIRMACIÓN SII 2026]` y bloquear commit hasta C
  resuelto.

**D-D:** Manejo del motor dual `hr_routes.py` vs
`payroll_calculator.py`:
- A) Sincronizar valores en AMBOS ahora, refactor a un solo motor en
  bloque posterior `bloque-nomina-unificacion-v1`.
- B) Refactor a un motor AHORA (riesgo regresión alto en deadline
  corto).
- C) Ignorar duplicación, solo tocar `payroll_calculator.py` (frontend
  lo usa vía endpoint que no existe; en realidad frontend usa datos
  que vienen de `hr_routes.py`, así que no tocar `hr_routes.py`
  dejaría el bug vivo).
- **Recomendación: A.**

**D-E:** AFP UNO como default legal novatos:
- A) Agregar constante `AFP_DEFAULT_NEW_WORKERS = UNO` + cita DS
  Superintendencia. NO cambiar `EmployeeData.afp` default.
- B) Agregar Y cambiar default `HABITAT → UNO` (breaking).
- C) No agregar, fuera de scope (valor se usa solo al alta de
  empleado en UI nueva, no en este bloque).
- **Recomendación: A.**

**D-F:** Fecha/hora de corte en `get_weekly_hours`:
- A) Día exacto: `date >= date(2026, 4, 26)` → 42.
- B) Período mensual: si el período incluye cualquier día desde
  2026-04-26, aplica 42 para todo el mes (más conservador al
  trabajador).
- C) Pro-rata: 25 días de abril a 45h, 5 días a 42h.
- **Recomendación: A** (es lo que la Ley 21.561 indica literalmente,
  Mintrab así lo comunica). Para abril 2026 el empleador elige la
  política laboral real; el cálculo refleja la regla de la fecha del
  servicio, no del pago.

---

## 10. Notas operativas

### 10.1 Rama y PR

- **Rama:** `bloque-nomina-chile-v1`.
- **Base:** `main` (después de que Bloque 1 cookies merge en main).
- **PR:** nuevo, no stub dentro de #21. Razón:
  `bloque-legal-consolidation-v2` está en review con otro alcance
  (cookies, re-aceptación), mezclarlos rompe §18.5 y confunde
  review. Un PR por bloque.

### 10.2 Tipo de commits

Todos los commits del bloque llevan tipo `legal:` (CLAUDE.md
Conventional Commits, §"Tipos válidos"). Ejemplos esperados:

- `legal(labor): crear labor_chile.py con constantes Ley 21.561 42h`
- `legal(tax): crear tax_chile.py con tramos impuesto 2ª cat 2026`
- `legal(labor): jornada 42h desde 2026-04-26 aplicada en payroll_calculator`
- `legal(labor): sincronizar hr_routes.py con labor_chile`
- `legal(tax): retención honorarios 15.25% vigencia 2026 en 7 archivos frontend`
- `legal(labor): agregar espejos TS shared/chile_labor y chile_tax`
- `test(legal): tests de invariantes constantes chilenas`

Cuerpo de cada commit: por qué (no qué) + cita legal breve + fuente
URL.

### 10.3 Orquestación del cierre

`/cerrar-bloque bloque-nomina-chile-v1` ejecuta las 7 capas. Variante
`flujo-legal` del menú se prefiere porque fuerza Capa 0 obligatoria.
Si el deadline aprieta y Bloque 1 no ha mergeado, escalar a Cristian
para decidir `flujo-hotfix` (Capas 4-6 omitidas con validación
retroactiva posterior).

### 10.4 Variables de entorno

Ningún cambio. Todas las constantes son de código, no variables de
entorno. Render y Vercel no requieren intervención.

### 10.5 Deploy

- Backend (Render) PRIMERO. Validar `/health` responde.
- Frontend (Vercel) después del backend. Esto evita
  inconsistencia temporal entre UI (15.25%) y API (13.75%) durante
  la ventana de deploy.
- Preview URL de Vercel debe probarse en Capa 6 con el backend ya en
  prod (Render no tiene preview separada por rama).

### 10.6 Post-merge

- Verificar en prod que la primera liquidación calculada en mayo
  2026 use 168h. Test manual con un usuario tipo.
- Confirmar que `BLOCKS.md` registra cierre.
- Confirmar que `FROZEN.md` tiene los 4 archivos nuevos.
- Programar tarea recurrente del legal-docs-keeper para actualizar
  UF/UTM cada mes calendario.

---

## 11. Archivos que se intentó leer y no existen / pendientes

- `backend/tests/test_payroll_calculator.py` — **no existe.** El
  motor de payroll no tiene tests. Esto es una deuda de calidad
  independiente de este bloque, pero se mitiga con los tests nuevos
  listados en §3.1.
- `backend/tests/test_hr_routes.py` — **no existe.** Mismo caso.

---

**Fin del plan.** Pendiente de aprobación de Cristian antes de invocar
legal-docs-keeper (Paso 0, Capa 0).
