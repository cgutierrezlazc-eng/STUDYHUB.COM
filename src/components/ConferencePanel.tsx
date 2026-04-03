import React, { useState } from 'react'

const CONFERENCES = {
  live: [
    {
      initials: 'AC', name: 'Alejandro Cuesta', role: 'CEO, TechVentures Latam',
      title: 'Innovación y liderazgo en startups tecnológicas',
      desc: '15 años liderando equipos de producto en Silicon Valley y Latinoamérica. Ex VP de Producto en Rappi.',
      link: '#',
    },
  ],
  upcoming: [
    { initials: 'RM', name: 'Rodrigo Montoya', role: 'Gerente General, Deloitte Chile', title: 'De pasante a gerente: claves para acelerar tu carrera', desc: '20 años en consultoría estratégica. Mentor de jóvenes profesionales.', date: '10 ABR' },
    { initials: 'CL', name: 'Carolina Lagos', role: 'Directora de IA, Microsoft Latam', title: 'Inteligencia artificial y el futuro del trabajo', desc: 'Experta en transformación digital. Liderazgo de equipos de IA en 12 países.', date: '17 ABR' },
    { initials: 'MV', name: 'Martin Vargas', role: 'Fundador & CEO, EduStartup', title: 'Emprendimiento universitario: del aula al mercado', desc: 'Fundador de 3 startups exitosas. Inversionista ángel y mentor en Y Combinator.', date: '24 ABR' },
    { initials: 'PF', name: 'Paula Fernández', role: 'Head of Talent, Google Latam', title: 'Marca personal y networking estratégico', desc: 'Ha reclutado a más de 500 profesionales para Big Tech.', date: '8 MAY' },
  ],
  recorded: [
    { initials: 'JS', name: 'Javiera Silva', role: 'VP de RRHH, Falabella', title: 'Soft skills que las empresas buscan en 2026', desc: '28 de marzo, 2026 — 847 asistentes — 1h 23min' },
    { initials: 'DA', name: 'Diego Araya', role: 'CTO, MercadoLibre Chile', title: 'Cómo conseguir tu primer trabajo en tecnología', desc: '14 de marzo, 2026 — 1,203 asistentes — 1h 45min' },
  ],
}

export default function ConferencePanel() {
  const [open, setOpen] = useState(false)

  const cardStyle: React.CSSProperties = {
    display: 'flex', gap: 16, padding: 16, border: '1px solid var(--border)',
    borderRadius: 12, marginBottom: 12, alignItems: 'center', cursor: 'pointer',
    background: 'var(--bg-card)',
  }

  const avatarStyle: React.CSSProperties = {
    width: 50, height: 50, borderRadius: '50%',
    background: '#E8EDF7', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 16, fontWeight: 700,
    color: '#1A3A7A', flexShrink: 0,
  }

  return (
    <>
      {/* Sidebar tab */}
      <div onClick={() => setOpen(true)} style={{
        position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
        writingMode: 'vertical-rl', textOrientation: 'mixed',
        background: 'linear-gradient(180deg, #1A3A7A, #C4882A)',
        color: '#fff', padding: '16px 10px', borderRadius: '8px 0 0 8px',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        cursor: 'pointer', zIndex: 100, textTransform: 'uppercase',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.15)',
      }}>
        🎥 Conferencias
      </div>

      {/* Modal */}
      {open && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{
            maxWidth: 820, maxHeight: '85vh', overflowY: 'auto', padding: 0,
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1A3A7A 0%, #2D5FAA 50%, #C4882A 100%)',
              padding: 30, color: '#fff', position: 'relative',
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, margin: 0 }}>Conferencias Conniku</h2>
              <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>Charlas en vivo con líderes del mercado laboral, CEOs y profesionales con trayectoria internacional</p>
              <button onClick={() => setOpen(false)} style={{
                position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: '50%', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: '#fff', fontSize: 18,
              }}>×</button>
            </div>

            <div style={{ padding: '24px 30px' }}>
              {/* Live */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>En vivo ahora</div>
              {CONFERENCES.live.map((c, i) => (
                <div key={i} style={{ ...cardStyle, borderColor: '#FCA5A5', background: 'rgba(254,226,226,0.3)' }}>
                  <div style={{ ...avatarStyle, background: '#FEE2E2', color: '#DC2626' }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{c.title}</h4>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.name} — {c.role}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626' }}>EN VIVO</span>
                    <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 10, color: '#DC2626', fontWeight: 600, textDecoration: 'none', marginTop: 6 }}>
                      🔗 Unirse vía Zoom
                    </a>
                  </div>
                </div>
              ))}

              {/* Upcoming */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '20px 0 12px' }}>Próximas conferencias</div>
              {CONFERENCES.upcoming.map((c, i) => (
                <div key={i} style={cardStyle}>
                  <div style={avatarStyle}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{c.title}</h4>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.name} — {c.role}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#DBEAFE', color: '#2563EB', flexShrink: 0 }}>{c.date}</span>
                </div>
              ))}

              {/* Recorded */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '20px 0 12px' }}>Grabaciones disponibles</div>
              {CONFERENCES.recorded.map((c, i) => (
                <div key={i} style={{ ...cardStyle, opacity: 0.75 }}>
                  <div style={{ ...avatarStyle, background: '#F0F0F0', color: '#666' }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{c.title}</h4>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.name} — {c.role}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#F0F0F0', color: '#666', flexShrink: 0 }}>VER</span>
                </div>
              ))}

              {/* Info */}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', lineHeight: 1.6 }}>
                <strong>Sobre las conferencias:</strong> Las conferencias se realizan a través de Zoom. Al hacer clic en "Unirse", serás redirigido a la sala de Zoom en una nueva pestaña. No necesitas cuenta de Zoom para participar como asistente. Las grabaciones quedan disponibles para visualización posterior. Todos los usuarios (Free, Pro y Max) pueden participar.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
