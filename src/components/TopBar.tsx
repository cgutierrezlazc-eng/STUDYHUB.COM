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

  // ── Gear settings panel ────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false)
  const [pwShowChange, setPwShowChange] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const QUICK_CATEGORIES = [
    { label: t('topbar.people'), path: '/friends', icon: '👤' },
    { label: t('topbar.communities'), path: '/communities', icon: '🏘' },
    { label: t('topbar.jobs'), path: '/jobs', icon: '💼' },
    { label: t('topbar.subjects'), path: '/courses', icon: '📚' },
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

        {/* ── Gear settings icon ── */}
        <button
          onClick={() => setShowSettings(true)}
          title="Configuración"
          style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

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
      {/* ── Settings drawer (gear icon) ── */}
      {showSettings && (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setShowSettings(false); setPwShowChange(false); setPwError(''); setPwSuccess(false); setShowDeleteConfirm(false) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, width: 340, height: '100vh',
            background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
            zIndex: 1201, display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Configuración</span>
              </div>
              <button
                onClick={() => { setShowSettings(false); setPwShowChange(false); setPwError(''); setPwSuccess(false); setShowDeleteConfirm(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

              {/* ── Cambio de Contraseña ── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Seguridad</span>
                </div>

                {user?.provider === 'email' ? (
                  !pwShowChange ? (
                    <div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                        Cambia tu contraseña de acceso a Conniku.
                      </p>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPwShowChange(true)}
                      >
                        Cambiar contraseña
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Contraseña actual</label>
                        <input className="form-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nueva contraseña</label>
                        <input className="form-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Confirmar nueva contraseña</label>
                        <input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      {pwError && <p style={{ color: 'var(--accent-red, #dc2626)', fontSize: 13, margin: 0 }}>{pwError}</p>}
                      {pwSuccess && <p style={{ color: 'var(--accent-green, #16a34a)', fontSize: 13, margin: 0 }}>¡Contraseña actualizada correctamente!</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            setPwError(''); setPwSuccess(false)
                            if (newPw.length < 6) { setPwError('La contraseña debe tener al menos 6 caracteres'); return }
                            if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden'); return }
                            try {
                              await api.changePassword(currentPw, newPw)
                              setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('')
                              setTimeout(() => { setPwShowChange(false); setPwSuccess(false) }, 2000)
                            } catch (e: any) { setPwError(e.message || 'Error al cambiar contraseña') }
                          }}
                        >Guardar</button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setPwShowChange(false); setPwError(''); setCurrentPw(''); setNewPw(''); setConfirmPw('') }}
                        >Cancelar</button>
                      </div>
                    </div>
                  )
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Iniciaste sesión con Google. Para cambiar tu contraseña, hazlo desde tu cuenta de Google.
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 24 }} />

              {/* ── Zona de peligro ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red, #dc2626)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-red, #dc2626)' }}>Zona de Peligro</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  Eliminar tu cuenta es una acción permanente e irreversible. Se borrarán todos tus datos.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Eliminar mi cuenta
                  </button>
                ) : (
                  <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red, #dc2626)', marginBottom: 10 }}>
                      ¿Estás seguro? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          api.deleteAccount().then(() => logout()).catch(() => {})
                        }}
                      >Sí, eliminar cuenta</button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer — Cerrar sesión */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button
                onClick={() => { setShowSettings(false); logout() }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', cursor: 'pointer', color: 'var(--accent-red, #dc2626)', fontWeight: 600, fontSize: 14 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}

    </header>
  )
}
