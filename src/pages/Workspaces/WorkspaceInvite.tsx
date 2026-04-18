/**
 * Página /workspaces/invite/:token — Aceptar invitación a workspace.
 * Scaffolding funcional en 2a: lee el token, valida contra backend,
 * muestra metadata del workspace y botón "Unirme".
 *
 * Si el usuario no está autenticado, se redirige a login con
 * ?redirect=/workspaces/invite/:token (decisión incertidumbre 9.4 del plan 2a).
 *
 * Bloque 2a Fundación.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { validateInviteToken, acceptInvite } from '../../services/workspacesApi';
import type { InviteTokenInfo } from '../../../shared/workspaces-types';

interface Props {
  onNavigate: (path: string) => void;
}

export default function WorkspaceInvite({ onNavigate }: Props) {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<InviteTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido.');
      setLoading(false);
      return;
    }
    validateInviteToken(token)
      .then((data) => {
        if (!data.valid) {
          setError('Esta invitación no es válida o ha expirado.');
        } else {
          setInfo(data);
        }
      })
      .catch(() => setError('Esta invitación no es válida o ha expirado.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = () => {
    if (!token) return;
    setJoining(true);
    acceptInvite(token)
      .then((res) => onNavigate(`/workspaces/${res.workspace_id}`))
      .catch((err: Error) => {
        setError(err.message || 'Error al unirte al workspace. Intenta de nuevo.');
        setJoining(false);
      });
  };

  if (loading) {
    return (
      <div className="ws-invite-page">
        <div className="ws-invite-card">
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-invite-page">
        <div className="ws-invite-card ws-invite-card--error">
          <h1 className="ws-invite-title">Invitación inválida</h1>
          <p className="ws-invite-message">{error}</p>
          <button
            type="button"
            className="ws-btn ws-btn--ghost"
            onClick={() => onNavigate('/workspaces')}
          >
            Ir a Workspaces
          </button>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const roleLabel: Record<string, string> = {
    owner: 'propietario',
    editor: 'editor',
    viewer: 'lector',
  };

  return (
    <div className="ws-invite-page">
      <div className="ws-invite-card">
        <p className="ws-invite-from">Fuiste invitado por {info.owner_name}</p>
        <h1 className="ws-invite-title">{info.workspace_title}</h1>
        <p className="ws-invite-role">
          Rol: <strong>{roleLabel[info.proposed_role] ?? info.proposed_role}</strong>
        </p>
        <div className="ws-invite-actions">
          <button
            type="button"
            className="ws-btn ws-btn--primary"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? 'Uniéndome...' : 'Unirme al workspace'}
          </button>
          <button
            type="button"
            className="ws-btn ws-btn--ghost"
            onClick={() => onNavigate('/workspaces')}
            disabled={joining}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
