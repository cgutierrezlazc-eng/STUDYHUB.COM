/**
 * CookieBanner.tsx — Banner modal bloqueante de consentimiento de cookies.
 *
 * Primera capa del flujo UX (plan §6.1).
 * Presenta 3 botones de igual prominencia visual (EDPB 05/2020):
 *   [Personalizar] [Rechazar todas] [Aceptar todas]
 *
 * Invariantes cubiertas:
 * - I-01: banner aparece en primera visita sin consentimiento previo.
 * - I-02: los 3 botones tienen igual tamaño, peso tipográfico y contraste.
 * - I-20: role="dialog", aria-modal, trap de foco, Escape NO cierra.
 *
 * Pieza 2 del bloque bloque-cookie-consent-banner-v1.
 */
import React, { useEffect, useRef } from 'react';
import styles from './CookieBanner.module.css';
import { COOKIE_BANNER_TEXTS } from '../../legal/cookieTexts';

export interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}

export default function CookieBanner({ onAcceptAll, onRejectAll, onCustomize }: CookieBannerProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // I-20: enfocar el primer botón al montar
  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  // I-20: trap de foco dentro del banner
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // I-20: Escape NO cierra el banner (es bloqueante hasta decidir)
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.key !== 'Tab') return;

    const focusable = bannerRef.current?.querySelectorAll<HTMLElement>(
      'button, a, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const bannerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={styles.overlay}
      data-testid="cookie-banner-overlay"
      // I-20: NO cerrar al hacer clic en overlay (banner bloqueante)
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={bannerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-banner-title"
        className={styles.banner}
        data-testid="cookie-banner"
        onKeyDown={handleKeyDown}
      >
        <h2 id="cookie-banner-title" className={styles.title}>
          {COOKIE_BANNER_TEXTS.title}
        </h2>
        <p className={styles.body}>{COOKIE_BANNER_TEXTS.body}</p>

        {/* D-04: aviso de retracto — siempre visible, fuera de tooltip */}
        <p className={styles.retractNotice} data-testid="cookie-banner-retract-notice">
          {COOKIE_BANNER_TEXTS.retractNotice}
        </p>

        {/* I-02: Orden visual: Personalizar | Rechazar todas | Aceptar todas
            Igual prominencia para los tres (EDPB 05/2020) */}
        <div className={styles.buttons} role="group" aria-label="Opciones de cookies">
          <button
            ref={firstButtonRef}
            type="button"
            className={`${styles.btn} ${styles.btnCustomize}`}
            onClick={onCustomize}
            data-testid="cookie-btn-customize"
          >
            {COOKIE_BANNER_TEXTS.btnCustomize}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnReject}`}
            onClick={onRejectAll}
            data-testid="cookie-btn-reject"
          >
            {COOKIE_BANNER_TEXTS.btnRejectAll}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnAccept}`}
            onClick={onAcceptAll}
            data-testid="cookie-btn-accept"
          >
            {COOKIE_BANNER_TEXTS.btnAcceptAll}
          </button>
        </div>

        <span className={styles.policyLink}>
          {COOKIE_BANNER_TEXTS.linkPolicy}{' '}
          <a href={COOKIE_BANNER_TEXTS.linkPolicyPath} data-testid="cookie-policy-link">
            {COOKIE_BANNER_TEXTS.linkPolicyText}
          </a>
        </span>
      </div>
    </div>
  );
}
