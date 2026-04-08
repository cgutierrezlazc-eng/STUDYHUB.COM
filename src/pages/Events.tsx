import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { Calendar, Link, Users } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const EVENT_TYPES = [
  { value: 'study_session', label: 'Sesión de Estudio', color: 'var(--accent-blue)' },
  { value: 'exam_prep', label: 'Preparación de Examen', color: 'var(--accent-orange)' },
  { value: 'tutoring', label: 'Tutoría', color: 'var(--accent-green)' },
  { value: 'social', label: 'Social', color: 'var(--accent-purple)' },
]

export default function Events({ onNavigate }: Props) {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'my'>('upcoming')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'study_session',
    location: '', meeting_link: '', start_time: '', end_time: '', max_attendees: '',
  })

  useEffect(() => { loadEvents() }, [tab])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await api.getEvents(tab === 'my')
      setEvents(Array.isArray(data) ? data : [])
    } catch (err: any) { console.error('Failed to load events:', err) }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.title || !form.start_time) { alert('Título y fecha son obligatorios'); return }
    try {
      await api.createEvent({
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      })
      setShowCreate(false)
      setForm({ title: '', description: '', event_type: 'study_session', location: '', meeting_link: '', start_time: '', end_time: '', max_attendees: '' })
      loadEvents()
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleRsvp = async (eventId: string, status: string) => {
    try {
      const result = await api.rsvpEvent(eventId, status)
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, userRsvp: status, attendeeCount: result.attendeeCount } : e))
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2>{Calendar({ size: 20 })} Eventos</h2><p>Sesiones de estudio, preparacion de examenes y mas</p></div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear Evento</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Próximos</button>
          <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>Mis Eventos</button>
        </div>
      </div>
      <div className="page-body">
        {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div> :
        events.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">{Calendar({ size: 48 })}</div>
            <h3>No hay eventos {tab === 'my' ? 'registrados' : 'proximos'}</h3>
            <p>Crea uno para estudiar con la comunidad</p>
            <button className="btn btn-primary empty-state-cta" onClick={() => setShowCreate(true)}>+ Crear Evento</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(event => {
              const typeInfo = EVENT_TYPES.find(t => t.value === event.eventType) || EVENT_TYPES[0]
              return (
                <div key={event.id} className="u-card hover-lift" style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: typeInfo.color, fontWeight: 700, textTransform: 'uppercase' }}>
                      {new Date(event.startTime).toLocaleDateString('es', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                      {new Date(event.startTime).getDate()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatTime(event.startTime)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 15 }}>{event.title}</h4>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: `${typeInfo.color}15`, color: typeInfo.color }}>{typeInfo.label}</span>
                    </div>
                    {event.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>{event.description.slice(0, 120)}</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {event.location && <span>{event.location}</span>}
                      {event.meetingLink && <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{Link({ size: 14 })} Unirse</a>}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{Users({ size: 14 })} {event.attendeeCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''} asistentes</span>
                      {event.organizer && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          background: event.organizer.avatar ? `url(${event.organizer.avatar}) center/cover` : 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 9, fontWeight: 700,
                        }}>{!event.organizer.avatar && (event.organizer.firstName?.[0] || '?')}</span>
                        {event.organizer.firstName}
                      </span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {event.userRsvp === 'going' ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRsvp(event.id, 'not_going')}>✓ Asistiendo</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleRsvp(event.id, 'going')}>Asistir</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Crear Evento</h3>
              <div className="auth-field"><label>Título *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Repaso de Cálculo para el parcial" autoFocus /></div>
              <div className="auth-field"><label>Tipo</label>
                <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field"><label>Inicio *</label><input type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} style={{ colorScheme: 'dark' }} /></div>
                <div className="auth-field"><label>Fin</label><input type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} style={{ colorScheme: 'dark' }} /></div>
              </div>
              <div className="auth-field"><label>Ubicación / Lugar</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Virtual, Biblioteca, Sala 101..." /></div>
              <div className="auth-field"><label>Link de reunión (Zoom, Meet...)</label><input value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} placeholder="https://zoom.us/j/..." /></div>
              <div className="auth-field"><label>Descripción</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="¿Qué van a estudiar? ¿Qué llevar?"
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Evento</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
