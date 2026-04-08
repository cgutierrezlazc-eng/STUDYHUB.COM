import React, { useState, useEffect, useMemo } from 'react'
import { useI18n } from '../services/i18n'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { CalendarEvent, Project } from '../types'
import { Calendar as CalendarIcon, ListChecks, ClipboardList, Clock, BookOpen, AlertTriangle, CheckCircle, Target, Check, X, ChevronLeft, ChevronRight, LayoutGrid } from '../components/Icons'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

const EVENT_TYPES = [
  { value: 'task', labelKey: 'calendar.typeTask' as const, icon: () => ListChecks({ size: 20 }) },
  { value: 'exam', labelKey: 'calendar.typeExam' as const, icon: () => ClipboardList({ size: 20 }) },
  { value: 'deadline', labelKey: 'calendar.typeDeadline' as const, icon: () => Clock({ size: 20 }) },
  { value: 'study_session', labelKey: 'calendar.typeStudy' as const, icon: () => BookOpen({ size: 20 }) },
]

export default function Calendar({ projects, onNavigate }: Props) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('task')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [color, setColor] = useState('#4f8cff')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [view, setView] = useState<'month' | 'list'>('month')
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await api.getCalendarEvents()
      setEvents(data)
    } catch (err: any) {
      console.error('Error loading events:', err)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!title.trim() || !dueDate) return
    try {
      const event = await api.createCalendarEvent({
        title: title.trim(),
        description,
        event_type: eventType,
        due_date: new Date(dueDate).toISOString(),
        project_id: projectId || undefined,
        color,
      })
      setEvents(prev => [...prev, event].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()))
      setTitle(''); setDescription(''); setDueDate(''); setProjectId(''); setShowForm(false)
    } catch (err: any) {
      alert(err.message || 'Error al crear evento')
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const updated = await api.updateCalendarEvent(id, { completed: !completed })
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
    } catch (err: any) {
      alert(err.message || 'Error al actualizar')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCalendarEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      alert(err.message || 'Error al eliminar')
    }
  }

  const now = new Date()
  const filteredEvents = events.filter(e => {
    if (filter === 'pending') return !e.completed
    if (filter === 'completed') return e.completed
    return true
  })

  const upcoming = filteredEvents.filter(e => !e.completed && new Date(e.dueDate) >= now)
  const overdue = filteredEvents.filter(e => !e.completed && new Date(e.dueDate) < now)
  const completed = filteredEvents.filter(e => e.completed)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return t('calendar.today') + ', ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    if (d.toDateString() === tomorrow.toDateString()) return t('calendar.tomorrow') + ', ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeIcon = (type: string) => {
    const found = EVENT_TYPES.find(t => t.value === type)
    return found ? found.icon() : ListChecks({ size: 20 })
  }

  const renderEvent = (event: CalendarEvent) => {
    const isOverdue = !event.completed && new Date(event.dueDate) < now
    return (
      <div key={event.id} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: 'var(--bg-secondary)', borderRadius: 12,
        borderLeft: `4px solid ${isOverdue ? 'var(--accent-red)' : event.color || 'var(--accent)'}`,
        opacity: event.completed ? 0.6 : 1,
      }}>
        <button onClick={() => handleToggle(event.id, event.completed)} style={{
          width: 22, height: 22, borderRadius: '50%', border: `2px solid ${event.completed ? 'var(--accent-green)' : 'var(--border-color)'}`,
          background: event.completed ? 'var(--accent-green)' : 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12,
        }}>
          {event.completed && Check({ size: 12 })}
        </button>
        <span style={{ fontSize: 20 }}>{getTypeIcon(event.eventType)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, textDecoration: event.completed ? 'line-through' : 'none' }}>
            {event.title}
          </div>
          <div style={{ fontSize: 12, color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {isOverdue && <>{AlertTriangle({ size: 12 })} </>}{formatDate(event.dueDate)}
            {event.description && ` · ${event.description.slice(0, 50)}`}
          </div>
        </div>
        <button onClick={() => handleDelete(event.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          fontSize: 16, padding: 4, opacity: 0.5,
        }}>{X({ size: 14 })}</button>
      </div>
    )
  }

  // --- Month grid helpers ---
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    // Monday=0 ... Sunday=6 (ISO week)
    let startDow = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    // Leading blanks
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    // Trailing blanks to fill 7-col grid
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [currentMonth])

  const eventsForDay = (day: Date) => {
    return filteredEvents.filter(e => {
      const d = new Date(e.dueDate)
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
    })
  }

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const handleDayClick = (day: Date) => {
    const dayEvents = eventsForDay(day)
    if (dayEvents.length > 0) {
      setSelectedDay(prev => prev && isSameDay(prev, day) ? null : day)
    } else {
      // Quick-add: open form with date pre-filled
      const yyyy = day.getFullYear()
      const mm = String(day.getMonth() + 1).padStart(2, '0')
      const dd = String(day.getDate()).padStart(2, '0')
      setDueDate(`${yyyy}-${mm}-${dd}T09:00`)
      setShowForm(true)
    }
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const monthLabel = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  const DOW_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const renderMonthGrid = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          {ChevronLeft({ size: 20 })}
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          {ChevronRight({ size: 20 })}
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} style={{ minHeight: 64, background: 'var(--bg-primary)', borderRadius: 8 }} />
          const dayEvts = eventsForDay(day)
          const isToday = isSameDay(day, now)
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const hasOverdue = dayEvts.some(e => !e.completed && new Date(e.dueDate) < now)
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              style={{
                minHeight: 64,
                padding: '6px 8px',
                background: isSelected ? 'color-mix(in srgb, var(--accent) 15%, var(--bg-secondary))' : 'var(--bg-secondary)',
                borderRadius: 8,
                cursor: 'pointer',
                border: isToday ? '2px solid var(--accent)' : isSelected ? '2px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '2px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {day.getDate()}
                {hasOverdue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)', display: 'inline-block' }} />}
              </div>
              {dayEvts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {dayEvts.slice(0, 4).map((evt, j) => (
                    <span key={j} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: evt.completed ? 'var(--accent-green)' : (evt.color || 'var(--accent)'),
                      display: 'inline-block',
                      opacity: evt.completed ? 0.5 : 1,
                    }} />
                  ))}
                  {dayEvts.length > 4 && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: '7px' }}>+{dayEvts.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (() => {
        const dayEvts = eventsForDay(selectedDay)
        return dayEvts.length > 0 ? (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {selectedDay.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {X({ size: 14 })}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayEvts.map(renderEvent)}
            </div>
          </div>
        ) : null
      })()}
    </div>
  )

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{CalendarIcon()} {t('calendar.title')}</h2>
            <p>{t('calendar.subtitle')}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>{t('calendar.new')}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'pending', 'completed'] as const).map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? t('calendar.tabAll') : f === 'pending' ? t('calendar.tabPending') : t('calendar.tabCompleted')}
                {f === 'pending' && overdue.length > 0 && <span style={{ marginLeft: 6, background: 'var(--accent-red)', color: '#fff', borderRadius: 10, padding: '2px 6px', fontSize: 10 }}>{overdue.length}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 2 }}>
            <button
              onClick={() => setView('month')}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: view === 'month' ? 'var(--accent)' : 'transparent',
                color: view === 'month' ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s ease',
              }}
            >
              {LayoutGrid({ size: 14 })} Mes
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: view === 'list' ? 'var(--accent)' : 'transparent',
                color: view === 'list' ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s ease',
              }}
            >
              {ListChecks({ size: 14 })} Lista
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
        ) : events.length === 0 && !showForm ? (
          <div className="empty-state" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ marginBottom: 16, opacity: 0.6 }}>{CalendarIcon({ size: 56, color: 'var(--accent)' })}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Organiza tu semestre</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Agenda pruebas, entregas y sesiones de estudio para no olvidar nada importante
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
              Ej: Solemne 1 Calculo, Entrega informe, Repaso grupal
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Nuevo evento
            </button>
          </div>
        ) : view === 'month' ? (
          renderMonthGrid()
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {overdue.length > 0 && filter !== 'completed' && (
              <div>
                <h3 style={{ fontSize: 14, color: 'var(--accent-red)', marginBottom: 8 }}>{AlertTriangle({ size: 14 })} {t('calendar.overdue')} ({overdue.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{overdue.map(renderEvent)}</div>
              </div>
            )}
            {upcoming.length > 0 && filter !== 'completed' && (
              <div>
                <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>{Target({ size: 14 })} {t('calendar.upcoming')} ({upcoming.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map(renderEvent)}</div>
              </div>
            )}
            {completed.length > 0 && filter !== 'pending' && (
              <div>
                <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>{CheckCircle({ size: 14 })} {t('calendar.completed')} ({completed.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{completed.map(renderEvent)}</div>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{t('calendar.modalTitle')}</h3>
              <div className="auth-field">
                <label>{t('calendar.titleLabel')}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('calendar.titlePlaceholder')} autoFocus />
              </div>
              <div className="auth-field">
                <label>{t('calendar.typeLabel')}</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {EVENT_TYPES.map(et => (
                    <option key={et.value} value={et.value}>{t(et.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label>{t('calendar.dateLabel')}</label>
                <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
              <div className="auth-field">
                <label>{t('calendar.subjectLabel')}</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">{t('calendar.noSubject')}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label>{t('calendar.descLabel')}</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('calendar.descPlaceholder')} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('calendar.cancel')}</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!title.trim() || !dueDate}>{t('calendar.createSubmit')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
