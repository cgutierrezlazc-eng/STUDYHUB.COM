// ═══════════════════════════════════════════════════════════════════
// GESTIÓN DE USUARIOS — CEO Panel
// Vista completa de todos los usuarios: colaboradores + plataforma
// CEO puede ver perfiles, contratos, estado FES y privilegios
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../services/auth'
import { api } from '../../../services/api'
import {
  Users, Shield, FileText, CheckCircle, Clock, Search,
  Mail, Phone, Building2, ChevronRight, ExternalLink,
  UserCheck, UserX, Crown, GraduationCap, Briefcase,
  RefreshCw, Download, Eye,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface PlatformUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  first_name?: string
  last_name?: string
  role: string
  isAdmin?: boolean
  isBanned?: boolean
  createdAt?: string
  created_at?: string
  profilePictureUrl?: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  rut: string
  email: string
  phone?: string
  position: string
  department?: string
  status: string
  hireDate: string
  contractType?: string
  employee_number?: string
  corporate_email?: string
  user_id?: string
}

interface EmployeeDoc {
  id: string
  name: string
  document_type: string
  fes_signed?: boolean
  fes_signed_at?: string
  fes_signer_name?: string
  fes_verification_code?: string
  locked?: boolean
  created_at?: string
}

type MainTab = 'colaboradores' | 'plataforma'

// ─── Helpers ─────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  owner:    { label: 'CEO',       color: '#1a56db', icon: <Crown size={12} /> },
  admin:    { label: 'Admin',     color: '#7c3aed', icon: <Shield size={12} /> },
  employee: { label: 'Colaborador', color: '#059669', icon: <Briefcase size={12} /> },
  tutor:    { label: 'Tutor',     color: '#d97706', icon: <GraduationCap size={12} /> },
  student:  { label: 'Estudiante', color: '#64748b', icon: <GraduationCap size={12} /> },
  default:  { label: 'Usuario',   color: '#64748b', icon: <Users size={12} /> },
}
const roleInfo = (role: string) => ROLE_LABEL[role] || ROLE_LABEL.default

const fmtDate = (d?: string) => d
  ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const fmtDateTime = (d?: string) => d
  ? new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// ─── FES Badge ───────────────────────────────────────────────────
function FesBadge({ signed, signedAt }: { signed?: boolean; signedAt?: string }) {
  if (signed) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
        background: 'rgba(34,197,94,0.12)', color: '#16a34a',
        border: '1px solid rgba(34,197,94,0.3)',
      }}>
        <CheckCircle size={11} /> FES Firmado {signedAt ? fmtDate(signedAt) : ''}
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      background: 'rgba(245,158,11,0.12)', color: '#d97706',
      border: '1px solid rgba(245,158,11,0.3)',
    }}>
      <Clock size={11} /> Firma Pendiente
    </span>
  )
}

// ─── Role Badge ──────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const info = roleInfo(role)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: `${info.color}18`, color: info.color,
      border: `1px solid ${info.color}30`,
    }}>
      {info.icon} {info.label}
    </span>
  )
}

// ════════════════════════════════════════════════════════════════
// PANEL DETALLE COLABORADOR
// ════════════════════════════════════════════════════════════════
function ColaboradorPanel({ emp, onClose, onNavigate }: {
  emp: Employee
  onClose: () => void
  onNavigate: (path: string) => void
}) {
  const [docs, setDocs] = useState<EmployeeDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    api.getEmployeeDocuments(emp.id)
      .then((d: any) => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false))
  }, [emp.id])

  const contracts = docs.filter(d => d.document_type === 'contract')
  const allDocs = docs.filter(d => d.document_type !== 'contract')
  const contractSigned = contracts.some(d => d.fes_signed)

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 480, height: '100vh',
      background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', overflowY: 'auto',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', background: 'linear-gradient(135deg, #0d2a6b 0%, #1a56db 100%)',
        color: '#fff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                {emp.firstName} {emp.lastName}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{emp.position}</div>
              {emp.employee_number && (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2, letterSpacing: 1 }}>
                  {emp.employee_number}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            ✕
          </button>
        </div>

        {/* FES Status en header */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <FesBadge signed={contractSigned} signedAt={contracts.find(d => d.fes_signed)?.fes_signed_at} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
            background: emp.status === 'activo' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            color: emp.status === 'activo' ? '#86efac' : '#fca5a5',
          }}>
            {emp.status === 'activo' ? <UserCheck size={11} /> : <UserX size={11} />}
            {emp.status === 'activo' ? 'Activo' : emp.status || 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', flex: 1 }}>

        {/* Datos personales */}
        <Section title="Datos del Colaborador">
          <Row icon={<Mail size={13} />} label="Email personal" value={emp.email} />
          {emp.corporate_email && <Row icon={<Mail size={13} />} label="Email corporativo" value={emp.corporate_email} accent />}
          {emp.phone && <Row icon={<Phone size={13} />} label="Teléfono" value={emp.phone} />}
          <Row icon={<Building2 size={13} />} label="Área" value={emp.department || '—'} />
          <Row icon={<Briefcase size={13} />} label="Tipo contrato" value={emp.contractType || '—'} />
          <Row icon={<FileText size={13} />} label="RUT" value={emp.rut} />
          <Row icon={<Clock size={13} />} label="Fecha ingreso" value={fmtDate(emp.hireDate)} />
        </Section>

        {/* Contratos + FES */}
        <Section title={`Contratos (${contracts.length})`}>
          {loadingDocs ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Cargando...</div>
          ) : contracts.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
              Sin contratos generados aún.
            </div>
          ) : (
            contracts.map(doc => (
              <div key={doc.id} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Generado: {fmtDate(doc.created_at)}
                    </div>
                  </div>
                  <FesBadge signed={!!doc.fes_signed} signedAt={doc.fes_signed_at} />
                </div>
                {doc.fes_signed && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(34,197,94,0.06)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      <div><strong>Firmante:</strong> {doc.fes_signer_name}</div>
                      <div><strong>Fecha FES:</strong> {fmtDateTime(doc.fes_signed_at)}</div>
                      {doc.fes_verification_code && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <strong>Verificar:</strong>
                          <a
                            href={`${window.location.origin}/fes/verify/${doc.fes_verification_code}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--accent)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            {doc.fes_verification_code} <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!doc.fes_signed && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#d97706' }}>
                    ⚠️ El colaborador debe firmar desde su Portal (Mi Portal)
                  </div>
                )}
                <button
                  onClick={() => api.downloadEmployeeDocument(doc.id)}
                  style={{
                    marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7,
                    border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  <Download size={11} /> Descargar PDF
                </button>
              </div>
            ))
          )}
        </Section>

        {/* Otros documentos */}
        {allDocs.length > 0 && (
          <Section title={`Otros Documentos (${allDocs.length})`}>
            {allDocs.map(doc => (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 8, marginBottom: 4,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                fontSize: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.document_type} · {fmtDate(doc.created_at)}</div>
                </div>
                <button
                  onClick={() => api.downloadEmployeeDocument(doc.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                >
                  <Download size={13} />
                </button>
              </div>
            ))}
          </Section>
        )}

        {/* Acciones */}
        <Section title="Acciones CEO">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => onNavigate(`/admin-panel/hr/personal`)}
              style={{ ...actionBtn, background: 'var(--accent)', color: '#fff', border: 'none' }}
            >
              <Eye size={14} /> Ver en Directorio de Personal
            </button>
            <button
              onClick={() => onNavigate(`/admin-panel/hr/accesos`)}
              style={{ ...actionBtn }}
            >
              <Shield size={14} /> Gestionar Privilegios de Acceso
            </button>
          </div>
          {!contractSigned && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#d97706' }}>
              <strong>Pendiente:</strong> El colaborador no ha firmado su contrato. Debe ingresar a Conniku con su usuario corporativo y firmar desde <em>Mi Portal</em>.
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

// ─── Sub-helpers ─────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)', fontWeight: accent ? 600 : 400, wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 9,
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

// ════════════════════════════════════════════════════════════════
// PANEL DETALLE USUARIO PLATAFORMA
// ════════════════════════════════════════════════════════════════
function PlatformUserPanel({ usr, onClose }: { usr: PlatformUser; onClose: () => void }) {
  const fullName = [usr.firstName || usr.first_name, usr.lastName || usr.last_name].filter(Boolean).join(' ') || usr.username
  const joinDate = usr.createdAt || usr.created_at
  const info = roleInfo(usr.role)

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
      background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', overflowY: 'auto',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px 24px', background: `linear-gradient(135deg, ${info.color}dd 0%, ${info.color} 100%)`,
        color: '#fff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800,
            }}>
              {(fullName[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{fullName}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>@{usr.username}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 13 }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.2)' }}>
            {info.label}
          </span>
          {usr.isAdmin && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.2)' }}>
              Admin
            </span>
          )}
          {usr.isBanned && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.4)' }}>
              Baneado
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        <Section title="Información">
          <Row icon={<Mail size={13} />} label="Email" value={usr.email} />
          <Row icon={<Users size={13} />} label="Username" value={`@${usr.username}`} />
          <Row icon={<Clock size={13} />} label="Registro" value={fmtDate(joinDate)} />
          <Row icon={<Shield size={13} />} label="Rol" value={info.label} />
        </Section>

        <Section title="ID Sistema">
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            {usr.id}
          </div>
        </Section>

        <Section title="Acceso a la plataforma">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Para gestionar privilegios de módulos administrativos de este usuario (si es colaborador), ve a{' '}
            <strong>Control de Accesos</strong> en la sección HR del panel CEO.
          </div>
        </Section>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function GestionUsuarios({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user } = useAuth()
  const [tab, setTab] = useState<MainTab>('colaboradores')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([])
  const [loadingEmps, setLoadingEmps] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchEmps, setSearchEmps] = useState('')
  const [searchUsers, setSearchUsers] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [usersPage, setUsersPage] = useState(1)
  const [userFilter, setUserFilter] = useState<string>('')

  // ─── Load employees ───────────────────────────────────────────
  useEffect(() => {
    setLoadingEmps(true)
    api.getEmployees()
      .then((d: any) => setEmployees(Array.isArray(d) ? d : []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmps(false))
  }, [])

  // ─── Load platform users ──────────────────────────────────────
  const loadUsers = useCallback(() => {
    setLoadingUsers(true)
    api.adminGetUsers(usersPage, searchUsers || undefined, userFilter || undefined)
      .then((d: any) => setPlatformUsers(Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : []))
      .catch(() => setPlatformUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [usersPage, userFilter])

  useEffect(() => {
    if (tab === 'plataforma') loadUsers()
  }, [tab, loadUsers])

  // ─── Access guard ─────────────────────────────────────────────
  if (user?.role !== 'owner' && !user?.isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Shield size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
        <div style={{ fontSize: 15, fontWeight: 700 }}>Acceso restringido al CEO</div>
      </div>
    )
  }

  // ─── Filtered lists ───────────────────────────────────────────
  const filteredEmps = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.position} ${e.email} ${e.employee_number || ''}`
      .toLowerCase().includes(searchEmps.toLowerCase())
  )

  const filteredUsers = platformUsers.filter(u =>
    `${u.username} ${u.email} ${u.firstName || ''} ${u.lastName || ''} ${u.first_name || ''} ${u.last_name || ''}`
      .toLowerCase().includes(searchUsers.toLowerCase())
  )

  const empsSigned = employees.filter(e =>
    // We don't have this info in the employee list itself — it's from docs
    false
  ).length

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ─── Header ─── */}
      <div style={{
        padding: '18px 24px', borderRadius: 14, marginBottom: 24,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Gestión de Usuarios</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
            Vista CEO — todos los usuarios de la plataforma Conniku
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{employees.length}</div>
            <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Colaboradores</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{platformUsers.length}</div>
            <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Usuarios plataforma</div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'colaboradores', label: '👥 Colaboradores', count: employees.length },
          { key: 'plataforma',    label: '🌐 Usuarios Plataforma', count: platformUsers.length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
              background: tab === t.key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ══ TAB: COLABORADORES ══ */}
      {tab === 'colaboradores' && (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16, maxWidth: 420 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchEmps}
              onChange={e => setSearchEmps(e.target.value)}
              placeholder="Buscar por nombre, cargo, N° empleado..."
              style={{
                width: '100%', padding: '9px 14px 9px 34px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {loadingEmps ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
            </div>
          ) : filteredEmps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sin colaboradores registrados</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Crea el primer colaborador en <strong>Directorio de Personal</strong>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredEmps.map(emp => {
                const isActive = emp.status === 'activo' || !emp.status
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = '' }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: isActive ? 'linear-gradient(135deg, #1a56db, #3b82f6)' : 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? '#fff' : 'var(--text-muted)', fontWeight: 800, fontSize: 15,
                    }}>
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {emp.firstName} {emp.lastName}
                        </span>
                        <RoleBadge role="employee" />
                        {!isActive && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{emp.position}</span>
                        {emp.employee_number && (
                          <>
                            <span style={{ opacity: 0.3 }}>|</span>
                            <span style={{ fontFamily: 'monospace' }}>{emp.employee_number}</span>
                          </>
                        )}
                        {emp.corporate_email && (
                          <>
                            <span style={{ opacity: 0.3 }}>|</span>
                            <span>{emp.corporate_email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Contract status */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ingreso: {fmtDate(emp.hireDate)}</div>
                    </div>

                    <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ══ TAB: USUARIOS PLATAFORMA ══ */}
      {tab === 'plataforma' && (
        <>
          {/* Controles */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                placeholder="Buscar por nombre, email, usuario..."
                style={{
                  width: '100%', padding: '9px 14px 9px 34px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              value={userFilter}
              onChange={e => { setUserFilter(e.target.value); setUsersPage(1) }}
              style={{
                padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            >
              <option value="">Todos los roles</option>
              <option value="student">Estudiantes</option>
              <option value="tutor">Tutores</option>
              <option value="employee">Colaboradores</option>
              <option value="admin">Admins</option>
              <option value="banned">Baneados</option>
            </select>
            <button
              onClick={loadUsers}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
            >
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sin usuarios</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredUsers.map(u => {
                const fullName = [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ') || u.username
                const info = roleInfo(u.role)
                const joinDate = u.createdAt || u.created_at
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      transition: 'all 0.15s', opacity: u.isBanned ? 0.55 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = info.color }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${info.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: info.color, fontWeight: 800, fontSize: 14,
                    }}>
                      {(fullName[0] || '?').toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fullName}</span>
                        <RoleBadge role={u.role} />
                        {u.isAdmin && <RoleBadge role="admin" />}
                        {u.isBanned && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            Baneado
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, display: 'flex', gap: 8 }}>
                        <span>@{u.username}</span>
                        <span style={{ opacity: 0.3 }}>·</span>
                        <span>{u.email}</span>
                        {joinDate && (
                          <>
                            <span style={{ opacity: 0.3 }}>·</span>
                            <span>Registro: {fmtDate(joinDate)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button
              onClick={() => { setUsersPage(p => Math.max(1, p - 1)); loadUsers() }}
              disabled={usersPage <= 1}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: usersPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: 'var(--text-muted)', opacity: usersPage <= 1 ? 0.4 : 1 }}
            >
              ← Anterior
            </button>
            <span style={{ padding: '7px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
              Página {usersPage}
            </span>
            <button
              onClick={() => { setUsersPage(p => p + 1); loadUsers() }}
              disabled={filteredUsers.length < 20}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: filteredUsers.length < 20 ? 'not-allowed' : 'pointer', fontSize: 12, color: 'var(--text-muted)', opacity: filteredUsers.length < 20 ? 0.4 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* ─── Side panels ─── */}
      {selectedEmp && (
        <>
          <div
            onClick={() => setSelectedEmp(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
          />
          <ColaboradorPanel
            emp={selectedEmp}
            onClose={() => setSelectedEmp(null)}
            onNavigate={(path) => { setSelectedEmp(null); onNavigate?.(path) }}
          />
        </>
      )}
      {selectedUser && (
        <>
          <div
            onClick={() => setSelectedUser(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
          />
          <PlatformUserPanel usr={selectedUser} onClose={() => setSelectedUser(null)} />
        </>
      )}
    </div>
  )
}
