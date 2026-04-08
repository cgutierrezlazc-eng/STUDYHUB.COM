import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { Gem, CheckCircle, Hourglass, ClipboardList, Star, Crown, BookOpen, Brain, Rocket, Save, Compass, Download, Zap } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

export default function Subscription({ onNavigate }: Props) {
  const { user } = useAuth()
  const [subStatus, setSubStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [localPrices, setLocalPrices] = useState<any>(null)
  const [mpPlans, setMpPlans] = useState<any>(null)
  const [selectedTier, setSelectedTier] = useState<'pro' | 'max'>('pro')

  useEffect(() => {
    api.getSubscriptionStatus().then(setSubStatus).catch(() => {})
    api.getFinancePrices(user?.country || 'CL').then(setLocalPrices).catch(() => {})
    api.getMpPlans().then(setMpPlans).catch(() => {})
    // Check URL params for success/cancel (Mercado Pago + PayPal)
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true' || params.get('mp_status') === 'approved' || params.get('paypal_status') === 'approved') {
      alert('¡Suscripcion activada! Bienvenido a Conniku PRO')
      window.history.replaceState({}, '', '/suscripcion')
    }
    if (params.get('cancelled') === 'true' || params.get('mp_status') === 'failed' || params.get('paypal_status') === 'cancelled') {
      window.history.replaceState({}, '', '/suscripcion')
    }
    if (params.get('mp_status') === 'pending') {
      alert('Tu pago esta pendiente. Te notificaremos cuando se confirme.')
      window.history.replaceState({}, '', '/suscripcion')
    }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    const planKey = `${selectedTier}_${selectedPlan}`
    try {
      // 1. Mercado Pago (Chile/LATAM — pesos chilenos)
      const result = await api.createMpCheckout(planKey)
      if (result.url || result.initPoint) {
        window.location.href = result.url || result.initPoint
        return
      }
    } catch { /* MP not available, try PayPal */ }
    try {
      // 2. PayPal (internacional — USD)
      const ppResult = await api.createPaypalOrder(planKey)
      if (ppResult.approve_url) {
        window.location.href = ppResult.approve_url
        return
      }
    } catch (err: any) {
      alert(err.message || 'Error al iniciar el pago. Intenta con otro metodo.')
    }
    setLoading(false)
  }

  const handleManageSubscription = async () => {
    try {
      // Check provider and cancel accordingly
      if (subStatus?.provider === 'mercadopago' || subStatus?.hasMercadoPago) {
        if (confirm('¿Deseas cancelar tu suscripcion?')) {
          await api.cancelMpSubscription()
          alert('Suscripcion cancelada')
          window.location.reload()
        }
        return
      }
      if (subStatus?.provider === 'paypal' && subStatus?.paypal_subscription_id) {
        if (confirm('¿Deseas cancelar tu suscripcion de PayPal?')) {
          await api.cancelPaypalSubscription(subStatus.paypal_subscription_id)
          alert('Suscripcion de PayPal cancelada')
          window.location.reload()
        }
        return
      }
    } catch (err: any) {
      alert(err.message || 'Error al gestionar suscripcion')
    }
  }

  const isActive = subStatus?.status === 'active'
  const isTrial = subStatus?.isTrial

  return (
    <>
      <div className="page-header page-enter">
        <h2>{Gem()} Suscripción</h2>
        <p>Potencia tu estudio con Conniku PRO</p>
      </div>
      <div className="page-body">
        {/* Current Status */}
        {subStatus && (
          <div className="u-card" style={{ padding: 20, marginBottom: 24, borderLeft: `4px solid ${isActive ? 'var(--accent-green)' : isTrial ? 'var(--accent-orange)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  {isActive ? <>{CheckCircle()} Conniku PRO Activo</> : isTrial ? <>{Hourglass()} Período de Prueba ({subStatus.trialDaysLeft} días restantes)</> : <>{ClipboardList()} Plan Gratuito</>}
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
              <div className="u-card" style={{ padding: 24 }}>
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
              <div className="u-card" style={{ padding: 24, border: '2px solid var(--accent)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>MÁS POPULAR</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>{Star({ size: 14 })} Pro</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${selectedPlan === 'monthly' ? '7.490' : '71.900'}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> CLP/{selectedPlan === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ≈ USD ${selectedPlan === 'monthly' ? '8' : '77'}/{selectedPlan === 'monthly' ? 'mes' : 'año'}
                </div>
                {selectedPlan === 'yearly' && (
                  <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 20 }}>= $5.992/mes · Ahorras $17.980/año</div>
                )}
                {selectedPlan === 'monthly' && <div style={{ height: 20, marginBottom: 20 }} />}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Para estudiar en serio</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ 8 asignaturas</li>
                  <li>✓ 200 consultas / día</li>
                  <li>✓ Sin anuncios</li>
                  <li>✓ Exportar DOCX</li>
                  <li>✓ Crear comunidades</li>
                  <li>✓ Predictor de examen</li>
                  <li>✓ CV Generator</li>
                  <li>✓ 2 GB almacenamiento</li>
                  <li>✓ +20% XP bonus</li>
                </ul>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}
                  onClick={() => { setSelectedTier('pro'); handleSubscribe() }} disabled={loading}>
                  {loading ? 'Procesando...' : 'Comenzar Prueba Gratis (7 dias)'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  Cobro automático {selectedPlan === 'monthly' ? 'mensual' : 'anual'} · Cancela cuando quieras
                </p>
              </div>

              {/* MAX Plan */}
              <div className="u-card" style={{ padding: 24, border: '2px solid var(--accent-purple)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--accent-purple)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>PREMIUM</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>{Crown({ size: 14 })} Max</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${selectedPlan === 'monthly' ? '11.990' : '115.900'}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> CLP/{selectedPlan === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ≈ USD ${selectedPlan === 'monthly' ? '13' : '125'}/{selectedPlan === 'monthly' ? 'mes' : 'año'}
                </div>
                {selectedPlan === 'yearly' && (
                  <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 20 }}>= $9.658/mes · Ahorras $27.980/año</div>
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
                  <li>✓ Badge exclusivo</li>
                </ul>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, background: 'var(--accent-purple)' }}
                  onClick={() => { setSelectedTier('max'); handleSubscribe() }} disabled={loading}>
                  {loading ? 'Procesando...' : 'Activar Max'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  Cobro automatico {selectedPlan === 'monthly' ? 'mensual' : 'anual'} · Pago seguro
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ textAlign: 'center', margin: '24px auto 0', maxWidth: 700 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Metodos de pago aceptados</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {['Mercado Pago', 'Visa', 'Mastercard', 'AMEX', 'Webpay', 'PayPal', 'Google Pay'].map(m => (
                  <span key={m} style={{
                    padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}>{m}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, alignItems: 'center' }}>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pagos seguros con encriptacion SSL · Sin almacenar datos de tarjeta</span>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ maxWidth: 700, margin: '32px auto 0' }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Preguntas Frecuentes</h3>
              {[
                { q: '¿Puedo cancelar cuando quiera?', a: 'Sí, cancela en cualquier momento desde tu portal de suscripción. No hay contratos ni compromisos.' },
                { q: '¿Qué pasa con mis datos si cancelo?', a: 'Tus datos se mantienen. Simplemente pierdes acceso a las funciones PRO y vuelves al plan gratuito.' },
                { q: '¿Que metodos de pago aceptan?', a: 'Mercado Pago (tarjetas, transferencia, Webpay), PayPal, Google Pay y tarjetas internacionales (Visa, Mastercard, AMEX).' },
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
                { icon: BookOpen({ size: 24 }), label: 'Asignaturas ilimitadas' },
                { icon: BookOpen({ size: 24 }), label: 'Chat con tus documentos ilimitado' },
                { icon: Brain({ size: 24 }), label: 'Quizzes ilimitados' },
                { icon: ClipboardList({ size: 24 }), label: 'Flashcards FSRS' },
                { icon: Rocket({ size: 24 }), label: 'Upload to Study' },
                { icon: Save({ size: 24 }), label: '5 GB almacenamiento' },
                { icon: Compass({ size: 24 }), label: 'Modo Socrático' },
                { icon: Download({ size: 24 }), label: 'Exportar a Word' },
                { icon: Zap({ size: 24 }), label: 'Soporte prioritario' },
              ].map(f => (
                <div key={f.label} className="u-card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{f.icon}</div>
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
