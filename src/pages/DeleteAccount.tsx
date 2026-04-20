import React from 'react';
import daStyles from './DeleteAccount.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

const styles = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '40px 24px 80px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: 'var(--text-primary, #1a1a1a)',
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
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 32,
    textDecoration: 'none',
  } as React.CSSProperties,
  h1: {
    fontSize: 30,
    fontWeight: 700,
    marginBottom: 8,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  date: {
    fontSize: 14,
    color: 'var(--text-muted)',
    marginBottom: 32,
  } as React.CSSProperties,
  h2: {
    fontSize: 20,
    fontWeight: 600,
    marginTop: 36,
    marginBottom: 12,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  p: {
    fontSize: 15,
    marginBottom: 12,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  stepCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 12,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  } as React.CSSProperties,
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#2D62C8',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
    marginTop: 2,
  } as React.CSSProperties,
  stepContent: {
    flex: 1,
  } as React.CSSProperties,
  stepTitle: {
    fontWeight: 600,
    fontSize: 15,
    color: 'var(--text-primary)',
    marginBottom: 4,
  } as React.CSSProperties,
  stepDesc: {
    fontSize: 14,
    color: 'var(--text-muted)',
  } as React.CSSProperties,
  alertBox: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderLeft: '4px solid #f59e0b',
    borderRadius: 8,
    padding: '14px 18px',
    marginBottom: 20,
    fontSize: 14,
    color: '#78350f',
  } as React.CSSProperties,
  infoBox: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderLeft: '4px solid #2D62C8',
    borderRadius: 8,
    padding: '14px 18px',
    marginBottom: 20,
    fontSize: 14,
    color: '#1e40af',
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
    background: 'var(--bg-secondary)',
  } as React.CSSProperties,
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: 14,
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  emailButton: {
    display: 'inline-block',
    marginTop: 8,
    padding: '10px 20px',
    background: '#2D62C8',
    color: '#fff',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
  } as React.CSSProperties,
};

export default function DeleteAccount({ onNavigate }: Props) {
  return (
    <>
      <div className={daStyles.topProgress}>
        <div className={daStyles.tpLeft}>
          <span className={daStyles.pulse} aria-hidden="true" />
          <span>Eliminar cuenta</span>
        </div>
        <span>Acción permanente · 72h de gracia</span>
      </div>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => onNavigate('/')}>
          ← Volver al inicio
        </button>

        <h1 style={styles.h1}>Eliminar mi cuenta de Conniku</h1>
        <p style={styles.date}>Última actualización: 11 de abril de 2026</p>

        <p style={styles.p}>
          En Conniku SpA respetamos tu derecho a eliminar tu cuenta y tus datos personales en
          cualquier momento. Esta página explica el proceso paso a paso, qué datos se eliminan y
          cuánto tiempo demora.
        </p>

        <div style={styles.alertBox}>
          <strong>Advertencia:</strong> La eliminación de tu cuenta es permanente. Perderás acceso a
          todos tus materiales de estudio, puntos, logros, comunidades y mensajes. Esta acción no se
          puede deshacer.
        </div>

        {/* Método 1: Desde la app */}
        <h2 style={styles.h2}>Opción 1 — Eliminar desde la aplicación</h2>
        <p style={styles.p}>
          Puedes solicitar la eliminación de tu cuenta directamente desde la configuración de tu
          perfil en Conniku:
        </p>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>1</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Inicia sesión en tu cuenta</div>
            <div style={styles.stepDesc}>
              Abre la aplicación Conniku (app móvil o web en conniku.com) e inicia sesión con tu
              correo y contraseña.
            </div>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>2</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Ve a tu Perfil</div>
            <div style={styles.stepDesc}>
              En el menú lateral, haz clic en tu foto de perfil o en "Mi Perfil". En móvil, toca el
              ícono de perfil en la barra inferior.
            </div>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>3</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Accede a Configuración</div>
            <div style={styles.stepDesc}>
              Dentro de tu perfil, busca el botón "Configuración" o el ícono de engranaje (⚙️) en la
              esquina superior derecha.
            </div>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>4</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Selecciona "Eliminar cuenta"</div>
            <div style={styles.stepDesc}>
              Desplázate hacia abajo en Configuración hasta encontrar la sección "Zona de peligro" o
              "Cuenta". Haz clic en "Eliminar cuenta" o "Dar de baja mi cuenta".
            </div>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>5</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Confirma la eliminación</div>
            <div style={styles.stepDesc}>
              Aparecerá un cuadro de confirmación. Escribe "ELIMINAR" para confirmar. Tu solicitud
              quedará registrada y procesada dentro de los 30 días siguientes.
            </div>
          </div>
        </div>

        {/* Método 2: Por correo */}
        <h2 style={styles.h2}>Opción 2 — Solicitar por correo electrónico</h2>
        <p style={styles.p}>
          Si no puedes acceder a la aplicación, puedes solicitar la eliminación de tu cuenta
          enviando un correo a nuestro equipo de privacidad:
        </p>

        <div style={styles.infoBox}>
          <strong>Correo de solicitud:</strong>{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
            privacidad@conniku.com
          </a>
          <br />
          <br />
          <strong>Asunto sugerido:</strong> Solicitud de eliminación de cuenta — [tu correo
          registrado]
          <br />
          <br />
          <strong>Incluye en el correo:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>Tu nombre completo</li>
            <li>El correo electrónico asociado a tu cuenta Conniku</li>
            <li>Confirmación de que deseas eliminar la cuenta permanentemente</li>
          </ul>
          <br />
          <a
            href="mailto:privacidad@conniku.com?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta&body=Nombre%3A%20%0ACorreo%20registrado%3A%20%0A%0ASolicito%20la%20eliminaci%C3%B3n%20permanente%20de%20mi%20cuenta%20de%20Conniku."
            style={styles.emailButton}
          >
            Enviar solicitud por correo
          </a>
        </div>

        {/* Qué sucede */}
        <h2 style={styles.h2}>¿Qué ocurre después de solicitar la eliminación?</h2>
        <p style={styles.p}>
          Una vez recibida tu solicitud, el siguiente proceso aplica a tus datos:
        </p>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tipo de dato</th>
              <th style={styles.th}>¿Se elimina?</th>
              <th style={styles.th}>Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>
                <strong>Nombre, correo, foto de perfil</strong>
              </td>
              <td style={styles.td}>Sí — eliminados permanentemente</td>
              <td style={styles.td}>Dentro de 30 días desde la solicitud</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Materiales de estudio, apuntes y documentos subidos</strong>
              </td>
              <td style={styles.td}>Sí — eliminados permanentemente</td>
              <td style={styles.td}>Dentro de 30 días desde la solicitud</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Mensajes enviados en la plataforma</strong>
              </td>
              <td style={styles.td}>
                Sí — eliminados de tu cuenta; pueden conservarse en la conversación del destinatario
              </td>
              <td style={styles.td}>Dentro de 30 días</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Puntos, logros y gamificación</strong>
              </td>
              <td style={styles.td}>Sí — eliminados permanentemente</td>
              <td style={styles.td}>Dentro de 30 días</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Datos estadísticos agregados (sin identificación personal)</strong>
              </td>
              <td style={styles.td}>Se conservan de forma anonimizada para análisis internos</td>
              <td style={styles.td}>Hasta 2 años (anonimizados, no vinculables a tu identidad)</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Registros de facturación y pago (si aplica)</strong>
              </td>
              <td style={styles.td}>Conservados por obligación legal tributaria (Chile)</td>
              <td style={styles.td}>Hasta 6 años según normativa tributaria chilena</td>
            </tr>
          </tbody>
        </table>

        <div style={styles.infoBox}>
          <strong>Confirmación de eliminación:</strong> Recibirás un correo de confirmación a tu
          dirección registrada cuando la eliminación haya sido procesada. El plazo máximo de
          respuesta es de <strong>30 días corridos</strong> desde la recepción de tu solicitud.
        </div>

        {/* Cancelar eliminación */}
        <h2 style={styles.h2}>¿Puedo cancelar la solicitud?</h2>
        <p style={styles.p}>
          Sí. Si cambiaste de opinión, puedes cancelar tu solicitud de eliminación dentro de los{' '}
          <strong>7 días siguientes</strong> a haberla enviado. Para hacerlo, escribe a{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
            privacidad@conniku.com
          </a>{' '}
          con el asunto "Cancelar solicitud de eliminación de cuenta" desde el mismo correo
          registrado. Pasados los 7 días, el proceso de eliminación es irreversible.
        </p>

        {/* Datos menores */}
        <h2 style={styles.h2}>Eliminación de cuentas de menores</h2>
        <p style={styles.p}>
          Conniku está diseñado para mayores de 16 años. Si eres padre, madre o tutor legal y
          necesitas eliminar la cuenta de un menor de 16 años, contáctanos en{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: '#2D62C8' }}>
            privacidad@conniku.com
          </a>{' '}
          con la documentación correspondiente. Procesaremos la solicitud en un plazo de 5 días
          hábiles.
        </p>

        {/* Contacto */}
        <h2 style={styles.h2}>Contacto</h2>
        <p style={styles.p}>Para cualquier duda sobre el proceso de eliminación de cuenta:</p>
        <ul style={{ paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 15 }}>
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
            Sitio web:{' '}
            <a href="https://conniku.com" style={{ color: '#2D62C8' }}>
              conniku.com
            </a>
          </li>
        </ul>
        <p style={{ ...styles.p, marginTop: 16 }}>
          También puedes consultar nuestra{' '}
          <button
            onClick={() => onNavigate('/privacy')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2D62C8',
              cursor: 'pointer',
              padding: 0,
              fontSize: 15,
              textDecoration: 'underline',
            }}
          >
            Política de Privacidad completa
          </button>{' '}
          para conocer todos tus derechos sobre tus datos personales.
        </p>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Conniku SpA · RUT 78.395.702-7 · Santiago, Chile · privacidad@conniku.com · Versión 1.0
            — Abril 2026
          </p>
        </div>
      </div>
    </>
  );
}
