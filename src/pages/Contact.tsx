/**
 * Contact.tsx
 *
 * Rediseño visual M01.4 · Contacto. Adopta el layout tipo perfil-social-v2
 * (facegram): grid de 2 columnas (sidebar 360px + columna principal con
 * composer/form), cards con estilo `.d-card`.
 *
 * Reglas observadas:
 * - El copy del formulario, motivos de consulta y canales directos
 *   proviene del Contact.tsx anterior · NO se modifica.
 * - Idioma: español neutro latinoamericano (sin voseo).
 * - Logo oficial: estructura inviolable de `<span class="brand on-dark">`
 *   con className global (CSS cargado globalmente desde main.tsx).
 * - El selector de motivo se maneja con `useState`.
 * - El submit del formulario hace `e.preventDefault()` + `alert(...)` ·
 *   NO se cablea API real en este bridge.
 *
 * Pendientes (futuras sesiones):
 * - Bridging del motor Hex Nebula (`src/lib/hex-nebula`) · por ahora se usa
 *   fondo plano `var(--bg)` definido localmente en el módulo CSS.
 * - Cablear backend del formulario (POST a `/api/contact` cuando exista).
 * - Páginas Cookies, Prensa y Trabaja con nosotros · `alert('Página pendiente')`.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Contact.module.css';

type Motivo =
  | 'Soporte técnico'
  | 'Comercial'
  | 'Universidades e instituciones'
  | 'Privacidad y datos'
  | 'Prensa y medios'
  | 'Otro';

type MotivoOption = {
  value: Motivo;
  label: string;
  desc: string;
};

const MOTIVOS: MotivoOption[] = [
  { value: 'Soporte técnico', label: 'Soporte técnico', desc: 'Bug, error, acceso a cuenta' },
  { value: 'Comercial', label: 'Comercial', desc: 'Planes, facturación, descuentos' },
  {
    value: 'Universidades e instituciones',
    label: 'Instituciones',
    desc: 'Alianzas con universidades',
  },
  {
    value: 'Privacidad y datos',
    label: 'Privacidad y datos',
    desc: 'Derechos ARCO+, GDPR, portabilidad',
  },
  { value: 'Prensa y medios', label: 'Prensa y medios', desc: 'Entrevistas, notas, cobertura' },
  { value: 'Otro', label: 'Otro', desc: 'Consulta general' },
];

export default function Contact() {
  const [motivo, setMotivo] = useState<Motivo | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Envío pendiente · backend por cablear');
  };

  const handlePendiente = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert('Página pendiente');
  };

  const asuntoPlaceholder = motivo
    ? `${motivo} — describe tu consulta`
    : 'Describe brevemente tu consulta';

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
                <span className={styles.infoKey}>Comercial</span>
                <span className={styles.infoVal}>48 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Instituciones</span>
                <span className={styles.infoVal}>48 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Privacidad y datos</span>
                <span className={styles.infoVal}>24 h hábiles</span>
              </li>
            </ul>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Otros canales</h2>
            <div className={styles.channelsList}>
              <a href="mailto:soporte@conniku.com" className={styles.channelRow}>
                <span className={styles.channelRowLabel}>Soporte técnico</span>
                <span className={styles.channelRowAddr}>soporte@conniku.com</span>
                <span className={styles.channelRowDesc}>Errores, acceso a cuenta, bugs</span>
              </a>
              <a href="mailto:contacto@conniku.com" className={styles.channelRow}>
                <span className={styles.channelRowLabel}>Contacto general</span>
                <span className={styles.channelRowAddr}>contacto@conniku.com</span>
                <span className={styles.channelRowDesc}>Consultas generales e institucionales</span>
              </a>
              <a href="mailto:privacidad@conniku.com" className={styles.channelRow}>
                <span className={styles.channelRowLabel}>Privacidad y ARCO+</span>
                <span className={styles.channelRowAddr}>privacidad@conniku.com</span>
                <span className={styles.channelRowDesc}>Ejercicio de derechos sobre tus datos</span>
              </a>
              <a href="mailto:legal@conniku.com" className={styles.channelRow}>
                <span className={styles.channelRowLabel}>Legal</span>
                <span className={styles.channelRowAddr}>legal@conniku.com</span>
                <span className={styles.channelRowDesc}>Consultas jurídicas y términos</span>
              </a>
              <a href="mailto:seguridad@conniku.com" className={styles.channelRow}>
                <span className={styles.channelRowLabel}>Seguridad y Ley Karin</span>
                <span className={styles.channelRowAddr}>seguridad@conniku.com</span>
                <span className={styles.channelRowDesc}>Denuncias y reportes de seguridad</span>
              </a>
              <Link to="/support" className={styles.channelRow}>
                <span className={styles.channelRowLabel}>Centro de soporte</span>
                <span className={styles.channelRowAddr}>/support →</span>
                <span className={styles.channelRowDesc}>Artículos de ayuda y guías</span>
              </Link>
              <a href="mailto:prensa@conniku.com" className={styles.channelRow}>
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
          <section className={`${styles.dCard} ${styles.composerCard}`}>
            <div className={styles.composer}>
              <div className={styles.composerAvatar} aria-hidden="true" />
              <div className={styles.composerPill}>Cuéntanos qué necesitas…</div>
            </div>

            <div className={styles.composerActs}>
              <span className={styles.pgLabel}>Motivo</span>
              <div className={styles.chipsWrap}>
                {MOTIVOS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`${styles.chip} ${motivo === m.value ? styles.chipOn : ''}`}
                    onClick={() => setMotivo(m.value)}
                    title={m.desc}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <input type="hidden" name="motivo" value={motivo ?? ''} />

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Correo electrónico</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Asunto</label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder={asuntoPlaceholder}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mensaje</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Cuéntanos con detalle. Entre más información nos des, mejor podremos ayudarte."
                  required
                />
              </div>

              <button type="submit" className={styles.btnSend}>
                Enviar mensaje →
              </button>
            </form>
          </section>
        </main>
      </div>

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
