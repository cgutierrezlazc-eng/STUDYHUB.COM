import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function renderMarkdown(text: string): string {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic (single asterisk, not double)
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  // Numbered list → bullet character
  s = s.replace(/^\d+\. (.+)$/gm, '&bull;&nbsp;$1')
  // Dash/asterisk bullet → bullet character
  s = s.replace(/^[-*] (.+)$/gm, '&bull;&nbsp;$1')
  // Newlines → <br>
  s = s.replace(/\n/g, '<br/>')
  return s
}

export default function SupportChat() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'owner'

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: isAdmin
      ? 'Hola! Soy Konni Admin, tu asistente ejecutivo. Puedo ayudarte con HR, payroll, finanzas, legal y todo lo del panel de administracion.'
      : 'Hola! Soy Konni, tu asistente personal de estudio. En que te puedo ayudar?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Theme colors based on role
  const theme = isAdmin
    ? { gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)', shadow: 'rgba(124,58,237,0.4)', shadowHover: 'rgba(124,58,237,0.5)', btnFill: 'rgba(167,139,250,0.2)' }
    : { gradient: 'linear-gradient(135deg, #2D62C8, #4f8cff)', shadow: 'rgba(45,98,200,0.4)', shadowHover: 'rgba(45,98,200,0.5)', btnFill: 'rgba(255,255,255,0.2)' }

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  // Reset welcome message when role changes
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: isAdmin
        ? 'Hola! Soy Konni Admin, tu asistente ejecutivo. Puedo ayudarte con HR, payroll, finanzas, legal y todo lo del panel de administracion.'
        : 'Hola! Soy Konni, tu asistente personal de estudio. En que te puedo ayudar?'
    }])
  }, [isAdmin])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const chatFn = isAdmin ? api.supportAdminChat : api.supportChat
      const res = await chatFn(msg, newMessages.slice(-12))
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ups, algo salio mal. Intenta de nuevo o escribe a contacto@conniku.com.' }])
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir soporte"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
          width: 56, height: 56, borderRadius: '50%',
          background: theme.gradient,
          border: 'none', cursor: 'pointer',
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

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
      width: 380, maxWidth: 'calc(100vw - 32px)',
      height: 520, maxHeight: 'calc(100vh - 100px)',
      borderRadius: 16, overflow: 'hidden',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: theme.gradient,
        color: '#fff',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {isAdmin ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" /></svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {isAdmin ? 'Konni Admin' : 'Konni — Soporte'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {isAdmin ? 'Asistente Ejecutivo' : 'Asistente IA de Conniku'}
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
          color: '#fff', borderRadius: 8, padding: '6px 8px', fontSize: 16,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{
        flex: 1, overflow: 'auto', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: msg.role === 'user'
              ? (isAdmin ? '#7C3AED' : 'var(--accent)')
              : 'var(--bg-secondary)',
            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
            fontSize: 13,
            lineHeight: 1.5,
            wordBreak: 'break-word',
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
            <span className="loading-dots" style={{ display: 'inline-flex', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.4s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.4s infinite 0.2s' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.4s infinite 0.4s' }} />
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={isAdmin ? 'Pregunta sobre admin, HR, finanzas...' : 'Escribe tu pregunta...'}
          style={{
            flex: 1, padding: '10px 14px',
            borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 13, fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding: '10px 14px', borderRadius: 12, border: 'none',
          background: input.trim()
            ? (isAdmin ? '#7C3AED' : 'var(--accent)')
            : 'var(--bg-tertiary)',
          color: input.trim() ? '#fff' : 'var(--text-muted)',
          cursor: input.trim() ? 'pointer' : 'default',
          fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill={input.trim() ? 'rgba(255,255,255,0.2)' : 'none'} />
          </svg>
        </button>
      </div>
    </div>
  )
}
