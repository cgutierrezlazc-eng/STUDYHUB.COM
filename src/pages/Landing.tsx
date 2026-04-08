import React, { useState } from 'react'
import { useDevice } from '../hooks/useDevice'

interface Props {
  onLogin: () => void
  onRegister: () => void
}

type ModalType = 'profile' | 'chat' | 'docai' | 'feed' | 'job' | 'estudia' | 'conecta' | 'crece' | null

/* Conniku logomark — blue square with open circle */
function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.29,
      background: '#2D62C8', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(45,98,200,0.35)', flexShrink: 0,
    }}>
      <svg viewBox="0 0 40 40" width={size * 0.58} height={size * 0.58}>
        <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" />
      </svg>
    </div>
  )
}

function LogoType({ size = 36 }: { size?: number }) {
  return (
    <span style={{ fontFamily: "'Outfit', -apple-system, sans-serif", fontSize: size, fontWeight: 700, color: '#151B1E', letterSpacing: '-0.05em', lineHeight: 1 }}>
      conni<span style={{ color: '#2D62C8' }}>ku</span>
    </span>
  )
}

/* Lucide-style check icon */
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2D62C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/* Laptop frame wrapper for modal mockups */
function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', maxWidth: 620, margin: '0 auto' }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '12px 12px 0 0', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#888', marginRight: 40 }}>conniku.com</div>
      </div>
      <div style={{
        background: '#F5F7F8', border: '2px solid #1a1a1a', borderTop: 'none',
        borderRadius: '0 0 4px 4px', padding: 16, minHeight: 280,
      }}>
        {children}
      </div>
      <div style={{
        width: '110%', marginLeft: '-5%', height: 14, background: '#ccc',
        borderRadius: '0 0 8px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }} />
    </div>
  )
}

/* Profile mockup */
function ProfileMockup() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', accentLight: '#E2EAF9' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ height: 60, background: 'linear-gradient(135deg, #2D62C8, #4A7FE0)' }} />
      <div style={{ padding: '0 20px 16px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${vars.bgCard}`, margin: '-28px auto 8px', backgroundImage: "url('https://i.pravatar.cc/150?img=5')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: vars.textPrimary }}>Ana Torres</div>
        <div style={{ fontSize: 12, color: vars.textMuted, marginBottom: 12 }}>PUC - Medicina - 6to semestre</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
          {[{ n: '142', l: 'Posts' }, { n: '1.2k', l: 'Amigos' }, { n: '89', l: 'Docs' }].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: vars.textPrimary }}>{s.n}</div>
              <div style={{ fontSize: 10, color: vars.textMuted }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <div style={{ padding: '6px 16px', borderRadius: 8, background: vars.accent, color: '#fff', fontSize: 12, fontWeight: 600 }}>Conectar</div>
          <div style={{ padding: '6px 16px', borderRadius: 8, background: vars.accentLight, color: vars.accent, fontSize: 12, fontWeight: 600 }}>Mensaje</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${vars.border}`, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary, marginBottom: 8 }}>Publicaciones recientes</div>
        {['Alguien tiene las guias de bioquimica?', 'Grupo de estudio sabado en biblioteca central'].map((p, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${vars.border}`, fontSize: 11, color: '#4A5568' }}>{p}</div>
        ))}
      </div>
    </div>
  )
}

/* Chat mockup */
function ChatMockup() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8' }
  const msgs = [
    { text: 'Hola! Tienes la guia de estudio?', sent: false, time: '10:31' },
    { text: 'Si! Te la mando ahora mismo', sent: true, time: '10:32' },
    { text: 'Genial, muchas gracias!', sent: false, time: '10:32' },
    { text: 'De nada! Tambien tengo los resumenes del capitulo 4', sent: true, time: '10:33' },
    { text: 'Increible, eres la mejor!', sent: false, time: '10:33' },
  ]
  return (
    <div style={{ background: vars.bgCard, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${vars.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundImage: "url('https://i.pravatar.cc/150?img=12')", backgroundSize: 'cover' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: vars.textPrimary }}>Carlos Mendoza</div>
          <div style={{ fontSize: 10, color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} /> En linea</div>
        </div>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.sent ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: '8px 12px', borderRadius: 12, fontSize: 12, maxWidth: '75%', lineHeight: 1.4,
              ...(m.sent
                ? { background: vars.accent, color: '#fff', borderBottomRightRadius: 3 }
                : { background: vars.bgPrimary, color: '#4A5568', borderBottomLeftRadius: 3 }),
            }}>
              {m.text}
              <div style={{ fontSize: 9, marginTop: 2, opacity: 0.6, textAlign: 'right' }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${vars.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 20, background: vars.bgPrimary, fontSize: 11, color: vars.textMuted }}>Escribe un mensaje...</div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: vars.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
        </div>
      </div>
    </div>
  )
}

/* Doc study mockup */
function DocMockup() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8', accentLight: '#E2EAF9' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${vars.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={vars.accent} strokeWidth="1.75"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: vars.textPrimary }}>Asistente de Estudio</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: vars.bgPrimary, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#C25B56" strokeWidth="1.75"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary }}>Quimica_Organica.pdf</div>
            <div style={{ fontSize: 10, color: vars.textMuted }}>24 paginas - Subido hace 2 min</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: '#34D399', fontWeight: 600 }}>Procesado</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary, marginBottom: 8 }}>Guia de Estudio Generada</div>
        {['1. Reacciones de sustitucion nucleofilica (SN1/SN2)', '2. Reacciones de eliminacion (E1/E2)', '3. Adicion a alquenos y alquinos'].map((item, i) => (
          <div key={i} style={{ padding: '8px 12px', background: i === 0 ? vars.accentLight : vars.bgPrimary, borderRadius: 6, marginBottom: 4, fontSize: 11, color: vars.textPrimary, border: i === 0 ? `1px solid ${vars.accent}33` : 'none' }}>{item}</div>
        ))}
        <div style={{ marginTop: 12, padding: '10px 12px', background: `linear-gradient(135deg, rgba(45,98,200,0.06), rgba(45,98,200,0.02))`, borderLeft: `3px solid ${vars.accent}`, borderRadius: '0 8px 8px 0', fontSize: 11, color: '#4A5568', lineHeight: 1.5 }}>
          Resumen: Las reacciones principales del capitulo incluyen mecanismos de sustitucion y eliminacion, con enfasis en factores como la naturaleza del sustrato y disolvente...
        </div>
      </div>
    </div>
  )
}

/* Feed mockup */
function FeedMockup() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${vars.border}`, fontSize: 14, fontWeight: 700, color: vars.textPrimary }}>Tu Feed</div>
      {[
        { name: 'Diego Ruiz', uni: 'USACH', time: '2h', text: 'Grupo de estudio este sabado! Quien se apunta? Ya somos 8 confirmados.', likes: 34, comments: 12, avatar: 15 },
        { name: 'Maria Lopez', uni: 'PUC', time: '4h', text: 'Comparto mis apuntes de Calculo III, espero les sirvan!', likes: 67, comments: 23, avatar: 32 },
      ].map((post, i) => (
        <div key={i} style={{ padding: '12px 16px', borderBottom: `1px solid ${vars.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundImage: `url('https://i.pravatar.cc/150?img=${post.avatar}')`, backgroundSize: 'cover' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary }}>{post.name}</div>
              <div style={{ fontSize: 9, color: vars.textMuted }}>{post.uni} - hace {post.time}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginBottom: 8 }}>{post.text}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 10, color: vars.textMuted }}>
            <span>{post.likes} Me gusta</span><span>{post.comments} Comentarios</span><span>Compartir</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* Jobs mockup */
function JobsMockup() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${vars.border}`, fontSize: 14, fontWeight: 700, color: vars.textPrimary }}>Bolsa de Empleo</div>
      {[
        { title: 'Desarrollador Junior', company: 'TechCorp', type: 'Remoto - Part-time', tags: ['React', 'TypeScript'], isNew: true },
        { title: 'Practica Marketing Digital', company: 'StartupCL', type: 'Santiago - Full-time', tags: ['SEO', 'Analytics'], isNew: true },
        { title: 'Asistente de Investigacion', company: 'Universidad', type: 'Presencial - 20h/sem', tags: ['Excel', 'Datos'], isNew: false },
      ].map((job, i) => (
        <div key={i} style={{ padding: '12px 16px', borderBottom: `1px solid ${vars.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: vars.textPrimary }}>{job.title}</div>
            {job.isNew && <span style={{ fontSize: 8, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Nuevo</span>}
          </div>
          <div style={{ fontSize: 11, color: vars.textMuted, marginBottom: 6 }}>{job.company} - {job.type}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {job.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: vars.bgPrimary, color: vars.textMuted }}>{t}</span>)}
          </div>
        </div>
      ))}
    </div>
  )
}

/* Mini feature previews for the features section */
function FlashcardMiniPreview() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8', accentLight: '#E2EAF9' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 8, padding: 12, border: `1px solid ${vars.border}`, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 6, background: vars.accentLight, textAlign: 'center', fontSize: 10, color: vars.accent, fontWeight: 600 }}>
          Pregunta:<br /><span style={{ fontWeight: 400, fontSize: 9 }}>Que es la mitocondria?</span>
        </div>
        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 6, background: '#DCFCE7', textAlign: 'center', fontSize: 10, color: '#15803D', fontWeight: 600 }}>
          Respuesta:<br /><span style={{ fontWeight: 400, fontSize: 9 }}>Organelo celular encargado de...</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: vars.textMuted }}>12 de 30 tarjetas</div>
        <div style={{ width: 60, height: 4, borderRadius: 2, background: vars.bgPrimary }}>
          <div style={{ width: '40%', height: '100%', borderRadius: 2, background: vars.accent }} />
        </div>
      </div>
    </div>
  )
}

function CommunityMiniPreview() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 8, padding: 12, border: `1px solid ${vars.border}`, marginBottom: 14 }}>
      {[
        { name: 'Grupo Calculo III', members: '48 miembros', online: 12 },
        { name: 'Medicina 6to Sem', members: '32 miembros', online: 8 },
      ].map((g, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i === 0 ? `1px solid ${vars.border}` : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? '#E0E7FF' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{i === 0 ? '∑' : '🩺'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: vars.textPrimary }}>{g.name}</div>
            <div style={{ fontSize: 9, color: vars.textMuted }}>{g.members}</div>
          </div>
          <div style={{ fontSize: 8, color: '#34D399' }}>{g.online} en linea</div>
        </div>
      ))}
    </div>
  )
}

function JobsMiniPreview() {
  const vars = { accent: '#2D62C8', textPrimary: '#151B1E', textMuted: '#8E99A4', border: '#E0E4E7', bgCard: '#FFFFFF', bgPrimary: '#F5F7F8' }
  return (
    <div style={{ background: vars.bgCard, borderRadius: 8, padding: 12, border: `1px solid ${vars.border}`, marginBottom: 14 }}>
      {[
        { title: 'Dev Junior', company: 'TechCorp', type: 'Remoto' },
        { title: 'Practica MKT', company: 'StartupCL', type: 'Santiago' },
      ].map((j, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i === 0 ? `1px solid ${vars.border}` : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>💼</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: vars.textPrimary }}>{j.title}</div>
            <div style={{ fontSize: 9, color: vars.textMuted }}>{j.company} - {j.type}</div>
          </div>
          <div style={{ fontSize: 8, padding: '3px 8px', borderRadius: 4, background: vars.accent, color: '#fff', fontWeight: 600 }}>Aplicar</div>
        </div>
      ))}
    </div>
  )
}

/* "Ver demo" badge overlay */
function DemoBadge() {
  return (
    <div style={{
      position: 'absolute', bottom: 8, right: 8, zIndex: 10,
      background: 'rgba(45,98,200,0.9)', color: '#fff',
      padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600,
      cursor: 'pointer', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#fff" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      Ver demo
    </div>
  )
}

export default function Landing({ onLogin, onRegister }: Props) {
  const { isMobile, isTablet } = useDevice()
  const compact = isMobile
  const mid = isTablet

  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const font = "'Outfit', -apple-system, sans-serif"
  const vars = {
    bgPrimary: '#F5F7F8',
    bgSecondary: '#F9FAFB',
    bgCard: '#FFFFFF',
    textPrimary: '#151B1E',
    textSecondary: '#4A5568',
    textMuted: '#8E99A4',
    accent: '#2D62C8',
    accentLight: '#E2EAF9',
    accentHover: '#2350A8',
    border: '#E0E4E7',
  }

  const cardHoverStyle: React.CSSProperties = {
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  }

  const modalData: Record<string, { title: string; description: string; mockup: React.ReactNode }> = {
    profile: {
      title: 'Perfil Academico',
      description: 'Tu perfil academico completo. Comparte tu trayectoria, conecta con companeros y muestra tus logros.',
      mockup: <ProfileMockup />,
    },
    chat: {
      title: 'Mensajeria',
      description: 'Mensajeria en tiempo real con tus companeros. Comparte archivos, organiza grupos de estudio y mantente conectado.',
      mockup: <ChatMockup />,
    },
    docai: {
      title: 'Asistente de Estudio',
      description: 'Sube tus apuntes y documentos. Conniku genera guias de estudio, resumenes y material de repaso personalizado.',
      mockup: <DocMockup />,
    },
    feed: {
      title: 'Feed Social',
      description: 'Tu perfil social academico. Publica, comenta, comparte recursos y mantente al dia con tu comunidad universitaria.',
      mockup: <FeedMockup />,
    },
    job: {
      title: 'Bolsa de Empleo',
      description: 'Bolsa de empleo exclusiva para estudiantes. Encuentra practicas, trabajos part-time y oportunidades que se ajustan a tu horario.',
      mockup: <JobsMockup />,
    },
    estudia: {
      title: 'Estudia Mejor',
      description: 'Herramientas interactivas de estudio: flashcards con repeticion espaciada, quizzes adaptativos y guias personalizadas.',
      mockup: <DocMockup />,
    },
    conecta: {
      title: 'Conecta',
      description: 'Comunidades por materia, mensajeria, mentorias, eventos de estudio y red social para estudiantes.',
      mockup: <ChatMockup />,
    },
    crece: {
      title: 'Crece',
      description: 'Bolsa de empleo, CV profesional, tutorias y cursos de desarrollo integral para tu futuro.',
      mockup: <JobsMockup />,
    },
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden', background: vars.bgPrimary, position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', fontFamily: font }}>

      {/* ─── Modal / Lightbox ─── */}
      {activeModal && modalData[activeModal] && (
        <div
          onClick={() => setActiveModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: compact ? 0 : 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: vars.bgPrimary,
              borderRadius: compact ? 0 : 16,
              width: compact ? '100%' : '90%',
              maxWidth: 700,
              height: compact ? '100%' : 'auto',
              maxHeight: compact ? '100%' : '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: compact ? 'none' : '0 24px 80px rgba(0,0,0,0.25)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'sticky', top: 12, float: 'right', marginRight: 12, zIndex: 10,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: vars.textPrimary, fontWeight: 700,
              }}
            >
              ✕
            </button>
            <div style={{ padding: compact ? '20px 16px 32px' : '32px 40px 40px' }}>
              <h3 style={{ fontSize: compact ? 20 : 24, fontWeight: 700, color: vars.textPrimary, marginBottom: 20, marginTop: 0 }}>
                {modalData[activeModal].title}
              </h3>
              <LaptopFrame>
                {modalData[activeModal].mockup}
              </LaptopFrame>
              <p style={{ fontSize: 14, color: vars.textSecondary, lineHeight: 1.7, marginTop: 20, textAlign: 'center', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                {modalData[activeModal].description}
              </p>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button onClick={onRegister} style={{
                  background: vars.accent, color: '#fff', border: 'none',
                  padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: font,
                }}>
                  Pruebalo gratis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Navbar ─── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '0 16px' : '0 40px', height: compact ? 56 : 60,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${vars.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10 }}>
          <LogoMark size={compact ? 28 : 34} />
          <LogoType size={compact ? 26 : 36} />
        </div>

        {!compact && !mid && (
          <div style={{ display: 'flex', gap: 28, fontSize: 13, color: vars.textSecondary, fontWeight: 500 }}>
            {[
              { label: 'Plataforma', target: 'plataforma' },
              { label: 'Planes', target: 'planes' },
              { label: 'Comunidad', target: 'comunidad' },
              { label: 'Cursos', target: 'comunidad' },
              { label: 'Empleo', target: 'comunidad' },
            ].map(item => (
              <a
                key={item.label}
                href={`#${item.target}`}
                onClick={e => {
                  e.preventDefault()
                  document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onLogin} style={{ background: 'none', border: 'none', color: vars.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font }}>
            {compact ? 'Ingresar' : 'Iniciar Sesion'}
          </button>
          <button onClick={onRegister} style={{
            background: vars.textPrimary, color: vars.bgSecondary,
            padding: compact ? '8px 16px' : '8px 20px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: font,
          }}>
            {compact ? 'Registrarse' : 'Crear cuenta gratis'}
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section id="plataforma" style={{ background: vars.bgPrimary, padding: compact ? '48px 16px' : mid ? '56px 28px' : '72px 40px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: compact ? 'flex-start' : 'center',
          gap: compact ? 32 : 56,
          flexDirection: compact ? 'column' : 'row',
        }}>
          {/* Left */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: vars.accentLight, color: vars.accent,
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: vars.accent }} />
              127 estudiantes conectados
            </div>
            <h1 style={{
              fontSize: compact ? 32 : mid ? 38 : 46, fontWeight: 800,
              color: vars.textPrimary, lineHeight: 1.08, letterSpacing: '-0.04em', margin: 0,
            }}>
              Donde los estudiantes se <span style={{ color: vars.accent }}>conectan</span>, aprenden y crecen
            </h1>
            <p style={{
              fontSize: compact ? 14 : 16, color: vars.textMuted, lineHeight: 1.7,
              marginTop: 16, maxWidth: 440,
            }}>
              La plataforma todo-en-uno para tu vida universitaria. Estudia de forma interactiva, conecta con tu comunidad, y preparate para tu futuro profesional.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexDirection: compact ? 'column' : 'row' }}>
              <button onClick={onRegister} style={{
                background: vars.accent, color: '#fff', border: 'none',
                padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: font, width: compact ? '100%' : 'auto',
              }}>
                Comenzar gratis
              </button>
              <button onClick={onRegister} style={{
                background: 'transparent', color: vars.textSecondary,
                border: `1.5px solid ${vars.border}`,
                padding: '13px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: font, width: compact ? '100%' : 'auto',
              }}>
                Ver tour de 2 min
              </button>
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: vars.textMuted, flexWrap: 'wrap' }}>
                {['About', 'Help Center', 'Terms', 'Privacy', 'Contact'].map(l => (
                  <a key={l} href="#" onClick={e => e.preventDefault()} style={{ color: vars.textMuted, textDecoration: 'none' }}>{l}</a>
                ))}
              </div>
              <div style={{ fontSize: 10, color: vars.textMuted }}>© 2026 Conniku. All rights reserved.</div>
            </div>
          </div>

          {/* Right — Hero showcase cards (desktop/tablet) */}
          {!compact && (
            <div style={{ flex: 1, maxWidth: mid ? 420 : 580 }}>
              <div style={{ position: 'relative', height: mid ? 460 : 580 }}>
                {/* Profile card */}
                <div
                  onClick={() => setActiveModal('profile')}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(-3deg) scale(1.04)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(-3deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)' }}
                  style={{
                    position: 'absolute', width: mid ? 210 : 260, top: 0, left: 0, zIndex: 3,
                    transform: 'rotate(-3deg)',
                    background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                    ...cardHoverStyle,
                  }}
                >
                  <div style={{ height: 52, background: 'linear-gradient(135deg, #2D62C8, #2D62C8)' }} />
                  <div style={{ padding: '0 14px 14px', textAlign: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', border: `3px solid ${vars.bgCard}`,
                      margin: '-24px auto 6px', backgroundImage: "url('https://i.pravatar.cc/150?img=5')",
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: vars.textPrimary }}>Ana Torres</div>
                    <div style={{ fontSize: 10, color: vars.textMuted, marginBottom: 8 }}>PUC - Medicina - 6to sem</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                      {[{ n: '142', l: 'Posts' }, { n: '1.2k', l: 'Amigos' }, { n: '89', l: 'Docs' }].map(s => (
                        <div key={s.l} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: vars.textPrimary, lineHeight: 1.2 }}>{s.n}</div>
                          <div style={{ fontSize: 9, color: vars.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DemoBadge />
                </div>

                {/* Chat card */}
                <div
                  onClick={() => setActiveModal('chat')}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(2deg) scale(1.04)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(2deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)' }}
                  style={{
                    position: 'absolute', width: mid ? 240 : 300, top: 10, right: 0, zIndex: 4,
                    transform: 'rotate(2deg)',
                    background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                    ...cardHoverStyle,
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${vars.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary }}>Carlos M.</span>
                    <span style={{ fontSize: 10, color: vars.textMuted, marginLeft: 'auto' }}>ahora</span>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    {[
                      { text: 'Tienes la guia de estudio?', sent: false },
                      { text: 'Si! Te la mando ahora', sent: true },
                      { text: 'Eres la mejor!', sent: false },
                    ].map((m, i) => (
                      <div key={i} style={{
                        padding: '7px 12px', borderRadius: 10, fontSize: 11, maxWidth: '85%', marginBottom: 5, lineHeight: 1.4,
                        ...(m.sent
                          ? { background: vars.accent, color: '#fff', marginLeft: 'auto', borderBottomRightRadius: 3 }
                          : { background: vars.bgPrimary, color: vars.textSecondary, borderBottomLeftRadius: 3 }),
                      }}>{m.text}</div>
                    ))}
                  </div>
                  <DemoBadge />
                </div>

                {/* Doc study card */}
                <div
                  onClick={() => setActiveModal('docai')}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(1.5deg) scale(1.04)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(1.5deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)' }}
                  style={{
                    position: 'absolute', width: mid ? 230 : 280, top: mid ? 200 : 240, left: mid ? -5 : -10, zIndex: 5,
                    transform: 'rotate(1.5deg)',
                    background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                    ...cardHoverStyle,
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${vars.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: vars.accentLight, color: vars.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary }}>Asistente de estudio</span>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: vars.bgPrimary, borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#C25B56" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: vars.textPrimary }}>Quimica_Organica.pdf</div>
                        <div style={{ fontSize: 9, color: vars.textMuted }}>24 paginas</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: vars.textMuted, marginBottom: 6, fontStyle: 'italic' }}>"Reacciones clave del Cap. 5?"</div>
                    <div style={{
                      fontSize: 11, color: vars.textPrimary, lineHeight: 1.4,
                      background: 'linear-gradient(135deg, rgba(45,98,200,0.06), rgba(45,98,200,0.02))',
                      borderLeft: `2px solid ${vars.accent}`, padding: '8px 10px', borderRadius: '0 6px 6px 0',
                    }}>
                      Sustitucion nucleofilica (SN1/SN2), eliminacion (E1/E2) y adicion a alquenos...
                    </div>
                  </div>
                  <DemoBadge />
                </div>

                {/* Feed card */}
                <div
                  onClick={() => setActiveModal('feed')}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(-2deg) scale(1.04)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(-2deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)' }}
                  style={{
                    position: 'absolute', width: mid ? 235 : 290, top: mid ? 225 : 270, right: 10, zIndex: 2,
                    transform: 'rotate(-2deg)',
                    background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                    ...cardHoverStyle,
                  }}
                >
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundImage: "url('https://i.pravatar.cc/150?img=15')", backgroundSize: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: vars.textPrimary }}>Diego Ruiz</div>
                        <div style={{ fontSize: 9, color: vars.textMuted }}>USACH - hace 2h</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: vars.textSecondary, lineHeight: 1.4, marginBottom: 8 }}>
                      Grupo de estudio este sabado! Quien se apunta? Ya somos 8 confirmados.
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 10, color: vars.textMuted }}>
                      <span>34 Me gusta</span><span>12 Comentarios</span><span>Compartir</span>
                    </div>
                  </div>
                  <DemoBadge />
                </div>

                {/* Job card */}
                <div
                  onClick={() => setActiveModal('job')}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(-1.5deg) scale(1.04)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(-1.5deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)' }}
                  style={{
                    position: 'absolute', width: mid ? 200 : 250, bottom: 10, left: 60, zIndex: 6,
                    transform: 'rotate(-1.5deg)',
                    background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                    ...cardHoverStyle,
                  }}
                >
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{
                      display: 'inline-block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', background: '#DCFCE7', color: '#15803D',
                      padding: '3px 10px', borderRadius: 6, marginBottom: 8,
                    }}>Nuevo</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: vars.textPrimary, marginBottom: 3 }}>Desarrollador Junior</div>
                    <div style={{ fontSize: 11, color: vars.textMuted, marginBottom: 8 }}>TechCorp - Remoto - Part-time</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {['React', 'TypeScript', 'Estudiantes OK'].map(t => (
                        <span key={t} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: vars.bgPrimary, color: vars.textMuted }}>{t}</span>
                      ))}
                    </div>
                    <button style={{
                      width: '100%', padding: 7, border: 'none', borderRadius: 6,
                      background: vars.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    }}>Aplicar rapido</button>
                  </div>
                  <DemoBadge />
                </div>

                {/* Notification */}
                <div
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(3deg) scale(1.05)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(3deg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)' }}
                  style={{
                    position: 'absolute', width: mid ? 190 : 220, top: mid ? 135 : 160, left: mid ? 120 : 150, zIndex: 7,
                    transform: 'rotate(3deg)',
                    background: vars.bgCard, borderRadius: 10, border: `1px solid ${vars.border}`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                    ...cardHoverStyle,
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C25B56', flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: vars.textSecondary, lineHeight: 1.3 }}>
                    <strong style={{ color: vars.textPrimary }}>Diego R.</strong> te invito a <strong style={{ color: vars.textPrimary }}>Grupo Fisica</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile hero cards — stacked vertically and clickable */}
          {compact && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'profile' as ModalType, label: 'Perfil Academico', desc: 'Tu trayectoria y logros', icon: '👤' },
                { key: 'chat' as ModalType, label: 'Mensajeria', desc: 'Chat en tiempo real', icon: '💬' },
                { key: 'docai' as ModalType, label: 'Asistente de Estudio', desc: 'Guias y resumenes', icon: '📄' },
                { key: 'feed' as ModalType, label: 'Feed Social', desc: 'Tu comunidad academica', icon: '📰' },
                { key: 'job' as ModalType, label: 'Bolsa de Empleo', desc: 'Practicas y trabajos', icon: '💼' },
              ].map(card => (
                <div
                  key={card.key}
                  onClick={() => setActiveModal(card.key)}
                  style={{
                    background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: vars.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: vars.textPrimary }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: vars.textMuted }}>{card.desc}</div>
                  </div>
                  <div style={{
                    background: 'rgba(45,98,200,0.1)', color: vars.accent,
                    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  }}>
                    Ver demo
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="comunidad" style={{ background: vars.bgCard, padding: compact ? '48px 16px' : '64px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: compact ? 22 : 26, fontWeight: 700, color: vars.textPrimary, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Todo lo que necesitas en un solo lugar
          </h2>
          <div style={{ fontSize: 13, color: vars.textMuted, marginBottom: 36 }}>
            Mas de 55 herramientas disenadas para tu exito academico y profesional
          </div>
          <div style={{
            display: 'flex',
            flexDirection: compact ? 'column' : 'row',
            gap: 1, background: vars.border, borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { num: '01', key: 'estudia' as ModalType, title: 'Estudia mejor', desc: 'Guias de estudio, quizzes adaptativos, flashcards con repeticion espaciada y herramientas interactivas.', bg: vars.accentLight, color: vars.accent, preview: <FlashcardMiniPreview /> },
              { num: '02', key: 'conecta' as ModalType, title: 'Conecta', desc: 'Comunidades por materia, mensajeria, mentorias, eventos de estudio y red social para estudiantes.', bg: '#E0E7FF', color: '#7B82B8', preview: <CommunityMiniPreview /> },
              { num: '03', key: 'crece' as ModalType, title: 'Crece', desc: 'Bolsa de empleo, CV profesional, tutorias, cursos de desarrollo integral.', bg: '#FEF3C7', color: '#C4882A', preview: <JobsMiniPreview /> },
            ].map(f => (
              <div
                key={f.num}
                onClick={() => setActiveModal(f.key)}
                style={{
                  flex: 1, background: vars.bgSecondary,
                  padding: compact ? '24px 20px' : '28px 24px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, background 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F0F2F5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = vars.bgSecondary }}
              >
                <div style={{ fontSize: 10, color: vars.textMuted, fontWeight: 500, marginBottom: 14 }}>{f.num}</div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {f.num === '01' && <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>}
                    {f.num === '02' && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                    {f.num === '03' && <><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>}
                  </svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: vars.textPrimary, marginBottom: 10 }}>{f.title}</h3>
                {f.preview}
                <p style={{ fontSize: 12, color: vars.textMuted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                <div style={{ marginTop: 12, fontSize: 11, color: vars.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Ver demo
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section style={{ padding: compact ? '36px 16px' : '48px 40px', background: vars.bgPrimary }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', justifyContent: 'center',
          gap: compact ? 32 : 56, flexWrap: 'wrap',
        }}>
          {[
            { val: '55+', lbl: 'Herramientas' },
            { val: '30', lbl: 'Cursos gratuitos' },
            { val: '40', lbl: 'Idiomas' },
            { val: 'CL', lbl: 'Hecho en Chile' },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: compact ? 24 : 28, fontWeight: 700, color: vars.textPrimary }}>{s.val}</div>
              <div style={{ fontSize: 12, color: vars.textMuted, marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="planes" style={{ background: vars.bgCard, padding: compact ? '48px 16px' : '64px 40px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: compact ? 22 : 26, fontWeight: 700, color: vars.textPrimary, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Planes para cada estudiante
          </h2>
          <div style={{ textAlign: 'center', fontSize: 13, color: vars.textMuted, marginBottom: 32 }}>
            Sin compromiso. Cancela cuando quieras.
          </div>
          <div style={{
            display: 'flex', gap: 1, background: vars.border,
            borderRadius: 14, overflow: 'hidden',
            flexDirection: compact ? 'column' : 'row',
          }}>
            {[
              { name: 'Basico', price: '$0', per: 'Siempre gratis', features: ['2 asignaturas', 'Red social', 'Cursos', '300 MB'], hl: false },
              { name: 'Pro', price: '$5', per: 'USD / mes', features: ['8 asignaturas', 'Herramientas avanzadas', 'Predictor de examen', '1 GB'], hl: true },
              { name: 'Max', price: '$13', per: 'USD / mes', features: ['Todo ilimitado', 'Grabar clases', 'Publicar empleos', '3 GB'], hl: false },
            ].map(plan => (
              <div key={plan.name} style={{
                flex: 1, padding: compact ? '24px 20px' : '28px 24px', position: 'relative',
                background: plan.hl ? vars.textPrimary : vars.bgSecondary,
                color: plan.hl ? '#fff' : vars.textPrimary,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: plan.hl ? 'rgba(255,255,255,0.5)' : vars.textMuted,
                }}>{plan.name}</div>
                {plan.hl && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: vars.accent, color: '#fff',
                    padding: '3px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600,
                  }}>RECOMENDADO</div>
                )}
                <div style={{
                  fontSize: 34, fontWeight: 800, margin: '6px 0 2px', letterSpacing: '-0.03em',
                  color: plan.hl ? '#fff' : vars.textPrimary,
                }}>{plan.price}</div>
                <div style={{
                  fontSize: 12, marginBottom: 18,
                  color: plan.hl ? 'rgba(255,255,255,0.4)' : vars.textMuted,
                }}>{plan.per}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, lineHeight: 2.2, color: plan.hl ? 'rgba(255,255,255,0.7)' : vars.textSecondary }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onRegister} style={{
                  marginTop: 18, width: '100%', padding: 10, borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font, minHeight: 44,
                  ...(plan.hl
                    ? { background: vars.accent, border: 'none', color: '#fff' }
                    : { background: 'transparent', border: `1.5px solid ${vars.border}`, color: vars.textSecondary }),
                }}>
                  {plan.name === 'Basico' ? 'Comenzar gratis' : `Elegir ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section style={{
        background: vars.textPrimary, padding: compact ? '48px 16px' : '64px 40px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: compact ? 24 : 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Unete a la comunidad</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
          Miles de estudiantes ya estan conectando, aprendiendo y creciendo juntos.
        </p>
        <button onClick={onRegister} style={{
          background: vars.accent, color: '#fff', padding: '13px 32px',
          borderRadius: 10, fontSize: 15, fontWeight: 600, border: 'none',
          cursor: 'pointer', fontFamily: font, width: compact ? '100%' : 'auto', maxWidth: 320, minHeight: 44,
        }}>
          Crear cuenta gratis
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        background: vars.bgCard, borderTop: `1px solid ${vars.border}`,
        padding: '20px 40px', textAlign: 'center', fontSize: 12, color: vars.textMuted,
      }}>
        Terminos - Privacidad - Contacto - © 2026 Conniku SpA - Hecho en Chile
      </footer>
    </div>
  )
}
