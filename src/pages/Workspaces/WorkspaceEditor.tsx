/**
 * Página /workspaces/:id — Editor principal del workspace.
 * Layout 3 zonas: sidebar izquierdo + documento central (Lexical) + panel derecho.
 *
 * En 2a: zona central funcional, zonas derecha e izquierda son scaffolding.
 * Sin Yjs (2b), sin Athena (2c), sin APA/math (2d).
 *
 * Bloque 2a Fundación.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { EditorState } from 'lexical';
import { getWorkspace, listMembers, updateWorkspace } from '../../services/workspacesApi';
import type { Workspace, WorkspaceMember } from '../../../shared/workspaces-types';
import ThreeZoneLayout from '../../components/workspaces/Layout/ThreeZoneLayout';
import LexicalEditor from '../../components/workspaces/Editor/LexicalEditor';

interface Props {
  onNavigate: (path: string) => void;
}

export default function WorkspaceEditor({ onNavigate }: Props) {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getWorkspace(id), listMembers(id)])
      .then(([ws, membersData]) => {
        setWorkspace(ws);
        setTitleDraft(ws.title);
        setMembers(membersData.members);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditorChange = useCallback((_editorState: EditorState) => {
    // En 2a solo marcamos "sin guardar". Auto-save real viene en 2b.
    setSaveStatus('unsaved');
  }, []);

  const handleTitleSave = () => {
    if (!id || !titleDraft.trim() || titleDraft === workspace?.title) {
      setEditingTitle(false);
      return;
    }
    setSaveStatus('saving');
    updateWorkspace(id, { title: titleDraft.trim() })
      .then((updated) => {
        setWorkspace(updated);
        setSaveStatus('saved');
      })
      .catch(() => setSaveStatus('unsaved'))
      .finally(() => setEditingTitle(false));
  };

  if (loading) {
    return (
      <div className="ws-editor-loading" aria-label="Cargando documento...">
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        <div className="skeleton skeleton-text" style={{ width: '30%' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ws-editor-error" role="alert">
        <p>Error al cargar el documento: {error}</p>
        <button type="button" onClick={() => onNavigate('/workspaces')}>
          Volver a Workspaces
        </button>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="ws-editor-page">
      {/* TopBar del editor */}
      <header className="ws-editor-topbar" role="banner">
        <button
          className="ws-editor-back"
          onClick={() => onNavigate('/workspaces')}
          type="button"
          aria-label="Volver a Workspaces"
        >
          ← Workspaces
        </button>

        <div className="ws-editor-title-area">
          {editingTitle ? (
            <input
              className="ws-editor-title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setTitleDraft(workspace.title);
                  setEditingTitle(false);
                }
              }}
              maxLength={255}
              aria-label="Título del documento"
              autoFocus
            />
          ) : (
            <button
              className="ws-editor-title-btn"
              onClick={() => setEditingTitle(true)}
              type="button"
              aria-label={`Editar título: ${workspace.title}`}
            >
              {workspace.title}
            </button>
          )}
        </div>

        <div className="ws-editor-save-status" aria-live="polite">
          {saveStatus === 'saved' && <span className="ws-save-saved">Guardado</span>}
          {saveStatus === 'saving' && <span className="ws-save-saving">Guardando...</span>}
          {saveStatus === 'unsaved' && <span className="ws-save-unsaved">Sin guardar</span>}
        </div>

        <nav className="ws-editor-nav" aria-label="Opciones del documento">
          <button
            type="button"
            className="ws-editor-nav-btn"
            onClick={() => onNavigate(`/workspaces/${id}/settings`)}
          >
            Configuración
          </button>
        </nav>
      </header>

      {/* Layout 3 zonas */}
      <ThreeZoneLayout members={members}>
        <LexicalEditor onChange={handleEditorChange} />
      </ThreeZoneLayout>
    </div>
  );
}
