import React, { useState } from 'react'
import { api } from '../services/api'
import { BookOpen, MessageSquare, Target, Smile, Briefcase, Users, Sparkles, Home } from './Icons'

interface Props {
  onComplete: () => void
}

const STEPS = [
  {
    icon: Smile({ size: 36 }),
    color: '#f59e0b',
    title: 'Bienvenido a Conniku',
    desc: 'Tu plataforma todo-en-uno para la vida universitaria. Vamos a hacer un recorrido rapido para que saques el maximo provecho.',
  },
  {
    icon: Home({ size: 36 }),
    color: '#2563eb',
    title: 'Tu Dashboard',
    desc: 'En el inicio veras tu resumen diario con IA, actividad reciente, estadisticas de estudio y accesos rapidos a todo.',
  },
  {
    icon: BookOpen({ size: 36 }),
    color: '#16a34a',
    title: 'Asignaturas y Estudio',
    desc: 'Crea tus asignaturas, genera guias con IA, usa flashcards y quizzes adaptativos. Toda tu herramienta de estudio en un lugar.',
  },
  {
    icon: Users({ size: 36 }),
    color: '#8b5cf6',
    title: 'Comunidades',
    desc: 'Unete a comunidades por carrera, materia o interes. Comparte apuntes, haz preguntas y conecta con otros estudiantes.',
  },
  {
    icon: MessageSquare({ size: 36 }),
    color: '#06b6d4',
    title: 'Mensajeria y Study Buddy',
    desc: 'Chat en tiempo real con tus companeros. Ademas, el Study Buddy con IA te ayuda a resolver dudas en cualquier momento.',
  },
  {
    icon: Briefcase({ size: 36 }),
    color: '#ea580c',
    title: 'Empleo y CV Coach',
    desc: 'Explora practicas, postula a empleos, y usa el CV Coach con IA para mejorar tu curriculum profesional.',
  },
  {
    icon: Sparkles({ size: 36 }),
    color: '#2563eb',
    title: 'Listo para empezar',
    desc: 'Explora, aprende y crece con Conniku. Puedes volver a ver este tour desde tu perfil cuando quieras.',
  },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)

  const handleComplete = async () => {
    try { await api.completeOnboarding() } catch {}
    onComplete()
  }

  const current = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        {/* Progress bar */}
        <div style={{ width: '100%', height: 4, background: 'var(--bg-hover)', borderRadius: 2, marginBottom: 24 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: current.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>

        <div className="onb-step-counter" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          {step + 1} de {STEPS.length}
        </div>

        <div className="onb-icon" style={{ color: current.color }}>{current.icon}</div>
        <h2>{current.title}</h2>
        <p>{current.desc}</p>

        <div className="onb-actions">
          {step > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => s - 1)}>
              Atras
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-sm btn-glow" onClick={() => setStep(s => s + 1)}>
              Siguiente
            </button>
          ) : (
            <button className="btn btn-primary btn-sm btn-glow" onClick={handleComplete}>
              Comenzar
            </button>
          )}
        </div>

        <button className="onb-skip" onClick={handleComplete}>Saltar tour</button>
      </div>
    </div>
  )
}
