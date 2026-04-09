import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { useOnlineCount } from '../services/useOnlineCount'
import NotificationBell from './NotificationBell'

interface Props {
  onNavigate: (path: string) => void
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export default function TopBar({ onNavigate, onMenuToggle, showMenuButton }: Props) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const online = useOnlineCount()

  const QUICK_CATEGORIES = [
    { label: t('topbar.people'), path: '/friends', icon: '👤' },
    { label: t('topbar.communities'), path: '/communities', icon: '🏘' },
    { label: t('topbar.jobs'), path: '/jobs', icon: '💼' },
    { label: t('topbar.subjects'), path: '/subjects', icon: '📚' },
  ]
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [sugLoading, setSugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!showUserMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true)
      try {
        const data = await api.searchSocialUsers(q)
        setSuggestions((data.users || data || []).slice(0, 5))
      } catch { setSuggestions([]) }
      setSugLoading(false)
    }, 300)
  }, [])

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '?'

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showMenuButton && (
          <button className="topbar-hamburger" onClick={onMenuToggle} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {/* Official Conniku Logo */}
        <div onClick={() => onNavigate('/')} className="topbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2D62C8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 40 40" width={18} height={18}>
              <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Outfit', -apple-system, sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            conni<span style={{ color: '#2D62C8' }}>ku</span>
          </span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-search" ref={searchRef} style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={t('topbar.searchPlaceholder')}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); fetchSuggestions(e.target.value) }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`)
                setSearchQuery(''); setShowSuggestions(false)
              }
              if (e.key === 'Escape') setShowSuggestions(false)
            }}
          />
          {showSuggestions && (
            <div className="search-suggestions">
              {!searchQuery.trim() && (
                <>
                  <div className="search-sug-label">{t('topbar.quickAccess')}</div>
                  {QUICK_CATEGORIES.map(c => (
                    <button key={c.path} className="search-sug-item" onClick={() => { onNavigate(c.path); setShowSuggestions(false) }}>
                      <span style={{ fontSize: 16 }}>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </>
              )}
              {searchQuery.trim().length >= 2 && (
                <>
                  {sugLoading && <div className="search-sug-label" style={{ textAlign: 'center', padding: 12 }}>{t('topbar.searching')}</div>}
                  {!sugLoading && suggestions.length > 0 && (
                    <>
                      <div className="search-sug-label">{t('topbar.people')}</div>
                      {suggestions.map((u: any) => (
                        <button key={u.id} className="search-sug-item" onClick={() => { onNavigate(`/user/${u.id}`); setSearchQuery(''); setShowSuggestions(false) }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: u.avatar ? `url(${u.avatar}) center/cover` : 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 11, fontWeight: 700,
                          }}>
                            {!u.avatar && ((u.firstName || u.first_name || '?')[0])}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.firstName || u.first_name} {u.lastName || u.last_name}
                            </div>
                            {(u.career || u.university) && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.career}{u.career && u.university ? ' · ' : ''}{u.university}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  <button className="search-sug-item" style={{ color: 'var(--accent)', fontWeight: 600 }}
                    onClick={() => { onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`); setSearchQuery(''); setShowSuggestions(false) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span>{t('topbar.searchWeb')} "{searchQuery}"</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {online.total > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 16,
            background: 'rgba(34,197,94,0.1)', fontSize: 11, fontWeight: 600,
            color: '#22c55e', whiteSpace: 'nowrap',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'conniku-pulse 2s infinite' }} />
            {online.total} en linea
          </div>
        )}
        <NotificationBell onNavigate={onNavigate} />

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button className="topbar-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <strong>{user?.firstName} {user?.lastName}</strong>
                <span>@{user?.username}</span>
              </div>
              <button onClick={() => { onNavigate(user ? `/user/${user.id}` : '/'); setShowUserMenu(false) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {t('topbar.myProfile')}
              </button>
              <button onClick={() => { onNavigate('/profile'); setShowUserMenu(false) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                {t('topbar.settings')}
              </button>
              <button onClick={() => { onNavigate('/subscription'); setShowUserMenu(false) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                {t('topbar.plan')}
              </button>
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <button onClick={logout} style={{ color: 'var(--accent-red)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                {t('topbar.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
