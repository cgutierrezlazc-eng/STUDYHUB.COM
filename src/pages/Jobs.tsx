import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { Briefcase, Sparkles, Search as SearchIcon, ClipboardList, GraduationCap, Users, FileText, Briefcase as BuildingIcon, Lock, Globe, RefreshCw, Star, CheckCircle, XCircle, Hourglass, Eye, Target, Map, BookOpen, Download, Upload, Share2, Save, Plus, Trash2, Award, Zap } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

/* ── CV Types ── */
interface Experience {
  id: string; company: string; title: string; location: string
  startDate: string; endDate: string; current: boolean; description: string
}
interface Education {
  id: string; institution: string; degree: string; field: string
  startYear: string; endYear: string; description: string
}
interface Certification {
  id: string; name: string; issuer: string; date: string; url: string
}
interface SkillGroup {
  category: string; skills: { name: string; level: number }[]
}
interface CVData {
  headline: string; summary: string; location: string; email: string; phone: string
  availableWorldwide: boolean; openToOffers: boolean
  experience: Experience[]; education: Education[]; certifications: Certification[]
  skillGroups: SkillGroup[]; differentiators: string[]
  languages: { name: string; level: string }[]
  links: { label: string; url: string }[]
  competencies: string[]
  visibility: 'public' | 'private' | 'connections' | 'recruiters'
}

const EMPTY_CV: CVData = {
  headline: '', summary: '', location: '', email: '', phone: '',
  availableWorldwide: false, openToOffers: false,
  experience: [], education: [], certifications: [],
  skillGroups: [], differentiators: [], languages: [],
  links: [], competencies: [], visibility: 'private',
}

const LANG_LEVELS_KEYS = ['jobs.langBasic', 'jobs.langIntermediate', 'jobs.langAdvanced', 'jobs.langNative']
const CV_LANGUAGES = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Portugues' },
  { value: 'fr', label: 'Francais' },
]

function genId() { return Math.random().toString(36).slice(2, 10) }

function parseJsonField(val: any, fallback: any) {
  if (!val) return fallback
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { return JSON.parse(val) } catch { return fallback } }
  return fallback
}

const JOB_TYPE_KEYS: { value: string; labelKey: string }[] = [
  { value: '', labelKey: 'jobs.allTypes' },
  { value: 'full_time', labelKey: 'jobs.fullTime' },
  { value: 'part_time', labelKey: 'jobs.partTime' },
  { value: 'internship', labelKey: 'jobs.internship' },
  { value: 'freelance', labelKey: 'jobs.freelance' },
  { value: 'remote', labelKey: 'jobs.remote' },
]

const EXP_LEVEL_KEYS: Record<string, string> = {
  entry: 'jobs.expJunior', mid: 'jobs.expMid', senior: 'jobs.expSenior', any: 'jobs.expAny',
}

type TabKey = 'profile' | 'listings' | 'cvs' | 'cv-coach' | 'candidates' | 'my-apps' | 'my-listings' | 'tutoring' | 'recruiter' | 'matches'

const TAB_CONFIG_KEYS: { key: TabKey; labelKey: string; icon: (p?: any) => React.ReactNode }[] = [
  { key: 'profile', labelKey: 'jobs.tabProfile', icon: (p) => FileText(p) },
  { key: 'listings', labelKey: 'jobs.tabListings', icon: (p) => ClipboardList(p) },
  { key: 'matches', labelKey: 'jobs.tabMatches', icon: (p) => Sparkles(p) },
  { key: 'cvs', labelKey: 'jobs.tabCvs', icon: (p) => FileText(p) },
  { key: 'cv-coach', labelKey: 'jobs.tabCvCoach', icon: (p) => Sparkles(p) },
  { key: 'tutoring', labelKey: 'jobs.tabTutoring', icon: (p) => GraduationCap(p) },
  { key: 'candidates', labelKey: 'jobs.tabCandidates', icon: (p) => Users(p) },
  { key: 'my-apps', labelKey: 'jobs.tabMyApps', icon: (p) => FileText(p) },
  { key: 'my-listings', labelKey: 'jobs.tabMyListings', icon: (p) => BuildingIcon(p) },
  { key: 'recruiter', labelKey: 'jobs.tabRecruiter', icon: (p) => Lock(p) },
]

/* ── Inline styles for CV section ── */
const cvStyles: Record<string, React.CSSProperties> = {
  section: {
    background: 'var(--bg-primary, #fff)', borderRadius: 16,
    padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #1a1a2e)',
    marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border, #e0e0e0)', fontSize: 14,
    background: 'var(--bg-primary, #fff)', color: 'var(--text-primary, #333)',
    outline: 'none', boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border, #e0e0e0)', fontSize: 14,
    background: 'var(--bg-primary, #fff)', color: 'var(--text-primary, #333)',
    outline: 'none', resize: 'vertical' as const, minHeight: 80,
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500,
    background: 'var(--bg-secondary, #eef2f7)', color: 'var(--text-primary, #333)',
  },
  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: 'transparent',
    color: 'var(--accent, #2D62C8)', border: '1px dashed var(--accent, #2D62C8)',
    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  removeBtn: {
    background: 'none', border: 'none', color: 'var(--accent-red, #dc2626)',
    cursor: 'pointer', padding: 4, borderRadius: 6, display: 'inline-flex',
  },
  skillBar: {
    height: 8, borderRadius: 4, background: 'var(--bg-secondary, #e5e7eb)',
    overflow: 'hidden', flex: 1,
  },
  skillFill: {
    height: '100%', borderRadius: 4,
    background: 'linear-gradient(90deg, #1e56a0, #3d7cc9)', transition: 'width .4s ease',
  },
  entryCard: {
    border: '1px solid var(--border, #e5e7eb)', borderRadius: 12,
    padding: 16, marginBottom: 12, position: 'relative' as const,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: 4, display: 'block' },
}

export default function Jobs({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState<TabKey>('profile')
  const [publicCVs, setPublicCVs] = useState<any[]>([])
  const [cvSearch, setCvSearch] = useState('')
  const [cvLoading, setCvLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [myApps, setMyApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showApply, setShowApply] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [careerStatus, setCareerStatus] = useState<any>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [tutorings, setTutorings] = useState<any[]>([])
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null)
  const [showTutoringForm, setShowTutoringForm] = useState(false)
  const [showRecruiterForm, setShowRecruiterForm] = useState(false)
  const [tutoringForm, setTutoringForm] = useState({
    subject: '', category: '', level: 'university', modality: 'online',
    price_per_hour: '', currency: 'USD', is_free: false, free_trial: false,
    session_duration: 60, description: '', experience_years: 0,
    availability: [] as string[], location: '', tags: '', max_students: 1,
  })
  const [recruiterForm, setRecruiterForm] = useState({
    company_name: '', corporate_email: '', recruiter_title: '',
    company_website: '', company_size: '', industry: '', tax_id: '',
    phone: '', country: '', city: '', company_description: '', linkedin_url: '',
  })

  // Job posting form
  const [form, setForm] = useState({
    company_name: '', job_title: '', job_type: 'full_time', location: '',
    is_remote: false, salary_min: '', salary_max: '', salary_currency: 'USD',
    description: '', requirements: '', benefits: '', career_field: '',
    experience_level: 'entry', education_level: 'any', contact_email: '',
    application_deadline: '', konni_broadcast: false,
  })

  // CV Profile state
  const [cv, setCv] = useState<CVData>({ ...EMPTY_CV })
  const [cvLoadingProfile, setCvLoadingProfile] = useState(false)
  const [cvSaving, setCvSaving] = useState(false)
  const [cvUploadMsg, setCvUploadMsg] = useState('')
  const [cvLang, setCvLang] = useState('es')
  const [competencyInput, setCompetencyInput] = useState('')
  const [showRecruiterModal, setShowRecruiterModal] = useState(false)
  const [recruiterList, setRecruiterList] = useState<any[]>([])
  const [recruiterListLoading, setRecruiterListLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Job matches (system-suggested)
  const [myMatches, setMyMatches] = useState<any[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)

  // CV Coach state
  const [coachText, setCoachText] = useState('')
  const [coachRole, setCoachRole] = useState('')
  const [coachResult, setCoachResult] = useState<any>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState('')

  // Quick Apply & local application tracking
  const [showQuickApply, setShowQuickApply] = useState(false)
  const [localApps, setLocalApps] = useState<Record<string, { jobTitle: string; companyName: string; date: string; status: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('conniku_applications') || '{}') } catch { return {} }
  })
  const saveLocalApp = (job: any) => {
    const next = { ...localApps, [job.id]: { jobTitle: job.jobTitle, companyName: job.companyName, date: new Date().toISOString().slice(0, 10), status: 'Enviada' } }
    setLocalApps(next)
    localStorage.setItem('conniku_applications', JSON.stringify(next))
  }
  const localAppCount = Object.keys(localApps).length

  // Match score heuristic
  const getMatchScore = (job: any): { pct: number; label: string; icon: string } => {
    const userKeywords = [user?.career, ...(cv.competencies || []), ...(cv.skillGroups?.flatMap(g => g.skills.map(s => s.name)) || [])].filter(Boolean).map(k => (k as string).toLowerCase())
    if (userKeywords.length === 0) return { pct: 0, label: '', icon: '' }
    const jobText = `${job.jobTitle} ${job.description || ''} ${job.requirements || ''} ${job.careerField || ''}`.toLowerCase()
    const matches = userKeywords.filter(kw => jobText.includes(kw)).length
    const pct = Math.min(99, Math.round((matches / Math.max(userKeywords.length, 1)) * 100))
    if (pct >= 60) return { pct, label: 'Alta compatibilidad', icon: '\u26A1' }
    if (pct >= 30) return { pct, label: 'Media', icon: '\uD83D\uDCCA' }
    if (pct > 0) return { pct, label: 'Baja', icon: '\u2753' }
    return { pct: 0, label: '', icon: '' }
  }

  useEffect(() => {
    loadJobs()
    loadMyCV()
    api.getCareerStatus().then(setCareerStatus).catch(() => {})
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const data = await api.getJobListings(search || undefined, jobTypeFilter || undefined)
      setJobs(data.jobs || [])
    } catch (err: any) { console.error('Failed to load jobs:', err) }
    setLoading(false)
  }

  const loadCandidates = async () => {
    try {
      const data = await api.browseCandidates(search || undefined)
      setCandidates(data.candidates || [])
    } catch (err: any) { console.error('Failed to load candidates:', err) }
  }

  const loadMyApps = async () => {
    try { setMyApps(await api.getMyApplications()) } catch (err: any) { console.error('Failed to load applications:', err) }
  }

  const loadMyMatches = async () => {
    setMatchesLoading(true)
    try { setMyMatches(await api.getMyJobMatches()) } catch (err: any) { console.error('Failed to load matches:', err) }
    setMatchesLoading(false)
  }

  const loadTutorings = async () => {
    try {
      const data = await api.getTutoringListings()
      setTutorings(data.listings || [])
    } catch (err: any) { console.error('Failed to load tutorings:', err) }
  }

  const loadPublicCVs = async (q?: string) => {
    setCvLoading(true)
    try {
      const data = await api.getPublicCVs(q || undefined)
      setPublicCVs(data.cvs || [])
    } catch (err) { console.error('Failed to load public CVs:', err) }
    setCvLoading(false)
  }

  const loadRecruiter = async () => {
    try {
      setRecruiterProfile(await api.getRecruiterProfile())
    } catch (err: any) { console.error('Failed to load recruiter profile:', err) }
  }

  /* ── CV Profile loaders ── */
  const loadMyCV = async () => {
    setCvLoadingProfile(true)
    try {
      const cvRes = await api.getMyCV().catch(() => null)
      if (cvRes) hydrateCV(cvRes)
    } catch (e) { console.error('Error loading CV:', e) }
    setCvLoadingProfile(false)
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

  const handleSaveCV = async () => {
    setCvSaving(true)
    try {
      await api.updateCV({
        headline: cv.headline, summary: cv.summary, location: cv.location,
        email: cv.email, phone: cv.phone,
        available_worldwide: cv.availableWorldwide, open_to_offers: cv.openToOffers,
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
      alert(t('jobs.savedSuccessfully'))
    } catch (e: any) {
      alert(e.message || t('jobs.errorSaving'))
    }
    setCvSaving(false)
  }

  const handleCVFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCvUploadMsg(t('jobs.processingDoc'))
    try {
      const res = await api.uploadCV(file)
      if (res.draft) {
        setCv(prev => ({
          ...prev,
          headline: res.draft.headline || prev.headline,
          summary: res.draft.summary || prev.summary,
          competencies: parseJsonField(res.draft.competencies, prev.competencies),
          skillGroups: parseJsonField(res.draft.skill_groups || res.draft.skills, prev.skillGroups),
          experience: parseJsonField(res.draft.experience, prev.experience),
          education: parseJsonField(res.draft.education, prev.education),
          certifications: parseJsonField(res.draft.certifications, prev.certifications),
          languages: parseJsonField(res.draft.languages, prev.languages),
          differentiators: parseJsonField(res.draft.differentiators, prev.differentiators),
        }))
        setCvUploadMsg(res.message || t('jobs.docProcessed'))
      }
    } catch (err: any) {
      setCvUploadMsg(err.message || t('jobs.errorProcessing'))
    }
  }

  const handleDownloadCVPDF = () => {
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('jobs.defaultProfessional')
    const skills = cv.skillGroups.flatMap(g => g.skills.map(s => s.name)).join(', ')
    const langs = cv.languages.map(l => `${l.name} (${l.level})`).join(', ')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>CV - ${name}</title>
<style>
@page { size: letter; margin: 2cm 2.5cm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #222; }
h1 { font-size: 20pt; margin-bottom: 2pt; }
h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; color: #2D62C8; border-bottom: 1.5px solid #2D62C8; padding-bottom: 3pt; margin: 14pt 0 6pt; }
.contact { font-size: 9pt; color: #555; margin-bottom: 10pt; }
.summary { margin-bottom: 10pt; }
.entry { margin-bottom: 8pt; }
.entry-title { font-weight: 700; font-size: 10pt; }
.entry-sub { font-size: 9pt; color: #555; }
.entry-desc { font-size: 9.5pt; margin-top: 2pt; }
.skills-list { display: flex; flex-wrap: wrap; gap: 4pt; }
.skill-tag { font-size: 8.5pt; padding: 2pt 6pt; background: #EEF2F7; border-radius: 3pt; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<h1>${name}</h1>
${cv.headline ? `<div style="font-size:11pt;color:#2D62C8;margin-bottom:4pt;">${cv.headline}</div>` : ''}
<div class="contact">${[cv.location, cv.email, cv.phone].filter(Boolean).join(' · ')}</div>
${cv.summary ? `<h2>${t('jobs.pdfProfile')}</h2><div class="summary">${cv.summary}</div>` : ''}
${cv.experience.length ? `<h2>${t('jobs.pdfExperience')}</h2>${cv.experience.map(e => `<div class="entry"><div class="entry-title">${e.title} — ${e.company}</div><div class="entry-sub">${e.location ? e.location + ' · ' : ''}${e.startDate} - ${e.current ? t('jobs.pdfPresent') : e.endDate}</div>${e.description ? `<div class="entry-desc">${e.description}</div>` : ''}</div>`).join('')}` : ''}
${cv.education.length ? `<h2>${t('jobs.pdfEducation')}</h2>${cv.education.map(e => `<div class="entry"><div class="entry-title">${e.degree} en ${e.field}</div><div class="entry-sub">${e.institution} · ${e.startYear} - ${e.endYear}</div>${e.description ? `<div class="entry-desc">${e.description}</div>` : ''}</div>`).join('')}` : ''}
${skills ? `<h2>${t('jobs.pdfSkills')}</h2><div class="skills-list">${cv.skillGroups.flatMap(g => g.skills.map(s => `<span class="skill-tag">${s.name}</span>`)).join('')}</div>` : ''}
${cv.certifications.length ? `<h2>${t('jobs.pdfCertifications')}</h2>${cv.certifications.map(c => `<div class="entry"><div class="entry-title">${c.name}</div><div class="entry-sub">${c.issuer} · ${c.date}</div></div>`).join('')}` : ''}
${langs ? `<h2>${t('jobs.pdfLanguages')}</h2><div>${langs}</div>` : ''}
${cv.competencies.length ? `<h2>${t('jobs.pdfCompetencies')}</h2><div class="skills-list">${cv.competencies.map(c => `<span class="skill-tag">${c}</span>`).join('')}</div>` : ''}
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  const handleShareWithRecruiters = async () => {
    setShowRecruiterModal(true)
    setRecruiterListLoading(true)
    try {
      const data = await api.getPublicCVs()
      // Try to extract recruiter-type users; fallback to showing all public profiles
      setRecruiterList(data.cvs || data.recruiters || [])
    } catch (e) { console.error(e) }
    setRecruiterListLoading(false)
  }

  const handleSendCVToRecruiter = async (recruiterId: string) => {
    try {
      // Save CV first to ensure it's up to date, then navigate to messages
      await handleSaveCV()
      onNavigate('/messages')
    } catch (e) { onNavigate('/messages') }
  }

  /* ── CV field helpers ── */
  function updateCV<K extends keyof CVData>(field: K, value: CVData[K]) {
    setCv(prev => ({ ...prev, [field]: value }))
  }
  function addExperience() {
    updateCV('experience', [...cv.experience, { id: genId(), company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }])
  }
  function removeExperience(id: string) { updateCV('experience', cv.experience.filter(e => e.id !== id)) }
  function updateExperience(id: string, field: keyof Experience, value: any) {
    updateCV('experience', cv.experience.map(e => e.id === id ? { ...e, [field]: value } : e))
  }
  function addEducation() {
    updateCV('education', [...cv.education, { id: genId(), institution: '', degree: '', field: '', startYear: '', endYear: '', description: '' }])
  }
  function removeEducation(id: string) { updateCV('education', cv.education.filter(e => e.id !== id)) }
  function updateEducation(id: string, field: keyof Education, value: any) {
    updateCV('education', cv.education.map(e => e.id === id ? { ...e, [field]: value } : e))
  }
  function addCertification() {
    updateCV('certifications', [...cv.certifications, { id: genId(), name: '', issuer: '', date: '', url: '' }])
  }
  function removeCertification(id: string) { updateCV('certifications', cv.certifications.filter(c => c.id !== id)) }
  function updateCertification(id: string, field: keyof Certification, value: string) {
    updateCV('certifications', cv.certifications.map(c => c.id === id ? { ...c, [field]: value } : c))
  }
  function addSkillGroup() { updateCV('skillGroups', [...cv.skillGroups, { category: '', skills: [] }]) }
  function removeSkillGroup(idx: number) { updateCV('skillGroups', cv.skillGroups.filter((_, i) => i !== idx)) }
  function addSkillToGroup(groupIdx: number) {
    const groups = [...cv.skillGroups]
    groups[groupIdx] = { ...groups[groupIdx], skills: [...groups[groupIdx].skills, { name: '', level: 70 }] }
    updateCV('skillGroups', groups)
  }
  function removeSkillFromGroup(groupIdx: number, skillIdx: number) {
    const groups = [...cv.skillGroups]
    groups[groupIdx] = { ...groups[groupIdx], skills: groups[groupIdx].skills.filter((_, i) => i !== skillIdx) }
    updateCV('skillGroups', groups)
  }
  function updateSkillInGroup(groupIdx: number, skillIdx: number, field: string, value: any) {
    const groups = [...cv.skillGroups]
    const skills = [...groups[groupIdx].skills]
    skills[skillIdx] = { ...skills[skillIdx], [field]: value }
    groups[groupIdx] = { ...groups[groupIdx], skills }
    updateCV('skillGroups', groups)
  }
  function addLanguage() { updateCV('languages', [...cv.languages, { name: '', level: 'Intermedio' }]) }
  function removeLanguage(idx: number) { updateCV('languages', cv.languages.filter((_, i) => i !== idx)) }
  function addDifferentiator() { updateCV('differentiators', [...cv.differentiators, '']) }
  function removeDifferentiator(idx: number) { updateCV('differentiators', cv.differentiators.filter((_, i) => i !== idx)) }
  function addCompetency(text: string) {
    if (text.trim() && !cv.competencies.includes(text.trim())) {
      updateCV('competencies', [...cv.competencies, text.trim()])
    }
  }
  function removeCompetency(idx: number) { updateCV('competencies', cv.competencies.filter((_, i) => i !== idx)) }

  const handleCreateTutoring = async () => {
    if (!tutoringForm.subject) { alert(t('jobs.subjectRequired2')); return }
    try {
      await api.createTutoringListing({
        ...tutoringForm,
        price_per_hour: tutoringForm.price_per_hour ? Number(tutoringForm.price_per_hour) : null,
        tags: tutoringForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      setShowTutoringForm(false)
      loadTutorings()
      alert(t('jobs.tutoringPublished'))
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleRegisterRecruiter = async () => {
    if (!recruiterForm.company_name || !recruiterForm.corporate_email || !recruiterForm.recruiter_title) {
      alert(t('jobs.fillRequired')); return
    }
    try {
      const result = await api.registerRecruiter(recruiterForm)
      alert(result.message || t('jobs.registrationSent'))
      loadRecruiter()
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleRequestTutoring = async (listingId: string) => {
    const message = prompt(t('jobs.tutoringMessagePrompt'))
    try {
      await api.requestTutoring(listingId, { message: message || '' })
      alert(t('jobs.tutoringRequestSent'))
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleApply = async (jobId: string) => {
    try {
      await api.applyToJob(jobId, { cover_letter: coverLetter, resume_url: careerStatus?.resumeUrl })
      setShowApply(false)
      setCoverLetter('')
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, applied: true } : j))
      alert(t('jobs.applicationSuccess'))
    } catch (err: any) {
      alert(err.message || t('jobs.errorApplying'))
    }
  }

  const handlePostJob = async () => {
    if (!form.company_name || !form.job_title || !form.description) {
      alert('Completa los campos obligatorios')
      return
    }
    try {
      await api.createJobListing({
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        application_deadline: form.application_deadline ? new Date(form.application_deadline).toISOString() : null,
      })
      setShowPostForm(false)
      setForm({ company_name: '', job_title: '', job_type: 'full_time', location: '', is_remote: false, salary_min: '', salary_max: '', salary_currency: 'USD', description: '', requirements: '', benefits: '', career_field: '', experience_level: 'entry', education_level: 'any', contact_email: '', application_deadline: '', konni_broadcast: false })
      alert(t('jobs.offerPublished'))
      loadJobs()
    } catch (err: any) {
      alert(err.message || t('jobs.errorPublishing'))
    }
  }

  const toggleOpenToWork = async () => {
    const newVal = !(careerStatus?.isOpenToOpportunities)
    try {
      const result = await api.updateCareerStatus({
        status: careerStatus?.status || 'studying',
        is_open_to_opportunities: newVal,
        headline: careerStatus?.headline || '',
      })
      setCareerStatus((prev: any) => ({ ...prev, isOpenToOpportunities: newVal }))
    } catch (err: any) { console.error('Failed to update career status:', err) }
  }

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null
    const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n)
    if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}`
    if (min) return `${t('jobs.salaryFrom')} ${currency} ${fmt(min)}`
    return `${t('jobs.salaryUpTo')} ${currency} ${fmt(max!)}`
  }

  const runCvCoach = async () => {
    if (coachText.trim().length < 30) { setCoachError(t('jobs.cvMinChars')); return }
    setCoachLoading(true); setCoachError(''); setCoachResult(null)
    try {
      const res = await api.cvCoach(coachText, coachRole)
      setCoachResult(res)
    } catch (err: any) { setCoachError(err.message || t('jobs.errorAnalyzing')) }
    finally { setCoachLoading(false) }
  }

  const handleTabChange = (t: TabKey) => {
    setTab(t)
    if (t === 'profile') loadMyCV()
    if (t === 'cvs') loadPublicCVs()
    if (t === 'candidates') loadCandidates()
    if (t === 'my-apps') loadMyApps()
    if (t === 'matches') loadMyMatches()
    if (t === 'tutoring') loadTutorings()
    if (t === 'recruiter') loadRecruiter()
  }

  /* ══════════════════════════════════════════════════
     RENDER: Professional Profile Tab
  ══════════════════════════════════════════════════ */
  const renderProfileTab = () => {
    if (cvLoadingProfile) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>

    const displayName = (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username) || t('jobs.defaultProfessional')
    const totalSkills = cv.skillGroups?.reduce((acc, g) => acc + (g.skills?.length || 0), 0) || 0
    const totalExp = cv.experience?.length || 0
    const totalEdu = cv.education?.length || 0

    return (
      <div>
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleCVFileUpload} />

        {/* ── CV Hero — fuente única en /cv ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2D62C8 100%)',
          borderRadius: 14, padding: '20px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              {displayName}
            </div>
            {cv.headline && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>{cv.headline}</div>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {totalExp > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>💼 {totalExp} experiencia{totalExp !== 1 ? 's' : ''}</span>}
              {totalEdu > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>🎓 {totalEdu} educación</span>}
              {totalSkills > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>⚡ {totalSkills} habilidades</span>}
            </div>
          </div>
          <button
            onClick={() => onNavigate('/cv')}
            style={{ padding: '10px 20px', background: '#fff', color: '#1e3a8a', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {FileText({ size: 14 })} Editar mi CV →
          </button>
        </div>

        {/* ── Acciones rápidas ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            {Upload({ size: 14 })} {t('jobs.uploadCv')}
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadCVPDF}>
            {Download({ size: 14 })} {t('jobs.downloadCvPdf')}
          </button>
          <button className="btn btn-secondary" onClick={handleShareWithRecruiters}>
            {Share2({ size: 14 })} {t('jobs.shareWithRecruiters')}
          </button>
        </div>

        {cvUploadMsg && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(45,98,200,0.08)', color: '#2D62C8', fontSize: 13, marginBottom: 16 }}>
            {cvUploadMsg}
          </div>
        )}

        {/* ── Visibilidad y disponibilidad ── */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            {Eye({ size: 16 })} {t('jobs.profileVisibility')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {([
              { value: 'public', label: t('jobs.visPublic') },
              { value: 'connections', label: t('jobs.visFriends') },
              { value: 'recruiters', label: t('jobs.visRecruiters') },
              { value: 'private', label: t('jobs.visPrivate') },
            ] as const).map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 10, background: cv.visibility === opt.value ? 'rgba(45,98,200,0.1)' : 'var(--bg-secondary)', border: cv.visibility === opt.value ? '1px solid rgba(45,98,200,0.3)' : '1px solid var(--border)' }}>
                <input type="radio" name="cv-visibility" checked={cv.visibility === opt.value}
                  onChange={() => { setCv(prev => ({ ...prev, visibility: opt.value })); api.updateCV({ visibility: opt.value }).catch(() => {}) }} style={{ accentColor: '#2D62C8' }} />
                {opt.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('jobs.openToOffers')}</span>
            <button
              onClick={() => { const next = !cv.openToOffers; setCv(prev => ({ ...prev, openToOffers: next })); api.updateCV({ open_to_offers: next }).catch(() => {}) }}
              style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: cv.openToOffers ? '#059669' : 'var(--bg-tertiary, #d1d5db)', position: 'relative', transition: 'background .2s' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: cv.openToOffers ? 25 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            {cv.openToOffers && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>{t('jobs.active')}</span>}
          </div>
        </div>

        {/* ── Preview del CV ── */}
        {(cv.summary || cv.skillGroups?.length > 0 || cv.experience?.length > 0) && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Vista previa del CV</div>

            {cv.summary && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Resumen</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                  {cv.summary.length > 200 ? cv.summary.slice(0, 200) + '…' : cv.summary}
                </p>
              </div>
            )}

            {cv.skillGroups?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Habilidades</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cv.skillGroups.flatMap(g => g.skills || []).slice(0, 12).map((s, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(45,98,200,0.08)', color: '#2D62C8', border: '1px solid rgba(45,98,200,0.15)' }}>
                      {typeof s === 'string' ? s : s.name}
                    </span>
                  ))}
                  {totalSkills > 12 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{totalSkills - 12} más</span>}
                </div>
              </div>
            )}

            {cv.experience?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Experiencia reciente</div>
                {cv.experience.slice(0, 2).map((exp: any, i: number) => (
                  <div key={i} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: '3px solid rgba(45,98,200,0.3)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{exp.title} — {exp.company}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exp.startDate}{exp.current ? ' · Presente' : exp.endDate ? ` · ${exp.endDate}` : ''}</div>
                  </div>
                ))}
                {cv.experience.length > 2 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>+{cv.experience.length - 2} experiencias más</div>
                )}
              </div>
            )}

            <button onClick={() => onNavigate('/cv')} style={{ marginTop: 16, padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(45,98,200,0.3)', background: 'transparent', color: '#2D62C8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Ver y editar CV completo →
            </button>
          </div>
        )}

        {cv.summary === '' && cv.skillGroups?.length === 0 && cv.experience?.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <h3 style={{ margin: '0 0 8px' }}>Crea tu CV profesional</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Agrega tu experiencia, educación y habilidades para destacar ante los reclutadores.
            </p>
            <button onClick={() => onNavigate('/cv')} className="btn btn-primary">
              {FileText({ size: 14 })} Crear mi CV →
            </button>
          </div>
        )}

        {/* ── Share with Recruiters Modal ── */}
        {showRecruiterModal && (
          <div className="modal-overlay" onClick={() => setShowRecruiterModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>{t('jobs.shareWithRecruitersTitle')}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {t('jobs.shareWithRecruitersDesc')}
              </p>
              {recruiterListLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
              ) : recruiterList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <p>{t('jobs.noRecruitersAvailable')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recruiterList.map((r: any, idx: number) => (
                    <div key={r.userId || idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                      border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-secondary)',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: r.avatar ? `url(${r.avatar}) center/cover` : 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16,
                      }}>
                        {!r.avatar && (r.firstName?.charAt(0) || r.companyName?.charAt(0) || '?')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.firstName || ''} {r.lastName || r.companyName || ''}</div>
                        {r.companyName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.companyName}</div>}
                        {(r.headline || r.recruiterTitle) && <div style={{ fontSize: 12, color: '#2D62C8' }}>{r.headline || r.recruiterTitle}</div>}
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => { setShowRecruiterModal(false); handleSendCVToRecruiter(r.userId || r.id) }}>
                        {t('jobs.send')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowRecruiterModal(false)}>{t('jobs.close')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════════ */
  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h2>{Briefcase()} {t('jobs.title')}</h2>
            <p style={{ marginBottom: 0 }}>{t('jobs.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={toggleOpenToWork}
              className={`btn btn-sm ${careerStatus?.isOpenToOpportunities ? 'btn-primary' : 'btn-secondary'}`}
            >
              {careerStatus?.isOpenToOpportunities ? <>{Sparkles()} {t('jobs.exploringOpportunities')}</> : <>{SearchIcon()} {t('jobs.activateVisibility')}</>}
            </button>
            <button className="btn btn-primary" onClick={() => setShowPostForm(true)}>{t('jobs.postOffer')}</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {TAB_CONFIG_KEYS.map(tc => (
            <button key={tc.key} className={`tab ${tab === tc.key ? 'active' : ''}`} onClick={() => handleTabChange(tc.key)} style={{ flexShrink: 0 }}>
              {tc.icon({ size: 14 })} {t(tc.labelKey)}{tc.key === 'my-apps' && localAppCount > 0 ? ` (${localAppCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* ── Profile Tab ── */}
        {tab === 'profile' && renderProfileTab()}

        {/* Search Bar */}
        {(tab === 'listings' || tab === 'candidates') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'listings' ? loadJobs() : loadCandidates())}
              placeholder={tab === 'listings' ? t('jobs.searchOffers') : t('jobs.searchTalent')}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            {tab === 'listings' && (
              <select value={jobTypeFilter} onChange={e => { setJobTypeFilter(e.target.value); setTimeout(loadJobs, 100) }}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {JOB_TYPE_KEYS.map(jt => <option key={jt.value} value={jt.value}>{t(jt.labelKey)}</option>)}
              </select>
            )}
            <button className="btn btn-primary" onClick={() => tab === 'listings' ? loadJobs() : loadCandidates()}>{t('jobs.searchBtn')}</button>
          </div>
        )}

        {/* Public CVs / Curriculums */}
        {tab === 'cvs' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={cvSearch} onChange={e => setCvSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadPublicCVs(cvSearch)}
                placeholder={t('jobs.searchCvsPlaceholder')}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <button className="btn btn-primary" onClick={() => loadPublicCVs(cvSearch)}>{SearchIcon({ size: 14 })} {t('jobs.searchBtn')}</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {t('jobs.publicCvsDesc')}
            </p>
            {cvLoading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div> :
            publicCVs.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div>{FileText({ size: 48 })}</div>
                <h3>{t('jobs.noPublicCvs')}</h3>
                <p>{t('jobs.noPublicCvsDesc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {publicCVs.map(cv => (
                  <div key={cv.userId} className="u-card hover-lift" style={{ padding: 18, cursor: 'pointer' }}
                    onClick={() => onNavigate(`/user/${cv.userId}`)}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                        background: cv.avatar ? `url(${cv.avatar}) center/cover` : 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 18,
                      }}>
                        {!cv.avatar && (cv.firstName?.charAt(0) || '?')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                          {cv.firstName} {cv.lastName}
                        </div>
                        <div style={{ fontSize: 13, color: '#2D62C8', marginTop: 2 }}>{cv.headline}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {cv.career && <span>{cv.career}</span>}
                          {cv.career && cv.university && <span> · </span>}
                          {cv.university && <span>{cv.university}</span>}
                        </div>
                        {cv.aboutMe && (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5,
                            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                            {cv.aboutMe}
                          </p>
                        )}
                        {cv.skills && cv.skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                            {cv.skills.slice(0, 6).map((s: string, i: number) => (
                              <span key={i} style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 12,
                                background: 'rgba(45,98,200,0.1)', color: '#2D62C8',
                                border: '1px solid rgba(45,98,200,0.15)',
                              }}>{s}</span>
                            ))}
                            {cv.skills.length > 6 && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 6px' }}>
                                +{cv.skills.length - 6} mas
                              </span>
                            )}
                          </div>
                        )}
                        {cv.experience && cv.experience.length > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {Briefcase({ size: 12 })} {cv.experience[0].title} en {cv.experience[0].company}
                            {cv.experience.length > 1 && <span> · +{cv.experience.length - 1} mas</span>}
                          </div>
                        )}
                      </div>
                      <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); onNavigate(`/user/${cv.userId}`) }}
                        style={{ flexShrink: 0 }}>
                        {t('jobs.viewProfile')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CV Coach IA */}
        {tab === 'cv-coach' && (
          <div style={{ maxWidth: 720 }}>
            <div className="u-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {Sparkles({ size: 20, color: '#f59e0b' })}
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{t('jobs.cvCoachTitle')}</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                {t('jobs.cvCoachDesc')}
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={cvStyles.label}>{t('jobs.targetRole')}</label>
                <input value={coachRole} onChange={e => setCoachRole(e.target.value)}
                  placeholder={t('jobs.targetRolePlaceholder')}
                  style={cvStyles.input} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={cvStyles.label}>{t('jobs.cvTextLabel')}</label>
                <textarea value={coachText} onChange={e => { setCoachText(e.target.value); setCoachError('') }}
                  placeholder={t('jobs.cvTextPlaceholder')}
                  style={{ ...cvStyles.textarea, minHeight: 180 }} />
              </div>
              {coachError && <p style={{ color: 'var(--accent-red, #dc2626)', fontSize: 13, marginBottom: 12 }}>{coachError}</p>}
              <button className="btn btn-primary btn-glow" onClick={runCvCoach} disabled={coachLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {coachLoading ? <>{RefreshCw({ size: 14 })} {t('jobs.analyzingCv')}</> : <>{Zap({ size: 14 })} {t('jobs.analyzeCv')}</>}
              </button>
            </div>

            {coachResult && (
              <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Score */}
                <div className="u-card" style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 48, fontWeight: 800, lineHeight: 1,
                    color: (coachResult.score || 0) >= 70 ? '#16a34a' : (coachResult.score || 0) >= 40 ? '#f59e0b' : '#dc2626',
                  }}>
                    {coachResult.score || 0}<span style={{ fontSize: 20, fontWeight: 500 }}>/100</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{t('jobs.overallScore')}</p>
                </div>

                {/* Strengths */}
                {coachResult.strengths && coachResult.strengths.length > 0 && (
                  <div className="u-card">
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {CheckCircle({ size: 16 })} {t('jobs.strengths')}
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {coachResult.strengths.map((s: string, i: number) => (
                        <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {coachResult.improvements && coachResult.improvements.length > 0 && (
                  <div className="u-card">
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {Target({ size: 16 })} {t('jobs.suggestedImprovements')}
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {coachResult.improvements.map((s: string, i: number) => (
                        <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Sections */}
                {coachResult.missing_sections && coachResult.missing_sections.length > 0 && (
                  <div className="u-card">
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {XCircle({ size: 16 })} {t('jobs.missingSections')}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {coachResult.missing_sections.map((s: string, i: number) => (
                        <span key={i} style={{
                          fontSize: 12, padding: '4px 10px', borderRadius: 12,
                          background: 'rgba(220,38,38,0.08)', color: '#dc2626',
                          border: '1px solid rgba(220,38,38,0.15)',
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rewrite Suggestion */}
                {coachResult.rewrite_suggestion && (
                  <div className="u-card">
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {Sparkles({ size: 16 })} {t('jobs.rewriteSuggestion')}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {coachResult.rewrite_suggestion}
                    </p>
                  </div>
                )}

                {/* Tip */}
                {coachResult.tip && (
                  <div className="u-card-flat" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {Award({ size: 18, color: '#f59e0b' })}
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      <strong>{t('jobs.tip')}</strong> {coachResult.tip}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Job Listings */}
        {tab === 'listings' && (
          loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div> :
          jobs.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div>{Briefcase({ size: 48 })}</div>
              <h3>{t('jobs.noOffers')}</h3>
              <p>{t('jobs.beFirstToPost')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(job => (
                <div key={job.id} className="u-card hover-lift" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSelectedJob(job)}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {job.companyLogo ? <img src={job.companyLogo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} /> : BuildingIcon({ size: 20 })}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{job.jobTitle}</h4>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{job.companyName}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>
                          {t(JOB_TYPE_KEYS.find(jt => jt.value === job.jobType)?.labelKey || '') || job.jobType}
                        </span>
                        {job.location && <span style={{ color: 'var(--text-muted)' }}>{Map({ size: 12 })} {job.location}</span>}
                        {job.isRemote && <span style={{ color: 'var(--accent-green)' }}>{Globe({ size: 12 })} {t('jobs.remote')}</span>}
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) && (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                        )}
                        <span style={{ color: 'var(--text-muted)' }}>{t(EXP_LEVEL_KEYS[job.experienceLevel] || '')}</span>
                        {(() => { const m = getMatchScore(job); return m.pct > 0 ? <span style={{ color: m.pct >= 60 ? 'var(--accent-green)' : m.pct >= 30 ? '#D97706' : 'var(--text-muted)', fontWeight: 600 }}>{m.icon} {m.pct}% {m.label}</span> : null })()}
                      </div>
                    </div>
                    {job.applied || localApps[job.id] ? (
                      <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, padding: '4px 12px', background: 'rgba(5,150,105,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>{CheckCircle({ size: 12 })} Postulacion enviada</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setSelectedJob(job); setShowQuickApply(true) }} style={{ whiteSpace: 'nowrap' }}>{Zap({ size: 12 })} Postulacion Rapida</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Candidates */}
        {tab === 'candidates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {candidates.map((c: any) => (
              <div key={c.user?.id} className="u-card hover-lift" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => onNavigate(`/user/${c.user?.id}`)}>
                    {c.user?.avatar ? <img src={c.user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : (c.user?.firstName?.[0] || '?')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.user?.firstName} {c.user?.lastName}
                      {c.user?.isGraduated && <span title="Graduado" style={{ marginLeft: 4 }}>{GraduationCap({ size: 14 })}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.user?.career} — {c.user?.university}</div>
                  </div>
                </div>
                {c.headline && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>{c.headline}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-xs" onClick={() => onNavigate(`/user/${c.user?.id}`)}>{t('jobs.viewProfile')}</button>
                  <button className="btn btn-primary btn-xs" onClick={() => onNavigate(`/messages`)}>{t('jobs.contact')}</button>
                </div>
              </div>
            ))}
            {candidates.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1', padding: 40 }}><div>{Users({ size: 48 })}</div><h3>{t('jobs.noTalent')}</h3></div>}
          </div>
        )}

        {/* My Applications */}
        {tab === 'my-apps' && (() => {
          // Merge server apps with localStorage apps (localStorage fills gaps for offline/quick-applied)
          const serverIds = new Set(myApps.map((a: any) => a.job?.id || a.jobId))
          const localOnly = Object.entries(localApps).filter(([id]) => !serverIds.has(id))
          const hasAny = myApps.length > 0 || localOnly.length > 0
          const STATUS_LABELS: Record<string, string> = { Enviada: 'Enviada', 'En revision': 'En revision', Entrevista: 'Entrevista', Aceptado: 'Aceptado', Rechazado: 'Rechazado' }
          const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
            Enviada: { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
            'En revision': { bg: 'rgba(59,130,246,0.08)', color: '#3B82F6' },
            Entrevista: { bg: 'rgba(5,150,105,0.08)', color: 'var(--accent-green)' },
            Aceptado: { bg: 'rgba(5,150,105,0.15)', color: 'var(--accent-green)' },
            Rechazado: { bg: 'rgba(220,38,38,0.08)', color: 'var(--accent-red)' },
          }
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!hasAny ? (
              <div className="empty-state" style={{ padding: 40 }}><div>{FileText({ size: 48 })}</div><h3>{t('jobs.noApplications')}</h3></div>
            ) : (<>
              {myApps.map((a: any) => (
              <div key={a.id} className="u-card hover-lift" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {a.job?.companyLogo ? <img src={a.job.companyLogo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /> : BuildingIcon({ size: 20 })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.job?.jobTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.job?.companyName} · {a.job?.location}</div>
                </div>
                <span style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 12, fontWeight: 600,
                  background: a.status === 'interview' ? 'rgba(5,150,105,0.08)' : a.status === 'accepted' ? 'rgba(5,150,105,0.15)' : a.status === 'rejected' ? 'rgba(220,38,38,0.08)' : 'var(--bg-tertiary)',
                  color: a.status === 'interview' ? 'var(--accent-green)' : a.status === 'accepted' ? 'var(--accent-green)' : a.status === 'rejected' ? 'var(--accent-red)' : 'var(--text-muted)',
                }}>
                  {a.status === 'pending' ? <>{Hourglass({ size: 12 })} {t('jobs.statusPending')}</> : a.status === 'reviewed' ? <>{Eye({ size: 12 })} {t('jobs.statusReviewed')}</> : a.status === 'interview' ? <>{Target({ size: 12 })} {t('jobs.statusInterview')}</> : a.status === 'accepted' ? <>{CheckCircle({ size: 12 })} {t('jobs.statusAccepted')}</> : <>{XCircle({ size: 12 })} {t('jobs.statusRejected')}</>}
                </span>
              </div>
              ))}
              {localOnly.map(([id, app]) => (
              <div key={id} className="u-card hover-lift" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {BuildingIcon({ size: 20 })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{app.jobTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.companyName} · {app.date}</div>
                </div>
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, fontWeight: 600, background: (STATUS_COLORS[app.status] || STATUS_COLORS.Enviada).bg, color: (STATUS_COLORS[app.status] || STATUS_COLORS.Enviada).color }}>
                  {Hourglass({ size: 12 })} {STATUS_LABELS[app.status] || app.status}
                </span>
              </div>
              ))}
            </>)}
          </div>
          )
        })()}

        {/* ── Mis Matchings ── */}
        {tab === 'matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Explanation banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(45,98,200,0.08), rgba(99,102,241,0.06))',
              border: '1.5px solid rgba(45,98,200,0.2)', borderRadius: 16, padding: 20,
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>✦</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', marginBottom: 4 }}>
                  Conniku te presenta ante los reclutadores
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Cuando una empresa publica una oferta, el sistema analiza tu perfil académico y profesional y, si hay compatibilidad,
                  te presenta automáticamente al reclutador. Aquí puedes ver las oportunidades donde ya fuiste sugerido.
                  Para aparecer en más matchings, activa <strong>«Abierto a oportunidades»</strong> en tu perfil profesional.
                </p>
              </div>
            </div>

            {matchesLoading ? (
              [1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 90 }} />)
            ) : myMatches.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div style={{ fontSize: 48 }}>🎯</div>
                <h3 style={{ marginTop: 12 }}>Aún no hay matchings para ti</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Activa «Abierto a oportunidades» y mantén tu perfil actualizado para ser sugerido.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('profile')}>
                  Completar mi perfil
                </button>
              </div>
            ) : (
              myMatches.map((m: any) => {
                const job = m.job
                const score = m.score || 0
                const scoreColor = score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#6B7280'
                const scoreBg = score >= 70 ? 'rgba(5,150,105,0.08)' : score >= 40 ? 'rgba(217,119,6,0.08)' : 'rgba(107,114,128,0.08)'

                return (
                  <div key={m.matchId} className="u-card" style={{ padding: 18, position: 'relative', border: m.status === 'interested' ? '1.5px solid rgba(5,150,105,0.3)' : undefined }}>
                    {/* Conniku badge */}
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                      color: 'var(--accent)', background: 'rgba(45,98,200,0.08)',
                      padding: '3px 8px', borderRadius: 20,
                    }}>
                      ✦ CONNIKU TE PRESENTÓ
                    </div>

                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {/* Company logo */}
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {job?.companyLogo
                          ? <img src={job.companyLogo} alt="" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                          : <span style={{ fontSize: 22 }}>🏢</span>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, paddingRight: 110 }}>{job?.jobTitle}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {job?.companyName} {job?.location ? `· ${job.location}` : ''} {job?.isRemote ? '· Remoto' : ''}
                        </div>

                        {/* Score pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor,
                            background: scoreBg, padding: '3px 10px', borderRadius: 12 }}>
                            {score}% compatibilidad
                          </span>
                          {job?.jobType && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)',
                              background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: 12 }}>
                              {job.jobType === 'full_time' ? 'Tiempo completo' : job.jobType === 'part_time' ? 'Medio tiempo' : job.jobType === 'internship' ? 'Práctica' : job.jobType}
                            </span>
                          )}
                          {m.status === 'interested' && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669',
                              background: 'rgba(5,150,105,0.1)', padding: '3px 10px', borderRadius: 12 }}>
                              ✓ Marcaste interés
                            </span>
                          )}
                          {m.status === 'declined' && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)',
                              padding: '3px 10px', borderRadius: 12 }}>
                              Descartado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {m.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: 13 }}
                          onClick={async () => {
                            await api.updateJobMatchStatus(m.matchId, 'interested')
                            setMyMatches(prev => prev.map(x => x.matchId === m.matchId ? { ...x, status: 'interested' } : x))
                          }}
                        >
                          ✓ Me interesa
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 13 }}
                          onClick={async () => {
                            await api.updateJobMatchStatus(m.matchId, 'declined')
                            setMyMatches(prev => prev.map(x => x.matchId === m.matchId ? { ...x, status: 'declined' } : x))
                          }}
                        >
                          No me interesa
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 13, marginLeft: 'auto' }}
                          onClick={() => setSelectedJob(job)}
                        >
                          Ver oferta
                        </button>
                      </div>
                    )}
                    {(m.status === 'interested' || m.status === 'declined') && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-xs" onClick={() => setSelectedJob(job)}>Ver oferta</button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tutoring Tab */}
        {tab === 'tutoring' && (
          <>
            {/* Banner: Tutores Verificados */}
            <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)', border: '2px solid #F59E0B', borderRadius: 16, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {GraduationCap({ size: 24 })}
                  <h3 style={{ margin: 0, fontSize: 18, color: '#92400E' }}>{t('jobs.verifiedTutors')}</h3>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#78350F' }}>{t('jobs.verifiedTutorsDesc')}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-sm" onClick={() => onNavigate('/tutores')} style={{ background: '#F59E0B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                  {SearchIcon({ size: 14 })} {t('jobs.searchTutors')}
                </button>
                <button className="btn btn-sm" onClick={() => onNavigate('/tutores?apply=true')} style={{ background: '#92400E', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                  {t('jobs.becomeTutor')}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTutoringForm(true)}>{t('jobs.offerTutoring')}</button>
            </div>
            {tutorings.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div>{GraduationCap({ size: 48 })}</div>
                <h3>{t('jobs.noTutoring')}</h3>
                <p>{t('jobs.noTutoringDesc')}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {tutorings.map((tut: any) => (
                  <div key={tut.id} className="u-card hover-lift" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, overflow: 'hidden' }}>
                        {tut.tutor?.avatar ? <img src={tut.tutor.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : (tut.tutor?.firstName?.[0] || '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {tut.tutor?.firstName} {tut.tutor?.lastName}
                          {tut.tutor?.isGraduated && <span title="Graduado" style={{ marginLeft: 4 }}>{GraduationCap({ size: 14 })}</span>}
                          {tut.tutor?.isSeniorYear && !tut.tutor?.isGraduated && <span title="Ultimo ano" style={{ marginLeft: 4 }}>{BookOpen({ size: 14 })}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tut.tutor?.career} · {tut.tutor?.university}</div>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{tut.subject}</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>
                        {tut.modality === 'online' ? <>{Globe({ size: 12 })} Online</> : tut.modality === 'presencial' ? <>{Map({ size: 12 })} {t('jobs.presencial')}</> : <>{RefreshCw({ size: 12 })} {t('jobs.hybrid')}</>}
                      </span>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>{tut.sessionDuration} min</span>
                      {tut.isFree ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{t('jobs.free')}</span>
                      ) : tut.pricePerHour ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{tut.currency} {tut.pricePerHour}/hr</span>
                      ) : null}
                      {tut.freeTrial && <span style={{ color: 'var(--accent-blue)' }}>{t('jobs.freeTrialClass')}</span>}
                    </div>
                    {tut.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{tut.description}</p>}
                    {tut.ratingCount > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--accent-orange)', marginBottom: 8 }}>
                        {Star({ size: 12 })} {tut.rating}/5 ({tut.ratingCount} {t('jobs.reviews')}) · {tut.totalSessions} {t('jobs.sessions')}
                      </div>
                    )}
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleRequestTutoring(tut.id)}>
                      {t('jobs.requestTutoring')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Recruiter Tab */}
        {tab === 'recruiter' && (
          <div>
            {recruiterProfile ? (
              <div className="u-card hover-lift" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {recruiterProfile.companyLogo ? <img src={recruiterProfile.companyLogo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : BuildingIcon({ size: 20 })}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{recruiterProfile.companyName}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{recruiterProfile.recruiterTitle}</p>
                  </div>
                  <span style={{
                    marginLeft: 'auto', fontSize: 12, padding: '4px 12px', borderRadius: 12, fontWeight: 600,
                    background: recruiterProfile.verificationStatus === 'verified' ? 'rgba(5,150,105,0.08)' : recruiterProfile.verificationStatus === 'rejected' ? 'rgba(220,38,38,0.08)' : 'var(--bg-tertiary)',
                    color: recruiterProfile.verificationStatus === 'verified' ? 'var(--accent-green)' : recruiterProfile.verificationStatus === 'rejected' ? 'var(--accent-red)' : 'var(--text-muted)',
                  }}>
                    {recruiterProfile.verificationStatus === 'verified' ? <>{CheckCircle({ size: 12 })} {t('jobs.verified')}</> : recruiterProfile.verificationStatus === 'rejected' ? <>{XCircle({ size: 12 })} {t('jobs.rejected')}</> : <>{Hourglass({ size: 12 })} {t('jobs.underReview')}</>}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  {recruiterProfile.industry && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('jobs.industry')}</strong><div>{recruiterProfile.industry}</div></div>}
                  {recruiterProfile.companySize && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('jobs.companySize')}</strong><div>{recruiterProfile.companySize} {t('jobs.employees')}</div></div>}
                  {recruiterProfile.city && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('jobs.location')}</strong><div>{recruiterProfile.city}, {recruiterProfile.country}</div></div>}
                  {recruiterProfile.companyWebsite && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('jobs.web')}</strong><div>{recruiterProfile.companyWebsite}</div></div>}
                </div>
                {recruiterProfile.verificationStatus === 'verified' && (
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => setTab('candidates')}>{t('jobs.searchCandidates')}</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="u-card hover-lift" style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>{BuildingIcon()} {t('jobs.registerAsRecruiter')}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{t('jobs.registerRecruiterDesc')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="auth-field"><label>{t('jobs.companyRequired')}</label>
                    <input value={recruiterForm.company_name} onChange={e => setRecruiterForm({...recruiterForm, company_name: e.target.value})} placeholder={t('jobs.companyPlaceholder')} /></div>
                  <div className="auth-field"><label>{t('jobs.corporateEmail')}</label>
                    <input value={recruiterForm.corporate_email} onChange={e => setRecruiterForm({...recruiterForm, corporate_email: e.target.value})} placeholder="rh@empresa.com" /></div>
                  <div className="auth-field"><label>{t('jobs.yourTitle')}</label>
                    <input value={recruiterForm.recruiter_title} onChange={e => setRecruiterForm({...recruiterForm, recruiter_title: e.target.value})} placeholder="Ej: HR Manager" /></div>
                  <div className="auth-field"><label>{t('jobs.website')}</label>
                    <input value={recruiterForm.company_website} onChange={e => setRecruiterForm({...recruiterForm, company_website: e.target.value})} placeholder="https://empresa.com" /></div>
                  <div className="auth-field"><label>{t('jobs.industryLabel')}</label>
                    <input value={recruiterForm.industry} onChange={e => setRecruiterForm({...recruiterForm, industry: e.target.value})} placeholder={t('jobs.industryLabel')} /></div>
                  <div className="auth-field"><label>{t('jobs.companySizeLabel')}</label>
                    <select value={recruiterForm.company_size} onChange={e => setRecruiterForm({...recruiterForm, company_size: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">{t('jobs.selectOption')}</option>
                      <option value="1-10">1-10 {t('jobs.employees')}</option>
                      <option value="11-50">11-50 {t('jobs.employees')}</option>
                      <option value="51-200">51-200 {t('jobs.employees')}</option>
                      <option value="201-500">201-500 {t('jobs.employees')}</option>
                      <option value="500+">500+ {t('jobs.employees')}</option>
                    </select></div>
                  <div className="auth-field"><label>{t('jobs.taxId')}</label>
                    <input value={recruiterForm.tax_id} onChange={e => setRecruiterForm({...recruiterForm, tax_id: e.target.value})} placeholder={t('jobs.taxIdPlaceholder')} /></div>
                  <div className="auth-field"><label>{t('jobs.phone')}</label>
                    <input value={recruiterForm.phone} onChange={e => setRecruiterForm({...recruiterForm, phone: e.target.value})} placeholder="+1 234 567 8900" /></div>
                  <div className="auth-field"><label>{t('jobs.country')}</label>
                    <input value={recruiterForm.country} onChange={e => setRecruiterForm({...recruiterForm, country: e.target.value})} placeholder={t('jobs.country')} /></div>
                  <div className="auth-field"><label>{t('jobs.city')}</label>
                    <input value={recruiterForm.city} onChange={e => setRecruiterForm({...recruiterForm, city: e.target.value})} placeholder={t('jobs.city')} /></div>
                  <div className="auth-field"><label>{t('jobs.linkedin')}</label>
                    <input value={recruiterForm.linkedin_url} onChange={e => setRecruiterForm({...recruiterForm, linkedin_url: e.target.value})} placeholder="linkedin.com/company/..." /></div>
                </div>
                <div className="auth-field"><label>{t('jobs.companyDescription')}</label>
                  <textarea value={recruiterForm.company_description} onChange={e => setRecruiterForm({...recruiterForm, company_description: e.target.value})} placeholder={t('jobs.companyDescPlaceholder')}
                    style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleRegisterRecruiter}>
                  {t('jobs.registerCompany')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Apply Modal */}
        {showQuickApply && selectedJob && (
          <div className="modal-overlay" onClick={() => setShowQuickApply(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{Zap({ size: 18 })} Postulacion Rapida</h3>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Postular a {selectedJob.jobTitle} en {selectedJob.companyName}?</p>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, marginTop: 12, fontSize: 13 }}>
                <div style={{ marginBottom: 6 }}><strong>Nombre:</strong> {user?.firstName} {user?.lastName}</div>
                <div style={{ marginBottom: 6 }}><strong>Email:</strong> {user?.email}</div>
                {user?.career && <div style={{ marginBottom: 6 }}><strong>Carrera:</strong> {user.career}</div>}
                {user?.university && <div><strong>Universidad:</strong> {user.university}</div>}
              </div>
              <div className="auth-field" style={{ marginTop: 12 }}>
                <label>Carta de presentacion (opcional)</label>
                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Escribe un breve mensaje al reclutador..."
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowQuickApply(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => { handleApply(selectedJob.id); saveLocalApp(selectedJob); setShowQuickApply(false) }}>{Zap({ size: 14 })} Confirmar Postulacion</button>
              </div>
            </div>
          </div>
        )}

        {/* Full Apply Modal (from detail view) */}
        {showApply && selectedJob && (
          <div className="modal-overlay" onClick={() => setShowApply(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{t('jobs.applyTo')} {selectedJob.jobTitle}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{selectedJob.companyName}</p>
              <div className="auth-field">
                <label>{t('jobs.coverLetter')}</label>
                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                  placeholder={t('jobs.coverLetterPlaceholder')}
                  style={{ width: '100%', minHeight: 120, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowApply(false)}>{t('jobs.cancel')}</button>
                <button className="btn btn-primary" onClick={() => { handleApply(selectedJob.id); saveLocalApp(selectedJob) }}>{t('jobs.sendApplication')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Post Job Form Modal */}
        {showPostForm && (
          <div className="modal-overlay" onClick={() => setShowPostForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>{t('jobs.postJobTitle')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field"><label>{t('jobs.companyLabel2')}</label>
                  <input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder={t('jobs.companyPlaceholder')} /></div>
                <div className="auth-field"><label>{t('jobs.positionRequired')}</label>
                  <input value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} placeholder={t('jobs.positionPlaceholder2')} /></div>
                <div className="auth-field"><label>{t('jobs.jobType')}</label>
                  <select value={form.job_type} onChange={e => setForm({...form, job_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {JOB_TYPE_KEYS.filter(jt => jt.value).map(jt => <option key={jt.value} value={jt.value}>{t(jt.labelKey)}</option>)}
                  </select></div>
                <div className="auth-field"><label>{t('jobs.expLevel')}</label>
                  <select value={form.experience_level} onChange={e => setForm({...form, experience_level: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="entry">{t('jobs.expEntryLabel')}</option>
                    <option value="mid">{t('jobs.expMidLabel')}</option>
                    <option value="senior">{t('jobs.expSeniorLabel')}</option>
                    <option value="any">{t('jobs.expAnyLabel')}</option>
                  </select></div>
                <div className="auth-field"><label>{t('jobs.locationField')}</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder={t('jobs.locationPlaceholder')} /></div>
                <div className="auth-field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input type="checkbox" checked={form.is_remote} onChange={e => setForm({...form, is_remote: e.target.checked})} />
                  <label style={{ margin: 0 }}>{t('jobs.remoteWork')}</label>
                </div>
                <div className="auth-field"><label>{t('jobs.salaryMin')}</label>
                  <input type="number" value={form.salary_min} onChange={e => setForm({...form, salary_min: e.target.value})} placeholder={t('jobs.salaryMinPlaceholder')} /></div>
                <div className="auth-field"><label>{t('jobs.salaryMax')}</label>
                  <input type="number" value={form.salary_max} onChange={e => setForm({...form, salary_max: e.target.value})} placeholder={t('jobs.salaryMaxPlaceholder')} /></div>
                <div className="auth-field"><label>{t('jobs.careerField')}</label>
                  <input value={form.career_field} onChange={e => setForm({...form, career_field: e.target.value})} placeholder={t('jobs.careerFieldPlaceholder')} /></div>
                <div className="auth-field"><label>{t('jobs.contactEmailField')}</label>
                  <input value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="rh@empresa.com" /></div>
                <div className="auth-field"><label>{t('jobs.deadline')}</label>
                  <input type="date" value={form.application_deadline} onChange={e => setForm({...form, application_deadline: e.target.value})} style={{ colorScheme: 'dark' }} /></div>
              </div>
              <div className="auth-field"><label>{t('jobs.jobDescription')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder={t('jobs.jobDescPlaceholder')}
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div className="auth-field"><label>{t('jobs.requirements')}</label>
                <textarea value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} placeholder={t('jobs.requirementsPlaceholder')}
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div className="auth-field"><label>{t('jobs.benefits')}</label>
                <textarea value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})} placeholder={t('jobs.benefitsPlaceholder')}
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              {/* Konni broadcast option */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.konni_broadcast} onChange={e => setForm({...form, konni_broadcast: e.target.checked})}
                  style={{ marginTop: 3, accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>💬 Enviar por Konni</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Todos los usuarios recibirán esta oferta como mensaje en su chat de Konni Soporte.</div>
                </div>
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowPostForm(false)}>{t('jobs.cancel')}</button>
                <button className="btn btn-primary" onClick={handlePostJob}>{t('jobs.publishOffer')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Job Detail Modal */}
        {selectedJob && !showApply && (
          <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {selectedJob.companyLogo ? <img src={selectedJob.companyLogo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : BuildingIcon({ size: 20 })}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedJob.jobTitle}</h3>
                  <div style={{ color: 'var(--text-secondary)' }}>{selectedJob.companyName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
                <span style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 12 }}>{t(JOB_TYPE_KEYS.find(jt => jt.value === selectedJob.jobType)?.labelKey || '')}</span>
                {selectedJob.location && <span>{Map({ size: 13 })} {selectedJob.location}</span>}
                {selectedJob.isRemote && <span style={{ color: 'var(--accent-green)' }}>{Globe({ size: 13 })} {t('jobs.remote')}</span>}
                {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency) && <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}</span>}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{selectedJob.description}</div>
              {selectedJob.requirements && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, marginBottom: 4 }}>{t('jobs.requirements')}</h4><div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{selectedJob.requirements}</div></div>}
              {selectedJob.benefits && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, marginBottom: 4 }}>{t('jobs.benefits')}</h4><div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{selectedJob.benefits}</div></div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>{t('jobs.close')}</button>
                {!selectedJob.applied && !localApps[selectedJob.id] ? (
                  <button className="btn btn-primary" onClick={() => setShowQuickApply(true)}>{Zap({ size: 14 })} Postulacion Rapida</button>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>{CheckCircle({ size: 14 })} Postulacion enviada</span>
                )}
              </div>
            </div>
          </div>
        )}

        {showTutoringForm && (
          <div className="modal-overlay" onClick={() => setShowTutoringForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>{t('jobs.offerTutoringTitle')}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{t('jobs.shareKnowledge')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field"><label>{t('jobs.subjectRequired')}</label>
                  <input value={tutoringForm.subject} onChange={e => setTutoringForm({...tutoringForm, subject: e.target.value})} placeholder={t('jobs.subjectPlaceholder')} /></div>
                <div className="auth-field"><label>{t('jobs.categoryLabel')}</label>
                  <select value={tutoringForm.category} onChange={e => setTutoringForm({...tutoringForm, category: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="">{t('jobs.selectOption')}</option>
                    <option value="ciencias">{t('jobs.catSciences')}</option><option value="ingenieria">{t('jobs.catEngineering')}</option>
                    <option value="humanidades">{t('jobs.catHumanities')}</option><option value="tecnologia">{t('jobs.catTech')}</option>
                    <option value="idiomas">{t('jobs.catLanguages')}</option><option value="negocios">{t('jobs.catBusiness')}</option>
                    <option value="artes">{t('jobs.catArts')}</option><option value="salud">{t('jobs.catHealth')}</option>
                  </select></div>
                <div className="auth-field"><label>{t('jobs.modality')}</label>
                  <select value={tutoringForm.modality} onChange={e => setTutoringForm({...tutoringForm, modality: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="online">Online</option><option value="presencial">{t('jobs.presencial')}</option><option value="hybrid">{t('jobs.hybrid')}</option>
                  </select></div>
                <div className="auth-field"><label>{t('jobs.sessionDuration')}</label>
                  <select value={tutoringForm.session_duration} onChange={e => setTutoringForm({...tutoringForm, session_duration: Number(e.target.value)})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value={30}>30 min</option><option value={45}>45 min</option>
                    <option value={60}>60 min</option><option value={90}>90 min</option>
                  </select></div>
                <div className="auth-field"><label>{t('jobs.pricePerHour')}</label>
                  <input type="number" value={tutoringForm.price_per_hour} onChange={e => setTutoringForm({...tutoringForm, price_per_hour: e.target.value})} placeholder={t('jobs.freePricePlaceholder')} /></div>
                <div className="auth-field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input type="checkbox" checked={tutoringForm.is_free} onChange={e => setTutoringForm({...tutoringForm, is_free: e.target.checked})} />
                  <label style={{ margin: 0 }}>{t('jobs.freeTutoring')}</label>
                </div>
              </div>
              <div className="auth-field"><label>{t('jobs.descAndMethodology')}</label>
                <textarea value={tutoringForm.description} onChange={e => setTutoringForm({...tutoringForm, description: e.target.value})} placeholder={t('jobs.descAndMethodPlaceholder')}
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div className="auth-field"><label>{t('jobs.tagsLabel')}</label>
                <input value={tutoringForm.tags} onChange={e => setTutoringForm({...tutoringForm, tags: e.target.value})} placeholder={t('jobs.tagsPlaceholder')} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowTutoringForm(false)}>{t('jobs.cancel')}</button>
                <button className="btn btn-primary" onClick={handleCreateTutoring}>{t('jobs.publishTutoring')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
