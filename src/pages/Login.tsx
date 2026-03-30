import React, { useState } from 'react'
import { useAuth } from '../services/auth'
import { useI18n, LANGUAGES } from '../services/i18n'

interface Props {
  onSwitchToRegister: () => void
  onForgotPassword?: () => void
}

export default function Login({ onSwitchToRegister, onForgotPassword }: Props) {
  const { login, loginWithGoogle } = useAuth()
  const { t, lang, setLang } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError(t('err.fillAll')); return }
    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)
    if (!result.success) setError(result.error || t('err.loginError'))
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    await loginWithGoogle()
    setIsLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo-row"><div className="auth-logo-mark">S</div><h1 className="auth-brand-name"><span>Study</span>Hub</h1></div>
          <p className="auth-tagline">{t('welcome.subtitle')}</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><span className="auth-feature-icon">📄</span><div><strong>{t('feat.docs')}</strong><p>{t('feat.docsDesc')}</p></div></div>
          <div className="auth-feature"><span className="auth-feature-icon">🧠</span><div><strong>{t('feat.smart')}</strong><p>{t('feat.smartDesc')}</p></div></div>
          <div className="auth-feature"><span className="auth-feature-icon">👥</span><div><strong>{t('feat.community')}</strong><p>{t('feat.communityDesc')}</p></div></div>
          <div className="auth-feature"><span className="auth-feature-icon">📖</span><div><strong>{t('feat.guides')}</strong><p>{t('feat.guidesDesc')}</p></div></div>
        </div>
        <div className="auth-trusted">
          <p className="auth-trusted-text">Creado por un estudiante, para estudiantes</p>
          <p className="auth-trusted-subtitle">Nació de mis propias necesidades académicas. Al ver que funcionaba, decidí compartirlo con el mundo.</p>
          <div className="auth-trusted-logos">
            <span className="auth-trusted-logo">UNAM</span>
            <span className="auth-trusted-logo">TEC</span>
            <span className="auth-trusted-logo">UBA</span>
            <span className="auth-trusted-logo">UDP</span>
            <span className="auth-trusted-logo">+más</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
          <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 11, border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: 16 }}>▶</span>
            <div style={{ textAlign: 'left' }}><small style={{ fontSize: 9, opacity: 0.7 }}>GET IT ON</small><div style={{ fontWeight: 600, fontSize: 12 }}>Google Play</div></div>
          </a>
          <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 11, border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: 16 }}></span>
            <div style={{ textAlign: 'left' }}><small style={{ fontSize: 9, opacity: 0.7 }}>Download on</small><div style={{ fontWeight: 600, fontSize: 12 }}>App Store</div></div>
          </a>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {/* Language selector */}
          <div className="auth-lang-row">
            {LANGUAGES.map(l => (
              <button key={l.code} className={`auth-lang-btn ${lang === l.code ? 'active' : ''}`} onClick={() => setLang(l.code)} type="button">
                {l.flag} {l.name}
              </button>
            ))}
          </div>

          <h2>{t('auth.login')}</h2>
          <p className="auth-subtitle">{t('auth.loginWelcome')}</p>

          <button className="btn-google" onClick={handleGoogle} disabled={isLoading}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.google')}
          </button>

          <div className="auth-divider"><span>{t('auth.orEmail')}</span></div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">{t('auth.email')}</label>
              <input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </div>
            <div className="auth-field">
              <label htmlFor="password">{t('auth.password')}</label>
              <div className="auth-password-wrap">
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>{showPassword ? '🙈' : '👁'}</button>
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn-auth-primary" disabled={isLoading}>{isLoading ? t('auth.logging') : t('auth.loginBtn')}</button>
          </form>

          {onForgotPassword && (
            <p className="auth-switch" style={{ marginBottom: 8 }}>
              <button onClick={onForgotPassword}>¿Olvidaste tu contraseña?</button>
            </p>
          )}
          <button className="btn-auth-register" onClick={onSwitchToRegister}>
            {t('auth.createFree')}
          </button>
          <p className="auth-switch">{t('auth.noAccount')}</p>
        </div>
      </div>
    </div>
  )
}
