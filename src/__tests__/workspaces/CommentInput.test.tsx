/**
 * Tests de CommentInput — textarea con autocomplete de menciones @.
 * Cubre: typing @ abre dropdown, filtra miembros, seleccionar inserta,
 * Enter envía, Shift+Enter no envía.
 *
 * Sub-bloque 2d.8 Comentarios inline + Menciones.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CommentInput from '../../components/workspaces/Comments/CommentInput';
import type { WorkspaceMember } from '../../../shared/workspaces-types';

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
  {
    id: 'm-3',
    workspace_id: 'ws-1',
    user_id: 'u-3',
    role: 'viewer',
    chars_contributed: 0,
    invited_at: '2026-04-18T00:00:00Z',
    user: { id: 'u-3', name: 'Beatriz Martínez', email: 'bea@test.com' },
  },
];

const BASE_PROPS = {
  members: MOCK_MEMBERS,
  placeholder: 'Escribe un comentario...',
  onSubmit: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CommentInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el textarea con el placeholder dado', () => {
    render(<CommentInput {...BASE_PROPS} />);
    expect(screen.getByPlaceholderText('Escribe un comentario...')).toBeTruthy();
  });

  it('tipear @ abre el dropdown de menciones', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.type(textarea, '@');
    // El dropdown debe aparecer con todos los miembros
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('filtrar por nombre después del @ muestra solo miembros coincidentes', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.type(textarea, '@car');
    // Solo Carlos debe aparecer — buscar por la opción del listbox
    const listbox = screen.getByRole('listbox');
    expect(listbox.textContent).toMatch(/Carlos/i);
    expect(listbox.textContent).not.toMatch(/Ana/i);
    expect(listbox.textContent).not.toMatch(/Beatriz/i);
  });

  it('seleccionar miembro del dropdown inserta @username en el texto', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.type(textarea, '@car');
    // Hacer click en la opción (li con role="option") que contiene "Carlos"
    const options = screen.getAllByRole('option');
    const carlosOption = options.find((o) => o.textContent?.match(/Carlos/i));
    expect(carlosOption).toBeTruthy();
    fireEvent.mouseDown(carlosOption!);
    // El textarea debe tener @carlos (username derivado del nombre)
    const input = screen.getByPlaceholderText('Escribe un comentario...') as HTMLTextAreaElement;
    expect(input.value).toMatch(/@[Cc]arlos/);
  });

  it('el dropdown se cierra después de seleccionar un miembro', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.type(textarea, '@car');
    // Hacer click en la opción (li con role="option") usando mouseDown
    const options = screen.getAllByRole('option');
    const carlosOption = options.find((o) => o.textContent?.match(/Carlos/i));
    expect(carlosOption).toBeTruthy();
    fireEvent.mouseDown(carlosOption!);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Enter envía el comentario y llama a onSubmit con el contenido', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.type(textarea, 'Un comentario de prueba');
    await user.keyboard('{Enter}');
    expect(BASE_PROPS.onSubmit).toHaveBeenCalledWith('Un comentario de prueba');
  });

  it('Shift+Enter inserta salto de línea en lugar de enviar', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.type(textarea, 'Línea uno');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    // onSubmit NO debe haberse llamado
    expect(BASE_PROPS.onSubmit).not.toHaveBeenCalled();
  });

  it('renderiza con initialValue pre-llenado cuando se proporciona', () => {
    render(<CommentInput {...BASE_PROPS} initialValue="Texto previo del comentario" />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Texto previo del comentario');
  });

  it('no envía si el textarea está vacío al presionar Enter', async () => {
    const user = userEvent.setup();
    render(<CommentInput {...BASE_PROPS} />);
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(BASE_PROPS.onSubmit).not.toHaveBeenCalled();
  });
});
