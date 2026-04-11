import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project } from '../types'
import MilestonePopup from '../components/MilestonePopup'
import {
  Flame, BookOpen, FileText, Clock, Star, Trophy, BarChart3,
  MessageSquare, Calendar, Users, Medal, Lightbulb, Megaphone,
  Sun, CloudSun, Moon, Shield, GraduationCap, Brain, Rocket,
  CheckCircle, ChevronRight, Zap, Sparkles, Briefcase, Plus,
} from '../components/Icons'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

// ── Frases filosóficas diarias ───────────────────────────────
const PHILOSOPHY_QUOTES = [
  { quote: 'Educar la mente sin educar el corazón no es educación en absoluto.', author: 'Aristóteles' },
  { quote: 'La mente no es un recipiente que se llena, sino un fuego que se enciende.', author: 'Plutarco' },
  { quote: 'El aprendizaje nunca agota la mente.', author: 'Leonardo da Vinci' },
  { quote: 'Dime y lo olvido, enséñame y lo recuerdo, involúcrame y lo aprendo.', author: 'Benjamín Franklin' },
  { quote: 'Solo hay un bien: el conocimiento. Solo hay un mal: la ignorancia.', author: 'Sócrates' },
  { quote: 'Una inversión en conocimiento paga el mejor interés.', author: 'Benjamín Franklin' },
  { quote: 'La educación es el movimiento de la oscuridad a la luz.', author: 'Allan Bloom' },
  { quote: 'El objetivo de la educación es la virtud y el deseo de convertirse en un buen ciudadano.', author: 'Platón' },
  { quote: 'El conocimiento es la única cosa que nadie puede quitarte.', author: 'Nelson Mandela' },
  { quote: 'Aprender sin pensar es inútil. Pensar sin aprender es peligroso.', author: 'Confucio' },
  { quote: 'El aprendizaje es un tesoro que seguirá a su dueño a todas partes.', author: 'Proverbio chino' },
  { quote: 'No hay enseñanza sin que el maestro también aprenda.', author: 'Paulo Freire' },
  { quote: 'Toda la educación viene de dentro; tú no puedes obtenerla de nadie más.', author: 'Ralph Waldo Emerson' },
  { quote: 'La raíz del aprendizaje es amarga, pero su fruto es dulce.', author: 'Aristóteles' },
  { quote: 'El hombre sabio no da las respuestas correctas, hace las preguntas correctas.', author: 'Claude Lévi-Strauss' },
]

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return PHILOSOPHY_QUOTES[dayOfYear % PHILOSOPHY_QUOTES.length]
}

function getGreetingIcon() {
  const h = new Date().getHours()
  if (h < 12) return Sun({ size: 22, color: '#f59e0b' })
  if (h < 18) return CloudSun({ size: 22, color: '#f59e0b' })
  return Moon({ size: 22, color: '#6366f1' })
}

function formatStudyTime(seconds: number): string {
  if (seconds < 60) return '0m'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

const DAY_NAMES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

// ── Onboarding (usuario nuevo) ───────────────────────────────
interface OnboardingProps {
  user: any
  projects: Project[]
  onNavigate: (path: string) => void
}

function OnboardingSection({ user, projects, onNavigate }: OnboardingProps) {
  const [visited, setVisited] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('ob_visited') || '{}') } catch { return {} }
  })

  const markVisited = (id: string, path: string) => {
    const next = { ...visited, [id]: true }
    setVisited(next)
    localStorage.setItem('ob_visited', JSON.stringify(next))
    onNavigate(path)
  }

  const steps = [
    {
      id: 'profile',
      emoji: '👤',
      label: 'Completa tu perfil',
      desc: 'Agrega foto, carrera y una bio breve',
      done: !!(user?.avatar && user?.career),
      path: '/profile',
      cta: 'Completar',
    },
    {
      id: 'subject',
      emoji: '📚',
      label: 'Crea tu primera asignatura',
      desc: 'Sube apuntes y la IA genera quizzes automáticamente',
      done: projects.length > 0,
      path: '/new-project',
      cta: 'Crear',
    },
    {
      id: 'community',
      emoji: '🤝',
      label: 'Conecta con compañeros',
      desc: 'Encuentra estudiantes de tu universidad y carrera',
      done: !!visited['community'],
      path: '/communities',
      cta: 'Explorar',
    },
    {
      id: 'jobs',
      emoji: '💼',
      label: 'Revisa la Bolsa de Trabajo',
      desc: 'Prácticas y empleos para universitarios chilenos',
      done: !!visited['jobs'],
      path: '/jobs',
      cta: 'Ver ofertas',
    },
  ]

  const features = [
    {
      emoji: '🤖',
      title: 'IA Académica',
      desc: 'Sube tus apuntes y genera quizzes, flashcards y guías de estudio en segundos',
      accentColor: '#2563EB',
      path: '/new-project',
    },
    {
      emoji: '🌐',
      title: 'Comunidad',
      desc: 'Conecta con estudiantes de tu carrera, únete a comunidades y comparte conocimiento',
      accentColor: '#059669',
      path: '/communities',
    },
    {
      emoji: '💼',
      title: 'Bolsa de Trabajo',
      desc: 'Descubre prácticas y empleos pensados para universitarios',
      accentColor: '#7C3AED',
      path: '/jobs',
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const progress = Math.round((doneCount / steps.length) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero ── */}
      <div className="ob-hero">
        <div className="ob-hero-circle ob-hero-circle--1" />
        <div className="ob-hero-circle ob-hero-circle--2" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 38, marginBottom: 8, lineHeight: 1 }}>🚀</div>
          <h2 className="ob-hero-title">¡Bienvenido a Conniku, {user?.firstName}!</h2>
          <p className="ob-hero-sub">
            Tu plataforma académica inteligente. En menos de 5 minutos puedes tener tu primera
            asignatura lista con quizzes y flashcards generados por IA.
          </p>
          <button className="ob-hero-btn" onClick={() => onNavigate('/new-project')}>
            {Rocket({ size: 15 })} Empezar ahora
          </button>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div>
        <p className="ob-section-label">¿Qué puedes hacer en Conniku?</p>
        <div className="ob-feature-grid">
          {features.map(f => (
            <button
              key={f.path}
              className="ob-feature-card"
              onClick={() => onNavigate(f.path)}
            >
              <div
                className="ob-feature-icon"
                style={{ background: f.accentColor + '18' }}
              >
                {f.emoji}
              </div>
              <div className="ob-feature-title">{f.title}</div>
              <div className="ob-feature-desc">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Checklist ── */}
      <div className="u-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {Zap({ size: 16, color: 'var(--accent-orange)' })} Primeros pasos
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {doneCount}/{steps.length} completados
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress === 100
              ? 'var(--accent-green)'
              : 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
            borderRadius: 3,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map(step => (
            <div
              key={step.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: step.done ? 'var(--bg-secondary)' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                opacity: step.done ? 0.65 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{step.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 13,
                  textDecoration: step.done ? 'line-through' : 'none',
                  color: step.done ? 'var(--text-muted)' : 'var(--text-primary)',
                }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {step.desc}
                </div>
              </div>
              {step.done ? (
                <span style={{ flexShrink: 0 }}>
                  {CheckCircle({ size: 18, color: 'var(--accent-green)' })}
                </span>
              ) : (
                <button
                  onClick={() => markVisited(step.id, step.path)}
                  style={{
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '6px 12px', fontSize: 12,
                    fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.cta} {ChevronRight({ size: 12 })}
                </button>
              )}
            </div>
          ))}
        </div>

        {progress === 100 && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 10,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-green)',
            textAlign: 'center', fontSize: 13, fontWeight: 600,
            color: 'var(--accent-green)',
          }}>
            🎉 ¡Perfecto! Ya conoces Conniku. Tu camino académico empieza aquí.
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { icon: MessageSquare({ size: 22 }), label: 'Mensajes',   path: '/messages' },
          { icon: Calendar({ size: 22 }),      label: 'Calendario', path: '/calendar' },
          { icon: BookOpen({ size: 22 }),      label: 'Apuntes',    path: '/marketplace' },
          { icon: Users({ size: 22 }),         label: 'Comunidad',  path: '/communities' },
        ].map(a => (
          <button
            key={a.path}
            className="u-card ob-quick-action"
            onClick={() => onNavigate(a.path)}
          >
            <div style={{ color: 'var(--accent)', marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard principal ──────────────────────────────────────
export default function Dashboard({ projects, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [stats, setStats]               = useState<any>(null)
  const [studyTime, setStudyTime]       = useState<any>(null)
  const [league, setLeague]             = useState<any>(null)
  const [friendActivity, setFriendActivity] = useState<any[]>([])
  const [events, setEvents]             = useState<any[]>([])
  const [dailySummary, setDailySummary] = useState<any>(null)
  const [milestonePopup, setMilestonePopup] = useState<any>(null)

  useEffect(() => {
    api.getGamificationStats().then(data => {
      setStats(data)
      if (data.milestones?.length > 0) {
        const m = data.milestones[0]
        if (m.type === 'level_up')
          setMilestonePopup({ type: 'level_up', title: '¡Nuevo nivel!', description: `Has alcanzado el nivel ${m.level}`, icon: '⬆️' })
        else if (m.type === 'streak')
          setMilestonePopup({ type: 'streak', title: '¡Racha increíble!', description: `${m.days} días consecutivos de estudio`, icon: '🔥' })
        else if (m.type === 'badge')
          setMilestonePopup({ type: 'badge', title: '¡Nueva insignia!', description: `${m.emoji} ${m.name}: ${m.description}`, icon: m.emoji || '🏅' })
      }
    }).catch(() => {})
    api.getStudyTime().then(setStudyTime).catch(() => {})
    api.getLeague().then(setLeague).catch(() => {})
    api.getActivityFeed(1).then(data => setFriendActivity((data.items || data).slice(0, 5))).catch(() => {})
    api.getCalendarEvents().then(d => {
      const today = new Date().toISOString().split('T')[0]
      const upcoming = (d || []).filter((e: any) => e.date >= today).slice(0, 4)
      setEvents(upcoming)
    }).catch(() => {})
    api.dailySummary().then(setDailySummary).catch(() => {})
  }, [])

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  const now = new Date()
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)
  const totalDocs  = projects.reduce((sum, p) => sum + p.documents.length, 0)
  const isNewUser  = projects.length === 0 && (stats?.xp || 0) < 50
  const dailyQuote = getDailyQuote()

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              {getGreetingIcon()} {t(`welcome.${user?.gender || 'unspecified'}`)}, {user?.firstName}!
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {DAY_NAMES[now.getDay()]} {now.getDate()} de {MONTH_NAMES[now.getMonth()]} {now.getFullYear()} · Semana {weekNum}
            </p>
          </div>

          {/* Streak — solo usuarios activos */}
          {!isNewUser && stats && (stats.streakDays || 0) > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(135deg, #ff6b3520, #ff9a5620)',
              border: '2px solid #ff6b35', borderRadius: 16, padding: '10px 18px',
            }}>
              <span>{Flame({ size: 28, color: '#ff6b35' })}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ff6b35', lineHeight: 1 }}>
                  {stats.streakDays || 0}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {stats.streakDays === 1 ? 'día' : 'días'} de racha
                </div>
              </div>
              {(stats.streakFreezes || 0) > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--bg-secondary)', borderRadius: 8, padding: '4px 8px',
                  fontSize: 11, color: 'var(--text-muted)',
                }}>
                  {Shield({ size: 14 })} {stats.streakFreezes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="page-body">

        {/* ══ NUEVO USUARIO: onboarding ══ */}
        {isNewUser ? (
          <OnboardingSection user={user} projects={projects} onNavigate={onNavigate} />
        ) : (
          <>
            {/* ══ USUARIO ACTIVO: dashboard completo ══ */}

            {/* Resumen diario IA o frase del día */}
            {dailySummary ? (
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
                        💡 {dailySummary.tip}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                marginBottom: 20, padding: '16px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--accent)',
                borderRadius: 12,
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{
                  fontSize: 40, lineHeight: 1, color: 'var(--accent)',
                  opacity: 0.2, fontFamily: 'Georgia, serif', flexShrink: 0, marginTop: -6,
                }}>"</div>
                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                    {dailyQuote.quote}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
                    — {dailyQuote.author}
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                <div className="stat-icon">{BookOpen({ size: 20, color: 'var(--accent-blue)' })}</div>
                <div className="stat-value">{projects.length}</div>
                <div className="stat-label">{t('dash.projects')}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                <div className="stat-icon">{FileText({ size: 20, color: 'var(--accent-green)' })}</div>
                <div className="stat-value">{totalDocs}</div>
                <div className="stat-label">{t('dash.documents')}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
                <div className="stat-icon">{Clock({ size: 20, color: 'var(--accent-orange)' })}</div>
                <div className="stat-value">{formatStudyTime(studyTime?.weekSeconds || 0)}</div>
                <div className="stat-label">Esta semana</div>
                {(studyTime?.todaySeconds || 0) > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 4 }}>
                    +{formatStudyTime(studyTime.todaySeconds)} hoy
                  </div>
                )}
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                <div className="stat-icon">{Star({ size: 20, color: 'var(--accent-purple)' })}</div>
                <div className="stat-value">Nv. {stats?.level || 1}</div>
                <div className="stat-label">{stats?.xp || 0} XP</div>
                {stats && (
                  <div style={{ marginTop: 6, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.xp || 0) % 100}%`, background: 'var(--accent-purple)', borderRadius: 2, transition: 'width 0.6s' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Widgets: Actividad + Calendario */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>

              {/* Actividad de amigos */}
              <div className="u-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Megaphone({ size: 15 })} Actividad reciente
                  </h3>
                  <button style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => onNavigate('/feed')}>
                    Ver todo →
                  </button>
                </div>
                {friendActivity.length > 0 ? (
                  friendActivity.map((act: any, i: number) => {
                    const activityLabel: Record<string, { label: string; color: string; emoji: string }> = {
                      post: { label: 'publicó', color: '#3b82f6', emoji: '📝' },
                      photo: { label: 'subió una foto', color: '#8b5cf6', emoji: '📷' },
                      comment: { label: 'comentó', color: '#10b981', emoji: '💬' },
                      like: { label: 'reaccionó', color: '#f59e0b', emoji: '👍' },
                      join: { label: 'se unió', color: '#06b6d4', emoji: '🎉' },
                      achievement: { label: 'logró', color: '#f97316', emoji: '🏅' },
                      study: { label: 'estudió', color: '#6366f1', emoji: '📚' },
                    }
                    const typeKey = act.activityType?.toLowerCase() || 'post'
                    const meta = activityLabel[typeKey] || { label: act.activityType || 'publicó', color: '#3b82f6', emoji: '📝' }
                    const hasImage = !!(act.image || act.imageUrl || act.mediaUrl || act.thumbnail)
                    const imgSrc = act.image || act.imageUrl || act.mediaUrl || act.thumbnail

                    return (
                      <div key={i}
                        onClick={() => act.userId && onNavigate(`/user/${act.userId}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                          borderBottom: i < friendActivity.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: act.userId ? 'pointer' : 'default',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', flexShrink: 0,
                          boxShadow: '0 0 0 2px var(--bg-primary)',
                        }}>
                          {act.avatar
                            ? <img src={act.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                            : (act.firstName?.[0] || '?')}
                        </div>

                        {/* Text content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {act.firstName} {act.lastName}
                            </span>
                            {' '}
                            <span style={{ color: meta.color, fontWeight: 500 }}>{meta.emoji} {meta.label}</span>
                          </div>
                          {act.content && (
                            <div style={{
                              fontSize: 11, color: 'var(--text-muted)', marginTop: 2,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              maxWidth: hasImage ? '120px' : '100%',
                            }}>
                              {act.content}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {act.createdAt ? timeAgo(act.createdAt) : ''}
                          </div>
                        </div>

                        {/* Image thumbnail — shown when activity has a photo */}
                        {hasImage && (
                          <div style={{
                            width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                            flexShrink: 0, border: '1px solid var(--border)',
                          }}>
                            <img
                              src={imgSrc}
                              alt="Vista previa"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Sin actividad reciente</div>
                    <button style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => onNavigate('/friends')}>
                      {Plus({ size: 12 })} Conectar con estudiantes
                    </button>
                  </div>
                )}
              </div>

              {/* Calendario: próximos eventos */}
              <div className="u-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Calendar({ size: 15 })} Próximos eventos
                  </h3>
                  <button style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => onNavigate('/calendar')}>
                    Ver calendario →
                  </button>
                </div>
                {events.length > 0 ? (
                  events.map((ev: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                      borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: ev.type === 'deadline' ? 'var(--accent-red)'
                          : ev.type === 'study' ? 'var(--accent-blue)'
                          : 'var(--accent-green)',
                      }} />
                      <div style={{ flex: 1, fontSize: 13 }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {ev.time || ev.date?.slice(5) || ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Sin eventos próximos</div>
                    <button style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => onNavigate('/calendar')}>
                      + Agregar evento
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Liga + Tiempo de Estudio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              {/* Liga */}
              <div className="u-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Trophy({ size: 16, color: 'var(--accent-orange)' })} Liga Semanal
                  </h3>
                  {league && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{league.daysLeft}d restantes</span>}
                </div>
                {league ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 36 }}>{league.tierEmoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>Liga {league.tierName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Posición #{league.userRank} · {league.weeklyXp} XP esta semana
                        </div>
                      </div>
                    </div>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                      {league.leaderboard.slice(0, 5).map((entry: any) => (
                        <div key={entry.userId} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                          borderBottom: '1px solid var(--border)',
                          fontWeight: entry.userId === user?.id ? 700 : 400,
                          color: entry.rank <= league.promotionZone ? 'var(--accent-green)' : 'var(--text-primary)',
                        }}>
                          <span style={{ width: 24, fontSize: 13, color: 'var(--text-muted)' }}>#{entry.rank}</span>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: '#fff', overflow: 'hidden',
                          }}>
                            {entry.avatar
                              ? <img src={entry.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                              : entry.firstName?.[0]}
                          </div>
                          <span style={{ flex: 1, fontSize: 13 }}>{entry.firstName} {entry.lastName?.[0]}.</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.weeklyXp} XP</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                    Cargando liga...
                  </div>
                )}
              </div>

              {/* Tiempo de Estudio */}
              <div className="u-card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {BarChart3({ size: 16 })} Tiempo de Estudio
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Hoy',        val: studyTime?.todaySeconds  || 0 },
                    { label: 'Esta semana', val: studyTime?.weekSeconds   || 0 },
                    { label: 'Este mes',   val: studyTime?.monthSeconds  || 0 },
                    { label: 'Total',      val: studyTime?.totalSeconds  || 0 },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{formatStudyTime(val)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {stats && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Nivel {stats.level}</span>
                      <span>{stats.xp % 100}/100 XP</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${stats.xp % 100}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
              {[
                { icon: MessageSquare({ size: 24 }), label: 'Mensajes',   path: '/messages' },
                { icon: Calendar({ size: 24 }),      label: 'Calendario', path: '/calendar' },
                { icon: BookOpen({ size: 24 }),      label: 'Apuntes',    path: '/marketplace' },
                { icon: Users({ size: 24 }),         label: 'Comunidad',  path: '/communities' },
              ].map(a => (
                <button key={a.path} className="u-card" onClick={() => onNavigate(a.path)}
                  style={{ padding: 16, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--accent)' }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                </button>
              ))}
            </div>

            {/* Insignias */}
            {stats?.badges?.some((b: any) => b.earned) && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {Medal({ size: 16 })} Insignias
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {stats.badges.filter((b: any) => b.earned).map((badge: any) => (
                    <div key={badge.id} title={badge.description} style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '8px 14px', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 18 }}>{badge.emoji}</span>
                      <span>{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            {totalDocs === 0 && projects.length > 0 && (
              <div className="u-card" style={{ marginTop: 20, padding: 16, borderLeft: '4px solid var(--accent-orange)' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {Lightbulb({ size: 16, color: 'var(--accent-orange)' })} Consejo:
                </strong>{' '}
                Sube documentos a una asignatura para que Conniku genere guías, quizzes y flashcards automáticamente.
              </div>
            )}

            {/* Mis Asignaturas */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                {BookOpen({ size: 16 })} Mis Asignaturas
              </h3>
              <div className="projects-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card card" onClick={() => onNavigate(`/project/${project.id}`)}>
                    <div className="project-icon" style={{ background: project.color + '22', color: project.color }}>
                      {project.icon || project.name[0]}
                    </div>
                    <div className="project-info">
                      <h4>{project.name}</h4>
                      {project.description && <p>{project.description}</p>}
                      <span className="project-doc-count">{project.documents.length} documentos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {milestonePopup && (
        <MilestonePopup
          type={milestonePopup.type}
          title={milestonePopup.title}
          description={milestonePopup.description}
          icon={milestonePopup.icon}
          onClose={() => setMilestonePopup(null)}
        />
      )}
    </>
  )
}
