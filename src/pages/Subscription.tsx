import React from 'react'
import { useAuth } from '../services/auth'

interface Props {
  onNavigate: (path: string) => void
}

export default function Subscription({ onNavigate }: Props) {
  const { user } = useAuth()

  const isPro = user?.subscriptionStatus === 'active'
  const isFree = !isPro

  const plans = [
    {
      id: 'free',
      name: 'Plan Basico',
      price: 'Gratis',
      priceDetail: null,
      features: [
        'Max 2 asignaturas',
        'Chat con documentos limitado (20 mensajes cada 5 horas)',
        'Guias de estudio',
        'Comunidad y mensajes',
        'Perfil y amigos',
      ],
      isCurrent: isFree,
      highlight: false,
    },
    {
      id: 'pro',
      name: 'Plan Estudiante PRO',
      price: '$8 USD',
      priceDetail: '/mes',
      features: [
        'Asignaturas ilimitadas',
        'Chat ilimitado con documentos',
        'Exportar a DOCX',
        'Flashcards y quizzes ilimitados',
        'Videos y transcripciones',
        'Soporte prioritario',
        'Badge PRO en perfil',
      ],
      isCurrent: isPro,
      highlight: true,
    },
  ]

  return (
    <>
      <div className="page-header">
        <h2>Elige tu plan</h2>
        <p>Desbloquea todo el potencial de StudyHub con el plan que mejor se adapte a ti.</p>
      </div>
      <div className="page-body">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
          marginBottom: '2rem',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: '2rem',
                border: plan.highlight ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                borderRadius: 16,
                position: 'relative',
                boxShadow: plan.highlight ? '0 4px 24px rgba(79,140,255,0.15)' : undefined,
                transform: plan.highlight ? 'scale(1.03)' : undefined,
              }}
            >
              {plan.isCurrent && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent-blue)', color: '#fff', padding: '4px 16px',
                  borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  Tu plan actual
                </span>
              )}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>{plan.name}</h2>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {plan.price}
                  {plan.priceDetail && <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>{plan.priceDetail}</span>}
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                {plan.features.map((feat) => (
                  <li key={feat} style={{ padding: '0.45rem 0', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div style={{ textAlign: 'center' }}>
                {plan.id === 'pro' && !isPro && (
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 600, borderRadius: 10 }}
                    onClick={() => onNavigate('/checkout')}>
                    Comenzar prueba gratis (7 dias)
                  </button>
                )}
                {plan.id === 'pro' && isPro && (
                  <button className="btn" disabled style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: 10, opacity: 0.6 }}>
                    Ya tienes PRO
                  </button>
                )}
                {plan.id === 'free' && isFree && (
                  <button className="btn" disabled style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: 10, opacity: 0.6 }}>
                    Plan actual
                  </button>
                )}
                {plan.id === 'free' && isPro && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Plan gratuito disponible</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Preguntas frecuentes
          </h2>
          {[
            { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. No hay contratos ni compromisos. Si cancelas, mantendrás el acceso PRO hasta el final de tu periodo de facturación.' },
            { q: '¿Qué pasa después de la prueba gratuita?', a: 'Después de los 7 días de prueba gratuita, se te cobrará $8 USD/mes automáticamente. Si decides no continuar, simplemente cancela antes de que termine la prueba y no se te cobrará nada.' },
            { q: '¿Puedo cambiar de plan más adelante?', a: 'Por supuesto. Puedes actualizar al Plan Estudiante PRO en cualquier momento o volver al Plan Básico si lo prefieres. Los cambios se aplican de inmediato.' },
          ].map((faq, i) => (
            <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: 12, marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.4rem' }}>{faq.q}</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, fontSize: '0.9rem' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
