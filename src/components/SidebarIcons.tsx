import React from 'react'

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

export const Icons = {
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
export const IC = {
  home:       '#2563EB',
  profile:    '#3B82F6',
  feed:       '#F97316',
  community:  '#8B5CF6',
  globe:      '#06B6D4',
  calendar:   '#F59E0B',
  compass:    '#06B6D4',
  messages:   '#10B981',
  dashboard:  '#6366F1',
  rooms:      '#EC4899',
  video:      '#0EA5E9',
  search:     '#F59E0B',
  notes:      '#8B5CF6',
  jobs:       '#14B8A6',
  courses:    '#6366F1',
  tutors:     '#3B82F6',
  events:     '#EF4444',
  settings:   '#64748B',
  diamond:    '#F43F5E',
  lightbulb:  '#F59E0B',
  building:   '#6366F1',
  library:    '#D97706',
  hr:         '#8B5CF6',
  admin:      '#64748B',
  ai:         '#10B981',
  plus:       '#94A3B8',
}

/* ─── Chevron for collapsible sections ─── */
export const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', opacity: 0.5, flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
