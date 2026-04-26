import React, { useEffect, useState } from 'react';

interface UnderConstructionProps {
  onStaffLogin?: () => void;
}

/**
 * UnderConstruction
 * Landing pública temporal mientras se completa el rollout editorial v3.
 * Layout full-bleed editorial. Logo oficial canónico (wordmark + tile "u." SVG).
 */
export default function UnderConstruction({ onStaffLogin }: UnderConstructionProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f4ef',
        color: '#0d0f10',
        fontFamily: "'Funnel Display', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Blobs decorativos full-bleed */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, #d9ff3a 0%, transparent 70%)',
          opacity: 0.28,
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, #ff4d3a 0%, transparent 70%)',
          opacity: 0.22,
          filter: 'blur(110px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '25%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, #6b4eff 0%, transparent 70%)',
          opacity: 0.2,
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top progress bar ink */}
      <div
        style={{
          background: '#0d0f10',
          color: '#fff',
          padding: '12px clamp(20px, 4vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#d9ff3a',
              animation: 'ucPulse 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
            }}
          />
          <span>Conniku · en desarrollo</span>
        </div>
        <span style={{ opacity: 0.7 }}>Volvemos pronto</span>
      </div>
      <style>{`
        @keyframes ucPulse {
          0% { box-shadow: 0 0 0 0 rgba(217,255,58,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(217,255,58,0); }
          100% { box-shadow: 0 0 0 0 rgba(217,255,58,0); }
        }
        @keyframes ucFloat {
          0%, 100% { transform: rotate(-1.5deg) translateY(0); }
          50% { transform: rotate(-1.5deg) translateY(-8px); }
        }
      `}</style>

      {/* Brand navbar — logo oficial canónico */}
      <header
        style={{
          padding: 'clamp(20px, 3vw, 36px) clamp(24px, 5vw, 72px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <a
          href="https://conniku.com"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 800,
            fontSize: 'clamp(28px, 3.2vw, 40px)',
            letterSpacing: '-0.055em',
            lineHeight: 1,
            color: '#0d0f10',
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            conn<span>i</span>k
          </span>
          {/* Tile oficial canónico: fondo lime + u ink + punto naranja */}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              background: '#d9ff3a',
              color: '#0d0f10',
              padding: '0.06em 0.18em 0.08em 0.12em',
              borderRadius: '0.22em',
              position: 'relative',
              lineHeight: 1,
            }}
          >
            u
            <span
              style={{
                color: '#ff4a1c',
                marginLeft: '0.04em',
                fontWeight: 900,
              }}
            >
              .
            </span>
          </span>
        </a>

        <span
          style={{
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#696c6f',
            fontWeight: 700,
            display: 'none',
          }}
          className="uc-brand-tag"
        >
          / Conniku SpA · Chile
        </span>
      </header>
      <style>{`
        @media (min-width: 768px) {
          .uc-brand-tag { display: inline !important; }
        }
      `}</style>

      {/* Hero full-bleed */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(32px, 4vw, 56px)',
          padding: 'clamp(24px, 4vw, 56px) clamp(24px, 5vw, 72px) clamp(80px, 8vw, 120px)',
          position: 'relative',
          zIndex: 1,
          alignContent: 'center',
        }}
        className="uc-main"
      >
        <style>{`
          @media (min-width: 1024px) {
            .uc-main {
              grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) !important;
              align-items: center !important;
            }
          }
        `}</style>

        {/* Columna principal: H1 gigante full-bleed */}
        <div>
          <div
            style={{
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#696c6f',
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            ★ Abril 2026 · Nuevo diseño editorial
          </div>

          <h1
            style={{
              fontWeight: 800,
              fontSize: 'clamp(56px, 11vw, 180px)',
              letterSpacing: '-0.06em',
              lineHeight: 0.88,
              margin: 0,
            }}
          >
            Estamos{' '}
            <span
              style={{
                background: '#6b4eff',
                color: '#fff',
                padding: '0 0.12em',
                borderRadius: '0.14em',
                display: 'inline-block',
                transform: 'rotate(-1.5deg)',
              }}
            >
              subiendo
            </span>
            <br />
            el nuevo{' '}
            <span
              style={{
                background: '#d9ff3a',
                color: '#181f08',
                padding: '0 0.1em',
                borderRadius: '0.14em',
                display: 'inline-block',
              }}
            >
              Conniku
              <span style={{ color: '#ff4a1c' }}>.</span>
            </span>
          </h1>

          <p
            style={{
              marginTop: 'clamp(24px, 3vw, 40px)',
              fontSize: 'clamp(17px, 1.6vw, 22px)',
              lineHeight: 1.5,
              color: '#2b2e30',
              maxWidth: 680,
              fontWeight: 500,
            }}
          >
            Estamos actualizando toda la plataforma con un nuevo diseño editorial. Workspaces,
            biblioteca, tutorías, cursos, comunidad.{' '}
            <strong
              style={{
                background: '#ffe9b8',
                padding: '2px 10px',
                borderRadius: 6,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Volvemos muy pronto.
            </strong>
          </p>
        </div>

        {/* Columna lateral: card status + contacto */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Status chip flotante */}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              background: '#fff',
              border: '2px solid #0d0f10',
              borderRadius: 999,
              padding: '12px 22px 12px 14px',
              animation: 'ucFloat 3.6s ease-in-out infinite',
              boxShadow: '6px 6px 0 #0d0f10',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#d9ff3a',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              ★
            </span>
            <span
              style={{
                fontFamily: "'Geist Mono', ui-monospace, monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Actualizando diseño{dots}
            </span>
          </div>

          {/* Card paper con info */}
          <div
            style={{
              background: '#fff',
              border: '2px solid #0d0f10',
              borderRadius: 20,
              padding: 'clamp(24px, 2.5vw, 32px)',
              boxShadow: '8px 8px 0 #0d0f10',
            }}
          >
            <div
              style={{
                fontFamily: "'Geist Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#696c6f',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              ¿Necesitas algo urgente?
            </div>
            <a
              href="mailto:contacto@conniku.com"
              style={{
                display: 'block',
                fontSize: 'clamp(18px, 1.8vw, 24px)',
                fontWeight: 800,
                color: '#0d0f10',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
                wordBreak: 'break-all',
              }}
            >
              contacto@conniku.com
              <span style={{ color: '#ff4a1c' }}>→</span>
            </a>
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px dashed #d8d6cc',
                fontSize: 13,
                color: '#696c6f',
                lineHeight: 1.5,
              }}
            >
              Respondemos dentro de 24 horas en días hábiles.
            </div>
          </div>
        </aside>
      </main>

      {/* Footer full-bleed */}
      <footer
        style={{
          padding: '20px clamp(24px, 5vw, 72px)',
          borderTop: '1px solid #d8d6cc',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#696c6f',
          fontWeight: 600,
          position: 'relative',
          zIndex: 2,
          background: 'rgba(245,244,239,0.8)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span>Conniku SpA · Hecho en Chile</span>
        <span>+18 · Plataforma educativa</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span>© 2026</span>
          {onStaffLogin && (
            <button
              type="button"
              onClick={onStaffLogin}
              aria-label="Acceso staff"
              title="Acceso interno para tests"
              style={{
                background: 'transparent',
                border: '1px solid #c9c6b8',
                color: '#696c6f',
                fontFamily: "'Geist Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                opacity: 0.55,
                transition: 'opacity 0.2s ease, border-color 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.borderColor = '#0d0f10';
                e.currentTarget.style.color = '#0d0f10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.55';
                e.currentTarget.style.borderColor = '#c9c6b8';
                e.currentTarget.style.color = '#696c6f';
              }}
            >
              · staff
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
