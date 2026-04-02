import React from 'react'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

export default function MobileBottomNav({ currentPath, onNavigate }: Props) {
  const items = [
    { icon: '🏠', label: 'Inicio', path: '/' },
    { icon: '👥', label: 'Social', path: '/friends' },
    { icon: '📊', label: 'Estudio', path: '/dashboard' },
    { icon: '💬', label: 'Chat', path: '/messages' },
    { icon: '☰', label: 'Más', path: '/profile' },
  ]

  return (
    <nav className="mobile-bottom-nav">
      {items.map(item => {
        const isActive = item.path === '/' ? (currentPath === '/' || currentPath === '/feed') : currentPath.startsWith(item.path)
        return (
          <button key={item.path} className={`mobile-nav-item ${isActive ? 'active' : ''}`} onClick={() => onNavigate(item.path)}>
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
