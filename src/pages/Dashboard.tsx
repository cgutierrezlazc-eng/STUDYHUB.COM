import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project } from '../types'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

function getGreetingTime(): string {
  const h = new Date().getHours()
  if (h < 12) return '🌅'
  if (h < 18) return '☀️'
  return '🌙'
}

export default function Dashboard({ projects, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const totalDocs = projects.reduce((acc, p) => acc + p.documents.length, 0)

  const [friendActivity, setFriendActivity] = useState<any[]>([])

  useEffect(() => {
    api.getActivityFeed().then(data => setFriendActivity(data.slice(0, 5))).catch(() => {})
  }, [])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    return `hace ${days}d`
  }

  const welcomeKey = `welcome.${user?.gender || 'unspecified'}`
  const welcomeText = t(welcomeKey)

  return (
    <>
      <div className="page-header">
        <div className="welcome-banner">
          <div className="welcome-text">
            <span className="welcome-emoji">{getGreetingTime()}</span>
            <div>
              <h2>{welcomeText}, {user?.firstName}!</h2>
              <p>{t('welcome.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{projects.length}</div>
            <div className="stat-label">{t('dash.subjects')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{totalDocs}</div>
            <div className="stat-label">{t('dash.documents')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>0</div>
            <div className="stat-label">{t('dash.guides')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>0h</div>
            <div className="stat-label">{t('dash.studyTime')}</div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="quick-shortcuts">
          <div className="shortcut-card" onClick={() => onNavigate('/messages')}>
            <div className="shortcut-icon">💬</div>
            <div className="shortcut-label">Mensajes</div>
          </div>
          <div className="shortcut-card" onClick={() => onNavigate('/friends')}>
            <div className="shortcut-icon">👥</div>
            <div className="shortcut-label">Comunidad</div>
          </div>
          <div className="shortcut-card" onClick={() => projects.length > 0 ? onNavigate(`/project/${projects[0].id}`) : null}>
            <div className="shortcut-icon">🎥</div>
            <div className="shortcut-label">Clases en Vivo</div>
          </div>
          <div className="shortcut-card" onClick={() => onNavigate('/profile')}>
            <div className="shortcut-icon">👤</div>
            <div className="shortcut-label">Mi Perfil</div>
          </div>
        </div>

        {totalDocs === 0 && projects.length > 0 && (
          <div className="card tip-card" style={{ marginBottom: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              <strong>Tip:</strong> Sube documentos a tu asignatura para generar guías de estudio, quizzes y flashcards automáticamente
            </span>
          </div>
        )}

        {friendActivity.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Actividad de Amigos</h3>
            {friendActivity.map(item => (
              <div key={item.id} className="card" style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => item.author && onNavigate(`/user/${item.author.id}`)}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                  {item.author?.avatar ? <img src={item.author.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : (item.author?.firstName?.[0] || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14 }}>
                    <strong>{item.author?.firstName} {item.author?.lastName}</strong>{' '}
                    {item.type === 'post' ? 'publicó en su muro' : item.content}
                  </span>
                  <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(item.createdAt)}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>{t('dash.empty')}</h3>
            <p>{t('dash.emptyHint')}</p>
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: 16 }}>{t('nav.mySubjects')}</h3>
            <div className="card-grid">
              {projects.map(project => (
                <div key={project.id} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${project.color}` }} onClick={() => onNavigate(`/project/${project.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: project.color + '22', color: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                      {project.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{project.name}</div>
                      {project.description && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{project.description}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {project.documents.length} {t('dash.documents').toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* App Download Badges */}
        <div style={{ marginTop: 32, textAlign: 'center', padding: '24px 0', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Descarga la app móvil</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#000', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
              <span style={{ fontSize: 22 }}>▶</span>
              <div style={{ textAlign: 'left' }}><small style={{ fontSize: 10, opacity: 0.8 }}>Disponible en</small><div style={{ fontWeight: 600 }}>Google Play</div></div>
            </a>
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#000', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
              <span style={{ fontSize: 22 }}></span>
              <div style={{ textAlign: 'left' }}><small style={{ fontSize: 10, opacity: 0.8 }}>Descárgalo en</small><div style={{ fontWeight: 600 }}>App Store</div></div>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
