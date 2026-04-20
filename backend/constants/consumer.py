"""Constantes legales de protección al consumidor — Chile.

Ley N° 19.496 sobre Protección de los Derechos de los Consumidores.
Todo valor de este archivo debe tener cita del artículo, URL oficial,
fecha de verificación y nombre del verificador (CLAUDE.md §Constantes
legales).

Cambios a este archivo requieren commit dedicado con tipo ``legal:`` y
aprobación humana explícita antes de merge (CLAUDE.md §18.7).
"""

from __future__ import annotations


# -----------------------------------------------------------------------------
# Derecho de retracto en servicios prestados a distancia
# -----------------------------------------------------------------------------
# Fuente: Art. 3 bis letra b, Ley N° 19.496 sobre Protección de los Derechos
#         de los Consumidores (Chile). Servicios prestados a distancia
#         (internet). El consumidor puede retractarse sin expresión de causa
#         dentro del plazo indicado desde el cumplimiento del contrato o
#         desde la recepción del producto/servicio, según corresponda.
# URL oficial: https://www.bcn.cl/leychile/navegar?idNorma=61438
# Canon CLAUDE.md: "10 días corridos Art. 3bis Ley 19.496".
# Decisión batch 2026-04-20 (Cristian) — resolución 1A: 10 días corridos.
# Última verificación: 2026-04-20
# Verificado por: Tori (web-architect) — [PENDIENTE] revisión abogado
#                 antes del merge de bloque-legal-consolidation-v2
#                 (gate §18.7 CLAUDE.md).
RETRACT_DAYS_VALUE: int = 10
RETRACT_DAYS_TYPE: str = "corridos"


def retract_label_es() -> str:
    """Devuelve la etiqueta canónica en español del plazo de retracto.

    Ejemplo: ``"10 días corridos"``. Usar esta función en backend para
    componer mensajes al usuario final, en lugar de hardcodear el texto.
    """
    return f"{RETRACT_DAYS_VALUE} días {RETRACT_DAYS_TYPE}"
