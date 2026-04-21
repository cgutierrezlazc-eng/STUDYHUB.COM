/**
 * CookieSettingsFooterLink.tsx — Enlace persistente en footer para reabrir configuración.
 *
 * Invariante I-07: retirar/cambiar consentimiento es siempre accesible desde
 * cualquier página a un clic de distancia.
 * Invariante I-14: visible en footer de UnderConstruction y app autenticada.
 *
 * Pieza 2 del bloque bloque-cookie-consent-banner-v1.
 */
import React from 'react';
import { useCookieConsentContext } from './CookieConsentProvider';

interface CookieSettingsFooterLinkProps {
  /** Estilo visual: 'text' (link) o 'icon' (ícono + texto). Por defecto 'text'. */
  variant?: 'text' | 'icon';
  /** Color de texto. Por defecto usa var(--text-muted). */
  color?: string;
  /** Tamaño de fuente. Por defecto 12. */
  fontSize?: number;
}

export default function CookieSettingsFooterLink({
  variant = 'text',
  color,
  fontSize = 12,
}: CookieSettingsFooterLinkProps) {
  const { openSettings } = useCookieConsentContext();

  const textColor = color ?? 'var(--text-muted, #9ca3af)';

  return (
    <button
      type="button"
      onClick={openSettings}
      data-testid="cookie-footer-link"
      aria-label="Configurar preferencias de cookies"
      style={{
        background: 'none',
        border: 'none',
        color: textColor,
        fontSize,
        cursor: 'pointer',
        textDecoration: variant === 'text' ? 'underline' : 'none',
        padding: '2px 4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'inherit',
      }}
    >
      {variant === 'icon' && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 1 14.14 14.14" />
        </svg>
      )}
      Cookies
    </button>
  );
}
