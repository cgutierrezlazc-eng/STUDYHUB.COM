import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { Home, Camera, Megaphone, MessageSquare, Calendar, BookOpen, BarChart3, Users as UsersIcon, Share2, Save as SaveIcon, Globe, Lock, ListChecks, Sparkles } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const REACTION_EMOJIS: Record<string, string> = {
  like: '\u{1F44D}', love: '\u2764\uFE0F', useful: '\u{1F393}', brilliant: '\u{1F4A1}', funny: '\u{1F602}', thinking: '\u{1F914}',
}

export default function Feed({ onNavigate }: Props) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [feedSort, setFeedSort] = useState<'recent' | 'smart'>(() => (localStorage.getItem('conniku_feed_sort') as any) || 'recent')
  const [newPostContent, setNewPostContent] = useState('')
  const [postImage, setPostImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const tagTimeoutRef = useRef<any>(null)
  const [universityNews, setUniversityNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null)
  const [postVisibility, setPostVisibility] = useState<string>('public')
  const [postVisibilityListId, setPostVisibilityListId] = useState<string | null>(null)
  const [friendLists, setFriendLists] = useState<any[]>([])
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [showListSubmenu, setShowListSubmenu] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creatingList, setCreatingList] = useState(false)
  const visibilityRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFeed()
    api.getFriendLists().then(data => setFriendLists(data || [])).catch(() => {})
    loadUniversityNews()
  }, [])

  const loadUniversityNews = async () => {
    if (localStorage.getItem('conniku_university_news') === 'false') return
    try {
      setNewsLoading(true)
      const data = await api.getUniversityNews()
      setUniversityNews(data.items || [])
    } catch (err) { console.error('Failed to load news:', err) }
    finally { setNewsLoading(false) }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as Node)) {
        setShowVisibilityMenu(false)
        setShowListSubmenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadFeed = async (p: number = 1, sort?: 'recent' | 'smart') => {
    try {
      const data = await api.getFeed(p, sort || feedSort)
      const items = Array.isArray(data) ? data : (data.posts || data.items || [])
      if (p === 1) setPosts(items)
      else setPosts(prev => [...prev, ...items])
      setHasMore(items.length >= 20)
      setPage(p)
    } catch (err: any) {
      console.error('Failed to load feed:', err)
    }
    setLoading(false)
  }

  const handlePost = async () => {
    if (!newPostContent.trim() && !postImage) return
    if (!user) return
    setPosting(true)
    try {
      await api.createWallPost(
        user.id, newPostContent, postImage || undefined,
        postVisibility, undefined,
        postVisibility === 'list' ? postVisibilityListId || undefined : undefined
      )
      setNewPostContent('')
      setPostImage(null)
      setPostVisibility('public')
      setPostVisibilityListId(null)
      setSuggestedTags([])
      loadFeed(1)
    } catch (err: any) {
      alert(err.message || 'Error al publicar')
    }
    setPosting(false)
  }

  const handleCreateFriendList = async () => {
    if (!newListName.trim()) return
    setCreatingList(true)
    try {
      const list = await api.createFriendList(newListName.trim())
      setFriendLists(prev => [...prev, { ...list, memberCount: 0, members: [] }])
      setPostVisibility('list')
      setPostVisibilityListId(list.id)
      setNewListName('')
      setShowListSubmenu(false)
      setShowVisibilityMenu(false)
    } catch (err: any) {
      alert(err.message || 'Error al crear lista')
    }
    setCreatingList(false)
  }

  const visibilityOptions: Record<string, { icon: React.ReactNode; label: string }> = {
    public: { icon: Globe({ size: 14 }), label: 'Publico' },
    friends: { icon: UsersIcon({ size: 14 }), label: 'Solo amigos' },
    private: { icon: Lock({ size: 14 }), label: 'Solo yo' },
    list: { icon: ListChecks({ size: 14 }), label: 'Lista de amigos' },
  }

  const getVisibilityLabel = () => {
    if (postVisibility === 'list' && postVisibilityListId) {
      const list = friendLists.find(l => l.id === postVisibilityListId)
      return list ? list.name : 'Lista'
    }
    return visibilityOptions[postVisibility]?.label || 'Publico'
  }

  const getVisibilityIcon = () => {
    return visibilityOptions[postVisibility]?.icon || Globe({ size: 14 })
  }

  const handleReact = async (postId: string, reactionType: string) => {
    try {
      const result = await api.reactToPost(postId, reactionType)
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p, reactions: result.reactions, userReaction: result.userReaction,
        liked: result.reacted, likes: Object.values(result.reactions as Record<string, number>).reduce((a: number, b: number) => a + b, 0),
      } : p))
    } catch (err: any) {
      console.error('Reaction failed:', err)
    }
    setHoveredReaction(null)
  }

  const handleQuickLike = async (postId: string, currentReaction: string | null) => {
    const type = currentReaction ? currentReaction : 'like'
    await handleReact(postId, type)
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => { const s = new Set(prev); s.delete(postId); return s })
    } else {
      if (!comments[postId]) {
        try {
          const data = await api.getComments(postId)
          setComments(prev => ({ ...prev, [postId]: data }))
        } catch (err: any) {
          console.error('Failed to load comments:', err)
        }
      }
      setExpandedComments(prev => new Set(prev).add(postId))
    }
  }

  const handleComment = async (postId: string) => {
    const text = commentTexts[postId]
    if (!text?.trim()) return
    try {
      const comment = await api.addComment(postId, text)
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }))
      setCommentTexts(prev => ({ ...prev, [postId]: '' }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
    } catch (err: any) {
      alert(err.message || 'Error al comentar')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPostImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{Home({ size: 22 })} Inicio</h2>
            <p>Actividad de tu red de estudio</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
            <button
              className={`tab ${feedSort === 'recent' ? 'active' : ''}`}
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => { setFeedSort('recent'); localStorage.setItem('conniku_feed_sort', 'recent'); setLoading(true); loadFeed(1, 'recent') }}>
              Reciente
            </button>
            <button
              className={`tab ${feedSort === 'smart' ? 'active' : ''}`}
              style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => { setFeedSort('smart'); localStorage.setItem('conniku_feed_sort', 'smart'); setLoading(true); loadFeed(1, 'smart') }}>
              {Sparkles({ size: 12 })} Relevante
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          {/* Main Feed */}
          <div>
            {/* Composer */}
            <div className="u-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden',
                }}>
                  {user?.avatar ? <img src={user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : (user?.firstName?.[0] || '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={newPostContent}
                    onChange={e => {
                      setNewPostContent(e.target.value)
                      // Auto-tag after 30+ chars with debounce
                      if (tagTimeoutRef.current) clearTimeout(tagTimeoutRef.current)
                      if (e.target.value.trim().length >= 30) {
                        tagTimeoutRef.current = setTimeout(async () => {
                          setTagsLoading(true)
                          try {
                            const result = await api.autoTag(e.target.value)
                            if (result.tags?.length) setSuggestedTags(result.tags)
                          } catch {}
                          setTagsLoading(false)
                        }, 1500)
                      } else {
                        setSuggestedTags([])
                      }
                    }}
                    placeholder={'\u00BFQu\u00E9 est\u00E1s estudiando?'}
                    style={{
                      width: '100%', minHeight: 60, resize: 'vertical', padding: 12,
                      border: '1px solid var(--border-color)', borderRadius: 12,
                      background: 'var(--bg-primary)', color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: 'inherit',
                    }}
                  />
                  {postImage && (
                    <div style={{ position: 'relative', marginTop: 8 }}>
                      <img src={postImage} alt="" style={{ maxHeight: 200, borderRadius: 8 }} />
                      <button onClick={() => setPostImage(null)} style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)',
                        color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24,
                        cursor: 'pointer', fontSize: 12,
                      }}>{'\u2715'}</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                      <button onClick={() => imageInputRef.current?.click()} style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px',
                      }} title="Agregar foto">{Camera({ size: 18 })}</button>

                      {/* Visibility selector */}
                      <div ref={visibilityRef} style={{ position: 'relative' }}>
                        <button
                          onClick={() => { setShowVisibilityMenu(!showVisibilityMenu); setShowListSubmenu(false) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                            border: '1px solid var(--border-color)', borderRadius: 16,
                            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getVisibilityIcon()} {getVisibilityLabel()}
                          <span style={{ fontSize: 10, marginLeft: 2 }}>{'\u25BC'}</span>
                        </button>

                        {showVisibilityMenu && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 20,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            minWidth: 200, overflow: 'hidden',
                          }}>
                            {Object.entries(visibilityOptions).map(([key, opt]) => (
                              key !== 'list' ? (
                                <button key={key} onClick={() => {
                                  setPostVisibility(key)
                                  setPostVisibilityListId(null)
                                  setShowVisibilityMenu(false)
                                  setShowListSubmenu(false)
                                }} style={{
                                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                  padding: '10px 14px', border: 'none', background: postVisibility === key ? 'var(--accent-alpha, rgba(79,140,255,0.1))' : 'transparent',
                                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                                  fontFamily: 'inherit',
                                }}>
                                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{opt.icon}</span>
                                  <span>{opt.label}</span>
                                  {postVisibility === key && key !== 'list' && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 14 }}>{'\u2713'}</span>}
                                </button>
                              ) : (
                                <div key={key} style={{ position: 'relative' }}>
                                  <button onClick={() => setShowListSubmenu(!showListSubmenu)} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                    padding: '10px 14px', border: 'none', background: postVisibility === 'list' ? 'var(--accent-alpha, rgba(79,140,255,0.1))' : 'transparent',
                                    color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                                    fontFamily: 'inherit',
                                  }}>
                                    <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 10 }}>{'\u25B6'}</span>
                                  </button>

                                  {showListSubmenu && (
                                    <div style={{
                                      position: 'absolute', left: 0, top: '100%', marginTop: 2,
                                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                      borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                      minWidth: 200, maxHeight: 260, overflowY: 'auto',
                                    }}>
                                      {friendLists.length > 0 ? friendLists.map(fl => (
                                        <button key={fl.id} onClick={() => {
                                          setPostVisibility('list')
                                          setPostVisibilityListId(fl.id)
                                          setShowVisibilityMenu(false)
                                          setShowListSubmenu(false)
                                        }} style={{
                                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                          padding: '10px 14px', border: 'none', fontSize: 13,
                                          background: postVisibilityListId === fl.id ? 'var(--accent-alpha, rgba(79,140,255,0.1))' : 'transparent',
                                          color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                                          fontFamily: 'inherit',
                                        }}>
                                          <span>{fl.name}</span>
                                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fl.memberCount || 0}</span>
                                          {postVisibilityListId === fl.id && <span style={{ color: 'var(--accent)', fontSize: 14 }}>{'\u2713'}</span>}
                                        </button>
                                      )) : (
                                        <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                                          No tienes listas todavia
                                        </div>
                                      )}
                                      <div style={{ borderTop: '1px solid var(--border-color)', padding: '8px 10px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <input
                                            value={newListName}
                                            onChange={e => setNewListName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleCreateFriendList()}
                                            placeholder="Nueva lista..."
                                            style={{
                                              flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 12,
                                              border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                                              color: 'var(--text-primary)', fontFamily: 'inherit',
                                            }}
                                          />
                                          <button
                                            onClick={handleCreateFriendList}
                                            disabled={creatingList || !newListName.trim()}
                                            style={{
                                              padding: '6px 10px', borderRadius: 8, border: 'none',
                                              background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                                              fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap',
                                              opacity: creatingList || !newListName.trim() ? 0.5 : 1,
                                            }}
                                          >
                                            {creatingList ? '...' : 'Crear'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {suggestedTags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {suggestedTags.map((tag, i) => (
                            <span key={i} className="u-card-tag" style={{ fontSize: 10, cursor: 'pointer' }}
                              onClick={() => setNewPostContent(prev => prev + ` #${tag.replace(/\s/g, '')}`)}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {tagsLoading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sugiriendo tags...</span>}
                      <button className="btn btn-primary btn-sm press-feedback" onClick={handlePost} disabled={posting || (!newPostContent.trim() && !postImage)}>
                        {posting ? 'Publicando...' : 'Publicar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="u-card-flat" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div className="skeleton skeleton-avatar" />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                        <div className="skeleton skeleton-text" style={{ width: '20%' }} />
                      </div>
                    </div>
                    <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ background: 'rgba(249,115,22,0.08)' }}>
                  {Megaphone({ size: 28, color: 'var(--accent-orange)' })}
                </div>
                <div className="empty-state-title">Tu feed esta vacio</div>
                <div className="empty-state-desc">Conecta con otros estudiantes para ver publicaciones, apuntes y actividad de tu comunidad.</div>
                <button className="empty-state-cta" onClick={() => onNavigate('/friends')}>
                  {UsersIcon({ size: 14 })} Buscar Companeros
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {posts.map(post => (
                  <div key={post.id} className="u-card" style={{ padding: 16 }}>
                    {/* Post Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div onClick={() => onNavigate(`/user/${post.authorId || post.author?.id}`)} style={{
                        width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, cursor: 'pointer', overflow: 'hidden',
                      }}>
                        {(post.authorAvatar || post.author?.avatar)
                          ? <img src={post.authorAvatar || post.author?.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          : ((post.authorName || post.author?.firstName || '?')[0])}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => onNavigate(`/user/${post.authorId || post.author?.id}`)}>
                          {post.authorName || `${post.author?.firstName || ''} ${post.author?.lastName || ''}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {timeAgo(post.createdAt)}
                          {post.visibility && post.visibility !== 'public' && (
                            <span title={
                              post.visibility === 'friends' ? 'Solo amigos' :
                              post.visibility === 'private' ? 'Solo yo' :
                              post.visibility === 'list' ? 'Lista de amigos' : post.visibility
                            } style={{ display: 'inline-flex', opacity: 0.6 }}>
                              {post.visibility === 'friends' ? UsersIcon({ size: 11 }) :
                               post.visibility === 'private' ? Lock({ size: 11 }) :
                               post.visibility === 'list' ? ListChecks({ size: 11 }) :
                               Globe({ size: 11 })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>}
                    {(post.imageUrl || post.image_url) && (
                      <img src={post.imageUrl || post.image_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12, maxHeight: 400, objectFit: 'cover' }} />
                    )}

                    {/* Reactions summary */}
                    {post.reactions && Object.keys(post.reactions).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        {Object.entries(post.reactions as Record<string, number>).map(([type, count]) => (
                          <span key={type}>{REACTION_EMOJIS[type] || '\u{1F44D}'} {count}</span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 4, borderTop: '1px solid var(--border-color)', paddingTop: 8, position: 'relative' }}>
                      {/* Reaction button with hover popup */}
                      <div style={{ position: 'relative' }}
                        onMouseEnter={() => setHoveredReaction(post.id)}
                        onMouseLeave={() => setHoveredReaction(null)}
                      >
                        <button onClick={() => handleQuickLike(post.id, post.userReaction)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
                          fontSize: 13, color: post.userReaction ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: post.userReaction ? 700 : 400, borderRadius: 8,
                        }}>
                          {post.userReaction ? REACTION_EMOJIS[post.userReaction] : '\u{1F44D}'} {post.userReaction ? 'Reaccionado' : 'Me gusta'}
                        </button>

                        {hoveredReaction === post.id && (
                          <div style={{
                            position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                            display: 'flex', gap: 2, padding: '6px 8px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            borderRadius: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            zIndex: 10,
                          }}>
                            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                              <button key={type} onClick={() => handleReact(post.id, type)} title={type} style={{
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 4,
                                borderRadius: '50%', transition: 'transform 0.15s',
                              }}
                              onMouseEnter={e => (e.target as HTMLElement).style.transform = 'scale(1.3)'}
                              onMouseLeave={e => (e.target as HTMLElement).style.transform = 'scale(1)'}
                              >{emoji}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={() => toggleComments(post.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
                        fontSize: 13, color: 'var(--text-muted)', borderRadius: 8,
                      }}>
                        {MessageSquare({ size: 14 })} {post.commentCount || 0} Comentarios
                      </button>
                      <button onClick={async () => {
                        try {
                          const result = await api.toggleBookmark(post.id)
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, bookmarked: result.bookmarked } : p))
                        } catch (err: any) { console.error('Bookmark failed:', err) }
                      }} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
                        fontSize: 13, color: post.bookmarked ? 'var(--accent)' : 'var(--text-muted)', borderRadius: 8,
                      }}>
                        {SaveIcon({ size: 14 })} Guardar
                      </button>
                      <button onClick={async () => {
                        const comment = prompt('Agrega un comentario (opcional):')
                        try {
                          await api.sharePost(post.id, comment || '')
                          alert('Publicación compartida en tu perfil')
                        } catch (err: any) { alert(err.message || 'Error') }
                      }} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
                        fontSize: 13, color: 'var(--text-muted)', borderRadius: 8,
                      }}>
                        {Share2({ size: 14 })} Compartir
                      </button>
                    </div>

                    {/* Comments */}
                    {expandedComments.has(post.id) && (
                      <div style={{ marginTop: 8, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                        {(comments[post.id] || []).map((c: any) => (
                          <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 11, flexShrink: 0, overflow: 'hidden',
                            }}>
                              {c.author?.avatar ? <img src={c.author.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : (c.author?.firstName?.[0] || '?')}
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '8px 12px', flex: 1 }}>
                              <strong style={{ cursor: 'pointer' }} onClick={() => onNavigate(`/user/${c.author?.id}`)}>{c.author?.firstName} {c.author?.lastName}</strong>
                              <div style={{ marginTop: 2 }}>{c.content}</div>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <input
                            value={commentTexts[post.id] || ''}
                            onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                            placeholder="Escribe un comentario..."
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: 20,
                              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)', fontSize: 13,
                            }}
                          />
                          <button className="btn btn-primary btn-xs" onClick={() => handleComment(post.id)}>Enviar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {hasMore && (
                  <button className="btn btn-secondary" onClick={() => loadFeed(page + 1)} style={{ alignSelf: 'center' }}>
                    Cargar m&aacute;s
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ position: 'sticky', top: 20 }}>
            {/* University News */}
            {localStorage.getItem('conniku_university_news') !== 'false' && (
              <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card, #1E252A)', border: '1px solid var(--border, #2a3038)' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #2a3038)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D62C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #F5F7F8)' }}>
                      Noticias de {user?.university || 'tu universidad'}
                    </h4>
                  </div>
                  {universityNews.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted, #8a9bae)', background: 'var(--bg-tertiary, #151B1E)', padding: '3px 8px', borderRadius: 10 }}>
                      {universityNews.length} {universityNews.length === 1 ? 'noticia' : 'noticias'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '12px 16px' }}>
                  {newsLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted, #8a9bae)', fontSize: 13 }}>
                      Cargando noticias...
                    </div>
                  ) : universityNews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted, #8a9bae)', fontSize: 13, lineHeight: 1.5 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 8 }}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                      <div>Las noticias de tu universidad se actualizan cada 3 horas</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {universityNews.map((item: any, idx: number) => (
                        <a
                          key={idx}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', gap: 12, padding: 12, borderRadius: 10,
                            background: 'var(--bg-tertiary, #151B1E)', textDecoration: 'none',
                            border: '1px solid transparent', transition: 'border-color 0.2s, background 0.2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D62C8'; e.currentTarget.style.background = 'rgba(45,98,200,0.06)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg-tertiary, #151B1E)' }}
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt=""
                              style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                              onError={e => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #F5F7F8)', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {item.title}
                            </div>
                            {item.summary && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted, #8a9bae)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {item.summary}
                              </div>
                            )}
                            {item.published && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #6b7a8d)', marginTop: 4 }}>
                                {item.published}
                              </div>
                            )}
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #6b7a8d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="u-card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Accesos r&aacute;pidos</h4>
              {[
                { icon: Calendar({ size: 16 }), label: 'Calendario', path: '/calendar' },
                { icon: BookOpen({ size: 16 }), label: 'Marketplace', path: '/marketplace' },
                { icon: BarChart3({ size: 16 }), label: 'Dashboard', path: '/dashboard' },
                { icon: UsersIcon({ size: 16 }), label: 'Mi Perfil', path: user ? `/user/${user.id}` : '/profile' },
              ].map(link => (
                <button key={link.path} onClick={() => onNavigate(link.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 0', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13,
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <span style={{ fontSize: 16 }}>{link.icon}</span> {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
