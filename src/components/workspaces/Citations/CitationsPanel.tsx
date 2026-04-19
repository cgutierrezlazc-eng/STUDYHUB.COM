/**
 * CitationsPanel — panel lateral de citas APA 7 detectadas en el documento.
 * Sub-bloque 2d.1 APA 7 + citas + referencias.
 *
 * Muestra lista de citas con status verde (válida) o rojo (errores),
 * mensaje de error por cita inválida, botón "Aplicar sugerencia" cuando
 * hay sugerencia disponible, y botón "Revalidar" global.
 */

import React, { useState } from 'react';
import type { CitationValidationResult } from '../../../../shared/workspaces-types';
import type { CitationInput } from '../../../services/workspacesApi';
import { validateCitations } from '../../../services/workspacesApi';

interface CitationsPanelProps {
  docId: string;
  initialResults?: CitationValidationResult[];
  rawCitations?: CitationInput[];
}

export default function CitationsPanel({
  docId,
  initialResults = [],
  rawCitations = [],
}: CitationsPanelProps): React.ReactElement {
  const [results, setResults] = useState<CitationValidationResult[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevalidate() {
    if (!rawCitations.length) return;
    setLoading(true);
    setError(null);
    try {
      const data = await validateCitations(docId, rawCitations);
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al revalidar citas.');
    } finally {
      setLoading(false);
    }
  }

  function handleApplySuggestion(result: CitationValidationResult) {
    // Notifica al editor externo si hay un callback; por ahora solo
    // actualiza el estado local para que la UI refleje la sugerencia aplicada.
    setResults((prev) =>
      prev.map((r) => (r.id === result.id ? { ...r, valid: true, errors: [], suggested: '' } : r))
    );
  }

  return (
    <div className="ws-citations-panel">
      <div className="ws-citations-panel-header">
        <span className="ws-citations-panel-title">Citas APA 7</span>
        <button
          type="button"
          className="ws-citations-revalidate-btn"
          onClick={() => void handleRevalidate()}
          disabled={loading}
          aria-label="Revalidar citas"
        >
          Revalidar
        </button>
      </div>

      {loading && (
        <div data-testid="citations-loading" className="ws-citations-loading">
          Validando citas…
        </div>
      )}

      {error && (
        <div className="ws-citations-error" role="alert">
          {error}
        </div>
      )}

      {!loading && results.length === 0 && (
        <p className="ws-citations-empty">No se detectaron citas en el documento.</p>
      )}

      {results.length > 0 && (
        <ul className="ws-citations-list">
          {results.map((result) => (
            <li key={result.id} className="ws-citations-item">
              <div className="ws-citations-item-header">
                <span
                  data-testid={`citation-status-${result.id}`}
                  data-valid={String(result.valid)}
                  className={`ws-citations-status ws-citations-status--${result.valid ? 'valid' : 'invalid'}`}
                  aria-label={result.valid ? 'Cita válida' : 'Cita con errores'}
                />
                <span className="ws-citations-raw">{result.id}</span>
              </div>

              {!result.valid && result.errors.length > 0 && (
                <ul className="ws-citations-errors">
                  {result.errors.map((err, i) => (
                    <li key={i} className="ws-citations-error-item">
                      {err}
                    </li>
                  ))}
                </ul>
              )}

              {result.suggested && (
                <button
                  type="button"
                  className="ws-citations-apply-btn"
                  onClick={() => handleApplySuggestion(result)}
                  aria-label="Aplicar sugerencia"
                >
                  Aplicar sugerencia
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
