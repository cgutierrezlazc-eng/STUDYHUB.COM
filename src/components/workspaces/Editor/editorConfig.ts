/**
 * Configuración base del editor Lexical para Workspaces.
 * Lista de nodos, namespace y handler de errores.
 *
 * Bloque 2a Fundación. Sin Math, APA, TOC ni Yjs (son 2b/2c/2d).
 */

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import editorTheme from './editorTheme';

export function getEditorConfig(namespace = 'conniku-workspace'): InitialConfigType {
  return {
    namespace,
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    onError: (error: Error) => {
      // En desarrollo logueamos para debug; en producción no se expone al usuario
      if (import.meta.env.DEV) {
        console.error('[LexicalEditor] Error interno del editor:', error);
      }
    },
  };
}
