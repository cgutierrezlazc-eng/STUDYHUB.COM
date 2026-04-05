import React, { useState } from 'react'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { BookOpen, MessageSquare, Target, Smile } from './Icons'

interface Props {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: Smile({ size: 32 }),
      title: t('onb.welcomeTitle'),
      desc: t('onb.welcomeDesc'),
    },
    {
      icon: BookOpen({ size: 32 }),
      title: t('onb.subjectsTitle'),
      desc: t('onb.subjectsDesc'),
    },
    {
      icon: BookOpen({ size: 32 }),
      title: t('onb.studyTitle'),
      desc: t('onb.studyDesc'),
    },
    {
      icon: MessageSquare({ size: 32 }),
      title: t('onb.chatTitle'),
      desc: t('onb.chatDesc'),
    },
    {
      icon: Target({ size: 32 }),
      title: t('onb.readyTitle'),
      desc: t('onb.readyDesc'),
    },
  ]

  const handleComplete = async () => {
    try { await api.completeOnboarding() } catch {}
    onComplete()
  }

  const current = steps[step]

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        <div className="onb-progress">
          {steps.map((_, i) => (
            <div key={i} className={`onb-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="onb-icon">{current.icon}</div>
        <h2>{current.title}</h2>
        <p>{current.desc}</p>

        <div className="onb-actions">
          {step > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => s - 1)}>
              {t('auth.back')}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)}>
              {t('auth.next')}
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleComplete}>
              {t('onb.start')}
            </button>
          )}
        </div>

        <button className="onb-skip" onClick={handleComplete}>{t('onb.skip')}</button>
      </div>
    </div>
  )
}
