import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import { Sparkles, Send, ChevronDown } from './Icons'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  context?: string  // e.g., "Materia: Calculo II" o "Pagina: Feed"
  projectId?: string // si está en una asignatura, usa chat del proyecto
}

// ─── Paleta dorada para tutores aprobados ───────────────────────────────────
const GOLD = {
  fab:    'linear-gradient(135deg, #92400e 0%, #d97706 45%, #f59e0b 75%, #fbbf24 100%)',
  header: 'linear-gradient(135deg, #78350f 0%, #b45309 40%, #d97706 80%, #f59e0b 100%)',
  shadow: 'rgba(217,119,6,0.55)',
  accent: '#f59e0b',
  ring:   '0 0 0 2px #fbbf24, 0 4px 20px rgba(217,119,6,0.55)',
}

function GoldCrownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5">
      <path d="M2 17l3-9 4.5 5.5L12 6l2.5 7.5L19 8l3 9H2z" />
      <path d="M2 20h20" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GoldSparkleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" fill="rgba(255,255,255,0.25)" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

export default function StudyBuddy({ context, projectId }: Props) {
  const { user } = useAuth()
  const [isApprovedTutor, setIsApprovedTutor] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Verificar si el usuario es tutor aprobado (solo si offersMentoring=true)
  useEffect(() => {
    if (!(user as any)?.offersMentoring) return
    api.getMyTutorProfile()
      .then((p: any) => { if (p?.status === 'approved') setIsApprovedTutor(true) })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      let response: string
      if (projectId) {
        const result = await api.chat(projectId, text)
        response = result.response
      } else {
        const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        const result = await api.studyBuddy(text, context || '', history)
        response = result.response
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.'
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Sugerencias según rol ─────────────────────────────────────
  const suggestions = isApprovedTutor
    ? [
        '¿Cómo estructuro una clase de 60 minutos?',
        'Dame ideas para explicar derivadas paso a paso',
        'Crea una evaluación corta de 5 preguntas',
      ]
    : [
        'Explicame integrales por sustitución',
        '¿Cómo resuelvo ecuaciones diferenciales?',
        'Dame un resumen de termodinámica',
      ]

  return (
    <>
      {/* ─── Floating Button ─── */}
      {!open && (
        <button
          className="study-buddy-fab press-feedback"
          onClick={() => setOpen(true)}
          title={isApprovedTutor ? 'Konni Dorado — Asistente de tutorías' : 'Konni — Resuelve tus dudas'}
          style={isApprovedTutor ? {
            background: GOLD.fab,
            boxShadow: GOLD.ring,
          } : undefined}
        >
          {isApprovedTutor
            ? <GoldSparkleIcon size={22} />
            : Sparkles({ size: 22, color: '#fff' })
          }
          {/* Corona dorada para tutores aprobados */}
          {isApprovedTutor && (
            <span style={{
              position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
              fontSize: 13, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
              pointerEvents: 'none', userSelect: 'none',
            }}>👑</span>
          )}
        </button>
      )}

      {/* ─── Chat Panel ─── */}
      {open && (
        <div className="study-buddy-panel">
          {/* Header */}
          <div
            className="study-buddy-header"
            style={isApprovedTutor ? { background: GOLD.header } : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className="study-buddy-avatar"
                style={isApprovedTutor ? {
                  background: 'rgba(255,255,255,0.18)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                } : undefined}
              >
                {isApprovedTutor
                  ? <GoldCrownIcon />
                  : Sparkles({ size: 16, color: '#fff' })
                }
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                  Konni
                  {isApprovedTutor && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
                      letterSpacing: '0.05em',
                    }}>
                      TUTOR ✦
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {context || (isApprovedTutor ? 'Tu asistente de tutorías' : 'Pregúntame lo que quieras')}
                </div>
              </div>
            </div>
            <button className="study-buddy-close" onClick={() => setOpen(false)}>
              {ChevronDown({ size: 18 })}
            </button>
          </div>

          {/* Messages */}
          <div className="study-buddy-messages" ref={chatRef}>
            {messages.length === 0 && (
              <div className="study-buddy-welcome">
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {isApprovedTutor
                    ? <span style={{ fontSize: 32 }}>🏆</span>
                    : Sparkles({ size: 32, color: 'var(--accent)' })
                  }
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {isApprovedTutor
                    ? `Hola${user?.firstName ? `, ${user.firstName}` : ''}! Soy Konni 👑`
                    : `Hola${user?.firstName ? `, ${user.firstName}` : ''}! Soy tu Study Buddy`
                  }
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {isApprovedTutor
                    ? 'Te ayudo a preparar clases, crear evaluaciones y mejorar tus tutorías.'
                    : 'Pregúntame sobre cualquier tema de estudio y te ayudo.'
                  }
                </div>
                <div className="study-buddy-suggestions">
                  {suggestions.map((q, i) => (
                    <button key={i} className="study-buddy-suggestion" onClick={() => {
                      setInput(q)
                      setTimeout(() => inputRef.current?.focus(), 50)
                    }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`study-buddy-msg ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div
                    className="study-buddy-msg-avatar"
                    style={isApprovedTutor ? { background: GOLD.accent } : undefined}
                  >
                    {isApprovedTutor
                      ? <span style={{ fontSize: 10 }}>✦</span>
                      : Sparkles({ size: 12, color: '#fff' })
                    }
                  </div>
                )}
                <div className="study-buddy-msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="study-buddy-msg assistant">
                <div
                  className="study-buddy-msg-avatar"
                  style={isApprovedTutor ? { background: GOLD.accent } : undefined}
                >
                  {isApprovedTutor
                    ? <span style={{ fontSize: 10 }}>✦</span>
                    : Sparkles({ size: 12, color: '#fff' })
                  }
                </div>
                <div className="study-buddy-msg-bubble study-buddy-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="study-buddy-input">
            <input
              ref={inputRef}
              type="text"
              placeholder={isApprovedTutor ? 'Pregunta sobre tutorías...' : 'Escribe tu pregunta...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="study-buddy-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={isApprovedTutor ? { background: GOLD.accent } : undefined}
            >
              {Send({ size: 16 })}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
