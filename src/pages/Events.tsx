import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { useI18n } from '../services/i18n';
import { Calendar, Link, Users } from '../components/Icons';
import evStyles from './Events.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

const EVENT_TYPE_KEYS = [
  { value: 'study_session', key: 'events.typeStudy', color: 'var(--accent-blue)' },
  { value: 'exam_prep', key: 'events.typeExam', color: 'var(--accent-orange)' },
  { value: 'tutoring', key: 'events.typeTutoring', color: 'var(--accent-green)' },
  { value: 'social', key: 'events.typeSocial', color: 'var(--accent-purple)' },
];

export default function Events({ onNavigate }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'my'>('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'study_session',
    location: '',
    meeting_link: '',
    start_time: '',
    end_time: '',
    max_attendees: '',
  });

  useEffect(() => {
    loadEvents();
  }, [tab]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents(tab === 'my');
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load events:', err);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.start_time) {
      alert('Título y fecha son obligatorios');
      return;
    }
    try {
      await api.createEvent({
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      });
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        event_type: 'study_session',
        location: '',
        meeting_link: '',
        start_time: '',
        end_time: '',
        max_attendees: '',
      });
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const handleRsvp = async (eventId: string, status: string) => {
    try {
      const result = await api.rsvpEvent(eventId, status);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, userRsvp: status, attendeeCount: result.attendeeCount } : e
        )
      );
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={evStyles.evRoot}>
      <div className={evStyles.topProgress}>
        <div className={evStyles.tpLeft}>
          <span className={evStyles.pulse} aria-hidden="true" />
          <span>Eventos</span>
        </div>
        <span>
          {events.length} evento{events.length !== 1 ? 's' : ''} activo
          {events.length !== 1 ? 's' : ''}
        </span>
      </div>

      <main className={evStyles.main}>
        <div className={evStyles.heroRow}>
          <div>
            <h1 className={evStyles.heroH1}>
              Eventos <span className={evStyles.hlPink}>de tu U</span>.
            </h1>
            <p className={evStyles.heroLead}>
              Sesiones de estudio, preparación de pruebas, tutorías grupales, eventos sociales. Crea
              o únete a eventos con tu comunidad.
            </p>
          </div>
          <button
            className={`${evStyles.btn} ${evStyles.primary}`}
            onClick={() => setShowCreate(true)}
            type="button"
          >
            + {t('events.create')}
          </button>
        </div>

        <div className={evStyles.tabs}>
          <button
            className={`${evStyles.tabBtn} ${tab === 'upcoming' ? evStyles.active : ''}`}
            onClick={() => setTab('upcoming')}
            type="button"
          >
            {t('events.tabUpcoming')}
          </button>
          <button
            className={`${evStyles.tabBtn} ${tab === 'my' ? evStyles.active : ''}`}
            onClick={() => setTab('my')}
            type="button"
          >
            {t('events.tabMy')}
          </button>
        </div>

        <div className={evStyles.content}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">{Calendar({ size: 48 })}</div>
              <h3>{t('events.emptyTitle')}</h3>
              <p>{t('events.emptySubtitle')}</p>
              <button
                className="btn btn-primary empty-state-cta"
                onClick={() => setShowCreate(true)}
              >
                {t('events.create')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((event) => {
                const typeInfo =
                  EVENT_TYPE_KEYS.find((tk) => tk.value === event.eventType) || EVENT_TYPE_KEYS[0];
                return (
                  <div
                    key={event.id}
                    className="u-card hover-lift"
                    style={{ display: 'flex', gap: 16 }}
                  >
                    <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: typeInfo.color,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {new Date(event.startTime).toLocaleDateString('es', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                        {new Date(event.startTime).getDate()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatTime(event.startTime)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <h4 style={{ margin: 0, fontSize: 15 }}>{event.title}</h4>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: `${typeInfo.color}15`,
                            color: typeInfo.color,
                          }}
                        >
                          {t(typeInfo.key)}
                        </span>
                      </div>
                      {event.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                          {event.description.slice(0, 120)}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {event.location && <span>{event.location}</span>}
                        {event.meetingLink && (
                          <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--accent)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {Link({ size: 14 })} {t('events.join')}
                          </a>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {Users({ size: 14 })} {event.attendeeCount}
                          {event.maxAttendees ? `/${event.maxAttendees}` : ''}{' '}
                          {t('events.attendees')}
                        </span>
                        {event.organizer && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: event.organizer.avatar
                                  ? `url(${event.organizer.avatar}) center/cover`
                                  : 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 9,
                                fontWeight: 700,
                              }}
                            >
                              {!event.organizer.avatar && (event.organizer.firstName?.[0] || '?')}
                            </span>
                            {event.organizer.firstName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        alignItems: 'flex-end',
                      }}
                    >
                      {event.userRsvp === 'going' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRsvp(event.id, 'not_going')}
                        >
                          ✓ {t('events.attending')}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRsvp(event.id, 'going')}
                        >
                          {t('events.attend')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {showCreate && (
            <div className="modal-overlay" onClick={() => setShowCreate(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{t('events.modalTitle')}</h3>
                <div className="auth-field">
                  <label>{t('events.titleLabel')}</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={t('events.titlePlaceholder')}
                    autoFocus
                  />
                </div>
                <div className="auth-field">
                  <label>{t('events.typeLabel')}</label>
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {EVENT_TYPE_KEYS.map((tk) => (
                      <option key={tk.value} value={tk.value}>
                        {t(tk.key)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="auth-field">
                    <label>{t('events.startLabel')}</label>
                    <input
                      type="datetime-local"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="auth-field">
                    <label>{t('events.endLabel')}</label>
                    <input
                      type="datetime-local"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label>{t('events.locationLabel')}</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={t('events.locationPlaceholder')}
                  />
                </div>
                <div className="auth-field">
                  <label>{t('events.meetingLinkLabel')}</label>
                  <input
                    value={form.meeting_link}
                    onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                <div className="auth-field">
                  <label>{t('events.descLabel')}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('events.descPlaceholder')}
                    style={{
                      width: '100%',
                      minHeight: 60,
                      resize: 'vertical',
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                    {t('events.cancel')}
                  </button>
                  <button className="btn btn-primary" onClick={handleCreate}>
                    {t('events.createSubmit')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
