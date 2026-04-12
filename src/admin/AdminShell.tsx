import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { X, ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  children: React.ReactNode
}

/**
 * AdminShell wraps admin modules when rendered in a standalone popup window.
 * Provides a minimal chrome with title bar and close button.
 * Auth is automatically available via same-origin localStorage.
 */
export default function AdminShell({ title, children }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isPopup] = useState(() => !!window.opener)

  useEffect(() => {
    if (isPopup) {
      document.title = `${title} — Conniku Admin`
    }
  }, [title, isPopup])

  if (!user || (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'employee')) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Acceso Restringido</h2>
        <p>Inicia sesión como CEO, administrador o con tu cuenta de empleado.</p>
      </div>
    )
  }

  // If not a popup, render with back-nav header + scrollable content area
  if (!isPopup) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Back-nav bar — always visible, never scrolls away */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 24px',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
          flexShrink: 0, zIndex: 10,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
              border: '1px solid var(--border)', borderRadius: 8, background: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <ChevronLeft size={15} /> Volver
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        {/* Content — fills remaining height, scrolls internally */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {children}
        </div>
      </div>
    )
  }

  // Popup mode: minimal shell
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Title bar */}
      <div style={{
        height: 42,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Conniku Admin</span>
        <button
          onClick={() => window.close()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'var(--text-muted)', borderRadius: 4, display: 'flex',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  )
}
