import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { BarChart3, GraduationCap, Gem, ClipboardList, Shield, CheckCircle, AlertTriangle, Link, RefreshCw, Users, Medal, BookOpen, Search as SearchIcon, Hourglass, Briefcase, Inbox, Send, Megaphone, Pencil, Trash2 } from '../components/Icons'

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
  const [tab, setTab] = useState<'overview' | 'financial' | 'f129' | 'fraud' | 'compliance' | 'certifications' | 'email'>('overview')
  const [progressData, setProgressData] = useState<any>(null)
  const [certSearch, setCertSearch] = useState('')
  const [certLoading, setCertLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string[]>>({}) // userId -> courseIds[]
  const [certScoreOverride, setCertScoreOverride] = useState(100)
  const [certifying, setCertifying] = useState(false)
  const [certMessage, setCertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  // Email state
  const [emailInbox, setEmailInbox] = useState<any[]>([])
  const [emailStats, setEmailStats] = useState<any>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailPage, setEmailPage] = useState(1)
  const [emailTotal, setEmailTotal] = useState(0)
  const [emailFilter, setEmailFilter] = useState('')
  const [emailView, setEmailView] = useState<'inbox' | 'compose' | 'broadcast' | 'detail'>('inbox')
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeCta, setComposeCta] = useState('')
  const [composeCtaUrl, setComposeCtaUrl] = useState('')
  const [composeSending, setComposeSending] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastFilter, setBroadcastFilter] = useState('all')
  const [broadcastCta, setBroadcastCta] = useState('')
  const [broadcastCtaUrl, setBroadcastCtaUrl] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [deletingEmail, setDeletingEmail] = useState(false)

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

  const loadProgressOverview = async () => {
    setCertLoading(true)
    try {
      const data = await api.adminGetProgressOverview()
      setProgressData(data)
    } catch (e: any) { console.error('Failed to load progress overview:', e) }
    setCertLoading(false)
  }

  const loadEmailData = async (page = 1, filter = '') => {
    setEmailLoading(true)
    try {
      const [inbox, stats] = await Promise.all([
        api.getCeoEmailInbox(page, filter),
        api.getCeoEmailStats(),
      ])
      setEmailInbox(inbox.emails || [])
      setEmailTotal(inbox.total || 0)
      setEmailPage(page)
      setEmailStats(stats)
    } catch (e: any) { console.error('Email load error:', e) }
    setEmailLoading(false)
  }

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return
    setComposeSending(true)
    try {
      await api.ceoSendEmail(composeTo, composeSubject, composeBody, composeCta, composeCtaUrl)
      setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeCta(''); setComposeCtaUrl('')
      setEmailView('inbox')
      loadEmailData(1, emailFilter)
    } catch (e: any) { alert(e.message || 'Error al enviar') }
    setComposeSending(false)
  }

  const handleBroadcast = async () => {
    if (!broadcastSubject || !broadcastBody) return
    if (!confirm(`¿Enviar email masivo a usuarios (${broadcastFilter})? Esta accion no se puede deshacer.`)) return
    setBroadcastSending(true)
    try {
      const result = await api.ceoBroadcastEmail(broadcastSubject, broadcastBody, broadcastFilter, broadcastCta, broadcastCtaUrl)
      alert(`Email enviado a ${result.recipients} usuarios.`)
      setBroadcastSubject(''); setBroadcastBody(''); setBroadcastCta(''); setBroadcastCtaUrl('')
      setEmailView('inbox')
      loadEmailData(1, emailFilter)
    } catch (e: any) { alert(e.message || 'Error al enviar') }
    setBroadcastSending(false)
  }

  const viewEmailDetail = async (emailId: string) => {
    try {
      const detail = await api.getCeoEmailDetail(emailId)
      setSelectedEmail(detail)
      setEmailView('detail')
    } catch (e: any) { console.error('Error:', e) }
  }

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm('¿Eliminar este email del historial?')) return
    setDeletingEmail(true)
    try {
      await api.ceoDeleteEmail(emailId)
      setEmailInbox(prev => prev.filter(e => e.id !== emailId))
      setEmailTotal(prev => prev - 1)
      if (emailView === 'detail') setEmailView('inbox')
    } catch (e: any) { alert(e.message || 'Error al eliminar') }
    setDeletingEmail(false)
  }

  const handleDeleteSelectedEmails = async () => {
    if (selectedEmails.size === 0) return
    if (!confirm(`¿Eliminar ${selectedEmails.size} email(s) del historial?`)) return
    setDeletingEmail(true)
    try {
      await api.ceoDeleteEmailsBulk([...selectedEmails])
      setEmailInbox(prev => prev.filter(e => !selectedEmails.has(e.id)))
      setEmailTotal(prev => prev - selectedEmails.size)
      setSelectedEmails(new Set())
    } catch (e: any) { alert(e.message || 'Error al eliminar') }
    setDeletingEmail(false)
  }

  const toggleEmailSelection = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEmails(prev => {
      const next = new Set(prev)
      if (next.has(emailId)) next.delete(emailId)
      else next.add(emailId)
      return next
    })
  }

  const toggleSelectAllEmails = () => {
    if (selectedEmails.size === emailInbox.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(emailInbox.map(e => e.id)))
    }
  }

  const toggleCourseSelection = (userId: string, courseId: string) => {
    setSelectedUsers(prev => {
      const current = prev[userId] || []
      const updated = current.includes(courseId)
        ? current.filter(id => id !== courseId)
        : [...current, courseId]
      return { ...prev, [userId]: updated }
    })
  }

  const selectAllCoursesForUser = (userId: string, courseIds: string[]) => {
    setSelectedUsers(prev => {
      const current = prev[userId] || []
      const allSelected = courseIds.every(id => current.includes(id))
      return { ...prev, [userId]: allSelected ? [] : courseIds }
    })
  }

  const handleCertify = async (userId: string) => {
    const courseIds = selectedUsers[userId] || []
    if (courseIds.length === 0) return
    setCertifying(true)
    setCertMessage(null)
    try {
      const result = await api.adminCertifyUser(userId, courseIds, certScoreOverride)
      setCertMessage({ type: 'success', text: result.message || 'Certificado(s) emitido(s)' })
      setSelectedUsers(prev => ({ ...prev, [userId]: [] }))
      // Reload data
      await loadProgressOverview()
    } catch (e: any) {
      setCertMessage({ type: 'error', text: e.message || 'Error al certificar' })
    }
    setCertifying(false)
  }

  const handleRevokeCert = async (userId: string, courseId: string, courseTitle: string) => {
    if (!confirm(`¿Revocar certificado de "${courseTitle}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.adminRevokeCertificate(userId, courseId)
      setCertMessage({ type: 'success', text: 'Certificado revocado' })
      await loadProgressOverview()
    } catch (e: any) {
      setCertMessage({ type: 'error', text: e.message || 'Error al revocar' })
    }
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
        <h2>{Briefcase({ size: 22 })} Panel CEO — Conniku</h2>
        <p>Vista exclusiva del estado completo de la plataforma</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['overview', 'email', 'certifications', 'financial', 'f129', 'fraud', 'compliance'] as const).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); if (t === 'f129' && !f129) loadF129(); if (t === 'certifications' && !progressData) loadProgressOverview(); if (t === 'email' && emailInbox.length === 0) loadEmailData() }}>
              {t === 'overview' ? <>{BarChart3({ size: 14 })} Resumen</> : t === 'email' ? <>{Inbox({ size: 14 })} Email</> : t === 'certifications' ? <>{GraduationCap({ size: 14 })} Certificaciones</> : t === 'financial' ? <>{Gem({ size: 14 })} Finanzas</> : t === 'f129' ? <>{ClipboardList({ size: 14 })} F129 SII</> : t === 'fraud' ? <>{Shield({ size: 14 })} Anti-Fraude</> : <>{CheckCircle({ size: 14 })} Compliance</>}
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
                  <h4 style={{ marginTop: 0 }}>{Gem({ size: 16 })} Ganancia Neta</h4>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>${fmt(weeklyReport.revenue?.gananciaNetaClp)} CLP</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Después de Stripe + IVA 19%</p>
                </div>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>{BarChart3({ size: 16 })} Engagement</h4>
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
                  <h3>{ClipboardList({ size: 18 })} Generar F129</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Genera el formulario F129 para declarar IVA ante el SII</p>
                  <button className="btn btn-primary" onClick={() => loadF129()}>Generar Período Actual</button>
                </div>
              ) : (
                <div>
                  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ margin: 0 }}>{ClipboardList({ size: 18 })} F129 — {f129.periodoTexto}</h3>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: f129.estado === 'generado' ? 'var(--bg-tertiary)' : 'rgba(5,150,105,0.08)', color: f129.estado === 'generado' ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                        {f129.estado === 'generado' ? <>{Hourglass({ size: 12 })} Pendiente de envío</> : <>{CheckCircle({ size: 12 })} Enviado</>}
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
                    <button className="btn btn-primary" onClick={submitF129}>Enviar al SII</button>
                    <a href={f129.urlSii} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">{Link({ size: 14 })} Portal SII</a>
                    <button className="btn btn-secondary" onClick={() => loadF129()}>{RefreshCw({ size: 14 })} Regenerar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FRAUD */}
          {tab === 'fraud' && fraudReport && (
            <div>
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h4 style={{ marginTop: 0 }}>{Shield({ size: 16 })} Referidos — Detección de Fraude</h4>
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
                <div className="empty-state" style={{ padding: 40 }}><div style={{ fontSize: 48 }}>{CheckCircle({ size: 48 })}</div><h3>Sin actividad sospechosa</h3></div>
              )}
            </div>
          )}

          {/* COMPLIANCE */}
          {tab === 'compliance' && compliance && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>{CheckCircle({ size: 18 })} Estado de Cumplimiento Legal</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {compliance.requirements?.map((req: string, i: number) => (
                  <div key={i} style={{ fontSize: 14, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>{req}</div>
                ))}
              </div>
              {compliance.pending?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ color: 'var(--accent-orange)' }}>{Hourglass({ size: 16 })} Pendientes</h4>
                  {compliance.pending.map((p: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: 8, color: 'var(--accent-orange)' }}>• {p}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <h4>{ClipboardList({ size: 16 })} Notas Legales</h4>
                {compliance.legalNotes?.map((n: string, i: number) => (
                  <div key={i} style={{ fontSize: 13, padding: 4, color: 'var(--text-muted)' }}>• {n}</div>
                ))}
              </div>
            </div>
          )}
          {/* CERTIFICATIONS */}
          {tab === 'certifications' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 17, margin: '0 0 4px' }}>{GraduationCap({ size: 18 })} Gestión de Certificaciones</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    Certifica manualmente a usuarios, revoca certificados o revisa el progreso de cada estudiante.
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={loadProgressOverview} disabled={certLoading}>
                  {RefreshCw({ size: 14 })} Actualizar
                </button>
              </div>

              {/* Message */}
              {certMessage && (
                <div style={{
                  padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
                  background: certMessage.type === 'success' ? 'rgba(5,150,105,0.06)' : 'rgba(239,68,68,0.06)',
                  color: certMessage.type === 'success' ? '#059669' : '#DC2626',
                  border: `1px solid ${certMessage.type === 'success' ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  {certMessage.type === 'success' ? CheckCircle({ size: 14 }) : AlertTriangle({ size: 14 })} {certMessage.text}
                  <button onClick={() => setCertMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
                </div>
              )}

              {certLoading ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : progressData ? (
                <>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Estudiantes activos', value: progressData.summary.totalUsersWithProgress, icon: Users({ size: 24 }), color: '#2D62C8' },
                      { label: 'Certificados emitidos', value: progressData.summary.totalCertificatesIssued, icon: Medal({ size: 24 }), color: '#059669' },
                      { label: 'Cursos en progreso', value: progressData.summary.totalInProgress, icon: BookOpen({ size: 24 }), color: '#C4882A' },
                      { label: 'Total de cursos', value: progressData.summary.totalCourses, icon: BookOpen({ size: 24 }), color: '#5B5FC7' },
                    ].map((card, i) => (
                      <div key={i} className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{card.icon}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Score override */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                    padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 8, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Puntuación al certificar:</span>
                    {[80, 90, 100].map(s => (
                      <button key={s} onClick={() => setCertScoreOverride(s)}
                        style={{
                          padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          border: certScoreOverride === s ? '2px solid #2D62C8' : '1px solid var(--border)',
                          background: certScoreOverride === s ? 'rgba(26,58,122,0.08)' : '#fff',
                          color: certScoreOverride === s ? '#2D62C8' : 'var(--text-secondary)',
                        }}>
                        {s}%
                      </button>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Se asignará como puntuación del examen
                    </span>
                  </div>

                  {/* Search */}
                  <input type="text" placeholder="Buscar por nombre o correo..." value={certSearch}
                    onChange={e => setCertSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                      fontSize: 14, marginBottom: 16, background: '#fff', color: 'var(--text-primary)',
                    }} />

                  {/* Users list */}
                  {(progressData.users as any[])
                    .filter((u: any) => {
                      if (!certSearch) return true
                      const q = certSearch.toLowerCase()
                      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                    })
                    .map((userData: any) => {
                      const userSelected = selectedUsers[userData.userId] || []
                      const incompleteCourses = progressData.courses.filter((c: any) =>
                        !userData.courses.some((uc: any) => uc.courseId === c.id && uc.completed)
                      )
                      const completedCourses = userData.courses.filter((c: any) => c.completed)

                      return (
                        <div key={userData.userId} className="card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
                          {/* User header */}
                          <div style={{
                            padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%', background: '#2D62C8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                              }}>
                                {userData.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{userData.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{userData.email}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                                {Medal({ size: 14 })} {userData.completedCount} completados
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {BookOpen({ size: 14 })} {userData.totalStarted} iniciados
                              </span>
                              {userSelected.length > 0 && (
                                <button onClick={() => handleCertify(userData.userId)} disabled={certifying}
                                  style={{
                                    padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                    background: '#059669', color: '#fff', fontSize: 12, fontWeight: 600,
                                  }}>
                                  {certifying ? '...' : <>{GraduationCap({ size: 14 })} Certificar {userSelected.length} curso(s)</>}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Courses grid */}
                          <div style={{ padding: '12px 18px' }}>
                            {/* Completed courses */}
                            {completedCourses.length > 0 && (
                              <div style={{ marginBottom: completedCourses.length > 0 && incompleteCourses.length > 0 ? 12 : 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#059669', marginBottom: 6 }}>
                                  {CheckCircle({ size: 12 })} Certificados obtenidos
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {completedCourses.map((c: any) => (
                                    <div key={c.courseId} style={{
                                      display: 'flex', alignItems: 'center', gap: 6,
                                      padding: '5px 10px', borderRadius: 6, fontSize: 12,
                                      background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)',
                                      color: '#059669',
                                    }}>
                                      <span>{c.courseEmoji}</span>
                                      <span style={{ fontWeight: 500 }}>{c.courseTitle}</span>
                                      <span style={{ color: 'var(--text-muted)' }}>({c.quizScore}%)</span>
                                      <button onClick={() => handleRevokeCert(userData.userId, c.courseId, c.courseTitle)}
                                        title="Revocar certificado"
                                        style={{
                                          background: 'none', border: 'none', cursor: 'pointer',
                                          color: '#DC2626', fontSize: 12, padding: '0 2px', marginLeft: 2,
                                        }}>
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* In-progress + available to certify */}
                            {incompleteCourses.length > 0 && (
                              <div>
                                <div style={{
                                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                  color: 'var(--text-muted)', marginBottom: 6,
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                  <span>{ClipboardList({ size: 12 })} Cursos disponibles para certificar</span>
                                  <button onClick={() => selectAllCoursesForUser(userData.userId, incompleteCourses.map((c: any) => c.id))}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer',
                                      fontSize: 10, color: '#2D62C8', fontWeight: 700, textTransform: 'uppercase',
                                    }}>
                                    {incompleteCourses.every((c: any) => userSelected.includes(c.id)) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {incompleteCourses.map((c: any) => {
                                    const inProgress = userData.courses.find((uc: any) => uc.courseId === c.id)
                                    const isSelected = userSelected.includes(c.id)
                                    return (
                                      <button key={c.id} onClick={() => toggleCourseSelection(userData.userId, c.id)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 6,
                                          padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                                          background: isSelected ? 'rgba(26,58,122,0.08)' : '#fff',
                                          border: `1.5px solid ${isSelected ? '#2D62C8' : 'var(--border)'}`,
                                          color: isSelected ? '#2D62C8' : 'var(--text-secondary)',
                                          transition: 'all 0.15s',
                                        }}>
                                        <span style={{
                                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          background: isSelected ? '#2D62C8' : 'transparent',
                                          border: isSelected ? 'none' : '2px solid var(--border)',
                                          color: '#fff', fontSize: 10,
                                        }}>
                                          {isSelected && '✓'}
                                        </span>
                                        <span>{c.emoji}</span>
                                        <span style={{ fontWeight: 500 }}>{c.title}</span>
                                        {inProgress && (
                                          <span style={{
                                            fontSize: 10, padding: '1px 6px', borderRadius: 4,
                                            background: 'rgba(196,136,42,0.1)', color: '#C4882A', fontWeight: 600,
                                          }}>
                                            {inProgress.lessonProgress}%
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {completedCourses.length === progressData.courses.length && (
                              <div style={{ textAlign: 'center', padding: 12, color: '#059669', fontSize: 13, fontWeight: 600 }}>
                                {CheckCircle({ size: 16 })} Todos los cursos completados
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                  {progressData.users.length === 0 && (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <div style={{ fontSize: 48 }}>{ClipboardList({ size: 48 })}</div>
                      <h3>Sin actividad aún</h3>
                      <p style={{ color: 'var(--text-muted)' }}>Ningún usuario ha empezado cursos todavía.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div style={{ fontSize: 48 }}>{GraduationCap({ size: 48 })}</div>
                  <h3>Carga los datos de progreso</h3>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={loadProgressOverview}>
                    Cargar datos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* EMAIL TAB */}
          {tab === 'email' && (
            <div>
              {/* Email Stats */}
              {emailStats && (
                <div className="stats-grid" style={{ marginBottom: 20 }}>
                  <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                    <div className="stat-value">{emailStats.total}</div>
                    <div className="stat-label">Emails Totales</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                    <div className="stat-value">{emailStats.sent}</div>
                    <div className="stat-label">Enviados</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div className="stat-value">{emailStats.failed}</div>
                    <div className="stat-label">Fallidos</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                    <div className="stat-value">{emailStats.thisWeek}</div>
                    <div className="stat-label">Esta Semana</div>
                  </div>
                </div>
              )}

              {/* Sub-navigation */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className={`tab ${emailView === 'inbox' ? 'active' : ''}`} onClick={() => setEmailView('inbox')}>
                  {Inbox({ size: 14 })} Historial
                </button>
                <button className={`tab ${emailView === 'compose' ? 'active' : ''}`} onClick={() => setEmailView('compose')}>
                  {Pencil({ size: 14 })} Redactar
                </button>
                <button className={`tab ${emailView === 'broadcast' ? 'active' : ''}`} onClick={() => setEmailView('broadcast')}>
                  {Megaphone({ size: 14 })} Masivo
                </button>
              </div>

              {/* EMAIL INBOX/HISTORY */}
              {emailView === 'inbox' && (
                <div>
                  {/* Type filter */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {['', 'welcome', 'contact', 'manual', 'broadcast', 'friend_request', 'message', 'certificate', 'subscription', 'payment'].map(f => (
                      <button key={f} onClick={() => { setEmailFilter(f); loadEmailData(1, f) }}
                        style={{
                          padding: '4px 10px', fontSize: 11, borderRadius: 12, cursor: 'pointer',
                          background: emailFilter === f ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                          color: emailFilter === f ? '#fff' : 'var(--text-muted)',
                          border: '1px solid ' + (emailFilter === f ? 'var(--accent-blue)' : 'var(--border-subtle)'),
                        }}>
                        {f || 'Todos'}
                      </button>
                    ))}
                  </div>

                  {emailLoading ? (
                    <div className="loading-dots"><span /><span /><span /></div>
                  ) : emailInbox.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      <p>No hay emails registrados todavia.</p>
                    </div>
                  ) : (
                    <>
                      {/* Bulk actions bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                          <input type="checkbox" checked={selectedEmails.size === emailInbox.length && emailInbox.length > 0} onChange={toggleSelectAllEmails}
                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent-blue)' }} />
                          Seleccionar todos
                        </label>
                        {selectedEmails.size > 0 && (
                          <button onClick={handleDeleteSelectedEmails} disabled={deletingEmail}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer',
                            }}>
                            {Trash2({ size: 13 })} Eliminar ({selectedEmails.size})
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {emailInbox.map((e: any) => (
                          <div key={e.id} className="card"
                            style={{
                              padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                              transition: 'background 0.1s',
                              background: selectedEmails.has(e.id) ? 'var(--bg-hover)' : '',
                            }}
                            onMouseEnter={ev => { if (!selectedEmails.has(e.id)) ev.currentTarget.style.background = 'var(--bg-hover)' }}
                            onMouseLeave={ev => { if (!selectedEmails.has(e.id)) ev.currentTarget.style.background = '' }}
                          >
                            <input type="checkbox" checked={selectedEmails.has(e.id)} onClick={(ev) => toggleEmailSelection(e.id, ev)} readOnly
                              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent-blue)', flexShrink: 0 }} />
                            <div onClick={() => viewEmailDetail(e.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: e.status === 'sent' ? '#22c55e' : '#ef4444',
                              }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {e.subject}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                  Para: {e.to} · {e.sentAt ? new Date(e.sentAt).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </div>
                              <span style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                                background: 'var(--bg-secondary)', color: 'var(--text-muted)', flexShrink: 0,
                              }}>
                                {e.type}
                              </span>
                            </div>
                            <button onClick={(ev) => { ev.stopPropagation(); handleDeleteEmail(e.id) }}
                              title="Eliminar"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--text-muted)',
                                opacity: 0.4, transition: 'opacity 0.15s, color 0.15s', flexShrink: 0,
                              }}
                              onMouseEnter={ev => { ev.currentTarget.style.opacity = '1'; ev.currentTarget.style.color = '#dc2626' }}
                              onMouseLeave={ev => { ev.currentTarget.style.opacity = '0.4'; ev.currentTarget.style.color = 'var(--text-muted)' }}
                            >
                              {Trash2({ size: 14 })}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {emailTotal > 50 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                          <button className="btn btn-secondary btn-sm" disabled={emailPage <= 1} onClick={() => loadEmailData(emailPage - 1, emailFilter)}>Anterior</button>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Pagina {emailPage} de {Math.ceil(emailTotal / 50)}</span>
                          <button className="btn btn-secondary btn-sm" disabled={emailPage >= Math.ceil(emailTotal / 50)} onClick={() => loadEmailData(emailPage + 1, emailFilter)}>Siguiente</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* EMAIL DETAIL */}
              {emailView === 'detail' && selectedEmail && (
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEmailView('inbox')}>
                      ← Volver al historial
                    </button>
                    <button className="btn btn-sm" onClick={() => handleDeleteEmail(selectedEmail.id)} disabled={deletingEmail}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {Trash2({ size: 13 })} {deletingEmail ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{selectedEmail.subject}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span><strong>De:</strong> {selectedEmail.from}</span>
                        <span><strong>Para:</strong> {selectedEmail.to}</span>
                        <span><strong>Tipo:</strong> {selectedEmail.type}</span>
                        <span><strong>Estado:</strong> <span style={{ color: selectedEmail.status === 'sent' ? '#22c55e' : '#ef4444' }}>{selectedEmail.status}</span></span>
                        <span><strong>Fecha:</strong> {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString('es') : ''}</span>
                      </div>
                      {selectedEmail.error && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, fontSize: 12, color: '#dc2626' }}>
                          {AlertTriangle({ size: 14 })} {selectedEmail.error}
                        </div>
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml || '<p>Sin contenido</p>' }}
                        style={{ fontSize: 14, lineHeight: 1.6, maxHeight: 500, overflow: 'auto' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* COMPOSE EMAIL */}
              {emailView === 'compose' && (
                <div className="card" style={{ padding: 24, maxWidth: 640 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{Send({ size: 18 })} Redactar Email</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input className="form-input" placeholder="Destinatario (email)" value={composeTo} onChange={e => setComposeTo(e.target.value)} />
                    <input className="form-input" placeholder="Asunto" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
                    <textarea className="form-input" rows={8} placeholder="Cuerpo del mensaje (texto plano, se aplicara la plantilla de Conniku)" value={composeBody} onChange={e => setComposeBody(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" style={{ flex: 1 }} placeholder="Texto del boton CTA (opcional)" value={composeCta} onChange={e => setComposeCta(e.target.value)} />
                      <input className="form-input" style={{ flex: 1 }} placeholder="URL del boton (opcional)" value={composeCtaUrl} onChange={e => setComposeCtaUrl(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => setEmailView('inbox')}>Cancelar</button>
                      <button className="btn btn-primary" onClick={handleSendEmail} disabled={composeSending || !composeTo || !composeSubject || !composeBody}>
                        {composeSending ? 'Enviando...' : 'Enviar Email'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BROADCAST EMAIL */}
              {emailView === 'broadcast' && (
                <div className="card" style={{ padding: 24, maxWidth: 640 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{Megaphone({ size: 18 })} Email Masivo</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Envia un email a multiples usuarios a la vez. Usa con responsabilidad.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Audiencia</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[{ v: 'all', l: 'Todos los usuarios' }, { v: 'active', l: 'Activos (7 dias)' }, { v: 'premium', l: 'Premium' }].map(opt => (
                          <button key={opt.v} onClick={() => setBroadcastFilter(opt.v)}
                            style={{
                              padding: '6px 14px', fontSize: 12, borderRadius: 8, cursor: 'pointer',
                              background: broadcastFilter === opt.v ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                              color: broadcastFilter === opt.v ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid ' + (broadcastFilter === opt.v ? 'var(--accent-blue)' : 'var(--border-subtle)'),
                            }}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input className="form-input" placeholder="Asunto" value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} />
                    <textarea className="form-input" rows={8} placeholder="Cuerpo del mensaje" value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" style={{ flex: 1 }} placeholder="Texto del boton CTA (opcional)" value={broadcastCta} onChange={e => setBroadcastCta(e.target.value)} />
                      <input className="form-input" style={{ flex: 1 }} placeholder="URL del boton (opcional)" value={broadcastCtaUrl} onChange={e => setBroadcastCtaUrl(e.target.value)} />
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>
                        {AlertTriangle({ size: 12 })} Esto enviara un email a todos los usuarios del grupo seleccionado. No se puede deshacer.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => setEmailView('inbox')}>Cancelar</button>
                      <button className="btn btn-primary" onClick={handleBroadcast} disabled={broadcastSending || !broadcastSubject || !broadcastBody}
                        style={{ background: broadcastSending ? undefined : '#dc2626' }}>
                        {broadcastSending ? 'Enviando...' : `Enviar a ${broadcastFilter === 'all' ? 'Todos' : broadcastFilter === 'active' ? 'Activos' : 'Premium'}`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email type breakdown */}
              {emailView === 'inbox' && emailStats?.byType && Object.keys(emailStats.byType).length > 0 && (
                <div className="card" style={{ padding: 16, marginTop: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Desglose por tipo</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(emailStats.byType).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: any) => (
                      <div key={type} style={{
                        padding: '6px 12px', borderRadius: 8, background: 'var(--bg-secondary)',
                        fontSize: 12, display: 'flex', gap: 6, alignItems: 'center',
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </>}
      </div>
    </>
  )
}
