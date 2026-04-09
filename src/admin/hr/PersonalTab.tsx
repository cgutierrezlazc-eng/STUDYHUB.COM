import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../services/auth'
import { api, getApiBase } from '../../services/api'
import { Employee } from '../shared/types'
import { AFP_OPTIONS, HEALTH_OPTIONS, CONTRACT_TYPES, DEPARTMENTS, BANKS } from '../shared/constants'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { btnPrimary, btnSecondary, btnSmall, grid2, fmt, inputStyle, selectStyle } from '../shared/styles'
import {
  Users, UserPlus, FileText, DollarSign, Search, ChevronRight, ChevronDown,
  Clock, AlertTriangle, CheckCircle, X, Upload, Download,
  Info, FolderOpen, Eye, Shield, Briefcase, Target, FileSignature,
  Printer, Lock, Hash, MessageSquare, Award, TrendingUp, UserCheck,
  AlertCircle, Send, Star, Calendar, BarChart3, Clipboard,
  BookOpen, ThumbsUp, Flag, Zap, Activity, ShieldAlert, FileWarning, Scale
} from 'lucide-react'
import {
  CONNIKU_POSITIONS, CONNIKU_VALUES,
  getJobDescription, getExpectationMemo,
  generateContractPDF, generateJobDescriptionPDF, generateExpectationMemoPDF,
} from '../shared/ercData'

// ═══════════════════════════════════════════════════════════════════
// TYPES — ERC LOCAL DATA
// ═══════════════════════════════════════════════════════════════════

interface FESSignature {
  documentType: string
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

type DisciplineLevel = 'verbal' | 'written_1' | 'written_2' | 'termination'
type RecordCardCategory = 'desempeno' | 'asistencia' | 'cumplimiento' | 'capacitacion' | 'disciplina' | 'documentos' | 'probidad' | 'incumplimiento' | 'confidencialidad'

interface DisciplineRecord {
  id: string
  employeeId: string
  level: DisciplineLevel
  category: RecordCardCategory
  explanation: string
  incidentDetails: string
  date: string
  issuedBy: string
  acknowledged: boolean
  acknowledgedDate?: string
}

interface CoachingRecord {
  id: string
  employeeId: string
  topic: string
  description: string
  actionItems: string
  date: string
  issuedBy: string
}

interface ConversationRecord {
  id: string
  employeeId: string
  type: 'library' | 'adhoc'
  title: string
  description: string
  date: string
  issuedBy: string
  acknowledged: boolean
}

interface AcknowledgementRecord {
  id: string
  employeeId: string
  title: string
  description: string
  date: string
  issuedBy: string
}

interface PerformanceReview {
  id: string
  employeeId: string
  type: 'mid_contract' | 'end_contract' | 'additional'
  dimensions: { name: string; rating: number }[]
  overallRating: number
  comments: string
  strengths: string
  areasToImprove: string
  date: string
  issuedBy: string
  acknowledged: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const RECORD_CARD_CONFIG: { key: RecordCardCategory; label: string; icon: any; color: string; severe?: boolean }[] = [
  { key: 'desempeno', label: 'Desempeno', icon: TrendingUp, color: '#3b82f6' },
  { key: 'asistencia', label: 'Asistencia', icon: Clock, color: '#8b5cf6' },
  { key: 'cumplimiento', label: 'Cumplimiento Legal', icon: Scale, color: '#06b6d4' },
  { key: 'capacitacion', label: 'Capacitacion', icon: BookOpen, color: '#f59e0b' },
  { key: 'disciplina', label: 'Disciplina', icon: Flag, color: '#ef4444' },
  { key: 'documentos', label: 'Documentos', icon: FolderOpen, color: '#6366f1' },
  { key: 'probidad', label: 'Falta de Probidad', icon: ShieldAlert, color: '#dc2626', severe: true },
  { key: 'incumplimiento', label: 'Incumplimiento', icon: FileWarning, color: '#ea580c', severe: true },
  { key: 'confidencialidad', label: 'Confidencialidad', icon: Lock, color: '#991b1b', severe: true },
]

const DISCIPLINE_LEVELS: { key: DisciplineLevel; label: string; color: string; short: string }[] = [
  { key: 'verbal', label: 'Amonestacion Verbal', color: '#f59e0b', short: 'V' },
  { key: 'written_1', label: 'Amonestacion Escrita 1', color: '#f97316', short: 'W1' },
  { key: 'written_2', label: 'Amonestacion Escrita 2', color: '#ef4444', short: 'W2' },
  { key: 'termination', label: 'Terminacion de Contrato', color: '#991b1b', short: 'T' },
]

const PERFORMANCE_DIMENSIONS = [
  { key: 'quality', name: 'Calidad de Trabajo', desc: 'Exactitud, prolijidad y nivel de excelencia en entregables' },
  { key: 'knowledge', name: 'Conocimiento del Cargo', desc: 'Dominio de habilidades, herramientas y procedimientos necesarios' },
  { key: 'communication', name: 'Comunicacion', desc: 'Claridad, oportunidad y efectividad al comunicarse con el equipo' },
  { key: 'teamwork', name: 'Trabajo en Equipo', desc: 'Colaboracion, apoyo mutuo y contribucion al ambiente laboral' },
  { key: 'initiative', name: 'Iniciativa y Proactividad', desc: 'Capacidad de anticipar problemas y proponer soluciones sin esperar instrucciones' },
  { key: 'attendance', name: 'Puntualidad y Asistencia', desc: 'Cumplimiento de horarios, asistencia regular y disponibilidad' },
  { key: 'values', name: 'Adherencia a Valores Conniku', desc: 'Vivencia diaria de los valores corporativos de Conniku' },
]

const CONVERSATION_LIBRARY = [
  { title: 'Feedback de Desempeno', desc: 'Conversacion sobre rendimiento reciente del trabajador' },
  { title: 'Plan de Desarrollo', desc: 'Definicion de metas de crecimiento profesional' },
  { title: 'Reunion 1:1 Mensual', desc: 'Check-in mensual de bienestar y avance' },
  { title: 'Retroalimentacion de Proyecto', desc: 'Revision de resultados de un proyecto especifico' },
  { title: 'Expectativas Trimestrales', desc: 'Alineamiento de expectativas para el proximo trimestre' },
  { title: 'Reconocimiento de Logro', desc: 'Reconocer formalmente un logro destacado' },
]

const ACKNOWLEDGEMENT_LIBRARY = [
  { title: 'Excelencia en Servicio', desc: 'Por brindar un servicio excepcional' },
  { title: 'Trabajo en Equipo Destacado', desc: 'Por colaboracion ejemplar con el equipo' },
  { title: 'Innovacion', desc: 'Por proponer una mejora significativa' },
  { title: 'Puntualidad Perfecta', desc: 'Asistencia y puntualidad impecable en el periodo' },
  { title: 'Superacion de Metas', desc: 'Por superar los KPIs establecidos' },
  { title: 'Compromiso Excepcional', desc: 'Esfuerzo extraordinario ante una situacion critica' },
]

const POSITION_HIERARCHY: Record<string, number> = {
  'ceo': 0,
  'cto': 1,
  'head_operations': 2,
  'marketing_growth': 3,
  'community_manager': 4,
  'customer_support': 5,
}

// ═══════════════════════════════════════════════════════════════════
// LOCAL STORAGE CRUD
// ═══════════════════════════════════════════════════════════════════

const KEYS = {
  fes: 'fes',
  discipline: 'discipline',
  coaching: 'coaching',
  conversations: 'conversations',
  acknowledgements: 'acknowledgements',
  reviews: 'reviews',
  chat: 'chat',
}

class ERCStore {
  data: Record<string, any[]> = {
    fes: [], discipline: [], coaching: [], conversations: [], acknowledgements: [], reviews: [], chat: []
  };

  async loadAll() {
    try {
      const [ercRes, fesRes] = await Promise.all([
        api.getAllErcRecords(),
        api.getAllFesSignatures()
      ]);
      if (ercRes?.records) {
        this.data.discipline = ercRes.records.discipline || [];
        this.data.coaching = ercRes.records.coaching || [];
        this.data.conversations = ercRes.records.conversations || [];
        this.data.acknowledgements = ercRes.records.acknowledgements || [];
        this.data.reviews = ercRes.records.performance || [];
        this.data.chat = ercRes.records.chat || [];
      }
      if (fesRes?.signatures) {
        this.data.fes = fesRes.signatures.map((s: any) => ({
          documentType: s.document_type || s.documentType,
          employeeId: s.employeeId || s.employee_id,
          signerEmail: s.signer_email,
          signerName: s.signer_name,
          signerRut: s.signer_rut,
          timestamp: s.timestamp,
          ipAddress: s.ip_address,
          documentHash: s.document_hash,
          verificationCode: s.verification_code,
          status: s.status,
          id: s.id
        }));
      }
    } catch (e) {
      console.error('Failed to load ERC store', e);
    }
  }

  get(key: string) { return this.data[key] || []; }
  
  getForEmp(key: string, empId: string) {
    return this.get(key).filter((x: any) => x.employeeId === empId || x.empId === empId);
  }

  async add(key: string, empId: string, record: any) {
    this.data[key] = [...this.data[key], record];
    try {
      if (key === 'fes') {
        const payload = { 
          document_type: record.documentType, 
          signer_email: record.signerEmail,
          signer_name: record.signerName,
          signer_rut: record.signerRut,
          timestamp: record.timestamp,
          ip_address: record.ipAddress,
          document_hash: record.documentHash,
          verification_code: record.verificationCode,
          status: record.status 
        };
        await api.saveFesSignature(empId, payload);
      } else {
        const recordType = key === 'reviews' ? 'performance' : key;
        await api.saveErcRecord(empId, recordType, record);
      }
    } catch (e) { console.error(e) }
  }

  async update(key: string, empId: string, record: any) {
     const arr = [...this.data[key]];
     const idx = arr.findIndex((x:any) => x.id === record.id)
     if (idx >= 0) arr[idx] = record
     else arr.push(record)
     this.data[key] = arr;
     if (key === 'chat') {
        await api.saveErcRecord(empId, 'chat', record);
     } else if (key === 'fes') {
       const payload = { 
          document_type: record.documentType, 
          signer_email: record.signerEmail,
          signer_name: record.signerName,
          signer_rut: record.signerRut,
          timestamp: record.timestamp,
          ip_address: record.ipAddress,
          document_hash: record.documentHash,
          verification_code: record.verificationCode,
          status: record.status 
        };
       await api.saveFesSignature(empId, payload);
     }
  }
  
  set(key: string, arr: any[]) { this.data[key] = arr; }
}

export const globalErcStore = new ERCStore();

function lsGet<T>(key: string): T[] { return globalErcStore.get(key) as T[] }
function lsSet<T>(key: string, data: T[]) { globalErcStore.set(key, data) }
function lsAdd<T extends { id: string }>(key: string, item: T) {
  const empId = (item as any).employeeId || (item as any).empId || 'unknown';
  globalErcStore.add(key, empId, item);
}
function lsUpdate<T extends { id: string }>(key: string, item: T) {
  const empId = (item as any).employeeId || (item as any).empId || 'unknown';
  globalErcStore.update(key, empId, item);
}
function lsGetForEmployee<T>(key: string, empId: string): T[] {
  return globalErcStore.getForEmp(key, empId) as T[];
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }

// FES Helpers
function loadSignatures(): FESSignature[] { return lsGet<FESSignature>(KEYS.fes) }
function saveSignature(sig: FESSignature) { lsUpdate(KEYS.fes, sig as any) }
function getSignature(employeeId: string, docType: string): FESSignature | null {
  return loadSignatures().find(s => s.employeeId === employeeId && s.documentType === docType) || null
}

async function generateSHA256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'FES-'
  for (let i = 0; i < 12; i++) { if (i > 0 && i % 4 === 0) code += '-'; code += chars[Math.floor(Math.random() * chars.length)] }
  return code
}

async function getPublicIP(): Promise<string> {
  try { const r = await fetch('https://api.ipify.org?format=json'); const d = await r.json(); return d.ip || 'N/D' } catch { return 'N/D' }
}

// ═══════════════════════════════════════════════════════════════════
// RECORD CARD STATUS CALCULATOR
// ═══════════════════════════════════════════════════════════════════

type TrafficLight = 'green' | 'yellow' | 'orange' | 'red'

function getRecordCardStatus(empId: string, category: RecordCardCategory, documents: any[]): { status: TrafficLight; label: string } {
  const disciplines = lsGetForEmployee<DisciplineRecord>(KEYS.discipline, empId).filter(d => d.category === category)
  const reviews = lsGetForEmployee<PerformanceReview>(KEYS.reviews, empId)

  // Severe categories (probidad, confidencialidad, incumplimiento) - any record = red
  if (['probidad', 'confidencialidad'].includes(category)) {
    if (disciplines.length > 0) return { status: 'red', label: 'Causal grave activa' }
    return { status: 'green', label: 'Sin registros' }
  }

  if (category === 'incumplimiento') {
    if (disciplines.some(d => d.level === 'termination')) return { status: 'red', label: 'Terminacion' }
    if (disciplines.some(d => d.level === 'written_2')) return { status: 'orange', label: 'Escrita 2 activa' }
    if (disciplines.some(d => d.level === 'written_1')) return { status: 'yellow', label: 'Escrita 1 activa' }
    if (disciplines.length > 0) return { status: 'yellow', label: 'Verbal activa' }
    return { status: 'green', label: 'Sin registros' }
  }

  if (category === 'desempeno') {
    if (reviews.length === 0) return { status: 'green', label: 'Sin evaluaciones' }
    const lastTwo = reviews.slice(-2)
    const belowThreshold = lastTwo.filter(r => r.overallRating < 3).length
    if (belowThreshold >= 2) return { status: 'red', label: 'Bajo rendimiento critico' }
    if (belowThreshold >= 1) return { status: 'yellow', label: 'Atencion requerida' }
    const avgRating = reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
    if (avgRating >= 4) return { status: 'green', label: `Promedio ${avgRating.toFixed(1)}` }
    return { status: 'green', label: `Promedio ${avgRating.toFixed(1)}` }
  }

  if (category === 'documentos') {
    const requiredDocs = ['contrato', 'job_description', 'expectation_memo', 'cedula', 'afp', 'salud', 'reglamento', 'obligacion_informar', 'mutual']
    const existing = requiredDocs.filter(dt => documents.some((d: any) => d.documentType === dt) || getSignature(empId, dt))
    const pct = (existing.length / requiredDocs.length) * 100
    if (pct >= 100) return { status: 'green', label: 'Carpeta completa' }
    if (pct >= 60) return { status: 'yellow', label: `${existing.length}/${requiredDocs.length} documentos` }
    return { status: 'red', label: `${existing.length}/${requiredDocs.length} documentos` }
  }

  // Generic discipline-based categories
  if (disciplines.some(d => d.level === 'termination')) return { status: 'red', label: 'Terminacion' }
  if (disciplines.some(d => d.level === 'written_2')) return { status: 'red', label: 'Escrita 2 activa' }
  if (disciplines.some(d => d.level === 'written_1')) return { status: 'orange', label: 'Escrita 1 activa' }
  if (disciplines.some(d => d.level === 'verbal')) return { status: 'yellow', label: 'Verbal activa' }
  return { status: 'green', label: 'Sin registros' }
}

const TRAFFIC_COLORS: Record<TrafficLight, { bg: string; border: string; text: string; dot: string }> = {
  green:  { bg: 'rgba(34,197,94,0.12)',  border: '#22c55e', text: '#16a34a', dot: '#22c55e' },
  yellow: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#d97706', dot: '#f59e0b' },
  orange: { bg: 'rgba(249,115,22,0.12)', border: '#f97316', text: '#ea580c', dot: '#f97316' },
  red:    { bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', text: '#dc2626', dot: '#ef4444' },
}

// ═══════════════════════════════════════════════════════════════════
// HIERARCHY HELPER
// ═══════════════════════════════════════════════════════════════════

function getPositionPriority(position: string): number {
  const lower = position.toLowerCase()
  if (lower.includes('ceo') || lower.includes('gerente general') || lower.includes('director general')) return 0
  if (lower.includes('cto') || lower.includes('director de tecnolog')) return 1
  if (lower.includes('operations') || lower.includes('operacion')) return 2
  if (lower.includes('marketing') || lower.includes('growth')) return 3
  if (lower.includes('community') || lower.includes('comunidad')) return 4
  if (lower.includes('support') || lower.includes('soporte')) return 5
  return 10
}

function sortByHierarchy(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => getPositionPriority(a.position) - getPositionPriority(b.position))
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — PERSONAL TAB
// ═══════════════════════════════════════════════════════════════════

export default function PersonalTab() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [indicators, setIndicators] = useState<any>(null)
  const [indicatorsError, setIndicatorsError] = useState('')

  const loadEmployees = async () => {
    setLoading(true)
    try { const data = await api.getEmployees(); setEmployees(data || []) } catch { setEmployees([]) }
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
      .catch(() => setIndicatorsError('No se pudieron cargar indicadores.'))
  }, [])

  const [storeLoaded, setStoreLoaded] = useState(false)
  useEffect(() => { 
    Promise.all([
      loadEmployees(),
      globalErcStore.loadAll()
    ]).finally(() => setStoreLoaded(true)) 
  }, [])
  
  if (!storeLoaded) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando sistema ECDP...</div>
  }

  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>Solo el owner puede acceder al modulo de RRHH.</p>
      </div>
    )
  }

  const sorted = sortByHierarchy(employees)
  const filtered = sorted.filter(e =>
    `${e.firstName} ${e.lastName} ${e.rut} ${e.position}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group employees by hierarchy level for the chain of command
  const getHierarchyLevel = (position: string) => {
    const p = getPositionPriority(position)
    if (p === 0) return 'ceo'
    if (p <= 2) return 'director'
    if (p <= 4) return 'manager'
    return 'staff'
  }

  const hierarchyColors: Record<string, string> = {
    ceo: '#f59e0b',
    director: '#3b82f6',
    manager: '#8b5cf6',
    staff: '#6b7280',
  }

  const hierarchyLabels: Record<string, string> = {
    ceo: 'CEO',
    director: 'Directores',
    manager: 'Managers',
    staff: 'Equipo',
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* ─── LEFT SIDEBAR: CHAIN OF COMMAND ─── */}
      <div style={{
        width: 290, minWidth: 290, borderRight: '1px solid var(--border)',
        background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ 
          padding: '16px 14px 12px', 
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(139,92,246,0.06))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 10, 
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}>
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>ECDP</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Expediente de Colaboradores</div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Buscar colaborador..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
            />
          </div>
        </div>

        {/* Hierarchy Tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {['ceo', 'director', 'manager', 'staff'].map(level => {
            const empsInLevel = filtered.filter(e => getHierarchyLevel(e.position) === level)
            if (empsInLevel.length === 0) return null
            const color = hierarchyColors[level]
            const indent = level === 'ceo' ? 0 : level === 'director' ? 12 : level === 'manager' ? 24 : 36

            return (
              <div key={level} style={{ marginBottom: 4 }}>
                {/* Level label */}
                <div style={{ 
                  padding: '6px 8px', marginLeft: indent, marginBottom: 2, 
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 14, height: 1, background: color, opacity: 0.4 }} />
                  {hierarchyLabels[level]}
                </div>

                {empsInLevel.map(emp => {
                  const isSelected = selectedEmployee?.id === emp.id
                  const initials = emp.firstName.charAt(0) + emp.lastName.charAt(0)

                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(isSelected ? null : emp)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        marginLeft: indent, borderRadius: 10, cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                        marginBottom: 2,
                        border: isSelected ? 'none' : '1px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      {/* Profile Photo / Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : `linear-gradient(135deg, ${color}40, ${color}20)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? '#fff' : color, fontWeight: 700, fontSize: 13, flexShrink: 0,
                        border: `2px solid ${isSelected ? 'rgba(255,255,255,0.3)' : color + '50'}`,
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                        overflow: 'hidden',
                      }}>
                        {emp.profilePictureUrl ? (
                          <img src={`${getApiBase()}${emp.profilePictureUrl}`} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initials
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.position}
                        </div>
                        <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>
                          {emp.department}
                        </div>
                      </div>
                      {/* Status indicator */}
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: emp.status === 'active' ? '#22c55e' : '#ef4444',
                        boxShadow: `0 0 6px ${emp.status === 'active' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      }} />
                    </div>
                  )
                })}

                {/* Connecting line */}
                {level !== 'staff' && empsInLevel.length > 0 && (
                  <div style={{ marginLeft: indent + 19, width: 1, height: 8, background: color + '30' }} />
                )}
              </div>
            )
          })}

          {filtered.length === 0 && !loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Sin empleados
            </div>
          )}
        </div>

        {/* Add employee button */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowAddEmployee(true)} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 12 }}>
            <UserPlus size={14} /> Agregar Colaborador
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
        {selectedEmployee ? (
          <EmployeeFile
            employee={selectedEmployee}
            employees={employees}
            indicators={indicators}
            onClose={() => setSelectedEmployee(null)}
            onRefresh={loadEmployees}
          />
        ) : (
          <ERCDashboard
            employees={employees}
            indicators={indicators}
            indicatorsError={indicatorsError}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          />
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeModal onClose={() => setShowAddEmployee(false)} onRefresh={loadEmployees} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ERC DASHBOARD — Default view (My Work)
// ═══════════════════════════════════════════════════════════════════

function ERCDashboard({ employees, indicators, indicatorsError, onSelectEmployee }: {
  employees: Employee[]; indicators: any; indicatorsError: string
  onSelectEmployee: (e: Employee) => void
}) {
  const [dashTab, setDashTab] = useState<'work' | 'history'>('work')

  // Calculate scheduled items
  const scheduledItems: { emp: Employee; label: string; type: string; urgency: 'high' | 'medium' | 'low' }[] = []

  for (const emp of employees) {
    if (emp.status !== 'active') continue
    // Contract expiration
    if (emp.contractType === 'plazo_fijo' && emp.endDate) {
      const days = Math.ceil((new Date(emp.endDate).getTime() - Date.now()) / 86400000)
      if (days <= 15) scheduledItems.push({ emp, label: `Contrato vence en ${days} dias`, type: 'contrato', urgency: days <= 7 ? 'high' : 'medium' })
    }
    // Missing documents
    const docs = lsGetForEmployee<any>(KEYS.fes, emp.id)
    const hasFES = ['contrato', 'job_description', 'expectation_memo'].every(dt => getSignature(emp.id, dt))
    if (!hasFES) scheduledItems.push({ emp, label: 'Documentos ERC pendientes de firma', type: 'docs', urgency: 'medium' })

    // Performance review due
    const reviews = lsGetForEmployee<PerformanceReview>(KEYS.reviews, emp.id)
    const hireDate = new Date(emp.hireDate)
    const daysSinceHire = Math.floor((Date.now() - hireDate.getTime()) / 86400000)
    if (daysSinceHire >= 45 && !reviews.some(r => r.type === 'mid_contract')) {
      scheduledItems.push({ emp, label: 'Evaluacion Mid-Contract pendiente', type: 'review', urgency: daysSinceHire >= 60 ? 'high' : 'low' })
    }
    if (daysSinceHire >= 80 && !reviews.some(r => r.type === 'end_contract')) {
      scheduledItems.push({ emp, label: 'Evaluacion End-of-Contract pendiente', type: 'review', urgency: 'medium' })
    }
  }

  scheduledItems.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.urgency] - { high: 0, medium: 1, low: 2 }[b.urgency]))

  // Recent activity from all records
  const allDisciplines = lsGet<DisciplineRecord>(KEYS.discipline)
  const allCoaching = lsGet<CoachingRecord>(KEYS.coaching)
  const allConversations = lsGet<ConversationRecord>(KEYS.conversations)
  const allAcknowledgements = lsGet<AcknowledgementRecord>(KEYS.acknowledgements)
  const allReviews = lsGet<PerformanceReview>(KEYS.reviews)

  const recentActivity = [
    ...allDisciplines.map(d => ({ date: d.date, label: `Disciplina: ${d.explanation.slice(0, 60)}`, empId: d.employeeId })),
    ...allCoaching.map(c => ({ date: c.date, label: `Coaching: ${c.topic}`, empId: c.employeeId })),
    ...allConversations.map(c => ({ date: c.date, label: `Conversacion: ${c.title}`, empId: c.employeeId })),
    ...allAcknowledgements.map(a => ({ date: a.date, label: `Reconocimiento: ${a.title}`, empId: a.employeeId })),
    ...allReviews.map(r => ({ date: r.date, label: `Evaluacion: ${r.type === 'mid_contract' ? 'Mid-Contract' : 'End-of-Contract'} (${r.overallRating.toFixed(1)})`, empId: r.employeeId })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={26} /> ECDP — Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Sistema de gestion de personal — Conniku SpA
        </p>
      </div>

      {/* Indicators bar */}
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
              <div key={i.label} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 11, whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>{i.label}</span>{' '}
                <strong>${i.val?.toLocaleString('es-CL', { maximumFractionDigits: 2 })}</strong>
              </div>
            ))}
            <div style={{ padding: '6px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, fontSize: 10, whiteSpace: 'nowrap', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={10} /> En vivo
            </div>
          </>
        ) : indicatorsError ? (
          <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: 11, color: '#f59e0b' }}>
            <AlertTriangle size={12} /> {indicatorsError}
          </div>
        ) : null}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard icon={Users} label="Total" value={employees.length} color="#3b82f6" />
        <StatCard icon={CheckCircle} label="Activos" value={employees.filter(e => e.status === 'active').length} color="#22c55e" />
        <StatCard icon={Clock} label="En Prueba" value={employees.filter(e => e.contractType === 'plazo_fijo').length} color="#f59e0b" />
        <StatCard icon={AlertTriangle} label="Alertas" value={scheduledItems.filter(s => s.urgency === 'high').length} color="#ef4444" />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { id: 'work' as const, label: 'Mi Trabajo', icon: Clipboard },
          { id: 'history' as const, label: 'Historial', icon: Clock },
        ].map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: dashTab === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
            color: dashTab === t.id ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {dashTab === 'work' && (
        <div>
          {/* Scheduled Items */}
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-secondary)' }}>
            Tareas Pendientes ({scheduledItems.length})
          </h3>
          {scheduledItems.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <CheckCircle size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>No hay tareas pendientes. Todo al dia.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {scheduledItems.map((item, i) => {
                const urgColors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }
                return (
                  <div key={i} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => onSelectEmployee(item.emp)}>
                    <div style={{ width: 6, height: 36, borderRadius: 3, background: urgColors[item.urgency], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.emp.firstName} {item.emp.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                      background: urgColors[item.urgency] + '20', color: urgColors[item.urgency],
                    }}>
                      {item.urgency === 'high' ? 'URGENTE' : item.urgency === 'medium' ? 'PENDIENTE' : 'PROXIMO'}
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {dashTab === 'history' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-secondary)' }}>
            Actividad Reciente
          </h3>
          {recentActivity.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin actividad registrada aun.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {recentActivity.map((a, i) => {
                const emp = employees.find(e => e.id === a.empId)
                return (
                  <div key={i} className="card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: emp ? 'pointer' : 'default' }}
                    onClick={() => emp && onSelectEmployee(emp)}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 70 }}>{new Date(a.date).toLocaleDateString('es-CL')}</div>
                    <div style={{ fontSize: 12 }}>
                      <strong>{emp ? `${emp.firstName} ${emp.lastName}` : '—'}</strong> — {a.label}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE FILE — Full detail view when employee is selected
// ═══════════════════════════════════════════════════════════════════

type EmpTab = 'record_cards' | 'info' | 'job_description' | 'expectation_memo' | 'contrato' | 'discipline' | 'coaching' | 'conversations' | 'acknowledgements' | 'performance' | 'docs' | 'chat' | 'liquidaciones'

function EmployeeFile({ employee, employees, indicators, onClose, onRefresh }: {
  employee: Employee; employees: Employee[]; indicators: any; onClose: () => void; onRefresh: () => void
}) {
  const [tab, setTab] = useState<EmpTab>('record_cards')
  const [documents, setDocuments] = useState<any[]>([])
  const afpInfo = AFP_OPTIONS.find(a => a.value === employee.afp)

  useEffect(() => {
    api.getEmployeeDocuments(employee.id).then(setDocuments).catch(() => setDocuments([]))
  }, [employee.id])

  useEffect(() => { setTab('record_cards') }, [employee.id])

  // Calculate contract info
  const contractLabel = CONTRACT_TYPES.find(c => c.value === employee.contractType)?.label || employee.contractType
  const hireDate = new Date(employee.hireDate + 'T12:00:00')
  const hireDateStr = hireDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  const endDateStr = employee.endDate ? new Date(employee.endDate + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : null
  const daysSinceHire = Math.floor((Date.now() - hireDate.getTime()) / 86400000)
  const initials = employee.firstName.charAt(0) + employee.lastName.charAt(0)
  const posColor = getPositionPriority(employee.position) === 0 ? '#f59e0b' : getPositionPriority(employee.position) <= 2 ? '#3b82f6' : '#8b5cf6'

  // Tab groups for "My Work / Perfil Laboral"
  const MAIN_TABS: { id: EmpTab; label: string; icon: any }[] = [
    { id: 'record_cards', label: 'Perfil Laboral', icon: BarChart3 },
    { id: 'info', label: 'Informacion', icon: Info },
    { id: 'contrato', label: 'Contrato', icon: FileSignature },
    { id: 'docs', label: 'Documentos', icon: FolderOpen },
    { id: 'liquidaciones', label: 'Liquidaciones', icon: DollarSign },
  ]

  const WORK_TABS: { id: EmpTab; label: string; icon: any }[] = [
    { id: 'conversations', label: 'Conversaciones', icon: BookOpen },
    { id: 'acknowledgements', label: 'Reconocimientos', icon: Award },
    { id: 'coaching', label: 'Coaching', icon: MessageSquare },
    { id: 'discipline', label: 'Disciplina', icon: Flag },
    { id: 'performance', label: 'Evaluacion', icon: TrendingUp },
  ]

  const EXTRA_TABS: { id: EmpTab; label: string; icon: any }[] = [
    { id: 'job_description', label: 'Job Description', icon: Briefcase },
    { id: 'expectation_memo', label: 'Expectation Memo', icon: Target },
    { id: 'chat', label: 'Chat IA', icon: Zap },
  ]

  return (
    <div style={{ padding: 0 }}>
      {/* ─── CREW FILE HEADER (Disney ERC Style) ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 40%, #2b6cb0 100%)',
        padding: '24px 28px 20px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle pattern overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
        
        <div style={{ position: 'relative', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Profile Photo */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 100, height: 100, borderRadius: 16, flexShrink: 0,
              background: `linear-gradient(135deg, ${posColor}60, ${posColor}30)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              fontSize: 36, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
            }}>
              {employee.profilePictureUrl ? (
                <img src={`${getApiBase()}${employee.profilePictureUrl}`} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            {/* Upload Avatar Badge */}
            <label style={{
              position: 'absolute', bottom: -8, right: -8, width: 32, height: 32,
              background: 'var(--accent)', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)'
            }}>
              <Upload size={14} />
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  try {
                    await api.uploadEmployeeAvatar(employee.id, e.target.files[0])
                    onRefresh()
                  } catch (err) { alert('Error al subir foto de perfil') }
                }
              }} />
            </label>
          </div>

          {/* Employee Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {employee.firstName} {employee.lastName}
              </h2>
              <span style={{
                padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: employee.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
                color: employee.status === 'active' ? '#86efac' : '#fca5a5',
                border: `1px solid ${employee.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {employee.status === 'active' ? '● Activo' : '● Inactivo'}
              </span>
            </div>

            <div style={{ fontSize: 14, opacity: 0.9, fontWeight: 500, marginBottom: 2 }}>
              {employee.position}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
              {employee.department} • RUT: {employee.rut}
            </div>

            {/* Contract Details Row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 2 }}>Fecha Ingreso</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{hireDateStr}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 2 }}>Contrato</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{contractLabel}</div>
              </div>
              {employee.contractType === 'plazo_fijo' && endDateStr && (
                <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 2 }}>Termino Contrato</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>{endDateStr}</div>
                </div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 2 }}>Antiguedad</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{daysSinceHire} dias</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB SYSTEM: My Work / History / Direct Reports ─── */}
      <div style={{ padding: '0 24px' }}>
        {/* Primary tabs row */}
        <div style={{ 
          display: 'flex', gap: 2, paddingTop: 16, marginBottom: 0,
          borderBottom: '2px solid var(--border)',
        }}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 16px', border: 'none', borderRadius: '8px 8px 0 0',
              background: tab === t.id ? 'var(--bg-primary)' : 'transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 700 : 500, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
            }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Secondary "folder" tabs — Conversations, Acknowledgements, etc. */}
        {tab === 'record_cards' && (
          <div style={{  
            display: 'flex', gap: 6, padding: '12px 0 8px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>
              <FolderOpen size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Carpetas:
            </span>
            {WORK_TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
              >
                <t.icon size={12} /> {t.label}
              </button>
            ))}
            {EXTRA_TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px dashed var(--border)', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
              >
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Back button when in a sub-folder */}
        {['conversations','acknowledgements','coaching','discipline','performance','job_description','expectation_memo','chat'].includes(tab) && (
          <div style={{ padding: '10px 0 6px' }}>
            <button onClick={() => setTab('record_cards')} style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ← Volver a Perfil Laboral
            </button>
          </div>
        )}
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div style={{ padding: '16px 24px 24px' }}>
        {tab === 'record_cards' && <RecordCardsView employee={employee} documents={documents} onTabChange={setTab} />}
        {tab === 'info' && <InfoTab employee={employee} afpInfo={afpInfo} />}
        {tab === 'job_description' && <JobDescriptionTab employee={employee} />}
        {tab === 'expectation_memo' && <ExpectationMemoTab employee={employee} />}
        {tab === 'contrato' && <ContratoTab employee={employee} afpRate={afpInfo?.rate || 10.58} />}
        {tab === 'discipline' && <DisciplineTab employee={employee} />}
        {tab === 'coaching' && <CoachingTab employee={employee} />}
        {tab === 'conversations' && <ConversationsTab employee={employee} />}
        {tab === 'acknowledgements' && <AcknowledgementsTab employee={employee} />}
        {tab === 'performance' && <PerformanceReviewTab employee={employee} />}
        {tab === 'docs' && <DocumentsTab employee={employee} documents={documents} />}
        {tab === 'chat' && <EmployeeChatTab employee={employee} documents={documents} />}
        {tab === 'liquidaciones' && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <DollarSign size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>Las liquidaciones se generan desde la pestana "Remuneraciones" del panel RRHH.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// RECORD CARDS VIEW — 9 cards with traffic light
// ═══════════════════════════════════════════════════════════════════

function RecordCardsView({ employee, documents, onTabChange }: { employee: Employee; documents: any[]; onTabChange: (t: EmpTab) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Record Cards — {employee.firstName} {employee.lastName}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {RECORD_CARD_CONFIG.map(card => {
          const status = getRecordCardStatus(employee.id, card.key, documents)
          const colors = TRAFFIC_COLORS[status.status]
          const Icon = card.icon
          return (
            <div key={card.key} className="card" style={{
              padding: 16, cursor: 'pointer', transition: 'all 0.2s',
              borderLeft: `4px solid ${colors.dot}`,
            }}
              onClick={() => {
                if (card.key === 'disciplina' || card.key === 'probidad' || card.key === 'incumplimiento' || card.key === 'confidencialidad') onTabChange('discipline')
                else if (card.key === 'desempeno') onTabChange('performance')
                else if (card.key === 'documentos') onTabChange('docs')
                else if (card.key === 'asistencia') onTabChange('discipline')
                else if (card.key === 'cumplimiento') onTabChange('docs')
                else if (card.key === 'capacitacion') onTabChange('coaching')
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: colors.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} style={{ color: colors.dot }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{card.label}</div>
                  {card.severe && <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>CAUSAL GRAVE</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors.dot }} />
                <span style={{ fontSize: 11, color: colors.text, fontWeight: 600 }}>{status.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// INFO TAB
// ═══════════════════════════════════════════════════════════════════

function InfoTab({ employee, afpInfo }: { employee: Employee; afpInfo: any }) {
  return (
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
      <InfoRow label="Emergencia" value={`${employee.emergencyContactName} (${employee.emergencyContactPhone})`} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// JOB DESCRIPTION TAB
// ═══════════════════════════════════════════════════════════════════

function JobDescriptionTab({ employee }: { employee: Employee }) {
  const jd = getJobDescription(employee.position)
  const sig = getSignature(employee.id, 'job_description')
  const [signing, setSigning] = useState(false)
  const { user } = useAuth()

  if (!jd) return <EmptyState icon={Briefcase} message="No hay Job Description vinculada a este cargo." />

  const handleSign = async () => {
    setSigning(true)
    try {
      const hash = await generateSHA256(JSON.stringify({ position: jd.positionKey, employee: employee.id, jd }))
      const ip = await getPublicIP()
      const signature: FESSignature = {
        documentType: 'job_description', employeeId: employee.id, signerEmail: user?.email || employee.email,
        signerName: `${employee.firstName} ${employee.lastName}`, signerRut: employee.rut,
        timestamp: new Date().toISOString(), ipAddress: ip, documentHash: hash,
        verificationCode: generateVerificationCode(), status: 'signed',
      }
      saveSignature(signature)
      alert(`Firmado. Codigo: ${signature.verificationCode}`)
    } catch { alert('Error al firmar') }
    setSigning(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => generateJobDescriptionPDF(employee as any)} style={{ ...btnPrimary, background: '#2563eb' }}><Printer size={14} /> PDF</button>
        {!sig && <button onClick={handleSign} disabled={signing} style={{ ...btnPrimary, background: '#7c3aed' }}><FileSignature size={14} /> {signing ? 'Firmando...' : 'Firmar (FES)'}</button>}
        {sig && <SignatureBadge sig={sig} />}
      </div>
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--accent)' }}>{jd.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>{jd.department} • {jd.email} • Reporta a: {jd.reportTo}</p>
        <div style={{ background: 'rgba(37,99,235,0.06)', borderLeft: '3px solid #2563eb', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 16, fontSize: 13, fontStyle: 'italic' }}>{jd.mision}</div>
        <ERCSection title="Expectativas" items={jd.expectations} color="#22c55e" />
        <ERCSection title="Responsabilidades" items={jd.responsibilities} color="#3b82f6" />
        <ERCSection title="Compromisos de Conniku" items={jd.commitments} color="#8b5cf6" />
        <ERCSection title="Requisitos" items={jd.requirements} color="#f59e0b" />
        <ERCSection title="Deseables" items={jd.desirable} color="#6b7280" />
        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>KPIs</h4>
        <div style={{ display: 'grid', gap: 6 }}>
          {jd.kpis.map((k, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12 }}>
              <span>{k.metric}</span><strong style={{ color: 'var(--accent)' }}>{k.target}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EXPECTATION MEMO TAB
// ═══════════════════════════════════════════════════════════════════

function ExpectationMemoTab({ employee }: { employee: Employee }) {
  const memo = getExpectationMemo(employee.position)
  const sig = getSignature(employee.id, 'expectation_memo')
  const [signing, setSigning] = useState(false)
  const { user } = useAuth()

  if (!memo) return <EmptyState icon={Target} message="No hay Expectation Memo vinculado a este cargo." />

  const handleSign = async () => {
    setSigning(true)
    try {
      const hash = await generateSHA256(JSON.stringify({ position: memo.positionKey, employee: employee.id, memo }))
      const ip = await getPublicIP()
      const signature: FESSignature = {
        documentType: 'expectation_memo', employeeId: employee.id, signerEmail: user?.email || employee.email,
        signerName: `${employee.firstName} ${employee.lastName}`, signerRut: employee.rut,
        timestamp: new Date().toISOString(), ipAddress: ip, documentHash: hash,
        verificationCode: generateVerificationCode(), status: 'signed',
      }
      saveSignature(signature)
      alert(`Firmado. Codigo: ${signature.verificationCode}`)
    } catch { alert('Error al firmar') }
    setSigning(false)
  }

  const hireDate = new Date(employee.hireDate + 'T12:00:00')
  const daysSinceHire = Math.floor((Date.now() - hireDate.getTime()) / 86400000)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => generateExpectationMemoPDF(employee as any)} style={{ ...btnPrimary, background: '#2563eb' }}><Printer size={14} /> PDF</button>
        {!sig && <button onClick={handleSign} disabled={signing} style={{ ...btnPrimary, background: '#7c3aed' }}><FileSignature size={14} /> {signing ? 'Firmando...' : 'Firmar (FES)'}</button>}
        {sig && <SignatureBadge sig={sig} />}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ label: '30 dias', day: 30, color: '#22c55e' }, { label: '60 dias', day: 60, color: '#3b82f6' }, { label: '90 dias', day: 90, color: '#8b5cf6' }].map(p => {
          const completed = daysSinceHire >= p.day
          const active = daysSinceHire >= (p.day - 30) && daysSinceHire < p.day
          return (
            <div key={p.day} style={{
              flex: 1, padding: '8px 12px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 600,
              background: completed ? `${p.color}22` : active ? `${p.color}11` : 'var(--bg-secondary)',
              color: completed ? p.color : active ? p.color : 'var(--text-muted)',
              border: active ? `2px solid ${p.color}` : '2px solid transparent',
            }}>
              {completed && <CheckCircle size={14} style={{ marginBottom: 2 }} />} {p.label} {completed ? '— Completado' : active ? '— En curso' : ''}
            </div>
          )
        })}
      </div>

      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 0 }}>{memo.intro}</p>
        {[memo.day30, memo.day60, memo.day90].map((phase, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: ['#22c55e', '#3b82f6', '#8b5cf6'][idx], margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#22c55e', '#3b82f6', '#8b5cf6'][idx] }} />
              {phase.title}
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {phase.items.map((item, i) => <li key={i} style={{ fontSize: 12, marginBottom: 4 }}>{item}</li>)}
            </ul>
          </div>
        ))}
        <ERCSection title="Expectativas Permanentes" items={memo.ongoing} color="#f59e0b" />
        <ERCSection title="Criterios de Evaluacion" items={memo.evaluationCriteria} color="#ef4444" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CONTRATO TAB
// ═══════════════════════════════════════════════════════════════════

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
      const hash = await generateSHA256(JSON.stringify({ employee: employee.id, position: employee.position, salary: employee.grossSalary }))
      const ip = await getPublicIP()
      const signature: FESSignature = {
        documentType: 'contrato', employeeId: employee.id, signerEmail: user?.email || employee.email,
        signerName: `${employee.firstName} ${employee.lastName}`, signerRut: employee.rut,
        timestamp: new Date().toISOString(), ipAddress: ip, documentHash: hash,
        verificationCode: generateVerificationCode(), status: 'signed',
      }
      saveSignature(signature)
      alert(`Contrato firmado. Codigo: ${signature.verificationCode}`)
    } catch { alert('Error al firmar') }
    setSigning(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => generateContractPDF(employee as any, afpRate)} style={{ ...btnPrimary, background: '#2563eb' }}><Printer size={14} /> Generar Contrato PDF</button>
        {!sig && <button onClick={handleSign} disabled={signing} style={{ ...btnPrimary, background: '#7c3aed' }}><FileSignature size={14} /> {signing ? 'Firmando...' : 'Firmar (FES)'}</button>}
        {sig && <SignatureBadge sig={sig} />}
      </div>

      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ textAlign: 'center', margin: '0 0 4px' }}>CONNIKU SpA</h3>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 0 }}>Contrato Individual de Trabajo</p>

        <ContractClause title="PARTES" content={`Empleador: CONNIKU SpA, RUT 78.395.702-7, representada por Cristian Andrés Gutiérrez Lazcano.\nTrabajador: ${employee.firstName} ${employee.lastName}, RUT ${employee.rut}.`} />
        <ContractClause title="CARGO" content={`${employee.position} — Departamento de ${employee.department}.`} />
        <ContractClause title="JORNADA" content={`${employee.weeklyHours} horas semanales, lunes a viernes, 09:00 a 18:00 con 1 hora de colacion.`} />

        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>REMUNERACION</h4>
        <div style={{ display: 'grid', gap: 4 }}>
          {[
            { label: 'Sueldo Base Bruto', val: employee.grossSalary },
            { label: 'Gratificacion Legal', val: gratificacion },
            { label: 'Colacion', val: employee.colacion },
            { label: 'Movilizacion', val: employee.movilizacion },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12 }}>
              <span>{r.label}</span><strong>${fmt(r.val)}</strong>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>DESCUENTOS LEGALES</h4>
        <div style={{ display: 'grid', gap: 4 }}>
          {[
            { label: `AFP ${employee.afp} (${afpRate}%)`, val: afpAmount },
            { label: `Salud (7%)`, val: healthAmount },
            { label: `AFC (${(afcEmpRate * 100).toFixed(1)}%)`, val: afcEmpAmount },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(239,68,68,0.05)', borderRadius: 6, fontSize: 12 }}>
              <span>{r.label}</span><span style={{ color: '#ef4444' }}>-${fmt(r.val)}</span>
            </div>
          ))}
        </div>

        <ContractClause title="DURACION" content={`Contrato ${employee.contractType === 'indefinido' ? 'indefinido' : 'a plazo fijo'} desde el ${employee.hireDate}.`} />
        <ContractClause title="FERIADO" content="15 dias habiles anuales (Art. 67 Codigo del Trabajo)." />
        <ContractClause title="CONFIDENCIALIDAD" content="La violacion de la clausula de confidencialidad constituye CAUSAL DE TERMINACION INMEDIATA conforme al Art. 160 N°7 del Codigo del Trabajo, sin derecho a indemnizacion. Subsiste por 2 anos post-termino." />
        <ContractClause title="DISCIPLINA PROGRESIVA" content="El sistema contempla: (i) Amonestacion Verbal, (ii) Escrita 1, (iii) Escrita 2, (iv) Terminacion. Cada etapa documentada en el ERC y firmada electronicamente." />
        <ContractClause title="EVALUACION DE DESEMPENO" content="Dos evaluaciones con promedio inferior a 3.0/5.0 facultan a la empresa a prescindir de la posicion conforme al Art. 161 del Codigo del Trabajo." />
        <ContractClause title="FALTA DE PROBIDAD" content="Art. 160 N°1: Terminacion inmediata ante conducta deshonesta, fraudulenta o contraria a la buena fe." />
        <ContractClause title="ANEXOS" content="1) Job Description  2) Expectation Memo 30/60/90  3) Reglamento Interno  4) ODI  5) Politica de Privacidad" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DISCIPLINE TAB — Escalating V > W1 > W2 > Termination
// ═══════════════════════════════════════════════════════════════════

function DisciplineTab({ employee }: { employee: Employee }) {
  const [records, setRecords] = useState<DisciplineRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ level: 'verbal' as DisciplineLevel, category: 'disciplina' as RecordCardCategory, explanation: '', incidentDetails: '' })
  const { user } = useAuth()

  useEffect(() => { setRecords(lsGetForEmployee<DisciplineRecord>(KEYS.discipline, employee.id)) }, [employee.id])

  const handleSave = () => {
    if (!form.explanation || !form.incidentDetails) { alert('Complete ambos campos.'); return }
    const record: DisciplineRecord = {
      id: uid(), employeeId: employee.id, level: form.level, category: form.category,
      explanation: form.explanation, incidentDetails: form.incidentDetails,
      date: new Date().toISOString(), issuedBy: user?.email || 'CEO',
      acknowledged: false,
    }
    lsAdd(KEYS.discipline, record)
    setRecords([...records, record])
    setShowForm(false)
    setForm({ level: 'verbal', category: 'disciplina', explanation: '', incidentDetails: '' })
  }

  // Determine current progressive level
  const currentLevel = records.length === 0 ? null : records[records.length - 1].level
  const nextLevel = !currentLevel ? 'verbal' : currentLevel === 'verbal' ? 'written_1' : currentLevel === 'written_1' ? 'written_2' : 'termination'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Disciplina Progresiva</h3>
        <button onClick={() => { setForm({ ...form, level: nextLevel }); setShowForm(true) }} style={btnPrimary}>
          <Flag size={14} /> Nueva Disciplina
        </button>
      </div>

      {/* Progressive status bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {DISCIPLINE_LEVELS.map(dl => {
          const isActive = records.some(r => r.level === dl.key)
          const isCurrent = currentLevel === dl.key
          return (
            <div key={dl.key} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center',
              background: isActive ? dl.color + '20' : 'var(--bg-secondary)',
              border: isCurrent ? `2px solid ${dl.color}` : '2px solid transparent',
            }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: isActive ? dl.color : 'var(--text-muted)' }}>{dl.short}</div>
              <div style={{ fontSize: 10, color: isActive ? dl.color : 'var(--text-muted)', fontWeight: 600 }}>{dl.label}</div>
            </div>
          )
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 16, border: '2px solid var(--accent)' }}>
          <h4 style={{ margin: '0 0 16px' }}>Registrar Disciplina</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Nivel</label>
              <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value as DisciplineLevel })} style={selectStyle}>
                {DISCIPLINE_LEVELS.map(dl => <option key={dl.key} value={dl.key}>{dl.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as RecordCardCategory })} style={selectStyle}>
                {RECORD_CARD_CONFIG.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Explicacion de la Infraccion *</label>
            <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })}
              rows={3} style={{ ...inputStyle, resize: 'vertical' } as any} placeholder="Describa la infraccion..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Detalles del Incidente *</label>
            <textarea value={form.incidentDetails} onChange={e => setForm({ ...form, incidentDetails: e.target.value })}
              rows={3} style={{ ...inputStyle, resize: 'vertical' } as any} placeholder="Fecha, hora, circunstancias..." />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} style={btnPrimary}>Guardar y Emitir</button>
          </div>
        </div>
      )}

      {/* Records */}
      {records.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <CheckCircle size={32} style={{ marginBottom: 8, color: '#22c55e' }} />
          <p>Sin registros disciplinarios. Estado: Limpio.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => {
            const dl = DISCIPLINE_LEVELS.find(d => d.key === r.level)!
            const cat = RECORD_CARD_CONFIG.find(c => c.key === r.category)!
            return (
              <div key={r.id} className="card" style={{ padding: 14, borderLeft: `4px solid ${dl.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: dl.color + '20', color: dl.color }}>{dl.label}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: 'var(--bg-secondary)' }}>{cat.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(r.date).toLocaleDateString('es-CL')}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.explanation}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.incidentDetails}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                  Emitido por: {r.issuedBy} • {r.acknowledged ? 'Acusado recibo' : 'Pendiente de acuse'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COACHING TAB — Informal, no approval needed
// ═══════════════════════════════════════════════════════════════════

function CoachingTab({ employee }: { employee: Employee }) {
  const [records, setRecords] = useState<CoachingRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ topic: '', description: '', actionItems: '' })
  const { user } = useAuth()

  useEffect(() => { setRecords(lsGetForEmployee<CoachingRecord>(KEYS.coaching, employee.id)) }, [employee.id])

  const handleSave = () => {
    if (!form.topic || !form.description) { alert('Complete los campos.'); return }
    const record: CoachingRecord = {
      id: uid(), employeeId: employee.id, topic: form.topic, description: form.description,
      actionItems: form.actionItems, date: new Date().toISOString(), issuedBy: user?.email || 'CEO',
    }
    lsAdd(KEYS.coaching, record)
    setRecords([...records, record])
    setShowForm(false)
    setForm({ topic: '', description: '', actionItems: '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Coaching</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>El coaching NO es disciplina y NO requiere aprobacion.</p>
        </div>
        <button onClick={() => setShowForm(true)} style={btnPrimary}><MessageSquare size={14} /> Nuevo Coaching</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 16, border: '2px solid var(--accent)' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Tema *</label>
            <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={inputStyle} placeholder="Ej: Mejora en comunicacion con clientes" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Descripcion *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' } as any} placeholder="Que se discutio..." />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Items de Accion</label>
            <textarea value={form.actionItems} onChange={e => setForm({ ...form, actionItems: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' } as any} placeholder="Pasos a seguir..." />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} style={btnPrimary}>Guardar</button>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState icon={MessageSquare} message="Sin sesiones de coaching registradas." />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="card" style={{ padding: 14, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.topic}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString('es-CL')}</span>
              </div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{r.description}</div>
              {r.actionItems && <div style={{ fontSize: 12, color: 'var(--accent)', fontStyle: 'italic' }}>Acciones: {r.actionItems}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CONVERSATIONS TAB — Library + Ad-hoc
// ═══════════════════════════════════════════════════════════════════

function ConversationsTab({ employee }: { employee: Employee }) {
  const [records, setRecords] = useState<ConversationRecord[]>([])
  const [showForm, setShowForm] = useState<'library' | 'adhoc' | null>(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const { user } = useAuth()

  useEffect(() => { setRecords(lsGetForEmployee<ConversationRecord>(KEYS.conversations, employee.id)) }, [employee.id])

  const handleSave = (type: 'library' | 'adhoc') => {
    if (!form.title || !form.description) { alert('Complete los campos.'); return }
    const record: ConversationRecord = {
      id: uid(), employeeId: employee.id, type, title: form.title, description: form.description,
      date: new Date().toISOString(), issuedBy: user?.email || 'CEO', acknowledged: false,
    }
    lsAdd(KEYS.conversations, record)
    setRecords([...records, record])
    setShowForm(null)
    setForm({ title: '', description: '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Conversaciones Documentadas</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowForm('library')} style={{ ...btnPrimary, background: '#2563eb' }}><BookOpen size={14} /> Desde Libreria</button>
          <button onClick={() => setShowForm('adhoc')} style={btnPrimary}><MessageSquare size={14} /> Ad-hoc</button>
        </div>
      </div>

      {showForm === 'library' && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px' }}>Seleccionar de Libreria</h4>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {CONVERSATION_LIBRARY.map(c => (
              <div key={c.title} className="card" style={{ padding: 12, cursor: 'pointer', border: form.title === c.title ? '2px solid var(--accent)' : '2px solid transparent' }}
                onClick={() => setForm({ title: c.title, description: c.desc })}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Notas adicionales</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' } as any} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(null)} style={btnSecondary}>Cancelar</button>
            <button onClick={() => handleSave('library')} style={btnPrimary}>Guardar</button>
          </div>
        </div>
      )}

      {showForm === 'adhoc' && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px' }}>Conversacion Ad-hoc</h4>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Titulo *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Titulo de la conversacion" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Descripcion *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' } as any} placeholder="Resumen de la conversacion..." />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(null)} style={btnSecondary}>Cancelar</button>
            <button onClick={() => handleSave('adhoc')} style={btnPrimary}>Guardar</button>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState icon={BookOpen} message="Sin conversaciones documentadas." />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="card" style={{ padding: 14, borderLeft: `4px solid ${r.type === 'library' ? '#2563eb' : '#8b5cf6'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: r.type === 'library' ? 'rgba(37,99,235,0.1)' : 'rgba(139,92,246,0.1)', color: r.type === 'library' ? '#2563eb' : '#8b5cf6' }}>
                  {r.type === 'library' ? 'Libreria' : 'Ad-hoc'}
                </span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(r.date).toLocaleDateString('es-CL')}</span>
              </div>
              <div style={{ fontSize: 12 }}>{r.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ACKNOWLEDGEMENTS TAB — Kudos/Reconocimientos
// ═══════════════════════════════════════════════════════════════════

function AcknowledgementsTab({ employee }: { employee: Employee }) {
  const [records, setRecords] = useState<AcknowledgementRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const { user } = useAuth()

  useEffect(() => { setRecords(lsGetForEmployee<AcknowledgementRecord>(KEYS.acknowledgements, employee.id)) }, [employee.id])

  const handleSave = () => {
    if (!form.title) { alert('Seleccione un reconocimiento.'); return }
    const record: AcknowledgementRecord = {
      id: uid(), employeeId: employee.id, title: form.title, description: form.description,
      date: new Date().toISOString(), issuedBy: user?.email || 'CEO',
    }
    lsAdd(KEYS.acknowledgements, record)
    setRecords([...records, record])
    setShowForm(false)
    setForm({ title: '', description: '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Reconocimientos</h3>
        <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, background: '#f59e0b' }}><Award size={14} /> Emitir Reconocimiento</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px' }}>Seleccionar Reconocimiento</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {ACKNOWLEDGEMENT_LIBRARY.map(a => (
              <div key={a.title} className="card" style={{ padding: 12, cursor: 'pointer', border: form.title === a.title ? '2px solid #f59e0b' : '2px solid transparent', textAlign: 'center' }}
                onClick={() => setForm({ title: a.title, description: a.desc })}>
                <Star size={20} style={{ color: '#f59e0b', marginBottom: 4 }} />
                <div style={{ fontWeight: 600, fontSize: 12 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Comentario personal (opcional)</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' } as any} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} style={{ ...btnPrimary, background: '#f59e0b' }}>Emitir</button>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState icon={Award} message="Sin reconocimientos emitidos." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="card" style={{ padding: 16, textAlign: 'center', background: 'rgba(245,158,11,0.05)' }}>
              <Star size={28} style={{ color: '#f59e0b', marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{r.description}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>{new Date(r.date).toLocaleDateString('es-CL')} • {r.issuedBy}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE REVIEW TAB — Dimensions 1-5
// ═══════════════════════════════════════════════════════════════════

function PerformanceReviewTab({ employee }: { employee: Employee }) {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'mid_contract' | 'end_contract' | 'additional'>('mid_contract')
  const [dimensions, setDimensions] = useState(PERFORMANCE_DIMENSIONS.map(d => ({ name: d.name, rating: 3 })))
  const [comments, setComments] = useState('')
  const [strengths, setStrengths] = useState('')
  const [areasToImprove, setAreasToImprove] = useState('')
  const { user } = useAuth()

  useEffect(() => { setReviews(lsGetForEmployee<PerformanceReview>(KEYS.reviews, employee.id)) }, [employee.id])

  const overallRating = dimensions.reduce((s, d) => s + d.rating, 0) / dimensions.length

  const handleSave = () => {
    const review: PerformanceReview = {
      id: uid(), employeeId: employee.id, type: formType, dimensions: [...dimensions],
      overallRating, comments, strengths, areasToImprove,
      date: new Date().toISOString(), issuedBy: user?.email || 'CEO', acknowledged: false,
    }
    lsAdd(KEYS.reviews, review)
    setReviews([...reviews, review])
    setShowForm(false)
    setDimensions(PERFORMANCE_DIMENSIONS.map(d => ({ name: d.name, rating: 3 })))
    setComments(''); setStrengths(''); setAreasToImprove('')
  }

  // Check two consecutive reviews < 3
  const lastTwo = reviews.slice(-2)
  const criticalPerformance = lastTwo.length >= 2 && lastTwo.every(r => r.overallRating < 3)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Performance Reviews</h3>
        <button onClick={() => setShowForm(true)} style={btnPrimary}><TrendingUp size={14} /> Nueva Evaluacion</button>
      </div>

      {criticalPerformance && (
        <div style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ef4444' }}>
          <AlertTriangle size={18} />
          <strong>ALERTA: 2 evaluaciones consecutivas bajo 3.0. Segun contrato, la empresa puede prescindir de esta posicion.</strong>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 16, border: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Nueva Evaluacion</h4>
            <select value={formType} onChange={e => setFormType(e.target.value as any)} style={{ ...selectStyle, width: 'auto' }}>
              <option value="mid_contract">Mid-Contract Review</option>
              <option value="end_contract">End-of-Contract Review</option>
              <option value="additional">Evaluacion Adicional</option>
            </select>
          </div>

          {/* Dimensions */}
          <div style={{ marginBottom: 16 }}>
            {PERFORMANCE_DIMENSIONS.map((dim, idx) => (
              <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{dim.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dim.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => {
                      const next = [...dimensions]; next[idx] = { ...next[idx], rating: n }; setDimensions(next)
                    }} style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      background: dimensions[idx].rating >= n ? (n <= 2 ? '#ef4444' : n === 3 ? '#f59e0b' : '#22c55e') + '20' : 'var(--bg-secondary)',
                      color: dimensions[idx].rating >= n ? (n <= 2 ? '#ef4444' : n === 3 ? '#f59e0b' : '#22c55e') : 'var(--text-muted)',
                    }}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Overall */}
          <div style={{ padding: 12, background: overallRating < 3 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>PROMEDIO GENERAL</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: overallRating < 3 ? '#ef4444' : '#22c55e' }}>{overallRating.toFixed(1)}</div>
            {overallRating < 3 && <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Bajo el umbral minimo (3.0)</div>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Fortalezas</label>
            <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' } as any} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Areas de Mejora</label>
            <textarea value={areasToImprove} onChange={e => setAreasToImprove(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' } as any} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--text-muted)' }}>Comentarios Generales</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' } as any} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} style={btnPrimary}>Guardar Evaluacion</button>
          </div>
        </div>
      )}

      {/* Review history */}
      {reviews.length === 0 ? (
        <EmptyState icon={TrendingUp} message="Sin evaluaciones de desempeno registradas." />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reviews.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: 'var(--bg-secondary)' }}>
                    {r.type === 'mid_contract' ? 'Mid-Contract' : r.type === 'end_contract' ? 'End-of-Contract' : 'Adicional'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>{new Date(r.date).toLocaleDateString('es-CL')}</span>
                </div>
                <div style={{
                  padding: '4px 14px', borderRadius: 20, fontWeight: 800, fontSize: 16,
                  background: r.overallRating < 3 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                  color: r.overallRating < 3 ? '#ef4444' : '#22c55e',
                }}>{r.overallRating.toFixed(1)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
                {r.dimensions.map(d => (
                  <div key={d.name} style={{ padding: '6px 8px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 11 }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{d.name}</div>
                    <div style={{ fontWeight: 700, color: d.rating < 3 ? '#ef4444' : d.rating >= 4 ? '#22c55e' : '#f59e0b' }}>{d.rating}/5</div>
                  </div>
                ))}
              </div>
              {r.strengths && <div style={{ fontSize: 12, marginTop: 10 }}><strong style={{ color: '#22c55e' }}>Fortalezas:</strong> {r.strengths}</div>}
              {r.areasToImprove && <div style={{ fontSize: 12, marginTop: 4 }}><strong style={{ color: '#f59e0b' }}>Mejora:</strong> {r.areasToImprove}</div>}
              {r.comments && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>{r.comments}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DOCUMENTS TAB — Enhanced with CV, titulos, academicos
// ═══════════════════════════════════════════════════════════════════

function DocumentsTab({ employee, documents }: { employee: Employee; documents: any[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Carpeta Personal</h3>
        <button style={btnPrimary}><Upload size={14} /> Subir Documento</button>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--bg-tertiary)' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Documentos Requeridos
        </h4>
        {[
          { type: 'contrato', label: 'Contrato de Trabajo', required: true },
          { type: 'job_description', label: 'Descripcion de Cargo (firmada)', required: true },
          { type: 'expectation_memo', label: 'Expectation Memo 30/60/90 (firmado)', required: true },
          { type: 'cedula', label: 'Copia Cedula de Identidad', required: true },
          { type: 'afp', label: 'Certificado AFP', required: true },
          { type: 'salud', label: 'Certificado Fonasa/Isapre', required: true },
          { type: 'reglamento', label: 'Reglamento Interno (firmado)', required: true },
          { type: 'obligacion_informar', label: 'Obligacion de Informar (ODI)', required: true },
          { type: 'mutual', label: 'Registro Mutual de Seguridad', required: true },
          { type: 'cv', label: 'Curriculum Vitae (CV)', required: false },
          { type: 'titulo', label: 'Titulo Profesional', required: false },
          { type: 'titulo_tecnico', label: 'Titulo Tecnico / Diplomaturas', required: false },
          { type: 'certificados_academicos', label: 'Certificados Academicos', required: false },
          { type: 'antecedentes', label: 'Certificado de Antecedentes', required: false },
          { type: 'residencia', label: 'Certificado de Residencia', required: false },
        ].map(doc => {
          const exists = documents.some((d: any) => d.documentType === doc.type)
          const hasFES = ['contrato', 'job_description', 'expectation_memo'].includes(doc.type) ? getSignature(employee.id, doc.type) : null
          const isComplete = exists || !!hasFES
          return (
            <div key={doc.type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              {isComplete ? <CheckCircle size={15} style={{ color: '#22c55e' }} /> : <AlertTriangle size={15} style={{ color: doc.required ? '#ef4444' : '#f59e0b' }} />}
              <span style={{ flex: 1, fontSize: 12 }}>{doc.label}</span>
              {doc.required && !isComplete && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>OBLIGATORIO</span>}
              {isComplete && <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>COMPLETO</span>}
              {hasFES && <span style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Lock size={9} /> FES</span>}
            </div>
          )
        })}
      </div>

      {documents.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {documents.map((doc: any) => (
            <div key={doc.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={18} style={{ color: 'var(--accent)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{doc.documentType} • {new Date(doc.createdAt).toLocaleDateString('es-CL')}</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Eye size={15} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Download size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE CHAT TAB — AI Chat about employee documents
// ═══════════════════════════════════════════════════════════════════

function EmployeeChatTab({ employee, documents }: { employee: Employee; documents: any[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Load chat history
  useEffect(() => {
    const stored = lsGet<{ empId: string; messages: ChatMessage[] }>(KEYS.chat)
    const found = stored.find(c => c.empId === employee.id)
    setMessages(found?.messages || [])
  }, [employee.id])

  // Scroll to bottom
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [messages])

  const buildContext = () => {
    const jd = getJobDescription(employee.position)
    const memo = getExpectationMemo(employee.position)
    const disciplines = lsGetForEmployee<DisciplineRecord>(KEYS.discipline, employee.id)
    const reviews = lsGetForEmployee<PerformanceReview>(KEYS.reviews, employee.id)
    const coaching = lsGetForEmployee<CoachingRecord>(KEYS.coaching, employee.id)

    return `Eres un asistente de RRHH de Conniku SpA. Responde en espanol chileno.
Empleado: ${employee.firstName} ${employee.lastName}, RUT: ${employee.rut}, Cargo: ${employee.position}, Departamento: ${employee.department}, Fecha ingreso: ${employee.hireDate}, Contrato: ${employee.contractType}, Sueldo: $${employee.grossSalary}, Estado: ${employee.status}.
${jd ? `Job Description: ${jd.mision}. Expectativas: ${jd.expectations.join('; ')}. KPIs: ${jd.kpis.map(k => `${k.metric}: ${k.target}`).join('; ')}.` : ''}
${memo ? `Expectation Memo: Plan 30/60/90. Dia 30: ${memo.day30.items.join('; ')}. Dia 60: ${memo.day60.items.join('; ')}. Dia 90: ${memo.day90.items.join('; ')}.` : ''}
Disciplinas: ${disciplines.length > 0 ? disciplines.map(d => `${d.level} - ${d.category}: ${d.explanation}`).join('; ') : 'Ninguna'}.
Evaluaciones: ${reviews.length > 0 ? reviews.map(r => `${r.type} ${r.overallRating.toFixed(1)}/5`).join('; ') : 'Ninguna'}.
Coaching: ${coaching.length > 0 ? coaching.map(c => c.topic).join('; ') : 'Ninguno'}.
Documentos: ${documents.map(d => d.name || d.documentType).join(', ') || 'Sin documentos'}.`
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const contextMsg = buildContext() + '\n\nPregunta del usuario: ' + userMsg.content
      const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      const response = await api.supportAdminChat(contextMsg, history)
      const assistantMsg: ChatMessage = { role: 'assistant', content: response?.response || response?.message || 'Sin respuesta.', timestamp: new Date().toISOString() }
      const final = [...newMessages, assistantMsg]
      setMessages(final)

      // Save to localStorage
      const stored = lsGet<{ empId: string; messages: ChatMessage[] }>(KEYS.chat)
      const idx = stored.findIndex(c => c.empId === employee.id)
      if (idx >= 0) stored[idx].messages = final; else stored.push({ empId: employee.id, messages: final })
      lsSet(KEYS.chat, stored)
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error al conectar con el asistente.', timestamp: new Date().toISOString() }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Zap size={18} style={{ color: 'var(--accent)' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Chat IA — {employee.firstName}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pregunta sobre sus documentos, evaluaciones, contrato, etc.</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 12, background: 'var(--bg-tertiary)', borderRadius: 12, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 12 }}>
            Pregunta sobre el empleado: contrato, evaluaciones, disciplina, documentos...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-muted)' }}>
              Pensando...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Pregunta sobre ${employee.firstName}...`}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} style={{ ...btnPrimary, padding: '10px 16px' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ADD EMPLOYEE MODAL
// ═══════════════════════════════════════════════════════════════════

function AddEmployeeModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [form, setForm] = useState<any>({
    rut: '', firstName: '', lastName: '', email: '', phone: '', address: '',
    birthDate: '', nationality: 'Chilena', maritalStatus: 'soltero',
    emergencyContactName: '', emergencyContactPhone: '',
    position: '', department: '', hireDate: '', endDate: '',
    contractType: 'plazo_fijo', workSchedule: 'lunes_viernes', weeklyHours: 45,
    grossSalary: 0, colacion: 0, movilizacion: 0,
    afp: 'modelo', healthSystem: 'fonasa', isapreName: '', isapreUf: 0,
    afcActive: true, bankName: '', bankAccountType: 'cuenta_vista', bankAccountNumber: '',
    status: 'active', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.rut || !form.firstName || !form.lastName) { alert('Complete campos obligatorios.'); return }
    setSaving(true)
    try {
      await api.createEmployee(form)
      alert('Empleado creado.')
      onRefresh()
      onClose()
    } catch (e: any) { alert(e.message || 'Error al crear empleado.') }
    setSaving(false)
  }

  const F = ({ label, k, type = 'text', required, placeholder }: { label: string; k: string; type?: string; required?: boolean; placeholder?: string }) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3, color: 'var(--text-muted)' }}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
      <input type={type} value={form[k] || ''} onChange={e => set(k, e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )

  const S = ({ label, k, options }: { label: string; k: string; options: { value: string; label: string }[] }) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3, color: 'var(--text-muted)' }}>{label}</label>
      <select value={form[k]} onChange={e => set(k, e.target.value)} style={selectStyle}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Agregar Empleado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Datos Personales</h4>
        <div style={grid2}>
          <F label="RUT" k="rut" required placeholder="XX.XXX.XXX-X" />
          <F label="Nombre" k="firstName" required />
          <F label="Apellido" k="lastName" required />
          <F label="Email" k="email" type="email" />
          <F label="Telefono" k="phone" />
          <F label="Direccion" k="address" />
          <F label="Fecha Nacimiento" k="birthDate" type="date" />
          <F label="Nacionalidad" k="nationality" />
          <S label="Estado Civil" k="maritalStatus" options={[{ value: 'soltero', label: 'Soltero/a' }, { value: 'casado', label: 'Casado/a' }, { value: 'divorciado', label: 'Divorciado/a' }, { value: 'viudo', label: 'Viudo/a' }]} />
          <F label="Contacto Emergencia" k="emergencyContactName" />
          <F label="Tel. Emergencia" k="emergencyContactPhone" />
        </div>

        <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>Cargo y Contrato</h4>
        <div style={grid2}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3, color: 'var(--text-muted)' }}>Cargo</label>
            <select value={form.position} onChange={e => {
              const pos = e.target.value
              set('position', pos)
              const p = CONNIKU_POSITIONS.find(cp => cp.value === pos)
              if (p) { const jd = getJobDescription(pos); if (jd) set('department', jd.department) }
            }} style={selectStyle}>
              <option value="">Seleccionar...</option>
              {CONNIKU_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              <option value="__custom__">Otro cargo...</option>
            </select>
          </div>
          <S label="Departamento" k="department" options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
          <F label="Fecha Ingreso" k="hireDate" type="date" required />
          <S label="Tipo Contrato" k="contractType" options={CONTRACT_TYPES} />
          {form.contractType === 'plazo_fijo' && <F label="Fecha Termino" k="endDate" type="date" />}
          <F label="Horas Semanales" k="weeklyHours" type="number" />
        </div>

        <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>Remuneracion</h4>
        <div style={grid2}>
          <F label="Sueldo Bruto ($)" k="grossSalary" type="number" required />
          <F label="Colacion ($)" k="colacion" type="number" />
          <F label="Movilizacion ($)" k="movilizacion" type="number" />
        </div>

        <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>Prevision</h4>
        <div style={grid2}>
          <S label="AFP" k="afp" options={AFP_OPTIONS} />
          <S label="Salud" k="healthSystem" options={HEALTH_OPTIONS} />
          {form.healthSystem === 'isapre' && <F label="Nombre Isapre" k="isapreName" />}
          {form.healthSystem === 'isapre' && <F label="UF Isapre" k="isapreUf" type="number" />}
        </div>

        <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>Datos Bancarios</h4>
        <div style={grid2}>
          <S label="Banco" k="bankName" options={BANKS.map(b => ({ value: b, label: b }))} />
          <S label="Tipo Cuenta" k="bankAccountType" options={[{ value: 'cuenta_vista', label: 'Cuenta Vista' }, { value: 'cuenta_corriente', label: 'Cuenta Corriente' }, { value: 'cuenta_ahorro', label: 'Cuenta Ahorro' }, { value: 'cuenta_rut', label: 'CuentaRUT' }]} />
          <F label="N° Cuenta" k="bankAccountNumber" />
        </div>

        {form.position && form.position !== '__custom__' && getJobDescription(form.position) && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#16a34a' }}>
            <CheckCircle size={14} /> Job Description, Expectation Memo y Contrato Tipo vinculados automaticamente.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? 'Guardando...' : 'Guardar Empleado'}</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SHARED HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Icon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  )
}

function SignatureBadge({ sig }: { sig: FESSignature }) {
  const [showDetail, setShowDetail] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowDetail(!showDetail)} style={{ ...btnSecondary, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)' }}>
        <Lock size={14} /> Firmado
      </button>
      {showDetail && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 8, background: 'var(--bg-primary)',
          border: '1px solid var(--border)', borderRadius: 12, padding: 16, minWidth: 320, zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={14} /> Certificado FES</h4>
          <div style={{ fontSize: 11, display: 'grid', gap: 4 }}>
            <div><strong>Firmante:</strong> {sig.signerName}</div>
            <div><strong>RUT:</strong> {sig.signerRut}</div>
            <div><strong>Fecha:</strong> {new Date(sig.timestamp).toLocaleString('es-CL')}</div>
            <div><strong>IP:</strong> {sig.ipAddress}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: 6, borderRadius: 4 }}>{sig.documentHash}</div>
            <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(124,58,237,0.08)', borderRadius: 6, fontWeight: 700, textAlign: 'center', letterSpacing: '0.1em', color: '#7c3aed' }}>{sig.verificationCode}</div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', textAlign: 'center' }}>Firma conforme a Ley 19.799</p>
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
        {items.map((item, i) => <li key={i} style={{ fontSize: 12, marginBottom: 3 }}>{item}</li>)}
      </ul>
    </div>
  )
}

function ContractClause({ title, content }: { title: string; content: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', margin: '0 0 4px' }}>{title}</h4>
      <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line' }}>{content}</p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon size={15} style={{ color }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: highlight ? 700 : 400, color: highlight ? 'var(--accent)' : 'var(--text-primary)', marginTop: 2 }}>{value || '—'}</div>
    </div>
  )
}
