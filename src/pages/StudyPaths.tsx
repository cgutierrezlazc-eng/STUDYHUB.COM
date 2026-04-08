import React, { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'
import { Project, QuizQuestion } from '../types'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

// ─── Types ─────────────────────────────────────────────────────
interface PathProgress {
  hasDocuments: boolean
  guideGenerated: boolean
  guideRead: boolean
  flashcardsGenerated: boolean
  flashcardsMastered: number
  flashcardsTotal: number
  quizCompleted: boolean
  quizScore: number
  quizWeakTopics: string[]
  planGenerated: boolean
  planChecks: boolean[]
}

interface FlashcardItem {
  id: string
  front: string
  back: string
  mastered: boolean
}

type View = 'list' | 'active'

const STEPS = [
  { key: 'docs', icon: '\uD83D\uDCC4', label: 'Documentos' },
  { key: 'guide', icon: '\uD83D\uDCD6', label: 'Gu\u00eda' },
  { key: 'flashcards', icon: '\uD83C\uDCCF', label: 'Flashcards' },
  { key: 'quiz', icon: '\u2753', label: 'Quiz' },
  { key: 'plan', icon: '\uD83D\uDCCB', label: 'Plan' },
] as const

// ─── Helpers ───────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function lsSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getProgress(projectId: string, docs: unknown[]): PathProgress {
  const prefix = `conniku_path_${projectId}`
  return {
    hasDocuments: docs.length > 0,
    guideGenerated: !!localStorage.getItem(`${prefix}_guide`),
    guideRead: lsGet(`${prefix}_guide_read`, false),
    flashcardsGenerated: !!localStorage.getItem(`${prefix}_flashcards`),
    flashcardsMastered: lsGet<FlashcardItem[]>(`${prefix}_flashcards_items`, []).filter(f => f.mastered).length,
    flashcardsTotal: lsGet<FlashcardItem[]>(`${prefix}_flashcards_items`, []).length,
    quizCompleted: lsGet(`${prefix}_quiz_completed`, false),
    quizScore: lsGet(`${prefix}_quiz_score`, 0),
    quizWeakTopics: lsGet(`${prefix}_quiz_weak`, []),
    planGenerated: !!localStorage.getItem(`${prefix}_plan`),
    planChecks: lsGet(`${prefix}_plan_checks`, []),
  }
}

function completedSteps(p: PathProgress): number {
  let c = 0
  if (p.hasDocuments) c++
  if (p.guideGenerated && p.guideRead) c++
  if (p.flashcardsGenerated && p.flashcardsMastered > 0) c++
  if (p.quizCompleted) c++
  if (p.planGenerated) c++
  return c
}

function stepStatus(p: PathProgress, idx: number): 'completed' | 'active' | 'locked' {
  switch (idx) {
    case 0: return p.hasDocuments ? 'completed' : 'active'
    case 1:
      if (!p.hasDocuments) return 'locked'
      if (p.guideGenerated && p.guideRead) return 'completed'
      if (p.hasDocuments) return 'active'
      return 'locked'
    case 2:
      if (!(p.guideGenerated && p.guideRead)) return 'locked'
      if (p.flashcardsGenerated && p.flashcardsMastered >= p.flashcardsTotal && p.flashcardsTotal > 0) return 'completed'
      if (p.guideGenerated && p.guideRead) return 'active'
      return 'locked'
    case 3:
      if (!(p.flashcardsGenerated && p.flashcardsMastered > 0)) return 'locked'
      if (p.quizCompleted) return 'completed'
      if (p.flashcardsGenerated) return 'active'
      return 'locked'
    case 4:
      if (!p.quizCompleted) return 'locked'
      if (p.planGenerated && p.planChecks.length > 0 && p.planChecks.every(Boolean)) return 'completed'
      if (p.quizCompleted) return 'active'
      return 'locked'
    default: return 'locked'
  }
}

function estimateTime(docs: unknown[]): string {
  const mins = docs.length * 25 + 40
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

// ─── Inline styles ─────────────────────────────────────────────
const S = {
  page: { padding: '0 0 40px', minHeight: '100%' } as React.CSSProperties,
  header: { padding: '28px 32px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)' } as React.CSSProperties,
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 },
  h1: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 },
  body: { padding: '24px 32px' } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginTop: 20 } as React.CSSProperties,
  card: { background: 'var(--bg-secondary, #fff)', borderRadius: 14, border: '1px solid var(--border-color, #e2e8f0)', padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const } as React.CSSProperties,
  cardHover: { boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
  dot: (color: string) => ({ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }) as React.CSSProperties,
  progressBar: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 } as React.CSSProperties,
  stepDot: (status: string) => ({
    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
    background: status === 'completed' ? '#10b981' : status === 'active' ? 'var(--accent, #2D62C8)' : 'var(--bg-tertiary, #f1f5f9)',
    color: status === 'locked' ? 'var(--text-tertiary, #94a3b8)' : '#fff',
    animation: status === 'active' ? 'pulse 2s infinite' : 'none',
    transition: 'all 0.3s',
  }) as React.CSSProperties,
  stepLine: (done: boolean) => ({
    flex: 1, height: 3, borderRadius: 2,
    background: done ? '#10b981' : 'var(--border-color, #e2e8f0)',
    transition: 'background 0.3s',
  }) as React.CSSProperties,
  btn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' } as React.CSSProperties,
  btnPrimary: { background: 'var(--accent, #2D62C8)', color: '#fff' } as React.CSSProperties,
  btnSecondary: { background: 'var(--bg-tertiary, #f1f5f9)', color: 'var(--text-primary)' } as React.CSSProperties,
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' } as React.CSSProperties,
  empty: { textAlign: 'center' as const, padding: '60px 20px', color: 'var(--text-secondary)' } as React.CSSProperties,
  backBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: 0, marginBottom: 8 } as React.CSSProperties,
  // Stepper
  stepper: { display: 'flex', flexDirection: 'column' as const, gap: 0, marginTop: 24 },
  stepContainer: { display: 'flex', gap: 20 } as React.CSSProperties,
  stepTimeline: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', width: 48, flexShrink: 0 },
  stepIcon: (status: string) => ({
    width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700,
    background: status === 'completed' ? '#10b981' : status === 'active' ? 'var(--accent, #2D62C8)' : 'var(--bg-tertiary, #f1f5f9)',
    color: status === 'locked' ? 'var(--text-tertiary, #94a3b8)' : '#fff',
    border: status === 'active' ? '3px solid rgba(45,98,200,0.3)' : '3px solid transparent',
    animation: status === 'active' ? 'pulse 2s infinite' : 'none',
    transition: 'all 0.3s',
    cursor: status !== 'locked' ? 'pointer' : 'default',
    zIndex: 1,
  }) as React.CSSProperties,
  stepConnector: (done: boolean) => ({
    width: 3, flex: 1, minHeight: 24,
    background: done ? '#10b981' : 'var(--border-color, #e2e8f0)',
    transition: 'background 0.3s',
  }) as React.CSSProperties,
  stepContent: (status: string) => ({
    flex: 1, paddingBottom: 28,
    borderLeft: 'none',
    opacity: status === 'locked' ? 0.5 : 1,
  }) as React.CSSProperties,
  stepTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  stepBadge: (status: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
    background: status === 'completed' ? '#d1fae5' : status === 'active' ? '#dbeafe' : '#f1f5f9',
    color: status === 'completed' ? '#065f46' : status === 'active' ? '#1e40af' : '#64748b',
    marginLeft: 8,
  }) as React.CSSProperties,
  stepBody: { marginTop: 12, background: 'var(--bg-secondary, #fff)', borderRadius: 12, border: '1px solid var(--border-color, #e2e8f0)', padding: 20 } as React.CSSProperties,
  // Flashcard flip
  flipCard: { width: '100%', maxWidth: 400, height: 220, perspective: 1000, cursor: 'pointer', margin: '0 auto' } as React.CSSProperties,
  flipInner: (flipped: boolean) => ({
    position: 'relative' as const, width: '100%', height: '100%', transition: 'transform 0.6s', transformStyle: 'preserve-3d' as const,
    transform: flipped ? 'rotateY(180deg)' : 'none',
  }),
  flipFace: { position: 'absolute' as const, width: '100%', height: '100%', backfaceVisibility: 'hidden' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 14, fontSize: 16, lineHeight: 1.5, textAlign: 'center' as const } as React.CSSProperties,
  flipFront: { background: 'var(--bg-secondary, #fff)', border: '2px solid var(--accent, #2D62C8)', color: 'var(--text-primary)' } as React.CSSProperties,
  flipBack: { background: 'var(--accent, #2D62C8)', color: '#fff', transform: 'rotateY(180deg)' } as React.CSSProperties,
  // Quiz
  quizOption: (selected: boolean, correct: boolean | null) => ({
    display: 'block', width: '100%', textAlign: 'left' as const, padding: '12px 16px', borderRadius: 10, border: '2px solid',
    borderColor: correct === true ? '#10b981' : correct === false ? '#ef4444' : selected ? 'var(--accent, #2D62C8)' : 'var(--border-color, #e2e8f0)',
    background: correct === true ? '#d1fae5' : correct === false ? '#fee2e2' : selected ? 'rgba(45,98,200,0.06)' : 'var(--bg-secondary, #fff)',
    cursor: 'pointer', fontSize: 14, marginBottom: 8, transition: 'all 0.2s', color: 'var(--text-primary)',
  }) as React.CSSProperties,
  // Plan
  planDay: (checked: boolean) => ({
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 10,
    background: checked ? '#f0fdf4' : 'var(--bg-secondary, #fff)',
    border: `1px solid ${checked ? '#bbf7d0' : 'var(--border-color, #e2e8f0)'}`,
    marginBottom: 8, transition: 'all 0.2s',
  }) as React.CSSProperties,
  checkbox: (checked: boolean) => ({
    width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#10b981' : 'var(--border-color, #cbd5e1)'}`,
    background: checked ? '#10b981' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 2,
    transition: 'all 0.2s',
  }) as React.CSSProperties,
  // Progress top bar
  topProgress: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 } as React.CSSProperties,
  topProgressBar: { flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-tertiary, #f1f5f9)', overflow: 'hidden' } as React.CSSProperties,
  topProgressFill: (pct: number) => ({
    width: `${pct}%`, height: '100%', borderRadius: 4,
    background: pct === 100 ? '#10b981' : 'var(--accent, #2D62C8)',
    transition: 'width 0.5s ease',
  }) as React.CSSProperties,
  tag: { fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--bg-tertiary, #f1f5f9)', color: 'var(--text-secondary)', fontWeight: 500 } as React.CSSProperties,
  marathonBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' } as React.CSSProperties,
  guideContent: { fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', maxHeight: 400, overflowY: 'auto' as const, padding: '12px 0' } as React.CSSProperties,
  docItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary, #f1f5f9)', marginBottom: 6, fontSize: 13 } as React.CSSProperties,
}

// ─── Pulse animation ───────────────────────────────────────────
const pulseCSS = `
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(45,98,200,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(45,98,200,0); }
}
`

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function StudyPaths({ projects, onNavigate }: Props) {
  const [view, setView] = useState<View>('list')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Phase states
  const [guideContent, setGuideContent] = useState<string>('')
  const [guideLoading, setGuideLoading] = useState(false)
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)
  const [currentFlashcard, setCurrentFlashcard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizCurrent, setQuizCurrent] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [planData, setPlanData] = useState<any>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planChecks, setPlanChecks] = useState<boolean[]>([])
  const [marathonLoading, setMarathonLoading] = useState(false)

  const activeProject = projects.find(p => p.id === activeProjectId)
  const prefix = activeProjectId ? `conniku_path_${activeProjectId}` : ''

  // Load saved state when project changes
  useEffect(() => {
    if (!activeProjectId) return
    const p = prefix
    const savedGuide = localStorage.getItem(`${p}_guide`)
    if (savedGuide) {
      try { setGuideContent(JSON.parse(savedGuide)) } catch { setGuideContent(savedGuide) }
    } else { setGuideContent('') }

    const savedFC = lsGet<FlashcardItem[]>(`${p}_flashcards_items`, [])
    setFlashcards(savedFC)
    setCurrentFlashcard(0)
    setFlipped(false)

    const savedQuiz = lsGet(`${p}_quiz_completed`, false)
    if (savedQuiz) {
      const savedQs = lsGet<QuizQuestion[]>(`${p}_quiz_questions`, [])
      setQuizQuestions(savedQs)
      setQuizSubmitted(true)
    } else {
      setQuizQuestions([])
      setQuizSubmitted(false)
    }
    setQuizCurrent(0)
    setQuizAnswers({})

    const savedPlan = localStorage.getItem(`${p}_plan`)
    if (savedPlan) {
      try { setPlanData(JSON.parse(savedPlan)) } catch { setPlanData(null) }
    } else { setPlanData(null) }
    setPlanChecks(lsGet(`${p}_plan_checks`, []))
  }, [activeProjectId])

  // ─── Progress for active project ────────────────────────────
  const progress = activeProject ? getProgress(activeProject.id, activeProject.documents || []) : null
  const pct = progress ? Math.round((completedSteps(progress) / 5) * 100) : 0

  // Auto-expand first non-completed step
  useEffect(() => {
    if (!progress) return
    for (let i = 0; i < 5; i++) {
      const st = stepStatus(progress, i)
      if (st === 'active') { setExpandedStep(i); return }
    }
    setExpandedStep(4) // all done, show last
  }, [activeProjectId, guideContent, flashcards.length, quizSubmitted, planData])

  // ─── Phase handlers ──────────────────────────────────────────
  const handleGenerateGuide = useCallback(async () => {
    if (!activeProjectId) return
    setGuideLoading(true)
    try {
      const res = await api.generateGuide(activeProjectId)
      const content = res.content || res.guide || res.html || JSON.stringify(res)
      setGuideContent(content)
      lsSet(`${prefix}_guide`, content)
    } catch (err) {
      console.error('Error generating guide:', err)
    } finally { setGuideLoading(false) }
  }, [activeProjectId, prefix])

  const handleMarkGuideRead = useCallback(() => {
    lsSet(`${prefix}_guide_read`, true)
    setExpandedStep(2) // advance to flashcards
  }, [prefix])

  const handleGenerateFlashcards = useCallback(async () => {
    if (!activeProjectId) return
    setFlashcardsLoading(true)
    try {
      const res = await api.generateFlashcards(activeProjectId)
      const cards: FlashcardItem[] = (res.flashcards || res.cards || []).map((c: any, i: number) => ({
        id: `fc-${i}`, front: c.front || c.question || c.term, back: c.back || c.answer || c.definition, mastered: false,
      }))
      setFlashcards(cards)
      setCurrentFlashcard(0)
      setFlipped(false)
      lsSet(`${prefix}_flashcards`, true)
      lsSet(`${prefix}_flashcards_items`, cards)
    } catch (err) {
      console.error('Error generating flashcards:', err)
    } finally { setFlashcardsLoading(false) }
  }, [activeProjectId, prefix])

  const toggleFlashcardMastered = useCallback((idx: number) => {
    setFlashcards(prev => {
      const next = prev.map((f, i) => i === idx ? { ...f, mastered: !f.mastered } : f)
      lsSet(`${prefix}_flashcards_items`, next)
      return next
    })
  }, [prefix])

  const handleGenerateQuiz = useCallback(async () => {
    if (!activeProjectId) return
    setQuizLoading(true)
    try {
      const res = await api.generateQuiz(activeProjectId, 10, 'medium')
      const qs: QuizQuestion[] = (res.questions || []).map((q: any) => ({
        question: q.question, options: q.options || [], correctAnswer: q.correctAnswer ?? q.correct_answer ?? 0,
        explanation: q.explanation || '', userAnswer: undefined,
      }))
      setQuizQuestions(qs)
      setQuizCurrent(0)
      setQuizAnswers({})
      setQuizSubmitted(false)
    } catch (err) {
      console.error('Error generating quiz:', err)
    } finally { setQuizLoading(false) }
  }, [activeProjectId])

  const handleSubmitQuiz = useCallback(() => {
    if (quizQuestions.length === 0) return
    const withAnswers = quizQuestions.map((q, i) => ({ ...q, userAnswer: quizAnswers[i] }))
    setQuizQuestions(withAnswers)
    setQuizSubmitted(true)
    const correct = withAnswers.filter((q, i) => quizAnswers[i] === q.correctAnswer).length
    const score = Math.round((correct / withAnswers.length) * 100)
    const weakTopics = withAnswers.filter((q, i) => quizAnswers[i] !== q.correctAnswer).map(q => q.question.slice(0, 60))
    lsSet(`${prefix}_quiz_completed`, true)
    lsSet(`${prefix}_quiz_score`, score)
    lsSet(`${prefix}_quiz_questions`, withAnswers)
    lsSet(`${prefix}_quiz_weak`, weakTopics)
  }, [quizQuestions, quizAnswers, prefix])

  const handleGeneratePlan = useCallback(async () => {
    if (!activeProjectId) return
    setPlanLoading(true)
    try {
      const res = await api.generateStudyPlan(activeProjectId)
      const plan = res.plan || res.studyPlan || res
      setPlanData(plan)
      const days = plan.days || plan.schedule || []
      setPlanChecks(new Array(Array.isArray(days) ? days.length : 7).fill(false))
      lsSet(`${prefix}_plan`, plan)
      lsSet(`${prefix}_plan_checks`, new Array(Array.isArray(days) ? days.length : 7).fill(false))
    } catch (err) {
      console.error('Error generating plan:', err)
    } finally { setPlanLoading(false) }
  }, [activeProjectId, prefix])

  const togglePlanCheck = useCallback((idx: number) => {
    setPlanChecks(prev => {
      const next = [...prev]
      next[idx] = !next[idx]
      lsSet(`${prefix}_plan_checks`, next)
      return next
    })
  }, [prefix])

  // Marathon mode
  const handleMarathon = useCallback(async () => {
    if (!activeProjectId) return
    setMarathonLoading(true)
    try {
      await handleGenerateGuide()
      handleMarkGuideRead()
      await handleGenerateFlashcards()
      await handleGenerateQuiz()
    } catch (err) {
      console.error('Marathon error:', err)
    } finally { setMarathonLoading(false) }
  }, [activeProjectId, handleGenerateGuide, handleMarkGuideRead, handleGenerateFlashcards, handleGenerateQuiz])

  const openPath = (projectId: string) => {
    setActiveProjectId(projectId)
    setView('active')
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW 1: LIST
  // ═══════════════════════════════════════════════════════════════
  const renderList = () => {
    if (projects.length === 0) {
      return (
        <div style={S.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDCDA'}</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No tienes asignaturas a\u00fan</p>
          <p style={{ fontSize: 14 }}>Sube documentos a una asignatura para crear tu ruta de estudio</p>
        </div>
      )
    }

    return (
      <div style={S.grid}>
        {projects.map(project => {
          const prog = getProgress(project.id, project.documents || [])
          const done = completedSteps(prog)
          const isHovered = hoveredCard === project.id

          return (
            <div
              key={project.id}
              style={{ ...S.card, ...(isHovered ? S.cardHover : {}) }}
              onMouseEnter={() => setHoveredCard(project.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => openPath(project.id)}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={S.dot(project.color)} />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{project.name}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {(project.documents || []).length} documento{(project.documents || []).length !== 1 ? 's' : ''} subido{(project.documents || []).length !== 1 ? 's' : ''}
              </div>

              {/* Progress steps */}
              <div style={S.progressBar}>
                {STEPS.map((step, i) => {
                  const st = stepStatus(prog, i)
                  return (
                    <React.Fragment key={step.key}>
                      <div style={S.stepDot(st)} title={step.label}>
                        {st === 'completed' ? '\u2713' : st === 'locked' ? '\uD83D\uDD12' : step.icon}
                      </div>
                      {i < STEPS.length - 1 && <div style={S.stepLine(st === 'completed')} />}
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <span style={S.tag}>{done}/5 pasos \u2022 {Math.round((done / 5) * 100)}%</span>
                <span style={{ ...S.tag, background: done > 0 ? 'rgba(45,98,200,0.1)' : undefined, color: done > 0 ? 'var(--accent, #2D62C8)' : undefined }}>
                  {estimateTime(project.documents || [])}
                </span>
              </div>

              {/* CTA */}
              <button
                style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', marginTop: 14, fontSize: 13 }}
                onClick={(e) => { e.stopPropagation(); openPath(project.id) }}
              >
                {done === 0 ? 'Comenzar ruta' : done === 5 ? '\u2705 Ruta completada' : 'Continuar estudiando'}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW 2: ACTIVE PATH
  // ═══════════════════════════════════════════════════════════════
  const renderActive = () => {
    if (!activeProject || !progress) return null

    const getPlanDays = (): { title: string; description: string }[] => {
      if (!planData) return []
      const days = planData.days || planData.schedule || planData.daily_goals || []
      if (Array.isArray(days)) {
        return days.map((d: any, i: number) => ({
          title: d.title || d.day || `D\u00eda ${i + 1}`,
          description: d.description || d.goal || d.tasks || d.content || JSON.stringify(d),
        }))
      }
      // If plan is a string, split by lines
      if (typeof planData === 'string') {
        return planData.split('\n').filter((l: string) => l.trim()).map((l: string, i: number) => ({ title: `D\u00eda ${i + 1}`, description: l }))
      }
      return Array.from({ length: 7 }, (_, i) => ({ title: `D\u00eda ${i + 1}`, description: 'Meta de estudio pendiente' }))
    }

    const renderPhaseContent = (idx: number, status: string) => {
      if (status === 'locked') {
        return <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{'\uD83D\uDD12'} Completa el paso anterior para desbloquear</p>
      }

      switch (idx) {
        // ─── Phase 1: Documents ────────────────────────────
        case 0:
          return (
            <div>
              {(activeProject.documents || []).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>A\u00fan no has subido documentos a esta asignatura.</p>
              ) : (
                <div>
                  {(activeProject.documents || []).map((doc: any, i: number) => (
                    <div key={i} style={S.docItem}>
                      <span>{'\uD83D\uDCC4'}</span>
                      <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name || doc.filename || `Documento ${i + 1}`}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{doc.type || 'pdf'}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                style={{ ...S.btn, ...S.btnSecondary, marginTop: 12 }}
                onClick={() => onNavigate(`/project/${activeProject.id}`)}
              >
                {'\uD83D\uDCC2'} {(activeProject.documents || []).length === 0 ? 'Subir documento' : 'Gestionar documentos'}
              </button>
            </div>
          )

        // ─── Phase 2: Guide ───────────────────────────────
        case 1:
          return (
            <div>
              {!guideContent ? (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Genera una gu\u00eda de estudio basada en tus documentos. La IA analizar\u00e1 el contenido y crear\u00e1 un resumen estructurado.
                  </p>
                  <button
                    style={{ ...S.btn, ...S.btnPrimary, ...(guideLoading ? S.btnDisabled : {}) }}
                    onClick={handleGenerateGuide}
                    disabled={guideLoading}
                  >
                    {guideLoading ? '\u23F3 Generando gu\u00eda...' : '\uD83D\uDCD6 Generar gu\u00eda de estudio'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={S.tag}>{'\u23F1\uFE0F'} ~{Math.max(5, Math.round(guideContent.length / 1200))} min de lectura</span>
                    {progress.guideRead && <span style={{ ...S.tag, background: '#d1fae5', color: '#065f46' }}>{'\u2705'} Le\u00edda</span>}
                  </div>
                  <div
                    style={S.guideContent}
                    dangerouslySetInnerHTML={{ __html: guideContent.replace(/\n/g, '<br/>') }}
                  />
                  {!progress.guideRead && (
                    <button
                      style={{ ...S.btn, ...S.btnPrimary, marginTop: 12 }}
                      onClick={handleMarkGuideRead}
                    >
                      {'\u2705'} Marcar como le\u00edda
                    </button>
                  )}
                  <button
                    style={{ ...S.btn, ...S.btnSecondary, marginTop: 8, ...(guideLoading ? S.btnDisabled : {}) }}
                    onClick={handleGenerateGuide}
                    disabled={guideLoading}
                  >
                    {guideLoading ? '\u23F3 Regenerando...' : '\uD83D\uDD04 Regenerar gu\u00eda'}
                  </button>
                </div>
              )}
            </div>
          )

        // ─── Phase 3: Flashcards ──────────────────────────
        case 2:
          return (
            <div>
              {flashcards.length === 0 ? (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Genera flashcards para memorizar los conceptos clave de tu gu\u00eda de estudio.
                  </p>
                  <button
                    style={{ ...S.btn, ...S.btnPrimary, ...(flashcardsLoading ? S.btnDisabled : {}) }}
                    onClick={handleGenerateFlashcards}
                    disabled={flashcardsLoading}
                  >
                    {flashcardsLoading ? '\u23F3 Generando flashcards...' : '\uD83C\uDCCF Generar flashcards'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={S.tag}>
                      {flashcards.filter(f => f.mastered).length}/{flashcards.length} dominadas
                    </span>
                    <span style={S.tag}>{'\uD83C\uDCCF'} Tarjeta {currentFlashcard + 1} de {flashcards.length}</span>
                  </div>

                  {/* Flashcard */}
                  {flashcards[currentFlashcard] && (
                    <div style={S.flipCard} onClick={() => setFlipped(!flipped)}>
                      <div style={S.flipInner(flipped)}>
                        <div style={{ ...S.flipFace, ...S.flipFront }}>
                          <div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>PREGUNTA</div>
                            {flashcards[currentFlashcard].front}
                          </div>
                        </div>
                        <div style={{ ...S.flipFace, ...S.flipBack }}>
                          <div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>RESPUESTA</div>
                            {flashcards[currentFlashcard].back}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    <button
                      style={{ ...S.btn, ...S.btnSecondary }}
                      onClick={() => { setCurrentFlashcard(Math.max(0, currentFlashcard - 1)); setFlipped(false) }}
                      disabled={currentFlashcard === 0}
                    >
                      {'\u2B05'} Anterior
                    </button>
                    <button
                      style={{
                        ...S.btn,
                        background: flashcards[currentFlashcard]?.mastered ? '#10b981' : 'var(--bg-tertiary, #f1f5f9)',
                        color: flashcards[currentFlashcard]?.mastered ? '#fff' : 'var(--text-primary)',
                      }}
                      onClick={() => toggleFlashcardMastered(currentFlashcard)}
                    >
                      {flashcards[currentFlashcard]?.mastered ? '\u2705 Dominada' : 'Marcar dominada'}
                    </button>
                    <button
                      style={{ ...S.btn, ...S.btnSecondary }}
                      onClick={() => { setCurrentFlashcard(Math.min(flashcards.length - 1, currentFlashcard + 1)); setFlipped(false) }}
                      disabled={currentFlashcard === flashcards.length - 1}
                    >
                      Siguiente {'\u27A1'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <button
                      style={{ ...S.btn, ...S.btnSecondary, fontSize: 12 }}
                      onClick={() => onNavigate('/quizzes')}
                    >
                      {'\uD83C\uDCCF'} Estudiar en modo completo
                    </button>
                    <button
                      style={{ ...S.btn, ...S.btnSecondary, fontSize: 12, ...(flashcardsLoading ? S.btnDisabled : {}) }}
                      onClick={handleGenerateFlashcards}
                      disabled={flashcardsLoading}
                    >
                      {'\uD83D\uDD04'} Regenerar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )

        // ─── Phase 4: Quiz ────────────────────────────────
        case 3:
          return (
            <div>
              {quizQuestions.length === 0 && !quizSubmitted ? (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Eval\u00faa tu conocimiento con un quiz de 10 preguntas generado por IA. Identificar\u00e1 tus temas d\u00e9biles.
                  </p>
                  <button
                    style={{ ...S.btn, ...S.btnPrimary, ...(quizLoading ? S.btnDisabled : {}) }}
                    onClick={handleGenerateQuiz}
                    disabled={quizLoading}
                  >
                    {quizLoading ? '\u23F3 Generando quiz...' : '\u2753 Tomar quiz de evaluaci\u00f3n'}
                  </button>
                </div>
              ) : quizSubmitted ? (
                <div>
                  {/* Score */}
                  {(() => {
                    const correct = quizQuestions.filter((q, i) => (q.userAnswer ?? quizAnswers[i]) === q.correctAnswer).length
                    const score = Math.round((correct / quizQuestions.length) * 100)
                    return (
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 48, fontWeight: 800, color: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {score}%
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          {correct}/{quizQuestions.length} respuestas correctas
                        </p>
                        {score < 70 && (
                          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#fef3c7', border: '1px solid #fcd34d' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>{'\u26A0\uFE0F'} Temas por reforzar:</p>
                            <ul style={{ fontSize: 12, color: '#92400e', margin: 0, paddingLeft: 16 }}>
                              {quizQuestions
                                .filter((q, i) => (q.userAnswer ?? quizAnswers[i]) !== q.correctAnswer)
                                .slice(0, 5)
                                .map((q, i) => <li key={i}>{q.question.slice(0, 80)}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  <button
                    style={{ ...S.btn, ...S.btnSecondary, ...(quizLoading ? S.btnDisabled : {}) }}
                    onClick={handleGenerateQuiz}
                    disabled={quizLoading}
                  >
                    {'\uD83D\uDD04'} Tomar otro quiz
                  </button>
                </div>
              ) : (
                <div>
                  {/* Quiz in progress */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={S.tag}>Pregunta {quizCurrent + 1} de {quizQuestions.length}</span>
                    <span style={S.tag}>{Object.keys(quizAnswers).length}/{quizQuestions.length} respondidas</span>
                  </div>

                  {quizQuestions[quizCurrent] && (
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
                        {quizQuestions[quizCurrent].question}
                      </p>
                      {quizQuestions[quizCurrent].options.map((opt, oi) => (
                        <button
                          key={oi}
                          style={S.quizOption(quizAnswers[quizCurrent] === oi, null)}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [quizCurrent]: oi }))}
                        >
                          <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span> {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Nav */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                    <button
                      style={{ ...S.btn, ...S.btnSecondary }}
                      onClick={() => setQuizCurrent(Math.max(0, quizCurrent - 1))}
                      disabled={quizCurrent === 0}
                    >
                      {'\u2B05'} Anterior
                    </button>
                    {quizCurrent < quizQuestions.length - 1 ? (
                      <button
                        style={{ ...S.btn, ...S.btnPrimary }}
                        onClick={() => setQuizCurrent(quizCurrent + 1)}
                      >
                        Siguiente {'\u27A1'}
                      </button>
                    ) : (
                      <button
                        style={{ ...S.btn, ...S.btnPrimary, ...(Object.keys(quizAnswers).length < quizQuestions.length ? S.btnDisabled : {}) }}
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                      >
                        {'\u2705'} Enviar respuestas
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )

        // ─── Phase 5: Plan ────────────────────────────────
        case 4:
          return (
            <div>
              {!planData ? (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Genera un plan de estudio personalizado de 7 d\u00edas basado en tus resultados del quiz y temas d\u00e9biles.
                  </p>
                  <button
                    style={{ ...S.btn, ...S.btnPrimary, ...(planLoading ? S.btnDisabled : {}) }}
                    onClick={handleGeneratePlan}
                    disabled={planLoading}
                  >
                    {planLoading ? '\u23F3 Generando plan...' : '\uD83D\uDCCB Generar plan personalizado'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={S.tag}>{'\uD83D\uDCC5'} Plan de 7 d\u00edas</span>
                    <span style={S.tag}>
                      {planChecks.filter(Boolean).length}/{planChecks.length} completados
                    </span>
                  </div>

                  {getPlanDays().map((day, i) => (
                    <div key={i} style={S.planDay(planChecks[i] || false)}>
                      <div
                        style={S.checkbox(planChecks[i] || false)}
                        onClick={() => togglePlanCheck(i)}
                      >
                        {planChecks[i] && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{'\u2713'}</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{day.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{day.description}</div>
                      </div>
                    </div>
                  ))}

                  <button
                    style={{ ...S.btn, ...S.btnSecondary, marginTop: 12, ...(planLoading ? S.btnDisabled : {}) }}
                    onClick={handleGeneratePlan}
                    disabled={planLoading}
                  >
                    {planLoading ? '\u23F3 Regenerando...' : '\uD83D\uDD04 Regenerar plan'}
                  </button>
                </div>
              )}
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div>
        {/* Back button */}
        <button style={S.backBtn} onClick={() => { setView('list'); setActiveProjectId(null) }}>
          {'\u2190'} Volver a mis rutas
        </button>

        {/* Project header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ ...S.dot(activeProject.color), width: 16, height: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {activeProject.name}
          </h2>
        </div>

        {/* Top progress */}
        <div style={S.topProgress}>
          <span style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? '#10b981' : 'var(--accent, #2D62C8)' }}>
            {pct}%
          </span>
          <div style={S.topProgressBar}>
            <div style={S.topProgressFill(pct)} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {completedSteps(progress)} de 5 pasos
          </span>
        </div>

        {/* Marathon button */}
        {pct < 100 && (activeProject.documents || []).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <button
              style={{ ...S.btn, ...S.marathonBtn, ...(marathonLoading ? S.btnDisabled : {}) }}
              onClick={handleMarathon}
              disabled={marathonLoading}
            >
              {marathonLoading ? '\u23F3 Generando todo...' : '\uD83C\uDFC3 Modo marat\u00f3n \u2014 generar todo de una vez'}
            </button>
          </div>
        )}

        {/* Vertical stepper */}
        <div style={S.stepper}>
          {STEPS.map((step, idx) => {
            const status = stepStatus(progress, idx)
            const isExpanded = expandedStep === idx
            const isLast = idx === STEPS.length - 1

            return (
              <div key={step.key} style={S.stepContainer}>
                {/* Timeline column */}
                <div style={S.stepTimeline}>
                  <div
                    style={S.stepIcon(status)}
                    onClick={() => status !== 'locked' && setExpandedStep(isExpanded ? null : idx)}
                  >
                    {status === 'completed' ? '\u2713' : step.icon}
                  </div>
                  {!isLast && <div style={S.stepConnector(status === 'completed')} />}
                </div>

                {/* Content column */}
                <div style={S.stepContent(status)}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', cursor: status !== 'locked' ? 'pointer' : 'default' }}
                    onClick={() => status !== 'locked' && setExpandedStep(isExpanded ? null : idx)}
                  >
                    <span style={S.stepTitle}>{step.label}</span>
                    <span style={S.stepBadge(status)}>
                      {status === 'completed' ? 'Completado' : status === 'active' ? 'En progreso' : 'Bloqueado'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={S.stepBody}>
                      {renderPhaseContent(idx, status)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>
      <style>{pulseCSS}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerRow}>
          <div>
            <h1 style={S.h1}>
              {'\uD83D\uDEA9'} Rutas de Estudio
            </h1>
            <p style={S.subtitle}>
              Sigue un camino guiado desde tus documentos hasta dominar la materia
            </p>
          </div>
          {view === 'list' && projects.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={S.tag}>
                {projects.length} asignatura{projects.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {view === 'list' ? renderList() : renderActive()}
      </div>
    </div>
  )
}
