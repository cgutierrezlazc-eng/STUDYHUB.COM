import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../../services/api'
import { Employee } from '../../shared/types'

// ─── Constantes laborales Chile ────────────────────────────────
const IMM = 510966
const AFP_LIST = [
  { value: 'modelo',   label: 'Modelo' },
  { value: 'capital',  label: 'Capital' },
  { value: 'cuprum',   label: 'Cuprum' },
  { value: 'habitat',  label: 'Habitat' },
  { value: 'planvital',label: 'PlanVital' },
  { value: 'provida',  label: 'ProVida' },
  { value: 'uno',      label: 'Uno' },
]
const HEALTH_OPTIONS = [
  { value: 'fonasa', label: 'FONASA' },
  { value: 'isapre', label: 'ISAPRE' },
]
const CONTRACT_TYPES = [
  { value: 'plazo_fijo', label: 'Plazo Fijo' },
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'obra_faena', label: 'Obra o Faena' },
  { value: 'honorarios', label: 'Honorarios' },
  { value: 'aprendizaje', label: 'Aprendizaje' },
]
const DEPARTMENTS = ['Tecnologia','RRHH','Finanzas','Operaciones','Marketing','Legal','Gerencia','Diseño','Soporte']
const SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Jornada Completa (45h)' },
  { value: 'part_time', label: 'Media Jornada' },
  { value: 'flexible', label: 'Horario Flexible' },
  { value: 'remoto', label: 'Teletrabajo' },
]
const BANKS = ['Banco Estado','BancoChile','Santander','BCI','Itaú','Scotiabank','Falabella','Ripley','Security','Consorcio']
const ACCOUNT_TYPES = [
  { value: 'cuenta_vista', label: 'Cuenta Vista' },
  { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
  { value: 'cuenta_rut', label: 'Cuenta RUT' },
]
const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e',
  terminated: '#ef4444',
  suspended: '#f59e0b',
  on_leave: '#3b82f6',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  terminated: 'Terminado',
  suspended: 'Suspendido',
  on_leave: 'Con Permiso',
}

// ─── Helpers ────────────────────────────────────────────────────
function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-CL') } catch { return iso }
}
function fmtMoney(n: number) {
  return `$${(n || 0).toLocaleString('es-CL')}`
}
function initials(e: Employee) {
  return `${e.firstName?.[0] || ''}${e.lastName?.[0] || ''}`.toUpperCase()
}
function fullName(e: Employee) {
  return `${e.firstName} ${e.lastName}`.trim()
}
function avatarColor(e: Employee) {
  const colors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']
  const idx = (e.firstName?.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

// ─── Sub-components ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string | number; onChange?: (v: string) => void
  placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
        outline: 'none', fontFamily: 'inherit',
      }}
    />
  )
}

function Select({ value, onChange, options, disabled }: {
  value: string; onChange?: (v: string) => void
  options: { value: string; label: string }[] | string[]; disabled?: boolean
}) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
        outline: 'none', fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{msg}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '1px', margin: '20px 0 14px', paddingBottom: 6,
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

// ─── Crear colaborador modal ─────────────────────────────────────
function NuevoColaboradorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const emptyForm = {
    rut: '', firstName: '', lastName: '', email: '', phone: '', address: '',
    birthDate: '', nationality: 'Chilena', maritalStatus: 'soltero',
    emergencyContactName: '', emergencyContactPhone: '',
    position: '', department: 'Tecnologia', hireDate: '',
    contractType: 'plazo_fijo', endDate: '', workSchedule: 'full_time', weeklyHours: 45,
    grossSalary: IMM, colacion: 0, movilizacion: 0,
    afp: 'modelo', healthSystem: 'fonasa', isapreName: '', isapreUf: 0,
    afcActive: true, bankName: 'Banco Estado', bankAccountType: 'cuenta_rut', bankAccountNumber: '',
  }
  const [form, setForm] = useState<any>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const F = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.rut.trim()) e.rut = 'Obligatorio'
    if (!form.firstName.trim()) e.firstName = 'Obligatorio'
    if (!form.lastName.trim()) e.lastName = 'Obligatorio'
    if (!form.email.trim()) e.email = 'Obligatorio'
    if (!form.position.trim()) e.position = 'Obligatorio'
    if (!form.hireDate) e.hireDate = 'Obligatorio'
    if (Number(form.grossSalary) < IMM) e.grossSalary = `Mínimo: ${fmtMoney(IMM)} (Art. 44 CT)`
    return e
  }

  const handleSave = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    try {
      await api.createEmployee(form)
      onCreated()
      onClose()
    } catch (err: any) {
      setErrors({ _general: err?.message || err?.detail || 'Error al guardar. Verifica los datos.' })
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 16, width: '100%',
        maxWidth: 680, maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Nuevo Colaborador</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Art. 9 CT — contrato debe firmarse en 15 días corridos</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {errors._general && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
              {errors._general}
            </div>
          )}

          <SectionTitle>Datos Personales</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="RUT *"><Input value={form.rut} onChange={F('rut')} placeholder="12.345.678-9" /><ErrMsg msg={errors.rut} /></Field>
            <Field label="Fecha Nacimiento"><Input type="date" value={form.birthDate} onChange={F('birthDate')} /></Field>
            <Field label="Nombre *"><Input value={form.firstName} onChange={F('firstName')} /><ErrMsg msg={errors.firstName} /></Field>
            <Field label="Apellido *"><Input value={form.lastName} onChange={F('lastName')} /><ErrMsg msg={errors.lastName} /></Field>
            <Field label="Email *"><Input type="email" value={form.email} onChange={F('email')} /><ErrMsg msg={errors.email} /></Field>
            <Field label="Teléfono"><Input value={form.phone} onChange={F('phone')} placeholder="+56 9 xxxx xxxx" /></Field>
            <Field label="Dirección"><Input value={form.address} onChange={F('address')} /></Field>
            <Field label="Nacionalidad"><Input value={form.nationality} onChange={F('nationality')} /></Field>
            <Field label="Estado Civil">
              <Select value={form.maritalStatus} onChange={F('maritalStatus')} options={[{value:'soltero',label:'Soltero/a'},{value:'casado',label:'Casado/a'},{value:'divorciado',label:'Divorciado/a'},{value:'viudo',label:'Viudo/a'}]} />
            </Field>
          </div>

          <SectionTitle>Contacto de Emergencia</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Nombre Contacto"><Input value={form.emergencyContactName} onChange={F('emergencyContactName')} /></Field>
            <Field label="Teléfono Contacto"><Input value={form.emergencyContactPhone} onChange={F('emergencyContactPhone')} /></Field>
          </div>

          <SectionTitle>Contrato Laboral</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Cargo *"><Input value={form.position} onChange={F('position')} /><ErrMsg msg={errors.position} /></Field>
            <Field label="Departamento"><Select value={form.department} onChange={F('department')} options={DEPARTMENTS} /></Field>
            <Field label="Tipo Contrato"><Select value={form.contractType} onChange={F('contractType')} options={CONTRACT_TYPES} /></Field>
            <Field label="Fecha Ingreso *"><Input type="date" value={form.hireDate} onChange={F('hireDate')} /><ErrMsg msg={errors.hireDate} /></Field>
            {form.contractType === 'plazo_fijo' && (
              <Field label="Fecha Término"><Input type="date" value={form.endDate} onChange={F('endDate')} /></Field>
            )}
            <Field label="Jornada"><Select value={form.workSchedule} onChange={F('workSchedule')} options={SCHEDULE_OPTIONS} /></Field>
            <Field label="Horas Semanales"><Input type="number" value={form.weeklyHours} onChange={v => setForm((p:any) => ({...p, weeklyHours: Number(v)}))} /></Field>
          </div>

          <SectionTitle>Remuneración</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label={`Sueldo Bruto * (mín. ${fmtMoney(IMM)})`}>
              <Input type="number" value={form.grossSalary} onChange={v => setForm((p:any) => ({...p, grossSalary: Number(v)}))} />
              <ErrMsg msg={errors.grossSalary} />
            </Field>
            <Field label="Colación"><Input type="number" value={form.colacion} onChange={v => setForm((p:any) => ({...p, colacion: Number(v)}))} /></Field>
            <Field label="Movilización"><Input type="number" value={form.movilizacion} onChange={v => setForm((p:any) => ({...p, movilizacion: Number(v)}))} /></Field>
            <Field label="AFP"><Select value={form.afp} onChange={F('afp')} options={AFP_LIST} /></Field>
            <Field label="Salud"><Select value={form.healthSystem} onChange={F('healthSystem')} options={HEALTH_OPTIONS} /></Field>
            {form.healthSystem === 'isapre' && (
              <Field label="Nombre ISAPRE"><Input value={form.isapreName || ''} onChange={F('isapreName')} /></Field>
            )}
          </div>

          <SectionTitle>Datos Bancarios</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Banco"><Select value={form.bankName} onChange={F('bankName')} options={BANKS} /></Field>
            <Field label="Tipo Cuenta"><Select value={form.bankAccountType} onChange={F('bankAccountType')} options={ACCOUNT_TYPES} /></Field>
            <Field label="N° Cuenta"><Input value={form.bankAccountNumber} onChange={F('bankAccountNumber')} /></Field>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando…' : 'Crear Colaborador'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tabs del perfil ─────────────────────────────────────────────
type ProfileTab = 'datos' | 'contrato' | 'remuneracion' | 'documentos' | 'historial'

function TabDatos({ emp, onChange, saving, onSave }: { emp: Employee; onChange: (k: string, v: any) => void; saving: boolean; onSave: () => void }) {
  return (
    <div>
      <SectionTitle>Identificación</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="RUT"><Input value={emp.rut} onChange={v => onChange('rut', v)} /></Field>
        <Field label="Fecha Nacimiento"><Input type="date" value={emp.birthDate} onChange={v => onChange('birthDate', v)} /></Field>
        <Field label="Nombre"><Input value={emp.firstName} onChange={v => onChange('firstName', v)} /></Field>
        <Field label="Apellido"><Input value={emp.lastName} onChange={v => onChange('lastName', v)} /></Field>
        <Field label="Email"><Input type="email" value={emp.email} onChange={v => onChange('email', v)} /></Field>
        <Field label="Teléfono"><Input value={emp.phone} onChange={v => onChange('phone', v)} /></Field>
        <Field label="Dirección"><Input value={emp.address} onChange={v => onChange('address', v)} /></Field>
        <Field label="Nacionalidad"><Input value={emp.nationality} onChange={v => onChange('nationality', v)} /></Field>
        <Field label="Estado Civil">
          <Select value={emp.maritalStatus} onChange={v => onChange('maritalStatus', v)} options={[{value:'soltero',label:'Soltero/a'},{value:'casado',label:'Casado/a'},{value:'divorciado',label:'Divorciado/a'},{value:'viudo',label:'Viudo/a'}]} />
        </Field>
      </div>
      <SectionTitle>Contacto de Emergencia</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Nombre"><Input value={emp.emergencyContactName} onChange={v => onChange('emergencyContactName', v)} /></Field>
        <Field label="Teléfono"><Input value={emp.emergencyContactPhone} onChange={v => onChange('emergencyContactPhone', v)} /></Field>
      </div>
      <SaveBtn saving={saving} onSave={onSave} />
    </div>
  )
}

function TabContrato({ emp, onChange, saving, onSave }: { emp: Employee; onChange: (k: string, v: any) => void; saving: boolean; onSave: () => void }) {
  return (
    <div>
      <SectionTitle>Contrato Laboral — Código del Trabajo</SectionTitle>
      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong>Art. 9 CT:</strong> El contrato debe quedar firmado dentro de 15 días corridos desde el inicio. Progresión: plazo fijo 30d → plazo fijo 60d → indefinido. CEO/RRHH puede contratar directamente a indefinido.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Cargo"><Input value={emp.position} onChange={v => onChange('position', v)} /></Field>
        <Field label="Departamento"><Select value={emp.department} onChange={v => onChange('department', v)} options={DEPARTMENTS} /></Field>
        <Field label="Tipo Contrato"><Select value={emp.contractType} onChange={v => onChange('contractType', v)} options={CONTRACT_TYPES} /></Field>
        <Field label="Fecha Ingreso"><Input type="date" value={emp.hireDate} onChange={v => onChange('hireDate', v)} /></Field>
        {(emp.contractType === 'plazo_fijo' || emp.contractType === 'obra_faena') && (
          <Field label="Fecha Término">
            <Input type="date" value={emp.endDate || ''} onChange={v => onChange('endDate', v)} />
          </Field>
        )}
        <Field label="Jornada"><Select value={emp.workSchedule} onChange={v => onChange('workSchedule', v)} options={SCHEDULE_OPTIONS} /></Field>
        <Field label="Horas Semanales"><Input type="number" value={emp.weeklyHours} onChange={v => onChange('weeklyHours', Number(v))} /></Field>
        <Field label="Estado">
          <Select value={emp.status} onChange={v => onChange('status', v)} options={[{value:'active',label:'Activo'},{value:'suspended',label:'Suspendido'},{value:'on_leave',label:'Con Permiso'},{value:'terminated',label:'Terminado'}]} />
        </Field>
      </div>
      <SaveBtn saving={saving} onSave={onSave} />
    </div>
  )
}

function TabRemuneracion({ emp, onChange, saving, onSave }: { emp: Employee; onChange: (k: string, v: any) => void; saving: boolean; onSave: () => void }) {
  const netEstimate = Math.round(
    (emp.grossSalary || 0) * (1 - 0.1164 - 0.07 - 0.006) - 0
  )
  return (
    <div>
      <SectionTitle>Sueldo y Asignaciones</SectionTitle>
      <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        Sueldo líquido estimado: <strong style={{ color: '#22c55e' }}>{fmtMoney(netEstimate)}</strong> (sin Impuesto 2ª Categoría, según retenciones AFP + Salud + AFC)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label={`Sueldo Bruto (mín. ${fmtMoney(IMM)})`}><Input type="number" value={emp.grossSalary} onChange={v => onChange('grossSalary', Number(v))} /></Field>
        <Field label="Colación (no imponible)"><Input type="number" value={emp.colacion} onChange={v => onChange('colacion', Number(v))} /></Field>
        <Field label="Movilización (no imponible)"><Input type="number" value={emp.movilizacion} onChange={v => onChange('movilizacion', Number(v))} /></Field>
      </div>
      <SectionTitle>Previsión y Salud</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="AFP"><Select value={emp.afp} onChange={v => onChange('afp', v)} options={AFP_LIST} /></Field>
        <Field label="Sistema de Salud"><Select value={emp.healthSystem} onChange={v => onChange('healthSystem', v)} options={HEALTH_OPTIONS} /></Field>
        {emp.healthSystem === 'isapre' && (
          <>
            <Field label="Nombre ISAPRE"><Input value={emp.isapreName || ''} onChange={v => onChange('isapreName', v)} /></Field>
            <Field label="Cotización ISAPRE (UF)"><Input type="number" value={emp.isapreUf || 0} onChange={v => onChange('isapreUf', Number(v))} /></Field>
          </>
        )}
        <Field label="AFC (Seguro Desempleo)">
          <Select value={emp.afcActive ? 'si' : 'no'} onChange={v => onChange('afcActive', v === 'si')} options={[{value:'si',label:'Sí — Ley 19.728'},{value:'no',label:'No aplica'}]} />
        </Field>
      </div>
      <SectionTitle>Datos Bancarios</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Banco"><Select value={emp.bankName} onChange={v => onChange('bankName', v)} options={BANKS} /></Field>
        <Field label="Tipo Cuenta"><Select value={emp.bankAccountType} onChange={v => onChange('bankAccountType', v)} options={ACCOUNT_TYPES} /></Field>
        <Field label="N° Cuenta"><Input value={emp.bankAccountNumber} onChange={v => onChange('bankAccountNumber', v)} /></Field>
      </div>
      <SaveBtn saving={saving} onSave={onSave} />
    </div>
  )
}

function TabDocumentos({ emp }: { emp: Employee }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getEmployeeDocuments(emp.id)
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [emp.id])

  const DOC_TYPE_LABEL: Record<string, string> = {
    contract: 'Contrato', fes: 'FES', memo: 'Memo', annex: 'Anexo',
    certificate: 'Certificado', other: 'Otro',
  }

  return (
    <div>
      <SectionTitle>Documentos del Colaborador</SectionTitle>
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando…</div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13 }}>Sin documentos registrados</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d: any) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)',
            }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.fileName || 'Documento'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {DOC_TYPE_LABEL[d.documentType] || d.documentType} · {fmtDate(d.uploadedAt || d.created_at)}
                </div>
              </div>
              {d.signed && <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Firmado</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabHistorial({ emp }: { emp: Employee }) {
  const changes = [
    { date: emp.createdAt, action: 'Registro creado', detail: `Ingreso como ${emp.position}` },
    ...(emp.contractType === 'indefinido' ? [{ date: emp.hireDate, action: 'Contrato indefinido', detail: 'Contrato vigente sin fecha de término' }] : []),
  ].filter(c => c.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div>
      <SectionTitle>Historial de Cambios</SectionTitle>
      {changes.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin historial registrado.</div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {changes.map((c, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ position: 'absolute', left: -17, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-primary)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{fmtDate(c.date)}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.action}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaveBtn({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ padding: '9px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Guardando…' : 'Guardar Cambios'}
      </button>
    </div>
  )
}

// ─── Panel derecho: Perfil completo ──────────────────────────────
function EmployeeProfile({ employee, onUpdated, onDelete }: {
  employee: Employee
  onUpdated: (e: Employee) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState<Employee>({ ...employee })
  const [activeTab, setActiveTab] = useState<ProfileTab>('datos')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Reset form when employee changes
  useEffect(() => { setForm({ ...employee }); setActiveTab('datos'); setSaveMsg('') }, [employee.id])

  const handleChange = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const updated = await api.updateEmployee(form.id, form)
      onUpdated({ ...form, ...updated })
      setSaveMsg('✅ Guardado correctamente')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err: any) {
      setSaveMsg(`❌ ${err?.message || 'Error al guardar'}`)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await api.deleteEmployee(form.id)
      onDelete(form.id)
    } catch (err: any) {
      setSaveMsg(`❌ ${err?.message || 'Error al dar de baja'}`)
    }
    setConfirmDelete(false)
  }

  const TABS: { key: ProfileTab; label: string; emoji: string }[] = [
    { key: 'datos', label: 'Datos Personales', emoji: '👤' },
    { key: 'contrato', label: 'Contrato', emoji: '📋' },
    { key: 'remuneracion', label: 'Remuneración', emoji: '💰' },
    { key: 'documentos', label: 'Documentos', emoji: '📄' },
    { key: 'historial', label: 'Historial', emoji: '🕐' },
  ]

  const statusColor = STATUS_COLOR[form.status] || '#6b7280'
  const statusLabel = STATUS_LABEL[form.status] || form.status
  const contractLabel = CONTRACT_TYPES.find(c => c.value === form.contractType)?.label || form.contractType

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header del perfil ── */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 14, background: avatarColor(form),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {initials(form)}
          </div>

          {/* Info principal */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {fullName(form)}
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: `${statusColor}18`, color: statusColor,
              }}>
                {statusLabel}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              {form.position} {form.department ? `· ${form.department}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { icon: '🪪', val: form.rut },
                { icon: '📅', val: `Ingreso: ${fmtDate(form.hireDate)}` },
                { icon: '📋', val: contractLabel },
                ...(form.endDate ? [{ icon: '⏳', val: `Término: ${fmtDate(form.endDate)}` }] : []),
              ].map(({ icon, val }) => val ? (
                <span key={val} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {icon} {val}
                </span>
              ) : null)}
            </div>
          </div>

          {/* Acción dar de baja */}
          <div style={{ flexShrink: 0 }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ fontSize: 12, padding: '6px 12px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, background: 'none', color: '#ef4444', cursor: 'pointer' }}
              >
                Dar de Baja
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>¿Confirmar?</span>
                <button onClick={handleDelete} style={{ fontSize: 11, padding: '5px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Sí</button>
                <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, padding: '5px 10px', border: '1px solid var(--border)', background: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>No</button>
              </div>
            )}
          </div>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje de guardado */}
      {saveMsg && (
        <div style={{ padding: '8px 24px', fontSize: 12, color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444', background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', borderBottom: '1px solid var(--border)' }}>
          {saveMsg}
        </div>
      )}

      {/* Contenido de la pestaña activa */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {activeTab === 'datos' && <TabDatos emp={form} onChange={handleChange} saving={saving} onSave={handleSave} />}
        {activeTab === 'contrato' && <TabContrato emp={form} onChange={handleChange} saving={saving} onSave={handleSave} />}
        {activeTab === 'remuneracion' && <TabRemuneracion emp={form} onChange={handleChange} saving={saving} onSave={handleSave} />}
        {activeTab === 'documentos' && <TabDocumentos emp={form} />}
        {activeTab === 'historial' && <TabHistorial emp={form} />}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function DirectorioPersonal() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Employee | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'terminated'>('active')

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getEmployees()
      const list: Employee[] = Array.isArray(data) ? data : (data.employees || data.items || [])
      setEmployees(list)
      // Mantener selección si sigue existiendo
      if (selected) {
        const still = list.find(e => e.id === selected.id)
        if (still) setSelected(still)
      }
    } catch {
      setEmployees([])
    }
    setLoading(false)
  }, [selected?.id])

  useEffect(() => { loadEmployees() }, [])

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || fullName(e).toLowerCase().includes(q) || e.rut.includes(q) || e.position?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || e.status === filterStatus || (filterStatus === 'active' && !e.status)
    return matchSearch && matchStatus
  })

  const handleUpdated = (updated: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelected(updated)
  }

  const handleDeleted = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
    setSelected(null)
  }

  const stats = {
    total: employees.length,
    activos: employees.filter(e => !e.status || e.status === 'active').length,
    plazoFijo: employees.filter(e => e.contractType === 'plazo_fijo').length,
    indefinido: employees.filter(e => e.contractType === 'indefinido').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Barra superior ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 16px', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>

        {/* Stats rápidas */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: '#3b82f6' },
            { label: 'Activos', value: stats.activos, color: '#22c55e' },
            { label: 'Plazo Fijo', value: stats.plazoFijo, color: '#f59e0b' },
            { label: 'Indefinido', value: stats.indefinido, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Botón nuevo colaborador */}
        <button
          onClick={() => setShowNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
        >
          + Nuevo Colaborador
        </button>
      </div>

      {/* ── Layout split-panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, flex: 1, minHeight: 0, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-primary)' }}>

        {/* ═══ PANEL IZQUIERDO — Lista de colaboradores ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', minHeight: 0 }}>

          {/* Búsqueda + filtro */}
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="🔍 Buscar nombre, RUT, cargo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {(['all','active','terminated'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  style={{
                    flex: 1, fontSize: 11, padding: '4px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 500,
                    border: filterStatus === f ? 'none' : '1px solid var(--border)',
                    background: filterStatus === f ? 'var(--accent)' : 'none',
                    color: filterStatus === f ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Baja'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista scrolleable */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', marginBottom: 4 }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 6 }} />
                      <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {search ? 'Sin resultados' : 'Sin colaboradores'}
              </div>
            ) : (
              filtered.map(emp => {
                const isSelected = selected?.id === emp.id
                const sc = STATUS_COLOR[emp.status] || '#22c55e'
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelected(emp)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 12px', border: 'none', textAlign: 'left', cursor: 'pointer',
                      background: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar mini */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: avatarColor(emp),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0, position: 'relative',
                    }}>
                      {initials(emp)}
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 9, height: 9, borderRadius: '50%',
                        background: sc, border: '1.5px solid var(--bg-secondary)',
                      }} />
                    </div>

                    {/* Texto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fullName(emp)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {emp.position || '—'} {emp.department ? `· ${emp.department}` : ''}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Contador */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {filtered.length} de {employees.length} colaboradores
          </div>
        </div>

        {/* ═══ PANEL DERECHO — Perfil ═══ */}
        <div style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <EmployeeProfile
              key={selected.id}
              employee={selected}
              onUpdated={handleUpdated}
              onDelete={handleDeleted}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
              <div style={{ fontSize: 56 }}>👥</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Selecciona un colaborador</div>
              <div style={{ fontSize: 13 }}>Haz clic en un nombre de la lista para ver su perfil</div>
              <button
                onClick={() => setShowNew(true)}
                style={{ marginTop: 8, padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                + Crear primer colaborador
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo colaborador */}
      {showNew && (
        <NuevoColaboradorModal
          onClose={() => setShowNew(false)}
          onCreated={() => { loadEmployees(); setShowNew(false) }}
        />
      )}
    </div>
  )
}
