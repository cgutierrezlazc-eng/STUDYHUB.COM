import React, { useState } from 'react'
import { api } from '../services/api'
import { CheckCircle } from './Icons'

interface Props {
  onBack: () => void
}

export default function ForgotPassword({ onBack }: Props) {
  const [step, setStep] = useState<'email' | 'code' | 'newpass' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return }
    setIsLoading(true)
    setError('')
    try {
      const result = await api.forgotPassword(email)
      if (result.code) setDemoCode(result.code) // MVP demo
      setStep('code')
    } catch (err: any) {
      setError(err.message || 'Error al enviar código')
    }
    setIsLoading(false)
  }

  const handleVerifyAndReset = async () => {
    if (code.length !== 6) { setError('Ingresa el código de 6 dígitos'); return }
    setStep('newpass')
    setError('')
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número'); return }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    setIsLoading(true)
    setError('')
    try {
      await api.resetPassword(email, code, newPassword)
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña')
    }
    setIsLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-right" style={{ margin: '0 auto' }}>
        <div className="auth-card" style={{ maxWidth: 420 }}>
          <h2>Recuperar Contraseña</h2>

          {step === 'email' && (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Ingresa el correo asociado a tu cuenta y te enviaremos un código de verificación.
              </p>
              <div className="auth-field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-primary" onClick={handleSendCode} disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="auth-verification">
                <div className="auth-verification-icon">📧</div>
                <p>Hemos enviado un código de verificación a <strong>{email}</strong></p>
                <div className="auth-field">
                  <label>Código de verificación</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    className="auth-code-input"
                    autoFocus
                  />
                </div>
                {demoCode && (
                  <p className="auth-verification-demo">
                    Demo: Tu código es <strong>{demoCode}</strong>
                  </p>
                )}
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-primary" onClick={handleVerifyAndReset} disabled={code.length !== 6}>
                Verificar Código
              </button>
            </>
          )}

          {step === 'newpass' && (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Elige tu nueva contraseña.
              </p>
              <div className="auth-field">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-primary" onClick={handleResetPassword} disabled={isLoading}>
                {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48 }}>{CheckCircle({ size: 48, color: 'var(--accent-green)' })}</div>
              <h3 style={{ marginTop: 16 }}>Contraseña Actualizada</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.
              </p>
              <button className="btn-auth-primary" onClick={onBack} style={{ marginTop: 20 }}>
                Iniciar Sesión
              </button>
            </div>
          )}

          {step !== 'done' && (
            <p className="auth-switch">
              <button onClick={onBack}>← Volver al inicio de sesión</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
