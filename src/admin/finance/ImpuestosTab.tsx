import React, { useState, useEffect } from 'react'
import { OperationalExpense } from '../shared/types'
import { fmt, thStyle, tdStyle } from '../shared/styles'
import { Calculator, FileText } from 'lucide-react'
import { api } from '../../services/api'

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function ImpuestosTab() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [expenses, setExpenses] = useState<OperationalExpense[]>([])

  useEffect(() => {
    api.getExpenses(`month=${month}&year=${year}`)
      .then((data: any) => setExpenses(Array.isArray(data) ? data : []))
      .catch(() => setExpenses([]))
  }, [year, month])
  const totalIngresos = 0 // Would come from payment data
  const totalGastos = expenses.reduce((s, e) => s + e.amountClp, 0)
  const totalIvaCredito = expenses.reduce((s, e) => s + (e.ivaAmount || 0), 0)
  const totalDeducible = expenses.filter(e => e.taxDeductible).reduce((s, e) => s + e.amountClp, 0)

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1a2332, #2d62c8)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={20} /> Centro Tributario — {year}
        </h3>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13 }}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1} style={{ color: '#000' }}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13 }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ color: '#000' }}>{y}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Consolidacion de ingresos y gastos para declaraciones mensuales (F29) y anuales (F22) ante el SII.
        </p>
      </div>

      {/* F29 Monthly */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> Formulario 29 — Declaracion Mensual de IVA
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Debitos (Ventas)</h4>
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                <tr><td>Ventas con boleta</td><td style={{ textAlign: 'right' }}>$0</td></tr>
                <tr><td>Ventas con factura</td><td style={{ textAlign: 'right' }}>$0</td></tr>
                <tr><td>Ventas de exportacion</td><td style={{ textAlign: 'right' }}>$0</td></tr>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td>Total Debito IVA (19%)</td><td style={{ textAlign: 'right' }}>$0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Creditos (Compras)</h4>
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                <tr><td>Compras con factura</td><td style={{ textAlign: 'right' }}>${fmt(totalGastos)}</td></tr>
                <tr><td>IVA Credito Fiscal</td><td style={{ textAlign: 'right', color: '#22c55e' }}>${fmt(totalIvaCredito)}</td></tr>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td>Total Credito IVA</td><td style={{ textAlign: 'right', color: '#22c55e' }}>${fmt(totalIvaCredito)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>IVA A PAGAR / (A FAVOR)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: totalIvaCredito > 0 ? '#22c55e' : 'var(--text-primary)' }}>
            ${fmt(Math.abs(0 - totalIvaCredito))} {totalIvaCredito > 0 ? '(Remanente a favor)' : ''}
          </div>
        </div>
      </div>

      {/* F129 */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> Formulario 129 — Compras y Ventas
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          El F129 es un anexo del F29 donde se detallan las compras y ventas del periodo. Se genera automaticamente con los gastos registrados.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>RUT Proveedor</th>
                <th style={thStyle}>Proveedor</th>
                <th style={thStyle}>Documento</th>
                <th style={thStyle}>N°</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Neto</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>IVA</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>Compra</td>
                  <td style={tdStyle}>{exp.providerRut || '-'}</td>
                  <td style={tdStyle}>{exp.providerName}</td>
                  <td style={tdStyle}>{exp.documentType}</td>
                  <td style={tdStyle}>{exp.documentNumber}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(exp.amountClp - (exp.ivaAmount || 0))}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(exp.ivaAmount || 0)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>${fmt(exp.amountClp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* F22 Annual */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> Formulario 22 — Renta Anual (Abril)
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          La declaracion de renta anual se presenta en abril. Aqui se consolidan los ingresos y gastos del ano anterior.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>Regimen Tributario Recomendado</h4>
            <div className="card" style={{ padding: 12, background: 'var(--bg-tertiary)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Pro Pyme General (14D N°3)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <p>Tasa: 25% sobre renta liquida imponible</p>
                <p>Beneficio: Depreciacion instantanea de activos fijos</p>
                <p>PPM (Pago Provisional Mensual): 0.25% de ventas</p>
                <p>Ideal para empresas con ventas &lt; 75,000 UF anuales</p>
              </div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>Gastos Deducibles Anuales</h4>
            <div className="card" style={{ padding: 12, background: 'var(--bg-tertiary)' }}>
              <table style={{ width: '100%', fontSize: 12 }}>
                <tbody>
                  <tr><td>Remuneraciones</td><td style={{ textAlign: 'right' }}>$0</td></tr>
                  <tr><td>Cotizaciones previsionales</td><td style={{ textAlign: 'right' }}>$0</td></tr>
                  <tr><td>Gastos operacionales</td><td style={{ textAlign: 'right' }}>${fmt(totalDeducible)}</td></tr>
                  <tr><td>Depreciacion activos</td><td style={{ textAlign: 'right' }}>$0</td></tr>
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                    <td>Total Gastos Deducibles</td><td style={{ textAlign: 'right' }}>${fmt(totalDeducible)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines */}
      <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Plazos Tributarios Importantes</h4>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p><strong>Dia 12 de cada mes:</strong> Declaracion y pago F29 (IVA + PPM + retenciones)</p>
          <p><strong>Dia 13 de cada mes:</strong> Pago cotizaciones en Previred</p>
          <p><strong>Abril:</strong> Declaracion de Renta Anual (F22)</p>
          <p><strong>Marzo:</strong> Declaraciones Juradas (DJ 1887 remuneraciones, DJ 1879 honorarios)</p>
          <p><strong>Permanente:</strong> Emision de DTE (Documentos Tributarios Electronicos) en sii.cl</p>
        </div>
      </div>
    </div>
  )
}
