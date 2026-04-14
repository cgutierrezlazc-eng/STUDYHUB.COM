import React, { useState, useEffect } from 'react';
import { Download, X } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA or in Electron
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window as any).electronAPI) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // iPad detection (includes modern iPads that report as MacIntel)
    const iPadDetected =
      /iPad/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const iPhoneDetected = /iPhone|iPod/.test(navigator.userAgent);
    const isIOSDevice = (iPhoneDetected || iPadDetected) && !(window as any).MSStream;

    setIsIOS(isIOSDevice);
    setIsIPad(iPadDetected);

    if (isIOSDevice) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome - listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for banner trigger from AppAvailableBanner
    const triggerHandler = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      }
    };
    window.addEventListener('conniku-trigger-pwa-install', triggerHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('conniku-trigger-pwa-install', triggerHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  const deviceLabel = isIPad ? 'iPad' : 'iPhone';

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {Download({ size: 22, color: '#fff' })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Instala Conniku</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {isIOS
              ? `Agrega Conniku a tu ${deviceLabel} desde aqui`
              : 'Instala la app para estudiar mas comodo'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, opacity: 0.8 }}>
            Pronto tambien en las tiendas de apps
          </div>
        </div>
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 18px',
            borderRadius: 20,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isIOS ? 'Ver como' : 'Instalar'}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
          }}
        >
          {X({ size: 18 })}
        </button>
      </div>

      {/* iOS/iPad Guide Modal */}
      {showIOSGuide && (
        <div className="modal-overlay" onClick={handleDismiss}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380, textAlign: 'center', padding: 28 }}
          >
            <h3 style={{ marginTop: 0 }}>Instalar en tu {deviceLabel}</h3>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                textAlign: 'left',
              }}
            >
              <p>
                <strong>1.</strong> {isIPad ? 'En tu iPad, toca' : 'Toca'} el boton{' '}
                <strong>Compartir</strong> (el cuadrado con flecha hacia arriba) en Safari
              </p>
              <p>
                <strong>2.</strong> Desplaza hacia abajo y toca{' '}
                <strong>"Agregar a pantalla de inicio"</strong>
              </p>
              <p>
                <strong>3.</strong> Toca <strong>"Agregar"</strong> en la esquina superior derecha
              </p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
              Estamos trabajando para llegar a la App Store pronto. Mientras tanto, la version web
              funciona igual de bien.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleDismiss}
              style={{ marginTop: 16, width: '100%' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
