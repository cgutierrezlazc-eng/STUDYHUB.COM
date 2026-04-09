import React, { useState, useMemo } from 'react'
import { BookOpen, Download, Search, ArrowUpRight, ArrowDownRight, FileText, CheckCircle } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { btnSecondary, thStyle, tdStyle, inputStyle, selectStyle, fmt } from '../shared/styles'
import {
  loadTransactions, Transaction, ACCOUNT_CATEGORIES, COMPANY,
  calculateFiscalSummary,
} from '../shared/accountingData'

// ═════════════════════════════════════════════════════════════════
// CONTABILIDAD — Libro Compras/Ventas Electronico + Balance
// Conniku SpA | RUT 78.395.702-7 | Regimen 14D N°3
// Datos reales desde modulo de transacciones (GastosTab)
// ═════════════════════════════════════════════════════════════════

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const DOC_TYPE_LABELS: Record<string, string> = {
  factura: 'Factura',
  factura_exenta: 'Factura Exenta',
  boleta: 'Boleta',
  boleta_honorarios: 'Boleta Honorarios',
  invoice_internacional: 'Invoice Intl.',
  recibo: 'Recibo',
  comprobante_transferencia: 'Comp. Transferencia',
  sin_documento: 'Sin Documento',
}

function fmtCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

export default function ContabilidadTab() {
  const { user } = useAuth()
  const today = new Date()
  const [activeView, setActiveView] = useState<'compras' | 'ventas' | 'resumen' | 'plan_cuentas'>('compras')
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [searchTerm, setSearchTerm] = useState('')

  // Load real transactions
  const allTx = useMemo(() => loadTransactions(), [])

  const periodTx = useMemo(() =>
    allTx.filter(t => t.periodMonth === selectedMonth && t.periodYear === selectedYear),
    [allTx, selectedMonth, selectedYear]
  )

  // Libro Compras: egresos, costos, inversiones con documento fiscal
  const libroCompras = useMemo(() =>
    periodTx
      .filter(t => t.type !== 'ingreso')
      .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.provider.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [periodTx, searchTerm]
  )

  // Libro Ventas: ingresos con documento fiscal
  const libroVentas = useMemo(() =>
    periodTx
      .filter(t => t.type === 'ingreso')
      .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.provider.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [periodTx, searchTerm]
  )

  // Fiscal summary
  const summary = useMemo(
    () => calculateFiscalSummary(selectedMonth, selectedYear),
    [selectedMonth, selectedYear]
  )

  // CSV Export
  const exportLibroCSV = (tipo: 'compras' | 'ventas') => {
    const txs = tipo === 'compras' ? libroCompras : libroVentas
    const BOM = '\uFEFF'
    const headers = ['Fecha', 'Tipo Doc', 'N° Doc', 'RUT Proveedor', 'Proveedor', 'Descripcion', 'Neto', 'IVA', 'Total', 'Moneda', 'IVA Recuperable', 'Deducible']
    const rows = txs.map(t => [
      t.date,
      DOC_TYPE_LABELS[t.documentType] || t.documentType,
      t.documentNumber || '',
      t.providerRut || '',
      t.provider,
      t.description,
      Math.round(t.neto),
      Math.round(t.iva),
      Math.round(t.amountCLP),
      t.currency,
      t.ivaRecuperable ? 'Si' : 'No',
      `${t.deductiblePercent}%`,
    ].join(';'))
    const csv = BOM + [headers.join(';'), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `libro_${tipo}_${selectedYear}_${String(selectedMonth).padStart(2,'0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={26} /> Contabilidad
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Libro Compras/Ventas Electronico — {COMPANY.razonSocial} — {COMPANY.regimen}
        </p>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{ ...selectStyle, width: 140 }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
          style={{ ...selectStyle, width: 100 }}>
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {periodTx.length} transacciones en periodo
        </span>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {([
          { id: 'compras' as const, label: 'Libro Compras', count: libroCompras.length },
          { id: 'ventas' as const, label: 'Libro Ventas', count: libroVentas.length },
          { id: 'resumen' as const, label: 'Resumen IVA' },
          { id: 'plan_cuentas' as const, label: 'Plan de Cuentas' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeView === tab.id ? 'var(--accent)' : 'transparent',
            color: activeView === tab.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {tab.label}
            {'count' in tab && tab.count !== undefined ? ` (${tab.count})` : ''}
          </button>
        ))}
      </div>

      {/* ─── LIBRO COMPRAS ─── */}
      {activeView === 'compras' && (
        <LibroTable
          title="Libro de Compras"
          transactions={libroCompras}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onExport={() => exportLibroCSV('compras')}
          direction="compra"
        />
      )}

      {/* ─── LIBRO VENTAS ─── */}
      {activeView === 'ventas' && (
        <LibroTable
          title="Libro de Ventas"
          transactions={libroVentas}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onExport={() => exportLibroCSV('ventas')}
          direction="venta"
        />
      )}

      {/* ─── RESUMEN IVA ─── */}
      {activeView === 'resumen' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Resumen IVA — {MONTHS[selectedMonth - 1]} {selectedYear}
          </h2>

          {periodTx.length === 0 ? (
            <EmptyState message="Sin transacciones para este periodo. Ingresa datos en Gastos Operacionales." />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                <SummaryCard label="Ventas Netas" value={fmtCLP(summary.totalIngresos)} color="#22c55e" icon={<ArrowUpRight size={16} />} />
                <SummaryCard label="IVA Debito Fiscal" value={fmtCLP(summary.ivaDebito)} color="#f59e0b" sub="IVA de ventas" />
                <SummaryCard label="Compras Netas" value={fmtCLP(summary.totalEgresos)} color="#ef4444" icon={<ArrowDownRight size={16} />} />
                <SummaryCard label="IVA Credito Fiscal" value={fmtCLP(summary.ivaCreditoRecuperable)} color="#3b82f6" sub="IVA recuperable de compras" />
              </div>

              {/* IVA Calculation Table */}
              <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0' }}>Determinacion IVA del Periodo</h3>
                <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 0' }}>Total IVA Debito Fiscal (ventas)</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtCLP(summary.ivaDebito)}</td>
                    </tr>
                    <tr style={{ color: '#3b82f6' }}>
                      <td style={{ padding: '8px 0' }}>(-) Total IVA Credito Fiscal (compras con factura)</td>
                      <td style={{ textAlign: 'right' }}>-{fmtCLP(summary.ivaCreditoRecuperable)}</td>
                    </tr>
                    {summary.remanente > 0 && (
                      <tr style={{ color: '#8b5cf6' }}>
                        <td style={{ padding: '8px 0' }}>(-) Remanente CF periodo anterior</td>
                        <td style={{ textAlign: 'right' }}>$0</td>
                      </tr>
                    )}
                    <tr style={{
                      borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: 16,
                      color: summary.ivaAPagar > 0 ? '#ef4444' : '#22c55e',
                    }}>
                      <td style={{ paddingTop: 12 }}>
                        {summary.ivaAPagar > 0 ? 'IVA a Pagar al Fisco' : 'Remanente Credito Fiscal'}
                      </td>
                      <td style={{ textAlign: 'right', paddingTop: 12 }}>
                        {summary.ivaAPagar > 0 ? fmtCLP(summary.ivaAPagar) : fmtCLP(summary.remanente)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PPM */}
              <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px 0' }}>PPM — Pago Provisional Mensual</h3>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{fmtCLP(summary.ppm)}</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  0,25% sobre ingresos brutos ({fmtCLP(summary.totalIngresos)}) — Tasa Micro Empresa ProPyme
                </p>
              </div>

              {/* Total F29 */}
              <div style={{
                padding: 20, borderRadius: 14,
                background: summary.ivaAPagar + summary.ppm > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                border: `2px solid ${summary.ivaAPagar + summary.ppm > 0 ? '#ef4444' : '#22c55e'}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total a Declarar en F29</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: summary.ivaAPagar + summary.ppm > 0 ? '#ef4444' : '#22c55e' }}>
                  {fmtCLP(summary.ivaAPagar + summary.ppm)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  IVA {fmtCLP(summary.ivaAPagar)} + PPM {fmtCLP(summary.ppm)}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── PLAN DE CUENTAS (SII) ─── */}
      {activeView === 'plan_cuentas' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Plan de Cuentas — Contabilidad Simplificada</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Regimen 14D N°3 ProPyme Transparente — base flujo de caja. Las categorias se alimentan automaticamente desde el modulo de transacciones.
          </p>

          {/* Group by group */}
          {['ingreso', 'costo_operacional', 'gasto_admin', 'gasto_ventas', 'remuneracion', 'prevision', 'inversion', 'impuesto'].map(groupKey => {
            const cats = ACCOUNT_CATEGORIES.filter(c => c.group === groupKey)
            if (cats.length === 0) return null

            // Sum from transactions
            const groupTotal = periodTx
              .filter(t => cats.some(c => c.key === t.category))
              .reduce((sum, t) => sum + t.amountCLP, 0)

            return (
              <div key={groupKey} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '10px 10px 0 0',
                  borderBottom: '2px solid var(--border)',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    {groupKey.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtCLP(groupTotal)}</span>
                </div>
                <div style={{ border: '1px solid var(--border)', borderTop: 0, borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                  {cats.map(cat => {
                    const catTotal = periodTx
                      .filter(t => t.category === cat.key)
                      .reduce((sum, t) => sum + t.amountCLP, 0)
                    const txCount = periodTx.filter(t => t.category === cat.key).length

                    return (
                      <div key={cat.key} style={{
                        display: 'flex', alignItems: 'center', padding: '8px 14px',
                        borderBottom: '1px solid var(--border-subtle, rgba(128,128,128,0.1))',
                        fontSize: 13,
                      }}>
                        <span style={{ width: 24, textAlign: 'center' }}>{cat.icon}</span>
                        <span style={{ flex: 1, marginLeft: 8 }}>{cat.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 12 }}>
                          {cat.codigoSII}
                        </span>
                        {txCount > 0 && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', marginRight: 8 }}>
                            {txCount} tx
                          </span>
                        )}
                        <span style={{ fontWeight: 600, minWidth: 100, textAlign: 'right' }}>
                          {catTotal > 0 ? fmtCLP(catTotal) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// LIBRO TABLE — Shared component for Libro Compras/Ventas
// ═════════════════════════════════════════════════════════════════

function LibroTable({ title, transactions, searchTerm, setSearchTerm, onExport, direction }: {
  title: string
  transactions: Transaction[]
  searchTerm: string
  setSearchTerm: (v: string) => void
  onExport: () => void
  direction: 'compra' | 'venta'
}) {
  // Totals
  const totals = useMemo(() => {
    let neto = 0, iva = 0, total = 0
    transactions.forEach(t => { neto += t.neto; iva += t.iva; total += t.amountCLP })
    return { neto, iva, total }
  }, [transactions])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          <input
            placeholder="Buscar proveedor o descripcion..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <button onClick={onExport} style={btnSecondary}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState message={`Sin ${direction === 'compra' ? 'compras' : 'ventas'} registradas para este periodo.`} />
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Fecha</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Tipo Doc</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>N° Doc</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>RUT</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>{direction === 'compra' ? 'Proveedor' : 'Cliente'}</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Descripcion</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Neto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>IVA</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>CF</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontSize: 11, whiteSpace: 'nowrap' }}>{t.date}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{DOC_TYPE_LABELS[t.documentType] || t.documentType}</td>
                    <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'monospace' }}>{t.documentNumber || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'monospace' }}>{t.providerRut || '—'}</td>
                    <td style={tdStyle}>{t.provider}</td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{fmtCLP(t.neto)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: t.iva > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                      {t.iva > 0 ? fmtCLP(t.iva) : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{fmtCLP(t.amountCLP)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {t.ivaRecuperable && t.iva > 0
                        ? <CheckCircle size={14} color="#22c55e" />
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'right' }}>TOTALES</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{fmtCLP(totals.neto)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#f59e0b' }}>{fmtCLP(totals.iva)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{fmtCLP(totals.total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary footer */}
      {transactions.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{transactions.length} registros</span>
          <span>Neto: {fmtCLP(totals.neto)}</span>
          <span>IVA: {fmtCLP(totals.iva)}</span>
          <span>Total: {fmtCLP(totals.total)}</span>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════

function SummaryCard({ label, value, color, sub, icon }: { label: string; value: string; color: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, borderLeft: `4px solid ${color}`, background: 'var(--bg-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 14 }}>
      <FileText size={48} style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  )
}
