/**
 * Tests de los componentes GroupChat y MessageList.
 * Mockea workspacesApi para evitar llamadas HTTP.
 * No usa servidor WS real — simula mensajes vía props.
 *
 * Bloque 2b Colaboración.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks de servicios ────────────────────────────────────────────────────────

const { mockListChatMessages, mockSendChatMessage, mockDeleteChatMessage } = vi.hoisted(() => ({
  mockListChatMessages: vi.fn().mockResolvedValue({ messages: [] }),
  mockSendChatMessage: vi.fn((docId: string, content: string) =>
    Promise.resolve({
      id: `msg-server-${Date.now()}`,
      workspace_id: docId,
      user_id: 'u-1',
      content,
      created_at: new Date().toISOString(),
      status: 'sent',
    })
  ),
  mockDeleteChatMessage: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../services/workspacesApi', () => ({
  listChatMessages: mockListChatMessages,
  sendChatMessage: mockSendChatMessage,
  deleteChatMessage: mockDeleteChatMessage,
  // funciones existentes del 2a
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
}));

// ── Importar componentes bajo prueba ──────────────────────────────────────────

import GroupChat from '../../components/workspaces/Chat/GroupChat';
import MessageList from '../../components/workspaces/Chat/MessageList';
import type { WorkspaceMessage } from '../../../shared/workspaces-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MEMBERS = [
  {
    id: 'mem-1',
    workspace_id: 'ws-1',
    user_id: 'u-1',
    role: 'owner' as const,
    chars_contributed: 100,
    invited_at: '2026-04-18T00:00:00Z',
    user: { id: 'u-1', name: 'Ana García', email: 'ana@test.com', avatar: null },
  },
  {
    id: 'mem-2',
    workspace_id: 'ws-1',
    user_id: 'u-2',
    role: 'editor' as const,
    chars_contributed: 50,
    invited_at: '2026-04-18T00:00:00Z',
    user: { id: 'u-2', name: 'Luis Torres', email: 'luis@test.com', avatar: null },
  },
];

const SAMPLE_MESSAGES: WorkspaceMessage[] = [
  {
    id: 'msg-1',
    workspaceId: 'ws-1',
    userId: 'u-1',
    content: 'Hola a todos',
    createdAt: '2026-04-18T10:00:00Z',
    status: 'sent',
    user: { id: 'u-1', name: 'Ana García', avatar: null },
  },
  {
    id: 'msg-2',
    workspaceId: 'ws-1',
    userId: 'u-2',
    content: '¡Buenas! ¿Empezamos con la intro?',
    createdAt: '2026-04-18T10:01:00Z',
    status: 'sent',
    user: { id: 'u-2', name: 'Luis Torres', avatar: null },
  },
];

// ─── Tests de MessageList ────────────────────────────────────────────────────

describe('MessageList', () => {
  it('renderiza lista vacía con mensaje de placeholder', () => {
    render(<MessageList messages={[]} currentUserId="u-1" onDelete={vi.fn()} />);
    expect(screen.getByRole('list')).toBeTruthy();
  });

  it('renderiza los mensajes con nombre del autor y contenido', () => {
    render(<MessageList messages={SAMPLE_MESSAGES} currentUserId="u-1" onDelete={vi.fn()} />);
    expect(screen.getByText('Hola a todos')).toBeTruthy();
    expect(screen.getByText('¡Buenas! ¿Empezamos con la intro?')).toBeTruthy();
  });

  it('muestra botón de eliminar solo en mensajes propios', () => {
    const onDelete = vi.fn();
    render(<MessageList messages={SAMPLE_MESSAGES} currentUserId="u-1" onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    // Solo msg-1 es del usuario u-1
    expect(deleteButtons).toHaveLength(1);
  });

  it('llama onDelete con el id del mensaje al hacer click en eliminar', () => {
    const onDelete = vi.fn();
    render(<MessageList messages={SAMPLE_MESSAGES} currentUserId="u-1" onDelete={onDelete} />);
    const deleteBtn = screen.getByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('msg-1');
  });

  it('agrupa mensajes consecutivos del mismo autor', () => {
    const consecutiveMessages: WorkspaceMessage[] = [
      {
        id: 'msg-a',
        workspaceId: 'ws-1',
        userId: 'u-1',
        content: 'Primer mensaje',
        createdAt: '2026-04-18T10:00:00Z',
        status: 'sent',
        user: { id: 'u-1', name: 'Ana García', avatar: null },
      },
      {
        id: 'msg-b',
        workspaceId: 'ws-1',
        userId: 'u-1',
        content: 'Segundo mensaje',
        createdAt: '2026-04-18T10:00:30Z', // 30s después, mismo autor
        status: 'sent',
        user: { id: 'u-1', name: 'Ana García', avatar: null },
      },
    ];
    render(<MessageList messages={consecutiveMessages} currentUserId="u-1" onDelete={vi.fn()} />);
    // El nombre del autor solo aparece una vez (agrupados)
    const authorElements = screen.getAllByText('Ana García');
    expect(authorElements).toHaveLength(1);
  });

  it('renderiza mensaje con status "sending" con indicador visual', () => {
    const sendingMessages: WorkspaceMessage[] = [
      {
        id: 'msg-s',
        workspaceId: 'ws-1',
        userId: 'u-1',
        content: 'Enviando...',
        createdAt: new Date().toISOString(),
        status: 'sending',
        user: { id: 'u-1', name: 'Ana García', avatar: null },
      },
    ];
    render(<MessageList messages={sendingMessages} currentUserId="u-1" onDelete={vi.fn()} />);
    // El mensaje está presente
    expect(screen.getByText('Enviando...')).toBeTruthy();
    // Tiene clase o aria que indica estado enviando
    const msgEl = screen.getByText('Enviando...').closest('[data-status]');
    expect(msgEl?.getAttribute('data-status')).toBe('sending');
  });
});

// ─── Tests de GroupChat ──────────────────────────────────────────────────────

describe('GroupChat', () => {
  const mockCurrentUser = { userId: 'u-1', name: 'Ana García' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockListChatMessages.mockResolvedValue({ messages: [] });
    mockSendChatMessage.mockImplementation((docId: string, content: string) =>
      Promise.resolve({
        id: `msg-server-${Date.now()}`,
        workspace_id: docId,
        user_id: 'u-1',
        content,
        created_at: new Date().toISOString(),
        status: 'sent',
      })
    );
  });

  it('renderiza el área de chat con input y botón de envío', async () => {
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={true} />
    );
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /mensaje/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /enviar/i })).toBeTruthy();
    });
  });

  it('carga mensajes al montar el componente', async () => {
    mockListChatMessages.mockResolvedValue({ messages: SAMPLE_MESSAGES });
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={true} />
    );
    await waitFor(() => {
      expect(mockListChatMessages).toHaveBeenCalledWith('ws-1', expect.any(Object));
      expect(screen.getByText('Hola a todos')).toBeTruthy();
    });
  });

  it('envía mensaje al presionar Enter y muestra optimistic update', async () => {
    const user = userEvent.setup();
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={true} />
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /mensaje/i })).toBeTruthy();
    });

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, 'Mensaje de prueba');
    await user.keyboard('{Enter}');

    // El mensaje aparece optimistamente
    await waitFor(() => {
      expect(screen.getByText('Mensaje de prueba')).toBeTruthy();
    });

    // El input se limpia
    expect((input as HTMLInputElement).value).toBe('');
    // Se llamó a la API
    expect(mockSendChatMessage).toHaveBeenCalledWith('ws-1', 'Mensaje de prueba');
  });

  it('Shift+Enter crea salto de línea sin enviar', async () => {
    const user = userEvent.setup();
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={true} />
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /mensaje/i })).toBeTruthy();
    });

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, 'Primera línea');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    // No se envió
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('deshabilita input cuando isConnected es false', async () => {
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={false} />
    );

    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: /mensaje/i });
      expect(input).toBeDisabled();
    });
  });

  it('elimina mensaje propio al hacer click en eliminar', async () => {
    mockListChatMessages.mockResolvedValue({ messages: SAMPLE_MESSAGES });
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={true} />
    );

    await waitFor(() => {
      expect(screen.getByText('Hola a todos')).toBeTruthy();
    });

    const deleteBtn = screen.getByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteChatMessage).toHaveBeenCalledWith('ws-1', 'msg-1');
    });
  });

  it('no envía mensaje vacío', async () => {
    const user = userEvent.setup();
    render(
      <GroupChat docId="ws-1" members={MEMBERS} currentUser={mockCurrentUser} isConnected={true} />
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /mensaje/i })).toBeTruthy();
    });

    const input = screen.getByRole('textbox', { name: /mensaje/i });
    await user.type(input, '   '); // solo espacios
    await user.keyboard('{Enter}');

    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });
});
