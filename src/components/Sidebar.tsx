import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project } from '../types'
import { Icons, IC, ChevronIcon } from './SidebarIcons'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  currentPath: string
  onNavigate: (path: string) => void
  onNewProject: () => void
  className?: string
}

// ── Clock In/Out state helpers ──────────────────────────────────
const CLOCK_KEY = 'conniku_clock_state'
function getClockState() {
  try {
    const raw = localStorage.getItem(CLOCK_KEY)
    if (raw) return JSON.parse(raw) as { clockedIn: boolean; since: string }
  } catch {}
  return { clockedIn: false, since: '' }
}

export default function Sidebar({ projects, activeProjectId, currentPath, onNavigate, onNewProject, className }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [clockState, setClockState] = useState(getClockState)
  const [elapsed, setElapsed] = useState('')

  // Live elapsed timer while clocked in
  useEffect(() => {
    if (!clockState.clockedIn || !clockState.since) { setElapsed(''); return }
    const update = () => {
      const diffMs = Date.now() - new Date(clockState.since).getTime()
      const h = Math.floor(diffMs / 3600000)
      const m = Math.floor((diffMs % 3600000) / 60000)
      const s = Math.floor((diffMs % 60000) / 1000)
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [clockState])

  const handleClock = async () => {
    const action = clockState.clockedIn ? 'out' : 'in'
    const next = { clockedIn: !clockState.clockedIn, since: new Date().toISOString() }
    localStorage.setItem(CLOCK_KEY, JSON.stringify(next))
    setClockState(next)
    // Fire-and-forget: persist to backend (ignore errors so UI never blocks)
    api.clockAttendance(action).catch(() => {})
  }

  // Collapsible section state — auto-open section containing active route
  const socialPaths = ['/', '/feed', '/friends', '/communities', '/events', '/messages', '/my-profile']
  const academicPaths = ['/dashboard', '/study-paths', '/study-rooms', '/quizzes', '/gamification', '/search', '/calendar', '/marketplace', '/jobs', '/courses']
  const supportPaths = ['/profile', '/subscription', '/suggestions', '/admin', '/admin-panel']

  const isSocialActive = socialPaths.some(p => p === '/' ? (currentPath === '/' || currentPath === '/feed' || currentPath.startsWith('/user/')) : currentPath.startsWith(p))
  const isAcademicActive = academicPaths.some(p => currentPath.startsWith(p))
  const isSupportActive = supportPaths.some(p => currentPath.startsWith(p))
  const isSubjectsActive = currentPath.startsWith('/project/')

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    social: isSocialActive,
    academic: isAcademicActive,
    subjects: true,
    support: isSupportActive,
  })

  // Update open sections when route changes
  useEffect(() => {
    setOpenSections(prev => ({
      ...prev,
      ...(isSocialActive && { social: true }),
      ...(isAcademicActive && { academic: true }),
      ...(isSupportActive && { support: true }),
      ...(isSubjectsActive && { subjects: true }),
    }))
  }, [currentPath])

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
      {/* ─── Social ─── */}
      <div className="sidebar-section">
        <button className="sidebar-section-title sidebar-section-toggle" onClick={() => toggleSection('social')}>
          <ChevronIcon open={openSections.social} />
          <span>{t('sidebar.social')}</span>
        </button>
        {openSections.social && (
          <div className="sidebar-section-items">
            <button className={`nav-item ${currentPath === '/' ? 'active' : ''}`} onClick={() => onNavigate('/')}>
              {Icons.home(IC.home)} {t('sidebar.home')}
            </button>
            <button className={`nav-item ${currentPath === '/my-profile' || currentPath === `/user/${user?.id}` ? 'active' : ''}`} onClick={() => onNavigate('/my-profile')}>
              {Icons.user(IC.profile)} {t('sidebar.myProfile')}
            </button>
            <button className={`nav-item ${isActive('/feed') ? 'active' : ''}`} onClick={() => onNavigate('/feed')}>
              {Icons.feed(IC.feed)} {t('sidebar.feed')}
            </button>
            <button className={`nav-item ${isActive('/communities') || isActive('/friends') ? 'active' : ''}`} onClick={() => onNavigate('/communities')}>
              {Icons.globe(IC.globe)} {t('sidebar.communities')}
            </button>
            <button className={`nav-item ${isActive('/events') ? 'active' : ''}`} onClick={() => onNavigate('/events')}>
              {Icons.calendar(IC.events)} {t('sidebar.events')}
            </button>
            <button className={`nav-item ${isActive('/messages') ? 'active' : ''}`} onClick={() => onNavigate('/messages')}>
              {Icons.messageCircle(IC.messages)} {t('sidebar.messages')}
              {unreadMessages > 0 && (
                <span className="nav-item-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ─── Académico ─── */}
      <div className="sidebar-section">
        <button className="sidebar-section-title sidebar-section-toggle" onClick={() => toggleSection('academic')}>
          <ChevronIcon open={openSections.academic} />
          <span>{t('sidebar.academic')}</span>
        </button>
        {openSections.academic && (
          <div className="sidebar-section-items">
            <button className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`} onClick={() => onNavigate('/dashboard')}>
              {Icons.barChart(IC.dashboard)} {t('sidebar.dashboard')}
            </button>
            <button className={`nav-item ${isActive('/study-rooms') ? 'active' : ''}`} onClick={() => onNavigate('/study-rooms')}>
              {Icons.bookOpen(IC.rooms)} {t('sidebar.studyRooms')}
            </button>
            <button className={`nav-item ${isActive('/study-paths') ? 'active' : ''}`} onClick={() => onNavigate('/study-paths')}>
              {Icons.bookOpen(IC.rooms)} Rutas de Estudio
            </button>
            <button className={`nav-item ${isActive('/quizzes') ? 'active' : ''}`} onClick={() => onNavigate('/quizzes')}>
              {Icons.sparkles(IC.ai)} Quizzes
            </button>
            <button className={`nav-item ${isActive('/gamification') ? 'active' : ''}`} onClick={() => onNavigate('/gamification')}>
              {Icons.sparkles(IC.ai)} Logros
            </button>
            <button className={`nav-item ${isActive('/search') ? 'active' : ''}`} onClick={() => onNavigate('/search')}>
              {Icons.search(IC.search)} {t('sidebar.search')}
            </button>
            <button className={`nav-item ${currentPath === '/calendar' ? 'active' : ''}`} onClick={() => onNavigate('/calendar')}>
              {Icons.calendar(IC.calendar)} {t('sidebar.calendar')}
            </button>
            <button className={`nav-item ${currentPath === '/marketplace' ? 'active' : ''}`} onClick={() => onNavigate('/marketplace')}>
              {Icons.fileText(IC.notes)} {t('sidebar.notes')}
            </button>
            <button className={`nav-item ${isActive('/jobs') ? 'active' : ''}`} onClick={() => onNavigate('/jobs')}>
              {Icons.briefcase(IC.jobs)} {t('sidebar.jobBoard')}
            </button>
            <button className={`nav-item ${isActive('/courses') ? 'active' : ''}`} onClick={() => onNavigate('/courses')}>
              {Icons.diploma(IC.courses)} Cursos
            </button>
          </div>
        )}
      </div>

      {/* ─── Mis Asignaturas ─── */}
      <div className="sidebar-section sidebar-section-grow">
        <button className="sidebar-section-title sidebar-section-toggle" onClick={() => toggleSection('subjects')}>
          <ChevronIcon open={openSections.subjects} />
          <span>{t('nav.mySubjects')}</span>
        </button>
        {openSections.subjects && (
          <div className="sidebar-section-items">
            {projects.map(project => (
              <button key={project.id} className={`nav-item ${activeProjectId === project.id ? 'active' : ''}`} onClick={() => onNavigate(`/project/${project.id}`)}>
                <span className="project-dot" style={{ background: project.color }} />
                {project.name}
              </button>
            ))}
            <button className="nav-item nav-item-add" onClick={onNewProject}>
              {Icons.plus(IC.plus)} {t('nav.newSubject')}
            </button>
          </div>
        )}
      </div>

      {/* ─── Soporte ─── */}
      <div className="sidebar-section">
        <button className="sidebar-section-title sidebar-section-toggle" onClick={() => toggleSection('support')}>
          <ChevronIcon open={openSections.support} />
          <span>{t('sidebar.support')}</span>
        </button>
        {openSections.support && (
          <div className="sidebar-section-items">
            <button className={`nav-item ${currentPath === '/profile' ? 'active' : ''}`} onClick={() => onNavigate('/profile')}>
              {Icons.settings(IC.settings)} {t('sidebar.configuration')}
            </button>
            <button className={`nav-item ${currentPath === '/subscription' ? 'active' : ''}`} onClick={() => onNavigate('/subscription')}>
              {Icons.diamond(IC.diamond)} {t('sidebar.subscription')}
            </button>
            <button className={`nav-item ${currentPath === '/suggestions' ? 'active' : ''}`} onClick={() => onNavigate('/suggestions')}>
              {Icons.lightbulb(IC.lightbulb)} {t('sidebar.suggestions')}
            </button>
            {user?.role === 'owner' && (
              <>
                <button className={`nav-item ${isActive('/admin-panel') ? 'active' : ''}`} onClick={() => onNavigate('/admin-panel')} style={{ fontWeight: 600 }}>
                  {Icons.building(IC.building)} Panel Admin
                </button>
              </>
            )}
            {user?.isAdmin && (
              <button className={`nav-item ${currentPath === '/admin' ? 'active' : ''}`} onClick={() => onNavigate('/admin')}>
                {Icons.settings(IC.admin)} {t('sidebar.admin')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Clock In / Out ─── */}
      <div style={{ padding: '12px 10px 10px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <button
          onClick={handleClock}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 13,
            transition: 'all 0.2s',
            background: clockState.clockedIn
              ? 'linear-gradient(135deg, #166534, #15803d)'
              : 'linear-gradient(135deg, #991b1b, #b91c1c)',
            color: '#fff',
            boxShadow: clockState.clockedIn
              ? '0 2px 12px rgba(34,197,94,0.35)'
              : '0 2px 12px rgba(239,68,68,0.35)',
          }}
        >
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: clockState.clockedIn ? '#4ade80' : '#fca5a5',
            boxShadow: clockState.clockedIn ? '0 0 8px #4ade80' : '0 0 8px #fca5a5',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div>{clockState.clockedIn ? 'Estás en Clock In' : 'Estás en Clock Out'}</div>
            {clockState.clockedIn && elapsed && (
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, fontFamily: 'monospace', letterSpacing: 1 }}>{elapsed}</div>
            )}
            {clockState.clockedIn && (
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.65 }}>Clic para registrar salida</div>
            )}
            {!clockState.clockedIn && clockState.since && (
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                Último: {new Date(clockState.since).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {!clockState.clockedIn && !clockState.since && (
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.65 }}>Clic para registrar entrada</div>
            )}
          </div>
          <span style={{ fontSize: 18 }}>{clockState.clockedIn ? '🟢' : '🔴'}</span>
        </button>
      </div>
    </nav>
  )
}
