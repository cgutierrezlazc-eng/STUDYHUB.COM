// ═════════════════════════════════════════════════════════════════
// RECLUTAMIENTO TAB — Pipeline de Contratación y Gestión de Candidatos
// Módulo de Reclutamiento para Conniku SpA
// ═════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { btnPrimary, btnSecondary, btnSmall, inputStyle, selectStyle, thStyle, tdStyle, grid2, fmt } from '../shared/styles'
import { DEPARTMENTS } from '../shared/constants'

// ─── Types ──────────────────────────────────────────────────────

type PipelineStage = 'publicada' | 'recibidos' | 'preseleccion' | 'entrevista' | 'evaluacion' | 'oferta' | 'contratado' | 'descartado'
type VacancyStatus = 'abierta' | 'cerrada' | 'en_pausa'
type JobType = 'full_time' | 'part_time' | 'practica' | 'honorarios'
type CandidateSource = 'linkedin' | 'referido' | 'portal_empleo' | 'espontaneo'

interface Candidate {
  id: string
  nombre: string
  email: string
  telefono: string
  cargoPostulado: string
  vacancyId: string
  fuente: CandidateSource
  cvFileName: string | null
  notas: string
  rating: number
  stage: PipelineStage
  stageEnteredDate: string
  entrevistaFecha: string | null
  entrevistaHora: string | null
  entrevistador: string
  createdAt: string
}

interface Vacancy {
  id: string
  titulo: string
  departamento: string
  tipo: JobType
  salarioMin: number
  salarioMax: number
  descripcion: string
  requisitos: string
  fechaLimite: string
  estado: VacancyStatus
  createdAt: string
}

// ─── Constants ──────────────────────────────────────────────────

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'publicada', label: 'Publicada', color: '#6366f1' },
  { key: 'recibidos', label: 'Recibidos', color: '#8b5cf6' },
  { key: 'preseleccion', label: 'Preselección', color: '#3b82f6' },
  { key: 'entrevista', label: 'Entrevista', color: '#f59e0b' },
  { key: 'evaluacion', label: 'Ev. Técnica', color: '#f97316' },
  { key: 'oferta', label: 'Oferta', color: '#10b981' },
  { key: 'contratado', label: 'Contratado', color: '#059669' },
  { key: 'descartado', label: 'Descartado', color: '#ef4444' },
]

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'practica', label: 'Práctica Profesional' },
  { value: 'honorarios', label: 'Honorarios' },
]

const SOURCES: { value: CandidateSource; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referido', label: 'Referido' },
  { value: 'portal_empleo', label: 'Portal de Empleo' },
  { value: 'espontaneo', label: 'Espontáneo' },
]

const STATUS_COLORS: Record<VacancyStatus, { bg: string; text: string }> = {
  abierta: { bg: '#dcfce7', text: '#166534' },
  cerrada: { bg: '#fee2e2', text: '#991b1b' },
  en_pausa: { bg: '#fef3c7', text: '#92400e' },
}

const STATUS_LABELS: Record<VacancyStatus, string> = {
  abierta: 'Abierta',
  cerrada: 'Cerrada',
  en_pausa: 'En Pausa',
}

// ─── Seed Data (vacío — datos reales vienen de la API) ─────────

const today = new Date().toISOString().split('T')[0]
const SEED_VACANCIES: Vacancy[] = []
const SEED_CANDIDATES: Candidate[] = []

// ─── localStorage helpers ───────────────────────────────────────

const LS_VACANCIES = 'conniku_reclutamiento_vacantes'
const LS_CANDIDATES = 'conniku_reclutamiento_candidatos'

function loadVacancies(): Vacancy[] {
  try {
    const raw = localStorage.getItem(LS_VACANCIES)
    return raw ? JSON.parse(raw) : SEED_VACANCIES
  } catch { return SEED_VACANCIES }
}

function loadCandidates(): Candidate[] {
  try {
    const raw = localStorage.getItem(LS_CANDIDATES)
    return raw ? JSON.parse(raw) : SEED_CANDIDATES
  } catch { return SEED_CANDIDATES }
}

function saveVacancies(v: Vacancy[]) { localStorage.setItem(LS_VACANCIES, JSON.stringify(v)) }
function saveCandidates(c: Candidate[]) { localStorage.setItem(LS_CANDIDATES, JSON.stringify(c)) }

// ─── Helpers ────────────────────────────────────────────────────

function daysInStage(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000))
}

function genId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

// ─── Card Style ─────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: 10, padding: '10px 12px',
  border: '1px solid var(--border)', marginBottom: 8, fontSize: 12,
}

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 8, border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
  background: active ? 'var(--accent)' : 'var(--bg-secondary)', color: active ? '#fff' : 'var(--text-primary)',
  fontWeight: 600, fontSize: 12, cursor: 'pointer',
})

const badge = (bg: string, text: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10,
  fontWeight: 700, background: bg, color: text,
})

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════

export default function ReclutamientoTab() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'vacantes' | 'candidatos' | 'metricas'>('pipeline')
  const [vacancies, setVacancies] = useState<Vacancy[]>(loadVacancies)
  const [candidates, setCandidates] = useState<Candidate[]>(loadCandidates)

  // Persist on every change
  const updateVacancies = (v: Vacancy[]) => { setVacancies(v); saveVacancies(v) }
  const updateCandidates = (c: Candidate[]) => { setCandidates(c); saveCandidates(c) }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'pipeline', label: '📋 Pipeline' },
    { key: 'vacantes', label: '💼 Vacantes' },
    { key: 'candidatos', label: '👥 Candidatos' },
    { key: 'metricas', label: '📊 Métricas' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} style={tabBtnStyle(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'pipeline' && <PipelineTab candidates={candidates} vacancies={vacancies} onUpdate={updateCandidates} />}
      {activeTab === 'vacantes' && <VacantesTab vacancies={vacancies} candidates={candidates} onUpdate={updateVacancies} />}
      {activeTab === 'candidatos' && <CandidatosTab candidates={candidates} vacancies={vacancies} onUpdateCandidates={updateCandidates} />}
      {activeTab === 'metricas' && <MetricasTab candidates={candidates} vacancies={vacancies} />}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB 1: Pipeline de Contratación (Kanban)
// ═════════════════════════════════════════════════════════════════

function PipelineTab({ candidates, vacancies, onUpdate }: {
  candidates: Candidate[]; vacancies: Vacancy[]; onUpdate: (c: Candidate[]) => void
}) {
  const [filterVacancy, setFilterVacancy] = useState<string>('all')

  const filtered = filterVacancy === 'all' ? candidates : candidates.filter(c => c.vacancyId === filterVacancy)

  const moveCandidate = (id: string, direction: 'next' | 'prev') => {
    const stageKeys = STAGES.map(s => s.key)
    const updated = candidates.map(c => {
      if (c.id !== id) return c
      const idx = stageKeys.indexOf(c.stage)
      let newIdx = direction === 'next' ? idx + 1 : idx - 1
      if (newIdx < 0 || newIdx >= stageKeys.length) return c
      return { ...c, stage: stageKeys[newIdx], stageEnteredDate: today }
    })
    onUpdate(updated)
  }

  return (
    <div>
      {/* Filter */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Filtrar por vacante:</span>
        <select style={{ ...selectStyle, width: 280 }} value={filterVacancy} onChange={e => setFilterVacancy(e.target.value)}>
          <option value="all">Todas las vacantes</option>
          {vacancies.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
        </select>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
        {STAGES.map(stage => {
          const stageCandidates = filtered.filter(c => c.stage === stage.key)
          return (
            <div key={stage.key} style={{
              minWidth: 200, maxWidth: 220, flex: '0 0 200px',
              background: 'var(--bg-secondary)', borderRadius: 12, padding: 10,
              border: '1px solid var(--border)',
            }}>
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{stage.label}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: stage.color + '22',
                  color: stage.color, padding: '2px 6px', borderRadius: 6,
                }}>{stageCandidates.length}</span>
              </div>

              {/* Cards */}
              {stageCandidates.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
                  Sin candidatos
                </div>
              )}
              {stageCandidates.map(c => (
                <div key={c.id} style={cardStyle}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{c.nombre}</div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{c.cargoPostulado}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                      {daysInStage(c.stageEnteredDate)} día{daysInStage(c.stageEnteredDate) !== 1 ? 's' : ''} en etapa
                    </span>
                    <span style={{ marginLeft: 'auto' }}>
                      {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                    </span>
                  </div>
                  {/* Move Buttons */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {stage.key !== 'publicada' && (
                      <button style={{ ...btnSmall, flex: 1, justifyContent: 'center' }} onClick={() => moveCandidate(c.id, 'prev')}>
                        ← Anterior
                      </button>
                    )}
                    {stage.key !== 'descartado' && stage.key !== 'contratado' && (
                      <button style={{ ...btnSmall, flex: 1, justifyContent: 'center' }} onClick={() => moveCandidate(c.id, 'next')}>
                        Siguiente →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB 2: Vacantes
// ═════════════════════════════════════════════════════════════════

function VacantesTab({ vacancies, candidates, onUpdate }: {
  vacancies: Vacancy[]; candidates: Candidate[]; onUpdate: (v: Vacancy[]) => void
}) {
  const emptyVacancy: Omit<Vacancy, 'id' | 'createdAt'> = {
    titulo: '', departamento: DEPARTMENTS[0], tipo: 'full_time',
    salarioMin: 0, salarioMax: 0, descripcion: '', requisitos: '',
    fechaLimite: '', estado: 'abierta',
  }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyVacancy)
  const [editId, setEditId] = useState<string | null>(null)

  const handleSave = () => {
    if (!form.titulo.trim()) return
    if (editId) {
      onUpdate(vacancies.map(v => v.id === editId ? { ...v, ...form } : v))
    } else {
      onUpdate([...vacancies, { ...form, id: genId(), createdAt: today }])
    }
    setForm(emptyVacancy)
    setEditId(null)
    setShowForm(false)
  }

  const handleEdit = (v: Vacancy) => {
    setForm({ titulo: v.titulo, departamento: v.departamento, tipo: v.tipo, salarioMin: v.salarioMin, salarioMax: v.salarioMax, descripcion: v.descripcion, requisitos: v.requisitos, fechaLimite: v.fechaLimite, estado: v.estado })
    setEditId(v.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta vacante?')) onUpdate(vacancies.filter(v => v.id !== id))
  }

  const countByVacancy = (vid: string) => candidates.filter(c => c.vacancyId === vid).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>Vacantes ({vacancies.length})</h3>
        <button style={btnPrimary} onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyVacancy) }}>
          {showForm ? 'Cancelar' : '+ Nueva Vacante'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)' }}>
            {editId ? 'Editar Vacante' : 'Nueva Vacante'}
          </h4>
          <div style={grid2}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Título del Cargo *</label>
              <input style={inputStyle} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Desarrollador Full-Stack" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Departamento</label>
              <select style={selectStyle} value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value })}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tipo de Contrato</label>
              <select style={selectStyle} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as JobType })}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Estado</label>
              <select style={selectStyle} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as VacancyStatus })}>
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
                <option value="en_pausa">En Pausa</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Salario Mínimo (CLP)</label>
              <input style={inputStyle} type="number" value={form.salarioMin || ''} onChange={e => setForm({ ...form, salarioMin: +e.target.value })} placeholder="Ej: 1500000" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Salario Máximo (CLP)</label>
              <input style={inputStyle} type="number" value={form.salarioMax || ''} onChange={e => setForm({ ...form, salarioMax: +e.target.value })} placeholder="Ej: 2500000" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Fecha Límite Postulación</label>
              <input style={inputStyle} type="date" value={form.fechaLimite} onChange={e => setForm({ ...form, fechaLimite: e.target.value })} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Descripción del Cargo</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe las responsabilidades del cargo..." />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Requisitos</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.requisitos} onChange={e => setForm({ ...form, requisitos: e.target.value })} placeholder="Lista los requisitos del cargo..." />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={btnPrimary} onClick={handleSave}>{editId ? 'Guardar Cambios' : 'Crear Vacante'}</button>
            <button style={btnSecondary} onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Vacancies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {vacancies.map(v => (
          <div key={v.id} style={{
            background: 'var(--bg-secondary)', borderRadius: 12, padding: 14,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{v.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>{v.departamento}</span>
                  <span>{JOB_TYPES.find(t => t.value === v.tipo)?.label}</span>
                  <span>${fmt(v.salarioMin)} - ${fmt(v.salarioMax)} CLP</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={badge(STATUS_COLORS[v.estado].bg, STATUS_COLORS[v.estado].text)}>
                  {STATUS_LABELS[v.estado]}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {v.descripcion.length > 120 ? v.descripcion.slice(0, 120) + '...' : v.descripcion}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Candidatos: {countByVacancy(v.id)}</span>
                <span>Límite: {v.fechaLimite || 'Sin definir'}</span>
                <span>Creada: {v.createdAt}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={btnSmall} onClick={() => handleEdit(v)}>Editar</button>
                <button style={{ ...btnSmall, color: '#ef4444' }} onClick={() => handleDelete(v.id)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB 3: Candidatos
// ═════════════════════════════════════════════════════════════════

function CandidatosTab({ candidates, vacancies, onUpdateCandidates }: {
  candidates: Candidate[]; vacancies: Vacancy[]; onUpdateCandidates: (c: Candidate[]) => void
}) {
  const emptyCandidate: Omit<Candidate, 'id' | 'createdAt'> = {
    nombre: '', email: '', telefono: '', cargoPostulado: '',
    vacancyId: vacancies[0]?.id || '', fuente: 'linkedin',
    cvFileName: null, notas: '', rating: 3, stage: 'recibidos',
    stageEnteredDate: today, entrevistaFecha: null, entrevistaHora: null, entrevistador: '',
  }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyCandidate)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = candidates.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchStage = filterStage === 'all' || c.stage === filterStage
    return matchSearch && matchStage
  })

  const handleSave = () => {
    if (!form.nombre.trim() || !form.email.trim()) return
    const vacancy = vacancies.find(v => v.id === form.vacancyId)
    const cargoPostulado = vacancy ? vacancy.titulo : form.cargoPostulado
    if (editId) {
      onUpdateCandidates(candidates.map(c => c.id === editId ? { ...c, ...form, cargoPostulado } : c))
    } else {
      onUpdateCandidates([...candidates, { ...form, cargoPostulado, id: genId(), createdAt: today }])
    }
    setForm(emptyCandidate)
    setEditId(null)
    setShowForm(false)
  }

  const handleEdit = (c: Candidate) => {
    setForm({
      nombre: c.nombre, email: c.email, telefono: c.telefono, cargoPostulado: c.cargoPostulado,
      vacancyId: c.vacancyId, fuente: c.fuente, cvFileName: c.cvFileName, notas: c.notas,
      rating: c.rating, stage: c.stage, stageEnteredDate: c.stageEnteredDate,
      entrevistaFecha: c.entrevistaFecha, entrevistaHora: c.entrevistaHora, entrevistador: c.entrevistador,
    })
    setEditId(c.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este candidato?')) onUpdateCandidates(candidates.filter(c => c.id !== id))
  }

  const simulateCVUpload = () => {
    const name = form.nombre.trim().replace(/\s+/g, '') || 'Candidato'
    setForm({ ...form, cvFileName: `CV_${name}.pdf` })
  }

  const renderStars = (rating: number, onChange?: (r: number) => void) => (
    <span style={{ cursor: onChange ? 'pointer' : 'default', letterSpacing: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onClick={() => onChange?.(i)} style={{ color: i <= rating ? '#f59e0b' : 'var(--text-muted)', fontSize: 14 }}>
          {i <= rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>Candidatos ({candidates.length})</h3>
        <button style={btnPrimary} onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyCandidate) }}>
          {showForm ? 'Cancelar' : '+ Nuevo Candidato'}
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, maxWidth: 260 }} placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...selectStyle, maxWidth: 200 }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="all">Todas las etapas</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)' }}>
            {editId ? 'Editar Candidato' : 'Nuevo Candidato'}
          </h4>
          <div style={grid2}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre Completo *</label>
              <input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Email *</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Teléfono</label>
              <input style={inputStyle} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+56 9 XXXX XXXX" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Vacante</label>
              <select style={selectStyle} value={form.vacancyId} onChange={e => setForm({ ...form, vacancyId: e.target.value })}>
                {vacancies.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Fuente</label>
              <select style={selectStyle} value={form.fuente} onChange={e => setForm({ ...form, fuente: e.target.value as CandidateSource })}>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Etapa</label>
              <select style={selectStyle} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as PipelineStage })}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Rating</label>
              <div style={{ paddingTop: 6 }}>{renderStars(form.rating, r => setForm({ ...form, rating: r }))}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>CV (simulado)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button style={btnSmall} onClick={simulateCVUpload}>Subir CV</button>
                {form.cvFileName && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{form.cvFileName}</span>}
              </div>
            </div>
          </div>

          {/* Interview Section */}
          <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <h5 style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-primary)' }}>Agendar Entrevista</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Fecha</label>
                <input style={inputStyle} type="date" value={form.entrevistaFecha || ''} onChange={e => setForm({ ...form, entrevistaFecha: e.target.value || null })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Hora</label>
                <input style={inputStyle} type="time" value={form.entrevistaHora || ''} onChange={e => setForm({ ...form, entrevistaHora: e.target.value || null })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Entrevistador</label>
                <input style={inputStyle} value={form.entrevistador} onChange={e => setForm({ ...form, entrevistador: e.target.value })} placeholder="Nombre del entrevistador" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Notas</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones sobre el candidato..." />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={btnPrimary} onClick={handleSave}>{editId ? 'Guardar Cambios' : 'Agregar Candidato'}</button>
            <button style={btnSecondary} onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Candidate List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Cargo</th>
              <th style={thStyle}>Etapa</th>
              <th style={thStyle}>Fuente</th>
              <th style={thStyle}>Rating</th>
              <th style={thStyle}>CV</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const stageInfo = STAGES.find(s => s.key === c.stage)
              const sourceInfo = SOURCES.find(s => s.value === c.fuente)
              const isExpanded = expandedId === c.id
              return (
                <React.Fragment key={c.id}>
                  <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td style={tdStyle}>{c.cargoPostulado}</td>
                    <td style={tdStyle}>
                      <span style={badge(stageInfo?.color + '22', stageInfo?.color || '#888')}>
                        {stageInfo?.label}
                      </span>
                    </td>
                    <td style={tdStyle}>{sourceInfo?.label}</td>
                    <td style={tdStyle}>{renderStars(c.rating)}</td>
                    <td style={tdStyle}>
                      {c.cvFileName ? <span style={{ color: '#10b981', fontSize: 11 }}>Adjunto</span> : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={btnSmall} onClick={e => { e.stopPropagation(); handleEdit(c) }}>Editar</button>
                        <button style={{ ...btnSmall, color: '#ef4444' }} onClick={e => { e.stopPropagation(); handleDelete(c.id) }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 12 }}>
                          <div>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Teléfono</strong>
                            <div style={{ color: 'var(--text-primary)' }}>{c.telefono || '—'}</div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Días en Etapa</strong>
                            <div style={{ color: 'var(--text-primary)' }}>{daysInStage(c.stageEnteredDate)} días</div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>CV</strong>
                            <div style={{ color: 'var(--text-primary)' }}>{c.cvFileName || 'Sin adjuntar'}</div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Entrevista</strong>
                            <div style={{ color: 'var(--text-primary)' }}>
                              {c.entrevistaFecha ? `${c.entrevistaFecha} a las ${c.entrevistaHora || '—'}` : 'No agendada'}
                            </div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Entrevistador</strong>
                            <div style={{ color: 'var(--text-primary)' }}>{c.entrevistador || '—'}</div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Fecha Postulación</strong>
                            <div style={{ color: 'var(--text-primary)' }}>{c.createdAt}</div>
                          </div>
                        </div>
                        {c.notas && (
                          <div style={{ marginTop: 10 }}>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Notas</strong>
                            <div style={{ color: 'var(--text-primary)', fontSize: 12, marginTop: 2, whiteSpace: 'pre-wrap' }}>{c.notas}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
            No se encontraron candidatos
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// TAB 4: Métricas
// ═════════════════════════════════════════════════════════════════

function MetricasTab({ candidates, vacancies }: { candidates: Candidate[]; vacancies: Vacancy[] }) {
  // ─── KPIs ───
  const openPositions = vacancies.filter(v => v.estado === 'abierta').length
  const totalCandidates = candidates.length
  const hired = candidates.filter(c => c.stage === 'contratado')
  const rejected = candidates.filter(c => c.stage === 'descartado')

  // Time to hire (avg days from createdAt to contratado stageEnteredDate)
  const avgTimeToHire = hired.length > 0
    ? Math.round(hired.reduce((sum, c) => {
        const start = new Date(c.createdAt).getTime()
        const end = new Date(c.stageEnteredDate).getTime()
        return sum + Math.max(0, (end - start) / 86400000)
      }, 0) / hired.length)
    : 0

  // Cost per hire (simulated)
  const costPerHire = 350000 // CLP simulated average

  // Conversion funnel
  const stageOrder: PipelineStage[] = ['recibidos', 'preseleccion', 'entrevista', 'evaluacion', 'oferta', 'contratado']
  const funnelData = stageOrder.map(stage => {
    const idx = stageOrder.indexOf(stage)
    // Count candidates that reached this stage or beyond
    const count = candidates.filter(c => {
      const cIdx = stageOrder.indexOf(c.stage)
      // If candidate is in descartado, check their latest known stage by position
      if (c.stage === 'descartado') return false
      return cIdx >= idx
    }).length
    return { stage, label: STAGES.find(s => s.key === stage)?.label || stage, count }
  })

  // Source effectiveness
  const sourceStats = SOURCES.map(src => {
    const fromSource = candidates.filter(c => c.fuente === src.value)
    const hiredFromSource = fromSource.filter(c => c.stage === 'contratado').length
    const avgRating = fromSource.length > 0
      ? (fromSource.reduce((s, c) => s + c.rating, 0) / fromSource.length).toFixed(1)
      : '0'
    return { ...src, total: fromSource.length, hired: hiredFromSource, avgRating }
  })

  const metricCard = (label: string, value: string | number, sub?: string, color?: string): React.ReactNode => (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: 12, padding: 16,
      border: '1px solid var(--border)', flex: '1 1 160px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {metricCard('Vacantes Abiertas', openPositions, `${vacancies.length} totales`, '#6366f1')}
        {metricCard('Total Candidatos', totalCandidates, `${hired.length} contratados, ${rejected.length} descartados`)}
        {metricCard('Tiempo Promedio Contratación', avgTimeToHire > 0 ? `${avgTimeToHire}d` : '—', 'Días promedio', '#f59e0b')}
        {metricCard('Costo por Contratación', `$${fmt(costPerHire)}`, 'CLP estimado', '#10b981')}
      </div>

      {/* Conversion Funnel */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-primary)' }}>Embudo de Conversión</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {funnelData.map((f, i) => {
            const pct = maxFunnel > 0 ? (f.count / maxFunnel) * 100 : 0
            const convRate = i > 0 && funnelData[i - 1].count > 0
              ? ((f.count / funnelData[i - 1].count) * 100).toFixed(0)
              : null
            const stageColor = STAGES.find(s => s.key === f.stage)?.color || '#888'
            return (
              <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {f.label}
                </div>
                <div style={{ flex: 1, height: 28, background: 'var(--bg-primary)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${Math.max(pct, 4)}%`, height: '100%', background: stageColor,
                    borderRadius: 8, transition: 'width 0.3s', opacity: 0.8,
                    display: 'flex', alignItems: 'center', paddingLeft: 8,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{f.count}</span>
                  </div>
                </div>
                <div style={{ width: 50, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {convRate ? `${convRate}%` : '—'}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
          % = tasa de conversión vs. etapa anterior
        </div>
      </div>

      {/* Source Effectiveness */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-primary)' }}>Efectividad por Fuente de Reclutamiento</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Fuente</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Candidatos</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Contratados</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Tasa Conversión</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Rating Promedio</th>
            </tr>
          </thead>
          <tbody>
            {sourceStats.map(s => (
              <tr key={s.value} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{s.label}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{s.total}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{s.hired}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {s.total > 0 ? `${((s.hired / s.total) * 100).toFixed(0)}%` : '—'}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(+s.avgRating))}</span> {s.avgRating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pipeline Summary by Vacancy */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-primary)' }}>Resumen por Vacante</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Vacante</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Candidatos</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>En Proceso</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Contratados</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Descartados</th>
            </tr>
          </thead>
          <tbody>
            {vacancies.map(v => {
              const vCandidates = candidates.filter(c => c.vacancyId === v.id)
              const vHired = vCandidates.filter(c => c.stage === 'contratado').length
              const vRejected = vCandidates.filter(c => c.stage === 'descartado').length
              const vInProcess = vCandidates.length - vHired - vRejected
              return (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{v.titulo}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={badge(STATUS_COLORS[v.estado].bg, STATUS_COLORS[v.estado].text)}>
                      {STATUS_LABELS[v.estado]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{vCandidates.length}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>{vInProcess}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{vHired}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{vRejected}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
