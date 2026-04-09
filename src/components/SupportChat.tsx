import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type SubCat = { id: string; label: string; message: string }
type Category = { id: string; label: string; emoji: string; subs: SubCat[] }

const ADMIN_CATS: Category[] = [
  { id: 'rrhh', label: 'RRHH', emoji: '👥', subs: [
    { id: 'contratos',    label: 'Contratos',     message: 'Necesito ayuda con contratos de trabajo' },
    { id: 'vacaciones',   label: 'Vacaciones',    message: 'Tengo una consulta sobre vacaciones y días libres' },
    { id: 'licencias',    label: 'Lic. médicas',  message: 'Necesito info sobre licencias médicas y permisos' },
    { id: 'finiquitos',   label: 'Finiquitos',    message: 'Quiero calcular o procesar un finiquito' },
    { id: 'incorporar',   label: 'Incorporar',    message: 'Quiero incorporar un nuevo trabajador a la empresa' },
  ]},
  { id: 'payroll', label: 'Payroll', emoji: '💰', subs: [
    { id: 'liquidacion',  label: 'Liquidaciones', message: 'Ayúdame con las liquidaciones de sueldo del mes' },
    { id: 'anticipo',     label: 'Anticipos',     message: 'Necesito info sobre anticipos quincenales' },
    { id: 'afp',          label: 'AFP / Salud',   message: 'Tengo dudas sobre retenciones de AFP y salud previsional' },
    { id: 'cierre',       label: 'Cierre nómina', message: 'Quiero hacer el cierre de nómina del mes' },
  ]},
  { id: 'finanzas', label: 'Finanzas', emoji: '📊', subs: [
    { id: 'indicadores',  label: 'UF / UTM',      message: '¿Cuáles son los indicadores económicos actuales (UF, UTM, dólar)?' },
    { id: 'facturas',     label: 'Facturación',   message: 'Necesito ayuda con facturación o cobros' },
    { id: 'gastos',       label: 'Gastos',        message: 'Tengo consultas sobre gastos de la empresa' },
  ]},
  { id: 'legal', label: 'Legal', emoji: '⚖️', subs: [
    { id: 'obligaciones', label: 'Obligaciones',  message: 'Muéstrame las obligaciones del empleador' },
    { id: 'normativa',    label: 'Normativa',     message: 'Tengo dudas sobre normativa laboral chilena' },
    { id: 'documentos',   label: 'Generar doc',   message: 'Necesito generar un documento legal (contrato, memo, carta)' },
  ]},
  { id: 'sistema', label: 'Sistema', emoji: '🔧', subs: [
    { id: 'usuarios',     label: 'Usuarios',      message: 'Necesito gestionar usuarios de la plataforma' },
    { id: 'reportes',     label: 'Reportes',      message: 'Quiero generar un reporte de la plataforma' },
    { id: 'config',       label: 'Configuración', message: 'Tengo dudas sobre la configuración del sistema' },
  ]},
]

const USER_CHIPS: Category[] = [
  { id: 'cursos', label: 'Cursos', emoji: '📚', subs: [
    { id: 'mis-cursos',   label: 'Mis cursos',    message: '¿En qué cursos estoy inscrito actualmente?' },
    { id: 'material',     label: 'Material',      message: '¿Cómo accedo al material de mis cursos?' },
    { id: 'certificados', label: 'Certificados',  message: '¿Cómo obtengo mi certificado de un curso?' },
  ]},
  { id: 'tareas', label: 'Tareas', emoji: '📝', subs: [
    { id: 'pendientes',   label: 'Pendientes',    message: '¿Qué tareas tengo pendientes?' },
    { id: 'entregadas',   label: 'Entregadas',    message: 'Muéstrame mis tareas ya entregadas' },
  ]},
  { id: 'quiz', label: 'Quiz', emoji: '🧠', subs: [
    { id: 'practicar',    label: 'Practicar',     message: 'Quiero hacer un quiz de práctica' },
    { id: 'resultados',   label: 'Resultados',    message: 'Muéstrame mis resultados de quizzes anteriores' },
  ]},
  { id: 'tutor', label: 'Tutor IA', emoji: '💡', subs: [
    { id: 'explicar',     label: 'Explicar',      message: 'Necesito que me expliques un concepto' },
    { id: 'resumen',      label: 'Resumen',       message: 'Genera un resumen del material de mis cursos' },
    { id: 'flashcards',   label: 'Flashcards',    message: 'Quiero repasar con flashcards' },
  ]},
  { id: 'agenda', label: 'Agenda', emoji: '⏰', subs: [
    { id: 'clases',       label: 'Próx. clases',  message: '¿Cuándo son mis próximas clases?' },
    { id: 'eventos',      label: 'Eventos',       message: '¿Qué eventos o actividades hay próximamente?' },
  ]},
]

function renderMarkdown(text: string): string {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Headers ## → bold (strip # prefix)
  s = s.replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  s = s.replace(/^\d+\. (.+)$/gm, '&bull;&nbsp;$1')
  s = s.replace(/^[-*] (.+)$/gm, '&bull;&nbsp;$1')
  s = s.replace(/\n/g, '<br/>')
  return s
}

export default function SupportChat() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'owner'

  const theme = isAdmin
    ? { gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)', shadow: 'rgba(124,58,237,0.4)', shadowHover: 'rgba(124,58,237,0.5)', btnFill: 'rgba(167,139,250,0.2)', accent: '#7C3AED' }
    : { gradient: 'linear-gradient(135deg, #2D62C8, #4f8cff)', shadow: 'rgba(45,98,200,0.4)', shadowHover: 'rgba(45,98,200,0.5)', btnFill: 'rgba(255,255,255,0.2)', accent: 'var(--accent)' }

  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)

  // Admin navigation
  const [adminCat, setAdminCat]     = useState<Category | null>(null)  // null = grid, set = subcats
  const [adminChat, setAdminChat]   = useState(false)                   // false = home, true = chat

  // User chips
  const [chipCat, setChipCat]       = useState<Category | null>(null)  // null = main chips, set = sub-chips

  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Reset state on role change
    setMessages([])
    setAdminCat(null)
    setAdminChat(false)
    setChipCat(null)
    if (!isAdmin) {
      setMessages([{ role: 'assistant', content: 'Hola! Soy Konni, tu asistente personal de estudio. ¿En qué te puedo ayudar?' }])
    }
  }, [isAdmin])

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open && adminChat && inputRef.current) inputRef.current.focus()
  }, [open, adminChat])

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
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir soporte"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
          width: 56, height: 56, borderRadius: '50%',
          background: theme.gradient, border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 16px ${theme.shadow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 6px 24px ${theme.shadowHover}` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${theme.shadow}` }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill={theme.btnFill} />
        </svg>
      </button>
    )
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const header = (
    <div style={{
      padding: '14px 16px', background: theme.gradient, color: '#fff',
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isAdmin ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{isAdmin ? 'Konni Admin' : 'Konni — Soporte'}</div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>{isAdmin ? 'Asistente Ejecutivo' : 'Asistente IA de Conniku'}</div>
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
        position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
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
                    <span style={{ fontSize: 26 }}>{cat.emoji}</span>
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
                <span style={{ fontSize: 22 }}>{adminCat.emoji}</span>
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
            onClick={() => enterAdminChat('Hola! Soy Konni Admin, tu asistente ejecutivo. ¿En qué te puedo ayudar hoy?')}
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
      position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
      width: 380, maxWidth: 'calc(100vw - 32px)',
      height: 520, maxHeight: 'calc(100vh - 100px)',
      borderRadius: 16, overflow: 'hidden',
      background: 'var(--bg-primary)', border: '1px solid var(--border)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
    }}>
      {header}

      {/* Messages */}
      <div ref={messagesRef} style={{
        flex: 1, overflow: 'auto', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', padding: '10px 14px',
            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: msg.role === 'user'
              ? (isAdmin ? '#7C3AED' : 'var(--accent)')
              : 'var(--bg-secondary)',
            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
            fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
          }}>
            {msg.role === 'assistant'
              ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              : msg.content}
          </div>
        ))}
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

      {/* User: quick-action chips bar */}
      {!isAdmin && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '8px 10px',
          display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0,
          scrollbarWidth: 'none',
        }}>
          {!chipCat ? (
            // Main chips
            USER_CHIPS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setChipCat(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 16, whiteSpace: 'nowrap',
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--accent)'; b.style.color = 'var(--accent)' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border)'; b.style.color = 'var(--text-secondary)' }}
              >
                <span>{cat.emoji}</span>{cat.label}
              </button>
            ))
          ) : (
            // Sub-chips
            <>
              <button
                onClick={() => setChipCat(null)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '5px 8px', borderRadius: 16, whiteSpace: 'nowrap',
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0, paddingRight: 2 }}>
                {chipCat.emoji} {chipCat.label}:
              </span>
              {chipCat.subs.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => { setChipCat(null); sendMessage(sub.message) }}
                  style={{
                    padding: '5px 11px', borderRadius: 16, whiteSpace: 'nowrap',
                    border: '1.5px solid var(--accent)',
                    background: 'var(--bg-secondary)', color: 'var(--accent)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--accent)'; b.style.color = '#fff' }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--bg-secondary)'; b.style.color = 'var(--accent)' }}
                >
                  {sub.label}
                </button>
              ))}
            </>
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
