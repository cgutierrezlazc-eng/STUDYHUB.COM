import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Users, Hourglass, Inbox } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

export default function Friends({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState<'friends' | 'requests' | 'sent' | 'search'>('friends')
  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])

  useEffect(() => { loadFriends(); loadRequests(); loadSentRequests(); loadSuggestions() }, [])

  const loadFriends = async () => {
    try { setFriends(await api.getFriends()) } catch (err: any) { console.error('Failed to load friends:', err) }
  }
  const loadRequests = async () => {
    try { setRequests(await api.getFriendRequests()) } catch (err: any) { console.error('Failed to load requests:', err) }
  }
  const loadSentRequests = async () => {
    try { setSentRequests(await api.getSentFriendRequests()) } catch (err: any) { console.error('Failed to load sent requests:', err) }
  }
  const loadSuggestions = async () => {
    try { setSuggestions(await api.getFriendSuggestions()) } catch (err: any) { console.error('Failed to load suggestions:', err) }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try { setSearchResults(await api.searchUsers(searchQuery)) } catch (err: any) { console.error('Search failed:', err) }
  }

  const handleSendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId)
      loadSentRequests()
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, requestSent: true } : u))
    } catch (err: any) {
      alert(err.message || 'Error al enviar solicitud')
    }
  }

  const handleAccept = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId)
      loadFriends()
      loadRequests()
    } catch (err: any) {
      alert(err.message || 'Error al aceptar solicitud')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId)
      loadRequests()
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud')
    }
  }

  const handleUnfriend = async (userId: string) => {
    try {
      await api.unfriend(userId)
      loadFriends()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar amigo')
    }
  }

  const sentIds = sentRequests.map(r => r.user.id)

  return (
    <>
      <div className="page-header page-enter">
        <h2>{t('friends.title')}</h2>
        <p>{t('friends.subtitle')}</p>
      </div>
      <div className="page-body">
        <div className="friends-tabs">
          <button className={`friends-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
            {t('friends.tabFriends')} {friends.length > 0 && <span className="badge">{friends.length}</span>}
          </button>
          <button className={`friends-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            {t('friends.tabRequests')} {requests.length > 0 && <span className="badge badge-red">{requests.length}</span>}
          </button>
          <button className={`friends-tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
            {t('friends.tabSent')} {sentRequests.length > 0 && <span className="badge">{sentRequests.length}</span>}
          </button>
          <button className={`friends-tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
            {t('friends.tabSearch')}
          </button>
        </div>

        {tab === 'friends' && suggestions.length > 0 && (
          <div className="suggestions-section">
            <h3>{t('friends.suggestionsTitle')}</h3>
            <p>{t('friends.suggestionsSubtitle')}</p>
            <div className="suggestions-grid">
              {suggestions.slice(0, 8).map(s => (
                <div key={s.id} className="suggestion-card" onClick={() => onNavigate(`/user/${s.id}`)}>
                  <div className="suggestion-avatar">
                    {s.avatar ? <img src={s.avatar} alt="" /> : <span>{(s.firstName?.[0] || '').toUpperCase()}</span>}
                  </div>
                  <h4>{s.firstName} {s.lastName}</h4>
                  <div className="suggestion-username">@{s.username}</div>
                  {s.reasons?.[0] && <div className="suggestion-reason">{s.reasons[0]}</div>}
                  {s.career && <div className="suggestion-meta">{s.career}</div>}
                  <div className="suggestion-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-primary btn-xs" onClick={() => { handleSendRequest(s.id); setSuggestions(prev => prev.filter(x => x.id !== s.id)) }}>
                      {t('friends.add')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div className="friends-grid">
            {friends.length === 0 ? (
              suggestions.length === 0 ? (
                <div className="friends-empty" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ marginBottom: 16, opacity: 0.6 }}>{Users({ size: 56, color: 'var(--accent)' })}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Conecta con tus companeros</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                    Agrega amigos para estudiar juntos, compartir apuntes y competir en las ligas semanales
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
                    Busca por nombre, usuario o universidad
                  </p>
                  <div className="friends-search-bar" style={{ marginTop: 0, marginBottom: 12, maxWidth: 400, margin: '0 auto' }}>
                    <input
                      placeholder={t('friends.searchPlaceholder')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setTab('search') } }}
                    />
                    <button className="btn btn-primary" onClick={() => { handleSearch(); setTab('search') }}>Buscar</button>
                  </div>
                </div>
              ) : (
                <div className="friends-empty" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ marginBottom: 16, opacity: 0.6 }}>{Users({ size: 56, color: 'var(--accent)' })}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aun no tienes amigos</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                    Revisa las sugerencias de arriba o busca companeros de tu carrera para empezar
                  </p>
                  <button className="btn btn-primary" onClick={() => setTab('search')}>Buscar companeros</button>
                </div>
              )
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="friend-card card" onClick={() => onNavigate(`/user/${friend.id}`)}>
                  <div className="friend-avatar">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="" />
                    ) : (
                      <div className="friend-initials">{(friend.firstName?.[0] || '') + (friend.lastName?.[0] || '')}</div>
                    )}
                  </div>
                  <div className="friend-info">
                    <h4>{friend.firstName} {friend.lastName}</h4>
                    <span className="friend-username">@{friend.username}</span>
                    <p className="friend-meta">{friend.career}</p>
                    <p className="friend-meta">{friend.university}</p>
                  </div>
                  <div className="friend-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-xs" onClick={() => onNavigate(`/user/${friend.id}`)}>{t('friends.viewProfile')}</button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleUnfriend(friend.id)}>{t('friends.remove')}</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="friends-grid">
            {requests.length === 0 ? (
              <div className="friends-empty" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ marginBottom: 16, opacity: 0.6 }}>{Inbox({ size: 56, color: 'var(--accent)' })}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sin solicitudes pendientes</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Cuando alguien te envie una solicitud de amistad, aparecera aqui
                </p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="friend-card card">
                  <div className="friend-avatar">
                    {req.user.avatar ? (
                      <img src={req.user.avatar} alt="" />
                    ) : (
                      <div className="friend-initials">{(req.user.firstName?.[0] || '') + (req.user.lastName?.[0] || '')}</div>
                    )}
                  </div>
                  <div className="friend-info">
                    <h4>{req.user.firstName} {req.user.lastName}</h4>
                    <span className="friend-username">@{req.user.username}</span>
                    <p className="friend-meta">{req.user.career}</p>
                    <p className="friend-meta">{req.user.university}</p>
                  </div>
                  <div className="friend-actions">
                    <button className="btn btn-primary btn-xs" onClick={() => handleAccept(req.id)}>{t('friends.accept')}</button>
                    <button className="btn btn-secondary btn-xs" onClick={() => handleReject(req.id)}>{t('friends.reject')}</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'sent' && (
          <div className="friends-grid">
            {sentRequests.length === 0 ? (
              <div className="friends-empty" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ marginBottom: 16, opacity: 0.6 }}>{Inbox({ size: 56, color: 'var(--accent)' })}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No has enviado solicitudes</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Busca companeros de tu universidad y enviales una solicitud para estudiar juntos
                </p>
                <button className="btn btn-primary" onClick={() => setTab('search')}>Buscar companeros</button>
              </div>
            ) : (
              sentRequests.map(req => (
                <div key={req.id} className="friend-card card" onClick={() => onNavigate(`/user/${req.user.id}`)}>
                  <div className="friend-avatar">
                    {req.user.avatar ? (
                      <img src={req.user.avatar} alt="" />
                    ) : (
                      <div className="friend-initials">{(req.user.firstName?.[0] || '') + (req.user.lastName?.[0] || '')}</div>
                    )}
                  </div>
                  <div className="friend-info">
                    <h4>{req.user.firstName} {req.user.lastName}</h4>
                    <span className="friend-username">@{req.user.username}</span>
                    <p className="friend-meta">{req.user.career}</p>
                    <p className="friend-meta">{req.user.university}</p>
                  </div>
                  <div className="friend-actions" onClick={e => e.stopPropagation()}>
                    <span className="badge" style={{ background: 'var(--accent-blue)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12 }}>
                      {Hourglass({ size: 14 })} {t('friends.invitationSent')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'search' && (
          <>
            <div className="friends-search-bar">
              <input
                placeholder={t('friends.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-primary" onClick={handleSearch}>Buscar</button>
            </div>
            <div className="friends-grid">
              {searchResults.map(u => {
                const isFriend = friends.some(f => f.id === u.id)
                const requestSent = sentIds.includes(u.id)
                return (
                  <div key={u.id} className="friend-card card" onClick={() => onNavigate(`/user/${u.id}`)}>
                    <div className="friend-avatar">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" />
                      ) : (
                        <div className="friend-initials">{(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}</div>
                      )}
                    </div>
                    <div className="friend-info">
                      <h4>{u.firstName} {u.lastName}</h4>
                      <span className="friend-username">@{u.username}</span>
                      <p className="friend-meta">{u.career}</p>
                      <p className="friend-meta">{u.university}</p>
                    </div>
                    <div className="friend-actions" onClick={e => e.stopPropagation()}>
                      {isFriend ? (
                        <span className="badge badge-green">{t('friends.friends')}</span>
                      ) : requestSent ? (
                        <span className="badge">{t('friends.requestSent')}</span>
                      ) : (
                        <button className="btn btn-primary btn-xs" onClick={() => handleSendRequest(u.id)}>{t('friends.add')}</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
