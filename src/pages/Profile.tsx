import React, { useState, useRef, useMemo } from 'react'
import { useAuth } from '../services/auth'
import { useI18n, LANGUAGES } from '../services/i18n'
import { api } from '../services/api'
import { LanguageSkill } from '../types'
import MilestonePopup from '../components/MilestonePopup'
import CoverPhotoModal, { getCoverStyle } from '../components/CoverPhotoModal'
import { searchUniversities, University, getInstitutionCode } from '../data/universities'
import { Bell, AlertTriangle, MessageSquare, CheckCircle, Hourglass, GraduationCap, Users, Pencil, Lock, Settings, ClipboardList } from '../components/Icons'

type Section = 'profile' | 'academic' | 'appearance' | 'notifications' | 'security' | 'email' | 'cv' | 'projects' | 'publications'

interface ProfileProps { onNavigate?: (path: string) => void }

export default function Profile({ onNavigate }: ProfileProps = {}) {
  const { user, updateProfile, logout } = useAuth()
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [currentTheme, setCurrentTheme] = useState<string>(localStorage.getItem('conniku_theme') || 'equilibrado')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saved, setSaved] = useState(false)
  const [milestonePopup, setMilestonePopup] = useState<any>(null)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverMsg, setCoverMsg] = useState('')
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [form, setForm] = useState({ ...user! })
  const [cvVisibility, setCvVisibility] = useState<'public' | 'recruiters' | 'private'>((user as any).cvVisibility || 'private')
  const [cvData, setCvData] = useState({
    headline: (user as any).cvHeadline || '',
    summary: (user as any).cvSummary || '',
    experience: (user as any).cvExperience || '',
    skills: (user as any).cvSkills || '',
    certifications: (user as any).cvCertifications || '',
    languages: (user as any).cvLanguages || '',
    portfolio: (user as any).cvPortfolio || '',
  })
  const [cvUploading, setCvUploading] = useState(false)
  const [cvUploadMsg, setCvUploadMsg] = useState('')
  const cvFileRef = useRef<HTMLInputElement>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [bioGenerating, setBioGenerating] = useState(false)
  const [bioPreview, setBioPreview] = useState<string | null>(null)
  const [bioAuto, setBioAuto] = useState<boolean>((user as any).bioAuto || false)
  const [bioTogglingAuto, setBioTogglingAuto] = useState(false)

  const [projects, setProjects] = useState<any[]>([])
  const [publications, setPublications] = useState<any[]>([])
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [publicationsLoaded, setPublicationsLoaded] = useState(false)
  const [newProj, setNewProj] = useState({ title: '', description: '', projectUrl: '', techStack: '', category: 'personal', year: new Date().getFullYear() })
  const [newPub, setNewPub] = useState({ type: 'paper', title: '', description: '', year: new Date().getFullYear(), url: '', institution: '' })

  // Institution picker state (for university edit)
  const [uniSearch, setUniSearch] = useState('')
  const [showUniDropdown, setShowUniDropdown] = useState(false)
  const uniResults = useMemo(() => {
    if (!uniSearch || uniSearch.length < 2) return []
    return searchUniversities(uniSearch, (user as any)?.country || '').slice(0, 15)
  }, [uniSearch])

  if (!user) return null

  const handleCvUpload = async (file: File) => {
    setCvUploading(true)
    setCvUploadMsg('')
    try {
      const res = await api.uploadCV(file)
      if (res.draft) {
        setCvData({
          headline: res.draft.headline || cvData.headline,
          summary: res.draft.summary || cvData.summary,
          experience: res.draft.experience || cvData.experience,
          skills: res.draft.skills || cvData.skills,
          certifications: res.draft.certifications || cvData.certifications,
          languages: res.draft.languages || cvData.languages,
          portfolio: res.draft.portfolio || cvData.portfolio,
        })
      }
      setCvUploadMsg(res.message || t('profile.cvProcessed'))
      // Auto-generate bio after CV upload if user has bio-auto enabled, or show preview
      try {
        const bioRes = await api.generateBio()
        if (bioRes.bio) {
          if (bioAuto) {
            // Auto-accept and save via profile update
            await updateProfile({ bio: bioRes.bio })
          } else {
            // Show preview so user can decide
            setBioPreview(bioRes.bio)
          }
        }
      } catch (_) {}
    } catch (err: any) {
      setCvUploadMsg(err.message || t('profile.cvUploadError'))
    } finally {
      setCvUploading(false)
    }
  }

  const handleGenerateBio = async () => {
    setBioGenerating(true)
    setBioPreview(null)
    try {
      const res = await api.generateBio()
      if (res.bio) setBioPreview(res.bio)
    } catch (err: any) {
      setBioPreview(null)
    } finally {
      setBioGenerating(false)
    }
  }

  const handleAcceptBio = () => {
    if (!bioPreview) return
    update('bio', bioPreview)
    setBioPreview(null)
  }

  const handleToggleBioAuto = async (enabled: boolean) => {
    setBioTogglingAuto(true)
    try {
      await api.toggleBioAuto(enabled)
      setBioAuto(enabled)
    } catch (_) {}
    finally { setBioTogglingAuto(false) }
  }

  const update = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const result: any = await updateProfile(form)
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Check if profile update triggered any milestones
    if (result?.milestones?.length > 0) {
      const m = result.milestones[0]
      const milestoneMap: Record<string, { title: string; icon: string }> = {
        university_change: { title: t('profile.milestoneNewUni'), icon: '🎓' },
        academic_status: { title: t('profile.milestoneStatus'), icon: '📜' },
        tutoring_started: { title: t('profile.milestoneTutor'), icon: '👨‍🏫' },
      }
      const info = milestoneMap[m.type]
      if (info) {
        setMilestonePopup({ type: m.type, title: info.title, description: m.university || m.status || t('profile.milestoneTutorDesc'), icon: info.icon })
      }
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      update('avatar', reader.result as string)
      updateProfile({ avatar: reader.result as string })
    }
    reader.readAsDataURL(file)
  }


  const handleChangeUsername = async () => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameError(t('err.usernameShort'))
      return
    }
    try {
      await api.changeUsername(newUsername)
      setEditingUsername(false)
      setUsernameError('')
      window.location.reload()
    } catch (err: any) {
      setUsernameError(err.message)
    }
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  const SKILL_OPTIONS: { value: LanguageSkill; label: string; desc: string }[] = [
    { value: 'beginner', label: t('skill.beginner'), desc: t('skill.beginnerDesc') },
    { value: 'intermediate', label: t('skill.intermediate'), desc: t('skill.intermediateDesc') },
    { value: 'advanced', label: t('skill.advanced'), desc: t('skill.advancedDesc') },
  ]

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: t('profile.sectionProfile'), icon: Users({ size: 16 }) },
    { id: 'academic', label: t('profile.sectionAcademic'), icon: GraduationCap({ size: 16 }) },
    { id: 'cv', label: t('profile.sectionCV'), icon: ClipboardList({ size: 16 }) },
    { id: 'projects' as Section, label: 'Proyectos', icon: <span>🗂</span> },
    { id: 'publications' as Section, label: 'Publicaciones', icon: <span>📚</span> },
    { id: 'appearance', label: t('profile.sectionAppearance'), icon: Settings({ size: 16 }) },
    { id: 'notifications', label: t('profile.sectionNotifications'), icon: Bell({ size: 16 }) },
    { id: 'security', label: t('profile.sectionSecurity'), icon: Lock({ size: 16 }) },
    ...(user.role === 'owner' ? [{ id: 'email' as Section, label: t('profile.sectionEmail'), icon: CheckCircle({ size: 16 }) }] : []),
  ]

  const ToggleRow = ({ label, desc, defaultOn = true }: { label: string; desc: string; defaultOn?: boolean }) => (
    <label className="pf-toggle-row">
      <div>
        <div className="pf-toggle-label">{label}</div>
        <div className="pf-toggle-desc">{desc}</div>
      </div>
      <input type="checkbox" defaultChecked={defaultOn} className="pf-checkbox" />
    </label>
  )

  return (
    <>
      <div className="page-header page-enter">
        <h2>{t('profile.settings')}</h2>
        <p>{t('profile.settingsDesc')}</p>
      </div>
      <div className="page-body">
        {saved && <div className="profile-toast">{t('profile.saved')}</div>}

        {/* Header Card — Avatar + Identity */}
        <div className="pf-header-card">
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className="pf-header-avatar" onClick={() => fileInputRef.current?.click()}>
              {user.avatar ? (
                <img src={user.avatar} alt="" className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-initials">{initials || '?'}</div>
              )}
              <div className="pf-avatar-edit">{t('profile.editAvatar')}</div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 120, lineHeight: 1.3 }}>
              {t('profile.avatarHint')}
            </span>
          </div>
          <div className="pf-header-info">
            <h2 className="pf-header-name">{user.firstName} {user.lastName}</h2>
            <div className="pf-header-meta">
              {editingUsername ? (
                <div className="pf-username-edit">
                  <span>@</span>
                  <input value={newUsername} onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} placeholder={user.username} />
                  <button className="btn btn-primary btn-xs" onClick={handleChangeUsername}>{t('profile.saveBtn')}</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => setEditingUsername(false)}>{t('profile.cancelBtn')}</button>
                  {usernameError && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{usernameError}</span>}
                </div>
              ) : (
                <span className="pf-username" onClick={() => { setNewUsername(user.username); setEditingUsername(true) }}>
                  @{user.username} <span className="pf-user-number">#{String(user.userNumber || 0).padStart(4, '0')}</span>
                </span>
              )}
              <span className="pf-header-dot">·</span>
              <span>{user.career || t('profile.student')}</span>
              <span className="pf-header-dot">·</span>
              <span>{user.university || t('profile.noUni')}</span>
            </div>
            <div className="pf-header-badges">
              {user.emailVerified ? (
                <span className="pf-badge pf-badge-green">✓ {t('profile.emailVerified')}</span>
              ) : (
                <span className="pf-badge pf-badge-orange">{AlertTriangle({ size: 14 })} {t('profile.emailNotVerified')}</span>
              )}
              {user.role === 'owner' && <span className="pf-badge pf-badge-blue">Owner / CEO</span>}
              {user.isAdmin && user.role !== 'owner' && <span className="pf-badge pf-badge-purple">{t('profile.admin')}</span>}
              <span className="pf-badge">{t('reg.semester')} {user.semester}</span>
            </div>
          </div>
        </div>

        {/* Settings Layout — Sidebar + Content */}
        <div className="pf-settings-layout">
          {/* Navigation Sidebar */}
          <nav className="pf-settings-nav">
            {SECTIONS.map(s => (
              <button key={s.id} className={`pf-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}>
                <span className="pf-nav-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
            <div className="pf-nav-divider" />
            <button className="pf-nav-item pf-nav-danger" onClick={logout}>
              {t('profile.logout')}
            </button>
          </nav>

          {/* Content Panel */}
          <div className="pf-settings-content">

            {/* ─── Mi Perfil ─── */}
            {activeSection === 'profile' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>{t('profile.personalInfo')}</h3>
                  {!isEditing ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ ...user }); setIsEditing(true) }}>{t('profile.editBtn')}</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave}>{t('profile.saveChanges')}</button>
                    </div>
                  )}
                </div>
                <div className="pf-fields-grid">
                  <div className="pf-field">
                    <label>{t('reg.name')}</label>
                    {isEditing ? <input className="form-input" value={form.firstName} onChange={e => update('firstName', e.target.value)} /> : <p>{user.firstName || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.lastName')}</label>
                    {isEditing ? <input className="form-input" value={form.lastName} onChange={e => update('lastName', e.target.value)} /> : <p>{user.lastName || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('auth.email')}</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.phone')}</label>
                    {isEditing ? <input className="form-input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} /> : <p>{user.phone || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.birthDate')}</label>
                    <p>{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="pf-field">
                    <label>{t('profile.method')}</label>
                    <p>{user.provider === 'google' ? 'Google' : t('profile.methodEmail')}</p>
                  </div>
                </div>

                <div className="pf-divider" />

                {/* ── Bio section ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>{t('profile.bio')}</h3>
                  {!isEditing && (
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => { setForm({ ...user }); setIsEditing(true) }}
                      style={{ fontSize: 12 }}
                    >
                      {t('profile.editBtn')}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={form.bio || ''}
                      onChange={e => update('bio', e.target.value)}
                      placeholder={t('profile.bioPlaceholder')}
                    />

                    {/* Generate bio button */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleGenerateBio}
                      disabled={bioGenerating}
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {bioGenerating ? (
                        <>
                          <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          Generando...
                        </>
                      ) : (
                        <>✨ Generar bio con mi perfil</>
                      )}
                    </button>

                    {/* Preview card */}
                    {bioPreview && (
                      <div style={{
                        background: 'rgba(45,98,200,0.06)',
                        border: '1px solid rgba(45,98,200,0.2)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Vista previa — bio generada por Conniku
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{bioPreview}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={handleAcceptBio}
                          >
                            ✓ Usar esta bio
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => setBioPreview(null)}
                          >
                            Mantener la mía
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Auto-update toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                      background: 'var(--bg-secondary)', borderRadius: 10, cursor: 'pointer', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          Actualizar bio automáticamente con mis logros
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Conniku actualizará tu bio cada vez que alcances un nuevo hito académico
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="pf-checkbox"
                        checked={bioAuto}
                        disabled={bioTogglingAuto}
                        onChange={e => handleToggleBioAuto(e.target.checked)}
                      />
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                      {user.bio || t('profile.bioEmpty')}
                    </p>
                    {bioAuto && (
                      <span style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        ✦ Bio se actualiza automáticamente con tus logros
                      </span>
                    )}
                  </div>
                )}

                <div className="pf-footer-meta">
                  <small>{t('profile.accountCreated')}: {new Date(user.createdAt).toLocaleDateString()}</small>
                  <small>{t('profile.lastAccess')}: {new Date(user.lastLogin).toLocaleDateString()}</small>
                </div>
              </div>
            )}

            {/* ─── Académico ─── */}
            {activeSection === 'academic' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>{t('profile.academicInfo')}</h3>
                  {!isEditing ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ ...user }); setIsEditing(true) }}>Editar</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave}>Guardar</button>
                    </div>
                  )}
                </div>
                <div className="pf-fields-grid">
                  <div className="pf-field" style={{ position: 'relative' }}>
                    <label>{t('reg.university')}</label>
                    {isEditing ? (
                      <div style={{ position: 'relative' }}>
                        {form.university ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                            background: 'rgba(45,98,200,0.06)', border: '1px solid rgba(45,98,200,0.2)',
                            borderRadius: 8, fontSize: 13 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{form.university}</div>
                            </div>
                            <button type="button" onClick={() => { update('university', ''); setUniSearch('') }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, padding: '2px 4px' }}>✕</button>
                          </div>
                        ) : (
                          <>
                            <input className="form-input" placeholder="Buscar institución..."
                              value={uniSearch}
                              onChange={e => { setUniSearch(e.target.value); setShowUniDropdown(true) }}
                              onFocus={() => setShowUniDropdown(true)} />
                            {showUniDropdown && uniSearch.length >= 2 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: 10, maxHeight: 240, overflowY: 'auto',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.18)', marginTop: 4 }}>
                                {uniResults.length === 0 ? (
                                  <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>Sin resultados</div>
                                ) : uniResults.map(uni => (
                                  <button key={uni.id} type="button"
                                    onClick={() => {
                                      const code = getInstitutionCode(uni)
                                      const currentPrefix = user.username?.match(/^[A-Z]{3}_/)?.[0] || ''
                                      const currentSuffix = currentPrefix ? user.username!.slice(currentPrefix.length) : user.username || ''
                                      const newUsername = code + '_' + currentSuffix
                                      update('university', uni.name)
                                      update('username', newUsername)
                                      setUniSearch('')
                                      setShowUniDropdown(false)
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                      padding: '8px 14px', border: 'none', borderBottom: '1px solid var(--border)',
                                      background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                      color: 'var(--text-primary)' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</div>
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ background: 'rgba(45,98,200,0.1)', color: 'var(--accent)', padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>
                                          {getInstitutionCode(uni)}
                                        </span>
                                        <span>{uni.type === 'cft' ? 'CFT' : uni.type === 'instituto' ? 'IP' : 'Universidad'}</span>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        <small style={{ color: 'var(--accent)', fontSize: 11, marginTop: 4, display: 'block' }}>
                          Al cambiar institución, tu prefijo de usuario se actualizará automáticamente
                        </small>
                      </div>
                    ) : <p>{user.university || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.career')}</label>
                    {isEditing ? <input className="form-input" value={form.career} onChange={e => update('career', e.target.value)} /> : <p>{user.career || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('profile.studyStart')}</label>
                    {isEditing ? (
                      <input type="date" className="form-input" value={form.studyStartDate || ''} onChange={e => update('studyStartDate', e.target.value)} max={new Date().toISOString().split('T')[0]} min="1950-01-01" />
                    ) : (
                      <p>{user.studyStartDate ? `${user.studyStartDate} (${(user.studyDays || 0).toLocaleString()} días)` : '—'}</p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.semester')}</label>
                    {isEditing ? (
                      <select className="form-input" value={form.semester} onChange={e => update('semester', parseInt(e.target.value))}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(s => <option key={s} value={s}>{t('reg.semester')} {s}</option>)}
                      </select>
                    ) : <p>{t('reg.semester')} {user.semester}</p>}
                  </div>
                </div>

                <div className="pf-divider" />
                <h3>{t('profile.academicStatus')}</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {([
                    { value: 'estudiante', label: t('profile.statusStudent') },
                    { value: 'egresado', label: t('profile.statusGraduate') },
                    { value: 'titulado', label: t('profile.statusTitled') },
                  ] as const).map(opt => (
                    <button key={opt.value}
                      className={`pf-skill-btn ${((user as any).academicStatus || 'estudiante') === opt.value ? 'active' : ''}`}
                      onClick={() => {
                        const updates: any = { academicStatus: opt.value }
                        if (opt.value === 'estudiante') {
                          updates.offersMentoring = false
                          updates.mentoringServices = []
                          updates.professionalTitle = ''
                        }
                        updateProfile(updates)
                      }}>
                      <strong>{opt.label}</strong>
                    </button>
                  ))}
                </div>

                {/* Professional Title for titulado */}
                {((user as any).academicStatus === 'titulado') && (
                  <div className="pf-field" style={{ marginBottom: 16 }}>
                    <label>{t('profile.professionalTitle')}</label>
                    {isEditing ? (
                      <input className="form-input" value={(form as any).professionalTitle || ''} placeholder={t('profile.professionalTitlePlaceholder')}
                        onChange={e => update('professionalTitle' as any, e.target.value)} />
                    ) : <p>{(user as any).professionalTitle || '—'}</p>}
                  </div>
                )}

                {/* Mentoring for titulado/egresado */}
                {((user as any).academicStatus === 'titulado' || (user as any).academicStatus === 'egresado') && (
                  <div style={{ background: 'var(--bg-tertiary, #f0f4f8)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>{Users({ size: 14 })} {t('profile.helpStudents')}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                      {t('profile.helpStudentsDesc')}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { id: 'ayudantias', label: t('profile.mentorAssistance') },
                        { id: 'cursos', label: t('profile.mentorCourses') },
                        { id: 'clases_particulares', label: t('profile.mentorPrivate') },
                      ].map(svc => {
                        const services: string[] = (user as any).mentoringServices || []
                        const selected = services.includes(svc.id)
                        return (
                          <button key={svc.id}
                            style={{
                              flex: 1, minWidth: 100, padding: '10px 8px', borderRadius: 10,
                              border: selected ? '2px solid #2D62C8' : '1px solid var(--border)',
                              background: selected ? 'rgba(45,98,200,0.08)' : 'var(--bg-secondary)',
                              color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}
                            onClick={() => {
                              const updated = selected ? services.filter(s => s !== svc.id) : [...services, svc.id]
                              updateProfile({ mentoringServices: updated, offersMentoring: updated.length > 0 } as any)
                            }}>
                            {svc.label}
                          </button>
                        )
                      })}
                    </div>
                    {((user as any).mentoringServices || []).length > 0 && (
                      <div style={{ marginTop: 12, background: 'rgba(45,138,86,0.08)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(45,138,86,0.2)' }}>
                        <p style={{ fontSize: 12, color: '#2D8A56', margin: 0 }}>
                          {MessageSquare({ size: 14 })} {t('profile.mentorChatNote')} <strong>{t('profile.mentorChatPlatform')}</strong> {t('profile.mentorChatSecurity')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pf-divider" />

                <h3>{t('skill.title')}</h3>
                <p className="pf-hint">{t('skill.hint')}</p>
                <div className="pf-skill-options">
                  {SKILL_OPTIONS.map(opt => (
                    <button key={opt.value} className={`pf-skill-btn ${(user.languageSkill || 'intermediate') === opt.value ? 'active' : ''}`}
                      onClick={() => updateProfile({ languageSkill: opt.value } as any)}>
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Curriculum Vitae (redirect to Jobs) ─── */}
            {/* ─── CV / Perfil Profesional ─── */}
            {activeSection === 'cv' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>📄 Perfil Profesional</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Elige cómo quieres construir tu perfil profesional. Puedes llenarlo manualmente con todo el detalle, o subir tu CV y Conniku se encargará de analizarlo y construir tu perfil automáticamente.
                </p>

                {/* Two paths */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                  {/* Manual */}
                  <div style={{ border: '1.5px solid var(--border)', borderRadius: 14, padding: 20,
                    background: 'var(--bg-card)', cursor: 'pointer', transition: 'border-color .2s' }}
                    onClick={() => onNavigate?.('/jobs')}
                  >
                    <div style={{ fontSize: 30, marginBottom: 10 }}>✏️</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Completar manualmente</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Ingresa tu experiencia, habilidades y logros paso a paso desde tu perfil laboral.
                    </p>
                    <div style={{ marginTop: 14 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Ir a Perfil Laboral →</span>
                    </div>
                  </div>

                  {/* Upload */}
                  <div style={{ border: '1.5px solid var(--accent)', borderRadius: 14, padding: 20,
                    background: 'rgba(45,98,200,0.04)', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 30, marginBottom: 10 }}>📂</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Subir mi CV</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Conniku analiza tu CV en profundidad, llena tu perfil y genera tu bio profesional automáticamente.
                    </p>
                    <div style={{ marginTop: 14 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Recomendado ✦</span>
                    </div>
                  </div>
                </div>

                {/* Upload zone */}
                <div
                  style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 28,
                    border: '2px dashed var(--border)', textAlign: 'center', transition: 'border-color .2s' }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  onDrop={e => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = 'var(--border)'
                    const f = e.dataTransfer.files?.[0]
                    if (f) handleCvUpload(f)
                  }}
                >
                  <input
                    ref={cvFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCvUpload(f) }}
                  />
                  {cvUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <div style={{ fontWeight: 600, fontSize: 15 }}>Analizando tu CV...</div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        Conniku está extrayendo tu experiencia, habilidades y formación académica
                      </p>
                    </div>
                  ) : cvUploadMsg ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 36 }}>✅</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-green)' }}>¡CV analizado con éxito!</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{cvUploadMsg}</p>
                      {bioPreview && (
                        <div style={{ marginTop: 12, width: '100%', background: 'rgba(45,98,200,0.06)',
                          border: '1px solid rgba(45,98,200,0.2)', borderRadius: 10, padding: '14px 16px', textAlign: 'left' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                            ✦ Bio profesional generada por Conniku
                          </div>
                          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65 }}>{bioPreview}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="btn btn-primary btn-xs" onClick={() => {
                              handleAcceptBio()
                              setActiveSection('profile')
                            }}>✓ Usar esta bio</button>
                            <button className="btn btn-secondary btn-xs" onClick={() => setBioPreview(null)}>Descartar</button>
                          </div>
                        </div>
                      )}
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
                        onClick={() => { setCvUploadMsg(''); cvFileRef.current?.click() }}>
                        Subir otro CV
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Arrastra tu CV aquí</div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
                        PDF, Word o texto plano · máx. 10MB
                      </p>
                      <button className="btn btn-primary btn-sm" onClick={() => cvFileRef.current?.click()}>
                        Seleccionar archivo
                      </button>
                    </>
                  )}
                </div>

                {/* What gets filled */}
                <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                    Qué analiza Conniku en tu CV:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      '✦ Experiencia laboral', '✦ Habilidades técnicas',
                      '✦ Formación académica', '✦ Certificaciones',
                      '✦ Idiomas', '✦ Portfolio & proyectos',
                      '✦ Bio profesional contextual', '✦ Titular de perfil',
                    ].map(item => (
                      <div key={item} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Proyectos ─── */}
            {activeSection === 'projects' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>🗂 Proyectos &amp; Portfolio</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  Muestra tus proyectos académicos, personales y laborales en tu perfil público.
                </p>
                <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Agregar proyecto</h4>
                  <div className="pf-fields-grid" style={{ marginBottom: 10 }}>
                    <div className="pf-field">
                      <label>Título *</label>
                      <input className="form-input" value={newProj.title} onChange={e => setNewProj(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="pf-field">
                      <label>URL del proyecto</label>
                      <input className="form-input" value={newProj.projectUrl} onChange={e => setNewProj(p => ({ ...p, projectUrl: e.target.value }))} />
                    </div>
                    <div className="pf-field">
                      <label>Tecnologías (separadas por coma)</label>
                      <input className="form-input" value={newProj.techStack} onChange={e => setNewProj(p => ({ ...p, techStack: e.target.value }))} placeholder="React, Python, Node..." />
                    </div>
                    <div className="pf-field">
                      <label>Categoría</label>
                      <select className="form-input" value={newProj.category} onChange={e => setNewProj(p => ({ ...p, category: e.target.value }))}>
                        <option value="academic">Académico</option>
                        <option value="personal">Personal</option>
                        <option value="work">Laboral</option>
                      </select>
                    </div>
                    <div className="pf-field" style={{ gridColumn: '1/-1' }}>
                      <label>Descripción</label>
                      <textarea className="form-input" rows={2} value={newProj.description} onChange={e => setNewProj(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    if (!newProj.title.trim() || !user) return
                    try {
                      const tech = newProj.techStack.split(',').map(s => s.trim()).filter(Boolean)
                      const res = await api.addPortfolioProject(user.id, { ...newProj, techStack: tech })
                      setProjects(prev => [{ ...res, techStack: tech, description: newProj.description, projectUrl: newProj.projectUrl, category: newProj.category, year: newProj.year }, ...prev])
                      setNewProj({ title: '', description: '', projectUrl: '', techStack: '', category: 'personal', year: new Date().getFullYear() })
                    } catch {}
                  }}>Agregar Proyecto</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {projects.map((p: any) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category} · {p.year}</div>
                      </div>
                      <button onClick={async () => { try { await api.deletePortfolioProject(p.id); setProjects(prev => prev.filter(x => x.id !== p.id)) } catch {} }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18 }}>🗑</button>
                    </div>
                  ))}
                  {projects.length === 0 && !projectsLoaded && (
                    <button className="btn btn-secondary btn-sm" onClick={async () => {
                      if (!user) return
                      try { const data = await api.getUserProjects(user.id); setProjects(data); setProjectsLoaded(true) } catch {}
                    }}>Cargar mis proyectos</button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Publicaciones ─── */}
            {activeSection === 'publications' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>📚 Publicaciones &amp; Investigaciones</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  Libros, papers, tesis, investigaciones y artículos de tu autoría.
                </p>
                <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Agregar publicación</h4>
                  <div className="pf-fields-grid" style={{ marginBottom: 10 }}>
                    <div className="pf-field">
                      <label>Tipo</label>
                      <select className="form-input" value={newPub.type} onChange={e => setNewPub(p => ({ ...p, type: e.target.value }))}>
                        <option value="paper">Artículo / Paper</option>
                        <option value="book">Libro</option>
                        <option value="thesis">Tesis</option>
                        <option value="research">Investigación</option>
                        <option value="article">Artículo de divulgación</option>
                      </select>
                    </div>
                    <div className="pf-field">
                      <label>Año</label>
                      <input className="form-input" type="number" value={newPub.year} onChange={e => setNewPub(p => ({ ...p, year: parseInt(e.target.value) || new Date().getFullYear() }))} />
                    </div>
                    <div className="pf-field" style={{ gridColumn: '1/-1' }}>
                      <label>Título *</label>
                      <input className="form-input" value={newPub.title} onChange={e => setNewPub(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="pf-field">
                      <label>Institución / Editorial</label>
                      <input className="form-input" value={newPub.institution} onChange={e => setNewPub(p => ({ ...p, institution: e.target.value }))} />
                    </div>
                    <div className="pf-field">
                      <label>URL o DOI</label>
                      <input className="form-input" value={newPub.url} onChange={e => setNewPub(p => ({ ...p, url: e.target.value }))} />
                    </div>
                    <div className="pf-field" style={{ gridColumn: '1/-1' }}>
                      <label>Resumen</label>
                      <textarea className="form-input" rows={2} value={newPub.description} onChange={e => setNewPub(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    if (!newPub.title.trim() || !user) return
                    try {
                      const res = await api.addPublication(user.id, newPub)
                      setPublications(prev => [{ ...res, ...newPub }, ...prev])
                      setNewPub({ type: 'paper', title: '', description: '', year: new Date().getFullYear(), url: '', institution: '' })
                    } catch {}
                  }}>Agregar Publicación</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {publications.map((p: any) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.type} · {p.year}{p.institution ? ` · ${p.institution}` : ''}</div>
                      </div>
                      <button onClick={async () => { try { await api.deletePublication(p.id); setPublications(prev => prev.filter(x => x.id !== p.id)) } catch {} }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18 }}>🗑</button>
                    </div>
                  ))}
                  {publications.length === 0 && !publicationsLoaded && (
                    <button className="btn btn-secondary btn-sm" onClick={async () => {
                      if (!user) return
                      try { const data = await api.getUserPublications(user.id); setPublications(data); setPublicationsLoaded(true) } catch {}
                    }}>Cargar mis publicaciones</button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Apariencia ─── */}
            {activeSection === 'appearance' && (
              <div className="pf-section">
                <h3>{t('profile.coverPhoto')}</h3>
                <p className="pf-hint">{t('profile.coverPhotoHint')}</p>

                {(user as any).coverPhoto && (
                  <div style={{
                    marginBottom: 12, borderRadius: 10, height: 80,
                    ...getCoverStyle((user as any).coverPhoto, (user as any).coverType || 'template'),
                  }} />
                )}

                <button
                  className="btn btn-secondary"
                  style={{ marginBottom: 8 }}
                  onClick={() => setShowCoverModal(true)}
                >
                  {Pencil({ size: 14 })} {t('profile.changeCover')}
                </button>

                {coverMsg && (
                  <p style={{ fontSize: 12, color: coverMsg.startsWith('Error') ? 'var(--accent-orange)' : 'var(--accent-green)', marginBottom: 12 }}>
                    {coverMsg}
                  </p>
                )}

                <CoverPhotoModal
                  isOpen={showCoverModal}
                  onClose={() => setShowCoverModal(false)}
                  currentCover={(user as any).coverPhoto}
                  currentCoverType={(user as any).coverType}
                  onSaved={(coverPhoto, coverType) => {
                    updateProfile({ coverPhoto, coverType } as any)
                    setCoverMsg('Foto de portada actualizada')
                    setTimeout(() => setCoverMsg(''), 3000)
                  }}
                />

                <div className="pf-divider" />

                <h3>Tema de color</h3>
                <p className="pf-hint">Elige el aspecto visual de la plataforma</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  {[
                    { id: 'equilibrado', name: 'Equilibrado', colors: ['#FAF8F4', '#D97706', '#2D62C8'], desc: 'Claro cálido · dual accent — predeterminado' },
                    { id: 'pizarra',     name: 'Pizarra',     colors: ['#F1F5F9', '#D97706', '#FFFFFF'], desc: 'Claro · amber' },
                    { id: 'dorado',      name: 'Dorado',      colors: ['#F1F5F9', '#D97706', '#2D62C8'], desc: 'Claro · amber nav + azul info' },
                    { id: 'corporativo', name: 'Corporativo', colors: ['#F1F5F9', '#2D62C8', '#D97706'], desc: 'Claro · azul nav + amber CTA' },
                    { id: 'oceano',      name: 'Océano',      colors: ['#0F172A', '#38BDF8', '#1E293B'], desc: 'Oscuro · azul cielo' },
                    { id: 'conniku',     name: 'Conniku',     colors: ['#070D18', '#2D62C8', '#111D33'], desc: 'Oscuro · azul marca' },
                  ].map(th => {
                    const isActive = currentTheme === th.id
                    return (
                      <button
                        key={th.id}
                        onClick={() => {
                          localStorage.setItem('conniku_theme', th.id)
                          document.documentElement.setAttribute('data-theme', th.id)
                          setCurrentTheme(th.id)
                        }}
                        style={{
                          flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                          border: isActive ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                          background: isActive ? 'rgba(56,189,248,0.06)' : 'var(--bg-secondary)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6 }}>
                          {th.colors.map((c, i) => (
                            <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '2px solid rgba(255,255,255,0.1)' }} />
                          ))}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{th.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{th.desc}</div>
                      </button>
                    )
                  })}
                </div>

                <div className="pf-divider" />

                <h3>{t('profile.platformLanguage')}</h3>
                <p className="pf-hint">{t('profile.platformLanguageHint')}</p>
                <select
                  value={user.platformLanguage || user.language || 'es'}
                  onChange={e => updateProfile({ platformLanguage: e.target.value } as any)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 16 }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                  ))}
                </select>

                <h3>{t('profile.additionalLanguages')}</h3>
                <p className="pf-hint">{t('profile.additionalLanguagesHint')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {LANGUAGES.filter(l => l.code !== (user.platformLanguage || user.language || 'es')).map(l => {
                    const selected = (user.secondaryLanguages || []).includes(l.code)
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          const current = user.secondaryLanguages || []
                          let updated: string[]
                          if (selected) {
                            updated = current.filter((c: string) => c !== l.code)
                          } else if (current.length < 3) {
                            updated = [...current, l.code]
                          } else {
                            return
                          }
                          updateProfile({ secondaryLanguages: updated } as any)
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                          border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: selected ? 'rgba(37,99,235,0.08)' : 'var(--bg-secondary)',
                          color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {l.flag} {l.name} {selected && '✓'}
                      </button>
                    )
                  })}
                </div>
                {(user.secondaryLanguages || []).length >= 3 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('profile.maxLanguages')}</p>
                )}
              </div>
            )}

            {/* ─── Notificaciones & Privacidad ─── */}
            {activeSection === 'notifications' && (
              <div className="pf-section">
                <h3>{t('profile.privacy')}</h3>
                <div className="pf-toggles">
                  <ToggleRow label={t('profile.privateProfile')} desc={t('profile.privateProfileDesc')} />
                  <ToggleRow label={t('profile.showOnline')} desc={t('profile.showOnlineDesc')} />
                  <ToggleRow label={t('profile.showSuggestions')} desc={t('profile.showSuggestionsDesc')} />
                </div>

                <div className="pf-divider" />

                <h3>{t('profile.emailNotifications')}</h3>
                <div className="pf-toggles">
                  <ToggleRow label={t('profile.emailNotifToggle')} desc={t('profile.emailNotifDesc')} />
                  <ToggleRow label={t('profile.friendPosts')} desc={t('profile.friendPostsDesc')} />
                  <ToggleRow label={t('profile.friendRequests')} desc={t('profile.friendRequestsDesc')} />
                  <ToggleRow label={t('profile.directMessages')} desc={t('profile.directMessagesDesc')} />
                </div>
              </div>
            )}

            {/* ─── Seguridad ─── */}
            {activeSection === 'security' && (
              <div className="pf-section">
                <h3>{t('profile.changePassword')}</h3>
                {user.provider === 'email' ? (
                  !showPasswordChange ? (
                    <div>
                      <p className="pf-hint">{t('profile.changePasswordHint')}</p>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordChange(true)}>
                        {t('profile.changePasswordBtn')}
                      </button>
                    </div>
                  ) : (
                    <div className="pf-password-form">
                      <div className="pf-field"><label>{t('profile.currentPassword')}</label><input className="form-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
                      <div className="pf-field"><label>{t('profile.newPassword')}</label><input className="form-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
                      <div className="pf-field"><label>{t('profile.confirmNewPassword')}</label><input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
                      {pwError && <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{pwError}</p>}
                      {pwSuccess && <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>{t('profile.passwordUpdated')}</p>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={async () => {
                          setPwError(''); setPwSuccess(false)
                          if (newPw.length < 6) { setPwError(t('profile.passwordMin')); return }
                          if (newPw !== confirmPw) { setPwError(t('profile.passwordMismatch')); return }
                          try {
                            await api.changePassword(currentPw, newPw)
                            setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('')
                            setTimeout(() => setShowPasswordChange(false), 2000)
                          } catch (e: any) { setPwError(e.message || 'Error al cambiar contraseña') }
                        }}>{t('profile.savePassword')}</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setShowPasswordChange(false); setPwError('') }}>Cancelar</button>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="pf-hint">{t('profile.googleSignIn')}</p>
                )}

                <div className="pf-divider" />

                <h3 style={{ color: 'var(--accent-red)' }}>{t('profile.deleteAccount')}</h3>
                <div className="pf-danger-zone">
                  <p>{t('profile.deleteAccountDesc')}</p>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
                    {t('profile.deleteAccountBtn')}
                  </button>
                </div>
                {showDeleteModal && (
                  <DeleteAccountModal
                    userName={user.firstName || user.username || ''}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirmDelete={() => {
                      api.deleteAccount().then(() => {
                        logout()
                      }).catch(() => {})
                    }}
                  />
                )}
              </div>
            )}

            {/* ─── Correo Corporativo (Owner) ─── */}
            {activeSection === 'email' && user.role === 'owner' && (
              <div className="pf-section">
                <h3>{t('profile.emailAccounts')}</h3>
                <p className="pf-hint" style={{ marginBottom: 20 }}>
                  {t('profile.emailAccountsHint')}
                </p>
                <div className="pf-toggles">
                  {[
                    { email: 'ceo@conniku.com', label: 'CEO / Principal', desc: 'Cuenta consolidada — notificaciones, contacto y administración', status: 'active' },
                    { email: 'contacto@conniku.com', label: 'Contacto General', desc: 'Soporte y consultas de usuarios', status: 'pending' },
                    { email: 'soporte@conniku.com', label: 'Soporte Técnico', desc: 'Tickets de soporte y ayuda', status: 'pending' },
                    { email: 'pagos@conniku.com', label: 'Facturación', desc: 'Recibos, facturas y pagos', status: 'pending' },
                  ].map(account => (
                    <div key={account.email} className="pf-email-row">
                      <div className={`pf-email-icon ${account.status}`}>
                        {account.status === 'active' ? CheckCircle({ size: 14 }) : Hourglass({ size: 14 })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{account.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{account.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{account.desc}</div>
                      </div>
                      <span className={`pf-badge ${account.status === 'active' ? 'pf-badge-green' : 'pf-badge-orange'}`}>
                        {account.status === 'active' ? t('profile.active') : t('profile.pending')}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 16 }}
                  onClick={() => window.open('https://mailadmin.zoho.com/cpanel/index.do', '_blank', 'noopener,noreferrer')}
                >
                  {t('profile.createEmail')}
                </button>

                <div className="pf-divider" />

                <h3>{t('profile.outlookConfig')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                  <div className="pf-config-box">
                    <h4 style={{ color: 'var(--accent-blue)' }}>{t('profile.incomingMail')}</h4>
                    <div>Servidor: <strong style={{ fontFamily: 'var(--font-mono)' }}>mail.conniku.com</strong></div>
                    <div>Puerto: <strong>993</strong> (SSL/TLS)</div>
                    <div>Usuario: <strong style={{ fontFamily: 'var(--font-mono)' }}>tu@conniku.com</strong></div>
                  </div>
                  <div className="pf-config-box">
                    <h4 style={{ color: 'var(--accent-green)' }}>{t('profile.outgoingMail')}</h4>
                    <div>Servidor: <strong style={{ fontFamily: 'var(--font-mono)' }}>smtp.conniku.com</strong></div>
                    <div>Puerto: <strong>587</strong> (STARTTLS)</div>
                    <div>Autenticación: <strong>{t('profile.authRequired')}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Popup */}
      {milestonePopup && (
        <MilestonePopup
          type={milestonePopup.type}
          title={milestonePopup.title}
          description={milestonePopup.description}
          icon={milestonePopup.icon}
          onClose={() => setMilestonePopup(null)}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// DELETE ACCOUNT MODAL — Retention flow with survey + offers
// ═══════════════════════════════════════════════════════════════
type DeleteStep = 'reason' | 'feedback' | 'offer_pro' | 'offer_max' | 'confirm'

const DELETE_REASONS = [
  { value: 'no_use', label: 'Ya no uso la plataforma' },
  { value: 'another_platform', label: 'Encontré otra plataforma mejor' },
  { value: 'too_complex', label: 'La plataforma es muy compleja' },
  { value: 'missing_features', label: 'Falta funcionalidad que necesito' },
  { value: 'bugs', label: 'Problemas técnicos o errores' },
  { value: 'privacy', label: 'Preocupaciones de privacidad' },
  { value: 'cost', label: 'El costo es muy alto' },
  { value: 'graduated', label: 'Ya me gradué / no estudio' },
  { value: 'other', label: 'Otra razón' },
]

function DeleteAccountModal({ userName, onClose, onConfirmDelete }: {
  userName: string
  onClose: () => void
  onConfirmDelete: () => void
}) {
  const [step, setStep] = useState<DeleteStep>('reason')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  }
  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-primary)', borderRadius: 16,
    width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }
  const headerStyle: React.CSSProperties = {
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }
  const bodyStyle: React.CSSProperties = { padding: '20px 24px' }
  const footerStyle: React.CSSProperties = {
    padding: '16px 24px', borderTop: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', gap: 12,
  }
  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'var(--accent)', color: '#fff', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }
  const btnDanger: React.CSSProperties = {
    ...btnPrimary, background: '#ef4444',
  }
  const btnSecondary: React.CSSProperties = {
    ...btnPrimary, background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
  }
  const radioStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
  }

  const sendFeedbackToEmail = async () => {
    const reasonLabel = DELETE_REASONS.find(r => r.value === reason)?.label || reason
    try {
      await api.sendClosureFeedback(reasonLabel, feedback)
    } catch { /* silent */ }
  }

  const handleAcceptOffer = async (plan: string) => {
    setAccepted(true)
    setSending(true)
    await sendFeedbackToEmail()
    // In a real implementation, this would activate the trial
    // For now, just close the modal after a brief delay
    setTimeout(() => {
      setSending(false)
      onClose()
    }, 1500)
  }

  const handleFinalDelete = async () => {
    setSending(true)
    await sendFeedbackToEmail()
    onConfirmDelete()
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {step === 'reason' && 'Antes de irte...'}
            {step === 'feedback' && 'Tu opinión nos importa'}
            {step === 'offer_pro' && '¡Espera! Tenemos algo para ti'}
            {step === 'offer_max' && 'Última oferta especial'}
            {step === 'confirm' && 'Confirmar eliminación'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 18, padding: 4,
          }}>✕</button>
        </div>

        {/* Step 1: Reason */}
        {step === 'reason' && (
          <>
            <div style={bodyStyle}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                {userName}, lamentamos que quieras irte. Nos ayudaría mucho saber por qué quieres cerrar tu cuenta.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DELETE_REASONS.map(r => (
                  <label key={r.value} style={{
                    ...radioStyle,
                    borderColor: reason === r.value ? 'var(--accent)' : 'var(--border)',
                    background: reason === r.value ? 'rgba(45,98,200,0.08)' : 'var(--bg-secondary)',
                  }}>
                    <input
                      type="radio" name="reason" value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={onClose}>Cancelar</button>
              <button
                style={{ ...btnDanger, opacity: reason ? 1 : 0.5 }}
                disabled={!reason}
                onClick={() => setStep('feedback')}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 2: Feedback */}
        {step === 'feedback' && (
          <>
            <div style={bodyStyle}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                ¿Hay algo más que quieras compartir? Tu feedback nos ayuda a mejorar.
              </p>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Cuéntanos qué podríamos mejorar... (opcional)"
                style={{
                  width: '100%', minHeight: 120, padding: '12px 14px',
                  borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                }}
              />
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={() => setStep('reason')}>Atrás</button>
              <button style={btnDanger} onClick={() => setStep('offer_pro')}>
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 3: Offer PRO */}
        {step === 'offer_pro' && (
          <>
            <div style={bodyStyle}>
              <div style={{
                padding: 24, borderRadius: 12, textAlign: 'center',
                background: 'linear-gradient(135deg, #2D62C8, #4f8cff)',
                color: '#fff', marginBottom: 16,
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>1 Mes PRO Gratis</h3>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                  Queremos que te quedes. Te regalamos un mes completo de Conniku PRO para que explores todas las funcionalidades.
                </p>
              </div>
              <div style={{
                padding: 14, background: 'var(--bg-secondary)', borderRadius: 10,
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8,
              }}>
                <strong>Conniku PRO incluye:</strong>
                <div style={{ marginTop: 6 }}>
                  • Proyectos ilimitados y almacenamiento ampliado<br/>
                  • Asistente avanzado para estudio y tutoría<br/>
                  • Acceso a cursos exclusivos<br/>
                  • Soporte prioritario<br/>
                  • Sin publicidad
                </div>
              </div>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={() => setStep('offer_max')}>
                No, gracias
              </button>
              <button style={btnPrimary} onClick={() => handleAcceptOffer('pro')} disabled={sending}>
                {accepted ? 'Activando...' : 'Aceptar PRO Gratis'}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Offer MAX */}
        {step === 'offer_max' && (
          <>
            <div style={bodyStyle}>
              <div style={{
                padding: 24, borderRadius: 12, textAlign: 'center',
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                color: '#fff', marginBottom: 16,
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💎</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>1 Mes MAX Gratis</h3>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                  Nuestra mejor oferta. Te damos acceso completo a Conniku MAX, nuestro plan premium con todo incluido.
                </p>
              </div>
              <div style={{
                padding: 14, background: 'var(--bg-secondary)', borderRadius: 10,
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8,
              }}>
                <strong>Conniku MAX incluye todo de PRO más:</strong>
                <div style={{ marginTop: 6 }}>
                  • Acceso completo al asistente sin límites<br/>
                  • Generación ilimitada de guías, quizzes y flashcards<br/>
                  • Acceso a todos los cursos y certificaciones<br/>
                  • Mentoría prioritaria<br/>
                  • Badge exclusivo MAX en tu perfil
                </div>
              </div>
            </div>
            <div style={footerStyle}>
              <button style={{ ...btnDanger, fontSize: 12 }} onClick={() => setStep('confirm')}>
                No, eliminar mi cuenta
              </button>
              <button style={{ ...btnPrimary, background: '#7c3aed' }} onClick={() => handleAcceptOffer('max')} disabled={sending}>
                {accepted ? 'Activando...' : 'Aceptar MAX Gratis'}
              </button>
            </div>
          </>
        )}

        {/* Step 5: Final Confirmation */}
        {step === 'confirm' && (
          <>
            <div style={bodyStyle}>
              <div style={{
                padding: 16, background: 'rgba(239,68,68,0.08)', borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16,
              }}>
                <p style={{ margin: 0, fontSize: 14, color: '#ef4444', fontWeight: 600 }}>
                  Esta acción es irreversible
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Al confirmar, se eliminarán permanentemente todos tus datos: proyectos, documentos, mensajes, publicaciones, progreso en cursos, y toda tu información personal.
                </p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Tu feedback será enviado al equipo de Conniku para ayudarnos a mejorar. Gracias por haber sido parte de la comunidad.
              </p>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={onClose}>
                Cancelar, me quedo
              </button>
              <button style={btnDanger} onClick={handleFinalDelete} disabled={sending}>
                {sending ? 'Eliminando...' : 'Eliminar mi cuenta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
