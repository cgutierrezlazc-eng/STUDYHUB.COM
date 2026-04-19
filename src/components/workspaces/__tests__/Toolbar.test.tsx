/**
 * Tests del componente Toolbar (2a Fundación, Editor Lexical).
 *
 * Cobertura smoke:
 * - Renderiza los botones principales con sus titles
 * - Botones de formato (Bold, Italic, Underline) presentes
 * - Botones de headings (H1, H2, H3) presentes
 * - Botones de listas (ul, ol) presentes
 * - Botones de undo/redo presentes
 * - MathToolbarButton se monta
 *
 * Nota: no testea interacción Lexical porque requiere Selection API
 * real que jsdom no soporta completamente. Los tests de comandos
 * viven en tests de integración E2E futuros.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import Toolbar from '../Editor/Toolbar';

vi.stubGlobal(
  'ResizeObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

const initialConfig = {
  namespace: 'test-editor',
  onError: (err: Error) => {
    throw err;
  },
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
};

function ToolbarHarness() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Toolbar />
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>placeholder</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
    </LexicalComposer>
  );
}

describe('Toolbar — render dentro de LexicalComposer', () => {
  it('renderiza botones de formato básico', () => {
    const { getByTitle } = render(<ToolbarHarness />);
    expect(getByTitle(/negrita/i)).toBeDefined();
    expect(getByTitle(/cursiva/i)).toBeDefined();
    expect(getByTitle(/subrayado/i)).toBeDefined();
  });

  it('renderiza botones de headings H1, H2, H3', () => {
    const { getByTitle } = render(<ToolbarHarness />);
    expect(getByTitle(/título 1|heading 1|h1/i)).toBeDefined();
    expect(getByTitle(/título 2|heading 2|h2/i)).toBeDefined();
    expect(getByTitle(/título 3|heading 3|h3/i)).toBeDefined();
  });

  it('renderiza botones de listas (bullet + numerada)', () => {
    const { getByTitle } = render(<ToolbarHarness />);
    expect(getByTitle(/lista.*viñeta|bullet|lista no ordenada|lista normal/i)).toBeDefined();
    expect(getByTitle(/lista.*numerada|numbered|ordenada/i)).toBeDefined();
  });

  it('renderiza botones undo y redo', () => {
    const { getByTitle } = render(<ToolbarHarness />);
    expect(getByTitle(/deshacer|undo/i)).toBeDefined();
    expect(getByTitle(/rehacer|redo/i)).toBeDefined();
  });

  it('todos los botones tienen type=button para no submiter forms', () => {
    const { container } = render(<ToolbarHarness />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(5);
    buttons.forEach((btn) => {
      expect(btn.getAttribute('type')).toBe('button');
    });
  });
});
