// TODO: Connect to backend when attendance endpoints are implemented
// ═════════════════════════════════════════════════════════════════
// ASISTENCIA TAB — Control de Asistencia y Jornada Laboral
// Cumplimiento Art. 22, 30-34 Codigo del Trabajo
// ═════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { Employee } from '../shared/types'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { btnPrimary, btnSecondary, btnSmall, fmt, inputStyle, selectStyle, thStyle, tdStyle } from '../shared/styles'
import {
  Clock, Users, CalendarDays, AlertTriangle, CheckCircle,
  Shield, Timer, BarChart3, LogIn, LogOut, Filter,
  TrendingUp, AlertCircle, FileText, ChevronDown, ChevronRight,
  Calendar, UserCheck, UserX, Coffee, Briefcase, Sun
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────

type AttendanceStatus = 'presente' | 'ausente' | 'permiso' | 'licencia' | 'vacaciones' | 'feriado'

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  entryTime: string | null
  exitTime: string | null
  totalHours: number
  overtimeHours: number
  status: AttendanceStatus
  isArt22Exempt: boolean
}

interface OvertimeRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  hours: number
  rate: number
  amount: number
  pactoExpiry: string | null
}

interface MonthlySummary {
  employeeId: string
  employeeName: string
  daysWorked: number
  daysAbsent: number
  overtimeHours: number
  totalHours: number
  weeklyAvgHours: number
  isCompliant: boolean
  isArt22Exempt: boolean
}

type ClockStatus = 'off' | 'working' | 'break'

type TabId = 'marcaje' | 'asistencia' | 'resumen' | 'horasExtra' | 'grafico'

// ─── StatCard ───────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, subtitle }: {
  icon: any; label: string; value: any; color: string; subtitle?: string
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

// ─── Status Badge ───────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; color: string }> = {
  presente:   { label: 'Presente',    bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  ausente:    { label: 'Ausente',     bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  permiso:    { label: 'Permiso',     bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  licencia:   { label: 'Licencia',    bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  vacaciones: { label: 'Vacaciones',  bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  feriado:    { label: 'Feriado',     bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
      background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.03em',
    }}>
      {cfg.label}
    </span>
  )
}

// ─── Helper: generate demo data ─────────────────────────────────

const DEFAULT_EMPLOYEES: { id: string; name: string; position: string; exempt: boolean }[] = []

function generateDemoData(employeeList?: { id: string; name: string; position: string; exempt: boolean }[]) {
  const demoEmployees = employeeList && employeeList.length > 0 ? employeeList : DEFAULT_EMPLOYEES

  const today = new Date()
  const records: AttendanceRecord[] = []
  const overtimeRecords: OvertimeRecord[] = []

  // Generate 30 days of attendance data
  for (let d = 0; d < 30; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const dayOfWeek = date.getDay()
    const dateStr = date.toISOString().split('T')[0]

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    for (const emp of demoEmployees) {
      const rand = Math.random()
      let status: AttendanceStatus = 'presente'
      let entryTime: string | null = null
      let exitTime: string | null = null
      let totalHours = 0
      let overtimeHours = 0

      if (rand > 0.92) {
        status = 'ausente'
      } else if (rand > 0.88) {
        status = 'permiso'
      } else if (rand > 0.85) {
        status = 'licencia'
      } else if (rand > 0.82) {
        status = 'vacaciones'
      } else {
        status = 'presente'
        const entryHour = 8 + Math.floor(Math.random() * 2)
        const entryMin = Math.floor(Math.random() * 30)
        entryTime = `${String(entryHour).padStart(2, '0')}:${String(entryMin).padStart(2, '0')}`

        const baseWorkHours = 9 // 9h with 1h lunch = 8h effective
        const extraMinutes = Math.random() > 0.7 ? Math.floor(Math.random() * 120) : 0
        const exitHour = entryHour + baseWorkHours + Math.floor(extraMinutes / 60)
        const exitMin = (entryMin + extraMinutes) % 60
        exitTime = `${String(exitHour).padStart(2, '0')}:${String(exitMin).padStart(2, '0')}`

        totalHours = baseWorkHours - 1 + extraMinutes / 60 // subtract lunch break (Art. 34)
        totalHours = Math.round(totalHours * 100) / 100

        if (totalHours > 9) {
          overtimeHours = Math.min(totalHours - 9, CHILE_LABOR.HORAS_EXTRA.maxDiarias)
          overtimeHours = Math.round(overtimeHours * 100) / 100
        }
      }

      records.push({
        id: `att-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateStr,
        entryTime,
        exitTime,
        totalHours,
        overtimeHours,
        status,
        isArt22Exempt: emp.exempt,
      })

      if (overtimeHours > 0) {
        const hourlyRate = 800000 / (45 * 4.33) // approximate hourly from monthly salary
        const overtimeAmount = Math.round(overtimeHours * hourlyRate * (1 + CHILE_LABOR.HORAS_EXTRA.recargo))
        overtimeRecords.push({
          id: `ot-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: dateStr,
          hours: overtimeHours,
          rate: 1 + CHILE_LABOR.HORAS_EXTRA.recargo, // 150%
          amount: overtimeAmount,
          pactoExpiry: d < 10 ? (() => {
            const exp = new Date()
            exp.setMonth(exp.getMonth() + 2)
            return exp.toISOString().split('T')[0]
          })() : null,
        })
      }
    }
  }

  return { demoEmployees, records, overtimeRecords }
}

// ─── Main Component ─────────────────────────────────────────────

export default function AsistenciaTab() {
  const { user } = useAuth()

  // ─── State ───
  const [activeTab, setActiveTab] = useState<TabId>('marcaje')
  const [clockStatus, setClockStatus] = useState<ClockStatus>('off')
  const [clockEntry, setClockEntry] = useState<string | null>(null)
  const [todayHours, setTodayHours] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedWorker, setSelectedWorker] = useState('')
  const [clockLoading, setClockLoading] = useState(false)
  const [clockError, setClockError] = useState<string | null>(null)

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [filterDateTo, setFilterDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Real data from API
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([])
  const [art22Exemptions, setArt22Exemptions] = useState<Record<string, boolean>>({})

  // ─── Helper: API records → frontend shape ───
  const mapApiRecord = useMemo(() => (r: any): AttendanceRecord => {
    const emp = employees.find(e => e.id === r.employee_id)
    return {
      id: r.id,
      employeeId: r.employee_id,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : r.employee_id,
      date: r.date,
      entryTime: r.entry_time ?? null,
      exitTime: r.exit_time ?? null,
      totalHours: r.total_hours ?? 0,
      overtimeHours: r.overtime_hours ?? 0,
      status: r.status as AttendanceStatus,
      isArt22Exempt: art22Exemptions[r.employee_id] ?? false,
    }
  }, [employees, art22Exemptions])

  // ─── Load employees + today status on mount ───
  useEffect(() => {
    api.getEmployees()
      .then((data: any) => {
        const emps: Employee[] = Array.isArray(data) ? data : []
        setEmployees(emps)
        const map: Record<string, boolean> = {}
        emps.forEach(e => { map[e.id] = e.isArt22Exempt ?? false })
        setArt22Exemptions(map)
      })
      .catch(() => {})

    api.getTodayAttendance()
      .then((data: any) => {
        if (data?.record?.entry_time && !data.record.exit_time) {
          setClockEntry(data.record.entry_time)
          setClockStatus('working')
        }
      })
      .catch(() => {})
  }, [])

  // ─── Load monthly attendance when month or employees change ───
  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    api.getMonthlyAttendance(year, month)
      .then((data: any) => {
        const records: AttendanceRecord[] = (Array.isArray(data) ? data : []).map(mapApiRecord)
        setAttendanceRecords(records)
        const ot: OvertimeRecord[] = records
          .filter(r => r.overtimeHours > 0)
          .map(r => {
            const emp = employees.find(e => e.id === r.employeeId)
            const hourlyRate = (emp?.grossSalary ?? 800000) / (45 * 4.33)
            return {
              id: `ot-${r.id}`,
              employeeId: r.employeeId,
              employeeName: r.employeeName,
              date: r.date,
              hours: r.overtimeHours,
              rate: hourlyRate,
              amount: Math.round(r.overtimeHours * hourlyRate * 1.5),
              pactoExpiry: null,
            }
          })
        setOvertimeRecords(ot)
      })
      .catch(() => {})
  }, [selectedMonth, mapApiRecord])

  // ─── Live clock ───
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // ─── Update today's hours while working ───
  useEffect(() => {
    if (clockStatus !== 'working' || !clockEntry) return
    const interval = setInterval(() => {
      const [h, m] = clockEntry.split(':').map(Number)
      const entry = new Date()
      entry.setHours(h, m, 0, 0)
      const diff = (Date.now() - entry.getTime()) / (1000 * 60 * 60)
      setTodayHours(Math.max(0, Math.round(diff * 100) / 100))
    }, 30000)
    return () => clearInterval(interval)
  }, [clockStatus, clockEntry])

  // ─── Reload monthly attendance helper ───
  const reloadMonth = async () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    try {
      const data: any = await api.getMonthlyAttendance(year, month)
      const records: AttendanceRecord[] = (Array.isArray(data) ? data : []).map(mapApiRecord)
      setAttendanceRecords(records)
    } catch {}
  }

  // ─── Clock In ───
  const handleClockIn = async () => {
    setClockLoading(true)
    setClockError(null)
    try {
      const res: any = await api.clockIn()
      setClockEntry(res.entry_time)
      setClockStatus('working')
      setTodayHours(0)
      await reloadMonth()
    } catch (err: any) {
      setClockError(err.message || 'Error al registrar entrada')
    } finally {
      setClockLoading(false)
    }
  }

  // ─── Clock Out ───
  const handleClockOut = async () => {
    setClockLoading(true)
    setClockError(null)
    try {
      const res: any = await api.clockOut()
      setTodayHours(res.total_hours ?? 0)
      setClockStatus('off')
      setClockEntry(null)
      await reloadMonth()
    } catch (err: any) {
      setClockError(err.message || 'Error al registrar salida')
    } finally {
      setClockLoading(false)
    }
  }

  // ─── Filtered attendance records ───
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      if (filterEmployee && r.employeeId !== filterEmployee) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (r.date < filterDateFrom || r.date > filterDateTo) return false
      return true
    }).sort((a, b) => b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName))
  }, [attendanceRecords, filterEmployee, filterStatus, filterDateFrom, filterDateTo])

  // ─── Monthly summaries ───
  const monthlySummaries = useMemo((): MonthlySummary[] => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const monthRecords = attendanceRecords.filter(r => {
      const d = new Date(r.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    const demoEmployees = employees.map(e => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
    }))

    return demoEmployees.map(emp => {
      const empRecords = monthRecords.filter(r => r.employeeId === emp.id)
      const daysWorked = empRecords.filter(r => r.status === 'presente').length
      const daysAbsent = empRecords.filter(r => r.status === 'ausente').length
      const totalHours = empRecords.reduce((sum, r) => sum + r.totalHours, 0)
      const overtimeHours = empRecords.reduce((sum, r) => sum + r.overtimeHours, 0)
      const weeksInMonth = 4.33
      const weeklyAvgHours = daysWorked > 0 ? Math.round((totalHours / weeksInMonth) * 100) / 100 : 0
      const isExempt = art22Exemptions[emp.id] || false
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        daysWorked,
        daysAbsent,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        weeklyAvgHours,
        isCompliant: isExempt || weeklyAvgHours <= 45,
        isArt22Exempt: isExempt,
      }
    })
  }, [attendanceRecords, selectedMonth, art22Exemptions, employees])

  // ─── Weekly hours for chart ───
  const weeklyChartData = useMemo(() => {
    const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']
    const now = new Date()
    const startOfWeek = new Date(now)
    const dayOfWeek = now.getDay()
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    return days.map((name, idx) => {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + idx)
      const dateStr = d.toISOString().split('T')[0]
      const dayRecords = attendanceRecords.filter(r => r.date === dateStr && r.status === 'presente')
      const totalHours = dayRecords.reduce((sum, r) => sum + r.totalHours, 0)
      const avgHours = dayRecords.length > 0 ? totalHours / dayRecords.length : 0
      return { name, avgHours: Math.round(avgHours * 10) / 10, totalHours: Math.round(totalHours * 10) / 10 }
    })
  }, [attendanceRecords])

  // ─── Stats ───
  const todayStr = new Date().toISOString().split('T')[0]
  const todayRecords = attendanceRecords.filter(r => r.date === todayStr)
  const presentToday = todayRecords.filter(r => r.status === 'presente').length
  const absentToday = todayRecords.filter(r => r.status === 'ausente').length
  const totalOvertime = overtimeRecords.reduce((s, r) => s + r.hours, 0)

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

  // ─── Tab definitions ───
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'marcaje',    label: 'Marcaje',        icon: LogIn },
    { id: 'asistencia', label: 'Asistencia',     icon: CalendarDays },
    { id: 'resumen',    label: 'Resumen Mensual', icon: BarChart3 },
    { id: 'horasExtra', label: 'Horas Extra',    icon: Timer },
    { id: 'grafico',    label: 'Grafico Semanal', icon: TrendingUp },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={28} /> Control de Asistencia
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Registro de jornada laboral y horas extra — Art. 22, 30-34 Codigo del Trabajo
        </p>
      </div>

      {/* ─── Legal Notice ─── */}
      <div style={{
        padding: '10px 16px', borderRadius: 10, marginBottom: 16,
        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#3b82f6',
      }}>
        <FileText size={14} />
        <span>
          <strong>Art. 33 CT:</strong> El empleador debe llevar un registro de asistencia para todo trabajador
          no exceptuado por el Art. 22 inc. 2. Jornada maxima: 45h/sem en max 6 dias. Horas extra: max 2h/dia al 150%.
        </span>
      </div>

      {/* ─── Stats Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={UserCheck} label="Presentes Hoy" value={presentToday} color="#22c55e" subtitle="Trabajadores activos" />
        <StatCard icon={UserX} label="Ausentes Hoy" value={absentToday} color="#ef4444" subtitle="Sin justificacion" />
        <StatCard icon={Timer} label="Horas Extra (Mes)" value={`${Math.round(totalOvertime * 10) / 10}h`} color="#f59e0b" subtitle={`Max ${CHILE_LABOR.HORAS_EXTRA.maxDiarias}h/dia (Art. 30)`} />
        <StatCard icon={Users} label="Total Empleados" value={employees.length} color="#3b82f6" subtitle="Dotacion registrada" />
      </div>

      {/* ─── Tab Navigation ─── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto',
        borderBottom: '1px solid var(--border)', paddingBottom: 0,
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px', border: 'none', background: 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── Tab Content ─── */}

      {/* ════════════ 1. MARCAJE ════════════ */}
      {activeTab === 'marcaje' && (
        <div>
          <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            {/* Live clock */}
            <div style={{ fontSize: 48, fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
              {currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              {currentTime.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Worker Selector — employees select their name (CEO excluded) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Selecciona tu nombre
              </label>
              <select
                value={selectedWorker}
                onChange={e => setSelectedWorker(e.target.value)}
                style={{
                  width: '100%', maxWidth: 320, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
                  textAlign: 'center', margin: '0 auto', display: 'block',
                }}
              >
                <option value="">-- Seleccionar trabajador --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — {emp.position}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div style={{
              padding: '12px 20px', borderRadius: 12, marginBottom: 24, display: 'inline-flex',
              alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
              background: clockStatus === 'working' ? 'rgba(34,197,94,0.12)' : 'rgba(100,100,100,0.1)',
              color: clockStatus === 'working' ? '#22c55e' : 'var(--text-muted)',
            }}>
              {clockStatus === 'working' ? (
                <><CheckCircle size={16} /> {(() => { const e = employees.find(x => x.id === selectedWorker); return e ? `${e.firstName} ${e.lastName}` : 'Trabajador' })()} — Trabajando desde las {clockEntry}</>
              ) : (
                <><Clock size={16} /> {selectedWorker ? 'Listo para marcar entrada' : 'Selecciona tu nombre arriba'}</>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
              <button
                onClick={handleClockIn}
                disabled={clockStatus === 'working' || !selectedWorker || clockLoading}
                style={{
                  ...btnPrimary,
                  padding: '14px 28px', fontSize: 15,
                  opacity: (clockStatus === 'working' || !selectedWorker || clockLoading) ? 0.5 : 1,
                  background: '#22c55e',
                }}
              >
                <LogIn size={18} /> {clockLoading ? 'Registrando...' : 'Marcar Entrada'}
              </button>
              <button
                onClick={handleClockOut}
                disabled={clockStatus !== 'working' || clockLoading}
                style={{
                  ...btnPrimary,
                  padding: '14px 28px', fontSize: 15,
                  opacity: (clockStatus !== 'working' || clockLoading) ? 0.5 : 1,
                  background: '#ef4444',
                }}
              >
                <LogOut size={18} /> {clockLoading ? 'Registrando...' : 'Marcar Salida'}
              </button>
            </div>
            {clockError && (
              <div style={{
                margin: '0 auto 16px', maxWidth: 400, padding: '10px 16px', borderRadius: 8,
                background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 13, textAlign: 'center',
              }}>
                {clockError}
              </div>
            )}

            {/* Today hours */}
            {todayHours > 0 && (
              <div style={{
                padding: 16, borderRadius: 12, background: 'var(--bg-secondary)',
                display: 'flex', justifyContent: 'center', gap: 24,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Horas Hoy</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{todayHours.toFixed(1)}h</div>
                </div>
                {todayHours > 9 && (
                  <div>
                    <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4 }}>Horas Extra</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
                      {Math.min(todayHours - 9, CHILE_LABOR.HORAS_EXTRA.maxDiarias).toFixed(1)}h
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Art. 34 notice */}
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              Art. 34 CT: Se descuenta automaticamente 30 min de colacion (no computable como jornada)
            </div>
          </div>
        </div>
      )}

      {/* ════════════ 2. ASISTENCIA ════════════ */}
      {activeTab === 'asistencia' && (
        <div>
          {/* Filters */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <div style={{ flex: '1 1 180px', minWidth: 150 }}>
                <select
                  value={filterEmployee}
                  onChange={e => setFilterEmployee(e.target.value)}
                  style={{ ...selectStyle, fontSize: 12, padding: '6px 10px' }}
                >
                  <option value="">Todos los empleados</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as AttendanceStatus | '')}
                  style={{ ...selectStyle, fontSize: 12, padding: '6px 10px' }}
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 10px', width: 140 }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>a</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 10px', width: 140 }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Empleado</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Fecha</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Entrada</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Salida</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Horas</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>H. Extra</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 100).map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {r.employeeName}
                      {r.isArt22Exempt && (
                        <span style={{
                          marginLeft: 6, fontSize: 9, padding: '2px 6px', borderRadius: 8,
                          background: 'rgba(168,85,247,0.12)', color: '#a855f7', fontWeight: 700,
                        }}>
                          Art. 22
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {r.entryTime || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {r.exitTime || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                      {r.totalHours > 0 ? `${r.totalHours.toFixed(1)}h` : '—'}
                    </td>
                    <td style={{
                      ...tdStyle, textAlign: 'center', fontWeight: 600,
                      color: r.overtimeHours > 0 ? '#f59e0b' : 'var(--text-muted)',
                    }}>
                      {r.overtimeHours > 0 ? `+${r.overtimeHours.toFixed(1)}h` : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      No se encontraron registros para los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredRecords.length > 100 && (
              <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Mostrando 100 de {filteredRecords.length} registros
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ 3. RESUMEN MENSUAL ════════════ */}
      {activeTab === 'resumen' && (
        <div>
          {/* Month selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ ...inputStyle, width: 200, fontSize: 13 }}
            />
          </div>

          {/* Summary cards */}
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Empleado</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Dias Trab.</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Dias Ausente</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Horas Total</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>H. Extra</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Prom. Sem.</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Cumplimiento</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Art. 22</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map(s => (
                  <tr key={s.employeeId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{s.employeeName}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.daysWorked}</td>
                    <td style={{
                      ...tdStyle, textAlign: 'center', fontWeight: 600,
                      color: s.daysAbsent > 0 ? '#ef4444' : 'var(--text-primary)',
                    }}>
                      {s.daysAbsent}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                      {s.totalHours.toFixed(1)}h
                    </td>
                    <td style={{
                      ...tdStyle, textAlign: 'center', fontWeight: 600,
                      color: s.overtimeHours > 0 ? '#f59e0b' : 'var(--text-muted)',
                    }}>
                      {s.overtimeHours > 0 ? `${s.overtimeHours.toFixed(1)}h` : '—'}
                    </td>
                    <td style={{
                      ...tdStyle, textAlign: 'center', fontWeight: 700,
                      color: s.weeklyAvgHours > 45 && !s.isArt22Exempt ? '#ef4444' : 'var(--text-primary)',
                    }}>
                      {s.weeklyAvgHours.toFixed(1)}h
                      {s.weeklyAvgHours > 45 && !s.isArt22Exempt && (
                        <AlertTriangle size={12} style={{ marginLeft: 4, verticalAlign: 'middle', color: '#ef4444' }} />
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {s.isArt22Exempt ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                          background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                        }}>
                          Excluido
                        </span>
                      ) : s.isCompliant ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                          background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                        }}>
                          <CheckCircle size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                          OK
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                          background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                        }}>
                          <AlertCircle size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                          Excede
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={art22Exemptions[s.employeeId] || false}
                          onChange={e => {
                            setArt22Exemptions(prev => ({ ...prev, [s.employeeId]: e.target.checked }))
                          }}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Excluido</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal note */}
          <div style={{
            marginTop: 16, padding: '10px 16px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <strong>Art. 22 inc. 2 CT:</strong> Quedan excluidos de la limitacion de jornada los trabajadores que
              presten servicios a distintos empleadores, gerentes, administradores, apoderados con facultades de administracion
              y todos aquellos que trabajen sin fiscalizacion superior inmediata.
            </div>
          </div>
        </div>
      )}

      {/* ════════════ 4. HORAS EXTRA ════════════ */}
      {activeTab === 'horasExtra' && (
        <div>
          {/* Overtime stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <StatCard
              icon={Timer}
              label="Total Horas Extra (Mes)"
              value={`${Math.round(totalOvertime * 10) / 10}h`}
              color="#f59e0b"
              subtitle="Acumulado periodo vigente"
            />
            <StatCard
              icon={AlertCircle}
              label="Tasa de Recargo"
              value={`${(1 + CHILE_LABOR.HORAS_EXTRA.recargo) * 100}%`}
              color="#3b82f6"
              subtitle="Art. 32 inc. 3 CT (50% recargo)"
            />
            <StatCard
              icon={Briefcase}
              label="Costo Total H. Extra"
              value={`$${fmt(overtimeRecords.reduce((s, r) => s + r.amount, 0))}`}
              color="#22c55e"
              subtitle="Valor bruto estimado"
            />
          </div>

          {/* Pacto warning */}
          <div style={{
            padding: '10px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#f59e0b',
          }}>
            <AlertTriangle size={14} />
            <span>
              <strong>Art. 32 CT:</strong> El pacto de horas extraordinarias debe constar por escrito y tener
              vigencia maxima de {CHILE_LABOR.HORAS_EXTRA.maxPacto} meses. Max {CHILE_LABOR.HORAS_EXTRA.maxDiarias}h extras por dia.
            </span>
          </div>

          {/* Overtime table */}
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Empleado</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Fecha</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Horas</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Tasa</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Pacto Vigencia</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {overtimeRecords
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 50)
                  .map(r => {
                    const exceedsDaily = r.hours > CHILE_LABOR.HORAS_EXTRA.maxDiarias
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{r.employeeName}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                          {new Date(r.date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{
                          ...tdStyle, textAlign: 'center', fontWeight: 700,
                          color: exceedsDaily ? '#ef4444' : 'var(--text-primary)',
                        }}>
                          {r.hours.toFixed(1)}h
                          {exceedsDaily && <AlertTriangle size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{(r.rate * 100).toFixed(0)}%</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>${fmt(r.amount)}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: 11 }}>
                          {r.pactoExpiry ? (
                            <span style={{
                              padding: '3px 8px', borderRadius: 8, fontSize: 10,
                              background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                            }}>
                              Hasta {new Date(r.pactoExpiry + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Sin pacto</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {exceedsDaily ? (
                            <span style={{
                              padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                              background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                            }}>
                              Excede max diario
                            </span>
                          ) : (
                            <CheckCircle size={14} style={{ color: '#22c55e' }} />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                {overtimeRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      No hay registros de horas extra en el periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ 5. GRAFICO SEMANAL ════════════ */}
      {activeTab === 'grafico' && (
        <div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} /> Promedio Horas por Dia (Semana Actual)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 24, marginTop: 0 }}>
              Promedio de horas trabajadas por empleado en cada dia de la semana
            </p>

            {/* Simple bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 260, position: 'relative', paddingBottom: 30 }}>
              {/* Y-axis label */}
              <div style={{
                position: 'absolute', left: -4, top: 0, bottom: 30,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                fontSize: 10, color: 'var(--text-muted)', width: 30, textAlign: 'right',
              }}>
                <span>12h</span>
                <span>9h</span>
                <span>6h</span>
                <span>3h</span>
                <span>0h</span>
              </div>

              {/* Bars */}
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 16, flex: 1,
                marginLeft: 36, height: 230, position: 'relative',
              }}>
                {/* 45h/week / 5 days = 9h/day limit line */}
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  top: `${100 - (9 / 12) * 100}%`,
                  borderTop: '2px dashed #ef4444',
                  zIndex: 1,
                }}>
                  <span style={{
                    position: 'absolute', right: 0, top: -16, fontSize: 10,
                    color: '#ef4444', fontWeight: 600,
                  }}>
                    9h/dia (45h/sem)
                  </span>
                </div>

                {weeklyChartData.map((day, idx) => {
                  const heightPct = Math.min((day.avgHours / 12) * 100, 100)
                  const isOverLimit = day.avgHours > 9
                  return (
                    <div key={idx} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      height: '100%', justifyContent: 'flex-end',
                    }}>
                      {/* Value label */}
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: isOverLimit ? '#ef4444' : 'var(--text-primary)' }}>
                        {day.avgHours > 0 ? `${day.avgHours}h` : '—'}
                      </div>
                      {/* Bar */}
                      <div style={{
                        width: '100%', maxWidth: 60,
                        height: `${heightPct}%`, minHeight: day.avgHours > 0 ? 4 : 0,
                        borderRadius: '8px 8px 0 0',
                        background: isOverLimit
                          ? 'linear-gradient(180deg, #ef4444, #fca5a5)'
                          : 'linear-gradient(180deg, var(--accent), rgba(var(--accent-rgb, 99,102,241), 0.4))',
                        transition: 'height 0.3s ease',
                      }} />
                      {/* Day label */}
                      <div style={{
                        fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600,
                      }}>
                        {day.name.substring(0, 3)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Weekly total */}
            <div style={{
              marginTop: 24, padding: 16, borderRadius: 12, background: 'var(--bg-secondary)',
              display: 'flex', justifyContent: 'space-around', textAlign: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Semanal (Prom.)</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>
                  {weeklyChartData.reduce((s, d) => s + d.avgHours, 0).toFixed(1)}h
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Limite Legal</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>45h</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Estado</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>
                  {weeklyChartData.reduce((s, d) => s + d.avgHours, 0) <= 45 ? (
                    <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle size={20} /> OK
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <AlertTriangle size={20} /> Excede
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Legal reference */}
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              Art. 22 inc. 1 CT: La duracion de la jornada ordinaria de trabajo no excedera de 45 horas semanales,
              distribuidas en no mas de 6 ni menos de 5 dias.
            </div>
          </div>
        </div>
      )}

      {/* ─── Demo data notice ─── */}
      <div style={{
        marginTop: 24, padding: '10px 16px', borderRadius: 10,
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6366f1',
      }}>
        <AlertCircle size={14} />
        <span>
          <strong>Modo Demo:</strong> Los datos mostrados son de ejemplo. Conectar a endpoints del backend
          cuando esten implementados (POST /hr/attendance/clock-in, GET /hr/attendance, etc.)
        </span>
      </div>
    </div>
  )
}
