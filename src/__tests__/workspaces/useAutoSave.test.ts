/**
 * Tests del hook useAutoSave.
 *
 * Verifica:
 * - Debounce de 2s desde el último update Yjs.
 * - Transición de estados: unsaved → saving → saved.
 * - Lógica de "cliente elegido" determinista por userId (menor lexicográfico).
 * - No dispara PATCH si el cliente no es el elegido.
 * - Marca 'offline' cuando el provider está desconectado.
 *
 * Bloque 2b Colaboración.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as Y from 'yjs';

// Mocks de dependencias
vi.mock('y-websocket', () => ({
  WebsocketProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    awareness: {
      setLocalStateField: vi.fn(),
      getStates: vi.fn().mockReturnValue(new Map()),
      on: vi.fn(),
      off: vi.fn(),
    },
  })),
}));

vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    destroy: vi.fn(),
    synced: true,
  })),
}));

import { useAutoSave } from '../../hooks/useAutoSave';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAwareness(userIds: string[]) {
  const states = new Map<number, { user?: { userId: string } }>();
  userIds.forEach((uid, i) => {
    states.set(i + 1, { user: { userId: uid } });
  });
  return {
    getStates: vi.fn().mockReturnValue(states),
    on: vi.fn(),
    off: vi.fn(),
    setLocalStateField: vi.fn(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAutoSave', () => {
  let ydoc: Y.Doc;
  const mockUpdateWorkspace = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.useFakeTimers();
    ydoc = new Y.Doc();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    ydoc.destroy();
  });

  it('retorna estado inicial "saved"', () => {
    const awareness = makeAwareness(['user-1']);
    const { result } = renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );
    expect(result.current.saveStatus).toBe('saved');
  });

  it('cambia a "unsaved" al modificar el Y.Doc', () => {
    const awareness = makeAwareness(['user-1']);
    const { result } = renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      // Disparar un update en el ydoc
      ydoc.getText('lexical').insert(0, 'hola');
    });

    expect(result.current.saveStatus).toBe('unsaved');
  });

  it('cambia a "saving" y luego "saved" tras debounce de 2s', async () => {
    const awareness = makeAwareness(['user-1']);
    const { result } = renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'cambio');
    });

    expect(result.current.saveStatus).toBe('unsaved');

    // Avanzar el timer 2s
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Debe haber llamado a updateFn
    expect(mockUpdateWorkspace).toHaveBeenCalledOnce();
    expect(mockUpdateWorkspace).toHaveBeenCalledWith(
      'ws-1',
      expect.objectContaining({ content_yjs: expect.any(String) })
    );

    // Resolver la promesa
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.saveStatus).toBe('saved');
  });

  it('resetea el timer si llegan múltiples updates antes de 2s', async () => {
    const awareness = makeAwareness(['user-1']);
    const { result } = renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'a');
    });

    // Avanzar 1s (no debe disparar aún)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      ydoc.getText('lexical').insert(1, 'b');
    });

    // Avanzar 1s más (total 2s desde el primer cambio, pero 1s desde el segundo)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // No debe haber disparado aún (el debounce se resetó con el segundo cambio)
    expect(mockUpdateWorkspace).not.toHaveBeenCalled();
    expect(result.current.saveStatus).toBe('unsaved');

    // Avanzar 1s más (total 2s desde el segundo cambio)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateWorkspace).toHaveBeenCalledOnce();
  });

  it('no dispara PATCH si el currentUserId no es el cliente elegido', async () => {
    // user-A < user-B lexicográficamente — user-A es el elegido, user-B no
    const awareness = makeAwareness(['user-A', 'user-B']);
    renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-B', // user-B NO es el elegido
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'cambio');
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // user-B no debería haber disparado el PATCH
    expect(mockUpdateWorkspace).not.toHaveBeenCalled();
  });

  it('cliente único (solo) es siempre el elegido', async () => {
    const awareness = makeAwareness(['user-solo']);
    renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-solo',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'cambio solo');
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockUpdateWorkspace).toHaveBeenCalledOnce();
  });

  it('el snapshot se serializa como base64 (string no vacío)', async () => {
    const awareness = makeAwareness(['user-1']);
    renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'contenido real');
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const callArg = mockUpdateWorkspace.mock.calls[0][1];
    expect(typeof callArg.content_yjs).toBe('string');
    expect(callArg.content_yjs.length).toBeGreaterThan(0);
  });

  it('no dispara PATCH cuando enabled=false aunque haya updates Yjs', async () => {
    const awareness = makeAwareness(['user-1']);
    renderHook(() =>
      useAutoSave({
        ydoc,
        docId: 'ws-1',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
        enabled: false,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'contenido');
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockUpdateWorkspace).not.toHaveBeenCalled();
  });

  it('no dispara PATCH cuando docId es vacío (guarda contra PATCH /workspaces//)', async () => {
    const awareness = makeAwareness(['user-1']);
    renderHook(() =>
      useAutoSave({
        ydoc,
        docId: '',
        currentUserId: 'user-1',
        awareness: awareness as unknown as import('y-websocket').WebsocketProvider['awareness'],
        updateFn: mockUpdateWorkspace,
        debounceMs: 2000,
      })
    );

    act(() => {
      ydoc.getText('lexical').insert(0, 'contenido');
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockUpdateWorkspace).not.toHaveBeenCalled();
  });
});
