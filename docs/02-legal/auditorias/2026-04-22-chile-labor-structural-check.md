---
documento: Auditoría jurídica estructural de constantes de nómina chilena
fecha: 2026-04-22
agente: web-architect (Tori)
tipo: audit estructural + citas jurídicas literales
scope complementario: legal-docs-keeper audita en paralelo los valores
                     numéricos puros (UF, UTM, tramos impuesto,
                     porcentajes). Este documento NO los duplica.
estado: BORRADOR — requiere validación humana + abogado antes de
        cerrar divergencias y remover duplicados.
---

# Auditoría jurídica estructural — constantes de nómina chilena

## 0. Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción.

## 1. Accesibilidad de fuentes oficiales desde esta sesión

La sesión ejecuta en entorno sin salida abierta a internet. Se
intentaron los siguientes accesos con `curl -sI` directo:

| Dominio | Probe | Resultado |
|---|---|---|
| `www.bcn.cl` (idNorma=207436 Código del Trabajo) | HEAD | HTTP/2 **401** CloudFront |
| `www.bcn.cl` (idNorma=1194020 Ley 21.561) | HEAD | HTTP/2 **401** CloudFront |
| `www.dt.gob.cl` | HEAD | HTTP/1.1 302 (redirige a escritorio.dirtrab.cl) |

Conclusión: no es posible citar texto literal en vivo desde `bcn.cl`
(portal SPA + CloudFront 401 para no-browser). Ya está documentado en
`docs/plans/bloque-legal-consolidation-v2/citas-recolectadas-2026-04-20.md`
y en `docs/legal/weekly-audit-2026-04-21.md §7`.

Cuando este documento dice "CITA LITERAL PENDIENTE" significa que el
texto exacto del artículo no fue verificado en esta sesión y que la
afirmación apoyada depende de:

1. Las citas ya validadas por Cristian en batch §21 del 2026-04-21
   (registradas en `backend/constants/labor_chile.py` como
   `Verificador: Cristian (Capa 0 batch §21)`).
2. El borrador `docs/legal/drafts/2026-04-21-labor-chile-py.md` del
   legal-docs-keeper.
3. El plan `docs/plans/bloque-nomina-chile-v1/plan.md` §8.2.

Ninguna afirmación de este documento usa texto parafraseado desde
memoria sin respaldo en una de esas tres fuentes + URL oficial.

## 2. Resumen ejecutivo

Existen tres copias divergentes de `CHILE_LABOR` en el repositorio. La
auditoría confirma 11 divergencias estructurales o jurídicas que
deben resolverse antes de cerrar `bloque-nomina-chile-v1`. Ninguna es
meramente numérica; todas tocan **estructura**, **cita jurídica**, o
**contrato de interfaz** entre frontend y backend. Dos divergencias
son CRÍTICAS (bugs que rompen el test de regresión silenciosamente) y
tres son JURÍDICAMENTE AMBIGUAS (requieren dictamen DT o verificación
literal del texto legal).

### 2.1 Tabla maestra de divergencias

| # | Área | HRDashboard.tsx | ChileLaborConstants.ts | Canónicas (shared/backend) | Criticidad |
|---|---|---|---|---|---|
| 1 | Divisor `partialRate` | `/42` | `/40` | no define | **CRÍTICA** + AMBIGUA |
| 2 | IMM history entries | 8 | 6 | no define | MEDIA |
| 3 | IMM reduced / nonRem | 402 238 / 319 756 | 372 989 / 296 514 | no define | MEDIA |
| 4 | UF redondeado | `39842` | `39841.72` (via shared) | `39841.72` | MEDIA |
| 5 | Topes CLP derivados (getters) | getters inline | getters inline | no expone CLP | BAJA |
| 6 | Tabla impuesto 2ª cat. | literal inline | derivado del canónico | canónico único | BAJA |
| 7 | `CONTRACT_PROGRESSION.stages` | 30/60/indef | idem | no define | **JURÍDICA AMBIGUA** |
| 8 | `INDEMNIZACIONES` — cita | "Art. 163, 168, 169 CT" | idem | no define | **INCORRECTA** (tope 90 UF es Art. 172 CT) |
| 9 | `FERIADO` — cita | "Art. 67-76 CT" | idem | no define | CORRECTA (rango) pero falta Art. 68 específico para progresivo |
| 10 | `GRATIFICACION` — cita | "Art. 47-50 CT" | idem | Art. 50 solo | CORRECTA (rango) |
| 11 | APV Régimen A/B tope | 6 UTM/600 UF | idem | no define | **CITA LITERAL PENDIENTE** (Art. 20L DL 3.500) |

## 3. Análisis por sección del brief

### 3.1 Jornada parcial y divisor de sueldo mínimo proporcional

**Estructura actual en el código**:

- `src/pages/HRDashboard.tsx:181`:
  ```ts
  partialRate: (weeklyHours: number) => Math.round((539000 * weeklyHours) / 42)
  ```
- `src/admin/shared/ChileLaborConstants.ts:33`:
  ```ts
  partialRate: (weeklyHours: number) => Math.round((SUELDO_MINIMO_2026 * weeklyHours) / 40)
  ```
- `backend/constants/labor_chile.py`: no define `partialRate`. Solo
  expone `get_weekly_hours_at_date(fecha)` con los tres escalones
  (44 / 42 / 40) y sus fechas de corte.

**Cita jurídica aplicable**:

- Art. 40 bis CT: "Las partes podrán pactar contratos de trabajo con
  jornada a tiempo parcial, considerándose afectos a las normas del
  presente párrafo aquéllos en que se ha convenido una jornada de
  trabajo no superior a dos tercios de la jornada ordinaria, a que se
  refiere el artículo 22." **CITA LITERAL PENDIENTE (bcn.cl 401)**.
  Fuente: `https://www.bcn.cl/leychile/navegar?idNorma=207436`.
- Art. 44 inc. 3 CT: regula el sueldo mínimo proporcional para
  jornadas inferiores a la ordinaria. **CITA LITERAL PENDIENTE**.
- Art. 40 bis A CT: establece que las remuneraciones y beneficios en
  el contrato parcial serán proporcionales a la jornada convenida
  **respecto de la jornada ordinaria legal**. **CITA LITERAL
  PENDIENTE**.
- Ley 21.561 Art. 1° transitorio — Mintrab interpretó públicamente en
  `https://www.mintrab.gob.cl/ley-40-horas-conoce-las-principales-medidas-que-comienzan-a-regir-el-26-de-abril/`
  que la jornada parcial se refiere a la **jornada ordinaria vigente**.
  Esto significa que desde 2026-04-26 el divisor cambia a 42, y desde
  2028-04-26 a 40.

**Estado jurídico — AMBIGUO**:

El Código del Trabajo dice "proporcional a la jornada ordinaria".
Hasta 2026-04-25 la jornada ordinaria del Art. 22 es 44h (escalón 1
Ley 21.561). Desde 2026-04-26 es 42h. Desde 2028-04-26 es 40h.

La Dirección del Trabajo **no ha publicado** (al conocimiento de este
documento al 2026-04-22) un Ordinario específico resolviendo si el
divisor del sueldo mínimo proporcional en el período de transición
Ley 21.561 es:

- (a) la jornada ordinaria vigente en la fecha del contrato/pago (42
  desde 2026-04-26), o
- (b) la jornada de 45h histórica pre-reforma congelada como
  referencia, o
- (c) otra regla específica.

La interpretación sistemática del Art. 44 + Art. 22 + Ley 21.561 Art.
1° transitorio apunta a (a). Ese es el criterio que `labor_chile.py`
recoge implícitamente con `get_weekly_hours_at_date()`. Pero sin
dictamen DT literal, cualquier valor es impugnable.

**Acción recomendada**:

1. Cristian valida con abogado laboral chileno si existe Ordinario DT
   2024-2026 que resuelva la cuestión.
2. Si no existe, el repositorio adopta criterio (a) = jornada
   ordinaria vigente en la fecha. `partialRate(weeklyHours, fecha)`
   debe recibir `fecha` y usar `get_weekly_hours_at_date(fecha)` como
   divisor.
3. Agregar test con 3 fechas: 2026-04-25 → /44, 2026-04-26 → /42,
   2028-04-26 → /40.
4. Eliminar ambos `partialRate` actuales (HRDashboard y
   ChileLaborConstants) y centralizarlo en `shared/chile_constants.ts`
   como función pura.

**Divergencia**:

- HRDashboard usa `/42` (adelantado al escalón 2, pero **hoy 2026-04-22
  todavía rige 44h** — bug leve).
- ChileLaborConstants usa `/40` (proyectado al escalón 3 de 2028, o
  valor histórico legacy). **Inconsistente con ambos escalones
  actuales.**
- Canónico no define, el bug persiste en ambas copias.

Este es el hallazgo **CRÍTICO** de esta auditoría: los dos archivos se
contradicen y ninguno refleja la regla legal vigente al 2026-04-22
(que sería divisor 44).

### 3.2 Historia completa del IMM (Art. 44 CT + Ley 21.751)

**Estructura actual**:

- `src/pages/HRDashboard.tsx:170-179`: 8 entradas históricas.
- `src/admin/shared/ChileLaborConstants.ts:25-32`: 6 entradas
  (faltan `2025-01-01: 510000` y `2025-05-01: 529000`).
- `backend/constants/labor_chile.py`: no tiene `IMM_HISTORY`; solo
  `SUELDO_MINIMO_2026 = 539000` y `SUELDO_MINIMO_2026_VIGENCIA`
  (en borrador `2026-04-21-labor-chile-py.md`).

**Cita jurídica aplicable**:

- Art. 44 CT — remuneración no inferior al ingreso mínimo mensual
  fijado por ley. **CITA LITERAL PENDIENTE**.
- Ley 21.751 Art. 1° (2026-01-01): $539.000. Verificado Capa 0 2026-04-21.
  Fuente: `https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual/`.
- Reajustes previos, **cita literal pendiente por ley**:
  - Ley 21.578 (2023-2025 reajustes): `https://www.bcn.cl/leychile/navegar?idNorma=1192717`.
  - Ley 21.456 (reajuste 2022-2023): `https://www.bcn.cl/leychile/navegar?idNorma=1177020`.

**Historial propuesto con atribución por ley** (pendiente verificación
link-por-link):

| Vigencia desde | Monto | Ley | Fuente |
|---|---|---|---|
| 2022-08-01 | $400.000 | Ley 21.456 Art. 1° (primer tramo) | bcn.cl/leychile/navegar?idNorma=1177020 |
| 2023-05-01 | $410.000 | Ley 21.456 Art. 1° (segundo tramo) | idem |
| 2023-09-01 | $440.000 | Ley 21.456 Art. 1° (tercer tramo) | idem |
| 2024-01-01 | $460.000 | Ley 21.456 Art. 1° (cuarto tramo) | idem |
| 2024-07-01 | $500.000 | Ley 21.578 Art. 1° | bcn.cl/leychile/navegar?idNorma=1192717 |
| 2025-01-01 | $510.000 | Ley 21.578 Art. 1° (segundo tramo) | idem |
| 2025-05-01 | $529.000 | Ley 21.578 Art. 1° (tercer tramo) | idem |
| 2026-01-01 | $539.000 | Ley 21.751 Art. 1° | mintrab.gob.cl/ya-es-una-realidad-... |

**Divergencia**:

- HRDashboard tiene 8 entradas (la lista propuesta de arriba).
- ChileLaborConstants falta 2025-01 y 2025-05 → **bug silencioso**: si
  el producto calcula reliquidaciones para períodos de esos meses,
  usará como referencia el IMM 2024 ($500.000) en vez del real
  ($510.000 y $529.000).

**Acción recomendada**:

1. Cristian verifica cada valor contra el texto de las tres leyes.
2. El historial completo se traslada al canónico (nuevo
   `SUELDO_MINIMO_HISTORY` en `shared/chile_constants.ts` y
   `labor_chile.py`).
3. HRDashboard y ChileLaborConstants.ts importan el historial, no lo
   duplican.
4. Función `get_imm_at_date(fecha)` para reliquidaciones.

### 3.3 Valores `IMM.reduced` y `IMM.nonRemunerational`

**Estructura actual**:

- HRDashboard: `reduced: 402238`, `nonRemunerational: 319756`.
- ChileLaborConstants.ts: `reduced: 372989`, `nonRemunerational: 296514`.
- Canónico: no define.

**Cita jurídica aplicable**:

- Art. 44 inc. 2 CT — menores de 18 y mayores de 65: **CITA LITERAL
  PENDIENTE** (regulada históricamente por reducción proporcional vía
  ley de reajuste anual). Fuente:
  `https://www.bcn.cl/leychile/navegar?idNorma=207436`.
- Cada ley de reajuste (21.456, 21.578, 21.751) define tres montos:
  - IMM trabajadores 18-65 años (el valor "remuneracional").
  - IMM menores de 18 y mayores de 65 (el "reduced").
  - IMM para efectos **no remuneracionales** (asignación familiar,
    subsidio maternal, etc.). **CITA LITERAL PENDIENTE**.

**Estado**: los valores de HRDashboard ($402.238 y $319.756) son
coherentes con las razones históricas aplicadas al IMM 2026
$539.000. Los valores de ChileLaborConstants.ts ($372.989 y $296.514)
son del IMM anterior ($500.000 × mismas razones). ChileLaborConstants
**está desfasado** respecto del reajuste Ley 21.751.

**Acción recomendada**:

1. Cristian verifica los valores oficiales 2026 contra el texto
   literal de Ley 21.751 Art. 2° (si regula los 3 montos) o bien
   contra el decreto de reajuste específico que cita cada monto.
2. Si Ley 21.751 solo fija $539.000 y los otros dos montos se derivan
   por decreto o fórmula histórica, documentar la fórmula en el
   canónico.
3. Centralizar en `shared/chile_constants.ts` como constantes con 4
   líneas de cita. HRDashboard y ChileLaborConstants los importan.

### 3.4 Gratificación legal (Art. 47-50 CT)

**Estructura actual**:

- HRDashboard + ChileLaborConstants: `{ rate: 0.25, topeMensualIMM:
  4.75, topeMensual (getter): Math.round(IMM * 4.75 / 12) }`.
- `backend/constants/labor_chile.py:151-155`:
  ```python
  GRATIFICACION_TOPE_IMM: Decimal = Decimal("4.75")
  ```
  Cita: "Ley 21.751 Art. Y, CT Art. 50".
- Borrador `labor_chile.py` del legal-docs-keeper línea 318:
  `GRATIFICACION_TOPE_IMM_ANUAL: float = 4.75`,
  `GRATIFICACION_RATE_PCT: float = 0.25`.

**Cita jurídica aplicable**:

- Art. 47 CT: "Los establecimientos mineros, industriales, comerciales
  o agrícolas, empresas y cualesquiera otros que persigan fines de
  lucro, y las cooperativas, que estén obligados a llevar libros de
  contabilidad y que obtengan utilidades o excedentes líquidos en sus
  giros, tendrán la obligación de gratificar anualmente a sus
  trabajadores en proporción no inferior al 30% de dichas utilidades
  o excedentes." **CITA LITERAL PENDIENTE (bcn.cl 401)**.
- Art. 50 CT: "El empleador que abone o convenga con sus trabajadores
  pagar el 25% de lo devengado en el respectivo ejercicio comercial
  por concepto de remuneraciones mensuales, quedará eximido de la
  obligación establecida en el artículo 47, sea cual fuere la utilidad
  líquida que obtuviere. En este caso, la gratificación de cada
  trabajador no excederá de 4,75 ingresos mínimos mensuales."
  **CITA LITERAL PENDIENTE (bcn.cl 401)**.

Fuente: `https://www.bcn.cl/leychile/navegar?idNorma=207436`.

**Estado**:

- Art. 47 = modalidad proporcional a utilidades (mínimo 30% del
  líquido del ejercicio).
- Art. 50 = modalidad alternativa 25% de remuneraciones con tope
  anual 4,75 IMM. Es la que implementa Conniku.
- Art. 48 y 49 regulan el cálculo de utilidades. No cambian el tope.

La cita del código ("Art. 47-50 CT") es estructuralmente correcta
como rango. Sin embargo, **solo Art. 50 fija el tope 4,75 IMM**; Art.
47 es la modalidad competidora. Para precisión jurídica, el código
debería citar "Art. 50 CT" específicamente cuando aplica el tope 4,75,
y "Art. 47 CT" cuando aplica la modalidad 30%.

**No hay reforma conocida** al tope 4,75 IMM en 2024-2026 (verificado
por ausencia en weekly-audit-2026-04-21 y en borrador
2026-04-21-labor-chile-py.md).

**Acción recomendada**:

1. Mantener constante `GRATIFICACION_TOPE_IMM = 4.75` y
   `GRATIFICACION_RATE = 0.25` en canónico con cita literal pendiente
   de verificar vía abogado.
2. El texto visible al usuario (tooltip "Gratificación: 25% del sueldo
   con tope 4,75 IMM anual") debe citar **Art. 50 CT**
   específicamente, no "Art. 47-50". Cumple §CLAUDE.md "Visibilidad
   legal en la interfaz" con precisión.

### 3.5 AFC — Seguro de Cesantía (Ley 19.728)

**Estructura actual**:

- Tres copias: `AFC.employeeRate = 0.006`, `employerIndefinido =
  0.024`, `employerPlazoFijo = 0.03`. Idénticas en las 3 fuentes.
- Canónico `backend/constants/labor_chile.py:69-85` + exports TS en
  `shared/chile_constants.ts:55-69`.

**Cita jurídica aplicable**:

- Ley 19.728 Art. 5°: cotizaciones según tipo de contrato. **CITA
  LITERAL PENDIENTE (bcn.cl 401)**. Fuente:
  `https://www.bcn.cl/leychile/navegar?idNorma=185700`.
- Ley 19.728 Art. 6°: contrato a plazo fijo, por obra o faena: **CITA
  LITERAL PENDIENTE**.
- Tope imponible AFC = 135,2 UF desde 2026-02 (Superintendencia de
  Pensiones, verificado Capa 0 D-B batch §21 por Cristian 2026-04-21).
  Fuente:
  `https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html`.

**Estado**: Estructuralmente correcto, sin divergencias. Citas
pendientes de validación literal por abogado.

**Divergencia menor**: `TOPES.afcUF = 135.2` ya está corregido en las
tres copias. El borrador `2026-04-21-labor-chile-py.md` línea 193 lo
deja como 135,2 UF por decisión D-B batch.

**Acción recomendada**: ninguna estructural. Legal-docs-keeper (en
paralelo) verifica el tope 135,2 contra Circular Superintendencia
2026. Esta auditoría no duplica.

### 3.6 Indemnizaciones (Art. 163, 168, 169 CT + Art. 172 tope 90 UF)

**Estructura actual**:

- HRDashboard + ChileLaborConstants:
  ```ts
  INDEMNIZACIONES: {
    anosServicioTope: 11,          // 330 días
    remuneracionTopeUF: 90,        // tope mensual
    sustitutiva: 30,
    faltaAviso: 30,
    recargos: { art161: 0.3, art159_4_6: 0.5, art160: 0.8 },
  }
  ```
- Comentario actual: "Art. 163, 168, 169 CT".
- Canónico: no define.

**Cita jurídica aplicable**:

- **Art. 163 CT**: fija el monto base de indemnización por años de
  servicio (30 días por año con tope 11 años = 330 días). Se aplica
  al despido por necesidades de la empresa (Art. 161). **CITA
  LITERAL PENDIENTE**.
- **Art. 168 CT**: recargos sobre la indemnización base según la
  causal alegada y declarada injustificada en juicio:
  - 30% si la causal Art. 161 se declara injustificada.
  - 50% si la causal Art. 159 (N°4, 5, 6) o Art. 160 se declara
    injustificada (el código usa `art159_4_6` pero Art. 159 N°4 es
    "vencimiento del plazo", N°5 "conclusión del trabajo o servicio",
    N°6 "caso fortuito o fuerza mayor" — no es obvio por qué se
    agrupan 4 y 6 omitiendo 5).
  - 80% si causal Art. 160 (falta grave imputable al trabajador).
  - 100% en caso de hechos particularmente graves declarados
    injustificados. **CITA LITERAL PENDIENTE**.
- **Art. 169 CT**: indemnización sustitutiva del aviso previo (30
  días de remuneración) cuando empleador invoca Art. 161 sin dar
  aviso con 30 días de anticipación. **CITA LITERAL PENDIENTE**.
- **Art. 172 CT**: fija el **tope de 90 UF** sobre la última
  remuneración mensual sobre la que se calcula la indemnización.
  **CITA LITERAL PENDIENTE**. Fuente:
  `https://www.bcn.cl/leychile/navegar?idNorma=207436`.

**Divergencia jurídica — CITA INCORRECTA**:

El código actual comenta "Art. 163, 168, 169 CT". El tope **90 UF**
NO aparece en esos tres artículos; aparece en **Art. 172 CT**. La
constante `remuneracionTopeUF: 90` debe citar Art. 172, no Art. 163.

Igualmente, el agrupamiento `art159_4_6: 0.5` requiere aclararse en
comentario: ¿es "Art. 159 N°4 o N°6"? ¿"Art. 159 N°4 a 6"? ¿Por qué
se omite N°5 (conclusión del trabajo)? Sin cita literal explícita es
ambiguo.

**Acción recomendada**:

1. Cambiar el comentario de la constante a "Art. 161, 163, 168, 169,
   172 CT" con cita literal por valor (abogado valida cada uno):
   - `anosServicioTope: 11` → Art. 163 CT.
   - `remuneracionTopeUF: 90` → **Art. 172 CT**.
   - `sustitutiva: 30` → Art. 161 inc. 2 CT + Art. 169 CT.
   - `faltaAviso: 30` → Art. 162 CT (último inciso).
   - `recargos.art161: 0.3` → Art. 168 letra a) CT.
   - `recargos.art159_4_6: 0.5` → Art. 168 letra b) CT (verificar
     numerales exactos).
   - `recargos.art160: 0.8` → Art. 168 letra c) CT.
2. Renombrar `art159_4_6` a nombre más explícito una vez verificado el
   alcance real del recargo 50%.
3. Documentar cada valor con su cita de 4 líneas en el canónico.

Este es el segundo hallazgo **CRÍTICO** de esta auditoría: la cita
jurídica del código apunta al artículo equivocado para el tope 90 UF.
Cualquier auditor o DT que revise la UI lo marcará.

### 3.7 Horas extraordinarias (Art. 30, 31, 32 CT)

**Estructura actual**:

- `HORAS_EXTRA: { recargo: 0.5, maxDiarias: 2, maxPacto: 3 }` idéntico
  en las tres copias.
- `backend/constants/labor_chile.py`: no define horas extras (pertenece
  al motor payroll, no a constantes legales puras).

**Cita jurídica aplicable**:

- **Art. 30 CT**: definición de jornada extraordinaria. **CITA
  LITERAL PENDIENTE**.
- **Art. 31 CT**: límite 2 horas diarias, pactadas por escrito. **CITA
  LITERAL PENDIENTE**.
- **Art. 32 CT**: recargo mínimo 50% sobre hora ordinaria. Puede
  pactarse mayor. **CITA LITERAL PENDIENTE**.

**Ley 21.561 — ¿afecta horas extras?**:

Ley 21.561 reduce la jornada ordinaria, pero **no reforma Art. 30, 31
ni 32 CT**. El recargo se mantiene 50% sobre la hora ordinaria
**redefinida** (sueldo / horas mensuales vigentes = sueldo / 168 desde
2026-04-26). El límite 2h/día + pacto 3 meses no cambia.

Esto está reflejado en el canónico vía
`get_monthly_hours_at_date(fecha)` del `labor_chile.py`. El cálculo
de hora ordinaria en `hr_routes.py` y `payroll_calculator.py` debe
usar esa función (ver plan `bloque-nomina-chile-v1` §4 Paso 8).

**Acción recomendada**:

1. Mantener estructura `HORAS_EXTRA` actual en el canónico con cita
   cada valor: `recargo → Art. 32 CT`, `maxDiarias → Art. 31 CT`,
   `maxPacto → Art. 32 bis CT` (verificar si el pacto 3 meses está en
   Art. 32 bis o en Art. 31; el Art. 32 bis fue introducido por
   reformas específicas).
2. Validar Art. 32 bis CT con abogado — **CITA LITERAL PENDIENTE**.
3. El motor payroll usa `get_monthly_hours_at_date(fecha)` (D-N3 del
   plan).

### 3.8 APV (Arts. 20 bis - 20 L DL 3.500)

**Estructura actual**:

- HRDashboard + ChileLaborConstants:
  ```ts
  APV: {
    regimes: [
      { value: 'A', label: '... tope 6 UTM/ano', maxAnnualUTM: 6 },
      { value: 'B', label: '... tope 600 UF/ano' },
    ],
    maxAnnualUF: 600,
  }
  ```
- Canónico: no define APV.

**Cita jurídica aplicable**:

- **Art. 20 bis DL 3.500**: autoriza el APV. **CITA LITERAL PENDIENTE**.
- **Art. 20 H DL 3.500**: bonificación fiscal 15% para el Régimen A
  con tope 6 UTM/año. **CITA LITERAL PENDIENTE**.
- **Art. 20 L DL 3.500**: tope APV 600 UF anuales para trabajadores
  dependientes e independientes. **CITA LITERAL PENDIENTE**.

Fuente: `https://www.bcn.cl/leychile/navegar?idNorma=7147`.

**Estado**: estructura coherente pero citas literales no verificadas
esta sesión. Borrador legal-docs-keeper 2026-04-21 no incluye APV;
está FUERA del scope del Bloque 1 cookies y del Bloque nomina-v1
inicial.

**Divergencia**:

- El label del Régimen B dice "sin tope legal, tope 600 UF/ano". Esta
  frase es **contradictoria**: o tiene tope legal, o no lo tiene. El
  tope 600 UF **sí es legal** (Art. 20 L DL 3.500). El label correcto
  sería: "Rebaja base tributable, tope 600 UF anuales (Art. 20 L
  DL 3.500)".

**Acción recomendada**:

1. Cristian/abogado valida cita exacta (Art. 20 H para Régimen A, Art.
   20 L para tope 600 UF del Régimen B).
2. Corregir el label del Régimen B para eliminar la contradicción
   ("sin tope legal" es incorrecto).
3. Centralizar APV en canónico cuando toque un bloque que use APV
   activamente (actualmente Conniku no descuenta APV en liquidaciones
   reales, solo lo muestra como opción declarativa).

### 3.9 Pensión de Alimentos (Ley 14.908)

**Estructura actual**:

- HRDashboard + ChileLaborConstants:
  ```ts
  PENSION_ALIMENTOS: {
    minimoPerHijo: 0.4,
    minimoMultiple: 0.3,
    maxRetencion: 0.5,
  }
  ```
- Canónico: no define.

**Cita jurídica aplicable**:

- **Art. 3° Ley 14.908**: mínimo legal por hijo (40% IMM por 1 hijo,
  30% por cada hijo si son 2+). **CITA LITERAL PENDIENTE**.
- **Art. 7° Ley 14.908**: tope 50% de la remuneración. **CITA LITERAL
  PENDIENTE**.
- **Art. 8° Ley 14.908**: retención por el empleador. **CITA LITERAL
  PENDIENTE**.

Fuente: `https://www.bcn.cl/leychile/navegar?idNorma=173204`.

**Comentario actual del código**: "Art. 8 Ley 14.908" (retención) y
"Art. 7 Ley 14.908" (maxRetencion). El **minimoPerHijo** y
**minimoMultiple** no citan artículo. Debería citar Art. 3°.

**Ley 21.389 (2021) Ley Papito Corazón** modificó Ley 14.908
agregando Registro de Deudores; no cambió los porcentajes del Art. 3°
y Art. 7° según conocimiento al 2026-04-22. **CITA LITERAL PENDIENTE**
para confirmar.

**Acción recomendada**:

1. Agregar cita Art. 3° Ley 14.908 a `minimoPerHijo` y
   `minimoMultiple`.
2. Verificar si Ley 21.389 o posteriores modificaron los porcentajes.
3. Centralizar en canónico cuando se implemente el flujo de retención
   judicial.

### 3.10 Feriado legal (Art. 67-76 CT)

**Estructura actual**:

- `FERIADO: { diasBase: 15, progresivo: { fromYear: 10,
  extraPerYears: 3, extraDays: 1 }, acumulacionMax: 2 }`.
- Canónico: no define.

**Cita jurídica aplicable**:

- **Art. 67 CT**: 15 días hábiles de feriado, con goce de
  remuneración íntegra. **CITA LITERAL PENDIENTE**.
- **Art. 68 CT**: feriado progresivo — 1 día adicional por cada 3
  nuevos años trabajados, aplicable a trabajadores con **10 años o
  más** (para un mismo empleador o sumados empleadores anteriores con
  tope 10 años anteriores). **CITA LITERAL PENDIENTE**.
- **Art. 70 CT**: acumulación máxima 2 períodos. **CITA LITERAL
  PENDIENTE**.
- Arts. 71-76 CT: reglas específicas, pago del feriado, exclusiones.

**Estado**: comentario del código "Art. 67-76 CT" es correcto como
rango pero imprecise. La UI debería citar **Art. 68 CT
específicamente** al lado del feriado progresivo.

**Acción recomendada**:

1. Mantener la estructura. Agregar citas por valor al canónico:
   - `diasBase: 15` → Art. 67 CT.
   - `progresivo` → Art. 68 CT.
   - `acumulacionMax: 2` → Art. 70 CT.
2. La UI muestra la cita específica junto al valor (cumple §CLAUDE.md
   "Visibilidad legal en la interfaz").

### 3.11 Progresión de contratos y plazos (Art. 159 N°4 CT)

**Estructura actual**:

- `CONTRACT_PROGRESSION.stages: [{ days: 30 }, { days: 60 }, { days:
  0, type: indefinido }]`.
- Comentario: "Tercer contrato: indefinido (automatico por ley, Art.
  159 N°4)".

**Cita jurídica aplicable**:

- **Art. 159 N°4 CT**: conversión automática a indefinido:
  - (a) del trabajador que continúa prestando servicios con
    conocimiento del empleador después de vencido el plazo, y
  - (b) del **segundo contrato a plazo fijo** con el mismo empleador
    (o del primero si la relación excede de 1 año en total — con tope
    2 años para gerentes y profesionales con título).
  **CITA LITERAL PENDIENTE**. Fuente:
  `https://www.bcn.cl/leychile/navegar?idNorma=207436`.

**Estado — JURÍDICAMENTE AMBIGUO**:

La elección de Conniku (30 días + 60 días + indefinido) es **más
restrictiva** que el mínimo legal (el empleador podría pactar hasta 1
año en primer contrato y hasta 1 año en el segundo antes de que opere
la conversión automática). Esto es válido legalmente — **una empresa
puede pactar plazos menores**, la ley fija el máximo.

**Pero**: el comentario "Tercer contrato: indefinido (automático por
ley, Art. 159 N°4)" es **inexacto**. Art. 159 N°4 convierte a
indefinido al **segundo contrato a plazo fijo**, no al tercero. La
estructura Conniku (30+60+indef) funciona porque después del segundo
plazo fijo se va a indefinido **por diseño de producto**, no porque
el tercero sea automático "por ley".

**Divergencia jurídica**: si un usuario del módulo HR de Conniku
interpreta el comentario como "la ley obliga a pasar a indefinido en
el tercer contrato", incurre en error jurídico. El empleador puede
firmar un segundo plazo fijo y luego otro segundo plazo fijo, pero la
ley convierte el segundo en indefinido automáticamente. Conniku debe
explicar que su regla de negocio (30+60+indefinido) es **más
protectora que la ley** y anticipa la conversión.

**Acción recomendada**:

1. Actualizar comentario:
   "Progresión Conniku (más protectora que Art. 159 N°4 CT). Art. 159
   N°4 CT convierte el SEGUNDO contrato a plazo fijo en indefinido;
   Conniku anticipa esa conversión al tercer contrato como regla de
   producto."
2. Considerar si el flujo de UI permite al empleador saltarse la
   progresión y firmar directo indefinido (ya lo permite con
   `allowDirectIndefinido: true`).

### 3.12 Fechas clave Conniku payroll vs obligaciones legales

**Estructura actual**:

- `CONNIKU_PAYROLL: { cierreDia: 22, pagoDia: 'ultimo_habil',
  anticipoDia: 15, anticipoMaxPct: 0.4, previredPlazo: 13 }`.

**Cita jurídica aplicable**:

- **Art. 55 CT**: oportunidad de pago — las remuneraciones se pagarán
  con la periodicidad estipulada, sin exceder de 1 mes. Si no hay
  estipulación, el día y hora serán los fijados en el reglamento
  interno. **CITA LITERAL PENDIENTE**.
- **Art. 56 CT**: el pago se hará en día de trabajo, entre lunes y
  viernes, en el lugar de trabajo o dentro de la hora siguiente.
  **CITA LITERAL PENDIENTE**.
- **DS 28 de 1981 MINTRAB**: Previred — plazo de declaración y pago
  de cotizaciones previsionales: día 10 del mes siguiente (formato
  papel); extendido a día 13 si se declara y paga electrónicamente.
  **CITA LITERAL PENDIENTE**. Fuente:
  `https://www.previred.com` y `https://www.spensiones.cl`.
- **Art. 19 DL 3.500**: plazo de pago de cotizaciones 10 primeros
  días del mes siguiente al trabajo. **CITA LITERAL PENDIENTE**.

**Estado**:

- `pagoDia: 'ultimo_habil'` = política interna Conniku, compatible con
  Art. 55 CT (el mes no se excede). Cita Art. 55 es correcta
  implícitamente.
- `previredPlazo: 13` = plazo extendido electrónico. Cita DS 28 + Art.
  19 DL 3.500. El comentario actual del código no lo cita.
- `anticipoDia: 15` + `anticipoMaxPct: 0.4` = política interna
  Conniku. **No existe obligación legal directa** de ofrecer
  anticipo; es beneficio voluntario. **La regla "40%" NO proviene de
  Art. 55 CT** (contrario al comentario de la constante
  `anticipoMaxPct`). Viene de práctica comercial común, no de ley.
  **Esto es otra CITA JURÍDICA INCORRECTA** en el código actual
  (comentario "Máximo 40% del sueldo al día 22 según Art. 55 del
  Código del Trabajo" que aparece en CLAUDE.md §"Ejemplos de
  implementación en interfaz"). Art. 55 CT no fija ningún "40%".
- `cierreDia: 22` = política interna. Sin cita legal.

**Acción recomendada**:

1. Eliminar la referencia a "Art. 55 del Código del Trabajo" del
   tooltip de anticipo quincenal (**actualizar CLAUDE.md §"Visibilidad
   legal en la interfaz"**). El anticipo al 40% es política
   comercial, no legal. La UI debe decir "Política Conniku: máximo
   40% del sueldo hasta el día 22" **sin** cita de artículo.
2. Para `previredPlazo: 13` agregar cita "Art. 19 DL 3.500 + DS 28
   MINTRAB — declaración y pago electrónico día 13".
3. Para `pagoDia: 'ultimo_habil'` agregar cita "Art. 55 CT —
   periodicidad mensual máxima; política Conniku elige último día
   hábil del mes".

**Este es el tercer hallazgo CRÍTICO: cita legal falsa sobre el
40% de anticipo**. Es la referencia citada literalmente en CLAUDE.md
como **ejemplo bueno** de implementación. Y resulta ser **incorrecta**.

## 4. Resumen de divergencias con criticidad final

### 4.1 CRÍTICAS (bloquean consolidación)

| # | Divergencia | Archivo afectado | Acción |
|---|---|---|---|
| C1 | Divisor `partialRate` 42 vs 40 vs ausente; ninguno refleja regla vigente 44h | HRDashboard.tsx:181, ChileLaborConstants.ts:33 | Centralizar en shared con `fecha` como parámetro |
| C2 | Tope 90 UF indemnizaciones citado como Art. 163 cuando es Art. 172 CT | HRDashboard.tsx:327, ChileLaborConstants.ts:122 | Cambiar cita a Art. 172 CT |
| C3 | Anticipo 40% citado como Art. 55 CT cuando no existe esa regla legal | CLAUDE.md §"Visibilidad legal" + tooltips UI | Eliminar cita legal; marcar como política Conniku |

### 4.2 MEDIAS (desfase que genera cálculos incorrectos en reliquidaciones)

| # | Divergencia | Acción |
|---|---|---|
| M1 | IMM history incompleto en ChileLaborConstants (falta 2025-01 y 2025-05) | Centralizar en canónico + función get_imm_at_date |
| M2 | IMM.reduced / nonRemunerational desfasados en ChileLaborConstants ($500k base) vs actualizado en HRDashboard ($539k base) | Actualizar ambos y centralizar |
| M3 | UF redondeado `39842` en HRDashboard vs canónico `39841.72` | Eliminar objeto inline, importar de canónico |

### 4.3 JURÍDICAS AMBIGUAS (requieren dictamen o cita literal de abogado)

| # | Divergencia | Acción |
|---|---|---|
| A1 | Ausencia de dictamen DT sobre divisor sueldo mínimo proporcional post-Ley 21.561 | Cristian/abogado confirma interpretación (a) = jornada ordinaria vigente |
| A2 | Agrupamiento `art159_4_6` no declara si es "4 y 6" o "4 a 6" | Cita literal Art. 168 CT |
| A3 | Ley 21.389 y posteriores pueden haber modificado porcentajes Art. 3° y 7° Ley 14.908 | Abogado verifica versión vigente 2026 |

### 4.4 ESTRUCTURALES (sin bug pero mejorables)

| # | Hallazgo | Acción |
|---|---|---|
| S1 | Citas de rango "Art. 47-50 CT", "Art. 67-76 CT", "Art. 163, 168, 169 CT" | Citar artículo **específico** por valor |
| S2 | Label APV Régimen B "sin tope legal, tope 600 UF/ano" es contradictorio | Reformular |
| S3 | Comentario "Tercer contrato: indefinido automático por ley Art. 159 N°4" es inexacto | Reescribir como "regla Conniku más protectora" |
| S4 | CONTRACT_PROGRESSION, FERIADO, PENSION_ALIMENTOS, APV, HORAS_EXTRA, GRATIFICACION no tienen espejo en canónico `shared/chile_constants.ts` | Ampliar canónico |

## 5. Plan de consolidación

### 5.1 Fuente única de verdad

El archivo canónico **único** para constantes laborales chilenas debe
ser:

- **Backend**: `backend/constants/labor_chile.py` (ya existe, debe
  ampliarse con las áreas estructurales que hoy solo viven en
  HRDashboard/ChileLaborConstants).
- **Frontend**: `shared/chile_constants.ts` (ya existe como espejo,
  debe ampliarse en paralelo).

Ambos son espejo byte-a-byte de valores numéricos (enforced por
`scripts/verify-chile-constants-sync.sh` según §23 CLAUDE.md).

`src/admin/shared/ChileLaborConstants.ts` pasa a ser un **wrapper**
que compone derivados (getters CLP, funciones helper) a partir del
canónico, sin duplicar valores.

`src/pages/HRDashboard.tsx` **elimina por completo** el objeto
`CHILE_LABOR` inline (líneas 163-346). Todo consumo pasa por
`ChileLaborConstants.ts` o directo por imports del canónico.

### 5.2 Paso a paso recomendado

1. **Ampliar el canónico** (`shared/chile_constants.ts` +
   `backend/constants/labor_chile.py`) con:
   - `IMM_HISTORY` (lista de tuples [fecha, monto, ley]).
   - `IMM_REDUCED_2026`, `IMM_NON_REMUNERATIONAL_2026` con fórmula y
     cita.
   - `GRATIFICACION_TOPE_IMM` (ya en backend, espejo a TS).
   - `INDEMNIZACION_*` constantes con cita correcta Art. 161, 163,
     168, 169, 172.
   - `CONTRACT_PROGRESSION_STAGES` con comentario "más protector que
     Art. 159 N°4".
   - `FERIADO_*` constantes con cita Art. 67, 68, 70 CT.
   - `PENSION_ALIMENTOS_*` con cita Art. 3°, 7° Ley 14.908.
   - `APV_REGIMES` con cita Art. 20 H, 20 L DL 3.500.
   - `HORAS_EXTRA_*` con cita Art. 30, 31, 32, 32 bis CT.
   - Función `partialRate(imm, weeklyHours, fecha)` que usa
     `get_weekly_hours_at_date(fecha)` como divisor.
   - Función `get_imm_at_date(fecha)` para reliquidaciones.

2. **Ampliar tests de invariante**
   (`src/pages/__tests__/HRDashboard.constants.test.tsx` y espejo
   backend):
   - `partialRate(539000, 22, date('2026-04-25'))` usa divisor 44 →
     verifica.
   - `partialRate(539000, 22, date('2026-04-26'))` usa divisor 42.
   - `partialRate(539000, 22, date('2028-04-26'))` usa divisor 40.
   - `get_imm_at_date(date('2025-03-01'))` === 510000.
   - `get_imm_at_date(date('2025-06-01'))` === 529000.
   - `INDEMNIZACION_TOPE_UF === 90 && cita === "Art. 172 CT"` (mediante
     parseo de bloque docstring 4-líneas).

3. **Refactor `src/admin/shared/ChileLaborConstants.ts`**:
   - Quitar todos los valores hardcoded.
   - Mantener getters (`afpCLP`, `afcCLP`, `topeMensual`,
     `partialRate`) como funciones derivadas desde imports.
   - Recibir `fecha` en las funciones que dependen de fecha de corte
     (partialRate, overtime-related).

4. **Refactor `src/pages/HRDashboard.tsx`**:
   - Eliminar líneas 163-346 (objeto CHILE_LABOR local).
   - Importar `CHILE_LABOR` desde `src/admin/shared/ChileLaborConstants.ts`.
   - Reemplazar `validateSalary` y `calculateTax` locales por imports
     desde el wrapper.
   - Verificar 30+ consumidores internos del objeto inline en el
     archivo (grep `CHILE_LABOR\.`); ajustar.

5. **Correcciones de cita jurídica** (CRÍTICAS C2 y C3):
   - Cambiar comentario de `INDEMNIZACIONES.remuneracionTopeUF = 90`
     a "Art. 172 CT".
   - Actualizar CLAUDE.md §"Visibilidad legal en la interfaz"
     eliminando "según Art. 55 del Código del Trabajo" del ejemplo del
     anticipo 40% (es regla Conniku, no CT).
   - Buscar en UI toda ocurrencia del tooltip del anticipo y
     actualizar.

6. **Script CI de regresión**:
   - `scripts/verify-chile-constants-sync.sh` ya existe para valores
     numéricos. Ampliarlo (o agregar script paralelo) para verificar:
     - Ningún archivo en `src/` declara constantes numéricas del
       dominio CHILE_LABOR que dupliquen las del canónico.
     - Grep bloqueante: `/539_?000|539000|35_?000|0\.0154|135\.2|81\.6|39841\.72|69889/`
       en archivos que **no** sean `shared/chile_constants.ts`,
       `backend/constants/*.py`, o tests marcados.

7. **Capa 0 legal explícita** (OBLIGATORIA por §CLAUDE.md):
   - Invocar legal-docs-keeper con este documento como input.
   - Legal-docs-keeper genera borradores para los documentos legales
     afectados (si alguno de los cambios toca textos visibles en UI
     con cita legal, el texto visible cambia).
   - Cristian aprueba humanamente cada cambio de cita (C2, C3, S1,
     S3).

### 5.3 Protección contra regresiones

Para evitar que el objeto inline vuelva a aparecer en HRDashboard:

- **ESLint custom rule** (o grep CI) que bloquea nuevas declaraciones
  con patrón `const CHILE_LABOR = {` fuera de `shared/` y
  `backend/constants/`.
- **Pre-commit hook** específico del bloque: `scripts/pre-commit-chile-labor.sh`
  que falla si encuentra literales hardcoded del dominio (lista fija
  de valores).
- **Test de invariante** que importa el objeto desde el wrapper y
  verifica que `CHILE_LABOR.UF.value === UF_ABRIL_2026` (ya existe en
  el test actual, ampliar a todas las áreas).
- **Agregar los archivos a FROZEN.md** después del merge del bloque
  `bloque-nomina-chile-v1`: `shared/chile_constants.ts`,
  `backend/constants/labor_chile.py`, `backend/constants/tax_chile.py`,
  `src/admin/shared/ChileLaborConstants.ts`.

### 5.4 Dependencia con bloque-nomina-chile-v1

Este documento **complementa** el plan existente en
`docs/plans/bloque-nomina-chile-v1/plan.md`. Ese plan ya cubre
(parcialmente) los items 1-6 pero NO cubre:

- Las correcciones de **cita jurídica** (C2 indemnización Art. 172,
  C3 anticipo no es Art. 55, S1 citas específicas vs rango).
- La **ampliación del canónico** a áreas estructurales
  (INDEMNIZACIONES, CONTRACT_PROGRESSION, FERIADO, PENSION_ALIMENTOS,
  APV, HORAS_EXTRA, GRATIFICACION) — el plan solo aborda IMM, UF,
  UTM, AFC, SIS, tope AFP, jornada, tax brackets, retención
  honorarios.
- La **unificación del `partialRate`** con fecha como parámetro
  (hallazgo nuevo de esta auditoría).

Se recomienda que el web-architect **amplíe el plan de
nomina-chile-v1** con una sub-sección "Parte E: consolidación
estructural CHILE_LABOR" antes de entrar en Capa 1, o bien abra un
bloque sucesor `bloque-chile-labor-consolidation-v1` con scope
exactamente estos hallazgos.

## 6. Fuentes oficiales referenciadas (pendientes de verificación
literal por abogado)

| Norma | URL | Estado de verificación |
|---|---|---|
| Código del Trabajo (DFL 1 de 2003) | bcn.cl/leychile/navegar?idNorma=207436 | **No accedido esta sesión** (401 CloudFront) |
| DL 3.500 (1980) sistema de pensiones | bcn.cl/leychile/navegar?idNorma=7147 | **No accedido esta sesión** (401) |
| Ley 19.728 (2001) AFC | bcn.cl/leychile/navegar?idNorma=185700 | **No accedido esta sesión** (401) |
| Ley 21.561 (2024) 40 horas | bcn.cl/leychile/navegar?idNorma=1194020 | **No accedido esta sesión** (401) |
| Ley 21.751 (2026) IMM $539.000 | mintrab.gob.cl/ya-es-una-realidad... | Cristian batch §21 2026-04-21 |
| Ley 14.908 pensión alimentos | bcn.cl/leychile/navegar?idNorma=173204 | **No accedido esta sesión** (401) |
| Ley 21.389 Papito Corazón | bcn.cl/leychile/navegar?idNorma=1165145 | **No accedido esta sesión** |
| Circular SII Impuesto 2ª cat. 2026 | sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm | Cristian batch §21 2026-04-21 |
| Resolución Spensiones topes 2026 | spensiones.cl/portal/institucional/594/w3-article-16921.html | Cristian batch §21 2026-04-21 (D-B 135,2 UF) |
| DS 28 MINTRAB (Previred) | No disponible en bcn | **No accedido esta sesión** |
| Ordinarios Dirección del Trabajo | dt.gob.cl | **No buscado sistemáticamente** (302 redirect no seguido) |

Motivo: el portal BCN (leychile) no rinde contenido a `curl`/`WebFetch`
en este entorno (SPA + CloudFront 401 para no-browser). Documentado
previamente en `docs/plans/bloque-legal-consolidation-v2/citas-recolectadas-2026-04-20.md`.

## 7. Conclusión

El repositorio mantiene tres copias divergentes de `CHILE_LABOR`, dos
de ellas con **bugs silenciosos** (C1 partialRate, M3 UF redondeado)
que el test actual no detecta porque se apoya en el wrapper que **sí**
importa del canónico, mientras el HRDashboard tiene objeto inline
desconectado.

Hay **tres errores de cita jurídica** (C2, C3 y S1) que un auditor
externo detectaría al revisar la UI. Dos de ellos están
**replicados en CLAUDE.md** como ejemplos canónicos; esa documentación
también debe corregirse.

Hay **tres zonas jurídicamente ambiguas** (A1 dictamen DT sobre
divisor parcial post-21.561, A2 agrupación recargos Art. 168, A3 Ley
21.389 y porcentajes pensión alimentos) que requieren validación de
abogado antes de cerrar el bloque `nomina-chile-v1`.

El plan de consolidación propone:
1. Ampliar el canónico (ya existente) con todas las áreas
   estructurales.
2. Refactor de HRDashboard y ChileLaborConstants eliminando
   duplicados.
3. Corregir citas jurídicas (C2, C3, S1, S3, corrección CLAUDE.md).
4. Script CI bloqueante + test de invariante ampliado + freeze de
   archivos canónicos.
5. Capa 0 legal-docs-keeper obligatoria antes de Capa 1.

## 8. Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción.
