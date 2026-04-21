/**
 * CookieSettings.tsx — Modal de personalización de cookies.
 *
 * Segunda capa del flujo UX (plan §6.1 "Personalizar").
 * Muestra 4 toggles por categoría; "necessary" siempre ON y desactivado.
 *
 * Invariantes cubiertas:
 * - I-03: toggles no esenciales OFF por defecto (Planet49 C-673/17).
 * - I-07: retirar consentimiento a un clic desde este modal.
 *
 * Pieza 2 del bloque bloque-cookie-consent-banner-v1.
 */
import React, { useState } from 'react';
import CookieToggle from './CookieToggle';
import { COOKIE_SETTINGS_TEXTS, COOKIE_CATEGORY_TEXTS } from '../../legal/cookieTexts';

export interface CookieSettingsProps {
  /** Categorías actualmente aceptadas (para pre-rellenar los toggles). */
  initialCategories?: string[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (categories: string[]) => void;
  onRevokeAll: () => void;
  onClose?: () => void;
  /** D-06: si hay sesión activa, muestra aviso de cookies de ejecución de contrato. */
  isLoggedIn?: boolean;
}

export default function CookieSettings({
  initialCategories = [],
  onAcceptAll,
  onRejectAll,
  onSave,
  onRevokeAll,
  onClose,
  isLoggedIn = false,
}: CookieSettingsProps) {
  const [functional, setFunctional] = useState(initialCategories.includes('functional'));
  const [analytics, setAnalytics] = useState(initialCategories.includes('analytics'));
  const [marketing, setMarketing] = useState(initialCategories.includes('marketing'));
  const [showReloadMsg, setShowReloadMsg] = useState(false);

  const categoryKeys = Object.keys(COOKIE_CATEGORY_TEXTS) as Array<
    keyof typeof COOKIE_CATEGORY_TEXTS
  >;

  function getToggleState(key: string): boolean {
    if (key === 'necessary') return true;
    if (key === 'functional') return functional;
    if (key === 'analytics') return analytics;
    if (key === 'marketing') return marketing;
    return false;
  }

  function handleToggle(key: string, value: boolean) {
    if (key === 'functional') setFunctional(value);
    if (key === 'analytics') setAnalytics(value);
    if (key === 'marketing') setMarketing(value);
  }

  function handleSave() {
    const selected = ['necessary'];
    if (functional) selected.push('functional');
    if (analytics) selected.push('analytics');
    if (marketing) selected.push('marketing');

    // Si el usuario quitó una categoría que antes tenía: avisar recarga (plan §6.4)
    const hadAnalytics = initialCategories.includes('analytics');
    const hadMarketing = initialCategories.includes('marketing');
    const hadFunctional = initialCategories.includes('functional');
    if (
      (hadAnalytics && !analytics) ||
      (hadMarketing && !marketing) ||
      (hadFunctional && !functional)
    ) {
      setShowReloadMsg(true);
    }

    onSave(selected);
  }

  if (showReloadMsg) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reload-dialog-title"
          style={{
            background: 'var(--bg-primary, #fff)',
            borderRadius: 12,
            padding: 28,
            maxWidth: 400,
            width: '100%',
          }}
          data-testid="cookie-reload-dialog"
        >
          <p
            id="reload-dialog-title"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 20px',
            }}
          >
            {COOKIE_SETTINGS_TEXTS.reloadMessage}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent, #2D62C8)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="cookie-reload-now"
            >
              {COOKIE_SETTINGS_TEXTS.reloadNow}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReloadMsg(false);
                onClose?.();
              }}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle, #d1d5db)',
                background: 'var(--bg-secondary, #f3f4f6)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="cookie-reload-later"
            >
              {COOKIE_SETTINGS_TEXTS.reloadLater}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        style={{
          background: 'var(--bg-primary, #fff)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          maxWidth: 520,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        data-testid="cookie-settings"
      >
        <h2
          id="cookie-settings-title"
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}
        >
          {COOKIE_SETTINGS_TEXTS.title}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 24px',
            lineHeight: 1.5,
          }}
        >
          {COOKIE_SETTINGS_TEXTS.subtitle}
        </p>

        {/* Tarjetas por categoría */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categoryKeys.map((key) => {
            const cat = COOKIE_CATEGORY_TEXTS[key];
            const isDisabled = cat.alwaysOn;
            const checked = getToggleState(key);

            return (
              <div
                key={key}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle, #e5e7eb)',
                  background: 'var(--bg-secondary, #f9fafb)',
                }}
                data-testid={`cookie-category-${key}`}
              >
                <CookieToggle
                  id={`cookie-toggle-${key}`}
                  label={cat.name}
                  checked={checked}
                  disabled={isDisabled}
                  onChange={(val) => handleToggle(key, val)}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    margin: '8px 0 4px',
                    lineHeight: 1.5,
                  }}
                >
                  {cat.description}
                </p>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #9ca3af)',
                    lineHeight: 1.4,
                  }}
                >
                  {cat.legalBasis}
                </span>
                {/* D-06: aviso post-login visible solo con sesión activa (GDPR Art. 6(1)(b)) */}
                {key === 'functional' && isLoggedIn && (
                  <p
                    data-testid="cookie-functional-session-notice"
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary, #4b5563)',
                      margin: '8px 0 0',
                      lineHeight: 1.5,
                      borderTop: '1px solid var(--border-subtle, #e5e7eb)',
                      paddingTop: 8,
                    }}
                  >
                    Mientras tu sesión esté activa, algunas cookies funcionales son necesarias para
                    ejecutar el contrato del servicio (mantener tu sesión, preferencias de idioma,
                    zona horaria). Al cerrar sesión se eliminan.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRejectAll}
            style={{
              flex: 1,
              minWidth: 120,
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle, #d1d5db)',
              background: 'var(--bg-secondary, #f3f4f6)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cookie-settings-reject"
          >
            {COOKIE_SETTINGS_TEXTS.btnRejectAll}
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1,
              minWidth: 120,
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent, #2D62C8)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cookie-settings-save"
          >
            {COOKIE_SETTINGS_TEXTS.btnSave}
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            style={{
              flex: 1,
              minWidth: 120,
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle, #d1d5db)',
              background: 'var(--bg-secondary, #f3f4f6)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cookie-settings-accept"
          >
            {COOKIE_SETTINGS_TEXTS.btnAcceptAll}
          </button>
        </div>

        {/* D-05: "Retirar todo el consentimiento" como 4° botón de paridad visual (GDPR Art. 7(3)).
            Outline con borde rojo suave para indicar acción destructiva sin ser alarmante. */}
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={onRevokeAll}
            data-testid="cookie-settings-revoke"
            data-variant="revoke"
            style={{
              flex: 1,
              width: '100%',
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid var(--color-danger-subtle, #fca5a5)',
              background: 'var(--bg-primary, #fff)',
              color: 'var(--color-danger, #dc2626)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {COOKIE_SETTINGS_TEXTS.btnRevokeAll}
          </button>
          <span
            style={{
              display: 'block',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            {COOKIE_SETTINGS_TEXTS.gdprNote}
          </span>
        </div>
      </div>
    </div>
  );
}
