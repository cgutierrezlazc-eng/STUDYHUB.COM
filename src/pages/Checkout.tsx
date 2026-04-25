/**
 * Checkout.tsx — Conniku
 *
 * PCI-DSS compliance: este componente NO recolecta datos de tarjeta.
 * Todo el procesamiento de pagos ocurre en plataformas certificadas:
 *   - MercadoPago Checkout Pro (CLP, Chile) — redirige al usuario a MP
 *   - PayPal (USD, internacional) — redirige al usuario a PayPal
 *
 * Flujo:
 *   1. Usuario selecciona método de pago
 *   2. Frontend llama al backend (POST /api/mercadopago/create-subscription
 *      o POST /api/paypal/create-subscription)
 *   3. Backend retorna init_point (MP) o approve_link (PayPal)
 *   4. Frontend redirige con window.location.href al procesador externo
 *   5. El procesador redirige de vuelta a /suscripcion?{status} al terminar
 */
import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { Star, Lock, Shield } from '../components/Icons';
import ckStyles from './Checkout.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

type PaymentMethod = 'mercadopago' | 'paypal';
type CheckoutState = 'idle' | 'loading' | 'error';

export default function Checkout({ onNavigate }: Props) {
  const { user } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>('mercadopago');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePay = async () => {
    if (!acceptTerms) {
      setErrorMsg('Debes aceptar los términos de servicio para continuar.');
      return;
    }
    if (!user) {
      onNavigate('/login');
      return;
    }

    setState('loading');
    setErrorMsg('');

    try {
      const endpoint =
        method === 'mercadopago'
          ? '/api/mercadopago/create-subscription'
          : '/api/paypal/create-subscription';

      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: 'pro_monthly' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Error ${res.status}`);
      }

      const data = await res.json();

      // MercadoPago devuelve init_point o url
      // PayPal devuelve approve_link o url
      const redirectUrl: string =
        data.initPoint ?? data.init_point ?? data.approve_link ?? data.url ?? '';

      if (!redirectUrl) {
        throw new Error('El procesador de pagos no retornó una URL válida.');
      }

      // Redirigir al procesador externo — NUNCA manejamos datos de tarjeta aquí
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      setState('error');
      const msg = err instanceof Error ? err.message : 'Error inesperado.';
      setErrorMsg(msg);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'var(--bg-primary)',
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
      color: 'var(--accent)',
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
    summaryCard: {
      flex: '1 1 320px',
      background: 'var(--bg-card)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      alignSelf: 'flex-start',
    },
    summaryTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--text-muted)',
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
      color: 'var(--text-primary)',
      margin: 0,
    },
    planSub: {
      fontSize: '14px',
      color: 'var(--text-muted)',
      margin: '2px 0 0 0',
    },
    divider: {
      height: '1px',
      background: 'var(--border)',
      margin: '20px 0',
    },
    lineItem: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      color: 'var(--text-secondary)',
      marginBottom: '10px',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '18px',
      fontWeight: 700,
      color: 'var(--text-primary)',
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
    paymentCard: {
      flex: '1 1 420px',
      background: 'var(--bg-card)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    },
    paymentTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      margin: '0 0 8px 0',
    },
    paymentSubtitle: {
      fontSize: '13px',
      color: 'var(--text-muted)',
      margin: '0 0 24px 0',
    },
    methodGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '28px',
    },
    methodCard: {
      borderRadius: '12px',
      padding: '16px 12px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    },
    methodLabel: {
      fontSize: '13px',
      fontWeight: 700,
    },
    methodSub: {
      fontSize: '11px',
      color: 'var(--text-muted)',
      textAlign: 'center' as const,
    },
    redirectNotice: {
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '10px',
      padding: '14px 16px',
      fontSize: '13px',
      color: '#0369a1',
      marginBottom: '20px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      lineHeight: '1.5',
    },
    termsRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
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
      color: 'var(--text-muted)',
      lineHeight: '1.5',
    },
    termsLink: {
      color: 'var(--accent)',
      textDecoration: 'underline',
      cursor: 'pointer',
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      fontWeight: 700,
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '12px 14px',
      fontSize: '13px',
      color: '#dc2626',
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
      color: 'var(--text-muted)',
      fontWeight: 500,
    },
    pciNote: {
      textAlign: 'center' as const,
      fontSize: '11px',
      color: 'var(--text-muted)',
      marginTop: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
    },
  };

  const isDisabled = state === 'loading' || !acceptTerms;

  return (
    <div style={styles.page}>
      <div className={ckStyles.topProgress}>
        <div className={ckStyles.tpLeft}>
          <span className={ckStyles.pulse} aria-hidden="true" />
          <span>Checkout seguro</span>
        </div>
        <span>Pago intermediado · SSL</span>
      </div>

      <button style={styles.backLink} onClick={() => onNavigate('/dashboard')}>
        ← Volver
      </button>

      <div style={styles.container}>
        {/* ORDER SUMMARY */}
        <div style={styles.summaryCard}>
          <p style={styles.summaryTitle}>Resumen del pedido</p>

          <div style={styles.planRow}>
            <div style={styles.planIcon}>{Star({ size: 22, color: '#fff' })}</div>
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
            <span>✓</span>7 dias gratis, luego $5 USD/mes
          </div>

          <div
            style={{
              marginTop: '24px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              lineHeight: '1.6',
            }}
          >
            <p style={{ margin: '0 0 6px 0' }}>Incluye:</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Consultas ilimitadas sobre tu material</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Resumenes y flashcards</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Proyectos colaborativos</p>
            <p style={{ margin: '0 0 4px 0' }}>✦ Soporte prioritario</p>
          </div>
        </div>

        {/* PAYMENT FORM */}
        <div style={styles.paymentCard}>
          <p style={styles.paymentTitle}>Metodo de pago</p>
          <p style={styles.paymentSubtitle}>
            Seras redirigido a la plataforma de pago para completar tu suscripcion de forma segura.
          </p>

          {/* Method selector */}
          <div style={styles.methodGrid}>
            <button
              id="checkout-method-mercadopago"
              style={{
                ...styles.methodCard,
                border: method === 'mercadopago' ? '2px solid #6366f1' : '2px solid var(--border)',
                background: method === 'mercadopago' ? '#f5f3ff' : 'var(--bg-primary)',
              }}
              onClick={() => setMethod('mercadopago')}
              type="button"
            >
              <span style={{ fontSize: '28px' }}>💳</span>
              <span
                style={{
                  ...styles.methodLabel,
                  color: method === 'mercadopago' ? '#6366f1' : 'var(--text-secondary)',
                }}
              >
                MercadoPago
              </span>
              <span style={styles.methodSub}>Tarjeta, débito, efectivo · Chile</span>
            </button>

            <button
              id="checkout-method-paypal"
              style={{
                ...styles.methodCard,
                border: method === 'paypal' ? '2px solid #6366f1' : '2px solid var(--border)',
                background: method === 'paypal' ? '#f5f3ff' : 'var(--bg-primary)',
              }}
              onClick={() => setMethod('paypal')}
              type="button"
            >
              <span style={{ fontSize: '28px' }}>🅿️</span>
              <span
                style={{
                  ...styles.methodLabel,
                  color: method === 'paypal' ? '#6366f1' : 'var(--text-secondary)',
                }}
              >
                PayPal
              </span>
              <span style={styles.methodSub}>Tarjeta o saldo PayPal · Internacional</span>
            </button>
          </div>

          {/* Redirect notice */}
          <div style={styles.redirectNotice}>
            <span style={{ flexShrink: 0, fontSize: '16px' }}>🔒</span>
            <span>
              Al confirmar, seras redirigido a{' '}
              <strong>{method === 'mercadopago' ? 'MercadoPago' : 'PayPal'}</strong> para ingresar
              tus datos de pago. Conniku no almacena ni procesa datos de tarjeta.
            </span>
          </div>

          {/* Error */}
          {state === 'error' && errorMsg && <div style={styles.errorBox}>⚠ {errorMsg}</div>}

          {/* Terms */}
          <div style={styles.termsRow}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                setErrorMsg('');
              }}
              id="checkout-terms-checkbox"
            />
            <label htmlFor="checkout-terms-checkbox" style={styles.termsText}>
              Acepto los{' '}
              <span style={styles.termsLink} onClick={() => onNavigate('/terms')}>
                terminos de servicio
              </span>{' '}
              y la{' '}
              <span style={styles.termsLink} onClick={() => onNavigate('/privacy')}>
                politica de privacidad
              </span>
            </label>
          </div>

          {/* CTA */}
          <button
            id="checkout-pay-btn"
            style={{
              ...styles.submitBtn,
              background: isDisabled
                ? 'var(--border)'
                : method === 'mercadopago'
                  ? 'linear-gradient(135deg, #009ee3, #00b1ea)'
                  : 'linear-gradient(135deg, #003087, #0050b3)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            onClick={handlePay}
            disabled={isDisabled}
            type="button"
          >
            {state === 'loading' ? (
              <>⏳ Iniciando pago seguro...</>
            ) : (
              <>
                {Lock({ size: 16, color: '#fff' })}
                {method === 'mercadopago' ? 'Continuar con MercadoPago' : 'Continuar con PayPal'}
              </>
            )}
          </button>

          {/* Security badges */}
          <div style={styles.badges}>
            <div style={styles.badge}>{Shield({ size: 14 })} Pago 100% seguro</div>
            <div style={styles.badge}>
              <span>↩</span> Cancelar en cualquier momento
            </div>
            <div style={styles.badge}>
              <span>@</span> Factura por email
            </div>
          </div>

          <div style={styles.pciNote}>
            🔐 Cumplimiento PCI-DSS · Conniku no almacena datos de tarjeta
          </div>
        </div>
      </div>
    </div>
  );
}
