import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Calculator, Download, Minus, CreditCard, Building,
  ChevronDown, ChevronRight, Printer, CheckCircle, Clock, Users, AlertTriangle
} from 'lucide-react'
import { Employee, PayrollRecord } from '../shared/types'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { AFP_OPTIONS, COMPANY } from '../shared/constants'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, btnSmall, fmt } from '../shared/styles'

const MONTHS = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// ─── PDF generator ───────────────────────────────────────────────
function generateLiquidacionHTML(record: PayrollRecord): string {
  const monthName = MONTHS[record.periodMonth]
  const afpInfo = AFP_OPTIONS.find(a => a.value === record.employeeAfp)
  const afpRate = afpInfo ? `${afpInfo.rate}%` : '—'
  const afpName = afpInfo ? afpInfo.label : (record.employeeAfp || '—')
  const healthName = record.employeeHealthSystem === 'fonasa' ? 'FONASA' :
    record.employeeHealthSystem === 'isapre' ? 'ISAPRE' : '—'

  const row = (label: string, val: number, red = false) =>
    `<tr><td>${label}</td><td style="text-align:right;font-weight:600;color:${red ? '#c0392b' : 'inherit'}">${red ? '-' : ''}$${val.toLocaleString('es-CL')}</td></tr>`

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Liquidación ${monthName} ${record.periodYear} — ${record.employeeName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 32px; }
  .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:flex-end; }
  .company-name { font-size: 18px; font-weight: 800; }
  .doc-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: #f0f0f0; padding: 4px 8px; margin-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; padding: 0 8px; font-size: 12px; }
  .info-row { display: flex; gap: 6px; } .info-label { color: #666; min-width: 80px; } .info-val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table td { padding: 4px 8px; border-bottom: 1px solid #eee; }
  table td:first-child { width: 70%; }
  .total-row td { border-top: 2px solid #1a1a1a !important; border-bottom: none; font-weight: 700; font-size: 13px; background: #f8f8f8; }
  .net-box { margin: 16px 0; padding: 14px 20px; border: 2px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; }
  .net-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .net-val { font-size: 24px; font-weight: 900; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 11px; color: #666; }
  @media print { body { padding: 16px; } }
</style></head><body>
<div class="header">
  <div>
    <div class="company-name">${COMPANY.name}</div>
    <div style="font-size:11px;color:#666">RUT ${COMPANY.rut} | ${COMPANY.address}, ${COMPANY.city}</div>
  </div>
  <div style="text-align:right">
    <div class="doc-title">Liquidación de Remuneraciones</div>
    <div style="font-size:13px;font-weight:700">${monthName} ${record.periodYear}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Datos del Trabajador</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Nombre:</span><span class="info-val">${record.employeeName}</span></div>
    <div class="info-row"><span class="info-label">RUT:</span><span class="info-val">${record.employeeRut || '—'}</span></div>
    <div class="info-row"><span class="info-label">Cargo:</span><span class="info-val">${record.employeePosition || '—'}</span></div>
    <div class="info-row"><span class="info-label">AFP:</span><span class="info-val">${afpName} (${afpRate})</span></div>
    <div class="info-row"><span class="info-label">Salud:</span><span class="info-val">${healthName} (7%)</span></div>
  </div>
</div>

<div class="two-col">
  <div class="section">
    <div class="section-title">Haberes</div>
    <table><tbody>
      ${row('Sueldo Base', record.grossSalary)}
      ${row('Gratificación Legal (Art. 50 CT)', record.gratificacion)}
      ${record.overtimeAmount > 0 ? row(`Horas Extra (${record.overtimeHours}h × 1.5)`, record.overtimeAmount) : ''}
      ${record.bonuses > 0 ? row('Bonos / Comisiones', record.bonuses) : ''}
      <tr class="total-row"><td>Total Haberes Imponibles</td><td style="text-align:right">$${record.totalHaberesImponibles.toLocaleString('es-CL')}</td></tr>
      ${record.colacion > 0 ? row('Colación (no imponible)', record.colacion) : ''}
      ${record.movilizacion > 0 ? row('Movilización (no imponible)', record.movilizacion) : ''}
      ${record.totalHaberesNoImponibles > 0 ? `<tr class="total-row"><td>Total No Imponibles</td><td style="text-align:right">$${record.totalHaberesNoImponibles.toLocaleString('es-CL')}</td></tr>` : ''}
    </tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Descuentos</div>
    <table><tbody>
      ${row(`AFP ${afpName}`, record.afpEmployee, true)}
      ${row(`Salud ${healthName}`, record.healthEmployee, true)}
      ${record.afcEmployee > 0 ? row('AFC Seguro Cesantía (0.6%)', record.afcEmployee, true) : ''}
      ${record.taxAmount > 0 ? row('Impuesto Único 2ª Categoría', record.taxAmount, true) : ''}
      ${(record.voluntaryDeductions || 0) > 0 ? row('Descuentos Voluntarios', record.voluntaryDeductions!, true) : ''}
      ${(record.otherDeductions || 0) > 0 ? row('Otros Descuentos', record.otherDeductions!, true) : ''}
      <tr class="total-row"><td>Total Descuentos</td><td style="text-align:right;color:#c0392b">-$${record.totalDeductions.toLocaleString('es-CL')}</td></tr>
    </tbody></table>
  </div>
</div>

<div class="net-box">
  <div class="net-label">Sueldo Líquido a Pagar</div>
  <div class="net-val">$${record.netSalary.toLocaleString('es-CL')}</div>
</div>

<div class="section">
  <div class="section-title">Costo Total Empresa</div>
  <table><tbody>
    ${row('Remuneración Bruta + No Imponibles', record.grossSalary + record.gratificacion + record.colacion + record.movilizacion)}
    ${row('SIS Seguro Invalidez y Sobrevivencia (empleador)', record.afpEmployer)}
    ${row('AFC Seguro Cesantía (empleador)', record.afcEmployer)}
    ${row('Mutual de Seguridad', record.mutualEmployer)}
    <tr class="total-row"><td>Total Costo Empresa</td><td style="text-align:right">$${record.totalEmployerCost.toLocaleString('es-CL')}</td></tr>
  </tbody></table>
</div>

<div class="footer">
  <div class="sig-block">
    <br><br><br>
    <div class="sig-line"><strong>${record.employeeName}</strong><br>RUT: ${record.employeeRut || '—'}<br>El/La Trabajador/a</div>
  </div>
  <div class="sig-block">
    <br><br><br>
    <div class="sig-line"><strong>${COMPANY.repName}</strong><br>RUT: ${COMPANY.repRut}<br>${COMPANY.name} — El Empleador</div>
  </div>
</div>

<div style="margin-top:20px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:8px">
  Documento generado por sistema CONNIKU el ${new Date().toLocaleDateString('es-CL')} |
  Periodo: ${monthName} ${record.periodYear} |
  Ley N°19.728 (AFC) · DL 3500 (AFP) · Art. 43 LIR (Impuesto Único)
</div>
</body></html>`
}

// ─── StatCard ───────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

// ─── LiquidacionCard ────────────────────────────────────────────
interface LiquidacionCardProps {
  record: PayrollRecord
  onApprove?: (id: string) => void
  onMarkPaid?: (id: string) => void
  onPrint?: (record: PayrollRecord) => void
  actionLoading?: boolean
}

function LiquidacionCard({ record, onApprove, onMarkPaid, onPrint, actionLoading }: LiquidacionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const statusBadge = {
    paid:     { bg: 'rgba(34,197,94,0.15)',    color: '#22c55e', label: 'Pagado'   },
    approved: { bg: 'rgba(59,130,246,0.15)',   color: '#3b82f6', label: 'Aprobado' },
    draft:    { bg: 'rgba(245,158,11,0.15)',   color: '#f59e0b', label: 'Borrador' },
  }[record.status] ?? { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: record.status }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{record.employeeName || '—'}</div>
          {record.employeeRut && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RUT {record.employeeRut}</div>}
        </div>
        <div style={{ textAlign: 'right', marginRight: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Líquido</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)' }}>${fmt(record.netSalary)}</div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: statusBadge.bg, color: statusBadge.color }}>
          {statusBadge.label}
        </span>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>

      {expanded && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Haberes */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--accent)', textTransform: 'uppercase' }}>Haberes</h4>
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  <tr><td>Sueldo Base</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(record.grossSalary)}</td></tr>
                  <tr><td>Gratificación Legal</td><td style={{ textAlign: 'right' }}>${fmt(record.gratificacion)}</td></tr>
                  {record.overtimeAmount > 0 && <tr><td>Horas Extra ({record.overtimeHours}h)</td><td style={{ textAlign: 'right' }}>${fmt(record.overtimeAmount)}</td></tr>}
                  {record.bonuses > 0 && <tr><td>Bonos</td><td style={{ textAlign: 'right' }}>${fmt(record.bonuses)}</td></tr>}
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ fontWeight: 600 }}>Total Imponible</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(record.totalHaberesImponibles)}</td>
                  </tr>
                  {record.colacion > 0 && <tr><td>Colación</td><td style={{ textAlign: 'right' }}>${fmt(record.colacion)}</td></tr>}
                  {record.movilizacion > 0 && <tr><td>Movilización</td><td style={{ textAlign: 'right' }}>${fmt(record.movilizacion)}</td></tr>}
                  {record.totalHaberesNoImponibles > 0 && (
                    <tr style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ fontWeight: 600 }}>Total No Imponible</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(record.totalHaberesNoImponibles)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Descuentos */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#ef4444', textTransform: 'uppercase' }}>Descuentos</h4>
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  <tr><td>AFP {record.employeeAfp || ''}</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.afpEmployee)}</td></tr>
                  <tr><td>Salud {record.employeeHealthSystem === 'fonasa' ? '(FONASA)' : record.employeeHealthSystem === 'isapre' ? '(ISAPRE)' : ''}</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.healthEmployee)}</td></tr>
                  {record.afcEmployee > 0 && <tr><td>AFC Cesantía</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.afcEmployee)}</td></tr>}
                  {record.taxAmount > 0 && <tr><td>Impuesto Único 2ª Cat.</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.taxAmount)}</td></tr>}
                  {(record.voluntaryDeductions || 0) > 0 && <tr><td>Desc. Voluntarios</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.voluntaryDeductions!)}</td></tr>}
                  {(record.otherDeductions || 0) > 0 && <tr><td>Otros Descuentos</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.otherDeductions!)}</td></tr>}
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ fontWeight: 600 }}>Total Descuentos</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>-${fmt(record.totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net + Employer cost */}
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SUELDO LÍQUIDO</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>${fmt(record.netSalary)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>COSTO EMPRESA</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>${fmt(record.totalEmployerCost)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                SIS ${fmt(record.afpEmployer)} + AFC ${fmt(record.afcEmployer)} + Mutual ${fmt(record.mutualEmployer)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {onPrint && (
              <button style={{ ...btnSmall }} onClick={() => onPrint(record)}>
                <Printer size={13} /> PDF
              </button>
            )}
            {record.status === 'draft' && onApprove && (
              <button
                disabled={actionLoading}
                style={{ ...btnSmall, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                onClick={() => onApprove(record.id)}
              >
                <CheckCircle size={13} /> Aprobar
              </button>
            )}
            {record.status === 'approved' && onMarkPaid && (
              <button
                disabled={actionLoading}
                style={{ ...btnSmall, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                onClick={() => onMarkPaid(record.id)}
              >
                <CreditCard size={13} /> Marcar Pagado
              </button>
            )}
            {record.status === 'paid' && (
              <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={13} /> Pagado{record.paidAt ? ` el ${new Date(record.paidAt).toLocaleDateString('es-CL')}` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// REMUNERACIONES TAB
// ═════════════════════════════════════════════════════════════════
interface RemuneracionesTabProps {
  month?: number
  year?: number
}

interface EmployeeOverride {
  overtimeHours: number
  bonuses: number
}

export default function RemuneracionesTab({ month: propMonth, year: propYear }: RemuneracionesTabProps) {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(propMonth ?? new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(propYear ?? new Date().getFullYear())
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [overrides, setOverrides] = useState<Record<string, EmployeeOverride>>({})
  const [calculating, setCalculating] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    const [empData, payrollData] = await Promise.all([
      api.getEmployees().catch(() => []),
      api.getPayroll(selectedYear, selectedMonth).catch(() => []),
    ])
    setEmployees(empData || [])
    setPayroll(payrollData || [])
    setLoading(false)
  }, [selectedMonth, selectedYear])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (propMonth !== undefined) setSelectedMonth(propMonth) }, [propMonth])
  useEffect(() => { if (propYear !== undefined) setSelectedYear(propYear) }, [propYear])

  const handleCalculate = async () => {
    setCalculating(true)
    setError('')
    try {
      // Build overrides payload for backend
      const overridesPayload: Record<string, { overtime_hours: number; bonuses: number }> = {}
      for (const [empId, ov] of Object.entries(overrides)) {
        if (ov.overtimeHours > 0 || ov.bonuses > 0) {
          overridesPayload[empId] = { overtime_hours: ov.overtimeHours, bonuses: ov.bonuses }
        }
      }
      await api.calculatePayroll(selectedMonth, selectedYear, overridesPayload as any)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Error al calcular nómina')
    }
    setCalculating(false)
  }

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    try { await api.approvePayroll(id); await loadData() }
    catch (err: any) { setError(err.message || 'Error al aprobar') }
    setActionLoading(false)
  }

  const handleMarkPaid = async (id: string) => {
    setActionLoading(true)
    try { await api.markPayrollPaid(id); await loadData() }
    catch (err: any) { setError(err.message || 'Error al marcar como pagado') }
    setActionLoading(false)
  }

  const handleApproveAll = async () => {
    const drafts = payroll.filter(p => p.status === 'draft')
    if (!drafts.length) return
    setActionLoading(true)
    for (const p of drafts) {
      try { await api.approvePayroll(p.id) } catch {}
    }
    await loadData()
    setActionLoading(false)
  }

  const printLiquidacion = (record: PayrollRecord) => {
    const w = window.open('', '_blank', 'width=900,height=950')
    if (!w) return
    w.document.write(generateLiquidacionHTML(record))
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  const printAll = () => {
    payroll.forEach(r => printLiquidacion(r))
  }

  const setOverride = (empId: string, field: keyof EmployeeOverride, val: number) => {
    setOverrides(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || { overtimeHours: 0, bonuses: 0 }), [field]: val },
    }))
  }

  const draftCount = payroll.filter(p => p.status === 'draft').length
  const approvedCount = payroll.filter(p => p.status === 'approved').length
  const paidCount = payroll.filter(p => p.status === 'paid').length

  const activeEmployees = employees.filter(e => e.status === 'active' && e.contractType !== 'honorarios')

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  return (
    <div>
      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Periodo:</label>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
        >
          {MONTHS.slice(1).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
        >
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {loading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando...</span>}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* ─── Overrides table (before calculating) ─── */}
      {payroll.length === 0 && activeEmployees.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> Variables por Empleado — {MONTHS[selectedMonth]} {selectedYear}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Ingresa horas extra y bonos antes de calcular. Deja en 0 si no aplica.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>Empleado</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>Sueldo Base</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>Horas Extra</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>Bonos ($)</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.position}</div>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>${fmt(emp.grossSalary)}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <input
                      type="number" min={0} step={0.5}
                      value={overrides[emp.id]?.overtimeHours ?? 0}
                      onChange={e => setOverride(emp.id, 'overtimeHours', Number(e.target.value))}
                      style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
                    />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <input
                      type="number" min={0} step={1000}
                      value={overrides[emp.id]?.bonuses ?? 0}
                      onChange={e => setOverride(emp.id, 'bonuses', Number(e.target.value))}
                      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleCalculate} disabled={calculating || loading} style={btnPrimary}>
          <Calculator size={16} /> {calculating ? 'Calculando...' : payroll.length > 0 ? 'Recalcular (borradores)' : 'Calcular Nómina'}
        </button>
        {draftCount > 0 && (
          <button onClick={handleApproveAll} disabled={actionLoading} style={{ ...btnSecondary, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
            <CheckCircle size={16} /> Aprobar Todo ({draftCount})
          </button>
        )}
        {payroll.length > 0 && (
          <button onClick={printAll} style={btnSecondary}>
            <Printer size={16} /> Exportar PDF ({payroll.length})
          </button>
        )}
        {payroll.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            {draftCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} style={{ color: '#f59e0b' }} /> {draftCount} borrador{draftCount > 1 ? 'es' : ''}</span>}
            {approvedCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} style={{ color: '#3b82f6' }} /> {approvedCount} aprobado{approvedCount > 1 ? 's' : ''}</span>}
            {paidCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CreditCard size={12} style={{ color: '#22c55e' }} /> {paidCount} pagado{paidCount > 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {payroll.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Calculator size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={{ marginBottom: 8 }}>Sin liquidaciones para {MONTHS[selectedMonth]} {selectedYear}</h3>
          {activeEmployees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay empleados activos registrados.</p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {activeEmployees.length} empleado{activeEmployees.length > 1 ? 's' : ''} activo{activeEmployees.length > 1 ? 's' : ''}.
              Ingresa variables arriba y presiona <strong>Calcular Nómina</strong>.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <StatCard icon={DollarSign} label="Total Bruto" value={`$${fmt(payroll.reduce((s, p) => s + p.grossSalary, 0))}`} color="#3b82f6" />
            <StatCard icon={Minus} label="Total Descuentos" value={`$${fmt(payroll.reduce((s, p) => s + p.totalDeductions, 0))}`} color="#ef4444" />
            <StatCard icon={CreditCard} label="Total Líquido" value={`$${fmt(payroll.reduce((s, p) => s + p.netSalary, 0))}`} color="#22c55e" />
            <StatCard icon={Building} label="Costo Empresa" value={`$${fmt(payroll.reduce((s, p) => s + p.totalEmployerCost, 0))}`} color="#f59e0b" />
          </div>

          {/* Individual liquidaciones */}
          {payroll.map(record => (
            <LiquidacionCard
              key={record.id}
              record={record}
              onApprove={handleApprove}
              onMarkPaid={handleMarkPaid}
              onPrint={printLiquidacion}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Legal reference */}
      <div className="card" style={{ padding: 16, marginTop: 20, borderLeft: '4px solid var(--accent)' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Conceptos Legales</h4>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <span><strong>Gratificación:</strong> Art. 47 CT — 25% sueldo, tope 4.75 IMM/año</span>
          <span><strong>Horas Extra:</strong> Art. 32 CT — Recargo 50% sobre hora ordinaria</span>
          <span><strong>Colación / Movilización:</strong> No imponible, no tributable</span>
          <span><strong>AFP:</strong> 10% cotización obligatoria + comisión variable</span>
          <span><strong>Salud:</strong> 7% cotización legal mínima (Fonasa o Isapre)</span>
          <span><strong>AFC:</strong> Ley 19.728 — Seguro Cesantía</span>
          <span><strong>SIS:</strong> Seguro Invalidez y Sobrevivencia — cargo empleador</span>
          <span><strong>Impuesto:</strong> Único 2ª Categoría — Art. 43 LIR, escala UTM</span>
        </div>
      </div>
    </div>
  )
}
