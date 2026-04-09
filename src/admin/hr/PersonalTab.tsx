import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { Employee } from '../shared/types'
import { AFP_OPTIONS, HEALTH_OPTIONS, CONTRACT_TYPES, DEPARTMENTS, BANKS } from '../shared/constants'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { btnPrimary, btnSecondary, grid2, fmt } from '../shared/styles'
import {
  Users, UserPlus, FileText, DollarSign, Search, ChevronRight,
  Clock, AlertTriangle, CheckCircle, X, Upload, Download,
  Info, FolderOpen, Eye, Shield, Briefcase, Target, FileSignature,
  Printer, Lock, Hash
} from 'lucide-react'
import {
  CONNIKU_POSITIONS, CONNIKU_VALUES,
  getJobDescription, getExpectationMemo,
  generateContractPDF, generateJobDescriptionPDF, generateExpectationMemoPDF,
} from '../shared/ercData'

// ═════════════════════════════════════════════════════════════════
// FES — Firma Electronica Simple (Ley 19.799)
// ═════════════════════════════════════════════════════════════════
interface FESSignature {
  documentType: 'contrato' | 'job_description' | 'expectation_memo'
  employeeId: string
  signerEmail: string
  signerName: string
  signerRut: string
  timestamp: string
  ipAddress: string
  documentHash: string
  verificationCode: string
  status: 'pending' | 'signed'
}

const FES_STORAGE_KEY = 'conniku_fes_signatures'

function loadSignatures(): FESSignature[] {
  try { return JSON.parse(localStorage.getItem(FES_STORAGE_KEY) || '[]') } catch { return [] }
}

function saveSignature(sig: FESSignature) {
  const all = loadSignatures()
  // Replace if same doc+employee exists
  const idx = all.findIndex(s => s.documentType === sig.documentType && s.employeeId === sig.employeeId)
  if (idx >= 0) all[idx] = sig; else all.push(sig)
  localStorage.setItem(FES_STORAGE_KEY, JSON.stringify(all))
}

function getSignature(employeeId: string, docType: string): FESSignature | null {
  return loadSignatures().find(s => s.employeeId === employeeId && s.documentType === docType) || null
}

async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'FES-'
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function getPublicIP(): Promise<string> {
  try {
    const r = await fetch('https://api.ipify.org?format=json')
    const d = await r.json()
    return d.ip || 'No disponible'
  } catch { return 'No disponible' }
}

// ═════════════════════════════════════════════════════════════════
// PERSONAL TAB — Main Component
// ═════════════════════════════════════════════════════════════════

export default function PersonalTab() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [indicators, setIndicators] = useState<any>(null)
  const [indicatorsError, setIndicatorsError] = useState('')

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const data = await api.getEmployees()
      setEmployees(data || [])
    } catch { setEmployees([]) }
    setLoading(false)
  }

  useEffect(() => {
    api.getChileIndicators()
      .then((data: any) => {
        setIndicators(data)
        if (data?.uf?.value) CHILE_LABOR.UF.value = Math.round(data.uf.value)
        if (data?.utm?.value) CHILE_LABOR.UTM.value = Math.round(data.utm.value)
        if (data?.imm?.value) CHILE_LABOR.IMM.current = data.imm.value
        if (data?.uf?.value) {
          CHILE_LABOR.UF.lastUpdate = new Date().toISOString().split('T')[0]
          CHILE_LABOR.UTM.lastUpdate = new Date().toISOString().split('T')[0]
        }
        setIndicatorsError('')
      })
      .catch(() => setIndicatorsError('No se pudieron cargar indicadores. Usando valores por defecto.'))
  }, [])

  useEffect(() => { loadEmployees() }, [])

  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>Solo el owner puede acceder al modulo de RRHH.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} /> Personal
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Gestion de personal y directorio de empleados — Legislacion Chilena
        </p>
      </div>

      {/* Indicadores Economicos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {indicators ? (
          <>
            {[
              { label: 'UF', val: indicators.uf?.value },
              { label: 'UTM', val: indicators.utm?.value },
              { label: 'USD', val: indicators.dolar?.value },
              { label: 'IMM', val: indicators.imm?.value },
              { label: 'Tope AFP', val: indicators.topes?.afp_clp },
              { label: 'Grat. Mensual', val: indicators.gratificacion?.tope_mensual },
            ].map(i => (
              <div key={i.label} style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>{i.label}</span> <strong>${i.val?.toLocaleString('es-CL', { maximumFractionDigits: 2 })}</strong>
              </div>
            ))}
            <div style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.1)', borderRadius: 10, fontSize: 11, whiteSpace: 'nowrap', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={12} /> En vivo — mindicador.cl
            </div>
          </>
        ) : indicatorsError ? (
          <div style={{ padding: '8px 14px', background: 'rgba(245,158,11,0.1)', borderRadius: 10, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> {indicatorsError}
          </div>
        ) : (
          <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Cargando indicadores economicos...
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total Empleados" value={employees.length} color="#3b82f6" />
        <StatCard icon={CheckCircle} label="Activos" value={employees.filter((e: Employee) => e.status === 'active').length} color="#22c55e" />
        <StatCard icon={Clock} label="En Prueba" value={employees.filter((e: Employee) => e.contractType === 'plazo_fijo').length} color="#f59e0b" />
        <StatCard icon={AlertTriangle} label="Inactivos" value={employees.filter((e: Employee) => e.status !== 'active').length} color="#ef4444" />
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o cargo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
          />
        </div>
        <button onClick={() => setShowAddEmployee(true)} style={btnPrimary}>
          <UserPlus size={16} /> Agregar Empleado
        </button>
      </div>

      {/* Employee List */}
      <EmployeeList
        employees={employees}
        searchTerm={searchTerm}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        setShowAdd={setShowAddEmployee}
      />

      {selectedEmployee && (
        <EmployeeDetail
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onRefresh={loadEmployees}
        />
      )}

      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onRefresh={loadEmployees}
        />
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// EMPLOYEE LIST
// ═════════════════════════════════════════════════════════════════
function EmployeeList({ employees, searchTerm, selectedEmployee, setSelectedEmployee, setShowAdd }: {
  employees: Employee[]
  searchTerm: string
  selectedEmployee: Employee | null
  setSelectedEmployee: (e: Employee | null) => void
  setShowAdd: (v: boolean) => void
}) {
  const filtered = employees.filter((e: Employee) =>
    `${e.firstName} ${e.lastName} ${e.rut} ${e.position}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
        <h3>Sin empleados registrados</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Agrega tu primer empleado para comenzar a gestionar tu equipo.
        </p>
        <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, marginTop: 16 }}>
          <UserPlus size={16} /> Agregar Empleado
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {filtered.map((emp: Employee) => (
        <div
          key={emp.id}
          className="card"
          style={{ padding: 16, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16 }}
          onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0,
          }}>
            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.firstName} {emp.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {emp.position} • {emp.department} • RUT: {emp.rut}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>${fmt(emp.grossSalary)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bruto mensual</div>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: emp.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: emp.status === 'active' ? '#22c55e' : '#ef4444',
          }}>
            {emp.status === 'active' ? 'Activo' : emp.status === 'on_leave' ? 'Licencia' : 'Inactivo'}
          </span>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// ADD EMPLOYEE MODAL — with position dropdown
// ═════════════════════════════════════════════════════════════════
function AddEmployeeModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState<any>({
    rut: '', firstName: '', lastName: '', email: '', phone: '', address: '',
    birthDate: '', nationality: 'Chilena', maritalStatus: 'soltero',
    gender: 'masculino',
    emergencyContactName: '', emergencyContactPhone: '',
    profession1: '', profession2: '',
    position: '', customPosition: '', department: 'Tecnologia', hireDate: '', contractType: 'indefinido',
    workSchedule: 'full_time', weeklyHours: 45,
    grossSalary: 500000, colacion: 0, movilizacion: 0, bonoAsistencia: 0, bonoProduccion: 0,
    afp: 'modelo', healthSystem: 'fonasa', isapreName: '', isapreUf: 0,
    afcActive: true, bankName: 'Banco Estado', bankAccountType: 'cuenta_vista', bankAccountNumber: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  // Auto-fill department and salary when position changes
  const handlePositionChange = (pos: string) => {
    setForm((prev: any) => {
      const update: any = { ...prev, position: pos }
      const jd = getJobDescription(pos)
      if (jd) {
        update.department = jd.department
        // Parse salary from compensation.base
        const salaryMatch = jd.compensation.base.match(/\$([\d.]+)/)
        if (salaryMatch) {
          update.grossSalary = parseInt(salaryMatch[1].replace(/\./g, ''))
        }
        // Auto-fill email
        update.email = jd.email
      }
      return update
    })
  }

  const handleSave = async () => {
    const finalForm = { ...form }
    if (form.position === '__custom__') {
      finalForm.position = form.customPosition
    }
    delete finalForm.customPosition
    setSaving(true)
    try {
      await api.createEmployee(finalForm)
      onClose()
      onRefresh()
    } catch (err) {
      alert('Error al guardar empleado')
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserPlus size={22} /> Agregar Empleado
        </h2>

        <SectionTitle>Datos Personales</SectionTitle>
        <div style={grid2}>
          <FormField label="RUT" value={form.rut} onChange={v => setForm({ ...form, rut: v })} placeholder="12.345.678-9" required />
          <FormField label="Nombre" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} required />
          <FormField label="Apellido" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} required />
          <FormField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" required />
          <FormField label="Telefono" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+56 9 1234 5678" />
          <FormField label="Direccion" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <FormField label="Fecha Nacimiento" value={form.birthDate} onChange={v => setForm({ ...form, birthDate: v })} type="date" />
          <FormField label="Nacionalidad" value={form.nationality} onChange={v => setForm({ ...form, nationality: v })} />
          <SelectField label="Genero" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={[
            { value: 'masculino', label: 'Masculino' }, { value: 'femenino', label: 'Femenino' },
            { value: 'otro', label: 'Otro' }, { value: 'no_indica', label: 'Prefiere no indicar' },
          ]} />
          <SelectField label="Estado Civil" value={form.maritalStatus} onChange={v => setForm({ ...form, maritalStatus: v })} options={[
            { value: 'soltero', label: 'Soltero/a' }, { value: 'casado', label: 'Casado/a' },
            { value: 'divorciado', label: 'Divorciado/a' }, { value: 'viudo', label: 'Viudo/a' },
          ]} />
        </div>

        <SectionTitle>Formacion Profesional</SectionTitle>
        <div style={grid2}>
          <FormField label="Profesion / Titulo 1" value={form.profession1} onChange={v => setForm({ ...form, profession1: v })} placeholder="Ej: Ingeniero Civil Industrial" />
          <FormField label="Profesion / Titulo 2 (opcional)" value={form.profession2} onChange={v => setForm({ ...form, profession2: v })} placeholder="Ej: MBA, Diplomado, etc." />
        </div>

        <SectionTitle>Contacto de Emergencia</SectionTitle>
        <div style={grid2}>
          <FormField label="Nombre completo" value={form.emergencyContactName} onChange={v => setForm({ ...form, emergencyContactName: v })} />
          <FormField label="Telefono" value={form.emergencyContactPhone} onChange={v => setForm({ ...form, emergencyContactPhone: v })} placeholder="+56 9 ..." />
        </div>

        <SectionTitle>Datos Laborales</SectionTitle>
        <div style={grid2}>
          {/* Position Dropdown */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>
              Cargo <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={form.position}
              onChange={e => handlePositionChange(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
            >
              <option value="">— Seleccionar cargo —</option>
              {CONNIKU_POSITIONS.map(p => (
                <option key={p.key} value={p.value}>{p.label}</option>
              ))}
              <option value="__custom__">Otro (personalizado)</option>
            </select>
            {form.position === '__custom__' && (
              <input
                type="text"
                value={form.customPosition}
                onChange={e => setForm({ ...form, customPosition: e.target.value })}
                placeholder="Escribir cargo personalizado..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 6 }}
              />
            )}
            {form.position && form.position !== '__custom__' && getJobDescription(form.position) && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(34,197,94,0.08)', borderRadius: 6, fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Job Description, Expectation Memo y Contrato Tipo vinculados
              </div>
            )}
          </div>
          <SelectField label="Departamento" value={form.department} onChange={v => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
          <FormField label="Fecha Ingreso" value={form.hireDate} onChange={v => setForm({ ...form, hireDate: v })} type="date" required />
          <SelectField label="Tipo Contrato" value={form.contractType} onChange={v => setForm({ ...form, contractType: v })} options={CONTRACT_TYPES} />
          <SelectField label="Jornada" value={form.workSchedule} onChange={v => setForm({ ...form, workSchedule: v })} options={[
            { value: 'full_time', label: 'Completa (45 hrs)' }, { value: 'part_time', label: 'Parcial' },
          ]} />
          <FormField label="Horas Semanales" value={form.weeklyHours} onChange={v => setForm({ ...form, weeklyHours: Number(v) })} type="number" />
        </div>

        <SectionTitle>Remuneracion</SectionTitle>
        <div style={grid2}>
          <FormField label="Sueldo Bruto (CLP)" value={form.grossSalary} onChange={v => setForm({ ...form, grossSalary: Number(v) })} type="number" required />
          <FormField label="Colacion (CLP)" value={form.colacion} onChange={v => setForm({ ...form, colacion: Number(v) })} type="number" />
          <FormField label="Movilizacion (CLP)" value={form.movilizacion} onChange={v => setForm({ ...form, movilizacion: Number(v) })} type="number" />
          <FormField label="Bono Asistencia (CLP)" value={form.bonoAsistencia} onChange={v => setForm({ ...form, bonoAsistencia: Number(v) })} type="number" />
          <FormField label="Bono Produccion (CLP)" value={form.bonoProduccion} onChange={v => setForm({ ...form, bonoProduccion: Number(v) })} type="number" />
        </div>

        <SectionTitle>Prevision Social</SectionTitle>
        <div style={grid2}>
          <SelectField label="AFP" value={form.afp} onChange={v => setForm({ ...form, afp: v })} options={AFP_OPTIONS.map(a => ({ value: a.value, label: `${a.label} (${a.rate}%)` }))} />
          <SelectField label="Sistema de Salud" value={form.healthSystem} onChange={v => setForm({ ...form, healthSystem: v })} options={HEALTH_OPTIONS} />
          {form.healthSystem === 'isapre' && (
            <>
              <FormField label="Nombre Isapre" value={form.isapreName} onChange={v => setForm({ ...form, isapreName: v })} />
              <FormField label="Plan UF" value={form.isapreUf} onChange={v => setForm({ ...form, isapreUf: Number(v) })} type="number" step="0.01" />
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.afcActive} onChange={e => setForm({ ...form, afcActive: e.target.checked })} id="afc" />
            <label htmlFor="afc" style={{ fontSize: 13, fontWeight: 600 }}>AFC (Seguro Cesantia) Activo</label>
          </div>
        </div>

        <SectionTitle>Datos Bancarios</SectionTitle>
        <div style={grid2}>
          <SelectField label="Banco" value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} options={BANKS.map(b => ({ value: b, label: b }))} />
          <SelectField label="Tipo Cuenta" value={form.bankAccountType} onChange={v => setForm({ ...form, bankAccountType: v })} options={[
            { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
            { value: 'cuenta_vista', label: 'Cuenta Vista / RUT' },
            { value: 'cuenta_ahorro', label: 'Cuenta Ahorro' },
          ]} />
          <FormField label="Numero Cuenta" value={form.bankAccountNumber} onChange={v => setForm({ ...form, bankAccountNumber: v })} />
        </div>

        <SectionTitle>Notas Adicionales</SectionTitle>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Observaciones, alergias, condiciones especiales, etc."
          rows={3}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' } as any}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Guardando...' : 'Guardar Empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// EMPLOYEE DETAIL — 6 tabs
// ═════════════════════════════════════════════════════════════════
type DetailTab = 'info' | 'docs' | 'liquidaciones' | 'job_description' | 'expectation_memo' | 'contrato'

function EmployeeDetail({ employee, onClose, onRefresh }: { employee: Employee; onClose: () => void; onRefresh: () => void }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [detailTab, setDetailTab] = useState<DetailTab>('info')

  useEffect(() => {
    api.getEmployeeDocuments(employee.id).then(setDocuments).catch(() => setDocuments([]))
  }, [employee.id])

  const afpInfo = AFP_OPTIONS.find(a => a.value === employee.afp)
  const jd = getJobDescription(employee.position)
  const memo = getExpectationMemo(employee.position)

  const TABS: { id: DetailTab; label: string; icon: any }[] = [
    { id: 'info', label: 'Informacion', icon: Info },
    { id: 'job_description', label: 'Job Description', icon: Briefcase },
    { id: 'expectation_memo', label: 'Expectation Memo', icon: Target },
    { id: 'contrato', label: 'Contrato', icon: FileSignature },
    { id: 'docs', label: 'Documentos', icon: FolderOpen },
    { id: 'liquidaciones', label: 'Liquidaciones', icon: DollarSign },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 22,
          }}>
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{employee.firstName} {employee.lastName}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{employee.position} • {employee.department}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Tab bar — scrollable */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setDetailTab(t.id)} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
              background: detailTab === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: detailTab === t.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Info */}
        {detailTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoRow label="RUT" value={employee.rut} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Telefono" value={employee.phone} />
            <InfoRow label="Direccion" value={employee.address} />
            <InfoRow label="Fecha Nacimiento" value={employee.birthDate} />
            <InfoRow label="Nacionalidad" value={employee.nationality} />
            <InfoRow label="Estado Civil" value={employee.maritalStatus} />
            <InfoRow label="Fecha Ingreso" value={employee.hireDate} />
            <InfoRow label="Tipo Contrato" value={CONTRACT_TYPES.find(c => c.value === employee.contractType)?.label || employee.contractType} />
            <InfoRow label="Jornada" value={`${employee.weeklyHours} hrs/semana`} />
            <InfoRow label="Sueldo Bruto" value={`$${fmt(employee.grossSalary)} CLP`} highlight />
            <InfoRow label="Colacion" value={`$${fmt(employee.colacion)} CLP`} />
            <InfoRow label="Movilizacion" value={`$${fmt(employee.movilizacion)} CLP`} />
            <InfoRow label="AFP" value={`${afpInfo?.label || employee.afp} (${afpInfo?.rate}%)`} />
            <InfoRow label="Salud" value={employee.healthSystem === 'fonasa' ? 'Fonasa (7%)' : `${employee.isapreName} (${employee.isapreUf} UF)`} />
            <InfoRow label="AFC" value={employee.afcActive ? 'Activo' : 'Inactivo'} />
            <InfoRow label="Banco" value={`${employee.bankName} - ${employee.bankAccountNumber}`} />
            <InfoRow label="Contacto Emergencia" value={`${employee.emergencyContactName} (${employee.emergencyContactPhone})`} />
          </div>
        )}

        {/* TAB: Job Description */}
        {detailTab === 'job_description' && (
          <JobDescriptionTab employee={employee} />
        )}

        {/* TAB: Expectation Memo */}
        {detailTab === 'expectation_memo' && (
          <ExpectationMemoTab employee={employee} />
        )}

        {/* TAB: Contrato */}
        {detailTab === 'contrato' && (
          <ContratoTab employee={employee} afpRate={afpInfo?.rate || 10.58} />
        )}

        {/* TAB: Documents */}
        {detailTab === 'docs' && (
          <DocumentsTab employee={employee} documents={documents} />
        )}

        {/* TAB: Liquidaciones */}
        {detailTab === 'liquidaciones' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Las liquidaciones se generan desde la pestana "Remuneraciones" y quedan disponibles aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB: JOB DESCRIPTION
// ═════════════════════════════════════════════════════════════════
function JobDescriptionTab({ employee }: { employee: Employee }) {
  const jd = getJobDescription(employee.position)
  const sig = getSignature(employee.id, 'job_description')
  const [signing, setSigning] = useState(false)
  const { user } = useAuth()

  if (!jd) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Briefcase size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>No hay Job Description vinculada a este cargo.</p>
        <p style={{ fontSize: 12 }}>Solo los 5 cargos de Conniku tienen JD pre-definida.</p>
      </div>
    )
  }

  const handleSign = async () => {
    setSigning(true)
    try {
      const docContent = JSON.stringify({ position: jd.positionKey, employee: employee.id, jd })
      const hash = await generateSHA256(docContent)
      const ip = await getPublicIP()
      const signature: FESSignature = {
        documentType: 'job_description',
        employeeId: employee.id,
        signerEmail: user?.email || employee.email,
        signerName: `${employee.firstName} ${employee.lastName}`,
        signerRut: employee.rut,
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        documentHash: hash,
        verificationCode: generateVerificationCode(),
        status: 'signed',
      }
      saveSignature(signature)
      alert(`Documento firmado electronicamente.\nCodigo de verificacion: ${signature.verificationCode}`)
    } catch { alert('Error al firmar') }
    setSigning(false)
  }

  return (
    <div>
      {/* Actions bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => generateJobDescriptionPDF(employee as any)} style={{ ...btnPrimary, background: '#2563eb' }}>
          <Printer size={14} /> Generar PDF
        </button>
        {!sig && (
          <button onClick={handleSign} disabled={signing} style={{ ...btnPrimary, background: '#7c3aed' }}>
            <FileSignature size={14} /> {signing ? 'Firmando...' : 'Firmar Electronicamente'}
          </button>
        )}
        {sig && <SignatureBadge sig={sig} />}
      </div>

      {/* Content */}
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--accent)' }}>{jd.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
          {jd.department} • {jd.email} • Reporta a: {jd.reportTo}
        </p>

        <div style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid #2563eb', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 16, fontSize: 13, fontStyle: 'italic' }}>
          {jd.mision}
        </div>

        <ERCSection title="Expectativas (Lo que se espera de ti)" items={jd.expectations} color="#22c55e" />
        <ERCSection title="Responsabilidades" items={jd.responsibilities} color="#3b82f6" />
        <ERCSection title="Compromisos de Conniku" items={jd.commitments} color="#8b5cf6" />
        <ERCSection title="Requisitos" items={jd.requirements} color="#f59e0b" />
        <ERCSection title="Deseables" items={jd.desirable} color="#6b7280" />

        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>KPIs</h4>
        <div style={{ display: 'grid', gap: 6 }}>
          {jd.kpis.map((k, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12 }}>
              <span>{k.metric}</span>
              <strong style={{ color: 'var(--accent)' }}>{k.target}</strong>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>Herramientas</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {jd.tools.map(t => (
            <span key={t} style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB: EXPECTATION MEMO
// ═════════════════════════════════════════════════════════════════
function ExpectationMemoTab({ employee }: { employee: Employee }) {
  const memo = getExpectationMemo(employee.position)
  const sig = getSignature(employee.id, 'expectation_memo')
  const [signing, setSigning] = useState(false)
  const { user } = useAuth()

  if (!memo) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Target size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>No hay Expectation Memo vinculado a este cargo.</p>
      </div>
    )
  }

  const handleSign = async () => {
    setSigning(true)
    try {
      const docContent = JSON.stringify({ position: memo.positionKey, employee: employee.id, memo })
      const hash = await generateSHA256(docContent)
      const ip = await getPublicIP()
      const signature: FESSignature = {
        documentType: 'expectation_memo',
        employeeId: employee.id,
        signerEmail: user?.email || employee.email,
        signerName: `${employee.firstName} ${employee.lastName}`,
        signerRut: employee.rut,
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        documentHash: hash,
        verificationCode: generateVerificationCode(),
        status: 'signed',
      }
      saveSignature(signature)
      alert(`Documento firmado electronicamente.\nCodigo de verificacion: ${signature.verificationCode}`)
    } catch { alert('Error al firmar') }
    setSigning(false)
  }

  // Calculate days since hire
  const hireDate = new Date(employee.hireDate + 'T12:00:00')
  const today = new Date()
  const daysSinceHire = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => generateExpectationMemoPDF(employee as any)} style={{ ...btnPrimary, background: '#2563eb' }}>
          <Printer size={14} /> Generar PDF
        </button>
        {!sig && (
          <button onClick={handleSign} disabled={signing} style={{ ...btnPrimary, background: '#7c3aed' }}>
            <FileSignature size={14} /> {signing ? 'Firmando...' : 'Firmar Electronicamente'}
          </button>
        )}
        {sig && <SignatureBadge sig={sig} />}
      </div>

      {/* Progress indicator */}
      {daysSinceHire >= 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: '30 dias', day: 30, color: '#22c55e' },
            { label: '60 dias', day: 60, color: '#3b82f6' },
            { label: '90 dias', day: 90, color: '#8b5cf6' },
          ].map(p => {
            const completed = daysSinceHire >= p.day
            const active = daysSinceHire >= (p.day - 30) && daysSinceHire < p.day
            return (
              <div key={p.day} style={{
                flex: 1, padding: '8px 12px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 600,
                background: completed ? `${p.color}22` : active ? `${p.color}11` : 'var(--bg-secondary)',
                color: completed ? p.color : active ? p.color : 'var(--text-muted)',
                border: active ? `2px solid ${p.color}` : '2px solid transparent',
              }}>
                {completed ? <CheckCircle size={14} style={{ marginBottom: 2 }} /> : null}
                {' '}{p.label} {completed ? '— Completado' : active ? '— En curso' : ''}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 0 }}>{memo.intro}</p>

        {[memo.day30, memo.day60, memo.day90].map((phase, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: ['#22c55e', '#3b82f6', '#8b5cf6'][idx], margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#22c55e', '#3b82f6', '#8b5cf6'][idx] }} />
              {phase.title}
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {phase.items.map((item, i) => (
                <li key={i} style={{ fontSize: 12, marginBottom: 4, color: 'var(--text-primary)' }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        <ERCSection title="Expectativas Permanentes" items={memo.ongoing} color="#f59e0b" />
        <ERCSection title="Criterios de Evaluacion" items={memo.evaluationCriteria} color="#ef4444" />

        <div style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid #2563eb', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
          <h4 style={{ fontSize: 12, margin: '0 0 6px', color: '#2563eb' }}>Valores Conniku</h4>
          {CONNIKU_VALUES.map((v, i) => (
            <div key={i} style={{ fontSize: 11, marginBottom: 3, color: 'var(--text-secondary)' }}>• {v}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB: CONTRATO
// ═════════════════════════════════════════════════════════════════
function ContratoTab({ employee, afpRate }: { employee: Employee; afpRate: number }) {
  const sig = getSignature(employee.id, 'contrato')
  const [signing, setSigning] = useState(false)
  const { user } = useAuth()

  const totalImponible = employee.grossSalary
  const gratificacion = Math.min(Math.round(totalImponible * 0.25), 176066)
  const afpAmount = Math.round(totalImponible * afpRate / 100)
  const healthAmount = Math.round(totalImponible * 0.07)
  const afcEmpRate = employee.contractType === 'indefinido' ? 0.006 : 0.03
  const afcEmpAmount = Math.round(totalImponible * afcEmpRate)

  const handleSign = async () => {
    setSigning(true)
    try {
      const docContent = JSON.stringify({ employee: employee.id, position: employee.position, salary: employee.grossSalary, afp: employee.afp, health: employee.healthSystem, hireDate: employee.hireDate })
      const hash = await generateSHA256(docContent)
      const ip = await getPublicIP()
      const signature: FESSignature = {
        documentType: 'contrato',
        employeeId: employee.id,
        signerEmail: user?.email || employee.email,
        signerName: `${employee.firstName} ${employee.lastName}`,
        signerRut: employee.rut,
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        documentHash: hash,
        verificationCode: generateVerificationCode(),
        status: 'signed',
      }
      saveSignature(signature)
      alert(`Contrato firmado electronicamente.\nCodigo de verificacion: ${signature.verificationCode}\n\nGuarde este codigo como comprobante.`)
    } catch { alert('Error al firmar') }
    setSigning(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => generateContractPDF(employee as any, afpRate)} style={{ ...btnPrimary, background: '#2563eb' }}>
          <Printer size={14} /> Generar Contrato PDF
        </button>
        {!sig && (
          <button onClick={handleSign} disabled={signing} style={{ ...btnPrimary, background: '#7c3aed' }}>
            <FileSignature size={14} /> {signing ? 'Firmando...' : 'Firmar Contrato (FES)'}
          </button>
        )}
        {sig && <SignatureBadge sig={sig} />}
      </div>

      {/* Contract preview */}
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ textAlign: 'center', margin: '0 0 4px' }}>CONNIKU SpA</h3>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 0 }}>Contrato Individual de Trabajo</p>

        <ContractClause title="PARTES" content={`Empleador: CONNIKU SpA, representada por Cristian Gaete Lazcano.\nTrabajador: ${employee.firstName} ${employee.lastName}, RUT ${employee.rut}, domiciliado/a en ${employee.address || '[por completar]'}.`} />
        <ContractClause title="CARGO" content={`${employee.position} — Departamento de ${employee.department}. Funciones detalladas en Job Description (Anexo 1).`} />
        <ContractClause title="JORNADA" content={`${employee.weeklyHours} horas semanales, lunes a viernes, 09:00 a 18:00 con 1 hora de colacion.`} />

        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>REMUNERACION</h4>
        <div style={{ display: 'grid', gap: 4 }}>
          {[
            { label: 'Sueldo Base Bruto', val: employee.grossSalary, imp: 'Si' },
            { label: 'Gratificacion Legal', val: gratificacion, imp: 'Si' },
            { label: 'Colacion', val: employee.colacion, imp: 'No' },
            { label: 'Movilizacion', val: employee.movilizacion, imp: 'No' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12 }}>
              <span>{r.label}</span>
              <span><strong>${fmt(r.val)}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({r.imp})</span></span>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>DESCUENTOS LEGALES</h4>
        <div style={{ display: 'grid', gap: 4 }}>
          {[
            { label: `AFP ${employee.afp} (${afpRate}%)`, val: afpAmount },
            { label: `Salud ${employee.healthSystem === 'fonasa' ? 'Fonasa' : employee.isapreName} (7%)`, val: healthAmount },
            { label: `AFC Trabajador (${(afcEmpRate * 100).toFixed(1)}%)`, val: afcEmpAmount },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(239,68,68,0.05)', borderRadius: 6, fontSize: 12 }}>
              <span>{r.label}</span>
              <span style={{ color: '#ef4444' }}>-${fmt(r.val)}</span>
            </div>
          ))}
        </div>

        <ContractClause title="DURACION" content={`Contrato ${employee.contractType === 'indefinido' ? 'indefinido' : 'a plazo fijo'} desde el ${employee.hireDate || '[fecha]'}.`} />
        <ContractClause title="FERIADO" content="15 dias habiles anuales conforme al Art. 67 del Codigo del Trabajo." />
        <ContractClause title="CONFIDENCIALIDAD" content="Clausula de confidencialidad por 2 anos post-termino sobre informacion tecnica, comercial y datos de usuarios." />
        <ContractClause title="PROPIEDAD INTELECTUAL" content="Toda creacion realizada en funciones es propiedad exclusiva de Conniku SpA (Ley 17.336)." />
        <ContractClause title="PROTECCION DE DATOS" content="Tratamiento conforme a Ley 19.628. Uso exclusivo para fines laborales autorizados." />
        <ContractClause title="ANEXOS" content="1) Job Description  2) Expectation Memo 30/60/90  3) Reglamento Interno  4) ODI  5) Politica de Privacidad" />

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
          Para ver el contrato completo con todas las clausulas legales, genere el PDF.
        </p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB: DOCUMENTS
// ═════════════════════════════════════════════════════════════════
function DocumentsTab({ employee, documents }: { employee: Employee; documents: any[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Carpeta Personal</h3>
        <button style={btnPrimary}><Upload size={14} /> Subir Documento</button>
      </div>

      {/* Required documents checklist */}
      <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--bg-tertiary)' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Documentos Requeridos por Ley
        </h4>
        {[
          { type: 'contrato', label: 'Contrato de Trabajo', required: true },
          { type: 'job_description', label: 'Descripcion de Cargo (firmada)', required: true },
          { type: 'expectation_memo', label: 'Expectation Memo 30/60/90 (firmado)', required: true },
          { type: 'cedula', label: 'Copia Cedula de Identidad', required: true },
          { type: 'afp', label: 'Certificado AFP', required: true },
          { type: 'salud', label: 'Certificado Fonasa/Isapre', required: true },
          { type: 'antecedentes', label: 'Certificado de Antecedentes', required: false },
          { type: 'titulo', label: 'Copia Titulo Profesional', required: false },
          { type: 'reglamento', label: 'Reglamento Interno (firmado)', required: true },
          { type: 'obligacion_informar', label: 'Obligacion de Informar (ODI)', required: true },
          { type: 'mutual', label: 'Registro Mutual de Seguridad', required: true },
        ].map(doc => {
          const exists = documents.some((d: any) => d.documentType === doc.type)
          // Also check FES signatures for contrato, job_description, expectation_memo
          const hasFES = ['contrato', 'job_description', 'expectation_memo'].includes(doc.type)
            ? getSignature(employee.id, doc.type) : null
          const isComplete = exists || !!hasFES
          return (
            <div key={doc.type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              {isComplete ? <CheckCircle size={16} style={{ color: '#22c55e' }} /> : <AlertTriangle size={16} style={{ color: doc.required ? '#ef4444' : '#f59e0b' }} />}
              <span style={{ flex: 1, fontSize: 13 }}>{doc.label}</span>
              {doc.required && !isComplete && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>OBLIGATORIO</span>}
              {isComplete && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>COMPLETO</span>}
              {hasFES && (
                <span style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Lock size={10} /> FES
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Uploaded documents */}
      {documents.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {documents.map((doc: any) => (
            <div key={doc.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={20} style={{ color: 'var(--accent)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.documentType} • {new Date(doc.createdAt).toLocaleDateString('es-CL')}</div>
              </div>
              {doc.signed && (
                <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 10, fontWeight: 600 }}>
                  FIRMADO
                </span>
              )}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Eye size={16} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Download size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// SHARED HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════

function SignatureBadge({ sig }: { sig: FESSignature }) {
  const [showDetail, setShowDetail] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDetail(!showDetail)}
        style={{ ...btnSecondary, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)' }}
      >
        <Lock size={14} /> Firmado electronicamente
      </button>
      {showDetail && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 8, background: 'var(--bg-primary)',
          border: '1px solid var(--border)', borderRadius: 12, padding: 16, minWidth: 340, zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} /> Certificado de Firma Electronica Simple
          </h4>
          <div style={{ fontSize: 11, display: 'grid', gap: 4 }}>
            <div><strong>Firmante:</strong> {sig.signerName}</div>
            <div><strong>RUT:</strong> {sig.signerRut}</div>
            <div><strong>Email:</strong> {sig.signerEmail}</div>
            <div><strong>Fecha/Hora:</strong> {new Date(sig.timestamp).toLocaleString('es-CL')}</div>
            <div><strong>IP:</strong> {sig.ipAddress}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Hash size={12} /> <strong>Hash SHA-256:</strong>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: 6, borderRadius: 4 }}>
              {sig.documentHash}
            </div>
            <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(124,58,237,0.08)', borderRadius: 6, fontWeight: 700, textAlign: 'center', letterSpacing: '0.1em', color: '#7c3aed' }}>
              {sig.verificationCode}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', textAlign: 'center' }}>
              Firma conforme a Ley 19.799 — Art. 3 letra a)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ERCSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color, margin: '0 0 6px' }}>{title}</h4>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12, marginBottom: 3, color: 'var(--text-primary)' }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ContractClause({ title, content }: { title: string; content: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', margin: '0 0 4px' }}>{title}</h4>
      <p style={{ fontSize: 12, margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>{content}</p>
    </div>
  )
}

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--border)', color: 'var(--accent)' }}>
      {children}
    </h3>
  )
}

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

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: highlight ? 700 : 400, color: highlight ? 'var(--accent)' : 'var(--text-primary)', marginTop: 2 }}>{value || '—'}</div>
    </div>
  )
}
