import React, { useState, useEffect } from 'react'
import {
  AlertTriangle, Calculator, Download, FileText
} from 'lucide-react'
import { Employee } from '../shared/types'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, fmt } from '../shared/styles'

// ─── FormField ──────────────────────────────────────────────────
function FormField({ label, value, onChange, type = 'text', placeholder, required, step }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; step?: string }) {
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
        step={step}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          color: 'var(--text-primary)', fontSize: 13,
        }}
      />
    </div>
  )
}

// ─── Document generation helpers ────────────────────────────────
const openDoc = (html: string) => {
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
}

const DOC_STYLES = `
  @page { size: letter; margin: 2.5cm 3cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 24pt; text-transform: uppercase; letter-spacing: 2px; }
  h2 { font-size: 12pt; margin: 18pt 0 6pt; text-transform: uppercase; }
  p { text-align: justify; margin-bottom: 12pt; }
  .clause { margin-bottom: 16pt; page-break-inside: avoid; }
  .signatures { margin-top: 60pt; display: flex; justify-content: space-between; }
  .sig-block { text-align: center; width: 30%; }
  .sig-line { border-top: 1px solid #000; margin-top: 60pt; padding-top: 6pt; }
  .header-info { text-align: center; margin-bottom: 30pt; font-size: 10pt; color: #555; }
  .legal-ref { font-size: 9pt; color: #666; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
  th, td { padding: 6pt 10pt; text-align: left; border-bottom: 1px solid #ccc; font-size: 11pt; }
  th { font-weight: 700; background: #f5f5f5; }
  td.amount { text-align: right; font-family: 'Courier New', monospace; }
  tr.total td { border-top: 2px solid #000; font-weight: 800; font-size: 12pt; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`

function generateFiniquitoHTML(
  emp: Employee,
  result: any,
  causalLabel: string,
  pendingVacationDays: number,
  avisoPrevio: boolean,
  fechaTermino?: string
): string {
  const today = new Date()
  const dateStr = today.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const hireDate = new Date(emp.hireDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const terminationDate = fechaTermino
    ? new Date(fechaTermino).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : dateStr

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Finiquito - ${emp.firstName} ${emp.lastName}</title>
<style>${DOC_STYLES}</style>
</head><body>
<div class="header-info">CONNIKU SpA<br/>RUT: 77.XXX.XXX-X<br/>Santiago, Chile</div>
<h1>Finiquito de Contrato de Trabajo</h1>
<p class="legal-ref" style="text-align: center; margin-bottom: 24pt;">Conforme al Articulo 177 del Codigo del Trabajo</p>

<div class="clause">
<h2>PRIMERO: Partes</h2>
<p>En Santiago, a ${dateStr}, entre <strong>CONNIKU SpA</strong>, RUT 77.XXX.XXX-X, representada legalmente para estos efectos, en adelante "el Empleador"; y don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, de nacionalidad ${emp.nationality}, domiciliado(a) en ${emp.address}, en adelante "el Trabajador", se celebra el presente finiquito de contrato de trabajo.</p>
</div>

<div class="clause">
<h2>SEGUNDO: Antecedentes de la Relacion Laboral</h2>
<p>El Trabajador presto servicios para el Empleador desde el <strong>${hireDate}</strong>, desempenandose como <strong>${emp.position}</strong> en el departamento de <strong>${emp.department}</strong>, con un contrato de tipo <strong>${emp.contractType}</strong>.</p>
<p>La ultima remuneracion mensual bruta fue de <strong>$${fmt(emp.grossSalary)}</strong>.</p>
</div>

<div class="clause">
<h2>TERCERO: Causal de Termino</h2>
<p>El contrato de trabajo termina por la siguiente causal: <strong>${causalLabel}</strong>.</p>
<p>La fecha de termino efectivo de la relacion laboral es el <strong>${terminationDate}</strong>.</p>
</div>

<div class="clause">
<h2>CUARTO: Desglose de Pagos</h2>
<p>El Empleador pagara al Trabajador las siguientes sumas, a titulo de finiquito:</p>
<table>
<thead>
<tr><th>Concepto</th><th style="text-align: right;">Monto (CLP)</th></tr>
</thead>
<tbody>
${result.indemnizacionAnos > 0 ? `<tr><td>Indemnizacion por anos de servicio (${result.yearsApplied} anos, tope 11 — Art. 163 CT)</td><td class="amount">$${fmt(result.indemnizacionAnos)}</td></tr>` : ''}
${result.indemnizacionAviso > 0 ? `<tr><td>Indemnizacion sustitutiva del aviso previo (1 mes — Art. 161 inc. 2 CT)</td><td class="amount">$${fmt(result.indemnizacionAviso)}</td></tr>` : ''}
${result.recargo > 0 ? `<tr><td>Recargo legal (${result.recargoPercent}% — Art. 168 CT)</td><td class="amount">$${fmt(result.recargo)}</td></tr>` : ''}
<tr><td>Vacaciones proporcionales (${pendingVacationDays} dias — Art. 73 CT)</td><td class="amount">$${fmt(result.vacaciones)}</td></tr>
<tr><td>Gratificacion proporcional (Art. 50 CT)</td><td class="amount">$${fmt(result.gratificacionProp)}</td></tr>
<tr><td>Dias trabajados del mes en curso</td><td class="amount">$${fmt(result.diasTrabajados)}</td></tr>
<tr class="total"><td>TOTAL BRUTO FINIQUITO</td><td class="amount">$${fmt(result.totalBruto)}</td></tr>
</tbody>
</table>
</div>

<div class="clause">
<h2>QUINTO: Estado de Cotizaciones Previsionales</h2>
<p>El Empleador declara que las cotizaciones previsionales del Trabajador se encuentran <strong>integramente pagadas</strong> hasta el ultimo dia trabajado, incluyendo AFP (${emp.afp}), salud (${emp.healthSystem === 'fonasa' ? 'Fonasa' : 'Isapre ' + (emp.isapreName || '')}), y Seguro de Cesantia (AFC).</p>
<p class="legal-ref">Conforme al Art. 162 incisos 5, 6 y 7 del Codigo del Trabajo (Ley Bustos), el despido es nulo si las cotizaciones previsionales no se encuentran al dia. El empleador debera acompanar los certificados de la AFP, Fonasa/Isapre y AFC que acrediten el pago integro.</p>
</div>

<div class="clause">
<h2>SEXTO: Declaraciones</h2>
<p>El Trabajador declara que recibe a su entera satisfaccion las sumas indicadas en la clausula CUARTO y que no tiene reclamo alguno que formular en contra del Empleador por concepto de remuneraciones, horas extraordinarias, gratificaciones, feriado, indemnizaciones ni ningun otro concepto derivado de la relacion laboral que por este acto termina.</p>
<p>No obstante lo anterior, el Trabajador se reserva el derecho a reclamar ante los Tribunales de Justicia las diferencias que pudieran existir, conforme a lo dispuesto en el articulo 177 inciso final del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>SEPTIMO: Ratificacion</h2>
<p>El presente finiquito se firma ante Ministro de Fe, conforme lo exige el articulo 177 del Codigo del Trabajo, en tres ejemplares de identico tenor, quedando uno en poder de cada parte y el tercero en poder del Ministro de Fe.</p>
</div>

<div class="signatures">
  <div class="sig-block">
    <div class="sig-line">
      <strong>EL EMPLEADOR</strong><br/>
      CONNIKU SpA<br/>
      RUT: 77.XXX.XXX-X
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      <strong>EL TRABAJADOR</strong><br/>
      ${emp.firstName} ${emp.lastName}<br/>
      RUT: ${emp.rut}
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      <strong>MINISTRO DE FE</strong><br/>
      (Notario / Inspector del Trabajo /<br/>Presidente del Sindicato)
    </div>
  </div>
</div>

<div style="margin-top: 40pt; padding: 12pt; border: 1px solid #ccc; font-size: 9pt; color: #666; line-height: 1.6;">
<strong>Nota Legal — Art. 177 del Codigo del Trabajo:</strong> El finiquito debidamente ratificado por el trabajador ante un Inspector del Trabajo o un Notario Publico, o firmado por el trabajador y el presidente del sindicato, tendra merito ejecutivo respecto de las obligaciones pendientes que se hubieren consignado en el. El finiquito no puede ser firmado con anterioridad a la fecha de termino de la relacion laboral.
</div>
</body></html>`
}

function generateCartaDespidoHTML(
  emp: Employee,
  causal: 'art159' | 'art161',
  hechos: string,
  fechaDespido: string
): string {
  const today = new Date()
  const dateStr = today.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const hireDate = new Date(emp.hireDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const plazo = causal === 'art161' ? '6 dias habiles' : '3 dias habiles'
  const causalText = causal === 'art161'
    ? 'Articulo 161 del Codigo del Trabajo — Necesidades de la empresa'
    : 'Articulo 159 del Codigo del Trabajo — Vencimiento del plazo convenido / Mutuo acuerdo / Conclusion de la obra'

  const hire = new Date(emp.hireDate)
  const now = new Date()
  const yearsWorked = Math.min(Math.floor((now.getTime() - hire.getTime()) / (365.25 * 24 * 60 * 60 * 1000)), 11)
  const topeMensual = 90 * CHILE_LABOR.UF.value
  const salaryForCalc = Math.min(emp.grossSalary, topeMensual)
  const indemnizacionAnos = causal === 'art161' ? salaryForCalc * yearsWorked : 0
  const indemnizacionAviso = causal === 'art161' ? salaryForCalc : 0

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Carta de Despido - ${emp.firstName} ${emp.lastName}</title>
<style>${DOC_STYLES}</style>
</head><body>
<div class="header-info">CONNIKU SpA<br/>RUT: 77.XXX.XXX-X<br/>Santiago, Chile</div>

<p style="text-align: right;">Santiago, ${dateStr}</p>

<p>
Senor(a)<br/>
<strong>${emp.firstName} ${emp.lastName}</strong><br/>
RUT: ${emp.rut}<br/>
${emp.address}<br/>
<strong>PRESENTE</strong>
</p>

<p><strong>REF: Comunicacion de termino de contrato de trabajo</strong></p>

<div class="clause">
<p>De mi consideracion:</p>
<p>Por medio de la presente, y en conformidad con lo dispuesto en el <strong>${causalText}</strong>, comunico a usted que se ha resuelto poner termino a su contrato de trabajo, con efectos a contar del <strong>${fechaDespido || dateStr}</strong>.</p>
</div>

<div class="clause">
<h2>Antecedentes de la Relacion Laboral</h2>
<p>Usted presta servicios para CONNIKU SpA desde el <strong>${hireDate}</strong>, desempenandose como <strong>${emp.position}</strong> en el departamento de <strong>${emp.department}</strong>.</p>
</div>

<div class="clause">
<h2>Causal Invocada</h2>
<p>La causal de termino invocada es: <strong>${causalText}</strong>.</p>
</div>

<div class="clause">
<h2>Hechos que Fundamentan la Causal</h2>
<p>${hechos || '[Describir los hechos concretos que fundamentan la causal de termino invocada]'}</p>
</div>

${causal === 'art161' ? `
<div class="clause">
<h2>Indemnizaciones Ofrecidas</h2>
<p>En virtud de lo dispuesto en los articulos 162 y 163 del Codigo del Trabajo, se ofrecen las siguientes indemnizaciones:</p>
<table>
<tbody>
<tr><td>Indemnizacion por anos de servicio (${yearsWorked} anos, tope 11)</td><td class="amount">$${fmt(indemnizacionAnos)}</td></tr>
<tr><td>Indemnizacion sustitutiva del aviso previo (1 mes)</td><td class="amount">$${fmt(indemnizacionAviso)}</td></tr>
<tr class="total"><td>Total Indemnizaciones</td><td class="amount">$${fmt(indemnizacionAnos + indemnizacionAviso)}</td></tr>
</tbody>
</table>
<p class="legal-ref">Nota: Las indemnizaciones se calculan con tope de 90 UF mensual ($${fmt(topeMensual)}) y maximo 11 anos de servicio (Art. 163 y 172 CT).</p>
</div>
` : `
<div class="clause">
<h2>Indemnizaciones</h2>
<p>Atendida la causal invocada (Art. 159), no corresponde el pago de indemnizacion por anos de servicio ni indemnizacion sustitutiva del aviso previo, salvo pacto en contrario.</p>
</div>
`}

<div class="clause">
<h2>Estado de Cotizaciones Previsionales</h2>
<p>Se deja constancia que las cotizaciones previsionales del trabajador se encuentran <strong>integramente pagadas</strong> hasta el ultimo dia trabajado, conforme al articulo 162 incisos 5, 6 y 7 del Codigo del Trabajo (Ley Bustos). Se adjuntan los certificados correspondientes de AFP, salud y AFC.</p>
</div>

<p>Sin otro particular, le saluda atentamente,</p>

<div style="margin-top: 80pt; width: 40%;">
  <div class="sig-line">
    <strong>CONNIKU SpA</strong><br/>
    Representante Legal<br/>
    RUT: 77.XXX.XXX-X
  </div>
</div>

<div style="margin-top: 40pt; padding: 12pt; border: 1px solid #ccc; font-size: 9pt; color: #666; line-height: 1.6;">
<strong>Nota Legal — Art. 162 del Codigo del Trabajo:</strong><br/>
• Esta carta debe ser entregada personalmente o enviada por correo certificado al domicilio del trabajador dentro de los <strong>${plazo}</strong> siguientes a la separacion del trabajador.<br/>
• Se debe enviar <strong>copia a la Inspeccion del Trabajo</strong> respectiva dentro del mismo plazo.<br/>
• Si las cotizaciones previsionales no se encuentran al dia, el despido sera <strong>nulo</strong> y el empleador debera seguir pagando las remuneraciones hasta la convalidacion del despido (Ley Bustos).<br/>
• El trabajador podra recurrir al Juzgado del Trabajo dentro de los 60 dias habiles siguientes al despido si considera que este es injustificado, indebido o improcedente (Art. 168 CT).
</div>

<div style="margin-top: 20pt; font-size: 9pt; color: #999; text-align: center;">
c.c.: Inspeccion del Trabajo — Carpeta personal del trabajador
</div>
</body></html>`
}

// ═════════════════════════════════════════════════════════════════
// FINIQUITOS TAB
// ═════════════════════════════════════════════════════════════════
export default function FiniquitosTab() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmp, setSelectedEmp] = useState<string>('')
  const [causal, setCausal] = useState('161_necesidades')
  const [lastSalary, setLastSalary] = useState(0)
  const [yearsWorked, setYearsWorked] = useState(0)
  const [monthsExtra, setMonthsExtra] = useState(0)
  const [pendingVacationDays, setPendingVacationDays] = useState(0)
  const [avisoPrevio, setAvisoPrevio] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fechaTermino, setFechaTermino] = useState(new Date().toISOString().split('T')[0])
  const [diasTrabajadosActual, setDiasTrabajadosActual] = useState(new Date().getDate())
  const [payrollSource, setPayrollSource] = useState<'payroll' | 'employee' | 'manual'>('employee')
  const [desvSource, setDesvSource] = useState(false)

  const CAUSALES = [
    { value: '159_1_mutuo', label: 'Art. 159 N\u00b01 \u2014 Mutuo acuerdo', indemnizacion: false, aviso: false, recargo: 0 },
    { value: '159_2_renuncia', label: 'Art. 159 N\u00b02 \u2014 Renuncia voluntaria', indemnizacion: false, aviso: false, recargo: 0 },
    { value: '159_4_vencimiento', label: 'Art. 159 N\u00b04 \u2014 Vencimiento de plazo', indemnizacion: false, aviso: false, recargo: 0.5 },
    { value: '159_5_obra', label: 'Art. 159 N\u00b05 \u2014 Conclusion de obra', indemnizacion: false, aviso: false, recargo: 0.5 },
    { value: '160_conducta', label: 'Art. 160 \u2014 Despido por falta grave (sin indemnizacion)', indemnizacion: false, aviso: false, recargo: 0 },
    { value: '161_necesidades', label: 'Art. 161 \u2014 Necesidades de la empresa', indemnizacion: true, aviso: true, recargo: 0 },
    { value: '161_desahucio', label: 'Art. 161 inc. 2 \u2014 Desahucio', indemnizacion: true, aviso: true, recargo: 0 },
    { value: '168_injustificado', label: 'Art. 168 \u2014 Despido injustificado', indemnizacion: true, aviso: true, recargo: 0.3 },
    { value: '168_improcedente_159', label: 'Art. 168 \u2014 Improcedente (causal 159 N\u00b04-6)', indemnizacion: true, aviso: true, recargo: 0.5 },
    { value: '168_improcedente_160', label: 'Art. 168 \u2014 Improcedente (causal 160)', indemnizacion: true, aviso: true, recargo: 0.8 },
  ]

  const UF_VALUE = CHILE_LABOR.UF.value

  // Load employees
  useEffect(() => {
    setLoading(true)
    api.getEmployees()
      .then((data: any) => setEmployees(data || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCalculate = () => {
    const c = CAUSALES.find(x => x.value === causal)
    if (!c) return

    const yearsTotal = Math.min(yearsWorked, 11)
    const topeMensual = 90 * UF_VALUE // 90 UF tope mensual para indemnizacion
    const salaryForCalc = Math.min(lastSalary, topeMensual)

    // Indemnizacion por anos de servicio
    const indemnizacionAnos = c.indemnizacion ? salaryForCalc * yearsTotal : 0

    // Indemnizacion sustitutiva del aviso previo (1 mes)
    const indemnizacionAviso = (c.aviso && avisoPrevio) ? salaryForCalc : 0

    // Recargo legal
    const recargo = (indemnizacionAnos + indemnizacionAviso) * c.recargo

    // Vacaciones proporcionales (sueldo diario * dias pendientes)
    const dailySalary = lastSalary / 30
    const vacaciones = dailySalary * pendingVacationDays

    // Gratificacion proporcional
    const gratificacionMensual = Math.min(lastSalary * 0.25, (500000 * 4.75) / 12)
    const gratificacionProp = gratificacionMensual * (monthsExtra / 12)

    // Días trabajados del mes hasta fecha de término
    const diasTrabajados = dailySalary * diasTrabajadosActual

    const totalBruto = indemnizacionAnos + indemnizacionAviso + recargo + vacaciones + gratificacionProp + diasTrabajados

    setResult({
      causalLabel: c.label,
      indemnizacionAnos,
      indemnizacionAviso,
      recargo,
      recargoPercent: c.recargo * 100,
      vacaciones,
      gratificacionProp,
      diasTrabajados,
      totalBruto,
      yearsApplied: yearsTotal,
      topeMensualApplied: salaryForCalc < lastSalary,
    })
  }

  // Causal mapping: PersonasHub desvinculación values → FiniquitosTab values
  const CAUSAL_MAP: Record<string, string> = {
    mutuo_acuerdo: '159_1_mutuo',
    renuncia: '159_2_renuncia',
    termino_plazo: '159_4_vencimiento',
    caso_fortuito: '159_5_obra',
    falta_probidad: '160_conducta',
    acoso_laboral: '160_conducta',
    vias_de_hecho: '160_conducta',
    injurias: '160_conducta',
    abandono: '160_conducta',
    actos_contra: '160_conducta',
    incumplimiento: '160_conducta',
    necesidades_empresa: '161_necesidades',
    desahucio: '161_desahucio',
  }

  function calcVacacionesPendientes(hireDate: string, termDate: Date, years: number): number {
    // Art.67 CT: 15 días hábiles base, +1 día c/3 años sobre los 10 (beneficio progresivo)
    const progressiveDays = years >= 10 ? Math.floor((years - 10) / 3) : 0
    const totalVacDaysPerYear = 15 + progressiveDays
    // Aniversario anterior a la fecha de término
    const hire = new Date(hireDate)
    const lastAnniv = new Date(hire)
    lastAnniv.setFullYear(termDate.getFullYear())
    if (lastAnniv > termDate) lastAnniv.setFullYear(termDate.getFullYear() - 1)
    const daysSinceAnniv = (termDate.getTime() - lastAnniv.getTime()) / (24 * 60 * 60 * 1000)
    return Math.max(0, Math.round((daysSinceAnniv / 365) * totalVacDaysPerYear))
  }

  // Auto-populate all fields when employee is selected
  useEffect(() => {
    if (!selectedEmp) return
    const emp = employees.find(e => e.id === selectedEmp)
    if (!emp) return

    // ── 1. Cross-reference desvinculación data from PersonasHub ───────────
    let resolvedFechaTermino = new Date().toISOString().split('T')[0]
    try {
      const desvRaw = localStorage.getItem(`conniku_desv_${selectedEmp}`)
      if (desvRaw) {
        const desv = JSON.parse(desvRaw)
        if (desv.fechaTermino) {
          resolvedFechaTermino = desv.fechaTermino
          setFechaTermino(desv.fechaTermino)
        }
        if (desv.causal && CAUSAL_MAP[desv.causal]) {
          setCausal(CAUSAL_MAP[desv.causal])
          // Art.161: si no consta aviso dado, indemnización sustitutiva aplica
          const needsAviso = desv.causal === 'necesidades_empresa' || desv.causal === 'desahucio'
          setAvisoPrevio(needsAviso)
        }
        setDesvSource(true)
      } else {
        setDesvSource(false)
      }
    } catch { setDesvSource(false) }

    // ── 2. Años y meses de servicio ───────────────────────────────────────
    const hire = new Date(emp.hireDate)
    const termDate = new Date(resolvedFechaTermino)
    const diffMs = termDate.getTime() - hire.getTime()
    const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
    const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
    setYearsWorked(Math.max(0, years))
    setMonthsExtra(Math.max(0, months))

    // ── 3. Vacaciones proporcionales (Art.67 CT) ──────────────────────────
    setPendingVacationDays(calcVacacionesPendientes(emp.hireDate, termDate, Math.max(0, years)))

    // ── 4. Días trabajados del mes de término ────────────────────────────
    setDiasTrabajadosActual(termDate.getDate())

    // ── 5. Última remuneración: buscar en nómina real, fallback a contrato ─
    setPayrollSource('employee')
    setLastSalary(emp.grossSalary)
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const applyPayrollRecord = (records: any) => {
      const rec = Array.isArray(records) ? records.find((r: any) => r.employeeId === selectedEmp) : null
      if (rec?.grossSalary && rec.grossSalary > 0) {
        setLastSalary(rec.grossSalary)
        setPayrollSource('payroll')
        return true
      }
      return false
    }

    api.getPayroll(year, month)
      .then((records: any) => {
        if (!applyPayrollRecord(records)) {
          // Try previous month
          const prevMonth = month === 1 ? 12 : month - 1
          const prevYear = month === 1 ? year - 1 : year
          api.getPayroll(prevYear, prevMonth)
            .then((prev: any) => applyPayrollRecord(prev))
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [selectedEmp, employees])

  // Recalculate service years + vacation + días when fechaTermino changes
  useEffect(() => {
    if (!selectedEmp) return
    const emp = employees.find(e => e.id === selectedEmp)
    if (!emp) return
    const termDate = new Date(fechaTermino)
    if (isNaN(termDate.getTime())) return

    const hire = new Date(emp.hireDate)
    const diffMs = termDate.getTime() - hire.getTime()
    const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
    const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
    setYearsWorked(Math.max(0, years))
    setMonthsExtra(Math.max(0, months))
    setPendingVacationDays(calcVacacionesPendientes(emp.hireDate, termDate, Math.max(0, years)))
    setDiasTrabajadosActual(termDate.getDate())
  }, [fechaTermino])

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1a2332, #991b1b)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} /> Calculadora de Finiquitos
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Calculo completo segun el Codigo del Trabajo de Chile. Art. 159-163, 168. Tope indemnizacion: 11 anos, tope mensual: 90 UF.
        </p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Empleado</label>
            <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}>
              <option value="">Seleccionar empleado...</option>
              {employees.filter(e => e.status === 'active').map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.position}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Causal de Termino</label>
            <select value={causal} onChange={e => setCausal(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}>
              {CAUSALES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>
              Fecha de Término <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={fechaTermino}
              onChange={e => setFechaTermino(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            {desvSource && <p style={{ fontSize: 11, color: '#22c55e', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>✓ Sincronizado desde Desvinculación (Personas)</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>
              Última Remuneración Mensual (CLP)
            </label>
            <input
              type="number"
              value={lastSalary}
              onChange={e => { setLastSalary(Number(e.target.value)); setPayrollSource('manual') }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            <p style={{ fontSize: 11, margin: '4px 0 0', color: payrollSource === 'payroll' ? '#22c55e' : payrollSource === 'manual' ? '#f59e0b' : 'var(--text-muted)' }}>
              {payrollSource === 'payroll' ? '✓ Obtenido de última liquidación de nómina' : payrollSource === 'manual' ? '✎ Modificado manualmente' : '· Desde contrato del empleado (sin liquidación registrada)'}
            </p>
          </div>
          <FormField label="Años Trabajados" value={yearsWorked} onChange={(v: string) => setYearsWorked(Number(v))} type="number" />
          <FormField label="Meses Adicionales" value={monthsExtra} onChange={(v: string) => setMonthsExtra(Number(v))} type="number" />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>
              Días de Vacaciones Pendientes <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 400 }}>(Art. 67 CT — calculado proporcional)</span>
            </label>
            <input
              type="number"
              value={pendingVacationDays}
              onChange={e => setPendingVacationDays(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>
              Días Trabajados del Mes en Curso
            </label>
            <input
              type="number"
              value={diasTrabajadosActual}
              onChange={e => setDiasTrabajadosActual(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            <p style={{ fontSize: 11, color: '#22c55e', margin: '4px 0 0' }}>✓ Calculado desde fecha de término</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={avisoPrevio} onChange={e => setAvisoPrevio(e.target.checked)} id="aviso" />
            <label htmlFor="aviso" style={{ fontSize: 13 }}>Incluir indemnizacion sustitutiva del aviso previo (no se dio aviso de 30 dias)</label>
          </div>
        </div>

        {desvSource && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 12, color: '#22c55e' }}>
            ✓ <strong>Datos sincronizados automáticamente</strong> desde el proceso de Desvinculación en Personas — revise y ajuste si es necesario antes de calcular.
          </div>
        )}
        <button onClick={handleCalculate} style={{ ...btnPrimary, marginTop: 20 }}>
          <Calculator size={16} /> Calcular Finiquito
        </button>
      </div>

      {result && (
        <div className="card" style={{ padding: 20, border: '2px solid #ef4444' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#ef4444' }}>Resultado del Finiquito</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Causal: {result.causalLabel}</p>
          {result.topeMensualApplied && (
            <div style={{ padding: 8, background: 'rgba(245,158,11,0.1)', borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#f59e0b' }}>
              Se aplico tope mensual de 90 UF (${fmt(90 * UF_VALUE)}) para el calculo de indemnizacion.
            </div>
          )}
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              {result.indemnizacionAnos > 0 && (
                <tr><td>Indemnizacion por anos de servicio ({result.yearsApplied} anos, tope 11)</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(result.indemnizacionAnos)}</td></tr>
              )}
              {result.indemnizacionAviso > 0 && (
                <tr><td>Indemnizacion sustitutiva aviso previo (1 mes)</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(result.indemnizacionAviso)}</td></tr>
              )}
              {result.recargo > 0 && (
                <tr style={{ color: '#ef4444' }}><td>Recargo legal ({result.recargoPercent}%)</td><td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(result.recargo)}</td></tr>
              )}
              <tr><td>Vacaciones proporcionales ({pendingVacationDays} dias)</td><td style={{ textAlign: 'right' }}>${fmt(result.vacaciones)}</td></tr>
              <tr><td>Gratificacion proporcional</td><td style={{ textAlign: 'right' }}>${fmt(result.gratificacionProp)}</td></tr>
              <tr><td>Días trabajados del mes ({diasTrabajadosActual} días — hasta {new Date(fechaTermino).toLocaleDateString('es-CL')})</td><td style={{ textAlign: 'right' }}>${fmt(result.diasTrabajados)}</td></tr>
              <tr style={{ borderTop: '3px solid var(--border)', fontSize: 18 }}>
                <td style={{ fontWeight: 800, paddingTop: 12 }}>TOTAL FINIQUITO BRUTO</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#ef4444', paddingTop: 12 }}>${fmt(result.totalBruto)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <strong>Requisitos legales para el finiquito:</strong><br />
            {'\u2022'} Debe ser firmado ante un ministro de fe (notario, inspector del trabajo, o presidente del sindicato)<br />
            {'\u2022'} Cotizaciones previsionales deben estar al dia (Ley Bustos, Art. 162)<br />
            {'\u2022'} Se debe entregar copia del finiquito al trabajador<br />
            {'\u2022'} El pago debe realizarse al momento de la firma<br />
            {'\u2022'} Plazo para pagar: 10 dias habiles desde la terminacion del contrato
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              style={{ ...btnPrimary, opacity: selectedEmp ? 1 : 0.5 }}
              disabled={!selectedEmp}
              onClick={() => {
                const emp = employees.find(e => e.id === selectedEmp)
                if (!emp || !result) return
                openDoc(generateFiniquitoHTML(emp, result, result.causalLabel, pendingVacationDays, avisoPrevio, fechaTermino))
              }}
            ><Download size={16} /> Generar PDF Finiquito</button>
            <button
              style={{ ...btnSecondary, opacity: selectedEmp ? 1 : 0.5 }}
              disabled={!selectedEmp}
              onClick={() => {
                const emp = employees.find(e => e.id === selectedEmp)
                if (!emp) return
                const causalType = causal.startsWith('161') ? 'art161' : 'art159'
                openDoc(generateCartaDespidoHTML(emp, causalType as 'art159' | 'art161', '', new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })))
              }}
            ><FileText size={16} /> Generar Carta de Despido</button>
          </div>
        </div>
      )}

      {/* Legal reference */}
      <div className="card" style={{ padding: 16, marginTop: 20, borderLeft: '4px solid #ef4444' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Causales de Termino — Referencia Rapida</h4>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p><strong>Art. 159:</strong> Causales objetivas — Mutuo acuerdo, renuncia, muerte, vencimiento plazo, conclusion obra. No generan indemnizacion salvo pacto en contrario.</p>
          <p><strong>Art. 160:</strong> Conductas del trabajador — Falta de probidad, acoso, abandono, actos ilicitos. Despido sin indemnizacion. Si el tribunal declara injustificado, aplica recargo 80%.</p>
          <p><strong>Art. 161:</strong> Necesidades de la empresa / desahucio — Genera indemnizacion por anos de servicio (1 mes x ano, tope 11). Si no se da aviso de 30 dias, se paga mes adicional.</p>
          <p><strong>Art. 168:</strong> Despido injustificado — Recargo 30% (Art. 161), 50% (Art. 159 N{'\u00b0'}4-6), 80% (Art. 160) sobre indemnizacion total.</p>
          <p><strong>Art. 162 (Ley Bustos):</strong> Si las cotizaciones no estan al dia, el despido es NULO. Empleador debe seguir pagando hasta regularizar.</p>
        </div>
      </div>
    </div>
  )
}
