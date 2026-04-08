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

/* ─── Duotone Icon Component ───
   Each icon has a colored stroke + a semi-transparent fill on the main shape.
   strokeWidth 1.75 for a more modern/refined look. */
interface DuotoneIconProps {
  color: string
  children: React.ReactNode
}

const DuotoneIcon = ({ color, children }: DuotoneIconProps) => (
  <span className="nav-item-icon" style={{ color, '--icon-fill': `${color}20` } as React.CSSProperties}>
    {children}
  </span>
)

/* ─── Icon definitions — Duotone style ─── */
const sw = 1.75  // stroke-width
const Icons = {
  user: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" fill={`${c}20`} />
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      </svg>
    </DuotoneIcon>
  ),
  feed: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" fill={`${c}20`} />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" fill={`${c}20`} />
      </svg>
    </DuotoneIcon>
  ),
  community: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" fill={`${c}20`} />
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </DuotoneIcon>
  ),
  globe: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={`${c}20`} />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </DuotoneIcon>
  ),
  calendar: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={`${c}20`} />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </DuotoneIcon>
  ),
  compass: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={`${c}20`} />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={`${c}30`} />
      </svg>
    </DuotoneIcon>
  ),
  messageCircle: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill={`${c}20`} />
      </svg>
    </DuotoneIcon>
  ),
  barChart: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" fill={`${c}20`} />
      </svg>
    </DuotoneIcon>
  ),
  bookOpen: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill={`${c}20`} />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </DuotoneIcon>
  ),
  video: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill={`${c}20`} />
        <polygon points="23 7 16 12 23 17 23 7" />
      </svg>
    </DuotoneIcon>
  ),
  search: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" fill={`${c}20`} />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </DuotoneIcon>
  ),
  fileText: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={`${c}20`} />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </DuotoneIcon>
  ),
  briefcase: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill={`${c}20`} />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    </DuotoneIcon>
  ),
  diploma: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" fill={`${c}20`} />
        <path d="M4 4h16" />
        <path d="M4 8h16" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="10" y1="15" x2="14" y2="15" />
        <circle cx="12" cy="20" r="2" fill={`${c}30`} />
        <path d="M10 22l-1 2" />
        <path d="M14 22l1 2" />
      </svg>
    </DuotoneIcon>
  ),
  tutors: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10l10-5 10 5-10 5z" fill={`${c}20`} />
        <path d="M22 10v6" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </svg>
    </DuotoneIcon>
  ),
  settings: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={`${c}20`} />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </DuotoneIcon>
  ),
  diamond: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9z" fill={`${c}20`} />
        <path d="M2 9h20" />
      </svg>
    </DuotoneIcon>
  ),
  lightbulb: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" fill={`${c}20`} />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    </DuotoneIcon>
  ),
  building: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" fill={`${c}20`} />
        <path d="M9 22v-4h6v4" />
        <line x1="8" y1="6" x2="8" y2="6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="6" x2="12" y2="6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="6" x2="16" y2="6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="10" x2="8" y2="10" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="10" x2="16" y2="10" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </DuotoneIcon>
  ),
  users2: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" fill={`${c}20`} />
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </DuotoneIcon>
  ),
  book: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={`${c}20`} />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    </DuotoneIcon>
  ),
  plus: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </DuotoneIcon>
  ),
  sparkles: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" fill={`${c}20`} />
      </svg>
    </DuotoneIcon>
  ),
  home: (c: string) => (
    <DuotoneIcon color={c}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={`${c}20`} />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </DuotoneIcon>
  ),
}

/* ─── Icon color palette ─── */
const IC = {
  home:       '#2563EB', // brand blue
  profile:    '#3B82F6', // blue
  feed:       '#F97316', // orange
  community:  '#8B5CF6', // violet
  globe:      '#06B6D4', // cyan
  calendar:   '#F59E0B', // amber
  compass:    '#06B6D4', // cyan
  messages:   '#10B981', // emerald
  dashboard:  '#6366F1', // indigo
  rooms:      '#EC4899', // pink
  video:      '#0EA5E9', // sky
  search:     '#F59E0B', // amber
  notes:      '#8B5CF6', // violet
  jobs:       '#14B8A6', // teal
  courses:    '#6366F1', // indigo
  tutors:     '#3B82F6', // blue
  events:     '#EF4444', // red
  settings:   '#64748B', // slate
  diamond:    '#F43F5E', // rose
  lightbulb:  '#F59E0B', // amber
  building:   '#6366F1', // indigo
  library:    '#D97706', // amber-dark
  hr:         '#8B5CF6', // violet
  admin:      '#64748B', // slate
  ai:         '#10B981', // emerald
  plus:       '#94A3B8', // neutral
}

/* ─── Chevron for collapsible sections ─── */
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', opacity: 0.5, flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function Sidebar({ projects, activeProjectId, currentPath, onNavigate, onNewProject, className }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Collapsible section state — auto-open section containing active route
  const socialPaths = ['/', '/feed', '/friends', '/communities', '/events', '/messages', '/my-profile']
  const academicPaths = ['/dashboard', '/study-rooms', '/search', '/calendar', '/marketplace', '/jobs']
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
    </nav>
  )
}
