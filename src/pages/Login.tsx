import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { useI18n } from '../services/i18n';
import lgStyles from './Login.module.css';

interface Props {
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
}

export default function Login({ onSwitchToRegister, onForgotPassword, onBack }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError(t('err.fillAll'));
      return;
    }
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) setError(result.error || t('err.loginError'));
  };

  return (
    <div className={lgStyles.authRoot}>
      {/* ── Left panel: branding editorial ── */}
      <div className={lgStyles.leftPanel}>
        {onBack && (
          <button onClick={onBack} className={lgStyles.backHome} type="button">
            <span className={lgStyles.bhArrow}>←</span>
            Volver al inicio
          </button>
        )}

        <div className={lgStyles.topMeta}>
          <a className={lgStyles.brand} href="#" onClick={(e) => e.preventDefault()}>
            conn<span>i</span>k
            <span className={lgStyles.uPack}>
              u<span className={lgStyles.brandDot}>.</span>
            </span>
          </a>
          <div className={lgStyles.liveChip}>
            <span className={lgStyles.liveChipDot} />
            En vivo
          </div>
        </div>

        <div className={lgStyles.heroBrand}>
          <h1 className={lgStyles.heroH1}>
            Tu <span className={lgStyles.chipAccent}>universidad</span>
            <br />
            <span className={lgStyles.outline}>entera</span>
            <span className={lgStyles.dotFinal}>.</span>
          </h1>
          <p className={lgStyles.heroLead}>
            Sincroniza tu U. Workspaces colaborativos con Athena. Tutorías validadas.{' '}
            <strong>Todo en un solo lugar.</strong>
          </p>
        </div>

        <div className={lgStyles.footerLinks}>
          <a href="/terms">Términos</a>
          <a href="/privacy">Privacidad</a>
          <a href="/cookies">Cookies</a>
          <a href="mailto:contacto@conniku.com">Contacto</a>
          <span className={lgStyles.mini}>Hecho en Chile · 2026</span>
        </div>
      </div>

      {/* ── Right panel: form card flotante ── */}
      <div className={lgStyles.rightPanel}>
        <div className={lgStyles.formCard}>
          <div className={lgStyles.tabSwitch} role="tablist">
            <button
              type="button"
              className={`${lgStyles.tabBtn} ${lgStyles.active}`}
              aria-selected="true"
            >
              Entrar
            </button>
            <button
              type="button"
              className={lgStyles.tabBtn}
              onClick={onSwitchToRegister}
              aria-selected="false"
            >
              Crear cuenta
            </button>
          </div>

          <h2 className={lgStyles.cardTitle}>Bienvenido de vuelta</h2>
          <p className={lgStyles.cardSub}>Ingresa con tu email o Google</p>

          <button
            onClick={async () => {
              setIsLoading(true);
              await loginWithGoogle();
              setIsLoading(false);
            }}
            disabled={isLoading}
            className={lgStyles.googleBtn}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

          <div className={lgStyles.divider}>
            <span>o con email</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={lgStyles.field}>
              <label className={lgStyles.label}>Email</label>
              <input
                className={lgStyles.input}
                type="email"
                placeholder="tu@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className={lgStyles.field}>
              <label className={lgStyles.label}>Contraseña</label>
              <div className={lgStyles.passwordWrap}>
                <input
                  className={lgStyles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={lgStyles.pwToggle}
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <div className={lgStyles.errorBox}>{error}</div>}

            <button type="submit" disabled={isLoading} className={lgStyles.submitBtn}>
              {isLoading ? 'Entrando…' : 'Entrar'}
              {!isLoading && <span className={lgStyles.ring}>→</span>}
            </button>
          </form>

          {onForgotPassword && (
            <button onClick={onForgotPassword} className={lgStyles.linkBtn} type="button">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <div className={lgStyles.helperText}>+18 años · Sin tarjeta · Gratis para empezar</div>
        </div>
      </div>
    </div>
  );
}
