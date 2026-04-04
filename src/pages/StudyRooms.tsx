import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

export default function StudyRooms({ onNavigate }: Props) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [pomodoroTime, setPomodoroTime] = useState(0)
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work')
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [totalStudyMin, setTotalStudyMin] = useState(0)
  const timerRef = useRef<any>(null)
  const [form, setForm] = useState({
    name: '', description: '', room_type: 'pomodoro', subject: '',
    max_participants: 10, pomodoro_work_min: 25, pomodoro_break_min: 5,
  })

  useEffect(() => { loadRooms() }, [])

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      timerRef.current = setTimeout(() => setPomodoroTime(t => t - 1), 1000)
    } else if (pomodoroRunning && pomodoroTime === 0) {
      if (pomodoroPhase === 'work') {
        setTotalStudyMin(m => m + (activeRoom?.pomodoroWorkMin || 25))
        setPomodoroPhase('break')
        setPomodoroTime((activeRoom?.pomodoroBreakMin || 5) * 60)
      } else {
        setPomodoroPhase('work')
        setPomodoroTime((activeRoom?.pomodoroWorkMin || 25) * 60)
      }
    }
    return () => clearTimeout(timerRef.current)
  }, [pomodoroRunning, pomodoroTime])

  const loadRooms = async () => {
    try { setRooms(await api.getStudyRooms()) } catch (err: any) { console.error('Failed to load study rooms:', err) }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name) return
    try {
      const room = await api.createStudyRoom(form)
      setShowCreate(false)
      setActiveRoom(room)
      setPomodoroTime(room.pomodoroWorkMin * 60)
      setForm({ name: '', description: '', room_type: 'pomodoro', subject: '', max_participants: 10, pomodoro_work_min: 25, pomodoro_break_min: 5 })
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleJoin = async (room: any) => {
    try {
      const result = await api.joinStudyRoom(room.id)
      setActiveRoom({ ...room, meetingUrl: result.meetingUrl })
      setPomodoroTime((room.pomodoroWorkMin || 25) * 60)
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleLeave = async () => {
    if (!activeRoom) return
    setPomodoroRunning(false)
    try { await api.leaveStudyRoom(activeRoom.id, totalStudyMin) } catch (err: any) { console.error('Failed to leave study room:', err) }
    setActiveRoom(null)
    setTotalStudyMin(0)
    loadRooms()
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // Active room view
  if (activeRoom) {
    return (
      <>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>📚 {activeRoom.name}</h2>
              <p>{activeRoom.subject || 'Sesión de estudio'} · {activeRoom.currentParticipants || 1} participantes</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLeave}>Salir de la Sala</button>
          </div>
        </div>
        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Pomodoro Timer */}
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: pomodoroPhase === 'work' ? 'var(--accent)' : 'var(--accent-green)', marginBottom: 8 }}>
              {pomodoroPhase === 'work' ? '🎯 Enfoque' : '☕ Descanso'}
            </div>
            <div style={{ fontSize: 72, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', lineHeight: 1 }}>
              {fmtTime(pomodoroTime)}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className={`btn ${pomodoroRunning ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setPomodoroRunning(!pomodoroRunning)}>
                {pomodoroRunning ? '⏸ Pausar' : '▶ Iniciar'}
              </button>
              <button className="btn btn-secondary" onClick={() => {
                setPomodoroTime((activeRoom.pomodoroWorkMin || 25) * 60)
                setPomodoroPhase('work')
                setPomodoroRunning(false)
              }}>↺ Reiniciar</button>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              Tiempo estudiado hoy: {totalStudyMin} minutos
            </div>
          </div>

          {/* Video Link */}
          {activeRoom.meetingUrl && (
            <div className="card" style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: 500 }}>
              <h4 style={{ marginTop: 0 }}>🎥 Videollamada</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estudia con cámara prendida para mantener el enfoque</p>
              <a href={activeRoom.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Unirse a la Videollamada
              </a>
            </div>
          )}
        </div>
      </>
    )
  }

  // Room list
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>📚 Salas de Estudio</h2>
            <p>Estudia en grupo con temporizador Pomodoro y videollamada</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear Sala</button>
        </div>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-dots"><span /><span /><span /></div> :
        rooms.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>📚</div>
            <h3>No hay salas activas</h3>
            <p>Crea una sala para estudiar con la comunidad</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {rooms.map(room => (
              <div key={room.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 15 }}>{room.name}</h4>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: room.roomType === 'pomodoro' ? 'rgba(37,99,235,0.08)' : 'var(--bg-tertiary)', color: room.roomType === 'pomodoro' ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {room.roomType === 'pomodoro' ? '🍅 Pomodoro' : room.roomType === 'focus' ? '🎯 Enfoque' : '💬 Libre'}
                  </span>
                </div>
                {room.subject && <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>{room.subject}</div>}
                {room.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>{room.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>👥 {room.currentParticipants}/{room.maxParticipants}</span>
                  {room.host && <span>Host: {room.host.firstName}</span>}
                  {room.roomType === 'pomodoro' && <span>🍅 {room.pomodoroWorkMin}/{room.pomodoroBreakMin} min</span>}
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 12 }}
                  onClick={() => handleJoin(room)} disabled={room.currentParticipants >= room.maxParticipants}>
                  {room.currentParticipants >= room.maxParticipants ? 'Sala Llena' : 'Unirse'}
                </button>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Crear Sala de Estudio</h3>
              <div className="auth-field"><label>Nombre de la sala *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Repaso Cálculo - Parcial 2" autoFocus /></div>
              <div className="auth-field"><label>Materia</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Ej: Cálculo II" /></div>
              <div className="auth-field"><label>Tipo de sala</label>
                <select value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="pomodoro">🍅 Pomodoro (trabajo + descanso)</option>
                  <option value="focus">🎯 Enfoque Continuo</option>
                  <option value="free">💬 Libre</option>
                </select></div>
              {form.room_type === 'pomodoro' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="auth-field"><label>Trabajo (min)</label>
                    <input type="number" value={form.pomodoro_work_min} onChange={e => setForm({...form, pomodoro_work_min: Number(e.target.value)})} /></div>
                  <div className="auth-field"><label>Descanso (min)</label>
                    <input type="number" value={form.pomodoro_break_min} onChange={e => setForm({...form, pomodoro_break_min: Number(e.target.value)})} /></div>
                </div>
              )}
              <div className="auth-field"><label>Descripción</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="¿Qué van a estudiar?" /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Sala</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
