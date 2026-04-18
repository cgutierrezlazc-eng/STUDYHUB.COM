/**
 * Barra de contribución de cada miembro del workspace.
 *
 * Muestra una barra horizontal proporcional por miembro, ordenada
 * descendentemente por chars_contributed. El % se calcula sobre el total.
 * Si total === 0, muestra placeholder.
 *
 * El indicador de "online" se determina con el set onlineUserIds:
 * usuarios con estado activo en el awareness de Yjs.
 *
 * Props:
 *   members         Lista completa de miembros con chars_contributed.
 *   onlineUserIds   Set de user_ids actualmente conectados (awareness).
 *
 * Bloque 2b Colaboración.
 */

import React from 'react';
import type { WorkspaceMember } from '../../../../shared/workspaces-types';
import { getAuthorColor } from '../authorColors';

interface MemberContributionBarProps {
  members: WorkspaceMember[];
  onlineUserIds?: Set<string>;
}

export default function MemberContributionBar({
  members,
  onlineUserIds = new Set(),
}: MemberContributionBarProps) {
  const totalChars = members.reduce((sum, m) => sum + m.chars_contributed, 0);

  const sorted = [...members].sort((a, b) => b.chars_contributed - a.chars_contributed);

  return (
    <div className="ws-contribution-bar" aria-label="Contribución de los miembros">
      {totalChars === 0 ? (
        <p className="ws-contribution-bar__empty ws-placeholder-text ws-placeholder-text--muted">
          Aún sin contribuciones.
        </p>
      ) : (
        <ul className="ws-contribution-bar__list" role="list">
          {sorted.map((member) => {
            const name = member.user?.name ?? member.user_id;
            const color = getAuthorColor(member.user_id);
            const pct =
              totalChars > 0 ? Math.round((member.chars_contributed / totalChars) * 100) : 0;
            const isOnline = onlineUserIds.has(member.user_id);

            return (
              <li key={member.id} className="ws-contribution-bar__item">
                <div className="ws-contribution-bar__member">
                  <span
                    className="ws-member-avatar"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>

                  <div className="ws-contribution-bar__meta">
                    <div className="ws-contribution-bar__name-row">
                      <span className="ws-member-name">{name}</span>
                      {isOnline && (
                        <span
                          className="ws-contribution-bar__online-dot"
                          aria-label="En línea"
                          title="En línea"
                        />
                      )}
                    </div>

                    <div
                      className="ws-contribution-bar__track"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${name}: ${pct}% (${member.chars_contributed} caracteres)`}
                    >
                      <div
                        className="ws-contribution-bar__fill"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>

                    <span className="ws-contribution-bar__count">
                      {pct}% · {member.chars_contributed.toLocaleString('es-CL')} car.
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
