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

/* Compact SVG icon helper — Lucide-style stroke icons */
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

/* Multi-path SVG icons for more complex shapes */
const Icons = {
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  compass: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  messageCircle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  barChart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  bookOpen: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  fileText: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  sprout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>,
  diamond: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3l1 6"/><path d="M2 9h20"/></svg>,
  lightbulb: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="12" y1="6" x2="12" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>,
  video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
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
        <button className={`nav-item ${isActive('/') || currentPath === `/user/${user?.id}` || currentPath === '/my-profile' ? 'active' : ''}`} onClick={() => onNavigate('/')}>
          <span className="nav-item-icon">{Icons.user}</span> Mi Perfil
        </button>
        <button className={`nav-item ${isActive('/feed') ? 'active' : ''}`} onClick={() => onNavigate('/feed')}>
          <span className="nav-item-icon">{Icons.home}</span> Feed
        </button>
        <button className={`nav-item ${isActive('/friends') ? 'active' : ''}`} onClick={() => onNavigate('/friends')}>
          <span className="nav-item-icon">{Icons.users}</span> Comunidad
        </button>
        <button className={`nav-item ${isActive('/communities') ? 'active' : ''}`} onClick={() => onNavigate('/communities')}>
          <span className="nav-item-icon">{Icons.globe}</span> Comunidades
        </button>
        <button className={`nav-item ${isActive('/events') ? 'active' : ''}`} onClick={() => onNavigate('/events')}>
          <span className="nav-item-icon">{Icons.calendar}</span> Eventos
        </button>
        <button className={`nav-item ${isActive('/mentorship') ? 'active' : ''}`} onClick={() => onNavigate('/mentorship')}>
          <span className="nav-item-icon">{Icons.compass}</span> Mentoría
        </button>
        <button className={`nav-item ${isActive('/messages') ? 'active' : ''}`} onClick={() => onNavigate('/messages')}>
          <span className="nav-item-icon">{Icons.messageCircle}</span> Mensajes
          {unreadMessages > 0 && (
            <span className="nav-item-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
          )}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Académico</div>
        <button className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`} onClick={() => onNavigate('/dashboard')}>
          <span className="nav-item-icon">{Icons.barChart}</span> Dashboard
        </button>
        <button className={`nav-item ${isActive('/study-rooms') ? 'active' : ''}`} onClick={() => onNavigate('/study-rooms')}>
          <span className="nav-item-icon">{Icons.bookOpen}</span> Salas de Estudio
        </button>
        <button className={`nav-item ${isActive('/conferences') ? 'active' : ''}`} onClick={() => onNavigate('/conferences')}>
          <span className="nav-item-icon">{Icons.video}</span> Conferencias
        </button>
        <button className={`nav-item ${isActive('/search') ? 'active' : ''}`} onClick={() => onNavigate('/search')}>
          <span className="nav-item-icon">{Icons.search}</span> Buscador
        </button>
        <button className={`nav-item ${currentPath === '/calendar' ? 'active' : ''}`} onClick={() => onNavigate('/calendar')}>
          <span className="nav-item-icon">{Icons.calendar}</span> Calendario
        </button>
        <button className={`nav-item ${currentPath === '/marketplace' ? 'active' : ''}`} onClick={() => onNavigate('/marketplace')}>
          <span className="nav-item-icon">{Icons.fileText}</span> Apuntes
        </button>
        <button className={`nav-item ${isActive('/jobs') ? 'active' : ''}`} onClick={() => onNavigate('/jobs')}>
          <span className="nav-item-icon">{Icons.briefcase}</span> Bolsa de Trabajo
        </button>
        <button className={`nav-item ${isActive('/courses') ? 'active' : ''}`} onClick={() => onNavigate('/courses')}>
          <span className="nav-item-icon">{Icons.sprout}</span> Cursos
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
          <span className="nav-item-icon">{Icons.plus}</span> {t('nav.newSubject')}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Soporte</div>
        <button className={`nav-item ${currentPath === '/subscription' ? 'active' : ''}`} onClick={() => onNavigate('/subscription')}>
          <span className="nav-item-icon">{Icons.diamond}</span> Suscripción
        </button>
        <button className={`nav-item ${currentPath === '/suggestions' ? 'active' : ''}`} onClick={() => onNavigate('/suggestions')}>
          <span className="nav-item-icon">{Icons.lightbulb}</span> Sugerencias
        </button>
        {user?.role === 'owner' && (
          <button className={`nav-item ${isActive('/ceo') ? 'active' : ''}`} onClick={() => onNavigate('/ceo')}>
            <span className="nav-item-icon">{Icons.building}</span> CEO Panel
          </button>
        )}
        {user?.isAdmin && (
          <button className={`nav-item ${currentPath === '/admin' ? 'active' : ''}`} onClick={() => onNavigate('/admin')}>
            <span className="nav-item-icon">{Icons.settings}</span> Admin
          </button>
        )}
      </div>
    </nav>
  )
}
