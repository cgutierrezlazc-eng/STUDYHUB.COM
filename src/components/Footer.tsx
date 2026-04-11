import React, { useState } from 'react'
import api from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

type ModalType = 'tutores' | 'universidades' | 'contacto' | 'transparencia' | null

// ─── Columnas del footer ─────────────────────────────────────────
const COLS: Array<{
  heading: string
  links: Array<{ label: string; path?: string; modal?: ModalType }>
}> = [
  {
    heading: 'Conniku',
    links: [
      { label: 'Historia de Conniku',   path: '/about' },
      { label: 'Privacidad y Términos', path: '/privacy' },
      { label: 'Soluciones a Empresas', path: '/enterprise' },
      { label: 'Centro de Seguridad',   path: '/safety' },
    ],
  },
  {
    heading: 'Empresa',
    links: [
      { label: 'Trabaja con Nosotros', path: '/careers' },
      { label: 'Anuncia con Nosotros', path: '/advertising' },
      { label: 'App Móvil',            path: '/mobile' },
    ],
  },
  {
    heading: 'Comunidad',
    links: [
      { label: 'Para Tutores',       modal: 'tutores' },
      { label: 'Para Universidades', modal: 'universidades' },
      { label: 'Blog',               path: '/blog' },
    ],
  },
]

const QUICK_ACTIONS = [
  { icon: '❓', title: '¿Preguntas?',               desc: 'Escríbenos desde aquí',              modal: 'contacto' as ModalType },
  { icon: '🔒', title: 'Cuenta y privacidad',       desc: 'Política de privacidad y tus datos', path: '/privacy' },
  { icon: '🛡️', title: 'Transparencia de contenido', desc: 'Cómo funcionan nuestras recomendaciones', modal: 'transparencia' as ModalType },
]

const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English (English)' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文 (简体)' },
  { code: 'ar', label: 'العربية' },
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'Русский' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'sv', label: 'Svenska' },
]

// ─── Overlay Modal ───────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.55)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 16,
        maxWidth: 600, width: '100%', maxHeight: '90vh',
        overflowY: 'auto', padding: '32px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', fontSize: 20,
            cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1,
          }}
          aria-label="Cerrar"
        >✕</button>
        {children}
      </div>
    </div>
  )
}

// ─── Sección decorativa ──────────────────────────────────────────
function InfoSection({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

// ─── Modal: Para Tutores ─────────────────────────────────────────
function TutoresModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: string) => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Sé Tutor en Conniku</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Comparte tu conocimiento y genera ingresos desde donde estés</p>
      </div>

      <InfoSection emoji="💰" title="¿Cuánto puedo ganar?">
        Los tutores activos ganan entre <strong>$15.000 y $80.000 CLP por hora</strong> según la materia y el nivel. Un tutor con 5 clases semanales de 2 horas a $25.000/hr puede generar más de <strong>$250.000 CLP extra al mes</strong> — sin salir de tu casa.
      </InfoSection>

      <InfoSection emoji="👥" title="Acceso a miles de estudiantes">
        Conéctate con estudiantes universitarios de toda Chile y Latinoamérica que buscan apoyo en Cálculo, Programación, Estadística, Idiomas, Economía y más. La demanda es real y constante durante el año académico.
      </InfoSection>

      <InfoSection emoji="🗓️" title="Flexibilidad total">
        Tú decides tus horarios, materias y modalidad — online desde cualquier dispositivo o presencial en tu ciudad. Sin compromisos fijos ni mínimos de horas. Trabaja cuando quieras.
      </InfoSection>

      <InfoSection emoji="✅" title="Requisitos para ser tutor">
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
          <li>Ser estudiante universitario de 3er año en adelante, egresado o profesional</li>
          <li>Tener conocimiento sólido en al menos una materia</li>
          <li>Compromiso con la calidad: los tutores mantienen una calificación mínima de ★ 4.0</li>
          <li>Completar el proceso de onboarding (toma menos de 10 minutos)</li>
        </ul>
      </InfoSection>

      <InfoSection emoji="🚀" title="¿Cómo empiezo?">
        Publica tu perfil de tutor, define tus materias y tarifas, y empieza a recibir solicitudes de estudiantes. Conniku gestiona los pagos de forma segura y te transfiere quincenalmente.
      </InfoSection>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => { onClose(); onNavigate('/jobs') }}
          style={{
            flex: 1, padding: '12px 20px', background: 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Quiero ser Tutor →
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 20px', background: 'none',
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            borderRadius: 10, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ─── Modal: Para Universidades ───────────────────────────────────
function UniversidadesModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: string) => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏛️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Conniku para tu Universidad</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Un centro externo de apoyo académico para tus estudiantes</p>
      </div>

      <InfoSection emoji="📉" title="Reduce la deserción estudiantil">
        Hasta un 30% de los estudiantes universitarios chilenos abandona en el primer año. Conniku ofrece tutorías on-demand, comunidades por carrera y seguimiento del progreso académico para identificar y apoyar a estudiantes en riesgo antes de que sea tarde.
      </InfoSection>

      <InfoSection emoji="🤝" title="Red de apoyo entre pares">
        Comunidades segmentadas por carrera, asignatura y cohorte donde los estudiantes colaboran, comparten apuntes y estudian juntos. Potencia el sentido de pertenencia y reduce el aislamiento académico.
      </InfoSection>

      <InfoSection emoji="💼" title="Bolsa de empleo y egresados">
        Conecta a tus egresados con empleadores verificados. La red Conniku permite que empresas postulen directamente a talentos de tu institución, fortaleciendo la empleabilidad y el prestigio de tu universidad.
      </InfoSection>

      <InfoSection emoji="🤖" title="IA al servicio del aprendizaje">
        Konni, el asistente de IA de Conniku, ayuda a los estudiantes 24/7 con dudas académicas, planificación de estudio y preparación de exámenes — sin reemplazar la docencia, sino complementándola.
      </InfoSection>

      <InfoSection emoji="📊" title="Analytics y reportes">
        Reportes agregados y anónimos sobre actividad de estudio, materias con mayor dificultad y tendencias de uso — información valiosa para la gestión académica respetando la privacidad de los estudiantes (Ley 19.628).
      </InfoSection>

      <InfoSection emoji="🔗" title="Integración sencilla">
        Onboarding masivo vía CSV o API, sin infraestructura adicional. Los estudiantes acceden con su email institucional. Configuración en menos de 48 horas.
      </InfoSection>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => { onClose(); onNavigate('/enterprise') }}
          style={{
            flex: 1, padding: '12px 20px', background: 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Ver planes y contactar →
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 20px', background: 'none',
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            borderRadius: 10, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ─── Modal: Formulario de Contacto ───────────────────────────────
function ContactoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const SUBJECTS = [
    'Consulta general',
    'Soporte técnico',
    'Facturación y pagos',
    'Problema con mi cuenta',
    'Reportar contenido inapropiado',
    'Propuesta de colaboración',
    'Propuesta para universidades',
    'Propuesta para empresas',
    'Otro',
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Completa todos los campos obligatorios')
      return
    }
    setSending(true)
    setError('')
    try {
      await api.sendContactForm(form)
      setSent(true)
    } catch {
      setError('No se pudo enviar el mensaje. Intenta más tarde o escríbenos a contacto@conniku.com')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¡Mensaje enviado!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Recibimos tu consulta. Te responderemos en menos de 48 horas hábiles a <strong>{form.email}</strong>.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: 20, padding: '10px 28px', background: 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>
        ¿Tienes alguna pregunta?
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Completa el formulario y te respondemos en menos de 48 horas hábiles.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tu nombre"
              required
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com"
              required
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Asunto *
          </label>
          <select
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            required
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: form.subject ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13, boxSizing: 'border-box',
            }}
          >
            <option value="">Selecciona un asunto</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Mensaje *
          </label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Cuéntanos en qué podemos ayudarte..."
            required
            rows={5}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: 13, resize: 'vertical',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="submit"
            disabled={sending}
            style={{
              flex: 1, padding: '11px 20px', background: sending ? 'var(--text-muted)' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 20px', background: 'none',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              borderRadius: 10, fontSize: 14, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal: Transparencia de Contenido ───────────────────────────
function TransparenciaModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: string) => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🛡️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Transparencia de Contenido</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Cómo Conniku decide qué contenido ves</p>
      </div>

      <InfoSection emoji="🔍" title="¿Qué determina tu Feed?">
        El Feed de Conniku prioriza contenido de tus amigos, comunidades que sigues y publicaciones con alta interacción de la red universitaria. No hay publicidad encubierta ni contenido patrocinado sin etiqueta clara.
      </InfoSection>

      <InfoSection emoji="🤖" title="Algoritmo de recomendaciones">
        Las sugerencias de comunidades, tutores y publicaciones se generan en base a tu carrera, universidad, historial de interacción y preferencias declaradas. Puedes ajustar estos parámetros desde tu perfil.
      </InfoSection>

      <InfoSection emoji="🚫" title="Moderación de contenido">
        Contamos con un sistema automático de moderación que detecta lenguaje ofensivo, spam y contenido inapropiado. Todo contenido marcado es revisado por nuestro equipo en menos de 48 horas. La decisión final siempre es humana.
      </InfoSection>

      <InfoSection emoji="📋" title="Tus datos y privacidad">
        Conniku cumple con la Ley 19.628 (Chile), GDPR (UE) y LGPD (Brasil). Nunca vendemos ni compartimos tus datos con terceros para publicidad. Puedes solicitar, modificar o eliminar tus datos en cualquier momento.
      </InfoSection>

      <InfoSection emoji="⚖️" title="Apelaciones y reclamos">
        Si tu contenido fue removido y crees que es un error, puedes apelar escribiendo a <strong>contacto@conniku.com</strong> con el asunto "Apelación de contenido". Respondemos en 5 días hábiles.
      </InfoSection>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => { onClose(); onNavigate('/privacy') }}
          style={{
            flex: 1, padding: '12px 20px', background: 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Ver Política de Privacidad →
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 20px', background: 'none',
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            borderRadius: 10, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ─── Footer principal ────────────────────────────────────────────
export default function Footer({ onNavigate }: Props) {
  const year = new Date().getFullYear()
  const [modal, setModal] = useState<ModalType>(null)

  function handleLink(link: { path?: string; modal?: ModalType }) {
    if (link.modal) { setModal(link.modal); return }
    if (link.path) onNavigate(link.path)
  }

  return (
    <>
      {/* ── Modales ── */}
      {modal === 'tutores'        && <TutoresModal        onClose={() => setModal(null)} onNavigate={onNavigate} />}
      {modal === 'universidades'  && <UniversidadesModal  onClose={() => setModal(null)} onNavigate={onNavigate} />}
      {modal === 'contacto'       && <ContactoModal       onClose={() => setModal(null)} />}
      {modal === 'transparencia'  && <TransparenciaModal  onClose={() => setModal(null)} onNavigate={onNavigate} />}

      <footer className="site-footer" role="contentinfo">
        <div className="site-footer-inner">

          {/* Logo */}
          <div className="site-footer-brand">
            <span className="site-footer-logo">Conniku</span>
            <span className="site-footer-tagline">La plataforma de estudio universitario</span>
          </div>

          {/* Body: columns + actions + language */}
          <div className="site-footer-body">

            {/* Link columns */}
            <div className="site-footer-cols">
              {COLS.map((col, ci) => (
                <div key={ci} className="site-footer-col">
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
                    {col.heading}
                  </div>
                  {col.links.map(link => (
                    <button
                      key={link.label}
                      className="site-footer-link"
                      onClick={() => handleLink(link)}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="site-footer-divider" />

            {/* Quick actions + language */}
            <div className="site-footer-right">
              <div className="site-footer-actions">
                {QUICK_ACTIONS.map((a, i) => (
                  <div
                    key={i}
                    className="site-footer-action"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (a.modal) setModal(a.modal)
                      else if (a.path) onNavigate(a.path)
                    }}
                  >
                    <span className="site-footer-action-icon" aria-hidden="true">{a.icon}</span>
                    <div>
                      <div className="site-footer-action-title">{a.title}</div>
                      <button
                        className="site-footer-action-link"
                        onClick={e => {
                          e.stopPropagation()
                          if (a.modal) setModal(a.modal)
                          else if (a.path) onNavigate(a.path)
                        }}
                      >
                        {a.desc}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="site-footer-lang">
                <label className="site-footer-lang-label" htmlFor="footer-lang">
                  Seleccionar idioma
                </label>
                <select
                  id="footer-lang"
                  className="site-footer-lang-select"
                  defaultValue="es"
                  onChange={e => {
                    localStorage.setItem('conniku_lang_pref', e.target.value)
                  }}
                >
                  {LANGS.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="site-footer-bottom">
            <span>Conniku SpA © {year}</span>
            <div className="site-footer-bottom-links">
              <button className="site-footer-link" onClick={() => onNavigate('/privacy')}>
                Política de Privacidad
              </button>
              <span aria-hidden="true">·</span>
              <button className="site-footer-link" onClick={() => onNavigate('/terms')}>
                Términos de Uso
              </button>
              <span aria-hidden="true">·</span>
              <button className="site-footer-link" onClick={() => setModal('contacto')}>
                contacto@conniku.com
              </button>
            </div>
          </div>

        </div>
      </footer>
    </>
  )
}
