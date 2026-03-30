import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

export default function Friends({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])

  useEffect(() => { loadFriends(); loadRequests(); loadSentRequests(); loadSuggestions() }, [])

  const loadFriends = async () => {
    try { setFriends(await api.getFriends()) } catch {}
  }
  const loadRequests = async () => {
    try { setRequests(await api.getFriendRequests()) } catch {}
  }
  const loadSentRequests = async () => {
    try { setSentRequests(await api.getSentFriendRequests()) } catch {}
  }
  const loadSuggestions = async () => {
    try { setSuggestions(await api.getFriendSuggestions()) } catch {}
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try { setSearchResults(await api.searchUsers(searchQuery)) } catch {}
  }

  const handleSendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId)
      loadSentRequests()
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, requestSent: true } : u))
    } catch {}
  }

  const handleAccept = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId)
      loadFriends()
      loadRequests()
    } catch {}
  }

  const handleReject = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId)
      loadRequests()
    } catch {}
  }

  const handleUnfriend = async (userId: string) => {
    try {
      await api.unfriend(userId)
      loadFriends()
    } catch {}
  }

  const sentIds = sentRequests.map(r => r.user.id)

  return (
    <>
      <div className="page-header">
        <h2>Comunidad</h2>
        <p>Conecta con otros estudiantes, comparte y aprende juntos</p>
      </div>
      <div className="page-body">
        <div className="friends-tabs">
          <button className={`friends-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
            Amigos {friends.length > 0 && <span className="badge">{friends.length}</span>}
          </button>
          <button className={`friends-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            Solicitudes {requests.length > 0 && <span className="badge badge-red">{requests.length}</span>}
          </button>
          <button className={`friends-tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
            Buscar Estudiantes
          </button>
        </div>

        {tab === 'friends' && suggestions.length > 0 && (
          <div className="suggestions-section">
            <h3>Personas que quizás conozcas</h3>
            <p>Basado en tu universidad, carrera y contactos en común</p>
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
                      Agregar
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
                <div className="friends-empty">
                  <div style={{ fontSize: 48 }}>👥</div>
                  <h3>Aún no tienes conexiones</h3>
                  <p>Busca estudiantes de tu universidad y envíales una solicitud</p>
                  <div className="friends-search-bar" style={{ marginTop: 16, marginBottom: 12 }}>
                    <input
                      placeholder="Buscar por nombre, usuario o email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setTab('search') } }}
                    />
                    <button className="btn btn-primary" onClick={() => { handleSearch(); setTab('search') }}>Buscar</button>
                  </div>
                </div>
              ) : (
                <div className="friends-empty">
                  <div style={{ fontSize: 48 }}>👥</div>
                  <h3>Aún no tienes conexiones</h3>
                  <p>Agrega compañeros de las sugerencias de arriba o busca estudiantes</p>
                  <button className="btn btn-primary" onClick={() => setTab('search')}>Buscar Estudiantes</button>
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
                    <button className="btn btn-secondary btn-xs" onClick={() => onNavigate(`/user/${friend.id}`)}>Ver Perfil</button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleUnfriend(friend.id)}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="friends-grid">
            {requests.length === 0 ? (
              <div className="friends-empty">
                <div style={{ fontSize: 48 }}>📬</div>
                <h3>No tienes solicitudes pendientes</h3>
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
                    <button className="btn btn-primary btn-xs" onClick={() => handleAccept(req.id)}>Aceptar</button>
                    <button className="btn btn-secondary btn-xs" onClick={() => handleReject(req.id)}>Rechazar</button>
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
                placeholder="Buscar por nombre, usuario o email..."
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
                        <span className="badge badge-green">Amigos</span>
                      ) : requestSent ? (
                        <span className="badge">Solicitud enviada</span>
                      ) : (
                        <button className="btn btn-primary btn-xs" onClick={() => handleSendRequest(u.id)}>Agregar</button>
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
