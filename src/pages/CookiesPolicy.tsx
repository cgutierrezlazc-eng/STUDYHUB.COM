import React from 'react';
import cpStyles from './CookiesPolicy.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '40px 24px 80px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: 'var(--text-primary)',
    lineHeight: 1.7,
  } as React.CSSProperties,
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 32,
  } as React.CSSProperties,
  h1: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 8,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  date: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginBottom: 32,
  } as React.CSSProperties,
  h2: {
    fontSize: 22,
    fontWeight: 600,
    marginTop: 36,
    marginBottom: 12,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  h3: {
    fontSize: 17,
    fontWeight: 600,
    marginTop: 20,
    marginBottom: 8,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  p: {
    fontSize: 15,
    marginBottom: 12,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  ul: {
    paddingLeft: 24,
    marginBottom: 12,
    color: 'var(--text-secondary)',
    fontSize: 15,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: 16,
    fontSize: 14,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '2px solid var(--border)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: 14,
  } as React.CSSProperties,
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: 14,
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  infoBox: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 20,
    fontSize: 14,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
};

export default function CookiesPolicy({ onNavigate }: Props) {
  return (
    <>
      <div className={cpStyles.topProgress}>
        <div className={cpStyles.tpLeft}>
          <span className={cpStyles.pulse} aria-hidden="true" />
          <span>Política de Cookies</span>
        </div>
        <span>Ley 19.628 · GDPR · ePrivacy</span>
      </div>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => onNavigate('/')}>
          ← Volver
        </button>

        <h1 style={styles.h1}>Política de Cookies</h1>
        <p style={styles.date}>Última actualización: 20 de abril de 2026 · Versión 1.0</p>

        <p style={styles.p}>
          Esta Política de Cookies describe de forma clara y veraz las tecnologías de almacenamiento
          en el dispositivo del Usuario que Conniku SpA (&quot;Conniku&quot;) utiliza en su
          plataforma web y en sus aplicaciones móviles. Es un documento complementario a la{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/privacy');
            }}
            style={{ color: 'var(--accent)' }}
          >
            Política de Privacidad
          </a>{' '}
          y a los{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/terms');
            }}
            style={{ color: 'var(--accent)' }}
          >
            Términos y Condiciones
          </a>
          .
        </p>

        <div style={styles.infoBox}>
          <strong>Normativa aplicable según jurisdicción:</strong>
          <ul style={{ ...styles.ul, marginBottom: 0, marginTop: 8 }}>
            <li>
              <strong>Chile:</strong> Ley N° 19.628 sobre Protección de la Vida Privada (Art. 4° —
              información al titular).
            </li>
            <li>
              <strong>Unión Europea / EEE:</strong> Reglamento General de Protección de Datos (RGPD,
              Reglamento UE 2016/679, Art. 6(1)(a) y Art. 7 — consentimiento) y Directiva ePrivacy
              (2002/58/CE, Art. 5(3) — almacenamiento en el equipo terminal).
            </li>
            <li>
              <strong>España:</strong> Ley 34/2002 de Servicios de la Sociedad de la Información
              (LSSICE, Art. 22.2), en conjunto con la Guía de la AEPD.
            </li>
          </ul>
        </div>

        <h2 style={styles.h2}>1. Qué es una cookie y qué es almacenamiento local</h2>
        <p style={styles.p}>
          Una &quot;cookie&quot; es un pequeño archivo de texto que un sitio web guarda en el
          navegador del Usuario. Junto con las cookies tradicionales, los sitios modernos utilizan
          otras tecnologías equivalentes para conseguir el mismo objetivo: recordar información
          entre visitas. Dichas tecnologías incluyen <code>localStorage</code>,{' '}
          <code>sessionStorage</code>, &quot;IndexedDB&quot; y la caché del Service Worker de las
          Progressive Web Apps. Esta política cubre todas estas tecnologías de manera uniforme,
          entendiéndolas como &quot;cookies&quot; en sentido amplio conforme al Art. 5(3) de la
          Directiva ePrivacy.
        </p>

        <h2 style={styles.h2}>2. Cómo Conniku utiliza estas tecnologías (inventario)</h2>
        <p style={styles.p}>
          A continuación se presenta el inventario real de las claves de almacenamiento que Conniku
          instala en el dispositivo del Usuario. Todas son de primera parte (<em>first-party</em>):
          son instaladas por el propio dominio <strong>conniku.com</strong> y sus subdominios
          autorizados, y su contenido no se comparte con anunciantes ni redes publicitarias.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Clave / nombre</th>
              <th style={styles.th}>Categoría</th>
              <th style={styles.th}>Finalidad</th>
              <th style={styles.th}>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>
                <code>conniku_token</code>, <code>conniku_refresh_token</code>
              </td>
              <td style={styles.td}>Estrictamente necesaria</td>
              <td style={styles.td}>
                Mantiene la sesión autenticada del Usuario tras el inicio de sesión. Sin ellas el
                servicio no puede prestarse.
              </td>
              <td style={styles.td}>
                Hasta cierre de sesión o expiración del token (máx. 30 días)
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <code>conniku_language</code>, <code>conniku_theme</code>
              </td>
              <td style={styles.td}>Funcional</td>
              <td style={styles.td}>
                Recuerda las preferencias de idioma (es, en) y tema visual (claro, oscuro) del
                Usuario entre visitas.
              </td>
              <td style={styles.td}>Persistente hasta que el Usuario la cambie</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <code>conniku_welcomed</code>, <code>conniku_apps_banner_v3</code>,{' '}
                <code>pwa-install-dismissed</code>, <code>ob_visited</code>
              </td>
              <td style={styles.td}>Funcional</td>
              <td style={styles.td}>
                Evita mostrar nuevamente el tour de bienvenida, el banner de apps móviles o la
                invitación a instalar la PWA una vez que el Usuario ya los ha visto o descartado.
              </td>
              <td style={styles.td}>Persistente</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <code>conniku_feed_sort</code>, <code>conniku_course_progress_*</code>,{' '}
                <code>conniku_course_quiz_*</code>, <code>conniku_quiz_history</code>,{' '}
                <code>conniku_enrollment_id</code>, <code>conniku_ceo_signature</code>
              </td>
              <td style={styles.td}>Funcional</td>
              <td style={styles.td}>
                Guarda el progreso académico local (orden del feed, lecciones completadas, historial
                de cuestionarios), datos de inscripción y firmas del módulo CEO en el propio
                dispositivo para funcionamiento offline básico y rendimiento.
              </td>
              <td style={styles.td}>Persistente hasta borrado manual</td>
            </tr>
            <tr>
              <td style={styles.td}>Caché del Service Worker (PWA)</td>
              <td style={styles.td}>Estrictamente necesaria</td>
              <td style={styles.td}>
                Permite el funcionamiento offline y acelera la carga de la interfaz almacenando
                recursos estáticos (HTML, CSS, JS, imágenes) autorizados.
              </td>
              <td style={styles.td}>Hasta la próxima actualización de la plataforma</td>
            </tr>
          </tbody>
        </table>

        <p style={styles.p}>
          <strong>Conniku no utiliza cookies de terceros con fines publicitarios.</strong> Conniku
          no integra scripts de redes publicitarias, pixels de seguimiento, brokers de datos ni
          plataformas de retargeting. Cualquier cambio futuro a este punto requerirá una
          actualización pública de esta política y, cuando corresponda, el consentimiento previo del
          Usuario.
        </p>

        <h2 style={styles.h2}>3. Base legal</h2>
        <p style={styles.p}>
          Las cookies y tecnologías declaradas como &quot;estrictamente necesarias&quot; se instalan
          sobre la base de la ejecución del contrato de prestación de servicios entre el Usuario y
          Conniku (Art. 6(1)(b) RGPD). Sin ellas el servicio contratado no puede entregarse: no hay
          sesión, no hay contenido accesible y no hay soporte offline.
        </p>
        <p style={styles.p}>
          Las cookies declaradas como &quot;funcionales&quot; se instalan sobre la base del interés
          legítimo del Usuario en que su experiencia sea consistente (idioma, tema, progreso
          académico local). Estas preferencias son controlables por el Usuario en cualquier momento
          mediante la configuración de su cuenta, la configuración del navegador o la desinstalación
          de la aplicación.
        </p>
        <p style={styles.p}>
          Si en el futuro Conniku incorporase cookies de análisis o medición de terceros (por
          ejemplo, herramientas de analytics), estas se considerarán &quot;no esenciales&quot; y se
          implementará un mecanismo de consentimiento previo conforme al Art. 7 del RGPD, al Art.
          5(3) de la Directiva ePrivacy y al Art. 22.2 de la LSSICE.
        </p>

        <h2 style={styles.h2}>4. Cómo gestionar o desactivar las cookies</h2>
        <p style={styles.p}>
          El Usuario puede gestionar o eliminar cookies y almacenamiento local directamente desde su
          navegador o sistema operativo:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Chrome:</strong>{' '}
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              support.google.com/chrome/answer/95647
            </a>
          </li>
          <li>
            <strong>Firefox:</strong>{' '}
            <a
              href="https://support.mozilla.org/es/kb/Borrar%20cookies"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              support.mozilla.org
            </a>
          </li>
          <li>
            <strong>Safari:</strong>{' '}
            <a
              href="https://support.apple.com/es-cl/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              support.apple.com
            </a>
          </li>
          <li>
            <strong>Edge:</strong>{' '}
            <a
              href="https://support.microsoft.com/es-es/microsoft-edge"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              support.microsoft.com
            </a>
          </li>
        </ul>
        <p style={styles.p}>
          En las aplicaciones móviles basadas en Capacitor, el Usuario puede limpiar los datos
          locales desde los ajustes del sistema operativo (Ajustes → Aplicaciones → Conniku →
          Almacenamiento → Borrar datos) o desinstalando la aplicación.
        </p>
        <p style={styles.p}>
          <strong>Advertencia:</strong> si el Usuario desactiva las cookies estrictamente necesarias
          (por ejemplo, las de autenticación), la plataforma dejará de funcionar: no podrá iniciar
          sesión ni acceder a contenido que requiera identificación.
        </p>

        <h2 style={styles.h2}>5. Derechos del Usuario</h2>
        <p style={styles.p}>
          Conforme a la Ley N° 19.628 y al RGPD, el Usuario tiene derecho a solicitar acceso,
          rectificación, cancelación u oposición sobre los datos personales asociados a las cookies
          o al almacenamiento local de Conniku. En el caso de las cookies que se apoyen en
          consentimiento, el Usuario podrá revocarlo en cualquier momento con el mismo procedimiento
          con que lo otorgó, sin que esa revocación afecte la licitud del tratamiento anterior.
        </p>
        <p style={styles.p}>
          Para ejercer estos derechos, escriba a{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: 'var(--accent)' }}>
            privacidad@conniku.com
          </a>
          .
        </p>

        <h2 style={styles.h2}>6. Actualizaciones de esta política</h2>
        <p style={styles.p}>
          Conniku podrá actualizar esta Política de Cookies cuando cambien las tecnologías
          utilizadas, se incorporen nuevos proveedores o evolucione el marco regulatorio. Cada
          actualización será publicada en este mismo documento, con nueva fecha y número de versión,
          y —cuando el cambio sea material— se notificará al Usuario mediante el mecanismo de
          re-aceptación descrito en la Política de Privacidad.
        </p>

        <p style={{ ...styles.p, marginTop: 32, fontSize: 13, color: 'var(--text-tertiary)' }}>
          Documento informativo, no constituye asesoría legal. Normativa aplicada: Ley 19.628 Chile
          Art. 4°; Reglamento UE 2016/679 (RGPD) Art. 6(1)(a), Art. 6(1)(b), Art. 7; Directiva
          2002/58/CE (ePrivacy) Art. 5(3); Ley 34/2002 (LSSICE) Art. 22.2 España. Versión 1.0 —
          Abril 2026.
        </p>
      </div>
    </>
  );
}
