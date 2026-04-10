import React, { useState } from 'react'

const font = "'Outfit', -apple-system, sans-serif"
const mono = "'JetBrains Mono', 'Fira Code', monospace"

function Logo({ light = false }: { light?: boolean }) {
  const c = light ? '#fff' : '#0A0A0A'
  const ac = '#2D62C8'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2D62C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 40 40" width={16} height={16}>
          <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" />
        </svg>
      </div>
      <span style={{ fontFamily: font, fontSize: 18, fontWeight: 700, letterSpacing: '-0.04em', color: c }}>
        conni<span style={{ color: ac }}>ku</span>
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   PROPUESTA D — Neo-Brutalist / Bold Editorial
   Inspired by: Resend, Railway, Linear
══════════════════════════════════════════════════ */
function ProposalD({ onRegister }: { onRegister: () => void }) {
  return (
    <div style={{ fontFamily: font, background: '#0A0A0A', color: '#fff', minHeight: '100vh', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes tickD { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .propD-stat:hover .propD-stat-num { color: #0066FF !important; }
        .propD-row:hover { background: rgba(0,102,255,0.06) !important; }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,4vw,48px)', height: 56, borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#0A0A0A', zIndex: 50 }}>
        <Logo light />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ background: 'none', border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font, padding: '7px 14px', borderRadius: 6 }}>Ingresar</button>
          <button onClick={onRegister} style={{ background: '#0066FF', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>Crear cuenta →</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(48px,8vw,80px) clamp(20px,4vw,48px) 0', maxWidth: 1100, margin: '0 auto', animation: 'slideUp 0.6s ease both' }}>
        {/* Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #2a2a2a', padding: '5px 12px', borderRadius: 4, marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>PLATAFORMA UNIVERSITARIA — CHILE</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(44px,8vw,96px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', margin: '0 0 32px', maxWidth: 860 }}>
          La plataforma que<br />
          <span style={{ color: '#0066FF' }}>merecías</span> en la<br />
          universidad.
        </h1>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 440, margin: 0 }}>
            Estudia con IA, conecta con tu carrera y construye tu futuro profesional — todo en un mismo lugar, diseñado para estudiantes universitarios chilenos.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onRegister} style={{ background: '#0066FF', color: '#fff', border: 'none', padding: '13px 24px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              Empezar gratis
            </button>
            <button style={{ background: 'none', border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.55)', padding: '13px 22px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font }}>
              Ver la plataforma
            </button>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', margin: '48px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {[['1,200+','Estudiantes activos'],['50+','Tutores verificados'],['12','Universidades'],['98%','Satisfacción']].map(([n,l], i) => (
          <div key={l} className="propD-stat" style={{ padding: '28px clamp(20px,4vw,48px)', borderRight: i < 3 ? '1px solid #1a1a1a' : 'none', cursor: 'default', transition: 'all 0.2s' }}>
            <div className="propD-stat-num" style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', transition: 'color 0.2s' }}>{n}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: mono }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Feature list */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px,7vw,72px) clamp(20px,4vw,48px)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 40, borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }}>
          <span style={{ fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.28)', letterSpacing: 1 }}>01 / FUNCIONALIDADES</span>
          <span style={{ flex: 1, height: 1, background: 'transparent' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
          {[
            { num: '01', title: 'Aprendizaje adaptativo', desc: 'Resúmenes generados con IA, rutas de estudio personalizadas y quizzes adaptativos que se ajustan a tu nivel.' },
            { num: '02', title: 'Red universitaria real', desc: 'Conecta con compañeros de carrera, forma grupos de estudio, accede a comunidades por ramo y encuentra mentores.' },
            { num: '03', title: 'Tutores verificados', desc: 'Sesiones 1:1 con tutores calificados de tu propia universidad. Certificados con código de verificación único.' },
            { num: '04', title: 'Bolsa de trabajo exclusiva', desc: 'Prácticas y empleos part-time para universitarios. CV integrado, sin necesidad de LinkedIn ni portales externos.' },
          ].map((f, i) => (
            <div key={f.num} className="propD-row" style={{ padding: '28px 0', borderBottom: '1px solid #1a1a1a', paddingRight: 32, transition: 'background 0.2s', borderLeft: i % 2 === 0 ? 'none' : '1px solid #1a1a1a', paddingLeft: i % 2 === 0 ? 0 : 32 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#0066FF', marginBottom: 14, letterSpacing: 1 }}>{f.num}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: '#fff', letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <div style={{ borderTop: '1px solid #1a1a1a', background: '#0066FF', padding: 'clamp(40px,6vw,64px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, color: '#fff' }}>Tu carrera universitaria,<br />sin límites.</h2>
          </div>
          <button onClick={onRegister} style={{ background: '#fff', color: '#0066FF', border: 'none', padding: '14px 30px', borderRadius: 6, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: font, flexShrink: 0 }}>
            Crear cuenta gratis →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   PROPUESTA E — Minimal / Swiss / Product-Led
   Inspired by: Linear.app, Vercel, Stripe
══════════════════════════════════════════════════ */
function ProposalE({ onRegister }: { onRegister: () => void }) {
  return (
    <div style={{ fontFamily: font, background: '#fff', color: '#0F172A', minHeight: '100vh', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes fadeInE { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .propE-card:hover { border-color: #2563EB !important; box-shadow: 0 0 0 1px #2563EB !important; }
        .propE-card { transition: all 0.18s; }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,4vw,48px)', height: 58, borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <Logo />
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748B', fontWeight: 500 }}>
          {['Plataforma','Tutores','Empleos','Precios'].map(l => (
            <span key={l} style={{ cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font, padding: '7px 12px' }}>Ingresar</button>
          <button onClick={onRegister} style={{ background: '#0F172A', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>Comenzar gratis</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px,10vw,112px) clamp(20px,5vw,48px) clamp(48px,6vw,72px)', textAlign: 'center', maxWidth: 800, margin: '0 auto', animation: 'fadeInE 0.7s ease both' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0F9FF', color: '#0284C7', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 28, border: '1px solid #BAE6FD' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
          847 estudiantes universitarios en línea
        </div>

        <h1 style={{ fontSize: 'clamp(38px,7vw,68px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.05em', margin: '0 0 22px', color: '#0F172A' }}>
          Estudia mejor.<br />
          Conecta de verdad.<br />
          <span style={{ color: '#2563EB' }}>Crece más rápido.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#64748B', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
          La plataforma académica que une aprendizaje con IA, red social universitaria y oportunidades profesionales reales.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <button onClick={onRegister} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 1px 3px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
            Comenzar gratis
          </button>
          <button style={{ background: '#fff', color: '#374151', border: '1px solid #E2E8F0', padding: '13px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
            Ver cómo funciona
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 0.3 }}>Sin tarjeta de crédito · Gratis para siempre</p>
      </section>

      {/* Product screenshot */}
      <div style={{ padding: '0 clamp(20px,5vw,48px)', maxWidth: 940, margin: '0 auto 72px' }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
          {/* Browser bar */}
          <div style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#F87171','#FBBF24','#34D399'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 5, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, maxWidth: 320, margin: '0 auto' }}>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>conniku.com/dashboard</span>
            </div>
          </div>
          {/* App UI mockup */}
          <div style={{ display: 'flex', height: 320 }}>
            {/* Sidebar */}
            <div style={{ width: 200, background: '#fff', borderRight: '1px solid #F1F5F9', padding: '20px 0', flexShrink: 0 }}>
              <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #F1F5F9', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 }}>ACADÉMICO</div>
                {['Dashboard','Cursos','Comunidades','Tutores'].map((item, i) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, background: i === 0 ? '#EFF6FF' : 'none', marginBottom: 2 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: i === 0 ? '#2563EB' : '#CBD5E1' }} />
                    <span style={{ fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#2563EB' : '#475569' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 }}>CARRERA</div>
                {['Empleos','Mi CV','Eventos'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, marginBottom: 2 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1' }} />
                    <span style={{ fontSize: 12, color: '#475569' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Main */}
            <div style={{ flex: 1, padding: 20, background: '#FAFAFA', overflowY: 'auto' }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Buenos días, Cristian</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Jueves 9 de abril — 3 tareas pendientes</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[['4','Materias','#2563EB'],['12d','Racha','#7C3AED'],['28h','Horas','#059669']].map(([v,l,c]) => (
                  <div key={l} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: c as string }}>{v}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Activity feed */}
              <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 10, letterSpacing: 0.5 }}>ACTIVIDAD RECIENTE</div>
                {[['Resumen IA generado','Cálculo II','#EFF6FF','#2563EB'],['Quizz completado','Física · 9/10','#F0FDF4','#059669'],['Conexión nueva','María J. · UAI','#F5F3FF','#7C3AED']].map(([a,b,bg,c]) => (
                  <div key={a} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 6, background: bg as string, marginBottom: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c as string }}>{a}</span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <section style={{ padding: '0 clamp(20px,5vw,48px) 72px', maxWidth: 940, margin: '0 auto' }}>
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Todo lo que necesitas.</h2>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>En un solo lugar.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {[
            { label: 'Aprendizaje con IA', desc: 'Resúmenes automáticos, rutas de estudio y quizzes adaptativos para aprender más en menos tiempo.', accent: '#2563EB' },
            { label: 'Red universitaria', desc: 'Comunidades por ramo, grupos de estudio, mensajería y conexiones con estudiantes de tu carrera.', accent: '#7C3AED' },
            { label: 'Tutores reales', desc: 'Sesiones presenciales u online con tutores de tu universidad. Ratings verificados, certificados únicos.', accent: '#0891B2' },
            { label: 'Empleos exclusivos', desc: 'Prácticas y trabajos part-time para universitarios. Tu CV profesional siempre listo.', accent: '#059669' },
          ].map(f => (
            <div key={f.label} className="propE-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '22px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 32, height: 3, borderRadius: 2, background: f.accent, marginBottom: 16 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>{f.label}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div style={{ background: '#0F172A', padding: 'clamp(48px,7vw,72px) clamp(20px,5vw,48px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 16px' }}>
          Únete a los mejores<br /><span style={{ color: '#60A5FA' }}>estudiantes de Chile.</span>
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28 }}>+1,200 universitarios ya usan Conniku. Sin costo, para siempre.</p>
        <button onClick={onRegister} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '13px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
          Crear cuenta gratis →
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   PROPUESTA F — Dark Premium / Iridescent
   Inspired by: Figma, Framer, Superhuman
══════════════════════════════════════════════════ */
function ProposalF({ onRegister }: { onRegister: () => void }) {
  return (
    <div style={{ fontFamily: font, background: '#050810', color: '#fff', minHeight: '100vh', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes auroraF { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes floatF { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes tickF { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .propF-glass:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(139,92,246,0.4) !important; }
        .propF-glass { transition: all 0.2s; }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,4vw,48px)', height: 58, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <Logo light />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font, padding: '7px 14px', borderRadius: 7 }}>Ingresar</button>
          <button onClick={onRegister} style={{ background: 'linear-gradient(135deg, #6D28D9, #2563EB)', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>Comenzar →</button>
        </div>
      </nav>

      {/* Hero — Aurora */}
      <section style={{ position: 'relative', padding: 'clamp(64px,10vw,96px) clamp(20px,5vw,48px) clamp(48px,6vw,64px)', textAlign: 'center', overflow: 'hidden' }}>
        {/* Aurora background */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(-45deg, rgba(109,40,217,0.25), rgba(37,99,235,0.2), rgba(6,182,212,0.18), rgba(139,92,246,0.22))', backgroundSize: '400% 400%', animation: 'auroraF 10s ease infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(109,40,217,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, margin: '0 auto' }}>
          {/* Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#C4B5FD', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, marginBottom: 32 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
            847 estudiantes universitarios en línea ahora
          </div>

          <h1 style={{ fontSize: 'clamp(40px,7.5vw,80px)', fontWeight: 900, lineHeight: 1.03, letterSpacing: '-0.05em', margin: '0 0 24px' }}>
            Construye tu<br />
            <span style={{ background: 'linear-gradient(135deg, #A78BFA, #60A5FA, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%', animation: 'auroraF 6s ease infinite' }}>futuro universitario</span><br />
            desde hoy.
          </h1>

          <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 36px' }}>
            Conniku reúne lo mejor del mundo académico y profesional en una sola plataforma, diseñada para universitarios chilenos.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onRegister} style={{ background: 'linear-gradient(135deg, #6D28D9, #2563EB)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 0 30px rgba(109,40,217,0.4)' }}>
              Crear cuenta gratis
            </button>
            <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '13px 22px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font }}>
              Explorar plataforma
            </button>
          </div>
        </div>
      </section>

      {/* Stats ticker */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', width: '100%', boxSizing: 'border-box', position: 'relative', height: 48 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', gap: 56, animation: 'tickF 20s linear infinite', whiteSpace: 'nowrap', height: 48, alignItems: 'center', paddingLeft: 32 }}>
          {[...Array(3)].map((_, ri) => (
            <React.Fragment key={ri}>
              {[['1,200+','Estudiantes'],['50+','Tutores'],['12','Universidades'],['98%','Satisfacción'],['3,400+','Cursos'],['847','En línea']].map(([n, l]) => (
                <div key={`${ri}-${l}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, background: 'linear-gradient(135deg, #A78BFA, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{n}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{l}</span>
                  <span style={{ color: 'rgba(255,255,255,0.1)', marginLeft: 20 }}>—</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Feature glass cards */}
      <section style={{ padding: 'clamp(56px,8vw,80px) clamp(20px,5vw,48px)', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, marginBottom: 14 }}>LO QUE CONNIKU TE DA</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Una plataforma que<br />trabaja contigo.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { title: 'IA para estudiar', sub: 'Resúmenes automáticos, quizzes adaptativos y rutas de aprendizaje personalizadas para cada ramo.', accent: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', dot: '#A78BFA' },
            { title: 'Red universitaria', sub: 'Comunidades activas, grupos de estudio, mensajería en tiempo real y conexiones con tu carrera.', accent: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', dot: '#60A5FA' },
            { title: 'Tutorías verificadas', sub: 'Tutores de tu propia universidad. Sesiones presenciales u online, con certificados únicos.', accent: 'linear-gradient(135deg, #0E7490, #06B6D4)', dot: '#67E8F9' },
            { title: 'Bolsa de trabajo', sub: 'Prácticas y empleos exclusivos para universitarios. CV profesional integrado, listo para usar.', accent: 'linear-gradient(135deg, #065F46, #10B981)', dot: '#6EE7B7' },
          ].map(f => (
            <div key={f.title} className="propF-glass" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: f.accent, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.85)' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 9px', color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, margin: 0 }}>{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof row */}
      <section style={{ padding: '0 clamp(20px,5vw,48px) clamp(56px,8vw,80px)', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: 'clamp(28px,4vw,40px)', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>Únete a estudiantes de</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['UC','UCH','UAI','USM','UDP','USACH'].map(u => (
                <span key={u} style={{ fontSize: 12, fontWeight: 700, color: '#C4B5FD', background: 'rgba(109,40,217,0.2)', padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(139,92,246,0.25)' }}>{u}</span>
              ))}
            </div>
          </div>
          <button onClick={onRegister} style={{ background: 'linear-gradient(135deg, #6D28D9, #2563EB)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font, flexShrink: 0, boxShadow: '0 0 24px rgba(109,40,217,0.35)' }}>
            Crear cuenta gratis →
          </button>
        </div>
      </section>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   WRAPPER
══════════════════════════════════════════════════ */
export default function LandingProposals() {
  const [active, setActive] = useState<'D' | 'E' | 'F'>('D')

  const tabs: { id: 'D' | 'E' | 'F'; label: string }[] = [
    { id: 'D', label: 'D — Neo-Brutal' },
    { id: 'E', label: 'E — Minimal Pro' },
    { id: 'F', label: 'F — Dark Premium' },
  ]

  return (
    <div style={{ position: 'relative', fontFamily: font, width: '100%', overflowX: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderRadius: 12, padding: '5px 6px', display: 'flex', gap: 3, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{ background: active === t.id ? '#2D62C8' : 'transparent', color: active === t.id ? '#fff' : 'rgba(255,255,255,0.4)', border: 'none', padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font, transition: 'all 0.18s', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {active === 'D' && <ProposalD onRegister={() => {}} />}
        {active === 'E' && <ProposalE onRegister={() => {}} />}
        {active === 'F' && <ProposalF onRegister={() => {}} />}
      </div>
    </div>
  )
}
