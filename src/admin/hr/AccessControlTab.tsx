// ═════════════════════════════════════════════════════════════════
// ACCESS CONTROL — Gestión de Accesos de Trabajadores
// CEO habilita/deshabilita módulos por empleado
// ═════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { Employee } from '../shared/types'
import { ADMIN_MODULES, CATEGORY_LABELS } from '../adminModules'
import {
  SEED_EMPLOYEES,
  loadAllPermissions,
  savePermissions,
  getEmployeePermissions,
  type EmployeePermissions,
} from '../shared/seedEmployees'
import { btnPrimary, btnSecondary, fmt } from '../shared/styles'
import {
  Shield, Users, ChevronRight, Search, Check, X,
  ToggleLeft, ToggleRight, Mail, Eye, EyeOff, UserCheck, UserX,
} from 'lucide-react'

type ViewMode = 'list' | 'detail'

const CATEGORY_ORDER = ['hr', 'payroll', 'finance', 'legal', 'tools']

export default function AccessControlTab() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [permissions, setPermissions] = useState<Record<string, EmployeePermissions>>({})
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveNotice, setSaveNotice] = useState('')

  // ─── Load data ───
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const apiEmployees = await api.getEmployees()
      const emps = Array.isArray(apiEmployees) && apiEmployees.length > 0
        ? apiEmployees
        : SEED_EMPLOYEES
      setEmployees(emps)
    } catch {
      setEmployees(SEED_EMPLOYEES)
    }
    setPermissions(loadAllPermissions())
    setLoading(false)
  }

  // ─── Access check ───
  if (user?.role !== 'owner' && !user?.isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Shield size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Solo CEO</h2>
        <p style={{ fontSize: 13 }}>Solo el owner puede gestionar los accesos del equipo.</p>
      </div>
    )
  }

  const filteredEmployees = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.position} ${e.email}`
      .toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleModule = (empId: string, moduleId: string) => {
    const perms = getEmployeePermissions(empId)
    perms.moduleAccess[moduleId] = !perms.moduleAccess[moduleId]
    savePermissions(empId, perms)
    setPermissions({ ...permissions, [empId]: perms })
    setSaveNotice('Guardado')
    setTimeout(() => setSaveNotice(''), 1500)
  }

  const handleToggleActive = (empId: string) => {
    const perms = getEmployeePermissions(empId)
    perms.isActive = !perms.isActive
    savePermissions(empId, perms)
    setPermissions({ ...permissions, [empId]: perms })
    setSaveNotice(perms.isActive ? 'Acceso habilitado' : 'Acceso deshabilitado')
    setTimeout(() => setSaveNotice(''), 1500)
  }

  const handleEnableAll = (empId: string) => {
    const perms = getEmployeePermissions(empId)
    Object.keys(perms.moduleAccess).forEach(k => { perms.moduleAccess[k] = true })
    savePermissions(empId, perms)
    setPermissions({ ...permissions, [empId]: perms })
    setSaveNotice('Todos los módulos habilitados')
    setTimeout(() => setSaveNotice(''), 1500)
  }

  const handleDisableAll = (empId: string) => {
    const perms = getEmployeePermissions(empId)
    Object.keys(perms.moduleAccess).forEach(k => { perms.moduleAccess[k] = false })
    savePermissions(empId, perms)
    setPermissions({ ...permissions, [empId]: perms })
    setSaveNotice('Todos los módulos deshabilitados')
    setTimeout(() => setSaveNotice(''), 1500)
  }

  const countEnabled = (empId: string) => {
    const perms = permissions[empId]
    if (!perms) return 0
    return Object.values(perms.moduleAccess).filter(Boolean).length
  }

  const totalModules = ADMIN_MODULES.filter(m => m.status === 'active').length

  // ═══════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════
  if (viewMode === 'detail' && selectedEmployee) {
    const emp = selectedEmployee
    const perms = getEmployeePermissions(emp.id)

    return (
      <div className="page-enter" style={{ padding: '20px 0' }}>
        {/* Back + Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => { setViewMode('list'); setSelectedEmployee(null) }}
            style={{ ...btnSecondary, padding: '8px 14px' }}
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Volver
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: perms.isActive ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 18,
              }}>
                {emp.firstName[0]}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {emp.firstName} {emp.lastName}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{emp.position}</span>
                  <span style={{ opacity: 0.4 }}>|</span>
                  <Mail size={12} /> <span>{emp.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save notice */}
          {saveNotice && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', padding: '6px 14px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Check size={14} /> {saveNotice}
            </span>
          )}
        </div>

        {/* Active toggle + bulk actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          padding: '14px 18px', borderRadius: 10,
          background: perms.isActive ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${perms.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <button
            onClick={() => handleToggleActive(emp.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {perms.isActive
              ? <ToggleRight size={32} style={{ color: '#22c55e' }} />
              : <ToggleLeft size={32} style={{ color: '#ef4444' }} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {perms.isActive ? 'Acceso Activo' : 'Acceso Deshabilitado'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {perms.isActive
                ? 'El trabajador puede acceder a los módulos habilitados'
                : 'El trabajador no puede acceder a ningún módulo'}
            </div>
          </div>
          <button onClick={() => handleEnableAll(emp.id)} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 11 }}>
            <Eye size={12} /> Habilitar todos
          </button>
          <button onClick={() => handleDisableAll(emp.id)} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 11 }}>
            <EyeOff size={12} /> Deshabilitar todos
          </button>
        </div>

        {/* Module toggles by category */}
        {CATEGORY_ORDER.map(cat => {
          const catModules = ADMIN_MODULES.filter(m => m.category === cat && m.status === 'active')
          if (catModules.length === 0) return null
          const catLabel = CATEGORY_LABELS[cat]

          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={14} style={{ color: 'var(--accent)', transform: 'rotate(90deg)' }} />
                {catLabel.label}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
                {catModules.map(mod => {
                  const enabled = perms.moduleAccess[mod.id] ?? true
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(emp.id, mod.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                        background: enabled ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                        border: `1px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
                        opacity: perms.isActive ? 1 : 0.4,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: enabled ? 'var(--accent)' : 'transparent',
                        border: `2px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s',
                      }}>
                        {enabled && <Check size={12} style={{ color: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{mod.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mod.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Info */}
        <div style={{
          marginTop: 20, padding: '14px 18px', background: 'var(--bg-tertiary)',
          borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          <strong>Nota:</strong> Los cambios se aplican inmediatamente. Cuando el backend de autenticación esté
          conectado, los permisos se sincronizarán automáticamente con la cuenta del trabajador.
          Los módulos deshabilitados no aparecerán en el panel del empleado.
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="page-enter" style={{ padding: '20px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={22} style={{ color: 'var(--accent)' }} />
            Control de Accesos
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Habilita o deshabilita módulos del Admin Panel por trabajador
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 8 }}>
            {employees.length} trabajadores
          </span>
          {saveNotice && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', padding: '6px 14px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Check size={14} /> {saveNotice}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar trabajador..."
          style={{
            width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Cargando equipo...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredEmployees.map(emp => {
            const perms = permissions[emp.id]
            const isActive = perms?.isActive ?? true
            const enabledCount = countEnabled(emp.id)

            return (
              <div
                key={emp.id}
                onClick={() => { setSelectedEmployee(emp); setViewMode('detail') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  opacity: isActive ? 1 : 0.55,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.transform = ''
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {emp.firstName[0]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {emp.firstName} {emp.lastName}
                    </span>
                    {isActive
                      ? <UserCheck size={14} style={{ color: '#22c55e' }} />
                      : <UserX size={14} style={{ color: '#ef4444' }} />}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span>{emp.position}</span>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <Mail size={11} /> <span>{emp.email}</span>
                  </div>
                </div>

                {/* Module count */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {enabledCount}/{totalModules}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>módulos</div>
                </div>

                {/* Progress bar */}
                <div style={{ width: 80, flexShrink: 0 }}>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.3s',
                      width: `${(enabledCount / totalModules) * 100}%`,
                      background: enabledCount === totalModules ? '#22c55e'
                        : enabledCount > totalModules * 0.5 ? 'var(--accent)' : '#f59e0b',
                    }} />
                  </div>
                </div>

                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            )
          })}

          {filteredEmployees.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              No se encontraron trabajadores
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
            {employees.filter(e => permissions[e.id]?.isActive !== false).length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accesos activos</div>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
            {employees.filter(e => permissions[e.id]?.isActive === false).length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accesos deshabilitados</div>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
            {totalModules}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Módulos disponibles</div>
        </div>
      </div>
    </div>
  )
}
