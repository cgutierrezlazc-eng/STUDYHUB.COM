import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { Gem, CheckCircle, Hourglass, ClipboardList, Star, Crown, BookOpen, Brain, Rocket, Save, Compass, Download, Zap } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

export default function Subscription({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [subStatus, setSubStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [localPrices, setLocalPrices] = useState<any>(null)
  const [mpPlans, setMpPlans] = useState<any>(null)
  const [selectedTier, setSelectedTier] = useState<'pro' | 'max'>('pro')

  useEffect(() => {
    api.getMpSubscriptionStatus().then(setSubStatus).catch(() => {})
    api.getFinancePrices(user?.country || 'CL').then(setLocalPrices).catch(() => {})
    api.getMpPlans().then(setMpPlans).catch(() => {})
    // Check URL params for success/cancel (Mercado Pago + PayPal)
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true' || params.get('mp_status') === 'approved' || params.get('paypal_status') === 'approved') {
      alert(t('sub.subscriptionActivated'))
      window.history.replaceState({}, '', '/suscripcion')
    }
    if (params.get('cancelled') === 'true' || params.get('mp_status') === 'failed' || params.get('paypal_status') === 'cancelled') {
      window.history.replaceState({}, '', '/suscripcion')
    }
    if (params.get('mp_status') === 'pending') {
      alert(t('sub.paymentPending'))
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
      alert(err.message || t('sub.errorPayment'))
    }
    setLoading(false)
  }

  const handleManageSubscription = async () => {
    try {
      // Check provider and cancel accordingly
      if (subStatus?.provider === 'mercadopago' || subStatus?.hasMercadoPago) {
        if (confirm(t('sub.cancelConfirm'))) {
          await api.cancelMpSubscription()
          alert(t('sub.subscriptionCancelled'))
          window.location.reload()
        }
        return
      }
      if (subStatus?.provider === 'paypal' && subStatus?.paypal_subscription_id) {
        if (confirm(t('sub.cancelPaypalConfirm'))) {
          await api.cancelPaypalSubscription(subStatus.paypal_subscription_id)
          alert(t('sub.paypalCancelled'))
          window.location.reload()
        }
        return
      }
    } catch (err: any) {
      alert(err.message || t('sub.errorManage'))
    }
  }

  const isActive = subStatus?.status === 'active'
  const isTrial = subStatus?.isTrial

  return (
    <>
      <div className="page-header page-enter">
        <h2>{Gem()} {t('sub.title')}</h2>
        <p>{t('sub.subtitle')}</p>
      </div>
      <div className="page-body">
        {/* Current Status */}
        {subStatus && (
          <div className="u-card" style={{ padding: 20, marginBottom: 24, borderLeft: `4px solid ${isActive ? 'var(--accent-green)' : isTrial ? 'var(--accent-orange)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  {isActive ? <>{CheckCircle()} {t('sub.proActive')}</> : isTrial ? <>{Hourglass()} {t('sub.trial')} ({subStatus.trialDaysLeft} {t('sub.trialDaysLeft')})</> : <>{ClipboardList()} {t('sub.freePlan')}</>}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  {isActive && subStatus.expiresAt ? `${t('sub.nextRenewal')}: ${new Date(subStatus.expiresAt).toLocaleDateString('es')}` :
                   isTrial ? t('sub.trialIncludesAll') :
                   t('sub.upgradeUnlock')}
                </p>
              </div>
              {isActive && (
                <button className="btn btn-secondary btn-sm" onClick={handleManageSubscription}>
                  {t('sub.manageSubscription')}
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
                {t('sub.monthly')}
              </button>
              <button onClick={() => setSelectedPlan('yearly')}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: `2px solid ${selectedPlan === 'yearly' ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedPlan === 'yearly' ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: selectedPlan === 'yearly' ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                {t('sub.yearly')} <span style={{ fontSize: 11, color: 'var(--accent-green)', marginLeft: 4 }}>{t('sub.save33')}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 900, margin: '0 auto' }}>
              {/* Free Plan */}
              <div className="u-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t('sub.basic')}</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{t('sub.basicPrice')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{t('sub.basicDesc')}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ {t('sub.basic2Subjects')}</li>
                  <li>✓ {t('sub.basic20Queries')}</li>
                  <li>✓ {t('sub.basicSocial')}</li>
                  <li>✓ {t('sub.basicCourses')}</li>
                  <li>✓ {t('sub.basic100mb')}</li>
                  <li>✓ {t('sub.basicDiagnostic')}</li>
                  <li style={{ color: 'var(--text-muted)' }}>✗ {t('sub.noExportDocx')}</li>
                  <li style={{ color: 'var(--text-muted)' }}>✗ {t('sub.noExamPredictor')}</li>
                  <li style={{ color: 'var(--text-muted)' }}>✗ {t('sub.noPostJobs')}</li>
                </ul>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: 20 }} disabled>{t('sub.currentPlan')}</button>
              </div>

              {/* PRO Plan */}
              <div className="u-card" style={{ padding: 24, border: '2px solid var(--accent)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{t('sub.mostPopular')}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>{Star({ size: 14 })} {t('sub.pro')}</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${selectedPlan === 'monthly' ? '7.490' : '71.900'}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> CLP/{selectedPlan === 'monthly' ? t('sub.perMonth') : t('sub.perYear')}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ≈ USD ${selectedPlan === 'monthly' ? '8' : '77'}/{selectedPlan === 'monthly' ? t('sub.perMonth') : t('sub.perYear')}
                </div>
                {selectedPlan === 'yearly' && (
                  <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 20 }}>{t('sub.proMonthlySavings')}</div>
                )}
                {selectedPlan === 'monthly' && <div style={{ height: 20, marginBottom: 20 }} />}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{t('sub.proDesc')}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ {t('sub.pro8Subjects')}</li>
                  <li>✓ {t('sub.pro200Queries')}</li>
                  <li>✓ {t('sub.proNoAds')}</li>
                  <li>✓ {t('sub.proExportDocx')}</li>
                  <li>✓ {t('sub.proCommunities')}</li>
                  <li>✓ {t('sub.proExamPredictor')}</li>
                  <li>✓ {t('sub.proCvGenerator')}</li>
                  <li>✓ {t('sub.pro2gb')}</li>
                  <li>✓ {t('sub.pro20xp')}</li>
                </ul>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}
                  onClick={() => { setSelectedTier('pro'); handleSubscribe() }} disabled={loading}>
                  {loading ? t('sub.processing') : t('sub.startFreeTrial')}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  {t('sub.autoBilling')} {selectedPlan === 'monthly' ? t('sub.monthlyBilling') : t('sub.yearlyBilling')} · {t('sub.cancelAnytime')}
                </p>
              </div>

              {/* MAX Plan */}
              <div className="u-card" style={{ padding: 24, border: '2px solid var(--accent-purple)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--accent-purple)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{t('sub.premium')}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>{Crown({ size: 14 })} {t('sub.max')}</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${selectedPlan === 'monthly' ? '11.990' : '115.900'}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> CLP/{selectedPlan === 'monthly' ? t('sub.perMonth') : t('sub.perYear')}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ≈ USD ${selectedPlan === 'monthly' ? '13' : '125'}/{selectedPlan === 'monthly' ? t('sub.perMonth') : t('sub.perYear')}
                </div>
                {selectedPlan === 'yearly' && (
                  <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 20 }}>{t('sub.maxMonthlySavings')}</div>
                )}
                {selectedPlan === 'monthly' && <div style={{ height: 20, marginBottom: 20 }} />}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{t('sub.maxDesc')}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <li>✓ {t('sub.maxUnlimited')}</li>
                  <li>✓ {t('sub.maxPostJobs')}</li>
                  <li>✓ {t('sub.maxStudyRooms')}</li>
                  <li>✓ {t('sub.maxPortfolio')}</li>
                  <li>✓ {t('sub.max10gb')}</li>
                  <li>✓ {t('sub.max50xp')}</li>
                  <li>✓ {t('sub.maxPrioritySupport')}</li>
                  <li>✓ {t('sub.maxEarlyAccess')}</li>
                  <li>✓ {t('sub.maxExclusiveBadge')}</li>
                </ul>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, background: 'var(--accent-purple)' }}
                  onClick={() => { setSelectedTier('max'); handleSubscribe() }} disabled={loading}>
                  {loading ? t('sub.processing') : t('sub.activateMax')}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  {t('sub.autoBillingSecure')} {selectedPlan === 'monthly' ? t('sub.monthlyBilling') : t('sub.yearlyBilling')} · {t('sub.securePay')}
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ textAlign: 'center', margin: '24px auto 0', maxWidth: 700 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{t('sub.paymentMethods')}</p>
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('sub.securePayments')}</span>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ maxWidth: 700, margin: '32px auto 0' }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>{t('sub.faqTitle')}</h3>
              {[
                { q: t('sub.faq1q'), a: t('sub.faq1a') },
                { q: t('sub.faq2q'), a: t('sub.faq2a') },
                { q: t('sub.faq3q'), a: t('sub.faq3a') },
                { q: t('sub.faq4q'), a: t('sub.faq4a') },
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
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>{t('sub.yourProIncludes')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { icon: BookOpen({ size: 24 }), label: t('sub.unlimitedSubjects') },
                { icon: BookOpen({ size: 24 }), label: t('sub.unlimitedChat') },
                { icon: Brain({ size: 24 }), label: t('sub.unlimitedQuizzes') },
                { icon: ClipboardList({ size: 24 }), label: t('sub.flashcardsFsrs') },
                { icon: Rocket({ size: 24 }), label: t('sub.uploadToStudy') },
                { icon: Save({ size: 24 }), label: t('sub.storage5gb') },
                { icon: Compass({ size: 24 }), label: t('sub.socraticMode') },
                { icon: Download({ size: 24 }), label: t('sub.exportWord') },
                { icon: Zap({ size: 24 }), label: t('sub.prioritySupport') },
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
