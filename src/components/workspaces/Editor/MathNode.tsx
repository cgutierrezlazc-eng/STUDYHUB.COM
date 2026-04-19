/**
 * MathNode — Nodo Decorator Lexical para ecuaciones LaTeX.
 *
 * Representa una ecuación matemática (inline o en bloque) dentro del editor.
 * El render visual lo hace MathRenderer (KaTeX vía dangerouslySetInnerHTML).
 *
 * Serializable por @lexical/yjs (no guarda referencias DOM ni React refs).
 * Retrocompatible: importJSON no falla si campos opcionales futuros faltan.
 *
 * Bloque 2d.3 KaTeX render LaTeX.
 */

import {
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode,
  type Spread,
  type NodeKey,
  type EditorConfig,
} from 'lexical';
import React from 'react';
import MathRenderer from './MathRenderer';

// ── Tipos de serialización ────────────────────────────────────────────────────

export type SerializedMathNode = Spread<
  {
    type: 'math';
    version: 1;
    latex: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

// ── Clase principal ───────────────────────────────────────────────────────────

export class MathNode extends DecoratorNode<React.ReactElement> {
  __latex: string;
  __inline: boolean;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__latex, node.__inline, node.__key);
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    const { latex, inline } = serializedNode;
    return $createMathNode(latex ?? '', inline ?? false);
  }

  constructor(latex: string, inline: boolean, key?: NodeKey) {
    super(key);
    this.__latex = latex;
    this.__inline = inline;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  getLatex(): string {
    return this.getLatest().__latex;
  }

  getInline(): boolean {
    return this.getLatest().__inline;
  }

  // ── DOM ────────────────────────────────────────────────────────────────────

  createDOM(_config: EditorConfig): HTMLElement {
    if (this.__inline) {
      const el = document.createElement('span');
      el.classList.add('ws-math-inline');
      return el;
    }
    const el = document.createElement('div');
    el.classList.add('ws-math-block');
    return el;
  }

  /**
   * Devuelve false: Lexical recrea el DOM cada vez que el nodo cambia.
   * Con DecoratorNode el render real lo hace el componente React retornado
   * por decorate(), no necesitamos actualización incremental del DOM.
   */
  updateDOM(_prevNode: MathNode, _dom: HTMLElement, _config: EditorConfig): boolean {
    return false;
  }

  // ── Serialización ─────────────────────────────────────────────────────────

  exportJSON(): SerializedMathNode {
    return {
      type: 'math',
      version: 1,
      latex: this.__latex,
      inline: this.__inline,
    };
  }

  // ── Decorator ─────────────────────────────────────────────────────────────

  decorate(): React.ReactElement {
    return <MathRenderer latex={this.__latex} inline={this.__inline} />;
  }

  // ── Texto serializado (accesibilidad y copy-paste) ────────────────────────

  isInline(): boolean {
    return this.__inline;
  }
}

// ── Helpers de factory ────────────────────────────────────────────────────────

export function $createMathNode(latex: string, inline: boolean): MathNode {
  return new MathNode(latex, inline);
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
