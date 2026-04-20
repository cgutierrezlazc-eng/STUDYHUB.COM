/**
 * BusinessPanel.tsx
 * Dropdown "Conniku Business" con 9 cards de módulos.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 724-860
 *
 * COPY NOTES:
 * - Links de bp-items apuntan a /business/{slug} — declarados como PENDING
 *   (módulos Business no implementados aún). Se usa href="#" + preventDefault.
 * - El panel 04 en el HTML dice "Talento" (no "Reclutamiento") — se mantiene
 *   el nombre del HTML fuente como fuente de verdad.
 */
import React from 'react';
import styles from '../Landing.module.css';

interface BusinessPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
  btnRef: React.RefObject<HTMLButtonElement>;
}

const businessModules = [
  {
    num: '01',
    name: 'Personas',
    slug: 'personas',
    color: '#D9FF3A',
    ink: '#181F08',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="24" cy="16" r="5.5" fill="currentColor" />
        <path d="M14 32 Q14 24 24 24 Q34 24 34 32 L34 36 L14 36 Z" fill="currentColor" />
        <circle cx="9" cy="13" r="3.2" fill="currentColor" />
        <path d="M3 23 Q3 19 9 19 Q14 19 14 23 L14 28 L3 28 Z" fill="currentColor" />
        <circle cx="32" cy="7" r="2.5" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '02',
    name: 'Contabilidad',
    slug: 'contabilidad',
    color: '#FFE9B8',
    ink: '#0D0F10',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="11" cy="26" r="8" fill="currentColor" />
        <text
          x="11"
          y="31"
          textAnchor="middle"
          fontFamily="Funnel Display,sans-serif"
          fontWeight="900"
          fontSize="13"
          fill="#FFE9B8"
        >
          $
        </text>
        <rect x="22" y="24" width="4" height="10" rx="1" fill="currentColor" />
        <rect
          x="28"
          y="18"
          width="4"
          height="16"
          rx="1"
          fill="currentColor"
          transform="rotate(2 30 26)"
        />
        <rect
          x="34"
          y="12"
          width="4"
          height="22"
          rx="1"
          fill="currentColor"
          transform="rotate(-2 36 23)"
        />
        <circle cx="5" cy="8" r="2.5" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '03',
    name: 'Trabajo',
    slug: 'trabajo',
    color: '#FF4D3A',
    ink: '#FFFFFF',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <g transform="rotate(-5 20 22)">
          <rect x="5" y="16" width="22" height="16" rx="2.2" fill="currentColor" />
          <path
            d="M11 16 L11 12 Q11 9.5 13.5 9.5 L18.5 9.5 Q21 9.5 21 12 L21 16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <line x1="5" y1="21" x2="27" y2="21" stroke="#0D0F10" strokeWidth="1.2" />
          <rect x="13" y="19" width="5" height="4" rx=".8" fill="#0D0F10" />
        </g>
        <circle cx="32" cy="10" r="5" fill="#0D0F10" stroke="#fff" strokeWidth="1.5" />
        <path
          d="M29.5 10 L31 11.5 L34 8.5"
          stroke="#D9FF3A"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="6" cy="8" r="2" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '04',
    name: 'Talento',
    slug: 'reclutamiento',
    color: '#6B4EFF',
    ink: '#FFFFFF',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="15" cy="15" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.8" />
        <line
          x1="21.5"
          y1="21.5"
          x2="32"
          y2="32"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx="15" cy="12" r="2.2" fill="currentColor" />
        <path d="M11 19 Q11 15 15 15 Q19 15 19 19 L19 20 L11 20 Z" fill="currentColor" />
        <circle cx="28" cy="9" r="4.5" fill="#D9FF3A" stroke="#0D0F10" strokeWidth="1.5" />
        <path
          d="M28 6 L28.8 8.2 L31 8.2 L29.2 9.5 L30 11.8 L28 10.5 L26 11.8 L26.8 9.5 L25 8.2 L27.2 8.2 Z"
          fill="#0D0F10"
        />
        <circle cx="6" cy="30" r="2" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '05',
    name: 'Payroll',
    slug: 'payroll',
    color: '#00C2FF',
    ink: '#0D0F10',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <g transform="rotate(-3 18 20)">
          <rect
            x="4"
            y="12"
            width="26"
            height="18"
            rx="2"
            fill="currentColor"
            stroke="#0D0F10"
            strokeWidth="1.5"
          />
          <line x1="7" y1="19" x2="18" y2="19" stroke="#0D0F10" strokeWidth="1.3" />
          <line x1="7" y1="23" x2="22" y2="23" stroke="#0D0F10" strokeWidth="1.3" />
          <circle cx="24" cy="23" r="5" fill="#0D0F10" />
          <text
            x="24"
            y="26"
            textAnchor="middle"
            fontFamily="Funnel Display,sans-serif"
            fontWeight="900"
            fontSize="7"
            fill="#D9FF3A"
          >
            $
          </text>
        </g>
        <circle cx="33" cy="9" r="5" fill="#FF4A1C" stroke="#0D0F10" strokeWidth="1.5" />
        <path
          d="M31 9 L32.5 10.5 L35.5 7.5"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="6" cy="34" r="2" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '06',
    name: 'CRM',
    slug: 'crm',
    color: '#4F3AB8',
    ink: '#FFFFFF',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="18" cy="14" r="5" fill="currentColor" />
        <path d="M10 28 Q10 22 18 22 Q26 22 26 28 L26 32 L10 32 Z" fill="currentColor" />
        <path
          d="M24 8 L33 8 Q36 8 36 11 L36 17 Q36 20 33 20 L30 20 L28 23 L28 20 L24 20 Q21 20 21 17 L21 11 Q21 8 24 8 Z"
          fill="currentColor"
          opacity=".85"
        />
        <circle cx="26" cy="14" r="1.4" fill="#0D0F10" />
        <circle cx="30" cy="14" r="1.4" fill="#0D0F10" />
        <circle cx="34" cy="14" r="1.4" fill="#0D0F10" />
        <circle cx="6" cy="34" r="2" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '07',
    name: 'Operaciones',
    slug: 'operaciones',
    color: '#4A6FA5',
    ink: '#FFFFFF',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect x="5" y="10" width="10" height="24" rx="2" fill="currentColor" />
        <rect x="7" y="12" width="6" height="5" rx="1" fill="#D9FF3A" />
        <rect x="7" y="19" width="6" height="3" rx="1" fill="#fff" opacity=".6" />
        <rect x="18" y="10" width="10" height="16" rx="2" fill="currentColor" />
        <rect x="20" y="12" width="6" height="3" rx="1" fill="#FF4D3A" />
        <rect x="20" y="17" width="6" height="4" rx="1" fill="#fff" opacity=".6" />
        <rect x="31" y="10" width="6" height="10" rx="2" fill="currentColor" />
        <rect x="32" y="12" width="4" height="2" rx="1" fill="#00C2FF" />
        <circle cx="6" cy="36" r="2" fill="#FF4A1C" />
      </svg>
    ),
  },
  {
    num: '08',
    name: 'Ventas',
    slug: 'ventas',
    color: '#FF7A6F',
    ink: '#0D0F10',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M6 32 L14 22 L22 26 L34 10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M28 10 L34 10 L34 16"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="14" cy="22" r="3" fill="currentColor" />
        <circle cx="22" cy="26" r="3" fill="currentColor" />
        <circle cx="30" cy="30" r="5" fill="#0D0F10" stroke="#fff" strokeWidth="1.5" />
        <text
          x="30"
          y="33"
          textAnchor="middle"
          fontFamily="Funnel Display,sans-serif"
          fontWeight="900"
          fontSize="7"
          fill="#D9FF3A"
        >
          $
        </text>
      </svg>
    ),
  },
  {
    num: '09',
    name: 'Inventario',
    slug: 'inventario',
    color: '#C9B581',
    ink: '#0D0F10',
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect
          x="6"
          y="18"
          width="13"
          height="13"
          rx="1.5"
          fill="currentColor"
          stroke="#0D0F10"
          strokeWidth="1.5"
        />
        <line x1="6" y1="24" x2="19" y2="24" stroke="#0D0F10" strokeWidth="1.3" />
        <line x1="12.5" y1="18" x2="12.5" y2="31" stroke="#0D0F10" strokeWidth="1.3" />
        <rect
          x="21"
          y="12"
          width="13"
          height="13"
          rx="1.5"
          fill="currentColor"
          stroke="#0D0F10"
          strokeWidth="1.5"
          transform="rotate(3 27.5 18.5)"
        />
        <line
          x1="21"
          y1="18"
          x2="34"
          y2="18"
          stroke="#0D0F10"
          strokeWidth="1.3"
          transform="rotate(3 27.5 18.5)"
        />
        <circle cx="32" cy="30" r="4.5" fill="#0D0F10" />
        <path
          d="M30 30 L31.5 31.5 L34 28.5"
          stroke="#D9FF3A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="6" cy="6" r="2" fill="#FF4A1C" />
      </svg>
    ),
  },
];

export default function BusinessPanel({ isOpen, onToggle, panelRef, btnRef }: BusinessPanelProps) {
  return (
    <div className={styles.businessWrap}>
      <button
        ref={btnRef}
        className={`${styles.businessBtn}${isOpen ? ` ${styles.open}` : ''}`}
        id="business-btn"
        type="button"
        aria-expanded={isOpen}
        aria-controls="business-panel"
        onClick={onToggle}
      >
        <span className={styles.bbDot}></span>
        <span>Conniku Business</span>
        <span className={styles.bbCount}>9</span>
        <span className={styles.bbCaret}>▼</span>
      </button>

      <div
        ref={panelRef}
        className={`${styles.businessPanel}${isOpen ? ` ${styles.open}` : ''}`}
        id="business-panel"
        role="menu"
        aria-labelledby="business-btn"
      >
        <div className={styles.bpHeader}>
          <div>
            <span className={styles.bpKicker}>Suite modular para empresas</span>
            <div className={styles.bpTitle}>
              <span className={styles.bpTitleDot}></span>Conniku Business
            </div>
          </div>
          <span className={styles.bpMeta}>9 módulos</span>
        </div>

        <div className={styles.bpGrid}>
          {businessModules.map((mod) => (
            /* TODO: PENDING destination → /business/{mod.slug}
               cuando esos módulos existan. Por ahora href="#" con preventDefault */
            <a
              key={mod.slug}
              className={styles.bpItem}
              href="#"
              role="menuitem"
              onClick={(e) => e.preventDefault()}
              style={
                {
                  '--bp-color': mod.color,
                  '--bp-ink': mod.ink,
                } as React.CSSProperties
              }
            >
              <span className={styles.bpIcon} style={{ background: mod.color, color: mod.ink }}>
                {mod.icon}
              </span>
              <div className={styles.bpInfo}>
                <div className={styles.bpNum}>{mod.num}</div>
                <div className={styles.bpName}>{mod.name}</div>
              </div>
            </a>
          ))}
        </div>

        <div className={styles.bpFooter}>
          <span>
            Independientes · Integrados · <strong>Todos bajo una cuenta</strong>
          </span>
          <span>
            Cumplimiento <strong>Chile</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
