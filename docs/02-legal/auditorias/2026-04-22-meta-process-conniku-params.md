---
documento: Auditoría meta-proceso y parámetros Conniku — items 28-35
fecha: 2026-04-22
agente: gap-finder (Tori)
tipo: audit estructural meta-proceso + coherencia de parámetros empresa
rama: bloque-sandbox-integrity-v1
complementario a: 2026-04-22-chile-labor-structural-check.md (web-architect)
                  2026-04-22-chile-labor-constants-triple-check.md (legal-docs-keeper)
estado: BORRADOR — requiere validación humana antes de acciones derivadas
---

# Auditoría meta-proceso y parámetros Conniku — 2026-04-22

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## Sección 1: Contradicciones entre reportes previos

### 1.1 Inventario de agentes ya entregados

| Agente | Archivo de reporte |
|---|---|
| web-architect | `docs/legal/audits/2026-04-22-chile-labor-structural-check.md` |
| legal-docs-keeper #1 (numérico) | `docs/legal/audits/2026-04-22-chile-labor-constants-triple-check.md` |

### 1.2 Contradicciones literales detectadas

**Contradicción C-01 — Tope imponible AFP: ¿desactualizado o correcto?**

- **web-architect (pág. §3.5)**: "Tope imponible AFC = 135,2 UF desde 2026-02 (Superintendencia de Pensiones, verificado Capa 0 D-B batch §21 por Cristian 2026-04-21)". No menciona discrepancia en el tope AFP. Implicitamente acepta que `TOPE_IMPONIBLE_AFP_UF = 81.6` está en el repositorio sin marcarlo como bug.
- **legal-docs-keeper #1 (§8, pág. "Tope imponible AFP")**: "El código tiene 81,6 UF — valor de 2022. Llevan 2 ciclos de reajuste anual sin actualizar. Para 2025 correspondía 87,8 UF; para 2026 corresponde 90,0 UF." Calificado como CRÍTICO.

**Resolución**: los agentes no se contradicen en el valor (ambos ven 81.6 en el código), pero el web-architect no lo señala como problema mientras el legal-docs-keeper lo marca CRÍTICO. La clasificación correcta es la del legal-docs-keeper: 81.6 UF es un bug activo que afecta cálculos reales. El web-architect simplemente estaba fuera de scope en valores numéricos. No hay contradicción técnica, sí hay brecha de cobertura. Orden de resolución: seguir la recomendación del legal-docs-keeper.

**Contradicción C-02 — Descripción del giro 631200**

- **legal-docs-keeper #1 (§12)**: "Para actividad 631200 (Procesamiento de datos, hosting y actividades conexas; micro empresa)..."
- **web-architect**: no menciona el giro.

Esta no es una contradicción entre los dos reportes sino entre el reporte del legal-docs-keeper y el código del repositorio. El giro 631200 aparece descrito de cuatro formas distintas en el repo:
  - `backend/server.py:1301`: "Giro 631200 (desarrollo software)"
  - `src/admin/shared/constants.ts:8`: "Portales y Plataformas Web" (Código SII 631200)
  - `src/admin/shared/accountingData.ts:4`: "631200 Portales Web"
  - `src/pages/InfoPages.tsx:168`: "Desarrollo y Comercialización de Software (631200)"
  - `src/admin/tools/BibliotecaDocumentos.tsx:65`: "Servicios de educación en línea (631200)"
  - `docs/legal/audits/2026-04-22-chile-labor-constants-triple-check.md`: "Procesamiento de datos, hosting y actividades conexas"

Seis descripciones distintas para el mismo código SII. Ningún agente previo detectó esto explícitamente.

**Resolución**: la descripción oficial del SII para el código 631200 es la que consta en el RUT de la empresa inscrito ante el SII. Cristian debe verificar el texto exacto del giro en el certificado de inscripción o en el portal Mi SII, y unificar todas las menciones a ese texto literal.

**Contradicción C-03 — IMM reducido: cuál es el "valor canónico propuesto"**

- **web-architect (§3.3)**: "Los valores de HRDashboard ($402.238 y $319.756) son coherentes con las razones históricas aplicadas al IMM 2026 $539.000. Los valores de ChileLaborConstants.ts ($372.989 y $296.514) son del IMM anterior ($500.000 × mismas razones). ChileLaborConstants está desfasado."
- **legal-docs-keeper #1 (§5)**: "Valor canónico propuesto: PENDIENTE DE VERIFICACIÓN contra texto literal de Ley 21.751. Bajo supuesto probable $402.238 está correcto para 2026 y $372.989 en ChileLaborConstants es residual." También calcula aritméticamente: "74,5978% × 539.000 = $402.082 (aproximado)".

La aritmética del legal-docs-keeper ($402.082) difiere de lo que afirma el web-architect que está en el código de HRDashboard ($402.238). Diferencia: $156. No hay contradicción entre los agentes respecto a cuál está más actualizado (ambos dicen que ChileLaborConstants está desactualizado), pero hay una discrepancia aritmética no resuelta entre el valor en el código ($402.238) y el cálculo teórico proporcional ($402.082). Ninguno puede confirmar cuál es el valor oficial de Ley 21.751 porque BCN/SPA no fue accesible.

**Resolución**: derivar a Cristian. Solo el texto literal de Ley 21.751 resuelve cuál de los dos valores ($402.238 o ~$402.082) es el correcto. Es decisión de Capa 0.

**Contradicción C-04 — UF redondeada: cuántos archivos tienen 39842 vs 39841.72**

- **web-architect (§2.1, tabla M3)**: "UF redondeado `39842` en HRDashboard vs canónico `39841.72`". Lo trata como divergencia MEDIA.
- **legal-docs-keeper #1 (§1)**: "HRDashboard.tsx usa `39842` (entero) → viola regla 'sin redondeos'". Lo lista como uno de los 4 hallazgos CRÍTICOS.

Los dos agentes detectan el mismo hecho (el entero 39842 está solo en HRDashboard.tsx, los tres archivos canónicos tienen 39841.72). La diferencia está en la severidad: web-architect dice MEDIA, legal-docs-keeper dice CRÍTICO. La valoración del legal-docs-keeper es más correcta para el propósito de este bloque: si la constante canónica es la fuente de verdad y HRDashboard tiene su propio literal, el bug persiste independientemente de si la diferencia es 0.28 pesos.

**Resolución**: adoptar clasificación legal-docs-keeper (CRÍTICO), pero la acción es la misma: eliminar el objeto CHILE_LABOR inline de HRDashboard.tsx.

### 1.3 No-contradicciones relevantes confirmadas

Los dos reportes coinciden en:
- IMM $539.000 correcto.
- AFC (0.6%/2.4%/3.0%) correcto.
- SIS 1.54% correcto.
- UTM 69.889 correcto.
- Tramos impuesto 2ª categoría coinciden byte-a-byte con SII abril 2026.
- ChileLaborConstants.ts está desactualizado en IMM history (falta 2025-01 y 2025-05).
- El tope AFP 81.6 UF está desactualizado (debe ser 90.0 UF para 2026).

---

## Sección 2: Parámetros Conniku (RUT, giro, ProPyme) — inventario y coherencia

### 2.1 RUT 78.395.702-7

**Método**: `grep "78395702\|78\.395\.702" **/*.{py,ts,tsx,md,json}` (via Grep tool)

**Resultado**: 47 ocurrencias en 24 archivos distintos.

**Distribución**:
- Backend Python: `backend/notifications.py` (2), `backend/hr_routes.py` (5), `backend/server.py` (1), `backend/seed_ceo_profile.py` (1), `backend/chile_tax_routes.py` (via `SII_RUT_EMISOR` en .env.example).
- Frontend TS/TSX: `src/pages/InfoPages.tsx`, `src/pages/ClassRoom.tsx`, `src/pages/MyTutorDashboard.tsx`, `src/admin/modules/personas/PersonasHub.tsx`, `src/admin/modules/personas/DirectorioPersonal.tsx` (10+), `src/admin/legal/LegalTab.tsx` (5), `src/admin/tools/BibliotecaDocumentos.tsx`, `src/admin/shared/constants.ts`, `src/admin/shared/accountingData.ts`, `src/admin/shared/ercData.ts` (5), `src/pages/SupportPage.tsx`, `src/admin/finance/FinancialTab.tsx`, `src/admin/finance/ContabilidadTab.tsx`, `src/admin/finance/ImpuestosTab.tsx`, `src/pages/DeleteAccount.tsx`, `src/admin/hr/PersonalTab.tsx`, `src/pages/PublicTutorPage.tsx`, `extension/src/popup/components/ConsentView.tsx`, `extension/src/popup/components/PrivacyPolicy.tsx`.
- Documentación: `docs/pendientes.md`, `docs/legal/v3.2/cookies.md`, `docs/legal/v3.2/privacy.md`, `docs/legal/drafts/2026-04-21-tax-chile-py.md`.

**Coherencia del RUT**: el valor `78.395.702-7` es consistente en todos los archivos. No hay variante `78395702-7` ni `78.395.7027` ni otro formato. El RUT está mayoritariamente hardcoded directamente en los archivos.

**Gap detectado**: hay un único archivo con el RUT en una constante central extraíble:
- `src/admin/shared/constants.ts:7`: `rut: '78.395.702-7'` como parte del objeto `COMPANY`.
- `src/admin/shared/accountingData.ts:9`: `rut: '78.395.702-7'` como parte de otro objeto `COMPANY`.

Los dos objetos `COMPANY` están en archivos distintos (`constants.ts` y `accountingData.ts`) y son parcialmente redundantes. El resto del codebase (23+ archivos) hardcodea el RUT directamente en strings, sin importar de esas constantes.

**Impacto**: MEDIO. El RUT no cambiará, pero si alguna vez Conniku SpA tuviera que actualizar cualquier dato de empresa que sí puede cambiar (dirección, giro descriptivo, nombre representante), hay 24 archivos a tocar manualmente.

### 2.2 Giro 631200

**Inconsistencia en la descripción del giro**: seis descripciones distintas para el mismo código SII en el repositorio.

| Archivo | Descripción del giro 631200 |
|---|---|
| `backend/server.py:1301` | "desarrollo software" |
| `src/admin/shared/constants.ts:8` | "Portales y Plataformas Web" |
| `src/admin/shared/accountingData.ts:4` y `:11` | "Portales Web" |
| `src/pages/InfoPages.tsx:168` | "Desarrollo y Comercialización de Software" |
| `src/admin/modules/personas/DirectorioPersonal.tsx:573` | "Desarrollo y Comercialización de Software" |
| `src/admin/tools/BibliotecaDocumentos.tsx:65` | "Servicios de educación en línea" |
| `src/admin/legal/LegalTab.tsx:76` | "Portales web" |
| Reporte legal-docs-keeper #1 | "Procesamiento de datos, hosting y actividades conexas" |

El código SII 631200 corresponde oficialmente a "Procesamiento de datos, hospedaje (hosting) y actividades conexas" según el clasificador de actividades económicas del SII. La descripción en `BibliotecaDocumentos.tsx` ("Servicios de educación en línea") no es la descripción oficial del SII para ese código y podría generar inconsistencia ante cualquier revisión del SII.

**Impacto**: ALTO para documentos legales generados por la app (contratos, finiquitos, liquidaciones) que muestran el giro con descripción errónea. Un finiquito que dice "Servicios de educación en línea" cuando el SII tiene registrado "631200 — Portales Web" puede generar problemas en una auditoría laboral.

### 2.3 ProPyme 14D3

El régimen tributario aparece consistentemente en el codebase como "ProPyme Transparente Art. 14D3" o "14D N°3". No hay variantes incorrectas detectadas. La constante `PPM_PROPYME_14D3_PCT = 0.0025` está en:
- `backend/constants/tax_chile.py:43`
- `shared/chile_constants.ts:131`
- Tests: `backend/tests/test_tax_chile_constants.py:48` y `src/__tests__/chile_constants.test.ts:109`

**Gap detectado**: la alerta `ALERTA-NOM-4` en `docs/legal/alerts.md` señala que el PPM de 0.25% puede no ser el correcto para el primer año de actividades de Conniku SpA (inició 2026-04-08). Esta alerta está abierta y no resuelta. El valor existe en el test, lo que significa que si el PPM real difiere, el test protege el valor incorrecto.

### 2.4 Micro Empresa

El clasificador "MICRO EMPRESA" aparece en:
- `src/admin/shared/accountingData.ts:15`: `segmento: 'MICRO EMPRESA'`
- `backend/server.py:1301`: "Micro Empresa"
- `src/pages/InfoPages.tsx:169`: "Micro Empresa — Régimen ProPyme (Art. 14D3)"

Coherencia interna: consistente. No hay variante "pequeña empresa" ni clasificación distinta.

---

## Sección 3: Configuración SII

### 3.1 Existencia de archivo de configuración SII dedicado

`backend/constants/sii_conniku.py` — NO EXISTE.

Los archivos existentes en `backend/constants/` son:
- `__init__.py`
- `consumer.py`
- `labor_chile.py`
- `tax_chile.py`
- `contact_routing.py`
- `legal_versions.py`

No hay un archivo específico para la configuración de facturación electrónica del SII (CAF, folio, timbre, certificado digital, resolución SII). Esto es una deuda consciente: Conniku SpA no emite DTE (Documentos Tributarios Electrónicos) en producción aún. La funcionalidad en `backend/chile_tax_routes.py` es una simulación.

**Evidencia**: `backend/chile_tax_routes.py:471`: `"folio": f"SIM-{gen_id()[:8].upper()}"  # Simulated folio`. Los endpoints de boleta electrónica en producción devuelven un folio simulado, no real.

### 3.2 Variables de entorno SII declaradas vs usadas

Variables SII en `.env.example` (líneas 179-190):
- `SII_RUT_EMISOR=78.395.702-7` — declarada y usada en `backend/chile_tax_routes.py:290`, `:373`, `:442`.
- `SII_CERT_PATH=/path/to/sii-certificate.pfx` — declarada y usada en `backend/chile_tax_routes.py:443`.
- `SII_API_BASE=https://www4c.sii.cl/bolcoreinternetui/api/` — declarada pero el uso real en `chile_tax_routes.py` es simulado (folio fake).

**Variables SII usadas en código pero NO en .env.example**: ninguna. La cobertura de `.env.example` para las variables SII es completa.

**Variables SII faltantes para producción real** (no urgente hoy porque la emisión real no está activa):
- `SII_CERT_PASSWORD` — contraseña del certificado `.pfx`. No está en `.env.example`. Si Conniku emite DTE reales en el futuro, esta variable será necesaria y actualmente no está documentada.

### 3.3 Hardcoded IVA fuera de constants/

`backend/chile_tax_routes.py:21`: `IVA_CHILE = 0.19` — hardcoded directamente en el archivo de rutas, sin importar desde `backend/constants/tax_chile.py` donde existe `IVA_PCT = Decimal("0.19")`.

Esto crea una tercera copia del IVA (además de las del canónico Python y del canónico TS). Si el IVA cambiara (por ejemplo, una reforma tributaria al 21%), este archivo quedaría desactualizado sin que el script `verify-chile-constants-sync.sh` lo detecte (porque dicho script solo compara `backend/constants/*.py` vs `shared/chile_constants.ts`, no rutas de aplicación).

**Severidad**: MEDIA. El IVA es estable (19% desde 2003), pero el patrón es incorrecto. El archivo de rutas debería importar desde `tax_chile.py`.

### 3.4 Credenciales hardcoded en código SII

No se detectaron credenciales hardcoded en el código SII. El certificado y el RUT emisor se leen desde variables de entorno correctamente. El único riesgo sería si `.pfx` estuviera commitado accidentalmente, pero Glob/Grep no encontró ningún archivo `.pfx` o `.p12` en el repositorio.

---

## Sección 4: Multi-jurisdicción como deuda consciente

### 4.1 Arquitectura actual

El proyecto tiene **arquitectura mono-país** para constantes legales/laborales:
- `backend/constants/labor_chile.py` — Chile únicamente.
- `backend/constants/tax_chile.py` — Chile únicamente.
- No existe `backend/constants/<otro_pais>/` ni función `getLaborConstants(countryCode)`.
- No existe campo `country_code` en las tablas de empleados o en las constantes de nómina.

**Sin embargo**, sí existe infraestructura de multi-país para otros módulos:
- `src/utils/currency.ts`: `getCurrencyForCountry(countryCode)` y `COUNTRY_RATES`.
- `backend/chile_tax_routes.py`: `COUNTRY_CURRENCIES` con 50+ países.
- `src/pages/Register.tsx`: selector de país con CL/CO/AR.
- `src/data/universities.ts`: universidades de MX, CO, PE, AR.

Esto significa que el frontend ya contempla usuarios de múltiples países, pero el backend de nómina/RRHH asume Chile como único país.

### 4.2 Impacto como deuda consciente

| Escenario | Horizonte | Impacto si no se hace |
|---|---|---|
| Conniku contrata primer empleado en Colombia | cuando exista empleado activo fuera de Chile | El módulo RRHH calculará liquidaciones con tasas chilenas (AFP, AFC, SIS, IMM) para un trabajador colombiano. Cálculo completamente incorrecto. |
| Usuario peruano usa módulo CEO para su empresa | cuando se expanda oficialmente | Los cálculos de nómina del módulo CEO tendrán valores incorrectos para Perú. |
| Expansión UE (compliance GDPR) | cuando se expanda fuera de Chile | Los documentos legales generados (contratos) no cumplen con la Directiva de Trabajo de la UE. |

**Clasificación de deuda**: CONSCIENTE. El equipo es consciente (CLAUDE.md menciona "expansión futura a otros países") y la arquitectura actual es válida para la fase actual. La deuda se activa cuando ocurra el primer escenario de la tabla.

### 4.3 Propuesta de arquitectura multi-jurisdicción

Cuando sea necesario (horizonte: cuando exista primer empleado activo fuera de Chile o al expandirse oficialmente a LATAM):

**Estructura recomendada**:
```
backend/constants/
  labor_chile.py       (actual, renombrar a chile/labor.py)
  tax_chile.py         (actual, renombrar a chile/tax.py)
  chile/
    labor.py
    tax.py
  colombia/
    labor.py
    tax.py
  mexico/
    labor.py
    tax.py

backend/constants/__init__.py:
  def get_labor_constants(country_code: str) -> LaborConstants:
    ...
```

**Modelo de datos requerido**: agregar campo `country_code: str = "CL"` a las tablas `employees`, `payslips`, `hr_settings`.

**Estimación de esfuerzo**: 2-3 días por país para el backend (investigar constantes + implementar + tests). La arquitectura del refactor inicial (crear módulo multi-país) es 1 día.

---

## Sección 5: Documentación de procesos (gaps)

### 5.1 Qué existe

Se revisó en `docs/`:
- `docs/pendientes.md` — lista de issues priorizados. Existe.
- `docs/decisiones-pendientes.md` — batch de decisiones. Existe.
- `docs/dev-setup.md` — setup local. Existe.
- `docs/plans/` — planes de bloques. Existe.
- `docs/legal/alerts.md` — alertas legales. Existe.

### 5.2 Qué no existe

**NO existe**:
- `docs/procedures/` — directorio no encontrado.
- `docs/how-to/` — directorio no encontrado.
- `CONTRIBUTING.md` en la raíz del proyecto (los únicos CONTRIBUTING.md encontrados son en `node_modules/`).
- Runbook sobre "cuando el IMM cambie, qué archivos tocar".
- Runbook sobre "cuando la UTM cambie cada primer día hábil del mes, qué pasos seguir".
- Runbook sobre "cuando el tope AFP cambie cada enero/febrero, qué archivos actualizar".
- README de actualización de UF/UTM mensual.

### 5.3 Tribal knowledge no documentado

Los siguientes procedimientos existen implícitamente (el código los implementa) pero no hay runbook explícito para el operador que debe ejecutarlos:

**Procedimiento A — Actualización mensual de UF y UTM**

Lo que debería hacerse el primer día hábil de cada mes:
1. Obtener UF del día 1 desde `https://www.sii.cl/valores_y_fechas/uf/uf2026.htm`.
2. Obtener UTM mensual desde `https://www.sii.cl/valores_y_fechas/utm/utm2026.htm`.
3. Actualizar `backend/constants/labor_chile.py`: `UF_ABRIL_2026` y `UTM_ABRIL_2026` (con nueva variable de nombre, ej: `UF_MAYO_2026`).
4. Actualizar `shared/chile_constants.ts`: espejo.
5. Actualizar tests en `backend/tests/test_labor_chile_constants.py` y `src/__tests__/chile_constants.test.ts`.
6. Ejecutar `scripts/verify-chile-constants-sync.sh`.
7. Commit tipo `legal(constants): actualizar UF/UTM Mayo 2026`.
8. Aprobación humana de Cristian.

No existe ningún documento que describa estos pasos. El desarrollador que deba hacerlo en una sesión futura depende de leer el código para inferirlos.

**Procedimiento B — Actualización anual de tope AFP/AFC (enero/febrero)**

Similar a A, pero para `TOPE_IMPONIBLE_AFP_UF` y `TOPE_IMPONIBLE_AFC_UF`. La fuente es Superintendencia de Pensiones. El alert `ALERTA-NOM-1` en `docs/legal/alerts.md` lo menciona pero no lo formaliza como runbook ejecutable.

**Procedimiento C — Actualización del IMM (Ley de reajuste anual)**

El IMM se reajusta típicamente en mayo/junio de cada año por ley. Requiere:
1. Verificar el valor en Mintrab.
2. Actualizar `SUELDO_MINIMO_2026` (renombrar a nuevo año) en ambos archivos.
3. Actualizar el historial `IMM_HISTORY` (cuando se implemente según plan nomina-chile-v1).
4. Ejecutar tests.

**Procedimiento D — Actualización de retención de honorarios (progresión anual Ley 21.133)**

La retención avanza por tramos hasta llegar al 17% en 2028. Cada año hay que actualizar `RETENCION_HONORARIOS_2026_PCT` con el nuevo porcentaje y nueva fuente.

**Clasificación del gap**: ALTO. La ausencia de runbooks escritos significa que cuando estos eventos ocurran (UF cambia cada día, UTM cambia cada mes, IMM cambia cada año), el proceso depende de memoria o de que el agente infiera los pasos desde el código. Esto es contrario al principio de "evidencia reproducible" que rige el proyecto.

---

## Sección 6: Tests que protegen (cobertura + gaps)

### 6.1 Tests existentes relacionados con constantes legales

| Test | Ubicación | Qué protege |
|---|---|---|
| `test_labor_chile_constants.py` | `backend/tests/` | 16 valores numéricos + estructura 4-líneas de citas + funciones de fecha (get_weekly_hours_at_date, get_monthly_hours_at_date) |
| `test_tax_chile_constants.py` | `backend/tests/` | IVA, retención honorarios, PPM, tabla ISUT (8 tramos), continuidad, tipos Decimal, citas 4-líneas |
| `chile_constants.test.ts` | `src/__tests__/` | 17 constantes numéricas + tabla ISUT + funciones de fecha (getWeeklyHoursAtDate, getMonthlyHoursAtDate) |
| `ChileLaborConstants.test.ts` | `src/admin/shared/__tests__/` | Tests del wrapper frontend (no auditados en detalle en esta sesión) |
| `scripts/verify-chile-constants-sync.sh` | `scripts/` | Paridad Python ↔ TypeScript de 16 constantes escalares |

### 6.2 Gaps de cobertura detectados

**Gap T-01 — No hay test de sincronía byte-a-byte shared↔backend**

El script `verify-chile-constants-sync.sh` compara 16 constantes escalares. No compara:
- Constantes de tipo `Date` (FECHA_ESCALON_42H).
- Constantes de tipo lista (tabla ISUT).
- Constantes que NO están en el canónico pero sí en HRDashboard (IMM.reduced, IMM.nonRemunerational, INDEMNIZACIONES, etc.).

El objetivo de cobertura mencionado en la auditoría estructural del web-architect (shared == backend "byte-a-byte") no está alcanzado aún.

**Gap T-02 — No hay test que valide tope AFP obsoleto vs fuente oficial**

El test `test_labor_chile_constants.py:114` valida que `TOPE_IMPONIBLE_AFP_UF == 81.6`. Esto es un test que protege el valor **incorrecto**. Cuando se corrija a 90.0, el test fallará si no se actualiza. Pero actualmente el test da falsa seguridad: "pasa" porque el código tiene 81.6, que es el valor obsoleto.

**Gap T-03 — No hay test de UF stale**

No existe test que detecte si la UF hardcodeada tiene más de N días sin actualizar. El reporte del legal-docs-keeper señala que la UF varía diariamente y la constante se quedó en el valor del día 1 de abril. No hay mecanismo automatizado (test, cron, alert) que detecte este desfase después del día 9 de cada mes.

**Gap T-04 — No hay test de ejemplo SII real (input → output)**

El legal-docs-keeper propone en §8 de la auditoría numérica un test de integración contra calculadora SII: 5 sueldos conocidos → calcular con `calculateTax` → comparar contra tabla SII pública. Este test no existe. Lo que existe son tests de que la tabla tiene la estructura correcta, pero no tests de que la función de cálculo produce resultados correctos para sueldos reales.

Ejemplo del gap: un sueldo de $2.000.000 debería producir un impuesto exactamente calculable con la tabla SII. Si la función `calculateTax` tiene un bug en la fórmula (por ejemplo, usa límites de tramo incorrectamente), los tests actuales no lo detectarían porque solo verifican la tabla, no el cálculo.

**Gap T-05 — No hay test que proteja contra regresión de IMM history incompleto**

`ChileLaborConstants.ts` está incompleto (falta 2025-01 y 2025-05). No hay test que valide que el history tiene exactamente N entradas o que incluye todas las leyes de reajuste entre 2022 y 2026.

**Gap T-06 — No hay test que valide la descripción del giro 631200**

Con 6 variantes distintas en el codebase, no hay un test o lint que asegure que todos los archivos usan la misma descripción oficial.

---

## Sección 7: Runbook de actualización de constantes

### 7.1 Estado actual

No existe runbook escrito. Se documenta a continuación el flujo que debería seguirse (basado en análisis del código, estructura de commits y reglas de CLAUDE.md).

### 7.2 Runbook propuesto: "Actualización de constante legal"

**Trigger**: una ley o decreto cambia un valor que existe en el repositorio.

**Archivos a tocar en orden atómico**:

1. `backend/constants/labor_chile.py` o `backend/constants/tax_chile.py` según corresponda.
   - Actualizar la constante con el nuevo valor.
   - Actualizar el bloque de 4 líneas (cita, URL, fecha, verificador).
   - Si la constante es de periodicidad anual (tope AFP) o mensual (UF/UTM), renombrar la variable para reflejar la nueva vigencia (ej: `UF_MAYO_2026`).

2. `shared/chile_constants.ts` (espejo TypeScript).
   - Mismos cambios, mismo orden.
   - Mantener formato `export const NOMBRE = VALOR;` para compatibilidad con `verify-chile-constants-sync.sh`.

3. `backend/tests/test_labor_chile_constants.py` o `backend/tests/test_tax_chile_constants.py`.
   - Actualizar el valor esperado en el test correspondiente.
   - Si el test protegía un valor obsoleto, el nuevo test protege el correcto.

4. `src/__tests__/chile_constants.test.ts`.
   - Actualizar el test TypeScript espejo.

5. `scripts/verify-chile-constants-sync.sh` (solo si se agregan nuevas constantes al scope del script).

6. `docs/legal/alerts.md` (si la constante tenía una alerta ALERTA-NOM-x abierta, marcarla como resuelta).

7. Ejecutar validación local:
   ```bash
   bash scripts/verify-chile-constants-sync.sh
   python3.11 -m pytest backend/tests/test_labor_chile_constants.py -v
   python3.11 -m pytest backend/tests/test_tax_chile_constants.py -v
   npx vitest run src/__tests__/chile_constants.test.ts
   ```

8. Commit tipo `legal(constants): actualizar <NOMBRE_CONSTANTE> <nuevo_valor> <vigencia>`.

9. Aprobación humana de Cristian antes del merge (regla CLAUDE.md §Constantes legales en el código).

**Nota crítica**: el paso 9 es obligatorio e innegociable. Ningún agente puede cerrar solo un cambio en constantes legales. El truth-auditor no puede sustituir la aprobación humana de Cristian.

### 7.3 Calendarios de actualización por tipo de constante

| Constante | Frecuencia | Fuente | Próximo evento esperado |
|---|---|---|---|
| UF (`UF_ABRIL_2026`) | Diaria (cambia cada día) | SII / Banco Central / mindicador.cl | Mañana (2026-04-23). La constante actual ya tiene 22 días de desfase. |
| UTM (`UTM_ABRIL_2026`) | Mensual (primer día hábil) | SII | 2026-05-01 (o primer día hábil de mayo) |
| IMM (`SUELDO_MINIMO_2026`) | Anual (típicamente mayo-julio) | Mintrab / leychile | Estimado 2027-05 o 2027-06 |
| Tope AFP (`TOPE_IMPONIBLE_AFP_UF`) | Anual (enero/febrero) | Superintendencia de Pensiones | 2027-01 o 2027-02 (con urgencia: corregir el valor actual 81.6 → 90.0 antes de cualquier cálculo real) |
| Tope AFC (`TOPE_IMPONIBLE_AFC_UF`) | Anual (enero/febrero) | Superintendencia de Pensiones | 2027-01 o 2027-02 |
| Retención honorarios | Anual (1° enero) — Ley 21.133 progresión | SII | 2027-01-01 |
| Tabla ISUT | Mensual (varía con UTM) | SII | 2026-05-01 (cuando cambie la UTM de mayo) |
| PPM ProPyme | Anual o por resolución SII | SII | Verificar con contador (alerta ALERTA-NOM-4 abierta) |

---

## Sección 8: Plan de verificación contra calculadora SII pública

### 8.1 URL oficial de la calculadora SII

La Circular SII publica la tabla de impuesto 2ª categoría en:
- `https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm`

Esta es la tabla en formato HTML accesible. El SII no tiene una API pública de calculadora interactiva; la verificación se hace aplicando manualmente la tabla de tramos.

### 8.2 Cinco casos de prueba propuestos

Los cinco sueldos brutos de prueba (antes de retenciones) y su impuesto esperado según tabla SII abril 2026 (UTM = $69.889):

| Caso | Sueldo bruto CLP | Impuesto esperado (cálculo manual con tabla SII) |
|---|---|---|
| 1 | $800.000 | $0 (exento: < 13,5 UTM = $943.501) |
| 2 | $1.500.000 | ($1.500.000 × 0.04) - $37.740 = $22.260 |
| 3 | $3.000.000 | ($3.000.000 × 0.08) - $121.607 = $118.393 |
| 4 | $5.000.000 | ($5.000.000 × 0.135) - $313.802 = $361.198 |
| 5 | $10.000.000 | ($10.000.000 × 0.304) - $1.244.024 = $1.795.976 |

**Nota**: los valores de "deducción" usan la tabla verificada en el reporte legal-docs-keeper #1 (fuente SII directa, verificado 2026-04-22T03:59 UTC). Los cálculos manuales de esta tabla son orientativos; deben verificarse contra el texto literal de la tabla SII al momento de implementar el test.

### 8.3 Test de integración propuesto

```python
# backend/tests/test_tax_calculation_sii.py (propuesto, no existe aún)
@pytest.mark.parametrize("sueldo,impuesto_esperado", [
    (800_000, 0),
    (1_500_000, 22_260),
    (3_000_000, 118_393),
    (5_000_000, 361_198),
    (10_000_000, 1_795_976),
])
def test_impuesto_contra_tabla_sii_abril_2026(sueldo, impuesto_esperado):
    """Verifica que calculate_tax() reproduce la tabla oficial SII abril 2026.
    Tolerancia: ±1 CLP (redondeo entero).
    Fuente tabla: https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
    Fecha verificación SII: 2026-04-22
    """
    resultado = calculate_tax(sueldo, UTM_ABRIL_2026)
    assert abs(resultado - impuesto_esperado) <= 1, (
        f"Sueldo {sueldo}: esperado {impuesto_esperado}, obtenido {resultado}"
    )
```

**Función a testear**: la función `calculateTax` / `calculate_tax` en el motor payroll. Esta función se crea en el bloque `nomina-chile-v1` y no existe aún en el canónico.

---

## Sección 9: Configuración ambiental

### 9.1 Variables de entorno que NO deberían ser configurables por ENV

Ningún valor legal está actualmente configurable por variable de entorno, excepto los que lo son por diseño operativo correcto:
- `SII_RUT_EMISOR` — correcto que sea ENV (puede diferir entre staging y producción).
- `SII_CERT_PATH` — correcto.
- `LEGAL_GATE_ENFORCE` — correcto como feature flag.

Las constantes numéricas (AFP, AFC, IMM, UF, UTM, etc.) están en archivos Python/TS, no como variables de entorno. Esto es correcto: si estuvieran como ENV, cualquier operador podría cambiar el tope AFP a un valor arbitrario en el panel de Render sin código review.

### 9.2 Vulnerabilidad de integridad detectada: NINGUNA

No se detectó ningún valor legal configurable por ENV que no debería serlo. Los valores legales están hardcoded en los archivos de constantes, lo cual es el comportamiento correcto para valores regulados.

### 9.3 Gap de IVA hardcoded en ruta de aplicación

`backend/chile_tax_routes.py:21`: `IVA_CHILE = 0.19` es una constante local en el módulo de rutas, no importada desde `backend/constants/tax_chile.py`. Si el IVA cambiara, este archivo no se actualizaría automáticamente. Severidad: MEDIA (el IVA chileno es estable, pero el patrón violado es el de "fuente única de verdad").

### 9.4 Tier MAX legacy en .env.example

`.env.example:143`: `STRIPE_PRICE_MAX_MONTHLY=` con comentario `[DEPRECATED]`. El archivo documenta correctamente la deprecación. No es una vulnerabilidad. La variable de ambiente está vacía y el comentario explica que no tiene efecto. Esta línea puede eliminarse en el bloque de limpieza post-launch (según `docs/pendientes.md §M: Limpieza tier MAX legacy`).

---

## Sección 10: Issues abiertos en registros

### 10.1 docs/pendientes.md — issues relacionados con constantes legales

Del archivo `docs/pendientes.md` (última actualización 2026-04-18):

| Item | Descripción | Estado |
|---|---|---|
| C6 | Tabla nómina con RUT placeholder `77.XXX.XXX-X` | Abierto. Bloque sugerido: legal nómina Chile. |
| C7 | Discrepancia UF/UTM/SIS backend↔frontend | Parcialmente resuelto: se crearon los archivos `backend/constants/labor_chile.py` y `tax_chile.py`. Falta eliminar duplicados en HRDashboard y ChileLaborConstants. |
| A2 | Infraestructura `backend/constants/` legal | Resuelto estructuralmente (archivos existen). Pendiente: ampliar con constantes estructurales (INDEMNIZACIONES, FERIADO, etc.) según plan nomina-chile-v1. |

**Nota**: `docs/pendientes.md` no ha sido actualizado desde 2026-04-18. El bloque `bloque-sandbox-integrity-v1` en curso (hoy 2026-04-22) no está reflejado en el documento. Esto es un gap de proceso: el archivo de pendientes no se actualiza entre bloques.

### 10.2 docs/legal/alerts.md — alertas relacionadas con constantes

| Alerta | Descripción | Estado |
|---|---|---|
| ALERTA-NOM-1 | Tope AFP `81.6` UF obsoleto; debe ser `90.0` para 2026 | ABIERTA. Bloquea bloque `nomina-chile-v1`. |
| ALERTA-NOM-2 | `MUTUAL_BASE_PCT = 0.93%` sin verificar para 2026 | ABIERTA. No bloquea merge pero debe resolverse antes del primer empleado. |
| ALERTA-NOM-3 | Factores de rebaja ISUT sin verificar literalmente contra circular SII | ABIERTA. No bloquea merge; corregir en iteración post-merge. |
| ALERTA-NOM-4 | PPM ProPyme 0.25% sin verificar para Conniku SpA primer año | ABIERTA. No bloquea merge; resolver antes de primera declaración F29. |

### 10.3 Gap identificado en esta auditoría que no está en ningún registro previo

| # | Gap nuevo | Propuesta de registro |
|---|---|---|
| G-01 | 6 variantes distintas de la descripción del giro 631200 | Abrir en `docs/legal/alerts.md` como ALERTA-PARAMS-01 |
| G-02 | `IVA_CHILE = 0.19` hardcoded en `chile_tax_routes.py` fuera del canónico | Abrir en `docs/pendientes.md` como item MEDIO |
| G-03 | `SII_CERT_PASSWORD` no documentada en `.env.example` | Abrir en `docs/pendientes.md` como item BAJO (no urgente hasta que DTE sea real) |
| G-04 | Ausencia de runbook de actualización de constantes | Abrir en `docs/pendientes.md` como item ALTO |
| G-05 | No hay test de UF stale ni test de ejemplo SII real (sección 6) | Abrir en `docs/pendientes.md` asociado a bloque `nomina-chile-v1` |
| G-06 | `docs/pendientes.md` sin actualizar desde 2026-04-18 | Acción administrativa: actualizar al cierre del bloque actual |

---

## Sección 11: Plan consolidado de remediación

### 11.1 Inmediato (antes del merge de bloque actual o bloque-nomina-chile-v1)

| Prioridad | Acción | Archivo | Agente responsable |
|---|---|---|---|
| CRÍTICO | Corregir tope AFP 81.6 → 90.0 UF | `backend/constants/labor_chile.py`, `shared/chile_constants.ts`, tests | frontend-builder + backend-builder (Capa 0 §21 previa: Cristian confirma D-1) |
| CRÍTICO | Eliminar objeto CHILE_LABOR inline de HRDashboard.tsx | `src/pages/HRDashboard.tsx` | frontend-builder |
| CRÍTICO | Corregir cita jurídica `remuneracionTopeUF: 90` → Art. 172 CT (no Art. 163) | `src/pages/HRDashboard.tsx`, `src/admin/shared/ChileLaborConstants.ts` | frontend-builder |
| CRÍTICO | Eliminar cita "Art. 55 CT" del tooltip de anticipo 40% | `CLAUDE.md §Visibilidad legal`, UI tooltips | Cristian (edición directa de CLAUDE.md) + frontend-builder |
| ALTO | Unificar descripción del giro 631200 con el texto oficial del SII | 6 archivos | Cristian proporciona texto oficial → frontend-builder + backend-builder |

### 11.2 Antes del primer empleado dependiente activo

| Prioridad | Acción | Archivo | Agente responsable |
|---|---|---|---|
| ALTO | Verificar y unificar IMM reducido y no-remuneracional | `shared/chile_constants.ts`, `backend/constants/labor_chile.py`, 2 archivos legacy | Cristian verifica Ley 21.751 literal → builders |
| ALTO | Resolver MUTUAL_BASE_PCT 0.93% | `backend/constants/labor_chile.py` | Cristian obtiene carta Mutual de Seguridad |
| ALTO | Agregar test de cálculo real contra tabla SII | `backend/tests/test_tax_calculation_sii.py` (nuevo) | backend-builder |
| ALTO | Escribir runbook de actualización de constantes | `docs/procedures/` (nuevo directorio) | legal-docs-keeper genera borrador |

### 11.3 Antes de primera declaración F29

| Prioridad | Acción |
|---|---|
| MEDIO | Verificar PPM ProPyme 0.25% con contador (ALERTA-NOM-4) |
| MEDIO | Importar `IVA_PCT` desde `tax_chile.py` en `chile_tax_routes.py` |

### 11.4 Cuando se expanda fuera de Chile (o al contratar primer empleado en otro país)

| Prioridad | Acción |
|---|---|
| CRÍTICO en ese momento | Implementar arquitectura multi-jurisdicción (`backend/constants/<pais>/`) |
| CRÍTICO en ese momento | Agregar campo `country_code` a tablas de empleados |
| ALTO | Implementar `getLaborConstants(countryCode)` |

### 11.5 Backlog (no urgente)

| Prioridad | Acción |
|---|---|
| BAJO | Documentar `SII_CERT_PASSWORD` en `.env.example` |
| BAJO | Eliminar `STRIPE_PRICE_MAX_MONTHLY=` deprecated del `.env.example` |
| BAJO | Actualizar `docs/pendientes.md` con issues descubiertos en bloques post-2026-04-18 |
| BAJO | Implementar UF dinámica vía API mindicador.cl + fallback (post-launch) |

---

## Protocolo de cierre — 4 secciones obligatorias

### 1. Lo que se me pidió

Cita literal: "OBJETIVO: auditoría de ASPECTOS META-PROCESO + PARÁMETROS CONNIKU-ESPECÍFICOS que podrían estar dispersos o incorrectos en el repo. [...] SCOPE: 1. Consolidación de reportes contradictorios. 2. Parámetros Conniku como empresa. 3. Configuración tributaria SII. 4. Multi-jurisdicción futura. 5. Documentación de proceso interno. 6. Tests que protegen contra regresión. 7. Rigor del workflow de actualización. 8. Verificación contra calculadora SII pública (como plan). 9. Data de configuración ambiental. 10. Deuda técnica conocida del bloque. ENTREGABLE: `/Users/cristiang./CONNIKU/docs/legal/audits/2026-04-22-meta-process-conniku-params.md` con secciones 1-11."

### 2. Lo que efectivamente hice

**Categorías auditadas**: todas las del scope (items 28-35 = secciones 1-10 del entregable).

**Comandos ejecutados y evidencia**:
- Leyí ambos reportes previos completos (`2026-04-22-chile-labor-structural-check.md` y `2026-04-22-chile-labor-constants-triple-check.md`), 926 y 608 líneas respectivamente.
- Ejecuté `grep "78395702|78\.395\.702"` en todo el repo → 47 ocurrencias en 24 archivos identificados.
- Ejecuté `grep "631200|63 12 00"` → 9 archivos con 6 variantes distintas de la descripción del giro detectadas.
- Ejecuté `grep "ProPyme|14D3|propyme"` (case-insensitive) → 40+ ocurrencias, coherencia confirmada.
- Ejecuté `grep "micro empresa|MicroEmpresa"` (case-insensitive) → 8 ocurrencias coherentes.
- Verifiqué `backend/constants/` con `ls` (Bash) y Glob → 6 archivos, ninguno es `sii_conniku.py`.
- Leí `backend/constants/tax_chile.py`, `backend/constants/labor_chile.py`, `.env.example` completos.
- Verifiqué SII en `.env.example` y `backend/chile_tax_routes.py:443-471`.
- Ejecuté `grep` para `SII_CERT_PATH|SII_CAF|SII_PASSWORD` → encontré solo las variables documentadas.
- Busqué `getLaborConstants|countryCode|peru|colombia|mexico` → infraestructura multi-país solo en currency, no en constantes laborales.
- Buscé `docs/procedures/`, `docs/how-to/`, `CONTRIBUTING.md` raíz → no existen.
- Leí tests laborales (`test_labor_chile_constants.py`, `test_tax_chile_constants.py`, `src/__tests__/chile_constants.test.ts`) completos.
- Leí `scripts/verify-chile-constants-sync.sh` completo.
- Leí `docs/pendientes.md` completo.
- Leí `docs/legal/alerts.md` parcialmente (offset 600 para alertas NOM).
- Verifiqué `IVA_CHILE = 0.19` hardcoded en `chile_tax_routes.py:21` fuera del canónico.
- Verifiqué `LEGAL_GATE_ENFORCE` en `.env.example` y `backend/auth_routes.py`.

**Cobertura**: todos los 10 ítems del scope cubiertos. El ítem 8 (calculadora SII) fue tratado como plan + propuesta de test, no como ejecución (conforme a la instrucción "como plan, no ejecutar").

### 3. Lo que no hice y por qué

- No modifiqué ningún archivo de código, documentación legal ni configuración (scope prohibido por instrucciones del gap-finder).
- No verifiqué el contenido de `src/admin/shared/__tests__/ChileLaborConstants.test.ts` en detalle (el archivo fue detectado pero no leído; el análisis de cobertura se basó en los tests del canónico).
- No verifiqué el plan `docs/plans/bloque-sandbox-integrity-v1/plan.md` en detalle para corroborar si los gaps que detecto ya están en el scope del bloque actual.
- No accedí a `docs/legal/alerts.md` completo (solo las últimas 80 líneas). Si hay alertas relevantes en las secciones anteriores, podrían no estar capturadas.
- No ejecuté los tests de los canónicos para confirmar que pasan en el estado actual del repositorio.

### 4. Incertidumbres

- Es posible que el gap de la descripción del giro 631200 sea intencionalmente distinto por contexto (un documento legal usa el texto oficial del SII, otro usa el nombre comercial de la empresa). Sin conocer el criterio de Cristian para cada contexto, la clasificación como "inconsistencia" podría ser incorrecta para algunos casos.
- Es posible que `docs/pendientes.md` ya esté desactualizado intencionalmente y exista un documento más reciente que no encontré. La búsqueda fue por archivos `.md` con nombre "pendientes" en `docs/`, pero si el archivo maestro fue renombrado, la auditoría lo habría omitido.
- La verificación de los 5 casos de prueba propuestos en Sección 8 es aritmética manual con la tabla del legal-docs-keeper. No ejecuté el cálculo contra un motor independiente, por lo que podría haber error aritmético en uno de los valores propuestos.
- La propuesta de arquitectura multi-jurisdicción en Sección 4 es una recomendación sin benchmark contra otros proyectos similares. El costo de implementación estimado (2-3 días por país) podría ser incorrecto para jurisdicciones con alta complejidad tributaria (Brasil, México CFDI).

---

## Declaración obligatoria (cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
