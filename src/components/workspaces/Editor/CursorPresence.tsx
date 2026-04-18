/**
 * Plugin de cursores remotos "Figma-style" para el editor colaborativo.
 *
 * Consume el awareness de Yjs para obtener la posición y metadatos de los
 * cursores de otros usuarios. Renderiza una barra vertical de color + label
 * con el nombre del usuario flotante encima del cursor.
 *
 * Este componente debe montarse dentro de un LexicalComposer.
 * Su renderizado es un overlay DOM sobre el editor.
 *
 * Nota: la posición real del cursor en píxeles la calculan las
 * SelectionPlugin/CursorPlugin de @lexical/yjs. Este componente es
 * un complemento visual para el label flotante de nombre.
 *
 * Bloque 2b Colaboración.
 */

import React, { useEffect, useState } from 'react';
import type { WebsocketProvider } from 'y-websocket';
import { getAuthorColor } from '../authorColors';

interface RemoteUser {
  userId: string;
  name: string;
  color: string;
  avatar?: string | null;
}

interface CursorPresenceProps {
  awareness: WebsocketProvider['awareness'];
}

export default function CursorPresence({ awareness }: CursorPresenceProps) {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    function updateUsers() {
      const states = awareness.getStates();
      const users: RemoteUser[] = [];

      states.forEach((state, clientId) => {
        // Excluir el cliente local (clientId propio)
        if (clientId === awareness.clientID) return;
        if (!state?.user) return;

        const u = state.user as {
          userId?: string;
          name?: string;
          color?: string;
          avatar?: string | null;
        };
        if (!u.userId) return;

        users.push({
          userId: u.userId,
          name: u.name ?? u.userId,
          color: u.color ?? getAuthorColor(u.userId),
          avatar: u.avatar ?? null,
        });
      });

      setRemoteUsers(users);
    }

    updateUsers();
    awareness.on('change', updateUsers);

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  if (remoteUsers.length === 0) return null;

  return (
    <div className="ws-cursor-presence" aria-hidden="true" aria-label="Cursores de otros usuarios">
      {remoteUsers.map((user) => (
        <div
          key={user.userId}
          className="ws-cursor-label"
          style={
            {
              '--cursor-color': user.color,
            } as React.CSSProperties
          }
        >
          <span className="ws-cursor-label__avatar" style={{ backgroundColor: user.color }}>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="ws-cursor-label__name">{user.name}</span>
        </div>
      ))}
    </div>
  );
}
