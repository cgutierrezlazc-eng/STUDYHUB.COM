import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project } from '../types'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  currentPath: string
  onNavigate: (path: string) => void
  onNewProject: () => void
  className?: string
}

export default function Sidebar({ projects, activeProjectId, currentPath, onNavigate, onNewProject, className }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const fetchUnread = () => {
      api.getUnreadMessageCount()
        .then((data: any) => setUnreadMessages(data.unreadCount || 0))
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/' || currentPath === '/feed'
    return currentPath.startsWith(path)
  }

  return (
    <nav className={`sidebar ${className || ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-section-title">Social</div>
        <button className={`nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => onNavigate('/')}>
          <span className="nav-item-icon">🏠</span> Inicio
        </button>
        <button className={`nav-item ${currentPath === `/user/${user?.id}` || currentPath === '/my-profile' ? 'active' : ''}`} onClick={() => onNavigate(user ? `/user/${user.id}` : '/')}>
          <span className="nav-item-icon">👤</span> Mi Perfil
        </button>
        <button className={`nav-item ${isActive('/friends') ? 'active' : ''}`} onClick={() => onNavigate('/friends')}>
          <span className="nav-item-icon">👥</span> Comunidad
        </button>
        <button className={`nav-item ${isActive('/communities') ? 'active' : ''}`} onClick={() => onNavigate('/communities')}>
          <span className="nav-item-icon">🏘️</span> Comunidades
        </button>
        <button className={`nav-item ${isActive('/events') ? 'active' : ''}`} onClick={() => onNavigate('/events')}>
          <span className="nav-item-icon">📅</span> Eventos
        </button>
        <button className={`nav-item ${isActive('/mentorship') ? 'active' : ''}`} onClick={() => onNavigate('/mentorship')}>
          <span className="nav-item-icon">🧭</span> Mentoría
        </button>
        <button className={`nav-item ${isActive('/messages') ? 'active' : ''}`} onClick={() => onNavigate('/messages')}>
          <span className="nav-item-icon">💬</span> Mensajes
          {unreadMessages > 0 && (
            <span className="nav-item-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
          )}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Académico</div>
        <button className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`} onClick={() => onNavigate('/dashboard')}>
          <span className="nav-item-icon">📊</span> Dashboard
        </button>
        <button className={`nav-item ${isActive('/study-rooms') ? 'active' : ''}`} onClick={() => onNavigate('/study-rooms')}>
          <span className="nav-item-icon">📚</span> Salas de Estudio
        </button>
        <button className={`nav-item ${isActive('/search') ? 'active' : ''}`} onClick={() => onNavigate('/search')}>
          <span className="nav-item-icon">🔍</span> Buscador
        </button>
        <button className={`nav-item ${currentPath === '/calendar' ? 'active' : ''}`} onClick={() => onNavigate('/calendar')}>
          <span className="nav-item-icon">📅</span> Calendario
        </button>
        <button className={`nav-item ${currentPath === '/marketplace' ? 'active' : ''}`} onClick={() => onNavigate('/marketplace')}>
          <span className="nav-item-icon">📚</span> Apuntes
        </button>
        <button className={`nav-item ${isActive('/jobs') ? 'active' : ''}`} onClick={() => onNavigate('/jobs')}>
          <span className="nav-item-icon">💼</span> Oportunidades
        </button>
        <button className={`nav-item ${isActive('/courses') ? 'active' : ''}`} onClick={() => onNavigate('/courses')}>
          <span className="nav-item-icon">🌱</span> Desarrollo Integral
        </button>
      </div>

      <div className="sidebar-section sidebar-section-grow">
        <div className="sidebar-section-title">{t('nav.mySubjects')}</div>
        {projects.map(project => (
          <button key={project.id} className={`nav-item ${activeProjectId === project.id ? 'active' : ''}`} onClick={() => onNavigate(`/project/${project.id}`)}>
            <span className="project-dot" style={{ background: project.color }} />
            {project.name}
          </button>
        ))}
        <button className="nav-item nav-item-add" onClick={onNewProject}>
          <span className="nav-item-icon">+</span> {t('nav.newSubject')}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Soporte</div>
        <button className={`nav-item ${currentPath === '/subscription' ? 'active' : ''}`} onClick={() => onNavigate('/subscription')}>
          <span className="nav-item-icon">💎</span> Suscripción
        </button>
        <button className={`nav-item ${currentPath === '/suggestions' ? 'active' : ''}`} onClick={() => onNavigate('/suggestions')}>
          <span className="nav-item-icon">💡</span> Sugerencias
        </button>
        {user?.role === 'owner' && (
          <button className={`nav-item ${isActive('/ceo') ? 'active' : ''}`} onClick={() => onNavigate('/ceo')}>
            <span className="nav-item-icon">🏢</span> CEO Panel
          </button>
        )}
        {user?.isAdmin && (
          <button className={`nav-item ${currentPath === '/admin' ? 'active' : ''}`} onClick={() => onNavigate('/admin')}>
            <span className="nav-item-icon">⚙️</span> Admin
          </button>
        )}
      </div>
    </nav>
  )
}
