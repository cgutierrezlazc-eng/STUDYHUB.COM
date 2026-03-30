import React from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { Project } from '../types'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  currentPath: string
  onNavigate: (path: string) => void
  onNewProject: () => void
}

export default function Sidebar({ projects, activeProjectId, currentPath, onNavigate, onNewProject }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-mark">S</div>
        <h1 className="sidebar-brand"><span>Study</span>Hub</h1>
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item ${currentPath === '/' ? 'active' : ''}`} onClick={() => onNavigate('/')}>
          <span className="nav-item-icon">👤</span>
          Mi Perfil
        </button>

        <button className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`} onClick={() => onNavigate('/dashboard')}>
          <span className="nav-item-icon">🏠</span>
          {t('nav.dashboard')}
        </button>

        <button className={`nav-item ${currentPath.startsWith('/messages') ? 'active' : ''}`} onClick={() => onNavigate('/messages')}>
          <span className="nav-item-icon">💬</span>
          {t('nav.messages')}
        </button>

        <button className={`nav-item ${currentPath.startsWith('/friends') || currentPath.startsWith('/user/') ? 'active' : ''}`} onClick={() => onNavigate('/friends')}>
          <span className="nav-item-icon">👥</span>
          Comunidad
        </button>

        <div className="nav-section-title">{t('nav.mySubjects')}</div>

        {projects.map(project => (
          <button key={project.id} className={`nav-item ${activeProjectId === project.id ? 'active' : ''}`} onClick={() => onNavigate(`/project/${project.id}`)}>
            <span className="project-dot" style={{ background: project.color }} />
            {project.name}
          </button>
        ))}

        <button className="nav-item" onClick={onNewProject}>
          <span className="nav-item-icon">+</span>
          {t('nav.newSubject')}
        </button>

        <div className="nav-section-title" style={{ marginTop: 16 }}>{t('nav.support')}</div>

        <button className={`nav-item ${currentPath === '/subscription' ? 'active' : ''}`} onClick={() => onNavigate('/subscription')}>
          <span className="nav-item-icon">💎</span>
          Suscripción
        </button>

        <button className={`nav-item ${currentPath === '/suggestions' ? 'active' : ''}`} onClick={() => onNavigate('/suggestions')}>
          <span className="nav-item-icon">💡</span>
          {t('nav.suggestions')}
        </button>

        {user?.isAdmin && (
          <button className={`nav-item ${currentPath === '/admin' ? 'active' : ''}`} onClick={() => onNavigate('/admin')}>
            <span className="nav-item-icon">⚙️</span>
            {t('nav.admin')}
          </button>
        )}
      </nav>

      {/* User section */}
      <div className="sidebar-user" onClick={() => onNavigate('/')}>
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="sidebar-user-avatar" />
        ) : (
          <div className="sidebar-user-initials">{initials}</div>
        )}
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.firstName} {user?.lastName}</span>
          <span className="sidebar-user-email">@{user?.username} #{String(user?.userNumber || 0).padStart(4, '0')}</span>
        </div>
        <button
          className="sidebar-settings-btn"
          title="Settings"
          onClick={(e) => { e.stopPropagation(); onNavigate('/profile') }}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            padding: '4px 6px',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; (e.target as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          &#9881;
        </button>
      </div>
    </div>
  )
}
