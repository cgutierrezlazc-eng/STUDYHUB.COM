/**
 * MathToolbarButton — botón Σ en la toolbar del editor.
 *
 * Abre un prompt simple pidiendo una ecuación LaTeX.
 * Detecta si el usuario escribe $...$$ o $$...$$ para determinar modo.
 * Si no usa prefijo, asume inline. Dispatch INSERT_MATH_COMMAND.
 *
 * UX: prompt() simple por diseño (se mejora en 2d.4 con MathLive visual).
 *
 * Bloque 2d.3 KaTeX render LaTeX.
 */

import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_MATH_COMMAND } from './MathPlugin';

export default function MathToolbarButton(): React.ReactElement {
  const [editor] = useLexicalComposerContext();

  const handleInsertMath = () => {
    const input = window.prompt(
      'Escribe tu ecuación en LaTeX.\n\nEjemplo inline: x^2 + y^2 = r^2\nEjemplo en bloque: empieza con $$ → $$\\int_0^1 x dx\n\nPrefija con $$ para bloque, sin prefijo = inline:'
    );

    if (input === null || input.trim() === '') {
      // Usuario canceló o dejó vacío
      return;
    }

    const trimmed = input.trim();
    let latex: string;
    let inline: boolean;

    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      // Modo bloque: $$...$$ → extrae contenido
      latex = trimmed.slice(2, -2).trim();
      inline = false;
    } else if (trimmed.startsWith('$$')) {
      // Prefijo $$ pero sin cierre → bloque con el resto
      latex = trimmed.slice(2).trim();
      inline = false;
    } else if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 2) {
      // Modo inline con delimitadores: $...$
      latex = trimmed.slice(1, -1).trim();
      inline = true;
    } else {
      // Sin delimitadores → inline por defecto
      latex = trimmed;
      inline = true;
    }

    if (latex === '') {
      return;
    }

    editor.dispatchCommand(INSERT_MATH_COMMAND, { latex, inline });
  };

  return (
    <button
      className="ws-toolbar-btn"
      onClick={handleInsertMath}
      title="Insertar ecuación matemática (LaTeX)"
      type="button"
      aria-label="Insertar ecuación matemática"
    >
      Σ
    </button>
  );
}
