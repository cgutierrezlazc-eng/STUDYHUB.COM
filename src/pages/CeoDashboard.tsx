import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { BarChart3, GraduationCap, Gem, ClipboardList, Shield, CheckCircle, AlertTriangle, Link, RefreshCw, Users, Medal, BookOpen, Search as SearchIcon, Hourglass, Briefcase, Inbox, Send, Megaphone, Pencil, Trash2 } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

export default function CeoDashboard({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [financials, setFinancials] = useState<any>(null)
  const [fraudReport, setFraudReport] = useState<any>(null)
  const [compliance, setComplianceStatus] = useState<any>(null)
  const [f129, setF129] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'push' | 'financial' | 'f129' | 'fraud' | 'compliance' | 'certifications' | 'email' | 'moderation'>('overview')
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
  // Moderation queue state
  const [modQueue, setModQueue] = useState<any[]>([])
  const [modStats, setModStats] = useState<any>(null)
  const [modFilter, setModFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [modLoading, setModLoading] = useState(false)
  // Payment providers managed via Mercado Pago + PayPal (no Stripe)

  useEffect(() => {
    if (user?.role !== 'owner') return
    Promise.all([
      api.getCeoWeeklyReport().then(setWeeklyReport).catch(() => {}),
      api.getAdminFinanceDashboard().then(setFinancials).catch(() => {}),
      api.getReferralFraudReport().then(setFraudReport).catch(() => {}),
      api.getComplianceStatus().then(setComplianceStatus).catch(() => {}),
      // Payment health checks handled per-provider
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

  const loadModeration = async (status = 'pending') => {
    setModLoading(true)
    try {
      const [queue, stats] = await Promise.all([
        api.getModerationQueue(status),
        api.getModerationStats(),
      ])
      setModQueue(queue)
      setModStats(stats)
    } catch (err) {
      console.error('Failed to load moderation queue:', err)
    }
    setModLoading(false)
  }

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return
    setComposeSending(true)
    try {
      await api.ceoSendEmail(composeTo, composeSubject, composeBody, composeCta, composeCtaUrl)
      setComposeTo(''); setComposeSubject(''); setComposeBody(''); setComposeCta(''); setComposeCtaUrl('')
      setEmailView('inbox')
      loadEmailData(1, emailFilter)
    } catch (e: any) { alert(e.message || t('ceo.errorSending')) }
    setComposeSending(false)
  }

  const handleBroadcast = async () => {
    if (!broadcastSubject || !broadcastBody) return
    if (!confirm(t('ceo.broadcastConfirm').replace('{filter}', broadcastFilter))) return
    setBroadcastSending(true)
    try {
      const result = await api.ceoBroadcastEmail(broadcastSubject, broadcastBody, broadcastFilter, broadcastCta, broadcastCtaUrl)
      alert(t('ceo.emailSentTo').replace('{count}', String(result.recipients)))
      setBroadcastSubject(''); setBroadcastBody(''); setBroadcastCta(''); setBroadcastCtaUrl('')
      setEmailView('inbox')
      loadEmailData(1, emailFilter)
    } catch (e: any) { alert(e.message || t('ceo.errorSending')) }
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
    if (!confirm(t('ceo.deleteEmailConfirm'))) return
    setDeletingEmail(true)
    try {
      await api.ceoDeleteEmail(emailId)
      setEmailInbox(prev => prev.filter(e => e.id !== emailId))
      setEmailTotal(prev => prev - 1)
      if (emailView === 'detail') setEmailView('inbox')
    } catch (e: any) { alert(e.message || t('ceo.errorDeleting')) }
    setDeletingEmail(false)
  }

  const handleDeleteSelectedEmails = async () => {
    if (selectedEmails.size === 0) return
    if (!confirm(t('ceo.deleteEmailsConfirm').replace('{count}', String(selectedEmails.size)))) return
    setDeletingEmail(true)
    try {
      await api.ceoDeleteEmailsBulk([...selectedEmails])
      setEmailInbox(prev => prev.filter(e => !selectedEmails.has(e.id)))
      setEmailTotal(prev => prev - selectedEmails.size)
      setSelectedEmails(new Set())
    } catch (e: any) { alert(e.message || t('ceo.errorDeleting')) }
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
      setCertMessage({ type: 'success', text: result.message || t('ceo.certIssued') })
      setSelectedUsers(prev => ({ ...prev, [userId]: [] }))
      // Reload data
      await loadProgressOverview()
    } catch (e: any) {
      setCertMessage({ type: 'error', text: e.message || t('ceo.errorSending') })
    }
    setCertifying(false)
  }

  const handleRevokeCert = async (userId: string, courseId: string, courseTitle: string) => {
    if (!confirm(t('ceo.revokeCertConfirm').replace('{title}', courseTitle))) return
    try {
      await api.adminRevokeCertificate(userId, courseId)
      setCertMessage({ type: 'success', text: t('ceo.certRevoked') })
      await loadProgressOverview()
    } catch (e: any) {
      setCertMessage({ type: 'error', text: e.message || t('ceo.errorDeleting') })
    }
  }

  const submitF129 = async () => {
    if (!f129) return
    if (!confirm(t('ceo.submitF129Confirm'))) return
    try {
      const result = await api.submitF129(f129)
      alert(result.message || t('ceo.f129Processed'))
    } catch (e: any) { alert(e.message || 'Error') }
  }

  if (user?.role !== 'owner') return <div className="page-body"><p>{t('ceo.restrictedAccess')}</p></div>

  const fmt = (n: number) => n?.toLocaleString('es-CL') || '0'
  const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

  return (
    <>
      <div className="page-header page-enter">
        <h2>{Briefcase({ size: 22 })} {t('ceo.title')}</h2>
        <p>{t('ceo.subtitle')}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="tab" style={{ background: '#0078d4', color: '#fff', border: '1px solid #0078d4', fontWeight: 600 }} onClick={() => onNavigate('/ceo/mail')}>
            {Inbox({ size: 14 })} {t('ceo.ceoMail')}
          </button>
          <button className="tab" style={{ background: '#10B981', color: '#fff', border: '1px solid #10B981', fontWeight: 600 }} onClick={() => onNavigate('/ceo/mail')}>
            {Inbox({ size: 14 })} {t('ceo.contactMail')}
          </button>
          {(['overview', 'push', 'certifications', 'financial', 'f129', 'fraud', 'compliance', 'moderation'] as const).map(tb => (
            <button key={tb} className={`tab ${tab === tb ? 'active' : ''}`} onClick={() => { setTab(tb as any); if (tb === 'f129' && !f129) loadF129(); if (tb === 'certifications' && !progressData) loadProgressOverview(); if (tb === 'moderation') loadModeration(modFilter); }}>
              {tb === 'overview' ? <>{BarChart3({ size: 14 })} {t('ceo.tabOverview')}</> : tb === 'push' ? <>{Megaphone({ size: 14 })} {t('ceo.tabPush')}</> : tb === 'certifications' ? <>{GraduationCap({ size: 14 })} {t('ceo.tabCertifications')}</> : tb === 'financial' ? <>{Gem({ size: 14 })} {t('ceo.tabFinancial')}</> : tb === 'f129' ? <>{ClipboardList({ size: 14 })} {t('ceo.tabF129')}</> : tb === 'fraud' ? <>{Shield({ size: 14 })} {t('ceo.tabFraud')}</> : tb === 'moderation' ? <>{Shield({ size: 14 })} Moderación {modStats?.pending > 0 ? <span style={{background:'#ef4444',color:'#fff',borderRadius:10,padding:'0 6px',fontSize:10,marginLeft:4}}>{modStats.pending}</span> : null}</> : <>{CheckCircle({ size: 14 })} {t('ceo.tabCompliance')}</>}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div> : <>

          {/* OVERVIEW */}
          {tab === 'overview' && weeklyReport && (
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>{t('ceo.weeklyReport')}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{weeklyReport.period}</p>

              <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                  <div className="stat-value">{fmtUsd(weeklyReport.revenue?.grossUsd)}</div>
                  <div className="stat-label">{t('ceo.weekRevenue')} {weeklyReport.revenue?.trend}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                  <div className="stat-value">{weeklyReport.users?.newThisWeek}</div>
                  <div className="stat-label">{t('ceo.newUsers')} ({weeklyReport.users?.growthPercent > 0 ? '+' : ''}{weeklyReport.users?.growthPercent}%)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                  <div className="stat-value">{weeklyReport.users?.activeThisWeek}</div>
                  <div className="stat-label">{t('ceo.activeUsers')} ({weeklyReport.users?.activeRate}%)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
                  <div className="stat-value">{weeklyReport.engagement?.studyHours}h</div>
                  <div className="stat-label">{t('ceo.studyHours')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="u-card" style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>{Gem({ size: 16 })} {t('ceo.netProfit')}</h4>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>${fmt(weeklyReport.revenue?.gananciaNetaClp)} CLP</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ceo.afterCommissions')}</p>
                </div>
                <div className="u-card" style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>{BarChart3({ size: 16 })} {t('ceo.engagement')}</h4>
                  <div style={{ fontSize: 13 }}>
                    <div>{t('ceo.posts')}: {weeklyReport.engagement?.wallPosts} | {t('ceo.community')}: {weeklyReport.engagement?.communityPosts}</div>
                    <div>{t('ceo.messages')}: {weeklyReport.engagement?.messages} | {t('ceo.quizzes')}: {weeklyReport.engagement?.quizzesTaken}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCIAL */}
          {tab === 'financial' && (
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
          )}

          {/* F129 */}
          {tab === 'f129' && (
            <div>
              {!f129 ? (
                <div className="u-card" style={{ padding: 24, textAlign: 'center' }}>
                  <h3>{ClipboardList({ size: 18 })} {t('ceo.generateF129')}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{t('ceo.generateF129Desc')}</p>
                  <button className="btn btn-primary" onClick={() => loadF129()}>{t('ceo.generateCurrentPeriod')}</button>
                </div>
              ) : (
                <div>
                  <div className="u-card" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ margin: 0 }}>{ClipboardList({ size: 18 })} F129 — {f129.periodoTexto}</h3>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: f129.estado === 'generado' ? 'var(--bg-tertiary)' : 'rgba(5,150,105,0.08)', color: f129.estado === 'generado' ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                        {f129.estado === 'generado' ? <>{Hourglass({ size: 12 })} {t('ceo.pendingSubmission')}</> : <>{CheckCircle({ size: 12 })} {t('ceo.submitted')}</>}
                      </span>
                    </div>
                    <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ padding: 8 }}>{t('ceo.rutIssuer')}</td><td style={{ textAlign: 'right' }}>{f129.rutEmisor}</td></tr>
                        <tr><td style={{ padding: 8 }}>{t('ceo.businessName')}</td><td style={{ textAlign: 'right' }}>{f129.razonSocial}</td></tr>
                        <tr style={{ borderTop: '1px solid var(--border)' }}><td style={{ padding: 8 }}>{t('ceo.netTaxableSales')}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(f129.ventasNetasAfectas)} CLP</td></tr>
                        <tr><td style={{ padding: 8 }}>{t('ceo.ivaRate')}</td><td style={{ textAlign: 'right' }}>{f129.tasaIva}</td></tr>
                        <tr style={{ borderTop: '2px solid var(--border)', fontSize: 16, fontWeight: 700 }}><td style={{ padding: 8 }}>{t('ceo.ivaToPay')}</td><td style={{ textAlign: 'right', color: 'var(--accent-red)' }}>${fmt(f129.ivaAPagar)} CLP</td></tr>
                      </tbody>
                    </table>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>{f129.nota}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ceo.deadline')}: {f129.plazoDeclaracion}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={submitF129}>{t('ceo.submitToSii')}</button>
                    <a href={f129.urlSii} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">{Link({ size: 14 })} {t('ceo.siiPortal')}</a>
                    <button className="btn btn-secondary" onClick={() => loadF129()}>{RefreshCw({ size: 14 })} {t('ceo.regenerate')}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FRAUD */}
          {tab === 'fraud' && fraudReport && (
            <div>
              <div className="u-card" style={{ padding: 20, marginBottom: 16 }}>
                <h4 style={{ marginTop: 0 }}>{Shield({ size: 16 })} {t('ceo.fraudDetection')}</h4>
                <p style={{ fontSize: 14 }}>{t('ceo.totalReferrals')}: <strong>{fraudReport.totalReferrals}</strong></p>
              </div>
              {fraudReport.suspiciousAccounts?.length > 0 ? (
                fraudReport.suspiciousAccounts.map((s: any) => (
                  <div key={s.userId} className="u-card" style={{ padding: 16, marginBottom: 8, borderLeft: `4px solid ${s.fraudProbability > 70 ? 'var(--accent-red)' : 'var(--accent-orange)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{s.name}</strong> <span style={{ color: 'var(--text-muted)' }}>@{s.username}</span>
                        <div style={{ fontSize: 13 }}>{t('ceo.referrals')}: {s.totalReferred} | {t('ceo.inactive')}: {s.inactiveReferred}</div>
                      </div>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: s.fraudProbability > 70 ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)', color: s.fraudProbability > 70 ? 'var(--accent-red)' : 'var(--accent-orange)', fontWeight: 600 }}>
                        {s.fraudProbability}% {t('ceo.risk')} — {s.recommendation}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">{CheckCircle({ size: 48 })}</div><h3>{t('ceo.noSuspiciousActivity')}</h3></div>
              )}
            </div>
          )}

          {/* COMPLIANCE */}
          {tab === 'compliance' && compliance && (
            <div className="u-card" style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>{CheckCircle({ size: 18 })} {t('ceo.complianceStatus')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {compliance.requirements?.map((req: string, i: number) => (
                  <div key={i} style={{ fontSize: 14, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>{req}</div>
                ))}
              </div>
              {compliance.pending?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ color: 'var(--accent-orange)' }}>{Hourglass({ size: 16 })} {t('ceo.pending')}</h4>
                  {compliance.pending.map((p: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: 8, color: 'var(--accent-orange)' }}>• {p}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <h4>{ClipboardList({ size: 16 })} {t('ceo.legalNotes')}</h4>
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
                  <h3 style={{ fontSize: 17, margin: '0 0 4px' }}>{GraduationCap({ size: 18 })} {t('ceo.certManagement')}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {t('ceo.certManagementDesc')}
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={loadProgressOverview} disabled={certLoading}>
                  {RefreshCw({ size: 14 })} {t('ceo.refresh')}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
              ) : progressData ? (
                <>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: t('ceo.activeStudents'), value: progressData.summary.totalUsersWithProgress, icon: Users({ size: 24 }), color: '#2D62C8' },
                      { label: t('ceo.certsIssued'), value: progressData.summary.totalCertificatesIssued, icon: Medal({ size: 24 }), color: '#059669' },
                      { label: t('ceo.coursesInProgress'), value: progressData.summary.totalInProgress, icon: BookOpen({ size: 24 }), color: '#C4882A' },
                      { label: t('ceo.totalCourses'), value: progressData.summary.totalCourses, icon: BookOpen({ size: 24 }), color: '#5B5FC7' },
                    ].map((card, i) => (
                      <div key={i} className="u-card" style={{ padding: 16, textAlign: 'center' }}>
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
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t('ceo.scoreOnCertify')}</span>
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
                      {t('ceo.scoreAssigned')}
                    </span>
                  </div>

                  {/* Search */}
                  <input type="text" placeholder={t('ceo.searchByNameOrEmail')} value={certSearch}
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
                        <div key={userData.userId} className="u-card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
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
                                {Medal({ size: 14 })} {userData.completedCount} {t('ceo.completed')}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {BookOpen({ size: 14 })} {userData.totalStarted} {t('ceo.started')}
                              </span>
                              {userSelected.length > 0 && (
                                <button onClick={() => handleCertify(userData.userId)} disabled={certifying}
                                  style={{
                                    padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                    background: '#059669', color: '#fff', fontSize: 12, fontWeight: 600,
                                  }}>
                                  {certifying ? '...' : <>{GraduationCap({ size: 14 })} {t('ceo.certifyCourses')} {userSelected.length} {t('ceo.course')}</>}
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
                                  {CheckCircle({ size: 12 })} {t('ceo.certsObtained')}
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
                                        title={t('ceo.revokeTooltip')}
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
                                  <span>{ClipboardList({ size: 12 })} {t('ceo.availableToCertify')}</span>
                                  <button onClick={() => selectAllCoursesForUser(userData.userId, incompleteCourses.map((c: any) => c.id))}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer',
                                      fontSize: 10, color: '#2D62C8', fontWeight: 700, textTransform: 'uppercase',
                                    }}>
                                    {incompleteCourses.every((c: any) => userSelected.includes(c.id)) ? t('ceo.deselectAll') : t('ceo.selectAll')}
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
                                {CheckCircle({ size: 16 })} {t('ceo.allCoursesCompleted')}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                  {progressData.users.length === 0 && (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <div className="empty-state-icon">{ClipboardList({ size: 48 })}</div>
                      <h3>{t('ceo.noActivityYet')}</h3>
                      <p style={{ color: 'var(--text-muted)' }}>{t('ceo.noActivityDesc')}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-state-icon">{GraduationCap({ size: 48 })}</div>
                  <h3>{t('ceo.loadProgressData')}</h3>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={loadProgressOverview}>
                    {t('ceo.loadData')}
                  </button>
                </div>
              )}
            </div>
          )}

                    {/* MODERATION TAB */}
          {tab === 'moderation' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>Cola de Moderación</strong>
                {modStats && (
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                      <button
                        key={f}
                        className={`btn btn-sm ${modFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setModFilter(f); loadModeration(f) }}
                      >
                        {f === 'pending' ? `Pendiente (${modStats.pending})` :
                         f === 'approved' ? `Aprobado (${modStats.approved})` :
                         f === 'rejected' ? `Rechazado (${modStats.rejected})` : 'Todos'}
                      </button>
                    ))}
                    <button className="btn btn-secondary btn-sm" onClick={() => loadModeration(modFilter)}>Refrescar</button>
                  </div>
                )}
              </div>

              {modLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Cargando...</div>
              ) : modQueue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700 }}>Sin elementos pendientes</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Todo el contenido está revisado.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {modQueue.map(item => (
                    <div key={item.id} style={{
                      background: 'var(--bg-card)', borderRadius: 12, padding: 16,
                      border: `1.5px solid ${item.status === 'pending' ? '#f59e0b' : item.status === 'approved' ? '#10b981' : '#ef4444'}`,
                    }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              background: item.category === 'adult' ? '#ef4444' : item.category === 'hate' ? '#7c3aed' : item.category === 'violence' ? '#dc2626' : '#f59e0b',
                              color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                            }}>{item.category?.toUpperCase()}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              @{item.senderUsername} · {new Date(item.createdAt).toLocaleDateString('es-CL')}
                            </span>
                            <span style={{
                              marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                              color: item.status === 'pending' ? '#f59e0b' : item.status === 'approved' ? '#10b981' : '#ef4444',
                            }}>{item.status === 'pending' ? 'PENDIENTE' : item.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                            <strong>Razón automática:</strong> {item.autoReason || 'Sin razón'}
                          </div>
                          {/* Content preview */}
                          <div style={{
                            background: 'var(--bg-secondary)', borderRadius: 8, padding: 12,
                            fontSize: 13, maxHeight: 200, overflowY: 'auto',
                            border: '1px solid var(--border-subtle)',
                          }}>
                            {item.originalContent?.startsWith('data:image') ? (
                              <img src={item.originalContent} alt="Contenido flaggeado" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6 }} />
                            ) : item.originalContent?.startsWith('data:video') ? (
                              <video src={item.originalContent} controls style={{ maxWidth: '100%', maxHeight: 180 }} />
                            ) : (
                              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.originalContent}</span>
                            )}
                          </div>
                          {item.ceoNote && (
                            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Nota CEO: {item.ceoNote}
                            </div>
                          )}
                        </div>
                        {item.status === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#10b981', color: '#fff', border: 'none', fontWeight: 700 }}
                              onClick={async () => {
                                try {
                                  await api.approveModerationItem(item.id)
                                  loadModeration(modFilter)
                                } catch (e) { alert('Error al aprobar') }
                              }}
                            >Aprobar</button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700 }}
                              onClick={async () => {
                                const note = prompt('Razón del rechazo (opcional):') || undefined
                                try {
                                  await api.rejectModerationItem(item.id, note)
                                  loadModeration(modFilter)
                                } catch (e) { alert('Error al rechazar') }
                              }}
                            >Rechazar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                    {/* PUSH NOTIFICATIONS TAB */}
          {tab === 'push' && (
            <div className="u-card" style={{ padding: 20, marginTop: 16, border: '2px solid var(--accent-blue)', borderRadius: 12 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>📲 {t('ceo.pushTitle')}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{t('ceo.pushDesc')}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={async () => {
                  if (!confirm(t('ceo.pushUpdateConfirm'))) return;
                  try {
                    await api.broadcastPush(
                      '🔄 Actualiza tu App Conniku',
                      'Hemos actualizado el logo oficial y mejorado la plataforma. Actualiza para ver los cambios.',
                      '/'
                    );
                    alert(t('ceo.pushSent'));
                  } catch (e: any) { alert('Error: ' + (e.message || e)); }
                }} style={{ background: '#2563EB' }}>
                  {t('ceo.pushUpdateApp')}
                </button>
                <button className="btn btn-primary btn-sm" onClick={async () => {
                  const titulo = prompt(t('ceo.pushTitlePrompt'));
                  if (!titulo) return;
                  const mensaje = prompt(t('ceo.pushMessagePrompt'));
                  if (!mensaje) return;
                  const url = prompt(t('ceo.pushUrlPrompt'), '/');
                  try {
                    await api.broadcastPush(titulo, mensaje, url || '/');
                    alert(t('ceo.pushSentShort'));
                  } catch (e: any) { alert('Error: ' + (e.message || e)); }
                }} style={{ background: '#059669' }}>
                  {t('ceo.pushCustom')}
                </button>
              </div>
            </div>
          )}

        </>}
      </div>
    </>
  )
}
