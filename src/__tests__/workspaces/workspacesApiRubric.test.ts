/**
 * Tests TDD para funciones de rúbrica en workspacesApi.ts.
 * RED: deben fallar hasta que se implementen las funciones.
 *
 * Criterios:
 * 1. uploadRubricText llama POST /workspaces/{docId}/rubric/text con { text }
 * 2. uploadRubricFile llama POST /workspaces/{docId}/rubric/upload con FormData
 * 3. getRubric llama GET /workspaces/{docId}/rubric
 * 4. Todas retornan { items, warnings }
 * 5. uploadRubricFile usa FormData sin Content-Type (browser lo pone automático)
 * 6. Propagan error de red como Error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadRubricText, uploadRubricFile, getRubric } from '../../services/workspacesApi';
import type { RubricItem } from '../../../shared/workspaces-types';

const MOCK_ITEMS: RubricItem[] = [
  { id: 'r1', title: 'Introducción', points: 20, description: 'Claridad en la introducción' },
  { id: 'r2', title: 'Desarrollo', points: 40, description: 'Argumento bien estructurado' },
];

describe('uploadRubricText', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: MOCK_ITEMS, warnings: [] }),
      })
    );
    vi.stubGlobal('localStorage', {
      getItem: (_k: string) => 'test-token',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('llama POST /workspaces/{docId}/rubric/text con body { text }', async () => {
    await uploadRubricText('doc-123', 'Criterio 1: introducción (20 pts)');
    const fetchMock = vi.mocked(fetch);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/workspaces/doc-123/rubric/text');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body as string) as { text: string };
    expect(body.text).toBe('Criterio 1: introducción (20 pts)');
  });

  it('retorna { items, warnings } del servidor', async () => {
    const result = await uploadRubricText('doc-123', 'texto rúbrica');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Introducción');
    expect(result.warnings).toEqual([]);
  });

  it('propaga error cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Texto vacío' }),
      })
    );
    await expect(uploadRubricText('doc-err', '')).rejects.toThrow('Texto vacío');
  });
});

describe('uploadRubricFile', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: MOCK_ITEMS, warnings: ['No se pudo extraer página 3'] }),
      })
    );
    vi.stubGlobal('localStorage', {
      getItem: (_k: string) => 'test-token',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('llama POST /workspaces/{docId}/rubric/upload', async () => {
    const file = new File(['contenido'], 'rubrica.pdf', { type: 'application/pdf' });
    await uploadRubricFile('doc-456', file);
    const fetchMock = vi.mocked(fetch);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/workspaces/doc-456/rubric/upload');
    expect(opts.method).toBe('POST');
  });

  it('envía FormData con el archivo', async () => {
    const file = new File(['pdf bytes'], 'rubrica.pdf', { type: 'application/pdf' });
    await uploadRubricFile('doc-456', file);
    const fetchMock = vi.mocked(fetch);
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(opts.body).toBeInstanceOf(FormData);
    const fd = opts.body as FormData;
    expect(fd.get('file')).toBe(file);
  });

  it('retorna { items, warnings } del servidor', async () => {
    const file = new File(['data'], 'rubrica.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const result = await uploadRubricFile('doc-456', file);
    expect(result.items).toHaveLength(2);
    expect(result.warnings).toContain('No se pudo extraer página 3');
  });

  it('propaga error cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 415,
        json: async () => ({ detail: 'Formato no soportado' }),
      })
    );
    const file = new File(['x'], 'rubrica.xls', { type: 'application/vnd.ms-excel' });
    await expect(uploadRubricFile('doc-err', file)).rejects.toThrow('Formato no soportado');
  });
});

describe('getRubric', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          raw: 'Criterio 1: introducción (20 pts)\nCriterio 2: desarrollo (40 pts)',
          items: MOCK_ITEMS,
          warnings: [],
        }),
      })
    );
    vi.stubGlobal('localStorage', {
      getItem: (_k: string) => 'test-token',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('llama GET /workspaces/{docId}/rubric', async () => {
    await getRubric('doc-789');
    const fetchMock = vi.mocked(fetch);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/workspaces/doc-789/rubric');
    expect(opts.method).toBeUndefined(); // GET por defecto, sin method explícito
  });

  it('retorna { raw, items, warnings }', async () => {
    const result = await getRubric('doc-789');
    expect(result.raw).toContain('Criterio 1');
    expect(result.items).toHaveLength(2);
    expect(result.warnings).toEqual([]);
  });

  it('propaga error cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Sin rúbrica' }),
      })
    );
    await expect(getRubric('doc-vacio')).rejects.toThrow('Sin rúbrica');
  });
});
