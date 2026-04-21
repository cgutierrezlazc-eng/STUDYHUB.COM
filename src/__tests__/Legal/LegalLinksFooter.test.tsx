/**
 * Tests para LegalLinksFooter
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock del modal para aislar LegalLinksFooter
vi.mock('../../components/Legal/LegalDocumentModal', () => ({
  LegalDocumentModal: ({
    isOpen,
    documentKey,
  }: {
    isOpen: boolean;
    documentKey: string;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" data-testid={`modal-${documentKey}`}>
        Modal {documentKey}
      </div>
    ) : null,
  default: ({
    isOpen,
    documentKey,
  }: {
    isOpen: boolean;
    documentKey: string;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" data-testid={`modal-${documentKey}`}>
        Modal {documentKey}
      </div>
    ) : null,
}));

describe('LegalLinksFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza exactamente 4 botones/links legales en modo modal', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter />
      </MemoryRouter>
    );
    const nav = screen.getByRole('navigation', { name: /enlaces legales/i });
    // En modo modal (default), son buttons
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
  });

  it('abre el modal de Términos al hacer clic', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter />
      </MemoryRouter>
    );
    const termsBtn = screen.getByRole('button', { name: /términos/i });
    fireEvent.click(termsBtn);
    expect(screen.getByTestId('modal-terms')).toBeInTheDocument();
  });

  it('abre el modal de Privacidad al hacer clic', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /privacidad/i }));
    expect(screen.getByTestId('modal-privacy')).toBeInTheDocument();
  });

  it('abre el modal de Cookies al hacer clic', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /cookies/i }));
    expect(screen.getByTestId('modal-cookies')).toBeInTheDocument();
  });

  it('abre el modal de Declaración de Edad al hacer clic', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /declaración/i }));
    expect(screen.getByTestId('modal-age-declaration')).toBeInTheDocument();
  });

  it('con usePageNavigation=true renderiza links <a> no botones', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter usePageNavigation={true} />
      </MemoryRouter>
    );
    const nav = screen.getByRole('navigation', { name: /enlaces legales/i });
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(4);
  });

  it('con usePageNavigation=true los links apuntan a /legal/:doc', async () => {
    const { LegalLinksFooter } = await import('../../components/Legal/LegalLinksFooter');
    render(
      <MemoryRouter>
        <LegalLinksFooter usePageNavigation={true} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /términos/i })).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByRole('link', { name: /privacidad/i })).toHaveAttribute(
      'href',
      '/legal/privacy'
    );
  });
});
