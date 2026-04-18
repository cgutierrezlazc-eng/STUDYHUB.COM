/**
 * Toolbar fija del editor de Workspaces.
 * Botones: Bold, Italic, Underline, H1/H2/H3, Lista bullet, Lista numerada,
 * Link, Undo, Redo.
 *
 * Los atajos de teclado estándar (Ctrl+B, Ctrl+I, Ctrl+U) los maneja
 * Lexical automáticamente — la toolbar solo provee los botones visuales.
 *
 * Bloque 2a Fundación. Toolbar fija (no flotante).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  TextFormatType,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({
  onClick,
  active = false,
  title,
  children,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      className={`ws-toolbar-btn${active ? ' ws-toolbar-btn--active' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      type="button"
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export default function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(updateToolbar);
    });
  }, [editor, updateToolbar]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const setHeading = (tag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const setQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const insertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  return (
    <div
      className="ws-toolbar"
      data-testid="workspace-toolbar"
      role="toolbar"
      aria-label="Herramientas de formato"
    >
      {/* Deshacer / Rehacer */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Deshacer (Ctrl+Z)"
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Rehacer (Ctrl+Shift+Z)"
      >
        ↪
      </ToolbarButton>

      <span className="ws-toolbar-sep" aria-hidden="true" />

      {/* Formato de texto */}
      <ToolbarButton onClick={() => formatText('bold')} active={isBold} title="Negrita (Ctrl+B)">
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('italic')}
        active={isItalic}
        title="Cursiva (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('underline')}
        active={isUnderline}
        title="Subrayado (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarButton>

      <span className="ws-toolbar-sep" aria-hidden="true" />

      {/* Encabezados */}
      <ToolbarButton onClick={() => setHeading('h1')} title="Título H1">
        H1
      </ToolbarButton>
      <ToolbarButton onClick={() => setHeading('h2')} title="Título H2">
        H2
      </ToolbarButton>
      <ToolbarButton onClick={() => setHeading('h3')} title="Título H3">
        H3
      </ToolbarButton>
      <ToolbarButton onClick={setQuote} title="Cita">
        ❝
      </ToolbarButton>

      <span className="ws-toolbar-sep" aria-hidden="true" />

      {/* Listas */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        title="Lista con viñetas"
      >
        •—
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        title="Lista numerada"
      >
        1—
      </ToolbarButton>

      <span className="ws-toolbar-sep" aria-hidden="true" />

      {/* Enlace */}
      <ToolbarButton onClick={insertLink} title="Insertar enlace">
        🔗
      </ToolbarButton>
    </div>
  );
}
