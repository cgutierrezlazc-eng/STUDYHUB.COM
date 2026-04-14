import React, { useState, useRef, useCallback } from 'react';
import { api } from '../services/api';

interface Props {
  onAccept: () => void;
}

export default function WelcomeModal({ onAccept }: Props) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [wantsCeoFriend, setWantsCeoFriend] = useState<boolean | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const handleAccept = async () => {
    // Send CEO friend request in background if user opted in
    if (wantsCeoFriend) {
      try {
        const results = await api.searchSocialUsers('ceo@conniku.com');
        const ceo = Array.isArray(results) ? results[0] : null;
        if (ceo?.id) {
          await api.sendFriendRequest(ceo.id);
        }
      } catch {
        // Don't block entry if friend request fails
      }
    }
    onAccept();
  };

  const canAccept = accepted && wantsCeoFriend !== null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2D62C8 0%, #3A75D9 60%, #4B8AE8 100%)',
            padding: '28px 32px 22px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 40 40" width={16} height={16}>
                <circle
                  cx="20"
                  cy="20"
                  r="12"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="56 19"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Outfit', -apple-system, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.03em',
              }}
            >
              conni<span style={{ opacity: 0.85 }}>ku</span>
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, margin: 0 }}>
            Bienvenido a Conniku
          </h2>
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Nos alegra que estes aqui</p>
        </div>

        {/* Body — scrolleable */}
        <div
          ref={bodyRef}
          onScroll={handleScroll}
          style={{
            padding: '28px 32px',
            overflowY: 'auto',
            flex: 1,
            fontSize: 13.5,
            color: 'var(--text-primary)',
            lineHeight: 1.75,
          }}
        >
          <p style={{ marginBottom: 14 }}>Hola,</p>

          <p style={{ marginBottom: 14 }}>
            Quiero darte la bienvenida personalmente a Conniku. Este proyecto nacio de una
            conviccion simple: los estudiantes universitarios merecen herramientas que realmente les
            sirvan para crecer, no solo academicamente, sino como personas y futuros profesionales.
          </p>

          <p style={{ marginBottom: 14 }}>
            Conniku no es solo una plataforma de estudio. Es un espacio donde puedes compartir
            conocimiento con tu comunidad, desarrollar habilidades de liderazgo, comunicacion y
            pensamiento critico, y conectar con personas que comparten tus ambiciones. Creemos que
            las habilidades que te hacen destacar profesionalmente no siempre se ensenan en el aula,
            y queremos ayudarte a construirlas.
          </p>

          <p style={{ marginBottom: 14 }}>
            Vas a encontrar cursos practicos, herramientas de colaboracion, conferencias con
            profesionales que estan donde tu quieres llegar, y una comunidad de estudiantes que,
            como tu, buscan algo mas.
          </p>

          <p style={{ marginBottom: 14 }}>
            Tambien quiero que sepas que esta plataforma se construye contigo. Si hay algo que
            podemos mejorar, una funcionalidad que te haga falta, o una idea que crees que
            deberiamos explorar, queremos escucharte. Tu opinion no es un formulario que nadie lee:
            es lo que define hacia donde vamos.
          </p>

          <p style={{ marginBottom: 14 }}>
            Gracias por confiar en este proyecto. Esperamos estar a la altura.
          </p>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 1,
              }}
            >
              Cristian Gutierrez Lazcano
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Fundador y Director Ejecutivo, Conniku
            </div>
          </div>

          {!hasScrolledToBottom && (
            <div
              style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: 12,
                color: 'var(--text-muted)',
                animation: 'fadeInUp 0.5s',
              }}
            >
              ↓ Desplaza hacia abajo para continuar
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid var(--border)',
            opacity: hasScrolledToBottom ? 1 : 0.4,
            transition: 'opacity 0.3s',
          }}
        >
          {/* Checkbox terminos */}
          <label
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: hasScrolledToBottom ? 'pointer' : 'default',
              marginBottom: 14,
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              disabled={!hasScrolledToBottom}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: '#2D62C8',
                cursor: hasScrolledToBottom ? 'pointer' : 'default',
              }}
            />
            Acepto los <strong style={{ color: 'var(--accent)' }}>Terminos y Condiciones</strong> de
            la plataforma
          </label>

          {/* Opcion amistad CEO */}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
              ¿Te gustaria conectar directamente con el CEO de Conniku?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={!hasScrolledToBottom}
                onClick={() => setWantsCeoFriend(true)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: hasScrolledToBottom ? 'pointer' : 'default',
                  border: wantsCeoFriend === true ? '2px solid #2D62C8' : '1px solid var(--border)',
                  background: wantsCeoFriend === true ? '#2D62C810' : 'var(--bg-secondary)',
                  color: wantsCeoFriend === true ? '#2D62C8' : 'var(--text-secondary)',
                }}
              >
                Si, conectar
              </button>
              <button
                disabled={!hasScrolledToBottom}
                onClick={() => setWantsCeoFriend(false)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: hasScrolledToBottom ? 'pointer' : 'default',
                  border:
                    wantsCeoFriend === false
                      ? '2px solid var(--text-muted)'
                      : '1px solid var(--border)',
                  background:
                    wantsCeoFriend === false ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                }}
              >
                No, gracias
              </button>
            </div>
          </div>

          {/* Boton comenzar */}
          <button
            onClick={handleAccept}
            disabled={!canAccept}
            className="btn btn-primary"
            style={{
              width: '100%',
              opacity: canAccept ? 1 : 0.5,
              pointerEvents: canAccept ? 'auto' : 'none',
              padding: '10px 28px',
            }}
          >
            Comenzar
          </button>
        </div>
      </div>
    </div>
  );
}
