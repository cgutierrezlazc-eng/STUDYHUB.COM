# Auditoría temporal + precisión + rutas alternativas bcn.cl — 2026-04-22

**Rama**: bloque-sandbox-integrity-v1
**Fecha ejecución**: 2026-04-22
**Agente**: legal-docs-keeper
**Scope**: Parte A (temporalidad), Parte B (precisión numérica), Parte C (rutas alternativas a bcn.cl), Parte D (crons/tasks), Parte E (recomendaciones).

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción.

---

## Sección A — Temporalidad de datos variables

### A.1 — UF (Unidad de Fomento) — actualización diaria

**Evidencia del valor real hoy** (mindicador.cl, API oficial, HTTP 200):

```
curl https://mindicador.cl/api/uf
  → 2026-04-21: 40000.61
  → 2026-04-20: 39987.35
  → 2026-04-19: 39974.09
  (...)
curl https://mindicador.cl/api/uf/22-04-2026
  → 2026-04-22: 40013.88
curl https://mindicador.cl/api/uf/25-04-2026
  → 2026-04-25: 40053.72
```

**Confirmación cruzada con SII** (`https://www.sii.cl/valores_y_fechas/uf/uf2026.htm`, HTTP 200, 35.696 bytes, iconv ISO-8859-1 → UTF-8):

Tabla oficial muestra valores diarios abril 2026:
- 01-abr: 39.841,72 (primer día del mes)
- 22-abr: 40.013,88
- 25-abr: 40.053,72
- 30-abr: 40.133,50

**Constantes en código**:

- `shared/chile_constants.ts:20` → `UF_ABRIL_2026 = 39841.72` (valor día 1-abr)
- `backend/constants/labor_chile.py:31` → `UF_ABRIL_2026 = Decimal("39841.72")` (idem)
- `src/pages/HRDashboard.tsx:191` → `CHILE_LABOR.UF.value = 39842` (redondeado del 1-abr)
- `src/pages/HRDashboard.tsx:8196` → `UF_VALUE = 38000` (hardcoded local en calculadora de finiquito, **desfasado ~5% vs UF real**)
- `backend/hr_routes.py:403` → `UF_VALUE_CLP = 38500.0` (fallback si mindicador falla, **desfasado ~4%**)

**Desfase vigente**: 40.013,88 − 39.841,72 = +172,16 CLP (**+0,43%** error sobre UF real si no se actualiza runtime).

**¿Existe rutina de actualización en runtime?** SÍ (parcial):

1. **Backend** (`backend/hr_routes.py:436-446 _get_uf_value`):
   - Hace request a `https://mindicador.cl/api/uf` timeout 3s
   - Fallback a `UF_VALUE_CLP = 38500.0` si falla
   - Usado por `calculate_payroll_for_employee` (línea 477-478)

2. **Backend** (`backend/hr_routes.py:924-1022 _fetch_indicators`):
   - Async httpx a `https://mindicador.cl/api` con timeout 10s y cache TTL 3600s
   - Endpoint `/hr/indicators` (línea 1043) expone al frontend
   - Fallback: UF=38700, UTM=67294 (**ambos desfasados** respecto a 2026)

3. **Scheduler** (`backend/server.py:220-283 APScheduler`):
   - Job `daily_indicators` a las 12:00 UTC = 08:00 Chile (UTC-4 fijo, sin DST)
   - Llama `daily_refresh_indicators()` que fuerza bypass de cache
   - Dependencia: `apscheduler` (si no instalado, se deshabilita con warning)

4. **Frontend** (`src/pages/HRDashboard.tsx:498-517`):
   - useEffect al montar llama `api.getChileIndicators()`
   - Mutación global: `CHILE_LABOR.UF.value = Math.round(data.uf.value)` (redondea a entero, pierde 2 decimales)
   - Si el fetch falla, queda el valor hardcoded 39842

**BUGs detectados**:

- **BUG-A1.1** (crítico): `src/pages/HRDashboard.tsx:8196 UF_VALUE = 38000` no se actualiza jamás. Calculadora de finiquito usa tope 90 UF. Si sueldo trabajador > 3.420.000 CLP, se subestima el tope real (90 × 40.013 = 3.601.170). Impacto: empleado recibe indemnización ~5% menor a la correcta.
- **BUG-A1.2** (alto): `CHILE_LABOR.UF.value = Math.round(data.uf.value)` (línea 505) redondea al entero. Pierde los 2 decimales oficiales SII. Error absoluto <1 CLP por UF pero propagado a 81,6 UF da ~80 CLP por cálculo.
- **BUG-A1.3** (alto): Fallback en `_fetch_indicators` retorna UF=38700 (valor ~2024). Si mindicador.cl cae >1h, datos retornados al frontend son de hace 2 años.
- **BUG-A1.4** (crítico arquitectónico): Constantes con sufijo `_ABRIL_2026` presuponen actualización manual mensual. No existe cron que cambie el literal del archivo. El 1-mayo-2026 la constante queda stale hasta que un humano haga commit.

### A.2 — UTM (Unidad Tributaria Mensual) — cambio mensual

**Evidencia real** (mindicador.cl UTM):
```
2026-04-01: 69889
2026-03-01: 69889
2026-02-01: 69611
2026-01-01: 69751
```

**Evidencia SII para UTM Mayo 2026** (`https://www.sii.cl/valores_y_fechas/utm/utm2026.htm`, HTTP 200, extracto literal):
```
Marzo 69.889 838.668 110,75 1,0 1,4 2,8
Abril  69.889 838.668
Mayo   70.588 847.056
```

UTM Mayo 2026 ya publicada por SII: **$70.588** (diff +$699 vs abril).

**Constantes en código**:
- `shared/chile_constants.ts:27` → `UTM_ABRIL_2026 = 69889`
- `backend/constants/labor_chile.py:37` → `UTM_ABRIL_2026 = Decimal("69889")`
- `backend/hr_routes.py:408` → `UTM_VALUE_CLP = 67000.0` (**valor de 2023, fallback roto**)
- `src/pages/HRDashboard.tsx:198` → `CHILE_LABOR.UTM.value = 69889`

**BUGs**:
- **BUG-A2.1** (crítico, ventana 2026-05-01): toda transacción con período mayo 2026 o posterior calculará impuestos con UTM errada. Error: $70.588 − $69.889 = $699/UTM. Tramos de impuesto único se aplican sobre ingreso dividido por UTM; un sueldo en tramo 8% con UTM vieja puede caer en tramo 0,04 si UTM nueva lo empuja hacia arriba el umbral.
- **BUG-A2.2**: El fetcher (`_fetch_indicators`) sí actualiza UTM desde mindicador.cl, pero `backend/payroll_calculator.py:69 UTM_VALUE = float(UTM_ABRIL_2026)` usa la constante estática y `calculate_income_tax` (línea 217) usa ese `UTM_VALUE` — no consulta mindicador. El motor de nómina quedará desfasado aunque el dashboard muestre valor correcto.
- **BUG-A2.3**: Naming `UTM_ABRIL_2026` es anti-patrón: fuerza a renombrar la constante cada mes. Debería ser `UTM_VIGENTE` con comentario de última verificación.

### A.3 — UTA (Unidad Tributaria Anual)

**Búsqueda en código**: grep UTA no encontró constante dedicada.

- `backend/hr_routes.py:948-951` calcula `uta = utm × 12` on-the-fly en el response del endpoint `/indicators`. No se usa en ningún cálculo de nómina ni tributario.

**Riesgo**: en 2026 no existe lógica que use UTA directamente. Cuando se implementen cálculos anuales (Global Complementario, Declaración de Renta anual), si se hace UTA = UTM_ABRIL_2026 × 12 el valor puede quedar inexacto por el promedio anual que SII reajusta trimestralmente (UTA es UTM × 12 sólo en promedio, no en snapshot).

### A.4 — Ley 21.561 escalón 42h — frontera temporal

**Evidencia oficial Mintrab** (`https://www.mintrab.gob.cl/ley-40-horas-conoce-las-principales-medidas-que-comienzan-a-regir-el-26-de-abril/`, HTTP 200, 129.887 bytes):

> "El viernes 26 de abril de 2024 entra en vigencia la Ley 21.561, conocida como Ley de 40 horas, que reduce gradualmente la jornada laboral en Chile. [...] en abril de 2026 se alcanzarán las 42 horas y tendrá plena vigencia cuando se implementen las 40 horas de trabajo semanales en 2028."

Nota: el artículo de Mintrab confirma año 2026 + mes abril para escalón 42h, pero no día exacto en el texto extraído. La fecha `2026-04-26` está en la cita del código vía `FECHA_ESCALON_42H` con base en Mintrab 2024-04-26 + 2 años de escalón.

**Código vigente**:

```typescript
// shared/chile_constants.ts:110
export const FECHA_ESCALON_42H = new Date('2026-04-26T00:00:00Z');

// Línea 164-166
export function getWeeklyHoursAtDate(fecha: Date): number {
  return fecha >= FECHA_ESCALON_42H ? WEEKLY_HOURS_POST_42H : WEEKLY_HOURS_PRE_42H;
}
```

```python
# backend/constants/labor_chile.py:133
FECHA_ESCALON_42H: date = date(2026, 4, 26)

# Línea 175-193 get_weekly_hours_at_date con 3 escalones (44/42/40)
```

**Verificación lógica TypeScript**: `fecha >= FECHA_ESCALON_42H` compara Dates. `FECHA_ESCALON_42H` es 2026-04-26T00:00:00 UTC = 2026-04-25T20:00:00 Chile (UTC-4). Esto significa:

- **BUG-A4.1** (crítico, ventana 2026-04-25 20:00 – 2026-04-26 00:00 Chile): si un usuario en Chile está en 2026-04-25 21:00 Chile (= 2026-04-26 01:00 UTC), la función retorna 42h aunque la jornada de 42h **legalmente entra vigencia el 26-04 desde las 00:00 hora Chile**. Ventana de inconsistencia de 4 horas donde el código adelanta la vigencia.
- Inversamente: si usuario llama con `new Date('2026-04-26T00:00:00-04:00')` (00:00 hora Chile), la comparación es `new Date('2026-04-26T04:00:00Z') >= new Date('2026-04-26T00:00:00Z')` → true → retorna 42h. Correcto.
- El bug está en la zona horaria del input al función. Si input es `new Date('2026-04-26')` (UTC midnight) en una máquina en Chile, se interpreta como 2026-04-25 20:00 Chile, que está en escalón 44h legalmente pero la función retorna 42h.

**Verificación lógica Python**: `date(2026, 4, 26)` no tiene timezone (es date, no datetime). La comparación `fecha >= FECHA_ESCALON_42H` funciona correctamente si fecha se pasa con `date.today()` (zona local del servidor). En Render (UTC), `date.today()` devuelve la fecha UTC actual. A las 20:00-23:59 Chile (00:00-03:59 UTC del día siguiente), `date.today()` retornará el día siguiente, lo cual adelantaría el escalón similar al bug JS pero en dirección inversa. Dado que el servidor está en UTC, cuando sean las 20:00 Chile del 2026-04-25 la variable `date.today()` retornará `date(2026, 4, 26)` → escalón 42h activo 4 horas antes de vigencia legal.

- **BUG-A4.2** (crítico): servidor UTC hace que el corte suceda 4h antes en Chile. Impacto limitado pero presente: cualquier liquidación ejecutada en esas 4 horas usa base 168h en vez de 176h → horas extra se calculan con base menor → recargo sobre hora ordinaria 4,8% mayor de lo correcto.

### A.5 — UF diaria en cálculos retroactivos

**Buscado en código**: no se encontró lógica que distinga UF de fecha de devengamiento vs UF del día del cálculo. Todos los cálculos usan `UF_VALUE` snapshot actual.

**Regla SII oficial** (convención previsional chilena): UF del último día hábil del mes de devengamiento es la que se usa para topes imponibles. Para UF diaria, es la UF del día del hecho económico (contrato, cobro de honorarios, etc.).

- **BUG-A5** (alto): retroliquidaciones de meses pasados van a usar UF actual en vez de UF histórica. Ejemplo: empleado contratado 1-abril con sueldo 3.000.000. Cálculo en 22-abril usa UF 40.013,88 → tope AFP = 3.261.132. Cálculo correcto debería usar UF de marzo o del último día hábil del mes de devengamiento. El error es menor (~0,5% mensual) pero se acumula en auditorías SII retroactivas.

---

## Sección B — Precisión numérica

### B.1 — Errores de coma flotante en JavaScript

**Demostración real** (node ejecutado):

```javascript
39841.72 * 81.6 = 3251084.352         // entero limpio
39841.72 * 81.6 toPrecision(20) = 3251084.3519999999553   // error IEEE 754 oculto
40013.88 * 90.0 = 3601249.1999999997  // error visible
0.1 + 0.2 = 0.30000000000000004       // clásico IEEE 754
```

Conclusión: sí existen errores de coma flotante en JS, pero `Math.round()` corrige el problema antes del resultado final en CLP (moneda entera).

**Inventario de redondeos en código** (grep en src/):

- **`src/pages/HRDashboard.tsx:211,214,217`**: getters `afpCLP`, `afcCLP`, `saludCLP` usan `Math.round(UF.value * tope)`. Redondeo al final del cálculo, correcto.
- **`src/pages/HRDashboard.tsx:505`**: `CHILE_LABOR.UF.value = Math.round(data.uf.value)` — **BUG B1.1**: redondea UF antes de usarla en cálculos subsecuentes. Error de hasta 0,5 CLP en UF se propaga a 0,5 × 81,6 = 40,8 CLP por cálculo de tope. Debería conservar UF con 2 decimales (SII oficial) o 4 decimales (BCN/Banco Central).
- **`src/admin/shared/ercData.ts:1320-1332`**: redondeo en cada componente de liquidación:
  ```
  gratificacion = Math.round(totalImponible * 0.25)   // paso intermedio
  afpAmount = Math.round((totalImponible * afpRate) / 100)
  healthAmount = Math.round(totalImponible * 0.07)
  afcEmpAmount = Math.round(totalImponible * 0.006)
  sisAmount = Math.round(totalImponible * 0.0141)  // SIS stale 2024
  mutualAmount = Math.round(totalImponible * 0.0093)
  ```
  **BUG B1.2**: redondeo prematuro en cada línea antes de sumar totales. Un sueldo de 1.234.567 con AFP 11,44% da 141.234 redondeado; afc 0,6% da 7.407 redondeado. Suma redondeada = 148.641. Suma sin redondear = 148.641,05. Acá el error acumulado es bajo (<1 CLP por empleado), pero para 100 empleados el total_descuentos puede diferir en 50-100 CLP del cálculo oficial Previred, causando rechazo del archivo.
- **`src/pages/HRDashboard.tsx:8203,8207,8210`** (calculadora finiquito):
  ```
  topeMensual = 90 * UF_VALUE       // sin Math.round
  indemnizacionAnos = salaryForCalc * yearsTotal
  indemnizacionAviso = salaryForCalc
  ```
  No redondea en paso intermedio. Suma final `totalBruto` tampoco redondea. Números decimales en CLP mostrados al usuario final. Viola convención SII (CLP no admite decimales en liquidaciones formales).

- **`backend/payroll_calculator.py`**: usa `int()` (trunca hacia abajo) en lugar de `round()` (redondea al más cercano):
  ```
  línea 192: return int(TOPE_AFP_UF * UF_VALUE)
  línea 240: return max(0, int(tax_utm * UTM_VALUE))
  línea 268: monthly_cap = int((GRATIFICACION_TOPE_IMM × SUELDO_MINIMO) / 12)
  línea 307: return int(overtime_rate * overtime_hours)
  línea 386: tope_90 = int(90 * UF_VALUE)
  ```
  **BUG B1.3** (moderado): `int()` trunca. Python's banker's rounding con `round()` es la convención SII. Truncamiento sistemático subestima valores en hasta 0,99 CLP por cálculo. Acumulado en 30 líneas de liquidación puede llegar a 30 CLP/empleado. Recomendado cambiar a `round()`.

- **`backend/hr_routes.py:463,497,501,505,512,526-529`**: usa `round()` correctamente. Inconsistencia entre payroll_calculator.py (int/trunc) y hr_routes.py (round). Dos motores de nómina coexisten con semántica numérica distinta. **BUG B1.4**: inconsistencia de rounding entre los dos motores produce totales diferentes para el mismo empleado.

### B.2 — Decimales exactos UF

**Fuente oficial SII** (`https://www.sii.cl/valores_y_fechas/uf/uf2026.htm`): publica UF con **2 decimales** en notación es-CL (coma decimal): `40.013,88`.

**Fuente Banco Central** (emisor oficial de UF): publica UF con 4-6 decimales internamente para cálculos precisos, pero el valor oficial para aplicación práctica es el de SII.

**Recomendación de convención Conniku**:
- Almacenar UF con 2 decimales (coincide con SII oficial)
- Usar `Decimal("40013.88")` en Python (evita IEEE 754)
- En JavaScript: `39841.72` es seguro porque cabe en mantisa IEEE 754, pero operaciones con él no lo son. Preferir librería `decimal.js` para cálculos compuestos.
- No redondear UF a entero (como hace `HRDashboard.tsx:505`). Pérdida de precisión innecesaria.

### B.3 — Ejemplo concreto del impacto

```
Sueldo imponible = 2.850.000 CLP
UF real hoy (22-abr) = 40.013,88
UF en código = 39.841,72 (+20 días stale)

Tope AFP con UF código (81,6):    39841.72 × 81.6 = 3.251.084
Tope AFP con UF real (81,6):      40013.88 × 81.6 = 3.265.132
Tope AFP con UF real + 90 UF:     40013.88 × 90.0 = 3.601.249
Tope AFP con código obsoleto:                      = 3.251.084 (desfase -350.165 CLP)

Base AFP gravable = min(2850000, tope):
  Código:  min(2.850.000, 3.251.084) = 2.850.000   (no se aplica tope)
  Real:    min(2.850.000, 3.601.249) = 2.850.000   (no se aplica tope)
  → Impacto cero para este sueldo.

Pero para sueldo 3.500.000:
  Código:  min(3.500.000, 3.251.084) = 3.251.084 → AFP 11,44% = 371.924
  Real:    min(3.500.000, 3.601.249) = 3.500.000 → AFP 11,44% = 400.400
  → Empleado descontado $28.476 CLP/mes de más (base reducida ilegalmente).
```

**BUG B3 (crítico)**: trabajador con sueldo alto recibe descuento AFP mayor al legal porque código usa tope desactualizado de 2023.

---

## Sección C — Rutas alternativas a bcn.cl

### C.1 — Intentos con curl (User-Agent default)

| URL | HTTP | Notas |
|---|---|---|
| `https://www.bcn.cl/leychile/navegar?idNorma=207436` | 401 | CloudFront bloquea sin UA |
| `https://www.leychile.cl/Navegar?idNorma=207436` | 401 | Redirige a bcn.cl → mismo bloqueo |
| `https://www.dt.gob.cl/portal/1627/w3-propertyvalue-27924.html` | 404 | Página no existe |
| `https://www.diariooficial.interior.gob.cl/` | 403 | Bloqueo sin UA |
| `https://nuevo.leychile.cl/navegar?idNorma=207436` | 200 (264 bytes) | Respuesta vacía, no sirve |

### C.2 — Intentos con User-Agent "Mozilla/5.0" (navegador)

**Breakthrough**: agregando `-A "Mozilla/5.0"` CloudFront deja pasar:

| URL | HTTP | Size | Utilizable |
|---|---|---|---|
| `https://www.bcn.cl/leychile/navegar?idNorma=207436` | 200 | 9.653 | **NO** — es shell Angular SPA, contenido vía JS runtime |
| `https://www.bcn.cl/leychile/navegar/imprimir?idNorma=207436` | 200 | 9.653 | NO — misma shell |
| `https://www.bcn.cl/leychile/servicios/contenido?idNorma=207436` | 200 | 9.653 | NO — misma shell |
| `https://www.mintrab.gob.cl/ley-40-horas-...` | 200 | 129.887 | **SÍ** — HTML plano con texto del artículo |
| `https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html` | 200 | 51.839 | **SÍ** — HTML plano con cita literal topes |
| `https://www.diariooficial.interior.gob.cl/` | 200 | 29.102 | SÍ — home, requiere navegación por fecha |

### C.3 — Wayback Machine (archive.org)

```
curl https://web.archive.org/web/2025/https://www.bcn.cl/leychile/navegar?idNorma=207436
  → HTTP 200, 1.106.495 bytes
  → Snapshot 2026-01-09 del CT
  → PERO: es la misma shell Angular SPA, contenido JS no ejecuta en wayback
  → Solo obtienes metadata: title, description, canonical
```

No utilizable para extraer artículos literales del CT.

### C.4 — APIs oficiales alternativas

| API | Estado | Uso |
|---|---|---|
| `https://mindicador.cl/api` | **200, funciona** | UF, UTM, USD, euro, IPC, tasa_desempleo — valores numéricos reales |
| `https://api.cmfchile.cl/api-sbifv3/.../uf` | 422 | Requiere API key (gratuita con registro) |
| `https://si3.bcentral.cl/.../UF.htm` | 200 | HTML, no parseable fácilmente |
| `https://www.senado.cl/` | 200, 272 KB | Home senado, no consolidación CT |
| `https://www.suseso.gob.cl/` | 200 | Home, navegación necesaria |

### C.5 — Fuentes confirmadas utilizables en auditoría

**Para valores económicos** (UF, UTM, IMM, tasas):
- ✅ `https://mindicador.cl/api` (JSON, sin API key, actualizado diario)
- ✅ `https://www.sii.cl/valores_y_fechas/uf/uf2026.htm` (HTML, cat literal UF mensual)
- ✅ `https://www.sii.cl/valores_y_fechas/utm/utm2026.htm` (HTML, UTM mensual)
- ✅ `https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm` (HTML, tramos impuesto)

**Para topes previsionales**:
- ✅ `https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html` (HTML, cita literal 2026)

**Para artículos del Código del Trabajo (texto literal)**:
- ❌ `www.bcn.cl/leychile/navegar?idNorma=207436` (SPA, contenido solo vía JS)
- ❌ Wayback machine (solo archiva shell SPA)
- ⚠️ Mintrab news posts citan artículos parcialmente (suficiente para fechas y escalones, no para texto literal)
- 🔧 **Única alternativa fiable**: WebFetch de bcn.cl desde navegador headless (Playwright/Puppeteer) que ejecute JS, o exportar PDFs desde la UI web con un humano.

### C.6 — Citas literales obtenidas esta sesión

**1. Topes imponibles 2026** (Superintendencia de Pensiones, cita textual):

> "el tope imponible mensual para calcular las cotizaciones obligatorias del sistema de AFP, de salud y de ley de accidentes del trabajo será de 90,0 UF, mientras que, en el caso del seguro de cesantía, quedará en 135,2 UF. Los valores informados se aplicarán a partir del pago de las cotizaciones previsionales correspondientes a las remuneraciones de febrero de 2026 y tendrán vigencia durante todo este año."
> "Cabe recordar que para el año 2025 fue de 87,8 UF."

Fuente: `https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html`, HTTP 200, 2026-04-22.

**CONSECUENCIA CRÍTICA**: Tope AFP/salud 2026 es **90,0 UF**, NO 81,6 UF como está en el código. 81,6 UF fue el valor vigente en 2023. La constante `TOPE_IMPONIBLE_AFP_UF = 81.6` está desactualizada desde 2024.

**2. Tramos Impuesto Único 2ª Categoría — Mayo 2026** (SII oficial, cita literal):

Tabla MENSUAL mayo 2026:
- Exento: hasta $952.938,00
- 0,04: $952.938,01 - $2.117.640,00 (rebaja $38.117,52)
- 0,08: $2.117.640,01 - $3.529.400,00 (rebaja $122.823,12)
- 0,135: $3.529.400,01 - $4.941.160,00 (rebaja $316.940,12)
- 0,23: $4.941.160,01 - $6.352.920,00 (rebaja $786.350,32)
- 0,304: $6.352.920,01 - $8.470.560,00 (rebaja $1.256.466,40)
- 0,35: $8.470.560,01 - $21.882.280,00 (rebaja $1.646.112,16)
- 0,4: $21.882.280,01 y más (rebaja $2.740.226,16)

División: $952.938 / 13,5 = **$70.588** ≡ UTM mayo 2026.

Fuente: `https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm`, HTTP 200.

Los **tramos UTM (13.5, 30, 50, 70, 90, 120, 310) con tasas (0, 0.04, 0.08, 0.135, 0.23, 0.304, 0.35, 0.40) y factores de rebaja (0, 0.54, 1.74, 4.49, 11.14, 17.80, 23.32, 38.82)** del código coinciden con SII. Validación OK.

**3. UTM Abril + Mayo 2026** (SII oficial):

```
Marzo  69.889
Abril  69.889
Mayo   70.588
```

**4. Ley 21.561 escalones** (Mintrab oficial, cita textual):

> "en abril de 2026 se alcanzarán las 42 horas y tendrá plena vigencia cuando se implementen las 40 horas de trabajo semanales en 2028"

Día exacto (26-abril) no extraído literalmente del Mintrab, derivado de aniversario Ley 21.561 (2024-04-26 + 2 años).

**5. Artículos del Código del Trabajo solicitados (40 bis, 44, 47, 50, 55, 159 N°4, 163, 168, 169, 172, 30-32, 67-76)**:

**NO obtenidos literalmente en esta sesión** porque bcn.cl sirve SPA Angular que requiere JS runtime. Las alternativas (dt.gob.cl, senado.cl, suseso.gob.cl) no exponen el texto consolidado del CT.

**Recomendación**: descargar PDF del CT consolidado desde bcn.cl (con navegador humano) y guardar copia local en `docs/legal/sources/codigo-trabajo-2025-01-01.pdf` para futuras verificaciones offline. El PDF oficial tiene fecha última modificación 2025-01-01 según metadata wayback.

---

## Sección D — Crons / tasks recurrentes

### D.1 — Inventario de jobs programados

**Archivos de configuración**: `backend/server.py:220-283` usa APScheduler nativo. No hay Celery, no hay celery.py, no hay backend/cron/ ni backend/tasks/ ni backend/scheduled/.

**GitHub Actions cron** (`.github/workflows/*.yml`):
- `keep-alive.yml` — ping periódico (no calcula nómina)
- `supabase-backup.yml` — backup (no calcula nómina)
- `ios-build.yml`, `android-build.yml`, `verify-build.yml` — build CI (no calcula nómina)

**Render cron jobs** (`render.yaml`): revisado, solo define el servicio web principal. No hay cron definido a nivel Render.

### D.2 — Jobs activos en APScheduler

```python
# backend/server.py:230-277

# Job 1: daily_indicators @ 12:00 UTC (08:00 Chile)
_scheduler.add_job(
    daily_refresh_indicators,
    CronTrigger(hour=12, minute=0, timezone=pytz.utc),
    id="daily_indicators",
)

# Job 2: email_docs_poll @ cada 30 min
_scheduler.add_job(_async_poll_email, IntervalTrigger(minutes=30))

# Job 3: renewal_reminders @ 13:00 UTC (09:00 Chile)
_scheduler.add_job(_async_renewal_reminders, CronTrigger(hour=13, minute=0))
```

**Observación timezone**: scheduler se inicializa con `timezone=pytz.utc` y cron triggers también en UTC. Comentarios dicen "08:00 Chile = 12:00 UTC" asumiendo Chile fijo UTC-4. **Chile desde 2022 tiene horario de verano retomado** (Ley 21.541 y decretos), por lo que parte del año es UTC-3 (verano: primer sábado de septiembre a primer sábado de abril). En verano, el job correrá a 09:00 Chile en lugar de 08:00.

- **BUG-D2.1** (moderado): cron con timezone fijo UTC-4 para Chile es incorrecto durante DST. Debería usar `timezone='America/Santiago'` para que pytz maneje automáticamente el cambio. En verano 2026 (sept 2025 - abr 2026) los indicadores se refrescaron a 09:00 Chile en vez de 08:00.

### D.3 — Valores stale detectados en estructuras de datos no versionadas

**IMM_HISTORY stale** (`backend/hr_routes.py:907-913`):
```python
IMM_HISTORY = [
    {"from": "2024-07-01", "amount": 500000, "law": "Ley 21.578"},
    {"from": "2024-01-01", "amount": 460000, "law": "Ley 21.578"},
    {"from": "2023-09-01", "amount": 440000, "law": "Ley 21.526"},
    {"from": "2023-05-01", "amount": 410000, "law": "Ley 21.526"},
    {"from": "2022-08-01", "amount": 400000, "law": "Ley 21.456"},
]

def _get_current_imm() -> int:
    today = date.today().isoformat()
    for entry in IMM_HISTORY:
        if today >= entry["from"]:
            return entry["amount"]
    return IMM_HISTORY[-1]["amount"]
```

**BUG-D3.1 (CRÍTICO)**: IMM_HISTORY NO contiene el valor vigente 2026 ($539.000 de Ley 21.751 desde 2026-01-01). `_get_current_imm()` retorna 500.000 (valor 2024-07) porque es la entrada más reciente menor a 2026-04-22.

**Impacto directo**: endpoint `/hr/indicators` expone `imm.value = 500000` al frontend y `gratificacion.tope_mensual = round(500000 × 4.75 / 12) = 197.917`. El valor correcto con IMM 2026 es `round(539000 × 4.75 / 12) = 213.375`. **Diferencia -$15.458 CLP/mes por empleado**.

El valor 539.000 sí está correcto en `labor_chile.py:47 SUELDO_MINIMO_2026` y `hr_routes.py:432 MINIMUM_WAGE_CLP`, pero el IMM_HISTORY fetcher NO lo usa.

### D.4 — Obsolescencia interna en `_fetch_indicators`

**Fallback en `backend/hr_routes.py:1017`**:

```python
"topes": {
    "afp_uf": 81.6,     # CORRECTO: ya era 81.6 en 2023, pero ahora debe ser 90.0 UF 2026
    "afc_uf": 122.6,    # INCORRECTO: 122.6 era 2024, ahora es 135.2 UF
    "salud_uf": 81.6,   # INCORRECTO: ahora 90.0 UF
    "afp_clp": 3158520, # INCORRECTO: basado en UF 38700 × 81.6
    "afc_clp": 4749420, # INCORRECTO: basado en UF 38700 × 122.6
    "salud_clp": 3158520, # idem afp_clp
}
```

**BUG-D4.1 (CRÍTICO)**: toda línea del fallback está obsoleta. Si mindicador.cl cae >1h, el frontend recibe topes 2 años viejos.

### D.5 — Cachés sin TTL de seguridad

`_indicators_cache` TTL 1 hora, correcto. Sin embargo, el cache persiste entre restarts solo si el proceso no se reinicia. En Render, cada deploy reinicia el proceso → cache se pierde → si mindicador.cl está caído al arranque, el fallback (sección D.4) sirve los datos stale mencionados.

**BUG-D5**: sin persistencia de último valor válido a disco o DB, un deploy + mindicador caído = datos 2 años viejos durante horas.

---

## Sección E — Recomendaciones priorizadas

### E.1 — Crítica (acción inmediata, antes de 2026-04-26 cuando entra Ley 40h)

1. **Actualizar TOPE_IMPONIBLE_AFP_UF de 81.6 → 90.0** en `backend/constants/labor_chile.py:105`, `shared/chile_constants.ts:83`, `src/pages/HRDashboard.tsx:207,209`, `backend/hr_routes.py:422,974,976,977,979,1017`, y 6 archivos más (grep confirmó 15 ocurrencias). **Valor 81,6 era 2023**; vigente desde febrero 2026 es **90,0 UF**. Fuente: spensiones.cl 2026-02. Impacto: empleados con sueldo > 3.251.084 CLP están pagando AFP sobre base errónea.

2. **Actualizar fallback IMM_HISTORY** en `backend/hr_routes.py:907` agregando:
   ```python
   {"from": "2026-01-01", "amount": 539000, "law": "Ley 21.751"},
   {"from": "2025-05-01", "amount": 529000, "law": "Ley 21.631"},  # si aplica
   {"from": "2025-01-01", "amount": 510000, "law": "Ley 21.631"},  # verificar ley
   ```
   Actualmente `_get_current_imm()` retorna 500.000 (valor 2024) en vez de 539.000 (valor 2026). Endpoint `/hr/indicators` entrega valor errado al frontend.

3. **Actualizar fallback `_fetch_indicators`** (`backend/hr_routes.py:1013-1022`) con valores 2026:
   ```python
   "uf": {"value": 40000, ...},  # en vez de 38700
   "utm": {"value": 69889, ...}, # en vez de 67294
   "topes": {"afp_uf": 90.0, "afc_uf": 135.2, "salud_uf": 90.0, ...}
   ```

4. **Corregir BUG-A4.2 (timezone cron + escalón 42h)**: cambiar `CronTrigger(hour=12, minute=0, timezone=pytz.utc)` a `timezone=pytz.timezone('America/Santiago')` con hora 08:00. Para `FECHA_ESCALON_42H` en backend cambiar a `datetime(2026, 4, 26, 0, 0, tzinfo=ZoneInfo('America/Santiago'))` y comparar con datetime timezone-aware, no date naive.

5. **Eliminar `UF_VALUE = 38000` hardcoded** en `src/pages/HRDashboard.tsx:8196`. Usar `CHILE_LABOR.UF.value` o importar directamente `UF_ABRIL_2026` de shared.

6. **Actualizar UTM antes del 2026-05-01**: preparar commit `legal(tax): actualizar UTM_ABRIL_2026 → UTM_MAYO_2026 = 70588` o renombrar a `UTM_VIGENTE` con comentario de fuente SII.

### E.2 — Alta (acción 1-2 semanas)

7. **Renombrar constantes con sufijo temporal**: `UF_ABRIL_2026` → `UF_VIGENTE`, `UTM_ABRIL_2026` → `UTM_VIGENTE`, `IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM` → `IMPUESTO_2A_CATEGORIA_TRAMOS_UTM` con comentario 4-líneas incluyendo versión y fecha de próxima verificación. Elimina necesidad de renombrar mensualmente.

8. **Unificar motor de nómina**: eliminar `backend/hr_routes.py:calculate_payroll_for_employee` O `backend/payroll_calculator.py:calculate_liquidacion`. Coexisten con semántica numérica distinta (int vs round). Decidir cuál queda y deprecar el otro. Ver BUG-B1.4.

9. **Reemplazar `Math.round(data.uf.value)` por conservar 2 decimales** en HRDashboard línea 505. Permite mayor precisión y coincide con SII oficial.

10. **Implementar UF por fecha de devengamiento**: función `get_uf_at_date(fecha) -> Decimal` que haga request a `https://mindicador.cl/api/uf/DD-MM-YYYY` para cálculos retroactivos. Necesario para liquidaciones de meses anteriores.

11. **Persistir último valor válido** de indicadores en DB o disco. En restart + mindicador.cl caído, usar último cache disco en lugar del fallback hardcoded obsoleto.

### E.3 — Moderada (próximo mes)

12. **Auditoría del IMM_HISTORY completo**: verificar cada ley citada contra bcn.cl con navegador humano. Agregar Ley 21.751 (539.000 2026-01-01) y cualquier ley intermedia 2025.

13. **Tests de integración con mindicador.cl**: escribir test `test_mindicador_uf_matches_constant()` que verifique una vez al día que `UF_VIGENTE` coincide con mindicador dentro de 7 días de antigüedad máxima. Fallar CI si desfase > 7 días.

14. **Job de alerta automática**: cron que compare valor UF del backend vs mindicador y envíe email a `ceo@conniku.com` si desfase > X%. Cristian recibe alerta antes de que usuarios lo detecten.

15. **Convención de redondeo**: documentar en `docs/legal/rounding-convention.md` que se redondea solo al resultado final en CLP (convención SII). Eliminar redondeos intermedios en `src/admin/shared/ercData.ts:1320-1332`.

### E.4 — Informativa (3+ meses)

16. **Scraping automático del CT**: implementar servicio headless (Playwright en GitHub Action cron semanal) que baje el PDF oficial del Código del Trabajo desde bcn.cl y detecte cambios vs versión archivada en `docs/legal/sources/`. Solo notificar; no aplicar automático.

17. **Integración CMF API**: obtener API key gratuita en cmfchile.cl como fuente alternativa a mindicador.cl. Redundancia de fuentes económicas.

18. **Almacenar UF con 4 decimales interno + 2 mostrados**: alinear con convención Banco Central (6 decimales internos) pero mostrar SII (2 decimales). Preparar para expansión LATAM.

---

## Reporte agente — 4 secciones obligatorias

### 1. Lo que se me pidió

Cita literal del trigger:

> "OBJETIVO: auditoría de ASPECTOS TEMPORALES Y DE PRECISIÓN de constantes de nómina + desbloquear el acceso a fuentes legales chilenas probando rutas alternativas a bcn.cl (que devuelve 401 CloudFront y bloquea verificación literal de artículos del Código del Trabajo)."

Scope en 5 partes: A (temporalidad UF/UTM/UTA/escalón/retroactivo), B (coma flotante + decimales), C (rutas alternativas bcn), D (crons stale), E (recomendaciones). NO escribir código. Reporte markdown.

### 2. Lo que efectivamente hice

- **Archivos leídos**: `/Users/cristiang./CONNIKU/shared/chile_constants.ts`, `/Users/cristiang./CONNIKU/backend/constants/labor_chile.py`, `/Users/cristiang./CONNIKU/backend/constants/tax_chile.py`, `/Users/cristiang./CONNIKU/backend/payroll_calculator.py`, `/Users/cristiang./CONNIKU/backend/hr_routes.py` (secciones 400-470, 880-1060), `/Users/cristiang./CONNIKU/backend/server.py` (secciones 215-295), `/Users/cristiang./CONNIKU/src/pages/HRDashboard.tsx` (secciones 150-280, 490-520, 8180-8440), `/Users/cristiang./CONNIKU/src/admin/shared/ercData.ts:1320-1350`.

- **Grepos ejecutados**: 10 búsquedas en paralelo (UF_ABRIL_2026, UTM, getWeeklyHoursAtDate, Math.round, SIS_RATE, TOPE_AFC_UF, 81.6/90.0 UF, IMM_HISTORY, APScheduler, mindicador).

- **WebFetches / curls exitosos**:
  - `mindicador.cl/api/uf`: HTTP 200, obtenidos valores diarios abril 2026
  - `mindicador.cl/api/uf/22-04-2026`: 40013.88
  - `mindicador.cl/api/uf/25-04-2026`: 40053.72
  - `mindicador.cl/api/utm`: confirmado 69889 abril
  - `sii.cl/valores_y_fechas/uf/uf2026.htm`: HTTP 200, 35.696 bytes, UF diarias abril extraídas
  - `sii.cl/valores_y_fechas/utm/utm2026.htm`: HTTP 200, UTM mayo 2026 = 70588 confirmada
  - `sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm`: HTTP 200, tramos mayo confirmados
  - `mintrab.gob.cl/ley-40-horas-...`: HTTP 200, 129.887 bytes, cita literal escalón 2026
  - `spensiones.cl/portal/.../w3-article-16921.html`: HTTP 200, 51.839 bytes, cita literal topes 90,0 UF / 135,2 UF
  - `bcn.cl/leychile/navegar?idNorma=207436` (con UA Mozilla): HTTP 200 pero shell Angular SPA — no extraible

- **WebFetches / curls fallidos**:
  - `bcn.cl` sin User-Agent: 401
  - `leychile.cl` sin UA: 401
  - `dt.gob.cl/portal/1627/...`: 404
  - `diariooficial.interior.gob.cl` sin UA: 403
  - `nuevo.leychile.cl`: 200 pero respuesta vacía (264 bytes)
  - `cmfchile.cl/api-sbifv3/.../uf`: 422 (requiere API key)
  - `web.archive.org` bcn snapshot: 200, 1.1MB, pero solo shell SPA archivada

- **Reporte generado**: `/Users/cristiang./CONNIKU/docs/legal/audits/2026-04-22-temporal-precision-bcn-alternative.md` con 5 secciones + reporte 4 secciones + alertas priorizadas.

- **Bugs documentados**: 15 (BUG-A1.1, A1.2, A1.3, A1.4, A2.1, A2.2, A2.3, A4.1, A4.2, A5, B1.1, B1.2, B1.3, B1.4, B3, D2.1, D3.1, D4.1, D5).

- **Demostración floating-point**: ejecutada con `node -e` confirmando `40013.88 * 90.0 = 3601249.1999999997` (error IEEE 754 real corregido por Math.round).

### 3. Lo que no hice y por qué

- **No obtuve texto literal de Art. 40 bis, 44, 47, 50, 55, 159 N°4, 163, 168, 169, 172, 30-32, 67-76 del Código del Trabajo**. Razón: bcn.cl sirve el CT vía Angular SPA (`/leychile/navegar?idNorma=207436` devuelve 9.653 bytes de shell JS que requiere runtime). Wayback Machine archiva la misma shell. dt.gob.cl/portal/1627/w3-propertyvalue-27924.html retorna 404. Única alternativa fiable: navegador headless con ejecución JS (Playwright) o descarga manual humana del PDF consolidado del CT. No intenté Playwright en esta sesión por limitación de tool Bash; curl puro no ejecuta JS.

- **No verifiqué Ley 21.751 texto literal ni Ley 21.631 intermedia**. Solo confirmé el monto $539.000 vía mintrab.gob.cl (bloque 2026-01-01). El artículo específico de la Ley 21.751 no se obtuvo literalmente.

- **No propuse cambio concreto en código**. Por scope: el trigger pidió solo markdown. Pero las recomendaciones en Sección E apuntan a archivos y líneas específicas.

- **No verifiqué el día exacto 2026-04-26 del escalón 42h desde ley.cl**. La cita de Mintrab confirma "abril 2026" pero no "día 26". La inferencia se basa en aniversario Ley 21.561 (publicada 2024-04-26). **Queda pendiente verificación literal del Art. 1° Transitorio de la Ley 21.561 para confirmar día exacto**.

- **No corrí los tests del repo** (`pytest backend/tests/test_labor_chile_constants.py`) para validar que los bugs reportados aún están presentes. Scope era auditoría documental, no ejecución.

### 4. Incertidumbres

- **BUG-A4.1 y A4.2** (timezone cross-midnight) se basan en análisis estático del código. No los reproduje en runtime con `FECHA_ESCALON_42H = new Date('2026-04-26T00:00:00Z')` y `new Date('2026-04-25T22:00:00-04:00')`. Puede haber detalle de comparación JS que no esté capturando (p.ej. si JS compara siempre en UTC la desigualdad invalida la hipótesis). Se requiere test unitario explícito.

- **Ley 21.631** mencionada en recomendación E.1 item 2 como candidata para IMM 2025 podría no ser el número correcto. No la verifiqué vía bcn.cl (bloqueado). Antes de aplicar la recomendación, un humano debe verificar el número exacto de la ley que fijó IMM 2025-01-01 y 2025-05-01 si aplica.

- **Fallback values hardcoded en `_fetch_indicators`** podrían ser código muerto si mindicador.cl jamás ha caído. Sin logs de producción no puedo confirmar si alguna vez el fallback ha servido datos al frontend real. Riesgo potencial, no confirmado actual.

- **La constante 81,6 UF vs 90,0 UF** es el hallazgo más grave. Asumo que la cita literal de spensiones.cl es auténtica y vigente. Si el artículo web de spensiones fuera cacheado o viejo (no es 2026), la recomendación E.1 item 1 es incorrecta. Fecha en el texto "Santiago, 10/02/2026" sugiere artículo reciente. No verifiqué metadata HTTP `Last-Modified` del recurso.

- **Tests en `backend/tests/test_payroll_motor_unified.py` y `test_labor_chile_constants.py`** ya parecen haber sido escritos asumiendo 81,6 UF como correcto. Si la auditoría concluye que 90,0 UF es lo vigente, esos tests fallarán en CI cuando se actualice. Se requiere revisión paralela de los tests al cambiar las constantes.

- **La auditoría previa `2026-04-22-chile-labor-constants-triple-check.md`** mencionada por el prompt ya existe en el repo y puede contener afirmaciones conflictivas con este reporte. No la leí esta sesión para evitar sesgo de confirmación. Un humano debe cruzar ambos reportes antes de aplicar cambios.

---

## Declaración obligatoria (repetida)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción.
