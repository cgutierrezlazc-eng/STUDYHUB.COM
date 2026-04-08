import React, { useState } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { ADMIN_MODULES, CATEGORY_LABELS } from './adminModules'
import { useWindowManager } from './useWindowManager'
import { Search, ExternalLink, Grid, LayoutGrid, ChevronRight } from 'lucide-react'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORY_ORDER = ['hr', 'payroll', 'finance', 'legal', 'tools']

export default function AdminPanel({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const { openModule, isOpen } = useWindowManager()
  const [search, setSearch] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Acceso Restringido</h2>
        <p>Solo CEO y administradores pueden acceder al Panel de Administración.</p>
      </div>
    )
  }

  const filtered = search
    ? ADMIN_MODULES.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    : ADMIN_MODULES

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
          <LayoutGrid size={28} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Panel de Administración
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Conniku SpA — Gestión integral de personas, remuneraciones, finanzas y compliance.
          Cada módulo se abre en una ventana independiente.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 28, maxWidth: 480 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-muted)' }} />
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
            <ChevronRight
              size={18}
              style={{
                color: 'var(--accent)',
                transition: 'transform 0.2s',
                transform: expandedCat === cat.key || !expandedCat ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            />
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
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{mod.icon}</span>

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
                      <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
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
