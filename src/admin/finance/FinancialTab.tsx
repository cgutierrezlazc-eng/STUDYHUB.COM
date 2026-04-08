import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { useI18n } from '../../services/i18n'

export default function FinancialTab() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [financials, setFinancials] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'owner') return
    api.getAdminFinanceDashboard()
      .then(setFinancials)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n?.toLocaleString('es-CL') || '0'
  const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
      </div>
    )
  }

  return (
    <div>
      {/* Payment Providers Status */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="u-card" style={{
          padding: 16, flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 12,
          borderLeft: '4px solid #009ee3',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e6f7ff', fontSize: 18 }}>
            {'💙'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t('ceo.mercadoPago')}</div>
            <div style={{ fontSize: 11, color: '#009ee3' }}>{t('ceo.mercadoPagoStatus')}</div>
          </div>
        </div>
        <div className="u-card" style={{
          padding: 16, flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 12,
          borderLeft: '4px solid #003087',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f0fe', fontSize: 18 }}>
            {'🅿️'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t('ceo.paypal')}</div>
            <div style={{ fontSize: 11, color: '#003087' }}>{t('ceo.paypalStatus')}</div>
          </div>
        </div>
      </div>

      {financials && (<>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="stat-value">{fmtUsd(financials.grossRevenueUsd)}</div>
          <div className="stat-label">{t('ceo.totalRevenueUsd')}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="stat-value">${fmt(financials.gananciaNetaTotalClp)}</div>
          <div className="stat-label">{t('ceo.netProfitClp')}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="stat-value">{financials.activeSubscribers}</div>
          <div className="stat-label">{t('ceo.subscribers')} ({financials.proSubscribers} Pro + {financials.maxSubscribers} Max)</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
          <div className="stat-value">{fmtUsd(financials.arpu)}</div>
          <div className="stat-label">{t('ceo.arpu')}</div>
        </div>
      </div>

      <div className="u-card" style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>{t('ceo.financialBreakdown')}</h4>
        <table style={{ width: '100%', fontSize: 14 }}>
          <tbody>
            <tr><td>{t('ceo.grossTotal')}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(financials.grossRevenueClp)}</td></tr>
            <tr style={{ color: 'var(--accent-red)' }}><td>{t('ceo.platformCommission')}</td><td style={{ textAlign: 'right' }}>-${fmt(financials.grossRevenueClp - financials.netAfterStripeClp)}</td></tr>
            <tr><td>{t('ceo.netAfterCommissions')}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(financials.netAfterStripeClp)}</td></tr>
            <tr style={{ color: 'var(--accent-red)' }}><td>{t('ceo.iva19')}</td><td style={{ textAlign: 'right' }}>-${fmt(financials.totalIvaClp)}</td></tr>
            <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: 16 }}><td>{t('ceo.netProfitLabel')}</td><td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>${fmt(financials.gananciaNetaTotalClp)}</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('ceo.exchangeRate')} ${fmt(financials.exchangeRateUsdClp)} CLP</p>
      </div>

      {financials.recentPayments?.length > 0 && (
        <div className="u-card" style={{ padding: 20 }}>
          <h4 style={{ marginTop: 0 }}>{t('ceo.recentPayments')}</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>{t('ceo.user')}</th><th>{t('ceo.country')}</th><th>USD</th><th>CLP</th><th>IVA</th><th>{t('ceo.date')}</th>
              </tr></thead>
              <tbody>
                {financials.recentPayments.slice(0, 10).map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 8 }}>{p.user}</td>
                    <td>{p.country}</td>
                    <td>{fmtUsd(p.amountUsd)}</td>
                    <td>${fmt(p.netClp)}</td>
                    <td style={{ color: 'var(--accent-red)' }}>${fmt(p.iva)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.date?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
