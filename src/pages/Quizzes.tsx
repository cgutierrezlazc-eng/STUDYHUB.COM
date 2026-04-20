import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { Project } from '../types';
import styles from './Quizzes.module.css';

interface Props {
  projects: Project[];
  onNavigate: (path: string) => void;
}

type Tab = 'quizzes' | 'flashcards' | 'stats';
type Difficulty = 'easy' | 'medium' | 'hard';

interface QuizHistoryEntry {
  id: string;
  date: string;
  projectName: string;
  score: number;
  total: number;
  difficulty: string;
}

// ─── LocalStorage helpers ────────────────────────────────────
const QUIZ_HISTORY_KEY = 'conniku_quiz_history';

function getQuizHistory(): QuizHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveQuizHistory(history: QuizHistoryEntry[]) {
  localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
}

// ─── Main Component ──────────────────────────────────────────
export default function Quizzes({ projects, onNavigate }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('quizzes');
  const [quizHistory] = useState<QuizHistoryEntry[]>(getQuizHistory());

  // ─── Stats ───────────────────────────────────────────────
  const totalQuizzes = quizHistory.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(quizHistory.reduce((a, h) => a + (h.score / h.total) * 100, 0) / totalQuizzes)
      : 0;
  const subjectScores: Record<string, { total: number; sum: number }> = {};
  quizHistory.forEach((h) => {
    if (!subjectScores[h.projectName]) subjectScores[h.projectName] = { total: 0, sum: 0 };
    subjectScores[h.projectName].total++;
    subjectScores[h.projectName].sum += (h.score / h.total) * 100;
  });
  const subjectAvgs = Object.entries(subjectScores)
    .map(([name, data]) => ({
      name,
      avg: Math.round(data.sum / data.total),
      count: data.total,
    }))
    .sort((a, b) => b.avg - a.avg);
  const bestSubject = subjectAvgs[0];
  const worstSubject = subjectAvgs[subjectAvgs.length - 1];

  const streakDays = (() => {
    if (quizHistory.length === 0) return 0;
    const dates = [...new Set(quizHistory.map((h) => new Date(h.date).toDateString()))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000;
      if (diff <= 1.5) streak++;
      else break;
    }
    return streak;
  })();

  const chartData = quizHistory
    .slice(0, 10)
    .reverse()
    .map((h) => ({
      label: h.projectName.substring(0, 8),
      value: Math.round((h.score / h.total) * 100),
    }));

  const scoreColor = (pct: number) => (pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444');
  const diffLabels: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
  };

  // ─── Project card component (shared by quiz + flashcard tabs) ─
  const ProjectCards = ({ tab }: { tab: 'quiz' | 'flashcards' }) => {
    if (projects.length === 0) {
      return (
        <div
          className="u-card"
          style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'quiz' ? '📚' : '🃏'}</div>
          <p>
            Crea una asignatura para empezar a generar {tab === 'quiz' ? 'quizzes' : 'flashcards'}.
          </p>
        </div>
      );
    }
    return (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
            marginBottom: 32,
          }}
        >
          {projects.map((p) => {
            const ph = tab === 'quiz' ? quizHistory.filter((h) => h.projectName === p.name) : [];
            const last = ph[0];
            const avgPct =
              ph.length > 0
                ? Math.round(ph.reduce((a, h) => a + (h.score / h.total) * 100, 0) / ph.length)
                : null;
            const hasDocs = p.documents.length > 0;
            return (
              <div
                key={p.id}
                className="u-card"
                style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: (p as any).color || 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {(p as any).icon || '📚'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.documents.length} doc{p.documents.length !== 1 ? 's' : ''}
                      {tab === 'quiz' && ph.length > 0 && (
                        <span>
                          {' '}
                          · {ph.length} quiz{ph.length !== 1 ? 'zes' : ''}
                        </span>
                      )}
                      {tab === 'quiz' && avgPct !== null && (
                        <span style={{ color: scoreColor(avgPct), fontWeight: 600 }}>
                          {' '}
                          · avg {avgPct}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last quiz result (quiz tab only) */}
                {tab === 'quiz' && last && (
                  <div
                    style={{
                      padding: '7px 10px',
                      borderRadius: 7,
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: scoreColor(Math.round((last.score / last.total) * 100)),
                      }}
                    >
                      {Math.round((last.score / last.total) * 100)}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {last.score}/{last.total} · {new Date(last.date).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                )}

                {/* Document preview */}
                {hasDocs && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                    }}
                  >
                    {p.documents.slice(0, 3).map((d) => (
                      <span
                        key={d.id}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name}
                      </span>
                    ))}
                    {p.documents.length > 3 && (
                      <span style={{ padding: '2px 6px', color: 'var(--text-muted)' }}>
                        +{p.documents.length - 3} más
                      </span>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-sm"
                  disabled={!hasDocs}
                  title={!hasDocs ? 'Sube documentos primero en la asignatura' : ''}
                  onClick={() => onNavigate(`/project/${p.id}?tab=${tab}`)}
                  style={{ alignSelf: 'stretch', marginTop: 'auto' }}
                >
                  {hasDocs
                    ? tab === 'quiz'
                      ? 'Ir al Quiz →'
                      : 'Ir a Flashcards →'
                    : 'Sin documentos'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Recent quiz history (quiz tab only) */}
        {tab === 'quiz' && quizHistory.length > 0 && (
          <div>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 10px',
              }}
            >
              Historial reciente
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {quizHistory.slice(0, 8).map((h) => {
                const pct = Math.round((h.score / h.total) * 100);
                return (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: scoreColor(pct) + '18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(pct) }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h.projectName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {diffLabels[h.difficulty as Difficulty] || h.difficulty} · {h.score}/
                        {h.total} · {new Date(h.date).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.quizRoot}>
      <div className={styles.topProgress}>
        <div className={styles.tpLeft}>
          <span className={styles.pulse} aria-hidden="true" />
          <span>Quizzes y flashcards</span>
        </div>
        <span>Practica desde tus documentos</span>
      </div>

      <main className={styles.main}>
        {/* ── Hero editorial ── */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroH1}>
              Aprende con
              <br />
              <span className={styles.hlCyan}>flashcards</span>
              <br />
              inteligentes.
            </h1>
            <p className={styles.heroLead}>
              Generadas desde tus documentos. <strong>Repaso espaciado</strong> según tu desempeño
              en cada asignatura.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.hsLabel}>Tu progreso</div>
            <div className={styles.hsGrid}>
              <div className={`${styles.hsItem} ${styles.hl}`}>
                <div className="v" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                  {totalQuizzes > 0 ? `${avgScore}%` : '—'}
                </div>
                <div
                  className="l"
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.55,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  Precisión
                </div>
              </div>
              <div className={styles.hsItem}>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{totalQuizzes}</div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.55,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  Quizzes hechos
                </div>
              </div>
              <div className={styles.hsItem}>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                  {streakDays > 0 ? `${streakDays}d` : '—'}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.55,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  Racha
                </div>
              </div>
              <div className={styles.hsItem}>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                  {subjectAvgs.length}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.55,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  Materias
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tabs editoriales ── */}
        <div className={styles.tabs} role="tablist">
          {(
            [
              ['quizzes', 'Quizzes'],
              ['flashcards', 'Flashcards'],
              ['stats', 'Mis resultados'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`${styles.tabBtn} ${activeTab === key ? styles.active : ''}`}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: QUIZZES ═══ */}
        {activeTab === 'quizzes' && <ProjectCards tab="quiz" />}

        {/* ═══ TAB: FLASHCARDS ═══ */}
        {activeTab === 'flashcards' && <ProjectCards tab="flashcards" />}

        {/* ═══ TAB: STATS ═══ */}
        {activeTab === 'stats' && (
          <div>
            {totalQuizzes === 0 ? (
              <div className="u-card" style={{ padding: 48, textAlign: 'center' }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📊</p>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: '0 0 8px',
                  }}
                >
                  Sin resultados aún
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                  Completa tu primer quiz para ver tus estadísticas aquí
                </p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  {[
                    { label: 'Quizzes completados', value: totalQuizzes, color: 'var(--accent)' },
                    {
                      label: 'Promedio general',
                      value: `${avgScore}%`,
                      color: scoreColor(avgScore),
                    },
                    { label: 'Racha de estudio', value: `${streakDays} días`, color: '#F59E0B' },
                    { label: 'Materias practicadas', value: subjectAvgs.length, color: '#8B5CF6' },
                  ].map((s, i) => (
                    <div key={i} className="u-card" style={{ padding: 20, textAlign: 'center' }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>
                        {s.value}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          margin: '4px 0 0',
                        }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Best/worst subjects */}
                {subjectAvgs.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                      marginBottom: 24,
                    }}
                  >
                    {bestSubject && (
                      <div className="u-card" style={{ padding: 18 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#10B981',
                            margin: '0 0 6px',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Mejor materia
                        </p>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '0 0 2px',
                          }}
                        >
                          {bestSubject.name}
                        </p>
                        <p style={{ fontSize: 14, color: '#10B981', margin: 0, fontWeight: 600 }}>
                          {bestSubject.avg}% promedio ({bestSubject.count} quizzes)
                        </p>
                      </div>
                    )}
                    {worstSubject && subjectAvgs.length > 1 && (
                      <div className="u-card" style={{ padding: 18 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#EF4444',
                            margin: '0 0 6px',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Para repasar
                        </p>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '0 0 2px',
                          }}
                        >
                          {worstSubject.name}
                        </p>
                        <p style={{ fontSize: 14, color: '#EF4444', margin: 0, fontWeight: 600 }}>
                          {worstSubject.avg}% promedio ({worstSubject.count} quizzes)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bar chart */}
                {chartData.length > 0 && (
                  <div className="u-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: '0 0 20px',
                      }}
                    >
                      Puntajes recientes
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                      {chartData.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            height: '100%',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <span
                            style={{ fontSize: 11, fontWeight: 700, color: scoreColor(d.value) }}
                          >
                            {d.value}%
                          </span>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: 48,
                              borderRadius: '6px 6px 0 0',
                              background: `linear-gradient(to top, ${scoreColor(d.value)}, ${scoreColor(d.value)}80)`,
                              height: `${Math.max((d.value / 100) * 130, 4)}px`,
                              transition: 'height 0.5s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--text-secondary)',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 60,
                            }}
                          >
                            {d.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-subject breakdown */}
                <div className="u-card" style={{ padding: 24 }}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 16px',
                    }}
                  >
                    Rendimiento por materia
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {subjectAvgs.map((s, i) => (
                      <div key={i}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                          >
                            {s.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.avg) }}>
                            {s.avg}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: 'var(--bg-secondary)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 4,
                              background: scoreColor(s.avg),
                              width: `${s.avg}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
