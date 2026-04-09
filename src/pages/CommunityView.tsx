import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Users, Star, Shield, MessageSquare, Globe, Lock, Trash2, Pin, Settings, AlertTriangle, X } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORIES = ['general', 'materia', 'carrera', 'estudio', 'universidad', 'hobby', 'academico', 'deportes', 'tecnologia', 'arte', 'musica', 'ciencias', 'idiomas', 'social', 'otro']

export default function CommunityView({ onNavigate }: Props) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useI18n()
  const [community, setCommunity] = useState<any>(null)
  const [tab, setTab] = useState<'posts' | 'recursos' | 'eventos' | 'members' | 'info'>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', rules: '', type: 'public', category: 'general' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [reportPostId, setReportPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')

  // New state
  const [postSort, setPostSort] = useState<'new' | 'popular'>('new')
  const [postImage, setPostImage] = useState<string | null>(null)
  const postImageInputRef = useRef<HTMLInputElement>(null)
  const [resources, setResources] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showAddResource, setShowAddResource] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newResource, setNewResource] = useState({ resource_type: 'link', title: '', url: '', description: '' })
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', location: '', meet_url: '' })
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [myRole, setMyRole] = useState<string>('member')

  useEffect(() => {
    if (id) { loadCommunity(); loadPosts() }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (community && user) {
      const role = community.memberRole
      if (role) setMyRole(role)
    }
  }, [community, user])

  useEffect(() => {
    if (tab === 'members') loadMembers()
    if (tab === 'recursos') loadResources()
    if (tab === 'eventos') loadEvents()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCommunity = async () => {
    try { setCommunity(await api.getCommunity(id!)) } catch (err: any) { console.error('Failed to load community:', err) }
    setLoading(false)
  }
  const loadPosts = async () => {
    try { setPosts(await api.getCommunityPosts(id!)) } catch (err: any) { console.error('Failed to load posts:', err) }
  }
  const loadMembers = async () => {
    try { setMembers(await api.getCommunityMembers(id!)) } catch (err: any) { console.error('Failed to load members:', err) }
  }
  const loadResources = async () => {
    try { setResources(await api.getCommunityResources(id!)) } catch {}
  }
  const loadEvents = async () => {
    try { setEvents(await api.getCommunityEvents(id!)) } catch {}
  }

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPostImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePost = async (isAnnouncement = false) => {
    if (!newPost.trim() && !postImage) return
    try {
      const post = await api.createCommunityPost(id!, newPost, { image_url: postImage || undefined, is_announcement: isAnnouncement })
      setPosts(prev => [post, ...prev])
      setNewPost('')
      setPostImage(null)
    } catch (err: any) { alert(err.message || 'Error al publicar') }
  }

  const handleJoin = async () => {
    try {
      await api.joinCommunity(id!)
      loadCommunity()
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleLeave = async () => {
    if (!confirm('¿Salir de esta comunidad?')) return
    try {
      await api.leaveCommunity(id!)
      loadCommunity()
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleLike = async (postId: string) => {
    try {
      const result = await api.likeCommunityPost(postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: result.likeCount, liked: result.liked } : p))
    } catch (err: any) { console.error('Like failed:', err) }
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => { const s = new Set(prev); s.delete(postId); return s })
    } else {
      if (!comments[postId]) {
        try {
          const data = await api.getCommunityPostComments(postId)
          setComments(prev => ({ ...prev, [postId]: data }))
        } catch (err: any) { console.error('Failed to load comments:', err) }
      }
      setExpandedComments(prev => new Set(prev).add(postId))
    }
  }

  const handleComment = async (postId: string) => {
    const text = commentTexts[postId]
    if (!text?.trim()) return
    try {
      const c = await api.addCommunityPostComment(postId, text)
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), c] }))
      setCommentTexts(prev => ({ ...prev, [postId]: '' }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handlePin = async (postId: string) => {
    try {
      const result = await api.pinCommunityPost(postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: result.isPinned } : p))
    } catch (err: any) { console.error('Pin failed:', err) }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Eliminar este post?')) return
    try {
      await api.deleteCommunityPost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err: any) { console.error('Delete post failed:', err) }
  }

  const handleReport = async () => {
    if (!reportPostId || !reportReason.trim()) return
    try {
      await api.reportCommunityPost(reportPostId, reportReason)
      alert('Reporte enviado. Gracias por ayudar a mantener la comunidad segura.')
      setReportPostId(null)
      setReportReason('')
    } catch (err: any) { alert(err.message || 'Error al reportar') }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    const label = newRole === 'moderator' ? 'moderador' : 'miembro'
    if (!confirm(`¿Cambiar rol a ${label}?`)) return
    try {
      await api.changeMemberRole(id!, userId, newRole)
      loadMembers()
    } catch (err: any) { alert(err.message || 'Error al cambiar rol') }
  }

  const handleKickMember = async (userId: string, name: string) => {
    if (!confirm(`¿Expulsar a ${name} de la comunidad?`)) return
    try {
      await api.removeMember(id!, userId)
      setMembers(prev => prev.filter(m => m.user?.id !== userId))
    } catch (err: any) { alert(err.message || 'Error al expulsar') }
  }

  const openSettings = () => {
    if (!community) return
    setSettingsForm({
      name: community.name || '',
      description: community.description || '',
      rules: community.rules || '',
      type: community.type || 'public',
      category: community.category || 'general',
    })
    setShowSettings(true)
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const updated = await api.updateCommunity(id!, settingsForm)
      setCommunity((prev: any) => ({ ...prev, ...updated, rules: settingsForm.rules }))
      setShowSettings(false)
    } catch (err: any) { alert(err.message || 'Error al guardar') }
    setSavingSettings(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const result = await api.uploadCommunityCover(id!, file)
      setCommunity((prev: any) => ({ ...prev, coverImage: result.url }))
    } catch (err: any) { alert(err.message || 'Error al subir imagen') }
    setCoverUploading(false)
  }

  if (loading) return (
    <div className="page-body">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}
      </div>
    </div>
  )
  if (!community) return (
    <div className="page-body">
      <div className="empty-state"><h3>{t('communityview.notfound')}</h3></div>
    </div>
  )

  const isAdmin = myRole === 'admin'
  const isMod = myRole === 'moderator' || isAdmin
  const categoryColor = '#6366f1'

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isAnnouncement && !b.isAnnouncement) return -1
    if (!a.isAnnouncement && b.isAnnouncement) return 1
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    if (postSort === 'popular') return (b.likeCount || 0) - (a.likeCount || 0)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <>
      {/* Cover banner */}
      <div style={{
        position: 'relative', height: 180,
        background: community.coverImage
          ? `url(${community.coverImage}) center/cover`
          : `linear-gradient(135deg, ${categoryColor}22, ${categoryColor}55)`,
        marginBottom: 0,
      }}>
        {isAdmin && (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              style={{
                position: 'absolute', bottom: 12, right: 12,
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
              }}
            >
              {coverUploading ? 'Subiendo...' : '📷 Cambiar portada'}
            </button>
          </>
        )}
      </div>

      {/* Community header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px 0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -32, marginBottom: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: community.avatar ? `url(${community.avatar}) center/cover` : categoryColor + '22',
            border: '4px solid var(--bg-card)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: categoryColor,
          }}>
            {!community.avatar && community.name?.[0]}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800 }}>{community.name}</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{Users({ size: 13 })} {community.memberCount} miembros</span>
              <span style={{ width: 1, height: 14, background: 'var(--border-subtle)', display: 'inline-block' }} />
              <span style={{ background: categoryColor + '18', color: categoryColor, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {community.category}
              </span>
              {community.type === 'private' && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Lock({ size: 11 })} Privada
                </span>
              )}
            </div>
          </div>
          {/* Join/Leave/Settings */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            {community.isMember ? (
              <>
                {isAdmin && (
                  <button className="btn btn-secondary btn-sm" onClick={openSettings} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Settings({ size: 14 })} Configurar
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={handleLeave}>Salir</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin}>Unirse a la comunidad</button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, borderTop: '1px solid var(--border-subtle)', paddingTop: 12, overflowX: 'auto' }}>
          {(['posts', 'recursos', 'eventos', 'members', 'info'] as const).map(t2 => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
                fontSize: 13, fontWeight: tab === t2 ? 700 : 400,
                color: tab === t2 ? categoryColor : 'var(--text-muted)',
                borderBottom: tab === t2 ? `2px solid ${categoryColor}` : '2px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t2 === 'posts' ? '📝 Posts' : t2 === 'recursos' ? '📂 Recursos' : t2 === 'eventos' ? '📅 Eventos' : t2 === 'members' ? '👥 Miembros' : 'ℹ️ Info'}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 16 }}>

        {/* ── POSTS TAB ── */}
        {tab === 'posts' && (
          <div>
            {/* Post composer */}
            {community.isMember && (
              <div className="u-card" style={{ padding: 16, marginBottom: 16 }}>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Escribe algo para la comunidad..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    fontSize: 14, resize: 'vertical', fontFamily: 'inherit', marginBottom: 10,
                    boxSizing: 'border-box',
                  }}
                />
                {postImage && (
                  <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                    <img src={postImage} alt="" style={{ maxHeight: 120, borderRadius: 8 }} />
                    <button
                      onClick={() => setPostImage(null)}
                      style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)',
                        color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20,
                        cursor: 'pointer', fontSize: 12,
                      }}
                    >×</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={postImageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePostImageSelect}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => postImageInputRef.current?.click()}>
                    📷 Imagen
                  </button>
                  {isMod && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handlePost(true)}
                      style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                    >
                      📢 Publicar como anuncio
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => handlePost(false)}
                    disabled={!newPost.trim() && !postImage}
                  >
                    Publicar
                  </button>
                </div>
              </div>
            )}

            {/* Sort controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['new', 'popular'] as const).map(s => (
                <button
                  key={s}
                  className={`btn btn-sm ${postSort === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPostSort(s)}
                >
                  {s === 'new' ? '🕐 Nuevo' : '🔥 Popular'}
                </button>
              ))}
            </div>

            {/* Posts list */}
            {sortedPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div style={{ fontWeight: 700 }}>Sin publicaciones aún</div>
                {community.isMember && (
                  <div style={{ fontSize: 13, marginTop: 4 }}>¡Sé el primero en publicar algo!</div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sortedPosts.map(post => (
                  <div
                    key={post.id}
                    className="u-card"
                    style={{
                      padding: 16,
                      border: post.isAnnouncement
                        ? '1.5px solid #f59e0b'
                        : post.isPinned ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Badges */}
                    {(post.isAnnouncement || post.isPinned) && (
                      <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
                        {post.isAnnouncement && (
                          <span style={{ background: '#f59e0b22', color: '#f59e0b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                            📢 ANUNCIO
                          </span>
                        )}
                        {post.isPinned && !post.isAnnouncement && (
                          <span style={{ background: 'var(--accent)22', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                            📌 FIJADO
                          </span>
                        )}
                      </div>
                    )}
                    {/* Author */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14,
                          overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                        }}
                        onClick={() => onNavigate(`/user/${post.author?.id}`)}
                      >
                        {post.author?.avatar
                          ? <img src={post.author.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          : post.author?.firstName?.[0] || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer' }} onClick={() => onNavigate(`/user/${post.author?.id}`)}>
                          {post.author?.firstName} {post.author?.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(post.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isMod && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => handlePin(post.id)}
                            title={post.isPinned ? 'Desfijar' : 'Fijar'}
                          >
                            {Pin({ size: 13 })}
                          </button>
                        )}
                        {(isMod || post.author?.id === user?.id) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                            onClick={() => handleDeletePost(post.id)}
                          >
                            {Trash2({ size: 13 })}
                          </button>
                        )}
                        {community.isMember && post.author?.id !== user?.id && (
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px' }}
                            onClick={() => { setReportPostId(post.id); setReportReason('') }}
                          >
                            {AlertTriangle({ size: 13 })}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Content */}
                    <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: post.imageUrl ? 10 : 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {post.content}
                    </div>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 12, display: 'block' }} />
                    )}
                    {/* Like / comment */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => handleLike(post.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                          color: post.liked ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: post.liked ? 700 : 400,
                        }}
                      >
                        {post.liked ? '❤️' : '🤍'} {post.likeCount || 0}
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)',
                        }}
                      >
                        {MessageSquare({ size: 14 })} {post.commentCount || 0}
                      </button>
                    </div>
                    {/* Comments */}
                    {expandedComments.has(post.id) && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                        {(comments[post.id] || []).map((c: any) => (
                          <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                              flexShrink: 0, overflow: 'hidden',
                            }}>
                              {c.author?.avatar
                                ? <img src={c.author.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                : c.author?.firstName?.[0] || '?'}
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '6px 10px', flex: 1 }}>
                              <span style={{ fontWeight: 600, fontSize: 12 }}>{c.author?.firstName} </span>
                              {c.content}
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input
                            value={commentTexts[post.id] || ''}
                            onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                            placeholder="Escribe un comentario..."
                            style={{
                              flex: 1, padding: '7px 12px', borderRadius: 20,
                              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                              fontSize: 13, outline: 'none',
                            }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => handleComment(post.id)}>→</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RECURSOS TAB ── */}
        {tab === 'recursos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>📂 Recursos de la comunidad</h3>
              {community.isMember && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddResource(true)}>+ Agregar recurso</button>
              )}
            </div>
            {resources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                <div style={{ fontWeight: 700 }}>Sin recursos aún</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Comparte links, apuntes y materiales con la comunidad.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resources.map(r => (
                  <div key={r.id} className="u-card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>
                      {r.resourceType === 'link' ? '🔗' : r.resourceType === 'file' ? '📄' : '📝'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                      {r.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Por @{r.uploaderUsername} · {new Date(r.createdAt).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                          Abrir →
                        </a>
                      )}
                      {(r.uploaderId === user?.id || isMod) && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={async () => {
                            try { await api.deleteCommunityResource(id!, r.id); loadResources() } catch {}
                          }}
                        >
                          {Trash2({ size: 13 })}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add resource modal */}
            {showAddResource && (
              <div className="modal-overlay" onClick={() => setShowAddResource(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h3>+ Agregar recurso</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="auth-field">
                      <label>Tipo</label>
                      <select
                        value={newResource.resource_type}
                        onChange={e => setNewResource(p => ({ ...p, resource_type: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 14 }}
                      >
                        <option value="link">🔗 Link externo</option>
                        <option value="file">📄 Archivo</option>
                        <option value="note">📝 Apunte/Nota</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label>Título *</label>
                      <input
                        value={newResource.title}
                        onChange={e => setNewResource(p => ({ ...p, title: e.target.value }))}
                        placeholder="Ej: Apuntes Clase 1 - Límites"
                      />
                    </div>
                    {newResource.resource_type !== 'note' && (
                      <div className="auth-field">
                        <label>URL</label>
                        <input
                          value={newResource.url}
                          onChange={e => setNewResource(p => ({ ...p, url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                    <div className="auth-field">
                      <label>Descripción</label>
                      <input
                        value={newResource.description}
                        onChange={e => setNewResource(p => ({ ...p, description: e.target.value }))}
                        placeholder="Descripción opcional"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowAddResource(false)}>Cancelar</button>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!newResource.title.trim()) return
                        try {
                          await api.addCommunityResource(id!, newResource)
                          setShowAddResource(false)
                          setNewResource({ resource_type: 'link', title: '', url: '', description: '' })
                          loadResources()
                        } catch (err: any) { alert(err.message || 'Error') }
                      }}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EVENTOS TAB ── */}
        {tab === 'eventos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>📅 Eventos de la comunidad</h3>
              {isMod && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddEvent(true)}>+ Crear evento</button>
              )}
            </div>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontWeight: 700 }}>Sin eventos próximos</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Los administradores pueden crear sesiones de estudio y reuniones.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {events.map(ev => {
                  const evDate = new Date(ev.eventDate)
                  const isPast = evDate < new Date()
                  return (
                    <div key={ev.id} className="u-card" style={{ padding: 16, opacity: isPast ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ textAlign: 'center', minWidth: 52, background: 'var(--accent)18', borderRadius: 10, padding: '8px 6px' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                            {evDate.getDate()}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {evDate.toLocaleString('es-CL', { month: 'short' })}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{ev.title}</div>
                          {ev.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{ev.description}</div>}
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <span>🕐 {evDate.toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                            {ev.location && <span>📍 {ev.location}</span>}
                            <span>👥 {ev.rsvpCount} asistentes</span>
                          </div>
                          {ev.meetUrl && (
                            <a
                              href={ev.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{ marginTop: 8, display: 'inline-flex', textDecoration: 'none', fontSize: 12 }}
                            >
                              📹 Unirse a la videollamada
                            </a>
                          )}
                        </div>
                        {!isPast && community.isMember && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 110 }}>
                            {(['going', 'maybe', 'not_going'] as const).map(s => (
                              <button
                                key={s}
                                className={`btn btn-sm ${ev.myRsvp === s ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: 11 }}
                                onClick={async () => {
                                  try {
                                    const res = await api.rsvpCommunityEvent(id!, ev.id, s)
                                    setEvents(prev => prev.map(e2 => e2.id === ev.id ? { ...e2, myRsvp: s, rsvpCount: res.rsvpCount } : e2))
                                  } catch {}
                                }}
                              >
                                {s === 'going' ? '✅ Voy' : s === 'maybe' ? '🤔 Tal vez' : '❌ No voy'}
                              </button>
                            ))}
                          </div>
                        )}
                        {isPast && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'flex-start', background: 'var(--bg-secondary)', borderRadius: 6, padding: '2px 8px' }}>
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add event modal */}
            {showAddEvent && (
              <div className="modal-overlay" onClick={() => setShowAddEvent(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h3>📅 Crear evento</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="auth-field">
                      <label>Título *</label>
                      <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Sesión de estudio — Parcial 2" />
                    </div>
                    <div className="auth-field">
                      <label>Descripción</label>
                      <textarea
                        value={newEvent.description}
                        onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                        rows={2}
                        style={{ resize: 'vertical', fontFamily: 'inherit', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 14 }}
                      />
                    </div>
                    <div className="auth-field">
                      <label>Fecha y hora *</label>
                      <input
                        type="datetime-local"
                        value={newEvent.event_date}
                        onChange={e => setNewEvent(p => ({ ...p, event_date: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 14 }}
                      />
                    </div>
                    <div className="auth-field">
                      <label>Lugar</label>
                      <input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="Ej: Sala A-203 o Online" />
                    </div>
                    <div className="auth-field">
                      <label>Link de videollamada (opcional)</label>
                      <input value={newEvent.meet_url} onChange={e => setNewEvent(p => ({ ...p, meet_url: e.target.value }))} placeholder="https://meet.jit.si/..." />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowAddEvent(false)}>Cancelar</button>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!newEvent.title.trim() || !newEvent.event_date) return
                        try {
                          await api.createCommunityEvent(id!, { ...newEvent, event_date: new Date(newEvent.event_date).toISOString() })
                          setShowAddEvent(false)
                          setNewEvent({ title: '', description: '', event_date: '', location: '', meet_url: '' })
                          loadEvents()
                        } catch (err: any) { alert(err.message || 'Error') }
                      }}
                    >
                      Crear evento
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === 'members' && (
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700 }}>{members.length} miembros</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {members.map(m => (
                <div key={m.id} className="u-card" style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                      cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                    }}
                    onClick={() => onNavigate(`/user/${m.user?.id}`)}
                  >
                    {m.user?.avatar
                      ? <img src={m.user.avatar} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                      : m.user?.firstName?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer' }} onClick={() => onNavigate(`/user/${m.user?.id}`)}>
                      {m.user?.firstName} {m.user?.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{m.user?.username}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                      background: m.role === 'admin' ? '#f59e0b22' : m.role === 'moderator' ? '#3b82f622' : 'var(--bg-secondary)',
                      color: m.role === 'admin' ? '#f59e0b' : m.role === 'moderator' ? '#3b82f6' : 'var(--text-muted)',
                    }}>
                      {m.role === 'admin' ? <>{Star({ size: 11 })} Admin</> : m.role === 'moderator' ? <>{Shield({ size: 11 })} Mod</> : 'Miembro'}
                    </span>
                    {isAdmin && m.user?.id !== user?.id && m.role !== 'admin' && (
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          onClick={() => handleChangeRole(m.user.id, m.role === 'moderator' ? 'member' : 'moderator')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 10, padding: '2px 6px' }}
                        >
                          {m.role === 'moderator' ? 'Quitar mod' : `${Shield({ size: 10 })} Mod`}
                        </button>
                        <button
                          onClick={() => handleKickMember(m.user.id, `${m.user.firstName} ${m.user.lastName}`)}
                          style={{ fontSize: 10, padding: '2px 6px', background: '#ef444418', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Expulsar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <div style={{ maxWidth: 600 }}>
            <div className="u-card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>ℹ️ Sobre esta comunidad</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {community.description || 'Sin descripción.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.category')}</strong>
                  <div>{community.category}</div>
                </div>
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.type')}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {community.type === 'public' ? <>{Globe({ size: 14 })} Pública</> : <>{Lock({ size: 14 })} Privada</>}
                  </div>
                </div>
                {community.university && (
                  <div>
                    <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.university')}</strong>
                    <div>{community.university}</div>
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.created')}</strong>
                  <div>{community.createdAt ? new Date(community.createdAt).toLocaleDateString('es') : ''}</div>
                </div>
              </div>
            </div>
            {community.rules && (
              <div className="u-card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>📋 Reglas</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6, margin: 0, color: 'var(--text-secondary)' }}>
                  {community.rules}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowSettings(false)}>
          <div className="u-card" style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{Settings({ size: 18 })} Configuración de la comunidad</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>{X({ size: 18 })}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Nombre</label>
                <input
                  value={settingsForm.name}
                  onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Descripción</label>
                <textarea
                  value={settingsForm.description}
                  onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Reglas</label>
                <textarea
                  value={settingsForm.rules}
                  onChange={e => setSettingsForm(f => ({ ...f, rules: e.target.value }))}
                  rows={4}
                  placeholder="Escribe las reglas de tu comunidad..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Tipo</label>
                  <select
                    value={settingsForm.type}
                    onChange={e => setSettingsForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="public">🌐 Pública</option>
                    <option value="private">🔒 Privada</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Categoría</label>
                  <select
                    value={settingsForm.category}
                    onChange={e => setSettingsForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancelar</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveSettings}
                  disabled={savingSettings || !settingsForm.name.trim()}
                >
                  {savingSettings ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportPostId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setReportPostId(null)}>
          <div className="u-card" style={{ width: '100%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{AlertTriangle({ size: 18 })} Reportar publicación</h3>
              <button onClick={() => setReportPostId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>{X({ size: 18 })}</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>Indica el motivo del reporte.</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={3}
              placeholder="Describe el problema..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReportPostId(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleReport}
                disabled={!reportReason.trim()}
                style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
              >
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
