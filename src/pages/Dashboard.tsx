import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project } from '../types'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

function getGreetingTime() {
  const h = new Date().getHours()
  if (h < 12) return '☀️'
  if (h < 18) return '🌤'
  return '🌙'
}

function formatStudyTime(seconds: number): string {
  if (seconds < 60) return '0m'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function Dashboard({ projects, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [stats, setStats] = useState<any>(null)
  const [studyTime, setStudyTime] = useState<any>(null)
  const [league, setLeague] = useState<any>(null)
  const [friendActivity, setFriendActivity] = useState<any[]>([])

  useEffect(() => {
    api.getGamificationStats().then(setStats).catch(() => {})
    api.getStudyTime().then(setStudyTime).catch(() => {})
    api.getLeague().then(setLeague).catch(() => {})
    api.getActivityFeed(1).then(data => setFriendActivity((data.items || data).slice(0, 5))).catch(() => {})
  }, [])

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  const totalDocs = projects.reduce((sum, p) => sum + p.documents.length, 0)

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2>{getGreetingTime()} {t(`welcome.${user?.gender || 'unspecified'}`)}, {user?.firstName}!</h2>
            <p>Tu centro de estudio inteligente</p>
          </div>

          {/* Streak Widget */}
          {stats && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(135deg, #ff6b3520, #ff9a5620)',
              border: '2px solid #ff6b35',
              borderRadius: 16, padding: '12px 20px',
            }}>
              <span style={{ fontSize: 32 }}>🔥</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ff6b35', lineHeight: 1 }}>
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
                  🛡️ {stats.streakFreezes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
            <div className="stat-icon">📚</div>
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">{t('dash.projects')}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <div className="stat-icon">📄</div>
            <div className="stat-value">{totalDocs}</div>
            <div className="stat-label">{t('dash.documents')}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
            <div className="stat-icon">🕐</div>
            <div className="stat-value">{formatStudyTime(studyTime?.totalSeconds || 0)}</div>
            <div className="stat-label">{t('dash.studyTime')}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
            <div className="stat-icon">⭐</div>
            <div className="stat-value">Nv. {stats?.level || 1}</div>
            <div className="stat-label">{stats?.xp || 0} XP</div>
          </div>
        </div>

        {/* League + Study Time Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          {/* League Widget */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>🏆 Liga Semanal</h3>
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
                      borderBottom: '1px solid var(--border-color)',
                      fontWeight: entry.userId === user?.id ? 700 : 400,
                      color: entry.rank <= league.promotionZone ? 'var(--accent-green)' : 'var(--text-primary)',
                    }}>
                      <span style={{ width: 24, fontSize: 13, color: 'var(--text-muted)' }}>#{entry.rank}</span>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#fff', overflow: 'hidden',
                      }}>
                        {entry.avatar ? <img src={entry.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : entry.firstName?.[0]}
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

          {/* Study Time Breakdown */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>📊 Tiempo de Estudio</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatStudyTime(studyTime?.todaySeconds || 0)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hoy</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatStudyTime(studyTime?.weekSeconds || 0)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Esta semana</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatStudyTime(studyTime?.monthSeconds || 0)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Este mes</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatStudyTime(studyTime?.totalSeconds || 0)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
              </div>
            </div>

            {/* XP Progress Bar */}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { icon: '💬', label: 'Mensajes', path: '/messages' },
            { icon: '📅', label: 'Calendario', path: '/calendar' },
            { icon: '📚', label: 'Apuntes', path: '/marketplace' },
            { icon: '👥', label: 'Comunidad', path: '/friends' },
          ].map(action => (
            <button key={action.path} className="card" onClick={() => onNavigate(action.path)}
              style={{ padding: 16, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{action.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{action.label}</div>
            </button>
          ))}
        </div>

        {/* Badges Section */}
        {stats?.badges && stats.badges.some((b: any) => b.earned) && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>🏅 Insignias</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {stats.badges.filter((b: any) => b.earned).map((badge: any) => (
                <div key={badge.id} title={badge.description} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
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

        {/* Tip Card */}
        {totalDocs === 0 && projects.length > 0 && (
          <div className="card" style={{ marginTop: 20, padding: 16, borderLeft: '4px solid var(--accent-orange)' }}>
            <strong>💡 Consejo:</strong> Sube documentos a una asignatura para que Conniku genere guías, quizzes y flashcards automáticamente.
          </div>
        )}

        {/* Friend Activity */}
        {friendActivity.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>📢 Actividad de amigos</h3>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {friendActivity.map((act: any, i: number) => (
                <div key={i} onClick={() => act.userId && onNavigate(`/user/${act.userId}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < friendActivity.length - 1 ? '1px solid var(--border-color)' : 'none',
                    cursor: 'pointer',
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden',
                  }}>
                    {act.avatar ? <img src={act.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : (act.firstName?.[0] || '?')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{act.firstName} {act.lastName}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> {act.activityType || act.content || ''}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{act.createdAt ? timeAgo(act.createdAt) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>📖 Mis Asignaturas</h3>
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div style={{ fontSize: 48 }}>📚</div>
              <h3>{t('dash.noProjects')}</h3>
              <p>{t('dash.noProjectsHint')}</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </>
  )
}
