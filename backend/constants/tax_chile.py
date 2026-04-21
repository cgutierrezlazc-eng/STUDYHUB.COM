"""Constantes tributarias chilenas con vigencia 2026.

Cada constante tiene bloque de 4 líneas de cita legal obligatorio
según CLAUDE.md §Constantes legales en el código.

Tarea de actualización anual: IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM
se verifica cada enero contra la circular SII del año vigente.
"""

from __future__ import annotations

from decimal import Decimal

# ---------------------------------------------------------------------------
# IVA
# ---------------------------------------------------------------------------

# IVA (Impuesto al Valor Agregado): 19% sobre precio neto
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=14407 (DL 825 Art. 14)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
IVA_PCT: Decimal = Decimal("0.19")

# ---------------------------------------------------------------------------
# Retención boleta de honorarios
# ---------------------------------------------------------------------------

# Retención boleta de honorarios vigente 2026: 15.25%
# Progresión Ley 21.133 Art. Transitorio: 2026 = 15.25%
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1128094 (Ley 21.133)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21, D-C aprobado)
RETENCION_HONORARIOS_2026_PCT: Decimal = Decimal("0.1525")

# ---------------------------------------------------------------------------
# PPM ProPyme
# ---------------------------------------------------------------------------

# Pago Provisional Mensual (PPM) régimen ProPyme 14D3 transparente: 0.25%
# Fuente: https://www.sii.cl/normativa_legislacion/circulares/2020/circu80.pdf
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
PPM_PROPYME_14D3_PCT: Decimal = Decimal("0.0025")

# ---------------------------------------------------------------------------
# Tabla impuesto único de 2ª categoría — vigencia 2026
#
# Formato de cada tramo (tuple de 4 Decimal):
#   (limite_inferior_utm, limite_superior_utm | None, tasa, factor_deduccion_utm)
#
# El factor_deduccion (crédito acumulado) hace que la tabla sea equivalente
# a aplicar la tasa marginal solo al tramo correspondiente.
# El último tramo tiene límite superior None (sin tope).
#
# Fuente: https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
# ---------------------------------------------------------------------------
IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM: list[tuple[Decimal, Decimal | None, Decimal, Decimal]] = [
    (Decimal("0"), Decimal("13.5"), Decimal("0"), Decimal("0")),
    (Decimal("13.5"), Decimal("30"), Decimal("0.04"), Decimal("0.54")),
    (Decimal("30"), Decimal("50"), Decimal("0.08"), Decimal("1.74")),
    (Decimal("50"), Decimal("70"), Decimal("0.135"), Decimal("4.49")),
    (Decimal("70"), Decimal("90"), Decimal("0.23"), Decimal("11.14")),
    (Decimal("90"), Decimal("120"), Decimal("0.304"), Decimal("17.80")),
    (Decimal("120"), Decimal("310"), Decimal("0.35"), Decimal("23.32")),
    (Decimal("310"), None, Decimal("0.40"), Decimal("38.82")),
]
