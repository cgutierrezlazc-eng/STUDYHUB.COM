/**
 * Card reutilizable para la lista de workspaces.
 * Muestra: título, nombre del curso, edición APA, fecha de última modificación.
 * Bloque 2a Fundación.
 */

import React from 'react';
import type { Workspace } from '../../../shared/workspaces-types';

interface Props {
  workspace: Workspace;
  onOpen: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function WorkspaceCard({ workspace, onOpen, onDelete }: Props) {
  return (
    <div className="ws-card" role="article" aria-label={`Workspace: ${workspace.title}`}>
      <button
        className="ws-card-body"
        onClick={onOpen}
        type="button"
        aria-label={`Abrir workspace ${workspace.title}`}
      >
        <h3 className="ws-card-title">{workspace.title}</h3>
        {workspace.course_name && <p className="ws-card-course">{workspace.course_name}</p>}
        <div className="ws-card-meta">
          <span className="ws-card-apa">APA {workspace.apa_edition}</span>
          <span className="ws-card-date">{formatDate(workspace.updated_at)}</span>
        </div>
      </button>
      <div className="ws-card-actions">
        <button
          className="ws-card-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          type="button"
          aria-label={`Eliminar workspace ${workspace.title}`}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
