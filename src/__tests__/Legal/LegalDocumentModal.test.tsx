/**
 * Tests para LegalDocumentModal
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock del renderer para evitar fetch real
vi.mock('../../components/Legal/LegalDocumentRenderer', () => ({
  LegalDocumentRenderer: ({ docKey }: { docKey: string }) => (
    <div data-testid="mock-renderer">{docKey}</div>
  ),
  default: ({ docKey }: { docKey: string }) => <div data-testid="mock-renderer">{docKey}</div>,
}));

describe('LegalDocumentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no se renderiza cuando isOpen es false', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="terms" isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('se renderiza cuando isOpen es true', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="terms" isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tiene atributos aria-modal y aria-labelledby', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="privacy" isOpen={true} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('muestra el título del documento correspondiente', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="cookies" isOpen={true} onClose={onClose} />);
    expect(screen.getByText('Política de Cookies')).toBeInTheDocument();
  });

  it('llama a onClose al hacer clic en el botón Cerrar', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="terms" isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('llama a onClose al presionar ESC', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="terms" isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('llama a onClose al hacer clic en el overlay', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    const { container } = render(
      <LegalDocumentModal documentKey="terms" isOpen={true} onClose={onClose} />
    );
    const overlay = container.querySelector('[data-testid="modal-overlay"]');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('NO llama a onClose al hacer clic dentro del panel', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="terms" isOpen={true} onClose={onClose} />);
    const panel = screen.getByRole('dialog');
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('muestra el renderer con el docKey correcto', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    render(<LegalDocumentModal documentKey="age-declaration" isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('mock-renderer')).toHaveTextContent('age-declaration');
  });

  it('llama a onOpen cuando se abre', async () => {
    const { LegalDocumentModal } = await import('../../components/Legal/LegalDocumentModal');
    const onClose = vi.fn();
    const onOpen = vi.fn();
    render(
      <LegalDocumentModal documentKey="terms" isOpen={true} onClose={onClose} onOpen={onOpen} />
    );
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
