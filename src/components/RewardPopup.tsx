import React from 'react'
import { Star } from './Icons'

interface Props {
  type: 'pro' | 'max'
  onClose: () => void
}

export default function RewardPopup({ type, onClose }: Props) {
  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        maxWidth: 420, overflow: 'hidden', textAlign: 'center', padding: 0,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2D62C8 0%, #2D5FAA 50%, #C4882A 100%)',
          padding: '30px 24px 24px', color: '#fff',
        }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>{Star({ size: 48 })}</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, margin: 0 }}>
            {type === 'pro' ? '3 cursos completados' : '6 cursos completados'}
          </h3>
          <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
            Has desbloqueado el Plan {type.toUpperCase()} por 1 mes
          </p>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: type === 'pro' ? '#EEF2FF' : '#FEF3C7',
            padding: '10px 20px', borderRadius: 10, marginBottom: 14,
          }}>
            <span style={{
              fontSize: 22, fontWeight: 800,
              color: type === 'pro' ? '#5B5FC7' : '#92400E',
            }}>{type.toUpperCase()}</span>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: type === 'pro' ? '#5B5FC7' : '#92400E',
            }}>1 mes gratis</span>
          </div>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            Has completado <strong>{type === 'pro' ? '3' : '6'} cursos</strong>. Como recompensa, tu cuenta ha sido actualizada a <strong>Plan {type === 'pro' ? 'Pro' : 'Max'}</strong> por 1 mes sin costo.
            {type === 'pro' ? ' Disfruta de acceso ampliado a cursos y herramientas.' : ' Acceso total a toda la plataforma, cursos avanzados e IA.'}
          </p>
          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 16, padding: '10px 28px' }}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
