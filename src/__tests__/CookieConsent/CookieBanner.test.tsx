/**
 * Tests para CookieBanner.tsx
 * Cubre invariantes I-01, I-02, I-20 del plan.
 *
 * TDD: tests escritos antes de validar comportamiento completo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CookieBanner from '../../components/CookieConsent/CookieBanner';

describe('CookieBanner', () => {
  const onAcceptAll = vi.fn();
  const onRejectAll = vi.fn();
  const onCustomize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el banner con data-testid correcto (I-01)', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
  });

  it('tiene role="dialog" y aria-modal="true" (I-20)', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('tiene aria-labelledby que apunta al título', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).toBeInTheDocument();
  });

  it('muestra los 3 botones (I-02)', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    expect(screen.getByTestId('cookie-btn-accept')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-btn-reject')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-btn-customize')).toBeInTheDocument();
  });

  it('llama onAcceptAll al hacer click en Aceptar todas', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    fireEvent.click(screen.getByTestId('cookie-btn-accept'));
    expect(onAcceptAll).toHaveBeenCalledTimes(1);
  });

  it('llama onRejectAll al hacer click en Rechazar todas', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    fireEvent.click(screen.getByTestId('cookie-btn-reject'));
    expect(onRejectAll).toHaveBeenCalledTimes(1);
  });

  it('llama onCustomize al hacer click en Personalizar', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    fireEvent.click(screen.getByTestId('cookie-btn-customize'));
    expect(onCustomize).toHaveBeenCalledTimes(1);
  });

  it('Escape NO cierra el banner (I-20: banner bloqueante)', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    // El banner sigue presente; ninguna acción fue llamada
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
    expect(onAcceptAll).not.toHaveBeenCalled();
    expect(onRejectAll).not.toHaveBeenCalled();
  });

  it('muestra enlace a Política de Cookies', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    const link = screen.getByTestId('cookie-policy-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/cookies');
  });

  // D-04: aviso de retracto en primera capa del banner
  it('muestra aviso de retracto con enlace al pie de página (D-04)', () => {
    render(
      <CookieBanner onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} onCustomize={onCustomize} />
    );
    const aviso = screen.getByTestId('cookie-banner-retract-notice');
    expect(aviso).toBeInTheDocument();
    expect(aviso).toHaveTextContent('Puedes cambiar o retirar tu decisión');
    expect(aviso).toHaveTextContent('Cookies');
    expect(aviso).toHaveTextContent('pie de la página');
  });
});
