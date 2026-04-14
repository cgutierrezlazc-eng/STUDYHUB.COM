import React, { useState, useEffect, useCallback } from 'react'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

const NavIcon = ({ type }: { type: string }) => {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (type) {
    case 'home': return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'book': return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    case 'chat': return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'user': return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'menu': return <svg {...props}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    case 'community': return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'calendar': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    default: return null
  }
}

const moreMenuItems = [
  { icon: 'community', label: 'Comunidades', path: '/communities' },
  { icon: 'calendar', label: 'Calendario', path: '/calendar' },
  { icon: 'search', label: 'Busqueda', path: '/search' },
  { icon: 'user', label: 'Tutores', path: '/tutores' },
  { icon: 'book', label: 'Trabajos Grupales', path: '/group-docs' },
]

export default function MobileBottomNav({ currentPath, onNavigate }: Props) {
  const [showMore, setShowMore] = useState(false)
  const [navOpen, setNavOpen] = useState(true)

  // Close bottom sheet on route change
  useEffect(() => {
    setShowMore(false)
  }, [currentPath])

  // Close on escape key
  useEffect(() => {
    if (!showMore) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMore(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showMore])

  const handleMoreItemClick = useCallback((path: string) => {
    setShowMore(false)
    onNavigate(path)
  }, [onNavigate])

  const items = [
    { icon: 'book', label: 'Estudio', path: '/dashboard' },
    { icon: 'chat', label: 'Chat', path: '/messages' },
    { icon: 'user', label: 'Perfil', path: '/my-profile' },
  ]

  return (
    <>
      {/* Bottom sheet overlay */}
      {showMore && (
        <div className="mobile-more-overlay" onClick={() => setShowMore(false)}>
          <div className="mobile-more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-handle" />
            <div className="mobile-more-items">
              {moreMenuItems.map(item => (
                <button
                  key={item.path}
                  className={`mobile-more-item ${currentPath.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => handleMoreItemClick(item.path)}
                >
                  <span className="mobile-more-icon"><NavIcon type={item.icon} /></span>
                  <span className="mobile-more-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav wrapper — slides down when hidden, exposing only the toggle handle */}
      <div
        className="mobile-bottom-nav-wrapper"
        style={{
          transform: navOpen ? 'translateY(0)' : 'translateY(var(--bottom-nav-height))',
        }}
      >
        <nav className="mobile-bottom-nav">
          {items.map(item => {
            const isActive = currentPath.startsWith(item.path)
            return (
              <button key={item.path} className={`mobile-nav-item ${isActive ? 'active' : ''}`} onClick={() => { setShowMore(false); onNavigate(item.path) }}>
                <span className="mobile-nav-icon"><NavIcon type={item.icon} /></span>
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            )
          })}
          <button
            className={`mobile-nav-item ${showMore ? 'active' : ''}`}
            onClick={() => setShowMore(!showMore)}
          >
            <span className="mobile-nav-icon"><NavIcon type="menu" /></span>
            <span className="mobile-nav-label">Mas</span>
          </button>
        </nav>

        {/* Toggle handle — always visible, click to show/hide nav */}
        <div
          className={`mobile-nav-handle${navOpen ? '' : ' nav-closed'}`}
          onClick={() => { setNavOpen(v => !v); setShowMore(false) }}
          role="button"
          aria-label={navOpen ? 'Ocultar navegación' : 'Mostrar navegación'}
        >
          <div className="mobile-nav-handle-pill" />
        </div>
      </div>
    </>
  )
}
