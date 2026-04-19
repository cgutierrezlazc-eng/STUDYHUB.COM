/**
 * Panel lateral de rúbrica del workspace.
 * Sub-bloque 2d.6 — Rúbrica upload + checklist.
 *
 * Muestra:
 * - Sin rúbrica: botón "Subir rúbrica" (abre modal) + textarea "Pegar texto".
 * - Con rúbrica: lista de ítems con checkbox por cada uno (estado local en localStorage),
 *   título + puntos + warning banner si hubo warnings.
 * - Botón "Editar rúbrica" para reemplazar cuando hay ítems.
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { RubricItem } from '../../../../shared/workspaces-types';
import { getRubric, uploadRubricText } from '../../../services/workspacesApi';
import RubricUploadModal from './RubricUploadModal';

interface RubricPanelProps {
  docId: string;
}

const STORAGE_KEY = (docId: string) => `conniku_rubric_checked_${docId}`;

function loadChecked(docId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(docId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveChecked(docId: string, checked: Set<string>): void {
  localStorage.setItem(STORAGE_KEY(docId), JSON.stringify([...checked]));
}

export default function RubricPanel({ docId }: RubricPanelProps) {
  const [items, setItems] = useState<RubricItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const fetchRubric = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRubric(docId);
      setItems(data.items);
      setWarnings(data.warnings ?? []);
      setChecked(loadChecked(docId));
    } catch {
      // Sin rúbrica o error de red: estado vacío, no crash
      setItems([]);
      setWarnings([]);
      setChecked(loadChecked(docId));
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    void fetchRubric();
  }, [fetchRubric]);

  function handleToggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveChecked(docId, next);
      return next;
    });
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setPasteLoading(true);
    setPasteError(null);
    try {
      const data = await uploadRubricText(docId, pasteText);
      setItems(data.items);
      setWarnings(data.warnings ?? []);
      setPasteText('');
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : 'Error al parsear la rúbrica');
    } finally {
      setPasteLoading(false);
    }
  }

  function handleModalSave(newItems: RubricItem[], newWarnings: string[]) {
    setItems(newItems);
    setWarnings(newWarnings);
    setModalOpen(false);
  }

  if (loading) {
    return (
      <div className="rubric-panel rubric-panel--loading" aria-busy="true">
        <p className="rubric-panel__loading-text">Cargando rúbrica…</p>
      </div>
    );
  }

  return (
    <div className="rubric-panel">
      {/* Warning banner */}
      {warnings.length > 0 && (
        <div className="rubric-panel__warnings" role="alert">
          {warnings.map((w, i) => (
            <p key={i} className="rubric-panel__warning-item">
              {w}
            </p>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        /* ── Estado con rúbrica ── */
        <>
          <ul className="rubric-panel__list" aria-label="Criterios de la rúbrica">
            {items.map((item) => (
              <li key={item.id} className="rubric-panel__item">
                <label className="rubric-panel__item-label">
                  <input
                    type="checkbox"
                    className="rubric-panel__checkbox"
                    checked={checked.has(item.id)}
                    onChange={() => handleToggle(item.id)}
                    aria-label={`Marcar criterio: ${item.title}`}
                  />
                  <span className="rubric-panel__item-title">{item.title}</span>
                  <span className="rubric-panel__item-points">{item.points} pts</span>
                </label>
                {item.description && (
                  <p className="rubric-panel__item-description">{item.description}</p>
                )}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="rubric-panel__btn rubric-panel__btn--edit"
            onClick={() => setModalOpen(true)}
          >
            Editar rúbrica
          </button>
        </>
      ) : (
        /* ── Estado vacío ── */
        <>
          <button
            type="button"
            className="rubric-panel__btn rubric-panel__btn--upload"
            onClick={() => setModalOpen(true)}
          >
            Subir rúbrica
          </button>

          <form
            className="rubric-panel__paste-form"
            onSubmit={(e) => void handlePasteSubmit(e)}
            aria-label="Pegar texto de rúbrica"
          >
            <textarea
              className="rubric-panel__paste-textarea"
              placeholder="Pega el texto de tu rúbrica aquí"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              aria-label="Texto de la rúbrica"
            />
            {pasteError && (
              <p className="rubric-panel__paste-error" role="alert">
                {pasteError}
              </p>
            )}
            <button
              type="submit"
              className="rubric-panel__btn rubric-panel__btn--parse"
              disabled={pasteLoading || !pasteText.trim()}
            >
              {pasteLoading ? 'Procesando…' : 'Parsear texto'}
            </button>
          </form>
        </>
      )}

      {/* Modal de upload */}
      {modalOpen && (
        <RubricUploadModal
          docId={docId}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
