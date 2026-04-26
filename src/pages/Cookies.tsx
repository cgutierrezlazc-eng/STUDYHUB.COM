import { Link, useNavigate } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Cookies.module.css';
import { useI18n } from '../services/i18n';

export default function Cookies() {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className={styles.page}>
      <HexNebulaCanvas
        options={{ bgColor: '#050608', intensity: 0.35 }}
        className={styles.nebulaBg}
      />

      <div className={styles.topbar}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('chrome.back') || 'Volver'}
        </button>
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
        <span className={styles.topbarTitle}>POLÍTICA DE COOKIES</span>
      </div>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.dCard}>
            <div className={styles.docBadge}>DOCUMENTO LEGAL VIGENTE</div>
            <div className={styles.docMeta}>
              <span>
                <strong>Versión</strong> 1.0.0
              </span>
              <span>
                <strong>Vigencia</strong> 21 de abril de 2026
              </span>
              <span>
                <strong>Empresa</strong> Conniku SpA · RUT 78.395.702-7
              </span>
            </div>
          </div>

          <div className={styles.dCard}>
            <div className={styles.cardLabel}>Contenido</div>
            <ul className={styles.tocList}>
              <li>
                <a href="#c1">1 · ¿Qué son las cookies?</a>
              </li>
              <li>
                <a href="#c2">2 · Categorías que usamos</a>
              </li>
              <li>
                <a href="#c3">3 · Cookie cc_visitor_uuid</a>
              </li>
              <li>
                <a href="#c4">4 · Funcionales post-login</a>
              </li>
              <li>
                <a href="#c5">5 · Retención de registros</a>
              </li>
              <li>
                <a href="#c6">6 · Pseudonimización</a>
              </li>
              <li>
                <a href="#c7">7 · Tus derechos</a>
              </li>
              <li>
                <a href="#c8">8 · Cómo gestionar cookies</a>
              </li>
              <li>
                <a href="#c9">9 · Marco legal</a>
              </li>
              <li>
                <a href="#c10">10 · Vigencia y cambios</a>
              </li>
              <li>
                <a href="#c11">11 · Contacto</a>
              </li>
            </ul>
          </div>

          <div className={styles.dCard}>
            <div className={styles.cardLabel}>¿Dudas legales?</div>
            <p className={styles.cardText}>
              Escríbenos a <a href="mailto:legal@conniku.com">legal@conniku.com</a> o{' '}
              <a href="mailto:dpo@conniku.com">dpo@conniku.com</a>.
            </p>
          </div>
        </aside>

        {/* ── Feed / Document body ── */}
        <main className={styles.feed}>
          <div className={styles.dCard}>
            <h1 className={styles.docTitle}>Política de Cookies</h1>

            <div className={`${styles.infoBox} ${styles.green}`}>
              <strong>Resumen.</strong> Conniku no usa cookies de analítica ni de publicidad. Solo
              usamos cookies estrictamente necesarias para que el servicio funcione y cookies
              funcionales para recordar tus preferencias una vez que has iniciado sesión. No hay
              rastreo publicitario, ni pixels de terceros, ni retargeting.
            </div>

            {/* §1 */}
            <h2 id="c1">§1 — ¿Qué son las cookies y tecnologías similares?</h2>
            <p>
              Una "cookie" es un pequeño archivo de texto que un sitio web guarda en el navegador
              del Usuario cuando lo visita. Junto con las cookies tradicionales, los sitios modernos
              utilizan otras tecnologías equivalentes:
            </p>
            <ul>
              <li>
                <code>localStorage</code> — almacenamiento local persistente del navegador.
              </li>
              <li>
                <code>sessionStorage</code> — almacenamiento temporal que se borra al cerrar la
                pestaña.
              </li>
              <li>
                <code>IndexedDB</code> — base de datos estructurada en el navegador.
              </li>
              <li>
                Caché del Service Worker — usada en Progressive Web Apps para soporte offline.
              </li>
            </ul>
            <p>
              Esta Política cubre todas estas tecnologías de manera uniforme, conforme al Art. 5(3)
              de la Directiva ePrivacy (2002/58/CE) y las directrices del EDPB (Guidelines 05/2020).
            </p>

            {/* §2 */}
            <h2 id="c2">§2 — Categorías de cookies que utilizamos</h2>

            <h3>
              2.1 Necesarias (esenciales){' '}
              <span className={`${styles.catChip} ${styles.catNec}`}>NECESARIAS</span>
            </h3>
            <p>
              Sin estas cookies el servicio no puede prestarse. No requieren consentimiento previo
              (Art. 5(3) in fine Directiva ePrivacy).
            </p>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Clave / nombre</th>
                    <th>Finalidad</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>conniku_token</code>
                      <br />
                      <code>conniku_refresh_token</code>
                    </td>
                    <td>
                      Mantiene la sesión autenticada del Usuario. Sin ellas el servicio no puede
                      prestarse.
                    </td>
                    <td>Hasta cierre de sesión o expiración del token (máx. 30 días)</td>
                  </tr>
                  <tr>
                    <td>Caché del Service Worker (PWA)</td>
                    <td>
                      Permite funcionamiento offline y acelera la carga almacenando recursos
                      estáticos.
                    </td>
                    <td>Hasta la próxima actualización de la plataforma</td>
                  </tr>
                  <tr>
                    <td>
                      <code>cc_visitor_uuid</code>
                    </td>
                    <td>
                      Identificador pseudónimo para el registro de consentimiento de cookies (ver
                      §3).
                    </td>
                    <td>Máximo 13 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>
              2.2 Funcionales{' '}
              <span className={`${styles.catChip} ${styles.catFun}`}>FUNCIONALES</span>
            </h3>
            <p>
              Mejoran la experiencia del Usuario. Se almacenan en el navegador (localStorage o
              cookies de sesión) bajo base legal de ejecución del contrato (Art. 6(1)(b) GDPR) una
              vez que el Usuario ha iniciado sesión (ver §4).
            </p>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Clave / nombre</th>
                    <th>Finalidad</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>conniku_language</code>
                    </td>
                    <td>Recuerda la preferencia de idioma del Usuario (es, en, pt, it, fr, de).</td>
                    <td>Persistente hasta cambio manual</td>
                  </tr>
                  <tr>
                    <td>
                      <code>conniku_welcomed</code>
                      <br />
                      <code>conniku_apps_banner_v3</code>
                      <br />
                      <code>pwa-install-dismissed</code>
                      <br />
                      <code>ob_visited</code>
                    </td>
                    <td>
                      Evita mostrar el tour de bienvenida, banner de apps o invitación PWA más de
                      una vez.
                    </td>
                    <td>Persistente</td>
                  </tr>
                  <tr>
                    <td>
                      <code>conniku_feed_sort</code>
                      <br />
                      <code>conniku_course_progress_*</code>
                      <br />
                      <code>conniku_course_quiz_*</code>
                      <br />
                      <code>conniku_quiz_history</code>
                      <br />
                      <code>conniku_enrollment_id</code>
                      <br />
                      <code>conniku_ceo_signature</code>
                    </td>
                    <td>
                      Guarda el progreso académico local: orden del feed, lecciones completadas,
                      historial de cuestionarios, datos de inscripción y firmas del módulo CEO.
                    </td>
                    <td>Persistente hasta borrado manual</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>
              2.3 Analíticas{' '}
              <span className={`${styles.catChip} ${styles.catAna}`}>ANALÍTICAS</span>
            </h3>
            <div className={`${styles.infoBox} ${styles.none}`}>
              <strong>Estado actual: ninguna.</strong> Conniku no utiliza actualmente cookies ni
              scripts de analítica de terceros (Google Analytics, Mixpanel, Amplitude, Hotjar u
              otros). Si en el futuro se incorporasen, se implementará un mecanismo de
              consentimiento previo granular y esta Política se actualizará con notificación al
              Usuario.
            </div>

            <h3>
              2.4 Marketing <span className={`${styles.catChip} ${styles.catMkt}`}>MARKETING</span>
            </h3>
            <div className={`${styles.infoBox} ${styles.none}`}>
              <strong>Estado actual: ninguna.</strong> Conniku no utiliza cookies de terceros con
              fines publicitarios, no integra scripts de redes publicitarias, pixels de seguimiento,
              brokers de datos ni plataformas de retargeting. Cualquier cambio futuro requerirá
              actualización de esta Política y consentimiento previo del Usuario.
            </div>

            {/* §3 */}
            <h2 id="c3">
              §3 — Cookie <code>cc_visitor_uuid</code> — clasificación como esencial
            </h2>
            <p>
              La cookie <code>cc_visitor_uuid</code> es un identificador pseudónimo UUID v4 generado
              del lado cliente la primera vez que un visitante interactúa con el banner de cookies.
              Se utiliza exclusivamente para asociar el registro de consentimiento almacenado en el
              servidor con el dispositivo del visitante.
            </p>
            <p>
              Conniku la clasifica como <strong>cookie estrictamente necesaria</strong> porque su
              única función es permitir a Conniku cumplir su obligación de demostrar el
              consentimiento conforme al Art. 7(1) GDPR. Esta clasificación se sustenta en cuatro
              condiciones que Conniku asume como obligaciones públicas:
            </p>
            <ol>
              <li>
                <strong>Plazo máximo 13 meses en dispositivo.</strong> Alineado con el criterio
                recomendado por la CNIL francesa y la AEPD española para cookies técnicas de
                consentimiento.
              </li>
              <li>
                <strong>Uso restringido al registro de consentimiento.</strong> El UUID no se
                combina con datos analíticos, no se envía a terceros, no participa en decisiones
                automatizadas y no se usa para personalización ni publicidad.
              </li>
              <li>
                <strong>Regeneración al retirar consentimiento.</strong> Cuando el Usuario retira el
                consentimiento, la cookie existente se elimina y se genera un UUID nuevo si el
                Usuario vuelve a interactuar con el banner.
              </li>
              <li>
                <strong>Declaración explícita en esta Política.</strong> Esta cláusula §3 constituye
                la declaración expresa de existencia, finalidad, duración y base legal conforme al
                Art. 13 GDPR y al Art. 4° de la Ley 19.628.
              </li>
            </ol>
            <p>
              Base legal: Art. 6(1)(f) GDPR (interés legítimo de Conniku en demostrar el
              consentimiento), en concordancia con la excepción del Art. 5(3) in fine de la
              Directiva ePrivacy.
            </p>

            {/* §4 */}
            <h2 id="c4">§4 — Cookies funcionales post-login: base legal Art. 6(1)(b) GDPR</h2>
            <p>
              Las cookies clasificadas como funcionales en §2.2 se instalan bajo base legal de{' '}
              <strong>ejecución del contrato</strong> (Art. 6(1)(b) GDPR), una vez que el Usuario ha
              iniciado sesión y aceptado los Términos y Condiciones.
            </p>
            <p>
              La justificación es que el contrato de prestación de servicios educativos incluye la
              entrega de un servicio personalizado: el Usuario espera razonablemente que la
              plataforma recuerde su idioma, su tema visual, su progreso académico y los banners que
              ya descartó. Sin estas cookies, Conniku no puede ejecutar el contrato conforme a la
              expectativa del Usuario.
            </p>
            <p>
              Por esta razón, Conniku no solicita consentimiento adicional específico para las
              cookies funcionales post-login. El Usuario puede eliminarlas manualmente desde su
              navegador (§8), aceptando que la experiencia se degradará.
            </p>

            {/* §5 */}
            <h2 id="c5">§5 — Retención de registros de consentimiento</h2>
            <p>
              Conniku conserva los registros de consentimiento otorgados a través del banner de
              cookies durante un plazo mínimo de <strong>5 años</strong> contados desde la fecha en
              que el Usuario eliminó su cuenta o desde la fecha en que el consentimiento fue
              retirado, el que sea posterior.
            </p>
            <p>
              Este plazo se fundamenta en: el Art. 17(3)(e) GDPR (excepción al derecho al olvido
              para defensa ante reclamaciones), el Art. 2515 del Código Civil chileno (prescripción
              general de 5 años) y el Art. 5(1)(e) GDPR (principio de limitación del plazo de
              conservación).
            </p>
            <p>Transcurridos los 5 años, los registros se eliminan de forma irreversible.</p>

            {/* §6 */}
            <h2 id="c6">§6 — Pseudonimización de IP y User-Agent a los 12 meses</h2>
            <p>
              Como medida adicional de minimización de datos (Art. 5(1)(c) GDPR y Art. 32 GDPR),
              Conniku aplica pseudonimización automática a los campos del registro de consentimiento
              transcurridos <strong>12 meses</strong> desde la fecha de emisión:
            </p>
            <ul>
              <li>
                <strong>Dirección IP:</strong> se reemplaza por un hash SHA-256 de la IP original
                más un salt propio de Conniku. El hash no permite recuperar la IP de origen.
              </li>
              <li>
                <strong>User-Agent:</strong> se reemplaza por una descripción canónica reducida
                (navegador y sistema operativo principales, sin versión menor ni identificadores
                únicos de dispositivo).
              </li>
            </ul>

            {/* §7 */}
            <h2 id="c7">§7 — Tus derechos sobre cookies y almacenamiento</h2>
            <p>
              Conforme a la Ley 19.628, el GDPR y la legislación aplicable en tu jurisdicción,
              tienes derecho a:
            </p>
            <ul>
              <li>
                <strong>Retirar tu consentimiento</strong> en cualquier momento, sin que ello afecte
                la licitud del tratamiento previo (Art. 7(3) GDPR).
              </li>
              <li>
                <strong>Acceder</strong> a los registros de consentimiento que Conniku tiene sobre
                ti (Art. 15 GDPR; Art. 12 Ley 19.628).
              </li>
              <li>
                <strong>Rectificar</strong> información errónea en tu registro (Art. 16 GDPR).
              </li>
              <li>
                <strong>Suprimir</strong> tu registro, con las limitaciones del §5 y del Art.
                17(3)(e) GDPR.
              </li>
              <li>
                <strong>Portabilidad:</strong> recibir una copia en JSON o CSV de los registros de
                consentimiento asociados a tu cuenta (Art. 20 GDPR).
              </li>
              <li>
                <strong>Oponerte</strong> al tratamiento fundado en interés legítimo (Art. 21 GDPR).
              </li>
              <li>
                <strong>Presentar un reclamo</strong> ante la autoridad competente: Consejo para la
                Transparencia (Chile, hasta 30/11/2026), Agencia de Protección de Datos Personales
                (Chile, desde 01/12/2026) o la autoridad de control de tu Estado miembro (UE).
              </li>
            </ul>
            <p>
              Para ejercer estos derechos escribe a{' '}
              <a href="mailto:legal@conniku.com">legal@conniku.com</a> o{' '}
              <a href="mailto:dpo@conniku.com">dpo@conniku.com</a>. Conniku responderá en máximo 30
              días calendario (Art. 12(3) GDPR), prorrogable por 60 días adicionales en casos de
              especial complejidad.
            </p>

            {/* §8 */}
            <h2 id="c8">§8 — Cómo cambiar tus preferencias de cookies</h2>
            <h3>A. Banner de preferencias de Conniku</h3>
            <p>
              El banner de cookies, accesible desde el pie de página, te permite revisar y modificar
              en cualquier momento y de forma granular el consentimiento otorgado a cada categoría.
              Los cambios surten efecto inmediato.
            </p>
            <h3>B. Configuración del navegador</h3>
            <p>
              Puedes gestionar o eliminar cookies y almacenamiento local directamente desde tu
              navegador:
            </p>
            <ul>
              <li>
                <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros
                datos de sitios
              </li>
              <li>
                <strong>Firefox:</strong> Preferencias → Privacidad y seguridad → Cookies y datos
                del sitio
              </li>
              <li>
                <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios
              </li>
              <li>
                <strong>Edge:</strong> Configuración → Cookies y permisos del sitio
              </li>
            </ul>
            <h3>C. Aplicaciones móviles</h3>
            <p>
              En las aplicaciones móviles basadas en Capacitor, puedes limpiar los datos locales
              desde los ajustes del sistema operativo:{' '}
              <em>Ajustes → Aplicaciones → Conniku → Almacenamiento → Borrar datos</em>, o
              desinstalando la aplicación.
            </p>
            <div className={`${styles.infoBox} ${styles.orange}`}>
              <strong>Advertencia.</strong> Si desactivas las cookies estrictamente necesarias
              (autenticación o <code>cc_visitor_uuid</code>), la plataforma dejará de funcionar
              correctamente: no podrás iniciar sesión, acceder a contenido que requiera
              identificación, ni interactuar con el banner de consentimiento.
            </div>

            {/* §9 */}
            <h2 id="c9">§9 — Marco legal aplicable</h2>
            <ul>
              <li>
                <strong>Reglamento (UE) 2016/679 (GDPR):</strong> Art. 5(3), 6(1)(a)(b)(f), 7,
                13-14, 15-22, 17(3)(e), 25, 32.
              </li>
              <li>
                <strong>Directiva 2002/58/CE (ePrivacy):</strong> Art. 5(3).
              </li>
              <li>
                <strong>Ley chilena 19.628:</strong> Art. 4° (información al momento de recolectar),
                Art. 12 (derechos ARCO). Vigente hasta el 30/11/2026.
              </li>
              <li>
                <strong>Ley chilena 21.719:</strong> Vigente desde el 1 de diciembre de 2026.
                Moderniza el régimen chileno de protección de datos y crea la Agencia de Protección
                de Datos Personales.
              </li>
              <li>
                <strong>Ley chilena 19.496:</strong> Art. 3 letra b (información veraz y oportuna),
                Art. 3 bis (retracto).
              </li>
              <li>
                <strong>EDPB Guidelines 05/2020</strong> sobre consentimiento.
              </li>
              <li>
                <strong>AEPD Guía sobre uso de cookies</strong> (julio 2023).
              </li>
            </ul>
            <p>
              En caso de conflicto entre regímenes aplicables, Conniku aplica el estándar más
              protector para el Usuario.
            </p>

            {/* §10 */}
            <h2 id="c10">§10 — Vigencia y cambios a esta Política</h2>
            <p>
              Esta Política está vigente desde el <strong>21 de abril de 2026</strong>, versión{' '}
              <strong>1.0.0</strong>. Conniku podrá actualizarla cuando cambien las tecnologías
              utilizadas, se incorporen nuevos proveedores o evolucione el marco regulatorio.
            </p>
            <p>
              Cada actualización material (nueva categoría de cookies, nuevos proveedores, cambio de
              base legal) se notificará al Usuario y requerirá nuevo consentimiento. Las
              actualizaciones menores (correcciones tipográficas, aclaraciones sin cambio
              sustantivo) se notificarán por correo sin requerir re-aceptación.
            </p>

            {/* §11 */}
            <h2 id="c11">§11 — Contacto</h2>
            <div className={styles.infoBox}>
              <strong>Asuntos legales y privacidad:</strong>{' '}
              <a href="mailto:legal@conniku.com">legal@conniku.com</a>
              <br />
              <strong>Delegado de Protección de Datos (DPO):</strong>{' '}
              <a href="mailto:dpo@conniku.com">dpo@conniku.com</a>
              <br />
              <strong>Contacto general:</strong>{' '}
              <a href="mailto:contacto@conniku.com">contacto@conniku.com</a>
              <br />
              <br />
              Conniku SpA · RUT: 78.395.702-7 · Antofagasta, Chile
            </div>

            <div className={styles.infoBox} style={{ marginTop: 40 }}>
              <strong>Documento:</strong> Política de Cookies · Versión 1.0.0 · Vigente desde el 21
              de abril de 2026
              <br />
              <strong>Empresa:</strong> Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
            </div>
          </div>
        </main>
      </div>

      <footer className={styles.pageFooter}>
        <span className={styles.footerCopy}>
          © 2026 Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
        </span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">Términos</Link>
          <Link to="/privacy">Privacidad</Link>
          <span className={styles.active}>Cookies</span>
          <Link to="/support">Soporte</Link>
          <Link to="/contact">Contacto</Link>
          <Link to="/careers">Trabaja con nosotros</Link>
        </nav>
      </footer>
    </div>
  );
}
