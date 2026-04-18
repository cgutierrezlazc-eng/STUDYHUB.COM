/**
 * Página /workspaces — Lista de workspaces del usuario.
 * Bloque 2a Fundación.
 */

import React, { useEffect, useState } from 'react';
import { listWorkspaces, deleteWorkspace } from '../../services/workspacesApi';
import type { Workspace } from '../../../shared/workspaces-types';
import CreateWorkspaceDialog from '../../components/workspaces/Share/CreateWorkspaceDialog';
import WorkspaceCard from '../../components/workspaces/WorkspaceCard';

interface Props {
  onNavigate: (path: string) => void;
}

export default function WorkspacesList({ onNavigate }: Props) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    listWorkspaces()
      .then((data) => setWorkspaces(data.workspaces))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (ws: Workspace) => {
    setShowCreate(false);
    onNavigate(`/workspaces/${ws.id}`);
  };

  const handleDelete = (id: string) => {
    deleteWorkspace(id)
      .then(() => setWorkspaces((prev) => prev.filter((w) => w.id !== id)))
      .catch((err: Error) => setError(err.message));
  };

  return (
    <div className="ws-list-page">
      <div className="ws-list-header">
        <h1 className="ws-list-title">Workspaces</h1>
        <button
          className="ws-btn ws-btn--primary"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          Nuevo workspace
        </button>
      </div>

      {error && (
        <div className="ws-error-banner" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="ws-list-loading" aria-label="Cargando workspaces...">
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="ws-empty-state">
          <p className="ws-empty-title">Aún no tienes workspaces</p>
          <p className="ws-empty-sub">Crea tu primer documento colaborativo para comenzar.</p>
          <button
            className="ws-btn ws-btn--primary"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            Crear primer workspace
          </button>
        </div>
      ) : (
        <div className="ws-grid">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              onOpen={() => onNavigate(`/workspaces/${ws.id}`)}
              onDelete={() => handleDelete(ws.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWorkspaceDialog onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
