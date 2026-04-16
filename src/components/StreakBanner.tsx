import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

/* ━━━ StreakBanner ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Compact banner showing current streak + weekly activity strip.
 * Designed to sit at the top of Dashboard or inside the Sidebar.
 * Fetches its own data from /gamification/stats — no props needed.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

const FLAME_ORANGE = '#F59E0B';

/** Returns an array [Mon..Sun] with `true` for each day the user was active
 *  this week, derived from the dailyBreakdown returned by /study-time. */
function buildWeekActivity(dailyBreakdown?: Array<{ seconds?: number }>): boolean[] {
  if (!dailyBreakdown || dailyBreakdown.length === 0) {
    return Array(7).fill(false);
  }
  return DAY_LABELS.map((_, i) => (dailyBreakdown[i]?.seconds || 0) > 0);
}

export default function StreakBanner() {
  const [streakDays, setStreakDays] = useState(0);
  const [weekActivity, setWeekActivity] = useState<boolean[]>(Array(7).fill(false));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.getGamificationStats().catch(() => null),
      api.getStudyTime().catch(() => null),
    ]).then(([stats, studyTime]) => {
      if (cancelled) return;
      if (stats) setStreakDays(stats.streakDays || 0);
      if (studyTime) setWeekActivity(buildWeekActivity(studyTime.dailyBreakdown));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Which day index (0=Mon) is today
  const todayIdx = useMemo(() => (new Date().getDay() + 6) % 7, []);

  if (loading) {
    return (
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 14,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 56,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid var(--border-color)',
            borderTopColor: 'var(--accent)',
            animation: 'streakSpin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando racha...</span>
        <style>{`@keyframes streakSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const hasStreak = streakDays > 0;

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        background: hasStreak
          ? `linear-gradient(135deg, ${FLAME_ORANGE}0D 0%, ${FLAME_ORANGE}05 100%)`
          : 'var(--bg-secondary)',
        border: `1px solid ${hasStreak ? `${FLAME_ORANGE}30` : 'var(--border-color)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Flame icon + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 26,
            lineHeight: 1,
            filter: hasStreak ? 'none' : 'grayscale(1)',
            transition: 'filter 0.3s',
          }}
        >
          {'\uD83D\uDD25'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              lineHeight: 1,
              color: hasStreak ? FLAME_ORANGE : 'var(--text-muted)',
              transition: 'color 0.3s',
            }}
          >
            {streakDays}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              lineHeight: 1.3,
            }}
          >
            {hasStreak
              ? `${streakDays === 1 ? 'dia seguido' : 'dias seguidos'}`
              : '\u00A1Comienza tu racha hoy!'}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Weekly calendar strip */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {DAY_LABELS.map((label, i) => {
          const active = weekActivity[i];
          const isToday = i === todayIdx;
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  background: active
                    ? 'var(--accent)'
                    : isToday
                      ? 'var(--bg-tertiary)'
                      : 'var(--bg-tertiary)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  border: isToday && !active ? '1.5px solid var(--accent)' : 'none',
                  boxShadow: active ? '0 2px 8px var(--accent)33' : 'none',
                }}
              >
                {active ? '\u2713' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
