import React from 'react'
import { useI18n } from '../services/i18n'

interface Props {
  onClose: () => void
}

export default function TermsOfService({ onClose }: Props) {
  const { lang } = useI18n()
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>{lang === 'en' ? 'Terms and Conditions' : lang === 'pt' ? 'Termos e Condições' : lang === 'fr' ? 'Conditions Générales' : 'Términos y Condiciones de Uso'}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Última actualización: Abril 2026</p>

        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>

          {lang !== 'es' && (
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {lang === 'en' ? '📋 These terms are written in Spanish as Conniku SpA operates under Chilean law. By creating your account, you accept all terms below. Key points: your data is private and only you can access it; subscriptions auto-renew; documents are processed to improve the service.' :
               lang === 'pt' ? '📋 Estes termos estão em espanhol conforme a lei chilena. Ao criar sua conta, você aceita todos os termos. Pontos-chave: seus dados são privados; assinaturas renovam automaticamente; documentos são processados para melhorar o serviço.' :
               lang === 'fr' ? "📋 Ces conditions sont en espagnol selon la loi chilienne. En créant votre compte, vous acceptez toutes les conditions. Points clés: vos données sont privées; les abonnements se renouvellent automatiquement." :
               '📋 These terms are in Spanish (Chilean law). By creating your account, you accept all terms below.'}
            </div>
          )}

          <h3>1. Aceptación de los Términos</h3>
          <p>Al crear una cuenta en Conniku, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no utilices la plataforma. Conniku se reserva el derecho de modificar estos términos, notificando a los usuarios con al menos 15 días de anticipación.</p>

          <h3>2. Descripción del Servicio</h3>
          <p>Conniku es una plataforma educativa diseñada para estudiantes universitarios. Ofrece herramientas de estudio (chat de estudio, guías, quizzes, flashcards), red social académica, bolsa de empleo, mentoría, cursos de desarrollo integral y comunidades de estudio.</p>

          <h3>3. Registro y Cuenta</h3>
          <p>Para usar Conniku debes ser mayor de 18 años y proporcionar información veraz. Cada persona puede tener una sola cuenta. El uso de correos electrónicos temporales o desechables está prohibido. Eres responsable de mantener la seguridad de tu contraseña y de toda actividad realizada bajo tu cuenta.</p>

          <h3>4. Planes y Suscripciones</h3>
          <p><strong>Plan Básico (Gratuito):</strong> Acceso limitado. 2 asignaturas, 20 consultas cada 6 horas, 300 MB almacenamiento. Puede visualizar documentos pero no descargarlos.</p>
          <p><strong>Plan Pro ($5 USD/mes o $39.99 USD/año):</strong> 8 asignaturas, 200 consultas diarias, 1 GB almacenamiento. Puede descargar documentos. Exportar a Word hasta 1,500 palabras por documento. Videos, modo socrático, predictor de examen, flashcards FSRS, crear comunidades. +20% XP bonus.</p>
          <p><strong>Plan Max ($13 USD/mes o $99.99 USD/año):</strong> Todo ilimitado. Grabar y transcribir clases, exportar Word sin límite, publicar empleos, portfolio público, modo noche de examen, historial de asistencia. 3 GB almacenamiento. +50% XP bonus.</p>

          <h3>5. Cobros y Facturación</h3>
          <p>Los pagos se procesan de forma segura a través de Stripe. Los precios se muestran en dólares estadounidenses (USD) con conversión aproximada a tu moneda local. <strong>El cobro es automático y recurrente</strong> (mensual o anual según el plan elegido). Al suscribirte, autorizas cargos automáticos a tu método de pago registrado en cada ciclo de facturación.</p>
          <p>Si el pago automático falla, tendrás un <strong>período de gracia de 3 días</strong> para actualizar tu método de pago. Transcurridos los 3 días sin pago exitoso, tu cuenta se degradará automáticamente al Plan Básico.</p>
          <p>Puedes cancelar tu suscripción en cualquier momento desde tu panel de suscripción. La cancelación es efectiva al final del ciclo de facturación actual — no se realizan reembolsos parciales.</p>

          <h3>6. Cambio de Plan (Prorrateao)</h3>
          <p>Si deseas cambiar de Pro a Max durante tu ciclo de facturación, se calculará un pago prorrateado basado en los días restantes del ciclo actual. Solo pagas la diferencia proporcional. Los días del mes se calculan según el mes calendario (28, 29, 30 o 31 días).</p>

          <h3>7. Recompensas y Beneficios Automáticos</h3>
          <p>Conniku otorga beneficios automáticos por logros: cumpleaños (1 mes MAX), quiz perfecto (1 mes PRO), rachas de estudio (7 días a 1 mes según duración), graduación (2 meses MAX), mentoría (1 mes MAX por 10 completadas), referidos (1 mes MAX por 10 referidos válidos), entre otros. Estas recompensas son automáticas y no acumulables con otras promociones.</p>

          <h3>8. Programa de Referidos</h3>
          <p>Cada usuario recibe un código de referido único. Cuando un nuevo usuario se registra con tu código y cumple el período de maduración (7 días de actividad real con al menos 5 acciones verificables), ambos reciben beneficios. Conniku utiliza sistemas de detección de fraude que analizan: dirección IP, correo electrónico, patrones de actividad y comportamiento para prevenir abuso del programa. La creación de cuentas falsas para obtener referidos resultará en la suspensión permanente de la cuenta y pérdida de todos los beneficios.</p>

          <h3>9. Privacidad y Datos Personales</h3>
          <p><strong>Tu información personal es privada y solo tú tienes acceso a ella.</strong> Conniku no comparte, vende ni cede datos personales a terceros bajo ninguna circunstancia. Los datos que protegenmos incluyen: nombre, correo, universidad, carrera, conversaciones, documentos, historial académico, datos de pago y cualquier información proporcionada en tu perfil.</p>
          <p><strong>Uso de documentos para mejorar la IA:</strong> Los documentos que subes a tus asignaturas son procesados para ofrecerte mejores respuestas e interacciones. Este procesamiento es necesario para el funcionamiento del servicio. Los documentos se almacenan de forma segura y se utilizan exclusivamente para mejorar tu experiencia de estudio y la calidad de las respuestas para todos los usuarios. Nunca se comparten públicamente ni se asocian a tu identidad personal.</p>
          <p>Cumplimos con la Ley de Protección de Datos Personales de Chile y las regulaciones aplicables en cada país donde operamos.</p>

          <h3>10. Contenido del Usuario</h3>
          <p>Eres responsable de todo contenido que publiques en Conniku (posts, comentarios, mensajes, documentos). No se permite contenido ilegal, ofensivo, discriminatorio, amenazante o que viole derechos de autor. Conniku se reserva el derecho de moderar y eliminar contenido que viole estas normas.</p>

          <h3>11. Propiedad Intelectual</h3>
          <p>El contenido que subes sigue siendo de tu propiedad. Conniku no reclama propiedad sobre tus documentos, publicaciones o materiales de estudio. Al subir contenido, nos otorgas una licencia limitada, no exclusiva y revocable para procesarlo con fines de proporcionarte el servicio (análisis, indexación para búsqueda, generación de material de estudio).</p>
          <p>El código, diseño, marca y funcionalidades de Conniku son propiedad exclusiva de Conniku SpA. Queda prohibida su reproducción sin autorización.</p>

          <h3>12. Cursos y Certificados</h3>
          <p>Los cursos de Desarrollo Integral de Conniku son gratuitos e incluidos en todos los planes. Los certificados emitidos son verificables y acreditan la completación del curso, pero no constituyen títulos académicos oficiales. Cada certificado incluye un ID único de verificación.</p>

          <h3>13. Bolsa de Empleo</h3>
          <p>Conniku facilita la conexión entre estudiantes y empleadores pero no garantiza empleo. Los reclutadores son verificados por nuestro equipo. Conniku no es responsable de las condiciones laborales ofrecidas por terceros. La información compartida con reclutadores depende de la configuración de privacidad del CV del usuario (público, solo reclutadores verificados, solo amigos o privado).</p>

          <h3>14. Seguridad</h3>
          <p>Conniku implementa medidas de seguridad que incluyen: cifrado de contraseñas con bcrypt, tokens JWT con expiración, rate limiting para prevenir abuso, detección de correos desechables, protección contra XSS y CSRF, headers de seguridad (HSTS, CSP, X-Frame-Options), y monitoreo de actividad sospechosa. Los pagos son procesados por Stripe y cumplen con PCI DSS — Conniku nunca almacena datos de tarjetas de crédito.</p>

          <h3>15. Conducta del Usuario</h3>
          <p>Los usuarios deben mantener un trato respetuoso con la comunidad. Están prohibidos: el acoso, el spam, la suplantación de identidad, la manipulación del sistema de gamificación, la creación de cuentas múltiples, y cualquier actividad que perjudique la experiencia de otros usuarios. Las violaciones pueden resultar en advertencia, suspensión temporal o baneó permanente.</p>

          <h3>16. Eliminación de Cuenta</h3>
          <p>Puedes eliminar tu cuenta permanentemente desde Ajustes. Esta acción es irreversible y elimina todos tus datos, documentos, mensajes, publicaciones y progreso. Las suscripciones activas se cancelan automáticamente.</p>

          <h3>17. Limitación de Responsabilidad</h3>
          <p>Conniku se proporciona "tal cual". No garantizamos que el servicio esté libre de errores o interrupciones. No somos responsables de pérdida de datos por causas ajenas a nuestro control. La responsabilidad máxima de Conniku está limitada al monto pagado por el usuario en los últimos 12 meses.</p>

          <h3>18. Impuestos</h3>
          <p>Los precios mostrados no incluyen impuestos locales. En Chile, se aplica IVA del 19% sobre servicios digitales (Ley 21.713). El impuesto se calcula sobre el ingreso neto que recibe Conniku después de las comisiones del procesador de pagos. Los usuarios recibirán boleta electrónica cuando la emisión electrónica esté habilitada.</p>

          <h3>19. Ley Aplicable</h3>
          <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia será resuelta por los tribunales ordinarios de justicia de Santiago de Chile.</p>

          <h3>20. Contacto</h3>
          <p>Para consultas sobre estos términos: <strong>legal@conniku.com</strong></p>
          <p>Para soporte técnico: <strong>soporte@conniku.com</strong></p>
          <p>Conniku SpA — Santiago, Chile</p>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onClose}>
            {lang === 'en' ? 'I have read and accept' : lang === 'pt' ? 'Li e aceito' : lang === 'fr' ? "J'ai lu et j'accepte" : 'He leído y acepto'}
          </button>
        </div>
      </div>
    </div>
  )
}
