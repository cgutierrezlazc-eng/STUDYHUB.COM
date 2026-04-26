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
import { Link } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Contact.module.css';

type MotivoValue =
  | 'Soporte técnico'
  | 'Contacto general'
  | 'Privacidad'
  | 'Legal'
  | 'Seguridad y Ley Karin'
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
  /** X del corredor vertical (entre sidebar y composer) por donde baja el cable. */
  xCorridor: number;
};

export default function Contact() {
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
  const motivoLabelRef = useRef<HTMLSpanElement | null>(null);

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
      // Source SIEMPRE es el label "Motivo" (la M), no el trigger ni el
      // item del dropdown. Pedido explícito del usuario para que la línea
      // siempre arranque del mismo punto visual.
      const sourceEl = motivoLabelRef.current;
      if (!sourceEl || !sidebarEl) {
        setCable(null);
        return;
      }
      const a = sourceEl.getBoundingClientRect();
      const b = sidebarEl.getBoundingClientRect();
      const comp = composerRef.current?.getBoundingClientRect();
      // x1 = borde izquierdo del label "Motivo" (justo en la M).
      // y1 = centro vertical del label.
      // x2 = borde derecho del canal del sidebar (entrada por la derecha).
      // xCorridor = centro del gap entre sidebar y composer.
      const x1 = a.left;
      const y1 = a.top + a.height / 2;
      const x2 = b.right;
      const y2 = b.top + b.height / 2;
      const xCorridor = comp ? (b.right + comp.left) / 2 : (x1 + x2) / 2;
      setCable({ x1, y1, x2, y2, xCorridor });
    }
    computeCable();
    window.addEventListener('resize', computeCable);
    window.addEventListener('scroll', computeCable, true);
    return () => {
      window.removeEventListener('resize', computeCable);
      window.removeEventListener('scroll', computeCable, true);
    };
  }, [motivo]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!motivo) {
      alert('Selecciona un motivo de consulta');
      return;
    }
    setSending(true);
    try {
      // Mismo fallback que src/services/api.ts: backend de Render en prod.
      const baseUrl = import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
      const res = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, nombre, email, asunto, mensaje }),
      });
      if (!res.ok) {
        // Backend Pydantic devuelve detail como string (errores custom) o
        // array de objetos {loc, msg, type, ...} (errores de validación).
        // Hay que serializarlo a algo legible para el usuario.
        type ValidationItem = { loc?: (string | number)[]; msg?: string };
        const err = (await res.json().catch(() => ({}))) as {
          detail?: string | ValidationItem[];
        };
        let msg = 'Error al enviar';
        if (typeof err.detail === 'string') {
          msg = err.detail;
        } else if (Array.isArray(err.detail)) {
          msg = err.detail
            .map((item) => {
              const field = (item.loc || []).filter((p) => p !== 'body').join('.');
              return field ? `${field}: ${item.msg}` : item.msg;
            })
            .filter(Boolean)
            .join(' · ');
        }
        throw new Error(msg);
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

  /**
   * Click en un canal del sidebar → autoseleccionar el motivo correspondiente
   * en el dropdown (vía bidireccional). Evitamos abrir el cliente de email
   * (mailto:) para que el usuario complete el formulario, que es el flujo
   * preferido — los mailto se mantienen como fallback para JS off.
   */
  const handleChannelClick =
    (motivoValue: MotivoValue) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setMotivo(motivoValue);
      setOpen(false);
    };

  const motivoOption = motivo ? MOTIVOS.find((m) => m.value === motivo) : null;
  const activeSidebarKey = motivoOption?.sidebarKey ?? null;

  // Conector ortogonal ← ↓ ← (o ← ↑ ← si el canal está arriba):
  //   1. Sale por el lado IZQUIERDO del motivo, viaja horizontal hacia
  //      la izquierda hasta xCorridor.
  //   2. Baja (o sube) vertical en xCorridor (corredor entre sidebar y
  //      composer, dentro del gap del grid).
  //   3. Vuelve a viajar horizontal hacia la izquierda hasta el borde
  //      derecho del canal en el sidebar.
  // Las dos esquinas se suavizan con arcos circulares de radio r.
  const cablePath = cable
    ? (() => {
        const r = 12;
        const goingDown = cable.y2 > cable.y1;
        const { x1, y1, x2, y2, xCorridor } = cable;

        // Esquina 1: pasa de "horizontal hacia la izquierda" a "vertical".
        //  - going down: gira en sentido horario (sweep=1).
        //  - going up:   gira en sentido antihorario (sweep=0).
        const a1End = goingDown ? y1 + r : y1 - r;
        const sweep1 = goingDown ? 1 : 0;

        // Esquina 2: pasa de "vertical" a "horizontal hacia la izquierda".
        //  - going down: sweep=0 (antihorario).
        //  - going up:   sweep=1 (horario).
        const a2Start = goingDown ? y2 - r : y2 + r;
        const sweep2 = goingDown ? 0 : 1;

        return [
          `M ${x1} ${y1}`,
          `L ${xCorridor + r} ${y1}`,
          `A ${r} ${r} 0 0 ${sweep1} ${xCorridor} ${a1End}`,
          `L ${xCorridor} ${a2Start}`,
          `A ${r} ${r} 0 0 ${sweep2} ${xCorridor - r} ${y2}`,
          `L ${x2} ${y2}`,
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

          {/* Centro de ayuda · NO es un canal de email, es la página de
              autoatención (artículos, FAQ). Sale como card aparte para
              que el usuario distinga entre "leerme yo solo" vs "escribir a
              un humano". */}
          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Antes de escribirnos</h2>
            <p className={styles.dCardText}>
              Visita el <strong>Centro de ayuda</strong> con artículos, guías y respuestas
              frecuentes. Suele resolver tu duda al instante.
            </p>
            <Link to="/support" className={styles.helpLinkBtn}>
              Ir al Centro de ayuda →
            </Link>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Otros canales</h2>
            <div className={styles.channelsList}>
              <a
                href="mailto:soporte@conniku.com"
                onClick={handleChannelClick('Soporte técnico')}
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
                onClick={handleChannelClick('Contacto general')}
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
                onClick={handleChannelClick('Privacidad')}
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
                onClick={handleChannelClick('Legal')}
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
                onClick={handleChannelClick('Seguridad y Ley Karin')}
                ref={(el) => {
                  sidebarItemRefs.current['seguridad'] = el;
                }}
                className={`${styles.channelRow} ${activeSidebarKey === 'seguridad' ? styles.enchufado : ''}`}
              >
                <span className={styles.channelRowLabel}>Seguridad y Ley Karin</span>
                <span className={styles.channelRowAddr}>seguridad@conniku.com</span>
                <span className={styles.channelRowDesc}>Denuncias y reportes de seguridad</span>
              </a>
              <a
                href="mailto:prensa@conniku.com"
                onClick={handleChannelClick('Prensa y medios')}
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
              <span className={styles.pgLabel} ref={motivoLabelRef}>
                Motivo
              </span>
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
                      minLength={2}
                      maxLength={100}
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
                    minLength={3}
                    maxLength={150}
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
                    minLength={10}
                    maxLength={5000}
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

      {/* Conector orbital · trayectoria curva con dots viajando, coherente
          con los planetas en /start. Fixed sobre todo, sin pointer events.
          - Línea base: hairline 1px muy sutil (guía de la trayectoria).
          - 3 dots con animateMotion siguiendo el path; cada uno con su
            color de la paleta orbital y su propio glow. */}
      {cable && (
        <svg className={styles.cableSvg} aria-hidden="true">
          <defs>
            <filter id="orbitDotGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <filter id="orbitDotGlowSoft" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          {/* Trayectoria sutil · referencia visual de la órbita. */}
          <path
            id="orbitPath"
            d={cablePath}
            stroke="rgba(232, 232, 230, 0.18)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />

          {/* Dot 1 · verde Conniku · líder */}
          <g>
            <circle r="6" fill="#00c27a" opacity="0.35" filter="url(#orbitDotGlowSoft)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={cablePath} />
            </circle>
            <circle r="3" fill="#00c27a" filter="url(#orbitDotGlow)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={cablePath} />
            </circle>
          </g>

          {/* Dot 2 · cyan · escalonado a 1/3 del recorrido */}
          <g>
            <circle r="5" fill="#0096cc" opacity="0.3" filter="url(#orbitDotGlowSoft)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={cablePath} begin="-0.87s" />
            </circle>
            <circle r="2.5" fill="#67e8f9" filter="url(#orbitDotGlow)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={cablePath} begin="-0.87s" />
            </circle>
          </g>

          {/* Dot 3 · violeta · escalonado a 2/3 del recorrido */}
          <g>
            <circle r="5" fill="#6b4eff" opacity="0.3" filter="url(#orbitDotGlowSoft)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={cablePath} begin="-1.73s" />
            </circle>
            <circle r="2.5" fill="#c4b5fd" filter="url(#orbitDotGlow)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={cablePath} begin="-1.73s" />
            </circle>
          </g>

          {/* Anclas · pequeño dot fijo en cada extremo (origen + destino) */}
          <circle cx={cable.x1} cy={cable.y1} r="3" fill="#00c27a" filter="url(#orbitDotGlow)" />
          <circle cx={cable.x2} cy={cable.y2} r="3" fill="#00c27a" filter="url(#orbitDotGlow)" />
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
