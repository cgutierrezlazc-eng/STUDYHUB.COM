import React, { useState } from 'react'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { BookOpen, MessageSquare, Target, Smile, Briefcase, Users, Sparkles, Home } from './Icons'

interface Props {
  onComplete: () => void
  onNavigate?: (path: string) => void
}

const STEP_CONFIG = [
  { icon: Smile({ size: 36 }), color: '#f59e0b', titleKey: 'onb.welcomeTitle', descKey: 'onb.welcomeDesc' },
  { icon: Home({ size: 36 }), color: '#2563eb', titleKey: 'onb.dashboardTitle', descKey: 'onb.dashboardDesc' },
  { icon: BookOpen({ size: 36 }), color: '#16a34a', titleKey: 'onb.subjectsTitle', descKey: 'onb.subjectsDesc' },
  { icon: Users({ size: 36 }), color: '#8b5cf6', titleKey: 'onb.communitiesTitle', descKey: 'onb.communitiesDesc' },
  { icon: MessageSquare({ size: 36 }), color: '#06b6d4', titleKey: 'onb.messagingTitle', descKey: 'onb.messagingDesc' },
  { icon: Briefcase({ size: 36 }), color: '#ea580c', titleKey: 'onb.jobsTitle', descKey: 'onb.jobsDesc' },
  { icon: Sparkles({ size: 36 }), color: '#2563eb', titleKey: 'onb.readyTitle', descKey: 'onb.readyDesc' },
]

export default function Onboarding({ onComplete, onNavigate }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)

  const handleComplete = async (navigateTo?: string) => {
    try { await api.completeOnboarding() } catch {}
    onComplete()
    if (navigateTo && onNavigate) onNavigate(navigateTo)
  }

  const current = STEP_CONFIG[step]
  const progress = ((step + 1) / STEP_CONFIG.length) * 100

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        {/* Progress bar */}
        <div style={{ width: '100%', height: 4, background: 'var(--bg-hover)', borderRadius: 2, marginBottom: 24 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: current.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>

        <div className="onb-step-counter" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          {step + 1} {t('onb.stepOf')} {STEP_CONFIG.length}
        </div>

        <div className="onb-icon" style={{ color: current.color }}>{current.icon}</div>
        <h2>{t(current.titleKey)}</h2>
        <p>{t(current.descKey)}</p>

        <div className="onb-actions">
          {step > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => s - 1)}>
              {t('onb.back')}
            </button>
          )}
          {step < STEP_CONFIG.length - 1 ? (
            <button className="btn btn-primary btn-sm btn-glow" onClick={() => setStep(s => s + 1)}>
              {t('onb.next')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <button className="btn btn-primary btn-sm btn-glow" onClick={() => handleComplete('/dashboard')}>
                Crear mi primera asignatura
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleComplete()}>
                {t('onb.start')}
              </button>
            </div>
          )}
        </div>

        <button className="onb-skip" onClick={() => handleComplete()}>{t('onb.skipTour')}</button>
      </div>
    </div>
  )
}
