import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { Employee } from '../shared/types'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { btnPrimary, btnSecondary, btnSmall, inputStyle, selectStyle, thStyle, tdStyle, fmt } from '../shared/styles'
import {
  Palmtree, Calendar, Users, Settings, Shield, Plus, Check, X,
  AlertTriangle, ChevronLeft, ChevronRight, Clock, FileText,
  Search, Eye, Filter
} from 'lucide-react'

// TODO: Connect to backend when leave endpoints are implemented

// ═════════════════════════════════════════════════════════════════
// VACACIONES TAB — Gestion de Vacaciones y Permisos
// Legislacion Chilena: Art. 67-73 Codigo del Trabajo
// ═════════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────

type LeaveType =
  | 'vacaciones'
  | 'permiso_legal'
  | 'paternidad'
  | 'licencia_medica'
  | 'permiso_sin_goce'
  | 'dia_administrativo'

type LeaveStatus = 'pendiente' | 'aprobada' | 'rechazada'

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  status: LeaveStatus
  reason: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

interface CompanyPolicy {
  allowDiaAdministrativo: boolean
  diasAdministrativosPerYear: number
  requireMinConsecutiveDays: boolean // Art. 70: al menos 10 dias consecutivos
}

type SubTab = 'saldos' | 'solicitudes' | 'calendario' | 'configuracion'

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacaciones: 'Vacaciones Anuales',
  permiso_legal: 'Permiso Legal (5 dias)',
  paternidad: 'Permiso Paternidad',
  licencia_medica: 'Licencia Medica',
  permiso_sin_goce: 'Permiso sin Goce',
  dia_administrativo: 'Dia Administrativo',
}

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  vacaciones: '#3b82f6',
  permiso_legal: '#8b5cf6',
  paternidad: '#06b6d4',
  licencia_medica: '#ef4444',
  permiso_sin_goce: '#f59e0b',
  dia_administrativo: '#10b981',
}

const STATUS_COLORS: Record<LeaveStatus, { bg: string; text: string }> = {
  pendiente: { bg: '#fef3c7', text: '#92400e' },
  aprobada: { bg: '#d1fae5', text: '#065f46' },
  rechazada: { bg: '#fee2e2', text: '#991b1b' },
}

// ─── Helper functions ────────────────────────────────────────────

function calcYearsOfService(hireDate: string): number {
  const hire = new Date(hireDate)
  const now = new Date()
  let years = now.getFullYear() - hire.getFullYear()
  const monthDiff = now.getMonth() - hire.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hire.getDate())) {
    years--
  }
  return Math.max(0, years)
}

function hasCompletedOneYear(hireDate: string): boolean {
  return calcYearsOfService(hireDate) >= 1
}

/**
 * Art. 68 CT — Vacaciones progresivas
 * Despues de 10 anos de servicio (con cualquier empleador),
 * 1 dia adicional por cada 3 anos de servicio extra.
 */
function calcProgressiveDays(yearsOfService: number): number {
  const { fromYear, extraPerYears, extraDays } = CHILE_LABOR.FERIADO.progresivo
  if (yearsOfService < fromYear) return 0
  const extraYears = yearsOfService - fromYear
  return Math.floor(extraYears / extraPerYears) * extraDays
}

function calcTotalEntitled(yearsOfService: number): number {
  return CHILE_LABOR.FERIADO.diasBase + calcProgressiveDays(yearsOfService)
}

function countWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++ // Excluir sabados y domingos
    d.setDate(d.getDate() + 1)
  }
  return count
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Mock Data ───────────────────────────────────────────────────

// Datos reales vienen de la API — sin datos demo
const MOCK_EMPLOYEES: Employee[] = []
const MOCK_REQUESTS: LeaveRequest[] = []
const MOCK_DAYS_USED: Record<string, number> = {}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════

export default function VacacionesTab() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SubTab>('saldos')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>(MOCK_REQUESTS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [policy, setPolicy] = useState<CompanyPolicy>({
    allowDiaAdministrativo: true,
    diasAdministrativosPerYear: 2,
    requireMinConsecutiveDays: true,
  })
  const [requestFilter, setRequestFilter] = useState<LeaveStatus | 'todas'>('todas')

  // ─── New request form state ───
  const [newRequest, setNewRequest] = useState({
    employeeId: '',
    type: 'vacaciones' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  })

  // ─── Load employees ───
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.getEmployees()
        if (data && data.length > 0) {
          setEmployees(data)
        } else {
          // Usar datos demo si no hay empleados en el backend
          setEmployees(MOCK_EMPLOYEES)
        }
      } catch {
        setEmployees(MOCK_EMPLOYEES)
      }
      setLoading(false)
    }
    load()
  }, [])

  // ─── Access check ───
  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>Solo el owner puede acceder al modulo de vacaciones.</p>
      </div>
    )
  }

  // ─── Computed: vacation balances ───
  const balances = employees
    .filter(e => e.status === 'active')
    .map(emp => {
      const years = calcYearsOfService(emp.hireDate)
      const eligible = hasCompletedOneYear(emp.hireDate)
      const baseDays = CHILE_LABOR.FERIADO.diasBase
      const progressiveDays = calcProgressiveDays(years)
      const totalEntitled = baseDays + progressiveDays
      const daysUsed = MOCK_DAYS_USED[emp.id] || 0
      const daysAvailable = eligible ? totalEntitled - daysUsed : 0
      // Art. 69: Acumulacion maxima de 2 periodos
      const maxAccumulation = totalEntitled * CHILE_LABOR.FERIADO.acumulacionMax
      const hasAccumulationAlert = daysAvailable >= maxAccumulation

      return {
        employee: emp,
        yearsOfService: years,
        eligible,
        baseDays,
        progressiveDays,
        totalEntitled,
        daysUsed,
        daysAvailable,
        hasAccumulationAlert,
      }
    })

  const filteredBalances = balances.filter(b =>
    `${b.employee.firstName} ${b.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.employee.rut.includes(searchTerm)
  )

  const filteredRequests = requests.filter(r =>
    requestFilter === 'todas' || r.status === requestFilter
  )

  // ─── Handlers ───

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'aprobada' as LeaveStatus, reviewedBy: 'CEO', reviewedAt: new Date().toISOString().split('T')[0] } : r
    ))
  }

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'rechazada' as LeaveStatus, reviewedBy: 'CEO', reviewedAt: new Date().toISOString().split('T')[0] } : r
    ))
  }

  const handleCreateRequest = () => {
    if (!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate) return
    const emp = employees.find(e => e.id === newRequest.employeeId)
    if (!emp) return

    const days = countWorkingDays(newRequest.startDate, newRequest.endDate)

    // Validacion Art. 70: Si es vacaciones, al menos una fraccion >= 10 dias
    if (newRequest.type === 'vacaciones' && policy.requireMinConsecutiveDays && days < 10) {
      const balance = balances.find(b => b.employee.id === newRequest.employeeId)
      if (balance && balance.daysUsed === 0) {
        // Primera solicitud del periodo debe ser >= 10 dias
        alert('Art. 70 CT: La primera fraccion de vacaciones debe ser de al menos 10 dias habiles consecutivos.')
        return
      }
    }

    // Validacion permiso legal: exactamente 5 dias
    if (newRequest.type === 'permiso_legal' && days !== 5) {
      alert('Ley 21.247: El permiso legal por fallecimiento es de exactamente 5 dias habiles.')
      return
    }

    // Validacion paternidad: exactamente 5 dias
    if (newRequest.type === 'paternidad' && days !== 5) {
      alert('Art. 195 CT: El permiso de paternidad es de exactamente 5 dias habiles.')
      return
    }

    const request: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: newRequest.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      type: newRequest.type,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      days,
      status: 'pendiente',
      reason: newRequest.reason,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setRequests(prev => [request, ...prev])
    setShowNewRequest(false)
    setNewRequest({ employeeId: '', type: 'vacaciones', startDate: '', endDate: '', reason: '' })
  }

  // ─── Calendar helpers ───
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay()
    const days: (number | null)[] = []
    // Offset for Monday-start week (0=Mon ... 6=Sun)
    const offset = firstDay === 0 ? 6 : firstDay - 1
    for (let i = 0; i < offset; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [calendarMonth, calendarYear])

  const getEventsForDay = (day: number): LeaveRequest[] => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return requests.filter(r => {
      if (r.status === 'rechazada') return false
      return dateStr >= r.startDate && dateStr <= r.endDate
    })
  }

  // ─── Style helpers ───
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)', borderRadius: 12, padding: 20,
    border: '1px solid var(--border)',
  }

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.2s',
  })

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 6,
    fontSize: 11, fontWeight: 600, background: color + '20', color,
  })

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Palmtree size={28} /> Vacaciones y Permisos
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Gestion de vacaciones, permisos y licencias — Art. 67-73 Codigo del Trabajo
        </p>
      </div>

      {/* ─── Legal Summary Bar ─── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4,
      }}>
        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Base Anual</span>{' '}
          <strong>{CHILE_LABOR.FERIADO.diasBase} dias</strong>
        </div>
        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Progresivo</span>{' '}
          <strong>+1 dia / 3 años (desde 10 años)</strong>
        </div>
        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Max Acumulacion</span>{' '}
          <strong>{CHILE_LABOR.FERIADO.acumulacionMax} periodos</strong>
        </div>
        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Min Consecutivo</span>{' '}
          <strong>10 dias (Art. 70)</strong>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)',
        borderRadius: 12, padding: 4, border: '1px solid var(--border)',
      }}>
        <button style={tabBtnStyle(activeTab === 'saldos')} onClick={() => setActiveTab('saldos')}>
          <Users size={16} /> Saldos
        </button>
        <button style={tabBtnStyle(activeTab === 'solicitudes')} onClick={() => setActiveTab('solicitudes')}>
          <FileText size={16} /> Solicitudes
          {requests.filter(r => r.status === 'pendiente').length > 0 && (
            <span style={{
              background: '#ef4444', color: '#fff', borderRadius: '50%',
              width: 18, height: 18, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 700,
            }}>
              {requests.filter(r => r.status === 'pendiente').length}
            </span>
          )}
        </button>
        <button style={tabBtnStyle(activeTab === 'calendario')} onClick={() => setActiveTab('calendario')}>
          <Calendar size={16} /> Calendario
        </button>
        <button style={tabBtnStyle(activeTab === 'configuracion')} onClick={() => setActiveTab('configuracion')}>
          <Settings size={16} /> Configuracion
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: SALDOS                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'saldos' && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                {balances.length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Empleados Activos</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                {balances.filter(b => b.daysAvailable > 10).length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Saldo Holgado (&gt;10d)</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
                {balances.filter(b => b.daysAvailable >= 5 && b.daysAvailable <= 10).length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Saldo Medio (5-10d)</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>
                {balances.filter(b => b.daysAvailable < 5).length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Saldo Bajo (&lt;5d)</div>
            </div>
          </div>

          {/* Balances Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Clock size={24} style={{ marginBottom: 8 }} />
              <p>Cargando empleados...</p>
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 16 }}>Empleado</th>
                      <th style={thStyle}>Ingreso</th>
                      <th style={thStyle}>Antiguedad</th>
                      <th style={thStyle}>Base</th>
                      <th style={thStyle}>Progresivo</th>
                      <th style={thStyle}>Total</th>
                      <th style={thStyle}>Usados</th>
                      <th style={thStyle}>Disponibles</th>
                      <th style={thStyle}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalances.map(b => {
                      const colorAvailable = b.daysAvailable > 10
                        ? '#10b981'
                        : b.daysAvailable >= 5
                          ? '#f59e0b'
                          : '#ef4444'

                      return (
                        <tr key={b.employee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ ...tdStyle, paddingLeft: 16 }}>
                            <div>
                              <strong style={{ fontSize: 13 }}>{b.employee.firstName} {b.employee.lastName}</strong>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {b.employee.position} — {b.employee.department}
                              </div>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{formatDate(b.employee.hireDate)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {b.yearsOfService} año{b.yearsOfService !== 1 ? 's' : ''}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{b.baseDays}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {b.progressiveDays > 0 ? (
                              <span style={badgeStyle('#8b5cf6')}>+{b.progressiveDays}</span>
                            ) : '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{b.totalEntitled}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{b.daysUsed}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{
                              ...badgeStyle(colorAvailable),
                              fontSize: 13, fontWeight: 800,
                            }}>
                              {b.eligible ? b.daysAvailable : 'N/A'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {!b.eligible && (
                              <span style={badgeStyle('#6b7280')}>Sin derecho aun</span>
                            )}
                            {b.hasAccumulationAlert && (
                              <span style={{
                                ...badgeStyle('#ef4444'),
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <AlertTriangle size={12} /> Acumulacion max (Art. 69)
                              </span>
                            )}
                            {b.eligible && !b.hasAccumulationAlert && (
                              <span style={badgeStyle('#10b981')}>Al dia</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredBalances.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron empleados.
                </div>
              )}
            </div>
          )}

          {/* Legal Notes */}
          <div style={{
            marginTop: 16, padding: '12px 16px', background: 'var(--bg-secondary)',
            borderRadius: 10, border: '1px solid var(--border)', fontSize: 11,
            color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            <strong>Normativa aplicable:</strong> Art. 67 CT (15 dias base) | Art. 68 CT (progresivo desde 10 años) |
            Art. 69 CT (max 2 periodos acumulados, empleador puede forzar) |
            Art. 70 CT (fraccionamiento, min 10 dias consecutivos) |
            Art. 73 CT (compensacion solo al termino de relacion laboral)
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: SOLICITUDES                                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'solicitudes' && (
        <div>
          {/* Actions bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['todas', 'pendiente', 'aprobada', 'rechazada'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setRequestFilter(f)}
                  style={{
                    ...btnSmall,
                    background: requestFilter === f ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: requestFilter === f ? '#fff' : 'var(--text-secondary)',
                    border: requestFilter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                </button>
              ))}
            </div>
            <button style={btnPrimary} onClick={() => setShowNewRequest(true)}>
              <Plus size={16} /> Nueva Solicitud
            </button>
          </div>

          {/* New Request Form */}
          {showNewRequest && (
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nueva Solicitud de Permiso</h3>
                <button
                  onClick={() => setShowNewRequest(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Empleado
                  </label>
                  <select
                    style={selectStyle}
                    value={newRequest.employeeId}
                    onChange={e => setNewRequest(prev => ({ ...prev, employeeId: e.target.value }))}
                  >
                    <option value="">Seleccionar...</option>
                    {employees.filter(e => e.status === 'active').map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Tipo de Permiso
                  </label>
                  <select
                    style={selectStyle}
                    value={newRequest.type}
                    onChange={e => setNewRequest(prev => ({ ...prev, type: e.target.value as LeaveType }))}
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => {
                      if (key === 'dia_administrativo' && !policy.allowDiaAdministrativo) return null
                      return <option key={key} value={key}>{label}</option>
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={newRequest.startDate}
                    onChange={e => setNewRequest(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Fecha Termino
                  </label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={newRequest.endDate}
                    onChange={e => setNewRequest(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Motivo / Observaciones
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Motivo de la solicitud..."
                    value={newRequest.reason}
                    onChange={e => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>

              {/* Preview days */}
              {newRequest.startDate && newRequest.endDate && (
                <div style={{
                  marginTop: 12, padding: '8px 12px', background: 'var(--bg-primary)',
                  borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Clock size={14} />
                  <strong>{countWorkingDays(newRequest.startDate, newRequest.endDate)} dias habiles</strong>
                  <span style={{ color: 'var(--text-muted)' }}>
                    ({formatDate(newRequest.startDate)} al {formatDate(newRequest.endDate)})
                  </span>
                </div>
              )}

              {/* Legal hints */}
              {newRequest.type === 'vacaciones' && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: '#eff6ff',
                  borderRadius: 8, fontSize: 11, color: '#1e40af',
                }}>
                  Art. 70 CT: Las vacaciones pueden fraccionarse, pero al menos una parte debe ser de 10 dias habiles consecutivos.
                </div>
              )}
              {newRequest.type === 'permiso_legal' && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: '#f5f3ff',
                  borderRadius: 8, fontSize: 11, color: '#5b21b6',
                }}>
                  Ley 21.247: 5 dias habiles pagados por fallecimiento de conyuge, conviviente civil, hijo o padre. El trabajador debe acreditar con certificado de defuncion.
                </div>
              )}
              {newRequest.type === 'paternidad' && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: '#ecfeff',
                  borderRadius: 8, fontSize: 11, color: '#155e75',
                }}>
                  Art. 195 CT: 5 dias pagados por nacimiento de hijo. Se cuentan desde el dia del parto.
                </div>
              )}
              {newRequest.type === 'licencia_medica' && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: '#fef2f2',
                  borderRadius: 8, fontSize: 11, color: '#991b1b',
                }}>
                  Las licencias medicas son administradas por Fonasa/Isapre. El empleador solo registra para control interno.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button style={btnSecondary} onClick={() => setShowNewRequest(false)}>Cancelar</button>
                <button style={btnPrimary} onClick={handleCreateRequest}>
                  <Plus size={16} /> Crear Solicitud
                </button>
              </div>
            </div>
          )}

          {/* Requests Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 16 }}>Empleado</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Fecha Inicio</th>
                    <th style={thStyle}>Fecha Termino</th>
                    <th style={thStyle}>Dias</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Motivo</th>
                    <th style={thStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, paddingLeft: 16, fontWeight: 600 }}>
                        {r.employeeName}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          ...badgeStyle(LEAVE_TYPE_COLORS[r.type]),
                          whiteSpace: 'nowrap',
                        }}>
                          {LEAVE_TYPE_LABELS[r.type]}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{formatDate(r.startDate)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{formatDate(r.endDate)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{r.days}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: STATUS_COLORS[r.status].bg, color: STATUS_COLORS[r.status].text,
                        }}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', maxWidth: 160 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {r.reason || '—'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {r.status === 'pendiente' ? (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(r.id)}
                              style={{
                                ...btnSmall, background: '#d1fae5', color: '#065f46',
                                border: '1px solid #a7f3d0',
                              }}
                              title="Aprobar"
                            >
                              <Check size={14} /> Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              style={{
                                ...btnSmall, background: '#fee2e2', color: '#991b1b',
                                border: '1px solid #fecaca',
                              }}
                              title="Rechazar"
                            >
                              <X size={14} /> Rechazar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {r.reviewedBy && `Por: ${r.reviewedBy}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRequests.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay solicitudes{requestFilter !== 'todas' ? ` con estado "${requestFilter}"` : ''}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: CALENDARIO                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'calendario' && (
        <div>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              style={btnSecondary}
              onClick={() => {
                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) }
                else setCalendarMonth(m => m - 1)
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>
              {new Date(calendarYear, calendarMonth).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              style={btnSecondary}
              onClick={() => {
                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) }
                else setCalendarMonth(m => m + 1)
              }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: LEAVE_TYPE_COLORS[key as LeaveType],
                }} />
                {label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            {/* Weekday headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--border)',
            }}>
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
                <div key={day} style={{
                  padding: '10px 4px', textAlign: 'center', fontSize: 11,
                  fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.map((day, idx) => {
                const events = day ? getEventsForDay(day) : []
                const isToday = day && calendarYear === new Date().getFullYear() &&
                  calendarMonth === new Date().getMonth() && day === new Date().getDate()
                const isWeekend = idx % 7 === 5 || idx % 7 === 6

                return (
                  <div
                    key={idx}
                    style={{
                      minHeight: 80, padding: 4,
                      borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                      borderBottom: '1px solid var(--border)',
                      background: isToday
                        ? 'var(--accent-bg, rgba(59, 130, 246, 0.05))'
                        : isWeekend
                          ? 'var(--bg-primary)'
                          : 'transparent',
                    }}
                  >
                    {day && (
                      <>
                        <div style={{
                          fontSize: 12, fontWeight: isToday ? 800 : 500,
                          color: isToday ? 'var(--accent)' : isWeekend ? 'var(--text-muted)' : 'var(--text-primary)',
                          marginBottom: 2, paddingLeft: 4,
                        }}>
                          {day}
                        </div>
                        {events.map(ev => (
                          <div
                            key={ev.id}
                            style={{
                              fontSize: 10, padding: '2px 4px', marginBottom: 1,
                              borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              background: LEAVE_TYPE_COLORS[ev.type] + '20',
                              color: LEAVE_TYPE_COLORS[ev.type],
                              borderLeft: `3px solid ${LEAVE_TYPE_COLORS[ev.type]}`,
                              fontWeight: 600,
                            }}
                            title={`${ev.employeeName} — ${LEAVE_TYPE_LABELS[ev.type]}`}
                          >
                            {ev.employeeName.split(' ')[0]}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: CONFIGURACION                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'configuracion' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          {/* Company Policy */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={18} /> Politica de la Empresa
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Dia administrativo toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Dia Administrativo</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Permitir dias administrativos (beneficio empresa, no legal)
                  </div>
                </div>
                <button
                  onClick={() => setPolicy(p => ({ ...p, allowDiaAdministrativo: !p.allowDiaAdministrativo }))}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: policy.allowDiaAdministrativo ? 'var(--accent)' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: policy.allowDiaAdministrativo ? 25 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {policy.allowDiaAdministrativo && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Dias administrativos por año
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={policy.diasAdministrativosPerYear}
                    onChange={e => setPolicy(p => ({ ...p, diasAdministrativosPerYear: parseInt(e.target.value) || 1 }))}
                    style={{ ...inputStyle, maxWidth: 100 }}
                  />
                </div>
              )}

              {/* Min consecutive days */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Validar Minimo 10 Dias Consecutivos</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Art. 70 CT: La primera fraccion de vacaciones debe ser al menos 10 dias habiles
                  </div>
                </div>
                <button
                  onClick={() => setPolicy(p => ({ ...p, requireMinConsecutiveDays: !p.requireMinConsecutiveDays }))}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: policy.requireMinConsecutiveDays ? 'var(--accent)' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: policy.requireMinConsecutiveDays ? 25 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            </div>
          </div>

          {/* Progressive Vacation Calculator */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} /> Calculadora de Vacaciones Progresivas
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Art. 68 CT: Trabajadores con mas de 10 años de servicio (para uno o mas empleadores) tienen derecho a 1 dia adicional de vacaciones por cada 3 años nuevos de servicio.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Años de Servicio</th>
                    <th style={thStyle}>Base</th>
                    <th style={thStyle}>Progresivo</th>
                    <th style={thStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 5, 10, 13, 16, 19, 22, 25].map(y => (
                    <tr key={y} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{y} años</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{CHILE_LABOR.FERIADO.diasBase}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {calcProgressiveDays(y) > 0 ? (
                          <span style={badgeStyle('#8b5cf6')}>+{calcProgressiveDays(y)}</span>
                        ) : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                        {calcTotalEntitled(y)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Accumulation Alerts */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Alertas de Acumulacion
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Art. 69 CT: El empleador puede obligar al trabajador a tomar vacaciones si ha acumulado 2 periodos. Las vacaciones no tomadas no se pierden.
            </p>

            {balances.filter(b => b.hasAccumulationAlert).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {balances.filter(b => b.hasAccumulationAlert).map(b => (
                  <div
                    key={b.employee.id}
                    style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: '#fef2f2', border: '1px solid #fecaca',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>
                        {b.employee.firstName} {b.employee.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: '#b91c1c' }}>
                        {b.daysAvailable} dias acumulados — Excede limite de {b.totalEntitled * 2} dias
                      </div>
                    </div>
                    <span style={badgeStyle('#ef4444')}>Accion requerida</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 20, textAlign: 'center', background: '#f0fdf4',
                borderRadius: 8, border: '1px solid #bbf7d0',
              }}>
                <Check size={24} style={{ color: '#16a34a', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                  Sin alertas de acumulacion
                </div>
                <div style={{ fontSize: 11, color: '#15803d' }}>
                  Todos los empleados estan dentro del limite de 2 periodos.
                </div>
              </div>
            )}
          </div>

          {/* Legal Reference */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} /> Referencia Legal
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { art: 'Art. 67 CT', desc: '15 dias habiles de vacaciones anuales despues de 1 año de servicio.' },
                { art: 'Art. 68 CT', desc: 'Vacaciones progresivas: +1 dia por cada 3 años nuevos despues de 10 años con uno o mas empleadores.' },
                { art: 'Art. 69 CT', desc: 'Maximo 2 periodos acumulados. El empleador puede forzar vacaciones si se excede.' },
                { art: 'Art. 70 CT', desc: 'Las vacaciones pueden fraccionarse por acuerdo. Una fraccion debe ser de al menos 10 dias habiles.' },
                { art: 'Art. 73 CT', desc: 'La compensacion en dinero de vacaciones solo procede al termino de la relacion laboral.' },
                { art: 'Ley 21.247', desc: '5 dias habiles pagados por fallecimiento de conyuge, conviviente civil, hijo o padre/madre.' },
                { art: 'Art. 195 CT', desc: '5 dias pagados de permiso de paternidad por nacimiento de un hijo.' },
              ].map(item => (
                <div key={item.art} style={{
                  padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 8,
                  borderLeft: '3px solid var(--accent)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)' }}>{item.art}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
