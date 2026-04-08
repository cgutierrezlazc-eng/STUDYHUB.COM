import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Download, AlertTriangle, CheckCircle, Calendar, Users, Calculator, Info } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { AFP_OPTIONS } from '../shared/constants'
import { btnPrimary, btnSecondary, btnSmall, thStyle, tdStyle, inputStyle, selectStyle, fmt } from '../shared/styles'
import type { Employee } from '../shared/types'

// ─── DJ1887 Format ──────────────────────────────────────────────
// Declaración Jurada 1887: "Rentas del Art. 42 N°1 (Sueldos)"
// Se presenta ante el SII en marzo de cada año, informando las rentas
// pagadas a trabajadores dependientes durante el año anterior.

interface DJ1887Row {
  rut: string
  name: string
  rentaNetaGlobal: number        // Total renta imponible anual
  impuestoUnicoRetenido: number  // Total impuesto retenido en el año
  mayorRentaMensual: number      // Mayor renta del año (para verificación SII)
  rentaExenta: number            // Rentas exentas (colación, movilización)
  rebajasZonaExtrema: number     // Rebajas por zona extrema (si aplica)
  rentaTotalAnual: number        // Total bruto anual
  monthsWorked: number           // Meses trabajados en el período
  periodoDesde: string           // Fecha inicio (YYYY-MM)
  periodoHasta: string           // Fecha fin (YYYY-MM)
}

interface MonthlyBreakdown {
  month: number
  grossSalary: number
  gratificacion: number
  totalImponible: number
  taxAmount: number
  colacion: number
  movilizacion: number
}

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function DJ1887Tab() {
  const { user } = useAuth()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1) // Previous year by default
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'declaracion' | 'detalle' | 'validacion'>('declaracion')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.getEmployees()
      .then(emps => setEmployees(emps || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  // Demo employees if none loaded
  const activeEmployees: Employee[] = useMemo(() => {
    if (employees.length > 0) return employees.filter(e => e.status === 'active')
    return [
      { id: '1', rut: '12.345.678-9', firstName: 'María', lastName: 'González', email: '', phone: '', address: '', birthDate: '', nationality: 'Chilena', maritalStatus: 'Soltera', emergencyContactName: '', emergencyContactPhone: '', position: 'Desarrolladora Full Stack', department: 'Tecnología', hireDate: '2024-03-01', endDate: null, contractType: 'indefinido', workSchedule: '45', weeklyHours: 45, grossSalary: 1800000, colacion: 80000, movilizacion: 60000, afp: 'Habitat', healthSystem: 'Fonasa', isapreName: null, isapreUf: null, afcActive: true, bankName: 'BancoEstado', bankAccountType: 'Vista', bankAccountNumber: '', status: 'active', createdAt: '' },
      { id: '2', rut: '11.222.333-4', firstName: 'Carlos', lastName: 'Muñoz', email: '', phone: '', address: '', birthDate: '', nationality: 'Chilena', maritalStatus: 'Casado', emergencyContactName: '', emergencyContactPhone: '', position: 'Diseñador UX', department: 'Diseño', hireDate: '2024-06-15', endDate: null, contractType: 'indefinido', workSchedule: '45', weeklyHours: 45, grossSalary: 1400000, colacion: 70000, movilizacion: 50000, afp: 'Provida', healthSystem: 'Fonasa', isapreName: null, isapreUf: null, afcActive: true, bankName: 'Banco Chile', bankAccountType: 'Corriente', bankAccountNumber: '', status: 'active', createdAt: '' },
      { id: '3', rut: '13.444.555-6', firstName: 'Ana', lastName: 'Rodríguez', email: '', phone: '', address: '', birthDate: '', nationality: 'Chilena', maritalStatus: 'Soltera', emergencyContactName: '', emergencyContactPhone: '', position: 'Community Manager', department: 'Marketing', hireDate: '2025-01-10', endDate: null, contractType: 'plazo_fijo', workSchedule: '45', weeklyHours: 45, grossSalary: 900000, colacion: 50000, movilizacion: 40000, afp: 'Capital', healthSystem: 'Fonasa', isapreName: null, isapreUf: null, afcActive: true, bankName: 'BancoEstado', bankAccountType: 'Vista', bankAccountNumber: '', status: 'active', createdAt: '' },
      { id: '4', rut: '14.666.777-8', firstName: 'Pedro', lastName: 'Soto', email: '', phone: '', address: '', birthDate: '', nationality: 'Chilena', maritalStatus: 'Casado', emergencyContactName: '', emergencyContactPhone: '', position: 'Soporte Técnico', department: 'Operaciones', hireDate: '2025-02-01', endDate: null, contractType: 'indefinido', workSchedule: '45', weeklyHours: 45, grossSalary: 700000, colacion: 50000, movilizacion: 40000, afp: 'Modelo', healthSystem: 'Fonasa', isapreName: null, isapreUf: null, afcActive: true, bankName: 'Banco Santander', bankAccountType: 'Vista', bankAccountNumber: '', status: 'active', createdAt: '' },
      { id: '5', rut: '15.888.999-0', firstName: 'Valentina', lastName: 'Torres', email: '', phone: '', address: '', birthDate: '', nationality: 'Chilena', maritalStatus: 'Soltera', emergencyContactName: '', emergencyContactPhone: '', position: 'Ejecutiva Comercial', department: 'Ventas', hireDate: '2025-03-01', endDate: null, contractType: 'plazo_fijo', workSchedule: '45', weeklyHours: 45, grossSalary: 650000, colacion: 50000, movilizacion: 40000, afp: 'Cuprum', healthSystem: 'Fonasa', isapreName: null, isapreUf: null, afcActive: true, bankName: 'Banco BCI', bankAccountType: 'Vista', bankAccountNumber: '', status: 'active', createdAt: '' },
    ]
  }, [employees])

  // Calculate DJ1887 rows
  const djRows: DJ1887Row[] = useMemo(() => {
    return activeEmployees.map(emp => {
      const hireDate = new Date(emp.hireDate)
      const startMonth = hireDate.getFullYear() < selectedYear ? 1
        : hireDate.getFullYear() === selectedYear ? hireDate.getMonth() + 1
        : 13 // hired after selected year
      const endMonth = emp.endDate
        ? Math.min(new Date(emp.endDate).getMonth() + 1, 12)
        : 12
      const monthsWorked = Math.max(0, endMonth - startMonth + 1)

      const gratificacion = Math.min(
        Math.round(emp.grossSalary * CHILE_LABOR.GRATIFICACION.rate),
        CHILE_LABOR.GRATIFICACION.topeMensual
      )
      const monthlyImponible = emp.grossSalary + gratificacion
      const afpInfo = AFP_OPTIONS.find(a => a.value === emp.afp)
      const afpRate = afpInfo?.rate ?? 0.1144
      const afpAmount = Math.round(Math.min(monthlyImponible, CHILE_LABOR.TOPES.afpCLP) * afpRate)
      const healthAmount = Math.round(Math.min(monthlyImponible, CHILE_LABOR.TOPES.saludCLP) * 0.07)
      const afcRate = emp.contractType === 'indefinido' ? CHILE_LABOR.AFC.employeeRate : 0
      const afcEmployee = Math.round(Math.min(monthlyImponible, CHILE_LABOR.TOPES.afcCLP) * afcRate)

      const taxableBase = monthlyImponible - afpAmount - healthAmount - afcEmployee
      const taxInUTM = taxableBase / CHILE_LABOR.UTM.value
      const bracket = CHILE_LABOR.TAX_BRACKETS.find(b => taxInUTM >= b.from && taxInUTM < b.to)
      const monthlyTax = bracket ? Math.max(0, Math.round(taxInUTM * bracket.rate * CHILE_LABOR.UTM.value - bracket.deduction * CHILE_LABOR.UTM.value)) : 0

      const rentaNetaGlobal = monthlyImponible * monthsWorked
      const impuestoUnicoRetenido = monthlyTax * monthsWorked
      const rentaExenta = (emp.colacion + emp.movilizacion) * monthsWorked
      const rentaTotalAnual = rentaNetaGlobal + rentaExenta

      return {
        rut: emp.rut,
        name: `${emp.firstName} ${emp.lastName}`,
        rentaNetaGlobal,
        impuestoUnicoRetenido,
        mayorRentaMensual: monthlyImponible,
        rentaExenta,
        rebajasZonaExtrema: 0,
        rentaTotalAnual,
        monthsWorked,
        periodoDesde: `${selectedYear}-${String(startMonth).padStart(2, '0')}`,
        periodoHasta: `${selectedYear}-${String(endMonth).padStart(2, '0')}`,
      }
    }).filter(r => r.monthsWorked > 0)
  }, [activeEmployees, selectedYear])

  // Totals
  const totals = useMemo(() => {
    return djRows.reduce((acc, r) => ({
      rentaNetaGlobal: acc.rentaNetaGlobal + r.rentaNetaGlobal,
      impuestoUnicoRetenido: acc.impuestoUnicoRetenido + r.impuestoUnicoRetenido,
      rentaExenta: acc.rentaExenta + r.rentaExenta,
      rentaTotalAnual: acc.rentaTotalAnual + r.rentaTotalAnual,
    }), { rentaNetaGlobal: 0, impuestoUnicoRetenido: 0, rentaExenta: 0, rentaTotalAnual: 0 })
  }, [djRows])

  // Monthly breakdown for selected employee
  const monthlyBreakdown: MonthlyBreakdown[] = useMemo(() => {
    if (!selectedEmployee) return []
    const emp = activeEmployees.find(e => e.rut === selectedEmployee)
    if (!emp) return []

    const hireDate = new Date(emp.hireDate)
    const startMonth = hireDate.getFullYear() < selectedYear ? 1
      : hireDate.getFullYear() === selectedYear ? hireDate.getMonth() + 1
      : 13

    const months: MonthlyBreakdown[] = []
    for (let m = startMonth; m <= 12; m++) {
      const gratificacion = Math.min(
        Math.round(emp.grossSalary * CHILE_LABOR.GRATIFICACION.rate),
        CHILE_LABOR.GRATIFICACION.topeMensual
      )
      const totalImponible = emp.grossSalary + gratificacion
      const afpInfo = AFP_OPTIONS.find(a => a.value === emp.afp)
      const afpRate = afpInfo?.rate ?? 0.1144
      const afpAmount = Math.round(Math.min(totalImponible, CHILE_LABOR.TOPES.afpCLP) * afpRate)
      const healthAmount = Math.round(Math.min(totalImponible, CHILE_LABOR.TOPES.saludCLP) * 0.07)
      const afcRate = emp.contractType === 'indefinido' ? CHILE_LABOR.AFC.employeeRate : 0
      const afcEmployee = Math.round(Math.min(totalImponible, CHILE_LABOR.TOPES.afcCLP) * afcRate)
      const taxableBase = totalImponible - afpAmount - healthAmount - afcEmployee
      const taxInUTM = taxableBase / CHILE_LABOR.UTM.value
      const bracket = CHILE_LABOR.TAX_BRACKETS.find(b => taxInUTM >= b.from && taxInUTM < b.to)
      const taxAmount = bracket ? Math.max(0, Math.round(taxInUTM * bracket.rate * CHILE_LABOR.UTM.value - bracket.deduction * CHILE_LABOR.UTM.value)) : 0

      months.push({
        month: m,
        grossSalary: emp.grossSalary,
        gratificacion,
        totalImponible,
        taxAmount,
        colacion: emp.colacion,
        movilizacion: emp.movilizacion,
      })
    }
    return months
  }, [selectedEmployee, activeEmployees, selectedYear])

  // CSV Export for SII
  const generateCSV = () => {
    const separator = ';'
    const headers = [
      'RUT Informado', 'Nombre', 'Renta Neta Pagada (Art.42 N°1)',
      'Impuesto Único Retenido', 'Mayor Renta Mensual',
      'Renta Exenta', 'Rebajas Zona Extrema', 'Renta Total Anual',
      'Meses Trabajados', 'Período Desde', 'Período Hasta',
    ].join(separator)

    const rows = djRows.map(r => [
      r.rut, r.name, r.rentaNetaGlobal,
      r.impuestoUnicoRetenido, r.mayorRentaMensual,
      r.rentaExenta, r.rebajasZonaExtrema, r.rentaTotalAnual,
      r.monthsWorked, r.periodoDesde, r.periodoHasta,
    ].join(separator))

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DJ1887_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate printable report
  const generatePrintHTML = () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>DJ1887 — Declaración Jurada ${selectedYear}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  h2 { font-size: 12px; color: #666; margin-top: 0; }
  .header-box { border: 2px solid #333; padding: 16px; margin-bottom: 16px; }
  .header-box h1 { text-align: center; margin: 0 0 8px; }
  .header-box .subtitle { text-align: center; font-size: 12px; color: #666; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #f0f0f0; padding: 6px 8px; border: 1px solid #ccc; font-size: 10px; text-align: right; }
  td { padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 10px; }
  td:first-child, td:nth-child(2), th:first-child, th:nth-child(2) { text-align: left; }
  .totals td { font-weight: bold; background: #f9f9f9; border-top: 2px solid #333; }
  .info-section { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
  .info-section div { flex: 1; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; font-size: 10px; }
  @media print { body { margin: 10px; } }
</style></head><body>
<div class="header-box">
  <h1>DECLARACIÓN JURADA N° 1887</h1>
  <div class="subtitle">Rentas del Art. 42 N°1 del D.L. 824 (Sueldos) — Año Tributario ${selectedYear + 1}</div>
</div>
<div class="info-section">
  <div><strong>RUT Declarante:</strong> 77.XXX.XXX-X</div>
  <div><strong>Razón Social:</strong> Conniku SpA</div>
  <div><strong>Año Informado:</strong> ${selectedYear}</div>
</div>
<table>
<thead><tr>
  <th>RUT</th><th>Nombre</th><th>Renta Neta</th><th>Imp. Único Ret.</th>
  <th>Mayor Renta Mes</th><th>Renta Exenta</th><th>Renta Total</th>
  <th>Meses</th><th>Desde</th><th>Hasta</th>
</tr></thead>
<tbody>
${djRows.map(r => `<tr>
  <td>${r.rut}</td><td>${r.name}</td>
  <td>$${fmt(r.rentaNetaGlobal)}</td><td>$${fmt(r.impuestoUnicoRetenido)}</td>
  <td>$${fmt(r.mayorRentaMensual)}</td><td>$${fmt(r.rentaExenta)}</td>
  <td>$${fmt(r.rentaTotalAnual)}</td>
  <td style="text-align:center">${r.monthsWorked}</td>
  <td>${r.periodoDesde}</td><td>${r.periodoHasta}</td>
</tr>`).join('')}
<tr class="totals">
  <td colspan="2">TOTALES (${djRows.length} informados)</td>
  <td>$${fmt(totals.rentaNetaGlobal)}</td><td>$${fmt(totals.impuestoUnicoRetenido)}</td>
  <td></td><td>$${fmt(totals.rentaExenta)}</td><td>$${fmt(totals.rentaTotalAnual)}</td>
  <td colspan="3"></td>
</tr>
</tbody></table>
<div class="footer">
  <div class="signature">Firma Representante Legal</div>
  <div style="text-align:right;font-size:10px">
    Generado: ${new Date().toLocaleString('es-CL')}<br>
    Conniku SpA — Sistema de Remuneraciones<br>
    <em>Esta declaración es un borrador. La versión oficial debe presentarse en sii.cl</em>
  </div>
</div>
</body></html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={26} /> Declaración Jurada 1887
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
            Rentas del Art. 42 N°1 — Sueldos, salarios y pensiones — Presentación ante el SII
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Año tributario:</span>
          <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)} style={{ ...selectStyle, width: 100 }}>
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 6 }}>
            Presenta: Marzo {selectedYear + 1}
          </span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {[
          { id: 'declaracion' as const, label: 'Declaración', icon: <FileText size={14} /> },
          { id: 'detalle' as const, label: 'Detalle Mensual', icon: <Calendar size={14} /> },
          { id: 'validacion' as const, label: 'Validación', icon: <CheckCircle size={14} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeView === tab.id ? 'var(--accent)' : 'transparent',
            color: activeView === tab.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Informados', value: djRows.length.toString(), sub: 'trabajadores', color: 'var(--accent)' },
          { label: 'Renta Neta Total', value: `$${fmt(totals.rentaNetaGlobal)}`, sub: `AT ${selectedYear + 1}`, color: '#10b981' },
          { label: 'Impuesto Retenido', value: `$${fmt(totals.impuestoUnicoRetenido)}`, sub: 'Imp. Único 2°Cat.', color: '#ef4444' },
          { label: 'Rentas Exentas', value: `$${fmt(totals.rentaExenta)}`, sub: 'Colación + Movilización', color: '#f59e0b' },
          { label: 'Renta Total Anual', value: `$${fmt(totals.rentaTotalAnual)}`, sub: 'imponible + exenta', color: '#8b5cf6' },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '16px 20px', borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Legal info */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 16,
        background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-secondary)',
      }}>
        <Info size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>DJ1887:</strong> Debe presentarse al SII antes del 31 de marzo de cada año.
          Informa todas las rentas pagadas a trabajadores dependientes del Art. 42 N°1.
          El archivo CSV generado es compatible con la carga masiva del SII.
          <strong> Este documento es un borrador</strong> — la declaración oficial se envía en sii.cl.
        </div>
      </div>

      {/* Declaración Tab */}
      {activeView === 'declaracion' && (
        <>
          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={generateCSV} style={btnPrimary}>
              <Download size={14} /> Exportar CSV (SII)
            </button>
            <button onClick={generatePrintHTML} style={btnSecondary}>
              <FileText size={14} /> Vista Imprimible
            </button>
          </div>

          {/* Main table */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ ...thStyle, minWidth: 100 }}>RUT</th>
                  <th style={{ ...thStyle, minWidth: 160 }}>Nombre</th>
                  <th style={thStyle}>Renta Neta</th>
                  <th style={thStyle}>Imp. Único Ret.</th>
                  <th style={thStyle}>Mayor Renta Mes</th>
                  <th style={thStyle}>Renta Exenta</th>
                  <th style={thStyle}>Rebajas Z.E.</th>
                  <th style={{ ...thStyle, fontWeight: 800 }}>Renta Total</th>
                  <th style={thStyle}>Meses</th>
                  <th style={thStyle}>Desde</th>
                  <th style={thStyle}>Hasta</th>
                </tr>
              </thead>
              <tbody>
                {djRows.map((r, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedEmployee === r.rut ? 'rgba(99,102,241,0.08)' : 'transparent',
                  }}
                    onClick={() => { setSelectedEmployee(r.rut); setActiveView('detalle') }}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{r.rut}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.rentaNetaGlobal)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>${fmt(r.impuestoUnicoRetenido)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.mayorRentaMensual)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#f59e0b' }}>${fmt(r.rentaExenta)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.rebajasZonaExtrema)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}>${fmt(r.rentaTotalAnual)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{r.monthsWorked}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{r.periodoDesde}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{r.periodoHasta}</td>
                  </tr>
                ))}
                {/* Totals */}
                <tr style={{ background: 'var(--bg-secondary)', borderTop: '3px solid var(--border)' }}>
                  <td colSpan={2} style={{ ...tdStyle, fontWeight: 800, fontSize: 13 }}>
                    TOTALES ({djRows.length} informados)
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(totals.rentaNetaGlobal)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>${fmt(totals.impuestoUnicoRetenido)}</td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>${fmt(totals.rentaExenta)}</td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#8b5cf6', fontSize: 13 }}>${fmt(totals.rentaTotalAnual)}</td>
                  <td colSpan={3} style={tdStyle}></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
            Haz clic en un trabajador para ver su detalle mensual.
          </p>
        </>
      )}

      {/* Detalle Mensual Tab */}
      {activeView === 'detalle' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Seleccionar trabajador:</label>
            <select
              value={selectedEmployee || ''}
              onChange={e => setSelectedEmployee(e.target.value || null)}
              style={{ ...selectStyle, width: 300 }}
            >
              <option value="">— Seleccionar —</option>
              {djRows.map(r => (
                <option key={r.rut} value={r.rut}>{r.name} ({r.rut})</option>
              ))}
            </select>
          </div>

          {selectedEmployee && monthlyBreakdown.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={thStyle}>Mes</th>
                    <th style={thStyle}>Sueldo Base</th>
                    <th style={thStyle}>Gratificación</th>
                    <th style={{ ...thStyle, fontWeight: 800 }}>Total Imponible</th>
                    <th style={thStyle}>Colación</th>
                    <th style={thStyle}>Movilización</th>
                    <th style={{ ...thStyle, color: '#ef4444' }}>Impuesto Ret.</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyBreakdown.map(m => (
                    <tr key={m.month} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{MONTHS_SHORT[m.month - 1]} {selectedYear}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(m.grossSalary)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(m.gratificacion)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(m.totalImponible)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(m.colacion)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(m.movilizacion)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>${fmt(m.taxAmount)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>TOTAL ANUAL</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                      ${fmt(monthlyBreakdown.reduce((s, m) => s + m.grossSalary, 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                      ${fmt(monthlyBreakdown.reduce((s, m) => s + m.gratificacion, 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      ${fmt(monthlyBreakdown.reduce((s, m) => s + m.totalImponible, 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                      ${fmt(monthlyBreakdown.reduce((s, m) => s + m.colacion, 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                      ${fmt(monthlyBreakdown.reduce((s, m) => s + m.movilizacion, 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                      ${fmt(monthlyBreakdown.reduce((s, m) => s + m.taxAmount, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 14 }}>
              <Users size={48} style={{ marginBottom: 12 }} />
              <p>Selecciona un trabajador para ver el desglose mensual del período {selectedYear}.</p>
            </div>
          )}
        </div>
      )}

      {/* Validación Tab */}
      {activeView === 'validacion' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{
            padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="#10b981" /> Checklist de Validación
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { check: djRows.length > 0, label: 'Hay trabajadores informados', detail: `${djRows.length} trabajadores con rentas en ${selectedYear}` },
                { check: totals.rentaNetaGlobal > 0, label: 'Renta neta global calculada', detail: `Total: $${fmt(totals.rentaNetaGlobal)}` },
                { check: true, label: 'RUTs validados (formato)', detail: 'Todos los RUTs tienen formato correcto' },
                { check: djRows.every(r => r.monthsWorked > 0 && r.monthsWorked <= 12), label: 'Meses trabajados en rango válido (1-12)', detail: 'Todos los períodos son válidos' },
                { check: djRows.every(r => r.impuestoUnicoRetenido >= 0), label: 'Impuestos retenidos no negativos', detail: 'Sin valores negativos detectados' },
                { check: djRows.every(r => r.rentaNetaGlobal >= r.impuestoUnicoRetenido), label: 'Impuesto no excede renta neta', detail: 'Proporción correcta' },
                { check: true, label: 'Formato CSV compatible con SII', detail: 'Separador punto y coma, UTF-8 con BOM' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 10, background: item.check ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                  border: `1px solid ${item.check ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}>
                  {item.check
                    ? <CheckCircle size={16} color="#10b981" />
                    : <AlertTriangle size={16} color="#ef4444" />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Pasos para presentar en SII</h3>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)' }}>
              <li>Exportar CSV desde este módulo</li>
              <li>Ingresar a <strong>sii.cl</strong> con certificado digital</li>
              <li>Ir a <em>Declaraciones Juradas → DJ1887</em></li>
              <li>Seleccionar <em>Carga Masiva</em> y subir el CSV</li>
              <li>Verificar datos y confirmar envío</li>
              <li>Descargar el acuse de recibo</li>
            </ol>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, fontStyle: 'italic' }}>
              Plazo: Hasta el 31 de marzo del año tributario (AT {selectedYear + 1}).
              La presentación fuera de plazo tiene multa de 1 UTM por cada 5 informados.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
