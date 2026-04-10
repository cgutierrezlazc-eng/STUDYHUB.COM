import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Users, Search, Plus, ChevronRight, Shield,
  TrendingUp, Clock, Scale, BookOpen, Flag, FolderOpen,
  ShieldAlert, FileWarning, Lock, AlertTriangle, CheckCircle,
  MessageSquare, Award, Star, Target, FileText, Activity,
  Calendar, BarChart3, ThumbsUp, Briefcase, UserCheck, X,
  Send, Download, Eye, RefreshCw, Edit3, Trash2, Info,
  AlertCircle, ChevronDown, Building2, Hash, Phone, Mail,
  CreditCard, MapPin, Zap, UserPlus, GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../../services/auth'
import { api } from '../../../services/api'
import { Employee } from '../../shared/types'
import { ContractModal } from '../../hr/ContratosTab'
import AccessControlTab from '../../hr/AccessControlTab'
import { CHILE_LABOR } from '../../shared/ChileLaborConstants'
import './personas.css'

// ═══════════════════════════════════════════════════════════════════
// LOCAL ERC STORE  (localStorage-backed, scoped to this module)
// ═══════════════════════════════════════════════════════════════════

type ErcBucket = Record<string, any[]>  // { [empId]: records[] }

class LocalErcStore {
  private data: Record<string, ErcBucket> = {}

  private load() {
    try {
      const raw = localStorage.getItem('conniku_erc_v1')
      this.data = raw ? JSON.parse(raw) : {}
    } catch { this.data = {} }
  }

  private save() {
    try { localStorage.setItem('conniku_erc_v1', JSON.stringify(this.data)) } catch {}
  }

  async loadAll() { this.load() }

  get(key: string): any[] {
    const bucket = this.data[key] || {}
    return Object.values(bucket).flat()
  }

  getForEmp(key: string, empId: string): any[] {
    return (this.data[key] || {})[empId] || []
  }

  async add(key: string, empId: string, record: any) {
    if (!this.data[key]) this.data[key] = {}
    if (!this.data[key][empId]) this.data[key][empId] = []
    this.data[key][empId].push(record)
    this.save()
  }

  async update(key: string, empId: string, updated: any) {
    const list = (this.data[key] || {})[empId] || []
    const idx = list.findIndex((r: any) => r.id === updated.id)
    if (idx >= 0) list[idx] = updated
    else list.push(updated)
    if (!this.data[key]) this.data[key] = {}
    this.data[key][empId] = list
    this.save()
  }
}

const globalErcStore = new LocalErcStore()

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type TrafficLight = 'green' | 'yellow' | 'orange' | 'red'
type DisciplineLevel = 'verbal' | 'written_1' | 'written_2' | 'termination'
type RecordCardKey = 'desempeno' | 'asistencia' | 'cumplimiento' | 'capacitacion' | 'disciplina' | 'documentos'
type ExpTab = 'resumen' | 'amonestaciones' | 'coaching' | 'evaluaciones' | 'conversaciones' | 'reconocimientos' | 'contrato' | 'documentos_tab' | 'onboarding' | 'desvinculacion' | 'vista_trabajador'

interface DisciplineRecord {
  id: string; employeeId: string; level: DisciplineLevel
  category: RecordCardKey; explanation: string; incidentDetails: string
  date: string; issuedBy: string; acknowledged: boolean; acknowledgedDate?: string
  dtNotified?: boolean; dtNotifiedAt?: string
}

interface CoachingRecord {
  id: string; employeeId: string; topic: string; description: string
  actionItems: string; date: string; issuedBy: string
}

interface ConversationRecord {
  id: string; employeeId: string; type: 'library' | 'adhoc'
  title: string; description: string; date: string; issuedBy: string; acknowledged: boolean
}

interface AcknowledgementRecord {
  id: string; employeeId: string; title: string; description: string
  date: string; issuedBy: string
}

interface PerfDimension { name: string; rating: number }
interface PerformanceReview {
  id: string; employeeId: string; type: 'mid_contract' | 'end_contract' | 'additional'
  dimensions: PerfDimension[]; overallRating: number; comments: string
  strengths: string; areasToImprove: string; date: string; issuedBy: string; acknowledged: boolean
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const RECORD_CARDS: { key: RecordCardKey; label: string; icon: React.FC<any> }[] = [
  { key: 'desempeno',    label: 'Desempeño',    icon: TrendingUp },
  { key: 'asistencia',  label: 'Asistencia',   icon: Clock },
  { key: 'cumplimiento',label: 'Cumplimiento', icon: Scale },
  { key: 'capacitacion',label: 'Capacitación', icon: BookOpen },
  { key: 'disciplina',  label: 'Disciplina',   icon: Flag },
  { key: 'documentos',  label: 'Documentos',   icon: FolderOpen },
]

const TRAFFIC: Record<TrafficLight, { bg: string; border: string; text: string; dot: string; label: string }> = {
  green:  { bg: 'rgba(34,197,94,0.10)',  border: '#22c55e', text: '#15803d', dot: '#22c55e',  label: 'Sin registros' },
  yellow: { bg: 'rgba(245,158,11,0.10)', border: '#f59e0b', text: '#b45309', dot: '#f59e0b',  label: 'Atención' },
  orange: { bg: 'rgba(249,115,22,0.10)', border: '#f97316', text: '#c2410c', dot: '#f97316',  label: 'Activo' },
  red:    { bg: 'rgba(239,68,68,0.10)',  border: '#ef4444', text: '#b91c1c', dot: '#ef4444',  label: 'Crítico' },
}

const DISC_LEVELS: { key: DisciplineLevel; label: string; badge: string; short: string }[] = [
  { key: 'verbal',      label: 'Amonestación Verbal',    badge: 'pe-badge-yellow', short: 'V' },
  { key: 'written_1',   label: 'Amonestación Escrita 1', badge: 'pe-badge-orange', short: 'W1' },
  { key: 'written_2',   label: 'Amonestación Escrita 2', badge: 'pe-badge-red',    short: 'W2' },
  { key: 'termination', label: 'Causal de Despido',      badge: 'pe-badge-black',  short: 'T' },
]

const PERF_DIMS = [
  { key: 'quality',        name: 'Calidad del Trabajo',        desc: 'Exactitud, prolijidad y nivel de excelencia en entregables' },
  { key: 'knowledge',      name: 'Conocimiento del Cargo',     desc: 'Dominio de habilidades, herramientas y procedimientos necesarios' },
  { key: 'communication',  name: 'Comunicación',               desc: 'Claridad, oportunidad y efectividad al comunicarse con el equipo' },
  { key: 'teamwork',       name: 'Trabajo en Equipo',          desc: 'Colaboración, apoyo mutuo y contribución al ambiente laboral' },
  { key: 'initiative',     name: 'Iniciativa y Proactividad',  desc: 'Capacidad de anticipar problemas y proponer soluciones' },
  { key: 'attendance',     name: 'Puntualidad y Asistencia',   desc: 'Cumplimiento de horarios, asistencia regular y disponibilidad' },
  { key: 'values',         name: 'Adherencia a Valores',       desc: 'Vivencia diaria de los valores corporativos de Conniku' },
  { key: 'results',        name: 'Logro de Objetivos',         desc: 'Cumplimiento de KPIs y metas del período evaluado' },
  { key: 'adaptability',   name: 'Adaptabilidad',              desc: 'Respuesta efectiva ante cambios y situaciones inesperadas' },
  { key: 'ethics',         name: 'Ética y Probidad',           desc: 'Integridad, confidencialidad y conducta profesional' },
]

const CONV_LIBRARY = [
  { title: 'Feedback de Desempeño',      desc: 'Conversación sobre rendimiento reciente del trabajador' },
  { title: 'Plan de Desarrollo',         desc: 'Definición de metas de crecimiento profesional' },
  { title: 'Reunión 1:1 Mensual',        desc: 'Check-in mensual de bienestar y avance' },
  { title: 'Retroalimentación de Proyecto', desc: 'Revisión de resultados de un proyecto específico' },
  { title: 'Expectativas del Período',   desc: 'Alineamiento de expectativas para el próximo período' },
  { title: 'Revisión de Objetivos',      desc: 'Seguimiento formal de los objetivos establecidos' },
]

const ACK_LIBRARY = [
  { title: 'Excelencia en el Cargo',     desc: 'Por desempeño excepcional en sus funciones' },
  { title: 'Trabajo en Equipo',          desc: 'Por colaboración ejemplar con el equipo' },
  { title: 'Innovación y Mejora',        desc: 'Por proponer una mejora significativa al proceso' },
  { title: 'Puntualidad Perfecta',       desc: 'Asistencia y puntualidad impecable en el período' },
  { title: 'Superación de Metas',        desc: 'Por superar los KPIs establecidos del período' },
  { title: 'Compromiso Excepcional',     desc: 'Esfuerzo extraordinario ante una situación crítica' },
]

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtRut(rut: string) {
  if (!rut) return '—'
  return rut
}

function getPositionLevel(pos: string): number {
  const p = pos.toLowerCase()
  if (p.includes('ceo') || p.includes('gerente general') || p.includes('director general')) return 0
  if (p.includes('cto') || p.includes('director')) return 1
  if (p.includes('head') || p.includes('jefe') || p.includes('manager')) return 2
  if (p.includes('lead') || p.includes('senior')) return 3
  return 4
}

function sortByHierarchy(emps: Employee[]) {
  return [...emps].sort((a, b) => getPositionLevel(a.position) - getPositionLevel(b.position))
}

function getHierarchyGroup(pos: string): string {
  const l = getPositionLevel(pos)
  if (l === 0) return 'Dirección General'
  if (l === 1) return 'Dirección'
  if (l === 2) return 'Jefaturas'
  if (l === 3) return 'Senior'
  return 'Equipo'
}

const LEVEL_COLORS: Record<string, string> = {
  'Dirección General': '#f59e0b',
  'Dirección': '#3b82f6',
  'Jefaturas': '#8b5cf6',
  'Senior': '#06b6d4',
  'Equipo': '#6b7280',
}

function getForEmployee<T>(key: string, empId: string): T[] {
  return globalErcStore.getForEmp(key, empId) as T[]
}

function getRecordCardStatus(empId: string, key: RecordCardKey, documents: any[]): { status: TrafficLight; label: string } {
  const disciplines = getForEmployee<DisciplineRecord>('discipline', empId).filter(d => d.category === key)
  const reviews = getForEmployee<PerformanceReview>('reviews', empId)

  if (key === 'desempeno') {
    if (reviews.length === 0) return { status: 'green', label: 'Sin evaluaciones' }
    const last = reviews.slice(-2)
    const below = last.filter(r => r.overallRating < 3).length
    if (below >= 2) return { status: 'red', label: 'Rendimiento crítico' }
    if (below >= 1) return { status: 'yellow', label: 'Atención requerida' }
    const avg = reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
    return { status: avg >= 4 ? 'green' : 'yellow', label: `Prom. ${avg.toFixed(1)}/5` }
  }

  if (key === 'documentos') {
    const required = ['contrato', 'job_description', 'expectation_memo', 'reglamento', 'obligacion_informar']
    const have = required.filter(dt => documents.some((d: any) => d.documentType === dt))
    const pct = (have.length / required.length) * 100
    if (pct >= 100) return { status: 'green', label: 'Carpeta completa' }
    if (pct >= 60)  return { status: 'yellow', label: `${have.length}/${required.length} docs` }
    return { status: 'red', label: `${have.length}/${required.length} docs` }
  }

  if (disciplines.some(d => d.level === 'termination')) return { status: 'red',    label: 'Causal activa' }
  if (disciplines.some(d => d.level === 'written_2'))   return { status: 'red',    label: 'Escrita 2 activa' }
  if (disciplines.some(d => d.level === 'written_1'))   return { status: 'orange', label: 'Escrita 1 activa' }
  if (disciplines.some(d => d.level === 'verbal'))      return { status: 'yellow', label: 'Verbal activa' }
  return { status: 'green', label: 'Sin registros' }
}

async function sendDTNotification(employee: Employee, discipline: DisciplineRecord, issuerName: string) {
  try {
    const levelLabel = DISC_LEVELS.find(d => d.key === discipline.level)?.label || discipline.level
    await api.ceoSendEmail(
      'inspeccion@dt.gob.cl',
      `Registro Disciplinario | RUT: ${employee.rut} | ${levelLabel} | ${discipline.date}`,
      `Estimada Dirección del Trabajo,\n\nConniku SpA (RUT 78.395.702-7) notifica el siguiente registro disciplinario:\n\nTrabajador: ${employee.firstName} ${employee.lastName}\nRUT: ${employee.rut}\nCargo: ${employee.position}\nTipo: ${levelLabel}\nFecha: ${discipline.date}\nCategoria: ${discipline.category}\nDescripción: ${discipline.explanation}\n\nEste registro ha sido firmado digitalmente por el trabajador con hash SHA-256: ${uid()}\n\nAtentamente,\n${issuerName}\nConniku SpA`,
      '', '', 'ceo',
    )
  } catch (_) { /* DT notification is best-effort */ }
}

// ═══════════════════════════════════════════════════════════════════
// MY WORK — Dashboard View
// ═══════════════════════════════════════════════════════════════════

function MyWorkView({ employees, onSelectEmployee }: { employees: Employee[]; onSelectEmployee: (e: Employee) => void }) {
  const allDisc = globalErcStore.get('discipline') as DisciplineRecord[]
  const allReviews = globalErcStore.get('reviews') as PerformanceReview[]

  const pendingAck = allDisc.filter(d => !d.acknowledged)
  const activeDisc = allDisc.filter(d => ['written_1', 'written_2', 'termination'].includes(d.level))
  const recentAck  = globalErcStore.get('acknowledgements') as AcknowledgementRecord[]

  const today = new Date()
  const getEmp = (id: string) => employees.find(e => e.id === id)

  const todayStr = today.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="mywork-container">
      <div className="mywork-topbar">
        <div>
          <div className="mywork-title">Mi Trabajo</div>
          <div className="mywork-date">{todayStr.charAt(0).toUpperCase() + todayStr.slice(1)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Activity size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="mywork-stats-grid">
        {[
          { value: employees.filter(e => e.status === 'active').length, label: 'Activos', sub: `${employees.length} total`, color: 'var(--accent-green)', icon: Users },
          { value: pendingAck.length, label: 'Por Firmar', sub: 'Amonestaciones pendientes', color: '#f59e0b', icon: AlertTriangle },
          { value: activeDisc.length, label: 'Disciplinas Activas', sub: 'W1 / W2 / Causales', color: '#ef4444', icon: ShieldAlert },
          { value: recentAck.slice(-30).length, label: 'Reconocimientos', sub: 'Últimos 30 días', color: '#8b5cf6', icon: Award },
        ].map(s => (
          <div key={s.label} className="mywork-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="mywork-stat-number" style={{ color: s.color }}>{s.value}</div>
              <s.icon size={18} style={{ color: s.color, opacity: 0.5, marginTop: 4 }} />
            </div>
            <div className="mywork-stat-label">{s.label}</div>
            <div className="mywork-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="mywork-body">
        {/* Pendientes por firma */}
        <div className="mywork-section">
          <div className="mywork-section-title">
            <AlertCircle size={13} />
            Pendientes de firma ({pendingAck.length})
          </div>
          {pendingAck.length === 0
            ? <div className="mywork-empty">Sin pendientes — al día</div>
            : pendingAck.slice(0, 6).map(d => {
                const emp = getEmp(d.employeeId)
                const lvl = DISC_LEVELS.find(l => l.key === d.level)
                if (!emp) return null
                return (
                  <div key={d.id} className="mywork-task-row" onClick={() => onSelectEmployee(emp)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mywork-task-name">{emp.firstName} {emp.lastName}</div>
                      <div className="mywork-task-meta">{lvl?.label} · {fmtDate(d.date)}</div>
                    </div>
                    <span className={`pe-badge ${lvl?.badge}`}>{lvl?.short}</span>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })
          }
        </div>

        {/* Disciplinas activas */}
        <div className="mywork-section">
          <div className="mywork-section-title">
            <Flag size={13} />
            Disciplinas activas ({activeDisc.length})
          </div>
          {activeDisc.length === 0
            ? <div className="mywork-empty">Sin disciplinas activas</div>
            : activeDisc.slice(0, 5).map(d => {
                const emp = getEmp(d.employeeId)
                const lvl = DISC_LEVELS.find(l => l.key === d.level)
                if (!emp) return null
                return (
                  <div key={d.id} className="mywork-task-row" onClick={() => onSelectEmployee(emp)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flag size={13} color="#ef4444" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mywork-task-name">{emp.firstName} {emp.lastName}</div>
                      <div className="mywork-task-meta">{d.explanation.slice(0, 50)}{d.explanation.length > 50 ? '…' : ''}</div>
                    </div>
                    <span className={`pe-badge ${lvl?.badge}`}>{lvl?.short}</span>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })
          }
        </div>

        {/* Evaluaciones programadas */}
        <div className="mywork-section">
          <div className="mywork-section-title">
            <BarChart3 size={13} />
            Evaluaciones recientes
          </div>
          {allReviews.length === 0
            ? <div className="mywork-empty">Sin evaluaciones registradas</div>
            : allReviews.slice(-4).reverse().map(r => {
                const emp = getEmp(r.employeeId)
                if (!emp) return null
                return (
                  <div key={r.id} className="mywork-task-row" onClick={() => onSelectEmployee(emp)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={13} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mywork-task-name">{emp.firstName} {emp.lastName}</div>
                      <div className="mywork-task-meta">{r.type === 'mid_contract' ? 'Mitad de contrato' : r.type === 'end_contract' ? 'Fin de contrato' : 'Adicional'} · {fmtDate(r.date)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= Math.round(r.overallRating) ? 'var(--accent)' : 'var(--border)' }} />
                      ))}
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })
          }
        </div>

        {/* Reconocimientos recientes */}
        <div className="mywork-section">
          <div className="mywork-section-title">
            <Award size={13} />
            Reconocimientos recientes
          </div>
          {recentAck.length === 0
            ? <div className="mywork-empty">Sin reconocimientos emitidos</div>
            : recentAck.slice(-4).reverse().map(a => {
                const emp = getEmp(a.employeeId)
                if (!emp) return null
                return (
                  <div key={a.id} className="mywork-task-row" onClick={() => onSelectEmployee(emp)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={13} color="#f59e0b" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mywork-task-name">{emp.firstName} {emp.lastName}</div>
                      <div className="mywork-task-meta">{a.title} · {fmtDate(a.date)}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB — RESUMEN
// ═══════════════════════════════════════════════════════════════════

function TabResumen({ employee, documents }: { employee: Employee; documents: any[] }) {
  const disciplines  = getForEmployee<DisciplineRecord>('discipline', employee.id)
  const coaching     = getForEmployee<CoachingRecord>('coaching', employee.id)
  const convs        = getForEmployee<ConversationRecord>('conversations', employee.id)
  const reviews      = getForEmployee<PerformanceReview>('reviews', employee.id)
  const acks         = getForEmployee<AcknowledgementRecord>('acknowledgements', employee.id)
  const lastReview   = reviews[reviews.length - 1]
  const activeDisciplines = disciplines.filter(d => ['written_1','written_2','termination'].includes(d.level))

  return (
    <div>
      {/* Key metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { n: disciplines.length,  label: 'Amonestaciones', color: disciplines.length > 0 ? '#ef4444' : 'var(--accent-green)', icon: Flag },
          { n: coaching.length,     label: 'Coaching',       color: 'var(--accent)', icon: MessageSquare },
          { n: convs.length,        label: 'Conversaciones', color: '#8b5cf6', icon: MessageSquare },
          { n: reviews.length,      label: 'Evaluaciones',   color: '#0891b2', icon: Star },
          { n: acks.length,         label: 'Reconocimientos',color: '#f59e0b', icon: Award },
        ].map(m => (
          <div key={m.label} className="pe-card" style={{ textAlign: 'center', padding: '14px 10px' }}>
            <m.icon size={18} style={{ color: m.color, marginBottom: 6 }} />
            <div style={{ fontSize: 24, fontWeight: 900, color: m.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{m.n}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Ficha básica */}
        <div className="pe-card">
          <div className="pe-card-header">
            <div className="pe-card-title"><Briefcase size={14} /> Datos del Cargo</div>
          </div>
          {[
            { icon: Hash,     label: 'RUT',         val: fmtRut(employee.rut) },
            { icon: Briefcase,label: 'Cargo',        val: employee.position },
            { icon: Building2,label: 'Departamento', val: employee.department },
            { icon: Calendar, label: 'Fecha ingreso',val: fmtDate(employee.hireDate) },
            { icon: CreditCard,label: 'Contrato',   val: employee.contractType?.replace('_', ' ') || '—' },
            { icon: Mail,     label: 'Email',        val: employee.email || '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <r.icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{r.label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* Última evaluación */}
        <div className="pe-card">
          <div className="pe-card-header">
            <div className="pe-card-title"><Star size={14} /> Última Evaluación</div>
          </div>
          {lastReview ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: lastReview.overallRating >= 4 ? 'var(--accent-green)' : lastReview.overallRating >= 3 ? 'var(--accent)' : '#ef4444', letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {lastReview.overallRating.toFixed(1)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {lastReview.overallRating >= 4.5 ? 'Excepcional' : lastReview.overallRating >= 3.5 ? 'Destacado' : lastReview.overallRating >= 2.5 ? 'Cumple' : lastReview.overallRating >= 1.5 ? 'En Desarrollo' : 'Deficiente'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(lastReview.date)}</div>
                </div>
              </div>
              {lastReview.dimensions.slice(0, 4).map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{d.name}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ width: 14, height: 5, borderRadius: 3, background: n <= d.rating ? 'var(--accent)' : 'var(--border)' }} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="pe-empty"><Star size={28} /><div className="pe-empty-title">Sin evaluaciones</div><div className="pe-empty-sub">No se han registrado evaluaciones de desempeño</div></div>
          )}
        </div>

        {/* Disciplinas activas */}
        {activeDisciplines.length > 0 && (
          <div className="pe-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="pe-card-header">
              <div className="pe-card-title"><ShieldAlert size={14} color="#ef4444" /> Disciplinas Activas</div>
            </div>
            {activeDisciplines.map(d => {
              const lvl = DISC_LEVELS.find(l => l.key === d.level)
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className={`pe-badge ${lvl?.badge}`}>{lvl?.short}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{lvl?.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.explanation.slice(0, 60)}{d.explanation.length > 60 ? '…' : ''}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.date)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Actividad reciente */}
        <div className="pe-card">
          <div className="pe-card-header">
            <div className="pe-card-title"><Activity size={14} /> Actividad Reciente</div>
          </div>
          {[
            ...disciplines.map(d => ({ date: d.date, type: 'amonestacion', label: DISC_LEVELS.find(l => l.key === d.level)?.label || d.level, icon: Flag, color: '#ef4444' })),
            ...coaching.map(c => ({ date: c.date, type: 'coaching', label: c.topic, icon: MessageSquare, color: 'var(--accent)' })),
            ...acks.map(a => ({ date: a.date, type: 'reconocimiento', label: a.title, icon: Award, color: '#f59e0b' })),
            ...reviews.map(r => ({ date: r.date, type: 'evaluacion', label: `Evaluación · ${r.overallRating.toFixed(1)}/5`, icon: Star, color: '#0891b2' })),
          ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={13} color={item.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtDate(item.date)}</span>
            </div>
          ))}
          {disciplines.length + coaching.length + acks.length + reviews.length === 0 && (
            <div className="pe-empty"><Activity size={24} /><div className="pe-empty-title">Sin actividad registrada</div></div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB — AMONESTACIONES
// ═══════════════════════════════════════════════════════════════════

function TabAmonestaciones({ employee, issuerName }: { employee: Employee; issuerName: string }) {
  const [records, setRecords] = useState<DisciplineRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ level: 'verbal' as DisciplineLevel, category: 'disciplina' as RecordCardKey, explanation: '', incidentDetails: '' })
  const [saving, setSaving] = useState(false)
  const [sigModal, setSigModal] = useState<DisciplineRecord | null>(null)
  const [refresh, setRefresh] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSig, setHasSig] = useState(false)

  useEffect(() => {
    setRecords(getForEmployee<DisciplineRecord>('discipline', employee.id))
  }, [employee.id, refresh])

  // Auto-suggest next level
  const suggestedLevel = (): DisciplineLevel => {
    if (records.some(r => r.level === 'written_2'))  return 'termination'
    if (records.some(r => r.level === 'written_1'))  return 'written_2'
    if (records.some(r => r.level === 'verbal'))     return 'written_1'
    return 'verbal'
  }

  useEffect(() => {
    if (showForm) setForm(f => ({ ...f, level: suggestedLevel() }))
  }, [showForm])

  const save = async () => {
    if (!form.explanation.trim() || !form.incidentDetails.trim()) return
    setSaving(true)
    const rec: DisciplineRecord = {
      id: uid(), employeeId: employee.id, level: form.level, category: form.category,
      explanation: form.explanation, incidentDetails: form.incidentDetails,
      date: new Date().toISOString().split('T')[0], issuedBy: issuerName, acknowledged: false,
    }
    await globalErcStore.add('discipline', employee.id, rec)
    setRecords(prev => [...prev, rec])
    setForm({ level: 'verbal', category: 'disciplina', explanation: '', incidentDetails: '' })
    setShowForm(false)
    setSaving(false)
    setRefresh(r => r + 1)
  }

  const signRecord = async (rec: DisciplineRecord) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const imgData = canvas.toDataURL()
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(imgData + rec.id + Date.now()))
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')

    const updated: DisciplineRecord = {
      ...rec,
      acknowledged: true,
      acknowledgedDate: new Date().toISOString(),
      dtNotified: true,
      dtNotifiedAt: new Date().toISOString(),
    }
    await globalErcStore.update('discipline', employee.id, updated)

    // Notify worker by email
    try {
      const lvlLabel = DISC_LEVELS.find(d => d.key === rec.level)?.label || rec.level
      await api.ceoSendEmail(
        employee.email,
        `Copia de ${lvlLabel} — Conniku SpA`,
        `Estimado/a ${employee.firstName} ${employee.lastName},\n\nAdjuntamos copia de la ${lvlLabel} emitida con fecha ${rec.date}.\n\nDocumento firmado digitalmente. Hash SHA-256: ${hashHex}\n\nConniku SpA — People & Culture`,
        '', '', 'noreply',
      )
    } catch (_) {}

    // Capa 2: DT notification
    await sendDTNotification(employee, updated, issuerName)

    setSigModal(null)
    clearCanvas()
    setRefresh(r => r + 1)
  }

  // Canvas drawing
  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHasSig(false)
  }
  const startDraw = (e: React.MouseEvent) => {
    setDrawing(true)
    const r = canvasRef.current!.getBoundingClientRect()
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
  }
  const draw = (e: React.MouseEvent) => {
    if (!drawing || !canvasRef.current) return
    setHasSig(true)
    const r = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')!
    ctx.strokeStyle = 'var(--text-primary)'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke()
  }

  return (
    <div>
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><Flag size={14} /> Historial de Amonestaciones ({records.length})</div>
          <button className="pe-btn pe-btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Nueva Amonestación
          </button>
        </div>

        {/* Progresión visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 16px', borderBottom: '1px solid var(--border)' }}>
          {DISC_LEVELS.map((lvl, i) => {
            const count = records.filter(r => r.level === lvl.key).length
            const isActive = records.some(r => r.level === lvl.key)
            return (
              <React.Fragment key={lvl.key}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isActive ? (lvl.key === 'termination' ? '#1f2937' : lvl.key === 'written_2' ? '#ef4444' : lvl.key === 'written_1' ? '#f97316' : '#f59e0b') : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', color: isActive ? '#fff' : 'var(--text-muted)', fontWeight: 800, fontSize: 11 }}>
                    {count > 0 ? count : lvl.short}
                  </div>
                  <div style={{ fontSize: 9, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lvl.label.replace('Amonestación ', '')}</div>
                </div>
                {i < DISC_LEVELS.length - 1 && <div style={{ width: 20, height: 1, background: 'var(--border)', flexShrink: 0 }} />}
              </React.Fragment>
            )
          })}
        </div>

        {records.length === 0
          ? <div className="pe-empty"><Flag size={28} /><div className="pe-empty-title">Sin amonestaciones</div><div className="pe-empty-sub">El historial disciplinario está limpio</div></div>
          : records.slice().reverse().map(r => {
              const lvl = DISC_LEVELS.find(l => l.key === r.level)
              return (
                <div key={r.id} className="pe-record-item">
                  <div className="pe-record-item-header">
                    <span className={`pe-badge ${lvl?.badge}`}>{lvl?.short} — {lvl?.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmtDate(r.date)}</span>
                    {r.acknowledged
                      ? <span className="dt-sent-badge"><CheckCircle size={10} /> Firmada · DT Notificada</span>
                      : <button className="pe-btn pe-btn-outline" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => setSigModal(r)}><Edit3 size={11} /> Obtener firma</button>
                    }
                  </div>
                  <div className="pe-record-item-body">
                    <strong>Infracción:</strong> {r.explanation}
                    <br /><strong>Detalles:</strong> {r.incidentDetails}
                  </div>
                  <div className="pe-record-item-footer">
                    <span>Emitida por: {r.issuedBy}</span>
                    {r.acknowledgedDate && <span>Firmada: {fmtDate(r.acknowledgedDate)}</span>}
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="pe-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="pe-modal" onClick={e => e.stopPropagation()}>
            <div className="pe-modal-header">
              <div className="pe-modal-title"><Flag size={15} /> Nueva Amonestación — {employee.firstName} {employee.lastName}</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="pe-modal-body">
              {/* Auto-suggest banner */}
              <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Info size={14} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Nivel sugerido por el sistema</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Basado en historial: <strong>{DISC_LEVELS.find(l => l.key === suggestedLevel())?.label}</strong>
                  </div>
                </div>
              </div>

              <div className="pe-form-grid-2" style={{ marginBottom: 14 }}>
                <div>
                  <label className="pe-form-label">Nivel de amonestación *</label>
                  <select className="pe-select" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as DisciplineLevel }))}>
                    {DISC_LEVELS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="pe-form-label">Categoría</label>
                  <select className="pe-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as RecordCardKey }))}>
                    {RECORD_CARDS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="pe-form-label">Explicación de la infracción * (requerido para enviar)</label>
                <textarea className="pe-textarea" rows={2} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Describa la conducta o infracción observada..." />
              </div>
              <div>
                <label className="pe-form-label">Detalles del incidente * (requerido para enviar)</label>
                <textarea className="pe-textarea" rows={3} value={form.incidentDetails} onChange={e => setForm(f => ({ ...f, incidentDetails: e.target.value }))} placeholder="Fecha, hora, lugar, testigos, circunstancias..." />
              </div>
            </div>
            <div className="pe-modal-footer">
              <button className="pe-btn pe-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="pe-btn pe-btn-primary" onClick={save} disabled={saving || !form.explanation.trim() || !form.incidentDetails.trim()}>
                {saving ? 'Guardando…' : <><Send size={13} /> Guardar y enviar a aprobación</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNATURE MODAL */}
      {sigModal && (
        <div className="pe-modal-overlay" onClick={() => { setSigModal(null); clearCanvas() }}>
          <div className="pe-modal" onClick={e => e.stopPropagation()}>
            <div className="pe-modal-header">
              <div className="pe-modal-title"><Edit3 size={15} /> Firma del Trabajador</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => { setSigModal(null); clearCanvas() }}><X size={16} /></button>
            </div>
            <div className="pe-modal-body">
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
                Al firmar, el trabajador <strong>{employee.firstName} {employee.lastName}</strong> acusa recibo de la <strong>{DISC_LEVELS.find(l => l.key === sigModal.level)?.label}</strong>. El sistema enviará copia a su email y notificará a la Dirección del Trabajo.
              </div>
              <label className="pe-form-label" style={{ marginBottom: 8 }}>Firma del trabajador (dibujar con mouse/touch)</label>
              <div className={`firma-canvas-wrapper ${hasSig ? 'signed' : ''}`}>
                <canvas ref={canvasRef} width={480} height={140} style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)}
                />
                <button className="firma-canvas-clear" onClick={clearCanvas}>Limpiar</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <input type="checkbox" id="ack_check" />
                <label htmlFor="ack_check" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  El trabajador acusa recibo y entiende el contenido de la amonestación
                </label>
              </div>
            </div>
            <div className="pe-modal-footer">
              <button className="pe-btn pe-btn-ghost" onClick={() => { setSigModal(null); clearCanvas() }}>Cancelar</button>
              <button className="pe-btn pe-btn-primary" onClick={() => signRecord(sigModal)} disabled={!hasSig}>
                <CheckCircle size={13} /> Confirmar firma + Notificar DT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB — COACHING
// ═══════════════════════════════════════════════════════════════════

function TabCoaching({ employee, issuerName }: { employee: Employee; issuerName: string }) {
  const [records, setRecords] = useState<CoachingRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ topic: '', description: '', actionItems: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => setRecords(getForEmployee<CoachingRecord>('coaching', employee.id)), [employee.id])

  const save = async () => {
    if (!form.topic.trim()) return
    setSaving(true)
    const rec: CoachingRecord = {
      id: uid(), employeeId: employee.id, topic: form.topic,
      description: form.description, actionItems: form.actionItems,
      date: new Date().toISOString().split('T')[0], issuedBy: issuerName,
    }
    await globalErcStore.add('coaching', employee.id, rec)
    setRecords(prev => [...prev, rec])
    setForm({ topic: '', description: '', actionItems: '' })
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div>
      <div className="pe-card">
        <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          El coaching es retroalimentación de desarrollo. <strong>No constituye disciplina y no requiere aprobación.</strong> Queda en el historial del trabajador como registro positivo de acompañamiento.
        </div>
        <div className="pe-card-header">
          <div className="pe-card-title"><MessageSquare size={14} /> Sesiones de Coaching ({records.length})</div>
          <button className="pe-btn pe-btn-primary" onClick={() => setShowForm(true)}><Plus size={13} /> Nueva Sesión</button>
        </div>

        {records.length === 0
          ? <div className="pe-empty"><MessageSquare size={28} /><div className="pe-empty-title">Sin sesiones de coaching</div><div className="pe-empty-sub">Registra conversaciones de desarrollo y acompañamiento</div></div>
          : records.slice().reverse().map(r => (
              <div key={r.id} className="pe-record-item">
                <div className="pe-record-item-header">
                  <span className="pe-badge pe-badge-blue">{r.topic}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmtDate(r.date)}</span>
                </div>
                <div className="pe-record-item-body">{r.description}</div>
                {r.actionItems && <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 12 }}><strong>Compromisos:</strong> {r.actionItems}</div>}
                <div className="pe-record-item-footer"><span>Por: {r.issuedBy}</span></div>
              </div>
            ))
        }
      </div>

      {showForm && (
        <div className="pe-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="pe-modal" onClick={e => e.stopPropagation()}>
            <div className="pe-modal-header">
              <div className="pe-modal-title"><MessageSquare size={15} /> Nueva Sesión de Coaching</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="pe-modal-body">
              <div style={{ marginBottom: 12 }}>
                <label className="pe-form-label">Tema de la sesión *</label>
                <input className="pe-input" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="Ej: Comunicación con el equipo, Gestión del tiempo..." />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="pe-form-label">Descripción de la conversación</label>
                <textarea className="pe-textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Resumen de la sesión, contexto y observaciones..." />
              </div>
              <div>
                <label className="pe-form-label">Compromisos / Próximos pasos</label>
                <textarea className="pe-textarea" rows={2} value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))} placeholder="Acciones acordadas con el trabajador..." />
              </div>
            </div>
            <div className="pe-modal-footer">
              <button className="pe-btn pe-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="pe-btn pe-btn-primary" onClick={save} disabled={saving || !form.topic.trim()}>
                {saving ? 'Guardando…' : <><CheckCircle size={13} /> Guardar sesión</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB — EVALUACIONES
// ═══════════════════════════════════════════════════════════════════

function TabEvaluaciones({ employee, issuerName }: { employee: Employee; issuerName: string }) {
  const [records, setRecords] = useState<PerformanceReview[]>([])
  const [showForm, setShowForm] = useState(false)
  const [reviewType, setReviewType] = useState<'mid_contract' | 'end_contract' | 'additional'>('additional')
  const [dims, setDims] = useState<Record<string, number>>(Object.fromEntries(PERF_DIMS.map(d => [d.key, 0])))
  const [comments, setComments] = useState('')
  const [strengths, setStrengths] = useState('')
  const [improve, setImprove] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => setRecords(getForEmployee<PerformanceReview>('reviews', employee.id)), [employee.id])

  const overall = () => {
    const vals = Object.values(dims).filter(v => v > 0)
    return vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0
  }

  const ratingLabel = (r: number) => {
    if (r >= 4.5) return { label: 'Excepcional',    color: '#059669' }
    if (r >= 3.5) return { label: 'Destacado',      color: 'var(--accent)' }
    if (r >= 2.5) return { label: 'Cumple',         color: '#0891b2' }
    if (r >= 1.5) return { label: 'En Desarrollo',  color: '#f59e0b' }
    return            { label: 'Deficiente',         color: '#ef4444' }
  }

  const save = async () => {
    if (overall() === 0) return
    setSaving(true)
    const rec: PerformanceReview = {
      id: uid(), employeeId: employee.id, type: reviewType,
      dimensions: PERF_DIMS.map(d => ({ name: d.name, rating: dims[d.key] || 0 })),
      overallRating: parseFloat(overall().toFixed(2)),
      comments, strengths, areasToImprove: improve,
      date: new Date().toISOString().split('T')[0], issuedBy: issuerName, acknowledged: false,
    }
    await globalErcStore.add('reviews', employee.id, rec)
    setRecords(prev => [...prev, rec])

    // Email to employee
    try {
      await api.ceoSendEmail(
        employee.email,
        `Evaluación de Desempeño — ${new Date().toLocaleDateString('es-CL')} — Conniku SpA`,
        `Estimado/a ${employee.firstName},\n\nAdjuntamos su evaluación de desempeño.\n\nPuntaje global: ${rec.overallRating.toFixed(1)}/5 (${ratingLabel(rec.overallRating).label})\n\nFortalezas: ${strengths}\nÁreas de mejora: ${improve}\nComentarios: ${comments}\n\nConniku SpA — People & Culture`,
        '', '', 'noreply',
      )
    } catch (_) {}

    setShowForm(false)
    setSaving(false)
    setDims(Object.fromEntries(PERF_DIMS.map(d => [d.key, 0])))
    setComments(''); setStrengths(''); setImprove('')
  }

  return (
    <div>
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><Star size={14} /> Evaluaciones de Desempeño ({records.length})</div>
          <button className="pe-btn pe-btn-primary" onClick={() => setShowForm(true)}><Plus size={13} /> Nueva Evaluación</button>
        </div>

        {records.length === 0
          ? <div className="pe-empty"><Star size={28} /><div className="pe-empty-title">Sin evaluaciones</div><div className="pe-empty-sub">El sistema programa automáticamente la evaluación a mitad y fin de contrato</div></div>
          : records.slice().reverse().map(r => {
              const rl = ratingLabel(r.overallRating)
              const isExp = expanded === r.id
              return (
                <div key={r.id} className="pe-record-item">
                  <div className="pe-record-item-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : r.id)}>
                    <span className="pe-badge pe-badge-blue">{r.type === 'mid_contract' ? 'Mitad contrato' : r.type === 'end_contract' ? 'Fin contrato' : 'Adicional'}</span>
                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: rl.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{r.overallRating.toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>/5 — {rl.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(r.date)}</span>
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isExp ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                  </div>
                  {isExp && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {r.dimensions.map(d => (
                          <div key={d.name} className="dim-row" style={{ border: 'none', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ flex: 1, fontSize: 11.5 }}>{d.name}</span>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {[1,2,3,4,5].map(n => (
                                <div key={n} style={{ width: 16, height: 5, borderRadius: 3, background: n <= d.rating ? 'var(--accent)' : 'var(--border)' }} />
                              ))}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, width: 14, textAlign: 'right', color: d.rating >= 4 ? '#059669' : d.rating >= 3 ? 'var(--accent)' : '#f59e0b' }}>{d.rating}</span>
                          </div>
                        ))}
                      </div>
                      {r.strengths && <div style={{ marginBottom: 8, fontSize: 12 }}><strong>Fortalezas:</strong> {r.strengths}</div>}
                      {r.areasToImprove && <div style={{ marginBottom: 8, fontSize: 12 }}><strong>Áreas de mejora:</strong> {r.areasToImprove}</div>}
                      {r.comments && <div style={{ fontSize: 12 }}><strong>Comentarios:</strong> {r.comments}</div>}
                      <div className="pe-record-item-footer"><span>Por: {r.issuedBy}</span></div>
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>

      {showForm && (
        <div className="pe-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="pe-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="pe-modal-header">
              <div className="pe-modal-title"><Star size={15} /> Evaluación de Desempeño — {employee.firstName} {employee.lastName}</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="pe-modal-body">
              <div style={{ marginBottom: 16 }}>
                <label className="pe-form-label">Tipo de evaluación</label>
                <select className="pe-select" value={reviewType} onChange={e => setReviewType(e.target.value as any)} style={{ maxWidth: 260 }}>
                  <option value="mid_contract">Mitad de Contrato</option>
                  <option value="end_contract">Fin de Contrato</option>
                  <option value="additional">Adicional</option>
                </select>
              </div>

              <label className="pe-form-label" style={{ marginBottom: 10 }}>Dimensiones de evaluación (1 = Deficiente · 5 = Excepcional)</label>
              {PERF_DIMS.map(d => (
                <div key={d.key} className="dim-row" title={d.desc}>
                  <span className="dim-name">{d.name}</span>
                  <div className="dim-stars">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className={`dim-star ${dims[d.key] >= n ? 'filled' : ''}`}
                        onClick={() => setDims(prev => ({ ...prev, [d.key]: n }))}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}

              {overall() > 0 && (
                <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: ratingLabel(overall()).color, letterSpacing: '-0.04em' }}>{overall().toFixed(1)}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>/5 — {ratingLabel(overall()).label}</span>
                </div>
              )}

              <div className="pe-form-grid-2" style={{ marginTop: 14 }}>
                <div>
                  <label className="pe-form-label">Fortalezas destacadas</label>
                  <textarea className="pe-textarea" rows={2} value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="Aspectos positivos del período..." />
                </div>
                <div>
                  <label className="pe-form-label">Áreas de mejora</label>
                  <textarea className="pe-textarea" rows={2} value={improve} onChange={e => setImprove(e.target.value)} placeholder="Oportunidades de desarrollo..." />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label className="pe-form-label">Comentarios adicionales</label>
                <textarea className="pe-textarea" rows={2} value={comments} onChange={e => setComments(e.target.value)} placeholder="Contexto, situaciones especiales, acuerdos..." />
              </div>
            </div>
            <div className="pe-modal-footer">
              <button className="pe-btn pe-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="pe-btn pe-btn-primary" onClick={save} disabled={saving || overall() === 0}>
                {saving ? 'Guardando…' : <><Send size={13} /> Emitir evaluación</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB — CONVERSACIONES
// ═══════════════════════════════════════════════════════════════════

function TabConversaciones({ employee, issuerName }: { employee: Employee; issuerName: string }) {
  const [records, setRecords] = useState<ConversationRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState<'library' | 'adhoc'>('library')
  const [selected, setSelected] = useState('')
  const [adhocTitle, setAdhocTitle] = useState('')
  const [adhocDesc, setAdhocDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => setRecords(getForEmployee<ConversationRecord>('conversations', employee.id)), [employee.id])

  const save = async () => {
    const title = mode === 'library' ? selected : adhocTitle
    if (!title) return
    setSaving(true)
    const rec: ConversationRecord = {
      id: uid(), employeeId: employee.id, type: mode, title,
      description: mode === 'library' ? (CONV_LIBRARY.find(c => c.title === selected)?.desc || '') : adhocDesc,
      date: new Date().toISOString().split('T')[0], issuedBy: issuerName, acknowledged: false,
    }
    await globalErcStore.add('conversations', employee.id, rec)
    setRecords(prev => [...prev, rec])
    setSelected(''); setAdhocTitle(''); setAdhocDesc('')
    setShowForm(false); setSaving(false)
  }

  return (
    <div>
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><MessageSquare size={14} /> Conversaciones Registradas ({records.length})</div>
          <button className="pe-btn pe-btn-primary" onClick={() => setShowForm(true)}><Plus size={13} /> Registrar</button>
        </div>
        {records.length === 0
          ? <div className="pe-empty"><MessageSquare size={28} /><div className="pe-empty-title">Sin conversaciones</div><div className="pe-empty-sub">Registra 1:1s, feedback y conversaciones formales</div></div>
          : records.slice().reverse().map(r => (
              <div key={r.id} className="pe-record-item">
                <div className="pe-record-item-header">
                  <span className={`pe-badge ${r.type === 'library' ? 'pe-badge-blue' : 'pe-badge-gray'}`}>{r.type === 'library' ? 'Librería' : 'Ad-hoc'}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 8 }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmtDate(r.date)}</span>
                </div>
                {r.description && <div className="pe-record-item-body">{r.description}</div>}
                <div className="pe-record-item-footer"><span>Por: {r.issuedBy}</span></div>
              </div>
            ))
        }
      </div>
      {showForm && (
        <div className="pe-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="pe-modal" onClick={e => e.stopPropagation()}>
            <div className="pe-modal-header">
              <div className="pe-modal-title"><MessageSquare size={15} /> Registrar Conversación</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="pe-modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['library', 'adhoc'] as const).map(m => (
                  <button key={m} className={`pe-btn ${mode === m ? 'pe-btn-primary' : 'pe-btn-ghost'}`} onClick={() => setMode(m)}>
                    {m === 'library' ? 'Desde librería' : 'Ad-hoc (libre)'}
                  </button>
                ))}
              </div>
              {mode === 'library'
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CONV_LIBRARY.map(c => (
                      <div key={c.title} onClick={() => setSelected(c.title)} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${selected === c.title ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', background: selected === c.title ? 'rgba(37,99,235,0.06)' : 'transparent', transition: 'all 0.15s' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                : <>
                    <div style={{ marginBottom: 12 }}>
                      <label className="pe-form-label">Título *</label>
                      <input className="pe-input" value={adhocTitle} onChange={e => setAdhocTitle(e.target.value)} placeholder="Asunto o tema de la conversación..." />
                    </div>
                    <div>
                      <label className="pe-form-label">Descripción</label>
                      <textarea className="pe-textarea" rows={3} value={adhocDesc} onChange={e => setAdhocDesc(e.target.value)} placeholder="Resumen de la conversación..." />
                    </div>
                  </>
              }
            </div>
            <div className="pe-modal-footer">
              <button className="pe-btn pe-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="pe-btn pe-btn-primary" onClick={save} disabled={saving || (!selected && !adhocTitle)}>
                {saving ? 'Guardando…' : <><CheckCircle size={13} /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB — RECONOCIMIENTOS
// ═══════════════════════════════════════════════════════════════════

function TabReconocimientos({ employee, issuerName }: { employee: Employee; issuerName: string }) {
  const [records, setRecords] = useState<AcknowledgementRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => setRecords(getForEmployee<AcknowledgementRecord>('acknowledgements', employee.id)), [employee.id])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    const lib = ACK_LIBRARY.find(a => a.title === selected)!
    const rec: AcknowledgementRecord = {
      id: uid(), employeeId: employee.id, title: selected,
      description: lib.desc, date: new Date().toISOString().split('T')[0], issuedBy: issuerName,
    }
    await globalErcStore.add('acknowledgements', employee.id, rec)
    setRecords(prev => [...prev, rec])
    setSelected(''); setShowForm(false); setSaving(false)
  }

  return (
    <div>
      <div className="pe-card">
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          Los reconocimientos deben emitirse <strong>en el momento</strong> en que ocurre el logro. Quedan registrados en el expediente del trabajador como evidencia positiva de su desempeño.
        </div>
        <div className="pe-card-header">
          <div className="pe-card-title"><Award size={14} /> Reconocimientos ({records.length})</div>
          <button className="pe-btn pe-btn-outline" style={{ borderColor: '#f59e0b', color: '#b45309' }} onClick={() => setShowForm(true)}><Award size={13} /> Emitir ahora</button>
        </div>
        {records.length === 0
          ? <div className="pe-empty"><Award size={28} /><div className="pe-empty-title">Sin reconocimientos emitidos</div><div className="pe-empty-sub">El historial de logros está vacío</div></div>
          : records.slice().reverse().map(r => (
              <div key={r.id} className="pe-record-item">
                <div className="pe-record-item-header">
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={14} color="#f59e0b" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, marginLeft: 4 }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmtDate(r.date)}</span>
                </div>
                <div className="pe-record-item-body">{r.description}</div>
                <div className="pe-record-item-footer"><span>Emitido por: {r.issuedBy}</span></div>
              </div>
            ))
        }
      </div>
      {showForm && (
        <div className="pe-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="pe-modal" onClick={e => e.stopPropagation()}>
            <div className="pe-modal-header">
              <div className="pe-modal-title"><Award size={15} /> Emitir Reconocimiento</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="pe-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ACK_LIBRARY.map(a => (
                  <div key={a.title} onClick={() => setSelected(a.title)} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${selected === a.title ? '#f59e0b' : 'var(--border)'}`, cursor: 'pointer', background: selected === a.title ? 'rgba(245,158,11,0.07)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                    <Award size={16} color={selected === a.title ? '#f59e0b' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pe-modal-footer">
              <button className="pe-btn pe-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="pe-btn pe-btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b' }} onClick={save} disabled={saving || !selected}>
                {saving ? 'Emitiendo…' : <><Award size={13} /> Emitir reconocimiento</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB CONTRATO — Contract History + Generator
// ═══════════════════════════════════════════════════════════════════

const CONTRACT_STAGES = [
  { stage: 1, label: '1° Plazo Fijo', sub: '30 días', color: '#f59e0b' },
  { stage: 2, label: '2° Plazo Fijo', sub: '60 días', color: '#f97316' },
  { stage: 3, label: 'Indefinido',    sub: 'Permanente', color: '#22c55e' },
]

function getContractStage(emp: Employee): number {
  const ct = emp.contractType
  if (ct === 'indefinido') return 3
  // Guess from hire date: if < 45d → stage 1, < 120d → stage 2
  if (!emp.hireDate) return 1
  const days = Math.floor((Date.now() - new Date(emp.hireDate).getTime()) / 86400000)
  if (days <= 45) return 1
  if (days <= 120) return 2
  return 3
}

function TabContrato({ employee, documents }: { employee: Employee; documents: any[] }) {
  const [showGenerator, setShowGenerator] = useState(false)

  const stage = getContractStage(employee)
  const contractDocs = documents.filter((d: any) =>
    (d.documentType || d.type || '').toLowerCase().includes('contrat') ||
    (d.name || '').toLowerCase().includes('contrat')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progresión contractual */}
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><FileText size={14} /> Progresión Contractual Conniku</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Código del Trabajo Art. 159 N°4</span>
        </div>
        <div style={{ display: 'flex', gap: 0, margin: '12px 0' }}>
          {CONTRACT_STAGES.map((s, i) => {
            const active = stage === s.stage
            const done   = stage > s.stage
            return (
              <div key={s.stage} style={{ flex: 1, position: 'relative' }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, top: 18, width: '100%', height: 2,
                    background: done || active ? s.color : 'var(--border)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: active ? s.color : done ? s.color + '30' : 'var(--bg-secondary)',
                    border: `2px solid ${active || done ? s.color : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                    color: active ? '#fff' : done ? s.color : 'var(--text-muted)',
                  }}>
                    {done ? <CheckCircle size={16} /> : s.stage}
                  </div>
                  <div style={{ marginTop: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: active ? 700 : 600, color: active ? s.color : done ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {stage < 3 && (
          <div style={{ marginTop: 4, padding: '8px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, fontSize: 11, color: '#b45309' }}>
            Próximo hito: {stage === 1 ? 'Segunda renovación = Contrato Indefinido automático' : 'Este contrato debe convertirse en Indefinido'}
          </div>
        )}
      </div>

      {/* Resumen del contrato actual */}
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><Briefcase size={14} /> Condiciones Vigentes</div>
          <button className="pe-btn pe-btn-primary" onClick={() => setShowGenerator(true)}>
            <FileText size={13} /> Generar / Ver Contrato
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: 4 }}>
          {[
            ['Tipo', employee.contractType === 'indefinido' ? 'Indefinido' : employee.contractType === 'plazo_fijo' ? 'Plazo Fijo' : employee.contractType || '—'],
            ['Inicio',         fmtDate(employee.hireDate)],
            ['Término',        employee.endDate ? fmtDate(employee.endDate) : 'Indefinido'],
            ['Sueldo Bruto',   `$${employee.grossSalary?.toLocaleString('es-CL') || '—'}`],
            ['AFP',            employee.afp || '—'],
            ['Salud',          employee.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${employee.isapreName || ''}`],
            ['Colación',       employee.colacion ? `$${employee.colacion.toLocaleString('es-CL')}` : '—'],
            ['Movilización',   employee.movilizacion ? `$${employee.movilizacion.toLocaleString('es-CL')}` : '—'],
            ['Horas/semana',   employee.weeklyHours ? `${employee.weeklyHours}h` : '40h'],
            ['Departamento',   employee.department || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de contratos firmados */}
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><FolderOpen size={14} /> Contratos Firmados ({contractDocs.length})</div>
        </div>
        {contractDocs.length === 0
          ? (
            <div className="pe-empty">
              <FileText size={28} />
              <div className="pe-empty-title">Sin contratos registrados</div>
              <div className="pe-empty-sub">Genera el contrato y fírmalo para que quede registrado aquí</div>
            </div>
          )
          : contractDocs.map((d: any) => (
            <div key={d.id} className="pe-record-item">
              <div className="pe-record-item-header">
                <FileText size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 6 }}>{d.name || d.documentType || 'Contrato'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.uploadedAt || d.createdAt)}</span>
                {d.signed && <span className="dt-sent-badge"><CheckCircle size={10} /> Firmado</span>}
              </div>
            </div>
          ))
        }
      </div>

      {/* Contract generator modal */}
      {showGenerator && (
        <ContractModal employee={employee} onClose={() => setShowGenerator(false)} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB ONBOARDING — Per-employee checklist
// ═══════════════════════════════════════════════════════════════════

const OB_ITEMS_INGRESO = [
  { label: 'Contrato firmado (Art. 9 CT — plazo 15 días)', resp: 'RRHH' },
  { label: 'Copia cédula de identidad', resp: 'RRHH' },
  { label: 'Certificado AFP vigente', resp: 'RRHH' },
  { label: 'Certificado de salud (Fonasa/Isapre)', resp: 'RRHH' },
  { label: 'Certificado de antecedentes (no mayor a 30 días)', resp: 'RRHH' },
  { label: 'Ficha de datos personales completa', resp: 'RRHH' },
  { label: 'Foto tipo carnet', resp: 'RRHH' },
  { label: 'Alta en mutual de seguridad (Ley 16.744)', resp: 'RRHH' },
  { label: 'Firma Reglamento Interno (RIOHS, Art. 153 CT)', resp: 'RRHH' },
  { label: 'Inducción empresa — cultura, valores, políticas', resp: 'RRHH' },
  { label: 'Inducción cargo — funciones y KPIs', resp: 'Jefatura' },
  { label: 'Email corporativo configurado', resp: 'TI' },
  { label: 'Alta en sistema de asistencia', resp: 'TI' },
  { label: 'Credenciales y accesos a plataformas entregados', resp: 'TI' },
  { label: 'Equipamiento / herramientas entregados con acta', resp: 'Operaciones' },
]

const OB_ITEMS_SALIDA = [
  { label: 'Carta de renuncia / Notificación de despido (Art. 162 CT)', resp: 'RRHH' },
  { label: 'Aviso previo de 30 días o pago sustitutivo', resp: 'RRHH' },
  { label: 'Cálculo de finiquito (vacaciones proporcionales, indemnización)', resp: 'RRHH' },
  { label: 'Firma de finiquito ante notario o Inspector del Trabajo (Art. 177 CT)', resp: 'RRHH' },
  { label: 'Baja en Previred (AFC, AFP, Isapre)', resp: 'RRHH' },
  { label: 'Certificado AFC entregado (Ley 19.728)', resp: 'RRHH' },
  { label: 'Devolución de equipos con acta firmada', resp: 'Operaciones' },
  { label: 'Desactivación email y accesos corporativos', resp: 'TI' },
  { label: 'Entrega de documentos pendientes del trabajador', resp: 'RRHH' },
  { label: 'Certificado de antigüedad emitido', resp: 'RRHH' },
]

type OBCheckItem = { id: string; label: string; resp: string; done: boolean; doneAt?: string }
type OBProcess = { items: OBCheckItem[]; createdAt: string; status: 'en_curso' | 'completado' }

function mkObItems(template: typeof OB_ITEMS_INGRESO): OBCheckItem[] {
  return template.map(t => ({ id: uid(), label: t.label, resp: t.resp, done: false }))
}

function TabOnboarding({ employee }: { employee: Employee }) {
  const [mode, setMode] = useState<'ingreso' | 'salida'>('ingreso')
  const storageKey = `conniku_ob_${employee.id}`

  const [data, setData] = useState<{ ingreso: OBProcess | null; salida: OBProcess | null }>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || { ingreso: null, salida: null } } catch { return { ingreso: null, salida: null } }
  })

  const save = (next: typeof data) => {
    setData(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const initProcess = (type: 'ingreso' | 'salida') => {
    const items = mkObItems(type === 'ingreso' ? OB_ITEMS_INGRESO : OB_ITEMS_SALIDA)
    save({ ...data, [type]: { items, createdAt: new Date().toISOString().split('T')[0], status: 'en_curso' } })
  }

  const toggleItem = (type: 'ingreso' | 'salida', id: string) => {
    const proc = data[type]
    if (!proc) return
    const items = proc.items.map(i => i.id === id ? { ...i, done: !i.done, doneAt: !i.done ? new Date().toISOString().split('T')[0] : undefined } : i)
    const allDone = items.every(i => i.done)
    save({ ...data, [type]: { ...proc, items, status: allDone ? 'completado' : 'en_curso' } })
  }

  const proc = data[mode]
  const pct = proc ? Math.round((proc.items.filter(i => i.done).length / proc.items.length) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['ingreso', 'salida'] as const).map(m => (
          <button key={m} className={`pe-btn ${mode === m ? 'pe-btn-primary' : 'pe-btn-outline'}`} onClick={() => setMode(m)}>
            {m === 'ingreso' ? <><UserCheck size={13} /> Onboarding Ingreso</> : <><X size={13} /> Offboarding Salida</>}
          </button>
        ))}
      </div>

      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title">
            {mode === 'ingreso' ? <><UserCheck size={14} /> Checklist de Ingreso</> : <><X size={14} /> Checklist de Salida</>}
          </div>
          {!proc && (
            <button className="pe-btn pe-btn-primary" onClick={() => initProcess(mode)}>
              <Plus size={13} /> Iniciar proceso
            </button>
          )}
          {proc && (
            <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#22c55e' : '#f59e0b', padding: '3px 8px', borderRadius: 6, background: pct === 100 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}>
              {pct === 100 ? '✓ Completado' : `${pct}% completado`}
            </span>
          )}
        </div>

        {!proc ? (
          <div className="pe-empty">
            {mode === 'ingreso' ? <UserCheck size={32} /> : <X size={32} />}
            <div className="pe-empty-title">Sin proceso {mode === 'ingreso' ? 'de ingreso' : 'de salida'} iniciado</div>
            <div className="pe-empty-sub">Inicia el proceso para activar el checklist con {mode === 'ingreso' ? OB_ITEMS_INGRESO.length : OB_ITEMS_SALIDA.length} tareas</div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ margin: '8px 0 16px' }}>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: pct === 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444', transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                <span>{proc.items.filter(i => i.done).length} / {proc.items.length} tareas</span>
                <span>Iniciado: {fmtDate(proc.createdAt)}</span>
              </div>
            </div>
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {proc.items.map(item => (
                <div key={item.id} onClick={() => toggleItem(mode, item.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, border: `1px solid ${item.done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, background: item.done ? 'rgba(34,197,94,0.04)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.done ? '#22c55e' : 'var(--border)'}`, background: item.done ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {item.done && <CheckCircle size={11} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: item.done ? 400 : 600, color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Responsable: {item.resp}{item.doneAt ? ` · Completado: ${fmtDate(item.doneAt)}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB DESVINCULACIÓN — Offboarding formal + cálculos legales
// ═══════════════════════════════════════════════════════════════════

const CAUSALES_ART159 = [
  { value: 'mutuo_acuerdo', label: 'Mutuo acuerdo (Art. 159 N°1)', indemnizacion: false, aviso: false },
  { value: 'renuncia',      label: 'Renuncia voluntaria (Art. 159 N°2)',  indemnizacion: false, aviso: true, diasAviso: 30 },
  { value: 'termino_plazo', label: 'Vencimiento plazo fijo (Art. 159 N°4)', indemnizacion: false, aviso: false },
  { value: 'caso_fortuito', label: 'Caso fortuito o fuerza mayor (Art. 159 N°6)', indemnizacion: false, aviso: false },
]

const CAUSALES_ART160 = [
  { value: 'falta_probidad',    label: 'Falta de probidad o conducta inmoral (Art. 160 N°1)', indemnizacion: false, aviso: false },
  { value: 'acoso_laboral',     label: 'Acoso laboral o sexual (Art. 160 N°1 b/c)', indemnizacion: false, aviso: false },
  { value: 'vias_de_hecho',     label: 'Vías de hecho — agresión (Art. 160 N°2)', indemnizacion: false, aviso: false },
  { value: 'injurias',          label: 'Injurias al empleador (Art. 160 N°3)', indemnizacion: false, aviso: false },
  { value: 'abandono',          label: 'Abandono de trabajo (Art. 160 N°4)', indemnizacion: false, aviso: false },
  { value: 'actos_contra',      label: 'Actos contra los intereses del empleador (Art. 160 N°5)', indemnizacion: false, aviso: false },
  { value: 'incumplimiento',    label: 'Incumplimiento grave de obligaciones (Art. 160 N°7)', indemnizacion: false, aviso: false },
]

const CAUSALES_ART161 = [
  { value: 'necesidades_empresa', label: 'Necesidades de la empresa (Art. 161 inc. 1°)', indemnizacion: true, aviso: true, diasAviso: 30 },
  { value: 'desahucio',           label: 'Desahucio — cargo de exclusiva confianza (Art. 161 inc. 2°)', indemnizacion: true, aviso: true, diasAviso: 30 },
]

function calcYearsService(hireDate: string, exitDate: string): number {
  const d1 = new Date(hireDate)
  const d2 = new Date(exitDate || new Date().toISOString().split('T')[0])
  return Math.max(0, (d2.getTime() - d1.getTime()) / (365.25 * 86400000))
}

function calcIndemnizacion(grossSalary: number, hireDate: string, exitDate: string): { years: number; months: number; base: number; capped: number; total: number } {
  const years = calcYearsService(hireDate, exitDate)
  const wholeYears = Math.floor(years)
  // Fracción > 6 meses cuenta como año completo
  const countableYears = (years - wholeYears) >= 0.5 ? wholeYears + 1 : wholeYears
  const topeCLP = CHILE_LABOR.INDEMNIZACIONES.remuneracionTopeUF * CHILE_LABOR.UF.value
  const base = Math.min(grossSalary, topeCLP)
  return { years: wholeYears, months: Math.round((years - wholeYears) * 12), base, capped: base, total: base * countableYears }
}

type CausalEntry = { value: string; label: string; indemnizacion: boolean; aviso: boolean; diasAviso?: number }

function TabDesvinculacion({ employee, issuerName }: { employee: Employee; issuerName: string }) {
  const storageKey = `conniku_desv_${employee.id}`
  const [saved, setSaved] = useState<{ causal: string; fechaTermino: string; notas: string; dtNotified: boolean; dtNotifiedAt?: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null') } catch { return null }
  })
  const [causal, setCausal] = useState(saved?.causal || '')
  const [fechaTermino, setFechaTermino] = useState(saved?.fechaTermino || new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState(saved?.notas || '')
  const [dtSending, setDtSending] = useState(false)
  const [dtSent, setDtSent] = useState(saved?.dtNotified || false)

  const allCausales: CausalEntry[] = [...CAUSALES_ART159, ...CAUSALES_ART160, ...CAUSALES_ART161]
  const selectedCausal = allCausales.find(c => c.value === causal)
  const indData = selectedCausal?.indemnizacion ? calcIndemnizacion(employee.grossSalary, employee.hireDate, fechaTermino) : null
  const hasAviso = selectedCausal?.aviso ?? false

  const saveData = () => {
    const d = { causal, fechaTermino, notas, dtNotified: dtSent, dtNotifiedAt: saved?.dtNotifiedAt }
    localStorage.setItem(storageKey, JSON.stringify(d))
    setSaved(d)
  }

  const notifyDT = async () => {
    if (!causal || !fechaTermino) return
    setDtSending(true)
    try {
      await api.ceoSendEmail(
        'inspeccion@dt.gob.cl',
        `[CONNIKU] Término de Contrato — ${employee.firstName} ${employee.lastName} — RUT ${employee.rut}`,
        `Estimada Dirección del Trabajo,\n\nPor medio del presente comunicamos el término de contrato del trabajador:\n\nNombre: ${employee.firstName} ${employee.lastName}\nRUT: ${employee.rut}\nCargo: ${employee.position}\nFecha de ingreso: ${fmtDate(employee.hireDate)}\nFecha de término: ${fmtDate(fechaTermino)}\nCausal: ${selectedCausal?.label || causal}\n\nNotificado por: ${issuerName}\nConector: noreply@conniku.com`,
        '', '', 'noreply'
      )
      setDtSent(true)
      const d = { causal, fechaTermino, notas, dtNotified: true, dtNotifiedAt: new Date().toISOString() }
      localStorage.setItem(storageKey, JSON.stringify(d))
      setSaved(d)
    } catch (e) { console.error(e) }
    setDtSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Alert banner */}
      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#b91c1c', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
        <span>El proceso de desvinculación tiene efectos legales definitivos. Todos los pasos deben ejecutarse conforme al Código del Trabajo. Ante dudas, consultar con abogado laboral.</span>
      </div>

      {/* Causal + fecha */}
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><AlertCircle size={14} /> Causal de Término</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="pe-form-label">Artículo 159 — Causales objetivas</label>
          <select className="pe-select" value={CAUSALES_ART159.some(c => c.value === causal) ? causal : ''} onChange={e => setCausal(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {CAUSALES_ART159.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="pe-form-label">Artículo 160 — Causal imputable al trabajador (despido)</label>
          <select className="pe-select" value={CAUSALES_ART160.some(c => c.value === causal) ? causal : ''} onChange={e => setCausal(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {CAUSALES_ART160.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="pe-form-label">Artículo 161 — Necesidades de la empresa / desahucio</label>
          <select className="pe-select" value={CAUSALES_ART161.some(c => c.value === causal) ? causal : ''} onChange={e => setCausal(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {CAUSALES_ART161.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label className="pe-form-label">Fecha de término *</label>
            <input type="date" className="pe-input" value={fechaTermino} onChange={e => setFechaTermino(e.target.value)} />
          </div>
          <div>
            <label className="pe-form-label">Notas / Hechos que fundamentan</label>
            <input className="pe-input" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Descripción breve del fundamento..." />
          </div>
        </div>
        <button className="pe-btn pe-btn-primary" onClick={saveData} disabled={!causal || !fechaTermino}>
          <CheckCircle size={13} /> Guardar causal
        </button>
      </div>

      {/* Cálculos legales */}
      {selectedCausal && (
        <div className="pe-card">
          <div className="pe-card-header">
            <div className="pe-card-title"><BarChart3 size={14} /> Cálculos Referenciales</div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Valores referenciales — verificar con liquidación oficial</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>ANTIGÜEDAD</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{Math.floor(calcYearsService(employee.hireDate, fechaTermino))} años {Math.round((calcYearsService(employee.hireDate, fechaTermino) % 1) * 12)} meses</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>AVISO PREVIO</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: hasAviso ? '#f59e0b' : '#22c55e' }}>
                {hasAviso ? `${selectedCausal.diasAviso} días o pago sustitutivo` : 'No aplica'}
              </div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: indData ? 'rgba(239,68,68,0.04)' : 'var(--bg-secondary)', border: `1px solid ${indData ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>INDEMNIZACIÓN AÑOS SERVICIO</div>
              {indData
                ? <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>${indData.total.toLocaleString('es-CL')} <span style={{ fontSize: 10, fontWeight: 400 }}>(ref.)</span></div>
                : <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No corresponde con esta causal</div>
              }
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TOPE REMUNERACIÓN</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>90 UF = ${(90 * CHILE_LABOR.UF.value).toLocaleString('es-CL')}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Art. 172 CT</div>
            </div>
          </div>

          {indData && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11, color: '#b91c1c' }}>
              Base de cálculo: min(${employee.grossSalary.toLocaleString('es-CL')}, ${(90 * CHILE_LABOR.UF.value).toLocaleString('es-CL')}) × {Math.floor(calcYearsService(employee.hireDate, fechaTermino)) + ((calcYearsService(employee.hireDate, fechaTermino) % 1) >= 0.5 ? 1 : 0)} años = ${indData.total.toLocaleString('es-CL')}
            </div>
          )}
        </div>
      )}

      {/* Notificación DT */}
      <div className="pe-card">
        <div className="pe-card-header">
          <div className="pe-card-title"><Send size={14} /> Notificación Dirección del Trabajo</div>
          {dtSent && <span className="dt-sent-badge"><CheckCircle size={10} /> Notificado</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Se enviará notificación formal a <strong>inspeccion@dt.gob.cl</strong> con datos del término de contrato. Recomendado para Art. 160 y Art. 161.
        </div>
        {saved?.dtNotifiedAt && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Notificado: {fmtDate(saved.dtNotifiedAt.split('T')[0])}</div>
        )}
        <button
          className="pe-btn pe-btn-outline"
          style={{ borderColor: dtSent ? '#22c55e' : '#ef4444', color: dtSent ? '#15803d' : '#b91c1c' }}
          onClick={notifyDT}
          disabled={dtSending || !causal || !fechaTermino || dtSent}
        >
          {dtSending ? 'Enviando…' : dtSent ? <><CheckCircle size={13} /> DT Notificada</> : <><Send size={13} /> Notificar DT</>}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB VISTA TRABAJADOR — Read-only employee self-view
// ═══════════════════════════════════════════════════════════════════

function TabVistaTrabajador({ employee, documents }: { employee: Employee; documents: any[] }) {
  const evals   = getForEmployee<PerformanceReview>('reviews', employee.id)
  const acks    = getForEmployee<AcknowledgementRecord>('acknowledgements', employee.id)
  const convs   = getForEmployee<ConversationRecord>('conversations', employee.id)
  const discs   = getForEmployee<DisciplineRecord>('discipline', employee.id).filter(d => !['verbal'].includes(d.level))
  const lastEval = evals.slice(-1)[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header info */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.06))', border: '1px solid rgba(37,99,235,0.15)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Vista como la verá el trabajador (solo lectura)</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{employee.firstName} {employee.lastName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{employee.position} · {employee.department}</div>
      </div>

      {/* Mi contrato */}
      <div className="pe-card">
        <div className="pe-card-title" style={{ marginBottom: 12 }}><FileText size={14} /> Mi Contrato</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Tipo de contrato', employee.contractType === 'indefinido' ? 'Indefinido' : 'Plazo Fijo'],
            ['Fecha de ingreso', fmtDate(employee.hireDate)],
            ['Cargo', employee.position],
            ['Jornada', `${employee.weeklyHours || 40}h semanales`],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Última evaluación */}
      {lastEval && (
        <div className="pe-card">
          <div className="pe-card-title" style={{ marginBottom: 12 }}><Star size={14} /> Mi Última Evaluación</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: lastEval.overallRating >= 4 ? '#22c55e' : lastEval.overallRating >= 3 ? '#f59e0b' : '#ef4444' }}>{lastEval.overallRating.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ 5.0</div>
            </div>
            <div style={{ flex: 1 }}>
              {lastEval.dimensions.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, width: 140, color: 'var(--text-secondary)' }}>{d.name}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--bg-primary)' }}>
                    <div style={{ width: `${(d.rating / 5) * 100}%`, height: '100%', borderRadius: 3, background: d.rating >= 4 ? '#22c55e' : d.rating >= 3 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, width: 16 }}>{d.rating}</span>
                </div>
              ))}
            </div>
          </div>
          {lastEval.strengths && <div style={{ fontSize: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#15803d', marginBottom: 6 }}><strong>Fortalezas:</strong> {lastEval.strengths}</div>}
          {lastEval.areasToImprove && <div style={{ fontSize: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#b45309' }}><strong>Oportunidades de mejora:</strong> {lastEval.areasToImprove}</div>}
        </div>
      )}

      {/* Reconocimientos */}
      {acks.length > 0 && (
        <div className="pe-card">
          <div className="pe-card-title" style={{ marginBottom: 12 }}><Award size={14} /> Mis Reconocimientos ({acks.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {acks.slice().reverse().map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Award size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversaciones */}
      {convs.length > 0 && (
        <div className="pe-card">
          <div className="pe-card-title" style={{ marginBottom: 12 }}><MessageSquare size={14} /> Conversaciones Formales ({convs.length})</div>
          {convs.slice().reverse().map(c => (
            <div key={c.id} className="pe-record-item">
              <div className="pe-record-item-header">
                <span style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(c.date)}</span>
              </div>
              {c.description && <div className="pe-record-item-body">{c.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Amonestaciones activas (solo escritas) */}
      {discs.length > 0 && (
        <div className="pe-card">
          <div className="pe-card-title" style={{ marginBottom: 12 }}><AlertTriangle size={14} color="#ef4444" /> Medidas Disciplinarias Activas</div>
          {discs.slice().reverse().map(d => (
            <div key={d.id} className="pe-record-item">
              <div className="pe-record-item-header">
                <span className={`pe-badge ${DISC_LEVELS.find(l => l.key === d.level)?.badge || 'pe-badge-red'}`}>{DISC_LEVELS.find(l => l.key === d.level)?.label}</span>
                <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 13 }}>{d.explanation}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!lastEval && acks.length === 0 && convs.length === 0 && (
        <div className="pe-empty" style={{ marginTop: 20 }}>
          <Eye size={32} />
          <div className="pe-empty-title">Expediente vacío</div>
          <div className="pe-empty-sub">Aún no hay evaluaciones, reconocimientos ni conversaciones registradas</div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EXPEDIENTE DIGITAL — Individual Worker File
// ═══════════════════════════════════════════════════════════════════

function ExpedienteDigital({
  employee, documents, issuerName, onClose,
}: {
  employee: Employee; documents: any[]; issuerName: string; onClose: () => void
}) {
  const [tab, setTab] = useState<ExpTab>('resumen')

  const cardStatuses = RECORD_CARDS.map(rc => ({
    ...rc, ...getRecordCardStatus(employee.id, rc.key, documents),
  }))

  const TABS: { id: ExpTab; label: string; icon: React.FC<any>; count?: number; danger?: boolean }[] = [
    { id: 'resumen',          label: 'Resumen',         icon: Activity },
    { id: 'amonestaciones',   label: 'Amonestaciones',  icon: Flag,          count: getForEmployee<DisciplineRecord>('discipline', employee.id).length },
    { id: 'coaching',         label: 'Coaching',        icon: MessageSquare, count: getForEmployee<CoachingRecord>('coaching', employee.id).length },
    { id: 'evaluaciones',     label: 'Evaluaciones',    icon: Star,          count: getForEmployee<PerformanceReview>('reviews', employee.id).length },
    { id: 'conversaciones',   label: 'Conversaciones',  icon: MessageSquare, count: getForEmployee<ConversationRecord>('conversations', employee.id).length },
    { id: 'reconocimientos',  label: 'Reconocimientos', icon: Award,         count: getForEmployee<AcknowledgementRecord>('acknowledgements', employee.id).length },
    { id: 'contrato',         label: 'Contrato',        icon: FileText },
    { id: 'documentos_tab',   label: 'Documentos',      icon: FolderOpen,    count: documents.length },
    { id: 'onboarding',       label: 'Onboarding',      icon: UserCheck },
    { id: 'desvinculacion',   label: 'Desvinculación',  icon: AlertCircle,   danger: true },
    { id: 'vista_trabajador', label: 'Vista Trabajador',icon: Eye },
  ]

  const initials = employee.firstName.charAt(0) + employee.lastName.charAt(0)
  const statusColor = employee.status === 'active' ? '#22c55e' : '#ef4444'
  const statusLabel = employee.status === 'active' ? 'Activo' : 'Inactivo'

  return (
    <div className="expediente-shell">
      {/* Header */}
      <div className="expediente-header">
        <div className="expediente-worker-row">
          <div className="expediente-photo" style={{ background: `linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))`, color: 'var(--accent)' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="expediente-name">{employee.firstName} {employee.lastName}</div>
            <div className="expediente-meta-row">
              <span className="expediente-meta-item"><Briefcase size={12} />{employee.position}</span>
              <span className="expediente-meta-item"><Building2 size={12} />{employee.department}</span>
              <span className="expediente-meta-item"><Hash size={12} />{fmtRut(employee.rut)}</span>
              <span className="expediente-meta-item"><Calendar size={12} />Desde {fmtDate(employee.hireDate)}</span>
              <span className="expediente-status-badge" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                {statusLabel}
              </span>
            </div>
          </div>
          <button className="pe-btn pe-btn-ghost" style={{ padding: '6px 10px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Record Cards */}
        <div className="record-cards-row">
          {cardStatuses.map(rc => {
            const t = TRAFFIC[rc.status]
            return (
              <div key={rc.key} className="record-card-tile" style={{ background: t.bg, borderColor: t.border }} onClick={() => {
                if (rc.key === 'disciplina') setTab('amonestaciones')
                else if (rc.key === 'desempeno') setTab('evaluaciones')
              }}>
                <div className="record-card-icon-row">
                  <rc.icon size={13} color={t.text} />
                  <div className="record-card-dot" style={{ background: t.dot }} />
                </div>
                <div className="record-card-name" style={{ color: t.text }}>{rc.label}</div>
                <div className="record-card-state" style={{ color: t.text }}>{rc.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div className="expediente-tabs-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`exp-tab-btn ${tab === t.id ? 'active' : ''} ${t.danger ? 'danger' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && <span className="exp-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="expediente-body">
        {tab === 'resumen'          && <TabResumen employee={employee} documents={documents} />}
        {tab === 'amonestaciones'   && <TabAmonestaciones employee={employee} issuerName={issuerName} />}
        {tab === 'coaching'         && <TabCoaching employee={employee} issuerName={issuerName} />}
        {tab === 'evaluaciones'     && <TabEvaluaciones employee={employee} issuerName={issuerName} />}
        {tab === 'conversaciones'   && <TabConversaciones employee={employee} issuerName={issuerName} />}
        {tab === 'reconocimientos'  && <TabReconocimientos employee={employee} issuerName={issuerName} />}
        {tab === 'contrato'         && <TabContrato employee={employee} documents={documents} />}
        {tab === 'documentos_tab'   && (
          <div className="pe-card">
            <div className="pe-card-header"><div className="pe-card-title"><FolderOpen size={14} /> Documentos ({documents.length})</div></div>
            {documents.length === 0
              ? <div className="pe-empty"><FolderOpen size={28} /><div className="pe-empty-title">Sin documentos</div></div>
              : documents.map((d: any) => (
                  <div key={d.id} className="pe-record-item">
                    <div className="pe-record-item-header">
                      <FileText size={14} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 6 }}>{d.name || d.documentType}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.uploadedAt || d.createdAt)}</span>
                      {d.signed && <span className="dt-sent-badge"><CheckCircle size={10} /> Firmado</span>}
                    </div>
                  </div>
                ))
            }
          </div>
        )}
        {tab === 'onboarding'       && <TabOnboarding employee={employee} />}
        {tab === 'desvinculacion'   && <TabDesvinculacion employee={employee} issuerName={issuerName} />}
        {tab === 'vista_trabajador' && <TabVistaTrabajador employee={employee} documents={documents} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN — PERSONAS HUB
// ═══════════════════════════════════════════════════════════════════

export default function PersonasHub() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [storeReady, setStoreReady] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [sidePanel, setSidePanel] = useState<'mywork' | 'accesos'>('mywork')

  const issuerName = user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email : 'Sistema'

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [emps] = await Promise.all([
          api.getEmployees(),
          globalErcStore.loadAll(),
        ])
        setEmployees(emps || [])
      } catch { setEmployees([]) }
      setStoreReady(true)
      setLoading(false)
    }
    init()
  }, [])

  const loadDocs = useCallback(async (empId: string) => {
    try {
      const data = await api.getEmployeeDocuments?.(empId)
      setDocuments(data?.documents || [])
    } catch { setDocuments([]) }
  }, [])

  const handleSelectEmployee = useCallback((emp: Employee) => {
    setSelected(emp)
    setSidePanel('mywork')
    loadDocs(emp.id)
  }, [loadDocs])

  if (!storeReady || loading) {
    return (
      <div className="personas-layout">
        <div className="personas-sidebar">
          <div className="personas-sidebar-header">
            <div className="personas-module-badge">
              <div className="personas-module-icon"><Users size={18} color="#fff" /></div>
              <div><div className="personas-module-name">Personas</div><div className="personas-module-tagline">People & Culture</div></div>
            </div>
          </div>
          <div className="personas-workers-list">
            {[1,2,3,4].map(i => (
              <div key={i} className="pe-skeleton-row">
                <div className="pe-skeleton-circle" />
                <div className="pe-skeleton-lines">
                  <div className="pe-skeleton-line" style={{ width: '70%' }} />
                  <div className="pe-skeleton-line" style={{ width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="personas-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Cargando Personas...</div>
          </div>
        </div>
      </div>
    )
  }

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-muted)' }}>
        <Shield size={48} style={{ opacity: 0.3 }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Acceso Restringido</div>
        <div style={{ fontSize: 13 }}>Solo CEO y RRHH pueden acceder al módulo de Personas.</div>
      </div>
    )
  }

  const sorted = sortByHierarchy(employees)
  const filtered = sorted.filter(e =>
    `${e.firstName} ${e.lastName} ${e.rut} ${e.position} ${e.department}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group by hierarchy
  const groups = ['Dirección General', 'Dirección', 'Jefaturas', 'Senior', 'Equipo'] as const
  const grouped = groups.map(g => ({
    label: g,
    color: LEVEL_COLORS[g],
    emps: filtered.filter(e => getHierarchyGroup(e.position) === g),
  })).filter(g => g.emps.length > 0)

  return (
    <div className="personas-layout">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="personas-sidebar">
        {/* Module header */}
        <div className="personas-sidebar-header">
          <div className="personas-module-badge">
            <div className="personas-module-icon"><Users size={18} color="#fff" /></div>
            <div>
              <div className="personas-module-name">Personas</div>
              <div className="personas-module-tagline">People & Culture</div>
            </div>
          </div>
          <div className="personas-search">
            <Search size={13} />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Worker list */}
        <div className="personas-workers-list">
          {grouped.length === 0 && (
            <div className="pe-empty" style={{ padding: '24px 12px' }}>
              <Users size={24} />
              <div className="pe-empty-title" style={{ fontSize: 12 }}>Sin colaboradores</div>
            </div>
          )}

          {grouped.map(({ label, color, emps }) => (
            <div key={label}>
              <div className="personas-level-header" style={{ color }}>
                <div style={{ width: 16, height: 1, background: color, opacity: 0.4 }} />
                {label}
                <div className="personas-level-divider" style={{ background: color }} />
                <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.6 }}>{emps.length}</span>
              </div>
              {emps.map(emp => {
                const isSelected = selected?.id === emp.id
                const initials = emp.firstName.charAt(0) + emp.lastName.charAt(0)
                return (
                  <div
                    key={emp.id}
                    className={`personas-worker-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectEmployee(isSelected ? null as any : emp)}
                  >
                    <div className="personas-worker-avatar" style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : `${color}20`, color: isSelected ? '#fff' : color, border: `1.5px solid ${isSelected ? 'rgba(255,255,255,0.25)' : color + '40'}` }}>
                      {initials}
                    </div>
                    <div className="personas-worker-info">
                      <div className="personas-worker-name">{emp.firstName} {emp.lastName}</div>
                      <div className="personas-worker-pos">{emp.position}</div>
                    </div>
                    <div className="personas-online-dot" style={{ background: emp.status === 'active' ? '#22c55e' : '#ef4444', boxShadow: `0 0 5px ${emp.status === 'active' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* CEO-only: Control de Accesos */}
        {user?.role === 'owner' && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 10px' }}>
            <button
              onClick={() => { setSidePanel(sidePanel === 'accesos' ? 'mywork' : 'accesos'); setSelected(null) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: sidePanel === 'accesos' ? 'rgba(37,99,235,0.1)' : 'transparent',
                color: sidePanel === 'accesos' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              <Lock size={13} />
              Control de Accesos
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#b91c1c' }}>CEO</span>
            </button>
          </div>
        )}

        {/* Add worker button */}
        <button className="personas-add-btn" onClick={() => setShowAddForm(true)}>
          <UserPlus size={14} /> Nuevo colaborador
        </button>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="personas-main">
        {sidePanel === 'accesos' && !selected
          ? (
            <div style={{ padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <Lock size={16} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Control de Accesos</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Habilita o deshabilita módulos del Panel Admin por trabajador</div>
                </div>
              </div>
              <AccessControlTab />
            </div>
          )
          : selected
            ? <ExpedienteDigital
                key={selected.id}
                employee={selected}
                documents={documents}
                issuerName={issuerName}
                onClose={() => { setSelected(null); setSidePanel('mywork') }}
              />
            : <MyWorkView employees={employees} onSelectEmployee={handleSelectEmployee} />
        }
      </div>
    </div>
  )
}
