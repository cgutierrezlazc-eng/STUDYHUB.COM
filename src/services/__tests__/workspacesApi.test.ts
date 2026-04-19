/**
 * Tests del cliente HTTP workspacesApi.
 * TDD fase RED — los tests se ejecutan antes de crear workspacesApi.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockeamos el módulo api para controlar `request` internamente.
vi.mock('../api', () => ({
  getApiBase: () => 'http://localhost:8899',
  api: {},
}));

// Mock global fetch via vi.stubGlobal (compatible con ESLint no-undef)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage via vi.stubGlobal
const localStorageMock = (() => {
  const store: Record<string, string> = { conniku_token: 'test-token-abc' };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('workspacesApi — listWorkspaces', () => {
  it('realiza GET /workspaces y retorna array', async () => {
    const mockData = {
      workspaces: [
        { id: 'abc123', title: 'Tesis Biología', course_name: 'BIO-501', apa_edition: '7' },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      status: 200,
    });

    const { listWorkspaces } = await import('../workspacesApi');
    const result = await listWorkspaces();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/workspaces');
    expect((options as RequestInit).method ?? 'GET').toBe('GET');
    expect(result).toEqual(mockData);
  });
});

describe('workspacesApi — createWorkspace', () => {
  it('realiza POST /workspaces con el body correcto', async () => {
    const payload = { title: 'Nuevo doc', course_name: 'MAT-101', apa_edition: '7' as const };
    const mockResponse = { id: 'newid1', ...payload };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      status: 201,
    });

    const { createWorkspace } = await import('../workspacesApi');
    const result = await createWorkspace(payload);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    expect((options as RequestInit).method).toBe('POST');
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.title).toBe('Nuevo doc');
    expect(body.apa_edition).toBe('7');
    expect(result).toEqual(mockResponse);
  });
});

describe('workspacesApi — getWorkspace', () => {
  it('retorna datos del workspace para ID válido', async () => {
    const mockData = { id: 'ws1', title: 'Mi Tesis', apa_edition: '7' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      status: 200,
    });

    const { getWorkspace } = await import('../workspacesApi');
    const result = await getWorkspace('ws1');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/workspaces/ws1');
    expect(result).toEqual(mockData);
  });

  it('lanza error en 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Workspace no encontrado' }),
    });

    const { getWorkspace } = await import('../workspacesApi');
    await expect(getWorkspace('nonexistent')).rejects.toThrow();
  });
});

describe('workspacesApi — updateWorkspace', () => {
  it('realiza PATCH /workspaces/:id con campos a actualizar', async () => {
    const patch = { title: 'Título actualizado' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'ws1', ...patch }),
      status: 200,
    });

    const { updateWorkspace } = await import('../workspacesApi');
    await updateWorkspace('ws1', patch);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/workspaces/ws1');
    expect((options as RequestInit).method).toBe('PATCH');
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.title).toBe('Título actualizado');
  });
});

describe('workspacesApi — deleteWorkspace', () => {
  it('realiza DELETE /workspaces/:id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
      status: 200,
    });

    const { deleteWorkspace } = await import('../workspacesApi');
    await deleteWorkspace('ws1');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/workspaces/ws1');
    expect((options as RequestInit).method).toBe('DELETE');
  });
});

describe('workspacesApi — listVersions', () => {
  it('realiza GET /workspaces/:id/versions', async () => {
    const mockData = { versions: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      status: 200,
    });

    const { listVersions } = await import('../workspacesApi');
    await listVersions('ws1');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/workspaces/ws1/versions');
  });
});

describe('workspacesApi — addMember', () => {
  it('realiza POST /workspaces/:id/members con email y rol', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
      status: 201,
    });

    const { addMember } = await import('../workspacesApi');
    await addMember('ws1', 'user@example.com', 'editor');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/workspaces/ws1/members');
    expect((options as RequestInit).method).toBe('POST');
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.email).toBe('user@example.com');
    expect(body.role).toBe('editor');
  });
});

describe('workspacesApi — apiFetch hardening (A-10)', () => {
  it('lanza AuthExpiredError y limpia token en respuesta 401', async () => {
    localStorage.setItem('conniku_token', 'token-viejo');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'expired' }),
    });

    const { listWorkspaces, AuthExpiredError } = await import('../workspacesApi');
    await expect(listWorkspaces()).rejects.toBeInstanceOf(AuthExpiredError);
    expect(localStorage.getItem('conniku_token')).toBeNull();
  });

  it('lanza RequestTimeoutError cuando fetch aborta por timeout', async () => {
    // Restaurar token porque el test anterior lo eliminó
    localStorage.setItem('conniku_token', 'test-token-abc');

    // Simular AbortError del timeout interno
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortErr);

    const { listWorkspaces, RequestTimeoutError } = await import('../workspacesApi');
    await expect(listWorkspaces()).rejects.toBeInstanceOf(RequestTimeoutError);
  });

  it('pasa signal de fetch respetando AbortController interno', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ workspaces: [] }),
      status: 200,
    });

    const { listWorkspaces } = await import('../workspacesApi');
    await listWorkspaces();

    const [, options] = mockFetch.mock.calls[0];
    expect((options as RequestInit).signal).toBeDefined();
    // signal debe ser un AbortSignal (tiene .aborted boolean y .addEventListener)
    const signal = (options as RequestInit).signal;
    expect(typeof signal?.aborted).toBe('boolean');
    expect(typeof signal?.addEventListener).toBe('function');
  });
});
