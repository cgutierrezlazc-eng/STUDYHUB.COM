/**
 * CommentsPanel — panel lateral de threads de comentarios.
 *
 * Muestra:
 * - Filtros: "Todos" | "Sin resolver" | "Mencionados a mí".
 * - Lista de threads agrupados por anchor_id (cada thread = raíz + replies).
 * - Input para crear nuevo comentario.
 *
 * El panel carga los comentarios al montar llamando a listComments.
 * Crear/editar/eliminar/resolver actualizan el estado local optimistamente
 * y hacen la llamada al API.
 *
 * Sub-bloque 2d.8 Comentarios inline + Menciones.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { WorkspaceComment, WorkspaceMember } from '../../../../shared/workspaces-types';
import {
  listComments,
  createComment,
  patchComment,
  deleteComment,
  resolveComment,
} from '../../../services/workspacesApi';
import CommentThread from './CommentThread';
import CommentInput from './CommentInput';

type FilterType = 'all' | 'unresolved' | 'mentioned';

interface CurrentUser {
  userId: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface CommentsPanelProps {
  docId: string;
  currentUser: CurrentUser;
  members: WorkspaceMember[];
  /** anchor_id inicial para filtrar (opcional — si se pasa, solo muestra ese thread) */
  anchorId?: string;
}

/** Agrupa comentarios por anchor_id, separando raíces de replies. */
function groupByAnchor(
  comments: WorkspaceComment[]
): Map<string, { root: WorkspaceComment; replies: WorkspaceComment[] }> {
  const roots = comments.filter((c) => c.parent_id === null);
  const replies = comments.filter((c) => c.parent_id !== null);

  const map = new Map<string, { root: WorkspaceComment; replies: WorkspaceComment[] }>();
  for (const root of roots) {
    const threadReplies = replies
      .filter((r) => r.parent_id === root.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    map.set(root.id, { root, replies: threadReplies });
  }
  return map;
}

export default function CommentsPanel({
  docId,
  currentUser,
  members,
  anchorId,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para reply en curso: id del comentario raíz al que se está respondiendo
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // Estado para edición en curso: id + contenido previo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Carga inicial
  useEffect(() => {
    setLoading(true);
    void listComments(docId, anchorId)
      .then((res) => {
        setComments(res.comments);
        setError(null);
      })
      .catch(() => setError('No se pudieron cargar los comentarios.'))
      .finally(() => setLoading(false));
  }, [docId, anchorId]);

  /** Filtra comentarios raíz según el filtro activo. */
  const filteredComments = comments.filter((c) => {
    if (c.parent_id !== null) return true; // las replies siempre pasan (se filtran por su raíz)
    if (filter === 'unresolved') return !c.resolved;
    if (filter === 'mentioned') return c.mentions?.includes(currentUser.userId) ?? false;
    return true;
  });

  const grouped = groupByAnchor(filteredComments);
  const threads = Array.from(grouped.values()).sort((a, b) =>
    a.root.created_at.localeCompare(b.root.created_at)
  );

  const handleCreateComment = useCallback(
    (content: string) => {
      void createComment(docId, { content, anchor_id: anchorId ?? '' })
        .then((newComment) => {
          setComments((prev) => [...prev, newComment]);
        })
        .catch(() => {});
    },
    [docId, anchorId]
  );

  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId);
    setEditingId(null);
  }, []);

  const handleSubmitReply = useCallback(
    (content: string) => {
      if (!replyingTo) return;
      const parentComment = comments.find((c) => c.id === replyingTo);
      if (!parentComment) return;
      void createComment(docId, {
        content,
        anchor_id: parentComment.anchor_id,
        parent_id: replyingTo,
      })
        .then((newReply) => {
          setComments((prev) => [...prev, newReply]);
          setReplyingTo(null);
        })
        .catch(() => {});
    },
    [docId, comments, replyingTo]
  );

  const handleEdit = useCallback((commentId: string, currentContent: string) => {
    setEditingId(commentId);
    setEditingContent(currentContent);
    setReplyingTo(null);
  }, []);

  const handleSubmitEdit = useCallback(
    (content: string) => {
      if (!editingId) return;
      void patchComment(docId, editingId, { content })
        .then((updated) => {
          setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setEditingId(null);
          setEditingContent('');
        })
        .catch(() => {});
    },
    [docId, editingId]
  );

  const handleDelete = useCallback(
    (commentId: string) => {
      void deleteComment(docId, commentId)
        .then(() => {
          setComments((prev) =>
            prev.filter((c) => c.id !== commentId && c.parent_id !== commentId)
          );
        })
        .catch(() => {});
    },
    [docId]
  );

  const handleResolve = useCallback(
    (commentId: string, resolved: boolean) => {
      void resolveComment(docId, commentId, resolved)
        .then(() => {
          setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, resolved } : c)));
        })
        .catch(() => {});
    },
    [docId]
  );

  const rootCommentCount = comments.filter((c) => c.parent_id === null).length;

  return (
    <div className="ws-comments-panel" aria-label="Panel de comentarios">
      {/* Filtros */}
      <div className="ws-comments-filters" role="group" aria-label="Filtros de comentarios">
        <button
          type="button"
          className={`ws-comments-filter-btn${filter === 'all' ? ' ws-comments-filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          Todos
        </button>
        <button
          type="button"
          className={`ws-comments-filter-btn${filter === 'unresolved' ? ' ws-comments-filter-btn--active' : ''}`}
          onClick={() => setFilter('unresolved')}
          aria-pressed={filter === 'unresolved'}
        >
          Sin resolver
        </button>
        <button
          type="button"
          className={`ws-comments-filter-btn${filter === 'mentioned' ? ' ws-comments-filter-btn--active' : ''}`}
          onClick={() => setFilter('mentioned')}
          aria-pressed={filter === 'mentioned'}
        >
          Mencionados a mí
        </button>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="ws-comments-loading" aria-live="polite">
          Cargando comentarios...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ws-comments-error" role="alert">
          {error}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && rootCommentCount === 0 && (
        <div className="ws-comments-empty" aria-live="polite">
          <p>Aún no hay comentarios en este documento.</p>
        </div>
      )}

      {/* Lista de threads */}
      {!loading && threads.length > 0 && (
        <div className="ws-comments-list" aria-label="Lista de threads de comentarios">
          {threads.map(({ root, replies }) => (
            <div key={root.id} className="ws-comment-thread-wrapper">
              <CommentThread
                comment={root}
                replies={replies}
                currentUser={currentUser}
                members={members}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
              />

              {/* Input de reply inline */}
              {replyingTo === root.id && (
                <div className="ws-comment-reply-input">
                  <CommentInput
                    members={members}
                    placeholder="Responde al comentario..."
                    onSubmit={handleSubmitReply}
                  />
                  <button
                    type="button"
                    className="ws-comment-btn ws-comment-btn--cancel"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input de edición inline cuando está activo */}
      {editingId && (
        <div className="ws-comment-edit-input">
          <CommentInput
            members={members}
            placeholder="Edita el comentario..."
            onSubmit={handleSubmitEdit}
            initialValue={editingContent}
          />
          <button
            type="button"
            className="ws-comment-btn ws-comment-btn--cancel"
            onClick={() => {
              setEditingId(null);
              setEditingContent('');
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Input de nuevo comentario (al pie del panel) */}
      <div className="ws-comments-new-comment">
        <CommentInput
          members={members}
          placeholder="Añade un comentario..."
          onSubmit={handleCreateComment}
        />
      </div>
    </div>
  );
}
