/**
 * Contact.tsx
 *
 * Traducción de ORBIT-U/pages/contacto.html (255 líneas) a un componente
 * React funcional. Bridging del módulo M01.4 · Contacto.
 *
 * Reglas observadas:
 * - El contenido (textos, motivos de consulta, canales directos) es el del
 *   fuente original · NO modificar.
 * - Idioma: español neutro latinoamericano (sin voseo).
 * - Logo oficial: estructura inviolable de `<span class="brand on-dark">`
 *   con className global (CSS cargado globalmente desde main.tsx).
 * - El selector de motivo se maneja con `useState` (sin querySelector ni
 *   listeners DOM imperativos).
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
      {/* TODO: cuando se bridgee el motor Nebula → src/lib/hex-nebula */}

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

      <div className={styles.pageWrap}>
        <div className={styles.pageBadge}>FORMULARIO DE CONTACTO</div>
        <h1 className={styles.pageTitle}>Escríbenos</h1>
        <p className={styles.pageSub}>
          Elige el motivo de tu consulta y te dirigimos al equipo correcto. Respondemos dentro de
          24–48 horas hábiles.
        </p>

        <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>
          ¿Cuál es el motivo de tu consulta?
        </div>
        <div className={styles.motivoGrid}>
          {MOTIVOS.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`${styles.motivoBtn} ${motivo === m.value ? styles.active : ''}`}
              onClick={() => setMotivo(m.value)}
            >
              <span className={styles.motivoLabel}>{m.label}</span>
              <span className={styles.motivoDesc}>{m.desc}</span>
            </button>
          ))}
        </div>

        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <input type="hidden" name="motivo" value={motivo ?? ''} />

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre</label>
              <input className={styles.formInput} type="text" placeholder="Tu nombre" required />
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

        {/* Canales directos */}
        <div style={{ marginTop: 56 }}>
          <div className={styles.sectionLabel}>Canales directos</div>
          <div className={styles.channels}>
            <a href="mailto:soporte@conniku.com" className={styles.channelCard}>
              <span className={styles.channelLabel}>Soporte técnico</span>
              <span className={styles.channelAddr}>soporte@conniku.com</span>
              <span className={styles.channelDesc}>Errores, acceso a cuenta, bugs</span>
            </a>
            <a href="mailto:contacto@conniku.com" className={styles.channelCard}>
              <span className={styles.channelLabel}>Contacto general</span>
              <span className={styles.channelAddr}>contacto@conniku.com</span>
              <span className={styles.channelDesc}>Consultas generales e institucionales</span>
            </a>
            <a href="mailto:privacidad@conniku.com" className={styles.channelCard}>
              <span className={styles.channelLabel}>Privacidad y ARCO+</span>
              <span className={styles.channelAddr}>privacidad@conniku.com</span>
              <span className={styles.channelDesc}>Ejercicio de derechos sobre tus datos</span>
            </a>
            <a href="mailto:legal@conniku.com" className={styles.channelCard}>
              <span className={styles.channelLabel}>Legal</span>
              <span className={styles.channelAddr}>legal@conniku.com</span>
              <span className={styles.channelDesc}>Consultas jurídicas y términos</span>
            </a>
            <a href="mailto:seguridad@conniku.com" className={styles.channelCard}>
              <span className={styles.channelLabel}>Seguridad y Ley Karin</span>
              <span className={styles.channelAddr}>seguridad@conniku.com</span>
              <span className={styles.channelDesc}>Denuncias y reportes de seguridad</span>
            </a>
            {/* TODO: cuando se bridgee prensa.html → ruta /prensa */}
            <a href="#" className={styles.channelCard} onClick={handlePendiente}>
              <span className={styles.channelLabel}>Prensa y medios</span>
              <span className={styles.channelAddr}>Kit de prensa →</span>
              <span className={styles.channelDesc}>Recursos para cobertura periodística</span>
            </a>
          </div>
        </div>

        {/* Info legal */}
        <div className={styles.legalInfo}>
          <strong className={styles.legalInfoTitle}>Información de contacto legal</strong>
          Conniku SpA · RUT: 78.395.702-7 · Domicilio: Antofagasta, Chile
          <br />
          Objeto social: Desarrollo, operación y comercialización de plataformas digitales
          colaborativas para educación
        </div>
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
