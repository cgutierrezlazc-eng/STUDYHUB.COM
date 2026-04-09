import React, { useState, useMemo } from 'react'
import { Target, Plus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, btnSmall, thStyle, tdStyle, inputStyle, selectStyle, fmt } from '../shared/styles'

// ─── Budget categories aligned with expense categories ──────────
interface BudgetLine {
  id: string
  categoria: string
  presupuesto: number
  ejecutado: number
  comprometido: number
}

interface BudgetPeriod {
  month: number
  year: number
  lines: BudgetLine[]
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function PresupuestosTab() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<'presupuesto' | 'varianzas' | 'historico'>('presupuesto')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [budget, setBudget] = useState<BudgetLine[]>([])
  const [monthlyHistory] = useState<{ month: string; presupuesto: number; ejecutado: number }[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Totals
  const totals = useMemo(() => {
    return budget.reduce((acc, b) => ({
      presupuesto: acc.presupuesto + b.presupuesto,
      ejecutado: acc.ejecutado + b.ejecutado,
      comprometido: acc.comprometido + b.comprometido,
    }), { presupuesto: 0, ejecutado: 0, comprometido: 0 })
  }, [budget])

  const disponible = totals.presupuesto - totals.ejecutado - totals.comprometido
  const ejecucionPct = totals.presupuesto > 0 ? (totals.ejecutado / totals.presupuesto * 100) : 0

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={26} /> Presupuestos
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
            Control presupuestario por centro de costo y análisis de varianzas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)} style={{ ...selectStyle, width: 140 }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)} style={{ ...selectStyle, width: 100 }}>
            {[2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Presupuesto Total', value: `$${fmt(totals.presupuesto)}`, color: 'var(--accent)' },
          { label: 'Ejecutado', value: `$${fmt(totals.ejecutado)}`, sub: `${ejecucionPct.toFixed(1)}%`, color: '#10b981' },
          { label: 'Comprometido', value: `$${fmt(totals.comprometido)}`, color: '#f59e0b' },
          { label: 'Disponible', value: `$${fmt(disponible)}`, color: disponible >= 0 ? '#3b82f6' : '#ef4444' },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '16px 20px', borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
            {card.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Execution bar */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 20,
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>Ejecución presupuestaria</span>
          <span>{ejecucionPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
          <div style={{
            width: `${Math.min(ejecucionPct, 100)}%`, height: '100%',
            background: ejecucionPct > 90 ? '#ef4444' : ejecucionPct > 75 ? '#f59e0b' : '#10b981',
            borderRadius: 5, transition: 'width 0.5s ease',
          }} />
          <div style={{
            width: `${Math.min(totals.comprometido / totals.presupuesto * 100, 100 - ejecucionPct)}%`,
            height: '100%', background: 'rgba(245,158,11,0.4)',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} /> Ejecutado
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(245,158,11,0.4)' }} /> Comprometido
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--border)' }} /> Disponible
          </span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {[
          { id: 'presupuesto' as const, label: 'Presupuesto Mensual' },
          { id: 'varianzas' as const, label: 'Análisis de Varianzas' },
          { id: 'historico' as const, label: 'Histórico' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeView === tab.id ? 'var(--accent)' : 'transparent',
            color: activeView === tab.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Presupuesto Mensual ─── */}
      {activeView === 'presupuesto' && (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ ...thStyle, textAlign: 'left', minWidth: 200 }}>Categoría</th>
                <th style={thStyle}>Presupuesto</th>
                <th style={thStyle}>Ejecutado</th>
                <th style={thStyle}>Comprometido</th>
                <th style={thStyle}>Disponible</th>
                <th style={{ ...thStyle, minWidth: 120 }}>% Ejecución</th>
                <th style={thStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {budget.map(b => {
                const disp = b.presupuesto - b.ejecutado - b.comprometido
                const pct = b.presupuesto > 0 ? (b.ejecutado / b.presupuesto * 100) : 0
                const isOver = disp < 0
                const isWarning = pct > 80 && !isOver
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{b.categoria}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {editingId === b.id ? (
                        <input
                          type="number" value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => {
                            setBudget(budget.map(x => x.id === b.id ? { ...x, presupuesto: +editValue } : x))
                            setEditingId(null)
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          style={{ ...inputStyle, width: 100, textAlign: 'right' }}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingId(b.id); setEditValue(b.presupuesto.toString()) }}
                          style={{ cursor: 'pointer' }}
                          title="Click para editar"
                        >
                          ${fmt(b.presupuesto)}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(b.ejecutado)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: b.comprometido > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                      ${fmt(b.comprometido)}
                    </td>
                    <td style={{
                      ...tdStyle, textAlign: 'right', fontWeight: 700,
                      color: isOver ? '#ef4444' : '#10b981',
                    }}>
                      ${fmt(disp)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3,
                            background: isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {isOver
                        ? <AlertTriangle size={14} color="#ef4444" />
                        : isWarning
                          ? <AlertTriangle size={14} color="#f59e0b" />
                          : <CheckCircle size={14} color="#10b981" />
                      }
                    </td>
                  </tr>
                )
              })}
              {/* Totals */}
              <tr style={{ background: 'var(--bg-secondary)', borderTop: '3px solid var(--border)' }}>
                <td style={{ ...tdStyle, fontWeight: 800, fontSize: 13 }}>TOTAL</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(totals.presupuesto)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(totals.ejecutado)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>${fmt(totals.comprometido)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: disponible >= 0 ? '#10b981' : '#ef4444' }}>
                  ${fmt(disponible)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{ejecucionPct.toFixed(1)}%</td>
                <td style={tdStyle}></td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Haz clic en el monto presupuestado para editarlo directamente.
          </div>
        </div>
      )}

      {/* ─── Análisis de Varianzas ─── */}
      {activeView === 'varianzas' && (
        <div>
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Categoría</th>
                  <th style={thStyle}>Presupuesto</th>
                  <th style={thStyle}>Real</th>
                  <th style={thStyle}>Varianza $</th>
                  <th style={thStyle}>Varianza %</th>
                  <th style={thStyle}>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {budget.map(b => {
                  const varianza = b.presupuesto - b.ejecutado
                  const varianzaPct = b.presupuesto > 0 ? (varianza / b.presupuesto * 100) : 0
                  const favorable = varianza >= 0
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{b.categoria}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(b.presupuesto)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(b.ejecutado)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: favorable ? '#10b981' : '#ef4444' }}>
                        {favorable ? '+' : ''} ${fmt(varianza)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: favorable ? '#10b981' : '#ef4444' }}>
                        {favorable ? '+' : ''}{varianzaPct.toFixed(1)}%
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {favorable
                          ? <TrendingDown size={14} color="#10b981" />
                          : <TrendingUp size={14} color="#ef4444" />
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: 12, color: 'var(--text-secondary)',
          }}>
            <strong>Varianza favorable:</strong> El gasto real es menor que el presupuesto (ahorro).
            <br />
            <strong>Varianza desfavorable:</strong> El gasto real excede el presupuesto (sobrecosto).
          </div>
        </div>
      )}

      {/* ─── Histórico ─── */}
      {activeView === 'historico' && (
        <div>
          <div style={{
            padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} /> Presupuesto vs. Ejecución — {selectedYear}
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200 }}>
              {monthlyHistory.map((m, i) => {
                const maxVal = Math.max(...monthlyHistory.map(h => Math.max(h.presupuesto, h.ejecutado)))
                const presH = (m.presupuesto / maxVal) * 180
                const ejecH = (m.ejecutado / maxVal) * 180
                const pct = (m.ejecutado / m.presupuesto * 100).toFixed(0)
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 180 }}>
                      <div style={{
                        width: 24, height: presH, borderRadius: '4px 4px 0 0',
                        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                      }} title={`Presupuesto: $${fmt(m.presupuesto)}`} />
                      <div style={{
                        width: 24, height: ejecH, borderRadius: '4px 4px 0 0',
                        background: +pct > 95 ? '#ef4444' : '#10b981',
                      }} title={`Ejecutado: $${fmt(m.ejecutado)}`} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6 }}>{m.month}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }} /> Presupuesto
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981' }} /> Ejecutado
              </span>
            </div>
          </div>

          {/* Monthly summary table */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Mes</th>
                  <th style={thStyle}>Presupuesto</th>
                  <th style={thStyle}>Ejecutado</th>
                  <th style={thStyle}>Varianza</th>
                  <th style={thStyle}>% Ejecución</th>
                </tr>
              </thead>
              <tbody>
                {monthlyHistory.map((m, i) => {
                  const varianza = m.presupuesto - m.ejecutado
                  const pct = (m.ejecutado / m.presupuesto * 100)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{m.month} {selectedYear}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(m.presupuesto)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(m.ejecutado)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: varianza >= 0 ? '#10b981' : '#ef4444' }}>
                        {varianza >= 0 ? '+' : ''}${fmt(varianza)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{pct.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
