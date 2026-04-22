/**
 * Tests para MultiDocumentConsent componente.
 *
 * TDD RED fase — escritos antes de implementar el componente.
 * Bloque: multi-document-consent-v1
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { MultiDocumentConsent } from '../../components/LegalConsent/MultiDocumentConsent';

// ----- Mocks ------------------------------------------------------------------

// Mock del modal de documentos legales para no depender del fetch en tests unitarios
vi.mock('../../components/Legal/LegalDocumentModal', () => ({
  LegalDocumentModal: ({
    isOpen,
    onClose,
    documentKey,
  }: {
    isOpen: boolean;
    onClose: () => void;
    documentKey: string;
  }) =>
    isOpen ? (
      <div data-testid={`modal-${documentKey}`} role="dialog">
        <span>Modal {documentKey}</span>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null,
}));

// Mock del hook para controlar el estado en tests
vi.mock('../../hooks/useReadingEvidence', () => ({
  useReadingEvidence: vi.fn(() => ({
    sessionToken: 'test-session-token-uuid4',
    viewedDocs: {
      terms: false,
      privacy: false,
      cookies: false,
      'age-declaration': false,
    },
    allRead: false,
    onDocRead: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { useReadingEvidence } from '../../hooks/useReadingEvidence';
const mockUseReadingEvidence = vi.mocked(useReadingEvidence);

// Mock del fetch para el endpoint viewed
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  // Restablecer al mock por defecto antes de cada test
  mockUseReadingEvidence.mockReturnValue({
    sessionToken: 'test-session-token-uuid4',
    viewedDocs: {
      terms: false,
      privacy: false,
      cookies: false,
      'age-declaration': false,
    },
    allRead: false,
    onDocRead: vi.fn().mockResolvedValue(undefined),
  });
});

// ----- Tests ------------------------------------------------------------------

describe('MultiDocumentConsent — renderizado inicial', () => {
  it('renderiza 4 tarjetas de documento con nombres correctos', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);

    expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
    expect(screen.getByText('Política de Cookies')).toBeInTheDocument();
    expect(screen.getByText('Declaración de Edad')).toBeInTheDocument();
  });

  it('muestra el párrafo legal unificado', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    // El texto del borrador provisional debe estar presente
    expect(screen.getByTestId('consent-paragraph')).toBeInTheDocument();
  });

  it('muestra "Por leer" como estado inicial de cada tarjeta', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    const pendingLabels = screen.getAllByText('Por leer');
    expect(pendingLabels).toHaveLength(4);
  });

  it('renderiza un botón "Leer" por cada documento', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    const leerButtons = screen.getAllByRole('button', { name: /Leer/i });
    expect(leerButtons).toHaveLength(4);
  });
});

describe('MultiDocumentConsent — barra de progreso', () => {
  it('muestra "0 de 4 documentos leídos" inicialmente', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/0 de 4/)).toBeInTheDocument();
  });

  it('actualiza la barra cuando 2 documentos están leídos', () => {
    mockUseReadingEvidence.mockReturnValue({
      sessionToken: 'test-token',
      viewedDocs: {
        terms: true,
        privacy: true,
        cookies: false,
        'age-declaration': false,
      },
      allRead: false,
      onDocRead: vi.fn().mockResolvedValue(undefined),
    });

    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    expect(screen.getByText(/2 de 4/)).toBeInTheDocument();
  });

  it('aria-progressbar tiene valuenow correcto', () => {
    mockUseReadingEvidence.mockReturnValue({
      sessionToken: 'test-token',
      viewedDocs: {
        terms: true,
        privacy: false,
        cookies: false,
        'age-declaration': false,
      },
      allRead: false,
      onDocRead: vi.fn().mockResolvedValue(undefined),
    });

    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });
});

describe('MultiDocumentConsent — checkbox', () => {
  it('el checkbox "Acepto" está disabled cuando no todos los docs están leídos', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox', { name: /Acepto/i });
    expect(checkbox).toBeDisabled();
  });

  it('el checkbox "Acepto" se habilita cuando allRead es true', () => {
    mockUseReadingEvidence.mockReturnValue({
      sessionToken: 'test-token',
      viewedDocs: {
        terms: true,
        privacy: true,
        cookies: true,
        'age-declaration': true,
      },
      allRead: true,
      onDocRead: vi.fn().mockResolvedValue(undefined),
    });

    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox', { name: /Acepto/i });
    expect(checkbox).not.toBeDisabled();
  });

  it('el checkbox tiene aria-describedby apuntando a la barra de progreso (WCAG AA)', () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox', { name: /Acepto/i });
    const describedBy = checkbox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const progressbar = document.getElementById(describedBy!);
    expect(progressbar).toBeInTheDocument();
  });

  it('checkbox disabled cuando prop disabled=true aunque allRead=true', () => {
    mockUseReadingEvidence.mockReturnValue({
      sessionToken: 'test-token',
      viewedDocs: {
        terms: true,
        privacy: true,
        cookies: true,
        'age-declaration': true,
      },
      allRead: true,
      onDocRead: vi.fn().mockResolvedValue(undefined),
    });

    render(<MultiDocumentConsent onConsentChange={vi.fn()} disabled={true} />);
    const checkbox = screen.getByRole('checkbox', { name: /Acepto/i });
    expect(checkbox).toBeDisabled();
  });
});

describe('MultiDocumentConsent — onConsentChange callback', () => {
  it('dispara onConsentChange con consented=false en renderizado inicial', () => {
    const onConsentChange = vi.fn();
    render(<MultiDocumentConsent onConsentChange={onConsentChange} />);
    expect(onConsentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        consented: false,
        sessionToken: 'test-session-token-uuid4',
      })
    );
  });

  it('dispara onConsentChange con consented=true al marcar el checkbox tras leer los 4 docs', async () => {
    mockUseReadingEvidence.mockReturnValue({
      sessionToken: 'test-token-full',
      viewedDocs: {
        terms: true,
        privacy: true,
        cookies: true,
        'age-declaration': true,
      },
      allRead: true,
      onDocRead: vi.fn().mockResolvedValue(undefined),
    });

    const onConsentChange = vi.fn();
    render(<MultiDocumentConsent onConsentChange={onConsentChange} />);

    const checkbox = screen.getByRole('checkbox', { name: /Acepto/i });
    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(onConsentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        consented: true,
        sessionToken: 'test-token-full',
        viewedDocs: {
          terms: true,
          privacy: true,
          cookies: true,
          'age-declaration': true,
        },
      })
    );
  });
});

describe('MultiDocumentConsent — modales de documentos', () => {
  it('click en "Leer" de Términos y Condiciones abre el modal correspondiente', async () => {
    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);

    const leerButtons = screen.getAllByRole('button', { name: /Leer/i });
    await act(async () => {
      fireEvent.click(leerButtons[0]);
    });

    expect(screen.getByTestId('modal-terms')).toBeInTheDocument();
  });

  it('cerrar modal sin scroll (scrolled=false) no marca el doc como leído', async () => {
    const onDocRead = vi.fn().mockResolvedValue(undefined);
    mockUseReadingEvidence.mockReturnValue({
      sessionToken: 'test-token',
      viewedDocs: {
        terms: false,
        privacy: false,
        cookies: false,
        'age-declaration': false,
      },
      allRead: false,
      onDocRead,
    });

    render(<MultiDocumentConsent onConsentChange={vi.fn()} />);

    // Abrir modal terms
    const leerButtons = screen.getAllByRole('button', { name: /Leer/i });
    await act(async () => {
      fireEvent.click(leerButtons[0]);
    });

    // Cerrar modal (botón Cerrar en el mock)
    await act(async () => {
      fireEvent.click(screen.getByText('Cerrar'));
    });

    // onDocRead se llama con scrolled=false (cierre sin scroll)
    expect(onDocRead).toHaveBeenCalledWith('terms', false);
  });
});
