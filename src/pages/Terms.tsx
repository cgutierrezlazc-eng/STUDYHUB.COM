import { Link, useNavigate } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Terms.module.css';

export default function Terms() {
  const navigate = useNavigate();
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
          Volver
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
        <span className={styles.topbarTitle}>TÉRMINOS DE SERVICIO</span>
      </div>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.dCard}>
            <div className={styles.docBadge}>DOCUMENTO LEGAL VIGENTE</div>
            <div className={styles.docMeta}>
              <span>
                <strong>Versión</strong> 3.2.2
              </span>
              <span>
                <strong>Vigencia</strong> 22 de abril de 2026
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
                <a href="#t1">I · Partes y objeto</a>
              </li>
              <li>
                <a href="#t2">II · Registro y cuenta</a>
              </li>
              <li>
                <a href="#t3">III · Servicios disponibles</a>
              </li>
              <li>
                <a href="#t4">IV · Contenido del usuario</a>
              </li>
              <li>
                <a href="#t5">V · Propiedad intelectual</a>
              </li>
              <li>
                <a href="#t6">VI · Conducta y moderación</a>
              </li>
              <li>
                <a href="#t7">VII · Tutorías</a>
              </li>
              <li>
                <a href="#t8">VIII · Planes y pagos</a>
              </li>
              <li>
                <a href="#t9">IX · Retracto y reembolso</a>
              </li>
              <li>
                <a href="#t10">X · Privacidad</a>
              </li>
              <li>
                <a href="#t11">XI · Responsabilidad</a>
              </li>
              <li>
                <a href="#t12">XII · Ley Karin</a>
              </li>
              <li>
                <a href="#t13">XIII · Modificaciones</a>
              </li>
              <li>
                <a href="#t14">XIV · Disposiciones finales</a>
              </li>
            </ul>
          </div>

          <div className={styles.dCard}>
            <div className={styles.cardLabel}>¿Dudas legales?</div>
            <p className={styles.cardText}>
              Escríbenos a <a href="mailto:legal@conniku.com">legal@conniku.com</a> o visita el{' '}
              <Link to="/support">Centro de ayuda</Link>.
            </p>
          </div>
        </aside>

        {/* ── Feed ── */}
        <main className={styles.feed}>
          <div className={styles.dCard}>
            <h1 className={styles.docTitle}>Términos y Condiciones de Uso</h1>

            <div className={`${styles.infoBox} ${styles.green}`}>
              <strong>Resumen ejecutivo.</strong> Al crear una cuenta o usar la plataforma Conniku
              aceptas íntegramente estos Términos. Eres mayor de 18 años, tu uso es personal y no
              comercial, y no debes publicar contenido que cause daño a terceros. Si pagas por un
              plan premium tienes derecho a retracto durante 10 días corridos contados desde la
              contratación, salvo que hayas comenzado a utilizar el servicio.
            </div>

            {/* TÍTULO I */}
            <h2 id="t1">Título I — Partes, objeto y aceptación</h2>

            <h3>Artículo 1. Partes</h3>
            <p>
              El presente contrato regula la relación entre <strong>Conniku SpA</strong>, empresa
              constituida en Chile conforme a la Ley N° 3.918, RUT 78.395.702-7, domiciliada en
              Antofagasta, Chile (en adelante "Conniku" o "la Empresa"), y la persona natural mayor
              de 18 años que se registra o utiliza la plataforma (en adelante "el Usuario").
            </p>

            <h3>Artículo 2. Objeto</h3>
            <p>
              Conniku es una plataforma digital colaborativa para educación universitaria cuyo
              objeto social es el{' '}
              <em>
                desarrollo, operación y comercialización de plataformas digitales colaborativas para
                educación
              </em>
              . Estos Términos regulan el acceso y uso de todos los servicios disponibles bajo el
              dominio <code>conniku.com</code> y sus aplicaciones móviles y extensiones asociadas.
            </p>

            <h3>Artículo 3. Aceptación</h3>
            <p>
              Al crear una cuenta, iniciar sesión o hacer uso de cualquier funcionalidad de la
              plataforma, el Usuario declara haber leído, comprendido y aceptado íntegramente estos
              Términos, la Política de Privacidad y la Política de Cookies. Si no estás de acuerdo,
              debes abstenerte de utilizar la plataforma.
            </p>

            <h3>Artículo 4. Edad mínima</h3>
            <p>
              El servicio está dirigido exclusivamente a personas mayores de{' '}
              <strong>18 años</strong>. Conniku no presta servicios a menores de edad. Si Conniku
              detecta que un Usuario registrado es menor de 18 años, suspenderá la cuenta de forma
              inmediata y eliminará los datos asociados conforme a la Política de Privacidad.
            </p>

            {/* TÍTULO II */}
            <h2 id="t2">Título II — Registro y gestión de cuenta</h2>

            <h3>Artículo 5. Registro</h3>
            <p>
              Para acceder a los servicios el Usuario debe crear una cuenta, proporcionando
              información verídica, actualizada y completa. Se recomienda el uso de correo
              institucional universitario para verificación inmediata. El Usuario es responsable de
              mantener sus credenciales de acceso en reserva y de cualquier actividad realizada
              desde su cuenta.
            </p>

            <h3>Artículo 6. Veracidad de datos</h3>
            <p>
              El Usuario declara bajo su responsabilidad que toda la información proporcionada
              durante el registro es veraz. Conniku se reserva el derecho de verificar la
              información y de suspender o eliminar cuentas creadas con información falsa o que
              infrinjan derechos de terceros.
            </p>

            <h3>Artículo 7. Seguridad de la cuenta</h3>
            <p>
              El Usuario debe notificar de forma inmediata a Conniku a través de{' '}
              <a href="mailto:soporte@conniku.com">soporte@conniku.com</a> ante cualquier uso no
              autorizado de su cuenta o brecha de seguridad conocida. Conniku no será responsable de
              los daños derivados del incumplimiento de esta obligación por parte del Usuario.
            </p>

            <h3>Artículo 8. Eliminación de cuenta</h3>
            <p>
              El Usuario puede solicitar la eliminación de su cuenta en cualquier momento desde la
              configuración de perfil o mediante solicitud a{' '}
              <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>. La eliminación es
              irreversible. Conniku conservará únicamente los datos que esté obligada a retener por
              ley, conforme a la Política de Privacidad.
            </p>

            {/* TÍTULO III */}
            <h2 id="t3">Título III — Servicios disponibles</h2>

            <h3>Artículo 9. Módulos de la plataforma</h3>
            <p>
              Conniku pone a disposición del Usuario los siguientes módulos, cuya disponibilidad
              puede variar según el plan suscrito y la etapa de desarrollo de la plataforma:
            </p>
            <ul>
              <li>
                <strong>Workspaces:</strong> espacios colaborativos para grupos de estudio y
                proyectos académicos.
              </li>
              <li>
                <strong>Mensajes:</strong> comunicación directa e institucional entre usuarios.
              </li>
              <li>
                <strong>Biblioteca:</strong> repositorio de recursos académicos.
              </li>
              <li>
                <strong>Cursos:</strong> contenido formativo estructurado.
              </li>
              <li>
                <strong>Comunidades:</strong> foros y espacios de discusión temáticos.
              </li>
              <li>
                <strong>Calendario:</strong> gestión de actividades y plazos académicos.
              </li>
              <li>
                <strong>Tutores:</strong> servicio de tutorías entre pares y profesionales.
              </li>
              <li>
                <strong>Empleo:</strong> módulo de inserción laboral para universitarios.
              </li>
              <li>
                <strong>Athena:</strong> asistente académico integrado.
              </li>
            </ul>

            <h3>Artículo 10. Modificación y disponibilidad</h3>
            <p>
              Conniku se reserva el derecho de modificar, suspender o discontinuar cualquier
              funcionalidad de la plataforma, con o sin previo aviso. Se procurará notificar con
              anticipación razonable los cambios que afecten significativamente el servicio. Conniku
              no garantiza disponibilidad continua e ininterrumpida del servicio.
            </p>

            {/* TÍTULO IV */}
            <h2 id="t4">Título IV — Contenido generado por el Usuario</h2>

            <h3>Artículo 11. Titularidad del contenido</h3>
            <p>
              El Usuario conserva la titularidad de los derechos de propiedad intelectual sobre el
              contenido que publica en la plataforma. Al publicar contenido, el Usuario otorga a
              Conniku una licencia mundial, no exclusiva, gratuita, sublicenciable y transferible
              para usar, reproducir, distribuir, preparar obras derivadas y mostrar dicho contenido
              únicamente en el contexto de la prestación del servicio.
            </p>

            <h3>Artículo 12. Responsabilidad del contenido</h3>
            <p>
              El Usuario es el único responsable de todo el contenido que publica, comparte o
              transmite a través de la plataforma. Conniku actúa como intermediario técnico y no
              asume responsabilidad editorial por el contenido generado por los usuarios.
            </p>

            <h3>Artículo 13. Contenido prohibido</h3>
            <p>Está estrictamente prohibido publicar contenido que:</p>
            <ul>
              <li>
                Incite al odio, la discriminación o la violencia por motivos de raza, etnia, género,
                orientación sexual, religión, discapacidad u otra característica protegida.
              </li>
              <li>
                Contenga material de abuso sexual infantil (CSAM) o pornografía no consentida.
              </li>
              <li>
                Constituya acoso, hostigamiento, amenazas o intimidación hacia cualquier persona.
              </li>
              <li>Infrinja derechos de propiedad intelectual de terceros.</li>
              <li>Contenga malware, phishing o sea utilizado para fraudes o engaños.</li>
              <li>Viole la privacidad de terceros sin su consentimiento.</li>
              <li>Contravenga cualquier norma legal aplicable.</li>
            </ul>

            {/* TÍTULO V */}
            <h2 id="t5">Título V — Propiedad intelectual de Conniku</h2>

            <h3>Artículo 14. Derechos reservados</h3>
            <p>
              La plataforma Conniku, su código fuente, diseño visual, logotipos, marca, contenidos
              propios y cualquier otro elemento de propiedad intelectual son titularidad exclusiva
              de Conniku SpA o de sus licenciantes, protegidos por la Ley N° 17.336 sobre Propiedad
              Intelectual de Chile y los tratados internacionales aplicables.
            </p>

            <h3>Artículo 15. Uso permitido</h3>
            <p>
              Se otorga al Usuario una licencia personal, no exclusiva, intransferible y revocable
              para usar la plataforma estrictamente conforme a estos Términos. Queda prohibida la
              ingeniería inversa, el scraping masivo, la copia, redistribución o explotación
              comercial de cualquier elemento de la plataforma sin autorización escrita de Conniku.
            </p>

            {/* TÍTULO VI */}
            <h2 id="t6">Título VI — Conducta y moderación</h2>

            <h3>Artículo 16. Normas de conducta</h3>
            <p>
              El Usuario se compromete a usar la plataforma de manera respetuosa, conforme a las
              normas de convivencia establecidas en las directrices de comunidad de Conniku,
              actuando de buena fe y sin causar daño a otros usuarios o a la plataforma.
            </p>

            <h3>Artículo 17. Moderación y sanciones</h3>
            <p>
              Conniku se reserva el derecho de eliminar contenido que infrinja estos Términos y de
              suspender o terminar cuentas de usuarios que incurran en infracciones graves o
              reiteradas. Las decisiones de moderación pueden apelarse ante{' '}
              <a href="mailto:moderacion@conniku.com">moderacion@conniku.com</a> dentro de los 14
              días corridos siguientes a la notificación.
            </p>

            <h3>Artículo 18. Reporte de contenido</h3>
            <p>
              Cualquier usuario puede reportar contenido que infrinja estos Términos mediante los
              mecanismos habilitados en la plataforma o escribiendo a{' '}
              <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>. Conniku se compromete a
              revisar los reportes dentro de los plazos establecidos en sus políticas de moderación.
            </p>

            {/* TÍTULO VII */}
            <h2 id="t7">Título VII — Tutorías</h2>

            <h3>Artículo 19. Naturaleza del servicio de tutorías</h3>
            <p>
              El módulo de Tutores facilita la conexión entre usuarios que ofrecen asistencia
              académica y usuarios que la solicitan. Conniku actúa como intermediario tecnológico.
              Los tutores que prestan servicios a través de la plataforma no son empleados ni
              representantes de Conniku, a menos que se indique expresamente lo contrario.
            </p>

            <h3>Artículo 20. Responsabilidad en tutorías</h3>
            <p>
              Conniku no garantiza la calidad, exactitud o pertinencia del contenido académico
              proporcionado por tutores independientes. El Usuario que contrata tutorías entiende y
              acepta que la evaluación y verificación de la idoneidad del tutor es de su propia
              responsabilidad. Para reportes sobre tutores, escribe a{' '}
              <a href="mailto:tutores@conniku.com">tutores@conniku.com</a>.
            </p>

            {/* TÍTULO VIII */}
            <h2 id="t8">Título VIII — Planes, precios y pagos</h2>

            <h3>Artículo 21. Plan gratuito</h3>
            <p>
              Conniku ofrece un plan gratuito con funcionalidades limitadas. El acceso al plan
              gratuito no genera ninguna obligación de pago para el Usuario.
            </p>

            <h3>Artículo 22. Planes de pago</h3>
            <p>
              Conniku puede ofrecer planes de pago que amplíen las funcionalidades disponibles. Los
              precios, características y condiciones de cada plan se informarán de forma clara y
              previa a la contratación, conforme al Art. 3 letra b de la Ley 19.496 sobre Protección
              de los Derechos de los Consumidores.
            </p>

            <h3>Artículo 23. Procesadores de pago</h3>
            <p>
              Los pagos se procesan a través de proveedores terceros (MercadoPago, PayPal u otros
              que Conniku indique). Conniku no almacena datos de tarjetas de crédito ni información
              financiera sensible del Usuario. Los términos del procesador de pago aplicable se
              consideran parte de la transacción.
            </p>

            {/* TÍTULO IX */}
            <h2 id="t9">Título IX — Derecho de retracto y reembolsos</h2>

            <h3>Artículo 24. Derecho de retracto</h3>
            <p>
              Conforme al <strong>Art. 3 bis de la Ley 19.496</strong> (Ley del Consumidor), el
              Usuario tiene derecho a retractarse del contrato de servicios digitales dentro de los{' '}
              <strong>10 días corridos</strong> contados desde la celebración del contrato, siempre
              que no haya comenzado a utilizar el servicio contratado.
            </p>

            <div className={`${styles.infoBox} ${styles.orange}`}>
              <strong>Importante.</strong> El derecho de retracto se extingue en el momento en que
              el Usuario comienza a utilizar efectivamente el servicio o módulo premium contratado,
              conforme al Art. 3 bis inciso final de la Ley 19.496.
            </div>

            <h3>Artículo 25. Procedimiento de retracto</h3>
            <p>
              Para ejercer el derecho de retracto, el Usuario debe notificar su decisión por escrito
              a <a href="mailto:soporte@conniku.com">soporte@conniku.com</a> dentro del plazo
              indicado. Conniku procederá al reembolso mediante el mismo medio de pago utilizado en
              la compra, dentro de los plazos que establece la ley.
            </p>

            {/* TÍTULO X */}
            <h2 id="t10">Título X — Privacidad y protección de datos</h2>

            <h3>Artículo 26. Política de Privacidad</h3>
            <p>
              El tratamiento de los datos personales del Usuario se rige por la{' '}
              <Link to="/privacy">Política de Privacidad</Link> de Conniku, que forma parte
              integrante de estos Términos. Al aceptar estos Términos, el Usuario acepta también la
              Política de Privacidad.
            </p>

            <h3>Artículo 27. Derechos del titular</h3>
            <p>
              El Usuario tiene derechos de acceso, rectificación, cancelación, oposición y
              portabilidad sobre sus datos personales, conforme a la legislación aplicable. Puede
              ejercerlos escribiendo a{' '}
              <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a>.
            </p>

            {/* TÍTULO XI */}
            <h2 id="t11">Título XI — Limitación de responsabilidad</h2>

            <h3>Artículo 28. Exclusión de garantías</h3>
            <p>
              En la medida permitida por la ley aplicable, Conniku presta el servicio "tal cual" y
              "según disponibilidad", sin garantías de ningún tipo, ya sean expresas, implícitas o
              estatutarias, incluyendo garantías de comerciabilidad, idoneidad para un fin
              particular o no infracción.
            </p>

            <h3>Artículo 29. Limitación de daños</h3>
            <p>
              Salvo en casos de dolo o culpa grave de Conniku, la responsabilidad total de Conniku
              frente al Usuario por cualquier reclamación no excederá el monto total que el Usuario
              haya pagado a Conniku en los 12 meses anteriores a la reclamación, o CLP $10.000 si el
              monto resulta menor. Esta limitación no afecta los derechos irrenunciables del
              consumidor conforme a la Ley 19.496.
            </p>

            <h3>Artículo 30. Contenido de terceros</h3>
            <p>
              La plataforma puede incluir enlaces o referencias a recursos de terceros. Conniku no
              controla ni es responsable del contenido, políticas de privacidad o prácticas de
              sitios web de terceros.
            </p>

            {/* TÍTULO XII */}
            <h2 id="t12">Título XII — Ley Karin y entorno seguro</h2>

            <h3>Artículo 31. Política de prevención</h3>
            <p>
              Conniku, en su calidad de empleador y operador de plataforma digital, declara su
              compromiso con la prevención del acoso laboral, acoso sexual y violencia en el
              trabajo, conforme a la <strong>Ley N° 21.643 (Ley Karin)</strong>, vigente desde el 1
              de agosto de 2024.
            </p>

            <h3>Artículo 32. Canal de denuncias</h3>
            <p>
              Las denuncias de acoso laboral, acoso sexual o violencia hacia cualquier persona en el
              contexto de uso de la plataforma pueden presentarse ante{' '}
              <a href="mailto:seguridad@conniku.com">seguridad@conniku.com</a> o a través del canal
              habilitado en la configuración de cuenta. Conniku garantiza la confidencialidad del
              denunciante conforme al Art. 33 bis de la Ley N° 21.643.
            </p>

            <h3>Artículo 33. Investigación y resolución</h3>
            <p>
              Toda denuncia recibida será investigada conforme al procedimiento establecido en la
              Ley Karin, con respeto a los derechos de todas las partes involucradas. Conniku se
              reserva el derecho de suspender o terminar la cuenta del Usuario sobre el que recaiga
              una denuncia fundada, sin perjuicio de las acciones legales que correspondan.
            </p>

            {/* TÍTULO XIII */}
            <h2 id="t13">Título XIII — Modificaciones a los Términos</h2>

            <h3>Artículo 34. Derecho a modificar</h3>
            <p>
              Conniku se reserva el derecho de modificar estos Términos en cualquier momento. Los
              cambios materiales se notificarán al Usuario con al menos{' '}
              <strong>30 días de anticipación</strong> mediante correo electrónico al address
              registrado y mediante aviso en la plataforma.
            </p>

            <h3>Artículo 35. Aceptación de cambios</h3>
            <p>
              El uso continuado de la plataforma después del período de notificación implica la
              aceptación de los Términos modificados. Si el Usuario no acepta los nuevos Términos,
              debe eliminar su cuenta antes del vencimiento del plazo de notificación.
            </p>

            {/* TÍTULO XIV */}
            <h2 id="t14">Título XIV — Disposiciones finales</h2>

            <h3>Artículo 36. Ley aplicable</h3>
            <p>
              Estos Términos se rigen por la legislación de la República de Chile, en particular la{' '}
              <strong>Ley 19.628</strong> sobre Protección de la Vida Privada, la{' '}
              <strong>Ley 19.496</strong> sobre Protección al Consumidor, la{' '}
              <strong>Ley 21.643</strong> (Ley Karin), la <strong>Ley 17.336</strong> sobre
              Propiedad Intelectual, y la <strong>Ley 21.719</strong> sobre Protección y Tratamiento
              de Datos Personales (vigente a partir del 1 de diciembre de 2026).
            </p>

            <h3>Artículo 37. Tribunales competentes</h3>
            <p>
              Para cualquier controversia derivada de estos Términos, las partes se someten a la
              jurisdicción de los Tribunales Ordinarios de Justicia de la ciudad de{' '}
              <strong>Antofagasta, Chile</strong>, sin perjuicio de los derechos del consumidor de
              acuerdo a la Ley 19.496 y de los mecanismos de solución alternativa de disputas
              disponibles.
            </p>

            <h3>Artículo 38. Contacto legal</h3>
            <p>
              Para consultas relacionadas con estos Términos, escribe a{' '}
              <a href="mailto:legal@conniku.com">legal@conniku.com</a>. Para soporte técnico, a{' '}
              <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>.
            </p>

            <h3>Artículo 39. Separabilidad</h3>
            <p>
              Si alguna disposición de estos Términos fuera declarada inválida o inaplicable por
              autoridad judicial o administrativa competente, el resto del documento permanecerá en
              plena vigencia. La disposición inválida se modificará en la medida mínima necesaria
              para hacerla válida y ejecutable.
            </p>

            <h3>Artículo 40. Versión en español</h3>
            <p>
              Estos Términos se han redactado en idioma español. En caso de contradicción entre una
              versión en otro idioma y la versión en español, prevalecerá el texto en español.
            </p>

            <div className={styles.infoBox} style={{ marginTop: 40 }}>
              <strong>Documento:</strong> Términos y Condiciones de Uso · Versión 3.2.2 · Vigente
              desde el 22 de abril de 2026
              <br />
              <strong>Empresa:</strong> Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
              <br />
              <strong>Contacto:</strong> <a href="mailto:legal@conniku.com">legal@conniku.com</a>
            </div>
          </div>
        </main>
      </div>

      <footer className={styles.pageFooter}>
        <span className={styles.footerCopy}>
          © 2026 Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile
        </span>
        <nav className={styles.footerLinks}>
          <Link to="/terms" className={styles.active}>
            Términos
          </Link>
          <Link to="/privacy">Privacidad</Link>
          <Link to="/support">Soporte</Link>
          <Link to="/contact">Contacto</Link>
          <Link to="/careers">Trabaja con nosotros</Link>
        </nav>
      </footer>
    </div>
  );
}
