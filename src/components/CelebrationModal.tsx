import React, { useEffect, useRef } from 'react';

/* ━━━ CelebrationModal ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Full-screen modal that celebrates streak milestones (7, 14, 30, 60, 100).
 * - CSS-only confetti (no external libs)
 * - Slide-up + scale entrance animation
 * - "Compartir en mi perfil" + "Cerrar" buttons
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface Props {
  milestoneDays: number;
  onClose: () => void;
  onShare?: () => void;
}

/* ─── Milestone metadata ──────────────────────────────────────────── */
interface MilestoneMeta {
  emoji: string;
  title: string;
  percentile: string;
  xpBonus: number;
  gradient: string;
}

function getMilestoneMeta(days: number): MilestoneMeta {
  if (days >= 100) {
    return {
      emoji: '\uD83D\uDC8E',
      title: '\u00A1Racha legendaria!',
      percentile: '1%',
      xpBonus: 500,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)',
    };
  }
  if (days >= 60) {
    return {
      emoji: '\u2B50',
      title: '\u00A1Racha epica!',
      percentile: '3%',
      xpBonus: 300,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    };
  }
  if (days >= 30) {
    return {
      emoji: '\uD83D\uDC8E',
      title: '\u00A1Un mes completo!',
      percentile: '5%',
      xpBonus: 200,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    };
  }
  if (days >= 14) {
    return {
      emoji: '\uD83C\uDF1F',
      title: '\u00A1Dos semanas!',
      percentile: '12%',
      xpBonus: 100,
      gradient: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
    };
  }
  // 7 days
  return {
    emoji: '\uD83D\uDD25',
    title: '\u00A1Primera semana!',
    percentile: '25%',
    xpBonus: 50,
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  };
}

/* ─── Confetti colors ─────────────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ADE80',
  '#60A5FA',
  '#A78BFA',
  '#F472B6',
  '#34D399',
  '#FBBF24',
  '#F87171',
  '#818CF8',
  '#FB923C',
  '#2DD4BF',
];

const CONFETTI_COUNT = 40;

/** Generate deterministic confetti pieces */
function buildConfettiCSS(): string {
  const pieces: string[] = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = ((i * 2.5 + (i % 7) * 3.7) % 100).toFixed(1);
    const delay = ((i * 0.07) % 1.5).toFixed(2);
    const duration = (1.6 + (i % 5) * 0.3).toFixed(1);
    const rotate = (i * 37) % 360;
    const w = i % 3 === 0 ? 4 : 6;
    const h = i % 3 === 0 ? 8 : 6;
    const radius = i % 2 === 0 ? '1px' : '50%';
    pieces.push(
      `.cel-conf-${i}{left:${left}%;top:-8%;width:${w}px;height:${h}px;` +
        `background:${color};border-radius:${radius};` +
        `animation-delay:${delay}s;animation-duration:${duration}s;` +
        `--cel-rot:${rotate}deg;}`
    );
  }
  return pieces.join('\n');
}

export default function CelebrationModal({ milestoneDays, onClose, onShare }: Props) {
  const meta = getMilestoneMeta(milestoneDays);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        animation: 'celOverlayIn 0.35s ease',
        padding: 16,
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#131820',
          color: '#fff',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          animation: 'celCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* ── Header with gradient + confetti ──────────────────── */}
        <div
          style={{
            position: 'relative',
            padding: '44px 24px 32px',
            textAlign: 'center',
            background: meta.gradient,
            overflow: 'hidden',
          }}
        >
          {/* CSS confetti */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
            aria-hidden="true"
          >
            {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
              <span key={i} className={`cel-conf cel-conf-${i}`} />
            ))}
          </div>

          {/* Emoji */}
          <div
            style={{
              fontSize: 64,
              lineHeight: 1,
              marginBottom: 14,
              position: 'relative',
              animation: 'celEmojiBounce 0.7s ease 0.2s both',
            }}
          >
            {meta.emoji}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: '#fff',
              position: 'relative',
              animation: 'celFadeUp 0.5s ease 0.3s both',
              textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
          >
            {'\uD83C\uDF89'} {'\u00A1'}Racha de {milestoneDays} d{'\u00ED'}as!
          </h2>

          {/* Subtitle */}
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 14,
              color: 'rgba(255,255,255,0.85)',
              position: 'relative',
              animation: 'celFadeUp 0.5s ease 0.4s both',
              lineHeight: 1.5,
            }}
          >
            {meta.title}
          </p>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div style={{ padding: '24px 24px 28px' }}>
          {/* Percentile comparison */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 16,
              animation: 'celFadeUp 0.5s ease 0.5s both',
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{'\uD83C\uDFC6'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                Eres m{'\u00E1'}s constante que el {meta.percentile} de los estudiantes
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {'\u00A1'}Sigue as{'\u00ED'}!
              </div>
            </div>
          </div>

          {/* XP badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 24,
              animation: 'celFadeUp 0.5s ease 0.6s both',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 100,
                background: 'linear-gradient(135deg, #F59E0B22, #F59E0B11)',
                border: '1px solid #F59E0B44',
              }}
            >
              <span style={{ fontSize: 20 }}>{'\u26A1'}</span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#F59E0B',
                }}
              >
                +{meta.xpBonus} XP
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>ganados</span>
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              animation: 'celFadeUp 0.5s ease 0.7s both',
            }}
          >
            {onShare && (
              <button
                onClick={onShare}
                style={{
                  flex: 1,
                  padding: '13px 16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--accent, #2D62C8)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(45,98,200,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = 'none';
                }}
              >
                Compartir en mi perfil
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                flex: onShare ? 0 : 1,
                minWidth: onShare ? 100 : undefined,
                padding: '13px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 14,
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* ── Animations (CSS-only) ──────────────────────────────── */}
      <style>{`
        /* Overlay */
        @keyframes celOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        /* Card slide-up + scale */
        @keyframes celCardIn {
          from { opacity: 0; transform: translateY(40px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Emoji bounce */
        @keyframes celEmojiBounce {
          0%   { opacity: 0; transform: scale(0.2); }
          50%  { transform: scale(1.2); }
          70%  { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        /* Content fade-up */
        @keyframes celFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Confetti fall */
        @keyframes celConfettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateY(220px) rotate(var(--cel-rot, 360deg)); opacity: 0; }
        }
        .cel-conf {
          position: absolute;
          animation-name: celConfettiFall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        ${buildConfettiCSS()}
      `}</style>
    </div>
  );
}
