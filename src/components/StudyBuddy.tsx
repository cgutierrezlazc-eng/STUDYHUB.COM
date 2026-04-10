import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import { Sparkles, Send, X, ChevronDown } from './Icons'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  context?: string  // e.g., "Materia: Calculo II" or "Pagina: Feed"
  projectId?: string // if on a subject page, use project-specific chat
}

export default function StudyBuddy({ context, projectId }: Props) {
  const { user } = useAuth()
  const isTutor = !!(user as any)?.offersMentoring
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
        // Use project-specific chat with context
        const result = await api.chat(projectId, text)
        response = result.response
      } else {
        // Use general study buddy
        const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        const result = await api.studyBuddy(text, context || '', history)
        response = result.response
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err: any) {
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

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="study-buddy-fab press-feedback"
          onClick={() => setOpen(true)}
          title={isTutor ? 'Konni — Asistente para tutores' : 'Konni — Resuelve tus dudas'}
          style={isTutor ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.45)' } : undefined}
        >
          {Sparkles({ size: 22, color: '#fff' })}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="study-buddy-panel">
          {/* Header */}
          <div className="study-buddy-header" style={isTutor ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)' } : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="study-buddy-avatar">
                {Sparkles({ size: 16, color: '#fff' })}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Konni{isTutor ? ' · Tutor' : ''}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {context || 'Preguntame lo que quieras'}
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
                  {Sparkles({ size: 32, color: 'var(--accent)' })}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Hola{user?.firstName ? `, ${user.firstName}` : ''}! Soy tu Study Buddy</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Preguntame sobre cualquier tema de estudio y te ayudo.
                </div>
                <div className="study-buddy-suggestions">
                  {[
                    'Explicame integrales por sustitucion',
                    'Como resuelvo ecuaciones diferenciales?',
                    'Dame un resumen de termodinamica',
                  ].map((q, i) => (
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
                  <div className="study-buddy-msg-avatar">
                    {Sparkles({ size: 12, color: '#fff' })}
                  </div>
                )}
                <div className="study-buddy-msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="study-buddy-msg assistant">
                <div className="study-buddy-msg-avatar">
                  {Sparkles({ size: 12, color: '#fff' })}
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
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="study-buddy-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              {Send({ size: 16 })}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
