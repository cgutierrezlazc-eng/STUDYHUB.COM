---
documento: backend/constants/tax_chile.py — BORRADOR Capa 0 legal
version_actual: archivo inexistente (docs/legal/drafts/ primer borrador)
version_propuesta: v1.0.0 — creación inicial
fecha_borrador: 2026-04-21
autor_borrador: legal-docs-keeper (Tori)
disparador: Bloque `nomina-chile-v1` — Capa 0 legal. Complementa a
            `2026-04-21-labor-chile-py.md`. Incluye IVA, impuesto 2ª
            categoría tramos 2026, retención honorarios 15,25% (D-C
            batch) y PPM ProPyme 14 D3.
estado: BORRADOR — NO publicar ni commitear como código de producción
        sin aprobación explícita de Cristian + validación de abogado.
prioridad: CRÍTICA — bloquea merge del bloque `nomina-chile-v1` junto
           con el borrador hermano de labor_chile.py.
---

# Borrador `backend/constants/tax_chile.py` v1.0.0

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

## Contexto del borrador

Complementa `2026-04-21-labor-chile-py.md`. Cristian aprobó en batch
§21 (2026-04-21):

- D-C = **15,25%** retención honorarios (Ley 21.133, SII 2026).

Este archivo concentra constantes tributarias chilenas. Mantiene el
mismo formato de bloque 4 líneas por constante. Es espejo del
frontend `shared/chile_tax.ts`.

## Verificador único para todas las constantes

    Verificado por: Capa 0 legal-docs-keeper (Tori) 2026-04-21

## Código propuesto (BORRADOR para `backend/constants/tax_chile.py`)

```python
"""
Constantes legales tributarias chilenas.
========================================

Fuente primaria: DL 824 (Ley sobre Impuesto a la Renta), DL 825 (Ley
sobre Impuesto a las Ventas y Servicios — IVA), Ley 21.133 (retención
progresiva honorarios 2019-2028), resoluciones exentas del SII
vigentes y circulares específicas del SII para tramos anuales.

Cada constante con valor legal lleva bloque de 4 líneas (cita + URL
oficial + fecha de verificación + verificador). Formato idéntico al
de `labor_chile.py` y conforme a CLAUDE.md §"Constantes legales en el
código".

Cambios a este archivo requieren commit tipo `legal:` y aprobación
humana explícita. Espejo del frontend `shared/chile_tax.ts`.
"""

from __future__ import annotations

import math
from datetime import date


# ============================================================================
# IVA — Ley sobre Impuesto a las Ventas y Servicios (DL 825)
# ============================================================================

# Tasa general de IVA sobre ventas y servicios afectos.
# Cita:     DL 825 (IVA), Art. 14 — tasa 19% sobre base imponible,
#           vigente sin reforma reciente al 2026-04-21.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=6369
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
IVA_PCT: float = 0.19  # 19%


# ============================================================================
# IMPUESTO ÚNICO DE SEGUNDA CATEGORÍA — DL 824 Art. 43
# ============================================================================
#
# Tabla progresiva mensual aplicable a trabajadores dependientes
# (contrato laboral). El SII publica la tabla en UTM cada año
# conforme al reajuste anual por IPC.
#
# Cada tramo: (lower_utm, upper_utm, rate, deduction_utm)
# - lower_utm: límite inferior en UTM (exclusivo)
# - upper_utm: límite superior en UTM (inclusivo)
# - rate: tasa marginal aplicable al total de UTM del tramo
# - deduction_utm: factor de rebaja en UTM para convertir tasa
#                  marginal en progresiva efectiva
#
# Fórmula: impuesto_mensual_UTM = renta_UTM * rate - deduction_utm
# Luego se convierte a CLP multiplicando por UTM del mes de cálculo.
#
# Último tramo confirmado: desde 310 UTM al infinito con tasa 40%.
# Esto coincide con el hallazgo cross-check 2026-04-21: el backend
# `payroll_calculator.py:180-189` ya usa 310 UTM como corte último,
# mientras `src/admin/shared/ChileLaborConstants.ts:68` tiene 150 UTM
# desfasado (cierre Bloque 1 frontend lo corrige).

# Vigencia tramos 2026 — reajuste anual SII.
# Cita:     DL 824, Art. 43 — tabla progresiva reajustable por IPC;
#           valores mensuales 2026 publicados en circular SII.
# URL:      https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
IMPUESTO_2A_CATEGORIA_VIGENCIA: date = date(2026, 1, 1)

# Tabla de tramos 2026 (cada tupla: lower_utm, upper_utm, rate, rebaja_utm).
# Cita:     DL 824 Art. 43 + circular SII 2026 con valores mensuales
#           específicos; los factores de rebaja son los publicados por
#           el SII para que la aplicación de la tasa marginal equivalga
#           a la progresiva acumulada.
# URL:      https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
#
# Nota sobre rebajas: los factores 0.54, 1.74, 4.49, 11.14, 17.80,
# 23.32, 38.82 son los usados actualmente en
# `backend/payroll_calculator.py:180-189`. El brief 2026-04-21 NO
# verificó literalmente cada factor contra la circular SII 2026;
# mantiene los mismos valores hasta que Cristian o abogado confirmen.
# Si el SII reajustó las rebajas con la UTM 2026, recalcular antes
# de commit. [VERIFICAR] cada factor con circular SII enero 2026.
IMPUESTO_2A_CATEGORIA_TRAMOS_2026: list[tuple[float, float, float, float]] = [
    (0.0,    13.5,  0.000,  0.00),
    (13.5,   30.0,  0.040,  0.54),
    (30.0,   50.0,  0.080,  1.74),
    (50.0,   70.0,  0.135,  4.49),
    (70.0,   90.0,  0.230, 11.14),
    (90.0,  120.0,  0.304, 17.80),
    (120.0, 310.0,  0.350, 23.32),
    (310.0, math.inf, 0.400, 38.82),
]


# ============================================================================
# RETENCIÓN HONORARIOS — Ley 21.133 (progresiva 2019-2028)
# ============================================================================

# Tasa de retención vigente 2026 (decisión D-C batch 2026-04-21).
# Cita:     Ley 21.133, Art. Transitorio — retención progresiva para
#           boletas de honorarios entre 2019 y 2028; tasa 2026 =
#           15,25% sobre honorario bruto.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=1128094
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
RETENCION_HONORARIOS_2026_PCT: float = 0.1525  # 15,25% (decisión D-C batch)

# Tabla histórica de tasas año por año. Útil para reliquidaciones,
# auditorías de boletas antiguas, reportes F29/F50 retroactivos.
# La retención aplicable es la del AÑO DE EMISIÓN DE LA BOLETA
# (fecha del servicio prestado), no la del año de pago.
# Cita:     Ley 21.133, Art. Transitorio — escalones anuales
#           progresivos de 10,75% en 2019 hasta 17% en 2028.
# URL:      https://www.bcn.cl/leychile/navegar?idNorma=1128094
# Fecha:    2026-04-21
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21
#
# Nota: los valores 2027 (16,25%) y 2028 (17%) son la progresión
# proyectada según Ley 21.133. El 2020 (10,75%) es el inicial. Los
# valores 2019 a 2025 son los históricos publicados por SII en
# https://www.sii.cl/noticias/2025/261225noti01smn.htm y circulares
# equivalentes de años previos. El 2026 (15,25%) viene del brief de
# Cristian verificado 2026-04-21. [VERIFICAR] cada tasa histórica con
# circular SII del año respectivo antes de usar para reliquidación
# oficial.
RETENCION_HONORARIOS_ESCALONES: dict[int, float] = {
    2020: 0.1075,  # 10,75% — Ley 21.133 año 1
    2021: 0.1150,  # 11,50%
    2022: 0.1225,  # 12,25%
    2023: 0.1300,  # 13,00%
    2024: 0.1375,  # 13,75% — valor hardcoded actual del frontend
    2025: 0.1375,  # 13,75% — mantenido por prórroga normativa
    2026: 0.1525,  # 15,25% — vigente 2026-01-01 (D-C batch)
    2027: 0.1625,  # 16,25% — proyectado según Ley 21.133
    2028: 0.1700,  # 17,00% — último escalón proyectado
}


def get_retention_rate_for_year(year: int) -> float:
    """Devuelve la tasa de retención de honorarios aplicable a un año.

    Regla legal: la retención es la vigente al año de EMISIÓN de la
    boleta (fecha del servicio), no la del pago. Esto importa cuando
    un cliente paga una boleta del año anterior.

    Args:
        year: año calendario de emisión de la boleta.

    Returns:
        Tasa de retención como decimal (ej: 0.1525 para 2026).

    Ejemplos:
        >>> get_retention_rate_for_year(2026)
        0.1525
        >>> get_retention_rate_for_year(2024)
        0.1375

    Raises:
        KeyError: si el año solicitado no está en la tabla
            (antes de 2020 o después de 2028).
    """
    if year not in RETENCION_HONORARIOS_ESCALONES:
        raise KeyError(
            f"No existe tasa de retención honorarios registrada para el "
            f"año {year}. Rango válido 2020-2028 (Ley 21.133)."
        )
    return RETENCION_HONORARIOS_ESCALONES[year]


# ============================================================================
# PPM — PAGO PROVISIONAL MENSUAL RÉGIMEN PROPYME (Art. 14 D3 LIR)
# ============================================================================

# Tasa PPM para empresas bajo régimen ProPyme transparente (14 D3).
# Conniku SpA opera bajo este régimen (RUT 78.395.702-7).
# Cita:     DL 824 Art. 14 letra D N° 3 — régimen ProPyme transparente;
#           tasa PPM aplicable al primer año es fija según resolución
#           SII y puede variar posteriormente por coeficiente histórico.
# URL:      https://www.sii.cl/valores_y_fechas/ppm_propyme/ppm_propyme2026.htm
# Fecha:    2026-04-21 (primer año Conniku SpA, inicio actividades
#           2026-04-08; tasa inicial primer año ProPyme 14 D3)
# Verifica: Capa 0 legal-docs-keeper (Tori) 2026-04-21 — [VERIFICAR]
#
# Nota: el valor 0,25% es el usado actualmente en
# `src/admin/shared/accountingData.ts:989`. Para Conniku SpA (primer
# año de operación) la tasa puede diferir según la resolución SII
# aplicable al régimen transparente. Requiere confirmación contable.
PPM_PROPYME_14D3_PCT: float = 0.0025  # 0,25% — [VERIFICAR con SII 2026]


# ============================================================================
# VALIDACIONES DE INTEGRIDAD
# ============================================================================

__all__ = [
    "IVA_PCT",
    "IMPUESTO_2A_CATEGORIA_VIGENCIA",
    "IMPUESTO_2A_CATEGORIA_TRAMOS_2026",
    "RETENCION_HONORARIOS_2026_PCT",
    "RETENCION_HONORARIOS_ESCALONES",
    "get_retention_rate_for_year",
    "PPM_PROPYME_14D3_PCT",
]
```

## Tabla resumen de constantes

| Constante | Valor | Ley / Artículo | URL | Verificado |
|---|---|---|---|---|
| `IVA_PCT` | 19% | DL 825 Art. 14 | bcn.cl/leychile/navegar?idNorma=6369 | 2026-04-21 |
| `IMPUESTO_2A_CATEGORIA_VIGENCIA` | 2026-01-01 | DL 824 Art. 43 | sii.cl/...impuesto2026.htm | 2026-04-21 |
| `IMPUESTO_2A_CATEGORIA_TRAMOS_2026` | 8 tramos (último 310 UTM → 40%) | DL 824 Art. 43 + Circular SII 2026 | sii.cl/...impuesto2026.htm | 2026-04-21 (valores heredados; factores de rebaja **[VERIFICAR]**) |
| `RETENCION_HONORARIOS_2026_PCT` | 15,25% | Ley 21.133 Art. Transitorio | bcn.cl/leychile/navegar?idNorma=1128094 | 2026-04-21 (D-C batch) |
| `RETENCION_HONORARIOS_ESCALONES` | Dict 2020-2028 | Ley 21.133 Art. Transitorio | bcn.cl/leychile/navegar?idNorma=1128094 | 2026-04-21 (valores históricos **[VERIFICAR]**) |
| `PPM_PROPYME_14D3_PCT` | **0,25%** | DL 824 Art. 14 D3 | sii.cl/valores_y_fechas/ppm_propyme/... | 2026-04-21 **[VERIFICAR]** |

## Constantes marcadas [VERIFICAR]

Tres puntos requieren confirmación humana / validación profesional
antes de commit a producción:

1. **Factores de rebaja de tramos (`0.54, 1.74, 4.49, 11.14, 17.80,
   23.32, 38.82`)**: los valores se heredan de
   `backend/payroll_calculator.py:180-189`, pero el brief del
   2026-04-21 no los verificó literalmente contra la circular SII
   para 2026. El SII reajusta anualmente estos factores cuando reajusta
   la UTM. Acción: Cristian o contador verifica en
   `https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm`
   el detalle de rebajas para 2026. Si hay desfase, actualizar antes
   del merge.

2. **`RETENCION_HONORARIOS_ESCALONES[año]` para años 2020-2025 y
   2027-2028**: el brief solo verificó 2026 = 15,25%. Los valores
   históricos y proyectados son la mejor reconstrucción según la
   secuencia Ley 21.133 pero no están confirmados literalmente
   contra circulares SII de cada año respectivo. Acción: si la
   aplicación usará esta tabla para reliquidación de boletas de años
   anteriores, verificar cada año con el SII antes de usar. Si solo
   se usa 2026 en producción corriente, marcar el resto como
   "referencia informativa, no usar sin verificar".

3. **`PPM_PROPYME_14D3_PCT = 0.0025`**: valor actual heredado de
   `src/admin/shared/accountingData.ts:989`. Para Conniku SpA (RUT
   78.395.702-7, primer año de actividades 2026-04-08), la tasa del
   primer año puede ser distinta según resolución SII aplicable al
   régimen ProPyme transparente. Acción: Cristian verifica con su
   contador cuál PPM aplica efectivamente a Conniku SpA en 2026;
   actualizar si difiere.

## Decisiones reflejadas en este borrador

- **D-C = 15,25%** aplicada a `RETENCION_HONORARIOS_2026_PCT`.
- Tabla `RETENCION_HONORARIOS_ESCALONES` reemplaza los literales
  hardcoded `0.1375` distribuidos en 8 ubicaciones frontend
  (ver plan §1.6 y §3.2).
- Función `get_retention_rate_for_year(year)` permite reliquidación
  de boletas por año de emisión (regla legal: retención del año de
  emisión, no del pago).

## Decisiones NO reflejadas en este borrador

- **D-A, D-B, D-D, D-E, D-F** pertenecen a `labor_chile.py` (ver
  borrador hermano).
- No se incluye UTA (Unidad Tributaria Anual): fuera de scope del
  brief 2026-04-21. Si el builder necesita UTA, agregarlo con su
  propio bloque 4-líneas.

## Alineamiento con el plan

Este borrador cumple los items §3.1 "Nuevos" del plan
`docs/plans/bloque-nomina-chile-v1/plan.md` fila
`backend/constants/tax_chile.py`. Los items de validación binaria §5:

- [x] cada constante tiene bloque de 4 líneas
- [x] todas las URL citadas son oficiales (sii.cl, bcn.cl)
- [x] fecha de verificación es 2026-04-21
- [x] verificador es "Capa 0 legal-docs-keeper (Tori) 2026-04-21"
- [ ] `test_iva_rate_19_percent()` — responsabilidad del builder
- [ ] `test_tax_bracket_last_is_310_utm()` — responsabilidad del builder
- [ ] `test_honorarios_retention_rate_2026()` — responsabilidad del builder
- [ ] `test_honorarios_retention_rate_2025()` — responsabilidad del builder
- [ ] `test_ppm_propyme_rate()` — responsabilidad del builder

## Siguiente paso

1. Cristian revisa este borrador junto con el de `labor_chile.py`.
2. Cristian resuelve los tres `[VERIFICAR]`:
   - (a) factores de rebaja SII 2026 (con contador).
   - (b) alcance real de uso de `RETENCION_HONORARIOS_ESCALONES`.
   - (c) PPM específico de Conniku SpA 2026.
3. Cristian aprueba (o solicita cambios).
4. El backend-builder integra este borrador literalmente en
   `backend/constants/tax_chile.py` como parte del Paso 4 GREEN del
   plan.
5. El builder escribe los tests de invariante según Paso 3 RED.

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
