import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../services/auth'
import NotificationBell from './NotificationBell'

interface Props {
  onNavigate: (path: string) => void
}

export default function TopBar({ onNavigate }: Props) {
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
