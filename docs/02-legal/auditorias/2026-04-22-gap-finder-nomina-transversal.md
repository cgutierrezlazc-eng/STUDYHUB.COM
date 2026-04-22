---
documento: Inventario transversal de constantes de nómina chilena
fecha: 2026-04-22
agente: gap-finder (Tori)
rama: bloque-sandbox-integrity-v1
tipo: auditoría completa por 11 categorías
complementario_a:
  - docs/legal/audits/2026-04-22-chile-labor-constants-triple-check.md
  - docs/legal/audits/2026-04-22-chile-labor-structural-check.md
---

# Inventario transversal de constantes de nómina chilena

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

---

## 1. Lo que se me pidió

Barrido exhaustivo del repo Conniku buscando TODAS las copias, ocurrencias o
referencias a constantes de nómina chilena. No modificar código. Solo inventariar
y reportar. Scope: 11 categorías definidas en el prompt (items 15–22 del
inventario meta-plan). Rama: bloque-sandbox-integrity-v1.

---

## 2. Lo que efectivamente hice

### Archivos canónicos de referencia identificados

| Archivo | Rol |
|---|---|
| `/Users/cristiang./CONNIKU/backend/constants/labor_chile.py` | Fuente de verdad backend Python |
| `/Users/cristiang./CONNIKU/backend/constants/tax_chile.py` | Fuente de verdad tributaria backend |
| `/Users/cristiang./CONNIKU/shared/chile_constants.ts` | Espejo TypeScript de ambos `.py` |
| `/Users/cristiang./CONNIKU/src/admin/shared/ChileLaborConstants.ts` | Objeto `CHILE_LABOR` usado por UI |

### Comandos ejecutados

- Grep recursivo `src/` con patrón de valores numéricos + nombres de constantes
- Grep recursivo `backend/` con mismos patrones
- Grep en `docs/legal/` buscando porcentajes y valores hardcoded
- Grep en `scripts/` buscando usos de constantes
- Read completo de `hr_routes.py` sección de constantes (líneas 370–460, 960–1025)
- Read completo de `payroll_calculator.py` secciones de tasas (líneas 55–220)
- Read completo de `DirectorioPersonal.tsx` secciones de constantes (líneas 60–120)
- Read completo de `ChileLaborConstants.ts` (completo)
- Read completo de `shared/chile_constants.ts` (completo)
- Read secciones de `terms.md`, `privacy.md` en `docs/legal/v3.2/`
- Read de los dos audits previos del 2026-04-22 para no duplicar

---

## 3. Inventario por categoría

---

### Categoría 1: Constantes hardcoded en frontend fuera de los 2 archivos canónicos

#### GAP-1.1 — `DirectorioPersonal.tsx`: bloque completo de constantes locales desconectado del canónico

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/modules/personas/DirectorioPersonal.tsx`

**Líneas**:
```
61: // ─── Tasas previsionales Chile 2025 ─────────────────────────────
63: const AFP_RATES: Record<string, { commission: number; obligatory: number }> = {
64:   modelo: { commission: 0.58, obligatory: 10.0 },
65:   capital: { commission: 1.44, obligatory: 10.0 },
66:   cuprum: { commission: 1.44, obligatory: 10.0 },
67:   habitat: { commission: 1.27, obligatory: 10.0 },
68:   planvital: { commission: 1.16, obligatory: 10.0 },
69:   provida: { commission: 1.45, obligatory: 10.0 },
70:   uno: { commission: 0.49, obligatory: 10.0 },
71: };
72: // SIS: 1.49%
73: const SIS_RATE = 1.49;
74: const FONASA_RATE = 7.0;
75: const AFC_WORKER = 0.6;
76: const AFC_EMPLOYER_INDEFINIDO = 2.4;
77: const AFC_EMPLOYER_PLAZO_FIJO = 3.0;
```

**Valores detectados con divergencia**:

| Constante local | Valor local | Canónico | Divergencia |
|---|---|---|---|
| `SIS_RATE` | 1.49% | 1.54% (`labor_chile.py:95`) | **0.05 pp — stale 2024** |
| `AFP.uno commission` | 0.49% | 0.46% (`labor_chile.py:63`) | **0.03 pp — stale** |
| `AFP.planvital commission` | 1.16% | 0.41% (`payroll_calculator.py:115`) | **Divergencia — ver GAP-1.3** |

**Problema**: el archivo no importa nada de `shared/chile_constants` ni de `ChileLaborConstants`.
Calcula liquidaciones de sueldos para contratos laborales reales (función `calcDescuentos`,
llamada en `generarLiquidacionHTML`).

**Clasificación**: BLOQUEA-NÓMINA-REAL

**Recomendación**: reemplazar el bloque de constantes locales por imports de
`CHILE_LABOR` (de `ChileLaborConstants.ts`) o directamente de `shared/chile_constants`.
Eliminar las constantes locales duplicadas.

---

#### GAP-1.2 — `HRDashboard.tsx`: `UF.value = 39842` redondeado, `partialRate` fija `/42`

**Archivo**: `/Users/cristiang./CONNIKU/src/pages/HRDashboard.tsx`

**Líneas**:
```
191:    value: 39842, // $39.841,72 (abril 2026)
181:    partialRate: (weeklyHours: number) => Math.round((539000 * weeklyHours) / 42),
```

**Problemas**:
1. `UF.value = 39842` (entero redondeado) vs canónico `UF_ABRIL_2026 = 39841.72` (decimal exacto).
   El archivo canónico `ChileLaborConstants.ts` importa correctamente desde `shared/chile_constants`,
   pero `HRDashboard.tsx` tiene su propio objeto `CHILE_LABOR` con valor hardcoded.
2. `partialRate` divide siempre por 42, pero desde 2026-04-26 la jornada baja a 42h
   (y el canónico `ChileLaborConstants.ts:33` ya divide por 40 para calcular la tasa por hora).
   La referencia `/42` puede ser correcta si el contexto es "desde 2026-04-26",
   pero está hardcodeada sin referencia a `WEEKLY_HOURS_POST_42H`.
3. Líneas 505–507: `HRDashboard.tsx` sobreescribe `CHILE_LABOR.UF.value`, `.UTM.value`,
   `.IMM.current` en runtime desde la API — lo que significa que los valores hardcoded
   son solo fallbacks.

**Clasificación**: INCONSISTENT-UI (item 3 mitiga; el runtime sobreescribe el fallback)

**Recomendación**: cambiar `value: 39842` por `value: UF_ABRIL_2026` importado desde
`shared/chile_constants` para que el fallback sea exacto. Reemplazar `/42` hardcodeado
en `partialRate` por `WEEKLY_HOURS_POST_42H`.

---

#### GAP-1.3 — `constants.ts` vs `hr_routes.py`: divergencia comisión PlanVital

**Archivo A**: `/Users/cristiang./CONNIKU/src/admin/shared/constants.ts:23`
```
{ value: 'planvital', label: 'PlanVital', rate: 10.41 },
```

**Archivo B**: `/Users/cristiang./CONNIKU/backend/hr_routes.py:383`
```
"planvital": {"employee": 0.1116, "sis": 0.0154},
```
(10% obligatorio + 1.16% comisión = 11.16%)

**Archivo C**: `/Users/cristiang./CONNIKU/backend/payroll_calculator.py:115`
```
AFPName.PLANVITAL: {"mandatory": _AFP_MANDATORY, "commission": 0.0041, ...}
```
(10% + 0.41% = 10.41%)

**Divergencia**: `hr_routes.py` usa 11.16% para PlanVital. `constants.ts` y
`payroll_calculator.py` usan 10.41%.

Nota: el motor de nómina real (`payroll_calculator.py`) usa el valor del canónico
(`payroll_calculator`), pero el motor legacy de `hr_routes.py` usa 11.16%.
Ambos son accedidos por el frontend dependiendo del endpoint llamado.

**Clasificación**: BLOQUEA-NÓMINA-REAL (divergencia de 0.75 pp en descuento AFP PlanVital)

**Recomendación**: verificar la tasa de PlanVital 2026 en spensiones.cl. Unificar
`hr_routes.py` para que importe de `backend/constants/labor_chile.py` igual que
`payroll_calculator.py`.

---

#### GAP-1.4 — `HRDashboard.tsx:1581`: `Jornada máxima semanal = 45 horas` (stale post-Ley 21.561)

**Archivo**: `/Users/cristiang./CONNIKU/src/pages/HRDashboard.tsx:1581`
```
{ label: 'Jornada máxima semanal', value: '45 horas', ref: 'Art. 22 CT' },
```

El Art. 22 CT fue modificado por Ley 21.561 (escalón 1 desde abril 2024: 44h).
Desde 2026-04-26 el escalón 2 baja a 42h. Mostrar "45 horas" es información
legal incorrecta.

**Clasificación**: INCONSISTENT-UI

**Recomendación**: reemplazar por valor dinámico calculado con
`getWeeklyHoursAtDate(new Date())` de `shared/chile_constants`.

---

### Categoría 2: Constantes hardcoded en backend fuera de `backend/constants/`

#### GAP-2.1 — `hr_routes.py`: bloque de constantes locales no importado del canónico

**Archivo**: `/Users/cristiang./CONNIKU/backend/hr_routes.py`

**Líneas con divergencias**:

```python
# Línea 403:
UF_VALUE_CLP = 38500.0  # Fallback stale (debería ser ~40013 al 2026-04-22)

# Línea 408:
UTM_VALUE_CLP = 67000.0  # Fallback stale (debería ser 69889)

# Líneas 974–979:
"afp_uf": 81.6,
"afc_uf": 122.6,      # ← STALE: debería ser 135.2 (D-B verificado)
"salud_uf": 81.6,
"afp_clp": round(raw.get("uf", {}).get("valor", 0) * 81.6),
"afc_clp": round(raw.get("uf", {}).get("valor", 0) * 122.6),  # ← STALE

# Líneas 1013–1014 (fallback dict):
"uf": {"value": 38700, ...},   # stale
"utm": {"value": 67294, ...},  # stale
"topes": {"afc_uf": 122.6, ...},  # ← STALE
"afc_clp": 4749420,  # ← calculado con 122.6 y UF ~38700 — doble stale
```

**Clasificación para `afc_uf: 122.6`**: BLOQUEA-NÓMINA-REAL
El tope AFC de 135.2 UF fue verificado y aprobado (D-B batch §21).
La respuesta del endpoint `/api/indicators` retorna `afc_uf: 122.6` al frontend,
lo que contamina los cálculos de tope AFC cuando la API externa falla.

**Clasificación para fallbacks UF/UTM**: BLOQUEA-NÓMINA-REAL
`_calculate_tax()` en `hr_routes.py:451` usa `UTM_VALUE_CLP = 67000` como fallback
para calcular impuesto de 2ª categoría. Con UTM 67000 en lugar de 69889,
el tramo exento (13.5 × UTM) es $904.500 en lugar de $943.501 — diferencia
de $39.001 en la base exenta.

**Recomendación**:
1. Importar `UF_ABRIL_2026`, `UTM_ABRIL_2026`, `TOPE_IMPONIBLE_AFC_UF` desde
   `backend.constants.labor_chile` en `hr_routes.py`.
2. Reemplazar `UF_VALUE_CLP`, `UTM_VALUE_CLP` por esos imports como fallback.
3. Actualizar el dict de topes en la función de indicadores para usar
   `TOPE_IMPONIBLE_AFC_UF` en lugar del literal `122.6`.

---

#### GAP-2.2 — `hr_routes.py`: `AFP_RATES` local duplicado del motor canónico

**Archivo**: `/Users/cristiang./CONNIKU/backend/hr_routes.py:378–386`
```python
AFP_RATES = {
    "capital":   {"employee": 0.1144, "sis": 0.0154},
    "planvital": {"employee": 0.1116, "sis": 0.0154},  # diverge de payroll_calculator
    ...
}
```

Ya documentado en GAP-1.3. `hr_routes.py` mantiene su propia copia de `AFP_RATES`
que diverge de `payroll_calculator.py` en PlanVital (11.16% vs 10.41%).

**Clasificación**: BLOQUEA-NÓMINA-REAL

---

#### GAP-2.3 — `chile_tax_routes.py:21`: `IVA_CHILE = 0.19` local (no critico, sin divergencia)

**Archivo**: `/Users/cristiang./CONNIKU/backend/chile_tax_routes.py:21`
```python
IVA_CHILE = 0.19
```

El valor coincide con el canónico `tax_chile.py:IVA_PCT = 0.19`. No hay divergencia
de valor, pero existe como constante local desconectada del canónico.

**Clasificación**: DEAD-CODE (sin divergencia de valor; riesgo si IVA cambia)

**Recomendación**: importar `IVA_PCT` desde `backend.constants.tax_chile` y
reemplazar `IVA_CHILE` por `IVA_PCT`.

---

#### GAP-2.4 — `tutor_contract.py:106`: retención honorarios 13,75% stale

**Archivo**: `/Users/cristiang./CONNIKU/backend/tutor_contract.py:106`
```python
"(b) La retencion provisional del impuesto a la renta aplicable (actualmente 13,75% "
"conforme al articulo 74 N.2 de la Ley sobre Impuesto a la Renta);"
```

El canónico `tax_chile.py` define `RETENCION_HONORARIOS_2026_PCT = 0.1525` (15.25%).
El contrato que se genera para cada tutor dice 13.75% (valor de 2025 o anterior).

**Clasificación**: BLOQUEA-NÓMINA-REAL
Este texto forma parte de contratos legales firmados por tutores. Un contrato
que cita 13.75% cuando la tasa vigente es 15.25% contiene información legal
incorrecta en una cláusula tributaria.

**Recomendación**: importar `RETENCION_HONORARIOS_2026_PCT` desde
`backend.constants.tax_chile` y usar el valor en f-string en la cláusula.
Ejemplo: `f"(actualmente {float(RETENCION_HONORARIOS_2026_PCT)*100:.2f}%"`.

---

#### GAP-2.5 — `tutor_routes.py:5` y `tutor_routes.py:2341`: retención honorarios 13.75% en docstring y email HTML

**Archivo**: `/Users/cristiang./CONNIKU/backend/tutor_routes.py`
```
Línea 5:  Tutor is responsible for their own SII tax retention (13.75%).
Línea 2341: como <em>Boleta de Honorarios</em>, con retención 13,75%.</p>
```

El email HTML enviado a tutores cita 13.75%. Los tutores declaran ante el SII
con la tasa vigente (15.25%), pero el email de Conniku les dice 13.75%.

**Clasificación**: BLOQUEA-NÓMINA-REAL (comunicación a tutores con dato incorrecto)

**Recomendación**: mismo que GAP-2.4. Usar el canónico en el f-string del cuerpo del email.

---

### Categoría 3: Migraciones SQL con valores hardcoded

**Resultado**: Grep sobre los 7 archivos `.sql` de `backend/migrations/` no encontró
valores de nómina hardcoded. El único hallazgo es `add_expense_fields.sql:10` que
agrega columna `retencion FLOAT DEFAULT 0` — el DEFAULT es 0 (correcto, sin valor fijo).

**0 gaps detectados** en esta categoría.

---

### Categoría 4: Fixtures de tests con valores stale

**Resultado**: No existe directorio `backend/tests/fixtures/`. El `conftest.py`
en `backend/tests/` no contiene valores de nómina hardcoded.

Los tests en `backend/tests/test_labor_chile_constants.py` y
`backend/tests/test_payroll_motor_unified.py` importan del canónico para verificar
que los valores sean correctos — esto es el comportamiento correcto.

Los tests en `src/__tests__/chile_constants.test.ts` y
`src/admin/shared/__tests__/ChileLaborConstants.test.ts` tienen valores literales
en los expects (39841.72, 69889, 539000, etc.) — esto es correcto (son tests de
regresión que detectarán si el canónico cambia sin actualizar los tests).

**Observación**: los tests de `ChileLaborConstants.test.ts` no cubren
`IMM.reduced` (372989) ni `IMM.nonRemunerational` (296514) — ambos valores
son stale (ver GAP-5.1). Sin test que los verifique, el stale no se detecta
automáticamente.

**Clasificación**: TEST-STALE (ausencia de test para los campos stale)

---

### Categoría 5: Seeds de base de datos

**Archivo**: `/Users/cristiang./CONNIKU/backend/seed_ceo_profile.py`

Grep sobre el archivo no encontró valores de nómina (AFP, AFC, SIS, UF, UTM, IMM, 539).

**0 gaps detectados** en esta categoría.

---

### Categoría 6: Templates de email

No existe directorio `backend/templates/` ni `backend/emails/`. Los emails se
generan como f-strings en Python directamente en los routes.

Los únicos emails con datos de nómina detectados son los de `tutor_routes.py`
(ya documentados en GAP-2.5).

**0 gaps adicionales** en esta categoría (cubierto en GAP-2.5).

---

### Categoría 7: Plantillas PDF / exportación

`backend/payroll_calculator.py` genera el CSV de Previred y cálculos de nómina.
Este archivo importa correctamente del canónico (confirmado en líneas 40–57).

No se encontraron otros generadores de PDF de nómina (`hr_pdf_routes.py`,
`payroll_pdf.py`) — no existen en el repo.

**0 gaps detectados** en esta categoría.

---

### Categoría 8: Cruce `docs/legal/v3.2/` ↔ constantes

#### GAP-8.1 — `docs/legal/v3.2/terms.md:428`: retención honorarios 13.75% stale

**Archivo**: `/Users/cristiang./CONNIKU/docs/legal/v3.2/terms.md:428`
```markdown
29.4. El tutor es íntegramente responsable del pago de la retención de impuestos
al SII sobre su boleta de honorarios (actualmente 13.75%).
```

El canónico dice 15.25% (2026). La alerta `ALERTA-NOM-5` en `alerts.md` fue marcada
"RESUELTA 2026-04-21" con nota de que el código frontend fue corregido, pero
`docs/legal/v3.2/terms.md` no fue actualizado.

**Evidencia**: `grep -n "13\.75" docs/legal/v3.2/terms.md` → línea 428 confirmada.

**Clasificación**: STALE-DOC (documento legal publicado con valor obsoleto)

**Recomendación**: actualizar `29.4` a `15.25% (según Ley N° 21.133 Art. Transitorio,
vigente desde 2026-01-01)`. Requiere bump de versión del documento y aprobación humana.

---

#### GAP-8.2 — `docs/legal/v3.2/terms.md:10.2`: IVA 19% citado sin número de versión vigente de DL 825

**Archivo**: `/Users/cristiang./CONNIKU/docs/legal/v3.2/terms.md:207`
```markdown
10.2. ... al Impuesto al Valor Agregado con tasa del 19% conforme al Decreto Ley
N° 825 de 1974 sobre Impuesto al Valor Agregado y sus modificaciones.
```

El valor 19% es correcto y está alineado con el canónico. No hay divergencia
numérica. La cita incluye "sus modificaciones" lo que es válido.

**Clasificación**: 0 gaps (solo revisión informativa).

---

#### GAP-8.3 — `privacy.md`: sin valores numéricos de nómina hardcoded

El documento de privacidad en `docs/legal/v3.2/privacy.md` contiene plazos
de retención de datos (5 años, 2 años, 30 días) y no contiene valores de
AFP, AFC, SIS, UF, UTM. Los plazos presentes son de legislación de protección
de datos, no de nómina. Sin gaps de nómina.

**0 gaps detectados** en esta categoría (excepto GAP-8.1).

---

### Categoría 9: Copy/tooltips UI con citas legales hardcoded

#### GAP-9.1 — `src/admin/legal/LegalTab.tsx:487`: RIOHS hardcodea `45 horas` (ilegal post-Ley 21.561)

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/legal/LegalTab.tsx:487`
```html
La jornada ordinaria de trabajo sera de 45 horas semanales (Art. 22 CT)
```

**Clasificación**: BLOQUEA-NÓMINA-REAL
El RIOHS es un documento legal entregado a trabajadores. Citarlo con 45h cuando
la ley establece 44h (escalón 1 vigente desde abril 2024) y 42h (desde
2026-04-26) constituye incumplimiento del Art. 153 del Código del Trabajo
(el RIOHS debe reflejar la jornada legal vigente).

---

#### GAP-9.2 — `src/admin/tools/BibliotecaDocumentos.tsx:588`: RIOHS template con `45 horas semanales`

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/tools/BibliotecaDocumentos.tsx:588`
```html
La jornada ordinaria de trabajo es de hasta 45 horas semanales distribuidas en 5 días,
conforme al artículo 22 del CT.
```

Mismo problema que GAP-9.1. Template de RIOHS generado para los usuarios (CEOs)
con jornada ilegal.

**Clasificación**: BLOQUEA-NÓMINA-REAL

---

#### GAP-9.3 — `src/admin/shared/ercData.ts`: 5 templates de contrato con `45 horas semanales`

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/shared/ercData.ts`
```
Línea 771: La jornada ordinaria sera de 45 horas semanales, ...
Línea 853: La jornada ordinaria sera de 45 horas semanales, ...
Línea 935: La jornada ordinaria sera de 45 horas semanales, ...
Línea 1022: La jornada ordinaria sera de 45 horas semanales, ...
Línea 1104: La jornada ordinaria sera de 45 horas semanales, ...
```

Cinco templates de contratos laborales distintos (perfiles de cargo diferentes)
con jornada de 45 horas. Son contratos que el CEO genera para empleados reales.

**Clasificación**: BLOQUEA-NÓMINA-REAL (contratos laborales reales con jornada ilegal)

---

#### GAP-9.4 — `src/admin/modules/personas/DirectorioPersonal.tsx:39`: label `Jornada Completa (45h)`

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/modules/personas/DirectorioPersonal.tsx:39`
```tsx
{ value: 'full_time', label: 'Jornada Completa (45h)' },
```

La opción de selector de tipo de jornada muestra `(45h)`. Esto es UI informativa
pero podría confundir al usuario CEO.

**Clasificación**: INCONSISTENT-UI

---

#### GAP-9.5 — `src/admin/hr/AsistenciaTab.tsx:1588`: cita directa Art. 22 con 45 horas

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/hr/AsistenciaTab.tsx:1588`
```tsx
Art. 22 inc. 1 CT: La duracion de la jornada ordinaria de trabajo no excedera de 45
horas semanales, distribuidas en no mas de 6 ni menos de 5 dias.
```

Cita legal directa del texto de Art. 22 CT pre-Ley 21.561. El texto está
desactualizado. La Ley 21.561 modificó el Art. 22 reduciendo el límite.

**Clasificación**: INCONSISTENT-UI (cita legal stale, no genera liquidación directa)

---

#### GAP-9.6 — `ChileLaborConstants.ts:34–35`: `IMM.reduced = 372989` y `nonRemunerational = 296514` stale

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/shared/ChileLaborConstants.ts:34–35`
```ts
reduced: 372989,        // 74.60% × $500.000 = $372.989 (IMM 2024, stale)
nonRemunerational: 296514,  // 59.33% × $500.000 = $296.514 (IMM 2024, stale)
```

Con IMM 2026 = $539.000:
- `reduced` correcto = round(539000 × 0.7460) = $402.094
- `nonRemunerational` correcto = round(539000 × 0.5933) = $319.789

Los valores actuales corresponden al IMM $500.000 de 2024. Ya detectado en el
triple-check del legal-docs-keeper. Incluido aquí para inventario completo.

**Clasificación**: BLOQUEA-NÓMINA-REAL
Si algún cálculo de contrato parcial o beneficio usa `IMM.reduced` o
`IMM.nonRemunerational`, estará calculando con base incorrecta ($500.000 en
lugar de $539.000), con diferencia de $39.000 en la base.

---

#### GAP-9.7 — `ChileLaborConstants.ts:28–30`: historial IMM incompleto (faltan 2025-05-01 y 2025-01-01)

**Archivo**: `/Users/cristiang./CONNIKU/src/admin/shared/ChileLaborConstants.ts:25–32`
```ts
history: [
  { from: '2026-01-01', amount: 539000 },
  { from: '2024-07-01', amount: 500000 },  // salta directo de 2024-07 a 2026-01
  { from: '2024-01-01', amount: 460000 },
  ...
]
```

Faltan:
- `{ from: '2025-05-01', amount: 529000 }` (pendiente verificación triple-check)
- `{ from: '2025-01-01', amount: 510000 }` (pendiente verificación triple-check)

Este historial se usa para calcular indemnizaciones proporcionales y
retroactivos con sueldos de períodos anteriores.

**Clasificación**: BLOQUEA-NÓMINA-REAL (afecta cálculo de indemnizaciones retroactivas)

**Nota**: los valores exactos de $529.000 y $510.000 deben ser verificados en
triple-check (el audit del legal-docs-keeper los cita, este inventario los incluye
condicionalmente).

---

### Categoría 10: Scripts de un solo uso

No se encontraron scripts en `scripts/` con valores de nómina hardcoded.
`scripts/verify-chile-constants-sync.sh` importa del canónico — comportamiento correcto.

**0 gaps detectados** en esta categoría.

---

### Categoría 11: Configuración (`.env`, `render.yaml`, `vercel.json`)

Grep sobre `.env.example` no encontró variables de nómina (`AFP_RATE`, `UF_VALUE`, etc.).
El `.env.example` no declara ninguna constante de nómina como variable de entorno —
esto es correcto (las constantes viven en archivos Python/TypeScript, no en env).

**0 gaps detectados** en esta categoría.

---

## 4. Tabla final por criticidad

| ID | Archivo | Valor problemático | Valor canónico | Criticidad |
|---|---|---|---|---|
| GAP-1.1 | `DirectorioPersonal.tsx:73` | `SIS_RATE = 1.49` | `1.54` | BLOQUEA-NÓMINA-REAL |
| GAP-1.1 | `DirectorioPersonal.tsx:70` | AFP Uno commission `0.49%` | `0.46%` | BLOQUEA-NÓMINA-REAL |
| GAP-1.3 | `hr_routes.py:383` | PlanVital employee `0.1116` | `0.1041` (pendiente verificar) | BLOQUEA-NÓMINA-REAL |
| GAP-2.1 | `hr_routes.py:975` | `afc_uf: 122.6` en respuesta API | `135.2` | BLOQUEA-NÓMINA-REAL |
| GAP-2.1 | `hr_routes.py:1017` | fallback `afc_uf: 122.6` | `135.2` | BLOQUEA-NÓMINA-REAL |
| GAP-2.1 | `hr_routes.py:403` | `UF_VALUE_CLP = 38500` | ~40014 (2026-04-22) | BLOQUEA-NÓMINA-REAL |
| GAP-2.1 | `hr_routes.py:408` | `UTM_VALUE_CLP = 67000` | `69889` | BLOQUEA-NÓMINA-REAL |
| GAP-2.4 | `tutor_contract.py:106` | retención `13,75%` | `15.25%` | BLOQUEA-NÓMINA-REAL |
| GAP-2.5 | `tutor_routes.py:2341` | retención `13,75%` email | `15.25%` | BLOQUEA-NÓMINA-REAL |
| GAP-9.1 | `LegalTab.tsx:487` | RIOHS `45 horas` | `44h` (hoy) / `42h` (2026-04-26) | BLOQUEA-NÓMINA-REAL |
| GAP-9.2 | `BibliotecaDocumentos.tsx:588` | RIOHS template `45 horas` | `44h/42h` | BLOQUEA-NÓMINA-REAL |
| GAP-9.3 | `ercData.ts:771,853,935,1022,1104` | 5 contratos `45 horas` | `44h/42h` | BLOQUEA-NÓMINA-REAL |
| GAP-9.6 | `ChileLaborConstants.ts:34–35` | `reduced=372989`, `nonRemunerational=296514` | `~402094`, `~319789` | BLOQUEA-NÓMINA-REAL |
| GAP-9.7 | `ChileLaborConstants.ts:28–30` | historial IMM incompleto | agregar 2025-01 y 2025-05 | BLOQUEA-NÓMINA-REAL |
| GAP-8.1 | `terms.md:428` | tutores retención `13.75%` | `15.25%` | STALE-DOC |
| GAP-2.3 | `chile_tax_routes.py:21` | `IVA_CHILE = 0.19` local | importar canónico | DEAD-CODE |
| GAP-1.2 | `HRDashboard.tsx:191` | `UF.value = 39842` redondeado | `39841.72` | INCONSISTENT-UI |
| GAP-1.4 | `HRDashboard.tsx:1581` | `45 horas` en widget | `44h/42h` | INCONSISTENT-UI |
| GAP-9.4 | `DirectorioPersonal.tsx:39` | label `(45h)` | `(44h)` | INCONSISTENT-UI |
| GAP-9.5 | `AsistenciaTab.tsx:1588` | cita Art. 22 `45 horas` | stale post-Ley 21.561 | INCONSISTENT-UI |
| Cat-4 | `ChileLaborConstants.test.ts` | sin test de `IMM.reduced`/`nonRemunerational` | agregar test | TEST-STALE |

### Conteo por criticidad

| Criticidad | Cantidad |
|---|---|
| BLOQUEA-NÓMINA-REAL | 14 |
| STALE-DOC | 1 |
| INCONSISTENT-UI | 4 |
| TEST-STALE | 1 |
| DEAD-CODE | 1 |
| **TOTAL** | **21** |

---

## 5. Plan de consolidación mínimo

Ordenado por impacto en nóminas reales:

### Prioridad 1 — Corregir antes de cualquier nómina real (bloquea nómina)

**A. `backend/hr_routes.py`** — archivo raíz del problema backend:
1. Importar `UF_ABRIL_2026`, `UTM_ABRIL_2026`, `TOPE_IMPONIBLE_AFC_UF`, `IVA_PCT`
   desde `backend.constants.*`.
2. Reemplazar `UF_VALUE_CLP = 38500.0` por `UF_VALUE_CLP = float(UF_ABRIL_2026)`.
3. Reemplazar `UTM_VALUE_CLP = 67000.0` por `UTM_VALUE_CLP = float(UTM_ABRIL_2026)`.
4. Corregir `afc_uf: 122.6` → `float(TOPE_IMPONIBLE_AFC_UF)` en líneas 975 y 1017.
5. Verificar y unificar `AFP_RATES.planvital` contra `payroll_calculator.py`.

**B. `src/admin/modules/personas/DirectorioPersonal.tsx`** — componente con motor propio:
1. Importar `CHILE_LABOR` desde `ChileLaborConstants.ts`.
2. Reemplazar `SIS_RATE = 1.49` → `CHILE_LABOR.SIS.rate * 100`.
3. Reemplazar `AFP_RATES` local → usar `AFP_OPTIONS` de `src/admin/shared/constants.ts`.
4. Reemplazar `AFC_WORKER`, `AFC_EMPLOYER_INDEFINIDO`, `AFC_EMPLOYER_PLAZO_FIJO`
   → usar `CHILE_LABOR.AFC.*`.
5. Eliminar el bloque local de constantes.

**C. `backend/tutor_contract.py` y `backend/tutor_routes.py`** — contratos y emails tutores:
1. Importar `RETENCION_HONORARIOS_2026_PCT` desde `backend.constants.tax_chile`.
2. Reemplazar `13,75%` hardcoded por f-string con el valor de la constante.

### Prioridad 2 — Corregir en bloque nomina-chile-v1 (próximo sprint)

**D. `src/admin/shared/ChileLaborConstants.ts`**:
1. Actualizar `IMM.reduced` → `round(539000 * 0.7460)` o importar constante.
2. Actualizar `IMM.nonRemunerational` → `round(539000 * 0.5933)` o importar constante.
3. Agregar al `IMM.history` los hitos 2025-01-01 ($510.000 pendiente verificar) y
   2025-05-01 ($529.000 pendiente verificar).
4. Agregar tests en `ChileLaborConstants.test.ts` para `IMM.reduced` y
   `IMM.nonRemunerational`.

**E. Jornada 45h → 44h/42h en plantillas de contratos y RIOHS**:
1. `ercData.ts`: reemplazar `45 horas semanales` por valor dinámico basado en fecha.
2. `LegalTab.tsx`: actualizar texto RIOHS con jornada legal vigente.
3. `BibliotecaDocumentos.tsx`: actualizar template RIOHS.
4. `DirectorioPersonal.tsx:39`: cambiar label `(45h)` a `(44h)`.
5. `HRDashboard.tsx:1581`: cambiar valor estático `45 horas` a dinámico.
6. `AsistenciaTab.tsx:1588`: actualizar cita del Art. 22 al texto vigente post-Ley 21.561.

### Prioridad 3 — Deuda técnica menor

**F. `src/pages/HRDashboard.tsx:191`**: reemplazar `value: 39842` por
`value: UF_ABRIL_2026` importado.

**G. `backend/chile_tax_routes.py:21`**: importar `IVA_PCT` desde canónico,
eliminar `IVA_CHILE = 0.19`.

**H. `docs/legal/v3.2/terms.md:428`**: actualizar Art. 29.4 a 15.25%.
Requiere aprobación humana + bump de versión del documento.

---

## 6. Lo que no hice y por qué

- No verifiqué en vivo las tasas de AFP en spensiones.cl (sin acceso a internet).
  La divergencia de PlanVital (11.16% vs 10.41%) queda como "pendiente verificar
  en spensiones.cl antes de corregir" — podría ser que `hr_routes.py` tenga la
  tasa correcta si hubo actualización reciente.
- No leí el archivo `HRDashboard.tsx` completo (es muy extenso, >9000 líneas).
  Los hallazgos se basan en búsquedas Grep + lecturas selectivas.
- No auditué el módulo de Finiquitos (lógica de cálculo con `90 UF`) — los topes
  de indemnización se usan en `FiniquitosTab.tsx`, `PersonasHub.tsx`, y
  `HRDashboard.tsx`. Usan `CHILE_LABOR.UF.value * 90`, que sí usa el canónico
  indirectamente. No hay gap allí mientras `UF.value` se actualice en runtime.

---

## 7. Incertidumbres

1. **PlanVital**: la divergencia entre `hr_routes.py:0.1116` y
   `payroll_calculator.py:0.1041` podría ser que uno esté correcto y el otro stale.
   Sin verificación en spensiones.cl no es posible clasificar cuál es el correcto.
   Si `hr_routes.py` es el correcto, `payroll_calculator.py` es quien está mal.

2. **Tope AFP 81.6 UF**: el triple-check del legal-docs-keeper indica que debería
   ser 90.0 UF. Este inventario no lo eleva como gap de nómina real porque la
   Superintendencia de Pensiones podría haber actualizado el tope después de la
   fecha de acceso del triple-check. Requiere triple-check actualizado con acceso
   real a spensiones.cl.

3. **IMM historial 2025**: los valores $510.000 (2025-01) y $529.000 (2025-05)
   provienen del triple-check, no de fuentes verificadas en esta sesión.
   Si son incorrectos, GAP-9.7 tiene distinta magnitud.

4. **Alcance del impacto del afc_uf: 122.6 en hr_routes.py**: el endpoint
   `/api/indicators` es consultado por el frontend para inicializar `CHILE_LABOR`.
   Si ese endpoint retorna `afc_uf: 122.6`, la UI calcula el tope AFC como
   122.6 × UF en lugar de 135.2 × UF — diferencia de ~$499.000 en el tope.
   Sin embargo, si el frontend sobreescribe con los valores del endpoint real
   (cuando la API externa funciona), el impacto del fallback es solo en modo
   degradado. La criticidad real depende de qué tan frecuente es la caída de
   la API externa.

---

*Este análisis no constituye asesoría legal profesional y requiere validación de
abogado antes de su aplicación al producto en producción.*
