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

Archivos previstos (ninguno existe todavía al 2026-04-18):
- labor_chile.py      — constantes laborales chilenas (AFP, SIS, AFC, etc.)
- tax_chile.py        — constantes tributarias (UF, UTM, tramos impuesto)
- consumer.py         — Ley 19.496 (plazos retracto, reembolso)
- data_protection.py  — Ley 19.628, GDPR (plazos respuesta ARCO, retención)

Estado actual (CLAUDE.md §backend/constants): detectado como AUSENTE por
la auditoría 2026-04-17 (truth-auditor + legal-docs-keeper). Muchas de las
constantes viven hardcoded en backend/payroll_calculator.py y
src/admin/shared/ChileLaborConstants.ts con discrepancias entre ambos
(UF, UTM, SIS). La migración a este paquete es un bloque futuro dedicado.
"""
