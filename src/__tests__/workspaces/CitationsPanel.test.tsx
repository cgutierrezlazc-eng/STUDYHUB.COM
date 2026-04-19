/**
 * Tests TDD para CitationsPanel.
 * RED: deben fallar hasta que se implemente el componente.
 *
 * Criterios:
 * 1. Renderiza sin citas (estado vacío)
 * 2. Muestra cita válida con indicador verde
 * 3. Muestra cita inválida con indicador rojo
 * 4. Muestra errores de cita inválida
 * 5. Muestra botón "Aplicar sugerencia" solo cuando suggested no está vacío
 * 6. Botón "Revalidar" está presente
 * 7. Click en "Revalidar" llama a validateCitations
 * 8. Loading state durante revalidación
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CitationsPanel from '../../components/workspaces/Citations/CitationsPanel';
import * as api from '../../services/workspacesApi';
import type { CitationValidationResult } from '../../../shared/workspaces-types';

// Silenciar advertencias de act()
beforeEach(() => {
  vi.restoreAllMocks();
});

const VALID_RESULT: CitationValidationResult = {
  id: 'c0',
  valid: true,
  errors: [],
  suggested: '',
};

const INVALID_RESULT: CitationValidationResult = {
  id: 'c1',
  valid: false,
  errors: ['Falta coma entre el apellido del autor y el año.'],
  suggested: '(García, 2020)',
};

describe('CitationsPanel — render inicial', () => {
  it('renderiza sin citas con mensaje de estado vacío', () => {
    render(<CitationsPanel docId="doc-123" initialResults={[]} />);
    expect(screen.getByText(/no se detectaron citas/i)).toBeInTheDocument();
  });

  it('muestra botón Revalidar', () => {
    render(<CitationsPanel docId="doc-123" initialResults={[]} />);
    expect(screen.getByRole('button', { name: /revalidar/i })).toBeInTheDocument();
  });
});

describe('CitationsPanel — estado de citas', () => {
  it('muestra cita válida con indicador de estado verde', () => {
    render(<CitationsPanel docId="doc-123" initialResults={[VALID_RESULT]} />);
    const indicator = screen.getByTestId('citation-status-c0');
    expect(indicator).toHaveAttribute('data-valid', 'true');
  });

  it('muestra cita inválida con indicador de estado rojo', () => {
    render(<CitationsPanel docId="doc-123" initialResults={[INVALID_RESULT]} />);
    const indicator = screen.getByTestId('citation-status-c1');
    expect(indicator).toHaveAttribute('data-valid', 'false');
  });

  it('muestra el mensaje de error de la cita inválida', () => {
    render(<CitationsPanel docId="doc-123" initialResults={[INVALID_RESULT]} />);
    expect(screen.getByText(/falta coma entre el apellido/i)).toBeInTheDocument();
  });

  it('muestra botón Aplicar sugerencia solo cuando suggested no está vacío', () => {
    render(<CitationsPanel docId="doc-123" initialResults={[VALID_RESULT, INVALID_RESULT]} />);
    // VALID_RESULT.suggested === '' → no debe haber botón para c0
    const applyButtons = screen.queryAllByRole('button', {
      name: /aplicar sugerencia/i,
    });
    expect(applyButtons).toHaveLength(1);
  });
});

describe('CitationsPanel — interacción Revalidar', () => {
  it('llama validateCitations al hacer click en Revalidar', async () => {
    const mockValidate = vi
      .spyOn(api, 'validateCitations')
      .mockResolvedValue({ results: [VALID_RESULT] });

    render(
      <CitationsPanel
        docId="doc-123"
        initialResults={[INVALID_RESULT]}
        rawCitations={[{ id: 'c1', raw: 'García 2020' }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /revalidar/i }));

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith('doc-123', [{ id: 'c1', raw: 'García 2020' }]);
    });
  });

  it('muestra estado de carga durante la revalidación', async () => {
    vi.spyOn(api, 'validateCitations').mockImplementation(
      () => new Promise(() => {}) // nunca resuelve
    );

    render(
      <CitationsPanel
        docId="doc-123"
        initialResults={[INVALID_RESULT]}
        rawCitations={[{ id: 'c1', raw: 'García 2020' }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /revalidar/i }));

    await waitFor(() => {
      expect(screen.getByTestId('citations-loading')).toBeInTheDocument();
    });
  });
});
