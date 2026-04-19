/**
 * Modal de upload de rúbrica.
 * Sub-bloque 2d.6 — Rúbrica upload + checklist.
 *
 * Permite al usuario:
 * - Subir un archivo PDF/DOCX/DOC/TXT mediante drag+drop o input file nativo.
 * - O pegar el texto directamente en un textarea alternativo.
 * - Parsear y ver los ítems extraídos antes de guardar.
 * - Ver warnings si el parser no pudo extraer todo.
 */

import React, { useRef, useState } from 'react';
import type { RubricItem } from '../../../../shared/workspaces-types';
import { uploadRubricText, uploadRubricFile } from '../../../services/workspacesApi';

interface RubricUploadModalProps {
  docId: string;
  onSave: (items: RubricItem[], warnings: string[]) => void;
  onClose: () => void;
}

const ACCEPT = '.pdf,.docx,.doc,.txt';

export default function RubricUploadModal({ docId, onSave, onClose }: RubricUploadModalProps) {
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsedItems, setParsedItems] = useState<RubricItem[] | null>(null);
  const [parsedWarnings, setParsedWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleParse() {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (selectedFile) {
        data = await uploadRubricFile(docId, selectedFile);
      } else if (textInput.trim()) {
        data = await uploadRubricText(docId, textInput);
      } else {
        setError('Debes subir un archivo o pegar texto antes de parsear.');
        setLoading(false);
        return;
      }
      setParsedItems(data.items);
      setParsedWarnings(data.warnings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al parsear la rúbrica');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!parsedItems) return;
    onSave(parsedItems, parsedWarnings);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setParsedItems(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0] ?? null;
    if (file) {
      setSelectedFile(file);
      setParsedItems(null);
      setError(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  return (
    <div
      className="rubric-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Subir rúbrica"
    >
      <div className="rubric-modal">
        <header className="rubric-modal__header">
          <h2 className="rubric-modal__title">Subir rúbrica</h2>
          <button
            type="button"
            className="rubric-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </header>

        <div className="rubric-modal__body">
          {/* Zona de drop / input file */}
          <div
            className={`rubric-modal__dropzone${dragOver ? ' rubric-modal__dropzone--active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            aria-label="Zona de arrastre de archivo"
          >
            {selectedFile ? (
              <p className="rubric-modal__file-name">
                Archivo: <strong>{selectedFile.name}</strong>
              </p>
            ) : (
              <p className="rubric-modal__dropzone-hint">
                Arrastra tu archivo aquí o{' '}
                <button
                  type="button"
                  className="rubric-modal__browse-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  selecciónalo
                </button>
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="rubric-modal__file-input"
              aria-label="Seleccionar archivo de rúbrica"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Separador */}
          <p className="rubric-modal__separator">O pega el texto aquí</p>

          {/* Textarea alternativa */}
          <textarea
            className="rubric-modal__textarea"
            placeholder="Pega el texto de tu rúbrica aquí"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setParsedItems(null);
            }}
            rows={6}
            aria-label="Texto alternativo de la rúbrica"
          />

          {/* Error */}
          {error && (
            <p className="rubric-modal__error" role="alert">
              {error}
            </p>
          )}

          {/* Warning banner tras parseo */}
          {parsedWarnings.length > 0 && (
            <div
              className="rubric-modal__warnings"
              role="alert"
              aria-label="Advertencias del parseo"
            >
              {parsedWarnings.map((w, i) => (
                <p key={i} className="rubric-modal__warning-item">
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Lista de ítems parseados */}
          {parsedItems !== null && (
            <ul className="rubric-modal__items" aria-label="Ítems parseados de la rúbrica">
              {parsedItems.length === 0 ? (
                <li className="rubric-modal__item rubric-modal__item--empty">
                  No se encontraron criterios. Revisa el formato del archivo o texto.
                </li>
              ) : (
                parsedItems.map((item) => (
                  <li key={item.id} className="rubric-modal__item">
                    <span className="rubric-modal__item-title">{item.title}</span>
                    <span className="rubric-modal__item-points">{item.points} pts</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <footer className="rubric-modal__footer">
          <button
            type="button"
            className="rubric-modal__btn rubric-modal__btn--parse"
            onClick={() => void handleParse()}
            disabled={loading || (!selectedFile && !textInput.trim())}
            aria-busy={loading}
          >
            {loading ? 'Procesando…' : 'Parsear'}
          </button>

          {parsedItems !== null && parsedItems.length > 0 && (
            <button
              type="button"
              className="rubric-modal__btn rubric-modal__btn--save"
              onClick={handleSave}
            >
              Guardar
            </button>
          )}

          <button
            type="button"
            className="rubric-modal__btn rubric-modal__btn--cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
}
