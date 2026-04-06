import React, { useState } from 'react'
import { useAuth } from '../services/auth'
import { useI18n, LANGUAGES } from '../services/i18n'

interface Props {
  onSwitchToRegister: () => void
  onForgotPassword?: () => void
  onBack?: () => void
}

export default function Login({ onSwitchToRegister, onForgotPassword, onBack }: Props) {
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {onBack && (
        <button onClick={onBack} style={{ position: 'fixed', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
          ← Volver
        </button>
      )}
      {/* Language dropdown — top right */}
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <select value={lang} onChange={e => setLang(e.target.value as any)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          {LANGUAGES.slice(0, 10).map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
      </div>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: '#2D62C8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 40 40" width={24} height={24}><circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" transform="rotate(-45, 20, 20)" /></svg>
        </div>
        <span style={{ fontFamily: "'Outfit', -apple-system, sans-serif", fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          conni<span style={{ color: '#2D62C8' }}>ku</span>
        </span>
      </div>

      {/* Form Card */}
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-subtle)', padding: 32 }}>
        <button className="btn-google" onClick={async () => { setIsLoading(true); await loginWithGoogle(); setIsLoading(false) }} disabled={isLoading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t('auth.google')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>{t('auth.orEmail')}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{t('auth.email')}</label>
            <input type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{t('auth.password')}</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                style={{ width: '100%', padding: '10px 12px', paddingRight: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          {error && <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', color: 'var(--accent-red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={isLoading}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {isLoading ? t('auth.logging') : t('auth.loginBtn')}
          </button>
        </form>

        {onForgotPassword && (
          <button onClick={onForgotPassword} style={{ display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, marginTop: 12 }}>
            ¿Olvidaste tu contraseña?
          </button>
        )}
      </div>

      {/* Register CTA */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{t('auth.noAccount')}</p>
        <button onClick={onSwitchToRegister}
          style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {t('auth.createFree')}
        </button>
      </div>

      {/* Universities */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Estudiantes de</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          UNAB · USS · UCN · UDP · PUC · USACH · U. de Chile · UDD · UAI · UST
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Hecho en Chile 🇨🇱</span>
        <span>Términos</span>
        <span>Privacidad</span>
        <span>Contacto</span>
      </div>
    </div>
  )
}
