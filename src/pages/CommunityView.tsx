import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Users, Star, Shield, ThumbsUp, MessageSquare, Globe, Lock, ClipboardList, Trash2, Megaphone, Pin, Settings, AlertTriangle, X, ChevronDown } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORIES = ['general', 'academico', 'deportes', 'tecnologia', 'arte', 'musica', 'ciencias', 'idiomas', 'social', 'otro']

export default function CommunityView({ onNavigate }: Props) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useI18n()
  const [community, setCommunity] = useState<any>(null)
  const [tab, setTab] = useState<'posts' | 'members' | 'info'>('posts')
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
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const [reportPostId, setReportPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')

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

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  if (loading) return <div className="page-body"><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div></div>
  if (!community) return <div className="page-body"><div className="empty-state"><h3>{t('communityview.notfound')}</h3></div></div>

  const isAdmin = community.memberRole === 'admin'
  const isMod = community.memberRole === 'moderator' || isAdmin

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent)33, var(--accent-purple)33)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {community.avatar || Globe({ size: 36 })}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{community.name}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
              {Users({ size: 14 })} {community.memberCount} miembros · {community.category}
              {community.university && <> · {community.university}</>}
            </p>
          </div>
          {community.isMember ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {community.memberRole && <span className="badge" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: 12, fontSize: 12 }}>
                {isAdmin ? <>{Star({ size: 14 })} Admin</> : isMod ? <>{Shield({ size: 14 })} Mod</> : '✓ Miembro'}
              </span>}
              {isAdmin && (
                <button onClick={openSettings} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Configuración">
                  {Settings({ size: 16 })}
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={handleLeave}>{t('communityview.leave')}</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleJoin}>{t('communityview.join')}</button>
          )}
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>{t('communityview.posts')}</button>
          <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => { setTab('members'); loadMembers() }}>{t('communityview.members')}</button>
          <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>{t('communityview.info')}</button>
        </div>
      </div>

      <div className="page-body">
        {/* Community Rules - collapsible section at top of posts */}
        {tab === 'posts' && (
          <>
            <div className="u-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
              <button onClick={() => setRulesExpanded(!rulesExpanded)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
                {ClipboardList({ size: 16 })} Reglas de la comunidad
                <span style={{ marginLeft: 'auto', transform: rulesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  {ChevronDown({ size: 14 })}
                </span>
              </button>
              {rulesExpanded && (
                <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {community.rules?.trim() ? community.rules : 'Esta comunidad no tiene reglas definidas.'}
                </div>
              )}
            </div>

            {community.isMember && (
              <div className="u-card" style={{ padding: 16, marginBottom: 16 }}>
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={t('communityview.composerPlaceholder')}
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', marginBottom: 8 }} />
                <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={!newPost.trim()}>{t('communityview.publish')}</button>
              </div>
            )}
            {posts.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">{Megaphone({ size: 48 })}</div><h3>{t('communityview.emptyTitle')}</h3><p>{t('communityview.emptyDesc')}</p></div>
            ) : posts.map(post => (
              <div key={post.id} className="u-card" style={{ padding: 16, marginBottom: 12 }}>
                {post.isPinned && <div style={{ fontSize: 12, color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>{Pin({ size: 12 })} {t('communityview.pinned')}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div onClick={() => onNavigate(`/user/${post.author?.id}`)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', overflow: 'hidden', fontSize: 14 }}>
                    {post.author?.avatar ? <img src={post.author.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : (post.author?.firstName?.[0] || '?')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14, cursor: 'pointer' }} onClick={() => onNavigate(`/user/${post.author?.id}`)}>{post.author?.firstName} {post.author?.lastName}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {isMod && (
                      <button onClick={() => handlePin(post.id)} style={{ background: post.isPinned ? 'var(--accent-orange)18' : 'none', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, color: post.isPinned ? 'var(--accent-orange)' : 'var(--text-muted)' }} title={post.isPinned ? 'Desfijar' : 'Fijar'}>
                        {Pin({ size: 14 })}
                      </button>
                    )}
                    {(isMod || post.author?.id === user?.id) && (
                      <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }} title="Eliminar">
                        {Trash2({ size: 14 })}
                      </button>
                    )}
                    {community.isMember && post.author?.id !== user?.id && (
                      <button onClick={() => { setReportPostId(post.id); setReportReason('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }} title="Reportar">
                        {AlertTriangle({ size: 14 })}
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                {post.imageUrl && <img src={post.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 300, objectFit: 'cover' }} />}
                <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: post.liked ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ThumbsUp({ size: 14 })} {post.likeCount || 0}
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {MessageSquare({ size: 14 })} {post.commentCount || 0}
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
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)} placeholder={t('communityview.commentPlaceholder')}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }} />
                      <button className="btn btn-primary btn-xs" onClick={() => handleComment(post.id)}>{t('communityview.send')}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'members' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {members.map(m => (
              <div key={m.id} className="u-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div onClick={() => onNavigate(`/user/${m.user?.id}`)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', overflow: 'hidden' }}>
                  {m.user?.avatar ? <img src={m.user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : (m.user?.firstName?.[0] || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.user?.firstName} {m.user?.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{m.user?.username}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: m.role === 'admin' ? 'var(--accent-orange)22' : m.role === 'moderator' ? 'var(--accent-blue)22' : 'var(--bg-secondary)', color: m.role === 'admin' ? 'var(--accent-orange)' : m.role === 'moderator' ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                    {m.role === 'admin' ? <>{Star({ size: 12 })} Admin</> : m.role === 'moderator' ? <>{Shield({ size: 12 })} Mod</> : 'Miembro'}
                  </span>
                  {/* Moderation actions - only for non-self, non-admin targets */}
                  {isAdmin && m.user?.id !== user?.id && m.role !== 'admin' && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {m.role === 'moderator' ? (
                        <button onClick={() => handleChangeRole(m.user.id, 'member')} className="btn btn-secondary btn-xs" style={{ fontSize: 11, padding: '2px 6px' }} title="Quitar moderador">
                          Quitar mod
                        </button>
                      ) : (
                        <button onClick={() => handleChangeRole(m.user.id, 'moderator')} className="btn btn-secondary btn-xs" style={{ fontSize: 11, padding: '2px 6px' }} title="Hacer moderador">
                          {Shield({ size: 11 })} Mod
                        </button>
                      )}
                      <button onClick={() => handleKickMember(m.user.id, `${m.user.firstName} ${m.user.lastName}`)} className="btn btn-xs" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--accent-red)18', color: 'var(--accent-red)', border: 'none', borderRadius: 6, cursor: 'pointer' }} title="Expulsar">
                        Expulsar
                      </button>
                    </div>
                  )}
                  {isMod && !isAdmin && m.user?.id !== user?.id && m.role === 'member' && (
                    <button onClick={() => handleKickMember(m.user.id, `${m.user.firstName} ${m.user.lastName}`)} className="btn btn-xs" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--accent-red)18', color: 'var(--accent-red)', border: 'none', borderRadius: 6, cursor: 'pointer' }} title="Expulsar">
                      Expulsar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'info' && (
          <div className="u-card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>{t('communityview.information')}</h3>
            {community.description && <p style={{ fontSize: 14, lineHeight: 1.6 }}>{community.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.category')}</strong><div>{community.category}</div></div>
              <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.type')}</strong><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{community.type === 'public' ? <>{Globe({ size: 14 })} Publica</> : <>{Lock({ size: 14 })} Privada</>}</div></div>
              {community.university && <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.university')}</strong><div>{community.university}</div></div>}
              <div><strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.created')}</strong><div>{community.createdAt ? new Date(community.createdAt).toLocaleDateString('es') : ''}</div></div>
            </div>
            {community.rules && (
              <div style={{ marginTop: 16 }}>
                <h4>{ClipboardList({ size: 16 })} {t('communityview.rules')}</h4>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, fontSize: 14, whiteSpace: 'pre-wrap' }}>{community.rules}</div>
              </div>
            )}
            {community.creator && (
              <div style={{ marginTop: 16 }}>
                <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('communityview.creator')}</strong>
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

      {/* Admin Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowSettings(false)}>
          <div className="u-card" style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{Settings({ size: 18 })} Configuracion de la comunidad</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>{X({ size: 18 })}</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Nombre</label>
                <input value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Descripcion</label>
                <textarea value={settingsForm.description} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Reglas</label>
                <textarea value={settingsForm.rules} onChange={e => setSettingsForm(f => ({ ...f, rules: e.target.value }))}
                  rows={4} placeholder="Escribe las reglas de tu comunidad..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Tipo</label>
                  <select value={settingsForm.type} onChange={e => setSettingsForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }}>
                    <option value="public">Publica</option>
                    <option value="private">Privada</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Categoria</label>
                  <select value={settingsForm.category} onChange={e => setSettingsForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveSettings} disabled={savingSettings || !settingsForm.name.trim()}>
                  {savingSettings ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportPostId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setReportPostId(null)}>
          <div className="u-card" style={{ width: '100%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{AlertTriangle({ size: 18 })} Reportar publicacion</h3>
              <button onClick={() => setReportPostId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>{X({ size: 18 })}</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>Indica el motivo del reporte. Nuestro equipo lo revisara.</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
              rows={3} placeholder="Describe el problema..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReportPostId(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleReport} disabled={!reportReason.trim()} style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
