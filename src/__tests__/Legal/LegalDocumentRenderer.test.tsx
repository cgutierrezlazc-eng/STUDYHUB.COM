/**
 * Tests para LegalDocumentRenderer
 * RED: fallan porque el componente no existe aún.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Mock del hook useLegalDocument para controlar el contenido
vi.mock('../../hooks/useLegalDocument', () => ({
  useLegalDocument: vi.fn(),
}));

// Mock de useLegalDocumentView para evitar llamadas reales
vi.mock('../../hooks/useLegalDocumentView', () => ({
  useLegalDocumentView: vi.fn(),
}));

describe('LegalDocumentRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga mientras se obtiene el documento', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: null,
      version: null,
      hash: null,
      loading: true,
      error: null,
    });

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    render(<LegalDocumentRenderer docKey="terms" variant="page" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando el fetch falla', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: null,
      version: null,
      hash: null,
      loading: false,
      error: 'Error al cargar el documento',
    });

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    render(<LegalDocumentRenderer docKey="privacy" variant="page" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renderiza contenido markdown cuando la carga es exitosa', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: '# Términos y Condiciones\n\nEste es el contenido de prueba.',
      version: '3.2.0',
      hash: 'abc123',
      loading: false,
      error: null,
    });

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    render(<LegalDocumentRenderer docKey="terms" variant="page" />);

    // react-markdown convierte # a h1
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/contenido de prueba/i)).toBeInTheDocument();
  });

  it('llama a useLegalDocument con el docKey correcto', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: '## Cookies\n\nTexto cookies.',
      version: '1.0.0',
      hash: 'def456',
      loading: false,
      error: null,
    });

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    render(<LegalDocumentRenderer docKey="cookies" variant="modal" />);
    expect(useLegalDocument).toHaveBeenCalledWith('cookies');
  });

  it('aplica clase CSS según variant page', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: 'Texto',
      version: '1.0.0',
      hash: 'x',
      loading: false,
      error: null,
    });

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    const { container } = render(<LegalDocumentRenderer docKey="terms" variant="page" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.dataset.variant).toBe('page');
  });

  it('aplica clase CSS según variant modal', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: 'Texto',
      version: '1.0.0',
      hash: 'x',
      loading: false,
      error: null,
    });

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    const { container } = render(<LegalDocumentRenderer docKey="terms" variant="modal" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.dataset.variant).toBe('modal');
  });

  it('llama a useLegalDocumentView al montar cuando registerView es true', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    const { useLegalDocumentView } = await import('../../hooks/useLegalDocumentView');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: 'Texto',
      version: '1.0.0',
      hash: 'x',
      loading: false,
      error: null,
    });
    vi.mocked(useLegalDocumentView).mockReturnValue(undefined);

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    render(<LegalDocumentRenderer docKey="terms" variant="page" registerView={true} />);
    expect(useLegalDocumentView).toHaveBeenCalledWith('terms', 'x');
  });

  it('NO llama a useLegalDocumentView cuando registerView es false', async () => {
    const { useLegalDocument } = await import('../../hooks/useLegalDocument');
    const { useLegalDocumentView } = await import('../../hooks/useLegalDocumentView');
    vi.mocked(useLegalDocument).mockReturnValue({
      content: 'Texto',
      version: '1.0.0',
      hash: 'x',
      loading: false,
      error: null,
    });
    vi.mocked(useLegalDocumentView).mockReturnValue(undefined);

    const { LegalDocumentRenderer } = await import('../../components/Legal/LegalDocumentRenderer');
    render(<LegalDocumentRenderer docKey="terms" variant="page" registerView={false} />);
    expect(useLegalDocumentView).toHaveBeenCalledWith('terms', null);
  });
});
