/**
 * Tests de CommentsPanel — panel lateral de threads de comentarios.
 * Cubre: render lista, filtros, crear comment llama API,
 * muestra mentions correctamente.
 *
 * Sub-bloque 2d.8 Comentarios inline + Menciones.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks de servicios ────────────────────────────────────────────────────────

const {
  mockListComments,
  mockCreateComment,
  mockPatchComment,
  mockDeleteComment,
  mockResolveComment,
} = vi.hoisted(() => ({
  mockListComments: vi.fn().mockResolvedValue({ comments: [] }),
  mockCreateComment: vi.fn().mockResolvedValue({
    id: 'c-new',
    workspace_id: 'ws-1',
    user_id: 'u-1',
    anchor_id: '',
    content: 'Nuevo comentario',
    resolved: false,
    parent_id: null,
    created_at: '2026-04-18T10:00:00Z',
    mentions: [],
  }),
  mockPatchComment: vi.fn().mockResolvedValue({ ok: true }),
  mockDeleteComment: vi.fn().mockResolvedValue({ ok: true }),
  mockResolveComment: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../services/workspacesApi', () => ({
  listComments: mockListComments,
  createComment: mockCreateComment,
  patchComment: mockPatchComment,
  deleteComment: mockDeleteComment,
  resolveComment: mockResolveComment,
  // funciones existentes
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

// ── Importar componente bajo prueba ───────────────────────────────────────────

import CommentsPanel from '../../components/workspaces/Comments/CommentsPanel';
import type { WorkspaceMember } from '../../../shared/workspaces-types';
import type { WorkspaceComment } from '../../../shared/workspaces-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: WorkspaceMember[] = [
  {
    id: 'm-1',
    workspace_id: 'ws-1',
    user_id: 'u-1',
    role: 'owner',
    chars_contributed: 0,
    invited_at: '2026-04-18T00:00:00Z',
    user: { id: 'u-1', name: 'Ana García', email: 'ana@test.com' },
  },
  {
    id: 'm-2',
    workspace_id: 'ws-1',
    user_id: 'u-2',
    role: 'editor',
    chars_contributed: 0,
    invited_at: '2026-04-18T00:00:00Z',
    user: { id: 'u-2', name: 'Carlos López', email: 'carlos@test.com' },
  },
];

const MOCK_CURRENT_USER = {
  userId: 'u-1',
  name: 'Ana García',
  role: 'owner' as const,
};

const COMMENT_RESOLVED: WorkspaceComment = {
  id: 'c-3',
  workspace_id: 'ws-1',
  user_id: 'u-1',
  anchor_id: 'anchor-xyz',
  content: 'Comentario ya resuelto.',
  resolved: true,
  parent_id: null,
  created_at: '2026-04-18T09:00:00Z',
  mentions: [],
};

const COMMENT_WITH_MENTION: WorkspaceComment = {
  id: 'c-4',
  workspace_id: 'ws-1',
  user_id: 'u-2',
  anchor_id: 'anchor-ment',
  content: 'Hola @ana necesito tu ayuda.',
  resolved: false,
  parent_id: null,
  created_at: '2026-04-18T11:00:00Z',
  mentions: ['u-1'],
};

const BASE_PROPS = {
  docId: 'ws-1',
  currentUser: MOCK_CURRENT_USER,
  members: MOCK_MEMBERS,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CommentsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListComments.mockResolvedValue({ comments: [] });
  });

  it('llama a listComments al montar y muestra estado vacío', async () => {
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(mockListComments).toHaveBeenCalledWith('ws-1', undefined);
    });
    // Debe mostrar mensaje de "no hay comentarios" o similar
    expect(screen.getByText(/sin comentarios|no hay comentarios|aún no hay/i)).toBeTruthy();
  });

  it('renderiza un thread por cada comentario raíz', async () => {
    const comments: WorkspaceComment[] = [
      {
        id: 'c-1',
        workspace_id: 'ws-1',
        user_id: 'u-1',
        anchor_id: 'anchor-a',
        content: 'Primer comentario.',
        resolved: false,
        parent_id: null,
        created_at: '2026-04-18T10:00:00Z',
        mentions: [],
      },
      {
        id: 'c-2',
        workspace_id: 'ws-1',
        user_id: 'u-2',
        anchor_id: 'anchor-b',
        content: 'Segundo comentario.',
        resolved: false,
        parent_id: null,
        created_at: '2026-04-18T10:01:00Z',
        mentions: [],
      },
    ];
    mockListComments.mockResolvedValue({ comments });
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText('Primer comentario.')).toBeTruthy();
      expect(screen.getByText('Segundo comentario.')).toBeTruthy();
    });
  });

  it('filtro "Sin resolver" muestra solo comentarios no resueltos', async () => {
    const comments: WorkspaceComment[] = [
      {
        id: 'c-1',
        workspace_id: 'ws-1',
        user_id: 'u-1',
        anchor_id: 'anchor-a',
        content: 'Comentario abierto.',
        resolved: false,
        parent_id: null,
        created_at: '2026-04-18T10:00:00Z',
        mentions: [],
      },
      COMMENT_RESOLVED,
    ];
    mockListComments.mockResolvedValue({ comments });
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText('Comentario abierto.')).toBeTruthy();
    });
    // Activar filtro "Sin resolver"
    fireEvent.click(screen.getByRole('button', { name: /sin resolver/i }));
    await waitFor(() => {
      expect(screen.getByText('Comentario abierto.')).toBeTruthy();
      expect(screen.queryByText('Comentario ya resuelto.')).toBeNull();
    });
  });

  it('filtro "Mencionados a mí" muestra solo comentarios donde el user actual es mencionado', async () => {
    const comments: WorkspaceComment[] = [
      COMMENT_WITH_MENTION,
      {
        id: 'c-5',
        workspace_id: 'ws-1',
        user_id: 'u-2',
        anchor_id: 'anchor-noment',
        content: 'Comentario sin mención.',
        resolved: false,
        parent_id: null,
        created_at: '2026-04-18T12:00:00Z',
        mentions: [],
      },
    ];
    mockListComments.mockResolvedValue({ comments });
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText(/Hola @ana/i)).toBeTruthy();
    });
    // Activar filtro "Mencionados a mí"
    fireEvent.click(screen.getByRole('button', { name: /mencionados/i }));
    await waitFor(() => {
      expect(screen.getByText(/Hola @ana/i)).toBeTruthy();
      expect(screen.queryByText('Comentario sin mención.')).toBeNull();
    });
  });

  it('crear un nuevo comentario llama a createComment con docId y contenido', async () => {
    const user = userEvent.setup();
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(mockListComments).toHaveBeenCalled();
    });
    // Encontrar el input de nuevo comentario
    const textarea = screen.getByPlaceholderText(/nuevo comentario|añade un comentario|escribe/i);
    await user.click(textarea);
    await user.type(textarea, 'Nuevo comentario de prueba');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith(
        'ws-1',
        expect.objectContaining({
          content: 'Nuevo comentario de prueba',
        })
      );
    });
  });

  it('muestra correctamente el contenido con @mención en un comentario', async () => {
    mockListComments.mockResolvedValue({ comments: [COMMENT_WITH_MENTION] });
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText(/Hola @ana/i)).toBeTruthy();
    });
  });

  it('muestra los tres filtros: Todos, Sin resolver, Mencionados a mí', async () => {
    render(<CommentsPanel {...BASE_PROPS} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /todos/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /sin resolver/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /mencionados/i })).toBeTruthy();
    });
  });
});
