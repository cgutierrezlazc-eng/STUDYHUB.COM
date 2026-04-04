import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

export default function CommunityView({ onNavigate }: Props) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [community, setCommunity] = useState<any>(null)
  const [tab, setTab] = useState<'posts' | 'members' | 'info'>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (id) { loadCommunity(); loadPosts() }
  }, [id])

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

  const handlePost = async () => {
    if (!newPost.trim()) return
    try {
      const post = await api.createCommunityPost(id!, newPost)
      setPosts(prev => [post, ...prev])
      setNewPost('')
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
        try { const data = await api.getCommunityPostComments(postId); setComments(prev => ({ ...prev, [postId]: data })) } catch (err: any) { console.error('Failed to load comments:', err) }
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

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  if (loading) return <div className="page-body"><div className="loading-dots"><span /><span /><span /></div></div>
  if (!community) return <div className="page-body"><div className="empty-state"><h3>Comunidad no encontrada</h3></div></div>

  const isAdmin = community.memberRole === 'admin'
  const isMod = community.memberRole === 'moderator' || isAdmin

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent)33, var(--accent-purple)33)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {community.avatar || '🏘️'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{community.name}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
              👥 {community.memberCount} miembros · {community.category}
              {community.university && ` · 🏫 ${community.university}`}
            </p>
          </div>
          {community.isMember ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {community.memberRole && <span className="badge" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: 12, fontSize: 12 }}>
                {isAdmin ? '⭐ Admin' : isMod ? '🛡️ Mod' : '✓ Miembro'}
              </span>}
              <button className="btn btn-secondary btn-sm" onClick={handleLeave}>Salir</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleJoin}>Unirse</button>
          )}
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>Publicaciones</button>
          <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => { setTab('members'); loadMembers() }}>Miembros</button>
          <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Info</button>
        </div>
      </div>

      <div className="page-body">
        {tab === 'posts' && (
          <>
            {community.isMember && (
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Publica algo en la comunidad..."
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', marginBottom: 8 }} />
                <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={!newPost.trim()}>Publicar</button>
              </div>
            )}
            {posts.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div style={{ fontSize: 48 }}>📢</div><h3>Sin publicaciones aún</h3><p>Sé el primero en compartir algo</p></div>
            ) : posts.map(post => (
              <div key={post.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
                {post.isPinned && <div style={{ fontSize: 12, color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 8 }}>📌 Fijado</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div onClick={() => onNavigate(`/user/${post.author?.id}`)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', overflow: 'hidden', fontSize: 14 }}>
                    {post.author?.avatar ? <img src={post.author.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : (post.author?.firstName?.[0] || '?')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14, cursor: 'pointer' }} onClick={() => onNavigate(`/user/${post.author?.id}`)}>{post.author?.firstName} {post.author?.lastName}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                  </div>
                  {(isMod || post.author?.id === user?.id) && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {isMod && <button onClick={() => handlePin(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} title="Fijar">📌</button>}
                      <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--accent-red)' }} title="Eliminar">🗑</button>
                    </div>
                  )}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                {post.imageUrl && <img src={post.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 300, objectFit: 'cover' }} />}
                <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: post.liked ? 'var(--accent)' : 'var(--text-muted)' }}>
                    👍 {post.likeCount || 0}
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                    💬 {post.commentCount || 0}
                  </button>
                </div>
                {expandedComments.has(post.id) && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                    {(comments[post.id] || []).map((c: any) => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, flexShrink: 0, overflow: 'hidden' }}>
                          {c.author?.avatar ? <img src={c.author.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : (c.author?.firstName?.[0] || '?')}
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '8px 12px', flex: 1 }}>
                          <strong>{c.author?.firstName}</strong>
                          <div style={{ marginTop: 2 }}>{c.content}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={commentTexts[post.id] || ''} onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)} placeholder="Comentar..."
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }} />
                      <button className="btn btn-primary btn-xs" onClick={() => handleComment(post.id)}>Enviar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'members' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {members.map(m => (
              <div key={m.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div onClick={() => onNavigate(`/user/${m.user?.id}`)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', overflow: 'hidden' }}>
                  {m.user?.avatar ? <img src={m.user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : (m.user?.firstName?.[0] || '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.user?.firstName} {m.user?.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{m.user?.username}</div>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: m.role === 'admin' ? 'var(--accent-orange)22' : m.role === 'moderator' ? 'var(--accent-blue)22' : 'var(--bg-secondary)', color: m.role === 'admin' ? 'var(--accent-orange)' : m.role === 'moderator' ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                  {m.role === 'admin' ? '⭐ Admin' : m.role === 'moderator' ? '🛡️ Mod' : 'Miembro'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'info' && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Información</h3>
            {community.description && <p style={{ fontSize: 14, lineHeight: 1.6 }}>{community.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Categoría</strong><div>{community.category}</div></div>
              <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tipo</strong><div>{community.type === 'public' ? '🌐 Pública' : '🔒 Privada'}</div></div>
              {community.university && <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Universidad</strong><div>{community.university}</div></div>}
              <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Creada</strong><div>{community.createdAt ? new Date(community.createdAt).toLocaleDateString('es') : ''}</div></div>
            </div>
            {community.rules && (
              <div style={{ marginTop: 16 }}>
                <h4>📋 Reglas</h4>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, fontSize: 14, whiteSpace: 'pre-wrap' }}>{community.rules}</div>
              </div>
            )}
            {community.creator && (
              <div style={{ marginTop: 16 }}>
                <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Creador</strong>
                <div onClick={() => onNavigate(`/user/${community.creator.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, overflow: 'hidden' }}>
                    {community.creator.avatar ? <img src={community.creator.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : community.creator.firstName?.[0]}
                  </div>
                  <span style={{ fontSize: 14 }}>{community.creator.firstName} {community.creator.lastName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
