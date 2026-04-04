import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORY_EMOJIS: Record<string, string> = {
  communication: '🗣️', leadership: '👑', emotional: '🧠',
  thinking: '🔍', productivity: '🚀', ethics: '⚖️', career: '⭐',
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

      if (data.needsGeneration) {
        setGenerating(true)
        try {
          await api.generateCourseContent(courseId)
          const updated = await api.getCourse(courseId)
          setCourseDetail(updated)
          setSelectedCourse(updated)
        } catch (err: any) {
          console.error('Course generation failed:', err)
          setCourseError('El contenido del curso no está disponible en este momento. El servicio de generación está temporalmente fuera de servicio. Puedes ver la información del curso mientras tanto.')
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
      if (result.passed) {
        setCourseDetail((prev: any) => ({
          ...prev,
          progress: { ...prev.progress, completed: true, quizPassed: true, certificateId: result.certificateId },
        }))
      }
    } catch (err: any) {
      console.error('Quiz submission failed:', err)
      setQuizError('Error al enviar el examen. Intenta de nuevo.')
    }
  }

  const loadCertificates = async () => {
    try { setCertificates(await api.getMyCertificates()) } catch (err: any) {
      console.error('Failed to load certificates:', err)
    }
  }

  // Course detail view
  if (courseDetail) {
    const lessons = courseDetail.lessons || []
    const currentLesson = lessons[activeLesson]
    const allLessonsComplete = lessons.length > 0 && lessons.every((l: any) => l.completed)

    return (
      <>
        <div className="page-header">
          <button className="btn btn-secondary btn-sm" onClick={() => { setCourseDetail(null); setSelectedCourse(null) }} style={{ marginBottom: 8 }}>
            ← Volver al catálogo
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{courseDetail.emoji}</span>
            <div>
              <h2 style={{ margin: 0 }}>{courseDetail.title}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                {courseDetail.lessons?.length || 0} lecciones · ~{courseDetail.estimatedMinutes} min
                {courseDetail.progress?.completed && ' · ✅ Completado'}
              </p>
            </div>
          </div>
        </div>

        <div className="page-body">
          {courseError && (
            <div style={{
              padding: '16px 20px', marginBottom: 16, borderRadius: 12,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Contenido no disponible
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {courseError}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
                  onClick={() => { setCourseError(null); openCourse(courseDetail.id) }}>
                  Reintentar
                </button>
              </div>
            </div>
          )}
          {generating ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="loading-dots"><span /><span /><span /></div>
              <h3 style={{ marginTop: 16 }}>Generando contenido del curso...</h3>
              <p style={{ color: 'var(--text-muted)' }}>Conniku está creando lecciones personalizadas para ti</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
              {/* Lesson sidebar */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {lessons.map((lesson: any, i: number) => (
                    <button key={lesson.id} onClick={() => { setActiveLesson(i); setQuizMode(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: i === activeLesson && !quizMode ? 'rgba(37,99,235,0.08)' : 'transparent',
                        color: i === activeLesson && !quizMode ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: i === activeLesson && !quizMode ? 600 : 400, fontSize: 13,
                      }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${lesson.completed ? 'var(--accent-green)' : 'var(--border)'}`, background: lesson.completed ? 'var(--accent-green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, flexShrink: 0 }}>
                        {lesson.completed ? '✓' : i + 1}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                    </button>
                  ))}
                  {courseDetail.quiz && (
                    <button onClick={() => setQuizMode(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 8,
                        background: quizMode ? 'rgba(37,99,235,0.08)' : 'transparent',
                        color: quizMode ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: quizMode ? 600 : 400, fontSize: 13,
                      }}>
                      <span style={{ fontSize: 16 }}>📝</span>
                      Examen Final {courseDetail.progress?.quizPassed && '✅'}
                    </button>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div>
                {!quizMode && currentLesson ? (
                  <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0 }}>{currentLesson.title}</h3>
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}
                      dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>Contenido no disponible.</p>' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      {!currentLesson.completed ? (
                        <button className="btn btn-primary" onClick={() => handleCompleteLesson(currentLesson.id)}>
                          ✅ Marcar como completada
                        </button>
                      ) : (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 14 }}>✅ Lección completada</span>
                      )}
                      {activeLesson < lessons.length - 1 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setActiveLesson(activeLesson + 1)}>
                          Siguiente lección →
                        </button>
                      )}
                      {activeLesson === lessons.length - 1 && allLessonsComplete && courseDetail.quiz && (
                        <button className="btn btn-primary btn-sm" onClick={() => setQuizMode(true)}>
                          Ir al examen final →
                        </button>
                      )}
                    </div>
                  </div>
                ) : quizMode && courseDetail.quiz ? (
                  <div className="card" style={{ padding: 24 }}>
                    {quizResult ? (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>{quizResult.passed ? '🎉' : '📚'}</div>
                        <h3>{quizResult.passed ? '¡Felicidades! Aprobaste el curso' : 'Sigue practicando'}</h3>
                        <div style={{ fontSize: 32, fontWeight: 700, margin: '12px 0' }}>{quizResult.score}%</div>
                        <p style={{ color: 'var(--text-muted)' }}>{quizResult.correct}/{quizResult.total} respuestas correctas</p>
                        {quizResult.passed && (
                          <div style={{ marginTop: 16, padding: 16, background: 'rgba(5,150,105,0.08)', borderRadius: 12, border: '1px solid rgba(5,150,105,0.2)' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>🏅</div>
                            <strong>Certificado obtenido</strong>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                              {quizResult.courseTitle} — se agregó a tu perfil profesional
                            </p>
                          </div>
                        )}
                        {!quizResult.passed && (
                          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setQuizResult(null); setQuizAnswers({}) }}>
                            Intentar de nuevo
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <h3 style={{ marginTop: 0 }}>📝 Examen Final</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Necesitas 70% para aprobar y obtener tu certificado</p>
                        {courseDetail.quiz.questions.map((q: any, qi: number) => (
                          <div key={qi} style={{ marginBottom: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                            <p style={{ fontWeight: 600, marginBottom: 8 }}>{qi + 1}. {q.question}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {q.options.map((opt: string, oi: number) => (
                                <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [String(qi)]: oi }))}
                                  style={{
                                    padding: '8px 12px', borderRadius: 6, textAlign: 'left', cursor: 'pointer',
                                    border: `2px solid ${quizAnswers[String(qi)] === oi ? 'var(--accent)' : 'var(--border)'}`,
                                    background: quizAnswers[String(qi)] === oi ? 'rgba(37,99,235,0.05)' : 'transparent',
                                    color: 'var(--text-primary)', fontSize: 14,
                                  }}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {quizError && (
                          <div style={{ padding: '12px 16px', marginBottom: 12, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#ef4444' }}>
                            {quizError}
                          </div>
                        )}
                        <button className="btn btn-primary" onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length < courseDetail.quiz.questions.length}>
                          Enviar Examen ({Object.keys(quizAnswers).length}/{courseDetail.quiz.questions.length})
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  // Catalog view
  return (
    <>
      <div className="page-header">
        {/* Reward banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1A3A7A 0%, #2D5FAA 100%)',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 16, color: '#fff',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20,
          }}>⭐</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Gana beneficios completando cursos</div>
            <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.4 }}>
              Completa 3 cursos y obtiene 1 mes de Pro gratis. Completa 6 cursos y obtiene 1 mes de Max gratis. Los cursos completados se acumulan de forma permanente en tu perfil.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Cursos y Formación</h2>
            <p>60+ cursos para tu crecimiento personal, profesional y tecnológico</p>
          </div>
          <button className={`tab ${tab === 'my-certs' ? 'active' : ''}`}
            onClick={() => { setTab(tab === 'my-certs' ? 'catalog' : 'my-certs'); if (tab !== 'my-certs') loadCertificates() }}>
            🏅 Mis Certificados
          </button>
        </div>
        {tab === 'catalog' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className={`tab ${!selectedCategory ? 'active' : ''}`} onClick={() => { setSelectedCategory(''); setTimeout(loadCourses, 50) }}>
              Todos
            </button>
            {Object.entries(categories).map(([key, label]) => (
              <button key={key} className={`tab ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(key); setTimeout(loadCourses, 50) }}>
                {CATEGORY_EMOJIS[key] || '📚'} {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="page-body">
        {tab === 'my-certs' ? (
          certificates.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div style={{ fontSize: 48 }}>🏅</div>
              <h3>Aún no tienes certificados</h3>
              <p>Completa cursos para obtener certificados que se agregan a tu perfil profesional</p>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('catalog')}>Ver Cursos</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {certificates.map((cert: any) => (
                <div key={cert.certificateId} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{cert.courseEmoji}</div>
                  <h4 style={{ margin: '0 0 4px' }}>{cert.courseTitle}</h4>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Puntuación: {cert.score}% · {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString('es') : ''}
                  </div>
                  <div style={{ padding: 8, background: 'rgba(5,150,105,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--accent-green)' }}>
                    🏅 Certificado verificado · ID: {cert.certificateId?.slice(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="loading-dots"><span /><span /><span /></div>
        ) : error ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <h3>Error al cargar cursos</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setLoading(true); loadCourses() }}>
              Reintentar
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>📚</div>
            <h3>No hay cursos disponibles</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {selectedCategory ? 'No se encontraron cursos en esta categoría. Prueba con otra.' : 'Los cursos estarán disponibles próximamente.'}
            </p>
            {selectedCategory && (
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => { setSelectedCategory(''); setTimeout(loadCourses, 50) }}>
                Ver todos los cursos
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured courses */}
            {courses.filter(c => c.isFeatured && !selectedCategory).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, marginBottom: 12 }}>⭐ Cursos Destacados</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {courses.filter(c => c.isFeatured).map(course => (
                    <div key={course.id} className="card" style={{ padding: 20, cursor: 'pointer', borderLeft: '4px solid var(--accent)' }}
                      onClick={() => openCourse(course.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>{course.emoji}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15 }}>{course.title}</h4>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.lessonCount} lecciones · ~{course.estimatedMinutes} min</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{course.description}</p>
                      {course.progress?.completed && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>✅ Completado · 🏅 Certificado</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All courses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {courses.map(course => (
                <div key={course.id} className="card" style={{ padding: 16, cursor: 'pointer' }}
                  onClick={() => openCourse(course.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{course.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 14 }}>{course.title}</h4>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {course.lessonCount} lecciones · ~{course.estimatedMinutes} min
                        {course.difficulty === 'intermediate' && <span style={{ marginLeft: 6, color: 'var(--accent-orange)' }}>Intermedio</span>}
                      </div>
                    </div>
                    {course.progress?.completed ? (
                      <span style={{ fontSize: 16 }}>🏅</span>
                    ) : course.progress?.started ? (
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{course.progress.completedLessons}/{course.lessonCount}</span>
                    ) : null}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{course.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
