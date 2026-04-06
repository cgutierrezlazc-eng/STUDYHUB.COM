import React from 'react'

interface Props {
  onNavigate: (path: string) => void
}

export default function NotFound({ onNavigate }: Props) {
  return (
    <div style={{
      height: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', flexDirection: 'column', gap: 0,
    }}>
      {/* Animated 404 illustration */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {/* Background circle */}
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(45,98,200,0.08) 0%, rgba(45,98,200,0.03) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Logo mark */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#2D62C8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(45,98,200,0.3)',
            animation: 'notfound-float 3s ease-in-out infinite',
          }}>
            <svg viewBox="0 0 40 40" width={40} height={40}>
              <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" transform="rotate(-45, 20, 20)" />
            </svg>
          </div>
        </div>
        {/* Question marks */}
        <span style={{
          position: 'absolute', top: 8, right: -4, fontSize: 28, opacity: 0.15, fontWeight: 800, color: '#2D62C8',
          animation: 'notfound-float 2.5s ease-in-out infinite 0.3s',
        }}>?</span>
        <span style={{
          position: 'absolute', bottom: 12, left: -8, fontSize: 20, opacity: 0.1, fontWeight: 800, color: '#2D62C8',
          animation: 'notfound-float 2.8s ease-in-out infinite 0.6s',
        }}>?</span>
      </div>

      {/* 404 number */}
      <h1 style={{
        fontFamily: "'Outfit', -apple-system, sans-serif",
        fontSize: 72, fontWeight: 800, margin: 0, lineHeight: 1,
        background: 'linear-gradient(135deg, #2D62C8 0%, #1a4494 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.04em',
      }}>
        404
      </h1>

      {/* Message */}
      <h2 style={{
        fontFamily: "'Outfit', -apple-system, sans-serif",
        fontSize: 22, fontWeight: 700, margin: '8px 0 0', color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}>
        Pagina no encontrada
      </h2>
      <p style={{
        fontSize: 14, color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'center',
        maxWidth: 400, lineHeight: 1.6,
      }}>
        La pagina que buscas no existe o fue movida. Revisa la URL o vuelve al inicio.
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => onNavigate('/')}
          style={{
            padding: '10px 28px', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
            background: '#2D62C8', color: '#fff', border: 'none',
            boxShadow: '0 2px 12px rgba(45,98,200,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,98,200,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(45,98,200,0.3)' }}
        >
          Ir al Inicio
        </button>
        <button onClick={() => onNavigate('/dashboard')}
          style={{
            padding: '10px 28px', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
          Dashboard
        </button>
        <button onClick={() => onNavigate('/courses')}
          style={{
            padding: '10px 28px', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
          Cursos
        </button>
      </div>

      {/* Quick links */}
      <div style={{
        marginTop: 40, padding: '16px 24px', borderRadius: 12,
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        maxWidth: 460, width: '100%',
      }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Enlaces rapidos
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { path: '/feed', label: 'Feed' },
            { path: '/communities', label: 'Comunidades' },
            { path: '/jobs', label: 'Bolsa de Trabajo' },
            { path: '/events', label: 'Eventos' },
            { path: '/mentorship', label: 'Tutorias' },
            { path: '/friends', label: 'Amigos' },
            { path: '/messages', label: 'Mensajes' },
            { path: '/marketplace', label: 'Marketplace' },
          ].map(link => (
            <button key={link.path} onClick={() => onNavigate(link.path)}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer',
                background: 'var(--bg-primary)', color: 'var(--accent-blue)', border: '1px solid var(--border-subtle)',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-blue)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-blue)' }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes notfound-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
