import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import spStyles from './SupportPage.module.css';
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  BookOpen,
  Settings,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  FileText,
  GraduationCap,
  Brain,
  Lightbulb,
  Lock,
} from '../components/Icons';

interface Props {
  onNavigate: (path: string) => void;
}

// ─── FAQ Data ───────────────────────────────────────────────────

interface FAQItem {
  q: string;
  a: string;
  tags: string[];
}

const FAQ_SECTIONS: { title: string; icon: React.ReactNode; items: FAQItem[] }[] = [
  {
    title: 'Cuenta y Acceso',
    icon: Lock({ size: 18 }),
    items: [
      {
        q: '¿Cómo creo mi cuenta?',
        a: 'Puedes registrarte con tu correo universitario o con Google desde la página de inicio. El registro es gratuito y solo toma 30 segundos.',
        tags: ['cuenta', 'registro', 'crear'],
      },
      {
        q: '¿Olvidé mi contraseña, ¿cómo la recupero?',
        a: 'Ve a la pantalla de inicio de sesión y presiona "¿Olvidaste tu contraseña?". Recibirás un código de verificación en tu correo para crear una nueva contraseña.',
        tags: ['contraseña', 'recuperar', 'olvidé'],
      },
      {
        q: '¿Puedo cambiar mi correo electrónico?',
        a: 'Actualmente el correo electrónico no se puede cambiar directamente. Escríbenos a contacto@conniku.com y te ayudamos a actualizarlo.',
        tags: ['correo', 'email', 'cambiar'],
      },
      {
        q: '¿Cómo elimino mi cuenta?',
        a: 'Ve a Perfil → Configuración → "Eliminar mi cuenta". Se eliminan todos tus datos de forma permanente. Esta acción no se puede deshacer.',
        tags: ['eliminar', 'borrar', 'cuenta'],
      },
      {
        q: '¿Conniku está disponible en otros idiomas?',
        a: 'Actualmente Conniku está disponible en español. Estamos trabajando en soporte para inglés y portugués.',
        tags: ['idioma', 'inglés', 'portugués'],
      },
    ],
  },
  {
    title: 'Asignaturas y Estudio',
    icon: BookOpen({ size: 18 }),
    items: [
      {
        q: '¿Cuántas asignaturas puedo crear?',
        a: 'Con el plan Free puedes tener hasta 3 asignaturas activas. Con Conniku PRO, las asignaturas son ilimitadas.',
        tags: ['asignaturas', 'límite', 'cuántas'],
      },
      {
        q: '¿Cómo subo documentos a una asignatura?',
        a: 'Abre tu asignatura → pestaña "Documentos" → botón "Subir archivo". Puedes subir PDF, DOCX, PPTX y más. El asistente los analiza automáticamente para generar quizzes, resúmenes y guías.',
        tags: ['documentos', 'subir', 'archivos'],
      },
      {
        q: '¿Qué formatos de archivo acepta Conniku?',
        a: 'PDF, DOCX, PPTX, TXT, y archivos de imagen (JPG, PNG). El tamaño máximo depende de tu plan: 100 MB (Free) o 2 GB (PRO).',
        tags: ['formato', 'archivo', 'pdf', 'docx'],
      },
      {
        q: '¿Los quizzes se generan automáticamente?',
        a: 'Sí. Cuando subes un documento, el asistente puede generar quizzes de selección múltiple basados en el contenido. También puedes pedir quizzes específicos por tema.',
        tags: ['quiz', 'quizzes', 'automático', 'generar'],
      },
      {
        q: '¿Cómo funciona el predictor de exámenes?',
        a: 'Analiza tus documentos y quizzes para predecir los temas con mayor probabilidad de aparecer en tu examen. Disponible con Conniku PRO.',
        tags: ['predictor', 'examen', 'predecir'],
      },
      {
        q: '¿Qué son las flashcards y cómo se usan?',
        a: 'Las flashcards son tarjetas de estudio generadas desde tus documentos. Las revisas con repetición espaciada: el sistema programa las revisiones según tu nivel de dominio.',
        tags: ['flashcards', 'tarjetas', 'repetición'],
      },
    ],
  },
  {
    title: 'Extensión Chrome (Mi Universidad)',
    icon: GraduationCap({ size: 18 }),
    items: [
      {
        q: '¿Qué hace la extensión de Chrome?',
        a: 'Sincroniza automáticamente tus cursos, documentos y calendario desde tu campus virtual (Moodle, Canvas, Blackboard, Brightspace, Sakai) a Conniku.',
        tags: ['extensión', 'chrome', 'campus', 'moodle'],
      },
      {
        q: '¿Es segura? ¿Qué datos recopila?',
        a: 'La extensión solo accede a tu campus virtual cuando tú lo autorizas. Extrae nombres de cursos, documentos y fechas. No accede a tu contraseña del campus ni a datos personales fuera de lo académico.',
        tags: ['seguridad', 'datos', 'privacidad', 'extensión'],
      },
      {
        q: '¿Por qué me sale error al sincronizar?',
        a: 'Posibles causas: (1) Tu sesión en el campus expiró — vuelve a iniciar sesión en tu campus y reintenta. (2) Tu universidad usa una versión antigua del LMS — escríbenos y la revisamos. (3) Problema temporal del servidor — intenta en unos minutos.',
        tags: ['error', 'sincronizar', 'extensión', '500'],
      },
      {
        q: '¿Funciona con mi universidad?',
        a: 'Funciona con Moodle, Canvas, Blackboard, Brightspace y Sakai. Si tu universidad usa otro sistema, escríbenos a contacto@conniku.com para evaluarlo.',
        tags: ['universidad', 'compatible', 'funciona'],
      },
      {
        q: '¿Cómo instalo la extensión?',
        a: 'Descárgala desde la Chrome Web Store (busca "Conniku"). Haz clic en "Agregar a Chrome" y luego inicia sesión con tu cuenta de Conniku desde el popup de la extensión.',
        tags: ['instalar', 'extensión', 'chrome'],
      },
    ],
  },
  {
    title: 'Suscripción y Pagos',
    icon: Star({ size: 18 }),
    items: [
      {
        q: '¿Cuánto cuesta Conniku PRO?',
        a: 'Mensual: $8.990 CLP (~USD $9.49) · Semestral: $39.990 CLP · Anual: $79.990 CLP · Sprint 7 días: $3.490 CLP. Todos los precios incluyen IVA.',
        tags: ['precio', 'costo', 'cuánto', 'pro'],
      },
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Mercado Pago (tarjetas chilenas, Webpay, transferencia), PayPal (tarjetas internacionales, Google Pay). No aceptamos transferencia directa.',
        tags: ['pago', 'método', 'tarjeta', 'webpay'],
      },
      {
        q: '¿Puedo cancelar en cualquier momento?',
        a: 'Sí. Ve a Suscripción → "Gestionar suscripción" → "Cancelar". Tu acceso PRO se mantiene hasta el final del período pagado.',
        tags: ['cancelar', 'suscripción', 'terminar'],
      },
      {
        q: '¿Cómo solicito un reembolso?',
        a: 'Ve a Suscripción → "Solicitar reembolso". Tienes derecho de retracto de 10 días corridos desde la contratación (Art. 3 bis letra b, Ley 19.496). Si el servicio fue completamente ejecutado con tu consentimiento durante ese período, el retracto puede no aplicar. Adicionalmente, ofrecemos 7 días de garantía interna. Respondemos en 5 días hábiles.',
        tags: ['reembolso', 'devolver', 'dinero'],
      },
      {
        q: '¿Qué es el Sprint de 7 días?',
        a: 'Un acceso PRO temporal de 7 días por $3.490 CLP. Ideal para época de exámenes. Máximo 2 sprints por semestre. No se renueva automáticamente.',
        tags: ['sprint', '7 días', 'temporal'],
      },
      {
        q: '¿Hay descuento para grupos?',
        a: 'Sí. Grupos de 3 o más personas reciben 15% de descuento. Escríbenos a contacto@conniku.com con los datos del grupo.',
        tags: ['descuento', 'grupo', 'equipo'],
      },
    ],
  },
  {
    title: 'Biblioteca Virtual',
    icon: FileText({ size: 18 }),
    items: [
      {
        q: '¿De dónde viene el contenido de la Biblioteca?',
        a: 'De fuentes abiertas y legales: Project Gutenberg (libros clásicos), OpenStax (textos universitarios), SciELO (artículos científicos) e Internet Archive. Todo con licencia libre.',
        tags: ['biblioteca', 'fuente', 'contenido', 'libros'],
      },
      {
        q: '¿Puedo descargar los libros?',
        a: 'Puedes leerlos directamente en Conniku. La descarga depende de la licencia del contenido. Contenido de dominio público se puede descargar libremente.',
        tags: ['descargar', 'libro', 'biblioteca'],
      },
      {
        q: '¿Puedo clonar un libro a mi asignatura?',
        a: 'Sí, con Conniku PRO puedes clonar libros de la Biblioteca a tus asignaturas para generar quizzes y resúmenes desde ellos.',
        tags: ['clonar', 'asignatura', 'biblioteca'],
      },
    ],
  },
  {
    title: 'Herramientas de Estudio',
    icon: Brain({ size: 18 }),
    items: [
      {
        q: '¿Cómo funciona el chat de estudio?',
        a: 'Abre una asignatura y usa el chat para hacer preguntas sobre tus documentos. El asistente responde basándose en tu material, no en información genérica.',
        tags: ['chat', 'preguntar', 'asistente'],
      },
      {
        q: '¿Cuántos mensajes puedo enviar por día?',
        a: 'Plan Free: 10 mensajes/día. Conniku PRO: ilimitados. El contador se reinicia a las 6:00 AM hora Chile.',
        tags: ['mensajes', 'límite', 'cuántos', 'día'],
      },
      {
        q: '¿Qué es un mapa conceptual?',
        a: 'Un diagrama visual que conecta los conceptos principales de tu documento. Te ayuda a entender las relaciones entre temas. Disponible con Conniku PRO.',
        tags: ['mapa', 'conceptual', 'diagrama'],
      },
      {
        q: '¿Puedo exportar mis resúmenes?',
        a: 'Con Conniku PRO puedes exportar resúmenes y guías a formato Word (.docx) y PDF.',
        tags: ['exportar', 'word', 'pdf', 'resumen'],
      },
    ],
  },
  {
    title: 'Red Social y Comunidad',
    icon: MessageCircle({ size: 18 }),
    items: [
      {
        q: '¿Cómo agrego amigos?',
        a: 'Ve a la sección "Amigos" → busca por nombre o correo → envía solicitud. También puedes encontrar compañeros en las Comunidades.',
        tags: ['amigos', 'agregar', 'solicitud'],
      },
      {
        q: '¿Qué son las Comunidades?',
        a: 'Grupos de estudiantes organizados por universidad, carrera o interés. Puedes unirte, publicar, compartir documentos y organizar eventos de estudio.',
        tags: ['comunidades', 'grupos', 'unirse'],
      },
      {
        q: '¿El chat es privado?',
        a: 'Sí. Los mensajes directos son privados entre los participantes. Conniku no lee ni analiza tus conversaciones privadas.',
        tags: ['chat', 'privado', 'mensajes'],
      },
    ],
  },
  {
    title: 'Seguridad y Privacidad',
    icon: Shield({ size: 18 }),
    items: [
      {
        q: '¿Conniku vende mis datos?',
        a: 'No. Conniku no vende, comparte ni comercializa tus datos personales con terceros. Cumplimos con la Ley 19.628 de Protección de Datos chilena.',
        tags: ['datos', 'privacidad', 'vender'],
      },
      {
        q: '¿Dónde se almacenan mis datos?',
        a: 'Tus datos se procesan en servidores seguros en Estados Unidos (Render.com y Vercel), bajo acuerdos de procesamiento de datos (DPA) que garantizan protección equivalente. Esta transferencia internacional se realiza con tu consentimiento al registrarte, conforme al Art. 5 de la Ley 19.628. Todas las comunicaciones están cifradas con HTTPS/TLS.',
        tags: ['servidores', 'almacenamiento', 'seguridad'],
      },
      {
        q: '¿Puedo eliminar todos mis datos?',
        a: 'Sí. Ve a Perfil → Configuración → "Eliminar mi cuenta y datos". Se eliminan permanentemente todos tus documentos, mensajes, quizzes y datos personales. Algunos datos pueden retenerse por obligación tributaria hasta por 6 años conforme a la legislación chilena.',
        tags: ['eliminar', 'datos', 'gdpr', 'derecho'],
      },
    ],
  },
];

// ─── Troubleshooting Data ───────────────────────────────────────

const TROUBLESHOOTING: { title: string; icon: React.ReactNode; steps: string[] }[] = [
  {
    title: 'No puedo iniciar sesión',
    icon: Lock({ size: 16 }),
    steps: [
      'Verifica que tu correo esté bien escrito (sin espacios al inicio o final)',
      'Intenta con "¿Olvidaste tu contraseña?" para resetear',
      'Si usas Google, asegúrate de seleccionar la cuenta correcta',
      'Limpia la caché del navegador (Ctrl+Shift+Delete)',
      'Si el problema persiste, escríbenos a contacto@conniku.com',
    ],
  },
  {
    title: 'La página carga lento o no carga',
    icon: AlertTriangle({ size: 16 }),
    steps: [
      'Recarga la página (Ctrl+R o Cmd+R)',
      'Verifica tu conexión a internet',
      'Prueba en modo incógnito (Ctrl+Shift+N)',
      'Limpia la caché del navegador',
      'Si usas VPN, intenta desactivarla temporalmente',
      'Si el problema continúa por más de 10 minutos, puede ser una actualización del servidor — intenta más tarde',
    ],
  },
  {
    title: 'Error al subir un documento',
    icon: FileText({ size: 16 }),
    steps: [
      'Verifica que el archivo sea PDF, DOCX, PPTX o TXT',
      'El archivo no debe superar 100 MB (Free) o 2 GB (PRO)',
      'Si el archivo tiene contraseña, quítala antes de subirlo',
      'Archivos escaneados (imágenes de texto) pueden no procesarse correctamente',
      'Intenta con otro navegador si el error persiste',
    ],
  },
  {
    title: 'El chat no responde o da error',
    icon: MessageCircle({ size: 16 }),
    steps: [
      'Verifica que no hayas alcanzado el límite diario de mensajes (10/día en plan Free)',
      'Si ves "Error 429", espera unos minutos y reintenta',
      'Si ves "Error 503", el servidor está reiniciándose — espera 1-2 minutos',
      'Mensajes muy largos pueden fallar — intenta dividir tu pregunta',
      'Si el error persiste, recarga la página y reintenta',
    ],
  },
  {
    title: 'Error al sincronizar la extensión Chrome',
    icon: GraduationCap({ size: 16 }),
    steps: [
      'Asegúrate de tener sesión activa en tu campus virtual (Moodle, Canvas, etc.)',
      'Cierra y vuelve a abrir el popup de la extensión',
      'Verifica que la extensión tenga permisos para acceder al sitio de tu universidad',
      'Si ves "Error 500", puede ser un problema temporal del servidor — intenta en 5 minutos',
      'Desinstala y reinstala la extensión como último recurso',
    ],
  },
  {
    title: 'No puedo pagar o el pago falló',
    icon: Star({ size: 16 }),
    steps: [
      'Verifica que tu tarjeta tenga fondos suficientes y esté habilitada para compras online',
      'Si usas Mercado Pago, verifica que tu cuenta esté validada',
      'Intenta con otro método de pago (PayPal como alternativa)',
      'Si el cobro se realizó pero tu cuenta sigue en Free, espera 5 minutos y recarga',
      'Si después de 30 minutos no se activa, escríbenos a contacto@conniku.com con tu comprobante',
    ],
  },
  {
    title: 'Los quizzes no se generan',
    icon: Brain({ size: 16 }),
    steps: [
      'Verifica que tu documento tenga texto legible (no solo imágenes)',
      'Documentos muy cortos (menos de 1 página) pueden no generar quizzes',
      'Verifica que no hayas alcanzado el límite semanal (2/semana en plan Free)',
      'Si el documento está en un idioma diferente al español, la calidad puede variar',
      'Intenta con un documento diferente para descartar un problema con el archivo',
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────

export default function SupportPage({ onNavigate }: Props) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedTrouble, setExpandedTrouble] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'troubleshooting' | 'contact' | 'status'>(
    'faq'
  );

  // Contact form
  const [contactName, setContactName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
  );
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactCategory, setContactCategory] = useState('general');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleSendContact = async () => {
    if (
      !contactName.trim() ||
      !contactEmail.trim() ||
      !contactSubject.trim() ||
      !contactMessage.trim()
    ) {
      setSendError('Por favor completa todos los campos.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await api.sendContactForm({
        name: contactName.trim(),
        email: contactEmail.trim(),
        subject: `[${contactCategory.toUpperCase()}] ${contactSubject.trim()}`,
        message: contactMessage.trim(),
      });
      setSent(true);
    } catch (e: any) {
      setSendError(
        e?.message ||
          'Error al enviar. Intenta de nuevo o escribe directamente a contacto@conniku.com'
      );
    } finally {
      setSending(false);
    }
  };

  // Filter FAQ by search
  const filteredFaq = searchQuery.trim()
    ? FAQ_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some((t) => t.includes(searchQuery.toLowerCase()))
        ),
      })).filter((s) => s.items.length > 0)
    : FAQ_SECTIONS;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 8,
    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  });

  return (
    <>
      <div className={spStyles.topProgress}>
        <div className={spStyles.tpLeft}>
          <span className={spStyles.pulse} aria-hidden="true" />
          <span>Soporte</span>
        </div>
        <span>Respuestas rápidas, contacto directo</span>
      </div>
      <div className={spStyles.heroWrap}>
        <h1 className={spStyles.heroH1}>
          Centro de <span className={spStyles.hlCream}>soporte</span>.
        </h1>
        <p className={spStyles.heroLead}>
          Encuentra respuestas en la base de conocimiento, reporta un problema, o contáctanos
          directamente por email.
        </p>
      </div>
      <div className="page-header page-enter">
        <h2>{Info()} Centro de Soporte</h2>
        <p>Encuentra respuestas, soluciona problemas y contáctanos</p>
      </div>
      <div className="page-body" style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Quick Links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: 'Chat con Konni',
              desc: 'Asistente en vivo',
              icon: MessageCircle({ size: 20 }),
              action: () => {
                const btn = document.querySelector(
                  '[data-support-chat-toggle]'
                ) as HTMLButtonElement;
                if (btn) btn.click();
              },
            },
            {
              label: 'Enviar mensaje',
              desc: 'Formulario de contacto',
              icon: Send({ size: 20 }),
              action: () => setActiveTab('contact'),
            },
            {
              label: 'Estado del servicio',
              desc: 'Conniku online',
              icon: CheckCircle({ size: 20 }),
              action: () => setActiveTab('status'),
            },
          ].map((link) => (
            <button
              key={link.label}
              onClick={link.action}
              className="u-card"
              style={{
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                textAlign: 'left',
                borderRadius: 10,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{link.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  {link.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{link.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('faq')} style={tabStyle(activeTab === 'faq')}>
            {Lightbulb({ size: 14 })} Preguntas Frecuentes
          </button>
          <button
            onClick={() => setActiveTab('troubleshooting')}
            style={tabStyle(activeTab === 'troubleshooting')}
          >
            {Settings({ size: 14 })} Solución de Problemas
          </button>
          <button onClick={() => setActiveTab('contact')} style={tabStyle(activeTab === 'contact')}>
            {Send({ size: 14 })} Contactar Soporte
          </button>
          <button onClick={() => setActiveTab('status')} style={tabStyle(activeTab === 'status')}>
            {CheckCircle({ size: 14 })} Estado del Servicio
          </button>
        </div>

        {/* ═══ FAQ Tab ═══ */}
        {activeTab === 'faq' && (
          <>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              >
                {Search({ size: 16 })}
              </div>
              <input
                type="text"
                placeholder="Buscar en preguntas frecuentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>

            {filteredFaq.length === 0 && (
              <div
                className="u-card"
                style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}
              >
                <p>No encontramos resultados para "{searchQuery}"</p>
                <p style={{ fontSize: 13 }}>
                  Intenta con otras palabras o escríbenos directamente.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => setActiveTab('contact')}
                >
                  Contactar soporte
                </button>
              </div>
            )}

            {filteredFaq.map((section) => (
              <div key={section.title} style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {section.icon} {section.title}
                </h3>
                {section.items.map((item) => {
                  const key = `${section.title}-${item.q}`;
                  const isOpen = expandedFaq === key;
                  return (
                    <div
                      key={key}
                      className="u-card"
                      style={{ marginBottom: 6, overflow: 'hidden', borderRadius: 8 }}
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : key)}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            flex: 1,
                          }}
                        >
                          {item.q}
                        </span>
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                            transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)',
                          }}
                        >
                          {ChevronDown({ size: 16 })}
                        </span>
                      </button>
                      {isOpen && (
                        <div
                          style={{
                            padding: '0 16px 14px',
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* ═══ Troubleshooting Tab ═══ */}
        {activeTab === 'troubleshooting' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Sigue los pasos en orden. Si ninguno funciona, contáctanos.
            </p>
            {TROUBLESHOOTING.map((item) => {
              const isOpen = expandedTrouble === item.title;
              return (
                <div
                  key={item.title}
                  className="u-card"
                  style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }}
                >
                  <button
                    onClick={() => setExpandedTrouble(isOpen ? null : item.title)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: 'var(--accent-orange)', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </span>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      {isOpen ? ChevronDown({ size: 16 }) : ChevronRight({ size: 16 })}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <ol
                        style={{
                          margin: 0,
                          paddingLeft: 20,
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 2,
                        }}
                      >
                        {item.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveTab('contact')}
                          style={{ fontSize: 12 }}
                        >
                          {Send({ size: 12 })} ¿No se resolvió? Contáctanos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ═══ Contact Tab ═══ */}
        {activeTab === 'contact' && (
          <div className="u-card" style={{ padding: 24, borderRadius: 12 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ color: 'var(--accent-green)', marginBottom: 12 }}>
                  {CheckCircle({ size: 48 })}
                </div>
                <h3 style={{ marginBottom: 8 }}>Mensaje enviado</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Recibimos tu consulta y responderemos a <strong>{contactEmail}</strong>
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Tiempo de respuesta: 24-48 horas hábiles
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSent(false);
                    setContactSubject('');
                    setContactMessage('');
                    setContactCategory('general');
                  }}
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>
                  {Send({ size: 18 })} Contactar soporte
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Responderemos a tu correo en un plazo de 24-48 horas hábiles
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Nombre
                    </label>
                    <input
                      className="form-input"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Tu nombre"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Correo electrónico
                    </label>
                    <input
                      className="form-input"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 4,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Categoría
                  </label>
                  <select
                    className="form-input"
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="general">Consulta general</option>
                    <option value="bug">Reportar un error</option>
                    <option value="pagos">Pagos y suscripción</option>
                    <option value="extension">Extensión Chrome / Mi Universidad</option>
                    <option value="cuenta">Mi cuenta</option>
                    <option value="seguridad">Seguridad y privacidad</option>
                    <option value="sugerencia">Sugerencia o mejora</option>
                    <option value="legal">Consulta legal / datos personales</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 4,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Asunto
                  </label>
                  <input
                    className="form-input"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Describe brevemente tu consulta"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 4,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Mensaje
                  </label>
                  <textarea
                    className="form-input"
                    rows={5}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Cuéntanos en detalle qué necesitas. Si es un error, incluye qué estabas haciendo cuando ocurrió."
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                {sendError && (
                  <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12 }}>
                    {AlertTriangle({ size: 14 })} {sendError}
                  </p>
                )}

                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  Al enviar este formulario, tus datos (nombre, correo y mensaje) serán tratados por
                  Conniku SpA (RUT 78.395.702-7) exclusivamente para responder tu consulta. Los
                  datos se procesan en servidores en EE.UU. y se retienen por un máximo de 12 meses.{' '}
                  <a
                    href="/privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/privacy');
                    }}
                    style={{ color: 'var(--accent)' }}
                  >
                    Política de Privacidad
                  </a>
                </p>

                <button
                  className="btn btn-primary"
                  onClick={handleSendContact}
                  disabled={sending}
                  style={{ width: '100%' }}
                >
                  {sending ? 'Enviando...' : 'Enviar mensaje'}
                </button>

                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>También puedes escribirnos directamente:</strong>
                  </p>
                  <p style={{ margin: '4px 0 0' }}>
                    Soporte: contacto@conniku.com · Web: conniku.com
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ Status Tab ═══ */}
        {activeTab === 'status' && (
          <>
            <div
              className="u-card"
              style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid var(--accent-green)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'var(--accent-green)',
                    boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Todos los sistemas operativos</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                    Última verificación: {new Date().toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { name: 'Plataforma Web', url: 'conniku.com', status: 'Operativo' },
                { name: 'Backend API', url: 'studyhub-api-bpco.onrender.com', status: 'Operativo' },
                { name: 'Chat Asistente', url: 'Claude API', status: 'Operativo' },
                { name: 'Pagos (MercadoPago)', url: 'MercadoPago', status: 'Operativo' },
                { name: 'Pagos (PayPal)', url: 'PayPal', status: 'Operativo' },
                { name: 'Email (Zoho)', url: 'smtp.zoho.com', status: 'Operativo' },
              ].map((svc) => (
                <div
                  key={svc.name}
                  className="u-card"
                  style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent-green)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {svc.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{svc.status}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="u-card"
              style={{ padding: 16, marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Información importante</h4>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>
                  El servidor backend puede tardar 15-30 segundos en responder después de un período
                  de inactividad (plan gratuito de hosting)
                </li>
                <li>
                  Actualizaciones de la plataforma ocurren de forma continua y no requieren tiempo
                  de inactividad
                </li>
                <li>Si experimentas problemas persistentes, contáctanos a contacto@conniku.com</li>
              </ul>
            </div>
          </>
        )}

        {/* ─── Footer Links ─── */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            flexWrap: 'wrap',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {[
            { path: '/terms', label: 'Términos y Condiciones' },
            { path: '/privacy', label: 'Política de Privacidad' },
            { path: '/accessibility', label: 'Accesibilidad' },
            { path: '/about', label: 'Acerca de Conniku' },
          ].map((link) => (
            <a
              key={link.path}
              href={link.path}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(link.path);
              }}
              style={{ color: 'var(--accent)', cursor: 'pointer' }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 11,
            color: 'var(--text-muted)',
            paddingBottom: 24,
          }}
        >
          Conniku SpA · RUT 78.395.702-7 · contacto@conniku.com
        </div>
      </div>
    </>
  );
}
