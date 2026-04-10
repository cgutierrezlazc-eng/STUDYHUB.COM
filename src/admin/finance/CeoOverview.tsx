import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'

interface Props {
  onNavigate: (path: string) => void
}

function KPI({ label, value, sub, color, trend }: {
  label: string; value: string | number; sub?: string; color?: string; trend?: number
}) {
  const trendColor = trend === undefined ? undefined : trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#94a3b8'
  const trendArrow = trend === undefined ? '' : trend > 0 ? '↑' : trend < 0 ? '↓' : '→'
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
        {trend !== undefined && (
          <span style={{ fontSize: 13, fontWeight: 700, color: trendColor, marginLeft: 8 }}>
            {trendArrow} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const QUICK_LINKS = [
  { label: 'Personas', icon: '👥', route: '/admin-panel/hr/personal' },
  { label: 'Contratos', icon: '📄', route: '/admin-panel/hr/contratos' },
  { label: 'Asistencia', icon: '🕐', route: '/admin-panel/hr/asistencia' },
  { label: 'Liquidaciones', icon: '💰', route: '/admin-panel/payroll/liquidaciones' },
  { label: 'Finiquitos', icon: '🤝', route: '/admin-panel/payroll/finiquitos' },
  { label: 'Panel Financiero', icon: '📊', route: '/admin-panel/finance/financiero' },
  { label: 'Analytics', icon: '📈', route: '/admin-panel/finance/analytics' },
  { label: 'Legal', icon: '⚖️', route: '/admin-panel/legal/compliance' },
  { label: 'Biblioteca', icon: '📚', route: '/admin-panel/tools/biblioteca' },
  { label: 'Email CEO', icon: '✉️', route: '/admin-panel/tools/email-ceo' },
  { label: 'Workflows IA', icon: '🤖', route: '/admin-panel/tools/ai-workflows' },
  { label: 'Anti-Fraude', icon: '🛡️', route: '/admin-panel/legal/fraude' },
]

export default function CeoOverview({ onNavigate }: Props) {
  const { user } = useAuth()
  const [report, setReport] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'acciones'>('overview')

  useEffect(() => {
    if (user?.role !== 'owner') return
    Promise.all([
      api.getCeoWeeklyReport().catch(() => null),
      api.getEmployees().catch(() => []),
    ]).then(([rpt, emps]) => {
      setReport(rpt)
      setEmployees(Array.isArray(emps) ? emps : [])
    }).finally(() => setLoading(false))
  }, [])

  const fmtClp = (n: number) => `$${(n || 0).toLocaleString('es-CL')} CLP`
  const fmtUsd = (n: number) => `US$${(n || 0).toFixed(2)}`

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 90 }} />)}
        </div>
      </div>
    )
  }

  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Acceso restringido al CEO.
      </div>
    )
  }

  const r = report || {}
  const rev = r.revenue || {}
  const usr = r.users || {}
  const eng = r.engagement || {}
  const mod = r.moderation || {}
  const health = r.health || {}
  const activeEmps = employees.filter(e => e.status === 'activo' || !e.status)
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto' }}>

      {/* ─── Header ─── */}
      <div style={{
        padding: '20px 28px', borderRadius: 16, marginBottom: 28,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Panel Ejecutivo</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            Buenos días, {user?.firstName || 'CEO'} 👋
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.75 }}>{today}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {r.period && <div style={{ fontSize: 12, opacity: 0.7 }}>Período: {r.period}</div>}
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            {r.generatedAt ? `Actualizado: ${new Date(r.generatedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Sin datos de API'}
          </div>
          {mod.newReports > 0 && (
            <div style={{ marginTop: 8, padding: '4px 12px', background: 'rgba(239,68,68,0.2)', borderRadius: 20, fontSize: 12, color: '#fca5a5', fontWeight: 700, display: 'inline-block' }}>
              ⚠️ {mod.newReports} reporte{mod.newReports > 1 ? 's' : ''} pendiente{mod.newReports > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {(['overview', 'acciones'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            {t === 'overview' ? '📊 KPIs Semanales' : '⚡ Acciones Rápidas'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* ─── Revenue ─── */}
          <Section title="Ingresos — Semana">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <KPI label="Ingreso Bruto" value={fmtUsd(rev.grossUsd)} sub={fmtClp(rev.grossClp)} color="#22c55e" trend={rev.growthPercent} />
              <KPI label="Neto tras Stripe" value={fmtClp(rev.netAfterStripeClp)} sub="IVA incluido" color="#16a34a" />
              <KPI label="IVA (19%)" value={fmtClp(rev.ivaClp)} sub="Declarable en F29" color="#f59e0b" />
              <KPI label="Ganancia Neta" value={fmtClp(rev.gananciaNetaClp)} sub="Libre de impuestos" color="#3b82f6" />
              <KPI label="Pagos Esta Semana" value={r.subscriptions?.newPayments || 0} sub="Transacciones completadas" />
            </div>
          </Section>

          {/* ─── Usuarios ─── */}
          <Section title="Usuarios">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <KPI label="Total Usuarios" value={(usr.total || 0).toLocaleString('es-CL')} sub="Registros acumulados" />
              <KPI label="Nuevos Esta Semana" value={usr.newThisWeek || 0} sub={`Semana anterior: ${usr.prevWeekNew || 0}`} color="#3b82f6" trend={usr.growthPercent} />
              <KPI label="Activos Esta Semana" value={usr.activeThisWeek || 0} sub={`Tasa: ${usr.activeRate || 0}%`} color="#8b5cf6" />
              <KPI label="Referidos Esta Semana" value={usr.referralsThisWeek || 0} sub="Vía código de referido" color="#f59e0b" />
            </div>
          </Section>

          {/* ─── Engagement ─── */}
          <Section title="Engagement">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <KPI label="Horas de Estudio" value={`${eng.studyHours || 0}h`} sub={`${health.studyHoursPerUser || 0}h/usuario activo`} color="#22c55e" />
              <KPI label="Quizzes Realizados" value={eng.quizzesTaken || 0} sub="Esta semana" color="#3b82f6" />
              <KPI label="Posts en Feed" value={eng.wallPosts || 0} sub={`${health.postsPerUser || 0} posts/usuario`} color="#f59e0b" />
              <KPI label="Posts Comunidades" value={eng.communityPosts || 0} sub="En grupos y comunidades" />
              <KPI label="Mensajes" value={eng.messages || 0} sub="Directos + grupales" color="#8b5cf6" />
              <KPI label="Recompensas Otorgadas" value={r.subscriptions?.rewardsGranted || 0} sub="Logros + bonos EXP" color="#f59e0b" />
            </div>
          </Section>

          {/* ─── RRHH ─── */}
          <Section title="Recursos Humanos">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <KPI label="Empleados Activos" value={activeEmps.length} sub="Dotación registrada" color="#22c55e" />
              <KPI label="Total en Nómina" value={employees.length} sub="Incluye todos los estados" />
            </div>
          </Section>

          {/* ─── Health Indicators ─── */}
          <Section title="Indicadores de Salud">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>DAU Aproximado</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{health.dau_wau || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Usuarios activos por día (estimado)</div>
                <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: '#3b82f6', width: `${Math.min((health.dau_wau || 0) / Math.max(usr.total || 1, 1) * 100 * 7, 100)}%` }} />
                </div>
              </div>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Reportes de Moderación</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: mod.newReports > 0 ? '#ef4444' : '#22c55e' }}>
                  {mod.newReports > 0 ? `⚠️ ${mod.newReports}` : '✓ 0'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {mod.newReports > 0 ? 'Pendientes de revisión' : 'Sin alertas pendientes'}
                </div>
                {mod.newReports > 0 && (
                  <button
                    onClick={() => onNavigate('/admin-panel/legal/fraude')}
                    style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Ver reportes
                  </button>
                )}
              </div>
            </div>
          </Section>
        </>
      )}

      {tab === 'acciones' && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Acceso directo a todos los módulos del panel de administración.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {QUICK_LINKS.map(link => (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                style={{
                  padding: '18px 14px', borderRadius: 14, border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span style={{ fontSize: 28 }}>{link.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
