import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

interface Props {
  type: string // course_completed, level_up, streak, badge, university_change, tutoring_started
  title: string // e.g. "¡Curso completado!"
  description: string // e.g. "Has completado Liderazgo Efectivo con 95%"
  icon: string // emoji
  onClose: () => void
}

type Visibility = 'friends' | 'university' | 'wall' | 'none'

const VISIBILITY_OPTIONS: { key: Visibility; label: string; icon: string }[] = [
  { key: 'friends', label: 'Todos mis amigos', icon: '\u{1F310}' },
  { key: 'university', label: 'Mi universidad', icon: '\u{1F393}' },
  { key: 'wall', label: 'Solo mi muro', icon: '\u{1F512}' },
  { key: 'none', label: 'No compartir', icon: '\u{1F6AB}' },
]

export default function MilestonePopup({ type, title, description, icon, onClose }: Props) {
  const [visibility, setVisibility] = useState<Visibility>('friends')
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  // Close after showing "Compartido" confirmation
  useEffect(() => {
    if (shared) {
      const timer = setTimeout(() => onClose(), 1600)
      return () => clearTimeout(timer)
    }
  }, [shared, onClose])

  const handleShare = async () => {
    if (visibility === 'none') {
      onClose()
      return
    }
    setSharing(true)
    try {
      await api.createMilestonePost({ type, content: description, visibility })
      setShared(true)
    } catch (err) {
      console.error('Failed to share milestone:', err)
      // Still close on error to not block the user
      onClose()
    }
    setSharing(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      animation: 'milestoneOverlayIn 0.3s ease',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400, borderRadius: 16, overflow: 'hidden',
          background: '#151B1E', color: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'milestonePopIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Celebration header */}
        <div style={{
          position: 'relative', padding: '36px 24px 24px', textAlign: 'center',
          background: 'linear-gradient(135deg, #1a2332 0%, #151B1E 100%)',
          overflow: 'hidden',
        }}>
          {/* Confetti particles */}
          <div className="milestone-confetti" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`confetti-piece confetti-${i}`} />
            ))}
          </div>

          <div style={{
            fontSize: 56, marginBottom: 12, position: 'relative',
            animation: 'milestoneBounce 0.6s ease 0.2s both',
          }}>
            {icon}
          </div>
          <h2 style={{
            margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff',
            animation: 'milestoneFadeUp 0.5s ease 0.3s both',
          }}>
            {title}
          </h2>
          <p style={{
            margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
            animation: 'milestoneFadeUp 0.5s ease 0.4s both',
          }}>
            {description}
          </p>
        </div>

        {shared ? (
          <div style={{
            padding: '32px 24px', textAlign: 'center',
            animation: 'milestoneFadeUp 0.3s ease both',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{'\u2705'}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#4ADE80' }}>Compartido</div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>
            {/* Visibility label */}
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
              marginBottom: 10,
            }}>
              Visibilidad
            </div>

            {/* Visibility options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {VISIBILITY_OPTIONS.map(opt => {
                const selected = visibility === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setVisibility(opt.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      border: `1.5px solid ${selected ? '#2D62C8' : 'rgba(255,255,255,0.1)'}`,
                      background: selected ? 'rgba(45,98,200,0.15)' : 'rgba(255,255,255,0.04)',
                      color: '#fff', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{opt.icon}</span>
                    <span style={{ flex: 1, fontWeight: selected ? 600 : 400 }}>{opt.label}</span>
                    {selected && (
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#2D62C8', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff',
                      }}>
                        {'\u2713'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                width: '100%', padding: '12px 20px', borderRadius: 10,
                border: 'none', cursor: sharing ? 'default' : 'pointer',
                background: visibility === 'none' ? 'rgba(255,255,255,0.1)' : '#2D62C8',
                color: '#fff', fontSize: 14, fontWeight: 600,
                opacity: sharing ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {sharing
                ? 'Compartiendo...'
                : visibility === 'none'
                  ? 'Cerrar'
                  : 'Compartir'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes milestoneOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes milestonePopIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes milestoneBounce {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes milestoneFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
        .milestone-confetti {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
        }
        .confetti-piece {
          position: absolute; width: 6px; height: 6px; border-radius: 1px;
          animation: confettiFall 1.8s ease-out forwards;
        }
        .confetti-0 { left: 10%; top: -5%; background: #FFD700; animation-delay: 0.1s; animation-duration: 1.6s; }
        .confetti-1 { left: 25%; top: -5%; background: #2D62C8; animation-delay: 0.3s; animation-duration: 1.9s; border-radius: 50%; }
        .confetti-2 { left: 40%; top: -5%; background: #4ADE80; animation-delay: 0.0s; animation-duration: 1.7s; }
        .confetti-3 { left: 55%; top: -5%; background: #F472B6; animation-delay: 0.4s; animation-duration: 2.0s; border-radius: 50%; }
        .confetti-4 { left: 70%; top: -5%; background: #FFD700; animation-delay: 0.2s; animation-duration: 1.5s; }
        .confetti-5 { left: 85%; top: -5%; background: #A78BFA; animation-delay: 0.5s; animation-duration: 1.8s; border-radius: 50%; }
        .confetti-6 { left: 15%; top: -5%; background: #F472B6; animation-delay: 0.6s; animation-duration: 2.1s; width: 4px; height: 8px; }
        .confetti-7 { left: 35%; top: -5%; background: #2D62C8; animation-delay: 0.2s; animation-duration: 1.4s; width: 4px; height: 8px; }
        .confetti-8 { left: 50%; top: -5%; background: #FFD700; animation-delay: 0.7s; animation-duration: 1.9s; }
        .confetti-9 { left: 65%; top: -5%; background: #4ADE80; animation-delay: 0.1s; animation-duration: 2.0s; width: 4px; height: 8px; }
        .confetti-10 { left: 80%; top: -5%; background: #A78BFA; animation-delay: 0.3s; animation-duration: 1.6s; }
        .confetti-11 { left: 92%; top: -5%; background: #2D62C8; animation-delay: 0.5s; animation-duration: 1.7s; border-radius: 50%; }
      `}</style>
    </div>
  )
}
