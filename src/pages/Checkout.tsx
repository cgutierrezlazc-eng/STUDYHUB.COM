import React, { useState } from 'react'
import { useAuth } from '../services/auth'

interface Props {
  onNavigate: (path: string) => void
}

export default function Checkout({ onNavigate }: Props) {
  const { user } = useAuth()
  const [paymentTab, setPaymentTab] = useState<'card' | 'paypal'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiration, setExpiration] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardName, setCardName] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) {
      alert('Debes aceptar los términos de servicio para continuar.')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Procesador de pagos en configuración. Contacta soporte@conniku.com')
    }, 600)
  }

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiration = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    container: {
      display: 'flex',
      gap: '32px',
      maxWidth: '900px',
      width: '100%',
      flexWrap: 'wrap' as const,
    },
    backLink: {
      position: 'absolute' as const,
      top: '24px',
      left: '24px',
      color: '#6366f1',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
    },
    // LEFT: Order summary
    summaryCard: {
      flex: '1 1 320px',
      background: '#fff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      alignSelf: 'flex-start',
    },
    summaryTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      margin: '0 0 20px 0',
    },
    planRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      marginBottom: '24px',
    },
    planIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      flexShrink: 0,
    },
    planName: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#1e293b',
      margin: 0,
    },
    planSub: {
      fontSize: '14px',
      color: '#64748b',
      margin: '2px 0 0 0',
    },
    divider: {
      height: '1px',
      background: '#e2e8f0',
      margin: '20px 0',
    },
    lineItem: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      color: '#475569',
      marginBottom: '10px',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '18px',
      fontWeight: 700,
      color: '#1e293b',
    },
    trialBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: '#f0fdf4',
      color: '#16a34a',
      fontSize: '13px',
      fontWeight: 600,
      padding: '8px 14px',
      borderRadius: '8px',
      marginTop: '16px',
    },
    // RIGHT: Payment form
    paymentCard: {
      flex: '1 1 420px',
      background: '#fff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    },
    paymentTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#1e293b',
      margin: '0 0 24px 0',
    },
    tabs: {
      display: 'flex',
      gap: '0',
      marginBottom: '24px',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
    },
    tab: {
      flex: 1,
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      background: '#f8fafc',
      color: '#64748b',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    tabActive: {
      flex: 1,
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      background: '#6366f1',
      color: '#fff',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    fieldGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#475569',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      fontSize: '15px',
      border: '1.5px solid #e2e8f0',
      borderRadius: '10px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box' as const,
      color: '#1e293b',
      background: '#fafbfc',
    },
    row: {
      display: 'flex',
      gap: '12px',
    },
    termsRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginTop: '20px',
      marginBottom: '20px',
    },
    checkbox: {
      marginTop: '3px',
      width: '18px',
      height: '18px',
      accentColor: '#6366f1',
      cursor: 'pointer',
      flexShrink: 0,
    },
    termsText: {
      fontSize: '13px',
      color: '#64748b',
      lineHeight: '1.5',
    },
    termsLink: {
      color: '#6366f1',
      textDecoration: 'underline',
      cursor: 'pointer',
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      fontWeight: 700,
      color: '#fff',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'opacity 0.2s, transform 0.1s',
      opacity: isLoading ? 0.7 : 1,
    },
    paypalBtn: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      fontWeight: 700,
      color: '#003087',
      background: '#ffc439',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      marginBottom: '16px',
    },
    badges: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px',
      flexWrap: 'wrap' as const,
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: 500,
    },
    paypalContainer: {
      textAlign: 'center' as const,
      padding: '20px 0',
    },
    paypalInfo: {
      fontSize: '14px',
      color: '#64748b',
      marginTop: '12px',
    },
  }

  return (
    <div style={styles.page}>
      <button style={styles.backLink} onClick={() => onNavigate('/dashboard')}>
        ← Volver
      </button>

      <div style={styles.container}>
        {/* ORDER SUMMARY */}
        <div style={styles.summaryCard}>
          <p style={styles.summaryTitle}>Resumen del pedido</p>

          <div style={styles.planRow}>
            <div style={styles.planIcon}>⭐</div>
            <div>
              <p style={styles.planName}>Plan Estudiante PRO</p>
              <p style={styles.planSub}>Acceso completo a todas las funciones</p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.lineItem}>
            <span>Suscripcion mensual</span>
            <span>$5.00 USD</span>
          </div>
          <div style={styles.lineItem}>
            <span>Periodo de prueba</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>7 dias gratis</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.totalRow}>
            <span>Total hoy</span>
            <span>$0.00 USD</span>
          </div>

          <div style={styles.trialBadge}>
            <span>✓</span>
            7 dias gratis, luego $5 USD/mes
          </div>

          <div style={{ marginTop: '24px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 6px 0' }}>Incluye:</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Consultas ilimitadas sobre tu material</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Resúmenes y flashcards</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Proyectos colaborativos</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Soporte prioritario</p>
          </div>
        </div>

        {/* PAYMENT FORM */}
        <div style={styles.paymentCard}>
          <p style={styles.paymentTitle}>Metodo de pago</p>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={paymentTab === 'card' ? styles.tabActive : styles.tab}
              onClick={() => setPaymentTab('card')}
            >
              💳 Tarjeta
            </button>
            <button
              style={paymentTab === 'paypal' ? styles.tabActive : styles.tab}
              onClick={() => setPaymentTab('paypal')}
            >
              Ⓟ PayPal
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {paymentTab === 'card' && (
              <>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Numero de tarjeta</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>

                <div style={{ ...styles.row, marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Vencimiento</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="MM/AA"
                      value={expiration}
                      onChange={(e) => setExpiration(formatExpiration(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>CVC</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Nombre del titular</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Como aparece en la tarjeta"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
              </>
            )}

            {paymentTab === 'paypal' && (
              <div style={styles.paypalContainer}>
                <button
                  type="button"
                  style={styles.paypalBtn}
                  onClick={handleSubmit as any}
                >
                  Pagar con PayPal
                </button>
                <p style={styles.paypalInfo}>
                  Seras redirigido a PayPal para completar el pago de forma segura.
                </p>
              </div>
            )}

            {/* Terms */}
            <div style={styles.termsRow}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                id="terms-checkbox"
              />
              <label htmlFor="terms-checkbox" style={styles.termsText}>
                Acepto los{' '}
                <span style={styles.termsLink}>terminos de servicio</span>{' '}
                y la{' '}
                <span style={styles.termsLink}>politica de privacidad</span>
              </label>
            </div>

            {/* Submit */}
            {paymentTab === 'card' && (
              <button
                type="submit"
                style={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : 'Comenzar prueba gratis'}
              </button>
            )}

            {/* Security badges */}
            <div style={styles.badges}>
              <div style={styles.badge}>
                <span>🔒</span> Pago seguro
              </div>
              <div style={styles.badge}>
                <span>↩</span> Cancelar en cualquier momento
              </div>
              <div style={styles.badge}>
                <span>📧</span> Factura por email
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
