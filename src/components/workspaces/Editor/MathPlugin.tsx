/**
 * MathPlugin — plugin Lexical para ecuaciones LaTeX.
 *
 * Registra MathNode en el editor y expone el comando INSERT_MATH_COMMAND.
 * Soporta inserción de ecuaciones inline ($...$) y en bloque ($$...$$).
 *
 * Bloque 2d.3 KaTeX render LaTeX.
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $createMathNode, MathNode } from './MathNode';

// ── Tipos del comando ──────────────────────────────────────────────────────────

export interface InsertMathPayload {
  latex: string;
  inline: boolean;
}

export const INSERT_MATH_COMMAND: LexicalCommand<InsertMathPayload> =
  createCommand('INSERT_MATH_COMMAND');

// ── Plugin ────────────────────────────────────────────────────────────────────

export default function MathPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Verificar que MathNode está registrado en el editor
    if (!editor.hasNodes([MathNode])) {
      throw new Error(
        'MathPlugin: MathNode no está registrado en el editor. Agrégalo a editorConfig.ts nodes[].'
      );
    }

    // Registrar el comando INSERT_MATH_COMMAND
    const unregister = editor.registerCommand<InsertMathPayload>(
      INSERT_MATH_COMMAND,
      (payload) => {
        const { latex, inline } = payload;
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          // Insertar el nodo MathNode en la posición actual
          const mathNode = $createMathNode(latex, inline);
          $insertNodeToNearestRoot(mathNode);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregister();
    };
  }, [editor]);

  return null;
}
