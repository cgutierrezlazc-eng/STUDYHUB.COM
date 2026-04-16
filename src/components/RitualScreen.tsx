import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import {
  Sun,
  CloudSun,
  Moon,
  Flame,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Sparkles,
  BookOpen,
  Brain,
  Lightbulb,
  Target,
  GraduationCap,
} from './Icons';

// ── Types ───────────────────────────────────────────────────
interface Props {
  onNavigate: (path: string) => void;
}

interface PendingItem {
  id: string;
  title: string;
  time: string;
  type: 'deadline' | 'study' | 'event';
  urgent: boolean;
  done: boolean;
}

// ── Constants ───────────────────────────────────────────────

const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const MOTIVATIONAL_QUOTES = [
  {
    text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
    author: 'Robert Collier',
  },
  {
    text: 'No tienes que ser grande para empezar, pero tienes que empezar para ser grande.',
    author: 'Zig Ziglar',
  },
  {
    text: 'La disciplina es el puente entre las metas y los logros.',
    author: 'Jim Rohn',
  },
  {
    text: 'Cada experto fue alguna vez un principiante.',
    author: 'Helen Hayes',
  },
  {
    text: 'Estudiar no es un acto de consumir ideas, sino de crearlas y recrearlas.',
    author: 'Paulo Freire',
  },
  {
    text: 'La persistencia es el camino del éxito.',
    author: 'Charles Chaplin',
  },
  {
    text: 'Lo que sabemos es una gota, lo que ignoramos es un océano.',
    author: 'Isaac Newton',
  },
  {
    text: 'El conocimiento no tiene valor si no se pone en práctica.',
    author: 'Antón Chéjov',
  },
];

const PLACEHOLDER_PENDING: PendingItem[] = [
  {
    id: 'ph-1',
    title: 'Entregar informe de Cálculo II',
    time: '23:59',
    type: 'deadline',
    urgent: true,
    done: false,
  },
  {
    id: 'ph-2',
    title: 'Repasar capítulo 5 — Física',
    time: '18:00',
    type: 'study',
    urgent: false,
    done: false,
  },
  {
    id: 'ph-3',
    title: 'Reunión grupo Proyecto Final',
    time: '15:30',
    type: 'event',
    urgent: false,
    done: false,
  },
];

// ── Helpers ─────────────────────────────────────────────────

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h < 12)
    return {
      text: 'Buenos días',
      icon: Sun({ size: 24, color: '#f59e0b' }),
    };
  if (h < 18)
    return {
      text: 'Buenas tardes',
      icon: CloudSun({ size: 24, color: '#f59e0b' }),
    };
  return {
    text: 'Buenas noches',
    icon: Moon({ size: 24, color: '#6366f1' }),
  };
}

function formatTodayDate(): string {
  const now = new Date();
  const day = DAY_NAMES_FULL[now.getDay()];
  const date = now.getDate();
  const month = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();
  return `${day}, ${date} de ${month} de ${year}`;
}

function getRandomQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'deadline':
      return Target({ size: 16, color: '#ef4444' });
    case 'study':
      return BookOpen({ size: 16, color: '#3b82f6' });
    case 'event':
      return Calendar({ size: 16, color: '#10b981' });
    default:
      return Clock({ size: 16, color: 'var(--text-muted)' });
  }
}

// ── Keyframe injection (once) ───────────────────────────────
let stylesInjected = false;
function injectAnimations() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ritualFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Component ───────────────────────────────────────────────

export default function RitualScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [streakDays, setStreakDays] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loadedFromApi, setLoadedFromApi] = useState(false);

  const greeting = useMemo(() => getGreeting(), []);
  const todayStr = useMemo(() => formatTodayDate(), []);
  const quote = useMemo(() => getRandomQuote(), []);

  // Inject CSS animations on mount
  useEffect(() => {
    injectAnimations();
  }, []);

  // Fetch streak from gamification stats
  useEffect(() => {
    api
      .getGamificationStats()
      .then((data: any) => {
        setStreakDays(data?.streakDays ?? data?.streak_days ?? 0);
      })
      .catch(() => {});
  }, []);

  // Fetch calendar events for today's pending section
  useEffect(() => {
    const todayISO = new Date().toISOString().split('T')[0];

    api
      .getCalendarEvents()
      .then((data: any) => {
        const events = Array.isArray(data) ? data : [];
        const todayEvents: PendingItem[] = events
          .filter((ev: any) => {
            const evDate = ev.dueDate || ev.date || ev.due_date || '';
            return evDate.startsWith(todayISO);
          })
          .slice(0, 5)
          .map((ev: any, i: number) => ({
            id: ev.id || `ev-${i}`,
            title: ev.title || 'Sin título',
            time: ev.time || ev.dueDate?.slice(11, 16) || '',
            type: (ev.type as PendingItem['type']) || 'event',
            urgent:
              ev.type === 'deadline' || (ev.dueDate || ev.date || ev.due_date || '') === todayISO,
            done: false,
          }));

        if (todayEvents.length > 0) {
          setPendingItems(todayEvents);
        } else {
          setPendingItems(PLACEHOLDER_PENDING);
        }
        setLoadedFromApi(true);
      })
      .catch(() => {
        setPendingItems(PLACEHOLDER_PENDING);
        setLoadedFromApi(true);
      });
  }, []);

  const toggleDone = (id: string) => {
    setPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = pendingItems.filter((i) => i.done).length;

  // ── Styles ──────────────────────────────────────────────
  const animDelay = (i: number) =>
    ({
      animation: `ritualFadeInUp 0.5s ease-out ${i * 0.1}s both`,
    }) as React.CSSProperties;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 720,
        margin: '0 auto',
        padding: '0 4px',
      }}
    >
      {/* ── Greeting Header ── */}
      <div style={{ ...animDelay(0) }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4,
          }}
        >
          {greeting.icon}
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {greeting.text}, {user?.firstName || 'estudiante'} 👋
          </h2>
        </div>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 14,
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {todayStr}
        </p>
      </div>

      {/* ── Streak Badge ── */}
      <div style={{ ...animDelay(1) }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background:
              streakDays > 0
                ? 'linear-gradient(135deg, #ff6b3518, #ff9a5618)'
                : 'var(--bg-secondary)',
            border: `2px solid ${streakDays > 0 ? '#ff6b35' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '10px 18px',
            transition: 'all 0.3s ease',
          }}
        >
          {Flame({
            size: 22,
            color: streakDays > 0 ? '#ff6b35' : 'var(--text-muted)',
          })}
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: streakDays > 0 ? '#ff6b35' : 'var(--text-muted)',
            }}
          >
            🔥 {streakDays} {streakDays === 1 ? 'día seguido' : 'días seguidos'}
          </span>
        </div>
      </div>

      {/* ── Pendiente hoy ── */}
      <div style={{ ...animDelay(2) }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Section header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px 12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-primary)',
              }}
            >
              {Calendar({ size: 16 })} Pendiente hoy
            </h3>
            <span
              style={{
                fontSize: 12,
                color:
                  completedCount === pendingItems.length && pendingItems.length > 0
                    ? 'var(--accent-green)'
                    : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {completedCount}/{pendingItems.length}{' '}
              {completedCount === pendingItems.length && pendingItems.length > 0 ? '✓' : ''}
            </span>
          </div>

          {/* Items */}
          {pendingItems.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderBottom: i < pendingItems.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: item.done ? 0.5 : 1,
                transition: 'opacity 0.25s ease',
                animation: `ritualFadeInUp 0.4s ease-out ${0.3 + i * 0.08}s both`,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleDone(item.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: item.done ? '2px solid var(--accent-green)' : '2px solid var(--border)',
                  background: item.done ? 'var(--accent-green)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                aria-label={item.done ? 'Marcar como pendiente' : 'Marcar como completado'}
              >
                {item.done && CheckCircle({ size: 14, color: '#fff' })}
              </button>

              {/* Icon */}
              <div style={{ flexShrink: 0 }}>{getTypeIcon(item.type)}</div>

              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: item.done ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </div>
              </div>

              {/* Time + urgency */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {item.time && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {item.time}
                  </span>
                )}
                {item.urgent && !item.done && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      background: '#ef4444',
                      borderRadius: 6,
                      padding: '2px 8px',
                      lineHeight: 1.4,
                    }}
                  >
                    Hoy
                  </span>
                )}
              </div>
            </div>
          ))}

          {!loadedFromApi && pendingItems.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              Cargando...
            </div>
          )}

          {/* View calendar link */}
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => onNavigate('/calendar')}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 13,
                color: 'var(--accent)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
              }}
            >
              Ver calendario completo {ChevronRight({ size: 14 })}
            </button>
          </div>
        </div>
      </div>

      {/* ── Recomendado por Konni ── */}
      <div style={{ ...animDelay(3) }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-primary)',
          }}
        >
          {Sparkles({ size: 16, color: 'var(--accent)' })} Recomendado por Konni
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {/* Suggestion 1 — Exam prep */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent)',
              borderRadius: 14,
              padding: 18,
              animation: `ritualFadeInUp 0.5s ease-out 0.4s both`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(37, 99, 235, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {GraduationCap({ size: 18, color: 'var(--accent)' })}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  Tienes examen pronto
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  ¿Quieres un plan de estudio personalizado?
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/dashboard')}
              style={{
                width: '100%',
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {Brain({ size: 14 })} Crear plan de estudio
            </button>
          </div>

          {/* Suggestion 2 — Performance up */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent-green)',
              borderRadius: 14,
              padding: 18,
              animation: `ritualFadeInUp 0.5s ease-out 0.5s both`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(5, 150, 105, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {Lightbulb({ size: 18, color: 'var(--accent-green)' })}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  Tu rendimiento subió esta semana 🎉
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  Revisa tus estadísticas y mantén el impulso
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/dashboard')}
              style={{
                width: '100%',
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent-green)',
                background: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid var(--accent-green)',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Ver mis estadísticas {ChevronRight({ size: 14 })}
            </button>
          </div>
        </div>
      </div>

      {/* ── Motivational Quote ── */}
      <div style={{ ...animDelay(4) }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '4px solid var(--accent)',
            borderRadius: 14,
            padding: '18px 22px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              fontSize: 42,
              lineHeight: 1,
              color: 'var(--accent)',
              opacity: 0.18,
              fontFamily: 'Georgia, serif',
              flexShrink: 0,
              marginTop: -8,
              userSelect: 'none',
            }}
          >
            "
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                fontStyle: 'italic',
              }}
            >
              {quote.text}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              — {quote.author}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
