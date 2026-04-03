import React from 'react'
import { useDevice } from '../hooks/useDevice'

interface Props {
  onLogin: () => void
  onRegister: () => void
}

/* Conniku logomark — blue square with open circle */
function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.29,
      background: '#1A3A7A', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(26,58,122,0.35)', flexShrink: 0,
    }}>
      <svg viewBox="0 0 40 40" width={size * 0.58} height={size * 0.58}>
        <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" />
      </svg>
    </div>
  )
}

function LogoType({ size = 36 }: { size?: number }) {
  return (
    <span style={{ fontSize: size, fontWeight: 700, color: '#151B1E', letterSpacing: '-0.05em', lineHeight: 1 }}>
      conni<span style={{ color: '#1A3A7A' }}>ku</span>
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

export default function Landing({ onLogin, onRegister }: Props) {
  const { isMobile, isTablet } = useDevice()
  const compact = isMobile
  const mid = isTablet

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

  return (
    <div style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden', background: vars.bgPrimary, position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', fontFamily: font }}>

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
            {['Plataforma', 'Planes', 'Comunidad', 'Cursos', 'Empleo'].map(item => (
              <a key={item} href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onLogin} style={{ background: 'none', border: 'none', color: vars.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font }}>
            {compact ? 'Ingresar' : 'Iniciar Sesión'}
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
      <section style={{ background: vars.bgPrimary, padding: compact ? '48px 16px' : mid ? '56px 28px' : '72px 40px' }}>
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
              La plataforma todo-en-uno para tu vida universitaria. Estudia de forma interactiva, conecta con tu comunidad, y prepárate para tu futuro profesional.
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

          {/* Right — Hero showcase cards */}
          {!compact && (
            <div style={{ flex: 1, maxWidth: mid ? 380 : 520 }}>
              <div style={{ position: 'relative', height: mid ? 380 : 480 }}>
                {/* Profile card */}
                <div style={{
                  position: 'absolute', width: mid ? 155 : 185, top: 0, left: 0, zIndex: 3,
                  transform: 'rotate(-3deg)',
                  background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                }}>
                  <div style={{ height: 44, background: 'linear-gradient(135deg, #1A3A7A, #2D62C8)' }} />
                  <div style={{ padding: '0 12px 12px', textAlign: 'center' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', border: `3px solid ${vars.bgCard}`,
                      margin: '-20px auto 4px', backgroundImage: "url('https://i.pravatar.cc/150?img=5')",
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: vars.textPrimary }}>Ana Torres</div>
                    <div style={{ fontSize: 9, color: vars.textMuted, marginBottom: 6 }}>PUC · Medicine · 6th sem</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                      {[{ n: '142', l: 'Posts' }, { n: '1.2k', l: 'Friends' }, { n: '89', l: 'Docs' }].map(s => (
                        <div key={s.l} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: vars.textPrimary, lineHeight: 1.2 }}>{s.n}</div>
                          <div style={{ fontSize: 8, color: vars.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat card */}
                <div style={{
                  position: 'absolute', width: mid ? 195 : 230, top: 10, right: 0, zIndex: 4,
                  transform: 'rotate(2deg)',
                  background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${vars.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: vars.textPrimary }}>Carlos M.</span>
                    <span style={{ fontSize: 9, color: vars.textMuted, marginLeft: 'auto' }}>now</span>
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    {[
                      { text: 'Do you have the study guide?', sent: false },
                      { text: 'Yes! Sending it now', sent: true },
                      { text: "You're the best!", sent: false },
                    ].map((m, i) => (
                      <div key={i} style={{
                        padding: '6px 10px', borderRadius: 10, fontSize: 10, maxWidth: '85%', marginBottom: 4, lineHeight: 1.4,
                        ...(m.sent
                          ? { background: vars.accent, color: '#fff', marginLeft: 'auto', borderBottomRightRadius: 3 }
                          : { background: vars.bgPrimary, color: vars.textSecondary, borderBottomLeftRadius: 3 }),
                      }}>{m.text}</div>
                    ))}
                  </div>
                </div>

                {/* Doc AI card */}
                <div style={{
                  position: 'absolute', width: mid ? 190 : 220, top: mid ? 165 : 200, left: mid ? -5 : -10, zIndex: 5,
                  transform: 'rotate(1.5deg)',
                  background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${vars.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: vars.accentLight, color: vars.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: vars.textPrimary }}>Ask your docs</span>
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: vars.bgPrimary, borderRadius: 8, padding: '6px 8px', marginBottom: 6 }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C25B56" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: vars.textPrimary }}>Organic_Chem.pdf</div>
                        <div style={{ fontSize: 8, color: vars.textMuted }}>24 pages</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: vars.textMuted, marginBottom: 4, fontStyle: 'italic' }}>"Key reactions in Ch. 5?"</div>
                    <div style={{
                      fontSize: 10, color: vars.textPrimary, lineHeight: 1.4,
                      background: 'linear-gradient(135deg, rgba(45,98,200,0.06), rgba(45,98,200,0.02))',
                      borderLeft: `2px solid ${vars.accent}`, padding: '6px 8px', borderRadius: '0 6px 6px 0',
                    }}>
                      Nucleophilic substitution (SN1/SN2), elimination (E1/E2), and addition to alkenes...
                    </div>
                  </div>
                </div>

                {/* Feed card */}
                <div style={{
                  position: 'absolute', width: mid ? 195 : 230, top: mid ? 185 : 220, right: 10, zIndex: 2,
                  transform: 'rotate(-2deg)',
                  background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundImage: "url('https://i.pravatar.cc/150?img=15')", backgroundSize: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: vars.textPrimary }}>Diego Ruiz</div>
                        <div style={{ fontSize: 8, color: vars.textMuted }}>USACH · 2h ago</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: vars.textSecondary, lineHeight: 1.4, marginBottom: 6 }}>
                      Study group this Saturday! Who's in? Already 8 confirmed.
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 9, color: vars.textMuted }}>
                      <span>34</span><span>12</span><span>Share</span>
                    </div>
                  </div>
                </div>

                {/* Job card */}
                <div style={{
                  position: 'absolute', width: mid ? 165 : 190, bottom: 10, left: 60, zIndex: 6,
                  transform: 'rotate(-1.5deg)',
                  background: vars.bgCard, borderRadius: 12, border: `1px solid ${vars.border}`,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.09)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{
                      display: 'inline-block', fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', background: '#DCFCE7', color: '#15803D',
                      padding: '2px 8px', borderRadius: 6, marginBottom: 6,
                    }}>New</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: vars.textPrimary, marginBottom: 2 }}>Junior Developer</div>
                    <div style={{ fontSize: 10, color: vars.textMuted, marginBottom: 6 }}>TechCorp · Remote · Part-time</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      {['React', 'TypeScript', 'Students OK'].map(t => (
                        <span key={t} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: vars.bgPrimary, color: vars.textMuted }}>{t}</span>
                      ))}
                    </div>
                    <button style={{
                      width: '100%', padding: 5, border: 'none', borderRadius: 6,
                      background: vars.accent, color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer',
                    }}>Quick Apply</button>
                  </div>
                </div>

                {/* Notification */}
                <div style={{
                  position: 'absolute', width: 180, top: mid ? 110 : 130, left: mid ? 110 : 140, zIndex: 7,
                  transform: 'rotate(3deg)',
                  background: vars.bgCard, borderRadius: 10, border: `1px solid ${vars.border}`,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C25B56', flexShrink: 0 }} />
                  <div style={{ fontSize: 9, color: vars.textSecondary, lineHeight: 1.3 }}>
                    <strong style={{ color: vars.textPrimary }}>Diego R.</strong> invited you to <strong style={{ color: vars.textPrimary }}>Physics Study Group</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ background: vars.bgCard, padding: compact ? '48px 16px' : '64px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: compact ? 22 : 26, fontWeight: 700, color: vars.textPrimary, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Todo lo que necesitas en un solo lugar
          </h2>
          <div style={{ fontSize: 13, color: vars.textMuted, marginBottom: 36 }}>
            Más de 55 herramientas diseñadas para tu éxito académico y profesional
          </div>
          <div style={{
            display: compact ? 'flex' : 'flex',
            flexDirection: compact ? 'column' : 'row',
            gap: 1, background: vars.border, borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { num: '01', title: 'Estudia mejor', desc: 'Guías de estudio, quizzes adaptativos, flashcards con repetición espaciada y herramientas interactivas.', bg: vars.accentLight, color: vars.accent },
              { num: '02', title: 'Conecta', desc: 'Comunidades por materia, mensajería, mentorías, eventos de estudio y red social para estudiantes.', bg: '#E0E7FF', color: '#7B82B8' },
              { num: '03', title: 'Crece', desc: 'Bolsa de empleo, CV profesional, tutorías, cursos de desarrollo integral.', bg: '#FEF3C7', color: '#C4882A' },
            ].map(f => (
              <div key={f.num} style={{ flex: 1, background: vars.bgSecondary, padding: compact ? '24px 20px' : '28px 24px' }}>
                <div style={{ fontSize: 10, color: vars.textMuted, fontWeight: 500, marginBottom: 14 }}>{f.num}</div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {f.num === '01' && <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>}
                    {f.num === '02' && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                    {f.num === '03' && <><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>}
                  </svg>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: vars.textPrimary, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: vars.textMuted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
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
      <section style={{ background: vars.bgCard, padding: compact ? '48px 16px' : '64px 40px' }}>
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
              { name: 'Básico', price: '$0', per: 'Siempre gratis', features: ['2 asignaturas', 'Red social', 'Cursos', '300 MB'], hl: false },
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
                  {plan.name === 'Básico' ? 'Comenzar gratis' : `Elegir ${plan.name}`}
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
        <h2 style={{ fontSize: compact ? 24 : 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Únete a la comunidad</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
          Miles de estudiantes ya están conectando, aprendiendo y creciendo juntos.
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
        Términos · Privacidad · Contacto · © 2026 Conniku SpA · Hecho en Chile
      </footer>
    </div>
  )
}
