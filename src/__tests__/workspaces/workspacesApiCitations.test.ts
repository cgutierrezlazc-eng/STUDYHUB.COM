/**
 * Tests TDD para validateCitations en workspacesApi.ts.
 * RED: deben fallar hasta que se implemente la función.
 *
 * Criterios:
 * 1. Llama POST /workspaces/{docId}/citations/validate con body correcto
 * 2. Retorna { results: CitationValidationResult[] }
 * 3. Pasa correctamente los campos id y raw de cada cita
 * 4. Propaga error de red como Error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateCitations } from '../../services/workspacesApi';
import type { CitationValidationResult } from '../../../shared/workspaces-types';

const MOCK_RESULTS: CitationValidationResult[] = [
  { id: 'c0', valid: true, errors: [], suggested: '' },
  { id: 'c1', valid: false, errors: ['Falta coma'], suggested: '(García, 2020)' },
];

describe('validateCitations', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: MOCK_RESULTS }),
      })
    );
    // Simular token presente
    vi.stubGlobal('localStorage', {
      getItem: (_k: string) => 'test-token',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna { results } con los datos del servidor', async () => {
    const result = await validateCitations('doc-123', [
      { id: 'c0', raw: '(García, 2020)' },
      { id: 'c1', raw: 'García 2020' },
    ]);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].valid).toBe(true);
    expect(result.results[1].valid).toBe(false);
  });

  it('llama al endpoint correcto con método POST', async () => {
    await validateCitations('doc-abc', [{ id: 'x', raw: '(A, 2021)' }]);
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/workspaces/doc-abc/citations/validate');
    expect(opts.method).toBe('POST');
  });

  it('envía body JSON con el arreglo citations', async () => {
    const citations = [{ id: 'c0', raw: '(García, 2020)' }];
    await validateCitations('doc-xyz', citations);
    const fetchMock = vi.mocked(fetch);
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string) as { citations: typeof citations };
    expect(body.citations).toEqual(citations);
  });

  it('propaga error cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Acceso denegado' }),
      })
    );
    await expect(validateCitations('doc-403', [{ id: 'c0', raw: '(A, 2020)' }])).rejects.toThrow(
      'Acceso denegado'
    );
  });
});
