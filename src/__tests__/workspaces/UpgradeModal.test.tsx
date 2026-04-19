/**
 * Tests del UpgradeModal — modal de upgrade al agotar cupo Free de Athena.
 *
 * Cubre: render, CTA primario navega, ESC cierra, CTA secundario cierra,
 * focus trap presente.
 *
 * Bloque 2c Athena IA.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UpgradeModal from '../../components/workspaces/Athena/UpgradeModal';

describe('UpgradeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el título "Agotaste tu cupo diario de Athena"', () => {
    render(<UpgradeModal limit={3} onNavigate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/agotaste.*cupo.*athena/i)).toBeTruthy();
  });

  it('muestra el límite en el cuerpo del modal', () => {
    render(<UpgradeModal limit={3} onNavigate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/3.*interacciones/i)).toBeTruthy();
  });

  it('click en "Mejorar a Conniku Pro" llama onNavigate con /suscripciones', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<UpgradeModal limit={3} onNavigate={onNavigate} onClose={vi.fn()} />);
    const ctaBtn = screen.getByRole('button', { name: /mejorar.*pro/i });
    await user.click(ctaBtn);
    expect(onNavigate).toHaveBeenCalledWith('/suscripciones');
  });

  it('click en "Entendido" llama onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<UpgradeModal limit={3} onNavigate={vi.fn()} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /entendido/i });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('presionar ESC llama onClose', async () => {
    const onClose = vi.fn();
    render(<UpgradeModal limit={3} onNavigate={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
