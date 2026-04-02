import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

export default function Mentorship({ onNavigate }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'find' | 'my' | 'become'>('find')
  const [mentors, setMentors] = useState<any[]>([])
  const [myMentors, setMyMentors] = useState<any[]>([])
  const [myMentees, setMyMentees] = useState<any[]>([])
  const [mentorProfile, setMentorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjects, setSubjects] = useState('')
  const [availability, setAvailability] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => { loadMentors() }, [])

  const loadMentors = async () => {
    setLoading(true)
    try { setMentors(await api.getMentors(search || undefined)) } catch {}
    setLoading(false)
  }
  const loadMy = async () => {
    try {
      setMyMentors(await api.getMyMentors())
      setMyMentees(await api.getMyMentees())
      setMentorProfile(await api.getMentorProfile())
    } catch {}
  }
  const handleBecomeMentor = async () => {
    const subjectList = subjects.split(',').map(s => s.trim()).filter(Boolean)
    if (subjectList.length === 0) { alert('Agrega al menos una materia'); return }
    try {
      await api.becomeMentor({ subjects: subjectList, availability, bio })
      alert('¡Perfil de mentor creado!')
      loadMy()
      setTab('my')
    } catch (err: any) { alert(err.message || 'Error') }
  }
  const handleRequest = async (mentorId: string) => {
    const subject = prompt('¿En qué materia necesitas mentoría?')
    if (!subject) return
    const message = prompt('Mensaje para el mentor (opcional):')
    try {
      await api.requestMentorship({ mentor_id: mentorId, subject, message: message || '' })
      alert('Solicitud enviada')
    } catch (err: any) { alert(err.message || 'Error') }
  }
  const handleAccept = async (id: string) => {
    try { await api.acceptMentorship(id); loadMy() } catch (err: any) { alert(err.message || 'Error') }
  }

  return (
    <>
      <div className="page-header">
        <h2>{'\u{1F9ED}'} Mentoría</h2>
        <p>Conecta con mentores experimentados o comparte tu conocimiento</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className={`tab ${tab === 'find' ? 'active' : ''}`} onClick={() => setTab('find')}>Buscar Mentor</button>
          <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => { setTab('my'); loadMy() }}>Mis Mentorías</button>
          <button className={`tab ${tab === 'become' ? 'active' : ''}`} onClick={() => setTab('become')}>Ser Mentor</button>
        </div>
      </div>
      <div className="page-body">
        {tab === 'find' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadMentors()} placeholder="Buscar por materia..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <button className="btn btn-primary" onClick={loadMentors}>Buscar</button>
            </div>
            {loading ? <div className="loading-dots"><span /><span /><span /></div> :
            mentors.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div style={{ fontSize: 48 }}>{'\u{1F9ED}'}</div><h3>No hay mentores disponibles</h3><p>¡Sé el primero en ofrecer mentoría!</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {mentors.map((m: any) => (
                  <div key={m.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div onClick={() => onNavigate(`/user/${m.mentor?.id}`)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, overflow: 'hidden', cursor: 'pointer' }}>
                        {m.mentor?.avatar ? <img src={m.mentor.avatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} /> : (m.mentor?.firstName?.[0] || '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{m.mentor?.firstName} {m.mentor?.lastName} {m.mentor?.isGraduated && '\u{1F393}'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.mentor?.career} · {m.mentor?.university}</div>
                      </div>
                    </div>
                    {m.bio && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>{m.bio.slice(0, 120)}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {m.subjects.map((s: string) => (
                        <span key={s} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{m.ratingCount > 0 ? `\u2B50 ${m.rating}/5 (${m.ratingCount})` : 'Sin reseñas'}</span>
                      <span>{m.currentMentees}/{m.maxMentees} mentoreados</span>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 12 }}
                      onClick={() => handleRequest(m.mentor?.id)} disabled={m.currentMentees >= m.maxMentees}>
                      {m.currentMentees >= m.maxMentees ? 'Cupo lleno' : 'Solicitar Mentoría'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === 'my' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myMentors.length > 0 && (
              <div><h3 style={{ fontSize: 15, marginBottom: 8 }}>Mis Mentores</h3>
                {myMentors.map((r: any) => (
                  <div key={r.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', overflow: 'hidden' }}>
                      {r.mentor?.avatar ? <img src={r.mentor.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : (r.mentor?.firstName?.[0] || '?')}
                    </div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{r.mentor?.firstName} {r.mentor?.lastName}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.subject || 'General'}</div></div>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: r.status === 'active' ? 'rgba(5,150,105,0.08)' : 'var(--bg-tertiary)', color: r.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {r.status === 'pending' ? '\u23F3 Pendiente' : r.status === 'active' ? '\u2705 Activa' : '\u2713 Completada'}
                    </span>
                  </div>
                ))}</div>
            )}
            {myMentees.length > 0 && (
              <div><h3 style={{ fontSize: 15, marginBottom: 8 }}>Mis Mentoreados</h3>
                {myMentees.map((r: any) => (
                  <div key={r.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', overflow: 'hidden' }}>
                      {r.mentee?.avatar ? <img src={r.mentee.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : (r.mentee?.firstName?.[0] || '?')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{r.mentee?.firstName} {r.mentee?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.subject || 'General'}{r.message ? ` — "${r.message.slice(0, 50)}"` : ''}</div>
                    </div>
                    {r.status === 'pending' && <button className="btn btn-primary btn-xs" onClick={() => handleAccept(r.id)}>Aceptar</button>}
                    {r.status === 'active' && <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>{'\u2705'} Activa</span>}
                  </div>
                ))}</div>
            )}
            {myMentors.length === 0 && myMentees.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}><div style={{ fontSize: 48 }}>{'\u{1F9ED}'}</div><h3>No tienes mentorías activas</h3></div>
            )}
          </div>
        )}
        {tab === 'become' && (
          <div className="card" style={{ padding: 24, maxWidth: 600 }}>
            <h3 style={{ marginTop: 0 }}>{'\u{1F9ED}'} Ser Mentor</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Comparte tu experiencia y ayuda a otros estudiantes. Ganas +50 XP por cada mentoría completada.</p>
            <div className="auth-field"><label>Materias que puedes mentorar *</label>
              <input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="Separadas por coma: Cálculo, Física, Programación" /></div>
            <div className="auth-field"><label>Disponibilidad</label>
              <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Ej: Lunes y Miércoles 3-5pm" /></div>
            <div className="auth-field"><label>Sobre ti como mentor</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="¿Por qué eres buen mentor? ¿Cuál es tu enfoque?"
                style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleBecomeMentor}>
              {mentorProfile ? 'Actualizar Perfil' : 'Registrarme como Mentor'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
