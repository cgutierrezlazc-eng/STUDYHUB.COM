/**
 * Tests TDD para RubricUploadModal — modal de upload de rúbrica.
 *
 * Cubre:
 * 1. render inicial: botón "Parsear" y textarea visibles
 * 2. pegar texto y parsear retorna ítems (mock ok)
 * 3. upload archivo y parsear retorna ítems (mock ok)
 * 4. warning banner visible tras parseo con warnings
 * 5. cerrar modal al hacer click en botón "Cancelar"
 * 6. error de API al parsear muestra mensaje de error
 *
 * Bloque 2d.6 Rúbrica.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks de servicios ────────────────────────────────────────────────────────

const { mockUploadRubricText, mockUploadRubricFile } = vi.hoisted(() => ({
  mockUploadRubricText: vi.fn(),
  mockUploadRubricFile: vi.fn(),
}));

vi.mock('../../services/workspacesApi', () => ({
  uploadRubricText: mockUploadRubricText,
  uploadRubricFile: mockUploadRubricFile,
  // resto no importa
  getRubric: vi.fn(),
  listWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  getWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  listMembers: vi.fn(),
  addMember: vi.fn(),
  updateMember: vi.fn(),
  removeMember: vi.fn(),
  listVersions: vi.fn(),
  createVersion: vi.fn(),
  restoreVersion: vi.fn(),
  validateInviteToken: vi.fn(),
  acceptInvite: vi.fn(),
  updateContributionMetric: vi.fn(),
  listChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  deleteChatMessage: vi.fn(),
  pingAthena: vi.fn(),
  listAthenaChats: vi.fn(),
  listAthenaSuggestions: vi.fn(),
  getAthenaUsage: vi.fn(),
  athenaAnalyze: vi.fn(),
  athenaChat: vi.fn(),
  athenaSuggest: vi.fn(),
  patchAthenaSuggestion: vi.fn(),
  deleteAthenaSuggestion: vi.fn(),
  deleteAthenaChats: vi.fn(),
  validateCitations: vi.fn(),
}));

import RubricUploadModal from '../../components/workspaces/Rubric/RubricUploadModal';

const MOCK_ITEMS = [
  { id: 'r1', title: 'Introducción', points: 20, description: 'Claridad' },
  { id: 'r2', title: 'Desarrollo', points: 40, description: 'Argumento' },
];

describe('RubricUploadModal', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza con botón "Parsear", textarea y botón "Cancelar"', () => {
    render(<RubricUploadModal docId="doc-1" onSave={mockOnSave} onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /parsear/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/pega el texto/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeTruthy();
    // El botón "Guardar" NO debe estar visible hasta después de parsear
    expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull();
  });

  it('pegar texto y parsear ok muestra los ítems parseados', async () => {
    mockUploadRubricText.mockResolvedValue({ items: MOCK_ITEMS, warnings: [] });

    render(<RubricUploadModal docId="doc-2" onSave={mockOnSave} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/pega el texto/i);
    fireEvent.change(textarea, { target: { value: 'Criterio 1: intro (20 pts)' } });

    fireEvent.click(screen.getByRole('button', { name: /parsear/i }));

    await waitFor(() => {
      expect(screen.getByText('Introducción')).toBeTruthy();
      expect(screen.getByText('Desarrollo')).toBeTruthy();
    });
    expect(mockUploadRubricText).toHaveBeenCalledWith('doc-2', 'Criterio 1: intro (20 pts)');
    // Botón Guardar aparece ahora
    expect(screen.getByRole('button', { name: /guardar/i })).toBeTruthy();
  });

  it('upload archivo y parsear ok llama uploadRubricFile', async () => {
    mockUploadRubricFile.mockResolvedValue({ items: MOCK_ITEMS, warnings: [] });

    render(<RubricUploadModal docId="doc-3" onSave={mockOnSave} onClose={mockOnClose} />);

    const file = new File(['pdf content'], 'rubrica.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/seleccionar archivo/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /parsear/i }));

    await waitFor(() => {
      expect(mockUploadRubricFile).toHaveBeenCalledWith('doc-3', file);
      expect(screen.getByText('Introducción')).toBeTruthy();
    });
  });

  it('warning banner visible tras parseo con warnings', async () => {
    mockUploadRubricText.mockResolvedValue({
      items: MOCK_ITEMS,
      warnings: ['No se pudo extraer página 3'],
    });

    render(<RubricUploadModal docId="doc-4" onSave={mockOnSave} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/pega el texto/i);
    fireEvent.change(textarea, { target: { value: 'texto con problemas' } });
    fireEvent.click(screen.getByRole('button', { name: /parsear/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se pudo extraer página 3/i)).toBeTruthy();
    });
  });

  it('cerrar modal al hacer click en "Cancelar" llama onClose', () => {
    render(<RubricUploadModal docId="doc-5" onSave={mockOnSave} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('error de API al parsear muestra mensaje de error', async () => {
    mockUploadRubricText.mockRejectedValue(new Error('Formato no soportado'));

    render(<RubricUploadModal docId="doc-6" onSave={mockOnSave} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/pega el texto/i);
    fireEvent.change(textarea, { target: { value: 'texto mal formateado' } });
    fireEvent.click(screen.getByRole('button', { name: /parsear/i }));

    await waitFor(() => {
      expect(screen.getByText(/formato no soportado/i)).toBeTruthy();
    });
  });
});
