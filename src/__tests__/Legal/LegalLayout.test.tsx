/**
 * Tests para LegalLayout
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

describe('LegalLayout', () => {
  it('renderiza el nav de documentos legales', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/terms']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation', { name: /documentos legales/i })).toBeInTheDocument();
  });

  it('muestra los 4 links del sidebar', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/terms']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    const nav = screen.getByRole('navigation', { name: /documentos legales/i });
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(4);
  });

  it('contiene link a Términos y Condiciones', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/terms']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /términos/i })).toBeInTheDocument();
  });

  it('contiene link a Política de Privacidad', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/privacy']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /privacidad/i })).toBeInTheDocument();
  });

  it('contiene link a Política de Cookies', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/cookies']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /cookies/i })).toBeInTheDocument();
  });

  it('contiene link a Declaración de Edad', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/age-declaration']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /declaración de edad/i })).toBeInTheDocument();
  });

  it('el link activo tiene aria-current="page"', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/privacy']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    const privacyLink = screen.getByRole('link', { name: /privacidad/i });
    expect(privacyLink).toHaveAttribute('aria-current', 'page');
  });

  it('los otros links NO tienen aria-current', async () => {
    const { LegalLayout } = await import('../../pages/Legal/LegalLayout');
    render(
      <MemoryRouter initialEntries={['/legal/privacy']}>
        <Routes>
          <Route path="/legal/*" element={<LegalLayout />} />
        </Routes>
      </MemoryRouter>
    );
    const termsLink = screen.getByRole('link', { name: /términos/i });
    expect(termsLink).not.toHaveAttribute('aria-current', 'page');
  });
});
