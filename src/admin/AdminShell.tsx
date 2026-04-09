import React, { useEffect, useState } from 'react'
import { useAuth } from '../services/auth'
import { X, Minimize2, Maximize2 } from 'lucide-react'

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

  // If not a popup, render children directly (embedded in main app)
  if (!isPopup) {
    return <>{children}</>
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
