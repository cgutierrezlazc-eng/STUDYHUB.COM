import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import MilestonePopup from '../components/MilestonePopup'
import { AlertTriangle, CheckCircle, FileText, Medal, Star, Target, BookOpen } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

// Professional SVG category icons
const CategoryIcon = ({ category, size = 16, color }: { category: string; size?: number; color?: string }) => {
  const c = color || CATEGORY_COLORS[category] || '#64748B'
  const s = { width: size, height: size, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' } as React.CSSProperties
  switch (category) {
    case 'communication':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'leadership':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'emotional':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>
    case 'thinking':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    case 'productivity':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'ethics':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'career':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  }
}

// Professional course icon (replaces emoji on cards)
const CourseIcon = ({ category, size = 28 }: { category?: string; size?: number }) => {
  const color = CATEGORY_COLORS[category || ''] || '#64748B'
  return (
    <div style={{
      width: size + 8, height: size + 8, borderRadius: 8,
      background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <CategoryIcon category={category || ''} size={size * 0.65} color={color} />
    </div>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
  communication: '#5B5FC7', leadership: '#2D8A56', emotional: '#C4882A',
  thinking: '#2D62C8', productivity: '#0891B2', ethics: '#7C3AED', career: '#DB2777',
}

export default function Courses({ onNavigate }: Props) {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [courseDetail, setCourseDetail] = useState<any>(null)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<number>(0)
  const [generating, setGenerating] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizResult, setQuizResult] = useState<any>(null)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<any[]>([])
  const [tab, setTab] = useState<'catalog' | 'my-certs'>('catalog')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [milestonePopup, setMilestonePopup] = useState<{type: string, title: string, description: string, icon: string} | null>(null)
  // ─── Randomized quiz questions (loaded fresh each attempt) ───
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [quizQuestionsLoading, setQuizQuestionsLoading] = useState(false)
  // ─── Catalog search ───
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Exercise state ───
  const [exerciseMode, setExerciseMode] = useState(false)
  const [exercises, setExercises] = useState<any[]>([])
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, number>>({})
  const [exerciseResult, setExerciseResult] = useState<any>(null)
  const [exerciseError, setExerciseError] = useState<string | null>(null)
  const [exerciseStats, setExerciseStats] = useState<any>(null)
  const [exerciseLoading, setExerciseLoading] = useState(false)

  // ─── Progress persistence helpers ───
  const saveProgress = (courseId: string, completedLessons: string[]) => {
    try { localStorage.setItem(`conniku_course_progress_${courseId}`, JSON.stringify(completedLessons)) } catch {}
  }
  const loadProgress = (courseId: string): string[] | null => {
    try { const d = localStorage.getItem(`conniku_course_progress_${courseId}`); return d ? JSON.parse(d) : null } catch { return null }
  }
  const saveQuizResult = (courseId: string, result: any) => {
    try { localStorage.setItem(`conniku_course_quiz_${courseId}`, JSON.stringify(result)) } catch {}
  }
  const loadQuizResult = (courseId: string): any => {
    try { const d = localStorage.getItem(`conniku_course_quiz_${courseId}`); return d ? JSON.parse(d) : null } catch { return null }
  }
  const saveExerciseResult = (courseId: string, result: any, stats: any) => {
    try { localStorage.setItem(`conniku_course_exercises_${courseId}`, JSON.stringify({ result, stats })) } catch {}
  }
  const loadExerciseResult = (courseId: string): { result: any; stats: any } | null => {
    try { const d = localStorage.getItem(`conniku_course_exercises_${courseId}`); return d ? JSON.parse(d) : null } catch { return null }
  }

  const loadQuizQuestions = async (courseId: string) => {
    setQuizQuestionsLoading(true)
    setQuizQuestions([])
    setQuizAnswers({})
    setQuizResult(null)
    try {
      const data = await api.getCourseQuizQuestions(courseId)
      setQuizQuestions(data.questions || [])
    } catch {
      setQuizQuestions([])
    } finally {
      setQuizQuestionsLoading(false)
    }
  }

  const handleDownloadCertificate = (courseName: string, score: number, studentName: string) => {
    const dateStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificado — ${courseName}</title><style>@media print{body{margin:0}}</style></head><body style="margin:0;padding:0;font-family:Georgia,serif;">
<div style="text-align:center;padding:60px;border:3px double #2563EB;margin:40px;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#2563EB;margin-bottom:20px;">Conniku SpA</div>
  <h1 style="font-size:32px;margin:0 0 30px;color:#1E293B;">Certificado de Completaci\u00f3n</h1>
  <p style="font-size:16px;color:#64748B;margin:0 0 8px;">Se certifica que</p>
  <h2 style="font-size:28px;margin:0 0 20px;color:#1E293B;border-bottom:2px solid #2563EB;padding-bottom:8px;display:inline-block;">${studentName}</h2>
  <p style="font-size:16px;color:#64748B;margin:0 0 8px;">ha completado exitosamente el curso</p>
  <h2 style="font-size:24px;margin:0 0 20px;color:#2563EB;">${courseName}</h2>
  <p style="font-size:18px;color:#1E293B;margin:0 0 30px;">con una calificaci\u00f3n de <strong>${score}%</strong></p>
  <p style="font-size:14px;color:#64748B;margin:0 0 8px;">Fecha: ${dateStr}</p>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E2E8F0;">
    <p style="font-size:13px;color:#94A3B8;margin:0;">Conniku SpA — Plataforma de Estudio Universitario</p>
    <p style="font-size:11px;color:#CBD5E1;margin:4px 0 0;">conniku.com</p>
  </div>
</div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  useEffect(() => { loadCourses() }, [])

  const loadCourses = async () => {
    setError(null)
    try {
      const data = await api.getCourses(selectedCategory || undefined)
      setCourses(data.courses || [])
      setCategories(data.categories || {})
    } catch (err: any) {
      console.error('Failed to load courses:', err)
      setError('No se pudieron cargar los cursos. Intenta de nuevo más tarde.')
    }
    setLoading(false)
  }

  const openCourse = async (courseId: string) => {
    setCourseError(null)
    try {
      const data = await api.getCourse(courseId)
      setCourseDetail(data)
      setSelectedCourse(data)
      setActiveLesson(0)
      setQuizMode(false)
      setQuizResult(null)
      setQuizAnswers({})
      setExerciseMode(false)
      setExercises([])
      setExerciseAnswers({})
      setExerciseResult(null)
      setExerciseStats(null)
      setSidebarOpen(false)

      // Restore saved progress from localStorage
      const savedProgress = loadProgress(courseId)
      if (savedProgress && data.lessons) {
        data.lessons = data.lessons.map((l: any) => ({
          ...l,
          completed: l.completed || savedProgress.includes(l.id),
        }))
        if (data.progress) {
          const merged = Array.from(new Set([...(data.progress.completedLessons || []), ...savedProgress]))
          data.progress.completedLessons = merged
        }
      }
      const savedQuiz = loadQuizResult(courseId)
      if (savedQuiz && !data.progress?.quizPassed) {
        // Only restore if quiz was passed (don't restore failed attempts)
        if (savedQuiz.passed) {
          setQuizResult(savedQuiz)
          setQuizMode(true)
        }
      }
      const savedExercise = loadExerciseResult(courseId)
      if (savedExercise?.stats) {
        setExerciseStats(savedExercise.stats)
      }

      if (data.needsGeneration) {
        setGenerating(true)
        try {
          await api.generateCourseContent(courseId)
          const updated = await api.getCourse(courseId)
          setCourseDetail(updated)
          setSelectedCourse(updated)
        } catch (err: any) {
          console.error('Course generation failed:', err)
          setCourseError('El contenido del curso no está disponible en este momento.')
        }
        setGenerating(false)
      }
    } catch (err: any) {
      console.error('Failed to open course:', err)
      setCourseError('No se pudo cargar el curso. Intenta de nuevo más tarde.')
    }
  }

  const handleCompleteLesson = async (lessonId: string) => {
    if (!courseDetail) return
    try {
      const result = await api.completeLesson(courseDetail.id, lessonId)
      setCourseDetail((prev: any) => ({
        ...prev,
        progress: { ...prev.progress, completedLessons: result.completedLessons },
        lessons: prev.lessons.map((l: any) => ({ ...l, completed: result.completedLessons.includes(l.id) })),
      }))
      // Persist progress to localStorage
      saveProgress(courseDetail.id, result.completedLessons)
      // Auto-advance to next lesson
      const lessons = courseDetail.lessons || []
      if (activeLesson < lessons.length - 1) {
        setTimeout(() => setActiveLesson(activeLesson + 1), 600)
      }
    } catch (err: any) {
      console.error('Failed to complete lesson:', err)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!courseDetail) return
    setQuizError(null)
    try {
      const result = await api.submitCourseQuiz(courseDetail.id, quizAnswers)
      setQuizResult(result)
      // Persist quiz result to localStorage
      saveQuizResult(courseDetail.id, result)
      if (result.passed) {
        setCourseDetail((prev: any) => ({
          ...prev,
          progress: { ...prev.progress, completed: true, quizPassed: true, certificateId: result.certificateId },
        }))

        // Show reward popup if any rewards were granted, otherwise show progress message
        const rewards = result.rewardsGranted || []
        const progressInfo = result.courseRewardProgress

        if (rewards.length > 0) {
          const reward = rewards[rewards.length - 1] // Show highest reward (MAX > PRO)
          setMilestonePopup({
            type: 'reward',
            title: reward.title,
            description: progressInfo?.message
              ? `${reward.description}\n\n${progressInfo.message}`
              : `${reward.description} — ¡Disfruta tu suscripción ${reward.tier.toUpperCase()}!`,
            icon: reward.tier === 'max' ? '◆' : '★',
          })
        } else if (progressInfo?.message) {
          setMilestonePopup({
            type: 'course_completed',
            title: '¡Curso completado!',
            description: `${courseDetail.title} — ${result.score}%\n\n${progressInfo.message}`,
            icon: '✦',
          })
        } else {
          setMilestonePopup({
            type: 'course_completed',
            title: '¡Curso completado!',
            description: `Has completado ${courseDetail.title} con ${result.score}%`,
            icon: '✦',
          })
        }
      }
    } catch (err: any) {
      console.error('Quiz submission failed:', err)
      setQuizError('Error al enviar el examen. Intenta de nuevo.')
    }
  }

  const loadExercises = async () => {
    if (!courseDetail) return
    setExerciseLoading(true)
    setExerciseError(null)
    setExerciseResult(null)
    setExerciseAnswers({})
    try {
      const data = await api.getExercises(courseDetail.id, 5)
      setExercises(data.questions || [])
      setExerciseStats(data.stats || null)
    } catch (err: any) {
      console.error('Failed to load exercises:', err)
      setExerciseError(err.message || 'No se pudieron cargar los ejercicios.')
    }
    setExerciseLoading(false)
  }

  const handleSubmitExercises = async () => {
    if (!courseDetail || exercises.length === 0) return
    setExerciseError(null)
    try {
      const result = await api.submitExercises(courseDetail.id, exerciseAnswers, exercises)
      setExerciseResult(result)
      setExerciseStats(result.stats || null)
      // Persist exercise results to localStorage
      saveExerciseResult(courseDetail.id, result, result.stats || null)
    } catch (err: any) {
      console.error('Exercise submission failed:', err)
      setExerciseError('Error al enviar ejercicios. Intenta de nuevo.')
    }
  }

  const loadCertificates = async () => {
    try { setCertificates(await api.getMyCertificates()) } catch (err: any) {
      console.error('Failed to load certificates:', err)
    }
  }

  // ─── COURSE DETAIL VIEW ───────────────────────────────────────
  if (courseDetail) {
    const lessons = courseDetail.lessons || []
    const currentLesson = lessons[activeLesson]
    const completedCount = lessons.filter((l: any) => l.completed).length
    const allLessonsComplete = lessons.length > 0 && completedCount === lessons.length
    const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
    const catColor = CATEGORY_COLORS[courseDetail.category] || '#2D62C8'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* ─── Top bar ─── */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '12px 20px', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => { setCourseDetail(null); setSelectedCourse(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                ← <span style={{ display: 'inline-block' }}>Catálogo</span>
              </button>
              <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{courseDetail.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Progress pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{completedCount}/{lessons.length} lecciones</span>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 2, background: catColor, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontWeight: 600, color: catColor }}>{progressPercent}%</span>
              </div>
              {/* Mobile menu toggle */}
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, display: 'none', padding: 4 }}
                className="mobile-sidebar-toggle">
                ☰
              </button>
            </div>
          </div>
        </div>

        {courseError && (
          <div style={{ maxWidth: 1100, margin: '16px auto', padding: '0 20px' }}>
            <div style={{
              padding: '14px 18px', borderRadius: 10,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#B91C1C',
            }}>
              {AlertTriangle({ size: 14 })} {courseError}
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 600, fontSize: 12 }}
                onClick={() => { setCourseError(null); openCourse(courseDetail.id) }}>
                Reintentar
              </button>
            </div>
          </div>
        )}

        {generating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
            <h3 style={{ marginTop: 20, color: 'var(--text-primary)' }}>Preparando contenido...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Esto puede tomar unos segundos</p>
          </div>
        ) : (
          <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', minHeight: 'calc(100vh - 56px)' }}>
            {/* ─── Sidebar: Lesson navigation ─── */}
            <div className={`course-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
              width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
              background: '#fff', padding: '20px 0', overflowY: 'auto',
              position: 'sticky', top: 56, height: 'calc(100vh - 56px)',
            }}>
              {/* Course header in sidebar */}
              <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <CourseIcon category={courseDetail.category} size={28} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{courseDetail.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      ~{courseDetail.estimatedMinutes} min · {courseDetail.difficulty === 'intermediate' ? 'Intermedio' : 'Principiante'}
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Progreso</span>
                    <span style={{ fontWeight: 600, color: progressPercent === 100 ? '#059669' : catColor }}>{progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 3, background: progressPercent === 100 ? '#059669' : catColor, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>

              {/* Lesson list */}
              <div style={{ padding: '8px 8px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 8px 4px', marginTop: 4 }}>
                  Lecciones
                </div>
                {lessons.map((lesson: any, i: number) => {
                  const isActive = i === activeLesson && !quizMode
                  return (
                    <button key={lesson.id} onClick={() => { setActiveLesson(i); setQuizMode(false); setExerciseMode(false); setSidebarOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 10px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                        background: isActive ? `${catColor}0D` : 'transparent',
                        transition: 'background 0.15s',
                      }}>
                      {/* Step indicator */}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        background: lesson.completed ? '#059669' : isActive ? catColor : 'transparent',
                        color: lesson.completed || isActive ? '#fff' : 'var(--text-muted)',
                        border: lesson.completed || isActive ? 'none' : '2px solid var(--border)',
                      }}>
                        {lesson.completed ? '✓' : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: isActive ? 600 : 400, lineHeight: 1.3,
                          color: isActive ? catColor : 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                        }}>
                          {lesson.title}
                        </div>
                        {lesson.estimatedMinutes && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            ~{lesson.estimatedMinutes} min
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}

                {/* Quiz link */}
                {courseDetail.quiz && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 8px' }} />
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 8px 4px' }}>
                      Evaluación
                    </div>
                    <button onClick={() => { setQuizMode(true); setExerciseMode(false); setSidebarOpen(false); if (quizQuestions.length === 0 && !quizQuestionsLoading) loadQuizQuestions(courseDetail.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', width: '100%',
                        borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: quizMode ? `${catColor}0D` : 'transparent',
                      }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                        background: courseDetail.progress?.quizPassed ? '#059669' : quizMode ? catColor : 'transparent',
                        color: courseDetail.progress?.quizPassed || quizMode ? '#fff' : 'var(--text-muted)',
                        border: courseDetail.progress?.quizPassed || quizMode ? 'none' : '2px solid var(--border)',
                      }}>
                        {courseDetail.progress?.quizPassed ? '✓' : FileText({ size: 13 })}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: quizMode ? 600 : 400, color: quizMode ? catColor : 'var(--text-primary)' }}>
                          Examen Final
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          10 preguntas · 80% para aprobar
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {/* Ejercicios link - visible after completing at least 1 lesson */}
                {completedCount > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 8px' }} />
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 8px 4px' }}>
                      Practica
                    </div>
                    <button onClick={() => { setExerciseMode(true); setQuizMode(false); setSidebarOpen(false); if (exercises.length === 0 && !exerciseLoading) loadExercises() }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', width: '100%',
                        borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: exerciseMode ? `${catColor}0D` : 'transparent',
                      }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                        background: exerciseMode ? catColor : 'transparent',
                        color: exerciseMode ? '#fff' : 'var(--text-muted)',
                        border: exerciseMode ? 'none' : '2px solid var(--border)',
                      }}>
                        {Target({ size: 13 })}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: exerciseMode ? 600 : 400, color: exerciseMode ? catColor : 'var(--text-primary)' }}>
                          Ejercicios
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Preguntas que nunca se repiten
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ─── Main content ─── */}
            <div style={{ flex: 1, minWidth: 0, padding: '24px 32px 60px', overflowY: 'auto' }}>
              {exerciseMode ? (
                <div style={{ maxWidth: 720 }}>
                  {exerciseLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
                      <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 14 }}>Preparando ejercicios...</p>
                    </div>
                  ) : exerciseError && exercises.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <p style={{ color: '#DC2626', fontSize: 14 }}>{exerciseError}</p>
                      <button onClick={loadExercises} style={{
                        padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: catColor, color: '#fff', fontSize: 13, fontWeight: 600, marginTop: 12,
                      }}>Reintentar</button>
                    </div>
                  ) : exerciseResult ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{
                        width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: exerciseResult.score >= 70 ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.06)',
                        fontSize: 48,
                      }}>
                        {exerciseResult.score >= 70 ? CheckCircle({ size: 48, color: 'var(--accent-green)' }) : Target({ size: 48 })}
                      </div>
                      <h2 style={{ margin: '0 0 8px', fontSize: 24, color: 'var(--text-primary)' }}>
                        {exerciseResult.score >= 70 ? 'Muy bien!' : 'Sigue practicando'}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                        +{exerciseResult.xpAwarded} XP ganados por completar esta practica
                      </p>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 20,
                        background: 'var(--bg-secondary)', borderRadius: 12, padding: '16px 28px', marginBottom: 24,
                      }}>
                        <div>
                          <div style={{ fontSize: 36, fontWeight: 700, color: exerciseResult.score >= 70 ? '#059669' : '#DC2626' }}>{exerciseResult.score}%</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Puntuacion</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                        <div>
                          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)' }}>{exerciseResult.correct}/{exerciseResult.total}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Correctas</div>
                        </div>
                      </div>

                      {/* Stats */}
                      {exerciseStats && (
                        <div style={{
                          margin: '0 auto 24px', maxWidth: 360, padding: '14px 18px',
                          background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 13,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Total ejercicios resueltos</span>
                            <strong>{exerciseStats.totalAnswered}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Precision general</span>
                            <strong style={{ color: exerciseStats.accuracy >= 70 ? '#059669' : '#DC2626' }}>{exerciseStats.accuracy}%</strong>
                          </div>
                        </div>
                      )}

                      {/* Answer details */}
                      <div style={{ textAlign: 'left', marginBottom: 24 }}>
                        {exerciseResult.results?.map((r: any, ri: number) => (
                          <div key={ri} style={{
                            padding: '14px 16px', marginBottom: 8, borderRadius: 8,
                            background: r.isCorrect ? 'rgba(5,150,105,0.05)' : 'rgba(239,68,68,0.04)',
                            border: `1px solid ${r.isCorrect ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.12)'}`,
                          }}>
                            <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                              {r.isCorrect ? '✓' : '✗'} {r.question}
                            </p>
                            {!r.isCorrect && r.explanation && (
                              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{r.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <button onClick={loadExercises} style={{
                        padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: catColor, color: '#fff', fontSize: 14, fontWeight: 600,
                      }}>
                        Generar mas ejercicios
                      </button>
                    </div>
                  ) : exercises.length > 0 ? (
                    <div>
                      {/* Exercise header */}
                      <div style={{ marginBottom: 28 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                          color: catColor, marginBottom: 6,
                        }}>
                          Practica — Ejercicios que nunca se repiten
                        </div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: 'var(--text-primary)' }}>
                          {courseDetail.title}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
                          Cada vez que practiques recibiras preguntas diferentes. Nuestro sistema avanzado se asegura de que nunca veas la misma pregunta dos veces.
                        </p>
                        {exerciseStats && exerciseStats.totalAnswered > 0 && (
                          <div style={{
                            display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)',
                          }}>
                            <span>{Target({ size: 12 })} {exerciseStats.totalAnswered} ejercicios resueltos</span>
                            <span>{CheckCircle({ size: 12 })} {exerciseStats.accuracy}% precision</span>
                          </div>
                        )}
                        <div style={{
                          display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-muted)',
                        }}>
                          <span>{FileText({ size: 12 })} {exercises.length} preguntas</span>
                          <span>{CheckCircle({ size: 12 })} {Object.keys(exerciseAnswers).length} respondidas</span>
                        </div>
                      </div>

                      {/* Exercise questions */}
                      {exercises.map((q: any, qi: number) => (
                        <div key={qi} style={{
                          marginBottom: 20, padding: '18px 20px',
                          background: '#fff', borderRadius: 10,
                          border: `1px solid ${exerciseAnswers[String(qi)] !== undefined ? `${catColor}30` : 'var(--border)'}`,
                          transition: 'border-color 0.2s',
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            <span style={{ color: catColor, marginRight: 6 }}>{qi + 1}.</span>
                            {q.question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {q.options.map((opt: string, oi: number) => {
                              const isSelected = exerciseAnswers[String(qi)] === oi
                              return (
                                <button key={oi} onClick={() => setExerciseAnswers(prev => ({ ...prev, [String(qi)]: oi }))}
                                  style={{
                                    padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                                    border: `1.5px solid ${isSelected ? catColor : 'var(--border)'}`,
                                    background: isSelected ? `${catColor}08` : '#fff',
                                    color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.5,
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    transition: 'all 0.15s',
                                  }}>
                                  <span style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 600,
                                    background: isSelected ? catColor : 'transparent',
                                    color: isSelected ? '#fff' : 'var(--text-muted)',
                                    border: isSelected ? 'none' : '2px solid var(--border)',
                                  }}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {exerciseError && (
                        <div style={{
                          padding: '12px 16px', marginBottom: 16, borderRadius: 8,
                          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                          fontSize: 13, color: '#DC2626',
                        }}>
                          {exerciseError}
                        </div>
                      )}

                      {/* Submit */}
                      <div style={{
                        position: 'sticky', bottom: 0, background: 'var(--bg-primary)',
                        padding: '16px 0', borderTop: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {Object.keys(exerciseAnswers).length}/{exercises.length} respondidas
                        </span>
                        <button onClick={handleSubmitExercises}
                          disabled={Object.keys(exerciseAnswers).length < exercises.length}
                          style={{
                            padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: Object.keys(exerciseAnswers).length < exercises.length ? 'var(--border)' : catColor,
                            color: Object.keys(exerciseAnswers).length < exercises.length ? 'var(--text-muted)' : '#fff',
                            fontSize: 14, fontWeight: 600,
                            opacity: Object.keys(exerciseAnswers).length < exercises.length ? 0.6 : 1,
                          }}>
                          Enviar respuestas
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : !quizMode && !exerciseMode && currentLesson ? (
                <div>
                  {/* Lesson header */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: catColor, background: `${catColor}0D`, padding: '3px 10px', borderRadius: 4,
                      }}>
                        Lección {activeLesson + 1} de {lessons.length}
                      </span>
                      {currentLesson.estimatedMinutes && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          · ~{currentLesson.estimatedMinutes} min de lectura
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lesson content */}
                  <div className="lesson-content" style={{
                    fontSize: 15, lineHeight: 1.85, color: 'var(--text-secondary)',
                    maxWidth: 720,
                  }}
                    dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>Contenido no disponible.</p>' }} />

                  {/* Bottom navigation */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)',
                    flexWrap: 'wrap', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {activeLesson > 0 && (
                        <button onClick={() => setActiveLesson(activeLesson - 1)}
                          style={{
                            padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)',
                            background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                          ← Anterior
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {!currentLesson.completed ? (
                        <button onClick={() => handleCompleteLesson(currentLesson.id)}
                          style={{
                            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                          ✓ Completar lección
                        </button>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                          ✓ Completada
                        </span>
                      )}
                      {activeLesson < lessons.length - 1 ? (
                        <button onClick={() => setActiveLesson(activeLesson + 1)}
                          style={{
                            padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: catColor, color: '#fff', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                          Siguiente →
                        </button>
                      ) : allLessonsComplete && courseDetail.quiz ? (
                        <button onClick={() => { setQuizMode(true); setExerciseMode(false); if (quizQuestions.length === 0 && !quizQuestionsLoading) loadQuizQuestions(courseDetail.id) }}
                          style={{
                            padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: catColor, color: '#fff', fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                          Ir al examen →
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : quizMode && courseDetail.quiz ? (
                <div style={{ maxWidth: 720 }}>
                  {quizResult ? (
                    /* ── Results screen ── */
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{
                        width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: quizResult.passed ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.06)',
                      }}>
                        {quizResult.passed ? CheckCircle({ size: 48, color: '#059669' }) : BookOpen({ size: 48 })}
                      </div>
                      <h2 style={{ margin: '0 0 8px', fontSize: 24, color: 'var(--text-primary)' }}>
                        {quizResult.passed ? '¡Curso aprobado!' : 'No alcanzaste el mínimo'}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                        {quizResult.passed
                          ? 'Has demostrado dominio del contenido. Tu certificado fue generado.'
                          : 'Necesitas al menos 80% para aprobar. Las preguntas serán diferentes en el próximo intento.'}
                      </p>
                      {/* Score */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 20,
                        background: 'var(--bg-secondary)', borderRadius: 12, padding: '16px 28px', marginBottom: 24,
                      }}>
                        <div>
                          <div style={{ fontSize: 36, fontWeight: 700, color: quizResult.passed ? '#059669' : '#DC2626' }}>{quizResult.score}%</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Puntuación</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                        <div>
                          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)' }}>{quizResult.correct}/{quizResult.total}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Correctas</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: quizResult.passed ? '#059669' : '#DC2626' }}>
                            {quizResult.passed ? '✓' : `${80 - quizResult.score}% falta`}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mínimo 80%</div>
                        </div>
                      </div>

                      {quizResult.passed && (
                        <div style={{
                          padding: '16px 20px', background: 'rgba(5,150,105,0.06)',
                          borderRadius: 10, border: '1px solid rgba(5,150,105,0.15)', maxWidth: 400, margin: '0 auto 20px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                            {Medal({ size: 18 })}
                            <strong style={{ color: '#059669', fontSize: 14 }}>Certificado de finalización emitido</strong>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                            {quizResult.courseTitle} — agregado a tu perfil profesional
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!quizResult.passed ? (
                          <button
                            onClick={() => loadQuizQuestions(courseDetail.id)}
                            style={{ padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer', background: catColor, color: '#fff', fontSize: 14, fontWeight: 600 }}
                          >
                            Intentar de nuevo (nuevas preguntas)
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDownloadCertificate(
                                courseDetail.title, quizResult.score,
                                user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email || 'Estudiante')
                              )}
                              style={{ padding: '12px 28px', borderRadius: 8, border: `2px solid ${catColor}`, cursor: 'pointer', background: '#fff', color: catColor, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              Descargar certificado
                            </button>
                            <button
                              onClick={() => { setCourseDetail(null); setSelectedCourse(null) }}
                              style={{ padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer', background: catColor, color: '#fff', fontSize: 14, fontWeight: 600 }}
                            >
                              Volver al catálogo
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : quizQuestionsLoading ? (
                    /* ── Loading new set of questions ── */
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Preparando preguntas...</p>
                    </div>
                  ) : quizQuestions.length === 0 ? (
                    /* ── No questions available ── */
                    <div style={{ textAlign: 'center', padding: 60 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay preguntas disponibles para este curso.</p>
                      <button onClick={() => loadQuizQuestions(courseDetail.id)} className="btn btn-primary" style={{ marginTop: 12 }}>
                        Reintentar
                      </button>
                    </div>
                  ) : (
                    /* ── Quiz taking ── */
                    <div>
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: catColor, marginBottom: 6 }}>
                          Evaluación Final
                        </div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: 'var(--text-primary)' }}>{courseDetail.title}</h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
                          Responde todas las preguntas. Necesitas <strong>80%</strong> para aprobar y obtener tu certificado.
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>{FileText({ size: 12 })} {quizQuestions.length} preguntas</span>
                          <span>{CheckCircle({ size: 12 })} {Object.keys(quizAnswers).length} respondidas</span>
                          <span>{Target({ size: 12 })} Mínimo: 80%</span>
                        </div>
                      </div>

                      {/* Questions — keyed by q.qid (pool index) */}
                      {quizQuestions.map((q: any, qi: number) => (
                        <div key={q.qid} style={{
                          marginBottom: 20, padding: '18px 20px',
                          background: '#fff', borderRadius: 10,
                          border: `1px solid ${quizAnswers[String(q.qid)] !== undefined ? `${catColor}30` : 'var(--border)'}`,
                          transition: 'border-color 0.2s',
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            <span style={{ color: catColor, marginRight: 6 }}>{qi + 1}.</span>
                            {q.question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {q.options.map((opt: string, oi: number) => {
                              const isSelected = quizAnswers[String(q.qid)] === oi
                              return (
                                <button key={oi}
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [String(q.qid)]: oi }))}
                                  style={{
                                    padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                                    border: `1.5px solid ${isSelected ? catColor : 'var(--border)'}`,
                                    background: isSelected ? `${catColor}08` : '#fff',
                                    color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.5,
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    transition: 'all 0.15s',
                                  }}>
                                  <span style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 600,
                                    background: isSelected ? catColor : 'transparent',
                                    color: isSelected ? '#fff' : 'var(--text-muted)',
                                    border: isSelected ? 'none' : '2px solid var(--border)',
                                  }}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {quizError && (
                        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#DC2626' }}>
                          {quizError}
                        </div>
                      )}

                      <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-primary)', padding: '16px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {Object.keys(quizAnswers).length}/{quizQuestions.length} respondidas
                        </span>
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                          style={{
                            padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: Object.keys(quizAnswers).length < quizQuestions.length ? 'var(--border)' : catColor,
                            color: Object.keys(quizAnswers).length < quizQuestions.length ? 'var(--text-muted)' : '#fff',
                            fontSize: 14, fontWeight: 600,
                            opacity: Object.keys(quizAnswers).length < quizQuestions.length ? 0.6 : 1,
                          }}>
                          Enviar examen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }} />
        )}

        {milestonePopup && (
          <MilestonePopup
            type={milestonePopup.type}
            title={milestonePopup.title}
            description={milestonePopup.description}
            icon={milestonePopup.icon}
            onClose={() => setMilestonePopup(null)}
          />
        )}

        <style>{`
          .lesson-content h3 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 28px 0 12px; line-height: 1.3; }
          .lesson-content h3:first-child { margin-top: 0; }
          .lesson-content h4 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 22px 0 8px; }
          .lesson-content p { margin: 0 0 14px; }
          .lesson-content ul, .lesson-content ol { padding-left: 20px; margin: 0 0 16px; }
          .lesson-content li { margin-bottom: 6px; }
          .lesson-content strong { color: var(--text-primary); }
          .lesson-content blockquote {
            margin: 16px 0; padding: 14px 18px; border-left: 3px solid ${catColor};
            background: rgba(0,0,0,0.02); border-radius: 0 8px 8px 0; font-style: italic;
          }
          .lesson-content em { font-style: italic; }
          @media (max-width: 768px) {
            .course-sidebar { position: fixed !important; left: -300px; top: 56px !important; height: calc(100vh - 56px) !important; z-index: 200; transition: left 0.25s ease; box-shadow: none; }
            .course-sidebar.open { left: 0; box-shadow: 4px 0 20px rgba(0,0,0,0.1); }
            .mobile-sidebar-toggle { display: flex !important; }
          }
        `}</style>
      </div>
    )
  }

  // ─── CATALOG VIEW ─────────────────────────────────────────────
  return (
    <>
      <div className="page-header page-enter">
        {/* Reward banner */}
        <div style={{
          background: 'linear-gradient(135deg, #2D62C8 0%, #2D5FAA 100%)',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 16, color: '#fff',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20,
          }}>{Star({ size: 20 })}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Gana beneficios completando cursos</div>
            <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.4 }}>
              Completa 3 cursos y obtiene 1 mes de Pro gratis. Completa 6 cursos y obtiene 1 mes de Max gratis. Los cursos completados se acumulan de forma permanente en tu perfil.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2>Cursos y Formación</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>30 cursos para tu crecimiento personal, profesional y tecnológico</p>
          </div>
          <button className={`tab ${tab === 'my-certs' ? 'active' : ''}`}
            onClick={() => { setTab(tab === 'my-certs' ? 'catalog' : 'my-certs'); if (tab !== 'my-certs') loadCertificates() }}>
            {Medal({ size: 14 })} Mis Certificados
          </button>
        </div>
        {tab === 'catalog' && (
          <>
            {/* Search bar */}
            <div style={{ marginTop: 12, position: 'relative' }}>
              <svg
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="form-control"
                style={{ paddingLeft: 36, fontSize: 14 }}
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Category chips */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <button className={`tab ${!selectedCategory ? 'active' : ''}`} onClick={() => { setSelectedCategory(''); setTimeout(loadCourses, 50) }}>
                Todos
              </button>
              {Object.entries(categories).map(([key, label]) => (
                <button key={key} className={`tab ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(key); setTimeout(loadCourses, 50) }}>
                  <CategoryIcon category={key} size={14} /> {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="page-body">
        {tab === 'my-certs' ? (
          certificates.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">{Medal({ size: 48 })}</div>
              <h3>Aún no tienes certificados</h3>
              <p>Completa cursos para obtener certificados que se agregan a tu perfil profesional</p>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('catalog')}>Ver Cursos</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {certificates.map((cert: any) => (
                <div key={cert.certificateId || cert.courseId} className="u-card hover-lift" style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><CourseIcon category={cert.courseCategory} size={36} /></div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>{cert.courseTitle}</h4>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Puntuación: {cert.score ?? cert.grade ?? 0}% · {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString('es-CL') : ''}
                  </div>
                  {cert.certCode && (
                    <div style={{ padding: '6px 12px', background: 'rgba(5,150,105,0.06)', borderRadius: 8, fontSize: 12, color: '#059669', marginBottom: 10, fontWeight: 600 }}>
                      {Medal({ size: 12 })} Certificado: {cert.certCode}
                    </div>
                  )}
                  {!cert.certCode && cert.certificateId && (
                    <div style={{ padding: '6px 12px', background: 'rgba(5,150,105,0.06)', borderRadius: 8, fontSize: 12, color: '#059669', marginBottom: 10 }}>
                      {Medal({ size: 12 })} ID: {cert.certificateId.slice(0, 8)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                    {(cert.certId || cert.certificateId) && (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8 }}
                        onClick={async () => {
                          try {
                            const id = cert.certId || cert.certificateId
                            const token = localStorage.getItem('token')
                            const base = (import.meta as any).env?.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com'
                            const res = await fetch(`${base}/certificates/download/${id}`, {
                              headers: { 'Authorization': `Bearer ${token}` },
                            })
                            if (!res.ok) throw new Error('PDF no disponible')
                            const blob = await res.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `Certificado_${cert.courseTitle}.pdf`
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            URL.revokeObjectURL(url)
                          } catch (e: any) {
                            alert(e.message || 'Error al descargar certificado')
                          }
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Descargar PDF
                      </button>
                    )}
                    {cert.verifyUrl && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8 }}
                        onClick={() => window.open(cert.verifyUrl, '_blank')}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Verificar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
        ) : error ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">{AlertTriangle({ size: 48 })}</div>
            <h3>Error al cargar cursos</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setLoading(true); loadCourses() }}>
              Reintentar
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">{BookOpen({ size: 48 })}</div>
            <h3>No hay cursos disponibles</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {selectedCategory ? 'No se encontraron cursos en esta categoría.' : 'Los cursos estarán disponibles próximamente.'}
            </p>
            {selectedCategory && (
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => { setSelectedCategory(''); setTimeout(loadCourses, 50) }}>
                Ver todos los cursos
              </button>
            )}
          </div>
        ) : (() => {
          // Filter by search query
          const q = searchQuery.trim().toLowerCase()
          const filtered = q
            ? courses.filter(c =>
                c.title.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q)
              )
            : courses

          // Course card component (inline)
          const CourseRow = ({ course }: { course: any }) => {
            const cc = CATEGORY_COLORS[course.category] || '#2D62C8'
            const progressPct = course.progress?.started && course.lessonCount > 0
              ? Math.round((course.progress.completedLessons / course.lessonCount) * 100)
              : 0
            return (
              <div
                className="u-card"
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.12s', borderRadius: 10 }}
                onClick={() => openCourse(course.id)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
              >
                {/* Icon */}
                <CourseIcon category={course.category} size={22} />

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{course.title}</span>
                    {course.isFeatured && <span style={{ fontSize: 9, background: `${cc}15`, color: cc, padding: '1px 6px', borderRadius: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>★ Destacado</span>}
                    {course.progress?.completed && <span style={{ fontSize: 9, background: 'rgba(5,150,105,0.1)', color: '#059669', padding: '1px 6px', borderRadius: 8, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>{Medal({ size: 9 })} Completado</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{course.lessonCount} lecciones · ~{course.estimatedMinutes} min</span>
                    {course.difficulty === 'intermediate' && <span style={{ fontSize: 10, background: `${cc}12`, color: cc, padding: '0 6px', borderRadius: 6, fontWeight: 600 }}>Intermedio</span>}
                  </div>
                  {/* Inline progress bar */}
                  {course.progress?.started && !course.progress?.completed && (
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 2, background: cc }} />
                      </div>
                      <span style={{ fontSize: 10, color: cc, fontWeight: 700, flexShrink: 0 }}>{progressPct}%</span>
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            )
          }

          if (filtered.length === 0) {
            return (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">{BookOpen({ size: 40 })}</div>
                <h3>Sin resultados para "{searchQuery}"</h3>
                <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setSearchQuery('')}>Limpiar búsqueda</button>
              </div>
            )
          }

          // When a specific category is selected → flat list
          if (selectedCategory) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map(c => <CourseRow key={c.id} course={c} />)}
              </div>
            )
          }

          // "Todos" → group by category, each with its own list
          const grouped: Record<string, any[]> = {}
          for (const c of filtered) {
            const cat = c.category || 'other'
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(c)
          }

          // Featured strip first
          const featured = filtered.filter(c => c.isFeatured)
          return (
            <>
              {featured.length > 0 && !q && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {Star({ size: 14 })} Cursos Destacados
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {featured.map(c => <CourseRow key={c.id} course={c} />)}
                  </div>
                </div>
              )}

              {Object.entries(grouped).map(([cat, list]) => {
                const label = categories[cat] || cat
                const cc = CATEGORY_COLORS[cat] || '#64748B'
                return (
                  <div key={cat} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <CategoryIcon category={cat} size={14} color={cc} />
                        {label}
                        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>{list.length} cursos</span>
                      </h3>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => { setSelectedCategory(cat); setTimeout(loadCourses, 50) }}
                      >
                        Ver todos →
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {list.map(c => <CourseRow key={c.id} course={c} />)}
                    </div>
                  </div>
                )
              })}
            </>
          )
        })()}
      </div>
    </>
  )
}
