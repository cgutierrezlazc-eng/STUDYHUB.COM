/**
 * Tests unitarios del wrapper yjsProvider.
 * Mockea y-websocket y y-indexeddb completamente — no se usa servidor WS real.
 *
 * Decisión D9 del plan 2b: split unit (mock) + integración (collab.test.tsx en memoria).
 *
 * Bloque 2b Colaboración.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks hoisted (vi.hoisted resuelve el problema de inicialización) ──────────

const {
  mockProviderInstance,
  MockWebsocketProvider,
  mockIndexedDbInstance,
  MockIndexeddbPersistence,
} = vi.hoisted(() => {
  const mockProviderInstance = {
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
    wsconnected: false,
    shouldConnect: true,
  };

  const MockWebsocketProvider = vi.fn().mockImplementation(() => mockProviderInstance);

  const mockIndexedDbInstance = {
    on: vi.fn(),
    destroy: vi.fn(),
    synced: false,
  };

  const MockIndexeddbPersistence = vi.fn().mockImplementation(() => {
    return mockIndexedDbInstance;
  });

  return {
    mockProviderInstance,
    MockWebsocketProvider,
    mockIndexedDbInstance,
    MockIndexeddbPersistence,
  };
});

vi.mock('y-websocket', () => ({
  WebsocketProvider: MockWebsocketProvider,
}));

vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: MockIndexeddbPersistence,
}));

// ── Importar módulo bajo prueba ──────────────────────────────────────
import { createWorkspaceProvider, calcBackoffMs } from '../../services/yjsProvider';

const USER_META = {
  userId: 'user-abc',
  name: 'Test User',
  color: '#A855F7',
  avatar: undefined,
};

describe('createWorkspaceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-apply implementations (restoreAllMocks en afterEach las limpia)
    MockWebsocketProvider.mockImplementation(() => mockProviderInstance);
    MockIndexeddbPersistence.mockImplementation(() => mockIndexedDbInstance);

    // Restaurar awareness mock
    mockProviderInstance.awareness.setLocalStateField.mockClear();
    mockProviderInstance.awareness.getStates.mockReturnValue(new Map());
    mockProviderInstance.on.mockClear();
    mockProviderInstance.off.mockClear();
    mockProviderInstance.connect.mockClear();
    mockProviderInstance.disconnect.mockClear();
    mockProviderInstance.destroy.mockClear();
    mockIndexedDbInstance.on.mockClear();
    mockIndexedDbInstance.destroy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna un objeto con las propiedades esperadas', () => {
    const result = createWorkspaceProvider('doc-123', USER_META);
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('ydoc');
    expect(result).toHaveProperty('awareness');
    expect(result).toHaveProperty('destroy');
    expect(result).toHaveProperty('forceReconnect');
    expect(result).toHaveProperty('status$');
    result.destroy();
  });

  it('instancia WebsocketProvider con la URL y docId correctos', () => {
    createWorkspaceProvider('doc-xyz', USER_META);
    expect(MockWebsocketProvider).toHaveBeenCalledOnce();
    const callArgs = MockWebsocketProvider.mock.calls[0];
    // Primer arg: URL del WS
    expect(callArgs[0]).toMatch(/workspaces\/ws\/doc-xyz/);
    // Segundo arg: room name = docId
    expect(callArgs[1]).toBe('doc-xyz');
  });

  it('inyecta el token JWT en la URL del WebSocket', () => {
    const fakeToken = 'jwt.token.test';
    const getItemSpy = vi.spyOn(globalThis.Storage.prototype, 'getItem').mockReturnValue(fakeToken);

    createWorkspaceProvider('doc-tok', USER_META);

    const callArgs = MockWebsocketProvider.mock.calls[0];
    expect(callArgs[0]).toContain(`token=${encodeURIComponent(fakeToken)}`);

    getItemSpy.mockRestore();
  });

  it('instancia IndexeddbPersistence con el docId correcto', () => {
    createWorkspaceProvider('doc-idb', USER_META);
    expect(MockIndexeddbPersistence).toHaveBeenCalledOnce();
    expect(MockIndexeddbPersistence.mock.calls[0][0]).toBe('doc-idb');
  });

  it('inicializa awareness con userId, name, color y avatar del userMeta', () => {
    createWorkspaceProvider('doc-awareness', USER_META);
    expect(mockProviderInstance.awareness.setLocalStateField).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        userId: USER_META.userId,
        name: USER_META.name,
        color: USER_META.color,
      })
    );
  });

  it('destroy() llama destroy() en provider y en indexeddbPersistence', () => {
    const result = createWorkspaceProvider('doc-destroy', USER_META);
    result.destroy();
    expect(mockProviderInstance.destroy).toHaveBeenCalledOnce();
    expect(mockIndexedDbInstance.destroy).toHaveBeenCalledOnce();
  });

  it('forceReconnect() llama disconnect y connect', () => {
    const result = createWorkspaceProvider('doc-reconnect', USER_META);
    result.forceReconnect();
    expect(mockProviderInstance.disconnect).toHaveBeenCalledOnce();
    expect(mockProviderInstance.connect).toHaveBeenCalledOnce();
    result.destroy();
  });

  it('status$ es un objeto con método get()', () => {
    const result = createWorkspaceProvider('doc-status', USER_META);
    expect(typeof result.status$).toBe('object');
    expect(result.status$).toHaveProperty('get');
    expect(typeof result.status$.get).toBe('function');
    result.destroy();
  });

  it('suscribe al evento "status" del provider para actualizar status$', () => {
    createWorkspaceProvider('doc-evts', USER_META);
    const onCalls = mockProviderInstance.on.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(onCalls).toContain('status');
  });

  it('calcula backoff exponencial correctamente', () => {
    expect(calcBackoffMs(0)).toBe(1000);
    expect(calcBackoffMs(1)).toBe(2000);
    expect(calcBackoffMs(2)).toBe(4000);
    expect(calcBackoffMs(3)).toBe(8000);
    // Tope en 30000
    expect(calcBackoffMs(10)).toBe(30000);
  });

  it('registra listener de window.online para forzar reconexión', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');
    const result = createWorkspaceProvider('doc-online', USER_META);
    const onlineCalls = addEventSpy.mock.calls.filter(([evt]) => evt === 'online');
    expect(onlineCalls.length).toBeGreaterThanOrEqual(1);
    result.destroy();
    addEventSpy.mockRestore();
  });

  it('destroy() remueve listener de window.online', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const result = createWorkspaceProvider('doc-cleanup', USER_META);
    result.destroy();
    const onlineCalls = removeSpy.mock.calls.filter(([evt]) => evt === 'online');
    expect(onlineCalls.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });
});
