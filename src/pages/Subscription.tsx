import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

export default function Subscription({ onNavigate }: Props) {
  const { user } = useAuth()
  const [subStatus, setSubStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [localPrices, setLocalPrices] = useState<any>(null)

  useEffect(() => {
    api.getSubscriptionStatus().then(setSubStatus).catch(() => {})
    api.getFinancePrices(user?.country || 'CL').then(setLocalPrices).catch(() => {})
    // Check URL params for success/cancel
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      alert('¡Suscripción activada! Bienvenido a Conniku PRO 🎉')
      window.history.replaceState({}, '', '/subscription')
    }
    if (params.get('cancelled') === 'true') {
      window.history.replaceState({}, '', '/subscription')
    }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const result = await api.createCheckoutSession(selectedPlan)
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err: any) {
      alert(err.message || 'Error al iniciar el pago')
    }
    setLoading(false)
  }

  const handleManageSubscription = async () => {
    try {
      const result = await api.createPortalSession()
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err: any) {
      alert(err.message || 'Error al abrir el portal')
    }
  }

  const isActive = subStatus?.status === 'active'
  const isTrial = subStatus?.isTrial

  return (
    <>
      <div className="page-header">
        <h2>💎 Suscripción</h2>
        <p>Potencia tu estudio con Conniku PRO</p>
      </div>
      <div className="page-body">
        {/* Current Status */}
        {subStatus && (
          <div className="card" style={{ padding: 20, marginBottom: 24, borderLeft: `4px solid ${isActive ? 'var(--accent-green)' : isTrial ? 'var(--accent-orange)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  {isActive ? '✅ Conniku PRO Activo' : isTrial ? `⏳ Período de Prueba (${subStatus.trialDaysLeft} días restantes)` : '📋 Plan Gratuito'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  {isActive && subStatus.expiresAt ? `Próxima renovación: ${new Date(subStatus.expiresAt).toLocaleDateString('es')}` :
                   isTrial ? 'Tu prueba incluye acceso a todas las funciones PRO' :
                   'Actualiza para desbloquear todo el potencial'}
                </p>
              </div>
              {isActive && (
                <button className="btn btn-secondary btn-sm" onClick={handleManageSubscription}>
                  Gestionar Suscripción
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plan Selection */}
        {!isActive && (
          <>
            {/* Billing Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              <button onClick={() => setSelectedPlan('monthly')}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: `2px solid ${selectedPlan === 'monthly' ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedPlan === 'monthly' ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: selectedPlan === 'monthly' ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                Mensual
              </button>
              <button onClick={() => setSelectedPlan('yearly')}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: `2px solid ${selectedPlan === 'yearly' ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedPlan === 'yearly' ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: selectedPlan === 'yearly' ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                Anual <span style={{ fontSize: 11, color: 'var(--accent-green)', marginLeft: 4 }}>Ahorra 33%</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 900, margin: '0 auto' }}>
              {/* Free Plan */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Básico</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>$0</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Para empezar y conectar</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ 2 asignaturas</li>
                  <li>✓ 20 consultas / 6 horas</li>
                  <li>✓ Red social básica</li>
                  <li>✓ Cursos de desarrollo</li>
                  <li>✓ 100 MB almacenamiento</li>
                  <li>✓ Prueba diagnóstica</li>
                  <li style={{ color: 'var(--text-muted)' }}>✗ Exportar DOCX</li>
                  <li style={{ color: 'var(--text-muted)' }}>✗ Predictor de examen</li>
                  <li style={{ color: 'var(--text-muted)' }}>✗ Publicar empleos</li>
                </ul>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: 20 }} disabled>Plan Actual</button>
              </div>

              {/* PRO Plan */}
              <div className="card" style={{ padding: 24, border: '2px solid var(--accent)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>MÁS POPULAR</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>⭐ Pro</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${selectedPlan === 'monthly' ? '5' : '39.99'}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/{selectedPlan === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                {localPrices?.plans && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ≈ {localPrices.plans[selectedPlan === 'monthly' ? 'pro_monthly' : 'pro_yearly']?.formatted} {localPrices.currency}
                  </div>
                )}
                {selectedPlan === 'yearly' && (
                  <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 20 }}>= $6.67/mes · Ahorras $40/año</div>
                )}
                {selectedPlan === 'monthly' && <div style={{ height: 20, marginBottom: 20 }} />}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Para estudiar en serio</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ 8 asignaturas</li>
                  <li>✓ 200 consultas / día</li>
                  <li>✓ Sin anuncios</li>
                  <li>✓ Exportar DOCX</li>
                  <li>✓ Crear comunidades</li>
                  <li>✓ Predictor de examen 🔮</li>
                  <li>✓ CV Generator</li>
                  <li>✓ 2 GB almacenamiento</li>
                  <li>✓ +20% XP bonus</li>
                </ul>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}
                  onClick={handleSubscribe} disabled={loading}>
                  {loading ? 'Procesando...' : 'Comenzar Prueba Gratis (7 días)'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  Cobro automático {selectedPlan === 'monthly' ? 'mensual' : 'anual'} · Cancela cuando quieras
                </p>
              </div>

              {/* MAX Plan */}
              <div className="card" style={{ padding: 24, border: '2px solid var(--accent-purple)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--accent-purple)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>PREMIUM</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>👑 Max</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${selectedPlan === 'monthly' ? '13' : '99.99'}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/{selectedPlan === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                {localPrices?.plans && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ≈ {localPrices.plans[selectedPlan === 'monthly' ? 'max_monthly' : 'max_yearly']?.formatted} {localPrices.currency}
                  </div>
                )}
                {selectedPlan === 'yearly' && (
                  <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 20 }}>= $8.33/mes · Ahorras $56/año</div>
                )}
                {selectedPlan === 'monthly' && <div style={{ height: 20, marginBottom: 20 }} />}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Para liderar y dominar</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ Todo ilimitado</li>
                  <li>✓ Publicar ofertas de empleo</li>
                  <li>✓ Salas de estudio públicas</li>
                  <li>✓ Portfolio público</li>
                  <li>✓ 10 GB almacenamiento</li>
                  <li>✓ +50% XP bonus</li>
                  <li>✓ Soporte prioritario</li>
                  <li>✓ Early access features</li>
                  <li>✓ Badge 👑 exclusivo</li>
                </ul>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, background: 'var(--accent-purple)' }}
                  onClick={handleSubscribe} disabled={loading}>
                  {loading ? 'Procesando...' : 'Activar Max'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  Cobro automático {selectedPlan === 'monthly' ? 'mensual' : 'anual'} · Stripe seguro
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ maxWidth: 700, margin: '32px auto 0' }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Preguntas Frecuentes</h3>
              {[
                { q: '¿Puedo cancelar cuando quiera?', a: 'Sí, cancela en cualquier momento desde tu portal de suscripción. No hay contratos ni compromisos.' },
                { q: '¿Qué pasa con mis datos si cancelo?', a: 'Tus datos se mantienen. Simplemente pierdes acceso a las funciones PRO y vuelves al plan gratuito.' },
                { q: '¿Qué métodos de pago aceptan?', a: 'Tarjeta de crédito/débito (Visa, Mastercard, AMEX) procesado de forma segura por Stripe.' },
                { q: '¿La prueba gratis tiene costo?', a: 'No. Los primeros 7 días son completamente gratis. Solo se cobra si decides continuar.' },
              ].map((faq, i) => (
                <div key={i} style={{ marginBottom: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <strong style={{ fontSize: 14 }}>{faq.q}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Active Subscriber Features */}
        {isActive && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Tu Plan PRO Incluye</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { icon: '📚', label: 'Asignaturas ilimitadas' },
                { icon: '📚', label: 'Chat con tus documentos ilimitado' },
                { icon: '🧠', label: 'Quizzes ilimitados' },
                { icon: '🃏', label: 'Flashcards FSRS' },
                { icon: '🚀', label: 'Upload to Study' },
                { icon: '💾', label: '5 GB almacenamiento' },
                { icon: '🧭', label: 'Modo Socrático' },
                { icon: '📥', label: 'Exportar a Word' },
                { icon: '⚡', label: 'Soporte prioritario' },
              ].map(f => (
                <div key={f.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
