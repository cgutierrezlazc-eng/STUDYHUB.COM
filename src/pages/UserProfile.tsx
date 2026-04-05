import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { formatPriceDisplay } from '../utils/currency'

interface Props {
  userId: string
  onNavigate: (path: string) => void
}

export default function UserProfile({ userId, onNavigate }: Props) {
  const { user, updateProfile } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState<'wall' | 'photos' | 'friends' | 'about'>('wall')
  const [friendsList, setFriendsList] = useState<any[]>([])
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [postVisibility, setPostVisibility] = useState<'friends' | 'university' | 'private' | 'specific'>('friends')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [showTutoringModal, setShowTutoringModal] = useState(false)
  const [tutoringSubject, setTutoringSubject] = useState('')
  const [tutoringMessage, setTutoringMessage] = useState('')
  const [tutoringLoading, setTutoringLoading] = useState(false)
  const [tutoringSuccess, setTutoringSuccess] = useState(false)
  const [universityNews, setUniversityNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const postImageRef = useRef<HTMLInputElement>(null)
  const coverPhotoRef = useRef<HTMLInputElement>(null)
  const profilePhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadProfile(); loadPosts(); loadFriends() }, [userId])
  useEffect(() => { if (user && userId === user.id) { loadActivityFeed(); loadUniversityNews() } }, [userId, user])

  const loadUniversityNews = async () => {
    if (localStorage.getItem('conniku_university_news') === 'false') return
    try {
      setNewsLoading(true)
      const data = await api.getUniversityNews()
      setUniversityNews(data.items || [])
    } catch (err) { console.error('Failed to load news:', err) }
    finally { setNewsLoading(false) }
  }

  const loadProfile = async () => {
    try {
      const data = await api.getUserProfile(userId)
      setProfile(data)
    } catch (err: any) { console.error('Failed to load profile:', err) }
    setLoading(false)
  }

  const loadPosts = async () => {
    try { setPosts(await api.getWallPosts(userId)) } catch (err: any) { console.error('Failed to load posts:', err) }
  }

  const loadFriends = async () => {
    try { setFriendsList(await api.getUserFriends(userId)) } catch (err: any) { console.error('Failed to load friends:', err) }
  }

  const loadActivityFeed = async () => {
    setActivityLoading(true)
    try { setActivityFeed(await api.getActivityFeed()) } catch (err: any) { console.error('Failed to load activity feed:', err) }
    setActivityLoading(false)
  }

  const handleSendTutoringRequest = async () => {
    if (!tutoringSubject.trim()) return
    setTutoringLoading(true)
    try {
      await api.sendMentoringRequest({ tutor_id: userId, subject: tutoringSubject, message: tutoringMessage })
      setTutoringSuccess(true)
      setTimeout(() => { setShowTutoringModal(false); setTutoringSuccess(false); setTutoringSubject(''); setTutoringMessage('') }, 2000)
    } catch (err: any) { alert(err.message || 'Error al enviar solicitud') }
    setTutoringLoading(false)
  }

  const handlePost = async () => {
    if (!newPost.trim() && !postImage) return
    try {
      await api.createWallPost(userId, newPost, postImage || undefined, postVisibility)
      setNewPost('')
      setPostImage(null)
      setPostVisibility('friends')
      loadPosts()
    } catch (err: any) {
      alert(err.message || 'Error al publicar')
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const result = await api.toggleLike(postId)
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p, liked: result.liked, likes: result.liked ? p.likes + 1 : p.likes - 1
      } : p))
    } catch (err: any) {
      console.error('Error toggling like:', err)
    }
  }

  const handleComment = async (postId: string) => {
    const text = commentText[postId]
    if (!text?.trim()) return
    try {
      const comment = await api.addComment(postId, text)
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }))
      setCommentText(prev => ({ ...prev, [postId]: '' }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
    } catch (err: any) {
      alert(err.message || 'Error al comentar')
    }
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => { const s = new Set(prev); s.delete(postId); return s })
    } else {
      if (!comments[postId]) {
        try {
          const data = await api.getComments(postId)
          setComments(prev => ({ ...prev, [postId]: data }))
        } catch (err: any) { console.error('Failed to load comments:', err) }
      }
      setExpandedComments(prev => new Set(prev).add(postId))
    }
  }

  const handleFriendAction = async () => {
    if (!profile) return
    if (profile.friendshipStatus === 'none') {
      await api.sendFriendRequest(userId)
    } else if (profile.friendshipStatus === 'pending' && profile.friendshipId) {
      await api.acceptFriendRequest(profile.friendshipId)
    }
    loadProfile()
  }

  const handleUnfriend = async () => {
    if (!confirm('¿Eliminar a este amigo?')) return
    await api.unfriend(userId)
    loadProfile()
  }

  const handleBlock = async () => {
    if (!confirm(`¿Bloquear a ${profile?.firstName}? No podrá ver tu perfil ni contactarte.`)) return
    try {
      await api.blockUser(userId)
      setShowMoreMenu(false)
      onNavigate('/friends')
    } catch (err: any) {
      alert(err.message || 'Error al bloquear usuario')
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    try {
      await api.reportUser(userId, reportReason)
      setShowReportModal(false)
      setReportReason('')
      alert('Reporte enviado. Nuestro equipo lo revisará.')
    } catch (err: any) {
      alert(err.message || 'Error al enviar reporte')
    }
  }

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPostImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      updateProfile({ coverPhoto: reader.result as string } as any)
      setProfile((prev: any) => ({ ...prev, coverPhoto: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      updateProfile({ avatar: reader.result as string } as any)
      setProfile((prev: any) => ({ ...prev, avatar: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deleteWallPost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err: any) {
      alert(err.message || 'Error al eliminar publicación')
    }
  }

  const handleSaveBio = async () => {
    try {
      await updateProfile({ bio: bioText } as any)
      setProfile((prev: any) => ({ ...prev, bio: bioText }))
      setEditingBio(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar biografía')
    }
  }

  if (loading) return <div className="page-body"><div className="loading-dots"><span /><span /><span /></div></div>
  if (!profile) return <div className="page-body"><div className="empty-state"><h3>Usuario no encontrado</h3></div></div>

  const isOwn = profile.isOwnProfile
  const isOtherUser = !isOwn
  const canPost = isOwn || profile.isFriend
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `hace ${days}d`
    return new Date(dateStr).toLocaleDateString('es')
  }

  const allPhotos = posts.filter(p => p.imageUrl).map(p => p.imageUrl)

  return (
    <div className="fb-profile-page">
      {/* LinkedIn-style Header Card */}
      <div className="li-profile-card card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        {/* Cover */}
        <div className="fb-cover-photo" style={{
          backgroundImage: profile.coverPhoto ? `url(${profile.coverPhoto})` : undefined,
          background: profile.coverPhoto ? undefined : 'linear-gradient(135deg, #071e3d 0%, #0a2a5e 40%, #1a1050 100%)',
          height: 200,
        }}>
          {isOwn && (
            <>
              <input ref={coverPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
              <button className="fb-cover-edit-btn" onClick={() => coverPhotoRef.current?.click()}>
                📷 {profile.coverPhoto ? 'Cambiar portada' : 'Agregar foto de portada'}
              </button>
            </>
          )}
        </div>

        {/* Identity section inside card */}
        <div style={{ padding: '0 32px 24px', position: 'relative' }}>
          {/* Avatar overlapping cover */}
          <div className="fb-profile-photo" onClick={() => isOwn && profilePhotoRef.current?.click()} style={{ marginTop: -70, border: '5px solid var(--bg-card)', width: 140, height: 140 }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="" />
            ) : (
              <div className="fb-profile-initials">{initials}</div>
            )}
            {isOwn && (
              <>
                <input ref={profilePhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePhotoChange} />
                <div className="fb-photo-overlay">📷</div>
              </>
            )}
          </div>
          {isOwn && !profile.avatar && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Sube una foto profesional tipo CV
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Sora', var(--font-sans)", letterSpacing: '-0.02em', margin: 0 }}>
                {profile.firstName} {profile.lastName}
              </h1>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
                {profile.career || 'Estudiante'} | Semestre {profile.semester}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {profile.university || 'Sin universidad'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--accent-blue)', marginTop: 6, cursor: 'pointer', fontWeight: 500 }}>
                {profile.friendCount > 0 ? `${profile.friendCount} conexiones` : '0 conexiones'}
              </div>

              {/* Action buttons */}
              {!isOwn && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {profile.isFriend ? (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 24, background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>✓ Amigos</button>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={handleUnfriend}>Eliminar</button>
                    </>
                  ) : profile.friendshipStatus === 'pending' && profile.friendshipId ? (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>
                        ✓ Aceptar Solicitud
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => { api.rejectFriendRequest(profile.friendshipId); loadProfile() }}>
                        Rechazar
                      </button>
                    </>
                  ) : profile.friendshipStatus === 'pending' ? (
                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24, cursor: 'default', opacity: 0.8 }} disabled>
                      ⏳ Invitación Enviada
                    </button>
                  ) : profile.friendshipStatus === 'rejected' ? (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>+ Agregar Amigo</button>
                  ) : (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>+ Agregar Amigo</button>
                  )}
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => onNavigate(`/messages?new=${userId}`)}>💬 Mensaje</button>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowMoreMenu(!showMoreMenu)} style={{ borderRadius: 24, padding: '6px 14px' }}>Más ···</button>
                    {showMoreMenu && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 220, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                        <button onClick={handleBlock} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>🚫 Bloquear usuario</button>
                        <button onClick={() => { setShowReportModal(true); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>🚨 Reportar usuario</button>
                        <button onClick={() => { alert('Usuario silenciado.'); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>🔇 Silenciar publicaciones</button>
                        <div style={{ height: 1, background: 'var(--border)' }} />
                        <button onClick={() => { alert('Reporte enviado.'); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>⚠️ No colabora en grupo</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOwn && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => onNavigate('/friends')}>Encuentra amigos</button>
                </div>
              )}
            </div>

            {/* Right side info */}
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', paddingTop: 4 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile.university || ''}</div>
              <div>Semestre {profile.semester}</div>
              <div style={{ marginTop: 2 }}>@{profile.username} #{String(profile.userNumber || 0).padStart(4, '0')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs — outside header card, LinkedIn style */}
      <div className="fb-profile-tabs" style={{ marginBottom: 16, borderRadius: 'var(--radius)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <button className={`fb-tab ${activeTab === 'wall' ? 'active' : ''}`} onClick={() => setActiveTab('wall')}>
          Publicaciones
        </button>
        <button className={`fb-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          Información
        </button>
        <button className={`fb-tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
          Fotos
        </button>
        <button className={`fb-tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => { setActiveTab('friends'); loadFriends() }}>
          Amigos
        </button>
      </div>

      {/* Tab Content */}
      <div className="fb-profile-content">
        {activeTab === 'wall' && (
          <div className="fb-wall-layout">
            {/* Right sidebar — Academic Info + Friends */}
            <div className="fb-wall-sidebar">
              <div className="card fb-info-card">
                <h4>Información Académica</h4>
                <div className="fb-info-item"><span className="fb-info-icon">🎓</span><span>Estudia <strong>{profile.career}</strong></span></div>
                <div className="fb-info-item"><span className="fb-info-icon">🏛️</span><span>{profile.university}</span></div>
                <div className="fb-info-item"><span className="fb-info-icon">📚</span><span>Semestre {profile.semester}</span></div>
              </div>

              {/* Tutoring card */}
              {profile.offersMentoring && (
                <div className="card fb-info-card">
                  <h4>Ofrece Tutorías</h4>
                  {profile.mentoringServices && profile.mentoringServices.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {profile.mentoringServices.map((s: string) => (
                        <span key={s} style={{ padding: '3px 8px', background: 'rgba(45,98,200,0.1)', color: '#2D62C8', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {s === 'ayudantias' ? 'Ayudantías' : s === 'cursos' ? 'Cursos' : s === 'clases_particulares' ? 'Clases particulares' : s}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.mentoringSubjects && profile.mentoringSubjects.length > 0 && (
                    <div className="fb-info-item" style={{ flexWrap: 'wrap' }}>
                      <span className="fb-info-icon">📖</span>
                      <span style={{ fontSize: 12 }}>{profile.mentoringSubjects.join(', ')}</span>
                    </div>
                  )}
                  <div className="fb-info-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="fb-info-icon">{profile.mentoringPriceType === 'free' ? '🎁' : '💰'}</span>
                      <span style={{ fontWeight: 600, color: profile.mentoringPriceType === 'free' ? '#22c55e' : '#2D62C8' }}>
                        {profile.mentoringPriceType === 'free' ? 'Gratis' : `$${profile.mentoringPricePerHour || 0} USD/hora`}
                      </span>
                    </div>
                    {profile.mentoringPriceType === 'paid' && profile.mentoringPricePerHour && user?.country && (() => {
                      const prices = formatPriceDisplay(profile.mentoringPricePerHour, user.country)
                      return prices.localText ? (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 24 }}>≈ {prices.localText}/hora</span>
                      ) : null
                    })()}
                  </div>
                  {isOtherUser && user && profile.academicStatus !== 'estudiante' && (
                    <button onClick={() => setShowTutoringModal(true)}
                      style={{
                        width: '100%', marginTop: 8, padding: '8px 12px', background: '#2D62C8', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      }}>
                      Solicitar Tutoría
                    </button>
                  )}
                </div>
              )}

              {/* Photos card */}
              {allPhotos.length > 0 && (
                <div className="card fb-info-card">
                  <h4>Fotos</h4>
                  <div className="fb-photos-mini-grid">
                    {allPhotos.slice(0, 9).map((url, i) => (
                      <div key={i} className="fb-photo-thumb" style={{ backgroundImage: `url(${url})` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Friends mini */}
              {profile.friendCount > 0 && (
                <div className="card fb-info-card">
                  <h4>Amigos ({profile.friendCount})</h4>
                  <div className="fb-photos-mini-grid">
                    {friendsList.slice(0, 9).map(f => (
                      <div key={f.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate(`/user/${f.id}`)}>
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', overflow: 'hidden' }}>
                          {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${f.firstName?.[0] || ''}${f.lastName?.[0] || ''}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.firstName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main wall — Presentación + Posts */}
            <div className="fb-wall-main">
              {/* Presentación card — LinkedIn "About" section */}
              <div className="card fb-info-card">
                <h4>Presentación</h4>
                {editingBio ? (
                  <div style={{ marginBottom: 12 }}>
                    <textarea className="form-input" value={bioText} onChange={e => setBioText(e.target.value)} rows={3} placeholder="Escribe algo sobre ti..." maxLength={300} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => setEditingBio(false)}>Cancelar</button>
                      <button className="btn btn-primary btn-xs" onClick={handleSaveBio}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {profile.bio ? (
                      <p className="fb-bio">{profile.bio}</p>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin presentación todavía.</p>
                    )}
                    {isOwn && (
                      <button className="btn btn-secondary btn-sm" style={{ width: '100%', borderRadius: 24, marginTop: 8 }}
                        onClick={() => { setBioText(profile.bio || ''); setEditingBio(true) }}>
                        {profile.bio ? '✏️ Editar bio' : '+ Agregar bio'}
                      </button>
                    )}
                  </>
                )}
              </div>
              {/* Post composer */}
              {canPost && (
                <div className="card fb-post-composer">
                  <div className="fb-composer-header">
                    <div className="fb-composer-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" />
                      ) : (
                        <div className="fb-composer-initials">
                          {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                        </div>
                      )}
                    </div>
                    <textarea
                      className="fb-composer-input"
                      placeholder={isOwn ? '¿Qué estás pensando?' : `Escribe en el muro de ${profile.firstName}...`}
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      rows={2}
                    />
                  </div>
                  {postImage && (
                    <div className="fb-composer-preview">
                      <img src={postImage} alt="Preview" />
                      <button className="fb-remove-image" onClick={() => setPostImage(null)}>✕</button>
                    </div>
                  )}
                  <div className="fb-composer-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input ref={postImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePostImageSelect} />
                    <button className="fb-composer-action-btn" onClick={() => postImageRef.current?.click()}>
                      🖼️ Foto
                    </button>
                    {/* Visibility selector */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        }}>
                        {postVisibility === 'friends' ? '🌐 Amigos' :
                         postVisibility === 'university' ? '🎓 Mi universidad' :
                         postVisibility === 'private' ? '🔒 Solo yo' : '👥 Específicos'}
                        <span style={{ fontSize: 10, marginLeft: 2 }}>▼</span>
                      </button>
                      {showVisibilityMenu && (
                        <div style={{
                          position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: 4, minWidth: 200, zIndex: 100,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        }}>
                          {[
                            { value: 'friends', icon: '🌐', label: 'Todos mis amigos', desc: 'Visible para todos tus contactos' },
                            { value: 'university', icon: '🎓', label: 'Mi universidad', desc: 'Solo amigos de tu universidad' },
                            { value: 'private', icon: '🔒', label: 'Solo mi muro', desc: 'Solo visible en tu perfil' },
                          ].map(opt => (
                            <button key={opt.value} type="button"
                              onClick={() => { setPostVisibility(opt.value as any); setShowVisibilityMenu(false) }}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                                padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                                background: postVisibility === opt.value ? 'rgba(45,98,200,0.08)' : 'transparent',
                                color: 'var(--text-primary)', textAlign: 'left',
                              }}>
                              <span style={{ fontSize: 16 }}>{opt.icon}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                              </div>
                              {postVisibility === opt.value && <span style={{ marginLeft: 'auto', color: '#2D62C8', fontWeight: 700 }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={handlePost}
                      disabled={!newPost.trim() && !postImage}
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              )}

              {/* Actividad Reciente - mixed feed for own profile */}
              {isOwn && activityFeed.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>Actividad Reciente</h3>
                  {activityLoading ? (
                    <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                      <div className="loading-dots"><span /><span /><span /></div>
                    </div>
                  ) : (
                    activityFeed.slice(0, 5).map(item => {
                      if (item.type === 'activity') {
                        return (
                          <div key={item.id} className="card" style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 20 }}>
                              {item.activityType === 'quiz_generated' ? '📝' :
                               item.activityType === 'guide_generated' ? '📖' :
                               item.activityType === 'document_uploaded' ? '📄' :
                               item.activityType === 'friend_added' ? '🤝' : '⚡'}
                            </span>
                            <div>
                              <span style={{ fontSize: 14 }}>{item.content}</span>
                              <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(item.createdAt)}</small>
                            </div>
                          </div>
                        )
                      }
                      // type === "post" - friend's post
                      const isFriendPost = item.author?.id !== user?.id
                      const isOnOtherWall = item.wallOwner && item.author && item.wallOwner.id !== item.author.id
                      return (
                        <div key={item.id} className="card fb-post" style={{ marginBottom: 8 }}>
                          <div className="fb-post-header">
                            <div className="fb-post-author" onClick={() => item.author && onNavigate(`/user/${item.author.id}`)}>
                              {item.author?.avatar ? (
                                <img src={item.author.avatar} alt="" className="fb-post-avatar" />
                              ) : (
                                <div className="fb-post-avatar-initials">
                                  {(item.author?.firstName?.[0] || '') + (item.author?.lastName?.[0] || '')}
                                </div>
                              )}
                              <div>
                                <strong>{item.author?.firstName} {item.author?.lastName}</strong>
                                {isOnOtherWall && (
                                  <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                                    {' '}public\u00f3 en el muro de{' '}
                                    <strong
                                      style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
                                      onClick={e => { e.stopPropagation(); onNavigate(`/user/${item.wallOwner.id}`) }}
                                    >
                                      {item.wallOwner.firstName} {item.wallOwner.lastName}
                                    </strong>
                                  </span>
                                )}
                                <span className="fb-post-time">{timeAgo(item.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <p className="fb-post-content">{item.content}</p>
                          {item.imageUrl && (
                            <div className="fb-post-image"><img src={item.imageUrl} alt="" /></div>
                          )}
                          <div className="fb-post-stats">
                            {item.likes > 0 && <span>&#10084;&#65039; {item.likes}</span>}
                            {item.commentCount > 0 && (
                              <span className="fb-comment-count" onClick={() => toggleComments(item.id)}>
                                {item.commentCount} comentario{item.commentCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="fb-post-actions">
                            <button
                              className={`fb-action-btn ${item.liked ? 'liked' : ''}`}
                              onClick={() => handleLike(item.id)}
                            >
                              {item.liked ? '❤️' : '🤍'} Me gusta
                            </button>
                            <button className="fb-action-btn" onClick={() => toggleComments(item.id)}>
                              💬 Comentar
                            </button>
                          </div>
                          {expandedComments.has(item.id) && (
                            <div className="fb-comments-section">
                              {(comments[item.id] || []).map(c => (
                                <div key={c.id} className="fb-comment">
                                  <div className="fb-comment-avatar" onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                                    {c.author?.avatar ? (
                                      <img src={c.author.avatar} alt="" />
                                    ) : (
                                      <div className="fb-comment-avatar-initials">
                                        {(c.author?.firstName?.[0] || '')}
                                      </div>
                                    )}
                                  </div>
                                  <div className="fb-comment-body">
                                    <strong onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                                      {c.author?.firstName} {c.author?.lastName}
                                    </strong>
                                    <span>{c.content}</span>
                                    <small>{timeAgo(c.createdAt)}</small>
                                  </div>
                                </div>
                              ))}
                              <div className="fb-comment-input-row">
                                <input
                                  placeholder="Escribe un comentario..."
                                  value={commentText[item.id] || ''}
                                  onChange={e => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && handleComment(item.id)}
                                />
                                <button className="btn btn-primary btn-xs" onClick={() => handleComment(item.id)}>
                                  Enviar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* University News Section - only on own profile */}
              {isOwn && localStorage.getItem('conniku_university_news') !== 'false' && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card, #1E252A)', border: '1px solid var(--border, #2a3038)' }}>
                  {/* Header */}
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #2a3038)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D62C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #F5F7F8)' }}>
                        Noticias de {profile.university || 'tu universidad'}
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

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                  <p style={{ color: 'var(--text-muted)' }}>No hay publicaciones todavía</p>
                  {isOwn && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Comparte algo con tus compañeros</p>}
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="card fb-post">
                    <div className="fb-post-header">
                      <div className="fb-post-author" onClick={() => post.author && onNavigate(`/user/${post.author.id}`)}>
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt="" className="fb-post-avatar" />
                        ) : (
                          <div className="fb-post-avatar-initials">
                            {(post.author?.firstName?.[0] || '') + (post.author?.lastName?.[0] || '')}
                          </div>
                        )}
                        <div>
                          <strong>{post.author?.firstName} {post.author?.lastName}</strong>
                          <span className="fb-post-time">{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      {(post.author?.id === user?.id || isOwn) && (
                        <button className="fb-post-menu" onClick={() => handleDeletePost(post.id)} title="Eliminar">
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="fb-post-content">{post.content}</p>

                    {post.imageUrl && (
                      <div className="fb-post-image">
                        <img src={post.imageUrl} alt="" />
                      </div>
                    )}

                    <div className="fb-post-stats">
                      {post.likes > 0 && <span>❤️ {post.likes}</span>}
                      {post.commentCount > 0 && (
                        <span className="fb-comment-count" onClick={() => toggleComments(post.id)}>
                          {post.commentCount} comentario{post.commentCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="fb-post-actions">
                      <button
                        className={`fb-action-btn ${post.liked ? 'liked' : ''}`}
                        onClick={() => handleLike(post.id)}
                      >
                        {post.liked ? '❤️' : '🤍'} Me gusta
                      </button>
                      <button className="fb-action-btn" onClick={() => toggleComments(post.id)}>
                        💬 Comentar
                      </button>
                    </div>

                    {expandedComments.has(post.id) && (
                      <div className="fb-comments-section">
                        {(comments[post.id] || []).map(c => (
                          <div key={c.id} className="fb-comment">
                            <div className="fb-comment-avatar" onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                              {c.author?.avatar ? (
                                <img src={c.author.avatar} alt="" />
                              ) : (
                                <div className="fb-comment-avatar-initials">
                                  {(c.author?.firstName?.[0] || '')}
                                </div>
                              )}
                            </div>
                            <div className="fb-comment-body">
                              <strong onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                                {c.author?.firstName} {c.author?.lastName}
                              </strong>
                              <span>{c.content}</span>
                              <small>{timeAgo(c.createdAt)}</small>
                            </div>
                          </div>
                        ))}
                        <div className="fb-comment-input-row">
                          <input
                            placeholder="Escribe un comentario..."
                            value={commentText[post.id] || ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                          />
                          <button className="btn btn-primary btn-xs" onClick={() => handleComment(post.id)}>
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="fb-about-section">
            <div className="card" style={{ padding: 24, maxWidth: 600 }}>
              <h3 style={{ marginTop: 0 }}>Información Personal</h3>
              <div className="fb-about-grid">
                <div className="fb-about-item">
                  <span className="fb-about-label">Nombre completo</span>
                  <span>{profile.firstName} {profile.lastName}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Usuario</span>
                  <span>@{profile.username} #{String(profile.userNumber || 0).padStart(4, '0')}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Carrera</span>
                  <span>{profile.career || 'No especificada'}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Universidad</span>
                  <span>{profile.university || 'No especificada'}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Semestre</span>
                  <span>Semestre {profile.semester}</span>
                </div>
                {profile.bio && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Bio</span>
                    <span>{profile.bio}</span>
                  </div>
                )}
                <div className="fb-about-item">
                  <span className="fb-about-label">Amigos</span>
                  <span>{profile.friendCount} conexiones</span>
                </div>
                {profile.academicStatus && profile.academicStatus !== 'estudiante' && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Estado académico</span>
                    <span style={{ textTransform: 'capitalize' }}>{profile.academicStatus}</span>
                  </div>
                )}
                {profile.professionalTitle && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Título</span>
                    <span>{profile.professionalTitle}</span>
                  </div>
                )}
              </div>

              {/* Tutoring section in about */}
              {profile.offersMentoring && (
                <>
                  <h3 style={{ marginTop: 24 }}>Servicios de Tutoría</h3>
                  <div className="fb-about-grid">
                    {profile.mentoringServices && profile.mentoringServices.length > 0 && (
                      <div className="fb-about-item">
                        <span className="fb-about-label">Servicios</span>
                        <span>{profile.mentoringServices.map((s: string) => s === 'ayudantias' ? 'Ayudantías' : s === 'cursos' ? 'Cursos' : s === 'clases_particulares' ? 'Clases particulares' : s).join(', ')}</span>
                      </div>
                    )}
                    {profile.mentoringSubjects && profile.mentoringSubjects.length > 0 && (
                      <div className="fb-about-item">
                        <span className="fb-about-label">Materias</span>
                        <span>{profile.mentoringSubjects.join(', ')}</span>
                      </div>
                    )}
                    {profile.mentoringDescription && (
                      <div className="fb-about-item">
                        <span className="fb-about-label">Descripción</span>
                        <span>{profile.mentoringDescription}</span>
                      </div>
                    )}
                    <div className="fb-about-item">
                      <span className="fb-about-label">Precio</span>
                      <div>
                        <span style={{ fontWeight: 600, color: profile.mentoringPriceType === 'free' ? '#22c55e' : '#2D62C8' }}>
                          {profile.mentoringPriceType === 'free' ? 'Gratis (voluntariado)' : `$${profile.mentoringPricePerHour || 0} USD por hora`}
                        </span>
                        {profile.mentoringPriceType === 'paid' && profile.mentoringPricePerHour && user?.country && (() => {
                          const prices = formatPriceDisplay(profile.mentoringPricePerHour, user.country)
                          return prices.localText ? (
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>≈ {prices.localText} (conversión aprox.)</span>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>
                  {isOtherUser && user && (
                    <button onClick={() => setShowTutoringModal(true)}
                      style={{
                        marginTop: 12, padding: '10px 20px', background: '#2D62C8', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                      }}>
                      Solicitar Tutoría
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="fb-photos-section">
            <h3>Fotos</h3>
            {allPhotos.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p style={{ color: 'var(--text-muted)' }}>No hay fotos todavía</p>
              </div>
            ) : (
              <div className="fb-photos-grid">
                {allPhotos.map((url, i) => (
                  <div key={i} className="fb-photo-item">
                    <img src={url} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="fb-friends-section">
            <h3>Amigos ({profile.friendCount})</h3>
            <div className="friends-grid">
              {friendsList.map(friend => (
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
                  </div>
                </div>
              ))}
              {friendsList.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 40, gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No hay amigos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tutoring Request Modal */}
      {showTutoringModal && (
        <div className="modal-overlay" onClick={() => setShowTutoringModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            {tutoringSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ margin: '0 0 8px' }}>Solicitud enviada</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {profile?.firstName} recibirá tu solicitud y podrá aceptarla o rechazarla.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 4px' }}>Solicitar tutoría a {profile?.firstName} {profile?.lastName}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {profile?.mentoringPriceType === 'free'
                    ? 'Este tutor ofrece sus servicios de forma gratuita.'
                    : (() => {
                        const priceText = `Precio: $${profile?.mentoringPricePerHour || 0} USD/hora`
                        if (user?.country && profile?.mentoringPricePerHour) {
                          const prices = formatPriceDisplay(profile.mentoringPricePerHour, user.country)
                          return prices.localText ? `${priceText} (≈ ${prices.localText})` : priceText
                        }
                        return priceText
                      })()
                  }
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Materia o tema *</label>
                  {profile?.mentoringSubjects && profile.mentoringSubjects.length > 0 ? (
                    <select value={tutoringSubject} onChange={e => setTutoringSubject(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">Seleccionar materia</option>
                      {profile.mentoringSubjects.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__other">Otro tema</option>
                    </select>
                  ) : (
                    <input
                      placeholder="Ej: Cálculo, Física, etc."
                      value={tutoringSubject}
                      onChange={e => setTutoringSubject(e.target.value)}
                      className="form-input"
                    />
                  )}
                  {tutoringSubject === '__other' && (
                    <input
                      placeholder="Especifica el tema"
                      value=""
                      onChange={e => setTutoringSubject(e.target.value)}
                      className="form-input"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mensaje (opcional)</label>
                  <textarea
                    placeholder="Describe brevemente en qué necesitas ayuda..."
                    value={tutoringMessage}
                    onChange={e => setTutoringMessage(e.target.value)}
                    rows={3}
                    className="form-input"
                  />
                </div>
                <div style={{ background: 'rgba(45,98,200,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, border: '1px solid rgba(45,98,200,0.15)' }}>
                  <p style={{ fontSize: 11, color: '#2D62C8', margin: 0 }}>
                    Una vez aceptada tu solicitud, podrán coordinar todo a través del chat de Conniku.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowTutoringModal(false)}>Cancelar</button>
                  <button
                    style={{ padding: '8px 20px', background: '#2D62C8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: tutoringLoading || !tutoringSubject.trim() ? 0.6 : 1 }}
                    onClick={handleSendTutoringRequest}
                    disabled={tutoringLoading || !tutoringSubject.trim()}>
                    {tutoringLoading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Reportar a {profile?.firstName} {profile?.lastName}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Describe el motivo de tu reporte. Nuestro equipo lo revisará.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {['Contenido inapropiado', 'Acoso o bullying', 'Spam o publicidad', 'Cuenta falsa', 'No colabora en grupos de estudio'].map(reason => (
                <button key={reason} onClick={() => setReportReason(reason)}
                  style={{
                    padding: '10px 14px', background: reportReason === reason ? 'var(--accent-blue)' : 'var(--bg-primary)',
                    border: '1px solid var(--border-color)', borderRadius: 8, color: reportReason === reason ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  }}>
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Detalles adicionales (opcional)..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(false)}>Cancelar</button>
              <button className="btn btn-danger btn-sm" onClick={handleReport} disabled={!reportReason.trim()}>Enviar Reporte</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
