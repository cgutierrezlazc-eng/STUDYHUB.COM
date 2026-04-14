import React, { useState, useEffect } from 'react';
import { Download, X, Monitor, Smartphone, Tablet } from './Icons';

/**
 * Banner for existing users: lets them know Conniku is available
 * as a desktop app and mobile PWA, and coming soon to app stores.
 * Shows once per user, with a warm humanized message.
 */
export default function AppAvailableBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const key = 'conniku_apps_banner_v3';
    const seen = localStorage.getItem(key);
    if (seen) return;

    // Don't show inside Electron or standalone PWA
    if ((window as any).electronAPI) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('conniku_apps_banner_v3', String(Date.now()));
  };

  if (!visible) return null;

  const isIPad =
    /iPad/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
  const isIOS = isIPhone || isIPad;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  const handleInstall = () => {
    if (isAndroid) {
      const evt = new Event('conniku-trigger-pwa-install');
      window.dispatchEvent(evt);
      dismiss();
    } else if (isIOS) {
      setExpanded(true);
    } else {
      setExpanded(true);
    }
  };

  // SVG store badge icons
  const GooglePlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.61 1.814L13.793 12 3.61 22.186a1.004 1.004 0 0 1-.61-.92V2.734c0-.384.22-.72.61-.92z"
        fill="#4285F4"
      />
      <path
        d="M17.287 8.445L5.12.618C4.737.39 4.29.333 3.91.5l10.183 11.5 3.194-3.555z"
        fill="#34A853"
      />
      <path
        d="M3.91 23.5c.38.167.827.11 1.21-.118l12.167-7.827-3.194-3.555L3.91 23.5z"
        fill="#EA4335"
      />
      <path
        d="M21.177 10.655l-3.89-2.21-3.494 3.555 3.494 3.555 3.89-2.21c.72-.41.72-1.28 0-1.69z"
        fill="#FBBC05"
      />
    </svg>
  );

  const AppStoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="#0D84FF"
      />
    </svg>
  );

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 68 : 20,
        right: isMobile ? 8 : 20,
        left: isMobile ? 8 : 'auto',
        width: isMobile ? 'auto' : 400,
        zIndex: 9998,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '18px 20px',
        animation: 'slideUp 0.4s ease',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Close button */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 4,
        }}
        aria-label="Cerrar"
      >
        {X({ size: 16 })}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {Download({ size: 20, color: '#fff' })}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            Lleva Conniku en tu bolsillo
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            Instalala directo desde aqui, sin tiendas, sin esperas.
          </div>
        </div>
      </div>

      {/* Friendly message */}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          margin: '0 0 14px 0',
        }}
      >
        {isMobile
          ? isIPad
            ? 'Instala Conniku en tu iPad para acceder mas rapido, recibir notificaciones y estudiar sin abrir el navegador. Es gratis y ocupa muy poco espacio.'
            : isAndroid
              ? 'Instala Conniku en tu telefono para acceder mas rapido, recibir notificaciones y estudiar sin abrir el navegador. Es gratis y ocupa muy poco espacio.'
              : 'Instala Conniku en tu iPhone para acceder mas rapido, recibir notificaciones y estudiar sin abrir el navegador. Es gratis y ocupa muy poco espacio.'
          : 'Descarga Conniku como app de escritorio para Windows o Mac. Recibe notificaciones de mensajes, accede con un clic desde tu barra de tareas y estudia sin distracciones del navegador.'}
      </p>

      {/* Primary CTA */}
      {!expanded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleInstall}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {Download({ size: 16, color: '#fff' })} Instalar Conniku
          </button>

          {/* Coming soon to stores */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <GooglePlayIcon />
              <AppStoreIcon />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Pronto en Google Play y App Store
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Desktop options */}
          {!isMobile && (
            <>
              <a
                href="https://github.com/conniku/desktop/releases/latest/download/Conniku-Setup.exe"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {Monitor({ size: 18 })}
                <div>
                  <div style={{ fontWeight: 600 }}>Windows</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Descarga el instalador .exe
                  </div>
                </div>
              </a>
              <a
                href="https://github.com/conniku/desktop/releases/latest/download/Conniku.dmg"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {Monitor({ size: 18 })}
                <div>
                  <div style={{ fontWeight: 600 }}>macOS</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Descarga el archivo .dmg
                  </div>
                </div>
              </a>
            </>
          )}

          {/* Android */}
          {isAndroid && (
            <button
              onClick={() => {
                const evt = new Event('conniku-trigger-pwa-install');
                window.dispatchEvent(evt);
                dismiss();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left',
              }}
            >
              {Smartphone({ size: 18 })}
              <div>
                <div style={{ fontWeight: 600 }}>Instalar en Android</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Se agrega a tu pantalla de inicio
                </div>
              </div>
            </button>
          )}

          {/* iPhone guide */}
          {isIPhone && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {Smartphone({ size: 18 })}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Instalar en iPhone
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Toca el boton de compartir <span style={{ fontSize: 15 }}>&#x2191;</span> en
                  Safari y selecciona "Agregar a pantalla de inicio"
                </div>
              </div>
            </div>
          )}

          {/* iPad guide */}
          {isIPad && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {Tablet({ size: 18 })}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Instalar en iPad
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  En tu iPad, toca el boton de compartir{' '}
                  <span style={{ fontSize: 15 }}>&#x2191;</span> en Safari y selecciona "Agregar a
                  pantalla de inicio"
                </div>
              </div>
            </div>
          )}

          {/* Tablet hint for desktop users */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
              }}
            >
              {Tablet({ size: 14 })}
              Tambien disponible en tablets — abre conniku.com desde tu tablet y te guiaremos
            </div>
          )}

          {/* Coming soon to stores — shown in expanded too */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <GooglePlayIcon />
              <AppStoreIcon />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Pronto en Google Play y App Store
            </span>
          </div>

          {/* Reassurance text */}
          <p
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--text-muted)',
              margin: '4px 0 0 0',
              textAlign: 'center',
            }}
          >
            Estamos trabajando para llegar a Google Play y App Store muy pronto. Mientras tanto,
            instala la version web que funciona igual de bien.
          </p>

          <button
            onClick={dismiss}
            style={{
              marginTop: 4,
              padding: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            Ahora no, quizas despues
          </button>
        </div>
      )}
    </div>
  );
}
