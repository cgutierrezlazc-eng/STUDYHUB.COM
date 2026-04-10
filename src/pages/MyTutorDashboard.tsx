import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
  subPath?: 'clases' | 'pagos' | 'materias'
}

const STATUS_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending_review: { label: 'En Revisión',  color: '#f59e0b', icon: '⏳', desc: 'Tu postulación está siendo revisada por el equipo Conniku. Te notificaremos por email.' },
  approved:       { label: 'Aprobado',     color: '#22c55e', icon: '✅', desc: 'Tu perfil está activo y visible para los estudiantes.' },
  rejected:       { label: 'Rechazado',    color: '#ef4444', icon: '❌', desc: 'Tu postulación fue rechazada. Puedes apelar con nueva información.' },
  suspended:      { label: 'Suspendido',   color: '#ef4444', icon: '🚫', desc: 'Tu cuenta está suspendida. Contacta a soporte para más información.' },
  appealing:      { label: 'Apelando',     color: '#8b5cf6', icon: '📝', desc: 'Tu apelación está en revisión. El equipo te responderá pronto.' },
}
const fmtClp = (n: number) => `$${(n || 0).toLocaleString('es-CL')} CLP`
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function MyTutorDashboard({ onNavigate, subPath }: Props) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'clases' | 'pagos' | 'materias'>(subPath || 'overview')
  const [appealText, setAppealText] = useState('')
  const [appealSending, setAppealSending] = useState(false)
  const [appealSent, setAppealSent] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  // Rating modal
  const [ratingModal, setRatingModal] = useState<{ classId: string; className: string; unratedCount: number } | null>(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSaving, setRatingSaving] = useState(false)

  // Subject creation form
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [subjectForm, setSubjectForm] = useState({ name: '', category: '', level: '', description: '', learning_objectives: '', prerequisites: '', duration_hours: 1, max_students: 3 })
  const [subjectSaving, setSubjectSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getMyTutorProfile()
      .then((d: any) => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'clases') {
      api.getMyOwnClasses()
        .then((d: any) => setClasses(Array.isArray(d) ? d : d?.classes || []))
        .catch(() => {})
    }
    if (tab === 'pagos') {
      api.getMyTutorPayments()
        .then((d: any) => setPayments(Array.isArray(d) ? d : d?.payments || []))
        .catch(() => {})
    }
    if (tab === 'materias') {
      api.getMyTutorSubjects()
        .then((d: any) => setSubjects(d?.subjects || []))
        .catch(() => {})
    }
  }, [tab])

  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim() || !subjectForm.description.trim()) return
    setSubjectSaving(true)
    try {
      await api.createTutorSubject(subjectForm)
      setShowSubjectForm(false)
      setSubjectForm({ name: '', category: '', level: '', description: '', learning_objectives: '', prerequisites: '', duration_hours: 1, max_students: 3 })
      const d: any = await api.getMyTutorSubjects()
      setSubjects(d?.subjects || [])
    } catch (e: any) {
      alert(e?.message || 'Error al crear asignatura')
    } finally {
      setSubjectSaving(false)
    }
  }

  const handleSubmitSubject = async (id: string) => {
    try {
      await api.submitTutorSubjectForApproval(id)
      const d: any = await api.getMyTutorSubjects()
      setSubjects(d?.subjects || [])
    } catch (e: any) {
      alert(e?.message || 'Error al enviar a revisión')
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('¿Eliminar esta asignatura?')) return
    try {
      await api.deleteTutorSubject(id)
      setSubjects(prev => prev.filter((s: any) => s.id !== id))
    } catch (e: any) {
      alert(e?.message || 'Error al eliminar')
    }
  }

  const handleAppeal = async () => {
    if (!appealText.trim()) return
    setAppealSending(true)
    try {
      // Appeal by updating profile with appeal_text
      await api.updateMyTutorProfile({ appeal_text: appealText.trim() })
      setAppealSent(true)
    } catch (e: any) {
      alert(e?.message || 'Error al enviar apelación')
    } finally {
      setAppealSending(false)
    }
  }

  const handleRateStudents = async () => {
    if (!ratingModal) return
    setRatingSaving(true)
    try {
      await api.rateStudentInClass(ratingModal.classId, { rating: ratingValue, comment: ratingComment })
      setRatingModal(null)
      setRatingComment('')
      // Refresh classes to reflect updated ratings
      const d: any = await api.getMyOwnClasses()
      setClasses(Array.isArray(d) ? d : d?.classes || [])
    } catch (err: any) {
      alert(err.message || 'Error al calificar')
    } finally {
      setRatingSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 90 }} />)}
        </div>
      </div>
    )
  }

  // No tutor profile yet — invite to apply
  if (!profile) {
    return (
      <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h2 style={{ margin: '0 0 12px' }}>Conviértete en Tutor Conniku</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
            Comparte tu conocimiento, genera ingresos con tus clases y apoya a otros estudiantes.
            Rellena tu postulación y el equipo la revisará en 48 horas hábiles.
          </p>
          <button
            onClick={() => onNavigate('/tutores?apply=true')}
            style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Postularme como Tutor
          </button>
        </div>
      </div>
    )
  }

  const meta = STATUS_META[profile.status] || STATUS_META.pending_review
  const isApproved = profile.status === 'approved'

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        padding: '20px 28px', borderRadius: 16, marginBottom: 24,
        background: `linear-gradient(135deg, #78350f, #f59e0b)`,
        color: '#fff', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Panel Tutor</div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>
            {user?.firstName} {user?.lastName}
          </h2>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{profile.professional_title || profile.career}</div>
          <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace', marginTop: 4 }}>{profile.tutor_role_number}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {meta.icon} {meta.label}
          </div>
          {isApproved && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              ⭐ {(profile.rating_average || 0).toFixed(1)} · {profile.total_classes} clases
            </div>
          )}
        </div>
      </div>

      {/* Status alert for non-approved */}
      {!isApproved && (
        <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 20, background: meta.color + '15', border: `1px solid ${meta.color}33`, color: meta.color, fontSize: 13 }}>
          <strong>{meta.icon} {meta.label}:</strong> {meta.desc}
          {profile.rejection_reason && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
              <strong>Motivo:</strong> {profile.rejection_reason}
            </div>
          )}
        </div>
      )}

      {/* Appeal section */}
      {profile.status === 'rejected' && !appealSent && !profile.appeal_text && (
        <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: '4px solid #8b5cf6' }}>
          <h4 style={{ margin: '0 0 10px', color: '#8b5cf6' }}>Apelar Decisión</h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Si crees que la decisión fue incorrecta, puedes enviar nueva información para ser revisada.
          </p>
          <textarea
            value={appealText}
            onChange={e => setAppealText(e.target.value)}
            rows={4}
            placeholder="Explica por qué deberías ser aprobado como tutor..."
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={handleAppeal}
            disabled={!appealText.trim() || appealSending}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: 13, cursor: appealText.trim() ? 'pointer' : 'not-allowed', opacity: appealText.trim() ? 1 : 0.5 }}
          >
            {appealSending ? 'Enviando...' : 'Enviar Apelación'}
          </button>
        </div>
      )}
      {(appealSent || profile.appeal_text) && profile.status !== 'approved' && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 20, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: 13 }}>
          📝 Apelación enviada — el equipo la revisará pronto.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: '📊 Resumen' },
          ...(isApproved ? [
            { id: 'materias', label: `📚 Mis Materias${subjects.length > 0 ? ` (${subjects.length})` : ''}` },
            { id: 'clases', label: '📅 Mis Clases' },
            { id: 'pagos', label: '💰 Mis Pagos' },
          ] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#f59e0b' : 'var(--text-muted)',
            borderBottom: tab === t.id ? '2px solid #f59e0b' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div>
          {isApproved && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Rating', value: (profile.rating_average || 0).toFixed(2), icon: '⭐', color: '#f59e0b' },
                { label: 'Clases Dadas', value: profile.total_classes, icon: '📚', color: '#3b82f6' },
                { label: 'Estudiantes', value: profile.total_students, icon: '👥', color: '#22c55e' },
                { label: 'Tarifa/Hora', value: fmtClp(profile.individual_rate), icon: '💰', color: '#8b5cf6' },
              ].map(kpi => (
                <div key={kpi.label} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{kpi.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.icon} {kpi.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Mi Página Pública */}
          {isApproved && user?.username && (() => {
            const publicUrl = `https://conniku.com/tutor/${user.username}`
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(publicUrl)}&color=1E293B&bgcolor=FFFFFF`
            const handleCopy = () => {
              navigator.clipboard.writeText(publicUrl).then(() => {
                setUrlCopied(true)
                setTimeout(() => setUrlCopied(false), 2000)
              })
            }
            const handleShare = () => {
              if (navigator.share) {
                navigator.share({ title: `${user.firstName} ${user.lastName} — Tutor Conniku`, text: `¡Reserva clases conmigo en Conniku!`, url: publicUrl })
              } else {
                handleCopy()
              }
            }
            return (
              <div className="card" style={{ padding: 20, marginBottom: 16, border: '1.5px solid rgba(59,130,246,0.3)', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <h4 style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>🌐 Mi Página Pública</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleShare}
                      style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      📤 Compartir
                    </button>
                    <button
                      onClick={() => setShowQR(v => !v)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #93c5fd', background: '#fff', color: '#1e40af', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      📱 QR
                    </button>
                    <button
                      onClick={() => onNavigate(`/tutor/${user.username}`)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #93c5fd', background: '#fff', color: '#1e40af', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      Ver página →
                    </button>
                  </div>
                </div>

                {/* URL display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: '#fff', border: '1px solid #bfdbfe' }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#1e40af', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {publicUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: urlCopied ? '#22c55e' : '#dbeafe', color: urlCopied ? '#fff' : '#1e40af', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  >
                    {urlCopied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>

                {/* QR Code */}
                {showQR && (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ padding: 10, borderRadius: 10, background: '#fff', border: '1px solid #bfdbfe', display: 'inline-block' }}>
                      <img src={qrUrl} alt="QR Code" width={128} height={128} style={{ display: 'block', borderRadius: 4 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#1e40af', fontWeight: 600 }}>Comparte este código QR con tus estudiantes</p>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>Pueden escanearlo para llegar directo a tu página y reservar clases contigo.</p>
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(publicUrl)}&color=1E293B&bgcolor=FFFFFF&format=png`}
                        download={`qr-tutor-${user.username}.png`}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
                      >
                        ⬇ Descargar QR
                      </a>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
                  Esta es tu página pública. Los estudiantes pueden ver tu perfil, reservar clases y dejar reseñas sin necesitar cuenta en Conniku.
                </div>
              </div>
            )
          })()}

          {/* Profile details */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14 }}>Información del Perfil</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Especialidades</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(profile.specialties || []).length > 0
                    ? (profile.specialties as string[]).map((s: string, i: number) => (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>{s}</span>
                      ))
                    : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sin especialidades registradas</span>
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Datos Bancarios</div>
                {profile.bank_name ? (
                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                    <div>{profile.bank_name} — {profile.bank_account_type}</div>
                    <div>Cta: {profile.bank_account_number}</div>
                    <div>RUT: {profile.rut}</div>
                    <div>Frecuencia: {profile.payment_frequency === 'per_class' ? 'Por clase' : profile.payment_frequency === 'biweekly' ? 'Quincenal' : 'Mensual'}</div>
                  </div>
                ) : <span style={{ color: '#ef4444', fontSize: 12 }}>⚠️ Sin datos bancarios — actualiza tu perfil</span>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Acuerdo Marco</div>
                <div style={{ fontSize: 12 }}>
                  {profile.contract_signed
                    ? <span style={{ color: '#22c55e' }}>✓ Firmado el {fmtDate(profile.contract_signed_at)}</span>
                    : (
                      <div>
                        <span style={{ color: '#ef4444' }}>✗ Sin firmar</span>
                        <button onClick={() => api.signTutorContract()} style={{ marginLeft: 10, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Firmar
                        </button>
                      </div>
                    )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Institución</div>
                <div style={{ fontSize: 12 }}>{profile.institution || profile.career || '—'} {profile.graduation_year ? `(${profile.graduation_year})` : ''}</div>
              </div>
            </div>
            {profile.bio && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Biografía</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{profile.bio}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clases tab */}
      {tab === 'clases' && (
        <div>
          {classes.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <h3>Sin clases registradas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tus clases programadas y pasadas aparecerán aquí.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {classes.map((cls: any) => {
                const canEnter = ['in_progress', 'confirmed', 'published'].includes(cls.status)
                const statusColors: Record<string, { bg: string; color: string }> = {
                  completed: { bg: '#22c55e22', color: '#22c55e' },
                  published: { bg: '#3b82f622', color: '#3b82f6' },
                  confirmed: { bg: '#3b82f622', color: '#3b82f6' },
                  in_progress: { bg: '#22c55e22', color: '#22c55e' },
                  cancelled: { bg: '#6b728022', color: '#6b7280' },
                  disputed: { bg: '#ef444422', color: '#ef4444' },
                }
                const statusLabels: Record<string, string> = {
                  completed: 'Completada', published: 'Publicada', confirmed: 'Confirmada',
                  in_progress: 'En curso', cancelled: 'Cancelada', disputed: 'Objetada',
                }
                const sc = statusColors[cls.status] || { bg: '#f59e0b22', color: '#f59e0b' }
                const enrollments: any[] = cls.enrollments || []
                const unrated = enrollments.filter((e: any) => e.payment_status === 'paid' && !e.tutor_rating_of_student)
                const canRate = cls.status === 'completed' && unrated.length > 0
                return (
                  <div key={cls.id} className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{cls.subject || cls.title || 'Clase'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {fmtDate(cls.scheduled_at)} · {enrollments.length || cls.enrolled_count || 0} estudiante{(enrollments.length || cls.enrolled_count || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                      {statusLabels[cls.status] || cls.status}
                    </span>
                    {canEnter && (
                      <button
                        onClick={() => onNavigate(`/class-room/${cls.id}`)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: cls.status === 'in_progress' ? '#22c55e' : 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        {cls.status === 'in_progress' ? '▶ Entrar a Sala' : '🚀 Iniciar / Entrar'}
                      </button>
                    )}
                    {canRate && (
                      <button
                        onClick={() => { setRatingModal({ classId: cls.id, className: cls.title || cls.subject || 'Clase', unratedCount: unrated.length }); setRatingValue(5); setRatingComment('') }}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        ⭐ Calificar ({unrated.length})
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Materias tab */}
      {tab === 'materias' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>Mis Asignaturas ({subjects.length})</h4>
            <button
              onClick={() => setShowSubjectForm(v => !v)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              {showSubjectForm ? 'Cancelar' : '+ Nueva Asignatura'}
            </button>
          </div>

          {/* Create form */}
          {showSubjectForm && (
            <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: '4px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 14 }}>Nueva Asignatura</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Nombre *</label>
                  <input value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="ej. Cálculo Diferencial" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Categoría</label>
                  <input value={subjectForm.category} onChange={e => setSubjectForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="ej. Matemáticas" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Nivel</label>
                  <select value={subjectForm.level} onChange={e => setSubjectForm(p => ({ ...p, level: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4 }}>
                    <option value="">Seleccionar...</option>
                    <option value="Básico">Básico</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Duración sesión (horas)</label>
                  <input type="number" min={0.5} max={2} step={0.5} value={subjectForm.duration_hours} onChange={e => setSubjectForm(p => ({ ...p, duration_hours: parseFloat(e.target.value) || 1 }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Máx. estudiantes (1-5)</label>
                  <input type="number" min={1} max={5} value={subjectForm.max_students} onChange={e => setSubjectForm(p => ({ ...p, max_students: parseInt(e.target.value) || 1 }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Descripción * (mínimo requerido para enviar a revisión)</label>
                  <textarea value={subjectForm.description} onChange={e => setSubjectForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Describe qué aprenderá el estudiante en esta asignatura..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Objetivos de Aprendizaje</label>
                  <textarea value={subjectForm.learning_objectives} onChange={e => setSubjectForm(p => ({ ...p, learning_objectives: e.target.value }))}
                    rows={2} placeholder="Al finalizar la clase, el estudiante podrá..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Requisitos Previos</label>
                  <textarea value={subjectForm.prerequisites} onChange={e => setSubjectForm(p => ({ ...p, prerequisites: e.target.value }))}
                    rows={2} placeholder="El estudiante debe saber..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSubjectForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                <button onClick={handleCreateSubject} disabled={subjectSaving || !subjectForm.name.trim() || !subjectForm.description.trim()}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: subjectSaving || !subjectForm.name.trim() ? 0.6 : 1 }}>
                  {subjectSaving ? 'Guardando...' : 'Guardar Borrador'}
                </button>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                💡 La asignatura se guarda como borrador. Deberás enviarla a revisión para que CEO/UTP la apruebe antes de poder usarla en clases.
              </div>
            </div>
          )}

          {subjects.length === 0 && !showSubjectForm && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <h3>Sin asignaturas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Crea tu primera asignatura. El equipo Conniku la revisará y aprobará.</p>
            </div>
          )}

          {subjects.map((s: any) => {
            const subStatusColor = s.status === 'approved' ? '#22c55e' : s.status === 'rejected' ? '#ef4444' : s.status === 'pending_approval' ? '#f59e0b' : '#94a3b8'
            const subStatusLabel = s.status === 'approved' ? '✅ Aprobada' : s.status === 'rejected' ? '❌ Rechazada' : s.status === 'pending_approval' ? '⏳ En Revisión' : '📝 Borrador'
            return (
              <div key={s.id} className="card" style={{ padding: 16, marginBottom: 10, borderLeft: `4px solid ${subStatusColor}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{s.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: subStatusColor }}>{subStatusLabel}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {s.category && `${s.category} · `}{s.level && `${s.level} · `}⏱ {s.duration_hours}h · 👥 Máx {s.max_students}
                    </div>
                    {s.description && <div style={{ fontSize: 12, lineHeight: 1.5 }}>{s.description.slice(0, 150)}{s.description.length > 150 ? '…' : ''}</div>}
                    {s.rejection_reason && (
                      <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, fontSize: 12, color: '#ef4444' }}>
                        <strong>Motivo rechazo:</strong> {s.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(s.status === 'draft' || s.status === 'rejected') && (
                      <button onClick={() => handleSubmitSubject(s.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                        Enviar a Revisión
                      </button>
                    )}
                    {(s.status === 'draft' || s.status === 'rejected') && (
                      <button onClick={() => handleDeleteSubject(s.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ef444422', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagos tab */}
      {tab === 'pagos' && (
        <div>
          {payments.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
              <h3>Sin pagos registrados</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tus pagos aparecen después de que una clase sea confirmada.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {payments.map((p: any) => (
                <div key={p.id} className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Clase del {fmtDate(p.class_date || p.created_at)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Bruto: {fmtClp(p.tutor_amount_clp || p.amount_clp)} · Comisión Conniku: {fmtClp(p.commission_clp)} · Neto: {fmtClp(p.net_clp)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Estado: <strong>{p.payment_status}</strong>
                    </div>
                  </div>
                  {p.payment_status === 'pending_boleta' && !p.boleta_path && (
                    <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⏳ Sube tu boleta</span>
                  )}
                  {p.payment_status === 'paid' && (
                    <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>✓ Pagado</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Rating Modal ─── */}
      {ratingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setRatingModal(null) }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Calificar estudiantes</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>{ratingModal.className}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRatingValue(n)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, opacity: n <= ratingValue ? 1 : 0.25, transition: 'opacity 0.15s', padding: 2 }}>
                  ⭐
                </button>
              ))}
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', alignSelf: 'center', marginLeft: 6 }}>{ratingValue}/5</span>
            </div>

            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
              placeholder="Comentario opcional (solo visible internamente)"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />

            <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-muted)' }}>
              Esta calificación aplica a los {ratingModal.unratedCount} estudiante{ratingModal.unratedCount !== 1 ? 's' : ''} sin calificar de esta clase.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRatingModal(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleRateStudents} disabled={ratingSaving}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: ratingSaving ? 'wait' : 'pointer', opacity: ratingSaving ? 0.7 : 1 }}>
                {ratingSaving ? 'Guardando...' : 'Guardar Calificación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
