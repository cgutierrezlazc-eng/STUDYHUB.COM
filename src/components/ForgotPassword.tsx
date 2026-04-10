import React, { useState } from 'react'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { CheckCircle } from './Icons'

interface Props {
  onBack: () => void
}

export default function ForgotPassword({ onBack }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState<'email' | 'code' | 'newpass' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    if (!email.trim()) { setError(t('forgot.errEmail')); return }
    setIsLoading(true)
    setError('')
    try {
      const result = await api.forgotPassword(email)
      if (result.code) setDemoCode(result.code) // MVP demo
      setStep('code')
    } catch (err: any) {
      setError(err.message || t('forgot.errSend'))
    }
    setIsLoading(false)
  }

  const handleVerifyAndReset = async () => {
    if (code.length !== 6) { setError(t('forgot.errCode')); return }
    setStep('newpass')
    setError('')
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 8) { setError(t('forgot.errNewPwd')); return }
    if (newPassword !== confirmPassword) { setError(t('forgot.errMismatch')); return }
    setIsLoading(true)
    setError('')
    try {
      await api.resetPassword(email, code, newPassword)
      setStep('done')
    } catch (err: any) {
      setError(err.message || t('forgot.errReset'))
    }
    setIsLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-right" style={{ margin: '0 auto' }}>
        <div className="auth-card" style={{ maxWidth: 420 }}>
          <h2>{t('forgot.title')}</h2>

          {step === 'email' && (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                {t('forgot.instructions')}
              </p>
              <div className="auth-field">
                <label>{t('forgot.emailLabel')}</label>
                <input
                  type="email"
                  placeholder={t('forgot.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-primary" onClick={handleSendCode} disabled={isLoading}>
                {isLoading ? t('forgot.sending') : t('forgot.sendCode')}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="auth-verification">
                <div className="auth-verification-icon">📧</div>
                <p>{t('forgot.codeSent')} <strong>{email}</strong></p>
                <div className="auth-field">
                  <label>{t('forgot.codeLabel')}</label>
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
                {import.meta.env.DEV && demoCode && (
                  <p className="auth-verification-demo">
                    {t('forgot.demoCode')} <strong>{demoCode}</strong>
                  </p>
                )}
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-primary" onClick={handleVerifyAndReset} disabled={code.length !== 6}>
                {t('forgot.verifyCode')}
              </button>
            </>
          )}

          {step === 'newpass' && (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                {t('forgot.newPassInstructions')}
              </p>
              <div className="auth-field">
                <label>{t('forgot.newPassLabel')}</label>
                <input
                  type="password"
                  placeholder={t('forgot.newPassPlaceholder')}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label>{t('forgot.confirmLabel')}</label>
                <input
                  type="password"
                  placeholder={t('forgot.confirmPlaceholder')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-primary" onClick={handleResetPassword} disabled={isLoading}>
                {isLoading ? t('forgot.changing') : t('forgot.changePassword')}
              </button>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48 }}>{CheckCircle({ size: 48, color: 'var(--accent-green)' })}</div>
              <h3 style={{ marginTop: 16 }}>{t('forgot.doneTitle')}</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                {t('forgot.doneMessage')}
              </p>
              <button className="btn-auth-primary" onClick={onBack} style={{ marginTop: 20 }}>
                {t('forgot.loginBtn')}
              </button>
            </div>
          )}

          {step !== 'done' && (
            <p className="auth-switch">
              <button onClick={onBack}>{t('forgot.backToLogin')}</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
