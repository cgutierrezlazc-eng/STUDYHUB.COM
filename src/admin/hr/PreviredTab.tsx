import React, { useState, useEffect } from 'react'
import {
  Building, Shield, Users, AlertTriangle, Download, Globe
} from 'lucide-react'
import { PreviredData } from '../shared/types'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, thStyle, tdStyle, fmt } from '../shared/styles'

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

// ─── Previred CSV download ───────────────────────────────────────
function downloadPrevired(data: PreviredData, month: number, year: number, months: string[]) {
  const lines: string[] = [
    'RUT;NOMBRE;AFP;MONTO_AFP;SALUD;MONTO_SALUD;AFC_TRABAJADOR;AFC_EMPLEADOR;SIS;MUTUAL;RENTA_IMPONIBLE',
  ]
  for (const emp of data.employees) {
    lines.push([
      emp.rut,
      emp.name,
      emp.afp,
      Math.round(emp.afpAmount),
      emp.healthSystem,
      Math.round(emp.healthAmount),
      Math.round(emp.afcEmployee),
      Math.round(emp.afcEmployer),
      Math.round(emp.sis),
      Math.round(emp.mutual),
      Math.round(emp.taxableIncome),
    ].join(';'))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Previred_${months[month]}_${year}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ═════════════════════════════════════════════════════════════════
// PREVIRED TAB
// ═════════════════════════════════════════════════════════════════
interface PreviredTabProps {
  month?: number
  year?: number
}

export default function PreviredTab({ month: propMonth, year: propYear }: PreviredTabProps) {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(propMonth ?? new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(propYear ?? new Date().getFullYear())
  const [data, setData] = useState<PreviredData | null>(null)
  const [loading, setLoading] = useState(false)

  const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const loadPrevired = async () => {
    setLoading(true)
    try {
      const result = await api.getPrevired(selectedYear, selectedMonth)
      setData(result || null)
    } catch {
      setData(null)
    }
    setLoading(false)
  }

  useEffect(() => { loadPrevired() }, [selectedMonth, selectedYear])

  // Sync with prop changes
  useEffect(() => { if (propMonth !== undefined) setSelectedMonth(propMonth) }, [propMonth])
  useEffect(() => { if (propYear !== undefined) setSelectedYear(propYear) }, [propYear])

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

      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1e3a5f, #2d62c8)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={20} /> Consolidado Previred — {months[selectedMonth]} {selectedYear}
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Resumen de cotizaciones previsionales para declaracion y pago en previred.com. Plazo: hasta el dia 13 del mes siguiente.
        </p>
      </div>

      {!data || !data.employees?.length ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Building size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>Sin datos de Previred</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Primero calcula la nomina del periodo en la pestana "Remuneraciones".
          </p>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatCard icon={Building} label="Total AFP" value={`$${fmt(data.totals.totalAfp)}`} color="#3b82f6" />
            <StatCard icon={Shield} label="Total Salud" value={`$${fmt(data.totals.totalHealth)}`} color="#22c55e" />
            <StatCard icon={Users} label="AFC Trabajador" value={`$${fmt(data.totals.totalAfcEmployee)}`} color="#f59e0b" />
            <StatCard icon={Building} label="AFC Empleador" value={`$${fmt(data.totals.totalAfcEmployer)}`} color="#8b5cf6" />
            <StatCard icon={Shield} label="SIS" value={`$${fmt(data.totals.totalSis)}`} color="#ec4899" />
            <StatCard icon={AlertTriangle} label="Mutual" value={`$${fmt(data.totals.totalMutual)}`} color="#6366f1" />
          </div>

          {/* Detail table */}
          <div className="card" style={{ padding: 16, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={thStyle}>RUT</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>AFP</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto AFP</th>
                  <th style={thStyle}>Salud</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto Salud</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>AFC Trab.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>AFC Emp.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>SIS</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Mutual</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Renta Imp.</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{emp.rut}</td>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={tdStyle}>{emp.afp}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.afpAmount)}</td>
                    <td style={tdStyle}>{emp.healthSystem}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.healthAmount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.afcEmployee)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.afcEmployer)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.sis)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.mutual)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>${fmt(emp.taxableIncome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button style={btnPrimary} onClick={() => downloadPrevired(data, selectedMonth, selectedYear, months)}>
              <Download size={16} /> Descargar Planilla Previred
            </button>
            <button style={btnSecondary} onClick={() => window.open('https://previred.com', '_blank')}>
              <Globe size={16} /> Ir a Previred.com
            </button>
          </div>

          {/* Instructions */}
          <div className="card" style={{ padding: 16, marginTop: 20, borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Pasos para Pagar en Previred</h4>
            <ol style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 20 }}>
              <li>Ingresa a <strong>previred.com</strong> con tus credenciales de empleador</li>
              <li>Selecciona "Declaracion y Pago de Cotizaciones"</li>
              <li>Sube la planilla generada o ingresa los datos manualmente</li>
              <li>Verifica que los montos coincidan con esta pantalla</li>
              <li>Selecciona medio de pago (PAC, transferencia, tarjeta)</li>
              <li>Confirma y guarda el comprobante de pago</li>
              <li><strong>Plazo limite:</strong> Dia 13 del mes siguiente al periodo</li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
