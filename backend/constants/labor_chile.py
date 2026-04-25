"""Constantes laborales chilenas con vigencia 2026.

Cada constante tiene bloque de 4 líneas de cita legal obligatorio
según CLAUDE.md §Constantes legales en el código:
  - Cita del artículo/ley
  - URL de fuente oficial verificable
  - Fecha de última verificación
  - Nombre de quien verificó

Cambios a este archivo requieren commit tipo `legal:` y aprobación
humana explícita. No los cierra solo el truth-auditor.

Tarea de actualización mensual: UF_ABRIL_2026 y UTM_ABRIL_2026 se
actualizan cada primer día hábil del mes. El legal-docs-keeper
detecta desfases en auditoría semanal.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

# ---------------------------------------------------------------------------
# Indicadores económicos mensuales
# ---------------------------------------------------------------------------

# Unidad de Fomento vigente abril 2026 — $39.841,72 CLP
# Fuente: https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
UF_ABRIL_2026: Decimal = Decimal("39841.72")

# Unidad Tributaria Mensual (UTM) vigente abril 2026 — $69.889 CLP
# Fuente: https://www.sii.cl/valores_y_fechas/utm/utm2026.htm
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
UTM_ABRIL_2026: Decimal = Decimal("69889")

# ---------------------------------------------------------------------------
# Sueldo mínimo
# ---------------------------------------------------------------------------

# Ingreso Mínimo Mensual (IMM) vigente desde 2026-01-01 — $539.000 CLP
# Fuente: https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual/
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
SUELDO_MINIMO_2026: int = 539_000

# ---------------------------------------------------------------------------
# AFP — cotizaciones obligatorias
# ---------------------------------------------------------------------------

# Cotización AFP obligatoria trabajador: 10% de la remuneración imponible
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=7147 (DL 3500 Art. 17)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
AFP_OBLIGATORIA_PCT: Decimal = Decimal("0.10")

# AFP UNO comisión de cargo del trabajador: 0.46% (licitación, default novatos desde 2023-10-01)
# Fuente: https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21, D-E aprobado)
AFP_UNO_COMMISSION_PCT: Decimal = Decimal("0.0046")

# ---------------------------------------------------------------------------
# AFC — Seguro de Cesantía (Ley 19.728)
# ---------------------------------------------------------------------------

# AFC cotización trabajador contrato indefinido: 0.6%
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=185700 (Ley 19.728)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
AFC_TRABAJADOR_INDEFINIDO_PCT: Decimal = Decimal("0.006")

# AFC cotización empleador contrato indefinido: 2.4%
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=185700 (Ley 19.728)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
AFC_EMPLEADOR_INDEFINIDO_PCT: Decimal = Decimal("0.024")

# AFC cotización empleador contrato plazo fijo: 3.0% (trabajador aporta 0%)
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=185700 (Ley 19.728)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
AFC_EMPLEADOR_PLAZO_FIJO_PCT: Decimal = Decimal("0.03")

# ---------------------------------------------------------------------------
# SIS — Seguro de Invalidez y Sobrevivencia
# ---------------------------------------------------------------------------

# SIS: 1.54% de cargo exclusivo del empleador, vigente desde enero 2026
# Fuente: https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9911.html
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
SIS_PCT: Decimal = Decimal("0.0154")

# ---------------------------------------------------------------------------
# Topes imponibles
# ---------------------------------------------------------------------------

# Tope imponible AFP: 81,6 UF (aplica también a salud y SIS)
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=7147 (DL 3500)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
TOPE_IMPONIBLE_AFP_UF: Decimal = Decimal("81.6")

# Tope imponible AFC: 135,2 UF desde febrero 2026 (reajuste anual según IPC)
# Fuente: https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21, D-B aprobado)
TOPE_IMPONIBLE_AFC_UF: Decimal = Decimal("135.2")

# ---------------------------------------------------------------------------
# Jornada laboral — Ley 21.561 escalones
# ---------------------------------------------------------------------------

# Jornada semanal escalón 1 (vigente desde abr-2024 hasta 2026-04-25): 44 horas
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1194020 (Ley 21.561 Art. 1°)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
WEEKLY_HOURS_PRE_42H: int = 44

# Jornada semanal escalón 2 (vigente desde 2026-04-26): 42 horas
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1194020 (Ley 21.561 Art. 1° escalón 2)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21, D-F aprobado: día exacto 2026-04-26)
WEEKLY_HOURS_POST_42H: int = 42

# Fecha de inicio del escalón 42h (día exacto, inclusive)
# Fuente: https://www.mintrab.gob.cl/ley-40-horas-conoce-las-principales-medidas-que-comienzan-a-regir-el-26-de-abril/
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21, D-F)
FECHA_ESCALON_42H: date = date(2026, 4, 26)

# Jornada semanal escalón 3 (vigente desde 2028-04-26): 40 horas
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1194020 (Ley 21.561 Art. 1° escalón 3)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
WEEKLY_HOURS_POST_40H: int = 40

# Fecha de inicio del escalón 40h
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1194020 (Ley 21.561 Art. 1° escalón 3)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
FECHA_ESCALON_40H: date = date(2028, 4, 26)

# ---------------------------------------------------------------------------
# Gratificación legal
# ---------------------------------------------------------------------------

# Tope gratificación legal: 4,75 IMM anuales (Art. 50 Código del Trabajo)
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=207436 (Código del Trabajo Art. 50)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
GRATIFICACION_TOPE_IMM: Decimal = Decimal("4.75")

# Mutual de Seguridad / ACHS — tasa base accidentes del trabajo
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=28650 (Ley 16.744)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
MUTUAL_BASE_PCT: Decimal = Decimal("0.0093")

# Fonasa: cotización salud 7% de remuneración imponible
# Fuente: https://www.bcn.cl/leychile/navegar?idNorma=20380 (Ley 18.469)
# Verificado: 2026-04-21
# Verificador: Cristian (Capa 0 batch §21)
FONASA_PCT: Decimal = Decimal("0.07")


# ---------------------------------------------------------------------------
# Funciones de jornada dinámica por fecha
# ---------------------------------------------------------------------------


def get_weekly_hours_at_date(fecha: date) -> int:
    """Retorna las horas semanales legales vigentes a la fecha dada.

    Implementa los escalones de Ley 21.561:
    - Antes de 2026-04-26: 44h (escalón 1, vigente desde abr-2024).
    - Desde 2026-04-26: 42h (escalón 2).
    - Desde 2028-04-26: 40h (escalón 3) — preparado para el futuro.

    Args:
        fecha: Fecha para la cual se consulta la jornada vigente.

    Returns:
        Horas semanales enteras.
    """
    if fecha >= FECHA_ESCALON_40H:
        return WEEKLY_HOURS_POST_40H
    if fecha >= FECHA_ESCALON_42H:
        return WEEKLY_HOURS_POST_42H
    return WEEKLY_HOURS_PRE_42H


def get_monthly_hours_at_date(fecha: date) -> int:
    """Retorna las horas mensuales legales vigentes a la fecha dada.

    Equivale a horas_semanales × 4 semanas (convención chilena para
    base de cálculo de hora normal y hora extra).

    Args:
        fecha: Fecha para la cual se consulta la base mensual.

    Returns:
        Horas mensuales enteras (176 pre-escalón, 168 post-escalón 42h).
    """
    return get_weekly_hours_at_date(fecha) * 4
