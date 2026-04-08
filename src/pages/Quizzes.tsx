import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { Project, Quiz, QuizQuestion, Flashcard } from '../types'

interface Props {
  projects: Project[]
  onNavigate: (path: string) => void
}

type Tab = 'quizzes' | 'flashcards' | 'stats'
type Difficulty = 'easy' | 'medium' | 'hard'

interface QuizHistoryEntry {
  id: string
  date: string
  projectName: string
  score: number
  total: number
  difficulty: string
}

interface FlashcardDeck {
  id: string
  projectId: string
  projectName: string
  cards: FlashcardItem[]
  createdAt: string
}

interface FlashcardItem {
  id: string
  front: string
  back: string
  learned: boolean
}

// ─── Mock data generators ─────────────────────────────────────
function generateMockQuiz(projectName: string, numQuestions: number, difficulty: Difficulty): Quiz {
  const topics = [
    { q: `Cual es el concepto fundamental de ${projectName}?`, opts: ['Analisis sistematico', 'Observacion directa', 'Sintesis conceptual', 'Evaluacion critica'], correct: 0, exp: 'El analisis sistematico es la base de esta materia.' },
    { q: `En ${projectName}, que metodo se utiliza principalmente?`, opts: ['Metodo deductivo', 'Metodo inductivo', 'Metodo mixto', 'Metodo empirico'], correct: 2, exp: 'Se utiliza un metodo mixto que combina enfoques.' },
    { q: `Cual es la aplicacion practica mas comun en ${projectName}?`, opts: ['Modelamiento', 'Simulacion', 'Prototipado', 'Todas las anteriores'], correct: 3, exp: 'Todas estas tecnicas son aplicaciones practicas validas.' },
    { q: `Que autor es referente clave en ${projectName}?`, opts: ['Garcia (2020)', 'Martinez (2018)', 'Lopez (2019)', 'Hernandez (2021)'], correct: 1, exp: 'Martinez (2018) es considerado referente principal.' },
    { q: `Cual es el objetivo principal del estudio de ${projectName}?`, opts: ['Comprender fenomenos', 'Predecir resultados', 'Optimizar procesos', 'Todas las anteriores'], correct: 3, exp: 'El estudio abarca comprension, prediccion y optimizacion.' },
    { q: `En que area se aplica principalmente ${projectName}?`, opts: ['Industria', 'Investigacion', 'Educacion', 'Multiples areas'], correct: 3, exp: 'Esta disciplina tiene aplicacion en multiples areas.' },
    { q: `Que herramienta es esencial en ${projectName}?`, opts: ['Analisis estadistico', 'Revision bibliografica', 'Trabajo de campo', 'Depende del contexto'], correct: 3, exp: 'La herramienta depende del contexto especifico del proyecto.' },
    { q: `Cual es la tendencia actual en ${projectName}?`, opts: ['Digitalizacion', 'Automatizacion', 'Interdisciplinaridad', 'Todas las anteriores'], correct: 3, exp: 'Las tres tendencias coexisten en la actualidad.' },
    { q: `Que competencia desarrolla el estudio de ${projectName}?`, opts: ['Pensamiento critico', 'Resolucion de problemas', 'Comunicacion efectiva', 'Todas las anteriores'], correct: 3, exp: 'El estudio desarrolla multiples competencias transversales.' },
    { q: `Como se evalua el aprendizaje en ${projectName}?`, opts: ['Examenes escritos', 'Proyectos practicos', 'Portafolios', 'Evaluacion mixta'], correct: 3, exp: 'La evaluacion mixta es el estandar actual.' },
    { q: `Que nivel de complejidad tiene ${projectName} en el curriculum?`, opts: ['Basico', 'Intermedio', 'Avanzado', 'Variable'], correct: 3, exp: 'La complejidad varia segun el programa academico.' },
    { q: `Cual es el prerequisito mas comun para ${projectName}?`, opts: ['Matematicas basicas', 'Metodologia de investigacion', 'Estadistica', 'Ninguno en particular'], correct: 1, exp: 'Metodologia de investigacion es el prerequisito mas frecuente.' },
    { q: `Que recurso bibliografico se recomienda para ${projectName}?`, opts: ['Libros de texto', 'Articulos cientificos', 'Material multimedia', 'Todos los anteriores'], correct: 3, exp: 'Se recomienda usar multiples tipos de recursos.' },
    { q: `En que semestre se suele cursar ${projectName}?`, opts: ['Primeros semestres', 'Semestres intermedios', 'Ultimos semestres', 'Varia por universidad'], correct: 3, exp: 'La ubicacion en la malla varia por institucion.' },
    { q: `Que porcentaje de la nota final corresponde al examen en ${projectName}?`, opts: ['30%', '40%', '50%', 'Depende del programa'], correct: 3, exp: 'La ponderacion depende de cada programa academico.' },
  ]

  const selected = topics.slice(0, numQuestions)
  return {
    id: `mock-${Date.now()}`,
    projectId: 'mock',
    questions: selected.map(t => ({
      question: t.q,
      options: t.opts,
      correctAnswer: t.correct,
      explanation: t.exp,
    })),
  }
}

function generateMockFlashcards(projectName: string): FlashcardItem[] {
  const pairs = [
    { front: `Que es ${projectName}?`, back: `Es una disciplina que estudia los fundamentos y aplicaciones de esta area del conocimiento.` },
    { front: `Cual es el objeto de estudio de ${projectName}?`, back: `El analisis y comprension de los fenomenos relacionados con esta materia.` },
    { front: `Que metodologias se usan en ${projectName}?`, back: `Metodos cualitativos, cuantitativos y mixtos segun el contexto de investigacion.` },
    { front: `Menciona 3 conceptos clave de ${projectName}`, back: `1. Analisis sistematico\n2. Evaluacion critica\n3. Sintesis conceptual` },
    { front: `Que competencias desarrolla ${projectName}?`, back: `Pensamiento critico, resolucion de problemas y comunicacion efectiva.` },
    { front: `Como se evalua ${projectName}?`, back: `Mediante evaluacion mixta: examenes, proyectos practicos y portafolios.` },
    { front: `Que aplicaciones tiene ${projectName}?`, back: `Se aplica en industria, investigacion, educacion y otras multiples areas.` },
    { front: `Cual es la tendencia actual en ${projectName}?`, back: `Digitalizacion, automatizacion e interdisciplinaridad.` },
    { front: `Que prerequisitos tiene ${projectName}?`, back: `Generalmente requiere bases en metodologia de investigacion y conocimientos del area.` },
    { front: `Que recursos se recomiendan para ${projectName}?`, back: `Libros de texto, articulos cientificos, material multimedia y recursos en linea.` },
  ]
  return pairs.map((p, i) => ({
    id: `fc-${Date.now()}-${i}`,
    front: p.front,
    back: p.back,
    learned: false,
  }))
}

// ─── LocalStorage helpers ────────────────────────────────────
const QUIZ_HISTORY_KEY = 'conniku_quiz_history'
const FLASHCARD_DECKS_KEY = 'conniku_flashcard_decks'

function getQuizHistory(): QuizHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY) || '[]')
  } catch { return [] }
}
function saveQuizHistory(history: QuizHistoryEntry[]) {
  localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history))
}
function getFlashcardDecks(): FlashcardDeck[] {
  try {
    return JSON.parse(localStorage.getItem(FLASHCARD_DECKS_KEY) || '[]')
  } catch { return [] }
}
function saveFlashcardDecks(decks: FlashcardDeck[]) {
  localStorage.setItem(FLASHCARD_DECKS_KEY, JSON.stringify(decks))
}

// ─── Main Component ──────────────────────────────────────────
export default function Quizzes({ projects, onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<Tab>('quizzes')

  // Quiz state
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [numQuestions, setNumQuestions] = useState(10)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>(getQuizHistory())

  // Flashcard state
  const [fcProjectId, setFcProjectId] = useState('')
  const [fcLoading, setFcLoading] = useState(false)
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [decks, setDecks] = useState<FlashcardDeck[]>(getFlashcardDecks())

  const cardRef = useRef<HTMLDivElement>(null)

  // Keyboard support for flashcards
  useEffect(() => {
    if (activeTab !== 'flashcards' || flashcards.length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f) }
      if (e.code === 'ArrowRight') { e.preventDefault(); goNextCard() }
      if (e.code === 'ArrowLeft') { e.preventDefault(); goPrevCard() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTab, flashcards.length, currentCard])

  // ─── Quiz logic ──────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!selectedProjectId) return
    setQuizLoading(true)
    setQuiz(null)
    setCurrentQuestion(0)
    setUserAnswers({})
    setQuizSubmitted(false)
    try {
      const data = await api.generateQuiz(selectedProjectId, numQuestions, difficulty)
      if (data && data.questions && data.questions.length > 0) {
        setQuiz(data)
      } else {
        throw new Error('empty')
      }
    } catch {
      const project = projects.find(p => p.id === selectedProjectId)
      setQuiz(generateMockQuiz(project?.name || 'la materia', numQuestions, difficulty))
    } finally {
      setQuizLoading(false)
    }
  }

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return
    setUserAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }))
  }

  const submitQuiz = () => {
    if (!quiz) return
    setQuizSubmitted(true)
    const correct = quiz.questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.correctAnswer ? 1 : 0), 0)
    const project = projects.find(p => p.id === selectedProjectId)
    const entry: QuizHistoryEntry = {
      id: `qh-${Date.now()}`,
      date: new Date().toISOString(),
      projectName: project?.name || 'Materia',
      score: correct,
      total: quiz.questions.length,
      difficulty,
    }
    const updated = [entry, ...quizHistory].slice(0, 50)
    setQuizHistory(updated)
    saveQuizHistory(updated)
  }

  const resetQuiz = () => {
    setQuiz(null)
    setCurrentQuestion(0)
    setUserAnswers({})
    setQuizSubmitted(false)
  }

  // ─── Flashcard logic ─────────────────────────────────────
  const handleGenerateFlashcards = async () => {
    if (!fcProjectId) return
    setFcLoading(true)
    setFlashcards([])
    setCurrentCard(0)
    setFlipped(false)
    try {
      const data = await api.generateFlashcards(fcProjectId)
      if (data && Array.isArray(data) && data.length > 0) {
        setFlashcards(data.map((f: any, i: number) => ({
          id: f.id || `fc-${Date.now()}-${i}`,
          front: f.front,
          back: f.back,
          learned: false,
        })))
      } else if (data && data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards.map((f: any, i: number) => ({
          id: f.id || `fc-${Date.now()}-${i}`,
          front: f.front,
          back: f.back,
          learned: false,
        })))
      } else {
        throw new Error('empty')
      }
    } catch {
      const project = projects.find(p => p.id === fcProjectId)
      setFlashcards(generateMockFlashcards(project?.name || 'la materia'))
    } finally {
      setFcLoading(false)
    }
  }

  const goNextCard = useCallback(() => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(c => c + 1)
      setFlipped(false)
    }
  }, [currentCard, flashcards.length])

  const goPrevCard = useCallback(() => {
    if (currentCard > 0) {
      setCurrentCard(c => c - 1)
      setFlipped(false)
    }
  }, [currentCard])

  const toggleLearned = (idx: number) => {
    setFlashcards(prev => prev.map((c, i) => i === idx ? { ...c, learned: !c.learned } : c))
  }

  const saveDeck = () => {
    if (flashcards.length === 0 || !fcProjectId) return
    const project = projects.find(p => p.id === fcProjectId)
    const deck: FlashcardDeck = {
      id: `deck-${Date.now()}`,
      projectId: fcProjectId,
      projectName: project?.name || 'Materia',
      cards: flashcards,
      createdAt: new Date().toISOString(),
    }
    const updated = [deck, ...decks].slice(0, 20)
    setDecks(updated)
    saveFlashcardDecks(updated)
  }

  const loadDeck = (deck: FlashcardDeck) => {
    setFlashcards(deck.cards)
    setCurrentCard(0)
    setFlipped(false)
    setFcProjectId(deck.projectId)
  }

  const deleteDeck = (deckId: string) => {
    const updated = decks.filter(d => d.id !== deckId)
    setDecks(updated)
    saveFlashcardDecks(updated)
  }

  // ─── Stats calculation ───────────────────────────────────
  const totalQuizzes = quizHistory.length
  const avgScore = totalQuizzes > 0
    ? Math.round(quizHistory.reduce((a, h) => a + (h.score / h.total) * 100, 0) / totalQuizzes)
    : 0
  const subjectScores: Record<string, { total: number; sum: number }> = {}
  quizHistory.forEach(h => {
    if (!subjectScores[h.projectName]) subjectScores[h.projectName] = { total: 0, sum: 0 }
    subjectScores[h.projectName].total++
    subjectScores[h.projectName].sum += (h.score / h.total) * 100
  })
  const subjectAvgs = Object.entries(subjectScores).map(([name, data]) => ({
    name, avg: Math.round(data.sum / data.total), count: data.total,
  })).sort((a, b) => b.avg - a.avg)
  const bestSubject = subjectAvgs[0]
  const worstSubject = subjectAvgs[subjectAvgs.length - 1]

  // Study streak
  const streakDays = (() => {
    if (quizHistory.length === 0) return 0
    const dates = [...new Set(quizHistory.map(h => new Date(h.date).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let streak = 1
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000
      if (diff <= 1.5) streak++
      else break
    }
    return streak
  })()

  // Score history for chart (last 10)
  const chartData = quizHistory.slice(0, 10).reverse().map(h => ({
    label: h.projectName.substring(0, 8),
    value: Math.round((h.score / h.total) * 100),
  }))
  const chartMax = 100

  // ─── Difficulty labels ───────────────────────────────────
  const diffLabels: Record<Difficulty, string> = { easy: 'Facil', medium: 'Medio', hard: 'Dificil' }

  // ─── Score color helper ──────────────────────────────────
  const scoreColor = (pct: number) => pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="page-body" style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Quizzes y Flashcards
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
          Practica y refuerza tus conocimientos en todas tus materias
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4 }}>
        {([['quizzes', 'Quizzes'], ['flashcards', 'Flashcards'], ['stats', 'Mis Resultados']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === key ? 'var(--accent)' : 'transparent',
              color: activeTab === key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB: QUIZZES ═══════════════════ */}
      {activeTab === 'quizzes' && (
        <div>
          {!quiz ? (
            /* Quiz setup */
            <div className="u-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
                Configurar Quiz
              </h2>

              {/* Subject selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Asignatura
                </label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                >
                  <option value="">Selecciona una asignatura...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Dificultad
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        background: difficulty === d ? 'var(--accent)' : 'var(--bg-primary)',
                        color: difficulty === d ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {diffLabels[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of questions */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Numero de preguntas
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[5, 10, 15].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        background: numQuestions === n ? 'var(--accent)' : 'var(--bg-primary)',
                        color: numQuestions === n ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {n} preguntas
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleGenerateQuiz}
                disabled={!selectedProjectId || quizLoading}
                style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 600, borderRadius: 10 }}
              >
                {quizLoading ? 'Generando quiz...' : 'Generar Quiz'}
              </button>

              {/* Quiz history */}
              {quizHistory.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                    Historial de Quizzes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quizHistory.slice(0, 8).map(h => {
                      const pct = Math.round((h.score / h.total) * 100)
                      return (
                        <div key={h.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)',
                        }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{h.projectName}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                              {diffLabels[h.difficulty as Difficulty] || h.difficulty}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {new Date(h.date).toLocaleDateString('es-CL')}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(pct) }}>
                              {h.score}/{h.total} ({pct}%)
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : !quizSubmitted ? (
            /* Active quiz */
            <div>
              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Pregunta {currentQuestion + 1} de {quiz.questions.length}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {Object.keys(userAnswers).length}/{quiz.questions.length} respondidas
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: 'var(--accent)',
                    width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>

              {/* Question card */}
              <div className="u-card" style={{ padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px', lineHeight: 1.5 }}>
                  {quiz.questions[currentQuestion].question}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quiz.questions[currentQuestion].options.map((opt, idx) => {
                    const selected = userAnswers[currentQuestion] === idx
                    return (
                      <button
                        key={idx}
                        onClick={() => selectAnswer(currentQuestion, idx)}
                        style={{
                          padding: '14px 16px', borderRadius: 10, border: '2px solid',
                          borderColor: selected ? 'var(--accent)' : 'var(--border)',
                          background: selected ? 'var(--accent)10' : 'var(--bg-primary)',
                          color: 'var(--text-primary)', fontSize: 14, textAlign: 'left',
                          cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
                        }}
                      >
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                          background: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                          color: selected ? '#fff' : 'var(--text-secondary)',
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentQuestion(c => Math.max(0, c - 1))}
                  disabled={currentQuestion === 0}
                  style={{ padding: '10px 20px', fontSize: 14 }}
                >
                  Anterior
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {currentQuestion < quiz.questions.length - 1 ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentQuestion(c => c + 1)}
                      style={{ padding: '10px 20px', fontSize: 14 }}
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={submitQuiz}
                      disabled={Object.keys(userAnswers).length < quiz.questions.length}
                      style={{
                        padding: '10px 24px', fontSize: 14, fontWeight: 700,
                        opacity: Object.keys(userAnswers).length < quiz.questions.length ? 0.5 : 1,
                      }}
                    >
                      Enviar Quiz
                    </button>
                  )}
                </div>
              </div>

              {/* Question dots */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                {quiz.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                      background: i === currentQuestion ? 'var(--accent)' : userAnswers[i] !== undefined ? 'var(--accent)30' : 'var(--bg-secondary)',
                      color: i === currentQuestion ? '#fff' : userAnswers[i] !== undefined ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Results screen */
            <div>
              {(() => {
                const correct = quiz.questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.correctAnswer ? 1 : 0), 0)
                const pct = Math.round((correct / quiz.questions.length) * 100)
                return (
                  <>
                    {/* Score card */}
                    <div className="u-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
                      <div style={{
                        width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${scoreColor(pct)}15`, border: `3px solid ${scoreColor(pct)}`,
                      }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor(pct) }}>{pct}%</span>
                      </div>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                        {pct >= 70 ? 'Excelente trabajo!' : pct >= 50 ? 'Buen intento!' : 'Sigue practicando!'}
                      </h2>
                      <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
                        {correct} de {quiz.questions.length} respuestas correctas
                      </p>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                        <button className="btn btn-primary" onClick={handleGenerateQuiz} style={{ padding: '10px 24px' }}>
                          Intentar de nuevo
                        </button>
                        <button className="btn btn-secondary" onClick={resetQuiz} style={{ padding: '10px 24px' }}>
                          Nuevo quiz
                        </button>
                      </div>
                    </div>

                    {/* Review questions */}
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                      Revision de respuestas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {quiz.questions.map((q, i) => {
                        const isCorrect = userAnswers[i] === q.correctAnswer
                        return (
                          <div key={i} className="u-card" style={{
                            padding: 16, borderLeft: `4px solid ${isCorrect ? '#10B981' : '#EF4444'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                              <span style={{
                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700,
                                background: isCorrect ? '#10B98120' : '#EF444420',
                                color: isCorrect ? '#10B981' : '#EF4444',
                              }}>
                                {isCorrect ? '\u2713' : '\u2717'}
                              </span>
                              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                                {i + 1}. {q.question}
                              </p>
                            </div>
                            <div style={{ marginLeft: 34, fontSize: 13 }}>
                              {!isCorrect && (
                                <p style={{ color: '#EF4444', margin: '0 0 4px' }}>
                                  Tu respuesta: {q.options[userAnswers[i]] || 'Sin respuesta'}
                                </p>
                              )}
                              <p style={{ color: '#10B981', margin: '0 0 4px' }}>
                                Respuesta correcta: {q.options[q.correctAnswer]}
                              </p>
                              {q.explanation && (
                                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontStyle: 'italic' }}>
                                  {q.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: FLASHCARDS ═══════════════════ */}
      {activeTab === 'flashcards' && (
        <div>
          {flashcards.length === 0 ? (
            <div>
              {/* Generator */}
              <div className="u-card" style={{ padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
                  Generar Flashcards
                </h2>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Asignatura
                  </label>
                  <select
                    value={fcProjectId}
                    onChange={e => setFcProjectId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-primary)', outline: 'none',
                    }}
                  >
                    <option value="">Selecciona una asignatura...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateFlashcards}
                  disabled={!fcProjectId || fcLoading}
                  style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 600, borderRadius: 10 }}
                >
                  {fcLoading ? 'Generando flashcards...' : 'Generar Flashcards'}
                </button>
              </div>

              {/* Saved decks */}
              {decks.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                    Mazos guardados
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {decks.map(deck => (
                      <div key={deck.id} className="u-card" style={{
                        padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{deck.projectName}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                            {deck.cards.length} tarjetas
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                            {new Date(deck.createdAt).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => loadDeck(deck)}
                            style={{ padding: '6px 14px', fontSize: 12 }}
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteDeck(deck.id)}
                            style={{
                              padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)',
                              background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: 12,
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Flashcard viewer */
            <div>
              {/* Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tarjeta {currentCard + 1} de {flashcards.length}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {flashcards.filter(c => c.learned).length} aprendidas
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: 24 }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: '#10B981',
                  width: `${(flashcards.filter(c => c.learned).length / flashcards.length) * 100}%`,
                  transition: 'width 0.3s',
                }} />
              </div>

              {/* 3D flip card */}
              <div
                ref={cardRef}
                onClick={() => setFlipped(f => !f)}
                style={{
                  perspective: 1000, cursor: 'pointer', marginBottom: 20, height: 300,
                }}
              >
                <div style={{
                  position: 'relative', width: '100%', height: '100%',
                  transformStyle: 'preserve-3d', transition: 'transform 0.6s',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>
                  {/* Front */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                      Pregunta
                    </span>
                    <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                      {flashcards[currentCard].front}
                    </p>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 20 }}>
                      Haz clic o presiona Espacio para voltear
                    </span>
                  </div>
                  {/* Back */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--accent)10, var(--bg-secondary))',
                    border: '1px solid var(--accent)40',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                      Respuesta
                    </span>
                    <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {flashcards[currentCard].back}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLearned(currentCard) }}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: '1px solid',
                    borderColor: flashcards[currentCard].learned ? '#10B981' : 'var(--border)',
                    background: flashcards[currentCard].learned ? '#10B98115' : 'var(--bg-primary)',
                    color: flashcards[currentCard].learned ? '#10B981' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                  }}
                >
                  {flashcards[currentCard].learned ? '\u2713 Aprendido' : 'Marcar aprendido'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (flashcards[currentCard].learned) toggleLearned(currentCard)
                  }}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--bg-primary)', color: '#F59E0B',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                  }}
                >
                  Repasar
                </button>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={goPrevCard}
                  disabled={currentCard === 0}
                  style={{ padding: '10px 20px', fontSize: 14 }}
                >
                  Anterior
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={saveDeck}
                    style={{ padding: '10px 16px', fontSize: 13 }}
                  >
                    Guardar mazo
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setFlashcards([]); setCurrentCard(0); setFlipped(false) }}
                    style={{ padding: '10px 16px', fontSize: 13 }}
                  >
                    Cerrar
                  </button>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={goNextCard}
                  disabled={currentCard === flashcards.length - 1}
                  style={{ padding: '10px 20px', fontSize: 14 }}
                >
                  Siguiente
                </button>
              </div>

              {/* Keyboard hint */}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 16 }}>
                Teclado: Espacio = voltear, Flechas = navegar
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: STATS ═══════════════════ */}
      {activeTab === 'stats' && (
        <div>
          {totalQuizzes === 0 ? (
            <div className="u-card" style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>📊</p>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Sin resultados aun
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Completa tu primer quiz para ver tus estadisticas aqui
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Quizzes completados', value: totalQuizzes, color: 'var(--accent)' },
                  { label: 'Promedio general', value: `${avgScore}%`, color: scoreColor(avgScore) },
                  { label: 'Racha de estudio', value: `${streakDays} dias`, color: '#F59E0B' },
                  { label: 'Materias practicadas', value: subjectAvgs.length, color: '#8B5CF6' },
                ].map((s, i) => (
                  <div key={i} className="u-card" style={{ padding: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Best/worst subjects */}
              {subjectAvgs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  {bestSubject && (
                    <div className="u-card" style={{ padding: 18 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#10B981', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Mejor materia
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                        {bestSubject.name}
                      </p>
                      <p style={{ fontSize: 14, color: '#10B981', margin: 0, fontWeight: 600 }}>
                        {bestSubject.avg}% promedio ({bestSubject.count} quizzes)
                      </p>
                    </div>
                  )}
                  {worstSubject && subjectAvgs.length > 1 && (
                    <div className="u-card" style={{ padding: 18 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Para repasar
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                        {worstSubject.name}
                      </p>
                      <p style={{ fontSize: 14, color: '#EF4444', margin: 0, fontWeight: 600 }}>
                        {worstSubject.avg}% promedio ({worstSubject.count} quizzes)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CSS bar chart */}
              {chartData.length > 0 && (
                <div className="u-card" style={{ padding: 24, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
                    Puntajes recientes
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                    {chartData.map((d, i) => (
                      <div key={i} style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(d.value) }}>{d.value}%</span>
                        <div style={{
                          width: '100%', maxWidth: 48, borderRadius: '6px 6px 0 0',
                          background: `linear-gradient(to top, ${scoreColor(d.value)}, ${scoreColor(d.value)}80)`,
                          height: `${Math.max((d.value / chartMax) * 130, 4)}px`,
                          transition: 'height 0.5s ease',
                        }} />
                        <span style={{
                          fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60,
                        }}>
                          {d.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-subject breakdown */}
              <div className="u-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                  Rendimiento por materia
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {subjectAvgs.map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.avg) }}>{s.avg}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: scoreColor(s.avg), width: `${s.avg}%`,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Global styles for this page */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
