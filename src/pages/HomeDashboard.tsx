import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { Project } from '../types'
import { BookOpen, FileText, Clock, Star, Flame, Trophy, Calendar, MessageSquare, Users, BarChart3, Sun, CloudSun, Moon, Shield, ChevronRight, Plus, Sparkles } from '../components/Icons'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

function getGreeting(t: (key: string) => string): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours()
  if (h < 12) return { text: t('dash.goodMorning'), icon: Sun({ size: 22, color: '#f59e0b' }) }
  if (h < 18) return { text: t('dash.goodAfternoon'), icon: CloudSun({ size: 22, color: '#f59e0b' }) }
  return { text: t('dash.goodEvening'), icon: Moon({ size: 22, color: '#6366f1' }) }
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 60) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function timeAgo(iso: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('dash.timeAgoNow')
  if (mins < 60) return t('dash.timeAgoMin').replace('{n}', String(mins))
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('dash.timeAgoHr').replace('{n}', String(hrs))
  return t('dash.timeAgoDay').replace('{n}', String(Math.floor(hrs / 24)))
}

const DAY_KEYS = ['dash.daySun', 'dash.dayMon', 'dash.dayTue', 'dash.dayWed', 'dash.dayThu', 'dash.dayFri', 'dash.daySat']
const MONTH_KEYS = ['dash.monthJan', 'dash.monthFeb', 'dash.monthMar', 'dash.monthApr', 'dash.monthMay', 'dash.monthJun', 'dash.monthJul', 'dash.monthAug', 'dash.monthSep', 'dash.monthOct', 'dash.monthNov', 'dash.monthDec']

export default function HomeDashboard({ projects, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [stats, setStats] = useState<any>(null)
  const [studyTime, setStudyTime] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dailySummary, setDailySummary] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      api.getGamificationStats().then(setStats).catch(() => {}),
      api.getStudyTime().then(setStudyTime).catch(() => {}),
      api.getActivityFeed(1).then(d => setActivity((d.items || d).slice(0, 4))).catch(() => {}),
      api.getCalendarEvents().then(d => {
        const today = new Date().toISOString().split('T')[0]
        const upcoming = (d || []).filter((e: any) => e.date >= today).slice(0, 3)
        setEvents(upcoming)
      }).catch(() => {}),
      api.dailySummary().then(setDailySummary).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const greeting = getGreeting(t)
  const totalDocs = projects.reduce((sum, p) => sum + p.documents.length, 0)
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

  // Calculate average progress across projects (based on documents)
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => {
        const prog = p.documents.length > 0 ? Math.min(100, p.documents.length * 15) : 0
        return sum + prog
      }, 0) / projects.length)
    : 0

  if (loading) {
    return (
      <div className="home-dash page-enter">
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 24, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '25%', height: 14, marginBottom: 28 }} />
        <div className="home-stats">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="home-widgets" style={{ marginTop: 24 }}>
          <div className="skeleton skeleton-card" style={{ height: 200 }} />
          <div className="skeleton skeleton-card" style={{ height: 200 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="home-dash page-enter">

      {/* ─── Primeros pasos (only for new users with 0 subjects) ─── */}
      {!loading && projects.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {Sparkles({ size: 16, color: 'var(--accent)' })}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              ¡Bienvenido/a! Empieza en 3 pasos
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                num: '1', title: 'Crea tu primera asignatura',
                desc: 'Organiza tus apuntes y documentos por materia',
                action: () => onNavigate('/dashboard'),
                cta: 'Crear asignatura',
                color: 'var(--accent-blue)',
              },
              {
                num: '2', title: 'Conecta con compañeros',
                desc: 'Encuentra estudiantes de tu universidad y carrera',
                action: () => onNavigate('/friends'),
                cta: 'Buscar compañeros',
                color: 'var(--accent-green)',
              },
              {
                num: '3', title: 'Únete a una comunidad',
                desc: 'Grupos de estudio por materia, con recursos compartidos',
                action: () => onNavigate('/communities'),
                cta: 'Ver comunidades',
                color: 'var(--accent-purple)',
              },
            ].map(step => (
              <div key={step.num} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--bg-card)', borderRadius: 10,
                padding: '12px 16px', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: step.color + '18', color: step.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{step.num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{step.desc}</div>
                </div>
                <button
                  onClick={step.action}
                  style={{
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    padding: '7px 14px', fontSize: 12, fontWeight: 600,
                    background: step.color + '14', color: step.color,
                    flexShrink: 0, whiteSpace: 'nowrap',
                  }}
                >{step.cta}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="home-greeting">
            {greeting.icon} {greeting.text}, <span>{user?.firstName}</span>
          </div>
          <div className="home-date">
            {t(DAY_KEYS[now.getDay()])} {now.getDate()} {t('dash.dateOf') ? t('dash.dateOf') + ' ' : ''}{t(MONTH_KEYS[now.getMonth()])}, {now.getFullYear()} — {t('dash.week')} {weekNum}
          </div>
        </div>

        {/* Streak badge */}
        {stats && (stats.streakDays || 0) > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,154,86,0.08))',
            border: '1px solid rgba(255,107,53,0.3)',
            borderRadius: 14, padding: '10px 16px',
          }}>
            {Flame({ size: 24, color: '#ff6b35' })}
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ff6b35', lineHeight: 1 }}>
                {stats.streakDays}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                {stats.streakDays === 1 ? t('dash.streakDay') : t('dash.streakDays')} {t('dash.streakOf')}
              </div>
            </div>
            {(stats.streakFreezes || 0) > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'var(--bg-secondary)', borderRadius: 6, padding: '3px 6px',
                fontSize: 10, color: 'var(--text-muted)',
              }}>
                {Shield({ size: 12 })} {stats.streakFreezes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="u-card-flat" style={{
          padding: '16px 20px', marginBottom: 20,
          borderLeft: `4px solid ${dailySummary.mood === 'positive' ? 'var(--accent-green)' : dailySummary.mood === 'alert' ? 'var(--accent-orange)' : 'var(--accent-blue)'}`,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: dailySummary.mood === 'positive' ? 'rgba(5,150,105,0.08)' : dailySummary.mood === 'alert' ? 'rgba(217,119,6,0.08)' : 'rgba(37,99,235,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {Sparkles({ size: 16, color: dailySummary.mood === 'positive' ? 'var(--accent-green)' : dailySummary.mood === 'alert' ? 'var(--accent-orange)' : 'var(--accent-blue)' })}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{dailySummary.summary}</div>
              {dailySummary.tip && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                  {t('dash.tip')} {dailySummary.tip}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="home-stats">
        <div className="home-stat hover-lift" onClick={() => onNavigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="home-stat-icon" style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--accent-blue)' }}>
            {BookOpen({ size: 18, color: 'var(--accent-blue)' })}
          </div>
          <div className="home-stat-value">{projects.length}</div>
          <div className="home-stat-label">{t('dash.activeSubjects')}</div>
        </div>
        <div className="home-stat hover-lift">
          <div className="home-stat-icon" style={{ background: 'rgba(5,150,105,0.08)', color: 'var(--accent-green)' }}>
            {Clock({ size: 18, color: 'var(--accent-green)' })}
          </div>
          <div className="home-stat-value">{formatTime(studyTime?.weekSeconds || 0)}</div>
          <div className="home-stat-label">{t('dash.hoursThisWeek')}</div>
          {studyTime?.todaySeconds > 0 && (
            <div className="home-stat-trend up">+{formatTime(studyTime.todaySeconds)} {t('dash.todayPlus')}</div>
          )}
        </div>
        <div className="home-stat hover-lift" onClick={() => onNavigate('/marketplace')} style={{ cursor: 'pointer' }}>
          <div className="home-stat-icon" style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--accent-purple)' }}>
            {FileText({ size: 18, color: 'var(--accent-purple)' })}
          </div>
          <div className="home-stat-value">{totalDocs}</div>
          <div className="home-stat-label">{t('dash.notesCreated')}</div>
        </div>
        <div className="home-stat hover-lift" onClick={() => onNavigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="home-stat-icon" style={{ background: 'rgba(217,119,6,0.08)', color: 'var(--accent-orange)' }}>
            {BarChart3({ size: 18, color: 'var(--accent-orange)' })}
          </div>
          <div className="home-stat-value">{t('dash.level')} {stats?.level || 1}</div>
          <div className="home-stat-label">{stats?.xp || 0} {t('dash.xpTotal')}</div>
          {stats && (
            <div style={{ marginTop: 8, height: 4, background: 'var(--bg-primary)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(stats.xp || 0) % 100}%`, background: 'var(--accent-orange)', borderRadius: 99, transition: 'width 0.6s' }} />
            </div>
          )}
        </div>
      </div>

      {/* Widgets Row */}
      <div className="home-widgets">
        {/* Left: Activity Feed */}
        <div className="home-widget">
          <div className="home-widget-title">
            {t('dash.recentActivity')}
            <button className="see-all" onClick={() => onNavigate('/feed')}>{t('dash.seeAll')} →</button>
          </div>
          {activity.length > 0 ? (
            activity.map((act: any, i: number) => (
              <div key={i} className="mini-feed-item" style={{ cursor: 'pointer' }}
                onClick={() => act.userId && onNavigate(`/user/${act.userId}`)}>
                <div className="mini-avatar" style={{ background: 'var(--accent)' }}>
                  {act.avatar
                    ? <img src={act.avatar} alt="" />
                    : (act.firstName?.[0] || '?')}
                </div>
                <div>
                  <div className="mini-feed-text">
                    <strong>{act.firstName} {act.lastName}</strong> {act.activityType || act.content || ''}
                  </div>
                  <div className="mini-feed-time">{act.createdAt ? timeAgo(act.createdAt, t) : ''}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon" style={{ background: 'rgba(249,115,22,0.08)', width: 48, height: 48, borderRadius: 12 }}>
                {Users({ size: 22, color: 'var(--accent-orange)' })}
              </div>
              <div className="empty-state-title" style={{ fontSize: 14 }}>{t('dash.noRecentActivity')}</div>
              <div className="empty-state-desc" style={{ fontSize: 12 }}>{t('dash.connectStudents')}</div>
              <button className="empty-state-cta" style={{ padding: '8px 16px', fontSize: 12 }}
                onClick={() => onNavigate('/friends')}>
                {Plus({ size: 14 })} {t('dash.findStudents')}
              </button>
            </div>
          )}
        </div>

        {/* Right column: Calendar + Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Today's events */}
          <div className="home-widget">
            <div className="home-widget-title">
              {Calendar({ size: 15 })} {t('dash.today')}
              <button className="see-all" onClick={() => onNavigate('/calendar')}>{t('dash.calendar')} →</button>
            </div>
            {events.length > 0 ? (
              events.map((ev: any, i: number) => (
                <div key={i} className="mini-cal-item">
                  <div className="mini-cal-dot" style={{
                    background: ev.type === 'deadline' ? 'var(--accent-red)'
                      : ev.type === 'study' ? 'var(--accent-blue)'
                      : 'var(--accent-green)'
                  }} />
                  <div className="mini-cal-text">{ev.title}</div>
                  <div className="mini-cal-time">{ev.time || ''}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('dash.nothingScheduled')}</div>
                <button style={{
                  marginTop: 8, border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--accent)', fontWeight: 600,
                }} onClick={() => onNavigate('/calendar')}>
                  {t('dash.addEvent')}
                </button>
              </div>
            )}
          </div>

          {/* Subject Progress */}
          <div className="home-widget">
            <div className="home-widget-title">{t('dash.subjectProgress')}</div>
            {projects.length > 0 ? (
              projects.slice(0, 4).map((p, i) => {
                const prog = Math.min(100, p.documents.length * 15)
                const colors = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-purple)', 'var(--accent-orange)']
                return (
                  <div key={p.id} className="progress-row">
                    <div className="progress-label">{p.name}</div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${prog}%`, background: colors[i % 4] }} />
                    </div>
                    <div className="progress-pct" style={{ color: colors[i % 4] }}>{prog}%</div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '8px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{t('dash.addFirstSubject')}</div>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  style={{
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    padding: '7px 16px', fontSize: 12, fontWeight: 600,
                    background: 'var(--accent)', color: '#fff',
                  }}
                >
                  {Plus({ size: 12 })} Nueva asignatura
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
        {[
          { icon: MessageSquare({ size: 20 }), label: t('dash.messages'), path: '/messages', color: 'var(--accent-green)' },
          { icon: Calendar({ size: 20 }), label: t('dash.calendar'), path: '/calendar', color: 'var(--accent-orange)' },
          { icon: BookOpen({ size: 20 }), label: t('dash.notes'), path: '/marketplace', color: 'var(--accent-blue)' },
          { icon: Users({ size: 20 }), label: t('dash.communities'), path: '/communities', color: 'var(--accent-purple)' },
        ].map(a => (
          <button key={a.path} className="u-card hover-lift press-feedback" onClick={() => onNavigate(a.path)}
            style={{ cursor: 'pointer', textAlign: 'center', padding: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
            <div style={{ color: a.color, marginBottom: 4 }}>{a.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* My Subjects */}
      {projects.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {BookOpen({ size: 16 })} {t('dash.mySubjects')}
            </h3>
            <button style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => onNavigate('/dashboard')}>
              {t('dash.seeAll')} →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {projects.slice(0, 4).map(p => (
              <div key={p.id} className="u-card hover-lift press-feedback"
                onClick={() => onNavigate(`/project/${p.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: (p.color || 'var(--accent)') + '18',
                    color: p.color || 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 600,
                  }}>
                    {p.icon || p.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.documents.length} {t('dash.documents').toLowerCase()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
