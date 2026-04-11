import React, { useState, useRef } from 'react'
import { useAuth } from '../services/auth'
import { useI18n, LANGUAGES } from '../services/i18n'
import { api } from '../services/api'
import { LanguageSkill } from '../types'
import MilestonePopup from '../components/MilestonePopup'
import CoverPhotoModal, { getCoverStyle } from '../components/CoverPhotoModal'
import { Bell, AlertTriangle, MessageSquare, CheckCircle, Hourglass, GraduationCap, Users, Pencil, Lock, Settings, ClipboardList } from '../components/Icons'

type Section = 'profile' | 'academic' | 'appearance' | 'notifications' | 'security' | 'email' | 'cv'

export default function Profile() {
  const { user, updateProfile, logout } = useAuth()
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState<Section>('profile')
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
    } catch (err: any) {
      setCvUploadMsg(err.message || t('profile.cvUploadError'))
    } finally {
      setCvUploading(false)
    }
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

                <h3>{t('profile.bio')}</h3>
                {isEditing ? (
                  <textarea className="form-input" rows={3} value={form.bio || ''} onChange={e => update('bio', e.target.value)} placeholder={t('profile.bioPlaceholder')} />
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user.bio || t('profile.bioEmpty')}</p>
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
                  <div className="pf-field">
                    <label>{t('reg.university')}</label>
                    {isEditing ? <input className="form-input" value={form.university} onChange={e => update('university', e.target.value)} /> : <p>{user.university || '—'}</p>}
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
            {activeSection === 'cv' && (
              <div className="pf-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{t('profile.professionalProfile')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  {t('profile.professionalProfileDesc')}
                </p>
                <button
                  onClick={() => window.location.href = '/jobs'}
                  style={{
                    padding: '12px 32px', background: '#2563eb', color: '#fff', border: 'none',
                    borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  }}
                >
                  {t('profile.goToProfessionalProfile')}
                </button>
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

                <h3>{t('profile.visualTheme')}</h3>
                <p className="pf-hint">{t('profile.visualThemeHint')}</p>
                <div className="theme-selector">
                  {([
                    { id: 'sereno', name: 'Conniku Theme', desc: 'Principal — azul y blanco', colors: ['#F5F3EF', '#2563EB', '#1D2939'] },
                    { id: 'nocturno', name: 'Nocturno', desc: 'Modo noche', colors: ['#0D1117', '#58A6FF', '#E6EDF3'] },
                    { id: 'calido', name: 'Noche Calma', desc: 'Oscuro y suave', colors: ['#111318', '#60A5FA', '#ECECEF'] },
                    { id: 'profesional', name: 'Bosque', desc: 'Verde y natural', colors: ['#F2F5F0', '#16A34A', '#1A2E1A'] },
                    { id: 'vibrante', name: 'Océano', desc: 'Azul profundo', colors: ['#0F172A', '#38BDF8', '#F1F5F9'] },
                  ] as const).map(theme => (
                    <button key={theme.id} className={`theme-card ${(user.theme || 'sereno') === theme.id ? 'active' : ''}`}
                      onClick={() => {
                        if (theme.id === 'sereno') { document.documentElement.removeAttribute('data-theme') } else { document.documentElement.setAttribute('data-theme', theme.id) }
                        updateProfile({ theme: theme.id } as any)
                        api.updateMe({ theme: theme.id }).catch(() => {})
                      }}>
                      <div className="theme-preview">
                        {theme.colors.map((c, i) => <div key={i} style={{ background: c, flex: 1 }} />)}
                      </div>
                      <strong>{theme.name}</strong>
                      <small>{theme.desc}</small>
                    </button>
                  ))}
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

                <h3>{t('profile.universitySection')}</h3>
                <div className="pf-toggles">
                  {/* University News Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{t('profile.uniNews')}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('profile.uniNewsDesc')}</div>
                    </div>
                    <button
                      onClick={() => {
                        const current = localStorage.getItem('conniku_university_news') !== 'false'
                        localStorage.setItem('conniku_university_news', current ? 'false' : 'true')
                        // Force re-render
                        setForm(prev => ({ ...prev }))
                      }}
                      style={{
                        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                        background: localStorage.getItem('conniku_university_news') !== 'false' ? '#2D62C8' : 'var(--bg-tertiary)',
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 11, background: '#fff',
                        position: 'absolute', top: 2, transition: 'left 0.2s',
                        left: localStorage.getItem('conniku_university_news') !== 'false' ? 24 : 2,
                      }} />
                    </button>
                  </div>
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
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => {
                  const email = prompt('Nuevo correo (ej: marketing@conniku.com):')
                  if (email) alert(`Para crear ${email}, configúralo en tu panel de hosting (cPanel, Google Workspace, Zoho Mail, etc.)`)
                }}>
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
