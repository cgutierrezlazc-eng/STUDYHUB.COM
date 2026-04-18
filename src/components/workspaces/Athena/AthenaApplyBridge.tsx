/**
 * AthenaApplyBridge — Plugin invisible hijo del LexicalComposer.
 *
 * Expone vía useImperativeHandle un ref con:
 * - applyText(text, mode): inserta texto en el editor Lexical.
 * - getSelection(): devuelve el texto actualmente seleccionado o null.
 *
 * Modos de inserción:
 * - "insert-at-cursor": inserta en la posición del caret (default).
 * - "replace-selection": reemplaza la selección actual; fallback a append.
 * - "append": inserta al final del documento como párrafo nuevo.
 *
 * Bloque 2c Athena IA.
 */

import { forwardRef, useImperativeHandle } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $createParagraphNode,
} from 'lexical';
import type { EditorBridgeHandle } from './AthenaPanel';

const AthenaApplyBridge = forwardRef<EditorBridgeHandle>(function AthenaApplyBridge(_props, ref) {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(ref, () => ({
    applyText(
      text: string,
      mode: 'insert-at-cursor' | 'replace-selection' | 'append' = 'insert-at-cursor'
    ) {
      editor.update(() => {
        const selection = $getSelection();

        if (mode === 'append') {
          // Insertar al final del documento como párrafo nuevo
          const root = $getRoot();
          const paragraphs = text.split('\n').filter((p) => p.trim() !== '');
          for (const para of paragraphs) {
            const paragraphNode = $createParagraphNode();
            paragraphNode.append($createTextNode(para));
            root.append(paragraphNode);
          }
          return;
        }

        if (
          mode === 'replace-selection' &&
          $isRangeSelection(selection) &&
          !selection.isCollapsed()
        ) {
          // Reemplazar selección
          selection.insertText(text);
          return;
        }

        // insert-at-cursor (o fallback desde replace-selection sin selección)
        if ($isRangeSelection(selection)) {
          selection.insertText(text);
        } else {
          // Sin caret — fallback a append
          const root = $getRoot();
          const paragraphs = text.split('\n').filter((p) => p.trim() !== '');
          for (const para of paragraphs) {
            const paragraphNode = $createParagraphNode();
            paragraphNode.append($createTextNode(para));
            root.append(paragraphNode);
          }
        }
      });
    },

    getSelection(): string | null {
      let result: string | null = null;
      editor.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          result = selection.getTextContent();
        }
      });
      return result;
    },
  }));

  return null;
});

export default AthenaApplyBridge;
