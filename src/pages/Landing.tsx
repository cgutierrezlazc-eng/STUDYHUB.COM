import React from 'react'
import { useDevice } from '../hooks/useDevice'

interface Props {
  onLogin: () => void
  onRegister: () => void
}

export default function Landing({ onLogin, onRegister }: Props) {
  const { isMobile, isTablet } = useDevice()
  const compact = isMobile
  const mid = isTablet
  const px = compact ? 16 : mid ? 28 : 40

  return (
    <div style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden', background: '#FAFAF8', position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '0 16px' : `0 ${px}px`, height: compact ? 56 : 64,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <img src="/logo.svg" alt="Conniku" style={{ height: compact ? 28 : 36 }} />
        {!compact && (
          <div style={{ display: 'flex', gap: mid ? 16 : 32, alignItems: 'center' }}>
            {!mid && (
              <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#475467' }}>
                {['Plataforma', 'Planes', 'Comunidad', 'Cursos', 'Empleo'].map(item => (
                  <a key={item} href="#" onClick={e => e.preventDefault()} style={{ color: '#475467', textDecoration: 'none', fontWeight: 500 }}>{item}</a>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={onLogin} style={{ background: 'none', border: 'none', color: '#475467', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Iniciar Sesión</button>
              <button onClick={onRegister} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Crear cuenta gratis</button>
            </div>
          </div>
        )}
        {compact && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={onLogin} style={{ background: 'none', border: 'none', color: '#475467', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '8px' }}>Ingresar</button>
            <button onClick={onRegister} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Registrarse</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{
        width: '100%',
        background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 30%, #C7D2FE 60%, #DDD6FE 100%)',
        padding: compact ? '48px 16px' : mid ? '60px 28px' : '80px 40px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: compact ? 'flex-start' : 'center',
          gap: compact ? 32 : 48,
          flexDirection: compact ? 'column' : 'row',
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: compact ? 32 : mid ? 36 : 44,
              fontWeight: 800, color: '#1D2939', lineHeight: 1.15,
              margin: '0 0 20px', letterSpacing: '-0.02em',
            }}>
              Donde los estudiantes{!compact && <br />} se conectan, aprenden{!compact && <br />} y crecen
            </h1>
            <p style={{ fontSize: compact ? 15 : 17, color: '#475467', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 480 }}>
              La plataforma todo-en-uno para tu vida universitaria. Estudia de forma interactiva, conecta con tu comunidad, y prepárate para tu futuro profesional.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flexDirection: compact ? 'column' : 'row' }}>
              <button onClick={onRegister} style={{
                background: '#2563EB', color: '#fff', border: 'none',
                padding: compact ? '14px 24px' : '14px 32px', borderRadius: 8,
                fontSize: 16, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                width: compact ? '100%' : 'auto',
              }}>
                Comenzar gratis
              </button>
              <button onClick={onRegister} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#FFFFFF', color: '#1D2939', border: '1px solid #E5E7EB',
                padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                width: compact ? '100%' : 'auto',
              }}>
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuar con Google
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 16, textAlign: compact ? 'center' : 'left' }}>
              Gratis por 7 días · Sin tarjeta de crédito · <a href="#planes" style={{ color: '#2563EB', textDecoration: 'underline', textUnderlineOffset: 3 }}>Ver planes</a>
            </p>
          </div>

          {/* Video/Tour — hidden on mobile */}
          {!compact && (
            <div style={{ flex: 1, maxWidth: mid ? 360 : 560 }}>
              <div style={{
                background: '#1E293B', borderRadius: 16, overflow: 'hidden',
                aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              }}>
                <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', cursor: 'pointer', fontSize: 28 }}>
                    ▶
                  </div>
                  <p style={{ fontSize: 15, opacity: 0.8, margin: 0 }}>Ver tour de la plataforma</p>
                  <p style={{ fontSize: 12, opacity: 0.5, margin: '4px 0 0' }}>2 min</p>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(37,99,235,0.12), transparent)' }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#FFFFFF', padding: compact ? '48px 16px' : `72px ${px}px` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: compact ? 22 : 28, fontWeight: 700, color: '#1D2939', margin: '0 0 8px' }}>Todo lo que necesitas en un solo lugar</h2>
          <p style={{ textAlign: 'center', fontSize: compact ? 13 : 15, color: '#98A2B3', margin: '0 0 40px' }}>Más de 55 herramientas diseñadas para tu éxito académico y profesional</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr' : mid ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: compact ? 24 : 32,
          }}>
            {[
              { emoji: '📚', title: 'Estudia Mejor', desc: 'Guías de estudio, quizzes adaptativos, flashcards con repetición espaciada y herramientas interactivas generadas desde tus documentos.' },
              { emoji: '👥', title: 'Conecta', desc: 'Comunidades por materia, mensajería, mentorías, eventos de estudio y una red social diseñada para estudiantes.' },
              { emoji: '💼', title: 'Crece', desc: 'Bolsa de empleo, CV profesional, tutorías, cursos de desarrollo integral y preparación para tu futuro.' },
            ].map(f => (
              <div key={f.title} style={{ textAlign: 'center', padding: compact ? 16 : 24 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1D2939', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#475467', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: compact ? '40px 16px' : `56px ${px}px`, background: '#F5F3EF' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: compact ? 24 : 56,
          textAlign: 'center',
        }}>
          {[
            { value: '55+', label: 'Herramientas' },
            { value: '30', label: 'Cursos gratuitos' },
            { value: '40', label: 'Idiomas' },
            { value: '🇨🇱', label: 'Hecho en Chile' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: compact ? 26 : 32, fontWeight: 700, color: '#1D2939' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#98A2B3', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="planes" style={{ background: '#FFFFFF', padding: compact ? '48px 16px' : `72px ${px}px` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: compact ? 22 : 28, fontWeight: 700, color: '#1D2939', margin: '0 0 32px' }}>Planes para cada estudiante</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr' : mid ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {[
              { name: 'Básico', price: '$0', period: 'Siempre gratis', features: ['2 asignaturas', 'Red social', 'Cursos de desarrollo', '300 MB'], color: '#98A2B3' },
              { name: 'Pro', price: '$5', period: 'USD/mes', features: ['8 asignaturas', 'Herramientas avanzadas', 'Predictor de examen', '1 GB'], color: '#2563EB', popular: true },
              { name: 'Max', price: '$13', period: 'USD/mes', features: ['Todo ilimitado', 'Grabar y transcribir clases', 'Publicar empleos', '3 GB'], color: '#7C3AED' },
            ].map(plan => (
              <div key={plan.name} style={{
                padding: compact ? 24 : 28, borderRadius: 12, textAlign: 'center',
                border: (plan as any).popular ? `2px solid ${plan.color}` : '1px solid #E5E7EB',
                position: 'relative', background: '#FFFFFF',
              }}>
                {(plan as any).popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', padding: '4px 14px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>MÁS POPULAR</div>}
                <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan.name}</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1D2939' }}>{plan.price}</div>
                <div style={{ fontSize: 13, color: '#98A2B3', marginBottom: 20 }}>{plan.period}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: '#475467', lineHeight: 2.4 }}>
                  {plan.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                <button onClick={onRegister} style={{
                  marginTop: 20, width: '100%', padding: '10px 20px', borderRadius: 8,
                  border: (plan as any).popular ? 'none' : `1px solid ${plan.color}`,
                  background: (plan as any).popular ? plan.color : 'transparent',
                  color: (plan as any).popular ? '#fff' : plan.color,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  minHeight: 44,
                }}>
                  {plan.name === 'Básico' ? 'Comenzar gratis' : `Elegir ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Universities */}
      <section style={{ padding: compact ? '32px 16px' : '48px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#98A2B3', marginBottom: 12 }}>Estudiantes de las principales universidades de Chile</p>
        <p style={{ fontSize: compact ? 12 : 14, color: '#6B7080', letterSpacing: '0.03em', lineHeight: 1.8 }}>
          UNAB · USS · UCN · UDP · PUC · USACH · U. de Chile · UDD · UAI · UST
        </p>
      </section>

      {/* Final CTA */}
      <section style={{ background: '#1E293B', padding: compact ? '48px 16px' : '72px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: compact ? 24 : 32, fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>Únete a la comunidad</h2>
        <p style={{ fontSize: compact ? 14 : 16, color: '#94A3B8', margin: '0 0 32px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>Miles de estudiantes ya están conectando, aprendiendo y creciendo juntos.</p>
        <button onClick={onRegister} style={{
          background: '#2563EB', color: '#fff', border: 'none',
          padding: compact ? '14px 28px' : '14px 36px', borderRadius: 8,
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          width: compact ? '100%' : 'auto', maxWidth: 320,
          minHeight: 44,
        }}>
          Crear cuenta gratis
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: compact ? '20px 16px' : '24px 40px', textAlign: 'center',
        fontSize: 12, color: '#98A2B3', background: '#FFFFFF', borderTop: '1px solid #E5E7EB',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
          <a href="#" style={{ color: '#98A2B3', textDecoration: 'none' }}>Términos</a>
          <a href="#" style={{ color: '#98A2B3', textDecoration: 'none' }}>Privacidad</a>
          <a href="#" style={{ color: '#98A2B3', textDecoration: 'none' }}>Contacto</a>
        </div>
        <p style={{ margin: 0 }}>© 2026 Conniku SpA · Hecho en Chile 🇨🇱</p>
      </footer>
    </div>
  )
}
