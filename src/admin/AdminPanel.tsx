import React, { useState } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { ADMIN_MODULES, CATEGORY_LABELS } from './adminModules'
import { useWindowManager } from './useWindowManager'
import { getEmployeePermissions } from './shared/seedEmployees'
interface Props {
  onNavigate: (path: string) => void
}

/* ─── Duotone SVG Icons for Admin Panel ─── */
const sw = 1.75
const DI = ({ c, children }: { c: string; children: React.ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

const ICON_MAP: Record<string, (c: string) => React.ReactNode> = {
  'users': (c) => <DI c={c}><circle cx="9" cy="7" r="4" fill={`${c}20`}/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></DI>,
  'clipboard-list': (c) => <DI c={c}><rect x="5" y="2" width="14" height="20" rx="2" fill={`${c}20`}/><path d="M9 2h6"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/></DI>,
  'clock': (c) => <DI c={c}><circle cx="12" cy="12" r="10" fill={`${c}20`}/><polyline points="12 6 12 12 16 14"/></DI>,
  'calendar': (c) => <DI c={c}><rect x="3" y="4" width="18" height="18" rx="2" fill={`${c}20`}/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></DI>,
  'rocket': (c) => <DI c={c}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill={`${c}20`}/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></DI>,
  'folder-open': (c) => <DI c={c}><path d="M2 19V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" fill={`${c}20`}/><path d="M2 19l2.5-7h17l-2.5 7H2z" fill={`${c}15`}/></DI>,
  'star': (c) => <DI c={c}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={`${c}20`}/></DI>,
  'target': (c) => <DI c={c}><circle cx="12" cy="12" r="10" fill={`${c}15`}/><circle cx="12" cy="12" r="6" fill={`${c}20`}/><circle cx="12" cy="12" r="2"/></DI>,
  'book-open': (c) => <DI c={c}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill={`${c}20`}/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></DI>,
  'banknote': (c) => <DI c={c}><rect x="2" y="6" width="20" height="12" rx="2" fill={`${c}20`}/><circle cx="12" cy="12" r="3"/><path d="M2 10h2"/><path d="M20 10h2"/></DI>,
  'landmark': (c) => <DI c={c}><path d="M12 2L2 7h20L12 2z" fill={`${c}20`}/><rect x="4" y="10" width="3" height="8"/><rect x="10.5" y="10" width="3" height="8"/><rect x="17" y="10" width="3" height="8"/><path d="M2 20h20"/></DI>,
  'file-text': (c) => <DI c={c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={`${c}20`}/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></DI>,
  'bar-chart': (c) => <DI c={c}><rect x="3" y="12" width="4" height="9" rx="1" fill={`${c}20`}/><rect x="10" y="7" width="4" height="14" rx="1" fill={`${c}30`}/><rect x="17" y="3" width="4" height="18" rx="1" fill={`${c}20`}/></DI>,
  'file-check': (c) => <DI c={c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={`${c}20`}/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></DI>,
  'receipt': (c) => <DI c={c}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2-3 2z" fill={`${c}20`}/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/></DI>,
  'shield': (c) => <DI c={c}><path d="M12 2l8 4v6c0 5.25-3.5 9.5-8 11-4.5-1.5-8-5.75-8-11V6l8-4z" fill={`${c}20`}/></DI>,
  'trending-up': (c) => <DI c={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></DI>,
  'credit-card': (c) => <DI c={c}><rect x="1" y="4" width="22" height="16" rx="2" fill={`${c}20`}/><line x1="1" y1="10" x2="23" y2="10"/></DI>,
  'bar-chart-3': (c) => <DI c={c}><rect x="3" y="12" width="4" height="9" rx="1" fill={`${c}20`}/><rect x="10" y="7" width="4" height="14" rx="1" fill={`${c}30`}/><rect x="17" y="3" width="4" height="18" rx="1" fill={`${c}20`}/></DI>,
  'calculator': (c) => <DI c={c}><rect x="4" y="2" width="16" height="20" rx="2" fill={`${c}20`}/><rect x="7" y="5" width="10" height="4" rx="1"/><line x1="7" y1="13" x2="7" y2="13" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="13" x2="12" y2="13" strokeWidth="2.5" strokeLinecap="round"/><line x1="17" y1="13" x2="17" y2="13" strokeWidth="2.5" strokeLinecap="round"/><line x1="7" y1="17" x2="7" y2="17" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="17" strokeWidth="2.5" strokeLinecap="round"/><line x1="17" y1="17" x2="17" y2="17" strokeWidth="2.5" strokeLinecap="round"/></DI>,
  'pie-chart': (c) => <DI c={c}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" fill={`${c}20`}/><path d="M22 12A10 10 0 0 0 12 2v10z" fill={`${c}30`}/></DI>,
  'scale': (c) => <DI c={c}><path d="M12 3v19" /><path d="M5 8l7-5 7 5"/><path d="M3 14l2-6 2 6a3 3 0 0 1-4 0z" fill={`${c}20`}/><path d="M17 14l2-6 2 6a3 3 0 0 1-4 0z" fill={`${c}20`}/></DI>,
  'search': (c) => <DI c={c}><circle cx="11" cy="11" r="8" fill={`${c}20`}/><line x1="21" y1="21" x2="16.65" y2="16.65"/></DI>,
  'mail': (c) => <DI c={c}><rect x="2" y="4" width="20" height="16" rx="2" fill={`${c}20`}/><polyline points="22 4 12 13 2 4"/></DI>,
  'inbox': (c) => <DI c={c}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" fill={`${c}20`}/></DI>,
  'graduation-cap': (c) => <DI c={c}><path d="M2 10l10-5 10 5-10 5z" fill={`${c}20`}/><path d="M22 10v6"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></DI>,
  'sparkles': (c) => <DI c={c}><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" fill={`${c}20`}/></DI>,
  'bell': (c) => <DI c={c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={`${c}20`}/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></DI>,
}

/* Color per category */
const CAT_COLORS: Record<string, string> = {
  hr: '#8B5CF6',
  payroll: '#2563EB',
  finance: '#10B981',
  legal: '#F59E0B',
  tools: '#6366F1',
}

const CATEGORY_ORDER = ['hr', 'payroll', 'finance', 'legal', 'tools']

export default function AdminPanel({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const { openModule, isOpen } = useWindowManager()
  const [search, setSearch] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  if (!user || (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'employee')) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Acceso Restringido</h2>
        <p>Solo CEO, administradores y empleados autorizados pueden acceder al Panel de Administración.</p>
      </div>
    )
  }

  // For employees: filter modules based on their permissions
  const isEmployee = user.role === 'employee'
  const employeePerms = isEmployee ? getEmployeePermissions(user.id) : null

  const allModules = isEmployee
    ? ADMIN_MODULES.filter(m => {
        if (m.status === 'coming-soon') return false
        return employeePerms?.moduleAccess[m.id] ?? false
      })
    : ADMIN_MODULES

  const filtered = search
    ? allModules.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    : allModules

  const grouped = CATEGORY_ORDER.map(cat => ({
    key: cat,
    ...CATEGORY_LABELS[cat],
    modules: filtered.filter(m => m.category === cat),
  })).filter(g => g.modules.length > 0)

  const handleClick = (mod: typeof ADMIN_MODULES[0]) => {
    if (mod.status === 'coming-soon') return
    openModule(mod.id)
  }

  return (
    <div className="page-enter" style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" fill="rgba(37,99,235,0.15)"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1" fill="rgba(37,99,235,0.15)"/></svg>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            HR Manager & CEO
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Conniku SpA — Gestión integral de personas, remuneraciones, finanzas y compliance.
          Cada módulo se abre en una ventana independiente.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 28, maxWidth: 480 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: 11 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar módulo..."
          style={{
            width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Module Grid by Category */}
      {grouped.map(cat => (
        <div key={cat.key} style={{ marginBottom: 32 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}
            onClick={() => setExpandedCat(expandedCat === cat.key ? null : cat.key)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform 0.2s', transform: expandedCat === cat.key || !expandedCat ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {cat.label}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              — {cat.description}
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 10,
            }}>
              {cat.modules.filter(m => m.status === 'active').length} activos
            </span>
          </div>

          {(expandedCat === cat.key || !expandedCat) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {cat.modules.map(mod => {
                const open = isOpen(mod.id)
                const comingSoon = mod.status === 'coming-soon'

                return (
                  <div
                    key={mod.id}
                    onClick={() => handleClick(mod)}
                    style={{
                      background: comingSoon ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      border: open ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '16px 18px',
                      cursor: comingSoon ? 'default' : 'pointer',
                      opacity: comingSoon ? 0.55 : 1,
                      transition: 'all 0.2s',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                    onMouseEnter={e => {
                      if (!comingSoon) {
                        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLDivElement).style.transform = ''
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
                    }}
                  >
                    {/* Icon */}
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {ICON_MAP[mod.icon]
                        ? ICON_MAP[mod.icon](comingSoon ? 'var(--text-muted)' : (CAT_COLORS[mod.category] || 'var(--accent)'))
                        : ICON_MAP['search']('var(--text-muted)')
                      }
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {mod.label}
                        </span>
                        {mod.isNew && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: '#fff', background: 'var(--accent)',
                            padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
                          }}>
                            NUEVO
                          </span>
                        )}
                        {open && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, color: 'var(--accent)',
                            background: 'rgba(99,102,241,0.1)',
                            padding: '1px 6px', borderRadius: 4,
                          }}>
                            ABIERTO
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4,
                      }}>
                        {comingSoon ? 'Próximamente' : mod.description}
                      </p>
                    </div>

                    {/* Open indicator */}
                    {!comingSoon && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Footer info */}
      <div style={{
        marginTop: 20, padding: '14px 18px', background: 'var(--bg-tertiary)',
        borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <strong>Tip:</strong> Cada módulo se abre en una ventana independiente que puedes mover a cualquier monitor.
        Los módulos marcados como <span style={{ color: 'var(--accent)', fontWeight: 600 }}>NUEVO</span> están
        en desarrollo y se habilitarán próximamente.
      </div>
    </div>
  )
}
