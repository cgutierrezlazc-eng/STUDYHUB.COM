/**
 * Tests de CommentThread — card de thread con replies.
 * Cubre: render thread + replies, botones visibles según permisos,
 * click reply abre input, click edit muestra input pre-llenado,
 * resolver llama callback.
 *
 * Sub-bloque 2d.8 Comentarios inline + Menciones.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import CommentThread from '../../components/workspaces/Comments/CommentThread';
import type { WorkspaceComment } from '../../../shared/workspaces-types';
import type { WorkspaceMember } from '../../../shared/workspaces-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_COMMENT: WorkspaceComment = {
  id: 'c-1',
  workspace_id: 'ws-1',
  user_id: 'u-1',
  anchor_id: 'anchor-abc',
  content: 'Este es el comentario raíz.',
  resolved: false,
  parent_id: null,
  created_at: '2026-04-18T10:00:00Z',
  mentions: [],
};

const MOCK_REPLY: WorkspaceComment = {
  id: 'c-2',
  workspace_id: 'ws-1',
  user_id: 'u-2',
  anchor_id: 'anchor-abc',
  content: 'Esta es una respuesta al comentario.',
  resolved: false,
  parent_id: 'c-1',
  created_at: '2026-04-18T10:05:00Z',
  mentions: [],
};

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

const BASE_PROPS = {
  comment: MOCK_COMMENT,
  replies: [],
  currentUser: { userId: 'u-1', name: 'Ana García', role: 'owner' as const },
  members: MOCK_MEMBERS,
  onReply: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onResolve: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CommentThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el contenido del comentario raíz', () => {
    render(<CommentThread {...BASE_PROPS} />);
    expect(screen.getByText('Este es el comentario raíz.')).toBeTruthy();
  });

  it('renderiza el nombre del autor del comentario raíz', () => {
    render(<CommentThread {...BASE_PROPS} />);
    expect(screen.getByText('Ana García')).toBeTruthy();
  });

  it('renderiza las replies indentadas cuando se proporcionan', () => {
    render(<CommentThread {...BASE_PROPS} replies={[MOCK_REPLY]} />);
    expect(screen.getByText('Esta es una respuesta al comentario.')).toBeTruthy();
    expect(screen.getByText('Carlos López')).toBeTruthy();
  });

  it('botón Editar visible solo para el autor del comentario (u-1 ve Editar en su propio comentario)', () => {
    render(<CommentThread {...BASE_PROPS} />);
    // El owner que es también autor debe ver Editar
    expect(screen.getByRole('button', { name: /editar/i })).toBeTruthy();
  });

  it('botón Editar NO visible para un usuario que no es autor del comentario', () => {
    const propsNonAuthor = {
      ...BASE_PROPS,
      currentUser: { userId: 'u-2', name: 'Carlos López', role: 'editor' as const },
    };
    render(<CommentThread {...propsNonAuthor} />);
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
  });

  it('click en Responder llama a onReply con el id del comentario raíz', () => {
    render(<CommentThread {...BASE_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /responder/i }));
    expect(BASE_PROPS.onReply).toHaveBeenCalledWith('c-1');
  });

  it('click en Editar llama a onEdit con id y contenido actual', () => {
    render(<CommentThread {...BASE_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(BASE_PROPS.onEdit).toHaveBeenCalledWith('c-1', 'Este es el comentario raíz.');
  });

  it('click en Resolver llama a onResolve con id y resolved=true cuando no está resuelto', () => {
    render(<CommentThread {...BASE_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /resolver/i }));
    expect(BASE_PROPS.onResolve).toHaveBeenCalledWith('c-1', true);
  });

  it('muestra "Reabierto" o botón Reabrir cuando el comentario ya está resuelto', () => {
    const resolvedComment = { ...MOCK_COMMENT, resolved: true };
    render(<CommentThread {...BASE_PROPS} comment={resolvedComment} />);
    // Debe mostrar un indicador de "resuelto" o botón para reabrir
    expect(
      screen.queryByRole('button', { name: /reabrir/i }) ?? screen.queryByText(/resuelto/i)
    ).toBeTruthy();
  });

  it('muestra mención @username en el contenido del comentario', () => {
    const commentWithMention: WorkspaceComment = {
      ...MOCK_COMMENT,
      content: 'Hola @carlos esto es para ti.',
      mentions: ['u-2'],
    };
    render(<CommentThread {...BASE_PROPS} comment={commentWithMention} />);
    expect(screen.getByText(/hola.*carlos.*para ti/i)).toBeTruthy();
  });
});
