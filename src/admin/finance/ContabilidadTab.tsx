import React, { useState, useMemo } from 'react'
import { BookOpen, Plus, Search, Download, ArrowUpRight, ArrowDownRight, Filter, CheckCircle } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, btnSmall, thStyle, tdStyle, inputStyle, selectStyle, fmt } from '../shared/styles'

// ─── Plan de Cuentas (simplificado para PYME/SpA) ────────────────
const PLAN_CUENTAS = [
  // Activos
  { code: '1.1.01', name: 'Caja', type: 'activo', group: 'Activo Circulante' },
  { code: '1.1.02', name: 'Banco Estado CTA CTE', type: 'activo', group: 'Activo Circulante' },
  { code: '1.1.03', name: 'Banco Chile CTA CTE', type: 'activo', group: 'Activo Circulante' },
  { code: '1.1.04', name: 'Clientes por Cobrar', type: 'activo', group: 'Activo Circulante' },
  { code: '1.1.05', name: 'IVA Crédito Fiscal', type: 'activo', group: 'Activo Circulante' },
  { code: '1.1.06', name: 'PPM por Recuperar', type: 'activo', group: 'Activo Circulante' },
  { code: '1.2.01', name: 'Equipos Computacionales', type: 'activo', group: 'Activo Fijo' },
  { code: '1.2.02', name: 'Depreciación Acum. Equipos', type: 'activo', group: 'Activo Fijo' },
  { code: '1.3.01', name: 'Licencias Software', type: 'activo', group: 'Activo Intangible' },
  // Pasivos
  { code: '2.1.01', name: 'Proveedores por Pagar', type: 'pasivo', group: 'Pasivo Circulante' },
  { code: '2.1.02', name: 'IVA Débito Fiscal', type: 'pasivo', group: 'Pasivo Circulante' },
  { code: '2.1.03', name: 'Retenciones por Pagar', type: 'pasivo', group: 'Pasivo Circulante' },
  { code: '2.1.04', name: 'Remuneraciones por Pagar', type: 'pasivo', group: 'Pasivo Circulante' },
  { code: '2.1.05', name: 'AFP por Pagar', type: 'pasivo', group: 'Pasivo Circulante' },
  { code: '2.1.06', name: 'Salud por Pagar', type: 'pasivo', group: 'Pasivo Circulante' },
  { code: '2.1.07', name: 'PPM por Pagar', type: 'pasivo', group: 'Pasivo Circulante' },
  // Patrimonio
  { code: '3.1.01', name: 'Capital Social', type: 'patrimonio', group: 'Patrimonio' },
  { code: '3.1.02', name: 'Resultado del Ejercicio', type: 'patrimonio', group: 'Patrimonio' },
  { code: '3.1.03', name: 'Resultados Acumulados', type: 'patrimonio', group: 'Patrimonio' },
  // Ingresos
  { code: '4.1.01', name: 'Ingresos por Suscripciones', type: 'ingreso', group: 'Ingresos Operacionales' },
  { code: '4.1.02', name: 'Ingresos por Servicios', type: 'ingreso', group: 'Ingresos Operacionales' },
  { code: '4.2.01', name: 'Otros Ingresos', type: 'ingreso', group: 'Ingresos No Operacionales' },
  // Gastos
  { code: '5.1.01', name: 'Remuneraciones', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.02', name: 'Leyes Sociales (AFP, Salud, AFC)', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.03', name: 'Hosting y Servidores', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.04', name: 'Licencias y Suscripciones', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.05', name: 'Marketing y Publicidad', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.06', name: 'Servicios Profesionales', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.07', name: 'Depreciación', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.1.08', name: 'Gastos Generales', type: 'gasto', group: 'Gastos Operacionales' },
  { code: '5.2.01', name: 'Gastos Financieros', type: 'gasto', group: 'Gastos No Operacionales' },
  { code: '5.2.02', name: 'Comisiones Bancarias', type: 'gasto', group: 'Gastos No Operacionales' },
]

interface Asiento {
  id: string
  fecha: string
  glosa: string
  numero: number
  lineas: { cuenta: string; debe: number; haber: number }[]
}

// Demo journal entries
const DEMO_ASIENTOS: Asiento[] = [
  {
    id: '1', fecha: '2026-04-01', glosa: 'Pago remuneraciones marzo 2026', numero: 1001,
    lineas: [
      { cuenta: '5.1.01', debe: 3550000, haber: 0 },
      { cuenta: '5.1.02', debe: 850000, haber: 0 },
      { cuenta: '2.1.04', debe: 0, haber: 2800000 },
      { cuenta: '2.1.05', debe: 0, haber: 420000 },
      { cuenta: '2.1.06', debe: 0, haber: 250000 },
      { cuenta: '2.1.03', debe: 0, haber: 930000 },
    ],
  },
  {
    id: '2', fecha: '2026-04-02', glosa: 'Ingreso suscripciones PRO — abril', numero: 1002,
    lineas: [
      { cuenta: '1.1.02', debe: 2380000, haber: 0 },
      { cuenta: '2.1.02', debe: 0, haber: 380000 },
      { cuenta: '4.1.01', debe: 0, haber: 2000000 },
    ],
  },
  {
    id: '3', fecha: '2026-04-05', glosa: 'Pago Vercel hosting mensual', numero: 1003,
    lineas: [
      { cuenta: '5.1.03', debe: 45000, haber: 0 },
      { cuenta: '1.1.05', debe: 8550, haber: 0 },
      { cuenta: '1.1.02', debe: 0, haber: 53550 },
    ],
  },
  {
    id: '4', fecha: '2026-04-07', glosa: 'Pago API Anthropic Claude', numero: 1004,
    lineas: [
      { cuenta: '5.1.04', debe: 120000, haber: 0 },
      { cuenta: '1.1.05', debe: 22800, haber: 0 },
      { cuenta: '1.1.03', debe: 0, haber: 142800 },
    ],
  },
]

export default function ContabilidadTab() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<'cuentas' | 'asientos' | 'mayor' | 'balance'>('cuentas')
  const [searchCuenta, setSearchCuenta] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [asientos] = useState<Asiento[]>(DEMO_ASIENTOS)
  const [selectedCuenta, setSelectedCuenta] = useState<string | null>(null)

  // Filter accounts
  const filteredCuentas = useMemo(() => {
    return PLAN_CUENTAS.filter(c => {
      if (filterType !== 'all' && c.type !== filterType) return false
      if (searchCuenta && !c.name.toLowerCase().includes(searchCuenta.toLowerCase()) && !c.code.includes(searchCuenta)) return false
      return true
    })
  }, [searchCuenta, filterType])

  // Group accounts
  const groupedCuentas = useMemo(() => {
    const groups: Record<string, typeof PLAN_CUENTAS> = {}
    filteredCuentas.forEach(c => {
      if (!groups[c.group]) groups[c.group] = []
      groups[c.group].push(c)
    })
    return groups
  }, [filteredCuentas])

  // Account balances from journal entries
  const balances = useMemo(() => {
    const b: Record<string, { debe: number; haber: number }> = {}
    asientos.forEach(a => {
      a.lineas.forEach(l => {
        if (!b[l.cuenta]) b[l.cuenta] = { debe: 0, haber: 0 }
        b[l.cuenta].debe += l.debe
        b[l.cuenta].haber += l.haber
      })
    })
    return b
  }, [asientos])

  // Libro Mayor for selected account
  const libroMayor = useMemo(() => {
    if (!selectedCuenta) return []
    const entries: { fecha: string; glosa: string; debe: number; haber: number; saldo: number }[] = []
    let saldo = 0
    asientos
      .filter(a => a.lineas.some(l => l.cuenta === selectedCuenta))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .forEach(a => {
        a.lineas.filter(l => l.cuenta === selectedCuenta).forEach(l => {
          saldo += l.debe - l.haber
          entries.push({ fecha: a.fecha, glosa: a.glosa, debe: l.debe, haber: l.haber, saldo })
        })
      })
    return entries
  }, [selectedCuenta, asientos])

  // Balance general
  const balanceGeneral = useMemo(() => {
    const totals = { activo: 0, pasivo: 0, patrimonio: 0, ingresos: 0, gastos: 0 }
    PLAN_CUENTAS.forEach(c => {
      const b = balances[c.code]
      if (!b) return
      const neto = b.debe - b.haber
      if (c.type === 'activo') totals.activo += neto
      else if (c.type === 'pasivo') totals.pasivo -= neto
      else if (c.type === 'patrimonio') totals.patrimonio -= neto
      else if (c.type === 'ingreso') totals.ingresos -= neto
      else if (c.type === 'gasto') totals.gastos += neto
    })
    return totals
  }, [balances])

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  const typeColors: Record<string, string> = {
    activo: '#3b82f6', pasivo: '#ef4444', patrimonio: '#8b5cf6',
    ingreso: '#10b981', gasto: '#f59e0b',
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={26} /> Contabilidad
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Plan de cuentas, libro diario, libro mayor y balance — Normativa SII Chile
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {[
          { id: 'cuentas' as const, label: 'Plan de Cuentas' },
          { id: 'asientos' as const, label: 'Libro Diario' },
          { id: 'mayor' as const, label: 'Libro Mayor' },
          { id: 'balance' as const, label: 'Balance General' },
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

      {/* ─── Plan de Cuentas ─── */}
      {activeView === 'cuentas' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                placeholder="Buscar cuenta..."
                value={searchCuenta}
                onChange={e => setSearchCuenta(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30 }}
              />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...selectStyle, width: 160 }}>
              <option value="all">Todas</option>
              <option value="activo">Activos</option>
              <option value="pasivo">Pasivos</option>
              <option value="patrimonio">Patrimonio</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>

          {Object.entries(groupedCuentas).map(([group, cuentas]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.05em', marginBottom: 8, padding: '4px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                {group} ({cuentas.length})
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {cuentas.map(c => {
                  const b = balances[c.code]
                  const saldo = b ? b.debe - b.haber : 0
                  return (
                    <div key={c.code} onClick={() => { setSelectedCuenta(c.code); setActiveView('mayor') }} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    >
                      <span style={{
                        fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
                        color: typeColors[c.type] || 'var(--text-muted)', minWidth: 50,
                      }}>{c.code}</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: `${typeColors[c.type]}15`, color: typeColors[c.type],
                        fontWeight: 600, textTransform: 'capitalize',
                      }}>{c.type}</span>
                      {b && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, minWidth: 100, textAlign: 'right',
                          color: saldo >= 0 ? '#10b981' : '#ef4444',
                        }}>
                          ${fmt(Math.abs(saldo))}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ─── Libro Diario ─── */}
      {activeView === 'asientos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{asientos.length} asientos registrados</span>
            <button style={btnPrimary}><Plus size={14} /> Nuevo Asiento</button>
          </div>

          {asientos.map(a => {
            const totalDebe = a.lineas.reduce((s, l) => s + l.debe, 0)
            const totalHaber = a.lineas.reduce((s, l) => s + l.haber, 0)
            const cuadra = totalDebe === totalHaber
            return (
              <div key={a.id} style={{
                marginBottom: 12, borderRadius: 12, border: '1px solid var(--border)',
                overflow: 'hidden', background: 'var(--bg-secondary)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>#{a.numero}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.fecha}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{a.glosa}</span>
                  {cuadra
                    ? <CheckCircle size={14} color="#10b981" />
                    : <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>DESCUADRADO</span>
                  }
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Cuenta</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Nombre</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Debe</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Haber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.lineas.map((l, i) => {
                      const cuenta = PLAN_CUENTAS.find(c => c.code === l.cuenta)
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{l.cuenta}</td>
                          <td style={tdStyle}>{cuenta?.name || l.cuenta}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: l.debe > 0 ? '#10b981' : 'var(--text-muted)' }}>
                            {l.debe > 0 ? `$${fmt(l.debe)}` : ''}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: l.haber > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                            {l.haber > 0 ? `$${fmt(l.haber)}` : ''}
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: 'var(--bg-primary)' }}>
                      <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>TOTALES</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#10b981' }}>${fmt(totalDebe)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>${fmt(totalHaber)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}
        </>
      )}

      {/* ─── Libro Mayor ─── */}
      {activeView === 'mayor' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <select
              value={selectedCuenta || ''}
              onChange={e => setSelectedCuenta(e.target.value || null)}
              style={{ ...selectStyle, width: 400 }}
            >
              <option value="">— Seleccionar cuenta —</option>
              {PLAN_CUENTAS.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          {selectedCuenta && libroMayor.length > 0 ? (
            <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{
                padding: '12px 16px', background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{selectedCuenta}</span>
                <span style={{ fontWeight: 600 }}>{PLAN_CUENTAS.find(c => c.code === selectedCuenta)?.name}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Fecha</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Glosa</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Debe</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Haber</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {libroMayor.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{e.fecha}</td>
                      <td style={tdStyle}>{e.glosa}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: e.debe > 0 ? '#10b981' : 'var(--text-muted)' }}>
                        {e.debe > 0 ? `$${fmt(e.debe)}` : ''}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: e.haber > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {e.haber > 0 ? `$${fmt(e.haber)}` : ''}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: e.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                        ${fmt(Math.abs(e.saldo))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 14 }}>
              <BookOpen size={48} style={{ marginBottom: 12 }} />
              <p>Selecciona una cuenta para ver su libro mayor.</p>
            </div>
          )}
        </>
      )}

      {/* ─── Balance General ─── */}
      {activeView === 'balance' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button style={btnSecondary}><Download size={14} /> Exportar Balance</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Activos */}
            <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#3b82f6' }}>ACTIVOS</h3>
              </div>
              <div style={{ padding: 16 }}>
                {PLAN_CUENTAS.filter(c => c.type === 'activo').map(c => {
                  const b = balances[c.code]
                  if (!b) return null
                  const saldo = b.debe - b.haber
                  if (saldo === 0) return null
                  return (
                    <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span>{c.name}</span>
                      <span style={{ fontWeight: 600, color: saldo >= 0 ? '#10b981' : '#ef4444' }}>${fmt(Math.abs(saldo))}</span>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 15, fontWeight: 800, color: '#3b82f6' }}>
                  <span>Total Activos</span>
                  <span>${fmt(balanceGeneral.activo)}</span>
                </div>
              </div>
            </div>

            {/* Pasivos + Patrimonio */}
            <div>
              <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#ef4444' }}>PASIVOS</h3>
                </div>
                <div style={{ padding: 16 }}>
                  {PLAN_CUENTAS.filter(c => c.type === 'pasivo').map(c => {
                    const b = balances[c.code]
                    if (!b) return null
                    const saldo = b.haber - b.debe
                    if (saldo === 0) return null
                    return (
                      <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>{c.name}</span>
                        <span style={{ fontWeight: 600 }}>${fmt(saldo)}</span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 15, fontWeight: 800, color: '#ef4444' }}>
                    <span>Total Pasivos</span>
                    <span>${fmt(balanceGeneral.pasivo)}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#8b5cf6' }}>PATRIMONIO</h3>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>Resultado del Ejercicio</span>
                    <span style={{ fontWeight: 600, color: balanceGeneral.ingresos - balanceGeneral.gastos >= 0 ? '#10b981' : '#ef4444' }}>
                      ${fmt(balanceGeneral.ingresos - balanceGeneral.gastos)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 15, fontWeight: 800, color: '#8b5cf6' }}>
                    <span>Total Patrimonio</span>
                    <span>${fmt(balanceGeneral.patrimonio + balanceGeneral.ingresos - balanceGeneral.gastos)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ecuación contable */}
          <div style={{
            marginTop: 20, padding: '16px 20px', borderRadius: 14,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Ecuación Contable</div>
            <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#3b82f6' }}>Activos ${fmt(balanceGeneral.activo)}</span>
              <span style={{ color: 'var(--text-muted)' }}>=</span>
              <span style={{ color: '#ef4444' }}>Pasivos ${fmt(balanceGeneral.pasivo)}</span>
              <span style={{ color: 'var(--text-muted)' }}>+</span>
              <span style={{ color: '#8b5cf6' }}>Patrimonio ${fmt(balanceGeneral.patrimonio + balanceGeneral.ingresos - balanceGeneral.gastos)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
