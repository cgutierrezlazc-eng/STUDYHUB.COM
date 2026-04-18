/**
 * Tests de CreateWorkspaceDialog.
 * Valida: validación de campos, envío correcto, comportamiento de cierre.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../../services/workspacesApi', () => ({
  createWorkspace: vi.fn(),
}));

import CreateWorkspaceDialog from '../../components/workspaces/Share/CreateWorkspaceDialog';
import * as workspacesApi from '../../services/workspacesApi';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateWorkspaceDialog — validación de campos', () => {
  it('renderiza sin crash', () => {
    const { container } = render(<CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('muestra el campo de título', () => {
    const { getByLabelText } = render(
      <CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />
    );
    expect(getByLabelText(/título/i)).toBeInTheDocument();
  });

  it('muestra el campo de nombre del curso', () => {
    const { getByLabelText } = render(
      <CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />
    );
    expect(getByLabelText(/ramo.*curso/i)).toBeInTheDocument();
  });

  it('el botón de submit está deshabilitado si el título está vacío', () => {
    const { getByRole } = render(<CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />);
    const submitBtn = getByRole('button', { name: /crear workspace/i });
    expect(submitBtn).toBeDisabled();
  });

  it('el botón de submit se habilita cuando el título tiene texto', () => {
    const { getByRole, getByLabelText } = render(
      <CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />
    );
    const titleInput = getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Mi nuevo doc' } });
    const submitBtn = getByRole('button', { name: /crear workspace/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('llama a onClose al hacer clic en Cancelar', () => {
    const onClose = vi.fn();
    const { getByRole } = render(<CreateWorkspaceDialog onClose={onClose} onCreated={() => {}} />);
    fireEvent.click(getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('llama a onClose al hacer clic en el botón cerrar (✕)', () => {
    const onClose = vi.fn();
    const { getByRole } = render(<CreateWorkspaceDialog onClose={onClose} onCreated={() => {}} />);
    fireEvent.click(getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('CreateWorkspaceDialog — envío correcto', () => {
  it('llama a createWorkspace con título, course_name y apa_edition al enviar', async () => {
    const mockWorkspace = {
      id: 'new-ws-1',
      title: 'Tesis Economía',
      course_name: 'ECO-401',
      apa_edition: '7' as const,
      owner_id: 'u1',
      is_completed: false,
      created_at: '2026-04-18T00:00:00Z',
      updated_at: '2026-04-18T00:00:00Z',
    };
    vi.mocked(workspacesApi.createWorkspace).mockResolvedValue(mockWorkspace);

    const onCreated = vi.fn();
    const { getByLabelText, getByRole } = render(
      <CreateWorkspaceDialog onClose={() => {}} onCreated={onCreated} />
    );

    fireEvent.change(getByLabelText(/título/i), {
      target: { value: 'Tesis Economía' },
    });
    fireEvent.change(getByLabelText(/ramo.*curso/i), {
      target: { value: 'ECO-401' },
    });

    fireEvent.click(getByRole('button', { name: /crear workspace/i }));

    await waitFor(() => {
      expect(workspacesApi.createWorkspace).toHaveBeenCalledOnce();
      const args = vi.mocked(workspacesApi.createWorkspace).mock.calls[0][0];
      expect(args.title).toBe('Tesis Economía');
      expect(args.course_name).toBe('ECO-401');
      expect(args.apa_edition).toBe('7');
    });

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(mockWorkspace);
    });
  });

  it('no envía course_name si el campo está vacío', async () => {
    const mockWorkspace = {
      id: 'new-ws-2',
      title: 'Doc sin curso',
      apa_edition: '7' as const,
      owner_id: 'u1',
      is_completed: false,
      created_at: '2026-04-18T00:00:00Z',
      updated_at: '2026-04-18T00:00:00Z',
    };
    vi.mocked(workspacesApi.createWorkspace).mockResolvedValue(mockWorkspace);

    const { getByLabelText, getByRole } = render(
      <CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />
    );

    fireEvent.change(getByLabelText(/título/i), {
      target: { value: 'Doc sin curso' },
    });

    fireEvent.click(getByRole('button', { name: /crear workspace/i }));

    await waitFor(() => {
      const args = vi.mocked(workspacesApi.createWorkspace).mock.calls[0][0];
      expect(args.course_name).toBeUndefined();
    });
  });

  it('muestra error si createWorkspace falla', async () => {
    vi.mocked(workspacesApi.createWorkspace).mockRejectedValue(new Error('Error del servidor'));

    const { getByLabelText, getByRole } = render(
      <CreateWorkspaceDialog onClose={() => {}} onCreated={() => {}} />
    );

    fireEvent.change(getByLabelText(/título/i), {
      target: { value: 'Doc con error' },
    });
    fireEvent.click(getByRole('button', { name: /crear workspace/i }));

    await waitFor(() => {
      expect(getByRole('alert')).toBeInTheDocument();
    });
  });
});
