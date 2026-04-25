/**
 * Contact.tsx
 *
 * Rediseño visual M01.4 · Contacto. Layout perfil-social-v2 (facegram):
 * sidebar 360px + columna principal con composer/form, cards `.dCard`.
 *
 * Cambios M01.5:
 * - Reemplazado el bloque de "Motivo" + chips por un dropdown colgante.
 * - Animación SVG de "cable" que conecta el item del dropdown seleccionado
 *   con la card correspondiente del sidebar; la card se "enchufa" (clase
 *   `.enchufado`) con borde verde y glow.
 * - Submit cableado a POST /contact (rate-limited en backend).
 * - "Centro de soporte" no envía email: redirige a /support.
 *
 * Reglas observadas:
 * - El copy del formulario, motivos y canales proviene del Contact.tsx
 *   anterior · NO se modifica (solo se reordena la lista canónica de 7).
 * - Idioma: español neutro latinoamericano (sin voseo).
 * - Logo oficial: estructura inviolable de `<span class="brand on-dark">`.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Contact.module.css';

type MotivoValue =
  | 'Soporte técnico'
  | 'Contacto general'
  | 'Privacidad'
  | 'Legal'
  | 'Seguridad y Ley Karin'
  | 'Centro de soporte'
  | 'Prensa y medios';

type MotivoOption = {
  value: MotivoValue;
  label: string;
  desc: string;
  /** Clave del item del sidebar al que conecta el cable. */
  sidebarKey: string;
};

const MOTIVOS: MotivoOption[] = [
  {
    value: 'Soporte técnico',
    label: 'Soporte técnico',
    desc: 'Errores, acceso a cuenta, bugs',
    sidebarKey: 'soporte',
  },
  {
    value: 'Contacto general',
    label: 'Contacto general',
    desc: 'Consultas generales e institucionales',
    sidebarKey: 'contacto',
  },
  {
    value: 'Privacidad',
    label: 'Privacidad',
    desc: 'Ejercicio de derechos sobre tus datos',
    sidebarKey: 'privacidad',
  },
  {
    value: 'Legal',
    label: 'Legal',
    desc: 'Consultas jurídicas y términos',
    sidebarKey: 'legal',
  },
  {
    value: 'Seguridad y Ley Karin',
    label: 'Seguridad y Ley Karin',
    desc: 'Denuncias y reportes de seguridad',
    sidebarKey: 'seguridad',
  },
  {
    value: 'Centro de soporte',
    label: 'Centro de soporte',
    desc: 'Artículos de ayuda y guías',
    sidebarKey: 'support',
  },
  {
    value: 'Prensa y medios',
    label: 'Prensa y medios',
    desc: 'Entrevistas, notas y cobertura',
    sidebarKey: 'prensa',
  },
];

type CablePoints = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export default function Contact() {
  const navigate = useNavigate();

  const [motivo, setMotivo] = useState<MotivoValue | null>(null);
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cable, setCable] = useState<CablePoints | null>(null);

  // Refs por motivo para items del dropdown y del sidebar.
  const dropdownItemRefs = useRef<Record<string, HTMLElement | null>>({});
  const sidebarItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLElement | null>(null);

  // Click fuera → cierra el dropdown.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Cálculo del cable: posición del item seleccionado (dropdown o trigger
  // si está cerrado) + posición del item del sidebar correspondiente.
  useLayoutEffect(() => {
    function computeCable() {
      if (!motivo) {
        setCable(null);
        return;
      }
      const opt = MOTIVOS.find((m) => m.value === motivo);
      if (!opt) {
        setCable(null);
        return;
      }
      const sidebarEl = sidebarItemRefs.current[opt.sidebarKey];
      // Si el dropdown está abierto, anclar al item del menú.
      // Si está cerrado, anclar al trigger.
      const sourceEl = open
        ? (dropdownItemRefs.current[opt.value] ?? triggerRef.current)
        : triggerRef.current;
      if (!sourceEl || !sidebarEl) {
        setCable(null);
        return;
      }
      const a = sourceEl.getBoundingClientRect();
      const b = sidebarEl.getBoundingClientRect();
      const comp = composerRef.current?.getBoundingClientRect();
      // El cable sale por el borde IZQUIERDO del composer (vértice del cuadro)
      // a la altura del item seleccionado, y entra por el borde DERECHO del
      // sidebar card. Así el trazo nunca atraviesa los inputs del formulario.
      const x1 = comp ? comp.left : a.left;
      const y1 = a.top + a.height / 2;
      const x2 = b.right;
      const y2 = b.top + b.height / 2;
      setCable({ x1, y1, x2, y2 });
    }
    computeCable();
    window.addEventListener('resize', computeCable);
    window.addEventListener('scroll', computeCable, true);
    return () => {
      window.removeEventListener('resize', computeCable);
      window.removeEventListener('scroll', computeCable, true);
    };
  }, [motivo, open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!motivo) {
      alert('Selecciona un motivo de consulta');
      return;
    }
    if (motivo === 'Centro de soporte') {
      navigate('/support');
      return;
    }
    setSending(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, nombre, email, asunto, mensaje }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail || 'Error al enviar');
      }
      setSent(true);
    } catch (err) {
      alert(`No se pudo enviar: ${err instanceof Error ? err.message : 'error desconocido'}`);
    } finally {
      setSending(false);
    }
  }

  const handlePendiente = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert('Página pendiente');
  };

  const motivoOption = motivo ? MOTIVOS.find((m) => m.value === motivo) : null;
  const activeSidebarKey = motivoOption?.sidebarKey ?? null;
  const isCentroSoporte = motivo === 'Centro de soporte';

  // Path ortogonal del cable: sale del vértice IZQUIERDO del composer, viaja
  // por el corredor entre composer y sidebar (nunca encima de inputs), y
  // entra al borde derecho del sidebar card. Esquinas con arcos redondeados.
  // Importante: x1 (composer.left) > x2 (sidebar.right), así que avanzamos
  // hacia la izquierda restando.
  const cablePath = cable
    ? (() => {
        const xm = (cable.x1 + cable.x2) / 2; // corredor central
        const r = 12; // radio de las esquinas
        const goingDown = cable.y2 > cable.y1;
        // Tramo 1 horizontal (derecha → izquierda): x1 → xm + r
        // Esquina 1: arco a (xm, y1 ± r)
        // Tramo 2 vertical: → y2 ∓ r
        // Esquina 2: arco a (xm - r, y2)
        // Tramo 3 horizontal: → x2
        const sweep1 = goingDown ? 1 : 0;
        const sweep2 = goingDown ? 1 : 0;
        const corner1Y = goingDown ? cable.y1 + r : cable.y1 - r;
        const v2 = goingDown ? cable.y2 - r : cable.y2 + r;
        return [
          `M ${cable.x1} ${cable.y1}`,
          `L ${xm + r} ${cable.y1}`,
          `A ${r} ${r} 0 0 ${sweep1} ${xm} ${corner1Y}`,
          `L ${xm} ${v2}`,
          `A ${r} ${r} 0 0 ${sweep2 ? 0 : 1} ${xm - r} ${cable.y2}`,
          `L ${cable.x2} ${cable.y2}`,
        ].join(' ');
      })()
    : '';

  return (
    <div className={styles.page}>
      <HexNebulaCanvas
        options={{ hexSize: 34, intensity: 0.5, bgColor: '#0A0C12' }}
        className={styles.nebulaBg}
      />

      <div className={styles.topbar}>
        <Link to="/" className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
        <div className={styles.topbarSep} />
        <Link to="/" className={`brand on-dark ${styles.topbarBrand}`} aria-label="Conniku">
          conn<span>i</span>
          <span className="k-letter">k</span>
          <span className="u-pack">
            <span className="u-letter">u</span>
            <span className="dot"></span>
          </span>
        </Link>
        <div className={styles.topbarSep} />
        <span className={styles.topbarTitle}>CONTACTO</span>
      </div>

      <div className={styles.layout}>
        {/* SIDEBAR · 360px */}
        <aside className={styles.sidebar}>
          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Sobre Conniku</h2>
            <p className={styles.dCardText}>
              Conniku SpA es una plataforma digital colaborativa para educación, con domicilio en
              Antofagasta, Chile. Conectamos estudiantes, docentes e instituciones en un mismo
              espacio de trabajo.
            </p>
            <p className={styles.dCardText}>
              Si tienes una consulta, escríbenos desde el formulario o usa los canales directos.
            </p>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Tiempos de respuesta</h2>
            <ul className={styles.infoList}>
              <li>
                <span className={styles.infoKey}>Soporte técnico</span>
                <span className={styles.infoVal}>24 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Contacto general</span>
                <span className={styles.infoVal}>48 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Privacidad</span>
                <span className={styles.infoVal}>24 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Legal</span>
                <span className={styles.infoVal}>48 h hábiles</span>
              </li>
            </ul>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Otros canales</h2>
            <div className={styles.channelsList}>
              <a
                href="mailto:soporte@conniku.com"
                ref={(el) => {
                  sidebarItemRefs.current['soporte'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'soporte' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Soporte técnico</span>
                <span className={styles.channelRowAddr}>soporte@conniku.com</span>
                <span className={styles.channelRowDesc}>Errores, acceso a cuenta, bugs</span>
              </a>
              <a
                href="mailto:contacto@conniku.com"
                ref={(el) => {
                  sidebarItemRefs.current['contacto'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'contacto' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Contacto general</span>
                <span className={styles.channelRowAddr}>contacto@conniku.com</span>
                <span className={styles.channelRowDesc}>Consultas generales e institucionales</span>
              </a>
              <a
                href="mailto:privacidad@conniku.com"
                ref={(el) => {
                  sidebarItemRefs.current['privacidad'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'privacidad' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Privacidad y datos</span>
                <span className={styles.channelRowAddr}>privacidad@conniku.com</span>
                <span className={styles.channelRowDesc}>Ejercicio de derechos sobre tus datos</span>
              </a>
              <a
                href="mailto:legal@conniku.com"
                ref={(el) => {
                  sidebarItemRefs.current['legal'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'legal' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Legal</span>
                <span className={styles.channelRowAddr}>legal@conniku.com</span>
                <span className={styles.channelRowDesc}>Consultas jurídicas y términos</span>
              </a>
              <a
                href="mailto:seguridad@conniku.com"
                ref={(el) => {
                  sidebarItemRefs.current['seguridad'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'seguridad' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Seguridad y Ley Karin</span>
                <span className={styles.channelRowAddr}>seguridad@conniku.com</span>
                <span className={styles.channelRowDesc}>Denuncias y reportes de seguridad</span>
              </a>
              <Link
                to="/support"
                ref={(el) => {
                  // Link forwarda ref a su <a> renderizado.
                  sidebarItemRefs.current['support'] = el as unknown as HTMLAnchorElement | null;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'support' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Centro de soporte</span>
                <span className={styles.channelRowAddr}>/support →</span>
                <span className={styles.channelRowDesc}>Artículos de ayuda y guías</span>
              </Link>
              <a
                href="mailto:prensa@conniku.com"
                ref={(el) => {
                  sidebarItemRefs.current['prensa'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'prensa' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Prensa y medios</span>
                <span className={styles.channelRowAddr}>prensa@conniku.com</span>
                <span className={styles.channelRowDesc}>Entrevistas, notas y cobertura</span>
              </a>
            </div>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Información legal</h2>
            <p className={styles.legalText}>
              Conniku SpA · RUT: 78.395.702-7
              <br />
              Domicilio: Antofagasta, Chile
            </p>
            <p className={styles.legalTextSmall}>
              Objeto social: Desarrollo, operación y comercialización de plataformas digitales
              colaborativas para educación.
            </p>
          </section>
        </aside>

        {/* COLUMNA DERECHA · feed */}
        <main className={styles.feed}>
          <section className={styles.pageHead}>
            <div className={styles.pageBadge}>FORMULARIO DE CONTACTO</div>
            <h1 className={styles.pageTitle}>Escríbenos</h1>
            <p className={styles.pageSub}>
              Elige el motivo de tu consulta y te dirigimos al equipo correcto. Respondemos dentro
              de 24–48 horas hábiles.
            </p>
          </section>

          {/* Composer card · estilo facegram */}
          <section className={`${styles.dCard} ${styles.composerCard}`} ref={composerRef}>
            <div className={styles.composer}>
              <div className={styles.composerAvatar} aria-hidden="true" />
              <h2 className={styles.composerPill}>Cuéntanos qué necesitas</h2>
            </div>

            <div className={styles.composerActs}>
              <span className={styles.pgLabel}>Motivo</span>
              <div className={styles.dropdownWrap} ref={wrapRef}>
                <button
                  type="button"
                  ref={triggerRef}
                  onClick={() => setOpen((v) => !v)}
                  className={`${styles.dropdownTrigger} ${motivo ? styles.dropdownTriggerOn : ''}`}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                >
                  {motivo ? motivo : 'Selecciona un motivo'}
                  <span className={styles.dropdownCaret} aria-hidden="true">
                    ▾
                  </span>
                </button>
                {open && (
                  <ul className={styles.dropdownMenu} role="listbox">
                    {MOTIVOS.map((m) => (
                      <li
                        key={m.value}
                        role="option"
                        aria-selected={motivo === m.value}
                        ref={(el) => {
                          dropdownItemRefs.current[m.value] = el;
                        }}
                        onClick={() => {
                          setMotivo(m.value);
                          setSent(false);
                          setOpen(false);
                        }}
                        className={`${styles.dropdownItem} ${motivo === m.value ? styles.dropdownItemOn : ''}`}
                        title={m.desc}
                      >
                        <span className={styles.dropdownItemLabel}>{m.label}</span>
                        <span className={styles.dropdownItemDesc}>{m.desc}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Cuerpo del composer: form, link a /support, o confirmación. */}
            {sent ? (
              <div className={styles.sentBox}>
                <h3 className={styles.sentTitle}>¡Mensaje enviado!</h3>
                <p className={styles.sentText}>
                  Te respondemos en 24–48 h hábiles al correo que indicaste.
                </p>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setSent(false);
                    setMotivo(null);
                    setNombre('');
                    setEmail('');
                    setAsunto('');
                    setMensaje('');
                  }}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : isCentroSoporte ? (
              <div className={styles.supportRedirect}>
                <p className={styles.supportRedirectText}>
                  El Centro de soporte tiene artículos, guías y respuestas frecuentes para resolver
                  tu duda al instante.
                </p>
                <Link to="/support" className={styles.btnSend}>
                  Visitar Centro de soporte →
                </Link>
              </div>
            ) : (
              <form className={styles.contactForm} onSubmit={handleSubmit}>
                <input type="hidden" name="motivo" value={motivo ?? ''} />

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nombre</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Tu nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Correo electrónico</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Asunto</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder={
                      motivo
                        ? `${motivo} — describe tu consulta`
                        : 'Describe brevemente tu consulta'
                    }
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mensaje</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Cuéntanos con detalle. Entre más información nos des, mejor podremos ayudarte."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className={styles.btnSend} disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar mensaje →'}
                </button>
              </form>
            )}
          </section>
        </main>
      </div>

      {/* SVG del cable · fixed sobre todo, sin capturar pointer events. */}
      {cable && (
        <svg className={styles.cableSvg} aria-hidden="true">
          <defs>
            {/* Gradiente con la paleta de los planetas/órbitas de /start */}
            <linearGradient id="cableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e91e8c" stopOpacity="0.95" />
              <stop offset="18%" stopColor="#14b8a6" stopOpacity="0.95" />
              <stop offset="36%" stopColor="#00c27a" stopOpacity="0.95" />
              <stop offset="54%" stopColor="#ffe9b8" stopOpacity="0.95" />
              <stop offset="72%" stopColor="#0096cc" stopOpacity="0.95" />
              <stop offset="88%" stopColor="#6b4eff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ff4a1c" stopOpacity="0.95" />
            </linearGradient>
            <filter id="cableGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>
          {/* Halo difuso · usa el mismo gradiente para tintar el glow. */}
          <path
            d={cablePath}
            stroke="url(#cableGradient)"
            strokeOpacity="0.4"
            strokeWidth="7"
            fill="none"
            filter="url(#cableGlow)"
          />
          {/* Cable principal · línea sólida con la paleta orbital. */}
          <path
            d={cablePath}
            stroke="url(#cableGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Luz viajando por dentro · dash corto + offset animado. */}
          <path
            d={cablePath}
            stroke="#ffffff"
            strokeOpacity="0.95"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="28 320"
            className={styles.cableLight}
            filter="url(#cableGlow)"
          />
        </svg>
      )}

      {/* Footer · TODO: cuando se bridgeen cookies/prensa/empleo */}
      <footer className={styles.pageFooter}>
        <span className={styles.footerCopy}>© 2026 Conniku SpA · Antofagasta, Chile</span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">Términos</Link>
          <Link to="/privacy">Privacidad</Link>
          <a href="#" onClick={handlePendiente}>
            Cookies
          </a>
          <Link to="/support">Soporte</Link>
          <span className={styles.active}>Contacto</span>
          <a href="#" onClick={handlePendiente}>
            Prensa
          </a>
          <a href="#" onClick={handlePendiente}>
            Trabaja con nosotros
          </a>
        </nav>
      </footer>
    </div>
  );
}
