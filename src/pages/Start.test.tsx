import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { I18nProvider } from '../services/i18n';
import Start from './Start';

describe('Start.handleLogin — cableado POST /auth/login (TDD #9)', () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('conniku_language', 'es');
    localStorage.setItem('conniku_role', 'student');
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function renderStart() {
    return render(
      <MemoryRouter>
        <I18nProvider>
          <Start />
        </I18nProvider>
      </MemoryRouter>
    );
  }

  async function openLoginModal() {
    renderStart();
    const entrarSpan = await screen.findByText(/^entrar$/i, { selector: 'a span' });
    const planetLink = entrarSpan.closest('a');
    if (!planetLink) throw new Error('No se encontró el planet button "entrar"');
    fireEvent.click(planetLink);
    const emailInput = (await waitFor(() =>
      document.getElementById('loginEmail')
    )) as HTMLInputElement | null;
    if (!emailInput) throw new Error('Modal entrar no abrió tras click');
    return { emailInput };
  }

  it('1: envía POST a /auth/login con body exacto {email, password}', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 't', refresh_token: 'r', user: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await openLoginModal();
    const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
    const passInput = document.getElementById('loginPass') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@conniku.com' } });
    fireEvent.change(passInput, { target: { value: 'Secret123' } });

    const submitBtn = screen.getByText(/Entrar →/);
    fireEvent.click(submitBtn);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    const call = fetchSpy.mock.calls[0] as [string, RequestInit];
    const [url, init] = call;
    expect(String(url)).toContain('/auth/login');
    expect(String(url)).not.toContain('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'test@conniku.com',
      password: 'Secret123',
    });
  });

  it('2: respuesta 200 guarda token y refresh_token en localStorage', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ token: 'jwt-token-xyz', refresh_token: 'refresh-abc', user: {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await openLoginModal();
    const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
    const passInput = document.getElementById('loginPass') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@conniku.com' } });
    fireEvent.change(passInput, { target: { value: 'Secret123' } });

    const submitBtn = screen.getByText(/Entrar →/);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('jwt-token-xyz');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-abc');
    });
  });

  it('3: respuesta 401 muestra loginError inline (sin alert)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Correo o contraseña incorrectos' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await openLoginModal();
    const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
    const passInput = document.getElementById('loginPass') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@conniku.com' } });
    fireEvent.change(passInput, { target: { value: 'Wrong123' } });

    const submitBtn = screen.getByText(/Entrar →/);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
