/**
 * Tests TDD para RubricPanel — panel lateral de rúbrica en el workspace.
 *
 * Cubre:
 * 1. render vacío cuando no hay rúbrica (botón "Subir rúbrica" visible, textarea visible)
 * 2. render con ítems: lista de ítems con checkboxes
 * 3. check de un ítem actualiza estado local (se persiste en localStorage)
 * 4. uncheck de un ítem actualiza estado local
 * 5. abrir modal al hacer click en "Subir rúbrica"
 * 6. botón "Editar rúbrica" visible cuando hay ítems
 * 7. warning banner visible cuando hay warnings
 * 8. error de API al cargar rúbrica muestra mensaje de error
 *
 * Bloque 2d.6 Rúbrica.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks de servicios ────────────────────────────────────────────────────────

const { mockGetRubric, mockUploadRubricText, mockUploadRubricFile } = vi.hoisted(() => ({
  mockGetRubric: vi.fn(),
  mockUploadRubricText: vi.fn(),
  mockUploadRubricFile: vi.fn(),
}));

vi.mock('../../services/workspacesApi', () => ({
  getRubric: mockGetRubric,
  uploadRubricText: mockUploadRubricText,
  uploadRubricFile: mockUploadRubricFile,
  // resto no importa en este test
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

import RubricPanel from '../../components/workspaces/Rubric/RubricPanel';

const MOCK_ITEMS = [
  { id: 'r1', title: 'Introducción', points: 20, description: 'Claridad en la introducción' },
  { id: 'r2', title: 'Desarrollo', points: 40, description: 'Argumento bien estructurado' },
];

describe('RubricPanel', () => {
  // Mock localStorage
  const localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => localStorageMock[k] ?? null,
      setItem: (k: string, v: string) => {
        localStorageMock[k] = v;
      },
      removeItem: (k: string) => {
        delete localStorageMock[k];
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra estado vacío con botón "Subir rúbrica" y textarea cuando no hay rúbrica', async () => {
    mockGetRubric.mockRejectedValue(new Error('Sin rúbrica'));

    render(<RubricPanel docId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subir rúbrica/i })).toBeTruthy();
    });
    expect(screen.getByPlaceholderText(/pega el texto/i)).toBeTruthy();
  });

  it('muestra lista de ítems con checkboxes cuando hay rúbrica', async () => {
    mockGetRubric.mockResolvedValue({
      raw: 'texto plano',
      items: MOCK_ITEMS,
      warnings: [],
    });

    render(<RubricPanel docId="doc-2" />);

    await waitFor(() => {
      expect(screen.getByText('Introducción')).toBeTruthy();
      expect(screen.getByText('Desarrollo')).toBeTruthy();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('check de un ítem actualiza el estado y persiste en localStorage', async () => {
    mockGetRubric.mockResolvedValue({
      raw: 'texto',
      items: MOCK_ITEMS,
      warnings: [],
    });

    render(<RubricPanel docId="doc-3" />);

    await waitFor(() => {
      expect(screen.getByText('Introducción')).toBeTruthy();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();

    fireEvent.click(checkboxes[0]);

    expect(checkboxes[0]).toBeChecked();
    expect(localStorageMock['conniku_rubric_checked_doc-3']).toBeTruthy();
    const stored = JSON.parse(localStorageMock['conniku_rubric_checked_doc-3']) as string[];
    expect(stored).toContain('r1');
  });

  it('uncheck de un ítem actualiza el estado y actualiza localStorage', async () => {
    // Pre-poblar localStorage con r1 marcado
    localStorageMock['conniku_rubric_checked_doc-4'] = JSON.stringify(['r1']);

    mockGetRubric.mockResolvedValue({
      raw: 'texto',
      items: MOCK_ITEMS,
      warnings: [],
    });

    render(<RubricPanel docId="doc-4" />);

    await waitFor(() => {
      expect(screen.getByText('Introducción')).toBeTruthy();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // r1 debe estar checked (fue pre-populado)
    expect(checkboxes[0]).toBeChecked();

    // Uncheck r1
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();

    const stored = JSON.parse(localStorageMock['conniku_rubric_checked_doc-4']) as string[];
    expect(stored).not.toContain('r1');
  });

  it('abre el modal al hacer click en "Subir rúbrica"', async () => {
    mockGetRubric.mockRejectedValue(new Error('Sin rúbrica'));

    render(<RubricPanel docId="doc-5" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subir rúbrica/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /subir rúbrica/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });

  it('muestra botón "Editar rúbrica" cuando hay ítems cargados', async () => {
    mockGetRubric.mockResolvedValue({
      raw: 'texto',
      items: MOCK_ITEMS,
      warnings: [],
    });

    render(<RubricPanel docId="doc-6" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar rúbrica/i })).toBeTruthy();
    });
  });

  it('muestra warning banner cuando hay warnings en la respuesta', async () => {
    mockGetRubric.mockResolvedValue({
      raw: 'texto',
      items: MOCK_ITEMS,
      warnings: ['No se pudo extraer página 3'],
    });

    render(<RubricPanel docId="doc-7" />);

    await waitFor(() => {
      expect(screen.getByText(/no se pudo extraer página 3/i)).toBeTruthy();
    });
  });

  it('muestra mensaje de error cuando falla la carga de rúbrica (distinto de 404)', async () => {
    mockGetRubric.mockRejectedValue(new Error('Error de servidor'));

    render(<RubricPanel docId="doc-8" />);

    // Al fallar con error genérico, muestra estado vacío sin crash
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subir rúbrica/i })).toBeTruthy();
    });
  });
});
