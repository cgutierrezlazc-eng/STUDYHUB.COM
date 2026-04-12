import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

type ModalType = 'tutores' | 'universidades' | 'contacto' | 'transparencia' | null

const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'ko', label: '한국어' },
]

// ─── Links de pie de página ──────────────────────────────────────
const FOOTER_LINKS: Array<{ label: string; path?: string; modal?: ModalType }> = [
  { label: 'Historia',          path: '/about' },
  { label: 'Privacidad',        path: '/privacy' },
  { label: 'Seguridad',         path: '/safety' },
  { label: 'Trabaja con Nosotros', path: '/careers' },
  { label: 'Anuncia',           path: '/advertising' },
  { label: 'App Móvil',         path: '/mobile' },
  { label: 'Para Tutores',      modal: 'tutores' },
  { label: 'Para Universidades', modal: 'universidades' },
  { label: 'Blog',              path: '/blog' },
  { label: 'Contacto',          modal: 'contacto' },
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

function InfoSection({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
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
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎓</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Sé Tutor en Conniku</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Comparte tu conocimiento y genera ingresos desde donde estés</p>
      </div>
      <InfoSection emoji="💰" title="¿Cuánto puedo ganar?">
        Los tutores activos ganan entre <strong>$15.000 y $80.000 CLP por hora</strong> según materia y nivel. 5 clases semanales de 2 horas a $25.000/hr = más de <strong>$250.000 CLP extra al mes</strong>.
      </InfoSection>
      <InfoSection emoji="👥" title="Acceso a miles de estudiantes">
        Conéctate con universitarios de toda Chile y Latinoamérica buscando apoyo en Cálculo, Programación, Estadística, Idiomas, Economía y más.
      </InfoSection>
      <InfoSection emoji="🗓️" title="Total flexibilidad">
        Tú defines horarios, materias y modalidad — online o presencial. Sin compromisos fijos ni mínimos de horas.
      </InfoSection>
      <InfoSection emoji="✅" title="Requisitos">
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
          <li>Estudiante de 3er año en adelante, egresado o profesional</li>
          <li>Conocimiento sólido en al menos una materia</li>
          <li>Calificación mínima ★ 4.0 para mantenerse activo</li>
        </ul>
      </InfoSection>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={() => { onClose(); onNavigate('/jobs') }}
          style={{ flex: 1, padding: '11px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Quiero ser Tutor →
        </button>
        <button onClick={onClose}
          style={{ padding: '11px 20px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
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
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🏛️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Conniku para tu Universidad</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Un centro externo de apoyo académico para tus estudiantes</p>
      </div>
      <InfoSection emoji="📉" title="Reduce la deserción estudiantil">
        Hasta un 30% abandona en el primer año. Conniku ofrece tutorías on-demand, comunidades por carrera y seguimiento del progreso para identificar estudiantes en riesgo antes de que sea tarde.
      </InfoSection>
      <InfoSection emoji="🤖" title="IA al servicio del aprendizaje">
        Konni ayuda a tus estudiantes 24/7 con dudas académicas, planificación de estudio y preparación de exámenes — complementando la docencia, no reemplazándola.
      </InfoSection>
      <InfoSection emoji="💼" title="Bolsa de empleo y red de egresados">
        Conecta a tus egresados con empleadores verificados. Fortalece la empleabilidad y el prestigio de tu institución.
      </InfoSection>
      <InfoSection emoji="📊" title="Analytics y reportes">
        Reportes agregados y anónimos de actividad de estudio, materias con mayor dificultad y tendencias — respetando la privacidad (Ley 19.628).
      </InfoSection>
      <InfoSection emoji="🔗" title="Integración en 48 horas">
        Onboarding masivo vía CSV o API. Los estudiantes acceden con su email institucional. Sin infraestructura adicional.
      </InfoSection>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={() => { onClose(); onNavigate('/enterprise') }}
          style={{ flex: 1, padding: '11px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Ver planes y contactar →
        </button>
        <button onClick={onClose}
          style={{ padding: '11px 20px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
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

  const SUBJECTS = ['Consulta general', 'Soporte técnico', 'Facturación y pagos', 'Problema con mi cuenta',
    'Reportar contenido inapropiado', 'Propuesta de colaboración', 'Para universidades', 'Para empresas', 'Otro']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { setError('Completa todos los campos obligatorios'); return }
    setSending(true); setError('')
    try { await api.sendContactForm(form); setSent(true) }
    catch { setError('No se pudo enviar. Escríbenos a contacto@conniku.com') }
    finally { setSending(false) }
  }

  if (sent) return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¡Mensaje enviado!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Te respondemos en menos de 48 horas a <strong>{form.email}</strong>.</p>
        <button onClick={onClose} style={{ marginTop: 20, padding: '10px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
      </div>
    </Modal>
  )

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>¿Tienes alguna pregunta?</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Respondemos en menos de 48 horas hábiles.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nombre *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre" required
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" required
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Asunto *</label>
          <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: form.subject ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13, boxSizing: 'border-box' }}>
            <option value="">Selecciona un asunto</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mensaje *</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Cuéntanos en qué podemos ayudarte..." required rows={4}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        {error && <div style={{ fontSize: 13, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={sending}
            style={{ flex: 1, padding: '11px 20px', background: sending ? 'var(--text-muted)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer' }}>
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>
          <button type="button" onClick={onClose}
            style={{ padding: '11px 20px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal: Transparencia ───────────────────────────────────────
function TransparenciaModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: string) => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🛡️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Transparencia de Contenido</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Cómo Conniku decide qué contenido ves</p>
      </div>
      <InfoSection emoji="🔍" title="¿Qué determina tu Feed?">
        Priorizamos contenido de tus amigos, comunidades que sigues y publicaciones con alta interacción. Sin publicidad encubierta ni contenido patrocinado sin etiqueta.
      </InfoSection>
      <InfoSection emoji="🚫" title="Moderación de contenido">
        Sistema automático que detecta lenguaje ofensivo, spam y contenido inapropiado. Todo contenido marcado es revisado por humanos en menos de 48 horas.
      </InfoSection>
      <InfoSection emoji="📋" title="Tus datos y privacidad">
        Cumplimos con la Ley 19.628 (Chile), GDPR (UE) y LGPD (Brasil). Nunca vendemos tus datos. Puedes solicitar, modificar o eliminar tu información en cualquier momento.
      </InfoSection>
      <InfoSection emoji="⚖️" title="Apelaciones">
        Si tu contenido fue removido por error, escribe a <strong>contacto@conniku.com</strong> con asunto "Apelación de contenido". Respondemos en 5 días hábiles.
      </InfoSection>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={() => { onClose(); onNavigate('/privacy') }}
          style={{ flex: 1, padding: '11px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Ver Política de Privacidad →
        </button>
        <button onClick={onClose}
          style={{ padding: '11px 20px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ─── Footer — barra mínima ───────────────────────────────────────
export default function Footer({ onNavigate }: Props) {
  const year = new Date().getFullYear()
  const [modal, setModal] = useState<ModalType>(null)
  const location = useLocation()
  const isHome = location.pathname === '/dashboard' || location.pathname === '/'

  return (
    <>
      {modal === 'tutores'       && <TutoresModal       onClose={() => setModal(null)} onNavigate={onNavigate} />}
      {modal === 'universidades' && <UniversidadesModal onClose={() => setModal(null)} onNavigate={onNavigate} />}
      {modal === 'contacto'      && <ContactoModal      onClose={() => setModal(null)} />}
      {modal === 'transparencia' && <TransparenciaModal onClose={() => setModal(null)} onNavigate={onNavigate} />}

      <footer className="site-footer" role="contentinfo">
        <div className="site-footer-bar">
          <span className="site-footer-copy">Conniku SpA © {year}</span>

          <div className="site-footer-links">
            {FOOTER_LINKS.map((link, i) => (
              <React.Fragment key={link.label}>
                {i > 0 && <span className="site-footer-dot" aria-hidden="true">·</span>}
                <button
                  className="site-footer-link"
                  onClick={() => link.modal ? setModal(link.modal) : onNavigate(link.path!)}
                >
                  {link.label}
                </button>
              </React.Fragment>
            ))}
          </div>

          {isHome && (
            <select
              className="site-footer-lang-select"
              defaultValue={localStorage.getItem('conniku_lang_pref') || 'es'}
              onChange={e => localStorage.setItem('conniku_lang_pref', e.target.value)}
              aria-label="Seleccionar idioma"
            >
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          )}
        </div>
      </footer>
    </>
  )
}
