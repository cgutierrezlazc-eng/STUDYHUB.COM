/**
 * DashboardV3 — Paso 5 del bloque-piloto-rediseno-v3
 *
 * Dashboard paralelo del estudiante según HTML depositado en
 * Diseno/03-dashboard-estudiante-20260419-1837.html (NOT_ITERATED).
 *
 * IMPORTANTE — STATUS NOT_ITERATED (módulo 03 del paquete de diseño):
 * - Este componente es una propuesta visual para validar con Cristian en Capa 6
 * - Las zonas marcadas [POR ITERAR CON CRISTIAN] requieren decisión antes de pasar a producción
 * - Los datos de actividad usan iniciales anónimas (no nombres reales — personas pendientes catálogo)
 * - Las estadísticas de "horas/documentos/quiz/racha" son del HTML de referencia — deben conectarse a APIs reales
 * - Ver docs/plans/bloque-piloto-rediseno-v3/plan.md §4 Paso 5 y §6 R-07
 *
 * REGLAS:
 * - Envuelto en .v3-surface para tokens del nuevo sistema visual
 * - Se renderiza DENTRO del shell autenticado (respeta Sidebar + TopBar del App.tsx)
 * - Ruta: /dashboard-v3 (paralela a /dashboard que está FROZEN)
 * - Dashboard.tsx original NO se toca (FROZEN)
 * - Sin "IA", "AI", "inteligencia artificial" en texto al usuario
 * - Tuteo chileno siempre
 * - Avatares con iniciales, sin nombres reales (personas reales pendiente catálogo 00-PEOPLE-AUTHORIZED)
 * - Sin Framer Motion ni dependencias nuevas
 */
import React from 'react';
import BrandWordmark from '../../components/v3/BrandWordmark';

interface Props {
  onNavigate: (path: string) => void;
}

export default function DashboardV3({ onNavigate }: Props) {
  /* ── Datos placeholder — conectar a APIs reales en iteración ─────
   * [POR ITERAR CON CRISTIAN]: estos valores vienen del HTML NOT_ITERATED.
   * En producción deben venir de:
   *   - GET /api/v1/student/subjects/count
   *   - GET /api/v1/student/calendar/week
   *   - GET /api/v1/student/stats/week
   */
  const userName = '[POR ITERAR CON CRISTIAN]'; // desde auth context / JWT claims
  const semesterLabel = '2026-1';
  const semesterProgress = 34; // porcentaje — [POR ITERAR CON CRISTIAN]: GET /api/v1/student/credits/current
  const semesterDay = 41;
  const semesterTotal = 120;

  return (
    <div className="v3-surface" style={rootStyle}>
      {/* ── Barra de progreso semestral ───────────────────────── */}
      <div
        style={topProgressStyle}
        role="status"
        aria-label={`Semestre ${semesterLabel} — día ${semesterDay} de ${semesterTotal}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={pulseDotStyle} aria-hidden="true" />
          <span>Semestre {semesterLabel}</span>
        </div>
        <div
          style={progressBarWrapStyle}
          role="progressbar"
          aria-valuenow={semesterProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso del semestre: ${semesterProgress}%`}
        >
          <div style={{ ...progressBarFillStyle, width: `${semesterProgress}%` }} />
        </div>
        {/* [POR ITERAR CON CRISTIAN]: validar que "día 41 de 120" venga de API y no sea hardcoded */}
        <span
          style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '.08em' }}
        >
          {semesterProgress}% · día {semesterDay} de {semesterTotal}
        </span>
      </div>

      {/* ── Nav horizontal ─────────────────────────────────────── */}
      {/*
       * [POR ITERAR CON CRISTIAN]: este nav es del HTML NOT_ITERATED.
       * En la app autenticada, el Sidebar del App.tsx ya maneja navegación.
       * En /dashboard-v3 el layout respeta Sidebar + TopBar (decisión P-3 → opción A).
       * Este nav se mantiene solo en el área de contenido para la propuesta visual.
       */}
      <div style={navWrapStyle}>
        <nav style={navStyle} aria-label="Navegación del dashboard">
          <a
            href="/"
            style={navBrandStyle}
            aria-label="Conniku — ir al inicio"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
          >
            <BrandWordmark size={22} />
          </a>
          <div style={navLinksStyle} role="list">
            {[
              { label: 'Estudio', path: '/dashboard-v3', active: true },
              { label: 'Biblioteca', path: '/biblioteca' },
              { label: 'Tutores', path: '/tutores' },
              { label: 'Empleo', path: '/jobs' },
              { label: 'Comunidad', path: '/communities' },
            ].map(({ label, path, active }) => (
              <button
                key={label}
                role="listitem"
                onClick={() => onNavigate(path)}
                style={navLinkStyle(!!active)}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={searchSlotStyle} aria-label="Buscar — usa ⌘K">
            <span>Buscar</span>
            <kbd style={kbdStyle}>⌘K</kbd>
          </div>
          <button
            style={createBtnStyle}
            onClick={() => onNavigate('/workspaces')}
            aria-label="Crear workspace"
          >
            Crear{' '}
            <span style={createBtnRingStyle} aria-hidden="true">
              +
            </span>
          </button>
        </nav>
      </div>

      {/* ── Contenido principal ────────────────────────────────── */}
      <main style={mainStyle}>
        {/* Status chip — [POR ITERAR CON CRISTIAN]: número desde GET /api/v1/student/peers/count */}
        <div style={statusChipStyle} aria-label="Estudiantes conectados ahora">
          <div style={statusDotStyle} aria-hidden="true" />
          <span>estudiando ahora mismo</span>
          {/* [POR ITERAR CON CRISTIAN]: dato real requerido — no usar número del HTML */}
          <span style={statusCountStyle} aria-label="comunidad activa">
            comunidad activa
          </span>
        </div>

        {/* ── Hero saludo ──────────────────────────────────────── */}
        <section style={heroStyle} aria-label="Saludo y resumen del día">
          <h1 style={heroH1Style}>
            <span>Hola, </span>
            <br />
            {/* [POR ITERAR CON CRISTIAN]: nombre real desde auth context */}
            <span style={heroNameStyle}>{userName}</span>
            <span>.</span>
          </h1>
          <p style={heroSubStyle}>
            {/* [POR ITERAR CON CRISTIAN]: datos reales desde APIs de calendario */}
            Tienes <strong style={heroStrongStyle}>tus clases de hoy</strong>, revisa tu agenda y
            los documentos pendientes. <strong style={heroStrongStyle}>Todo en un lugar.</strong>
          </p>
        </section>

        {/* ── Sección "Hoy" ────────────────────────────────────── */}
        <div style={sectionLabelStyle} aria-hidden="true">
          Hoy
        </div>

        <div style={hoyGridStyle}>
          {/* Card: próxima clase — [POR ITERAR CON CRISTIAN]: datos desde GET /api/v1/student/calendar/week */}
          <div style={{ ...cardStyle, transform: 'rotate(-.8deg)' }}>
            <span
              style={{
                ...badgeStyle,
                background: 'var(--lime, #D9FF3A)',
                color: 'var(--lime-ink, #181F08)',
              }}
            >
              Próxima clase
            </span>
            {/* [POR ITERAR CON CRISTIAN]: hora, nombre, sala desde API calendario */}
            <div style={cardTimeStyle}>10:30 — 12:00</div>
            <div style={cardTitleStyle}>[POR ITERAR CON CRISTIAN]</div>
            <div style={cardMetaStyle}>Datos de calendario pendientes · día y sala desde API</div>
            <button
              style={cardActionStyle}
              onClick={() => onNavigate('/calendar')}
              aria-label="Ir al calendario"
            >
              Ver calendario →
            </button>
          </div>

          {/* Card: documentos recientes — [POR ITERAR CON CRISTIAN]: datos desde workspaces API */}
          <div
            style={{
              ...cardStyle,
              transform: 'rotate(.5deg)',
              background: 'var(--cream, #FFE9B8)',
            }}
          >
            <span style={{ ...badgeStyle, background: 'var(--ink, #0D0F10)', color: '#fff' }}>
              Tus documentos
            </span>
            <div style={{ ...cardTitleStyle, marginTop: 16 }}>Recientes</div>
            {/* [POR ITERAR CON CRISTIAN]: lista real desde GET /api/v1/workspaces/recent */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Documento reciente 1', time: 'hace un momento' },
                { name: 'Documento reciente 2', time: 'ayer' },
                { name: 'Documento reciente 3', time: 'hace 3 días' },
              ].map((doc) => (
                <div key={doc.name} style={docItemStyle}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{doc.name}</span>
                  <span
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 11,
                      color: 'rgba(13,15,16,0.5)',
                    }}
                  >
                    {doc.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: último quiz — [POR ITERAR CON CRISTIAN]: datos desde quizzes API */}
          <div
            style={{
              ...cardStyle,
              transform: 'rotate(-.3deg)',
              background: 'var(--ink, #0D0F10)',
              color: '#fff',
              border: '2px solid var(--ink, #0D0F10)',
            }}
          >
            <span
              style={{
                ...badgeStyle,
                background: 'var(--lime, #D9FF3A)',
                color: 'var(--lime-ink, #181F08)',
              }}
            >
              Último quiz
            </span>
            {/* [POR ITERAR CON CRISTIAN]: nombre del quiz y score desde GET /api/v1/quizzes/recent */}
            <div style={{ ...cardTitleStyle, color: '#fff', marginTop: 16 }}>
              [POR ITERAR CON CRISTIAN]
            </div>
            <div
              style={{
                fontFamily: "'Funnel Display', sans-serif",
                fontWeight: 900,
                fontSize: 80,
                lineHeight: 1,
                letterSpacing: '-.04em',
                margin: '20px 0 8px',
              }}
            >
              --
            </div>
            <div
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
              }}
            >
              sobre 100
            </div>
            <div
              style={{
                marginTop: 16,
                height: 4,
                background: 'rgba(255,255,255,.15)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div style={{ width: '0%', height: '100%', background: 'var(--lime, #D9FF3A)' }} />
            </div>
          </div>
        </div>

        {/* ── Timeline del día ─────────────────────────────────── */}
        {/* [POR ITERAR CON CRISTIAN]: slots desde GET /api/v1/student/calendar/week */}
        <div style={sectionLabelStyle} aria-hidden="true">
          Tu día
        </div>
        <div style={timelineStyle} role="list" aria-label="Agenda del día">
          {[
            { hour: '7:00', event: 'Descanso', type: 'rest' },
            { hour: '9:00', event: '[POR ITERAR]', type: 'normal' },
            { hour: '10:30', event: '[POR ITERAR]', type: 'now' },
            { hour: '12:30', event: 'Almuerzo', type: 'normal' },
            { hour: '14:00', event: '[POR ITERAR]', type: 'busy' },
            { hour: '16:00', event: 'Estudio libre', type: 'normal' },
            { hour: '18:00', event: '[POR ITERAR]', type: 'normal' },
            { hour: '20:00', event: 'Descanso', type: 'rest' },
          ].map(({ hour, event, type }) => (
            <div
              key={hour}
              role="listitem"
              style={slotStyle(type)}
              aria-label={`${hour}: ${event}${type === 'now' ? ' (ahora)' : ''}`}
            >
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  color: type === 'busy' ? 'rgba(255,255,255,.8)' : 'rgba(13,15,16,0.5)',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}
              >
                {hour}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.2,
                  color: type === 'busy' ? '#fff' : 'var(--ink, #0D0F10)',
                }}
              >
                {event}
              </div>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background:
                    type === 'now'
                      ? 'var(--ink, #0D0F10)'
                      : type === 'busy'
                        ? '#fff'
                        : 'rgba(13,15,16,0.15)',
                }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        {/* ── Estadísticas de la semana ─────────────────────────── */}
        {/* [POR ITERAR CON CRISTIAN]: valores desde GET /api/v1/student/stats/week */}
        <div style={sectionLabelStyle} aria-hidden="true">
          Esta semana
        </div>
        <div style={statsGridStyle}>
          {[
            {
              label: 'Horas estudiadas',
              value: '--',
              note: 'Datos pendientes de API',
              highlight: true,
            },
            { label: 'Documentos', value: '--', note: 'creados esta semana', highlight: false },
            { label: 'Promedio quiz', value: '--', note: 'sobre 10', highlight: false },
            { label: 'Racha', value: '--', note: 'días estudiando seguido', highlight: false },
          ].map(({ label, value, note, highlight }) => (
            <div key={label} style={statStyle(highlight)}>
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: highlight ? 'var(--lime, #D9FF3A)' : 'rgba(13,15,16,0.5)',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'Funnel Display', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  lineHeight: 1,
                  letterSpacing: '-.03em',
                  color: highlight ? '#fff' : 'var(--ink, #0D0F10)',
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: highlight ? 'rgba(255,255,255,.6)' : 'rgba(13,15,16,0.5)',
                  marginTop: 8,
                }}
              >
                {note}
              </div>
            </div>
          ))}
        </div>

        {/* ── Actividad reciente ────────────────────────────────── */}
        {/* [POR ITERAR CON CRISTIAN]:
         *   - Datos reales desde GET /api/v1/student/activity
         *   - Personas: usar solo catálogo 00-PEOPLE-AUTHORIZED (pendiente)
         *   - Hoy se usan iniciales anónimas por decisión P-2 del plan (avatares con iniciales)
         */}
        <div style={activityCardStyle}>
          <h2 style={activityTitleStyle}>
            Actividad <span style={activityAccentStyle}>reciente</span>
          </h2>
          {[
            {
              icon: 'c',
              iconBg: 'var(--cyan, #00C2FF)',
              iconColor: 'var(--ink, #0D0F10)',
              title: 'VN respondió en tu workspace',
              body: '[POR ITERAR CON CRISTIAN] — mensaje desde API actividad',
              time: 'hace un momento',
            },
            {
              icon: '@',
              iconBg: 'var(--pink, #FF4D3A)',
              iconColor: '#fff',
              title: 'FG te mencionó en un documento',
              body: '[POR ITERAR CON CRISTIAN] — mención desde API actividad',
              time: 'hace 1h',
            },
            {
              icon: '★',
              iconBg: 'var(--lime, #D9FF3A)',
              iconColor: 'var(--lime-ink, #181F08)',
              title: 'Lograste tu racha de estudio',
              body: 'Sigue así, vas muy bien.',
              time: 'hoy',
            },
            {
              icon: '✎',
              iconBg: 'var(--violet, #6B4EFF)',
              iconColor: '#fff',
              title: 'Nuevo material disponible',
              body: '[POR ITERAR CON CRISTIAN] — dato desde API cursos',
              time: 'ayer',
            },
          ].map(({ icon, iconBg, iconColor, title, body, time }) => (
            <div key={title} style={activityItemStyle}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  background: iconBg,
                  color: iconColor,
                  fontWeight: 900,
                  fontSize: 18,
                }}
                aria-hidden="true"
              >
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink, #0D0F10)' }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(13,15,16,0.6)', marginTop: 2 }}>
                  {body}
                </div>
                <div
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 11,
                    color: 'rgba(13,15,16,0.4)',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    marginTop: 4,
                  }}
                >
                  {time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Nota de iteración ─────────────────────────────────── */}
        <div style={iterationNoteStyle} role="note" aria-label="Nota de desarrollo">
          <span style={{ fontWeight: 700 }}>Módulo NOT_ITERATED</span> — Esta es la propuesta visual
          inicial. Los datos con "[POR ITERAR CON CRISTIAN]" requieren decisión antes de pasar a
          producción. Compara con{' '}
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'inherit',
              color: 'inherit',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            /dashboard (legacy)
          </button>
          .
        </div>
      </main>
    </div>
  );
}

/* ── Estilos inline (tokens v3 via var()) ────────────────────────── */
const rootStyle: React.CSSProperties = {
  background: 'var(--paper, #F5F4EF)',
  color: 'var(--ink, #0D0F10)',
  fontFamily: "'Funnel Display', -apple-system, sans-serif",
  minHeight: '100%',
};

const topProgressStyle: React.CSSProperties = {
  background: 'var(--ink, #0D0F10)',
  color: '#fff',
  padding: '8px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
};

const pulseDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'var(--lime, #D9FF3A)',
  animation: 'none' /* sin keyframes inline — CSS prefers-reduced-motion no puede aplicarse */,
};

const progressBarWrapStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: 180,
  height: 4,
  background: 'rgba(255,255,255,.15)',
  borderRadius: 4,
  margin: '0 20px',
  overflow: 'hidden',
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, var(--lime, #D9FF3A), var(--pink, #FF4D3A))',
  borderRadius: 4,
};

const navWrapStyle: React.CSSProperties = {
  padding: '18px 28px 0',
  display: 'flex',
  justifyContent: 'center',
};

const navStyle: React.CSSProperties = {
  maxWidth: 1240,
  width: '100%',
  background: '#fff',
  border: '1px solid var(--line, #D2CFC3)',
  borderRadius: 999,
  padding: '10px 14px 10px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 28,
};

const navBrandStyle: React.CSSProperties = {
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: 22,
  flex: 1,
};

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 15,
  fontWeight: 600,
  color: active ? 'var(--ink, #0D0F10)' : 'rgba(13,15,16,0.5)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
});

const searchSlotStyle: React.CSSProperties = {
  fontFamily: "'Geist Mono', monospace",
  fontSize: 13,
  color: 'rgba(13,15,16,0.5)',
  border: '1px solid var(--line-soft, #E2DFD4)',
  borderRadius: 999,
  padding: '6px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const kbdStyle: React.CSSProperties = {
  background: 'var(--paper-2, #EBE9E1)',
  padding: '2px 7px',
  borderRadius: 6,
  fontSize: 11,
  color: 'rgba(13,15,16,0.7)',
};

const createBtnStyle: React.CSSProperties = {
  background: 'var(--ink, #0D0F10)',
  color: '#fff',
  padding: '10px 14px 10px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontWeight: 700,
  fontSize: 14,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const createBtnRingStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  background: 'var(--lime, #D9FF3A)',
  display: 'grid',
  placeItems: 'center',
  color: 'var(--ink, #0D0F10)',
  fontWeight: 900,
  fontSize: 14,
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '60px 28px 120px',
};

const statusChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  background: '#fff',
  border: '1px solid var(--line, #D2CFC3)',
  borderRadius: 999,
  padding: '8px 14px',
  fontFamily: "'Geist Mono', monospace",
  fontSize: 12,
  color: 'rgba(13,15,16,0.7)',
  letterSpacing: '.08em',
  textTransform: 'uppercase',
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'var(--orange, #FF4A1C)',
};

const statusCountStyle: React.CSSProperties = {
  background: 'var(--lime, #D9FF3A)',
  color: 'var(--lime-ink, #181F08)',
  padding: '2px 9px',
  borderRadius: 999,
  fontWeight: 700,
  letterSpacing: 0,
};

const heroStyle: React.CSSProperties = {
  marginTop: 24,
  marginBottom: 56,
};

const heroH1Style: React.CSSProperties = {
  fontFamily: "'Funnel Display', sans-serif",
  fontWeight: 900,
  fontSize: 'clamp(56px, 9vw, 120px)',
  lineHeight: 0.9,
  letterSpacing: '-.04em',
};

const heroNameStyle: React.CSSProperties = {
  background: 'var(--lime, #D9FF3A)',
  padding: '2px 18px 6px',
  borderRadius: 14,
  display: 'inline-block',
  transform: 'rotate(-1deg)',
};

const heroSubStyle: React.CSSProperties = {
  marginTop: 28,
  maxWidth: 600,
  fontSize: 20,
  lineHeight: 1.45,
  color: 'rgba(13,15,16,0.7)',
  fontWeight: 500,
};

const heroStrongStyle: React.CSSProperties = {
  background: 'var(--cream, #FFE9B8)',
  padding: '2px 8px',
  borderRadius: 6,
  fontWeight: 700,
};

const sectionLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'rgba(13,15,16,0.5)',
  marginBottom: 18,
};

const hoyGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 20,
  marginBottom: 72,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '2px solid var(--ink, #0D0F10)',
  borderRadius: 24,
  padding: 28,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 14px',
  borderRadius: 999,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
};

const cardTimeStyle: React.CSSProperties = {
  fontFamily: "'Geist Mono', monospace",
  fontSize: 13,
  color: 'rgba(13,15,16,0.5)',
  margin: '14px 0 6px',
  letterSpacing: '.08em',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Funnel Display', sans-serif",
  fontWeight: 800,
  fontSize: 28,
  letterSpacing: '-.02em',
  lineHeight: 1.05,
};

const cardMetaStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'rgba(13,15,16,0.6)',
  marginTop: 12,
};

const cardActionStyle: React.CSSProperties = {
  marginTop: 20,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--ink, #0D0F10)',
  cursor: 'pointer',
  borderBottom: '2px solid var(--ink, #0D0F10)',
  paddingBottom: 2,
  background: 'none',
  border: 'none',
  borderBottomWidth: 2,
  borderBottomStyle: 'solid',
  borderBottomColor: 'var(--ink, #0D0F10)',
  fontFamily: 'inherit',
};

const docItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px dashed rgba(13,15,16,.2)',
};

const timelineStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gap: 10,
  marginBottom: 72,
};

const slotStyle = (type: string): React.CSSProperties => ({
  background:
    type === 'now'
      ? 'var(--lime, #D9FF3A)'
      : type === 'busy'
        ? 'var(--pink, #FF4D3A)'
        : type === 'rest'
          ? 'var(--paper-2, #EBE9E1)'
          : '#fff',
  border: '2px solid var(--ink, #0D0F10)',
  borderRadius: 16,
  padding: '16px 12px',
  minHeight: 100,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transform: type === 'now' ? 'rotate(-1deg)' : 'none',
});

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 72,
};

const statStyle = (highlight: boolean): React.CSSProperties => ({
  padding: 24,
  border: '2px solid var(--ink, #0D0F10)',
  borderRadius: 24,
  background: highlight ? 'var(--ink, #0D0F10)' : '#fff',
});

const activityCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '2px solid var(--ink, #0D0F10)',
  borderRadius: 24,
  padding: 28,
  marginBottom: 32,
};

const activityTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 32,
  letterSpacing: '-.03em',
  marginBottom: 20,
};

const activityAccentStyle: React.CSSProperties = {
  background: 'var(--violet, #6B4EFF)',
  color: '#fff',
  padding: '0 10px',
  borderRadius: 6,
  transform: 'rotate(-.8deg)',
  display: 'inline-block',
};

const activityItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: '14px 0',
  borderBottom: '1px solid var(--line-soft, #E2DFD4)',
};

const iterationNoteStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 8,
  background: 'rgba(107,78,255,0.08)',
  border: '1px solid rgba(107,78,255,0.2)',
  fontSize: 12,
  color: 'rgba(13,15,16,0.7)',
  lineHeight: 1.6,
};
