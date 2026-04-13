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
  const [adminPanelOpen, setAdminPanelOpen] = useState(currentPath.startsWith('/admin-panel'))
  const [openAdminCat, setOpenAdminCat] = useState<string | null>(
    currentPath.startsWith('/admin-panel')
      ? (ADMIN_MODULES.find(m => currentPath.startsWith(m.route))?.category ?? null)
      : null
  )

  // Load tutor profile status only if user has mentoring enabled
  useEffect(() => {
    if (!user?.offersMentoring) return
    api.getMyTutorProfile()
      .then((d: any) => setTutorStatus(d?.status || null))
      .catch(() => {})
  }, [user?.id, user?.offersMentoring])

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

  // ── Static section separator (Option B) ─────────────────
  const SepLabel = ({ label }: { label: string }) => (
    <div className="sidebar-sep-label">{label}</div>
  )

  return (
    <nav className={`sidebar ${className || ''}`}>

      {/* ─── Mobile close button ─── */}
      {onClose && (
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">×</button>
      )}

      {/* ── Mi Universidad — primero en el sidebar ── */}
      <div style={{ padding: '10px 10px 4px' }}>
        <button
          onClick={() => onNavigate('/mi-universidad')}
          style={{
            width: '100%',
            background: isActive('/mi-universidad')
              ? 'linear-gradient(135deg, #0a3060 0%, #1a56db 60%, #3b82f6 100%)'
              : 'linear-gradient(135deg, rgba(10,30,70,0.85) 0%, rgba(26,86,219,0.7) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            padding: '10px 13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            boxShadow: isActive('/mi-universidad') ? '0 4px 14px rgba(26,86,219,0.35)' : '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.2s, background 0.2s',
          }}
        >
          <div style={{
            width: 32, height: 32,
            background: 'rgba(255,255,255,0.13)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>🎓</div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 800, color: '#ffffff',
              letterSpacing: 0.5, lineHeight: 1.1,
              textTransform: 'uppercase',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            }}>
              Mi Universidad
            </div>
            {projects.length > 0 && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: 400 }}>
                {projects.length} asignatura{projects.length !== 1 ? 's' : ''} activa{projects.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* ══ CEO / MI PANEL ══ */}
      {(user?.role === 'owner' || user?.isAdmin || user?.role === 'employee') && (
        <div style={{ paddingTop: 4 }}>
          {/* Línea divisoria con gradiente Conniku */}
          <div style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, #1a56db 40%, #3b82f6 60%, transparent 100%)',
            margin: '6px 12px 10px',
            borderRadius: 2,
          }} />

          <div style={{ padding: '0 10px 10px' }}>
            {/* Botón CEO / Usuario */}
            <button
              onClick={() => setAdminPanelOpen(prev => !prev)}
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
              <ChevronIcon open={adminPanelOpen} />
            </button>

            {/* Módulos desplegables por categoría */}
            {adminPanelOpen && (
              <div style={{ marginTop: 10 }}>
                {Object.entries(CATEGORY_LABELS).map(([catKey, cat]) => {
                  const mods = ADMIN_MODULES.filter(m =>
                    m.category === catKey &&
                    (user?.role === 'owner' || user?.isAdmin || !(m as any).ownerOnly)
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

      {/* ══ SOCIAL ══ */}
      <SepLabel label={t('sidebar.social')} />
      <button
        className={`nav-item ${currentPath === '/my-profile' || currentPath === `/user/${user?.id}` ? 'active' : ''}`}
        onClick={() => onNavigate('/my-profile')}
      >
        {Icons.user(IC.profile)} {t('sidebar.myProfile')}
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

      {/* ══ ACADÉMICO ══ */}
      <SepLabel label={t('sidebar.academic')} />

      <button
        className={`nav-item ${isActive('/courses') ? 'active' : ''}`}
        onClick={() => onNavigate('/courses')}
      >
        {Icons.diploma(IC.courses)} Cursos
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
        className={`nav-item ${isActive('/biblioteca') ? 'active' : ''}`}
        onClick={() => onNavigate('/biblioteca')}
      >
        {Icons.bookOpen(IC.rooms)} Biblioteca
      </button>
      <button
        className={`nav-item ${isActive('/tutores') ? 'active' : ''}`}
        onClick={() => onNavigate('/tutores')}
      >
        {Icons.tutors(IC.tutors)} Tutores
      </button>
      <button
        className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('/dashboard')}
      >
        {Icons.barChart(IC.dashboard)} {t('sidebar.dashboard')}
      </button>

      {/* ══ BOLSA DEL TRABAJO ══ */}
      <SepLabel label={t('sidebar.jobBoard')} />
      <button
        className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
        onClick={() => onNavigate('/jobs')}
      >
        {Icons.briefcase(IC.jobs)} {t('sidebar.jobBoard')}
      </button>

      {/* ══ MI TUTORÍA (solo tutores) ══ */}
      {user?.offersMentoring && tutorStatus && (
        <>
          <SepLabel label="Mi Tutoría" />
          <button
            className={`nav-item ${currentPath === '/my-tutor' ? 'active' : ''}`}
            onClick={() => onNavigate('/my-tutor')}
          >
            {Icons.bookOpen(IC.rooms)} Panel Tutor
            {(tutorStatus === 'pending_review' || tutorStatus === 'appealing') && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 9,
                background: tutorStatus === 'appealing' ? '#8b5cf6' : '#f59e0b',
                color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700,
              }}>
                {tutorStatus === 'appealing' ? 'Apelación' : 'Pendiente'}
              </span>
            )}
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
        </>
      )}

      {/* ══ SOPORTE ══ */}
      <SepLabel label={t('sidebar.support')} />
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


    </nav>
  )
}
