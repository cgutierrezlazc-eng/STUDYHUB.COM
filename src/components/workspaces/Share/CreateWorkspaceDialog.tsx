/**
 * Modal para crear un nuevo workspace.
 * Campos: título (requerido), nombre del curso (opcional), edición APA.
 *
 * Decisión D4 del plan 2a: solo estos tres campos en 2a.
 * Rúbrica, plantillas, tapa y toggles de features van en 2d.
 *
 * Bloque 2a Fundación.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createWorkspace } from '../../../services/workspacesApi';
import type { Workspace, ApaEdition } from '../../../../shared/workspaces-types';

interface Props {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

const APA_OPTIONS: { value: ApaEdition; label: string; disabled?: boolean }[] = [
  { value: '7', label: 'APA 7' },
  { value: '6', label: 'APA 6' },
  { value: 'ieee', label: 'IEEE', disabled: true },
  { value: 'chicago', label: 'Chicago', disabled: true },
  { value: 'mla', label: 'MLA', disabled: true },
];

export default function CreateWorkspaceDialog({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [apaEdition, setApaEdition] = useState<ApaEdition>('7');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Foco automático al abrir
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es obligatorio.');
      titleRef.current?.focus();
      return;
    }
    if (title.trim().length > 255) {
      setError('El título no puede superar los 255 caracteres.');
      return;
    }

    setSubmitting(true);
    setError(null);

    createWorkspace({
      title: title.trim(),
      course_name: courseName.trim() || undefined,
      apa_edition: apaEdition,
    })
      .then(onCreated)
      .catch((err: Error) => {
        setError(err.message || 'Error al crear el workspace. Intenta de nuevo.');
        setSubmitting(false);
      });
  };

  return (
    <div
      className="ws-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <dialog className="ws-dialog" open aria-modal="true" aria-labelledby="ws-dialog-title">
        <div className="ws-dialog-head">
          <h2 id="ws-dialog-title" className="ws-dialog-title">
            Nuevo workspace
          </h2>
          <button className="ws-dialog-close" onClick={onClose} type="button" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="ws-dialog-body">
            {error && (
              <div className="ws-dialog-error" role="alert">
                {error}
              </div>
            )}

            {/* Título */}
            <div className="ws-form-row">
              <label htmlFor="ws-title" className="ws-form-label">
                Título{' '}
                <span aria-hidden="true" className="ws-required">
                  *
                </span>
              </label>
              <input
                ref={titleRef}
                id="ws-title"
                type="text"
                className="ws-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
                placeholder="Ej: Informe final Biología Molecular"
                aria-required="true"
              />
            </div>

            {/* Nombre del curso */}
            <div className="ws-form-row">
              <label htmlFor="ws-course" className="ws-form-label">
                Nombre del ramo / curso
                <span className="ws-form-hint">(opcional)</span>
              </label>
              <input
                id="ws-course"
                type="text"
                className="ws-input"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                maxLength={255}
                placeholder="Ej: BIO-501 Biología Molecular"
              />
            </div>

            {/* Edición APA */}
            <div className="ws-form-row">
              <label htmlFor="ws-apa" className="ws-form-label">
                Formato de citas
              </label>
              <select
                id="ws-apa"
                className="ws-input"
                value={apaEdition}
                onChange={(e) => setApaEdition(e.target.value as ApaEdition)}
              >
                {APA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                    {opt.disabled ? ' — próximamente' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Placeholder opciones futuras */}
            <div className="ws-dialog-coming-soon">
              Más opciones estarán disponibles próximamente: rúbrica, tapa personalizada, plantillas
              y configuración de colaboración.
            </div>
          </div>

          <div className="ws-dialog-foot">
            <button
              type="button"
              className="ws-btn ws-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ws-btn ws-btn--primary"
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'Creando...' : 'Crear workspace'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
