/**
 * Configuración base del editor Lexical para Workspaces.
 * Lista de nodos, namespace y handler de errores.
 *
 * Bloque 2a Fundación. Sin Math, APA, TOC (son 2c/2d).
 *
 * NOTA DE COLABORACIÓN (bloque 2b):
 * Cuando el editor se usa con Yjs (CollaborationPlugin), el namespace debe
 * ser único por documento: "conniku-ws-{docId}".
 * Yjs usa el namespace como clave del mapa de documentos (yjsDocMap).
 * Si dos documentos usan el mismo namespace en tabs distintas, interferirán.
 * Ver decisión D7 del plan 2b y riesgo 5.7.
 *
 * Uso correcto en WorkspaceEditor.tsx:
 *   namespace={`conniku-ws-${id}`}
 */

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import editorTheme from './editorTheme';
import { MathNode } from './MathNode';

export function getEditorConfig(namespace = 'conniku-workspace'): InitialConfigType {
  return {
    namespace,
    theme: editorTheme,
    // MathNode agregado en bloque 2d.3. Retrocompatible: documentos sin MathNode abren sin error.
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, MathNode],
    onError: (error: Error) => {
      // En desarrollo logueamos para debug; en producción no se expone al usuario
      if (import.meta.env.DEV) {
        console.error('[LexicalEditor] Error interno del editor:', error);
      }
    },
  };
}
