import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import {
  Pencil, Download, Share2, Upload, Globe, Briefcase, GraduationCap,
  Award, Star, CheckCircle, ExternalLink, Link, Eye, EyeOff, Save,
  Plus, Trash2, X, Clock, Map, Target, Users, FileText, Zap, ChevronRight
} from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

interface Experience {
  id: string
  company: string
  title: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
  description: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

interface SkillGroup {
  category: string
  skills: { name: string; level: number }[]
}

interface CVData {
  headline: string
  summary: string
  location: string
  email: string
  phone: string
  availableWorldwide: boolean
  openToOffers: boolean
  experience: Experience[]
  education: Education[]
  certifications: Certification[]
  skillGroups: SkillGroup[]
  differentiators: string[]
  languages: { name: string; level: string }[]
  links: { label: string; url: string }[]
  competencies: string[]
  visibility: 'public' | 'private' | 'connections'
}

const EMPTY_CV: CVData = {
  headline: '',
  summary: '',
  location: '',
  email: '',
  phone: '',
  availableWorldwide: false,
  openToOffers: false,
  experience: [],
  education: [],
  certifications: [],
  skillGroups: [],
  differentiators: [],
  languages: [],
  links: [],
  competencies: [],
  visibility: 'private',
}

const LANG_LEVELS = ['Basico', 'Intermedio', 'Avanzado', 'Nativo/Bilingue']

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

/* ────────── Styles ────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-secondary, #f3f4f6)',
    paddingBottom: 60,
  },
  banner: {
    height: 200,
    background: 'linear-gradient(135deg, #0a2463 0%, #1e56a0 40%, #3d7cc9 100%)',
    position: 'relative',
    borderRadius: '0 0 16px 16px',
  },
  bannerOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)',
    borderRadius: '0 0 16px 16px',
  },
  profileHeader: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 24px',
    position: 'relative',
    marginTop: -60,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: '4px solid var(--bg-primary, #fff)',
    background: 'linear-gradient(135deg, #1e56a0, #3d7cc9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    fontWeight: 700,
    color: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  headerCard: {
    background: 'var(--bg-primary, #fff)',
    borderRadius: 16,
    padding: '0 28px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginTop: -60,
    paddingTop: 76,
    position: 'relative',
  },
  name: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-primary, #1a1a2e)',
    margin: 0,
    lineHeight: 1.2,
  },
  headline: {
    fontSize: 16,
    color: 'var(--text-secondary, #555)',
    marginTop: 4,
    fontWeight: 500,
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 16,
    marginTop: 10,
    fontSize: 13,
    color: 'var(--text-tertiary, #888)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 20,
    marginTop: 8,
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #1e56a0, #2d6fc5)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'var(--bg-secondary, #f3f4f6)',
    color: 'var(--text-primary, #333)',
    border: '1px solid var(--border, #e0e0e0)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s',
  },
  mainGrid: {
    maxWidth: 960,
    margin: '24px auto 0',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: 24,
  },
  card: {
    background: 'var(--bg-primary, #fff)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary, #1a1a2e)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    background: 'var(--bg-secondary, #f3f4f6)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    overflowX: 'auto' as const,
  },
  tab: {
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #666)',
    whiteSpace: 'nowrap' as const,
    transition: 'all .2s',
  },
  tabActive: {
    background: 'var(--bg-primary, #fff)',
    color: 'var(--text-primary, #1a1a2e)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border, #e0e0e0)',
    fontSize: 14,
    background: 'var(--bg-primary, #fff)',
    color: 'var(--text-primary, #333)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border, #e0e0e0)',
    fontSize: 14,
    background: 'var(--bg-primary, #fff)',
    color: 'var(--text-primary, #333)',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 80,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    background: 'var(--bg-secondary, #eef2f7)',
    color: 'var(--text-primary, #333)',
  },
  skillBar: {
    height: 8,
    borderRadius: 4,
    background: 'var(--bg-secondary, #e5e7eb)',
    overflow: 'hidden',
    flex: 1,
  },
  skillFill: {
    height: '100%',
    borderRadius: 4,
    background: 'linear-gradient(90deg, #1e56a0, #3d7cc9)',
    transition: 'width .4s ease',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--border, #f0f0f0)',
    fontSize: 14,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background .2s',
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute' as const,
    top: 3,
    transition: 'left .2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  timeline: {
    position: 'relative' as const,
    paddingLeft: 24,
    borderLeft: '2px solid var(--border, #e5e7eb)',
  },
  timelineDot: {
    position: 'absolute' as const,
    left: -7,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#1e56a0',
    border: '2px solid var(--bg-primary, #fff)',
  },
  timelineItem: {
    position: 'relative' as const,
    paddingBottom: 24,
  },
  uploadZone: {
    border: '2px dashed var(--border, #d0d5dd)',
    borderRadius: 14,
    padding: '32px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all .2s',
    background: 'var(--bg-secondary, #fafbfc)',
  },
}

export default function CVProfile({ onNavigate }: Props) {
  const { user } = useAuth()
  const { username } = useParams<{ username?: string }>()
  const isPublicView = !!username
  const isOwnProfile = !isPublicView

  const [cv, setCv] = useState<CVData>({ ...EMPTY_CV })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('sobre')
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'sobre', label: 'Sobre Mi' },
    { id: 'experiencia', label: 'Experiencia' },
    { id: 'educacion', label: 'Educacion' },
    { id: 'certificaciones', label: 'Certificaciones' },
    { id: 'habilidades', label: 'Habilidades' },
    { id: 'diferenciadores', label: 'Lo que me diferencia' },
  ]

  /* ── Load data ── */
  useEffect(() => {
    loadCV()
  }, [username])

  async function loadCV() {
    setLoading(true)
    try {
      if (isPublicView) {
        const res = await api.getUserCV(username!)
        if (res) hydrateCV(res)
      } else {
        // Load from draft endpoint first, then overlay with stored CV
        const [draft, cvRes] = await Promise.all([
          fetch(`/api/cv/draft`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          api.getMyCV().catch(() => null),
        ])
        if (cvRes) hydrateCV(cvRes)
        if (draft) {
          setCv(prev => ({
            ...prev,
            headline: draft.headline || prev.headline,
            summary: draft.summary || prev.summary,
            visibility: draft.visibility || prev.visibility,
          }))
        }
      }
    } catch (e) {
      console.error('Error loading CV:', e)
    }
    setLoading(false)
  }

  function hydrateCV(raw: any) {
    setCv({
      headline: raw.headline || raw.cv_headline || '',
      summary: raw.summary || raw.cv_summary || '',
      location: raw.location || '',
      email: raw.email || user?.email || '',
      phone: raw.phone || '',
      availableWorldwide: raw.available_worldwide ?? false,
      openToOffers: raw.open_to_offers ?? raw.is_open_to_opportunities ?? false,
      experience: parseJsonField(raw.experience || raw.cv_experience, []),
      education: parseJsonField(raw.education, []),
      certifications: parseJsonField(raw.certifications || raw.cv_certifications, []),
      skillGroups: parseJsonField(raw.skill_groups || raw.cv_skills, []),
      differentiators: parseJsonField(raw.differentiators, []),
      languages: parseJsonField(raw.languages || raw.cv_languages, []),
      links: parseJsonField(raw.links || raw.cv_portfolio, []),
      competencies: parseJsonField(raw.competencies, []),
      visibility: raw.visibility || raw.cv_visibility || 'private',
    })
  }

  function parseJsonField(val: any, fallback: any) {
    if (!val) return fallback
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try { return JSON.parse(val) } catch { return fallback }
    }
    return fallback
  }

  /* ── Save ── */
  async function handleSave() {
    setSaving(true)
    try {
      await api.updateCV({
        headline: cv.headline,
        summary: cv.summary,
        location: cv.location,
        email: cv.email,
        phone: cv.phone,
        available_worldwide: cv.availableWorldwide,
        open_to_offers: cv.openToOffers,
        experience: JSON.stringify(cv.experience),
        education: JSON.stringify(cv.education),
        certifications: JSON.stringify(cv.certifications),
        skill_groups: JSON.stringify(cv.skillGroups),
        differentiators: JSON.stringify(cv.differentiators),
        languages: JSON.stringify(cv.languages),
        links: JSON.stringify(cv.links),
        competencies: JSON.stringify(cv.competencies),
        visibility: cv.visibility,
      })
      setEditMode(false)
    } catch (e) {
      console.error('Error saving CV:', e)
    }
    setSaving(false)
  }

  /* ── Upload ── */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadMsg('Procesando documento...')
    try {
      const res = await api.uploadCV(file)
      if (res.draft) {
        setCv(prev => ({
          ...prev,
          headline: res.draft.headline || prev.headline,
          summary: res.draft.summary || prev.summary,
        }))
        setUploadMsg(res.message || 'Documento procesado. Revisa los campos.')
        setEditMode(true)
      }
    } catch (err: any) {
      setUploadMsg(err.message || 'Error al procesar el archivo')
    }
  }

  /* ── PDF Download ── */
  function handleDownloadPDF() {
    // Generate a simple print-friendly version
    window.print()
  }

  /* ── Share ── */
  function handleShare() {
    const url = `${window.location.origin}/cv/${user?.username || user?.id || ''}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Enlace copiado al portapapeles')
    }).catch(() => {
      prompt('Copia este enlace:', url)
    })
  }

  /* ── Helpers for editing ── */
  function updateField<K extends keyof CVData>(field: K, value: CVData[K]) {
    setCv(prev => ({ ...prev, [field]: value }))
  }

  function addExperience() {
    updateField('experience', [...cv.experience, {
      id: genId(), company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '',
    }])
  }

  function removeExperience(id: string) {
    updateField('experience', cv.experience.filter(e => e.id !== id))
  }

  function updateExperience(id: string, field: keyof Experience, value: any) {
    updateField('experience', cv.experience.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function addEducation() {
    updateField('education', [...cv.education, {
      id: genId(), institution: '', degree: '', field: '', startYear: '', endYear: '', description: '',
    }])
  }

  function removeEducation(id: string) {
    updateField('education', cv.education.filter(e => e.id !== id))
  }

  function updateEducation(id: string, field: keyof Education, value: any) {
    updateField('education', cv.education.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function addCertification() {
    updateField('certifications', [...cv.certifications, {
      id: genId(), name: '', issuer: '', date: '', url: '',
    }])
  }

  function removeCertification(id: string) {
    updateField('certifications', cv.certifications.filter(c => c.id !== id))
  }

  function updateCertification(id: string, field: keyof Certification, value: string) {
    updateField('certifications', cv.certifications.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function addSkillGroup() {
    updateField('skillGroups', [...cv.skillGroups, { category: '', skills: [] }])
  }

  function removeSkillGroup(idx: number) {
    updateField('skillGroups', cv.skillGroups.filter((_, i) => i !== idx))
  }

  function addSkillToGroup(groupIdx: number) {
    const groups = [...cv.skillGroups]
    groups[groupIdx] = { ...groups[groupIdx], skills: [...groups[groupIdx].skills, { name: '', level: 70 }] }
    updateField('skillGroups', groups)
  }

  function removeSkillFromGroup(groupIdx: number, skillIdx: number) {
    const groups = [...cv.skillGroups]
    groups[groupIdx] = { ...groups[groupIdx], skills: groups[groupIdx].skills.filter((_, i) => i !== skillIdx) }
    updateField('skillGroups', groups)
  }

  function updateSkillInGroup(groupIdx: number, skillIdx: number, field: string, value: any) {
    const groups = [...cv.skillGroups]
    const skills = [...groups[groupIdx].skills]
    skills[skillIdx] = { ...skills[skillIdx], [field]: value }
    groups[groupIdx] = { ...groups[groupIdx], skills }
    updateField('skillGroups', groups)
  }

  function addLanguage() {
    updateField('languages', [...cv.languages, { name: '', level: 'Intermedio' }])
  }

  function removeLanguage(idx: number) {
    updateField('languages', cv.languages.filter((_, i) => i !== idx))
  }

  function addLink() {
    updateField('links', [...cv.links, { label: '', url: '' }])
  }

  function removeLink(idx: number) {
    updateField('links', cv.links.filter((_, i) => i !== idx))
  }

  function addDifferentiator() {
    updateField('differentiators', [...cv.differentiators, ''])
  }

  function removeDifferentiator(idx: number) {
    updateField('differentiators', cv.differentiators.filter((_, i) => i !== idx))
  }

  function addCompetency(text: string) {
    if (text.trim() && !cv.competencies.includes(text.trim())) {
      updateField('competencies', [...cv.competencies, text.trim()])
    }
  }

  function removeCompetency(idx: number) {
    updateField('competencies', cv.competencies.filter((_, i) => i !== idx))
  }

  /* ── Computed stats ── */
  const yearsExp = cv.experience.reduce((sum, e) => {
    const start = e.startDate ? new Date(e.startDate).getFullYear() : 0
    const end = e.current ? new Date().getFullYear() : (e.endDate ? new Date(e.endDate).getFullYear() : 0)
    return sum + Math.max(0, end - start)
  }, 0)
  const companiesCount = new Set(cv.experience.map(e => e.company).filter(Boolean)).size
  const certsCount = cv.certifications.length
  const displayName = (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username) || 'Profesional'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div style={styles.page} className="cv-profile-page">
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .cv-no-print { display: none !important; }
          .cv-profile-page { background: #fff !important; }
        }
        @media (max-width: 768px) {
          .cv-main-grid { grid-template-columns: 1fr !important; }
          .cv-header-card { padding: 0 16px 20px !important; }
        }
        .cv-upload-zone:hover { border-color: #1e56a0 !important; background: rgba(30,86,160,0.04) !important; }
        .cv-tab:hover { background: var(--bg-primary, #fff); }
        .cv-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ── Banner ── */}
      <div style={styles.banner}>
        <div style={styles.bannerOverlay} />
      </div>

      {/* ── Profile Header Card ── */}
      <div style={styles.profileHeader}>
        <div style={{ position: 'absolute', top: -60, left: 24, zIndex: 2 }}>
          <div style={styles.avatar}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              initials
            )}
          </div>
        </div>

        <div style={styles.headerCard} className="cv-header-card">
          {/* Top-right edit/save */}
          {isOwnProfile && (
            <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', gap: 8 }} className="cv-no-print">
              {editMode ? (
                <>
                  <button style={styles.btnPrimary} className="cv-btn" onClick={handleSave} disabled={saving}>
                    {Save({ style: { width: 16, height: 16 } })} {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button style={styles.btnSecondary} className="cv-btn" onClick={() => { setEditMode(false); loadCV() }}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button style={styles.btnSecondary} className="cv-btn" onClick={() => setEditMode(true)}>
                  {Pencil({ style: { width: 16, height: 16 } })} Editar Perfil
                </button>
              )}
            </div>
          )}

          {/* Name & Headline */}
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...styles.input, fontSize: 22, fontWeight: 700 }}
                value={cv.headline}
                onChange={e => updateField('headline', e.target.value)}
                placeholder="Titulo profesional (ej: Director Tecnico de Entretenimiento)"
              />
            </div>
          ) : (
            <>
              <h1 style={styles.name}>{displayName}</h1>
              {cv.headline && <p style={styles.headline}>{cv.headline}</p>}
            </>
          )}

          {/* Meta info */}
          <div style={styles.meta}>
            {(editMode || cv.location) && (
              <span style={styles.metaItem}>
                {Map({ style: { width: 14, height: 14 } })}
                {editMode ? (
                  <input style={{ ...styles.input, width: 200, padding: '4px 10px' }} value={cv.location} onChange={e => updateField('location', e.target.value)} placeholder="Ubicacion" />
                ) : cv.location}
              </span>
            )}
            {(editMode || cv.email) && (
              <span style={styles.metaItem}>
                {editMode ? (
                  <input style={{ ...styles.input, width: 220, padding: '4px 10px' }} value={cv.email} onChange={e => updateField('email', e.target.value)} placeholder="Email" />
                ) : cv.email}
              </span>
            )}
            {(editMode || cv.phone) && (
              <span style={styles.metaItem}>
                {editMode ? (
                  <input style={{ ...styles.input, width: 160, padding: '4px 10px' }} value={cv.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Telefono" />
                ) : cv.phone}
              </span>
            )}
          </div>

          {/* Worldwide badge */}
          {(cv.availableWorldwide || editMode) && (
            <div style={{ marginTop: 8 }}>
              {editMode ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={cv.availableWorldwide} onChange={e => updateField('availableWorldwide', e.target.checked)} />
                  Disponible mundialmente
                </label>
              ) : (
                <span style={styles.badge}>
                  {Globe({ style: { width: 14, height: 14 } })} Disponible mundialmente
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          {isOwnProfile && !editMode && (
            <div style={styles.actions} className="cv-no-print">
              <button style={styles.btnPrimary} className="cv-btn" onClick={() => fileRef.current?.click()}>
                {Upload({ style: { width: 16, height: 16 } })} Subir CV
              </button>
              <button style={styles.btnSecondary} className="cv-btn" onClick={handleDownloadPDF}>
                {Download({ style: { width: 16, height: 16 } })} Descargar CV PDF
              </button>
              <button style={styles.btnSecondary} className="cv-btn" onClick={handleShare}>
                {Share2({ style: { width: 16, height: 16 } })} Compartir
              </button>
            </div>
          )}

          {uploadMsg && (
            <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, background: 'var(--bg-secondary, #f0f4f8)', fontSize: 13, color: 'var(--text-secondary, #555)' }} className="cv-no-print">
              {uploadMsg}
              <button onClick={() => setUploadMsg('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                {X({ style: { width: 14, height: 14 } })}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs + Content ── */}
      <div style={styles.mainGrid} className="cv-main-grid">
        {/* Left column */}
        <div>
          <div style={styles.tabBar} className="cv-no-print">
            {tabs.map(t => (
              <button
                key={t.id}
                className="cv-tab"
                style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Sobre Mi ── */}
          {activeTab === 'sobre' && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Resumen Profesional
                {editMode && isOwnProfile && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                    Describe tu trayectoria profesional
                  </span>
                )}
              </div>
              {editMode ? (
                <textarea
                  style={styles.textarea}
                  rows={5}
                  value={cv.summary}
                  onChange={e => updateField('summary', e.target.value)}
                  placeholder="Escribe un resumen de tu perfil profesional, logros clave y lo que buscas..."
                />
              ) : (
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary, #555)', margin: 0, whiteSpace: 'pre-line' }}>
                  {cv.summary || (isOwnProfile ? 'Agrega un resumen profesional para destacar tu perfil.' : 'Sin informacion disponible.')}
                </p>
              )}

              {/* Competencies tags */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Competencias Clave</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cv.competencies.map((c, i) => (
                    <span key={i} style={styles.tag}>
                      {c}
                      {editMode && (
                        <button onClick={() => removeCompetency(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2, color: 'var(--text-tertiary)' }}>
                          {X({ style: { width: 12, height: 12 } })}
                        </button>
                      )}
                    </span>
                  ))}
                  {editMode && (
                    <input
                      style={{ ...styles.input, width: 180, padding: '5px 12px', fontSize: 13 }}
                      placeholder="Agregar competencia + Enter"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          addCompetency((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  )}
                  {!editMode && cv.competencies.length === 0 && isOwnProfile && (
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Agrega competencias clave para mejorar tu visibilidad.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Experiencia ── */}
          {activeTab === 'experiencia' && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {Briefcase({ style: { width: 20, height: 20, color: '#1e56a0' } })} Experiencia Laboral
                </span>
                {editMode && (
                  <button style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 13 }} className="cv-btn" onClick={addExperience}>
                    {Plus({ style: { width: 14, height: 14 } })} Agregar
                  </button>
                )}
              </div>

              {cv.experience.length === 0 && !editMode && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                  {isOwnProfile ? 'Agrega tu experiencia laboral para completar tu perfil.' : 'Sin experiencia registrada.'}
                </p>
              )}

              <div style={cv.experience.length > 0 ? styles.timeline : {}}>
                {cv.experience.map((exp) => (
                  <div key={exp.id} style={styles.timelineItem}>
                    {!editMode && <div style={styles.timelineDot} />}
                    {editMode ? (
                      <div style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <strong style={{ fontSize: 14 }}>Experiencia</strong>
                          <button onClick={() => removeExperience(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                            {Trash2({ style: { width: 16, height: 16 } })}
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <input style={styles.input} value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} placeholder="Cargo" />
                          <input style={styles.input} value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Empresa" />
                          <input style={styles.input} value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} placeholder="Ubicacion" />
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="date" style={{ ...styles.input, flex: 1 }} value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} />
                            <span style={{ fontSize: 13 }}>-</span>
                            {exp.current ? (
                              <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>Presente</span>
                            ) : (
                              <input type="date" style={{ ...styles.input, flex: 1 }} value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} />
                            )}
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={exp.current} onChange={e => updateExperience(exp.id, 'current', e.target.checked)} />
                          Trabajo actual
                        </label>
                        <textarea style={{ ...styles.textarea, marginTop: 8 }} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} placeholder="Describe tus responsabilidades y logros..." rows={3} />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{exp.title}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {exp.company}{exp.location ? ` - ${exp.location}` : ''}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {Clock({ style: { width: 12, height: 12 } })}
                          {exp.startDate}{exp.current ? ' - Presente' : exp.endDate ? ` - ${exp.endDate}` : ''}
                        </div>
                        {exp.description && (
                          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: 8, whiteSpace: 'pre-line' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Educacion ── */}
          {activeTab === 'educacion' && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {GraduationCap({ style: { width: 20, height: 20, color: '#1e56a0' } })} Educacion
                </span>
                {editMode && (
                  <button style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 13 }} className="cv-btn" onClick={addEducation}>
                    {Plus({ style: { width: 14, height: 14 } })} Agregar
                  </button>
                )}
              </div>

              {cv.education.length === 0 && !editMode && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                  {isOwnProfile ? 'Agrega tu formacion academica.' : 'Sin formacion registrada.'}
                </p>
              )}

              <div style={cv.education.length > 0 ? styles.timeline : {}}>
                {cv.education.map((edu) => (
                  <div key={edu.id} style={styles.timelineItem}>
                    {!editMode && <div style={styles.timelineDot} />}
                    {editMode ? (
                      <div style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <strong style={{ fontSize: 14 }}>Educacion</strong>
                          <button onClick={() => removeEducation(edu.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                            {Trash2({ style: { width: 16, height: 16 } })}
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <input style={styles.input} value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} placeholder="Institucion" />
                          <input style={styles.input} value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="Titulo/Grado" />
                          <input style={styles.input} value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} placeholder="Campo de estudio" />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input style={{ ...styles.input, flex: 1 }} value={edu.startYear} onChange={e => updateEducation(edu.id, 'startYear', e.target.value)} placeholder="Inicio" />
                            <input style={{ ...styles.input, flex: 1 }} value={edu.endYear} onChange={e => updateEducation(edu.id, 'endYear', e.target.value)} placeholder="Fin" />
                          </div>
                        </div>
                        <textarea style={{ ...styles.textarea, marginTop: 8 }} value={edu.description} onChange={e => updateEducation(edu.id, 'description', e.target.value)} placeholder="Descripcion (opcional)" rows={2} />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{edu.degree}{edu.field ? ` en ${edu.field}` : ''}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{edu.institution}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {edu.startYear}{edu.endYear ? ` - ${edu.endYear}` : ''}
                        </div>
                        {edu.description && (
                          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: 6, whiteSpace: 'pre-line' }}>
                            {edu.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Certificaciones ── */}
          {activeTab === 'certificaciones' && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {Award({ style: { width: 20, height: 20, color: '#1e56a0' } })} Certificaciones
                </span>
                {editMode && (
                  <button style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 13 }} className="cv-btn" onClick={addCertification}>
                    {Plus({ style: { width: 14, height: 14 } })} Agregar
                  </button>
                )}
              </div>

              {cv.certifications.length === 0 && !editMode && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                  {isOwnProfile ? 'Agrega tus certificaciones profesionales.' : 'Sin certificaciones registradas.'}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {cv.certifications.map((cert) => (
                  <div key={cert.id} style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12, padding: 16, position: 'relative' }}>
                    {editMode ? (
                      <>
                        <button onClick={() => removeCertification(cert.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          {Trash2({ style: { width: 14, height: 14 } })}
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input style={styles.input} value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} placeholder="Nombre de certificacion" />
                          <input style={styles.input} value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} placeholder="Entidad emisora" />
                          <input style={styles.input} value={cert.date} onChange={e => updateCertification(cert.id, 'date', e.target.value)} placeholder="Fecha (ej: 2024)" />
                          <input style={styles.input} value={cert.url} onChange={e => updateCertification(cert.id, 'url', e.target.value)} placeholder="URL de verificacion (opcional)" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e56a0, #3d7cc9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {Award({ style: { width: 18, height: 18, color: '#fff' } })}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{cert.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{cert.issuer}</div>
                          </div>
                        </div>
                        {cert.date && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{cert.date}</div>}
                        {cert.url && (
                          <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1e56a0', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
                            Ver credencial {ExternalLink({ style: { width: 12, height: 12 } })}
                          </a>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Habilidades ── */}
          {activeTab === 'habilidades' && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {Zap({ style: { width: 20, height: 20, color: '#1e56a0' } })} Habilidades
                </span>
                {editMode && (
                  <button style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 13 }} className="cv-btn" onClick={addSkillGroup}>
                    {Plus({ style: { width: 14, height: 14 } })} Agregar Categoria
                  </button>
                )}
              </div>

              {cv.skillGroups.length === 0 && !editMode && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                  {isOwnProfile ? 'Organiza tus habilidades por categoria.' : 'Sin habilidades registradas.'}
                </p>
              )}

              {cv.skillGroups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: 24 }}>
                  {editMode ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <input
                        style={{ ...styles.input, fontWeight: 600, flex: 1 }}
                        value={group.category}
                        onChange={e => {
                          const groups = [...cv.skillGroups]
                          groups[gi] = { ...groups[gi], category: e.target.value }
                          updateField('skillGroups', groups)
                        }}
                        placeholder="Nombre de categoria (ej: Software, Gestion, Tecnico)"
                      />
                      <button onClick={() => addSkillToGroup(gi)} style={{ ...styles.btnSecondary, padding: '6px 12px', fontSize: 12 }} className="cv-btn">
                        {Plus({ style: { width: 12, height: 12 } })} Habilidad
                      </button>
                      <button onClick={() => removeSkillGroup(gi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        {Trash2({ style: { width: 16, height: 16 } })}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{group.category}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.skills.map((skill, si) => (
                      <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {editMode ? (
                          <>
                            <input
                              style={{ ...styles.input, width: 180 }}
                              value={skill.name}
                              onChange={e => updateSkillInGroup(gi, si, 'name', e.target.value)}
                              placeholder="Habilidad"
                            />
                            <input
                              type="range"
                              min={10}
                              max={100}
                              step={5}
                              value={skill.level}
                              onChange={e => updateSkillInGroup(gi, si, 'level', Number(e.target.value))}
                              style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', width: 36, textAlign: 'right' }}>{skill.level}%</span>
                            <button onClick={() => removeSkillFromGroup(gi, si)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              {X({ style: { width: 14, height: 14 } })}
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 14, color: 'var(--text-primary)', width: 160, flexShrink: 0 }}>{skill.name}</span>
                            <div style={styles.skillBar}>
                              <div style={{ ...styles.skillFill, width: `${skill.level}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 36, textAlign: 'right' }}>{skill.level}%</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: Diferenciadores ── */}
          {activeTab === 'diferenciadores' && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {Target({ style: { width: 20, height: 20, color: '#1e56a0' } })} Lo que me diferencia
                </span>
                {editMode && (
                  <button style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 13 }} className="cv-btn" onClick={addDifferentiator}>
                    {Plus({ style: { width: 14, height: 14 } })} Agregar
                  </button>
                )}
              </div>

              {cv.differentiators.length === 0 && !editMode && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                  {isOwnProfile ? 'Destaca lo que te hace unico como profesional.' : 'Sin informacion disponible.'}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cv.differentiators.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, background: 'var(--bg-secondary, #f9fafb)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1e56a0, #3d7cc9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {Star({ style: { width: 16, height: 16, color: '#fff' } })}
                    </div>
                    {editMode ? (
                      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                        <textarea
                          style={{ ...styles.textarea, minHeight: 40 }}
                          value={d}
                          onChange={e => {
                            const arr = [...cv.differentiators]
                            arr[i] = e.target.value
                            updateField('differentiators', arr)
                          }}
                          placeholder="Describe tu propuesta de valor unica..."
                          rows={2}
                        />
                        <button onClick={() => removeDifferentiator(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', alignSelf: 'flex-start' }}>
                          {Trash2({ style: { width: 16, height: 16 } })}
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{d}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Upload Zone (edit mode, sobre tab) ── */}
          {editMode && activeTab === 'sobre' && isOwnProfile && (
            <div style={{ ...styles.card, marginTop: 20 }}>
              <div style={styles.cardTitle}>Importar desde documento</div>
              <div
                className="cv-upload-zone"
                style={styles.uploadZone}
                onClick={() => fileRef.current?.click()}
              >
                {Upload({ style: { width: 32, height: 32, color: '#1e56a0', marginBottom: 8 } })}
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>
                  Arrastra o haz clic para subir tu CV
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  PDF o Word (.docx) - Maximo 10 MB
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar (right) ── */}
        <div style={styles.sidebar}>
          {/* Quick stats */}
          <div style={styles.card}>
            <div style={{ ...styles.cardTitle, fontSize: 15 }}>Estadisticas</div>
            <div style={styles.statRow}>
              <span style={{ color: 'var(--text-secondary)' }}>Anos de experiencia</span>
              <strong style={{ color: 'var(--text-primary)' }}>{yearsExp}</strong>
            </div>
            <div style={styles.statRow}>
              <span style={{ color: 'var(--text-secondary)' }}>Empresas</span>
              <strong style={{ color: 'var(--text-primary)' }}>{companiesCount}</strong>
            </div>
            <div style={{ ...styles.statRow, borderBottom: 'none' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Certificaciones</span>
              <strong style={{ color: 'var(--text-primary)' }}>{certsCount}</strong>
            </div>
          </div>

          {/* Open to offers toggle */}
          {isOwnProfile && (
            <div style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Abierto a ofertas</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Los reclutadores pueden contactarte</div>
                </div>
                <button
                  style={{
                    ...styles.toggle,
                    background: cv.openToOffers ? '#059669' : 'var(--bg-secondary, #d1d5db)',
                  }}
                  onClick={() => updateField('openToOffers', !cv.openToOffers)}
                >
                  <div style={{ ...styles.toggleDot, left: cv.openToOffers ? 23 : 3 }} />
                </button>
              </div>
            </div>
          )}

          {/* Visibility */}
          {isOwnProfile && (
            <div style={styles.card}>
              <div style={{ ...styles.cardTitle, fontSize: 15 }}>Visibilidad del perfil</div>
              {(['public', 'connections', 'private'] as const).map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="cv-visibility"
                    checked={cv.visibility === v}
                    onChange={() => updateField('visibility', v)}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v === 'public' && Globe({ style: { width: 14, height: 14 } })}
                    {v === 'connections' && Users({ style: { width: 14, height: 14 } })}
                    {v === 'private' && EyeOff({ style: { width: 14, height: 14 } })}
                    {v === 'public' ? 'Publico' : v === 'connections' ? 'Solo conexiones' : 'Privado'}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Languages */}
          <div style={styles.card}>
            <div style={{ ...styles.cardTitle, fontSize: 15 }}>
              Idiomas
              {editMode && (
                <button onClick={addLanguage} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e56a0' }}>
                  {Plus({ style: { width: 16, height: 16 } })}
                </button>
              )}
            </div>
            {cv.languages.length === 0 && !editMode && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sin idiomas registrados.</p>
            )}
            {cv.languages.map((lang, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {editMode ? (
                  <>
                    <input style={{ ...styles.input, flex: 1 }} value={lang.name} onChange={e => {
                      const langs = [...cv.languages]; langs[i] = { ...langs[i], name: e.target.value }; updateField('languages', langs)
                    }} placeholder="Idioma" />
                    <select style={{ ...styles.input, width: 140 }} value={lang.level} onChange={e => {
                      const langs = [...cv.languages]; langs[i] = { ...langs[i], level: e.target.value }; updateField('languages', langs)
                    }}>
                      {LANG_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={() => removeLanguage(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      {X({ style: { width: 14, height: 14 } })}
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lang.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{lang.level}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Links */}
          <div style={styles.card}>
            <div style={{ ...styles.cardTitle, fontSize: 15 }}>
              Enlaces
              {editMode && (
                <button onClick={addLink} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e56a0' }}>
                  {Plus({ style: { width: 16, height: 16 } })}
                </button>
              )}
            </div>
            {cv.links.length === 0 && !editMode && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sin enlaces registrados.</p>
            )}
            {cv.links.map((lnk, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                {editMode ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input style={{ ...styles.input, width: 100 }} value={lnk.label} onChange={e => {
                      const links = [...cv.links]; links[i] = { ...links[i], label: e.target.value }; updateField('links', links)
                    }} placeholder="Etiqueta" />
                    <input style={{ ...styles.input, flex: 1 }} value={lnk.url} onChange={e => {
                      const links = [...cv.links]; links[i] = { ...links[i], url: e.target.value }; updateField('links', links)
                    }} placeholder="URL" />
                    <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      {X({ style: { width: 14, height: 14 } })}
                    </button>
                  </div>
                ) : (
                  <a href={lnk.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1e56a0', textDecoration: 'none', padding: '4px 0' }}>
                    {Link({ style: { width: 14, height: 14 } })} {lnk.label || lnk.url}
                    {ExternalLink({ style: { width: 12, height: 12, opacity: 0.5 } })}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
