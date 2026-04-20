import React from 'react';
import tosStyles from './TermsOfService.module.css';

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
};

export default function TermsOfService({ onNavigate }: Props) {
  return (
    <>
      <div className={tosStyles.topProgress}>
        <div className={tosStyles.tpLeft}>
          <span className={tosStyles.pulse} aria-hidden="true" />
          <span>Términos y condiciones</span>
        </div>
        <span>Ley 19.496 Chile · vigente</span>
      </div>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => onNavigate('/')}>
          ← Volver
        </button>

        <h1 style={styles.h1}>Términos y Condiciones de Uso</h1>
        <p style={styles.date}>Última actualización: 8 de abril de 2026</p>

        <p style={styles.p}>
          Bienvenido/a a Conniku. Al acceder y utilizar nuestra plataforma, usted acepta los
          presentes Términos y Condiciones de Uso (en adelante, los "Términos"). Si no está de
          acuerdo con estos Términos, le rogamos no utilizar el servicio.
        </p>

        {/* 1. Identidad */}
        <h2 style={styles.h2}>1. Identificación del Prestador</h2>
        <p style={styles.p}>
          El presente sitio web y la plataforma Conniku son operados por{' '}
          <strong>Conniku SpA</strong>, sociedad constituida conforme a las leyes de la República de
          Chile, con domicilio en Santiago, Chile. El servicio se encuentra disponible a través del
          sitio web{' '}
          <a href="https://conniku.com" style={{ color: '#2D62C8' }}>
            conniku.com
          </a>
          .
        </p>

        {/* 2. Objeto */}
        <h2 style={styles.h2}>2. Objeto del Servicio</h2>
        <p style={styles.p}>
          Conniku es una plataforma digital de estudio diseñada para estudiantes universitarios. El
          servicio permite organizar materias y proyectos académicos, generar resúmenes y material
          de estudio asistido por tecnologia inteligente, participar en comunidades académicas,
          conectar con tutores y compañeros, y acceder a herramientas de productividad académica,
          entre otras funcionalidades.
        </p>

        {/* 3. Registro y cuenta */}
        <h2 style={styles.h2}>3. Registro y Cuenta de Usuario</h2>
        <p style={styles.p}>
          Para acceder a las funcionalidades de Conniku, el usuario debe crear una cuenta
          proporcionando información veraz, completa y actualizada. El usuario es responsable de:
        </p>
        <ul style={styles.ul}>
          <li>
            Mantener la confidencialidad de sus credenciales de acceso (correo electrónico y
            contraseña).
          </li>
          <li>Toda actividad que ocurra bajo su cuenta.</li>
          <li>Notificar de inmediato a Conniku cualquier uso no autorizado de su cuenta.</li>
          <li>
            Proporcionar datos veraces al momento del registro. La entrega de información falsa
            podrá resultar en la suspensión o eliminación de la cuenta.
          </li>
        </ul>
        <p style={styles.p}>
          Conniku es una plataforma exclusiva para personas mayores de 18 años. El usuario debe ser
          mayor de 18 años para crear una cuenta. Al registrarse, declara cumplir con este
          requisito. Esta restricción refleja la política operacional de Conniku (§Cumplimiento
          Legal) y aplica sin excepción en todas las jurisdicciones donde opera el servicio.
        </p>

        {/* 4. Planes y pagos */}
        <h2 style={styles.h2}>4. Planes y Pagos</h2>
        <p style={styles.p}>Conniku ofrece los siguientes planes de suscripción:</p>
        <ul style={styles.ul}>
          <li>
            <strong>Free (Gratuito):</strong> Acceso a funcionalidades básicas de la plataforma sin
            costo.
          </li>
          <li>
            <strong>Pro:</strong> $4.990 CLP mensuales. Incluye funcionalidades avanzadas de
            estudio, generación de contenido asistido y acceso prioritario a nuevas herramientas.
          </li>
          <li>
            <strong>Max:</strong> $9.990 CLP mensuales. Incluye todas las funcionalidades Pro además
            de acceso ilimitado al asistente, soporte prioritario y funcionalidades exclusivas.
          </li>
        </ul>
        <p style={styles.p}>
          Los precios están expresados en pesos chilenos (CLP) e incluyen IVA cuando corresponda.
          Los pagos se procesan de forma recurrente mensual a través de los medios de pago
          habilitados en la plataforma. El usuario podrá cancelar su suscripción en cualquier
          momento, manteniendo el acceso hasta el final del período ya pagado.
        </p>
        <p style={styles.p}>
          Conniku se reserva el derecho de modificar los precios de los planes, notificando a los
          usuarios con al menos 30 días de anticipación.
        </p>
        <h3 style={styles.h3}>4.1. Derecho de retracto (Chile)</h3>
        <p style={styles.p}>
          Los usuarios residentes en Chile que contraten una suscripción a distancia por este sitio
          tienen derecho a retractarse sin expresión de causa dentro de los{' '}
          <strong>10 días corridos</strong> siguientes al pago, conforme al artículo 3 bis letra b)
          de la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores. Para ejercer
          este derecho, el usuario puede utilizar la opción &quot;Solicitar reembolso&quot; dentro
          de su panel de Suscripción o escribir a{' '}
          <a href="mailto:contacto@conniku.com" style={{ color: 'var(--accent)' }}>
            contacto@conniku.com
          </a>
          . El reembolso se procesará al mismo medio de pago original dentro de un plazo máximo de
          30 días corridos. Este derecho no será aplicable cuando el servicio se haya prestado en su
          integridad antes del vencimiento del plazo de retracto con consentimiento expreso del
          consumidor.
        </p>
        <p style={styles.p}>
          Para usuarios residentes en la Unión Europea, Reino Unido y territorios con normativas
          equivalentes, el derecho de desistimiento aplicable se rige por la Directiva 2011/83/UE y
          sus leyes nacionales de transposición (14 días).
        </p>

        {/* 5. Propiedad intelectual */}
        <h2 style={styles.h2}>5. Propiedad Intelectual</h2>
        <h3 style={styles.h3}>5.1. Contenido de Conniku</h3>
        <p style={styles.p}>
          Todo el contenido de la plataforma, incluyendo pero no limitado a diseño, código fuente,
          textos, gráficos, logotipos, íconos e interfaz de usuario, es propiedad de Conniku SpA o
          de sus licenciantes, y está protegido por las leyes de propiedad intelectual vigentes en
          Chile (Ley N° 17.336 sobre Propiedad Intelectual).
        </p>
        <h3 style={styles.h3}>5.2. Contenido Generado Automaticamente</h3>
        <p style={styles.p}>
          Los resúmenes, cuestionarios y demás contenido generado automaticamente a través de la
          plataforma son herramientas de apoyo al estudio. Conniku no garantiza la exactitud,
          completitud o idoneidad de dicho contenido. El usuario es responsable de verificar la
          información generada antes de utilizarla con fines académicos.
        </p>
        <h3 style={styles.h3}>5.3. Contenido del Usuario</h3>
        <p style={styles.p}>
          El usuario conserva la propiedad intelectual sobre los documentos, apuntes y materiales
          que suba a la plataforma. Al cargar contenido, el usuario otorga a Conniku una licencia
          limitada, no exclusiva y revocable para procesar dicho contenido con el fin de prestar el
          servicio (por ejemplo, generar resúmenes asistidos). Conniku no utilizará el contenido del
          usuario para fines distintos a la prestación del servicio sin consentimiento previo.
        </p>

        {/* 6. Uso aceptable */}
        <h2 style={styles.h2}>6. Uso Aceptable</h2>
        <p style={styles.p}>
          El usuario se compromete a utilizar Conniku de manera lícita y conforme a los presentes
          Términos. Queda expresamente prohibido:
        </p>
        <ul style={styles.ul}>
          <li>
            Utilizar la plataforma para cometer plagio académico o cualquier forma de deshonestidad
            académica.
          </li>
          <li>
            Publicar, compartir o distribuir contenido ilegal, ofensivo, difamatorio, obsceno o que
            atente contra los derechos de terceros.
          </li>
          <li>Enviar spam, mensajes masivos no solicitados o publicidad no autorizada.</li>
          <li>
            Intentar acceder de manera no autorizada a sistemas, cuentas o datos de otros usuarios.
          </li>
          <li>
            Utilizar bots, scrapers u otras herramientas automatizadas para extraer datos de la
            plataforma.
          </li>
          <li>Suplantar la identidad de otra persona o entidad.</li>
          <li>Interferir con el funcionamiento normal de la plataforma.</li>
        </ul>
        <p style={styles.p}>
          El incumplimiento de estas normas podrá resultar en la suspensión temporal o definitiva de
          la cuenta, sin derecho a reembolso.
        </p>

        {/* 7. Privacidad */}
        <h2 style={styles.h2}>7. Privacidad y Protección de Datos</h2>
        <p style={styles.p}>
          El tratamiento de datos personales se rige por nuestra{' '}
          <a
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/privacy');
            }}
            style={{ color: '#2D62C8', textDecoration: 'underline' }}
          >
            Política de Privacidad
          </a>
          , la cual forma parte integrante de estos Términos. Al utilizar Conniku, el usuario acepta
          el tratamiento de sus datos conforme a dicha política y a la Ley N° 19.628 sobre
          Protección de la Vida Privada.
        </p>

        {/* 8. Limitación de responsabilidad */}
        <h2 style={styles.h2}>8. Limitación de Responsabilidad</h2>
        <p style={styles.p}>
          Conniku SpA presta el servicio "tal como está" (as is) y "según disponibilidad" (as
          available). En la máxima medida permitida por la legislación chilena:
        </p>
        <ul style={styles.ul}>
          <li>
            Conniku no garantiza que el servicio sea ininterrumpido, libre de errores o
            completamente seguro.
          </li>
          <li>
            Conniku no se hace responsable por los resultados académicos del usuario ni por
            decisiones tomadas con base en el contenido generado por la plataforma.
          </li>
          <li>
            Conniku no será responsable por daños indirectos, incidentales, especiales o
            consecuenciales derivados del uso o imposibilidad de uso del servicio.
          </li>
          <li>
            La responsabilidad total de Conniku frente al usuario no excederá el monto pagado por el
            usuario en los últimos 12 meses por el servicio.
          </li>
        </ul>

        {/* 9. Suspensión y terminación */}
        <h2 style={styles.h2}>9. Suspensión, Terminación y Eliminación de Cuenta</h2>
        <h3 style={styles.h3}>9.1. Suspensión por incumplimiento</h3>
        <p style={styles.p}>
          Conniku se reserva el derecho de suspender o cancelar la cuenta de cualquier usuario que
          incumpla estos Términos, sin previo aviso y sin derecho a reembolso.
        </p>
        <h3 style={styles.h3}>9.2. Eliminación voluntaria de cuenta</h3>
        <p style={styles.p}>
          El usuario puede eliminar su cuenta de Conniku en cualquier momento, de forma gratuita.
          Existen dos formas de hacerlo:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Desde la aplicación:</strong> Accede a tu Perfil → Configuración → desplázate
            hasta "Zona de peligro" → haz clic en "Eliminar cuenta" y confirma escribiendo
            "ELIMINAR".
          </li>
          <li>
            <strong>Por correo electrónico:</strong> Envía una solicitud a{' '}
            <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
              privacidad@conniku.com
            </a>{' '}
            indicando tu nombre completo y correo registrado.
          </li>
        </ul>
        <p style={styles.p}>
          Para instrucciones detalladas, tiempos de procesamiento y qué datos se eliminan, visita
          nuestra página dedicada:{' '}
          <a
            href="/delete-account"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/delete-account');
            }}
            style={{ color: '#2D62C8', textDecoration: 'underline' }}
          >
            conniku.com/delete-account
          </a>
          .
        </p>
        <h3 style={styles.h3}>9.3. Efectos de la eliminación</h3>
        <p style={styles.p}>
          La eliminación de la cuenta es irreversible. Los datos identificables se eliminan dentro
          de los 30 días siguientes a la solicitud. Ciertos datos podrán conservarse en forma
          anonimizada o por obligación legal (ver sección 9 de la Política de Privacidad).
        </p>

        {/* 10. Modificaciones */}
        <h2 style={styles.h2}>10. Modificaciones a los Términos</h2>
        <p style={styles.p}>
          Conniku se reserva el derecho de modificar estos Términos en cualquier momento. Las
          modificaciones serán notificadas a los usuarios a través de la plataforma y/o por correo
          electrónico. El uso continuado del servicio después de la notificación constituye la
          aceptación de los nuevos Términos. Si el usuario no está de acuerdo con las
          modificaciones, deberá dejar de utilizar el servicio y eliminar su cuenta.
        </p>

        {/* 11. Ley aplicable */}
        <h2 style={styles.h2}>11. Ley Aplicable y Jurisdicción</h2>
        <p style={styles.p}>
          Estos Términos se rigen por la legislación vigente de la República de Chile. Cualquier
          controversia derivada de la interpretación o cumplimiento de estos Términos será sometida
          al conocimiento de los Tribunales Ordinarios de Justicia de la ciudad de Santiago de
          Chile, renunciando las partes a cualquier otro fuero que pudiere corresponderles.
        </p>

        {/* 12. Disposiciones generales */}
        <h2 style={styles.h2}>12. Disposiciones Generales</h2>
        <p style={styles.p}>
          Si cualquier disposición de estos Términos fuere declarada nula o inaplicable, las
          restantes disposiciones mantendrán su plena vigencia y efecto. La falta de ejercicio por
          parte de Conniku de cualquier derecho establecido en estos Términos no constituirá una
          renuncia a dicho derecho.
        </p>

        {/* 13. Contacto */}
        <h2 style={styles.h2}>13. Contacto</h2>
        <p style={styles.p}>
          Para cualquier consulta relacionada con estos Términos y Condiciones, puede comunicarse
          con nosotros a través de:
        </p>
        <ul style={styles.ul}>
          <li>
            Correo electrónico:{' '}
            <a href="mailto:contacto@conniku.com" style={{ color: '#2D62C8' }}>
              contacto@conniku.com
            </a>
          </li>
          <li>
            Sitio web:{' '}
            <a href="https://conniku.com" style={{ color: '#2D62C8' }}>
              conniku.com
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
