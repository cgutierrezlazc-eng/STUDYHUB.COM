import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { Video, Users, Clock, Calendar, Plus, X, FileText, Mic } from '../components/Icons';
import TierGate from '../components/TierGate';

interface Props {
  onNavigate: (path: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  jitsi: 'Jitsi (Propia)',
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'Microsoft Teams',
  other: 'Otro',
};

const TYPE_COLORS: Record<string, string> = {
  jitsi: '#7c3aed',
  zoom: '#2d8cff',
  meet: '#00897b',
  teams: '#6264a7',
  other: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Proximas',
  live: 'En vivo',
  ended: 'Pasadas',
};

export default function Conferences({ onNavigate }: Props) {
  const { user } = useAuth();
  const [conferences, setConferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'scheduled' | 'live' | 'ended'>('scheduled');
  const [showCreate, setShowCreate] = useState(false);
  const [showJitsi, setShowJitsi] = useState<any>(null);
  const [showTranscription, setShowTranscription] = useState<any>(null);
  const [transcriptionData, setTranscriptionData] = useState<{
    status: string;
    transcription: string;
    estimate?: string;
  } | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    conference_type: 'jitsi',
    external_url: '',
    project_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    is_recording: false,
    start_now: false,
  });

  const isPro =
    (user as any)?.subscriptionTier === 'pro' ||
    (user as any)?.subscriptionTier === 'max' ||
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    (user as any)?.isAdmin;

  const loadConferences = useCallback(async () => {
    try {
      const data = await api.getConferences();
      setConferences(data.conferences || []);
    } catch (err: any) {
      console.error('Error loading conferences:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConferences();
    api
      .getProjects()
      .then((data: any) => setProjects(data || []))
      .catch(() => {});
  }, [loadConferences]);

  const filtered = conferences.filter((c) => c.status === tab);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError('El titulo es obligatorio');
      return;
    }
    if (form.conference_type !== 'jitsi' && !form.external_url.trim()) {
      setError('Se requiere un enlace para conferencias externas');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await api.createConference({
        ...form,
        project_id: form.project_id || null,
        scheduled_at: form.start_now ? null : form.scheduled_at || null,
      });
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        conference_type: 'jitsi',
        external_url: '',
        project_id: '',
        scheduled_at: '',
        duration_minutes: 60,
        is_recording: false,
        start_now: false,
      });
      loadConferences();
    } catch (err: any) {
      setError(err.message || 'Error al crear la conferencia');
    }
    setCreating(false);
  };

  const handleJoin = async (conf: any) => {
    try {
      const data = await api.joinConference(conf.id);
      if (conf.conference_type === 'jitsi') {
        setShowJitsi(conf);
      } else {
        window.open(data.join_url || conf.external_url, '_blank');
      }
      loadConferences();
    } catch (err: any) {
      alert(err.message || 'Error al unirse');
    }
  };

  const handleEnd = async (conf: any) => {
    if (!confirm('Finalizar esta conferencia?')) return;
    try {
      const data = await api.endConference(conf.id);
      alert(data.message || 'Conferencia finalizada');
      loadConferences();
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const handleDelete = async (conf: any) => {
    if (!confirm('Eliminar esta conferencia?')) return;
    try {
      await api.deleteConference(conf.id);
      loadConferences();
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const handleViewTranscription = async (conf: any) => {
    setShowTranscription(conf);
    setTranscriptionData(null);
    try {
      const data = await api.getConferenceTranscription(conf.id);
      setTranscriptionData(data);
    } catch (err: any) {
      setTranscriptionData({
        status: 'error',
        transcription: err.message || 'Error al obtener transcripcion',
      });
    }
  };

  const handleLeaveJitsi = async () => {
    if (showJitsi) {
      try {
        await api.leaveConference(showJitsi.id);
      } catch {}
    }
    setShowJitsi(null);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Jitsi fullscreen modal ──────────────────────────────────
  if (showJitsi) {
    const room = showJitsi.jitsi_room;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: '#1a1a2e',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 600 }}>{showJitsi.title}</span>
          <button
            onClick={handleLeaveJitsi}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 16px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Salir de la conferencia
          </button>
        </div>
        <iframe
          src={`https://8x8.vc/${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false`}
          style={{ width: '100%', flex: 1, border: 'none' }}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        />
      </div>
    );
  }

  return (
    <div
      className="page-container"
      style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Conferencias</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: 14 }}>
            Sesiones de video en vivo y grabadas
          </p>
        </div>
        <TierGate feature="can_create_conference" onNavigate={onNavigate}>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {Plus()} Nueva conferencia
          </button>
        </TierGate>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 4,
        }}
      >
        {(['scheduled', 'live', 'ended'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t === 'live' && (
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  marginRight: 6,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            )}
            {STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Conference list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
          <div className="empty-state-icon">{Video({ size: 48 })}</div>
          <p>No hay conferencias en esta seccion</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((conf) => (
            <div
              key={conf.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12,
                padding: 20,
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: TYPE_COLORS[conf.conference_type] || '#6b7280',
                      color: '#fff',
                    }}
                  >
                    {TYPE_LABELS[conf.conference_type] || conf.conference_type}
                  </span>
                  {conf.status === 'live' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#ef4444',
                        color: '#fff',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#fff',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />{' '}
                      EN VIVO
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>{conf.title}</h3>
                {conf.description && (
                  <p style={{ margin: '0 0 6px', fontSize: 13, opacity: 0.7 }}>
                    {conf.description}
                  </p>
                )}
                <div
                  style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.6, flexWrap: 'wrap' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Calendar()} {formatDate(conf.scheduled_at)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Clock()} {conf.duration_minutes} min
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Users()} {conf.participant_count} participantes
                  </span>
                  {conf.is_recording && (
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}
                    >
                      {Mic()} Grabando
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(conf.status === 'scheduled' || conf.status === 'live') && (
                  <button
                    onClick={() => handleJoin(conf)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      background: conf.status === 'live' ? '#ef4444' : 'var(--accent)',
                      color: '#fff',
                    }}
                  >
                    {conf.conference_type === 'jitsi' ? 'Unirse' : 'Abrir enlace'}
                  </button>
                )}
                {conf.status === 'live' && conf.creator_id === user?.id && (
                  <button
                    onClick={() => handleEnd(conf)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Finalizar
                  </button>
                )}
                {conf.status === 'ended' && conf.transcription_status === 'done' && (
                  <button
                    onClick={() => handleViewTranscription(conf)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      background: '#7c3aed',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {FileText()} Ver transcripcion
                  </button>
                )}
                {conf.status === 'ended' && conf.transcription_status === 'processing' && (
                  <span
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontSize: 12,
                      opacity: 0.7,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Transcribiendo (~{Math.max(1, Math.floor(conf.duration_minutes / 10))} min)
                  </span>
                )}
                {conf.creator_id === user?.id && (
                  <button
                    onClick={() => handleDelete(conf)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: 13,
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create conference modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 16,
              padding: 28,
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Nueva conferencia</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
              >
                {X()}
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Type */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Tipo de conferencia
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          conference_type: key,
                          external_url: key === 'jitsi' ? '' : f.external_url,
                        }))
                      }
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          form.conference_type === key ? TYPE_COLORS[key] : 'var(--bg-tertiary)',
                        color: form.conference_type === key ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Titulo
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Repaso de Calculo II"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Descripcion (opcional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe el tema de la conferencia..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* External URL */}
              {form.conference_type !== 'jitsi' && (
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}
                  >
                    Link de la reunion
                  </label>
                  <input
                    value={form.external_url}
                    onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                    placeholder="https://zoom.us/j/... o meet.google.com/..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Project (asignatura) */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Asignatura (opcional)
                </label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Sin asignatura (grupo general)</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule or now */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.start_now}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_now: e.target.checked, scheduled_at: '' }))
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  Iniciar ahora
                </label>
              </div>

              {!form.start_now && (
                <div>
                  <label
                    style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}
                  >
                    Fecha y hora
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Duration */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Duracion estimada
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[30, 60, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setForm((f) => ({ ...f, duration_minutes: d }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          form.duration_minutes === d ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: form.duration_minutes === d ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {d < 60 ? `${d} min` : `${d / 60}h`}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))
                    }
                    min={10}
                    max={480}
                    style={{
                      width: 80,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 12, opacity: 0.6, alignSelf: 'center' }}>min</span>
                </div>
              </div>

              {/* Recording toggle */}
              {isPro && (
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_recording}
                      onChange={(e) => setForm((f) => ({ ...f, is_recording: e.target.checked }))}
                      style={{ width: 16, height: 16 }}
                    />
                    Grabar conferencia
                  </label>
                  <p style={{ margin: '4px 0 0 24px', fontSize: 11, opacity: 0.5 }}>
                    La grabacion se transcribira automaticamente al finalizar
                  </p>
                </div>
              )}

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: 15,
                  marginTop: 8,
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? 'Creando...' : form.start_now ? 'Crear e iniciar' : 'Crear conferencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcription modal */}
      {showTranscription && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 16,
              padding: 28,
              maxWidth: 640,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Transcripcion: {showTranscription.title}
              </h2>
              <button
                onClick={() => setShowTranscription(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
              >
                {X()}
              </button>
            </div>

            {!transcriptionData ? (
              <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                Cargando transcripcion...
              </div>
            ) : transcriptionData.status === 'processing' ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Procesando...</div>
                {transcriptionData.estimate && (
                  <p style={{ fontSize: 13, opacity: 0.5 }}>{transcriptionData.estimate}</p>
                )}
              </div>
            ) : transcriptionData.status === 'error' ? (
              <div
                style={{ background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 8 }}
              >
                Error en la transcripcion
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '60vh',
                  overflow: 'auto',
                }}
              >
                {transcriptionData.transcription}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pulse animation for live indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
