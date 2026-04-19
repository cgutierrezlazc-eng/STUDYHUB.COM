/**
 * Editor principal de Workspaces basado en Lexical (Meta).
 *
 * Plugins activos en 2a: RichText, History, List, Link, AutoFocus, OnChange.
 * En 2b: si collaborationConfig está presente, History se reemplaza por
 * CollaborationPlugin de @lexical/yjs (que tiene su propio UndoManager),
 * y se agrega CursorPresence para cursores remotos "Figma-style".
 *
 * La prop collaborationConfig es opcional: sin ella, el editor funciona
 * exactamente igual que en 2a (sin breaking changes).
 *
 * Bloque 2b Colaboración.
 */

import React from 'react';
import type { RefObject } from 'react';
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
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import type { Provider } from '@lexical/yjs';
import type { WebsocketProvider } from 'y-websocket';
import type * as Y from 'yjs';
import CursorPresence from './CursorPresence';
import AthenaApplyBridge from '../Athena/AthenaApplyBridge';
import type { EditorBridgeHandle } from '../Athena/AthenaPanel';

// ─── Tipos de props ───────────────────────────────────────────────────────────

export interface CollaborationConfig {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  awareness: WebsocketProvider['awareness'];
  userMeta: {
    userId: string;
    name: string;
    color?: string;
    avatar?: string;
  };
}

interface LexicalEditorProps {
  /** Callback invocado en cada cambio del estado del editor */
  onChange: (editorState: EditorState) => void;
  /** Contenido inicial serializado (JSON de EditorState) */
  initialContent?: string;
  /** Placeholder visible cuando el editor está vacío */
  placeholder?: string;
  /** Clase CSS adicional para el wrapper externo */
  className?: string;
  /**
   * Namespace del editor.
   * En modo colaboración debe ser único por doc: "conniku-ws-{docId}".
   * Si no se pasa, se usa 'conniku-workspace' (modo solo 2a).
   */
  namespace?: string;
  /** Si es true, el editor es de solo lectura */
  readOnly?: boolean;
  /**
   * Configuración de colaboración Yjs (bloque 2b).
   * Si está presente, se usa CollaborationPlugin y CursorPresence.
   * Si es undefined, el editor funciona como en 2a.
   */
  collaborationConfig?: CollaborationConfig;
  /**
   * Ref al plugin AthenaApplyBridge (bloque 2c).
   * Si está presente, monta el plugin invisible dentro del LexicalComposer.
   * Si es undefined o null, el editor funciona exactamente igual que en 2b.
   */
  athenaBridgeRef?: RefObject<EditorBridgeHandle | null> | null;
}

export default function LexicalEditor({
  onChange,
  placeholder = 'Comienza a escribir tu documento...',
  className = '',
  namespace = 'conniku-workspace',
  readOnly = false,
  collaborationConfig,
  athenaBridgeRef,
}: LexicalEditorProps) {
  const initialConfig = {
    ...getEditorConfig(namespace),
    editable: !readOnly,
  };

  const isCollaborative = !!collaborationConfig;

  // ── providerFactory para CollaborationPlugin ──────────────────────
  function providerFactory(_id: string, yjsDocMap: Map<string, Y.Doc>): Provider {
    if (!collaborationConfig) {
      throw new Error('collaborationConfig es requerido en modo colaborativo');
    }
    yjsDocMap.set(_id, collaborationConfig.ydoc);
    return collaborationConfig.provider as unknown as Provider;
  }

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

          {/* HistoryPlugin solo en modo no-colaborativo.
              En modo colaborativo, @lexical/yjs instancia su propio UndoManager. */}
          {!isCollaborative && <HistoryPlugin />}

          {/* CollaborationPlugin en modo colaborativo */}
          {isCollaborative && collaborationConfig && (
            <CollaborationPlugin
              id={namespace}
              providerFactory={providerFactory}
              username={collaborationConfig.userMeta.name}
              cursorColor={collaborationConfig.userMeta.color ?? '#A855F7'}
              shouldBootstrap={false}
            />
          )}

          {/* Cursores remotos "Figma-style" */}
          {isCollaborative && collaborationConfig && (
            <CursorPresence awareness={collaborationConfig.awareness} />
          )}

          <ListPlugin />
          <LinkPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin onChange={onChange} />

          {/* Plugin Athena (bloque 2c): montado solo si athenaBridgeRef viene en props */}
          {athenaBridgeRef != null && (
            <AthenaApplyBridge ref={athenaBridgeRef as RefObject<EditorBridgeHandle>} />
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}
