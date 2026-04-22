/**
 * multiDocConsent.ts — constantes del consentimiento multi-documento.
 *
 * Bloque: multi-document-consent-v1
 * D-M4: texto canónico final aprobado por Capa 0 legal-docs-keeper (2026-04-21).
 * D-M8=A: solo español (estructura preparada para i18n futuro).
 *
 * Fuente canónica: docs/legal/drafts/2026-04-21-multi-document-consent-text.md
 *
 * Citas legales:
 * - GDPR Art. 7(1) — https://eur-lex.europa.eu/eli/reg/2016/679/oj
 * - GDPR Art. 7(2) distinguishable — ídem
 * - Ley 19.628 Art. 4° — https://www.bcn.cl/leychile/navegar?idNorma=141599
 *
 * Si cambias MULTI_DOC_CONSENT_TEXT_V1, recalcular hash con:
 *   python3 -c "import hashlib; print(hashlib.sha256(text.encode('utf-8')).hexdigest())"
 * Y bumpear MULTI_DOC_CONSENT_VERSION a 1.1.0.
 */
import type { DocumentKey } from './documentRegistry';

export const MULTI_DOC_CONSENT_VERSION = '1.0.0';

/**
 * Texto canónico final del párrafo unificado de consentimiento.
 * Aprobado por Cristian 2026-04-21 (decisión D-M4 opción C).
 * Hash SHA-256: fc0580fce646822efafb1d0d2517fa9ab7296ffb1615a286701eb1d256b571e9
 * Encoding: UTF-8, separadores \n Unix, sin CRLF, sin trailing whitespace, 608 bytes.
 */
export const MULTI_DOC_CONSENT_TEXT_V1 =
  'Al continuar con el registro declaro, bajo fe de juramento, que soy mayor de 18 años y que los datos entregados son verdaderos.\n\n' +
  'Por separado, y tras haberlos leído, acepto expresamente los siguientes documentos del servicio:\n\n' +
  '1. Términos y Condiciones del Servicio.\n' +
  '2. Política de Privacidad.\n' +
  '3. Política de Cookies.\n' +
  '4. Declaración de Edad.\n\n' +
  'Entiendo que esta aceptación queda registrada como evidencia específica y demostrable conforme al Reglamento (UE) 2016/679 Art. 7(1) y a la Ley N° 19.628 Art. 4°, y que puedo retirar mi consentimiento en cualquier momento cuando la base legal sea el consentimiento.';

/**
 * Hash SHA-256 del texto canónico anterior.
 * Se envía al backend en POST /register como prueba de que el usuario vio
 * exactamente este texto al consentir. El backend valida coincidencia.
 */
export const MULTI_DOC_CONSENT_HASH =
  'fc0580fce646822efafb1d0d2517fa9ab7296ffb1615a286701eb1d256b571e9';

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
