import React from 'react';
import ppStyles from './PrivacyPolicy.module.css';

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
  jurisdictionBox: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--accent)',
    borderLeft: '4px solid var(--accent)',
    borderRadius: 8,
    padding: '14px 18px',
    marginBottom: 16,
    fontSize: 14,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
};

export default function PrivacyPolicy({ onNavigate }: Props) {
  return (
    <>
      <div className={ppStyles.topProgress}>
        <div className={ppStyles.tpLeft}>
          <span className={ppStyles.pulse} aria-hidden="true" />
          <span>Privacidad</span>
        </div>
        <span>Ley 19.628 · GDPR · LGPD · CCPA</span>
      </div>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => onNavigate('/')}>
          ← Volver
        </button>

        <h1 style={styles.h1}>Política de Privacidad</h1>
        <p style={styles.date}>Última actualización: 20 de abril de 2026 · Versión 2.4</p>

        <p style={styles.p}>
          En Conniku SpA (en adelante, "Conniku", "nosotros" o "la empresa"), nos comprometemos a
          proteger la privacidad y los datos personales de nuestros usuarios conforme a la normativa
          vigente en cada jurisdicción donde operamos:
        </p>
        <div style={styles.infoBox}>
          <strong>Normativa aplicable según jurisdicción:</strong>
          <ul style={{ ...styles.ul, marginBottom: 0, marginTop: 8 }}>
            <li>
              <strong>Chile:</strong> Ley N° 19.628 sobre Protección de la Vida Privada · Ley N°
              21.096
            </li>
            <li>
              <strong>Unión Europea / EEE:</strong> Reglamento General de Protección de Datos (RGPD
              / GDPR) — Reglamento UE 2016/679
            </li>
            <li>
              <strong>Brasil:</strong> Lei Geral de Proteção de Dados Pessoais (LGPD) — Lei N°
              13.709/2018
            </li>
            <li>
              <strong>California, EE.UU.:</strong> California Consumer Privacy Act (CCPA) ·
              California Privacy Rights Act (CPRA)
            </li>
            <li>
              <strong>México:</strong> Ley Federal de Protección de Datos Personales en Posesión de
              los Particulares (LFPDPPP)
            </li>
            <li>
              <strong>Argentina:</strong> Ley N° 25.326 de Protección de Datos Personales
            </li>
          </ul>
        </div>

        {/* 1. Responsable */}
        <h2 style={styles.h2}>1. Responsable del Tratamiento de Datos</h2>
        <p style={styles.p}>El responsable del tratamiento de sus datos personales es:</p>
        <ul style={styles.ul}>
          <li>
            <strong>Razón social:</strong> Conniku SpA
          </li>
          <li>
            <strong>RUT:</strong> 78.395.702-7
          </li>
          <li>
            <strong>Domicilio:</strong> Antofagasta, Chile
          </li>
          <li>
            <strong>Sitio web:</strong>{' '}
            <a href="https://conniku.com" style={{ color: '#2D62C8' }}>
              conniku.com
            </a>
          </li>
          <li>
            <strong>Correo de privacidad:</strong>{' '}
            <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
              privacidad@conniku.com
            </a>
          </li>
          <li>
            <strong>Correo de contacto:</strong>{' '}
            <a href="mailto:contacto@conniku.com" style={{ color: '#2D62C8' }}>
              contacto@conniku.com
            </a>
          </li>
        </ul>
        <p style={styles.p}>
          Para consultas sobre privacidad, ejercicio de derechos y cualquier requerimiento
          relacionado con el tratamiento de sus datos personales, diríjase a{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
            privacidad@conniku.com
          </a>
          .
        </p>

        {/* 2. Datos recopilados */}
        <h2 style={styles.h2}>2. Datos Personales Recopilados</h2>
        <p style={styles.p}>Recopilamos las siguientes categorías de datos personales:</p>

        <h3 style={styles.h3}>2.1. Datos proporcionados por el usuario</h3>
        <ul style={styles.ul}>
          <li>
            <strong>Datos de identificación:</strong> nombre completo, correo electrónico, foto de
            perfil.
          </li>
          <li>
            <strong>Datos académicos:</strong> universidad, carrera, año de ingreso.
          </li>
          <li>
            <strong>Datos de perfil:</strong> biografía, intereses académicos, idiomas.
          </li>
          <li>
            <strong>Contenido del usuario:</strong> documentos, apuntes y materiales subidos a la
            plataforma.
          </li>
          <li>
            <strong>Interacciones con asistentes inteligentes:</strong> mensajes que usted envía al
            chat privado de Athena dentro de sus documentos, selecciones de texto que solicita
            reescribir o analizar, y el historial de dichas interacciones asociado a cada documento.
            Estas interacciones son privadas por usuario: no son visibles para colaboradores del
            mismo documento.
          </li>
          <li>
            <strong>Documentos exportados:</strong> cuando usted solicita exportar un documento de
            Workspaces a PDF o DOCX, el contenido del documento es procesado por nuestros servidores
            para generar un archivo descargable. Ese archivo se entrega a su dispositivo y, una vez
            descargado, queda fuera del control de Conniku: usted es el único responsable de su
            almacenamiento, distribución, copias, respaldo y eliminación posterior.
          </li>
        </ul>

        <h3 style={styles.h3}>2.2. Datos recopilados automáticamente</h3>
        <ul style={styles.ul}>
          <li>
            <strong>Datos de uso:</strong> actividad de estudio, tiempo en la plataforma,
            funcionalidades utilizadas, progreso en rutas de aprendizaje.
          </li>
          <li>
            <strong>Datos de gamificación:</strong> puntos, rachas de estudio, logros, nivel del
            usuario.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo,
            dispositivo utilizado.
          </li>
          <li>
            <strong>Datos de comunicación:</strong> mensajes enviados a través de la plataforma
            (entre usuarios y al soporte).
          </li>
        </ul>

        {/* 3. Finalidad */}
        <h2 style={styles.h2}>3. Finalidad del Tratamiento</h2>
        <p style={styles.p}>Utilizamos sus datos personales para las siguientes finalidades:</p>
        <ul style={styles.ul}>
          <li>
            <strong>Prestación del servicio:</strong> crear y gestionar su cuenta, procesar sus
            materiales de estudio y generar contenido personalizado con tecnologia inteligente.
          </li>
          <li>
            <strong>Asistencia inteligente sobre documentos (Athena):</strong>
            procesar el contenido de los documentos y sus mensajes de chat privado cuando usted
            invoca deliberadamente al asistente Athena, con el fin de devolverle análisis,
            resúmenes, respuestas a preguntas y sugerencias de reescritura sobre fragmentos
            específicos que usted seleccione. El tratamiento se ejecuta únicamente cuando usted
            acciona la función; no opera automáticamente sobre documentos inactivos.
          </li>
          <li>
            <strong>Personalización:</strong> adaptar la experiencia de usuario según sus
            preferencias académicas, carrera e intereses.
          </li>
          <li>
            <strong>Gamificación:</strong> gestionar el sistema de puntos, logros, rachas de estudio
            y clasificaciones.
          </li>
          <li>
            <strong>Notificaciones:</strong> enviar alertas sobre actividad relevante, recordatorios
            de estudio, mensajes y actualizaciones del servicio.
          </li>
          <li>
            <strong>Mejora del servicio:</strong> analizar patrones de uso para mejorar las
            funcionalidades, corregir errores y desarrollar nuevas herramientas.
          </li>
          <li>
            <strong>Comunicaciones:</strong> responder consultas de soporte y enviar información
            sobre cambios en el servicio.
          </li>
          <li>
            <strong>Seguridad:</strong> prevenir fraude, uso indebido y garantizar la seguridad de
            la plataforma.
          </li>
        </ul>

        {/* 4. Base legal */}
        <h2 style={styles.h2}>4. Base Legal del Tratamiento</h2>

        <h3 style={styles.h3}>4.1. Chile — Ley N° 19.628</h3>
        <ul style={styles.ul}>
          <li>
            <strong>Consentimiento del titular (Art. 4°):</strong> al crear una cuenta y aceptar
            esta política, usted consiente expresamente el tratamiento de sus datos.
          </li>
          <li>
            <strong>Ejecución de contrato:</strong> el tratamiento es necesario para la prestación
            del servicio contratado.
          </li>
          <li>
            <strong>Interés legítimo:</strong> para mejora del servicio y prevención de fraude,
            siempre que no prevalezcan los derechos fundamentales del titular.
          </li>
        </ul>

        <h3 style={styles.h3}>4.2. Unión Europea / EEE — GDPR Art. 6(1)</h3>
        <ul style={styles.ul}>
          <li>
            <strong>Consentimiento [Art. 6(1)(a)]:</strong> para comunicaciones de marketing y
            cookies no esenciales.
          </li>
          <li>
            <strong>Ejecución de contrato [Art. 6(1)(b)]:</strong> para la prestación del servicio
            solicitado por el usuario, incluido el procesamiento de los contenidos que usted envía
            explícitamente al asistente Athena (documento, chat privado, selecciones de texto para
            sugerencia) cuando dicha función forma parte del plan contratado.
          </li>
          <li>
            <strong>Obligación legal [Art. 6(1)(c)]:</strong> cuando el tratamiento es requerido por
            ley aplicable.
          </li>
          <li>
            <strong>Interés legítimo [Art. 6(1)(f)]:</strong> para seguridad de la plataforma,
            prevención de fraude y mejora del servicio, siempre que no prevalezcan los derechos del
            interesado.
          </li>
        </ul>

        <h3 style={styles.h3}>4.3. Brasil — LGPD Art. 7°</h3>
        <ul style={styles.ul}>
          <li>
            <strong>Consentimiento [Art. 7°, I]:</strong> para finalidades específicas informadas al
            titular.
          </li>
          <li>
            <strong>Ejecución de contrato [Art. 7°, V]:</strong> cuando sea necesario para el
            cumplimiento del contrato.
          </li>
          <li>
            <strong>Interés legítimo [Art. 7°, IX]:</strong> para finalidades legítimas,
            consideradas las expectativas del titular.
          </li>
        </ul>

        <h3 style={styles.h3}>4.4. California, EE.UU. — CCPA / CPRA</h3>
        <p style={styles.p}>
          Conniku no vende ni comparte información personal con fines de publicidad conductual entre
          empresas. El tratamiento de datos de residentes de California se realiza para las
          finalidades de prestación del servicio y mejora de la experiencia del usuario.
        </p>

        {/* 5. Almacenamiento */}
        <h2 style={styles.h2}>5. Almacenamiento y Seguridad de los Datos</h2>
        <h3 style={styles.h3}>5.1. Ubicación de los servidores</h3>
        <p style={styles.p}>
          Los datos personales son almacenados en servidores ubicados en Estados Unidos de América,
          a través de los siguientes proveedores de infraestructura:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Render:</strong> alojamiento del servidor backend y base de datos.
          </li>
          <li>
            <strong>Vercel:</strong> alojamiento del frontend de la aplicación web.
          </li>
        </ul>
        <p style={styles.p}>
          Las transferencias internacionales de datos (incluyendo desde la UE/EEE) se realizan con
          las salvaguardias adecuadas conforme al GDPR Art. 46, mediante las Cláusulas Contractuales
          Tipo (Standard Contractual Clauses) aprobadas por la Comisión Europea, y en conformidad
          con el Art. 5° de la Ley N° 19.628 de Chile. Ver también la Sección 14 de esta política.
        </p>

        <h3 style={styles.h3}>5.2. Medidas de seguridad</h3>
        <p style={styles.p}>
          Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos,
          incluyendo:
        </p>
        <ul style={styles.ul}>
          <li>Cifrado de datos en tránsito mediante protocolo HTTPS/TLS.</li>
          <li>Almacenamiento seguro de contraseñas mediante algoritmos de hashing (bcrypt).</li>
          <li>Autenticación mediante tokens JWT con expiración.</li>
          <li>Control de acceso basado en roles para datos sensibles.</li>
          <li>Monitoreo continuo de la infraestructura.</li>
          <li>Protección contra XSS, CSRF e inyección SQL.</li>
        </ul>

        <h3 style={styles.h3}>5.3. Procesamiento al exportar documentos</h3>
        <p style={styles.p}>
          Cuando usted solicita exportar un documento de Workspaces a formato PDF o DOCX:
        </p>
        <ul style={styles.ul}>
          <li>
            El contenido del documento se envía a nuestros servidores para ser procesado por
            bibliotecas de generación de archivos (WeasyPrint para PDF, python-docx para DOCX).
          </li>
          <li>
            El contenido es sanitizado por el servidor antes del render: se eliminan scripts,
            manejadores de eventos, iframes, y cualquier elemento ajeno al contenido textual y
            visual autorizado.
          </li>
          <li>
            Las imágenes referenciadas desde dominios externos a Conniku se eliminan del documento
            exportado por razones de seguridad. Las imágenes alojadas en los dominios de Conniku se
            incorporan al archivo como datos binarios (base64), quedando contenidas dentro del
            propio archivo.
          </li>
          <li>
            Los metadatos del archivo DOCX (autor, autor de la última modificación, título) se
            establecen como vacíos para no filtrar la identidad del usuario que exporta. Los
            archivos PDF generados tampoco incluyen metadatos de identidad del usuario.
          </li>
          <li>
            Conniku no conserva una copia del archivo exportado después de entregárselo. El archivo
            se genera en memoria, se envía a su navegador y se descarta.
          </li>
          <li>
            Una vez descargado el archivo en su dispositivo, queda fuera de nuestro control. Si lo
            comparte, lo envía por correo o lo sube a otro servicio, esa difusión y sus
            consecuencias son de su exclusiva responsabilidad.
          </li>
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
              <td style={styles.td}>
                <strong>Anthropic</strong>
              </td>
              <td style={styles.td}>
                Procesamiento automatizado de lenguaje natural para las funciones de asistencia
                inteligente sobre documentos del usuario: generación de resúmenes, análisis de
                documentos, chat privado por documento, sugerencias de reescritura sobre fragmentos
                seleccionados, y otras funciones equivalentes que se incorporen al asistente Athena.
                Anthropic, PBC, con domicilio en San Francisco, California, Estados Unidos. Las
                transferencias internacionales se realizan, cuando corresponda, bajo mecanismos
                contractuales apropiados conforme al artículo 5 de la Ley N° 19.628 de Chile,
                incluyendo Cláusulas Contractuales Tipo aprobadas por la Comisión Europea cuando
                resulten aplicables según la jurisdicción del usuario.
              </td>
              <td style={styles.td}>
                Título y materia del documento, contenido completo del documento cuando usted lo
                envía a analizar, últimos mensajes del chat privado de Athena asociado al documento
                (enviados como contexto en cada consulta, con un máximo de los 10 mensajes más
                recientes), y el texto específico que usted seleccione para pedir una sugerencia de
                reescritura. No se envían contraseñas, tokens de sesión, datos de pago ni metadatos
                de cuenta.
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Supabase</strong>
              </td>
              <td style={styles.td}>
                Autenticación de usuarios y almacenamiento primario de la base de datos relacional
                (PostgreSQL gestionado). Actúa como encargado de tratamiento conforme al artículo 28
                del RGPD y equivalentes de la Ley 19.628.
              </td>
              <td style={styles.td}>
                Credenciales de acceso (contraseña almacenada como hash, nunca en texto plano),
                identificadores únicos de usuario, dirección de correo electrónico, metadatos de
                sesión, y todos los contenidos que la plataforma almacene en la base de datos
                (perfil, documentos, mensajes, registros de actividad).
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Firebase Cloud Messaging (Google)</strong>
              </td>
              <td style={styles.td}>
                Entrega de notificaciones push al navegador y a las aplicaciones móviles, por
                ejemplo recordatorios de suscripción, avisos de mensajes nuevos y alertas operativas
                que usted haya habilitado.
              </td>
              <td style={styles.td}>
                Token único del dispositivo generado por el propio Firebase (identificador técnico
                de entrega), tipo de dispositivo y plataforma. No se envían contenidos sensibles
                dentro del payload de la notificación; los datos completos se consultan solo después
                de que usted abre la aplicación.
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Google OAuth</strong>
              </td>
              <td style={styles.td}>
                Inicio de sesión federado "Entrar con Google" cuando usted decide utilizarlo.
                Permite autenticar sin crear una contraseña separada.
              </td>
              <td style={styles.td}>
                Dirección de correo electrónico asociada a la cuenta Google, nombre público y (si
                usted lo autoriza) foto de perfil. Los permisos solicitados se limitan a los scopes
                "openid", "email" y "profile". Usted puede revocar el acceso en cualquier momento
                desde https://myaccount.google.com/permissions.
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Capacitor (app móvil)</strong>
              </td>
              <td style={styles.td}>
                Empaquetado de la aplicación para iOS y Android. Permite acceder a almacenamiento
                local del dispositivo (equivalente a localStorage del navegador) para funciones
                offline y recordatorios de sesión.
              </td>
              <td style={styles.td}>
                Datos locales del dispositivo: preferencias de interfaz, borradores no
                sincronizados, identificadores de sesión. Estos datos no se envían a terceros;
                residen en el dispositivo y se eliminan al desinstalar la aplicación o desde los
                ajustes del sistema operativo.
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>MercadoPago / PayPal</strong>
              </td>
              <td style={styles.td}>Procesamiento de pagos de suscripciones</td>
              <td style={styles.td}>
                Datos necesarios para la transacción (no almacenamos datos de tarjetas)
              </td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Zoho Mail</strong>
              </td>
              <td style={styles.td}>Envío de correos electrónicos transaccionales y de soporte</td>
              <td style={styles.td}>Nombre y correo electrónico</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Render / Vercel</strong>
              </td>
              <td style={styles.td}>Infraestructura de alojamiento (cloud hosting)</td>
              <td style={styles.td}>
                Todos los datos almacenados en la plataforma (bajo acuerdos de confidencialidad)
              </td>
            </tr>
          </tbody>
        </table>
        <p style={styles.p}>
          <strong>
            Conniku no vende, alquila ni comparte sus datos personales con terceros para fines de
            marketing.
          </strong>{' '}
          Nunca transferimos datos a brokers de datos ni a redes publicitarias.
        </p>
        <p style={styles.p}>
          Adicionalmente, cuando usted exporta un documento a PDF o DOCX, el archivo generado es
          entregado directamente a su dispositivo y no compartido con ningún tercero por parte de
          Conniku.
        </p>

        {/* 7. Derechos ARCO */}
        <h2 style={styles.h2}>7. Derechos del Titular de los Datos (Chile — ARCO)</h2>
        <p style={styles.p}>
          De conformidad con el artículo 12 y siguientes de la Ley N° 19.628, usted tiene los
          siguientes derechos respecto a sus datos personales:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Acceso:</strong> conocer los datos que mantenemos sobre usted, su origen y los
            destinatarios.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos inexactos, erróneos o incompletos.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar la eliminación de sus datos cuando carezcan de
            fundamento legal.
          </li>
          <li>
            <strong>Oposición:</strong> oponerse al tratamiento de sus datos en los casos permitidos
            por la ley.
          </li>
        </ul>
        <p style={styles.p}>
          Para ejercer estos derechos, envíe su solicitud a{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
            privacidad@conniku.com
          </a>
          . Responderemos en un plazo máximo de 2 días hábiles. También puede modificar o eliminar
          gran parte de sus datos directamente desde la configuración de su perfil en la plataforma.
        </p>

        <h3 style={styles.h3}>7.1. Cómo eliminar tu cuenta y tus datos</h3>
        <p style={styles.p}>
          Puedes solicitar la eliminación completa de tu cuenta de Conniku en cualquier momento, de
          forma gratuita, mediante cualquiera de estos métodos:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Desde la app:</strong> Perfil → Configuración → "Zona de peligro" → "Eliminar
            cuenta" → confirma escribiendo "ELIMINAR".
          </li>
          <li>
            <strong>Por correo:</strong> Escribe a{' '}
            <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
              privacidad@conniku.com
            </a>{' '}
            con tu nombre completo y correo registrado.
          </li>
        </ul>
        <p style={styles.p}>
          Los datos identificables se eliminan dentro de los <strong>30 días</strong> siguientes a
          la solicitud. Ciertos datos anonimizados pueden conservarse hasta 2 años con fines
          estadísticos. Para ver las instrucciones completas y la tabla de retención de datos por
          tipo, visita:{' '}
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

        {/* 8. Cookies */}
        <h2 style={styles.h2}>8. Cookies y Tecnologías Similares</h2>
        <p style={styles.p}>
          Conniku utiliza cookies y tecnologías equivalentes (localStorage, sessionStorage,
          IndexedDB y caché del Service Worker de la PWA) exclusivamente para prestar el servicio
          contratado: mantener la sesión del Usuario, recordar sus preferencias y permitir el
          funcionamiento offline. Conniku no utiliza cookies de terceros con fines publicitarios ni
          realiza fingerprinting de dispositivos con fines comerciales.
        </p>
        <p style={styles.p}>
          El detalle íntegro de cada clave de almacenamiento, su categoría, su finalidad, su
          duración y la forma en que el Usuario puede gestionarlas se encuentra en la{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/cookies');
            }}
            style={{ color: '#2D62C8' }}
          >
            Política de Cookies
          </a>
          , documento complementario y vinculante a la presente Política de Privacidad.
        </p>

        {/* 9. Retención */}
        <h2 style={styles.h2}>9. Retención de Datos</h2>
        <p style={styles.p}>
          Conservamos sus datos personales de acuerdo con los siguientes criterios:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Cuenta activa:</strong> mientras su cuenta permanezca activa, conservaremos sus
            datos para la prestación del servicio.
          </li>
          <li>
            <strong>Post-eliminación:</strong> tras la eliminación de su cuenta, conservaremos datos
            anonimizados o agregados por un período de 2 años para fines estadísticos. Los datos
            identificables serán eliminados dentro de los 30 días siguientes a la solicitud.
          </li>
          <li>
            <strong>Historial de chat con Athena:</strong> los mensajes del chat privado de Athena
            asociados a un documento se conservan mientras el documento exista en su cuenta. Al
            eliminar un documento, el historial de chat asociado se elimina en cascada de manera
            automática. Usted también puede borrar manualmente todo el historial de chat de un
            documento desde el propio panel de Athena, sin eliminar el documento. Las sugerencias de
            reescritura resueltas (aplicadas, modificadas o rechazadas) se conservan como registro
            histórico del documento bajo el mismo criterio.
          </li>
          <li>
            <strong>Métricas de uso de Athena:</strong> la tabla interna de cuotas (cantidad de
            consultas diarias al asistente) se conserva por tiempo indefinido en forma de contador
            agregado por usuario, sin el contenido procesado. Esta información se utiliza
            exclusivamente para aplicar los límites por plan descritos en los Términos y
            Condiciones.
          </li>
          <li>
            <strong>Obligaciones legales:</strong> ciertos datos podrán conservarse por períodos
            adicionales cuando sea requerido por ley (registros de facturación, normativa
            tributaria).
          </li>
        </ul>

        {/* 10. Menores */}
        <h2 style={styles.h2}>10. Menores de Edad</h2>
        <p style={styles.p}>
          Conniku es una plataforma exclusiva para personas mayores de 18 años. No recopilamos
          intencionalmente datos personales de personas menores de 18 años. Si tomamos conocimiento
          de que hemos recopilado datos de una persona menor de 18 años sin el consentimiento
          adecuado, procederemos a eliminar dichos datos en un plazo máximo de 72 horas desde la
          confirmación del hecho.
        </p>
        <p style={styles.p}>
          Para usuarios de la Unión Europea: el GDPR Art. 8 permite que algunos Estados miembros
          fijen un umbral de edad mínima para el consentimiento digital inferior a 18 años. Conniku
          aplica 18 años como edad mínima uniforme en todas las jurisdicciones, adoptando la
          restricción más estricta de forma global, independientemente de lo que permita la
          legislación local aplicable.
        </p>

        {/* 11. Cambios */}
        <h2 style={styles.h2}>11. Cambios a esta Política de Privacidad</h2>
        <p style={styles.p}>
          Conniku se reserva el derecho de actualizar esta Política de Privacidad en cualquier
          momento. Las modificaciones sustanciales serán notificadas con al menos 15 días de
          anticipación a través de la plataforma y/o por correo electrónico.
        </p>
        <p style={styles.p}>
          Para usuarios en la UE/EEE: si los cambios implican una nueva finalidad de tratamiento o
          un nuevo fundamento legal distinto al consentimiento, solicitaremos su consentimiento
          expreso antes de aplicar dichos cambios.
        </p>

        {/* 12. Contacto */}
        <h2 style={styles.h2}>12. Contacto y Reclamos</h2>
        <p style={styles.p}>
          Para cualquier consulta, solicitud o reclamo relacionado con sus datos personales:
        </p>
        <ul style={styles.ul}>
          <li>
            Privacidad y datos:{' '}
            <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
              privacidad@conniku.com
            </a>
          </li>
          <li>
            Contacto general:{' '}
            <a href="mailto:contacto@conniku.com" style={{ color: '#2D62C8' }}>
              contacto@conniku.com
            </a>
          </li>
          <li>
            CEO / Responsable:{' '}
            <a href="mailto:ceo@conniku.com" style={{ color: '#2D62C8' }}>
              ceo@conniku.com
            </a>
          </li>
          <li>
            Sitio web:{' '}
            <a href="https://conniku.com" style={{ color: '#2D62C8' }}>
              conniku.com
            </a>
          </li>
        </ul>
        <p style={styles.p}>
          Si no queda satisfecho con nuestra respuesta, puede presentar un reclamo ante la autoridad
          de protección de datos competente en su jurisdicción (ver Sección 13).
        </p>

        {/* 13. Derechos por jurisdicción */}
        <h2 style={styles.h2}>13. Derechos Específicos por Jurisdicción</h2>
        <p style={styles.p}>
          Según su lugar de residencia, usted puede tener derechos adicionales bajo la normativa
          local. En todos los casos, puede ejercerlos escribiendo a{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
            privacidad@conniku.com
          </a>
          .
        </p>

        <div style={styles.jurisdictionBox}>
          <h3 style={{ ...styles.h3, marginTop: 0 }}>
            13.1. Usuarios de la Unión Europea y el EEE — GDPR
          </h3>
          <p style={{ ...styles.p, marginBottom: 8 }}>
            Si reside en la UE o el Espacio Económico Europeo, el Reglamento (UE) 2016/679 (GDPR) le
            otorga los siguientes derechos:
          </p>
          <ul style={styles.ul}>
            <li>
              <strong>Acceso [Art. 15]:</strong> obtener confirmación de si tratamos sus datos y una
              copia de los mismos.
            </li>
            <li>
              <strong>Rectificación [Art. 16]:</strong> rectificar datos inexactos o incompletos.
            </li>
            <li>
              <strong>Supresión / "derecho al olvido" [Art. 17]:</strong> solicitar la eliminación
              de sus datos cuando ya no sean necesarios para la finalidad original, revoque su
              consentimiento, o se opongan ilegítimamente al tratamiento.
            </li>
            <li>
              <strong>Limitación del tratamiento [Art. 18]:</strong> solicitar la restricción del
              tratamiento en determinadas circunstancias.
            </li>
            <li>
              <strong>Portabilidad [Art. 20]:</strong> recibir sus datos en formato estructurado, de
              uso común y legible por máquina, y transmitirlos a otro responsable.
            </li>
            <li>
              <strong>Oposición [Art. 21]:</strong> oponerse al tratamiento basado en interés
              legítimo o para fines de marketing directo.
            </li>
            <li>
              <strong>Decisiones automatizadas [Art. 22]:</strong> no ser objeto de una decisión
              basada únicamente en tratamiento automatizado que produzca efectos jurídicos
              significativos.
            </li>
          </ul>
          <p style={{ ...styles.p, marginBottom: 4 }}>
            <strong>Derecho a reclamar ante autoridad supervisora:</strong> tiene derecho a
            presentar una reclamación ante la Autoridad de Control de su Estado miembro (p.ej.,{' '}
            <a href="https://www.aepd.es" style={{ color: '#2D62C8' }}>
              AEPD
            </a>{' '}
            en España,{' '}
            <a href="https://www.cnil.fr" style={{ color: '#2D62C8' }}>
              CNIL
            </a>{' '}
            en Francia,{' '}
            <a href="https://www.bfdi.bund.de" style={{ color: '#2D62C8' }}>
              BfDI
            </a>{' '}
            en Alemania).
          </p>
          <p style={{ ...styles.p, marginBottom: 0 }}>
            <strong>Plazo de respuesta:</strong> responderemos sus solicitudes en un plazo máximo de
            30 días calendario (prorrogable a 60 días en casos complejos, con notificación previa).
          </p>
        </div>

        <div style={styles.jurisdictionBox}>
          <h3 style={{ ...styles.h3, marginTop: 0 }}>13.2. Usuarios de Brasil — LGPD</h3>
          <p style={{ ...styles.p, marginBottom: 8 }}>
            Si reside en Brasil, la Lei Geral de Proteção de Dados Pessoais (Lei N° 13.709/2018) le
            otorga los siguientes derechos (Art. 18):
          </p>
          <ul style={styles.ul}>
            <li>
              <strong>Confirmação e acesso [Art. 18, I-II]:</strong> confirmar la existencia del
              tratamiento y acceder a sus datos.
            </li>
            <li>
              <strong>Correção [Art. 18, III]:</strong> corregir datos incompletos, inexactos o
              desactualizados.
            </li>
            <li>
              <strong>Anonimização, bloqueio ou eliminação [Art. 18, IV]:</strong> anonimización,
              bloqueo o eliminación de datos innecesarios o tratados en incumplimiento de la LGPD.
            </li>
            <li>
              <strong>Portabilidade [Art. 18, V]:</strong> portabilidad de sus datos a otro
              proveedor, conforme a regulación de la ANPD.
            </li>
            <li>
              <strong>Informação sobre compartilhamento [Art. 18, VI]:</strong> información sobre
              entidades públicas y privadas con las que compartimos datos.
            </li>
            <li>
              <strong>Revogação do consentimento [Art. 18, IX]:</strong> revocar el consentimiento
              en cualquier momento, sin perjuicio del tratamiento previo.
            </li>
            <li>
              <strong>Revisão de decisões automatizadas [Art. 20]:</strong> solicitar revisión de
              decisiones tomadas únicamente con base en tratamiento automatizado.
            </li>
          </ul>
          <p style={{ ...styles.p, marginBottom: 0 }}>
            <strong>Autoridade Nacional:</strong> puede presentar una petición ante la{' '}
            <a href="https://www.gov.br/anpd" style={{ color: '#2D62C8' }}>
              ANPD (Autoridade Nacional de Proteção de Dados)
            </a>
            . Plazo de respuesta: 15 días hábiles.
          </p>
        </div>

        <div style={styles.jurisdictionBox}>
          <h3 style={{ ...styles.h3, marginTop: 0 }}>
            13.3. Residentes de California, EE.UU. — CCPA / CPRA
          </h3>
          <p style={{ ...styles.p, marginBottom: 8 }}>
            Si es residente del Estado de California, la California Consumer Privacy Act (CCPA),
            modificada por la California Privacy Rights Act (CPRA), le otorga los siguientes
            derechos:
          </p>
          <ul style={styles.ul}>
            <li>
              <strong>Right to Know [§1798.100]:</strong> derecho a saber qué categorías e
              información personal específica hemos recopilado, sus fuentes, finalidades y terceros
              con quienes se comparte.
            </li>
            <li>
              <strong>Right to Delete [§1798.105]:</strong> derecho a solicitar la eliminación de su
              información personal, con las excepciones previstas en la ley.
            </li>
            <li>
              <strong>Right to Correct [§1798.106]:</strong> derecho a solicitar la corrección de
              información personal inexacta.
            </li>
            <li>
              <strong>Right to Opt-Out of Sale or Sharing [§1798.120]:</strong> Conniku{' '}
              <strong>no vende ni comparte</strong> información personal con fines de publicidad
              conductual entre empresas. No aplica opt-out activo.
            </li>
            <li>
              <strong>Right to Limit Use of Sensitive PI [§1798.121]:</strong> derecho a limitar el
              uso y divulgación de información personal sensible a los fines autorizados.
            </li>
            <li>
              <strong>Right to Non-Discrimination [§1798.125]:</strong> Conniku no discriminará a
              los usuarios que ejerzan sus derechos CCPA. No se le denegarán servicios, se le
              cobrarán precios diferentes ni se le ofrecerá calidad de servicio inferior por ejercer
              sus derechos.
            </li>
          </ul>
          <p style={{ ...styles.p, marginBottom: 4 }}>
            <strong>Categorías de información personal recopilada (CCPA):</strong> identificadores
            (nombre, correo, IP), información de actividad en internet, datos de geolocalización
            aproximada (a partir de IP), información educativa e historial de uso del servicio.
          </p>
          <p style={{ ...styles.p, marginBottom: 0 }}>
            Para ejercer sus derechos CCPA, contacte a{' '}
            <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
              privacidad@conniku.com
            </a>
            . Puede designar un agente autorizado. Responderemos en un plazo de 45 días (prorrogable
            otros 45 días con notificación). La verificación de identidad puede requerirse.
          </p>
        </div>

        <div style={styles.jurisdictionBox}>
          <h3 style={{ ...styles.h3, marginTop: 0 }}>13.4. Usuarios de México — LFPDPPP</h3>
          <p style={{ ...styles.p, marginBottom: 8 }}>
            Si reside en México, la Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares le otorga los derechos ARCO (Acceso, Rectificación, Cancelación y
            Oposición), ejercibles ante{' '}
            <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
              privacidad@conniku.com
            </a>
            . En caso de inconformidad, puede acudir al{' '}
            <a href="https://www.inai.org.mx" style={{ color: '#2D62C8' }}>
              INAI
            </a>
            .
          </p>
        </div>

        {/* 14. Transferencias internacionales */}
        <h2 style={styles.h2}>14. Transferencias Internacionales de Datos</h2>
        <p style={styles.p}>
          Conniku transfiere datos personales a servidores ubicados en Estados Unidos (Render,
          Vercel, y Anthropic cuando usted invoca funciones de asistencia inteligente). Para
          garantizar la protección de sus datos en estas transferencias:
        </p>
        <ul style={styles.ul}>
          <li>
            <strong>Usuarios de la UE/EEE (GDPR Art. 46):</strong> utilizamos las Cláusulas
            Contractuales Tipo (Standard Contractual Clauses — SCCs) aprobadas por la Comisión
            Europea (Decisión 2021/914) como salvaguardia adecuada. Puede solicitar una copia de
            estas cláusulas escribiendo a privacidad@conniku.com.
          </li>
          <li>
            <strong>Usuarios de Brasil (LGPD Art. 33):</strong> la transferencia internacional se
            realiza con garantías equivalentes de protección, conforme a los mecanismos aprobados
            por la ANPD.
          </li>
          <li>
            <strong>Usuarios de Chile (Ley 19.628 Art. 5°):</strong> la transferencia se realiza con
            medidas adecuadas de seguridad y confidencialidad.
          </li>
        </ul>
        <p style={styles.p}>
          Todos nuestros proveedores de infraestructura cuentan con certificaciones de seguridad
          reconocidas (SOC 2, ISO 27001) y acuerdos de procesamiento de datos (DPA) que les obligan
          a proteger sus datos personales con estándares equivalentes a los exigidos por las
          normativas aplicables.
        </p>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ ...styles.p, fontSize: 13, fontStyle: 'italic' }}>
            Esta Política de Privacidad ha sido redactada en conformidad con la Ley N° 19.628 sobre
            Protección de la Vida Privada (Chile), el Reglamento General de Protección de Datos
            (GDPR, UE 2016/679), la Lei Geral de Proteção de Dados Pessoais (LGPD, Brasil) y la
            California Consumer Privacy Act (CCPA / CPRA, EE.UU.). Versión 2.4 — Abril 2026.
          </p>
        </div>
      </div>
    </>
  );
}
