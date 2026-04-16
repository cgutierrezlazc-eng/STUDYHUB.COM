import React, { useState, useEffect, useRef, useCallback } from 'react';

interface FocusModeProps {
  onExit: () => void;
  subjectName?: string;
}

// ─── Pomodoro helpers ──────────────────────────────────────
const POMODORO_SECONDS = 25 * 60;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Component ─────────────────────────────────────────────
export default function FocusMode({ onExit, subjectName }: FocusModeProps) {
  // Pomodoro state
  const [seconds, setSeconds] = useState(POMODORO_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session stats
  const [studySeconds, setStudySeconds] = useState(0);
  const [questions, setQuestions] = useState(0);
  const studyRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ambient toggle (visual only)
  const [ambient, setAmbient] = useState(false);

  // Transition
  const [visible, setVisible] = useState(false);

  // ── Mount: animate in + start study timer ──
  useEffect(() => {
    // Trigger enter transition on next frame
    const raf = requestAnimationFrame(() => setVisible(true));

    // Study time tracker
    studyRef.current = setInterval(() => setStudySeconds((prev) => prev + 1), 1000);

    return () => {
      cancelAnimationFrame(raf);
      if (studyRef.current) clearInterval(studyRef.current);
    };
  }, []);

  // ── Pomodoro interval ──
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+Shift+F or Cmd+Shift+F → toggle (exit)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        onExit();
      }
      // Escape → exit
      if (e.key === 'Escape') {
        onExit();
      }
    },
    [onExit]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Timer controls ──
  const handleStartPause = () => {
    if (seconds === 0) return;
    setRunning((prev) => !prev);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(POMODORO_SECONDS);
  };

  // ── Derived ──
  const studyMinutes = Math.floor(studySeconds / 60);

  // ── Styles ──
  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9000,
    background: visible ? '#0F172A' : 'transparent',
    transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
  };

  const topBarStyle: React.CSSProperties = {
    height: 56,
    background: '#1E293B',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 16,
    flexShrink: 0,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-10px)',
    transition:
      'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const subjectChip: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(79, 70, 229, 0.15)',
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 280,
  };

  const timerWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: '5px 14px',
  };

  const timerDotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: running ? '#10B981' : seconds === 0 ? '#EF4444' : '#F59E0B',
    animation: running ? 'focusPulseDot 2s infinite' : 'none',
    flexShrink: 0,
  };

  const timerDisplay: React.CSSProperties = {
    fontFamily: "'Inter', monospace",
    fontSize: 15,
    fontWeight: 700,
    color: seconds === 0 ? '#10B981' : '#F1F5F9',
    letterSpacing: '0.05em',
    minWidth: 52,
    textAlign: 'center',
  };

  const timerBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: seconds === 0 && !running ? 'default' : 'pointer',
    color: '#94A3B8',
    padding: 2,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  };

  const exitBtn: React.CSSProperties = {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 500,
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s',
    marginLeft: 'auto',
  };

  const contentArea: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s',
    padding: 24,
  };

  const centerCard: React.CSSProperties = {
    background: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 20,
    padding: '48px 56px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    maxWidth: 420,
    width: '100%',
  };

  const bigTimer: React.CSSProperties = {
    fontFamily: "'Inter', monospace",
    fontSize: 64,
    fontWeight: 700,
    color: seconds === 0 ? '#10B981' : '#F1F5F9',
    letterSpacing: '0.04em',
    lineHeight: 1,
  };

  const controlsRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const controlBtn = (bg: string, hoverBg: string): React.CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: 12,
    background: bg,
    border: '1px solid #334155',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F1F5F9',
    fontSize: 18,
    transition: 'background 0.2s, transform 0.1s',
  });

  const footerStyle: React.CSSProperties = {
    height: 36,
    background: '#0F172A',
    borderTop: '1px solid #1E293B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    flexShrink: 0,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.25s',
  };

  const statItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: 500,
  };

  const statSep: React.CSSProperties = {
    width: 3,
    height: 3,
    borderRadius: '50%',
    background: '#334155',
  };

  const ambientBtnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 52,
    right: 20,
    width: 42,
    height: 42,
    background: ambient ? 'rgba(79, 70, 229, 0.2)' : '#1E293B',
    border: ambient ? '1px solid #4F46E5' : '1px solid #334155',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 18,
    zIndex: 9001,
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.7)',
    transition: 'opacity 0.5s, transform 0.5s, background 0.2s, border-color 0.2s, box-shadow 0.2s',
    boxShadow: ambient ? '0 0 0 4px rgba(79, 70, 229, 0.15)' : 'none',
    color: '#F1F5F9',
  };

  return (
    <>
      {/* Keyframes for pulsing dot */}
      <style>{`
        @keyframes focusPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <div style={overlay}>
        {/* ── Top Bar ── */}
        <div style={topBarStyle}>
          {/* Subject chip */}
          {subjectName && (
            <div style={subjectChip}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              {subjectName}
            </div>
          )}

          {/* Mini timer */}
          <div style={timerWrap}>
            <div style={timerDotStyle} />
            <span style={timerDisplay}>{formatTime(seconds)}</span>
            <button
              style={timerBtn}
              onClick={handleStartPause}
              title={running ? 'Pausar' : 'Reanudar'}
            >
              {running ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <button style={timerBtn} onClick={handleReset} title="Reiniciar">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
          </div>

          {/* Exit button */}
          <button
            style={exitBtn}
            onClick={onExit}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
          >
            Salir del modo focus
          </button>
        </div>

        {/* ── Center content ── */}
        <div style={contentArea}>
          <div style={centerCard}>
            <div
              style={{
                fontSize: 13,
                color: '#94A3B8',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Pomodoro
            </div>
            <div style={bigTimer}>{formatTime(seconds)}</div>

            {/* Controls */}
            <div style={controlsRow}>
              <button
                style={controlBtn(
                  running ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                  running ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'
                )}
                onClick={handleStartPause}
                title={running ? 'Pausar' : 'Iniciar'}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {running ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <button
                style={controlBtn('rgba(148,163,184,0.1)', 'rgba(148,163,184,0.2)')}
                onClick={handleReset}
                title="Reiniciar"
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
            </div>

            {/* Status label */}
            <div
              style={{
                fontSize: 12,
                color: running ? '#10B981' : '#475569',
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {running ? 'En progreso...' : seconds === 0 ? 'Completado' : 'En pausa'}
            </div>
          </div>
        </div>

        {/* ── Footer stats ── */}
        <div style={footerStyle}>
          <div style={statItem}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{studyMinutes} min estudiando</span>
          </div>
          <div style={statSep} />
          <div style={statItem}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>
              {questions} {questions === 1 ? 'pregunta hecha' : 'preguntas hechas'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Ambient music toggle ── */}
      <button
        style={ambientBtnStyle}
        onClick={() => setAmbient((prev) => !prev)}
        title={ambient ? 'Detener musica ambiental' : 'Musica ambiental'}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.2)')}
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow = ambient ? '0 0 0 4px rgba(79, 70, 229, 0.15)' : 'none')
        }
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
    </>
  );
}
