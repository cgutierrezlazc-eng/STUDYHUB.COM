import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { Briefcase, Sparkles, Search as SearchIcon, ClipboardList, GraduationCap, Users, FileText, Briefcase as BuildingIcon, Lock, Globe, RefreshCw, Star, CheckCircle, XCircle, Hourglass, Eye, Target, Map, BookOpen } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const JOB_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'full_time', label: 'Tiempo Completo' },
  { value: 'part_time', label: 'Medio Tiempo' },
  { value: 'internship', label: 'Pasantía' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'remote', label: 'Remoto' },
]

const EXP_LEVELS: Record<string, string> = {
  entry: 'Junior', mid: 'Semi-Senior', senior: 'Senior', any: 'Cualquiera',
}

export default function Jobs({ onNavigate }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'listings' | 'cvs' | 'candidates' | 'my-apps' | 'my-listings' | 'tutoring' | 'recruiter'>('listings')
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
    application_deadline: '',
  })

  useEffect(() => {
    loadJobs()
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

  const handleCreateTutoring = async () => {
    if (!tutoringForm.subject) { alert('La materia es obligatoria'); return }
    try {
      await api.createTutoringListing({
        ...tutoringForm,
        price_per_hour: tutoringForm.price_per_hour ? Number(tutoringForm.price_per_hour) : null,
        tags: tutoringForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      setShowTutoringForm(false)
      loadTutorings()
      alert('Tutoría publicada exitosamente')
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleRegisterRecruiter = async () => {
    if (!recruiterForm.company_name || !recruiterForm.corporate_email || !recruiterForm.recruiter_title) {
      alert('Completa los campos obligatorios'); return
    }
    try {
      const result = await api.registerRecruiter(recruiterForm)
      alert(result.message || 'Registro enviado')
      loadRecruiter()
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleRequestTutoring = async (listingId: string) => {
    const message = prompt('Escribe un mensaje para el tutor (opcional):')
    try {
      await api.requestTutoring(listingId, { message: message || '' })
      alert('Solicitud enviada al tutor')
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const handleApply = async (jobId: string) => {
    try {
      await api.applyToJob(jobId, { cover_letter: coverLetter, resume_url: careerStatus?.resumeUrl })
      setShowApply(false)
      setCoverLetter('')
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, applied: true } : j))
      alert('Aplicación enviada exitosamente')
    } catch (err: any) {
      alert(err.message || 'Error al aplicar')
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
      setForm({ company_name: '', job_title: '', job_type: 'full_time', location: '', is_remote: false, salary_min: '', salary_max: '', salary_currency: 'USD', description: '', requirements: '', benefits: '', career_field: '', experience_level: 'entry', education_level: 'any', contact_email: '', application_deadline: '' })
      alert('Oferta publicada exitosamente')
      loadJobs()
    } catch (err: any) {
      alert(err.message || 'Error al publicar')
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
    if (min) return `Desde ${currency} ${fmt(min)}`
    return `Hasta ${currency} ${fmt(max!)}`
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{Briefcase()} Bolsa de Trabajo</h2>
            <p>Conecta con empresas, muestra tu perfil profesional y encuentra tu proximo paso</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={toggleOpenToWork}
              className={`btn btn-sm ${careerStatus?.isOpenToOpportunities ? 'btn-primary' : 'btn-secondary'}`}
            >
              {careerStatus?.isOpenToOpportunities ? <>{Sparkles()} Explorando Oportunidades</> : <>{SearchIcon()} Activar Visibilidad</>}
            </button>
            <button className="btn btn-primary" onClick={() => setShowPostForm(true)}>+ Publicar Oferta</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['listings', 'cvs', 'tutoring', 'candidates', 'my-apps', 'my-listings', 'recruiter'] as const).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => {
              setTab(t)
              if (t === 'cvs') loadPublicCVs()
              if (t === 'candidates') loadCandidates()
              if (t === 'my-apps') loadMyApps()
              if (t === 'tutoring') loadTutorings()
              if (t === 'recruiter') loadRecruiter()
            }}>
              {t === 'listings' ? <>{ClipboardList({ size: 14 })} Ofertas</> : t === 'cvs' ? <>{FileText({ size: 14 })} Curriculums</> : t === 'tutoring' ? <>{GraduationCap({ size: 14 })} Tutorias</> : t === 'candidates' ? <>{Users({ size: 14 })} Talentos</> : t === 'my-apps' ? <>{FileText({ size: 14 })} Mis Postulaciones</> : t === 'my-listings' ? <>{BuildingIcon({ size: 14 })} Mis Ofertas</> : <>{Lock({ size: 14 })} Soy Reclutador</>}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* Search Bar */}
        {(tab === 'listings' || tab === 'candidates') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'listings' ? loadJobs() : loadCandidates())}
              placeholder={tab === 'listings' ? 'Buscar ofertas...' : 'Buscar talentos...'}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            {tab === 'listings' && (
              <select value={jobTypeFilter} onChange={e => { setJobTypeFilter(e.target.value); setTimeout(loadJobs, 100) }}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}
            <button className="btn btn-primary" onClick={() => tab === 'listings' ? loadJobs() : loadCandidates()}>Buscar</button>
          </div>
        )}

        {/* Public CVs / Curriculums */}
        {tab === 'cvs' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={cvSearch} onChange={e => setCvSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadPublicCVs(cvSearch)}
                placeholder="Buscar por nombre, carrera, habilidad, universidad..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <button className="btn btn-primary" onClick={() => loadPublicCVs(cvSearch)}>{SearchIcon({ size: 14 })} Buscar</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Perfiles profesionales de estudiantes que han decidido hacer publico su curriculum para aumentar su visibilidad laboral.
            </p>
            {cvLoading ? <div className="loading-dots"><span /><span /><span /></div> :
            publicCVs.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div>{FileText({ size: 48 })}</div>
                <h3>No hay curriculums publicos todavia</h3>
                <p>Completa tu curriculum en tu perfil y ponlo en visibilidad publica para aparecer aqui.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {publicCVs.map(cv => (
                  <div key={cv.userId} className="card" style={{ padding: 18, cursor: 'pointer' }}
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
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Job Listings */}
        {tab === 'listings' && (
          loading ? <div className="loading-dots"><span /><span /><span /></div> :
          jobs.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div>{Briefcase({ size: 48 })}</div>
              <h3>No hay ofertas disponibles</h3>
              <p>Sé el primero en publicar una oportunidad</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(job => (
                <div key={job.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSelectedJob(job)}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {job.companyLogo ? <img src={job.companyLogo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} /> : BuildingIcon({ size: 20 })}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{job.jobTitle}</h4>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{job.companyName}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>
                          {JOB_TYPES.find(t => t.value === job.jobType)?.label || job.jobType}
                        </span>
                        {job.location && <span style={{ color: 'var(--text-muted)' }}>{Map({ size: 12 })} {job.location}</span>}
                        {job.isRemote && <span style={{ color: 'var(--accent-green)' }}>{Globe({ size: 12 })} Remoto</span>}
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) && (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                        )}
                        <span style={{ color: 'var(--text-muted)' }}>{EXP_LEVELS[job.experienceLevel] || ''}</span>
                      </div>
                    </div>
                    {job.applied ? (
                      <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, padding: '4px 12px', background: 'rgba(5,150,105,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>{CheckCircle({ size: 12 })} Aplicado</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setSelectedJob(job); setShowApply(true) }}>Aplicar</button>
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
              <div key={c.user?.id} className="card" style={{ padding: 16 }}>
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
                  <button className="btn btn-secondary btn-xs" onClick={() => onNavigate(`/user/${c.user?.id}`)}>Ver Perfil</button>
                  <button className="btn btn-primary btn-xs" onClick={() => onNavigate(`/messages`)}>Contactar</button>
                </div>
              </div>
            ))}
            {candidates.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1', padding: 40 }}><div>{Users({ size: 48 })}</div><h3>No hay talentos disponibles</h3></div>}
          </div>
        )}

        {/* My Applications */}
        {tab === 'my-apps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myApps.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div>{FileText({ size: 48 })}</div><h3>No has aplicado a ofertas</h3></div>
            ) : myApps.map((a: any) => (
              <div key={a.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
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
                  {a.status === 'pending' ? <>{Hourglass({ size: 12 })} Pendiente</> : a.status === 'reviewed' ? <>{Eye({ size: 12 })} Revisada</> : a.status === 'interview' ? <>{Target({ size: 12 })} Entrevista</> : a.status === 'accepted' ? <>{CheckCircle({ size: 12 })} Aceptada</> : <>{XCircle({ size: 12 })} Rechazada</>}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tutoring Tab */}
        {tab === 'tutoring' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTutoringForm(true)}>+ Ofrecer Tutoría</button>
            </div>
            {tutorings.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div>{GraduationCap({ size: 48 })}</div>
                <h3>No hay tutorías disponibles</h3>
                <p>Los estudiantes de último año y graduados pueden ofrecer tutorías</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {tutorings.map((t: any) => (
                  <div key={t.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, overflow: 'hidden' }}>
                        {t.tutor?.avatar ? <img src={t.tutor.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : (t.tutor?.firstName?.[0] || '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {t.tutor?.firstName} {t.tutor?.lastName}
                          {t.tutor?.isGraduated && <span title="Graduado" style={{ marginLeft: 4 }}>{GraduationCap({ size: 14 })}</span>}
                          {t.tutor?.isSeniorYear && !t.tutor?.isGraduated && <span title="Último año" style={{ marginLeft: 4 }}>{BookOpen({ size: 14 })}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.tutor?.career} · {t.tutor?.university}</div>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{t.subject}</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>
                        {t.modality === 'online' ? <>{Globe({ size: 12 })} Online</> : t.modality === 'presencial' ? <>{Map({ size: 12 })} Presencial</> : <>{RefreshCw({ size: 12 })} Híbrido</>}
                      </span>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>{t.sessionDuration} min</span>
                      {t.isFree ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Gratis</span>
                      ) : t.pricePerHour ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{t.currency} {t.pricePerHour}/hr</span>
                      ) : null}
                      {t.freeTrial && <span style={{ color: 'var(--accent-blue)' }}>Clase de prueba gratis</span>}
                    </div>
                    {t.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{t.description}</p>}
                    {t.ratingCount > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--accent-orange)', marginBottom: 8 }}>
                        {Star({ size: 12 })} {t.rating}/5 ({t.ratingCount} reseñas) · {t.totalSessions} sesiones
                      </div>
                    )}
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleRequestTutoring(t.id)}>
                      Solicitar Tutoría
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
              <div className="card" style={{ padding: 24 }}>
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
                    {recruiterProfile.verificationStatus === 'verified' ? <>{CheckCircle({ size: 12 })} Verificado</> : recruiterProfile.verificationStatus === 'rejected' ? <>{XCircle({ size: 12 })} Rechazado</> : <>{Hourglass({ size: 12 })} En revisión</>}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  {recruiterProfile.industry && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>Industria</strong><div>{recruiterProfile.industry}</div></div>}
                  {recruiterProfile.companySize && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>Tamaño</strong><div>{recruiterProfile.companySize} empleados</div></div>}
                  {recruiterProfile.city && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>Ubicación</strong><div>{recruiterProfile.city}, {recruiterProfile.country}</div></div>}
                  {recruiterProfile.companyWebsite && <div><strong style={{ color: 'var(--text-muted)', fontSize: 12 }}>Web</strong><div>{recruiterProfile.companyWebsite}</div></div>}
                </div>
                {recruiterProfile.verificationStatus === 'verified' && (
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => setTab('candidates')}>Buscar Candidatos</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>{BuildingIcon()} Registrarse como Reclutador</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Registra tu empresa para publicar ofertas y buscar talento verificado</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="auth-field"><label>Empresa *</label>
                    <input value={recruiterForm.company_name} onChange={e => setRecruiterForm({...recruiterForm, company_name: e.target.value})} placeholder="Nombre de la empresa" /></div>
                  <div className="auth-field"><label>Correo corporativo *</label>
                    <input value={recruiterForm.corporate_email} onChange={e => setRecruiterForm({...recruiterForm, corporate_email: e.target.value})} placeholder="rh@empresa.com" /></div>
                  <div className="auth-field"><label>Tu cargo *</label>
                    <input value={recruiterForm.recruiter_title} onChange={e => setRecruiterForm({...recruiterForm, recruiter_title: e.target.value})} placeholder="Ej: HR Manager" /></div>
                  <div className="auth-field"><label>Sitio web</label>
                    <input value={recruiterForm.company_website} onChange={e => setRecruiterForm({...recruiterForm, company_website: e.target.value})} placeholder="https://empresa.com" /></div>
                  <div className="auth-field"><label>Industria</label>
                    <input value={recruiterForm.industry} onChange={e => setRecruiterForm({...recruiterForm, industry: e.target.value})} placeholder="Ej: Tecnología" /></div>
                  <div className="auth-field"><label>Tamaño empresa</label>
                    <select value={recruiterForm.company_size} onChange={e => setRecruiterForm({...recruiterForm, company_size: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">Seleccionar</option>
                      <option value="1-10">1-10 empleados</option>
                      <option value="11-50">11-50 empleados</option>
                      <option value="51-200">51-200 empleados</option>
                      <option value="201-500">201-500 empleados</option>
                      <option value="500+">500+ empleados</option>
                    </select></div>
                  <div className="auth-field"><label>RUC/NIT/ID Fiscal</label>
                    <input value={recruiterForm.tax_id} onChange={e => setRecruiterForm({...recruiterForm, tax_id: e.target.value})} placeholder="Identificación fiscal" /></div>
                  <div className="auth-field"><label>Teléfono</label>
                    <input value={recruiterForm.phone} onChange={e => setRecruiterForm({...recruiterForm, phone: e.target.value})} placeholder="+1 234 567 8900" /></div>
                  <div className="auth-field"><label>País</label>
                    <input value={recruiterForm.country} onChange={e => setRecruiterForm({...recruiterForm, country: e.target.value})} placeholder="País" /></div>
                  <div className="auth-field"><label>Ciudad</label>
                    <input value={recruiterForm.city} onChange={e => setRecruiterForm({...recruiterForm, city: e.target.value})} placeholder="Ciudad" /></div>
                  <div className="auth-field"><label>LinkedIn</label>
                    <input value={recruiterForm.linkedin_url} onChange={e => setRecruiterForm({...recruiterForm, linkedin_url: e.target.value})} placeholder="linkedin.com/company/..." /></div>
                </div>
                <div className="auth-field"><label>Descripción de la empresa</label>
                  <textarea value={recruiterForm.company_description} onChange={e => setRecruiterForm({...recruiterForm, company_description: e.target.value})} placeholder="¿A qué se dedica tu empresa?"
                    style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleRegisterRecruiter}>
                  Registrar Empresa
                </button>
              </div>
            )}
          </div>
        )}

        {/* Apply Modal */}
        {showApply && selectedJob && (
          <div className="modal-overlay" onClick={() => setShowApply(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Aplicar a {selectedJob.jobTitle}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{selectedJob.companyName}</p>
              <div className="auth-field">
                <label>Carta de presentación</label>
                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Cuéntale a la empresa por qué eres el candidato ideal..."
                  style={{ width: '100%', minHeight: 120, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowApply(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => handleApply(selectedJob.id)}>Enviar Aplicación</button>
              </div>
            </div>
          </div>
        )}

        {/* Post Job Form Modal */}
        {showPostForm && (
          <div className="modal-overlay" onClick={() => setShowPostForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>Publicar Oferta de Empleo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field"><label>Empresa *</label>
                  <input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Nombre de la empresa" /></div>
                <div className="auth-field"><label>Puesto *</label>
                  <input value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} placeholder="Ej: Desarrollador Frontend" /></div>
                <div className="auth-field"><label>Tipo de empleo</label>
                  <select value={form.job_type} onChange={e => setForm({...form, job_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {JOB_TYPES.filter(t => t.value).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select></div>
                <div className="auth-field"><label>Nivel de experiencia</label>
                  <select value={form.experience_level} onChange={e => setForm({...form, experience_level: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="entry">Junior / Sin experiencia</option>
                    <option value="mid">Semi-Senior (2-5 años)</option>
                    <option value="senior">Senior (5+ años)</option>
                    <option value="any">Cualquiera</option>
                  </select></div>
                <div className="auth-field"><label>Ubicación</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Ciudad, País" /></div>
                <div className="auth-field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input type="checkbox" checked={form.is_remote} onChange={e => setForm({...form, is_remote: e.target.checked})} />
                  <label style={{ margin: 0 }}>Trabajo remoto</label>
                </div>
                <div className="auth-field"><label>Salario mínimo</label>
                  <input type="number" value={form.salary_min} onChange={e => setForm({...form, salary_min: e.target.value})} placeholder="Ej: 30000" /></div>
                <div className="auth-field"><label>Salario máximo</label>
                  <input type="number" value={form.salary_max} onChange={e => setForm({...form, salary_max: e.target.value})} placeholder="Ej: 50000" /></div>
                <div className="auth-field"><label>Campo profesional</label>
                  <input value={form.career_field} onChange={e => setForm({...form, career_field: e.target.value})} placeholder="Ej: Tecnología, Ingeniería..." /></div>
                <div className="auth-field"><label>Email de contacto</label>
                  <input value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="rh@empresa.com" /></div>
                <div className="auth-field"><label>Fecha límite</label>
                  <input type="date" value={form.application_deadline} onChange={e => setForm({...form, application_deadline: e.target.value})} style={{ colorScheme: 'dark' }} /></div>
              </div>
              <div className="auth-field"><label>Descripción del puesto *</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe las responsabilidades del puesto..."
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div className="auth-field"><label>Requisitos</label>
                <textarea value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} placeholder="Requisitos y habilidades necesarias..."
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div className="auth-field"><label>Beneficios</label>
                <textarea value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})} placeholder="Beneficios que ofrece la empresa..."
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowPostForm(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handlePostJob}>Publicar Oferta</button>
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
                <span style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 12 }}>{JOB_TYPES.find(t => t.value === selectedJob.jobType)?.label}</span>
                {selectedJob.location && <span>{Map({ size: 13 })} {selectedJob.location}</span>}
                {selectedJob.isRemote && <span style={{ color: 'var(--accent-green)' }}>{Globe({ size: 13 })} Remoto</span>}
                {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency) && <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}</span>}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{selectedJob.description}</div>
              {selectedJob.requirements && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, marginBottom: 4 }}>Requisitos</h4><div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{selectedJob.requirements}</div></div>}
              {selectedJob.benefits && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 14, marginBottom: 4 }}>Beneficios</h4><div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{selectedJob.benefits}</div></div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>Cerrar</button>
                {!selectedJob.applied && <button className="btn btn-primary" onClick={() => setShowApply(true)}>Aplicar</button>}
              </div>
            </div>
          </div>
        )}

        {showTutoringForm && (
          <div className="modal-overlay" onClick={() => setShowTutoringForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>Ofrecer Tutoría</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Comparte tu conocimiento con otros estudiantes</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="auth-field"><label>Materia *</label>
                  <input value={tutoringForm.subject} onChange={e => setTutoringForm({...tutoringForm, subject: e.target.value})} placeholder="Ej: Cálculo II" /></div>
                <div className="auth-field"><label>Categoría</label>
                  <select value={tutoringForm.category} onChange={e => setTutoringForm({...tutoringForm, category: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="">Seleccionar</option>
                    <option value="ciencias">Ciencias</option><option value="ingenieria">Ingeniería</option>
                    <option value="humanidades">Humanidades</option><option value="tecnologia">Tecnología</option>
                    <option value="idiomas">Idiomas</option><option value="negocios">Negocios</option>
                    <option value="artes">Artes</option><option value="salud">Salud</option>
                  </select></div>
                <div className="auth-field"><label>Modalidad</label>
                  <select value={tutoringForm.modality} onChange={e => setTutoringForm({...tutoringForm, modality: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="online">Online</option><option value="presencial">Presencial</option><option value="hybrid">Híbrido</option>
                  </select></div>
                <div className="auth-field"><label>Duración sesión</label>
                  <select value={tutoringForm.session_duration} onChange={e => setTutoringForm({...tutoringForm, session_duration: Number(e.target.value)})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value={30}>30 min</option><option value={45}>45 min</option>
                    <option value={60}>60 min</option><option value={90}>90 min</option>
                  </select></div>
                <div className="auth-field"><label>Precio por hora</label>
                  <input type="number" value={tutoringForm.price_per_hour} onChange={e => setTutoringForm({...tutoringForm, price_per_hour: e.target.value})} placeholder="0 = gratis" /></div>
                <div className="auth-field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input type="checkbox" checked={tutoringForm.is_free} onChange={e => setTutoringForm({...tutoringForm, is_free: e.target.checked})} />
                  <label style={{ margin: 0 }}>Tutoría gratuita</label>
                </div>
              </div>
              <div className="auth-field"><label>Descripción y metodología</label>
                <textarea value={tutoringForm.description} onChange={e => setTutoringForm({...tutoringForm, description: e.target.value})} placeholder="¿Qué aprenderán tus estudiantes? ¿Cómo son tus clases?"
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} /></div>
              <div className="auth-field"><label>Tags (separados por coma)</label>
                <input value={tutoringForm.tags} onChange={e => setTutoringForm({...tutoringForm, tags: e.target.value})} placeholder="Ej: Parcial 2, Integrales, Repaso final" /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowTutoringForm(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreateTutoring}>Publicar Tutoría</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
