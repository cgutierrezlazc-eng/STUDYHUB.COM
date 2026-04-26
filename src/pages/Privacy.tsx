/**
 * Privacy.tsx
 *
 * Traducción de ORBIT-U/pages/privacidad.html a un componente React
 * funcional. Bridging del módulo M01.2 · Política de Privacidad.
 *
 * Reglas observadas:
 * - El contenido legal es VIGENTE y aprobado por el abogado · NO modificar.
 * - Idioma: español neutro latinoamericano (sin voseo).
 * - Logo oficial: estructura inviolable de `<span class="brand on-dark">`
 *   con className global (no CSS module).
 *
 * Pendientes (futuras sesiones):
 * - Bridging del motor Hex Nebula (src/lib/hex-nebula).
 * - Bridging de páginas legales/soporte hermanas (cookies, contacto, etc.).
 * - Backend de tracking de aceptación.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Privacy.module.css';

// TODO: cuando se bridgeen las páginas hermanas (cookies, soporte, contacto,
// prensa, empleo) reemplazar este handler por <Link to="/...">.
function handlePending(e: React.MouseEvent) {
  e.preventDefault();
  alert('Página pendiente');
}

export default function Privacy() {
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
        <span className={styles.topbarTitle}>POLÍTICA DE PRIVACIDAD</span>
      </div>

      <div className={styles.layout}>
        {/* TOC */}
        <aside className={styles.tocWrap}>
          <div className={styles.tocLabel}>Contenido</div>
          <ul className={styles.tocList}>
            <li>
              <a href="#s1">1 · Responsable del tratamiento</a>
            </li>
            <li>
              <a href="#s2">2 · Datos que recopilamos</a>
            </li>
            <li>
              <a href="#s3">3 · Finalidades y base legal</a>
            </li>
            <li>
              <a href="#s4">4 · Terceros y subencargados</a>
            </li>
            <li>
              <a href="#s5">5 · Transferencias internacionales</a>
            </li>
            <li>
              <a href="#s6">6 · Plazos de retención</a>
            </li>
            <li>
              <a href="#s7">7 · Derechos ARCO+</a>
            </li>
            <li>
              <a href="#s8">8 · Seguridad</a>
            </li>
            <li>
              <a href="#s9">9 · Menores de edad</a>
            </li>
            <li>
              <a href="#s10">10 · Marco normativo</a>
            </li>
            <li>
              <a href="#s11">11 · Contacto DPO</a>
            </li>
            <li>
              <a href="#s12">12 · Actualizaciones</a>
            </li>
          </ul>
        </aside>

        {/* Documento */}
        <main className={styles.docBody}>
          <div className={styles.docHeader}>
            <div className={styles.docBadge}>DOCUMENTO LEGAL VIGENTE</div>
            <h1 className={styles.docTitle}>Política de Privacidad</h1>
            <div className={styles.docMeta}>
              <span>
                <strong>Versión</strong> 2.4.2
              </span>
              <span>
                <strong>Vigencia</strong> 23 de abril de 2026
              </span>
              <span>
                <strong>Empresa</strong> Conniku SpA · RUT 78.395.702-7
              </span>
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.green}`}>
            <strong>En resumen.</strong> Conniku recopila solo los datos necesarios para prestarte
            el servicio. No vendemos tu información. Tienes derecho a acceder, corregir, eliminar y
            portar tus datos en cualquier momento. Respondemos en 2 días hábiles para solicitudes
            urgentes (Chile) y en máximo 30 días para el resto. Escríbenos a{' '}
            <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a>.
          </div>

          {/* §1 */}
          <h2 id="s1">§1 — Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de tus datos personales es:</p>
          <div className={styles.infoBox}>
            <strong>Conniku SpA</strong>
            <br />
            RUT: 78.395.702-7
            <br />
            Domicilio: Antofagasta, Chile
            <br />
            Correo de contacto: <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a>
            <br />
            DPO: <a href="mailto:dpo@conniku.com">dpo@conniku.com</a>
          </div>
          <p>
            El Delegado de Protección de Datos (DPO) de Conniku puede ser contactado directamente en{' '}
            <a href="mailto:dpo@conniku.com">dpo@conniku.com</a> para consultas relacionadas con el
            tratamiento de datos, ejercicio de derechos o reclamaciones formales.
          </p>

          {/* §2 */}
          <h2 id="s2">§2 — Datos que recopilamos y cómo los obtenemos</h2>

          <h3>2.1 Datos que nos proporcionas directamente</h3>
          <ul>
            <li>
              <strong>Datos de registro:</strong> nombre, apellido, correo electrónico, contraseña
              (almacenada en hash bcrypt), fecha de nacimiento, institución educativa, carrera.
            </li>
            <li>
              <strong>Datos de perfil:</strong> foto de perfil, biografía, intereses académicos,
              redes sociales opcionales.
            </li>
            <li>
              <strong>Contenido generado:</strong> publicaciones, comentarios, mensajes, archivos,
              apuntes, respuestas en foros.
            </li>
            <li>
              <strong>Datos de tutorías:</strong> historial de sesiones, valoraciones, materiales
              compartidos.
            </li>
            <li>
              <strong>Datos de pago:</strong> método de pago (procesado por MercadoPago o PayPal;
              Conniku no almacena datos de tarjetas).
            </li>
          </ul>

          <h3>2.2 Datos que recopilamos automáticamente</h3>
          <ul>
            <li>
              <strong>Datos técnicos:</strong> dirección IP (pseudonimizada a los 12 meses), tipo de
              navegador, sistema operativo, idioma, zona horaria.
            </li>
            <li>
              <strong>Datos de uso:</strong> páginas visitadas, módulos utilizados, duración de
              sesiones, clics, interacciones con el feed.
            </li>
            <li>
              <strong>Datos de dispositivo:</strong> en aplicaciones móviles, identificador de
              dispositivo, versión de la app, permisos concedidos.
            </li>
          </ul>

          <h3>2.3 Datos de terceros (OAuth)</h3>
          <p>
            Si te registras mediante Google OAuth, recibimos de Google únicamente: nombre, correo
            electrónico y foto de perfil, conforme a los permisos que concedas. No recibimos
            contraseñas ni información adicional de tu cuenta Google.
          </p>

          {/* §3 */}
          <h2 id="s3">§3 — Finalidades del tratamiento y base legal</h2>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Finalidad</th>
                  <th>Base legal</th>
                  <th>Aplicable en</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Prestación del servicio</strong> (autenticación, acceso a módulos,
                    funcionalidades de la plataforma)
                  </td>
                  <td>Ejecución del contrato — Art. 6(1)(b) GDPR</td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurBr}`}>BR</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Comunicaciones del servicio</strong> (notificaciones, avisos de
                    seguridad, cambios en T&amp;C)
                  </td>
                  <td>Ejecución del contrato — Art. 6(1)(b) GDPR</td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Personalización</strong> (preferencias de idioma, tema visual, orden del
                    feed)
                  </td>
                  <td>Ejecución del contrato — Art. 6(1)(b) GDPR</td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Seguridad y prevención de fraude</strong>
                  </td>
                  <td>Interés legítimo — Art. 6(1)(f) GDPR</td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Mejora del servicio</strong> (análisis de uso interno, diagnóstico de
                    errores)
                  </td>
                  <td>Interés legítimo — Art. 6(1)(f) GDPR</td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Comunicaciones comerciales</strong> (novedades, funcionalidades nuevas,
                    ofertas)
                  </td>
                  <td>Consentimiento — Art. 6(1)(a) GDPR (opt-in)</td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>{' '}
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Cumplimiento de obligaciones legales</strong>
                  </td>
                  <td>Obligación legal — Art. 6(1)(c) GDPR</td>
                  <td>Global</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* §4 */}
          <h2 id="s4">§4 — Proveedores terceros y subencargados</h2>
          <p>
            Conniku utiliza los siguientes proveedores para la prestación del servicio. Todos han
            suscrito acuerdos de procesamiento de datos (DPA) compatibles con el Art. 28 GDPR:
          </p>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Función</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Supabase</strong>
                  </td>
                  <td>Base de datos principal, autenticación, almacenamiento de archivos</td>
                  <td>EE.UU. / UE (región configurable)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Firebase (Google)</strong>
                  </td>
                  <td>Notificaciones push (FCM)</td>
                  <td>EE.UU.</td>
                </tr>
                <tr>
                  <td>
                    <strong>Google OAuth</strong>
                  </td>
                  <td>Inicio de sesión con Google</td>
                  <td>EE.UU.</td>
                </tr>
                <tr>
                  <td>
                    <strong>Anthropic</strong>
                  </td>
                  <td>Procesamiento de consultas al asistente Athena</td>
                  <td>EE.UU.</td>
                </tr>
                <tr>
                  <td>
                    <strong>Render</strong>
                  </td>
                  <td>Infraestructura de servidores back-end</td>
                  <td>EE.UU.</td>
                </tr>
                <tr>
                  <td>
                    <strong>Vercel</strong>
                  </td>
                  <td>Hosting front-end y funciones edge</td>
                  <td>EE.UU. / Global CDN</td>
                </tr>
                <tr>
                  <td>
                    <strong>Zoho Mail</strong>
                  </td>
                  <td>Servicio de correo electrónico institucional</td>
                  <td>EE.UU. / India</td>
                </tr>
                <tr>
                  <td>
                    <strong>MercadoPago</strong>
                  </td>
                  <td>Procesamiento de pagos (Latinoamérica)</td>
                  <td>Argentina / Chile</td>
                </tr>
                <tr>
                  <td>
                    <strong>PayPal</strong>
                  </td>
                  <td>Procesamiento de pagos (internacional)</td>
                  <td>EE.UU. / Luxemburgo</td>
                </tr>
                <tr>
                  <td>
                    <strong>Capacitor (Ionic)</strong>
                  </td>
                  <td>Framework de aplicaciones móviles nativas</td>
                  <td>EE.UU.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Conniku no vende, alquila ni cede datos personales de usuarios a terceros con fines
            comerciales propios de esos terceros.
          </p>

          {/* §5 */}
          <h2 id="s5">§5 — Transferencias internacionales de datos</h2>
          <p>
            Algunos proveedores listados en §4 procesan datos fuera del Espacio Económico Europeo
            (EEE) o fuera de Chile. Conniku adopta las siguientes salvaguardas:
          </p>
          <ul>
            <li>
              <strong>Cláusulas Contractuales Tipo (CCT)</strong> de la Comisión Europea para
              transferencias desde la UE/EEE hacia EE.UU., conforme al Art. 46(2)(c) GDPR.
            </li>
            <li>
              <strong>Decisiones de adecuación</strong> donde estén vigentes (p. ej., Data Privacy
              Framework UE-EE.UU.).
            </li>
            <li>
              <strong>Para usuarios de Chile:</strong> las transferencias se realizan conforme al
              Art. 5 de la Ley 19.628 (consentimiento informado al momento del registro) y serán
              actualizadas conforme a la Ley 21.719 desde su vigencia el 1 de diciembre de 2026.
            </li>
          </ul>

          {/* §6 */}
          <h2 id="s6">§6 — Plazos de retención</h2>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Tipo de dato</th>
                  <th>Plazo de retención</th>
                  <th>Fundamento</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Datos de cuenta activa</strong>
                  </td>
                  <td>Mientras la cuenta esté activa</td>
                  <td>Ejecución del contrato</td>
                </tr>
                <tr>
                  <td>
                    <strong>Datos de cuenta eliminada</strong>
                  </td>
                  <td>
                    Eliminación inmediata de datos identificables; logs pseudonimizados hasta 12
                    meses adicionales
                  </td>
                  <td>Art. 5(1)(e) GDPR · Minimización</td>
                </tr>
                <tr>
                  <td>
                    <strong>Registros de tickets de soporte</strong>
                  </td>
                  <td>5 años desde el cierre del ticket</td>
                  <td>Art. 2515 Código Civil (prescripción); defensa ante reclamaciones</td>
                </tr>
                <tr>
                  <td>
                    <strong>Feedback de soporte</strong>
                  </td>
                  <td>2 años; pseudonimizado a los 12 meses</td>
                  <td>Mejora del servicio · Art. 6(1)(f) GDPR</td>
                </tr>
                <tr>
                  <td>
                    <strong>Registros de consentimiento de cookies</strong>
                  </td>
                  <td>5 años desde que el consentimiento fue retirado o cuenta eliminada</td>
                  <td>Art. 7(1) GDPR · Demostrabilidad</td>
                </tr>
                <tr>
                  <td>
                    <strong>Logs de seguridad</strong>
                  </td>
                  <td>12 meses (IP pseudonimizada a los 12 meses)</td>
                  <td>Art. 32 GDPR · Seguridad del tratamiento</td>
                </tr>
                <tr>
                  <td>
                    <strong>Datos de facturación y pagos</strong>
                  </td>
                  <td>6 años</td>
                  <td>Ley 16.271 (tributaria chilena)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* §7 */}
          <h2 id="s7">§7 — Tus derechos sobre tus datos (ARCO+)</h2>
          <p>
            Tienes los siguientes derechos sobre tus datos personales, conforme a la ley chilena
            (Ley 19.628 / Ley 21.719) y al GDPR según tu jurisdicción:
          </p>

          <ul>
            <li>
              <strong>Acceso (A):</strong> obtener confirmación de si Conniku trata tus datos y
              recibir una copia.
            </li>
            <li>
              <strong>Rectificación (R):</strong> corregir datos inexactos o desactualizados.
            </li>
            <li>
              <strong>Cancelación / Supresión (C):</strong> solicitar la eliminación de tus datos
              cuando ya no sean necesarios o cuando retires el consentimiento, sujeto a excepciones
              legales.
            </li>
            <li>
              <strong>Oposición (O):</strong> oponerte al tratamiento basado en interés legítimo o
              para fines de marketing directo.
            </li>
            <li>
              <strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por
              máquina (JSON o CSV).
            </li>
            <li>
              <strong>Limitación del tratamiento:</strong> solicitar que el tratamiento se restrinja
              en casos específicos (GDPR Art. 18).
            </li>
            <li>
              <strong>No ser objeto de decisiones automatizadas:</strong> no serás objeto de
              decisiones que te afecten significativamente basadas únicamente en tratamiento
              automatizado sin intervención humana.
            </li>
            <li>
              <strong>Retirar el consentimiento:</strong> en cualquier momento, sin que ello afecte
              la licitud del tratamiento previo.
            </li>
          </ul>

          <div className={`${styles.infoBox} ${styles.green}`}>
            <strong>Cómo ejercer tus derechos.</strong> Envía tu solicitud a{' '}
            <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a> indicando tu nombre,
            correo registrado y el derecho que deseas ejercer. Conniku responderá en máximo 2 días
            hábiles (Chile, trámites urgentes), 15 días hábiles (Chile, trámites ordinarios) o 30
            días calendario (GDPR), prorrogable por 60 días adicionales en casos de especial
            complejidad.
          </div>

          <h3>7.1 Reclamación ante autoridad de control</h3>
          <p>
            Si consideras que el tratamiento de tus datos infringe la normativa aplicable, tienes
            derecho a presentar una reclamación ante:
          </p>
          <ul>
            <li>
              <strong>Chile (hasta el 30/11/2026):</strong> Consejo para la Transparencia.
            </li>
            <li>
              <strong>Chile (desde el 01/12/2026):</strong> Agencia de Protección de Datos
              Personales (Ley 21.719).
            </li>
            <li>
              <strong>Unión Europea / EEE:</strong> la autoridad de control del Estado miembro donde
              residas.
            </li>
            <li>
              <strong>España:</strong> Agencia Española de Protección de Datos (AEPD),{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener">
                www.aepd.es
              </a>
              .
            </li>
          </ul>

          {/* §8 */}
          <h2 id="s8">§8 — Seguridad del tratamiento</h2>
          <p>
            Conniku adopta medidas técnicas y organizativas adecuadas para proteger tus datos
            personales conforme al Art. 32 GDPR, incluyendo:
          </p>
          <ul>
            <li>Cifrado en tránsito (TLS 1.3) y en reposo (AES-256).</li>
            <li>Contraseñas almacenadas con hash bcrypt (factor de coste ≥ 12).</li>
            <li>Control de acceso basado en roles (RBAC) con principio de mínimo privilegio.</li>
            <li>Pseudonimización de IPs y User-Agents transcurridos 12 meses.</li>
            <li>Monitoreo continuo de amenazas y logs de auditoría.</li>
            <li>
              Política de divulgación responsable de vulnerabilidades:{' '}
              <a href="mailto:seguridad@conniku.com">seguridad@conniku.com</a>.
            </li>
          </ul>
          <p>
            En caso de brecha de seguridad que afecte tus datos, Conniku te notificará conforme a
            los plazos legales aplicables (72 horas para notificación a la autoridad conforme al
            Art. 33 GDPR; notificación al afectado sin dilación indebida cuando el riesgo sea alto,
            conforme al Art. 34 GDPR).
          </p>

          {/* §9 */}
          <h2 id="s9">§9 — Menores de edad</h2>
          <p>
            Conniku no presta servicios a personas menores de <strong>18 años</strong> y no recopila
            datos personales de menores a sabiendas. Si Conniku detecta que ha recibido datos de un
            menor de 18 años sin consentimiento parental verificable, procederá a eliminar esos
            datos de forma inmediata.
          </p>
          <p>
            Si eres padre, madre o tutor legal y crees que tu hijo o pupilo ha facilitado datos
            personales a Conniku, contacta a{' '}
            <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a> para solicitar su
            eliminación.
          </p>

          {/* §10 */}
          <h2 id="s10">§10 — Marco normativo aplicable</h2>
          <p>Esta Política de Privacidad cumple con la siguiente normativa:</p>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Norma</th>
                  <th>Jurisdicción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Ley chilena 19.628</strong> sobre Protección de la Vida Privada
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>
                  </td>
                  <td>Vigente hasta 30/11/2026</td>
                </tr>
                <tr>
                  <td>
                    <strong>Ley chilena 21.719</strong> sobre Protección y Tratamiento de Datos
                    Personales
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>
                  </td>
                  <td>Vigente desde 01/12/2026</td>
                </tr>
                <tr>
                  <td>
                    <strong>Reglamento (UE) 2016/679 (GDPR)</strong>
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurEu}`}>UE</span>
                  </td>
                  <td>Vigente</td>
                </tr>
                <tr>
                  <td>
                    <strong>LGPD — Lei Geral de Proteção de Dados</strong> (Lei 13.709/2018)
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurBr}`}>BR</span>
                  </td>
                  <td>Vigente</td>
                </tr>
                <tr>
                  <td>
                    <strong>CCPA / CPRA</strong> (California Consumer Privacy Act)
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurUs}`}>CA</span>
                  </td>
                  <td>Vigente</td>
                </tr>
                <tr>
                  <td>
                    <strong>LFPDPPP</strong> (México)
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurMx}`}>MX</span>
                  </td>
                  <td>Vigente</td>
                </tr>
                <tr>
                  <td>
                    <strong>Ley chilena 21.643 (Ley Karin)</strong>
                  </td>
                  <td>
                    <span className={`${styles.jurChip} ${styles.jurCl}`}>CL</span>
                  </td>
                  <td>Vigente desde 01/08/2024</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* §11 */}
          <h2 id="s11">§11 — Contacto y canales de privacidad</h2>
          <div className={styles.infoBox}>
            <strong>Privacidad y derechos ARCO+:</strong>{' '}
            <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a>
            <br />
            <strong>Delegado de Protección de Datos (DPO):</strong>{' '}
            <a href="mailto:dpo@conniku.com">dpo@conniku.com</a>
            <br />
            <strong>Denuncias Ley Karin y seguridad:</strong>{' '}
            <a href="mailto:seguridad@conniku.com">seguridad@conniku.com</a>
            <br />
            <strong>Soporte general:</strong>{' '}
            <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>
            <br />
            <strong>Legal:</strong> <a href="mailto:legal@conniku.com">legal@conniku.com</a>
          </div>

          {/* §12 */}
          <h2 id="s12">§12 — Actualizaciones de esta Política</h2>
          <p>
            Esta Política puede actualizarse para reflejar cambios en nuestras prácticas, nuevas
            funcionalidades o cambios normativos. Toda actualización material se notificará por
            correo electrónico con al menos 30 días de anticipación. La versión vigente siempre
            estará disponible en este documento con la fecha de última actualización.
          </p>

          <div className={styles.infoBox} style={{ marginTop: 40 }}>
            <strong>Documento:</strong> Política de Privacidad · Versión 2.4.2 · Vigente desde el 23
            de abril de 2026
            <br />
            <strong>Empresa:</strong> Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
            <br />
            <strong>Contacto:</strong>{' '}
            <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a>
          </div>
        </main>
      </div>

      {/* Footer · TODO: cuando se bridgeen cookies/soporte/contacto/prensa/empleo */}
      <footer className={styles.pageFooter}>
        <span className={styles.footerCopy}>
          © 2026 Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
        </span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">Términos</Link>
          <span className={styles.active}>Privacidad</span>
          <a href="#" onClick={handlePending}>
            Cookies
          </a>
          <a href="#" onClick={handlePending}>
            Soporte
          </a>
          <a href="#" onClick={handlePending}>
            Contacto
          </a>
          <a href="#" onClick={handlePending}>
            Prensa
          </a>
          <Link to="/careers">Trabaja con nosotros</Link>
        </nav>
      </footer>
    </div>
  );
}
