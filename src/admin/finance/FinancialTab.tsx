import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import {
  FISCAL_DEADLINES, FiscalDeadline, getDeadlineStatus, DeadlineStatus,
  calculateFiscalSummary, FiscalSummary, loadTransactions, COMPANY,
} from '../shared/accountingData'

// ═════════════════════════════════════════════════════════════════
// PANEL FINANCIERO — Dashboard Semaforo Fiscal
// Conniku SpA | RUT 78.395.702-7 | Regimen 14D N°3
// ═════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<DeadlineStatus, { bg: string; border: string; text: string; label: string }> = {
  ok:      { bg: 'rgba(34,197,94,0.1)',  border: '#22c55e', text: '#16a34a', label: 'Al dia' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#d97706', label: 'Proximo' },
  danger:  { bg: 'rgba(239,68,68,0.1)',  border: '#ef4444', text: '#dc2626', label: 'Urgente' },
  overdue: { bg: 'rgba(127,29,29,0.15)', border: '#991b1b', text: '#991b1b', label: 'Vencido' },
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmtCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

function fmtDate(d: Date): string {
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
}

export default function FinancialTab() {
  const { user } = useAuth()
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [usdRate, setUsdRate] = useState(950)
  const [alertStatus, setAlertStatus] = useState<string | null>(null)

  // Load USD rate
  useEffect(() => {
    api.getChileIndicators()
      .then((data: any) => {
        if (data?.dolar?.value) setUsdRate(Math.round(data.dolar.value))
      })
      .catch(() => {})
  }, [])

  // Fiscal summary for selected period
  const summary: FiscalSummary = useMemo(
    () => calculateFiscalSummary(selectedMonth, selectedYear),
    [selectedMonth, selectedYear]
  )

  // Deadline statuses
  const deadlineStatuses = useMemo(() =>
    FISCAL_DEADLINES.map(d => ({
      deadline: d,
      ...getDeadlineStatus(d, today),
    }))
  , [])

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<DeadlineStatus, number> = { ok: 0, warning: 0, danger: 0, overdue: 0 }
    deadlineStatuses.forEach(d => counts[d.status]++)
    return counts
  }, [deadlineStatuses])

  // Transaction count
  const txCount = useMemo(() => loadTransactions().filter(
    t => t.periodMonth === selectedMonth && t.periodYear === selectedYear
  ).length, [selectedMonth, selectedYear])

  if (user?.role !== 'owner') return null

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          Panel Financiero
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          {COMPANY.razonSocial} — RUT {COMPANY.rut} — {COMPANY.regimen}
        </p>
      </div>

      {/* ── SEMAFORO FISCAL ────────────────────────────────── */}
      <div className="u-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Semaforo Fiscal
            </h2>
            <button
              onClick={() => {
                setAlertStatus('Enviando...')
                api.checkFiscalAlerts()
                  .then((r: any) => setAlertStatus(`${r.alerts_sent?.length || 0} alertas enviadas`))
                  .catch(() => setAlertStatus('Error al verificar'))
                setTimeout(() => setAlertStatus(null), 4000)
              }}
              style={{
                padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              {alertStatus || 'Verificar Alertas'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ok','warning','danger','overdue'] as DeadlineStatus[]).map(s => (
              <span key={s} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: STATUS_COLORS[s].bg, color: STATUS_COLORS[s].text,
              }}>
                {statusCounts[s]} {STATUS_COLORS[s].label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {deadlineStatuses.map(({ deadline, status, nextDate, daysUntil }) => {
            const colors = STATUS_COLORS[status]
            return (
              <div key={deadline.key} style={{
                padding: 16, borderRadius: 12,
                border: `2px solid ${colors.border}`,
                background: colors.bg,
                transition: 'transform 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flex: 1, marginRight: 8 }}>
                    {deadline.name}
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: colors.border, color: '#fff', whiteSpace: 'nowrap',
                  }}>
                    {status === 'overdue' ? `Vencido hace ${Math.abs(daysUntil)} dias` :
                     daysUntil === 0 ? 'HOY' :
                     daysUntil === 1 ? 'MANANA' :
                     `${daysUntil} dias`}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  {deadline.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600 }}>Prox:</span> {fmtDate(nextDate)} — {deadline.platform}
                  </div>
                  <a
                    href={deadline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: 'var(--accent)', color: '#fff', textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ir a plataforma
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RESUMEN PERIODO ────────────────────────────────── */}
      <div className="u-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Resumen Tributario — {MONTHS[selectedMonth - 1]} {selectedYear}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            >
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {txCount === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>Sin transacciones para este periodo.</p>
            <p style={{ fontSize: 12 }}>Ingresa transacciones en <strong>Gastos Operacionales</strong> para ver el resumen aqui.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <SummaryCard label="Ingresos Netos" value={fmtCLP(summary.totalIngresos)} color="#22c55e" />
              <SummaryCard label="IVA Debito" value={fmtCLP(summary.ivaDebito)} color="#f59e0b" sub="IVA ventas (debes al fisco)" />
              <SummaryCard label="Total Egresos" value={fmtCLP(summary.totalEgresos)} color="#ef4444" />
              <SummaryCard label="IVA Credito Fiscal" value={fmtCLP(summary.ivaCreditoRecuperable)} color="#3b82f6" sub="IVA compras (te devuelven)" />
            </div>

            {/* IVA Calculation */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0' }}>Calculo IVA Mensual (F29)</h3>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '6px 0' }}>IVA Debito (ventas)</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtCLP(summary.ivaDebito)}</td></tr>
                  <tr style={{ color: '#3b82f6' }}><td style={{ padding: '6px 0' }}>(-) IVA Credito Fiscal (compras)</td><td style={{ textAlign: 'right' }}>-{fmtCLP(summary.ivaCreditoRecuperable)}</td></tr>
                  <tr style={{
                    borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: 15,
                    color: summary.ivaAPagar > 0 ? '#ef4444' : '#22c55e',
                  }}>
                    <td style={{ paddingTop: 10 }}>{summary.ivaAPagar > 0 ? 'IVA a Pagar' : 'Remanente CF a Favor'}</td>
                    <td style={{ textAlign: 'right', paddingTop: 10 }}>
                      {summary.ivaAPagar > 0 ? fmtCLP(summary.ivaAPagar) : fmtCLP(summary.remanente)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PPM + Resultado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0' }}>PPM (Pago Provisional Mensual)</h3>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtCLP(summary.ppm)}</div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  0,25% de ingresos brutos (Micro Empresa ProPyme)
                </p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0' }}>Resultado Tributario</h3>
                <div style={{ fontSize: 22, fontWeight: 700, color: summary.resultadoTributario >= 0 ? '#22c55e' : '#ef4444' }}>
                  {fmtCLP(summary.resultadoTributario)}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Ingresos - Gastos Deducibles (base flujo de caja)
                </p>
              </div>
            </div>

            {/* Breakdown by Group */}
            {Object.keys(summary.byGroup).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Desglose por Tipo</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {Object.entries(summary.byGroup).sort((a, b) => b[1] - a[1]).map(([group, total]) => (
                    <div key={group} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13 }}>
                      <span style={{ textTransform: 'capitalize' }}>{group.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 600 }}>{fmtCLP(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── REPORTES PARA CONTADOR ─────────────────────── */}
      <div className="u-card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0' }}>Reportes para Contador</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Exporta los datos del periodo seleccionado en formato CSV compatible con Excel para tu contador.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          <ReportButton
            label="Reporte Tributario Mensual"
            description={`Resumen IVA, PPM, resultado — ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            onClick={() => exportReporteTributario(selectedMonth, selectedYear)}
          />
          <ReportButton
            label="Libro de Transacciones"
            description={`Todas las transacciones — ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            onClick={() => exportLibroTransacciones(selectedMonth, selectedYear)}
          />
          <ReportButton
            label="Reporte Anual Consolidado"
            description={`Resumen 12 meses — ${selectedYear}`}
            onClick={() => exportReporteAnual(selectedYear)}
          />
        </div>
      </div>

      {/* ── DATOS EMPRESA ────────────────────────────────── */}
      <div className="u-card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0' }}>Datos de la Empresa</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <InfoRow label="Razon Social" value={COMPANY.razonSocial} />
          <InfoRow label="RUT" value={COMPANY.rut} />
          <InfoRow label="Giro SII" value={`${COMPANY.codigoSII} — ${COMPANY.giro}`} />
          <InfoRow label="Regimen" value={COMPANY.regimen} />
          <InfoRow label="Categoria" value={`${COMPANY.categoria} — ${COMPANY.segmento}`} />
          <InfoRow label="Afecto IVA" value="Si (19%)" />
          <InfoRow label="Representante Legal" value={COMPANY.representante} />
          <InfoRow label="RUT Representante" value={COMPANY.rutRepresentante} />
          <InfoRow label="Domicilio" value={COMPANY.domicilio} />
          <InfoRow label="Inicio Actividades" value={COMPANY.fechaInicioActividades} />
          <InfoRow label="Email SII" value={COMPANY.emailSII} />
          <InfoRow label="Telefono" value={COMPANY.telefono} />
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Mi SII', url: 'https://www.sii.cl/' },
            { label: 'Previred', url: 'https://www.previred.com/' },
            { label: 'Municipalidad Antofagasta', url: 'https://www.municipalidadantofagasta.cl/' },
            { label: 'Banco Estado', url: 'https://www.bancoestado.cl/' },
            { label: 'mindicador.cl', url: 'https://mindicador.cl/' },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'var(--bg-secondary)', color: 'var(--accent)', textDecoration: 'none',
                border: '1px solid var(--border)',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          Tipo cambio USD: ${usdRate.toLocaleString('es-CL')} CLP — Fuente: mindicador.cl
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════

function SummaryCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, borderLeft: `4px solid ${color}`, background: 'var(--bg-secondary)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle, rgba(128,128,128,0.1))' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function ReportButton({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: 16, borderRadius: 12, border: '1px solid var(--border)',
      background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left',
      transition: 'background 0.15s',
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
    </button>
  )
}

// ═════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS (CSV for contador)
// ═════════════════════════════════════════════════════════════════

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function downloadCSV(filename: string, content: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportReporteTributario(month: number, year: number) {
  const s = calculateFiscalSummary(month, year)
  const rows = [
    ['REPORTE TRIBUTARIO MENSUAL'],
    [`Empresa;${COMPANY.razonSocial}`],
    [`RUT;${COMPANY.rut}`],
    [`Regimen;${COMPANY.regimen}`],
    [`Periodo;${MONTHS[month - 1]} ${year}`],
    [''],
    ['CONCEPTO;MONTO CLP'],
    [`Ingresos Netos;${Math.round(s.totalIngresos)}`],
    [`IVA Debito Fiscal;${Math.round(s.ivaDebito)}`],
    [`Total Egresos;${Math.round(s.totalEgresos)}`],
    [`IVA Credito Fiscal Recuperable;${Math.round(s.ivaCreditoRecuperable)}`],
    [`Total Gastos Deducibles;${Math.round(s.totalDeducible)}`],
    [''],
    ['DETERMINACION IVA'],
    [`IVA Debito;${Math.round(s.ivaDebito)}`],
    [`IVA Credito;${Math.round(s.ivaCreditoRecuperable)}`],
    [`IVA a Pagar;${Math.round(s.ivaAPagar)}`],
    [`Remanente CF;${Math.round(s.remanente)}`],
    [''],
    [`PPM (0.25%);${Math.round(s.ppm)}`],
    [`Total F29;${Math.round(s.ivaAPagar + s.ppm)}`],
    [''],
    [`Resultado Tributario;${Math.round(s.resultadoTributario)}`],
  ]
  downloadCSV(`reporte_tributario_${year}_${String(month).padStart(2,'0')}.csv`, rows.join('\n'))
}

function exportLibroTransacciones(month: number, year: number) {
  const txs = loadTransactions().filter(t => t.periodMonth === month && t.periodYear === year)
  const headers = ['Fecha;Tipo;Categoria;Descripcion;Proveedor;RUT Prov;Tipo Doc;N° Doc;Moneda;Monto Original;Tipo Cambio;Monto CLP;Neto;IVA;IVA Recuperable;Retencion;% Deducible;Monto Deducible;Metodo Pago;Recurrente']
  const rows = txs.map(t => [
    t.date, t.type, t.category, t.description, t.provider, t.providerRut || '',
    t.documentType, t.documentNumber || '', t.currency, t.amountOriginal, t.exchangeRate,
    Math.round(t.amountCLP), Math.round(t.neto), Math.round(t.iva),
    t.ivaRecuperable ? 'Si' : 'No', Math.round(t.retencion),
    t.deductiblePercent, Math.round(t.deductibleAmount), t.paymentMethod,
    t.recurring ? 'Si' : 'No',
  ].join(';'))
  downloadCSV(`transacciones_${year}_${String(month).padStart(2,'0')}.csv`, [headers[0], ...rows].join('\n'))
}

function exportReporteAnual(year: number) {
  const rows: string[] = [
    'REPORTE ANUAL CONSOLIDADO',
    `Empresa;${COMPANY.razonSocial}`,
    `RUT;${COMPANY.rut}`,
    `Ano;${year}`,
    '',
    'Mes;Ingresos;Egresos;IVA a Pagar;PPM;Gasto Deducible;Resultado',
  ]
  let totalIng = 0, totalEgr = 0, totalIVA = 0, totalPPM = 0, totalDed = 0
  for (let m = 1; m <= 12; m++) {
    const s = calculateFiscalSummary(m, year)
    rows.push(`${MONTHS_SHORT[m-1]};${Math.round(s.totalIngresos)};${Math.round(s.totalEgresos)};${Math.round(s.ivaAPagar)};${Math.round(s.ppm)};${Math.round(s.totalDeducible)};${Math.round(s.resultadoTributario)}`)
    totalIng += s.totalIngresos; totalEgr += s.totalEgresos
    totalIVA += s.ivaAPagar; totalPPM += s.ppm; totalDed += s.totalDeducible
  }
  const resultAnual = totalIng - totalDed
  rows.push(`TOTAL;${Math.round(totalIng)};${Math.round(totalEgr)};${Math.round(totalIVA)};${Math.round(totalPPM)};${Math.round(totalDed)};${Math.round(resultAnual)}`)
  rows.push('')
  rows.push(`Impuesto 1a Categoria (25%);${Math.round(Math.max(0, resultAnual * 0.25))}`)
  rows.push(`PPM Acumulado (credito);${Math.round(totalPPM)}`)
  rows.push(`Diferencia a Pagar/Favor;${Math.round(Math.max(0, resultAnual * 0.25) - totalPPM)}`)

  downloadCSV(`reporte_anual_${year}.csv`, rows.join('\n'))
}
