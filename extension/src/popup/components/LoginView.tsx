import { useState } from 'react';
import { API_BASE } from '@shared/constants';
import { HelpTrigger } from './HelpOverlay';

interface Props {
  onLogin: (token: string, userName: string) => void;
}

export function LoginView({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Fetch directo — host_permissions en manifest permite CORS bypass
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.detail || 'Email o contrasena incorrectos');
        return;
      }

      const data = await response.json();
      if (data.token && data.user) {
        onLogin(data.token, data.user.first_name || data.user.username || 'Usuario');
      } else {
        setError('Respuesta inesperada del servidor');
      }
    } catch {
      setError('No se pudo conectar con Conniku. Verifica tu conexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-icon">C</div>
      <h2 className="login-title">Bienvenido a Conniku</h2>
      <p className="login-desc">
        Inicia sesion para sincronizar tus cursos, documentos y calendario automaticamente.
      </p>

      <form onSubmit={handleSubmit} className="login-form">
        <label className="sr-only" htmlFor="conniku-email">Email</label>
        <input
          id="conniku-email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          autoFocus
          disabled={loading}
          aria-label="Email"
        />
        <label className="sr-only" htmlFor="conniku-password">Contrasena</label>
        <input
          id="conniku-password"
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          disabled={loading}
          aria-label="Contrasena"
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Conectando...' : 'Iniciar sesion'}
        </button>
      </form>

      <button
        className="btn-secondary"
        onClick={() => chrome.tabs.create({ url: 'https://conniku.com/register' })}
      >
        Crear cuenta gratis
      </button>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <HelpTrigger helpKey="login" />
      </div>
    </div>
  );
}
