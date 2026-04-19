/**
 * CommentInput — textarea con autocomplete de menciones @.
 *
 * Comportamiento:
 * - Al detectar @ al tipear, muestra dropdown con miembros filtrados.
 * - Al seleccionar un miembro del dropdown, inserta @username en el texto.
 * - Enter envía el comentario (llama onSubmit).
 * - Shift+Enter inserta salto de línea sin enviar.
 * - No envía si el contenido está vacío.
 *
 * Props:
 * - members: lista de miembros del workspace para el autocomplete.
 * - placeholder: texto del placeholder del textarea.
 * - onSubmit: callback(content) al enviar.
 * - initialValue: valor inicial del textarea (para edición).
 *
 * Sub-bloque 2d.8 Comentarios inline + Menciones.
 */

import React, { useState, useRef, useCallback } from 'react';
import type { WorkspaceMember } from '../../../../shared/workspaces-types';

/** Convierte un nombre completo en username para menciones (@nombre). */
function nameToUsername(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .toLowerCase()
    .split(' ')[0]; // solo el primer nombre
}

interface CommentInputProps {
  members: WorkspaceMember[];
  placeholder: string;
  onSubmit: (content: string) => void;
  initialValue?: string;
}

export default function CommentInput({
  members,
  placeholder,
  onSubmit,
  initialValue = '',
}: CommentInputProps) {
  const [value, setValue] = useState(initialValue);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Filtra los miembros según el texto después del @ */
  const filteredMembers: WorkspaceMember[] =
    mentionQuery !== null
      ? members.filter((m) => {
          const name = m.user?.name ?? '';
          const username = nameToUsername(name);
          const query = mentionQuery.toLowerCase();
          return name.toLowerCase().includes(query) || username.startsWith(query);
        })
      : [];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);

    // Detectar si el cursor está después de un @ sin espacio
    const cursorPos = e.target.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowDropdown(true);
    } else {
      setMentionQuery(null);
      setShowDropdown(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          onSubmit(trimmed);
          setValue('');
          setShowDropdown(false);
          setMentionQuery(null);
        }
      }
    },
    [value, onSubmit]
  );

  const handleSelectMember = useCallback(
    (member: WorkspaceMember) => {
      const name = member.user?.name ?? '';
      const username = nameToUsername(name);
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart ?? value.length;
      const textBeforeCursor = value.slice(0, cursorPos);
      const textAfterCursor = value.slice(cursorPos);

      // Reemplazar el @query por @username
      const newTextBefore = textBeforeCursor.replace(/@(\w*)$/, `@${username} `);
      const newValue = newTextBefore + textAfterCursor;

      setValue(newValue);
      setShowDropdown(false);
      setMentionQuery(null);

      // Reposicionar el cursor después de la mención insertada
      setTimeout(() => {
        if (textarea) {
          const newCursor = newTextBefore.length;
          textarea.setSelectionRange(newCursor, newCursor);
          textarea.focus();
        }
      }, 0);
    },
    [value]
  );

  return (
    <div className="ws-comment-input-wrapper">
      <textarea
        ref={textareaRef}
        className="ws-comment-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={2}
        aria-label={placeholder}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
      />

      {showDropdown && filteredMembers.length > 0 && (
        <ul
          className="ws-comment-mention-dropdown"
          role="listbox"
          aria-label="Miembros para mencionar"
        >
          {filteredMembers.map((member) => {
            const name = member.user?.name ?? member.user_id;
            const username = nameToUsername(name);
            return (
              <li
                key={member.user_id}
                role="option"
                aria-selected={false}
                className="ws-comment-mention-option"
                onMouseDown={(e) => {
                  // mouseDown en lugar de click para que no pierda el focus del textarea
                  e.preventDefault();
                  handleSelectMember(member);
                }}
              >
                <span className="ws-comment-mention-name">{name}</span>
                <span className="ws-comment-mention-username">@{username}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
