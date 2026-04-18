import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Icon component — Estilo A+1:
   · Inactivo: ícono blanco en badge de color (relieve negativo)
   · Activo:   badge se hunde dentro del pill azul (incrustado)
   La clase .nav-item-icon recibe el color de fondo via inline style.
───────────────────────────────────────────────────────────────────── */
interface IconProps {
  color: string;
  children: React.ReactNode;
}

const Icon = ({ color, children }: IconProps) => (
  <span className="nav-item-icon" style={{ background: color } as React.CSSProperties}>
    {children}
  </span>
);

const sw = 1.9; // stroke-width

export const Icons = {
  user: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="7" r="4" fill="white" fillOpacity={0.25} />
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      </svg>
    </Icon>
  ),
  feed: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" fillOpacity={0.25} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" fillOpacity={0.25} />
      </svg>
    </Icon>
  ),
  community: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="7" r="4" fill="white" fillOpacity={0.2} />
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </Icon>
  ),
  globe: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="white" fillOpacity={0.15} />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </Icon>
  ),
  calendar: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" fill="white" fillOpacity={0.18} />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <rect x="7" y="14" width="3.5" height="3.5" rx="0.5" fill="white" fillOpacity={0.3} />
      </svg>
    </Icon>
  ),
  compass: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="white" fillOpacity={0.15} />
        <polygon
          points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
          fill="white"
          fillOpacity={0.28}
        />
      </svg>
    </Icon>
  ),
  messageCircle: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M20 2H4a1 1 0 00-1 1v13a1 1 0 001 1h3l4 4 4-4h5a1 1 0 001-1V3a1 1 0 00-1-1z"
          fill="white"
          fillOpacity={0.2}
        />
      </svg>
    </Icon>
  ),
  barChart: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" fill="white" fillOpacity={0.22} />
      </svg>
    </Icon>
  ),
  bookOpen: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="white" fillOpacity={0.22} />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </Icon>
  ),
  video: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="5" width="15" height="14" rx="2" fill="white" fillOpacity={0.2} />
        <polygon points="23 7 16 12 23 17 23 7" fill="white" fillOpacity={0.25} />
      </svg>
    </Icon>
  ),
  search: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" fill="white" fillOpacity={0.18} />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </Icon>
  ),
  fileText: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          fill="white"
          fillOpacity={0.18}
        />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </Icon>
  ),
  briefcase: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" fill="white" fillOpacity={0.18} />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    </Icon>
  ),
  diploma: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" fill="white" fillOpacity={0.18} />
        <path d="M4 8h16" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <circle cx="12" cy="20" r="2" fill="white" fillOpacity={0.28} />
        <path d="M10 22l-1 2" />
        <path d="M14 22l1 2" />
      </svg>
    </Icon>
  ),
  tutors: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 10l10-5 10 5-10 5z" fill="white" fillOpacity={0.22} />
        <path d="M22 10v6" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </svg>
    </Icon>
  ),
  settings: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" fill="white" fillOpacity={0.28} />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </Icon>
  ),
  diamond: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3h12l4 6-10 13L2 9z" fill="white" fillOpacity={0.2} />
        <path d="M2 9h20" />
      </svg>
    </Icon>
  ),
  support: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="white" fillOpacity={0.18} />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </Icon>
  ),
  lightbulb: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"
          fill="white"
          fillOpacity={0.18}
        />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    </Icon>
  ),
  building: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" fill="white" fillOpacity={0.18} />
        <path d="M9 22v-4h6v4" />
        <line x1="8" y1="6" x2="8" y2="6" strokeWidth="2.5" />
        <line x1="12" y1="6" x2="12" y2="6" strokeWidth="2.5" />
        <line x1="16" y1="6" x2="16" y2="6" strokeWidth="2.5" />
        <line x1="8" y1="10" x2="8" y2="10" strokeWidth="2.5" />
        <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5" />
        <line x1="16" y1="10" x2="16" y2="10" strokeWidth="2.5" />
      </svg>
    </Icon>
  ),
  users2: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="7" r="4" fill="white" fillOpacity={0.2} />
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </Icon>
  ),
  book: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path
          d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
          fill="white"
          fillOpacity={0.18}
        />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    </Icon>
  ),
  plus: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </Icon>
  ),
  sparkles: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"
          fill="white"
          fillOpacity={0.2}
        />
      </svg>
    </Icon>
  ),
  home: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H15v-6H9v6H4a1 1 0 01-1-1V9.5z"
          fill="white"
          fillOpacity={0.22}
        />
      </svg>
    </Icon>
  ),
  filePen: (c: string) => (
    <Icon color={c}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l5 5v3" fill="white" fillOpacity={0.18} />
        <polyline points="14 2 14 8 20 8" />
        <path d="M18.42 12.61a2.1 2.1 0 1 1 2.97 2.97L16 21H13v-3Z" />
      </svg>
    </Icon>
  ),
};

/* ─── Paleta de colores — muted/sobria, un color por sección ─── */
export const IC = {
  home: '#5865C4', // índigo suave
  profile: '#7558B0', // violeta suave
  feed: '#C07840', // ámbar sobrio
  community: '#A84E7C', // rosa suave
  globe: '#2A9890', // teal suave
  calendar: '#529858', // verde suave
  compass: '#2A9890', // teal suave
  messages: '#2A9890', // teal suave
  dashboard: '#5865C4', // índigo suave
  rooms: '#3A7CC4', // azul suave
  video: '#3A7CC4', // azul suave
  search: '#C07840', // ámbar sobrio
  notes: '#7558B0', // violeta suave
  jobs: '#2A9890', // teal suave
  courses: '#3A7CC4', // azul suave
  tutors: '#5865C4', // índigo suave
  events: '#C05048', // coral suave
  settings: '#64748B', // pizarra
  diamond: '#B05280', // rosa suave
  lightbulb: '#C07840', // ámbar sobrio
  support: '#2A9890', // teal suave
  building: '#5865C4', // índigo suave
  library: '#C07840', // ámbar sobrio
  hr: '#7558B0', // violeta suave
  admin: '#64748B', // pizarra
  workspaces: '#2D62C8', // azul — acento principal Conniku
  ai: '#2A9890', // teal suave
  plus: '#94A3B8', // gris
};

/* ─── Chevron ─── */
export const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.2s ease',
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      opacity: 0.5,
      flexShrink: 0,
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
