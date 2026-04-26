/**
 * Careers.tsx — M01.5 · Trabaja con nosotros
 *
 * Layout: perfil-social-v2 (sidebar 360px + feed 620px).
 * Tema: navy-l (fondo #E8EEF8, acento --signature #0A2878).
 * Fuente HTML: ORBIT-U/pages/empleo-conniku.html
 *
 * Flujos:
 *   - "Perfil Laboral" → abre modal con form → POST /careers/profile
 *   - "Perfil Conniku completo" → navega a /start (registro en la plataforma)
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Careers.module.css';

type ModalTipo = 'laboral' | null;

const AREAS = [
  'Ingeniería y desarrollo',
  'Diseño de producto y UX',
  'Marketing y crecimiento',
  'Operaciones y gestión',
  'Educación y contenidos',
  'Datos y analítica',
  'Legal y cumplimiento',
  'Otro',
];

const VALORES = [
  {
    nombre: 'Estudiante primero',
    desc: 'Entendemos la vida universitaria porque la vivimos. Todo lo que hacemos parte desde ahí.',
  },
  {
    nombre: 'Hacedores',
    desc: 'Preferimos lanzar, iterar y mejorar. La parálisis por perfeccionismo no tiene lugar aquí.',
  },
  {
    nombre: 'Honestidad radical',
    desc: 'Decimos lo que pensamos con respeto. La retroalimentación directa acelera el crecimiento.',
  },
  {
    nombre: 'Latinoamérica',
    desc: 'Construimos para la realidad universitaria latinoamericana, no para un mercado abstracto.',
  },
  {
    nombre: 'Privacidad por diseño',
    desc: 'Nos tomamos en serio la protección de datos. No es compliance, es parte de quiénes somos.',
  },
  {
    nombre: 'Velocidad con criterio',
    desc: 'Nos movemos rápido, pero con intención. Calidad y velocidad no son opuestos.',
  },
];

const PASOS = [
  {
    n: '01',
    titulo: 'Deja tu perfil ahora',
    desc: 'Completa el formulario con tu información, área de interés y qué tipo de rol te gustaría tener.',
  },
  {
    n: '02',
    titulo: 'Te notificamos cuando surja algo',
    desc: 'Cuando tengamos una posición que encaje con tu perfil, serás de los primeros en saberlo. Sin spam.',
  },
  {
    n: '03',
    titulo: 'Conversación inicial (30 min)',
    desc: 'Una llamada sin presión para conocernos. Sin pruebas técnicas sorpresa ni preguntas de pizarrón.',
  },
  {
    n: '04',
    titulo: 'Proyecto pequeño y conversación técnica',
    desc: 'Un desafío acotado (máximo 3 horas) relevante para el rol, pagado si aplica.',
  },
  {
    n: '05',
    titulo: 'Oferta y bienvenida',
    desc: 'Si hay fit mutuo, hacemos una oferta transparente. Sin negociaciones opacas.',
  },
];

export default function Careers() {
  const navigate = useNavigate();
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [porQue, setPorQue] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function openModal() {
    setModalTipo('laboral');
    setSent(false);
  }

  function closeModal() {
    setModalTipo(null);
    setSent(false);
    setNombre('');
    setEmail('');
    setArea('');
    setPorQue('');
    setLinkedin('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
      const res = await fetch(`${baseUrl}/careers/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'laboral',
          nombre,
          email,
          area,
          por_que: porQue,
          linkedin: linkedin || undefined,
        }),
      });
      if (!res.ok) {
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

  return (
    <div className={styles.page}>
      <HexNebulaCanvas
        options={{ hexSize: 34, intensity: 0.18, bgColor: '#060f1e' }}
        className={styles.nebulaBg}
      />

      {/* Topbar */}
      <div className={styles.topbar}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className={styles.topbarSep} />
        <Link to="/" className={`brand ${styles.topbarBrand}`} aria-label="Conniku">
          conn<span>i</span>
          <span className="k-letter">k</span>
          <span className="u-pack">
            <span className="u-letter">u</span>
            <span className="dot"></span>
          </span>
        </Link>
        <div className={styles.topbarSep} />
        <span className={styles.topbarTitle}>TRABAJA CON NOSOTROS</span>
      </div>

      {/* Layout sidebar + feed */}
      <div className={styles.layout}>
        {/* ── SIDEBAR ── */}
        <aside className={styles.sidebar}>
          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Sobre el equipo</h2>
            <p className={styles.dCardText}>
              Conniku es una plataforma educativa colaborativa para estudiantes universitarios
              latinoamericanos. Somos un equipo pequeño construyendo algo grande desde Antofagasta,
              Chile.
            </p>
            <p className={styles.dCardText}>
              No tenemos posiciones formales abiertas por ahora, pero nos interesa conocer personas
              que compartan la misión. Si eres una de ellas, deja tu perfil.
            </p>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Posiciones abiertas</h2>
            <div className={styles.emptyBox}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Sin posiciones activas por ahora</span>
            </div>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Tiempos de respuesta</h2>
            <ul className={styles.infoList}>
              <li>
                <span className={styles.infoKey}>Revisión de perfil</span>
                <span className={styles.infoVal}>5 días hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Contacto si hay fit</span>
                <span className={styles.infoVal}>Cuando surja posición</span>
              </li>
              <li>
                <span className={styles.infoKey}>Email directo</span>
                <span className={styles.infoVal}>talento@conniku.com</span>
              </li>
            </ul>
          </section>

          <section className={styles.dCard}>
            <p className={styles.karinLabel}>Nota legal — Ley Karin</p>
            <p className={styles.karinText}>
              Conniku cumple íntegramente la <strong>Ley N° 21.643 (Ley Karin)</strong>, vigente
              desde el 1 de agosto de 2024. Todo proceso de selección se realiza con respeto,
              equidad y sin discriminación. Denuncias:{' '}
              <a href="mailto:seguridad@conniku.com" className={styles.karinLink}>
                seguridad@conniku.com
              </a>
            </p>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>¿Listo para postular?</h2>
            <p className={styles.dCardText}>
              Deja tu perfil laboral y te contactamos cuando surja la posición correcta para ti.
            </p>
            <button className={styles.btnCta} onClick={openModal}>
              Dejar mi perfil →
            </button>
          </section>
        </aside>

        {/* ── FEED ── */}
        <main className={styles.feed}>
          {/* Hero compacto */}
          <section className={styles.heroCard}>
            <div className={styles.planetVis} aria-hidden="true">
              <div className={`${styles.planetRing} ${styles.r1}`} />
              <div className={`${styles.planetRing} ${styles.r2}`} />
              <div className={styles.planetCore}>
                <img src="/icon-256.png" alt="" className={styles.heroIcon} />
              </div>
            </div>
            <div className={styles.heroEyebrow}>Conniku · Equipo</div>
            <h1 className={styles.heroTitle}>
              Construye el futuro
              <br />
              de la <span>educación</span>
            </h1>
            <p className={styles.heroSub}>
              No hay posiciones abiertas en este momento, pero si compartes la misión, queremos
              conocerte. Deja tu perfil y te contactamos cuando surja la oportunidad correcta.
            </p>
            <div className={styles.heroCtas}>
              <button className={styles.btnPrimary} onClick={openModal}>
                Solo módulo laboral
              </button>
              <Link to="/start" className={styles.btnSecondary}>
                Perfil Conniku completo
              </Link>
            </div>
          </section>

          {/* Perfiles */}
          <section className={styles.dCard}>
            <div className={styles.sectionLabel}>Elige cómo quieres vincularte</div>
            <div className={styles.profilesGrid}>
              <div
                className={styles.profileCard}
                onClick={openModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openModal()}
              >
                <div className={styles.profileName}>Perfil Laboral</div>
                <p className={styles.profilePitch}>
                  Para quienes quieren visibilidad ante el equipo de Conniku en el contexto laboral,
                  sin necesidad de usar la plataforma completa.
                </p>
                <ul className={styles.profileFeatures}>
                  <li>Acceso únicamente al módulo de Empleo</li>
                  <li>Tu perfil visible en postulaciones a Conniku</li>
                  <li>CV, áreas de interés y disponibilidad</li>
                  <li>Sin compromiso de uso de la plataforma</li>
                </ul>
                <span className={`${styles.profileTag} ${styles.tagLite}`}>
                  Lite · Solo módulo laboral
                </span>
              </div>

              <Link
                to="/start"
                className={`${styles.profileCard} ${styles.profileCardHighlighted}`}
              >
                <div className={styles.profileName}>
                  Perfil{' '}
                  <span className="brand" aria-label="Conniku">
                    conn<span>i</span>
                    <span className="k-letter">k</span>
                    <span className="u-pack">
                      <span className="u-letter">u</span>
                      <span className="dot"></span>
                    </span>
                  </span>
                </div>
                <p className={styles.profilePitch}>
                  Acceso completo a la plataforma. Vívela desde adentro: así conocemos tu forma de
                  trabajar y colaborar antes de cualquier entrevista.
                </p>
                <ul className={styles.profileFeatures}>
                  <li>Acceso completo a todos los módulos</li>
                  <li>Perfil visible ante el equipo de Conniku</li>
                  <li>Muestra tu trabajo real en la plataforma</li>
                  <li>Prioridad en notificación de nuevas posiciones</li>
                  <li>Comunidad de early adopters y colaboradores</li>
                </ul>
                <span className={`${styles.profileTag} ${styles.tagFull}`}>
                  Completo · Plataforma entera
                </span>
              </Link>
            </div>
          </section>

          {/* Valores */}
          <section className={styles.dCard}>
            <div className={styles.sectionLabel}>Lo que nos importa en el equipo</div>
            <div className={styles.valoresGrid}>
              {VALORES.map((v) => (
                <div key={v.nombre} className={styles.valorCard}>
                  <div className={styles.valorNombre}>{v.nombre}</div>
                  <div className={styles.valorDesc}>{v.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Proceso */}
          <section className={styles.dCard}>
            <div className={styles.sectionLabel}>
              Cómo funciona el proceso cuando haya posiciones
            </div>
            <div className={styles.proceso}>
              {PASOS.map((p, i) => (
                <div key={p.n} className={`${styles.pasoRow} ${i > 0 ? styles.pasoRowBorder : ''}`}>
                  <div className={styles.pasoNum}>{p.n}</div>
                  <div className={styles.pasoBody}>
                    <h4 className={styles.pasoTitulo}>{p.titulo}</h4>
                    <p className={styles.pasoDesc}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <span className={styles.footerCopy}>
          © 2026 Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
        </span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">Términos</Link>
          <Link to="/privacy">Privacidad</Link>
          <Link to="/support">Soporte</Link>
          <Link to="/contact">Contacto</Link>
          <span className={styles.active}>Trabaja con nosotros</span>
        </nav>
      </footer>

      {/* Modal perfil laboral */}
      {modalTipo && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeModal} aria-label="Cerrar">
              ✕
            </button>
            <div className={styles.modalType}>PERFIL LABORAL</div>
            <h2 className={styles.modalTitle}>Deja tu perfil</h2>
            <p className={styles.modalSub}>
              Te contactamos cuando surja la posición correcta para ti.
            </p>

            {sent ? (
              <div className={styles.sentBox}>
                <div className={styles.sentIcon}>✓</div>
                <h3 className={styles.sentTitle}>¡Perfil recibido!</h3>
                <p className={styles.sentText}>
                  Te contactaremos cuando surja algo que encaje contigo. ¡Gracias por el interés en
                  Conniku!
                </p>
                <button className={styles.btnModalSecondary} onClick={closeModal}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.modalForm}>
                <input type="hidden" name="tipo" value="laboral" />

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nombre completo</label>
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
                  <label className={styles.formLabel}>¿En qué área te ves aportando?</label>
                  <select
                    className={styles.formSelect}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un área
                    </option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>¿Por qué Conniku?</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Cuéntanos brevemente qué te atrae de construir Conniku."
                    value={porQue}
                    onChange={(e) => setPorQue(e.target.value)}
                    required
                    minLength={10}
                    maxLength={2000}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>LinkedIn u otro perfil (opcional)</label>
                  <input
                    className={styles.formInput}
                    type="url"
                    placeholder="linkedin.com/in/tu-perfil"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    maxLength={300}
                  />
                </div>

                <button type="submit" className={styles.btnSubmit} disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar mi perfil →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
