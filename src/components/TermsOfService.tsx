import React, { useState } from 'react'
import { useI18n } from '../services/i18n'

interface Props {
  onClose: () => void
  showRefundForm?: boolean
}

export default function TermsOfService({ onClose, showRefundForm = false }: Props) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy' | 'refund'>(showRefundForm ? 'refund' : 'tos')
  const [refundForm, setRefundForm] = useState({ reason: '', email: '', details: '' })
  const [refundSent, setRefundSent] = useState(false)

  const handleRefundSubmit = () => {
    // In production, this would send to backend
    setRefundSent(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tos-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Documentos Legales</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="tos-tabs">
          <button className={`tos-tab ${activeTab === 'tos' ? 'active' : ''}`} onClick={() => setActiveTab('tos')}>
            Términos de Uso
          </button>
          <button className={`tos-tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            Privacidad
          </button>
          <button className={`tos-tab ${activeTab === 'refund' ? 'active' : ''}`} onClick={() => setActiveTab('refund')}>
            Reembolso
          </button>
        </div>

        <div className="tos-content">
          {activeTab === 'tos' && (
            <>
              <p><strong>Última actualización: 29 de marzo de 2026</strong></p>

              <h3>1. Aceptación de los Términos</h3>
              <p>Al crear una cuenta y utilizar StudyHub, usted acepta en su totalidad estos Términos de Uso, la Política de Privacidad y la Política de Reembolso. Si no está de acuerdo con alguno de estos términos, no debe utilizar la plataforma. El uso continuado de StudyHub constituye aceptación vinculante de estos términos y cualquier modificación futura.</p>

              <h3>2. Descripción del Servicio</h3>
              <p>StudyHub es una plataforma de estudio interactiva que ofrece herramientas para organizar material académico, interactuar con documentos de estudio, conectar con otros estudiantes y acceder a recursos educativos. StudyHub presta un servicio tecnológico de apoyo al estudio y <strong>no es una institución educativa, no otorga certificaciones, títulos ni créditos académicos</strong>.</p>

              <h3>3. Elegibilidad</h3>
              <p>StudyHub es exclusivamente para mayores de 18 años. Al registrarse, usted declara bajo juramento que tiene al menos 18 años de edad. La plataforma se reserva el derecho de solicitar verificación de identidad y edad en cualquier momento. Cuentas de menores de edad serán eliminadas inmediatamente sin previo aviso.</p>

              <h3>4. Uso Permitido</h3>
              <p>El usuario se compromete a utilizar StudyHub exclusivamente para fines educativos y de estudio legítimos. Está permitido:</p>
              <ul>
                <li>Subir documentos académicos propios o de uso libre para estudio personal</li>
                <li>Interactuar con las herramientas de estudio de la plataforma</li>
                <li>Conectar y comunicarse con otros usuarios de forma respetuosa</li>
                <li>Compartir material educativo que tenga derecho a distribuir</li>
              </ul>

              <h3>5. Conducta Prohibida</h3>
              <p>Queda estrictamente prohibido y resultará en suspensión o eliminación permanente de la cuenta:</p>
              <ul>
                <li>Lenguaje ofensivo, discriminatorio, acosador o amenazante</li>
                <li>Contenido sexual, violento, ilegal o que promueva actividades ilícitas</li>
                <li>Suplantación de identidad o creación de cuentas falsas</li>
                <li>Spam, publicidad no autorizada o actividades comerciales</li>
                <li>Subir material con derechos de autor sin autorización</li>
                <li>Intentar vulnerar la seguridad de la plataforma o de otros usuarios</li>
                <li>Uso de la plataforma para plagio académico</li>
                <li>Compartir credenciales de acceso con terceros</li>
                <li>Cualquier uso que viole leyes locales, nacionales o internacionales</li>
              </ul>

              <h3>6. Moderación y Sanciones</h3>
              <p>StudyHub se reserva el derecho de monitorear, revisar y eliminar cualquier contenido que viole estos términos. El administrador de la plataforma tiene acceso a todo el contenido publicado para fines de moderación y seguridad. Las sanciones incluyen advertencias, suspensión temporal y eliminación permanente de la cuenta sin derecho a reembolso.</p>

              <h3>7. Limitación de Responsabilidad</h3>
              <p><strong>ESTA SECCIÓN ES DE ESPECIAL IMPORTANCIA.</strong> StudyHub se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo, expresas o implícitas. Específicamente:</p>
              <ul>
                <li><strong>Sin garantía académica:</strong> StudyHub no garantiza resultados académicos, calificaciones, aprobación de exámenes ni éxito educativo de ningún tipo. Las herramientas son de apoyo y complemento, no sustituyen el estudio personal ni la enseñanza formal.</li>
                <li><strong>Sin garantía de precisión:</strong> Las respuestas, resúmenes, guías y cualquier contenido generado por la plataforma pueden contener errores, imprecisiones o información desactualizada. Es responsabilidad exclusiva del usuario verificar toda la información antes de utilizarla.</li>
                <li><strong>Sin garantía de disponibilidad:</strong> La plataforma puede experimentar interrupciones, errores técnicos, pérdida de datos o períodos de mantenimiento sin previo aviso.</li>
                <li><strong>Sin responsabilidad por contenido de usuarios:</strong> StudyHub no es responsable del contenido subido, compartido o publicado por sus usuarios en la plataforma.</li>
                <li><strong>Sin responsabilidad por uso indebido:</strong> El uso de la plataforma y la forma en que el usuario aplica la información obtenida es exclusiva responsabilidad del usuario.</li>
              </ul>
              <p>En ningún caso StudyHub, sus propietarios, empleados, afiliados o colaboradores serán responsables por daños directos, indirectos, incidentales, especiales, consecuentes o punitivos que resulten del uso o imposibilidad de uso de la plataforma, incluyendo pero no limitado a: pérdida de datos, pérdida de oportunidades académicas, daño a la reputación, o cualquier otro perjuicio.</p>

              <h3>8. Errores y Limitaciones del Sistema</h3>
              <p>El usuario reconoce y acepta que StudyHub es una plataforma tecnológica que <strong>puede contener errores, bugs, imprecisiones y limitaciones técnicas</strong>. El sistema puede generar respuestas incorrectas, incompletas o fuera de contexto. El usuario acepta que:</p>
              <ul>
                <li>Toda información proporcionada por la plataforma debe ser verificada de forma independiente</li>
                <li>No debe basarse exclusivamente en StudyHub para decisiones académicas importantes</li>
                <li>Los errores del sistema no constituyen causa de reclamo o demanda</li>
                <li>La plataforma es una herramienta de apoyo, no un sustituto del criterio personal</li>
              </ul>

              <h3>9. Responsabilidad del Usuario</h3>
              <p>El usuario es el único y exclusivo responsable de:</p>
              <ul>
                <li>La veracidad de la información proporcionada en su perfil</li>
                <li>El contenido que sube, publica o comparte en la plataforma</li>
                <li>El uso que hace de la información y herramientas proporcionadas por StudyHub</li>
                <li>Las consecuencias académicas, profesionales o personales del uso de la plataforma</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                <li>El cumplimiento de las normas académicas de su institución educativa</li>
                <li>Respetar los derechos de propiedad intelectual de terceros</li>
              </ul>

              <h3>10. Suscripción y Pagos</h3>
              <p>StudyHub ofrece un período de prueba gratuito de 7 días. Después del período de prueba, se requiere una suscripción mensual de USD $20.00. Los pagos se procesan a través de proveedores de pago terceros (Stripe, PayPal). StudyHub no almacena información de tarjetas de crédito directamente. La suscripción se renueva automáticamente cada mes hasta que el usuario la cancele.</p>

              <h3>11. Propiedad Intelectual</h3>
              <p>El código, diseño, marca y tecnología de StudyHub son propiedad exclusiva de sus creadores. El contenido generado por la plataforma para el usuario puede ser utilizado libremente por el usuario para fines personales y académicos. Los documentos subidos por el usuario siguen siendo propiedad del usuario.</p>

              <h3>12. Indemnización</h3>
              <p>El usuario acepta indemnizar, defender y mantener indemne a StudyHub, sus propietarios, directores, empleados y afiliados de cualquier reclamo, demanda, pérdida, responsabilidad, costo o gasto (incluyendo honorarios de abogados) que surja del uso de la plataforma, violación de estos términos, o infracción de derechos de terceros.</p>

              <h3>13. Modificaciones</h3>
              <p>StudyHub se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma. El uso continuado después de la publicación de cambios constituye aceptación de los nuevos términos. Si no está de acuerdo con las modificaciones, debe dejar de usar la plataforma y solicitar la eliminación de su cuenta.</p>

              <h3>14. Legislación Aplicable</h3>
              <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de Santiago de Chile. El usuario renuncia a cualquier jurisdicción que pudiera corresponderle por su domicilio presente o futuro.</p>

              <h3>15. Acuerdo Completo</h3>
              <p>Estos Términos de Uso, junto con la Política de Privacidad y la Política de Reembolso, constituyen el acuerdo completo entre el usuario y StudyHub. Cualquier renuncia a un término no implica renuncia a los demás. Si alguna disposición se considera inválida, las demás permanecen en pleno vigor.</p>
            </>
          )}

          {activeTab === 'privacy' && (
            <>
              <p><strong>Última actualización: 29 de marzo de 2026</strong></p>

              <h3>1. Datos que Recopilamos</h3>
              <p>StudyHub recopila: información de registro (nombre, email, universidad, carrera), documentos subidos por el usuario, historial de interacciones con la plataforma, datos de uso y navegación, e información de pago procesada por terceros.</p>

              <h3>2. Uso de los Datos</h3>
              <p>Los datos se utilizan para: proporcionar y mejorar el servicio, personalizar la experiencia de estudio, moderar contenido, comunicar actualizaciones importantes, y cumplir con obligaciones legales.</p>

              <h3>3. Almacenamiento y Seguridad</h3>
              <p>Los datos se almacenan de forma segura. Sin embargo, ningún sistema es 100% seguro. StudyHub no se hace responsable por brechas de seguridad fuera de su control razonable.</p>

              <h3>4. Compartición de Datos</h3>
              <p>StudyHub no vende datos personales a terceros. Los datos pueden compartirse con: proveedores de pago para procesar transacciones, autoridades legales cuando sea requerido por ley, y servicios técnicos esenciales para el funcionamiento de la plataforma.</p>

              <h3>5. Derechos del Usuario</h3>
              <p>El usuario puede solicitar: acceso a sus datos personales, rectificación de datos incorrectos, eliminación de su cuenta y datos asociados, y portabilidad de sus datos.</p>

              <h3>6. Cookies y Rastreo</h3>
              <p>StudyHub utiliza cookies técnicas necesarias para el funcionamiento de la plataforma. No utilizamos cookies de rastreo publicitario.</p>
            </>
          )}

          {activeTab === 'refund' && (
            <>
              <p><strong>Última actualización: 29 de marzo de 2026</strong></p>

              <h3>Política de Reembolso y Garantía de Satisfacción</h3>

              <h4>Período de Prueba Gratuito</h4>
              <p>StudyHub ofrece 7 días de prueba completamente gratis, sin necesidad de tarjeta de crédito. Durante este período puede explorar todas las funcionalidades de la plataforma sin compromiso alguno.</p>

              <h4>Garantía de Satisfacción — 14 Días</h4>
              <p>Si después de suscribirse no está satisfecho con el servicio, puede solicitar un reembolso completo dentro de los primeros 14 días naturales después de su primer pago. No se requiere justificación, pero agradecemos sus comentarios para mejorar.</p>

              <h4>Condiciones de Reembolso</h4>
              <ul>
                <li><strong>Dentro de 14 días del primer pago:</strong> Reembolso completo sin preguntas</li>
                <li><strong>Después de 14 días:</strong> Se evaluará caso por caso. Si experimenta problemas técnicos graves documentados, se otorgará un crédito proporcional o reembolso.</li>
                <li><strong>Cuentas suspendidas o baneadas:</strong> No aplica reembolso por violación de términos de uso</li>
                <li><strong>Renovaciones automáticas:</strong> Puede solicitar reembolso de renovaciones no deseadas dentro de 48 horas posteriores al cargo</li>
              </ul>

              <h4>Exclusiones</h4>
              <p>No se otorgarán reembolsos en los siguientes casos:</p>
              <ul>
                <li>Cuentas baneadas por violación de términos de uso o conducta prohibida</li>
                <li>Solicitudes realizadas después de 14 días del pago (salvo excepciones técnicas)</li>
                <li>Intentos de abuso del sistema de reembolso (múltiples solicitudes, uso extensivo antes de solicitar reembolso)</li>
                <li>Insatisfacción con resultados académicos (StudyHub no garantiza resultados)</li>
              </ul>

              <h4>Errores y Problemas Técnicos</h4>
              <p>StudyHub reconoce que la plataforma puede presentar errores técnicos, interrupciones del servicio o limitaciones en sus funcionalidades. Si experimenta problemas técnicos persistentes que afecten significativamente su experiencia:</p>
              <ul>
                <li>Contáctenos primero para intentar resolver el problema</li>
                <li>Si el problema no se resuelve en 72 horas, puede solicitar un reembolso proporcional</li>
                <li>Los errores ocasionales o limitaciones documentadas no constituyen causa de reembolso</li>
              </ul>

              <h4>Cómo Solicitar un Reembolso</h4>
              <p>Complete el formulario a continuación o envíe un correo a soporte@studyhub.app indicando su email de registro, fecha de pago y motivo de la solicitud. Los reembolsos se procesan en un plazo de 5-10 días hábiles al método de pago original.</p>

              {!refundSent ? (
                <div className="refund-form">
                  <h4>Formulario de Solicitud de Reembolso</h4>
                  <div className="auth-field">
                    <label>Email de la cuenta</label>
                    <input
                      type="email"
                      value={refundForm.email}
                      onChange={e => setRefundForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="auth-field">
                    <label>Motivo de la solicitud</label>
                    <select
                      value={refundForm.reason}
                      onChange={e => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="form-input"
                    >
                      <option value="">Selecciona un motivo</option>
                      <option value="not_satisfied">No estoy satisfecho con el servicio</option>
                      <option value="technical">Problemas técnicos persistentes</option>
                      <option value="accidental">Cargo accidental o no autorizado</option>
                      <option value="duplicate">Cobro duplicado</option>
                      <option value="cancel_renewal">Cancelar renovación automática</option>
                      <option value="other">Otro motivo</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label>Detalles adicionales (opcional)</label>
                    <textarea
                      value={refundForm.details}
                      onChange={e => setRefundForm(prev => ({ ...prev, details: e.target.value }))}
                      placeholder="Cuéntanos más sobre tu solicitud..."
                      rows={3}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleRefundSubmit}
                    disabled={!refundForm.email || !refundForm.reason}
                  >
                    Enviar Solicitud
                  </button>
                </div>
              ) : (
                <div className="refund-success">
                  <div style={{ fontSize: 48, textAlign: 'center' }}>✅</div>
                  <h4 style={{ textAlign: 'center' }}>Solicitud Enviada</h4>
                  <p style={{ textAlign: 'center' }}>Hemos recibido tu solicitud de reembolso. Te contactaremos en un plazo de 24-48 horas hábiles al email proporcionado.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="tos-footer">
          <button className="btn btn-primary" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  )
}
