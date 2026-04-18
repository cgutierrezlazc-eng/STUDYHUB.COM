/**
 * Página /workspaces/:id/settings — Configuración del workspace.
 * Scaffolding en 2a: muestra metadata y lista de miembros (solo lectura).
 * Configuración avanzada (roles, permisos, rúbrica, tapa) es 2d.
 *
 * Bloque 2a Fundación.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspace, listMembers } from '../../services/workspacesApi';
import type { Workspace, WorkspaceMember } from '../../../shared/workspaces-types';

interface Props {
  onNavigate: (path: string) => void;
}

export default function WorkspaceSettings({ onNavigate }: Props) {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getWorkspace(id), listMembers(id)])
      .then(([ws, membersData]) => {
        setWorkspace(ws);
        setMembers(membersData.members);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="ws-settings-loading" aria-label="Cargando configuración...">
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-settings-error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => onNavigate('/workspaces')}>
          Volver
        </button>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="ws-settings-page">
      <header className="ws-settings-header">
        <button
          type="button"
          className="ws-back-btn"
          onClick={() => onNavigate(`/workspaces/${id}`)}
          aria-label="Volver al editor"
        >
          ← Volver al documento
        </button>
        <h1 className="ws-settings-title">Configuración del workspace</h1>
      </header>

      <div className="ws-settings-body">
        {/* Metadata */}
        <section className="ws-settings-section" aria-labelledby="ws-meta-title">
          <h2 id="ws-meta-title" className="ws-settings-section-title">
            Información
          </h2>
          <dl className="ws-settings-dl">
            <dt>Título</dt>
            <dd>{workspace.title}</dd>
            {workspace.course_name && (
              <>
                <dt>Ramo / Curso</dt>
                <dd>{workspace.course_name}</dd>
              </>
            )}
            <dt>Formato de citas</dt>
            <dd>APA {workspace.apa_edition}</dd>
            <dt>Creado</dt>
            <dd>
              {new Date(workspace.created_at).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </dl>
        </section>

        {/* Miembros */}
        <section className="ws-settings-section" aria-labelledby="ws-members-title">
          <h2 id="ws-members-title" className="ws-settings-section-title">
            Miembros
          </h2>
          {members.length === 0 ? (
            <p className="ws-placeholder-text">Solo tú por ahora.</p>
          ) : (
            <ul className="ws-member-list" aria-label="Lista de miembros">
              {members.map((m) => (
                <li key={m.id} className="ws-member-item">
                  <span className="ws-member-name">{m.user?.name ?? m.user_id}</span>
                  <span className="ws-member-role">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Placeholder configuración avanzada */}
        <section className="ws-settings-section ws-settings-section--coming-soon">
          <h2 className="ws-settings-section-title">Configuración avanzada</h2>
          <p className="ws-placeholder-text">
            Invitar miembros, gestionar roles, cargar rúbrica, personalizar tapa y más estarán
            disponibles próximamente.
          </p>
        </section>
      </div>
    </div>
  );
}
