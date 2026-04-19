/**
 * Página /workspaces/:id — Editor principal del workspace.
 * Layout 3 zonas: sidebar izquierdo + documento central (Lexical) + panel derecho.
 *
 * En 2b: integra colaboración Yjs (provider + auto-save + contribution tracker).
 * Sin Athena (2c), sin APA/math (2d).
 *
 * Bloque 2b Colaboración.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import type { EditorState } from 'lexical';
import type { WebsocketProvider } from 'y-websocket';
import { getWorkspace, listMembers, updateWorkspace } from '../../services/workspacesApi';
import type { Workspace, WorkspaceMember } from '../../../shared/workspaces-types';
import ThreeZoneLayout from '../../components/workspaces/Layout/ThreeZoneLayout';
import LexicalEditor from '../../components/workspaces/Editor/LexicalEditor';
import { createWorkspaceProvider, type WorkspaceProviderHandle } from '../../services/yjsProvider';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useCharContributionTracker } from '../../hooks/useCharContributionTracker';
import { getAuthorColor } from '../../components/workspaces/authorColors';
import { useAuth } from '../../services/auth';
import ExportModal from '../../components/workspaces/Export/ExportModal';
import type { EditorBridgeHandle } from '../../components/workspaces/Athena/AthenaPanel';

interface Props {
  onNavigate: (path: string) => void;
}

const TOKEN_KEY = 'conniku_token';

function getCurrentMemberId(members: WorkspaceMember[], userId: string): string | null {
  return members.find((m) => m.user_id === userId)?.id ?? null;
}

// Awareness vacío para usar como fallback cuando no hay provider
const NOOP_AWARENESS = {
  getStates: () => new Map(),
  on: () => {},
  off: () => {},
  setLocalStateField: () => {},
  clientID: 0,
} as unknown as WebsocketProvider['awareness'];

export default function WorkspaceEditor({ onNavigate }: Props) {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // ── Bridge Athena (bloque 2c) ─────────────────────────────────────
  // El ref se pasa tanto a LexicalEditor (monta el plugin) como a ThreeZoneLayout
  // (que lo pasa a AthenaPanel para applyText/getSelection).
  const editorBridgeRef = useRef<EditorBridgeHandle>(null);

  // ── Provider Yjs ──────────────────────────────────────────────────
  const [providerHandle, setProviderHandle] = useState<WorkspaceProviderHandle | null>(null);

  // currentUser se deriva del AuthContext (fuente de verdad del usuario logueado).
  // Antes se leía de localStorage con claves que nunca se escribían → userId siempre
  // 'guest' en producción (CRÍTICO-2 del gap-finder Capa 5).
  const currentUser = useMemo(() => {
    if (!authUser) {
      return { userId: '', name: '', avatar: undefined, color: '#6B7280' };
    }
    const fullName =
      `${authUser.firstName ?? ''} ${authUser.lastName ?? ''}`.trim() || authUser.username;
    return {
      userId: authUser.id,
      name: fullName,
      avatar: authUser.avatar,
      color: getAuthorColor(authUser.id),
    };
  }, [authUser]);

  useEffect(() => {
    if (!id || !authUser) return;
    // Verificar que hay token antes de crear provider
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    // IMPORTANTE: el docId se pasa SIN prefijo (CRÍTICO-1 del gap-finder Capa 5).
    // El backend busca `WorkspaceDocument.id == doc_id` y los IDs son gen_id() sin
    // prefijo. El namespace "conniku-ws-{id}" se usa SOLO en LexicalEditor para
    // aislar el mapa interno de Lexical entre docs.
    const handle = createWorkspaceProvider(id, currentUser);
    setProviderHandle(handle);

    return () => {
      handle.destroy();
      setProviderHandle(null);
    };
  }, [id, currentUser, authUser]);

  // ── Y.Doc de fallback (sin provider activo) ───────────────────────
  // Se usa cuando el provider aún no está listo, para no pasar null a los hooks.
  const fallbackYdocRef = useRef(new Y.Doc());

  // ── Carga inicial del workspace ───────────────────────────────────
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

  // ── Auto-save ─────────────────────────────────────────────────────
  const activeYdoc = providerHandle?.ydoc ?? fallbackYdocRef.current;
  const activeAwareness = providerHandle?.awareness ?? NOOP_AWARENESS;

  // Si no hay id (ruta inválida), deshabilitar hooks pasando docId vacío pero
  // enabled=false a los que lo soporten. Para useAutoSave: solo habilitar
  // cuando hay id real + provider activo.
  const hooksEnabled = !!id && !!providerHandle;

  const { saveStatus } = useAutoSave({
    ydoc: activeYdoc,
    docId: id ?? '',
    currentUserId: currentUser.userId,
    awareness: activeAwareness,
    updateFn: (docId, patch) => updateWorkspace(docId, patch),
    debounceMs: 2000,
    enabled: hooksEnabled,
  });

  // ── Contribution tracker ──────────────────────────────────────────
  const memberId = getCurrentMemberId(members, currentUser.userId);
  useCharContributionTracker({
    ydoc: activeYdoc,
    docId: id ?? '',
    memberId: memberId ?? '',
    enabled: hooksEnabled && !!memberId,
    flushMs: 30_000,
  });

  // ── Manejo de cambios del editor (modo no-colaborativo) ───────────
  const handleEditorChange = useCallback((_editorState: EditorState) => {
    // En modo colaborativo, useAutoSave escucha el Y.Doc directamente.
    // Callback vacío por compatibilidad con la firma de LexicalEditor.
  }, []);

  // ── Guardar título ────────────────────────────────────────────────
  const handleTitleSave = () => {
    if (!id || !titleDraft.trim() || titleDraft === workspace?.title) {
      setEditingTitle(false);
      setTitleError(null);
      return;
    }
    setTitleError(null);
    updateWorkspace(id, { title: titleDraft.trim() })
      .then((updated) => {
        setWorkspace(updated);
        setEditingTitle(false);
      })
      .catch((err: Error) => {
        setTitleError(err.message || 'No se pudo guardar el título');
        // Mantener el modo de edición abierto para que el usuario pueda reintentar
      });
  };

  // ── Estado de conexión para el chat ──────────────────────────────
  const isConnected = providerHandle ? providerHandle.status$.get() === 'connected' : false;

  // ── Awareness: usuarios online (suscripción a cambios) ───────────
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!providerHandle) {
      setOnlineUserIds(new Set());
      return;
    }

    const awareness = providerHandle.awareness;

    function refreshOnline() {
      const states = awareness.getStates();
      const ids = new Set<string>();
      states.forEach((state) => {
        const user = (state as { user?: { userId?: string } }).user;
        if (user?.userId) ids.add(user.userId);
      });
      setOnlineUserIds(ids);
    }

    // Estado inicial + suscripción a cambios de awareness
    refreshOnline();
    awareness.on('update', refreshOnline);

    return () => {
      awareness.off('update', refreshOnline);
    };
  }, [providerHandle]);

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

  // ── Configuración de colaboración para LexicalEditor ─────────────
  const collaborationConfig = providerHandle
    ? {
        ydoc: providerHandle.ydoc,
        provider: providerHandle.provider,
        awareness: providerHandle.awareness,
        userMeta: currentUser,
      }
    : undefined;

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
            <>
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
                    setTitleError(null);
                  }
                }}
                maxLength={255}
                aria-label="Título del documento"
                aria-invalid={titleError !== null}
                aria-describedby={titleError ? 'ws-title-error' : undefined}
                autoFocus
              />
              {titleError && (
                <span id="ws-title-error" className="ws-editor-title-error" role="alert">
                  {titleError}
                </span>
              )}
            </>
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

        {/* Indicador de guardado — conectado al estado real del hook useAutoSave */}
        <div className="ws-editor-save-status" aria-live="polite">
          {saveStatus === 'saved' && <span className="ws-save-saved">Guardado</span>}
          {saveStatus === 'saving' && <span className="ws-save-saving">Guardando...</span>}
          {saveStatus === 'unsaved' && <span className="ws-save-unsaved">Sin guardar</span>}
          {saveStatus === 'offline' && <span className="ws-save-offline">Sin conexión</span>}
        </div>

        <nav className="ws-editor-nav" aria-label="Opciones del documento">
          <button
            type="button"
            className="ws-editor-nav-btn"
            onClick={() => setExportOpen(true)}
            aria-label="Exportar documento"
          >
            Exportar
          </button>
          <button
            type="button"
            className="ws-editor-nav-btn"
            onClick={() => onNavigate(`/workspaces/${id}/settings`)}
          >
            Configuración
          </button>
        </nav>
      </header>

      {exportOpen && id && (
        <ExportModal
          docId={id}
          docTitle={workspace.title}
          htmlContent={document.querySelector('.ws-editor-content')?.innerHTML ?? ''}
          onClose={() => setExportOpen(false)}
        />
      )}

      {/* Layout 3 zonas */}
      <ThreeZoneLayout
        members={members}
        chatEnabled={true}
        isConnected={isConnected}
        docId={id ?? ''}
        currentUser={currentUser}
        onlineUserIds={onlineUserIds}
        athenaEnabled={true}
        editorBridge={editorBridgeRef}
        onNavigate={onNavigate}
      >
        <LexicalEditor
          onChange={handleEditorChange}
          namespace={`conniku-ws-${id}`}
          collaborationConfig={collaborationConfig}
          athenaBridgeRef={editorBridgeRef}
        />
      </ThreeZoneLayout>
    </div>
  );
}
