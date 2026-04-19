/**
 * AthenaSuggestions — Lista de sugerencias Athena en staging privado.
 *
 * Filtro por estado. Botón "Crear sugerencia" llama athenaSuggest con la
 * selección del editor o los últimos 500 chars del documento.
 *
 * Bloque 2c Athena IA.
 */

import React, { useState } from 'react';
import type { RefObject } from 'react';
import type { AthenaSuggestion } from '../../../../shared/workspaces-types';
import type { EditorBridgeHandle } from './AthenaPanel';
import { athenaSuggest, AthenaQuotaError } from '../../../services/workspacesApi';
import SuggestionCard from './SuggestionCard';
import styles from './AthenaPanel.module.css';

interface AthenaSuggestionsProps {
  docId: string;
  suggestions: AthenaSuggestion[];
  editorBridge: RefObject<EditorBridgeHandle | null> | null;
  onSuggestionChange: (id: string, status: AthenaSuggestion['status']) => void;
  onQuotaExceeded: () => void;
}

export default function AthenaSuggestions({
  docId,
  suggestions,
  editorBridge,
  onSuggestionChange,
  onQuotaExceeded,
}: AthenaSuggestionsProps): React.ReactElement {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const selection = editorBridge?.current?.getSelection() ?? null;

    // Fix BLOQUEANTE-2 Capa 2: validar selección en frontend antes de llamar al
    // backend. El endpoint rechaza staging_text vacío con 400. Sin este guard,
    // el feature era inutilizable en su estado por defecto (sin selección).
    if (!selection || !selection.trim()) {
      setError('Selecciona texto en el editor antes de crear una sugerencia.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await athenaSuggest(docId, selection, selection);
    } catch (err) {
      const isQuota =
        err instanceof AthenaQuotaError ||
        (err instanceof Error && (err as Error & { code?: string }).code === 'athena-quota');
      if (isQuota) {
        onQuotaExceeded();
      } else {
        setError('No se pudo crear la sugerencia. Por favor intenta de nuevo.');
      }
    } finally {
      setCreating(false);
    }
  }

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const resolvedSuggestions = suggestions.filter((s) => s.status !== 'pending');

  return (
    <div>
      <button
        type="button"
        className={styles.analyzeBtn}
        onClick={() => void handleCreate()}
        disabled={creating}
        aria-label="Crear sugerencia con Athena"
      >
        {creating ? 'Generando...' : 'Crear sugerencia'}
      </button>

      {error && (
        <p style={{ color: 'var(--error, #f38ba8)', fontSize: 13 }} role="alert">
          {error}
        </p>
      )}

      {pendingSuggestions.length === 0 && resolvedSuggestions.length === 0 && (
        <p className={styles.analyzePlaceholder}>
          Selecciona texto en el documento y pulsa "Crear sugerencia" para que Athena proponga una
          mejora.
        </p>
      )}

      {pendingSuggestions.map((sug) => (
        <SuggestionCard
          key={sug.id}
          docId={docId}
          suggestion={sug}
          editorBridge={editorBridge}
          onStatusChange={onSuggestionChange}
        />
      ))}

      {resolvedSuggestions.length > 0 && (
        <details>
          <summary
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Historial ({resolvedSuggestions.length})
          </summary>
          {resolvedSuggestions.map((sug) => (
            <SuggestionCard
              key={sug.id}
              docId={docId}
              suggestion={sug}
              editorBridge={editorBridge}
              onStatusChange={onSuggestionChange}
            />
          ))}
        </details>
      )}
    </div>
  );
}
