import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { OperationalExpense } from '../shared/types'
import { EXPENSE_CATEGORIES } from '../shared/constants'
import { btnPrimary, btnSecondary, grid2, fmt } from '../shared/styles'
import {
  Receipt, Calculator, CheckCircle, FileText, Plus, Download,
} from 'lucide-react'

// ─── Inline shared components ───
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

function FormField({ label, value, onChange, type = 'text', placeholder, required }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          color: 'var(--text-primary)', fontSize: 13,
        }}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] | string[] }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          color: 'var(--text-primary)', fontSize: 13,
        }}
      >
        {options.map((opt: any) => (
          <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
    </div>
  )
}

export default function GastosTab() {
  const now = new Date()
  const [expenses, setExpenses] = useState<OperationalExpense[]>([])
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showAdd, setShowAdd] = useState(false)

  const loadExpenses = () => {
    api.getExpenses(`month=${month}&year=${year}`)
      .then((data: any) => setExpenses(Array.isArray(data) ? data : []))
      .catch(() => setExpenses([]))
  }

  useEffect(() => { loadExpenses() }, [month, year])
  const [form, setForm] = useState<any>({
    category: 'suscripcion', description: '', amountClp: 0, amountUsd: null,
    providerName: '', providerRut: '', documentNumber: '', documentType: 'factura',
    taxDeductible: true, ivaAmount: null, periodMonth: month, periodYear: year,
    recurring: false, recurringFrequency: 'monthly',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.createExpense(form)
      setShowAdd(false)
      loadExpenses()
    } catch { alert('Error al guardar gasto') }
    setSaving(false)
  }

  const totalByCategory = expenses.reduce((acc: any, exp: OperationalExpense) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amountClp
    return acc
  }, {} as Record<string, number>)

  const totalExpenses = expenses.reduce((s: number, e: OperationalExpense) => s + e.amountClp, 0)
  const totalIva = expenses.reduce((s: number, e: OperationalExpense) => s + (e.ivaAmount || 0), 0)
  const totalDeductible = expenses.filter((e: OperationalExpense) => e.taxDeductible).reduce((s: number, e: OperationalExpense) => s + e.amountClp, 0)

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard icon={Receipt} label="Total Gastos" value={`$${fmt(totalExpenses)}`} color="#ef4444" />
        <StatCard icon={Calculator} label="IVA Credito Fiscal" value={`$${fmt(totalIva)}`} color="#3b82f6" />
        <StatCard icon={CheckCircle} label="Total Deducible" value={`$${fmt(totalDeductible)}`} color="#22c55e" />
        <StatCard icon={FileText} label="N° Gastos" value={expenses.length} color="#8b5cf6" />
      </div>

      {/* Add button */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setForm({ ...form, periodMonth: month, periodYear: year }); setShowAdd(true) }} style={btnPrimary}>
          <Plus size={16} /> Agregar Gasto
        </button>
        <button style={btnSecondary}><Download size={16} /> Exportar Excel</button>
      </div>

      {/* By Category */}
      {Object.keys(totalByCategory).length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Gastos por Categoria</h4>
          {Object.entries(totalByCategory).sort(([, a]: any, [, b]: any) => b - a).map(([cat, amount]: any) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{EXPENSE_CATEGORIES.find(c => c.value === cat)?.label || cat}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>${fmt(amount)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 50, textAlign: 'right' }}>
                {totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expenses List */}
      <div style={{ display: 'grid', gap: 8 }}>
        {expenses.map((exp: OperationalExpense) => (
          <div key={exp.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Receipt size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{exp.description}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label} • {exp.providerName} • {exp.documentType} #{exp.documentNumber}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>${fmt(exp.amountClp)}</div>
              {exp.ivaAmount && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>IVA: ${fmt(exp.ivaAmount)}</div>}
            </div>
            {exp.taxDeductible && (
              <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                DEDUCIBLE
              </span>
            )}
            {exp.recurring && (
              <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                RECURRENTE
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Suggested expenses for tech company */}
      {expenses.length === 0 && (
        <div className="card" style={{ padding: 20, marginTop: 16, borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Gastos Comunes para Empresas de Tecnologia</h4>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
            <p><strong>Suscripciones:</strong> Vercel, Render, GitHub, Anthropic API, Google Cloud, dominios, Figma</p>
            <p><strong>Infraestructura:</strong> Hosting, bases de datos, CDN, certificados SSL</p>
            <p><strong>Arriendo:</strong> Oficina, cowork, o espacio en casa (proporcional)</p>
            <p><strong>Servicios:</strong> Internet, electricidad (proporcional si es home office)</p>
            <p><strong>Legal:</strong> Abogado, notaria, escrituras, registro de marca</p>
            <p><strong>Contabilidad:</strong> Contador, software contable, declaraciones</p>
            <p><strong>Marketing:</strong> Google Ads, redes sociales, diseno</p>
            <p><strong>Equipamiento:</strong> Computadores, monitores, perifericos (depreciacion)</p>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Receipt size={22} /> Registrar Gasto
            </h2>

            <div style={grid2}>
              <SelectField label="Categoria" value={form.category} onChange={v => setForm({ ...form, category: v })} options={EXPENSE_CATEGORIES} />
              <FormField label="Descripcion" value={form.description} onChange={v => setForm({ ...form, description: v })} required />
              <FormField label="Monto CLP" value={form.amountClp} onChange={v => setForm({ ...form, amountClp: Number(v) })} type="number" required />
              <FormField label="Monto USD (opcional)" value={form.amountUsd || ''} onChange={v => setForm({ ...form, amountUsd: v ? Number(v) : null })} type="number" />
              <FormField label="Proveedor" value={form.providerName} onChange={v => setForm({ ...form, providerName: v })} />
              <FormField label="RUT Proveedor" value={form.providerRut} onChange={v => setForm({ ...form, providerRut: v })} placeholder="76.xxx.xxx-x" />
              <SelectField label="Tipo Documento" value={form.documentType} onChange={v => setForm({ ...form, documentType: v })} options={[
                { value: 'factura', label: 'Factura Electronica' },
                { value: 'boleta', label: 'Boleta' },
                { value: 'boleta_honorarios', label: 'Boleta de Honorarios' },
                { value: 'recibo', label: 'Recibo/Comprobante' },
                { value: 'nota_credito', label: 'Nota de Credito' },
              ]} />
              <FormField label="N° Documento" value={form.documentNumber} onChange={v => setForm({ ...form, documentNumber: v })} />
              <FormField label="IVA (CLP)" value={form.ivaAmount || ''} onChange={v => setForm({ ...form, ivaAmount: v ? Number(v) : null })} type="number" />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.taxDeductible} onChange={e => setForm({ ...form, taxDeductible: e.target.checked })} />
                Deducible de impuestos
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} />
                Gasto recurrente
              </label>
            </div>

            {form.recurring && (
              <SelectField label="Frecuencia" value={form.recurringFrequency} onChange={v => setForm({ ...form, recurringFrequency: v })} options={[
                { value: 'monthly', label: 'Mensual' }, { value: 'quarterly', label: 'Trimestral' }, { value: 'yearly', label: 'Anual' },
              ]} />
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={btnSecondary}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? 'Guardando...' : 'Guardar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
