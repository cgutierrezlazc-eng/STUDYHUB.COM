import React from 'react'
import { hapticTap } from '../services/capacitor'

interface MobileBottomNavProps {
  currentPath: string
  onNavigate: (path: string) => void
  unreadMessages?: number
  friendRequests?: number
}

const navItems = [
  { path: '/', icon: '👤', label: 'Perfil', match: (p: string) => p === '/' },
  { path: '/dashboard', icon: '📊', label: 'Inicio', match: (p: string) => p === '/dashboard' || p.startsWith('/project/') },
  { path: '/messages', icon: '💬', label: 'Mensajes', match: (p: string) => p.startsWith('/messages'), badge: 'messages' as const },
  { path: '/friends', icon: '👥', label: 'Social', match: (p: string) => p.startsWith('/friends') || p.startsWith('/user/'), badge: 'friends' as const },
  { path: '/profile', icon: '⚙️', label: 'Ajustes', match: (p: string) => p === '/profile' || p === '/suggestions' },
]

export default function MobileBottomNav({ currentPath, onNavigate, unreadMessages = 0, friendRequests = 0 }: MobileBottomNavProps) {
  const handleNav = (path: string) => {
    hapticTap()
    onNavigate(path)
  }

  return (
    <nav className="mobile-bottom-nav mobile-only">
      {navItems.map((item) => {
        const isActive = item.match(currentPath)
        const badgeCount = item.badge === 'messages' ? unreadMessages : item.badge === 'friends' ? friendRequests : 0

        return (
          <button
            key={item.path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
            style={{ minHeight: 'auto', minWidth: 'auto' }}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
            {badgeCount > 0 && (
              <span className="mobile-nav-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
