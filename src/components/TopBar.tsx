import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../services/auth'
import NotificationBell from './NotificationBell'

interface Props {
  onNavigate: (path: string) => void
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export default function TopBar({ onNavigate, onMenuToggle, showMenuButton }: Props) {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showUserMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '?'

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showMenuButton && (
          <button className="topbar-hamburger" onClick={onMenuToggle} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <img src="/logo.svg" alt="Conniku" className="topbar-logo" onClick={() => onNavigate('/')} style={{ height: 28, objectFit: 'contain', cursor: 'pointer' }} />
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <span className="topbar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar personas, comunidades, temas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`)
                setSearchQuery('')
              }
            }}
          />
        </div>
      </div>

      <div className="topbar-right">
        <NotificationBell onNavigate={onNavigate} />

        <button className="topbar-icon-btn" onClick={() => onNavigate('/messages')} title="Mensajes">
          💬
        </button>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button className="topbar-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <strong>{user?.firstName} {user?.lastName}</strong>
                <span>@{user?.username}</span>
              </div>
              <button onClick={() => { onNavigate(user ? `/user/${user.id}` : '/'); setShowUserMenu(false) }}>
                👤 Mi Perfil
              </button>
              <button onClick={() => { onNavigate('/profile'); setShowUserMenu(false) }}>
                ⚙️ Ajustes
              </button>
              <button onClick={() => { onNavigate('/subscription'); setShowUserMenu(false) }}>
                💎 Suscripción
              </button>
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <button onClick={logout} style={{ color: 'var(--accent-red)' }}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
