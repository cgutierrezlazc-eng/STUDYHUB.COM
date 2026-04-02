import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Conversation, ConversationMessage, UserBrief, ConversationFolder } from '../types'

interface Props {
  conversationId?: string
  onNavigate: (path: string) => void
}

export default function Messages({ conversationId, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [folders, setFolders] = useState<ConversationFolder[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(conversationId || null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserBrief[]>([])
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<UserBrief[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showContactMenu, setShowContactMenu] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
    loadFolders()
    api.getFriendSuggestions().then(data => setSuggestions(data.slice(0, 4))).catch(() => {})
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv)
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => loadMessages(activeConv), 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const data = await api.getConversations()
      setConversations(data)
    } catch (err: any) {
      console.error('Error loading conversations:', err)
    }
    setLoading(false)
  }

  const loadFolders = async () => {
    try { setFolders(await api.getFolders()) } catch {}
  }

  const loadMessages = async (convId: string) => {
    try { setMessages(await api.getMessages(convId)) } catch (err: any) {
      console.error('Error loading messages:', err)
    }
  }

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConv || sending) return
    setSending(true)
    try {
      await api.sendMessage(activeConv, { content: newMsg.trim() })
      setNewMsg('')
      await loadMessages(activeConv)
      await loadConversations()
    } catch (err: any) {
      alert(err.message || 'Error al enviar mensaje')
    }
    setSending(false)
  }

  const handleSendPhoto = async () => {
    if (!photoPreview || !activeConv) return
    setSending(true)
    try {
      await api.sendMessage(activeConv, {
        content: '📷 Foto',
        message_type: 'document',
        document_name: 'photo.jpg',
        document_path: photoPreview,
      })
      setPhotoPreview(null)
      await loadMessages(activeConv)
      await loadConversations()
    } catch {}
    setSending(false)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (recordTimerRef.current) clearInterval(recordTimerRef.current)
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = async () => {
          if (!activeConv) return
          try {
            await api.sendMessage(activeConv, {
              content: '🎤 Mensaje de voz',
              message_type: 'document',
              document_name: 'audio.webm',
              document_path: reader.result as string,
            })
            await loadMessages(activeConv)
            await loadConversations()
          } catch {}
        }
        reader.readAsDataURL(blob)
      }
      recorder.start(500)
      mediaRecorderRef.current = recorder
      setIsRecordingAudio(true)
      setRecordingTime(0)
      recordTimerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000)
    } catch {
      alert('No se pudo acceder al micrófono')
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    setIsRecordingAudio(false)
  }

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    audioChunksRef.current = []
    setIsRecordingAudio(false)
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    try { setSearchResults(await api.searchUsers(q)) } catch {}
  }

  const startDirectChat = async (targetUser: UserBrief) => {
    try {
      const conv = await api.createConversation({ type: 'direct', participant_ids: [targetUser.id] })
      setShowNewChat(false)
      setSearchQuery('')
      setSearchResults([])
      await loadConversations()
      setActiveConv(conv.id)
    } catch (err: any) {
      alert(err.message || 'Error al iniciar conversación')
    }
  }

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return
    try {
      const conv = await api.createConversation({ type: 'group_study', name: groupName, participant_ids: selectedUsers.map(u => u.id) })
      setShowNewGroup(false)
      setGroupName('')
      setSelectedUsers([])
      await loadConversations()
      setActiveConv(conv.id)
    } catch (err: any) {
      alert(err.message || 'Error al crear grupo')
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await api.createFolder(newFolderName)
      setNewFolderName('')
      setShowNewFolder(false)
      await loadFolders()
    } catch (err: any) {
      alert(err.message || 'Error al crear carpeta')
    }
  }

  const deleteMsg = async (msgId: string) => {
    if (!activeConv) return
    try { await api.deleteMessage(activeConv, msgId); await loadMessages(activeConv) } catch (err: any) {
      alert(err.message || 'Error al eliminar mensaje')
    }
  }

  const handleBlockUser = async () => {
    const otherUser = activeConversation?.participants.find(p => p.id !== user?.id)
    if (!otherUser) return
    if (confirm(`¿Bloquear a ${otherUser.firstName} ${otherUser.lastName}? No podrá enviarte mensajes ni ver tu perfil.`)) {
      try {
        await api.blockUser(otherUser.id)
        alert(`${otherUser.firstName} ha sido bloqueado.`)
        setShowContactMenu(false)
      } catch { alert('Error al bloquear usuario') }
    }
  }

  const handleReportUser = async () => {
    const otherUser = activeConversation?.participants.find(p => p.id !== user?.id)
    if (!otherUser) return
    const reason = prompt(`¿Por qué quieres denunciar a ${otherUser.firstName}?`)
    if (reason) {
      try {
        await api.reportUser(otherUser.id, reason)
        alert('Denuncia enviada. Nuestro equipo la revisará.')
        setShowContactMenu(false)
      } catch { alert('Error al enviar denuncia') }
    }
  }

  const activeConversation = conversations.find(c => c.id === activeConv)
  const otherParticipant = activeConversation?.participants.find(p => p.id !== user?.id)

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const formatRecTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <>
      <div className="page-header">
        <h2>{t('msg.title')}</h2>
        <p>{t('msg.subtitle')}</p>
      </div>
      <div className="page-body">
        <div className="msg-layout">
          {/* Left: Conversation list */}
          <div className="msg-sidebar">
            <div className="msg-sidebar-header">
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewChat(true)}>+ {t('msg.newChat')}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewGroup(true)}>{t('msg.newGroup')}</button>
            </div>

            {folders.length > 0 && (
              <div className="msg-folders">
                {folders.map(f => (
                  <div key={f.id} className="msg-folder-label">📁 {f.name}</div>
                ))}
              </div>
            )}
            <button className="msg-add-folder" onClick={() => setShowNewFolder(true)}>+ {t('msg.newFolder')}</button>

            <div className="msg-conv-list">
              {loading ? (
                <div className="msg-empty">{t('msg.loading')}</div>
              ) : conversations.length === 0 && !activeConv ? (
                <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <h3 style={{ margin: '0 0 8px' }}>{t('msg.noConversations')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Empieza una conversación con tus compañeros de estudio</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewChat(true)} style={{ marginBottom: 20 }}>Buscar contactos</button>
                  {suggestions.length > 0 && (
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Personas sugeridas</h4>
                      {suggestions.map(s => (
                        <div key={s.id} className="msg-user-result" onClick={() => startDirectChat(s)} style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                          <div className="msg-user-avatar">{s.avatar ? <img src={s.avatar} alt="" /> : s.firstName?.[0]}</div>
                          <div>
                            <div className="msg-user-name">{s.firstName} {s.lastName}</div>
                            <div className="msg-user-username">@{s.username} · {s.career || s.university || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : conversations.length === 0 ? (
                <div className="msg-empty"><p>{t('msg.noConversations')}</p></div>
              ) : (
                conversations.map(conv => {
                  const other = conv.participants.find(p => p.id !== user?.id)
                  return (
                    <div
                      key={conv.id}
                      className={`msg-conv-item ${activeConv === conv.id ? 'active' : ''}`}
                      onClick={() => setActiveConv(conv.id)}
                    >
                      <div className="msg-conv-avatar wa-avatar">
                        {conv.type === 'group_study' ? '👥' : (
                          other?.avatar ?
                            <img src={other.avatar} alt="" /> :
                            <span>{(other?.firstName?.[0] || conv.name?.[0] || '?').toUpperCase()}</span>
                        )}
                      </div>
                      <div className="msg-conv-info">
                        <div className="msg-conv-name">
                          {conv.name}
                          {conv.unreadCount > 0 && <span className="msg-badge">{conv.unreadCount}</span>}
                        </div>
                        <div className="msg-conv-preview">
                          {conv.lastMessage ? (
                            <>
                              <span className="msg-conv-sender">{conv.lastMessage.sender?.firstName}: </span>
                              {conv.lastMessage.content?.slice(0, 40)}
                            </>
                          ) : t('msg.noMessages')}
                        </div>
                      </div>
                      {conv.lastMessage && (
                        <div className="msg-conv-time">{formatTime(conv.lastMessage.createdAt)}</div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right: Chat pane */}
          <div className="msg-chat">
            {activeConversation ? (
              <>
                {/* WhatsApp-style header with avatar */}
                <div className="msg-chat-header wa-header">
                  <div className="wa-header-left" onClick={() => otherParticipant && onNavigate(`/user/${otherParticipant.id}`)}>
                    <div className="wa-header-avatar">
                      {activeConversation.type === 'group_study' ? '👥' : (
                        otherParticipant?.avatar ?
                          <img src={otherParticipant.avatar} alt="" /> :
                          <span>{(otherParticipant?.firstName?.[0] || '?').toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <strong>{activeConversation.name}</strong>
                      {activeConversation.type === 'group_study' ? (
                        <small>{activeConversation.participants.length} miembros</small>
                      ) : (
                        <small>@{otherParticipant?.username}</small>
                      )}
                    </div>
                  </div>
                  <div className="wa-header-actions">
                    <button className="wa-icon-btn" title="Llamada de voz" disabled>📞</button>
                    <button className="wa-icon-btn" title="Videollamada" disabled>📹</button>
                    <div style={{ position: 'relative' }}>
                      <button className="wa-icon-btn" onClick={() => setShowContactMenu(!showContactMenu)}>⋮</button>
                      {showContactMenu && (
                        <div className="wa-dropdown-menu">
                          {otherParticipant && (
                            <>
                              <button onClick={() => { onNavigate(`/user/${otherParticipant.id}`); setShowContactMenu(false) }}>
                                👤 Ver perfil
                              </button>
                              <button onClick={handleBlockUser}>
                                🚫 Bloquear contacto
                              </button>
                              <button onClick={handleReportUser} className="wa-danger">
                                ⚠️ Denunciar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="msg-messages wa-messages">
                  {messages.map(msg => {
                    const isMine = msg.sender?.id === user?.id
                    const isAudio = msg.documentName?.endsWith('.webm') || msg.content === '🎤 Mensaje de voz'
                    const isPhoto = msg.documentName?.match(/\.(jpg|jpeg|png|gif)$/i) || msg.content === '📷 Foto'
                    return (
                      <div
                        key={msg.id}
                        className={`msg-bubble wa-bubble ${isMine ? 'mine' : ''} ${msg.messageType === 'system' ? 'system' : ''}`}
                      >
                        {msg.messageType === 'system' ? (
                          <div className="msg-system">{msg.content}</div>
                        ) : (
                          <>
                            {!isMine && activeConversation.type === 'group_study' && (
                              <div className="msg-sender wa-sender">{msg.sender?.firstName}</div>
                            )}
                            <div className="msg-content">
                              {msg.isDeleted ? (
                                <em className="msg-deleted">{msg.content}</em>
                              ) : isPhoto && msg.documentPath ? (
                                <div className="wa-photo-msg">
                                  <img src={msg.documentPath} alt="" />
                                </div>
                              ) : isAudio && msg.documentPath ? (
                                <div className="wa-audio-msg">
                                  <span>🎤</span>
                                  <audio controls src={msg.documentPath} style={{ height: 32, maxWidth: 220 }} />
                                </div>
                              ) : (
                                <>
                                  {msg.content}
                                  {msg.messageType === 'document' && msg.documentName && (
                                    <div className="msg-document">📎 {msg.documentName}</div>
                                  )}
                                </>
                              )}
                            </div>
                            {!msg.isDeleted && msg.content && !isMine && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const btn = e.currentTarget
                                  if (btn.dataset.translated) {
                                    btn.textContent = '🌐'
                                    btn.title = 'Traducir'
                                    const original = btn.dataset.original || ''
                                    const contentEl = btn.parentElement?.querySelector('.msg-content') as HTMLElement
                                    if (contentEl) contentEl.textContent = original
                                    delete btn.dataset.translated
                                  } else {
                                    btn.textContent = '⏳'
                                    try {
                                      const result = await api.translateText(msg.content, user?.language || 'es')
                                      const contentEl = btn.parentElement?.querySelector('.msg-content') as HTMLElement
                                      if (contentEl) {
                                        btn.dataset.original = contentEl.textContent || ''
                                        contentEl.textContent = result.translated
                                      }
                                      btn.textContent = '↩️'
                                      btn.title = 'Ver original'
                                      btn.dataset.translated = 'true'
                                    } catch {
                                      btn.textContent = '🌐'
                                    }
                                  }
                                }}
                                title="Traducir"
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  fontSize: 11, padding: '2px 4px', opacity: 0.5,
                                  position: 'absolute', bottom: 2, right: 2,
                                }}
                              >🌐</button>
                            )}
                            <div className="msg-meta wa-meta">
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMine && <span className="wa-check">✓✓</span>}
                              {isMine && !msg.isDeleted && (
                                <button className="msg-delete-btn" onClick={() => deleteMsg(msg.id)}>🗑</button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Photo preview */}
                {photoPreview && (
                  <div className="wa-photo-preview">
                    <img src={photoPreview} alt="" />
                    <div className="wa-photo-preview-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setPhotoPreview(null)}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSendPhoto} disabled={sending}>Enviar Foto</button>
                    </div>
                  </div>
                )}

                {/* Input bar - WhatsApp style */}
                <div className="msg-input-bar wa-input-bar">
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />

                  {isRecordingAudio ? (
                    <div className="wa-recording-bar">
                      <button className="wa-icon-btn wa-cancel-rec" onClick={cancelAudioRecording}>✕</button>
                      <div className="recording-indicator" style={{ flex: 1 }}>
                        <span className="recording-dot" />
                        <span style={{ fontWeight: 600 }}>{formatRecTime(recordingTime)}</span>
                      </div>
                      <button className="wa-icon-btn wa-send-rec" onClick={stopAudioRecording}>✓</button>
                    </div>
                  ) : (
                    <>
                      <button className="wa-icon-btn" onClick={() => photoInputRef.current?.click()} title="Enviar foto">📷</button>
                      <button className="wa-icon-btn" title="Nota de video" onClick={() => alert('Videollamadas y notas de video próximamente')}>🎥</button>
                      <button className="wa-icon-btn" title="Adjuntar archivo" disabled>📎</button>
                      <input
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Escribe un mensaje..."
                        disabled={sending}
                        className="wa-text-input"
                      />
                      {newMsg.trim() ? (
                        <button className="wa-send-btn" onClick={handleSend} disabled={sending}>➤</button>
                      ) : (
                        <button className="wa-icon-btn wa-mic-btn" onClick={startAudioRecording} title="Mensaje de voz">🎤</button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="msg-no-chat">
                <div className="msg-no-chat-icon">💬</div>
                <h3>{t('msg.selectChat')}</h3>
                <p>{t('msg.selectChatHint')}</p>
                {suggestions.length > 0 && (
                  <div style={{ marginTop: 24, maxWidth: 320 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Contactos sugeridos:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {suggestions.map(s => (
                        <div key={s.id} onClick={() => startDirectChat(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                            {s.avatar ? <img src={s.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : s.firstName?.[0]}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.firstName} {s.lastName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.career || s.university || `@${s.username}`}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showNewChat && (
          <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{t('msg.newChat')}</h3>
              <div className="auth-field">
                <label>{t('msg.searchUsers')}</label>
                <input placeholder={t('msg.searchPlaceholder')} value={searchQuery} onChange={e => handleSearch(e.target.value)} autoFocus />
              </div>
              <div className="msg-search-results">
                {searchResults.map(u => (
                  <div key={u.id} className="msg-user-result" onClick={() => startDirectChat(u)}>
                    <div className="msg-user-avatar">{u.avatar ? <img src={u.avatar} alt="" /> : u.firstName?.[0]}</div>
                    <div>
                      <div className="msg-user-name">{u.firstName} {u.lastName}</div>
                      <div className="msg-user-username">@{u.username} #{String(u.userNumber).padStart(4, '0')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewChat(false)}>{t('newProject.cancel')}</button>
            </div>
          </div>
        )}

        {showNewGroup && (
          <div className="modal-overlay" onClick={() => setShowNewGroup(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{t('msg.newGroup')}</h3>
              <div className="auth-field">
                <label>{t('msg.groupName')}</label>
                <input placeholder={t('msg.groupNamePlaceholder')} value={groupName} onChange={e => setGroupName(e.target.value)} autoFocus />
              </div>
              <div className="auth-field">
                <label>{t('msg.addMembers')}</label>
                <input placeholder={t('msg.searchPlaceholder')} value={searchQuery} onChange={e => handleSearch(e.target.value)} />
              </div>
              {selectedUsers.length > 0 && (
                <div className="msg-selected-users">
                  {selectedUsers.map(u => (
                    <span key={u.id} className="msg-selected-tag">
                      {u.firstName} <button onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="msg-search-results">
                {searchResults.filter(u => !selectedUsers.find(s => s.id === u.id)).map(u => (
                  <div key={u.id} className="msg-user-result" onClick={() => setSelectedUsers(prev => [...prev, u])}>
                    <div className="msg-user-avatar">{u.firstName?.[0]}</div>
                    <div>
                      <div className="msg-user-name">{u.firstName} {u.lastName}</div>
                      <div className="msg-user-username">@{u.username}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewGroup(false)}>{t('newProject.cancel')}</button>
                <button className="btn btn-primary btn-sm" onClick={createGroup} disabled={!groupName.trim() || selectedUsers.length === 0}>{t('msg.createGroup')}</button>
              </div>
            </div>
          </div>
        )}

        {showNewFolder && (
          <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{t('msg.newFolder')}</h3>
              <div className="auth-field">
                <input placeholder={t('msg.folderNamePlaceholder')} value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewFolder(false)}>{t('newProject.cancel')}</button>
                <button className="btn btn-primary btn-sm" onClick={createFolder}>{t('msg.createFolder')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
