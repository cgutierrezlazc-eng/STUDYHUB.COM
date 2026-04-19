/**
 * Tests del componente AthenaChat — chat privado con Athena.
 *
 * Cubre: envío de mensaje optimista, recepción de respuesta,
 * error 429 abre modal upgrade, botón limpiar conversación.
 *
 * Bloque 2c Athena IA.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockAthenaChat, mockDeleteAthenaChats } = vi.hoisted(() => ({
  mockAthenaChat: vi.fn().mockResolvedValue({ result: 'Respuesta de Athena.' }),
  mockDeleteAthenaChats: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../services/workspacesApi', async (importActual) => {
  const actual = await importActual<typeof import('../../services/workspacesApi')>();
  return {
    ...actual,
    athenaChat: mockAthenaChat,
    deleteAthenaChats: mockDeleteAthenaChats,
    listWorkspaces: vi.fn(),
    createWorkspace: vi.fn(),
    getWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    listMembers: vi.fn(),
    listChatMessages: vi.fn(),
    sendChatMessage: vi.fn(),
    deleteChatMessage: vi.fn(),
    pingAthena: vi.fn().mockResolvedValue({ ok: true, claude_available: true }),
    listAthenaChats: vi.fn().mockResolvedValue({ chats: [] }),
    listAthenaSuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
    getAthenaUsage: vi.fn().mockResolvedValue({ plan: 'free', used: 0, limit: 3, remaining: 3 }),
    athenaAnalyze: vi.fn(),
    athenaSuggest: vi.fn(),
    patchAthenaSuggestion: vi.fn(),
    deleteAthenaSuggestion: vi.fn(),
  };
});

import AthenaChat from '../../components/workspaces/Athena/AthenaChat';

const MOCK_USER = { userId: 'u-1', name: 'Ana García' };

describe('AthenaChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAthenaChat.mockResolvedValue({ result: 'Respuesta de Athena.' });
    mockDeleteAthenaChats.mockResolvedValue({ ok: true });
  });

  it('renderiza el área de chat con input y botón Enviar', () => {
    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox', { name: /mensaje/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeTruthy();
  });

  it('muestra el mensaje de bienvenida de Athena al inicio', () => {
    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );
    expect(screen.getByText(/hola.*athena|soy athena/i)).toBeTruthy();
  });

  it('envía un mensaje y muestra respuesta de Athena', async () => {
    const user = userEvent.setup();
    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, '¿Puedes revisar mi texto?');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockAthenaChat).toHaveBeenCalledWith(
        'ws-1',
        '¿Puedes revisar mi texto?',
        expect.any(Array)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Respuesta de Athena.')).toBeTruthy();
    });
  });

  it('muestra actualización optimista del mensaje antes de recibir respuesta', async () => {
    const user = userEvent.setup();
    // Delay en la respuesta para capturar estado intermedio
    mockAthenaChat.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ result: 'Respuesta' }), 200))
    );

    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, 'Mensaje de prueba');
    await user.keyboard('{Enter}');

    // El mensaje del usuario aparece inmediatamente (optimistic)
    expect(screen.getByText('Mensaje de prueba')).toBeTruthy();
  });

  it('llama onQuotaExceeded cuando recibe error con code athena-quota', async () => {
    const onQuotaExceeded = vi.fn();
    const user = userEvent.setup();
    const quotaError = new Error('Cupo agotado');
    (quotaError as Error & { code?: string }).code = 'athena-quota';
    mockAthenaChat.mockRejectedValue(quotaError);

    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={onQuotaExceeded}
      />
    );

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, 'Pregunta');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(onQuotaExceeded).toHaveBeenCalled();
    });
  });

  it('no envía mensaje vacío', async () => {
    const user = userEvent.setup();
    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    expect(mockAthenaChat).not.toHaveBeenCalled();
  });

  it('limpia la conversación al confirmar el botón Limpiar', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /limpiar/i });
    await user.click(clearBtn);

    await waitFor(() => {
      expect(mockDeleteAthenaChats).toHaveBeenCalledWith('ws-1');
    });
  });

  it('no limpia si el usuario cancela el confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <AthenaChat
        docId="ws-1"
        currentUser={MOCK_USER}
        initialChats={[]}
        onQuotaExceeded={vi.fn()}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /limpiar/i });
    await user.click(clearBtn);

    expect(mockDeleteAthenaChats).not.toHaveBeenCalled();
  });
});
