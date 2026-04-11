import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project } from '../types'
import { Icons, IC, ChevronIcon } from './SidebarIcons'
import { ADMIN_MODULES, CATEGORY_LABELS } from '../admin/adminModules'

interface Props {
  projects: Project[]
  activeProjectId: string | null
  currentPath: string
  onNavigate: (path: string) => void
  onNewProject: () => void
  onClose?: () => void
  className?: string
}

export default function Sidebar({ projects, activeProjectId, currentPath, onNavigate, onNewProject, onClose, className }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [tutorStatus, setTutorStatus] = useState<string | null>(null)

  // Load tutor profile status only if user has mentoring enabled
  useEffect(() => {
    if (!user?.offersMentoring) return
    api.getMyTutorProfile()
      .then((d: any) => setTutorStatus(d?.status || null))
      .catch(() => {})
  }, [user?.id, user?.offersMentoring])

  // ── Active-section detection ─────────────────────────────────
  const socialPaths   = ['/feed', '/friends', '/communities', '/events', '/messages', '/my-profile']
  const academicPaths = ['/dashboard', '/study-paths', '/study-rooms', '/gamification', '/search', '/calendar', '/marketplace', '/courses', '/tutores']
  const supportPaths  = ['/profile', '/subscription', '/suggestions', '/admin', '/admin-panel']

  const isSocialActive   = socialPaths.some(p => currentPath.startsWith(p)) || currentPath.startsWith('/user/')
  const isAcademicActive = academicPaths.some(p => currentPath.startsWith(p))
  const isSupportActive  = supportPaths.some(p => currentPath.startsWith(p))
  const isSubjectsActive = currentPath.startsWith('/project/')
  const isTutorActive    = currentPath.startsWith('/my-tutor')
  const isJobsActive     = currentPath.startsWith('/jobs')

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    social:      isSocialActive,
    academic:    isAcademicActive,
    subjects:    true,
    support:     isSupportActive,
    tutor:       isTutorActive,
    jobs:        isJobsActive,
    adminPanel:  currentPath.startsWith('/admin-panel'),
  })
  const [openAdminCat, setOpenAdminCat] = useState<string | null>(
    currentPath.startsWith('/admin-panel')
      ? (ADMIN_MODULES.find(m => currentPath.startsWith(m.route))?.category ?? null)
      : null
  )

  // Keep active section open when route changes (rule C)
  useEffect(() => {
    setOpenSections(prev => ({
      ...prev,
      ...(isSocialActive   && { social:   true }),
      ...(isAcademicActive && { academic: true }),
      ...(isSupportActive  && { support:  true }),
      ...(isSubjectsActive && { subjects: true }),
      ...(isTutorActive    && { tutor:    true }),
      ...(isJobsActive     && { jobs:     true }),
    }))
  }, [currentPath])

  // Rule C: active section cannot be closed — only toggle non-active ones
  const activeMap: Record<string, boolean> = {
    social:      isSocialActive,
    academic:    isAcademicActive,
    subjects:    isSubjectsActive,
    support:     isSupportActive,
    tutor:       isTutorActive,
    jobs:        isJobsActive,
    adminPanel:  currentPath.startsWith('/admin-panel'),
  }
  const toggleSection = (key: string) => {
    if (activeMap[key]) return   // locked — active section stays open
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Unread messages badge
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

  const isActive = (path: string) => currentPath.startsWith(path)

  // ── Section header helper ────────────────────────────────────
  const SectionHeader = ({ sectionKey, label, extra }: { sectionKey: string; label: string; extra?: React.ReactNode }) => (
    <button
      className={`sidebar-section-toggle${activeMap[sectionKey] ? ' section-locked' : ''}`}
      onClick={() => toggleSection(sectionKey)}
      aria-expanded={openSections[sectionKey]}
    >
      <span className="sidebar-section-label">{label}</span>
      {extra}
      <span className="sidebar-section-line" />
      <ChevronIcon open={!!openSections[sectionKey]} />
    </button>
  )

  return (
    <nav className={`sidebar ${className || ''}`}>

      {/* ─── Mobile close button ─── */}
      {onClose && (
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">×</button>
      )}

      {/* ══ SOCIAL ══ */}
      <div className="sidebar-section">
        <SectionHeader sectionKey="social" label={t('sidebar.social')} />
        <div className={`sidebar-section-items${openSections.social ? ' open' : ''}`}>
          <div className="sidebar-section-items-inner">
            <button
              className={`nav-item ${currentPath === '/my-profile' || currentPath === `/user/${user?.id}` ? 'active' : ''}`}
              onClick={() => onNavigate('/my-profile')}
            >
              {Icons.user(IC.profile)} {t('sidebar.myProfile')}
            </button>
            <button
              className={`nav-item ${isActive('/feed') ? 'active' : ''}`}
              onClick={() => onNavigate('/feed')}
            >
              {Icons.feed(IC.feed)} {t('sidebar.feed')}
            </button>
            <button
              className={`nav-item ${isActive('/communities') || isActive('/friends') ? 'active' : ''}`}
              onClick={() => onNavigate('/communities')}
            >
              {Icons.globe(IC.globe)} {t('sidebar.communities')}
            </button>
            <button
              className={`nav-item ${isActive('/events') ? 'active' : ''}`}
              onClick={() => onNavigate('/events')}
            >
              {Icons.calendar(IC.events)} {t('sidebar.events')}
            </button>
            <button
              className={`nav-item ${isActive('/messages') ? 'active' : ''}`}
              onClick={() => onNavigate('/messages')}
            >
              {Icons.messageCircle(IC.messages)} {t('sidebar.messages')}
              {unreadMessages > 0 && (
                <span className="nav-item-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══ ACADÉMICO ══ */}
      <div className="sidebar-section">
        <SectionHeader sectionKey="academic" label={t('sidebar.academic')} />
        <div className={`sidebar-section-items${openSections.academic ? ' open' : ''}`}>
          <div className="sidebar-section-items-inner">
            <button
              className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('/dashboard')}
            >
              {Icons.barChart(IC.dashboard)} {t('sidebar.dashboard')}
            </button>
            <button
              className={`nav-item ${isActive('/study-rooms') ? 'active' : ''}`}
              onClick={() => onNavigate('/study-rooms')}
            >
              {Icons.bookOpen(IC.rooms)} {t('sidebar.studyRooms')}
            </button>
            <button
              className={`nav-item ${isActive('/study-paths') ? 'active' : ''}`}
              onClick={() => onNavigate('/study-paths')}
            >
              {Icons.bookOpen(IC.rooms)} Rutas de Estudio
            </button>
            <button
              className={`nav-item ${isActive('/gamification') ? 'active' : ''}`}
              onClick={() => onNavigate('/gamification')}
            >
              {Icons.sparkles(IC.ai)} Logros
            </button>
            <button
              className={`nav-item ${isActive('/search') ? 'active' : ''}`}
              onClick={() => onNavigate('/search')}
            >
              {Icons.search(IC.search)} {t('sidebar.search')}
            </button>
            <button
              className={`nav-item ${currentPath === '/calendar' ? 'active' : ''}`}
              onClick={() => onNavigate('/calendar')}
            >
              {Icons.calendar(IC.calendar)} {t('sidebar.calendar')}
            </button>
            <button
              className={`nav-item ${currentPath === '/marketplace' ? 'active' : ''}`}
              onClick={() => onNavigate('/marketplace')}
            >
              {Icons.fileText(IC.notes)} {t('sidebar.notes')}
            </button>
            <button
              className={`nav-item ${isActive('/courses') ? 'active' : ''}`}
              onClick={() => onNavigate('/courses')}
            >
              {Icons.diploma(IC.courses)} Cursos
            </button>
            <button
              className={`nav-item ${isActive('/tutores') ? 'active' : ''}`}
              onClick={() => onNavigate('/tutores')}
            >
              {Icons.tutors(IC.tutors)} Tutores
            </button>
          </div>
        </div>
      </div>

      {/* ══ BOLSA DEL TRABAJO ══ */}
      <div className="sidebar-section">
        <SectionHeader sectionKey="jobs" label={t('sidebar.jobBoard')} />
        <div className={`sidebar-section-items${openSections.jobs ? ' open' : ''}`}>
          <div className="sidebar-section-items-inner">
            <button
              className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
              onClick={() => onNavigate('/jobs')}
            >
              {Icons.briefcase(IC.jobs)} {t('sidebar.jobBoard')}
            </button>
          </div>
        </div>
      </div>

      {/* ══ MIS ASIGNATURAS ══ */}
      <div className="sidebar-section sidebar-section-grow">
        <SectionHeader sectionKey="subjects" label={t('nav.mySubjects')} />
        <div className={`sidebar-section-items${openSections.subjects ? ' open' : ''}`}>
          <div className="sidebar-section-items-inner">
            {projects.map(project => (
              <button
                key={project.id}
                className={`nav-item ${activeProjectId === project.id ? 'active' : ''}`}
                onClick={() => onNavigate(`/project/${project.id}`)}
              >
                <span className="project-dot" style={{ background: project.color }} />
                {project.name}
              </button>
            ))}
            <button className="nav-item nav-item-add" onClick={onNewProject}>
              {Icons.plus(IC.plus)} {t('nav.newSubject')}
            </button>
          </div>
        </div>
      </div>

      {/* ══ SOPORTE ══ */}
      <div className="sidebar-section">
        <SectionHeader sectionKey="support" label={t('sidebar.support')} />
        <div className={`sidebar-section-items${openSections.support ? ' open' : ''}`}>
          <div className="sidebar-section-items-inner">
            <button
              className={`nav-item ${currentPath === '/profile' ? 'active' : ''}`}
              onClick={() => onNavigate('/profile')}
            >
              {Icons.settings(IC.settings)} {t('sidebar.configuration')}
            </button>
            <button
              className={`nav-item ${currentPath === '/subscription' ? 'active' : ''}`}
              onClick={() => onNavigate('/subscription')}
            >
              {Icons.diamond(IC.diamond)} {t('sidebar.subscription')}
            </button>
            <button
              className={`nav-item ${currentPath === '/suggestions' ? 'active' : ''}`}
              onClick={() => onNavigate('/suggestions')}
            >
              {Icons.lightbulb(IC.lightbulb)} {t('sidebar.suggestions')}
            </button>
            {user?.isAdmin && (
              <button
                className={`nav-item ${currentPath === '/admin' ? 'active' : ''}`}
                onClick={() => onNavigate('/admin')}
              >
                {Icons.settings(IC.admin)} {t('sidebar.admin')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ MI TUTORÍA (solo tutores) ══ */}
      {user?.offersMentoring && tutorStatus && (
        <div className="sidebar-section">
          <SectionHeader
            sectionKey="tutor"
            label="Mi Tutoría"
            extra={
              tutorStatus === 'pending_review' ? (
                <span style={{ fontSize: 10, background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>Pendiente</span>
              ) : tutorStatus === 'appealing' ? (
                <span style={{ fontSize: 10, background: '#8b5cf6', color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>Apelación</span>
              ) : undefined
            }
          />
          <div className={`sidebar-section-items${openSections.tutor ? ' open' : ''}`}>
            <div className="sidebar-section-items-inner">
              <button
                className={`nav-item ${currentPath === '/my-tutor' ? 'active' : ''}`}
                onClick={() => onNavigate('/my-tutor')}
              >
                {Icons.bookOpen(IC.rooms)} Panel Tutor
              </button>
              {tutorStatus === 'approved' && (
                <>
                  <button
                    className={`nav-item ${currentPath === '/my-tutor/materias' ? 'active' : ''}`}
                    onClick={() => onNavigate('/my-tutor/materias')}
                  >
                    {Icons.bookOpen(IC.rooms)} Mis Materias
                  </button>
                  <button
                    className={`nav-item ${currentPath === '/my-tutor/clases' ? 'active' : ''}`}
                    onClick={() => onNavigate('/my-tutor/clases')}
                  >
                    {Icons.calendar(IC.calendar)} Mis Clases
                  </button>
                  <button
                    className={`nav-item ${currentPath === '/my-tutor/pagos' ? 'active' : ''}`}
                    onClick={() => onNavigate('/my-tutor/pagos')}
                  >
                    {Icons.diamond(IC.diamond)} Mis Pagos
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CEO / MI PANEL ══ */}
      {(user?.role === 'owner' || user?.isAdmin || user?.role === 'employee') && (
        <div style={{ marginTop: 'auto', paddingTop: 4 }}>
          {/* Línea divisoria con gradiente Conniku */}
          <div style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, #1a56db 40%, #3b82f6 60%, transparent 100%)',
            margin: '6px 12px 10px',
            borderRadius: 2,
          }} />

          <div style={{ padding: '0 10px 14px' }}>
            {/* Botón CEO / Usuario */}
            <button
              onClick={() => setOpenSections(prev => ({ ...prev, adminPanel: !prev.adminPanel }))}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0d2a6b 0%, #1a56db 60%, #3b82f6 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 13,
                padding: '11px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 16px rgba(26,86,219,0.4)',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {user?.role === 'owner' ? '⚡' : '👤'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: user?.role === 'owner' ? 22 : 15,
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: user?.role === 'owner' ? 6 : 1,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  }}>
                    {user?.role === 'owner' ? 'CEO' : (user?.username || (user as any)?.first_name || 'Mi Panel')}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.55)',
                    marginTop: 3,
                    fontWeight: 400,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}>
                    Conniku SpA
                  </div>
                </div>
              </div>
              <ChevronIcon open={!!openSections.adminPanel} />
            </button>

            {/* Módulos desplegables por categoría */}
            {openSections.adminPanel && (
              <div style={{ marginTop: 10 }}>
                {Object.entries(CATEGORY_LABELS).map(([catKey, cat]) => {
                  const mods = ADMIN_MODULES.filter(m =>
                    m.category === catKey &&
                    (user?.role === 'owner' || !(m as any).ownerOnly)
                  )
                  if (!mods.length) return null
                  const isCatOpen = openAdminCat === catKey
                  return (
                    <div key={catKey} style={{ marginBottom: 2 }}>
                      <button
                        onClick={() => setOpenAdminCat(prev => prev === catKey ? null : catKey)}
                        style={{
                          width: '100%',
                          background: isCatOpen ? 'rgba(26,86,219,0.12)' : 'rgba(255,255,255,0.03)',
                          border: '1px solid',
                          borderColor: isCatOpen ? 'rgba(26,86,219,0.3)' : 'transparent',
                          borderRadius: 8,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: isCatOpen ? 'var(--accent, #1a56db)' : 'var(--text-muted)',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 1.2,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{cat.label}</span>
                        <ChevronIcon open={isCatOpen} />
                      </button>
                      {isCatOpen && (
                        <div style={{ paddingLeft: 8, paddingTop: 2, paddingBottom: 2 }}>
                          {mods.map(mod => (
                            <button
                              key={mod.id}
                              onClick={() => onNavigate(mod.route)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                textAlign: 'left',
                                background: currentPath.startsWith(mod.route) ? 'rgba(26,86,219,0.1)' : 'transparent',
                                border: 'none',
                                borderLeft: currentPath.startsWith(mod.route) ? '2px solid var(--accent, #1a56db)' : '2px solid transparent',
                                borderRadius: '0 6px 6px 0',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: currentPath.startsWith(mod.route) ? 600 : 400,
                                color: currentPath.startsWith(mod.route) ? 'var(--accent, #1a56db)' : 'var(--text-secondary)',
                                gap: 6,
                              }}
                            >
                              <span style={{ flex: 1 }}>{mod.label}</span>
                              {(mod as any).isNew && (
                                <span style={{
                                  fontSize: 8, background: 'var(--accent, #1a56db)',
                                  color: '#fff', borderRadius: 3, padding: '1px 4px',
                                  fontWeight: 700, letterSpacing: 0.5,
                                }}>NEW</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </nav>
  )
}
