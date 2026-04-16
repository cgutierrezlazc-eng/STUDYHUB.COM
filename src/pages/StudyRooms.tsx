import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import {
  BookOpen,
  Target,
  MessageSquare,
  Users,
  Video,
  Timer,
  PlayCircle,
  RotateCcw,
  Send,
  Clock,
  Trash2,
  Pencil,
  Check,
  X,
  Save,
  BarChart3,
  Crown,
  Shield,
  Lock,
} from '../components/Icons';
import TierGate from '../components/TierGate';

/* ── Types ── */
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: number;
  system?: boolean;
}

interface TimerState {
  roomId: string;
  phase: 'work' | 'break';
  timeLeft: number;
  totalStudyMinutes: number;
  startedAt: number;
  running: boolean;
  workMin: number;
  breakMin: number;
}

interface StudySession {
  id: string;
  roomName: string;
  date: string;
  studyMinutes: number;
  breakMinutes: number;
  focusScore: number;
}

interface Props {
  onNavigate: (path: string) => void;
}

/* ── localStorage helpers ── */
const LS_CHAT_PREFIX = 'conniku_room_chat_';
const LS_TIMER = 'conniku_timer_state';
const LS_SESSIONS = 'conniku_study_sessions';

function loadChat(roomId: string): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(LS_CHAT_PREFIX + roomId) || '[]');
  } catch {
    return [];
  }
}
function saveChat(roomId: string, msgs: ChatMessage[]) {
  const trimmed = msgs.slice(-100);
  localStorage.setItem(LS_CHAT_PREFIX + roomId, JSON.stringify(trimmed));
}
function loadTimerState(): TimerState | null {
  try {
    const raw = localStorage.getItem(LS_TIMER);
    if (!raw) return null;
    const state: TimerState = JSON.parse(raw);
    // Only valid if started less than 4 hours ago
    if (Date.now() - state.startedAt > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(LS_TIMER);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}
function saveTimerState(state: TimerState | null) {
  if (!state) {
    localStorage.removeItem(LS_TIMER);
    return;
  }
  localStorage.setItem(LS_TIMER, JSON.stringify(state));
}
function loadSessions(): StudySession[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
  } catch {
    return [];
  }
}
function saveSessions(sessions: StudySession[]) {
  localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
}

export default function StudyRooms({ onNavigate }: Props) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [totalStudyMin, setTotalStudyMin] = useState(0);
  const [totalBreakMin, setTotalBreakMin] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(0);
  const timerRef = useRef<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Room settings
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editPrivate, setEditPrivate] = useState(false);

  // Summary
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    study: number;
    breaks: number;
    score: number;
    roomName: string;
  } | null>(null);

  // History tab
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Participants (mock local state since no real-time backend)
  const [participants, setParticipants] = useState<
    { name: string; avatar: string; studyMin: number; isHost: boolean }[]
  >([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    room_type: 'pomodoro',
    subject: '',
    max_participants: 10,
    pomodoro_work_min: 25,
    pomodoro_break_min: 5,
  });

  useEffect(() => {
    loadRooms();
    setSessions(loadSessions());
  }, []);

  // Restore timer on mount
  useEffect(() => {
    const saved = loadTimerState();
    if (saved && saved.running) {
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      const remaining = Math.max(0, saved.timeLeft - elapsed);
      setPomodoroTime(remaining);
      setPomodoroPhase(saved.phase);
      setTotalStudyMin(saved.totalStudyMinutes);
      setPomodoroRunning(true);
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      timerRef.current = setTimeout(() => setPomodoroTime((t) => t - 1), 1000);
    } else if (pomodoroRunning && pomodoroTime === 0) {
      if (pomodoroPhase === 'work') {
        const workMin = activeRoom?.pomodoroWorkMin || 25;
        setTotalStudyMin((m) => m + workMin);
        setPomodoroPhase('break');
        setPomodoroTime((activeRoom?.pomodoroBreakMin || 5) * 60);
      } else {
        const breakMin = activeRoom?.pomodoroBreakMin || 5;
        setTotalBreakMin((m) => m + breakMin);
        setPomodoroPhase('work');
        setPomodoroTime((activeRoom?.pomodoroWorkMin || 25) * 60);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [pomodoroRunning, pomodoroTime]);

  // Persist timer state
  useEffect(() => {
    if (activeRoom && pomodoroRunning) {
      saveTimerState({
        roomId: activeRoom.id,
        phase: pomodoroPhase,
        timeLeft: pomodoroTime,
        totalStudyMinutes: totalStudyMin,
        startedAt: Date.now(),
        running: true,
        workMin: activeRoom.pomodoroWorkMin || 25,
        breakMin: activeRoom.pomodoroBreakMin || 5,
      });
    } else if (!pomodoroRunning) {
      saveTimerState(null);
    }
  }, [pomodoroRunning, pomodoroTime, pomodoroPhase, totalStudyMin]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadRooms = async () => {
    try {
      setRooms(await api.getStudyRooms());
    } catch (err: any) {
      console.error('Failed to load study rooms:', err);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      const room = await api.createStudyRoom(form);
      setShowCreate(false);
      enterRoom(room, true);
      setForm({
        name: '',
        description: '',
        room_type: 'pomodoro',
        subject: '',
        max_participants: 10,
        pomodoro_work_min: 25,
        pomodoro_break_min: 5,
      });
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const enterRoom = (room: any, isCreator = false) => {
    setActiveRoom(room);
    setPomodoroTime((room.pomodoroWorkMin || 25) * 60);
    setTotalStudyMin(0);
    setTotalBreakMin(0);
    setSessionStartedAt(Date.now());
    setShowHistory(false);

    // Load chat
    const msgs = loadChat(room.id);
    const userName = user?.firstName || 'Anónimo';
    const joinMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'system',
      text: `${userName} se unió a la sala`,
      time: Date.now(),
      system: true,
    };
    const updated = [...msgs, joinMsg];
    setChatMessages(updated);
    saveChat(room.id, updated);

    // Set participants
    const me = {
      name: userName,
      avatar: userName[0]?.toUpperCase() || '?',
      studyMin: 0,
      isHost: isCreator,
    };
    const hostEntry =
      room.host && !isCreator
        ? {
            name: room.host.firstName || 'Host',
            avatar: (room.host.firstName || 'H')[0].toUpperCase(),
            studyMin: 0,
            isHost: true,
          }
        : null;
    setParticipants(hostEntry ? [hostEntry, me] : [me]);

    // Settings defaults
    setEditName(room.name || '');
    setEditSubject(room.subject || '');
    setEditPrivate(room.isPrivate || false);
  };

  const handleJoin = async (room: any) => {
    try {
      const result = await api.joinStudyRoom(room.id);
      enterRoom({ ...room, meetingUrl: result.meetingUrl }, false);
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const handleLeave = async () => {
    if (!activeRoom) return;
    setPomodoroRunning(false);
    saveTimerState(null);

    // Calculate focus score
    const totalMin = totalStudyMin + totalBreakMin;
    const score = totalMin > 0 ? Math.round((totalStudyMin / totalMin) * 100) : 0;

    setSummaryData({
      study: totalStudyMin,
      breaks: totalBreakMin,
      score,
      roomName: activeRoom.name,
    });
    setShowSummary(true);

    try {
      await api.leaveStudyRoom(activeRoom.id, totalStudyMin);
    } catch (err: any) {
      console.error('Failed to leave study room:', err);
    }
    setActiveRoom(null);
    setTotalStudyMin(0);
    setTotalBreakMin(0);
    loadRooms();
  };

  const handleSaveSession = () => {
    if (!summaryData) return;
    const session: StudySession = {
      id: Date.now().toString(),
      roomName: summaryData.roomName,
      date: new Date().toISOString(),
      studyMinutes: summaryData.study,
      breakMinutes: summaryData.breaks,
      focusScore: summaryData.score,
    };
    const updated = [session, ...loadSessions()].slice(0, 50);
    saveSessions(updated);
    setSessions(updated);
    setShowSummary(false);
    setSummaryData(null);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !activeRoom) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.firstName || 'Anónimo',
      text: chatInput.trim(),
      time: Date.now(),
    };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    saveChat(activeRoom.id, updated);
    setChatInput('');
  };

  const handleKickParticipant = (name: string) => {
    setParticipants((p) => p.filter((pp) => pp.name !== name));
    const sysMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'system',
      text: `${name} fue removido de la sala`,
      time: Date.now(),
      system: true,
    };
    const updated = [...chatMessages, sysMsg];
    setChatMessages(updated);
    saveChat(activeRoom.id, updated);
  };

  const handleSaveSettings = () => {
    if (activeRoom) {
      setActiveRoom({
        ...activeRoom,
        name: editName,
        subject: editSubject,
        isPrivate: editPrivate,
      });
    }
    setShowSettings(false);
  };

  const handleCloseRoom = async () => {
    if (!confirm('¿Estás seguro de cerrar esta sala permanentemente?')) return;
    setPomodoroRunning(false);
    saveTimerState(null);
    setActiveRoom(null);
    setShowSettings(false);
    loadRooms();
  };

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const fmtChatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const isRoomCreator =
    activeRoom?.host?.id === user?.id ||
    participants.some((p) => p.isHost && p.name === (user?.firstName || ''));

  // Weekly total for history
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weeklyTotal = sessions
    .filter((s) => new Date(s.date).getTime() >= weekStart.getTime())
    .reduce((acc, s) => acc + s.studyMinutes, 0);

  /* ── Summary modal ── */
  if (showSummary && summaryData) {
    return (
      <>
        <div className="page-header page-enter">
          <h2>{BarChart3()} Resumen de Sesión</h2>
        </div>
        <div
          className="page-body"
          style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}
        >
          <div
            className="u-card"
            style={{ padding: 32, maxWidth: 420, width: '100%', textAlign: 'center' }}
          >
            <h3 style={{ margin: '0 0 4px' }}>{summaryData.roomName}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px' }}>
              Sesión finalizada
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                  {summaryData.study}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>min estudio</div>
              </div>
              <div>
                <div
                  style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-green, #22c55e)' }}
                >
                  {summaryData.breaks}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>min descanso</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color:
                      summaryData.score >= 70
                        ? 'var(--accent-green, #22c55e)'
                        : 'var(--accent-orange, #f59e0b)',
                  }}
                >
                  {summaryData.score}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>enfoque</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleSaveSession}>
                {Save({ size: 14 })} Guardar Sesión
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSummary(false);
                  setSummaryData(null);
                }}
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Active room view ── */
  if (activeRoom) {
    return (
      <>
        <div className="page-header page-enter">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>
                {BookOpen()} {activeRoom.name}
              </h2>
              <p>
                {activeRoom.subject || 'Sesión de estudio'} · {participants.length} participantes
                {pomodoroRunning && (
                  <span
                    style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}
                  >
                    {Timer({ size: 12 })} Sesión en curso
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isRoomCreator && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>
                  {Pencil({ size: 13 })} Ajustes
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
                Salir de la Sala
              </button>
            </div>
          </div>
        </div>
        <div className="page-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Left column: Timer + Video + Participants */}
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pomodoro Timer */}
            <div className="u-card" style={{ padding: 24, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color:
                    pomodoroPhase === 'work' ? 'var(--accent)' : 'var(--accent-green, #22c55e)',
                  marginBottom: 8,
                }}
              >
                {pomodoroPhase === 'work' ? (
                  <>{Target({ size: 14 })} Enfoque</>
                ) : (
                  <>{Timer({ size: 14 })} Descanso</>
                )}
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {fmtTime(pomodoroTime)}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  className={`btn ${pomodoroRunning ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setPomodoroRunning(!pomodoroRunning)}
                >
                  {pomodoroRunning ? 'Pausar' : <>{PlayCircle({ size: 14 })} Iniciar</>}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setPomodoroTime((activeRoom.pomodoroWorkMin || 25) * 60);
                    setPomodoroPhase('work');
                    setPomodoroRunning(false);
                  }}
                >
                  {RotateCcw({ size: 14 })} Reiniciar
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Tiempo estudiado: {totalStudyMin} min · Descanso: {totalBreakMin} min
              </div>
            </div>

            {/* Video Link */}
            {activeRoom.meetingUrl && (
              <div className="u-card" style={{ padding: 16, textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>{Video()} Videollamada</h4>
                <a
                  href={activeRoom.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  Unirse a la Videollamada
                </a>
              </div>
            )}

            {/* Participants */}
            <div className="u-card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>
                {Users()} Participantes ({participants.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {participants.map((p, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: p.isHost ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: p.isHost ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {p.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>
                        {p.name}
                        {p.isHost && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              color: 'var(--accent)',
                              fontWeight: 600,
                            }}
                          >
                            {Crown({ size: 11 })} Anfitrión
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {p.studyMin} min estudiados
                      </div>
                    </div>
                    {isRoomCreator && !p.isHost && (
                      <button
                        onClick={() => handleKickParticipant(p.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 4,
                          fontSize: 11,
                        }}
                        title="Remover participante"
                      >
                        {X({ size: 14 })}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Chat */}
          <div
            style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', minHeight: 400 }}
          >
            <div
              className="u-card"
              style={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 400,
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {MessageSquare({ size: 14 })} Chat de la Sala
              </div>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 360,
                }}
              >
                {chatMessages.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      padding: 24,
                    }}
                  >
                    No hay mensajes aún. ¡Saluda a tus compañeros!
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      fontSize: 13,
                      ...(msg.system
                        ? {
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            fontSize: 12,
                            padding: '4px 0',
                          }
                        : {}),
                    }}
                  >
                    {msg.system ? (
                      <span>{msg.text}</span>
                    ) : (
                      <>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                          {msg.sender}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>
                          {fmtChatTime(msg.time)}
                        </span>
                        <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>{msg.text}</div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  placeholder="Escribe un mensaje..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                >
                  {Send({ size: 14 })}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Room Settings Modal */}
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{Pencil({ size: 16 })} Ajustes de la Sala</h3>
              <div className="auth-field">
                <label>Nombre de la sala</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="auth-field">
                <label>Materia</label>
                <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                <input
                  type="checkbox"
                  checked={editPrivate}
                  onChange={(e) => setEditPrivate(e.target.checked)}
                  id="room-private"
                />
                <label htmlFor="room-private" style={{ fontSize: 13, cursor: 'pointer' }}>
                  {Lock({ size: 13 })} Sala privada
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleSaveSettings}>
                  {Check({ size: 14 })} Guardar
                </button>
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCloseRoom}
                  style={{ marginLeft: 'auto', color: 'var(--accent-red, #ef4444)' }}
                >
                  {Trash2({ size: 14 })} Cerrar Sala
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── History view ── */
  if (showHistory) {
    return (
      <>
        <div className="page-header page-enter">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>{Clock()} Mis Sesiones</h2>
              <p>Historial de sesiones de estudio</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>
              Volver a Salas
            </button>
          </div>
        </div>
        <div className="page-body">
          {/* Weekly summary */}
          <div
            className="u-card"
            style={{
              padding: 20,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                Total esta semana
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                {weeklyTotal}{' '}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>
                  minutos
                </span>
              </div>
            </div>
            <div>{BarChart3({ size: 32 })}</div>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div>{Clock({ size: 48 })}</div>
              <h3>Sin sesiones registradas</h3>
              <p>Completa una sesión de estudio y guárdala para verla aquí</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="u-card hover-lift"
                  style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.roomName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(s.date).toLocaleDateString('es-CL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                      {s.studyMinutes}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>min</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color:
                          s.focusScore >= 70
                            ? 'var(--accent-green, #22c55e)'
                            : 'var(--accent-orange, #f59e0b)',
                      }}
                    >
                      {s.focusScore}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>enfoque</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── Room list ── */
  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{BookOpen()} Salas de Estudio</h2>
            <p>Estudia en grupo con temporizador Pomodoro y videollamada</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSessions(loadSessions());
                setShowHistory(true);
              }}
            >
              {Clock({ size: 14 })} Mis Sesiones
            </button>
            <TierGate feature="can_create_study_room" onNavigate={onNavigate}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + Crear Sala
              </button>
            </TierGate>
          </div>
        </div>
      </div>
      <div className="page-body">
        {/* Running session indicator */}
        {loadTimerState() && (
          <div
            className="u-card"
            style={{
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <div style={{ color: 'var(--accent)' }}>{Timer({ size: 18 })}</div>
            <div style={{ flex: 1, fontSize: 13 }}>
              <strong>Sesión en curso</strong> — Tienes un temporizador activo
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div>{BookOpen({ size: 48 })}</div>
            <h3>No hay salas activas</h3>
            <p>Crea una sala para estudiar con la comunidad</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
            }}
          >
            {rooms.map((room) => (
              <div key={room.id} className="u-card hover-lift" style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: 15 }}>{room.name}</h4>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {room.isPrivate && (
                      <span title="Sala privada" style={{ color: 'var(--text-muted)' }}>
                        {Lock({ size: 12 })}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background:
                          room.roomType === 'pomodoro'
                            ? 'rgba(37,99,235,0.08)'
                            : 'var(--bg-tertiary)',
                        color: room.roomType === 'pomodoro' ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {room.roomType === 'pomodoro' ? (
                        <>{Timer({ size: 12 })} Pomodoro</>
                      ) : room.roomType === 'focus' ? (
                        <>{Target({ size: 12 })} Enfoque</>
                      ) : (
                        <>{MessageSquare({ size: 12 })} Libre</>
                      )}
                    </span>
                  </div>
                </div>
                {room.subject && (
                  <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>
                    {room.subject}
                  </div>
                )}
                {room.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                    {room.description}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    {Users({ size: 12 })} {room.currentParticipants}/{room.maxParticipants}
                  </span>
                  {room.host && <span>Host: {room.host.firstName}</span>}
                  {room.roomType === 'pomodoro' && (
                    <span>
                      {Timer({ size: 12 })} {room.pomodoroWorkMin}/{room.pomodoroBreakMin} min
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={() => handleJoin(room)}
                  disabled={room.currentParticipants >= room.maxParticipants}
                >
                  {room.currentParticipants >= room.maxParticipants ? 'Sala Llena' : 'Unirse'}
                </button>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Crear Sala de Estudio</h3>
              <div className="auth-field">
                <label>Nombre de la sala *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Repaso Cálculo - Parcial 2"
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label>Materia</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Ej: Cálculo II"
                />
              </div>
              <div className="auth-field">
                <label>Tipo de sala</label>
                <select
                  value={form.room_type}
                  onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="pomodoro">Pomodoro (trabajo + descanso)</option>
                  <option value="focus">Enfoque Continuo</option>
                  <option value="free">Libre</option>
                </select>
              </div>
              {form.room_type === 'pomodoro' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="auth-field">
                    <label>Trabajo (min)</label>
                    <input
                      type="number"
                      value={form.pomodoro_work_min}
                      onChange={(e) =>
                        setForm({ ...form, pomodoro_work_min: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="auth-field">
                    <label>Descanso (min)</label>
                    <input
                      type="number"
                      value={form.pomodoro_break_min}
                      onChange={(e) =>
                        setForm({ ...form, pomodoro_break_min: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}
              <div className="auth-field">
                <label>Descripción</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="¿Qué van a estudiar?"
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleCreate}>
                  Crear Sala
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
