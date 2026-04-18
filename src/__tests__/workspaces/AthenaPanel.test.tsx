/**
 * Tests del componente AthenaPanel (raíz del panel Athena IA).
 *
 * Mockea workspacesApi para evitar llamadas HTTP.
 * Cubre: render inicial, ping ok/fail, fetch chats+suggestions+usage,
 * tab switch, usage-meter, banner si remaining=0, modal upgrade.
 *
 * Bloque 2c Athena IA.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// ── Mocks de servicios ────────────────────────────────────────────────────────

const {
  mockPingAthena,
  mockListAthenaChats,
  mockListAthenaSuggestions,
  mockGetAthenaUsage,
  mockAthenaAnalyze,
  mockAthenaChat,
} = vi.hoisted(() => ({
  mockPingAthena: vi.fn().mockResolvedValue({ ok: true, claude_available: true }),
  mockListAthenaChats: vi.fn().mockResolvedValue({ chats: [] }),
  mockListAthenaSuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
  mockGetAthenaUsage: vi.fn().mockResolvedValue({
    plan: 'free',
    used: 1,
    limit: 3,
    remaining: 2,
    windowKey: '2026-04-18',
    resetsAt: '2026-04-19T09:00:00Z',
  }),
  mockAthenaAnalyze: vi.fn().mockResolvedValue({ result: 'Análisis de prueba.' }),
  mockAthenaChat: vi.fn().mockResolvedValue({ result: 'Respuesta de Athena.' }),
}));

vi.mock('../../services/workspacesApi', () => ({
  pingAthena: mockPingAthena,
  listAthenaChats: mockListAthenaChats,
  listAthenaSuggestions: mockListAthenaSuggestions,
  getAthenaUsage: mockGetAthenaUsage,
  athenaAnalyze: mockAthenaAnalyze,
  athenaChat: mockAthenaChat,
  // existentes
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
  athenaSuggest: vi.fn(),
  patchAthenaSuggestion: vi.fn(),
  deleteAthenaSuggestion: vi.fn(),
  deleteAthenaChats: vi.fn(),
}));

// ── Importar componente bajo prueba ───────────────────────────────────────────

import AthenaPanel from '../../components/workspaces/Athena/AthenaPanel';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_USER = {
  userId: 'u-1',
  name: 'Ana García',
  avatar: undefined,
  color: '#A855F7',
};

const MOCK_BRIDGE = {
  applyText: vi.fn(),
  getSelection: vi.fn().mockReturnValue(null),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AthenaPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPingAthena.mockResolvedValue({ ok: true, claude_available: true });
    mockListAthenaChats.mockResolvedValue({ chats: [] });
    mockListAthenaSuggestions.mockResolvedValue({ suggestions: [] });
    mockGetAthenaUsage.mockResolvedValue({
      plan: 'free',
      used: 1,
      limit: 3,
      remaining: 2,
      windowKey: '2026-04-18',
      resetsAt: '2026-04-19T09:00:00Z',
    });
  });

  it('renderiza el header de Athena con avatar y nombre', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByText('Athena')).toBeTruthy();
    });
  });

  it('muestra los tres tabs: Análisis, Chat y Sugerencias', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /análisis/i })).toBeTruthy();
      expect(screen.getByRole('tab', { name: /chat/i })).toBeTruthy();
      expect(screen.getByRole('tab', { name: /sugerencias/i })).toBeTruthy();
    });
  });

  it('llama a pingAthena, listAthenaChats, listAthenaSuggestions y getAthenaUsage al montar', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(mockPingAthena).toHaveBeenCalledWith('ws-1');
      expect(mockListAthenaChats).toHaveBeenCalledWith('ws-1', expect.any(Object));
      expect(mockListAthenaSuggestions).toHaveBeenCalledWith('ws-1', expect.any(Object));
      expect(mockGetAthenaUsage).toHaveBeenCalledWith('ws-1');
    });
  });

  it('muestra el usage-meter con los valores correctos', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      // debe mostrar "1 de 3" o similar
      expect(screen.getByText(/1.*de.*3|1\/3/i)).toBeTruthy();
    });
  });

  it('muestra banner ámbar cuando remaining === 0', async () => {
    mockGetAthenaUsage.mockResolvedValue({
      plan: 'free',
      used: 3,
      limit: 3,
      remaining: 0,
      windowKey: '2026-04-18',
      resetsAt: '2026-04-19T09:00:00Z',
    });

    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /cupo agotado|upgrade|mejorar/i })).toBeTruthy();
    });
  });

  it('muestra banner de error cuando ping falla', async () => {
    mockPingAthena.mockRejectedValue(new Error('Sin conexión'));

    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByText(/athena no disponible|no disponible|sin conexión/i)).toBeTruthy();
    });
  });

  it('puede cambiar de tab a Chat al hacer click', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /chat/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
    await waitFor(() => {
      // El mensaje de bienvenida de Athena aparece cuando el tab Chat está activo
      expect(screen.getByText(/hola.*athena|soy athena/i)).toBeTruthy();
    });
  });

  it('puede cambiar de tab a Sugerencias al hacer click', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /sugerencias/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('tab', { name: /sugerencias/i }));
    await waitFor(() => {
      // Botón para crear sugerencia visible en tab Sugerencias
      expect(screen.getByRole('button', { name: /crear sugerencia/i })).toBeTruthy();
    });
  });

  it('muestra plan Pro sin barra de uso cuando usage.limit es -1', async () => {
    mockGetAthenaUsage.mockResolvedValue({
      plan: 'pro',
      used: 42,
      limit: -1,
      remaining: -1,
      windowKey: '2026-04-18',
      resetsAt: '2026-04-19T09:00:00Z',
    });

    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      // plan Pro debe mostrar "Pro" o "ilimitado"
      expect(screen.getByText(/pro|ilimitado/i)).toBeTruthy();
    });
    // NO debe mostrar el banner de upgrade
    expect(screen.queryByRole('region', { name: /cupo agotado|upgrade/i })).toBeNull();
  });

  it('el tab activo inicial es Análisis', async () => {
    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      const tab = screen.getByRole('tab', { name: /análisis/i });
      expect(tab.getAttribute('aria-selected')).toBe('true');
    });
  });

  it('no falla si editorBridge es null', async () => {
    render(<AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={null} />);
    await waitFor(() => {
      expect(screen.getByText('Athena')).toBeTruthy();
    });
  });

  it('muestra banner cuando claude_available es false en el ping', async () => {
    mockPingAthena.mockResolvedValue({ ok: true, claude_available: false });

    render(
      <AthenaPanel docId="ws-1" currentUser={MOCK_USER} editorBridge={{ current: MOCK_BRIDGE }} />
    );
    await waitFor(() => {
      expect(screen.getByText(/athena no disponible|no disponible/i)).toBeTruthy();
    });
  });
});
