import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

export default function RightPanel({ currentPath, onNavigate }: Props) {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])

  useEffect(() => {
    api.getGamificationStats().then(setStats).catch(() => {})
    api.getFriendSuggestions().then(data => setSuggestions((data || []).slice(0, 3))).catch(() => {})
    api.getCommunitySuggestions().then(data => setCommunities((data || []).slice(0, 3))).catch(() => {})
  }, [])

  // Don't show on messages, profile settings, admin
  if (['/messages', '/profile', '/admin'].some(p => currentPath.startsWith(p))) return null

  return (
    <aside className="right-panel">
      {/* Progress Widget */}
      {stats && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">Tu Progreso</h4>
          <div className="rp-progress-row">
            <span style={{ fontSize: 24 }}>🔥</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.streakDays || 0} días</div>
              <div className="rp-label">Racha de estudio</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="rp-label">Nivel {stats.level}</span>
              <span className="rp-label">{stats.xp % 100}/100 XP</span>
            </div>
            <div className="rp-xp-bar">
              <div className="rp-xp-fill" style={{ width: `${stats.xp % 100}%` }} />
            </div>
          </div>
          {stats.badges?.filter((b: any) => b.earned).length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              {stats.badges.filter((b: any) => b.earned).slice(0, 6).map((b: any) => (
                <span key={b.id} title={b.name} style={{ fontSize: 16 }}>{b.emoji}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Suggestions */}
      {suggestions.length > 0 && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">Personas sugeridas</h4>
          {suggestions.map(s => (
            <div key={s.id} className="rp-person" onClick={() => onNavigate(`/user/${s.id}`)}>
              <div className="rp-avatar">
                {s.avatar ? <img src={s.avatar} alt="" /> : s.firstName?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-person-name">{s.firstName} {s.lastName}</div>
                <div className="rp-label">{s.career || s.university || `@${s.username}`}</div>
              </div>
            </div>
          ))}
          <button className="rp-see-more" onClick={() => onNavigate('/friends')}>Ver más</button>
        </div>
      )}

      {/* Community Suggestions */}
      {communities.length > 0 && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">Comunidades populares</h4>
          {communities.map(c => (
            <div key={c.id} className="rp-person" onClick={() => onNavigate(`/communities/${c.id}`)}>
              <div className="rp-avatar" style={{ borderRadius: 8 }}>
                {c.avatar || '🏘️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-person-name">{c.name}</div>
                <div className="rp-label">👥 {c.memberCount} miembros</div>
              </div>
            </div>
          ))}
          <button className="rp-see-more" onClick={() => onNavigate('/communities')}>Explorar</button>
        </div>
      )}
    </aside>
  )
}
