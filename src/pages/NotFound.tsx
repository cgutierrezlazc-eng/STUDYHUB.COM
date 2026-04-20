import React from 'react';
import { useI18n } from '../services/i18n';

interface Props {
  onNavigate: (path: string) => void;
}

export default function NotFound({ onNavigate }: Props) {
  const { t } = useI18n();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f4ef',
        color: '#0d0f10',
        fontFamily: "'Funnel Display', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: 380,
          height: 380,
          background: 'radial-gradient(circle, #d9ff3a 0%, transparent 70%)',
          opacity: 0.3,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '12%',
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, #ff4d3a 0%, transparent 70%)',
          opacity: 0.25,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('/');
        }}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'baseline',
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: '-0.055em',
          lineHeight: 1,
          color: '#0d0f10',
          textDecoration: 'none',
          marginBottom: 48,
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

      <h1
        style={{
          position: 'relative',
          zIndex: 1,
          fontWeight: 800,
          fontSize: 'clamp(120px, 22vw, 260px)',
          letterSpacing: '-0.07em',
          lineHeight: 0.88,
          margin: 0,
          color: '#0d0f10',
        }}
      >
        4
        <span
          style={{
            background: '#6b4eff',
            color: '#fff',
            padding: '0 12px',
            borderRadius: 24,
            display: 'inline-block',
            transform: 'rotate(-3deg)',
          }}
        >
          0
        </span>
        4
      </h1>

      <h2
        style={{
          position: 'relative',
          zIndex: 1,
          fontWeight: 800,
          fontSize: 'clamp(24px, 3.5vw, 40px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginTop: 28,
          marginBottom: 14,
          textAlign: 'center',
          maxWidth: 640,
        }}
      >
        Esta página no{' '}
        <span style={{ background: '#ffe9b8', padding: '0 8px', borderRadius: 10 }}>existe</span>.
      </h2>

      <p
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 17,
          color: '#2b2e30',
          lineHeight: 1.5,
          textAlign: 'center',
          maxWidth: 460,
          margin: '0 0 32px',
          fontWeight: 500,
        }}
      >
        {t('notFound.msg') ||
          'Revisa la URL o vuelve al inicio. Si crees que es un error, avísanos.'}
      </p>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: '#0d0f10',
            color: '#d9ff3a',
            border: '2px solid #0d0f10',
            borderRadius: 999,
            padding: '12px 22px 12px 28px',
            fontFamily: "'Funnel Display', -apple-system, sans-serif",
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          Volver al inicio
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#d9ff3a',
              color: '#0d0f10',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            →
          </span>
        </button>
        <button
          onClick={() => onNavigate('/soporte')}
          style={{
            background: '#fff',
            color: '#0d0f10',
            border: '2px solid #0d0f10',
            borderRadius: 999,
            padding: '12px 22px',
            fontFamily: "'Funnel Display', -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Contactar soporte
        </button>
      </div>
    </div>
  );
}
