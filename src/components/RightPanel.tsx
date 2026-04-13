import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Flame, Globe, Users } from './Icons'
import AdSlot from './AdSlot'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

export default function RightPanel({ currentPath, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [stats, setStats] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])

  useEffect(() => {
    api.getGamificationStats().then(setStats).catch(() => {})
    api.getFriendSuggestions().then(data => setSuggestions((data || []).slice(0, 3))).catch(() => {})
    api.getCommunitySuggestions().then(data => setCommunities((data || []).slice(0, 3))).catch(() => {})
  }, [])

  // Don't show on messages, profile settings, admin, or feed (feed has its own sidebar)
  if (['/messages', '/profile', '/admin', '/feed'].some(p => currentPath.startsWith(p))) return null

  return (
    <aside className="right-panel">
      {/* Progress Widget */}
      {stats && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">{t('rightpanel.myProgress')}</h4>
          <div className="rp-progress-row">
            <span style={{ fontSize: 24 }}>{Flame({ size: 24 })}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.streakDays || 0} días</div>
              <div className="rp-label">{t('rightpanel.studyStreak')}</div>
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

      {/* Ad slot — sidebar top (invisible hasta ADS_ENABLED = true) */}
      <AdSlot placement="sidebar-top" />

      {/* Friend Suggestions — only on /communities */}
      {suggestions.length > 0 && currentPath.startsWith('/communities') && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">{t('rightpanel.suggestedPeople')}</h4>
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
          <button className="rp-see-more" onClick={() => onNavigate('/friends')}>{t('rightpanel.seeMore')}</button>
        </div>
      )}

      {/* Ad slot — sidebar mid (invisible hasta ADS_ENABLED = true) */}
      <AdSlot placement="sidebar-mid" />

      {/* Community Suggestions */}
      {communities.length > 0 && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">{t('rightpanel.popularCommunities')}</h4>
          {communities.map(c => (
            <div key={c.id} className="rp-person" onClick={() => onNavigate(`/communities/${c.id}`)}>
              <div className="rp-avatar" style={{ borderRadius: 8 }}>
                {c.avatar || Globe({ size: 24 })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-person-name">{c.name}</div>
                <div className="rp-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{Users({ size: 14 })} {c.memberCount} {t('rightpanel.members')}</div>
              </div>
            </div>
          ))}
          <button className="rp-see-more" onClick={() => onNavigate('/communities')}>{t('rightpanel.explore')}</button>
        </div>
      )}

      {/* Showcase Ejecutivo — solo perfil propio, rol owner o tier MAX */}
      {currentPath.startsWith('/my-profile') && (user?.role === 'owner' || (user as any)?.subscriptionTier === 'max') && (
        <div className="rp-widget" style={{ border: '1.5px solid rgba(245,158,11,0.35)', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(254,243,199,0.07) 100%)' }}>
          <h4 className="rp-widget-title" style={{ color: '#d97706' }}>★ Showcase Ejecutivo</h4>
          <p style={{ margin: '4px 0 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Tu perfil ejecutivo y portafolio profesional.
          </p>
          <button
            onClick={() => onNavigate('/my-profile')}
            style={{ width: '100%', padding: '7px 0', background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Ver Showcase →
          </button>
        </div>
      )}

      {/* Noticias de Educación — páginas de perfil */}
      {(currentPath.startsWith('/my-profile') || currentPath.startsWith('/user/')) && (
        <div className="rp-widget">
          <h4 className="rp-widget-title">📰 Noticias de Educación</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { title: 'Admisión DEMRE 2025', source: 'DEMRE', color: '#2D62C8' },
              { title: 'Becas JUNAEB 2025', source: 'JUNAEB', color: '#059669' },
              { title: 'Calidad Educación Superior', source: 'CNA Chile', color: '#7c3aed' },
              { title: 'Noticias MINEDUC', source: 'MINEDUC', color: '#d97706' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: item.color, fontWeight: 600, marginTop: 2 }}>{item.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
