"""Constantes legales y de negocio centralizadas.

Según CLAUDE.md §Constantes legales en el código, cualquier valor con base
legal (tasa AFP, plazo de retracto, tope imponible, tramo de impuesto) debe
vivir en este paquete con comentario de fuente.

Formato obligatorio para cada constante:
- Cita del artículo y ley
- URL de fuente oficial verificable
- Fecha de última verificación
- Nombre de quien verificó

Cambios a estos archivos requieren commit dedicado con tipo `legal:` y
aprobación humana explícita. Nunca los cierra solo el truth-auditor.

Módulos disponibles:
- labor_chile.py  — constantes laborales chilenas (AFP, SIS, AFC, jornada Ley 21.561, etc.)
- tax_chile.py    — constantes tributarias (IVA, tramos impuesto 2ª cat 2026, retención honor.)
- consumer.py     — Ley 19.496 (plazos retracto, reembolso) — pendiente
- data_protection.py — Ley 19.628, GDPR (plazos ARCO) — pendiente

Estado 2026-04-21: labor_chile.py y tax_chile.py creados en bloque nomina-chile-v1.
payroll_calculator.py migrado a importar desde aquí. hr_routes.py pendiente (FROZEN).
"""

from backend.constants.labor_chile import (
    AFC_EMPLEADOR_INDEFINIDO_PCT,
    AFC_EMPLEADOR_PLAZO_FIJO_PCT,
    AFC_TRABAJADOR_INDEFINIDO_PCT,
    AFP_OBLIGATORIA_PCT,
    AFP_UNO_COMMISSION_PCT,
    FECHA_ESCALON_40H,
    FECHA_ESCALON_42H,
    FONASA_PCT,
    GRATIFICACION_TOPE_IMM,
    MUTUAL_BASE_PCT,
    SIS_PCT,
    SUELDO_MINIMO_2026,
    TOPE_IMPONIBLE_AFC_UF,
    TOPE_IMPONIBLE_AFP_UF,
    UF_ABRIL_2026,
    UTM_ABRIL_2026,
    WEEKLY_HOURS_POST_40H,
    WEEKLY_HOURS_POST_42H,
    WEEKLY_HOURS_PRE_42H,
    get_monthly_hours_at_date,
    get_weekly_hours_at_date,
)
from backend.constants.tax_chile import (
    IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM,
    IVA_PCT,
    PPM_PROPYME_14D3_PCT,
    RETENCION_HONORARIOS_2026_PCT,
)

__all__ = [
    # labor_chile
    "UF_ABRIL_2026",
    "UTM_ABRIL_2026",
    "SUELDO_MINIMO_2026",
    "AFP_OBLIGATORIA_PCT",
    "AFP_UNO_COMMISSION_PCT",
    "AFC_TRABAJADOR_INDEFINIDO_PCT",
    "AFC_EMPLEADOR_INDEFINIDO_PCT",
    "AFC_EMPLEADOR_PLAZO_FIJO_PCT",
    "SIS_PCT",
    "TOPE_IMPONIBLE_AFP_UF",
    "TOPE_IMPONIBLE_AFC_UF",
    "WEEKLY_HOURS_PRE_42H",
    "WEEKLY_HOURS_POST_42H",
    "WEEKLY_HOURS_POST_40H",
    "FECHA_ESCALON_42H",
    "FECHA_ESCALON_40H",
    "GRATIFICACION_TOPE_IMM",
    "MUTUAL_BASE_PCT",
    "FONASA_PCT",
    "get_weekly_hours_at_date",
    "get_monthly_hours_at_date",
    # tax_chile
    "IVA_PCT",
    "RETENCION_HONORARIOS_2026_PCT",
    "PPM_PROPYME_14D3_PCT",
    "IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM",
]
