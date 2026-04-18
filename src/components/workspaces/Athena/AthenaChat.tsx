/**
 * AthenaChat — Chat privado con Athena dentro del panel Athena.
 *
 * Lista de mensajes + input + botón Enviar (Enter envía, Shift+Enter = newline).
 * Optimistic update: el mensaje del usuario aparece de inmediato.
 * Historial recortado a últimos 10 mensajes al enviar al backend (paridad con d0c0e49).
 * Error 429 con code=athena-quota → llama onQuotaExceeded.
 * Botón "Limpiar conversación" con confirm antes de borrar.
 *
 * Bloque 2c Athena IA.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AthenaChatMessage } from '../../../../shared/workspaces-types';
import { athenaChat, deleteAthenaChats, AthenaQuotaError } from '../../../services/workspacesApi';
import { renderAthenaMarkdown } from './renderAthenaMarkdown';
import styles from './AthenaPanel.module.css';

interface AthenaChatProps {
  docId: string;
  currentUser: {
    userId: string;
    name: string;
  };
  initialChats: AthenaChatMessage[];
  onQuotaExceeded: () => void;
}

const WELCOME_MSG: AthenaChatMessage = {
  id: '__welcome__',
  role: 'athena',
  content:
    '¡Hola! Soy Athena, tu compañera de redacción y experta académica. ¿En qué te puedo ayudar con este documento?',
  createdAt: new Date().toISOString(),
};

export default function AthenaChat({
  docId,
  initialChats,
  onQuotaExceeded,
}: AthenaChatProps): React.ReactElement {
  const [messages, setMessages] = useState<AthenaChatMessage[]>(
    initialChats.length > 0 ? initialChats : [WELCOME_MSG]
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll al fondo cuando llegan mensajes nuevos
  // scrollIntoView puede no existir en entornos de prueba (jsdom)
  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const optimisticMsg: AthenaChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setInput('');
    setMessages((prev) => [...prev, optimisticMsg]);
    setSending(true);

    try {
      // Historial recortado a últimos 10 (sin el mensaje de bienvenida local)
      const history = messages.filter((m) => m.id !== '__welcome__').slice(-10);

      const res = await athenaChat(docId, text, history);

      const athenaMsg: AthenaChatMessage = {
        id: `athena-${Date.now()}`,
        role: 'athena',
        content: res.result,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, athenaMsg]);
    } catch (err) {
      const isQuota =
        err instanceof AthenaQuotaError ||
        (err instanceof Error && (err as Error & { code?: string }).code === 'athena-quota');
      if (isQuota) {
        onQuotaExceeded();
        // Retirar el mensaje optimista si no se pudo enviar
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      } else {
        // Mostrar error como mensaje de Athena
        const errorMsg: AthenaChatMessage = {
          id: `error-${Date.now()}`,
          role: 'athena',
          content: 'Lo siento, tuve un problema al responder. Por favor intenta de nuevo.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id).concat(errorMsg));
      }
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    const confirmed = window.confirm(
      '¿Seguro que quieres limpiar toda la conversación con Athena en este documento?'
    );
    if (!confirmed) return;

    await deleteAthenaChats(docId);
    setMessages([WELCOME_MSG]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div
        className={styles.chatMessages}
        role="log"
        aria-live="polite"
        aria-label="Conversación con Athena"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgAthena}`}
          >
            {msg.role === 'athena' ? (
              <span dangerouslySetInnerHTML={{ __html: renderAthenaMarkdown(msg.content) }} />
            ) : (
              <span>{msg.content}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.chatInputRow}>
        <textarea
          className={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          aria-label="Mensaje para Athena"
          rows={1}
          disabled={sending}
        />
        <button
          type="button"
          className={styles.chatSendBtn}
          onClick={() => void handleSend()}
          disabled={sending || !input.trim()}
          aria-label="Enviar mensaje"
        >
          Enviar
        </button>
      </div>

      <button
        type="button"
        className={styles.chatClearBtn}
        onClick={() => void handleClear()}
        aria-label="Limpiar conversación"
      >
        Limpiar conversación
      </button>
    </div>
  );
}
