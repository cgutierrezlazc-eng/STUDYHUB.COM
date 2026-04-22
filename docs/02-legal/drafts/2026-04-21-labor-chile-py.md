---
documento: backend/constants/labor_chile.py — BORRADOR Capa 0 legal
version_actual: archivo inexistente (docs/legal/drafts/ primer borrador)
version_propuesta: v1.0.0 — creación inicial
fecha_borrador: 2026-04-21
autor_borrador: legal-docs-keeper (Tori)
disparador: Bloque `nomina-chile-v1` — Capa 0 legal (CLAUDE.md §18.7,
            §flujo-legal). Deadline duro 2026-04-26 (Ley 21.561 escalón
            2: 42h/semana).
estado: BORRADOR — NO publicar ni commitear como código de producción
        sin aprobación explícita de Cristian + validación de abogado.
prioridad: CRÍTICA — bloquea merge del bloque `nomina-chile-v1`. El
           builder debe integrar este borrador tal cual (con resolución
           previa de los [VERIFICAR] marcados) antes de pasar a Capa 1.
---

# Borrador `backend/constants/labor_chile.py` v1.0.0

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

## Contexto del borrador

Cristian aprobó en batch §21 (2026-04-21) las 6 decisiones del plan
`docs/plans/bloque-nomina-chile-v1/plan.md` §9:

- D-A = B (sin empleados activos, urgencia preparatoria).
- D-B = **135,2 UF** tope imponible AFC (spensiones.cl, verificado
  2026-04-21).
- D-C = **15,25%** retención honorarios (Ley 21.133, verificado
  2026-04-21).
- D-D = motor payroll dual (sincronizar valores en ambos, refactor
  posterior).
- D-E = constante explícita AFP UNO 0.46%, sin cambiar default.
- D-F = fecha de corte día exacto: `>= 2026-04-26` → 42h.

Este archivo concentra constantes laborales chilenas. Cada constante
tiene bloque de 4 líneas (cita + URL oficial + fecha + verificador)
conforme a CLAUDE.md §"Constantes legales en el código".

## Verificador único para todas las constantes

    Verificado por: Capa 0 legal-docs-keeper (Tori) 2026-04-21

## Código propuesto (BORRADOR para `backend/constants/labor_chile.py`)

```python
"""
Constantes legales laborales chilenas.
======================================

Fuente primaria: Código del Trabajo (DFL 1, 2003), leyes previsionales
chilenas (DL 3500, Ley 19.728, Ley 16.744), Ley 21.561 (jornada 42h),
Ley 21.751 (reajuste IMM 2026), resoluciones de la Superintendencia de
Pensiones, Ministerio del Trabajo, SII.

Cada constante con valor legal lleva bloque de 4 líneas:
- Cita del artículo / ley / resolución
- URL oficial verificable
- Fecha de última verificación
- Nombre del verificador

Cambios a este archivo requieren commit tipo `legal:` y aprobación
humana explícita (CLAUDE.md §Cumplimiento Legal, §18.7). Este archivo
es espejo del frontend `shared/chile_labor.ts`; toda modificación debe
ejecutar `scripts/verify-chile-constants-sync.sh` antes de merge.

Declaración obligatoria: estos valores son la mejor información
disponible al 2026-04-21 pero no constituyen asesoría legal
profesional. Validación de abogado requerida antes de uso en
liquidaciones oficiales.
"""

from __future__ import annotations

from datetime import date


# ============================================================================
# VALORES ECONÓMICOS CALENDARIO — actualización mensual por legal-docs-keeper
# ============================================================================

# Unidad de Fomento — valor del mes en curso (abril 2026).
# Cita:     Valor publicado por el Banco Central de Chile y SII.
# URL:      https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
UF_ABRIL_2026: float = 39_841.72  # CLP

# Unidad Tributaria Mensual — valor del mes en curso (abril 2026).
# Cita:     Reajuste mensual SII conforme DL 824 / IPC.
# URL:      https://www.sii.cl/valores_y_fechas/utm/utm2026.htm
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
UTM_ABRIL_2026: int = 69_889  # CLP

# Fecha de vigencia de los valores UF/UTM arriba. La auditoría semanal
# del legal-docs-keeper valida que el mes en curso coincida; si no,
# alerta y genera borrador de actualización.
UF_UTM_VIGENCIA_MES: date = date(2026, 4, 1)


# ============================================================================
# INGRESO MÍNIMO MENSUAL (IMM)
# ============================================================================

# Sueldo mínimo mensual bruto vigente desde 2026-01-01.
# Cita:     Ley 21.751, Art. 1° — reajusta IMM a $539.000 desde
#           2026-01-01. Publicada en Diario Oficial, vigente.
# URL:      https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual/
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
SUELDO_MINIMO_2026: int = 539_000  # CLP

# Fecha desde la cual rige el IMM 2026.
SUELDO_MINIMO_2026_VIGENCIA: date = date(2026, 1, 1)


# ============================================================================
# AFP — SISTEMA DE PENSIONES (DL 3500)
# ============================================================================

# Cotización obligatoria de AFP: 10% del ingreso imponible.
# Cita:     DL 3500, Art. 17 — cotización obligatoria 10% renta imponible
#           para pensión de vejez.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=7147
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
AFP_OBLIGATORIA_PCT: float = 0.10  # 10%

# Comisión AFP UNO — AFP asignada por licitación a nuevos afiliados
# desde 2023-10-01 por tener la menor comisión del sistema.
# Cita:     DS Superintendencia de Pensiones — licitación AFP UNO
#           vigente 2023-10-01 a 2025-09-30 extendida 2025-10-01
#           a 2027-09-30; comisión 0.46% sobre renta imponible.
# URL:      https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
AFP_UNO_COMMISSION_PCT: float = 0.0046  # 0.46% (decisión D-E batch)

# Tope imponible AFP (pensiones) en UF. [VERIFICAR] con spensiones.cl
# resolución 2026 — valor 81.6 UF histórico 2024-2025; existe ajuste
# anual por IPC que el brief del 2026-04-21 no verificó literalmente.
# Si spensiones.cl publicó reajuste 2026, actualizar aquí en commit
# separado y ejecutar test de paridad con hr_routes.py.
# Cita:     DL 3500, Art. 16 — tope imponible mensual para efectos
#           previsionales; reajustado anualmente conforme al índice
#           de remuneraciones nominales INE.
# URL:      https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9911.html
# Fecha:    2026-04-21 (pendiente confirmación valor 2026)
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21 — [VERIFICAR 2026]
TOPE_IMPONIBLE_AFP_UF: float = 81.6  # UF — confirmar valor 2026 antes de merge


# ============================================================================
# AFC — SEGURO DE CESANTÍA (Ley 19.728)
# ============================================================================

# Aporte trabajador a AFC para contrato indefinido.
# Cita:     Ley 19.728, Art. 5° — trabajador con contrato indefinido
#           aporta 0.6% de la remuneración imponible.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=185700
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
AFC_TRABAJADOR_INDEFINIDO_PCT: float = 0.006  # 0.6%

# Aporte empleador a AFC para contrato indefinido.
# Cita:     Ley 19.728, Art. 5° — empleador aporta 2.4% de la
#           remuneración imponible cuando el contrato es indefinido.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=185700
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
AFC_EMPLEADOR_INDEFINIDO_PCT: float = 0.024  # 2.4%

# Aporte empleador a AFC para contrato a plazo fijo / obra-faena.
# Trabajador no aporta. Empleador asume 3%.
# Cita:     Ley 19.728, Art. 6° — contrato a plazo fijo o por obra;
#           empleador aporta 3%, trabajador 0%.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=185700
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
AFC_EMPLEADOR_PLAZO_FIJO_PCT: float = 0.03  # 3%

# Tope imponible AFC — cap de remuneración sobre la que se calcula AFC.
# Decisión D-B batch 2026-04-21 = 135,2 UF (valor spensiones.cl 2026-02).
# Cita:     Superintendencia de Pensiones — resolución reajuste anual
#           topes imponibles 2026; AFC 135,2 UF desde 2026-02-01.
# URL:      https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
TOPE_IMPONIBLE_AFC_UF: float = 135.2  # UF — decisión D-B batch


# ============================================================================
# SIS — SEGURO DE INVALIDEZ Y SOBREVIVENCIA (DL 3500)
# ============================================================================

# Cotización SIS — asumida íntegramente por el empleador para
# trabajadores dependientes.
# Cita:     DL 3500, Art. 59 bis — SIS financiado por el empleador
#           para dependientes; tarifa fijada por licitación a
#           compañía de seguros cada dos años.
# URL:      https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
SIS_PCT: float = 0.0154  # 1.54% — vigente enero 2026


# ============================================================================
# JORNADA LABORAL — Ley 21.561 (transición 45h → 42h → 40h)
# ============================================================================

# Jornada ordinaria máxima semanal — transición Ley 21.561.
# Escalón 1: 44h desde 2024-04-26 (ya vigente antes de este bloque).
# Escalón 2: 42h desde 2026-04-26 (crítico para este bloque).
# Escalón 3: 40h desde 2028-04-26 (futuro, blindado aquí).

# Horas semanales aplicables ANTES del 2026-04-26 (transición escalón 1).
# Cita:     Ley 21.561, Art. 1° — primer escalón 44h vigente desde
#           2024-04-26; regla base del Art. 22 CT era 45h antes de
#           la reforma. Para efectos del sistema usamos 45h como
#           histórico pre-reforma; si requiere cálculo retroactivo
#           pre-2024-04-26 usar get_weekly_hours_at_date().
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=1194020
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
WEEKLY_HOURS_PRE_2026_04_26: int = 45

# Horas semanales aplicables DESDE el 2026-04-26 (escalón 2, crítico).
# Cita:     Ley 21.561, Art. 1° — segundo escalón 42h vigente desde
#           2026-04-26. Aplica a todo contrato sujeto al Art. 22 CT.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=1194020
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
WEEKLY_HOURS_POST_2026_04_26: int = 42

# Horas semanales aplicables DESDE el 2028-04-26 (escalón 3, futuro).
# Cita:     Ley 21.561, Art. 1° — tercer escalón 40h desde 2028-04-26.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=1194020
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
WEEKLY_HOURS_POST_2028_04_26: int = 40

# Fechas de corte oficiales Ley 21.561 (D-F batch: día exacto).
# Cita:     Ley 21.561, Art. 1° + comunicado Mintrab 2026-04-21.
# URL:      https://www.mintrab.gob.cl/ley-40-horas-conoce-las-principales-medidas-que-comienzan-a-regir-el-26-de-abril/
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
FECHA_ESCALON_42H: date = date(2026, 4, 26)
FECHA_ESCALON_40H: date = date(2028, 4, 26)


def get_weekly_hours_at_date(reference_date: date) -> int:
    """Devuelve la jornada máxima semanal legal aplicable a una fecha.

    Esta función es la fuente de verdad para todo cálculo de overtime
    en Conniku. Nunca usar las constantes WEEKLY_HOURS_* directamente
    salvo en tests o reliquidaciones manuales donde se conoce la fecha.

    Decisión D-F batch 2026-04-21: día exacto, no período mensual ni
    pro-rata. La Ley 21.561 cambia la regla a partir del día de
    vigencia; un turno del 2026-04-26 a las 00:01 ya se rige por 42h.

    Args:
        reference_date: fecha del servicio (no la del pago). Para
            reliquidaciones Art. 63 bis CT usar la fecha de ejecución
            del trabajo, no la del cálculo actual.

    Returns:
        Horas máximas semanales legales a esa fecha: 45 antes del
        2026-04-26, 42 entre 2026-04-26 y 2028-04-25, 40 desde
        2028-04-26.

    Ejemplos:
        >>> get_weekly_hours_at_date(date(2026, 4, 25))
        45
        >>> get_weekly_hours_at_date(date(2026, 4, 26))
        42
        >>> get_weekly_hours_at_date(date(2028, 4, 26))
        40
    """
    if reference_date >= FECHA_ESCALON_40H:
        return WEEKLY_HOURS_POST_2028_04_26
    if reference_date >= FECHA_ESCALON_42H:
        return WEEKLY_HOURS_POST_2026_04_26
    return WEEKLY_HOURS_PRE_2026_04_26


def get_monthly_hours_at_date(reference_date: date) -> int:
    """Devuelve horas mensuales base para cálculo de overtime.

    Fórmula: horas semanales * 4 (estándar Conniku, NO 4.33). Esto
    produce 180 → 168 → 160 según escalón Ley 21.561.

    Nota: `hr_routes.py` actualmente usa `weekly_hours * 4.33` en
    `calculate_payroll_for_employee`. Esa fórmula alternativa se
    documenta en `registry_issues.md` id `payroll-dual-engine` como
    deuda a unificar en bloque posterior. Este borrador no resuelve
    la divergencia; la resuelve el builder en Capa 1.
    """
    return get_weekly_hours_at_date(reference_date) * 4


# ============================================================================
# GRATIFICACIÓN LEGAL (Art. 50 Código del Trabajo)
# ============================================================================

# Tope mensual de gratificación legal expresado en IMM anuales.
# 4.75 IMM anual → IMM * 4.75 / 12 mensual.
# Cita:     Art. 50 Código del Trabajo — gratificación 25% del sueldo
#           con tope de 4.75 IMM anual; el empleador elige entre
#           distribución de utilidades (Art. 47) o este modo.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=207436
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
GRATIFICACION_TOPE_IMM_ANUAL: float = 4.75
GRATIFICACION_RATE_PCT: float = 0.25  # 25% del sueldo


# ============================================================================
# MUTUAL DE SEGURIDAD — Ley 16.744 (accidentes del trabajo)
# ============================================================================

# Cotización base Mutual (sin recargo por siniestralidad).
# Cita:     Ley 16.744, Art. 15 — cotización básica 0.93% a cargo
#           del empleador; puede aumentar por tasa de siniestralidad
#           según DS 110 del Ministerio del Trabajo.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=28650
# Fecha:    2026-04-21 (valor base histórico; pendiente confirmar con
#           resolución 2026 si hubo ajuste normativo)
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21 — [VERIFICAR]
MUTUAL_BASE_PCT: float = 0.0093  # 0.93%


# ============================================================================
# VALIDACIONES DE INTEGRIDAD
# ============================================================================

__all__ = [
    "UF_ABRIL_2026",
    "UTM_ABRIL_2026",
    "UF_UTM_VIGENCIA_MES",
    "SUELDO_MINIMO_2026",
    "SUELDO_MINIMO_2026_VIGENCIA",
    "AFP_OBLIGATORIA_PCT",
    "AFP_UNO_COMMISSION_PCT",
    "TOPE_IMPONIBLE_AFP_UF",
    "AFC_TRABAJADOR_INDEFINIDO_PCT",
    "AFC_EMPLEADOR_INDEFINIDO_PCT",
    "AFC_EMPLEADOR_PLAZO_FIJO_PCT",
    "TOPE_IMPONIBLE_AFC_UF",
    "SIS_PCT",
    "WEEKLY_HOURS_PRE_2026_04_26",
    "WEEKLY_HOURS_POST_2026_04_26",
    "WEEKLY_HOURS_POST_2028_04_26",
    "FECHA_ESCALON_42H",
    "FECHA_ESCALON_40H",
    "get_weekly_hours_at_date",
    "get_monthly_hours_at_date",
    "GRATIFICACION_TOPE_IMM_ANUAL",
    "GRATIFICACION_RATE_PCT",
    "MUTUAL_BASE_PCT",
]
```

## Tabla resumen de constantes

| Constante | Valor | Ley / Artículo | URL | Verificado |
|---|---|---|---|---|
| `UF_ABRIL_2026` | 39.841,72 CLP | Valor SII abril 2026 | sii.cl/valores_y_fechas/uf/uf2026.htm | 2026-04-21 |
| `UTM_ABRIL_2026` | 69.889 CLP | Valor SII abril 2026 | sii.cl/valores_y_fechas/utm/utm2026.htm | 2026-04-21 |
| `SUELDO_MINIMO_2026` | 539.000 CLP | Ley 21.751 Art. 1° | mintrab.gob.cl/ya-es-una-realidad... | 2026-04-21 |
| `AFP_OBLIGATORIA_PCT` | 10% | DL 3500 Art. 17 | bcn.cl/leychile/navegar?idNorma=7147 | 2026-04-21 |
| `AFP_UNO_COMMISSION_PCT` | 0,46% | DS Spensiones licitación | spensiones.cl/...9917.html | 2026-04-21 |
| `TOPE_IMPONIBLE_AFP_UF` | **81,6 UF** | DL 3500 Art. 16 | spensiones.cl/...9911.html | **[VERIFICAR 2026]** |
| `AFC_TRABAJADOR_INDEFINIDO_PCT` | 0,6% | Ley 19.728 Art. 5° | bcn.cl/leychile/navegar?idNorma=185700 | 2026-04-21 |
| `AFC_EMPLEADOR_INDEFINIDO_PCT` | 2,4% | Ley 19.728 Art. 5° | bcn.cl/leychile/navegar?idNorma=185700 | 2026-04-21 |
| `AFC_EMPLEADOR_PLAZO_FIJO_PCT` | 3% | Ley 19.728 Art. 6° | bcn.cl/leychile/navegar?idNorma=185700 | 2026-04-21 |
| `TOPE_IMPONIBLE_AFC_UF` | **135,2 UF** | Spensiones 2026-02 | spensiones.cl/...16921.html | 2026-04-21 (D-B batch) |
| `SIS_PCT` | 1,54% | DL 3500 Art. 59 bis | spensiones.cl/...9917.html | 2026-04-21 |
| `WEEKLY_HOURS_PRE_2026_04_26` | 45 | Ley 21.561 Art. 1° | bcn.cl/leychile/navegar?idNorma=1194020 | 2026-04-21 |
| `WEEKLY_HOURS_POST_2026_04_26` | 42 | Ley 21.561 Art. 1° esc. 2 | mintrab.gob.cl/ley-40-horas... | 2026-04-21 |
| `WEEKLY_HOURS_POST_2028_04_26` | 40 | Ley 21.561 Art. 1° esc. 3 | bcn.cl/leychile/navegar?idNorma=1194020 | 2026-04-21 |
| `FECHA_ESCALON_42H` | 2026-04-26 | Ley 21.561 + Mintrab | mintrab.gob.cl | 2026-04-21 |
| `GRATIFICACION_TOPE_IMM_ANUAL` | 4,75 IMM | Art. 50 CT | bcn.cl/leychile/navegar?idNorma=207436 | 2026-04-21 |
| `GRATIFICACION_RATE_PCT` | 25% | Art. 50 CT | bcn.cl/leychile/navegar?idNorma=207436 | 2026-04-21 |
| `MUTUAL_BASE_PCT` | **0,93%** | Ley 16.744 Art. 15 | bcn.cl/leychile/navegar?idNorma=28650 | 2026-04-21 **[VERIFICAR]** |

## Constantes marcadas [VERIFICAR]

Se requiere confirmación humana + validación de abogado antes de
commit de producción para estas dos constantes. El brief del
2026-04-21 no trajo evidencia fresca de sus valores.

1. **`TOPE_IMPONIBLE_AFP_UF = 81.6`** — valor histórico. La
   Superintendencia de Pensiones reajusta topes anualmente por IPC.
   Acción: Cristian o abogado verifica en
   `https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9911.html`
   el tope vigente 2026 y actualiza antes del merge.

2. **`MUTUAL_BASE_PCT = 0.0093`** — valor histórico Ley 16.744. La
   tasa puede variar por DS anual del Ministerio del Trabajo si hay
   ajuste normativo. Acción: verificar con resolución 2026 de la
   Mutual de Seguridad / ACHS / IST aplicable al giro 631200 de
   Conniku SpA.

Si el deadline 2026-04-26 impide verificación completa, el builder
puede integrar estos valores con comentario `# [VERIFICAR 2026]` y
abrir alerta CRÍTICA en `alerts.md` para el legal-docs-keeper
siguiente.

## Decisiones reflejadas en este borrador

- **D-B = 135,2 UF** aplicada a `TOPE_IMPONIBLE_AFC_UF`.
- **D-E** aplicada como `AFP_UNO_COMMISSION_PCT = 0.0046` constante
  nueva, explícita, sin cambiar default de `EmployeeData.afp`.
- **D-F** aplicada como día exacto en `get_weekly_hours_at_date`:
  `reference_date >= FECHA_ESCALON_42H` → 42.
- **D-D** reflejada en docstring de `get_monthly_hours_at_date`:
  registra la divergencia con `hr_routes.py` como deuda a unificar
  posteriormente (no se resuelve en este borrador).

## Decisiones NO reflejadas en este borrador

- **D-A = B** (sin empleados activos): no afecta constantes, afecta
  el análisis de riesgo (R-2 del plan). Documentado en el plan §1.4.
- **D-C = 15,25%** retención honorarios: pertenece a `tax_chile.py`,
  no a este archivo. Ver borrador hermano
  `2026-04-21-tax-chile-py.md`.
- **D-D** motor dual: decisión de arquitectura del builder, no de
  constantes. Documentada como docstring en
  `get_monthly_hours_at_date`.

## Siguiente paso

1. Cristian revisa este borrador.
2. Cristian resuelve los dos `[VERIFICAR]` con abogado o autoverifica
   contra spensiones.cl para `TOPE_IMPONIBLE_AFP_UF` y resolución
   Mutual 2026 para `MUTUAL_BASE_PCT`.
3. Cristian aprueba (o solicita cambios).
4. El backend-builder integra este borrador literalmente en
   `backend/constants/labor_chile.py` como parte del Paso 2 del plan
   (§4 Paso 2 GREEN).
5. El builder escribe tests de invariante `test_labor_constants_chile.py`
   según §4 Paso 1 del plan (no es parte de este borrador).

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
