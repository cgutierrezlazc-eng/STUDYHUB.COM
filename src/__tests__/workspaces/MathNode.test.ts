/**
 * Tests de MathNode (DecoratorNode Lexical para ecuaciones LaTeX).
 * TDD: se escriben primero. Deben fallar hasta que MathNode esté implementado.
 *
 * Criterios:
 * 1. createDOM retorna un elemento span (inline) o div (block)
 * 2. updateDOM devuelve false (Lexical re-crea el DOM cada vez)
 * 3. exportJSON produce la estructura esperada con type 'math'
 * 4. importJSON reconstruye el nodo con los datos correctos
 * 5. $createMathNode crea el nodo con latex e inline correctos
 * 6. Retrocompatibilidad: nodo serializado abre sin crash con campos faltantes
 *
 * Todos los accesos a nodos Lexical deben ocurrir dentro de editor.update()
 * o editor.read() — es una restricción del framework.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditor } from 'lexical';
import type { LexicalEditor } from 'lexical';
import {
  MathNode,
  $createMathNode,
  $isMathNode,
  type SerializedMathNode,
} from '../../components/workspaces/Editor/MathNode';

// ── Helper: editor headless ───────────────────────────────────────────────────

function makeEditor(): LexicalEditor {
  const editor = createEditor({
    namespace: 'test',
    nodes: [MathNode],
    onError: (e) => {
      throw e;
    },
  });
  // Registrar en div headless (jsdom)
  const root = document.createElement('div');
  root.setAttribute('contenteditable', 'true');
  editor.setRootElement(root);
  return editor;
}

// ── Fixture ───────────────────────────────────────────────────────────────────

let editor: LexicalEditor;

beforeEach(() => {
  editor = makeEditor();
});

// ── Tests ────────────────────────────────────────────────────────────────────

// Config mínimo válido según tipos de Lexical (EditorConfig)
const minConfig = { theme: {}, namespace: 'test' };

describe('MathNode — createDOM', () => {
  it('retorna span para modo inline', async () => {
    let tagName = '';
    let hasClass = false;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('x^2', true);
          const dom = node.createDOM(minConfig);
          tagName = dom.tagName.toLowerCase();
          hasClass = dom.classList.contains('ws-math-inline');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(tagName).toBe('span');
    expect(hasClass).toBe(true);
  });

  it('retorna div para modo block', async () => {
    let tagName = '';
    let hasClass = false;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('\\int x dx', false);
          const dom = node.createDOM(minConfig);
          tagName = dom.tagName.toLowerCase();
          hasClass = dom.classList.contains('ws-math-block');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(tagName).toBe('div');
    expect(hasClass).toBe(true);
  });
});

describe('MathNode — updateDOM', () => {
  it('devuelve false (Lexical recrea el DOM siempre)', async () => {
    let result: boolean | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('x^2', true);
          const dom = document.createElement('span');
          result = node.updateDOM(node, dom, minConfig);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(result).toBe(false);
  });
});

describe('MathNode — exportJSON', () => {
  it('exporta tipo "math" con latex e inline', async () => {
    let json: SerializedMathNode | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('\\frac{1}{2}', false);
          json = node.exportJSON();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(json?.type).toBe('math');
    expect(json?.latex).toBe('\\frac{1}{2}');
    expect(json?.inline).toBe(false);
    expect(json?.version).toBe(1);
  });

  it('exporta inline = true correctamente', async () => {
    let json: SerializedMathNode | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('a^2 + b^2', true);
          json = node.exportJSON();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(json?.inline).toBe(true);
    expect(json?.latex).toBe('a^2 + b^2');
  });
});

describe('MathNode — importJSON', () => {
  it('reconstruye nodo con latex e inline desde JSON', async () => {
    let latex = '';
    let inline: boolean | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const json: SerializedMathNode = {
            type: 'math',
            version: 1,
            latex: 'E = mc^2',
            inline: true,
          };
          const node = MathNode.importJSON(json);
          latex = node.getLatex();
          inline = node.getInline();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(latex).toBe('E = mc^2');
    expect(inline).toBe(true);
  });

  it('roundtrip exportJSON → importJSON preserva datos', async () => {
    let restoredLatex = '';
    let restoredInline: boolean | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const original = $createMathNode('\\sum_{i=1}^{n} i', false);
          const json = original.exportJSON();
          const restored = MathNode.importJSON(json);
          restoredLatex = restored.getLatex();
          restoredInline = restored.getInline();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(restoredLatex).toBe('\\sum_{i=1}^{n} i');
    expect(restoredInline).toBe(false);
  });
});

describe('$createMathNode', () => {
  it('crea nodo con los parámetros correctos', async () => {
    let latex = '';
    let inline: boolean | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('\\pi r^2', true);
          latex = node.getLatex();
          inline = node.getInline();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(latex).toBe('\\pi r^2');
    expect(inline).toBe(true);
  });

  it('$isMathNode identifica instancias de MathNode', async () => {
    let result: boolean | undefined;
    await new Promise<void>((resolve, reject) => {
      editor.update(() => {
        try {
          const node = $createMathNode('x', true);
          result = $isMathNode(node);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    expect(result).toBe(true);
  });

  it('$isMathNode retorna false para null', () => {
    // $isMathNode acepta null sin necesitar editor activo
    expect($isMathNode(null)).toBe(false);
  });
});

describe('MathNode — retrocompatibilidad schema', () => {
  it('no lanza si se importa un MathNode con JSON mínimo válido', async () => {
    let threw = false;
    await new Promise<void>((resolve) => {
      editor.update(() => {
        try {
          const minimalJson: SerializedMathNode = {
            type: 'math',
            version: 1,
            latex: 'x',
            inline: false,
          };
          MathNode.importJSON(minimalJson);
        } catch {
          threw = true;
        }
        resolve();
      });
    });
    expect(threw).toBe(false);
  });
});
