/**
 * Tests de SuggestionCard — tarjeta de sugerencia Athena con acciones apply/modify/reject.
 *
 * Bloque 2c Athena IA.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPatchAthenaSuggestion, mockDeleteAthenaSuggestion } = vi.hoisted(() => ({
  mockPatchAthenaSuggestion: vi.fn().mockResolvedValue({ ok: true }),
  mockDeleteAthenaSuggestion: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../services/workspacesApi', () => ({
  patchAthenaSuggestion: mockPatchAthenaSuggestion,
  deleteAthenaSuggestion: mockDeleteAthenaSuggestion,
  listWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  getWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  listMembers: vi.fn(),
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
  deleteAthenaChats: vi.fn(),
}));

import SuggestionCard from '../../components/workspaces/Athena/SuggestionCard';
import type { AthenaSuggestion } from '../../../shared/workspaces-types';

const MOCK_BRIDGE = {
  applyText: vi.fn(),
  getSelection: vi.fn().mockReturnValue(null),
};

const PENDING_SUGGESTION: AthenaSuggestion = {
  id: 'sug-1',
  stagingContent: 'El combate naval fue importante.',
  suggestionContent:
    'El combate naval de Iquique, ocurrido el 21 de mayo de 1879, fue un hito histórico.',
  status: 'pending',
  createdAt: '2026-04-18T10:00:00Z',
};

const APPLIED_SUGGESTION: AthenaSuggestion = {
  ...PENDING_SUGGESTION,
  id: 'sug-2',
  status: 'applied',
};

const REJECTED_SUGGESTION: AthenaSuggestion = {
  ...PENDING_SUGGESTION,
  id: 'sug-3',
  status: 'rejected',
};

describe('SuggestionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el contenido original (staging) y la sugerencia', () => {
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={PENDING_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.getByText(/El combate naval fue importante/)).toBeTruthy();
    expect(screen.getByText(/hito histórico/)).toBeTruthy();
  });

  it('muestra botones Aplicar, Modificar, Rechazar y Eliminar en estado pending', () => {
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={PENDING_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /modificar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeTruthy();
  });

  it('click en Aplicar llama editorBridge.applyText y patchAthenaSuggestion', async () => {
    const onStatusChange = vi.fn();
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={PENDING_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /aplicar/i }));

    await waitFor(() => {
      expect(MOCK_BRIDGE.applyText).toHaveBeenCalledWith(
        PENDING_SUGGESTION.suggestionContent,
        expect.any(String)
      );
      expect(mockPatchAthenaSuggestion).toHaveBeenCalledWith('ws-1', 'sug-1', {
        status: 'applied',
      });
    });
  });

  it('click en Rechazar llama patchAthenaSuggestion con status=rejected', async () => {
    const onStatusChange = vi.fn();
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={PENDING_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /rechazar/i }));

    await waitFor(() => {
      expect(mockPatchAthenaSuggestion).toHaveBeenCalledWith('ws-1', 'sug-1', {
        status: 'rejected',
      });
    });
  });

  it('click en Modificar abre un textarea con el contenido de la sugerencia', async () => {
    const user = userEvent.setup();
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={PENDING_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /modificar/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  });

  it('muestra estilo distinto en estado applied', () => {
    const { container } = render(
      <SuggestionCard
        docId="ws-1"
        suggestion={APPLIED_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={vi.fn()}
      />
    );
    // La card debe tener un indicador de estado applied
    expect(
      container.querySelector('[data-status="applied"]') ?? screen.queryByText(/aplicada/i)
    ).toBeTruthy();
  });

  it('muestra estilo distinto en estado rejected', () => {
    const { container } = render(
      <SuggestionCard
        docId="ws-1"
        suggestion={REJECTED_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={vi.fn()}
      />
    );
    expect(
      container.querySelector('[data-status="rejected"]') ?? screen.queryByText(/rechazada/i)
    ).toBeTruthy();
  });

  it('click en Eliminar llama deleteAthenaSuggestion', async () => {
    const onStatusChange = vi.fn();
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={PENDING_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(mockDeleteAthenaSuggestion).toHaveBeenCalledWith('ws-1', 'sug-1');
    });
  });

  it('no muestra Aplicar ni Rechazar cuando la sugerencia ya está applied', () => {
    render(
      <SuggestionCard
        docId="ws-1"
        suggestion={APPLIED_SUGGESTION}
        editorBridge={{ current: MOCK_BRIDGE }}
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /^aplicar$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^rechazar$/i })).toBeNull();
  });
});
