/**
 * Editor principal de Workspaces basado en Lexical (Meta).
 * Plugins activos en 2a: RichText, History, List, Link, AutoFocus, OnChange.
 * Sin Yjs (2b), sin Math/APA/TOC (2d), sin Athena (2c).
 *
 * Bloque 2a Fundación.
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import type { EditorState } from 'lexical';
import { getEditorConfig } from './editorConfig';
import Toolbar from './Toolbar';

interface LexicalEditorProps {
  /** Callback invocado en cada cambio del estado del editor */
  onChange: (editorState: EditorState) => void;
  /** Contenido inicial serializado (JSON de EditorState) */
  initialContent?: string;
  /** Placeholder visible cuando el editor está vacío */
  placeholder?: string;
  /** Clase CSS adicional para el wrapper externo */
  className?: string;
  /** Namespace del editor (útil para múltiples instancias) */
  namespace?: string;
  /** Si es true, el editor es de solo lectura */
  readOnly?: boolean;
}

export default function LexicalEditor({
  onChange,
  placeholder = 'Comienza a escribir tu documento...',
  className = '',
  namespace = 'conniku-workspace',
  readOnly = false,
}: LexicalEditorProps) {
  const initialConfig = {
    ...getEditorConfig(namespace),
    editable: !readOnly,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`ws-editor-wrapper${className ? ` ${className}` : ''}`}>
        {!readOnly && <Toolbar />}
        <div className="ws-editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="ws-editor-content" aria-label="Contenido del documento" />
            }
            placeholder={
              <div className="ws-editor-placeholder" aria-hidden="true">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}
