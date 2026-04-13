import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { api } from '../services/api'

// Profile embebido para el formulario de conexión LMS
const Profile = lazy(() => import('./Profile'))

interface Props {
  onNavigate?: (path: string) => void
}

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface CourseItem {
  id: string
  name: string
  display_name: string
  short_name: string
  semester: string
  startdate: number
  enddate: number
  is_current: boolean
  new_items: number
  total_items: number
  last_checked: string | null
  conniku_project_id: string | null
}

interface NewItemEntry {
  id: string
  item_name: string
  item_type: string
  topic_name: string
  detected_at: string
}

interface NewByCourse {
  [courseId: string]: { course_name: string; items: NewItemEntry[] }
}

interface HubData {
  connected: boolean
  connection?: {
    id: string
    platform_type: string
    platform_name: string
    api_url: string
    status: string
    last_scan: string | null
  }
  current_courses: CourseItem[]
  past_courses: CourseItem[]
  new_items_by_course: NewByCourse
  total_new: number
}

interface TopicItem {
  id: string
  item_name: string
  item_type: string
  item_url: string
  mime_type: string
  file_size: number
  module_name: string
  status: string
  detected_at: string
}

interface Topic {
  name: string
  order: number
  items: TopicItem[]
}

// ── Helpers visuales ───────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, string> = {
  file: '📄', url: '🔗', assignment: '📝', quiz: '🧩', page: '📰',
}
const MIME_ICON: Record<string, string> = {
  'application/pdf': '📕',
  'application/vnd.ms-powerpoint': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml': '📊',
  'application/msword': '📘',
  'application/vnd.openxmlformats-officedocument.wordprocessingml': '📘',
  'application/vnd.ms-excel': '📗',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': '📗',
  'application/zip': '🗜️',
}
function itemIcon(type: string, mime: string): string {
  if (type === 'assignment') return '📝'
  if (type === 'quiz') return '🧩'
  if (type === 'url') return '🔗'
  if (type === 'page') return '📰'
  for (const [k, v] of Object.entries(MIME_ICON)) {
    if (mime.startsWith(k)) return v
  }
  return '📄'
}
function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca sincronizado'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function MiUniversidad({ onNavigate }: Props) {
  const [view, setView] = useState<'hub' | 'course'>('hub')
  const [hub, setHub] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  // Configuración de conexión embebida dentro del módulo
  const [showConfig, setShowConfig] = useState(false)

  // Vista de asignatura
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())
  const [courseTab, setCourseTab] = useState<'modulos' | 'todo'>('modulos')

  // Modal agregar asignaturas
  const [showAddModal, setShowAddModal] = useState(false)
  const [available, setAvailable] = useState<{ en_curso: any[]; anteriores: any[] } | null>(null)
  const [availableLoading, setAvailableLoading] = useState(false)
  const [addTab, setAddTab] = useState<'en_curso' | 'anteriores'>('en_curso')
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [addProgress, setAddProgress] = useState<string[]>([])

  // Novedades + secciones colapsables
  const [novedadesOpen, setNovedadesOpen] = useState(true)
  const [pastOpen, setPastOpen] = useState(false)
  const [openNovedades, setOpenNovedades] = useState<Set<string>>(new Set())

  // Renombrar asignatura (inline)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // ── Carga hub ───────────────────────────────────────────────
  const loadHub = useCallback(async () => {
    setLoading(true)
    try {
      const data: any = await api.lmsGetHub()
      setHub(data)
    } catch {
      setHub({ connected: false, current_courses: [], past_courses: [], new_items_by_course: {}, total_new: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHub()
    // Marcar visita al abrir
    api.lmsMarkVisited().catch(() => {})
  }, [loadHub])

  // ── Escanear material nuevo ─────────────────────────────────
  const handleScan = async () => {
    setScanning(true)
    setScanMsg('⏳ Buscando material nuevo en tu campus...')
    try {
      const res: any = await api.lmsScan()
      setScanMsg(res.total_new > 0
        ? `✅ ${res.total_new} archivo${res.total_new !== 1 ? 's' : ''} nuevo${res.total_new !== 1 ? 's' : ''} encontrado${res.total_new !== 1 ? 's' : ''}`
        : '✅ Todo está al día — sin novedades')
      await loadHub()
    } catch {
      setScanMsg('⚠ No se pudo conectar con el campus virtual')
    } finally {
      setScanning(false)
      setTimeout(() => setScanMsg(''), 4000)
    }
  }

  // ── Abrir asignatura ────────────────────────────────────────
  const openCourse = async (course: CourseItem) => {
    setSelectedCourse(course)
    setView('course')
    setTopicsLoading(true)
    setTopics([])
    try {
      const data: any = await api.lmsGetTopics(course.id)
      setTopics(data.topics || [])
      // Abrir primer tema por defecto
      if (data.topics?.length > 0) {
        setOpenTopics(new Set([data.topics[0].name]))
      }
    } catch {
      setTopics([])
    } finally {
      setTopicsLoading(false)
    }
  }

  // ── Modal Agregar asignaturas ───────────────────────────────
  const openAddModal = async () => {
    if (!hub?.connection) return
    setShowAddModal(true)
    setAvailableLoading(true)
    setAvailable(null)
    setSelectedToAdd(new Set())
    try {
      const data: any = await api.lmsGetAvailable(hub.connection.id)
      setAvailable(data)
      if ((data.en_curso?.length || 0) === 0 && (data.anteriores?.length || 0) > 0) {
        setAddTab('anteriores')
      }
    } catch {
      setAvailable({ en_curso: [], anteriores: [] })
    } finally {
      setAvailableLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddCourses = async () => {
    if (!hub?.connection || selectedToAdd.size === 0) return
    setAdding(true)
    setAddProgress(['⏳ Iniciando sincronización...'])
    const ids = Array.from(selectedToAdd)
    const allCourses = [...(available?.en_curso || []), ...(available?.anteriores || [])]

    for (let i = 0; i < ids.length; i++) {
      const course = allCourses.find((c: any) => c.id === ids[i])
      if (course) {
        setAddProgress(prev => [...prev, `📥 Importando: "${course.name}"…`])
        await new Promise(r => setTimeout(r, 400))
      }
    }

    try {
      const res: any = await api.lmsAddCourses(hub.connection.id, ids)
      setAddProgress(prev => [
        ...prev,
        `✅ ${res.activated} asignatura${res.activated !== 1 ? 's' : ''} agregada${res.activated !== 1 ? 's' : ''} · ${res.total_new_items} archivos importados`,
      ])
      await loadHub()
      setTimeout(() => {
        setShowAddModal(false)
        setAdding(false)
        setAddProgress([])
      }, 1800)
    } catch {
      setAddProgress(prev => [...prev, '⚠ Ocurrió un error al agregar las asignaturas'])
      setAdding(false)
    }
  }

  // ── Re-escanear asignatura individual ─────────────────────
  const rescanCourse = async (courseId: string) => {
    try {
      setScanMsg('⏳ Actualizando asignatura...')
      await api.lmsScanCourse(courseId)
      const data: any = await api.lmsGetTopics(courseId)
      setTopics(data.topics || [])
      setScanMsg('✅ Material actualizado')
      setTimeout(() => setScanMsg(''), 3000)
    } catch {
      setScanMsg('⚠ No se pudo actualizar')
    }
  }

  // ── Marcar novedades como vistas ───────────────────────────
  const markNewSeen = async () => {
    await api.lmsMarkVisited().catch(() => {})
    setHub(prev => prev ? { ...prev, new_items_by_course: {}, total_new: 0 } : prev)
  }

  // ── Renombrar asignatura ────────────────────────────────────
  const handleRename = async (courseId: string) => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    try {
      await api.lmsRenameCourse(courseId, trimmed)
      setHub(prev => {
        if (!prev) return prev
        const update = (list: CourseItem[]) =>
          list.map(c => c.id === courseId ? { ...c, display_name: trimmed } : c)
        return { ...prev, current_courses: update(prev.current_courses), past_courses: update(prev.past_courses) }
      })
    } catch { /* silencioso */ }
    setRenamingId(null)
  }

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando tu universidad…</p>
    </div>
  )

  // Formulario de configuración/conexión embebido (sin salir del módulo)
  if (showConfig || !hub?.connected) return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 0 60px' }}>
      {hub?.connected && (
        <button onClick={() => setShowConfig(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '0 0 16px', marginBottom: 8 }}>
          ← Volver a Mi Universidad
        </button>
      )}
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          Cargando configuración…
        </div>
      }>
        <Profile
          embedded
          initialSection="universidad"
          onNavigate={(path) => {
            // Si navegan a /mi-universidad desde el form (tras conectar exitosamente), recargar el hub
            if (path === '/mi-universidad') {
              setShowConfig(false)
              loadHub()
            } else {
              onNavigate?.(path)
            }
          }}
        />
      </Suspense>
    </div>
  )

  // ── Vista detalle de asignatura ─────────────────────────────
  if (view === 'course' && selectedCourse) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 0 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setView('hub'); setSelectedCourse(null) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '6px 10px', borderRadius: 8 }}
            className="btn-ghost">
            ← Mi Universidad
          </button>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedCourse.name}
              </h2>
              {selectedCourse.short_name && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{selectedCourse.short_name}</p>
              )}
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {topics.length} módulo{topics.length !== 1 ? 's' : ''} · {topics.reduce((a, t) => a + t.items.length, 0)} archivo{topics.reduce((a, t) => a + t.items.length, 0) !== 1 ? 's' : ''}
                {selectedCourse.last_checked && ` · Actualizado ${timeAgo(selectedCourse.last_checked)}`}
              </p>
            </div>
            <button onClick={() => rescanCourse(selectedCourse.id)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              ↻ Actualizar
            </button>
          </div>
          {scanMsg && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>{scanMsg}</p>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['modulos', 'todo'] as const).map(t => (
            <button key={t} onClick={() => setCourseTab(t)}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: courseTab === t ? 600 : 400,
                background: courseTab === t ? 'var(--bg-card)' : 'transparent',
                color: courseTab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: courseTab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {t === 'modulos' ? '📚 Por módulo' : '📋 Todo el material'}
            </button>
          ))}
        </div>

        {topicsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            Cargando material de la asignatura… Esto puede tomar unos segundos dependiendo de la cantidad de archivos.
          </div>
        ) : topics.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p>No se encontró material en esta asignatura aún.</p>
            <button onClick={() => rescanCourse(selectedCourse.id)} style={{ marginTop: 12, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13 }}>
              Buscar material ahora
            </button>
          </div>
        ) : courseTab === 'modulos' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topics.map(topic => (
              <TopicAccordion key={topic.name} topic={topic}
                open={openTopics.has(topic.name)}
                onToggle={() => setOpenTopics(prev => {
                  const next = new Set(prev)
                  if (next.has(topic.name)) next.delete(topic.name)
                  else next.add(topic.name)
                  return next
                })} />
            ))}
          </div>
        ) : (
          // Vista "todo el material" — lista plana
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {topics.flatMap(t => t.items).map((item, idx) => (
              <ItemRow key={item.id} item={item} borderTop={idx > 0} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Hub principal ───────────────────────────────────────────
  const { connection, current_courses, past_courses, new_items_by_course, total_new } = hub!

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 0 60px' }}>

      {/* ── Barra de plataforma conectada — SIEMPRE ARRIBA ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(10,30,70,0.7) 0%, rgba(26,86,219,0.5) 100%)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 12, padding: '10px 16px', marginBottom: 20, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 0 6px #10b981' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{connection?.platform_name}</span>
          {connection?.last_scan && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>· {timeAgo(connection.last_scan)}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleScan} disabled={scanning}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 13px', fontSize: 12, cursor: scanning ? 'not-allowed' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>
            {scanning ? '⏳' : '↻'} Sincronizar
          </button>
          <button onClick={() => setShowConfig(true)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 13px', fontSize: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
            ⚙ Cambiar plataforma
          </button>
        </div>
      </div>

      {/* Título del módulo */}
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        🎓 Mi Universidad
      </h1>

      {scanMsg && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          {scanMsg}
        </div>
      )}

      {/* ── Semestre actual: Asignaturas ──────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            📅 Semestre actual — en curso
            {current_courses.length > 0 && (
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 99 }}>
                {current_courses.length}
              </span>
            )}
          </div>
          <button onClick={openAddModal}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 9, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            + Agregar
          </button>
        </div>

        {current_courses.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: 14, padding: '36px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>🎓</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>Aquí van tus asignaturas</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>Agrega las asignaturas del semestre actual para ver su material organizado.</p>
            <button onClick={openAddModal}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + Agregar asignaturas
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {current_courses.map(c => (
              <CourseCard
                key={c.id}
                course={c}
                onClick={() => openCourse(c)}
                renamingId={renamingId}
                renameValue={renameValue}
                onStartRename={(id, current) => { setRenamingId(id); setRenameValue(current) }}
                onRenameChange={setRenameValue}
                onRenameSubmit={handleRename}
                onRenameCancel={() => setRenamingId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Semestres anteriores (colapsable) ─────────────────── */}
      {past_courses.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => setPastOpen(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: pastOpen ? 12 : 0, width: '100%' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              🗂 Semestres anteriores ({past_courses.length})
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4, transform: pastOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)', marginLeft: 8 }} />
          </button>
          {pastOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {past_courses.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onClick={() => openCourse(c)}
                  muted
                  renamingId={renamingId}
                  renameValue={renameValue}
                  onStartRename={(id, current) => { setRenamingId(id); setRenameValue(current) }}
                  onRenameChange={setRenameValue}
                  onRenameSubmit={handleRename}
                  onRenameCancel={() => setRenamingId(null)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Material nuevo detectado (agrupado por asignatura) ── */}
      {total_new > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📥 Material nuevo detectado
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 99 }}>
                {total_new} archivo{total_new !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={markNewSeen}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 12px', fontSize: 11, cursor: 'pointer', color: 'var(--text-muted)' }}>
              ✓ Marcar todo visto
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(new_items_by_course).map(([courseId, group]) => {
              const linkedCourse = [...current_courses, ...past_courses].find(c => c.id === courseId)
              const isLinked = !!(linkedCourse?.conniku_project_id)
              const isOpen = openNovedades.has(courseId)
              const displayLabel = linkedCourse?.display_name || linkedCourse?.name || group.course_name
              return (
                <div key={courseId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden' }}>
                  {/* Header del grupo */}
                  <button
                    onClick={() => setOpenNovedades(prev => { const s = new Set(prev); s.has(courseId) ? s.delete(courseId) : s.add(courseId); return s })}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 16 }}>📘</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{displayLabel}</span>
                      <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                        {group.items.length} nuevo{group.items.length !== 1 ? 's' : ''}
                      </span>
                      {group.items[0]?.detected_at && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(group.items[0].detected_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                  </button>

                  {/* Cuerpo del grupo */}
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px' }}>
                      {/* Preview de archivos (máx 4) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                        {group.items.slice(0, 4).map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{TYPE_ICON[item.item_type] || '📄'}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</span>
                            {item.topic_name && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>{item.topic_name}</span>
                            )}
                          </div>
                        ))}
                        {group.items.length > 4 && (
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', padding: '4px 10px', fontStyle: 'italic' }}>
                            + {group.items.length - 4} archivo{group.items.length - 4 !== 1 ? 's' : ''} más...
                          </p>
                        )}
                      </div>
                      {/* Botones de acción */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isLinked ? (
                          <button
                            onClick={() => linkedCourse && openCourse(linkedCourse)}
                            style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            📌 Actualizar {displayLabel}
                          </button>
                        ) : (
                          <button
                            onClick={() => linkedCourse && openCourse(linkedCourse)}
                            style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-orange, #f97316)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            🚀 Importar asignatura
                          </button>
                        )}
                        <button
                          onClick={() => linkedCourse && openCourse(linkedCourse)}
                          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Ver todos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Modal agregar asignaturas ──────────────────────────── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Agregar asignaturas</h3>
              <button onClick={() => !adding && setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
            </div>

            {/* Progress overlay */}
            {adding && (
              <div style={{ padding: '16px 24px' }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
                  {addProgress.map((msg, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{msg}</p>
                  ))}
                  <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    💡 Este proceso puede tomar 30–90 segundos dependiendo de la cantidad de archivos y la velocidad de tu campus virtual.
                  </p>
                </div>
              </div>
            )}

            {!adding && (
              <>
                {/* Tabs */}
                <div style={{ padding: '14px 24px 0', display: 'flex', gap: 4, background: 'var(--bg-secondary)', margin: '14px 24px 0', borderRadius: 10 }}>
                  {(['en_curso', 'anteriores'] as const).map(t => (
                    <button key={t} onClick={() => setAddTab(t)}
                      style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: addTab === t ? 600 : 400,
                        background: addTab === t ? 'var(--bg-card)' : 'transparent',
                        color: addTab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {t === 'en_curso' ? `📚 En curso (${available?.en_curso?.length ?? '…'})` : `📦 Anteriores (${available?.anteriores?.length ?? '…'})`}
                    </button>
                  ))}
                </div>

                {/* Lista */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                  {availableLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                      Obteniendo asignaturas desde tu campus virtual…
                    </div>
                  ) : (() => {
                    const list = addTab === 'en_curso' ? (available?.en_curso || []) : (available?.anteriores || [])
                    if (list.length === 0) return (
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                        {addTab === 'en_curso' ? 'No hay asignaturas en curso sin agregar.' : 'No hay asignaturas anteriores disponibles.'}
                      </p>
                    )
                    return list.map((c: any) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedToAdd.has(c.id)} onChange={() => toggleSelect(c.id)}
                          style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                          {c.short_name && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{c.short_name}</p>}
                        </div>
                      </label>
                    ))
                  })()}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 24px', background: 'rgba(59,130,246,0.06)', borderTop: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    ℹ️ Importará todo el material (archivos, tareas, URLs) organizado por módulos. Puede tomar 30–90 segundos según la cantidad de archivos.
                  </p>
                </div>

                {/* Footer */}
                <div style={{ padding: '14px 24px', display: 'flex', gap: 10, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowAddModal(false)}
                    style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, fontSize: 14, cursor: 'pointer', color: 'var(--text-muted)' }}>
                    Cancelar
                  </button>
                  <button onClick={handleAddCourses} disabled={selectedToAdd.size === 0}
                    style={{ flex: 2, background: selectedToAdd.size === 0 ? 'var(--bg-secondary)' : 'var(--accent)', color: selectedToAdd.size === 0 ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 14, fontWeight: 600, cursor: selectedToAdd.size === 0 ? 'not-allowed' : 'pointer' }}>
                    Agregar {selectedToAdd.size > 0 ? `${selectedToAdd.size} asignatura${selectedToAdd.size !== 1 ? 's' : ''}` : 'asignaturas'} →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function CourseCard({
  course, onClick, muted,
  renamingId, renameValue,
  onStartRename, onRenameChange, onRenameSubmit, onRenameCancel,
}: {
  course: CourseItem
  onClick: () => void
  muted?: boolean
  renamingId: string | null
  renameValue: string
  onStartRename: (id: string, current: string) => void
  onRenameChange: (val: string) => void
  onRenameSubmit: (id: string) => void
  onRenameCancel: () => void
}) {
  const isRenaming = renamingId === course.id
  const isLinked = !!course.conniku_project_id
  const displayLabel = course.display_name || course.name
  const showOriginal = !!(course.display_name && course.display_name !== course.name)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${isLinked ? '#10b981' : '#f97316'}`,
        borderRadius: 14,
        overflow: 'hidden',
        opacity: muted ? 0.75 : 1,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
    >
      {/* Cuerpo de la card */}
      <div style={{ padding: '14px 14px 10px', flex: 1 }}>

        {/* Fila superior: ícono + badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>📘</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {course.new_items > 0 && (
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                {course.new_items} nuevo{course.new_items !== 1 ? 's' : ''}
              </span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: isLinked ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)',
              color: isLinked ? '#10b981' : '#f97316',
            }}>
              {isLinked ? '✓ Vinculada' : '⚡ Sin importar'}
            </span>
          </div>
        </div>

        {/* Nombre / input renombrar */}
        {isRenaming ? (
          <div style={{ marginBottom: 6 }}>
            <input
              autoFocus
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onRenameSubmit(course.id)
                if (e.key === 'Escape') onRenameCancel()
              }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 8,
                border: '1.5px solid var(--accent)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                onClick={e => { e.stopPropagation(); onRenameSubmit(course.id) }}
                style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Guardar
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRenameCancel() }}
                style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px', fontSize: 11, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
              {displayLabel.length > 50 ? displayLabel.slice(0, 50) + '…' : displayLabel}
            </p>
            <button
              onClick={e => { e.stopPropagation(); onStartRename(course.id, displayLabel) }}
              title="Renombrar asignatura"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '1px 3px', borderRadius: 4,
                fontSize: 12, lineHeight: 1, flexShrink: 0, marginTop: 1, opacity: 0.55,
              }}>
              ✎
            </button>
          </div>
        )}

        {/* Nombre original (clave de sync) — sólo si el usuario renombró */}
        {!isRenaming && showOriginal && (
          <p style={{
            margin: '0 0 6px', fontSize: 10, color: 'var(--text-muted)',
            fontFamily: 'monospace', letterSpacing: '0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            🔗 {course.name}
          </p>
        )}

        {/* Stats */}
        {!isRenaming && (
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            <span>📄 {course.total_items} arch.</span>
            {course.last_checked && <span>↻ {timeAgo(course.last_checked)}</span>}
          </div>
        )}
      </div>

      {/* Botón de acción inferior */}
      {!isRenaming && (
        <button
          onClick={onClick}
          style={{
            width: '100%', border: 'none', borderTop: '1px solid var(--border)',
            background: isLinked ? 'rgba(16,185,129,0.07)' : 'rgba(249,115,22,0.07)',
            color: isLinked ? '#10b981' : '#f97316',
            padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
          {isLinked ? 'Ver asignatura →' : '🚀 Importar'}
        </button>
      )}
    </div>
  )
}

function TopicAccordion({ topic, open, onToggle }: { topic: Topic; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14 }}>📁</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topic.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{topic.items.length} archivo{topic.items.length !== 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {topic.items.map((item, idx) => (
            <ItemRow key={item.id} item={item} borderTop={idx > 0} />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemRow({ item, borderTop }: { item: TopicItem; borderTop: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: borderTop ? '1px solid var(--border)' : 'none' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{itemIcon(item.item_type, item.mime_type)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</p>
        {item.module_name && item.module_name !== item.item_name && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{item.module_name}</p>
        )}
      </div>
      {item.file_size > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(item.file_size)}</span>
      )}
      {item.item_url && (
        <a href={item.item_url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Abrir
        </a>
      )}
    </div>
  )
}

