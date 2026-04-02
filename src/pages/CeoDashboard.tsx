import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

export default function CeoDashboard({ onNavigate }: Props) {
  const { user } = useAuth()
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [financials, setFinancials] = useState<any>(null)
  const [fraudReport, setFraudReport] = useState<any>(null)
  const [compliance, setComplianceStatus] = useState<any>(null)
  const [f129, setF129] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'financial' | 'f129' | 'fraud' | 'compliance'>('overview')

  useEffect(() => {
    if (user?.role !== 'owner') return
    Promise.all([
      api.getCeoWeeklyReport().then(setWeeklyReport).catch(() => {}),
      api.getAdminFinanceDashboard().then(setFinancials).catch(() => {}),
      api.getReferralFraudReport().then(setFraudReport).catch(() => {}),
      api.getComplianceStatus().then(setComplianceStatus).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const loadF129 = async (month?: number, year?: number) => {
    try { setF129(await api.generateF129(month, year)) } catch (e: any) { alert(e.message || 'Error') }
  }

  const submitF129 = async () => {
    if (!f129) return
    if (!confirm('¿Enviar el F129 al SII? Verifica los datos primero.')) return
    try {
      const result = await api.submitF129(f129)
      alert(result.message || 'F129 procesado')
    } catch (e: any) { alert(e.message || 'Error') }
  }

  if (user?.role !== 'owner') return <div className="page-body"><p>Acceso restringido al CEO/Owner.</p></div>

  const fmt = (n: number) => n?.toLocaleString('es-CL') || '0'
  const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

  return (
    <>
      <div className="page-header">
        <h2>🏢 Panel CEO — Conniku</h2>
        <p>Vista exclusiva del estado completo de la plataforma</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['overview', 'financial', 'f129', 'fraud', 'compliance'] as const).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); if (t === 'f129' && !f129) loadF129() }}>
              {t === 'overview' ? '📊 Resumen' : t === 'financial' ? '💰 Finanzas' : t === 'f129' ? '📋 F129 SII' : t === 'fraud' ? '🛡️ Anti-Fraude' : '✅ Compliance'}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-dots"><span /><span /><span /></div> : <>

          {/* OVERVIEW */}
          {tab === 'overview' && weeklyReport && (
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Reporte Semanal</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{weeklyReport.period}</p>

              <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                  <div className="stat-value">{fmtUsd(weeklyReport.revenue?.grossUsd)}</div>
                  <div className="stat-label">Ingresos Semana {weeklyReport.revenue?.trend}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                  <div className="stat-value">{weeklyReport.users?.newThisWeek}</div>
                  <div className="stat-label">Usuarios Nuevos ({weeklyReport.users?.growthPercent > 0 ? '+' : ''}{weeklyReport.users?.growthPercent}%)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                  <div className="stat-value">{weeklyReport.users?.activeThisWeek}</div>
                  <div className="stat-label">Activos ({weeklyReport.users?.activeRate}%)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
                  <div className="stat-value">{weeklyReport.engagement?.studyHours}h</div>
                  <div className="stat-label">Horas de Estudio</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>💰 Ganancia Neta</h4>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>${fmt(weeklyReport.revenue?.gananciaNetaClp)} CLP</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Después de Stripe + IVA 19%</p>
                </div>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>📊 Engagement</h4>
                  <div style={{ fontSize: 13 }}>
                    <div>Posts: {weeklyReport.engagement?.wallPosts} | Comunidad: {weeklyReport.engagement?.communityPosts}</div>
                    <div>Mensajes: {weeklyReport.engagement?.messages} | Quizzes: {weeklyReport.engagement?.quizzesTaken}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCIAL */}
          {tab === 'financial' && financials && (
            <div>
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                  <div className="stat-value">{fmtUsd(financials.grossRevenueUsd)}</div>
                  <div className="stat-label">Ingresos Totales USD</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                  <div className="stat-value">${fmt(financials.gananciaNetaTotalClp)}</div>
                  <div className="stat-label">Ganancia Neta CLP</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                  <div className="stat-value">{financials.activeSubscribers}</div>
                  <div className="stat-label">Suscriptores ({financials.proSubscribers} Pro + {financials.maxSubscribers} Max)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
                  <div className="stat-value">{fmtUsd(financials.arpu)}</div>
                  <div className="stat-label">ARPU (ingreso por usuario)</div>
                </div>
              </div>

              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h4 style={{ marginTop: 0 }}>Desglose Financiero (CLP)</h4>
                <table style={{ width: '100%', fontSize: 14 }}>
                  <tbody>
                    <tr><td>Bruto total</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(financials.grossRevenueClp)}</td></tr>
                    <tr style={{ color: 'var(--accent-red)' }}><td>− Comisión Stripe</td><td style={{ textAlign: 'right' }}>−${fmt(financials.grossRevenueClp - financials.netAfterStripeClp)}</td></tr>
                    <tr><td>Neto después Stripe</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(financials.netAfterStripeClp)}</td></tr>
                    <tr style={{ color: 'var(--accent-red)' }}><td>− IVA 19%</td><td style={{ textAlign: 'right' }}>−${fmt(financials.totalIvaClp)}</td></tr>
                    <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: 16 }}><td>GANANCIA NETA</td><td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>${fmt(financials.gananciaNetaTotalClp)}</td></tr>
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>TC: 1 USD = ${fmt(financials.exchangeRateUsdClp)} CLP</p>
              </div>

              {financials.recentPayments?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>Pagos Recientes</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: 8 }}>Usuario</th><th>País</th><th>USD</th><th>CLP</th><th>IVA</th><th>Fecha</th>
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
            </div>
          )}

          {/* F129 */}
          {tab === 'f129' && (
            <div>
              {!f129 ? (
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <h3>📋 Generar F129</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Genera el formulario F129 para declarar IVA ante el SII</p>
                  <button className="btn btn-primary" onClick={() => loadF129()}>Generar Período Actual</button>
                </div>
              ) : (
                <div>
                  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ margin: 0 }}>📋 F129 — {f129.periodoTexto}</h3>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: f129.estado === 'generado' ? 'var(--bg-tertiary)' : 'rgba(5,150,105,0.08)', color: f129.estado === 'generado' ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                        {f129.estado === 'generado' ? '⏳ Pendiente de envío' : '✅ Enviado'}
                      </span>
                    </div>
                    <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ padding: 8 }}>RUT Emisor</td><td style={{ textAlign: 'right' }}>{f129.rutEmisor}</td></tr>
                        <tr><td style={{ padding: 8 }}>Razón Social</td><td style={{ textAlign: 'right' }}>{f129.razonSocial}</td></tr>
                        <tr style={{ borderTop: '1px solid var(--border)' }}><td style={{ padding: 8 }}>Ventas Netas Afectas</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(f129.ventasNetasAfectas)} CLP</td></tr>
                        <tr><td style={{ padding: 8 }}>Tasa IVA</td><td style={{ textAlign: 'right' }}>{f129.tasaIva}</td></tr>
                        <tr style={{ borderTop: '2px solid var(--border)', fontSize: 16, fontWeight: 700 }}><td style={{ padding: 8 }}>IVA A PAGAR</td><td style={{ textAlign: 'right', color: 'var(--accent-red)' }}>${fmt(f129.ivaAPagar)} CLP</td></tr>
                      </tbody>
                    </table>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>{f129.nota}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plazo: {f129.plazoDeclaracion}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={submitF129}>📤 Enviar al SII</button>
                    <a href={f129.urlSii} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">🔗 Portal SII</a>
                    <button className="btn btn-secondary" onClick={() => loadF129()}>🔄 Regenerar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FRAUD */}
          {tab === 'fraud' && fraudReport && (
            <div>
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h4 style={{ marginTop: 0 }}>🛡️ Referidos — Detección de Fraude</h4>
                <p style={{ fontSize: 14 }}>Total referidos: <strong>{fraudReport.totalReferrals}</strong></p>
              </div>
              {fraudReport.suspiciousAccounts?.length > 0 ? (
                fraudReport.suspiciousAccounts.map((s: any) => (
                  <div key={s.userId} className="card" style={{ padding: 16, marginBottom: 8, borderLeft: `4px solid ${s.fraudProbability > 70 ? 'var(--accent-red)' : 'var(--accent-orange)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{s.name}</strong> <span style={{ color: 'var(--text-muted)' }}>@{s.username}</span>
                        <div style={{ fontSize: 13 }}>Referidos: {s.totalReferred} | Inactivos: {s.inactiveReferred}</div>
                      </div>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: s.fraudProbability > 70 ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)', color: s.fraudProbability > 70 ? 'var(--accent-red)' : 'var(--accent-orange)', fontWeight: 600 }}>
                        {s.fraudProbability}% riesgo — {s.recommendation}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: 40 }}><div style={{ fontSize: 48 }}>✅</div><h3>Sin actividad sospechosa</h3></div>
              )}
            </div>
          )}

          {/* COMPLIANCE */}
          {tab === 'compliance' && compliance && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>✅ Estado de Cumplimiento Legal</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {compliance.requirements?.map((req: string, i: number) => (
                  <div key={i} style={{ fontSize: 14, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>{req}</div>
                ))}
              </div>
              {compliance.pending?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ color: 'var(--accent-orange)' }}>⏳ Pendientes</h4>
                  {compliance.pending.map((p: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: 8, color: 'var(--accent-orange)' }}>• {p}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <h4>📋 Notas Legales</h4>
                {compliance.legalNotes?.map((n: string, i: number) => (
                  <div key={i} style={{ fontSize: 13, padding: 4, color: 'var(--text-muted)' }}>• {n}</div>
                ))}
              </div>
            </div>
          )}
        </>}
      </div>
    </>
  )
}
