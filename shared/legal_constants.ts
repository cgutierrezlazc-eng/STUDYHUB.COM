/**
 * Constantes legales canónicas del proyecto Conniku (espejo frontend).
 *
 * Este archivo es un ESPEJO de `backend/constants/consumer.py` y de los
 * demás módulos de `backend/constants/*.py` que expongan valores que
 * deban mostrarse al usuario final en la interfaz.
 *
 * Regla: todo valor legal visible al usuario debe venir de este archivo,
 * nunca hardcoded en componentes. Las citas legales se renderizan junto
 * al dato con tipografía secundaria (§CLAUDE.md "Visibilidad legal en la
 * interfaz").
 *
 * IMPORTANTE:
 * - Si cambia el valor en backend, debe actualizarse aquí.
 * - El script `scripts/verify-legal-constants-sync.sh` valida sync py↔ts
 *   en cada CI. Si diverge, el merge se bloquea.
 * - Cambios requieren commit dedicado con tipo `legal:` + aprobación
 *   humana (§18.7 CLAUDE.md).
 */

// -----------------------------------------------------------------------------
// Derecho de retracto en servicios prestados a distancia — Chile
// -----------------------------------------------------------------------------
// Fuente: Art. 3 bis letra b, Ley N° 19.496 sobre Protección de los Derechos
//         de los Consumidores (Chile). Servicios prestados a distancia
//         (internet).
// URL oficial: https://www.bcn.cl/leychile/navegar?idNorma=61438
// Canon CLAUDE.md: "10 días corridos Art. 3bis Ley 19.496".
// Decisión batch 2026-04-20 (Cristian) — resolución 1A: 10 días corridos.
// Última verificación: 2026-04-20
// Verificado por: Tori (web-architect) — [PENDIENTE] revisión abogado
//                 antes del merge de bloque-legal-consolidation-v2
//                 (gate §18.7 CLAUDE.md).
export const RETRACT_DAYS_VALUE = 10;
export const RETRACT_DAYS_TYPE: 'corridos' | 'hábiles' = 'corridos';

/**
 * Etiqueta canónica del plazo de retracto en español chileno.
 * Ejemplo: "10 días corridos".
 * Usar esta función en UI en lugar de hardcodear la frase.
 */
export function retractLabelEs(): string {
  return `${RETRACT_DAYS_VALUE} días ${RETRACT_DAYS_TYPE}`;
}

/**
 * Cita legal canónica del retracto (Chile) para mostrar junto al dato.
 * Formato CLAUDE.md §"Visibilidad legal en la interfaz".
 */
export const RETRACT_LEGAL_CITE_CL = 'Art. 3 bis letra b, Ley N° 19.496 (Chile)';

/**
 * URL oficial de la Biblioteca del Congreso Nacional de Chile para la
 * Ley 19.496. Referencia verificable para la cita de retracto.
 */
export const RETRACT_LEGAL_URL_CL = 'https://www.bcn.cl/leychile/navegar?idNorma=61438';
