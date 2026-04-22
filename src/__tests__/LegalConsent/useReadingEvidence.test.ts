/**
 * Tests para useReadingEvidence hook.
 *
 * TDD RED fase — tests escritos antes de implementar el hook.
 * Bloque: multi-document-consent-v1
 */
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Importamos el hook que aún no existe — todos estos tests fallarán en RED
import { useReadingEvidence } from '../../hooks/useReadingEvidence';

// ----- Helpers ----------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LS_KEY = 'conniku_legal_session_token_v1';

// ----- Setup ------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  // Fetch mock por defecto: éxito
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});

// ----- Tests ------------------------------------------------------------------

describe('useReadingEvidence — sessionToken', () => {
  it('genera un sessionToken con formato UUID v4', () => {
    const { result } = renderHook(() => useReadingEvidence());
    expect(result.current.sessionToken).toMatch(UUID_REGEX);
  });

  it('persiste el sessionToken en localStorage', () => {
    const { result } = renderHook(() => useReadingEvidence());
    const stored = localStorage.getItem(LS_KEY);
    expect(stored).toBe(result.current.sessionToken);
  });

  it('recupera sessionToken existente del localStorage al montar (sobrevive refresh)', () => {
    const existing = '12345678-1234-4234-a234-123456789abc';
    localStorage.setItem(LS_KEY, existing);

    const { result } = renderHook(() => useReadingEvidence());
    expect(result.current.sessionToken).toBe(existing);
  });

  it('genera nuevo token si el almacenado no tiene formato UUID v4', () => {
    localStorage.setItem(LS_KEY, 'not-a-uuid');

    const { result } = renderHook(() => useReadingEvidence());
    expect(result.current.sessionToken).toMatch(UUID_REGEX);
  });
});

describe('useReadingEvidence — viewedDocs estado inicial', () => {
  it('comienza con los 4 documentos sin leer (false)', () => {
    const { result } = renderHook(() => useReadingEvidence());
    expect(result.current.viewedDocs).toEqual({
      terms: false,
      privacy: false,
      cookies: false,
      'age-declaration': false,
    });
  });
});

describe('useReadingEvidence — onDocRead', () => {
  it('marca un documento como leído cuando scrolled=true', async () => {
    const { result } = renderHook(() => useReadingEvidence());

    await act(async () => {
      await result.current.onDocRead('terms', true);
    });

    expect(result.current.viewedDocs.terms).toBe(true);
  });

  it('NO marca como leído si scrolled=false', async () => {
    const { result } = renderHook(() => useReadingEvidence());

    await act(async () => {
      await result.current.onDocRead('terms', false);
    });

    expect(result.current.viewedDocs.terms).toBe(false);
  });

  it('llama al endpoint POST /legal/documents/:docKey/viewed con session_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useReadingEvidence());

    await act(async () => {
      await result.current.onDocRead('terms', true);
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/legal/documents/terms/viewed');
    const body = JSON.parse(opts.body as string);
    expect(body.session_token).toBe(result.current.sessionToken);
  });

  it('reintenta hasta 3 veces con backoff exponencial si el endpoint falla', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error 1'))
      .mockRejectedValueOnce(new Error('network error 2'))
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useReadingEvidence());

    const promise = act(async () => {
      const callPromise = result.current.onDocRead('privacy', true);
      // Avanzar timers para los backoffs (1s, 2s)
      await vi.runAllTimersAsync();
      return callPromise;
    });

    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('marca como leído incluso si el endpoint falla en todos los reintentos (optimistic UI)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useReadingEvidence());

    await act(async () => {
      const callPromise = result.current.onDocRead('cookies', true);
      await vi.runAllTimersAsync();
      return callPromise;
    });

    // Optimistic: UI refleja como leído aunque backend haya fallado
    expect(result.current.viewedDocs.cookies).toBe(true);
    vi.useRealTimers();
  });
});

describe('useReadingEvidence — allRead derivado', () => {
  it('allRead es false cuando no todos los documentos están leídos', () => {
    const { result } = renderHook(() => useReadingEvidence());
    expect(result.current.allRead).toBe(false);
  });

  it('allRead es true cuando los 4 documentos están marcados', async () => {
    const { result } = renderHook(() => useReadingEvidence());

    await act(async () => {
      await result.current.onDocRead('terms', true);
      await result.current.onDocRead('privacy', true);
      await result.current.onDocRead('cookies', true);
      await result.current.onDocRead('age-declaration', true);
    });

    expect(result.current.allRead).toBe(true);
  });
});
