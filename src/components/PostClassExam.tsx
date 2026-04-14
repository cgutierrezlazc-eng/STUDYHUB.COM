import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface PostClassExamProps {
  classId: string;
  onClose: () => void;
}

const MAX_ATTEMPTS = 3;

const PostClassExam: React.FC<PostClassExamProps> = ({ classId, onClose }) => {
  const [state, setState] = useState<
    'loading' | 'no_exam' | 'results' | 'taking' | 'result' | 'exhausted'
  >('loading');
  const [examData, setExamData] = useState<any>(null);
  const [attemptsData, setAttemptsData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [lastResult, setLastResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showLastWarning, setShowLastWarning] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getExamAttempts(classId);
        setAttemptsData(res);
        if (!res.exam || !res.exam.is_enabled) {
          setState('no_exam');
          return;
        }
        setExamData(res.exam);
        if (res.passed) {
          setState('results');
        } else if (res.attempts_used >= MAX_ATTEMPTS) {
          setState('exhausted');
        } else if (res.attempts.length > 0) {
          // Has prior attempts — show results with option to retry
          setLastResult(res.attempts[res.attempts.length - 1]);
          setState('results');
        } else {
          setState('taking');
          startTimeRef.current = Date.now();
        }
      } catch {
        setState('no_exam');
      }
    };
    load();
  }, [classId]);

  const handleStartAttempt = () => {
    const nextAttempt = (attemptsData?.attempts_used || 0) + 1;
    if (nextAttempt === MAX_ATTEMPTS) {
      setShowLastWarning(true);
    } else {
      beginAttempt();
    }
  };

  const beginAttempt = () => {
    setShowLastWarning(false);
    setAnswers({});
    setCurrentQ(0);
    startTimeRef.current = Date.now();
    setState('taking');
  };

  const handleAnswer = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      const res = await api.submitExamAttempt(classId, answers, timeSpent);
      setLastResult(res.result);
      // Refresh attempts data
      const updated = await api.getExamAttempts(classId);
      setAttemptsData(updated);
      if (res.result.passed) {
        setState('results');
      } else if (updated.attempts_used >= MAX_ATTEMPTS) {
        setState('exhausted');
      } else {
        setState('result');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al enviar el examen');
    } finally {
      setSubmitting(false);
    }
  };

  const questions = examData?.questions || [];
  const attemptsUsed = attemptsData?.attempts_used || 0;

  // ─── Loading ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando examen…</p>
      </div>
    );
  }

  // ─── No exam ────────────────────────────────────────────────
  if (state === 'no_exam') {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          El tutor no ha habilitado un examen para esta clase.
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  // ─── Exhausted ──────────────────────────────────────────────
  if (state === 'exhausted') {
    const passed = attemptsData?.passed;
    const bestScore = attemptsData?.best_score || 0;
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{passed ? '🎉' : '😔'}</div>
        <h3 style={{ margin: '0 0 8px', color: passed ? '#22c55e' : '#ef4444' }}>
          {passed ? 'Examen aprobado' : 'Intentos agotados'}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: passed ? 16 : 8 }}>
          Mejor puntaje: <strong>{bestScore.toFixed(1)}%</strong> | Mínimo:{' '}
          <strong>{examData?.passing_score}%</strong>
        </p>
        {!passed && (
          <div
            style={{
              padding: '10px 14px',
              background: '#ef444411',
              border: '1px solid #ef444433',
              borderRadius: 8,
              fontSize: 13,
              color: '#ef4444',
              marginBottom: 16,
            }}
          >
            Has usado los {MAX_ATTEMPTS} intentos disponibles. La garantía de reembolso no aplica
            cuando se agotan los intentos del examen.
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  // ─── Last attempt warning ────────────────────────────────────
  if (showLastWarning) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <h3 style={{ margin: '0 0 4px', color: '#f59e0b' }}>Último intento</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 }}>
            Intento {attemptsUsed + 1} de {MAX_ATTEMPTS}
          </p>
        </div>
        <div
          style={{
            padding: '14px 16px',
            background: '#f59e0b11',
            border: '1px solid #f59e0b44',
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          <strong>Este es tu último intento disponible.</strong> Si no apruebas esta vez, habrás
          agotado los {MAX_ATTEMPTS} intentos permitidos. Ten en cuenta que{' '}
          <strong>la garantía de reembolso no aplicará</strong> después de agotar todos los intentos
          del examen sin aprobarlo.
          <br />
          <br />
          Asegúrate de haber revisado el material de la clase antes de continuar.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => setShowLastWarning(false)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={beginAttempt}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#f59e0b',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    );
  }

  // ─── Taking exam ─────────────────────────────────────────────
  if (state === 'taking') {
    const q = questions[currentQ];
    const totalQ = questions.length;
    const progress = ((currentQ + 1) / totalQ) * 100;
    const allAnswered = questions.every((q: any) => answers[q.id] !== undefined);

    if (!q) return null;

    return (
      <div>
        {/* Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{examData?.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Intento {attemptsUsed + 1}/{MAX_ATTEMPTS}
              {attemptsUsed + 1 === MAX_ATTEMPTS && (
                <span style={{ color: '#f59e0b', marginLeft: 6 }}>⚠ Último intento</span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {currentQ + 1}/{totalQ}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--bg-secondary)' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent)',
              transition: 'width 0.3s',
            }}
          />
        </div>

        {/* Question */}
        <div style={{ padding: '20px 20px 12px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, margin: '0 0 16px' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: 6, fontSize: 12 }}>
              {currentQ + 1}.
            </span>
            {q.question}
          </p>

          {q.type === 'multiple_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(q.options || []).map((opt: string, i: number) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `2px solid ${answers[q.id] === i ? 'var(--accent)' : 'var(--border)'}`,
                    background: answers[q.id] === i ? 'var(--accent)10' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    checked={answers[q.id] === i}
                    onChange={() => handleAnswer(q.id, i)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === 'short_answer' && (
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder="Escribe tu respuesta aquí…"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            padding: '12px 20px 20px',
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => setCurrentQ((v) => Math.max(0, v - 1))}
            disabled={currentQ === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              opacity: currentQ === 0 ? 0.4 : 1,
            }}
          >
            ← Anterior
          </button>

          {/* Question dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    i === currentQ
                      ? 'var(--accent)'
                      : answers[questions[i].id] !== undefined
                        ? '#22c55e'
                        : 'var(--border)',
                }}
              />
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((v) => v + 1)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#22c55e',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: submitting || !allAnswered ? 0.5 : 1,
              }}
            >
              {submitting ? 'Enviando…' : 'Enviar examen'}
            </button>
          )}
        </div>
        {error && <p style={{ padding: '0 20px 16px', color: '#ef4444', fontSize: 13 }}>{error}</p>}
        {!allAnswered && currentQ === questions.length - 1 && (
          <p style={{ padding: '0 20px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
            Responde todas las preguntas antes de enviar (
            {questions.filter((q: any) => answers[q.id] === undefined).length} sin responder)
          </p>
        )}
      </div>
    );
  }

  // ─── After attempt result ────────────────────────────────────
  if (state === 'result') {
    const attemptsLeft = MAX_ATTEMPTS - attemptsUsed;
    const passed = lastResult?.passed;
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{passed ? '🎉' : '📖'}</div>
        <h3 style={{ margin: '0 0 8px', color: passed ? '#22c55e' : '#f59e0b' }}>
          {passed ? '¡Aprobaste!' : `Intento ${attemptsUsed}/${MAX_ATTEMPTS}`}
        </h3>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: passed ? '#22c55e' : 'var(--text-primary)',
            marginBottom: 4,
          }}
        >
          {lastResult?.score?.toFixed(1)}%
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Mínimo para aprobar: {examData?.passing_score}%
        </p>
        {!passed && attemptsLeft > 0 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              Estudiar primero
            </button>
            <button
              onClick={handleStartAttempt}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: attemptsLeft === 1 ? '#f59e0b' : 'var(--accent)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reintentar ({attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''} restante
              {attemptsLeft !== 1 ? 's' : ''})
            </button>
          </div>
        )}
        {passed && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#22c55e',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Continuar
          </button>
        )}
      </div>
    );
  }

  // ─── Results summary (passed or multi-attempt history) ───────
  const passed = attemptsData?.passed;
  const bestScore = attemptsData?.best_score || 0;
  const attempts = attemptsData?.attempts || [];
  const attemptsLeft = MAX_ATTEMPTS - attemptsUsed;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{passed ? '🏆' : '📊'}</div>
        <h3 style={{ margin: '0 0 4px', color: passed ? '#22c55e' : 'var(--text-primary)' }}>
          {passed ? '¡Examen aprobado!' : 'Historial de intentos'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Mejor puntaje: <strong>{bestScore.toFixed(1)}%</strong> | Mínimo:{' '}
          <strong>{examData?.passing_score}%</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {attempts.map((a: any) => (
          <div
            key={a.attempt_number}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Intento {a.attempt_number}</span>
            <span style={{ fontWeight: 700, color: a.passed ? '#22c55e' : '#ef4444' }}>
              {a.score.toFixed(1)}%
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 8,
                background: a.passed ? '#22c55e22' : '#ef444422',
                color: a.passed ? '#22c55e' : '#ef4444',
              }}
            >
              {a.passed ? 'Aprobado' : 'Reprobado'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
        {!passed && attemptsLeft > 0 && (
          <button
            onClick={handleStartAttempt}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: attemptsLeft === 1 ? '#f59e0b' : 'var(--accent)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reintentar ({attemptsLeft} restante{attemptsLeft !== 1 ? 's' : ''})
          </button>
        )}
      </div>
    </div>
  );
};

export default PostClassExam;
