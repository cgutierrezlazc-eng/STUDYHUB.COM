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

// -----------------------------------------------------------------------------
// Versiones canónicas de los documentos legales publicados
// -----------------------------------------------------------------------------
// Espejo de backend/constants/legal_versions.py. Cualquier bump en un
// documento legal requiere actualizar BOTH archivos con el mismo
// version/hash y un commit dedicado con tipo `legal:`.
//
// Un cambio MAJOR o MINOR fuerza re-aceptación del usuario según el
// mecanismo de la Pieza 6 del bloque bloque-legal-consolidation-v2.

export interface LegalDocumentDescriptor {
  documentType: 'tos' | 'privacy' | 'cookies';
  version: string;
  hash: string;
  /** Ruta interna de la app donde el usuario lee este documento. */
  route: string;
  /** Nombre humano corto. */
  label: string;
}

export const TOS_DOCUMENT: LegalDocumentDescriptor = {
  documentType: 'tos',
  version: '3.2.0',
  hash: '9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce',
  route: '/terms',
  label: 'Términos y Condiciones',
};

export const PRIVACY_DOCUMENT: LegalDocumentDescriptor = {
  documentType: 'privacy',
  version: '2.4.2',
  hash: 'a09d799c7f34d7100b9393ad7c55c54931ab7e396d0f03b559a59545638e6962',
  route: '/privacy',
  label: 'Política de Privacidad',
};

export const COOKIES_DOCUMENT: LegalDocumentDescriptor = {
  documentType: 'cookies',
  version: '1.0.0',
  hash: '80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c',
  route: '/cookies',
  label: 'Política de Cookies',
};

/** Lista canónica de los documentos sujetos al gate de re-aceptación. */
export const REACCEPT_DOCUMENTS: LegalDocumentDescriptor[] = [
  TOS_DOCUMENT,
  PRIVACY_DOCUMENT,
  COOKIES_DOCUMENT,
];
