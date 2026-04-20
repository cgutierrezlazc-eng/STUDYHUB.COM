/**
 * LoginV3 — Paso 4 del bloque-piloto-rediseno-v3
 *
 * Layout 2 paneles según módulo 02-auth del paquete de diseño.
 * - Izquierda: panel de marca con BrandWordmark + tagline
 * - Derecha: formulario con tab switch Entrar/Crear cuenta, Google, email+password
 *
 * REGLAS:
 * - Envuelto en .v3-surface para tokens del nuevo sistema visual
 * - Lógica 100% reutilizada de src/pages/Login.tsx (useAuth, useI18n, handlers)
 * - Sin "IA", "AI", "inteligencia artificial" en texto al usuario
 * - Tuteo chileno (tú/tu/tienes), nunca voseo (vos/tenés/querés)
 * - Sin dependencias nuevas (cero Framer Motion)
 */
import React, { useState } from 'react';
import { useAuth } from '../../services/auth';
import { useI18n } from '../../services/i18n';
import BrandWordmark from '../../components/v3/BrandWordmark';

interface Props {
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
}

export default function LoginV3({ onSwitchToRegister, onForgotPassword, onBack }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  /* tab activa: 'login' | 'register' */
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

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

  const handleGoogle = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  return (
    <div className="v3-surface" style={rootStyle}>
      {/* ── Panel izquierdo: marca ────────────────────────────── */}
      <section style={leftPanelStyle} aria-label="Conniku — plataforma educativa">
        {onBack && (
          <button onClick={onBack} style={backBtnStyle} aria-label="Volver al inicio">
            ← Volver
          </button>
        )}
        <div style={brandAreaStyle}>
          <BrandWordmark onDark size={52} />
          <p style={taglineStyle}>
            Tu plataforma de estudio universitario.
            <br />
            Todo lo que necesitas, en un solo lugar.
          </p>
        </div>
        <div style={trustPillStyle}>
          <span style={{ fontSize: 18 }}>🎓</span>
          <span>
            Estudiantes de UNAB · USS · UCN · UDP · PUC
            <br />
            USACH · U. de Chile · UDD · UAI · UST
          </span>
        </div>
        <p style={footerLegalStyle}>Hecho en Chile · Solo para mayores de 18 años</p>
      </section>

      {/* ── Panel derecho: formulario ────────────────────────── */}
      <section style={rightPanelStyle} aria-label="Formulario de acceso">
        <div style={formCardStyle}>
          {/* Tab switch */}
          <div style={tabSwitchStyle} role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
              style={tabBtnStyle(activeTab === 'login')}
            >
              Entrar
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'register'}
              onClick={() => {
                setActiveTab('register');
                onSwitchToRegister();
              }}
              style={tabBtnStyle(activeTab === 'register')}
            >
              Crear cuenta
            </button>
          </div>

          <h1 style={formTitleStyle}>Bienvenido de vuelta</h1>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isLoading}
            style={googleBtnStyle}
            aria-label="Ingresar con Google"
          >
            <GoogleIcon />
            Ingresar con Google
          </button>

          {/* Divider */}
          <div style={dividerStyle} aria-hidden="true">
            <div style={dividerLineStyle} />
            <span style={dividerTextStyle}>o con tu correo</span>
            <div style={dividerLineStyle} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={fieldGroupStyle}>
              <label htmlFor="v3-login-email" style={labelStyle}>
                Correo electrónico
              </label>
              <input
                id="v3-login-email"
                type="email"
                placeholder="tu@correo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                style={inputStyle}
                aria-label="Correo electrónico"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="v3-login-password" style={labelStyle}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="v3-login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  aria-label="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={showPassBtnStyle}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" style={errorStyle}>
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} style={submitBtnStyle}>
              {isLoading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          {onForgotPassword && (
            <button type="button" onClick={onForgotPassword} style={forgotBtnStyle}>
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <p style={switchTextStyle}>
            ¿No tienes cuenta?{' '}
            <button type="button" onClick={onSwitchToRegister} style={switchLinkStyle}>
              Crear cuenta gratis
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

/* ── Google Icon SVG ─────────────────────────────────────────────── */
function GoogleIcon() {
  return (
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
  );
}

/* ── Estilos inline (tokens v3 via var()) ────────────────────────── */
const rootStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  minHeight: '100vh',
  background: 'var(--paper, #F5F4EF)',
};

const leftPanelStyle: React.CSSProperties = {
  background: 'var(--ink, #0D0F10)',
  color: 'var(--paper, #F5F4EF)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '48px 56px',
  position: 'relative',
};

const backBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 24,
  left: 32,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(245,244,239,0.6)',
  fontSize: 13,
  fontFamily: 'inherit',
};

const brandAreaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  marginTop: 48,
};

const taglineStyle: React.CSSProperties = {
  fontSize: 20,
  lineHeight: 1.45,
  color: 'rgba(245,244,239,0.8)',
  maxWidth: 360,
  margin: 0,
};

const trustPillStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '16px 20px',
  borderRadius: 12,
  background: 'rgba(245,244,239,0.07)',
  fontSize: 12,
  color: 'rgba(245,244,239,0.65)',
  lineHeight: 1.6,
  border: '1px solid rgba(245,244,239,0.1)',
};

const footerLegalStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(245,244,239,0.35)',
  margin: 0,
};

const rightPanelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 40px',
  background: 'var(--paper, #F5F4EF)',
};

const formCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const tabSwitchStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  marginBottom: 28,
  background: 'rgba(13,15,16,0.06)',
  borderRadius: 10,
  padding: 4,
};

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 0',
  borderRadius: 7,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'background 150ms, color 150ms',
  background: active ? 'var(--ink, #0D0F10)' : 'transparent',
  color: active ? 'var(--paper, #F5F4EF)' : 'rgba(13,15,16,0.5)',
});

const formTitleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: 'var(--ink, #0D0F10)',
  margin: '0 0 24px',
  fontFamily: "'Funnel Display', -apple-system, sans-serif",
};

const googleBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '11px 16px',
  borderRadius: 10,
  border: '1.5px solid rgba(13,15,16,0.15)',
  background: 'white',
  color: 'var(--ink, #0D0F10)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginBottom: 20,
};

const dividerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 20,
};

const dividerLineStyle: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: 'rgba(13,15,16,0.12)',
};

const dividerTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(13,15,16,0.4)',
  whiteSpace: 'nowrap',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(13,15,16,0.7)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid rgba(13,15,16,0.15)',
  background: 'white',
  color: 'var(--ink, #0D0F10)',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const showPassBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
};

const errorStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  background: 'rgba(220,38,38,0.06)',
  color: '#dc2626',
  fontSize: 13,
  margin: '0 0 16px',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--lime, #D9FF3A)',
  color: 'var(--ink, #0D0F10)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginTop: 4,
  marginBottom: 16,
};

const forgotBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(13,15,16,0.5)',
  fontSize: 13,
  fontFamily: 'inherit',
  marginBottom: 24,
};

const switchTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(13,15,16,0.5)',
  textAlign: 'center',
  margin: 0,
};

const switchLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--ink, #0D0F10)',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'inherit',
  padding: 0,
  textDecoration: 'underline',
};
