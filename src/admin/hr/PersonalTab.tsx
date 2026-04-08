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
  Info, FolderOpen, Eye, Shield
} from 'lucide-react'

// ═════════════════════════════════════════════════════════════════
// PERSONAL TAB — Standalone Component
// Employee directory with add/edit/view/documents
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

  // ─── Load employees ───
  const loadEmployees = async () => {
    setLoading(true)
    try {
      const data = await api.getEmployees()
      setEmployees(data || [])
    } catch { setEmployees([]) }
    setLoading(false)
  }

  // ─── Load Chilean economic indicators ───
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

  // ─── Access check ───
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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} /> Personal
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Gestion de personal y directorio de empleados — Legislacion Chilena
        </p>
      </div>

      {/* ─── Indicadores Economicos en Vivo ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {indicators ? (
          <>
            <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>UF</span> <strong>${indicators.uf?.value?.toLocaleString('es-CL', { maximumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>UTM</span> <strong>${indicators.utm?.value?.toLocaleString('es-CL')}</strong>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>USD</span> <strong>${indicators.dolar?.value?.toLocaleString('es-CL')}</strong>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>IMM</span> <strong>${indicators.imm?.value?.toLocaleString('es-CL')}</strong>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tope AFP</span> <strong>${indicators.topes?.afp_clp?.toLocaleString('es-CL')}</strong>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>Grat. Mensual</span> <strong>${indicators.gratificacion?.tope_mensual?.toLocaleString('es-CL')}</strong>
            </div>
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

      {/* Stats Cards */}
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

      {/* Employee Detail Panel */}
      {selectedEmployee && (
        <EmployeeDetail
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onRefresh={loadEmployees}
        />
      )}

      {/* Add Employee Modal */}
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
// ADD EMPLOYEE MODAL
// ═════════════════════════════════════════════════════════════════
function AddEmployeeModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState<any>({
    rut: '', firstName: '', lastName: '', email: '', phone: '', address: '',
    birthDate: '', nationality: 'Chilena', maritalStatus: 'soltero',
    gender: 'masculino',
    emergencyContactName: '', emergencyContactPhone: '',
    profession1: '', profession2: '',
    position: '', department: 'Tecnologia', hireDate: '', contractType: 'indefinido',
    workSchedule: 'full_time', weeklyHours: 45,
    grossSalary: 500000, colacion: 0, movilizacion: 0, bonoAsistencia: 0, bonoProduccion: 0,
    afp: 'modelo', healthSystem: 'fonasa', isapreName: '', isapreUf: 0,
    afcActive: true, bankName: 'Banco Estado', bankAccountType: 'cuenta_vista', bankAccountNumber: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.createEmployee(form)
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
          <FormField label="Teléfono" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+56 9 1234 5678" />
          <FormField label="Dirección" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <FormField label="Fecha Nacimiento" value={form.birthDate} onChange={v => setForm({ ...form, birthDate: v })} type="date" />
          <FormField label="Nacionalidad" value={form.nationality} onChange={v => setForm({ ...form, nationality: v })} />
          <SelectField label="Género" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={[
            { value: 'masculino', label: 'Masculino' }, { value: 'femenino', label: 'Femenino' },
            { value: 'otro', label: 'Otro' }, { value: 'no_indica', label: 'Prefiere no indicar' },
          ]} />
          <SelectField label="Estado Civil" value={form.maritalStatus} onChange={v => setForm({ ...form, maritalStatus: v })} options={[
            { value: 'soltero', label: 'Soltero/a' }, { value: 'casado', label: 'Casado/a' },
            { value: 'divorciado', label: 'Divorciado/a' }, { value: 'viudo', label: 'Viudo/a' },
          ]} />
        </div>

        <SectionTitle>Formación Profesional</SectionTitle>
        <div style={grid2}>
          <FormField label="Profesión / Título 1" value={form.profession1} onChange={v => setForm({ ...form, profession1: v })} placeholder="Ej: Ingeniero Civil Industrial" />
          <FormField label="Profesión / Título 2 (opcional)" value={form.profession2} onChange={v => setForm({ ...form, profession2: v })} placeholder="Ej: MBA, Diplomado, etc." />
        </div>

        <SectionTitle>Contacto de Emergencia</SectionTitle>
        <div style={grid2}>
          <FormField label="Nombre completo" value={form.emergencyContactName} onChange={v => setForm({ ...form, emergencyContactName: v })} />
          <FormField label="Teléfono" value={form.emergencyContactPhone} onChange={v => setForm({ ...form, emergencyContactPhone: v })} placeholder="+56 9 ..." />
        </div>

        <SectionTitle>Datos Laborales</SectionTitle>
        <div style={grid2}>
          <FormField label="Cargo" value={form.position} onChange={v => setForm({ ...form, position: v })} required />
          <SelectField label="Departamento" value={form.department} onChange={v => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
          <FormField label="Fecha Ingreso" value={form.hireDate} onChange={v => setForm({ ...form, hireDate: v })} type="date" required />
          <SelectField label="Tipo Contrato" value={form.contractType} onChange={v => setForm({ ...form, contractType: v })} options={CONTRACT_TYPES} />
          <SelectField label="Jornada" value={form.workSchedule} onChange={v => setForm({ ...form, workSchedule: v })} options={[
            { value: 'full_time', label: 'Completa (45 hrs)' }, { value: 'part_time', label: 'Parcial' },
          ]} />
          <FormField label="Horas Semanales" value={form.weeklyHours} onChange={v => setForm({ ...form, weeklyHours: Number(v) })} type="number" />
        </div>

        <SectionTitle>Remuneración</SectionTitle>
        <div style={grid2}>
          <FormField label="Sueldo Bruto (CLP)" value={form.grossSalary} onChange={v => setForm({ ...form, grossSalary: Number(v) })} type="number" required />
          <FormField label="Colación (CLP)" value={form.colacion} onChange={v => setForm({ ...form, colacion: Number(v) })} type="number" />
          <FormField label="Movilización (CLP)" value={form.movilizacion} onChange={v => setForm({ ...form, movilizacion: Number(v) })} type="number" />
          <FormField label="Bono Asistencia (CLP)" value={form.bonoAsistencia} onChange={v => setForm({ ...form, bonoAsistencia: Number(v) })} type="number" />
          <FormField label="Bono Producción (CLP)" value={form.bonoProduccion} onChange={v => setForm({ ...form, bonoProduccion: Number(v) })} type="number" />
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
          style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' } as any}
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
// EMPLOYEE DETAIL
// ═════════════════════════════════════════════════════════════════
function EmployeeDetail({ employee, onClose, onRefresh }: { employee: Employee; onClose: () => void; onRefresh: () => void }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [detailTab, setDetailTab] = useState<'info' | 'docs' | 'liquidaciones'>('info')

  useEffect(() => {
    api.getEmployeeDocuments(employee.id).then(setDocuments).catch(() => setDocuments([]))
  }, [employee.id])

  const afpInfo = AFP_OPTIONS.find(a => a.value === employee.afp)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
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

        {/* Detail tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {[
            { id: 'info', label: 'Informacion', icon: Info },
            { id: 'docs', label: 'Documentos', icon: FolderOpen },
            { id: 'liquidaciones', label: 'Liquidaciones', icon: DollarSign },
          ].map(t => (
            <button key={t.id} onClick={() => setDetailTab(t.id as any)} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: detailTab === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: detailTab === t.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

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

        {detailTab === 'docs' && (
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
                return (
                  <div key={doc.type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    {exists ? <CheckCircle size={16} style={{ color: '#22c55e' }} /> : <AlertTriangle size={16} style={{ color: doc.required ? '#ef4444' : '#f59e0b' }} />}
                    <span style={{ flex: 1, fontSize: 13 }}>{doc.label}</span>
                    {doc.required && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>OBLIGATORIO</span>}
                    {exists && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>COMPLETO</span>}
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
        )}

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
// SHARED HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════

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
