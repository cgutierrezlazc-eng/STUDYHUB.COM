import React, { useEffect, useState } from 'react';

/**
 * UnderConstruction
 * Landing pública temporal mientras se completa el rollout editorial v3.
 * Se muestra en conniku.com hasta que la nueva landing esté 100% lista.
 *
 * Mantiene acceso oculto a /login y /registro para cuentas internas (CEO,
 * admin, testing) escribiendo esas rutas directo en el navegador.
 */
export default function UnderConstruction() {
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
      {/* Blobs decorativos */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '8%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, #d9ff3a 0%, transparent 70%)',
          opacity: 0.25,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '5%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, #ff4d3a 0%, transparent 70%)',
          opacity: 0.22,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '30%',
          width: 380,
          height: 380,
          background: 'radial-gradient(circle, #6b4eff 0%, transparent 70%)',
          opacity: 0.18,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top progress bar ink */}
      <div
        style={{
          background: '#0d0f10',
          color: '#fff',
          padding: '10px 28px',
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
        <span>Volvemos pronto</span>
      </div>
      <style>{`
        @keyframes ucPulse {
          0% { box-shadow: 0 0 0 0 rgba(217,255,58,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(217,255,58,0); }
          100% { box-shadow: 0 0 0 0 rgba(217,255,58,0); }
        }
      `}</style>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        {/* Logo wordmark oficial */}
        <a
          href="https://conniku.com"
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            fontWeight: 800,
            fontSize: 'clamp(40px, 6vw, 64px)',
            letterSpacing: '-0.055em',
            lineHeight: 1,
            color: '#0d0f10',
            textDecoration: 'none',
            marginBottom: 40,
          }}
        >
          conn<span>i</span>k
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              background: '#d9ff3a',
              color: '#0d0f10',
              padding: '0.07em 0.14em 0.07em 0.09em',
              borderRadius: '0.2em',
              marginLeft: '0.02em',
            }}
          >
            u<span style={{ color: '#ff4a1c' }}>.</span>
          </span>
        </a>

        {/* H1 gigante */}
        <h1
          style={{
            fontWeight: 800,
            fontSize: 'clamp(52px, 9vw, 120px)',
            letterSpacing: '-0.055em',
            lineHeight: 0.9,
            margin: 0,
            maxWidth: 1000,
          }}
        >
          Estamos{' '}
          <span
            style={{
              background: '#6b4eff',
              color: '#fff',
              padding: '0 16px',
              borderRadius: 20,
              display: 'inline-block',
              transform: 'rotate(-1.5deg)',
            }}
          >
            subiendo
          </span>
          <br />
          el nuevo{' '}
          <span
            style={{ background: '#d9ff3a', color: '#181f08', padding: '0 14px', borderRadius: 18 }}
          >
            Conniku
          </span>
          <span style={{ color: '#ff4a1c' }}>.</span>
        </h1>

        {/* Lead */}
        <p
          style={{
            marginTop: 32,
            fontSize: 'clamp(16px, 1.7vw, 20px)',
            lineHeight: 1.5,
            color: '#2b2e30',
            maxWidth: 560,
            fontWeight: 500,
          }}
        >
          Estamos actualizando toda la plataforma con un nuevo diseño editorial. Workspaces,
          biblioteca, tutorías, cursos, comunidad.{' '}
          <strong
            style={{ background: '#ffe9b8', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}
          >
            Volvemos muy pronto.
          </strong>
        </p>

        {/* Status chip */}
        <div
          style={{
            marginTop: 40,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: '#fff',
            border: '2px solid #0d0f10',
            borderRadius: 999,
            padding: '10px 20px 10px 14px',
            transform: 'rotate(0.8deg)',
            boxShadow: '6px 6px 0 #0d0f10',
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#d9ff3a',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 14,
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

        {/* Contact */}
        <div
          style={{
            marginTop: 48,
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#696c6f',
            fontWeight: 600,
          }}
        >
          ¿Necesitas algo urgente?{' '}
          <a
            href="mailto:contacto@conniku.com"
            style={{ color: '#0d0f10', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            contacto@conniku.com
          </a>
        </div>

        {/* Footer con wordmark pequeño */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#696c6f',
            fontWeight: 600,
          }}
        >
          Conniku SpA · Hecho en Chile · +18
        </div>
      </div>
    </div>
  );
}
