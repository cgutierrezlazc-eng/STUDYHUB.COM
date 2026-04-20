/**
 * RegisterV3 — Paso 4 del bloque-piloto-rediseno-v3
 *
 * Layout 2 paneles según módulo 02-auth del paquete de diseño.
 * - Izquierda: panel de marca con BrandWordmark + tagline
 * - Derecha: formulario de registro con datos básicos + declaración legal
 *
 * COMPONENTE LEGAL CRÍTICO:
 * - Importa AGE_DECLARATION_HASH y AGE_DECLARATION_TEXT_V1 de shared/legal_texts (FROZEN)
 * - El texto legal del checkbox aparece BIT-EXACTO al canónico
 * - El hash se propaga al backend como evidencia probatoria
 * - El checkbox requiere evidencia de lectura (link al documento + estado deshabilitado hasta apertura)
 * - Ver CLAUDE.md §Verificación de edad y memoria feedback_legal_reading_evidence.md
 *
 * REGLAS:
 * - Envuelto en .v3-surface para tokens del nuevo sistema visual
 * - Toda la lógica de validación reutilizada de src/pages/Register.tsx
 * - Sin "IA", "AI", "inteligencia artificial" en texto al usuario
 * - Tuteo chileno (tú/tu/tienes), nunca voseo (vos/tenés/querés)
 * - Sin dependencias nuevas (cero Framer Motion)
 * - Validación de edad >= 18 en frontend (backend recalcula como fuente de verdad)
 */
import React, { useState, useRef } from 'react';
import { useAuth } from '../../services/auth';
import { useI18n } from '../../services/i18n';
import BrandWordmark from '../../components/v3/BrandWordmark';
import { AGE_DECLARATION_HASH, AGE_DECLARATION_TEXT_V1 } from 'shared/legal_texts';

// ── Blocked username terms (copiado de Register.tsx para mantener validación) ─
const BLOCKED_TERMS = [
  'admin',
  'root',
  'conniku',
  'soporte',
  'support',
  'moderador',
  'moderator',
  'staff',
  'nigger',
  'nigga',
  'nazi',
  'faggot',
  'puta',
  'puto',
  'mierda',
  'pendejo',
  'culero',
  'marica',
  'hijodeputa',
  'bastardo',
  'cabrón',
  'chingado',
  'idiota',
  'imbecil',
  'estupido',
  'retardo',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'whore',
  'slut',
  'rape',
  'porno',
  'sexo',
  'sex',
  'xxx',
  'hate',
  'kill',
  'muerte',
  'terror',
];
function containsBlockedTerm(username: string): boolean {
  const lower = username.toLowerCase().replace(/[_.\\-]/g, '');
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

// ── Calcula edad exacta (copiada de Register.tsx) ───────────────────────────
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface Props {
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

export default function RegisterV3({ onSwitchToLogin, onBack }: Props) {
  const { register, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Estado del checkbox legal.
   * Requiere que el usuario abra el documento antes de poder marcar.
   * Memoria: feedback_legal_reading_evidence.md
   */
  const [legalDocOpened, setLegalDocOpened] = useState(false);
  const [ageDeclarationAccepted, setAgeDeclarationAccepted] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    username: '',
    // Hash del texto legal — se propaga al backend como evidencia probatoria
    // Valor tomado de shared/legal_texts (FROZEN) — NO se modifica aquí
    acceptedTextVersionHash: AGE_DECLARATION_HASH,
    userTimezone:
      typeof Intl !== 'undefined'
        ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? null)
        : null,
  });

  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // ── Validación del formulario ─────────────────────────────────────
  const validate = (): boolean => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t('err.invalidEmail'));
      return false;
    }
    if (form.password.length < 8) {
      setError(t('err.pwdMin8'));
      return false;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError(t('err.pwdUppercase'));
      return false;
    }
    if (!/[0-9]/.test(form.password)) {
      setError(t('err.pwdNumber'));
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('err.passwordMismatch'));
      return false;
    }
    if (!form.firstName.trim()) {
      setError(t('err.enterName'));
      return false;
    }
    if (!form.birthDate) {
      setError(t('err.enterBirthDate'));
      return false;
    }
    if (calculateAge(form.birthDate) < 18) {
      setError(
        'Conniku es una plataforma exclusiva para personas mayores de 18 años. No podemos procesar tu registro.'
      );
      return false;
    }
    if (!form.username.trim() || form.username.length < 5 || form.username.length > 30) {
      setError('El nombre de usuario debe tener entre 5 y 30 caracteres.');
      return false;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(form.username)) {
      setError(t('err.usernameChars'));
      return false;
    }
    if (containsBlockedTerm(form.username)) {
      setError('Este nombre de usuario no está permitido. Elige otro.');
      return false;
    }
    if (!legalDocOpened) {
      setError(
        'Debes abrir y leer los Términos y Condiciones antes de marcar la declaración jurada de edad.'
      );
      return false;
    }
    if (!ageDeclarationAccepted) {
      setError('Debes marcar la declaración jurada de edad para continuar con el registro.');
      return false;
    }
    if (!tosAccepted) {
      setError(t('err.acceptTOS'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const result = await register({
      ...form,
      // Propagación del hash canónico al backend como evidencia probatoria
      // CLAUDE.md §Verificación de edad — Componente 3: almacenamiento legal
      acceptedTextVersionHash: AGE_DECLARATION_HASH,
      ageDeclarationAccepted,
      tosAccepted,
    });
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || t('err.registerError'));
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  /**
   * Abre el documento legal en una nueva pestaña y habilita el checkbox.
   * Evidencia de lectura: el usuario debe abrir el link para poder aceptar.
   * Memoria: feedback_legal_reading_evidence.md
   */
  const handleOpenLegalDoc = () => {
    window.open('/terms', '_blank', 'noopener,noreferrer');
    setLegalDocOpened(true);
  };

  // Limpia el timer de username al desmontar
  React.useEffect(() => {
    const timer = usernameTimer;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

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
            Empieza tu experiencia universitaria
            <br />
            en la plataforma que trabaja para ti.
          </p>
        </div>
        {/* Beneficios del registro */}
        <ul style={benefitListStyle} aria-label="Qué obtienes al registrarte">
          {[
            'Acceso a biblioteca extensa',
            'Workspaces colaborativos',
            'Conexión con tutores especializados',
            'Comunidad de tu carrera',
          ].map((b) => (
            <li key={b} style={benefitItemStyle}>
              <span style={benefitDotStyle} aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
        <p style={footerLegalStyle}>Hecho en Chile · Solo para mayores de 18 años</p>
      </section>

      {/* ── Panel derecho: formulario ────────────────────────── */}
      <section style={rightPanelStyle} aria-label="Formulario de registro">
        <div style={formCardStyle}>
          <div style={topLinkStyle}>
            <span style={{ color: 'rgba(13,15,16,0.5)', fontSize: 13 }}>¿Ya tienes cuenta?</span>{' '}
            <button type="button" onClick={onSwitchToLogin} style={switchLinkStyle}>
              Ingresar
            </button>
          </div>

          <h1 style={formTitleStyle}>Crea tu cuenta</h1>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isLoading}
            style={googleBtnStyle}
            aria-label="Crear cuenta con Google"
          >
            <GoogleIcon />
            Crear cuenta con Google
          </button>

          {/* Divider */}
          <div style={dividerStyle} aria-hidden="true">
            <div style={dividerLineStyle} />
            <span style={dividerTextStyle}>o con tu correo</span>
            <div style={dividerLineStyle} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Nombre */}
            <div style={fieldRowStyle}>
              <div style={fieldGroupStyle}>
                <label htmlFor="v3-reg-first" style={labelStyle}>
                  Nombre
                </label>
                <input
                  id="v3-reg-first"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  autoComplete="given-name"
                  style={inputStyle}
                  aria-label="Nombre"
                />
              </div>
              <div style={fieldGroupStyle}>
                <label htmlFor="v3-reg-last" style={labelStyle}>
                  Apellido
                </label>
                <input
                  id="v3-reg-last"
                  type="text"
                  placeholder="Tu apellido"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  autoComplete="family-name"
                  style={inputStyle}
                  aria-label="Apellido"
                />
              </div>
            </div>

            {/* Correo */}
            <div style={fieldGroupStyle}>
              <label htmlFor="v3-reg-email" style={labelStyle}>
                Correo electrónico
              </label>
              <input
                id="v3-reg-email"
                type="email"
                placeholder="tu@correo.cl"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                autoComplete="email"
                style={inputStyle}
                aria-label="Correo electrónico"
              />
            </div>

            {/* Username */}
            <div style={fieldGroupStyle}>
              <label htmlFor="v3-reg-username" style={labelStyle}>
                Nombre de usuario
              </label>
              <input
                id="v3-reg-username"
                type="text"
                placeholder="tu_usuario"
                value={form.username}
                onChange={(e) => update('username', e.target.value.toLowerCase())}
                autoComplete="username"
                style={inputStyle}
                aria-label="Nombre de usuario"
                minLength={5}
                maxLength={30}
              />
            </div>

            {/* Fecha nacimiento — REQUERIDA por CLAUDE.md §Verificación de edad */}
            <div style={fieldGroupStyle}>
              <label htmlFor="v3-reg-birth" style={labelStyle}>
                Fecha de nacimiento{' '}
                <span style={{ fontWeight: 400, color: 'rgba(13,15,16,0.4)', fontSize: 11 }}>
                  (debes ser mayor de 18 años)
                </span>
              </label>
              <input
                id="v3-reg-birth"
                type="date"
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
                style={inputStyle}
                aria-label="Fecha de nacimiento"
                aria-describedby="v3-reg-birth-hint"
              />
              <span id="v3-reg-birth-hint" style={hintStyle}>
                Conniku es exclusiva para personas mayores de 18 años.
              </span>
            </div>

            {/* Contraseña */}
            <div style={fieldGroupStyle}>
              <label htmlFor="v3-reg-password" style={labelStyle}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="v3-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  autoComplete="new-password"
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

            {/* Confirmar contraseña */}
            <div style={{ ...fieldGroupStyle, marginBottom: 20 }}>
              <label htmlFor="v3-reg-confirm" style={labelStyle}>
                Confirmar contraseña
              </label>
              <input
                id="v3-reg-confirm"
                type="password"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                autoComplete="new-password"
                style={inputStyle}
                aria-label="Confirmar contraseña"
              />
            </div>

            {/* ─────────────────────────────────────────────────────────
                DECLARACIÓN JURADA DE EDAD — COMPONENTE LEGAL CRÍTICO
                CLAUDE.md §Verificación de edad — Componente 2
                Texto BIT-EXACTO a AGE_DECLARATION_TEXT_V1 (FROZEN)
                Evidencia de lectura: link + disabled hasta apertura
                Memoria: feedback_legal_reading_evidence.md
             ──────────────────────────────────────────────────────── */}
            <div
              style={legalBoxStyle}
              aria-label="Declaración jurada de edad — lectura obligatoria"
            >
              <p style={legalBoxTitleStyle}>Declaración jurada de edad</p>

              {/* Link al documento legal — debe abrirse para habilitar el checkbox */}
              {!legalDocOpened && (
                <button
                  type="button"
                  onClick={handleOpenLegalDoc}
                  style={openLegalBtnStyle}
                  aria-label="Abrir y leer los Términos y Condiciones (obligatorio antes de aceptar)"
                >
                  Leer Términos y Condiciones antes de aceptar →
                </button>
              )}
              {legalDocOpened && (
                <p style={legalReadConfirmStyle} aria-live="polite">
                  Documento abierto. Ahora puedes marcar la declaración.
                </p>
              )}

              {/* Texto legal bit-exacto — AGE_DECLARATION_TEXT_V1 de shared/legal_texts (FROZEN) */}
              <div
                style={legalTextScrollStyle}
                aria-label="Texto completo de la declaración"
                role="region"
                tabIndex={0}
              >
                <pre style={legalPreStyle}>{AGE_DECLARATION_TEXT_V1}</pre>
              </div>

              {/* Checkbox — deshabilitado hasta que el usuario abra el documento */}
              <label
                style={{
                  ...legalCheckLabelStyle,
                  opacity: legalDocOpened ? 1 : 0.45,
                  cursor: legalDocOpened ? 'pointer' : 'not-allowed',
                }}
              >
                <input
                  type="checkbox"
                  checked={ageDeclarationAccepted}
                  onChange={(e) => {
                    if (legalDocOpened) setAgeDeclarationAccepted(e.target.checked);
                  }}
                  disabled={!legalDocOpened}
                  aria-label="He leído y acepto la declaración jurada de edad"
                  aria-disabled={!legalDocOpened}
                  style={{ width: 16, height: 16, flexShrink: 0 }}
                />
                <span>
                  He leído y acepto{' '}
                  <button
                    type="button"
                    onClick={handleOpenLegalDoc}
                    style={inlineLinkStyle}
                    aria-label="Abrir Términos y Condiciones"
                  >
                    los Términos y Condiciones
                  </button>
                </span>
              </label>
            </div>

            {/* TOS */}
            <label style={{ ...legalCheckLabelStyle, marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                aria-label="Acepto la Política de Privacidad"
                style={{ width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: 'rgba(13,15,16,0.6)' }}>
                Acepto la{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--ink, #0D0F10)', fontWeight: 600 }}
                >
                  Política de Privacidad
                </a>
              </span>
            </label>

            {error && (
              <p role="alert" style={errorStyle}>
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} style={submitBtnStyle}>
              {isLoading ? 'Creando cuenta…' : 'Crear mi cuenta'}
            </button>
          </form>

          <p style={disclaimerStyle}>
            Solo para personas mayores de 18 años. Al registrarte, declaras bajo fe de juramento tus
            datos verdaderos.
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

const benefitListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const benefitItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 14,
  color: 'rgba(245,244,239,0.7)',
};

const benefitDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--lime, #D9FF3A)',
  flexShrink: 0,
};

const footerLegalStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(245,244,239,0.35)',
  margin: 0,
};

const rightPanelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '40px',
  background: 'var(--paper, #F5F4EF)',
  overflowY: 'auto',
};

const formCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  paddingTop: 16,
};

const topLinkStyle: React.CSSProperties = {
  marginBottom: 20,
  fontSize: 13,
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

const fieldRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 14,
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

const hintStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'rgba(13,15,16,0.4)',
  marginTop: 4,
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

/* ── Estilos del bloque legal ────────────────────────────────────── */
const legalBoxStyle: React.CSSProperties = {
  border: '1.5px solid rgba(13,15,16,0.15)',
  borderRadius: 10,
  padding: '16px',
  marginBottom: 14,
  background: 'rgba(13,15,16,0.03)',
};

const legalBoxTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(13,15,16,0.5)',
  margin: '0 0 10px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const openLegalBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1.5px solid rgba(13,15,16,0.2)',
  background: 'white',
  color: 'var(--ink, #0D0F10)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginBottom: 12,
  textAlign: 'left',
};

const legalReadConfirmStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#16a34a',
  margin: '0 0 8px',
  fontWeight: 600,
};

const legalTextScrollStyle: React.CSSProperties = {
  maxHeight: 140,
  overflowY: 'auto',
  marginBottom: 12,
  outline: 'none',
};

const legalPreStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.6,
  color: 'rgba(13,15,16,0.7)',
  whiteSpace: 'pre-wrap',
  fontFamily: 'inherit',
  margin: 0,
};

const legalCheckLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 12,
  color: 'rgba(13,15,16,0.7)',
  cursor: 'pointer',
  marginTop: 4,
};

const inlineLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--ink, #0D0F10)',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'inherit',
  padding: 0,
  textDecoration: 'underline',
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
  marginBottom: 16,
};

const disclaimerStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(13,15,16,0.35)',
  textAlign: 'center',
  lineHeight: 1.5,
  margin: 0,
};
