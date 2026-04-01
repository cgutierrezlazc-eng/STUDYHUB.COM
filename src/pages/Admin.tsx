import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { AdminStats } from '../types'

export default function Admin() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState<'stats' | 'users' | 'subscribers' | 'payments' | 'reports' | 'flagged' | 'blocks' | 'logs'>('stats')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [flagged, setFlagged] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [reportFilter, setReportFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [banReason, setBanReason] = useState('')
  const [banningUserId, setBanningUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [financials, setFinancials] = useState<any | null>(null)
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    if (tab === 'stats') loadStats()
    if (tab === 'users') loadUsers()
    if (tab === 'subscribers') loadUsers()
    if (tab === 'payments') loadFinancials()
    if (tab === 'flagged') loadFlagged()
    if (tab === 'logs') loadLogs()
    if (tab === 'reports') loadReports()
    if (tab === 'blocks') loadBlocks()
  }, [tab, page, filter, reportFilter])

  const loadStats = async () => {
    try { setStats(await api.adminGetStats()) } catch {}
  }

  const loadUsers = async () => {
    try {
      const data = await api.adminGetUsers(page, searchQuery || undefined, filter !== 'all' ? filter : undefined)
      setUsers(data.users)
      setTotalPages(data.pages)
    } catch {}
  }

  const loadFinancials = async () => {
    try {
      const [summary, payData] = await Promise.all([
        api.adminGetFinancialSummary(),
        api.adminGetPayments(page),
      ])
      setFinancials(summary)
      setPayments(payData.payments || [])
    } catch {}
  }

  const loadFlagged = async () => {
    try {
      const data = await api.adminGetFlaggedMessages(page)
      setFlagged(data.messages)
    } catch {}
  }

  const loadLogs = async () => {
    try {
      const data = await api.adminGetModerationLogs(page)
      setLogs(data.logs)
    } catch {}
  }

  const loadReports = async () => {
    try {
      const data = await api.adminGetReports(page, reportFilter !== 'all' ? reportFilter : undefined)
      setReports(data.reports)
      setTotalPages(data.pages || 1)
    } catch {}
  }

  const loadBlocks = async () => {
    try {
      const data = await api.adminGetBlockedUsers(page)
      setBlocks(data.blocks)
    } catch {}
  }

  const handleBan = async (userId: string) => {
    try {
      await api.adminBanUser(userId, banReason || 'Violación de términos')
      setBanningUserId(null)
      setBanReason('')
      loadUsers(); loadStats()
    } catch {}
  }

  const handleUnban = async (userId: string) => {
    try { await api.adminUnbanUser(userId); loadUsers(); loadStats() } catch {}
  }

  const handleDeleteMsg = async (msgId: string) => {
    try { await api.adminDeleteMessage(msgId); loadFlagged() } catch {}
  }

  const handleReviewReport = async (reportId: string) => {
    try { await api.adminReviewReport(reportId); loadReports(); loadStats() } catch {}
  }

  const handleDismissReport = async (reportId: string) => {
    try { await api.adminDismissReport(reportId); loadReports(); loadStats() } catch {}
  }

  const handleForceUnblock = async (blockId: string) => {
    if (!confirm('¿Desbloquear esta relación de bloqueo?')) return
    try { await api.adminForceUnblock(blockId); loadBlocks(); loadStats() } catch {}
  }

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('¿Hacer administrador a este usuario?')) return
    try { await api.adminMakeAdmin(userId); loadUsers() } catch {}
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('¿Quitar permisos de administrador?')) return
    try { await api.adminRemoveAdmin(userId); loadUsers() } catch {}
  }

  const viewUserDetail = async (userId: string) => {
    try {
      const data = await api.adminGetUser(userId)
      setSelectedUser(data)
    } catch {}
  }

  const exportCSV = () => {
    if (!users.length) return
    const headers = ['ID', 'Email', 'Nombre', 'Usuario', 'Universidad', 'Carrera', 'Semestre', 'Estado', 'Suscripción', 'Creado', 'Último Login']
    const rows = users.map((u: any) => [
      u.id, u.email, `${u.firstName} ${u.lastName}`, u.username, u.university || '', u.career || '', u.semester,
      u.isBanned ? 'Baneado' : u.emailVerified ? 'Activo' : 'Sin verificar',
      u.subscriptionStatus || 'trial',
      new Date(u.createdAt).toLocaleDateString(), new Date(u.lastLogin).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `conniku-users-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!user?.isAdmin) return <div className="page-body"><p>No tienes acceso al panel de administración.</p></div>

  const TABS = [
    { id: 'stats', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'subscribers', label: 'Suscriptores', icon: '💳' },
    ...(user?.role === 'owner' ? [{ id: 'payments', label: 'Pagos/Finanzas', icon: '💰' }] : []),
    { id: 'reports', label: `Reportes${stats?.pendingReports ? ` (${stats.pendingReports})` : ''}`, icon: '🚨' },
    { id: 'flagged', label: 'Mensajes Flag.', icon: '⚠️' },
    { id: 'blocks', label: 'Bloqueos', icon: '🚫' },
    { id: 'logs', label: 'Registro', icon: '📋' },
  ]

  return (
    <>
      <div className="page-header">
        <h2>Panel de Administración {user?.role === 'owner' ? '— CEO/Owner' : ''}</h2>
        <p>Gestión de usuarios, moderación y estadísticas</p>
        {user?.role === 'owner' && stats && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Total usuarios: <strong>{stats.totalUsers}</strong></span>
            <span>Reportes pendientes: <strong style={{ color: stats.pendingReports ? '#ef4444' : 'inherit' }}>{stats.pendingReports}</strong></span>
            <span>Mensajes flagged: <strong style={{ color: stats.flaggedMessages ? '#f59e0b' : 'inherit' }}>{stats.flaggedMessages}</strong></span>
          </div>
        )}
      </div>
      <div className="page-body">
        <div className="admin-tabs">
          {TABS.map(tb => (
            <button key={tb.id} className={`admin-tab ${tab === tb.id ? 'active' : ''}`} onClick={() => { setTab(tb.id as any); setPage(1) }}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* ─── Stats Dashboard ─── */}
        {tab === 'stats' && stats && (
          <div className="admin-dashboard">
            <h3 style={{ marginBottom: 16 }}>Resumen General</h3>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.totalUsers}</div><div className="stat-label">Usuarios Totales</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.activeUsers}</div><div className="stat-label">Activos</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>{stats.bannedUsers}</div><div className="stat-label">Baneados</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.unverifiedUsers}</div><div className="stat-label">Sin Verificar</div></div>
            </div>
            <h3 style={{ margin: '24px 0 16px' }}>Actividad</h3>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{stats.totalMessages}</div><div className="stat-label">Mensajes</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.totalConversations}</div><div className="stat-label">Conversaciones</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{stats.totalFriendships}</div><div className="stat-label">Amistades</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.totalWallPosts}</div><div className="stat-label">Publicaciones</div></div>
            </div>
            <h3 style={{ margin: '24px 0 16px' }}>Moderación</h3>
            <div className="stats-grid">
              <div className="stat-card clickable" onClick={() => { setTab('flagged'); setPage(1) }}><div className="stat-value" style={{ color: '#f59e0b' }}>{stats.flaggedMessages}</div><div className="stat-label">Mensajes Flagged</div></div>
              <div className="stat-card clickable" onClick={() => { setTab('reports'); setPage(1) }}><div className="stat-value" style={{ color: '#ef4444' }}>{stats.pendingReports}</div><div className="stat-label">Reportes Pendientes</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.totalReports}</div><div className="stat-label">Reportes Totales</div></div>
              <div className="stat-card clickable" onClick={() => { setTab('blocks'); setPage(1) }}><div className="stat-value" style={{ color: 'var(--text-muted)' }}>{stats.totalBlocks}</div><div className="stat-label">Bloqueos Activos</div></div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Distribución de Usuarios</h3>
            <div className="admin-chart">
              {[
                { label: 'Activos', value: stats.activeUsers, color: 'var(--accent-green)', total: stats.totalUsers },
                { label: 'Baneados', value: stats.bannedUsers, color: 'var(--accent-red)', total: stats.totalUsers },
                { label: 'Sin Verificar', value: stats.unverifiedUsers, color: 'var(--accent-orange)', total: stats.totalUsers },
              ].map(bar => (
                <div key={bar.label} className="admin-chart-row">
                  <span className="admin-chart-label">{bar.label}</span>
                  <div className="admin-chart-bar-bg">
                    <div className="admin-chart-bar" style={{
                      width: `${bar.total > 0 ? (bar.value / bar.total * 100) : 0}%`,
                      background: bar.color,
                    }} />
                  </div>
                  <span className="admin-chart-value">{bar.value} ({bar.total > 0 ? Math.round(bar.value / bar.total * 100) : 0}%)</span>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Contenido de la Plataforma</h3>
            <div className="admin-chart">
              {(() => {
                const maxVal = Math.max(stats.totalMessages, stats.totalConversations, stats.totalFriendships, stats.totalWallPosts, 1);
                return [
                  { label: 'Mensajes', value: stats.totalMessages, color: 'var(--accent-purple)' },
                  { label: 'Conversaciones', value: stats.totalConversations, color: 'var(--accent-blue)' },
                  { label: 'Amistades', value: stats.totalFriendships, color: 'var(--accent-cyan)' },
                  { label: 'Publicaciones', value: stats.totalWallPosts, color: 'var(--accent-green)' },
                ].map(bar => (
                  <div key={bar.label} className="admin-chart-row">
                    <span className="admin-chart-label">{bar.label}</span>
                    <div className="admin-chart-bar-bg">
                      <div className="admin-chart-bar" style={{
                        width: `${(bar.value / maxVal * 100)}%`,
                        background: bar.color,
                      }} />
                    </div>
                    <span className="admin-chart-value">{bar.value}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ─── Users Management ─── */}
        {tab === 'users' && (
          <div className="admin-users">
            <div className="admin-toolbar">
              <input
                placeholder="Buscar por nombre, email o username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadUsers()}
                className="form-input"
              />
              <select className="form-input" value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}>
                <option value="all">Todos</option>
                <option value="banned">Baneados</option>
                <option value="unverified">Sin Verificar</option>
                <option value="admin">Administradores</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={loadUsers}>Buscar</button>
              <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Exportar datos de usuarios a CSV">Exportar CSV</button>
            </div>

            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th style={{ textAlign: 'center' }}>Básico</th>
                    <th style={{ textAlign: 'center' }}>PRO</th>
                    <th style={{ textAlign: 'center' }}>Ilimitado</th>
                    <th style={{ textAlign: 'center' }}>Owner</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const sub = u.subscriptionStatus || 'trial'
                    const isOwnerUser = u.role === 'owner'
                    return (
                    <tr key={u.id} className={u.isBanned ? 'row-banned' : ''}>
                      <td>#{String(u.userNumber).padStart(4, '0')}</td>
                      <td className="clickable-cell" onClick={() => viewUserDetail(u.id)}>@{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.firstName} {u.lastName}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="radio" name={`tier-${u.id}`} checked={sub === 'trial' || sub === 'expired' || sub === 'cancelled'}
                          onChange={() => { if (user?.role === 'owner' && !isOwnerUser) api.adminRevokePremium(u.id).then(() => loadUsers()) }}
                          disabled={isOwnerUser || user?.role !== 'owner'}
                          style={{ width: 16, height: 16, accentColor: 'var(--accent-orange)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="radio" name={`tier-${u.id}`} checked={sub === 'active' && !isOwnerUser}
                          onChange={() => { if (user?.role === 'owner' && !isOwnerUser) api.adminGrantPremium(u.id).then(() => loadUsers()) }}
                          disabled={isOwnerUser || user?.role !== 'owner'}
                          style={{ width: 16, height: 16, accentColor: 'var(--accent-green)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="radio" name={`tier-${u.id}`} checked={sub === 'active' && u.isAdmin && !isOwnerUser}
                          onChange={() => { if (user?.role === 'owner' && !isOwnerUser) { api.adminGrantPremium(u.id).then(() => api.adminMakeAdmin(u.id)).then(() => loadUsers()) } }}
                          disabled={isOwnerUser || user?.role !== 'owner'}
                          style={{ width: 16, height: 16, accentColor: 'var(--accent-purple)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="radio" name={`tier-${u.id}`} checked={isOwnerUser} disabled
                          style={{ width: 16, height: 16, accentColor: '#f59e0b' }} />
                      </td>
                      <td>
                        {u.isBanned && <span className="admin-badge danger">Baneado</span>}
                        {!u.emailVerified && <span className="admin-badge warning">No verificado</span>}
                        {u.isAdmin && <span className="admin-badge info">Admin</span>}
                        {!u.isBanned && u.emailVerified && !u.isAdmin && <span className="admin-badge success">Activo</span>}
                      </td>
                      <td>
                        <div className="admin-action-group">
                          <button className="btn btn-secondary btn-xs" onClick={() => viewUserDetail(u.id)}>Ver</button>
                          {!u.isAdmin ? (
                            <>
                              {u.isBanned ? (
                                <button className="btn btn-secondary btn-xs" onClick={() => handleUnban(u.id)}>Desbanear</button>
                              ) : (
                                <button className="btn btn-danger btn-xs" onClick={() => setBanningUserId(u.id)}>Banear</button>
                              )}
                            </>
                          ) : u.id !== user?.id ? (
                            <button className="btn btn-secondary btn-xs" onClick={() => handleRemoveAdmin(u.id)}>Quitar Admin</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                <span>{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            )}
          </div>
        )}

        {/* ─── Subscribers Management ─── */}
        {tab === 'subscribers' && (
          <div className="admin-subscribers">
            <h3 style={{ marginBottom: 16 }}>Estado de Suscripciones</h3>
            {(() => {
              const trial = users.filter(u => !u.subscriptionStatus || u.subscriptionStatus === 'trial')
              const active = users.filter(u => u.subscriptionStatus === 'active')
              const cancelled = users.filter(u => u.subscriptionStatus === 'cancelled')
              const expired = users.filter(u => u.subscriptionStatus === 'expired')
              const total = users.length || 1
              return (
                <>
                  <div className="stats-grid">
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{trial.length}</div><div className="stat-label">Trial</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{active.length}</div><div className="stat-label">Activos</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>{cancelled.length}</div><div className="stat-label">Cancelados</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--text-muted)' }}>{expired.length}</div><div className="stat-label">Expirados</div></div>
                  </div>
                  <h3 style={{ margin: '24px 0 16px' }}>Distribución de Suscripciones</h3>
                  <div className="admin-chart">
                    {[
                      { label: 'Trial', value: trial.length, color: 'var(--accent-orange)' },
                      { label: 'Activos', value: active.length, color: 'var(--accent-green)' },
                      { label: 'Cancelados', value: cancelled.length, color: '#ef4444' },
                      { label: 'Expirados', value: expired.length, color: 'var(--text-muted)' },
                    ].map(bar => (
                      <div key={bar.label} className="admin-chart-row">
                        <span className="admin-chart-label">{bar.label}</span>
                        <div className="admin-chart-bar-bg">
                          <div className="admin-chart-bar" style={{
                            width: `${(bar.value / total * 100)}%`,
                            background: bar.color,
                          }} />
                        </div>
                        <span className="admin-chart-value">{bar.value} ({Math.round(bar.value / total * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                  <h3 style={{ margin: '24px 0 16px' }}>Lista de Suscriptores</h3>
                  <div className="admin-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Email</th>
                          <th>Estado Suscripción</th>
                          <th>Inicio Trial</th>
                          <th>Expiración</th>
                          <th>Registrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td className="clickable-cell" onClick={() => viewUserDetail(u.id)}>@{u.username}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`admin-badge ${
                                u.subscriptionStatus === 'active' ? 'success' :
                                u.subscriptionStatus === 'cancelled' ? 'danger' :
                                u.subscriptionStatus === 'expired' ? 'warning' : 'info'
                              }`}>
                                {u.subscriptionStatus === 'active' ? 'Activo' :
                                 u.subscriptionStatus === 'cancelled' ? 'Cancelado' :
                                 u.subscriptionStatus === 'expired' ? 'Expirado' : 'Trial'}
                              </span>
                            </td>
                            <td>{u.trialStartDate ? new Date(u.trialStartDate).toLocaleDateString() : new Date(u.createdAt).toLocaleDateString()}</td>
                            <td>{u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString() : u.trialEndDate ? new Date(u.trialEndDate).toLocaleDateString() : '—'}</td>
                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                <span>{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            )}
          </div>
        )}

        {/* ─── Payments / Finances (Owner only) ─── */}
        {tab === 'payments' && financials && (
          <div className="admin-finances">
            <h3 style={{ marginBottom: 16 }}>Resumen Financiero</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-green)' }}>${financials.totalRevenue}</div>
                <div className="stat-label">Ingresos Totales (USD)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>${financials.monthlyRevenue}</div>
                <div className="stat-label">Ingresos Este Mes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>${financials.yearlyRevenue}</div>
                <div className="stat-label">Ingresos Este Año</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{financials.totalTransactions}</div>
                <div className="stat-label">Transacciones Totales</div>
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Desglose Financiero</h3>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Ingresos Brutos</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>${financials.totalRevenue} USD</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Comisiones Stripe/PayPal (est.)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>-${financials.estimatedFees} USD</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Impuestos IVA 16% (est.)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>-${financials.estimatedTaxes} USD</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Ingreso Neto (est.)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)' }}>${financials.netRevenue} USD</div>
                </div>
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Ingresos Mensuales (Últimos 6 meses)</h3>
            <div className="admin-chart">
              {financials.monthlyBreakdown?.map((m: any) => {
                const maxRev = Math.max(...financials.monthlyBreakdown.map((x: any) => x.revenue), 1)
                return (
                  <div key={m.month} className="admin-chart-row">
                    <span className="admin-chart-label">{m.label}</span>
                    <div className="admin-chart-bar-bg">
                      <div className="admin-chart-bar" style={{
                        width: `${(m.revenue / maxRev * 100)}%`,
                        background: 'var(--accent-green)',
                      }} />
                    </div>
                    <span className="admin-chart-value">${m.revenue}</span>
                  </div>
                )
              })}
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Suscriptores por Tipo</h3>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value" style={{ color: '#f59e0b' }}>{financials.subscribers?.owner || 0}</div><div className="stat-label">Owner</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{financials.subscribers?.active || 0}</div><div className="stat-label">PRO Pagado</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{financials.subscribers?.trial || 0}</div><div className="stat-label">Trial</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--text-muted)' }}>{(financials.subscribers?.cancelled || 0) + (financials.subscribers?.expired || 0)}</div><div className="stat-label">Inactivos</div></div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Historial de Pagos</h3>
            {payments.length === 0 ? (
              <div className="msg-empty"><p>No hay pagos registrados aún</p></div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Proveedor</th>
                      <th>ID Transacción</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td>{new Date(p.createdAt).toLocaleString()}</td>
                        <td>@{p.user?.username || '?'}</td>
                        <td><span className={`admin-badge ${p.provider === 'stripe' ? 'info' : 'success'}`}>{p.provider}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.transactionId || '—'}</td>
                        <td style={{ fontWeight: 600 }}>${p.amount} {p.currency}</td>
                        <td><span className={`admin-badge ${p.status === 'completed' ? 'success' : 'warning'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card" style={{ padding: 16, marginTop: 20, background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-blue)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Nota:</strong> Los impuestos y comisiones son estimaciones. Consulta con tu contador para datos exactos.
                Los recibos de pago se envían automáticamente por email a cada cliente después de cada transacción.
              </p>
            </div>
          </div>
        )}

        {/* ─── Reports ─── */}
        {tab === 'reports' && (
          <div className="admin-reports">
            <div className="admin-toolbar">
              <select className="form-input" value={reportFilter} onChange={e => { setReportFilter(e.target.value); setPage(1) }}>
                <option value="all">Todos los reportes</option>
                <option value="pending">Pendientes</option>
                <option value="reviewed">Revisados</option>
                <option value="dismissed">Descartados</option>
              </select>
            </div>

            {reports.length === 0 ? (
              <div className="msg-empty"><p>No hay reportes {reportFilter !== 'all' ? `con estado "${reportFilter}"` : ''}</p></div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="admin-report-card card">
                  <div className="admin-report-header">
                    <div className="admin-report-users">
                      <div>
                        <span className="admin-report-label">Reportado por:</span>
                        <strong> @{r.reporter?.username}</strong> ({r.reporter?.firstName} {r.reporter?.lastName})
                      </div>
                      <span>→</span>
                      <div>
                        <span className="admin-report-label">Usuario reportado:</span>
                        <strong> @{r.reported?.username}</strong> ({r.reported?.firstName} {r.reported?.lastName})
                      </div>
                    </div>
                    <span className={`admin-badge ${r.status === 'pending' ? 'warning' : r.status === 'reviewed' ? 'info' : 'success'}`}>
                      {r.status === 'pending' ? 'Pendiente' : r.status === 'reviewed' ? 'Revisado' : 'Descartado'}
                    </span>
                  </div>
                  <div className="admin-report-reason">
                    <strong>Motivo:</strong> {r.reason}
                  </div>
                  <div className="admin-report-footer">
                    <small>{new Date(r.createdAt).toLocaleString()}</small>
                    {r.status === 'pending' && (
                      <div className="admin-action-group">
                        <button className="btn btn-primary btn-xs" onClick={() => handleReviewReport(r.id)}>Marcar Revisado</button>
                        <button className="btn btn-secondary btn-xs" onClick={() => handleDismissReport(r.id)}>Descartar</button>
                        <button className="btn btn-danger btn-xs" onClick={() => { setBanningUserId(r.reported?.id); }}>Banear Usuario</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Flagged Messages ─── */}
        {tab === 'flagged' && (
          <div className="admin-flagged">
            {flagged.length === 0 ? (
              <div className="msg-empty"><p>No hay mensajes flagged</p></div>
            ) : (
              flagged.map(msg => (
                <div key={msg.id} className="admin-flagged-item card">
                  <div className="admin-flagged-header">
                    <span><strong>@{msg.sender?.username}</strong> ({msg.sender?.email})</span>
                    <span className="admin-badge warning">{msg.flagReason}</span>
                  </div>
                  <p className="admin-flagged-content">{msg.content}</p>
                  <div className="admin-flagged-actions">
                    <small>{new Date(msg.createdAt).toLocaleString()}</small>
                    <div className="admin-action-group">
                      <button className="btn btn-danger btn-xs" onClick={() => handleDeleteMsg(msg.id)}>Eliminar Mensaje</button>
                      <button className="btn btn-danger btn-xs" onClick={() => setBanningUserId(msg.sender?.id)}>Banear Autor</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Blocked Users ─── */}
        {tab === 'blocks' && (
          <div className="admin-blocks">
            {blocks.length === 0 ? (
              <div className="msg-empty"><p>No hay bloqueos activos entre usuarios</p></div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Bloqueador</th>
                      <th>Bloqueado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map(b => (
                      <tr key={b.id}>
                        <td>@{b.blocker?.username} ({b.blocker?.firstName})</td>
                        <td>@{b.blocked?.username} ({b.blocked?.firstName})</td>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-secondary btn-xs" onClick={() => handleForceUnblock(b.id)}>Forzar Desbloqueo</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Moderation Logs ─── */}
        {tab === 'logs' && (
          <div className="admin-logs">
            {logs.length === 0 ? (
              <div className="msg-empty"><p>No hay registros de moderación</p></div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Acción</th>
                      <th>Usuario Objetivo</th>
                      <th>Razón</th>
                      <th>Admin</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <span className={`admin-badge ${
                            log.action === 'ban' ? 'danger' :
                            log.action === 'unban' ? 'success' :
                            log.action === 'make_admin' ? 'info' :
                            log.action === 'remove_admin' ? 'warning' : 'warning'
                          }`}>
                            {log.action === 'ban' ? 'Baneo' :
                             log.action === 'unban' ? 'Desbaneo' :
                             log.action === 'make_admin' ? 'Hecho Admin' :
                             log.action === 'remove_admin' ? 'Quitado Admin' :
                             log.action === 'delete_message' ? 'Msg Eliminado' : log.action}
                          </span>
                        </td>
                        <td>@{log.targetUser?.username || '?'}</td>
                        <td>{log.reason || '—'}</td>
                        <td>@{log.adminUser?.username || '?'}</td>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── User Detail Modal ─── */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal admin-user-detail" onClick={e => e.stopPropagation()}>
              <div className="admin-detail-header">
                <div className="admin-detail-avatar">
                  {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" /> : (
                    <span>{(selectedUser.firstName?.[0] || '').toUpperCase()}{(selectedUser.lastName?.[0] || '').toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p>@{selectedUser.username} #{String(selectedUser.userNumber).padStart(4, '0')}</p>
                </div>
              </div>
              <div className="admin-detail-grid">
                <div className="admin-detail-item"><label>Email</label><span>{selectedUser.email}</span></div>
                <div className="admin-detail-item"><label>Universidad</label><span>{selectedUser.university || '—'}</span></div>
                <div className="admin-detail-item"><label>Carrera</label><span>{selectedUser.career || '—'}</span></div>
                <div className="admin-detail-item"><label>Semestre</label><span>{selectedUser.semester || '—'}</span></div>
                <div className="admin-detail-item"><label>Género</label><span>{selectedUser.gender || '—'}</span></div>
                <div className="admin-detail-item"><label>Teléfono</label><span>{selectedUser.phone || '—'}</span></div>
                <div className="admin-detail-item"><label>Fecha Nacimiento</label><span>{selectedUser.birthDate || '—'}</span></div>
                <div className="admin-detail-item"><label>Idioma</label><span>{selectedUser.language}</span></div>
                <div className="admin-detail-item"><label>Proveedor</label><span>{selectedUser.provider}</span></div>
                <div className="admin-detail-item"><label>Email Verificado</label><span>{selectedUser.emailVerified ? '✅ Sí' : '❌ No'}</span></div>
                <div className="admin-detail-item"><label>Estado</label><span>{selectedUser.isBanned ? '🚫 Baneado' : '✅ Activo'}</span></div>
                <div className="admin-detail-item"><label>Admin</label><span>{selectedUser.isAdmin ? '✅ Sí' : '❌ No'}</span></div>
                <div className="admin-detail-item"><label>Suscripción</label><span>{selectedUser.subscriptionStatus}</span></div>
                <div className="admin-detail-item"><label>Tema</label><span>{selectedUser.theme}</span></div>
                <div className="admin-detail-item"><label>Mensajes Enviados</label><span>{selectedUser.messageCount ?? '—'}</span></div>
                <div className="admin-detail-item"><label>Registrado</label><span>{new Date(selectedUser.createdAt).toLocaleString()}</span></div>
                <div className="admin-detail-item"><label>Último Login</label><span>{new Date(selectedUser.lastLogin).toLocaleString()}</span></div>
              </div>
              {selectedUser.bio && (
                <div className="admin-detail-bio">
                  <label>Bio</label>
                  <p>{selectedUser.bio}</p>
                </div>
              )}
              {selectedUser.banReason && (
                <div className="admin-detail-ban">
                  <label>Razón del baneo</label>
                  <p>{selectedUser.banReason}</p>
                </div>
              )}
              <div className="admin-detail-actions">
                {!selectedUser.isAdmin && !selectedUser.isBanned && (
                  <button className="btn btn-danger btn-sm" onClick={() => { setSelectedUser(null); setBanningUserId(selectedUser.id) }}>Banear</button>
                )}
                {selectedUser.isBanned && (
                  <button className="btn btn-primary btn-sm" onClick={() => { handleUnban(selectedUser.id); setSelectedUser(null) }}>Desbanear</button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Ban Modal ─── */}
        {banningUserId && (
          <div className="modal-overlay" onClick={() => setBanningUserId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Banear Usuario</h3>
              <div className="auth-field">
                <label>Razón del baneo</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="Escribe la razón del baneo..."
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setBanningUserId(null)}>Cancelar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleBan(banningUserId)}>Confirmar Baneo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
