/**
 * useCookieConsent.ts
 *
 * Hook que consume el CookieConsentContext y expone estado + métodos
 * con selector helpers para categorías específicas.
 *
 * Pieza 2 del bloque bloque-cookie-consent-banner-v1.
 */

import { useCookieConsentContext } from '../components/CookieConsent/CookieConsentProvider';

export { useCookieConsentContext as useCookieConsent };

// Re-export de tipos para consumidores del hook
export type { CookieConsentContextValue } from '../components/CookieConsent/CookieConsentProvider';
