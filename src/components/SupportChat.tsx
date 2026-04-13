import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import {
  Users, DollarSign, TrendingUp, Scale, Settings,
  BookOpen, Calendar, ClipboardList, Brain, FileText,
  Lightbulb, User, Briefcase,
} from './Icons'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type IconFn = (p?: { size?: number; color?: string; style?: React.CSSProperties }) => React.ReactElement
type SubCat = { id: string; label: string; message: string }
type Category = { id: string; label: string; icon: IconFn; subs: SubCat[] }

const ADMIN_CATS: Category[] = [
  { id: 'rrhh', label: 'RRHH', icon: Users, subs: [
    { id: 'contratos',    label: 'Contratos',     message: 'Necesito ayuda con contratos de trabajo' },
    { id: 'vacaciones',   label: 'Vacaciones',    message: 'Tengo una consulta sobre vacaciones y días libres' },
    { id: 'licencias',    label: 'Lic. médicas',  message: 'Necesito info sobre licencias médicas y permisos' },
    { id: 'finiquitos',   label: 'Finiquitos',    message: 'Quiero calcular o procesar un finiquito' },
    { id: 'incorporar',   label: 'Incorporar',    message: 'Quiero incorporar un nuevo trabajador a la empresa' },
  ]},
  { id: 'payroll', label: 'Payroll', icon: DollarSign, subs: [
    { id: 'liquidacion',  label: 'Liquidaciones', message: 'Ayúdame con las liquidaciones de sueldo del mes' },
    { id: 'anticipo',     label: 'Anticipos',     message: 'Necesito info sobre anticipos quincenales' },
    { id: 'afp',          label: 'AFP / Salud',   message: 'Tengo dudas sobre retenciones de AFP y salud previsional' },
    { id: 'cierre',       label: 'Cierre nómina', message: 'Quiero hacer el cierre de nómina del mes' },
  ]},
  { id: 'finanzas', label: 'Finanzas', icon: TrendingUp, subs: [
    { id: 'indicadores',  label: 'UF / UTM',      message: '¿Cuáles son los indicadores económicos actuales (UF, UTM, dólar)?' },
    { id: 'facturas',     label: 'Facturación',   message: 'Necesito ayuda con facturación o cobros' },
    { id: 'gastos',       label: 'Gastos',        message: 'Tengo consultas sobre gastos de la empresa' },
  ]},
  { id: 'legal', label: 'Legal', icon: Scale, subs: [
    { id: 'obligaciones', label: 'Obligaciones',  message: 'Muéstrame las obligaciones del empleador' },
    { id: 'normativa',    label: 'Normativa',     message: 'Tengo dudas sobre normativa laboral chilena' },
    { id: 'documentos',   label: 'Generar doc',   message: 'Necesito generar un documento legal (contrato, memo, carta)' },
  ]},
  { id: 'sistema', label: 'Sistema', icon: Settings, subs: [
    { id: 'usuarios',     label: 'Usuarios',      message: 'Necesito gestionar usuarios de la plataforma' },
    { id: 'reportes',     label: 'Reportes',      message: 'Quiero generar un reporte de la plataforma' },
    { id: 'config',       label: 'Configuración', message: 'Tengo dudas sobre la configuración del sistema' },
  ]},
]

const USER_CHIPS: Category[] = [
  { id: 'cursos', label: 'Cursos', icon: BookOpen, subs: [
    { id: 'avance',       label: 'Mi avance',     message: '¿En qué cursos estoy y cuál es mi avance actual?' },
    { id: 'material',     label: 'Material',      message: '¿Cómo accedo al material de mis cursos?' },
    { id: 'certificados', label: 'Certificados',  message: '¿Qué certificados he obtenido?' },
  ]},
  { id: 'agenda', label: 'Agenda', icon: Calendar, subs: [
    { id: 'semana',       label: 'Esta semana',   message: '¿Qué tengo programado esta semana?' },
    { id: 'clases',       label: 'Próx. clases',  message: '¿Cuándo son mis próximas clases?' },
    { id: 'eventos',      label: 'Eventos',       message: '¿Qué eventos o actividades hay próximamente?' },
  ]},
  { id: 'tareas', label: 'Tareas', icon: ClipboardList, subs: [
    { id: 'pendientes',   label: 'Pendientes',    message: '¿Qué tareas tengo pendientes?' },
    { id: 'entregadas',   label: 'Entregadas',    message: 'Muéstrame mis tareas ya entregadas' },
  ]},
  { id: 'quiz', label: 'Quiz', icon: Brain, subs: [
    { id: 'practicar',    label: 'Practicar',     message: 'Quiero hacer un quiz de práctica' },
    { id: 'resultados',   label: 'Mis resultados', message: '¿Cómo me ha ido en los quizzes anteriores?' },
    { id: 'flashcards',   label: 'Flashcards',    message: '¿Cuántas flashcards tengo pendientes de repasar hoy?' },
  ]},
  { id: 'documentos', label: 'Documentos', icon: FileText, subs: [
    { id: 'mis-docs',     label: 'Mis archivos',  message: '¿Qué documentos he subido a la plataforma?' },
    { id: 'apuntes',      label: 'Apuntes',       message: '¿Cómo organizo mis apuntes y materiales de estudio?' },
  ]},
  { id: 'tutor', label: 'Orientación', icon: Lightbulb, subs: [
    { id: 'explicar',     label: 'Explicar',      message: 'Necesito que me expliques un concepto' },
    { id: 'resumen',      label: 'Resumen',       message: 'Genera un resumen del material de mis cursos' },
    { id: 'plan',         label: 'Plan de estudio', message: '¿Puedes armarme un plan de estudio?' },
  ]},
  { id: 'perfil', label: 'Mi Perfil', icon: User, subs: [
    { id: 'nivel',        label: 'Nivel y XP',    message: '¿Cuál es mi nivel, XP y racha actual?' },
    { id: 'cv',           label: 'Mi CV',         message: '¿Cómo está mi perfil profesional y CV?' },
    { id: 'suscripcion',  label: 'Suscripción',   message: '¿Cuál es mi plan activo y qué incluye?' },
  ]},
  { id: 'empleos', label: 'Empleos', icon: Briefcase, subs: [
    { id: 'ofertas',      label: 'Ver ofertas',       message: '¿Qué ofertas de trabajo hay disponibles ahora?' },
    { id: 'postular',     label: 'Cómo postular',     message: '¿Cómo postulo a una oferta en Conniku?' },
    { id: 'mis-apps',     label: 'Mis postulaciones', message: '¿A qué ofertas he postulado?' },
    { id: 'perfil-lab',   label: 'Perfil laboral',    message: '¿Cómo está mi perfil laboral y qué puedo mejorar?' },
  ]},
]

function renderMarkdown(text: string): string {
  // Pass 1: extract nav directives → placeholders (must happen before HTML-escaping)
  const navButtons: string[] = []
  let s = text.replace(/\{\{nav:([^|]+)\|([^}]+)\}\}/g, (_m, path, label) => {
    const btn = `<button class="konni-nav-btn" data-konni-nav="${path.trim()}" style="display:inline-flex;align-items:center;gap:5px;margin:4px 0;padding:6px 12px;border-radius:8px;border:1.5px solid #7C3AED;background:rgba(124,58,237,0.08);color:#7C3AED;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">→ ${label.trim()}</button>`
    navButtons.push(btn)
    return `\x00NAV${navButtons.length - 1}\x00`
  })
  // Pass 2: HTML-escape the rest
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // Pass 3: markdown transforms
  s = s.replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  s = s.replace(/^\d+\. (.+)$/gm, '&bull;&nbsp;$1')
  s = s.replace(/^[-*] (.+)$/gm, '&bull;&nbsp;$1')
  s = s.replace(/\n/g, '<br/>')
  // Pass 4: restore nav buttons
  s = s.replace(/\x00NAV(\d+)\x00/g, (_m, idx) => navButtons[Number(idx)])
  return s
}

// ─── Nodo Konni — ícono unificado ────────────────────────────────────────────
function NodoKonniIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* líneas de conexión */}
      <line x1="14" y1="14" x2="7"  y2="8"  stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="14" x2="21" y2="8"  stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="14" x2="14" y2="22" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="8"  x2="21" y2="8"  stroke="rgba(255,255,255,0.18)" strokeWidth="1"   strokeLinecap="round"/>
      {/* nodos satélite */}
      <circle cx="7"  cy="8"  r="3.2" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.2"/>
      <circle cx="21" cy="8"  r="3.2" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.2"/>
      <circle cx="14" cy="22" r="3.2" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.2"/>
      {/* nodo central */}
      <circle cx="14" cy="14" r="4.8" fill="rgba(255,255,255,0.22)" stroke="white" strokeWidth="1.8"/>
      <circle cx="14" cy="14" r="2.2" fill="white"/>
    </svg>
  )
}

export default function SupportChat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const bottomOffset = isMobile ? 80 : 24

  // Konni Admin (purple) only when owner is inside /admin-panel/*
  // Konni Blue (user) on all other pages, for everyone including owner
  const isAdmin = user?.role === 'owner' && location.pathname.startsWith('/admin-panel')

  const theme = isAdmin
    ? { gradient: 'linear-gradient(135deg, #1E0A4E 0%, #3B0E8C 50%, #5B21B6 100%)', shadow: 'rgba(30,10,78,0.55)', shadowHover: 'rgba(30,10,78,0.7)', btnFill: 'rgba(167,139,250,0.2)', accent: '#5B21B6' }
    : { gradient: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #A78BFA 100%)', shadow: 'rgba(124,58,237,0.4)', shadowHover: 'rgba(124,58,237,0.55)', btnFill: 'rgba(255,255,255,0.2)', accent: '#7C3AED' }

  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [expandedMsgs, setExpandedMsgs] = useState<Set<number>>(new Set())
  const [jobBadge, setJobBadge]     = useState(false)  // pulsing badge for new job alerts
  const lastJobCheckRef             = useRef<string>(new Date().toISOString())

  const LONG_THRESHOLD = 420 // chars — collapse messages longer than this
  const toggleExpand = (i: number) => setExpandedMsgs(prev => {
    const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next
  })

  const playJobAlert = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  // Admin navigation
  const [adminCat, setAdminCat]     = useState<Category | null>(null)  // null = grid, set = subcats
  const [adminChat, setAdminChat]   = useState(false)                   // false = home, true = chat

  // User chips
  const [chipCat, setChipCat]       = useState<Category | null>(null)  // null = main chips, set = sub-chips

  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Reset state when switching between admin panel and regular pages
    setMessages([])
    setAdminCat(null)
    setAdminChat(false)
    setChipCat(null)
    setOpen(false)
    if (!isAdmin) {
      setMessages([{ role: 'assistant', content: `Hola${user?.firstName ? `, ${user.firstName}` : ''}! Soy Konni, tu asistente personal de estudio. ¿En qué te puedo ayudar?` }])
    }
  }, [isAdmin])

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open && adminChat && inputRef.current) inputRef.current.focus()
  }, [open, adminChat])

  // Poll for new job listings every 60s (user only)
  useEffect(() => {
    if (!user || isAdmin) return
    const check = async () => {
      try {
        const res = await api.getRecentJobs(lastJobCheckRef.current)
        lastJobCheckRef.current = new Date().toISOString()
        if (res?.jobs?.length > 0) {
          const j = res.jobs[0]
          playJobAlert()
          setJobBadge(true)
          const nav = `{{nav:/jobs|Ver oferta}}`
          const alertMsg = `🔔 **Nueva oferta laboral:** ${j.jobTitle} en **${j.companyName}**${j.isRemote ? ' · Remoto' : j.location ? ` · ${j.location}` : ''}${j.jobType ? ` · ${j.jobType}` : ''}. ${nav}`
          setMessages(prev => [...prev, { role: 'assistant', content: alertMsg }])
        }
      } catch {}
    }
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [user, isAdmin])

  // When chat opens: fetch pending Konni broadcasts → inject as messages + clear badge
  useEffect(() => {
    if (!open || isAdmin || !user) return
    setJobBadge(false)
    ;(async () => {
      try {
        const res = await api.getKonniBroadcasts()
        if (res?.broadcasts?.length > 0) {
          const newMsgs: Message[] = res.broadcasts.map((b: any) => ({
            role: 'assistant' as const,
            content: `🔔 **Nueva oferta laboral:** ${b.job_title} en **${b.company_name}**${b.is_remote ? ' · Remoto' : b.location ? ` · ${b.location}` : ''}${b.job_type ? ` · ${b.job_type}` : ''}. {{nav:/jobs|Ver oferta}}`,
          }))
          setMessages(prev => [...prev, ...newMsgs])
          await api.markKonniBroadcastsRead()
        }
      } catch {}
    })()
  }, [open])

  const sendMessage = async (text: string) => {
    const msg = text.trim()
    if (!msg || loading) return
    setInput('')
    const updated: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(updated)
    setLoading(true)
    try {
      const chatFn = isAdmin ? api.supportAdminChat : api.supportChat
      const res = await chatFn(msg, updated.slice(-12))
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ups, algo salió mal. Intenta de nuevo o escribe a contacto@conniku.com.' }])
    }
    setLoading(false)
  }

  const enterAdminChat = (welcomeMsg?: string) => {
    if (welcomeMsg) {
      setMessages([{ role: 'assistant', content: welcomeMsg }])
    }
    setAdminCat(null)
    setAdminChat(true)
  }

  // ── Floating button ──────────────────────────────────────────────────────
  if (!open) {
    return (
      <div style={{ position: 'fixed', bottom: bottomOffset, right: 24, zIndex: 10000 }}>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir soporte"
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: theme.gradient, border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 16px ${theme.shadow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 6px 24px ${theme.shadowHover}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${theme.shadow}` }}
        >
          <NodoKonniIcon size={26} />
        </button>
        {jobBadge && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 14, height: 14, borderRadius: '50%',
            background: '#EF4444', border: '2px solid var(--bg-primary)',
            animation: 'pulse 1.2s infinite',
          }} />
        )}
      </div>
    )
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const header = (
    <div style={{
      padding: '14px 16px', background: theme.gradient, color: '#fff',
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '10px',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <NodoKonniIcon size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{isAdmin ? 'Konni Admin' : 'Konni — Soporte'}</div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>{isAdmin ? 'Asistente Ejecutivo' : 'Especialista de Conniku'}</div>
      </div>
      {/* Admin: "Menú" button when in chat */}
      {isAdmin && adminChat && (
        <button
          onClick={() => { setAdminChat(false); setAdminCat(null) }}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            color: '#fff', borderRadius: 8, padding: '5px 9px', fontSize: 12,
            fontFamily: 'inherit', fontWeight: 600, marginRight: 4,
          }}
        >
          ⊞ Menú
        </button>
      )}
      <button onClick={() => setOpen(false)} style={{
        background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
        color: '#fff', borderRadius: 8, padding: '6px 8px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )

  // ── Admin home screen (Idea 1) ────────────────────────────────────────────
  if (isAdmin && !adminChat) {
    return (
      <div style={{
        position: 'fixed', bottom: bottomOffset, right: 24, zIndex: 10000,
        width: 380, maxWidth: 'calc(100vw - 32px)',
        height: 520, maxHeight: 'calc(100vh - 100px)',
        borderRadius: 16, overflow: 'hidden',
        background: 'var(--bg-primary)', border: '1px solid var(--border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {header}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 16px' }}>
          {!adminCat ? (
            <>
              {/* Category grid */}
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                ¿En qué área necesitas ayuda?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ADMIN_CATS.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setAdminCat(cat)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '16px 8px',
                      borderRadius: 12, border: '1.5px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = theme.accent; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)' }}
                  >
                    <span style={{ color: theme.accent, display: 'flex' }}>{cat.icon({ size: 22 })}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Subcategory chips */}
              <button
                onClick={() => setAdminCat(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'inherit',
                  padding: '0 0 12px', marginBottom: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Volver
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ color: theme.accent, display: 'flex' }}>{adminCat.icon({ size: 20 })}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{adminCat.label}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {adminCat.subs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      enterAdminChat()
                      sendMessage(sub.message)
                    }}
                    style={{
                      padding: '8px 14px', borderRadius: 20,
                      border: `1.5px solid ${theme.accent}`,
                      background: 'var(--bg-secondary)',
                      color: theme.accent,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = theme.accent; b.style.color = '#fff' }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--bg-secondary)'; b.style.color = theme.accent }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* "Hablar con Konni" button */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={() => enterAdminChat(`Hola${user?.firstName ? `, ${user.firstName}` : ''}! Soy Konni Admin, tu asistente ejecutivo. ¿En qué te puedo ayudar hoy?`)}
            style={{
              width: '100%', padding: '11px', borderRadius: 12,
              border: `1.5px solid ${theme.accent}`,
              background: 'transparent', color: theme.accent,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = theme.accent; b.style.color = '#fff' }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = theme.accent }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Hablar con Konni
          </button>
        </div>
      </div>
    )
  }

  // ── Chat view (admin in chat mode, or user always) ────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: bottomOffset, right: 24, zIndex: 10000,
      width: 380, maxWidth: 'calc(100vw - 32px)',
      height: 520, maxHeight: 'calc(100vh - 100px)',
      borderRadius: 16, overflow: 'hidden',
      background: 'var(--bg-primary)', border: '1px solid var(--border)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
    }}>
      {header}

      {/* Messages */}
      <div
        ref={messagesRef}
        onClick={(e) => {
          const btn = (e.target as HTMLElement).closest('[data-konni-nav]') as HTMLElement | null
          if (btn) { navigate(btn.dataset.konniNav!); setOpen(false) }
        }}
        style={{
          flex: 1, overflow: 'auto', padding: 12,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        {messages.map((msg, i) => {
          const isLong = msg.role === 'assistant' && msg.content.length > LONG_THRESHOLD
          const isExpanded = expandedMsgs.has(i)
          return (
            <React.Fragment key={i}>
              <div style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user'
                  ? theme.gradient
                  : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                position: 'relative',
                maxHeight: isLong && !isExpanded ? '8.5em' : undefined,
                overflow: isLong && !isExpanded ? 'hidden' : undefined,
              }}>
                {msg.role === 'assistant'
                  ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  : msg.content}
                {isLong && !isExpanded && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
                    background: 'linear-gradient(transparent, var(--bg-secondary))',
                    borderRadius: '0 0 14px 4px',
                  }} />
                )}
              </div>
              {isLong && (
                <button
                  onClick={() => toggleExpand(i)}
                  style={{
                    alignSelf: 'flex-start', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)',
                    fontSize: 11, padding: '0 4px 4px', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >
                  {isExpanded
                    ? <><span>▲</span> Ver menos</>
                    : <><span>▼</span> Ver respuesta completa</>}
                </button>
              )}
            </React.Fragment>
          )
        })}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '10px 14px',
            borderRadius: '14px 14px 14px 4px',
            background: 'var(--bg-secondary)', fontSize: 13,
          }}>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse 1.4s infinite ${delay}s` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* User: unified 4×2 chip grid + sub-chips */}
      {!isAdmin && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', flexShrink: 0 }}>
          {!chipCat ? (
            // 4×2 grid — all 8 categories visible at once
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {USER_CHIPS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setChipCat(cat)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 4px', borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--bg-tertiary)' }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border)'; b.style.background = 'var(--bg-secondary)' }}
                >
                  <span style={{ color: 'var(--accent)', display: 'flex' }}>{cat.icon({ size: 16 })}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
                </button>
              ))}
            </div>
          ) : (
            // Sub-chips — back button + wrapping pills
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <button
                  onClick={() => setChipCat(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '3px 9px', borderRadius: 12,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Volver
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'var(--accent)', display: 'flex' }}>{chipCat.icon({ size: 14 })}</span>
                  {chipCat.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {chipCat.subs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setChipCat(null); sendMessage(sub.message) }}
                    style={{
                      padding: '5px 12px', borderRadius: 16, whiteSpace: 'nowrap',
                      border: '1.5px solid var(--accent)',
                      background: 'var(--bg-secondary)', color: 'var(--accent)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--accent)'; b.style.color = '#fff' }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--bg-secondary)'; b.style.color = 'var(--accent)' }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder={isAdmin ? 'Pregunta sobre admin, HR, finanzas...' : 'Escribe tu pregunta...'}
          style={{
            flex: 1, padding: '10px 14px',
            borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 14px', borderRadius: 12, border: 'none',
            background: input.trim() ? (isAdmin ? '#7C3AED' : 'var(--accent)') : 'var(--bg-tertiary)',
            color: input.trim() ? '#fff' : 'var(--text-muted)',
            cursor: input.trim() ? 'pointer' : 'default',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill={input.trim() ? 'rgba(255,255,255,0.2)' : 'none'}/>
          </svg>
        </button>
      </div>
    </div>
  )
}
