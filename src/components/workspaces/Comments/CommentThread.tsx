/**
 * CommentThread — card de thread: comentario raíz + lista de replies indentadas.
 *
 * Props:
 * - comment: comentario raíz del thread.
 * - replies: lista de respuestas al comentario raíz.
 * - currentUser: usuario actual {userId, name, role}.
 * - members: lista de miembros del workspace (para resolver nombres).
 * - onReply: callback(commentId) al hacer click en Responder.
 * - onEdit: callback(commentId, currentContent) al hacer click en Editar.
 * - onDelete: callback(commentId) al hacer click en Eliminar.
 * - onResolve: callback(commentId, resolved) al hacer click en Resolver/Reabrir.
 *
 * Permisos:
 * - Editar: solo el autor del comentario.
 * - Eliminar: autor del comentario u owner del workspace.
 * - Resolver: rol editor u owner del workspace.
 *
 * Avatar con color determinístico reutilizando getAuthorColor.
 * Timestamp relativo simple.
 *
 * Sub-bloque 2d.8 Comentarios inline + Menciones.
 */

import React from 'react';
import type { WorkspaceComment, WorkspaceMember } from '../../../../shared/workspaces-types';
import { getAuthorColor } from '../authorColors';

interface CurrentUser {
  userId: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface CommentThreadProps {
  comment: WorkspaceComment;
  replies: WorkspaceComment[];
  currentUser: CurrentUser;
  members: WorkspaceMember[];
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, currentContent: string) => void;
  onDelete: (commentId: string) => void;
  onResolve: (commentId: string, resolved: boolean) => void;
}

/** Timestamp relativo simple para mostrar cuándo se creó el comentario. */
function relativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'hace un momento';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `hace ${days} d`;
  } catch {
    return '';
  }
}

/** Resuelve el nombre del autor por user_id en la lista de miembros. */
function resolveName(userId: string, members: WorkspaceMember[]): string {
  const member = members.find((m) => m.user_id === userId);
  return member?.user?.name ?? userId;
}

/** Renderiza un comentario individual (raíz o reply). */
function CommentItem({
  comment,
  members,
  canEdit,
  canDelete,
  canResolve,
  isRoot,
  onReply,
  onEdit,
  onDelete,
  onResolve,
}: {
  comment: WorkspaceComment;
  members: WorkspaceMember[];
  canEdit: boolean;
  canDelete: boolean;
  canResolve: boolean;
  isRoot: boolean;
  onReply: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
}) {
  const authorName = resolveName(comment.user_id, members);
  const authorColor = getAuthorColor(comment.user_id);
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <div
      className="ws-comment-item"
      data-resolved={comment.resolved ? 'true' : 'false'}
      data-testid={`comment-item-${comment.id}`}
    >
      <div className="ws-comment-header">
        <span
          className="ws-comment-avatar"
          style={{ backgroundColor: authorColor }}
          aria-hidden="true"
        >
          {authorInitial}
        </span>
        <span className="ws-comment-author">{authorName}</span>
        <time className="ws-comment-time" dateTime={comment.created_at} title={comment.created_at}>
          {relativeTime(comment.created_at)}
        </time>
        {comment.resolved && (
          <span className="ws-comment-resolved-badge" aria-label="Resuelto">
            Resuelto
          </span>
        )}
      </div>

      <div className="ws-comment-content">
        <p className="ws-comment-text">{comment.content}</p>
      </div>

      <div className="ws-comment-actions">
        {isRoot && (
          <button
            type="button"
            className="ws-comment-btn ws-comment-btn--reply"
            onClick={() => onReply(comment.id)}
            aria-label="Responder a este comentario"
          >
            Responder
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            className="ws-comment-btn ws-comment-btn--edit"
            onClick={() => onEdit(comment.id, comment.content)}
            aria-label="Editar comentario"
          >
            Editar
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            className="ws-comment-btn ws-comment-btn--delete"
            onClick={() => onDelete(comment.id)}
            aria-label="Eliminar comentario"
          >
            Eliminar
          </button>
        )}

        {isRoot && canResolve && !comment.resolved && (
          <button
            type="button"
            className="ws-comment-btn ws-comment-btn--resolve"
            onClick={() => onResolve(comment.id, true)}
            aria-label="Resolver comentario"
          >
            Resolver
          </button>
        )}

        {isRoot && canResolve && comment.resolved && (
          <button
            type="button"
            className="ws-comment-btn ws-comment-btn--reopen"
            onClick={() => onResolve(comment.id, false)}
            aria-label="Reabrir comentario"
          >
            Reabrir
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({
  comment,
  replies,
  currentUser,
  members,
  onReply,
  onEdit,
  onDelete,
  onResolve,
}: CommentThreadProps) {
  const isRootAuthor = comment.user_id === currentUser.userId;
  const isOwner = currentUser.role === 'owner';
  const canEditRoot = isRootAuthor;
  const canDeleteRoot = isRootAuthor || isOwner;
  const canResolve = currentUser.role === 'editor' || isOwner;

  return (
    <div
      className="ws-comment-thread"
      aria-label="Hilo de comentario"
      data-anchor={comment.anchor_id}
    >
      {/* Comentario raíz */}
      <CommentItem
        comment={comment}
        members={members}
        canEdit={canEditRoot}
        canDelete={canDeleteRoot}
        canResolve={canResolve}
        isRoot={true}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onResolve={onResolve}
      />

      {/* Replies indentadas */}
      {replies.length > 0 && (
        <div className="ws-comment-replies" aria-label="Respuestas">
          {replies.map((reply) => {
            const isReplyAuthor = reply.user_id === currentUser.userId;
            const canEditReply = isReplyAuthor;
            const canDeleteReply = isReplyAuthor || isOwner;
            return (
              <div key={reply.id} className="ws-comment-reply">
                <CommentItem
                  comment={reply}
                  members={members}
                  canEdit={canEditReply}
                  canDelete={canDeleteReply}
                  canResolve={false}
                  isRoot={false}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onResolve={onResolve}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
