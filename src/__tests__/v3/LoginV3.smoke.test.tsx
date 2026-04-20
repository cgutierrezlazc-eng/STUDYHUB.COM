/**
 * Test N9 — Smoke test de LoginV3
 *
 * TDD RED: escrito antes de crear LoginV3.tsx
 *
 * Verifica:
 * 1. Renderiza sin crash
 * 2. No contiene strings prohibidas
 * 3. Tiene campo email y contraseña
 * 4. Contiene la clase v3-surface
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks necesarios para renderizar fuera del AuthProvider ───────
vi.mock('../../services/auth', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue({ success: true }),
    loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    user: null,
    isLoading: false,
  }),
}));

vi.mock('../../services/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'es',
    setLang: vi.fn(),
  }),
  LANGUAGES: [{ code: 'es', name: 'Español', flag: '🇨🇱' }],
}));
// ─────────────────────────────────────────────────────────────────

const mockOnSwitchToRegister = vi.fn();
const mockOnForgotPassword = vi.fn();
const mockOnBack = vi.fn();

describe('LoginV3 — smoke tests', () => {
  it('renderiza sin crash', async () => {
    const { default: LoginV3 } = await import('../../pages/v3/LoginV3');
    expect(() =>
      render(
        <LoginV3
          onSwitchToRegister={mockOnSwitchToRegister}
          onForgotPassword={mockOnForgotPassword}
          onBack={mockOnBack}
        />
      )
    ).not.toThrow();
  });

  it('no contiene "IA" ni "AI" en el DOM', async () => {
    const { default: LoginV3 } = await import('../../pages/v3/LoginV3');
    const { container } = render(
      <LoginV3
        onSwitchToRegister={mockOnSwitchToRegister}
        onForgotPassword={mockOnForgotPassword}
        onBack={mockOnBack}
      />
    );
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\bIA\b/);
    expect(text).not.toMatch(/\bAI\b/);
  });

  it('no contiene voseo rioplatense', async () => {
    const { default: LoginV3 } = await import('../../pages/v3/LoginV3');
    const { container } = render(
      <LoginV3
        onSwitchToRegister={mockOnSwitchToRegister}
        onForgotPassword={mockOnForgotPassword}
        onBack={mockOnBack}
      />
    );
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/necesitás|tenés|querés|sabés/);
  });

  it('tiene campo de email', async () => {
    const { default: LoginV3 } = await import('../../pages/v3/LoginV3');
    render(
      <LoginV3
        onSwitchToRegister={mockOnSwitchToRegister}
        onForgotPassword={mockOnForgotPassword}
        onBack={mockOnBack}
      />
    );
    const emailInput =
      screen.getByLabelText(/email|correo/i) || screen.getByPlaceholderText(/email|correo/i);
    expect(emailInput).toBeTruthy();
  });

  it('contiene un elemento con clase v3-surface', async () => {
    const { default: LoginV3 } = await import('../../pages/v3/LoginV3');
    const { container } = render(
      <LoginV3
        onSwitchToRegister={mockOnSwitchToRegister}
        onForgotPassword={mockOnForgotPassword}
        onBack={mockOnBack}
      />
    );
    expect(container.querySelector('.v3-surface')).not.toBeNull();
  });
});
