import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../services/i18n';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { CalendarEvent, Project } from '../types';
import {
  ListChecks,
  ClipboardList,
  Clock,
  BookOpen,
  AlertTriangle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from '../components/Icons';
import styles from './Calendar.module.css';

/* Mapea tipo de evento a clase de chip editorial */
function evChipClass(type: string): string {
  switch (type) {
    case 'exam':
      return styles.evExam;
    case 'deadline':
      return styles.evDeadline;
    case 'study_session':
      return styles.evStudy;
    case 'task':
    default:
      return styles.evTask;
  }
}

interface Props {
  projects: Project[];
  onNavigate: (path: string) => void;
}

const EVENT_TYPES = [
  { value: 'task', labelKey: 'calendar.typeTask' as const, icon: () => ListChecks({ size: 20 }) },
  {
    value: 'exam',
    labelKey: 'calendar.typeExam' as const,
    icon: () => ClipboardList({ size: 20 }),
  },
  {
    value: 'deadline',
    labelKey: 'calendar.typeDeadline' as const,
    icon: () => Clock({ size: 20 }),
  },
  {
    value: 'study_session',
    labelKey: 'calendar.typeStudy' as const,
    icon: () => BookOpen({ size: 20 }),
  },
];

export default function Calendar({ projects, onNavigate }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('task');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [color, setColor] = useState('#4f8cff');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [view, setView] = useState<'month' | 'list'>('month');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getCalendarEvents();
      setEvents(data);
    } catch (err: any) {
      console.error('Error loading events:', err);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !dueDate) return;
    try {
      const event = await api.createCalendarEvent({
        title: title.trim(),
        description,
        event_type: eventType,
        due_date: new Date(dueDate).toISOString(),
        project_id: projectId || undefined,
        color,
      });
      setEvents((prev) =>
        [...prev, event].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
      );
      setTitle('');
      setDescription('');
      setDueDate('');
      setProjectId('');
      setShowForm(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear evento');
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const updated = await api.updateCalendarEvent(id, { completed: !completed });
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      alert(err.message || 'Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const now = new Date();
  const filteredEvents = events.filter((e) => {
    if (filter === 'pending') return !e.completed;
    if (filter === 'completed') return e.completed;
    return true;
  });

  const upcoming = filteredEvents.filter((e) => !e.completed && new Date(e.dueDate) >= now);
  const overdue = filteredEvents.filter((e) => !e.completed && new Date(e.dueDate) < now);
  const completed = filteredEvents.filter((e) => e.completed);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString())
      return (
        t('calendar.today') +
        ', ' +
        d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
      );
    if (d.toDateString() === tomorrow.toDateString())
      return (
        t('calendar.tomorrow') +
        ', ' +
        d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
      );
    return (
      d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ', ' +
      d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const getTypeIcon = (type: string) => {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found ? found.icon() : ListChecks({ size: 20 });
  };

  const renderEvent = (event: CalendarEvent) => {
    const isOverdue = !event.completed && new Date(event.dueDate) < now;
    return (
      <div
        key={event.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          borderLeft: `4px solid ${isOverdue ? 'var(--accent-red)' : event.color || 'var(--accent)'}`,
          opacity: event.completed ? 0.6 : 1,
        }}
      >
        <button
          onClick={() => handleToggle(event.id, event.completed)}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `2px solid ${event.completed ? 'var(--accent-green)' : 'var(--border-color)'}`,
            background: event.completed ? 'var(--accent-green)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
          }}
        >
          {event.completed && Check({ size: 12 })}
        </button>
        <span style={{ fontSize: 20 }}>{getTypeIcon(event.eventType)}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              textDecoration: event.completed ? 'line-through' : 'none',
            }}
          >
            {event.title}
          </div>
          <div
            style={{ fontSize: 12, color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)' }}
          >
            {isOverdue && <>{AlertTriangle({ size: 12 })} </>}
            {formatDate(event.dueDate)}
            {event.description && ` · ${event.description.slice(0, 50)}`}
          </div>
        </div>
        <button
          onClick={() => handleDelete(event.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 16,
            padding: 4,
            opacity: 0.5,
          }}
        >
          {X({ size: 14 })}
        </button>
      </div>
    );
  };

  // --- Month grid helpers ---
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday=0 ... Sunday=6 (ISO week)
    let startDow = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    // Leading blanks
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    // Trailing blanks to fill 7-col grid
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const eventsForDay = (day: Date) => {
    return filteredEvents.filter((e) => {
      const d = new Date(e.dueDate);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    });
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayClick = (day: Date) => {
    const dayEvents = eventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
    } else {
      // Quick-add: open form with date pre-filled
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}T09:00`);
      setShowForm(true);
    }
  };

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthLabel = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const DOW_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const renderMonthGrid = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={prevMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {ChevronLeft({ size: 20 })}
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {ChevronRight({ size: 20 })}
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              padding: '4px 0',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {calendarDays.map((day, i) => {
          if (!day)
            return (
              <div
                key={`blank-${i}`}
                style={{ minHeight: 64, background: 'var(--bg-primary)', borderRadius: 8 }}
              />
            );
          const dayEvts = eventsForDay(day);
          const isToday = isSameDay(day, now);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const hasOverdue = dayEvts.some((e) => !e.completed && new Date(e.dueDate) < now);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              style={{
                minHeight: 64,
                padding: '6px 8px',
                background: isSelected
                  ? 'color-mix(in srgb, var(--accent) 15%, var(--bg-secondary))'
                  : 'var(--bg-secondary)',
                borderRadius: 8,
                cursor: 'pointer',
                border: isToday
                  ? '2px solid var(--accent)'
                  : isSelected
                    ? '2px solid color-mix(in srgb, var(--accent) 40%, transparent)'
                    : '2px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {day.getDate()}
                {hasOverdue && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent-red)',
                      display: 'inline-block',
                    }}
                  />
                )}
              </div>
              {dayEvts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {dayEvts.slice(0, 4).map((evt, j) => (
                    <span
                      key={j}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: evt.completed
                          ? 'var(--accent-green)'
                          : evt.color || 'var(--accent)',
                        display: 'inline-block',
                        opacity: evt.completed ? 0.5 : 1,
                      }}
                    />
                  ))}
                  {dayEvts.length > 4 && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: '7px' }}>
                      +{dayEvts.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDay &&
        (() => {
          const dayEvts = eventsForDay(selectedDay);
          return dayEvts.length > 0 ? (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                  {selectedDay.toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h4>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {X({ size: 14 })}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayEvts.map(renderEvent)}
              </div>
            </div>
          ) : null;
        })()}
    </div>
  );

  // Eventos del día de hoy para el side panel
  const todayEvents = filteredEvents
    .filter((e) => {
      const d = new Date(e.dueDate);
      return isSameDay(d, now);
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const barForType = (type: string): string => {
    switch (type) {
      case 'exam':
        return styles.evExam;
      case 'deadline':
        return styles.evDeadline;
      case 'study_session':
        return styles.evStudy;
      case 'task':
      default:
        return styles.evTask;
    }
  };

  return (
    <div className={styles.calRoot}>
      <div className={styles.topProgress}>
        <div className={styles.tpLeft}>
          <span className={styles.pulse} aria-hidden="true" />
          <span>Tu calendario</span>
        </div>
        <span>
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} ·{' '}
          {overdue.length > 0
            ? `${overdue.length} atrasado${overdue.length !== 1 ? 's' : ''}`
            : 'al día'}
        </span>
      </div>

      <main className={styles.main}>
        {/* ── Header ── */}
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.titleH1}>
              <span className={styles.titleMo} style={{ textTransform: 'capitalize' }}>
                {monthLabel.split(' ')[0]}
              </span>{' '}
              {monthLabel.split(' ').slice(1).join(' ')}
            </h1>
            <div className={styles.titleSub}>
              {upcoming.length > 0 && (
                <>
                  <strong>{upcoming.length}</strong> próximo{upcoming.length !== 1 ? 's' : ''}
                  {overdue.length > 0 && ' · '}
                </>
              )}
              {overdue.length > 0 && (
                <>
                  <strong style={{ color: 'var(--cl-pink, #ff4d3a)' }}>{overdue.length}</strong>{' '}
                  atrasado{overdue.length !== 1 ? 's' : ''}
                </>
              )}
              {upcoming.length === 0 && overdue.length === 0 && 'Sin eventos pendientes'}
            </div>
          </div>
          <div className={styles.controls}>
            <button
              className={`${styles.calBtn} ${styles.arrow}`}
              onClick={prevMonth}
              aria-label="Mes anterior"
            >
              {ChevronLeft({ size: 16 })}
            </button>
            <button
              className={`${styles.calBtn} ${styles.arrow}`}
              onClick={nextMonth}
              aria-label="Mes siguiente"
            >
              {ChevronRight({ size: 16 })}
            </button>
            <div className={styles.viewSwitcher}>
              <button
                className={`${styles.vsBtn} ${view === 'month' ? styles.active : ''}`}
                onClick={() => setView('month')}
                type="button"
              >
                {LayoutGrid({ size: 14 })} Mes
              </button>
              <button
                className={`${styles.vsBtn} ${view === 'list' ? styles.active : ''}`}
                onClick={() => setView('list')}
                type="button"
              >
                {ListChecks({ size: 14 })} Lista
              </button>
            </div>
            <button
              className={`${styles.calBtn} ${styles.primary}`}
              onClick={() => setShowForm(true)}
              type="button"
            >
              + Nuevo
            </button>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className={styles.filterTabs}>
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === 'all'
                ? t('calendar.tabAll')
                : f === 'pending'
                  ? t('calendar.tabPending')
                  : t('calendar.tabCompleted')}
              {f === 'pending' && overdue.length > 0 && (
                <span className={styles.filterBadge}>{overdue.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className={styles.empty}>Cargando calendario…</div>
        ) : events.length === 0 && !showForm ? (
          <div className={styles.calMain} style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <h3
              style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 8px' }}
            >
              Organiza tu semestre
            </h3>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cl-ink-3, #696c6f)',
                maxWidth: 400,
                margin: '0 auto 18px',
              }}
            >
              Agenda pruebas, entregas y sesiones de estudio para no olvidar nada.
            </p>
            <button
              className={`${styles.calBtn} ${styles.primary}`}
              onClick={() => setShowForm(true)}
              type="button"
            >
              + Nuevo evento
            </button>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* ── Left: calendar grid or list ── */}
            <div>
              {view === 'month' ? (
                <div className={styles.calMain}>
                  <div className={styles.weekdays}>
                    {DOW_LABELS.map((d, i) => (
                      <div
                        key={d}
                        className={`${styles.wd} ${i === (now.getDay() + 6) % 7 ? styles.today : ''}`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className={styles.daysGrid}>
                    {calendarDays.map((day, i) => {
                      if (!day)
                        return (
                          <div
                            key={`blank-${i}`}
                            className={`${styles.dayCell} ${styles.outside}`}
                          />
                        );
                      const dayEvts = eventsForDay(day);
                      const isToday = isSameDay(day, now);
                      const isSelected = selectedDay && isSameDay(day, selectedDay);
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      return (
                        <div
                          key={i}
                          onClick={() => handleDayClick(day)}
                          className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${!isCurrentMonth ? styles.outside : ''}`}
                        >
                          <div className={styles.dayNum}>{day.getDate()}</div>
                          {dayEvts.length > 0 && (
                            <div className={styles.dayEvents}>
                              {dayEvts.slice(0, 3).map((evt) => (
                                <span
                                  key={evt.id}
                                  className={`${styles.evChip} ${evt.completed ? styles.evDone : evChipClass(evt.eventType)}`}
                                  title={evt.title}
                                >
                                  {evt.title}
                                </span>
                              ))}
                              {dayEvts.length > 3 && (
                                <span className={styles.eventMore}>+{dayEvts.length - 3} más</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.listView}>
                  {overdue.length > 0 &&
                    filter !== 'completed' &&
                    overdue.map((event) => (
                      <div
                        key={event.id}
                        className={styles.listRow}
                        onClick={() => handleToggle(event.id, event.completed)}
                      >
                        <div
                          className={`${styles.listBar} ${styles.evExam}`}
                          style={{ background: 'var(--cl-pink, #ff4d3a)' }}
                        />
                        <div className={styles.listBody}>
                          <div className={styles.listTitle}>
                            {AlertTriangle({ size: 12 })} {event.title}
                          </div>
                          <div className={styles.listMeta}>{formatDate(event.dueDate)}</div>
                        </div>
                        <button
                          className={styles.listAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  {upcoming.length > 0 &&
                    filter !== 'completed' &&
                    upcoming.map((event) => (
                      <div
                        key={event.id}
                        className={styles.listRow}
                        onClick={() => handleToggle(event.id, event.completed)}
                      >
                        <div className={`${styles.listBar} ${barForType(event.eventType)}`} />
                        <div className={styles.listBody}>
                          <div className={styles.listTitle}>{event.title}</div>
                          <div className={styles.listMeta}>{formatDate(event.dueDate)}</div>
                        </div>
                        <button
                          className={styles.listAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  {completed.length > 0 &&
                    filter !== 'pending' &&
                    completed.map((event) => (
                      <div
                        key={event.id}
                        className={`${styles.listRow} ${styles.done}`}
                        onClick={() => handleToggle(event.id, event.completed)}
                      >
                        <div className={`${styles.listBar} ${barForType(event.eventType)}`} />
                        <div className={styles.listBody}>
                          <div className={styles.listTitle}>{event.title}</div>
                          <div className={styles.listMeta}>{formatDate(event.dueDate)}</div>
                        </div>
                        <button
                          className={styles.listAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* ── Right: side panels ── */}
            <aside className={styles.side}>
              <div className={styles.sideCard}>
                <h3>Hoy</h3>
                <div
                  className="sub"
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 11,
                    color: 'var(--cl-ink-3, #696c6f)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                    fontWeight: 600,
                  }}
                >
                  {now.toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </div>
                {todayEvents.length === 0 ? (
                  <div className={styles.empty}>Sin eventos hoy.</div>
                ) : (
                  <div className={styles.todayList}>
                    {todayEvents.map((event) => (
                      <div key={event.id} className={styles.todayRow}>
                        <div className={styles.teTime}>
                          {new Date(event.dueDate).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className={`${styles.teBar} ${barForType(event.eventType)}`} />
                        <div className={styles.teBody}>
                          <div className={styles.teTitle}>{event.title}</div>
                          {event.description && (
                            <div className={styles.teSub}>{event.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.reminderBox}>
                <div className={styles.rLabel}>Tip</div>
                <h4>Click en un día vacío</h4>
                <p>para crear un evento directo en esa fecha.</p>
              </div>
            </aside>
          </div>
        )}

        {/* ── Form modal ── */}
        {showForm && (
          <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.formCard} onClick={(e) => e.stopPropagation()}>
              <h3>{t('calendar.modalTitle')}</h3>

              <div style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>{t('calendar.titleLabel')}</label>
                <input
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('calendar.titlePlaceholder')}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>{t('calendar.typeLabel')}</label>
                <select
                  className={styles.formSelect}
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  {EVENT_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {t(et.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>{t('calendar.dateLabel')}</label>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>{t('calendar.subjectLabel')}</label>
                <select
                  className={styles.formSelect}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">{t('calendar.noSubject')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.formLabel}>{t('calendar.descLabel')}</label>
                <input
                  className={styles.formInput}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('calendar.descPlaceholder')}
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.calBtn} onClick={() => setShowForm(false)} type="button">
                  {t('calendar.cancel')}
                </button>
                <button
                  className={`${styles.calBtn} ${styles.primary}`}
                  onClick={handleCreate}
                  disabled={!title.trim() || !dueDate}
                  type="button"
                >
                  {t('calendar.createSubmit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
