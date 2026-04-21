/**
 * Tests para CookieSettings.tsx
 * Cubre invariantes I-03, I-07 del plan.
 *
 * TDD: tests escritos para verificar comportamiento de toggles y modal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CookieSettings from '../../components/CookieConsent/CookieSettings';

describe('CookieSettings', () => {
  const onAcceptAll = vi.fn();
  const onRejectAll = vi.fn();
  const onSave = vi.fn();
  const onRevokeAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el modal con data-testid correcto', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    expect(screen.getByTestId('cookie-settings')).toBeInTheDocument();
  });

  it('tiene role="dialog" y aria-modal="true"', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('el toggle "necessary" siempre está ON y desactivado (I-03, Planet49)', () => {
    render(
      <CookieSettings
        initialCategories={[]}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    const necessaryToggle = screen.getByTestId('cookie-toggle-cookie-toggle-necessary');
    expect(necessaryToggle).toHaveAttribute('aria-checked', 'true');
    expect(necessaryToggle).toBeDisabled();
  });

  it('los toggles no esenciales están OFF por defecto sin initialCategories (I-03)', () => {
    render(
      <CookieSettings
        initialCategories={[]}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    const functionalToggle = screen.getByTestId('cookie-toggle-cookie-toggle-functional');
    const analyticsToggle = screen.getByTestId('cookie-toggle-cookie-toggle-analytics');
    const marketingToggle = screen.getByTestId('cookie-toggle-cookie-toggle-marketing');

    expect(functionalToggle).toHaveAttribute('aria-checked', 'false');
    expect(analyticsToggle).toHaveAttribute('aria-checked', 'false');
    expect(marketingToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('pre-rellena toggles cuando hay initialCategories', () => {
    render(
      <CookieSettings
        initialCategories={['necessary', 'functional']}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    const functionalToggle = screen.getByTestId('cookie-toggle-cookie-toggle-functional');
    const analyticsToggle = screen.getByTestId('cookie-toggle-cookie-toggle-analytics');

    expect(functionalToggle).toHaveAttribute('aria-checked', 'true');
    expect(analyticsToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('al guardar sin cambios llama onSave con solo necessary', () => {
    render(
      <CookieSettings
        initialCategories={[]}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    fireEvent.click(screen.getByTestId('cookie-settings-save'));
    expect(onSave).toHaveBeenCalledWith(['necessary']);
  });

  it('al activar functional y guardar, llama onSave con necessary + functional', () => {
    render(
      <CookieSettings
        initialCategories={[]}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    // Click en toggle funcional para activarlo
    fireEvent.click(screen.getByTestId('cookie-toggle-cookie-toggle-functional'));
    fireEvent.click(screen.getByTestId('cookie-settings-save'));
    expect(onSave).toHaveBeenCalledWith(['necessary', 'functional']);
  });

  it('llama onRejectAll al hacer click en Rechazar todas', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    fireEvent.click(screen.getByTestId('cookie-settings-reject'));
    expect(onRejectAll).toHaveBeenCalledTimes(1);
  });

  it('llama onAcceptAll al hacer click en Aceptar todas', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    fireEvent.click(screen.getByTestId('cookie-settings-accept'));
    expect(onAcceptAll).toHaveBeenCalledTimes(1);
  });

  it('botón retirar consentimiento llama onRevokeAll (I-07, GDPR Art. 7(3))', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    fireEvent.click(screen.getByTestId('cookie-settings-revoke'));
    expect(onRevokeAll).toHaveBeenCalledTimes(1);
  });

  it('muestra las 4 tarjetas de categorías', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    expect(screen.getByTestId('cookie-category-necessary')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-category-functional')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-category-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-category-marketing')).toBeInTheDocument();
  });

  // D-05: botón "Retirar todo el consentimiento" con paridad visual como los otros botones
  it('el botón retirar tiene mismo rol/tipo que los otros 3 botones de acción (D-05)', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
      />
    );
    const revokeBtn = screen.getByTestId('cookie-settings-revoke');
    // Debe ser un <button>, no un link ni elemento genérico
    expect(revokeBtn.tagName).toBe('BUTTON');
    // Debe tener clase o atributo que indique paridad visual (data-variant)
    expect(revokeBtn).toHaveAttribute('data-variant', 'revoke');
    // El texto es el esperado
    expect(revokeBtn).toHaveTextContent('Retirar todo el consentimiento');
  });

  // D-06: aviso post-login visible solo a usuarios logueados
  it('NO muestra aviso post-login cuando no hay sesión activa (D-06)', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
        isLoggedIn={false}
      />
    );
    expect(screen.queryByTestId('cookie-functional-session-notice')).not.toBeInTheDocument();
  });

  it('muestra aviso post-login cuando hay sesión activa (D-06)', () => {
    render(
      <CookieSettings
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
        onRevokeAll={onRevokeAll}
        isLoggedIn={true}
      />
    );
    const notice = screen.getByTestId('cookie-functional-session-notice');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent('sesión esté activa');
    expect(notice).toHaveTextContent('contrato del servicio');
    expect(notice).toHaveTextContent('Al cerrar sesión');
  });
});
