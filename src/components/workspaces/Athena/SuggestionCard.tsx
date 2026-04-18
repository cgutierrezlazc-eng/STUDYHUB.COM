/**
 * SuggestionCard — Tarjeta de sugerencia Athena con acciones apply/modify/reject/delete.
 *
 * Muestra el texto original (staging) tachado en rojo y la sugerencia subrayada en verde.
 * Botones: Aplicar (con modo), Modificar (abre textarea), Rechazar, Eliminar.
 * Estilo visual cambia según status (applied, rejected, pending).
 *
 * Bloque 2c Athena IA.
 */

import React, { useState } from 'react';
import type { RefObject } from 'react';
import type { AthenaSuggestion } from '../../../../shared/workspaces-types';
import type { EditorBridgeHandle } from './AthenaPanel';
import { patchAthenaSuggestion, deleteAthenaSuggestion } from '../../../services/workspacesApi';
import styles from './AthenaPanel.module.css';

interface SuggestionCardProps {
  docId: string;
  suggestion: AthenaSuggestion;
  editorBridge: RefObject<EditorBridgeHandle | null> | null;
  onStatusChange: (id: string, status: AthenaSuggestion['status']) => void;
}

export default function SuggestionCard({
  docId,
  suggestion,
  editorBridge,
  onStatusChange,
}: SuggestionCardProps): React.ReactElement {
  const [modifying, setModifying] = useState(false);
  const [modifiedText, setModifiedText] = useState(suggestion.suggestionContent);
  const [loading, setLoading] = useState(false);

  const isPending = suggestion.status === 'pending';

  async function handleApply() {
    setLoading(true);
    try {
      editorBridge?.current?.applyText(suggestion.suggestionContent, 'insert-at-cursor');
      await patchAthenaSuggestion(docId, suggestion.id, { status: 'applied' });
      onStatusChange(suggestion.id, 'applied');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await patchAthenaSuggestion(docId, suggestion.id, { status: 'rejected' });
      onStatusChange(suggestion.id, 'rejected');
    } finally {
      setLoading(false);
    }
  }

  async function handleModifySave() {
    setLoading(true);
    try {
      await patchAthenaSuggestion(docId, suggestion.id, {
        status: 'modified',
        new_content: modifiedText,
      });
      onStatusChange(suggestion.id, 'modified');
      setModifying(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteAthenaSuggestion(docId, suggestion.id);
      onStatusChange(suggestion.id, suggestion.status);
    } finally {
      setLoading(false);
    }
  }

  const cardClass = [
    styles.suggestionCard,
    suggestion.status === 'applied' ? styles.suggestionCardApplied : '',
    suggestion.status === 'rejected' ? styles.suggestionCardRejected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const statusLabel =
    suggestion.status === 'applied'
      ? 'Aplicada'
      : suggestion.status === 'rejected'
        ? 'Rechazada'
        : suggestion.status === 'modified'
          ? 'Modificada'
          : null;

  return (
    <div className={cardClass} data-status={suggestion.status}>
      <div className={styles.suggestionDiff}>
        <p className={styles.diffOriginal} aria-label="Texto original">
          {suggestion.stagingContent}
        </p>
        {modifying ? (
          <textarea
            className={styles.chatInput}
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            rows={3}
            aria-label="Editar sugerencia"
          />
        ) : (
          <p className={styles.diffSuggested} aria-label="Sugerencia de Athena">
            {suggestion.suggestionContent}
          </p>
        )}
      </div>

      {statusLabel && (
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
          {statusLabel}
        </p>
      )}

      <div className={styles.suggestionActions}>
        {isPending && !modifying && (
          <>
            <button
              type="button"
              className={styles.btnApply}
              onClick={handleApply}
              disabled={loading}
              aria-label="Aplicar sugerencia"
            >
              Aplicar
            </button>
            <button
              type="button"
              className={styles.btnModify}
              onClick={() => setModifying(true)}
              disabled={loading}
              aria-label="Modificar sugerencia"
            >
              Modificar
            </button>
            <button
              type="button"
              className={styles.btnReject}
              onClick={handleReject}
              disabled={loading}
              aria-label="Rechazar sugerencia"
            >
              Rechazar
            </button>
          </>
        )}

        {modifying && (
          <>
            <button
              type="button"
              className={styles.btnApply}
              onClick={handleModifySave}
              disabled={loading}
            >
              Guardar
            </button>
            <button
              type="button"
              className={styles.btnModify}
              onClick={() => setModifying(false)}
              disabled={loading}
            >
              Cancelar
            </button>
          </>
        )}

        <button
          type="button"
          className={styles.btnDelete}
          onClick={handleDelete}
          disabled={loading}
          aria-label="Eliminar sugerencia"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
