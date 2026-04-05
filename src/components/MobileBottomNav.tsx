import React from 'react'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

const NavIcon = ({ type }: { type: string }) => {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (type) {
    case 'home': return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'users': return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'chart': return <svg {...props}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
    case 'chat': return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'menu': return <svg {...props}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    default: return null
  }
}

export default function MobileBottomNav({ currentPath, onNavigate }: Props) {
  const items = [
    { icon: 'home', label: 'Inicio', path: '/' },
    { icon: 'users', label: 'Social', path: '/friends' },
    { icon: 'chart', label: 'Estudio', path: '/dashboard' },
    { icon: 'chat', label: 'Chat', path: '/messages' },
    { icon: 'menu', label: 'Más', path: '/profile' },
  ]

  return (
    <nav className="mobile-bottom-nav">
      {items.map(item => {
        const isActive = item.path === '/' ? (currentPath === '/' || currentPath === '/feed') : currentPath.startsWith(item.path)
        return (
          <button key={item.path} className={`mobile-nav-item ${isActive ? 'active' : ''}`} onClick={() => onNavigate(item.path)}>
            <span className="mobile-nav-icon"><NavIcon type={item.icon} /></span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
