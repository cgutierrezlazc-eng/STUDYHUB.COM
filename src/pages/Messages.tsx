import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Conversation, ConversationMessage, UserBrief, ConversationFolder } from '../types'

interface Props {
  conversationId?: string
  onNavigate: (path: string) => void
}

type SidebarTab = 'chats' | 'friends' | 'groups' | 'requests'

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
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chats')
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
  const [friends, setFriends] = useState<any[]>([])
  const [friendsFilter, setFriendsFilter] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
    loadFolders()
    loadFriends()
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
    try { setFolders(await api.getFolders()) } catch (err: any) { console.error('Failed to load folders:', err) }
  }

  const loadFriends = async () => {
    try { setFriends(await api.getFriends()) } catch (err: any) { console.error('Failed to load friends:', err) }
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
    } catch (err: any) { console.error('Failed to send photo:', err) }
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
          } catch (err: any) { console.error('Failed to send voice message:', err) }
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
    try { setSearchResults(await api.searchUsers(q)) } catch (err: any) { console.error('Search failed:', err) }
  }

  const startDirectChat = async (targetUser: any) => {
    try {
      const conv = await api.createConversation({ type: 'direct', participant_ids: [targetUser.id] })
      setShowNewChat(false)
      setSearchQuery('')
      setSearchResults([])
      setSidebarTab('chats')
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
      setSidebarTab('chats')
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

  const acceptMessageRequest = async (convId: string) => {
    try {
      await api.acceptMessageRequest(convId)
      await loadConversations()
    } catch (err: any) {
      alert(err.message || 'Error al aceptar solicitud')
    }
  }

  const rejectMessageRequest = async (convId: string) => {
    try {
      await api.rejectMessageRequest(convId)
      await loadConversations()
      if (activeConv === convId) setActiveConv(null)
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud')
    }
  }

  const activeConversation = conversations.find(c => c.id === activeConv)
  const otherParticipant = activeConversation?.participants.find(p => p.id !== user?.id)

  // Split conversations
  const directChats = conversations.filter(c => c.type === 'direct')
  const groupChats = conversations.filter(c => c.type === 'group_study')
  const messageRequests = conversations.filter(c => c.type === 'message_request' && c.participants.some(p => p.id !== user?.id))
  // Incoming requests: ones where I'm NOT the creator
  const incomingRequests = messageRequests.filter(c => {
    // The creator is the person who sent the request - show to the other person
    const isCreator = c.participants.find(p => p.role === 'admin')
    return isCreator && isCreator.id !== user?.id
  })
  // Sent requests: ones I created
  const sentRequests = messageRequests.filter(c => {
    const isCreator = c.participants.find(p => p.role === 'admin')
    return isCreator && isCreator.id === user?.id
  })
  const activeChats = conversations.filter(c => c.type === 'direct' || c.type === 'group_study')

  // Filter friends who already have a conversation
  const friendsWithChatStatus = friends.map(f => {
    const existingConv = directChats.find(c => c.participants.some(p => p.id === f.id))
    return { ...f, conversationId: existingConv?.id || null }
  })

  const filteredFriends = friendsFilter
    ? friendsWithChatStatus.filter(f =>
        `${f.firstName} ${f.lastName} ${f.username}`.toLowerCase().includes(friendsFilter.toLowerCase())
      )
    : friendsWithChatStatus

  // Online indicator (placeholder — shows recently active)
  const isOnline = (_userId: string) => Math.random() > 0.5

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const formatRecTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return (
    <>
      <div className="page-header">
        <h2>{t('msg.title')}</h2>
        <p>{t('msg.subtitle')}</p>
      </div>
      <div className="page-body">
        <div className="msg-layout">
          {/* Left: Sidebar with tabs */}
          <div className="msg-sidebar">
            {/* Tab bar */}
            <div className="msg-tab-bar">
              <button
                className={`msg-tab ${sidebarTab === 'chats' ? 'active' : ''}`}
                onClick={() => setSidebarTab('chats')}
              >
                💬 Chats
                {totalUnread > 0 && <span className="msg-tab-badge">{totalUnread}</span>}
              </button>
              <button
                className={`msg-tab ${sidebarTab === 'friends' ? 'active' : ''}`}
                onClick={() => setSidebarTab('friends')}
              >
                👥 Amigos
              </button>
              <button
                className={`msg-tab ${sidebarTab === 'groups' ? 'active' : ''}`}
                onClick={() => setSidebarTab('groups')}
              >
                📚 Grupos
              </button>
              <button
                className={`msg-tab ${sidebarTab === 'requests' ? 'active' : ''}`}
                onClick={() => setSidebarTab('requests')}
              >
                📩 Solicitudes
                {incomingRequests.length > 0 && <span className="msg-tab-badge">{incomingRequests.length}</span>}
              </button>
            </div>

            {/* ─── TAB: CHATS ─── */}
            {sidebarTab === 'chats' && (
              <>
                <div className="msg-sidebar-header">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewChat(true)}>+ Nuevo Chat</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowNewGroup(true)}>+ Grupo</button>
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
                  ) : conversations.length === 0 ? (
                    <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                      <h3 style={{ margin: '0 0 8px' }}>{t('msg.noConversations')}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Empieza una conversación con tus compañeros</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setSidebarTab('friends')}>Ver amigos</button>
                    </div>
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
                              {conv.type === 'group_study' && <span style={{ marginRight: 4, fontSize: 12 }}>📚</span>}
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
              </>
            )}

            {/* ─── TAB: FRIENDS ─── */}
            {sidebarTab === 'friends' && (
              <>
                <div className="msg-sidebar-header" style={{ padding: '8px 12px' }}>
                  <input
                    className="msg-friends-search"
                    placeholder="🔍 Buscar amigo..."
                    value={friendsFilter}
                    onChange={e => setFriendsFilter(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 20,
                      border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                      fontSize: 13, outline: 'none',
                    }}
                  />
                </div>

                <div className="msg-conv-list">
                  {friends.length === 0 ? (
                    <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                      <h3 style={{ margin: '0 0 8px' }}>Sin amigos aún</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Agrega amigos desde la Comunidad para chatear</p>
                      <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/friends')}>Ir a Comunidad</button>
                    </div>
                  ) : (
                    filteredFriends.map(friend => (
                      <div
                        key={friend.id}
                        className={`msg-conv-item msg-friend-item ${friend.conversationId && activeConv === friend.conversationId ? 'active' : ''}`}
                        onClick={() => {
                          if (friend.conversationId) {
                            setActiveConv(friend.conversationId)
                            setSidebarTab('chats')
                          } else {
                            startDirectChat(friend)
                          }
                        }}
                      >
                        <div className="msg-conv-avatar wa-avatar" style={{ position: 'relative' }}>
                          {friend.avatar ?
                            <img src={friend.avatar} alt="" /> :
                            <span>{(friend.firstName?.[0] || '?').toUpperCase()}</span>
                          }
                          <div className="msg-online-dot" style={{
                            position: 'absolute', bottom: 1, right: 1,
                            width: 10, height: 10, borderRadius: '50%',
                            border: '2px solid var(--bg-primary)',
                            background: isOnline(friend.id) ? '#22c55e' : '#94a3b8',
                          }} />
                        </div>
                        <div className="msg-conv-info">
                          <div className="msg-conv-name">{friend.firstName} {friend.lastName}</div>
                          <div className="msg-conv-preview" style={{ fontSize: 12 }}>
                            @{friend.username}
                            {friend.career && <span> · {friend.career}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          {friend.conversationId ? (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>💬</span>
                          ) : (
                            <span style={{
                              fontSize: 10, color: 'var(--accent)', fontWeight: 600,
                              background: 'var(--accent-bg, rgba(99,102,241,0.1))',
                              padding: '2px 8px', borderRadius: 10,
                            }}>Nuevo</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ─── TAB: GROUPS ─── */}
            {sidebarTab === 'groups' && (
              <>
                <div className="msg-sidebar-header">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewGroup(true)} style={{ width: '100%' }}>
                    + Crear grupo de estudio
                  </button>
                </div>

                <div className="msg-conv-list">
                  {groupChats.length === 0 ? (
                    <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                      <h3 style={{ margin: '0 0 8px' }}>Sin grupos</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                        Crea un grupo de estudio con tus compañeros de asignatura
                      </p>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowNewGroup(true)}>Crear grupo</button>
                    </div>
                  ) : (
                    groupChats.map(conv => (
                      <div
                        key={conv.id}
                        className={`msg-conv-item ${activeConv === conv.id ? 'active' : ''}`}
                        onClick={() => { setActiveConv(conv.id); setSidebarTab('chats') }}
                      >
                        <div className="msg-conv-avatar wa-avatar">
                          <span>📚</span>
                        </div>
                        <div className="msg-conv-info">
                          <div className="msg-conv-name">
                            {conv.name}
                            {conv.unreadCount > 0 && <span className="msg-badge">{conv.unreadCount}</span>}
                          </div>
                          <div className="msg-conv-preview">
                            {conv.participants.length} miembros
                            {conv.lastMessage && (
                              <> · {conv.lastMessage.sender?.firstName}: {conv.lastMessage.content?.slice(0, 25)}</>
                            )}
                          </div>
                        </div>
                        {conv.lastMessage && (
                          <div className="msg-conv-time">{formatTime(conv.lastMessage.createdAt)}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ─── TAB: REQUESTS ─── */}
            {sidebarTab === 'requests' && (
              <div className="msg-conv-list">
                {incomingRequests.length === 0 && sentRequests.length === 0 ? (
                  <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📩</div>
                    <h3 style={{ margin: '0 0 8px' }}>Sin solicitudes</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      Cuando alguien que no es tu contacto te envíe un mensaje, aparecerá aquí
                    </p>
                  </div>
                ) : (
                  <>
                    {incomingRequests.length > 0 && (
                      <div style={{ padding: '8px 12px 4px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Recibidas ({incomingRequests.length})
                        </div>
                      </div>
                    )}
                    {incomingRequests.map(conv => {
                      const other = conv.participants.find(p => p.id !== user?.id)
                      return (
                        <div key={conv.id} className="msg-conv-item msg-request-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="msg-conv-avatar wa-avatar" style={{ flexShrink: 0 }}>
                              {other?.avatar ?
                                <img src={other.avatar} alt="" /> :
                                <span>{(other?.firstName?.[0] || '?').toUpperCase()}</span>
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{other?.firstName} {other?.lastName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{other?.username} quiere enviarte un mensaje</div>
                            </div>
                          </div>
                          {conv.lastMessage && (
                            <div style={{
                              background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 10px',
                              fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic',
                              borderLeft: '3px solid var(--accent)',
                            }}>
                              "{conv.lastMessage.content?.slice(0, 80)}"
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, fontSize: 12 }}
                              onClick={(e) => { e.stopPropagation(); acceptMessageRequest(conv.id) }}
                            >
                              ✓ Aceptar
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, fontSize: 12 }}
                              onClick={(e) => { e.stopPropagation(); rejectMessageRequest(conv.id) }}
                            >
                              ✕ Rechazar
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {sentRequests.length > 0 && (
                      <>
                        <div style={{ padding: '12px 12px 4px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Enviadas ({sentRequests.length})
                          </div>
                        </div>
                        {sentRequests.map(conv => {
                          const other = conv.participants.find(p => p.id !== user?.id)
                          return (
                            <div key={conv.id} className="msg-conv-item" style={{ opacity: 0.7 }}>
                              <div className="msg-conv-avatar wa-avatar">
                                {other?.avatar ?
                                  <img src={other.avatar} alt="" /> :
                                  <span>{(other?.firstName?.[0] || '?').toUpperCase()}</span>
                                }
                              </div>
                              <div className="msg-conv-info">
                                <div className="msg-conv-name">{other?.firstName} {other?.lastName}</div>
                                <div className="msg-conv-preview">⏳ Esperando respuesta...</div>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Chat pane */}
          <div className="msg-chat">
            {activeConversation ? (
              <>
                {/* WhatsApp-style header with avatar */}
                <div className="msg-chat-header wa-header">
                  <div className="wa-header-left" onClick={() => otherParticipant && onNavigate(`/user/${otherParticipant.id}`)}>
                    <div className="wa-header-avatar">
                      {activeConversation.type === 'group_study' ? '📚' : (
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

                {/* Message request banner */}
                {activeConversation.type === 'message_request' && (
                  <div style={{
                    padding: '12px 16px', background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
                    flexShrink: 0,
                  }}>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      {activeConversation.participants.find(p => p.role === 'admin')?.id === user?.id ? (
                        <span style={{ color: 'var(--text-muted)' }}>⏳ Esperando que acepten tu solicitud de mensaje...</span>
                      ) : (
                        <span><strong>{otherParticipant?.firstName}</strong> quiere enviarte un mensaje</span>
                      )}
                    </div>
                    {activeConversation.participants.find(p => p.role === 'admin')?.id !== user?.id && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => acceptMessageRequest(activeConversation.id)}>
                          ✓ Aceptar
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => rejectMessageRequest(activeConversation.id)}>
                          ✕ Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                <p style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '8px auto 0' }}>
                  Selecciona una conversación o elige un amigo para empezar a chatear
                </p>
                {friends.length > 0 && (
                  <div style={{ marginTop: 24, maxWidth: 360 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Amigos recientes:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                      {friends.slice(0, 6).map(f => (
                        <div
                          key={f.id}
                          onClick={() => startDirectChat(f)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 12,
                            cursor: 'pointer', border: '1px solid var(--border-color)', minWidth: 90,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'var(--accent)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 600, overflow: 'hidden',
                          }}>
                            {f.avatar ?
                              <img src={f.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> :
                              f.firstName?.[0]
                            }
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{f.firstName}</div>
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
              <h3>Crear grupo de estudio</h3>
              <div className="auth-field">
                <label>Nombre del grupo</label>
                <input placeholder="Ej: Cálculo II - Sección A" value={groupName} onChange={e => setGroupName(e.target.value)} autoFocus />
              </div>
              <div className="auth-field">
                <label>{t('msg.addMembers')}</label>
                <input placeholder={t('msg.searchPlaceholder')} value={searchQuery} onChange={e => handleSearch(e.target.value)} />
              </div>

              {/* Quick add from friends */}
              {friends.length > 0 && selectedUsers.length === 0 && !searchQuery && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Amigos:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {friends.slice(0, 8).map(f => (
                      <button
                        key={f.id}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 16 }}
                        onClick={() => setSelectedUsers(prev =>
                          prev.find(x => x.id === f.id) ? prev : [...prev, f]
                        )}
                      >
                        + {f.firstName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
