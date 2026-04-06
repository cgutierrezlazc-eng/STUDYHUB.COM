import React from 'react'
import { useI18n } from '../services/i18n'

interface Props {
  onClose: () => void
}

export default function TermsOfService({ onClose }: Props) {
  const { lang } = useI18n()
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>{lang === 'en' ? 'Terms of Service, Use and Conditions' : lang === 'pt' ? 'Termos de Serviço, Uso e Condições' : lang === 'fr' ? "Conditions Générales d'Utilisation et de Service" : 'Términos de Servicio, Uso y Condiciones'}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Última actualización: Abril 2026 · Versión 2.0</p>

        <div style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--text-secondary)' }}>

          {lang !== 'es' && (
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {lang === 'en' ? 'These terms are written in Spanish as Conniku SpA is incorporated under Chilean law. By creating your account, you accept all terms below in their entirety. An English summary: your data is private; subscriptions auto-renew; Conniku is not an accredited educational institution; certificates are non-academic completion records; all disputes are governed by Chilean law.' :
               lang === 'pt' ? 'Estes termos estão em espanhol conforme a lei chilena. Ao criar sua conta, você aceita todos os termos integralmente. Resumo: seus dados são privados; assinaturas renovam automaticamente; Conniku não é uma instituição educacional acreditada; certificados são constâncias de finalização não acadêmicas.' :
               lang === 'fr' ? "Ces conditions sont en espagnol selon la loi chilienne. En créant votre compte, vous acceptez toutes les conditions intégralement. Résumé: vos données sont privées; les abonnements se renouvellent automatiquement; Conniku n'est pas un établissement d'enseignement accrédité." :
               'These terms are in Spanish (Chilean law). By creating your account, you accept all terms below in their entirety.'}
            </div>
          )}

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 20, fontSize: 13, border: '1px solid var(--border)' }}>
            <strong>AVISO LEGAL IMPORTANTE:</strong> Conniku SpA es una empresa de tecnología con domicilio en Santiago de Chile. <strong>Conniku NO es una institución educativa acreditada, reconocida ni regulada por el Ministerio de Educación de Chile ni por ninguna autoridad educativa nacional o internacional.</strong> Los programas formativos ofrecidos son de carácter interno, complementario y voluntario. Las constancias emitidas no constituyen títulos profesionales, grados académicos ni certificaciones oficiales de ningún tipo.
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 20, fontSize: 13, border: '1px solid var(--border)' }}>
            <strong>PROPIEDAD INTELECTUAL DE LA MARCA:</strong> La marca "Conniku", su logotipo, identidad visual y nombre comercial se encuentran en proceso de registro ante el Instituto Nacional de Propiedad Industrial (INAPI) de Chile, país de origen y constitución de la sociedad. Posteriormente, se procederá al registro en México (IMPI), Argentina (INPI), Brasil (INPI), y progresivamente en todas las jurisdicciones donde la plataforma opere, con el objetivo de obtener protección marcaria global conforme al Protocolo de Madrid y los tratados internacionales aplicables. Todo uso no autorizado de la marca, nombre, logotipo o elementos distintivos de Conniku constituirá una infracción perseguible conforme a la legislación de propiedad industrial e intelectual vigente.
          </div>

          {/* ===== TÍTULO I: DISPOSICIONES GENERALES ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO I — DISPOSICIONES GENERALES</h3>

          <h3>Artículo 1. Aceptación de los Términos</h3>
          <p>1.1. Al crear una cuenta, acceder o utilizar la plataforma Conniku (en adelante, "la Plataforma", "el Servicio" o "Conniku"), el usuario (en adelante, "el Usuario", "usted") acepta de forma íntegra, incondicional e irrevocable los presentes Términos de Servicio, Uso y Condiciones (en adelante, "los Términos"), la Política de Privacidad y todas las políticas complementarias publicadas en la Plataforma.</p>
          <p>1.2. Si el Usuario no está de acuerdo con alguna disposición de estos Términos, debe abstenerse de utilizar la Plataforma y eliminar su cuenta de forma inmediata.</p>
          <p>1.3. El uso continuado de la Plataforma después de la publicación de modificaciones a estos Términos constituye aceptación tácita de dichas modificaciones.</p>
          <p>1.4. Estos Términos constituyen un contrato vinculante entre el Usuario y Conniku SpA, sociedad constituida conforme a las leyes de la República de Chile, con domicilio en Santiago de Chile.</p>

          <h3>Artículo 2. Definiciones</h3>
          <p>A los efectos de estos Términos, se entenderá por:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
            <li><strong>"Plataforma":</strong> El sitio web conniku.com, sus subdominios, aplicaciones móviles, APIs y cualquier servicio digital operado por Conniku SpA.</li>
            <li><strong>"Usuario":</strong> Toda persona natural que cree una cuenta y utilice la Plataforma.</li>
            <li><strong>"Contenido del Usuario":</strong> Todo material subido, publicado o compartido por el Usuario, incluyendo documentos, textos, imágenes, comentarios, mensajes y publicaciones.</li>
            <li><strong>"Contenido de la Plataforma":</strong> Todo material generado por Conniku, incluyendo diseño, código, algoritmos, textos institucionales, material de cursos y respuestas de inteligencia artificial.</li>
            <li><strong>"Constancia":</strong> Documento digital emitido por Conniku Learning que acredita la finalización de un programa formativo interno. No constituye título académico ni certificación oficial.</li>
            <li><strong>"Cuenta":</strong> El perfil personal e intransferible del Usuario en la Plataforma.</li>
            <li><strong>"Plan":</strong> El nivel de suscripción del Usuario (Básico, Pro o Max).</li>
            <li><strong>"Datos Personales":</strong> Toda información que identifique o permita identificar directa o indirectamente a una persona natural.</li>
            <li><strong>"Tutor":</strong> Prestador de servicios independiente, debidamente registrado y aprobado por Conniku, que ofrece servicios de tutoría académica a través de la Plataforma.</li>
            <li><strong>"Sesión de Tutoría":</strong> Clase individual o grupal impartida por un Tutor a través de la Plataforma mediante videollamada.</li>
          </ul>

          <h3>Artículo 3. Descripción del Servicio</h3>
          <p>3.1. Conniku es una plataforma digital colaborativa de estudio universitario que ofrece, entre otras funcionalidades: (a) herramientas de estudio asistidas por inteligencia artificial, incluyendo chat contextual, guías de estudio, quizzes adaptativos y flashcards; (b) red social académica con perfiles, feed de actividad, mensajería y comunidades; (c) cursos de formación en habilidades personales, profesionales y tecnológicas; (d) bolsa de empleo y herramientas de empleabilidad; (e) mentoría entre pares; (f) conferencias en línea con profesionales del mercado laboral; (g) sistema de gamificación con logros, niveles y recompensas; (h) servicios de tutoría académica impartidos por prestadores independientes verificados, facilitados a través de la Plataforma.</p>
          <p>3.2. Conniku se reserva el derecho de modificar, suspender, ampliar o descontinuar cualquier funcionalidad del Servicio sin previo aviso, siempre que no afecte funcionalidades esenciales contratadas en planes de pago durante el período vigente de suscripción.</p>
          <p>3.3. El Servicio se proporciona "tal cual" (as is) y "según disponibilidad" (as available). Conniku no garantiza la disponibilidad ininterrumpida, la ausencia de errores ni la exactitud de los contenidos generados por inteligencia artificial.</p>

          <h3>Artículo 4. Modificaciones a los Términos</h3>
          <p>4.1. Conniku podrá modificar estos Términos en cualquier momento. Las modificaciones sustanciales serán notificadas a los Usuarios con al menos quince (15) días calendario de anticipación mediante correo electrónico y/o notificación dentro de la Plataforma.</p>
          <p>4.2. Si el Usuario no acepta las modificaciones, deberá cesar el uso de la Plataforma y solicitar la eliminación de su cuenta antes de la fecha de entrada en vigor de los nuevos Términos.</p>
          <p>4.3. Las modificaciones menores de carácter administrativo, ortográfico o de clarificación podrán realizarse sin notificación previa.</p>

          {/* ===== TÍTULO II: REGISTRO Y CUENTA ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO II — REGISTRO, CUENTA Y ELEGIBILIDAD</h3>

          <h3>Artículo 5. Requisitos de Elegibilidad</h3>
          <p>5.1. Para utilizar Conniku, el Usuario debe ser mayor de dieciocho (18) años de edad o contar con la autorización expresa y verificable de su representante legal.</p>
          <p>5.2. El Usuario declara y garantiza que la información proporcionada durante el registro es veraz, actual, completa y precisa. La falsedad en los datos de registro constituye incumplimiento contractual y causa de terminación inmediata de la cuenta.</p>
          <p>5.3. Cada persona natural solo podrá mantener una (1) cuenta activa. La creación de cuentas múltiples, duplicadas o fraudulentas está estrictamente prohibida y será sancionada con la suspensión permanente de todas las cuentas asociadas.</p>
          <p>5.4. Está prohibido el uso de direcciones de correo electrónico temporales, desechables o generadas por servicios diseñados para evadir verificación de identidad.</p>

          <h3>Artículo 6. Seguridad de la Cuenta</h3>
          <p>6.1. El Usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso (correo electrónico y contraseña) y de toda actividad que ocurra bajo su cuenta.</p>
          <p>6.2. El Usuario debe notificar a Conniku de forma inmediata ante cualquier uso no autorizado de su cuenta o cualquier brecha de seguridad conocida, a través de soporte@conniku.com.</p>
          <p>6.3. Conniku no será responsable por pérdidas o daños derivados del incumplimiento del Usuario en la protección de sus credenciales de acceso.</p>
          <p>6.4. Conniku implementa medidas de seguridad que incluyen, pero no se limitan a: cifrado de contraseñas mediante algoritmos bcrypt, autenticación por tokens JWT con expiración configurable, limitación de tasa de peticiones (rate limiting), detección de correos desechables, protección contra inyección XSS y CSRF, encabezados de seguridad HTTP (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), y monitoreo automatizado de actividad anómala.</p>

          {/* ===== TÍTULO III: PLANES Y PAGOS ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO III — PLANES, SUSCRIPCIONES Y PAGOS</h3>

          <h3>Artículo 7. Planes de Suscripción</h3>
          <p>7.1. Conniku ofrece tres niveles de acceso:</p>
          <p><strong>a) Plan Básico (Gratuito):</strong> Acceso limitado. Hasta 2 asignaturas activas, 20 consultas de IA cada 6 horas, 300 MB de almacenamiento. Visualización de documentos sin opción de descarga.</p>
          <p><strong>b) Plan Pro (USD $5/mes o USD $39.99/año):</strong> Hasta 8 asignaturas, 200 consultas diarias de IA, 1 GB de almacenamiento, descarga de documentos, exportación a Word (hasta 1,500 palabras), modo socrático, predictor de examen, flashcards FSRS, creación de comunidades, +20% de bonificación en XP.</p>
          <p><strong>c) Plan Max (USD $13/mes o USD $99.99/año):</strong> Todo sin límite. Grabación y transcripción de clases, exportación a Word ilimitada, publicación de empleos, portfolio público, modo noche de examen, historial de asistencia, 3 GB de almacenamiento, +50% de bonificación en XP.</p>
          <p>7.2. Los precios, características y límites de cada plan podrán ser modificados con previo aviso de treinta (30) días calendario. Los cambios no afectarán el período de facturación ya pagado por el Usuario.</p>

          <h3>Artículo 8. Cobros, Facturación y Método de Pago</h3>
          <p>8.1. Los pagos se procesan de forma segura a traves de proveedores certificados (Mercado Pago y PayPal). Conniku no almacena, accede ni procesa directamente datos de tarjetas de credito o debito. Todo procesamiento de pagos cumple con el estandar PCI DSS (Payment Card Industry Data Security Standard). Estos metodos de pago aplican tanto para suscripciones de planes como para la contratacion de servicios de tutoria a traves de la Plataforma.</p>
          <p>8.2. Los precios se expresan en dólares estadounidenses (USD). La conversión a moneda local es aproximada y depende del tipo de cambio aplicado por la entidad emisora de la tarjeta o el procesador de pago del Usuario.</p>
          <p>8.3. <strong>El cobro es automático y recurrente</strong> en ciclos mensuales o anuales según el plan seleccionado. Al suscribirse, el Usuario autoriza de forma expresa cargos automáticos y periódicos a su método de pago registrado.</p>
          <p>8.4. En caso de fallo en el cobro automático, el Usuario dispondrá de un período de gracia de tres (3) días hábiles para actualizar su método de pago. Vencido dicho plazo sin pago exitoso, la cuenta será degradada automáticamente al Plan Básico, sin derecho a reembolso por el período parcial transcurrido.</p>

          <h3>Artículo 9. Cancelación, Reembolsos y Cambio de Plan</h3>
          <p>9.1. El Usuario podrá cancelar su suscripción en cualquier momento desde el panel de configuración de su cuenta. La cancelación será efectiva al finalizar el ciclo de facturación vigente. No se realizarán reembolsos parciales, prorrateados ni proporcionales por el tiempo no utilizado dentro del período ya facturado.</p>
          <p>9.2. En caso de cambio de plan de Pro a Max durante un ciclo de facturación activo, se calculará un pago prorrateado basado en los días calendario restantes del ciclo actual. El Usuario solo pagará la diferencia proporcional.</p>
          <p>9.3. Conniku se reserva el derecho de ofrecer reembolsos discrecionales en casos excepcionales, evaluados individualmente por el equipo de soporte. Estos reembolsos no generan precedente ni derecho futuro.</p>
          <p>9.4. En jurisdicciones donde la ley local establezca períodos de retracto o desistimiento (como el derecho de retracto de 10 días hábiles establecido en la Ley del Consumidor de Chile, Art. 3 bis letra b), estos derechos serán respetados conforme a la legislación aplicable.</p>

          <h3>Artículo 10. Impuestos y Obligaciones Tributarias</h3>
          <p>10.1. Los precios mostrados no incluyen impuestos locales aplicables.</p>
          <p>10.2. En Chile, se aplica el Impuesto al Valor Agregado (IVA) del 19% sobre servicios digitales, conforme a la Ley N° 21.713 y sus modificaciones. El impuesto se calcula sobre el ingreso neto que recibe Conniku después de las comisiones del procesador de pagos.</p>
          <p>10.3. Los usuarios recibirán boleta electrónica o comprobante fiscal conforme a la normativa tributaria del país donde se encuentren registrados, cuando la emisión electrónica esté habilitada.</p>
          <p>10.4. Es responsabilidad exclusiva del Usuario cumplir con sus obligaciones tributarias locales derivadas del uso de la Plataforma.</p>

          {/* ===== TÍTULO IV: RECOMPENSAS ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO IV — PROGRAMA DE RECOMPENSAS, REFERIDOS E INCENTIVOS</h3>

          <h3>Artículo 11. Recompensas por Logros</h3>
          <p>11.1. Conniku otorga beneficios automáticos por el cumplimiento de logros dentro de la Plataforma, incluyendo pero no limitándose a: cumpleaños del Usuario (1 mes de Plan Max), quiz con calificación perfecta (1 mes de Plan Pro), rachas de estudio sostenidas (beneficios proporcionales a la duración), graduación universitaria (2 meses de Plan Max), mentoría completada (1 mes de Plan Max por cada 10 mentorías), y referidos válidos (1 mes de Plan Max por cada 10 referidos verificados).</p>
          <p>11.2. Las recompensas son automáticas, intransferibles, no acumulables con otras promociones salvo indicación expresa, y no canjeables por dinero, crédito ni cualquier otra contraprestación fuera de la Plataforma.</p>
          <p>11.3. Conniku se reserva el derecho de modificar, suspender o eliminar el programa de recompensas con previo aviso de quince (15) días calendario.</p>

          <h3>Artículo 12. Recompensas por Cursos Completados</h3>
          <p>12.1. El Usuario que complete tres (3) cursos obtendrá un (1) mes gratuito del Plan Pro. El Usuario que complete seis (6) cursos obtendrá un (1) mes gratuito del Plan Max.</p>
          <p>12.2. Los cursos completados se acumulan de forma permanente en el perfil del Usuario. Cada curso solo puede contabilizarse una vez para efectos de recompensa.</p>
          <p>12.3. Las condiciones de este programa podrán ser modificadas con previo aviso de quince (15) días.</p>

          <h3>Artículo 13. Programa de Referidos</h3>
          <p>13.1. Cada Usuario recibe un código de referido único e intransferible. Cuando un nuevo Usuario se registra utilizando dicho código y cumple el período de maduración (siete días de actividad real con al menos cinco acciones verificables), ambos reciben los beneficios establecidos por el programa vigente.</p>
          <p>13.2. Conniku utiliza sistemas automatizados de detección de fraude que analizan: dirección IP, dominio de correo electrónico, huella digital del dispositivo (device fingerprinting), patrones de actividad y comportamiento para prevenir el abuso del programa.</p>
          <p>13.3. La creación de cuentas falsas, automatizadas o fraudulentas para obtener beneficios de referidos constituye una violación grave de estos Términos y resultará en la suspensión permanente de la cuenta del infractor, la revocación de todos los beneficios obtenidos y, cuando corresponda, el inicio de acciones legales civiles y penales.</p>

          {/* ===== TÍTULO V: CURSOS Y CONSTANCIAS ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO V — CURSOS, CONSTANCIAS Y CONFERENCIAS</h3>

          <h3>Artículo 14. Naturaleza de los Cursos</h3>
          <p>14.1. Los cursos disponibles en Conniku son programas de formación interna, complementaria y voluntaria, orientados al desarrollo de habilidades personales, profesionales y tecnológicas. Estos programas no forman parte de ningún plan de estudios oficial ni están acreditados por autoridad educativa alguna.</p>
          <p>14.2. Los contenidos de los cursos son elaborados por Conniku con fines informativos y formativos. No sustituyen la formación académica formal ni la asesoría profesional especializada en ningún campo.</p>
          <p>14.3. Conniku no garantiza resultados específicos derivados de la realización de sus cursos, incluyendo pero no limitándose a: obtención de empleo, mejora en calificaciones académicas, desarrollo de competencias medibles o reconocimiento por parte de terceros.</p>

          <h3>Artículo 15. Constancias de Finalización</h3>
          <p>15.1. Las constancias de finalización emitidas por Conniku Learning acreditan exclusivamente que el Usuario ha completado satisfactoriamente un programa formativo interno de la Plataforma.</p>
          <p>15.2. <strong>Las constancias NO confieren crédito académico, título profesional, grado académico, habilitación profesional ni equivalen a certificaciones emitidas por instituciones educativas acreditadas por el Estado en ninguna jurisdicción.</strong></p>
          <p>15.3. Cada constancia incluye un identificador único verificable en conniku.com/validar, que permite a terceros confirmar la autenticidad del documento y los datos del curso completado.</p>
          <p>15.4. El Usuario reconoce y acepta que la presentación de una constancia de Conniku como equivalente a un título académico oficial, certificación profesional o acreditación estatal constituye un acto de su exclusiva responsabilidad, y Conniku queda eximido de toda responsabilidad derivada de dicho uso indebido.</p>

          <h3>Artículo 16. Conferencias en Línea</h3>
          <p>16.1. Conniku organiza periódicamente conferencias en línea con profesionales, directivos, emprendedores y líderes del mercado laboral. Estas conferencias están abiertas a todos los Usuarios registrados, independientemente de su Plan.</p>
          <p>16.2. Las conferencias se realizan a través de plataformas externas como Zoom Video Communications, Inc. Al participar, el Usuario acepta también los términos de servicio de la plataforma de videoconferencia utilizada.</p>
          <p>16.3. Conniku no garantiza la disponibilidad, frecuencia, horario, contenido específico ni la participación de ponentes determinados. La programación de conferencias depende de la disponibilidad de los invitados y de factores operativos.</p>
          <p>16.4. Las conferencias podrán ser grabadas y puestas a disposición de los Usuarios para visualización posterior. Al participar en una conferencia, el Usuario consiente la grabación de su imagen, voz y participación en el chat para fines de archivo y reproducción dentro de la Plataforma.</p>
          <p>16.5. Las opiniones expresadas por los ponentes invitados son personales y no representan necesariamente la posición de Conniku. Conniku no es responsable por el contenido, precisión o idoneidad de la información compartida por terceros durante las conferencias.</p>

          {/* ===== TÍTULO VI: CONTENIDO Y PROPIEDAD INTELECTUAL ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO VI — CONTENIDO, PROPIEDAD INTELECTUAL Y LICENCIAS</h3>

          <h3>Artículo 17. Contenido del Usuario</h3>
          <p>17.1. El Usuario es el único responsable de todo contenido que suba, publique, comparta o transmita a través de la Plataforma, incluyendo documentos académicos, publicaciones, comentarios, mensajes, imágenes y cualquier otro material.</p>
          <p>17.2. Está estrictamente prohibido publicar contenido que: (a) sea ilegal, fraudulento o contrario al orden público; (b) vulnere derechos de propiedad intelectual o industrial de terceros; (c) sea difamatorio, injurioso, discriminatorio, amenazante, obsceno o pornográfico; (d) contenga virus, malware o código malicioso; (e) constituya spam, publicidad no autorizada o engaño; (f) suplante la identidad de otra persona; (g) promueva actividades ilegales o peligrosas.</p>
          <p>17.3. El Usuario declara y garantiza que posee todos los derechos necesarios sobre el contenido que sube a la Plataforma, o que cuenta con las autorizaciones, licencias o permisos correspondientes para su distribución.</p>
          <p>17.4. Conniku se reserva el derecho de moderar, revisar, editar o eliminar cualquier contenido que, a su exclusivo criterio, viole estos Términos, sin necesidad de notificación previa al Usuario infractor.</p>

          <h3>Artículo 18. Propiedad Intelectual de Conniku</h3>
          <p>18.1. La totalidad del código fuente, diseño visual, arquitectura de software, algoritmos, modelos de inteligencia artificial, bases de datos, interfaces de usuario, logotipos, nombres comerciales, marcas (registradas y en proceso de registro), contenido institucional y cualquier otro elemento que compone la Plataforma son propiedad exclusiva de Conniku SpA y están protegidos por las leyes de propiedad intelectual e industrial de Chile y los tratados internacionales aplicables, incluyendo el Convenio de Berna, el Acuerdo sobre los ADPIC (TRIPS) y el Convenio de París.</p>
          <p>18.2. La marca "Conniku", su logotipo, identidad visual y elementos distintivos se encuentran en proceso de registro ante el Instituto Nacional de Propiedad Industrial (INAPI) de Chile. El registro se extenderá progresivamente a México (IMPI), Argentina (INPI), Brasil (INPI) y demás jurisdicciones donde opere la Plataforma, con el objetivo de obtener protección marcaria internacional conforme al Protocolo de Madrid.</p>
          <p>18.3. Queda terminantemente prohibida la reproducción, distribución, modificación, adaptación, traducción, ingeniería inversa, descompilación, copia, extracción de datos (scraping), creación de obras derivadas o cualquier uso no autorizado de la Plataforma o sus elementos, total o parcialmente, sin el consentimiento previo y por escrito de Conniku SpA.</p>
          <p>18.4. Cualquier infracción a los derechos de propiedad intelectual e industrial de Conniku será perseguida conforme a la legislación aplicable, incluyendo la Ley N° 17.336 sobre Propiedad Intelectual de Chile, la Ley N° 19.039 de Propiedad Industrial y las normas equivalentes en las jurisdicciones correspondientes.</p>

          <h3>Artículo 19. Licencia sobre el Contenido del Usuario</h3>
          <p>19.1. El contenido subido por el Usuario sigue siendo de su propiedad. Conniku no reclama titularidad sobre documentos, publicaciones, mensajes ni materiales de estudio del Usuario.</p>
          <p>19.2. Al subir contenido a la Plataforma, el Usuario otorga a Conniku una licencia limitada, no exclusiva, mundial, libre de regalías, sublicenciable y revocable para: (a) almacenar, procesar y mostrar el contenido dentro de la Plataforma; (b) analizar e indexar el contenido para funcionalidades de búsqueda y recomendación; (c) procesar el contenido mediante inteligencia artificial para generar material de estudio personalizado; (d) crear copias de respaldo. Esta licencia es estrictamente funcional y necesaria para la prestación del Servicio.</p>
          <p>19.3. Conniku no utilizará el contenido del Usuario para fines publicitarios, comerciales con terceros ni lo compartirá públicamente. El contenido nunca será asociado a la identidad personal del Usuario en contextos fuera de la Plataforma.</p>

          {/* ===== TÍTULO VII: PRIVACIDAD Y DATOS ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO VII — PRIVACIDAD, PROTECCIÓN DE DATOS Y SEGURIDAD</h3>

          <h3>Artículo 20. Protección de Datos Personales</h3>
          <p>20.1. <strong>La información personal del Usuario es privada y confidencial.</strong> Conniku no comparte, vende, arrienda, cede ni transfiere datos personales a terceros bajo ninguna circunstancia, salvo: (a) cuando medie orden judicial o requerimiento de autoridad competente; (b) cuando sea estrictamente necesario para el procesamiento de pagos a traves de los proveedores autorizados (Mercado Pago y PayPal); (c) cuando el Usuario otorgue consentimiento expreso e informado.</p>
          <p>20.2. Los datos protegidos incluyen, de forma enunciativa y no taxativa: nombre completo, dirección de correo electrónico, universidad, carrera, semestre, régimen académico, datos biográficos, avatar, conversaciones privadas, documentos académicos, historial de actividad, datos de pago, dirección IP y datos de dispositivo.</p>
          <p>20.3. Conniku cumple con: (a) la Ley N° 19.628 sobre Protección de la Vida Privada de Chile; (b) la Ley N° 21.096 que consagra la protección de datos personales como garantía constitucional en Chile; (c) el Reglamento General de Protección de Datos (RGPD/GDPR) de la Unión Europea, en cuanto sea aplicable a usuarios europeos; (d) la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México; (e) la Lei Geral de Proteção de Dados (LGPD) de Brasil; (f) la Ley N° 25.326 de Protección de Datos Personales de Argentina; y (g) las regulaciones de protección de datos aplicables en cada jurisdicción donde opera la Plataforma.</p>
          <p>20.4. El Usuario tiene derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales (derechos ARCO) en cualquier momento, mediante solicitud dirigida a privacidad@conniku.com.</p>

          <h3>Artículo 21. Uso de Datos para Inteligencia Artificial</h3>
          <p>21.1. Los documentos académicos subidos por el Usuario son procesados por sistemas de inteligencia artificial para generar respuestas personalizadas, material de estudio, guías, quizzes y flashcards. Este procesamiento es parte esencial del Servicio contratado.</p>
          <p>21.2. Los documentos se almacenan de forma cifrada y segura. Su procesamiento tiene como única finalidad mejorar la experiencia de estudio del Usuario y la calidad general de las respuestas del sistema para todos los Usuarios.</p>
          <p>21.3. Conniku no utiliza los datos personales del Usuario para entrenar modelos de inteligencia artificial de terceros ni para fines distintos a los descritos en estos Términos.</p>

          <h3>Artículo 22. Cookies y Tecnologías de Rastreo</h3>
          <p>22.1. Conniku utiliza cookies esenciales y tecnologías similares para: (a) mantener la sesión del Usuario; (b) recordar preferencias de idioma y tema; (c) analizar el uso de la Plataforma con fines de mejora del servicio; (d) prevenir fraude y abuso.</p>
          <p>22.2. Conniku no utiliza cookies de terceros con fines publicitarios ni comparte datos de navegación con redes publicitarias.</p>

          {/* ===== TÍTULO VIII: CONDUCTA ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO VIII — CONDUCTA DEL USUARIO Y MODERACIÓN</h3>

          <h3>Artículo 23. Normas de Conducta</h3>
          <p>23.1. El Usuario se compromete a utilizar la Plataforma de forma ética, respetuosa y conforme a la ley. Están expresamente prohibidas las siguientes conductas:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
            <li>Acoso, hostigamiento, bullying, intimidación o amenazas hacia otros Usuarios.</li>
            <li>Discriminación por motivos de raza, etnia, género, orientación sexual, religión, nacionalidad, discapacidad o cualquier otra condición.</li>
            <li>Spam, envío masivo de mensajes no solicitados o publicidad no autorizada.</li>
            <li>Suplantación de identidad de otra persona, institución o entidad.</li>
            <li>Manipulación del sistema de gamificación, puntuación, niveles o rankings mediante bots, scripts o cualquier medio automatizado.</li>
            <li>Creación de cuentas múltiples o duplicadas.</li>
            <li>Ingeniería inversa, descompilación o intento de acceso no autorizado a sistemas, servidores o bases de datos de Conniku.</li>
            <li>Compartir credenciales de acceso con terceros o permitir el uso de la cuenta por personas no autorizadas.</li>
            <li>Uso de la Plataforma para fines ilegales, fraudulentos o contrarios a estos Términos.</li>
          </ul>

          <h3>Artículo 24. Moderación y Sanciones</h3>
          <p>24.1. Conniku cuenta con un equipo de moderación y sistemas automatizados de detección de infracciones. Las sanciones se aplican de forma proporcional a la gravedad de la infracción:</p>
          <p><strong>a) Advertencia:</strong> Notificación al Usuario sobre la conducta inapropiada, con requerimiento de cese.</p>
          <p><strong>b) Suspensión temporal:</strong> Inhabilitación de la cuenta por un período de 7 a 90 días, según la gravedad.</p>
          <p><strong>c) Suspensión permanente (baneo):</strong> Eliminación definitiva de la cuenta, sin derecho a reembolso ni a crear nuevas cuentas.</p>
          <p>24.2. Conniku se reserva el derecho de aplicar sanciones sin necesidad de seguir un orden escalonado cuando la gravedad de la infracción lo justifique.</p>
          <p>24.3. El Usuario podrá apelar una sanción mediante solicitud fundamentada dirigida a moderacion@conniku.com dentro de los diez (10) días hábiles siguientes a la notificación de la sanción. La resolución de Conniku será definitiva.</p>

          {/* ===== TÍTULO IX: BOLSA DE EMPLEO ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO IX — BOLSA DE EMPLEO Y SERVICIOS DE TERCEROS</h3>

          <h3>Artículo 25. Bolsa de Empleo</h3>
          <p>25.1. Conniku facilita la conexión entre estudiantes y empleadores a través de su funcionalidad de bolsa de empleo. Conniku actúa exclusivamente como intermediario tecnológico y no garantiza empleo, remuneración ni condiciones laborales específicas.</p>
          <p>25.2. Las ofertas de empleo publicadas por reclutadores son de exclusiva responsabilidad de estos. Conniku verifica la identidad de los reclutadores, pero no se responsabiliza por la veracidad, legalidad ni condiciones de las ofertas publicadas.</p>
          <p>25.3. La información del CV y perfil profesional compartida con reclutadores depende de la configuración de privacidad del Usuario (público, solo reclutadores verificados, solo amigos o privado).</p>
          <p>25.4. Conniku no es parte en ninguna relación laboral, contractual o comercial que surja entre el Usuario y un empleador a través de la Plataforma.</p>

          <h3>Artículo 26. Enlaces y Servicios de Terceros</h3>
          <p>26.1. La Plataforma puede contener enlaces a sitios web, aplicaciones o servicios operados por terceros (incluyendo Mercado Pago, PayPal, Zoom, Google y otros). Conniku no controla, respalda ni asume responsabilidad por el contenido, políticas de privacidad ni prácticas de dichos terceros.</p>
          <p>26.2. El uso de servicios de terceros está sujeto a los términos y condiciones propios de cada proveedor. El Usuario asume la responsabilidad de revisar dichos términos.</p>

          {/* ===== TÍTULO X: SERVICIOS DE TUTORÍA Y PRESTADORES EXTERNOS ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO X — SERVICIOS DE TUTORÍA Y PRESTADORES EXTERNOS</h3>

          <h3>Artículo 27. Naturaleza de la Relación con Tutores</h3>
          <p>27.1. Los tutores registrados en la Plataforma actúan como prestadores de servicios independientes bajo contrato de prestación de servicios. NO existe relación laboral entre Conniku y los tutores.</p>
          <p>27.2. Conniku actúa únicamente como intermediario tecnológico que facilita la conexión entre estudiantes y tutores.</p>
          <p>27.3. Cada tutor es responsable de cumplir con sus obligaciones tributarias ante el SII, incluyendo la emisión de boletas de honorarios y el pago de la retención correspondiente.</p>

          <h3>Artículo 28. Registro y Aprobación de Tutores</h3>
          <p>28.1. Para ofrecer servicios de tutoría pagados, el postulante debe ser profesional titulado, egresado o alumno de último año de carrera, debidamente acreditado.</p>
          <p>28.2. Documentos requeridos: cédula de identidad, título profesional o certificado de alumno regular, certificado de antecedentes vigente (menos de 30 días), currículum vitae.</p>
          <p>28.3. Conniku verificará la información con las instituciones correspondientes. El proceso de aprobación puede tomar hasta 10 días hábiles.</p>
          <p>28.4. En caso de rechazo, el postulante recibirá el motivo por escrito y tendrá derecho a apelar dentro de 10 días hábiles, presentando documentación adicional.</p>
          <p>28.5. Conniku se reserva el derecho de suspender o revocar la condición de tutor verificado en caso de incumplimiento de estas condiciones.</p>

          <h3>Artículo 29. Comisión y Pagos</h3>
          <p>29.1. Conniku retiene una comisión del 10% sobre el monto total pagado por el estudiante por concepto de intermediación y uso de plataforma.</p>
          <p>29.2. El tutor recibe el 90% restante del monto bruto pagado por el estudiante.</p>
          <p>29.3. El tutor deberá emitir boleta de honorarios a nombre de Conniku SpA por el monto correspondiente al 90% recibido y presentarla a través de la Plataforma.</p>
          <p>29.4. El tutor es íntegramente responsable del pago de la retención de impuestos al SII sobre su boleta de honorarios (actualmente 13.75%).</p>
          <p>29.5. Una vez recibida y validada la boleta de honorarios, Conniku procederá al pago dentro de un plazo máximo de 7 días hábiles.</p>
          <p>29.6. El tutor podrá elegir frecuencia de pago: por clase realizada, quincenal o mensual.</p>
          <p>29.7. Los estudiantes con suscripción MAX vigente tendrán derecho a un descuento del 50% sobre el valor de las clases de tutoría. Este descuento se asume proporcionalmente entre Conniku y el tutor. Al registrarse como tutor, el prestador acepta expresamente esta condición comercial.</p>
          <p>29.8. Los tutores cuya evaluación promedio sea inferior a 4.0 sobre 10.0 (equivalente a 2.0 sobre 5.0) transcurridos seis (6) meses desde su verificación, perderán automáticamente e irrevocablemente el derecho a ejercer como tutor en la Plataforma.</p>

          <h3>Artículo 30. Clases y Obligaciones del Tutor</h3>
          <p>30.1. El tutor deberá crear las sesiones de clase en la Plataforma con descripción detallada del contenido, materiales, duración, precio y disponibilidad horaria.</p>
          <p>30.2. Las clases se realizarán exclusivamente a través de videollamada (Zoom). El tutor es responsable de crear y compartir el enlace.</p>
          <p>30.3. El número máximo de estudiantes por clase grupal es 5. El tutor deberá establecer tarifas diferenciadas para clases individuales y grupales.</p>
          <p>30.4. Si el tutor no se presenta a una clase confirmada y pagada, el estudiante recibirá un reembolso del 100% del monto pagado dentro de 5 a 7 días hábiles.</p>
          <p>30.5. El tutor deberá mantener un estándar de calidad mínimo. Tutores con calificación promedio inferior a 2.5 sobre 5.0 podrán ser suspendidos.</p>
          <p>30.6. El tutor deberá preparar un examen de evaluación para cada sesión o ciclo de sesiones, el cual será habilitado por el tutor al finalizar la clase. El estudiante dispondrá de 60 minutos para completar el examen. La nota mínima de aprobación es 60%. Los resultados serán visibles en el perfil del estudiante y del tutor.</p>
          <p>30.7. El tutor deberá subir el material de apoyo de cada clase a la Plataforma antes o durante la sesión, el cual quedará disponible para el estudiante en su historial de clases.</p>

          <h3>Artículo 31. Derechos y Obligaciones del Estudiante en Servicios de Tutoría</h3>
          <p>31.1. El estudiante deberá confirmar la realización de cada clase dentro de las 48 horas siguientes a su finalización. Transcurrido dicho plazo sin confirmación ni disputa, la clase se considerará realizada satisfactoriamente.</p>
          <p>31.2. El estudiante podrá calificar al tutor al finalizar cada sesión. Las calificaciones serán públicas y visibles en el perfil del tutor.</p>
          <p>31.3. En caso de disputa, el estudiante deberá reportar el problema dentro de las 48 horas posteriores a la clase programada. Conniku actuará como mediador y su decisión será definitiva.</p>
          <p>31.4. El pago del servicio de tutoría se realiza por adelantado a través de la Plataforma. Ningún pago deberá realizarse fuera de la Plataforma.</p>
          <p>31.5. La contratación de servicios fuera de la Plataforma para evadir la comisión de Conniku constituye incumplimiento de estos términos y podrá resultar en la suspensión de ambas cuentas.</p>

          <h3>Artículo 32. Garantía al Estudiante</h3>
          <p>32.1. Conniku garantiza el reembolso del 100% del monto pagado si el tutor no se presenta a la clase confirmada, dentro de 5 a 7 días hábiles.</p>
          <p>32.2. Conniku administrará los fondos pagados por el estudiante hasta que la clase sea confirmada como realizada. Ningún pago será liberado al tutor sin confirmación de la clase.</p>
          <p>32.3. Esta garantía no cubre insatisfacción con la calidad de la clase una vez realizada. Para ello, el sistema de calificaciones permite al estudiante expresar su experiencia.</p>

          <h3>Artículo 33. Contrato de Prestación de Servicios</h3>
          <p>33.1. Todo tutor aprobado deberá firmar digitalmente un Contrato de Prestación de Servicios antes de poder publicar clases.</p>
          <p>33.2. El contrato establecerá: naturaleza independiente de la relación, comisión del 10%, obligaciones tributarias del tutor, código de conducta, cláusula de confidencialidad sobre datos de estudiantes, y política de cancelación.</p>
          <p>33.3. La firma digital tendrá validez legal conforme a la Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de Chile.</p>

          {/* ===== TÍTULO XI: ELIMINACIÓN DE CUENTA ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO XI — ELIMINACIÓN DE CUENTA Y PORTABILIDAD DE DATOS</h3>

          <h3>Artículo 34. Eliminación de Cuenta por el Usuario</h3>
          <p>34.1. El Usuario podrá solicitar la eliminación permanente de su cuenta en cualquier momento desde la sección de Configuración de la Plataforma o mediante solicitud a soporte@conniku.com.</p>
          <p>34.2. La eliminación de la cuenta es <strong>irreversible</strong> y comprende la supresión definitiva de: datos personales, documentos subidos, mensajes, publicaciones, historial de actividad, progreso en cursos, certificados, configuraciones y cualquier otro dato asociado a la cuenta.</p>
          <p>34.3. Las suscripciones activas serán canceladas automáticamente al momento de la eliminación. No se realizarán reembolsos por el período no consumido.</p>
          <p>34.4. La eliminación de datos se ejecutará dentro de un plazo máximo de treinta (30) días calendario. Conniku podrá retener datos anonimizados y no identificables con fines estadísticos y de mejora del servicio.</p>

          <h3>Artículo 35. Portabilidad de Datos</h3>
          <p>35.1. El Usuario tiene derecho a solicitar una copia de todos sus datos personales en un formato estructurado, de uso común y lectura mecánica (derecho a la portabilidad), conforme a la legislación aplicable.</p>
          <p>35.2. La solicitud se realiza desde la sección "Descargar mis datos" en Configuración, o mediante solicitud a privacidad@conniku.com. Los datos serán entregados en un plazo máximo de quince (15) días hábiles.</p>

          {/* ===== TÍTULO XII: RESPONSABILIDAD ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO XII — LIMITACIÓN DE RESPONSABILIDAD, GARANTÍAS E INDEMNIZACIÓN</h3>

          <h3>Artículo 36. Limitación de Responsabilidad</h3>
          <p>36.1. La Plataforma se proporciona "TAL CUAL" (AS IS) y "SEGÚN DISPONIBILIDAD" (AS AVAILABLE), sin garantías de ningún tipo, expresas o implícitas, incluyendo pero no limitándose a garantías de comercialización, idoneidad para un fin particular, no infracción de derechos de terceros, disponibilidad ininterrumpida o ausencia de errores.</p>
          <p>36.2. Conniku no será responsable por daños directos, indirectos, incidentales, especiales, consecuentes, punitivos ni ejemplares que surjan del uso o la imposibilidad de uso de la Plataforma, incluyendo pero no limitándose a: pérdida de datos, pérdida de beneficios, interrupción del negocio, daño a dispositivos o pérdida de oportunidades, aun cuando Conniku haya sido advertido de la posibilidad de tales daños.</p>
          <p>36.3. En ningún caso la responsabilidad total acumulada de Conniku frente al Usuario excederá el monto total efectivamente pagado por el Usuario a Conniku durante los doce (12) meses inmediatamente anteriores al hecho generador de la reclamación, o cien dólares estadounidenses (USD $100), el que sea mayor.</p>
          <p>36.4. Las respuestas generadas por inteligencia artificial son orientativas y pueden contener imprecisiones. Conniku no garantiza la exactitud, completitud ni idoneidad de dichas respuestas. El Usuario asume la responsabilidad de verificar la información proporcionada por el sistema de IA antes de tomar decisiones basadas en ella.</p>

          <h3>Artículo 37. Indemnización</h3>
          <p>37.1. El Usuario se compromete a indemnizar, defender y mantener indemne a Conniku SpA, sus directores, empleados, contratistas, agentes, socios y afiliados frente a cualquier reclamación, demanda, daño, pérdida, costo o gasto (incluyendo honorarios razonables de abogados) que surja de: (a) el uso de la Plataforma por parte del Usuario; (b) el incumplimiento de estos Términos; (c) la violación de derechos de terceros; (d) contenido publicado por el Usuario; (e) el uso indebido de constancias de finalización.</p>

          <h3>Artículo 38. Fuerza Mayor</h3>
          <p>38.1. Conniku no será responsable por el incumplimiento de sus obligaciones cuando dicho incumplimiento sea consecuencia de eventos de fuerza mayor o caso fortuito, incluyendo pero no limitándose a: desastres naturales, pandemias, guerras, actos de terrorismo, fallas en infraestructura de internet, ataques cibernéticos, acciones gubernamentales, huelgas o cualquier otro evento fuera del control razonable de Conniku.</p>

          {/* ===== TÍTULO XIII: RESOLUCIÓN DE CONTROVERSIAS ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO XIII — LEY APLICABLE Y RESOLUCIÓN DE CONTROVERSIAS</h3>

          <h3>Artículo 39. Ley Aplicable</h3>
          <p>39.1. Estos Términos se rigen e interpretan conforme a las leyes de la República de Chile, sin consideración a sus normas sobre conflicto de leyes.</p>
          <p>39.2. Para los Usuarios ubicados en jurisdicciones que establezcan normativa imperativa de protección al consumidor, se aplicarán adicionalmente las disposiciones obligatorias de dicha legislación local que no puedan ser excluidas por acuerdo entre las partes.</p>

          <h3>Artículo 40. Resolución de Controversias</h3>
          <p>40.1. Las partes se comprometen a intentar resolver cualquier controversia derivada de estos Términos mediante negociación directa y de buena fe durante un plazo de treinta (30) días calendario contados desde la notificación escrita de la disputa.</p>
          <p>40.2. Si la negociación directa no prospera, las partes podrán someter la controversia a mediación ante el Centro de Arbitraje y Mediación de la Cámara de Comercio de Santiago (CAM Santiago), conforme a su Reglamento de Mediación vigente.</p>
          <p>40.3. En caso de que la mediación no resulte en un acuerdo dentro de los sesenta (60) días siguientes a su inicio, cualquier controversia será sometida a la jurisdicción exclusiva de los Tribunales Ordinarios de Justicia de Santiago de Chile, renunciando las partes expresamente a cualquier otro fuero que pudiera corresponderles.</p>
          <p>40.4. No obstante lo anterior, Conniku podrá solicitar medidas cautelares o provisionales ante cualquier tribunal competente para proteger sus derechos de propiedad intelectual o prevenir daño irreparable, sin necesidad de agotar previamente los procedimientos de negociación o mediación.</p>

          <h3>Artículo 41. Renuncia a Acciones Colectivas</h3>
          <p>41.1. En la máxima medida permitida por la ley aplicable, el Usuario renuncia al derecho de participar en acciones de clase, demandas colectivas o representativas contra Conniku. Toda reclamación deberá ser presentada de forma individual.</p>

          {/* ===== TÍTULO XIV: DISPOSICIONES FINALES ===== */}
          <h3 style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: 6, marginTop: 28 }}>TÍTULO XIV — DISPOSICIONES FINALES</h3>

          <h3>Artículo 42. Divisibilidad</h3>
          <p>42.1. Si alguna disposición de estos Términos fuese declarada nula, inválida o inaplicable por un tribunal competente, las disposiciones restantes mantendrán plena vigencia y efecto. La disposición afectada será modificada en la medida mínima necesaria para hacerla válida y aplicable, preservando la intención original de las partes.</p>

          <h3>Artículo 43. Cesión</h3>
          <p>43.1. El Usuario no podrá ceder, transferir ni sublicenciar sus derechos u obligaciones bajo estos Términos sin el consentimiento previo y por escrito de Conniku.</p>
          <p>43.2. Conniku podrá ceder libremente estos Términos en su totalidad en caso de fusión, adquisición, reorganización societaria o venta de la totalidad o parte sustancial de sus activos, notificando al Usuario con quince (15) días de anticipación.</p>

          <h3>Artículo 44. Renuncia</h3>
          <p>44.1. La omisión o demora de Conniku en ejercer cualquier derecho o acción bajo estos Términos no constituirá renuncia a dicho derecho ni limitará su ejercicio futuro.</p>

          <h3>Artículo 45. Integridad del Acuerdo</h3>
          <p>45.1. Estos Términos, junto con la Política de Privacidad y las políticas complementarias publicadas en la Plataforma, constituyen el acuerdo íntegro entre el Usuario y Conniku SpA respecto al uso de la Plataforma, y reemplazan cualquier acuerdo, comunicación o entendimiento previo, oral o escrito, sobre el mismo objeto.</p>

          <h3>Artículo 46. Idioma</h3>
          <p>46.1. La versión en español de estos Términos es la versión oficial y prevalecerá en caso de discrepancia con cualquier traducción proporcionada con fines informativos.</p>

          <h3>Artículo 47. Supervivencia</h3>
          <p>47.1. Las disposiciones relativas a propiedad intelectual (Artículos 17-19), limitación de responsabilidad (Artículos 36-38), indemnización (Artículo 37), ley aplicable y resolución de controversias (Artículos 39-41) sobrevivirán a la terminación de la relación entre el Usuario y Conniku, cualquiera sea la causa de dicha terminación.</p>

          <h3>Artículo 48. Notificaciones</h3>
          <p>48.1. Las notificaciones de Conniku al Usuario se realizarán mediante: (a) correo electrónico a la dirección registrada en la cuenta; (b) notificación dentro de la Plataforma; (c) publicación en conniku.com. Se considerará que la notificación fue recibida al momento del envío del correo electrónico o de la publicación en la Plataforma.</p>
          <p>48.2. Las notificaciones del Usuario a Conniku deberán dirigirse a los canales oficiales indicados en el Artículo 49.</p>

          <h3>Artículo 49. Contacto</h3>
          <p>Para consultas sobre estos Términos: <strong>legal@conniku.com</strong></p>
          <p>Para soporte técnico: <strong>soporte@conniku.com</strong></p>
          <p>Para temas de privacidad y datos: <strong>privacidad@conniku.com</strong></p>
          <p>Para apelaciones de moderación: <strong>moderacion@conniku.com</strong></p>
          <p>Para consultas sobre tutoría: <strong>tutores@conniku.com</strong></p>
          <p style={{ marginTop: 16 }}>
            <strong>Conniku SpA</strong><br />
            Cristian — Fundador, alma de Conniku y estudiante como tú<br />
            Santiago, Chile<br />
            www.conniku.com
          </p>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            <strong>NOTA DE PROTECCIÓN MARCARIA:</strong> La marca CONNIKU, su logotipo, isologo, identidad visual, tipografías distintivas, paleta cromática institucional, el slogan y todos los elementos gráficos asociados son propiedad de Conniku SpA y se encuentran en proceso de registro ante INAPI (Chile), con extensión programada a IMPI (México), INPI (Argentina), INPI (Brasil) y demás oficinas de propiedad industrial a nivel global. El uso no autorizado será perseguido conforme a la ley. Conniku SpA se reserva todos los derechos no expresamente concedidos en estos Términos.
          </div>

          <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Cristian — Fundador, alma de Conniku y estudiante como tú
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Representante Legal de Conniku SpA
            </p>
          </div>

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
