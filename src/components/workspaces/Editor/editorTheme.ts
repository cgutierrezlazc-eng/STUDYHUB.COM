/**
 * Theme de Lexical para el editor de Workspaces.
 * Usa CSS vars de Conniku para respetar los 6 temas del proyecto.
 * No usa colores hardcoded.
 *
 * Bloque 2a Fundación.
 */

import type { EditorThemeClasses } from 'lexical';

const editorTheme: EditorThemeClasses = {
  root: 'ws-editor-root',
  paragraph: 'ws-editor-paragraph',
  text: {
    bold: 'ws-editor-text-bold',
    italic: 'ws-editor-text-italic',
    underline: 'ws-editor-text-underline',
    strikethrough: 'ws-editor-text-strikethrough',
    code: 'ws-editor-text-code',
  },
  heading: {
    h1: 'ws-editor-h1',
    h2: 'ws-editor-h2',
    h3: 'ws-editor-h3',
  },
  list: {
    ul: 'ws-editor-ul',
    ol: 'ws-editor-ol',
    listitem: 'ws-editor-listitem',
    nested: {
      listitem: 'ws-editor-nested-listitem',
    },
  },
  link: 'ws-editor-link',
  quote: 'ws-editor-quote',
  code: 'ws-editor-code',
};

export default editorTheme;
