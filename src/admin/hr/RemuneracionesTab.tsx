import React, { useState, useEffect } from 'react'
import {
  DollarSign, Calculator, Download, Minus, CreditCard, Building,
  ChevronDown, ChevronRight
} from 'lucide-react'
import { Employee, PayrollRecord } from '../shared/types'
import { CHILE_LABOR, calculateTax } from '../shared/ChileLaborConstants'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, fmt } from '../shared/styles'

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
function LiquidacionCard({ record }: { record: PayrollRecord }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{record.employeeName}</div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Liquido</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)' }}>${fmt(record.netSalary)}</div>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
          background: record.status === 'paid' ? 'rgba(34,197,94,0.15)' : record.status === 'approved' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
          color: record.status === 'paid' ? '#22c55e' : record.status === 'approved' ? '#3b82f6' : '#f59e0b',
        }}>
          {record.status === 'paid' ? 'Pagado' : record.status === 'approved' ? 'Aprobado' : 'Borrador'}
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
                  <tr><td>Gratificacion Legal</td><td style={{ textAlign: 'right' }}>${fmt(record.gratificacion)}</td></tr>
                  {record.overtimeAmount > 0 && <tr><td>Horas Extra ({record.overtimeHours}h)</td><td style={{ textAlign: 'right' }}>${fmt(record.overtimeAmount)}</td></tr>}
                  {record.bonuses > 0 && <tr><td>Bonos</td><td style={{ textAlign: 'right' }}>${fmt(record.bonuses)}</td></tr>}
                  <tr style={{ borderTop: '1px solid var(--border)' }}><td style={{ fontWeight: 600 }}>Total Imponible</td><td style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(record.totalHaberesImponibles)}</td></tr>
                  {(record.colacion > 0 || record.movilizacion > 0) && (
                    <>
                      {record.colacion > 0 && <tr><td>Colacion</td><td style={{ textAlign: 'right' }}>${fmt(record.colacion)}</td></tr>}
                      {record.movilizacion > 0 && <tr><td>Movilizacion</td><td style={{ textAlign: 'right' }}>${fmt(record.movilizacion)}</td></tr>}
                      <tr style={{ borderTop: '1px solid var(--border)' }}><td style={{ fontWeight: 600 }}>Total No Imponible</td><td style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(record.totalHaberesNoImponibles)}</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Descuentos */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#ef4444', textTransform: 'uppercase' }}>Descuentos</h4>
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  <tr><td>AFP</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.afpEmployee)}</td></tr>
                  <tr><td>Salud</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.healthEmployee)}</td></tr>
                  <tr><td>AFC</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.afcEmployee)}</td></tr>
                  <tr><td>Impuesto Unico</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-${fmt(record.taxAmount)}</td></tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}><td style={{ fontWeight: 600 }}>Total Descuentos</td><td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>-${fmt(record.totalDeductions)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SUELDO LIQUIDO</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>${fmt(record.netSalary)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>COSTO EMPRESA</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>${fmt(record.totalEmployerCost)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                (SIS: ${fmt(record.afpEmployer)} + AFC emp: ${fmt(record.afcEmployer)} + Mutual: ${fmt(record.mutualEmployer)})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// REMUNERACIONES TAB (Liquidaciones)
// ═════════════════════════════════════════════════════════════════
interface RemuneracionesTabProps {
  month?: number
  year?: number
}

export default function RemuneracionesTab({ month: propMonth, year: propYear }: RemuneracionesTabProps) {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(propMonth ?? new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(propYear ?? new Date().getFullYear())
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [calculating, setCalculating] = useState(false)
  const [loading, setLoading] = useState(false)

  const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const loadData = async () => {
    setLoading(true)
    try {
      const [empData, payrollData] = await Promise.all([
        api.getEmployees(),
        api.getPayroll(selectedYear, selectedMonth),
      ])
      setEmployees(empData || [])
      setPayroll(payrollData || [])
    } catch {
      setEmployees([])
      setPayroll([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [selectedMonth, selectedYear])

  // Sync with prop changes
  useEffect(() => { if (propMonth !== undefined) setSelectedMonth(propMonth) }, [propMonth])
  useEffect(() => { if (propYear !== undefined) setSelectedYear(propYear) }, [propYear])

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      await api.calculatePayroll(selectedMonth, selectedYear)
      loadData()
    } catch (err) {
      alert('Error al calcular nomina')
    }
    setCalculating(false)
  }

  return (
    <div>
      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Periodo:</label>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
        >
          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={handleCalculate} disabled={calculating} style={btnPrimary}>
          <Calculator size={16} /> {calculating ? 'Calculando...' : 'Calcular Nomina'}
        </button>
        <button style={btnSecondary}><Download size={16} /> Exportar PDF</button>
      </div>

      {payroll.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Calculator size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>Sin liquidaciones para {months[selectedMonth]} {selectedYear}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Presiona "Calcular Nomina" para generar las liquidaciones del periodo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <StatCard icon={DollarSign} label="Total Bruto" value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.grossSalary, 0))}`} color="#3b82f6" />
            <StatCard icon={Minus} label="Total Descuentos" value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.totalDeductions, 0))}`} color="#ef4444" />
            <StatCard icon={CreditCard} label="Total Liquido" value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.netSalary, 0))}`} color="#22c55e" />
            <StatCard icon={Building} label="Costo Empresa" value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.totalEmployerCost, 0))}`} color="#f59e0b" />
          </div>

          {/* Individual liquidaciones */}
          {payroll.map((record: PayrollRecord) => (
            <LiquidacionCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {/* Legal info */}
      <div className="card" style={{ padding: 16, marginTop: 20, borderLeft: '4px solid var(--accent)' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Conceptos Legales de la Liquidacion</h4>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <span><strong>Gratificacion Legal:</strong> Art. 47 CT — 25% sueldo, tope 4.75 IMM/ano</span>
          <span><strong>Horas Extra:</strong> Art. 32 CT — Recargo 50% sobre hora ordinaria</span>
          <span><strong>Colacion:</strong> No imponible, no tributable</span>
          <span><strong>Movilizacion:</strong> No imponible, no tributable</span>
          <span><strong>AFP:</strong> 10% cotizacion obligatoria + comision variable</span>
          <span><strong>Salud:</strong> 7% cotizacion legal minima</span>
          <span><strong>AFC:</strong> Seguro de cesantia Ley 19.728</span>
          <span><strong>Impuesto:</strong> Impuesto Unico de 2da Categoria, Art. 43 LIR</span>
        </div>
      </div>
    </div>
  )
}
