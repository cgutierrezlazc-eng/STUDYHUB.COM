/**
 * LandingV3.tsx — Landing pública rediseñada (Bloque piloto v3 · Paso 3)
 *
 * Implementa las 13 secciones del handoff hi-fi de Conniku.
 * Fuente de verdad: design_handoff_conniku_landing/README.md
 *
 * Decisiones aplicadas del §11 del plan:
 *   P-1 = C: sin matrix competitiva → sección "Lo único que entrega Conniku"
 *   P-2 = B: avatares anónimos con iniciales (AB, CD, EF...)
 *   P-5 = C: copy sin número → biblioteca extensa, comunidad activa, etc.
 *   D-01: namespace .v3-surface en todo el árbol
 *   D-04: solo CSS + IntersectionObserver, sin Framer Motion
 *
 * Reglas críticas:
 *   - CERO menciones de "IA", "AI", "inteligencia artificial"
 *   - Tuteo chileno (tú/tienes/puedes) NUNCA voseo
 *   - CERO estadísticas inventadas (sin números seguidos de k/M/★)
 *   - CERO mención de competidores por nombre
 */

import React, { useState, useRef, useEffect } from 'react';
import BrandWordmark from '../../components/v3/BrandWordmark';
import BrandTile from '../../components/v3/BrandTile';

/* ─── Hook de animación en scroll ─── */
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    // Guard para entornos sin IntersectionObserver (tests, SSR)
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

/* ─── Wrapper con reveal en scroll ─── */
function Reveal({
  children,
  delay = 0,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`v3-reveal${isVisible ? ' visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

/* ─── Props del componente ─── */
interface LandingV3Props {
  onLogin: () => void;
  onRegister: () => void;
}

/* ─── Datos de las 7 capacidades (P-1=C: sin matrix, sección positiva) ─── */
const CAPABILITIES = [
  {
    id: '01',
    title: 'Sync universitario',
    desc: 'Enlace directo con tu universidad. Calendario, asignaturas y material actualizados automáticamente.',
    color: 'stk-lime',
    rot: '-1.3deg',
  },
  {
    id: '02',
    title: 'Documentos con Athena',
    desc: 'Conversa con tu propio material. Resúmenes y quizzes que nunca se repiten.',
    color: 'stk-pink',
    rot: '1.2deg',
  },
  {
    id: '03',
    title: 'Escritura académica asistida',
    desc: 'Asistente inteligente para informes y trabajos. Retroalimentación en tiempo real.',
    color: 'stk-cream',
    rot: '-0.8deg',
  },
  {
    id: '04',
    title: 'Biblioteca extensa',
    desc: 'Académicos y de interés general. Athena integrada en cada libro para leer contigo.',
    color: 'stk-ink',
    rot: '1.0deg',
  },
  {
    id: '05',
    title: 'Tutorías verificadas',
    desc: 'Tutores titulados. Conniku intermedia el pago. Garantía antifraude en cada sesión.',
    color: 'stk-violet',
    rot: '-1.1deg',
  },
  {
    id: '06',
    title: 'Bolsa laboral + CV',
    desc: 'CV editable y potenciado. Ofertas filtradas por tu carrera y tu universidad.',
    color: 'stk-orange',
    rot: '0.9deg',
  },
  {
    id: '07',
    title: 'Cursos + Diploma Conniku',
    desc: 'Formación interna que suma a tu perfil profesional, con certificado propio.',
    color: 'stk-white',
    rot: '-0.7deg',
  },
];

/* ─── Notificaciones del ticker (decisión P-2=B: anónimos) ─── */
const NOTIFICATIONS = [
  {
    id: 'n1',
    icon: '📚',
    iconBg: '#D9FF3A',
    title: 'Nuevo material subido',
    body: 'Cálculo III — apuntes de la clase de hoy',
    time: 'hace 3 min',
  },
  {
    id: 'n2',
    icon: '🎯',
    iconBg: '#FF4D3A',
    title: 'Quiz disponible',
    body: 'Economía Política — 10 preguntas rápidas',
    time: 'hace 8 min',
  },
  {
    id: 'n3',
    icon: '✅',
    iconBg: '#6B4EFF',
    title: 'Sesión de tutoría confirmada',
    body: 'Mañana a las 15:00 — Estadística II',
    time: 'hace 12 min',
  },
  {
    id: 'n4',
    icon: '💼',
    iconBg: '#FF4A1C',
    title: 'Oferta laboral compatible',
    body: 'Práctica en empresa tech — Santiago',
    time: 'hace 20 min',
  },
];

/* ─── Testimonios (P-2=B: iniciales anónimas) ─── */
const TESTIMONIALS = [
  {
    id: 't1',
    initials: 'MR',
    affiliation: 'Ingeniería Civil · USM',
    messages: [
      { out: false, text: 'Tenía tres ramos encima y no sabía por dónde empezar.' },
      { out: true, text: 'Subí todos los apuntes a Conniku y Athena me hizo un resumen por tema.' },
      {
        out: false,
        text: 'Estudié el doble de eficiente. Pasé los tres ramos.',
      },
    ],
    reaction: '🔥',
  },
  {
    id: 't2',
    initials: 'CP',
    affiliation: 'Psicología · UDP',
    messages: [
      { out: false, text: '¿Y las tutorías son de verdad? ¿No es solo un chat?' },
      {
        out: true,
        text: 'Tutores titulados, pagos protegidos. Conniku actúa como intermediario.',
      },
      { out: false, text: 'Tomé sesiones de Estadística y me fue mejor de lo que esperaba.' },
    ],
    reaction: '💪',
  },
  {
    id: 't3',
    initials: 'FV',
    affiliation: 'Derecho · U. de Chile',
    messages: [
      {
        out: false,
        text: 'Lo que más me sirvió fue la biblioteca. Encontré todo lo que necesitaba.',
      },
      { out: true, text: 'Puedes pedirle a Athena que te explique cualquier párrafo.' },
      {
        out: false,
        text: 'Para Derecho es un cambio de nivel. No volvería a estudiar sin esto.',
      },
    ],
    reaction: '⚖️',
  },
];

/* ─── Slots del día (tuteo, sin voseo) ─── */
const DAY_SLOTS = [
  { time: '07:00', label: 'Repaso matinal', color: '#D9FF3A', active: false },
  { time: '09:30', label: 'Clase sincronizada', color: '#D9FF3A', active: true },
  { time: '12:00', label: 'Quiz rápido', color: '#FF4D3A', active: false },
  { time: '15:00', label: 'Tutoría verificada', color: '#6B4EFF', active: false },
  { time: '18:30', label: 'Escritura académica', color: '#FFE9B8', active: false },
  { time: '22:00', label: 'Biblioteca nocturna', color: '#EBE9E1', active: false },
];

/* ─── Componente principal ─── */
export default function LandingV3({ onLogin, onRegister }: LandingV3Props) {
  const [highlightedNotif, setHighlightedNotif] = useState(0);

  /* Rotación de notificaciones cada 2800ms */
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedNotif((prev) => (prev + 1) % NOTIFICATIONS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="v3-surface" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* ── 0. Barra de progreso superior ── */}
      <div className="v3-progress-bar-wrap" role="banner" aria-label="Estado del semestre">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="v3-pulse-dot" aria-hidden="true" />
          <span
            className="v3-mono-caption"
            style={{ color: 'var(--lime)', fontSize: 11, letterSpacing: '.08em' }}
          >
            Semestre 2026-1
          </span>
        </div>
        <div className="v3-progress-track" aria-hidden="true">
          <div className="v3-progress-fill" style={{ width: '34%' }} />
        </div>
        <span className="v3-mono-caption" style={{ color: 'var(--ink-4)', fontSize: 11 }}>
          comunidad activa
        </span>
      </div>

      {/* ── 1. Nav ── */}
      <header style={{ position: 'sticky', top: 36, zIndex: 99, padding: '12px 16px' }}>
        <nav className="v3-nav" aria-label="Navegación principal">
          {/* Logo */}
          <a
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            aria-label="Conniku — ir al inicio"
          >
            <BrandTile size={28} />
            <BrandWordmark size={20} />
          </a>

          {/* Links desktop */}
          <div
            className="v3-nav-links"
            style={{ display: 'flex', gap: 20, marginLeft: 16 }}
            aria-label="Links de navegación"
          >
            {['Producto', 'Precios', 'Universidad', 'Blog'].map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="v3-nav-link">
                {link}
              </a>
            ))}
          </div>

          {/* Búsqueda */}
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--ink-3)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'text',
            }}
            role="search"
            aria-label="Buscar en Conniku"
          >
            Buscar&nbsp;&nbsp;⌘K
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="v3-btn v3-btn-ghost"
              onClick={onLogin}
              style={{ padding: '10px 22px', fontSize: 15 }}
            >
              Entrar
            </button>
            <button
              type="button"
              className="v3-btn v3-btn-primary"
              onClick={onRegister}
              style={{ padding: '10px 22px', fontSize: 15 }}
            >
              Crear cuenta
              <span className="v3-btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* ── 2. Hero ── */}
      <main>
        <section
          className="v3-section"
          style={{ paddingTop: 80, paddingBottom: 120, position: 'relative', overflow: 'hidden' }}
          aria-labelledby="hero-heading"
        >
          {/* Blobs decorativos */}
          <div
            className="v3-blob"
            aria-hidden="true"
            style={{
              width: 420,
              height: 420,
              background: 'var(--lime)',
              top: -60,
              right: -80,
              opacity: 0.42,
            }}
          />
          <div
            className="v3-blob"
            aria-hidden="true"
            style={{
              width: 500,
              height: 500,
              background: 'var(--pink)',
              bottom: -100,
              left: -120,
              opacity: 0.42,
            }}
          />
          <div
            className="v3-blob"
            aria-hidden="true"
            style={{
              width: 300,
              height: 300,
              background: 'var(--violet)',
              top: '40%',
              right: '10%',
              opacity: 0.3,
            }}
          />

          <div className="v3-container" style={{ position: 'relative', zIndex: 1 }}>
            {/* Chip de estado */}
            <div style={{ marginBottom: 32 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                  padding: '8px 18px',
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                aria-label="Comunidad activa ahora mismo"
              >
                <span className="v3-pulse-dot" aria-hidden="true" />
                <span>
                  estudiando ahora mismo —{' '}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--lime)',
                      color: 'var(--lime-ink)',
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontSize: 13,
                    }}
                  >
                    comunidad activa
                  </span>
                </span>
              </span>
            </div>

            {/* H1 Tagline B (default) */}
            <h1
              id="hero-heading"
              className="v3-heading-hero"
              style={{ marginBottom: 32, maxWidth: '80vw' }}
            >
              <span style={{ display: 'block' }}>
                Tu{' '}
                <span
                  style={{
                    fontStyle: 'normal',
                    WebkitTextStroke: '2.5px var(--ink)',
                    color: 'transparent',
                  }}
                >
                  U
                </span>{' '}
                entera.
              </span>
              <span
                style={{
                  display: 'block',
                  background: 'var(--lime)',
                  color: 'var(--lime-ink)',
                  borderRadius: 'var(--r-sm)',
                  padding: '0 12px',
                  width: 'fit-content',
                }}
              >
                En una
              </span>
              <span style={{ display: 'block', position: 'relative' }}>
                <span
                  className="v3-splatter"
                  style={{ position: 'relative', color: 'var(--pink)' }}
                >
                  sola app.
                </span>
              </span>
            </h1>

            {/* Descripción */}
            <p className="v3-lead" style={{ maxWidth: 440, marginBottom: 36 }}>
              Sincroniza con tu universidad, conversa con tus documentos, accede a una{' '}
              <strong
                style={{
                  background: 'var(--lime)',
                  color: 'var(--lime-ink)',
                  borderRadius: 4,
                  padding: '0 4px',
                }}
              >
                biblioteca extensa
              </strong>
              , encuentra tutores verificados, busca empleo y obtén tu diploma. Todo en un solo
              lugar.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="v3-btn v3-btn-primary"
                onClick={onRegister}
                aria-label="Crear cuenta gratis en Conniku"
              >
                Entrar gratis
                <span className="v3-btn-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button
                type="button"
                className="v3-btn v3-btn-ghost"
                onClick={onLogin}
                aria-label="Iniciar sesión en tu cuenta"
              >
                Ver demo
              </button>
            </div>
          </div>
        </section>

        {/* ── 3. Anti-manifiesto strip ── */}
        <section
          aria-label="Lo que Conniku no es"
          style={{ overflow: 'hidden', padding: '40px 0' }}
        >
          <div className="v3-container" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div aria-hidden="true" style={{ width: 32, height: 2, background: 'var(--ink)' }} />
              <span className="v3-mono-label">lo que conniku NO es</span>
            </div>
          </div>
          <div className="v3-rail-track" aria-hidden="true">
            <div className="v3-rail-content">
              {/* Contenido duplicado para loop CSS sin JS */}
              {[
                { text: 'una red social con clases', positive: false },
                { text: 'UN SOLO LUGAR', positive: true },
                { text: 'una plataforma de videos más', positive: false },
                { text: 'HECHO PARA TI', positive: true },
                { text: 'una app de mensajería académica', positive: false },
                { text: 'CON TU U DE VERDAD', positive: true },
                { text: 'un aula virtual genérica', positive: false },
                { text: 'UN SOLO LUGAR', positive: true },
                { text: 'una plataforma de cursos masivos', positive: false },
                { text: 'HECHO PARA TI', positive: true },
                { text: 'una red social con clases', positive: false },
                { text: 'CON TU U DE VERDAD', positive: true },
                { text: 'una plataforma de videos más', positive: false },
                { text: 'UN SOLO LUGAR', positive: true },
                { text: 'una app de mensajería académica', positive: false },
                { text: 'HECHO PARA TI', positive: true },
                { text: 'un aula virtual genérica', positive: false },
                { text: 'CON TU U DE VERDAD', positive: true },
                { text: 'una plataforma de cursos masivos', positive: false },
                { text: 'UN SOLO LUGAR', positive: true },
              ].map((chip, i) => (
                <span
                  key={i}
                  className={`v3-chip ${chip.positive ? 'v3-chip-positive' : 'v3-chip-negative'}`}
                >
                  {chip.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Sticker grid 7 capacidades ── */}
        <section className="v3-section" id="producto" aria-labelledby="capabilities-heading">
          <div className="v3-container">
            <Reveal>
              <span className="v3-mono-label" style={{ display: 'block', marginBottom: 12 }}>
                01 · lo que hace conniku
              </span>
              <h2
                id="capabilities-heading"
                className="v3-heading-section"
                style={{ marginBottom: 48 }}
              >
                Todo lo que necesitas en tu universidad,{' '}
                <span className="v3-hl-lime">en un solo lugar</span>.
              </h2>
            </Reveal>

            {/* Grid de stickers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 'var(--v3-gap-cards)',
              }}
              role="list"
              aria-label="Las 7 capacidades de Conniku"
            >
              {CAPABILITIES.map((cap, idx) => (
                <Reveal
                  key={cap.id}
                  delay={idx * 60}
                  style={{
                    gridColumn: idx === 0 ? 'span 7' : idx === 1 ? 'span 5' : 'span 4',
                  }}
                >
                  <article
                    className={`v3-sticker ${cap.color}`}
                    style={{ '--rot': cap.rot } as React.CSSProperties}
                    role="listitem"
                    aria-label={`Capacidad ${cap.id}: ${cap.title}`}
                  >
                    <span className="v3-sticker-badge" aria-hidden="true">
                      {cap.id}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(24px, 2.5vw, 34px)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        marginBottom: 10,
                        marginTop: 8,
                        color:
                          cap.color === 'stk-pink' ||
                          cap.color === 'stk-ink' ||
                          cap.color === 'stk-violet' ||
                          cap.color === 'stk-orange'
                            ? '#fff'
                            : 'var(--ink)',
                      }}
                    >
                      {cap.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.4,
                        color:
                          cap.color === 'stk-pink' ||
                          cap.color === 'stk-ink' ||
                          cap.color === 'stk-violet' ||
                          cap.color === 'stk-orange'
                            ? 'rgba(255,255,255,0.85)'
                            : 'var(--ink-2)',
                      }}
                    >
                      {cap.desc}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Sección positiva "Lo único que entrega Conniku" (decisión P-1=C) ── */}
        <section
          className="v3-section"
          aria-labelledby="unique-heading"
          style={{ background: 'var(--paper-2)' }}
        >
          <div className="v3-container">
            <Reveal>
              <span className="v3-mono-label" style={{ display: 'block', marginBottom: 12 }}>
                02 · por qué conniku
              </span>
              <h2 id="unique-heading" className="v3-heading-compare" style={{ marginBottom: 16 }}>
                Siete capacidades. <span className="v3-hl-accent">Una sola app.</span>
              </h2>
              <p
                className="v3-lead"
                style={{ maxWidth: 540, marginBottom: 48, color: 'var(--ink-2)' }}
              >
                Ninguna otra plataforma te da todo esto integrado. Aquí no necesitas pagar seis apps
                distintas ni cambiar de pestaña cada cinco minutos.
              </p>
            </Reveal>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
              }}
              role="list"
              aria-label="Lo único que entrega Conniku"
            >
              {[
                {
                  icon: '🔗',
                  title: 'Sync real con tu universidad',
                  desc: 'No solo un calendario genérico. Conniku se conecta directamente con los sistemas de tu institución.',
                },
                {
                  icon: '🧠',
                  title: 'Athena en cada documento',
                  desc: 'Tu asistente inteligente lee y entiende lo que tú subes. No es un chatbot genérico.',
                },
                {
                  icon: '✍️',
                  title: 'Escritura académica real',
                  desc: 'Retroalimentación específica para el estilo universitario chileno y latinoamericano.',
                },
                {
                  icon: '📖',
                  title: 'Biblioteca integrada',
                  desc: 'Acceso a una colección extensa de libros académicos y generales, con Athena incorporada.',
                },
                {
                  icon: '🛡️',
                  title: 'Tutores con garantía',
                  desc: 'Conniku verifica credenciales y protege tu pago. Si la sesión no fue útil, te devolvemos.',
                },
                {
                  icon: '💼',
                  title: 'Empleo filtrado por carrera',
                  desc: 'Ofertas relevantes para tu perfil, no una lista genérica de miles de publicaciones.',
                },
                {
                  icon: '🎓',
                  title: 'Diploma con respaldo',
                  desc: 'El Diploma Conniku tiene valor real porque los cursos los diseñamos con estándares universitarios.',
                },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div
                    className="v3-sticker stk-white"
                    style={{ '--rot': '0deg' } as React.CSSProperties}
                    role="listitem"
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        fontSize: 28,
                        marginBottom: 12,
                        display: 'block',
                      }}
                    >
                      {item.icon}
                    </div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Notification ticker ── */}
        <section className="v3-section" aria-labelledby="notifications-heading">
          <div className="v3-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 48,
                alignItems: 'center',
              }}
            >
              {/* Copy izquierda */}
              <Reveal>
                <span className="v3-mono-label" style={{ display: 'block', marginBottom: 12 }}>
                  03 · lo que pasa
                </span>
                <h2
                  id="notifications-heading"
                  className="v3-heading-section"
                  style={{ marginBottom: 16 }}
                >
                  En tu universidad, siempre pasa algo.
                </h2>
                <p className="v3-lead" style={{ color: 'var(--ink-2)', maxWidth: 380 }}>
                  Conniku te mantiene al día con lo que importa para tu carrera, sin ruido.
                </p>
              </Reveal>

              {/* Stack de notificaciones */}
              <div
                style={{ position: 'relative', minHeight: 240 }}
                aria-live="polite"
                aria-label="Notificaciones recientes"
              >
                {NOTIFICATIONS.map((notif, idx) => (
                  <div
                    key={notif.id}
                    style={{
                      position: 'absolute',
                      top: idx * 8,
                      left: idx * 4,
                      width: '100%',
                      background: 'var(--card)',
                      border: '2px solid var(--ink)',
                      borderRadius: 'var(--r-card)',
                      padding: '16px 20px',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      transition: 'all 400ms var(--ease)',
                      opacity: idx === highlightedNotif ? 1 : 0.4,
                      transform:
                        idx === highlightedNotif
                          ? 'scale(1) translateY(0)'
                          : `scale(0.96) translateY(${(idx - highlightedNotif) * 60}px)`,
                      zIndex: idx === highlightedNotif ? 10 : 1,
                      boxShadow:
                        idx === highlightedNotif ? '0 8px 32px rgba(13,15,16,0.12)' : 'none',
                    }}
                    aria-hidden={idx !== highlightedNotif}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: notif.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      {notif.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          marginBottom: 2,
                        }}
                      >
                        {notif.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--ink-3)',
                          marginBottom: 4,
                        }}
                      >
                        {notif.time}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{notif.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Big Stats (P-5=C: sin números inventados, copy descriptivo) ── */}
        <section
          className="v3-section"
          style={{ background: 'var(--paper-3)' }}
          aria-labelledby="stats-heading"
        >
          <div className="v3-container">
            <Reveal>
              <h2
                id="stats-heading"
                className="v3-heading-section"
                style={{ marginBottom: 48, textAlign: 'center' }}
              >
                Construido para dar resultado
              </h2>
            </Reveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
                textAlign: 'center',
              }}
              role="list"
              aria-label="Logros de Conniku"
            >
              {[
                {
                  label: 'universidades',
                  value: 'sincronizadas',
                  highlight: 'piloto en Chile',
                  desc: 'conectadas directamente con Conniku',
                },
                {
                  label: 'biblioteca',
                  value: 'extensa',
                  highlight: 'académica y general',
                  desc: 'títulos accesibles con Athena integrada',
                },
                {
                  label: 'pagos',
                  value: 'protegidos',
                  highlight: 'garantía antifraude',
                  desc: 'en cada sesión de tutoría reservada',
                },
                {
                  label: 'comunidad',
                  value: 'activa',
                  highlight: 'y creciendo',
                  desc: 'estudiantes que usan Conniku cada semana',
                },
              ].map((stat, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div role="listitem">
                    <span className="v3-mono-label" style={{ display: 'block', marginBottom: 8 }}>
                      {stat.label}
                    </span>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(36px, 5vw, 72px)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        color: 'var(--ink)',
                        marginBottom: 6,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        background: 'var(--lime)',
                        color: 'var(--lime-ink)',
                        borderRadius: 999,
                        padding: '3px 12px',
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 8,
                      }}
                    >
                      {stat.highlight}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                      {stat.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. Manifesto Quote ── */}
        <section
          className="v3-section"
          style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          aria-labelledby="manifesto-heading"
        >
          {/* Blobs decorativos */}
          <div
            className="v3-blob"
            aria-hidden="true"
            style={{
              width: 350,
              height: 350,
              background: 'var(--cyan)',
              top: -80,
              left: -60,
              opacity: 0.25,
            }}
          />
          <div
            className="v3-blob"
            aria-hidden="true"
            style={{
              width: 350,
              height: 350,
              background: 'var(--pink)',
              bottom: -80,
              right: -60,
              opacity: 0.25,
            }}
          />

          <div className="v3-container" style={{ position: 'relative', zIndex: 1 }}>
            <Reveal>
              <p
                className="v3-mono-label"
                style={{ marginBottom: 32, textAlign: 'center', letterSpacing: '.08em' }}
              >
                — la emoción que queremos para ti —
              </p>
              <h2
                id="manifesto-heading"
                className="v3-heading-manifesto"
                style={{ lineHeight: 0.92 }}
              >
                <span
                  className="v3-hl-lime"
                  style={{ display: 'inline-block', transform: 'rotate(-1.2deg)' }}
                >
                  Concentración
                </span>
                <br />
                <span style={{ position: 'relative' }}>
                  con{' '}
                  <span
                    className="v3-hl-pink v3-splatter"
                    style={{ display: 'inline-block', transform: 'rotate(1.2deg)' }}
                  >
                    pertenencia.
                  </span>
                </span>
              </h2>
              <p
                className="v3-mono-label"
                style={{ marginTop: 32, letterSpacing: '.08em' }}
                aria-label="Puedes enfocarte. Y no estás solo."
              >
                Puedes enfocarte. Y no estás solo.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── 9. Chat Testimonials (P-2=B: iniciales anónimas) ── */}
        <section
          className="v3-section"
          style={{ background: 'var(--paper-2)' }}
          aria-labelledby="testimonials-heading"
        >
          <div className="v3-container">
            <Reveal>
              <span className="v3-mono-label" style={{ display: 'block', marginBottom: 12 }}>
                04 · lo que dicen
              </span>
              <h2
                id="testimonials-heading"
                className="v3-heading-section"
                style={{ marginBottom: 48 }}
              >
                Estudiantes reales. Resultados reales.
              </h2>
            </Reveal>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
              }}
              role="list"
              aria-label="Testimonios de estudiantes"
            >
              {TESTIMONIALS.map((t, tIdx) => (
                <Reveal key={t.id} delay={tIdx * 80}>
                  <article
                    className="v3-sticker stk-white"
                    style={{ '--rot': '0deg' } as React.CSSProperties}
                    role="listitem"
                    aria-label={`Testimonio de estudiante de ${t.affiliation}`}
                  >
                    {/* Encabezado del chat */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
                    >
                      <div className="v3-avatar" aria-hidden="true">
                        {t.initials}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--ink)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {t.initials}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--ink-3)',
                            marginTop: 2,
                          }}
                        >
                          {t.affiliation}
                        </div>
                      </div>
                    </div>

                    {/* Burbujas de chat */}
                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                      aria-label="Conversación"
                    >
                      {t.messages.map((msg, mIdx) => (
                        <div
                          key={mIdx}
                          style={{
                            display: 'flex',
                            justifyContent: msg.out ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '85%',
                              padding: '8px 14px',
                              borderRadius: msg.out ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              background: msg.out ? 'var(--ink)' : 'var(--paper)',
                              color: msg.out ? '#fff' : 'var(--ink-2)',
                              fontSize: 14,
                              lineHeight: 1.4,
                              border: msg.out ? 'none' : '1px solid var(--line)',
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reacción */}
                    <div
                      style={{ marginTop: 14, textAlign: 'right', fontSize: 20 }}
                      aria-hidden="true"
                    >
                      {t.reaction}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. Day in Conniku (tuteo chileno: "contigo", sin voseo) ── */}
        <section className="v3-section" aria-labelledby="day-heading">
          <div className="v3-container">
            <Reveal>
              <span className="v3-mono-label" style={{ display: 'block', marginBottom: 12 }}>
                06 · tu día
              </span>
              <h2 id="day-heading" className="v3-heading-section" style={{ marginBottom: 48 }}>
                De las 7 AM a medianoche, contigo.
              </h2>
            </Reveal>

            <div
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                paddingBottom: 8,
              }}
              role="list"
              aria-label="Actividades disponibles durante el día"
            >
              {DAY_SLOTS.map((slot, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div
                    style={{
                      minWidth: 160,
                      border: '2px solid var(--ink)',
                      borderRadius: 'var(--r-card)',
                      padding: '20px 18px',
                      background: slot.active ? slot.color : 'var(--card)',
                      position: 'relative',
                    }}
                    role="listitem"
                    aria-label={`${slot.time}: ${slot.label}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {slot.active && <span className="v3-pulse-dot" aria-hidden="true" />}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--ink-3)',
                          letterSpacing: '.08em',
                        }}
                      >
                        {slot.time}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        lineHeight: 1.3,
                      }}
                    >
                      {slot.label}
                    </div>
                    {slot.active && (
                      <div
                        style={{
                          marginTop: 6,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--lime-ink)',
                          background: 'var(--ink)',
                          borderRadius: 999,
                          padding: '2px 8px',
                          display: 'inline-block',
                        }}
                        aria-label="Activo ahora"
                      >
                        en curso
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 11. Multi-país / alcance (P-5=C: sin números inventados) ── */}
        <section className="v3-section v3-section-dark" aria-labelledby="world-heading">
          <div className="v3-container">
            <Reveal>
              <span
                className="v3-mono-label"
                style={{ display: 'block', marginBottom: 12, color: 'var(--lime)' }}
              >
                07 · alcance
              </span>
              <h2
                id="world-heading"
                className="v3-heading-section"
                style={{ color: '#fff', marginBottom: 48 }}
              >
                Multi-U, multi-país, <span style={{ color: 'var(--lime)' }}>multi-idioma</span>.
                Desde el día uno.
              </h2>
            </Reveal>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                gap: 20,
                marginBottom: 40,
              }}
              role="list"
              aria-label="Presencia por país"
            >
              {/* Chile — LIVE */}
              <Reveal>
                <div
                  style={{
                    background: 'var(--lime)',
                    color: 'var(--lime-ink)',
                    borderRadius: 'var(--r-card)',
                    padding: '32px 28px',
                  }}
                  role="listitem"
                  aria-label="Chile: mercado piloto activo"
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.1em',
                      marginBottom: 12,
                    }}
                  >
                    EN VIVO · 2026
                  </div>
                  <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">
                    🇨🇱
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.1em',
                      marginBottom: 6,
                      opacity: 0.7,
                    }}
                  >
                    MERCADO PILOTO · SANTIAGO
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 36,
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    activo
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>universidades sincronizadas</div>
                </div>
              </Reveal>

              {/* México */}
              <Reveal delay={100}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 'var(--r-card)',
                    padding: '32px 28px',
                    color: '#fff',
                  }}
                  role="listitem"
                  aria-label="México: expansión próxima en 2026"
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.1em',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: 12,
                    }}
                  >
                    PRÓXIMO · Q3 2026
                  </div>
                  <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">
                    🇲🇽
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.1em',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: 6,
                    }}
                  >
                    EXPANSIÓN LATAM
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 36,
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                      color: '#fff',
                    }}
                  >
                    millones
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4, color: 'rgba(255,255,255,0.7)' }}>
                    de universitarios esperando
                  </div>
                </div>
              </Reveal>

              {/* USA */}
              <Reveal delay={200}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--r-card)',
                    padding: '32px 28px',
                    color: '#fff',
                  }}
                  role="listitem"
                  aria-label="Estados Unidos: plan para 2027"
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.1em',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: 12,
                    }}
                  >
                    PLAN · 2027
                  </div>
                  <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">
                    🇺🇸
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '.1em',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: 6,
                    }}
                  >
                    MERCADO HISPANO
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 36,
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                      color: '#fff',
                      opacity: 0.5,
                    }}
                  >
                    crecimiento
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4, color: 'rgba(255,255,255,0.5)' }}>
                    hispano global
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Chips de idioma */}
            <div
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
              role="list"
              aria-label="Idiomas disponibles"
            >
              {[
                { label: 'ES · Español', active: true },
                { label: 'EN · English', active: false },
                { label: 'PT · Português', active: false },
                { label: '+ más idiomas en 2027', active: false, dim: true },
              ].map((lang, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    padding: '6px 16px',
                    borderRadius: 999,
                    background: lang.active ? 'var(--lime)' : 'rgba(255,255,255,0.1)',
                    color: lang.active ? 'var(--lime-ink)' : 'rgba(255,255,255,0.7)',
                    letterSpacing: '.08em',
                    opacity: lang.dim ? 0.4 : 1,
                    border: lang.active ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}
                  role="listitem"
                >
                  {lang.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. CTA Final ── */}
        <section
          className="v3-section"
          style={{ textAlign: 'center' }}
          aria-labelledby="cta-heading"
        >
          <div className="v3-container">
            <Reveal>
              <h2 id="cta-heading" className="v3-heading-section" style={{ marginBottom: 24 }}>
                Tu carrera universitaria, potenciada.
              </h2>
              <p
                className="v3-lead"
                style={{ maxWidth: 440, margin: '0 auto 36px', color: 'var(--ink-2)' }}
              >
                Empieza hoy sin costo. Conecta tu universidad, sube tus materiales y descubre lo que
                Conniku puede hacer por ti.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="v3-btn v3-btn-primary"
                  onClick={onRegister}
                  aria-label="Crear cuenta gratis en Conniku"
                  style={{ padding: '16px 32px', fontSize: 18 }}
                >
                  Crear cuenta gratis
                  <span className="v3-btn-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
                <button
                  type="button"
                  className="v3-btn v3-btn-ghost"
                  onClick={onLogin}
                  aria-label="Ver los planes de Conniku"
                  style={{ padding: '16px 32px', fontSize: 18 }}
                >
                  Ver planes
                </button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── 13. Footer editorial (tracklist) ── */}
      <footer
        style={{
          background: 'var(--ink)',
          color: '#fff',
          padding: '60px 0 32px',
        }}
        aria-label="Pie de página de Conniku"
      >
        <div className="v3-container">
          {/* Logo en blanco */}
          <div style={{ marginBottom: 40 }}>
            <BrandWordmark onDark size={24} />
          </div>

          {/* Tracklist */}
          <nav
            aria-label="Links del pie de página"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}
          >
            {[
              { num: '01', label: 'Producto', href: '#producto' },
              { num: '02', label: 'Universidad', href: '#universidad' },
              { num: '03', label: 'Precios', href: '#precios' },
              { num: '04', label: 'Blog', href: '#blog' },
              { num: '05', label: 'Soporte', href: '#soporte' },
              { num: '06', label: 'Trabaja con nosotros', href: '#careers' },
            ].map((item) => (
              <div
                key={item.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'opacity 180ms var(--ease)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '.1em',
                    minWidth: 20,
                  }}
                  aria-hidden="true"
                >
                  {item.num}
                </span>
                <a
                  href={item.href}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#fff',
                    textDecoration: 'none',
                    flex: 1,
                  }}
                >
                  {item.label}
                </a>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }} aria-hidden="true">
                  →
                </span>
              </div>
            ))}
          </nav>

          {/* Legal row */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '.06em',
              }}
            >
              © 2026 Conniku SpA · Santiago, Chile
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Términos', 'Privacidad', 'Cookies'].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    textDecoration: 'none',
                    letterSpacing: '.06em',
                    transition: 'color 180ms var(--ease)',
                  }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
