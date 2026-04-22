/**
 * multiDocConsent.ts — constantes del consentimiento multi-documento.
 *
 * D-M4: texto borrador provisional, actualizar cuando legal-docs-keeper entregue versión final.
 * D-M8=A: solo español (estructura preparada para i18n futuro).
 *
 * Bloque: multi-document-consent-v1
 */
import type { DocumentKey } from './documentRegistry';

export const MULTI_DOC_CONSENT_VERSION = '1.0.0';

/**
 * Texto canónico del párrafo unificado de consentimiento.
 * BORRADOR PROVISIONAL — requiere aprobación de legal-docs-keeper + Cristian antes de producción.
 *
 * Citas legales verificadas por web-architect (2026-04-21):
 * - GDPR Art. 7(1): https://eur-lex.europa.eu/eli/reg/2016/679/oj
 * - Ley 19.628 Art. 4°: https://www.bcn.cl/leychile/navegar?idNorma=141599
 */
export const MULTI_DOC_CONSENT_TEXT_V1 =
  'Al continuar, confirmo bajo fe de juramento que soy mayor de 18 años y declaro haber leído y aceptado los Términos y Condiciones, la Política de Privacidad, y la Política de Cookies. Entiendo que mi aceptación queda registrada como evidencia conforme al Reglamento (UE) 2016/679 Art. 7(1) y la Ley 19.628 Art. 4°.';

/**
 * Documentos requeridos para completar el consentimiento.
 * Deben coincidir con DocumentKey del documentRegistry.
 */
export const REQUIRED_DOCS = ['terms', 'privacy', 'cookies', 'age-declaration'] as const;

export type RequiredDocKey = (typeof REQUIRED_DOCS)[number];

/** Nombres legibles por documento para mostrar en la UI. */
export const DOC_DISPLAY_NAMES: Record<DocumentKey, string> = {
  terms: 'Términos y Condiciones',
  privacy: 'Política de Privacidad',
  cookies: 'Política de Cookies',
  'age-declaration': 'Declaración de Edad',
};
