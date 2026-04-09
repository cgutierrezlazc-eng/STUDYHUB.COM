import React, { useState, useMemo } from 'react'
import { Calculator, FileText, TrendingUp, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { fmt } from '../shared/styles'
import {
  loadTransactions, COMPANY, FISCAL_DEADLINES, getDeadlineStatus,
  calculateFiscalSummary, getTransactionsByPeriod, ACCOUNT_CATEGORIES,
} from '../shared/accountingData'

// ═════════════════════════════════════════════════════════════════
// IMPUESTOS — F29 Automatico + Proyeccion Anual + F22
// Conniku SpA | RUT 78.395.702-7 | Regimen 14D N°3
// ═════════════════════════════════════════════════════════════════

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmtCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

export default function ImpuestosTab() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [activeView, setActiveView] = useState<'f29' | 'proyeccion' | 'f22'>('f29')

  // F29 data for selected month
  const summary = useMemo(() => calculateFiscalSummary(month, year), [month, year])

  const periodTx = useMemo(
    () => getTransactionsByPeriod(month, year),
    [month, year]
  )

  // F29 deadline status
  const f29Deadline = FISCAL_DEADLINES.find(d => d.key === 'f29')!
  const f29Status = getDeadlineStatus(f29Deadline)

  // Annual projection (all months of year)
  const annualData = useMemo(() => {
    const months: { month: number; ingresos: number; egresos: number; ivaAPagar: number; ppm: number; deducible: number }[] = []
    let totalIngresos = 0, totalEgresos = 0, totalIVA = 0, totalPPM = 0, totalDeducible = 0

    for (let m = 1; m <= 12; m++) {
      const s = calculateFiscalSummary(m, year)
      months.push({
        month: m,
        ingresos: s.totalIngresos,
        egresos: s.totalEgresos,
        ivaAPagar: s.ivaAPagar,
        ppm: s.ppm,
        deducible: s.totalDeducible,
      })
      totalIngresos += s.totalIngresos
      totalEgresos += s.totalEgresos
      totalIVA += s.ivaAPagar
      totalPPM += s.ppm
      totalDeducible += s.totalDeducible
    }

    // Resultado tributario anual (base flujo de caja)
    const resultadoTributario = totalIngresos - totalDeducible
    // Impuesto Primera Categoria 25% para ProPyme
    const impuesto1aCat = Math.max(0, Math.round(resultadoTributario * 0.25))
    // PPM acumulado a descontar
    const ppmAcumulado = totalPPM
    // Diferencia a pagar o a favor
    const diferencia = impuesto1aCat - ppmAcumulado

    return {
      months, totalIngresos, totalEgresos, totalIVA, totalPPM,
      totalDeducible, resultadoTributario, impuesto1aCat, ppmAcumulado, diferencia,
    }
  }, [year])

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calculator size={26} /> Impuestos
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          {COMPANY.razonSocial} — {COMPANY.regimen} — Tasa 1a Cat. 25%
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {([
          { id: 'f29' as const, label: 'F29 Mensual' },
          { id: 'proyeccion' as const, label: 'Proyeccion Anual' },
          { id: 'f22' as const, label: 'F22 Renta Anual' },
        ]).map(tab => (
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

      {/* ─── F29 MENSUAL ─── */}
      {activeView === 'f29' && (
        <div>
          {/* Period + Status */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <StatusBadge status={f29Status.status} daysUntil={f29Status.daysUntil} label="F29" />
          </div>

          {/* F29 Auto-prepared data */}
          <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} /> Formulario 29 — {MONTHS[month - 1]} {year}
              </h2>
              <a href="https://www.sii.cl/servicios_online/1080-1082.html" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}>
                Declarar en SII <ExternalLink size={12} />
              </a>
            </div>

            {periodTx.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>Sin transacciones para {MONTHS[month - 1]} {year}.</p>
                <p style={{ fontSize: 12 }}>Los datos del F29 se calculan automaticamente desde las transacciones.</p>
              </div>
            ) : (
              <>
                {/* Debitos y Creditos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Debitos */}
                  <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#f59e0b', textTransform: 'uppercase' }}>IVA Debito Fiscal (Ventas)</h4>
                    <table style={{ width: '100%', fontSize: 13 }}>
                      <tbody>
                        <tr>
                          <td>Ventas netas del periodo</td>
                          <td style={{ textAlign: 'right' }}>{fmtCLP(summary.totalIngresos)}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                          <td style={{ paddingTop: 8 }}>Total Debito IVA (19%)</td>
                          <td style={{ textAlign: 'right', paddingTop: 8, color: '#f59e0b' }}>{fmtCLP(summary.ivaDebito)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Creditos */}
                  <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#3b82f6', textTransform: 'uppercase' }}>IVA Credito Fiscal (Compras)</h4>
                    <table style={{ width: '100%', fontSize: 13 }}>
                      <tbody>
                        <tr>
                          <td>Compras con factura (IVA recuperable)</td>
                          <td style={{ textAlign: 'right' }}>{fmtCLP(summary.ivaCreditoRecuperable)}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                          <td style={{ paddingTop: 8 }}>Total Credito IVA</td>
                          <td style={{ textAlign: 'right', paddingTop: 8, color: '#3b82f6' }}>{fmtCLP(summary.ivaCreditoRecuperable)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resultado IVA */}
                <div style={{
                  padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 16,
                  background: summary.ivaAPagar > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                  border: `2px solid ${summary.ivaAPagar > 0 ? '#ef4444' : '#22c55e'}`,
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {summary.ivaAPagar > 0 ? 'IVA a Pagar al Fisco' : 'Remanente Credito Fiscal a Favor'}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: summary.ivaAPagar > 0 ? '#ef4444' : '#22c55e' }}>
                    {fmtCLP(summary.ivaAPagar > 0 ? summary.ivaAPagar : summary.remanente)}
                  </div>
                </div>

                {/* PPM */}
                <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14 }}>PPM — Pago Provisional Mensual</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Tasa 0,25% sobre ingresos brutos — Micro Empresa ProPyme
                      </p>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{fmtCLP(summary.ppm)}</div>
                  </div>
                </div>

                {/* Total F29 */}
                <div style={{
                  padding: 20, borderRadius: 14, textAlign: 'center',
                  background: 'linear-gradient(135deg, #1a2332, #2d62c8)', color: '#fff',
                }}>
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Total a Pagar en F29</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>
                    {fmtCLP(summary.ivaAPagar + summary.ppm)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    IVA {fmtCLP(summary.ivaAPagar)} + PPM {fmtCLP(summary.ppm)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
                    Vencimiento: dia 12 del mes siguiente — Declarar en sii.cl
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Transaction detail for F29 */}
          {periodTx.length > 0 && (
            <div className="u-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Detalle de Transacciones del Periodo</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {periodTx.length} transacciones | {periodTx.filter(t => t.type === 'ingreso').length} ingresos | {periodTx.filter(t => t.type !== 'ingreso').length} egresos
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {periodTx.sort((a, b) => a.date.localeCompare(b.date)).map(t => {
                  const cat = ACCOUNT_CATEGORIES.find(c => c.key === t.category)
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                      background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12,
                    }}>
                      <span style={{ width: 20, textAlign: 'center' }}>{cat?.icon || '📄'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 75 }}>{t.date}</span>
                      <span style={{ flex: 1 }}>{t.description}</span>
                      <span style={{
                        fontWeight: 600,
                        color: t.type === 'ingreso' ? '#22c55e' : '#ef4444',
                      }}>
                        {t.type === 'ingreso' ? '+' : '-'}{fmtCLP(t.amountCLP)}
                      </span>
                      {t.iva > 0 && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                          IVA {fmtCLP(t.iva)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PROYECCION ANUAL ─── */}
      {activeView === 'proyeccion' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} /> Proyeccion Fiscal {year}
            </h2>
            <div style={{ flex: 1 }} />
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Annual summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <MiniCard label="Ingresos Anuales" value={fmtCLP(annualData.totalIngresos)} color="#22c55e" />
            <MiniCard label="Egresos Anuales" value={fmtCLP(annualData.totalEgresos)} color="#ef4444" />
            <MiniCard label="IVA Pagado" value={fmtCLP(annualData.totalIVA)} color="#f59e0b" />
            <MiniCard label="PPM Acumulado" value={fmtCLP(annualData.totalPPM)} color="#3b82f6" />
            <MiniCard label="Gasto Deducible" value={fmtCLP(annualData.totalDeducible)} color="#8b5cf6" />
            <MiniCard label="Resultado Tributario" value={fmtCLP(annualData.resultadoTributario)} color={annualData.resultadoTributario >= 0 ? '#22c55e' : '#ef4444'} />
          </div>

          {/* Monthly breakdown table */}
          <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Desglose Mensual</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Mes</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Ingresos</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Egresos</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>IVA a Pagar</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>PPM</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Deducible</th>
                  </tr>
                </thead>
                <tbody>
                  {annualData.months.map(m => {
                    const hasData = m.ingresos > 0 || m.egresos > 0
                    return (
                      <tr key={m.month} style={{
                        borderBottom: '1px solid var(--border)',
                        opacity: hasData ? 1 : 0.4,
                      }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{MONTHS[m.month - 1]}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#22c55e' }}>{m.ingresos > 0 ? fmtCLP(m.ingresos) : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#ef4444' }}>{m.egresos > 0 ? fmtCLP(m.egresos) : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f59e0b' }}>{m.ivaAPagar > 0 ? fmtCLP(m.ivaAPagar) : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#3b82f6' }}>{m.ppm > 0 ? fmtCLP(m.ppm) : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#8b5cf6' }}>{m.deducible > 0 ? fmtCLP(m.deducible) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                    <td style={{ padding: '10px' }}>TOTALES</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#22c55e' }}>{fmtCLP(annualData.totalIngresos)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#ef4444' }}>{fmtCLP(annualData.totalEgresos)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#f59e0b' }}>{fmtCLP(annualData.totalIVA)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#3b82f6' }}>{fmtCLP(annualData.totalPPM)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#8b5cf6' }}>{fmtCLP(annualData.totalDeducible)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tax projection */}
          <div className="u-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Proyeccion Impuesto 1a Categoria</h3>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '8px 0' }}>Ingresos anuales (percibidos)</td><td style={{ textAlign: 'right' }}>{fmtCLP(annualData.totalIngresos)}</td></tr>
                <tr style={{ color: '#ef4444' }}><td style={{ padding: '8px 0' }}>(-) Gastos deducibles (pagados)</td><td style={{ textAlign: 'right' }}>-{fmtCLP(annualData.totalDeducible)}</td></tr>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td style={{ padding: '10px 0' }}>Resultado Tributario (base imponible)</td>
                  <td style={{ textAlign: 'right', color: annualData.resultadoTributario >= 0 ? '#22c55e' : '#ef4444' }}>
                    {fmtCLP(annualData.resultadoTributario)}
                  </td>
                </tr>
                <tr><td style={{ padding: '8px 0' }}>Impuesto 1a Categoria (25%)</td><td style={{ textAlign: 'right' }}>{fmtCLP(annualData.impuesto1aCat)}</td></tr>
                <tr style={{ color: '#3b82f6' }}><td style={{ padding: '8px 0' }}>(-) PPM acumulado (credito)</td><td style={{ textAlign: 'right' }}>-{fmtCLP(annualData.ppmAcumulado)}</td></tr>
                <tr style={{
                  borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: 16,
                  color: annualData.diferencia > 0 ? '#ef4444' : '#22c55e',
                }}>
                  <td style={{ paddingTop: 10 }}>
                    {annualData.diferencia > 0 ? 'Impuesto a Pagar en F22' : 'Devolucion a Favor'}
                  </td>
                  <td style={{ textAlign: 'right', paddingTop: 10 }}>
                    {fmtCLP(Math.abs(annualData.diferencia))}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              * Regimen 14D N°3 ProPyme Transparente — tributacion en base a flujos de caja (ingresos percibidos menos gastos efectivamente pagados).
              La tasa de 25% aplica al resultado tributario positivo. Los PPM pagados durante el ano se descuentan como credito.
            </p>
          </div>
        </div>
      )}

      {/* ─── F22 RENTA ANUAL ─── */}
      {activeView === 'f22' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} /> Formulario 22 — Declaracion de Renta {year}
            </h2>
            <div style={{ flex: 1 }} />
            <a href="https://www.sii.cl/servicios_online/1080-1083.html" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}>
              Declarar en SII <ExternalLink size={12} />
            </a>
          </div>

          {/* Regimen info */}
          <div className="u-card" style={{ padding: 20, marginBottom: 20, borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Regimen Tributario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
              <div>
                <p><strong>Regimen:</strong> Art. 14D N°3 — ProPyme Transparente</p>
                <p><strong>Tasa 1a Categoria:</strong> 25%</p>
                <p><strong>Base:</strong> Flujo de caja (percibido - pagado)</p>
              </div>
              <div>
                <p><strong>Segmento:</strong> {COMPANY.segmento}</p>
                <p><strong>Depreciacion:</strong> Instantanea (activos fijos)</p>
                <p><strong>PPM:</strong> 0,25% sobre ingresos brutos</p>
              </div>
            </div>
          </div>

          {/* F22 Data */}
          <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Datos para Declaracion</h3>

            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ background: 'rgba(34,197,94,0.05)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Ingresos Brutos Percibidos</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>{fmtCLP(annualData.totalIngresos)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px' }}>Gastos Operacionales Pagados</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCLP(annualData.totalEgresos)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px' }}>Gastos Deducibles (segun % deducibilidad)</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#8b5cf6' }}>{fmtCLP(annualData.totalDeducible)}</td>
                </tr>
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>Renta Liquida Imponible</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{fmtCLP(annualData.resultadoTributario)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px' }}>Impuesto 1a Categoria (25%)</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtCLP(annualData.impuesto1aCat)}</td>
                </tr>
                <tr style={{ color: '#3b82f6' }}>
                  <td style={{ padding: '10px 12px' }}>(-) PPM Acumulado (credito)</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>-{fmtCLP(annualData.ppmAcumulado)}</td>
                </tr>
                <tr style={{
                  borderTop: '3px solid var(--border)', fontWeight: 800, fontSize: 16,
                  background: annualData.diferencia > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                }}>
                  <td style={{ padding: '14px 12px' }}>
                    {annualData.diferencia > 0 ? 'Impuesto a Pagar' : 'Devolucion a Favor'}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: annualData.diferencia > 0 ? '#ef4444' : '#22c55e' }}>
                    {fmtCLP(Math.abs(annualData.diferencia))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deadlines */}
          <div className="u-card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Plazos Declaraciones Anuales</h3>
            <div style={{ fontSize: 13, display: 'grid', gap: 8 }}>
              <DeadlineRow label="DJ 1887 — Sueldos Pagados" date="28 de Marzo" url="https://www.sii.cl/servicios_online/1080-1399.html" />
              <DeadlineRow label="Formulario 22 — Renta Anual" date="30 de Abril" url="https://www.sii.cl/servicios_online/1080-1083.html" />
              <DeadlineRow label="Patente Municipal — 1er Semestre" date="31 de Enero" url="https://www.municipalidadantofagasta.cl/" />
              <DeadlineRow label="Patente Municipal — 2do Semestre" date="31 de Julio" url="https://www.municipalidadantofagasta.cl/" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════

function StatusBadge({ status, daysUntil, label }: { status: string; daysUntil: number; label: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    ok:      { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
    warning: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    danger:  { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    overdue: { bg: 'rgba(127,29,29,0.15)', text: '#991b1b' },
  }
  const c = colors[status] || colors.ok
  return (
    <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text }}>
      {label}: {status === 'overdue' ? `Vencido hace ${Math.abs(daysUntil)}d` : `${daysUntil} dias`}
    </span>
  )
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, borderLeft: `4px solid ${color}`, background: 'var(--bg-secondary)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function DeadlineRow({ label, date, url }: { label: string; date: string; url: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle, rgba(128,128,128,0.1))' }}>
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{date}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 12 }}>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
