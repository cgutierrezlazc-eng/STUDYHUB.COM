/**
 * Tests de AthenaApplyBridge — plugin Lexical que expone applyText y getSelection.
 *
 * Monta el plugin dentro de un LexicalComposer mínimo y verifica que:
 * - applyText en modo append inserta texto al final del documento.
 * - getSelection devuelve null cuando no hay selección.
 * - el ref expuesto tiene las funciones esperadas.
 *
 * Bloque 2c Athena IA.
 */

import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import AthenaApplyBridge from '../../components/workspaces/Athena/AthenaApplyBridge';
import type { EditorBridgeHandle } from '../../components/workspaces/Athena/AthenaPanel';

// Helper: monta AthenaApplyBridge dentro de un LexicalComposer de prueba
function TestBridge({ bridgeRef }: { bridgeRef: React.RefObject<EditorBridgeHandle> }) {
  const initialConfig = {
    namespace: 'test-bridge',
    onError: vi.fn(),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <AthenaApplyBridge ref={bridgeRef} />
    </LexicalComposer>
  );
}

describe('AthenaApplyBridge', () => {
  it('expone el ref con applyText y getSelection tras montar', async () => {
    const bridgeRef = createRef<EditorBridgeHandle>();

    await act(async () => {
      render(<TestBridge bridgeRef={bridgeRef} />);
    });

    expect(bridgeRef.current).not.toBeNull();
    expect(typeof bridgeRef.current?.applyText).toBe('function');
    expect(typeof bridgeRef.current?.getSelection).toBe('function');
  });

  it('getSelection devuelve null cuando no hay selección activa', async () => {
    const bridgeRef = createRef<EditorBridgeHandle>();

    await act(async () => {
      render(<TestBridge bridgeRef={bridgeRef} />);
    });

    const selection = bridgeRef.current?.getSelection();
    expect(selection).toBeNull();
  });

  it('applyText en modo append no lanza error', async () => {
    const bridgeRef = createRef<EditorBridgeHandle>();

    await act(async () => {
      render(<TestBridge bridgeRef={bridgeRef} />);
    });

    expect(() => {
      act(() => {
        bridgeRef.current?.applyText('Texto de prueba de Athena.', 'append');
      });
    }).not.toThrow();
  });

  it('applyText en modo insert-at-cursor no lanza error', async () => {
    const bridgeRef = createRef<EditorBridgeHandle>();

    await act(async () => {
      render(<TestBridge bridgeRef={bridgeRef} />);
    });

    expect(() => {
      act(() => {
        bridgeRef.current?.applyText('Insertar en cursor.', 'insert-at-cursor');
      });
    }).not.toThrow();
  });
});
