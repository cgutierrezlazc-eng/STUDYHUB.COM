import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import {
  Users, UserPlus, FileText, DollarSign, Building, Shield, Calculator,
  Upload, Download, Check, X, Search, ChevronDown, ChevronRight,
  Calendar, Clock, AlertTriangle, CheckCircle, Briefcase, Edit, Trash2,
  FolderOpen, Eye, PenTool, BarChart3, TrendingUp, Info, Plus, Minus,
  CreditCard, Receipt, Home, Wifi, Globe, BookOpen, Star, ArrowRight
} from 'lucide-react'

interface Props {
  onNavigate: (path: string) => void
}

// ─── Types ──────────────────────────────────────────────────────
interface Employee {
  id: string
  rut: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  birthDate: string
  nationality: string
  maritalStatus: string
  emergencyContactName: string
  emergencyContactPhone: string
  position: string
  department: string
  hireDate: string
  endDate: string | null
  contractType: string
  workSchedule: string
  weeklyHours: number
  grossSalary: number
  colacion: number
  movilizacion: number
  afp: string
  healthSystem: string
  isapreName: string | null
  isapreUf: number | null
  afcActive: boolean
  bankName: string
  bankAccountType: string
  bankAccountNumber: string
  status: string
  createdAt: string
}

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  periodMonth: number
  periodYear: number
  grossSalary: number
  gratificacion: number
  overtimeHours: number
  overtimeAmount: number
  bonuses: number
  colacion: number
  movilizacion: number
  totalHaberesImponibles: number
  totalHaberesNoImponibles: number
  afpEmployee: number
  healthEmployee: number
  afcEmployee: number
  taxAmount: number
  totalDeductions: number
  netSalary: number
  afpEmployer: number
  afcEmployer: number
  mutualEmployer: number
  totalEmployerCost: number
  status: string
}

interface OperationalExpense {
  id: string
  category: string
  description: string
  amountClp: number
  amountUsd: number | null
  providerName: string
  providerRut: string | null
  documentNumber: string
  documentType: string
  taxDeductible: boolean
  ivaAmount: number | null
  periodMonth: number
  periodYear: number
  recurring: boolean
  recurringFrequency: string | null
  createdAt: string
}

interface PreviredData {
  period: string
  employees: {
    rut: string
    name: string
    afp: string
    afpAmount: number
    healthSystem: string
    healthAmount: number
    afcEmployee: number
    afcEmployer: number
    sis: number
    mutual: number
    taxableIncome: number
  }[]
  totals: {
    totalAfp: number
    totalHealth: number
    totalAfcEmployee: number
    totalAfcEmployer: number
    totalSis: number
    totalMutual: number
  }
}

// ─── Constants ──────────────────────────────────────────────────
const AFP_OPTIONS = [
  { value: 'capital', label: 'Capital', rate: 11.44 },
  { value: 'cuprum', label: 'Cuprum', rate: 11.44 },
  { value: 'habitat', label: 'Habitat', rate: 11.27 },
  { value: 'modelo', label: 'Modelo', rate: 10.58 },
  { value: 'planvital', label: 'PlanVital', rate: 10.41 },
  { value: 'provida', label: 'ProVida', rate: 11.45 },
  { value: 'uno', label: 'Uno', rate: 10.69 },
]

const HEALTH_OPTIONS = [
  { value: 'fonasa', label: 'Fonasa (7%)' },
  { value: 'isapre', label: 'Isapre' },
]

const CONTRACT_TYPES = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'plazo_fijo', label: 'Plazo Fijo' },
  { value: 'por_obra', label: 'Por Obra o Faena' },
  { value: 'honorarios', label: 'Honorarios' },
]

const DEPARTMENTS = [
  'Tecnologia', 'Diseno', 'Marketing', 'Ventas', 'Operaciones',
  'Finanzas', 'Legal', 'Recursos Humanos', 'Soporte', 'Direccion'
]

const BANKS = [
  'Banco de Chile', 'Banco Estado', 'Banco Santander', 'BCI', 'Scotiabank',
  'Banco Itau', 'Banco BICE', 'Banco Security', 'Banco Falabella',
  'Banco Ripley', 'MACH', 'Cuenta RUT', 'Mercado Pago', 'Tenpo'
]

const EXPENSE_CATEGORIES = [
  { value: 'suscripcion', label: 'Suscripciones y Software' },
  { value: 'arriendo', label: 'Arriendo Oficina/Cowork' },
  { value: 'servicios', label: 'Servicios Basicos (luz, agua, internet)' },
  { value: 'equipamiento', label: 'Equipamiento y Hardware' },
  { value: 'marketing', label: 'Marketing y Publicidad' },
  { value: 'legal', label: 'Servicios Legales' },
  { value: 'contabilidad', label: 'Contabilidad y Auditoria' },
  { value: 'hosting', label: 'Hosting y Infraestructura Cloud' },
  { value: 'dominio', label: 'Dominios y Certificados' },
  { value: 'capacitacion', label: 'Capacitacion' },
  { value: 'viajes', label: 'Viajes y Representacion' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otro', label: 'Otro' },
]

const TABS = [
  { id: 'personal', label: 'Personal', icon: Users },
  { id: 'contratos', label: 'Contratos', icon: FileText },
  { id: 'payroll', label: 'PayRoll', icon: DollarSign },
  { id: 'tutores', label: 'Tutores Externos', icon: BookOpen, highlight: true },
  { id: 'gastos', label: 'Gastos Operacionales', icon: Receipt },
  { id: 'impuestos', label: 'Impuestos / F129', icon: Calculator },
  { id: 'legal', label: 'Legal y Compliance', icon: Shield },
  { id: 'owner', label: 'Guia del Owner', icon: Star },
]

const PAYROLL_SUBTABS = [
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'previred', label: 'Previred' },
  { id: 'finiquitos', label: 'Finiquitos' },
  { id: 'historial', label: 'Historial de Pagos' },
]

const fmt = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return '0'
  return Math.round(n).toLocaleString('es-CL')
}

// ─── Main Component ─────────────────────────────────────────────
export default function HRDashboard({ onNavigate }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [payrollSubTab, setPayrollSubTab] = useState('liquidaciones')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [expenses, setExpenses] = useState<OperationalExpense[]>([])
  const [previredData, setPreviredData] = useState<PreviredData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')

  // Check access
  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>Solo el owner puede acceder al modulo de RRHH.</p>
      </div>
    )
  }

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees()
      setEmployees(data || [])
    } catch { setEmployees([]) }
  }

  const loadPayroll = async () => {
    try {
      const data = await api.getPayroll(selectedYear, selectedMonth)
      setPayroll(data || [])
    } catch { setPayroll([]) }
  }

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses(`year=${selectedYear}&month=${selectedMonth}`)
      setExpenses(data || [])
    } catch { setExpenses([]) }
  }

  const loadPrevired = async () => {
    try {
      const data = await api.getPrevired(selectedYear, selectedMonth)
      setPreviredData(data || null)
    } catch { setPreviredData(null) }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (activeTab === 'payroll') { loadPayroll(); loadPrevired() }
    if (activeTab === 'gastos' || activeTab === 'impuestos') loadExpenses()
  }, [activeTab, selectedMonth, selectedYear])

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} /> Recursos Humanos
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Gestion de personal, remuneraciones y cumplimiento legal — Legislacion Chilena
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: tab.highlight && activeTab !== tab.id ? '1px solid #f59e0b' : 'none',
              background: activeTab === tab.id
                ? (tab.highlight ? '#f59e0b' : 'var(--accent)')
                : (tab.highlight ? 'rgba(245,158,11,0.1)' : 'var(--bg-secondary)'),
              color: activeTab === tab.id ? '#fff' : (tab.highlight ? '#f59e0b' : 'var(--text-secondary)'),
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Period Selector (shared across tabs) */}
      {['payroll', 'gastos', 'impuestos', 'tutores'].includes(activeTab) && (
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
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Personal */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'personal' && (
        <PersonalTab
          employees={employees}
          onRefresh={loadEmployees}
          showAdd={showAddEmployee}
          setShowAdd={setShowAddEmployee}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Contratos */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'contratos' && (
        <ContratosTab employees={employees} onRefresh={loadEmployees} />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: PayRoll (sub-tabs inside) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
            {PAYROLL_SUBTABS.map(st => (
              <button key={st.id} onClick={() => setPayrollSubTab(st.id)} style={{
                padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
                background: payrollSubTab === st.id ? 'var(--accent)' : 'transparent',
                color: payrollSubTab === st.id ? '#fff' : 'var(--text-muted)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
                {st.label}
              </button>
            ))}
          </div>

          {payrollSubTab === 'liquidaciones' && (
            <RemuneracionesTab payroll={payroll} employees={employees} month={selectedMonth} year={selectedYear} onRefresh={loadPayroll} />
          )}
          {payrollSubTab === 'previred' && (
            <PreviredTab data={previredData} month={selectedMonth} year={selectedYear} onRefresh={loadPrevired} />
          )}
          {payrollSubTab === 'finiquitos' && (
            <FiniquitosTab employees={employees} />
          )}
          {payrollSubTab === 'historial' && (
            <HistorialPagosTab payroll={payroll} month={selectedMonth} year={selectedYear} />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Tutores Externos */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tutores' && (
        <TutoresExternosTab month={selectedMonth} year={selectedYear} />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Gastos Operacionales */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'gastos' && (
        <GastosTab
          expenses={expenses}
          month={selectedMonth}
          year={selectedYear}
          onRefresh={loadExpenses}
          showAdd={showAddExpense}
          setShowAdd={setShowAddExpense}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Impuestos / F129 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'impuestos' && (
        <ImpuestosTab expenses={expenses} year={selectedYear} month={selectedMonth} />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Legal y Compliance */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'legal' && <LegalTab />}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Guia del Owner */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'owner' && <OwnerGuideTab />}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// PERSONAL TAB
// ═════════════════════════════════════════════════════════════════
function PersonalTab({ employees, onRefresh, showAdd, setShowAdd, selectedEmployee, setSelectedEmployee, searchTerm, setSearchTerm }: any) {
  const [form, setForm] = useState<any>({
    rut: '', firstName: '', lastName: '', email: '', phone: '', address: '',
    birthDate: '', nationality: 'Chilena', maritalStatus: 'soltero',
    emergencyContactName: '', emergencyContactPhone: '',
    position: '', department: 'Tecnologia', hireDate: '', contractType: 'indefinido',
    workSchedule: 'full_time', weeklyHours: 45,
    grossSalary: 500000, colacion: 0, movilizacion: 0,
    afp: 'modelo', healthSystem: 'fonasa', isapreName: '', isapreUf: 0,
    afcActive: true, bankName: 'Banco Estado', bankAccountType: 'cuenta_vista', bankAccountNumber: '',
  })
  const [saving, setSaving] = useState(false)

  const filtered = employees.filter((e: Employee) =>
    `${e.firstName} ${e.lastName} ${e.rut} ${e.position}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.createEmployee(form)
      setShowAdd(false)
      onRefresh()
    } catch (err) {
      alert('Error al guardar empleado')
    }
    setSaving(false)
  }

  return (
    <div>
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
        <button onClick={() => setShowAdd(true)} style={btnPrimary}>
          <UserPlus size={16} /> Agregar Empleado
        </button>
      </div>

      {/* Employee List */}
      {filtered.length === 0 ? (
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
      ) : (
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
      )}

      {/* Employee Detail Panel */}
      {selectedEmployee && (
        <EmployeeDetail employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onRefresh={onRefresh} />
      )}

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
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
              <SelectField label="Estado Civil" value={form.maritalStatus} onChange={v => setForm({ ...form, maritalStatus: v })} options={[
                { value: 'soltero', label: 'Soltero/a' }, { value: 'casado', label: 'Casado/a' },
                { value: 'divorciado', label: 'Divorciado/a' }, { value: 'viudo', label: 'Viudo/a' },
              ]} />
            </div>

            <SectionTitle>Contacto de Emergencia</SectionTitle>
            <div style={grid2}>
              <FormField label="Nombre" value={form.emergencyContactName} onChange={v => setForm({ ...form, emergencyContactName: v })} />
              <FormField label="Telefono" value={form.emergencyContactPhone} onChange={v => setForm({ ...form, emergencyContactPhone: v })} />
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

            <SectionTitle>Remuneracion</SectionTitle>
            <div style={grid2}>
              <FormField label="Sueldo Bruto (CLP)" value={form.grossSalary} onChange={v => setForm({ ...form, grossSalary: Number(v) })} type="number" required />
              <FormField label="Colacion (CLP)" value={form.colacion} onChange={v => setForm({ ...form, colacion: Number(v) })} type="number" />
              <FormField label="Movilizacion (CLP)" value={form.movilizacion} onChange={v => setForm({ ...form, movilizacion: Number(v) })} type="number" />
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

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={btnSecondary}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? 'Guardando...' : 'Guardar Empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
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
// CONTRATOS TAB
// ═════════════════════════════════════════════════════════════════
function ContratosTab({ employees, onRefresh }: { employees: Employee[]; onRefresh: () => void }) {
  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 16, background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))' }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} /> Gestion de Contratos
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Segun el Codigo del Trabajo de Chile, el contrato debe firmarse dentro de los primeros 15 dias (indefinido) o 5 dias (plazo fijo) desde el inicio de la relacion laboral.
        </p>
      </div>

      {/* Contract status for each employee */}
      <div style={{ display: 'grid', gap: 12 }}>
        {employees.filter(e => e.status === 'active').map(emp => {
          const daysSinceHire = Math.floor((Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24))
          const contractDeadline = emp.contractType === 'plazo_fijo' ? 5 : 15

          return (
            <div key={emp.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.firstName} {emp.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {CONTRACT_TYPES.find(c => c.value === emp.contractType)?.label} • Ingreso: {new Date(emp.hireDate).toLocaleDateString('es-CL')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnSmall}><FileText size={14} /> Generar Contrato</button>
                  <button style={btnSmall}><PenTool size={14} /> Firmar</button>
                  <button style={btnSmall}><FileText size={14} /> Anexo</button>
                </div>
              </div>

              {/* Contract clauses reminder */}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12 }}>
                <strong>Clausulas obligatorias (Art. 10 Codigo del Trabajo):</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, color: 'var(--text-muted)' }}>
                  <span>• Lugar y fecha del contrato</span>
                  <span>• Individualizacion de las partes</span>
                  <span>• Naturaleza de los servicios</span>
                  <span>• Lugar de prestacion de servicios</span>
                  <span>• Monto, forma y periodo de pago</span>
                  <span>• Duracion y distribucion de jornada</span>
                  <span>• Plazo del contrato</span>
                  <span>• Otros pactos acordados</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legal notes */}
      <div className="card" style={{ padding: 20, marginTop: 20, borderLeft: '4px solid var(--accent)' }}>
        <h4 style={{ margin: '0 0 12px' }}>Normativa Aplicable</h4>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p><strong>Art. 9:</strong> El contrato de trabajo es consensual; debera constar por escrito en los plazos legales.</p>
          <p><strong>Art. 10:</strong> Clausulas minimas obligatorias del contrato.</p>
          <p><strong>Art. 159-160:</strong> Causales de terminacion del contrato (necesidades de la empresa, mutuo acuerdo, renuncia, despido).</p>
          <p><strong>Art. 162:</strong> Obligacion de pago de cotizaciones al dia para validez del despido (Ley Bustos).</p>
          <p><strong>Art. 163:</strong> Indemnizacion por anos de servicio: 30 dias de ultima remuneracion por cada ano, tope 330 dias (11 anos). Tope mensual: 90 UF.</p>
          <p><strong>Art. 168:</strong> Recargo indemnizatorio por despido injustificado: 30% (art. 161), 50% (art. 159 N°4-5-6), 80% (art. 160).</p>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// REMUNERACIONES TAB
// ═════════════════════════════════════════════════════════════════
function RemuneracionesTab({ payroll, employees, month, year, onRefresh }: any) {
  const [calculating, setCalculating] = useState(false)

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      await api.calculatePayroll(month, year)
      onRefresh()
    } catch (err) {
      alert('Error al calcular nomina')
    }
    setCalculating(false)
  }

  const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div>
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
          <h3>Sin liquidaciones para {months[month]} {year}</h3>
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

// ═════════════════════════════════════════════════════════════════
// LIQUIDACION CARD
// ═════════════════════════════════════════════════════════════════
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
// PREVIRED TAB
// ═════════════════════════════════════════════════════════════════
function PreviredTab({ data, month, year, onRefresh }: { data: PreviredData | null; month: number; year: number; onRefresh: () => void }) {
  const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1e3a5f, #2d62c8)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={20} /> Consolidado Previred — {months[month]} {year}
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
            <button style={btnPrimary}><Download size={16} /> Descargar Planilla Previred</button>
            <button style={btnSecondary}><Globe size={16} /> Ir a Previred.com</button>
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

// ═════════════════════════════════════════════════════════════════
// GASTOS OPERACIONALES TAB
// ═════════════════════════════════════════════════════════════════
function GastosTab({ expenses, month, year, onRefresh, showAdd, setShowAdd }: any) {
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
      onRefresh()
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

// ═════════════════════════════════════════════════════════════════
// IMPUESTOS / F129 TAB
// ═════════════════════════════════════════════════════════════════
function ImpuestosTab({ expenses, year, month }: { expenses: OperationalExpense[]; year: number; month: number }) {
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

// ═════════════════════════════════════════════════════════════════
// LEGAL TAB
// ═════════════════════════════════════════════════════════════════
function LegalTab() {
  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1a2332, #2d62c8)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} /> Compliance Legal — Chile
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Checklist completo de cumplimiento legal para Conniku SpA como empleador en Chile.
        </p>
      </div>

      {/* Brand Registration Guide */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={18} /> Registro de Marca — INAPI
        </h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: 14 }}>Pasos para registrar "Conniku" en Chile:</h4>
          <ol style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            <li><strong>Busqueda previa:</strong> Verificar disponibilidad en <strong>inapi.cl</strong> → Busqueda de Marcas. Buscar "Conniku" en todas las clases.</li>
            <li><strong>Definir clases Niza:</strong>
              <ul style={{ marginTop: 4, lineHeight: 1.8 }}>
                <li><strong>Clase 9:</strong> Software, aplicaciones moviles, plataformas digitales</li>
                <li><strong>Clase 41:</strong> Servicios de educacion, formacion, ensenanza</li>
                <li><strong>Clase 42:</strong> SaaS, diseno y desarrollo de software, plataformas cloud</li>
                <li><strong>Clase 35:</strong> Publicidad, gestion de negocios (si aplica marketplace)</li>
              </ul>
            </li>
            <li><strong>Presentar solicitud:</strong> Portal online INAPI. Necesitas:
              <ul style={{ marginTop: 4, lineHeight: 1.8 }}>
                <li>RUT de la empresa (Conniku SpA)</li>
                <li>Representante legal</li>
                <li>Logo en formato digital (JPEG/PNG min 300 DPI)</li>
                <li>Descripcion detallada de productos/servicios por clase</li>
              </ul>
            </li>
            <li><strong>Pago:</strong> ~1 UTM (~$66,000 CLP) por cada clase solicitada</li>
            <li><strong>Publicacion:</strong> Se publica en el Diario Oficial por 30 dias para oposiciones</li>
            <li><strong>Examen de fondo:</strong> INAPI revisa distintividad y posibles conflictos (2-4 meses)</li>
            <li><strong>Resolucion:</strong> Si no hay oposiciones, se concede el registro por 10 anos (renovable)</li>
          </ol>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <strong>Recomendacion:</strong> Registrar minimo en Clases 9, 41 y 42. Costo estimado: ~3 UTM (~$198,000 CLP).
            Considerar tambien registro de dominio .cl si no lo tienes (NIC Chile).
            El proceso toma aproximadamente 4-8 meses en total.
          </div>
        </div>
      </div>

      {/* Labor Law Compliance */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Obligaciones como Empleador</h3>
        {[
          { title: 'Reglamento Interno de Orden, Higiene y Seguridad', description: 'Obligatorio con 10+ trabajadores (Art. 153 CT). Debe ser registrado en la Direccion del Trabajo e Inspeccion del Trabajo.', status: 'pending' },
          { title: 'Registro en Direccion del Trabajo', description: 'Inscripcion como empleador en dt.gob.cl. Necesario para inicio de actividades laborales.', status: 'pending' },
          { title: 'Mutual de Seguridad', description: 'Afiliacion a una mutual (ACHS, Mutual de Seguridad, IST) para seguro de accidentes laborales. Tasa base: 0.93%.', status: 'pending' },
          { title: 'Comite Paritario de Higiene y Seguridad', description: 'Obligatorio con 25+ trabajadores. 3 representantes del empleador y 3 de los trabajadores.', status: 'na' },
          { title: 'Obligacion de Informar (ODI)', description: 'Informar riesgos laborales al trabajador. DS 40 Art. 21. Debe quedar firmado.', status: 'pending' },
          { title: 'Libro de Remuneraciones Electronico', description: 'Obligatorio via DT desde 2021 para empresas con 5+ trabajadores. Envio mensual.', status: 'pending' },
          { title: 'Asistencia y Control de Jornada', description: 'Art. 33 CT. Registro de asistencia obligatorio (reloj control, libro, sistema electronico).', status: 'pending' },
          { title: 'Certificado de Cumplimiento Laboral', description: 'Obtener en dt.gob.cl. Necesario para licitaciones y contratos publicos.', status: 'pending' },
          { title: 'Ley Karin (Ley 21.643)', description: 'Protocolo de prevencion del acoso laboral, sexual y violencia en el trabajo. Obligatorio desde agosto 2024.', status: 'pending' },
          { title: 'Ley de Inclusion (Ley 21.015)', description: 'Empresas con 100+ trabajadores deben tener al menos 1% personas con discapacidad.', status: 'na' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            {item.status === 'done' ? <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} /> :
             item.status === 'na' ? <Minus size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} /> :
             <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 'auto',
              background: item.status === 'done' ? 'rgba(34,197,94,0.15)' : item.status === 'na' ? 'rgba(150,150,150,0.15)' : 'rgba(245,158,11,0.15)',
              color: item.status === 'done' ? '#22c55e' : item.status === 'na' ? 'var(--text-muted)' : '#f59e0b',
            }}>
              {item.status === 'done' ? 'CUMPLE' : item.status === 'na' ? 'N/A' : 'PENDIENTE'}
            </span>
          </div>
        ))}
      </div>

      {/* Data Protection */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Proteccion de Datos Personales</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p><strong>Ley 19.628:</strong> Proteccion de la vida privada. Obligacion de informar al trabajador sobre datos recopilados.</p>
          <p><strong>Ley 21.096:</strong> Proteccion de datos como garantia constitucional.</p>
          <p><strong>Recomendaciones:</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Consentimiento explicito del trabajador para tratamiento de datos</li>
            <li>Politica de privacidad laboral interna</li>
            <li>Clausula de confidencialidad en contratos</li>
            <li>Protocolo de eliminacion de datos al termino de relacion laboral</li>
            <li>Designar encargado de proteccion de datos (DPO)</li>
          </ul>
        </div>
      </div>

      {/* Links */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Enlaces Utiles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'SII — Servicio de Impuestos Internos', url: 'sii.cl' },
            { label: 'Direccion del Trabajo', url: 'dt.gob.cl' },
            { label: 'Previred — Cotizaciones', url: 'previred.com' },
            { label: 'INAPI — Registro de Marcas', url: 'inapi.cl' },
            { label: 'Superintendencia de Pensiones', url: 'spensiones.cl' },
            { label: 'Superintendencia de Salud', url: 'supersalud.gob.cl' },
            { label: 'ACHS — Mutual', url: 'achs.cl' },
            { label: 'NIC Chile — Dominios .cl', url: 'nic.cl' },
          ].map((link, i) => (
            <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Globe size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ flex: 1 }}>{link.label}</span>
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>{link.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// OWNER GUIDE TAB
// ═════════════════════════════════════════════════════════════════
function OwnerGuideTab() {
  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1a2332, #c8872d)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={20} /> Guia para el Owner — Conniku SpA
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Recomendaciones legales y tributarias para tu situacion como dueno-fundador de una SpA en Chile.
        </p>
      </div>

      {/* Compensation modalities */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Modalidades de Sueldo del Owner</h3>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* Option 1 */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, borderLeft: '4px solid #22c55e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 700 }}>RECOMENDADA</span>
              <h4 style={{ margin: 0, fontSize: 15 }}>Opcion 1: Sueldo como Trabajador Dependiente</h4>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p><strong>Como funciona:</strong> Te contratas a ti mismo como trabajador de tu SpA con contrato de trabajo y liquidacion de sueldo.</p>
              <p><strong>Ventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Cotizas AFP, salud y AFC (acceso a prestaciones sociales completas)</li>
                <li>El sueldo es gasto deducible para la empresa (reduce base imponible)</li>
                <li>Acceso a licencias medicas y seguro de cesantia</li>
                <li>Genera antiguedad laboral y ahorro previsional</li>
                <li>Compatible con retiros de utilidades adicionales</li>
              </ul>
              <p><strong>Desventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Mayor carga de cotizaciones (~20% del sueldo entre empleado y empleador)</li>
                <li>Impuesto Unico de 2da Categoria sobre el sueldo</li>
                <li>Costo empresa adicional (SIS, mutual, AFC empleador)</li>
              </ul>
              <div style={{ marginTop: 8, padding: 10, background: 'rgba(34,197,94,0.1)', borderRadius: 8 }}>
                <strong>Ejemplo con sueldo bruto $1,500,000:</strong><br />
                AFP Modelo: -$158,700 | Fonasa: -$105,000 | AFC: -$9,000 | Impuesto: ~$0<br />
                <strong>Liquido estimado: ~$1,227,300</strong><br />
                Costo empresa adicional: ~$73,000 (SIS + AFC emp + Mutual)
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Opcion 2: Boleta de Honorarios</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p><strong>Como funciona:</strong> Emites boleta de honorarios a tu propia SpA como trabajador independiente.</p>
              <p><strong>Ventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Retencion de 13.75% (2025) como PPM (puede recuperarse en renta anual)</li>
                <li>Menor carga administrativa mensual</li>
                <li>Flexibility en montos y frecuencia</li>
              </ul>
              <p><strong>Desventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Debes cotizar como independiente en la declaracion anual (Ley 21.133)</li>
                <li>Menor proteccion social (sin seguro de cesantia, licencias limitadas)</li>
                <li>El SII puede objetar si es tu unica fuente de ingreso (relacion laboral encubierta)</li>
              </ul>
            </div>
          </div>

          {/* Option 3 */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, borderLeft: '4px solid #8b5cf6' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Opcion 3: Retiro de Utilidades</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p><strong>Como funciona:</strong> La empresa genera utilidades y las retiras como dividendos/retiros.</p>
              <p><strong>Ventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>No pagas cotizaciones previsionales sobre retiros</li>
                <li>Puedes diferir los retiros (dejar utilidades en la empresa)</li>
                <li>Impuesto pagado por la empresa (25%) se usa como credito</li>
              </ul>
              <p><strong>Desventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Sin proteccion social (AFP, salud, cesantia) si no cotizas por otro medio</li>
                <li>Tributa con Impuesto Global Complementario (hasta 40%)</li>
                <li>No aplica si la empresa no tiene utilidades</li>
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, border: '2px solid var(--accent)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--accent)' }}>Recomendacion para tu caso (Conniku SpA, etapa early-stage):</h4>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <p><strong>Estrategia mixta recomendada:</strong></p>
              <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li><strong>Sueldo base como dependiente:</strong> Fijate un sueldo minimo razonable ($500,000 - $1,000,000 CLP) para cubrir cotizaciones y tener proteccion social.</li>
                <li><strong>Complementar con retiros de utilidades:</strong> Cuando la empresa genere ganancias, puedes retirar utilidades adicionales.</li>
                <li><strong>Nunca dejes de cotizar:</strong> Aunque sea el minimo, cotiza AFP y salud para no perder cobertura previsional.</li>
                <li><strong>Consulta un contador:</strong> Un contador puede optimizar la estructura tributaria segun los ingresos reales de Conniku.</li>
              </ol>
              <p style={{ marginTop: 8, padding: 8, background: 'rgba(45,98,200,0.1)', borderRadius: 8 }}>
                <strong>Dato clave:</strong> En una SpA, el sueldo del socio-trabajador es gasto deducible, lo que reduce la base imponible de la empresa. Si tu sueldo + gastos superan los ingresos, la empresa queda con perdida tributaria (arrastrable a anos futuros).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Creation Checklist */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Checklist de Creacion de Empresa en Chile</h3>
        {[
          { step: 1, title: 'Constitucion de la SpA', description: 'En tuempresaenundia.cl o con abogado. Escritura publica con estatutos, capital, administracion.', status: 'done' },
          { step: 2, title: 'Inscripcion en el Registro de Comercio', description: 'Conservador de Bienes Raices. Extracto publicado en el Diario Oficial.', status: 'done' },
          { step: 3, title: 'Obtener RUT de la empresa', description: 'Se obtiene automaticamente con la constitucion o en el SII.', status: 'done' },
          { step: 4, title: 'Inicio de Actividades en SII', description: 'sii.cl → Inicio de Actividades. Codigos de actividad economica: 620200 (desarrollo software), 855900 (educacion).', status: 'done' },
          { step: 5, title: 'Timbraje de documentos / DTE', description: 'Activar facturacion electronica en sii.cl. Emision de boletas y facturas.', status: 'pending' },
          { step: 6, title: 'Cuenta bancaria empresa', description: 'Abrir cuenta corriente a nombre de la SpA. Requiere: RUT, carpeta tributaria, escritura.', status: 'pending' },
          { step: 7, title: 'Registro de marca INAPI', description: 'Registrar "Conniku" en clases 9, 41, 42. Ver guia en pestana Legal.', status: 'pending' },
          { step: 8, title: 'Registro como empleador', description: 'dt.gob.cl para inscripcion laboral. Necesario antes de contratar.', status: 'pending' },
          { step: 9, title: 'Afiliacion a Mutual de Seguridad', description: 'ACHS, Mutual de Seguridad o IST. Obligatorio para accidentes laborales.', status: 'pending' },
          { step: 10, title: 'Politica de Privacidad y ToS', description: 'Documentos legales para la plataforma. Cumplimiento Ley 19.628.', status: 'done' },
          { step: 11, title: 'Contratar Contador', description: 'Para declaraciones mensuales (F29) y anuales (F22). Costo estimado: $50,000-$150,000/mes.', status: 'pending' },
          { step: 12, title: 'Patente Municipal', description: 'Patente comercial en la municipalidad donde opera la empresa. Costo: 0.25-0.5% del capital.', status: 'pending' },
        ].map(item => (
          <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: item.status === 'done' ? '#22c55e' : 'var(--bg-tertiary)',
              color: item.status === 'done' ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {item.status === 'done' ? <Check size={14} /> : item.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
              background: item.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              color: item.status === 'done' ? '#22c55e' : '#f59e0b',
            }}>
              {item.status === 'done' ? 'LISTO' : 'PENDIENTE'}
            </span>
          </div>
        ))}
      </div>

      {/* Key Advice */}
      <div className="card" style={{ padding: 20, borderLeft: '4px solid #22c55e' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Consejos Clave para tu Etapa</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p><strong>1. Formaliza todo:</strong> Aunque seas el unico, ten contrato de trabajo, liquidaciones y cotizaciones al dia. Te protege legalmente y genera historial.</p>
          <p><strong>2. Separa finanzas:</strong> Nunca mezcles gastos personales con los de la empresa. Ten una cuenta bancaria exclusiva para Conniku SpA.</p>
          <p><strong>3. Documenta gastos:</strong> Guarda TODAS las facturas. El IVA credito fiscal es dinero que recuperas. Un computador de $1M tiene $190,000 de IVA recuperable.</p>
          <p><strong>4. Aprovecha la depreciacion:</strong> En regimen Pro Pyme, los activos fijos se deprecian al 100% el primer ano (depreciacion instantanea). Compra equipos y registralos como activo.</p>
          <p><strong>5. PPM minimo:</strong> El Pago Provisional Mensual es solo 0.25% de ventas en Pro Pyme. Si no hay ventas, no hay PPM.</p>
          <p><strong>6. Perdidas tributarias:</strong> Si gastas mas de lo que ingresas, la perdida se arrastra y reduce impuestos futuros cuando haya utilidades.</p>
          <p><strong>7. Primer empleado:</strong> Cuando contrates, la Ley Bustos (Art. 162 CT) te obliga a tener TODAS las cotizaciones al dia para poder despedir validamente.</p>
          <p><strong>8. Registro de marca:</strong> Hazlo lo antes posible. Si alguien registra "Conniku" antes, perderas el nombre. Cuesta ~$200,000 CLP y toma 4-8 meses.</p>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════
// FINIQUITOS TAB
// ═════════════════════════════════════════════════════════════════
function FiniquitosTab({ employees }: { employees: Employee[] }) {
  const [selectedEmp, setSelectedEmp] = useState<string>('')
  const [causal, setCausal] = useState('161_necesidades')
  const [lastSalary, setLastSalary] = useState(0)
  const [yearsWorked, setYearsWorked] = useState(0)
  const [monthsExtra, setMonthsExtra] = useState(0)
  const [pendingVacationDays, setPendingVacationDays] = useState(0)
  const [avisoPrevio, setAvisoPrevio] = useState(true)
  const [result, setResult] = useState<any>(null)

  const CAUSALES = [
    { value: '159_1_mutuo', label: 'Art. 159 N°1 — Mutuo acuerdo', indemnizacion: false, aviso: false, recargo: 0 },
    { value: '159_2_renuncia', label: 'Art. 159 N°2 — Renuncia voluntaria', indemnizacion: false, aviso: false, recargo: 0 },
    { value: '159_4_vencimiento', label: 'Art. 159 N°4 — Vencimiento de plazo', indemnizacion: false, aviso: false, recargo: 0.5 },
    { value: '159_5_obra', label: 'Art. 159 N°5 — Conclusion de obra', indemnizacion: false, aviso: false, recargo: 0.5 },
    { value: '160_conducta', label: 'Art. 160 — Despido por falta grave (sin indemnizacion)', indemnizacion: false, aviso: false, recargo: 0 },
    { value: '161_necesidades', label: 'Art. 161 — Necesidades de la empresa', indemnizacion: true, aviso: true, recargo: 0 },
    { value: '161_desahucio', label: 'Art. 161 inc. 2 — Desahucio', indemnizacion: true, aviso: true, recargo: 0 },
    { value: '168_injustificado', label: 'Art. 168 — Despido injustificado', indemnizacion: true, aviso: true, recargo: 0.3 },
    { value: '168_improcedente_159', label: 'Art. 168 — Improcedente (causal 159 N°4-6)', indemnizacion: true, aviso: true, recargo: 0.5 },
    { value: '168_improcedente_160', label: 'Art. 168 — Improcedente (causal 160)', indemnizacion: true, aviso: true, recargo: 0.8 },
  ]

  const UF_VALUE = 38000

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

    // Dias trabajados del mes (estimado 15 dias)
    const diasTrabajados = dailySalary * 15

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

  useEffect(() => {
    if (selectedEmp) {
      const emp = employees.find(e => e.id === selectedEmp)
      if (emp) {
        setLastSalary(emp.grossSalary)
        const hire = new Date(emp.hireDate)
        const now = new Date()
        const diffMs = now.getTime() - hire.getTime()
        const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
        const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
        setYearsWorked(years)
        setMonthsExtra(months)
      }
    }
  }, [selectedEmp])

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
          <FormField label="Ultima Remuneracion Mensual (CLP)" value={lastSalary} onChange={(v: string) => setLastSalary(Number(v))} type="number" />
          <FormField label="Anos Trabajados" value={yearsWorked} onChange={(v: string) => setYearsWorked(Number(v))} type="number" />
          <FormField label="Meses Adicionales" value={monthsExtra} onChange={(v: string) => setMonthsExtra(Number(v))} type="number" />
          <FormField label="Dias de Vacaciones Pendientes" value={pendingVacationDays} onChange={(v: string) => setPendingVacationDays(Number(v))} type="number" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={avisoPrevio} onChange={e => setAvisoPrevio(e.target.checked)} id="aviso" />
            <label htmlFor="aviso" style={{ fontSize: 13 }}>Incluir indemnizacion sustitutiva del aviso previo (no se dio aviso de 30 dias)</label>
          </div>
        </div>

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
              <tr><td>Dias trabajados del mes (est. 15 dias)</td><td style={{ textAlign: 'right' }}>${fmt(result.diasTrabajados)}</td></tr>
              <tr style={{ borderTop: '3px solid var(--border)', fontSize: 18 }}>
                <td style={{ fontWeight: 800, paddingTop: 12 }}>TOTAL FINIQUITO BRUTO</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#ef4444', paddingTop: 12 }}>${fmt(result.totalBruto)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <strong>Requisitos legales para el finiquito:</strong><br />
            • Debe ser firmado ante un ministro de fe (notario, inspector del trabajo, o presidente del sindicato)<br />
            • Cotizaciones previsionales deben estar al dia (Ley Bustos, Art. 162)<br />
            • Se debe entregar copia del finiquito al trabajador<br />
            • El pago debe realizarse al momento de la firma<br />
            • Plazo para pagar: 10 dias habiles desde la terminacion del contrato
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button style={btnPrimary}><Download size={16} /> Generar PDF Finiquito</button>
            <button style={btnSecondary}><FileText size={16} /> Generar Carta de Despido</button>
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
          <p><strong>Art. 168:</strong> Despido injustificado — Recargo 30% (Art. 161), 50% (Art. 159 N°4-6), 80% (Art. 160) sobre indemnizacion total.</p>
          <p><strong>Art. 162 (Ley Bustos):</strong> Si las cotizaciones no estan al dia, el despido es NULO. Empleador debe seguir pagando hasta regularizar.</p>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// HISTORIAL DE PAGOS TAB
// ═════════════════════════════════════════════════════════════════
function HistorialPagosTab({ payroll, month, year }: { payroll: PayrollRecord[]; month: number; year: number }) {
  const months = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} /> Historial de Pagos — {months[month]} {year}
        </h3>
        {payroll.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Sin registros de pago para este periodo.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={thStyle}>Empleado</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Bruto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Descuentos</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Liquido</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Costo Emp.</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Fecha Pago</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((r: PayrollRecord) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{r.employeeName}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.grossSalary)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>-${fmt(r.totalDeductions)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(r.netSalary)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.totalEmployerCost)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                        background: r.status === 'paid' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: r.status === 'paid' ? '#22c55e' : '#f59e0b',
                      }}>{r.status === 'paid' ? 'Pagado' : r.status === 'approved' ? 'Aprobado' : 'Borrador'}</span>
                    </td>
                    <td style={tdStyle}>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TUTORES EXTERNOS TAB
// ═════════════════════════════════════════════════════════════════
function TutoresExternosTab({ month, year }: { month: number; year: number }) {
  const [tutorSubTab, setTutorSubTab] = useState<'overview' | 'applications' | 'payments' | 'directory'>('overview')
  const [tutors, setTutors] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    api.getEmployees().catch(() => {}) // placeholder - will use tutor endpoints
  }, [])

  return (
    <div>
      {/* Header with distinct color */}
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #92400e, #f59e0b)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} /> Tutores Externos — Prestadores de Servicios
        </h3>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
          Gestion de tutores con boleta de honorarios. Comision Conniku: 10%. El tutor recibe 90% bruto y es responsable de pagar su retencion al SII (13.75%).
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'applications', label: 'Postulaciones' },
          { id: 'payments', label: 'Pagos a Tutores' },
          { id: 'directory', label: 'Directorio' },
        ].map(st => (
          <button key={st.id} onClick={() => setTutorSubTab(st.id as any)} style={{
            padding: '8px 14px', borderRadius: 8, border: tutorSubTab === st.id ? 'none' : '1px solid #f59e0b33',
            background: tutorSubTab === st.id ? '#f59e0b' : 'rgba(245,158,11,0.05)',
            color: tutorSubTab === st.id ? '#fff' : '#f59e0b',
            fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>
            {st.label}
          </button>
        ))}
      </div>

      {tutorSubTab === 'overview' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Tutores Activos</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Postulaciones Pendientes</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Clases Este Mes</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Comisiones Conniku</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>$0</div>
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Como Funciona el Sistema de Tutores</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { step: 1, title: 'Estudiante Paga', desc: 'El estudiante selecciona un tutor, elige la clase y paga a traves de Conniku. Conniku retiene el 100% hasta confirmar la clase.' },
                { step: 2, title: 'Clase via Zoom', desc: 'El tutor crea el link de Zoom, levanta la clase en la plataforma. El estudiante recibe la invitacion una vez confirmado el pago.' },
                { step: 3, title: 'Pago al Tutor', desc: 'Confirmada la clase, el tutor sube su boleta de honorarios. Conniku paga el 90% en max 7 dias habiles. Conniku retiene 10% comision.' },
              ].map(s => (
                <div key={s.step} style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, margin: '0 auto 12px' }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tutor levels */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Niveles de Tutor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'rgba(245,158,11,0.05)', borderRadius: 8, border: '1px solid #f59e0b33' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b' }}>Tutor Nuevo</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>0-10 clases • Tarifa limitada • Badge amarillo</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid #3b82f633' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#3b82f6' }}>Tutor Regular</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>11-50 clases • Tarifa libre • Badge azul</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(168,85,247,0.05)', borderRadius: 8, border: '1px solid #a855f733' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#a855f7' }}>Tutor Premium</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>51+ clases • Rating 4.5+ • Prioridad busqueda</div>
              </div>
            </div>
          </div>

          {/* Pricing model */}
          <div className="card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Modelo de Precios y Comisiones</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p><strong>Tarifa individual:</strong> El tutor define su precio/hora libremente.</p>
              <p><strong>Tarifas grupales:</strong> El tutor fija precio para 2, 3, 4 y 5 estudiantes (maximo 5 por clase).</p>
              <p><strong>Comision Conniku:</strong> 10% fijo sobre el monto pagado por el estudiante.</p>
              <p><strong>Ejemplo:</strong> Estudiante paga $20,000 → Conniku retiene $2,000 (10%) → Tutor recibe $18,000 bruto.</p>
              <p><strong>Boleta:</strong> El tutor emite boleta de honorarios por $18,000 a nombre de Conniku SpA.</p>
              <p><strong>Retencion SII:</strong> El tutor paga 13.75% al SII ($2,475). Neto tutor: $15,525.</p>
              <p><strong>Frecuencia de pago:</strong> Por clase, quincenal o mensual (a eleccion del tutor).</p>
              <p><strong>Plazo de pago:</strong> Maximo 7 dias habiles desde recepcion de boleta validada.</p>
            </div>
          </div>
        </div>
      )}

      {tutorSubTab === 'applications' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <UserPlus size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
          <h3>Sin postulaciones pendientes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Cuando un profesional solicite ser tutor, aparecera aqui para revision y aprobacion.
          </p>
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'left', maxWidth: 500, margin: '16px auto 0' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Documentos requeridos para aprobacion:</h4>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p>• Cedula de identidad (ambos lados)</p>
              <p>• Titulo profesional o certificado alumno regular ultimo ano</p>
              <p>• Certificado de antecedentes (vigente, menos de 30 dias)</p>
              <p>• Curriculum vitae</p>
              <p>• Contrato de prestacion de servicios firmado digitalmente</p>
            </div>
          </div>
        </div>
      )}

      {tutorSubTab === 'payments' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Boletas Pendientes</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En Proceso</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pagados Este Mes</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>$0</div>
            </div>
          </div>

          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>Sin pagos a tutores este periodo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Los pagos aparecen cuando un tutor sube su boleta de honorarios despues de una clase confirmada.
            </p>
          </div>
        </div>
      )}

      {tutorSubTab === 'directory' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Users size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
          <h3>Directorio de Tutores</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: '8px auto' }}>
            Aqui veras todos los tutores aprobados con su perfil, rating, clases dadas y estado.
            En poco estara lista la plataforma para que los tutores se inscriban.
          </p>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
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

// ─── Styles ─────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 10, border: 'none',
  background: 'var(--accent)', color: '#fff', fontWeight: 600,
  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}

const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontWeight: 600, fontSize: 13,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}

const btnSmall: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
  fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
}

const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}

const thStyle: React.CSSProperties = {
  padding: '8px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 6px', fontSize: 12,
}
