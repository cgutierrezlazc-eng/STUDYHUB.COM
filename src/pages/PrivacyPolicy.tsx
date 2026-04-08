import React from 'react'

interface Props {
  onNavigate: (path: string) => void
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
  } as React.CSSProperties,
}

export default function PrivacyPolicy({ onNavigate }: Props) {
  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => onNavigate('/')}>
        ← Volver
      </button>

      <h1 style={styles.h1}>Política de Privacidad</h1>
      <p style={styles.date}>Última actualización: 8 de abril de 2026</p>

      <p style={styles.p}>
        En Conniku SpA (en adelante, "Conniku", "nosotros" o "la empresa"), nos comprometemos a
        proteger la privacidad y los datos personales de nuestros usuarios, en cumplimiento de la
        Ley N° 19.628 sobre Protección de la Vida Privada y demás normativa aplicable en la
        República de Chile.
      </p>
      <p style={styles.p}>
        Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos
        sus datos personales cuando utiliza nuestra plataforma.
      </p>

      {/* 1. Responsable */}
      <h2 style={styles.h2}>1. Responsable del Tratamiento de Datos</h2>
      <p style={styles.p}>
        El responsable del tratamiento de sus datos personales es:
      </p>
      <ul style={styles.ul}>
        <li><strong>Razón social:</strong> Conniku SpA</li>
        <li><strong>Domicilio:</strong> Santiago, Chile</li>
        <li><strong>Sitio web:</strong> <a href="https://conniku.com" style={{ color: '#2D62C8' }}>conniku.com</a></li>
        <li><strong>Correo de contacto:</strong> <a href="mailto:contacto@conniku.com" style={{ color: '#2D62C8' }}>contacto@conniku.com</a></li>
      </ul>

      {/* 2. Datos recopilados */}
      <h2 style={styles.h2}>2. Datos Personales Recopilados</h2>
      <p style={styles.p}>
        Recopilamos las siguientes categorías de datos personales:
      </p>

      <h3 style={styles.h3}>2.1. Datos proporcionados por el usuario</h3>
      <ul style={styles.ul}>
        <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, foto de perfil.</li>
        <li><strong>Datos académicos:</strong> universidad, carrera, año de ingreso.</li>
        <li><strong>Datos de perfil:</strong> biografía, intereses académicos, idiomas.</li>
        <li><strong>Contenido del usuario:</strong> documentos, apuntes y materiales subidos a la plataforma.</li>
      </ul>

      <h3 style={styles.h3}>2.2. Datos recopilados automáticamente</h3>
      <ul style={styles.ul}>
        <li><strong>Datos de uso:</strong> actividad de estudio, tiempo en la plataforma, funcionalidades utilizadas, progreso en rutas de aprendizaje.</li>
        <li><strong>Datos de gamificación:</strong> puntos, rachas de estudio, logros, nivel del usuario.</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, dispositivo utilizado.</li>
        <li><strong>Datos de comunicación:</strong> mensajes enviados a través de la plataforma (entre usuarios y al soporte).</li>
      </ul>

      {/* 3. Finalidad */}
      <h2 style={styles.h2}>3. Finalidad del Tratamiento</h2>
      <p style={styles.p}>
        Utilizamos sus datos personales para las siguientes finalidades:
      </p>
      <ul style={styles.ul}>
        <li><strong>Prestación del servicio:</strong> crear y gestionar su cuenta, procesar sus materiales de estudio y generar contenido personalizado con inteligencia artificial.</li>
        <li><strong>Personalización:</strong> adaptar la experiencia de usuario según sus preferencias académicas, carrera e intereses.</li>
        <li><strong>Gamificación:</strong> gestionar el sistema de puntos, logros, rachas de estudio y clasificaciones.</li>
        <li><strong>Notificaciones:</strong> enviar alertas sobre actividad relevante, recordatorios de estudio, mensajes y actualizaciones del servicio.</li>
        <li><strong>Mejora del servicio:</strong> analizar patrones de uso para mejorar las funcionalidades, corregir errores y desarrollar nuevas herramientas.</li>
        <li><strong>Comunicaciones:</strong> responder consultas de soporte y enviar información sobre cambios en el servicio.</li>
        <li><strong>Seguridad:</strong> prevenir fraude, uso indebido y garantizar la seguridad de la plataforma.</li>
      </ul>

      {/* 4. Base legal */}
      <h2 style={styles.h2}>4. Base Legal del Tratamiento</h2>
      <p style={styles.p}>
        El tratamiento de sus datos personales se fundamenta en las siguientes bases legales,
        conforme a la Ley N° 19.628 sobre Protección de la Vida Privada:
      </p>
      <ul style={styles.ul}>
        <li><strong>Consentimiento del titular (Art. 4°, Ley 19.628):</strong> al crear una cuenta
          y aceptar estos términos, usted consiente expresamente el tratamiento de sus datos para
          las finalidades descritas en esta política.</li>
        <li><strong>Ejecución de un contrato:</strong> el tratamiento es necesario para la prestación
          del servicio contratado por el usuario.</li>
        <li><strong>Interés legítimo:</strong> para la mejora del servicio y la prevención de fraude,
          siempre que no prevalezcan los derechos fundamentales del titular.</li>
      </ul>

      {/* 5. Almacenamiento */}
      <h2 style={styles.h2}>5. Almacenamiento y Seguridad de los Datos</h2>
      <h3 style={styles.h3}>5.1. Ubicación de los servidores</h3>
      <p style={styles.p}>
        Los datos personales son almacenados en servidores ubicados en Estados Unidos de América,
        a través de los siguientes proveedores de infraestructura:
      </p>
      <ul style={styles.ul}>
        <li><strong>Render:</strong> alojamiento del servidor backend y base de datos.</li>
        <li><strong>Vercel:</strong> alojamiento del frontend de la aplicación web.</li>
      </ul>
      <p style={styles.p}>
        La transferencia internacional de datos se realiza con las medidas de seguridad adecuadas
        y conforme a lo establecido en el artículo 5° de la Ley N° 19.628.
      </p>

      <h3 style={styles.h3}>5.2. Medidas de seguridad</h3>
      <p style={styles.p}>
        Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos, incluyendo:
      </p>
      <ul style={styles.ul}>
        <li>Cifrado de datos en tránsito mediante protocolo HTTPS/TLS.</li>
        <li>Almacenamiento seguro de contraseñas mediante algoritmos de hashing.</li>
        <li>Autenticación mediante tokens JWT con expiración.</li>
        <li>Control de acceso basado en roles para datos sensibles.</li>
        <li>Monitoreo continuo de la infraestructura.</li>
      </ul>

      {/* 6. Terceros */}
      <h2 style={styles.h2}>6. Compartición de Datos con Terceros</h2>
      <p style={styles.p}>
        Conniku puede compartir datos personales con los siguientes terceros, exclusivamente para
        las finalidades indicadas:
      </p>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Tercero</th>
            <th style={styles.th}>Finalidad</th>
            <th style={styles.th}>Datos compartidos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.td}><strong>Anthropic</strong></td>
            <td style={styles.td}>Procesamiento de inteligencia artificial (generación de resúmenes, asistente de estudio)</td>
            <td style={styles.td}>Contenido académico proporcionado por el usuario para su procesamiento</td>
          </tr>
          <tr>
            <td style={styles.td}><strong>MercadoPago / PayPal</strong></td>
            <td style={styles.td}>Procesamiento de pagos de suscripciones</td>
            <td style={styles.td}>Datos necesarios para la transacción (no almacenamos datos de tarjetas)</td>
          </tr>
          <tr>
            <td style={styles.td}><strong>Zoho Mail</strong></td>
            <td style={styles.td}>Envío de correos electrónicos transaccionales y de soporte</td>
            <td style={styles.td}>Nombre y correo electrónico</td>
          </tr>
        </tbody>
      </table>
      <p style={styles.p}>
        No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines de
        marketing sin su consentimiento previo y expreso.
      </p>

      {/* 7. Derechos ARCO */}
      <h2 style={styles.h2}>7. Derechos del Titular de los Datos</h2>
      <p style={styles.p}>
        De conformidad con el artículo 12 y siguientes de la Ley N° 19.628, usted tiene los
        siguientes derechos respecto a sus datos personales (derechos ARCO):
      </p>
      <ul style={styles.ul}>
        <li><strong>Acceso:</strong> derecho a solicitar información sobre los datos personales que
          mantenemos sobre usted, su origen y los destinatarios a quienes se han comunicado.</li>
        <li><strong>Rectificación:</strong> derecho a solicitar la corrección de datos personales
          que sean inexactos, erróneos, equívocos o incompletos.</li>
        <li><strong>Cancelación:</strong> derecho a solicitar la eliminación de sus datos personales
          cuando su almacenamiento carezca de fundamento legal o cuando hayan caducado.</li>
        <li><strong>Oposición:</strong> derecho a oponerse al tratamiento de sus datos personales
          cuando la ley lo permita.</li>
      </ul>
      <p style={styles.p}>
        Para ejercer cualquiera de estos derechos, puede enviar una solicitud a{' '}
        <a href="mailto:contacto@conniku.com" style={{ color: '#2D62C8' }}>contacto@conniku.com</a>{' '}
        o a <a href="mailto:ceo@conniku.com" style={{ color: '#2D62C8' }}>ceo@conniku.com</a>,
        indicando claramente su nombre, correo electrónico asociado a la cuenta y el derecho que
        desea ejercer. Responderemos su solicitud en un plazo máximo de 2 días hábiles.
      </p>
      <p style={styles.p}>
        Adicionalmente, puede modificar o eliminar gran parte de sus datos directamente desde la
        configuración de su perfil en la plataforma.
      </p>

      {/* 8. Cookies */}
      <h2 style={styles.h2}>8. Cookies y Tecnologías Similares</h2>
      <p style={styles.p}>
        Conniku utiliza las siguientes tecnologías de almacenamiento local:
      </p>
      <ul style={styles.ul}>
        <li><strong>localStorage:</strong> para almacenar el token de autenticación (JWT), preferencias
          de tema visual y estado de sesión del usuario.</li>
        <li><strong>Service Worker:</strong> para habilitar funcionalidades offline y notificaciones
          push como parte de nuestra aplicación web progresiva (PWA).</li>
      </ul>
      <p style={styles.p}>
        No utilizamos cookies de seguimiento de terceros ni tecnologías de rastreo publicitario.
      </p>

      {/* 9. Retención */}
      <h2 style={styles.h2}>9. Retención de Datos</h2>
      <p style={styles.p}>
        Conservamos sus datos personales de acuerdo con los siguientes criterios:
      </p>
      <ul style={styles.ul}>
        <li><strong>Cuenta activa:</strong> mientras su cuenta permanezca activa, conservaremos sus
          datos para la prestación del servicio.</li>
        <li><strong>Post-eliminación:</strong> tras la eliminación de su cuenta, conservaremos sus
          datos en forma anonimizada o agregada por un período de 2 años, exclusivamente para fines
          estadísticos y de mejora del servicio. Los datos que permitan identificarlo serán eliminados
          dentro de los 30 días siguientes a la solicitud de eliminación.</li>
        <li><strong>Obligaciones legales:</strong> ciertos datos podrán conservarse por períodos
          adicionales cuando sea requerido por ley (por ejemplo, registros de facturación conforme
          a la normativa tributaria chilena).</li>
      </ul>

      {/* 10. Menores */}
      <h2 style={styles.h2}>10. Menores de Edad</h2>
      <p style={styles.p}>
        Conniku es un servicio destinado a estudiantes universitarios y está diseñado para personas
        mayores de 16 años. No recopilamos intencionalmente datos de menores de 16 años. Si tomamos
        conocimiento de que hemos recopilado datos de un menor de 16 años sin el consentimiento
        adecuado, procederemos a eliminar dichos datos a la brevedad.
      </p>
      <p style={styles.p}>
        Los usuarios de entre 16 y 18 años declaran contar con la autorización de su representante
        legal para utilizar la plataforma y aceptar esta política.
      </p>

      {/* 11. Cambios */}
      <h2 style={styles.h2}>11. Cambios a esta Política de Privacidad</h2>
      <p style={styles.p}>
        Conniku se reserva el derecho de actualizar esta Política de Privacidad en cualquier momento.
        Las modificaciones serán notificadas a los usuarios a través de la plataforma y/o por correo
        electrónico. La fecha de "Última actualización" al inicio de este documento reflejará la
        fecha del cambio más reciente.
      </p>
      <p style={styles.p}>
        El uso continuado de la plataforma después de la publicación de cambios constituye la
        aceptación de la política modificada.
      </p>

      {/* 12. Contacto */}
      <h2 style={styles.h2}>12. Contacto</h2>
      <p style={styles.p}>
        Para cualquier consulta, solicitud o reclamo relacionado con el tratamiento de sus datos
        personales, puede comunicarse con nosotros a través de:
      </p>
      <ul style={styles.ul}>
        <li>Correo general: <a href="mailto:contacto@conniku.com" style={{ color: '#2D62C8' }}>contacto@conniku.com</a></li>
        <li>Correo del responsable: <a href="mailto:ceo@conniku.com" style={{ color: '#2D62C8' }}>ceo@conniku.com</a></li>
        <li>Sitio web: <a href="https://conniku.com" style={{ color: '#2D62C8' }}>conniku.com</a></li>
      </ul>
      <p style={styles.p}>
        Si considera que sus derechos no han sido debidamente atendidos, puede presentar un reclamo
        ante el Consejo para la Transparencia o los tribunales competentes conforme a la legislación
        chilena vigente.
      </p>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <p style={{ ...styles.p, fontSize: 13, fontStyle: 'italic' }}>
          Esta Política de Privacidad ha sido redactada en conformidad con la Ley N° 19.628 sobre
          Protección de la Vida Privada de la República de Chile.
        </p>
      </div>
    </div>
  )
}
