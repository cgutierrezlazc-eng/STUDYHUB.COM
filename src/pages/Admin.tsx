import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import { useI18n } from '../services/i18n';
import { api } from '../services/api';
import { AdminStats } from '../types';
import {
  BarChart3,
  Users,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  XCircle,
  Gem,
  Shield,
} from '../components/Icons';

export default function Admin() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<
    | 'stats'
    | 'users'
    | 'subscribers'
    | 'payments'
    | 'refunds'
    | 'correo'
    | 'reports'
    | 'flagged'
    | 'blocks'
    | 'logs'
  >('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [banReason, setBanReason] = useState('');
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [financials, setFinancials] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [refundUpdateMsg, setRefundUpdateMsg] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<{ count: number; users: any[] } | null>(null);
  const [emailDocs, setEmailDocs] = useState<any[]>([]);
  const [emailDocsStats, setEmailDocsStats] = useState<any>(null);
  const [emailPolling, setEmailPolling] = useState(false);
  const [emailPollMsg, setEmailPollMsg] = useState('');
  const [emailDocFilter, setEmailDocFilter] = useState<string>('');

  useEffect(() => {
    if (tab === 'stats') {
      loadStats();
      loadOnlineUsers();
    }
    if (tab === 'users') loadUsers();
    if (tab === 'subscribers') loadUsers();
    if (tab === 'payments') loadFinancials();
    if (tab === 'refunds') loadRefunds();
    if (tab === 'correo') {
      loadEmailDocs();
      loadEmailDocsStats();
    }
    if (tab === 'flagged') loadFlagged();
    if (tab === 'logs') loadLogs();
    if (tab === 'reports') loadReports();
    if (tab === 'blocks') loadBlocks();
  }, [tab, page, filter, reportFilter]);

  const loadStats = async () => {
    try {
      setStats(await api.adminGetStats());
    } catch {}
  };

  const loadOnlineUsers = async () => {
    try {
      setOnlineUsers(await api.getOnlineUsers());
    } catch {}
  };

  const loadEmailDocs = async () => {
    try {
      const d: any = await api.getEmailDocs(emailDocFilter || undefined);
      setEmailDocs(d?.docs || []);
    } catch {}
  };

  const loadEmailDocsStats = async () => {
    try {
      setEmailDocsStats(await api.getEmailDocsStats());
    } catch {}
  };

  const handleEmailPoll = async () => {
    setEmailPolling(true);
    setEmailPollMsg('');
    try {
      const r: any = await api.pollEmailDocs();
      setEmailPollMsg(
        `✓ Revisado — ${r.result?.processed ?? 0} nuevo(s), ${r.result?.skipped ?? 0} omitido(s)`
      );
      loadEmailDocs();
      loadEmailDocsStats();
    } catch (e: any) {
      setEmailPollMsg(`Error: ${e.message}`);
    } finally {
      setEmailPolling(false);
    }
  };

  const handleReviewEmailDoc = async (id: string, status: string, notes?: string) => {
    try {
      await api.reviewEmailDoc(id, status, notes);
      setEmailDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
      loadEmailDocsStats();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDownloadEmailDoc = async (id: string, filename: string) => {
    try {
      const r: any = await api.downloadEmailDoc(id);
      if (!r.file_content_b64) return;
      const bytes = atob(r.file_content_b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: r.mime_type || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'documento.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.adminGetUsers(
        page,
        searchQuery || undefined,
        filter !== 'all' ? filter : undefined
      );
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch {}
  };

  const loadFinancials = async () => {
    try {
      const [summary, payData] = await Promise.all([
        api.adminGetFinancialSummary(),
        api.adminGetPayments(page),
      ]);
      setFinancials(summary);
      setPayments(payData.payments || []);
    } catch {}
  };

  const loadFlagged = async () => {
    try {
      const data = await api.adminGetFlaggedMessages(page);
      setFlagged(data.messages);
    } catch {}
  };

  const loadLogs = async () => {
    try {
      const data = await api.adminGetModerationLogs(page);
      setLogs(data.logs);
    } catch {}
  };

  const loadReports = async () => {
    try {
      const data = await api.adminGetReports(
        page,
        reportFilter !== 'all' ? reportFilter : undefined
      );
      setReports(data.reports);
      setTotalPages(data.pages || 1);
    } catch {}
  };

  const loadBlocks = async () => {
    try {
      const data = await api.adminGetBlockedUsers(page);
      setBlocks(data.blocks);
    } catch {}
  };

  const loadRefunds = async () => {
    try {
      const data = await api.getAdminRefundRequests();
      setRefundRequests(data.requests || []);
    } catch {}
  };

  const handleRefundUpdate = async (rrId: string, status: string) => {
    try {
      await api.updateAdminRefundRequest(rrId, { status });
      setRefundUpdateMsg(`Solicitud actualizada a: ${status}`);
      loadRefunds();
      setTimeout(() => setRefundUpdateMsg(''), 3000);
    } catch (err: any) {
      setRefundUpdateMsg(err.message || 'Error al actualizar');
    }
  };

  const handleBan = async (userId: string) => {
    try {
      await api.adminBanUser(userId, banReason || 'Violación de términos');
      setBanningUserId(null);
      setBanReason('');
      loadUsers();
      loadStats();
    } catch {}
  };

  const handleUnban = async (userId: string) => {
    try {
      await api.adminUnbanUser(userId);
      loadUsers();
      loadStats();
    } catch {}
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (
      !confirm(
        `¿Estás seguro de ELIMINAR permanentemente la cuenta de @${username}? Esta acción NO se puede deshacer.`
      )
    )
      return;
    if (!confirm(`Confirma nuevamente: eliminar a @${username} y todos sus datos.`)) return;
    try {
      await api.adminDeleteUser(userId);
      loadUsers();
      loadStats();
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar usuario');
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    try {
      await api.adminDeleteMessage(msgId);
      loadFlagged();
    } catch {}
  };

  const handleReviewReport = async (reportId: string) => {
    try {
      await api.adminReviewReport(reportId);
      loadReports();
      loadStats();
    } catch {}
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await api.adminDismissReport(reportId);
      loadReports();
      loadStats();
    } catch {}
  };

  const handleForceUnblock = async (blockId: string) => {
    if (!confirm('¿Desbloquear esta relación de bloqueo?')) return;
    try {
      await api.adminForceUnblock(blockId);
      loadBlocks();
      loadStats();
    } catch {}
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('¿Hacer administrador a este usuario?')) return;
    try {
      await api.adminMakeAdmin(userId);
      loadUsers();
    } catch {}
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('¿Quitar permisos de administrador?')) return;
    try {
      await api.adminRemoveAdmin(userId);
      loadUsers();
    } catch {}
  };

  const viewUserDetail = async (userId: string) => {
    try {
      const data = await api.adminGetUser(userId);
      setSelectedUser(data);
    } catch {}
  };

  const exportCSV = () => {
    if (!users.length) return;
    const headers = [
      'ID',
      'Email',
      'Nombre',
      'Usuario',
      'Universidad',
      'Carrera',
      'Semestre',
      'Estado',
      'Suscripción',
      'Creado',
      'Último Login',
    ];
    const rows = users.map((u: any) => [
      u.id,
      u.email,
      `${u.firstName} ${u.lastName}`,
      u.username,
      u.university || '',
      u.career || '',
      u.semester,
      u.isBanned ? 'Baneado' : u.emailVerified ? 'Activo' : 'Sin verificar',
      u.subscriptionStatus || 'trial',
      new Date(u.createdAt).toLocaleDateString(),
      new Date(u.lastLogin).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conniku-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user?.isAdmin)
    return (
      <div className="page-body">
        <p>No tienes acceso al panel de administración.</p>
      </div>
    );

  const TABS: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: 'Dashboard', icon: BarChart3({ size: 14 }) },
    { id: 'users', label: 'Usuarios', icon: Users({ size: 14 }) },
    { id: 'subscribers', label: 'Suscriptores', icon: Gem({ size: 14 }) },
    ...(user?.role === 'owner'
      ? [{ id: 'payments', label: 'Pagos/Finanzas', icon: Gem({ size: 14 }) }]
      : []),
    {
      id: 'refunds',
      label: `Reembolsos${refundRequests.filter((r: any) => r.status === 'pending').length > 0 ? ` (${refundRequests.filter((r: any) => r.status === 'pending').length})` : ''}`,
      icon: ClipboardList({ size: 14 }),
    },
    {
      id: 'correo',
      label: `📬 Correo${emailDocsStats?.pending > 0 ? ` (${emailDocsStats.pending})` : ''}`,
      icon: null,
    },
    {
      id: 'reports',
      label: `Reportes${stats?.pendingReports ? ` (${stats.pendingReports})` : ''}`,
      icon: AlertTriangle({ size: 14 }),
    },
    { id: 'flagged', label: 'Mensajes Report.', icon: AlertTriangle({ size: 14 }) },
    { id: 'blocks', label: 'Bloqueos', icon: Shield({ size: 14 }) },
    { id: 'logs', label: 'Registro', icon: ClipboardList({ size: 14 }) },
  ];

  return (
    <>
      <div className="page-header">
        <h2>Panel de Administración {user?.role === 'owner' ? '— CEO' : ''}</h2>
        <p>Gestión de usuarios, moderación y estadísticas</p>
        {user?.role === 'owner' && stats && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 8,
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Total usuarios: <strong>{stats.totalUsers}</strong>
            </span>
            <span>
              Reportes pendientes:{' '}
              <strong style={{ color: stats.pendingReports ? '#ef4444' : 'inherit' }}>
                {stats.pendingReports}
              </strong>
            </span>
            <span>
              Mensajes reportados:{' '}
              <strong style={{ color: stats.flaggedMessages ? '#f59e0b' : 'inherit' }}>
                {stats.flaggedMessages}
              </strong>
            </span>
          </div>
        )}
      </div>
      <div className="page-body">
        <div className="admin-tabs">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              className={`admin-tab ${tab === tb.id ? 'active' : ''}`}
              onClick={() => {
                setTab(tb.id as any);
                setPage(1);
              }}
            >
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* ─── Stats Dashboard ─── */}
        {tab === 'stats' && stats && (
          <div className="admin-dashboard">
            <h3 style={{ marginBottom: 16 }}>Resumen General</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                  {stats.totalUsers}
                </div>
                <div className="stat-label">Usuarios Totales</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
                  {stats.activeUsers}
                </div>
                <div className="stat-label">Activos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#ef4444' }}>
                  {stats.bannedUsers}
                </div>
                <div className="stat-label">Baneados</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>
                  {stats.unverifiedUsers}
                </div>
                <div className="stat-label">Sin Verificar</div>
              </div>
            </div>
            <h3 style={{ margin: '24px 0 16px' }}>Actividad</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
                  {stats.totalMessages}
                </div>
                <div className="stat-label">Mensajes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                  {stats.totalConversations}
                </div>
                <div className="stat-label">Conversaciones</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                  {stats.totalFriendships}
                </div>
                <div className="stat-label">Amistades</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
                  {stats.totalWallPosts}
                </div>
                <div className="stat-label">Publicaciones</div>
              </div>
            </div>
            <h3 style={{ margin: '24px 0 16px' }}>Moderación</h3>
            <div className="stats-grid">
              <div
                className="stat-card clickable"
                onClick={() => {
                  setTab('flagged');
                  setPage(1);
                }}
              >
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {stats.flaggedMessages}
                </div>
                <div className="stat-label">Mensajes Reportados</div>
              </div>
              <div
                className="stat-card clickable"
                onClick={() => {
                  setTab('reports');
                  setPage(1);
                }}
              >
                <div className="stat-value" style={{ color: '#ef4444' }}>
                  {stats.pendingReports}
                </div>
                <div className="stat-label">Reportes Pendientes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>
                  {stats.totalReports}
                </div>
                <div className="stat-label">Reportes Totales</div>
              </div>
              <div
                className="stat-card clickable"
                onClick={() => {
                  setTab('blocks');
                  setPage(1);
                }}
              >
                <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
                  {stats.totalBlocks}
                </div>
                <div className="stat-label">Bloqueos Activos</div>
              </div>
            </div>

            {/* ─── Online Users ─── */}
            <h3 style={{ margin: '24px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  boxShadow: '0 0 0 3px #22c55e44',
                }}
              />
              En línea ahora
              {onlineUsers && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'var(--text-muted)',
                  }}
                >
                  — {onlineUsers.count} usuario{onlineUsers.count !== 1 ? 's' : ''} activo
                  {onlineUsers.count !== 1 ? 's' : ''} en los últimos 5 min
                </span>
              )}
            </h3>
            {onlineUsers && onlineUsers.count > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {onlineUsers.users.map((u: any) => (
                  <div
                    key={u.id}
                    title={u.email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      fontSize: 13,
                    }}
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt=""
                        style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {u.name?.[0] || '?'}
                      </span>
                    )}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                    {u.role && u.role !== 'user' && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 8,
                          background: u.role === 'admin' ? '#8b5cf633' : '#f59e0b33',
                          color: u.role === 'admin' ? '#8b5cf6' : '#f59e0b',
                          textTransform: 'uppercase',
                        }}
                      >
                        {u.role}
                      </span>
                    )}
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#22c55e',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                No hay usuarios activos en este momento.
              </p>
            )}

            <h3 style={{ margin: '24px 0 16px' }}>Distribución de Usuarios</h3>
            <div className="admin-chart">
              {[
                {
                  label: 'Activos',
                  value: stats.activeUsers,
                  color: 'var(--accent-green)',
                  total: stats.totalUsers,
                },
                {
                  label: 'Baneados',
                  value: stats.bannedUsers,
                  color: 'var(--accent-red)',
                  total: stats.totalUsers,
                },
                {
                  label: 'Sin Verificar',
                  value: stats.unverifiedUsers,
                  color: 'var(--accent-orange)',
                  total: stats.totalUsers,
                },
              ].map((bar) => (
                <div key={bar.label} className="admin-chart-row">
                  <span className="admin-chart-label">{bar.label}</span>
                  <div className="admin-chart-bar-bg">
                    <div
                      className="admin-chart-bar"
                      style={{
                        width: `${bar.total > 0 ? (bar.value / bar.total) * 100 : 0}%`,
                        background: bar.color,
                      }}
                    />
                  </div>
                  <span className="admin-chart-value">
                    {bar.value} ({bar.total > 0 ? Math.round((bar.value / bar.total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Contenido de la Plataforma</h3>
            <div className="admin-chart">
              {(() => {
                const maxVal = Math.max(
                  stats.totalMessages,
                  stats.totalConversations,
                  stats.totalFriendships,
                  stats.totalWallPosts,
                  1
                );
                return [
                  { label: 'Mensajes', value: stats.totalMessages, color: 'var(--accent-purple)' },
                  {
                    label: 'Conversaciones',
                    value: stats.totalConversations,
                    color: 'var(--accent-blue)',
                  },
                  {
                    label: 'Amistades',
                    value: stats.totalFriendships,
                    color: 'var(--accent-cyan)',
                  },
                  {
                    label: 'Publicaciones',
                    value: stats.totalWallPosts,
                    color: 'var(--accent-green)',
                  },
                ].map((bar) => (
                  <div key={bar.label} className="admin-chart-row">
                    <span className="admin-chart-label">{bar.label}</span>
                    <div className="admin-chart-bar-bg">
                      <div
                        className="admin-chart-bar"
                        style={{
                          width: `${(bar.value / maxVal) * 100}%`,
                          background: bar.color,
                        }}
                      />
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
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="form-input"
              />
              <select
                className="form-input"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Todos</option>
                <option value="banned">Baneados</option>
                <option value="unverified">Sin Verificar</option>
                <option value="admin">Administradores</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={loadUsers}>
                Buscar
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={exportCSV}
                title="Exportar datos de usuarios a CSV"
              >
                Exportar CSV
              </button>
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
                  {users.map((u) => {
                    const sub = u.subscriptionStatus || 'trial';
                    const isOwnerUser = u.role === 'owner';
                    return (
                      <tr key={u.id} className={u.isBanned ? 'row-banned' : ''}>
                        <td>#{String(u.userNumber).padStart(4, '0')}</td>
                        <td className="clickable-cell" onClick={() => viewUserDetail(u.id)}>
                          @{u.username}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          {u.firstName} {u.lastName}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name={`tier-${u.id}`}
                            checked={sub === 'trial' || sub === 'expired' || sub === 'cancelled'}
                            onChange={() => {
                              if (user?.role === 'owner' && !isOwnerUser)
                                api.adminRevokePremium(u.id).then(() => loadUsers());
                            }}
                            disabled={isOwnerUser || user?.role !== 'owner'}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-orange)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name={`tier-${u.id}`}
                            checked={sub === 'active' && !isOwnerUser}
                            onChange={() => {
                              if (user?.role === 'owner' && !isOwnerUser)
                                api.adminGrantPremium(u.id).then(() => loadUsers());
                            }}
                            disabled={isOwnerUser || user?.role !== 'owner'}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-green)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name={`tier-${u.id}`}
                            checked={sub === 'active' && u.isAdmin && !isOwnerUser}
                            onChange={() => {
                              if (user?.role === 'owner' && !isOwnerUser) {
                                api
                                  .adminGrantPremium(u.id)
                                  .then(() => api.adminMakeAdmin(u.id))
                                  .then(() => loadUsers());
                              }
                            }}
                            disabled={isOwnerUser || user?.role !== 'owner'}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-purple)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name={`tier-${u.id}`}
                            checked={isOwnerUser}
                            disabled
                            style={{ width: 16, height: 16, accentColor: '#f59e0b' }}
                          />
                        </td>
                        <td>
                          {u.isBanned && <span className="admin-badge danger">Baneado</span>}
                          {!u.emailVerified && (
                            <span className="admin-badge warning">No verificado</span>
                          )}
                          {u.isAdmin && <span className="admin-badge info">Admin</span>}
                          {!u.isBanned && u.emailVerified && !u.isAdmin && (
                            <span className="admin-badge success">Activo</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-action-group">
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => viewUserDetail(u.id)}
                            >
                              Ver
                            </button>
                            {!u.isAdmin ? (
                              <>
                                {u.isBanned ? (
                                  <button
                                    className="btn btn-secondary btn-xs"
                                    onClick={() => handleUnban(u.id)}
                                  >
                                    Desbanear
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-danger btn-xs"
                                    onClick={() => setBanningUserId(u.id)}
                                  >
                                    Banear
                                  </button>
                                )}
                              </>
                            ) : u.id !== user?.id ? (
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleRemoveAdmin(u.id)}
                              >
                                Quitar Admin
                              </button>
                            ) : null}
                            {user?.role === 'owner' && u.role !== 'owner' && (
                              <button
                                className="btn btn-xs"
                                style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none' }}
                                onClick={() => handleDeleteUser(u.id, u.username)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ←
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Subscribers Management ─── */}
        {tab === 'subscribers' && (
          <div className="admin-subscribers">
            <h3 style={{ marginBottom: 16 }}>Estado de Suscripciones</h3>
            {(() => {
              const trial = users.filter(
                (u) => !u.subscriptionStatus || u.subscriptionStatus === 'trial'
              );
              const active = users.filter((u) => u.subscriptionStatus === 'active');
              const cancelled = users.filter((u) => u.subscriptionStatus === 'cancelled');
              const expired = users.filter((u) => u.subscriptionStatus === 'expired');
              const total = users.length || 1;
              return (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>
                        {trial.length}
                      </div>
                      <div className="stat-label">Trial</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
                        {active.length}
                      </div>
                      <div className="stat-label">Activos</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: '#ef4444' }}>
                        {cancelled.length}
                      </div>
                      <div className="stat-label">Cancelados</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
                        {expired.length}
                      </div>
                      <div className="stat-label">Expirados</div>
                    </div>
                  </div>
                  <h3 style={{ margin: '24px 0 16px' }}>Distribución de Suscripciones</h3>
                  <div className="admin-chart">
                    {[
                      { label: 'Trial', value: trial.length, color: 'var(--accent-orange)' },
                      { label: 'Activos', value: active.length, color: 'var(--accent-green)' },
                      { label: 'Cancelados', value: cancelled.length, color: '#ef4444' },
                      { label: 'Expirados', value: expired.length, color: 'var(--text-muted)' },
                    ].map((bar) => (
                      <div key={bar.label} className="admin-chart-row">
                        <span className="admin-chart-label">{bar.label}</span>
                        <div className="admin-chart-bar-bg">
                          <div
                            className="admin-chart-bar"
                            style={{
                              width: `${(bar.value / total) * 100}%`,
                              background: bar.color,
                            }}
                          />
                        </div>
                        <span className="admin-chart-value">
                          {bar.value} ({Math.round((bar.value / total) * 100)}%)
                        </span>
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
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td className="clickable-cell" onClick={() => viewUserDetail(u.id)}>
                              @{u.username}
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span
                                className={`admin-badge ${
                                  u.subscriptionStatus === 'active'
                                    ? 'success'
                                    : u.subscriptionStatus === 'cancelled'
                                      ? 'danger'
                                      : u.subscriptionStatus === 'expired'
                                        ? 'warning'
                                        : 'info'
                                }`}
                              >
                                {u.subscriptionStatus === 'active'
                                  ? 'Activo'
                                  : u.subscriptionStatus === 'cancelled'
                                    ? 'Cancelado'
                                    : u.subscriptionStatus === 'expired'
                                      ? 'Expirado'
                                      : 'Trial'}
                              </span>
                            </td>
                            <td>
                              {u.trialStartDate
                                ? new Date(u.trialStartDate).toLocaleDateString()
                                : new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              {u.subscriptionExpiry
                                ? new Date(u.subscriptionExpiry).toLocaleDateString()
                                : u.trialEndDate
                                  ? new Date(u.trialEndDate).toLocaleDateString()
                                  : '—'}
                            </td>
                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ←
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  →
                </button>
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
                <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
                  ${financials.totalRevenue}
                </div>
                <div className="stat-label">Ingresos Totales (USD)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                  ${financials.monthlyRevenue}
                </div>
                <div className="stat-label">Ingresos Este Mes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
                  ${financials.yearlyRevenue}
                </div>
                <div className="stat-label">Ingresos Este Año</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>
                  {financials.totalTransactions}
                </div>
                <div className="stat-label">Transacciones Totales</div>
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Desglose Financiero</h3>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Ingresos Brutos
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>
                    ${financials.totalRevenue} USD
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Comisiones plataforma (est.)
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
                    -${financials.estimatedFees} USD
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Impuestos IVA 16% (est.)
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                    -${financials.estimatedTaxes} USD
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Ingreso Neto (est.)
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)' }}>
                    ${financials.netRevenue} USD
                  </div>
                </div>
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Ingresos Mensuales (Últimos 6 meses)</h3>
            <div className="admin-chart">
              {financials.monthlyBreakdown?.map((m: any) => {
                const maxRev = Math.max(
                  ...financials.monthlyBreakdown.map((x: any) => x.revenue),
                  1
                );
                return (
                  <div key={m.month} className="admin-chart-row">
                    <span className="admin-chart-label">{m.label}</span>
                    <div className="admin-chart-bar-bg">
                      <div
                        className="admin-chart-bar"
                        style={{
                          width: `${(m.revenue / maxRev) * 100}%`,
                          background: 'var(--accent-green)',
                        }}
                      />
                    </div>
                    <span className="admin-chart-value">${m.revenue}</span>
                  </div>
                );
              })}
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Suscriptores por Tipo</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {financials.subscribers?.owner || 0}
                </div>
                <div className="stat-label">Owner</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
                  {financials.subscribers?.active || 0}
                </div>
                <div className="stat-label">PRO Pagado</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                  {financials.subscribers?.trial || 0}
                </div>
                <div className="stat-label">Trial</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
                  {(financials.subscribers?.cancelled || 0) +
                    (financials.subscribers?.expired || 0)}
                </div>
                <div className="stat-label">Inactivos</div>
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>Historial de Pagos</h3>
            {payments.length === 0 ? (
              <div className="msg-empty">
                <p>No hay pagos registrados aún</p>
              </div>
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
                        <td>
                          <span
                            className={`admin-badge ${p.provider === 'paypal' ? 'info' : 'success'}`}
                          >
                            {p.provider}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {p.transactionId || '—'}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ${p.amount} {p.currency}
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${p.status === 'completed' ? 'success' : 'warning'}`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div
              className="card"
              style={{
                padding: 16,
                marginTop: 20,
                background: 'var(--bg-secondary)',
                borderLeft: '4px solid var(--accent-blue)',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Nota:</strong> Los impuestos y comisiones son estimaciones. Consulta con tu
                contador para datos exactos. Los recibos de pago se envían automáticamente por email
                a cada cliente después de cada transacción.
              </p>
            </div>
          </div>
        )}

        {/* ─── Refund Requests ─── */}
        {tab === 'refunds' && (
          <div className="admin-refunds">
            {refundUpdateMsg && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--accent)',
                }}
              >
                {refundUpdateMsg}
              </div>
            )}
            {refundRequests.length === 0 ? (
              <div className="msg-empty">
                <p>No hay solicitudes de reembolso</p>
              </div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Motivo</th>
                      <th>Detalle</th>
                      <th>Ref. Pago</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundRequests.map((r: any) => {
                      const REASON_LABELS: Record<string, string> = {
                        duplicate_charge: 'Cargo duplicado',
                        unauthorized: 'No autorizado',
                        technical_error: 'Error técnico',
                        service_outage: 'Interrupción servicio',
                        guarantee_7d: 'Garantía 7 días',
                        eu_withdrawal: 'Desistimiento UE',
                        chile_retracto: 'Retracto Chile',
                        tutor_noshow: 'Tutor no se presentó',
                        other: 'Otro',
                      };
                      return (
                        <tr key={r.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                            {new Date(r.createdAt).toLocaleDateString('es')}
                          </td>
                          <td>
                            <div style={{ fontSize: 13 }}>
                              {r.user?.firstName} {r.user?.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {r.user?.email}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {r.user?.subscriptionTier} / {r.user?.subscriptionStatus}
                            </div>
                          </td>
                          <td>{REASON_LABELS[r.reason] || r.reason}</td>
                          <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--text-muted)' }}>
                            {r.reasonDetail || '—'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {r.paymentRef || '—'}
                          </td>
                          <td>
                            <span
                              className={`admin-badge ${
                                r.status === 'pending'
                                  ? 'warning'
                                  : r.status === 'approved'
                                    ? 'success'
                                    : r.status === 'processed'
                                      ? 'info'
                                      : 'danger'
                              }`}
                            >
                              {r.status === 'pending'
                                ? 'Pendiente'
                                : r.status === 'approved'
                                  ? 'Aprobado'
                                  : r.status === 'processed'
                                    ? 'Procesado'
                                    : 'Rechazado'}
                            </span>
                          </td>
                          <td>
                            {r.status === 'pending' && (
                              <div className="admin-action-group">
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => handleRefundUpdate(r.id, 'approved')}
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="btn btn-danger btn-xs"
                                  onClick={() => handleRefundUpdate(r.id, 'rejected')}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {r.status === 'approved' && (
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleRefundUpdate(r.id, 'processed')}
                              >
                                Marcar procesado
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Correo → Contabilidad ─── */}
        {tab === 'correo' && (
          <div>
            {/* Header + poll button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>📬 Documentos recibidos por correo</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Facturas, boletas y comprobantes enviados a <strong>ceo@conniku.com</strong>. El
                  sistema revisa automáticamente cada 30 min.
                  <strong> Nunca crea asientos automáticamente</strong> — toda acción requiere
                  aprobación.
                </p>
              </div>
              <button
                onClick={handleEmailPoll}
                disabled={emailPolling}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: emailPolling ? 'wait' : 'pointer',
                  opacity: emailPolling ? 0.7 : 1,
                }}
              >
                {emailPolling ? '⟳ Revisando...' : '⟳ Revisar ahora'}
              </button>
            </div>

            {/* Poll result message */}
            {emailPollMsg && (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#22c55e18',
                  border: '1px solid #22c55e44',
                  fontSize: 13,
                  color: '#22c55e',
                  marginBottom: 12,
                }}
              >
                {emailPollMsg}
              </div>
            )}

            {/* Stats pills */}
            {emailDocsStats && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  {
                    key: '',
                    label: 'Todos',
                    count: emailDocsStats.pending + emailDocsStats.reviewed,
                    color: 'var(--accent)',
                  },
                  {
                    key: 'pending',
                    label: 'Pendientes',
                    count: emailDocsStats.pending,
                    color: '#f59e0b',
                  },
                  {
                    key: 'reviewed',
                    label: 'Revisados',
                    count: emailDocsStats.reviewed,
                    color: '#3b82f6',
                  },
                  {
                    key: 'dismissed',
                    label: 'Descartados',
                    count: emailDocsStats.dismissed,
                    color: '#6b7280',
                  },
                  {
                    key: 'entry_created',
                    label: 'Con asiento',
                    count: emailDocsStats.entry_created,
                    color: '#22c55e',
                  },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setEmailDocFilter(s.key);
                      setTimeout(loadEmailDocs, 0);
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 16,
                      border: `1.5px solid ${emailDocFilter === s.key ? s.color : 'var(--border)'}`,
                      background: emailDocFilter === s.key ? s.color + '22' : 'transparent',
                      color: emailDocFilter === s.key ? s.color : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label} ({s.count})
                  </button>
                ))}
              </div>
            )}

            {/* Document list */}
            {emailDocs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>No hay documentos en esta categoría.</p>
                <p style={{ fontSize: 12 }}>
                  El sistema revisará el correo automáticamente en los próximos 30 min, o puedes
                  hacerlo manualmente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {emailDocs.map((doc: any) => {
                  const statusMeta: Record<string, { label: string; color: string }> = {
                    pending: { label: '⏳ Pendiente', color: '#f59e0b' },
                    reviewed: { label: '👀 Revisado', color: '#3b82f6' },
                    dismissed: { label: '🗑 Descartado', color: '#6b7280' },
                    entry_created: { label: '✓ Con asiento', color: '#22c55e' },
                  };
                  const docTypeLabel: Record<string, string> = {
                    factura: 'Factura',
                    factura_exenta: 'Factura Exenta',
                    boleta: 'Boleta',
                    boleta_honorarios: 'Boleta Honorarios',
                    nota_credito: 'Nota de Crédito',
                    nota_debito: 'Nota de Débito',
                    invoice: 'Invoice',
                    recibo: 'Recibo',
                  };
                  const sm = statusMeta[doc.status] || { label: doc.status, color: '#6b7280' };
                  const fmtClp = (n: number) => (n ? `$${n.toLocaleString('es-CL')}` : '');
                  return (
                    <div key={doc.id} className="card" style={{ padding: 16 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 14,
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                              {doc.filename || 'Documento'}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                background: sm.color + '22',
                                color: sm.color,
                              }}
                            >
                              {sm.label}
                            </span>
                            {doc.extracted_doc_type && (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  fontSize: 11,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {docTypeLabel[doc.extracted_doc_type] || doc.extracted_doc_type}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              display: 'flex',
                              gap: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>📨 {doc.email_from}</span>
                            {doc.email_date && (
                              <span>📅 {new Date(doc.email_date).toLocaleDateString('es-CL')}</span>
                            )}
                          </div>
                          {doc.email_subject && (
                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                                marginTop: 4,
                                fontStyle: 'italic',
                              }}
                            >
                              "{doc.email_subject}"
                            </div>
                          )}
                          {/* Extracted data pills */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            {doc.extracted_vendor && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                🏢 {doc.extracted_vendor}
                              </span>
                            )}
                            {doc.extracted_amount && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: '#22c55e18',
                                  color: '#22c55e',
                                  fontWeight: 700,
                                }}
                              >
                                {fmtClp(doc.extracted_amount)} {doc.extracted_currency}
                              </span>
                            )}
                            {doc.extracted_doc_number && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                N° {doc.extracted_doc_number}
                              </span>
                            )}
                            {doc.extracted_date && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                📅 {doc.extracted_date}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            ⚠️ Datos extraídos automáticamente — verificar antes de registrar
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            minWidth: 140,
                          }}
                        >
                          {doc.has_file && (
                            <button
                              onClick={() => handleDownloadEmailDoc(doc.id, doc.filename)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 7,
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: 12,
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              ⬇ Descargar
                            </button>
                          )}
                          {doc.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReviewEmailDoc(doc.id, 'reviewed')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 7,
                                  border: 'none',
                                  background: '#3b82f6',
                                  color: '#fff',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                👀 Marcar revisado
                              </button>
                              <button
                                onClick={() =>
                                  handleReviewEmailDoc(
                                    doc.id,
                                    'entry_created',
                                    'Asiento creado manualmente'
                                  )
                                }
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 7,
                                  border: 'none',
                                  background: '#22c55e',
                                  color: '#fff',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                ✓ Asiento creado
                              </button>
                              <button
                                onClick={() => handleReviewEmailDoc(doc.id, 'dismissed')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 7,
                                  border: '1px solid #ef4444',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Descartar
                              </button>
                            </>
                          )}
                          {doc.status === 'reviewed' && (
                            <button
                              onClick={() => handleReviewEmailDoc(doc.id, 'entry_created')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 7,
                                border: 'none',
                                background: '#22c55e',
                                color: '#fff',
                                fontSize: 12,
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              ✓ Asiento creado
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Reports ─── */}
        {tab === 'reports' && (
          <div className="admin-reports">
            <div className="admin-toolbar">
              <select
                className="form-input"
                value={reportFilter}
                onChange={(e) => {
                  setReportFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Todos los reportes</option>
                <option value="pending">Pendientes</option>
                <option value="reviewed">Revisados</option>
                <option value="dismissed">Descartados</option>
              </select>
            </div>

            {reports.length === 0 ? (
              <div className="msg-empty">
                <p>
                  No hay reportes {reportFilter !== 'all' ? `con estado "${reportFilter}"` : ''}
                </p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="admin-report-card card">
                  <div className="admin-report-header">
                    <div className="admin-report-users">
                      <div>
                        <span className="admin-report-label">Reportado por:</span>
                        <strong> @{r.reporter?.username}</strong> ({r.reporter?.firstName}{' '}
                        {r.reporter?.lastName})
                      </div>
                      <span>→</span>
                      <div>
                        <span className="admin-report-label">Usuario reportado:</span>
                        <strong> @{r.reported?.username}</strong> ({r.reported?.firstName}{' '}
                        {r.reported?.lastName})
                      </div>
                    </div>
                    <span
                      className={`admin-badge ${r.status === 'pending' ? 'warning' : r.status === 'reviewed' ? 'info' : 'success'}`}
                    >
                      {r.status === 'pending'
                        ? 'Pendiente'
                        : r.status === 'reviewed'
                          ? 'Revisado'
                          : 'Descartado'}
                    </span>
                  </div>
                  <div className="admin-report-reason">
                    <strong>Motivo:</strong> {r.reason}
                  </div>
                  <div className="admin-report-footer">
                    <small>{new Date(r.createdAt).toLocaleString()}</small>
                    {r.status === 'pending' && (
                      <div className="admin-action-group">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleReviewReport(r.id)}
                        >
                          Marcar Revisado
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleDismissReport(r.id)}
                        >
                          Descartar
                        </button>
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => {
                            setBanningUserId(r.reported?.id);
                          }}
                        >
                          Banear Usuario
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Reported Messages ─── */}
        {tab === 'flagged' && (
          <div className="admin-flagged">
            {flagged.length === 0 ? (
              <div className="msg-empty">
                <p>No hay mensajes reportados</p>
              </div>
            ) : (
              flagged.map((msg) => (
                <div key={msg.id} className="admin-flagged-item card">
                  <div className="admin-flagged-header">
                    <span>
                      <strong>@{msg.sender?.username}</strong> ({msg.sender?.email})
                    </span>
                    <span className="admin-badge warning">{msg.flagReason}</span>
                  </div>
                  <p className="admin-flagged-content">{msg.content}</p>
                  <div className="admin-flagged-actions">
                    <small>{new Date(msg.createdAt).toLocaleString()}</small>
                    <div className="admin-action-group">
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDeleteMsg(msg.id)}
                      >
                        Eliminar Mensaje
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => setBanningUserId(msg.sender?.id)}
                      >
                        Banear Autor
                      </button>
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
              <div className="msg-empty">
                <p>No hay bloqueos activos entre usuarios</p>
              </div>
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
                    {blocks.map((b) => (
                      <tr key={b.id}>
                        <td>
                          @{b.blocker?.username} ({b.blocker?.firstName})
                        </td>
                        <td>
                          @{b.blocked?.username} ({b.blocked?.firstName})
                        </td>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleForceUnblock(b.id)}
                          >
                            Forzar Desbloqueo
                          </button>
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
              <div className="msg-empty">
                <p>No hay registros de moderación</p>
              </div>
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
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span
                            className={`admin-badge ${
                              log.action === 'ban'
                                ? 'danger'
                                : log.action === 'unban'
                                  ? 'success'
                                  : log.action === 'make_admin'
                                    ? 'info'
                                    : log.action === 'remove_admin'
                                      ? 'warning'
                                      : 'warning'
                            }`}
                          >
                            {log.action === 'ban'
                              ? 'Baneo'
                              : log.action === 'unban'
                                ? 'Desbaneo'
                                : log.action === 'make_admin'
                                  ? 'Hecho Admin'
                                  : log.action === 'remove_admin'
                                    ? 'Quitado Admin'
                                    : log.action === 'delete_message'
                                      ? 'Msg Eliminado'
                                      : log.action}
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
            <div className="modal admin-user-detail" onClick={(e) => e.stopPropagation()}>
              <div className="admin-detail-header">
                <div className="admin-detail-avatar">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" />
                  ) : (
                    <span>
                      {(selectedUser.firstName?.[0] || '').toUpperCase()}
                      {(selectedUser.lastName?.[0] || '').toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p>
                    @{selectedUser.username} #{String(selectedUser.userNumber).padStart(4, '0')}
                  </p>
                </div>
              </div>
              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <label>Email</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Universidad</label>
                  <span>{selectedUser.university || '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Carrera</label>
                  <span>{selectedUser.career || '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Semestre</label>
                  <span>{selectedUser.semester || '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Género</label>
                  <span>{selectedUser.gender || '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Teléfono</label>
                  <span>{selectedUser.phone || '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Fecha Nacimiento</label>
                  <span>{selectedUser.birthDate || '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Idioma</label>
                  <span>{selectedUser.language}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Proveedor</label>
                  <span>{selectedUser.provider}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Email Verificado</label>
                  <span>
                    {selectedUser.emailVerified ? (
                      <>{CheckCircle({ size: 14 })} Sí</>
                    ) : (
                      <>{XCircle({ size: 14 })} No</>
                    )}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <label>Estado</label>
                  <span>
                    {selectedUser.isBanned ? (
                      <>{XCircle({ size: 14 })} Baneado</>
                    ) : (
                      <>{CheckCircle({ size: 14 })} Activo</>
                    )}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <label>Admin</label>
                  <span>
                    {selectedUser.isAdmin ? (
                      <>{CheckCircle({ size: 14 })} Sí</>
                    ) : (
                      <>{XCircle({ size: 14 })} No</>
                    )}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <label>Suscripción</label>
                  <span>{selectedUser.subscriptionStatus}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Tema</label>
                  <span>{selectedUser.theme}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Mensajes Enviados</label>
                  <span>{selectedUser.messageCount ?? '—'}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Registrado</label>
                  <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                </div>
                <div className="admin-detail-item">
                  <label>Último Login</label>
                  <span>{new Date(selectedUser.lastLogin).toLocaleString()}</span>
                </div>
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
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setSelectedUser(null);
                      setBanningUserId(selectedUser.id);
                    }}
                  >
                    Banear
                  </button>
                )}
                {selectedUser.isBanned && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      handleUnban(selectedUser.id);
                      setSelectedUser(null);
                    }}
                  >
                    Desbanear
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Ban Modal ─── */}
        {banningUserId && (
          <div className="modal-overlay" onClick={() => setBanningUserId(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Banear Usuario</h3>
              <div className="auth-field">
                <label>Razón del baneo</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Escribe la razón del baneo..."
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setBanningUserId(null)}>
                  Cancelar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleBan(banningUserId)}>
                  Confirmar Baneo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
