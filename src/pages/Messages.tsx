import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { wsService } from '../services/websocket'
import { Conversation, ConversationMessage, UserBrief, ConversationFolder } from '../types'
import { MessageSquare, Users, BookOpen, FolderOpen, AlertTriangle, Trash2, Hourglass, Inbox, Mic, Camera, Video, Paperclip, Globe, MoreVertical, Eye, Shield, Search as SearchIcon } from '../components/Icons'

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
  const [wsConnected, setWsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevConvRef = useRef<string | null>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [msgSearch, setMsgSearch] = useState('')
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessagesCount, setNewMessagesCount] = useState(0)
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef2 = useRef<HTMLTextAreaElement>(null)
  // Video recording state
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoRecordingTime, setVideoRecordingTime] = useState(0)
  const [sendingVideo, setSendingVideo] = useState(false)
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const videoTimerRef = useRef<number | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // ─── WebSocket Setup ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('conniku_token')
    if (token && !wsService.connected) {
      wsService.connect(token)
    }

    const unsubConnection = wsService.onConnection((connected) => {
      setWsConnected(connected)
      // Adjust polling speed: fast (5s) when WS down, slow (30s) when WS up
      if (activeConv) {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(
          () => loadMessages(activeConv),
          connected ? 30000 : 5000
        )
      }
    })

    // Normaliza el payload de un mensaje — soporta tanto formato WS (flat camelCase)
    // como formato REST (sender anidado). Siempre devuelve ConversationMessage.
    const normalizeMessage = (m: any): ConversationMessage => ({
      id: m.id,
      conversationId: m.conversationId,
      sender: m.sender || {
        id: m.senderId || '',
        username: m.senderUsername || '',
        firstName: m.senderFirstName || '',
        lastName: m.senderLastName || '',
        avatar: m.senderAvatar || '',
        userNumber: 0,
      },
      content: m.content,
      messageType: m.messageType || 'text',
      documentName: m.documentName,
      documentPath: m.documentPath,
      isFlagged: m.isFlagged || false,
      isDeleted: m.isDeleted || false,
      createdAt: m.createdAt,
      replyToId: m.replyToId,
      replyToContent: m.replyToContent,
      replyToSenderName: m.replyToSenderName,
      moderationStatus: m.moderationStatus || 'approved',
    })

    // Handle incoming messages (from other users)
    const unsubNewMsg = wsService.on('new_message', (data) => {
      if (data.conversation_id === activeConv) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev
          return [...prev, normalizeMessage(data.message)]
        })
        if (!isAtBottom) setNewMessagesCount(prev => prev + 1)
      }
      // Refresh conversation list for last message preview
      loadConversations()
    })

    // Handle sent message confirmation (own message echo back)
    const unsubSent = wsService.on('message_sent', (data) => {
      if (data.conversation_id === activeConv) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev
          return [...prev, normalizeMessage(data.message)]
        })
      }
    })

    // Typing indicators
    const unsubTyping = wsService.on('typing', (data) => {
      if (data.conversation_id === activeConv) {
        setTypingUsers(prev => ({ ...prev, [data.user_id]: data.username }))
        // Auto-clear after 3s
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev }
            delete next[data.user_id]
            return next
          })
        }, 3000)
      }
    })

    const unsubStopTyping = wsService.on('stop_typing', (data) => {
      setTypingUsers(prev => {
        const next = { ...prev }
        delete next[data.user_id]
        return next
      })
    })

    // Online status
    const unsubOnline = wsService.on('user_online', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.user_id]))
    })
    const unsubOffline = wsService.on('user_offline', (data) => {
      setOnlineUsers(prev => { const next = new Set(prev); next.delete(data.user_id); return next })
    })

    // Conversation updates (when not viewing that conversation)
    const unsubConvUpdate = wsService.on('conversation_update', () => {
      loadConversations()
    })

    // Moderation events
    const unsubApproved = wsService.on('message_approved', (data) => {
      setMessages(prev => prev.map(m =>
        m.id === data.message_id ? { ...m, moderationStatus: 'approved' as const } : m
      ))
    })

    const unsubRejected = wsService.on('message_rejected', (data) => {
      setMessages(prev => prev.map(m =>
        m.id === data.message_id ? { ...m, moderationStatus: 'rejected' as const } : m
      ))
    })

    return () => {
      unsubConnection()
      unsubNewMsg()
      unsubSent()
      unsubTyping()
      unsubStopTyping()
      unsubOnline()
      unsubOffline()
      unsubConvUpdate()
      unsubApproved()
      unsubRejected()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeConv])

  // ─── Initial Data Load ─────────────────────────────────────────
  useEffect(() => {
    loadConversations()
    loadFolders()
    loadFriends()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // ─── Active Conversation Change ─────────────────────────────────
  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv)

      // WebSocket subscription management
      if (prevConvRef.current && prevConvRef.current !== activeConv) {
        wsService.unsubscribeConversation(prevConvRef.current)
      }
      wsService.subscribeConversation(activeConv)
      prevConvRef.current = activeConv

      // Always poll as safety net — WS delivers instantly, polling catches anything missed.
      // Fast poll (5s) when WS is down, slow poll (30s) when WS is up.
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(
        () => loadMessages(activeConv),
        wsService.connected ? 30000 : 5000
      )
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeConv])

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const atBottom = scrollHeight - scrollTop - clientHeight < 80
      setIsAtBottom(atBottom)
      if (atBottom) setNewMessagesCount(0)
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

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
    const content = newMsg.trim()
    setNewMsg('')
    if (textareaRef2.current) { textareaRef2.current.style.height = '36px' }

    // Send typing stop
    if (wsService.connected) wsService.sendStopTyping(activeConv)

    // Always send via REST — reliable with error handling.
    // Recipients get the message in real-time via WebSocket broadcast from backend.
    setSending(true)
    try {
      await api.sendMessage(activeConv, { content, reply_to_id: replyTo?.id })
      await loadMessages(activeConv)
      await loadConversations()
    } catch (err: any) {
      alert(err.message || t('msg.errorSend'))
      setNewMsg(content) // Restore message on error
    }
    setSending(false)
    setReplyTo(null)
  }

  // Typing indicator handler
  const handleTyping = useCallback(() => {
    if (!activeConv || !wsService.connected) return
    wsService.sendTyping(activeConv)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      wsService.sendStopTyping(activeConv)
    }, 2000)
  }, [activeConv])

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
      alert(t('msg.errorMic'))
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

  // ─── Jitsi Video Call ──────────────────────────────────────────
  const startVideoCall = () => {
    if (!activeConversation) return
    const roomName = `conniku-${activeConversation.id.slice(0, 8)}-${Date.now().toString(36)}`
    const jitsiUrl = `https://meet.jit.si/${roomName}`

    // Send system message with join link
    const callMsg = `Videollamada iniciada\nUnirse: ${jitsiUrl}`
    if (wsService.connected) {
      wsService.sendMessage(activeConv!, callMsg)
    } else {
      api.sendMessage(activeConv!, { content: callMsg }).catch(() => {})
    }

    // Open Jitsi in new window
    window.open(jitsiUrl, '_blank', 'width=1024,height=768,noopener,noreferrer')
  }

  // ─── Video Recording ───────────────────────────────────────────
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      videoChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (videoTimerRef.current) clearInterval(videoTimerRef.current)
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        const url = URL.createObjectURL(blob)
        setVideoPreview(url)
      }
      // Max 30 seconds
      recorder.start(500)
      videoMediaRecorderRef.current = recorder
      setIsRecordingVideo(true)
      setVideoRecordingTime(0)
      videoTimerRef.current = window.setInterval(() => {
        setVideoRecordingTime(p => {
          if (p >= 29) {
            stopVideoRecording()
            return 30
          }
          return p + 1
        })
      }, 1000)
    } catch {
      alert('No se pudo acceder a la cámara')
    }
  }

  const stopVideoRecording = () => {
    if (videoMediaRecorderRef.current?.state !== 'inactive') {
      videoMediaRecorderRef.current?.stop()
    }
    setIsRecordingVideo(false)
    if (videoTimerRef.current) clearInterval(videoTimerRef.current)
  }

  const cancelVideoRecording = () => {
    stopVideoRecording()
    setVideoPreview(null)
    setVideoBlob(null)
    videoChunksRef.current = []
  }

  const sendVideoMessage = async () => {
    if (!videoBlob || !activeConv) return
    setSendingVideo(true)
    try {
      const result = await api.uploadVideoMessage(videoBlob)
      await api.sendMessage(activeConv, {
        content: 'Video',
        message_type: 'document',
        document_name: 'video.webm',
        document_path: result.url,
      })
      setVideoPreview(null)
      setVideoBlob(null)
      videoChunksRef.current = []
      await loadMessages(activeConv)
      await loadConversations()
    } catch (err: any) {
      alert(err.message || 'Error al enviar el video')
    }
    setSendingVideo(false)
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
      alert(err.message || t('msg.errorStartChat'))
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
      alert(err.message || t('msg.errorCreateGroup'))
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
      alert(err.message || t('msg.errorCreateFolder'))
    }
  }

  const deleteMsg = async (msgId: string) => {
    if (!activeConv) return
    try { await api.deleteMessage(activeConv, msgId); await loadMessages(activeConv) } catch (err: any) {
      alert(err.message || t('msg.errorDeleteMsg'))
    }
  }

  const handleBlockUser = async () => {
    const otherUser = activeConversation?.participants.find(p => p.id !== user?.id)
    if (!otherUser) return
    if (confirm(t('msg.confirmBlock').replace('{name}', `${otherUser.firstName} ${otherUser.lastName}`))) {
      try {
        await api.blockUser(otherUser.id)
        alert(t('msg.userBlocked').replace('{name}', otherUser.firstName))
        setShowContactMenu(false)
      } catch { alert(t('msg.errorBlockUser')) }
    }
  }

  const handleReportUser = async () => {
    const otherUser = activeConversation?.participants.find(p => p.id !== user?.id)
    if (!otherUser) return
    const reason = prompt(t('msg.reportReason').replace('{name}', otherUser.firstName))
    if (reason) {
      try {
        await api.reportUser(otherUser.id, reason)
        alert(t('msg.reportSent'))
        setShowContactMenu(false)
      } catch { alert(t('msg.errorReportUser')) }
    }
  }

  const acceptMessageRequest = async (convId: string) => {
    try {
      await api.acceptMessageRequest(convId)
      await loadConversations()
    } catch (err: any) {
      alert(err.message || t('msg.errorAcceptRequest'))
    }
  }

  const rejectMessageRequest = async (convId: string) => {
    try {
      await api.rejectMessageRequest(convId)
      await loadConversations()
      if (activeConv === convId) setActiveConv(null)
    } catch (err: any) {
      alert(err.message || t('msg.errorRejectRequest'))
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

  // Online indicator — uses actual WS online users set
  const isOnline = (userId: string) => onlineUsers.has(userId)

  // ─── Emoji list ────────────────────────────────────────────────
  const EMOJIS = ['😊','😂','❤️','👍','🔥','✨','🎉','😍','🤔','😭','💪','📚','✅','🙏','😅','👏','🥰','😎','🤩','💡','📝','🎯','⭐','🚀','💯']

  const insertEmoji = (emoji: string) => {
    setNewMsg(prev => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef2.current?.focus()
  }

  // ─── Textarea auto-resize ──────────────────────────────────────
  const autoResizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ─── Date separator helper ─────────────────────────────────────
  const formatDateSeparator = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Hoy'
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // ─── Link detection helper ─────────────────────────────────────
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
           style={{ color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {part}
        </a>
      ) : part
    )
  }

  // ─── Message grouping logic ────────────────────────────────────
  const getIsGrouped = (msgs: ConversationMessage[], index: number): boolean => {
    if (index === 0) return false
    const curr = msgs[index]
    const prev = msgs[index - 1]
    if (prev.messageType === 'system' || curr.messageType === 'system') return false
    if (prev.sender?.id !== curr.sender?.id) return false
    const timeDiff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()
    return timeDiff < 5 * 60 * 1000
  }

  const getDateChanged = (msgs: ConversationMessage[], index: number): boolean => {
    if (index === 0) return true
    const curr = new Date(msgs[index].createdAt).toDateString()
    const prev = new Date(msgs[index - 1].createdAt).toDateString()
    return curr !== prev
  }

  // ─── Message search filter ─────────────────────────────────────
  const filteredMessages = msgSearch
    ? messages.filter(m => m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages

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
      <div className="page-header page-enter">
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
                {MessageSquare({ size: 16 })} {t('msg.chats')}
                {totalUnread > 0 && <span className="msg-tab-badge">{totalUnread}</span>}
              </button>
              <button
                className={`msg-tab ${sidebarTab === 'friends' ? 'active' : ''}`}
                onClick={() => setSidebarTab('friends')}
              >
                {Users({ size: 16 })} {t('msg.friends')}
              </button>
              <button
                className={`msg-tab ${sidebarTab === 'groups' ? 'active' : ''}`}
                onClick={() => setSidebarTab('groups')}
              >
                {BookOpen({ size: 16 })} {t('msg.groups')}
              </button>
              <button
                className={`msg-tab ${sidebarTab === 'requests' ? 'active' : ''}`}
                onClick={() => setSidebarTab('requests')}
              >
                {Inbox({ size: 16 })} {t('msg.requests')}
                {incomingRequests.length > 0 && <span className="msg-tab-badge">{incomingRequests.length}</span>}
              </button>
            </div>

            {/* ─── TAB: CHATS ─── */}
            {sidebarTab === 'chats' && (
              <>
                <div className="msg-sidebar-header">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewChat(true)}>{t('msg.newChatBtn')}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowNewGroup(true)}>{t('msg.newGroupBtn')}</button>
                </div>

                {folders.length > 0 && (
                  <div className="msg-folders">
                    {folders.map(f => (
                      <div key={f.id} className="msg-folder-label">{FolderOpen({ size: 14 })} {f.name}</div>
                    ))}
                  </div>
                )}
                <button className="msg-add-folder" onClick={() => setShowNewFolder(true)}>+ {t('msg.newFolder')}</button>

                <div className="msg-conv-list">
                  {loading ? (
                    <div className="msg-empty">{t('msg.loading')}</div>
                  ) : conversations.length === 0 ? (
                    <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div className="empty-state-icon">{MessageSquare({ size: 48 })}</div>
                      <h3 style={{ margin: '0 0 8px' }}>{t('msg.noConversations')}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{t('msg.emptyConvDesc')}</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setSidebarTab('friends')}>{t('msg.viewFriends')}</button>
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
                            {conv.type === 'group_study' ? Users() : (
                              other?.avatar ?
                                <img src={other.avatar} alt="" /> :
                                <span>{(other?.firstName?.[0] || conv.name?.[0] || '?').toUpperCase()}</span>
                            )}
                          </div>
                          <div className="msg-conv-info">
                            <div className="msg-conv-name">
                              {conv.type === 'group_study' && <span style={{ marginRight: 4, fontSize: 12 }}>{BookOpen({ size: 12 })}</span>}
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
                    placeholder={t('msg.searchFriend')}
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
                      <div className="empty-state-icon">{Users({ size: 48 })}</div>
                      <h3 style={{ margin: '0 0 8px' }}>{t('msg.noFriends')}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{t('msg.noFriendsDesc')}</p>
                      <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/friends')}>{t('msg.goToCommunity')}</button>
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
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{MessageSquare({ size: 11 })}</span>
                          ) : (
                            <span style={{
                              fontSize: 10, color: 'var(--accent)', fontWeight: 600,
                              background: 'var(--accent-bg, rgba(99,102,241,0.1))',
                              padding: '2px 8px', borderRadius: 10,
                            }}>{t('msg.new')}</span>
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
                    {t('msg.createStudyGroup')}
                  </button>
                </div>

                <div className="msg-conv-list">
                  {groupChats.length === 0 ? (
                    <div className="msg-empty" style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div className="empty-state-icon">{BookOpen({ size: 48 })}</div>
                      <h3 style={{ margin: '0 0 8px' }}>{t('msg.noGroups')}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                        {t('msg.noGroupsDesc')}
                      </p>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowNewGroup(true)}>{t('msg.createGroupBtn')}</button>
                    </div>
                  ) : (
                    groupChats.map(conv => (
                      <div
                        key={conv.id}
                        className={`msg-conv-item ${activeConv === conv.id ? 'active' : ''}`}
                        onClick={() => { setActiveConv(conv.id); setSidebarTab('chats') }}
                      >
                        <div className="msg-conv-avatar wa-avatar">
                          <span>{BookOpen()}</span>
                        </div>
                        <div className="msg-conv-info">
                          <div className="msg-conv-name">
                            {conv.name}
                            {conv.unreadCount > 0 && <span className="msg-badge">{conv.unreadCount}</span>}
                          </div>
                          <div className="msg-conv-preview">
                            {conv.participants.length} {t('msg.members')}
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
                    <div className="empty-state-icon">{Inbox({ size: 48 })}</div>
                    <h3 style={{ margin: '0 0 8px' }}>{t('msg.noRequests')}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {t('msg.noRequestsDesc')}
                    </p>
                  </div>
                ) : (
                  <>
                    {incomingRequests.length > 0 && (
                      <div style={{ padding: '8px 12px 4px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('msg.received')} ({incomingRequests.length})
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
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{other?.username} {t('msg.wantsToMessage')}</div>
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
                              {t('msg.accept')}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, fontSize: 12 }}
                              onClick={(e) => { e.stopPropagation(); rejectMessageRequest(conv.id) }}
                            >
                              {t('msg.reject')}
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {sentRequests.length > 0 && (
                      <>
                        <div style={{ padding: '12px 12px 4px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('msg.sent')} ({sentRequests.length})
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
                                <div className="msg-conv-preview">{Hourglass({ size: 12 })} {t('msg.waitingResponse')}</div>
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
          <div className="msg-chat" style={{ position: 'relative' }}>
            {activeConversation ? (
              <>
                {/* WhatsApp-style header with avatar */}
                <div className="msg-chat-header wa-header">
                  <div className="wa-header-left" onClick={() => otherParticipant && onNavigate(`/user/${otherParticipant.id}`)}>
                    <div className="wa-header-avatar">
                      {activeConversation.type === 'group_study' ? BookOpen() : (
                        otherParticipant?.avatar ?
                          <img src={otherParticipant.avatar} alt="" /> :
                          <span>{(otherParticipant?.firstName?.[0] || '?').toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <strong>{activeConversation.name}</strong>
                      {activeConversation.type === 'group_study' ? (
                        <small>{activeConversation.participants.length} {t('msg.members')}</small>
                      ) : (
                        <small>@{otherParticipant?.username}</small>
                      )}
                    </div>
                  </div>
                  <div className="wa-header-actions">
                    <button className="wa-icon-btn" title={t('msg.voiceCall')} disabled>{Mic({ size: 16 })}</button>
                    <button className="wa-icon-btn" title="Videollamada (Jitsi)" onClick={startVideoCall}>{Video({ size: 16 })}</button>
                    {showMsgSearch ? (
                      <input
                        autoFocus
                        value={msgSearch}
                        onChange={e => setMsgSearch(e.target.value)}
                        placeholder="Buscar en la conversación..."
                        style={{
                          padding: '6px 10px', borderRadius: 20, border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)', fontSize: 13, outline: 'none', width: 180,
                        }}
                        onKeyDown={e => e.key === 'Escape' && (setShowMsgSearch(false), setMsgSearch(''))}
                      />
                    ) : null}
                    <button className="wa-icon-btn" onClick={() => { setShowMsgSearch(s => !s); setMsgSearch('') }} title="Buscar">
                      {SearchIcon({ size: 16 })}
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button className="wa-icon-btn" onClick={() => setShowContactMenu(!showContactMenu)}>{MoreVertical({ size: 16 })}</button>
                      {showContactMenu && (
                        <div className="wa-dropdown-menu">
                          {otherParticipant && (
                            <>
                              <button onClick={() => { onNavigate(`/user/${otherParticipant.id}`); setShowContactMenu(false) }}>
                                {Eye({ size: 14 })} {t('msg.viewProfile')}
                              </button>
                              <button onClick={handleBlockUser}>
                                {Shield({ size: 14 })} {t('msg.blockContact')}
                              </button>
                              <button onClick={handleReportUser} className="wa-danger">
                                {AlertTriangle({ size: 14 })} {t('msg.report')}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="msg-messages wa-messages" ref={messagesContainerRef} style={{ position: 'relative', overflowY: 'auto', flex: 1 }}>
                  {filteredMessages.map((msg, index) => {
                    const isMine = msg.sender?.id === user?.id
                    const isGrouped = getIsGrouped(filteredMessages, index)
                    const showDateSep = getDateChanged(filteredMessages, index)
                    const isAudio = (msg.documentName?.endsWith('.webm') && !msg.documentName?.match(/video/i)) || msg.content === '🎤 Mensaje de voz'
                    const isPhoto = msg.documentName?.match(/\.(jpg|jpeg|png|gif)$/i) || msg.content === '📷 Foto'
                    const isVideo = msg.documentName?.match(/\.(webm|mp4|ogg)$/i) && msg.content !== '🎤 Mensaje de voz' || msg.content === 'Video'
                    // Don't show pending/rejected messages to non-senders
                    if (msg.moderationStatus === 'pending' && !isMine) return null
                    if (msg.moderationStatus === 'rejected' && !isMine) return null
                    return (
                      <React.Fragment key={msg.id}>
                        {/* Date separator */}
                        {showDateSep && (
                          <div style={{
                            textAlign: 'center', padding: '8px 0', margin: '4px 0',
                            fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                            {formatDateSeparator(msg.createdAt)}
                            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                          </div>
                        )}
                        <div
                          className={`msg-bubble wa-bubble ${isMine ? 'mine' : ''} ${msg.messageType === 'system' ? 'system' : ''}`}
                          style={{ marginTop: isGrouped ? 2 : 8, position: 'relative' }}
                          onMouseEnter={() => setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                        >
                          {msg.messageType === 'system' ? (
                            <div className="msg-system">{msg.content}</div>
                          ) : (
                            <>
                              {/* Hover action toolbar */}
                              {hoveredMsgId === msg.id && !msg.isDeleted && (
                                <div style={{
                                  position: 'absolute', [isMine ? 'left' : 'right']: '100%',
                                  top: 0, display: 'flex', gap: 4, padding: '0 4px',
                                  background: 'var(--bg-card)', borderRadius: 8,
                                  border: '1px solid var(--border-subtle)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  zIndex: 10, marginRight: isMine ? 0 : 4, marginLeft: isMine ? 4 : 0,
                                }}>
                                  <button
                                    onClick={() => setReplyTo({ id: msg.id, content: msg.content, senderName: msg.sender?.firstName || '' })}
                                    title="Responder"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontSize: 14, color: 'var(--text-muted)' }}
                                  >↩</button>
                                  <button
                                    onClick={() => navigator.clipboard?.writeText(msg.content)}
                                    title="Copiar"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontSize: 14, color: 'var(--text-muted)' }}
                                  >⧉</button>
                                  {isMine && (
                                    <button
                                      onClick={() => deleteMsg(msg.id)}
                                      title="Eliminar"
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontSize: 14, color: 'var(--accent-red, #ef4444)' }}
                                    >🗑</button>
                                  )}
                                </div>
                              )}
                              {/* Sender name for groups (only first in group) */}
                              {!isMine && activeConversation?.type === 'group_study' && !isGrouped && (
                                <div className="msg-sender wa-sender">{msg.sender?.firstName}</div>
                              )}
                              {/* Reply quote */}
                              {msg.replyToContent && (
                                <div style={{
                                  background: 'rgba(0,0,0,0.06)', borderLeft: '3px solid var(--accent)',
                                  borderRadius: '4px 0 0 4px', padding: '4px 8px',
                                  marginBottom: 4, fontSize: 12, lineHeight: 1.3,
                                }}>
                                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11, marginBottom: 2 }}>
                                    {msg.replyToSenderName}
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                    {msg.replyToContent}
                                  </div>
                                </div>
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
                                ) : isVideo && msg.documentPath ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <video controls src={
                                      msg.documentPath.startsWith('/uploads/')
                                        ? `${import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com'}${msg.documentPath}`
                                        : msg.documentPath
                                    } style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block' }} />
                                    {/* Expiry notice */}
                                    {(() => {
                                      const sentAt = new Date(msg.createdAt).getTime()
                                      const expiresAt = sentAt + 72 * 3600 * 1000
                                      const remaining = expiresAt - Date.now()
                                      if (remaining <= 0) {
                                        return (
                                          <div style={{ fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            ⚠️ Video expirado del servidor
                                          </div>
                                        )
                                      }
                                      const hoursLeft = Math.floor(remaining / 3600000)
                                      const minsLeft = Math.floor((remaining % 3600000) / 60000)
                                      const label = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`
                                      return (
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                          🕐 Expira en {label}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                ) : (
                                  renderMessageContent(msg.content)
                                )}
                              </div>
                              {/* Translate button */}
                              {!msg.isDeleted && msg.content && !isMine && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    const btn = e.currentTarget
                                    if (btn.dataset.translated) {
                                      btn.textContent = 'Aa'
                                      btn.title = t('msg.translate')
                                      const original = btn.dataset.original || ''
                                      const contentEl = btn.parentElement?.querySelector('.msg-content') as HTMLElement
                                      if (contentEl) contentEl.textContent = original
                                      delete btn.dataset.translated
                                    } else {
                                      btn.textContent = '...'
                                      try {
                                        const result = await api.translateText(msg.content, user?.language || 'es')
                                        const contentEl = btn.parentElement?.querySelector('.msg-content') as HTMLElement
                                        if (contentEl) {
                                          btn.dataset.original = contentEl.textContent || ''
                                          contentEl.textContent = result.translated
                                        }
                                        btn.textContent = 'Aa'
                                        btn.title = t('msg.viewOriginal')
                                        btn.dataset.translated = 'true'
                                      } catch {
                                        btn.textContent = 'Aa'
                                      }
                                    }
                                  }}
                                  title={t('msg.translate')}
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
                                {msg.moderationStatus === 'pending' && (
                                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>En revisión</span>
                                )}
                                {msg.moderationStatus === 'rejected' && (
                                  <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Rechazado</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </React.Fragment>
                    )
                  })}
                  <div ref={messagesEndRef} />
                  {/* Typing indicator */}
                  {Object.keys(typingUsers).length > 0 && (
                    <div style={{
                      padding: '4px 16px 8px', color: 'var(--text-muted)', fontSize: 12,
                      fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ display: 'inline-flex', gap: 2 }}>
                        <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: 'typingBounce 1.4s infinite', animationDelay: '0s' }} />
                        <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: 'typingBounce 1.4s infinite', animationDelay: '0.2s' }} />
                        <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: 'typingBounce 1.4s infinite', animationDelay: '0.4s' }} />
                      </span>
                      {Object.values(typingUsers).join(', ')} {t('msg.typing')}
                    </div>
                  )}
                </div>
                {/* Scroll-to-bottom button */}
                {!isAtBottom && (
                  <button
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                      setIsAtBottom(true)
                      setNewMessagesCount(0)
                    }}
                    style={{
                      position: 'absolute', bottom: 80, right: 16, zIndex: 10,
                      background: 'var(--accent)', color: '#fff',
                      border: 'none', borderRadius: '50%', width: 40, height: 40,
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}
                    title="Ir al final"
                  >
                    {newMessagesCount > 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{newMessagesCount}</span>
                    ) : '↓'}
                  </button>
                )}

                {/* Message request banner */}
                {activeConversation.type === 'message_request' && (
                  <div style={{
                    padding: '12px 16px', background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
                    flexShrink: 0,
                  }}>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      {activeConversation.participants.find(p => p.role === 'admin')?.id === user?.id ? (
                        <span style={{ color: 'var(--text-muted)' }}>{Hourglass({ size: 14 })} {t('msg.waitingAccept')}</span>
                      ) : (
                        <span><strong>{otherParticipant?.firstName}</strong> {t('msg.wantsToMessage')}</span>
                      )}
                    </div>
                    {activeConversation.participants.find(p => p.role === 'admin')?.id !== user?.id && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => acceptMessageRequest(activeConversation.id)}>
                          {t('msg.accept')}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => rejectMessageRequest(activeConversation.id)}>
                          {t('msg.reject')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Video preview before sending */}
                {videoPreview && (
                  <div className="wa-photo-preview" style={{ flexDirection: 'column', gap: 10 }}>
                    <video src={videoPreview} controls style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      Duración: {videoRecordingTime}s
                    </div>
                    {/* ⚠️ Advertencia TTL */}
                    <div style={{
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)',
                      borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.4 }}>
                        Los videos se eliminan automáticamente del servidor a las <strong>72 horas</strong> de ser enviados.
                        Descarga el video si quieres conservarlo.
                      </span>
                    </div>
                    <div className="wa-photo-preview-actions">
                      <button className="btn btn-secondary btn-sm" onClick={cancelVideoRecording}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={sendVideoMessage} disabled={sendingVideo}>
                        {sendingVideo ? 'Enviando...' : '🎥 Enviar video'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Video recording overlay */}
                {isRecordingVideo && (
                  <div className="wa-recording-bar">
                    <button className="wa-icon-btn wa-cancel-rec" onClick={cancelVideoRecording} title="Cancelar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <div className="recording-indicator" style={{ flex: 1 }}>
                      <span className="recording-dot" style={{ background: '#3b82f6' }} />
                      <span style={{ fontWeight: 600 }}>🎥 {formatRecTime(videoRecordingTime)} / 0:30</span>
                    </div>
                    <button className="wa-icon-btn wa-send-rec" onClick={stopVideoRecording} title="Detener y previsualizar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                    </button>
                  </div>
                )}

                {/* Photo preview */}
                {photoPreview && (
                  <div className="wa-photo-preview">
                    <img src={photoPreview} alt="" />
                    <div className="wa-photo-preview-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setPhotoPreview(null)}>{t('msg.cancel')}</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSendPhoto} disabled={sending}>{t('msg.sendPhoto')}</button>
                    </div>
                  </div>
                )}

                {/* Input bar */}
                <div className="msg-input-bar wa-input-bar">
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />

                  {isRecordingAudio ? (
                    <div className="wa-recording-bar">
                      <button className="wa-icon-btn wa-cancel-rec" onClick={cancelAudioRecording} title={t('msg.cancelRecording')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      <div className="recording-indicator" style={{ flex: 1 }}>
                        <span className="recording-dot" />
                        <span style={{ fontWeight: 600 }}>{formatRecTime(recordingTime)}</span>
                      </div>
                      <button className="wa-icon-btn wa-send-rec" onClick={stopAudioRecording} title={t('msg.sendAudio')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Reply preview */}
                      {replyTo && (
                        <div style={{
                          padding: '8px 12px', background: 'var(--bg-secondary)',
                          borderTop: '1px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <div style={{ flex: 1, borderLeft: '3px solid var(--accent)', paddingLeft: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                              Respondiendo a {replyTo.senderName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                              {replyTo.content}
                            </div>
                          </div>
                          <button
                            onClick={() => setReplyTo(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}
                          >×</button>
                        </div>
                      )}
                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <div style={{
                          position: 'absolute', bottom: '100%', left: 8, zIndex: 100,
                          background: 'var(--bg-card)', borderRadius: 12, padding: 12,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex', flexWrap: 'wrap', gap: 6, width: 280,
                        }}>
                          {EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => insertEmoji(emoji)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: '2px 4px', borderRadius: 6, transition: 'background 0.1s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >{emoji}</button>
                          ))}
                        </div>
                      )}
                      <div className="wa-actions-group">
                        <button className="wa-icon-btn" onClick={() => photoInputRef.current?.click()} title={t('msg.sendPhotoTooltip')}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </button>
                        <button className="wa-icon-btn" onClick={() => setShowEmojiPicker(v => !v)} title="Emoji" style={{ fontSize: 18 }}>😊</button>
                        <button className="wa-icon-btn wa-mic-btn" onClick={startAudioRecording} title={t('msg.voiceMessage')}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </button>
                        <button className="wa-icon-btn" onClick={startVideoRecording} title="Grabar video" style={{ fontSize: 16 }}>🎥</button>
                      </div>
                      <textarea
                        ref={textareaRef2}
                        value={newMsg}
                        rows={1}
                        onChange={e => {
                          setNewMsg(e.target.value)
                          handleTyping()
                          autoResizeTextarea(e.target)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        placeholder={t('msg.typePlaceholder')}
                        disabled={sending}
                        className="wa-text-input"
                        style={{ resize: 'none', overflowY: 'hidden', minHeight: 36, maxHeight: 120 }}
                      />
                      <button className="wa-send-btn" onClick={handleSend} disabled={sending || !newMsg.trim()} title={t('msg.send')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="msg-no-chat">
                <div className="msg-no-chat-icon">{MessageSquare({ size: 48 })}</div>
                <h3>{t('msg.selectChat')}</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '8px auto 0' }}>
                  {t('msg.selectChatDesc')}
                </p>
                {friends.length > 0 && (
                  <div style={{ marginTop: 24, maxWidth: 360 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{t('msg.recentFriends')}</p>
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
              <h3>{t('msg.createStudyGroupTitle')}</h3>
              <div className="auth-field">
                <label>{t('msg.groupNameLabel')}</label>
                <input placeholder={t('msg.groupNameExample')} value={groupName} onChange={e => setGroupName(e.target.value)} autoFocus />
              </div>
              <div className="auth-field">
                <label>{t('msg.addMembers')}</label>
                <input placeholder={t('msg.searchPlaceholder')} value={searchQuery} onChange={e => handleSearch(e.target.value)} />
              </div>

              {/* Quick add from friends */}
              {friends.length > 0 && selectedUsers.length === 0 && !searchQuery && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('msg.friendsLabel')}</label>
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
