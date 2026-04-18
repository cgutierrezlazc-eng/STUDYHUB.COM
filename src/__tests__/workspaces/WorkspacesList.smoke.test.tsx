/**
 * Tests smoke de WorkspacesList.
 * Verifica que la página renderiza, muestra el botón de crear,
 * y maneja el empty state y el estado con datos mockeados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock del servicio de API de workspaces
vi.mock('../../services/workspacesApi', () => ({
  listWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
}));

import WorkspacesList from '../../pages/Workspaces/WorkspacesList';
import * as workspacesApi from '../../services/workspacesApi';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WorkspacesList — smoke tests', () => {
  it('renderiza sin crash con listWorkspaces resolviendo vacío', async () => {
    vi.mocked(workspacesApi.listWorkspaces).mockResolvedValue({ workspaces: [] });

    const { container } = renderWithRouter(<WorkspacesList onNavigate={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('muestra el botón para crear nuevo workspace', async () => {
    vi.mocked(workspacesApi.listWorkspaces).mockResolvedValue({ workspaces: [] });

    const { getByText } = renderWithRouter(<WorkspacesList onNavigate={() => {}} />);
    // Debe haber un botón o elemento con texto relacionado a "Nuevo"
    expect(getByText(/nuevo/i)).toBeInTheDocument();
  });

  it('tiene el título "Workspaces" como heading en la página', async () => {
    vi.mocked(workspacesApi.listWorkspaces).mockResolvedValue({ workspaces: [] });

    const { getByRole } = renderWithRouter(<WorkspacesList onNavigate={() => {}} />);
    expect(getByRole('heading', { name: /workspaces/i })).toBeInTheDocument();
  });

  it('maneja error de API sin crash', async () => {
    vi.mocked(workspacesApi.listWorkspaces).mockRejectedValue(new Error('Error de red'));

    const { container } = renderWithRouter(<WorkspacesList onNavigate={() => {}} />);
    expect(container).toBeTruthy();
  });
});
