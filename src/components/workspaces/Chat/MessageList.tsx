/**
 * Lista de mensajes del chat grupal.
 * Scroll invertido (más reciente abajo). Agrupa mensajes consecutivos
 * del mismo autor si están en menos de 2 minutos de diferencia.
 *
 * Props:
 *   messages      Lista de mensajes en orden cronológico ascendente.
 *   currentUserId ID del usuario actual (para mostrar botón de eliminar).
 *   onDelete      Callback invocado con el id del mensaje al eliminar.
 *
 * Bloque 2b Colaboración.
 */

import React, { useEffect, useRef } from 'react';
import type { WorkspaceMessage } from '../../../../shared/workspaces-types';
import { getAuthorColor } from '../authorColors';

const TWO_MINUTES_MS = 2 * 60 * 1000;

interface MessageListProps {
  messages: WorkspaceMessage[];
  currentUserId: string;
  onDelete: (msgId: string) => void;
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function isGroupedWithPrevious(
  current: WorkspaceMessage,
  previous: WorkspaceMessage | undefined
): boolean {
  if (!previous) return false;
  if (current.userId !== previous.userId) return false;
  const diffMs = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
  return diffMs < TWO_MINUTES_MS;
}

export default function MessageList({ messages, currentUserId, onDelete }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje cuando llegan nuevos
  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <ul className="ws-chat-message-list" aria-label="Mensajes del chat grupal" role="list">
      {messages.length === 0 && (
        <li className="ws-chat-empty" aria-live="polite">
          <span>Aún no hay mensajes. ¡Sé el primero en escribir!</span>
        </li>
      )}

      {messages.map((msg, index) => {
        const prev = index > 0 ? messages[index - 1] : undefined;
        const grouped = isGroupedWithPrevious(msg, prev);
        const isOwn = msg.userId === currentUserId;
        const authorName = msg.user?.name ?? msg.userId;
        const authorColor = getAuthorColor(msg.userId);

        return (
          <li
            key={msg.id}
            className={[
              'ws-chat-msg',
              isOwn ? 'ws-chat-msg--own' : '',
              grouped ? 'ws-chat-msg--grouped' : '',
              msg.status === 'sending' ? 'ws-chat-msg--sending' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-status={msg.status ?? 'sent'}
          >
            {!grouped && (
              <div className="ws-chat-msg-header">
                <span
                  className="ws-chat-msg-avatar"
                  style={{ backgroundColor: authorColor }}
                  aria-hidden="true"
                >
                  {authorName.charAt(0).toUpperCase()}
                </span>
                <span className="ws-chat-msg-author">{authorName}</span>
                <time className="ws-chat-msg-time" dateTime={msg.createdAt} title={msg.createdAt}>
                  {formatTime(msg.createdAt)}
                </time>
              </div>
            )}

            <div className="ws-chat-msg-body">
              <p className="ws-chat-msg-text">{msg.content}</p>

              {msg.status === 'sending' && (
                <span className="ws-chat-msg-status-indicator" aria-label="Enviando...">
                  •••
                </span>
              )}

              {isOwn && msg.status !== 'sending' && (
                <button
                  type="button"
                  className="ws-chat-msg-delete"
                  onClick={() => onDelete(msg.id)}
                  aria-label={`Eliminar mensaje: ${msg.content.slice(0, 30)}`}
                >
                  Eliminar
                </button>
              )}
            </div>
          </li>
        );
      })}

      {/* Ancla para auto-scroll */}
      <div ref={bottomRef} aria-hidden="true" />
    </ul>
  );
}
