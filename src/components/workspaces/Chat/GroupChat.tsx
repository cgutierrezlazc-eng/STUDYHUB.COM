/**
 * Chat grupal del workspace.
 *
 * Carga historial al montar. Soporta envío de mensajes con Enter
 * (Shift+Enter = newline). Optimistic update: inserta mensaje localmente
 * con status 'sending' antes de recibir ACK del servidor.
 *
 * Recibe mensajes remotos vía prop onNewMessage (llamada desde WorkspaceEditor
 * cuando el WS emite type='chat.message').
 *
 * Props:
 *   docId         ID del workspace/documento.
 *   members       Lista de miembros (para resolver nombres/avatares).
 *   currentUser   {userId, name} del usuario actual.
 *   isConnected   Si false, el input se deshabilita con mensaje de estado.
 *   onNewMessage  Callback (opcional) para recibir mensajes remotos desde el provider.
 *
 * Bloque 2b Colaboración.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkspaceMember, WorkspaceMessage } from '../../../../shared/workspaces-types';
import {
  listChatMessages,
  sendChatMessage,
  deleteChatMessage,
} from '../../../services/workspacesApi';
import MessageList from './MessageList';

interface GroupChatProps {
  docId: string;
  members: WorkspaceMember[];
  currentUser: {
    userId: string;
    name: string;
  };
  isConnected: boolean;
  /** Agrega un mensaje remoto recibido vía WS (llamado desde WorkspaceEditor). */
  onNewMessage?: (handler: (msg: WorkspaceMessage) => void) => () => void;
}

let optimisticCounter = 0;
function genOptimisticId(): string {
  optimisticCounter++;
  return `optimistic-${Date.now()}-${optimisticCounter}`;
}

export default function GroupChat({
  docId,
  currentUser,
  isConnected,
  onNewMessage,
}: GroupChatProps) {
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Cargar historial al montar ────────────────────────────────────
  useEffect(() => {
    setLoadError(null);
    listChatMessages(docId, { limit: 50 })
      .then(({ messages: fetched }) => {
        // Normalizar nombres de campo (API usa snake_case, tipo TS usa camelCase)
        const normalized = fetched.map((m) => ({
          ...m,
          workspaceId: m.workspaceId ?? (m as unknown as Record<string, string>)['workspace_id'],
          userId: m.userId ?? (m as unknown as Record<string, string>)['user_id'],
          createdAt: m.createdAt ?? (m as unknown as Record<string, string>)['created_at'],
        }));
        setMessages(normalized);
      })
      .catch((err: Error) => {
        setLoadError(err.message);
      });
  }, [docId]);

  // ── Suscribir a mensajes remotos vía WS ───────────────────────────
  useEffect(() => {
    if (!onNewMessage) return;
    const unsubscribe = onNewMessage((msg) => {
      setMessages((prev) => {
        // Si es ACK de un mensaje optimista, reemplazarlo
        const optimisticIdx = prev.findIndex(
          (m) => m.status === 'sending' && m.content === msg.content
        );
        if (optimisticIdx >= 0) {
          const updated = [...prev];
          updated[optimisticIdx] = { ...msg, status: 'sent' };
          return updated;
        }
        // Mensaje nuevo de otro usuario
        return [...prev, { ...msg, status: 'sent' }];
      });
    });
    return unsubscribe;
  }, [onNewMessage]);

  // ── Enviar mensaje ────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content || !isConnected) return;

    const optimisticId = genOptimisticId();
    const optimisticMsg: WorkspaceMessage = {
      id: optimisticId,
      workspaceId: docId,
      userId: currentUser.userId,
      content,
      createdAt: new Date().toISOString(),
      status: 'sending',
      user: { id: currentUser.userId, name: currentUser.name, avatar: null },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue('');

    sendChatMessage(docId, content)
      .then((serverMsg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  ...serverMsg,
                  workspaceId:
                    serverMsg.workspaceId ??
                    (serverMsg as unknown as Record<string, string>)['workspace_id'],
                  userId:
                    serverMsg.userId ?? (serverMsg as unknown as Record<string, string>)['user_id'],
                  createdAt:
                    serverMsg.createdAt ??
                    (serverMsg as unknown as Record<string, string>)['created_at'],
                  status: 'sent' as const,
                }
              : m
          )
        );
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' as const } : m))
        );
      });
  }, [inputValue, isConnected, docId, currentUser]);

  // ── Eliminar mensaje ──────────────────────────────────────────────
  const handleDelete = useCallback(
    (msgId: string) => {
      // Optimistic remove
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      deleteChatMessage(docId, msgId).catch(() => {
        // Si falla, recargar para restaurar estado
        listChatMessages(docId, { limit: 50 })
          .then(({ messages: refreshed }) => setMessages(refreshed))
          .catch(() => {});
      });
    },
    [docId]
  );

  // ── Keyboard handler ──────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="ws-chat" aria-label="Chat del grupo">
      <div className="ws-chat-header">
        <span className="ws-chat-title">Chat del grupo</span>
        {!isConnected && (
          <span className="ws-chat-offline-badge" aria-live="polite">
            Sin conexión
          </span>
        )}
      </div>

      {loadError && (
        <p className="ws-chat-error" role="alert">
          Error al cargar mensajes: {loadError}
        </p>
      )}

      <div className="ws-chat-messages-area">
        <MessageList
          messages={messages}
          currentUserId={currentUser.userId}
          onDelete={handleDelete}
        />
      </div>

      <div className="ws-chat-input-area">
        <textarea
          ref={inputRef}
          className="ws-chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Escribe un mensaje... (Enter para enviar)' : 'Sin conexión'}
          disabled={!isConnected}
          rows={2}
          maxLength={2000}
          aria-label="Mensaje"
          aria-disabled={!isConnected}
        />
        <button
          type="button"
          className="ws-btn ws-btn--primary ws-btn--sm ws-chat-send-btn"
          onClick={handleSend}
          disabled={!isConnected || !inputValue.trim()}
          aria-label="Enviar mensaje"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
