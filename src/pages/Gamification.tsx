import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

/* ─── Badge definitions ─────────────────────────────────────────── */
const BADGE_DEFS: Record<string, { emoji: string; name: string; description: string; hint: string }> = {
  first_login:      { emoji: '🎉', name: 'Bienvenido',        description: 'Primer inicio de sesión',     hint: 'Inicia sesión por primera vez' },
  streak_7:         { emoji: '🔥', name: 'Racha Semanal',     description: '7 días de racha',              hint: 'Necesitas 7 días de racha' },
  streak_30:        { emoji: '💎', name: 'Racha Legendaria',   description: '30 días consecutivos',         hint: 'Necesitas 30 días consecutivos' },
  study_1h:         { emoji: '📖', name: 'Primer Paso',       description: '1 hora de estudio',            hint: 'Estudia durante 1 hora' },
  study_10h:        { emoji: '📚', name: 'Estudioso',          description: '10 horas de estudio',          hint: 'Acumula 10 horas de estudio' },
  study_50h:        { emoji: '🎓', name: 'Dedicado',           description: '50 horas de estudio',          hint: 'Acumula 50 horas de estudio' },
  study_100h:       { emoji: '🏆', name: 'Maestro',            description: '100 horas de estudio',         hint: 'Acumula 100 horas de estudio' },
  quiz_master:      { emoji: '🧠', name: 'Quiz Master',       description: 'Aprueba 10 quizzes',           hint: 'Aprueba 10 quizzes' },
  social_butterfly: { emoji: '🦋', name: 'Mariposa Social',   description: '10 amigos',                    hint: 'Agrega 10 amigos' },
  helper:           { emoji: '🤝', name: 'Ayudante',          description: 'Ayuda a 5 compañeros',         hint: 'Ayuda a 5 compañeros' },
  league_gold:      { emoji: '🥇', name: 'Liga de Oro',       description: 'Liga de Oro',                  hint: 'Alcanza la Liga de Oro' },
  league_diamond:   { emoji: '💠', name: 'Liga Diamante',     description: 'Liga Diamante',                hint: 'Alcanza la Liga Diamante' },
  early_bird:       { emoji: '🌅', name: 'Madrugador',        description: 'Estudio antes de las 8am',     hint: 'Estudia antes de las 8am' },
}

/* ─── Daily challenges ──────────────────────────────────────────── */
interface DailyChallenge {
  id: string
  label: string
  target: number
  unit: string
  xp: number
  progress: number
  claimed: boolean
}

function getDailyChallenges(): DailyChallenge[] {
  const today = new Date().toISOString().slice(0, 10)
  const storageKey = `conniku_daily_challenges_${today}`
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fallthrough */ }
  }
  // Clean old days
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('conniku_daily_challenges_') && k !== storageKey) {
      localStorage.removeItem(k)
    }
  }
  const challenges: DailyChallenge[] = [
    { id: 'study_30', label: 'Estudia 30 minutos', target: 30, unit: 'min', xp: 50, progress: 0, claimed: false },
    { id: 'quiz_1', label: 'Completa 1 quiz', target: 1, unit: '', xp: 30, progress: 0, claimed: false },
    { id: 'feed_1', label: 'Publica en el feed', target: 1, unit: '', xp: 20, progress: 0, claimed: false },
  ]
  localStorage.setItem(storageKey, JSON.stringify(challenges))
  return challenges
}

function getWeeklyChallenge() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const weekKey = `conniku_weekly_challenge_${monday.toISOString().slice(0, 10)}`
  const stored = localStorage.getItem(weekKey)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fallthrough */ }
  }
  const challenge = { id: 'weekly_5days', label: 'Estudia 5 días esta semana', target: 5, xp: 200, progress: 0, claimed: false }
  localStorage.setItem(weekKey, JSON.stringify(challenge))
  return challenge
}

function getLeagueHistory(): Array<{ week: string; tier: string; rank: number }> {
  const stored = localStorage.getItem('conniku_league_history')
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

function saveLeagueHistory(history: Array<{ week: string; tier: string; rank: number }>) {
  localStorage.setItem('conniku_league_history', JSON.stringify(history))
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function formatStudyTime(seconds: number): string {
  if (seconds < 60) return '0m'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

const TABS = ['Mi Progreso', 'Insignias', 'Liga Semanal', 'Desafíos Diarios'] as const
type Tab = typeof TABS[number]

/* ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Gamification({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<Tab>('Mi Progreso')

  const [stats, setStats] = useState<any>(null)
  const [studyTime, setStudyTime] = useState<any>(null)
  const [league, setLeague] = useState<any>(null)
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>(getDailyChallenges)
  const [weeklyChal, setWeeklyChal] = useState(getWeeklyChallenge)
  const [leagueHistory, setLeagueHistory] = useState(getLeagueHistory)

  useEffect(() => {
    api.getGamificationStats().then(setStats).catch(() => {})
    api.getStudyTime().then(setStudyTime).catch(() => {})
    api.getLeague().then(data => {
      setLeague(data)
      // Persist to league history
      if (data?.tierName && data?.userRank) {
        const now = new Date()
        const monday = new Date(now)
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        const weekStr = monday.toISOString().slice(0, 10)
        const history = getLeagueHistory()
        const idx = history.findIndex(h => h.week === weekStr)
        const entry = { week: weekStr, tier: data.tierName, rank: data.userRank }
        if (idx >= 0) history[idx] = entry
        else history.push(entry)
        saveLeagueHistory(history.slice(-12))
        setLeagueHistory(history.slice(-12))
      }
    }).catch(() => {})
  }, [])

  // Update daily challenge progress from study time
  useEffect(() => {
    if (studyTime?.todaySeconds) {
      const mins = Math.floor(studyTime.todaySeconds / 60)
      setDailyChallenges(prev => {
        const updated = prev.map(c => c.id === 'study_30' ? { ...c, progress: Math.min(mins, c.target) } : c)
        const today = new Date().toISOString().slice(0, 10)
        localStorage.setItem(`conniku_daily_challenges_${today}`, JSON.stringify(updated))
        return updated
      })
    }
  }, [studyTime])

  const level = stats?.level || 1
  const xp = stats?.xp || 0
  const xpInLevel = xp % 100
  const xpForNext = 100

  const claimChallenge = (id: string) => {
    setDailyChallenges(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, claimed: true } : c)
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem(`conniku_daily_challenges_${today}`, JSON.stringify(updated))
      return updated
    })
  }

  const claimWeekly = () => {
    const updated = { ...weeklyChal, claimed: true }
    setWeeklyChal(updated)
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    localStorage.setItem(`conniku_weekly_challenge_${monday.toISOString().slice(0, 10)}`, JSON.stringify(updated))
  }

  /* ─── Render helpers ────────────────────────────────────────────── */
  const renderProgress = () => {
    const streakDays = stats?.streakDays || 0
    const bestStreak = stats?.bestStreak || streakDays
    const freezes = stats?.streakFreezes || 0
    const weekSeconds = studyTime?.weekSeconds || 0
    const dailyBreakdown = studyTime?.dailyBreakdown || []
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const maxDaily = Math.max(1, ...dailyBreakdown.map((d: any) => d?.seconds || 0))

    return (
      <div style={{ display: 'grid', gap: 20 }}>
        {/* XP Ring + Level */}
        <div className="u-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 16px' }}>
            <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-tertiary)" strokeWidth="10" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--accent)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(xpInLevel / xpForNext) * 440} 440`}
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{level}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>NIVEL</span>
            </div>
          </div>
          <div style={{ maxWidth: 300, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>{xp} XP total</span>
              <span>{xpInLevel}/{xpForNext} XP</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(xpInLevel / xpForNext) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--accent-purple, #8b5cf6))',
                borderRadius: 4, transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="u-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #ff6b3520, #ff9a5620)',
              border: '2px solid #ff6b35',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>
              🔥
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ff6b35', lineHeight: 1 }}>{streakDays}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {streakDays === 1 ? 'día' : 'días'} de racha
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{bestStreak}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Mejor racha</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                  🛡️ {freezes}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Escudos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Time This Week */}
        <div className="u-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📊 Tiempo de estudio esta semana</h3>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{formatStudyTime(weekSeconds)}</span>
          </div>
          {/* Daily bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {dayLabels.map((day, i) => {
              const secs = dailyBreakdown[i]?.seconds || 0
              const pct = (secs / maxDaily) * 100
              const isToday = i === ((new Date().getDay() + 6) % 7)
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {secs > 0 ? formatStudyTime(secs) : ''}
                  </span>
                  <div style={{
                    width: '100%', maxWidth: 40,
                    height: `${Math.max(pct, 4)}%`,
                    background: isToday
                      ? 'linear-gradient(180deg, var(--accent), var(--accent-purple, #8b5cf6))'
                      : 'var(--bg-tertiary)',
                    borderRadius: 6,
                    transition: 'height 0.4s ease',
                    minHeight: 4,
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                  }}>{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <button className="btn btn-primary" onClick={() => onNavigate('/study-rooms')}
          style={{ width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
          🚀 Estudiar ahora
        </button>
      </div>
    )
  }

  const renderBadges = () => {
    const earnedBadges: any[] = stats?.badges || []
    const earnedMap = new Map<string, any>(earnedBadges.map((b: any) => [b.id, b]))

    return (
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          {earnedBadges.filter((b: any) => b.earned).length} de {Object.keys(BADGE_DEFS).length} insignias desbloqueadas
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {Object.entries(BADGE_DEFS).map(([id, def]) => {
            const earned = earnedMap.get(id)
            const isEarned = earned?.earned || earned?.earnedAt
            return (
              <div key={id} className="u-card" style={{
                padding: 16, textAlign: 'center', position: 'relative',
                filter: isEarned ? 'none' : 'grayscale(1)',
                opacity: isEarned ? 1 : 0.5,
                transition: 'all 0.3s',
                ...(isEarned ? {
                  boxShadow: '0 0 20px var(--accent)22, 0 0 40px var(--accent)11',
                  border: '1px solid var(--accent)',
                } : {}),
              }}>
                <div style={{ fontSize: 40, marginBottom: 8, lineHeight: 1 }}>{def.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{def.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{def.description}</div>
                {isEarned ? (
                  <div style={{ fontSize: 11, color: 'var(--accent-green, #22c55e)', fontWeight: 600 }}>
                    ✅ Desbloqueada{earned.earnedAt ? ` · ${new Date(earned.earnedAt).toLocaleDateString('es-CL')}` : ''}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    🔒 {def.hint}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderLeague = () => {
    const tierEmoji = league?.tierEmoji || '🥉'
    const tierName = league?.tierName || 'Bronce'
    const leaderboard = league?.leaderboard || []
    const promotionZone = league?.promotionZone || 3
    const demotionZone = league?.demotionZone || 3
    const total = leaderboard.length

    return (
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Current tier */}
        <div className="u-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>{tierEmoji}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Liga {tierName}</div>
          {league && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Posición #{league.userRank} · {league.weeklyXp} XP esta semana · {league.daysLeft}d restantes
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="u-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🏅 Tabla de Posiciones</h3>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Cargando tabla...
            </div>
          ) : (
            <div>
              {leaderboard.map((entry: any, i: number) => {
                const rank = entry.rank || (i + 1)
                const isUser = entry.userId === user?.id
                const inPromo = rank <= promotionZone
                const inDemo = rank > total - demotionZone && total > demotionZone
                let rowBg = 'transparent'
                if (inPromo) rowBg = 'var(--accent-green, #22c55e)08'
                if (inDemo) rowBg = '#ef444408'
                if (isUser) rowBg = 'var(--accent)12'

                return (
                  <div key={entry.userId || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px',
                    background: rowBg,
                    borderBottom: '1px solid var(--border-color)',
                    fontWeight: isUser ? 700 : 400,
                  }}>
                    <span style={{
                      width: 28, fontSize: 14, fontWeight: 700, textAlign: 'center',
                      color: inPromo ? 'var(--accent-green, #22c55e)' : inDemo ? '#ef4444' : 'var(--text-muted)',
                    }}>
                      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                    </span>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isUser ? 'var(--accent)' : 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden',
                    }}>
                      {entry.avatar
                        ? <img src={entry.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        : entry.firstName?.[0] || '?'}
                    </div>
                    <span style={{ flex: 1, fontSize: 14 }}>
                      {entry.firstName} {entry.lastName?.[0]}.
                      {isUser && <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 6 }}>(Tú)</span>}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {entry.weeklyXp} XP
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info note */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
        }}>
          📅 La liga se reinicia cada lunes. Los 3 primeros ascienden de liga, los 3 últimos descienden.
        </div>

        {/* League History */}
        {leagueHistory.length > 0 && (
          <div className="u-card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>📜 Historial de Ligas</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {leagueHistory.slice().reverse().map((h, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8,
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Semana del {new Date(h.week).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontWeight: 600 }}>Liga {h.tier}</span>
                  <span style={{ color: 'var(--text-muted)' }}>#{h.rank}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderChallenges = () => {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Daily challenges */}
        <div className="u-card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>⚡ Desafíos del Día</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {dailyChallenges.map(c => {
              const isComplete = c.progress >= c.target
              const pct = Math.min((c.progress / c.target) * 100, 100)
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: 14, borderRadius: 12,
                  background: c.claimed ? 'var(--accent-green, #22c55e)08' : 'var(--bg-secondary)',
                  border: `1px solid ${c.claimed ? 'var(--accent-green, #22c55e)' : 'var(--border-color)'}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                      {c.label}
                      <span style={{
                        marginLeft: 8, fontSize: 12, fontWeight: 700,
                        color: 'var(--accent-orange, #f59e0b)',
                      }}>+{c.xp} XP</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isComplete
                          ? 'var(--accent-green, #22c55e)'
                          : 'var(--accent)',
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {c.progress}{c.unit ? ` ${c.unit}` : ''} / {c.target}{c.unit ? ` ${c.unit}` : ''}
                    </div>
                  </div>
                  {c.claimed ? (
                    <span style={{ fontSize: 12, color: 'var(--accent-green, #22c55e)', fontWeight: 700 }}>✅ Reclamado</span>
                  ) : isComplete ? (
                    <button className="btn btn-primary" onClick={() => claimChallenge(c.id)}
                      style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}>
                      Reclamar
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly challenge */}
        <div className="u-card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>🗓️ Desafío Semanal</h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: 16, borderRadius: 12,
            background: weeklyChal.claimed ? 'var(--accent-green, #22c55e)08' : 'var(--bg-secondary)',
            border: `1px solid ${weeklyChal.claimed ? 'var(--accent-green, #22c55e)' : 'var(--border-color)'}`,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-purple, #8b5cf6))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              🏅
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {weeklyChal.label}
                <span style={{
                  marginLeft: 8, fontSize: 13, fontWeight: 700,
                  color: 'var(--accent-orange, #f59e0b)',
                }}>+{weeklyChal.xp} XP</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((weeklyChal.progress / weeklyChal.target) * 100, 100)}%`,
                  background: weeklyChal.progress >= weeklyChal.target ? 'var(--accent-green, #22c55e)' : 'var(--accent)',
                  borderRadius: 3, transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {weeklyChal.progress} / {weeklyChal.target} días
              </div>
            </div>
            {weeklyChal.claimed ? (
              <span style={{ fontSize: 12, color: 'var(--accent-green, #22c55e)', fontWeight: 700 }}>✅ Reclamado</span>
            ) : weeklyChal.progress >= weeklyChal.target ? (
              <button className="btn btn-primary" onClick={claimWeekly}
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}>
                Reclamar
              </button>
            ) : null}
          </div>
        </div>

        {/* Tips */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
        }}>
          💡 Los desafíos diarios se reinician a medianoche. ¡Completa todos para ganar bonus XP!
        </div>
      </div>
    )
  }

  /* ─── Main render ────────────────────────────────────────────── */
  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>🏆 Logros y Progreso</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Tu centro de gamificación — sube de nivel, desbloquea insignias y compite en la liga
            </p>
          </div>
          {stats && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 12, padding: '8px 16px',
            }}>
              <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 18 }}>Nv. {level}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{xp} XP</span>
              <span style={{ color: '#ff6b35', fontSize: 13, fontWeight: 600 }}>🔥 {stats.streakDays || 0}</span>
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          background: 'var(--bg-secondary)', borderRadius: 12, padding: 4,
          overflowX: 'auto',
        }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap',
              background: activeTab === tab ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Mi Progreso' && renderProgress()}
        {activeTab === 'Insignias' && renderBadges()}
        {activeTab === 'Liga Semanal' && renderLeague()}
        {activeTab === 'Desafíos Diarios' && renderChallenges()}
      </div>
    </>
  )
}
