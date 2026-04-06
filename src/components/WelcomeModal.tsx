import React, { useState } from 'react'

interface Props {
  onAccept: () => void
}

export default function WelcomeModal({ onAccept }: Props) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        maxWidth: 560, maxHeight: '88vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', padding: 0,
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2D62C8 0%, #3A75D9 60%, #4B8AE8 100%)',
          padding: '28px 32px 22px', color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 40 40" width={16} height={16}><circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" transform="rotate(-45, 20, 20)" /></svg>
            </div>
            <span style={{ fontFamily: "'Outfit', -apple-system, sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
              conni<span style={{ opacity: 0.85 }}>ku</span>
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, margin: 0 }}>Bienvenido a Conniku</h2>
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Nos alegra que estés aquí</p>
        </div>

        {/* Body */}
        <div style={{
          padding: '28px 32px', overflowY: 'auto', flex: 1,
          fontSize: 13.5, color: '#444', lineHeight: 1.75,
        }}>
          <p style={{ marginBottom: 14 }}>Hola,</p>

          <p style={{ marginBottom: 14 }}>
            Quiero darte la bienvenida personalmente a Conniku. Este proyecto nació de una convicción simple: los estudiantes universitarios merecen herramientas que realmente les sirvan para crecer, no solo académicamente, sino como personas y futuros profesionales.
          </p>

          <p style={{ marginBottom: 14 }}>
            Conniku no es solo una plataforma de estudio. Es un espacio donde puedes compartir conocimiento con tu comunidad, desarrollar habilidades de liderazgo, comunicación y pensamiento crítico, y conectar con personas que comparten tus ambiciones. Creemos que las habilidades que te hacen destacar profesionalmente no siempre se enseñan en el aula, y queremos ayudarte a construirlas.
          </p>

          <p style={{ marginBottom: 14 }}>
            Vas a encontrar cursos prácticos, herramientas de colaboración, conferencias con profesionales que están donde tú quieres llegar, y una comunidad de estudiantes que, como tú, buscan algo más.
          </p>

          <p style={{ marginBottom: 14 }}>
            También quiero que sepas que esta plataforma se construye contigo. Si hay algo que podemos mejorar, una funcionalidad que te haga falta, o una idea que crees que deberíamos explorar, queremos escucharte. Tu opinión no es un formulario que nadie lee: es lo que define hacia dónde vamos.
          </p>

          <p style={{ marginBottom: 14 }}>
            Gracias por confiar en este proyecto. Esperamos estar a la altura.
          </p>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 1 }}>Cristian Gutierrez Lazcano</div>
            <div style={{ fontSize: 12, color: '#888' }}>Fundador y Director Ejecutivo, Conniku</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px', borderTop: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#2D62C8', cursor: 'pointer' }}
            />
            Acepto los <strong style={{ color: '#2D62C8' }}>Términos y Condiciones</strong> de la plataforma
          </label>
          <button
            onClick={onAccept}
            disabled={!accepted}
            className="btn btn-primary"
            style={{
              opacity: accepted ? 1 : 0.5,
              pointerEvents: accepted ? 'auto' : 'none',
              padding: '10px 28px',
            }}
          >
            Comenzar
          </button>
        </div>
      </div>
    </div>
  )
}
