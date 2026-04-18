/**
 * Tests del hook useCharContributionTracker.
 *
 * Verifica:
 * - Acumula caracteres añadidos al Y.Doc (positivos).
 * - Ignora caracteres borrados (diff negativo).
 * - Flushea cada flushMs con PATCH al endpoint de contribution.
 * - Reset optimista: delta=0 antes del PATCH para evitar doble envío.
 * - Re-acumula en caso de error en PATCH.
 * - No flushea cuando enabled=false.
 * - No flushea cuando docId o memberId son vacíos (guarda 404 silencioso).
 *
 * Bloque 2b Colaboración.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as Y from 'yjs';

// ── Mock del servicio API ─────────────────────────────────────────────────────

const { mockUpdateContributionMetric } = vi.hoisted(() => ({
  mockUpdateContributionMetric: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../services/workspacesApi', () => ({
  updateContributionMetric: mockUpdateContributionMetric,
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
  listChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  deleteChatMessage: vi.fn(),
}));

import { useCharContributionTracker } from '../../hooks/useCharContributionTracker';

const FLUSH_MS = 30_000;

describe('useCharContributionTracker', () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    vi.useFakeTimers();
    ydoc = new Y.Doc();
    mockUpdateContributionMetric.mockClear();
    mockUpdateContributionMetric.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    ydoc.destroy();
  });

  it('flushea caracteres añadidos al Y.Doc tras flushMs', async () => {
    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: 'ws-1',
        memberId: 'mem-1',
        flushMs: FLUSH_MS,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'hola mundo');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS);
    });

    expect(mockUpdateContributionMetric).toHaveBeenCalledTimes(1);
    expect(mockUpdateContributionMetric).toHaveBeenCalledWith('ws-1', 'mem-1', 10);
  });

  it('ignora borrados (diff negativo) y solo cuenta adiciones', async () => {
    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: 'ws-1',
        memberId: 'mem-1',
        flushMs: FLUSH_MS,
      })
    );

    act(() => {
      const t = ydoc.getText('lexical');
      t.insert(0, 'abcdef'); // +6
      t.delete(0, 3); // -3 (se ignora)
      t.insert(0, 'XY'); // +2 → total acumulado 8 (6 + 2)
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS);
    });

    expect(mockUpdateContributionMetric).toHaveBeenCalledTimes(1);
    expect(mockUpdateContributionMetric).toHaveBeenCalledWith('ws-1', 'mem-1', 8);
  });

  it('no flushea si no hay delta positivo acumulado', async () => {
    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: 'ws-1',
        memberId: 'mem-1',
        flushMs: FLUSH_MS,
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS * 2);
    });

    expect(mockUpdateContributionMetric).not.toHaveBeenCalled();
  });

  it('resetea delta a 0 tras flush exitoso (no re-envía el mismo delta)', async () => {
    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: 'ws-1',
        memberId: 'mem-1',
        flushMs: FLUSH_MS,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'abcde');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS);
    });
    expect(mockUpdateContributionMetric).toHaveBeenCalledWith('ws-1', 'mem-1', 5);

    // Segundo flush sin nuevos cambios: NO debe llamar de nuevo
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS);
    });
    expect(mockUpdateContributionMetric).toHaveBeenCalledTimes(1);
  });

  it('re-acumula delta si el PATCH falla (no pierde el conteo)', async () => {
    mockUpdateContributionMetric.mockRejectedValueOnce(new Error('network fail'));

    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: 'ws-1',
        memberId: 'mem-1',
        flushMs: FLUSH_MS,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'abcde');
    });

    // Primer flush falla
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS);
    });
    expect(mockUpdateContributionMetric).toHaveBeenCalledTimes(1);

    // Agregar más caracteres
    act(() => {
      ydoc.getText('lexical').insert(0, 'XYZ');
    });

    // Segundo flush (ya mockea exitoso por default): debe enviar delta acumulado (5+3=8)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS);
    });
    expect(mockUpdateContributionMetric).toHaveBeenCalledTimes(2);
    const secondCallArgs = mockUpdateContributionMetric.mock.calls[1];
    expect(secondCallArgs).toEqual(['ws-1', 'mem-1', 8]);
  });

  it('no flushea cuando enabled=false', async () => {
    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: 'ws-1',
        memberId: 'mem-1',
        enabled: false,
        flushMs: FLUSH_MS,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'hola');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS * 2);
    });

    expect(mockUpdateContributionMetric).not.toHaveBeenCalled();
  });

  it('no flushea cuando docId o memberId son vacíos', async () => {
    renderHook(() =>
      useCharContributionTracker({
        ydoc,
        docId: '',
        memberId: '',
        flushMs: FLUSH_MS,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'abc');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FLUSH_MS * 2);
    });

    expect(mockUpdateContributionMetric).not.toHaveBeenCalled();
  });
});
